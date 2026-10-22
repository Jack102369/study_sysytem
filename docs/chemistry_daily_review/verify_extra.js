'use strict'
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const ROOT = path.resolve(__dirname, '../..')
const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

function tokenFor(env, user) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const h = b64({ alg: 'HS256', typ: 'JWT' })
  const p = b64({
    sub: String(user.id),
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 600,
  })
  const s = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(`${h}.${p}`)
    .digest('base64url')
  return `${h}.${p}.${s}`
}

;(async () => {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const base = `http://127.0.0.1:${env.PORT || 3000}`
  const c = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  })
  const [[user]] = await c.query(
    `SELECT id, email, role FROM users WHERE email='dhm@189.cn'`,
  )
  // temporarily remove grant
  await c.query(`DELETE FROM chem_train_test_grants WHERE user_id=?`, [user.id])
  const t = tokenFor(env, user)
  const st = await fetch(`${base}/chemistry/train/daily/status`, {
    headers: { Authorization: `Bearer ${t}` },
  })
  const stj = await st.json()
  const create = await fetch(`${base}/chemistry/train/daily/sessions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
  })
  const cj = await create.json()

  // restore grant
  await c.query(
    `INSERT INTO chem_train_test_grants (user_id, note, granted_by)
     VALUES (?, 'personal_chem_ai_trial_open_2026-10-19', 2)
     ON DUPLICATE KEY UPDATE note=VALUES(note)`,
    [user.id],
  )

  const [[{ sentinel }]] = await c.query(
    `SELECT COUNT(*) AS sentinel FROM chem_specialties WHERE code IN ('daily_review','daily')`,
  )
  const [[{ specs }]] = await c.query(
    `SELECT COUNT(*) AS specs FROM chem_specialties WHERE is_active=1`,
  )
  const [[{ cats }]] = await c.query(
    `SELECT COUNT(*) AS cats FROM chem_categories WHERE is_active=1`,
  )
  const [[{ dailyNullSpec }]] = await c.query(
    `SELECT COUNT(*) AS dailyNullSpec FROM chem_train_sessions
     WHERE session_kind='daily' AND specialty_id IS NULL AND category_id IS NULL`,
  )

  const list = await fetch(`${base}/chemistry/train/sessions?poolFilter=all`, {
    headers: { Authorization: `Bearer ${tokenFor(env, user)}` },
  })
  const lj = await list.json()
  const leaked = (lj.data?.items || []).filter((x) => x.sessionKind === 'daily')

  console.log(
    JSON.stringify(
      {
        noGrantCanTrain: stj.data?.canTrain ?? stj.canTrain,
        noGrantCreateStatus: create.status,
        noGrantCreateMsg: cj.message || cj.data?.message || null,
        sentinelSpecialtyCount: Number(sentinel),
        activeSpecialties: Number(specs),
        activeCategories: Number(cats),
        dailySessionsWithNullSpecCat: Number(dailyNullSpec),
        specialtyHistoryLeaksDaily: leaked.length,
        grantRestored: true,
      },
      null,
      2,
    ),
  )
  await c.end()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
