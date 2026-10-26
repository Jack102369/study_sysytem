/** Post-PATCH readonly verify for item 215. SELECT only. */
import crypto from 'node:crypto'
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
  `SELECT id, code, stem, status, content_version, difficulty, analysis,
          answer_payload_json, reviewed_at, reviewed_by, qtype, pool, is_active
   FROM hs_math_train_items WHERE id = 215`,
)
const [[drawable]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1`,
)
const [kps] = await conn.query(
  `SELECT k.code FROM hs_math_train_item_kps ik
   JOIN hs_math_knowledge_points k ON k.id = ik.knowledge_point_id
   WHERE ik.item_id = 215`,
)
const [methods] = await conn.query(
  `SELECT m.code FROM hs_math_train_item_methods im
   JOIN hs_math_methods m ON m.id = im.method_id
   WHERE im.item_id = 215`,
)
const [reviews] = await conn.query(
  `SELECT id, content_version, content_fingerprint, review_status
   FROM hs_math_train_item_reviews WHERE item_id = 215 ORDER BY id DESC LIMIT 1`,
)

await conn.end()

const answer =
  typeof it.answer_payload_json === 'string'
    ? JSON.parse(it.answer_payload_json)
    : it.answer_payload_json

const out = {
  readonly: true,
  id: it.id,
  code: it.code,
  status: it.status,
  content_version: Number(it.content_version),
  stem: it.stem,
  hasDingjiao: String(it.stem).includes('顶角'),
  hasYangjiaoPhrase: String(it.stem).includes('塔顶的仰角为'),
  drawable: Number(drawable.n),
  difficulty: it.difficulty,
  qtype: it.qtype,
  pool: it.pool,
  is_active: it.is_active,
  reviewed_at: it.reviewed_at,
  reviewed_by: it.reviewed_by,
  analysisSha: crypto.createHash('sha256').update(String(it.analysis || '')).digest('hex'),
  standardAnswer: answer?.standardAnswer,
  rubric: answer?.rubric,
  kps: kps.map((x) => x.code),
  methods: methods.map((x) => x.code),
  latestReview: reviews[0] || null,
  checks: {
    draft_cv2: it.status === 'draft' && Number(it.content_version) === 2,
    stem_ok: String(it.stem).includes('塔顶的仰角为') && !String(it.stem).includes('顶角'),
    drawable_112: Number(drawable.n) === 112,
    review_stale:
      reviews[0] &&
      Number(reviews[0].content_version) === 1 &&
      Number(it.content_version) === 2,
  },
}

fs.writeFileSync(
  path.join(docs, '_g1d_064_fix_verify_ro.json'),
  JSON.stringify(out, null, 2),
)
console.log(JSON.stringify(out, null, 2))
