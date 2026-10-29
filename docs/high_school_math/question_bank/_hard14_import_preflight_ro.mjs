/**
 * HS-MATH-HARD-CH1-4-IMPORT-PREFLIGHT-1C — readonly structural/DB/adapt/dedup.
 * Does NOT write MySQL. Does NOT modify candidates.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'
import { contentPayload, sha256 } from './_hard14_lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = __dirname

const { candidates, batchContentSha256, phase, independence, status } =
  await import(
    pathToFileURL(path.join(qb, 'hard_ch1_4_batch1a_candidates.mjs')).href +
      '?t=' +
      Date.now()
  )

const designs = JSON.parse(
  fs.readFileSync(path.join(qb, 'hard_ch1_4_designs.json'), 'utf8'),
)
const designQuality = JSON.parse(
  fs.readFileSync(path.join(qb, 'hard_ch1_4_design_quality.json'), 'utf8'),
)
const candQuality = JSON.parse(
  fs.readFileSync(path.join(qb, 'hard_ch1_4_batch1a_quality_results.json'), 'utf8'),
)
const downgradeRecs = JSON.parse(
  fs.readFileSync(path.join(qb, 'hard_difficulty_final_recommendations.json'), 'utf8'),
)

const CODE_RE = /^[A-Za-z][A-Za-z0-9._-]{1,62}$/
const NUMERIC_VALUE_RE =
  /^[+-]?(?:\d+(?:\.\d{1,8})?|\.\d{1,8}|\d+\/[1-9]\d*)$/

function normStem(s) {
  return String(s || '')
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/\$[^$]*\$/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

function fingerprintLike(c) {
  return sha256({
    code: c.id,
    specialtyCode: c.specialtyCode,
    categoryCode: c.sectionCode,
    qtype: c.qtype,
    difficulty: c.difficulty,
    stem: c.stem,
    options: c.options ?? null,
    answer: c.answer,
    analysis: c.analysis,
    kp: c.kpCode,
  })
}

/** Offline adapt: candidate → import protocol (hardLevel stripped). */
function adaptCandidate(c) {
  const methodCodes = [...new Set([c.methodMain, c.methodAux].filter(Boolean))]
  const base = {
    code: String(c.id).trim(),
    specialtyCode: String(c.specialtyCode).trim(),
    categoryCode: String(c.sectionCode).trim(),
    qtype: c.qtype,
    difficulty: Number(c.difficulty),
    stem: String(c.stem),
    analysis: String(c.analysis || '').trim(),
    knowledgePointCodes: [String(c.kpCode).trim()],
    primaryKnowledgePointCode: String(c.kpCode).trim(),
    methodCodes,
    primaryMethodCode: String(c.methodMain).trim(),
    sourceType: c.sourceType || 'original',
    sourceReference: c.sourceEvidence || null,
    sourceVerificationStatus: 'unverified',
    sourceLicenseStatus: 'unknown',
    // hardLevel intentionally OMITTED — not in Admin import protocol
  }
  if (c.qtype === 'single') {
    return {
      ...base,
      options: {
        options: Object.entries(c.options || {}).map(([id, text]) => ({
          id,
          text: String(text),
        })),
      },
      answerPayload: { kind: 'single', optionId: String(c.answer).trim() },
    }
  }
  if (c.qtype === 'multi') {
    return {
      ...base,
      options: {
        options: Object.entries(c.options || {}).map(([id, text]) => ({
          id,
          text: String(text),
        })),
      },
      answerPayload: {
        kind: 'multi',
        optionIds: String(c.answer)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      },
    }
  }
  if (c.qtype === 'judge') {
    let raw = String(c.answer).trim().toLowerCase()
    if (raw === '真' || raw === '对') raw = 'true'
    if (raw === '假' || raw === '错') raw = 'false'
    if (raw !== 'true' && raw !== 'false') {
      throw new Error(`judge answer must be true/false (got ${c.answer})`)
    }
    return {
      ...base,
      options: null,
      answerPayload: { kind: 'judge', value: raw === 'true' },
    }
  }
  if (c.qtype === 'numeric') {
    const value = String(c.answer).trim()
    if (!NUMERIC_VALUE_RE.test(value)) {
      throw new Error(`numeric illegal for import protocol: ${value}`)
    }
    return {
      ...base,
      options: null,
      answerPayload: { kind: 'numeric', value, toleranceAbs: 0, toleranceRel: 0 },
    }
  }
  if (c.qtype === 'application') {
    const rubric = (c.rubric || []).map((r, i) => {
      const step = String(r.step ?? r.title ?? '').trim()
      const key =
        String(r.key || '').trim() ||
        `s${i + 1}_${step.slice(0, 24).replace(/\s+/g, '_') || 'step'}`
      return {
        key,
        title: step || `步骤${i + 1}`,
        maxScore: Number(r.score ?? r.maxScore),
        criteria: String(r.criteria ?? r.criterion ?? step).trim() || step,
      }
    })
    const maxScore = Number(c.maxScore)
    const sum = rubric.reduce((s, x) => s + x.maxScore, 0)
    if (!Number.isInteger(maxScore) || maxScore <= 0) {
      throw new Error(`bad maxScore`)
    }
    if (sum !== maxScore) throw new Error(`rubric sum ${sum} != maxScore ${maxScore}`)
    if (rubric.some((r) => !r.key || !r.title || !Number.isInteger(r.maxScore))) {
      throw new Error('rubric field incomplete after map')
    }
    return {
      ...base,
      options: null,
      answerPayload: {
        kind: 'application',
        standardAnswer: String(c.answer),
        maxScore,
        rubric,
      },
    }
  }
  throw new Error(`unsupported qtype ${c.qtype}`)
}

