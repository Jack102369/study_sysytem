/**
 * DIAGRAM-1H read-only prep. No writes. No session create.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'
const WEB = process.env.HS_MATH_WEB_BASE || 'http://127.0.0.1:5173'

const ITEMS = [
  { code: 'CAND-G1B-093', id: '244', cv: 2, sha: 'e12b2f2b2373d4545c6a79af55caa1f0c85c7d83f7b29d8a2cc5132671fe33f1' },
  { code: 'CAND-G1B-080', id: '231', cv: 2, sha: 'c01574e808ba150866781d4fd716348fb3331359c635ae5f1a4b46f137ef31fc' },
  { code: 'CAND-G1B-064', id: '215', cv: 3, sha: 'a3549131d845107b4c795242013f50beb048639b056b1c302e79276dc8b4abf7' },
  { code: 'CAND-G1B-091', id: '242', cv: 2, sha: 'a77867e8beb43226cd1e230b043151a00e851f560026d7882c15b0a5584f19f8' },
]

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

const env = loadEnv()
const out = {
  phase: 'HS-MATH-BANK-DIAGRAM-1H-PREP',
  at: new Date().toISOString(),
  base: BASE,
  web: WEB,
  reachability: {},
  drawable: null,
  items: [],
  historyWithDiagramSnapshot: null,
  notes: [],
}

async function probe(url) {
  try {
    const res = await fetch(url, { method: 'GET' })
    return { ok: res.status < 500, status: res.status }
  } catch (e) {
    return { ok: false, error: String(e?.message || e) }
  }
}

out.reachability.apiRoot = await probe(`${BASE}/`)
out.reachability.webRoot = await probe(`${WEB}/`)

const conn = await createConnection({
  host: env.DB_HOST || '127.0.0.1',
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER || 'study_user',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'study_system',
  charset: 'utf8mb4',
})

const [[dw]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1`,
)
out.drawable = Number(dw.n)

const [[admin]] = await conn.query(
  `SELECT id FROM users WHERE id=2 OR role='ADMIN' ORDER BY id ASC LIMIT 1`,
)
const token = signJwt(String(admin.id), 'ADMIN', env.JWT_SECRET)

for (const e of ITEMS) {
  const [[it]] = await conn.query(
    `SELECT i.id, i.code, i.status, i.content_version, i.qtype, i.pool, i.is_active,
            s.code AS specialty_code, s.name AS specialty_name,
            c.code AS category_code, c.name AS category_name
     FROM hs_math_train_items i
     JOIN hs_math_specialties s ON s.id=i.specialty_id
     JOIN hs_math_categories c ON c.id=i.category_id
     WHERE i.id=? AND i.code=?`,
    [e.id, e.code],
  )
  const [links] = await conn.query(
    `SELECT d.id AS link_id, d.object_id, d.sort_order, o.content_sha256, o.mime_type
     FROM hs_math_train_item_diagrams d
     JOIN hs_math_train_item_diagram_objects o ON o.id=d.object_id
     WHERE d.item_id=? ORDER BY d.sort_order`,
    [e.id],
  )
  let authRead = null
  if (links[0]) {
    const res = await fetch(
      `${BASE}/hs-math/admin/train-items/${e.id}/diagrams/${links[0].link_id}/content`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    const buf = Buffer.from(await res.arrayBuffer())
    authRead = {
      status: res.status,
      contentType: res.headers.get('content-type'),
      bytes: buf.length,
      sha256: buf.length ? crypto.createHash('sha256').update(buf).digest('hex') : null,
    }
  }
  const row = {
    ...e,
    db: it
      ? {
          status: it.status,
          cv: Number(it.content_version),
          qtype: it.qtype,
          pool: it.pool,
          active: Number(it.is_active),
          specialty: { code: it.specialty_code, name: it.specialty_name },
          category: { code: it.category_code, name: it.category_name },
        }
      : null,
    links,
    authRead,
    ok:
      !!it &&
      it.status === 'approved' &&
      Number(it.content_version) === e.cv &&
      links.length === 1 &&
      links[0].content_sha256 === e.sha &&
      authRead?.status === 200 &&
      authRead?.sha256 === e.sha,
  }
  out.items.push(row)
}

// Existing history sessions that already snapshot diagram object ids (read-only detect)
let hist = { exists: false, sample: null, note: '' }
try {
  const [rows] = await conn.query(
    `SELECT si.id AS session_item_id, si.session_id, si.item_id, i.code,
            si.item_content_version, si.diagrams_json
     FROM hs_math_train_session_items si
     JOIN hs_math_train_items i ON i.id=si.item_id
     WHERE si.item_id IN (244,231,215,242)
     ORDER BY si.id DESC LIMIT 20`,
  )
  // diagrams may be in a column or only via runtime payload — probe column existence
  hist.sampleCount = rows.length
  hist.rowsTouchingFour = rows.slice(0, 5).map((r) => ({
    sessionId: String(r.session_id),
    sessionItemId: String(r.session_item_id),
    itemId: String(r.item_id),
    code: r.code,
    itemCv: r.item_content_version,
    hasDiagramsJson: r.diagrams_json != null,
  }))
} catch (err) {
  hist.error = String(err?.message || err)
}

// Check if any session_item has diagram snapshot fields in schema
try {
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hs_math_train_session_items'
       AND COLUMN_NAME LIKE '%diagram%'`,
  )
  hist.diagramColumns = cols.map((c) => c.COLUMN_NAME)
} catch {
  hist.diagramColumns = []
}

// Count sessions that include any of the four items AFTER they had diagrams
// (session created after diagram links existed). Read-only heuristic only.
const [[linkMin]] = await conn.query(
  `SELECT MIN(created_at) AS t FROM hs_math_train_item_diagrams WHERE item_id IN (244,231,215,242)`,
)
hist.firstDiagramLinkAt = linkMin?.t || null

const [postSessions] = await conn.query(
  `SELECT DISTINCT s.id, s.status, s.created_at
   FROM hs_math_train_sessions s
   JOIN hs_math_train_session_items si ON si.session_id=s.id
   WHERE si.item_id IN (244,231,215,242)
     AND (? IS NULL OR s.created_at >= ?)
   ORDER BY s.id DESC LIMIT 10`,
  [hist.firstDiagramLinkAt, hist.firstDiagramLinkAt],
)
hist.sessionsAfterDiagramUpload = postSessions.map((s) => ({
  id: String(s.id),
  status: s.status,
  createdAt: s.created_at,
}))
hist.exists = postSessions.length > 0
hist.note = hist.exists
  ? '存在抽到四题之一的历史 session（是否含插图快照须网页打开结果页确认；本阶段未创建新 session）'
  : '未发现插图入库后抽到四题之一的历史 session → 建议 HISTORY_SNAPSHOT_UI_NOT_RUN，除非用户另有带图历史'

out.historyWithDiagramSnapshot = hist
out.notes.push(
  '学生端无法指定 itemId；抽到四题非保证 → 未抽到记 STUDENT_TARGET_NOT_REACHED',
)
out.notes.push('本脚本只读；未创建 session；未改题；未 approve')
out.allItemsOk = out.items.every((x) => x.ok)
out.drawableOk = out.drawable === 113

await conn.end()
fs.writeFileSync(path.join(docs, '_g1h_readonly_prep.json'), JSON.stringify(out, null, 2))
console.log(JSON.stringify(out, null, 2))
process.exit(out.allItemsOk && out.drawableOk ? 0 : 2)
