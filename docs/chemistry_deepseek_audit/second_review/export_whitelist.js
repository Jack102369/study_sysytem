/**
 * Export 239 PASS_PUBLISH whitelist items with full DB fields for second review.
 * READ-ONLY. Does not include first-audit PASS reasons as decision input.
 *
 *   node docs/chemistry_deepseek_audit/second_review/export_whitelist.js
 */
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../../..')
const AUDIT = path.resolve(__dirname, '..')
const OUT = __dirname

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

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

function serializeRow(row) {
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
  const whitelist = JSON.parse(
    fs.readFileSync(path.join(AUDIT, 'publish_whitelist.json'), 'utf8'),
  )
  const pending = JSON.parse(
    fs.readFileSync(path.join(AUDIT, 'pending_review_all.json'), 'utf8'),
  )
  const inv = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs/chemistry_kb_inventory.json'), 'utf8'),
  )

  const invByCode = new Map()
  for (const b of inv.batches || []) {
    for (const it of b.items || []) invByCode.set(it.code, { ...it, batch: b.id })
  }

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

  const byTypeRows = {}
  for (const [type, table] of Object.entries(TABLE)) {
    const [rows] = await conn.query(`SELECT * FROM ${table}`)
    byTypeRows[type] = new Map(rows.map((r) => [String(r.id), r]))
  }

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
  const [speciesRows] = await conn.query(
    `SELECT reaction_id, role, formula, coefficient, state_symbol, sort_order
     FROM chem_reaction_species ORDER BY sort_order, id`,
  )
  await conn.end()

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
  const speciesByRxn = new Map()
  for (const r of speciesRows) {
    const id = String(r.reaction_id)
    if (!speciesByRxn.has(id)) speciesByRxn.set(id, [])
    speciesByRxn.get(id).push(r)
  }

  const pendingByCode = new Map((pending.items || []).map((i) => [i.code, i]))
  const items = []
  const missing = []

  for (const w of whitelist.items || []) {
    const base = pendingByCode.get(w.code)
    const invItem = invByCode.get(w.code)
    const type = w.type || base?.type
    const dbId = String(w.dbId || base?.dbId || '')
    const row = type && dbId ? byTypeRows[type]?.get(dbId) : null
    if (!row) {
      missing.push(w.code)
      continue
    }
    const linkKey = `${type}:${dbId}`
    items.push({
      code: w.code,
      type,
      name: w.name || base?.name || row.name || row.name_zh || row.title,
      batch: w.batch || base?.batch || invItem?.batch || null,
      dbId,
      // inventory flags (not first-audit grade)
      verifyNeeded: !!(invItem?.verifyNeeded || base?.verifyNeeded),
      curriculumScope: invItem?.curriculumScope || base?.curriculumScope || null,
      inventoryNote: invItem?.note || base?.inventoryNote || '',
      priority: invItem?.priority ?? base?.priority ?? null,
      // live DB
      dbStatus: row.status,
      dbReviewNote: row.review_note || '',
      dbSpecialtyCodes: (specMap.get(linkKey) || []).slice().sort(),
      dbCategoryCodes: (catMap.get(linkKey) || []).slice().sort(),
      dbRow: serializeRow(row),
      species: type === 'reaction' ? speciesByRxn.get(dbId) || [] : undefined,
      // meta only — NOT to be fed to model as prior PASS verdict
      firstAuditMeta: {
        wasInWhitelist: true,
        firstConfidence: w.confidence ?? null,
      },
    })
  }

  const byType = {}
  for (const it of items) byType[it.type] = (byType[it.type] || 0) + 1

  const payload = {
    exportedAt: new Date().toISOString(),
    readOnly: true,
    source: 'publish_whitelist.json ∩ live DB',
    total: items.length,
    expected: (whitelist.items || []).length,
    missingCodes: missing,
    verifyNeededCount: items.filter((i) => i.verifyNeeded).length,
    byType,
    note: '不含初审 PASS 理由正文；复核必须以 dbRow 为准。',
    items,
  }

  fs.writeFileSync(path.join(OUT, 'input_239.json'), JSON.stringify(payload, null, 2) + '\n')
  console.log(
    JSON.stringify(
      {
        total: payload.total,
        expected: payload.expected,
        missing: missing.length,
        byType,
        verifyNeeded: payload.verifyNeededCount,
      },
      null,
      2,
    ),
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
