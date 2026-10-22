/**
 * Backfill review_note for Batch6 questions only (createQuestion previously dropped it).
 * Does NOT touch Batch5 or other questions. Idempotent.
 */
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
  const pack = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'import_B6-F.json'), 'utf8'),
  )
  const codes = pack.meta.inventoryCodes
  let updated = 0
  const details = []
  for (let i = 0; i < pack.items.length; i++) {
    const code = codes[i]
    const note = String(pack.items[i].data.reviewNote || '')
    const ent = results.codeToEntity[code]
    if (!ent || ent.type !== 'question') {
      details.push({ code, ok: false, reason: 'no entity' })
      continue
    }
    if (!note.includes(`[inv:${code}]`)) {
      details.push({ code, ok: false, reason: 'pack missing inv tag' })
      continue
    }
    const [rows] = await c.query(
      `SELECT id, review_note, status FROM chem_questions WHERE id=?`,
      [ent.id],
    )
    const row = rows[0]
    if (!row) {
      details.push({ code, ok: false, reason: 'db missing' })
      continue
    }
    if (String(row.review_note || '').includes(`[inv:${code}]`)) {
      details.push({ code, ok: true, skipped: true, id: row.id })
      continue
    }
    await c.query(`UPDATE chem_questions SET review_note=? WHERE id=?`, [
      note.slice(0, 255),
      ent.id,
    ])
    updated++
    details.push({ code, ok: true, updated: true, id: String(ent.id) })
  }
  const out = { updatedAt: new Date().toISOString(), updated, details }
  fs.writeFileSync(
    path.join(__dirname, 'patch_question_review_notes.json'),
    JSON.stringify(out, null, 2) + '\n',
  )
  console.log(JSON.stringify({ updated, count: details.length }, null, 2))
  await c.end()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
