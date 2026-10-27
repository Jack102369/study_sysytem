/**
 * Aggregate GLOBAL-4E results after groups completed (no re-import).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'
import { loadEnv, dbConfig, loadCheckpoint, qb } from './_g4e_lib.mjs'

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
const [[sessionItems]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_session_items`,
)
const [[g4aReviews]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_item_reviews r
   JOIN hs_math_train_items i ON i.id=r.item_id
   WHERE i.code LIKE 'CAND-G4A-%' AND r.review_status='passed'`,
)
const [reqDiag] = await conn.query(
  `SELECT i.code, COUNT(d.id) AS n
   FROM hs_math_train_items i
   JOIN hs_math_train_item_diagrams d ON d.item_id=i.id
   WHERE i.code LIKE 'CAND-G4A-%'
   GROUP BY i.code`,
)

const { candidates } = await import(
  pathToFileURL(path.join(qb, 'candidates-g4a-500.mjs')).href + '?t=' + Date.now()
)
const reqIds = candidates.filter((c) => c.diagramRequirement === 'REQUIRED').map((c) => c.id)
const reqDiagMap = Object.fromEntries(reqDiag.map((r) => [r.code, Number(r.n)]))
const reqMissing = reqIds.filter((id) => !reqDiagMap[id] || reqDiagMap[id] < 1)

const gate0 = JSON.parse(
  fs.readFileSync(path.join(qb, 'bank_global4a/_g4e_gate0_ro.json'), 'utf8'),
)
const groups = []
const map = {}
let diagUploaded = 0
for (let g = 1; g <= 5; g++) {
  const res = JSON.parse(
    fs.readFileSync(path.join(qb, 'bank_global4a', `_g4e_group0${g}_result.json`), 'utf8'),
  )
  groups.push({
    group: g,
    ok: res.ok,
    drawableAfter: res.verify?.drawable,
    reviewPassed: res.review?.passed,
    approveOk: res.approve?.success,
    diagramsUploaded: (res.diagrams?.uploaded || []).length,
    importMode: res.import?.confirm?.mode || (res.import?.skipped ? 'skipped' : null),
    importSuccessCount: res.import?.confirm?.successCount ?? (res.import?.skipped ? 100 : 0),
    errors: res.errors || [],
  })
  diagUploaded += (res.diagrams?.uploaded || []).length
  const cp = loadCheckpoint(g)
  for (const [code, meta] of Object.entries(cp.items || {})) {
    map[code] = {
      itemId: meta.itemId,
      status: meta.status,
      contentVersion: meta.contentVersion,
      reviewPassed: !!meta.reviewPassed,
      approved: !!meta.approved,
      diagramsDone: !!meta.diagramsDone,
      group: g,
    }
  }
}

await conn.end()

const pass =
  Number(drawable.n) === 813 &&
  Number(g4aApproved.n) === 500 &&
  Number(g4aDraft.n) === 0 &&
  Number(old313.n) === 313 &&
  Object.keys(map).length === 500 &&
  reqMissing.length === 0 &&
  groups.every((g) => g.ok)

const summary = {
  batch: 'HS-MATH-BANK-GLOBAL-4E-IMPORT-REVIEW-APPROVE',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  expectedBatchSha256: 'def9b8c49ac641de72632f09c8bfd2aeb0554d945be10db853667e88d9c5ab15',
  actualBatchSha256: gate0.batchContentSha256,
  status: pass ? 'BATCH500_IMPORT_APPROVE_PASS' : 'BATCH500_IMPORT_PARTIAL',
  completedAt: new Date().toISOString(),
  preBaseline: {
    drawable: gate0.db.drawable,
    g4aExisting: gate0.db.g4aExisting,
    sessions: gate0.db.sessions,
    sessionItems: gate0.db.sessionItems,
  },
  groups,
  diagrams: {
    requiredExpected: 27,
    requiredWithLinks: reqIds.length - reqMissing.length,
    requiredMissing: reqMissing,
    uploadedThisRun: diagUploaded,
  },
  review: { passedReviewsInDb: Number(g4aReviews.n) },
  final: {
    drawable: Number(drawable.n),
    g4aApproved: Number(g4aApproved.n),
    g4aDraft: Number(g4aDraft.n),
    g4aTotal: Number(g4aTotal.n),
    old313: Number(old313.n),
    sessions: Number(sessions.n),
    sessionItems: Number(sessionItems.n),
    sessionsUnchanged: Number(sessions.n) === gate0.db.sessions,
    sessionItemsUnchanged: Number(sessionItems.n) === gate0.db.sessionItems,
  },
  candidateItemMapSize: Object.keys(map).length,
  candidateItemMap: map,
  errors: reqMissing.length ? [`REQ_MISSING:${reqMissing.join(',')}`] : [],
  note: 'Author-side Admin API import/review/approve. Not independent math final review.',
}

fs.writeFileSync(path.join(qb, 'global4e_import_results.json'), JSON.stringify(summary, null, 2))
console.log(
  JSON.stringify(
    {
      status: summary.status,
      final: summary.final,
      diagrams: summary.diagrams,
      reviewPassedDb: summary.review.passedReviewsInDb,
      mapN: summary.candidateItemMapSize,
      groups: groups.map((g) => ({ g: g.group, ok: g.ok, d: g.drawableAfter })),
    },
    null,
    2,
  ),
)
process.exit(pass ? 0 : 2)
