'use strict'
const fs = require('fs')
const path = require('path')
const ROOT = path.resolve(__dirname, '../..')
const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
const { parseModelIdFromGateNote } = require(path.join(
  ROOT,
  'apps/api/dist/chemistry/train/chem-variation-match.util.js',
))

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
  })
  const [rows] = await conn.query(
    `SELECT id, code, category_id, specialty_id, gate_note,
            (SELECT COUNT(*) FROM chem_train_item_links l WHERE l.item_id=i.id) AS link_n
     FROM chem_train_items i
     WHERE code LIKE 'train.ai_trial.s60.%' AND status='approved' AND is_active=1
     ORDER BY id ASC LIMIT 20`,
  )
  for (const r of rows) {
    console.log({
      id: r.id,
      code: r.code,
      cat: r.category_id,
      links: r.link_n,
      model: parseModelIdFromGateNote(r.gate_note),
      gate: String(r.gate_note || '').slice(0, 180),
    })
  }
  const [[cnt]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE gate_note LIKE '%model=ADV%'`,
  )
  console.log('with_model_tag', cnt)
  await conn.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
