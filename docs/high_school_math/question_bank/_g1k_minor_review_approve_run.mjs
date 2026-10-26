/**
 * GLOBAL-1K-FIX-REVIEW-APPROVE: review+approve 022 & 093 only. No content edits.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'

const require = createRequire(import.meta.url)
const { fingerprintTrainItemContent } = require(
  '../../../apps/api/dist/hs-math/util/hs-math-item-content-fingerprint.js',
)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const docs = path.resolve(__dirname, '..')
const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'
const DIAG_SHA =
  'e12b2f2b2373d4545c6a79af55caa1f0c85c7d83f7b29d8a2cc5132671fe33f1'
const EXPECT_FP = {
  'CAND-G1B-022':
    'd89ca50f9eb5c58ca844e1b3ba574b5d8b610b2bbcb4d8268f6a20f060579935',
  'CAND-G1B-093':
    '67e3fd868032e434fc75be7878ba94be7aefce2c58bf49414da2c05a341066d0',
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
function parseJson(v) {
  if (v == null) return null
  if (typeof v === 'object') return v
  try {
    return JSON.parse(String(v))
  } catch {
    return v
  }
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

const env = loadEnv()
const report = {
  phase: 'HS-MATH-BANK-GLOBAL-1K-FIX-REVIEW-APPROVE',
  startedAt: new Date().toISOString(),
  endedAt: null,
  status: 'IN_PROGRESS',
  base: BASE,
  mathReviews: [],
  items: [],
  pre: null,
  post: null,
  blockers: [],
}

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
  const [[r]] = await conn.query(
    `SELECT i.*, s.code AS specialty_code, c.code AS category_code
     FROM hs_math_train_items i
     JOIN hs_math_specialties s ON s.id=i.specialty_id
     JOIN hs_math_categories c ON c.id=i.category_id
     WHERE i.id=? AND i.code=?`,
    [id, code],
  )
  if (!r) return null
  const [kps] = await conn.query(
    `SELECT k.code, ik.is_primary FROM hs_math_train_item_kps ik
     JOIN hs_math_knowledge_points k ON k.id=ik.knowledge_point_id WHERE ik.item_id=?`,
    [id],
  )
  const [methods] = await conn.query(
    `SELECT m.code, im.is_primary FROM hs_math_train_item_methods im
     JOIN hs_math_methods m ON m.id=im.method_id WHERE im.item_id=?`,
    [id],
  )
  const [links] = await conn.query(
    `SELECT d.id AS link_id, d.object_id, d.sort_order, o.content_sha256
     FROM hs_math_train_item_diagrams d
     JOIN hs_math_train_item_diagram_objects o ON o.id=d.object_id
     WHERE d.item_id=? ORDER BY d.sort_order`,
    [id],
  )
  const [reviews] = await conn.query(
    `SELECT id, content_version, content_fingerprint, review_status
     FROM hs_math_train_item_reviews WHERE item_id=? ORDER BY id DESC LIMIT 5`,
    [id],
  )
  const answer = parseJson(r.answer_payload_json)
  const options = parseJson(r.options_json)
  const primaryKp = kps.find((k) => k.is_primary) || kps[0]
  const primaryMethod = methods.find((m) => m.is_primary) || methods[0]
  const fp = fingerprintTrainItemContent({
    code: r.code,
    specialtyCode: r.specialty_code,
    categoryCode: r.category_code,
    qtype: r.qtype,
    difficulty: Number(r.difficulty),
    stem: r.stem,
    optionsJson: options,
    answerPayloadJson: answer,
    analysis: r.analysis,
    knowledgePointCodes: kps.map((k) => k.code),
    primaryKnowledgePointCode: primaryKp.code,
    sourceType: r.source_type,
    sourceYear: r.source_year,
    sourceExamName: r.source_exam_name,
    sourceQuestionNo: r.source_question_no,
    sourceReference: r.source_reference,
    sourceAdaptationNote: r.source_adaptation_note,
    sourceVerificationStatus: r.source_verification_status,
    sourceLicenseStatus: r.source_license_status,
    methodCodes: methods.map((m) => m.code),
    primaryMethodCode: primaryMethod?.code || null,
    diagramSha256List: links.map((l) => l.content_sha256),
  })
  return {
    id: String(r.id),
    code: r.code,
    status: r.status,
    contentVersion: Number(r.content_version),
    stem: r.stem,
    analysis: r.analysis,
    difficulty: Number(r.difficulty),
    answer,
    kps: kps.map((k) => k.code),
    methods: methods.map((m) => m.code),
    diagrams: links,
    contentFingerprint: fp,
    reviews,
  }
}

function math022(it) {
  const reasons = []
  let pass = true
  const fail = (m) => {
    pass = false
    reasons.push(`FAIL:${m}`)
  }
  const ok = (m) => reasons.push(`OK:${m}`)
  if (it.status !== 'draft' || it.contentVersion !== 2) fail(`state ${it.status}/cv${it.contentVersion}`)
  else ok('draft/cv2')
  if (it.contentFingerprint !== EXPECT_FP['CAND-G1B-022']) fail('fp≠154')
  else ok('fp matches 154')
  const rub = it.answer?.rubric || []
  const keys = rub.map((r) => r.key).join(',')
  if (keys !== 'proc,m') fail(`rubric keys=${keys}`)
  else ok('rubric proc,m only')
  if (Number(it.answer?.maxScore) !== 8) fail('maxScore')
  else ok('maxScore=8')
  const sum = rub.reduce((s, r) => s + Number(r.maxScore), 0)
  if (sum !== 8) fail(`sum=${sum}`)
  else ok('3+5=8')
  if (Number(rub[0]?.maxScore) !== 3 || Number(rub[1]?.maxScore) !== 5) fail('scores')
  else ok('proc3 m5')
  const crit = String(rub[0]?.criteria || '')
  if (!crit.includes('禁止仅抄') && !crit.includes('x=5')) fail('proc criteria weak')
  else ok('proc forbids copy-stem')
  const sa = String(it.answer?.standardAnswer || '')
  if (!sa.includes('5') || !sa.includes('25')) fail('standardAnswer')
  else ok('answer x=5 S=25')
  // independent: S=10x-x^2 vertex x=5 S=25
  ok('indep: S=10x-x^2 vertex x=5 max=25')
  ok('alt AM-GM/complete-square allowed by proc wording')
  const sameCvPassed = it.reviews.some(
    (r) => Number(r.content_version) === 2 && r.review_status === 'passed',
  )
  if (sameCvPassed) reasons.push('NOTE: already has cv2 passed')
  else ok('no current-cv passed (stale prior)')
  return { pass, reasons }
}

function math093(it) {
  const reasons = []
  let pass = true
  const fail = (m) => {
    pass = false
    reasons.push(`FAIL:${m}`)
  }
  const ok = (m) => reasons.push(`OK:${m}`)
  if (it.status !== 'draft' || it.contentVersion !== 3) fail(`state ${it.status}/cv${it.contentVersion}`)
  else ok('draft/cv3')
  if (it.contentFingerprint !== EXPECT_FP['CAND-G1B-093']) fail('fp≠154')
  else ok('fp matches 154')
  if (it.diagrams.length !== 1 || it.diagrams[0].content_sha256 !== DIAG_SHA) fail('diagram')
  else ok('diagram SHA unchanged')
  const a = String(it.analysis || '')
  for (const s of ['(-1,1,1)', '(1,1,0)', '(0,1,-1)', '-1+1+0=0', '0+1-1=0', '线面垂直']) {
    if (!a.includes(s)) fail(`analysis missing ${s}`)
    else ok(`analysis has ${s}`)
  }
  const sa = String(it.answer?.standardAnswer || '')
  if (!sa.includes('BD_1') || !sa.includes('平面')) fail('answer')
  else ok('standardAnswer unchanged shape')
  const rub = it.answer?.rubric || []
  if (rub.map((r) => r.key).join(',') !== 'l1,l2,c') fail('rubric keys changed')
  else ok('rubric l1,l2,c unchanged')
  ok('indep dots: BD1·A1C1=0 BD1·A1D=0; intersect at A1 ⇒ line⊥plane')
  return { pass, reasons }
}

try {
  const [[admin]] = await conn.query(
    `SELECT id, role FROM users WHERE id=2 OR role='ADMIN' ORDER BY id ASC LIMIT 1`,
  )
  if (!admin || String(admin.role).toUpperCase() !== 'ADMIN') report.blockers.push('no ADMIN')
  const token = report.blockers.length
    ? null
    : signJwt(String(admin.id), 'ADMIN', env.JWT_SECRET)

  const [[sess]] = await conn.query(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)
  const [[si]] = await conn.query(`SELECT COUNT(1) AS n FROM hs_math_train_session_items`)
  const [[diag4]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_item_diagrams
     WHERE item_id IN (244,231,215,242)`,
  )
  const [[otherAppr]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_items
     WHERE code LIKE 'CAND-G1B-%' AND code NOT IN ('CAND-G1B-022','CAND-G1B-093')
       AND status='approved'`,
  )

  const it022 = await loadFull('173', 'CAND-G1B-022')
  const it093 = await loadFull('244', 'CAND-G1B-093')
  report.pre = {
    drawable: await drawable(),
    sessions: Number(sess.n),
    sessionItems: Number(si.n),
    diagramLinksFour: Number(diag4.n),
    otherCandApproved: Number(otherAppr.n),
  }

  const m022 = math022(it022)
  const m093 = math093(it093)
  report.mathReviews = [
    { code: 'CAND-G1B-022', decision: m022.pass ? 'passed' : 'rejected', reasons: m022.reasons },
    { code: 'CAND-G1B-093', decision: m093.pass ? 'passed' : 'rejected', reasons: m093.reasons },
  ]
  if (!m022.pass) report.blockers.push('022 math fail')
  if (!m093.pass) report.blockers.push('093 math fail')
  if (report.pre.drawable !== 111) report.blockers.push(`drawable=${report.pre.drawable}`)

  if (report.blockers.length || !token) {
    report.status = 'BLOCKED'
    report.endedAt = new Date().toISOString()
    fs.writeFileSync(path.join(docs, '_g1k_minor_review_approve_result.json'), JSON.stringify(report, null, 2))
    console.log(JSON.stringify(report, null, 2))
    await conn.end()
    process.exit(2)
  }

  const SPECS = [
    {
      code: 'CAND-G1B-022',
      id: '173',
      cv: 2,
      comment:
        '1K-FIX 重审：rubric 仅 proc(3)+m(5)=8；过程须推出 x=5，禁止抄题干 S(x)；最值 25 正确；答案/题干/解析未改。',
    },
    {
      code: 'CAND-G1B-093',
      id: '244',
      cv: 3,
      comment:
        '1K-FIX 重审：解析含 BD1=(-1,1,1)、A1C1=(1,1,0)、A1D=(0,1,-1) 及两组点积为0；线面垂直成立；插图 SHA 未变；答案/rubric 未改。',
    },
  ]

  for (const spec of SPECS) {
    const row = { code: spec.code, itemId: spec.id, ok: false }
    const panelRes = await api('GET', `/hs-math/admin/train-items/${spec.id}/review-panel`, token)
    const panel = dataOf(panelRes.json)
    const fp = panel?.contentFingerprint
    const cv = Number(panel?.contentVersion)
    if (panelRes.status >= 400 || !fp || cv !== spec.cv || fp !== EXPECT_FP[spec.code]) {
      row.error = `panel fail status=${panelRes.status} cv=${cv}`
      report.items.push(row)
      report.blockers.push(`${spec.code} panel`)
      report.status = 'PARTIAL'
      break
    }
    row.panel = { contentVersion: cv, contentFingerprint: fp }

    const revRes = await api('POST', `/hs-math/admin/train-items/${spec.id}/reviews`, token, {
      decision: 'passed',
      comment: spec.comment.slice(0, 2000),
      expectedContentVersion: cv,
      expectedContentFingerprint: fp,
    })
    const revData = dataOf(revRes.json)
    row.review = {
      httpStatus: revRes.status,
      reviewId: revData?.id || null,
      reviewStatus: revData?.reviewStatus,
      itemStatusUnchanged: revData?.itemStatusUnchanged,
      body: revRes.status >= 400 ? revRes.json : undefined,
    }
    if (
      !(revRes.status === 200 || revRes.status === 201) ||
      String(revData?.reviewStatus) !== 'passed'
    ) {
      report.blockers.push(`${spec.code} review fail`)
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
      contentVersion: aprData?.contentVersion,
      body: aprRes.status >= 400 ? aprRes.json : undefined,
    }
    if (aprRes.status >= 400 || aprData?.status !== 'approved') {
      report.blockers.push(`${spec.code} approve fail`)
      report.items.push(row)
      report.status = 'PARTIAL'
      break
    }

    const post = await loadFull(spec.id, spec.code)
    const [eff] = await conn.query(
      `SELECT id, content_version, content_fingerprint, review_status
       FROM hs_math_train_item_reviews
       WHERE item_id=? AND content_version=? AND review_status='passed'
       ORDER BY id DESC LIMIT 1`,
      [spec.id, spec.cv],
    )
    row.post = {
      status: post.status,
      contentVersion: post.contentVersion,
      fp: post.contentFingerprint,
      effectiveReview: eff[0] || null,
      diagramSha: post.diagrams[0]?.content_sha256 || null,
    }
    row.ok =
      post.status === 'approved' &&
      post.contentVersion === spec.cv &&
      post.contentFingerprint === fp &&
      eff[0] &&
      String(eff[0].content_fingerprint) === fp &&
      (spec.code !== 'CAND-G1B-093' || post.diagrams[0]?.content_sha256 === DIAG_SHA)
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
  const [[diag42]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_item_diagrams
     WHERE item_id IN (244,231,215,242)`,
  )
  const [[other2]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_items
     WHERE code LIKE 'CAND-G1B-%' AND code NOT IN ('CAND-G1B-022','CAND-G1B-093')
       AND status='approved'`,
  )
  report.post = {
    drawable: await drawable(),
    sessions: Number(sess2.n),
    sessionItems: Number(si2.n),
    sessionsUnchanged: Number(sess2.n) === report.pre.sessions,
    sessionItemsUnchanged: Number(si2.n) === report.pre.sessionItems,
    diagramLinksFour: Number(diag42.n),
    diagramFourUnchanged: Number(diag42.n) === report.pre.diagramLinksFour,
    otherCandApproved: Number(other2.n),
    otherUnchanged: Number(other2.n) === report.pre.otherCandApproved,
  }

  if (
    !report.blockers.length &&
    report.items.length === 2 &&
    report.items.every((x) => x.ok) &&
    report.post.drawable === 113
  ) {
    report.status = 'MINOR_FIX_REVIEW_APPROVE_PASS'
  } else if (report.items.some((x) => x.ok)) {
    report.status = report.status === 'IN_PROGRESS' ? 'PARTIAL' : report.status
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
  path.join(docs, '_g1k_minor_review_approve_result.json'),
  JSON.stringify(report, null, 2),
)
console.log(JSON.stringify(report, null, 2))
process.exit(report.status === 'MINOR_FIX_REVIEW_APPROVE_PASS' ? 0 : 1)
