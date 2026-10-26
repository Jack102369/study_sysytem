/**
 * GLOBAL-1K-FIX-EXEC: PATCH 022 rubric + 093 analysis only. No review/approve.
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

const ANALYSIS_093 = `建立坐标系：取 $A=(0,0,0)$，$B=(1,0,0)$，$C=(1,1,0)$，$D=(0,1,0)$，$A_1=(0,0,1)$，$C_1=(1,1,1)$，$D_1=(0,1,1)$（棱长取 $1$，由相似性不影响垂直关系）。

则 $\\overrightarrow{BD_1}=D_1-B=(-1,1,1)$，$\\overrightarrow{A_1C_1}=(1,1,0)$，$\\overrightarrow{A_1D}=(0,1,-1)$。

计算数量积：
$\\overrightarrow{BD_1}\\cdot\\overrightarrow{A_1C_1}=-1+1+0=0$，故 $BD_1\\perp A_1C_1$；
$\\overrightarrow{BD_1}\\cdot\\overrightarrow{A_1D}=0+1-1=0$，故 $BD_1\\perp A_1D$。

又 $A_1C_1$ 与 $A_1D$ 交于 $A_1$，且均在平面 $A_1C_1D$ 内，由线面垂直判定定理得 $BD_1\\perp$ 平面 $A_1C_1D$。`

const RUBRIC_022 = [
  {
    key: 'proc',
    title: '求最值过程',
    criteria:
      '开口向下且对称轴 $x=5$，或配方 $S=25-(x-5)^2$，或等价均值/导数途径得到最值点 $x=5$（禁止仅抄题干 $S(x)=x(10-x)$）',
    maxScore: 3,
  },
  {
    key: 'm',
    title: '最大值结果',
    criteria: '$x=5$ 且 $S_{\\max}=25$',
    maxScore: 5,
  },
]

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

const env = loadEnv()
const report = {
  phase: 'HS-MATH-BANK-GLOBAL-1K-FIX-EXEC',
  startedAt: new Date().toISOString(),
  endedAt: null,
  status: 'IN_PROGRESS',
  base: BASE,
  pre: null,
  items: {},
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

async function loadItem(id, code) {
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
  const options = parseJson(r.options_json)
  const answer = parseJson(r.answer_payload_json)
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
  const cv = Number(r.content_version)
  const sameCv = reviews.filter((x) => Number(x.content_version) === cv)
  return {
    id: String(r.id),
    code: r.code,
    status: r.status,
    contentVersion: cv,
    stem: r.stem,
    analysis: r.analysis,
    difficulty: Number(r.difficulty),
    qtype: r.qtype,
    answer,
    options,
    kps: kps.map((k) => k.code),
    methods: methods.map((m) => m.code),
    diagrams: links,
    contentFingerprint: fp,
    reviews,
    hasPassedOnCurrentCv: sameCv.some((x) => x.review_status === 'passed'),
  }
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
    json = { raw: text.slice(0, 800) }
  }
  return { status: res.status, json }
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

  const pre022 = await loadItem('173', 'CAND-G1B-022')
  const pre093 = await loadItem('244', 'CAND-G1B-093')
  report.pre = {
    drawable: await drawable(),
    item022: pre022
      ? {
          status: pre022.status,
          cv: pre022.contentVersion,
          fp: pre022.contentFingerprint,
          rubric: pre022.answer?.rubric,
          standardAnswer: pre022.answer?.standardAnswer,
          analysisLen: String(pre022.analysis || '').length,
        }
      : null,
    item093: pre093
      ? {
          status: pre093.status,
          cv: pre093.contentVersion,
          fp: pre093.contentFingerprint,
          analysis: pre093.analysis,
          standardAnswer: pre093.answer?.standardAnswer,
          rubric: pre093.answer?.rubric,
          diagramSha: pre093.diagrams[0]?.content_sha256 || null,
          diagramCount: pre093.diagrams.length,
        }
      : null,
  }

  const preOk =
    pre022 &&
    pre093 &&
    pre022.status === 'approved' &&
    pre022.contentVersion === 1 &&
    pre093.status === 'approved' &&
    pre093.contentVersion === 2 &&
    report.pre.drawable === 113 &&
    pre093.diagrams.length === 1 &&
    pre093.diagrams[0].content_sha256 === DIAG_SHA &&
    Array.isArray(pre022.answer?.rubric) &&
    pre022.answer.rubric.some((r) => r.key === 's')

  if (!preOk || !token) {
    report.blockers.push('preflight mismatch vs 153')
    report.status = 'BLOCKED'
    report.endedAt = new Date().toISOString()
    fs.writeFileSync(path.join(docs, '_g1k_minor_fix_exec_result.json'), JSON.stringify(report, null, 2))
    console.log(JSON.stringify(report, null, 2))
    await conn.end()
    process.exit(2)
  }

  // ---- 022 PATCH ----
  const newAnswer022 = {
    kind: 'application',
    maxScore: 8,
    standardAnswer: pre022.answer.standardAnswer,
    rubric: RUBRIC_022,
  }
  const patch022 = await api('PATCH', '/hs-math/admin/train-items/173', token, {
    answerPayloadJson: newAnswer022,
    expectedContentVersion: 1,
  })
  const post022 = await loadItem('173', 'CAND-G1B-022')
  const ok022 =
    (patch022.status === 200 || patch022.status === 201) &&
    post022 &&
    post022.status === 'draft' &&
    post022.contentVersion === 2 &&
    post022.contentFingerprint !== pre022.contentFingerprint &&
    post022.stem === pre022.stem &&
    post022.analysis === pre022.analysis &&
    post022.difficulty === pre022.difficulty &&
    JSON.stringify(post022.answer?.standardAnswer) ===
      JSON.stringify(pre022.answer.standardAnswer) &&
    post022.answer?.rubric?.[0]?.key === 'proc' &&
    post022.answer?.rubric?.[1]?.key === 'm' &&
    Number(post022.answer?.maxScore) === 8 &&
    !post022.hasPassedOnCurrentCv

  report.items['022'] = {
    patchHttp: patch022.status,
    patchBody: patch022.status >= 400 ? patch022.json : dataOf(patch022.json),
    before: {
      status: pre022.status,
      cv: pre022.contentVersion,
      fp: pre022.contentFingerprint,
      rubricKeys: pre022.answer.rubric.map((r) => r.key),
    },
    after: post022
      ? {
          status: post022.status,
          cv: post022.contentVersion,
          fp: post022.contentFingerprint,
          rubric: post022.answer?.rubric,
          standardAnswer: post022.answer?.standardAnswer,
          stemUnchanged: post022.stem === pre022.stem,
          analysisUnchanged: post022.analysis === pre022.analysis,
          reviewPassedOnCurrentCv: post022.hasPassedOnCurrentCv,
        }
      : null,
    ok: !!ok022,
    drawableAfter: await drawable(),
  }

  if (!ok022) {
    report.blockers.push('022 PATCH verify fail')
    report.status = 'PARTIAL'
    report.endedAt = new Date().toISOString()
    report.post = { drawable: await drawable() }
    fs.writeFileSync(path.join(docs, '_g1k_minor_fix_exec_result.json'), JSON.stringify(report, null, 2))
    console.log(JSON.stringify(report, null, 2))
    await conn.end()
    process.exit(1)
  }

  // ---- 093 PATCH ----
  const patch093 = await api('PATCH', '/hs-math/admin/train-items/244', token, {
    analysis: ANALYSIS_093,
    expectedContentVersion: 2,
  })
  const post093 = await loadItem('244', 'CAND-G1B-093')
  const ok093 =
    (patch093.status === 200 || patch093.status === 201) &&
    post093 &&
    post093.status === 'draft' &&
    post093.contentVersion === 3 &&
    post093.contentFingerprint !== pre093.contentFingerprint &&
    post093.stem === pre093.stem &&
    JSON.stringify(post093.answer) === JSON.stringify(pre093.answer) &&
    post093.difficulty === pre093.difficulty &&
    post093.diagrams.length === 1 &&
    post093.diagrams[0].content_sha256 === DIAG_SHA &&
    String(post093.analysis).includes('(-1,1,1)') &&
    String(post093.analysis).includes('(1,1,0)') &&
    String(post093.analysis).includes('(0,1,-1)') &&
    String(post093.analysis).includes('-1+1+0=0') &&
    String(post093.analysis).includes('0+1-1=0') &&
    !post093.hasPassedOnCurrentCv

  report.items['093'] = {
    patchHttp: patch093.status,
    patchBody: patch093.status >= 400 ? patch093.json : dataOf(patch093.json),
    before: {
      status: pre093.status,
      cv: pre093.contentVersion,
      fp: pre093.contentFingerprint,
      analysis: pre093.analysis,
      diagramSha: DIAG_SHA,
    },
    after: post093
      ? {
          status: post093.status,
          cv: post093.contentVersion,
          fp: post093.contentFingerprint,
          analysis: post093.analysis,
          stemUnchanged: post093.stem === pre093.stem,
          answerUnchanged: JSON.stringify(post093.answer) === JSON.stringify(pre093.answer),
          diagramCount: post093.diagrams.length,
          diagramSha: post093.diagrams[0]?.content_sha256,
          diagramShaUnchanged: post093.diagrams[0]?.content_sha256 === DIAG_SHA,
          reviewPassedOnCurrentCv: post093.hasPassedOnCurrentCv,
        }
      : null,
    ok: !!ok093,
  }

  // other items untouched spot-check: count approved still excludes the two
  const [[other]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_items
     WHERE code LIKE 'CAND-G1B-%' AND code NOT IN ('CAND-G1B-022','CAND-G1B-093')
       AND status='approved'`,
  )

  report.post = {
    drawable: await drawable(),
    otherCandApproved: Number(other.n),
    reviewApproveNotRun: true,
  }

  if (ok022 && ok093 && report.post.drawable === 111) {
    report.status = 'MINOR_FIX_EXEC_PASS'
  } else if (ok022 || ok093) {
    report.status = 'PARTIAL'
    if (report.post.drawable !== 111) {
      report.blockers.push(`drawable=${report.post.drawable} expect 111`)
    }
    if (!ok093) report.blockers.push('093 verify fail')
  } else {
    report.status = 'BLOCKED'
  }

  report.endedAt = new Date().toISOString()
} catch (e) {
  report.blockers.push(String(e?.stack || e))
  report.status = report.items?.['022']?.ok ? 'PARTIAL' : 'BLOCKED'
  report.endedAt = new Date().toISOString()
} finally {
  await conn.end()
}

fs.writeFileSync(
  path.join(docs, '_g1k_minor_fix_exec_result.json'),
  JSON.stringify(report, null, 2),
)
console.log(JSON.stringify(report, null, 2))
process.exit(report.status === 'MINOR_FIX_EXEC_PASS' ? 0 : 1)
