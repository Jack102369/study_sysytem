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
  const need = [
    'substance.usage',
    'substance.color',
    'substance.formula',
    'substance.chem_property',
    'substance.name',
    'memory.color',
    'memory.common_name',
    'memory.formula',
    'memory.phenomenon',
    'memory.rules',
    'calculation.molar_volume',
    'calculation.concentration',
    'calculation.amount',
    'periodic.trend',
    'periodic.elem_name',
    'experiment.phenomenon_judge',
    'experiment.safety',
    'redox.oxidant',
    'redox.reductant',
    'redox.identify',
    'redox.e_conserve',
    'equation.condition',
    'equation.true_false',
    'comprehensive.basic',
    'structure.atom_compose',
    'ion.electrolyte',
  ]
  const [rows] = await c.query(
    `SELECT CONCAT(s.code,'.',c.code) AS k FROM chem_categories c
     JOIN chem_specialties s ON s.id=c.specialty_id`,
  )
  const set = new Set(rows.map((r) => r.k))
  const missing = need.filter((k) => !set.has(k))
  console.log(JSON.stringify({ missing, totalCats: set.size }, null, 2))
  await c.end()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
