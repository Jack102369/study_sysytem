/**
 * GLOBAL-1H-3: polish stems 037/074 + re-review. DO NOT commit.
 * No approve. No other 98 items.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const docs = path.resolve(__dirname, '..')
const backupDir = path.join(docs, '_backups')
fs.mkdirSync(backupDir, { recursive: true })
const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

const TARGETS = {
  'CAND-G1B-037': {
    oldStem: '正确的是（多选）',
    newStem: '下列关于对数运算法则的说法，正确的是（多选）',
  },
  'CAND-G1B-074': {
    oldStem: '正确的是（多选）',
    newStem: '下列关于平面向量运算的说法，正确的是（多选）',
  },
}

const report = {
  phase: 'HS-MATH-BANK-GLOBAL-1H-3',
  authorized: true,
  startedAt: new Date().toISOString(),
  decision: null,
  adminUserId: null,
  backup: {},
  pre: {},
  patch: {},
  afterPatch: {},
  reviews: {},
  post: {},
  others98: {},
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

function signJwt(sub, role, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
    'base64url',
  )
  const now = Math.floor(Date.now() / 1000)
  const body = Buffer.from(
    JSON.stringify({ sub, role, iat: now, exp: now + 3600 }),
  ).toString('base64url')
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url')
  return `${header}.${body}.${sig}`
}

async function api(method, urlPath, token, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text.slice(0, 400) }
  }
  return { status: res.status, json }
}

function dataOf(json) {
  if (json?.success === true && json.data !== undefined) return json.data
  return json
}

function sha256File(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
}

function finish(code) {
  report.endedAt = new Date().toISOString()
  const out = path.join(docs, '_g1h3_result.json')
  fs.writeFileSync(out, JSON.stringify(report, null, 2))
  console.log(
    JSON.stringify(
      { decision: report.decision, errors: report.errors, post: report.post, out },
      null,
      2,
    ),
  )
  process.exit(code)
}

const env = loadEnv()
if (!env.JWT_SECRET) {
  report.decision = 'BLOCKED'
  report.errors.push('JWT_SECRET missing')
  finish(2)
}

const db = {
  host: env.DB_HOST || '127.0.0.1',
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER || 'study_user',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'study_system',
  charset: 'utf8mb4',
}

const conn = await createConnection(db)
async function one(sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows[0]
}
async function many(sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows
}

const codes = Object.keys(TARGETS)
const items = await many(
  `SELECT id, code, pool, status, is_active, content_version, stem, options_json,
          answer_payload_json, analysis, difficulty, qtype, source_type,
          specialty_id, category_id, knowledge_point_id
   FROM hs_math_train_items WHERE code IN (?, ?) ORDER BY code`,
  codes,
)
if (items.length !== 2) {
  report.decision = 'BLOCKED'
  report.errors.push('target items missing')
  await conn.end()
  finish(2)
}

const ids = items.map((r) => String(r.id))
const reviews = await many(
  `SELECT id, item_id, review_status, content_version, content_fingerprint
   FROM hs_math_train_item_reviews WHERE item_id IN (?, ?) ORDER BY id`,
  ids,
)

const others = await many(
  `SELECT id, code, content_version,
          SHA2(CONCAT_WS('#', code, content_version, stem, CAST(options_json AS CHAR),
            CAST(answer_payload_json AS CHAR), IFNULL(analysis,'')), 256) AS rough
   FROM hs_math_train_items
   WHERE code LIKE 'CAND-G1B-%' AND code NOT IN (?, ?)
   ORDER BY code`,
  codes,
)

report.pre = {
  items: items.map((r) => ({
    id: String(r.id),
    code: r.code,
    pool: r.pool,
    status: r.status,
    active: Number(r.is_active),
    cv: Number(r.content_version),
    stem: r.stem,
  })),
  reviews: reviews.map((r) => ({
    id: String(r.id),
    item_id: String(r.item_id),
    status: r.review_status,
    cv: Number(r.content_version),
    fp: r.content_fingerprint,
  })),
  othersCount: others.length,
  othersSnapshot: others.map((r) => ({
    code: r.code,
    cv: Number(r.content_version),
    rough: r.rough,
  })),
  drawable: Number(
    (
      await one(
        `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
      )
    ).n,
  ),
  approved: Number(
    (await one(`SELECT COUNT(1) AS n FROM hs_math_train_items WHERE status='approved'`)).n,
  ),
  sessions: Number((await one(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)).n),
  sessionItems: Number(
    (await one(`SELECT COUNT(1) AS n FROM hs_math_train_session_items`)).n,
  ),
}

for (const r of items) {
  const t = TARGETS[r.code]
  if (r.pool !== 'formal' || r.status !== 'draft' || !Number(r.is_active)) {
    report.decision = 'BLOCKED'
    report.errors.push(`${r.code} status gate`)
  }
  if (Number(r.content_version) !== 1) {
    report.decision = 'BLOCKED'
    report.errors.push(`${r.code} cv!=1`)
  }
  if (r.stem !== t.oldStem) {
    report.decision = 'BLOCKED'
    report.errors.push(`${r.code} stem mismatch before`)
  }
}
if (report.pre.othersCount !== 98) {
  report.decision = 'BLOCKED'
  report.errors.push(`others=${report.pre.othersCount}`)
}
if (report.pre.drawable !== 13) {
  report.decision = 'BLOCKED'
  report.errors.push(`drawable=${report.pre.drawable}`)
}
if (reviews.length < 2 || reviews.some((r) => r.review_status !== 'passed' || Number(r.content_version) !== 1)) {
  report.decision = 'BLOCKED'
  report.errors.push('old passed reviews missing')
}
if (report.decision === 'BLOCKED') {
  await conn.end()
  finish(2)
}

// Backup: dump rows via SELECT INTO outfile not available; write JSON + mysqldump where clauses via full table filter in JSON
const backupJson = path.join(backupDir, `g1h3_037_074_${stamp}.json`)
fs.writeFileSync(
  backupJson,
  JSON.stringify({ items, reviews, stamp }, null, 2),
)
report.backup.json = {
  path: backupJson,
  bytes: fs.statSync(backupJson).size,
  sha256: sha256File(backupJson),
  nonEmpty: fs.statSync(backupJson).size > 0,
}

// Also mysqldump filtered by writing SQL selects dump of two tables then note — use dump of reviews/items is heavy;
// write SQL insert-like export from rows
const backupSql = path.join(backupDir, `g1h3_037_074_${stamp}.sql`)
const sqlParts = [
  `-- GLOBAL-1H-3 backup ${stamp}`,
  `-- items ${codes.join(',')}`,
  ...items.map(
    (r) =>
      `-- ITEM ${r.code} id=${r.id} cv=${r.content_version} stem=${JSON.stringify(r.stem)}`,
  ),
  ...reviews.map(
    (r) =>
      `-- REVIEW id=${r.id} item=${r.item_id} status=${r.review_status} cv=${r.content_version} fp=${r.content_fingerprint}`,
  ),
]
fs.writeFileSync(backupSql, sqlParts.join('\n') + '\n' + fs.readFileSync(backupJson, 'utf8'))
report.backup.sql = {
  path: backupSql,
  bytes: fs.statSync(backupSql).size,
  sha256: sha256File(backupSql),
  nonEmpty: fs.statSync(backupSql).size > 0,
}
if (!report.backup.json.nonEmpty || !report.backup.sql.nonEmpty) {
  report.decision = 'BLOCKED'
  report.errors.push('backup empty')
  await conn.end()
  finish(2)
}

const [admins] = await conn.query(
  `SELECT id FROM users WHERE role='ADMIN' ORDER BY id ASC LIMIT 1`,
)
if (!admins.length) {
  report.decision = 'BLOCKED'
  report.errors.push('no ADMIN')
  await conn.end()
  finish(2)
}
report.adminUserId = String(admins[0].id)
const token = signJwt(report.adminUserId, 'ADMIN', env.JWT_SECRET)
await conn.end()

// Verify panel fingerprint matches old review before patch
report.pre.panels = {}
for (const r of items) {
  const panelRes = await api(
    'GET',
    `/hs-math/admin/train-items/${r.id}/review-panel`,
    token,
  )
  const panel = dataOf(panelRes.json)
  const oldRev = reviews.find((x) => String(x.item_id) === String(r.id))
  const fpMatch =
    panel?.contentFingerprint &&
    oldRev &&
    String(panel.contentFingerprint).toLowerCase() ===
      String(oldRev.content_fingerprint).toLowerCase()
  report.pre.panels[r.code] = {
    http: panelRes.status,
    cv: panel?.contentVersion,
    fp: panel?.contentFingerprint,
    currentReviewStatus: panel?.currentReviewStatus,
    fpMatchOldReview: fpMatch,
    canSubmit: panel?.canSubmitReview,
  }
  if (!fpMatch || panel?.currentReviewStatus !== 'passed') {
    report.decision = 'BLOCKED'
    report.errors.push(`${r.code} panel/review mismatch before patch`)
  }
}
if (report.decision === 'BLOCKED') finish(2)

// PATCH stems
report.patch = {}
for (const r of items) {
  const t = TARGETS[r.code]
  const patchRes = await api(
    'PATCH',
    `/hs-math/admin/train-items/${r.id}`,
    token,
    {
      stem: t.newStem,
      expectedContentVersion: 1,
    },
  )
  const data = dataOf(patchRes.json)
  report.patch[r.code] = {
    http: patchRes.status,
    stem: data?.stem,
    cv: data?.contentVersion,
    status: data?.status,
    pool: data?.pool,
    ok:
      (patchRes.status === 200 || patchRes.status === 201) &&
      data?.stem === t.newStem &&
      Number(data?.contentVersion) === 2 &&
      data?.status === 'draft' &&
      data?.pool === 'formal',
    error: patchRes.status >= 400 ? JSON.stringify(patchRes.json).slice(0, 400) : null,
  }
  if (!report.patch[r.code].ok) {
    report.decision = 'BLOCKED'
    report.errors.push(`${r.code} patch failed`)
  }
}
if (report.decision === 'BLOCKED') finish(2)

// After patch verify via panel + DB
const conn2 = await createConnection(db)
async function one2(sql, params = []) {
  const [rows] = await conn2.query(sql, params)
  return rows[0]
}
async function many2(sql, params = []) {
  const [rows] = await conn2.query(sql, params)
  return rows
}

const afterItems = await many2(
  `SELECT id, code, stem, content_version, status, pool, is_active,
          options_json, answer_payload_json, analysis, difficulty, qtype
   FROM hs_math_train_items WHERE code IN (?, ?) ORDER BY code`,
  codes,
)
const othersAfter = await many2(
  `SELECT code, content_version,
          SHA2(CONCAT_WS('#', code, content_version, stem, CAST(options_json AS CHAR),
            CAST(answer_payload_json AS CHAR), IFNULL(analysis,'')), 256) AS rough
   FROM hs_math_train_items
   WHERE code LIKE 'CAND-G1B-%' AND code NOT IN (?, ?)
   ORDER BY code`,
  codes,
)

const othersMapBefore = new Map(
  report.pre.othersSnapshot.map((o) => [o.code, o]),
)
const othersChanged = othersAfter.filter((o) => {
  const b = othersMapBefore.get(o.code)
  return !b || Number(b.cv) !== Number(o.content_version) || b.rough !== o.rough
})

report.afterPatch.db = afterItems.map((r) => ({
  code: r.code,
  stem: r.stem,
  cv: Number(r.content_version),
  status: r.status,
  pool: r.pool,
}))
report.afterPatch.othersChanged = othersChanged.map((o) => o.code)

report.afterPatch.panels = {}
for (const r of afterItems) {
  const panelRes = await api(
    'GET',
    `/hs-math/admin/train-items/${r.id}/review-panel`,
    token,
  )
  const panel = dataOf(panelRes.json)
  const oldFp = report.pre.panels[r.code]?.fp
  report.afterPatch.panels[r.code] = {
    http: panelRes.status,
    cv: panel?.contentVersion,
    fp: panel?.contentFingerprint,
    currentReviewStatus: panel?.currentReviewStatus,
    reviewIsStale: panel?.reviewIsStale,
    fpChanged: oldFp && panel?.contentFingerprint && oldFp !== panel.contentFingerprint,
    stem: panel?.stem,
    optionsUnchanged:
      JSON.stringify(panel?.optionsJson) ===
      JSON.stringify(
        typeof items.find((i) => i.code === r.code).options_json === 'string'
          ? JSON.parse(items.find((i) => i.code === r.code).options_json)
          : items.find((i) => i.code === r.code).options_json,
      ),
  }
  if (
    Number(panel?.contentVersion) !== 2 ||
    panel?.stem !== TARGETS[r.code].newStem ||
    panel?.currentReviewStatus !== 'stale' ||
    !panel?.reviewIsStale ||
    !report.afterPatch.panels[r.code].fpChanged
  ) {
    report.decision = 'BLOCKED'
    report.errors.push(`${r.code} after-patch gate fail`)
  }
}

if (othersChanged.length) {
  report.decision = 'BLOCKED'
  report.errors.push(`others98 changed: ${othersChanged.map((o) => o.code).join(',')}`)
}

if (report.decision === 'BLOCKED') {
  await conn2.end()
  finish(2)
}

// Re-review both
report.reviews = {}
for (const r of afterItems) {
  const panelRes = await api(
    'GET',
    `/hs-math/admin/train-items/${r.id}/review-panel`,
    token,
  )
  const panel = dataOf(panelRes.json)
  const t = TARGETS[r.code]
  const mathNote =
    r.code === 'CAND-G1B-037'
      ? '对数法则A/B/D正确；C缺|M|/定义域不宜选；答案A,B,D'
      : '向量分配/结合/点积交换正确；叉积反交换故D错；答案A,B,C'
  const comment = [
    `GLOBAL-1H-3新版本审核通过（content_version=${panel.contentVersion}）。`,
    `题干已润色为：「${t.newStem}」。`,
    `核对：stem与选项主题一致；options/answer/analysis/KP未改；${mathNote}。`,
    `旧cv=1 review已stale；本记录绑定当前fingerprint，非复制旧审。`,
  ].join(' ')

  const sub = await api(
    'POST',
    `/hs-math/admin/train-items/${r.id}/reviews`,
    token,
    {
      decision: 'passed',
      comment,
      expectedContentVersion: panel.contentVersion,
      expectedContentFingerprint: panel.contentFingerprint,
    },
  )
  const subData = dataOf(sub.json)
  const ok =
    (sub.status === 200 || sub.status === 201) &&
    subData?.reviewStatus === 'passed' &&
    Number(subData?.contentVersion) === 2 &&
    String(subData?.contentFingerprint) === String(panel.contentFingerprint) &&
    subData?.itemStatusUnchanged === 'draft'

  report.reviews[r.code] = {
    http: sub.status,
    ok,
    reviewId: subData?.id,
    cv: subData?.contentVersion,
    fp: subData?.contentFingerprint,
    itemStatus: subData?.itemStatusUnchanged,
    error: ok ? null : JSON.stringify(sub.json).slice(0, 400),
  }
  if (!ok) {
    report.decision = 'BLOCKED'
    report.errors.push(`${r.code} rereview failed`)
  }
}

if (report.decision === 'BLOCKED') {
  await conn2.end()
  finish(2)
}

// Final verify
const finalItems = await many2(
  `SELECT code, stem, content_version, status, pool FROM hs_math_train_items WHERE code IN (?, ?)`,
  codes,
)
const finalReviews = await many2(
  `SELECT r.id, i.code, r.review_status, r.content_version, r.content_fingerprint
   FROM hs_math_train_item_reviews r
   INNER JOIN hs_math_train_items i ON i.id=r.item_id
   WHERE i.code IN (?, ?)
   ORDER BY i.code, r.id`,
  codes,
)
const approvedNow = Number(
  (await one2(`SELECT COUNT(1) AS n FROM hs_math_train_items WHERE status='approved'`)).n,
)
const drawableNow = Number(
  (
    await one2(
      `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
    )
  ).n,
)
const sessionsNow = Number(
  (await one2(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)).n,
)
const sessionItemsNow = Number(
  (await one2(`SELECT COUNT(1) AS n FROM hs_math_train_session_items`)).n,
)

report.post = {
  items: finalItems,
  reviews: finalReviews,
  approvedDelta: approvedNow - report.pre.approved,
  drawableNow,
  sessionsDelta: sessionsNow - report.pre.sessions,
  sessionItemsDelta: sessionItemsNow - report.pre.sessionItems,
}

// panel final
report.post.panels = {}
for (const r of afterItems) {
  const panelRes = await api(
    'GET',
    `/hs-math/admin/train-items/${r.id}/review-panel`,
    token,
  )
  const panel = dataOf(panelRes.json)
  report.post.panels[r.code] = {
    cv: panel?.contentVersion,
    stem: panel?.stem,
    currentReviewStatus: panel?.currentReviewStatus,
    reviewIsStale: panel?.reviewIsStale,
    fp: panel?.contentFingerprint,
  }
}

await conn2.end()

const pass =
  finalItems.every(
    (r) =>
      Number(r.content_version) === 2 &&
      r.stem === TARGETS[r.code].newStem &&
      r.status === 'draft' &&
      r.pool === 'formal',
  ) &&
  Object.values(report.reviews).every((x) => x.ok) &&
  Object.values(report.post.panels).every(
    (p) => p.currentReviewStatus === 'passed' && p.cv === 2 && !p.reviewIsStale,
  ) &&
  report.afterPatch.othersChanged.length === 0 &&
  report.post.approvedDelta === 0 &&
  report.post.drawableNow === 13 &&
  report.post.sessionsDelta === 0 &&
  report.post.sessionItemsDelta === 0

// each code has at least one cv1 passed (stale) and one cv2 passed
for (const code of codes) {
  const rs = finalReviews.filter((x) => x.code === code)
  const hasOld = rs.some(
    (x) => Number(x.content_version) === 1 && x.review_status === 'passed',
  )
  const hasNew = rs.some(
    (x) => Number(x.content_version) === 2 && x.review_status === 'passed',
  )
  if (!hasOld || !hasNew) {
    report.errors.push(`${code} missing old/new review rows`)
  }
}

if (pass && !report.errors.length) {
  report.decision = 'REVIEW_REFRESH_PASS'
  finish(0)
}

report.decision = report.errors.length ? 'BLOCKED' : 'PARTIAL'
finish(1)