// ——— 1. Consistency + SHA ———
const designList = Array.isArray(designs)
  ? designs
  : designs.designs || designs.items || []
const designById = new Map(designList.map((d) => [d.id || d.designId, d]))

const ch = { 1: 0, 2: 0, 3: 0, 4: 0 }
const hl = { H1: 0, H2: 0, H3: 0 }
const qt = {}
const ids = new Set()
const shaMismatch = []
const designMapIssues = []
const itemShas = []

for (const c of candidates) {
  if (ids.has(c.id)) designMapIssues.push(`dup_id:${c.id}`)
  ids.add(c.id)
  ch[c.chapterNo] = (ch[c.chapterNo] || 0) + 1
  hl[c.hardLevel] = (hl[c.hardLevel] || 0) + 1
  qt[c.qtype] = (qt[c.qtype] || 0) + 1
  const s = sha256(contentPayload(c))
  itemShas.push({ id: c.id, contentSha256: s })
  if (s !== c.hardProfile?.contentSha256) {
    shaMismatch.push(c.id)
  }
  const expectDesign = `HARD-DESIGN-${c.id.slice(-3)}`
  if (c.designId !== expectDesign) {
    designMapIssues.push(`map:${c.id}->${c.designId}`)
  }
  if (!designById.has(c.designId) && designList.length) {
    // designs may use designId field
    const hit = designList.find(
      (d) => d.id === c.designId || d.designId === c.designId,
    )
    if (!hit) designMapIssues.push(`missing_design:${c.designId}`)
  }
}

const batchRecompute = sha256(
  candidates.map((c) => c.hardProfile.contentSha256).join('|'),
)
const designMapSha = sha256(
  candidates.map((c) => `${c.designId}->${c.id}`).join('|'),
)
const qualityEvidenceSha = sha256({
  candQualityShaHint: candQuality.batchContentSha256 || candQuality.status,
  designQualityStatus: designQuality.status || designQuality.phase,
  itemContentShas: itemShas.map((x) => x.contentSha256),
})
const designsFileSha = sha256(
  fs.readFileSync(path.join(qb, 'hard_ch1_4_designs.json')),
)
const qualityFileSha = sha256(
  fs.readFileSync(path.join(qb, 'hard_ch1_4_batch1a_quality_results.json')),
)

