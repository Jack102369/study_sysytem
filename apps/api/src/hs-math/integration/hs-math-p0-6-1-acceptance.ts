/**
 * P0-6.1：双 USER 隔离（若有 2+ USER）+ 真实并发 HTTP + 脱敏抽检。
 * 仅操作 HS_MATH_P0_E2E_TEST* / 本脚本创建的测试会话。
 * 不打印 token/密码/邮箱。
 *
 * 运行：pnpm --filter api run hs-math:p0-6-1
 */
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { createConnection, type Connection } from 'mysql2/promise'

const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'
const MARK = 'HS_MATH_P0_E2E_TEST'
const TAG = 'HS_MATH_P0_6_1_TEST'

type Result = { name: string; status: 'PASS' | 'FAIL' | 'NOT_RUN' | 'PARTIAL'; detail?: string }
const results: Result[] = []

function record(name: string, status: Result['status'], detail?: string) {
  results.push({ name, status, detail })
  console.log(detail ? `${status}  ${name}: ${detail}` : `${status}  ${name}`)
}

function loadEnv() {
  const env: Record<string, string> = { ...process.env } as Record<string, string>
  const p = path.join(__dirname, '../../../.env')
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m && env[m[1].trim()] === undefined) env[m[1].trim()] = m[2].trim()
  }
  return env
}

function signJwt(sub: string, role: string, secret: string) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
    'base64url',
  )
  const now = Math.floor(Date.now() / 1000)
  const body = Buffer.from(
    JSON.stringify({ sub, role, iat: now, exp: now + 3600 }),
  ).toString('base64url')
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url')
  return `${header}.${body}.${sig}`
}

async function apiOnce(
  method: string,
  urlPath: string,
  token: string | null,
  body?: unknown,
) {
  const t0 = Date.now()
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text.slice(0, 200) }
  }
  return { status: res.status, json, startedAt: t0, endedAt: Date.now() }
}

async function api(
  method: string,
  urlPath: string,
  token: string | null,
  body?: unknown,
  retries = 2,
) {
  let lastErr: unknown
  for (let i = 0; i <= retries; i++) {
    try {
      return await apiOnce(method, urlPath, token, body)
    } catch (e) {
      lastErr = e
      await new Promise((r) => setTimeout(r, 250 * (i + 1)))
    }
  }
  throw lastErr
}

function dataOf(json: unknown): any {
  const j = json as any
  if (j?.success === true && j.data !== undefined) return j.data
  return j
}

function leakKeys(obj: unknown): string[] {
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
  const walk = (o: any, pfx: string) => {
    if (!o || typeof o !== 'object') return
    for (const [k, v] of Object.entries(o)) {
      const pathKey = pfx ? `${pfx}.${k}` : k
      if (banned.includes(k)) bad.push(pathKey)
      if (v && typeof v === 'object') walk(v, pathKey)
    }
  }
  walk(obj, '')
  return bad
}

async function q<T>(conn: Connection, sql: string, params: unknown[] = []) {
  const [rows] = await conn.query(sql, params)
  return rows as T[]
}

/** 真正并行：同一时刻发出两个 Promise */
async function racePair<T>(a: () => Promise<T>, b: () => Promise<T>) {
  const barrier = { go: null as null | (() => void) }
  const ready = new Promise<void>((resolve) => {
    barrier.go = resolve
  })
  let aStarted = 0
  let bStarted = 0
  const pa = (async () => {
    await ready
    aStarted = Date.now()
    return a()
  })()
  const pb = (async () => {
    await ready
    bStarted = Date.now()
    return b()
  })()
  // 等两边都挂起后再放行
  await new Promise((r) => setImmediate(r))
  barrier.go!()
  const [ra, rb] = await Promise.all([pa, pb])
  return { ra, rb, aStarted, bStarted, overlapMs: Math.abs(aStarted - bStarted) }
}

