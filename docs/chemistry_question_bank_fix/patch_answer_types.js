'use strict'
const path = require('path')
const fs = require('fs')
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
  })
  const codes = [
    'train.ai_trial.eq.write.02',
    'train.test.mem.blank.02',
    'train.test.eq.blank.01',
    'train.test.mem.blank.01',
  ]
  const [before] = await c.query(
    `SELECT code, answer_type FROM chem_train_items WHERE code IN (?,?,?,?)`,
    codes,
  )
  await c.query(
    `UPDATE chem_train_items SET answer_type='chem_formula'
     WHERE code IN (?,?,?,?) AND answer_type<>'chem_formula'`,
    codes,
  )
  const [after] = await c.query(
    `SELECT code, answer_type FROM chem_train_items WHERE code IN (?,?,?,?)`,
    codes,
  )
  console.log(JSON.stringify({ before, after }, null, 2))
  await c.end()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
