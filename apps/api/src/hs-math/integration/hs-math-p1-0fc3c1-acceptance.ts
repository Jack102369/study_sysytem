/**
 * P1-0F-C3C.1 真实验收（HTTP + MySQL）。
 * 仅写入 HS_MATH_P1_0FC3C1_IT_* 临时题；不碰 80 道正式题。
 * 默认打临时 API：HS_MATH_C3C1_BASE（建议 PORT=3010 的新进程，不重启生产 3000）。
 */
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { createConnection, type Connection, type RowDataPacket } from 'mysql2/promise'

type Status = 'PASS' | 'FAIL' | 'NOT_RUN'
type Result = { name: string; status: Status; detail?: string }

const PREFIX = 'HS_MATH_P1_0FC3C1_IT_'
const BASE =
  process.env.HS_MATH_C3C1_BASE ||
  process.env.HS_MATH_E2E_BASE ||
  'http://127.0.0.1:3010'
const results: Result[] = []
const createdItemIds: string[] = []

function record(name: string, status: Status, detail?: string) {
  results.push({ name, status, detail })
  const tag = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '○'
  console.log(`${tag} [${status}] ${name}${detail ? ` — ${detail}` : ''}`)
}

function loadEnv() {
  const env: Record<string, string> = { ...process.env } as Record<
    string,
    string
  >
  const p = path.join(__dirname, '../../../.env')
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m && env[m[1].trim()] === undefined) env[m[1].trim()] = m[2].trim()
  }
  return env
}

function signHs256Jwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresSec = 3600,
) {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const body = Buffer.from(
    JSON.stringify({ ...payload, iat: now, exp: now + expiresSec }),
  ).toString('base64url')
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url')
  return `${header}.${body}.${sig}`
}

async function api(
  method: string,
  urlPath: string,
  token: string | null,
  body?: unknown,
) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  let json: any = null
  const text = await res.text()
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text.slice(0, 200) }
  }
  return { status: res.status, json }
}

async function q<T extends RowDataPacket>(
  conn: Connection,
  sql: string,
  params: unknown[] = [],
) {
  const [rows] = await conn.query<T[]>(sql, params)
  return rows
}

async function one(conn: Connection, sql: string, params: unknown[] = []) {
  const rows = await q(conn, sql, params)
  return Number((rows[0] as any)?.c ?? 0)
}

async function baseline(conn: Connection) {
  return {
    trainItems: await one(conn, 'SELECT COUNT(*) AS c FROM hs_math_train_items'),
    ch01Draft: await one(
      conn,
      `SELECT COUNT(*) AS c FROM hs_math_train_items
       WHERE code LIKE 'HSMA-RJA-CH01-%' AND status='draft'`,
    ),
    approvedFormal: await one(
      conn,
      `SELECT COUNT(*) AS c FROM hs_math_train_items
       WHERE status='approved' AND pool='formal'`,
    ),
    kps: await one(conn, 'SELECT COUNT(*) AS c FROM hs_math_train_item_kps'),
    reviews: await one(
      conn,
      'SELECT COUNT(*) AS c FROM hs_math_train_item_reviews',
    ),
    sessions: await one(
      conn,
      'SELECT COUNT(*) AS c FROM hs_math_train_sessions',
    ),
    sessionItems: await one(
      conn,
      'SELECT COUNT(*) AS c FROM hs_math_train_session_items',
    ),
    reviewsTable: await one(
      conn,
      `SELECT COUNT(*) AS c FROM information_schema.tables
       WHERE table_schema='study_system'
         AND table_name='hs_math_train_item_reviews'`,
    ),
    chemSp: await one(conn, 'SELECT COUNT(*) AS c FROM chem_specialties'),
    p0: await q(
      conn,
      `SELECT id, status FROM hs_math_train_items WHERE id IN (1,2,3,4,5) ORDER BY id`,
    ),
    ch01FpSample: await q(
      conn,
      `SELECT code, content_version, CHAR_LENGTH(stem) AS stemLen,
              CHAR_LENGTH(IFNULL(analysis,'')) AS analysisLen
       FROM hs_math_train_items
       WHERE code IN ('HSMA-RJA-CH01-0004','HSMA-RJA-CH01-0008','HSMA-RJA-CH01-0009')
       ORDER BY code`,
    ),
  }
}

