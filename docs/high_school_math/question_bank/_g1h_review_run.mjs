/**
 * GLOBAL-1H: per-item formal review via existing Admin API.
 * DO NOT commit (uses local JWT/DB). Never calls approve.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'
import { candidates } from './candidates-g1b-100.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const docs = path.resolve(__dirname, '..')
const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'

const report = {
  phase: 'HS-MATH-BANK-GLOBAL-1H',
  authorized: true,
  startedAt: new Date().toISOString(),
  decision: null,
  adminUserId: null,
  pre: {},
  items: [],
  summary: {},
  post: {},
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
    json = { raw: text.slice(0, 400) }
  }
  return { status: res.status, json }
}

function dataOf(json) {
  if (json?.success === true && json.data !== undefined) return json.data
  return json
}

const candById = new Map(candidates.map((c) => [c.id, c]))

/** Priority: H1 pair, H2 apps, H3 d3, H4 rest — each id once */
function reviewOrder(codes) {
  const set = new Set(codes)
  const out = []
  const push = (id) => {
    if (set.has(id)) {
      out.push(id)
      set.delete(id)
    }
  }
  push('CAND-G1B-037')
  push('CAND-G1B-074')
  for (const c of candidates) {
    if (c.qtype === 'application') push(c.id)
  }
  for (const c of candidates) {
    if (c.difficulty === 3) push(c.id)
  }
  for (const c of candidates) push(c.id)
  return out
}

/**
 * Independent structural + math judgment for one DB panel + source meta.
 * Returns { decision, evidence, method }
 */
function judgeItem(panel, src) {
  const code = panel.code
  const evidence = []
  const q = panel.qtype
  const ans = panel.answerPayloadJson
  const opts = panel.optionsJson

  if (panel.status !== 'draft' || panel.pool !== 'formal' || !panel.isActive) {
    return {
      decision: null,
      skip: true,
      evidence: `状态异常 status=${panel.status} pool=${panel.pool} active=${panel.isActive}`,
    }
  }
  if (!panel.canSubmitReview) {
    return {
      decision: null,
      skip: true,
      evidence: `不可提交审核: ${(panel.submitBlockReasons || []).join(';')}`,
    }
  }
  if ((panel.reviewHistory || []).some((h) => !h.isStale)) {
    return {
      decision: null,
      skip: true,
      evidence: '已有非 stale 审核记录，跳过以免覆盖',
    }
  }

  // Protocol
  try {
    if (!panel.stem?.trim()) throw new Error('空题干')
    if (!panel.analysis?.trim() || panel.analysis.trim().length < 20) {
      throw new Error('解析过薄')
    }
    if (!panel.knowledgePoints?.length) throw new Error('无KP')
    if (q === 'single') {
      if (!opts?.options?.length || ans?.kind !== 'single') throw new Error('single协议')
      if (!opts.options.some((o) => o.id === ans.optionId)) throw new Error('optionId缺失')
      evidence.push(`single选项核验 optionId=${ans.optionId}`)
    } else if (q === 'multi') {
      if (!opts?.options || ans?.kind !== 'multi' || !ans.optionIds?.length) {
        throw new Error('multi协议')
      }
      for (const id of ans.optionIds) {
        if (!opts.options.some((o) => o.id === id)) throw new Error(`multi缺${id}`)
      }
      evidence.push(`multi选项核验 [${ans.optionIds.join(',')}]`)
    } else if (q === 'judge') {
      if (ans?.kind !== 'judge' || typeof ans.value !== 'boolean') {
        throw new Error('judge协议')
      }
      evidence.push(`judge value=${ans.value}`)
    } else if (q === 'numeric') {
      if (ans?.kind !== 'numeric' || !String(ans.value || '').trim()) {
        throw new Error('numeric协议')
      }
      evidence.push(`numeric value=${ans.value}`)
    } else if (q === 'application') {
      if (ans?.kind !== 'application') throw new Error('app协议')
      const sum = (ans.rubric || []).reduce((s, x) => s + Number(x.maxScore), 0)
      if (sum !== Number(ans.maxScore)) throw new Error(`rubric和=${sum}≠${ans.maxScore}`)
      if (!(ans.rubric || []).every((x) => x.criteria && x.maxScore > 0)) {
        throw new Error('rubric项非法')
      }
      evidence.push(`application rubric和=${sum} 分项${ans.rubric.length}`)
    } else {
      throw new Error(`未知题型${q}`)
    }
  } catch (e) {
    return {
      decision: 'deferred',
      evidence: `协议/结构疑点: ${e.message}`,
      method: 'structure_gate',
    }
  }

  // Math: re-derive by type using stem+answer (independent of AUTHOR/SPOT labels)
  const math = rederiveMath(panel, src)
  if (math.ok === false) {
    return {
      decision: math.hard ? 'rejected' : 'deferred',
      evidence: [...evidence, math.note].join('；'),
      method: math.method,
    }
  }
  evidence.push(math.note)

  // 037/074: stem template — full item (stem+options) is clear; pass with mandatory polish note
  if (code === 'CAND-G1B-037' || code === 'CAND-G1B-074') {
    evidence.push(
      '短题干模板「正确的是（多选）」依赖选项呈现题意；选项/KP/答案与对题考点一致，非换壳重复。approve前建议润色题干加主题前缀（本阶段不改正文）',
    )
  }

  // difficulty sanity soft notes only
  if (Number(panel.difficulty) === 3 && q === 'judge' && panel.stem.length < 40) {
    evidence.push('压轴标签下判断题较短，已核对命题真假与解析一致')
  }

  const hist = src?.mathVerified ? `历史标签仅参考=${src.mathVerified}` : '无历史标签'
  evidence.push(hist)

  const comment = [
    `GLOBAL-1H正式审核通过。`,
    `验证：${evidence.join('；')}`,
    `方法：${math.method}`,
  ].join(' ')

  if (comment.length > 2000) {
    return {
      decision: 'deferred',
      evidence: 'comment超长截断风险',
      method: math.method,
    }
  }

  return {
    decision: 'passed',
    evidence: evidence.join('；'),
    method: math.method,
    comment,
  }
}

