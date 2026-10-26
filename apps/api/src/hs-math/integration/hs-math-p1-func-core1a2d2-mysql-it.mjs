/**
 * P1-FUNC-CORE-1A-2D.2 真实 MySQL 幂等回归 IT（用户授权写 study_system 临时 IT）。
 * 前缀：HS_MATH_CORE1A2D2_IT_<runId>_
 * 覆盖：PATCH / KP / methods / content-meta 幂等、指纹、并发、回滚、权限、清理。
 */
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_ROOT = path.resolve(__dirname, '../../..')
const require = createRequire(path.join(API_ROOT, 'package.json'))
const mysql = require('mysql2/promise')

const PREFIX = 'HS_MATH_CORE1A2D2_IT_'
const results = []
const created = { methodIds: [], itemIds: [], reviewIds: [], codes: [], methodCodes: [] }

function loadEnv() {
  const env = { ...process.env }
  for (const line of fs.readFileSync(path.join(API_ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m && env[m[1].trim()] === undefined) env[m[1].trim()] = m[2].trim()
  }
  return env
}

function signJwt(payload, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp: now + 7200 })).toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

function record(name, status, detail = '') {
  results.push({ name, status, detail })
  console.log(`${status} ${name}${detail ? ' | ' + detail : ''}`)
}
function soft(name, cond, detail = '') {
  record(name, cond ? 'PASS' : 'FAIL', detail)
  return cond
}
function assert(name, cond, detail = '') {
  soft(name, cond, detail)
  if (!cond) throw new Error(`FAIL ${name}: ${detail}`)
}
function skip(name, detail) {
  record(name, 'NOT_RUN', detail)
}

