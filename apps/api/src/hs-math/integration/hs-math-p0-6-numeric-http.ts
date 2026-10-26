/**
 * P0-6：numeric 正确/错误/容差/科学计数法 — 真实 HTTP（study_system）。
 * 运行：pnpm --filter api exec ts-node --transpile-only src/hs-math/integration/hs-math-p0-6-numeric-http.ts
 */
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { createConnection } from 'mysql2/promise'

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

const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'
const MARK = 'HS_MATH_P0_E2E_TEST'

async function api(
  method: string,
  urlPath: string,
  token: string,
  body?: unknown,
) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  return { status: res.status, json }
}

function dataOf(json: unknown): any {
  const j = json as any
  if (j?.success === true && j.data !== undefined) return j.data
  return j
}

async function main() {
  const env = loadEnv()
  const conn = await createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME || 'study_system',
  })
  const [users] = await conn.query(
    `SELECT id, role FROM users WHERE role IN ('ADMIN','USER') ORDER BY role, id`,
  )
  const user = (users as any[]).find((u) => u.role === 'USER')
  const admin = (users as any[]).find((u) => u.role === 'ADMIN')
  if (!user || !admin) throw new Error('need USER+ADMIN')
  const secret = env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET missing')
  const userToken = signHs256Jwt(
    { sub: String(user.id), role: 'USER' },
    secret,
  )
  const adminToken = signHs256Jwt(
    { sub: String(admin.id), role: 'ADMIN' },
    secret,
  )

  const [items] = await conn.query(
    `SELECT id, code, specialty_id, category_id FROM hs_math_train_items
     WHERE code=? AND status='approved' LIMIT 1`,
    [`${MARK}_numeric`],
  )
  const numItem = (items as any[])[0]
  if (!numItem) throw new Error('numeric e2e item missing; run hs-math:e2e first')

  const cases: Array<{ name: string; input: string; expect: string }> = [
    { name: 'exact correct', input: '1.5', expect: 'correct' },
    { name: 'fraction equiv', input: '3/2', expect: 'correct' },
    { name: 'within abs tol', input: '1.505', expect: 'correct' },
    { name: 'outside abs tol', input: '1.6', expect: 'wrong' },
    { name: 'scientific reject', input: '1.5e0', expect: 'pending_review' },
    { name: 'illegal', input: 'abc', expect: 'pending_review' },
  ]

  let fail = 0
  for (const c of cases) {
    const created = await api('POST', '/hs-math/train/sessions', userToken, {
      specialtyId: String(numItem.specialty_id),
      categoryId: String(numItem.category_id),
      difficulty: 1,
      count: 5,
      mode: 'sequential',
    })
    if (created.status !== 200 && created.status !== 201) {
      console.log('FAIL create', created.status, created.json)
      fail++
      continue
    }
    const session = dataOf(created.json)
    const item = (session.items as any[]).find((i) => i.qtype === 'numeric')
    if (!item) {
      console.log('FAIL no numeric in session')
      fail++
      await api('POST', `/hs-math/train/sessions/${session.id}/cancel`, userToken)
      continue
    }
    await api('PATCH', `/hs-math/train/sessions/${session.id}/answers`, userToken, {
      sortOrder: item.sortOrder,
      userAnswerPayload: { kind: 'numeric', input: c.input },
    })
    const sub = await api(
      'POST',
      `/hs-math/train/sessions/${session.id}/submit`,
      userToken,
    )
    const d = dataOf(sub.json)
    const graded = (d.items as any[]).find((i: any) => i.sortOrder === item.sortOrder)
    const got = graded?.gradeResult
    const ok = got === c.expect
    console.log(ok ? 'PASS' : 'FAIL', c.name, `input=${c.input} expect=${c.expect} got=${got}`)
    if (!ok) fail++
  }

  // 非法 judge 类型不应 500
  const bad = await api('POST', '/hs-math/train/sessions', userToken, {
    specialtyId: String(numItem.specialty_id),
    categoryId: String(numItem.category_id),
    difficulty: 1,
    count: 5,
    mode: 'sequential',
  })
  const sid = dataOf(bad.json).id
  const badPatch = await api(
    'PATCH',
    `/hs-math/train/sessions/${sid}/answers`,
    userToken,
    {
      sortOrder: 1,
      userAnswerPayload: { kind: 'numeric', input: '1e3' },
    },
  )
  console.log(
    badPatch.status < 500 ? 'PASS' : 'FAIL',
    'scientific patch no 500',
    `status=${badPatch.status}`,
  )
  if (badPatch.status >= 500) fail++
  await api('POST', `/hs-math/train/sessions/${sid}/cancel`, userToken)

  // DB integrity snippets
  const [orphans] = await conn.query(
    `SELECT COUNT(*) AS c FROM hs_math_train_session_items i
     LEFT JOIN hs_math_train_sessions s ON s.id=i.session_id
     WHERE s.id IS NULL`,
  )
  const [dupSort] = await conn.query(
    `SELECT session_id, sort_order, COUNT(*) c FROM hs_math_train_session_items
     GROUP BY session_id, sort_order HAVING c>1`,
  )
  const [ungradedDone] = await conn.query(
    `SELECT COUNT(*) AS c FROM hs_math_train_session_items i
     INNER JOIN hs_math_train_sessions s ON s.id=i.session_id
     WHERE s.status='completed' AND i.grade_result IS NULL`,
  )
  console.log(
    'DB orphans=',
    (orphans as any[])[0].c,
    'dupSortRows=',
    (dupSort as any[]).length,
    'completedUngraded=',
    (ungradedDone as any[])[0].c,
  )
  if (Number((orphans as any[])[0].c) !== 0) fail++
  if ((dupSort as any[]).length !== 0) fail++
  if (Number((ungradedDone as any[])[0].c) !== 0) fail++

  void adminToken
  await conn.end()
  console.log(fail === 0 ? 'P0-6 NUMERIC HTTP PASS' : `P0-6 NUMERIC HTTP FAIL count=${fail}`)
  process.exitCode = fail === 0 ? 0 : 1
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
