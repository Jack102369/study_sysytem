import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const env = { ...process.env }
for (const line of fs.readFileSync(path.join(root, 'apps/api/.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m && env[m[1].trim()] === undefined) env[m[1].trim()] = m[2].trim()
}
const conn = await createConnection({
  host: env.DB_HOST || '127.0.0.1',
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER || 'study_user',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'study_system',
})

const [[cnt]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_session_item_diagrams`,
)
const [samples] = await conn.query(
  `SELECT d.id, d.session_item_id, d.object_id, d.sort_order, d.content_sha256,
          si.session_id, si.item_id, i.code
   FROM hs_math_train_session_item_diagrams d
   JOIN hs_math_train_session_items si ON si.id=d.session_item_id
   LEFT JOIN hs_math_train_items i ON i.id=si.item_id
   ORDER BY d.id DESC LIMIT 10`,
)
const [four] = await conn.query(
  `SELECT d.id, d.session_item_id, d.object_id, d.content_sha256,
          si.session_id, si.item_id, i.code
   FROM hs_math_train_session_item_diagrams d
   JOIN hs_math_train_session_items si ON si.id=d.session_item_id
   JOIN hs_math_train_items i ON i.id=si.item_id
   WHERE si.item_id IN (244,231,215,242)
   ORDER BY d.id DESC LIMIT 20`,
)

// web probe variants
const probes = {}
for (const url of [
  'http://127.0.0.1:5173/',
  'http://localhost:5173/',
  'http://127.0.0.1:5173/settings/hs-math-train-items',
  'http://127.0.0.1:3000/hs-math/admin/train-items?page=1&pageSize=1',
]) {
  try {
    const res = await fetch(url, { redirect: 'manual' })
    probes[url] = { status: res.status }
  } catch (e) {
    probes[url] = { error: String(e?.message || e) }
  }
}

const out = {
  sessionItemDiagramRows: Number(cnt.n),
  recentSnapshots: samples,
  snapshotsForTargetFour: four,
  historyUiRunnable: Number(cnt.n) > 0,
  probes,
}
console.log(JSON.stringify(out, null, 2))
await conn.end()
