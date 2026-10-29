/**
 * STRICT-PREFLIGHT-2F Gate0 — read-only. Does not modify candidates.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createConnection } from '../../../../apps/api/node_modules/mysql2/promise.js'
import { loadEnv, dbConfig, contentPayload, sha256, batchSha } from '../_h3c14_lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const EXPECTED_BATCH = '1e51ba93a0e398766d450fbecda3784a93297c0d8c1e5a60856798c655e19635'
const EXPECTED_FILE = 'df497f16c24c0b89b06df67b895f4bbdd7e6ca5bca820f29428f2b03b789ff16'
const EXPECTED_IDS = [
  6, 13, 14, 18, 27, 46, 47, 60, 101, 102, 104, 108, 201, 202, 204, 211, 212, 213, 214, 215, 216,
].map((n) => `CAND-H3C14-${String(n).padStart(3, '0')}`)
const FROZEN = [6, 13, 14, 18, 27, 46, 47, 60].map((n) => `CAND-H3C14-${String(n).padStart(3, '0')}`)

const report = {
  phase: 'H3-STRICT-PREFLIGHT-2F-GATE0',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  startedAt: new Date().toISOString(),
  ok: true,
  errors: [],
}

const candPath = path.join(qb, 'h3_ch1_4_candidates.mjs')
const fileBuf = fs.readFileSync(candPath)
const fileSha256 = crypto.createHash('sha256').update(fileBuf).digest('hex')
const mod = await import(pathToFileURL(candPath).href + '?t=' + Date.now())
const { candidates, batchContentSha256 } = mod

const ids = candidates.map((c) => c.id)
const ch = { 1: 0, 2: 0, 3: 0, 4: 0 }
for (const c of candidates) ch[c.chapterNo] = (ch[c.chapterNo] || 0) + 1

const recomputedBatch = batchSha(candidates)
const itemShaOk = candidates.every((c) => c.hardProfile?.contentSha256 === sha256(contentPayload(c)))

if (fileSha256 !== EXPECTED_FILE) {
  report.ok = false
  report.errors.push(`FILE_SHA_MISMATCH got=${fileSha256}`)
}
if (batchContentSha256 !== EXPECTED_BATCH || recomputedBatch !== EXPECTED_BATCH) {
  report.ok = false
  report.errors.push(`BATCH_SHA_MISMATCH stored=${batchContentSha256} recomputed=${recomputedBatch}`)
}
if (!itemShaOk) {
  report.ok = false
  report.errors.push('ITEM_CONTENT_SHA_MISMATCH')
}
if (ids.length !== 21) {
  report.ok = false
  report.errors.push(`N=${ids.length} expected 21`)
}
const missing = EXPECTED_IDS.filter((id) => !ids.includes(id))
const extra = ids.filter((id) => !EXPECTED_IDS.includes(id))
if (missing.length || extra.length) {
  report.ok = false
  report.errors.push(`ID_SET missing=${missing.join(',')} extra=${extra.join(',')}`)
}
if (new Set(ids).size !== ids.length) {
  report.ok = false
  report.errors.push('DUPLICATE_IDS')
}

const frozenSnap = JSON.parse(fs.readFileSync(path.join(__dirname, '_1e_frozen_pass8.json'), 'utf8'))
const byId = new Map(candidates.map((c) => [c.id, c]))
const frozenSha = []
for (const f of frozenSnap.items) {
  const c = byId.get(f.id)
  const ok = !!(c && c.hardProfile.contentSha256 === f.contentSha256)
  frozenSha.push({ id: f.id, ok, snap: f.contentSha256, now: c?.hardProfile?.contentSha256 })
  if (!ok) {
    report.ok = false
    report.errors.push(`FROZEN_SHA_CHANGED ${f.id}`)
  }
}
for (const id of FROZEN) {
  if (!byId.has(id)) {
    report.ok = false
    report.errors.push(`MISSING_FROZEN ${id}`)
  }
}

let db = null
try {
  const env = loadEnv()
  const conn = await createConnection(dbConfig(env))
  const [[d]] = await conn.query(
    `SELECT COUNT(*) AS n FROM hs_math_train_items
     WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  const [diffRows] = await conn.query(
    `SELECT difficulty, COUNT(*) AS n FROM hs_math_train_items
     WHERE pool='formal' AND status='approved' AND is_active=1
     GROUP BY difficulty ORDER BY difficulty`,
  )
  const [[h]] = await conn.query(
    `SELECT COUNT(*) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-H3C14-%'`,
  )
  db = {
    drawable: Number(d.n),
    byDiff: Object.fromEntries(diffRows.map((r) => [r.difficulty, Number(r.n)])),
    h3c14: Number(h.n),
  }
  if (db.drawable !== 913) {
    report.ok = false
    report.errors.push(`DRAWABLE_${db.drawable}`)
  }
  if (db.byDiff[1] !== 335 || db.byDiff[2] !== 478 || db.byDiff[3] !== 100) {
    report.ok = false
    report.errors.push(`DIFF_${JSON.stringify(db.byDiff)}`)
  }
  if (db.h3c14 !== 0) {
    report.ok = false
    report.errors.push(`H3C14_IN_DB_${db.h3c14}`)
  }
  await conn.end()
} catch (e) {
  report.ok = false
  report.errors.push(`DB_${e.message}`)
}

report.gate0 = {
  n: ids.length,
  ids,
  chapter: ch,
  fileSha256,
  batchContentSha256,
  recomputedBatch,
  itemShaOk,
  frozenSha,
  frozenIds: FROZEN,
  db,
  candidatesUnmodified: true,
}
report.finishedAt = new Date().toISOString()
fs.writeFileSync(path.join(__dirname, '_strict_2f_gate0.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify({ ok: report.ok, errors: report.errors, n: ids.length, chapter: ch, db }, null, 2))
if (!report.ok) process.exit(1)
