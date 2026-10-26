/**
 * APPLICATION-2F 临时 API/DB 验收（无额外依赖：crypto JWT + mysql CLI）
 * 运行：node apps/api/src/hs-math/util/_tmp-application2f-e2e.mjs
 */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = 'http://127.0.0.1:3000'
const JWT_SECRET = 'study_system_dev_jwt_secret_change_in_prod'
const out = { checks: [] }

function rec(name, ok, detail) {
  out.checks.push({ name, ok: !!ok, detail: detail ?? null })
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (detail ? ' | ' + detail : ''))
}

function b64url(obj) {
  const s = typeof obj === 'string' ? obj : JSON.stringify(obj)
  return Buffer.from(s).toString('base64url')
}

function token(userId, email, role) {
  const header = b64url({ alg: 'HS256', typ: 'JWT' })
  const now = Math.floor(Date.now() / 1000)
  const payload = b64url({
    sub: String(userId),
    email,
    role,
    iat: now,
    exp: now + 7200,
  })
  const sig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(header + '.' + payload)
    .digest('base64url')
  return header + '.' + payload + '.' + sig
}

function mysqlJson(sql) {
  const r = spawnSync(
    'mysql',
    [
      '--host=127.0.0.1',
      '--port=3306',
      '--user=study_user',
      '--password=Hw@2026',
      '--database=study_system',
      '--batch',
      '--raw',
      '-e',
      sql,
    ],
    { encoding: 'utf8' },
  )
  if (r.status !== 0) {
    throw new Error(r.stderr || 'mysql failed')
  }
  const lines = (r.stdout || '')
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.startsWith('mysql:'))
  if (lines.length < 2) return []
  const cols = lines[0].split('\t')
  return lines.slice(1).map((line) => {
    const parts = line.split('\t')
    const row = {}
    cols.forEach((c, i) => {
      row[c] = parts[i]
    })
    return row
  })
}

async function api(method, urlPath, opts = {}) {
  const { token: tok, body, form, expectBin } = opts
  const headers = {}
  if (tok) headers.Authorization = 'Bearer ' + tok
  let b
  if (form) b = form
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    b = JSON.stringify(body)
  }
  const res = await fetch(BASE + urlPath, { method, headers, body: b })
  const ct = res.headers.get('content-type') || ''
  const cache = res.headers.get('cache-control') || ''
  let data = null
  if (expectBin) data = Buffer.from(await res.arrayBuffer())
  else if (ct.includes('application/json')) data = await res.json()
  else data = await res.text()
  return { status: res.status, ct, cache, data }
}

function tinyJpeg() {
  return Buffer.from(
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEABj8Cf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hf//Z',
    'base64',
  )
}
function tinyPng() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  )
}
function tinyWebp() {
  return Buffer.from(
    'UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=',
    'base64',
  )
}
function formFile(buf, filename, mime) {
  const fd = new FormData()
  fd.append('file', new Blob([buf], { type: mime }), filename)
  return fd
}

const tok2 = token(2, 'admin@189.cn', 'ADMIN')
const tok1 = token(1, 'dhm@189.cn', 'USER')

const base = mysqlJson(`
SELECT
  (SELECT COUNT(*) FROM hs_math_train_items) items,
  (SELECT COUNT(*) FROM hs_math_train_items WHERE status='approved') approved,
  (SELECT COUNT(*) FROM hs_math_methods) methods,
  (SELECT COUNT(*) FROM hs_math_train_item_methods) method_links,
  (SELECT COUNT(*) FROM hs_math_train_item_reviews) reviews,
  (SELECT COUNT(*) FROM hs_math_train_sessions) sessions,
  (SELECT COUNT(*) FROM hs_math_train_sessions WHERE user_id<>2) other_user_sessions
`)[0]
out.baseline = base

const created = await api('POST', '/hs-math/train/sessions', {
  token: tok2,
  body: {
    specialtyId: '18',
    categoryId: '44',
    difficulty: 2,
    count: 5,
    mode: 'sequential',
    poolMode: 'formal',
  },
})
rec(
  'create_session',
  created.status === 200 || created.status === 201,
  'status=' + created.status,
)
if (!(created.status === 200 || created.status === 201)) {
  console.log(JSON.stringify(created.data))
  process.exit(1)
}
const session = created.data.data
const sessionId = session.id
const appItem = session.items.find(
  (i) =>
    String(i.itemId) === '151' ||
    i.itemCode === 'HSMA-RJA-CH03-APP-0001' ||
    i.qtype === 'application',
)
rec(
  'session_has_app_0001',
  !!appItem && String(appItem.itemId) === '151',
  appItem ? 'si=' + appItem.id : 'missing',
)
const si = appItem.id
out.sessionId = sessionId
out.sessionItemId = si

