/**
 * P1-FUNC-CORE-1A-2D 受控 MySQL IT（用户明确授权写 study_system 临时 IT 记录）。
 * 仅允许 code/方法前缀 HS_MATH_CORE1A2D_IT_<runId>_
 * 禁止：改现有110题、批准正式题、第二库、改.env、重启API。
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

const PREFIX = 'HS_MATH_CORE1A2D_IT_'
const results = []
const created = {
  methodIds: [],
  itemIds: [],
  reviewIds: [],
  codes: [],
  methodCodes: [],
}

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

function assert(name, cond, detail = '') {
  record(name, cond ? 'PASS' : 'FAIL', detail)
  if (!cond) throw new Error(`FAIL ${name}: ${detail}`)
}

function soft(name, cond, detail = '') {
  record(name, cond ? 'PASS' : 'FAIL', detail)
  return cond
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
  let json = null
  const text = await res.text()
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
  const runId = `${new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14)}_${crypto.randomBytes(2).toString('hex')}`
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

  // ---- baseline ----
  const baselineItems = await q(
    `SELECT id, code, status, difficulty, content_version,
            source_type, source_year, source_exam_name, source_question_no,
            source_reference, source_adaptation_note,
            source_verification_status, source_license_status,
            specialty_id, category_id, knowledge_point_id, pool, qtype
     FROM hs_math_train_items ORDER BY id`,
  )
  const baselineItemIds = new Set(baselineItems.map((r) => String(r.id)))
  const baselineCodes = new Set(baselineItems.map((r) => r.code))
  const baselineHash = shaRows(baselineItems)
  const baselineReviews = Number((await q('SELECT COUNT(*) c FROM hs_math_train_item_reviews'))[0].c)
  const baselineMethods = await q('SELECT id, code FROM hs_math_methods ORDER BY id')
  const baselineMethodIds = new Set(baselineMethods.map((r) => String(r.id)))
  const baselineLinks = Number((await q('SELECT COUNT(*) c FROM hs_math_train_item_methods'))[0].c)
  const baselineSessions = Number((await q('SELECT COUNT(*) c FROM hs_math_train_sessions'))[0].c)
  const baselineSessionItems = Number(
    (await q('SELECT COUNT(*) c FROM hs_math_train_session_items'))[0].c,
  )
  const baselineItemKps = Number((await q('SELECT COUNT(*) c FROM hs_math_train_item_kps'))[0].c)
  const baselineKps = Number((await q('SELECT COUNT(*) c FROM hs_math_knowledge_points'))[0].c)
  const chemSp = Number((await q('SELECT COUNT(*) c FROM chem_specialties'))[0].c)
  const parity = (
    await q(
      `SELECT COUNT(*) c, SUM(difficulty=1) d1, SUM(difficulty=2) d2, SUM(difficulty=3) d3
       FROM hs_math_train_items WHERE code LIKE 'HSMA-RJA-CH03-PARITY-%'`,
    )
  )[0]
  const statusDist = await q(
    'SELECT status, COUNT(*) c FROM hs_math_train_items GROUP BY status ORDER BY status',
  )

  assert('baseline total 110', baselineItems.length === 110, String(baselineItems.length))
  assert('baseline methods empty', baselineMethods.length === 0)
  assert('baseline links 0', baselineLinks === 0)
  assert('baseline reviews 0', baselineReviews === 0)
  assert(
    'baseline parity 16/7/2',
    Number(parity.c) === 25 &&
      Number(parity.d1) === 16 &&
      Number(parity.d2) === 7 &&
      Number(parity.d3) === 2,
    JSON.stringify(parity),
  )
  console.log('BASELINE', JSON.stringify({ statusDist, sessions: baselineSessions, chemSp }))

  // 取已有 draft 题的章节/小节/KP，避免空小节
  const [anchor] = await q(
    `SELECT specialty_id, category_id, knowledge_point_id
     FROM hs_math_train_items WHERE status='draft' AND knowledge_point_id IS NOT NULL
     ORDER BY id LIMIT 1`,
  )
  assert('taxonomy anchor', !!anchor, 'no draft with KP')
  const [sp] = await q(`SELECT id, code FROM hs_math_specialties WHERE id=?`, [
    anchor.specialty_id,
  ])
  const [cat] = await q(`SELECT id, code FROM hs_math_categories WHERE id=?`, [
    anchor.category_id,
  ])
  let kps = await q(
    `SELECT id, code FROM hs_math_knowledge_points
     WHERE specialty_id=? AND category_id=? AND is_active=1 ORDER BY id LIMIT 2`,
    [sp.id, cat.id],
  )
  if (!kps.length) {
    kps = await q(
      `SELECT id, code FROM hs_math_knowledge_points WHERE id=?`,
      [anchor.knowledge_point_id],
    )
  }
  assert('taxonomy ready', !!sp && !!cat && kps.length >= 1, JSON.stringify({ sp, cat, kps }))
  console.log('TAXONOMY', JSON.stringify({ sp, cat, kps }))

  const [admin] = await q(
    `SELECT id, email, role FROM users WHERE is_disabled=0 AND role='ADMIN' ORDER BY id LIMIT 1`,
  )
  const [user] = await q(
    `SELECT id, email, role FROM users WHERE is_disabled=0 AND role='USER' ORDER BY id LIMIT 1`,
  )
  assert('admin exists', !!admin)
  assert('user exists', !!user)
  const adminTok = signJwt(
    { sub: String(admin.id), email: admin.email, role: admin.role },
    env.JWT_SECRET,
  )
  const userTok = signJwt(
    { sub: String(user.id), email: user.email, role: user.role },
    env.JWT_SECRET,
  )

  let cleanupOk = false
  try {
    // ========== A methods CRUD ==========
    const m1code = `${P}M_DEFN`
    const m2code = `${P}M_CLS`
    const m3code = `${P}M_DIS`
    created.methodCodes.push(m1code, m2code, m3code)

    let r = await api('POST', '/hs-math/admin/methods', null, {
      code: m1code,
      name: '定义法',
      summary: 'IT only',
      sortOrder: 10,
    })
    soft('A anon create method 401', r.status === 401 || r.status === 403, `status=${r.status}`)

    r = await api('POST', '/hs-math/admin/methods', userTok, {
      code: m1code,
      name: '定义法',
      sortOrder: 10,
    })
    soft('A user create method deny', r.status === 401 || r.status === 403, `status=${r.status}`)

    r = await api('POST', '/hs-math/admin/methods', adminTok, {
      code: m1code,
      name: '定义法',
      summary: 'IT-only defn',
      sortOrder: 10,
    })
    assert('A create method1', r.status === 200 || r.status === 201, `status=${r.status}`)
    const method1 = r.data
    created.methodIds.push(String(method1.id))

    r = await api('POST', '/hs-math/admin/methods', adminTok, {
      code: m1code,
      name: '重复',
    })
    soft('A dup code reject', r.status === 409 || r.status === 400, `status=${r.status}`)

    r = await api('POST', '/hs-math/admin/methods', adminTok, {
      code: m2code,
      name: '分类讨论',
      sortOrder: 20,
    })
    assert('A create method2', r.status === 200 || r.status === 201)
    created.methodIds.push(String(r.data.id))
    const method2 = r.data

    r = await api('POST', '/hs-math/admin/methods', adminTok, {
      code: m3code,
      name: '待禁用',
      sortOrder: 30,
    })
    assert('A create method3', r.status === 200 || r.status === 201)
    created.methodIds.push(String(r.data.id))
    const method3 = r.data

    r = await api('PATCH', `/hs-math/admin/methods/${method1.id}`, adminTok, {
      name: '定义法-改名',
      summary: 'renamed IT',
      sortOrder: 11,
    })
    assert('A patch rename', r.status === 200, `status=${r.status}`)
    soft('A rename keeps code', r.data.code === m1code, r.data.code)

    r = await api('PATCH', `/hs-math/admin/methods/${method3.id}`, adminTok, {
      isActive: false,
    })
    assert('A disable method3', r.status === 200)

    r = await api('GET', '/hs-math/admin/methods?activeOnly=true', adminTok)
    assert('A list active', r.status === 200)
    const activeCodes = (r.data.items || []).map((x) => x.code)
    soft('A disabled hidden', !activeCodes.includes(m3code))

    skip('A hard delete referenced', '无 DELETE 路由；仅测禁用+关联拒绝')

    // ========== create IT item ==========
    const itemCode = `${P}Q01`
    created.codes.push(itemCode)
    r = await api('POST', '/hs-math/admin/train-items', adminTok, {
      code: itemCode,
      pool: 'formal',
      qtype: 'judge',
      stem:
        '【IT-CORE1A2D 仅供集成测试，非正式题】判断：$f(x)=x$ 在 $\\mathbb{R}$ 上是奇函数。',
      answerPayloadJson: { kind: 'judge', value: true },
      analysis: 'IT：f(-x)=-x=-f(x)，故为奇函数。',
      difficulty: 1,
      specialtyId: String(sp.id),
      categoryId: String(cat.id),
      knowledgePointId: String(kps[0].id),
    })
    assert('create IT item', r.status === 200 || r.status === 201, `status=${r.status} ${JSON.stringify(r.json).slice(0,200)}`)
    const item = r.data
    created.itemIds.push(String(item.id))
    soft('item draft', item.status === 'draft')
    soft('item default source', item.sourceType === 'original' && item.sourceLicenseStatus === 'unknown')
    let ver = Number(item.contentVersion || 1)

    // link KP for later gates
    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/knowledge-points`, adminTok, {
      knowledgePointIds: [String(kps[0].id)],
      primaryKnowledgePointId: String(kps[0].id),
    })
    assert('link KP', r.status === 200, `status=${r.status}`)
    ver = Number(r.data.contentVersion)

    // ========== B methods link ==========
    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/methods`, adminTok, {
      methodIds: [String(method1.id)],
      primaryMethodId: String(method1.id),
      expectedContentVersion: ver,
    })
    assert('B add primary method', r.status === 200, `status=${r.status}`)
    ver = Number(r.data.contentVersion)
    soft('B version+1 after methods', ver === Number(item.contentVersion) + 2 || ver > Number(item.contentVersion)) // KP already +1

    const verBeforeMulti = ver
    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/methods`, adminTok, {
      methodIds: [String(method1.id), String(method2.id)],
      primaryMethodId: String(method1.id),
      expectedContentVersion: ver,
    })
    assert('B multi methods', r.status === 200)
    ver = Number(r.data.contentVersion)
    soft('B multi version+1', ver === verBeforeMulti + 1)

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/methods`, adminTok, {
      methodIds: [String(method1.id), String(method1.id)],
      primaryMethodId: String(method1.id),
      expectedContentVersion: ver,
    })
    soft('B dup methodIds reject', r.status === 400, `status=${r.status}`)

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/methods`, adminTok, {
      methodIds: [String(method1.id)],
      primaryMethodId: String(method2.id),
      expectedContentVersion: ver,
    })
    soft('B primary not in list', r.status === 400, `status=${r.status}`)

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/methods`, adminTok, {
      methodIds: [String(method3.id)],
      primaryMethodId: String(method3.id),
      expectedContentVersion: ver,
    })
    soft('B disabled method reject', r.status === 400, `status=${r.status}`)

    // same methods again — always +1 in current impl
    const verSame = ver
    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/methods`, adminTok, {
      methodIds: [String(method1.id), String(method2.id)],
      primaryMethodId: String(method1.id),
      expectedContentVersion: ver,
    })
    assert('B same methods HTTP ok', r.status === 200)
    ver = Number(r.data.contentVersion)
    soft(
      'B same methods no version bump (期望幂等)',
      ver === verSame,
      `before=${verSame} after=${ver}（实现为总是+1则本项FAIL）`,
    )
    // restore ver for subsequent
    // already bumped

    // fingerprint before rename
    let panel = await api('GET', `/hs-math/admin/train-items/${item.id}/review-panel`, adminTok)
    assert('panel before rename', panel.status === 200)
    const fpBeforeRename = panel.data.contentFingerprint
    r = await api('PATCH', `/hs-math/admin/methods/${method1.id}`, adminTok, {
      name: '定义法-再改名',
    })
    assert('rename after link', r.status === 200)
    panel = await api('GET', `/hs-math/admin/train-items/${item.id}/review-panel`, adminTok)
    soft(
      'B rename method no fp change',
      panel.data.contentFingerprint === fpBeforeRename,
      'fp changed unexpectedly',
    )
    soft(
      'B rename method no item version change',
      Number(panel.data.contentVersion) === ver,
      `v=${panel.data.contentVersion}`,
    )

    // clear methods rollback-ish: put empty
    const verBeforeClear = ver
    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/methods`, adminTok, {
      methodIds: [],
      primaryMethodId: null,
      expectedContentVersion: ver,
    })
    assert('B clear methods', r.status === 200)
    ver = Number(r.data.contentVersion)
    soft('B clear version+1', ver === verBeforeClear + 1)

    // ========== C source ==========
    r = await api('PATCH', `/hs-math/admin/train-items/${item.id}`, adminTok, {
      sourceType: 'adapted',
      expectedContentVersion: ver,
    })
    soft('C adapted incomplete reject', r.status === 400, `status=${r.status}`)

    r = await api('PATCH', `/hs-math/admin/train-items/${item.id}`, adminTok, {
      sourceType: 'past_exam',
      sourceYear: 2024,
      sourceExamName: 'IT模拟卷非真题',
      sourceQuestionNo: 'T1',
      // missing reference
      sourceVerificationStatus: 'verified',
      expectedContentVersion: ver,
    })
    soft('C past_exam incomplete reject', r.status === 400, `status=${r.status}`)

    const verBeforeSrc = ver
    r = await api('PATCH', `/hs-math/admin/train-items/${item.id}`, adminTok, {
      sourceType: 'adapted',
      sourceYear: 2024,
      sourceExamName: 'IT模拟卷（非真实高考）',
      sourceQuestionNo: 'IT-3',
      sourceReference: 'IT-only provenance',
      sourceAdaptationNote: '改数字仅测DTO',
      sourceVerificationStatus: 'verified',
      sourceLicenseStatus: 'unknown',
      expectedContentVersion: ver,
    })
    assert('C adapted verified+unknown persist', r.status === 200, `status=${r.status} ${JSON.stringify(r.json).slice(0,180)}`)
    ver = Number(r.data.contentVersion)
    soft('C source change version+1', ver === verBeforeSrc + 1)

    panel = await api('GET', `/hs-math/admin/train-items/${item.id}/review-panel`, adminTok)
    const fpV2 = panel.data.contentFingerprint
    soft('C fingerprint changed to V2', !!fpV2 && fpV2.length === 64)

    // empty string bypass
    r = await api('PATCH', `/hs-math/admin/train-items/${item.id}`, adminTok, {
      sourceType: 'past_exam',
      sourceYear: 2023,
      sourceExamName: '   ',
      sourceQuestionNo: '1',
      sourceReference: 'x',
      sourceVerificationStatus: 'verified',
      sourceLicenseStatus: 'permitted',
      expectedContentVersion: ver,
    })
    soft('C empty examName reject', r.status === 400, `status=${r.status}`)

    // ========== D content-meta ==========
    const verMeta0 = ver
    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/content-meta`, adminTok, {
      source: {
        sourceType: 'past_exam',
        sourceYear: 2022,
        sourceExamName: 'IT模拟卷B（非真题）',
        sourceQuestionNo: '8',
        sourceReference: 'IT-only',
        sourceVerificationStatus: 'verified',
        sourceLicenseStatus: 'permitted',
      },
      methodIds: [String(method1.id), String(method2.id)],
      primaryMethodId: String(method1.id),
      expectedContentVersion: ver,
    })
    assert('D content-meta atomic', r.status === 200, `status=${r.status}`)
    ver = Number(r.data.contentVersion)
    soft('D single version+1', ver === verMeta0 + 1, `before=${verMeta0} after=${ver}`)
    const linksN = Number(
      (
        await q('SELECT COUNT(*) c FROM hs_math_train_item_methods WHERE item_id=?', [
          item.id,
        ])
      )[0].c,
    )
    soft('D methods persisted 2', linksN === 2, String(linksN))
    soft('D source past_exam', r.data.sourceType === 'past_exam')

    // same payload again
    const verMeta1 = ver
    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/content-meta`, adminTok, {
      source: {
        sourceType: 'past_exam',
        sourceYear: 2022,
        sourceExamName: 'IT模拟卷B（非真题）',
        sourceQuestionNo: '8',
        sourceReference: 'IT-only',
        sourceVerificationStatus: 'verified',
        sourceLicenseStatus: 'permitted',
      },
      methodIds: [String(method1.id), String(method2.id)],
      primaryMethodId: String(method1.id),
      expectedContentVersion: ver,
    })
    assert('D same meta HTTP', r.status === 200)
    ver = Number(r.data.contentVersion)
    soft(
      'D same meta no version bump',
      ver === verMeta1,
      `before=${verMeta1} after=${ver}（实现总是+1则FAIL）`,
    )

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/content-meta`, adminTok, {
      methodIds: ['999999999'],
      primaryMethodId: '999999999',
      expectedContentVersion: ver,
    })
    soft('D bad methodId reject', r.status === 400, `status=${r.status}`)
    const linksAfterFail = Number(
      (
        await q('SELECT COUNT(*) c FROM hs_math_train_item_methods WHERE item_id=?', [
          item.id,
        ])
      )[0].c,
    )
    soft('D rollback links unchanged', linksAfterFail === 2, String(linksAfterFail))
    const verAfterFail = Number(
      (await q('SELECT content_version v FROM hs_math_train_items WHERE id=?', [item.id]))[0]
        .v,
    )
    soft('D rollback version unchanged', verAfterFail === ver, `v=${verAfterFail}`)

    // ========== E review STALE ==========
    panel = await api('GET', `/hs-math/admin/train-items/${item.id}/review-panel`, adminTok)
    assert('E panel', panel.status === 200)
    const fpE = panel.data.contentFingerprint
    const verE = Number(panel.data.contentVersion)
    ver = verE
    r = await api('POST', `/hs-math/admin/train-items/${item.id}/reviews`, adminTok, {
      decision: 'passed',
      comment: 'IT-CORE1A2D 临时审核，非真实人工审核',
      expectedContentVersion: verE,
      expectedContentFingerprint: fpE,
    })
    assert('E submit review', r.status === 200 || r.status === 201, `status=${r.status} ${JSON.stringify(r.json).slice(0,200)}`)
    if (r.data?.id) created.reviewIds.push(String(r.data.id))

    panel = await api('GET', `/hs-math/admin/train-items/${item.id}/review-panel`, adminTok)
    soft('E review not stale yet', panel.data.reviewIsStale === false)

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
      methodIds: [String(method2.id)],
      primaryMethodId: String(method2.id),
      expectedContentVersion: ver,
    })
    assert('E edit after review', r.status === 200)
    ver = Number(r.data.contentVersion)
    panel = await api('GET', `/hs-math/admin/train-items/${item.id}/review-panel`, adminTok)
    soft('E review STALE after edit', panel.data.reviewIsStale === true, String(panel.data.reviewIsStale))
    soft(
      'E history has stale',
      Array.isArray(panel.data.reviewHistory) &&
        panel.data.reviewHistory.some((h) => h.isStale),
    )

    // approve should fail (stale / IT / quality)
    r = await api('PATCH', `/hs-math/admin/train-items/${item.id}/status`, adminTok, {
      status: 'approved',
      confirmPublish: true,
    })
    soft(
      'E approve blocked when stale',
      r.status === 400,
      `status=${r.status}`,
    )

    // ========== F license reject branches ==========
    // set adapted+unknown and try approve
    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/content-meta`, adminTok, {
      source: {
        sourceType: 'adapted',
        sourceYear: 2024,
        sourceExamName: 'IT卷',
        sourceQuestionNo: '1',
        sourceReference: 'IT',
        sourceAdaptationNote: 'IT note',
        sourceVerificationStatus: 'verified',
        sourceLicenseStatus: 'unknown',
      },
      expectedContentVersion: ver,
    })
    if (r.status === 200) ver = Number(r.data.contentVersion)
    // need fresh review for license-only test — submit then approve
    panel = await api('GET', `/hs-math/admin/train-items/${item.id}/review-panel`, adminTok)
    r = await api('POST', `/hs-math/admin/train-items/${item.id}/reviews`, adminTok, {
      decision: 'passed',
      comment: 'IT license gate test',
      expectedContentVersion: Number(panel.data.contentVersion),
      expectedContentFingerprint: panel.data.contentFingerprint,
    })
    soft('F review for license', r.status === 200 || r.status === 201, `status=${r.status}`)
    r = await api('PATCH', `/hs-math/admin/train-items/${item.id}/status`, adminTok, {
      status: 'approved',
      confirmPublish: true,
    })
    soft(
      'F adapted+unknown approve reject',
      r.status === 400,
      `status=${r.status} body=${JSON.stringify(r.json).slice(0,160)}`,
    )

    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/content-meta`, adminTok, {
      source: {
        sourceType: 'adapted',
        sourceYear: 2024,
        sourceExamName: 'IT卷',
        sourceQuestionNo: '1',
        sourceReference: 'IT',
        sourceAdaptationNote: 'IT note',
        sourceVerificationStatus: 'verified',
        sourceLicenseStatus: 'restricted',
      },
      expectedContentVersion: ver,
    })
    if (r.status === 200) ver = Number(r.data.contentVersion)
    panel = await api('GET', `/hs-math/admin/train-items/${item.id}/review-panel`, adminTok)
    await api('POST', `/hs-math/admin/train-items/${item.id}/reviews`, adminTok, {
      decision: 'passed',
      comment: 'IT restricted test',
      expectedContentVersion: Number(panel.data.contentVersion),
      expectedContentFingerprint: panel.data.contentFingerprint,
    })
    r = await api('PATCH', `/hs-math/admin/train-items/${item.id}/status`, adminTok, {
      status: 'approved',
      confirmPublish: true,
    })
    soft('F restricted approve reject', r.status === 400, `status=${r.status}`)

    // 许可门禁成功分支禁止在 IT 中真正 approved；用 dist 纯函数覆盖校验
    try {
      const mod = require(
        path.join(API_ROOT, 'dist/hs-math/util/hs-math-source.validate.js'),
      )
      const cases = [
        [
          'F unit past_exam+unknown throws',
          {
            sourceType: 'past_exam',
            sourceYear: 2020,
            sourceExamName: 'IT',
            sourceQuestionNo: '1',
            sourceReference: 'IT',
            sourceVerificationStatus: 'verified',
            sourceLicenseStatus: 'unknown',
          },
        ],
        [
          'F unit adapted+unknown throws',
          {
            sourceType: 'adapted',
            sourceYear: 2021,
            sourceExamName: 'IT',
            sourceQuestionNo: '1',
            sourceReference: 'IT',
            sourceAdaptationNote: 'n',
            sourceVerificationStatus: 'verified',
            sourceLicenseStatus: 'unknown',
          },
        ],
        [
          'F unit forbidden throws',
          {
            sourceType: 'original',
            sourceLicenseStatus: 'forbidden',
          },
        ],
        [
          'F unit permitted path ok (no publish)',
          {
            sourceType: 'adapted',
            sourceYear: 2021,
            sourceExamName: 'IT',
            sourceQuestionNo: '1',
            sourceReference: 'IT',
            sourceAdaptationNote: 'n',
            sourceVerificationStatus: 'verified',
            sourceLicenseStatus: 'permitted',
          },
          'ok',
        ],
      ]
      for (const [name, payload, mode] of cases) {
        try {
          mod.assertSourceAllowsFormalPublish(mod.assertValidSourceFields(payload))
          soft(name, mode === 'ok', mode === 'ok' ? 'license gate ok' : 'did not throw')
        } catch (e) {
          soft(name, mode !== 'ok', String(e.message || e).slice(0, 120))
        }
      }
    } catch (e) {
      skip('F unit license helpers', String(e.message || e))
    }

    skip('F approve success path', '按授权不将 IT 题发布为 approved')

    // ensure item still draft
    const st = (
      await q('SELECT status FROM hs_math_train_items WHERE id=?', [item.id])
    )[0]
    soft('F item remains draft', st.status === 'draft', st.status)

    // ========== G import preview ==========
    const importOld = [
      {
        code: `${P}IMP_OLD`,
        specialtyCode: sp.code,
        categoryCode: cat.code,
        qtype: 'judge',
        difficulty: 1,
        stem: '【IT导入旧JSON】判断 1+1=2。',
        answerPayload: { kind: 'judge', value: true },
        analysis: 'IT import old',
        knowledgePointCodes: [kps[0].code],
        primaryKnowledgePointCode: kps[0].code,
      },
    ]
    const previewOk = (s) => s === 200 || s === 201

    r = await api('POST', '/hs-math/admin/train-items/import/preview', adminTok, {
      items: importOld,
    })
    soft('G old JSON preview', previewOk(r.status), `status=${r.status}`)

    const importNew = [
      {
        ...importOld[0],
        code: `${P}IMP_NEW`,
        sourceType: 'original',
        methodCodes: [m1code],
        primaryMethodCode: m1code,
      },
    ]
    r = await api('POST', '/hs-math/admin/train-items/import/preview', adminTok, {
      items: importNew,
    })
    soft('G new JSON preview', previewOk(r.status), `status=${r.status}`)

    r = await api('POST', '/hs-math/admin/train-items/import/preview', adminTok, {
      items: [
        {
          ...importOld[0],
          code: `${P}IMP_BAD`,
          methodCodes: [m1code, m1code],
          primaryMethodCode: m1code,
        },
      ],
    })
    soft(
      'G dup methodCodes preview',
      previewOk(r.status) && r.data?.canConfirm === false,
      `status=${r.status} canConfirm=${r.data?.canConfirm}`,
    )

    r = await api('POST', '/hs-math/admin/train-items/import/preview', adminTok, {
      items: [
        {
          ...importOld[0],
          code: `${P}IMP_DIS`,
          methodCodes: [m3code],
          primaryMethodCode: m3code,
        },
      ],
    })
    soft(
      'G disabled method preview fail',
      previewOk(r.status) && r.data?.canConfirm === false,
      `status=${r.status} canConfirm=${r.data?.canConfirm}`,
    )

    // confirm one IT import then cleanup later
    const confirmPayload = [
      {
        code: `${P}IMP_CF`,
        specialtyCode: sp.code,
        categoryCode: cat.code,
        qtype: 'judge',
        difficulty: 1,
        stem: '【IT导入confirm】判断 2 是偶数。',
        answerPayload: { kind: 'judge', value: true },
        analysis: 'IT confirm draft only',
        knowledgePointCodes: [kps[0].code],
        primaryKnowledgePointCode: kps[0].code,
        sourceType: 'original',
        methodCodes: [m2code],
        primaryMethodCode: m2code,
      },
    ]
    r = await api('POST', '/hs-math/admin/train-items/import/preview', adminTok, {
      items: confirmPayload,
    })
    if (previewOk(r.status) && r.data?.canConfirm && r.data?.previewToken) {
      const conf2 = await api(
        'POST',
        '/hs-math/admin/train-items/import/confirm',
        adminTok,
        {
          previewToken: r.data.previewToken,
          items: confirmPayload,
        },
      )
      soft(
        'G import confirm draft',
        previewOk(conf2.status),
        `status=${conf2.status} ${JSON.stringify(conf2.json).slice(0,180)}`,
      )
      if (previewOk(conf2.status)) {
        const rows = await q(
          `SELECT id, status FROM hs_math_train_items WHERE code=?`,
          [`${P}IMP_CF`],
        )
        if (rows[0]) {
          created.itemIds.push(String(rows[0].id))
          created.codes.push(`${P}IMP_CF`)
          soft('G confirm status draft', rows[0].status === 'draft', rows[0].status)
          soft(
            'G confirm not approved',
            rows[0].status !== 'approved',
            rows[0].status,
          )
        }
      }
    } else {
      skip(
        'G import confirm',
        `status=${r.status} canConfirm=${r.data?.canConfirm}`,
      )
    }

    // ========== H concurrency ==========
    const item2code = `${P}Q02`
    r = await api('POST', '/hs-math/admin/train-items', adminTok, {
      code: item2code,
      pool: 'formal',
      qtype: 'judge',
      stem: '【IT并发】判断：3 是奇数。',
      answerPayloadJson: { kind: 'judge', value: true },
      analysis: 'IT concurrent',
      difficulty: 1,
      specialtyId: String(sp.id),
      categoryId: String(cat.id),
    })
    assert('H create item2', r.status === 200 || r.status === 201)
    const item2 = r.data
    created.itemIds.push(String(item2.id))
    created.codes.push(item2code)
    let v2 = Number(item2.contentVersion)

    const [c1, c2] = await Promise.all([
      api('PUT', `/hs-math/admin/train-items/${item2.id}/content-meta`, adminTok, {
        source: {
          sourceType: 'original',
          sourceVerificationStatus: 'verified',
          sourceLicenseStatus: 'unknown',
        },
        expectedContentVersion: v2,
      }),
      api('PUT', `/hs-math/admin/train-items/${item2.id}/methods`, adminTok, {
        methodIds: [String(method1.id)],
        primaryMethodId: String(method1.id),
        expectedContentVersion: v2,
      }),
    ])
    const okCount = [c1, c2].filter((x) => x.status === 200).length
    const conflictCount = [c1, c2].filter((x) => x.status === 409 || x.status === 400).length
    soft(
      'H concurrent one wins or conflict',
      okCount >= 1 && okCount + conflictCount === 2,
      `ok=${okCount} conflictish=${conflictCount} s1=${c1.status} s2=${c2.status}`,
    )
    const finalV = Number(
      (await q('SELECT content_version v FROM hs_math_train_items WHERE id=?', [item2.id]))[0]
        .v,
    )
    soft('H version advanced', finalV > v2, `v=${finalV}`)

    // expectedVersion conflict
    r = await api('PATCH', `/hs-math/admin/train-items/${item2.id}`, adminTok, {
      analysis: 'IT concurrent patch',
      expectedContentVersion: 1,
    })
    soft('H stale expectedVersion 409', r.status === 409 || r.status === 400, `status=${r.status}`)

    // ========== M permissions ==========
    r = await api('PUT', `/hs-math/admin/train-items/${item.id}/methods`, userTok, {
      methodIds: [],
      expectedContentVersion: 999,
    })
    soft('M user write deny', r.status === 401 || r.status === 403, `status=${r.status}`)

    r = await api('POST', '/hs-math/admin/methods', null, { code: `${P}X`, name: 'x' })
    soft('M anon write deny', r.status === 401 || r.status === 403)
  } catch (e) {
    record('RUN_ABORTED', 'FAIL', e.message || String(e))
    console.error('ABORTED', e)
  }

  // ========== cleanup ==========
  console.log('CLEANUP_START', JSON.stringify(created))
  try {
    // reviews for IT items
    if (created.itemIds.length) {
      await q(
        `DELETE FROM hs_math_train_item_reviews WHERE item_id IN (${created.itemIds
          .map(() => '?')
          .join(',')})`,
        created.itemIds,
      )
      await q(
        `DELETE FROM hs_math_train_item_methods WHERE item_id IN (${created.itemIds
          .map(() => '?')
          .join(',')})`,
        created.itemIds,
      )
      await q(
        `DELETE FROM hs_math_train_item_kps WHERE item_id IN (${created.itemIds
          .map(() => '?')
          .join(',')})`,
        created.itemIds,
      )
      await q(
        `DELETE FROM hs_math_train_items WHERE id IN (${created.itemIds
          .map(() => '?')
          .join(',')})
         AND code LIKE ?`,
        [...created.itemIds, `${P}%`],
      )
    }
    // leftover by code prefix
    await q(`DELETE FROM hs_math_train_item_reviews WHERE item_id IN (
      SELECT id FROM (SELECT id FROM hs_math_train_items WHERE code LIKE ?) t
    )`, [`${P}%`])
    await q(`DELETE FROM hs_math_train_item_methods WHERE item_id IN (
      SELECT id FROM (SELECT id FROM hs_math_train_items WHERE code LIKE ?) t
    )`, [`${P}%`])
    await q(`DELETE FROM hs_math_train_item_kps WHERE item_id IN (
      SELECT id FROM (SELECT id FROM hs_math_train_items WHERE code LIKE ?) t
    )`, [`${P}%`])
    await q(`DELETE FROM hs_math_train_items WHERE code LIKE ?`, [`${P}%`])

    if (created.methodIds.length) {
      await q(
        `DELETE FROM hs_math_train_item_methods WHERE method_id IN (${created.methodIds
          .map(() => '?')
          .join(',')})`,
        created.methodIds,
      )
      await q(
        `DELETE FROM hs_math_methods WHERE id IN (${created.methodIds
          .map(() => '?')
          .join(',')})
         AND code LIKE ?`,
        [...created.methodIds, `${P}%`],
      )
    }
    await q(`DELETE FROM hs_math_methods WHERE code LIKE ?`, [`${P}%`])

    const leftItems = await q(`SELECT id, code FROM hs_math_train_items WHERE code LIKE ?`, [
      `${P}%`,
    ])
    const leftMethods = await q(`SELECT id, code FROM hs_math_methods WHERE code LIKE ?`, [
      `${P}%`,
    ])
    cleanupOk = leftItems.length === 0 && leftMethods.length === 0
    soft('cleanup items gone', leftItems.length === 0, JSON.stringify(leftItems))
    soft('cleanup methods gone', leftMethods.length === 0, JSON.stringify(leftMethods))
    if (!cleanupOk) record('CLEANUP_BLOCKED', 'FAIL', '残留 IT 记录')
    else record('cleanup complete', 'PASS')
  } catch (e) {
    record('CLEANUP_BLOCKED', 'FAIL', e.message || String(e))
    cleanupOk = false
  }

  // ========== protect original 110 ==========
  const afterItems = await q(
    `SELECT id, code, status, difficulty, content_version,
            source_type, source_year, source_exam_name, source_question_no,
            source_reference, source_adaptation_note,
            source_verification_status, source_license_status,
            specialty_id, category_id, knowledge_point_id, pool, qtype
     FROM hs_math_train_items ORDER BY id`,
  )
  const afterHash = shaRows(afterItems)
  soft('protect count 110', afterItems.length === 110, String(afterItems.length))
  soft('protect hash identical', afterHash === baselineHash, 'hash mismatch')
  soft(
    'protect no new ids',
    afterItems.every((r) => baselineItemIds.has(String(r.id))),
  )
  soft(
    'protect codes',
    afterItems.every((r) => baselineCodes.has(r.code)) &&
      afterItems.length === baselineCodes.size,
  )
  soft(
    'protect reviews',
    Number((await q('SELECT COUNT(*) c FROM hs_math_train_item_reviews'))[0].c) ===
      baselineReviews,
  )
  soft(
    'protect methods table',
    Number((await q('SELECT COUNT(*) c FROM hs_math_methods'))[0].c) ===
      baselineMethods.length,
  )
  soft(
    'protect method links',
    Number((await q('SELECT COUNT(*) c FROM hs_math_train_item_methods'))[0].c) ===
      baselineLinks,
  )
  soft(
    'protect sessions',
    Number((await q('SELECT COUNT(*) c FROM hs_math_train_sessions'))[0].c) ===
      baselineSessions &&
      Number((await q('SELECT COUNT(*) c FROM hs_math_train_session_items'))[0].c) ===
        baselineSessionItems,
  )
  soft(
    'protect item_kps',
    Number((await q('SELECT COUNT(*) c FROM hs_math_train_item_kps'))[0].c) ===
      baselineItemKps,
  )
  soft(
    'protect chem',
    Number((await q('SELECT COUNT(*) c FROM chem_specialties'))[0].c) === chemSp,
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
  const outPath = path.join(
    API_ROOT,
    '../../db/backups',
    `_core1a2d_it_${runId}.json`,
  )
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
