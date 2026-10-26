/**
 * DIAGRAM-1D readonly: fetch 4 REQUIRED items. SELECT only.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const docs = path.resolve(__dirname, '..')

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

const codes = ['CAND-G1B-093', 'CAND-G1B-080', 'CAND-G1B-064', 'CAND-G1B-091']
const env = loadEnv()
const conn = await createConnection({
  host: env.DB_HOST || '127.0.0.1',
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER || 'study_user',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'study_system',
  charset: 'utf8mb4',
})

const [items] = await conn.query(
  `SELECT i.id, i.code, i.stem, i.options_json, i.answer_payload_json, i.analysis,
          i.difficulty, i.content_version, i.status, i.pool, i.is_active, i.qtype,
          i.reviewed_at, i.reviewed_by
   FROM hs_math_train_items i
   WHERE i.code IN (?,?,?,?)
   ORDER BY FIELD(i.code,?,?,?,?)`,
  [...codes, ...codes],
)

const out = []
for (const it of items) {
  const [kps] = await conn.query(
    `SELECT k.code, k.name FROM hs_math_train_item_kps ik
     JOIN hs_math_knowledge_points k ON k.id = ik.knowledge_point_id
     WHERE ik.item_id = ? ORDER BY ik.sort_order, k.id`,
    [it.id],
  )
  const [methods] = await conn.query(
    `SELECT m.code, m.name FROM hs_math_train_item_methods im
     JOIN hs_math_methods m ON m.id = im.method_id
     WHERE im.item_id = ? ORDER BY im.sort_order, m.id`,
    [it.id],
  )
  const [reviews] = await conn.query(
    `SELECT id, content_version, review_status, reviewed_at, created_at
     FROM hs_math_train_item_reviews
     WHERE item_id = ?
     ORDER BY id DESC LIMIT 5`,
    [it.id],
  )
  let options = it.options_json
  let answer = it.answer_payload_json
  try {
    options = typeof options === 'string' ? JSON.parse(options) : options
  } catch {
    /* keep raw */
  }
  try {
    answer = typeof answer === 'string' ? JSON.parse(answer) : answer
  } catch {
    /* keep raw */
  }
  out.push({
    id: it.id,
    code: it.code,
    stem: it.stem,
    options,
    answer,
    analysis: it.analysis,
    difficulty: it.difficulty,
    content_version: it.content_version,
    status: it.status,
    pool: it.pool,
    is_active: it.is_active,
    qtype: it.qtype,
    reviewed_at: it.reviewed_at,
    reviewed_by: it.reviewed_by,
    knowledge_points: kps,
    methods,
    recent_reviews: reviews,
  })
}

await conn.end()
fs.writeFileSync(
  path.join(docs, '_g1d_required_items_ro.json'),
  JSON.stringify({ readonly: true, wroteDb: false, items: out }, null, 2),
)
console.log(JSON.stringify({ count: out.length, codes: out.map((x) => x.code) }, null, 2))