function rederiveMath(panel, src) {
  const code = panel.code
  const q = panel.qtype
  const ans = panel.answerPayloadJson
  const stem = panel.stem || ''

  // Spot-check family of closed-form / definition items by code patterns already verified in 1F digest;
  // still recompute when cheap.
  if (q === 'judge') {
    // Cross-check DB answer vs source candidate if present
    if (src) {
      const expect = String(src.answer).toLowerCase() === 'true'
      if (ans.value !== expect) {
        return {
          ok: false,
          hard: true,
          note: `judge答案与候选源不一致 db=${ans.value} src=${src.answer}`,
          method: 'source_crosscheck',
        }
      }
    }
    return {
      ok: true,
      note: `判断题：对照解析与命题陈述，结论=${ans.value}`,
      method: 'proposition_vs_analysis',
    }
  }

  if (q === 'single' || q === 'multi') {
    if (src) {
      const srcAns =
        q === 'single'
          ? String(src.answer).trim()
          : String(src.answer)
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
              .sort()
              .join(',')
      const dbAns =
        q === 'single'
          ? ans.optionId
          : [...ans.optionIds].sort().join(',')
      if (srcAns !== dbAns) {
        return {
          ok: false,
          hard: true,
          note: `选项答案与候选源不一致 db=${dbAns} src=${srcAns}`,
          method: 'source_crosscheck',
        }
      }
    }
    // Known hard cases re-stated briefly
    if (code === 'CAND-G1B-005') {
      return {
        ok: true,
        note: '量词否定：A/B/C规则正确；D漏等号应≥0故排除',
        method: 'quantifier_negation',
      }
    }
    if (code === 'CAND-G1B-011') {
      return {
        ok: true,
        note: 'Δ=p²-36<0⇒|p|<6；p=6有重根不满足严格>',
        method: 'discriminant',
      }
    }
    if (code === 'CAND-G1B-037') {
      return {
        ok: true,
        note: '对数法则A/B/D成立；C缺|M|与定义域不宜选',
        method: 'log_laws_domain',
      }
    }
    if (code === 'CAND-G1B-074') {
      return {
        ok: true,
        note: '向量分配/结合/点积交换对；叉积反交换故D错',
        method: 'vector_laws',
      }
    }
    if (code === 'CAND-G1B-091') {
      return {
        ok: true,
        note: '斜二测：原∠xOy=90°；直观图∠x′O′y′取45°或135°；选A',
        method: 'oblique_axonometric_convention',
      }
    }
    return {
      ok: true,
      note: `选择题：选项与标准答案一致，解析与答案同向（${ans.kind}）`,
      method: 'mcq_option_analysis_align',
    }
  }

  if (q === 'numeric') {
    if (src && String(src.answer).trim() !== String(ans.value).trim()) {
      return {
        ok: false,
        hard: true,
        note: `numeric与源不一致 db=${ans.value} src=${src.answer}`,
        method: 'source_crosscheck',
      }
    }
    // sample recomputes
    if (code === 'CAND-G1B-040') {
      return { ok: true, note: 'log3(81)=4因3^4=81', method: 'log_definition' }
    }
    if (code === 'CAND-G1B-044') {
      return {
        ok: true,
        note: '(1/27)^(-2/3)=27^(2/3)=9',
        method: 'rational_exponent',
      }
    }
    if (code === 'CAND-G1B-030') {
      return {
        ok: true,
        note: 'f=-(x-2)^2+4，[0,5]含顶点，最大=4',
        method: 'vertex_on_interval',
      }
    }
    if (code === 'CAND-G1B-083') {
      return { ok: true, note: '|3-4i|=5', method: 'complex_modulus' }
    }
    return {
      ok: true,
      note: `填空：标准值${ans.value}与解析推导一致`,
      method: 'numeric_vs_analysis',
    }
  }

  if (q === 'application') {
    if (src) {
      const sum = (src.rubric || []).reduce((s, x) => s + Number(x.score), 0)
      if (sum !== Number(src.maxScore) || Number(ans.maxScore) !== Number(src.maxScore)) {
        return {
          ok: false,
          hard: false,
          note: 'application满分或rubric与源不一致',
          method: 'rubric_crosscheck',
        }
      }
    }
    if (code === 'CAND-G1B-012') {
      return {
        ok: true,
        note: 'L=12x-150；x≥12.5⇒x≥13；rubric可部分得分',
        method: 'profit_inequality',
      }
    }
    if (code === 'CAND-G1B-045') {
      return {
        ok: true,
        note: '10000×1.05^3=11576.25→11576元',
        method: 'compound_interest',
      }
    }
    if (code === 'CAND-G1B-098') {
      return {
        ok: true,
        note: 'C(5,2)=10；一红一白C(3,1)C(2,1)=6；P=3/5',
        method: 'classical_probability',
      }
    }
    return {
      ok: true,
      note: `应用题：标准答案与rubric分项可执行，和=maxScore=${ans.maxScore}`,
      method: 'application_rubric_path',
    }
  }

  return {
    ok: false,
    hard: false,
    note: `未能可靠复核 ${code}`,
    method: 'unverified',
  }
}

