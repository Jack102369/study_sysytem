/** Extract Batch6 79 items for quality review. Read-only. Includes reused q.eq.Na_water. */
'use strict'
const fs = require('fs')
const path = require('path')

const dir = __dirname
const ROOT = path.resolve(__dirname, '../..')
const inv = JSON.parse(
  fs.readFileSync(path.join(dir, '..', 'chemistry_kb_inventory.json'), 'utf8'),
)
const batch6 = inv.batches.find((b) => b.id === 'batch6')
if (!batch6 || batch6.items.length !== 79) {
  throw new Error('batch6 must have 79 items')
}
const results = JSON.parse(
  fs.readFileSync(path.join(dir, 'import_all_results.json'), 'utf8'),
)
const reuse = JSON.parse(
  fs.readFileSync(path.join(dir, 'reuse_check.json'), 'utf8'),
)

const packs = ['B6-A', 'B6-B', 'B6-C', 'B6-D', 'B6-E', 'B6-F']
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

  // resolve reused question
  const reuseHit = (reuse.hits || []).find((h) => h.code === 'q.eq.Na_water')
  const naId = batch6.items.find((i) => i.code === 'q.eq.Na_water')?.dbId ||
    (reuseHit && String(reuseHit.id))

  const items = []
  for (const it of batch6.items) {
    let base = byCode[it.code]
    let dbId = base?.dbId || it.dbId || null
    let source = base?.source || 'unknown'

    if (it.code === 'q.eq.Na_water') {
      dbId = naId || dbId
      source = 'reused'
      if (!base) {
        base = {
          code: it.code,
          type: 'question',
          data: null,
          pack: null,
          specialtyCodes: it.specialtyCodes || [],
          categoryCodes: it.categoryCodes || [],
          dbId,
          source: 'reused',
        }
      } else {
        base.source = 'reused'
        base.dbId = dbId
      }
    }

    if (!dbId) throw new Error('missing dbId for ' + it.code)

    const table = TABLE[it.type]
    let rowSelect =
      it.type === 'question'
        ? 'id, status, review_note, qtype, stem, answer, analysis, scoring, difficulty'
        : it.type === 'substance'
          ? 'id, status, review_note, name, canonical_formula, color, state_label, solubility, physical_props, chemical_props, common_uses, test_methods, storage_methods, safety_notes'
          : it.type === 'reaction'
            ? 'id, status, review_note, name, canonical_equation, equation, ionic_equation, conditions, phenomenon, principle, oxidant, reductant, ox_product, re_product, electron_transfer, difficulty, importance'
            : it.type === 'experiment'
              ? 'id, status, review_note, name, category, purpose, principle, instruments, reagents, steps, phenomenon, conclusion, precautions, safety_notes, is_hazardous, home_forbidden_note'
              : it.type === 'concept'
                ? 'id, status, review_note, name, definition, principle, applicable_conditions, judge_methods, examples, common_mistakes'
                : 'id, status, review_note, name, description, difficulty, importance'

    const [rows] = await conn.query(
      `SELECT ${rowSelect} FROM ${table} WHERE id=?`,
      [dbId],
    )
    const [specs] = await conn.query(
      `SELECT s.code FROM chem_entity_specialties es
       JOIN chem_specialties s ON s.id=es.specialty_id
       WHERE es.entity_type=? AND es.entity_id=?`,
      [it.type, dbId],
    )
    const [cats] = await conn.query(
      `SELECT c.code FROM chem_entity_categories ec
       JOIN chem_categories c ON c.id=ec.category_id
       WHERE ec.entity_type=? AND ec.entity_id=?`,
      [it.type, dbId],
    )

    let species = null
    if (it.type === 'reaction') {
      const [sp] = await conn.query(
        `SELECT role, formula, coefficient, state_symbol, is_gas, is_precipitate, sort_order
         FROM chem_reaction_species WHERE reaction_id=? ORDER BY sort_order, id`,
        [dbId],
      )
      species = sp
    }

    items.push({
      code: it.code,
      type: it.type,
      inventoryName: it.name,
      inventoryStatus: it.status,
      note: it.note,
      verifyNeeded: !!it.verifyNeeded,
      curriculumScope: it.curriculumScope || null,
      priority: it.priority,
      specialtyCodes: base?.specialtyCodes || it.specialtyCodes || [],
      categoryCodes: base?.categoryCodes || it.categoryCodes || [],
      pack: base?.pack || null,
      source,
      dbId: String(dbId),
      dbStatus: rows[0]?.status || null,
      dbReviewNote: rows[0]?.review_note || null,
      dbRow: rows[0] || null,
      dbSpecialtyCodes: specs.map((s) => s.code),
      dbCategoryCodes: cats.map((c) => c.code),
      species,
      packData: base?.data || null,
    })
  }

  // integrity samples: prior batches untouched
  const [b5] = await conn.query(
    `SELECT id, status, LEFT(review_note,80) rn FROM chem_experiments WHERE review_note LIKE '%[inv:exp.instrument_basic]%' LIMIT 1`,
  )
  const [b4] = await conn.query(
    `SELECT id, status, LEFT(review_note,80) rn FROM chem_substances WHERE review_note LIKE '%[inv:sub.Cl2]%' LIMIT 1`,
  )
  const [b5q] = await conn.query(
    `SELECT id, status, review_note FROM chem_questions WHERE id BETWEEN 2 AND 9 ORDER BY id`,
  )

  const out = {
    extractedAt: new Date().toISOString(),
    total: items.length,
    inventoryTotal: inv.batches.reduce((s, b) => s + b.items.length, 0),
    readOnly: true,
    priorBatchSample: { b5_instrument: b5[0] || null, b4_Cl2: b4[0] || null },
    batch5QuestionReviewNotes: b5q.map((r) => ({
      id: String(r.id),
      status: r.status,
      hasInv: String(r.review_note || '').includes('[inv:'),
      review_note: r.review_note,
    })),
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
        inventoryTotal: out.inventoryTotal,
        reused: items.filter((i) => i.source === 'reused').length,
        pending: items.filter((i) => i.dbStatus === 'pending_review').length,
        withInvTag: items.filter((i) =>
          String(i.dbReviewNote || '').includes(`[inv:${i.code}]`),
        ).length,
        verifyNeeded: items.filter((i) => i.verifyNeeded).map((i) => i.code),
        priorOk: !!(out.priorBatchSample.b5_instrument && out.priorBatchSample.b4_Cl2),
        b5qMissingInv: out.batch5QuestionReviewNotes.filter((q) => !q.hasInv).length,
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
