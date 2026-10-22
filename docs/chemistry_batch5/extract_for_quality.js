/** Extract Batch5 42 items for quality review. Read-only. */
'use strict'
const fs = require('fs')
const path = require('path')

const dir = __dirname
const ROOT = path.resolve(__dirname, '../..')
const inv = JSON.parse(
  fs.readFileSync(path.join(dir, '..', 'chemistry_kb_inventory.json'), 'utf8'),
)
const batch5 = inv.batches.find((b) => b.id === 'batch5')
const results = JSON.parse(
  fs.readFileSync(path.join(dir, 'import_all_results.json'), 'utf8'),
)
const packs = ['B5-A', 'B5-B', 'B5-C', 'B5-D', 'B5-E']
const byCode = {}
for (const pack of packs) {
  const payload = JSON.parse(
    fs.readFileSync(path.join(dir, `import_${pack}.json`), 'utf8'),
  )
  const codes = payload.meta.inventoryCodes
  payload.items.forEach((item, i) => {
    const code = codes[i]
    byCode[code] = {
      code,
      type: item.type,
      data: item.data,
      pack,
      specialtyCodes: payload.meta.specialtyByCode[code] || [],
      categoryCodes: payload.meta.categoryByCode[code] || [],
      dbId: results.codeToEntity[code]?.id || null,
      source: 'imported',
    }
  })
}

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

  const tableOf = {
    experiment: 'chem_experiments',
    formula: 'chem_formulas',
    knowledge: 'chem_knowledge_points',
    question: 'chem_questions',
    concept: 'chem_concepts',
  }

  const items = []
  for (const it of batch5.items) {
    const base = byCode[it.code]
    if (!base) throw new Error('missing pack data ' + it.code)
    const table = tableOf[it.type]
    const [rows] = await conn.query(
      `SELECT id, status, review_note FROM ${table} WHERE id=?`,
      [base.dbId],
    )
    const [specs] = await conn.query(
      `SELECT s.code FROM chem_entity_specialties es
       JOIN chem_specialties s ON s.id=es.specialty_id
       WHERE es.entity_type=? AND es.entity_id=?`,
      [it.type, base.dbId],
    )
    items.push({
      ...base,
      inventoryName: it.name,
      inventoryStatus: it.status,
      note: it.note,
      verifyNeeded: !!it.verifyNeeded,
      dbStatus: rows[0]?.status || null,
      dbReviewNote: rows[0]?.review_note || null,
      dbSpecialtyCodes: specs.map((s) => s.code),
    })
  }

  const out = {
    extractedAt: new Date().toISOString(),
    total: items.length,
    readOnly: true,
    items,
  }
  fs.writeFileSync(
    path.join(dir, 'quality_extract.json'),
    JSON.stringify(out, null, 2) + '\n',
  )
  console.log(
    JSON.stringify(
      {
        total: out.total,
        withData: items.filter((i) => i.data).length,
        allPending: items.every((i) => i.dbStatus === 'pending_review'),
        published: items.filter((i) => i.dbStatus === 'published').length,
      },
      null,
      2,
    ),
  )
  await conn.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
