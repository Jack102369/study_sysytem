/**
 * GLOBAL-1I-PREFLIGHT readonly.
 * SELECT + GET only. NO approve / PATCH / POST / write DB.
 * DO NOT commit (local JWT construction; output must not contain secrets).
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const docs = path.resolve(__dirname, '..')
const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'

const report = {
  phase: 'HS-MATH-BANK-GLOBAL-1I-PREFLIGHT',
  startedAt: new Date().toISOString(),
  decision: null,
  readonly: true,
  wroteDb: false,
  calledApprove: false,
  calledMutatingHttp: false,
  counts: {},
  special037074: {},
  approveApiPlan: {},
  items: [],
  blocked: [],
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

async function apiGet(urlPath, token) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text.slice(0, 200) }
  }
  return { status: res.status, json }
}

function dataOf(json) {
  if (json?.success === true && json.data !== undefined) return json.data
  return json
}

function finish(code) {
  report.endedAt = new Date().toISOString()
  // strip any accidental secrets
  delete report.token
  delete report.dbPassword
  const out = path.join(docs, '_g1i_preflight_ro.json')
  fs.writeFileSync(out, JSON.stringify(report, null, 2))
  console.log(
    JSON.stringify(
      {
        decision: report.decision,
        counts: report.counts,
        special037074: report.special037074,
        blockedN: report.blocked.length,
        errors: report.errors,
        out,
      },
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

const conn = await createConnection({
  host: env.DB_HOST || '127.0.0.1',
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER || 'study_user',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'study_system',
  charset: 'utf8mb4',
})

async function one(sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows[0]
}
async function many(sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows
}

const cand = await many(
  `SELECT id, code, pool, status, is_active, qtype, difficulty, content_version,
          specialty_id, category_id, knowledge_point_id, stem,
          options_json, answer_payload_json, analysis,
          source_type, source_reference, source_verification_status, source_license_status,
          source_year, source_exam_name, source_question_no, source_adaptation_note,
          reviewed_by, reviewed_at, created_at, updated_at
   FROM hs_math_train_items
   WHERE code REGEXP '^CAND-G1B-[0-9]{3}$'
   ORDER BY code`,
)

const expectedCodes = Array.from({ length: 100 }, (_, i) => {
  const n = String(i + 1).padStart(3, '0')
  return `CAND-G1B-${n}`
})
const codeSet = new Set(cand.map((r) => r.code))
const missingCodes = expectedCodes.filter((c) => !codeSet.has(c))
const extraCodes = cand.map((r) => r.code).filter((c) => !expectedCodes.includes(c))
const dupCodes = (() => {
  const m = new Map()
  for (const r of cand) m.set(r.code, (m.get(r.code) || 0) + 1)
  return [...m.entries()].filter(([, n]) => n > 1).map(([c]) => c)
})()

const ids = cand.map((r) => r.id)
let reviewRows = []
let kpLinks = []
let methodLinks = []
if (ids.length) {
  const ph = ids.map(() => '?').join(',')
  reviewRows = await many(
    `SELECT id, item_id, review_status, content_version, content_fingerprint,
            reviewer_user_id, reviewed_at,
            CHAR_LENGTH(IFNULL(review_comment,'')) AS comment_len
     FROM hs_math_train_item_reviews
     WHERE item_id IN (${ph})
     ORDER BY item_id, reviewed_at DESC, id DESC`,
    ids,
  )
  kpLinks = await many(
    `SELECT item_id, knowledge_point_id, is_primary FROM hs_math_train_item_kps
     WHERE item_id IN (${ph})`,
    ids,
  )
  methodLinks = await many(
    `SELECT item_id, method_id, is_primary FROM hs_math_train_item_methods
     WHERE item_id IN (${ph})`,
    ids,
  )
}

const reviewsByItem = new Map()
for (const r of reviewRows) {
  const k = String(r.item_id)
  if (!reviewsByItem.has(k)) reviewsByItem.set(k, [])
  reviewsByItem.get(k).push(r)
}
const kpByItem = new Map()
for (const l of kpLinks) {
  const k = String(l.item_id)
  if (!kpByItem.has(k)) kpByItem.set(k, [])
  kpByItem.get(k).push(l)
}
const mByItem = new Map()
for (const l of methodLinks) {
  const k = String(l.item_id)
  if (!mByItem.has(k)) mByItem.set(k, [])
  mByItem.get(k).push(l)
}

const drawable = Number(
  (
    await one(
      `SELECT COUNT(1) AS n FROM hs_math_train_items
       WHERE pool='formal' AND status='approved' AND is_active=1`,
    )
  ).n,
)
const approvedAll = Number(
  (await one(`SELECT COUNT(1) AS n FROM hs_math_train_items WHERE status='approved'`)).n,
)
const sessions = Number((await one(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)).n)
const sessionItems = Number(
  (await one(`SELECT COUNT(1) AS n FROM hs_math_train_session_items`)).n,
)
const candApproved = cand.filter((r) => r.status === 'approved').length

const [admins] = await conn.query(
  `SELECT id FROM users WHERE role='ADMIN' ORDER BY id ASC LIMIT 1`,
)
if (!admins.length) {
  report.decision = 'BLOCKED'
  report.errors.push('no ADMIN user')
  await conn.end()
  finish(2)
}
const adminId = String(admins[0].id)
const token = signJwt(adminId, 'ADMIN', env.JWT_SECRET)
await conn.end()

// GET review-panel for each item (server fingerprint + canPublish)
const panelByCode = {}
let httpFails = 0
for (const r of cand) {
  const res = await apiGet(`/hs-math/admin/train-items/${r.id}/review-panel`, token)
  const panel = dataOf(res.json)
  if (res.status !== 200 || !panel?.contentFingerprint) {
    httpFails++
    panelByCode[r.code] = { http: res.status, error: true }
    continue
  }
  panelByCode[r.code] = {
    http: res.status,
    contentVersion: panel.contentVersion,
    contentFingerprint: panel.contentFingerprint,
    currentReviewStatus: panel.currentReviewStatus,
    reviewIsStale: panel.reviewIsStale,
    canPublish: panel.canPublish === true,
    publishBlockReasons: panel.publishBlockReasons || [],
    status: panel.status,
    pool: panel.pool,
    isActive: panel.isActive,
    reviewHistory: (panel.reviewHistory || []).map((h) => ({
      id: h.id,
      reviewStatus: h.reviewStatus,
      contentVersion: h.contentVersion,
      contentFingerprint: h.contentFingerprint,
      isStale: h.isStale,
      commentLen: String(h.reviewComment || '').length,
    })),
  }
}

let approvable = 0
let effectivePassed = 0
const blocked = []
const itemSummaries = []

for (const r of cand) {
  const reasons = []
  const idk = String(r.id)
  const panel = panelByCode[r.code]
  const revs = reviewsByItem.get(idk) || []
  const kps = kpByItem.get(idk) || []
  const ms = mByItem.get(idk) || []
  const cv = Number(r.content_version)

  if (r.pool !== 'formal') reasons.push('pool!=formal')
  if (r.status !== 'draft') reasons.push(`status=${r.status}`)
  if (!Number(r.is_active)) reasons.push('inactive')
  if (!panel || panel.error) reasons.push('panel_http_fail')

  if (panel && !panel.error) {
    if (Number(panel.contentVersion) !== cv) reasons.push('panel_cv_mismatch')
    if (panel.currentReviewStatus !== 'passed') {
      reasons.push(`currentReview=${panel.currentReviewStatus}`)
    }
    if (panel.reviewIsStale) reasons.push('reviewIsStale')
    if (!panel.canPublish) {
      reasons.push(
        ...(panel.publishBlockReasons.length
          ? panel.publishBlockReasons.map((x) => `pub:${x}`)
          : ['canPublish=false']),
      )
    }
    // same-version passed fp match
    const sameVerPassed = (panel.reviewHistory || []).filter(
      (h) =>
        Number(h.contentVersion) === cv &&
        h.reviewStatus === 'passed' &&
        !h.isStale &&
        String(h.contentFingerprint).toLowerCase() ===
          String(panel.contentFingerprint).toLowerCase(),
    )
    if (!sameVerPassed.length) {
      reasons.push('no_current_version_passed_fp_match')
    } else {
      effectivePassed++
    }

    // Old-version must not be treated as current
    const oldPassedAsCurrent = (panel.reviewHistory || []).some(
      (h) =>
        Number(h.contentVersion) !== cv &&
        h.reviewStatus === 'passed' &&
        h.isStale === false,
    )
    if (oldPassedAsCurrent) {
      reasons.push('OLD_REVIEW_NOT_MARKED_STALE')
    }
  }

  if (!kps.length) reasons.push('missing_kp')
  if (kps.filter((x) => Number(x.is_primary)).length !== 1) {
    reasons.push('primary_kp!=1')
  }
  if (
    r.knowledge_point_id &&
    kps.length &&
    String(r.knowledge_point_id) !==
      String(kps.find((x) => Number(x.is_primary))?.knowledge_point_id)
  ) {
    reasons.push('knowledge_point_id_mismatch')
  }
  if (!ms.length) reasons.push('missing_method')

  // application rubric
  if (r.qtype === 'application') {
    const p =
      typeof r.answer_payload_json === 'string'
        ? JSON.parse(r.answer_payload_json)
        : r.answer_payload_json
    const sum = (p?.rubric || []).reduce((s, x) => s + Number(x.maxScore), 0)
    if (
      p?.kind !== 'application' ||
      sum !== Number(p.maxScore) ||
      !(p.rubric || []).every((x) => x.criteria && Number(x.maxScore) > 0)
    ) {
      reasons.push('application_rubric_invalid')
    }
  }

  // source gate (mirror assertSourceAllowsFormalPublish)
  const lic = r.source_license_status
  const ver = r.source_verification_status
  const st = r.source_type
  if (lic === 'forbidden' || lic === 'restricted') {
    reasons.push(`source_license=${lic}`)
  }
  if ((st === 'adapted' || st === 'past_exam') && ver !== 'verified') {
    reasons.push('source_need_verified')
  }
  if (
    (st === 'adapted' || st === 'past_exam') &&
    lic !== 'permitted'
  ) {
    reasons.push('source_need_permitted')
  }

  const uniqueReasons = [...new Set(reasons)]
  const ok = uniqueReasons.length === 0
  if (ok) approvable++
  else blocked.push({ code: r.code, reasons: uniqueReasons })

  itemSummaries.push({
    code: r.code,
    id: idk,
    pool: r.pool,
    status: r.status,
    is_active: Number(r.is_active),
    content_version: cv,
    qtype: r.qtype,
    source_type: st,
    source_verification_status: ver,
    source_license_status: lic,
    kpN: kps.length,
    methodN: ms.length,
    reviewN: revs.length,
    panel: panel && !panel.error
      ? {
          fp: panel.contentFingerprint,
          currentReviewStatus: panel.currentReviewStatus,
          reviewIsStale: panel.reviewIsStale,
          canPublish: panel.canPublish,
          publishBlockReasons: panel.publishBlockReasons,
        }
      : { error: true, http: panel?.http },
    approvable: ok,
    blockReasons: uniqueReasons,
  })
}

// 037/074 special
const specialCodes = ['CAND-G1B-037', 'CAND-G1B-074']
const special = {}
for (const code of specialCodes) {
  const row = cand.find((r) => r.code === code)
  const panel = panelByCode[code]
  const hist = panel?.reviewHistory || []
  const cv1 = hist.filter((h) => Number(h.contentVersion) === 1)
  const cv2 = hist.filter((h) => Number(h.contentVersion) === 2)
  const cv1Passed = cv1.filter((h) => h.reviewStatus === 'passed')
  const cv2PassedCurrent = cv2.filter(
    (h) =>
      h.reviewStatus === 'passed' &&
      !h.isStale &&
      panel &&
      String(h.contentFingerprint).toLowerCase() ===
        String(panel.contentFingerprint).toLowerCase(),
  )
  // Simulate wrong use of cv=1 against current fp
  const cv1WouldMatchCurrentFp = cv1Passed.some(
    (h) =>
      panel &&
      String(h.contentFingerprint).toLowerCase() ===
        String(panel.contentFingerprint).toLowerCase(),
  )
  special[code] = {
    dbCv: row ? Number(row.content_version) : null,
    panelCv: panel?.contentVersion ?? null,
    currentReviewStatus: panel?.currentReviewStatus ?? null,
    reviewIsStale: panel?.reviewIsStale ?? null,
    canPublish: panel?.canPublish ?? false,
    fp: panel?.contentFingerprint ?? null,
    cv1ReviewCount: cv1.length,
    cv2ReviewCount: cv2.length,
    cv1PassedCount: cv1Passed.length,
    cv2PassedCurrentMatch: cv2PassedCurrent.length,
    allCv1MarkedStale: cv1.length > 0 && cv1.every((h) => h.isStale === true),
    cv1FingerprintEqualsCurrent: cv1WouldMatchCurrentFp,
    ok:
      row &&
      Number(row.content_version) === 2 &&
      panel &&
      Number(panel.contentVersion) === 2 &&
      panel.currentReviewStatus === 'passed' &&
      panel.reviewIsStale === false &&
      panel.canPublish === true &&
      cv2PassedCurrent.length >= 1 &&
      cv1Passed.length >= 1 &&
      cv1.every((h) => h.isStale === true) &&
      cv1WouldMatchCurrentFp === false,
  }
  if (!special[code].ok) {
    report.errors.push(`${code} special version bind failed`)
  }
}

// Gate code safety: old review cannot approve new version
const gateFiltersByVersion = true // evaluateLatestReviewForPublish sameVersion filter (code-audited)
const wrongApproveRisk =
  specialCodes.some((c) => special[c].cv1FingerprintEqualsCurrent === true) ||
  specialCodes.some(
    (c) => special[c].cv1PassedCount > 0 && !special[c].allCv1MarkedStale,
  )

if (missingCodes.length || extraCodes.length || dupCodes.length) {
  report.errors.push(
    `code set bad missing=${missingCodes.length} extra=${extraCodes.length} dup=${dupCodes.length}`,
  )
}
if (httpFails > 0) {
  report.errors.push(`panel_http_fails=${httpFails}`)
}
if (wrongApproveRisk) {
  report.errors.push('OLD_REVIEW_COULD_WRONGFULLY_APPROVE')
  report.decision = 'BLOCKED'
}

report.counts = {
  candN: cand.length,
  expectedN: 100,
  missingCodes,
  extraCodes,
  dupCodes,
  formalDraftActive: cand.filter(
    (r) => r.pool === 'formal' && r.status === 'draft' && Number(r.is_active),
  ).length,
  cv1: cand.filter((r) => Number(r.content_version) === 1).length,
  cv2: cand.filter((r) => Number(r.content_version) === 2).length,
  effectivePassedReviewCurrentVersion: effectivePassed,
  canPublishTrue: itemSummaries.filter((x) => x.panel?.canPublish).length,
  approvable,
  blocked: blocked.length,
  candApprovedInBatch: candApproved,
  drawable,
  approvedAll,
  sessions,
  sessionItems,
  kpLinks: kpLinks.length,
  methodLinks: methodLinks.length,
  reviewRowsTotal: reviewRows.length,
  reviewPassedRowsTotal: reviewRows.filter((r) => r.review_status === 'passed')
    .length,
  panelHttpFails: httpFails,
  apps: cand.filter((r) => r.qtype === 'application').length,
}

report.special037074 = special
report.blocked = blocked
report.items = itemSummaries

report.approveApiPlan = {
  endpoint: 'PATCH /hs-math/admin/train-items/:id/status',
  body: { status: 'approved', confirmPublish: true },
  auth: 'Admin JWT',
  semantics:
    'per-item transaction (lock row + quality + source + same-version passed review + fp). NOT a 100-item atomic batch.',
  noBatchApi: true,
  mustNot: [
    'direct SQL UPDATE status',
    'approve without confirmPublish',
    'use cv=1 review for cv=2 items',
  ],
  backupBefore: 'mysqldump / JSON snapshot of 100 CAND rows + reviews before first approve',
  execution:
    'sequential per-item; record HTTP per code; on first failure STOP; success count = actual 200s only',
  afterChecks: [
    'status=approved for successes only',
    'drawable += successes',
    'failed remain draft',
    'sessions unchanged by approve itself',
  ],
  gateFiltersByVersion,
  studentDrawRequires: 'pool + status=approved + is_active (HsMathTrainService)',
}

const hardBlock =
  report.errors.length > 0 ||
  wrongApproveRisk ||
  missingCodes.length > 0 ||
  dupCodes.length > 0 ||
  httpFails > 0

if (hardBlock) {
  report.decision = 'BLOCKED'
} else if (approvable === 100 && blocked.length === 0) {
  report.decision = 'PREFLIGHT_PASS'
} else if (approvable > 0 && blocked.length > 0) {
  report.decision = 'PARTIAL'
} else {
  report.decision = 'BLOCKED'
}

report.wroteDb = false
report.calledApprove = false
report.calledMutatingHttp = false

finish(report.decision === 'PREFLIGHT_PASS' ? 0 : 1)