const jpeg = tinyJpeg()
const png = tinyPng()
const webp = tinyWebp()

async function upload(buf, name, mime) {
  return api('POST', `/hs-math/train/sessions/${sessionId}/items/${si}/images`, {
    token: tok2,
    form: formFile(buf, name, mime),
  })
}

const uJpeg = await upload(jpeg, 't.jpg', 'image/jpeg')
rec('upload_jpeg', uJpeg.status < 300, 'status=' + uJpeg.status)
const imgJpeg = uJpeg.data?.data
rec(
  'jpeg_no_storage_key',
  imgJpeg && !('storageKey' in imgJpeg) && !('storage_key' in imgJpeg),
  JSON.stringify(imgJpeg),
)

const uPng = await upload(png, 't.png', 'image/png')
rec('upload_png', uPng.status < 300, 'status=' + uPng.status)

const uWebp = await upload(webp, 't.webp', 'image/webp')
rec(
  'upload_webp',
  uWebp.status < 300,
  'status=' + uWebp.status + ' ' + JSON.stringify(uWebp.data)?.slice(0, 180),
)

const list1 = await api(
  'GET',
  `/hs-math/train/sessions/${sessionId}/items/${si}/images`,
  { token: tok2 },
)
rec(
  'list_images',
  list1.status === 200 && Array.isArray(list1.data?.data?.items),
  'n=' + (list1.data?.data?.items?.length),
)
rec(
  'sort_order_present',
  (list1.data?.data?.items || []).every((x) => typeof x.sortOrder === 'number'),
)

const badMime = await upload(Buffer.from('hello'), 't.txt', 'text/plain')
rec('reject_illegal_mime', badMime.status >= 400, 'status=' + badMime.status)

const badMagic = await upload(
  Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8]),
  'x.jpg',
  'image/jpeg',
)
rec('reject_illegal_magic', badMagic.status >= 400, 'status=' + badMagic.status)

const big = Buffer.alloc(10 * 1024 * 1024 + 100, 0xff)
const bigJpeg = Buffer.concat([jpeg.slice(0, 20), big])
const bigUp = await upload(bigJpeg, 'big.jpg', 'image/jpeg')
rec('reject_over_10mb', bigUp.status >= 400, 'status=' + bigUp.status)

const u4 = await upload(jpeg, '4.jpg', 'image/jpeg')
const u5 = await upload(png, '5.png', 'image/png')
rec('upload_4_5', u4.status < 300 && u5.status < 300, '4=' + u4.status + ' 5=' + u5.status)
const u6 = await upload(webp, '6.webp', 'image/webp')
rec('reject_over_5', u6.status >= 400, 'status=' + u6.status)

const listFull = await api(
  'GET',
  `/hs-math/train/sessions/${sessionId}/items/${si}/images`,
  { token: tok2 },
)
const allIds = (listFull.data?.data?.items || []).map((x) => String(x.imageId))
out.allImageIds = allIds

const crossList = await api(
  'GET',
  `/hs-math/train/sessions/${sessionId}/items/${si}/images`,
  { token: tok1 },
)
rec(
  'cross_user_list_denied',
  crossList.status === 404 || crossList.status === 403,
  'status=' + crossList.status,
)

const noAuth = await api(
  'GET',
  `/hs-math/train/sessions/${sessionId}/items/${si}/images/${allIds[0]}`,
  { expectBin: true },
)
rec('unauth_read_denied', noAuth.status === 401, 'status=' + noAuth.status)

const crossRead = await api(
  'GET',
  `/hs-math/train/sessions/${sessionId}/items/${si}/images/${allIds[0]}`,
  { token: tok1, expectBin: true },
)
rec(
  'cross_user_read_denied',
  crossRead.status === 404 || crossRead.status === 403,
  'status=' + crossRead.status,
)

const delId = allIds[4]
const del = await api(
  'DELETE',
  `/hs-math/train/sessions/${sessionId}/items/${si}/images/${delId}`,
  { token: tok2 },
)
rec('delete_draft', del.status < 300, 'status=' + del.status)

const remaining = allIds.filter((id) => id !== delId)
const keepIds = remaining.slice(0, 2)
const orphanId = remaining.find((id) => !keepIds.includes(id))

