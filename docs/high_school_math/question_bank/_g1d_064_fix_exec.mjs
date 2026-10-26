/**
 * DIAGRAM-1D-064-FIX-EXEC: PATCH stem only for item 215 via Admin API.
 * No review/approve. No SQL write of stem. DO NOT commit.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const docs = path.resolve(__dirname, '..')
const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'
const ITEM_ID = '215'
const CODE = 'CAND-G1B-064'

const OLD_STEM =
  '塔高测量：距塔底 $40\\text{m}$ 处测得顶角 $30^\\circ$，求塔高（精确值）。'
const NEW_STEM =
  '塔高测量：距塔底 $40\\text{m}$ 处测得塔顶的仰角为 $30^\\circ$，求塔高（精确值）。'

const report = {
  phase: 'HS-MATH-BANK-DIAGRAM-1D-064-FIX-EXEC',
  startedAt: new Date().toISOString(),
  endedAt: null,
  status: 'IN_PROGRESS',
  base: BASE,
  itemId: ITEM_ID,
  code: CODE,
  pre: null,
  patch: null,
  post: null,
  blockers: [],
  notes: [],
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

async function api(method, urlPath, token, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
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

function dataOf(json) {
  if (json?.success === true && json.data !== undefined) return json.data
  return json
}

function parseJson(v) {
  if (v == null) return null
  if (typeof v === 'object') return v
  try {
    return JSON.parse(v)
  } catch {
    return v
  }
}

async function loadItem(conn) {
  const [[it]] = await conn.query(
    `SELECT id, code, stem, options_json, answer_payload_json, analysis,
            difficulty, content_version, status, pool, is_active, qtype,
            reviewed_at, reviewed_by
     FROM hs_math_train_items WHERE id = ? AND code = ?`,
    [ITEM_ID, CODE],
  )
  if (!it) return null
  const [kps] = await conn.query(
    `SELECT k.code FROM hs_math_train_item_kps ik
     JOIN hs_math_knowledge_points k ON k.id = ik.knowledge_point_id
     WHERE ik.item_id = ? ORDER BY ik.sort_order, k.id`,
    [ITEM_ID],
  )
  const [methods] = await conn.query(
    `SELECT m.code FROM hs_math_train_item_methods im
     JOIN hs_math_methods m ON m.id = im.method_id
     WHERE im.item_id = ? ORDER BY im.sort_order, m.id`,
    [ITEM_ID],
  )
  const [reviews] = await conn.query(
    `SELECT id, content_version, content_fingerprint, review_status, reviewed_at
     FROM hs_math_train_item_reviews WHERE item_id = ?
     ORDER BY id DESC LIMIT 3`,
    [ITEM_ID],
  )
  const [[drawable]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_items
     WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  const [[itemsTotal]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_items`,
  )
  return {
    id: String(it.id),
    code: it.code,
    stem: it.stem,
    options: parseJson(it.options_json),
    answer: parseJson(it.answer_payload_json),
    analysis: it.analysis,
    difficulty: it.difficulty,
    content_version: Number(it.content_version),
    status: it.status,
    pool: it.pool,
    is_active: it.is_active,
    qtype: it.qtype,
    reviewed_at: it.reviewed_at,
    reviewed_by: it.reviewed_by,
    kps: kps.map((x) => x.code),
    methods: methods.map((x) => x.code),
    reviews,
    drawable: Number(drawable.n),
    itemsTotal: Number(itemsTotal.n),
  }
}

function stable(v) {
  return JSON.stringify(v)
}

// sanity on NEW_STEM
if (NEW_STEM.includes('顶角')) {
  report.blockers.push('NEW_STEM still contains 顶角')
}
if (!NEW_STEM.includes('塔顶的仰角为')) {
  report.blockers.push('NEW_STEM missing 塔顶的仰角为')
}
if (/仰角为为/.test(NEW_STEM)) {
  report.blockers.push('duplicate 为 in NEW_STEM')
}
if (NEW_STEM === OLD_STEM) {
  report.blockers.push('NEW_STEM equals OLD_STEM')
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

try {
  const pre = await loadItem(conn)
  report.pre = {
    ...pre,
    answerStable: pre ? stable(pre.answer) : null,
    analysisSha: pre
      ? crypto.createHash('sha256').update(String(pre.analysis || '')).digest('hex')
      : null,
  }

  if (!pre) report.blockers.push('item 215 / CAND-G1B-064 not found')
  else {
    if (pre.status !== 'approved') report.blockers.push(`status=${pre.status}`)
    if (pre.content_version !== 1) report.blockers.push(`cv=${pre.content_version}`)
    if (!String(pre.stem).includes('顶角')) report.blockers.push('stem missing 顶角')
    if (String(pre.stem).includes('塔顶的仰角')) {
      report.blockers.push('stem already revised')
    }
    // Allow whitespace-normalized compare
    if (pre.stem !== OLD_STEM) {
      report.notes.push({
        type: 'stem_literal_diff_vs_expected_old',
        dbStem: pre.stem,
        expectedOld: OLD_STEM,
      })
      // still OK if contains 顶角 and not yet 仰角修订 — use DB stem as base
    }
  }

  if (report.blockers.length) {
    report.status = 'BLOCKED'
    report.endedAt = new Date().toISOString()
    fs.writeFileSync(
      path.join(docs, '_g1d_064_fix_exec_result.json'),
      JSON.stringify(report, null, 2),
    )
    console.log(JSON.stringify(report, null, 2))
    await conn.end()
    process.exit(2)
  }

  // Build new stem from DB stem by exact replace of the known phrase
  let newStem = pre.stem.replace('测得顶角', '测得塔顶的仰角为')
  if (newStem === pre.stem) {
    // fallback: replace 顶角 alone once in the angle phrase
    newStem = pre.stem.replace('顶角 $30', '塔顶的仰角为 $30')
  }
  if (newStem === pre.stem || newStem.includes('顶角') || /仰角为为/.test(newStem)) {
    report.blockers.push(`failed to derive clean new stem from DB: ${newStem}`)
    report.status = 'BLOCKED'
    report.endedAt = new Date().toISOString()
    fs.writeFileSync(
      path.join(docs, '_g1d_064_fix_exec_result.json'),
      JSON.stringify(report, null, 2),
    )
    console.log(JSON.stringify(report, null, 2))
    await conn.end()
    process.exit(2)
  }
  report.derivedNewStem = newStem

  const [[admin]] = await conn.query(
    `SELECT id, role FROM users WHERE id = 2 OR role = 'ADMIN' ORDER BY id ASC LIMIT 1`,
  )
  if (!admin || String(admin.role).toUpperCase() !== 'ADMIN') {
    report.blockers.push('no ADMIN user for JWT')
    report.status = 'BLOCKED'
    report.endedAt = new Date().toISOString()
    fs.writeFileSync(
      path.join(docs, '_g1d_064_fix_exec_result.json'),
      JSON.stringify(report, null, 2),
    )
    console.log(JSON.stringify(report, null, 2))
    await conn.end()
    process.exit(2)
  }

  const token = signJwt(String(admin.id), 'ADMIN', env.JWT_SECRET)
  report.adminUserId = String(admin.id)

  // optional pre review-panel for fingerprint hint
  const panelPre = await api(
    'GET',
    `/hs-math/admin/train-items/${ITEM_ID}/review-panel`,
    token,
  )
  report.pre.reviewPanelStatus = panelPre.status
  report.pre.reviewPanelFingerprint =
    dataOf(panelPre.json)?.contentFingerprint ||
    dataOf(panelPre.json)?.fingerprint ||
    null

  const body = {
    stem: newStem,
    expectedContentVersion: 1,
  }
  report.patch = {
    requestBodyKeys: Object.keys(body),
    requestStem: newStem,
    expectedContentVersion: 1,
  }

  const t0 = Date.now()
  const res = await api(
    'PATCH',
    `/hs-math/admin/train-items/${ITEM_ID}`,
    token,
    body,
  )
  report.patch.httpStatus = res.status
  report.patch.ms = Date.now() - t0
  const view = dataOf(res.json)
  report.patch.response = {
    id: view?.id,
    code: view?.code,
    status: view?.status,
    contentVersion: view?.contentVersion ?? view?.content_version,
    stem: view?.stem,
    // omit huge fields echo if identical
  }
  report.patch.rawSuccess = res.json?.success

  if (res.status >= 400 || report.patch.response.status !== 'draft') {
    report.blockers.push(
      `PATCH failed or unexpected status: http=${res.status} status=${report.patch.response.status}`,
    )
    report.patch.errorBody = res.json
    report.status = 'BLOCKED'
    report.endedAt = new Date().toISOString()
    fs.writeFileSync(
      path.join(docs, '_g1d_064_fix_exec_result.json'),
      JSON.stringify(report, null, 2),
    )
    console.log(JSON.stringify(report, null, 2))
    await conn.end()
    process.exit(3)
  }

  const post = await loadItem(conn)
  const panelPost = await api(
    'GET',
    `/hs-math/admin/train-items/${ITEM_ID}/review-panel`,
    token,
  )
  const postFp =
    dataOf(panelPost.json)?.contentFingerprint ||
    dataOf(panelPost.json)?.fingerprint ||
    null

  const oldReview = post.reviews?.[0]
  const staleOk =
    oldReview &&
    Number(oldReview.content_version) === 1 &&
    Number(post.content_version) === 2 &&
    (!postFp || String(oldReview.content_fingerprint) !== String(postFp))

  report.post = {
    ...post,
    answerStable: stable(post.answer),
    analysisSha: crypto
      .createHash('sha256')
      .update(String(post.analysis || ''))
      .digest('hex'),
    reviewPanelFingerprint: postFp,
    reviewPanelStatus: panelPost.status,
    answerUnchanged: stable(post.answer) === report.pre.answerStable,
    analysisUnchanged: report.pre.analysisSha === crypto
      .createHash('sha256')
      .update(String(post.analysis || ''))
      .digest('hex'),
    difficultyUnchanged: post.difficulty === pre.difficulty,
    kpsUnchanged: stable(post.kps) === stable(pre.kps),
    methodsUnchanged: stable(post.methods) === stable(pre.methods),
    stemHasDingjiao: String(post.stem).includes('顶角'),
    stemHasYangjiao: String(post.stem).includes('塔顶的仰角为'),
    drawableDelta: { pre: pre.drawable, post: post.drawable },
    itemsTotalDelta: { pre: pre.itemsTotal, post: post.itemsTotal },
    oldReviewStaleForCv2: !!staleOk,
    oldReview: oldReview
      ? {
          id: oldReview.id,
          content_version: oldReview.content_version,
          review_status: oldReview.review_status,
          content_fingerprint: oldReview.content_fingerprint,
        }
      : null,
  }

  const postFlags = report.post
  if (post.status !== 'draft') report.blockers.push(`post status=${post.status}`)
  if (post.content_version !== 2) report.blockers.push(`post cv=${post.content_version}`)
  if (postFlags.stemHasDingjiao) report.blockers.push('post stem still has 顶角')
  if (!postFlags.stemHasYangjiao) report.blockers.push('post stem missing 塔顶的仰角为')
  if (!postFlags.answerUnchanged) report.blockers.push('answer changed')
  if (!postFlags.analysisUnchanged) report.blockers.push('analysis changed')
  if (!postFlags.difficultyUnchanged) report.blockers.push('difficulty changed')
  if (!postFlags.kpsUnchanged) report.blockers.push('kps changed')
  if (!postFlags.methodsUnchanged) report.blockers.push('methods changed')
  if (post.itemsTotal !== pre.itemsTotal) {
    report.blockers.push('itemsTotal changed unexpectedly')
  }
  if (!postFlags.oldReviewStaleForCv2) {
    report.notes.push({
      type: 'stale_check',
      detail: 'cv mismatch or fp compare inconclusive — verify manually',
      oldCv: oldReview?.content_version,
      postCv: post.content_version,
      oldFp: oldReview?.content_fingerprint,
      postFp,
    })
    if (!(oldReview && Number(oldReview.content_version) === 1 && post.content_version === 2)) {
      report.blockers.push('old review not clearly stale for cv2')
    }
  }

  report.status = report.blockers.length ? 'BLOCKED' : 'STEM_FIX_PASS'
  report.endedAt = new Date().toISOString()
} catch (e) {
  report.blockers.push(String(e?.stack || e))
  report.status = 'BLOCKED'
  report.endedAt = new Date().toISOString()
} finally {
  await conn.end()
}

fs.writeFileSync(
  path.join(docs, '_g1d_064_fix_exec_result.json'),
  JSON.stringify(report, null, 2),
)
console.log(JSON.stringify(report, null, 2))
process.exit(report.status === 'STEM_FIX_PASS' ? 0 : 1)
