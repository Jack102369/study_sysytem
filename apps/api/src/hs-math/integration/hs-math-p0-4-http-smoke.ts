/**
 * P0-4 HTTP 冒烟：history / analytics / home（只读统计 + 列表）。
 * 需 API 已加载最新代码。运行：pnpm --filter api run hs-math:p0-4-smoke
 */
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { createConnection } from 'mysql2/promise'

function signHs256Jwt(payload: Record<string, unknown>, secret: string) {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const body = Buffer.from(
    JSON.stringify({ ...payload, iat: now, exp: now + 86400 }),
  ).toString('base64url')
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url')
  return `${header}.${body}.${sig}`
}

function loadEnv() {
  const env: Record<string, string> = { ...process.env } as any
  const p = path.join(__dirname, '../../../.env')
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m && env[m[1].trim()] === undefined) env[m[1].trim()] = m[2].trim()
  }
  return env
}

function leak(obj: unknown): string[] {
  const banned = ['answerPayloadJson', 'analysis', 'gradeResult', 'gradeReason']
  const bad: string[] = []
  const walk = (o: unknown, p = '') => {
    if (!o || typeof o !== 'object') return
    for (const [k, v] of Object.entries(o as object)) {
      const pathK = p ? `${p}.${k}` : k
      if (banned.includes(k)) bad.push(pathK)
      walk(v, pathK)
    }
  }
  walk(obj)
  return bad
}

async function api(method: string, url: string, token: string) {
  const res = await fetch(`http://127.0.0.1:3000${url}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const json = await res.json()
  return { status: res.status, json }
}

function data(json: any) {
  return json?.data ?? json
}

async function main() {
  const env = loadEnv()
  const conn = await createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD || '',
    database: 'study_system',
  })
  const [users] = await conn.query(
    `SELECT id, email, role FROM users WHERE is_disabled=0 AND role='USER' ORDER BY id LIMIT 1`,
  )
  const student = (users as any[])[0]
  await conn.end()
  if (!student) throw new Error('no USER')

  const token = signHs256Jwt(
    { sub: String(student.id), email: student.email, role: student.role },
    env.JWT_SECRET,
  )

  const results: string[] = []
  const ok = (name: string, cond: boolean, detail = '') => {
    results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${detail ? ': ' + detail : ''}`)
    if (!cond) throw new Error(name + ' ' + detail)
  }

  const list = await api('GET', '/hs-math/train/sessions?page=1&pageSize=5', token)
  ok('list sessions', list.status === 200 || list.status === 201, `status=${list.status}`)
  const ld = data(list.json)
  ok('list has items array', Array.isArray(ld.items))
  ok('list no answer leak', leak(ld).length === 0, leak(ld).join(','))

  const filtered = await api(
    'GET',
    '/hs-math/train/sessions?status=completed&page=1&pageSize=10',
    token,
  )
  ok('filter completed', filtered.status === 200 || filtered.status === 201)
  const fd = data(filtered.json)
  ok(
    'filtered all completed',
    (fd.items as any[]).every((i) => i.status === 'completed'),
  )

  const analytics = await api('GET', '/hs-math/train/analytics', token)
  ok('analytics', analytics.status === 200 || analytics.status === 201, `status=${analytics.status}`)
  const ad = data(analytics.json)
  ok('has overview', !!ad.overview)
  ok('has bySpecialty', Array.isArray(ad.bySpecialty))
  ok('has byDifficulty', Array.isArray(ad.byDifficulty))
  ok('has trend7d', Array.isArray(ad.trend7d) && ad.trend7d.length === 7)
  ok('has trend30d', Array.isArray(ad.trend30d) && ad.trend30d.length === 30)
  if (ad.overview.correctCount + ad.overview.wrongCount === 0) {
    ok('empty accuracy null', ad.overview.accuracy === null)
  } else {
    ok('accuracy finite', Number.isFinite(ad.overview.accuracy))
  }
  ok('analytics no answer leak', leak(ad).length === 0)

  const home = await api('GET', '/hs-math/home', token)
  ok('home', home.status === 200 || home.status === 201, `status=${home.status}`)
  const hd = data(home.json)
  ok('home overview', !!hd.overview)
  ok('home weeklyTrend 7', Array.isArray(hd.weeklyTrend) && hd.weeklyTrend.length === 7)
  ok('home recentSessions', Array.isArray(hd.recentSessions))
  ok('home availableSpecialties', typeof hd.availableSpecialties === 'number')
  ok('home no fake mastery', !('mastery' in (hd.overview || {})))
  ok('home no answer leak', leak(hd).length === 0)
  ok('shortcuts no fake wrong', hd.shortcuts?.wrongBookAvailable === false)

  console.log(results.join('\n'))
  console.log('P0-4 HTTP SMOKE PASS')
}

main().catch((e) => {
  console.error('SMOKE FAIL', e instanceof Error ? e.message : e)
  process.exitCode = 1
})
