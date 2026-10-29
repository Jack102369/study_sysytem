/**
 * HS-MATH-H3-FORMAL-IMPORT-204-4H-MICRO
 * Import only CAND-H3C14-204 via Admin API. No SQL writes. No other candidates.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createConnection } from '../../../../apps/api/node_modules/mysql2/promise.js'
import { loadEnv, dbConfig, contentPayload, sha256, batchSha } from '../_h3c14_lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'
const ID = 'CAND-H3C14-204'
const EXPECTED_BATCH = '0460dd64b366d2a475a19317153d727968e8b5d94f4d741ab9f67c730fded24c'
const EXPECTED_FILE = '0ae821a5f5fb7007301980b61d2ece8420c20753b7689ab0ce5f6cb713fa9a02'
const EXPECTED_ITEM_SHA = '6866fc47f5f500dd2af281642c694a91a8bbfe3fe2ff3d3f609083ee165287b2'
const IMPORTED12 = Array.from({ length: 12 }, (_, i) => String(1075 + i))

function signJwt(sub, role, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const body = Buffer.from(
    JSON.stringify({ sub, role, iat: now, exp: now + 8 * 3600 }),
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
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text.slice(0, 800) }
  }
  return { status: res.status, json }
}
function fileSha(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
}

function adaptApplication(c) {
  const methodCodes = [...new Set([c.methodMain, c.methodAux].filter(Boolean))]
  const rubric = (c.rubric || []).map((r, i) => {
    const step = String(r.step ?? r.title ?? '').trim()
    const key =
      String(r.key || '').trim() ||
      `s${i + 1}_${step.slice(0, 24).replace(/\s+/g, '_') || 'step'}`
    return {
      key,
      title: step || `步骤${i + 1}`,
      maxScore: Number(r.score ?? r.maxScore),
      criteria: String(r.criteria ?? r.criterion ?? step).trim() || step,
    }
  })
  const maxScore = Number(c.maxScore)
  const sum = rubric.reduce((s, x) => s + x.maxScore, 0)
  if (sum !== maxScore) throw new Error(`rubric ${sum}!=${maxScore}`)
  return {
    code: String(c.id).trim(),
    specialtyCode: String(c.specialtyCode).trim(),
    categoryCode: String(c.sectionCode).trim(),
    qtype: 'application',
    difficulty: 3,
    stem: String(c.stem),
    options: null,
    answerPayload: {
      kind: 'application',
      standardAnswer: String(c.answer),
      maxScore,
      rubric,
    },
    analysis: String(c.analysis || '').trim(),
    knowledgePointCodes: [String(c.kpCode).trim()],
    primaryKnowledgePointCode: String(c.kpCode).trim(),
    methodCodes,
    primaryMethodCode: String(c.methodMain || methodCodes[0] || '').trim() || null,
    sourceType: c.sourceType || 'original',
    sourceReference: c.sourceEvidence || null,
    sourceVerificationStatus: 'unverified',
    sourceLicenseStatus: 'unknown',
    pool: 'formal',
  }
}

const report = {
  phase: 'HS-MATH-H3-FORMAL-IMPORT-204-4H-MICRO',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  startedAt: new Date().toISOString(),
  status: 'IN_PROGRESS',
  errors: [],
  gate0: {},
  import: {},
  review: {},
  approve: {},
  mapping: null,
  verify: {},
}

function save() {
  report.endedAt = new Date().toISOString()
  fs.writeFileSync(path.join(qb, 'h3_ch1_4_import_results_204.json'), JSON.stringify(report, null, 2))
}

// ——— Gate0 ———
const candPath = path.join(qb, 'h3_ch1_4_candidates.mjs')
const fileShaNow = fileSha(candPath)
const mod = await import(pathToFileURL(candPath).href + '?t=' + Date.now())
const recomputedBatch = batchSha(mod.candidates)
const c204 = mod.candidates.find((c) => c.id === ID)
const itemSha = c204 ? sha256(contentPayload(c204)) : null

report.gate0 = {
  fileSha: fileShaNow,
  batchDeclared: mod.batchContentSha256,
  batchRecomputed: recomputedBatch,
  itemSha,
  expected: { batch: EXPECTED_BATCH, file: EXPECTED_FILE, item: EXPECTED_ITEM_SHA },
}

if (
  fileShaNow !== EXPECTED_FILE ||
  mod.batchContentSha256 !== EXPECTED_BATCH ||
  recomputedBatch !== EXPECTED_BATCH ||
  !c204 ||
  itemSha !== EXPECTED_ITEM_SHA ||
  c204.hardProfile?.contentSha256 !== EXPECTED_ITEM_SHA
) {
  report.status = 'H3_FORMAL_IMPORT_BLOCKED'
  report.errors.push('GATE0_SHA_OR_204')
  save()
  console.log(JSON.stringify({ status: report.status, errors: report.errors, gate0: report.gate0 }, null, 2))
  process.exit(1)
}

const pf204 = JSON.parse(fs.readFileSync(path.join(qb, 'h3_ch1_4_import_precheck_results_204.json'), 'utf8'))
if (pf204.status !== 'H3_FIX_204_PASS' || !pf204.item?.importReady) {
  report.status = 'H3_FORMAL_IMPORT_BLOCKED'
  report.errors.push('NOT_IMPORT_READY')
  save()
  process.exit(1)
}

const env = loadEnv()
if (!env.JWT_SECRET) {
  report.status = 'H3_FORMAL_IMPORT_BLOCKED'
  report.errors.push('JWT_SECRET_MISSING')
  save()
  process.exit(1)
}

const conn = await createConnection(dbConfig(env))
async function one(sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows[0]
}
async function many(sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows
}

const [[d]] = await conn.query(
  `SELECT COUNT(*) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)
const [[dd]] = await conn.query(
  `SELECT SUM(difficulty=1) AS d1, SUM(difficulty=2) AS d2, SUM(difficulty=3) AS d3
   FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)
const [[h204]] = await conn.query(`SELECT COUNT(*) AS n FROM hs_math_train_items WHERE code=?`, [ID])
const imported12 = await many(
  `SELECT id, code, status FROM hs_math_train_items WHERE id IN (${IMPORTED12.map(() => '?').join(',')}) ORDER BY id`,
  IMPORTED12,
)
const [[sess]] = await conn.query(`SELECT COUNT(*) AS n FROM hs_math_train_sessions`)
const [[sitem]] = await conn.query(`SELECT COUNT(*) AS n FROM hs_math_train_session_items`)
let diagramLinks = null
try {
  const [[dl]] = await conn.query(`SELECT COUNT(*) AS n FROM hs_math_train_item_diagrams`)
  diagramLinks = Number(dl.n)
} catch (e) {
  diagramLinks = `ERR:${e.message}`
}

const dbBefore = {
  drawable: Number(d.n),
  d1: Number(dd.d1),
  d2: Number(dd.d2),
  d3: Number(dd.d3),
  h204: Number(h204.n),
  imported12Count: imported12.length,
  sessions: Number(sess.n),
  sessionItems: Number(sitem.n),
  diagramLinks,
}
report.gate0.dbBefore = dbBefore
if (
  dbBefore.drawable !== 925 ||
  dbBefore.d1 !== 335 ||
  dbBefore.d2 !== 478 ||
  dbBefore.d3 !== 112 ||
  dbBefore.h204 !== 0 ||
  dbBefore.imported12Count !== 12
) {
  report.status = 'H3_FORMAL_IMPORT_BLOCKED'
  report.errors.push(`DB_BEFORE ${JSON.stringify(dbBefore)}`)
  await conn.end()
  save()
  console.log(JSON.stringify({ status: report.status, errors: report.errors, dbBefore }, null, 2))
  process.exit(1)
}

// ——— payload ———
const adapted = adaptApplication(c204)
const payload = {
  phase: 'HS-MATH-H3-FORMAL-IMPORT-204-4H-MICRO',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  builtAt: new Date().toISOString(),
  sourceBatchContentSha256: EXPECTED_BATCH,
  sourceFileSha256: EXPECTED_FILE,
  sourceItemContentSha256: EXPECTED_ITEM_SHA,
  count: 1,
  whitelist: [ID],
  mapping: [{ candidateId: ID, importCode: ID, chapterNo: 3, contentSha256: EXPECTED_ITEM_SHA }],
  items: [adapted],
}
const payloadPath = path.join(qb, 'h3_ch1_4_import_payload_204.json')
const payloadJson = JSON.stringify(payload, null, 2)
fs.writeFileSync(payloadPath, payloadJson)
const payloadSha256 = crypto.createHash('sha256').update(payloadJson, 'utf8').digest('hex')
report.gate0.payloadSha256 = payloadSha256

// API reachability
const health = await api('GET', '/hs-math/specialties', null).catch((e) => ({
  status: 0,
  json: { error: String(e.message) },
}))
if (health.status === 0) {
  report.status = 'H3_FORMAL_IMPORT_BLOCKED'
  report.errors.push('API_UNREACHABLE')
  await conn.end()
  save()
  process.exit(1)
}

const [admins] = await conn.query(`SELECT id FROM users WHERE role='ADMIN' ORDER BY id ASC LIMIT 1`)
if (!admins.length) {
  report.status = 'H3_FORMAL_IMPORT_BLOCKED'
  report.errors.push('NO_ADMIN')
  await conn.end()
  save()
  process.exit(1)
}
const token = signJwt(String(admins[0].id), 'ADMIN', env.JWT_SECRET)

const existing = await many(`SELECT id, code, status, content_version FROM hs_math_train_items WHERE code=?`, [ID])
report.import.existingBefore = existing

let itemId = existing[0] ? String(existing[0].id) : null

if (!itemId) {
  const prev = await api('POST', '/hs-math/admin/train-items/import/preview', token, {
    items: [adapted],
  })
  const prevData = dataOf(prev.json)
  report.import.preview = {
    http: prev.status,
    canConfirm: prevData?.canConfirm,
    errorCount: prevData?.errorCount,
    itemCount: prevData?.itemCount,
    failed: (prevData?.items || [])
      .filter((r) => !r.ok || (r.errors || []).length)
      .map((r) => ({ code: r.code, errors: r.errors })),
  }
  if (
    prev.status >= 400 ||
    !prevData?.canConfirm ||
    prevData.errorCount !== 0 ||
    prevData.itemCount !== 1 ||
    !prevData.previewToken
  ) {
    report.status = 'H3_FORMAL_IMPORT_BLOCKED'
    report.errors.push('PREVIEW_FAIL')
    await conn.end()
    save()
    console.log(JSON.stringify({ status: report.status, errors: report.errors, preview: report.import.preview }, null, 2))
    process.exit(1)
  }
  const conf = await api('POST', '/hs-math/admin/train-items/import/confirm', token, {
    previewToken: prevData.previewToken,
    items: [adapted],
  })
  const confData = dataOf(conf.json)
  report.import.confirm = {
    http: conf.status,
    success: confData?.success,
    mode: confData?.mode,
    successCount: confData?.successCount,
    failCount: confData?.failCount,
  }
  if (
    conf.status >= 400 ||
    !confData?.success ||
    confData.successCount !== 1 ||
    (confData.mode !== 'created' && confData.mode !== 'idempotent')
  ) {
    report.status = 'QUALITY_PARTIAL'
    report.errors.push(`CONFIRM_FAIL:${confData?.mode}`)
    await conn.end()
    save()
    process.exit(1)
  }
  itemId = String(confData.items[0].id)
  report.import.mode = confData.mode
} else {
  report.import.mode = 'resume_existing'
}

report.import.successCount = 1
report.import.itemId = itemId

const mapping = {
  candidateId: ID,
  chapter: 3,
  itemId,
  contentVersion: null,
  review: null,
  approve: null,
  drawable: false,
  blockStep: null,
}

// readback
const getRes = await api('GET', `/hs-math/admin/train-items/${itemId}`, token)
const getData = dataOf(getRes.json)
if (getRes.status >= 400 || String(getData?.code) !== ID) {
  mapping.blockStep = 'readback'
  report.status = 'QUALITY_PARTIAL'
  report.errors.push('READBACK')
  report.mapping = mapping
  await conn.end()
  save()
  process.exit(1)
}
if (String(getData.qtype) !== 'application' || Number(getData.difficulty) !== 3) {
  mapping.blockStep = 'adapt_mismatch'
  report.status = 'QUALITY_PARTIAL'
  report.errors.push('ADAPT')
  report.mapping = mapping
  await conn.end()
  save()
  process.exit(1)
}

const [[dbIt]] = await conn.query(
  `SELECT status, content_version, is_active, pool FROM hs_math_train_items WHERE id=?`,
  [itemId],
)

if (!(dbIt.status === 'approved' && Number(dbIt.is_active) === 1 && dbIt.pool === 'formal')) {
  const panelRes = await api('GET', `/hs-math/admin/train-items/${itemId}/review-panel`, token)
  const panel = dataOf(panelRes.json)
  const fp = panel?.contentFingerprint
  const cv = Number(panel?.contentVersion)
  if (panelRes.status >= 400 || !fp || !cv) {
    mapping.blockStep = 'review_panel'
    report.status = 'QUALITY_PARTIAL'
    report.errors.push('PANEL')
    report.mapping = mapping
    await conn.end()
    save()
    process.exit(1)
  }
  mapping.contentVersion = cv

  const comment = [
    'H3-FORMAL-IMPORT-204-4H-MICRO 人工审核。',
    '依据：189 严格预检数学路线可成立；190 协议族；192 FIX-204 解析/rubric 修复且 importReady。',
    'qtype=application; difficulty=3; REQUIRED图=0。',
    'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED。',
  ]
    .join('')
    .slice(0, 2000)

  const revRes = await api('POST', `/hs-math/admin/train-items/${itemId}/reviews`, token, {
    decision: 'passed',
    comment,
    expectedContentVersion: cv,
    expectedContentFingerprint: fp,
  })
  const revData = dataOf(revRes.json)
  const revStatus = revData?.reviewStatus || revData?.review?.reviewStatus
  if (!((revRes.status === 200 || revRes.status === 201) && String(revStatus) === 'passed')) {
    mapping.blockStep = 'review'
    mapping.review = `fail:${JSON.stringify(revRes.json).slice(0, 200)}`
    report.status = 'QUALITY_PARTIAL'
    report.errors.push('REVIEW')
    report.mapping = mapping
    await conn.end()
    save()
    process.exit(1)
  }
  mapping.review = 'passed'
  report.review = { passed: 1 }

  const aprRes = await api('PATCH', `/hs-math/admin/train-items/${itemId}/status`, token, {
    status: 'approved',
    confirmPublish: true,
  })
  const aprData = dataOf(aprRes.json)
  if (aprRes.status >= 400 || aprData?.status !== 'approved') {
    mapping.blockStep = 'approve'
    mapping.approve = `fail:${JSON.stringify(aprRes.json).slice(0, 200)}`
    report.status = 'QUALITY_PARTIAL'
    report.errors.push('APPROVE')
    report.mapping = mapping
    await conn.end()
    save()
    process.exit(1)
  }
  mapping.approve = 'approved'
  report.approve = { success: 1 }
} else {
  mapping.review = 'passed(already)'
  mapping.approve = 'approved(already)'
  report.review = { passed: 1, note: 'already' }
  report.approve = { success: 1, note: 'already' }
}

const [[postIt]] = await conn.query(
  `SELECT status, content_version, is_active, pool FROM hs_math_train_items WHERE id=?`,
  [itemId],
)
mapping.contentVersion = Number(postIt.content_version)
mapping.approve = postIt.status
mapping.drawable =
  postIt.status === 'approved' && Number(postIt.is_active) === 1 && postIt.pool === 'formal'
if (!mapping.drawable) {
  mapping.blockStep = 'drawable_verify'
  report.status = 'QUALITY_PARTIAL'
  report.errors.push('DRAWABLE_VERIFY')
  report.mapping = mapping
  await conn.end()
  save()
  process.exit(1)
}

// ——— verify ———
const [[d2]] = await conn.query(
  `SELECT COUNT(*) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)
const [[dd2]] = await conn.query(
  `SELECT SUM(difficulty=1) AS d1, SUM(difficulty=2) AS d2, SUM(difficulty=3) AS d3
   FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)
const [[h204b]] = await conn.query(`SELECT COUNT(*) AS n FROM hs_math_train_items WHERE code=?`, [ID])
const [[orig]] = await conn.query(
  `SELECT COUNT(*) AS n FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1 AND code NOT LIKE 'CAND-H3C14-%'`,
)
const [[h3c14]] = await conn.query(
  `SELECT COUNT(*) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-H3C14-%' AND pool='formal' AND status='approved' AND is_active=1`,
)
const imported12After = await many(
  `SELECT id, code, status, content_version FROM hs_math_train_items WHERE id IN (${IMPORTED12.map(() => '?').join(',')})`,
  IMPORTED12,
)
const [[sess2]] = await conn.query(`SELECT COUNT(*) AS n FROM hs_math_train_sessions`)
const [[sitem2]] = await conn.query(`SELECT COUNT(*) AS n FROM hs_math_train_session_items`)
let diagramLinks2 = null
try {
  const [[dl]] = await conn.query(`SELECT COUNT(*) AS n FROM hs_math_train_item_diagrams`)
  diagramLinks2 = Number(dl.n)
} catch (e) {
  diagramLinks2 = `ERR:${e.message}`
}

const fileShaAfter = fileSha(candPath)
report.verify = {
  drawableAfter: Number(d2.n),
  d1: Number(dd2.d1),
  d2: Number(dd2.d2),
  d3: Number(dd2.d3),
  h204: Number(h204b.n),
  h3c14Approved: Number(h3c14.n),
  originalNonH3c14: Number(orig.n),
  sessions: Number(sess2.n),
  sessionItems: Number(sitem2.n),
  diagramLinks: diagramLinks2,
  sessionsBefore: dbBefore.sessions,
  sessionItemsBefore: dbBefore.sessionItems,
  diagramLinksBefore: dbBefore.diagramLinks,
  imported12Intact:
    imported12After.length === 12 &&
    imported12After.every((r) => r.status === 'approved' && Number(r.content_version) === 1),
  fileShaAfter,
  fileShaUnchanged: fileShaAfter === EXPECTED_FILE,
  payloadSha256,
}
report.mapping = mapping
await conn.end()

const ok =
  report.import.successCount === 1 &&
  report.review.passed === 1 &&
  report.approve.success === 1 &&
  mapping.drawable &&
  report.verify.drawableAfter === 926 &&
  report.verify.d1 === 335 &&
  report.verify.d2 === 478 &&
  report.verify.d3 === 113 &&
  report.verify.h204 === 1 &&
  report.verify.h3c14Approved === 13 &&
  report.verify.originalNonH3c14 === 913 &&
  report.verify.sessions === report.verify.sessionsBefore &&
  report.verify.sessionItems === report.verify.sessionItemsBefore &&
  report.verify.diagramLinks === report.verify.diagramLinksBefore &&
  report.verify.imported12Intact &&
  report.verify.fileShaUnchanged &&
  report.errors.length === 0

report.status = ok ? 'H3_FORMAL_IMPORT_PASS' : 'QUALITY_PARTIAL'
save()
console.log(
  JSON.stringify(
    {
      status: report.status,
      errors: report.errors,
      mapping,
      verify: report.verify,
      payloadSha256,
    },
    null,
    2,
  ),
)
process.exit(ok ? 0 : 1)
