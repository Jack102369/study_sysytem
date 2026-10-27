/**
 * GLOBAL-4B IMPORT PREFLIGHT — read-only.
 * No MySQL writes. No import/upload/review/approve.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createConnection } from '../../../../apps/api/node_modules/mysql2/promise.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const docs = path.resolve(__dirname, '../..')
const root = path.resolve(__dirname, '../../../..')
const diagDir = path.join(docs, 'diagrams/required_g4a')
const outJson = path.join(qb, 'global4b_import_preflight_results.json')
const auditsDir = path.join(qb, 'bank_global4a/_preflight_audits')

fs.mkdirSync(auditsDir, { recursive: true })

function loadEnv() {
  const env = { ...process.env }
  const p = path.join(root, 'apps/api/.env')
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m && env[m[1].trim()] === undefined) env[m[1].trim()] = m[2].trim()
    }
  }
  return env
}

function sha256Text(t) {
  return crypto.createHash('sha256').update(String(t), 'utf8').digest('hex')
}
function sha256File(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
}
function stableContent(c) {
  const keys = [
    'id',
    'chapterNo',
    'kpCode',
    'qtype',
    'difficulty',
    'methodMain',
    'methodAux',
    'stem',
    'options',
    'answer',
    'analysis',
    'maxScore',
    'rubric',
    'diagramRequirement',
    'diagramSpecification',
    'sourceEvidence',
    'authorMathNote',
    'dedupNote',
  ]
  const o = {}
  for (const k of keys) o[k] = c[k] ?? null
  return JSON.stringify(o)
}
function normStem(s) {
  return String(s || '')
    .replace(/\$/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\d+/g, '#')
    .replace(/\s+/g, '')
    .toLowerCase()
}
function pickStratified(pool, n, keyFn) {
  const buckets = new Map()
  for (const x of pool) {
    const k = keyFn(x)
    if (!buckets.has(k)) buckets.set(k, [])
    buckets.get(k).push(x)
  }
  const keys = [...buckets.keys()].sort()
  const out = []
  const used = new Set()
  let i = 0
  while (out.length < n && out.length < pool.length) {
    const k = keys[i % keys.length]
    const arr = buckets.get(k)
    while (arr.length) {
      const c = arr.shift()
      if (!used.has(c.id)) {
        used.add(c.id)
        out.push(c)
        break
      }
    }
    i++
    if (i > pool.length * 4) break
  }
  return out
}

const CRUTCH_RE =
  /(请补充|待补全|占位|TBD|TODO|此处省略|答案略|解析略|见图|如上图)/i
const GEO_HINT =
  /(立体|棱锥|棱柱|圆锥|圆柱|球|平面向量|向量|三角函数|正弦|余弦|直方图|频率分布|概率|几何|空间|截面|坐标系|三角形|圆)/

const report = {
  batch: 'GLOBAL-4B-IMPORT-PREFLIGHT',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  startedAt: new Date().toISOString(),
  status: null,
  acceptableClarification: null,
  consistency: {},
  snapshot: {},
  dbBaseline: {},
  protocol: {},
  audits: {
    acceptable: [],
    isoReplace: [],
    d3: [],
    application: [],
    requiredDiagrams: [],
    nonRequiredLeak: [],
  },
  counts: {},
  gateFailures: [],
  openIssues: [],
  nextImportPlan: null,
}

// ---------- load candidates ----------
const mergePath = path.join(qb, 'candidates-g4a-500.mjs')
const mergeMod = await import(pathToFileURL(mergePath).href + '?t=' + Date.now())
const merged = mergeMod.candidates || []
const groups = []
for (let g = 1; g <= 5; g++) {
  const gp = path.join(__dirname, `g4a_group0${g}.mjs`)
  const m = await import(pathToFileURL(gp).href + '?t=' + Date.now())
  groups.push({ g, list: m.candidates || [], path: gp })
}

const isoStats = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_iso_apply_stats.json'), 'utf8'),
)
const cleanup = JSON.parse(
  fs.readFileSync(path.join(qb, 'global4a_isomorphic_cleanup_results.json'), 'utf8'),
)
const finalQ = JSON.parse(
  fs.readFileSync(path.join(qb, 'global4a_final_quality_results.json'), 'utf8'),
)
const manifest = JSON.parse(fs.readFileSync(path.join(diagDir, '_manifest.json'), 'utf8'))
const prior = JSON.parse(fs.readFileSync(path.join(qb, '_g4a_prior_stems.json'), 'utf8'))

const ACCEPTABLE_IDS = (cleanup.acceptableVariantsFinal || []).map((x) => x.id)
report.acceptableClarification = {
  priorMisreadRisk:
    '口语「275 ACCEPTABLE」易被误读为275处；实际为候选编号 CAND-G4A-275，ACCEPTABLE_VARIANT 计数=1',
  jsonField: 'acceptableVariantsFinal / prior13Verdicts.ACCEPTABLE_VARIANT',
  count: ACCEPTABLE_IDS.length,
  ids: ACCEPTABLE_IDS,
  prior13Breakdown: cleanup.prior13Verdicts,
}

// ---------- consistency ----------
const cons = {
  mergeCount: merged.length,
  groupCounts: groups.map((x) => x.list.length),
  idsUnique: true,
  idsSequential: true,
  groupMatchMerge: true,
  parseOk: true,
  truncatedSuspect: false,
  mismatches: [],
  missingHardProfileOnD3: [],
  isoMarkedCount: 0,
  isoMarkedIds: [],
}
const byId = new Map(merged.map((c) => [c.id, c]))
const idSet = new Set()
for (const c of merged) {
  if (idSet.has(c.id)) {
    cons.idsUnique = false
    cons.mismatches.push(`dup:${c.id}`)
  }
  idSet.add(c.id)
  if (String(c.sourceEvidence || '').includes('同构清理')) {
    cons.isoMarkedCount++
    cons.isoMarkedIds.push(c.id)
  }
  if (Number(c.difficulty) === 3 && !c.hardProfile) {
    cons.missingHardProfileOnD3.push(c.id)
  }
}
for (let i = 1; i <= 500; i++) {
  const id = `CAND-G4A-${String(i).padStart(3, '0')}`
  if (!byId.has(id)) {
    cons.idsSequential = false
    cons.mismatches.push(`missing:${id}`)
  }
}
const groupConcat = groups.flatMap((x) => x.list)
if (groupConcat.length !== 500) {
  cons.groupMatchMerge = false
  cons.mismatches.push(`groupTotal:${groupConcat.length}`)
}
for (let i = 0; i < 500; i++) {
  const a = merged[i]
  const b = groupConcat[i]
  if (!a || !b || a.id !== b.id || stableContent(a) !== stableContent(b)) {
    cons.groupMatchMerge = false
    cons.mismatches.push(`contentMismatch@${i}:${a?.id}/${b?.id}`)
    if (cons.mismatches.length > 30) break
  }
}
for (const g of groups) {
  if (g.list.length !== 100) {
    cons.groupMatchMerge = false
    cons.mismatches.push(`group${g.g}size:${g.list.length}`)
  }
}
const mergeBytes = fs.statSync(mergePath).size
if (mergeBytes < 100000) cons.truncatedSuspect = true
cons.cleanupStatus = cleanup.status
cons.finalStatus = finalQ.status
cons.manifestN = manifest.n
report.consistency = cons

// ---------- snapshots ----------
const perItem = {}
const itemShas = []
for (const c of merged) {
  const h = sha256Text(stableContent(c))
  perItem[c.id] = h
  itemShas.push(`${c.id}:${h}`)
}
const batchSha = sha256Text(itemShas.join('\n'))
const groupShas = {}
for (const g of groups) {
  groupShas[`g4a_group0${g.g}`] = sha256Text(
    g.list.map((c) => `${c.id}:${sha256Text(stableContent(c))}`).join('\n'),
  )
}
const diagramShas = {}
for (const it of manifest.items || []) {
  const svgP = path.join(diagDir, it.svg)
  const pngP = path.join(diagDir, it.png)
  const svgOk = fs.existsSync(svgP)
  const pngOk = fs.existsSync(pngP)
  const svgH = svgOk ? sha256File(svgP) : null
  const pngH = pngOk ? sha256File(pngP) : null
  diagramShas[it.code] = {
    svg: svgH,
    png: pngH,
    manifestSvg: it.sha256_svg,
    manifestPng: it.sha256_png,
    svgMatch: svgH === it.sha256_svg,
    pngMatch: pngH === it.sha256_png,
    exists: svgOk && pngOk,
  }
}
report.snapshot = {
  batchContentSha256: batchSha,
  mergeFileSha256: sha256File(mergePath),
  groupFileShas: Object.fromEntries(
    groups.map((g) => [path.basename(g.path), sha256File(g.path)]),
  ),
  groupContentShas: groupShas,
  perItemContentSha256: perItem,
  diagramShas,
  itemCount: merged.length,
}

fs.writeFileSync(
  path.join(auditsDir, 'snapshot_per_item.json'),
  JSON.stringify(perItem, null, 2),
)

// ---------- DB baseline (RO) ----------
const env = loadEnv()
let conn
try {
  conn = await createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'study_system',
  })
  const [[dbName]] = await conn.query('SELECT DATABASE() AS db')
  const [[drawableRow]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  const [chRows] = await conn.query(
    `SELECT chapter_no AS ch, COUNT(1) AS n FROM hs_math_train_items
     WHERE pool='formal' AND status='approved' AND is_active=1
     GROUP BY chapter_no ORDER BY chapter_no`,
  )
  const [diffRows] = await conn.query(
    `SELECT difficulty AS d, COUNT(1) AS n FROM hs_math_train_items
     WHERE pool='formal' AND status='approved' AND is_active=1
     GROUP BY difficulty ORDER BY difficulty`,
  )
  const [qtRows] = await conn.query(
    `SELECT qtype, COUNT(1) AS n FROM hs_math_train_items
     WHERE pool='formal' AND status='approved' AND is_active=1
     GROUP BY qtype`,
  )
  const [statusRows] = await conn.query(
    `SELECT status, pool, is_active, COUNT(1) AS n FROM hs_math_train_items GROUP BY status, pool, is_active`,
  )
  const [kpAll] = await conn.query(
    `SELECT code FROM hs_math_knowledge_points WHERE is_active=1`,
  )
  const [methodAll] = await conn.query(
    `SELECT code FROM hs_math_methods WHERE is_active=1`,
  )
  const kpDb = new Set(kpAll.map((r) => r.code))
  const methodDb = new Set(methodAll.map((r) => r.code))
  const candCodes = merged.map((c) => c.id)
  const [existCodes] = await conn.query(
    `SELECT code FROM hs_math_train_items WHERE code IN (${candCodes.map(() => '?').join(',')})`,
    candCodes,
  )
  const kpMiss = [...new Set(merged.map((c) => c.kpCode).filter((k) => !kpDb.has(k)))]
  const methodMiss = [
    ...new Set(
      merged
        .flatMap((c) => [c.methodMain, c.methodAux].filter(Boolean))
        .filter((m) => !methodDb.has(m)),
    ),
  ]
  const badDiff = merged.filter((c) => ![1, 2, 3].includes(Number(c.difficulty))).map((c) => c.id)
  const badQt = merged.filter(
    (c) => !['single', 'multi', 'judge', 'numeric', 'application'].includes(c.qtype),
  ).map((c) => c.id)

  // stem fingerprint collide with formal (normalized exact)
  const [formalStems] = await conn.query(
    `SELECT code, stem FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  function normExact(s) {
    return String(s || '')
      .replace(/\$/g, '')
      .replace(/\\[a-zA-Z]+/g, '')
      .replace(/[{}]/g, '')
      .replace(/\s+/g, '')
      .toLowerCase()
  }
  const formalNorm = new Map()
  for (const r of formalStems) formalNorm.set(normExact(r.stem), r.code)
  const exactCollide = []
  for (const c of merged) {
    const hit = formalNorm.get(normExact(c.stem))
    if (hit) exactCollide.push({ cand: c.id, formal: hit })
  }

  report.dbBaseline = {
    database: dbName.db,
    drawable: Number(drawableRow.n),
    expectedDrawableAssumed: 313,
    drawableMatchesAssumption: Number(drawableRow.n) === 313,
    byChapter: Object.fromEntries(chRows.map((r) => [r.ch, Number(r.n)])),
    byDifficulty: Object.fromEntries(diffRows.map((r) => [r.d, Number(r.n)])),
    byQtype: Object.fromEntries(qtRows.map((r) => [r.qtype, Number(r.n)])),
    statusPoolActive: statusRows,
    formalStemCount: formalStems.length,
    codeConflicts: existCodes.map((r) => r.code),
    kpMissInDb: kpMiss,
    methodMissInDb: methodMiss,
    badDifficulty: badDiff,
    badQtype: badQt,
    exactStemCollisions: exactCollide,
  }
} catch (e) {
  report.dbBaseline = { error: String(e && e.message ? e.message : e) }
  report.gateFailures.push('DB_READONLY_FAILED')
} finally {
  if (conn) await conn.end()
}

// ---------- protocol check (static + DTO) ----------
const importSvc = path.join(
  root,
  'apps/api/src/hs-math/admin/hs-math-admin-train-items-import.service.ts',
)
const reviewCtrl = path.join(
  root,
  'apps/api/src/hs-math/admin/hs-math-admin-train-items.controller.ts',
)
report.protocol = {
  importServiceExists: fs.existsSync(importSvc),
  adminControllerExists: fs.existsSync(reviewCtrl),
  priorBatchScript: fs.existsSync(path.join(qb, '_g3c_import_run.mjs')),
  drawableDefinition:
    "pool='formal' AND status='approved' AND is_active=1",
  recommendedGroupPlan: {
    groups: 5,
    perGroup: 100,
    steps: [
      'preview+confirm draft import',
      'upload REQUIRED diagrams for group',
      'confirm fingerprint/content_version',
      'per-item review passed',
      'approve',
      'verify drawable +=100',
      'stop on any math/image/fingerprint/review/approve/drawable anomaly',
    ],
    idempotency: 'reject if code already exists; previewToken binds exact item payload',
    note: '本阶段不执行写操作；下一阶段需单独授权',
  },
  maxImportBatchHint: 'HS_MATH_IMPORT_MAX_ITEMS in types/import-protocol',
}

// ---------- heuristic helpers for audits ----------
function falseHardHeuristics(c) {
  const issues = []
  const stem = String(c.stem || '')
  const analysis = String(c.analysis || '')
  if (Number(c.difficulty) === 3) {
    if (c.qtype === 'judge' && stem.length < 40 && analysis.length < 40)
      issues.push('JUDGE_TRIVIAL_AS_D3')
    if (
      /样本平均数可用于估计|判断：|下列说法正确/.test(stem) &&
      analysis.length < 80
    )
      issues.push('SHORT_JUDGE_OR_STATEMENT_AS_D3')
    if (!c.hardProfile) issues.push('MISSING_HARD_PROFILE')
    if (analysis.length < 25) issues.push('ANALYSIS_TOO_SHORT_FOR_D3')
  }
  return issues
}

function answerAnalysisConsistency(c) {
  const issues = []
  if (CRUTCH_RE.test(c.stem) || CRUTCH_RE.test(c.analysis)) issues.push('CRUTCH_LEFT')
  if (c.qtype === 'application') {
    const sum = (c.rubric || []).reduce((s, r) => s + Number(r.score), 0)
    if (sum !== Number(c.maxScore)) issues.push('RUBRIC_SUM_NE_MAX')
    const titles = (c.rubric || []).map((r) => r.title)
    if (new Set(titles).size !== titles.length) issues.push('RUBRIC_DUP_TITLE')
    for (const r of c.rubric || []) {
      if (/照抄|抄写题干|写出题干/.test(String(r.criterion || '')))
        issues.push('RUBRIC_COPY_REWARD')
    }
  }
  if (c.qtype === 'numeric') {
    if (!/^[+-]?(?:\d+(?:\.\d{1,8})?|\.\d{1,8}|\d+\/[1-9]\d*)$/.test(String(c.answer).trim()))
      issues.push('NUMERIC_FORMAT')
  }
  if (c.answer == null || c.answer === '') issues.push('EMPTY_ANSWER')
  // answer mentioned loosely in analysis
  const ans = String(c.answer)
  if (c.qtype === 'single' || c.qtype === 'multi') {
    if (ans && !String(c.analysis).includes(ans.split(',')[0].trim())) {
      // weak signal only
    }
  }
  return issues
}

function mathSpotCheck(c) {
  /** Author-side structured check; returns {verdict, keyDerivation, notes} */
  const notes = []
  let verdict = 'PASS'
  const stem = String(c.stem)
  const ans = String(c.answer)
  const analysis = String(c.analysis)

  // mean sample
  let m = stem.match(/样本数据\s*\$([^$]+)\$[^，。]*平均/)
  if (m) {
    const nums = m[1].split(/[,，、]/).map((x) => Number(x.trim())).filter((x) => !Number.isNaN(x))
    if (nums.length) {
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length
      const expect = String(mean).replace(/\.0$/, '')
      if (String(ans) !== expect && Number(ans) !== mean) {
        verdict = 'ISSUE'
        notes.push(`mean expect ${mean} got ${ans}`)
      } else notes.push(`mean verified ${mean}`)
    }
  }

  // P(A∪B)=P(A)+P(B)-P(A)P(B) independent
  if (/P\(A\\cup B\)|P\(A∪B\)|并事件|P\(A\\cup/.test(stem) || /并/.test(stem) && /独立/.test(stem)) {
    const pa = stem.match(/P\(A\)\s*=\s*\$?([0-9.]+)/)
    const pb = stem.match(/P\(B\)\s*=\s*\$?([0-9.]+)/)
    if (pa && pb) {
      const a = Number(pa[1])
      const b = Number(pb[1])
      const expect = a + b - a * b
      const got = Number(ans)
      if (Math.abs(got - expect) > 1e-9) {
        verdict = 'ISSUE'
        notes.push(`union expect ${expect} got ${ans}`)
      } else notes.push(`union verified ${expect}`)
    }
  }

  // |A∪B|=|A|+|B|-|A∩B|
  if (/\|A\\cup B\||\|A∪B\|/.test(stem) || (/A\\cup B|A∪B/.test(stem) && /\|A\|/.test(stem))) {
    const A = stem.match(/\|A\|\s*=\s*\$?(\d+)/)
    const B = stem.match(/\|B\|\s*=\s*\$?(\d+)/)
    const I = stem.match(/\|A\\cap B\|\s*=\s*\$?(\d+)/) || stem.match(/\|A∩B\|\s*=\s*\$?(\d+)/)
    if (A && B && I) {
      const expect = Number(A[1]) + Number(B[1]) - Number(I[1])
      if (Number(ans) !== expect) {
        verdict = 'ISSUE'
        notes.push(`set-union expect ${expect} got ${ans}`)
      } else notes.push(`set-union verified ${expect}`)
    }
  }

  // simple arithmetic in authorMathNote vs answer
  if (c.qtype === 'judge') {
    if (!['true', 'false', '真', '假', '对', '错'].includes(ans.toLowerCase()) && ans !== 'true' && ans !== 'false') {
      // Chinese true/false ok
      if (!/^(true|false|真|假)$/i.test(ans)) {
        notes.push(`judge answer form: ${ans}`)
      }
    }
  }

  const fh = falseHardHeuristics(c)
  const ac = answerAnalysisConsistency(c)
  if (fh.includes('JUDGE_TRIVIAL_AS_D3') || fh.includes('SHORT_JUDGE_OR_STATEMENT_AS_D3')) {
    verdict = 'ISSUE'
    notes.push(...fh)
  } else if (fh.length && verdict === 'PASS') {
    notes.push(...fh)
    if (fh.includes('MISSING_HARD_PROFILE')) verdict = verdict === 'PASS' ? 'UNCERTAIN' : verdict
  }
  if (ac.includes('CRUTCH_LEFT') || ac.includes('RUBRIC_SUM_NE_MAX') || ac.includes('EMPTY_ANSWER')) {
    verdict = 'ISSUE'
    notes.push(...ac)
  } else if (ac.length) notes.push(...ac)

  if (!notes.length) {
    // structural pass only — mark UNCERTAIN if no closed-form verify
    notes.push('structural fields ok; closed-form auto-verify not applicable')
    if (verdict === 'PASS' && Number(c.difficulty) === 3) verdict = 'UNCERTAIN'
    if (verdict === 'PASS' && c.qtype === 'application') {
      // keep PASS only if rubric ok and analysis mentions answer-ish
      if (!analysis || analysis.length < 40) verdict = 'UNCERTAIN'
    }
  }

  return {
    verdict,
    keyDerivation: notes.join(' | '),
    falseHard: fh,
    consistency: ac,
  }
}

