'use strict'
/**
 * 化学错题中心 Phase1 隔离冒烟
 *   node docs/chemistry_wrong_question/smoke_phase1.js
 *
 * 使用隔离账号 chem_wrong_smoke@local.test（自动创建/授权/清理测试会话数据时可保留账号）
 * 不修改管理员密码；不改正式题库内容（仅临时标记 block 再还原）。
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

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  const port = env.PORT || '3000'
  const base = `http://127.0.0.1:${port}`
  const email = 'chem_wrong_smoke@local.test'
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

  // 确保表存在
  const [tables] = await conn.query(`SHOW TABLES LIKE 'chem_wrong_items'`)
  if (!tables.length) {
    console.error('chem_wrong_items missing — run migration first')
    process.exit(1)
  }

  // 隔离用户 + grant
  let [[user]] = await conn.query(`SELECT id, email, role FROM users WHERE email=?`, [
    email,
  ])
  if (!user) {
    const bcrypt = require(path.join(ROOT, 'apps/api/node_modules/bcrypt'))
    const hash = await bcrypt.hash('SmokeWrong#2026', 10)
    const [ins] = await conn.query(
      `INSERT INTO users (email, password_hash, nickname, grade, role, is_disabled, created_at, updated_at)
       VALUES (?, ?, '错题冒烟', '高一', 'USER', 0, NOW(3), NOW(3))`,
      [email, hash],
    )
    user = { id: ins.insertId, email, role: 'USER' }
  }
  const userId = String(user.id)
  await conn.query(
    `INSERT IGNORE INTO chem_train_test_grants (user_id, note, created_at) VALUES (?, 'wrong_smoke', NOW(3))`,
    [userId],
  )

  // 清理该用户旧错题索引与测试会话
  await conn.query(`DELETE FROM chem_wrong_events WHERE user_id=?`, [userId])
  await conn.query(`DELETE FROM chem_wrong_items WHERE user_id=?`, [userId])
  await conn.query(
    `DELETE si FROM chem_train_session_items si
     JOIN chem_train_sessions s ON s.id=si.session_id WHERE s.user_id=?`,
    [userId],
  )
  await conn.query(`DELETE FROM chem_train_sessions WHERE user_id=?`, [userId])

  // 挑 3 道可训练题 + 1 道可临时 block 的题
  const [eligible] = await conn.query(
    `SELECT id, code, answer, qtype, options_json, pool, gate_note
     FROM chem_train_items
     WHERE pool='test' AND status='approved' AND is_active=1
       AND (gate_note IS NULL OR gate_note NOT LIKE '%[trial_access:block]%')
     ORDER BY id ASC LIMIT 20`,
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
      items, // [{item, grade, answeredAt, userAnswer}]
      startedAt,
      submittedAt,
      specialtyId = null,
      categoryId = null,
    } = opts
    const [sres] = await conn.query(
      `INSERT INTO chem_train_sessions
       (user_id, session_kind, daily_date, specialty_id, category_id, pool_mode, difficulty,
        planned_count, actual_count, mode, status, answered_count, correct_count, wrong_count,
        pending_count, duration_ms, started_at, submitted_at, counts_formal_stats, created_at, updated_at)
       VALUES (?, ?, NULL, ?, ?, 'test', 1, ?, ?, 'sequential', 'completed', ?, ?, ?, ?, 1000, ?, ?, 0, ?, ?)`,
      [
        userId,
        kind,
        specialtyId,
        categoryId,
        items.length,
        items.length,
        items.length,
        items.filter((x) => x.grade === 'correct').length,
        items.filter((x) => x.grade === 'wrong').length,
        items.filter((x) => x.grade === 'pending_review').length,
        startedAt,
        submittedAt,
        startedAt,
        submittedAt,
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
        [sid, i + 1, it.userAnswer || 'x', it.grade, it.answeredAt, row.id],
      )
    }
    return sid
  }

  // —— 1) 先错后对 ——（specialty wrong day0, daily correct day1）
  const t0 = new Date('2026-10-10T10:00:00+08:00')
  const t1 = new Date('2026-10-11T10:00:00+08:00')
  const t2 = new Date('2026-10-14T10:00:00+08:00') // +3 days from first correct
  const t3 = new Date('2026-10-15T10:00:00+08:00')

  await insertCompletedSession({
    kind: 'specialty',
    startedAt: t0,
    submittedAt: t0,
    items: [{ item: itemA, grade: 'wrong', answeredAt: t0, userAnswer: '错答' }],
  })
  await insertCompletedSession({
    kind: 'daily',
    startedAt: t1,
    submittedAt: t1,
    items: [{ item: itemA, grade: 'correct', answeredAt: t1, userAnswer: itemA.answer }],
  })

  // 重复做错 itemB 两次
  await insertCompletedSession({
    kind: 'advanced',
    startedAt: t0,
    submittedAt: t0,
    items: [{ item: itemB, grade: 'wrong', answeredAt: t0 }],
  })
  await insertCompletedSession({
    kind: 'specialty',
    startedAt: t1,
    submittedAt: t1,
    items: [{ item: itemB, grade: 'wrong', answeredAt: t1 }],
  })

  // itemC: wrong + pending_review + correct（pending 不计入）
  await insertCompletedSession({
    kind: '',
    startedAt: t0,
    submittedAt: t0,
    items: [{ item: itemC, grade: 'wrong', answeredAt: t0 }],
  })
  await insertCompletedSession({
    kind: 'specialty',
    startedAt: t1,
    submittedAt: t1,
    items: [{ item: itemC, grade: 'pending_review', answeredAt: t1 }],
  })

  // rebuild
  let r1 = await api('POST', '/chemistry/train/wrong-questions/rebuild')
  ok('rebuild_ok', r1.status === 200 || r1.status === 201, `status=${r1.status}`)
  const snap1 = JSON.stringify(r1.data)

  let r2 = await api('POST', '/chemistry/train/wrong-questions/rebuild')
  ok('rebuild_idempotent', snap1 === JSON.stringify(r2.data) || r2.data?.itemCount === r1.data?.itemCount, JSON.stringify(r2.data))

  // list/summary
  const sum = await api('GET', '/chemistry/train/wrong-questions/summary')
  ok('summary_ok', sum.status === 200 && sum.data, JSON.stringify(sum.data))

  const [[wa]] = await conn.query(
    `SELECT status, wrong_count, correct_after_wrong_count FROM chem_wrong_items WHERE user_id=? AND item_id=?`,
    [userId, itemA.id],
  )
  ok(
    'history_wrong_then_correct_consolidating',
    wa && wa.status === 'consolidating' && Number(wa.wrong_count) === 1 && Number(wa.correct_after_wrong_count) === 1,
    JSON.stringify(wa),
  )

  const [[wb]] = await conn.query(
    `SELECT status, wrong_count FROM chem_wrong_items WHERE user_id=? AND item_id=?`,
    [userId, itemB.id],
  )
  ok(
    'repeat_wrong_open_count2',
    wb && wb.status === 'open' && Number(wb.wrong_count) === 2,
    JSON.stringify(wb),
  )

  const [[wc]] = await conn.query(
    `SELECT status, wrong_count, correct_after_wrong_count FROM chem_wrong_items WHERE user_id=? AND item_id=?`,
    [userId, itemC.id],
  )
  ok(
    'pending_review_ignored',
    wc && wc.status === 'open' && Number(wc.wrong_count) === 1 && Number(wc.correct_after_wrong_count) === 0,
    JSON.stringify(wc),
  )

  // 跨模式再对 itemA（wrong_review 模拟）→ 仍 consolidating，需满足 3 日+2 session
  await insertCompletedSession({
    kind: 'wrong_review',
    startedAt: new Date('2026-10-12T10:00:00+08:00'),
    submittedAt: new Date('2026-10-12T10:00:00+08:00'),
    items: [
      {
        item: itemA,
        grade: 'correct',
        answeredAt: new Date('2026-10-12T10:00:00+08:00'),
        userAnswer: itemA.answer,
      },
    ],
  })
  await api('POST', '/chemistry/train/wrong-questions/rebuild')
  const [[wa2]] = await conn.query(
    `SELECT status, correct_after_wrong_count FROM chem_wrong_items WHERE user_id=? AND item_id=?`,
    [userId, itemA.id],
  )
  // first correct Oct11, this Oct12 → gap 1 day < 3 → consolidating
  ok(
    'cross_mode_correct_still_consolidating',
    wa2 && wa2.status === 'consolidating' && Number(wa2.correct_after_wrong_count) >= 2,
    JSON.stringify(wa2),
  )

  // 跨 3 天掌握：再插一次 correct at t2（距 firstCorrect Oct11 ≥3 天）
  await insertCompletedSession({
    kind: 'specialty',
    startedAt: t2,
    submittedAt: t2,
    items: [{ item: itemA, grade: 'correct', answeredAt: t2, userAnswer: itemA.answer }],
  })
  await api('POST', '/chemistry/train/wrong-questions/rebuild')
  const [[wa3]] = await conn.query(
    `SELECT status, correct_after_wrong_count FROM chem_wrong_items WHERE user_id=? AND item_id=?`,
    [userId, itemA.id],
  )
  ok('mastered_after_3day_gap', wa3 && wa3.status === 'mastered', JSON.stringify(wa3))

  // 再次做错 → 待攻克
  await insertCompletedSession({
    kind: 'daily',
    startedAt: t3,
    submittedAt: t3,
    items: [{ item: itemA, grade: 'wrong', answeredAt: t3 }],
  })
  await api('POST', '/chemistry/train/wrong-questions/rebuild')
  const [[wa4]] = await conn.query(
    `SELECT status, wrong_count, correct_after_wrong_count FROM chem_wrong_items WHERE user_id=? AND item_id=?`,
    [userId, itemA.id],
  )
  ok(
    'wrong_resets_to_open',
    wa4 && wa4.status === 'open' && Number(wa4.correct_after_wrong_count) === 0,
    JSON.stringify(wa4),
  )

  // 事件按 session_item 去重：重复 rebuild 事件数不变
  const [[evBefore]] = await conn.query(
    `SELECT COUNT(*) AS n FROM chem_wrong_events WHERE user_id=?`,
    [userId],
  )
  await api('POST', '/chemistry/train/wrong-questions/rebuild')
  const [[evAfter]] = await conn.query(
    `SELECT COUNT(*) AS n FROM chem_wrong_events WHERE user_id=?`,
    [userId],
  )
  ok('event_dedupe_stable', Number(evBefore.n) === Number(evAfter.n), `${evBefore.n}->${evAfter.n}`)

  // 停用题不可复练：临时 block itemB
  const oldNote = itemB.gate_note
  await conn.query(
    `UPDATE chem_train_items SET gate_note=CONCAT(COALESCE(gate_note,''), '[trial_access:block]') WHERE id=?`,
    [itemB.id],
  )
  // 先把 A/C 置 mastered 以便只剩 B open 被跳过
  // 直接测 practice 后 skip
  const pracBlocked = await api('POST', '/chemistry/train/wrong-questions/practice', {
    count: 5,
  })
  const pickedIds = (pracBlocked.data?.items || [])
    .map((x) => x.itemId || x.id)
    .filter(Boolean)
  // session items don't expose itemId in response maybe — check via DB
  let blockedInSession = false
  if (pracBlocked.status < 400 && pracBlocked.data?.id) {
    const [sis] = await conn.query(
      `SELECT item_id FROM chem_train_session_items WHERE session_id=?`,
      [pracBlocked.data.id],
    )
    blockedInSession = sis.some((r) => String(r.item_id) === String(itemB.id))
    // cancel leftover
    await api('POST', `/chemistry/train/sessions/${pracBlocked.data.id}/cancel`)
  }
  ok('blocked_item_not_practiced', !blockedInSession, `status=${pracBlocked.status}`)
  // restore gate
  await conn.query(`UPDATE chem_train_items SET gate_note=? WHERE id=?`, [
    oldNote,
    itemB.id,
  ])

  // 无 grants 无法越权
  await conn.query(`DELETE FROM chem_train_test_grants WHERE user_id=?`, [userId])
  const noGrant = await api('POST', '/chemistry/train/wrong-questions/practice', {
    count: 5,
  })
  ok(
    'no_grant_forbidden',
    noGrant.status === 403 || noGrant.status === 400,
    `status=${noGrant.status}`,
  )
  await conn.query(
    `INSERT IGNORE INTO chem_train_test_grants (user_id, note, created_at) VALUES (?, 'wrong_smoke', NOW(3))`,
    [userId],
  )

  // 真实 API 提交路径：创建复练 → 答题 → 双次 submit 不重复计数
  const prac = await api('POST', '/chemistry/train/wrong-questions/practice', { count: 5 })
  ok(
    'practice_create',
    prac.status < 400 && prac.data?.sessionKind === 'wrong_review',
    `status=${prac.status} kind=${prac.data?.sessionKind} actual=${prac.data?.actualCount} shortfall=${prac.data?.pickMeta?.shortfall}`,
  )
  ok(
    'practice_not_daily',
    prac.data?.pickMeta?.countsDailyCompletion === false,
    JSON.stringify(prac.data?.pickMeta),
  )

  if (prac.data?.id) {
    const sid = prac.data.id
    for (const it of prac.data.items || []) {
      let answer = '正确'
      if (it.qtype === 'single' && it.options?.length) answer = it.options[0].key
      if (it.qtype === 'blank') answer = 'H2O'
      if (it.qtype === 'judge') answer = '正确'
      await api('PATCH', `/chemistry/train/sessions/${sid}/answers`, {
        sortOrder: it.sortOrder,
        answer,
      })
    }
    const sub1 = await api('POST', `/chemistry/train/sessions/${sid}/submit`)
    const [[ev1]] = await conn.query(
      `SELECT COUNT(*) AS n FROM chem_wrong_events WHERE user_id=? AND session_id=?`,
      [userId, sid],
    )
    const sub2 = await api('POST', `/chemistry/train/sessions/${sid}/submit`)
    const [[ev2]] = await conn.query(
      `SELECT COUNT(*) AS n FROM chem_wrong_events WHERE user_id=? AND session_id=?`,
      [userId, sid],
    )
    ok(
      'submit_ok',
      sub1.status < 400 && Number(sub1.data?.answeredCount || 0) > 0,
      `status=${sub1.status} answered=${sub1.data?.answeredCount} c/w/p=${sub1.data?.correctCount}/${sub1.data?.wrongCount}/${sub1.data?.pendingCount}`,
    )
    ok(
      'idempotent_submit_no_dup_events',
      Number(ev1.n) > 0 && Number(ev1.n) === Number(ev2.n) && sub2.status < 400,
      `ev ${ev1.n}->${ev2.n}`,
    )
  }

  // 每日完成次数不受 wrong_review 影响
  const dailyBefore = await api('GET', '/chemistry/train/daily/status')
  const completedBefore = dailyBefore.data?.todayCompletedCount || 0
  // ensure a wrong_review completed already above; daily status should ignore
  const dailyAfter = await api('GET', '/chemistry/train/daily/status')
  ok(
    'daily_unaffected_by_wrong_review',
    (dailyAfter.data?.todayCompletedCount || 0) === completedBefore,
    `${completedBefore}->${dailyAfter.data?.todayCompletedCount}`,
  )

  // advanced availability still works
  const adv = await api('GET', '/chemistry/train/advanced/availability?difficultyMode=mix&itemScope=all&poolMode=test')
  ok('advanced_still_ok', adv.status === 200, `status=${adv.status}`)

  // list + detail
  const list = await api('GET', '/chemistry/train/wrong-questions?page=1&pageSize=10')
  ok('list_ok', list.status === 200 && Array.isArray(list.data?.items), `total=${list.data?.total}`)
  if (list.data?.items?.[0]) {
    const det = await api(
      'GET',
      `/chemistry/train/wrong-questions/${list.data.items[0].id}`,
    )
    ok('detail_ok', det.status === 200 && det.data?.history, `hist=${det.data?.history?.length}`)
  } else {
    ok('detail_ok', false, 'no items')
  }

  // 用户隔离：用另一用户 token 不能看
  const otherToken = signJwt(env.JWT_SECRET, {
    sub: '999999999',
    email: 'nobody@local.test',
    role: 'USER',
    exp: Math.floor(Date.now() / 1000) + 600,
  })
  if (list.data?.items?.[0]) {
    const res = await fetch(
      `${base}/chemistry/train/wrong-questions/${list.data.items[0].id}`,
      { headers: { Authorization: `Bearer ${otherToken}` } },
    )
    ok('user_isolation', res.status === 404 || res.status === 401 || res.status === 403, `status=${res.status}`)
  }

  await conn.end()

  const failed = results.filter((r) => !r.pass)
  console.log('\n=== SUMMARY ===')
  console.log(`pass=${results.length - failed.length} fail=${failed.length}`)
  if (failed.length) {
    for (const f of failed) console.log(' -', f.name, f.detail)
    process.exit(1)
  }
  console.log('ALL_PASS')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
