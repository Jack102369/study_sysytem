/**
 * GLOBAL-3C Gate C: upload 7 REQUIRED PNGs for CAND-G3A.
 * Stop on first failure; keep prior successes. DO NOT commit.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const docs = path.resolve(__dirname, '..')
const pngDir = path.join(docs, 'diagrams/required_g3a')
const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'

const EXPECTED = [
  {
    code: 'CAND-G3A-048',
    sha256: '09cff8070df0c56b93a1214474cb537b8bf0aaf46e383f1cda5e54b1cdd7425a',
    altText: '单位圆标准位置角π-π/3示意',
  },
  {
    code: 'CAND-G3A-055',
    sha256: '663bc9abcc02629ca97d75fd5011159c71274165b90555148ca0c97de1be0a66',
    altText: '三角形SSA已知量示意',
  },
  {
    code: 'CAND-G3A-068',
    sha256: 'bf53651b03100790ae1356dfae8443d1689cb5a9575d1d644daeb9b4ae0b16af',
    altText: '平行四边形对角线示意',
  },
  {
    code: 'CAND-G3A-080',
    sha256: 'ddded6b9b6f0272bf99b49890dfe1b62e26d15c69ac928eb466ef57d436a6ead',
    altText: '圆柱叠圆锥组合体示意',
  },
  {
    code: 'CAND-G3A-081',
    sha256: '7ab70f1c5c885fb7d289c42233bfad135c5da28081c5c6afc59f1bc360b7c139',
    altText: '正四面体示意',
  },
  {
    code: 'CAND-G3A-085',
    sha256: '64a58fa3945ef85aad06dc6aff04159200f5e6448ea1318a4f5d65d1b7a1efc7',
    altText: '长方体斜线与底面示意',
  },
  {
    code: 'CAND-G3A-086',
    sha256: '384efb58aeaaf1a991c699a763623d42ea332f04502201534955e059c1a09fe3',
    altText: '正方体中点MN示意',
  },
]

const report = {
  phase: 'HS-MATH-BANK-GLOBAL-3C-DIAGRAM',
  startedAt: new Date().toISOString(),
  decision: null,
  items: [],
  errors: [],
  pre: {},
  post: {},
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
function sha256File(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
}
function sha256Buf(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex')
}
function dataOf(json) {
  if (json?.success === true && json.data !== undefined) return json.data
  return json
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

function finish(code) {
  report.endedAt = new Date().toISOString()
  const out = path.join(docs, '_g3c_diagram_upload_result.json')
  fs.writeFileSync(out, JSON.stringify(report, null, 2))
  console.log(
    JSON.stringify(
      {
        decision: report.decision,
        okCount: report.items.filter((x) => x.ok).length,
        errors: report.errors,
        items: report.items,
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

const [[admin]] = await conn.query(
  `SELECT id FROM users WHERE role='ADMIN' ORDER BY id ASC LIMIT 1`,
)
if (!admin) {
  report.decision = 'BLOCKED'
  report.errors.push('no ADMIN')
  await conn.end()
  finish(2)
}
const token = signJwt(String(admin.id), 'ADMIN', env.JWT_SECRET)
report.adminUserId = String(admin.id)

const codes = EXPECTED.map((x) => x.code)
const [rows] = await conn.query(
  `SELECT id, code, status, pool, content_version FROM hs_math_train_items
   WHERE code IN (${codes.map(() => '?').join(',')})`,
  codes,
)
const byCode = Object.fromEntries(rows.map((r) => [r.code, r]))

const [[drawable]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)
const [[g3a]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-G3A-%'`,
)
report.pre = {
  drawable: Number(drawable.n),
  g3a: Number(g3a.n),
  rows: rows.map((r) => ({
    code: r.code,
    id: String(r.id),
    status: r.status,
    cv: Number(r.content_version),
  })),
}

if (Number(drawable.n) !== 213 || Number(g3a.n) !== 100) {
  report.decision = 'BLOCKED'
  report.errors.push(`baseline mismatch drawable=${drawable.n} g3a=${g3a.n}`)
  await conn.end()
  finish(2)
}

for (const spec of EXPECTED) {
  const row = byCode[spec.code]
  if (!row || row.status !== 'draft' || row.pool !== 'formal') {
    report.decision = 'BLOCKED'
    report.errors.push(`prestate:${spec.code}`)
    await conn.end()
    finish(2)
  }
  const filePath = path.join(pngDir, `${spec.code}.png`)
  const localSha = sha256File(filePath)
  if (localSha !== spec.sha256) {
    report.decision = 'BLOCKED'
    report.errors.push(`local_sha:${spec.code}`)
    await conn.end()
    finish(2)
  }
  // already has diagram?
  const [[cnt]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_item_diagrams WHERE item_id=?`,
    [row.id],
  )
  if (Number(cnt.n) > 0) {
    report.decision = 'BLOCKED'
    report.errors.push(`already_has_diagram:${spec.code}`)
    await conn.end()
    finish(2)
  }
}

for (const spec of EXPECTED) {
  const row = byCode[spec.code]
  const itemId = String(row.id)
  const filePath = path.join(pngDir, `${spec.code}.png`)
  const cvBefore = Number(row.content_version)
  const up = await apiUpload(itemId, token, filePath, spec.altText)
  const upData = dataOf(up.json)
  const entry = {
    code: spec.code,
    itemId,
    uploadHttp: up.status,
    ok: false,
  }
  if (up.status >= 400 || !upData?.diagrams?.length) {
    entry.error = upData?.message || JSON.stringify(up.json).slice(0, 300)
    report.items.push(entry)
    report.errors.push(`upload_fail:${spec.code}`)
    report.decision = report.items.some((x) => x.ok) ? 'PARTIAL' : 'BLOCKED'
    await conn.end()
    finish(1)
  }
  const link = upData.diagrams[0]
  const linkId = String(link.id || link.linkId)
  const returnedSha = link.contentSha256 || link.content_sha256 || link.sha256
  entry.linkId = linkId
  entry.returnedSha = returnedSha
  entry.cvAfterUpload = upData.contentVersion ?? upData.content_version

  const authRead = await apiBinary(
    `/hs-math/admin/train-items/${itemId}/diagrams/${linkId}/content`,
    token,
  )
  const noAuth = await apiBinary(
    `/hs-math/admin/train-items/${itemId}/diagrams/${linkId}/content`,
    null,
  )
  entry.authRead = {
    status: authRead.status,
    sha256: authRead.sha256,
    contentType: authRead.contentType,
  }
  entry.noAuthStatus = noAuth.status

  const [[it2]] = await conn.query(
    `SELECT status, content_version FROM hs_math_train_items WHERE id=?`,
    [itemId],
  )
  entry.dbStatus = it2.status
  entry.dbCv = Number(it2.content_version)

  const panel = await apiJson(
    'GET',
    `/hs-math/admin/train-items/${itemId}/review-panel`,
    token,
  )
  const panelData = dataOf(panel.json)
  entry.panelCv = panelData?.contentVersion
  entry.panelFpPrefix = String(panelData?.contentFingerprint || '').slice(0, 16)
  entry.diagramShaList = panelData?.diagramSha256List || panelData?.content?.diagramSha256List

  const ok =
    returnedSha === spec.sha256 &&
    authRead.status === 200 &&
    authRead.sha256 === spec.sha256 &&
    String(authRead.contentType || '').includes('image/png') &&
    noAuth.status >= 400 &&
    it2.status === 'draft' &&
    Number(it2.content_version) === cvBefore + 1

  entry.ok = ok
  report.items.push(entry)
  if (!ok) {
    report.errors.push(`verify_fail:${spec.code}`)
    report.decision = 'PARTIAL'
    await conn.end()
    finish(1)
  }
}

const [[drawable2]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)
const [diagCount] = await conn.query(
  `SELECT i.code, COUNT(d.id) AS n
   FROM hs_math_train_items i
   LEFT JOIN hs_math_train_item_diagrams d ON d.item_id=i.id
   WHERE i.code IN (${codes.map(() => '?').join(',')})
   GROUP BY i.code`,
  codes,
)
report.post = {
  drawable: Number(drawable2.n),
  diagramCounts: Object.fromEntries(diagCount.map((r) => [r.code, Number(r.n)])),
}
await conn.end()

const allOk =
  report.items.length === 7 &&
  report.items.every((x) => x.ok) &&
  Number(drawable2.n) === 213 &&
  diagCount.every((r) => Number(r.n) === 1)

report.decision = allOk ? 'DIAGRAM_UPLOAD_PASS' : 'PARTIAL'
finish(allOk ? 0 : 1)
