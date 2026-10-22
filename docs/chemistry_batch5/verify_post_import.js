/**
 * Post-import basic coverage check for Batch5 (42). Not a quality audit.
 */
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const B5 = __dirname

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

const tableOf = {
  experiment: 'chem_experiments',
  formula: 'chem_formulas',
  knowledge: 'chem_knowledge_points',
  question: 'chem_questions',
  concept: 'chem_concepts',
}

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  let mysql
  try {
    mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  } catch {
    mysql = require('mysql2/promise')
  }
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
  const b5 = inv.batches.find((b) => b.id === 'batch5').items
  const map = JSON.parse(
    fs.readFileSync(path.join(B5, 'import_all_results.json'), 'utf8'),
  ).codeToEntity

  const rows = []
  let missing = 0
  let wrongStatus = 0
  let noInvTag = 0
  let linkOk = 0
  let linkFail = 0

  for (const it of b5) {
    const ent = map[it.code]
    if (!ent) {
      missing++
      rows.push({ code: it.code, ok: false, reason: 'no entity map' })
      continue
    }
    const table = tableOf[it.type]
    const [dbRows] = await conn.query(
      `SELECT id, status, review_note FROM ${table} WHERE id=?`,
      [ent.id],
    )
    const row = dbRows[0]
    if (!row) {
      missing++
      rows.push({ code: it.code, ok: false, reason: 'db missing' })
      continue
    }
    if (row.status !== 'pending_review') wrongStatus++
    if (!String(row.review_note || '').includes(`[inv:${it.code}]`)) noInvTag++

    const [specs] = await conn.query(
      `SELECT s.code FROM chem_entity_specialties es
       JOIN chem_specialties s ON s.id=es.specialty_id
       WHERE es.entity_type=? AND es.entity_id=?`,
      [it.type, ent.id],
    )
    const expected = it.specialtyCodes || []
    const got = specs.map((s) => s.code).sort()
    const expSorted = [...expected].sort()
    const specMatch =
      got.length === expSorted.length &&
      got.every((c, i) => c === expSorted[i])
    if (specMatch) linkOk++
    else linkFail++

    rows.push({
      code: it.code,
      type: it.type,
      id: String(ent.id),
      status: row.status,
      specs: got,
      expectedSpecs: expected,
      specMatch,
      ok: row.status === 'pending_review' && specMatch,
    })
  }

  // paper framing spot checks
  const paperChecks = []
  for (const code of ['exp.H2_prep_Zn', 'exp.instrument_basic', 'exp.ops_volumetric_flask']) {
    const ent = map[code]
    if (!ent) continue
    const [r] = await conn.query(
      `SELECT purpose, home_forbidden_note, is_hazardous FROM chem_experiments WHERE id=?`,
      [ent.id],
    )
    paperChecks.push({ code, ...r[0] })
  }

  const out = {
    verifiedAt: new Date().toISOString(),
    planned: 42,
    mapped: Object.keys(map).length,
    missing,
    wrongStatus,
    noInvTag,
    specialtyLinkOk: linkOk,
    specialtyLinkMismatch: linkFail,
    paperChecks,
    rows,
    basicCheckPassed:
      missing === 0 &&
      wrongStatus === 0 &&
      Object.keys(map).length === 42 &&
      linkFail === 0,
    note: '基础覆盖检查通过 ≠ 专项质量审查通过 ≠ 人工审核',
  }
  fs.writeFileSync(
    path.join(B5, 'verify_post_import.json'),
    JSON.stringify(out, null, 2) + '\n',
    'utf8',
  )
  console.log(
    JSON.stringify(
      {
        mapped: out.mapped,
        missing: out.missing,
        wrongStatus: out.wrongStatus,
        specialtyLinkOk: out.specialtyLinkOk,
        specialtyLinkMismatch: out.specialtyLinkMismatch,
        basicCheckPassed: out.basicCheckPassed,
      },
      null,
      2,
    ),
  )
  await conn.end()
  process.exit(out.basicCheckPassed ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
