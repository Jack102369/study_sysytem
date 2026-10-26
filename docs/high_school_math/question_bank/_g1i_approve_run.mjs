/**
 * GLOBAL-1I: approve CAND-G1B-001..100 via Admin PATCH status.
 * Per-item stop-on-fail. DO NOT commit. No secrets in result JSON.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const docs = path.resolve(__dirname, '..')
const backupDir = path.join(docs, '_backups')
fs.mkdirSync(backupDir, { recursive: true })
const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const ADMIN_USER_ID = '2'

const expectedCodes = Array.from({ length: 100 }, (_, i) => {
  const n = String(i + 1).padStart(3, '0')
  return `CAND-G1B-${n}`
})

const report = {
  phase: 'HS-MATH-BANK-GLOBAL-1I',
  authorized: true,
  authorizationQuote:
    '授权 GLOBAL-1I：允许备份，并通过现有管理员 approve API逐题正式批准首批100道高一数学题；失败立即停止，禁止其他业务写入。',
  startedAt: new Date().toISOString(),
  decision: null,
  adminUserId: ADMIN_USER_ID,
  backup: {},
  baseline: {},
  recheck: {},
  approve: {
    apiCalls: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    perItem: [],
    stoppedAt: null,
    failReason: null,
  },
  post: {},
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
    JSON.stringify({ sub, role, iat: now, exp: now + 7200 }),
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
      Authorization: `Bearer ${token}`,
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
  delete report.token
  const out = path.join(docs, '_g1i_approve_result.json')
  fs.writeFileSync(out, JSON.stringify(report, null, 2))
  console.log(
    JSON.stringify(
      {
        decision: report.decision,
        approve: {
          apiCalls: report.approve.apiCalls,
          success: report.approve.success,
          failed: report.approve.failed,
          skipped: report.approve.skipped,
          stoppedAt: report.approve.stoppedAt,
          failReason: report.approve.failReason,
        },
        post: report.post,
        backup: report.backup,
        errors: report.errors,
        out,
      },
      null,
      2,
    ),
  )
  process.exit(code)
}

async function openDb(env) {
  return createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER || 'study_user',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'study_system',
    charset: 'utf8mb4',
  })
}

async function one(conn, sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows[0]
}
async function many(conn, sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows
}

const env = loadEnv()
if (!env.JWT_SECRET) {
  report.decision = 'BLOCKED'
  report.errors.push('JWT_SECRET missing')
  finish(2)
}

// Verify admin user id=2 exists
{
  const c0 = await openDb(env)
  const admin = await one(
    c0,
    `SELECT id, role FROM users WHERE id=? LIMIT 1`,
    [ADMIN_USER_ID],
  )
  await c0.end()
  if (!admin || String(admin.role).toUpperCase() !== 'ADMIN') {
    report.decision = 'BLOCKED'
    report.errors.push(`users.id=${ADMIN_USER_ID} is not ADMIN`)
    finish(2)
  }
}

const token = signJwt(ADMIN_USER_ID, 'ADMIN', env.JWT_SECRET)

// ---------- baseline + load batch ----------
const conn1 = await openDb(env)
const cand = await many(
  conn1,
  `SELECT id, code, pool, status, is_active, qtype, difficulty, content_version,
          specialty_id, category_id, knowledge_point_id, stem,
          options_json, answer_payload_json, analysis,
          source_type, source_year, source_exam_name, source_question_no,
          source_reference, source_adaptation_note,
          source_verification_status, source_license_status,
          reviewed_by, reviewed_at, created_at, updated_at
   FROM hs_math_train_items
   WHERE code REGEXP '^CAND-G1B-[0-9]{3}$'
   ORDER BY code`,
)
const byCode = new Map(cand.map((r) => [r.code, r]))
const missing = expectedCodes.filter((c) => !byCode.has(c))
const extra = cand.map((r) => r.code).filter((c) => !expectedCodes.includes(c))
const ids = cand.map((r) => r.id)
const ph = ids.map(() => '?').join(',')

const reviews = ids.length
  ? await many(
      conn1,
      `SELECT id, item_id, review_status, content_version, content_fingerprint,
              reviewer_user_id, reviewed_at, review_comment
       FROM hs_math_train_item_reviews WHERE item_id IN (${ph})
       ORDER BY item_id, reviewed_at DESC, id DESC`,
      ids,
    )
  : []
const kps = ids.length
  ? await many(
      conn1,
      `SELECT id, item_id, knowledge_point_id, is_primary, sort_order
       FROM hs_math_train_item_kps WHERE item_id IN (${ph})`,
      ids,
    )
  : []
const methods = ids.length
  ? await many(
      conn1,
      `SELECT id, item_id, method_id, is_primary, sort_order
       FROM hs_math_train_item_methods WHERE item_id IN (${ph})`,
      ids,
    )
  : []

const hist13 = await many(
  conn1,
  `SELECT id, code, pool, status, is_active, content_version,
          SHA2(CONCAT_WS('#', code, content_version, stem,
            CAST(options_json AS CHAR), CAST(answer_payload_json AS CHAR),
            IFNULL(analysis,'')), 256) AS rough
   FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1
     AND code NOT LIKE 'CAND-G1B-%'
   ORDER BY code`,
)

report.baseline = {
  candN: cand.length,
  missing,
  extra,
  formalDraftActive: cand.filter(
    (r) => r.pool === 'formal' && r.status === 'draft' && Number(r.is_active),
  ).length,
  candApproved: cand.filter((r) => r.status === 'approved').length,
  cv1: cand.filter((r) => Number(r.content_version) === 1).length,
  cv2: cand.filter((r) => Number(r.content_version) === 2).length,
  drawable: Number(
    (
      await one(
        conn1,
        `SELECT COUNT(1) AS n FROM hs_math_train_items
         WHERE pool='formal' AND status='approved' AND is_active=1`,
      )
    ).n,
  ),
  approvedAll: Number(
    (await one(conn1, `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE status='approved'`)).n,
  ),
  sessions: Number((await one(conn1, `SELECT COUNT(1) AS n FROM hs_math_train_sessions`)).n),
  sessionItems: Number(
    (await one(conn1, `SELECT COUNT(1) AS n FROM hs_math_train_session_items`)).n,
  ),
  hist13Count: hist13.length,
  hist13Snapshot: hist13.map((r) => ({
    code: r.code,
    cv: Number(r.content_version),
    rough: r.rough,
  })),
  reviewN: reviews.length,
  kpN: kps.length,
  methodN: methods.length,
}
await conn1.end()

if (
  report.baseline.candN !== 100 ||
  missing.length ||
  extra.length ||
  report.baseline.formalDraftActive !== 100 ||
  report.baseline.candApproved !== 0 ||
  report.baseline.drawable !== 13 ||
  report.baseline.cv2 !== 2 ||
  report.baseline.cv1 !== 98
) {
  report.decision = 'BLOCKED'
  report.errors.push('baseline mismatch vs PREFLIGHT')
  finish(2)
}

// ---------- backup ----------
const backupJson = path.join(backupDir, `g1i_cand100_${stamp}.json`)
const backupPayload = {
  stamp,
  phase: 'GLOBAL-1I',
  items: cand,
  reviews: reviews.map((r) => ({
    id: String(r.id),
    item_id: String(r.item_id),
    review_status: r.review_status,
    content_version: Number(r.content_version),
    content_fingerprint: r.content_fingerprint,
    reviewer_user_id: String(r.reviewer_user_id),
    reviewed_at: r.reviewed_at,
    comment_len: String(r.review_comment || '').length,
  })),
  kps,
  methods,
  hist13Snapshot: report.baseline.hist13Snapshot,
  sessions: report.baseline.sessions,
  sessionItems: report.baseline.sessionItems,
  drawable: report.baseline.drawable,
}
fs.writeFileSync(backupJson, JSON.stringify(backupPayload, null, 2))
const backupSql = path.join(backupDir, `g1i_cand100_${stamp}.sql`)
fs.writeFileSync(
  backupSql,
  [
    `-- GLOBAL-1I backup ${stamp}`,
    `-- items=${cand.length} reviews=${reviews.length} kps=${kps.length} methods=${methods.length}`,
    `-- drawable=${report.baseline.drawable} sessions=${report.baseline.sessions}`,
    `-- JSON companion: ${path.basename(backupJson)}`,
    fs.readFileSync(backupJson, 'utf8'),
  ].join('\n'),
)

report.backup = {
  json: {
    path: backupJson,
    bytes: fs.statSync(backupJson).size,
    sha256: sha256File(backupJson),
    readable: true,
    nonEmpty: fs.statSync(backupJson).size > 0,
  },
  sql: {
    path: backupSql,
    bytes: fs.statSync(backupSql).size,
    sha256: sha256File(backupSql),
    readable: true,
    nonEmpty: fs.statSync(backupSql).size > 0,
  },
  stamp,
}
if (!report.backup.json.nonEmpty || !report.backup.sql.nonEmpty) {
  report.decision = 'BLOCKED'
  report.errors.push('backup empty')
  finish(2)
}

// ---------- full recheck via review-panel (GET only) ----------
const recheckFails = []
const panelCache = new Map()
for (const code of expectedCodes) {
  const row = byCode.get(code)
  const panelRes = await api(
    'GET',
    `/hs-math/admin/train-items/${row.id}/review-panel`,
    token,
  )
  const panel = dataOf(panelRes.json)
  const reasons = []
  if (panelRes.status !== 200 || !panel?.contentFingerprint) {
    reasons.push(`panel_http=${panelRes.status}`)
  } else {
    if (panel.pool !== 'formal') reasons.push('pool')
    if (panel.status !== 'draft') reasons.push(`status=${panel.status}`)
    if (!panel.isActive) reasons.push('inactive')
    if (Number(panel.contentVersion) !== Number(row.content_version)) {
      reasons.push('cv_mismatch')
    }
    if (panel.currentReviewStatus !== 'passed') {
      reasons.push(`review=${panel.currentReviewStatus}`)
    }
    if (panel.reviewIsStale) reasons.push('stale')
    if (panel.canPublish !== true) {
      reasons.push(`canPublish=false:${(panel.publishBlockReasons || []).join('|')}`)
    }
    if (code === 'CAND-G1B-037' || code === 'CAND-G1B-074') {
      if (Number(panel.contentVersion) !== 2) reasons.push('must_cv2')
      const okCv2 = (panel.reviewHistory || []).some(
        (h) =>
          Number(h.contentVersion) === 2 &&
          h.reviewStatus === 'passed' &&
          !h.isStale &&
          String(h.contentFingerprint).toLowerCase() ===
            String(panel.contentFingerprint).toLowerCase(),
      )
      if (!okCv2) reasons.push('cv2_review_missing')
    }
    panelCache.set(code, {
      id: String(row.id),
      cv: Number(panel.contentVersion),
      fp: panel.contentFingerprint,
      canPublish: panel.canPublish,
    })
  }
  if (reasons.length) recheckFails.push({ code, reasons })
}

report.recheck = {
  ok: recheckFails.length === 0,
  failN: recheckFails.length,
  fails: recheckFails.slice(0, 20),
}
if (recheckFails.length) {
  report.decision = 'BLOCKED'
  report.errors.push('recheck failed; no approve started')
  finish(2)
}

// ---------- sequential approve ----------
for (let i = 0; i < expectedCodes.length; i++) {
  const code = expectedCodes[i]
  const row = byCode.get(code)
  const cached = panelCache.get(code)

  // per-item pre-check
  const prePanelRes = await api(
    'GET',
    `/hs-math/admin/train-items/${row.id}/review-panel`,
    token,
  )
  const pre = dataOf(prePanelRes.json)
  const preOk =
    prePanelRes.status === 200 &&
    pre?.status === 'draft' &&
    pre?.pool === 'formal' &&
    pre?.isActive === true &&
    pre?.currentReviewStatus === 'passed' &&
    pre?.reviewIsStale === false &&
    pre?.canPublish === true &&
    Number(pre.contentVersion) === cached.cv &&
    String(pre.contentFingerprint).toLowerCase() === String(cached.fp).toLowerCase() &&
    (code !== 'CAND-G1B-037' && code !== 'CAND-G1B-074'
      ? true
      : Number(pre.contentVersion) === 2)

  if (!preOk) {
    report.approve.stoppedAt = code
    report.approve.failReason = 'precheck_before_approve'
    report.approve.failed = 1
    report.approve.skipped = expectedCodes.length - i
    report.approve.perItem.push({
      code,
      phase: 'precheck',
      http: prePanelRes.status,
      ok: false,
      detail: {
        status: pre?.status,
        cv: pre?.contentVersion,
        currentReviewStatus: pre?.currentReviewStatus,
        canPublish: pre?.canPublish,
        stale: pre?.reviewIsStale,
      },
    })
    report.decision = i === 0 ? 'BLOCKED' : 'PARTIAL'
    break
  }

  const patchRes = await api(
    'PATCH',
    `/hs-math/admin/train-items/${row.id}/status`,
    token,
    { status: 'approved', confirmPublish: true },
  )
  report.approve.apiCalls += 1
  const patched = dataOf(patchRes.json)
  const patchOk =
    patchRes.status >= 200 &&
    patchRes.status < 300 &&
    patched?.status === 'approved' &&
    patched?.pool === 'formal' &&
    (patched?.isActive === true || patched?.is_active === true || patched?.isActive === 1)

  // immediate post-check via GET panel
  const postPanelRes = await api(
    'GET',
    `/hs-math/admin/train-items/${row.id}/review-panel`,
    token,
  )
  const postP = dataOf(postPanelRes.json)
  const postOk =
    patchOk &&
    postPanelRes.status === 200 &&
    postP?.status === 'approved' &&
    postP?.pool === 'formal' &&
    postP?.isActive === true &&
    Number(postP.contentVersion) === cached.cv &&
    String(postP.contentFingerprint).toLowerCase() === String(cached.fp).toLowerCase() &&
    postP?.currentReviewStatus === 'passed' &&
    postP?.reviewIsStale === false

  report.approve.perItem.push({
    code,
    id: String(row.id),
    http: patchRes.status,
    ok: !!postOk,
    cv: cached.cv,
    fp: cached.fp,
    afterStatus: postP?.status ?? patched?.status,
    afterCv: postP?.contentVersion,
    afterFp: postP?.contentFingerprint,
    err:
      patchOk && postOk
        ? null
        : JSON.stringify(patchRes.json?.message || patchRes.json || {}).slice(0, 300),
  })

  if (!postOk) {
    report.approve.failed = 1
    report.approve.stoppedAt = code
    report.approve.failReason = `approve_or_postcheck_failed http=${patchRes.status}`
    report.approve.success = report.approve.perItem.filter((x) => x.ok).length
    report.approve.skipped = expectedCodes.length - i - 1
    report.decision = report.approve.success > 0 ? 'PARTIAL' : 'BLOCKED'
    break
  }

  report.approve.success += 1
}

if (report.decision === null) {
  // all looped without break
  if (report.approve.success === 100 && report.approve.apiCalls === 100) {
    report.decision = 'APPROVE_PASS'
  } else if (report.approve.success > 0) {
    report.decision = 'PARTIAL'
  } else {
    report.decision = 'BLOCKED'
  }
}

// ---------- independent post verification (new connection) ----------
const conn2 = await openDb(env)
const postCand = await many(
  conn2,
  `SELECT id, code, pool, status, is_active, content_version, qtype,
          answer_payload_json
   FROM hs_math_train_items
   WHERE code REGEXP '^CAND-G1B-[0-9]{3}$'
   ORDER BY code`,
)
const postApproved = postCand.filter((r) => r.status === 'approved')
const postDraft = postCand.filter((r) => r.status === 'draft')
const postIds = postCand.map((r) => r.id)
const postPh = postIds.map(() => '?').join(',')
const postKps = await many(
  conn2,
  `SELECT item_id, is_primary FROM hs_math_train_item_kps WHERE item_id IN (${postPh})`,
  postIds,
)
const postMethods = await many(
  conn2,
  `SELECT item_id FROM hs_math_train_item_methods WHERE item_id IN (${postPh})`,
  postIds,
)
const kpBy = new Map()
for (const l of postKps) {
  const k = String(l.item_id)
  if (!kpBy.has(k)) kpBy.set(k, [])
  kpBy.get(k).push(l)
}
const mBy = new Map()
for (const l of postMethods) {
  const k = String(l.item_id)
  mBy.set(k, (mBy.get(k) || 0) + 1)
}

let appRubricBad = []
for (const a of postCand.filter((r) => r.qtype === 'application')) {
  const p =
    typeof a.answer_payload_json === 'string'
      ? JSON.parse(a.answer_payload_json)
      : a.answer_payload_json
  const sum = (p?.rubric || []).reduce((s, x) => s + Number(x.maxScore), 0)
  if (
    p?.kind !== 'application' ||
    sum !== Number(p.maxScore) ||
    !(p.rubric || []).every((x) => x.criteria && Number(x.maxScore) > 0)
  ) {
    appRubricBad.push(a.code)
  }
}

const o37 = postCand.find((r) => r.code === 'CAND-G1B-037')
const o74 = postCand.find((r) => r.code === 'CAND-G1B-074')
const others98CvOk = postCand
  .filter((r) => r.code !== 'CAND-G1B-037' && r.code !== 'CAND-G1B-074')
  .every((r) => Number(r.content_version) === 1)

const hist13After = await many(
  conn2,
  `SELECT code, content_version,
          SHA2(CONCAT_WS('#', code, content_version, stem,
            CAST(options_json AS CHAR), CAST(answer_payload_json AS CHAR),
            IFNULL(analysis,'')), 256) AS rough
   FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1
     AND code NOT LIKE 'CAND-G1B-%'
   ORDER BY code`,
)
const hist13Map = new Map(report.baseline.hist13Snapshot.map((x) => [x.code, x]))
const hist13Unchanged = hist13After.every((r) => {
  const b = hist13Map.get(r.code)
  return b && Number(b.cv) === Number(r.content_version) && b.rough === r.rough
}) && hist13After.length === report.baseline.hist13Count

const drawableNow = Number(
  (
    await one(
      conn2,
      `SELECT COUNT(1) AS n FROM hs_math_train_items
       WHERE pool='formal' AND status='approved' AND is_active=1`,
    )
  ).n,
)
const sessionsNow = Number(
  (await one(conn2, `SELECT COUNT(1) AS n FROM hs_math_train_sessions`)).n,
)
const sessionItemsNow = Number(
  (await one(conn2, `SELECT COUNT(1) AS n FROM hs_math_train_session_items`)).n,
)

// sample panel match for 037/074 + first approved
const sampleCodes = ['CAND-G1B-001', 'CAND-G1B-037', 'CAND-G1B-074', 'CAND-G1B-100']
const samplePanels = {}
for (const code of sampleCodes) {
  const row = postCand.find((r) => r.code === code)
  if (!row) continue
  const pr = await api('GET', `/hs-math/admin/train-items/${row.id}/review-panel`, token)
  const p = dataOf(pr.json)
  samplePanels[code] = {
    http: pr.status,
    status: p?.status,
    cv: p?.contentVersion,
    currentReviewStatus: p?.currentReviewStatus,
    reviewIsStale: p?.reviewIsStale,
    fp: p?.contentFingerprint,
  }
}
await conn2.end()

const missingKp = postCand.filter((r) => !(kpBy.get(String(r.id)) || []).length)
const badPrimary = postCand.filter((r) => {
  const ls = kpBy.get(String(r.id)) || []
  return ls.filter((x) => Number(x.is_primary)).length !== 1
})
const missingMethod = postCand.filter((r) => !(mBy.get(String(r.id)) || 0))

report.post = {
  candN: postCand.length,
  approved: postApproved.length,
  draft: postDraft.length,
  otherStatus: postCand.filter((r) => r.status !== 'approved' && r.status !== 'draft')
    .length,
  approvedFormalActive: postApproved.filter(
    (r) => r.pool === 'formal' && Number(r.is_active),
  ).length,
  o37: o37
    ? { status: o37.status, cv: Number(o37.content_version), active: Number(o37.is_active) }
    : null,
  o74: o74
    ? { status: o74.status, cv: Number(o74.content_version), active: Number(o74.is_active) }
    : null,
  others98CvStill1: others98CvOk,
  missingKp: missingKp.map((r) => r.code),
  badPrimary: badPrimary.map((r) => r.code),
  missingMethod: missingMethod.map((r) => r.code),
  appRubricBad,
  hist13Unchanged,
  hist13AfterN: hist13After.length,
  drawableBefore: report.baseline.drawable,
  drawableAfter: drawableNow,
  sessionsBefore: report.baseline.sessions,
  sessionsAfter: sessionsNow,
  sessionItemsBefore: report.baseline.sessionItems,
  sessionItemsAfter: sessionItemsNow,
  samplePanels,
  acceptFullPass:
    postCand.length === 100 &&
    postApproved.length === 100 &&
    postDraft.length === 0 &&
    drawableNow === 113 &&
    Number(o37?.content_version) === 2 &&
    Number(o74?.content_version) === 2 &&
    o37?.status === 'approved' &&
    o74?.status === 'approved' &&
    others98CvOk &&
    hist13Unchanged &&
    sessionsNow === report.baseline.sessions &&
    sessionItemsNow === report.baseline.sessionItems &&
    missingKp.length === 0 &&
    badPrimary.length === 0 &&
    missingMethod.length === 0 &&
    appRubricBad.length === 0,
}

if (report.decision === 'APPROVE_PASS' && !report.post.acceptFullPass) {
  report.decision = 'PARTIAL'
  report.errors.push('approve loop claimed pass but independent accept failed')
}
if (report.decision === 'APPROVE_PASS' && report.post.acceptFullPass) {
  // keep
} else if (report.approve.success === 100 && report.post.acceptFullPass) {
  report.decision = 'APPROVE_PASS'
}

finish(report.decision === 'APPROVE_PASS' ? 0 : 1)
