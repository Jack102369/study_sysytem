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
;(async () => {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  const c = await mysql.createConnection({
    host: env.DB_HOST,
    port: +env.DB_PORT || 3306,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  })
  const [[admin]] = await c.query(
    "SELECT id, email, role FROM users WHERE role='ADMIN' AND is_disabled=0 LIMIT 1",
  )
  const [items] = await c.query(
    `SELECT COUNT(*) n, pool, status, is_active FROM chem_train_items GROUP BY pool, status, is_active`,
  )
  const [trial] = await c.query(
    `SELECT s.code sc, c.code cc, i.difficulty, COUNT(*) n
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id
     WHERE i.code LIKE 'train.ai_trial.%' OR i.code LIKE 'train.test.%'
     GROUP BY s.code, c.code, i.difficulty ORDER BY s.code, c.code`,
  )
  const [eqBal] = await c.query(
    `SELECT i.code, i.pool, i.status, i.is_active, i.difficulty
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id
     WHERE s.code='equation' AND c.code='balance'`,
  )
  const [eqTf] = await c.query(
    `SELECT i.code, i.pool, i.status, i.is_active, i.difficulty
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id
     WHERE s.code='equation' AND c.code='true_false' LIMIT 5`,
  )
  console.log(
    JSON.stringify({ admin, items, trial, eqBalance: eqBal, eqTrueFalseSample: eqTf }, null, 2),
  )
  await c.end()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
