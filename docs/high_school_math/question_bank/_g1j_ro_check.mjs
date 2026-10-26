/**
 * GLOBAL-1J readonly pool/distribution/gate check.
 * SELECT only. NO session create. DO NOT commit.
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

const env = loadEnv()
const conn = await createConnection({
  host: env.DB_HOST || '127.0.0.1',
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER || 'study_user',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'study_system',
  charset: 'utf8mb4',
})

async function one(sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows[0]
}
async function many(sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows
}

const cand = await many(
  `SELECT i.id, i.code, i.pool, i.status, i.is_active, i.qtype, i.difficulty,
          i.content_version, i.specialty_id, i.category_id, i.answer_payload_json,
          s.code AS specialty_code, s.name AS specialty_name, s.sort_order AS sp_sort,
          c.code AS category_code, c.name AS category_name
   FROM hs_math_train_items i
   JOIN hs_math_specialties s ON s.id = i.specialty_id
   JOIN hs_math_categories c ON c.id = i.category_id
   WHERE i.code REGEXP '^CAND-G1B-[0-9]{3}$'
   ORDER BY i.code`,
)

const ids = cand.map((r) => r.id)
const ph = ids.map(() => '?').join(',')
const kps = await many(
  `SELECT item_id, is_primary FROM hs_math_train_item_kps WHERE item_id IN (${ph})`,
  ids,
)
const methods = await many(
  `SELECT item_id FROM hs_math_train_item_methods WHERE item_id IN (${ph})`,
  ids,
)

const kpBy = new Map()
for (const l of kps) {
  const k = String(l.item_id)
  if (!kpBy.has(k)) kpBy.set(k, [])
  kpBy.get(k).push(l)
}
const mBy = new Map()
for (const l of methods) {
  const k = String(l.item_id)
  mBy.set(k, (mBy.get(k) || 0) + 1)
}

const drawable = await many(
  `SELECT id, code, pool, status, is_active, qtype, difficulty, specialty_id
   FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1
   ORDER BY code`,
)
const drawableCand = drawable.filter((r) => /^CAND-G1B-\d{3}$/.test(r.code))
const drawableLegacy = drawable.filter((r) => !/^CAND-G1B-\d{3}$/.test(r.code))

const bySpecialty = {}
const byQtype = {}
const byDiff = {}
for (const r of cand) {
  const sk = `${r.specialty_code}|${r.specialty_name}`
  bySpecialty[sk] = (bySpecialty[sk] || 0) + 1
  byQtype[r.qtype] = (byQtype[r.qtype] || 0) + 1
  byDiff[String(r.difficulty)] = (byDiff[String(r.difficulty)] || 0) + 1
}

const eligible = cand.filter(
  (r) => r.pool === 'formal' && r.status === 'approved' && Number(r.is_active) === 1,
)

let appRubricBad = []
const apps = cand.filter((r) => r.qtype === 'application')
for (const a of apps) {
  const p =
    typeof a.answer_payload_json === 'string'
      ? JSON.parse(a.answer_payload_json)
      : a.answer_payload_json
  const sum = (p?.rubric || []).reduce((s, x) => s + Number(x.maxScore), 0)
  if (
    p?.kind !== 'application' ||
    sum !== Number(p.maxScore) ||
    !(p.rubric || []).every((x) => x.criteria && Number(x.maxScore) > 0)
  ) {
    appRubricBad.push(a.code)
  }
}

const missingKp = cand.filter((r) => !(kpBy.get(String(r.id)) || []).length).map((r) => r.code)
const badPrimary = cand
  .filter((r) => {
    const ls = kpBy.get(String(r.id)) || []
    return ls.filter((x) => Number(x.is_primary)).length !== 1
  })
  .map((r) => r.code)
const missingMethod = cand
  .filter((r) => !(mBy.get(String(r.id)) || 0))
  .map((r) => r.code)

const sessions = Number((await one(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)).n)
const sessionItems = Number(
  (await one(`SELECT COUNT(1) AS n FROM hs_math_train_session_items`)).n,
)

// AI-related env flags (names only + presence/boolean-ish; never dump secrets)
const aiWatch = [
  'HS_MATH_AI_GRADING_ENABLED',
  'HS_MATH_VISION_GRADING_ENABLED',
  'HS_MATH_APPLICATION_AI_MODE',
  'HS_MATH_APPLICATION_AI_ALLOWED_USER_IDS',
  'HS_MATH_DEEPSEEK_DAILY_LIMIT',
  'DEEPSEEK_MODEL',
  'DEEPSEEK_API_KEY',
  'QWEN_API_KEY',
  'DASHSCOPE_API_KEY',
]
const aiFlags = {}
for (const k of aiWatch) {
  if (env[k] === undefined) {
    aiFlags[k] = '[MISSING]'
    continue
  }
  const v = String(env[k] ?? '')
  if (/KEY|SECRET|TOKEN|PASSWORD/i.test(k)) {
    aiFlags[k] = v ? '[SET]' : '[EMPTY]'
  } else {
    aiFlags[k] = v
  }
}

const chapters = await many(
  `SELECT s.code, s.name, s.sort_order,
          SUM(CASE WHEN i.id IS NOT NULL THEN 1 ELSE 0 END) AS cand_n,
          SUM(CASE WHEN i.status='approved' AND i.is_active=1 AND i.pool='formal' THEN 1 ELSE 0 END) AS drawable_cand_n
   FROM hs_math_specialties s
   LEFT JOIN hs_math_train_items i
     ON i.specialty_id = s.id AND i.code REGEXP '^CAND-G1B-[0-9]{3}$'
   WHERE s.is_active=1
   GROUP BY s.id, s.code, s.name, s.sort_order
   ORDER BY s.sort_order ASC, s.id ASC`,
)

await conn.end()

const out = {
  phase: 'HS-MATH-BANK-GLOBAL-1J-RO',
  readonly: true,
  createdSession: false,
  candN: cand.length,
  approvedFormalActive: eligible.length,
  draftLeft: cand.filter((r) => r.status === 'draft').length,
  drawableTotal: drawable.length,
  drawableCand: drawableCand.length,
  drawableLegacy: drawableLegacy.length,
  bySpecialty,
  byQtype,
  byDiff,
  chapters: chapters.map((r) => ({
    code: r.code,
    name: r.name,
    sort: Number(r.sort_order),
    candN: Number(r.cand_n),
    drawableCandN: Number(r.drawable_cand_n),
  })),
  chaptersWithCand: chapters.filter((r) => Number(r.cand_n) > 0).length,
  kpOk: missingKp.length === 0 && badPrimary.length === 0,
  methodOk: missingMethod.length === 0,
  missingKp,
  badPrimary,
  missingMethod,
  apps: apps.length,
  appRubricBad,
  cv2: cand.filter((r) => Number(r.content_version) === 2).map((r) => r.code),
  sessions,
  sessionItems,
  aiFlags,
  gateNote:
    'student draw requires pool=formal + status=approved + is_active=1 (HsMathTrainService)',
  allEligibleInDrawablePool: eligible.length === drawableCand.length && eligible.length === 100,
}

fs.writeFileSync(path.join(docs, '_g1j_ro.json'), JSON.stringify(out, null, 2))
console.log(JSON.stringify(out, null, 2))
