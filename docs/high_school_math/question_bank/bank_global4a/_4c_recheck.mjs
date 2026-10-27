/**
 * GLOBAL-4C post-fix recheck → refresh preflight JSON + 4C quality summary.
 * Read-only MySQL. No writes to DB.
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
const inv = JSON.parse(fs.readFileSync(path.join(__dirname, '_4c_problem_inventory.json'), 'utf8'))
const falseHardOrig = inv.inventory
  .filter((x) => x.reasons.includes('FALSE_HARD_LIST'))
  .map((x) => x.id)

const perItem = {}
for (const c of candidates) perItem[c.id] = shaText(stable(c))
const batchSha = shaText(Object.entries(perItem).map(([id, h]) => `${id}:${h}`).join('\n'))

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

function isWeakD3(c) {
  const s = String(c.stem)
  const a = String(c.analysis)
  if (c.qtype === 'judge' && s.length < 50 && a.length < 60) return true
  if (a.length < 30) return true
  if (/空集是任何集合|必然事件的概率为|两点确定一条直线|系统抽样属于|i\^4=1|袋中有 3 红|表面积为/.test(s))
    return true
  if (/^方程 \$\\log_\{2\}\(x-1\)=3\$/.test(s)) return true
  if (/手修差异化压轴|紧急去重/.test(String(c.hardProfile?.coreChallenge || '')) && a.length < 50)
    return true
  return false
}
const weakD3 = d3.filter(isWeakD3).map((c) => c.id)

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
  reqAudit.push({ id: c.id, verdict: issues.length ? 'ISSUE' : 'PASS', issues })
}

// adapt dry-run minimal
const NUMERIC_RE = /^[+-]?(?:\d+(?:\.\d{1,8})?|\.\d{1,8}|\d+\/[1-9]\d*)$/
let adaptErrors = 0
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
  } catch {
    adaptErrors++
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
if (falseHardOrig.some((id) => {
  const c = candidates.find((x) => x.id === id)
  return c && Number(c.difficulty) === 3 && isWeakD3(c)
})) {
  soft.push('SOME_ORIG_FALSEHARD_STILL_WEAK')
}

// WEAK_D3 / REQUIRED / RUBRIC / HARDPROFILE / QUOTA → PARTIAL (quality)
// structural integrity failures → BLOCKED
const hardBlock = gateFailures.some((f) =>
  ['COUNT', 'GROUP_MERGE', 'DB_ERROR', 'CODE_CONFLICT', 'KP_MISS', 'METHOD_MISS', 'EXACT_DUP'].includes(
    f,
  ),
)
let status
if (hardBlock) status = 'IMPORT_PREFLIGHT_BLOCKED'
else if (gateFailures.length || soft.length) status = 'IMPORT_PREFLIGHT_PARTIAL'
else status = 'IMPORT_PREFLIGHT_PASS'

const preflight = {
  batch: 'GLOBAL-4B-IMPORT-PREFLIGHT',
  recheckAfter: 'GLOBAL-4C-D3-QUALITY-FIX',
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
  weakD3: { n: weakD3.length, ids: weakD3 },
  dedup: { exactFamilies: exactDups.length, structFamilies: structMulti.length },
  application: { n: apps.length, rubricBad },
  required: {
    n: req.length,
    pass: reqAudit.filter((x) => x.verdict === 'PASS').length,
    issues: reqAudit.filter((x) => x.verdict === 'ISSUE'),
  },
  adaptErrors,
  gateFailures,
  softFlags: soft,
  openIssues: ['INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED', ...gateFailures, ...soft],
}

const quality = {
  batch: 'GLOBAL-4C-D3-QUALITY-FIX-AND-RECHECK',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  status,
  completedAt: new Date().toISOString(),
  originalFalseHard16: falseHardOrig,
  falseHardStillWeak: falseHardOrig.filter((id) => weakD3.includes(id)),
  hardProfileCoverage: preflight.hardProfile.coverage,
  d3Total: d3.length,
  weakD3Remaining: weakD3.length,
  weakD3Ids: weakD3,
  rewrittenApprox: inv.summary?.REWRITE_HARD ?? null,
  issue142:
    candidates.find((c) => c.id === 'CAND-G4A-142')?.stem?.slice(0, 80) || null,
  issue417:
    candidates.find((c) => c.id === 'CAND-G4A-417')?.stem?.slice(0, 80) || null,
  issue142diff: candidates.find((c) => c.id === 'CAND-G4A-142')?.difficulty,
  issue417diff: candidates.find((c) => c.id === 'CAND-G4A-417')?.difficulty,
  applicationRubricBad: rubricBad,
  exactDups: exactDups.length,
  structFamilies: structMulti.length,
  requiredFinal: req.length,
  batchSha,
  db,
  adaptErrors,
  gateFailures,
  softFlags: soft,
  note: '质量优先：仍有虚标/弱压轴残留，不得标 PASS',
}

fs.writeFileSync(path.join(qb, 'global4b_import_preflight_results.json'), JSON.stringify(preflight, null, 2))
fs.writeFileSync(path.join(qb, 'global4c_d3_quality_results.json'), JSON.stringify(quality, null, 2))
fs.writeFileSync(
  path.join(qb, 'bank_global4a/_preflight_audits/snapshot_per_item.json'),
  JSON.stringify(perItem, null, 2),
)

console.log(
  JSON.stringify(
    {
      status,
      gateFailures,
      soft,
      weakD3: weakD3.length,
      hp: preflight.hardProfile.coverage,
      required: `${preflight.required.pass}/${preflight.required.n}`,
      exactDups: exactDups.length,
      struct: structMulti.length,
      drawable: db.drawable,
      batchSha: batchSha.slice(0, 16),
      issue142d: quality.issue142diff,
      issue417d: quality.issue417diff,
    },
    null,
    2,
  ),
)
