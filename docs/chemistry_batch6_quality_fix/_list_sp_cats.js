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
async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  const c = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })
  const [rows] = await c.query(
    `SELECT s.code AS sp, c.code AS cat
     FROM chem_categories c
     JOIN chem_specialties s ON s.id=c.specialty_id
     WHERE s.code IN ('organic','equation','redox','experiment','comprehensive','calculation','memory','structure','substance')
       AND c.is_active=1
     ORDER BY s.code, c.code`,
  )
  const by = {}
  for (const r of rows) {
    ;(by[r.sp] = by[r.sp] || []).push(r.cat)
  }
  console.log(JSON.stringify(by, null, 2))
  await c.end()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