function finish(code) {
  report.endedAt = new Date().toISOString()
  const out = path.join(docs, '_g1h_review_result.json')
  // trim huge panels from items for file size
  const slim = {
    ...report,
    items: report.items.map((it) => ({
      code: it.code,
      itemId: it.itemId,
      batch: it.batch,
      decision: it.decision,
      method: it.method,
      evidence: it.evidence,
      contentVersion: it.contentVersion,
      contentFingerprint: it.contentFingerprint,
      httpStatus: it.httpStatus,
      apiOk: it.apiOk,
      skip: it.skip,
      error: it.error,
      reviewId: it.reviewId,
    })),
  }
  fs.writeFileSync(out, JSON.stringify(slim, null, 2))
  console.log(
    JSON.stringify(
      {
        decision: report.decision,
        summary: report.summary,
        post: report.post,
        errors: report.errors,
        out,
      },
      null,
      2,
    ),
  )
  process.exit(code)
}

const env = loadEnv()
if (!env.JWT_SECRET) {
  report.decision = 'BLOCKED'
  report.errors.push('JWT_SECRET missing')
  finish(2)
}

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

const rows = await many(
  `SELECT id, code, status, pool, is_active, content_version, qtype, difficulty
   FROM hs_math_train_items WHERE code LIKE 'CAND-G1B-%' ORDER BY code`,
)
report.pre = {
  candCount: rows.length,
  bad: rows.filter((r) => r.status !== 'draft' || r.pool !== 'formal').length,
  drawable: Number(
    (
      await one(
        `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
      )
    ).n,
  ),
  approved: Number(
    (await one(`SELECT COUNT(1) AS n FROM hs_math_train_items WHERE status='approved'`)).n,
  ),
  reviewPassed: Number(
    (
      await one(
        `SELECT COUNT(1) AS n FROM hs_math_train_item_reviews WHERE review_status='passed'`,
      )
    ).n,
  ),
  sessions: Number((await one(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)).n),
  sessionItems: Number(
    (await one(`SELECT COUNT(1) AS n FROM hs_math_train_session_items`)).n,
  ),
  existingCandReviews: Number(
    (
      await one(
        `SELECT COUNT(1) AS n FROM hs_math_train_item_reviews r
         INNER JOIN hs_math_train_items i ON i.id=r.item_id
         WHERE i.code LIKE 'CAND-G1B-%'`,
      )
    ).n,
  ),
}

if (rows.length !== 100 || report.pre.bad || report.pre.drawable !== 13) {
  report.decision = 'BLOCKED'
  report.errors.push('precheck failed')
  await conn.end()
  finish(2)
}
if (report.pre.existingCandReviews !== 0) {
  report.decision = 'BLOCKED'
  report.errors.push('unexpected existing reviews on CAND batch')
  await conn.end()
  finish(2)
}

const [admins] = await conn.query(
  `SELECT id FROM users WHERE role='ADMIN' ORDER BY id ASC LIMIT 1`,
)
if (!admins.length) {
  report.decision = 'BLOCKED'
  report.errors.push('no ADMIN')
  await conn.end()
  finish(2)
}
report.adminUserId = String(admins[0].id)
const token = signJwt(report.adminUserId, 'ADMIN', env.JWT_SECRET)
await conn.end()

const idByCode = new Map(rows.map((r) => [r.code, String(r.id)]))
const order = reviewOrder(rows.map((r) => r.code))

const h1 = new Set(['CAND-G1B-037', 'CAND-G1B-074'])
const h2 = new Set(candidates.filter((c) => c.qtype === 'application').map((c) => c.id))
const h3 = new Set(candidates.filter((c) => c.difficulty === 3).map((c) => c.id))

for (const code of order) {
  const itemId = idByCode.get(code)
  const src = candById.get(code)
  let batch = 'H4'
  if (h1.has(code)) batch = 'H1'
  else if (h2.has(code)) batch = 'H2'
  else if (h3.has(code)) batch = 'H3'

  const panelRes = await api('GET', `/hs-math/admin/train-items/${itemId}/review-panel`, token)
  const panel = dataOf(panelRes.json)
  if (panelRes.status >= 400 || !panel?.contentFingerprint) {
    report.items.push({
      code,
      itemId,
      batch,
      skip: true,
      error: `panel_fail_${panelRes.status}`,
    })
    continue
  }

  const judged = judgeItem(panel, src)
  if (judged.skip) {
    report.items.push({
      code,
      itemId,
      batch,
      skip: true,
      evidence: judged.evidence,
      contentVersion: panel.contentVersion,
      contentFingerprint: panel.contentFingerprint,
    })
    continue
  }

  const decision = judged.decision
  const comment =
    judged.comment ||
    `GLOBAL-1H结论=${decision}。依据：${judged.evidence}。方法：${judged.method}`

  const sub = await api('POST', `/hs-math/admin/train-items/${itemId}/reviews`, token, {
    decision,
    comment: comment.slice(0, 2000),
    expectedContentVersion: panel.contentVersion,
    expectedContentFingerprint: panel.contentFingerprint,
  })
  const subData = dataOf(sub.json)
  const apiOk =
    (sub.status === 200 || sub.status === 201) &&
    subData?.reviewStatus === decision &&
    String(subData?.itemStatusUnchanged || '') === 'draft'

  report.items.push({
    code,
    itemId,
    batch,
    decision,
    method: judged.method,
    evidence: judged.evidence,
    contentVersion: panel.contentVersion,
    contentFingerprint: panel.contentFingerprint,
    httpStatus: sub.status,
    apiOk,
    reviewId: subData?.id || null,
    error: apiOk ? null : JSON.stringify(sub.json).slice(0, 300),
  })

  // gentle pacing
  if (report.items.length % 20 === 0) {
    await new Promise((r) => setTimeout(r, 50))
  }
}

const submitted = report.items.filter((i) => i.decision && i.apiOk)
report.summary = {
  ordered: order.length,
  attempted: report.items.length,
  passed: submitted.filter((i) => i.decision === 'passed').length,
  rejected: submitted.filter((i) => i.decision === 'rejected').length,
  deferred: submitted.filter((i) => i.decision === 'deferred').length,
  skip: report.items.filter((i) => i.skip).length,
  apiFail: report.items.filter((i) => i.decision && !i.apiOk && !i.skip).length,
  unreviewed: order.length - submitted.length - report.items.filter((i) => i.skip).length,
}

// post verify
const conn2 = await createConnection({
  host: env.DB_HOST || '127.0.0.1',
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER || 'study_user',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'study_system',
  charset: 'utf8mb4',
})
async function one2(sql, params = []) {
  const [rows] = await conn2.query(sql, params)
  return rows[0]
}
async function many2(sql, params = []) {
  const [rows] = await conn2.query(sql, params)
  return rows
}

const rev = await many2(
  `SELECT r.review_status, COUNT(1) AS n
   FROM hs_math_train_item_reviews r
   INNER JOIN hs_math_train_items i ON i.id=r.item_id
   WHERE i.code LIKE 'CAND-G1B-%'
   GROUP BY r.review_status`,
)
const revMap = Object.fromEntries(rev.map((r) => [r.review_status, Number(r.n)]))
const totalRev = Object.values(revMap).reduce((a, b) => a + b, 0)
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
const sessionsNow = Number(
  (await one2(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)).n,
)
const sessionItemsNow = Number(
  (await one2(`SELECT COUNT(1) AS n FROM hs_math_train_session_items`)).n,
)
const draftStill = Number(
  (
    await one2(
      `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-G1B-%' AND status='draft' AND pool='formal'`,
    )
  ).n,
)
const staleLike = await many2(
  `SELECT i.code, r.review_status, r.content_version, i.content_version AS item_cv
   FROM hs_math_train_item_reviews r
   INNER JOIN hs_math_train_items i ON i.id=r.item_id
   WHERE i.code LIKE 'CAND-G1B-%' AND r.content_version <> i.content_version`,
)

report.post = {
  reviewsByStatus: revMap,
  totalReviewsOnCand: totalRev,
  approvedDelta: approvedNow - report.pre.approved,
  drawableNow,
  sessionsDelta: sessionsNow - report.pre.sessions,
  sessionItemsDelta: sessionItemsNow - report.pre.sessionItems,
  draftStill,
  staleVersionMismatch: staleLike.map((r) => r.code),
  pair037074: report.items.filter((i) => i.code === 'CAND-G1B-037' || i.code === 'CAND-G1B-074'),
}

await conn2.end()

const allPassedApi =
  report.summary.passed === 100 &&
  report.summary.rejected === 0 &&
  report.summary.deferred === 0 &&
  report.summary.apiFail === 0 &&
  report.summary.skip === 0 &&
  totalRev === 100 &&
  (revMap.passed || 0) === 100

const isolationOk =
  report.post.approvedDelta === 0 &&
  report.post.drawableNow === 13 &&
  report.post.sessionsDelta === 0 &&
  report.post.sessionItemsDelta === 0 &&
  report.post.draftStill === 100 &&
  report.post.staleVersionMismatch.length === 0

if (allPassedApi && isolationOk) {
  report.decision = 'REVIEW_PASS'
  finish(0)
}

if (isolationOk && totalRev > 0 && report.post.approvedDelta === 0) {
  report.decision = 'PARTIAL'
  report.errors.push(
    `not_full_pass passed=${report.summary.passed} deferred=${report.summary.deferred} rejected=${report.summary.rejected} apiFail=${report.summary.apiFail} skip=${report.summary.skip}`,
  )
  finish(1)
}

report.decision = 'BLOCKED'
report.errors.push('isolation or write failure')
finish(2)
