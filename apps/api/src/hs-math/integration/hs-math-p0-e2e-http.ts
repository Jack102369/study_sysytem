/**
 * P0-3.5 真实 HTTP 业务验证（study_system / hs_math_* only）。
 * 鉴权：用现有 users 签发 JWT（不读、不改、不打印密码；不打印 token）。
 *
 * 运行：pnpm --filter api run hs-math:e2e
 */
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { createConnection, type Connection } from 'mysql2/promise'

function signHs256Jwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresSec = 7 * 24 * 3600,
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

type Result = { name: string; status: 'PASS' | 'FAIL' | 'NOT_RUN'; detail?: string }

const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'
const MARK = 'HS_MATH_P0_E2E_TEST'
const results: Result[] = []

function loadEnv() {
  const env: Record<string, string> = { ...process.env } as Record<string, string>
  const p = path.join(__dirname, '../../../.env')
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m && env[m[1].trim()] === undefined) env[m[1].trim()] = m[2].trim()
  }
  return env
}

function record(name: string, status: Result['status'], detail?: string) {
  results.push({ name, status, detail })
  console.log(detail ? `${status}  ${name}: ${detail}` : `${status}  ${name}`)
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function assertOk(status: number, msg: string) {
  assert(status === 200 || status === 201, msg)
}

async function q<T extends Record<string, unknown>>(
  conn: Connection,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const [rows] = await conn.query(sql, params)
  return rows as T[]
}

function leakKeys(obj: unknown, pathKey = ''): string[] {
  if (!obj || typeof obj !== 'object') return []
  const banned = [
    'answerPayloadJson',
    'answer_payload_json',
    'analysis',
    'gradeResult',
    'grade_result',
    'gradeReason',
    'grade_reason',
  ]
  const bad: string[] = []
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const p = pathKey ? `${pathKey}.${k}` : k
    if (banned.includes(k)) bad.push(p)
    if (v && typeof v === 'object') bad.push(...leakKeys(v, p))
  }
  return bad
}

async function api(
  method: string,
  urlPath: string,
  token: string | null,
  body?: unknown,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text.slice(0, 200) }
  }
  return { status: res.status, json }
}

function dataOf(json: unknown): any {
  if (json && typeof json === 'object' && 'data' in (json as object)) {
    return (json as { data: unknown }).data
  }
  return json
}

async function recordCase(name: string, fn: () => Promise<void>) {
  try {
    await fn()
    record(name, 'PASS')
  } catch (e) {
    record(name, 'FAIL', e instanceof Error ? e.message : String(e))
  }
}