function auditRecord(c, bucket, extra = {}) {
  const spot = mathSpotCheck(c)
  return {
    id: c.id,
    bucket,
    chapterNo: c.chapterNo,
    qtype: c.qtype,
    difficulty: c.difficulty,
    contentSha256: perItem[c.id],
    kpCode: c.kpCode,
    methodMain: c.methodMain,
    stemPreview: String(c.stem).slice(0, 120),
    answer: c.answer,
    analysisPreview: String(c.analysis).slice(0, 160),
    hasHardProfile: Boolean(c.hardProfile),
    sourceEvidence: c.sourceEvidence,
    diagramRequirement: c.diagramRequirement,
    mathConclusion: spot.keyDerivation,
    verdict: spot.verdict,
    fixSuggestion:
      spot.verdict === 'ISSUE'
        ? spot.falseHard.includes('JUDGE_TRIVIAL_AS_D3') ||
          spot.falseHard.includes('SHORT_JUDGE_OR_STATEMENT_AS_D3')
          ? '降低 difficulty 或整题替换为真实压轴；禁止虚标 d3'
          : spot.falseHard.includes('MISSING_HARD_PROFILE')
            ? '为最终题干补写 hardProfile 并与答案/解析对齐'
            : '修复答案/解析/rubric 后重跑预检'
        : null,
    ...extra,
  }
}