const consistency = {
  count: candidates.length,
  idUnique: ids.size === candidates.length,
  chapterQuota: ch,
  chapterOk: ch[1] === 10 && ch[2] === 35 && ch[3] === 40 && ch[4] === 15,
  hardLevelQuota: hl,
  // FIX-1D: H3 may be 0; do not force old 32/45/23 quota
  hardLevelOk: hl.H1 + hl.H2 + (hl.H3 || 0) === 100 && (hl.H3 || 0) >= 0,
  qtypeCounts: qt,
  qtypeOk: ['application', 'numeric', 'single', 'multi', 'judge'].every(
    (k) => (qt[k] || 0) > 0,
  ),
  allDifficulty3: candidates.every((c) => c.difficulty === 3),
  hardProfile100: candidates.every((c) => !!c.hardProfile?.contentSha256),
  shaMismatch,
  batchContentSha256,
  batchRecompute,
  batchShaOk: batchContentSha256 === batchRecompute,
  designMapSha,
  qualityEvidenceSha,
  designsFileSha,
  qualityFileSha,
  designMapIssues: designMapIssues.slice(0, 20),
  codeFormatBad: candidates.filter((c) => !CODE_RE.test(c.id)).map((c) => c.id),
}

// ——— 2. MySQL RO ———
const conn = await createConnection({
  host: '127.0.0.1',
  port: 3306,
  user: 'study_user',
  password: 'Hw@2026',
  database: 'study_system',
  charset: 'utf8mb4',
})

async function one(sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows[0]
}
async function many(sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows
}

const drawable = Number(
  (
    await one(
      "SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1",
    )
  ).n,
)
const [[drow]] = await conn.query(
  `SELECT
     SUM(difficulty=1) AS d1,
     SUM(difficulty=2) AS d2,
     SUM(difficulty=3) AS d3
   FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1`,
)
const byDiff = {
  1: Number(drow.d1),
  2: Number(drow.d2),
  3: Number(drow.d3),
}

const idList = [...ids]
const codeConflicts = await many(
  `SELECT code, status, pool, is_active, difficulty FROM hs_math_train_items WHERE code IN (${idList
    .map(() => '?')
    .join(',')})`,
  idList,
)

const specs = await many(
  'SELECT id, code, name, is_active FROM hs_math_specialties ORDER BY code',
)
const cats = await many(
  `SELECT c.id, c.code, c.name, c.is_active, s.code AS specialty_code
   FROM hs_math_categories c
   JOIN hs_math_specialties s ON s.id=c.specialty_id`,
)
const catKey = new Set(cats.map((c) => `${c.specialty_code}::${c.code}`))
const specByCode = new Map(specs.map((s) => [s.code, s]))

const kpCodes = [...new Set(candidates.map((c) => c.kpCode))]
const kps = await many(
  `SELECT code, is_active FROM hs_math_knowledge_points WHERE code IN (${kpCodes
    .map(() => '?')
    .join(',')})`,
  kpCodes,
)
const kpMap = new Map(kps.map((k) => [k.code, k]))
const kpMiss = kpCodes.filter((c) => !kpMap.has(c))
const kpInactive = kps.filter((k) => !Number(k.is_active)).map((k) => k.code)

const methods = await many('SELECT code, is_active FROM hs_math_methods')
const mActive = new Set(
  methods.filter((m) => Number(m.is_active)).map((m) => m.code),
)
const methodMiss = [
  ...new Set(
    candidates.flatMap((c) => [c.methodMain, c.methodAux].filter(Boolean)),
  ),
].filter((m) => !mActive.has(m))

const catMiss = []
const spMiss = []
for (const c of candidates) {
  if (!specByCode.get(c.specialtyCode) || !Number(specByCode.get(c.specialtyCode).is_active)) {
    spMiss.push(c.id)
  }
  if (!catKey.has(`${c.specialtyCode}::${c.sectionCode}`)) {
    catMiss.push({ id: c.id, key: `${c.specialtyCode}::${c.sectionCode}` })
  }
}

// hardLevel column?
const cols = await many('SHOW COLUMNS FROM hs_math_train_items')
const colNames = cols.map((c) => c.Field)
const hasHardLevelCol = colNames.includes('hard_level') || colNames.includes('hardLevel')

