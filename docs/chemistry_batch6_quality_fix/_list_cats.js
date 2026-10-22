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
  const [cats] = await c.query(
    `SELECT code FROM chem_categories WHERE code LIKE 'organic.%' OR code LIKE 'equation.%' OR code LIKE 'redox.%' OR code LIKE 'ion.%' OR code LIKE 'comprehensive.%' OR code LIKE 'calculation.%' OR code LIKE 'experiment.%' ORDER BY code`,
  )
  console.log(cats.map((x) => x.code).join('\n'))
  await c.end()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