async function main() {
  const env = loadEnv()
  assert(env.DB_NAME === 'study_system', `DB must be study_system, got ${env.DB_NAME}`)
  assert(!!env.JWT_SECRET, 'JWT_SECRET missing')

  const conn = await createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD || '',
    database: 'study_system',
    charset: 'utf8mb4',
  })

  const chemBefore = (
    await q<{ c: number }>(conn, 'SELECT COUNT(*) AS c FROM chem_specialties')
  )[0]
  const eqBefore = (
    await q<{ c: number }>(conn, 'SELECT COUNT(*) AS c FROM error_questions')
  )[0]
  const usersBefore = (
    await q<{ c: number; sig: string }>(
      conn,
      'SELECT COUNT(*) AS c, SUM(CRC32(CONCAT(id,email,role,password_hash))) AS sig FROM users',
    )
  )[0]

  const tableCnt = (
    await q<{ c: number }>(
      conn,
      `SELECT COUNT(*) AS c FROM information_schema.tables
       WHERE table_schema='study_system' AND table_name REGEXP '^hs_math_'`,
    )
  )[0]
  const spCnt = (
    await q<{ c: number }>(conn, 'SELECT COUNT(*) AS c FROM hs_math_specialties')
  )[0]
  const catCnt = (
    await q<{ c: number }>(
      conn,
      `SELECT COUNT(*) AS c FROM hs_math_categories WHERE code='default'`,
    )
  )[0]

  if (Number(tableCnt.c) !== 5) {
    record('env tables', 'FAIL', `hs_math tables=${tableCnt.c}`)
    await conn.end()
    process.exitCode = 1
    return
  }
  record('env tables', 'PASS', '5 hs_math_* tables')
  record(
    'env seeds',
    Number(spCnt.c) === 10 && Number(catCnt.c) === 10 ? 'PASS' : 'FAIL',
    `specialties=${spCnt.c} categories=${catCnt.c}`,
  )

  try {
    const h = await api('GET', '/health', null)
    record('api health', h.status === 200 ? 'PASS' : 'FAIL', `status=${h.status}`)
    if (h.status !== 200) {
      await conn.end()
      process.exitCode = 1
      return
    }
  } catch (e) {
    record('api health', 'FAIL', String(e))
    await conn.end()
    process.exitCode = 1
    return
  }

  const admin = (
    await q<{ id: string; email: string; role: string }>(
      conn,
      `SELECT id, email, role FROM users WHERE role='ADMIN' AND is_disabled=0 ORDER BY id LIMIT 1`,
    )
  )[0]
  const student = (
    await q<{ id: string; email: string; role: string }>(
      conn,
      `SELECT id, email, role FROM users WHERE role='USER' AND is_disabled=0 ORDER BY id LIMIT 1`,
    )
  )[0]
  if (!admin || !student) {
    record('test accounts', 'FAIL', 'need one ADMIN and one USER')
    await conn.end()
    process.exitCode = 1
    return
  }
  record(
    'test accounts',
    'PASS',
    `ADMIN id=${admin.id} USER id=${student.id} (emails redacted)`,
  )

  const adminToken = signHs256Jwt(
    { sub: String(admin.id), email: admin.email, role: admin.role },
    env.JWT_SECRET,
  )
  const userToken = signHs256Jwt(
    { sub: String(student.id), email: student.email, role: student.role },
    env.JWT_SECRET,
  )

  const meAdmin = await api('GET', '/auth/me', adminToken)
  const meUser = await api('GET', '/auth/me', userToken)
  record(
    'jwt auth works',
    meAdmin.status === 200 && meUser.status === 200 ? 'PASS' : 'FAIL',
    `admin=${meAdmin.status} user=${meUser.status}`,
  )
  if (meAdmin.status !== 200 || meUser.status !== 200) {
    await conn.end()
    process.exitCode = 1
    return
  }

  const sp = (
    await q<{ id: string }>(
      conn,
      `SELECT id FROM hs_math_specialties WHERE code='rja-ch1' AND is_active=1 LIMIT 1`,
    )
  )[0]
  const cat = (
    await q<{ id: string }>(
      conn,
      `SELECT id FROM hs_math_categories WHERE specialty_id=? AND code='default' AND is_active=1 LIMIT 1`,
      [sp.id],
    )
  )[0]
  assert(!!sp && !!cat, 'specialty/category missing')

  const opts2 = {
    options: [
      { id: 'A', text: '选项A-E2E' },
      { id: 'B', text: '选项B-E2E' },
    ],
  }
  const opts3 = {
    options: [
      { id: 'A', text: 'A' },
      { id: 'B', text: 'B' },
      { id: 'C', text: 'C' },
    ],
  }

  const itemSpecs = [
    {
      code: `${MARK}_single`,
      qtype: 'single',
      stem: `${MARK} single 题干`,
      optionsJson: opts2 as unknown,
      answerPayloadJson: { kind: 'single', optionId: 'A' },
    },
    {
      code: `${MARK}_multi`,
      qtype: 'multi',
      stem: `${MARK} multi 题干`,
      optionsJson: opts3 as unknown,
      answerPayloadJson: { kind: 'multi', optionIds: ['A', 'C'] },
    },
    {
      code: `${MARK}_judge`,
      qtype: 'judge',
      stem: `${MARK} judge 题干`,
      optionsJson: null as unknown,
      answerPayloadJson: { kind: 'judge', value: true },
    },
    {
      code: `${MARK}_numeric`,
      qtype: 'numeric',
      stem: `${MARK} numeric 题干`,
      optionsJson: null as unknown,
      answerPayloadJson: {
        kind: 'numeric',
        value: '1.5',
        toleranceAbs: 0.01,
        toleranceRel: 0,
      },
    },
    {
      code: `${MARK}_single2`,
      qtype: 'single',
      stem: `${MARK} single2 填充`,
      optionsJson: opts2 as unknown,
      answerPayloadJson: { kind: 'single', optionId: 'B' },
    },
  ]

  const createdIds: string[] = []

  for (const spec of itemSpecs) {
    await recordCase(`admin create ${spec.qtype}/${spec.code.split('_').pop()}`, async () => {
      const exist = (
        await q<{ id: string; status: string }>(
          conn,
          `SELECT id, status FROM hs_math_train_items WHERE code=? LIMIT 1`,
          [spec.code],
        )
      )[0]
      if (exist) {
        createdIds.push(String(exist.id))
        return
      }
      const body: Record<string, unknown> = {
        code: spec.code,
        qtype: spec.qtype,
        stem: spec.stem,
        answerPayloadJson: spec.answerPayloadJson,
        specialtyId: String(sp.id),
        categoryId: String(cat.id),
        difficulty: 1,
        pool: 'formal',
        analysis: `${MARK} 解析含标准答案勿泄露`,
      }
      if (spec.optionsJson !== null) body.optionsJson = spec.optionsJson
      const res = await api('POST', '/hs-math/admin/train-items', adminToken, body)
      assert(
        res.status === 200 || res.status === 201,
        `http ${res.status} ${JSON.stringify(res.json).slice(0, 220)}`,
      )
      const d = dataOf(res.json)
      assert(d.status === 'draft', `default status=${d.status}`)
      createdIds.push(String(d.id))
    })
  }

  await recordCase('USER cannot access admin create', async () => {
    const res = await api('POST', '/hs-math/admin/train-items', userToken, {
      code: `${MARK}_forbidden`,
      qtype: 'judge',
      stem: 'x',
      answerPayloadJson: { kind: 'judge', value: false },
      specialtyId: String(sp.id),
      categoryId: String(cat.id),
    })
    assert(res.status === 403, `expected 403 got ${res.status}`)
  })

  await recordCase('USER cannot approve', async () => {
    const id = createdIds[0]
    const res = await api(
      'PATCH',
      `/hs-math/admin/train-items/${id}/status`,
      userToken,
      { status: 'approved' },
    )
    assert(res.status === 403, `expected 403 got ${res.status}`)
  })

  await recordCase('ADMIN approve all e2e items', async () => {
    for (const id of createdIds) {
      const row = (
        await q<{ status: string }>(
          conn,
          `SELECT status FROM hs_math_train_items WHERE id=?`,
          [id],
        )
      )[0]
      if (row.status === 'approved') continue
      if (row.status === 'disabled') {
        const r0 = await api(
          'PATCH',
          `/hs-math/admin/train-items/${id}/status`,
          adminToken,
          { status: 'draft' },
        )
        assert(r0.status === 200, `to draft ${r0.status}`)
      }
      const r = await api(
        'PATCH',
        `/hs-math/admin/train-items/${id}/status`,
        adminToken,
        { status: 'approved' },
      )
      assert(
        r.status === 200,
        `approve ${id} status=${r.status} ${JSON.stringify(r.json).slice(0, 180)}`,
      )
      assert(dataOf(r.json).status === 'approved', 'approved')
    }
    const cnt = (
      await q<{ c: number }>(
        conn,
        `SELECT COUNT(*) AS c FROM hs_math_train_items
         WHERE code LIKE ? AND status='approved' AND is_active=1`,
        [`${MARK}%`],
      )
    )[0]
    assert(Number(cnt.c) >= 5, `approved e2e items=${cnt.c}`)
  })

  let sessionId = ''
  let numericSort = 0
  let submittedAt: string | null = null

  await recordCase('student create session', async () => {
    const res = await api('POST', '/hs-math/train/sessions', userToken, {
      specialtyId: String(sp.id),
      categoryId: String(cat.id),
      difficulty: 1,
      count: 5,
      mode: 'sequential',
      poolMode: 'formal',
    })
    assertOk(
      res.status,
      `create ${res.status} ${JSON.stringify(res.json).slice(0, 260)}`,
    )
    const d = dataOf(res.json)
    sessionId = String(d.id)
    assert(d.status === 'in_progress', 'status')
    assert(d.actualCount === 5, `actual=${d.actualCount}`)
    assert(Array.isArray(d.items) && d.items.length === 5, 'items')
    assert(leakKeys(d).length === 0, `leak=${leakKeys(d).join(',')}`)
    assert(d.correctCount === null, 'counts hidden')
    const snap = (
      await q<{ c: number }>(
        conn,
        `SELECT COUNT(*) AS c FROM hs_math_train_session_items
         WHERE session_id=? AND answer_payload_json IS NOT NULL`,
        [sessionId],
      )
    )[0]
    assert(Number(snap.c) === 5, 'snapshot answers in DB')
  })

  await recordCase('GET in_progress desensitized', async () => {
    assert(!!sessionId, 'sessionId missing from prior step')
    const res = await api('GET', `/hs-math/train/sessions/${sessionId}`, userToken)
    assertOk(res.status, `get ${res.status}`)
    assert(leakKeys(dataOf(res.json)).length === 0, 'leak')
  })

  await recordCase('PATCH answers overwrite + no grade yet', async () => {
    const res0 = await api('GET', `/hs-math/train/sessions/${sessionId}`, userToken)
    const items = dataOf(res0.json).items as Array<{
      sortOrder: number
      qtype: string
    }>
    const single = items.find((i) => i.qtype === 'single')!
    const judge = items.find((i) => i.qtype === 'judge')!
    const numeric = items.find((i) => i.qtype === 'numeric')!
    numericSort = numeric.sortOrder

    let r = await api(
      'PATCH',
      `/hs-math/train/sessions/${sessionId}/answers`,
      userToken,
      {
        sortOrder: single.sortOrder,
        userAnswerPayload: { kind: 'single', optionId: 'B' },
      },
    )
    assertOk(r.status, `patch1 ${r.status}`)
    r = await api(
      'PATCH',
      `/hs-math/train/sessions/${sessionId}/answers`,
      userToken,
      {
        sortOrder: single.sortOrder,
        userAnswerPayload: { kind: 'single', optionId: 'A' },
      },
    )
    assertOk(r.status, `patch2 ${r.status}`)
    assert(leakKeys(dataOf(r.json)).length === 0, 'no leak on patch')

    for (const it of items) {
      if (it.qtype === 'numeric') continue
      if (it.sortOrder === single.sortOrder) continue
      if (it.qtype === 'single') {
        await api('PATCH', `/hs-math/train/sessions/${sessionId}/answers`, userToken, {
          sortOrder: it.sortOrder,
          userAnswerPayload: { kind: 'single', optionId: 'B' },
        })
      } else if (it.qtype === 'multi') {
        await api('PATCH', `/hs-math/train/sessions/${sessionId}/answers`, userToken, {
          sortOrder: it.sortOrder,
          userAnswerPayload: { kind: 'multi', optionIds: ['C', 'A'] },
        })
      } else if (it.qtype === 'judge') {
        await api('PATCH', `/hs-math/train/sessions/${sessionId}/answers`, userToken, {
          sortOrder: it.sortOrder,
          userAnswerPayload: { kind: 'judge', value: true },
        })
      }
    }

    const rows = (
      await q<{ c: number }>(
        conn,
        `SELECT COUNT(*) AS c FROM hs_math_train_session_items WHERE session_id=?`,
        [sessionId],
      )
    )[0]
    assert(Number(rows.c) === 5, 'no duplicate session items')
    const graded = (
      await q<{ c: number }>(
        conn,
        `SELECT COUNT(*) AS c FROM hs_math_train_session_items
         WHERE session_id=? AND grade_result IS NOT NULL`,
        [sessionId],
      )
    )[0]
    assert(Number(graded.c) === 0, 'no grade before submit')

    const bad = await api(
      'PATCH',
      `/hs-math/train/sessions/${sessionId}/answers`,
      userToken,
      {
        sortOrder: judge.sortOrder,
        userAnswerPayload: { kind: 'judge', value: 'true' },
      },
    )
    assert(bad.status === 400, `illegal expect 400 got ${bad.status}`)
  })

  await recordCase('submit grades 4 types', async () => {
    const res = await api(
      'POST',
      `/hs-math/train/sessions/${sessionId}/submit`,
      userToken,
    )
    assertOk(
      res.status,
      `submit ${res.status} ${JSON.stringify(res.json).slice(0, 260)}`,
    )
    const d = dataOf(res.json)
    assert(d.status === 'completed', 'completed')
    assert(d.submitMeta?.idempotent === false, 'first submit')
    assert(Number(d.correctCount) === 4, `correct=${d.correctCount}`)
    assert(Number(d.wrongCount) === 0, `wrong=${d.wrongCount}`)
    assert(Number(d.pendingCount) === 1, `pending=${d.pendingCount}`)
    assert(d.accuracyPercent === 100, `acc=${d.accuracyPercent}`)
    assert(d.submittedAt, 'submittedAt')
    submittedAt = String(d.submittedAt)
    const grades = (d.items as any[]).map((i) => `${i.qtype}:${i.gradeResult}`)
    console.log('  grades=', grades.join(', '))
    assert(
      (d.items as any[]).every((i) => 'answerPayloadJson' in i && 'analysis' in i),
      'reveal after complete',
    )
    const num = (d.items as any[]).find((i) => i.sortOrder === numericSort)
    assert(num.gradeResult === 'pending_review', 'numeric pending')
  })

  await recordCase('idempotent resubmit', async () => {
    const res = await api(
      'POST',
      `/hs-math/train/sessions/${sessionId}/submit`,
      userToken,
    )
    assertOk(res.status, `resubmit ${res.status}`)
    const d = dataOf(res.json)
    assert(d.submitMeta?.idempotent === true, 'idempotent flag')
    assert(String(d.submittedAt) === submittedAt, 'submittedAt stable')
  })

  await recordCase('completed cannot PATCH', async () => {
    const res = await api(
      'PATCH',
      `/hs-math/train/sessions/${sessionId}/answers`,
      userToken,
      {
        sortOrder: 1,
        userAnswerPayload: { kind: 'single', optionId: 'A' },
      },
    )
    assert(res.status === 409, `expect 409 got ${res.status}`)
  })

  await recordCase('cancel desensitize', async () => {
    const created = await api('POST', '/hs-math/train/sessions', userToken, {
      specialtyId: String(sp.id),
      categoryId: String(cat.id),
      difficulty: 1,
      count: 5,
      mode: 'sequential',
    })
    const sid = String(dataOf(created.json).id)
    const cancel = await api(
      'POST',
      `/hs-math/train/sessions/${sid}/cancel`,
      userToken,
    )
    assertOk(cancel.status, `cancel ${cancel.status}`)
    const d = dataOf(cancel.json)
    assert(d.status === 'cancelled', 'cancelled')
    assert(leakKeys(d).length === 0, `cancel leak ${leakKeys(d)}`)
    const sub = await api(
      'POST',
      `/hs-math/train/sessions/${sid}/submit`,
      userToken,
    )
    assert(sub.status === 409, `cancel then submit ${sub.status}`)
  })

  await recordCase('user isolation', async () => {
    const created = await api('POST', '/hs-math/train/sessions', userToken, {
      specialtyId: String(sp.id),
      categoryId: String(cat.id),
      difficulty: 1,
      count: 5,
      mode: 'sequential',
    })
    const sid = String(dataOf(created.json).id)
    const g = await api('GET', `/hs-math/train/sessions/${sid}`, adminToken)
    assert(g.status === 404, `admin get expect 404 got ${g.status}`)
    const p = await api(
      'PATCH',
      `/hs-math/train/sessions/${sid}/answers`,
      adminToken,
      {
        sortOrder: 1,
        userAnswerPayload: { kind: 'single', optionId: 'A' },
      },
    )
    assert(p.status === 404, `admin patch expect 404 got ${p.status}`)
    const s = await api(
      'POST',
      `/hs-math/train/sessions/${sid}/submit`,
      adminToken,
    )
    assert(s.status === 404, `admin submit expect 404 got ${s.status}`)
    const c = await api(
      'POST',
      `/hs-math/train/sessions/${sid}/cancel`,
      adminToken,
    )
    assert(c.status === 404, `admin cancel expect 404 got ${c.status}`)
    await api('POST', `/hs-math/train/sessions/${sid}/cancel`, userToken)
  })

  const chemAfter = (
    await q<{ c: number }>(conn, 'SELECT COUNT(*) AS c FROM chem_specialties')
  )[0]
  const eqAfter = (
    await q<{ c: number }>(conn, 'SELECT COUNT(*) AS c FROM error_questions')
  )[0]
  const usersAfter = (
    await q<{ c: number; sig: string }>(
      conn,
      'SELECT COUNT(*) AS c, SUM(CRC32(CONCAT(id,email,role,password_hash))) AS sig FROM users',
    )
  )[0]

  record(
    'chem_* unchanged',
    Number(chemBefore.c) === Number(chemAfter.c) ? 'PASS' : 'FAIL',
    `${chemBefore.c}->${chemAfter.c}`,
  )
  record(
    'error_questions unchanged',
    Number(eqBefore.c) === Number(eqAfter.c) ? 'PASS' : 'FAIL',
    `${eqBefore.c}->${eqAfter.c}`,
  )
  record(
    'users unchanged',
    Number(usersBefore.c) === Number(usersAfter.c) &&
      String(usersBefore.sig) === String(usersAfter.sig)
      ? 'PASS'
      : 'FAIL',
    `count ${usersBefore.c}->${usersAfter.c}`,
  )

  await conn.end()

  const failed = results.filter((r) => r.status === 'FAIL')
  console.log('\n========== E2E SUMMARY ==========')
  console.log(
    `PASS=${results.filter((r) => r.status === 'PASS').length} FAIL=${failed.length} NOT_RUN=${results.filter((r) => r.status === 'NOT_RUN').length}`,
  )
  console.log(`sessionId=${sessionId}`)
  console.log(`itemIds=${createdIds.join(',')}`)
  console.log(failed.length ? 'OVERALL=FAIL' : 'OVERALL=PASS')
  if (failed.length) process.exitCode = 1

  const repoDocs = path.resolve(
    __dirname,
    '../../../../../docs/high_school_math/_e2e_last_result.json',
  )
  fs.writeFileSync(
    repoDocs,
    JSON.stringify(
      {
        overall: failed.length ? 'FAIL' : 'PASS',
        sessionId,
        itemIds: createdIds,
        results,
        at: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  )
}

main().catch((e) => {
  console.error('E2E aborted:', e instanceof Error ? e.message : e)
  process.exitCode = 1
})
