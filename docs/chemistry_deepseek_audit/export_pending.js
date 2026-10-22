/**
 * Export all pending_review KB items (inventory ∩ DB) for DeepSeek audit.
 * READ-ONLY DB. Does not change status.
 *
 *   node docs/chemistry_deepseek_audit/export_pending.js
 */
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
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

  const byTypeRows = {}
  for (const [type, table] of Object.entries(TABLE)) {
    const [rows] = await conn.query(`SELECT * FROM ${table}`)
    byTypeRows[type] = rows
  }

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
      if (type === 'element' && row.symbol) bySymbol[String(row.symbol)] = row
      if (type === 'element' && row.name_zh) {
        const k = String(row.name_zh)
        if (!byName[type].has(k)) byName[type].set(k, [])
        byName[type].get(k).push(row)
      }
    }
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
    `SELECT reaction_id, role, formula, coefficient, state_symbol
     FROM chem_reaction_species ORDER BY sort_order, id`,
  )
  const speciesByRxn = new Map()
  for (const r of speciesRows) {
    const id = String(r.reaction_id)
    if (!speciesByRxn.has(id)) speciesByRxn.set(id, [])
    speciesByRxn.get(id).push(r)
  }

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

  function resolveRow(it) {
    if (it.dbId && byId[it.type]?.has(String(it.dbId))) {
      return { row: byId[it.type].get(String(it.dbId)), method: 'dbId' }
    }
    for (const m of maps) {
      const id = m[it.code]?.id
      if (id && byId[it.type]?.has(String(id))) {
        return { row: byId[it.type].get(String(id)), method: 'import_map' }
      }
    }
    if (byInv[it.type]?.has(it.code)) {
      return { row: byInv[it.type].get(it.code), method: 'inv_tag' }
    }
    if (it.type === 'element') {
      const sym = it.code.replace(/^el\./, '')
      if (bySymbol[sym]) return { row: bySymbol[sym], method: 'symbol' }
    }
    if (it.name && byName[it.type]?.has(it.name)) {
      const list = byName[it.type].get(it.name)
      if (list.length === 1) return { row: list[0], method: 'unique_name' }
      const pend = list.find((r) => r.status === 'pending_review')
      if (pend) return { row: pend, method: 'name_pending' }
      return { row: list[0], method: 'name_first' }
    }
    return { row: null, method: null }
  }

  const items = []
  for (const batch of inv.batches) {
    for (const it of batch.items) {
      const { row, method } = resolveRow(it)
      if (!row) continue
      if (String(row.status) !== 'pending_review') continue
      const id = String(row.id)
      const linkKey = `${it.type}:${id}`
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
        inventorySpecialtyCodes: it.specialtyCodes || [],
        inventoryCategoryCodes: it.categoryCodes || [],
        dbId: id,
        resolveMethod: method,
        dbStatus: row.status,
        dbReviewNote: row.review_note || '',
        dbSpecialtyCodes: (specMap.get(linkKey) || []).slice().sort(),
        dbCategoryCodes: (catMap.get(linkKey) || []).slice().sort(),
        dbRow: serializeRow(row),
        species:
          it.type === 'reaction' ? speciesByRxn.get(id) || [] : undefined,
      })
    }
  }

  await conn.end()

  const byType = {}
  const byBatch = {}
  for (const it of items) {
    byType[it.type] = (byType[it.type] || 0) + 1
    byBatch[it.batch] = (byBatch[it.batch] || 0) + 1
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    readOnly: true,
    source: 'inventory ∩ DB status=pending_review',
    total: items.length,
    verifyNeededCount: items.filter((i) => i.verifyNeeded).length,
    byType,
    byBatch,
    items,
  }

  fs.mkdirSync(OUT, { recursive: true })
  fs.writeFileSync(
    path.join(OUT, 'pending_review_all.json'),
    JSON.stringify(payload, null, 2) + '\n',
  )

  const md = []
  md.push('# pending_review 知识集中汇总')
  md.push('')
  md.push(`> 导出时间：${payload.exportedAt}`)
  md.push(`> 总数：**${payload.total}**；verifyNeeded：**${payload.verifyNeededCount}**`)
  md.push('> 只读导出，未改数据库。')
  md.push('')
  md.push('## 分类型统计')
  md.push('')
  md.push('| 类型 | 数量 |')
  md.push('|------|------|')
  for (const [t, n] of Object.entries(byType).sort()) md.push(`| ${t} | ${n} |`)
  md.push('')
  md.push('## 分批次统计')
  md.push('')
  md.push('| 批次 | 数量 |')
  md.push('|------|------|')
  for (const [b, n] of Object.entries(byBatch).sort()) md.push(`| ${b} | ${n} |`)
  md.push('')
  md.push('## 逐条摘要')
  md.push('')
  md.push('| 编码 | 批次 | 类型 | 名称 | verifyNeeded | 专项 |')
  md.push('|------|------|------|------|-------------|------|')
  for (const it of items) {
    md.push(
      `| \`${it.code}\` | ${it.batch} | ${it.type} | ${String(it.name).replace(/\|/g, '/')} | ${it.verifyNeeded ? '是' : '否'} | ${(it.dbSpecialtyCodes || []).join(',') || '—'} |`,
    )
  }
  md.push('')
  md.push('完整结构化字段见 `pending_review_all.json`。')
  fs.writeFileSync(path.join(OUT, 'PENDING_REVIEW_ALL.md'), md.join('\n'), 'utf8')

  console.log(JSON.stringify({ total: payload.total, byType, byBatch, verifyNeeded: payload.verifyNeededCount }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
