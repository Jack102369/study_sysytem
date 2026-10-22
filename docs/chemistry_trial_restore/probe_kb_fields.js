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
  const [subs] = await c.query(
    `SELECT id, name, canonical_formula, common_names, color, state_label,
            chemical_props, common_uses, physical_props
     FROM chem_substances WHERE review_note LIKE '%[ai_trial]%' LIMIT 4`,
  )
  const [rx] = await c.query(
    `SELECT id, name, equation, conditions, oxidant, reductant, phenomenon, train_types
     FROM chem_reactions WHERE review_note LIKE '%[ai_trial]%' LIMIT 4`,
  )
  const [kp] = await c.query(
    `SELECT id, name, description FROM chem_knowledge_points
     WHERE review_note LIKE '%[ai_trial]%' LIMIT 4`,
  )
  const [cats] = await c.query(
    `SELECT s.code AS sc, c.code AS cc, c.name AS cn
     FROM chem_categories c JOIN chem_specialties s ON s.id=c.specialty_id
     WHERE s.code IN ('substance','equation','redox','memory','ion')
     ORDER BY s.code, c.sort_order LIMIT 40`,
  )
  console.log(JSON.stringify({ subs, rx, kp, cats }, null, 2))
  await c.end()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
