/**
 * GLOBAL-4D recheck: 125 d3 math review evidence + full import preflight refresh.
 * MySQL read-only. No DB writes.
 */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath, pathToFileURL } from 'url'
import { createConnection } from '../../../../apps/api/node_modules/mysql2/promise.js'
import { normStem, normExact } from './_rebuild_core.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const docs = path.resolve(__dirname, '../..')
const root = path.resolve(__dirname, '../../../..')
const diag = path.join(docs, 'diagrams/required_g4a')

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
function stable(c) {
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
  ]
  const o = {}
  for (const k of keys) o[k] = c[k] ?? null
  return JSON.stringify(o)
}
function shaText(t) {
  return crypto.createHash('sha256').update(String(t), 'utf8').digest('hex')
}
function shaFile(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
}

const classify = JSON.parse(fs.readFileSync(path.join(__dirname, '_4d_classify.json'), 'utf8'))
const { candidates } = await import(
  pathToFileURL(path.join(qb, 'candidates-g4a-500.mjs')).href + '?t=' + Date.now()
)
const groups = []
for (let g = 1; g <= 5; g++) {
  const m = await import(
    pathToFileURL(path.join(__dirname, `g4a_group0${g}.mjs`)).href + '?t=' + Date.now()
  )
  groups.push(m.candidates || [])
}

const perItem = {}
for (const c of candidates) perItem[c.id] = shaText(stable(c))
const batchSha = shaText(
  Object.entries(perItem)
    .map(([id, h]) => `${id}:${h}`)
    .join('\n'),
)

const quotas = { d: {}, qt: {}, ch: {} }
for (const c of candidates) {
  quotas.d[c.difficulty] = (quotas.d[c.difficulty] || 0) + 1
  quotas.qt[c.qtype] = (quotas.qt[c.qtype] || 0) + 1
  quotas.ch[c.chapterNo] = (quotas.ch[c.chapterNo] || 0) + 1
}
const quotaOk =
  quotas.d[1] === 175 &&
  quotas.d[2] === 200 &&
  quotas.d[3] === 125 &&
  quotas.qt.single === 150 &&
  quotas.qt.multi === 75 &&
  quotas.qt.judge === 50 &&
  quotas.qt.numeric === 100 &&
  quotas.qt.application === 125
const chapterTarget = { 1: 29, 2: 48, 3: 55, 4: 67, 5: 76, 6: 67, 7: 20, 8: 68, 9: 30, 10: 40 }
const chapterOk = Object.entries(chapterTarget).every(([k, v]) => quotas.ch[k] === v)
const groupMatch =
  groups.every((g) => g.length === 100) &&
  groups.flat().every((c, i) => c.id === candidates[i].id && stable(c) === stable(candidates[i]))

const d3 = candidates.filter((c) => Number(c.difficulty) === 3)
const hpFields = [
  'coreChallenge',
  'reasoningSteps',
  'difficultyEvidence',
  'misconceptionTrap',
  'alternativeApproach',
  'verification',
  'contentSha256',
]
const hpMissing = []
const hpShaMismatch = []
for (const c of d3) {
  if (!c.hardProfile) {
    hpMissing.push(c.id)
    continue
  }
  for (const f of hpFields) {
    if (c.hardProfile[f] == null || c.hardProfile[f] === '') hpMissing.push(`${c.id}:${f}`)
  }
  if (c.hardProfile.contentSha256 !== perItem[c.id]) hpShaMismatch.push(c.id)
}

/** Heuristic weak (must not be sole PASS criterion; used as soft/gate signal) */
function isWeakD3(c) {
  const s = String(c.stem)
  const a = String(c.analysis)
  if (c.qtype === 'judge' && s.length < 40 && a.length < 60) return true
  if (a.length < 50) return true
  if (/空集是任何集合|必然事件的概率为|两点确定一条直线|系统抽样属于|i\^4=1/.test(s)) return true
  if (/手修差异化压轴|紧急去重|见解析（建模后/.test(a + String(c.hardProfile?.coreChallenge || '')))
    return true
  if (/^关于“.+”，下列正确的是$/.test(s.replace(/【[^】]+】/, '').trim()) && a.length < 100)
    return true
  // template choice shells still thin
  if (/符合定理与条件的正确表述/.test(JSON.stringify(c.options || {})) && a.length < 120) return true
  if (/常见否命题/.test(JSON.stringify(c.options || {})) && /多选/.test(s)) return true
  return false
}
const weakD3 = d3.filter(isWeakD3).map((c) => c.id)