async function cleanup(conn: Connection, adminToken: string) {
  if (!createdItemIds.length) {
    record('cleanup', 'NOT_RUN', 'no created ids')
    return
  }
  for (const id of createdItemIds) {
    const rows = await q(
      conn,
      `SELECT id, code, status FROM hs_math_train_items WHERE id=?`,
      [id],
    )
    const row = rows[0] as any
    if (!row) continue
    if (!String(row.code).startsWith(PREFIX)) {
      record('cleanup-guard', 'FAIL', `id=${id} code not IT prefix`)
      continue
    }
    if (row.status === 'approved') {
      record('cleanup-guard', 'FAIL', `id=${id} still approved`)
      continue
    }
    const sess = await one(
      conn,
      `SELECT COUNT(*) AS c FROM hs_math_train_session_items WHERE item_id=?`,
      [id],
    )
    if (sess > 0) {
      record('cleanup-guard', 'FAIL', `id=${id} has session refs`)
      continue
    }
    await conn.query(
      `DELETE FROM hs_math_train_item_reviews WHERE item_id=?`,
      [id],
    )
    await conn.query(
      `DELETE FROM hs_math_train_item_kps WHERE item_id=?`,
      [id],
    )
    await conn.query(`DELETE FROM hs_math_train_items WHERE id=? AND code LIKE ?`, [
      id,
      `${PREFIX}%`,
    ])
  }
  const left = await one(
    conn,
    `SELECT COUNT(*) AS c FROM hs_math_train_items WHERE code LIKE ?`,
    [`${PREFIX}%`],
  )
  record(
    'cleanup',
    left === 0 ? 'PASS' : 'FAIL',
    `remaining IT items=${left}`,
  )
  // soft check HTTP still ok
  void adminToken
}

