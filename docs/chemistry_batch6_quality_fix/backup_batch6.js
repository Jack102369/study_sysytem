/**
 * Backup Batch6 79 rows + links + import packs + inventory batch6 slice.
 * Read-only DB. Run: node docs/chemistry_batch6_quality_fix/backup_batch6.js
 */
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const OUT = __dirname
const B6 = path.join(ROOT, 'docs/chemistry_batch6')

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
  substance: 'chem_substances',
  reaction: 'chem_reactions',
  experiment: 'chem_experiments',
  concept: 'chem_concepts',
  knowledge: 'chem_knowledge_points',
  question: 'chem_questions',
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

  const inv = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs/chemistry_kb_inventory.json'), 'utf8'),
  )
  const b6 = inv.batches.find((b) => b.id === 'batch6')
  const results = JSON.parse(
    fs.readFileSync(path.join(B6, 'import_all_results.json'), 'utf8'),
  )
  const reuse = JSON.parse(
    fs.readFileSync(path.join(B6, 'reuse_check.json'), 'utf8'),
  )

  const backup = {
    backedUpAt: new Date().toISOString(),
    inventoryTotal: inv.batches.reduce((s, b) => s + b.items.length, 0),
    batch6Items: JSON.parse(JSON.stringify(b6.items)),
    batch6Build: inv.summary?.batch6Build || null,
    codeToEntity: results.codeToEntity,
    rows: {},
    links: {},
    priorSample: {},
  }

  for (const it of b6.items) {
    let id = results.codeToEntity[it.code]?.id || it.dbId
    if (it.code === 'q.eq.Na_water') {
      id = it.dbId || reuse.hits?.find((h) => h.code === it.code)?.id || id
    }
    if (!id) throw new Error('no id for ' + it.code)
    const table = TABLE[it.type]
    const [rows] = await conn.query(`SELECT * FROM ${table} WHERE id=?`, [id])
    const [specs] = await conn.query(
      `SELECT es.specialty_id, s.code FROM chem_entity_specialties es
       JOIN chem_specialties s ON s.id=es.specialty_id
       WHERE es.entity_type=? AND es.entity_id=?`,
      [it.type, id],
    )
    const [cats] = await conn.query(
      `SELECT ec.category_id, c.code AS cat_code, sp.code AS sp_code
       FROM chem_entity_categories ec
       JOIN chem_categories c ON c.id=ec.category_id
       JOIN chem_specialties sp ON sp.id=c.specialty_id
       WHERE ec.entity_type=? AND ec.entity_id=?`,
      [it.type, id],
    )
    let species = null
    if (it.type === 'reaction') {
      const [sp] = await conn.query(
        `SELECT * FROM chem_reaction_species WHERE reaction_id=? ORDER BY sort_order, id`,
        [id],
      )
      species = sp
    }
    backup.rows[it.code] = {
      type: it.type,
      table,
      id: String(id),
      before: rows[0] || null,
      species,
    }
    backup.links[it.code] = {
      specialties: specs.map((x) => ({
        id: String(x.specialty_id),
        code: x.code,
      })),
      categories: cats.map((x) => ({
        id: String(x.category_id),
        code: `${x.sp_code}.${x.cat_code}`,
      })),
    }
  }

  const [b5] = await conn.query(
    `SELECT id, status, LEFT(review_note,80) rn FROM chem_experiments WHERE review_note LIKE '%[inv:exp.instrument_basic]%' LIMIT 1`,
  )
  const [b4] = await conn.query(
    `SELECT id, status, LEFT(review_note,80) rn FROM chem_substances WHERE review_note LIKE '%[inv:sub.Cl2]%' LIMIT 1`,
  )
  backup.priorSample = { b5: b5[0] || null, b4: b4[0] || null }

  // copy import packs + content
  const packDir = path.join(OUT, 'backup_import_packs')
  fs.mkdirSync(packDir, { recursive: true })
  for (const f of fs.readdirSync(B6)) {
    if (
      f.startsWith('import_B6-') ||
      f === 'batch6_content.js' ||
      f === 'generate_summary.json' ||
      f === 'import_all_results.json' ||
      f === 'quality_audit_map.json'
    ) {
      fs.copyFileSync(path.join(B6, f), path.join(packDir, f))
    }
  }
  fs.copyFileSync(
    path.join(ROOT, 'docs/chemistry_kb_inventory.json'),
    path.join(OUT, 'backup_inventory_before.json'),
  )

  const outFile = path.join(OUT, 'backup_before_b6_remediate.json')
  fs.writeFileSync(outFile, JSON.stringify(backup, null, 2) + '\n')
  console.log(
    JSON.stringify(
      {
        outFile,
        codes: Object.keys(backup.rows).length,
        inventoryTotal: backup.inventoryTotal,
        priorOk: !!(backup.priorSample.b5 && backup.priorSample.b4),
        naWater: {
          id: backup.rows['q.eq.Na_water']?.id,
          status: backup.rows['q.eq.Na_water']?.before?.status,
        },
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