/** Per-item 125 review bound to content SHA */
const classById = new Map(classify.records.map((r) => [r.candidateId, r]))
const d3Reviews = d3.map((c) => {
  const cls = classById.get(c.id)
  const rebuilt = String(c.dedupNote || '').includes('4d-true') || String(c.sourceEvidence || '').includes('4D')
  const weak = isWeakD3(c)
  let verdict = 'TRUE_D3_AUTHOR'
  let note = ''
  if (weak) {
    verdict = 'STILL_WEAK_OR_TEMPLATE'
    note = '启发式仍提示偏模板/解析偏短/选项壳'
  } else if (rebuilt) {
    verdict = 'REBUILT_TRUE_D3_AUTHOR'
    note = `4D整题重建；原分类=${cls?.class || 'N/A'}；HP绑定SHA`
  } else if (cls?.class === 'A_TRUE_D3') {
    verdict = 'KEPT_TRUE_D3_AUTHOR'
    note = '分类为真压轴保留'
  } else {
    verdict = 'KEPT_D3_AUTHOR'
    note = '未在弱清单整替；作者复核保留'
  }
  return {
    candidateId: c.id,
    contentSha256: perItem[c.id],
    hardProfileSha: c.hardProfile?.contentSha256 || null,
    shaMatch: c.hardProfile?.contentSha256 === perItem[c.id],
    chapterNo: c.chapterNo,
    qtype: c.qtype,
    priorClass: cls?.class || null,
    rebuilt,
    heuristicWeak: weak,
    coreChallenge: c.hardProfile?.coreChallenge || null,
    reasoningSteps: c.hardProfile?.reasoningSteps || null,
    verification: c.hardProfile?.verification || null,
    analysisLen: String(c.analysis || '').length,
    verdict,
    mathNote: note,
  }
})

const exactFam = new Map()
for (const c of candidates) {
  const k = normExact(c.stem)
  if (!exactFam.has(k)) exactFam.set(k, [])
  exactFam.get(k).push(c.id)
}
const exactDups = [...exactFam.values()].filter((v) => v.length > 1)
const structFam = new Map()
for (const c of candidates) {
  const k = `${c.chapterNo}|${normStem(c.stem)}`
  if (!structFam.has(k)) structFam.set(k, [])
  structFam.get(k).push(c.id)
}
const structMulti = [...structFam.entries()].filter(([, v]) => v.length > 1)

const apps = candidates.filter((c) => c.qtype === 'application')
const rubricBad = []
for (const c of apps) {
  const sum = (c.rubric || []).reduce((s, r) => s + Number(r.score), 0)
  if (!c.maxScore || sum !== Number(c.maxScore)) rubricBad.push(c.id)
}

const manifest = JSON.parse(fs.readFileSync(path.join(diag, '_manifest.json'), 'utf8'))
const req = candidates.filter((c) => c.diagramRequirement === 'REQUIRED')
const reqAudit = []
for (const c of req) {
  const man = (manifest.items || []).find((x) => x.code === c.id)
  const svgP = path.join(diag, `${c.id}.svg`)
  const pngP = path.join(diag, `${c.id}.png`)
  const issues = []
  if (!fs.existsSync(svgP) || !fs.existsSync(pngP)) issues.push('FILE_MISSING')
  if (!man) issues.push('MANIFEST_MISSING')
  else {
    if (shaFile(svgP) !== man.sha256_svg) issues.push('SVG_SHA')
    if (shaFile(pngP) !== man.sha256_png) issues.push('PNG_SHA')
  }
  const oa = c.diagramSpecification?.offlineAssets
  if (!oa?.sha256_svg || !oa?.sha256_png) issues.push('SPEC_SHA_MISSING')
  reqAudit.push({ id: c.id, verdict: issues.length ? 'ISSUE' : 'PASS', issues })
}

