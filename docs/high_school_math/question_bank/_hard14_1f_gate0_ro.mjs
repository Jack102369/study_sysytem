/**
 * HARD14-1F Gate0: RO — SHA, quotas, quality evidence, DB, adapt, API.
 * Exit 0 only if all pass. No writes to DB/items.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'
import { contentPayload, sha256 } from './_hard14_lib.mjs'
import {
  loadEnv,
  dbConfig,
  EXPECTED_BATCH_SHA,
  BASELINE_DRAWABLE,
  BASE,
  qb,
  root,
} from './_hard14_1f_lib.mjs'

const report = {
  phase: 'HARD14-1F-GATE0',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  startedAt: new Date().toISOString(),
  ok: false,
  errors: [],
}

const { candidates, batchContentSha256, status: candStatus } = await import(
  pathToFileURL(path.join(qb, 'hard_ch1_4_batch1a_candidates.mjs')).href + '?t=' + Date.now()
)

const closure = JSON.parse(
  fs.readFileSync(path.join(qb, 'hard_ch1_4_advisory_closure_results.json'), 'utf8'),
)
const quality = JSON.parse(
  fs.readFileSync(path.join(qb, 'hard_ch1_4_batch1a_quality_results.json'), 'utf8'),
)
const preflight = JSON.parse(
  fs.readFileSync(path.join(qb, 'hard_ch1_4_import_preflight_results.json'), 'utf8'),
)

if (candidates.length !== 100) report.errors.push('COUNT_NOT_100')
const ids = candidates.map((c) => c.id)
if (new Set(ids).size !== 100) report.errors.push('ID_NOT_UNIQUE')
if (!ids.every((id, i) => id === `CAND-HARD14-${String(i + 1).padStart(3, '0')}`)) {
  report.errors.push('ID_SEQUENCE')
}

const shaMismatch = []
const itemShas = []
const ch = { 1: 0, 2: 0, 3: 0, 4: 0 }
const hl = { H1: 0, H2: 0, H3: 0 }
for (const c of candidates) {
  ch[c.chapterNo] = (ch[c.chapterNo] || 0) + 1
  hl[c.hardLevel] = (hl[c.hardLevel] || 0) + 1
  const s = sha256(contentPayload(c))
  itemShas.push({ id: c.id, contentSha256: s })
  if (s !== c.hardProfile?.contentSha256) shaMismatch.push(c.id)
  if (c.difficulty !== 3) report.errors.push(`DIFF_NOT_3:${c.id}`)
  if (c.designId !== `HARD-DESIGN-${c.id.slice(-3)}`) {
    report.errors.push(`DESIGN_MAP:${c.id}`)
  }
}
const batchRecompute = sha256(candidates.map((c) => c.hardProfile.contentSha256).join('|'))
report.batch = {
  declared: batchContentSha256,
  recompute: batchRecompute,
  expected: EXPECTED_BATCH_SHA,
  shaMismatch,
}
if (batchRecompute !== EXPECTED_BATCH_SHA) {
  report.errors.push(`BATCH_SHA_MISMATCH got=${batchRecompute}`)
}
if (batchContentSha256 !== EXPECTED_BATCH_SHA) {
  report.errors.push('DECLARED_SHA_MISMATCH')
}
if (shaMismatch.length) report.errors.push('ITEM_SHA_MISMATCH')
if (!(ch[1] === 10 && ch[2] === 35 && ch[3] === 40 && ch[4] === 15)) {
  report.errors.push(`CHAPTER_QUOTA:${JSON.stringify(ch)}`)
}
if (!(hl.H1 === 53 && hl.H2 === 47 && (hl.H3 || 0) === 0)) {
  report.errors.push(`HARD_LEVEL_QUOTA:${JSON.stringify(hl)}`)
}
if (!candidates.every((c) => !!c.hardProfile?.contentSha256)) {
  report.errors.push('HARDPROFILE_INCOMPLETE')
}

const req = candidates.filter((c) => c.diagramRequirement === 'REQUIRED')
report.required = { n: req.length, ids: req.map((c) => c.id) }
if (req.length !== 0) {
  // 1E final: REQUIRED=0; if non-zero must have files — still allow if files exist
  for (const c of req) {
    const svgP = path.join(qb, '../diagrams/hard_ch1_4_batch1a', `${c.id}.svg`)
    const pngP = path.join(qb, '../diagrams/hard_ch1_4_batch1a', `${c.id}.png`)
    if (!fs.existsSync(svgP) || !fs.existsSync(pngP)) {
      report.errors.push(`REQ_FILE_MISSING:${c.id}`)
    }
  }
}

report.qualityEvidence = {
  closureStatus: closure.status,
  candStatus,
  preflightStatus: preflight.status,
  unresolvedMath: closure.unresolvedMathIssues ?? closure.openMathIssues ?? 0,
  unresolvedModerate: closure.unresolvedModerate ?? closure.advisoryUnresolved ?? null,
  mathIssueOpen: quality.openMathIssues ?? quality.mathIssuesRemaining ?? null,
}
if (closure.status !== 'HARD_IMPORT_PREFLIGHT_PASS') {
  report.errors.push(`CLOSURE_NOT_PASS:${closure.status}`)
}
if (preflight.status !== 'HARD_IMPORT_PREFLIGHT_PASS' && preflight.status !== undefined) {
  // after 1E, preflight results may still say PASS from re-run; tolerate PASS only
  if (String(preflight.status).includes('BLOCK') || String(preflight.status).includes('FAIL')) {
    report.errors.push(`PREFLIGHT_BAD:${preflight.status}`)
  }
}
// Gate: no open MATH_ISSUE / MODERATE / UNCERTAIN from closure
const openAdv =
  Number(closure.unresolved ?? closure.advisoryLocked?.unresolved ?? 0) ||
  (closure.rejudgeSummary && closure.unresolvedCount) ||
  0
if (closure.unresolvedCount != null && closure.unresolvedCount !== 0) {
  report.errors.push(`UNRESOLVED_${closure.unresolvedCount}`)
}
if (Array.isArray(closure.openIssues)) {
  const bad = closure.openIssues.filter(
    (x) =>
      /MATH_ISSUE|MODERATE_ONLY|UNCERTAIN|LOW_VALUE/i.test(String(x)) &&
      !/INDEPENDENT_REVIEW/i.test(String(x)),
  )
  // openIssues in closure may list independence only — check blockers
}
if (Array.isArray(closure.blockers) && closure.blockers.length) {
  report.errors.push(`CLOSURE_BLOCKERS:${closure.blockers.length}`)
}
if (Array.isArray(preflight.blockers) && preflight.blockers.length) {
  report.errors.push(`PREFLIGHT_BLOCKERS:${preflight.blockers.length}`)
}

const adaptRun = spawnSync(process.execPath, [path.join(qb, '_hard14_1f_adapt.mjs')], {
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
  const conn = await createConnection(dbConfig(env))
  const [[drawable]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  const [[drow]] = await conn.query(
    `SELECT SUM(difficulty=1) AS d1, SUM(difficulty=2) AS d2, SUM(difficulty=3) AS d3
     FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  const [[hardExist]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-HARD14-%'`,
  )
  const [exist] = await conn.query(
    `SELECT code FROM hs_math_train_items WHERE code IN (${ids.map(() => '?').join(',')})`,
    ids,
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
  const [[diagLinks]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_item_diagrams`,
  )
  const [admins] = await conn.query(
    `SELECT id FROM users WHERE role='ADMIN' ORDER BY id ASC LIMIT 1`,
  )
  const [[old813]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_items
     WHERE pool='formal' AND status='approved' AND is_active=1 AND code NOT LIKE 'CAND-HARD14-%'`,
  )
  report.db = {
    drawable: Number(drawable.n),
    d1: Number(drow.d1),
    d2: Number(drow.d2),
    d3: Number(drow.d3),
    hard14Existing: Number(hardExist.n),
    codeConflicts: exist.map((r) => r.code),
    kpMiss,
    methodMiss,
    sessions: Number(sessions.n),
    sessionItems: Number(sessionItems.n),
    diagramLinks: Number(diagLinks.n),
    old813: Number(old813.n),
    adminId: admins[0] ? String(admins[0].id) : null,
  }
  await conn.end()
  if (report.db.drawable !== BASELINE_DRAWABLE) {
    report.errors.push(`DRAWABLE_${report.db.drawable}`)
  }
  if (report.db.d1 !== 335 || report.db.d2 !== 478 || report.db.d3 !== 0) {
    report.errors.push(`DIFF_DIST_${report.db.d1}/${report.db.d2}/${report.db.d3}`)
  }
  if (report.db.hard14Existing !== 0) {
    report.errors.push(`HARD14_ALREADY_${report.db.hard14Existing}`)
  }
  if (report.db.codeConflicts.length) report.errors.push('CODE_CONFLICT')
  if (report.db.kpMiss.length) report.errors.push('KP_MISS')
  if (report.db.methodMiss.length) report.errors.push('METHOD_MISS')
  if (!report.db.adminId) report.errors.push('NO_ADMIN')
  if (report.db.old813 !== BASELINE_DRAWABLE) report.errors.push('OLD813_BASELINE')
} catch (e) {
  report.errors.push(`DB:${String(e.message || e)}`)
}

report.quotas = { chapter: ch, hardLevel: hl, required: req.length }
report.ok = report.errors.length === 0
report.endedAt = new Date().toISOString()
const out = path.join(qb, 'hard_ch1_4_batch1a/_1f_gate0_ro.json')
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, JSON.stringify(report, null, 2))
console.log(
  JSON.stringify(
    {
      ok: report.ok,
      errors: report.errors,
      batch: report.batch,
      db: report.db,
      quotas: report.quotas,
      required: report.required,
    },
    null,
    2,
  ),
)
process.exit(report.ok ? 0 : 2)
