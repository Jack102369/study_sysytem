/**
 * Global extract: 377 inventory codes → DB rows + links. READ-ONLY.
 * Batch-loads tables then matches (fast). Includes seeded fallbacks.
 * node docs/chemistry_global_audit/extract_global.js
 */
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const OUT = __dirname

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
  const maps = []
  for (const b of ['batch2', 'batch3', 'batch4', 'batch5', 'batch6']) {
    const p = path.join(ROOT, `docs/chemistry_${b}/import_all_results.json`)
    if (fs.existsSync(p)) {
      maps.push(JSON.parse(fs.readFileSync(p, 'utf8')).codeToEntity || {})
    }
  }

  // preload all tables
  const byTypeRows = {}
  const phys = {}
  for (const [type, table] of Object.entries(TABLE)) {
    const [rows] = await conn.query(`SELECT * FROM ${table}`)
    byTypeRows[type] = rows
    phys[type] = rows.length
  }

  // indexes
  const byId = {}
  const byInv = {}
  const byName = {}
  const bySymbol = {}
  for (const [type, rows] of Object.entries(byTypeRows)) {
    byId[type] = new Map()
    byInv[type] = new Map()
    byName[type] = new Map()
    for (const row of rows) {
      byId[type].set(String(row.id), row)
      const note = String(row.review_note || '')
      const m = note.match(/\[inv:([^\]]+)\]/g)
      if (m) {
        for (const tag of m) {
          const code = tag.slice(5, -1)
          if (!byInv[type].has(code)) byInv[type].set(code, row)
        }
      }
      if (row.name != null) {
        const k = String(row.name)
        if (!byName[type].has(k)) byName[type].set(k, [])
        byName[type].get(k).push(row)
      }
      if (type === 'element' && row.symbol) {
        bySymbol[String(row.symbol)] = row
      }
    }
  }

  // links preload
  const [specLinks] = await conn.query(
    `SELECT es.entity_type, es.entity_id, s.code
     FROM chem_entity_specialties es
     JOIN chem_specialties s ON s.id=es.specialty_id`,
  )
  const [catLinks] = await conn.query(
    `SELECT ec.entity_type, ec.entity_id, CONCAT(sp.code,'.',c.code) AS code
     FROM chem_entity_categories ec
     JOIN chem_categories c ON c.id=ec.category_id
     JOIN chem_specialties sp ON sp.id=c.specialty_id`,
  )
  const specMap = new Map()
  const catMap = new Map()
  for (const r of specLinks) {
    const k = `${r.entity_type}:${r.entity_id}`
    if (!specMap.has(k)) specMap.set(k, [])
    specMap.get(k).push(r.code)
  }
  for (const r of catLinks) {
    const k = `${r.entity_type}:${r.entity_id}`
    if (!catMap.has(k)) catMap.set(k, [])
    catMap.get(k).push(r.code)
  }

  const [speciesRows] = await conn.query(
    `SELECT reaction_id, role, formula, coefficient, state_symbol FROM chem_reaction_species ORDER BY sort_order, id`,
  )
  const speciesByRxn = new Map()
  for (const r of speciesRows) {
    const id = String(r.reaction_id)
    if (!speciesByRxn.has(id)) speciesByRxn.set(id, [])
    speciesByRxn.get(id).push(r)
  }
  const [rxnTags] = await conn.query(`SELECT reaction_id, tag FROM chem_reaction_tags`)
  const [subTags] = await conn.query(`SELECT substance_id, tag FROM chem_substance_tags`)
  const tagsRxn = new Map()
  const tagsSub = new Map()
  for (const r of rxnTags) {
    const id = String(r.reaction_id)
    if (!tagsRxn.has(id)) tagsRxn.set(id, [])
    tagsRxn.get(id).push(r.tag)
  }
  for (const r of subTags) {
    const id = String(r.substance_id)
    if (!tagsSub.has(id)) tagsSub.set(id, [])
    tagsSub.get(id).push(r.tag)
  }

  function resolveRow(it) {
    // 1 map/dbId
    if (it.dbId && byId[it.type]?.has(String(it.dbId))) {
      return { row: byId[it.type].get(String(it.dbId)), method: 'dbId' }
    }
    for (const m of maps) {
      const id = m[it.code]?.id
      if (id && byId[it.type]?.has(String(id))) {
        return { row: byId[it.type].get(String(id)), method: 'import_map' }
      }
    }
    // 2 inv tag
    if (byInv[it.type]?.has(it.code)) {
      return { row: byInv[it.type].get(it.code), method: 'inv_tag' }
    }
    // 3 element symbol
    if (it.type === 'element') {
      const sym = it.code.replace(/^el\./, '')
      if (bySymbol[sym]) return { row: bySymbol[sym], method: 'symbol' }
    }
    // 4 unique name
    if (it.name && byName[it.type]?.has(it.name)) {
      const list = byName[it.type].get(it.name)
      if (list.length === 1) return { row: list[0], method: 'unique_name' }
      // seeded preference: published first
      const pub = list.find((r) => r.status === 'published')
      if (pub) return { row: pub, method: 'name_published' }
      return { row: list[0], method: 'name_first' }
    }
    // 5 special Na water question
    if (it.code === 'q.eq.Na_water') {
      const q = byTypeRows.question.find((r) => /钠/.test(r.stem || '') && /水/.test(r.stem || ''))
      if (q) return { row: q, method: 'stem_match' }
    }
    return { row: null, method: null }
  }

  const items = []
  for (const batch of inv.batches) {
    for (const it of batch.items) {
      const { row: db, method } = resolveRow(it)
      const id = db ? String(db.id) : null
      const linkKey = id ? `${it.type}:${id}` : null
      items.push({
        code: it.code,
        batch: batch.id,
        type: it.type,
        name: it.name,
        inventoryStatus: it.status,
        inventoryNote: it.note || '',
        verifyNeeded: !!it.verifyNeeded,
        curriculumScope: it.curriculumScope || null,
        priority: it.priority ?? null,
        specialtyCodes: it.specialtyCodes || [],
        categoryCodes: it.categoryCodes || [],
        dbId: id,
        resolveMethod: method,
        dbExists: !!db,
        dbStatus: db?.status || null,
        dbReviewNote: db?.review_note ?? null,
        hasInvTag: db
          ? String(db.review_note || '').includes(`[inv:${it.code}]`)
          : false,
        dbSpecialtyCodes: linkKey ? specMap.get(linkKey) || [] : [],
        dbCategoryCodes: linkKey ? catMap.get(linkKey) || [] : [],
        dbRow: db,
        species: it.type === 'reaction' && id ? speciesByRxn.get(id) || [] : null,
        tags:
          it.type === 'reaction' && id
            ? tagsRxn.get(id) || []
            : it.type === 'substance' && id
              ? tagsSub.get(id) || []
              : null,
      })
    }
  }

  const [allSpecs] = await conn.query(
    `SELECT code FROM chem_specialties WHERE is_active=1 ORDER BY sort_order, id`,
  )
  const [allCats] = await conn.query(
    `SELECT CONCAT(s.code,'.',c.code) AS code, s.code AS specialty
     FROM chem_categories c
     JOIN chem_specialties s ON s.id=c.specialty_id
     WHERE c.is_active=1
     ORDER BY s.sort_order, c.sort_order, c.id`,
  )
  const [specUsage] = await conn.query(
    `SELECT s.code, COUNT(*) AS n FROM chem_entity_specialties es
     JOIN chem_specialties s ON s.id=es.specialty_id GROUP BY s.code`,
  )
  const [catUsage] = await conn.query(
    `SELECT CONCAT(sp.code,'.',c.code) AS code, COUNT(*) AS n
     FROM chem_entity_categories ec
     JOIN chem_categories c ON c.id=ec.category_id
     JOIN chem_specialties sp ON sp.id=c.specialty_id
     GROUP BY CONCAT(sp.code,'.',c.code)`,
  )

  const out = {
    extractedAt: new Date().toISOString(),
    readOnly: true,
    inventoryTotal: items.length,
    physicalCounts: phys,
    physicalTotal: Object.values(phys).reduce((a, b) => a + b, 0),
    specialties: allSpecs.map((s) => s.code),
    categories: allCats.map((c) => ({ code: c.code, specialty: c.specialty })),
    specialtyUsage: Object.fromEntries(specUsage.map((r) => [r.code, Number(r.n)])),
    categoryUsage: Object.fromEntries(catUsage.map((r) => [r.code, Number(r.n)])),
    items,
  }

  fs.writeFileSync(path.join(OUT, 'extract.json'), JSON.stringify(out, null, 2) + '\n')
  const missing = items.filter((i) => !i.dbExists)
  const resolveStats = {}
  for (const i of items) {
    const m = i.resolveMethod || 'NONE'
    resolveStats[m] = (resolveStats[m] || 0) + 1
  }
  console.log(
    JSON.stringify(
      {
        inventoryTotal: out.inventoryTotal,
        physicalTotal: out.physicalTotal,
        covered: items.length - missing.length,
        missing: missing.length,
        missingCodes: missing.map((m) => m.code),
        resolveStats,
        specialties: allSpecs.length,
        categories: allCats.length,
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