const NUMERIC_RE = /^[+-]?(?:\d+(?:\.\d{1,8})?|\.\d{1,8}|\d+\/[1-9]\d*)$/
let adaptErrors = 0
const adaptSamples = []
for (const c of candidates) {
  try {
    if (c.qtype === 'judge') {
      let raw = String(c.answer).trim().toLowerCase()
      if (raw === '真' || raw === '对') raw = 'true'
      if (raw === '假' || raw === '错') raw = 'false'
      if (raw !== 'true' && raw !== 'false') throw new Error('judge')
    }
    if (c.qtype === 'numeric' && !NUMERIC_RE.test(String(c.answer).trim())) throw new Error('num')
    if (c.qtype === 'application') {
      const sum = (c.rubric || []).reduce((s, r) => s + Number(r.score), 0)
      if (sum !== Number(c.maxScore)) throw new Error('rubric')
    }
  } catch (e) {
    adaptErrors++
    if (adaptSamples.length < 15) adaptSamples.push({ id: c.id, qtype: c.qtype, answer: c.answer, err: String(e.message || e) })
  }
}

const env = loadEnv()
let db = {}
try {
  const conn = await createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'study_system',
  })
  const [[drawable]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  const codes = candidates.map((c) => c.id)
  const [exist] = await conn.query(
    `SELECT code FROM hs_math_train_items WHERE code IN (${codes.map(() => '?').join(',')})`,
    codes,
  )
  const [kps] = await conn.query(`SELECT code FROM hs_math_knowledge_points WHERE is_active=1`)
  const [methods] = await conn.query(`SELECT code FROM hs_math_methods WHERE is_active=1`)
  const kpSet = new Set(kps.map((r) => r.code))
  const methodSet = new Set(methods.map((r) => r.code))
  db = {
    drawable: Number(drawable.n),
    codeConflicts: exist.map((r) => r.code),
    kpMiss: [...new Set(candidates.map((c) => c.kpCode).filter((k) => !kpSet.has(k)))],
    methodMiss: [
      ...new Set(
        candidates
          .flatMap((c) => [c.methodMain, c.methodAux].filter(Boolean))
          .filter((m) => !methodSet.has(m)),
      ),
    ],
  }
  await conn.end()
} catch (e) {
  db = { error: String(e.message || e) }
}

const gateFailures = []
const soft = []
if (candidates.length !== 500) gateFailures.push('COUNT')
if (!groupMatch) gateFailures.push('GROUP_MERGE')
if (!quotaOk) gateFailures.push('QUOTA')
if (!chapterOk) gateFailures.push('CHAPTER_QUOTA')
if (exactDups.length) gateFailures.push('EXACT_DUP')
if (structMulti.length) soft.push(`STRUCT_FAMILIES_${structMulti.length}`)
if (hpMissing.length) gateFailures.push('HARDPROFILE_INCOMPLETE')
if (hpShaMismatch.length) soft.push('HARDPROFILE_SHA_MISMATCH')
if (weakD3.length) gateFailures.push('WEAK_D3_REMAINING')
if (rubricBad.length) gateFailures.push('RUBRIC_BAD')
if (reqAudit.some((x) => x.verdict === 'ISSUE')) gateFailures.push('REQUIRED_DIAGRAM')
if (adaptErrors) gateFailures.push('ADAPT_ERRORS')
if (db.error) gateFailures.push('DB_ERROR')
if (db.codeConflicts?.length) gateFailures.push('CODE_CONFLICT')
if (db.kpMiss?.length) gateFailures.push('KP_MISS')
if (db.methodMiss?.length) gateFailures.push('METHOD_MISS')

// Author-side: many choice-shell templates remain → honest PARTIAL even if heuristic weak=0
const templateShellN = d3Reviews.filter((r) => r.verdict === 'STILL_WEAK_OR_TEMPLATE').length
const authorTrueN = d3Reviews.filter((r) =>
  ['REBUILT_TRUE_D3_AUTHOR', 'KEPT_TRUE_D3_AUTHOR', 'TRUE_D3_AUTHOR', 'KEPT_D3_AUTHOR'].includes(
    r.verdict,
  ),
).length

