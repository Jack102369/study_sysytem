'use strict'
/**
 * Grant personal chem AI-trial to all non-disabled USER accounts (not ADMIN),
 * then print verification stats.
 *   node docs/chemistry_personal_open/grant_and_verify.js
 */
const fs = require('fs')
const path = require('path')
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

;(async () => {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const c = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })

  const [users] = await c.query(
    `SELECT id, email, nickname, role, is_disabled FROM users ORDER BY id`,
  )
  const [admins] = await c.query(
    `SELECT id FROM users WHERE role='ADMIN' AND is_disabled=0 ORDER BY id LIMIT 1`,
  )
  const grantedBy = admins[0] ? String(admins[0].id) : null

  // Only grant existing non-disabled USER accounts (explicit personal open; not role-default)
  const targets = users.filter((u) => u.role === 'USER' && !u.is_disabled)
  const granted = []
  for (const u of targets) {
    await c.query(
      `INSERT INTO chem_train_test_grants (user_id, note, granted_by)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE note=VALUES(note), granted_by=VALUES(granted_by)`,
      [u.id, 'personal_chem_ai_trial_open_2026-10-19', grantedBy],
    )
    granted.push({ id: String(u.id), email: u.email, nickname: u.nickname })
  }

  const [[{ total }]] = await c.query(`SELECT COUNT(1) AS total FROM chem_train_items`)
  const [[{ active }]] = await c.query(
    `SELECT COUNT(1) AS active FROM chem_train_items WHERE is_active=1`,
  )
  const [[{ trialAllow }]] = await c.query(
    `SELECT COUNT(1) AS trialAllow FROM chem_train_items
     WHERE pool='test' AND status='approved' AND is_active=1
       AND gate_note LIKE '%[trial_access:allow]%'
       AND gate_note NOT LIKE '%[trial_access:block]%'`,
  )
  const [[{ trialBlock }]] = await c.query(
    `SELECT COUNT(1) AS trialBlock FROM chem_train_items
     WHERE gate_note LIKE '%[trial_access:block]%' OR is_active=0`,
  )
  const [[{ fillerLeft }]] = await c.query(
    `SELECT COUNT(1) AS fillerLeft FROM chem_train_items WHERE code LIKE 'train.ai_trial.cov.%'`,
  )
  const [[{ sessions }]] = await c.query(`SELECT COUNT(1) AS sessions FROM chem_train_sessions`)
  const [[{ sessionItems }]] = await c.query(
    `SELECT COUNT(1) AS sessionItems FROM chem_train_session_items`,
  )
  const [bySpec] = await c.query(
    `SELECT s.code, s.name, COUNT(*) AS n
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     WHERE i.pool='test' AND i.status='approved' AND i.is_active=1
       AND i.gate_note LIKE '%[trial_access:allow]%'
       AND i.gate_note NOT LIKE '%[trial_access:block]%'
     GROUP BY s.id, s.code, s.name
     ORDER BY s.sort_order, s.id`,
  )
  const [byCat] = await c.query(
    `SELECT s.code AS specialty_code, c.code AS category_code, c.name AS category_name, COUNT(*) AS n
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id
     WHERE i.pool='test' AND i.status='approved' AND i.is_active=1
       AND i.gate_note LIKE '%[trial_access:allow]%'
       AND i.gate_note NOT LIKE '%[trial_access:block]%'
     GROUP BY s.code, c.code, c.name, s.sort_order, c.sort_order
     ORDER BY s.sort_order, c.sort_order`,
  )
  const [[{ specsWith }] ] = await c.query(
    `SELECT COUNT(DISTINCT specialty_id) AS specsWith FROM chem_train_items
     WHERE pool='test' AND status='approved' AND is_active=1
       AND gate_note LIKE '%[trial_access:allow]%'
       AND gate_note NOT LIKE '%[trial_access:block]%'`,
  )
  const [[{ catsWith }]] = await c.query(
    `SELECT COUNT(DISTINCT category_id) AS catsWith FROM chem_train_items
     WHERE pool='test' AND status='approved' AND is_active=1
       AND gate_note LIKE '%[trial_access:allow]%'
       AND gate_note NOT LIKE '%[trial_access:block]%'`,
  )
  const [[{ totalSpecs }]] = await c.query(`SELECT COUNT(1) AS totalSpecs FROM chem_specialties`)
  const [[{ totalCats }]] = await c.query(`SELECT COUNT(1) AS totalCats FROM chem_categories`)
  const [grants] = await c.query(
    `SELECT g.user_id, u.email, u.nickname, u.role, g.note
     FROM chem_train_test_grants g JOIN users u ON u.id=g.user_id`,
  )

  const out = {
    users: users.map((u) => ({
      id: String(u.id),
      email: u.email,
      nickname: u.nickname,
      role: u.role,
      is_disabled: !!u.is_disabled,
    })),
    granted,
    grants,
    remainingTotal: Number(total),
    activeItems: Number(active),
    personalTrainable: Number(trialAllow),
    trialBlockOrInactive: Number(trialBlock),
    fillerRemaining: Number(fillerLeft),
    sessions: Number(sessions),
    sessionItems: Number(sessionItems),
    specialtiesTotal: Number(totalSpecs),
    specialtiesWithTrainable: Number(specsWith),
    categoriesTotal: Number(totalCats),
    categoriesWithTrainable: Number(catsWith),
    bySpecialty: bySpec,
    byCategory: byCat,
  }
  fs.writeFileSync(
    path.join(__dirname, 'verify_result.json'),
    JSON.stringify(out, null, 2),
  )
  console.log(JSON.stringify(out, null, 2))
  await c.end()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
