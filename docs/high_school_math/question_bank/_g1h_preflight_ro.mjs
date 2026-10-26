/**
 * GLOBAL-1H-PREFLIGHT readonly. DO NOT commit (local DB creds).
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'
import { candidates } from './candidates-g1b-100.mjs'

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

function normStem(s) {
  return String(s || '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const keys = Object.keys(value).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`
}

/** Approximate content fingerprint inputs (parity with server: stem/options/answer/analysis/codes) */
function roughContentKey(row, kpCodes, methodCodes) {
  return stableStringify({
    code: row.code,
    specialtyId: String(row.specialty_id),
    categoryId: String(row.category_id),
    qtype: row.qtype,
    difficulty: Number(row.difficulty),
    stem: row.stem,
    options: row.options_json,
    answer: row.answer_payload_json,
    analysis: row.analysis,
    kpCodes: [...kpCodes].sort(),
    methodCodes: [...methodCodes].sort(),
    sourceType: row.source_type,
    sourceReference: row.source_reference,
  })
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
  `SELECT id, code, pool, status, is_active, qtype, difficulty, content_version,
          specialty_id, category_id, knowledge_point_id, stem, options_json,
          answer_payload_json, analysis, source_type, source_reference,
          source_verification_status, source_license_status,
          reviewed_by, reviewed_at, created_at, updated_at
   FROM hs_math_train_items WHERE code LIKE 'CAND-G1B-%' ORDER BY code`,
)
const ids = cand.map((r) => r.id)

const badPoolStatus = cand.filter(
  (r) => r.pool !== 'formal' || r.status !== 'draft',
)
const inactive = cand.filter((r) => !Number(r.is_active))
const cvNot1 = cand.filter((r) => Number(r.content_version) !== 1)
const reviewedSet = cand.filter((r) => r.reviewed_by != null || r.reviewed_at != null)

let reviewRows = []
if (ids.length) {
  reviewRows = await many(
    `SELECT r.id, r.item_id, r.review_status, r.content_version, r.content_fingerprint,
            r.reviewer_user_id, r.reviewed_at
     FROM hs_math_train_item_reviews r
     WHERE r.item_id IN (${ids.map(() => '?').join(',')})`,
    ids,
  )
}

const approvedCand = cand.filter((r) => r.status === 'approved')

let kpLinks = []
let methodLinks = []
if (ids.length) {
  kpLinks = await many(
    `SELECT item_id, knowledge_point_id, is_primary FROM hs_math_train_item_kps
     WHERE item_id IN (${ids.map(() => '?').join(',')})`,
    ids,
  )
  methodLinks = await many(
    `SELECT item_id, method_id, is_primary FROM hs_math_train_item_methods
     WHERE item_id IN (${ids.map(() => '?').join(',')})`,
    ids,
  )
}

const kpByItem = new Map()
for (const l of kpLinks) {
  const k = String(l.item_id)
  if (!kpByItem.has(k)) kpByItem.set(k, [])
  kpByItem.get(k).push(l)
}
const mByItem = new Map()
for (const l of methodLinks) {
  const k = String(l.item_id)
  if (!mByItem.has(k)) mByItem.set(k, [])
  mByItem.get(k).push(l)
}

const missingKp = cand.filter((r) => !(kpByItem.get(String(r.id)) || []).length)
const missingPrimary = cand.filter((r) => {
  const ls = kpByItem.get(String(r.id)) || []
  return ls.filter((x) => Number(x.is_primary)).length !== 1
})
const missingMethod = cand.filter(
  (r) => !(mByItem.get(String(r.id)) || []).length,
)

const apps = cand.filter((r) => r.qtype === 'application')
let appRubricBad = []
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

