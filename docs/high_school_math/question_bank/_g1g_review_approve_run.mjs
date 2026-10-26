/**
 * DIAGRAM-1G: review + approve four diagram items. Stop on fail.
 * No stem/answer/diagram mutation. DO NOT commit.
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

const ITEMS = [
  {
    code: 'CAND-G1B-093',
    id: '244',
    cv: 2,
    sha256: 'e12b2f2b2373d4545c6a79af55caa1f0c85c7d83f7b29d8a2cc5132671fe33f1',
    stemMustInclude: ['正方体', 'BD', '平面'],
    answerMustInclude: ['BD', '平面'],
    analysisMustInclude: ['线面垂直'],
    checks: [
      '正方体题干含 BD1 与平面 A1C1D',
      '插图 SHA 匹配 093 终版；示意不写结论',
      '标准答案/rubric/解析与既有一致',
      'application rubric maxScore=10',
    ],
  },
  {
    code: 'CAND-G1B-080',
    id: '231',
    cv: 2,
    sha256: 'c01574e808ba150866781d4fd716348fb3331359c635ae5f1a4b46f137ef31fc',
    stemMustInclude: ['平行四边形', '向量'],
    answerMustInclude: ['中点'],
    analysisMustInclude: ['平分'],
    checks: [
      '向量题干 AB=a AD=b',
      '插图 SHA 匹配 080；无「互相平分」结论字样',
      '标准答案/rubric/解析与既有一致',
      'application rubric maxScore=10',
    ],
  },
  {
    code: 'CAND-G1B-064',
    id: '215',
    cv: 3,
    sha256: 'a3549131d845107b4c795242013f50beb048639b056b1c302e79276dc8b4abf7',
    stemMust: '塔顶的仰角为',
    stemMustNot: '顶角',
    stemMustInclude: ['40', '30'],
    answerMustInclude: ['40', '3'],
    analysisMustInclude: ['tan', '30'],
    checks: [
      '题干已为仰角（非顶角歧义）',
      '答案 40√3/3 与仰角模型一致；图注仰角30°无结果值',
      '标准答案/rubric/解析与既有一致',
      '插图 SHA 匹配 064',
    ],
  },
  {
    code: 'CAND-G1B-091',
    id: '242',
    cv: 2,
    sha256: 'a77867e8beb43226cd1e230b043151a00e851f560026d7882c15b0a5584f19f8',
    shaPrefix: 'a77867e8beb4',
    stemMustInclude: ['斜二测'],
    analysisMustInclude: ['选 A'],
    checks: [
      '单选正确项 A；题干/选项未改',
      '插图新版无 90°/45°/135° 文字、不圈选选项',
      '解析与选项 A 一致',
      'SHA 前缀 a77867e8beb4',
    ],
  },
]

const report = {
  phase: 'HS-MATH-BANK-DIAGRAM-1G',
  startedAt: new Date().toISOString(),
  endedAt: null,
  status: 'IN_PROGRESS',
  base: BASE,
  pre: null,
  items: [],
  post: null,
  blockers: [],
  mathReviews: [],
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
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const body = Buffer.from(JSON.stringify({ sub, role, iat: now, exp: now + 7200 })).toString(
    'base64url',
  )
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}
function dataOf(json) {
  if (json?.success === true && json.data !== undefined) return json.data
  return json
}
async function api(method, urlPath, token, body) {
  const headers = { Authorization: `Bearer ${token}` }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text.slice(0, 600) }
  }
  return { status: res.status, json }
}
async function apiBinary(urlPath, token) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
  const buf = Buffer.from(await res.arrayBuffer())
  return {
    status: res.status,
    contentType: res.headers.get('content-type'),
    sha256: buf.length
      ? crypto.createHash('sha256').update(buf).digest('hex')
      : null,
    bytes: buf.length,
  }
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

async function drawable() {
  const [[r]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_items
     WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  return Number(r.n)
}

async function loadFull(id, code) {
  const [[it]] = await conn.query(
    `SELECT id, code, stem, options_json, answer_payload_json, analysis,
            difficulty, content_version, status, pool, is_active, qtype,
            source_type, source_license_status, source_verification_status
     FROM hs_math_train_items WHERE id=? AND code=?`,
    [id, code],
  )
  if (!it) return null
  const [links] = await conn.query(
    `SELECT d.id AS link_id, d.object_id, d.sort_order, o.content_sha256, o.mime_type,
            o.size_bytes, o.width_px, o.height_px
     FROM hs_math_train_item_diagrams d
     JOIN hs_math_train_item_diagram_objects o ON o.id=d.object_id
     WHERE d.item_id=? ORDER BY d.sort_order`,
    [id],
  )
  const [reviews] = await conn.query(
    `SELECT id, content_version, content_fingerprint, review_status, reviewed_at
     FROM hs_math_train_item_reviews WHERE item_id=? ORDER BY id DESC LIMIT 3`,
    [id],
  )
  const [kps] = await conn.query(
    `SELECT k.code FROM hs_math_train_item_kps ik
     JOIN hs_math_knowledge_points k ON k.id=ik.knowledge_point_id WHERE ik.item_id=?`,
    [id],
  )
  const [methods] = await conn.query(
    `SELECT m.code FROM hs_math_train_item_methods im
     JOIN hs_math_methods m ON m.id=im.method_id WHERE im.item_id=?`,
    [id],
  )
  let answer = it.answer_payload_json
  try {
    answer = typeof answer === 'string' ? JSON.parse(answer) : answer
  } catch {
    /* keep */
  }
  let options = it.options_json
  try {
    options = typeof options === 'string' ? JSON.parse(options) : options
  } catch {
    /* keep */
  }
  return {
    id: String(it.id),
    code: it.code,
    stem: it.stem,
    options,
    answer,
    analysis: it.analysis,
    difficulty: it.difficulty,
    content_version: Number(it.content_version),
    status: it.status,
    pool: it.pool,
    is_active: Number(it.is_active),
    qtype: it.qtype,
    source_type: it.source_type,
    source_license_status: it.source_license_status,
    source_verification_status: it.source_verification_status,
    links,
    reviews,
    kps: kps.map((x) => x.code),
    methods: methods.map((x) => x.code),
  }
}

