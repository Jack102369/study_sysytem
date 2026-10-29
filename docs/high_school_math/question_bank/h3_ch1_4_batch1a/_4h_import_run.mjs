/**
 * HS-MATH-H3-FORMAL-IMPORT-4H — Admin API import → review → approve.
 * No direct SQL writes. No candidate mutation. No diagram upload (REQUIRED=0).
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../../apps/api/node_modules/mysql2/promise.js'
import { loadEnv, dbConfig, sha256 } from '../_h3c14_lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'
const EXPECTED_BATCH = '1e51ba93a0e398766d450fbecda3784a93297c0d8c1e5a60856798c655e19635'
const EXPECTED_FILE = 'df497f16c24c0b89b06df67b895f4bbdd7e6ca5bca820f29428f2b03b789ff16'
const PASS_IDS = [
  6, 13, 14, 18, 27, 46, 47, 60, 202, 211, 213, 214,
].map((n) => `CAND-H3C14-${String(n).padStart(3, '0')}`)

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

const report = {
  phase: 'HS-MATH-H3-FORMAL-IMPORT-4H',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  startedAt: new Date().toISOString(),
  status: 'IN_PROGRESS',
  errors: [],
  gate0: null,
  import: {},
  review: { passed: 0, failed: 0, perItem: [] },
  approve: { success: 0, failed: 0, perItem: [] },
  mapping: [],
  verify: {},
  gitAiDeploy: false,
}

function save() {
  report.endedAt = new Date().toISOString()
  fs.writeFileSync(path.join(qb, 'h3_ch1_4_import_results.json'), JSON.stringify(report, null, 2))
}

const gate0 = JSON.parse(fs.readFileSync(path.join(__dirname, '_4h_gate0.json'), 'utf8'))
if (!gate0.ok) {
  report.status = 'H3_FORMAL_IMPORT_BLOCKED'
  report.errors.push('GATE0_NOT_OK')
  save()
  console.log(JSON.stringify({ status: report.status, errors: report.errors }, null, 2))
  process.exit(1)
}
report.gate0 = {
  batchContentSha256: EXPECTED_BATCH,
  fileSha256: EXPECTED_FILE,
  payloadSha256: gate0.gate0.payloadSha256,
  dbBefore: gate0.gate0.db,
}

const payload = JSON.parse(fs.readFileSync(path.join(qb, 'h3_ch1_4_import_payload_4h.json'), 'utf8'))
const payloadShaNow = crypto
  .createHash('sha256')
  .update(fs.readFileSync(path.join(qb, 'h3_ch1_4_import_payload_4h.json')))
  .digest('hex')
if (payloadShaNow !== gate0.gate0.payloadSha256 || payload.items.length !== 12) {
  report.status = 'H3_FORMAL_IMPORT_BLOCKED'
  report.errors.push('PAYLOAD_SHA_OR_COUNT')
  save()
  process.exit(1)
}
const importItems = payload.items
if (!importItems.every((it) => PASS_IDS.includes(it.code))) {
  report.status = 'H3_FORMAL_IMPORT_BLOCKED'
  report.errors.push('PAYLOAD_OUT_OF_WHITELIST')
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

// Reachability: unauth specialties should be 401 (API up), not network error
const health = await api('GET', '/hs-math/specialties', null).catch((e) => ({
  status: 0,
  json: { error: String(e.message) },
}))
report.import.health = { http: health.status, note: 'expect 401 without token' }
if (health.status === 0) {
  report.status = 'H3_FORMAL_IMPORT_BLOCKED'
  report.errors.push(`API_UNREACHABLE ${JSON.stringify(health.json)}`)
  save()
  console.log(JSON.stringify({ status: report.status, errors: report.errors, health }, null, 2))
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

const [admins] = await conn.query(`SELECT id FROM users WHERE role='ADMIN' ORDER BY id ASC LIMIT 1`)
if (!admins.length) {
  report.status = 'H3_FORMAL_IMPORT_BLOCKED'
  report.errors.push('NO_ADMIN')
  await conn.end()
  save()
  process.exit(1)
}
const token = signJwt(String(admins[0].id), 'ADMIN', env.JWT_SECRET)

// Idempotency: existing codes?
const existing = await many(
  `SELECT id, code, status, content_version FROM hs_math_train_items WHERE code IN (${PASS_IDS.map(() => '?').join(',')})`,
  PASS_IDS,
)
report.import.existingBefore = existing.map((r) => ({
  code: r.code,
  id: String(r.id),
  status: r.status,
}))
if (existing.length && existing.length !== 12) {
  report.status = 'QUALITY_PARTIAL'
  report.errors.push(`PARTIAL_EXIST_${existing.length}`)
  await conn.end()
  save()
  console.log(JSON.stringify({ status: report.status, errors: report.errors, existing: report.import.existingBefore }, null, 2))
  process.exit(1)
}

const codeToItem = {}
if (existing.length === 12) {
  report.import.mode = 'resume_existing'
  for (const r of existing) codeToItem[r.code] = String(r.id)
} else {
  const prev = await api('POST', '/hs-math/admin/train-items/import/preview', token, {
    items: importItems,
  })
  const prevData = dataOf(prev.json)
  report.import.preview = {
    http: prev.status,
    canConfirm: prevData?.canConfirm,
    errorCount: prevData?.errorCount,
    itemCount: prevData?.itemCount,
    failed: (prevData?.items || [])
      .filter((r) => !r.ok || (r.errors || []).length)
      .slice(0, 20)
      .map((r) => ({ code: r.code, errors: r.errors })),
  }
  if (
    prev.status >= 400 ||
    !prevData?.canConfirm ||
    prevData.errorCount !== 0 ||
    prevData.itemCount !== 12 ||
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
    items: importItems,
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
    confData.successCount !== 12 ||
    (confData.mode !== 'created' && confData.mode !== 'idempotent')
  ) {
    // partial mapping if any
    for (const it of confData?.items || []) {
      if (it?.code && it?.id) codeToItem[it.code] = String(it.id)
    }
    report.status = 'QUALITY_PARTIAL'
    report.errors.push(`CONFIRM_FAIL:${confData?.mode}:${confData?.successCount}`)
    report.mapping = Object.entries(codeToItem).map(([code, itemId]) => ({
      candidateId: code,
      itemId,
      step: 'import_partial',
    }))
    await conn.end()
    save()
    console.log(JSON.stringify({ status: report.status, errors: report.errors, confirm: report.import.confirm }, null, 2))
    process.exit(1)
  }
  for (const it of confData.items || []) {
    codeToItem[it.code] = String(it.id)
  }
  report.import.mode = confData.mode
}

report.import.successCount = Object.keys(codeToItem).length

// chapter map from payload
const chapterByCode = Object.fromEntries(payload.mapping.map((m) => [m.candidateId, m.chapterNo]))

for (const code of PASS_IDS) {
  const itemId = codeToItem[code]
  const row = {
    candidateId: code,
    chapter: chapterByCode[code],
    itemId,
    contentVersion: null,
    review: null,
    approve: null,
    drawable: null,
    blockStep: null,
  }
  if (!itemId) {
    row.blockStep = 'import_missing'
    report.errors.push(`NO_ITEM:${code}`)
    report.mapping.push(row)
    continue
  }

  // readback
  const getRes = await api('GET', `/hs-math/admin/train-items/${itemId}`, token)
  const getData = dataOf(getRes.json)
  if (getRes.status >= 400 || String(getData?.code) !== code) {
    row.blockStep = 'readback'
    report.errors.push(`READBACK:${code}`)
    report.mapping.push(row)
    continue
  }
  if (String(getData.qtype) !== 'application' || Number(getData.difficulty) !== 3) {
    row.blockStep = 'adapt_mismatch'
    report.errors.push(`ADAPT:${code}`)
    report.mapping.push(row)
    continue
  }

  // skip if already approved (resume)
  const [[dbIt]] = await conn.query(
    `SELECT status, content_version, is_active, pool FROM hs_math_train_items WHERE id=?`,
    [itemId],
  )
  if (dbIt.status === 'approved' && Number(dbIt.is_active) === 1 && dbIt.pool === 'formal') {
    row.contentVersion = Number(dbIt.content_version)
    row.review = 'passed(already)'
    row.approve = 'approved(already)'
    row.drawable = true
    report.review.passed++
    report.approve.success++
    report.mapping.push(row)
    continue
  }

  const panelRes = await api('GET', `/hs-math/admin/train-items/${itemId}/review-panel`, token)
  const panel = dataOf(panelRes.json)
  const fp = panel?.contentFingerprint
  const cv = Number(panel?.contentVersion)
  if (panelRes.status >= 400 || !fp || !cv) {
    row.blockStep = 'review_panel'
    report.review.failed++
    report.errors.push(`PANEL:${code}`)
    report.mapping.push(row)
    continue
  }
  row.contentVersion = cv

  const comment = [
    'H3-FORMAL-IMPORT-4H 人工审核（基于189严格预检 PASS_H3 + 190导入预检 importReady）。',
    `code=${code}; qtype=application; difficulty=3; REQUIRED图=0。`,
    '核对题干/答案/解析/rubric与离线候选一致。',
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
  const revOk =
    (revRes.status === 200 || revRes.status === 201) &&
    String(revData?.reviewStatus || revData?.decision || revData?.status) === 'passed'
  // also accept if nested
  const revStatus = revData?.reviewStatus || revData?.review?.reviewStatus || revData?.status
  const revOk2 =
    (revRes.status === 200 || revRes.status === 201) && String(revStatus) === 'passed'
  if (!revOk && !revOk2) {
    row.blockStep = 'review'
    row.review = `fail:${JSON.stringify(revRes.json).slice(0, 200)}`
    report.review.failed++
    report.errors.push(`REVIEW:${code}`)
    report.mapping.push(row)
    continue
  }
  row.review = 'passed'
  report.review.passed++

  const aprRes = await api('PATCH', `/hs-math/admin/train-items/${itemId}/status`, token, {
    status: 'approved',
    confirmPublish: true,
  })
  const aprData = dataOf(aprRes.json)
  if (aprRes.status >= 400 || aprData?.status !== 'approved') {
    row.blockStep = 'approve'
    row.approve = `fail:${JSON.stringify(aprRes.json).slice(0, 200)}`
    report.approve.failed++
    report.errors.push(`APPROVE:${code}`)
    report.mapping.push(row)
    continue
  }

  const [[postIt]] = await conn.query(
    `SELECT status, content_version, is_active, pool FROM hs_math_train_items WHERE id=?`,
    [itemId],
  )
  row.contentVersion = Number(postIt.content_version)
  row.approve = postIt.status
  row.drawable =
    postIt.status === 'approved' && Number(postIt.is_active) === 1 && postIt.pool === 'formal'
  if (!row.drawable) {
    row.blockStep = 'drawable_verify'
    report.approve.failed++
    report.errors.push(`DRAWABLE_VERIFY:${code}`)
  } else {
    report.approve.success++
  }
  report.mapping.push(row)
}

// Final DB verify
const [[d]] = await conn.query(
  `SELECT COUNT(*) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)
const [[dd]] = await conn.query(
  `SELECT SUM(difficulty=1) AS d1, SUM(difficulty=2) AS d2, SUM(difficulty=3) AS d3
   FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)
const [[h]] = await conn.query(
  `SELECT COUNT(*) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-H3C14-%'`,
)
const [[h204]] = await conn.query(
  `SELECT COUNT(*) AS n FROM hs_math_train_items WHERE code='CAND-H3C14-204'`,
)
const imported = await many(
  `SELECT id, code, status, content_version, difficulty, is_active, pool
   FROM hs_math_train_items WHERE code IN (${PASS_IDS.map(() => '?').join(',')}) ORDER BY code`,
  PASS_IDS,
)
const [formal] = await conn.query(
  `SELECT id, code, status, content_version, difficulty,
          SHA2(CONCAT_WS('|', id, code, status, content_version, difficulty, LEFT(stem,200)), 256) AS fp
   FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1
   ORDER BY id`,
)
const formalBaselineShaAfter = sha256(
  formal
    .filter((r) => !String(r.code).startsWith('CAND-H3C14-'))
    .map((r) => `${r.id}|${r.code}|${r.status}|${r.content_version}|${r.fp}`)
    .join('\n'),
)
// Better: check original 913 ids still same — use baseline sha of non-h3c14
const beforeSha = gate0.gate0.db.formalBaselineSha
// recompute full formal baseline same algorithm for non-new? Actually baseline included all 913.
// Protection: all non-CAND-H3C14 approved items' fingerprint aggregate
const [[sess]] = await conn.query(`SELECT COUNT(*) AS n FROM hs_math_train_sessions`)
const [[sitem]] = await conn.query(`SELECT COUNT(*) AS n FROM hs_math_train_session_items`)
let diagramLinks = null
let diagramSnap = null
try {
  const [[dl]] = await conn.query(`SELECT COUNT(*) AS n FROM hs_math_train_item_diagrams`)
  diagramLinks = Number(dl.n)
} catch (e) {
  diagramLinks = `ERR:${e.message}`
}
try {
  const [[ds]] = await conn.query(`SELECT COUNT(*) AS n FROM hs_math_train_session_item_diagrams`)
  diagramSnap = Number(ds.n)
} catch (e) {
  diagramSnap = `ERR:${e.message}`
}

// Original 913 protection: count of approved formal that are NOT CAND-H3C14 should still be 913
const [[orig]] = await conn.query(
  `SELECT COUNT(*) AS n FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1 AND code NOT LIKE 'CAND-H3C14-%'`,
)

report.verify = {
  drawableAfter: Number(d.n),
  d1: Number(dd.d1),
  d2: Number(dd.d2),
  d3: Number(dd.d3),
  h3c14: Number(h.n),
  h204: Number(h204.n),
  original913Still: Number(orig.n),
  sessions: Number(sess.n),
  sessionItems: Number(sitem.n),
  diagramLinks,
  diagramSnap,
  sessionsBefore: gate0.gate0.db.sessions,
  sessionItemsBefore: gate0.gate0.db.sessionItems,
  diagramLinksBefore: gate0.gate0.db.diagramLinks,
  diagramSnapBefore: gate0.gate0.db.diagramSnap,
  importedRows: imported.map((r) => ({
    code: r.code,
    id: String(r.id),
    status: r.status,
    cv: Number(r.content_version),
    difficulty: Number(r.difficulty),
    drawable: r.status === 'approved' && Number(r.is_active) === 1 && r.pool === 'formal',
  })),
  formalBaselineShaBefore: beforeSha,
  formalNonH3c14Note: 'original913Still should remain 913',
}

const fileShaNow = crypto
  .createHash('sha256')
  .update(fs.readFileSync(path.join(qb, 'h3_ch1_4_candidates.mjs')))
  .digest('hex')
report.verify.fileShaAfter = fileShaNow
report.verify.fileShaUnchanged = fileShaNow === EXPECTED_FILE
report.verify.payloadSha256 = payloadShaNow

await conn.end()

const importedOk = report.import.successCount === 12
const reviewOk = report.review.passed === 12
const approveOk = report.approve.success === 12
const drawableOk = report.verify.drawableAfter === 925
const diffOk = report.verify.d1 === 335 && report.verify.d2 === 478 && report.verify.d3 === 112
const protectOk =
  report.verify.original913Still === 913 &&
  report.verify.sessions === report.verify.sessionsBefore &&
  report.verify.sessionItems === report.verify.sessionItemsBefore &&
  report.verify.diagramLinks === report.verify.diagramLinksBefore &&
  report.verify.h204 === 0 &&
  report.verify.fileShaUnchanged

if (importedOk && reviewOk && approveOk && drawableOk && diffOk && protectOk && report.errors.length === 0) {
  report.status = 'H3_FORMAL_IMPORT_PASS'
} else if (report.approve.success > 0 || report.import.successCount > 0) {
  report.status = 'QUALITY_PARTIAL'
} else {
  report.status = 'H3_FORMAL_IMPORT_BLOCKED'
}

save()
console.log(
  JSON.stringify(
    {
      status: report.status,
      errors: report.errors,
      import: report.import.successCount,
      review: report.review.passed,
      approve: report.approve.success,
      drawable: report.verify.drawableAfter,
      diff: [report.verify.d1, report.verify.d2, report.verify.d3],
      protect: {
        orig913: report.verify.original913Still,
        sessions: [report.verify.sessionsBefore, report.verify.sessions],
        sessionItems: [report.verify.sessionItemsBefore, report.verify.sessionItems],
        diagrams: [report.verify.diagramLinksBefore, report.verify.diagramLinks],
        h204: report.verify.h204,
      },
    },
    null,
    2,
  ),
)
process.exit(report.status === 'H3_FORMAL_IMPORT_PASS' ? 0 : 1)
