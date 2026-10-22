/** Fetch seeded Batch3 entities from DB for quality review. Read-only. */
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
  const [subs] = await c.query(
    `SELECT id, name, canonical_formula, common_names, color, state_label, solubility,
            physical_props, chemical_props, common_uses, storage_methods, safety_notes, status
     FROM chem_substances WHERE name IN ('钠','氢氧化钠','氢气','水')`,
  )
  const [rx] = await c.query(
    `SELECT id, name, canonical_equation, equation, ionic_equation, conditions, phenomenon,
            principle, oxidant, reductant, ox_product, re_product, electron_transfer, status
     FROM chem_reactions WHERE canonical_equation='2Na+2H2O=2NaOH+H2'`,
  )
  const [exp] = await c.query(
    `SELECT id, name, purpose, principle, steps, phenomenon, conclusion, precautions,
            safety_notes, is_hazardous, status
     FROM chem_experiments WHERE name='钠与水的反应'`,
  )
  const [kp] = await c.query(
    `SELECT id, name, description, status FROM chem_knowledge_points WHERE name='钠的化学性质' AND parent_id IS NULL`,
  )
  const out = { substances: subs, reaction: rx[0], experiment: exp[0], knowledge: kp[0] }
  fs.writeFileSync(path.join(__dirname, 'quality_seeded_db.json'), JSON.stringify(out, null, 2))
  console.log('ok', { subs: subs.length, rx: !!rx[0], exp: !!exp[0], kp: !!kp[0] })
  await c.end()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