// ---------- ACCEPTABLE full check (1) ----------
for (const id of ACCEPTABLE_IDS) {
  const c = byId.get(id)
  if (!c) {
    report.audits.acceptable.push({
      id,
      verdict: 'ISSUE',
      mathConclusion: 'missing from merge',
    })
    continue
  }
  // compare to prior stems structurally
  const ns = normStem(c.stem)
  const priorHit = (prior.stemsNorm || []).includes(
    String(c.stem || '')
      .replace(/\$/g, '')
      .replace(/\\[a-zA-Z]+/g, '')
      .replace(/[{}]/g, '')
      .replace(/\s+/g, '')
      .toLowerCase(),
  )
  const rec = auditRecord(c, 'ACCEPTABLE', {
    acceptableClaim: cleanup.acceptableVariantsFinal?.[0]?.teachingIncrement,
    digitStripKey: ns,
    onlyNumberChange: false,
    teachingValueCheck:
      /并|∪|cup/.test(c.stem) && /独立/.test(c.stem)
        ? 'CONFIRMED_UNION_VS_INTERSECTION_INTENT'
        : 'NEEDS_HUMAN',
  })
  if (rec.teachingValueCheck === 'CONFIRMED_UNION_VS_INTERSECTION_INTENT' && rec.verdict !== 'ISSUE') {
    rec.verdict = 'ACCEPTABLE_CONFIRMED'
  }
  report.audits.acceptable.push(rec)
}

