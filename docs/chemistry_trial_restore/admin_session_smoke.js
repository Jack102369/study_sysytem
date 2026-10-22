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
  let aliases = []
  try {
    const j = typeof aliasesJson === 'string' ? JSON.parse(aliasesJson) : aliasesJson
    aliases = Array.isArray(j) ? j.map(String) : []
  } catch {
    aliases = []
  }
  if (qtype === 'single' || qtype === 'judge') {
    return normalizeExact(u) === normalizeExact(std) ? 'correct' : 'wrong'
  }
  const cands = [std, ...aliases].map(normalizeExact).filter(Boolean)
  if (!cands.length) return 'pending_review'
  return cands.includes(normalizeExact(u)) ? 'correct' : 'pending_review'
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

  const [[admin]] = await conn.query(
    "SELECT id FROM users WHERE role='ADMIN' AND is_disabled=0 LIMIT 1",
  )
  const [pick] = await conn.query(
    `SELECT * FROM chem_train_items
     WHERE code LIKE 'train.ai_trial.%' AND pool='test' AND status='approved' AND is_active=1
     ORDER BY specialty_id, id LIMIT 5`,
  )
  if (!admin || pick.length < 3) {
    console.log(JSON.stringify({ ok: false, admin: !!admin, items: pick.length }))
    await conn.end()
    process.exit(1)
  }

  const [ins] = await conn.query(
    `INSERT INTO chem_train_sessions
     (user_id, specialty_id, category_id, pool_mode, difficulty, planned_count, actual_count,
      mode, status, started_at, counts_formal_stats)
     VALUES (?,?,?,?,?,?,?,'sequential','in_progress',NOW(3),0)`,
    [
      admin.id,
      pick[0].specialty_id,
      pick[0].category_id,
      'test',
      1,
      pick.length,
      pick.length,
    ],
  )
  const sid = String(ins.insertId)

  for (let i = 0; i < pick.length; i++) {
    const it = pick[i]
    await conn.query(
      `INSERT INTO chem_train_session_items
       (session_id, sort_order, item_id, item_code, qtype, stem, options_json, answer, answer_aliases_json, analysis)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        sid,
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

  const [sitems] = await conn.query(
    'SELECT * FROM chem_train_session_items WHERE session_id=? ORDER BY sort_order',
    [sid],
  )
  let correct = 0
  let wrong = 0
  let pending = 0
  for (const si of sitems) {
    const userAns = si.answer
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
     correct_count=?, wrong_count=?, pending_count=?, answered_count=?, duration_ms=500
     WHERE id=? AND user_id=?`,
    [correct, wrong, pending, sitems.length, sid, admin.id],
  )

  // ensure answer present in DB snapshot but this is post-submit; pre-submit API strips answer
  const answerLeakInStem = pick.filter((p) => p.stem.includes('标准答案')).length

  await conn.query('DELETE FROM chem_train_sessions WHERE id=?', [sid])
  await conn.end()

  const out = {
    ok: true,
    adminFlow: 'pass',
    sessionItems: pick.length,
    correct,
    wrong,
    pending,
    pool: 'test',
    countsFormalStats: 0,
    answerLeakInStem,
    codes: pick.map((p) => p.code),
  }
  fs.writeFileSync(
    path.join(__dirname, 'admin_session_smoke.json'),
    JSON.stringify(out, null, 2) + '\n',
  )
  console.log(JSON.stringify(out, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
