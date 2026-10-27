/**
 * GLOBAL-2G Gate C: upload 7 REQUIRED PNGs for CAND-G2A.
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
const pngDir = path.join(docs, 'diagrams/required_g2a')
const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'

const EXPECTED = [
  {
    code: 'CAND-G2A-045',
    sha256: 'ac818d4e899196f39e20c9f1d7a8e3cb143d04cf38d93c3e01e65bb172dd76d4',
    altText: '圆O扇形圆心角2π/3半径6示意',
  },
  {
    code: 'CAND-G2A-055',
    sha256: 'a83856cae522849f89bed698ef8a4082549dad46b5bde2fc4bbd83f9ac6792bb',
    altText: '双测点仰角45度60度间距20m示意',
  },
  {
    code: 'CAND-G2A-081',
    sha256: '97b7c3ecc7f7d4af3c05e51fdb3563f6ac90320e8363d4e92cf99c5d982b084c',
    altText: '正三棱锥P-ABC高PO示意',
  },
  {
    code: 'CAND-G2A-084',
    sha256: '8da6b0ae8355630027fbe29087f46d80c05427344dc91301d8a139df16f4a449',
    altText: '正方体淡标AC与A1B示意',
  },
  {
    code: 'CAND-G2A-086',
    sha256: '35583af69ab4f3793dbf73655afb755036bb9e6de1caf0fc663062ea0b3111fe',
    altText: '长方体中点E F与底面示意',
  },
  {
    code: 'CAND-G2A-088',
    sha256: '5b88220539e26e23fccec4beabdf8e2251dc34939ad8005d572a4c123f5f8daa',
    altText: '直三棱柱AB1与平面A1BC示意',
  },
  {
    code: 'CAND-G2A-089',
    sha256: 'ecfab27657b72f09d0b5660df26e9e014e5ff0396db1db78f17dbd81c096f62f',
    altText: '正方体淡标AC A1C1 BD示意',
  },
]

const report = {
  phase: 'HS-MATH-BANK-GLOBAL-2G-DIAGRAM',
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
  const out = path.join(docs, '_g2g_diagram_upload_result.json')
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
const [[g2a]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-G2A-%'`,
)
report.pre = {
  drawable: Number(drawable.n),
  g2a: Number(g2a.n),
  rows: rows.map((r) => ({
    code: r.code,
    id: String(r.id),
    status: r.status,
    cv: Number(r.content_version),
  })),
}

if (Number(drawable.n) !== 113 || Number(g2a.n) !== 100) {
  report.decision = 'BLOCKED'
  report.errors.push(`baseline mismatch drawable=${drawable.n} g2a=${g2a.n}`)
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
  Number(drawable2.n) === 113 &&
  diagCount.every((r) => Number(r.n) === 1)

report.decision = allOk ? 'DIAGRAM_UPLOAD_PASS' : 'PARTIAL'
finish(allOk ? 0 : 1)
