/**
 * Full read-only backup before AI trial publish.
 *   node docs/chemistry_trial_restore/backup.js
 */
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const OUT = __dirname

const KB_TABLES = {
  element: 'chem_elements',
  substance: 'chem_substances',
  reaction: 'chem_reactions',
  experiment: 'chem_experiments',
  formula: 'chem_formulas',
  concept: 'chem_concepts',
  knowledge: 'chem_knowledge_points',
  question: 'chem_questions',
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

function ser(row) {
  if (!row) return null
  const o = {}
  for (const [k, v] of Object.entries(row)) {
    if (v instanceof Date) o[k] = v.toISOString()
    else if (Buffer.isBuffer(v)) o[k] = v.toString('utf8')
    else o[k] = v
  }
  return o
}

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dir = path.join(OUT, `snapshot_${stamp}`)
  fs.mkdirSync(dir, { recursive: true })

  const kb = {}
  let kbTotal = 0
  let publishedBefore = []
  for (const [type, table] of Object.entries(KB_TABLES)) {
    const [rows] = await conn.query(`SELECT * FROM ${table} ORDER BY id`)
    kb[type] = rows.map(ser)
    kbTotal += rows.length
    for (const r of rows) {
      if (r.status === 'published') {
        publishedBefore.push({ type, id: String(r.id), row: ser(r) })
      }
    }
  }

  const [entitySpecs] = await conn.query(
    `SELECT * FROM chem_entity_specialties ORDER BY id`,
  )
  const [entityCats] = await conn.query(
    `SELECT * FROM chem_entity_categories ORDER BY id`,
  )
  const [species] = await conn.query(
    `SELECT * FROM chem_reaction_species ORDER BY id`,
  )
  const [specialties] = await conn.query(`SELECT * FROM chem_specialties ORDER BY id`)
  const [categories] = await conn.query(`SELECT * FROM chem_categories ORDER BY id`)

  const trainTables = [
    'chem_train_items',
    'chem_train_item_links',
    'chem_train_test_grants',
    'chem_train_sessions',
    'chem_train_session_items',
  ]
  const train = {}
  for (const t of trainTables) {
    const [rows] = await conn.query(`SELECT * FROM ${t} ORDER BY id`)
    train[t] = rows.map(ser)
  }

  await conn.end()

  const whitelist = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, 'docs/chemistry_deepseek_audit/publish_whitelist.json'),
      'utf8',
    ),
  )
  const invSrc = path.join(ROOT, 'docs/chemistry_kb_inventory.json')
  fs.copyFileSync(invSrc, path.join(dir, 'chemistry_kb_inventory.json'))
  fs.copyFileSync(
    path.join(ROOT, 'docs/chemistry_deepseek_audit/publish_whitelist.json'),
    path.join(dir, 'publish_whitelist.json'),
  )

  const manifest = {
    backedUpAt: new Date().toISOString(),
    readOnly: true,
    database: env.DB_NAME,
    kbTotal,
    publishedCount: publishedBefore.length,
    whitelistCount: (whitelist.items || []).length,
    trainCounts: Object.fromEntries(
      Object.entries(train).map(([k, v]) => [k, v.length]),
    ),
    linkCounts: {
      entity_specialties: entitySpecs.length,
      entity_categories: entityCats.length,
      reaction_species: species.length,
    },
  }

  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  fs.writeFileSync(path.join(dir, 'kb_all.json'), JSON.stringify(kb, null, 2) + '\n')
  fs.writeFileSync(
    path.join(dir, 'published_19_snapshot.json'),
    JSON.stringify({ count: publishedBefore.length, items: publishedBefore }, null, 2) + '\n',
  )
  fs.writeFileSync(
    path.join(dir, 'links.json'),
    JSON.stringify(
      {
        entity_specialties: entitySpecs.map(ser),
        entity_categories: entityCats.map(ser),
        reaction_species: species.map(ser),
        specialties: specialties.map(ser),
        categories: categories.map(ser),
      },
      null,
      2,
    ) + '\n',
  )
  fs.writeFileSync(path.join(dir, 'train.json'), JSON.stringify(train, null, 2) + '\n')

  // pointer to latest
  fs.writeFileSync(
    path.join(OUT, 'LATEST_SNAPSHOT.txt'),
    path.basename(dir) + '\n',
  )

  // status index for restore of 239
  const statusIndex = []
  for (const [type, rows] of Object.entries(kb)) {
    for (const r of rows) {
      statusIndex.push({
        type,
        id: String(r.id),
        status: r.status,
        review_note: r.review_note || '',
      })
    }
  }
  fs.writeFileSync(
    path.join(dir, 'kb_status_index.json'),
    JSON.stringify({ count: statusIndex.length, items: statusIndex }, null, 2) + '\n',
  )

  console.log(JSON.stringify({ dir: path.basename(dir), ...manifest }, null, 2))

  if (kbTotal !== 377 && kbTotal < 300) {
    console.error('WARN: unexpected kbTotal', kbTotal)
  }
  if (publishedBefore.length < 1) {
    console.error('WARN: no published rows found')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
