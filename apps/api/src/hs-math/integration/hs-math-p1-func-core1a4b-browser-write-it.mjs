/**
 * P1-FUNC-CORE-1A-4B ? ?????/???????? IT
 * ???HS_MATH_CORE1A4B_IT_<runId>_
 * ? study_system?????? 110 ? / ?? / ????
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

const PREFIX = 'HS_MATH_CORE1A4B_IT_'
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
  const body = Buffer.from(
    JSON.stringify({ ...payload, iat: now, exp: now + 7200 }),
  ).toString('base64url')
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url')
  return `${header}.${body}.${sig}`
}
function record(name, status, detail = '') {
  results.push({ name, status, detail })
  console.log(`${status} ${name}${detail ? ' | ' + detail : ''}`)
}
function soft(name, cond, detail = '') {
  record(name, cond ? 'PASS' : 'FAIL', detail)
  return !!cond
}
function assert(name, cond, detail = '') {
  soft(name, cond, detail)
  if (!cond) throw new Error(`FAIL ${name}: ${detail}`)
}
function skip(name, detail) {
  record(name, 'NOT_RUN', detail)
}
/** ???????? PASS????????????? FAIL */
function capabilityGap(name, detail) {
  record(name, 'CAPABILITY_GAP', detail)
}
function shaRows(rows) {
  return createHash('sha256').update(JSON.stringify(rows)).digest('hex')
}
function reasonsMentionRestricted(reasons) {
  const arr = Array.isArray(reasons) ? reasons : []
  return arr.some((x) => /restricted/i.test(String(x || '')))
}
/** Exact text from hs-math-source.validate.ts assertSourceAllowsFormalPublish (ASCII + escapes) */
const RESTRICTED_PUBLISH_MSG =
  'source_license_status=restricted\uFF0C\u7981\u6B62\u6B63\u5F0F\u6279\u51C6\u5230\u516C\u5F00\u5B66\u751F\u6C60'

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
    json = { raw: text.slice(0, 400) }
  }
  return { status: res.status, json, data: json?.data ?? json }
}

function adaptedSource(runId, extra = {}) {
  return {
    sourceType: 'adapted',
    sourceYear: 2024,
    sourceExamName: 'IT-mock-paper-not-gaokao',
    sourceQuestionNo: 'IT-1',
    sourceReference: `IT-only ref ${runId}`,
    sourceAdaptationNote: `IT-only adaptation note ${runId}`,
    sourceVerificationStatus: 'verified',
    sourceLicenseStatus: 'unknown',
    ...extra,
  }
}