async function main() {
  const env = loadEnv()
  const secret = env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET missing')

  const conn = await createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME || 'study_system',
  })

  const dbRow = (
    await q<{ db: string; ver: string }>(
      conn,
      'SELECT DATABASE() AS db, VERSION() AS ver',
    )
  )[0]
  record('env database', dbRow.db === 'study_system' ? 'PASS' : 'FAIL', `db=${dbRow.db}`)
  record('env mysql', 'PASS', `version=${dbRow.ver}`)

  const tables = await q<{ n: string }>(
    conn,
    `SELECT table_name AS n FROM information_schema.tables
     WHERE table_schema=DATABASE() AND table_name LIKE 'hs_math_%'`,
  )
  record(
    'env hs_math tables',
    tables.length >= 5 ? 'PASS' : 'FAIL',
    `count=${tables.length}`,
  )

  const users = await q<{ id: string; role: string }>(
    conn,
    `SELECT id, role FROM users WHERE role='USER' ORDER BY id`,
  )
  const admins = await q<{ id: string; role: string }>(
    conn,
    `SELECT id, role FROM users WHERE role='ADMIN' ORDER BY id`,
  )
  record(
    'env accounts',
    'PASS',
    `USER_count=${users.length} ids=[${users.map((u) => u.id).join(',')}] ADMIN_count=${admins.length}`,
  )

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

  const health = await api('GET', '/health', null)
  record(
    'api health',
    health.status === 200 ? 'PASS' : 'FAIL',
    `status=${health.status}`,
  )

  // —— unauth ——
  const unauth = await api('GET', '/hs-math/home', null)
  record(
    'unauth home',
    unauth.status === 401 ? 'PASS' : 'FAIL',
    `status=${unauth.status}`,
  )

  if (!users.length || !admins.length) {
    record('dual-user', 'NOT_RUN', 'missing USER or ADMIN')
    record('concurrency', 'NOT_RUN', 'blocked by missing accounts')
    await conn.end()
    finish()
    return
  }

  const userA = users[0]
  const admin = admins[0]
  const tokenA = signJwt(String(userA.id), 'USER', secret)
  const tokenAdmin = signJwt(String(admin.id), 'ADMIN', secret)

  // 取已批准 E2E 题所在分类
  const item = (
    await q<{ specialty_id: string; category_id: string }>(
      conn,
      `SELECT specialty_id, category_id FROM hs_math_train_items
       WHERE code=? AND status='approved' LIMIT 1`,
      [`${MARK}_single`],
    )
  )[0]
  if (!item) {
    record('seed items', 'FAIL', 'run hs-math:e2e first to seed marked items')
    await conn.end()
    finish()
    return
  }
  record('seed items', 'PASS', `using ${MARK}_* approved items`)

  const createBody = {
    specialtyId: String(item.specialty_id),
    categoryId: String(item.category_id),
    difficulty: 1,
    count: 5,
    mode: 'sequential' as const,
    poolMode: 'formal' as const,
  }

  // ========== Dual USER ==========
  if (users.length < 2) {
    record(
      'dual-user isolation',
      'NOT_RUN',
      'only 1 USER in DB; need second approved USER account (do not auto-create)',
    )
  } else {
    const userB = users[1]
    const tokenB = signJwt(String(userB.id), 'USER', secret)
    const created = await api('POST', '/hs-math/train/sessions', tokenA, createBody)
    const sid = String(dataOf(created.json).id)
    const ops = [
      ['GET', `/hs-math/train/sessions/${sid}`],
      [
        'PATCH',
        `/hs-math/train/sessions/${sid}/answers`,
        {
          sortOrder: 1,
          userAnswerPayload: { kind: 'single', optionId: 'A' },
        },
      ],
      ['POST', `/hs-math/train/sessions/${sid}/submit`],
      ['POST', `/hs-math/train/sessions/${sid}/cancel`],
    ] as const

    let dualOk = true
    for (const op of ops) {
      const method = op[0]
      const url = op[1]
      const body = op[2]
      const r = await api(method, url, tokenB, body)
      if (r.status !== 404) {
        dualOk = false
        record(`dual-user ${method}`, 'FAIL', `expect 404 got ${r.status}`)
      } else {
        record(`dual-user ${method}`, 'PASS', '404')
      }
    }

    // B history / analytics / home must not contain A's session
    const histB = await api('GET', '/hs-math/train/sessions?page=1&pageSize=50', tokenB)
    const itemsB = (dataOf(histB.json).items || []) as any[]
    if (itemsB.some((i) => String(i.sessionId) === sid)) {
      dualOk = false
      record('dual-user history leak', 'FAIL', 'A session in B history')
    } else {
      record('dual-user history', 'PASS')
    }

    const homeB = await api('GET', '/hs-math/home', tokenB)
    const recent = (dataOf(homeB.json).recentSessions || []) as any[]
    if (recent.some((i) => String(i.sessionId) === sid)) {
      dualOk = false
      record('dual-user home leak', 'FAIL')
    } else {
      record('dual-user home', 'PASS')
    }

    const anaB = await api('GET', '/hs-math/train/analytics', tokenB)
    record(
      'dual-user analytics',
      anaB.status === 200 ? 'PASS' : 'FAIL',
      `status=${anaB.status} (no A session stats assert via isolation of sessions)`,
    )

    // cancel A's leftover
    await api('POST', `/hs-math/train/sessions/${sid}/cancel`, tokenA)
    record('dual-user isolation', dualOk ? 'PASS' : 'FAIL')
  }

  // ADMIN cannot access USER session
  {
    const created = await api('POST', '/hs-math/train/sessions', tokenA, createBody)
    const sid = String(dataOf(created.json).id)
    const g = await api('GET', `/hs-math/train/sessions/${sid}`, tokenAdmin)
    record(
      'admin cannot read user session',
      g.status === 404 ? 'PASS' : 'FAIL',
      `status=${g.status}`,
    )
    await api('POST', `/hs-math/train/sessions/${sid}/cancel`, tokenA)
  }

  // ========== Desensitization ==========
  try {
    const created = await api('POST', '/hs-math/train/sessions', tokenA, createBody)
    const session = dataOf(created.json)
    const sid = String(session.id)
    const leaksIn = leakKeys(session)
    record(
      'desense in_progress',
      leaksIn.length === 0 ? 'PASS' : 'FAIL',
      leaksIn.join(',') || 'ok',
    )
    const cancel = await api('POST', `/hs-math/train/sessions/${sid}/cancel`, tokenA)
    const leaksC = leakKeys(dataOf(cancel.json))
    record(
      'desense cancelled',
      leaksC.length === 0 ? 'PASS' : 'FAIL',
      leaksC.join(',') || 'ok',
    )

    await new Promise((r) => setTimeout(r, 100))
    const created2 = await api('POST', '/hs-math/train/sessions', tokenA, createBody)
    const s2 = dataOf(created2.json)
    for (const it of s2.items as any[]) {
      if (it.qtype === 'single') {
        await api('PATCH', `/hs-math/train/sessions/${s2.id}/answers`, tokenA, {
          sortOrder: it.sortOrder,
          userAnswerPayload: { kind: 'single', optionId: 'A' },
        })
      } else if (it.qtype === 'multi') {
        await api('PATCH', `/hs-math/train/sessions/${s2.id}/answers`, tokenA, {
          sortOrder: it.sortOrder,
          userAnswerPayload: { kind: 'multi', optionIds: ['A', 'C'] },
        })
      } else if (it.qtype === 'judge') {
        await api('PATCH', `/hs-math/train/sessions/${s2.id}/answers`, tokenA, {
          sortOrder: it.sortOrder,
          userAnswerPayload: { kind: 'judge', value: true },
        })
      } else if (it.qtype === 'numeric') {
        await api('PATCH', `/hs-math/train/sessions/${s2.id}/answers`, tokenA, {
          sortOrder: it.sortOrder,
          userAnswerPayload: { kind: 'numeric', input: '1.5' },
        })
      }
    }
    const sub = await api('POST', `/hs-math/train/sessions/${s2.id}/submit`, tokenA)
    const d = dataOf(sub.json)
    const hasReveal =
      d.status === 'completed' &&
      Array.isArray(d.items) &&
      (d.items as any[]).every((i) => 'answerPayloadJson' in i && 'analysis' in i)
    record('desense completed reveal', hasReveal ? 'PASS' : 'FAIL')

    const list = await api('GET', '/hs-math/train/sessions?page=1&pageSize=5', tokenA)
    const listLeak = leakKeys(dataOf(list.json))
    record(
      'desense history list',
      listLeak.length === 0 ? 'PASS' : 'FAIL',
      listLeak.join(',') || 'ok',
    )
  } catch (e: any) {
    record('desense block', 'FAIL', String(e?.message || e).slice(0, 160))
  }

  // ========== Concurrency ==========
  async function createAnsweredSession() {
    const created = await api('POST', '/hs-math/train/sessions', tokenA, createBody)
    const s = dataOf(created.json)
    for (const it of s.items as any[]) {
      let payload: any = null
      if (it.qtype === 'single') payload = { kind: 'single', optionId: 'A' }
      else if (it.qtype === 'multi')
        payload = { kind: 'multi', optionIds: ['A', 'C'] }
      else if (it.qtype === 'judge') payload = { kind: 'judge', value: true }
      else if (it.qtype === 'numeric')
        payload = { kind: 'numeric', input: '1.5' }
      if (payload) {
        await api('PATCH', `/hs-math/train/sessions/${s.id}/answers`, tokenA, {
          sortOrder: it.sortOrder,
          userAnswerPayload: payload,
        })
      }
    }
    return String(s.id)
  }

  async function runScene(name: string, fn: () => Promise<void>) {
    try {
      await new Promise((r) => setTimeout(r, 150))
      await fn()
    } catch (e: any) {
      record(name, 'FAIL', String(e?.message || e).slice(0, 180))
    }
  }

  // Scene1: dual submit — use apiOnce so retries do not break overlap semantics
  await runScene('concurrent dual-submit', async () => {
    const sid = await createAnsweredSession()
    const { ra, rb, aStarted, bStarted, overlapMs } = await racePair(
      () => apiOnce('POST', `/hs-math/train/sessions/${sid}/submit`, tokenA),
      () => apiOnce('POST', `/hs-math/train/sessions/${sid}/submit`, tokenA),
    )
    const da = dataOf(ra.json)
    const db = dataOf(rb.json)
    const row = (
      await q<{
        status: string
        submitted_at: Date
        correct_count: number
      }>(
        conn,
        `SELECT status, submitted_at, correct_count
         FROM hs_math_train_sessions WHERE id=?`,
        [sid],
      )
    )[0]
    const firstFlags = [da.submitMeta?.idempotent, db.submitMeta?.idempotent]
    const oneFirst = firstFlags.filter((x) => x === false).length === 1
    const oneIdem = firstFlags.filter((x) => x === true).length === 1
    const bothOk =
      (ra.status === 200 || ra.status === 201) &&
      (rb.status === 200 || rb.status === 201)
    const stable =
      row.status === 'completed' &&
      String(da.submittedAt) === String(db.submittedAt) &&
      Number(da.correctCount) === Number(row.correct_count)
    // overlapΔ 证明同时发出；<50ms 为强重叠证据，否则 PARTIAL
    const strongOverlap = overlapMs < 50
    record(
      'concurrent dual-submit',
      bothOk && oneFirst && oneIdem && stable
        ? strongOverlap
          ? 'PASS'
          : 'PARTIAL'
        : 'FAIL',
      `overlapΔ=${overlapMs}ms aStart=${aStarted} bStart=${bStarted} idem=[${firstFlags}] status=${row.status} submittedAt_stable=${String(da.submittedAt) === String(db.submittedAt)}`,
    )
  })

  await runScene('idempotent resubmit', async () => {
    const sid = await createAnsweredSession()
    const first = await api('POST', `/hs-math/train/sessions/${sid}/submit`, tokenA)
    const d1 = dataOf(first.json)
    const second = await api('POST', `/hs-math/train/sessions/${sid}/submit`, tokenA)
    const d2 = dataOf(second.json)
    const ok =
      d1.submitMeta?.idempotent === false &&
      d2.submitMeta?.idempotent === true &&
      String(d1.submittedAt) === String(d2.submittedAt) &&
      Number(d1.correctCount) === Number(d2.correctCount)
    record(
      'idempotent resubmit',
      ok ? 'PASS' : 'FAIL',
      `submittedAt_stable=${String(d1.submittedAt) === String(d2.submittedAt)}`,
    )
  })

  await runScene('concurrent PATCH vs submit', async () => {
    const sid = await createAnsweredSession()
    const { ra, rb, overlapMs } = await racePair(
      () =>
        apiOnce('PATCH', `/hs-math/train/sessions/${sid}/answers`, tokenA, {
          sortOrder: 1,
          userAnswerPayload: { kind: 'single', optionId: 'B' },
        }),
      () => apiOnce('POST', `/hs-math/train/sessions/${sid}/submit`, tokenA),
    )
    const row = (
      await q<{ status: string }>(
        conn,
        `SELECT status FROM hs_math_train_sessions WHERE id=?`,
        [sid],
      )
    )[0]
    let ok = row.status === 'completed'
    if (ra.status === 200 || ra.status === 201) {
      if (row.status !== 'completed') {
        const sub = await api('POST', `/hs-math/train/sessions/${sid}/submit`, tokenA)
        ok = sub.status === 200 || sub.status === 201
      }
    } else if (ra.status === 409) {
      ok = row.status === 'completed'
    } else {
      ok = false
    }
    const after = await api(
      'PATCH',
      `/hs-math/train/sessions/${sid}/answers`,
      tokenA,
      {
        sortOrder: 1,
        userAnswerPayload: { kind: 'single', optionId: 'A' },
      },
    )
    const patchAfterBlocked = after.status === 409 || after.status === 404
    record(
      'concurrent PATCH vs submit',
      ok && patchAfterBlocked ? 'PASS' : 'FAIL',
      `overlapΔ=${overlapMs}ms patch=${ra.status} submit=${rb.status} final=${row.status} patchAfter=${after.status}`,
    )
  })

  await runScene('concurrent cancel vs submit', async () => {
    const sid = await createAnsweredSession()
    const { ra, rb, overlapMs } = await racePair(
      () => apiOnce('POST', `/hs-math/train/sessions/${sid}/cancel`, tokenA),
      () => apiOnce('POST', `/hs-math/train/sessions/${sid}/submit`, tokenA),
    )
    const row = (
      await q<{ status: string }>(
        conn,
        `SELECT status FROM hs_math_train_sessions WHERE id=?`,
        [sid],
      )
    )[0]
    const finalOk = row.status === 'completed' || row.status === 'cancelled'
    record(
      'concurrent cancel vs submit',
      finalOk ? 'PASS' : 'FAIL',
      `overlapΔ=${overlapMs}ms cancel=${ra.status} submit=${rb.status} final=${row.status}`,
    )
  })

  await runScene('concurrent dual-PATCH', async () => {
    const created = await api('POST', '/hs-math/train/sessions', tokenA, createBody)
    const sid = String(dataOf(created.json).id)
    const { ra, rb, overlapMs } = await racePair(
      () =>
        apiOnce('PATCH', `/hs-math/train/sessions/${sid}/answers`, tokenA, {
          sortOrder: 1,
          userAnswerPayload: { kind: 'single', optionId: 'A' },
        }),
      () =>
        apiOnce('PATCH', `/hs-math/train/sessions/${sid}/answers`, tokenA, {
          sortOrder: 1,
          userAnswerPayload: { kind: 'single', optionId: 'B' },
        }),
    )
    const itemRow = (
      await q<{ payload: string; c: number }>(
        conn,
        `SELECT user_answer_payload_json AS payload,
                (SELECT COUNT(*) FROM hs_math_train_session_items WHERE session_id=?) AS c
         FROM hs_math_train_session_items WHERE session_id=? AND sort_order=1`,
        [sid, sid],
      )
    )[0]
    const bothOk =
      (ra.status === 200 || ra.status === 201) &&
      (rb.status === 200 || rb.status === 201)
    const noDup = Number(itemRow.c) === 5
    const payloadRaw = itemRow.payload as unknown
    const payloadStr =
      typeof payloadRaw === 'string'
        ? payloadRaw
        : JSON.stringify(payloadRaw ?? '')
    const lastIsAorB =
      payloadStr.includes('"optionId":"A"') ||
      payloadStr.includes('"optionId":"B"')
    record(
      'concurrent dual-PATCH',
      bothOk && noDup && lastIsAorB ? 'PASS' : 'FAIL',
      `overlapΔ=${overlapMs}ms a=${ra.status} b=${rb.status} itemCount=${itemRow.c} payload_has_option=${lastIsAorB}`,
    )
    await api('POST', `/hs-math/train/sessions/${sid}/cancel`, tokenA)
  })

  // ========== Regression counts ==========
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
    'regression chem_specialties',
    Number(chemBefore.c) === Number(chemAfter.c) ? 'PASS' : 'FAIL',
    `${chemBefore.c}->${chemAfter.c}`,
  )
  record(
    'regression error_questions',
    Number(eqBefore.c) === Number(eqAfter.c) ? 'PASS' : 'FAIL',
    `${eqBefore.c}->${eqAfter.c}`,
  )
  record(
    'regression users',
    Number(usersBefore.c) === Number(usersAfter.c) &&
      String(usersBefore.sig) === String(usersAfter.sig)
      ? 'PASS'
      : 'FAIL',
    `count ${usersBefore.c}->${usersAfter.c}`,
  )

  void TAG
  await conn.end()
  finish()
}

function finish() {
  const fail = results.filter((r) => r.status === 'FAIL').length
  const notRun = results.filter((r) => r.status === 'NOT_RUN').length
  const partial = results.filter((r) => r.status === 'PARTIAL').length
  console.log('\n========== P0-6.1 SUMMARY ==========')
  for (const r of results) {
    console.log(`${r.status}\t${r.name}${r.detail ? ` | ${r.detail}` : ''}`)
  }
  console.log(`FAIL=${fail} NOT_RUN=${notRun} PARTIAL=${partial}`)
  const out = path.join(
    __dirname,
    '../../../../../docs/high_school_math/_p0_6_1_last_result.json',
  )
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, JSON.stringify({ results, at: new Date().toISOString() }, null, 2))
  console.log(`wrote ${out}`)
  process.exitCode = fail > 0 ? 1 : 0
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