const formal = await many(
  `SELECT id, code, qtype, difficulty, stem
   FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1`,
)

const formalNorm = formal.map((f) => ({
  id: f.id,
  code: f.code,
  difficulty: f.difficulty,
  qtype: f.qtype,
  n: normStem(f.stem),
}))

const exactStemHits = []
const semanticHits = []
const fpHits = [] // live DB has no content_fingerprint column; stem-norm only
for (const c of candidates) {
  const n = normStem(c.stem)
  for (const f of formalNorm) {
    if (n.length >= 24 && f.n === n) {
      exactStemHits.push({ cand: c.id, formalId: f.id, formalCode: f.code, kind: 'EXACT_STEM' })
    } else if (
      n.length >= 40 &&
      f.n.length >= 40 &&
      (f.n.includes(n) || n.includes(f.n))
    ) {
      semanticHits.push({
        cand: c.id,
        formalId: f.id,
        formalCode: f.code,
        kind: 'STEM_CONTAIN',
      })
    }
  }
}

// intra-batch stem near-dup
const intraDup = []
for (let i = 0; i < candidates.length; i++) {
  const ni = normStem(candidates[i].stem)
  for (let j = i + 1; j < candidates.length; j++) {
    const nj = normStem(candidates[j].stem)
    if (ni === nj) {
      intraDup.push({ a: candidates[i].id, b: candidates[j].id, kind: 'EXACT' })
    }
  }
}

// modelFamily collisions
const fam = new Map()
for (const c of candidates) {
  const k = c.modelFamily || '_none'
  if (!fam.has(k)) fam.set(k, [])
  fam.get(k).push(c.id)
}
const famMulti = [...fam.entries()].filter(([, v]) => v.length > 1)

await conn.end()

const dbBaseline = {
  drawable,
  byDifficulty: byDiff,
  baselineOk: drawable === 813 && byDiff[1] === 335 && byDiff[2] === 478 && byDiff[3] === 0,
  codeConflicts,
  kpMiss,
  kpInactive,
  methodMiss,
  catMiss,
  spMiss,
  hasHardLevelCol,
  hardLevelPersistenceNote:
    'Admin HsMathImportItem has no hardLevel; column absent in DB. Persist H1/H2/H3 only in offline evidence (candidates.mjs hardProfile + preflight/quality JSON). Import must strip hardLevel.',
}

// ——— 3. Adapt dry-run ———
const adaptErrors = []
const adapted = []
const strippedUnknown = []
for (const c of candidates) {
  try {
    const item = adaptCandidate(c)
    if ('hardLevel' in item) strippedUnknown.push(c.id)
    adapted.push(item)
  } catch (e) {
    adaptErrors.push({ id: c.id, qtype: c.qtype, err: String(e.message || e) })
  }
}

const numericProtocolBad = candidates
  .filter((c) => c.qtype === 'numeric')
  .filter((c) => !NUMERIC_VALUE_RE.test(String(c.answer).trim()))
  .map((c) => ({ id: c.id, answer: c.answer }))

const appRubricOffline = []
for (const c of candidates.filter((x) => x.qtype === 'application')) {
  const sum = (c.rubric || []).reduce((s, r) => s + Number(r.score), 0)
  const shape = Object.keys((c.rubric || [])[0] || {})
  const issues = []
  if (sum !== Number(c.maxScore)) issues.push('sum_ne_max')
  if (!shape.includes('step') && !shape.includes('key')) issues.push('no_step_or_key')
  // fairness heuristics
  for (const r of c.rubric || []) {
    const t = String(r.step || '')
    if (/抄写|照抄题干|重述题干/.test(t)) issues.push('copy_stem_score')
  }
  if (issues.length) appRubricOffline.push({ id: c.id, issues, sum, maxScore: c.maxScore })
}

