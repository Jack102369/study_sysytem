/**
 * Ch3 completion 1C Gate0 — lock baseline 38; MySQL RO. No writes to items.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createConnection } from '../../../../apps/api/node_modules/mysql2/promise.js'
import { loadEnv, dbConfig, ensureDir, workDir, qb, HARD14_BATCH_SHA } from '../_h3c14_lib.mjs'
// lib lives in question_bank/

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const report = {
  phase: 'H3-CH3-COMPLETION-1C-GATE0',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  startedAt: new Date().toISOString(),
  ok: false,
  errors: [],
}

const candPath = path.join(qb, 'h3_ch1_4_candidates.mjs')
const { candidates, batchContentSha256, status } = await import(
  pathToFileURL(candPath).href + '?t=' + Date.now()
)
const fileSha256 = crypto.createHash('sha256').update(fs.readFileSync(candPath)).digest('hex')
const ids = candidates.map((c) => c.id)
const ch = { 1: 0, 2: 0, 3: 0, 4: 0 }
for (const c of candidates) ch[c.chapterNo]++
const ch3 = candidates.filter((c) => c.chapterNo === 3).map((c) => c.id)

report.baseline = {
  n: candidates.length,
  idUnique: new Set(ids).size === ids.length,
  chapter: ch,
  ch3Ids: ch3,
  allIds: ids,
  status,
  batchContentSha256,
  expectedBatchSha: 'a0f1b60b8690a0e4d8fc73ab31162d4c26495d4f265ce67f40d34d0aff653415',
  fileSha256,
  shaNote:
    'batchContentSha256 = sha256(item contentShas joined by |); fileSha256 = sha256(entire .mjs file bytes)',
  hard14Ref: HARD14_BATCH_SHA,
}

if (candidates.length !== 38) report.errors.push(`COUNT_${candidates.length}`)
if (!report.baseline.idUnique) report.errors.push('ID_DUP')
if (!(ch[1] === 5 && ch[2] === 20 && ch[3] === 8 && ch[4] === 5)) {
  report.errors.push(`CH_${JSON.stringify(ch)}`)
}
if (batchContentSha256 !== report.baseline.expectedBatchSha) {
  report.errors.push(`BATCH_SHA_MISMATCH got=${batchContentSha256}`)
}

const env = loadEnv()
try {
  const conn = await createConnection(dbConfig(env))
  const [[drawable]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  const [[drow]] = await conn.query(
    `SELECT SUM(CASE WHEN difficulty=1 THEN 1 ELSE 0 END) AS d1,
            SUM(CASE WHEN difficulty=2 THEN 1 ELSE 0 END) AS d2,
            SUM(CASE WHEN difficulty=3 THEN 1 ELSE 0 END) AS d3
     FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  const [[h3]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-H3C14-%'`,
  )
  report.db = {
    drawable: Number(drawable.n),
    d1: Number(drow.d1),
    d2: Number(drow.d2),
    d3: Number(drow.d3),
    h3c14: Number(h3.n),
  }
  await conn.end()
  if (report.db.drawable !== 913) report.errors.push(`DRAWABLE_${report.db.drawable}`)
  if (report.db.d1 !== 335 || report.db.d2 !== 478 || report.db.d3 !== 100) {
    report.errors.push(`DIFF_${report.db.d1}/${report.db.d2}/${report.db.d3}`)
  }
  if (report.db.h3c14 !== 0) report.errors.push(`H3C14_EXIST_${report.db.h3c14}`)
} catch (e) {
  report.errors.push(`DB:${String(e.message || e)}`)
}

report.ok = report.errors.length === 0
report.endedAt = new Date().toISOString()
ensureDir(workDir)
const out = path.join(workDir, '_ch3_1c_gate0.json')
fs.writeFileSync(out, JSON.stringify(report, null, 2))
// snapshot ID list for append mapping
fs.writeFileSync(
  path.join(workDir, '_ch3_1c_baseline38_ids.json'),
  JSON.stringify(
    {
      lockedAt: report.endedAt,
      batchContentSha256,
      fileSha256,
      ids,
      ch3Ids: ch3,
    },
    null,
    2,
  ),
)
console.log(JSON.stringify({ ok: report.ok, errors: report.errors, baseline: report.baseline, db: report.db }, null, 2))
process.exit(report.ok ? 0 : 2)
