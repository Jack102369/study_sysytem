/**
 * STRICT-PREFLIGHT-1D Gate0 — read-only lock. Does not modify candidates.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createConnection } from '../../../../apps/api/node_modules/mysql2/promise.js'
import { loadEnv, dbConfig, contentPayload, sha256 } from '../_h3c14_lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const EXPECTED_BATCH =
  '293f44add5373711b642593f58c61ce867f6362a0ff81314ca618ca2af02dde2'
const EXPECTED_FILE =
  '68b705e7cdd79941037df8783729077187fe9198670958288259da2634fdfcc6'
const EXPECTED_BASELINE38 =
  'a0f1b60b8690a0e4d8fc73ab31162d4c26495d4f265ce67f40d34d0aff653415'

const report = {
  phase: 'H3-STRICT-PREFLIGHT-1D-GATE0',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  startedAt: new Date().toISOString(),
  ok: true,
  errors: [],
}

const candPath = path.join(qb, 'h3_ch1_4_candidates.mjs')
const fileBuf = fs.readFileSync(candPath)
const fileSha256 = crypto.createHash('sha256').update(fileBuf).digest('hex')
const mod = await import(pathToFileURL(candPath).href + '?t=' + Date.now())
const { candidates, batchContentSha256, status } = mod

const ids = candidates.map((c) => c.id)
const idSet = new Set(ids)
const ch = { 1: 0, 2: 0, 3: 0, 4: 0 }
for (const c of candidates) ch[c.chapterNo]++

const recomputedItemShas = candidates.map((c) => sha256(contentPayload(c)))
const recomputedBatch = sha256(recomputedItemShas.join('|'))
const storedItemShas = candidates.map((c) => c.hardProfile?.contentSha256)

const snapPath = path.join(__dirname, '_baseline38_sha_snap.json')
let baseline38 = null
if (fs.existsSync(snapPath)) {
  const snap = JSON.parse(fs.readFileSync(snapPath, 'utf8'))
  const byId = new Map(candidates.map((c) => [c.id, c]))
  const diffs = []
  for (let i = 0; i < snap.ids.length; i++) {
    const c = byId.get(snap.ids[i])
    if (!c) diffs.push({ id: snap.ids[i], err: 'MISSING' })
    else if (c.hardProfile.contentSha256 !== snap.shas[i])
      diffs.push({ id: snap.ids[i], err: 'SHA_CHANGED' })
  }
  baseline38 = {
    expectedBatch: EXPECTED_BASELINE38,
    snapBatch: snap.batch,
    intact: diffs.length === 0,
    diffs,
    n: snap.ids.length,
  }
  if (!baseline38.intact) {
    report.ok = false
    report.errors.push('BASELINE38_SHA_CHANGED')
  }
}

if (candidates.length !== 44) {
  report.ok = false
  report.errors.push(`COUNT_${candidates.length}`)
}
if (ids.length !== idSet.size) {
  report.ok = false
  report.errors.push('DUP_IDS')
}
if (ch[1] !== 5 || ch[2] !== 20 || ch[3] !== 14 || ch[4] !== 5) {
  report.ok = false
  report.errors.push(`CH_${JSON.stringify(ch)}`)
}
if (batchContentSha256 !== EXPECTED_BATCH) {
  report.ok = false
  report.errors.push(`BATCH_DECLARED_MISMATCH`)
}
if (recomputedBatch !== EXPECTED_BATCH) {
  report.ok = false
  report.errors.push(`BATCH_RECOMPUTE_MISMATCH got=${recomputedBatch}`)
}
if (fileSha256 !== EXPECTED_FILE) {
  report.ok = false
  report.errors.push(`FILE_SHA_MISMATCH got=${fileSha256}`)
}
for (let i = 0; i < candidates.length; i++) {
  if (storedItemShas[i] !== recomputedItemShas[i]) {
    report.ok = false
    report.errors.push(`ITEM_SHA_DRIFT_${ids[i]}`)
  }
}

const new6 = [
  'CAND-H3C14-051',
  'CAND-H3C14-052',
  'CAND-H3C14-056',
  'CAND-H3C14-058',
  'CAND-H3C14-059',
  'CAND-H3C14-060',
]
for (const id of new6) {
  if (!idSet.has(id)) {
    report.ok = false
    report.errors.push(`MISSING_1C_${id}`)
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

report.candidates = {
  n: candidates.length,
  ids,
  chapter: ch,
  status,
  batchContentSha256,
  recomputedBatch,
  fileSha256,
  baseline38,
}
report.db = db
report.endedAt = new Date().toISOString()

// extract compact review pack (read-only snapshot for reviewers)
const pack = candidates.map((c) => ({
  id: c.id,
  designId: c.designId,
  chapterNo: c.chapterNo,
  sectionCode: c.sectionCode,
  kpCode: c.kpCode,
  qtype: c.qtype,
  difficulty: c.difficulty,
  hardLevel: c.hardLevel,
  modelFamily: c.modelFamily,
  stem: c.stem,
  answer: c.answer,
  analysis: c.analysis,
  maxScore: c.maxScore,
  rubric: c.rubric,
  diagramRequirement: c.diagramRequirement,
  contentSha256: c.hardProfile?.contentSha256,
  h3Evidence: c.h3Evidence,
  methodMain: c.methodMain,
  methodAux: c.methodAux,
}))
fs.writeFileSync(path.join(__dirname, '_strict_1d_gate0.json'), JSON.stringify(report, null, 2))
fs.writeFileSync(path.join(__dirname, '_strict_1d_review_pack.json'), JSON.stringify(pack, null, 2))
console.log(JSON.stringify({ ok: report.ok, errors: report.errors, n: candidates.length, ch, db }, null, 2))
process.exit(report.ok ? 0 : 2)