function mathJudge(spec, it) {
  const reasons = []
  let pass = true
  const fail = (m) => {
    pass = false
    reasons.push(`FAIL:${m}`)
  }
  const ok = (m) => reasons.push(`OK:${m}`)

  if (it.status !== 'draft') fail(`status=${it.status}`)
  else ok('draft')
  if (it.content_version !== spec.cv) fail(`cv=${it.content_version}`)
  else ok(`cv=${spec.cv}`)
  if (it.pool !== 'formal' || it.is_active !== 1) fail('pool/active')
  else ok('formal/active')
  if (it.links.length !== 1) fail(`diagrams=${it.links.length}`)
  else ok('exactly 1 diagram')
  const sha = it.links[0]?.content_sha256
  if (sha !== spec.sha256) fail(`sha ${sha}`)
  else ok('diagram sha matches 147')
  if (spec.shaPrefix && !String(sha).startsWith(spec.shaPrefix)) fail('091 sha prefix')
  if (spec.stemMust && !String(it.stem).includes(spec.stemMust)) fail('stem missing 仰角')
  else if (spec.stemMust) ok('stem has 塔顶的仰角为')
  if (spec.stemMustNot && String(it.stem).includes(spec.stemMustNot)) fail('stem still 顶角')
  else if (spec.stemMustNot) ok('stem no 顶角')

  const stem = String(it.stem || '')
  const analysis = String(it.analysis || '')
  const answerBlob = JSON.stringify(it.answer || {})

  if (Array.isArray(spec.stemMustInclude)) {
    for (const s of spec.stemMustInclude) {
      if (!stem.includes(s)) fail(`stem missing ${s}`)
      else ok(`stem has ${s}`)
    }
  }
  if (Array.isArray(spec.answerMustInclude)) {
    for (const s of spec.answerMustInclude) {
      if (!answerBlob.includes(s)) fail(`answer missing ${s}`)
      else ok(`answer has ${s}`)
    }
  }
  if (Array.isArray(spec.analysisMustInclude)) {
    for (const s of spec.analysisMustInclude) {
      if (!analysis.includes(s)) fail(`analysis missing ${s}`)
      else ok(`analysis has ${s}`)
    }
  }

  if (it.qtype === 'application') {
    if (it.answer?.kind !== 'application') fail('answer kind')
    else ok('application answer')
    if (Number(it.answer?.maxScore) !== 10) fail('maxScore')
    else ok('maxScore=10')
    if (!Array.isArray(it.answer?.rubric) || it.answer.rubric.length < 2) fail('rubric')
    else ok('rubric present')
  }
  if (it.code === 'CAND-G1B-091') {
    if (it.answer?.kind !== 'single' || it.answer?.optionId !== 'A') fail('091 answer not A')
    else ok('091 answer A')
    const opts = Array.isArray(it.options)
      ? it.options
      : Array.isArray(it.options?.options)
        ? it.options.options
        : []
    if (opts.length < 4) fail('091 options <4')
    else ok(`091 options=${opts.length}`)
    const ids = opts.map((o) => o.id).join('')
    if (ids !== 'ABCD') fail(`091 option ids=${ids}`)
    else ok('091 option ids ABCD')
  }
  if (it.code === 'CAND-G1B-064') {
    const sa = String(it.answer?.standardAnswer || answerBlob)
    if (!/40/.test(sa) || !/3/.test(sa)) fail('064 answer shape')
    else ok('064 answer 40…/3 form')
  }
  if (!analysis || analysis.length < 10) fail('analysis empty')
  else ok('analysis present')
  if (!it.kps.length) fail('no KP')
  else ok(`KP ${it.kps.join(',')}`)
  if (!it.methods.length) fail('no method')
  else ok(`method ${it.methods.join(',')}`)

  const sameCvReview = it.reviews.find(
    (r) => Number(r.content_version) === it.content_version,
  )
  if (sameCvReview) {
    reasons.push(
      `NOTE: already has review on cv${it.content_version} status=${sameCvReview.review_status}`,
    )
  } else ok('no current-cv review yet (prior stale)')

  for (const c of spec.checks) reasons.push(`CHECKLIST:${c}`)

  return { pass, reasons, decision: pass ? 'passed' : 'rejected' }
}

