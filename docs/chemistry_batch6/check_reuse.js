/**
 * Batch6 reuse check. Run: node docs/chemistry_batch6/check_reuse.js
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
  const b6 = inv.batches.find((b) => b.id === 'batch6').items
  const hits = []
  for (const it of b6) {
    if (it.type === 'substance') {
      const [r] = await conn.query(
        `SELECT id,name,status,review_note FROM chem_substances WHERE name=? OR review_note LIKE ?`,
        [it.name, `%[inv:${it.code}]%`],
      )
      for (const row of r) hits.push({ code: it.code, type: 'substance', ...row })
    } else if (it.type === 'reaction') {
      const [r] = await conn.query(
        `SELECT id,name,status,canonical_equation,review_note FROM chem_reactions WHERE name=? OR review_note LIKE ?`,
        [it.name, `%[inv:${it.code}]%`],
      )
      for (const row of r) hits.push({ code: it.code, type: 'reaction', ...row })
    } else if (it.type === 'experiment') {
      const [r] = await conn.query(
        `SELECT id,name,status,review_note FROM chem_experiments WHERE name=? OR review_note LIKE ?`,
        [it.name, `%[inv:${it.code}]%`],
      )
      for (const row of r) hits.push({ code: it.code, type: 'experiment', ...row })
    } else if (it.type === 'concept') {
      const [r] = await conn.query(
        `SELECT id,name,status,review_note FROM chem_concepts WHERE name=? OR review_note LIKE ?`,
        [it.name, `%[inv:${it.code}]%`],
      )
      for (const row of r) hits.push({ code: it.code, type: 'concept', ...row })
    } else if (it.type === 'knowledge') {
      const [r] = await conn.query(
        `SELECT id,name,status,review_note FROM chem_knowledge_points WHERE (name=? AND parent_id IS NULL) OR review_note LIKE ?`,
        [it.name, `%[inv:${it.code}]%`],
      )
      for (const row of r) hits.push({ code: it.code, type: 'knowledge', ...row })
    } else if (it.type === 'question') {
      const [r] = await conn.query(
        `SELECT id,qtype,status,LEFT(stem,80) stem,review_note FROM chem_questions WHERE review_note LIKE ? OR (qtype IS NOT NULL AND review_note LIKE '%钠%' AND ?='q.eq.Na_water')`,
        [`%[inv:${it.code}]%`, it.code],
      )
      // also find seeded Na+water by name pattern
      if (it.code === 'q.eq.Na_water') {
        const [r2] = await conn.query(
          `SELECT id,qtype,status,LEFT(stem,80) stem,review_note FROM chem_questions WHERE stem LIKE '%钠%水%' OR review_note LIKE '%[inv:q.eq.Na_water]%' OR review_note LIKE '%阶段二%' LIMIT 5`,
        )
        for (const row of r2) hits.push({ code: it.code, type: 'question', ...row })
      }
      for (const row of r) hits.push({ code: it.code, type: 'question', ...row })
    }
  }
  // dedupe
  const key = (h) => `${h.code}:${h.id}`
  const uniq = []
  const seen = new Set()
  for (const h of hits) {
    const k = key(h)
    if (seen.has(k)) continue
    seen.add(k)
    uniq.push(h)
  }
  const out = {
    checkedAt: new Date().toISOString(),
    planned: 79,
    hits: uniq,
    reuseCodes: [...new Set(uniq.map((h) => h.code))],
    reuseCount: new Set(uniq.map((h) => h.code)).size,
  }
  fs.writeFileSync(path.join(__dirname, 'reuse_check.json'), JSON.stringify(out, null, 2))
  console.log(JSON.stringify({ reuseCount: out.reuseCount, reuseCodes: out.reuseCodes }, null, 2))
  await conn.end()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