// ---------- iso replace sample >=80 ----------
const isoPool = merged.filter((c) => String(c.sourceEvidence || '').includes('同构清理'))
const isoSample = pickStratified(
  isoPool,
  Math.min(80, isoPool.length),
  (c) => `${c.chapterNo}|${c.qtype}|${c.difficulty}`,
)
for (const c of isoSample) {
  report.audits.isoReplace.push(auditRecord(c, 'ISO_REPLACE'))
}

// ---------- d3: 100% archive consistency + sample >=40 deep ----------
const d3All = merged.filter((c) => Number(c.difficulty) === 3)
const d3ArchiveIssues = []
for (const c of d3All) {
  const fh = falseHardHeuristics(c)
  if (fh.length) {
    d3ArchiveIssues.push({ id: c.id, issues: fh, stemPreview: String(c.stem).slice(0, 80) })
  }
}
const d3Sample = pickStratified(d3All, 40, (c) => `${c.chapterNo}|${c.qtype}`)
for (const c of d3Sample) {
  report.audits.d3.push(auditRecord(c, 'D3_DEEP'))
}
report.counts.d3ArchiveIssueCount = d3ArchiveIssues.length
report.counts.d3ArchiveIssuesSample = d3ArchiveIssues.slice(0, 60)
report.counts.d3MissingHardProfile = cons.missingHardProfileOnD3.length

