'use strict'
/**
 * 提高与挑战训练入口冒烟：
 * - 方程式配平：基础5 / 提高0 / 挑战0（无难度回退）
 * - advanced raise/challenge/mix availableCount
 * - 首批60道筛选
 * - 跨专项组卷难度正确、含真实专项标签
 * - advanced 不计入每日完成
 * - 旧历史 kindFilter 兼容
 *   node docs/chemistry_advanced_entry/smoke_test.js
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const ROOT = path.resolve(__dirname, '../..')
const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
const bcrypt = require(path.join(ROOT, 'apps/api/node_modules/bcrypt'))

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

function mintJwt(env, user) {
  const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const header = b64url({ alg: 'HS256', typ: 'JWT' })
  const payload = b64url({
    sub: String(user.id),
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })
  const sig = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url')
  return `${header}.${payload}.${sig}`
}

async function ensureUser(conn, email, role = 'USER') {
  const [[u]] = await conn.query(
    `SELECT id, email, role, is_disabled FROM users WHERE email=? LIMIT 1`,
    [email],
  )
  if (u) return u
  const hash = await bcrypt.hash('SmokeAdvEntry!2026', 10)
  const [r] = await conn.query(
    `INSERT INTO users (email, password_hash, nickname, grade, role, is_disabled)
     VALUES (?,?,?,?,?,0)`,
    [email, hash, email.split('@')[0].slice(0, 32), '高一', role],
  )
  return { id: r.insertId, email, role, is_disabled: 0 }
}

async function setGrant(conn, userId, enable, adminId) {
  if (enable) {
    await conn.query(
      `INSERT INTO chem_train_test_grants (user_id, note, granted_by)
       VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE note=VALUES(note)`,
      [userId, '[adv_entry_smoke] grant', adminId],
    )
  } else {
    await conn.query(`DELETE FROM chem_train_test_grants WHERE user_id=?`, [userId])
  }
}

async function api(base, token, method, urlPath, body) {
  const res = await fetch(`${base}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

function dataOf(res) {
  return res.json?.data ?? res.json
}

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const base = `http://127.0.0.1:${env.PORT || 3000}`
  const report = {
    generatedAt: new Date().toISOString(),
    ok: true,
    checks: [],
  }
  const check = (name, pass, detail) => {
    report.checks.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) })
    if (!pass) report.ok = false
    console.log(pass ? 'PASS' : 'FAIL', name, detail || '')
  }

  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })

  const [[admin]] = await conn.query(
    `SELECT id FROM users WHERE role='ADMIN' AND is_disabled=0 ORDER BY id LIMIT 1`,
  )
  const [[dhm]] = await conn.query(
    `SELECT id, email, role, is_disabled FROM users WHERE email='dhm@189.cn' LIMIT 1`,
  )
  check('dhm_user_exists', !!dhm, dhm ? `id=${dhm.id}` : 'missing')

  const smokeUser = await ensureUser(conn, 'chem_adv_entry_smoke@local.test')
  await setGrant(conn, smokeUser.id, true, admin ? admin.id : null)

  // DB ground truth: equation/balance by difficulty
  const [balCounts] = await conn.query(
    `SELECT i.difficulty, COUNT(*) AS n
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id
     WHERE s.code='equation' AND c.code='balance'
       AND i.pool='test' AND i.status='approved' AND i.is_active=1
       AND (i.gate_note IS NULL OR i.gate_note NOT LIKE '%[trial_access:block]%')
     GROUP BY i.difficulty`,
  )
  const byDiff = Object.fromEntries(balCounts.map((r) => [Number(r.difficulty), Number(r.n)]))
  check(
    'db_equation_balance_basic',
    (byDiff[1] || 0) === 5,
    `d1=${byDiff[1] || 0} d2=${byDiff[2] || 0} d3=${byDiff[3] || 0}`,
  )

  const tokenSmoke = mintJwt(env, smokeUser)
  const tokenDhm = dhm ? mintJwt(env, dhm) : null

  // specialty availability exact difficulty (no fallback)
  for (const [diff, expect] of [
    [1, byDiff[1] || 0],
    [2, byDiff[2] || 0],
    [3, byDiff[3] || 0],
  ]) {
    const r = await api(
      base,
      tokenSmoke,
      'GET',
      `/chemistry/train/availability?specialtyCode=equation&categoryCode=balance&difficulty=${diff}&poolMode=test`,
    )
    const d = dataOf(r)
    check(
      `specialty_avail_eq_balance_d${diff}`,
      r.status === 200 && Number(d.availableCount) === Number(expect),
      `status=${r.status} avail=${d?.availableCount} expect=${expect}`,
    )
  }

  // advanced availability for dhm
  if (tokenDhm) {
    const raise = await api(
      base,
      tokenDhm,
      'GET',
      `/chemistry/train/advanced/availability?specialtyCode=all&difficultyMode=raise&itemScope=all&poolMode=test`,
    )
    const chal = await api(
      base,
      tokenDhm,
      'GET',
      `/chemistry/train/advanced/availability?specialtyCode=all&difficultyMode=challenge&itemScope=all&poolMode=test`,
    )
    const mix = await api(
      base,
      tokenDhm,
      'GET',
      `/chemistry/train/advanced/availability?specialtyCode=all&difficultyMode=mix&itemScope=all&poolMode=test`,
    )
    const s60 = await api(
      base,
      tokenDhm,
      'GET',
      `/chemistry/train/advanced/availability?specialtyCode=all&difficultyMode=mix&itemScope=s60&poolMode=test`,
    )
    const rd = dataOf(raise)
    const cd = dataOf(chal)
    const md = dataOf(mix)
    const sd = dataOf(s60)
    check('dhm_adv_raise_gt0', raise.status === 200 && rd.raiseCount > 0, JSON.stringify(rd))
    check('dhm_adv_challenge_gt0', chal.status === 200 && cd.challengeCount > 0, JSON.stringify(cd))
    check(
      'dhm_adv_mix_sum',
      mix.status === 200 && md.mixCount === md.raiseCount + md.challengeCount,
      `mix=${md.mixCount} raise=${md.raiseCount} chal=${md.challengeCount}`,
    )
    check(
      'dhm_adv_s60_le_60',
      s60.status === 200 && sd.mixCount > 0 && sd.mixCount <= 60,
      `s60mix=${sd.mixCount}`,
    )
    check(
      'dhm_s60_counts',
      sd.raiseCount + sd.challengeCount === sd.mixCount &&
        sd.raiseCount <= 36 &&
        sd.challengeCount <= 24,
      `raise=${sd.raiseCount} chal=${sd.challengeCount}`,
    )
  }

  // create advanced sessions with smoke user
  const raiseSession = await api(base, tokenSmoke, 'POST', '/chemistry/train/advanced/sessions', {
    specialtyCode: 'all',
    difficultyMode: 'raise',
    itemScope: 'all',
    count: 5,
    mode: 'random',
    poolMode: 'test',
  })
  const rs = dataOf(raiseSession)
  check(
    'create_raise_session',
    raiseSession.status < 300 && rs.sessionKind === 'advanced' && rs.actualCount > 0,
    `status=${raiseSession.status} kind=${rs?.sessionKind} n=${rs?.actualCount} msg=${raiseSession.json?.message || ''}`,
  )
  if (rs?.items?.length) {
    const diffsOk = rs.items.every((it) => it.itemDifficulty === 2)
    const labelsOk = rs.items.every((it) => it.specialtyName && it.categoryName)
    check('raise_items_diff2_only', diffsOk, rs.items.map((i) => i.itemDifficulty).join(','))
    check(
      'raise_items_have_spec_labels',
      labelsOk,
      rs.items.map((i) => `${i.specialtyName}·${i.categoryName}`).slice(0, 3).join(' | '),
    )
  }

  const chalSession = await api(base, tokenSmoke, 'POST', '/chemistry/train/advanced/sessions', {
    specialtyCode: 'all',
    difficultyMode: 'challenge',
    itemScope: 's60',
    count: 5,
    mode: 'sequential',
    poolMode: 'test',
  })
  const cs = dataOf(chalSession)
  check(
    'create_challenge_s60_session',
    chalSession.status < 300 && cs.sessionKind === 'advanced',
    `status=${chalSession.status} n=${cs?.actualCount}`,
  )
  if (cs?.items?.length) {
    check(
      'challenge_items_diff3_only',
      cs.items.every((it) => it.itemDifficulty === 3),
      cs.items.map((i) => i.itemDifficulty).join(','),
    )
  }

  const mixSession = await api(base, tokenSmoke, 'POST', '/chemistry/train/advanced/sessions', {
    specialtyCode: 'all',
    difficultyMode: 'mix',
    itemScope: 'all',
    count: 10,
    mode: 'random',
    poolMode: 'test',
  })
  const ms = dataOf(mixSession)
  check(
    'create_mix_session',
    mixSession.status < 300 && ms.actualCount > 0,
    `n=${ms?.actualCount} pick=${JSON.stringify(ms?.pickMeta?.difficultyMix)}`,
  )
  if (ms?.items?.length) {
    check(
      'mix_no_basic',
      ms.items.every((it) => it.itemDifficulty === 2 || it.itemDifficulty === 3),
      ms.items.map((i) => i.itemDifficulty).join(','),
    )
    const specs = new Set(ms.items.map((i) => i.specialtyCode).filter(Boolean))
    check('mix_cross_specialty_soft', specs.size >= 1, `specialties=${[...specs].join(',')}`)
  }

  // cancel open advanced sessions to avoid junk
  for (const id of [rs?.id, cs?.id, ms?.id].filter(Boolean)) {
    await api(base, tokenSmoke, 'POST', `/chemistry/train/sessions/${id}/cancel`)
  }

  // daily status still works; advanced must not increment daily completed
  const [[dailyBefore]] = await conn.query(
    `SELECT COUNT(*) AS n FROM chem_train_sessions
     WHERE user_id=? AND session_kind='daily' AND status='completed'
       AND daily_date=DATE_FORMAT(CONVERT_TZ(UTC_TIMESTAMP(),'+00:00','+08:00'),'%Y-%m-%d')`,
    [smokeUser.id],
  )
  const dailyStatus = await api(base, tokenSmoke, 'GET', '/chemistry/train/daily/status')
  const ds = dataOf(dailyStatus)
  check(
    'daily_status_ok',
    dailyStatus.status === 200 && ds.candidateCount > 0,
    `cand=${ds?.candidateCount} completed=${ds?.todayCompletedCount}`,
  )
  check(
    'advanced_not_in_daily_count',
    Number(ds.todayCompletedCount) === Number(dailyBefore.n),
    `api=${ds.todayCompletedCount} dbDaily=${dailyBefore.n}`,
  )

  // history kind filters
  const histSpec = await api(
    base,
    tokenSmoke,
    'GET',
    '/chemistry/train/sessions?kindFilter=specialty&poolFilter=test&pageSize=5',
  )
  const histAdv = await api(
    base,
    tokenSmoke,
    'GET',
    '/chemistry/train/sessions?kindFilter=advanced&poolFilter=test&pageSize=5',
  )
  const hs = dataOf(histSpec)
  const ha = dataOf(histAdv)
  check(
    'history_specialty_excludes_advanced',
    histSpec.status === 200 &&
      (hs.items || []).every((x) => !x.sessionKind || x.sessionKind === 'specialty'),
    `n=${hs?.items?.length}`,
  )
  check(
    'history_advanced_only',
    histAdv.status === 200 &&
      (ha.items || []).every((x) => x.sessionKind === 'advanced'),
    `n=${ha?.items?.length}`,
  )

  // total items unchanged
  const [[tot]] = await conn.query(`SELECT COUNT(*) AS n FROM chem_train_items`)
  check('bank_total_638', Number(tot.n) === 638, `n=${tot.n}`)

  await conn.end()

  const outPath = path.join(__dirname, 'smoke_result.json')
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8')
  console.log('\nWrote', outPath, 'ok=', report.ok)
  process.exit(report.ok ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
