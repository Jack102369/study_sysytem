/** Fetch current DB rows for final decision doc. No writes. */
const fs = require('fs')
const path = require('path')
const ROOT = path.resolve(__dirname, '../..')
const envPath = path.join(ROOT, 'apps/api/.env')

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
  const env = loadEnv(envPath)
  let mysql
  try {
    mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  } catch {
    mysql = require('mysql2/promise')
  }
  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })

  const [els] = await conn.query(
    `SELECT id, symbol, name_zh, common_valences, atom_structure, electron_config,
            common_compounds, key_properties, common_uses, atomic_mass, status, review_note
     FROM chem_elements
     WHERE symbol IN ('O','Cl','Na','Be','Ar','Fe','I','Cr')
     ORDER BY FIELD(symbol,'O','Cl','Na','Be','Ar','Fe','I','Cr')`,
  )
  const [kps] = await conn.query(
    `SELECT id, name, description, difficulty, importance, status, review_note, parent_id
     FROM chem_knowledge_points
     WHERE name='氧化还原反应' AND parent_id IS NULL`,
  )

  // related links for impact analysis
  const [oLinks] = await conn.query(
    `SELECT 'kp' t, id, name FROM chem_knowledge_points WHERE description LIKE '%过氧化物%' OR description LIKE '%Na2O2%' OR name LIKE '%氧%' LIMIT 20`,
  )
  const [subs] = await conn.query(
    `SELECT id, name, canonical_formula, status FROM chem_substances
     WHERE canonical_formula IN ('Na2O2','O2','Cl2','Na','NaOH','NaCl') OR name LIKE '%氯%' OR name LIKE '%氧%'
     LIMIT 30`,
  )

  const out = {
    fetchedAt: new Date().toISOString(),
    elements: els,
    kp_redox: kps[0] || null,
    relatedSubstances: subs,
  }
  fs.writeFileSync(path.join(__dirname, 'decision_snapshot.json'), JSON.stringify(out, null, 2), 'utf8')
  console.log(JSON.stringify({ elementCount: els.length, kp: !!kps[0], symbols: els.map((e) => e.symbol) }, null, 2))
  await conn.end()
}

main().catch((e) => {
  console.error(String(e && e.stack ? e.stack : e))
  process.exit(1)
})