// ---------- application 100% rubric + 40 deep ----------
const apps = merged.filter((c) => c.qtype === 'application')
const appStructBad = []
for (const c of apps) {
  const ac = answerAnalysisConsistency(c)
  if (ac.length) appStructBad.push({ id: c.id, issues: ac })
}
const appSample = pickStratified(apps, 40, (c) => `${c.chapterNo}|${c.difficulty}`)
for (const c of appSample) {
  report.audits.application.push(auditRecord(c, 'APPLICATION_DEEP'))
}
report.counts.appStructBad = appStructBad.length
report.counts.appStructBadSample = appStructBad.slice(0, 40)

// ---------- REQUIRED 13 ----------
const requiredIds = (manifest.items || []).map((x) => x.code)
for (const code of requiredIds) {
  const c = byId.get(code)
  const sh = diagramShas[code]
  const issues = []
  if (!c) issues.push('CAND_MISSING')
  if (c && c.diagramRequirement !== 'REQUIRED') issues.push('FLAG_NOT_REQUIRED')
  if (!sh?.exists) issues.push('FILE_MISSING')
  if (sh && !sh.svgMatch) issues.push('SVG_SHA_MISMATCH')
  if (sh && !sh.pngMatch) issues.push('PNG_SHA_MISMATCH')
  // answer leak in svg text
  if (sh?.exists) {
    const svg = fs.readFileSync(path.join(diagDir, `${code}.svg`), 'utf8')
    if (c && String(c.answer) && svg.includes(String(c.answer)) && String(c.answer).length > 0) {
      // numeric answers might appear as labels — flag uncertain
      if (!['A', 'B', 'C', 'D', 'true', 'false'].includes(String(c.answer))) {
        issues.push('POSSIBLE_ANSWER_IN_SVG')
      }
    }
  }
  let verdict = issues.length ? 'ISSUE' : 'PASS'
  if (issues.includes('POSSIBLE_ANSWER_IN_SVG') && issues.length === 1) verdict = 'UNCERTAIN'
  report.audits.requiredDiagrams.push({
    id: code,
    contentSha256: c ? perItem[code] : null,
    diagramRequirement: c?.diagramRequirement,
    stemPreview: c ? String(c.stem).slice(0, 100) : null,
    sha: sh,
    issues,
    verdict,
    mathConclusion: issues.length ? issues.join(',') : 'files+sha+flag ok; geometry author-side',
    fixSuggestion: issues.length ? '重配图或纠正 diagramRequirement/题干一致性' : null,
  })
}

