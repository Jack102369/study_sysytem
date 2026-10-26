/**
 * DIAGRAM-1F: upload 4 REQUIRED item diagrams via Admin API. Stop on fail.
 * No review/approve. No SQL write of diagrams. DO NOT commit.
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

const EXPECTED = [
  {
    code: 'CAND-G1B-093',
    id: '244',
    status: 'approved',
    cv: 1,
    expectCvAfter: 2,
    expectStatusAfter: 'draft',
    sha256: 'e12b2f2b2373d4545c6a79af55caa1f0c85c7d83f7b29d8a2cc5132671fe33f1',
    file: 'CAND-G1B-093.png',
    altText: '正方体示意：标出 BD1 与平面 A1C1D',
  },
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
    stemMustInclude: '塔顶的仰角为',
    stemMustNotInclude: '顶角',
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
  phase: 'HS-MATH-BANK-DIAGRAM-1F',
  startedAt: new Date().toISOString(),
  endedAt: null,
  status: 'IN_PROGRESS',
  base: BASE,
  pre: null,
  items: [],
  security: {},
  blockers: [],
  notes: [],
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

function sha256Buf(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex')
}

function dataOf(json) {
  if (json?.success === true && json.data !== undefined) return json.data
  return json
}

async function apiJson(method, urlPath, token, body) {
  const headers = { Authorization: `Bearer ${token}` }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers,
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

async function apiUpload(itemId, token, filePath, altText) {
  const buf = fs.readFileSync(filePath)
  const blob = new Blob([buf], { type: 'image/png' })
  const fd = new FormData()
  fd.append('file', blob, path.basename(filePath))
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
    `SELECT id, code, stem, status, content_version, pool, is_active, qtype
     FROM hs_math_train_items WHERE id=? AND code=?`,
    [id, code],
  )
  if (!it) return null
  const [[dc]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_item_diagrams WHERE item_id=?`,
    [id],
  )
  const [reviews] = await conn.query(
    `SELECT id, content_version, content_fingerprint, review_status
     FROM hs_math_train_item_reviews WHERE item_id=? ORDER BY id DESC LIMIT 1`,
    [id],
  )
  return {
    id: String(it.id),
    code: it.code,
    stem: it.stem,
    status: it.status,
    content_version: Number(it.content_version),
    pool: it.pool,
    is_active: Number(it.is_active),
    qtype: it.qtype,
    diagramLinkCount: Number(dc.n),
    latestReview: reviews[0] || null,
  }
}

async function drawable() {
  const [[r]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_items
     WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  return Number(r.n)
}

try {
  const [[admin]] = await conn.query(
    `SELECT id, role FROM users WHERE id=2 OR role='ADMIN' ORDER BY id ASC LIMIT 1`,
  )
  if (!admin || String(admin.role).toUpperCase() !== 'ADMIN') {
    report.blockers.push('no ADMIN user')
  }
  const token = report.blockers.length
    ? null
    : signJwt(String(admin.id), 'ADMIN', env.JWT_SECRET)
  report.adminUserId = admin ? String(admin.id) : null

  const preDrawable = await drawable()
  report.pre = { drawable: preDrawable, items: [] }

  // Preflight all
  for (const spec of EXPECTED) {
    const filePath = path.join(pngDir, spec.file)
    if (!fs.existsSync(filePath)) {
      report.blockers.push(`missing file ${spec.file}`)
      continue
    }
    const fileSha = sha256Buf(fs.readFileSync(filePath))
    if (fileSha !== spec.sha256) {
      report.blockers.push(`${spec.code} SHA mismatch: got ${fileSha}`)
    }
    if (spec.shaPrefix && !fileSha.startsWith(spec.shaPrefix)) {
      report.blockers.push(`${spec.code} SHA prefix not ${spec.shaPrefix}`)
    }
    const it = await loadItem(spec.id, spec.code)
    if (!it) {
      report.blockers.push(`${spec.code} not found`)
      continue
    }
    const row = {
      ...it,
      fileSha,
      expectStatus: spec.status,
      expectCv: spec.cv,
    }
    report.pre.items.push(row)
    if (it.status !== spec.status) {
      report.blockers.push(`${spec.code} status=${it.status} expect ${spec.status}`)
    }
    if (it.content_version !== spec.cv) {
      report.blockers.push(`${spec.code} cv=${it.content_version} expect ${spec.cv}`)
    }
    if (it.pool !== 'formal' || it.is_active !== 1) {
      report.blockers.push(`${spec.code} pool/active unexpected`)
    }
    if (it.diagramLinkCount !== 0) {
      report.blockers.push(`${spec.code} already has ${it.diagramLinkCount} diagrams`)
    }
    if (spec.stemMustInclude && !String(it.stem).includes(spec.stemMustInclude)) {
      report.blockers.push(`${spec.code} stem missing ${spec.stemMustInclude}`)
    }
    if (spec.stemMustNotInclude && String(it.stem).includes(spec.stemMustNotInclude)) {
      report.blockers.push(`${spec.code} stem still has ${spec.stemMustNotInclude}`)
    }
  }

  if (report.blockers.length || !token) {
    report.status = 'BLOCKED'
    report.endedAt = new Date().toISOString()
    fs.writeFileSync(
      path.join(docs, '_g1f_diagram_upload_result.json'),
      JSON.stringify(report, null, 2),
    )
    console.log(JSON.stringify(report, null, 2))
    await conn.end()
    process.exit(2)
  }

  // Upload sequentially
  for (const spec of EXPECTED) {
    const itemReport = {
      code: spec.code,
      itemId: spec.id,
      ok: false,
      pre: null,
      upload: null,
      post: null,
      authRead: null,
      unauthRead: null,
      studentRead: null,
    }

    const pre = await loadItem(spec.id, spec.code)
    const panelPre = await apiJson(
      'GET',
      `/hs-math/admin/train-items/${spec.id}/review-panel`,
      token,
    )
    const fpPre =
      dataOf(panelPre.json)?.contentFingerprint ||
      dataOf(panelPre.json)?.fingerprint ||
      null
    itemReport.pre = {
      status: pre.status,
      content_version: pre.content_version,
      diagramLinkCount: pre.diagramLinkCount,
      review: pre.latestReview,
      fingerprint: fpPre,
    }

    const filePath = path.join(pngDir, spec.file)
    const up = await apiUpload(spec.id, token, filePath, spec.altText)
    const upData = dataOf(up.json)
    itemReport.upload = {
      httpStatus: up.status,
      contentVersion: upData?.contentVersion,
      status: upData?.status,
      notice: upData?.notice,
      diagrams: upData?.diagrams,
      error: up.status >= 400 ? up.json : undefined,
    }

    if (up.status >= 400 || !upData?.diagrams?.length) {
      itemReport.ok = false
      report.items.push(itemReport)
      report.blockers.push(`${spec.code} upload failed http=${up.status}`)
      report.status = report.items.some((x) => x.ok) ? 'PARTIAL' : 'BLOCKED'
      report.endedAt = new Date().toISOString()
      report.postDrawable = await drawable()
      fs.writeFileSync(
        path.join(docs, '_g1f_diagram_upload_result.json'),
        JSON.stringify(report, null, 2),
      )
      console.log(JSON.stringify(report, null, 2))
      await conn.end()
      process.exit(3)
    }

    const post = await loadItem(spec.id, spec.code)
    const panelPost = await apiJson(
      'GET',
      `/hs-math/admin/train-items/${spec.id}/review-panel`,
      token,
    )
    const fpPost =
      dataOf(panelPost.json)?.contentFingerprint ||
      dataOf(panelPost.json)?.fingerprint ||
      null

    const link = upData.diagrams[0]
    const objectId = link?.objectId
    const linkId = link?.linkId ?? link?.id
    const sortOrder = link?.sortOrder

    // DB object sha
    const [[obj]] = await conn.query(
      `SELECT id, content_sha256, mime_type, size_bytes, width_px, height_px, storage_key
       FROM hs_math_train_item_diagram_objects WHERE id=?`,
      [objectId],
    )

    const contentPath = `/hs-math/admin/train-items/${spec.id}/diagrams/${linkId}/content`
    const authRead = await apiBinary(contentPath, token)
    const unauthRead = await apiBinary(contentPath, null)

    // non-admin JWT
    const [[stu]] = await conn.query(
      `SELECT id, role FROM users WHERE role <> 'ADMIN' ORDER BY id ASC LIMIT 1`,
    )
    let studentRead = null
    if (stu) {
      const stuToken = signJwt(String(stu.id), String(stu.role || 'USER'), env.JWT_SECRET)
      studentRead = await apiBinary(contentPath, stuToken)
    }

    // private path under API cwd uploads/hs-math/item-diagrams/{aa}/{sha}.bin
    const aa = String(obj?.content_sha256 || '').slice(0, 2)
    const absCandidates = [
      path.join(root, 'apps/api/uploads/hs-math/item-diagrams', aa, `${obj?.content_sha256}.bin`),
      path.join(root, 'uploads/hs-math/item-diagrams', aa, `${obj?.content_sha256}.bin`),
    ]
    const abs = absCandidates.find((p) => fs.existsSync(p)) || absCandidates[0]
    const storageExists = fs.existsSync(abs)

    const reviewStale =
      post.latestReview &&
      Number(post.latestReview.content_version) < post.content_version &&
      (!fpPost ||
        String(post.latestReview.content_fingerprint) !== String(fpPost))

    const checks = {
      statusOk: post.status === spec.expectStatusAfter,
      cvOk: post.content_version === spec.expectCvAfter,
      oneDiagram: post.diagramLinkCount === 1,
      sortOrder1: Number(sortOrder) === 1,
      fpChanged: !!fpPre && !!fpPost && fpPre !== fpPost,
      reviewStale: !!reviewStale,
      authReadOk:
        authRead.status === 200 &&
        String(authRead.contentType || '').includes('image/png') &&
        authRead.sha256 === spec.sha256,
      unauthDenied: unauthRead.status === 401 || unauthRead.status === 403,
      studentDenied:
        studentRead == null ||
        studentRead.status === 401 ||
        studentRead.status === 403,
      mimePng: obj?.mime_type === 'image/png',
      storagePrivate: storageExists && abs.includes(`${path.sep}uploads${path.sep}`),
      objShaMatchesFile: obj?.content_sha256 === spec.sha256,
    }

    itemReport.post = {
      status: post.status,
      content_version: post.content_version,
      diagramLinkCount: post.diagramLinkCount,
      fingerprint: fpPost,
      review: post.latestReview,
      objectId: objectId != null ? String(objectId) : null,
      linkId: linkId != null ? String(linkId) : null,
      sortOrder,
      object: obj
        ? {
            content_sha256: obj.content_sha256,
            mime_type: obj.mime_type,
            size_bytes: obj.size_bytes,
            width_px: obj.width_px,
            height_px: obj.height_px,
            storage_key: obj.storage_key,
          }
        : null,
      checks,
    }
    itemReport.authRead = authRead
    itemReport.unauthRead = { status: unauthRead.status }
    itemReport.studentRead = studentRead
      ? { status: studentRead.status, userId: String(stu.id) }
      : null

    const failed = Object.entries(checks).filter(([, v]) => !v)
    itemReport.ok = failed.length === 0
    if (!itemReport.ok) {
      report.blockers.push(
        `${spec.code} post-check fail: ${failed.map(([k]) => k).join(',')}`,
      )
      report.items.push(itemReport)
      report.status = 'PARTIAL'
      report.endedAt = new Date().toISOString()
      report.postDrawable = await drawable()
      fs.writeFileSync(
        path.join(docs, '_g1f_diagram_upload_result.json'),
        JSON.stringify(report, null, 2),
      )
      console.log(JSON.stringify(report, null, 2))
      await conn.end()
      process.exit(4)
    }

    report.items.push(itemReport)
  }

  report.postDrawable = await drawable()
  report.security = {
    note: 'Admin content requires JWT+Admin; unauth/student denied per item',
    noReviewOrApproveCalled: true,
  }
  report.status =
    report.items.length === 4 && report.items.every((x) => x.ok)
      ? 'DIAGRAM_UPLOAD_PASS'
      : report.items.some((x) => x.ok)
        ? 'PARTIAL'
        : 'BLOCKED'
  report.endedAt = new Date().toISOString()
} catch (e) {
  report.blockers.push(String(e?.stack || e))
  report.status = report.items?.some((x) => x.ok) ? 'PARTIAL' : 'BLOCKED'
  report.endedAt = new Date().toISOString()
} finally {
  await conn.end()
}

fs.writeFileSync(
  path.join(docs, '_g1f_diagram_upload_result.json'),
  JSON.stringify(report, null, 2),
)
console.log(JSON.stringify(report, null, 2))
process.exit(report.status === 'DIAGRAM_UPLOAD_PASS' ? 0 : 1)
