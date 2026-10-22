'use strict'
/**
 * 化学学习分析隔离冒烟
 *   node docs/chemistry_analytics/smoke_test.js
 *
 * 账号：chem_analytics_smoke@local.test
 * 不污染 dhm@189.cn
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
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  const port = env.PORT || '3000'
  const base = `http://127.0.0.1:${port}`
  const email = 'chem_analytics_smoke@local.test'
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
    const hash = await bcrypt.hash('SmokeAnalytics#2026', 10)
    const [ins] = await conn.query(
      `INSERT INTO users (email, password_hash, nickname, grade, role, is_disabled, created_at, updated_at)
       VALUES (?, ?, '学习分析冒烟', '高一', 'USER', 0, NOW(3), NOW(3))`,
      [email, hash],
    )
    user = { id: ins.insertId, email, role: 'USER' }
  }
  const userId = String(user.id)
  await conn.query(
    `INSERT IGNORE INTO chem_train_test_grants (user_id, note, created_at) VALUES (?, 'analytics_smoke', NOW(3))`,
    [userId],
  )

  await conn.query(`DELETE FROM chem_wrong_events WHERE user_id=?`, [userId])
  await conn.query(`DELETE FROM chem_wrong_items WHERE user_id=?`, [userId])
  await conn.query(
    `DELETE si FROM chem_train_session_items si
     JOIN chem_train_sessions s ON s.id=si.session_id WHERE s.user_id=?`,
    [userId],
  )
  await conn.query(`DELETE FROM chem_train_sessions WHERE user_id=?`, [userId])

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

  // —— 1) 空数据 ——
  let empty = await api('GET', '/chemistry/train/analytics?days=30')
  ok('empty_200', empty.status === 200 && empty.data, `status=${empty.status}`)
  ok(
    'empty_overview_zero',
    empty.data?.overview?.submittedSessions === 0 &&
      empty.data?.overview?.practicedItems === 0 &&
      empty.data?.overview?.accuracyPercent == null,
    JSON.stringify(empty.data?.overview),
  )
  ok(
    'calendar_30_days',
    Array.isArray(empty.data?.calendar) && empty.data.calendar.length === 30,
    String(empty.data?.calendar?.length),
  )
  ok(
    'attribution_disclosed',
    empty.data?.attribution?.specialty === 'current_item' &&
      String(empty.data?.attribution?.note || '').includes('当前归属'),
    empty.data?.attribution?.note,
  )
  ok(
    'empty_specialty_not_fake_zero',
    (empty.data?.specialties?.items || []).every(
      (x) => x.empty === true && x.accuracyPercent == null,
    ),
    'ok',
  )

  const [eligible] = await conn.query(
    `SELECT id, code, answer, specialty_id, difficulty
     FROM chem_train_items
     WHERE pool='test' AND status='approved' AND is_active=1
       AND (gate_note IS NULL OR gate_note NOT LIKE '%[trial_access:block]%')
       AND difficulty IN (1,2,3)
     ORDER BY difficulty ASC, id ASC LIMIT 20`,
  )
  if (eligible.length < 3) {
    console.error('need >=3 eligible items')
    process.exit(1)
  }
  const byDiff = {
    1: eligible.find((x) => Number(x.difficulty) === 1) || eligible[0],
    2: eligible.find((x) => Number(x.difficulty) === 2) || eligible[1],
    3: eligible.find((x) => Number(x.difficulty) === 3) || eligible[2],
  }
  const itemA = byDiff[1]
  const itemB = byDiff[2]
  const itemC = byDiff[3]

  async function insertSession(opts) {
    const {
      kind = 'specialty',
      items,
      startedAt,
      submittedAt,
      status = 'completed',
    } = opts
    const [sres] = await conn.query(
      `INSERT INTO chem_train_sessions
       (user_id, session_kind, daily_date, specialty_id, category_id, pool_mode, difficulty,
        planned_count, actual_count, mode, status, answered_count, correct_count, wrong_count,
        pending_count, duration_ms, started_at, submitted_at, counts_formal_stats, created_at, updated_at)
       VALUES (?, ?, NULL, NULL, NULL, 'test', 0, ?, ?, 'sequential', ?, ?, ?, ?, ?, 1000, ?, ?, 0, ?, ?)`,
      [
        userId,
        kind,
        items.length,
        items.length,
        status,
        items.filter((x) => x.userAnswer).length,
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
          it.item.id,
        ],
      )
    }
    return sid
  }

  const today = shanghaiDateString()
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000)

  // 进行中会话：不应计入
  await insertSession({
    kind: 'daily',
    status: 'in_progress',
    startedAt: now,
    submittedAt: null,
    items: [{ item: itemA, grade: 'correct', userAnswer: 'x', answeredAt: now }],
  })

  // 已提交：correct + wrong + pending + unanswered；同题两次
  await insertSession({
    kind: 'specialty',
    startedAt: now,
    submittedAt: now,
    items: [
      { item: itemA, grade: 'correct', userAnswer: itemA.answer || 'ok', answeredAt: now },
      { item: itemB, grade: 'wrong', userAnswer: '错', answeredAt: now },
      { item: itemC, grade: 'pending_review', userAnswer: '?', answeredAt: now },
      { item: itemA, grade: null, userAnswer: null, answeredAt: null },
    ],
  })
  await insertSession({
    kind: 'advanced',
    startedAt: yesterday,
    submittedAt: yesterday,
    items: [
      { item: itemA, grade: 'wrong', userAnswer: '错2', answeredAt: yesterday },
      { item: itemB, grade: 'correct', userAnswer: itemB.answer || 'ok', answeredAt: yesterday },
    ],
  })

  await api('POST', '/chemistry/train/wrong-questions/rebuild')

  const a30 = await api('GET', '/chemistry/train/analytics?days=30')
  const a7 = await api('GET', '/chemistry/train/analytics?days=7')
  ok('days30_ok', a30.status === 200, `status=${a30.status}`)
  ok('days7_ok', a7.status === 200, `status=${a7.status}`)
  ok(
    'trend_len',
    a30.data?.trend?.length === 30 && a7.data?.trend?.length === 7,
    `${a30.data?.trend?.length}/${a7.data?.trend?.length}`,
  )

  // 未提交不计 → 仅 2 个 completed
  ok(
    'in_progress_excluded',
    a30.data?.overview?.submittedSessions === 2,
    String(a30.data?.overview?.submittedSessions),
  )

  // 练习题次：session1 有3个有答有判（correct/wrong/pending）+ session2 有2 = 5；未作答不计
  ok(
    'practiced_excludes_unanswered',
    a30.data?.overview?.practicedItems === 5,
    String(a30.data?.overview?.practicedItems),
  )

  // 正确率：correct=2, wrong=2, pending 不进分母 → 50%
  ok(
    'accuracy_excludes_pending',
    a30.data?.overview?.correctCount === 2 &&
      a30.data?.overview?.wrongCount === 2 &&
      a30.data?.overview?.pendingReviewCount === 1 &&
      a30.data?.overview?.accuracyPercent === 50,
    JSON.stringify(a30.data?.overview),
  )

  // 同题多次：itemA 出现 correct + wrong = 按题次
  const todayBucket = (a30.data?.calendar || []).find((d) => d.date === today)
  ok(
    'calendar_today_has_activity',
    todayBucket && todayBucket.submittedSessions >= 1 && todayBucket.practicedItems >= 1,
    JSON.stringify(todayBucket),
  )

  // 日历合计练习 ≈ overview（日历30天含全部测试数据）
  const calPrac = (a30.data?.calendar || []).reduce((s, d) => s + d.practicedItems, 0)
  ok(
    'calendar_sum_matches_overview',
    calPrac === a30.data?.overview?.practicedItems,
    `${calPrac} vs ${a30.data?.overview?.practicedItems}`,
  )

  // 某天若只有 pending → 正确率 null：插一天仅 pending
  const dayOnlyPending = new Date('2026-10-01T12:00:00+08:00')
  await insertSession({
    kind: 'specialty',
    startedAt: dayOnlyPending,
    submittedAt: dayOnlyPending,
    items: [
      {
        item: itemC,
        grade: 'pending_review',
        userAnswer: 'p',
        answeredAt: dayOnlyPending,
      },
    ],
  })
  const a30b = await api('GET', '/chemistry/train/analytics?days=30')
  const pendDay = (a30b.data?.calendar || []).find((d) => d.date === '2026-10-01')
  ok(
    'accuracy_null_when_no_graded',
    pendDay &&
      pendDay.pendingReviewCount >= 1 &&
      pendDay.correctCount === 0 &&
      pendDay.wrongCount === 0 &&
      pendDay.accuracyPercent == null,
    JSON.stringify(pendDay),
  )

  // 难度：按当前 item.difficulty
  const diffs = a30b.data?.difficulties?.items || []
  const basic = diffs.find((d) => d.key === 'basic')
  const raise = diffs.find((d) => d.key === 'raise')
  const challenge = diffs.find((d) => d.key === 'challenge')
  ok(
    'difficulty_buckets_exist',
    !!basic && !!raise && !!challenge,
    diffs.map((d) => d.key).join(','),
  )
  ok(
    'difficulty_has_counts',
    (basic?.practicedItems || 0) +
      (raise?.practicedItems || 0) +
      (challenge?.practicedItems || 0) >
      0,
    JSON.stringify(diffs.map((d) => ({ k: d.key, p: d.practicedItems }))),
  )

  // 未知难度：item_id NULL
  const [sUnk] = await conn.query(
    `INSERT INTO chem_train_sessions
     (user_id, session_kind, daily_date, specialty_id, category_id, pool_mode, difficulty,
      planned_count, actual_count, mode, status, answered_count, correct_count, wrong_count,
      pending_count, duration_ms, started_at, submitted_at, counts_formal_stats, created_at, updated_at)
     VALUES (?, 'specialty', NULL, NULL, NULL, 'test', 0, 1, 1, 'sequential', 'completed', 1, 0, 1, 0, 1000, ?, ?, 0, ?, ?)`,
    [userId, now, now, now, now],
  )
  await conn.query(
    `INSERT INTO chem_train_session_items
     (session_id, sort_order, item_id, item_code, qtype, answer_type, stem, options_json, answer,
      answer_aliases_json, analysis, user_answer, grade_result, grade_reason, answered_at)
     VALUES (?, 1, NULL, 'orphan', 'single', 'text', 'orphan stem', NULL, 'A', NULL, NULL, 'B', 'wrong', NULL, ?)`,
    [sUnk.insertId, now],
  )
  const aUnk = await api('GET', '/chemistry/train/analytics?days=30')
  const unk = (aUnk.data?.difficulties?.items || []).find((d) => d.key === 'unknown')
  ok(
    'unknown_difficulty_bucket',
    unk && unk.wrongCount >= 1 && unk.empty === false,
    JSON.stringify(unk),
  )
  const unkSp = (aUnk.data?.specialties?.items || []).find(
    (x) => x.specialtyId === 'unknown',
  )
  ok('unknown_specialty_bucket', !!unkSp && unkSp.wrongCount >= 1, JSON.stringify(unkSp))

  // 错题状态与 summary 一致
  const sum = await api('GET', '/chemistry/train/wrong-questions/summary')
  ok(
    'wrong_status_matches_summary',
    aUnk.data?.wrongStatus?.openCount === sum.data?.openCount &&
      aUnk.data?.wrongStatus?.masteredCount === sum.data?.masteredCount &&
      aUnk.data?.wrongStatus?.dueTodayCount === sum.data?.dueTodayCount,
    JSON.stringify({
      analytics: aUnk.data?.wrongStatus,
      summary: sum.data,
    }),
  )

  // 高频错误有数据
  ok(
    'top_wrong_sorted',
    Array.isArray(aUnk.data?.topWrongSpecialties?.items) &&
      (aUnk.data.topWrongSpecialties.items.length === 0 ||
        aUnk.data.topWrongSpecialties.items[0].wrongCount >=
          (aUnk.data.topWrongSpecialties.items[1]?.wrongCount || 0)),
    JSON.stringify(aUnk.data?.topWrongSpecialties?.items?.slice(0, 3)),
  )

  // 建议：due 或入口
  ok(
    'suggestions_array',
    Array.isArray(aUnk.data?.suggestions),
    JSON.stringify(aUnk.data?.suggestions),
  )
  const dueSug = (aUnk.data?.suggestions || []).find((s) => s.id === 'due_today')
  if ((aUnk.data?.wrongStatus?.dueTodayCount || 0) > 0) {
    ok(
      'due_suggestion_path',
      dueSug && dueSug.path.includes('focus=due'),
      JSON.stringify(dueSug),
    )
  } else {
    ok('due_suggestion_path', true, 'no_due_skip')
  }

  // 隔离
  const otherEmail = 'chem_analytics_other@local.test'
  let [[other]] = await conn.query(`SELECT id FROM users WHERE email=?`, [otherEmail])
  if (!other) {
    const bcrypt = require(path.join(ROOT, 'apps/api/node_modules/bcrypt'))
    const hash = await bcrypt.hash('SmokeAnalyticsOther#2026', 10)
    const [ins] = await conn.query(
      `INSERT INTO users (email, password_hash, nickname, grade, role, is_disabled, created_at, updated_at)
       VALUES (?, ?, '分析隔离B', '高一', 'USER', 0, NOW(3), NOW(3))`,
      [otherEmail, hash],
    )
    other = { id: ins.insertId }
  }
  const otherToken = signJwt(env.JWT_SECRET, {
    sub: String(other.id),
    email: otherEmail,
    role: 'USER',
    exp: Math.floor(Date.now() / 1000) + 7200,
  })
  const otherRes = await fetch(`${base}/chemistry/train/analytics?days=30`, {
    headers: { Authorization: `Bearer ${otherToken}` },
  })
  const otherJson = await otherRes.json()
  ok(
    'isolation_other_zero',
    otherRes.status === 200 &&
      otherJson.data?.overview?.submittedSessions === 0 &&
      otherJson.data?.overview?.practicedItems === 0,
    JSON.stringify(otherJson.data?.overview),
  )

  // 刷新一致
  const again = await api('GET', '/chemistry/train/analytics?days=30')
  ok(
    'refresh_consistent',
    again.data?.overview?.practicedItems === aUnk.data?.overview?.practicedItems &&
      again.data?.overview?.accuracyPercent === aUnk.data?.overview?.accuracyPercent,
    JSON.stringify(again.data?.overview),
  )

  // 原入口
  ok(
    'daily_alive',
    (await api('GET', '/chemistry/train/daily/status')).status === 200,
    '',
  )
  ok(
    'learning_home_alive',
    (await api('GET', '/chemistry/train/learning-home')).status === 200,
    '',
  )

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
  console.log(`${out.passed}/${out.total} PASS`)
  console.log('wrote', outPath)
  process.exit(failed.length ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