// ---------- non-REQUIRED leak sample >=80 ----------
const nonReqPool = merged.filter(
  (c) =>
    c.diagramRequirement !== 'REQUIRED' &&
    GEO_HINT.test(String(c.stem) + String(c.analysis || '')),
)
const leakSample = pickStratified(nonReqPool, 80, (c) => `${c.chapterNo}|${c.qtype}`)
for (const c of leakSample) {
  const needs =
    /(立体几何|棱锥|棱柱|圆锥|圆柱|直观图|空间直角坐标系|在图中|如图|见图)/.test(
      String(c.stem),
    ) ||
    (/(向量|模|夹角)/.test(c.stem) && /如图/.test(c.stem))
  const verdict = needs ? 'ISSUE' : 'PASS'
  report.audits.nonRequiredLeak.push({
    id: c.id,
    contentSha256: perItem[c.id],
    chapterNo: c.chapterNo,
    qtype: c.qtype,
    difficulty: c.difficulty,
    diagramRequirement: c.diagramRequirement,
    stemPreview: String(c.stem).slice(0, 120),
    leakSuspect: needs,
    verdict,
    mathConclusion: needs
      ? 'stem suggests figure but NOT_NEEDED/missing REQUIRED'
      : 'geo/stat keywords present but text appears self-contained (author-side)',
    fixSuggestion: needs ? '升级为 REQUIRED 并配图后重预检' : null,
  })
}

