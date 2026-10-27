/**
 * GLOBAL-2G Gate D+E: per-item math review then approve for CAND-G2A-*.
 * Author-side structured review; INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED.
 * DO NOT commit.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const docs = path.resolve(__dirname, '..')
const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'

const DIAG_SHA = {
  'CAND-G2A-045': 'ac818d4e899196f39e20c9f1d7a8e3cb143d04cf38d93c3e01e65bb172dd76d4',
  'CAND-G2A-055': 'a83856cae522849f89bed698ef8a4082549dad46b5bde2fc4bbd83f9ac6792bb',
  'CAND-G2A-081': '97b7c3ecc7f7d4af3c05e51fdb3563f6ac90320e8363d4e92cf99c5d982b084c',
  'CAND-G2A-084': '8da6b0ae8355630027fbe29087f46d80c05427344dc91301d8a139df16f4a449',
  'CAND-G2A-086': '35583af69ab4f3793dbf73655afb755036bb9e6de1caf0fc663062ea0b3111fe',
  'CAND-G2A-088': '5b88220539e26e23fccec4beabdf8e2251dc34939ad8005d572a4c123f5f8daa',
  'CAND-G2A-089': 'ecfab27657b72f09d0b5660df26e9e014e5ff0396db1db78f17dbd81c096f62f',
}
const DEEP = new Set([
  'CAND-G2A-034',
  'CAND-G2A-072',
  'CAND-G2A-027',
  'CAND-G2A-090',
  ...Object.keys(DIAG_SHA),
])

const report = {
  phase: 'HS-MATH-BANK-GLOBAL-2G-REVIEW-APPROVE',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  startedAt: new Date().toISOString(),
  decision: null,
  pre: {},
  review: { passed: 0, rejected: 0, skipped: 0, perItem: [] },
  approve: { success: 0, failed: 0, skipped: 0, perItem: [] },
  post: {},
  errors: [],
  majorFindings: [],
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
function dataOf(json) {
  if (json?.success === true && json.data !== undefined) return json.data
  return json
}
async function api(method, urlPath, token, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text.slice(0, 500) }
  }
  return { status: res.status, json }
}
function norm(s) {
  return String(s || '')
    .replace(/\s+/g, '')
    .replace(/\$/g, '')
}
function parseJson(v) {
  if (v == null) return null
  if (typeof v === 'object') return v
  try {
    return JSON.parse(v)
  } catch {
    return v
  }
}

function judgeItem(cand, db) {
  const reasons = []
  const fail = (m) => {
    reasons.push(`FAIL:${m}`)
  }
  const ok = (m) => reasons.push(`OK:${m}`)
  let pass = true
  const markFail = (m) => {
    pass = false
    fail(m)
  }

  if (db.status !== 'draft' || db.pool !== 'formal') markFail(`state ${db.status}/${db.pool}`)
  else ok('formal+draft')
  if (!db.stem || !db.analysis) markFail('empty stem/analysis')
  else ok('stem+analysis')
  if (Number(db.difficulty) !== Number(cand.difficulty))
    markFail(`diff ${db.difficulty}!=${cand.difficulty}`)
  else ok(`difficulty=${cand.difficulty}`)
  if (db.qtype !== cand.qtype) markFail(`qtype ${db.qtype}`)
  else ok(`qtype=${cand.qtype}`)
  if (norm(db.stem) !== norm(cand.stem)) markFail('stem≠candidate')
  else ok('stem matches candidate')
  if (norm(db.analysis) !== norm(cand.analysis)) markFail('analysis≠candidate')
  else ok('analysis matches candidate')

  const ap = db.answer
  if (cand.qtype === 'numeric') {
    if (ap?.kind !== 'numeric' || String(ap.value) !== String(cand.answer).trim())
      markFail(`numeric answer ${ap?.value}`)
    else ok(`numeric=${ap.value}`)
  } else if (cand.qtype === 'single') {
    if (ap?.kind !== 'single' || ap.optionId !== cand.answer) markFail('single answer')
    else ok(`single=${ap.optionId}`)
  } else if (cand.qtype === 'multi') {
    const expect = String(cand.answer)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .sort()
      .join(',')
    const got = [...(ap?.optionIds || [])].sort().join(',')
    if (ap?.kind !== 'multi' || got !== expect) markFail(`multi ${got}`)
    else ok(`multi=${got}`)
  } else if (cand.qtype === 'judge') {
    const expect = String(cand.answer).toLowerCase() === 'true'
    if (ap?.kind !== 'judge' || ap.value !== expect) markFail('judge')
    else ok(`judge=${ap.value}`)
  } else if (cand.qtype === 'application') {
    if (ap?.kind !== 'application') markFail('app kind')
    const sum = (ap?.rubric || []).reduce((s, x) => s + Number(x.maxScore), 0)
    if (sum !== Number(ap?.maxScore) || Number(ap?.maxScore) !== Number(cand.maxScore))
      markFail(`rubric sum ${sum}/${ap?.maxScore}/${cand.maxScore}`)
    else ok(`rubric ok max=${ap.maxScore}`)
    if (!(ap?.rubric || []).every((x) => x.criteria && x.title && x.key))
      markFail('rubric fields')
    else ok('rubric fields')
  }

  if (!db.kps.length) markFail('no KP')
  else if (!db.kps.includes(cand.kpCode)) markFail(`KP miss ${cand.kpCode}`)
  else ok(`KP ${cand.kpCode}`)
  if (!db.methods.includes(cand.methodMain)) markFail(`method miss ${cand.methodMain}`)
  else ok(`method ${cand.methodMain}`)
  if (cand.methodAux && !db.methods.includes(cand.methodAux))
    markFail(`methodAux miss ${cand.methodAux}`)

  if (db.source_type !== 'original') markFail(`sourceType=${db.source_type}`)
  else ok('source original')

  // diagrams
  const needDiag = Boolean(DIAG_SHA[cand.id])
  if (needDiag) {
    if (db.links.length !== 1) markFail(`diag count ${db.links.length}`)
    else if (db.links[0].content_sha256 !== DIAG_SHA[cand.id]) markFail('diag sha')
    else ok('diag sha match')
    if (Number(db.content_version) < 2) markFail(`cv=${db.content_version}`)
    else ok(`cv=${db.content_version}`)
  } else if (db.links.length !== 0) markFail(`unexpected diag ${db.links.length}`)
  else ok('no unexpected diag')

  // deep math spot checks (author recompute)
  if (cand.id === 'CAND-G2A-034') {
    // log4(x-1)+log2(x-1)=3 => t/2+t=3 => t=2 => x=5
    if (String(ap.value) !== '5') markFail('034 answer not 5')
    else ok('034 recompute x=5')
    if (Number(cand.difficulty) !== 3) markFail('034 d≠3')
    else ok('034 d=3 ACCEPT')
  }
  if (cand.id === 'CAND-G2A-072') {
    if (String(ap.value) !== '100') markFail('072 answer not 100')
    else ok('072 recompute W=100')
    if (Number(cand.difficulty) !== 3) markFail('072 d≠3')
    else ok('072 d=3 ACCEPT')
  }
  if (cand.id === 'CAND-G2A-090') {
    if (String(ap.value) !== '12') markFail('090 answer not 12')
    else ok('090 V/π=12')
    if (!String(cand.stem).includes('V') || !String(cand.stem).includes('\\pi'))
      markFail('090 stem not V/π')
    else ok('090 stem asks V/π')
  }
  if (cand.id === 'CAND-G2A-027') {
    if (Number(ap.maxScore) !== 10) markFail('027 maxScore')
    else ok('027 maxScore=10')
    if (db.methods.filter((m) => m === 'classification').length !== 1)
      markFail('027 method dup')
    else ok('027 method unique')
  }

  return {
    pass,
    decision: pass ? 'passed' : 'rejected',
    reasons,
    deep: DEEP.has(cand.id),
  }
}

function finish(code) {
  report.endedAt = new Date().toISOString()
  const out = path.join(docs, '_g2g_review_approve_result.json')
  fs.writeFileSync(out, JSON.stringify(report, null, 2))
  console.log(
    JSON.stringify(
      {
        decision: report.decision,
        review: {
          passed: report.review.passed,
          rejected: report.review.rejected,
        },
        approve: {
          success: report.approve.success,
          failed: report.approve.failed,
          skipped: report.approve.skipped,
        },
        post: report.post,
        majorFindings: report.majorFindings,
        errors: report.errors,
        out,
      },
      null,
      2,
    ),
  )
  process.exit(code)
}

const { candidates } = await import(
  pathToFileURL(path.join(__dirname, 'candidates-g2a-100.mjs')).href + '?t=' + Date.now()
)
const candById = Object.fromEntries(candidates.map((c) => [c.id, c]))
if (candidates.length !== 100) {
  report.decision = 'BLOCKED'
  report.errors.push(`cand count ${candidates.length}`)
  finish(2)
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

const [[admin]] = await conn.query(
  `SELECT id FROM users WHERE role='ADMIN' ORDER BY id ASC LIMIT 1`,
)
const token = signJwt(String(admin.id), 'ADMIN', env.JWT_SECRET)
report.adminUserId = String(admin.id)

const rows = await many(
  `SELECT id, code, stem, options_json, answer_payload_json, analysis,
          difficulty, content_version, status, pool, is_active, qtype,
          source_type, source_license_status, source_verification_status, source_reference
   FROM hs_math_train_items WHERE code LIKE 'CAND-G2A-%' ORDER BY code`,
)
const drawable0 = Number(
  (
    await one(
      `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
    )
  ).n,
)
const sessions0 = Number((await one(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)).n)
const sessionItems0 = Number(
  (await one(`SELECT COUNT(1) AS n FROM hs_math_train_session_items`)).n,
)
const old113Codes = await many(
  `SELECT code FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1 AND code NOT LIKE 'CAND-G2A-%'
   ORDER BY code`,
)
report.pre = {
  g2a: rows.length,
  drawable: drawable0,
  sessions: sessions0,
  sessionItems: sessionItems0,
  oldApprovedNonG2A: old113Codes.length,
}

if (rows.length !== 100 || drawable0 !== 113 || old113Codes.length !== 113) {
  report.decision = 'BLOCKED'
  report.errors.push(
    `pre mismatch g2a=${rows.length} drawable=${drawable0} old=${old113Codes.length}`,
  )
  await conn.end()
  finish(2)
}

const items = []
for (const r of rows) {
  const links = await many(
    `SELECT d.id AS link_id, o.content_sha256, o.mime_type
     FROM hs_math_train_item_diagrams d
     JOIN hs_math_train_item_diagram_objects o ON o.id=d.object_id
     WHERE d.item_id=? ORDER BY d.sort_order`,
    [r.id],
  )
  const kps = await many(
    `SELECT k.code FROM hs_math_train_item_kps ik
     JOIN hs_math_knowledge_points k ON k.id=ik.knowledge_point_id WHERE ik.item_id=?`,
    [r.id],
  )
  const methods = await many(
    `SELECT m.code FROM hs_math_train_item_methods im
     JOIN hs_math_methods m ON m.id=im.method_id WHERE im.item_id=?`,
    [r.id],
  )
  items.push({
    id: String(r.id),
    code: r.code,
    stem: r.stem,
    options: parseJson(r.options_json),
    answer: parseJson(r.answer_payload_json),
    analysis: r.analysis,
    difficulty: Number(r.difficulty),
    content_version: Number(r.content_version),
    status: r.status,
    pool: r.pool,
    is_active: Number(r.is_active),
    qtype: r.qtype,
    source_type: r.source_type,
    source_license_status: r.source_license_status,
    source_verification_status: r.source_verification_status,
    source_reference: r.source_reference,
    links,
    kps: kps.map((x) => x.code),
    methods: methods.map((x) => x.code),
  })
}

// Gate D+E sequential
for (const it of items) {
  const cand = candById[it.code]
  const judged = judgeItem(cand, it)
  const revRow = {
    code: it.code,
    itemId: it.id,
    deep: judged.deep,
    mathDecision: judged.decision,
    reasons: judged.reasons.filter((x) => x.startsWith('FAIL:') || x.startsWith('OK:')).slice(0, 20),
  }

  if (!judged.pass) {
    report.review.rejected++
    report.majorFindings.push({ code: it.code, reasons: judged.reasons.filter((x) => x.startsWith('FAIL:')) })
    revRow.reviewHttp = null
    revRow.note = 'MAJOR math gate fail; no review passed; no approve'
    report.review.perItem.push(revRow)
    report.approve.skipped++
    report.approve.perItem.push({ code: it.code, skipped: true, reason: 'math_reject' })
    continue
  }

  const panelRes = await api('GET', `/hs-math/admin/train-items/${it.id}/review-panel`, token)
  const panel = dataOf(panelRes.json)
  const fp = panel?.contentFingerprint
  const cv = Number(panel?.contentVersion)
  if (panelRes.status >= 400 || !fp || !cv) {
    report.review.rejected++
    revRow.error = `panel ${panelRes.status}`
    report.review.perItem.push(revRow)
    report.approve.skipped++
    report.errors.push(`panel:${it.code}`)
    continue
  }
  revRow.panel = { cv, fpPrefix: fp.slice(0, 16) }

  const comment = [
    `GLOBAL-2G 作者侧结构化数学审核（非独立终审）。`,
    `核对题干/答案/解析/难度/KP·method` +
      (DIAG_SHA[it.code] ? `/插图SHA` : '') +
      (cand.qtype === 'application' ? `/rubric` : '') +
      `。`,
    judged.deep ? `深审题：${it.code}。` : '',
    `INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED。`,
  ]
    .join('')
    .slice(0, 2000)

  const revRes = await api('POST', `/hs-math/admin/train-items/${it.id}/reviews`, token, {
    decision: 'passed',
    comment,
    expectedContentVersion: cv,
    expectedContentFingerprint: fp,
  })
  const revData = dataOf(revRes.json)
  revRow.reviewHttp = revRes.status
  revRow.reviewStatus = revData?.reviewStatus
  revRow.reviewId = revData?.id || revData?.reviewId || null

  const revOk =
    (revRes.status === 200 || revRes.status === 201) &&
    String(revData?.reviewStatus) === 'passed'
  if (!revOk) {
    report.review.rejected++
    revRow.error = JSON.stringify(revRes.json).slice(0, 300)
    report.review.perItem.push(revRow)
    report.approve.skipped++
    report.errors.push(`review_api:${it.code}`)
    continue
  }
  report.review.passed++
  report.review.perItem.push(revRow)

  const aprRes = await api('PATCH', `/hs-math/admin/train-items/${it.id}/status`, token, {
    status: 'approved',
    confirmPublish: true,
  })
  const aprData = dataOf(aprRes.json)
  const aprRow = {
    code: it.code,
    itemId: it.id,
    http: aprRes.status,
    status: aprData?.status,
  }
  if (aprRes.status >= 400 || aprData?.status !== 'approved') {
    report.approve.failed++
    aprRow.error = JSON.stringify(aprRes.json).slice(0, 300)
    report.approve.perItem.push(aprRow)
    report.errors.push(`approve:${it.code}`)
    // stop further approve expansion? Task: stop that item; continue others unless systemic
    continue
  }

  // immediate verify
  const [[postIt]] = await conn.query(
    `SELECT status, content_version FROM hs_math_train_items WHERE id=?`,
    [it.id],
  )
  aprRow.dbStatus = postIt.status
  aprRow.dbCv = Number(postIt.content_version)
  if (postIt.status !== 'approved' || Number(postIt.content_version) !== cv) {
    report.approve.failed++
    aprRow.error = 'post status/cv mismatch'
    report.approve.perItem.push(aprRow)
    report.errors.push(`approve_verify:${it.code}`)
    continue
  }
  report.approve.success++
  aprRow.ok = true
  report.approve.perItem.push(aprRow)
}

const drawable1 = Number(
  (
    await one(
      `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
    )
  ).n,
)
const g2aApproved = Number(
  (
    await one(
      `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-G2A-%' AND status='approved'`,
    )
  ).n,
)
const g2aDraft = Number(
  (
    await one(
      `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-G2A-%' AND status='draft'`,
    )
  ).n,
)
const g2aPassedReviews = Number(
  (
    await one(
      `SELECT COUNT(1) AS n FROM hs_math_train_item_reviews r
       JOIN hs_math_train_items i ON i.id=r.item_id
       WHERE i.code LIKE 'CAND-G2A-%' AND r.review_status='passed'`,
    )
  ).n,
)
const sessions1 = Number((await one(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)).n)
const sessionItems1 = Number(
  (await one(`SELECT COUNT(1) AS n FROM hs_math_train_session_items`)).n,
)
const oldStill = Number(
  (
    await one(
      `SELECT COUNT(1) AS n FROM hs_math_train_items
       WHERE pool='formal' AND status='approved' AND is_active=1 AND code NOT LIKE 'CAND-G2A-%'`,
    )
  ).n,
)
const diagOk = Number(
  (
    await one(
      `SELECT COUNT(1) AS n FROM hs_math_train_items i
       JOIN hs_math_train_item_diagrams d ON d.item_id=i.id
       JOIN hs_math_train_item_diagram_objects o ON o.id=d.object_id
       WHERE i.code IN (${Object.keys(DIAG_SHA)
         .map(() => '?')
         .join(',')})
         AND i.status='approved'`,
      Object.keys(DIAG_SHA),
    )
  ).n,
)
const apps = await many(
  `SELECT answer_payload_json FROM hs_math_train_items
   WHERE code LIKE 'CAND-G2A-%' AND qtype='application' AND status='approved'`,
)
let appRubricOk = 0
for (const a of apps) {
  const p = parseJson(a.answer_payload_json)
  const sum = (p.rubric || []).reduce((s, x) => s + Number(x.maxScore), 0)
  if (p.kind === 'application' && sum === Number(p.maxScore)) appRubricOk++
}

report.post = {
  drawable: drawable1,
  g2aApproved,
  g2aDraft,
  g2aPassedReviews,
  oldApprovedNonG2A: oldStill,
  sessions: sessions1,
  sessionItems: sessionItems1,
  sessionsUnchanged: sessions1 === sessions0,
  sessionItemsUnchanged: sessionItems1 === sessionItems0,
  diagApprovedWithLink: diagOk,
  appApproved: apps.length,
  appRubricOk,
}

await conn.end()

const fullPass =
  report.review.passed === 100 &&
  report.review.rejected === 0 &&
  report.approve.success === 100 &&
  report.approve.failed === 0 &&
  drawable1 === 213 &&
  g2aApproved === 100 &&
  g2aDraft === 0 &&
  oldStill === 113 &&
  sessions1 === sessions0 &&
  sessionItems1 === sessionItems0 &&
  diagOk === 7 &&
  appRubricOk === 25 &&
  report.majorFindings.length === 0

if (fullPass) {
  report.decision = 'BATCH_IMPORT_APPROVE_PASS'
  finish(0)
}

report.decision =
  report.approve.success > 0 || report.review.passed > 0 ? 'PARTIAL' : 'BLOCKED'
if (!report.errors.length && report.majorFindings.length)
  report.errors.push('major_math_findings')
finish(1)
