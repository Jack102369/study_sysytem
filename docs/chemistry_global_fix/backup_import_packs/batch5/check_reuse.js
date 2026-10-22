/**
 * Batch5 reuse check against DB by name / inv code.
 * Run: node docs/chemistry_batch5/check_reuse.js
 */
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

  const inv = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs/chemistry_kb_inventory.json'), 'utf8'),
  )
  const b5 = inv.batches.find((b) => b.id === 'batch5').items
  const hits = []

  for (const it of b5) {
    if (it.type === 'experiment') {
      const [r] = await conn.query(
        `SELECT id, name, status, review_note FROM chem_experiments WHERE name=? OR review_note LIKE ?`,
        [it.name, `%[inv:${it.code}]%`],
      )
      for (const row of r) hits.push({ code: it.code, type: 'experiment', ...row })
    } else if (it.type === 'formula') {
      const [r] = await conn.query(
        `SELECT id, name, status, expression, review_note FROM chem_formulas WHERE name=? OR review_note LIKE ?`,
        [it.name, `%[inv:${it.code}]%`],
      )
      for (const row of r) hits.push({ code: it.code, type: 'formula', ...row })
    } else if (it.type === 'knowledge') {
      const [r] = await conn.query(
        `SELECT id, name, status, review_note FROM chem_knowledge_points WHERE (name=? AND parent_id IS NULL) OR review_note LIKE ?`,
        [it.name, `%[inv:${it.code}]%`],
      )
      for (const row of r) hits.push({ code: it.code, type: 'knowledge', ...row })
    } else if (it.type === 'concept') {
      const [r] = await conn.query(
        `SELECT id, name, status, review_note FROM chem_concepts WHERE name=? OR review_note LIKE ?`,
        [it.name, `%[inv:${it.code}]%`],
      )
      for (const row of r) hits.push({ code: it.code, type: 'concept', ...row })
    } else if (it.type === 'question') {
      const [r] = await conn.query(
        `SELECT id, qtype, status, LEFT(stem,60) AS stem, review_note FROM chem_questions WHERE review_note LIKE ?`,
        [`%[inv:${it.code}]%`],
      )
      for (const row of r) hits.push({ code: it.code, type: 'question', ...row })
    }
  }

  const out = {
    checkedAt: new Date().toISOString(),
    planned: b5.length,
    dbHits: hits,
    reuseCount: hits.length,
    note: 'reuseCount>0 means skip create or link existing; Batch5 expected 0 before first import',
  }
  fs.writeFileSync(
    path.join(__dirname, 'reuse_check.json'),
    JSON.stringify(out, null, 2) + '\n',
    'utf8',
  )
  console.log(JSON.stringify({ reuseCount: hits.length, planned: b5.length }, null, 2))
  await conn.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
