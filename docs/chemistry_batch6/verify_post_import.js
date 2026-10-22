/** Verify Batch6 79 codes in DB after import (1 reuse + 78 new). */
'use strict'
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
  const c = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })
  const results = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'import_all_results.json'), 'utf8'),
  )
  const reuse = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'reuse_check.json'), 'utf8'),
  )
  const inv = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs/chemistry_kb_inventory.json'), 'utf8'),
  )
  const b6 = inv.batches.find((b) => b.id === 'batch6')

  // resolve reused q.eq.Na_water
  const reuseMap = {}
  for (const h of reuse.hits || []) {
    if (!reuseMap[h.code]) reuseMap[h.code] = h
  }

  const coverage = []
  let missing = 0
  let pendingReview = 0
  let statusMismatch = 0
  let reused = 0
  let imported = 0
  let noInvTag = 0
  let linkFailSample = []

  for (const it of b6.items) {
    let ent = results.codeToEntity[it.code]
    let handling = 'imported_new'
    if (!ent && it.code === 'q.eq.Na_water' && reuseMap[it.code]) {
      ent = { type: 'question', id: String(reuseMap[it.code].id) }
      handling = 'reused_existing'
      reused++
    } else if (ent) {
      imported++
    } else {
      coverage.push({ code: it.code, status: 'MISSING_MAP', ok: false })
      missing++
      continue
    }

    const table = TABLE[ent.type || it.type]
    const selectCols =
      (ent.type || it.type) === 'question'
        ? 'id, status, review_note, LEFT(stem, 60) AS label'
        : 'id, name, status, review_note'
    const [rows] = await c.query(
      `SELECT ${selectCols} FROM ${table} WHERE id=?`,
      [ent.id],
    )
    const row = rows[0]
    if (!row) {
      coverage.push({ code: it.code, status: 'MISSING_DB', ok: false })
      missing++
      continue
    }

    const hasInv =
      handling === 'reused_existing'
        ? true
        : String(row.review_note || '').includes(`[inv:${it.code}]`)
    if (!hasInv) noInvTag++

    if (handling === 'reused_existing') {
      // seeded may be published or other status — ok for reuse
    } else if (row.status === 'pending_review') {
      pendingReview++
    } else {
      statusMismatch++
    }

    // specialty links
    const [links] = await c.query(
      `SELECT COUNT(*) AS n FROM chem_entity_specialties WHERE entity_type=? AND entity_id=?`,
      [ent.type || it.type, ent.id],
    )
    const specCount = Number(links[0].n)
    const expectSpec = (it.specialtyCodes || []).length
    const specMatch = handling === 'reused_existing' || specCount >= Math.min(1, expectSpec)

    if (!specMatch) {
      linkFailSample.push({ code: it.code, specCount, expectSpec })
    }

    coverage.push({
      code: it.code,
      type: it.type,
      dbId: String(row.id),
      dbStatus: row.status,
      hasInvTag: hasInv,
      specialtyLinks: specCount,
      handling,
      verifyNeeded: !!it.verifyNeeded,
      ok:
        handling === 'reused_existing'
          ? true
          : row.status === 'pending_review' && hasInv && specMatch,
    })
  }

  // Batch2-5 sample integrity: count by inv tags should still exist
  const [b5cnt] = await c.query(
    `SELECT COUNT(*) AS n FROM chem_experiments WHERE review_note LIKE '%[inv:exp.instrument_basic]%'`,
  )
  const [b4cnt] = await c.query(
    `SELECT COUNT(*) AS n FROM chem_substances WHERE review_note LIKE '%[inv:sub.Cl2]%'`,
  )

  // duplicate check for batch6 codes
  let duplicateInv = 0
  for (const it of b6.items) {
    if (it.code === 'q.eq.Na_water') continue
    const table = TABLE[it.type]
    const [dup] = await c.query(
      `SELECT COUNT(*) AS n FROM ${table} WHERE review_note LIKE ?`,
      [`%[inv:${it.code}]%`],
    )
    if (Number(dup[0].n) > 1) duplicateInv++
  }

  const totalCodes = inv.batches.reduce((s, b) => s + b.items.length, 0)

  const out = {
    verifiedAt: new Date().toISOString(),
    planned: 79,
    mappedImport: Object.keys(results.codeToEntity).length,
    importSuccess: results.totals.success,
    importFail: results.totals.fail,
    linkOk: results.totals.linkOk,
    linkFail: results.totals.linkFail,
    pendingReview,
    statusMismatch,
    missing,
    reused,
    imported,
    noInvTag,
    duplicateInv,
    coverageOk: coverage.filter((x) => x.ok).length,
    inventoryTotalCodes: totalCodes,
    priorBatchSample: {
      b5_exp_instrument_basic: Number(b5cnt[0].n),
      b4_sub_Cl2: Number(b4cnt[0].n),
    },
    linkFailSample: linkFailSample.slice(0, 10),
    verifyNeededCodes: b6.items.filter((i) => i.verifyNeeded).map((i) => i.code),
    coverage,
  }
  fs.writeFileSync(
    path.join(__dirname, 'verify_post_import.json'),
    JSON.stringify(out, null, 2) + '\n',
  )
  console.log(
    JSON.stringify(
      {
        planned: out.planned,
        imported: out.imported,
        reused: out.reused,
        success: out.importSuccess,
        fail: out.importFail,
        linkOk: out.linkOk,
        pendingReview: out.pendingReview,
        missing: out.missing,
        coverageOk: out.coverageOk,
        duplicateInv: out.duplicateInv,
        inventoryTotalCodes: out.inventoryTotalCodes,
        priorBatchSample: out.priorBatchSample,
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