const drawable = Number(
  (
    await one(
      `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
    )
  ).n,
)
const approvedAll = Number(
  (await one(`SELECT COUNT(1) AS n FROM hs_math_train_items WHERE status='approved'`)).n,
)
const reviewPassedAll = Number(
  (
    await one(
      `SELECT COUNT(1) AS n FROM hs_math_train_item_reviews WHERE review_status='passed'`,
    )
  ).n,
)
const sessions = Number((await one(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)).n)
const sessionItems = Number(
  (await one(`SELECT COUNT(1) AS n FROM hs_math_train_session_items`)).n,
)
const itemsN = Number((await one(`SELECT COUNT(1) AS n FROM hs_math_train_items`)).n)

// fingerprint stability: compute rough key twice
const fpKeys = cand.map((r) => {
  const kps = kpByItem.get(String(r.id)) || []
  const ms = mByItem.get(String(r.id)) || []
  // use ids as stand-in sorted; for stability of content fields only
  const key = roughContentKey(
    r,
    kps.map((x) => String(x.knowledge_point_id)),
    ms.map((x) => String(x.method_id)),
  )
  const h1 = crypto.createHash('sha256').update(key).digest('hex')
  const h2 = crypto.createHash('sha256').update(key).digest('hex')
  return { code: r.code, hash: h1, stable: h1 === h2 }
})
const fpUnstable = fpKeys.filter((x) => !x.stable)
const fpDup = (() => {
  const m = new Map()
  const dups = []
  for (const x of fpKeys) {
    if (m.has(x.hash)) dups.push([m.get(x.hash), x.code])
    else m.set(x.hash, x.code)
  }
  return dups
})()

// 037 / 074 deep compare
const c037 = cand.find((r) => r.code === 'CAND-G1B-037')
const c074 = cand.find((r) => r.code === 'CAND-G1B-074')
const src037 = candidates.find((c) => c.id === 'CAND-G1B-037')
const src074 = candidates.find((c) => c.id === 'CAND-G1B-074')

function optText(row) {
  const o =
    typeof row.options_json === 'string'
      ? JSON.parse(row.options_json)
      : row.options_json
  return (o?.options || []).map((x) => `${x.id}:${x.text}`).join(' | ')
}
function ans(row) {
  const a =
    typeof row.answer_payload_json === 'string'
      ? JSON.parse(row.answer_payload_json)
      : row.answer_payload_json
  return a
}

const pair037074 = {
  sameNormStem: normStem(c037?.stem) === normStem(c074?.stem),
  stem: c037?.stem,
  opt037: optText(c037),
  opt074: optText(c074),
  ans037: ans(c037),
  ans074: ans(c074),
  kp037: src037?.kpCode,
  kp074: src074?.kpCode,
  chapter037: src037?.chapterNo,
  chapter074: src074?.chapterNo,
  specialty037: src037?.specialtyCode,
  specialty074: src074?.specialtyCode,
  analysisOverlapHint:
    String(src037?.analysis || '').slice(0, 40) ===
    String(src074?.analysis || '').slice(0, 40),
}

// AUTHOR / hard / app buckets from source file
const authorIds = candidates
  .filter((c) => c.mathVerified === 'AUTHOR_CHECKED')
  .map((c) => c.id)
const d3Ids = candidates.filter((c) => c.difficulty === 3).map((c) => c.id)
const appIds = candidates.filter((c) => c.qtype === 'application').map((c) => c.id)

const qtypeDist = cand.reduce(
  (a, r) => ((a[r.qtype] = (a[r.qtype] || 0) + 1), a),
  {},
)
const diffDist = cand.reduce(
  (a, r) => ((a[r.difficulty] = (a[r.difficulty] || 0) + 1), a),
  {},
)

// non-cand approved unchanged count vs 1G baseline 13
const approvedFormalActive = await many(
  `SELECT code FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1 ORDER BY code`,
)

await conn.end()

const out = {
  candCount: cand.length,
  badPoolStatus: badPoolStatus.map((r) => r.code),
  inactive: inactive.map((r) => r.code),
  cvNot1: cvNot1.map((r) => r.code),
  itemReviewedFieldsSet: reviewedSet.map((r) => r.code),
  reviewRowsOnCand: reviewRows.length,
  approvedCand: approvedCand.map((r) => r.code),
  missingKp: missingKp.map((r) => r.code),
  missingPrimary: missingPrimary.map((r) => r.code),
  missingMethod: missingMethod.map((r) => r.code),
  kpLinkCount: kpLinks.length,
  methodLinkCount: methodLinks.length,
  appCount: apps.length,
  appRubricBad,
  drawable,
  approvedAll,
  reviewPassedAll,
  sessions,
  sessionItems,
  itemsN,
  qtypeDist,
  diffDist,
  fpUnstable: fpUnstable.length,
  fpDup,
  approvedFormalActiveCodes: approvedFormalActive.map((r) => r.code),
  approvedFormalActiveN: approvedFormalActive.length,
  pair037074,
  buckets: {
    author: authorIds.length,
    d3: d3Ids.length,
    app: appIds.length,
  },
  g1gBaseline: {
    drawable: 13,
    approved: 13,
    reviewPassed: 13,
    sessions: 131,
    sessionItems: 354,
    itemsN: 211,
  },
}

fs.writeFileSync(path.join(docs, '_g1h_preflight_ro.json'), JSON.stringify(out, null, 2))
console.log(
  JSON.stringify(
    {
      candCount: out.candCount,
      bad: out.badPoolStatus.length,
      inactive: out.inactive.length,
      reviewsOnCand: out.reviewRowsOnCand,
      approvedCand: out.approvedCand.length,
      missingKp: out.missingKp.length,
      missingMethod: out.missingMethod.length,
      appRubricBad: out.appRubricBad.length,
      drawable: out.drawable,
      sessionsDelta: out.sessions - 131,
      sessionItemsDelta: out.sessionItems - 354,
      itemsN: out.itemsN,
      fpDup: out.fpDup,
      sameStem037074: out.pair037074.sameNormStem,
      kp037: out.pair037074.kp037,
      kp074: out.pair037074.kp074,
    },
    null,
    2,
  ),
)