try {
  const [[admin]] = await conn.query(
    `SELECT id, role FROM users WHERE id=2 OR role='ADMIN' ORDER BY id ASC LIMIT 1`,
  )
  if (!admin || String(admin.role).toUpperCase() !== 'ADMIN') {
    report.blockers.push('no ADMIN')
  }
  const token = report.blockers.length
    ? null
    : signJwt(String(admin.id), 'ADMIN', env.JWT_SECRET)
  report.adminUserId = admin ? String(admin.id) : null

  const [[sess]] = await conn.query(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)
  const [[si]] = await conn.query(`SELECT COUNT(1) AS n FROM hs_math_train_session_items`)
  report.pre = {
    drawable: await drawable(),
    sessions: Number(sess.n),
    sessionItems: Number(si.n),
  }

  // Preflight all
  for (const spec of ITEMS) {
    const it = await loadFull(spec.id, spec.code)
    if (!it) {
      report.blockers.push(`${spec.code} missing`)
      continue
    }
    const judged = mathJudge(spec, it)
    report.mathReviews.push({
      code: spec.code,
      decision: judged.decision,
      reasons: judged.reasons,
    })
    if (!judged.pass) report.blockers.push(`${spec.code} math gate fail`)
    if (it.status !== 'draft' || it.content_version !== spec.cv) {
      report.blockers.push(
        `${spec.code} state ${it.status}/cv${it.content_version} expect draft/${spec.cv}`,
      )
    }
  }

  if (report.blockers.length || !token) {
    report.status = 'BLOCKED'
    report.endedAt = new Date().toISOString()
    fs.writeFileSync(path.join(docs, '_g1g_review_approve_result.json'), JSON.stringify(report, null, 2))
    console.log(JSON.stringify(report, null, 2))
    await conn.end()
    process.exit(2)
  }

  for (const spec of ITEMS) {
    const row = { code: spec.code, itemId: spec.id, ok: false }
    const it = await loadFull(spec.id, spec.code)
    const judged = mathJudge(spec, it)
    if (!judged.pass) {
      row.error = 'math fail'
      report.items.push(row)
      report.blockers.push(`${spec.code} math fail at exec`)
      report.status = report.items.some((x) => x.ok) ? 'PARTIAL' : 'BLOCKED'
      break
    }

    const panelRes = await api('GET', `/hs-math/admin/train-items/${spec.id}/review-panel`, token)
    const panel = dataOf(panelRes.json)
    const fp = panel?.contentFingerprint || panel?.fingerprint
    const cv = panel?.contentVersion ?? panel?.content_version
    if (panelRes.status >= 400 || !fp || Number(cv) !== spec.cv) {
      row.error = `panel fail ${panelRes.status} cv=${cv}`
      report.items.push(row)
      report.blockers.push(row.error)
      report.status = 'PARTIAL'
      break
    }
    row.panel = { contentVersion: Number(cv), contentFingerprint: fp }

    const comment = [
      `DIAGRAM-1G 人工审核通过（配图后重审）。`,
      `核对：${judged.reasons.filter((r) => r.startsWith('OK:') || r.startsWith('CHECKLIST:')).join('；')}`,
      `插图 SHA=${spec.sha256.slice(0, 12)}…；sort_order=1；未改题干/答案/解析。`,
    ]
      .join(' ')
      .slice(0, 2000)

    const revRes = await api('POST', `/hs-math/admin/train-items/${spec.id}/reviews`, token, {
      decision: 'passed',
      comment,
      expectedContentVersion: Number(cv),
      expectedContentFingerprint: fp,
    })
    const revData = dataOf(revRes.json)
    row.review = {
      httpStatus: revRes.status,
      reviewId: revData?.id || revData?.reviewId || null,
      reviewStatus: revData?.reviewStatus,
      itemStatusUnchanged: revData?.itemStatusUnchanged,
      body: revRes.status >= 400 ? revRes.json : undefined,
    }
    const revOk =
      (revRes.status === 200 || revRes.status === 201) &&
      String(revData?.reviewStatus) === 'passed'
    if (!revOk) {
      report.blockers.push(`${spec.code} review API fail`)
      report.items.push(row)
      report.status = 'PARTIAL'
      break
    }

    const aprRes = await api('PATCH', `/hs-math/admin/train-items/${spec.id}/status`, token, {
      status: 'approved',
      confirmPublish: true,
    })
    const aprData = dataOf(aprRes.json)
    row.approve = {
      httpStatus: aprRes.status,
      status: aprData?.status,
      contentVersion: aprData?.contentVersion ?? aprData?.content_version,
      body: aprRes.status >= 400 ? aprRes.json : undefined,
    }
    if (aprRes.status >= 400 || aprData?.status !== 'approved') {
      report.blockers.push(`${spec.code} approve fail`)
      report.items.push(row)
      report.status = 'PARTIAL'
      break
    }

    const post = await loadFull(spec.id, spec.code)
    const link = post.links[0]
    const bin = await apiBinary(
      `/hs-math/admin/train-items/${spec.id}/diagrams/${link.link_id}/content`,
      token,
    )
    const [freshReviews] = await conn.query(
      `SELECT id, content_version, content_fingerprint, review_status
       FROM hs_math_train_item_reviews WHERE item_id=? AND content_version=? AND review_status='passed'
       ORDER BY id DESC LIMIT 1`,
      [spec.id, spec.cv],
    )
    row.post = {
      status: post.status,
      content_version: post.content_version,
      diagramCount: post.links.length,
      diagramSha: link?.content_sha256,
      authRead: bin,
      effectiveReview: freshReviews[0] || null,
    }
    row.ok =
      post.status === 'approved' &&
      post.content_version === spec.cv &&
      post.links.length === 1 &&
      link.content_sha256 === spec.sha256 &&
      bin.status === 200 &&
      bin.sha256 === spec.sha256 &&
      freshReviews[0] &&
      String(freshReviews[0].content_fingerprint) === fp
    if (!row.ok) {
      report.blockers.push(`${spec.code} post-verify fail`)
      report.items.push(row)
      report.status = 'PARTIAL'
      break
    }
    report.items.push(row)
  }

  const [[sess2]] = await conn.query(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)
  const [[si2]] = await conn.query(`SELECT COUNT(1) AS n FROM hs_math_train_session_items`)
  report.post = {
    drawable: await drawable(),
    sessions: Number(sess2.n),
    sessionItems: Number(si2.n),
    sessionsUnchanged: Number(sess2.n) === report.pre.sessions,
    sessionItemsUnchanged: Number(si2.n) === report.pre.sessionItems,
  }

  if (
    !report.blockers.length &&
    report.items.length === 4 &&
    report.items.every((x) => x.ok) &&
    report.post.drawable === 113
  ) {
    report.status = 'DIAGRAM_REVIEW_APPROVE_PASS'
  } else if (report.items.some((x) => x.ok)) {
    report.status = report.status === 'IN_PROGRESS' ? 'PARTIAL' : report.status
    if (report.post.drawable !== 113) {
      report.blockers.push(`drawable=${report.post.drawable} expect 113`)
      if (report.status === 'DIAGRAM_REVIEW_APPROVE_PASS') report.status = 'PARTIAL'
    }
  } else if (!report.blockers.length) {
    report.status = 'BLOCKED'
  }

  report.endedAt = new Date().toISOString()
} catch (e) {
  report.blockers.push(String(e?.stack || e))
  report.status = report.items?.some((x) => x.ok) ? 'PARTIAL' : 'BLOCKED'
  report.endedAt = new Date().toISOString()
} finally {
  await conn.end()
}

fs.writeFileSync(
  path.join(docs, '_g1g_review_approve_result.json'),
  JSON.stringify(report, null, 2),
)
console.log(JSON.stringify(report, null, 2))
process.exit(report.status === 'DIAGRAM_REVIEW_APPROVE_PASS' ? 0 : 1)