const savePure = await api('PATCH', `/hs-math/train/sessions/${sessionId}/answers`, {
  token: tok2,
  body: {
    sortOrder: appItem.sortOrder,
    userAnswerPayload: { kind: 'application', imageIds: keepIds },
  },
})
rec('save_pure_images', savePure.status === 200, 'status=' + savePure.status)

const submit1 = await api('POST', `/hs-math/train/sessions/${sessionId}/submit`, {
  token: tok2,
})
rec('submit_pure', submit1.status < 300, 'status=' + submit1.status)
const s1 = submit1.data?.data
const appAfter = (s1?.items || []).find((i) => i.id === si)
rec('pending_ai', appAfter?.gradeResult === 'pending_ai', String(appAfter?.gradeResult))
rec('pending_count', s1?.pendingCount >= 1, 'pending=' + s1?.pendingCount)
rec(
  'correct_wrong_ok',
  typeof s1?.correctCount === 'number' && typeof s1?.wrongCount === 'number',
  'c=' + s1?.correctCount + ' w=' + s1?.wrongCount,
)
// accuracy should ignore pending: if only pending answered, accuracy null or based on scored only
rec(
  'accuracy_ignores_pending',
  s1?.pendingCount > 0 &&
    (s1.correctCount + s1.wrongCount === 0
      ? s1.accuracyPercent === null
      : true),
  'acc=' + s1?.accuracyPercent,
)
rec(
  'images_submitted_meta',
  Array.isArray(appAfter?.images) && appAfter.images.length === keepIds.length,
  JSON.stringify(appAfter?.images),
)
rec(
  'history_no_orphan_draft',
  !(appAfter?.images || []).some((x) => String(x.imageId) === String(orphanId)),
)
rec(
  'history_no_storage_key',
  !JSON.stringify(appAfter || {}).toLowerCase().includes('storage_key') &&
    !JSON.stringify(appAfter || {}).includes('storageKey'),
)

const imgRows = mysqlJson(
  `SELECT id, status FROM hs_math_train_session_item_images WHERE session_item_id=${si} ORDER BY id`,
)
const locked = imgRows.filter((r) => keepIds.includes(String(r.id)))
rec(
  'db_draft_to_submitted',
  locked.length === keepIds.length && locked.every((r) => r.status === 'submitted'),
  JSON.stringify(locked),
)
const orphanRow = imgRows.find((r) => String(r.id) === String(orphanId))
rec(
  'orphan_stays_draft',
  !orphanRow || orphanRow.status === 'draft',
  orphanRow ? orphanRow.status : 'gone',
)

const delSub = await api(
  'DELETE',
  `/hs-math/train/sessions/${sessionId}/items/${si}/images/${keepIds[0]}`,
  { token: tok2 },
)
rec('delete_submitted_denied', delSub.status >= 400, 'status=' + delSub.status)

const patchDone = await api('PATCH', `/hs-math/train/sessions/${sessionId}/answers`, {
  token: tok2,
  body: {
    sortOrder: appItem.sortOrder,
    userAnswerPayload: { kind: 'application', text: 'x' },
  },
})
rec('patch_after_submit_409', patchDone.status === 409, 'status=' + patchDone.status)

const submit2 = await api('POST', `/hs-math/train/sessions/${sessionId}/submit`, {
  token: tok2,
})
rec(
  'submit_idempotent',
  submit2.status < 300 && submit2.data?.data?.submitMeta?.idempotent === true,
  JSON.stringify(submit2.data?.data?.submitMeta),
)