async function api(method, url, token, body) {
  const headers = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const res = await fetch(`http://127.0.0.1:3000${url}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text.slice(0, 300) }
  }
  return { status: res.status, json, data: json?.data ?? json }
}

function shaRows(rows) {
  return createHash('sha256').update(JSON.stringify(rows)).digest('hex')
}

async function main() {
  const env = loadEnv()
  if ((env.DB_NAME || 'study_system') !== 'study_system') {
    throw new Error(`拒绝：DB_NAME=${env.DB_NAME}`)
  }
  const runId = `${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}_${crypto.randomBytes(2).toString('hex')}`
  const P = `${PREFIX}${runId}_`
  console.log('RUN_ID', runId)
  console.log('PREFIX', P)

  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD || '',
    database: 'study_system',
    multipleStatements: false,
  })
  const q = async (sql, params = []) => (await conn.execute(sql, params))[0]

  const dbName = (await q('SELECT DATABASE() d'))[0].d
  assert('database study_system', dbName === 'study_system', dbName)

  const baselineItems = await q(
    `SELECT id, code, status, difficulty, content_version,
            source_type, source_year, source_exam_name, source_question_no,
            source_reference, source_adaptation_note,
            source_verification_status, source_license_status,
            specialty_id, category_id, knowledge_point_id, pool, qtype, stem
     FROM hs_math_train_items ORDER BY id`,
  )
  const baselineItemIds = new Set(baselineItems.map((r) => String(r.id)))
  const baselineCodes = new Set(baselineItems.map((r) => r.code))
  const baselineHash = shaRows(baselineItems)
  const baselineReviews = Number((await q('SELECT COUNT(*) c FROM hs_math_train_item_reviews'))[0].c)
  const baselineMethods = await q('SELECT id, code FROM hs_math_methods ORDER BY id')
  const baselineLinks = Number((await q('SELECT COUNT(*) c FROM hs_math_train_item_methods'))[0].c)
  const baselineSessions = Number((await q('SELECT COUNT(*) c FROM hs_math_train_sessions'))[0].c)
  const baselineSessionItems = Number((await q('SELECT COUNT(*) c FROM hs_math_train_session_items'))[0].c)
  const baselineItemKps = Number((await q('SELECT COUNT(*) c FROM hs_math_train_item_kps'))[0].c)
  const chemSp = Number((await q('SELECT COUNT(*) c FROM chem_specialties'))[0].c)
  const parity = (
    await q(
      `SELECT COUNT(*) c, SUM(difficulty=1) d1, SUM(difficulty=2) d2, SUM(difficulty=3) d3
       FROM hs_math_train_items WHERE code LIKE 'HSMA-RJA-CH03-PARITY-%'`,
    )
  )[0]
  const kpLinksHash = shaRows(
    await q(
      `SELECT item_id, knowledge_point_id, is_primary, sort_order
       FROM hs_math_train_item_kps ORDER BY item_id, sort_order, id`,
    ),
  )

  assert('baseline total 110', baselineItems.length === 110, String(baselineItems.length))
  soft('baseline methods empty', baselineMethods.length === 0, String(baselineMethods.length))
  soft('baseline method links 0', baselineLinks === 0)
  soft('baseline reviews 0', baselineReviews === 0)
  soft(
    'baseline parity 16/7/2',
    Number(parity.c) === 25 && Number(parity.d1) === 16 && Number(parity.d2) === 7 && Number(parity.d3) === 2,
    JSON.stringify(parity),
  )
  console.log(
    'BASELINE',
    JSON.stringify({
      sessions: baselineSessions,
      sessionItems: baselineSessionItems,
      itemKps: baselineItemKps,
      chemSp,
      hash: baselineHash.slice(0, 16),
    }),
  )

  const [anchor] = await q(
    `SELECT specialty_id, category_id, knowledge_point_id
     FROM hs_math_train_items WHERE status='draft' AND knowledge_point_id IS NOT NULL
     ORDER BY id LIMIT 1`,
  )
  assert('taxonomy anchor', !!anchor)
  const [sp] = await q(`SELECT id, code FROM hs_math_specialties WHERE id=?`, [anchor.specialty_id])
  const [cat] = await q(`SELECT id, code FROM hs_math_categories WHERE id=?`, [anchor.category_id])
  let kps = await q(
    `SELECT id, code FROM hs_math_knowledge_points
     WHERE specialty_id=? AND category_id=? AND is_active=1 ORDER BY id LIMIT 3`,
    [sp.id, cat.id],
  )
  if (kps.length < 2) {
    kps = await q(
      `SELECT id, code FROM hs_math_knowledge_points WHERE specialty_id=? AND is_active=1 ORDER BY id LIMIT 3`,
      [sp.id],
    )
  }
  assert('taxonomy kps>=2', kps.length >= 2, String(kps.length))

  const [admin] = await q(
    `SELECT id, email, role FROM users WHERE is_disabled=0 AND role='ADMIN' ORDER BY id LIMIT 1`,
  )
  const [user] = await q(
    `SELECT id, email, role FROM users WHERE is_disabled=0 AND role='USER' ORDER BY id LIMIT 1`,
  )
  assert('admin exists', !!admin)
  assert('user exists', !!user)
  const adminTok = signJwt({ sub: String(admin.id), email: admin.email, role: admin.role }, env.JWT_SECRET)
  const userTok = signJwt({ sub: String(user.id), email: user.email, role: user.role }, env.JWT_SECRET)

  let cleanupOk = false
  try {
    // ---- create methods ----
    const m1 = `${P}M1`
    const m2 = `${P}M2`
    const m3 = `${P}M_DIS`
    created.methodCodes.push(m1, m2, m3)
    let r = await api('POST', '/hs-math/admin/methods', adminTok, {
      code: m1,
      name: 'IT定义法',
      sortOrder: 10,
    })
    assert('create method1', r.status === 201 || r.status === 200, `s=${r.status}`)
    const method1 = r.data
    created.methodIds.push(String(method1.id))
    r = await api('POST', '/hs-math/admin/methods', adminTok, {
      code: m2,
      name: 'IT分类',
      sortOrder: 20,
    })
    assert('create method2', r.status === 201 || r.status === 200)
    const method2 = r.data
    created.methodIds.push(String(method2.id))
    r = await api('POST', '/hs-math/admin/methods', adminTok, {
      code: m3,
      name: 'IT禁用',
      sortOrder: 30,
    })
    assert('create method3', r.status === 201 || r.status === 200)
    const method3 = r.data
    created.methodIds.push(String(method3.id))
    await api('PATCH', `/hs-math/admin/methods/${method3.id}`, adminTok, { isActive: false })

    // ---- create IT item ----
    const itemCode = `${P}Q01`
    created.codes.push(itemCode)
    r = await api('POST', '/hs-math/admin/train-items', adminTok, {
      code: itemCode,
      pool: 'formal',
      qtype: 'judge',
      stem: '【IT-CORE1A2D2 仅供集成测试】判断：$f(x)=x^2$ 在 $\\mathbb{R}$ 上是偶函数。',
      answerPayloadJson: { kind: 'judge', value: true },
      analysis: 'IT：f(-x)=(-x)^2=x^2=f(x)。',
      difficulty: 1,
      specialtyId: String(sp.id),
      categoryId: String(cat.id),
      knowledgePointId: String(kps[0].id),
    })
    assert('create IT item', r.status === 201 || r.status === 200, `s=${r.status}`)
    const item = r.data
    created.itemIds.push(String(item.id))
    let ver = Number(item.contentVersion || 1)
    soft('item draft', item.status === 'draft')

    // ========== A PATCH ==========
    const stem0 = item.stem
    const analysis0 = item.analysis
    const ans0 = item.answerPayloadJson

    r = await api('PATCH', `/hs-math/admin/train-items/${item.id}`, adminTok, {
      difficulty: 1,
      expectedContentVersion: ver,
    })
    soft('A1 same difficulty no bump', r.status === 200 && Number(r.data.contentVersion) === ver, `v=${r.data?.contentVersion}`)

    r = await api('PATCH', `/hs-math/admin/train-items/${item.id}`, adminTok, {
      stem: stem0,
      expectedContentVersion: ver,
    })
    soft('A2 same stem no bump', r.status === 200 && Number(r.data.contentVersion) === ver, `v=${r.data?.contentVersion}`)

    r = await api('PATCH', `/hs-math/admin/train-items/${item.id}`, adminTok, {
      answerPayloadJson: ans0,
      expectedContentVersion: ver,
    })
    soft('A3 same answer no bump', r.status === 200 && Number(r.data.contentVersion) === ver)

    r = await api('PATCH', `/hs-math/admin/train-items/${item.id}`, adminTok, {
      analysis: analysis0,
      expectedContentVersion: ver,
    })
    soft('A4 same analysis no bump', r.status === 200 && Number(r.data.contentVersion) === ver)

    r = await api('PATCH', `/hs-math/admin/train-items/${item.id}`, adminTok, {
      sourceType: 'original',
      sourceVerificationStatus: 'unverified',
      sourceLicenseStatus: 'unknown',
      expectedContentVersion: ver,
    })
    soft('A5 same source no bump', r.status === 200 && Number(r.data.contentVersion) === ver, `v=${r.data?.contentVersion}`)

    r = await api('PATCH', `/hs-math/admin/train-items/${item.id}`, adminTok, {
      difficulty: 1,
      stem: stem0,
      analysis: analysis0,
      expectedContentVersion: ver,
    })
    soft('A6 multi same no bump', r.status === 200 && Number(r.data.contentVersion) === ver)

    let panel = await api('GET', `/hs-math/admin/train-items/${item.id}/review-panel`, adminTok)
    const fpA0 = panel.data.contentFingerprint

    r = await api('PATCH', `/hs-math/admin/train-items/${item.id}`, adminTok, {
      difficulty: 2,
      expectedContentVersion: ver,
    })
    assert('A7 difficulty change', r.status === 200)
    soft('A7 version+1', Number(r.data.contentVersion) === ver + 1, `v=${r.data.contentVersion}`)
    ver = Number(r.data.contentVersion)
    panel = await api('GET', `/hs-math/admin/train-items/${item.id}/review-panel`, adminTok)
    soft('A7 fp changed', panel.data.contentFingerprint !== fpA0)

    r = await api('PATCH', `/hs-math/admin/train-items/${item.id}`, adminTok, {
      difficulty: 3,
      analysis: 'IT解析改',
      expectedContentVersion: ver,
    })
    assert('A8 multi change', r.status === 200)
    soft('A8 version+1 only', Number(r.data.contentVersion) === ver + 1)
    ver = Number(r.data.contentVersion)

    r = await api('PATCH', `/hs-math/admin/train-items/${item.id}`, adminTok, {
      difficulty: 3,
      analysis: 'IT解析改',
      expectedContentVersion: ver,
    })
    soft('A9 repeat A8 no bump', r.status === 200 && Number(r.data.contentVersion) === ver, `v=${r.data?.contentVersion}`)

    r = await api('PATCH', `/hs-math/admin/train-items/${item.id}`, adminTok, {
      difficulty: 1,
      expectedContentVersion: 1,
    })
    soft('A10 stale expectedVersion 409', r.status === 409, `s=${r.status}`)

    // ========== B KP ==========
    const linksBefore = async () =>
      Number(
        (await q('SELECT COUNT(*) c FROM hs_math_train_item_kps WHERE item_id=?', [item.id]))[0].c,
      )
    const maxIdBefore = async () =>
      Number(
        (
          await q(
            'SELECT COALESCE(MAX(id),0) m FROM hs_math_train_item_kps WHERE item_id=?',
            [item.id],
          )
        )[0].m,
      )

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/knowledge-points`, adminTok, {
      knowledgePointIds: [String(kps[0].id)],
      primaryKnowledgePointId: String(kps[0].id),
      expectedContentVersion: ver,
    })
    assert('B1 first KP', r.status === 200, `s=${r.status}`)
    soft('B1 version+1', Number(r.data.contentVersion) === ver + 1)
    ver = Number(r.data.contentVersion)
    const maxKpId1 = await maxIdBefore()

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/knowledge-points`, adminTok, {
      knowledgePointIds: [String(kps[0].id)],
      primaryKnowledgePointId: String(kps[0].id),
      expectedContentVersion: ver,
    })
    soft('B2 same KP no bump', r.status === 200 && Number(r.data.contentVersion) === ver, `v=${r.data?.contentVersion}`)
    soft('B2 links not rebuilt', (await maxIdBefore()) === maxKpId1, `maxId=${await maxIdBefore()}`)

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/knowledge-points`, adminTok, {
      knowledgePointIds: [String(kps[0].id), String(kps[1].id)],
      primaryKnowledgePointId: String(kps[0].id),
      expectedContentVersion: ver,
    })
    soft('B3/B5 add aux +1', r.status === 200 && Number(r.data.contentVersion) === ver + 1)
    if (r.status === 200) ver = Number(r.data.contentVersion)

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/knowledge-points`, adminTok, {
      knowledgePointIds: [String(kps[0].id), String(kps[1].id)],
      primaryKnowledgePointId: String(kps[0].id),
      expectedContentVersion: ver,
    })
    soft('B3 same plan no bump', r.status === 200 && Number(r.data.contentVersion) === ver)

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/knowledge-points`, adminTok, {
      knowledgePointIds: [String(kps[0].id), String(kps[1].id)],
      primaryKnowledgePointId: String(kps[1].id),
      expectedContentVersion: ver,
    })
    soft('B4 switch primary +1', r.status === 200 && Number(r.data.contentVersion) === ver + 1)
    if (r.status === 200) ver = Number(r.data.contentVersion)

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/knowledge-points`, adminTok, {
      knowledgePointIds: [String(kps[0].id)],
      primaryKnowledgePointId: String(kps[0].id),
      expectedContentVersion: ver,
    })
    soft('B6 remove aux +1', r.status === 200 && Number(r.data.contentVersion) === ver + 1)
    if (r.status === 200) ver = Number(r.data.contentVersion)

    // order change with 2 kps
    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/knowledge-points`, adminTok, {
      knowledgePointIds: [String(kps[0].id), String(kps[1].id)],
      primaryKnowledgePointId: String(kps[0].id),
      expectedContentVersion: ver,
    })
    if (r.status === 200) ver = Number(r.data.contentVersion)
    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/knowledge-points`, adminTok, {
      knowledgePointIds: [String(kps[1].id), String(kps[0].id)],
      primaryKnowledgePointId: String(kps[0].id),
      expectedContentVersion: ver,
    })
    soft('B7 order change +1', r.status === 200 && Number(r.data.contentVersion) === ver + 1)
    if (r.status === 200) ver = Number(r.data.contentVersion)

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/knowledge-points`, adminTok, {
      knowledgePointIds: [String(kps[1].id), String(kps[0].id)],
      primaryKnowledgePointId: String(kps[0].id),
      expectedContentVersion: ver,
    })
    soft('B8 same order no bump', r.status === 200 && Number(r.data.contentVersion) === ver)

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/knowledge-points`, adminTok, {
      knowledgePointIds: [String(kps[0].id)],
      primaryKnowledgePointId: String(kps[0].id),
      expectedContentVersion: 1,
    })
    soft('B9 stale expectedVersion 409', r.status === 409, `s=${r.status}`)

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/knowledge-points`, adminTok, {
      knowledgePointIds: [String(kps[0].id)],
      primaryKnowledgePointId: String(kps[1].id),
      expectedContentVersion: ver,
    })
    soft('B10 invalid primary reject', r.status === 400, `s=${r.status}`)
    soft('B10 version unchanged', Number((await q('SELECT content_version v FROM hs_math_train_items WHERE id=?', [item.id]))[0].v) === ver)

    // ========== C methods ==========
    const maxMethodLinkId = async () =>
      Number(
        (
          await q(
            'SELECT COALESCE(MAX(id),0) m FROM hs_math_train_item_methods WHERE item_id=?',
            [item.id],
          )
        )[0].m,
      )

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/methods`, adminTok, {
      methodIds: [String(method1.id)],
      primaryMethodId: String(method1.id),
      expectedContentVersion: ver,
    })
    assert('C1 first method', r.status === 200)
    soft('C1 version+1', Number(r.data.contentVersion) === ver + 1)
    ver = Number(r.data.contentVersion)
    const maxMl1 = await maxMethodLinkId()

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/methods`, adminTok, {
      methodIds: [String(method1.id)],
      primaryMethodId: String(method1.id),
      expectedContentVersion: ver,
    })
    soft('C2 same methods no bump', r.status === 200 && Number(r.data.contentVersion) === ver, `v=${r.data?.contentVersion}`)
    soft('C2 links not rebuilt', (await maxMethodLinkId()) === maxMl1)

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/methods`, adminTok, {
      methodIds: [String(method1.id), String(method2.id)],
      primaryMethodId: String(method2.id),
      expectedContentVersion: ver,
    })
    soft('C3 switch primary +1', r.status === 200 && Number(r.data.contentVersion) === ver + 1)
    if (r.status === 200) ver = Number(r.data.contentVersion)

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/methods`, adminTok, {
      methodIds: [String(method1.id), String(method2.id)],
      primaryMethodId: String(method2.id),
      expectedContentVersion: ver,
    })
    soft('C4 repeat C3 no bump', r.status === 200 && Number(r.data.contentVersion) === ver)

    // C5 already have 2; remove then add pattern
    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/methods`, adminTok, {
      methodIds: [String(method2.id)],
      primaryMethodId: String(method2.id),
      expectedContentVersion: ver,
    })
    soft('C6 remove aux +1', r.status === 200 && Number(r.data.contentVersion) === ver + 1)
    if (r.status === 200) ver = Number(r.data.contentVersion)

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/methods`, adminTok, {
      methodIds: [String(method2.id), String(method1.id)],
      primaryMethodId: String(method2.id),
      expectedContentVersion: ver,
    })
    soft('C5 add aux +1', r.status === 200 && Number(r.data.contentVersion) === ver + 1)
    if (r.status === 200) ver = Number(r.data.contentVersion)

    panel = await api('GET', `/hs-math/admin/train-items/${item.id}/review-panel`, adminTok)
    const fpBeforeRename = panel.data.contentFingerprint
    const verBeforeRename = Number(panel.data.contentVersion)
    r = await api('PATCH', `/hs-math/admin/methods/${method1.id}`, adminTok, { name: 'IT定义法-改名' })
    soft('C7 rename method ok', r.status === 200)
    panel = await api('GET', `/hs-math/admin/train-items/${item.id}/review-panel`, adminTok)
    soft('C7 item version unchanged', Number(panel.data.contentVersion) === verBeforeRename)
    soft('C7 fp unchanged', panel.data.contentFingerprint === fpBeforeRename)
    ver = verBeforeRename

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/methods`, adminTok, {
      methodIds: [String(method1.id), String(method1.id)],
      primaryMethodId: String(method1.id),
      expectedContentVersion: ver,
    })
    soft('C8 dup methodIds reject', r.status === 400)

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/methods`, adminTok, {
      methodIds: [String(method3.id)],
      primaryMethodId: String(method3.id),
      expectedContentVersion: ver,
    })
    soft('C9 disabled method reject', r.status === 400)
    soft(
      'C9 links unchanged after reject',
      Number((await q('SELECT COUNT(*) c FROM hs_math_train_item_methods WHERE item_id=?', [item.id]))[0].c) === 2,
    )

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/methods`, adminTok, {
      methodIds: [String(method1.id)],
      primaryMethodId: String(method1.id),
      expectedContentVersion: 1,
    })
    soft('C10 stale expectedVersion 409', r.status === 409)

    // ========== D content-meta ==========
    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/content-meta`, adminTok, {
      source: {
        sourceType: 'past_exam',
        sourceYear: 2022,
        sourceExamName: 'IT模拟卷（非真题）',
        sourceQuestionNo: '8',
        sourceReference: 'IT-only',
        sourceVerificationStatus: 'verified',
        sourceLicenseStatus: 'permitted',
      },
      methodIds: [String(method1.id), String(method2.id)],
      primaryMethodId: String(method1.id),
      expectedContentVersion: ver,
    })
    assert('D1 source+methods', r.status === 200, `s=${r.status}`)
    soft('D1 version+1', Number(r.data.contentVersion) === ver + 1)
    ver = Number(r.data.contentVersion)

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/content-meta`, adminTok, {
      source: {
        sourceType: 'past_exam',
        sourceYear: 2022,
        sourceExamName: 'IT模拟卷（非真题）',
        sourceQuestionNo: '8',
        sourceReference: 'IT-only',
        sourceVerificationStatus: 'verified',
        sourceLicenseStatus: 'permitted',
      },
      methodIds: [String(method1.id), String(method2.id)],
      primaryMethodId: String(method1.id),
      expectedContentVersion: ver,
    })
    soft('D2 same meta no bump', r.status === 200 && Number(r.data.contentVersion) === ver, `v=${r.data?.contentVersion}`)

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/content-meta`, adminTok, {
      source: {
        sourceType: 'original',
        sourceVerificationStatus: 'unverified',
        sourceLicenseStatus: 'unknown',
        sourceYear: null,
        sourceExamName: null,
        sourceQuestionNo: null,
        sourceReference: null,
        sourceAdaptationNote: null,
      },
      expectedContentVersion: ver,
    })
    soft('D3 source only +1', r.status === 200 && Number(r.data.contentVersion) === ver + 1)
    if (r.status === 200) ver = Number(r.data.contentVersion)

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/content-meta`, adminTok, {
      source: {
        sourceType: 'original',
        sourceVerificationStatus: 'unverified',
        sourceLicenseStatus: 'unknown',
        sourceYear: null,
        sourceExamName: null,
        sourceQuestionNo: null,
        sourceReference: null,
        sourceAdaptationNote: null,
      },
      expectedContentVersion: ver,
    })
    soft('D4 repeat D3 no bump', r.status === 200 && Number(r.data.contentVersion) === ver)

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/content-meta`, adminTok, {
      methodIds: [String(method2.id)],
      primaryMethodId: String(method2.id),
      expectedContentVersion: ver,
    })
    soft('D5 methods only +1', r.status === 200 && Number(r.data.contentVersion) === ver + 1)
    if (r.status === 200) ver = Number(r.data.contentVersion)

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/content-meta`, adminTok, {
      methodIds: [String(method2.id)],
      primaryMethodId: String(method2.id),
      expectedContentVersion: ver,
    })
    soft('D6 repeat D5 no bump', r.status === 200 && Number(r.data.contentVersion) === ver)

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/content-meta`, adminTok, {
      source: {
        sourceType: 'adapted',
        sourceYear: 2024,
        sourceExamName: 'IT卷A',
        sourceQuestionNo: '1',
        sourceReference: 'IT',
        sourceAdaptationNote: '改数字',
        sourceVerificationStatus: 'verified',
        sourceLicenseStatus: 'unknown',
      },
      methodIds: [String(method1.id), String(method2.id)],
      primaryMethodId: String(method1.id),
      expectedContentVersion: ver,
    })
    soft('D7 both change +1', r.status === 200 && Number(r.data.contentVersion) === ver + 1)
    if (r.status === 200) ver = Number(r.data.contentVersion)

    const linksN = Number(
      (await q('SELECT COUNT(*) c FROM hs_math_train_item_methods WHERE item_id=?', [item.id]))[0].c,
    )
    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/content-meta`, adminTok, {
      methodIds: ['999999999'],
      primaryMethodId: '999999999',
      expectedContentVersion: ver,
    })
    soft('D8 bad method reject', r.status === 400)
    soft(
      'D8 rollback links',
      Number((await q('SELECT COUNT(*) c FROM hs_math_train_item_methods WHERE item_id=?', [item.id]))[0].c) ===
        linksN,
    )
    soft(
      'D8 rollback version',
      Number((await q('SELECT content_version v FROM hs_math_train_items WHERE id=?', [item.id]))[0].v) === ver,
    )

    // 显式清空出处字段，避免局部 merge 沿用既有 adapted 完整字段而误判为合法
    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/content-meta`, adminTok, {
      source: {
        sourceType: 'adapted',
        sourceYear: null,
        sourceExamName: null,
        sourceQuestionNo: null,
        sourceReference: null,
        sourceAdaptationNote: null,
        sourceVerificationStatus: 'verified',
        sourceLicenseStatus: 'unknown',
      },
      expectedContentVersion: ver,
    })
    soft('D9 bad source reject', r.status === 400, `s=${r.status}`)
    soft(
      'D9 rollback version',
      Number((await q('SELECT content_version v FROM hs_math_train_items WHERE id=?', [item.id]))[0].v) === ver,
    )

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/content-meta`, adminTok, {
      methodIds: [String(method1.id)],
      primaryMethodId: String(method1.id),
      expectedContentVersion: 1,
    })
    soft('D10 stale expectedVersion 409', r.status === 409)

    // ========== E fingerprint + STALE ==========
    panel = await api('GET', `/hs-math/admin/train-items/${item.id}/review-panel`, adminTok)
    ver = Number(panel.data.contentVersion)
    const fpE0 = panel.data.contentFingerprint
    r = await api('POST', `/hs-math/admin/train-items/${item.id}/reviews`, adminTok, {
      decision: 'passed',
      comment: 'IT-CORE1A2D2 临时审核，非真实人工审核',
      expectedContentVersion: ver,
      expectedContentFingerprint: fpE0,
    })
    soft('E create IT review', r.status === 201 || r.status === 200, `s=${r.status}`)
    if (r.data?.id) created.reviewIds.push(String(r.data.id))

    r = await api('PATCH', `/hs-math/admin/train-items/${item.id}`, adminTok, {
      difficulty: Number(panel.data?.item?.difficulty ?? 3) || 3,
      expectedContentVersion: ver,
    })
    // get current difficulty from DB
    const curDiff = Number((await q('SELECT difficulty d FROM hs_math_train_items WHERE id=?', [item.id]))[0].d)
    r = await api('PATCH', `/hs-math/admin/train-items/${item.id}`, adminTok, {
      difficulty: curDiff,
      expectedContentVersion: ver,
    })
    soft('E same PATCH fp stable', r.status === 200 && Number(r.data.contentVersion) === ver)
    panel = await api('GET', `/hs-math/admin/train-items/${item.id}/review-panel`, adminTok)
    soft('E same PATCH review not stale', panel.data.reviewIsStale === false)

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/methods`, adminTok, {
      methodIds: [String(method1.id), String(method2.id)],
      primaryMethodId: String(method1.id),
      expectedContentVersion: ver,
    })
    // may already be that plan from D7
    soft(
      'E same methods no bump/fp',
      r.status === 200 && Number(r.data.contentVersion) === ver,
      `v=${r.data?.contentVersion}`,
    )

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/content-meta`, adminTok, {
      source: {
        sourceType: 'adapted',
        sourceYear: 2024,
        sourceExamName: 'IT卷A',
        sourceQuestionNo: '1',
        sourceReference: 'IT',
        sourceAdaptationNote: '改数字',
        sourceVerificationStatus: 'verified',
        sourceLicenseStatus: 'unknown',
      },
      methodIds: [String(method1.id), String(method2.id)],
      primaryMethodId: String(method1.id),
      expectedContentVersion: ver,
    })
    soft('E same content-meta no bump', r.status === 200 && Number(r.data.contentVersion) === ver)

    r = await api('PATCH', `/hs-math/admin/train-items/${item.id}`, adminTok, {
      analysis: 'IT真实修改触发STALE',
      expectedContentVersion: ver,
    })
    soft('E real change +1', r.status === 200 && Number(r.data.contentVersion) === ver + 1)
    if (r.status === 200) ver = Number(r.data.contentVersion)
    panel = await api('GET', `/hs-math/admin/train-items/${item.id}/review-panel`, adminTok)
    soft('E review STALE after real edit', panel.data.reviewIsStale === true, String(panel.data.reviewIsStale))
    soft('E fp changed after real edit', panel.data.contentFingerprint !== fpE0)

    // ========== F concurrency ==========
    const item2code = `${P}Q02`
    r = await api('POST', '/hs-math/admin/train-items', adminTok, {
      code: item2code,
      pool: 'formal',
      qtype: 'judge',
      stem: '【IT并发】判断：4 是偶数。',
      answerPayloadJson: { kind: 'judge', value: true },
      analysis: 'IT',
      difficulty: 1,
      specialtyId: String(sp.id),
      categoryId: String(cat.id),
    })
    assert('F create item2', r.status === 201 || r.status === 200)
    const item2 = r.data
    created.itemIds.push(String(item2.id))
    created.codes.push(item2code)
    let v2 = Number(item2.contentVersion)

    // seed methods on item2
    r = await api('PUT', `/hs-math/admin/train-items/${item2.id}/methods`, adminTok, {
      methodIds: [String(method1.id)],
      primaryMethodId: String(method1.id),
      expectedContentVersion: v2,
    })
    if (r.status === 200) v2 = Number(r.data.contentVersion)

    const [p1, p2] = await Promise.all([
      api('PATCH', `/hs-math/admin/train-items/${item2.id}`, adminTok, {
        difficulty: 1,
        expectedContentVersion: v2,
      }),
      api('PATCH', `/hs-math/admin/train-items/${item2.id}`, adminTok, {
        difficulty: 1,
        expectedContentVersion: v2,
      }),
    ])
    soft(
      'F concurrent same PATCH',
      [p1, p2].every((x) => x.status === 200 || x.status === 409) &&
        [p1, p2].some((x) => x.status === 200),
      `s=${p1.status}/${p2.status}`,
    )
    soft(
      'F concurrent PATCH no extra bump',
      Number((await q('SELECT content_version v FROM hs_math_train_items WHERE id=?', [item2.id]))[0].v) === v2,
      `v=${(await q('SELECT content_version v FROM hs_math_train_items WHERE id=?', [item2.id]))[0].v}`,
    )

    const [mA, mB] = await Promise.all([
      api('PUT', `/hs-math/admin/train-items/${item2.id}/methods`, adminTok, {
        methodIds: [String(method1.id)],
        primaryMethodId: String(method1.id),
        expectedContentVersion: v2,
      }),
      api('PUT', `/hs-math/admin/train-items/${item2.id}/methods`, adminTok, {
        methodIds: [String(method1.id)],
        primaryMethodId: String(method1.id),
        expectedContentVersion: v2,
      }),
    ])
    soft(
      'F concurrent same methods',
      [mA, mB].every((x) => x.status === 200 || x.status === 409),
      `s=${mA.status}/${mB.status}`,
    )
    soft(
      'F concurrent methods no bump',
      Number((await q('SELECT content_version v FROM hs_math_train_items WHERE id=?', [item2.id]))[0].v) === v2,
    )

    // KP concurrent same
    await api('PUT', `/hs-math/admin/train-items/${item2.id}/knowledge-points`, adminTok, {
      knowledgePointIds: [String(kps[0].id)],
      primaryKnowledgePointId: String(kps[0].id),
      expectedContentVersion: v2,
    }).then((x) => {
      if (x.status === 200) v2 = Number(x.data.contentVersion)
    })
    // refresh v2 from DB
    v2 = Number((await q('SELECT content_version v FROM hs_math_train_items WHERE id=?', [item2.id]))[0].v)
    const [kA, kB] = await Promise.all([
      api('PUT', `/hs-math/admin/train-items/${item2.id}/knowledge-points`, adminTok, {
        knowledgePointIds: [String(kps[0].id)],
        primaryKnowledgePointId: String(kps[0].id),
        expectedContentVersion: v2,
      }),
      api('PUT', `/hs-math/admin/train-items/${item2.id}/knowledge-points`, adminTok, {
        knowledgePointIds: [String(kps[0].id)],
        primaryKnowledgePointId: String(kps[0].id),
        expectedContentVersion: v2,
      }),
    ])
    soft(
      'F concurrent same KP',
      [kA, kB].every((x) => x.status === 200 || x.status === 409) &&
        Number((await q('SELECT content_version v FROM hs_math_train_items WHERE id=?', [item2.id]))[0].v) === v2,
      `s=${kA.status}/${kB.status}`,
    )

    // content-meta concurrent same
    const [cA, cB] = await Promise.all([
      api('PUT', `/hs-math/admin/train-items/${item2.id}/content-meta`, adminTok, {
        methodIds: [String(method1.id)],
        primaryMethodId: String(method1.id),
        expectedContentVersion: v2,
      }),
      api('PUT', `/hs-math/admin/train-items/${item2.id}/content-meta`, adminTok, {
        methodIds: [String(method1.id)],
        primaryMethodId: String(method1.id),
        expectedContentVersion: v2,
      }),
    ])
    soft(
      'F concurrent same content-meta',
      [cA, cB].every((x) => x.status === 200 || x.status === 409) &&
        Number((await q('SELECT content_version v FROM hs_math_train_items WHERE id=?', [item2.id]))[0].v) === v2,
      `s=${cA.status}/${cB.status}`,
    )

    // PATCH vs KP concurrent different changes with same expectedVersion
    v2 = Number((await q('SELECT content_version v FROM hs_math_train_items WHERE id=?', [item2.id]))[0].v)
    const [x1, x2] = await Promise.all([
      api('PATCH', `/hs-math/admin/train-items/${item2.id}`, adminTok, {
        analysis: 'IT patch concurrent',
        expectedContentVersion: v2,
      }),
      api('PUT', `/hs-math/admin/train-items/${item2.id}/knowledge-points`, adminTok, {
        knowledgePointIds: [String(kps[0].id), String(kps[1].id)],
        primaryKnowledgePointId: String(kps[0].id),
        expectedContentVersion: v2,
      }),
    ])
    const okN = [x1, x2].filter((x) => x.status === 200).length
    const confN = [x1, x2].filter((x) => x.status === 409).length
    soft(
      'F PATCH∥KP one wins',
      okN === 1 && confN === 1,
      `ok=${okN} conf=${confN} s=${x1.status}/${x2.status}`,
    )
    const finalV = Number((await q('SELECT content_version v FROM hs_math_train_items WHERE id=?', [item2.id]))[0].v)
    soft('F PATCH∥KP version +1 once', finalV === v2 + 1, `v=${finalV}`)

    v2 = finalV
    const [y1, y2] = await Promise.all([
      api('PUT', `/hs-math/admin/train-items/${item2.id}/methods`, adminTok, {
        methodIds: [String(method1.id), String(method2.id)],
        primaryMethodId: String(method1.id),
        expectedContentVersion: v2,
      }),
      api('PUT', `/hs-math/admin/train-items/${item2.id}/content-meta`, adminTok, {
        source: {
          sourceType: 'original',
          sourceVerificationStatus: 'verified',
          sourceLicenseStatus: 'unknown',
        },
        expectedContentVersion: v2,
      }),
    ])
    soft(
      'F methods∥content-meta one wins',
      [y1, y2].filter((x) => x.status === 200).length === 1 &&
        [y1, y2].filter((x) => x.status === 409).length === 1,
      `s=${y1.status}/${y2.status}`,
    )

    // ========== G permissions ==========
    r = await api('PATCH', `/hs-math/admin/train-items/${item.id}`, null, { difficulty: 1 })
    soft('G anon PATCH deny', r.status === 401 || r.status === 403)
    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/methods`, userTok, {
      methodIds: [],
      expectedContentVersion: 999,
    })
    soft('G user methods deny', r.status === 401 || r.status === 403)
    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/knowledge-points`, userTok, {
      knowledgePointIds: [],
      expectedContentVersion: 999,
    })
    soft('G user KP deny', r.status === 401 || r.status === 403)

    soft(
      'G item remains draft',
      (await q('SELECT status FROM hs_math_train_items WHERE id=?', [item.id]))[0].status === 'draft',
    )
  } catch (e) {
    record('RUN_ABORTED', 'FAIL', e.message || String(e))
    console.error('ABORTED', e)
  }

  // ========== cleanup ==========
  console.log('CLEANUP_START', JSON.stringify(created))
  try {
    if (created.itemIds.length) {
      await q(
        `DELETE FROM hs_math_train_item_reviews WHERE item_id IN (${created.itemIds.map(() => '?').join(',')})`,
        created.itemIds,
      )
      await q(
        `DELETE FROM hs_math_train_item_methods WHERE item_id IN (${created.itemIds.map(() => '?').join(',')})`,
        created.itemIds,
      )
      await q(
        `DELETE FROM hs_math_train_item_kps WHERE item_id IN (${created.itemIds.map(() => '?').join(',')})`,
        created.itemIds,
      )
      await q(
        `DELETE FROM hs_math_train_items WHERE id IN (${created.itemIds.map(() => '?').join(',')}) AND code LIKE ?`,
        [...created.itemIds, `${P}%`],
      )
    }
    await q(`DELETE FROM hs_math_train_item_reviews WHERE item_id IN (SELECT id FROM (SELECT id FROM hs_math_train_items WHERE code LIKE ?) t)`, [`${P}%`])
    await q(`DELETE FROM hs_math_train_item_methods WHERE item_id IN (SELECT id FROM (SELECT id FROM hs_math_train_items WHERE code LIKE ?) t)`, [`${P}%`])
    await q(`DELETE FROM hs_math_train_item_kps WHERE item_id IN (SELECT id FROM (SELECT id FROM hs_math_train_items WHERE code LIKE ?) t)`, [`${P}%`])
    await q(`DELETE FROM hs_math_train_items WHERE code LIKE ?`, [`${P}%`])
    if (created.methodIds.length) {
      await q(
        `DELETE FROM hs_math_train_item_methods WHERE method_id IN (${created.methodIds.map(() => '?').join(',')})`,
        created.methodIds,
      )
      await q(
        `DELETE FROM hs_math_methods WHERE id IN (${created.methodIds.map(() => '?').join(',')}) AND code LIKE ?`,
        [...created.methodIds, `${P}%`],
      )
    }
    await q(`DELETE FROM hs_math_methods WHERE code LIKE ?`, [`${P}%`])

    const leftItems = await q(`SELECT id, code FROM hs_math_train_items WHERE code LIKE ?`, [`${P}%`])
    const leftMethods = await q(`SELECT id, code FROM hs_math_methods WHERE code LIKE ?`, [`${P}%`])
    cleanupOk = leftItems.length === 0 && leftMethods.length === 0
    soft('cleanup items gone', leftItems.length === 0, JSON.stringify(leftItems))
    soft('cleanup methods gone', leftMethods.length === 0, JSON.stringify(leftMethods))
    if (!cleanupOk) record('CLEANUP_BLOCKED', 'FAIL', '残留 IT')
    else record('cleanup complete', 'PASS')
  } catch (e) {
    record('CLEANUP_BLOCKED', 'FAIL', e.message || String(e))
    cleanupOk = false
  }

  const afterItems = await q(
    `SELECT id, code, status, difficulty, content_version,
            source_type, source_year, source_exam_name, source_question_no,
            source_reference, source_adaptation_note,
            source_verification_status, source_license_status,
            specialty_id, category_id, knowledge_point_id, pool, qtype, stem
     FROM hs_math_train_items ORDER BY id`,
  )
  const afterHash = shaRows(afterItems)
  soft('protect count 110', afterItems.length === 110, String(afterItems.length))
  soft('protect hash identical', afterHash === baselineHash)
  soft('protect ids', afterItems.every((r) => baselineItemIds.has(String(r.id))))
  soft('protect codes', afterItems.every((r) => baselineCodes.has(r.code)))
  soft(
    'protect reviews',
    Number((await q('SELECT COUNT(*) c FROM hs_math_train_item_reviews'))[0].c) === baselineReviews,
  )
  soft(
    'protect methods',
    Number((await q('SELECT COUNT(*) c FROM hs_math_methods'))[0].c) === baselineMethods.length,
  )
  soft(
    'protect method links',
    Number((await q('SELECT COUNT(*) c FROM hs_math_train_item_methods'))[0].c) === baselineLinks,
  )
  soft(
    'protect sessions',
    Number((await q('SELECT COUNT(*) c FROM hs_math_train_sessions'))[0].c) === baselineSessions &&
      Number((await q('SELECT COUNT(*) c FROM hs_math_train_session_items'))[0].c) === baselineSessionItems,
  )
  soft(
    'protect item_kps count',
    Number((await q('SELECT COUNT(*) c FROM hs_math_train_item_kps'))[0].c) === baselineItemKps,
  )
  soft(
    'protect item_kps hash',
    shaRows(
      await q(
        `SELECT item_id, knowledge_point_id, is_primary, sort_order
         FROM hs_math_train_item_kps ORDER BY item_id, sort_order, id`,
      ),
    ) === kpLinksHash,
  )
  soft('protect chem', Number((await q('SELECT COUNT(*) c FROM chem_specialties'))[0].c) === chemSp)
  soft(
    'protect approved 0',
    Number((await q(`SELECT COUNT(*) c FROM hs_math_train_items WHERE status='approved'`))[0].c) === 0,
  )

  await conn.end()

  const summary = {
    runId,
    prefix: P,
    cleanupOk,
    pass: results.filter((x) => x.status === 'PASS').length,
    fail: results.filter((x) => x.status === 'FAIL').length,
    notRun: results.filter((x) => x.status === 'NOT_RUN').length,
    results,
    baselineHash,
    afterHash,
    verifiedAt: new Date().toISOString(),
  }
  const outPath = path.join(API_ROOT, '../../db/backups', `_core1a2d2_it_${runId}.json`)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8')
  console.log('SUMMARY_PATH', outPath)
  console.log('SUMMARY', JSON.stringify({ ...summary, results: undefined }))
  console.log('RESULT_LINES_START')
  for (const row of results) console.log(JSON.stringify(row))
  console.log('RESULT_LINES_END')

  if (!cleanupOk) process.exit(2)
  if (summary.fail > 0) process.exit(1)
}

main().catch((e) => {
  console.error('FATAL', e)
  process.exit(1)
})
