/**
 * GLOBAL-4E Gate0: RO safety — SHA, quotas, REQUIRED, DB, adapt, API health.
 * Exit 0 only if all pass. No writes to DB/items.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const docs = path.resolve(__dirname, '..')
const qb = __dirname
const diag = path.join(docs, 'diagrams/required_g4a')
const EXPECTED_BATCH_SHA =
  'def9b8c49ac641de72632f09c8bfd2aeb0554d945be10db853667e88d9c5ab15'
const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'

const report = {
  phase: 'GLOBAL-4E-GATE0',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  startedAt: new Date().toISOString(),
  ok: false,
  errors: [],
}

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
    pathToFileURL(path.join(qb, 'bank_global4a', `g4a_group0${g}.mjs`)).href +
      '?t=' +
      Date.now()
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
report.batchContentSha256 = batchSha
if (batchSha !== EXPECTED_BATCH_SHA) {
  report.errors.push(`BATCH_SHA_MISMATCH got=${batchSha}`)
}

if (candidates.length !== 500) report.errors.push('COUNT_NOT_500')
const ids = candidates.map((c) => c.id)
if (new Set(ids).size !== 500) report.errors.push('ID_NOT_UNIQUE')
if (!ids.every((id, i) => id === `CAND-G4A-${String(i + 1).padStart(3, '0')}`)) {
  report.errors.push('ID_SEQUENCE')
}

const quotas = { d: {}, qt: {}, ch: {} }
for (const c of candidates) {
  quotas.d[c.difficulty] = (quotas.d[c.difficulty] || 0) + 1
  quotas.qt[c.qtype] = (quotas.qt[c.qtype] || 0) + 1
  quotas.ch[c.chapterNo] = (quotas.ch[c.chapterNo] || 0) + 1
}
report.quotas = quotas
if (
  quotas.d[1] !== 175 ||
  quotas.d[2] !== 200 ||
  quotas.d[3] !== 125 ||
  quotas.qt.single !== 150 ||
  quotas.qt.multi !== 75 ||
  quotas.qt.judge !== 50 ||
  quotas.qt.numeric !== 100 ||
  quotas.qt.application !== 125
) {
  report.errors.push('QUOTA')
}
const chapterTarget = { 1: 29, 2: 48, 3: 55, 4: 67, 5: 76, 6: 67, 7: 20, 8: 68, 9: 30, 10: 40 }
if (!Object.entries(chapterTarget).every(([k, v]) => quotas.ch[k] === v)) {
  report.errors.push('CHAPTER_QUOTA')
}
const groupMatch =
  groups.every((g) => g.length === 100) &&
  groups.flat().every((c, i) => c.id === candidates[i].id && stable(c) === stable(candidates[i]))
if (!groupMatch) report.errors.push('GROUP_MERGE')

const d3 = candidates.filter((c) => Number(c.difficulty) === 3)
let hpOk = 0
let hpShaBad = 0
for (const c of d3) {
  const hp = c.hardProfile
  if (
    hp &&
    hp.coreChallenge &&
    hp.reasoningSteps &&
    hp.difficultyEvidence &&
    hp.misconceptionTrap &&
    hp.alternativeApproach &&
    hp.verification &&
    hp.contentSha256
  ) {
    hpOk++
    if (hp.contentSha256 !== perItem[c.id]) hpShaBad++
  }
}
report.hardProfile = { ok: hpOk, shaMismatch: hpShaBad }
if (hpOk !== 125) report.errors.push('HARDPROFILE')
if (hpShaBad) report.errors.push('HARDPROFILE_SHA')

const manifest = JSON.parse(fs.readFileSync(path.join(diag, '_manifest.json'), 'utf8'))
const req = candidates.filter((c) => c.diagramRequirement === 'REQUIRED')
report.required = { n: req.length, manifestN: (manifest.items || []).length }
if (req.length !== 27 || (manifest.items || []).length !== 27) {
  report.errors.push('REQUIRED_COUNT')
}
for (const c of req) {
  const man = (manifest.items || []).find((x) => x.code === c.id)
  const svgP = path.join(diag, `${c.id}.svg`)
  const pngP = path.join(diag, `${c.id}.png`)
  if (!fs.existsSync(svgP) || !fs.existsSync(pngP)) {
    report.errors.push(`REQ_FILE:${c.id}`)
    continue
  }
  if (!man) {
    report.errors.push(`REQ_MANIFEST:${c.id}`)
    continue
  }
  if (shaFile(svgP) !== man.sha256_svg) report.errors.push(`REQ_SVG_SHA:${c.id}`)
  if (shaFile(pngP) !== man.sha256_png) report.errors.push(`REQ_PNG_SHA:${c.id}`)
}

const g4b = JSON.parse(
  fs.readFileSync(path.join(qb, 'global4b_import_preflight_results.json'), 'utf8'),
)
const g4d = JSON.parse(fs.readFileSync(path.join(qb, 'global4d_hard_d3_results.json'), 'utf8'))
if (g4b.status !== 'IMPORT_PREFLIGHT_PASS' || g4d.status !== 'IMPORT_PREFLIGHT_PASS') {
  report.errors.push('PREFLIGHT_NOT_PASS')
}
if ((g4d.weakD3HeuristicRemaining ?? 1) !== 0) report.errors.push('WEAK_D3_REMAINING')

const adaptRun = spawnSync(process.execPath, [path.join(qb, '_g4e_adapt.mjs')], {
  cwd: root,
  encoding: 'utf8',
})
report.adaptExit = adaptRun.status
if (adaptRun.status !== 0) {
  report.errors.push(`ADAPT_FAIL:${(adaptRun.stderr || adaptRun.stdout || '').slice(0, 400)}`)
}

const env = loadEnv()
try {
  const health = await fetch(`${BASE}/health`)
  report.apiHealth = health.status
  if (health.status !== 200) report.errors.push(`API_HEALTH_${health.status}`)
} catch (e) {
  report.errors.push(`API_DOWN:${String(e.message || e)}`)
}

if (!env.JWT_SECRET) report.errors.push('JWT_SECRET')

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
  const [[g4a]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-G4A-%'`,
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
  const kpMiss = [...new Set(candidates.map((c) => c.kpCode).filter((k) => !kpSet.has(k)))]
  const methodMiss = [
    ...new Set(
      candidates
        .flatMap((c) => [c.methodMain, c.methodAux].filter(Boolean))
        .filter((m) => !methodSet.has(m)),
    ),
  ]
  const [[sessions]] = await conn.query(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)
  const [[sessionItems]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_session_items`,
  )
  const [admins] = await conn.query(
    `SELECT id FROM users WHERE role='ADMIN' ORDER BY id ASC LIMIT 1`,
  )
  report.db = {
    drawable: Number(drawable.n),
    g4aExisting: Number(g4a.n),
    codeConflicts: exist.map((r) => r.code),
    kpMiss,
    methodMiss,
    sessions: Number(sessions.n),
    sessionItems: Number(sessionItems.n),
    adminId: admins[0] ? String(admins[0].id) : null,
  }
  await conn.end()
  if (report.db.drawable !== 313) report.errors.push(`DRAWABLE_${report.db.drawable}`)
  if (report.db.g4aExisting !== 0) report.errors.push(`G4A_ALREADY_${report.db.g4aExisting}`)
  if (report.db.codeConflicts.length) report.errors.push('CODE_CONFLICT')
  if (report.db.kpMiss.length) report.errors.push('KP_MISS')
  if (report.db.methodMiss.length) report.errors.push('METHOD_MISS')
  if (!report.db.adminId) report.errors.push('NO_ADMIN')
} catch (e) {
  report.errors.push(`DB:${String(e.message || e)}`)
}

report.ok = report.errors.length === 0
report.endedAt = new Date().toISOString()
const out = path.join(qb, 'bank_global4a/_g4e_gate0_ro.json')
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, JSON.stringify(report, null, 2))
console.log(JSON.stringify({ ok: report.ok, errors: report.errors, batchSha, db: report.db }, null, 2))
process.exit(report.ok ? 0 : 2)
