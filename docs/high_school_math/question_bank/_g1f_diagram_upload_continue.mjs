/**
 * Continue DIAGRAM-1F after 093 succeeded: verify 093, upload 080/064/091.
 * Do NOT delete/reupload 093. Stop on fail.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const docs = path.resolve(__dirname, '..')
const pngDir = path.join(docs, 'diagrams/required_g1b')
const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'

const REMAINING = [
  {
    code: 'CAND-G1B-080',
    id: '231',
    status: 'approved',
    cv: 1,
    expectCvAfter: 2,
    expectStatusAfter: 'draft',
    sha256: 'c01574e808ba150866781d4fd716348fb3331359c635ae5f1a4b46f137ef31fc',
    file: 'CAND-G1B-080.png',
    altText: '平行四边形 ABCD 与向量 a、b',
  },
  {
    code: 'CAND-G1B-064',
    id: '215',
    status: 'draft',
    cv: 2,
    expectCvAfter: 3,
    expectStatusAfter: 'draft',
    sha256: 'a3549131d845107b4c795242013f50beb048639b056b1c302e79276dc8b4abf7',
    file: 'CAND-G1B-064.png',
    altText: '塔高测量：水平距离 40m 与仰角示意',
  },
  {
    code: 'CAND-G1B-091',
    id: '242',
    status: 'approved',
    cv: 1,
    expectCvAfter: 2,
    expectStatusAfter: 'draft',
    sha256: 'a77867e8beb43226cd1e230b043151a00e851f560026d7882c15b0a5584f19f8',
    file: 'CAND-G1B-091.png',
    altText: '斜二测两套坐标系对照示意',
    shaPrefix: 'a77867e8beb4',
  },
]

const report = {
  phase: 'HS-MATH-BANK-DIAGRAM-1F-CONTINUE',
  startedAt: new Date().toISOString(),
  endedAt: null,
  status: 'IN_PROGRESS',
  base: BASE,
  verified093: null,
  items: [],
  blockers: [],
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
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const body = Buffer.from(JSON.stringify({ sub, role, iat: now, exp: now + 7200 })).toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}
function sha256Buf(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex')
}
function dataOf(json) {
  if (json?.success === true && json.data !== undefined) return json.data
  return json
}
async function apiJson(method, urlPath, token) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
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
async function apiUpload(itemId, token, filePath, altText) {
  const buf = fs.readFileSync(filePath)
  const fd = new FormData()
  fd.append('file', new Blob([buf], { type: 'image/png' }), path.basename(filePath))
  if (altText) fd.append('altText', altText)
  const res = await fetch(`${BASE}/hs-math/admin/train-items/${itemId}/diagrams`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
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
async function apiBinary(urlPath, token) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${urlPath}`, { method: 'GET', headers })
  const buf = Buffer.from(await res.arrayBuffer())
  return {
    status: res.status,
    contentType: res.headers.get('content-type'),
    bytes: buf.length,
    sha256: buf.length ? sha256Buf(buf) : null,
  }
}

function resolveStorageAbs(sha) {
  const aa = String(sha).slice(0, 2)
  const cands = [
    path.join(root, 'apps/api/uploads/hs-math/item-diagrams', aa, `${sha}.bin`),
    path.join(root, 'uploads/hs-math/item-diagrams', aa, `${sha}.bin`),
  ]
  return cands.find((p) => fs.existsSync(p)) || cands[0]
}

const env = loadEnv()
const conn = await createConnection({
  host: env.DB_HOST || '127.0.0.1',
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER || 'study_user',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'study_system',
  charset: 'utf8mb4',
})

async function loadItem(id, code) {
  const [[it]] = await conn.query(
    `SELECT id, code, status, content_version, pool, is_active FROM hs_math_train_items WHERE id=? AND code=?`,
    [id, code],
  )
  const [[dc]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_item_diagrams WHERE item_id=?`,
    [id],
  )
  const [reviews] = await conn.query(
    `SELECT id, content_version, content_fingerprint, review_status FROM hs_math_train_item_reviews WHERE item_id=? ORDER BY id DESC LIMIT 1`,
    [id],
  )
  const [links] = await conn.query(
    `SELECT d.id AS link_id, d.object_id, d.sort_order, o.content_sha256, o.mime_type, o.size_bytes, o.width_px, o.height_px, o.storage_key
     FROM hs_math_train_item_diagrams d
     JOIN hs_math_train_item_diagram_objects o ON o.id = d.object_id
     WHERE d.item_id=? ORDER BY d.sort_order`,
    [id],
  )
  return {
    id: String(it.id),
    code: it.code,
    status: it.status,
    content_version: Number(it.content_version),
    pool: it.pool,
    is_active: Number(it.is_active),
    diagramLinkCount: Number(dc.n),
    latestReview: reviews[0] || null,
    links,
  }
}
async function drawable() {
  const [[r]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  return Number(r.n)
}

try {
  const [[admin]] = await conn.query(
    `SELECT id, role FROM users WHERE id=2 OR role='ADMIN' ORDER BY id ASC LIMIT 1`,
  )
  const token = signJwt(String(admin.id), 'ADMIN', env.JWT_SECRET)
  report.adminUserId = String(admin.id)
  report.preDrawable = await drawable()

  // Verify 093 already uploaded
  const i093 = await loadItem('244', 'CAND-G1B-093')
  const sha093 = 'e12b2f2b2373d4545c6a79af55caa1f0c85c7d83f7b29d8a2cc5132671fe33f1'
  const link093 = i093.links[0]
  const panel093 = await apiJson('GET', `/hs-math/admin/train-items/244/review-panel`, token)
  const fp093 = dataOf(panel093.json)?.contentFingerprint
  const content093 = await apiBinary(
    `/hs-math/admin/train-items/244/diagrams/${link093.link_id}/content`,
    token,
  )
  const unauth093 = await apiBinary(
    `/hs-math/admin/train-items/244/diagrams/${link093.link_id}/content`,
    null,
  )
  const abs093 = resolveStorageAbs(sha093)
  report.verified093 = {
    status: i093.status,
    cv: i093.content_version,
    diagramLinkCount: i093.diagramLinkCount,
    objectId: String(link093.object_id),
    linkId: String(link093.link_id),
    sortOrder: link093.sort_order,
    contentSha256: link093.content_sha256,
    fingerprint: fp093,
    authRead: content093,
    unauthStatus: unauth093.status,
    storageExists: fs.existsSync(abs093),
    storageAbs: abs093,
    ok:
      i093.status === 'draft' &&
      i093.content_version === 2 &&
      i093.diagramLinkCount === 1 &&
      Number(link093.sort_order) === 1 &&
      link093.content_sha256 === sha093 &&
      content093.status === 200 &&
      content093.sha256 === sha093 &&
      (unauth093.status === 401 || unauth093.status === 403) &&
      fs.existsSync(abs093),
  }
  if (!report.verified093.ok) {
    report.blockers.push('093 re-verify failed')
    report.status = 'PARTIAL'
    report.endedAt = new Date().toISOString()
    fs.writeFileSync(path.join(docs, '_g1f_diagram_upload_continue_result.json'), JSON.stringify(report, null, 2))
    console.log(JSON.stringify(report, null, 2))
    await conn.end()
    process.exit(2)
  }

  for (const spec of REMAINING) {
    const itemReport = { code: spec.code, itemId: spec.id, ok: false }
    const pre = await loadItem(spec.id, spec.code)
    if (pre.status !== spec.status || pre.content_version !== spec.cv || pre.diagramLinkCount !== 0) {
      report.blockers.push(
        `${spec.code} unexpected pre state status=${pre.status} cv=${pre.content_version} diagrams=${pre.diagramLinkCount}`,
      )
      report.items.push({ ...itemReport, pre })
      report.status = 'PARTIAL'
      report.endedAt = new Date().toISOString()
      report.postDrawable = await drawable()
      fs.writeFileSync(path.join(docs, '_g1f_diagram_upload_continue_result.json'), JSON.stringify(report, null, 2))
      console.log(JSON.stringify(report, null, 2))
      await conn.end()
      process.exit(3)
    }
    const fileSha = sha256Buf(fs.readFileSync(path.join(pngDir, spec.file)))
    if (fileSha !== spec.sha256) {
      report.blockers.push(`${spec.code} file sha mismatch`)
      report.status = 'PARTIAL'
      report.endedAt = new Date().toISOString()
      fs.writeFileSync(path.join(docs, '_g1f_diagram_upload_continue_result.json'), JSON.stringify(report, null, 2))
      console.log(JSON.stringify(report, null, 2))
      await conn.end()
      process.exit(3)
    }
    const panelPre = await apiJson('GET', `/hs-math/admin/train-items/${spec.id}/review-panel`, token)
    const fpPre = dataOf(panelPre.json)?.contentFingerprint
    const up = await apiUpload(spec.id, token, path.join(pngDir, spec.file), spec.altText)
    const upData = dataOf(up.json)
    if (up.status >= 400 || !upData?.diagrams?.length) {
      itemReport.upload = { httpStatus: up.status, body: up.json }
      report.blockers.push(`${spec.code} upload failed`)
      report.items.push(itemReport)
      report.status = 'PARTIAL'
      report.endedAt = new Date().toISOString()
      report.postDrawable = await drawable()
      fs.writeFileSync(path.join(docs, '_g1f_diagram_upload_continue_result.json'), JSON.stringify(report, null, 2))
      console.log(JSON.stringify(report, null, 2))
      await conn.end()
      process.exit(4)
    }
    const post = await loadItem(spec.id, spec.code)
    const panelPost = await apiJson('GET', `/hs-math/admin/train-items/${spec.id}/review-panel`, token)
    const fpPost = dataOf(panelPost.json)?.contentFingerprint
    const link = upData.diagrams[0]
    const linkId = link.linkId
    const objectId = link.objectId
    const authRead = await apiBinary(
      `/hs-math/admin/train-items/${spec.id}/diagrams/${linkId}/content`,
      token,
    )
    const unauthRead = await apiBinary(
      `/hs-math/admin/train-items/${spec.id}/diagrams/${linkId}/content`,
      null,
    )
    const [[stu]] = await conn.query(
      `SELECT id, role FROM users WHERE role <> 'ADMIN' ORDER BY id ASC LIMIT 1`,
    )
    const stuToken = signJwt(String(stu.id), String(stu.role || 'USER'), env.JWT_SECRET)
    const studentRead = await apiBinary(
      `/hs-math/admin/train-items/${spec.id}/diagrams/${linkId}/content`,
      stuToken,
    )
    const abs = resolveStorageAbs(spec.sha256)
    const checks = {
      statusOk: post.status === spec.expectStatusAfter,
      cvOk: post.content_version === spec.expectCvAfter,
      oneDiagram: post.diagramLinkCount === 1,
      sortOrder1: Number(link.sortOrder) === 1,
      fpChanged: !!fpPre && !!fpPost && fpPre !== fpPost,
      reviewStale:
        post.latestReview &&
        Number(post.latestReview.content_version) < post.content_version,
      authReadOk:
        authRead.status === 200 &&
        String(authRead.contentType || '').includes('png') &&
        authRead.sha256 === spec.sha256,
      unauthDenied: unauthRead.status === 401 || unauthRead.status === 403,
      studentDenied: studentRead.status === 401 || studentRead.status === 403,
      storagePrivate: fs.existsSync(abs),
      objSha: link.contentSha256 === spec.sha256,
    }
    Object.assign(itemReport, {
      pre: { status: pre.status, cv: pre.content_version, fingerprint: fpPre },
      upload: {
        httpStatus: up.status,
        contentVersion: upData.contentVersion,
        status: upData.status,
        diagrams: upData.diagrams,
      },
      post: {
        status: post.status,
        cv: post.content_version,
        fingerprint: fpPost,
        objectId: String(objectId),
        linkId: String(linkId),
        review: post.latestReview,
        checks,
        storageAbs: abs,
      },
      authRead,
      unauthRead: { status: unauthRead.status },
      studentRead: { status: studentRead.status },
      ok: Object.values(checks).every(Boolean),
    })
    if (!itemReport.ok) {
      report.blockers.push(
        `${spec.code} checks fail: ${Object.entries(checks)
          .filter(([, v]) => !v)
          .map(([k]) => k)
          .join(',')}`,
      )
      report.items.push(itemReport)
      report.status = 'PARTIAL'
      report.endedAt = new Date().toISOString()
      report.postDrawable = await drawable()
      fs.writeFileSync(path.join(docs, '_g1f_diagram_upload_continue_result.json'), JSON.stringify(report, null, 2))
      console.log(JSON.stringify(report, null, 2))
      await conn.end()
      process.exit(5)
    }
    report.items.push(itemReport)
  }

  report.postDrawable = await drawable()
  report.status = 'DIAGRAM_UPLOAD_PASS'
  report.endedAt = new Date().toISOString()
} catch (e) {
  report.blockers.push(String(e?.stack || e))
  report.status = 'PARTIAL'
  report.endedAt = new Date().toISOString()
} finally {
  await conn.end()
}

fs.writeFileSync(
  path.join(docs, '_g1f_diagram_upload_continue_result.json'),
  JSON.stringify(report, null, 2),
)
console.log(JSON.stringify(report, null, 2))
process.exit(report.status === 'DIAGRAM_UPLOAD_PASS' ? 0 : 1)
