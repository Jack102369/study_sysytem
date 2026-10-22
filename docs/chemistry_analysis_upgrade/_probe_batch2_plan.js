'use strict'
const fs = require('fs')
const path = require('path')
const ROOT = path.resolve(__dirname, '../..')
const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))

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
    charset: 'utf8mb4',
  })

  const [rows] = await conn.query(
    `SELECT i.id,i.code,i.stem,i.options_json,i.answer,i.analysis,i.difficulty,i.qtype,
            i.gate_note,i.is_active,i.status,i.pool,
            s.code AS sp, s.name AS spn, c.code AS cat, c.name AS catn
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id
     WHERE i.id IN (215,250)`,
  )

  const [links] = await conn.query(
    `SELECT item_id, entity_type, entity_id FROM chem_train_item_links WHERE item_id IN (215,250)`,
  )

  const tableMap = {
    knowledge: 'chem_knowledge_points',
    reaction: 'chem_reactions',
    substance: 'chem_substances',
    formula: 'chem_formulas',
    concept: 'chem_concepts',
    element: 'chem_elements',
    experiment: 'chem_experiments',
    question: 'chem_questions',
  }
  const sources = []
  for (const l of links) {
    const table = tableMap[l.entity_type]
    if (!table) continue
    const [e] = await conn.query(`SELECT * FROM ${table} WHERE id=? LIMIT 1`, [l.entity_id])
    const ent = e[0]
    sources.push({
      item_id: String(l.item_id),
      entity_type: l.entity_type,
      entity_id: String(l.entity_id),
      name: ent && ent.name,
      code: ent && ent.code,
      description: ent && String(ent.description || '').slice(0, 500),
      review_note: ent && String(ent.review_note || '').slice(0, 200),
      equation: ent && ent.equation,
      chemical_props: ent && ent.chemical_props,
    })
  }

  const wl = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'first_update_whitelist.json'), 'utf8'),
  )
  const wlIds = new Set(wl.items.map((x) => String(x.id)))

  const [all] = await conn.query(
    `SELECT i.id, i.code, i.difficulty, i.analysis, s.code AS sp,
      (SELECT COUNT(*) FROM chem_train_session_items si
       WHERE si.item_id=i.id AND si.grade_result='wrong') AS wrongs
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     WHERE i.pool='test' AND i.status='approved' AND i.is_active=1
       AND (i.gate_note IS NULL OR i.gate_note NOT LIKE '%[trial_access:block]%')
       AND i.code NOT LIKE 'train.ai_trial.s60.%'
       AND IFNULL(i.gate_note,'') NOT LIKE '%[s60]%'
       AND i.id NOT IN (215,250)`,
  )
  const remain = all.filter((r) => !wlIds.has(String(r.id)))
  const sourceOnly = remain.filter(
    (r) => !String(r.analysis || '').trim() || /^来源/.test(String(r.analysis || '')),
  )
  const bySp = {}
  const byDiff = {}
  for (const r of remain) {
    bySp[r.sp] = (bySp[r.sp] || 0) + 1
    byDiff[r.difficulty] = (byDiff[r.difficulty] || 0) + 1
  }
  const wrongItems = remain.filter((r) => Number(r.wrongs) > 0)

  const out = {
    riskItems: rows,
    links,
    sources,
    pool: {
      batch1Updated: wlIds.size,
      remainAfterExclusions: remain.length,
      sourceOnlyish: sourceOnly.length,
      wrongsItems: wrongItems.length,
      bySp,
      byDiff,
    },
  }
  fs.writeFileSync(path.join(__dirname, '_probe_batch2_plan.json'), JSON.stringify(out, null, 2))
  console.log(JSON.stringify({ riskItems: rows.map((r)=>({id:r.id,code:r.code,stem:r.stem,answer:r.answer,sp:r.sp,cat:r.cat,analysis:String(r.analysis).slice(0,80)})), sources, pool: out.pool }, null, 2))
  await conn.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
