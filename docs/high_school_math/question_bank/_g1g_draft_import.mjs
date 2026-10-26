/**
 * GLOBAL-1G authorized draft import runner.
 * Contains local DB/API usage — DO NOT commit this file.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'
import { adaptAllCandidates } from './_g1g_adapt_candidates.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const docs = path.resolve(__dirname, '..')
const backupDir = path.join(docs, '_backups')
fs.mkdirSync(backupDir, { recursive: true })

const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

const report = {
  phase: 'HS-MATH-BANK-GLOBAL-1G',
  authorized: true,
  startedAt: new Date().toISOString(),
  decision: null,
  candidateSha256: null,
  adaptedSha256: null,
  backup: {},
  pre: {},
  preview: {},
  confirm: {},
  post: {},
  warnings037074: {},
  errors: [],
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
    JSON.stringify({ sub, role, iat: now, exp: now + 3600 }),
  ).toString('base64url')
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url')
  return `${header}.${body}.${sig}`
}

async function api(method, urlPath, token, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text.slice(0, 500) }
  }
  return { status: res.status, json }
}

function dataOf(json) {
  if (json?.success === true && json.data !== undefined) return json.data
  return json
}

function sha256File(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
}

function sha256Text(t) {
  return crypto.createHash('sha256').update(t).digest('hex')
}

function dumpMeta(filePath) {
  const st = fs.statSync(filePath)
  return {
    path: filePath,
    bytes: st.size,
    mtime: st.mtime.toISOString(),
    sha256: sha256File(filePath),
    nonEmpty: st.size > 0,
    readableHead: fs.readFileSync(filePath, 'utf8').slice(0, 80),
  }
}

function normStem(s) {
  return String(s || '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

function finish(code) {
  report.endedAt = new Date().toISOString()
  const out = path.join(docs, '_g1g_import_result.json')
  fs.writeFileSync(out, JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ decision: report.decision, errors: report.errors, out }, null, 2))
  process.exit(code)
}

const candPath = path.join(__dirname, 'candidates-g1b-100.mjs')
report.candidateSha256 = sha256File(candPath)

let items
try {
  items = adaptAllCandidates()
} catch (e) {
  report.decision = 'BLOCKED'
  report.errors.push(`adapt_fail:${e.message}`)
  finish(2)
}

const adaptedJson = JSON.stringify(items)
report.adaptedSha256 = sha256Text(adaptedJson)
fs.writeFileSync(path.join(docs, '_g1g_adapted_items.json'), adaptedJson)

// distributions
report.pre.adapt = {
  n: items.length,
  qtype: items.reduce((a, i) => ((a[i.qtype] = (a[i.qtype] || 0) + 1), a), {}),
  difficulty: items.reduce(
    (a, i) => ((a[i.difficulty] = (a[i.difficulty] || 0) + 1), a),
    {},
  ),
  codesUnique: new Set(items.map((i) => i.code)).size === 100,
}

const c037 = items.find((i) => i.code === 'CAND-G1B-037')
const c074 = items.find((i) => i.code === 'CAND-G1B-074')
report.warnings037074 = {
  sameNormStem: normStem(c037?.stem) === normStem(c074?.stem),
  stem037: c037?.stem,
  stem074: c074?.stem,
  answer037: c037?.answerPayload,
  answer074: c074?.answerPayload,
  note: '短题干相同但选项/知识点/答案不同；导入 BATCH_STEM_DUP 仅为 warning',
}

const env = loadEnv()
if (!env.JWT_SECRET) {
  report.decision = 'BLOCKED'
  report.errors.push('JWT_SECRET missing')
  finish(2)
}

const db = {
  host: env.DB_HOST || '127.0.0.1',
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER || 'study_user',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'study_system',
  charset: 'utf8mb4',
}

if (db.database !== 'study_system') {
  report.decision = 'BLOCKED'
  report.errors.push(`unexpected DB_NAME=${db.database}`)
  finish(2)
}

const conn = await createConnection(db)
async function one(sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows[0]
}
async function many(sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows
}

const codes = items.map((i) => i.code)
const hit = Number(
  (await one(`SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-G1B-%'`))
    .n,
)
const exact = await many(
  `SELECT code FROM hs_math_train_items WHERE code IN (${codes.map(() => '?').join(',')})`,
  codes,
)
const drawable = Number(
  (
    await one(
      `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
    )
  ).n,
)
const approved = Number(
  (await one(`SELECT COUNT(1) AS n FROM hs_math_train_items WHERE status='approved'`)).n,
)
let reviewPassed = 0
try {
  reviewPassed = Number(
    (
      await one(
        `SELECT COUNT(1) AS n FROM hs_math_train_item_reviews WHERE review_status='passed'`,
      )
    ).n,
  )
} catch {
  reviewPassed = -1
}
const sessions = Number(
  (await one(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)).n,
)
const sessionItems = Number(
  (await one(`SELECT COUNT(1) AS n FROM hs_math_train_session_items`)).n,
)
const itemsN = Number((await one(`SELECT COUNT(1) AS n FROM hs_math_train_items`)).n)

report.pre.db = {
  hitCandPrefix: hit,
  exactCodeHits: exact.length,
  drawable,
  approved,
  reviewPassed,
  sessions,
  sessionItems,
  itemsN,
}

if (hit !== 0 || exact.length !== 0) {
  report.decision = 'BLOCKED'
  report.errors.push('code collision before import')
  await conn.end()
  finish(2)
}
if (drawable !== 13) {
  report.decision = 'BLOCKED'
  report.errors.push(`drawable changed from 13 to ${drawable}`)
  await conn.end()
  finish(2)
}

// KP/method/category quick check
const kpCodes = [...new Set(items.map((i) => i.primaryKnowledgePointCode))]
const kps = await many(
  `SELECT code FROM hs_math_knowledge_points WHERE is_active=1 AND code IN (${kpCodes
    .map(() => '?')
    .join(',')})`,
  kpCodes,
)
if (kps.length !== kpCodes.length) {
  report.decision = 'BLOCKED'
  report.errors.push('KP missing/inactive')
  await conn.end()
  finish(2)
}
const methodCodes = [...new Set(items.flatMap((i) => i.methodCodes || []))]
const methods = await many(
  `SELECT code FROM hs_math_methods WHERE is_active=1 AND code IN (${methodCodes
    .map(() => '?')
    .join(',')})`,
  methodCodes,
)
if (methods.length !== methodCodes.length) {
  report.decision = 'BLOCKED'
  report.errors.push('method missing/inactive')
  await conn.end()
  finish(2)
}

// Backup
const tables = [
  'hs_math_train_items',
  'hs_math_train_item_kps',
  'hs_math_train_item_methods',
  'hs_math_train_item_reviews',
]
const commonDump = [
  `-h${db.host}`,
  `-P${db.port}`,
  `-u${db.user}`,
  `--password=${db.password}`,
  '--default-character-set=utf8mb4',
  '--single-transaction',
  '--routines=false',
  '--triggers=false',
  db.database,
]
try {
  for (const t of tables) {
    const fp = path.join(backupDir, `g1g_${t}_${stamp}.sql`)
    const out = execFileSync('mysqldump', [...commonDump, t], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    })
    fs.writeFileSync(fp, out)
    report.backup[t] = dumpMeta(fp)
    if (!report.backup[t].nonEmpty) throw new Error(`empty backup ${t}`)
  }
} catch (e) {
  report.decision = 'BLOCKED'
  report.errors.push(`backup_fail:${e.message}`)
  await conn.end()
  finish(2)
}

const [admins] = await conn.query(
  `SELECT id FROM users WHERE role='ADMIN' ORDER BY id ASC LIMIT 1`,
)
if (!admins.length) {
  report.decision = 'BLOCKED'
  report.errors.push('no ADMIN user')
  await conn.end()
  finish(2)
}
const adminToken = signJwt(String(admins[0].id), 'ADMIN', env.JWT_SECRET)
await conn.end()

// Preview
const prev = await api('POST', '/hs-math/admin/train-items/import/preview', adminToken, {
  items,
})
const prevData = dataOf(prev.json)
report.preview = {
  httpStatus: prev.status,
  canConfirm: prevData?.canConfirm,
  itemCount: prevData?.itemCount,
  errorCount: prevData?.errorCount,
  warningCount: prevData?.warningCount,
  expiresAt: prevData?.expiresAt,
  hasToken: Boolean(prevData?.previewToken),
  // content hash is inside token; also store item-level errors summary
  failedItems: (prevData?.items || [])
    .filter((r) => !r.ok || (r.errors || []).length)
    .map((r) => ({ code: r.code, errors: r.errors, warnings: r.warnings })),
  warnItems: (prevData?.items || [])
    .filter((r) => (r.warnings || []).length)
    .map((r) => ({
      code: r.code,
      warnings: r.warnings.map((w) => ({ code: w.code, message: w.message })),
    })),
}

if (
  prev.status !== 200 &&
  prev.status !== 201
) {
  report.decision = 'BLOCKED'
  report.errors.push(`preview_http_${prev.status}`)
  finish(2)
}
if (!prevData?.canConfirm || prevData.errorCount !== 0 || prevData.itemCount !== 100) {
  report.decision = 'BLOCKED'
  report.errors.push('preview_not_clean')
  finish(2)
}
if (!prevData.previewToken) {
  report.decision = 'BLOCKED'
  report.errors.push('no_preview_token')
  finish(2)
}

// Confirm
const conf = await api('POST', '/hs-math/admin/train-items/import/confirm', adminToken, {
  previewToken: prevData.previewToken,
  items,
})
const confData = dataOf(conf.json)
report.confirm = {
  httpStatus: conf.status,
  success: confData?.success,
  mode: confData?.mode,
  successCount: confData?.successCount,
  failCount: confData?.failCount,
  notice: confData?.notice,
  itemSample: (confData?.items || []).slice(0, 3),
  itemCountReturned: (confData?.items || []).length,
}

if (
  conf.status >= 400 ||
  !confData?.success ||
  confData.successCount !== 100 ||
  confData.mode !== 'created'
) {
  report.decision = confData?.mode === 'idempotent' ? 'PARTIAL' : 'BLOCKED'
  report.errors.push(`confirm_unexpected:${JSON.stringify({ status: conf.status, mode: confData?.mode, successCount: confData?.successCount })}`)
  // still run postcheck
}

// Independent connection verify
const conn2 = await createConnection(db)
async function one2(sql, params = []) {
  const [rows] = await conn2.query(sql, params)
  return rows[0]
}
async function many2(sql, params = []) {
  const [rows] = await conn2.query(sql, params)
  return rows
}

const candRows = await many2(
  `SELECT code, status, pool, is_active, qtype, difficulty, id
   FROM hs_math_train_items WHERE code LIKE 'CAND-G1B-%' ORDER BY code`,
)
const badStatus = candRows.filter(
  (r) => r.status !== 'draft' || r.pool !== 'formal',
)
const approvedNow = Number(
  (await one2(`SELECT COUNT(1) AS n FROM hs_math_train_items WHERE status='approved'`)).n,
)
const drawableNow = Number(
  (
    await one2(
      `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
    )
  ).n,
)
let reviewPassedNow = -1
try {
  reviewPassedNow = Number(
    (
      await one2(
        `SELECT COUNT(1) AS n FROM hs_math_train_item_reviews WHERE review_status='passed'`,
      )
    ).n,
  )
} catch {
  /* ignore */
}
const sessionsNow = Number(
  (await one2(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)).n,
)
const sessionItemsNow = Number(
  (await one2(`SELECT COUNT(1) AS n FROM hs_math_train_session_items`)).n,
)
const itemsNow = Number((await one2(`SELECT COUNT(1) AS n FROM hs_math_train_items`)).n)

