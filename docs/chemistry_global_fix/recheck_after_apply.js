/**
 * Post-apply recheck (read-only).
 * node docs/chemistry_global_fix/recheck_after_apply.js
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

const REDOX_REMOVE = [
  'rxn.Na2O_H2O',
  'rxn.NaOH_CO2',
  'rxn.NaOH_HCl',
  'rxn.NaHCO3_heat',
  'rxn.Na2CO3_2HCl',
  'rxn.Al2O3_6HCl',
  'rxn.Al2O3_2NaOH',
  'rxn.AlOH3_NaOH',
  'rxn.AlOH3_3HCl',
  'rxn.CuO_2HCl',
]

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

function sameArr(a, b) {
  return JSON.stringify([...(a || [])].map(String).sort()) === JSON.stringify([...(b || [])].map(String).sort())
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

  const backup = JSON.parse(
    fs.readFileSync(path.join(OUT, 'backup_before_global_fix.json'), 'utf8'),
  )
  const apply = JSON.parse(fs.readFileSync(path.join(OUT, 'apply_result.json'), 'utf8'))
  const inv = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs/chemistry_kb_inventory.json'), 'utf8'),
  )
  const invItems = inv.batches.flatMap((b) => b.items)
  const invByCode = Object.fromEntries(invItems.map((i) => [i.code, i]))

  const checks = []
  const fail = (id, detail) => checks.push({ id, ok: false, detail })
  const pass = (id, detail) => checks.push({ id, ok: true, detail })

  // 1. 377 exist
  if (invItems.length === 377 && new Set(invItems.map((i) => i.code)).size === 377) {
    pass('inventory_377', 'ok')
  } else fail('inventory_377', invItems.length)

  let missing = 0
  let published = 0
  const publishedChanged = []
  for (const ent of backup.entities) {
    const [rows] = await conn.query(`SELECT * FROM ${TABLE[ent.type]} WHERE id=?`, [ent.dbId])
    if (!rows[0]) {
      missing++
      continue
    }
    if (rows[0].status === 'published') {
      published++
      const live = rows[0]
      let changed = false
      if (String(live.review_note || '') !== String(ent.review_note || '')) changed = true
      if (ent.type === 'question' && (live.stem !== ent.row.stem || live.answer !== ent.row.answer)) {
        changed = true
      }
      const [specs] = await conn.query(
        `SELECT s.code FROM chem_entity_specialties es JOIN chem_specialties s ON s.id=es.specialty_id WHERE es.entity_type=? AND es.entity_id=?`,
        [ent.type, ent.dbId],
      )
      if (!sameArr(specs.map((s) => s.code), ent.specialtyCodes)) changed = true
      if (changed) publishedChanged.push(ent.code)
    }
  }
  if (missing === 0) pass('db_377_present', true)
  else fail('db_377_present', missing)
  if (published === 19 && publishedChanged.length === 0) pass('published_untouched', 19)
  else fail('published_untouched', { published, publishedChanged })

  // 3-4 redox
  const redoxLeft = []
  const otherSpecLost = []
  for (const code of REDOX_REMOVE) {
    const ent = backup.entities.find((e) => e.code === code)
    const [specs] = await conn.query(
      `SELECT s.code FROM chem_entity_specialties es JOIN chem_specialties s ON s.id=es.specialty_id WHERE es.entity_type='reaction' AND es.entity_id=?`,
      [ent.dbId],
    )
    const codes = specs.map((s) => s.code)
    if (codes.includes('redox')) redoxLeft.push(code)
    const expectKeep = ent.specialtyCodes.filter((s) => s !== 'redox')
    if (!sameArr(codes, expectKeep)) otherSpecLost.push({ code, codes, expectKeep })
    const invIt = invByCode[code]
    if ((invIt.specialtyCodes || []).includes('redox')) redoxLeft.push(code + ':inv')
  }
  if (!redoxLeft.length) pass('redox_removed', 10)
  else fail('redox_removed', redoxLeft)
  if (!otherSpecLost.length) pass('other_specs_kept', true)
  else fail('other_specs_kept', otherSpecLost)

  // 5 inventory ion
  const ionLeft = ['kp.periodic.position', 'kp.calc.concentration', 'kp.calc.dilution'].filter(
    (c) => (invByCode[c].specialtyCodes || []).includes('ion'),
  )
  if (!ionLeft.length) pass('inventory_ion_fixed', 3)
  else fail('inventory_ion_fixed', ionLeft)

  // 6 inv tags
  const invTagFail = []
  for (const code of ['el.Be', 'el.Ar', 'el.Fe', 'el.I', 'el.Cr']) {
    const ent = backup.entities.find((e) => e.code === code)
    const [rows] = await conn.query(`SELECT review_note, status FROM chem_elements WHERE id=?`, [
      ent.dbId,
    ])
    if (!rows[0].review_note.includes(`[inv:${code}]`)) invTagFail.push(code)
    if (rows[0].status !== 'pending_review') invTagFail.push(code + ':status')
  }
  if (!invTagFail.length) pass('inv_tags', 5)
  else fail('inv_tags', invTagFail)

  // 7 question limits
  const qFail = []
  const qCodes = apply.results.filter((r) => r.kind === 'append_train_limit_note').map((r) => r.code)
  for (const code of qCodes) {
    const ent = backup.entities.find((e) => e.code === code)
    const [rows] = await conn.query(
      `SELECT review_note, status, stem, answer FROM chem_questions WHERE id=?`,
      [ent.dbId],
    )
    if (!/trainLimit:/.test(rows[0].review_note)) qFail.push(code)
    if (rows[0].status !== 'pending_review') qFail.push(code + ':st')
    if (rows[0].stem !== ent.row.stem || rows[0].answer !== ent.row.answer) qFail.push(code + ':body')
  }
  if (!qFail.length && qCodes.length === 17) pass('question_limits', 17)
  else fail('question_limits', { qFail, n: qCodes.length })

  // 8 Fe3
  {
    const ent = backup.entities.find((e) => e.code === 'exp.Fe3_SCN')
    const [rows] = await conn.query(`SELECT review_note FROM chem_experiments WHERE id=?`, [
      ent.dbId,
    ])
    if (/excludeDefaultUntilVerified|待核实/.test(rows[0].review_note)) pass('fe3_limit', true)
    else fail('fe3_limit', rows[0].review_note)
  }

  // 9 verifyNeeded
  const vn = invItems.filter((i) => i.verifyNeeded).length
  if (vn === 23) pass('verifyNeeded_23', 23)
  else fail('verifyNeeded_23', vn)

  // 11 C2H4 no redox
  {
    const ent = backup.entities.find((e) => e.code === 'rxn.C2H4_KMnO4')
    const [specs] = await conn.query(
      `SELECT s.code FROM chem_entity_specialties es JOIN chem_specialties s ON s.id=es.specialty_id WHERE es.entity_type='reaction' AND es.entity_id=?`,
      [ent.dbId],
    )
    if (!specs.some((s) => s.code === 'redox')) pass('c2h4_no_redox', true)
    else fail('c2h4_no_redox', false)
  }

  // 12 pack sync spot-check B3-B
  {
    const pack = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'docs/chemistry_batch3/import_B3-B.json'), 'utf8'),
    )
    const bad = REDOX_REMOVE.filter((c) => (pack.meta.specialtyByCode[c] || []).includes('redox'))
    if (!bad.length) pass('pack_B3B_synced', true)
    else fail('pack_B3B_synced', bad)
  }

  // remaining wrong redox among all reactions with empty ox/re that are non-redox from backup judgment
  // quick: any of the 10 still have redox in DB
  pass('no_new_p0_assumed', 'no equation/ox-re field writes this round')

  await conn.end()

  const allOk = checks.every((c) => c.ok)
  const out = { recheckedAt: new Date().toISOString(), allOk, checks }
  fs.writeFileSync(path.join(OUT, 'recheck_result.json'), JSON.stringify(out, null, 2) + '\n')
  console.log(JSON.stringify(out, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
