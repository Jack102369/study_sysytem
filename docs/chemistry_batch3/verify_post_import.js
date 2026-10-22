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
  const [na] = await c.query(
    `SELECT status, oxidant, reductant, ox_product, re_product FROM chem_reactions WHERE canonical_equation=?`,
    ['2Na+2H2O=2NaOH+H2'],
  )
  const [subs] = await c.query(
    `SELECT COUNT(*) AS n FROM chem_substances WHERE review_note LIKE '%[inv:sub.%' AND status='pending_review'`,
  )
  const [rxns] = await c.query(
    `SELECT COUNT(*) AS n FROM chem_reactions WHERE review_note LIKE '%[inv:rxn.%' AND status='pending_review'`,
  )
  const [exps] = await c.query(
    `SELECT COUNT(*) AS n FROM chem_experiments WHERE review_note LIKE '%[inv:exp.%' AND status='pending_review'`,
  )
  const [kps] = await c.query(
    `SELECT COUNT(*) AS n FROM chem_knowledge_points WHERE review_note LIKE '%[inv:kp.%' AND status='pending_review'`,
  )
  const [cons] = await c.query(
    `SELECT COUNT(*) AS n FROM chem_concepts WHERE review_note LIKE '%[inv:concept.alloy]%' AND status='pending_review'`,
  )
  const out = {
    naWater: na[0],
    pendingReviewApprox: {
      substances: subs[0].n,
      reactions: rxns[0].n,
      experiments: exps[0].n,
      knowledge: kps[0].n,
      conceptAlloy: cons[0].n,
    },
  }
  fs.writeFileSync(path.join(__dirname, 'verify_post_import.json'), JSON.stringify(out, null, 2))
  console.log(JSON.stringify(out, null, 2))
  await c.end()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