// diagram rejudge heuristics (structural; human override in review JSON)
const diagramFlags = candidates.map((c) => {
  const stem = c.stem || ''
  const flags = []
  if (/图象|图像|数形|圆心|圆盘/.test(stem)) flags.push('graph_language')
  if (/恰有一|两根|根的分布|开区间.*根/.test(stem)) flags.push('root_distribution')
  if (/分段|绝对值为/.test(stem) && /讨论|分类/.test(stem)) flags.push('piecewise')
  return {
    id: c.id,
    labeled: c.diagramRequirement,
    heuristicFlags: flags,
    suggestRequired:
      c.diagramRequirement === 'REQUIRED' ||
      (flags.includes('graph_language') && /作出|根据图|如图/.test(stem)),
  }
})

const requiredLabeled = candidates.filter((c) => c.diagramRequirement === 'REQUIRED')
const recommendedLabeled = candidates.filter(
  (c) => c.diagramRequirement === 'RECOMMENDED',
)

// downgrade contrast sample refs
const d2Samples = (downgradeRecs.recommendations || [])
  .filter((r) => r.recommendedDifficulty === 2)
  .slice(0, 30)
  .map((r) => ({
    itemId: r.itemId,
    code: r.code,
    specialtyCode: r.specialtyCode,
    reason: r.difficultyReason || r.keyReasoning,
  }))

const out = {
  phase: 'HS-MATH-HARD-CH1-4-IMPORT-PREFLIGHT-1C',
  independence,
  candidatePhase: phase,
  candidateStatus: status,
  auditedAt: new Date().toISOString(),
  snapshot: {
    batchContentSha256,
    batchRecompute,
    designMapSha,
    qualityEvidenceSha,
    designsFileSha,
    qualityFileSha,
    perItem: itemShas,
  },
  consistency,
  dbBaseline,
  adaptDryRun: {
    adaptedN: adapted.length,
    adaptErrors,
    numericProtocolBad,
    appRubricOffline,
    hardLevelStripped: true,
    hasHardLevelCol,
    note: 'Mapper converts rubric.step→key/title/criteria; numeric LaTeX/中文 answers fail protocol until candidate fix (forbidden this phase).',
  },
  dedup: {
    fingerprintVs813: fpHits,
    exactStemVs813: exactStemHits,
    semanticContainVs813: semanticHits.slice(0, 50),
    intraBatchExact: intraDup,
    modelFamilyMulti: famMulti.slice(0, 30),
  },
  diagram: {
    requiredLabeledN: requiredLabeled.length,
    recommendedLabeledN: recommendedLabeled.length,
    recommendedIds: recommendedLabeled.map((c) => c.id),
    heuristic: diagramFlags.filter((d) => d.heuristicFlags.length),
  },
  downgradeContrastPool: d2Samples,
  gateHints: {
    structuralConsistencyOk:
      consistency.count === 100 &&
      consistency.chapterOk &&
      consistency.hardLevelOk &&
      consistency.qtypeOk &&
      consistency.allDifficulty3 &&
      consistency.hardProfile100 &&
      consistency.shaMismatch.length === 0 &&
      consistency.batchShaOk,
    dbBaselineOk: dbBaseline.baselineOk && codeConflicts.length === 0 && kpMiss.length === 0 && methodMiss.length === 0 && catMiss.length === 0,
    adaptOk: adaptErrors.length === 0 && adapted.length === 100,
    numericProtocolOk: numericProtocolBad.length === 0,
  },
}

fs.writeFileSync(
  path.join(qb, '_hard14_import_preflight_ro_out.json'),
  JSON.stringify(out, null, 2),
)
console.log(
  JSON.stringify(
    {
      drawable: dbBaseline.drawable,
      byDiff,
      structuralOk: out.gateHints.structuralConsistencyOk,
      dbOk: out.gateHints.dbBaselineOk,
      adaptOk: out.gateHints.adaptOk,
      adaptErrorsN: adaptErrors.length,
      numericBadN: numericProtocolBad.length,
      numericBad: numericProtocolBad,
      codeConflicts: codeConflicts.length,
      kpMiss,
      methodMiss,
      catMissN: catMiss.length,
      exactHits: exactStemHits.length,
      batchSha: batchContentSha256,
    },
    null,
    2,
  ),
)
