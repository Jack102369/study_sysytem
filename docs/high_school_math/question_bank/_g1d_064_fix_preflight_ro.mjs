/** CAND-G1B-064 FIX-PREFLIGHT readonly. SELECT only. */
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

const env = loadEnv()
const conn = await createConnection({
  host: env.DB_HOST || '127.0.0.1',
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER || 'study_user',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'study_system',
  charset: 'utf8mb4',
})

const [[it]] = await conn.query(
  `SELECT id, code, stem, options_json, answer_payload_json, analysis,
          difficulty, content_version, status, pool, is_active, qtype,
          reviewed_at, reviewed_by, specialty_id, category_id
   FROM hs_math_train_items WHERE code = ?`,
  ['CAND-G1B-064'],
)
const [kps] = await conn.query(
  `SELECT k.code, k.name, ik.is_primary, ik.sort_order
   FROM hs_math_train_item_kps ik
   JOIN hs_math_knowledge_points k ON k.id = ik.knowledge_point_id
   WHERE ik.item_id = ? ORDER BY ik.sort_order, k.id`,
  [it.id],
)
const [methods] = await conn.query(
  `SELECT m.code, m.name, im.is_primary, im.sort_order
   FROM hs_math_train_item_methods im
   JOIN hs_math_methods m ON m.id = im.method_id
   WHERE im.item_id = ? ORDER BY im.sort_order, m.id`,
  [it.id],
)
const [reviews] = await conn.query(
  `SELECT id, content_version, content_fingerprint, review_status,
          review_comment, reviewed_at, reviewer_user_id
   FROM hs_math_train_item_reviews
   WHERE item_id = ? ORDER BY id DESC LIMIT 5`,
  [it.id],
)

await conn.end()

const parse = (v) => {
  if (v == null) return null
  if (typeof v === 'object') return v
  try {
    return JSON.parse(v)
  } catch {
    return v
  }
}

const out = {
  readonly: true,
  wroteDb: false,
  id: it.id,
  code: it.code,
  stem: it.stem,
  options: parse(it.options_json),
  answer: parse(it.answer_payload_json),
  analysis: it.analysis,
  difficulty: it.difficulty,
  content_version: it.content_version,
  status: it.status,
  pool: it.pool,
  is_active: it.is_active,
  qtype: it.qtype,
  reviewed_at: it.reviewed_at,
  reviewed_by: it.reviewed_by,
  specialty_id: it.specialty_id,
  category_id: it.category_id,
  knowledge_points: kps,
  methods,
  reviews,
  note_fingerprint:
    'fingerprint is computed at review time (content_fingerprint on reviews); not a stored column on train_items',
}

fs.writeFileSync(
  path.join(docs, '_g1d_064_fix_preflight_ro.json'),
  JSON.stringify(out, null, 2),
)
console.log(
  JSON.stringify(
    {
      id: out.id,
      cv: out.content_version,
      status: out.status,
      stem: out.stem,
      latestReview: reviews[0]
        ? {
            id: reviews[0].id,
            cv: reviews[0].content_version,
            status: reviews[0].review_status,
            fp: reviews[0].content_fingerprint,
          }
        : null,
    },
    null,
    2,
  ),
)
