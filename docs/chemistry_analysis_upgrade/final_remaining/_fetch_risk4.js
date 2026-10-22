'use strict'
const fs = require('fs')
const path = require('path')
const { openDb, loadLinksAndSources } = require('../lib_common')

const IDS = [50, 379, 398, 401]

async function main() {
  const { conn } = await openDb()
  const [rows] = await conn.query(
    `SELECT i.*, s.code AS specialty_code, s.name AS specialty_name,
            c.code AS category_code, c.name AS category_name
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id
     WHERE i.id IN (?)`,
    [IDS],
  )
  const { links, sources } = await loadLinksAndSources(conn, IDS)
  const out = rows.map((r) => {
    const ls = links.filter((l) => String(l.item_id) === String(r.id))
    const ents = ls
      .map((l) => sources[`${l.entity_type}:${l.entity_id}`])
      .filter(Boolean)
      .map((e) => ({
        entityType: e.entityType,
        id: e.id,
        code: e.code,
        name: e.name,
        equation: e.equation || e.canonical_equation || null,
        oxidant: e.oxidant || null,
        reductant: e.reductant || null,
        description: e.description || null,
        review_note: e.review_note || null,
      }))
    return {
      id: String(r.id),
      code: r.code,
      stem: r.stem,
      options_json: r.options_json,
      answer: r.answer,
      analysis: r.analysis,
      difficulty: r.difficulty,
      qtype: r.qtype,
      specialty_code: r.specialty_code,
      category_code: r.category_code,
      gate_note: r.gate_note,
      sources: ents,
    }
  })
  fs.writeFileSync(path.join(__dirname, '_risk4_raw.json'), JSON.stringify(out, null, 2))
  console.log(JSON.stringify(out, null, 2))
  await conn.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