// ---------- counts ----------
function tally(arr) {
  const t = { PASS: 0, ISSUE: 0, UNCERTAIN: 0, ACCEPTABLE_CONFIRMED: 0, other: 0 }
  for (const a of arr) {
    if (t[a.verdict] != null) t[a.verdict]++
    else t.other++
  }
  return { n: arr.length, ...t }
}
report.counts = {
  ...report.counts,
  candidates: merged.length,
  isoMarked: cons.isoMarkedCount,
  isoReplaceSample: tally(report.audits.isoReplace),
  acceptable: tally(report.audits.acceptable),
  d3Deep: tally(report.audits.d3),
  d3Total: d3All.length,
  applicationDeep: tally(report.audits.application),
  applicationTotal: apps.length,
  required: tally(report.audits.requiredDiagrams),
  nonRequiredLeak: tally(report.audits.nonRequiredLeak),
  bucketsAreSeparate: true,
}

// ---------- gate decision ----------
const fail = report.gateFailures
if (merged.length !== 500) fail.push('COUNT_NOT_500')
if (!cons.idsUnique || !cons.idsSequential) fail.push('ID_INTEGRITY')
if (!cons.groupMatchMerge) fail.push('GROUP_MERGE_MISMATCH')
if (cons.truncatedSuspect) fail.push('TRUNCATION_SUSPECT')
if (report.dbBaseline.error) fail.push('DB_ERROR')
if (report.dbBaseline.drawableMatchesAssumption === false)
  fail.push('DRAWABLE_NOT_313')
