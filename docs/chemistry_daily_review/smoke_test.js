'use strict'
/**
 * Smoke test daily review APIs as USER dhm@189.cn
 *   node docs/chemistry_daily_review/smoke_test.js
 */
const fs = require('fs')
const path = require('path')
const ROOT = path.resolve(__dirname, '../..')

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const port = env.PORT || '3000'
  const base = `http://127.0.0.1:${port}`
  const email = process.env.SMOKE_EMAIL || 'dhm@189.cn'
  const password = process.env.SMOKE_PASSWORD || ''
  let token = ''
  if (password) {
    const loginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const loginJson = await loginRes.json()
    if (!loginRes.ok) {
      console.error('login failed', loginJson)
      process.exit(1)
    }
    token = loginJson.data?.accessToken || loginJson.data?.token
  } else {
    // 本地冒烟：用 JWT_SECRET 签发 USER token（不改密码）
    const crypto = require('crypto')
    const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
    const conn = await mysql.createConnection({
      host: env.DB_HOST || '127.0.0.1',
      port: Number(env.DB_PORT || 3306),
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
    })
    const [[u]] = await conn.query(
      `SELECT id, email, role FROM users WHERE email=? LIMIT 1`,
      [email],
    )
    await conn.end()
    if (!u) {
      console.error('user not found', email)
      process.exit(1)
    }
    const b64url = (obj) =>
      Buffer.from(JSON.stringify(obj)).toString('base64url')
    const header = b64url({ alg: 'HS256', typ: 'JWT' })
    const payload = b64url({
      sub: String(u.id),
      email: u.email,
      role: u.role,
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
    const sig = crypto
      .createHmac('sha256', env.JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url')
    token = `${header}.${payload}.${sig}`
  }
  if (!token) {
    console.error('no token')
    process.exit(1)
  }
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const statusRes = await fetch(`${base}/chemistry/train/daily/status`, { headers: h })
  const status = await statusRes.json()
  console.log('STATUS', statusRes.status, JSON.stringify(status.data || status, null, 2))

  if (!statusRes.ok) process.exit(1)

  const createRes = await fetch(`${base}/chemistry/train/daily/sessions`, {
    method: 'POST',
    headers: h,
  })
  const created = await createRes.json()
  if (!createRes.ok) {
    console.error('CREATE_FAIL', createRes.status, JSON.stringify(created, null, 2))
    process.exit(1)
  }
  console.log(
    'CREATE',
    createRes.status,
    JSON.stringify(
      {
        id: created.data?.id,
        sessionKind: created.data?.sessionKind,
        actualCount: created.data?.actualCount,
        poolMode: created.data?.poolMode,
        specialtyName: created.data?.specialtyName,
        pickMeta: created.data?.pickMeta,
        itemCount: created.data?.items?.length,
      },
      null,
      2,
    ),
  )

  const sid = created.data.id
  // answer all with first option / 正确 / blank answer snapshot wrong ok for smoke
  for (const it of created.data.items || []) {
    let answer = '正确'
    if (it.qtype === 'single' && it.options?.length) answer = it.options[0].key
    if (it.qtype === 'blank') answer = 'H2O'
    await fetch(`${base}/chemistry/train/sessions/${sid}/answers`, {
      method: 'PATCH',
      headers: h,
      body: JSON.stringify({ sortOrder: it.sortOrder, answer }),
    })
  }
  const subRes = await fetch(`${base}/chemistry/train/sessions/${sid}/submit`, {
    method: 'POST',
    headers: h,
  })
  const submitted = await subRes.json()
  console.log(
    'SUBMIT',
    subRes.status,
    JSON.stringify(
      {
        status: submitted.data?.status,
        correct: submitted.data?.correctCount,
        wrong: submitted.data?.wrongCount,
        pending: submitted.data?.pendingCount,
        accuracy: submitted.data?.accuracyPercent,
        durationMs: submitted.data?.durationMs,
        durationNote: submitted.data?.durationNote,
      },
      null,
      2,
    ),
  )

  const insightRes = await fetch(
    `${base}/chemistry/train/daily/sessions/${sid}/insight`,
    { headers: h },
  )
  const insight = await insightRes.json()
  console.log('INSIGHT', insightRes.status, JSON.stringify(insight.data || insight, null, 2))

  const histRes = await fetch(`${base}/chemistry/train/daily/history`, { headers: h })
  const hist = await histRes.json()
  console.log(
    'HISTORY',
    histRes.status,
    JSON.stringify(
      {
        total: hist.data?.total,
        days: hist.data?.days?.map((d) => ({
          date: d.date,
          completedCount: d.completedCount,
          n: d.sessions.length,
        })),
      },
      null,
      2,
    ),
  )

  const st2 = await (await fetch(`${base}/chemistry/train/daily/status`, { headers: h })).json()
  console.log(
    'STATUS_AFTER',
    JSON.stringify(
      {
        todayCompletedOnce: st2.data?.todayCompletedOnce,
        todayCompletedCount: st2.data?.todayCompletedCount,
        inProgressSessionId: st2.data?.inProgressSessionId,
      },
      null,
      2,
    ),
  )

  // create second session (again practice)
  const create2 = await fetch(`${base}/chemistry/train/daily/sessions`, {
    method: 'POST',
    headers: h,
  })
  const c2 = await create2.json()
  const ids1 = new Set((created.data.items || []).map((x) => x.sortOrder + ':' + (x.stem || '').slice(0, 20)))
  const overlap = (c2.data?.items || []).filter((x) =>
    ids1.has(x.sortOrder + ':' + (x.stem || '').slice(0, 20)),
  ).length
  console.log(
    'CREATE2',
    create2.status,
    JSON.stringify({
      id: c2.data?.id,
      actualCount: c2.data?.actualCount,
      stemOverlapHeuristic: overlap,
    }),
  )

  // cancel second to not leave hanging
  if (c2.data?.id) {
    await fetch(`${base}/chemistry/train/sessions/${c2.data.id}/cancel`, {
      method: 'POST',
      headers: h,
    })
  }

  // specialty count unchanged
  const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  })
  const [[{ specs }]] = await conn.query(
    `SELECT COUNT(*) AS specs FROM chem_specialties WHERE is_active=1`,
  )
  const [[{ cats }]] = await conn.query(
    `SELECT COUNT(*) AS cats FROM chem_categories WHERE is_active=1`,
  )
  const [[{ items }]] = await conn.query(`SELECT COUNT(*) AS items FROM chem_train_items`)
  await conn.end()
  console.log('DB_SANITY', { specialties: specs, categories: cats, trainItems: items })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