async function main() {
  const env = loadEnv()
  if ((env.DB_NAME || 'study_system') !== 'study_system') {
    throw new Error(`refuse: DB_NAME=${env.DB_NAME}`)
  }

  // Static check (no DB / no HTTP): restricted formal-publish message still in source
  try {
    const validateSrc = fs.readFileSync(
      path.join(__dirname, '../util/hs-math-source.validate.ts'),
      'utf8',
    )
    soft(
      'static restricted publish msg present',
      validateSrc.includes(RESTRICTED_PUBLISH_MSG),
      'hs-math-source.validate.ts must keep restricted formal-publish reject text',
    )
  } catch (e) {
    soft('static restricted publish msg present', false, String(e?.message || e))
  }

  const runId = `${new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14)}_${crypto.randomBytes(2).toString('hex')}`
  const P = `${PREFIX}${runId}_`
  console.log('RUN_ID', runId)
  console.log('PREFIX', P)

  const skipCleanup = process.env.HS_MATH_4B_SKIP_CLEANUP === '1'
  const cleanupOnly = process.env.HS_MATH_4B_CLEANUP_ONLY
  if (!cleanupOnly) {
    const health = await fetch('http://127.0.0.1:3000/health')
    assert('api health', health.status === 200, String(health.status))
  }

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
            specialty_id, category_id, knowledge_point_id, pool, qtype,
            LEFT(stem,120) stem120, LEFT(IFNULL(analysis,''),80) analysis80
     FROM hs_math_train_items
     WHERE code NOT LIKE ?
     ORDER BY id`,
    [`${PREFIX}%`],
  )
  const baselineHash = shaRows(baselineItems)
  const baselineItemIds = new Set(baselineItems.map((r) => String(r.id)))
  const baselineCodes = new Set(baselineItems.map((r) => r.code))
  const baselineReviews = Number((await q('SELECT COUNT(*) c FROM hs_math_train_item_reviews'))[0].c)
  const baselineMethodsAll = await q(
    'SELECT id, code, name, is_active, sort_order FROM hs_math_methods ORDER BY id',
  )
  const baselineMethodsNonIt = baselineMethodsAll.filter((r) => !String(r.code).startsWith(PREFIX))
  const baselineLinks = Number((await q('SELECT COUNT(*) c FROM hs_math_train_item_methods'))[0].c)
  const baselineSessions = Number((await q('SELECT COUNT(*) c FROM hs_math_train_sessions'))[0].c)
  const baselineSessionItems = Number(
    (await q('SELECT COUNT(*) c FROM hs_math_train_session_items'))[0].c,
  )
  const chemSp = Number((await q('SELECT COUNT(*) c FROM chem_specialties'))[0].c)
  const kpLinksHash = shaRows(
    await q(
      `SELECT k.item_id, k.knowledge_point_id, k.is_primary, k.sort_order
       FROM hs_math_train_item_kps k
       INNER JOIN hs_math_train_items i ON i.id = k.item_id
       WHERE i.code NOT LIKE ?
       ORDER BY k.item_id, k.sort_order, k.id`,
      [`${PREFIX}%`],
    ),
  )
  const statusDist = (
    await q(
      `SELECT SUM(status='draft') d, SUM(status='disabled') x, SUM(status='approved') a
       FROM hs_math_train_items WHERE code NOT LIKE ?`,
      [`${PREFIX}%`],
    )
  )[0]
  const parity = (
    await q(
      `SELECT COUNT(*) c, SUM(difficulty=1) d1, SUM(difficulty=2) d2, SUM(difficulty=3) d3
       FROM hs_math_train_items WHERE code LIKE 'HSMA-RJA-CH03-PARITY-%'`,
    )
  )[0]

  assert('baseline total 110', baselineItems.length === 110, String(baselineItems.length))
  soft(
    'baseline status 105/5/0',
    Number(statusDist.d) === 105 && Number(statusDist.x) === 5 && Number(statusDist.a) === 0,
    JSON.stringify(statusDist),
  )
  soft('baseline methods empty', baselineMethodsNonIt.length === 0, String(baselineMethodsNonIt.length))
  soft('baseline reviews 0', baselineReviews === 0)
  soft(
    'baseline parity 16/7/2',
    Number(parity.c) === 25 &&
      Number(parity.d1) === 16 &&
      Number(parity.d2) === 7 &&
      Number(parity.d3) === 2,
    JSON.stringify(parity),
  )
  soft('baseline chem 12', chemSp === 12, String(chemSp))
  soft('baseline sessions 39', baselineSessions === 39, String(baselineSessions))
  soft('baseline session_items 195', baselineSessionItems === 195, String(baselineSessionItems))
  console.log('BASELINE_HASH', baselineHash.slice(0, 24))

  const leftoverItems = await q(`SELECT id, code FROM hs_math_train_items WHERE code LIKE ?`, [
    `${PREFIX}%`,
  ])
  const leftoverMethods = await q(`SELECT id, code FROM hs_math_methods WHERE code LIKE ?`, [
    `${PREFIX}%`,
  ])
  if (leftoverItems.length || leftoverMethods.length) {
    console.log('PREEXISTING_IT', JSON.stringify({ leftoverItems, leftoverMethods }))
  }

  const [anchor] = await q(
    `SELECT specialty_id, category_id FROM hs_math_train_items
     WHERE status='draft' AND code NOT LIKE ? ORDER BY id LIMIT 1`,
    [`${PREFIX}%`],
  )
  assert('taxonomy anchor', !!anchor)
  const [sp] = await q(`SELECT id, code FROM hs_math_specialties WHERE id=?`, [anchor.specialty_id])
  const [cat] = await q(`SELECT id, code FROM hs_math_categories WHERE id=?`, [anchor.category_id])
  const kps = await q(
    `SELECT id, code FROM hs_math_knowledge_points
     WHERE specialty_id=? AND is_active=1 ORDER BY id LIMIT 2`,
    [sp.id],
  )
  assert('kps>=1', kps.length >= 1)

  const [admin] = await q(
    `SELECT id, email, role FROM users WHERE is_disabled=0 AND role='ADMIN' ORDER BY id LIMIT 1`,
  )
  const [user] = await q(
    `SELECT id, email, role FROM users WHERE is_disabled=0 AND role='USER' ORDER BY id LIMIT 1`,
  )
  assert('admin', !!admin)
  if (!user) skip('J user jwt', 'no USER role account')
  const adminTok = signJwt(
    { sub: String(admin.id), email: admin.email, role: admin.role },
    env.JWT_SECRET,
  )
  const userTok = user
    ? signJwt({ sub: String(user.id), email: user.email, role: user.role }, env.JWT_SECRET)
    : null

  let cleanupBlocked = false
  let cleanupOk = false
  if (cleanupOnly) {
    const Ponly = cleanupOnly.endsWith('_') ? cleanupOnly : `${cleanupOnly}_`
    console.log('CLEANUP_ONLY', Ponly)
    const items = await q(`SELECT id, code FROM hs_math_train_items WHERE code LIKE ?`, [
      `${Ponly}%`,
    ])
    const methods = await q(`SELECT id, code FROM hs_math_methods WHERE code LIKE ?`, [
      `${Ponly}%`,
    ])
    console.log('CLEANUP_TARGETS', JSON.stringify({ items, methods }))
    const itemIds = items.map((r) => String(r.id))
    const methodIds = methods.map((r) => String(r.id))
    if (itemIds.length) {
      await q(
        `DELETE FROM hs_math_train_item_reviews WHERE item_id IN (${itemIds.map(() => '?').join(',')})`,
        itemIds,
      )
      await q(
        `DELETE FROM hs_math_train_item_methods WHERE item_id IN (${itemIds.map(() => '?').join(',')})`,
        itemIds,
      )
      await q(
        `DELETE FROM hs_math_train_item_kps WHERE item_id IN (${itemIds.map(() => '?').join(',')})`,
        itemIds,
      )
      await q(
        `DELETE FROM hs_math_train_items WHERE id IN (${itemIds.map(() => '?').join(',')}) AND code LIKE ?`,
        [...itemIds, `${Ponly}%`],
      )
    }
    if (methodIds.length) {
      await q(
        `DELETE FROM hs_math_train_item_methods WHERE method_id IN (${methodIds.map(() => '?').join(',')})`,
        methodIds,
      )
      await q(
        `DELETE FROM hs_math_methods WHERE id IN (${methodIds.map(() => '?').join(',')}) AND code LIKE ?`,
        [...methodIds, `${Ponly}%`],
      )
    }
    const leftI = await q(`SELECT code FROM hs_math_train_items WHERE code LIKE ?`, [`${Ponly}%`])
    const leftM = await q(`SELECT code FROM hs_math_methods WHERE code LIKE ?`, [`${Ponly}%`])
    console.log('CLEANUP_ONLY_LEFT', { items: leftI, methods: leftM })
    await conn.end()
    process.exit(leftI.length || leftM.length ? 1 : 0)
  }

  try {
    const codes = {
      def: `${P}DEF`,
      case: `${P}CASE`,
      graph: `${P}GRAPH`,
    }
    created.methodCodes.push(codes.def, codes.case, codes.graph)

    let r = await api('POST', '/hs-math/admin/methods', adminTok, {
      code: codes.def,
      name: `[IT]defn ${runId}`,
      summary: 'CORE1A4B IT only',
      sortOrder: 10,
      isActive: true,
    })
    assert('A1 create DEF', r.status === 200 || r.status === 201, `s=${r.status}`)
    const mDef = r.data
    created.methodIds.push(String(mDef.id))

    r = await api('POST', '/hs-math/admin/methods', adminTok, {
      code: codes.def,
      name: 'dup',
    })
    soft('A2 duplicate code 409', r.status === 409, `s=${r.status}`)

    r = await api('POST', '/hs-math/admin/methods', adminTok, {
      code: codes.case,
      name: `[IT]case ${runId}`,
      summary: 'IT',
      sortOrder: 20,
    })
    assert('A create CASE', r.status === 200 || r.status === 201)
    const mCase = r.data
    created.methodIds.push(String(mCase.id))

    r = await api('POST', '/hs-math/admin/methods', adminTok, {
      code: codes.graph,
      name: `[IT]graph ${runId}`,
      summary: 'IT',
      sortOrder: 30,
    })
    assert('A create GRAPH', r.status === 200 || r.status === 201)
    const mGraph = r.data
    created.methodIds.push(String(mGraph.id))

    r = await api('PATCH', `/hs-math/admin/methods/${mDef.id}`, adminTok, {
      name: `[IT]defn-edited ${runId}`,
      summary: 'IT summary edited',
      sortOrder: 11,
    })
    soft('A3-5 edit name/summary/sort', r.status === 200, `s=${r.status}`)

    r = await api('PATCH', `/hs-math/admin/methods/${mGraph.id}`, adminTok, { isActive: false })
    soft('A6 disable GRAPH', r.status === 200 && r.data?.isActive === false, `s=${r.status}`)

    r = await api('PATCH', `/hs-math/admin/methods/${mGraph.id}`, adminTok, { isActive: true })
    soft('A7 re-enable GRAPH', r.status === 200 && r.data?.isActive === true)

    r = await api('GET', `/hs-math/admin/methods?q=${encodeURIComponent(codes.def)}`, adminTok)
    const listedQ = r.data?.items || r.data || []
    const listedArr = Array.isArray(listedQ) ? listedQ : listedQ.items || []
    r = await api('GET', '/hs-math/admin/methods', adminTok)
    const listed = r.data?.items || []
    soft(
      'A8 list contains IT',
      listed.some((x) => x.code === codes.def) && listed.some((x) => x.code === codes.case),
      `n=${listed.length}`,
    )
    skip('A8-A12 browser search/filter/cancel', 'UI-only; API list verified')

    r = await api('GET', '/hs-math/admin/methods?activeOnly=true', adminTok)
    soft(
      'A10 activeOnly excludes disabled if any',
      (r.data?.items || []).every((x) => x.isActive !== false),
    )

    const mkItem = async (suffix, stem) => {
      const code = `${P}${suffix}`
      created.codes.push(code)
      const res = await api('POST', '/hs-math/admin/train-items', adminTok, {
        code,
        // formal + draft??????? STALE???? approve?code ? IT ??
        pool: 'formal',
        qtype: 'single',
        stem: `${stem} ?CORE1A4B IT ${runId} ????`,
        optionsJson: {
          options: [
            { id: 'A', text: '1' },
            { id: 'B', text: '2' },
            { id: 'C', text: '3' },
            { id: 'D', text: '4' },
          ],
        },
        answerPayloadJson: { kind: 'single', optionId: 'A' },
        analysis: `IT analysis ${runId}`,
        difficulty: 1,
        specialtyId: String(sp.id),
        categoryId: String(cat.id),
        knowledgePointId: String(kps[0].id),
      })
      assert(`create item ${suffix}`, res.status === 200 || res.status === 201, `s=${res.status}`)
      created.itemIds.push(String(res.data.id))
      return res.data
    }

    const item1 = await mkItem('Q01', 'If odd function f(x)=x, which is correct')
    const item2 = await mkItem('Q02', 'Even g with g(2)=3, then g(-2) equals')

    soft('items draft', item1.status === 'draft' && item2.status === 'draft')
    soft('items not approved', item1.status !== 'approved' && item2.status !== 'approved')

    soft(
      'B1 default source',
      (item1.sourceType || 'original') === 'original' &&
        (item1.sourceVerificationStatus || 'unverified') === 'unverified' &&
        (item1.sourceLicenseStatus || 'unknown') === 'unknown',
      JSON.stringify({
        t: item1.sourceType,
        v: item1.sourceVerificationStatus,
        l: item1.sourceLicenseStatus,
      }),
    )

    let v0 = Number(item1.contentVersion || 1)
    const srcBeforeB3 = (
      await q(
        `SELECT source_type, source_verification_status, source_license_status, content_version
         FROM hs_math_train_items WHERE id=?`,
        [item1.id],
      )
    )[0]

    // ---------- B3_prime?adapted + unverified ? 400???????? ----------
    r = await api('PUT', `/hs-math/admin/train-items/${item1.id}/content-meta`, adminTok, {
      source: adaptedSource(runId, { sourceVerificationStatus: 'unverified' }),
      expectedContentVersion: v0,
    })
    soft(
      'B3_prime http 400',
      r.status === 400,
      `s=${r.status} ${JSON.stringify(r.json?.message || '')}`,
    )
    const afterPrime = (
      await q(
        `SELECT source_type, source_verification_status, source_license_status, content_version
         FROM hs_math_train_items WHERE id=?`,
        [item1.id],
      )
    )[0]
    soft(
      'B3_prime no persist',
      String(afterPrime.source_type) === String(srcBeforeB3.source_type) &&
        String(afterPrime.source_verification_status) ===
          String(srcBeforeB3.source_verification_status),
      JSON.stringify(afterPrime),
    )
    soft(
      'B3_prime version unchanged',
      Number(afterPrime.content_version) === v0 &&
        Number(
          (await api('GET', `/hs-math/admin/train-items/${item1.id}`, adminTok)).data
            .contentVersion,
        ) === v0,
      `v=${afterPrime.content_version}`,
    )

    // ---------- B3_double?adapted + verified + IT ?? ? 200?+1??? ----------
    r = await api('PUT', `/hs-math/admin/train-items/${item1.id}/content-meta`, adminTok, {
      source: adaptedSource(runId),
      expectedContentVersion: v0,
    })
    soft(
      'B3_double http 200',
      r.status === 200,
      `s=${r.status} ${JSON.stringify(r.json?.message || '')}`,
    )
    let cur = r.data
    soft(
      'B3_double version+1',
      Number(cur?.contentVersion) === v0 + 1,
      `v=${cur?.contentVersion}`,
    )
    const afterDouble = (
      await q(
        `SELECT source_type, source_verification_status, source_adaptation_note, content_version
         FROM hs_math_train_items WHERE id=?`,
        [item1.id],
      )
    )[0]
    soft(
      'B3_double persisted',
      afterDouble.source_type === 'adapted' &&
        afterDouble.source_verification_status === 'verified' &&
        String(afterDouble.source_adaptation_note || '').includes(runId) &&
        Number(afterDouble.content_version) === v0 + 1,
      JSON.stringify(afterDouble),
    )
    v0 = Number(cur?.contentVersion || afterDouble.content_version || v0)

    // verified ? canPublish
    const panelAfterB3d = await api(
      'GET',
      `/hs-math/admin/train-items/${item1.id}/review-panel`,
      adminTok,
    )
    soft(
      'B3_double canPublish false',
      panelAfterB3d.status === 200 && panelAfterB3d.data?.canPublish === false,
      JSON.stringify({
        canPublish: panelAfterB3d.data?.canPublish,
        reasons: panelAfterB3d.data?.publishBlockReasons,
      }),
    )

    r = await api('PUT', `/hs-math/admin/train-items/${item1.id}/content-meta`, adminTok, {
      source: adaptedSource(runId),
      expectedContentVersion: v0,
    })
    soft('B4 noop no bump', r.status === 200 && Number(r.data.contentVersion) === v0, `v=${r.data?.contentVersion}`)

    r = await api('PUT', `/hs-math/admin/train-items/${item1.id}/content-meta`, adminTok, {
      source: adaptedSource(runId, { sourceLicenseStatus: 'restricted' }),
      expectedContentVersion: v0,
    })
    soft('B5 license bump', r.status === 200 && Number(r.data.contentVersion) === v0 + 1)
    v0 = Number(r.data?.contentVersion || v0)

    r = await api('PUT', `/hs-math/admin/train-items/${item1.id}/content-meta`, adminTok, {
      source: {
        sourceType: 'original',
        sourceYear: null,
        sourceExamName: null,
        sourceQuestionNo: null,
        sourceReference: null,
        sourceAdaptationNote: null,
        sourceVerificationStatus: 'unverified',
        sourceLicenseStatus: 'unknown',
      },
      expectedContentVersion: v0,
    })
    soft('B6 original', r.status === 200 && r.data.sourceType === 'original')
    v0 = Number(r.data?.contentVersion || v0)

    r = await api('PUT', `/hs-math/admin/train-items/${item1.id}/content-meta`, adminTok, {
      source: adaptedSource(runId, {
        sourceExamName: '',
        sourceQuestionNo: '',
        sourceReference: '',
        sourceAdaptationNote: '',
        sourceVerificationStatus: 'verified',
      }),
      expectedContentVersion: v0,
    })
    soft('B8 incomplete adapted reject', r.status === 400, `s=${r.status}`)
    soft(
      'B8 no partial version',
      Number((await api('GET', `/hs-math/admin/train-items/${item1.id}`, adminTok)).data.contentVersion) ===
        v0,
    )

    r = await api('PUT', `/hs-math/admin/train-items/${item1.id}/content-meta`, adminTok, {
      methodIds: [mDef.id, mCase.id, mGraph.id],
      primaryMethodId: mDef.id,
      expectedContentVersion: v0,
    })
    soft('C1-3 set primary+aux', r.status === 200, `s=${r.status}`)
    if (r.status === 200) v0 = Number(r.data.contentVersion)
    soft(
      'C4 db links',
      Number(
        (await q('SELECT COUNT(*) c FROM hs_math_train_item_methods WHERE item_id=?', [item1.id]))[0].c,
      ) === 3,
    )

    r = await api('PUT', `/hs-math/admin/train-items/${item1.id}/content-meta`, adminTok, {
      methodIds: [mDef.id, mCase.id, mGraph.id],
      primaryMethodId: mDef.id,
      expectedContentVersion: v0,
    })
    soft('C5 noop methods', r.status === 200 && Number(r.data.contentVersion) === v0)

    r = await api('PUT', `/hs-math/admin/train-items/${item1.id}/content-meta`, adminTok, {
      methodIds: [mDef.id, mCase.id, mGraph.id],
      primaryMethodId: mCase.id,
      expectedContentVersion: v0,
    })
    soft('C6 switch primary bump', r.status === 200 && Number(r.data.contentVersion) === v0 + 1)
    v0 = Number(r.data?.contentVersion || v0)

    r = await api('PUT', `/hs-math/admin/train-items/${item1.id}/content-meta`, adminTok, {
      methodIds: [mDef.id, mCase.id],
      primaryMethodId: mCase.id,
      expectedContentVersion: v0,
    })
    soft('C7 drop aux bump', r.status === 200 && Number(r.data.contentVersion) === v0 + 1)
    v0 = Number(r.data?.contentVersion || v0)

    r = await api('PUT', `/hs-math/admin/train-items/${item1.id}/content-meta`, adminTok, {
      methodIds: [mDef.id, mGraph.id],
      primaryMethodId: mDef.id,
      expectedContentVersion: v0,
    })
    soft('C re-add GRAPH', r.status === 200)
    v0 = Number(r.data?.contentVersion || v0)
    await api('PATCH', `/hs-math/admin/methods/${mGraph.id}`, adminTok, { isActive: false })

    r = await api('GET', `/hs-math/admin/train-items/${item1.id}`, adminTok)
    soft(
      'C9 disabled still listed',
      (r.data.methods || []).some((m) => String(m.id) === String(mGraph.id)),
      JSON.stringify(r.data.methods),
    )

    const mOffCode = `${P}OFF`
    created.methodCodes.push(mOffCode)
    r = await api('POST', '/hs-math/admin/methods', adminTok, {
      code: mOffCode,
      name: `[IT]no-new-link ${runId}`,
      isActive: false,
    })
    soft('C10 create off method', r.status === 200 || r.status === 201)
    if (r.data?.id) created.methodIds.push(String(r.data.id))
    const mOff = r.data
    r = await api('PUT', `/hs-math/admin/train-items/${item1.id}/content-meta`, adminTok, {
      methodIds: [mDef.id, mGraph.id, mOff.id],
      primaryMethodId: mDef.id,
      expectedContentVersion: v0,
    })
    soft('C10 new disabled reject', r.status >= 400, `s=${r.status}`)

    r = await api('PUT', `/hs-math/admin/train-items/${item1.id}/content-meta`, adminTok, {
      source: {
        sourceType: 'original',
        sourceVerificationStatus: 'unverified',
        sourceLicenseStatus: 'unknown',
        sourceReference: `IT-src-only ${runId}`,
      },
      expectedContentVersion: v0,
    })
    soft(
      'C11 source-only keep disabled link',
      r.status === 200 && Number(r.data.contentVersion) === v0 + 1,
      `s=${r.status} v=${r.data?.contentVersion}`,
    )
    if (r.status === 200) v0 = Number(r.data.contentVersion)
    soft(
      'C11 links still include GRAPH',
      Number(
        (
          await q(
            'SELECT COUNT(*) c FROM hs_math_train_item_methods WHERE item_id=? AND method_id=?',
            [item1.id, mGraph.id],
          )
        )[0].c,
      ) === 1,
    )

    const beforeD = v0
    r = await api('PUT', `/hs-math/admin/train-items/${item1.id}/content-meta`, adminTok, {
      source: {
        sourceType: 'original',
        sourceVerificationStatus: 'unverified',
        sourceLicenseStatus: 'unknown',
        sourceReference: `IT-atomic ${runId}`,
      },
      methodIds: [mDef.id, mCase.id],
      primaryMethodId: mDef.id,
      expectedContentVersion: beforeD,
    })
    soft('D atomic once', r.status === 200 && Number(r.data.contentVersion) === beforeD + 1)
    v0 = Number(r.data?.contentVersion || beforeD)
    await api('PATCH', `/hs-math/admin/methods/${mGraph.id}`, adminTok, { isActive: true })

    const get1 = await api('GET', `/hs-math/admin/train-items/${item1.id}`, adminTok)
    const staleV = Number(get1.data.contentVersion)
    r = await api('PUT', `/hs-math/admin/train-items/${item1.id}/content-meta`, adminTok, {
      source: {
        sourceType: 'original',
        sourceReference: `IT-A-win ${runId}`,
        sourceVerificationStatus: 'unverified',
        sourceLicenseStatus: 'unknown',
      },
      expectedContentVersion: staleV,
    })
    soft('E A saves', r.status === 200)
    const afterA = Number(r.data?.contentVersion)
    r = await api('PUT', `/hs-math/admin/train-items/${item1.id}/content-meta`, adminTok, {
      source: {
        sourceType: 'original',
        sourceReference: `IT-B-stale ${runId}`,
        sourceVerificationStatus: 'unverified',
        sourceLicenseStatus: 'unknown',
      },
      expectedContentVersion: staleV,
    })
    soft('E B 409', r.status === 409, `s=${r.status}`)
    soft(
      'E server kept A',
      (await api('GET', `/hs-math/admin/train-items/${item1.id}`, adminTok)).data.sourceReference?.includes(
        'IT-A-win',
      ),
    )
    v0 = afterA || v0

    const panel0 = await api('GET', `/hs-math/admin/train-items/${item1.id}/review-panel`, adminTok)
    soft('F panel load', panel0.status === 200, `s=${panel0.status}`)
    const fp = panel0.data?.contentFingerprint
    r = await api('POST', `/hs-math/admin/train-items/${item1.id}/reviews`, adminTok, {
      decision: 'deferred',
      comment: `[IT CORE1A4B ${runId}] deferred test review, not a real human pass`,
      expectedContentVersion: v0,
      expectedContentFingerprint: fp,
    })
    soft('F create deferred review', r.status === 200 || r.status === 201, `s=${r.status}`)
    if (r.data?.id) created.reviewIds.push(String(r.data.id))
    r = await api('PUT', `/hs-math/admin/train-items/${item1.id}/content-meta`, adminTok, {
      source: {
        sourceType: 'original',
        sourceReference: `IT-after-review ${runId}`,
        sourceVerificationStatus: 'unverified',
        sourceLicenseStatus: 'unknown',
      },
      expectedContentVersion: v0,
    })
    soft('F edit after review', r.status === 200)
    v0 = Number(r.data?.contentVersion || v0)
    const panel1 = await api('GET', `/hs-math/admin/train-items/${item1.id}/review-panel`, adminTok)
    soft(
      'F stale flag',
      panel1.data?.reviewIsStale === true ||
        panel1.data?.currentReviewStatus === 'stale' ||
        (panel1.data?.reviewHistory || []).some((h) => h.isStale),
      JSON.stringify({
        stale: panel1.data?.reviewIsStale,
        cur: panel1.data?.currentReviewStatus,
      }),
    )
    soft('F cannot publish', panel1.data?.canPublish === false)

    // ---------- H1?adapted/past_exam + unverified ????? ----------
    soft(
      'H1 adapted covered by B3_prime',
      results.some((x) => x.name === 'B3_prime http 400' && x.status === 'PASS'),
      'B3_prime must PASS first',
    )
    const item2Get = await api('GET', `/hs-math/admin/train-items/${item2.id}`, adminTok)
    const item2v = Number(item2Get.data.contentVersion || 1)
    const item2Before = (
      await q(
        `SELECT source_type, source_verification_status, content_version FROM hs_math_train_items WHERE id=?`,
        [item2.id],
      )
    )[0]
    r = await api('PUT', `/hs-math/admin/train-items/${item2.id}/content-meta`, adminTok, {
      source: {
        sourceType: 'past_exam',
        sourceYear: 2023,
        sourceExamName: 'IT-non-gaokao-paper',
        sourceQuestionNo: 'IT-9',
        sourceReference: `IT past ${runId}`,
        sourceVerificationStatus: 'unverified',
        sourceLicenseStatus: 'unknown',
      },
      expectedContentVersion: item2v,
    })
    soft('H1 past_exam unverified http 400', r.status === 400, `s=${r.status}`)
    const item2AfterH1 = (
      await q(
        `SELECT source_type, source_verification_status, content_version FROM hs_math_train_items WHERE id=?`,
        [item2.id],
      )
    )[0]
    soft(
      'H1 past_exam no persist / no bump',
      String(item2AfterH1.source_type) === String(item2Before.source_type) &&
        Number(item2AfterH1.content_version) === Number(item2Before.content_version),
      JSON.stringify(item2AfterH1),
    )

    // ---------- H2?restricted ?????????????? canPublish=false ? PASS ----------
    r = await api('PUT', `/hs-math/admin/train-items/${item2.id}/content-meta`, adminTok, {
      source: {
        sourceType: 'original',
        sourceVerificationStatus: 'unverified',
        sourceLicenseStatus: 'restricted',
        sourceReference: `IT restricted ${runId}`,
      },
      expectedContentVersion: Number(item2AfterH1.content_version),
    })
    soft('H2 restricted source save', r.status === 200, `s=${r.status}`)
    const p2 = await api('GET', `/hs-math/admin/train-items/${item2.id}/review-panel`, adminTok)
    const p2Reasons = p2.data?.publishBlockReasons || []
    soft(
      'H2 canPublish false',
      p2.status === 200 && p2.data?.canPublish === false,
      JSON.stringify({ canPublish: p2.data?.canPublish, reasons: p2Reasons }),
    )
    // Require restricted-specific reason (shared assertSourceAllowsFormalPublish via panel).
    // canPublish=false alone is NOT H2 PASS.
    const h2ReasonOk =
      p2Reasons.includes(RESTRICTED_PUBLISH_MSG) ||
      reasonsMentionRestricted(p2Reasons)
    soft(
      'H2 restricted reason in publishBlockReasons',
      h2ReasonOk,
      JSON.stringify(p2Reasons),
    )
    if (!h2ReasonOk) {
      capabilityGap(
        'H2 restricted distinguishable via review-panel',
        `expected "${RESTRICTED_PUBLISH_MSG}"; got ${JSON.stringify(p2Reasons)}`,
      )
    }
    skip(
      'H2 approve-path restricted reject',
      'NOT_RUN by policy H3: forbid real approve',
    )

    // ---------- H3????? approve???? deferred ----------
    soft(
      'H3 review uses deferred only',
      results.some((x) => x.name === 'F create deferred review' && (x.status === 'PASS' || x.status === 'FAIL')),
      'F deferred attempted; must never call approve',
    )
    skip('H3 real approve', 'NOT_RUN: 4B forbids approve; no status PATCH to approved')
    const appr = await q(
      `SELECT COUNT(*) c FROM hs_math_train_items WHERE id IN (?,?) AND status='approved'`,
      [item1.id, item2.id],
    )
    soft('H3 no IT approved', Number(appr[0].c) === 0)

    soft('J anon methods 401', (await api('GET', '/hs-math/admin/methods', null)).status === 401)
    if (userTok) {
      soft('J user methods 403', (await api('GET', '/hs-math/admin/methods', userTok)).status === 403)
      soft(
        'J user content-meta 403',
        (
          await api('PUT', `/hs-math/admin/train-items/${item1.id}/content-meta`, userTok, {
            source: { sourceType: 'original' },
            expectedContentVersion: 1,
          })
        ).status === 403,
      )
    } else {
      skip('J user methods 403', 'no USER jwt')
      skip('J user content-meta 403', 'no USER jwt')
    }
    soft(
      'J anon review 401',
      (await api('POST', `/hs-math/admin/train-items/${item1.id}/reviews`, null, {})).status === 401,
    )

    r = await api('PUT', `/hs-math/admin/train-items/${item2.id}/content-meta`, adminTok, {
      methodIds: [],
      primaryMethodId: null,
      expectedContentVersion: Number(
        (await api('GET', `/hs-math/admin/train-items/${item2.id}`, adminTok)).data.contentVersion,
      ),
    })
    soft('C8 clear methods', r.status === 200, `s=${r.status}`)
  } catch (e) {
    record('ABORT', 'FAIL', String(e?.message || e))
  }

  try {
    if (skipCleanup) {
      soft('cleanup deferred for browser', true, P)
      console.log('SKIP_CLEANUP_PREFIX', P)
      console.log('CREATED', JSON.stringify(created))
      cleanupOk = true
      throw new Error('__SKIP_CLEANUP__')
    }
    console.log('CLEANUP_START', JSON.stringify(created))
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
    const leftItems = await q(`SELECT id, code FROM hs_math_train_items WHERE code LIKE ?`, [`${P}%`])
    const leftMethods = await q(`SELECT id, code FROM hs_math_methods WHERE code LIKE ?`, [`${P}%`])
    if (leftItems.length || leftMethods.length) {
      cleanupBlocked = true
      record('CLEANUP_BLOCKED', 'FAIL', JSON.stringify({ leftItems, leftMethods }))
    } else {
      cleanupOk = true
      soft('cleanup residual 0', true)
    }
  } catch (e) {
    if (String(e?.message) === '__SKIP_CLEANUP__') {
      /* intentional */
    } else {
      cleanupBlocked = true
      record('CLEANUP_ERROR', 'FAIL', String(e?.message || e))
    }
  }

  const afterBaselineItems = await q(
    `SELECT id, code, status, difficulty, content_version,
            source_type, source_year, source_exam_name, source_question_no,
            source_reference, source_adaptation_note,
            source_verification_status, source_license_status,
            specialty_id, category_id, knowledge_point_id, pool, qtype,
            LEFT(stem,120) stem120, LEFT(IFNULL(analysis,''),80) analysis80
     FROM hs_math_train_items
     WHERE code NOT LIKE ?
     ORDER BY id`,
    [`${PREFIX}%`],
  )
  const afterAllCount = Number((await q('SELECT COUNT(*) c FROM hs_math_train_items'))[0].c)
  soft('protect baseline count 110', afterBaselineItems.length === 110, String(afterBaselineItems.length))
  soft('protect baseline hash', shaRows(afterBaselineItems) === baselineHash, 'hash mismatch')
  soft(
    'protect baseline ids',
    afterBaselineItems.every((r) => baselineItemIds.has(String(r.id))) &&
      afterBaselineItems.length === baselineItemIds.size,
  )
  soft('protect baseline codes', afterBaselineItems.every((r) => baselineCodes.has(r.code)))
  if (!skipCleanup) {
    soft('protect total count 110', afterAllCount === 110, String(afterAllCount))
    soft(
      'protect reviews',
      Number((await q('SELECT COUNT(*) c FROM hs_math_train_item_reviews'))[0].c) === baselineReviews,
    )
    soft(
      'protect methods',
      Number((await q('SELECT COUNT(*) c FROM hs_math_methods WHERE code NOT LIKE ?', [`${PREFIX}%`]))[0].c) ===
        baselineMethodsNonIt.length,
    )
    const leftoverIt = await q(`SELECT code FROM hs_math_train_items WHERE code LIKE ?`, [`${PREFIX}%`])
    const leftoverM = await q(`SELECT code FROM hs_math_methods WHERE code LIKE ?`, [`${PREFIX}%`])
    if (leftoverIt.length || leftoverM.length) {
      cleanupBlocked = true
      record('CLEANUP_PREFIX_LEFT', 'FAIL', JSON.stringify({ leftoverIt, leftoverM }))
    }
  } else {
    soft(
      'protect IT still present (pre-browser)',
      created.itemIds.length > 0,
      `total=${afterAllCount} it=${created.itemIds.length}`,
    )
  }
  soft(
    'protect sessions',
    Number((await q('SELECT COUNT(*) c FROM hs_math_train_sessions'))[0].c) === baselineSessions,
  )
  soft(
    'protect session_items',
    Number((await q('SELECT COUNT(*) c FROM hs_math_train_session_items'))[0].c) === baselineSessionItems,
  )
  soft(
    'protect item_kps non-IT',
    shaRows(
      await q(
        `SELECT k.item_id, k.knowledge_point_id, k.is_primary, k.sort_order
         FROM hs_math_train_item_kps k
         INNER JOIN hs_math_train_items i ON i.id = k.item_id
         WHERE i.code NOT LIKE ?
         ORDER BY k.item_id, k.sort_order, k.id`,
        [`${PREFIX}%`],
      ),
    ) === kpLinksHash,
  )
  soft('protect chem', Number((await q('SELECT COUNT(*) c FROM chem_specialties'))[0].c) === chemSp)
  soft(
    'protect approved 0',
    Number((await q(`SELECT COUNT(*) c FROM hs_math_train_items WHERE status='approved'`))[0].c) === 0,
  )

  const verified = (await q('SELECT UTC_TIMESTAMP() t'))[0].t
  await conn.end()

  const pass = results.filter((x) => x.status === 'PASS').length
  const fail = results.filter((x) => x.status === 'FAIL').length
  const nr = results.filter((x) => x.status === 'NOT_RUN').length
  const gaps = results.filter((x) => x.status === 'CAPABILITY_GAP')
  let verdict = 'PASS'
  if (cleanupBlocked || fail > 0) {
    const coreFail = results.some(
      (x) =>
        x.status === 'FAIL' &&
        /protect|CLEANUP|ABORT|database|baseline total|create item|A1|B3_prime|B3_double|D atomic|E B 409|H1 |H3 no IT/.test(
          x.name,
        ),
    )
    verdict = coreFail || cleanupBlocked ? 'BLOCKED' : 'PARTIAL'
  } else if (gaps.length > 0) {
    // H2 ????????????? PASS??????? FAIL?
    verdict = 'PARTIAL'
  }

  const out = {
    runId,
    prefix: P,
    verdict,
    pass,
    fail,
    notRun: nr,
    capabilityGaps: gaps.length,
    cleanupOk,
    cleanupBlocked,
    baselineHash,
    LAST_VERIFIED: verified,
    created,
    results,
  }
  const outPath = path.join(API_ROOT, '../../db/backups', `_core1a4b_it_${runId}.json`)
  try {
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
    console.log('RESULT_JSON', outPath)
  } catch (e) {
    console.log('RESULT_JSON_WRITE_FAIL', String(e.message))
  }
  console.log(
    'VERDICT',
    verdict,
    `PASS=${pass} FAIL=${fail} NOT_RUN=${nr} CAPABILITY_GAP=${gaps.length}`,
  )
  if (verdict === 'BLOCKED' || fail > 0) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
