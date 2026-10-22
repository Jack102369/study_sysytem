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
  const formulas = ['H2O', 'CO2', 'H2SO4', 'Ca(OH)2', 'NaCl', 'O', 'NaOH', 'Fe2O3']
  const [r] = await c.query(
    `UPDATE chem_train_items SET answer_type='chem_formula'
     WHERE qtype='blank' AND (answer IN (?) OR stem LIKE '%化学式%')`,
    [formulas],
  )
  const [rows] = await c.query(
    `SELECT code, answer FROM chem_train_items WHERE answer_type='chem_formula' ORDER BY id`,
  )
  console.log(JSON.stringify({ affected: r.affectedRows, count: rows.length, rows }, null, 2))
  await c.end()
})()
