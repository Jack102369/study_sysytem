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
  const [concepts] = await c.query(
    `SELECT id, name, status, review_note FROM chem_concepts
     WHERE name LIKE '%守恒%' OR review_note LIKE '%conserve%' OR review_note LIKE '%[inv:concept.%'`,
  )
  const [subs] = await c.query(
    `SELECT id, name, canonical_formula, status, review_note FROM chem_substances
     WHERE canonical_formula='H2O' OR name IN ('水','氢气','氧气')`,
  )
  const [kps] = await c.query(
    `SELECT id, name, status, review_note FROM chem_knowledge_points
     WHERE name LIKE '%守恒%' OR review_note LIKE '%e_conserve%' OR review_note LIKE '%mass%'`,
  )
  console.log(JSON.stringify({ concepts, subs, kps }, null, 2))

  const backups = fs
    .readdirSync(__dirname)
    .filter((d) => d.startsWith('backup_'))
    .sort()
  const latest = backups[backups.length - 1]
  const noLink = JSON.parse(
    fs.readFileSync(path.join(__dirname, latest, 'no_link_25.json'), 'utf8'),
  )
  for (const r of noLink) {
    console.log('---', r.code)
    console.log((r.stem || '').slice(0, 100))
    console.log('ans=', r.answer, 'atype=', r.answer_type)
  }
  await c.end()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
