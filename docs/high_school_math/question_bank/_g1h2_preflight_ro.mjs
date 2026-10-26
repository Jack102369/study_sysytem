/**
 * GLOBAL-1H-2 readonly: load 037/074 + review rows. DO NOT commit.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docs = path.resolve(__dirname, '..')

function loadEnv() {
  const env = { ...process.env }
  const p = path.resolve(__dirname, '../../../apps/api/.env')
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m && env[m[1].trim()] === undefined) env[m[1].trim()] = m[2].trim()
    }
  }
  return env
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

const codes = ['CAND-G1B-037', 'CAND-G1B-074']
const [items] = await conn.query(
  `SELECT id, code, pool, status, is_active, content_version, qtype, difficulty,
          stem, options_json, answer_payload_json, analysis,
          source_type, specialty_id, category_id, knowledge_point_id
   FROM hs_math_train_items WHERE code IN (?, ?) ORDER BY code`,
  codes,
)
const ids = items.map((r) => r.id)
const [reviews] = await conn.query(
  `SELECT id, item_id, review_status, content_version, content_fingerprint,
          LEFT(review_comment, 200) AS comment_head, reviewed_at
   FROM hs_math_train_item_reviews WHERE item_id IN (?, ?) ORDER BY item_id, id`,
  ids,
)
const [other] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items
   WHERE code LIKE 'CAND-G1B-%' AND code NOT IN (?, ?)`,
  codes,
)
const [[drawable]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1`,
)

await conn.end()

const out = {
  items: items.map((r) => ({
    ...r,
    options_json:
      typeof r.options_json === 'string' ? JSON.parse(r.options_json) : r.options_json,
    answer_payload_json:
      typeof r.answer_payload_json === 'string'
        ? JSON.parse(r.answer_payload_json)
        : r.answer_payload_json,
  })),
  reviews,
  otherCandCount: Number(other[0].n),
  drawable: Number(drawable.n),
}
fs.writeFileSync(path.join(docs, '_g1h2_preflight_ro.json'), JSON.stringify(out, null, 2))
console.log(
  JSON.stringify(
    {
      n: items.length,
      stems: items.map((r) => ({ code: r.code, stem: r.stem, cv: r.content_version, status: r.status })),
      reviews: reviews.map((r) => ({
        item_id: String(r.item_id),
        status: r.review_status,
        cv: r.content_version,
        fp: String(r.content_fingerprint).slice(0, 16),
      })),
      otherCandCount: out.otherCandCount,
      drawable: out.drawable,
    },
    null,
    2,
  ),
)