const bin = await api(
  'GET',
  `/hs-math/train/sessions/${sessionId}/items/${si}/images/${keepIds[0]}`,
  { token: tok2, expectBin: true },
)
rec(
  'auth_read_ok',
  bin.status === 200 && Buffer.isBuffer(bin.data) && bin.data.length > 0,
  'len=' + bin.data?.length + ' ct=' + bin.ct,
)
rec(
  'cache_control',
  /private/i.test(bin.cache) && /no-store/i.test(bin.cache),
  bin.cache,
)
rec('content_type_image', /^image\//i.test(bin.ct), bin.ct)
const meta0 = (listFull.data?.data?.items || []).find(
  (x) => String(x.imageId) === keepIds[0],
)
if (meta0?.mimeType === 'image/jpeg') {
  rec(
    'content_matches_jpeg_soi',
    bin.data[0] === 0xff && bin.data[1] === 0xd8,
    'soi',
  )
} else {
  rec('content_matches_uploaded', bin.data.length > 0, 'mime=' + meta0?.mimeType)
}

// mixed
const created2 = await api('POST', '/hs-math/train/sessions', {
  token: tok2,
  body: {
    specialtyId: '18',
    categoryId: '44',
    difficulty: 2,
    count: 5,
    mode: 'sequential',
    poolMode: 'formal',
  },
})
rec(
  'create_session_mixed',
  created2.status === 200 || created2.status === 201,
  'status=' + created2.status,
)
const sess2 = created2.data.data
const app2 = sess2.items.find((i) => String(i.itemId) === '151')
const si2 = app2.id
const upM1 = await api(
  'POST',
  `/hs-math/train/sessions/${sess2.id}/items/${si2}/images`,
  { token: tok2, form: formFile(jpeg, 'm.jpg', 'image/jpeg') },
)
const mid = String(upM1.data?.data?.imageId)
const saveMix = await api('PATCH', `/hs-math/train/sessions/${sess2.id}/answers`, {
  token: tok2,
  body: {
    sortOrder: app2.sortOrder,
    userAnswerPayload: {
      kind: 'application',
      text: '混合作答步骤',
      imageIds: [mid],
    },
  },
})
rec('save_mixed', saveMix.status === 200, 'status=' + saveMix.status)
const subMix = await api('POST', `/hs-math/train/sessions/${sess2.id}/submit`, {
  token: tok2,
})
const mixItem = (subMix.data?.data?.items || []).find((i) => i.id === si2)
rec(
  'submit_mixed_pending_ai',
  mixItem?.gradeResult === 'pending_ai',
  String(mixItem?.gradeResult),
)
rec(
  'mixed_text_preserved',
  mixItem?.userAnswerPayloadJson?.text === '混合作答步骤',
)
rec(
  'mixed_images_len',
  Array.isArray(mixItem?.images) && mixItem.images.length === 1,
  JSON.stringify(mixItem?.images),
)
out.sessionIdMixed = sess2.id

const after = mysqlJson(`
SELECT
  (SELECT COUNT(*) FROM hs_math_train_items) items,
  (SELECT COUNT(*) FROM hs_math_train_items WHERE status='approved') approved,
  (SELECT COUNT(*) FROM hs_math_methods) methods,
  (SELECT COUNT(*) FROM hs_math_train_item_methods) method_links,
  (SELECT COUNT(*) FROM hs_math_train_item_reviews) reviews,
  (SELECT COUNT(*) FROM hs_math_train_sessions WHERE user_id<>2) other_user_sessions,
  (SELECT COUNT(*) FROM hs_math_train_session_item_images) images
`)[0]
out.after = after
rec('items_unchanged', after.items === base.items && after.approved === base.approved)
rec(
  'methods_unchanged',
  after.methods === base.methods && after.method_links === base.method_links,
)
rec('reviews_unchanged', after.reviews === base.reviews)
rec(
  'other_users_sessions_unchanged',
  after.other_user_sessions === base.other_user_sessions,
)

// API cwd = apps/api → uploads/hs-math/application-answers
const uploadRoot = path.resolve(
  path.join(__dirname, '../../../uploads/hs-math/application-answers'),
)
out.uploadRoot = uploadRoot
rec('private_upload_root_exists', fs.existsSync(uploadRoot), uploadRoot)
const publicUploadsSample = path.resolve(
  path.join(__dirname, '../../../uploads'),
)
const keys = mysqlJson(
  `SELECT storage_key FROM hs_math_train_session_item_images WHERE id IN (${keepIds.map((x) => Number(x)).join(',')})`,
)
const underPrivate = keys.every((k) =>
  String(k.storage_key).startsWith('hs-math/application-answers/'),
)
rec('storage_key_under_private_prefix', underPrivate, JSON.stringify(keys))
// 确认文件不落在公开根下直接暴露文件名（仍为 .bin 在私有子目录）
rec(
  'files_are_bin_under_user_dir',
  keys.every((k) => /\.bin$/.test(String(k.storage_key))),
)

const failed = out.checks.filter((c) => !c.ok)
out.summary = {
  total: out.checks.length,
  failed: failed.length,
  pass: failed.length === 0,
  failedNames: failed.map((f) => f.name),
}
const resultPath = path.resolve(
  __dirname,
  '../../../../../docs/high_school_math/_2f_run_result.json',
)
fs.writeFileSync(resultPath, JSON.stringify(out, null, 2))
console.log('SUMMARY', JSON.stringify(out.summary))
process.exit(failed.length ? 1 : 0)