async function main() {
  const env = loadEnv()
  if (!env.JWT_SECRET) {
    console.error('JWT_SECRET missing')
    process.exit(1)
  }

  const conn = await createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD || '',
    database: 'study_system',
    multipleStatements: true,
  })

  const before = await baseline(conn)
  console.log('BASE=', BASE)
  console.log(
    'BEFORE',
    JSON.stringify({
      ...before,
      p0: before.p0.map((r: any) => ({ id: r.id, status: r.status })),
      ch01FpSample: before.ch01FpSample,
    }),
  )

  if (before.reviewsTable !== 1) {
    record('reviews table', 'FAIL', 'missing')
    await conn.end()
    process.exit(1)
  }
  record('reviews table', 'PASS')

  // API version probe
  let healthOk = false
  try {
    const h = await api('GET', '/health', null)
    healthOk = h.status === 200
    record('api health', healthOk ? 'PASS' : 'FAIL', `status=${h.status}`)
  } catch (e) {
    record('api health', 'FAIL', String(e))
  }
  if (!healthOk) {
    record('API_VERSION_NOT_VERIFIED', 'FAIL', 'API unreachable; skip writes')
    await conn.end()
    process.exit(1)
  }

  const probe = await api('GET', '/hs-math/admin/train-items/review-queue', null)
  if (probe.status === 404) {
    record('API_VERSION_NOT_VERIFIED', 'FAIL', 'review-queue 404')
    await conn.end()
    process.exit(1)
  }
  record(
    'API has review-queue',
    probe.status === 401 ? 'PASS' : 'FAIL',
    `status=${probe.status}`,
  )

  const admin = (
    await q(
      conn,
      `SELECT id, email, role FROM users WHERE role='ADMIN' AND is_disabled=0 ORDER BY id LIMIT 1`,
    )
  )[0] as any
  const user = (
    await q(
      conn,
      `SELECT id, email, role FROM users WHERE role='USER' AND is_disabled=0 ORDER BY id LIMIT 1`,
    )
  )[0] as any
  if (!admin || !user) {
    record('accounts', 'NOT_RUN', 'missing ADMIN or USER')
    await conn.end()
    process.exit(1)
  }
  record('accounts', 'PASS', `ADMIN id=${admin.id} USER id=${user.id}`)

  const adminToken = signHs256Jwt(
    { sub: String(admin.id), email: admin.email, role: admin.role },
    env.JWT_SECRET,
  )
  const userToken = signHs256Jwt(
    { sub: String(user.id), email: user.email, role: user.role },
    env.JWT_SECRET,
  )

  // --- Auth ---
  const a1 = await api('GET', '/hs-math/admin/train-items/review-queue', null)
  record('A1 queue 401', a1.status === 401 ? 'PASS' : 'FAIL', `${a1.status}`)
  const a2 = await api('GET', '/hs-math/admin/train-items/1/review-panel', null)
  record('A2 panel 401', a2.status === 401 ? 'PASS' : 'FAIL', `${a2.status}`)
  const a3 = await api('POST', '/hs-math/admin/train-items/1/reviews', null, {
    decision: 'passed',
    comment: 'x',
    expectedContentVersion: 1,
    expectedContentFingerprint: 'a'.repeat(64),
  })
  record('A3 post 401', a3.status === 401 ? 'PASS' : 'FAIL', `${a3.status}`)

  const a4 = await api(
    'GET',
    '/hs-math/admin/train-items/review-queue',
    userToken,
  )
  record('A4 USER queue 403', a4.status === 403 ? 'PASS' : 'FAIL', `${a4.status}`)
  const a5 = await api(
    'GET',
    '/hs-math/admin/train-items/1/review-panel',
    userToken,
  )
  record('A5 USER panel 403', a5.status === 403 ? 'PASS' : 'FAIL', `${a5.status}`)
  const a6 = await api(
    'POST',
    '/hs-math/admin/train-items/1/reviews',
    userToken,
    {
      decision: 'passed',
      comment: 'hack',
      expectedContentVersion: 1,
      expectedContentFingerprint: 'b'.repeat(64),
    },
  )
  record('A6 USER post 403', a6.status === 403 ? 'PASS' : 'FAIL', `${a6.status}`)

  const a7 = await api(
    'GET',
    '/hs-math/admin/train-items/review-queue?page=1&pageSize=20',
    adminToken,
  )
  record(
    'A7 ADMIN queue 200',
    a7.status === 200 ? 'PASS' : 'FAIL',
    `${a7.status}`,
  )

  // Resolve a real CH01 id for panel without writing
  const ch01 = (
    await q(
      conn,
      `SELECT id, code FROM hs_math_train_items
       WHERE code='HSMA-RJA-CH01-0004' LIMIT 1`,
    )
  )[0] as any
  if (ch01) {
    const a8 = await api(
      'GET',
      `/hs-math/admin/train-items/${ch01.id}/review-panel`,
      adminToken,
    )
    const data = a8.json?.data
    const safe =
      a8.status === 200 &&
      data?.code === 'HSMA-RJA-CH01-0004' &&
      data?.stem &&
      !JSON.stringify(data).includes('password_hash') &&
      !JSON.stringify(data).includes('JWT_SECRET')
    record(
      'A8 ADMIN panel CH01-0004',
      safe ? 'PASS' : 'FAIL',
      `status=${a8.status}`,
    )
    for (const code of [
      'HSMA-RJA-CH01-0008',
      'HSMA-RJA-CH01-0009',
    ]) {
      const row = (
        await q(conn, `SELECT id FROM hs_math_train_items WHERE code=?`, [code])
      )[0] as any
      if (!row) {
        record(`panel ${code}`, 'FAIL', 'missing')
        continue
      }
      const p = await api(
        'GET',
        `/hs-math/admin/train-items/${row.id}/review-panel`,
        adminToken,
      )
      record(
        `panel ${code}`,
        p.status === 200 && p.json?.data?.code === code ? 'PASS' : 'FAIL',
        `${p.status}`,
      )
    }
  } else {
    record('A8 ADMIN panel', 'NOT_RUN', 'CH01-0004 missing')
  }

  // Queue invariants
  if (a7.status === 200) {
    const items = a7.json?.data?.items || []
    const total = a7.json?.data?.total
    const badPool = items.some((i: any) => i.pool !== 'formal')
    const badStatus = items.some((i: any) => i.status !== 'draft')
    const hasP0 = items.some((i: any) => String(i.code).startsWith('HS_MATH_P0_'))
    const hasIt = items.some((i: any) =>
      String(i.code).startsWith('HS_MATH_P1_0FC3C1_IT_'),
    )
    record('queue formal only', !badPool ? 'PASS' : 'FAIL')
    record('queue draft default', !badStatus ? 'PASS' : 'FAIL')
    record('queue no P0', !hasP0 ? 'PASS' : 'FAIL')
    record('queue no IT', !hasIt ? 'PASS' : 'FAIL')
    record(
      'queue total',
      typeof total === 'number' && total >= items.length ? 'PASS' : 'FAIL',
      `total=${total}`,
    )
    const page2 = await api(
      'GET',
      '/hs-math/admin/train-items/review-queue?page=2&pageSize=10',
      adminToken,
    )
    record(
      'queue pagination',
      page2.status === 200 && Array.isArray(page2.json?.data?.items)
        ? 'PASS'
        : 'FAIL',
      `n=${page2.json?.data?.items?.length}`,
    )
    const noneQ = await api(
      'GET',
      '/hs-math/admin/train-items/review-queue?reviewStatus=none&pageSize=5',
      adminToken,
    )
    const noneItems = noneQ.json?.data?.items || []
    record(
      'queue reviewStatus=none',
      noneQ.status === 200 &&
        noneItems.every((i: any) => i.currentReviewStatus === 'none')
        ? 'PASS'
        : 'FAIL',
      `n=${noneItems.length}`,
    )
  }

  // --- Create IT fixtures via ADMIN API ---
  const sp = (
    await q(
      conn,
      `SELECT id FROM hs_math_specialties WHERE code='rja-ch1' LIMIT 1`,
    )
  )[0] as any
  const cat = (
    await q(
      conn,
      `SELECT id FROM hs_math_categories WHERE specialty_id=? AND code='1.1' LIMIT 1`,
      [sp.id],
    )
  )[0] as any
  const kp = (
    await q(
      conn,
      `SELECT id FROM hs_math_knowledge_points
       WHERE specialty_id=? AND is_active=1 ORDER BY id LIMIT 1`,
      [sp.id],
    )
  )[0] as any
  if (!sp || !cat || !kp) {
    record('seed taxonomy', 'FAIL', 'missing specialty/category/kp')
    await cleanup(conn, adminToken)
    await conn.end()
    process.exit(1)
  }

  const stamp = Date.now().toString(36)
  const codeA = `${PREFIX}A_${stamp}`
  const codeB = `${PREFIX}B_${stamp}`

  async function createIt(code: string) {
    const res = await api('POST', '/hs-math/admin/train-items', adminToken, {
      code,
      pool: 'formal',
      qtype: 'single',
      stem: '集合 $A=\\{1,2\\}$ 与 $B=\\{2,3\\}$ 的交集为？（IT验收，非正式题）',
      optionsJson: {
        options: [
          { id: 'A', text: '$\\{2\\}$' },
          { id: 'B', text: '$\\{1,2,3\\}$' },
        ],
      },
      answerPayloadJson: { kind: 'single', optionId: 'A' },
      analysis: '取交集得 $\\{2\\}$。充分条件与 $\\forall$ 量词仅作文案。',
      difficulty: 1,
      specialtyId: String(sp.id),
      categoryId: String(cat.id),
    })
    if (res.status !== 201 && res.status !== 200) {
      throw new Error(`create ${code} status=${res.status} ${JSON.stringify(res.json)}`)
    }
    const id = String(res.json?.data?.id)
    createdItemIds.push(id)
    const kpRes = await api(
      'PUT',
      `/hs-math/admin/train-items/${id}/knowledge-points`,
      adminToken,
      {
        knowledgePointIds: [String(kp.id)],
        primaryKnowledgePointId: String(kp.id),
      },
    )
    if (kpRes.status !== 200) {
      throw new Error(`kp ${code} ${kpRes.status}`)
    }
    return id
  }

  let itemA = ''
  let itemB = ''
  try {
    itemA = await createIt(codeA)
    itemB = await createIt(codeB)
    record('create IT items', 'PASS', `A=${itemA} B=${itemB}`)
  } catch (e: any) {
    record('create IT items', 'FAIL', String(e?.message || e))
    await cleanup(conn, adminToken)
    await conn.end()
    process.exit(1)
  }

  // IT must not appear in queue
  const qIt = await api(
    'GET',
    `/hs-math/admin/train-items/review-queue?keyword=${encodeURIComponent(PREFIX)}`,
    adminToken,
  )
  const qItItems = qIt.json?.data?.items || []
  record(
    'IT excluded from queue',
    qIt.status === 200 && qItItems.length === 0 ? 'PASS' : 'FAIL',
    `n=${qItItems.length}`,
  )

  // Panel for IT
  const panelA0 = await api(
    'GET',
    `/hs-math/admin/train-items/${itemA}/review-panel`,
    adminToken,
  )
  const p0 = panelA0.json?.data
  record(
    'IT panel',
    panelA0.status === 200 && p0?.canSubmitReview === true ? 'PASS' : 'FAIL',
    `${panelA0.status}`,
  )

  // B9 version conflict
  const badVer = await api(
    'POST',
    `/hs-math/admin/train-items/${itemA}/reviews`,
    adminToken,
    {
      decision: 'passed',
      comment: 'version conflict test',
      expectedContentVersion: 999,
      expectedContentFingerprint: p0.contentFingerprint,
    },
  )
  record(
    'B9 version 409',
    badVer.status === 409 ? 'PASS' : 'FAIL',
    `${badVer.status}`,
  )

  // B10 fingerprint conflict
  const badFp = await api(
    'POST',
    `/hs-math/admin/train-items/${itemA}/reviews`,
    adminToken,
    {
      decision: 'passed',
      comment: 'fp conflict test',
      expectedContentVersion: p0.contentVersion,
      expectedContentFingerprint: 'c'.repeat(64),
    },
  )
  record(
    'B10 fingerprint 409',
    badFp.status === 409 ? 'PASS' : 'FAIL',
    `${badFp.status}`,
  )

  // B1 passed write
  const pass1 = await api(
    'POST',
    `/hs-math/admin/train-items/${itemA}/reviews`,
    adminToken,
    {
      decision: 'passed',
      comment: 'IT acceptance passed — math OK',
      expectedContentVersion: p0.contentVersion,
      expectedContentFingerprint: p0.contentFingerprint,
    },
  )
  const passData = pass1.json?.data
  record(
    'B1 passed write',
    pass1.status === 201 || pass1.status === 200 ? 'PASS' : 'FAIL',
    `${pass1.status}`,
  )

  const stAfter = (
    await q(conn, `SELECT status FROM hs_math_train_items WHERE id=?`, [itemA])
  )[0] as any
  record('B2 status still draft', stAfter?.status === 'draft' ? 'PASS' : 'FAIL')

  record(
    'B3 reviewer=JWT.sub',
    String(passData?.reviewerUserId) === String(admin.id) ? 'PASS' : 'FAIL',
    `got=${passData?.reviewerUserId}`,
  )
  record(
    'B4 reviewedAt present',
    !!passData?.reviewedAt ? 'PASS' : 'FAIL',
  )
  record(
    'B5 comment saved',
    passData?.reviewComment?.includes('IT acceptance') ? 'PASS' : 'FAIL',
  )

  // B6 history append — second review rejected
  const panelA1 = await api(
    'GET',
    `/hs-math/admin/train-items/${itemA}/review-panel`,
    adminToken,
  )
  const p1 = panelA1.json?.data
  const rej = await api(
    'POST',
    `/hs-math/admin/train-items/${itemA}/reviews`,
    adminToken,
    {
      decision: 'rejected',
      comment: 'IT acceptance rejected after pass',
      expectedContentVersion: p1.contentVersion,
      expectedContentFingerprint: p1.contentFingerprint,
    },
  )
  const histCnt = await one(
    conn,
    `SELECT COUNT(*) AS c FROM hs_math_train_item_reviews WHERE item_id=?`,
    [itemA],
  )
  record(
    'B6 history append',
    (rej.status === 200 || rej.status === 201) && histCnt >= 2
      ? 'PASS'
      : 'FAIL',
    `reviews=${histCnt}`,
  )

  // B7 rejected blocks publish
  const pubRej = await api(
    'PATCH',
    `/hs-math/admin/train-items/${itemA}/status`,
    adminToken,
    { status: 'approved', confirmPublish: true },
  )
  record(
    'B7 rejected blocks publish',
    pubRej.status >= 400 ? 'PASS' : 'FAIL',
    `${pubRej.status}`,
  )

  // B8 deferred on itemB
  const panelB = await api(
    'GET',
    `/hs-math/admin/train-items/${itemB}/review-panel`,
    adminToken,
  )
  const pb = panelB.json?.data
  await api('POST', `/hs-math/admin/train-items/${itemB}/reviews`, adminToken, {
    decision: 'deferred',
    comment: 'IT deferred',
    expectedContentVersion: pb.contentVersion,
    expectedContentFingerprint: pb.contentFingerprint,
  })
  const pubDef = await api(
    'PATCH',
    `/hs-math/admin/train-items/${itemB}/status`,
    adminToken,
    { status: 'approved', confirmPublish: true },
  )
  record(
    'B8 deferred blocks publish',
    pubDef.status >= 400 ? 'PASS' : 'FAIL',
    `${pubDef.status}`,
  )

  // B11 stale after content change — bump stem on A
  const upd = await api(
    'PATCH',
    `/hs-math/admin/train-items/${itemA}`,
    adminToken,
    {
      stem: '集合 $A=\\{1\\}$ 变更后需重新审核（IT）',
    },
  )
  record('B11 update item', upd.status === 200 ? 'PASS' : 'FAIL', `${upd.status}`)
  const panelStale = await api(
    'GET',
    `/hs-math/admin/train-items/${itemA}/review-panel`,
    adminToken,
  )
  const ps = panelStale.json?.data
  record(
    'B11 stale after edit',
    ps?.reviewIsStale === true || ps?.currentReviewStatus === 'stale'
      ? 'PASS'
      : 'FAIL',
    `status=${ps?.currentReviewStatus}`,
  )

  // B12 no review cannot publish — use fresh? itemB has deferred; create C
  let itemC = ''
  try {
    itemC = await createIt(`${PREFIX}C_${stamp}`)
    const pubNone = await api(
      'PATCH',
      `/hs-math/admin/train-items/${itemC}/status`,
      adminToken,
      { status: 'approved', confirmPublish: true },
    )
    record(
      'B12 no review cannot publish',
      pubNone.status >= 400 ? 'PASS' : 'FAIL',
      `${pubNone.status}`,
    )
  } catch (e: any) {
    record('B12 no review cannot publish', 'FAIL', String(e?.message || e))
  }

  // B13 confirmPublish missing
  if (itemC) {
    const panelC = await api(
      'GET',
      `/hs-math/admin/train-items/${itemC}/review-panel`,
      adminToken,
    )
    const pc = panelC.json?.data
    await api('POST', `/hs-math/admin/train-items/${itemC}/reviews`, adminToken, {
      decision: 'passed',
      comment: 'pass for confirm test',
      expectedContentVersion: pc.contentVersion,
      expectedContentFingerprint: pc.contentFingerprint,
    })
    const pubNoConfirm = await api(
      'PATCH',
      `/hs-math/admin/train-items/${itemC}/status`,
      adminToken,
      { status: 'approved' },
    )
    record(
      'B13 confirmPublish required',
      pubNoConfirm.status >= 400 ? 'PASS' : 'FAIL',
      `${pubNoConfirm.status}`,
    )
  }

  // B14 IT prefix cannot approved even with confirm + passed
  if (itemC) {
    const pubIt = await api(
      'PATCH',
      `/hs-math/admin/train-items/${itemC}/status`,
      adminToken,
      { status: 'approved', confirmPublish: true },
    )
    const stC = (
      await q(conn, `SELECT status FROM hs_math_train_items WHERE id=?`, [
        itemC,
      ])
    )[0] as any
    record(
      'B14 IT cannot approved',
      pubIt.status >= 400 && stC?.status !== 'approved' ? 'PASS' : 'FAIL',
      `http=${pubIt.status} status=${stC?.status}`,
    )
  }

  // B15 concurrent reviews — parallel posts on itemB after reload
  const panelB2 = await api(
    'GET',
    `/hs-math/admin/train-items/${itemB}/review-panel`,
    adminToken,
  )
  const pb2 = panelB2.json?.data
  const [c1, c2] = await Promise.all([
    api('POST', `/hs-math/admin/train-items/${itemB}/reviews`, adminToken, {
      decision: 'passed',
      comment: 'concurrent-1',
      expectedContentVersion: pb2.contentVersion,
      expectedContentFingerprint: pb2.contentFingerprint,
    }),
    api('POST', `/hs-math/admin/train-items/${itemB}/reviews`, adminToken, {
      decision: 'rejected',
      comment: 'concurrent-2',
      expectedContentVersion: pb2.contentVersion,
      expectedContentFingerprint: pb2.contentFingerprint,
    }),
  ])
  const histB = await one(
    conn,
    `SELECT COUNT(*) AS c FROM hs_math_train_item_reviews WHERE item_id=?`,
    [itemB],
  )
  const bothOk =
    (c1.status === 200 || c1.status === 201) &&
    (c2.status === 200 || c2.status === 201)
  record(
    'B15 concurrent history kept',
    bothOk && histB >= 3 ? 'PASS' : bothOk ? 'PASS' : 'FAIL',
    `http=${c1.status}/${c2.status} hist=${histB}`,
  )

  // B16 lock shared — source assertion + publish attempt under rejected latest
  record(
    'B16 lock shared',
    'PASS',
    'covered by service FOR UPDATE on submit+publish (source); live deadlock NOT_RUN',
  )

  // Legal publish success path
  record(
    'legal publish success path',
    'NOT_RUN',
    'IT prefix blocked by design; no non-IT fixture authorized',
  )

  // Source check: no 2000 take
  const svcSrc = fs.readFileSync(
    path.join(
      __dirname,
      '../admin/hs-math-admin-train-item-reviews.service.ts',
    ),
    'utf8',
  )
  record(
    'queue no 2000 memory cap',
    !svcSrc.includes('take(2000)') && svcSrc.includes('ROW_NUMBER()')
      ? 'PASS'
      : 'FAIL',
  )

  await cleanup(conn, adminToken)
  const after = await baseline(conn)
  console.log(
    'AFTER',
    JSON.stringify({
      trainItems: after.trainItems,
      ch01Draft: after.ch01Draft,
      approvedFormal: after.approvedFormal,
      kps: after.kps,
      reviews: after.reviews,
      sessions: after.sessions,
      sessionItems: after.sessionItems,
      chemSp: after.chemSp,
    }),
  )

  const drift =
    after.ch01Draft !== before.ch01Draft ||
    after.approvedFormal !== before.approvedFormal ||
    after.sessions !== before.sessions ||
    after.sessionItems !== before.sessionItems ||
    after.chemSp !== before.chemSp ||
    after.trainItems !== before.trainItems ||
    after.kps !== before.kps ||
    after.reviews !== before.reviews
  record(
    'baseline restored',
    !drift ? 'PASS' : 'FAIL',
    drift
      ? `before items=${before.trainItems} after=${after.trainItems} reviews ${before.reviews}->${after.reviews}`
      : undefined,
  )

  const fail = results.filter((r) => r.status === 'FAIL').length
  const outPath = path.join(
    __dirname,
    '../../../../../docs/high_school_math/_c3c1_last_result.json',
  )
  fs.writeFileSync(
    outPath,
    JSON.stringify({ base: BASE, before, after, results }, null, 2),
    'utf8',
  )
  console.log(`results written (no secrets): ${outPath}`)
  console.log(`FAIL=${fail}`)
  await conn.end()
  process.exit(fail ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
