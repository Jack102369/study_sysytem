/**
 * H3-REDESIGN-1E Gate0 — freeze 8 PASS_H3; RO DB. No candidate mutation.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createConnection } from '../../../../apps/api/node_modules/mysql2/promise.js'
import { loadEnv, dbConfig, contentPayload, sha256 } from '../_h3c14_lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const EXPECTED_FILE =
  '68b705e7cdd79941037df8783729077187fe9198670958288259da2634fdfcc6'
const EXPECTED_BATCH =
  '293f44add5373711b642593f58c61ce867f6362a0ff81314ca618ca2af02dde2'
const PASS_IDS = [
  'CAND-H3C14-006',
  'CAND-H3C14-013',
  'CAND-H3C14-014',
  'CAND-H3C14-018',
  'CAND-H3C14-027',
  'CAND-H3C14-046',
  'CAND-H3C14-047',
  'CAND-H3C14-060',
]

const report = {
  phase: 'H3-REDESIGN-1E-GATE0',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  startedAt: new Date().toISOString(),
  ok: true,
  errors: [],
}

const candPath = path.join(qb, 'h3_ch1_4_candidates.mjs')
const fileSha256 = crypto.createHash('sha256').update(fs.readFileSync(candPath)).digest('hex')
const mod = await import(pathToFileURL(candPath).href + '?t=' + Date.now())
const { candidates, batchContentSha256 } = mod

if (fileSha256 !== EXPECTED_FILE) {
  report.ok = false
  report.errors.push(`FILE_SHA got=${fileSha256}`)
}
if (batchContentSha256 !== EXPECTED_BATCH) {
  report.ok = false
  report.errors.push(`BATCH_SHA got=${batchContentSha256}`)
}

const byId = new Map(candidates.map((c) => [c.id, c]))
const frozen = []
for (const id of PASS_IDS) {
  const c = byId.get(id)
  if (!c) {
    report.ok = false
    report.errors.push(`MISSING_${id}`)
    continue
  }
  const recomputed = sha256(contentPayload(c))
  if (recomputed !== c.hardProfile?.contentSha256) {
    report.ok = false
    report.errors.push(`SHA_DRIFT_${id}`)
  }
  frozen.push({
    id,
    chapterNo: c.chapterNo,
    modelFamily: c.modelFamily,
    contentSha256: c.hardProfile.contentSha256,
    stem: c.stem,
    answer: c.answer,
    analysis: c.analysis,
    maxScore: c.maxScore,
    rubric: c.rubric,
    kpCode: c.kpCode,
    sectionCode: c.sectionCode,
    sectionName: c.sectionName,
    qtype: c.qtype,
    methodMain: c.methodMain,
    methodAux: c.methodAux,
    h3Evidence: c.h3Evidence,
    hardLevelReason: c.hardLevelReason,
    hardProfile: c.hardProfile,
    diagramRequirement: c.diagramRequirement,
    noDiagramReason: c.noDiagramReason,
    designId: c.designId,
  })
}

const chPass = { 1: 0, 2: 0, 3: 0, 4: 0 }
for (const f of frozen) chPass[f.chapterNo]++

let db = null
try {
  const conn = await createConnection(dbConfig(loadEnv()))
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
  if (db.drawable !== 913 || db.byDiff[1] !== 335 || db.byDiff[2] !== 478 || db.byDiff[3] !== 100 || db.h3c14 !== 0) {
    report.ok = false
    report.errors.push(`DB_${JSON.stringify(db)}`)
  }
  await conn.end()
} catch (e) {
  report.ok = false
  report.errors.push(`DB_${e.message}`)
}

report.frozenN = frozen.length
report.passByChapter = chPass
report.targets = { ch2Add: 16, ch3Add: 18, totalAdd: 34, keepPass: 8 }
report.fileSha256 = fileSha256
report.batchContentSha256 = batchContentSha256
report.db = db
report.endedAt = new Date().toISOString()

fs.writeFileSync(path.join(__dirname, '_1e_gate0.json'), JSON.stringify(report, null, 2))
fs.writeFileSync(
  path.join(__dirname, '_1e_frozen_pass8.json'),
  JSON.stringify({ phase: '1E-FROZEN-PASS8', independence: report.independence, items: frozen }, null, 2),
)
console.log(JSON.stringify({ ok: report.ok, errors: report.errors, passByChapter: chPass, db }, null, 2))
process.exit(report.ok ? 0 : 2)
