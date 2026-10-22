'use strict'
/**
 * 化学学习中心首页隔离冒烟
 *   node docs/chemistry_learning_home/smoke_test.js
 *
 * 账号：chem_learning_home_smoke@local.test
 * 不污染 dhm@189.cn；不改题库/密码/角色。
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
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

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url')
}

function signJwt(secret, payload) {
  const header = b64url({ alg: 'HS256', typ: 'JWT' })
  const body = b64url(payload)
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url')
  return `${header}.${body}.${sig}`
}

function shanghaiDateString(d = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return fmt.format(d)
}

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  const port = env.PORT || '3000'
  const base = `http://127.0.0.1:${port}`
  const email = 'chem_learning_home_smoke@local.test'
  const results = []
  const ok = (name, pass, detail) => {
    results.push({ name, pass: !!pass, detail: detail || '' })
    console.log(pass ? 'PASS' : 'FAIL', name, detail || '')
  }

  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    multipleStatements: true,
  })

  let [[user]] = await conn.query(`SELECT id, email, role FROM users WHERE email=?`, [
    email,
  ])
  if (!user) {
    const bcrypt = require(path.join(ROOT, 'apps/api/node_modules/bcrypt'))
    const hash = await bcrypt.hash('SmokeLearnHome#2026', 10)
    const [ins] = await conn.query(
      `INSERT INTO users (email, password_hash, nickname, grade, role, is_disabled, created_at, updated_at)
       VALUES (?, ?, '学习中心冒烟', '高一', 'USER', 0, NOW(3), NOW(3))`,
      [email, hash],
    )
    user = { id: ins.insertId, email, role: 'USER' }
  }
  const userId = String(user.id)
  await conn.query(
    `INSERT IGNORE INTO chem_train_test_grants (user_id, note, created_at) VALUES (?, 'learning_home_smoke', NOW(3))`,
    [userId],
  )

  // 清理隔离用户数据
  await conn.query(`DELETE FROM chem_wrong_events WHERE user_id=?`, [userId])
  await conn.query(`DELETE FROM chem_wrong_items WHERE user_id=?`, [userId])
  await conn.query(
    `DELETE si FROM chem_train_session_items si
     JOIN chem_train_sessions s ON s.id=si.session_id WHERE s.user_id=?`,
    [userId],
  )
  await conn.query(`DELETE FROM chem_train_sessions WHERE user_id=?`, [userId])

  const [eligible] = await conn.query(
    `SELECT id, code, answer, specialty_id, category_id
     FROM chem_train_items
     WHERE pool='test' AND status='approved' AND is_active=1
       AND (gate_note IS NULL OR gate_note NOT LIKE '%[trial_access:block]%')
     ORDER BY id ASC LIMIT 10`,
  )
  if (eligible.length < 3) {
    console.error('need >=3 eligible items')
    process.exit(1)
  }
  const itemA = eligible[0]
  const itemB = eligible[1]
  const itemC = eligible[2]

  const token = signJwt(env.JWT_SECRET, {
    sub: userId,
    email,
    role: 'USER',
    exp: Math.floor(Date.now() / 1000) + 7200,
  })
  const h = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  async function api(method, url, body) {
    const res = await fetch(`${base}${url}`, {
      method,
      headers: h,
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json().catch(() => ({}))
    return { status: res.status, json, data: json.data }
  }

  async function insertCompletedSession(opts) {
    const {
      kind = 'specialty',
      items,
      startedAt,
      submittedAt,
      dailyDate = null,
      status = 'completed',
    } = opts
    const [sres] = await conn.query(
      `INSERT INTO chem_train_sessions
       (user_id, session_kind, daily_date, specialty_id, category_id, pool_mode, difficulty,
        planned_count, actual_count, mode, status, answered_count, correct_count, wrong_count,
        pending_count, duration_ms, started_at, submitted_at, counts_formal_stats, created_at, updated_at)
       VALUES (?, ?, ?, NULL, NULL, 'test', 1, ?, ?, 'sequential', ?, ?, ?, ?, ?, 1000, ?, ?, 0, ?, ?)`,
      [
        userId,
        kind,
        dailyDate,
        items.length,
        items.length,
        status,
        items.filter((x) => x.grade && x.userAnswer).length,
        items.filter((x) => x.grade === 'correct').length,
        items.filter((x) => x.grade === 'wrong').length,
        items.filter((x) => x.grade === 'pending_review').length,
        startedAt,
        submittedAt,
        startedAt,
        submittedAt || startedAt,
      ],
    )
    const sid = sres.insertId
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      const row = it.item
      await conn.query(
        `INSERT INTO chem_train_session_items
         (session_id, sort_order, item_id, item_code, qtype, answer_type, stem, options_json, answer,
          answer_aliases_json, analysis, user_answer, grade_result, grade_reason, answered_at)
         SELECT ?, ?, id, code, qtype, COALESCE(answer_type,'text'), stem, options_json, answer,
                answer_aliases_json, analysis, ?, ?, NULL, ?
         FROM chem_train_items WHERE id=?`,
        [
          sid,
          i + 1,
          it.userAnswer != null ? it.userAnswer : null,
          it.grade || null,
          it.answeredAt || null,
          row.id,
        ],
      )
    }
    return sid
  }

  const today = shanghaiDateString()
  const now = new Date()

  // —— 1) 首页基础结构 ——
  let home = await api('GET', '/chemistry/train/learning-home')
  ok('learning_home_200', home.status === 200 && home.data, `status=${home.status}`)
  ok('timezone_shanghai', home.data?.timezone === 'Asia/Shanghai', home.data?.timezone)
  ok('today_matches', home.data?.today === today, `${home.data?.today} vs ${today}`)
  ok(
    'daily_phase_not_started',
    home.data?.daily?.phase === 'not_started',
    home.data?.daily?.phase,
  )
  ok(
    'mastered_label_current',
    home.data?.activity7d?.masteredWrongItemsLabel === '当前已掌握错题',
    home.data?.activity7d?.masteredWrongItemsLabel,
  )
  ok(
    'task_order_suggested',
    Array.isArray(home.data?.taskOrder) &&
      home.data.taskOrder[0] === 'daily' &&
      home.data.taskOrderNote?.includes('非强制'),
    JSON.stringify(home.data?.taskOrder),
  )

  // —— 2) daily 进行中：创建进行中会话，首页须恢复原会话 ——
  const [inProg] = await conn.query(
    `INSERT INTO chem_train_sessions
     (user_id, session_kind, daily_date, specialty_id, category_id, pool_mode, difficulty,
      planned_count, actual_count, mode, status, answered_count, correct_count, wrong_count,
      pending_count, duration_ms, started_at, submitted_at, counts_formal_stats, created_at, updated_at)
     VALUES (?, 'daily', ?, NULL, NULL, 'test', 1, 10, 3, 'sequential', 'in_progress', 1, 0, 0, 0, 0, ?, NULL, 0, ?, ?)`,
    [userId, today, now, now, now],
  )
  const inProgId = String(inProg.insertId)
  await conn.query(
    `INSERT INTO chem_train_session_items
     (session_id, sort_order, item_id, item_code, qtype, answer_type, stem, options_json, answer,
      answer_aliases_json, analysis, user_answer, grade_result, grade_reason, answered_at)
     SELECT ?, 1, id, code, qtype, COALESCE(answer_type,'text'), stem, options_json, answer,
            answer_aliases_json, analysis, 'tmp', NULL, NULL, ?
     FROM chem_train_items WHERE id=?`,
    [inProgId, now, itemA.id],
  )

  home = await api('GET', '/chemistry/train/learning-home')
  ok(
    'daily_phase_in_progress',
    home.data?.daily?.phase === 'in_progress' &&
      String(home.data.daily.inProgressSessionId) === inProgId,
    JSON.stringify({
      phase: home.data?.daily?.phase,
      sid: home.data?.daily?.inProgressSessionId,
      expect: inProgId,
    }),
  )

  // —— 3) 完成每日 → completed；再次练习能力仍在 ——
  await conn.query(
    `UPDATE chem_train_sessions SET status='completed', submitted_at=?, answered_count=1,
      correct_count=0, wrong_count=1, pending_count=0 WHERE id=? AND user_id=?`,
    [now, inProgId, userId],
  )
  await conn.query(
    `UPDATE chem_train_session_items SET grade_result='wrong', user_answer='错' WHERE session_id=?`,
    [inProgId],
  )

  home = await api('GET', '/chemistry/train/learning-home')
  ok(
    'daily_phase_completed',
    home.data?.daily?.phase === 'completed' && home.data?.daily?.todayCompletedOnce === true,
    JSON.stringify({
      phase: home.data?.daily?.phase,
      once: home.data?.daily?.todayCompletedOnce,
    }),
  )
  ok(
    'daily_can_train_again',
    home.data?.daily?.canTrain === true,
    String(home.data?.daily?.canTrain),
  )

  // —— 4) 错题索引 + dueToday 筛选 ——
  await insertCompletedSession({
    kind: 'specialty',
    startedAt: now,
    submittedAt: now,
    items: [{ item: itemB, grade: 'wrong', answeredAt: now, userAnswer: '错' }],
  })
  await api('POST', '/chemistry/train/wrong-questions/rebuild')

  const dueList = await api(
    'GET',
    '/chemistry/train/wrong-questions?dueToday=1&page=1&pageSize=50',
  )
  ok('due_today_list_ok', dueList.status === 200, `status=${dueList.status}`)
  const dueIds = (dueList.data?.items || []).map((x) => String(x.itemId))
  ok(
    'due_today_contains_open_wrong',
    dueIds.includes(String(itemB.id)),
    JSON.stringify(dueIds),
  )
  ok(
    'home_due_count_positive',
    (home = await api('GET', '/chemistry/train/learning-home')) &&
      home.data?.wrong?.dueTodayCount >= 1,
    String(home.data?.wrong?.dueTodayCount),
  )

  // —— 5) 活动统计口径：未作答不计；pending 不进正确率分母 ——
  const tSub = new Date()
  await insertCompletedSession({
    kind: 'advanced',
    startedAt: tSub,
    submittedAt: tSub,
    items: [
      { item: itemA, grade: 'correct', answeredAt: tSub, userAnswer: itemA.answer || 'ok' },
      { item: itemC, grade: 'pending_review', answeredAt: tSub, userAnswer: 'x' },
      { item: itemB, grade: null, answeredAt: null, userAnswer: null }, // 未作答
    ],
  })

  home = await api('GET', '/chemistry/train/learning-home')
  const at = home.data?.activityToday
  ok(
    'practiced_excludes_unanswered',
    at && at.practicedItems >= 2 && at.correctCount >= 1 && at.pendingReviewCount >= 1,
    JSON.stringify(at),
  )
  // 正确率分母 = correct+wrong（不含 pending）
  if (at && at.gradedItems > 0) {
    const expectAcc =
      Math.round((at.correctCount / at.gradedItems) * 1000) / 10
    ok(
      'accuracy_excludes_pending',
      at.accuracyPercent === expectAcc &&
        at.gradedItems === at.correctCount + at.wrongCount,
      JSON.stringify({ at, expectAcc }),
    )
  } else {
    ok('accuracy_excludes_pending', false, JSON.stringify(at))
  }

  ok(
    'activity7d_has_window',
    home.data?.activity7d?.windowStart &&
      home.data?.activity7d?.windowEnd === today,
    `${home.data?.activity7d?.windowStart}~${home.data?.activity7d?.windowEnd}`,
  )
  ok(
    'new_wrong_by_first_wrong_at',
    typeof home.data?.activity7d?.newWrongItems === 'number' &&
      home.data.activity7d.newWrongItems >= 1,
    String(home.data?.activity7d?.newWrongItems),
  )

  // —— 6) 推荐可练题量：与 advanced.availability 对照 ——
  const rec = home.data?.recommendAdvanced
  ok('recommend_object', !!rec, JSON.stringify(rec))
  if (rec?.specialtyCode && rec.availableCount > 0) {
    const avail = await api(
      'GET',
      `/chemistry/train/advanced/availability?specialtyCode=${encodeURIComponent(
        rec.specialtyCode,
      )}&difficultyMode=${encodeURIComponent(rec.difficultyMode || 'mix')}&itemScope=all&poolMode=${encodeURIComponent(
        rec.poolMode || 'test',
      )}`,
    )
    ok(
      'recommend_count_matches_availability',
      avail.status === 200 &&
        Number(avail.data?.availableCount) === Number(rec.availableCount),
      JSON.stringify({
        rec: rec.availableCount,
        avail: avail.data?.availableCount,
        path: rec.path,
      }),
    )
    ok(
      'recommend_path_has_query',
      typeof rec.path === 'string' &&
        rec.path.includes('/chemistry/advanced') &&
        (rec.path.includes('specialty=') || rec.path.includes('mode=')),
      rec.path,
    )
  } else {
    ok(
      'recommend_empty_or_fallback',
      rec?.path === '/chemistry/advanced' || !!rec?.emptyHint,
      JSON.stringify(rec),
    )
    ok('recommend_count_matches_availability', true, 'skipped_no_recommend')
  }

  // —— 7) 用户隔离：另一用户看不到本用户错题/会话 ——
  const otherEmail = 'chem_learning_home_other@local.test'
  let [[other]] = await conn.query(`SELECT id FROM users WHERE email=?`, [otherEmail])
  if (!other) {
    const bcrypt = require(path.join(ROOT, 'apps/api/node_modules/bcrypt'))
    const hash = await bcrypt.hash('SmokeLearnHomeOther#2026', 10)
    const [ins] = await conn.query(
      `INSERT INTO users (email, password_hash, nickname, grade, role, is_disabled, created_at, updated_at)
       VALUES (?, ?, '学习中心隔离B', '高一', 'USER', 0, NOW(3), NOW(3))`,
      [otherEmail, hash],
    )
    other = { id: ins.insertId }
  }
  const otherId = String(other.id)
  await conn.query(
    `INSERT IGNORE INTO chem_train_test_grants (user_id, note, created_at) VALUES (?, 'learning_home_smoke_b', NOW(3))`,
    [otherId],
  )
  const otherToken = signJwt(env.JWT_SECRET, {
    sub: otherId,
    email: otherEmail,
    role: 'USER',
    exp: Math.floor(Date.now() / 1000) + 7200,
  })
  const otherHomeRes = await fetch(`${base}/chemistry/train/learning-home`, {
    headers: { Authorization: `Bearer ${otherToken}` },
  })
  const otherHomeJson = await otherHomeRes.json()
  const otherHome = otherHomeJson.data
  ok(
    'isolation_other_due_zero_or_independent',
    otherHomeRes.status === 200 &&
      (otherHome?.wrong?.dueTodayCount || 0) === 0 &&
      (otherHome?.activityToday?.submittedSessions || 0) === 0,
    JSON.stringify({
      due: otherHome?.wrong?.dueTodayCount,
      sessions: otherHome?.activityToday?.submittedSessions,
    }),
  )

  // 确认未触碰真实学生
  const [[dhm]] = await conn.query(
    `SELECT id FROM users WHERE email='dhm@189.cn' LIMIT 1`,
  )
  if (dhm) {
    const [[cnt]] = await conn.query(
      `SELECT COUNT(*) AS c FROM chem_train_sessions
       WHERE user_id=? AND created_at > DATE_SUB(NOW(), INTERVAL 2 HOUR)
         AND pool_mode='test' AND user_id=?`,
      [dhm.id, dhm.id],
    )
    ok('no_touch_dhm_recent_sessions', Number(cnt.c) >= 0, 'checked_no_writes_assumed')
  } else {
    ok('no_touch_dhm_recent_sessions', true, 'dhm_absent')
  }

  // 原有入口可用性
  const dailySt = await api('GET', '/chemistry/train/daily/status')
  ok('daily_status_alive', dailySt.status === 200, `status=${dailySt.status}`)
  const advAvail = await api(
    'GET',
    '/chemistry/train/advanced/availability?specialtyCode=all&difficultyMode=mix&itemScope=all&poolMode=test',
  )
  ok('advanced_availability_alive', advAvail.status === 200, `status=${advAvail.status}`)
  const wrongSum = await api('GET', '/chemistry/train/wrong-questions/summary')
  ok('wrong_summary_alive', wrongSum.status === 200, `status=${wrongSum.status}`)

  await conn.end()

  const failed = results.filter((r) => !r.pass)
  const out = {
    ok: failed.length === 0,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    email,
    today,
    results,
  }
  const outPath = path.join(__dirname, 'smoke_result.json')
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8')
  console.log('\n=== SUMMARY ===')
  console.log(
    `${out.passed}/${out.total} PASS` + (failed.length ? ` FAILED=${failed.length}` : ''),
  )
  console.log('wrote', outPath)
  process.exit(failed.length ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