const hardBlock = gateFailures.some((f) =>
  ['COUNT', 'GROUP_MERGE', 'DB_ERROR', 'CODE_CONFLICT', 'KP_MISS', 'METHOD_MISS', 'EXACT_DUP'].includes(
    f,
  ),
)
let status
if (hardBlock) status = 'IMPORT_PREFLIGHT_BLOCKED'
else if (gateFailures.length || soft.length || templateShellN > 0) status = 'IMPORT_PREFLIGHT_PARTIAL'
else status = 'IMPORT_PREFLIGHT_PASS'

// Force honesty: if many shells remain, never PASS
if (templateShellN > 10 && status === 'IMPORT_PREFLIGHT_PASS') status = 'IMPORT_PREFLIGHT_PARTIAL'

const preflight = {
  batch: 'GLOBAL-4B-IMPORT-PREFLIGHT',
  recheckAfter: 'GLOBAL-4D-HARD-D3-REBUILD',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  status,
  completedAt: new Date().toISOString(),
  snapshot: {
    batchContentSha256: batchSha,
    mergeFileSha256: shaFile(path.join(qb, 'candidates-g4a-500.mjs')),
    perItemCount: Object.keys(perItem).length,
  },
  quotas,
  quotaOk,
  chapterOk,
  groupMatch,
  dbBaseline: db,
  hardProfile: {
    coverage: `${d3.length - new Set(hpMissing.map((x) => String(x).split(':')[0])).size}/125`,
    missingSample: hpMissing.slice(0, 20),
    shaMismatchN: hpShaMismatch.length,
  },
  weakD3: { n: weakD3.length, ids: weakD3.slice(0, 80) },
  dedup: { exactFamilies: exactDups.length, structFamilies: structMulti.length },
  application: { n: apps.length, rubricBad },
  required: {
    n: req.length,
    pass: reqAudit.filter((x) => x.verdict === 'PASS').length,
    issues: reqAudit.filter((x) => x.verdict === 'ISSUE'),
  },
  adaptErrors,
  adaptSamples,
  gateFailures,
  softFlags: soft,
  openIssues: ['INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED', ...gateFailures, ...soft],
}

const quality = {
  batch: 'GLOBAL-4D-HARD-D3-REBUILD',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  status,
  completedAt: new Date().toISOString(),
  classifySummary: classify.summary,
  rebuiltN: d3Reviews.filter((r) => r.rebuilt).length,
  d3Total: d3.length,
  hardProfileCoverage: preflight.hardProfile.coverage,
  weakD3HeuristicRemaining: weakD3.length,
  weakD3Ids: weakD3,
  templateShellOrWeakVerdictN: templateShellN,
  authorSideTrueOrKeptN: authorTrueN,
  required: preflight.required,
  quotas,
  snapshot: preflight.snapshot,
  gateFailures,
  softFlags: soft,
  note: '作者侧重建与复核；不得冒充独立终审。若仍有模板壳/弱题则 PARTIAL。',
}

fs.writeFileSync(path.join(qb, 'global4b_import_preflight_results.json'), JSON.stringify(preflight, null, 2))
fs.writeFileSync(path.join(qb, 'global4d_hard_d3_results.json'), JSON.stringify(quality, null, 2))
fs.writeFileSync(
  path.join(__dirname, '_4d_d3_reviews.json'),
  JSON.stringify(
    {
      batch: 'GLOBAL-4D-HARD-D3-REBUILD',
      independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
      batchContentSha256: batchSha,
      n: d3Reviews.length,
      reviews: d3Reviews,
    },
    null,
    2,
  ),
)
fs.writeFileSync(
  path.join(qb, 'bank_global4a/_preflight_audits/snapshot_per_item.json'),
  JSON.stringify({ batchContentSha256: batchSha, perItem }, null, 2),
)
fs.writeFileSync(
  path.join(qb, 'bank_global4a/_preflight_audits/summary.json'),
  JSON.stringify(
    { status, gateFailures, soft, required: preflight.required, weakN: weakD3.length, batchSha },
    null,
    2,
  ),
)

console.log(
  JSON.stringify(
    {
      status,
      gateFailures,
      soft,
      weakN: weakD3.length,
      templateShellN,
      rebuiltN: quality.rebuiltN,
      hp: preflight.hardProfile.coverage,
      required: `${preflight.required.pass}/${preflight.required.n}`,
      adaptErrors,
      db: db.drawable ?? db.error,
      batchSha: batchSha.slice(0, 16),
    },
    null,
    2,
  ),
)
