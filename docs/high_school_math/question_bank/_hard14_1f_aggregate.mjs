/**
 * Aggregate HARD14-1F after groups completed (no re-import).
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'
import {
  loadEnv,
  dbConfig,
  loadCheckpoint,
  qb,
  EXPECTED_BATCH_SHA,
  BASELINE_DRAWABLE,
} from './_hard14_1f_lib.mjs'

const env = loadEnv()
const conn = await createConnection(dbConfig(env))

const [[drawable]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)
const [[drow]] = await conn.query(
  `SELECT SUM(difficulty=1) AS d1, SUM(difficulty=2) AS d2, SUM(difficulty=3) AS d3
   FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)
const [[hardApproved]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-HARD14-%' AND status='approved' AND is_active=1`,
)
const [[hardDraft]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-HARD14-%' AND status='draft'`,
)
const [[hardTotal]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-HARD14-%'`,
)
const [[old813]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1 AND code NOT LIKE 'CAND-HARD14-%'`,
)
const [[sessions]] = await conn.query(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)
const [[sessionItems]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_session_items`,
)
const [[diagLinks]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_item_diagrams`,
)
const [[hardReviews]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_item_reviews r
   JOIN hs_math_train_items i ON i.id=r.item_id
   WHERE i.code LIKE 'CAND-HARD14-%' AND r.review_status='passed'`,
)
const [chRows] = await conn.query(
  `SELECT s.code AS specialty, COUNT(1) AS n
   FROM hs_math_train_items i
   JOIN hs_math_specialties s ON s.id=i.specialty_id
   WHERE i.code LIKE 'CAND-HARD14-%' AND i.status='approved' AND i.is_active=1
   GROUP BY s.code`,
)

const { candidates } = await import(
  pathToFileURL(path.join(qb, 'hard_ch1_4_batch1a_candidates.mjs')).href + '?t=' + Date.now()
)
const reqIds = candidates.filter((c) => c.diagramRequirement === 'REQUIRED').map((c) => c.id)

const gate0Path = path.join(qb, 'hard_ch1_4_batch1a/_1f_gate0_ro.json')
const gate0 = JSON.parse(fs.readFileSync(gate0Path, 'utf8'))

const groups = []
const map = {}
let diagUploaded = 0
let allOk = true
for (let g = 1; g <= 5; g++) {
  const resPath = path.join(qb, 'hard_ch1_4_batch1a', `_1f_group0${g}_result.json`)
  if (!fs.existsSync(resPath)) {
    allOk = false
    groups.push({ group: g, ok: false, missing: true })
    continue
  }
  const res = JSON.parse(fs.readFileSync(resPath, 'utf8'))
  groups.push({
    group: g,
    ok: res.ok,
    range: `${String((g - 1) * 20 + 1).padStart(3, '0')}-${String(g * 20).padStart(3, '0')}`,
    drawableAfter: res.verify?.drawable,
    reviewPassed: res.review?.passed,
    approveOk: res.approve?.success,
    diagramsUploaded: (res.diagrams?.uploaded || []).length,
    diagramsNote: res.diagrams?.note || null,
    importMode: res.import?.confirm?.mode || (res.import?.skipped ? 'skipped' : null),
    importSuccessCount:
      res.import?.confirm?.successCount ?? (res.import?.skipped ? 20 : 0),
    errors: res.errors || [],
  })
  diagUploaded += (res.diagrams?.uploaded || []).length
  if (!res.ok) allOk = false
  const cp = loadCheckpoint(g)
  for (const [code, meta] of Object.entries(cp.items || {})) {
    const cand = candidates.find((c) => c.id === code)
    map[code] = {
      itemId: meta.itemId,
      status: meta.status,
      contentVersion: meta.contentVersion,
      reviewPassed: !!meta.reviewPassed,
      approved: !!meta.approved,
      contentFingerprintPrefix: meta.contentFingerprintPrefix || null,
      hardLevelOffline: cand?.hardLevel || meta.hardLevelOffline || null,
      chapterNo: cand?.chapterNo ?? null,
      qtype: cand?.qtype ?? null,
    }
  }
}

const pass =
  allOk &&
  Number(drawable.n) === 913 &&
  Number(drow.d1) === 335 &&
  Number(drow.d2) === 478 &&
  Number(drow.d3) === 100 &&
  Number(hardApproved.n) === 100 &&
  Number(hardDraft.n) === 0 &&
  Number(old813.n) === BASELINE_DRAWABLE &&
  Object.keys(map).length === 100

const out = {
  phase: 'HS-MATH-HARD-CH1-4-IMPORT-REVIEW-APPROVE-1F',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  status: pass
    ? 'HARD_BATCH100_IMPORT_APPROVE_PASS'
    : allOk
      ? 'HARD_BATCH100_IMPORT_PARTIAL'
      : 'HARD_BATCH100_IMPORT_BLOCKED',
  auditedAt: new Date().toISOString(),
  batchContentSha256: EXPECTED_BATCH_SHA,
  gate0: {
    ok: gate0.ok,
    drawable: gate0.db?.drawable,
    d1: gate0.db?.d1,
    d2: gate0.db?.d2,
    d3: gate0.db?.d3,
    sessions: gate0.db?.sessions,
    sessionItems: gate0.db?.sessionItems,
    diagramLinks: gate0.db?.diagramLinks,
  },
  groups,
  candidateItemMap: map,
  mapCount: Object.keys(map).length,
  requiredDiagrams: {
    requiredN: reqIds.length,
    uploaded: diagUploaded,
    note: reqIds.length === 0 ? '1E final REQUIRED=0; no diagrams uploaded' : null,
  },
  finalDb: {
    drawable: Number(drawable.n),
    d1: Number(drow.d1),
    d2: Number(drow.d2),
    d3: Number(drow.d3),
    hard14Approved: Number(hardApproved.n),
    hard14Draft: Number(hardDraft.n),
    hard14Total: Number(hardTotal.n),
    old813: Number(old813.n),
    sessions: Number(sessions.n),
    sessionItems: Number(sessionItems.n),
    diagramLinks: Number(diagLinks.n),
    hard14ReviewPassedRows: Number(hardReviews.n),
    chapterBySpecialty: Object.fromEntries(chRows.map((r) => [r.specialty, Number(r.n)])),
  },
  hardLevelOffline: {
    note: 'hardLevel not persisted in DB; retained in candidates.mjs + this map',
    H1: candidates.filter((c) => c.hardLevel === 'H1').length,
    H2: candidates.filter((c) => c.hardLevel === 'H2').length,
    H3: candidates.filter((c) => c.hardLevel === 'H3').length,
  },
  invariance: {
    old813Unchanged: Number(old813.n) === BASELINE_DRAWABLE,
    sessionsUnchanged: Number(sessions.n) === gate0.db?.sessions,
    sessionItemsUnchanged: Number(sessionItems.n) === gate0.db?.sessionItems,
    diagramLinksUnchanged:
      reqIds.length === 0 && Number(diagLinks.n) === gate0.db?.diagramLinks,
  },
  pass,
}

await conn.end()

const outPath = path.join(qb, 'hard_ch1_4_import_results.json')
fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
console.log(
  JSON.stringify(
    {
      status: out.status,
      pass: out.pass,
      drawable: out.finalDb.drawable,
      diff: `${out.finalDb.d1}/${out.finalDb.d2}/${out.finalDb.d3}`,
      mapCount: out.mapCount,
      out: outPath,
    },
    null,
    2,
  ),
)
process.exit(pass ? 0 : 2)