const ids = candRows.map((r) => r.id)
let kpLinks = 0
let methodLinks = 0
let appRubricOk = 0
let appCount = 0
if (ids.length) {
  kpLinks = Number(
    (
      await one2(
        `SELECT COUNT(1) AS n FROM hs_math_train_item_kps WHERE item_id IN (${ids
          .map(() => '?')
          .join(',')})`,
        ids,
      )
    ).n,
  )
  methodLinks = Number(
    (
      await one2(
        `SELECT COUNT(1) AS n FROM hs_math_train_item_methods WHERE item_id IN (${ids
          .map(() => '?')
          .join(',')})`,
        ids,
      )
    ).n,
  )
  const apps = await many2(
    `SELECT code, answer_payload_json FROM hs_math_train_items
     WHERE code LIKE 'CAND-G1B-%' AND qtype='application'`,
  )
  appCount = apps.length
  for (const a of apps) {
    const p =
      typeof a.answer_payload_json === 'string'
        ? JSON.parse(a.answer_payload_json)
        : a.answer_payload_json
    const sum = (p.rubric || []).reduce((s, x) => s + Number(x.maxScore), 0)
    if (
      p.kind === 'application' &&
      sum === Number(p.maxScore) &&
      (p.rubric || []).every((x) => x.criteria && x.maxScore > 0)
    ) {
      appRubricOk++
    }
  }
}

