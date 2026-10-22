'use strict'
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

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    multipleStatements: true,
  })
  const sql = fs.readFileSync(
    path.join(ROOT, 'db/migrate_chemistry_wrong_question_phase1.sql'),
    'utf8',
  )
  await conn.query(sql)
  const [t] = await conn.query("SHOW TABLES LIKE 'chem_wrong%'")
  console.log('tables', t)
  await conn.end()
  console.log('migration_ok')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
