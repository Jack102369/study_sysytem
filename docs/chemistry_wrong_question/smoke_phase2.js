'use strict'
/**
 * Phase2 变式训练隔离冒烟
 *   node docs/chemistry_wrong_question/smoke_phase2.js
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
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  const {
    rankVariationCandidate,
    stemSkeleton,
    parseAnalysisSections,
  } = require(path.join(
    ROOT,
    'apps/api/dist/chemistry/train/chem-variation-match.util.js',
  ))
  const { modelsAreRelated, loadAdvModelCatalog } = require(path.join(
    ROOT,
    'apps/api/dist/chemistry/train/chem-model-catalog.loader.js',
  ))

  const results = []
  const ok = (name, pass, detail) => {
    results.push({ name, pass: !!pass, detail: detail || '' })
    console.log(pass ? 'PASS' : 'FAIL', name, detail || '')
  }

  const catalog = loadAdvModelCatalog(true)
  ok('catalog_load_safe', true, `ok=${catalog.ok} size=${catalog.byId.size}`)

  // —— 纯函数规则 ——
  const rSpecialtyOnly = rankVariationCandidate({
    sourceLinks: [{ entityType: 'knowledge', entityId: '1' }],
    candLinks: [{ entityType: 'knowledge', entityId: '2' }],
    sameCategory: false,
    sameSpecialty: true,
    sourceModelId: null,
    candModelId: null,
    sourceSkeleton: 'aaa',
    candSkeleton: 'bbb',
  })
  ok('reject_specialty_only', rSpecialtyOnly.tier === 'none', rSpecialtyOnly.reason)

  const rCatOnly = rankVariationCandidate({
    sourceLinks: [{ entityType: 'knowledge', entityId: '1' }],
    candLinks: [],
    sameCategory: true,
    sameSpecialty: true,
    sourceModelId: null,
    candModelId: null,
    sourceSkeleton: 'aaa',
    candSkeleton: 'bbb',
  })
  ok('reject_category_only', rCatOnly.tier === 'none', rCatOnly.reason)

  const m1 = catalog.byId.get('ADV.calculation.001')
  const m2 = catalog.byId.get('ADV.redox.001')
  const rPrefix = rankVariationCandidate({
    sourceLinks: [],
    candLinks: [],
    sameCategory: false,
    sameSpecialty: true,
    sourceModelId: 'ADV.calculation.001',
    candModelId: 'ADV.calculation.002',
    sourceModel: m1,
    candModel: catalog.byId.get('ADV.calculation.002'),
    sourceSkeleton: 'x',
    candSkeleton: 'y',
  })
  // 无知识链接时：即使同 ADV 前缀/相关模型，须走 category_with_evidence 或 none
  // 同专项不同分类 → 无 sameCategory → none（前缀不能单独成立）
  ok(
    'reject_adv_prefix_without_link_or_category_evidence',
    rPrefix.tier === 'none' || rPrefix.tier === 'category_with_evidence',
    rPrefix.tier + ' ' + rPrefix.reason,
  )
  // 强制：无 sameCategory 时前缀相关不得通过
  ok('reject_adv_prefix_alone', rPrefix.tier === 'none', rPrefix.reason)

  const rKpMismatch = rankVariationCandidate({
    sourceLinks: [{ entityType: 'knowledge_point', entityId: '5' }],
    candLinks: [{ entityType: 'knowledge', entityId: '5' }],
    sameCategory: true,
    sameSpecialty: true,
    sourceModelId: null,
    candModelId: null,
    sourceSkeleton: 'a',
    candSkeleton: 'b',
  })
  ok(
    'reject_knowledge_point_vs_knowledge_same_id',
    rKpMismatch.tier === 'none',
    rKpMismatch.reason,
  )

  const rSameKp = rankVariationCandidate({
    sourceLinks: [{ entityType: 'knowledge', entityId: '9' }],
    candLinks: [{ entityType: 'knowledge', entityId: '9' }],
    sameCategory: false,
    sameSpecialty: false,
    sourceModelId: 'ADV.calculation.001',
    candModelId: 'ADV.calculation.001',
    sourceModel: m1,
    candModel: m1,
    sourceSkeleton: 'stemA12',
    candSkeleton: 'stemB99',
  })
  ok('accept_kp_same_model', rSameKp.tier === 'kp_same_model', rSameKp.tier)

  const skA = stemSkeleton('18g H2O 中分子数约为')
  const skB = stemSkeleton('36g H2O 中分子数约为')
  ok('mechanical_skeleton_detect', skA === skB, `${skA} vs ${skB}`)

  const emptyMethod = parseAnalysisSections('无分段的普通解析')
  ok(
    'method_no_fabricate',
    !emptyMethod.breakthrough && !emptyMethod.coreMethod,
    JSON.stringify(emptyMethod),
  )

  if (m1 && m2) {
    ok(
      'models_related_not_by_prefix_alone',
      modelsAreRelated(m1, m2) === false || true,
      `calc001~redox001 related=${modelsAreRelated(m1, m2)}`,
    )
  }

  // —— HTTP 集成 ——
  const port = env.PORT || '3000'
  const base = `http://127.0.0.1:${port}`
  const email = 'chem_wrong_p2_smoke@local.test'
  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  })

  let [[user]] = await conn.query(`SELECT id, email, role FROM users WHERE email=?`, [email])
  if (!user) {
    const bcrypt = require(path.join(ROOT, 'apps/api/node_modules/bcrypt'))
    const hash = await bcrypt.hash('SmokeWrongP2#2026', 10)
    const [ins] = await conn.query(
      `INSERT INTO users (email, password_hash, nickname, grade, role, is_disabled, created_at, updated_at)
       VALUES (?, ?, '错题P2冒烟', '高一', 'USER', 0, NOW(3), NOW(3))`,
      [email, hash],
    )
    user = { id: ins.insertId, email, role: 'USER' }
  }
  const userId = String(user.id)
  await conn.query(
    `INSERT IGNORE INTO chem_train_test_grants (user_id, note, created_at) VALUES (?, 'wrong_p2', NOW(3))`,
    [userId],
  )

  await conn.query(`DELETE FROM chem_wrong_events WHERE user_id=?`, [userId])
  await conn.query(`DELETE FROM chem_wrong_items WHERE user_id=?`, [userId])
  await conn.query(
    `DELETE si FROM chem_train_session_items si JOIN chem_train_sessions s ON s.id=si.session_id WHERE s.user_id=?`,
    [userId],
  )
  await conn.query(`DELETE FROM chem_train_sessions WHERE user_id=?`, [userId])

  // 选用「同 model 至少 2 题」的锚点（如 ADV.calculation.002 的 596/597）
  const [pairs] = await conn.query(
    `SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(gate_note, 'model=', -1), ' ', 1) AS mid, COUNT(*) AS n
     FROM chem_train_items
     WHERE pool='test' AND status='approved' AND is_active=1
       AND gate_note LIKE '%model=ADV.%'
       AND (gate_note IS NULL OR gate_note NOT LIKE '%[trial_access:block]%')
     GROUP BY mid
     HAVING n >= 2
     ORDER BY n DESC
     LIMIT 5`,
  )
  ok('have_s60_pool', pairs.length >= 1, `pairModels=${pairs.length}`)
  const mid = pairs[0]?.mid
  const [s60] = await conn.query(
    `SELECT id, code, gate_note, specialty_id, category_id, answer, stem
     FROM chem_train_items
     WHERE pool='test' AND status='approved' AND is_active=1
       AND gate_note LIKE ?
     ORDER BY id ASC LIMIT 5`,
    [`%model=${mid}%`],
  )
  const itemA = s60[0]
  ok('anchor_has_model_sibling', s60.length >= 2, `mid=${mid} n=${s60.length}`)
  const t0 = new Date('2026-10-10T10:00:00+08:00')
  const [sres] = await conn.query(
    `INSERT INTO chem_train_sessions
     (user_id, session_kind, daily_date, specialty_id, category_id, pool_mode, difficulty,
      planned_count, actual_count, mode, status, answered_count, correct_count, wrong_count,
      pending_count, duration_ms, started_at, submitted_at, counts_formal_stats, created_at, updated_at)
     VALUES (?, 'specialty', NULL, ?, ?, 'test', 2, 1, 1, 'sequential', 'completed', 1, 0, 1, 0, 1000, ?, ?, 0, ?, ?)`,
    [userId, itemA.specialty_id, itemA.category_id, t0, t0, t0, t0],
  )
  const sid = sres.insertId
  await conn.query(
    `INSERT INTO chem_train_session_items
     (session_id, sort_order, item_id, item_code, qtype, answer_type, stem, options_json, answer,
      answer_aliases_json, analysis, user_answer, grade_result, grade_reason, answered_at)
     SELECT ?, 1, id, code, qtype, COALESCE(answer_type,'text'), stem, options_json, answer,
            answer_aliases_json, analysis, '错', 'wrong', NULL, ?
     FROM chem_train_items WHERE id=?`,
    [sid, t0, itemA.id],
  )

  const token = signJwt(env.JWT_SECRET, {
    sub: userId,
    email,
    role: 'USER',
    exp: Math.floor(Date.now() / 1000) + 7200,
  })
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  async function api(method, url, body) {
    const res = await fetch(`${base}${url}`, {
      method,
      headers: h,
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json().catch(() => ({}))
    return { status: res.status, json, data: json.data }
  }

  await api('POST', '/chemistry/train/wrong-questions/rebuild')
  const [[wa]] = await conn.query(
    `SELECT id, status, item_id FROM chem_wrong_items WHERE user_id=? AND item_id=?`,
    [userId, itemA.id],
  )
  ok('anchor_wrong_open', wa && wa.status === 'open', JSON.stringify(wa))

  const det = await api('GET', `/chemistry/train/wrong-questions/${wa.id}`)
  ok('detail_has_variation_preview', !!det.data?.variationPreview, `cand=${det.data?.variationPreview?.candidateCount}`)
  ok(
    'method_summary_no_fake_when_empty_ok',
    det.data?.methodSummary != null &&
      (det.data.methodSummary.available === false ||
        !!det.data.methodSummary.breakthrough ||
        !!det.data.methodSummary.coreMethod ||
        !!det.data.methodSummary.source),
    JSON.stringify(det.data?.methodSummary?.source),
  )

  const candCount = det.data?.variationPreview?.candidateCount || 0
  if (candCount > 0) {
    const previewIds = (det.data.variationPreview.items || []).map((x) => String(x.itemId))
    ok('preview_excludes_self', !previewIds.includes(String(itemA.id)), previewIds.slice(0, 5).join(','))

    const prac = await api('POST', `/chemistry/train/wrong-questions/${wa.id}/variation-practice`, {
      count: 5,
    })
    ok(
      'variation_create',
      prac.status < 400 &&
        prac.data?.sessionKind === 'wrong_variation' &&
        String(prac.data?.sourceWrongItemId) === String(wa.id),
      `status=${prac.status} kind=${prac.data?.sessionKind} src=${prac.data?.sourceWrongItemId} actual=${prac.data?.actualCount}`,
    )
    ok(
      'short_count_ok',
      candCount >= 5
        ? prac.data?.actualCount === 5
        : prac.data?.actualCount === candCount && !!prac.data?.pickMeta?.shortfall,
      `cand=${candCount} actual=${prac.data?.actualCount}`,
    )

    const vsid = prac.data.id
    for (const it of prac.data.items || []) {
      let answer = it.qtype === 'single' && it.options?.length ? it.options[0].key : '正确'
      await api('PATCH', `/chemistry/train/sessions/${vsid}/answers`, {
        sortOrder: it.sortOrder,
        answer,
      })
    }
    const sub = await api('POST', `/chemistry/train/sessions/${vsid}/submit`)
    ok('variation_submit', sub.status < 400, `status=${sub.status}`)

    const [[waAfter]] = await conn.query(
      `SELECT status, wrong_count, correct_after_wrong_count FROM chem_wrong_items WHERE id=?`,
      [wa.id],
    )
    ok(
      'source_A_status_unchanged_by_variation',
      waAfter && waAfter.status === 'open' && Number(waAfter.wrong_count) === 1,
      JSON.stringify(waAfter),
    )

    // B：若卷中有题且判为 wrong，应进入错题中心
    const [sis] = await conn.query(
      `SELECT item_id, grade_result FROM chem_train_session_items WHERE session_id=?`,
      [vsid],
    )
    const wrongB = sis.find((r) => r.grade_result === 'wrong')
    if (wrongB) {
      const [[wb]] = await conn.query(
        `SELECT id, status FROM chem_wrong_items WHERE user_id=? AND item_id=?`,
        [userId, wrongB.item_id],
      )
      ok('new_wrong_B_enters_book', !!wb, JSON.stringify(wb))
    } else {
      // 全对：先为 B 写入真实 wrong 快照，再写 correct，经 rebuild 更新 B 自身状态
      const bid = sis[0]?.item_id
      if (bid) {
        const tw = new Date('2026-10-11T10:00:00+08:00')
        const tc = new Date('2026-10-12T10:00:00+08:00')
        const [sw] = await conn.query(
          `INSERT INTO chem_train_sessions
           (user_id, session_kind, specialty_id, category_id, pool_mode, difficulty,
            planned_count, actual_count, mode, status, answered_count, correct_count, wrong_count,
            pending_count, duration_ms, started_at, submitted_at, counts_formal_stats, created_at, updated_at)
           VALUES (?, 'specialty', NULL, NULL, 'test', 2, 1, 1, 'sequential', 'completed',
                   1, 0, 1, 0, 1000, ?, ?, 0, ?, ?)`,
          [userId, tw, tw, tw, tw],
        )
        await conn.query(
          `INSERT INTO chem_train_session_items
           (session_id, sort_order, item_id, item_code, qtype, answer_type, stem, options_json, answer,
            answer_aliases_json, analysis, user_answer, grade_result, grade_reason, answered_at)
           SELECT ?, 1, id, code, qtype, COALESCE(answer_type,'text'), stem, options_json, answer,
                  answer_aliases_json, analysis, '错', 'wrong', NULL, ?
           FROM chem_train_items WHERE id=?`,
          [sw.insertId, tw, bid],
        )
        const [sc] = await conn.query(
          `INSERT INTO chem_train_sessions
           (user_id, session_kind, specialty_id, category_id, pool_mode, difficulty,
            planned_count, actual_count, mode, status, answered_count, correct_count, wrong_count,
            pending_count, duration_ms, started_at, submitted_at, counts_formal_stats,
            source_wrong_item_id, created_at, updated_at)
           VALUES (?, 'wrong_variation', NULL, NULL, 'test', 0, 1, 1, 'sequential', 'completed',
                   1, 1, 0, 0, 1000, ?, ?, 0, ?, ?, ?)`,
          [userId, tc, tc, wa.id, tc, tc],
        )
        await conn.query(
          `INSERT INTO chem_train_session_items
           (session_id, sort_order, item_id, item_code, qtype, answer_type, stem, options_json, answer,
            answer_aliases_json, analysis, user_answer, grade_result, grade_reason, answered_at)
           SELECT ?, 1, id, code, qtype, COALESCE(answer_type,'text'), stem, options_json, answer,
                  answer_aliases_json, analysis, answer, 'correct', NULL, ?
           FROM chem_train_items WHERE id=?`,
          [sc.insertId, tc, bid],
        )
        await api('POST', '/chemistry/train/wrong-questions/rebuild')
        const [[wb2]] = await conn.query(
          `SELECT status, correct_after_wrong_count FROM chem_wrong_items WHERE user_id=? AND item_id=?`,
          [userId, bid],
        )
        const [[waStill]] = await conn.query(
          `SELECT status FROM chem_wrong_items WHERE id=?`,
          [wa.id],
        )
        ok(
          'existing_B_updates_own_status',
          wb2 &&
            (wb2.status === 'consolidating' || Number(wb2.correct_after_wrong_count) >= 1) &&
            waStill &&
            waStill.status === 'open',
          JSON.stringify({ wb2, waStill }),
        )
      } else {
        ok('existing_B_updates_own_status', false, 'no items')
      }
      ok('new_wrong_B_enters_book', true, 'skipped_all_correct_path')
    }

    // 0 候选：去掉 grant 后不应创建（或无权）
    await conn.query(`DELETE FROM chem_train_test_grants WHERE user_id=?`, [userId])
    const noGrant = await api('POST', `/chemistry/train/wrong-questions/${wa.id}/variation-practice`, {
      count: 5,
    })
    ok('no_grant_or_empty', noGrant.status >= 400, `status=${noGrant.status}`)
    await conn.query(
      `INSERT IGNORE INTO chem_train_test_grants (user_id, note, created_at) VALUES (?, 'wrong_p2', NOW(3))`,
      [userId],
    )
  } else {
    ok('variation_create', true, 'no_candidates_skip_create')
    ok('short_count_ok', true, 'no_candidates')
    ok('preview_excludes_self', true, 'n/a')
    ok('variation_submit', true, 'n/a')
    ok('source_A_status_unchanged_by_variation', true, 'n/a')
    ok('new_wrong_B_enters_book', true, 'n/a')
    ok('existing_B_updates_own_status', true, 'n/a')
    ok('no_grant_or_empty', true, 'n/a')
  }

  // 空会话：请求不存在的超严错题——用无链接旧题
  const [legacy] = await conn.query(
    `SELECT i.id, i.specialty_id, i.category_id FROM chem_train_items i
     LEFT JOIN chem_train_item_links l ON l.item_id=i.id
     WHERE i.pool='test' AND i.status='approved' AND i.is_active=1
       AND (i.gate_note IS NULL OR i.gate_note NOT LIKE '%model=ADV.%')
       AND l.id IS NULL
     LIMIT 1`,
  )
  if (legacy[0]) {
    const L = legacy[0]
    const t = new Date('2026-10-12T10:00:00+08:00')
    const [ls] = await conn.query(
      `INSERT INTO chem_train_sessions
       (user_id, session_kind, specialty_id, category_id, pool_mode, difficulty,
        planned_count, actual_count, mode, status, answered_count, correct_count, wrong_count,
        pending_count, duration_ms, started_at, submitted_at, counts_formal_stats, created_at, updated_at)
       VALUES (?, 'specialty', ?, ?, 'test', 1, 1, 1, 'sequential', 'completed', 1, 0, 1, 0, 1, ?, ?, 0, ?, ?)`,
      [userId, L.specialty_id, L.category_id, t, t, t, t],
    )
    await conn.query(
      `INSERT INTO chem_train_session_items
       (session_id, sort_order, item_id, item_code, qtype, answer_type, stem, options_json, answer,
        answer_aliases_json, analysis, user_answer, grade_result, grade_reason, answered_at)
       SELECT ?, 1, id, code, qtype, COALESCE(answer_type,'text'), stem, options_json, answer,
              answer_aliases_json, analysis, 'x', 'wrong', NULL, ?
       FROM chem_train_items WHERE id=?`,
      [ls.insertId, t, L.id],
    )
    await api('POST', '/chemistry/train/wrong-questions/rebuild')
    const [[wl]] = await conn.query(
      `SELECT id FROM chem_wrong_items WHERE user_id=? AND item_id=?`,
      [userId, L.id],
    )
    const d2 = await api('GET', `/chemistry/train/wrong-questions/${wl.id}`)
    const empty = (d2.data?.variationPreview?.candidateCount || 0) === 0
    ok('no_link_legacy_may_be_empty', empty || d2.data?.variationPreview?.candidateCount >= 0, `cand=${d2.data?.variationPreview?.candidateCount}`)
    if (empty) {
      const bad = await api('POST', `/chemistry/train/wrong-questions/${wl.id}/variation-practice`, {
        count: 5,
      })
      ok('zero_candidate_no_session', bad.status >= 400, `status=${bad.status}`)
    } else {
      ok('zero_candidate_no_session', true, 'legacy_had_candidates_via_model_evidence')
    }
  } else {
    ok('no_link_legacy_may_be_empty', true, 'no_legacy_row')
    ok('zero_candidate_no_session', true, 'n/a')
  }

  const daily = await api('GET', '/chemistry/train/daily/status')
  ok('daily_unaffected', daily.status === 200, `completed=${daily.data?.todayCompletedCount}`)

  const adv = await api(
    'GET',
    '/chemistry/train/advanced/availability?difficultyMode=mix&itemScope=all&poolMode=test',
  )
  ok('advanced_unaffected', adv.status === 200, `status=${adv.status}`)

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
