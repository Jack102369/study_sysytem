'use strict'
/**
 * API 冒烟：隔离测试用户做提高/挑战/判题/解析；每日不含 s60；
 * dhm 仅查 availability（不创建会话）；无 grant 用户被拒绝。
 *   node docs/chemistry_advanced_first_import/smoke_api.js
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
  const hash = await bcrypt.hash('SmokeS60!2026', 10)
  const [r] = await conn.query(
    `INSERT INTO users (email, password_hash, nickname, grade, role, is_disabled)
     VALUES (?,?,?,?,?,0)`,
    [email, hash, email.split('@')[0].slice(0, 32), '高一', role],
  )
  return {
    id: r.insertId,
    email,
    role,
    is_disabled: 0,
  }
}

async function setGrant(conn, userId, enable, adminId) {
  if (enable) {
    await conn.query(
      `INSERT INTO chem_train_test_grants (user_id, note, granted_by)
       VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE note=VALUES(note)`,
      [userId, '[s60_smoke] isolated import smoke grant', adminId],
    )
  } else {
    await conn.query(`DELETE FROM chem_train_test_grants WHERE user_id=?`, [
      userId,
    ])
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

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const base = `http://127.0.0.1:${env.PORT || 3000}`
  const report = {
    generatedAt: new Date().toISOString(),
    ok: true,
    checks: [],
  }
  const check = (name, pass, detail) => {
    report.checks.push({ name, pass, detail })
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
  const smokeUser = await ensureUser(conn, 'chem_s60_smoke@local.test')
  const noGrantUser = await ensureUser(conn, 'chem_s60_nogrant@local.test')
  await setGrant(conn, smokeUser.id, true, admin ? admin.id : null)
  await setGrant(conn, noGrantUser.id, false, null)

  // pick one raise and one challenge s60 item for category targeting
  const [raiseRows] = await conn.query(
    `SELECT i.id, i.code, i.difficulty, s.code AS specialty_code, c.code AS category_code
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id
     WHERE i.code LIKE 'train.ai_trial.s60.%' AND i.difficulty=2 AND i.is_active=1
     LIMIT 1`,
  )
  const [chalRows] = await conn.query(
    `SELECT i.id, i.code, i.difficulty, s.code AS specialty_code, c.code AS category_code
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id
     WHERE i.code LIKE 'train.ai_trial.s60.%' AND i.difficulty=3 AND i.is_active=1
     LIMIT 1`,
  )
  check('s60_raise_exists', raiseRows.length > 0, raiseRows[0]?.code)
  check('s60_challenge_exists', chalRows.length > 0, chalRows[0]?.code)

  const smokeTok = mintJwt(env, smokeUser)
  const noGrantTok = mintJwt(env, noGrantUser)

  // ping API
  try {
    const ping = await fetch(`${base}/chemistry/train/test-access`, {
      headers: { Authorization: `Bearer ${smokeTok}` },
    })
    check('api_up', ping.ok || ping.status === 200 || ping.status === 201, 'status=' + ping.status)
  } catch (e) {
    check('api_up', false, String(e.message || e))
    fs.writeFileSync(
      path.join(__dirname, 'smoke_result.json'),
      JSON.stringify(report, null, 2),
    )
    await conn.end()
    process.exit(1)
  }

  // no grant rejected
  if (raiseRows[0]) {
    const r = await api(base, noGrantTok, 'POST', '/chemistry/train/sessions', {
      specialtyCode: raiseRows[0].specialty_code,
      categoryCode: raiseRows[0].category_code,
      difficulty: 2,
      count: 5,
      mode: 'random',
      poolMode: 'test',
    })
    check(
      'nogrant_forbidden',
      r.status === 403 || r.status === 401,
      `status=${r.status}`,
    )
  }

  // dhm availability only
  const [[dhm]] = await conn.query(
    `SELECT id, email, role FROM users WHERE email='dhm@189.cn' LIMIT 1`,
  )
  if (dhm && raiseRows[0] && chalRows[0]) {
    const dhmTok = mintJwt(env, dhm)
    const av2 = await api(
      base,
      dhmTok,
      'GET',
      `/chemistry/train/availability?specialtyCode=${raiseRows[0].specialty_code}&categoryCode=${raiseRows[0].category_code}&difficulty=2&poolMode=test`,
    )
    const av3 = await api(
      base,
      dhmTok,
      'GET',
      `/chemistry/train/availability?specialtyCode=${chalRows[0].specialty_code}&categoryCode=${chalRows[0].category_code}&difficulty=3&poolMode=test`,
    )
    const n2 = av2.json?.data?.availableCount ?? av2.json?.availableCount
    const n3 = av3.json?.data?.availableCount ?? av3.json?.availableCount
    check('dhm_raise_availability', Number(n2) > 0, `count=${n2}`)
    check('dhm_challenge_availability', Number(n3) > 0, `count=${n3}`)
  } else {
    check('dhm_user_found', !!dhm, 'dhm@189.cn')
  }

  async function sessionItemRows(sessionId) {
    const [rows] = await conn.query(
      `SELECT si.sort_order, si.item_id, si.item_code, si.user_answer, si.grade_result,
              si.analysis AS snap_analysis, i.answer, i.analysis AS item_analysis, i.code
       FROM chem_train_session_items si
       JOIN chem_train_items i ON i.id = si.item_id
       WHERE si.session_id=?
       ORDER BY si.sort_order`,
      [sessionId],
    )
    return rows
  }

  // smoke user: create raise session (count=20 提高抽中 s60 概率), answer, submit
  let sessionId = null
  if (raiseRows[0]) {
    const created = await api(base, smokeTok, 'POST', '/chemistry/train/sessions', {
      specialtyCode: raiseRows[0].specialty_code,
      categoryCode: raiseRows[0].category_code,
      difficulty: 2,
      count: 20,
      mode: 'random',
      poolMode: 'test',
    })
    const data = created.json?.data || created.json
    sessionId = data?.id
    check('smoke_raise_session', created.status < 300 && !!sessionId, `id=${sessionId}`)
    let rows = sessionId ? await sessionItemRows(sessionId) : []
    let s60Rows = rows.filter((r) => String(r.code || r.item_code || '').includes('train.ai_trial.s60.'))
    // 若同分类旧提高题过多，改抽「挑战」会话验证 s60（库内挑战此前为0，必为新题）
    if (!s60Rows.length && chalRows[0]) {
      const created2 = await api(base, smokeTok, 'POST', '/chemistry/train/sessions', {
        specialtyCode: chalRows[0].specialty_code,
        categoryCode: chalRows[0].category_code,
        difficulty: 3,
        count: 5,
        mode: 'random',
        poolMode: 'test',
      })
      const data2 = created2.json?.data || created2.json
      sessionId = data2?.id
      rows = sessionId ? await sessionItemRows(sessionId) : []
      s60Rows = rows.filter((r) => String(r.code || r.item_code || '').includes('train.ai_trial.s60.'))
      check('smoke_fallback_challenge_for_s60', s60Rows.length > 0, `id=${sessionId}`)
    }
    check(
      'smoke_session_contains_s60',
      s60Rows.length > 0,
      `s60=${s60Rows.length}/${rows.length}`,
    )

    if (sessionId && rows.length && s60Rows.length) {
      for (const r of rows) {
        await api(
          base,
          smokeTok,
          'PATCH',
          `/chemistry/train/sessions/${sessionId}/answers`,
          {
            sortOrder: r.sort_order,
            answer: String(r.code).includes('train.ai_trial.s60.')
              ? r.answer
              : 'Z',
          },
        )
      }
      const submitted = await api(
        base,
        smokeTok,
        'POST',
        `/chemistry/train/sessions/${sessionId}/submit`,
        {},
      )
      const after = await sessionItemRows(sessionId)
      const s60After = after.find((r) =>
        String(r.code || r.item_code || '').includes('train.ai_trial.s60.'),
      )
      const analysis = String(s60After?.snap_analysis || s60After?.item_analysis || '')
      check('smoke_submit_ok', submitted.status < 300, `status=${submitted.status}`)
      check(
        'smoke_analysis_seven_parts',
        /【考查知识点】/.test(analysis) &&
          /【突破口】/.test(analysis) &&
          /【分步推理】/.test(analysis) &&
          /【核心方法】/.test(analysis),
        (s60After?.code || '') + ' ' + analysis.slice(0, 60),
      )
      check(
        'smoke_grade_present',
        !!s60After?.grade_result,
        `grade=${s60After?.grade_result}`,
      )
      check(
        'smoke_s60_correct_when_answered',
        s60After?.grade_result === 'correct',
        `grade=${s60After?.grade_result}`,
      )
    }
  }

  // challenge session（导入前全库挑战为0，抽到的必含 s60）
  if (chalRows[0]) {
    const created = await api(base, smokeTok, 'POST', '/chemistry/train/sessions', {
      specialtyCode: chalRows[0].specialty_code,
      categoryCode: chalRows[0].category_code,
      difficulty: 3,
      count: 5,
      mode: 'random',
      poolMode: 'test',
    })
    const data = created.json?.data || created.json
    const rows = data?.id ? await sessionItemRows(data.id) : []
    const s60n = rows.filter((r) =>
      String(r.code || r.item_code || '').includes('train.ai_trial.s60.'),
    ).length
    check(
      'smoke_challenge_session',
      created.status < 300 && rows.length > 0 && s60n === rows.length,
      `id=${data?.id} s60=${s60n}/${rows.length}`,
    )
    report.challengeSessionId = data?.id
  }

  // daily isolation: create daily as smoke user
  const dailyCreate = await api(
    base,
    smokeTok,
    'POST',
    '/chemistry/train/daily/sessions',
    {},
  )
  const daily = dailyCreate.json?.data || dailyCreate.json
  const dailyItems = daily?.items || []
  const dailyHasS60 = dailyItems.some((it) =>
    String(it.itemCode || it.code || '').includes('train.ai_trial.s60.'),
  )
  const dailyHasExclude = dailyItems.some((it) =>
    /\[daily:exclude\]/.test(String(it.gateNote || '')),
  )
  // also verify via DB join on session items
  let dailyDbHasS60 = false
  if (daily?.id) {
    const [rows] = await conn.query(
      `SELECT si.item_code, i.gate_note
       FROM chem_train_session_items si
       JOIN chem_train_items i ON i.id=si.item_id
       WHERE si.session_id=?`,
      [daily.id],
    )
    dailyDbHasS60 = rows.some(
      (r) =>
        String(r.item_code || '').includes('train.ai_trial.s60.') ||
        /\[daily:exclude\]/.test(String(r.gate_note || '')),
    )
    report.dailySessionId = daily.id
    report.dailyItemCodes = rows.map((r) => r.item_code)
  }
  check(
    'daily_no_s60_or_exclude',
    dailyCreate.status < 300 && !dailyHasS60 && !dailyDbHasS60 && !dailyHasExclude,
    `status=${dailyCreate.status} items=${dailyItems.length}`,
  )

  // formal pool still 0
  const [[{ formalN }]] = await conn.query(
    `SELECT COUNT(1) AS formalN FROM chem_train_items
     WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  check('formal_pool_still_zero', Number(formalN) === 0, `formal=${formalN}`)

  // daily eligible counts
  const [[{ dailyEligible }]] = await conn.query(
    `SELECT COUNT(1) AS dailyEligible FROM chem_train_items
     WHERE pool='test' AND status='approved' AND is_active=1
       AND difficulty IN (1,2)
       AND gate_note NOT LIKE '%[trial_access:block]%'
       AND gate_note NOT LIKE '%[daily:exclude]%'`,
  )
  report.dailyEligibleTest = Number(dailyEligible)

  report.raiseSessionId = sessionId
  report.smokeUserEmail = 'chem_s60_smoke@local.test'
  report.noGrantUserEmail = 'chem_s60_nogrant@local.test'

  fs.writeFileSync(
    path.join(__dirname, 'smoke_result.json'),
    JSON.stringify(report, null, 2),
    'utf8',
  )
  await conn.end()
  process.exit(report.ok ? 0 : 2)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
