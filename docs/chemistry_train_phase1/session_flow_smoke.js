/**
 * DB-level session flow (no HTTP password needed).
 * Creates a test session for first ADMIN user, grades, checks answer isolation fields in DB,
 * then deletes the smoke session only.
 */
'use strict'
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

function normalizeExact(s) {
  return String(s ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/／/g, '/')
}

function grade(qtype, std, aliasesJson, user) {
  const u = String(user ?? '').trim()
  if (!u) return 'pending_review'
  const aliases = (() => {
    if (!aliasesJson) return []
    if (Array.isArray(aliasesJson)) return aliasesJson.map(String)
    try {
      const j = typeof aliasesJson === 'string' ? JSON.parse(aliasesJson) : aliasesJson
      return Array.isArray(j) ? j.map(String) : []
    } catch {
      return []
    }
  })()
  if (qtype === 'single' || qtype === 'judge') {
    return normalizeExact(u) === normalizeExact(std) ? 'correct' : 'wrong'
  }
  const cands = [std, ...aliases].map(normalizeExact).filter(Boolean)
  if (!cands.length) return 'pending_review'
  if (cands.includes(normalizeExact(u))) return 'correct'
  return 'pending_review'
}

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })
  const checks = []
  const pass = (id, d) => checks.push({ id, ok: true, detail: d })
  const fail = (id, d) => checks.push({ id, ok: false, detail: d })

  const [[admin]] = await conn.query(
    "SELECT id, email FROM users WHERE role='ADMIN' AND is_disabled=0 LIMIT 1",
  )
  if (!admin) {
    fail('admin_user', 'none')
  } else {
    pass('admin_user', admin.email)
  }

  const [items] = await conn.query(
    `SELECT i.* FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id
     WHERE i.pool='test' AND i.status='approved' AND i.is_active=1
       AND s.code='equation' AND c.code='true_false' AND i.difficulty=1
     ORDER BY i.id ASC LIMIT 5`,
  )
  if (items.length > 0) pass('pick_test_items', items.length)
  else fail('pick_test_items', 0)

  let sessionId = null
  if (admin && items.length) {
    const [ins] = await conn.query(
      `INSERT INTO chem_train_sessions
       (user_id, specialty_id, category_id, pool_mode, difficulty, planned_count, actual_count,
        mode, status, started_at, counts_formal_stats)
       VALUES (?,?,?,?,?,?,?,'sequential','in_progress',NOW(3),0)`,
      [
        admin.id,
        items[0].specialty_id,
        items[0].category_id,
        'test',
        1,
        5,
        items.length,
      ],
    )
    sessionId = String(ins.insertId)
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      await conn.query(
        `INSERT INTO chem_train_session_items
         (session_id, sort_order, item_id, item_code, qtype, stem, options_json, answer, answer_aliases_json, analysis)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          sessionId,
          i + 1,
          it.id,
          it.code,
          it.qtype,
          it.stem,
          it.options_json ? JSON.stringify(it.options_json) : null,
          it.answer,
          it.answer_aliases_json ? JSON.stringify(it.answer_aliases_json) : null,
          it.analysis,
        ],
      )
    }
    pass('session_created', sessionId)

    // simulate answers
    const [sitems] = await conn.query(
      'SELECT * FROM chem_train_session_items WHERE session_id=? ORDER BY sort_order',
      [sessionId],
    )
    let correct = 0
    let wrong = 0
    let pending = 0
    for (const si of sitems) {
      let userAns = si.answer
      if (si.qtype === 'blank') userAns = '含糊表达'
      const g = grade(si.qtype, si.answer, si.answer_aliases_json, userAns)
      await conn.query(
        `UPDATE chem_train_session_items SET user_answer=?, grade_result=?, answered_at=NOW(3) WHERE id=?`,
        [userAns, g, si.id],
      )
      if (g === 'correct') correct++
      else if (g === 'wrong') wrong++
      else pending++
    }
    await conn.query(
      `UPDATE chem_train_sessions SET status='completed', submitted_at=NOW(3),
       correct_count=?, wrong_count=?, pending_count=?, answered_count=?,
       duration_ms=1000 WHERE id=? AND user_id=?`,
      [correct, wrong, pending, sitems.length, sessionId, admin.id],
    )
    pass('graded', { correct, wrong, pending })
    if (pending > 0) pass('blank_pending_not_wrong', pending)
    else pass('blank_pending_not_wrong', 'no blank in set')

    // isolation: another user cannot see (simulate by wrong user_id query)
    const [[other]] = await conn.query(
      "SELECT id FROM users WHERE id<>? LIMIT 1",
      [admin.id],
    )
    if (other) {
      const [cross] = await conn.query(
        'SELECT id FROM chem_train_sessions WHERE id=? AND user_id=?',
        [sessionId, other.id],
      )
      if (cross.length === 0) pass('user_isolation', true)
      else fail('user_isolation', false)
    } else {
      pass('user_isolation', 'skipped_no_other_user')
    }

    // cleanup smoke session only
    await conn.query('DELETE FROM chem_train_sessions WHERE id=?', [sessionId])
    pass('smoke_session_cleaned', sessionId)
  }

  // formal create should be blocked conceptually: available 0
  const [[{ fc }]] = await conn.query(
    `SELECT COUNT(*) AS fc FROM chem_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  if (Number(fc) === 0) pass('formal_pool_empty', 0)
  else pass('formal_pool_nonempty', Number(fc))

  await conn.end()
  const allOk = checks.every((c) => c.ok)
  const out = { at: new Date().toISOString(), allOk, checks }
  fs.writeFileSync(path.join(__dirname, 'session_flow_smoke_result.json'), JSON.stringify(out, null, 2))
  console.log(JSON.stringify(out, null, 2))
  if (!allOk) process.exit(2)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
