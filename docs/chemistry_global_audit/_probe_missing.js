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
const TABLE = {
  element: 'chem_elements',
  substance: 'chem_substances',
  reaction: 'chem_reactions',
  experiment: 'chem_experiments',
  formula: 'chem_formulas',
  concept: 'chem_concepts',
  knowledge: 'chem_knowledge_points',
  question: 'chem_questions',
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
  const missing = [
    'el.H',
    'el.O',
    'el.Na',
    'el.Cl',
    'concept.redox',
    'formula.n_m_M',
    'kp.redox',
    'sub.Na',
    'rxn.2Na_2H2O',
    'exp.Na_H2O',
  ]
  const inv = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs/chemistry_kb_inventory.json'), 'utf8'),
  )
  for (const code of missing) {
    let it = null
    for (const b of inv.batches) {
      it = b.items.find((x) => x.code === code)
      if (it) break
    }
    const table = TABLE[it.type]
    const [byInv] = await c.query(
      `SELECT id, status, LEFT(review_note,80) rn FROM ${table} WHERE review_note LIKE ? LIMIT 3`,
      [`%[inv:${code}]%`],
    )
    const [byName] = await c.query(
      it.type === 'question'
        ? `SELECT id, status FROM ${table} LIMIT 0`
        : `SELECT id, status, name FROM ${table} WHERE name=? LIMIT 3`,
      it.type === 'question' ? [] : [it.name],
    )
    console.log(
      JSON.stringify({
        code,
        invDbId: it.dbId,
        status: it.status,
        byInv,
        byName,
      }),
    )
  }
  await c.end()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