const qtypeDist = candRows.reduce(
  (a, r) => ((a[r.qtype] = (a[r.qtype] || 0) + 1), a),
  {},
)
const diffDist = candRows.reduce(
  (a, r) => ((a[r.difficulty] = (a[r.difficulty] || 0) + 1), a),
  {},
)

report.post = {
  candCount: candRows.length,
  badStatus: badStatus.map((r) => r.code),
  approvedDelta: approvedNow - report.pre.db.approved,
  reviewPassedDelta:
    reviewPassedNow >= 0 && report.pre.db.reviewPassed >= 0
      ? reviewPassedNow - report.pre.db.reviewPassed
      : null,
  drawableNow,
  sessionsDelta: sessionsNow - report.pre.db.sessions,
  sessionItemsDelta: sessionItemsNow - report.pre.db.sessionItems,
  itemsDelta: itemsNow - report.pre.db.itemsN,
  kpLinks,
  methodLinks,
  appCount,
  appRubricOk,
  qtypeDist,
  diffDist,
  expectedMethodLinks: items.reduce((s, i) => s + (i.methodCodes?.length || 0), 0),
}

await conn2.end()

const pass =
  report.confirm.mode === 'created' &&
  report.confirm.successCount === 100 &&
  report.post.candCount === 100 &&
  report.post.badStatus.length === 0 &&
  report.post.approvedDelta === 0 &&
  report.post.drawableNow === 13 &&
  report.post.sessionsDelta === 0 &&
  report.post.sessionItemsDelta === 0 &&
  report.post.itemsDelta === 100 &&
  report.post.kpLinks === 100 &&
  report.post.methodLinks === report.post.expectedMethodLinks &&
  report.post.appCount === 24 &&
  report.post.appRubricOk === 24 &&
  report.post.diffDist['1'] === 35 &&
  report.post.diffDist['2'] === 40 &&
  report.post.diffDist['3'] === 25 &&
  (report.post.reviewPassedDelta === 0 || report.post.reviewPassedDelta === null)

if (pass) {
  report.decision = 'DRAFT_IMPORT_PASS'
  finish(0)
}

if (!report.decision) report.decision = 'PARTIAL'
if (!report.errors.length) report.errors.push('postcheck_mismatch')
finish(1)
