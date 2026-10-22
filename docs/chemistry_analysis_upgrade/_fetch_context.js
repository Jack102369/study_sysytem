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
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })
  const c = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample50_candidates.json'), 'utf8'))
  const ids = c.items.map((x) => x.id)
  const [rows] = await conn.query(
    `SELECT id, code, stem, options_json, answer, analysis, difficulty, qtype
     FROM chem_train_items WHERE id IN (?)`,
    [ids],
  )
  const [kps] = await conn.query(
    `SELECT * FROM chem_knowledge_points
     WHERE entity_code IN ('kp.Fe.test','kp.halogen.compare','kp.calc.solution','kp.calc.amount')
        OR entity_code LIKE 'kp.Fe%'
     LIMIT 20`,
  ).catch(async () => {
    const [cols] = await conn.query(`SHOW COLUMNS FROM chem_knowledge_points`)
    console.log('kp cols', cols.map((x) => x.Field).join(','))
    return [[]]
  })
  fs.writeFileSync(
    path.join(__dirname, '_db_snapshot50.json'),
    JSON.stringify({ rows, kps }, null, 2),
    'utf8',
  )
  console.log('rows', rows.length, 'kps', kps.length)
  const r48 = rows.find((x) => String(x.id) === '48')
  console.log('48 options', r48 && r48.options_json)
  await conn.end()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
