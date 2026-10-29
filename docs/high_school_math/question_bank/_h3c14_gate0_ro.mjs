/**
 * H3C14 Gate0 — RO baseline + HARD14 lock. No MySQL writes.
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'
import {
  loadEnv,
  dbConfig,
  HARD14_BATCH_SHA,
  ensureDir,
  workDir,
  qb,
  H3_GATE,
} from './_h3c14_lib.mjs'

const report = {
  phase: 'H3C14-GATE0',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  startedAt: new Date().toISOString(),
  ok: false,
  errors: [],
  h3Gate: H3_GATE,
}

const { batchContentSha256 } = await import(
  pathToFileURL(path.join(qb, 'hard_ch1_4_batch1a_candidates.mjs')).href + '?t=' + Date.now()
)
report.hard14BatchSha = batchContentSha256
if (batchContentSha256 !== HARD14_BATCH_SHA) {
  report.errors.push(`HARD14_SHA_MISMATCH got=${batchContentSha256}`)
}

const env = loadEnv()
try {
  const conn = await createConnection(dbConfig(env))
  const [[drawable]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  const [[drow]] = await conn.query(
    `SELECT SUM(difficulty=1) AS d1, SUM(difficulty=2) AS d2, SUM(difficulty=3) AS d3
     FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  const [[h3exist]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-H3C14-%'`,
  )
  const [[hard14]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-HARD14-%' AND status='approved' AND is_active=1`,
  )
  const [kps] = await conn.query(
    `SELECT code FROM hs_math_knowledge_points WHERE is_active=1 AND code LIKE 'rja.%'`,
  )
  report.db = {
    drawable: Number(drawable.n),
    d1: Number(drow.d1),
    d2: Number(drow.d2),
    d3: Number(drow.d3),
    h3c14Existing: Number(h3exist.n),
    hard14Approved: Number(hard14.n),
    activeRjaKp: kps.length,
  }
  await conn.end()
  if (report.db.drawable !== 913) report.errors.push(`DRAWABLE_${report.db.drawable}`)
  if (report.db.d1 !== 335 || report.db.d2 !== 478 || report.db.d3 !== 100) {
    report.errors.push(`DIFF_${report.db.d1}/${report.db.d2}/${report.db.d3}`)
  }
  if (report.db.h3c14Existing !== 0) report.errors.push('H3C14_ALREADY_EXISTS')
  if (report.db.hard14Approved !== 100) report.errors.push(`HARD14_COUNT_${report.db.hard14Approved}`)
} catch (e) {
  report.errors.push(`DB:${String(e.message || e)}`)
}

report.ok = report.errors.length === 0
report.endedAt = new Date().toISOString()
ensureDir(workDir)
const out = path.join(workDir, '_gate0_ro.json')
fs.writeFileSync(out, JSON.stringify(report, null, 2))
console.log(JSON.stringify({ ok: report.ok, errors: report.errors, db: report.db }, null, 2))
process.exit(report.ok ? 0 : 2)