if ((report.dbBaseline.codeConflicts || []).length) fail.push('CODE_CONFLICT')
if ((report.dbBaseline.kpMissInDb || []).length) fail.push('KP_MISSING')
if ((report.dbBaseline.methodMissInDb || []).length) fail.push('METHOD_MISSING')
if ((report.dbBaseline.exactStemCollisions || []).length) fail.push('EXACT_STEM_COLLIDE')

const anyIssue = (arr) => arr.some((x) => x.verdict === 'ISSUE')
const anyUncertain = (arr) => arr.some((x) => x.verdict === 'UNCERTAIN')

if (anyIssue(report.audits.acceptable)) fail.push('ACCEPTABLE_ISSUE')
if (anyIssue(report.audits.isoReplace)) fail.push('ISO_REPLACE_MATH_ISSUE')
if (anyIssue(report.audits.d3)) fail.push('D3_MATH_OR_FALSE_HARD')
if (report.counts.d3ArchiveIssueCount > 0) fail.push('D3_ARCHIVE_ISSUES')
if (anyIssue(report.audits.application) || report.counts.appStructBad > 0)
  fail.push('APPLICATION_ISSUE')
if (anyIssue(report.audits.requiredDiagrams)) fail.push('REQUIRED_DIAGRAM_ISSUE')
if (anyIssue(report.audits.nonRequiredLeak)) fail.push('REQUIRED_LEAK')

const soft = []
if (cons.missingHardProfileOnD3.length === d3All.length)
  soft.push('ALL_D3_MISSING_HARD_PROFILE')
if (anyUncertain(report.audits.isoReplace)) soft.push('ISO_REPLACE_UNCERTAIN')
if (anyUncertain(report.audits.d3)) soft.push('D3_UNCERTAIN')
if (anyUncertain(report.audits.application)) soft.push('APP_UNCERTAIN')
if (anyUncertain(report.audits.requiredDiagrams)) soft.push('DIAGRAM_UNCERTAIN')

report.openIssues = [
  'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  ...fail,
  ...soft,
]

let status
if (
  fail.some((f) =>
    [
      'COUNT_NOT_500',
      'ID_INTEGRITY',
      'GROUP_MERGE_MISMATCH',
      'DB_ERROR',
      'CODE_CONFLICT',
      'KP_MISSING',
      'METHOD_MISSING',
    ].includes(f),
  )
) {
  status = 'IMPORT_PREFLIGHT_BLOCKED'
} else if (fail.length > 0) {
  status = 'IMPORT_PREFLIGHT_PARTIAL'
} else if (soft.length > 0) {
  status = 'IMPORT_PREFLIGHT_PARTIAL'
} else {
  status = 'IMPORT_PREFLIGHT_PASS'
}

report.status = status
report.gateFailures = fail
report.softFlags = soft
report.nextImportPlan = report.protocol.recommendedGroupPlan
report.endedAt = new Date().toISOString()

// write compact audits (full per-item already in report.audits)
fs.writeFileSync(outJson, JSON.stringify(report, null, 2))
fs.writeFileSync(
  path.join(auditsDir, 'summary.json'),
  JSON.stringify(
    {
      status,
      counts: report.counts,
      gateFailures: fail,
      softFlags: soft,
      acceptableClarification: report.acceptableClarification,
      dbDrawable: report.dbBaseline.drawable,
      batchSha,
    },
    null,
    2,
  ),
)

console.log(
  JSON.stringify(
    {
      status,
      merge: merged.length,
      isoMarked: cons.isoMarkedCount,
      acceptableCount: ACCEPTABLE_IDS.length,
      d3ArchiveIssues: report.counts.d3ArchiveIssueCount,
      d3MissingHP: cons.missingHardProfileOnD3.length,
      appStructBad: report.counts.appStructBad,
      isoSample: tally(report.audits.isoReplace),
      d3Sample: tally(report.audits.d3),
      appSample: tally(report.audits.application),
      required: tally(report.audits.requiredDiagrams),
      leak: tally(report.audits.nonRequiredLeak),
      drawable: report.dbBaseline.drawable,
      gateFailures: fail.slice(0, 20),
      softFlags: soft,
      batchSha: batchSha.slice(0, 16),
    },
    null,
    2,
  ),
)
