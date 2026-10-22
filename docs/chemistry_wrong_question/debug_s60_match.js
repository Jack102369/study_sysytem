'use strict'
const fs = require('fs')
const path = require('path')
const ROOT = path.resolve(__dirname, '../..')
const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
const { rankVariationCandidate, parseModelIdFromGateNote, stemSkeleton } =
  require(path.join(ROOT, 'apps/api/dist/chemistry/train/chem-variation-match.util.js'))
const { loadAdvModelCatalog } = require(path.join(
  ROOT,
  'apps/api/dist/chemistry/train/chem-model-catalog.loader.js',
))

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
  const catalog = loadAdvModelCatalog(true)
  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  })
  const [[a]] = await conn.query(
    `SELECT id, code, specialty_id, category_id, gate_note, stem FROM chem_train_items WHERE id=595`,
  )
  const model = parseModelIdFromGateNote(a.gate_note)
  console.log({ id: a.id, code: a.code, model, cat: a.category_id, sp: a.specialty_id })
  const [linksA] = await conn.query(
    `SELECT entity_type, entity_id FROM chem_train_item_links WHERE item_id=?`,
    [a.id],
  )
  console.log('linksA', linksA)
  const [sib] = await conn.query(
    `SELECT id, code, specialty_id, category_id, gate_note, stem
     FROM chem_train_items
     WHERE status='approved' AND is_active=1 AND id<>?
       AND gate_note LIKE ?
     LIMIT 20`,
    [a.id, `%model=${model}%`],
  )
  console.log('sibCount', sib.length)
  for (const s of sib.slice(0, 8)) {
    const [lb] = await conn.query(
      `SELECT entity_type, entity_id FROM chem_train_item_links WHERE item_id=?`,
      [s.id],
    )
    const rank = rankVariationCandidate({
      sourceLinks: linksA.map((x) => ({
        entityType: x.entity_type,
        entityId: String(x.entity_id),
      })),
      candLinks: lb.map((x) => ({
        entityType: x.entity_type,
        entityId: String(x.entity_id),
      })),
      sameCategory: String(s.category_id) === String(a.category_id),
      sameSpecialty: String(s.specialty_id) === String(a.specialty_id),
      sourceModelId: model,
      candModelId: parseModelIdFromGateNote(s.gate_note),
      sourceModel: catalog.byId.get(model),
      candModel: catalog.byId.get(parseModelIdFromGateNote(s.gate_note)),
      sourceSkeleton: stemSkeleton(a.stem),
      candSkeleton: stemSkeleton(s.stem),
    })
    console.log({
      id: s.id,
      code: s.code,
      sameCat: String(s.category_id) === String(a.category_id),
      links: lb.length,
      tier: rank.tier,
      reason: rank.reason,
    })
  }
  await conn.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
