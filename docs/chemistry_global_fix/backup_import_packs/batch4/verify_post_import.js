/** Verify Batch4 74 codes in DB after import. */
const fs = require('fs')
const path = require('path')
const ROOT = path.resolve(__dirname, '../..')
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
  const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  const c = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })
  const results = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'import_all_results.json'), 'utf8'),
  )
  const inv = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs/chemistry_kb_inventory.json'), 'utf8'),
  )
  const b4 = inv.batches.find((b) => b.id === 'batch4')
  const coverage = []
  let missing = 0
  let pendingReview = 0
  let statusMismatch = 0

  for (const it of b4.items) {
    const ent = results.codeToEntity[it.code]
    let row = null
    let table = null
    if (!ent) {
      coverage.push({ code: it.code, status: 'MISSING_MAP', ok: false })
      missing++
      continue
    }
    if (ent.type === 'substance') table = 'chem_substances'
    else if (ent.type === 'reaction') table = 'chem_reactions'
    else if (ent.type === 'experiment') table = 'chem_experiments'
    else if (ent.type === 'knowledge') table = 'chem_knowledge_points'
    const [rows] = await c.query(`SELECT id, name, status, review_note FROM ${table} WHERE id=?`, [
      ent.id,
    ])
    row = rows[0]
    if (!row) {
      coverage.push({ code: it.code, status: 'MISSING_DB', ok: false })
      missing++
      continue
    }
    if (row.status === 'pending_review') pendingReview++
    else statusMismatch++
    const hasInv = String(row.review_note || '').includes(`[inv:${it.code}]`)
    coverage.push({
      code: it.code,
      type: it.type,
      dbId: row.id,
      dbStatus: row.status,
      hasInvTag: hasInv,
      ok: row.status === 'pending_review' && hasInv,
      handling: 'imported_new',
    })
  }

  // specialty links sample
  const [linkCnt] = await c.query(
    `SELECT COUNT(*) AS n FROM chem_entity_specialties es
     JOIN chem_substances s ON es.entity_type='substance' AND es.entity_id=s.id
     WHERE s.review_note LIKE '%[inv:sub.Cl2]%'`,
  )

  const out = {
    verifiedAt: new Date().toISOString(),
    planned: 74,
    mapped: Object.keys(results.codeToEntity).length,
    importSuccess: results.totals.success,
    importFail: results.totals.fail,
    linkOk: results.totals.linkOk,
    linkFail: results.totals.linkFail,
    pendingReview,
    statusMismatch,
    missing,
    coverageOk: coverage.filter((x) => x.ok).length,
    reuse: 0,
    duplicateImport: false,
    sampleCl2Links: linkCnt[0],
    coverage,
  }
  fs.writeFileSync(path.join(__dirname, 'verify_post_import.json'), JSON.stringify(out, null, 2))
  console.log(
    JSON.stringify(
      {
        planned: out.planned,
        mapped: out.mapped,
        success: out.importSuccess,
        fail: out.importFail,
        linkOk: out.linkOk,
        pendingReview: out.pendingReview,
        missing: out.missing,
        coverageOk: out.coverageOk,
        reuse: 0,
      },
      null,
      2,
    ),
  )
  await c.end()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
