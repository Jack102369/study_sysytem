/**
 * GLOBAL-4E orchestrator: Gate0 → groups 1..5 → aggregate results JSON.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'
import { loadEnv, dbConfig, qb, docs, cpDir, loadCheckpoint } from './_g4e_lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')

const summary = {
  batch: 'HS-MATH-BANK-GLOBAL-4E-IMPORT-REVIEW-APPROVE',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  expectedBatchSha256: 'def9b8c49ac641de72632f09c8bfd2aeb0554d945be10db853667e88d9c5ab15',
  startedAt: new Date().toISOString(),
  status: null,
  gate0: null,
  groups: [],
  final: {},
  errors: [],
}

function runNode(script, args = []) {
  const r = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  })
  return r
}

console.log('=== Gate0 ===')
const g0 = runNode(path.join(qb, '_g4e_gate0_ro.mjs'))
console.log(g0.stdout || '')
if (g0.status !== 0) {
  summary.status = 'BATCH500_IMPORT_BLOCKED'
  summary.errors.push('GATE0_FAIL')
  summary.gate0 = { exit: g0.status, stderr: (g0.stderr || '').slice(0, 500) }
  finish()
}
summary.gate0 = JSON.parse(
  fs.readFileSync(path.join(qb, 'bank_global4a/_g4e_gate0_ro.json'), 'utf8'),
)

// optional mysqldump backup (best-effort)
try {
  const env = loadEnv()
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupDir = path.join(docs, '_backups')
  fs.mkdirSync(backupDir, { recursive: true })
  const tables = [
    'hs_math_train_items',
    'hs_math_train_item_kps',
    'hs_math_train_item_methods',
    'hs_math_train_item_reviews',
    'hs_math_train_item_diagrams',
  ]
  for (const t of tables) {
    const out = path.join(backupDir, `g4e_${t}_${stamp}.sql`)
    const r = spawnSync(
      'mysqldump',
      [
        `-h${env.DB_HOST || '127.0.0.1'}`,
        `-P${env.DB_PORT || 3306}`,
        `-u${env.DB_USER}`,
        env.DB_PASSWORD ? `-p${env.DB_PASSWORD}` : '',
        env.DB_NAME || 'study_system',
        t,
      ].filter(Boolean),
      { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 },
    )
    if (r.status === 0 && r.stdout) {
      fs.writeFileSync(out, r.stdout)
      summary.backup = summary.backup || {}
      summary.backup[t] = path.basename(out)
    }
  }
} catch (e) {
  summary.backupNote = `backup_skipped:${String(e.message || e)}`
}

let stoppedAt = null
for (let g = 1; g <= 5; g++) {
  console.log(`=== Group ${g} ===`)
  const r = runNode(path.join(qb, '_g4e_run_group.mjs'), [String(g)])
  console.log(r.stdout || '')
  if (r.stderr) console.error(r.stderr.slice(0, 1000))
  const resultPath = path.join(qb, 'bank_global4a', `_g4e_group0${g}_result.json`)
  let grest = null
  if (fs.existsSync(resultPath)) grest = JSON.parse(fs.readFileSync(resultPath, 'utf8'))
  summary.groups.push({
    group: g,
    exit: r.status,
    ok: r.status === 0,
    drawable: grest?.verify?.drawable,
    reviewPassed: grest?.review?.passed,
    approveOk: grest?.approve?.success,
    errors: grest?.errors || [],
  })
  if (r.status !== 0) {
    stoppedAt = g
    summary.errors.push(`GROUP_${g}_FAIL`)
    break
  }
}

const env = loadEnv()
const conn = await createConnection(dbConfig(env))
const [[drawable]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)
const [[g4aApproved]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-G4A-%' AND status='approved' AND is_active=1`,
)
const [[g4aDraft]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-G4A-%' AND status='draft'`,
)
const [[g4aTotal]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-G4A-%'`,
)
const [[old313]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1 AND code NOT LIKE 'CAND-G4A-%'`,
)
const [[sessions]] = await conn.query(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)
const [[sessionItems]] = await conn.query(`SELECT COUNT(1) AS n FROM hs_math_train_session_items`)
const [mapping] = await conn.query(
  `SELECT id, code, status, content_version, difficulty, qtype
   FROM hs_math_train_items WHERE code LIKE 'CAND-G4A-%' ORDER BY code`,
)
await conn.end()

summary.final = {
  drawable: Number(drawable.n),
  g4aApproved: Number(g4aApproved.n),
  g4aDraft: Number(g4aDraft.n),
  g4aTotal: Number(g4aTotal.n),
  old313: Number(old313.n),
  sessions: Number(sessions.n),
  sessionItems: Number(sessionItems.n),
  stoppedAt,
  mappingCount: mapping.length,
}

// Build candidate→itemId map from checkpoints
const map = {}
for (let g = 1; g <= 5; g++) {
  const cp = loadCheckpoint(g)
  for (const [code, meta] of Object.entries(cp.items || {})) {
    map[code] = {
      itemId: meta.itemId,
      status: meta.status,
      contentVersion: meta.contentVersion,
      reviewPassed: meta.reviewPassed || false,
      approved: meta.approved || false,
      diagramsDone: meta.diagramsDone || false,
      group: g,
    }
  }
}
summary.candidateItemMap = map

const allOk =
  !stoppedAt &&
  summary.final.drawable === 813 &&
  summary.final.g4aApproved === 500 &&
  summary.final.g4aDraft === 0 &&
  summary.final.old313 === 313

if (allOk) summary.status = 'BATCH500_IMPORT_APPROVE_PASS'
else if (summary.final.g4aTotal > 0 || summary.groups.some((g) => g.ok))
  summary.status = 'BATCH500_IMPORT_PARTIAL'
else summary.status = 'BATCH500_IMPORT_BLOCKED'

function finish() {
  summary.endedAt = new Date().toISOString()
  const outJson = path.join(qb, 'global4e_import_results.json')
  fs.writeFileSync(outJson, JSON.stringify(summary, null, 2))
  console.log(
    JSON.stringify(
      {
        status: summary.status,
        final: summary.final,
        groups: summary.groups.map((g) => ({ g: g.group, ok: g.ok, drawable: g.drawable })),
        errors: summary.errors,
        outJson,
      },
      null,
      2,
    ),
  )
  process.exit(summary.status === 'BATCH500_IMPORT_APPROVE_PASS' ? 0 : 2)
}

finish()
