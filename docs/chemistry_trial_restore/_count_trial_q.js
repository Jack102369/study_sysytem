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
  const [rows] = await c.query(`
    SELECT s.code sc, c.code cc, COUNT(*) n
    FROM chem_train_items i
    JOIN chem_specialties s ON s.id=i.specialty_id
    JOIN chem_categories c ON c.id=i.category_id
    WHERE i.code LIKE 'train.ai_trial.%'
    GROUP BY s.code, c.code
    ORDER BY s.code, c.code`)
  console.log(JSON.stringify(rows, null, 2))
  await c.end()
})()
