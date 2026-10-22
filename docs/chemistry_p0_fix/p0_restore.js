/**
 * Restore P0 changes from backup_before_p0.json (or backup_before_p0_apply.json).
 * Usage: node docs/chemistry_p0_fix/p0_restore.js
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const envPath = path.join(ROOT, 'apps/api/.env')
const backupPath = fs.existsSync(path.join(__dirname, 'backup_before_p0.json'))
  ? path.join(__dirname, 'backup_before_p0.json')
  : path.join(__dirname, 'backup_before_p0_apply.json')

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
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
  const kp = backup.knowledge[0]
  const fm = backup.formula[0]
  const rx = backup.reaction[0]
  if (!kp || !fm || !rx) throw new Error('backup incomplete')

  const env = loadEnv(envPath)
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

  await conn.beginTransaction()
  try {
    await conn.query(
      `UPDATE chem_knowledge_points SET description = ?, review_note = ? WHERE id = ?`,
      [kp.description, kp.reviewNote, kp.id],
    )
    await conn.query(
      `UPDATE chem_formulas
       SET expression = ?, variables = ?, units = ?,
           applicable_conditions = ?, examples = ?, common_mistakes = ?,
           review_note = ?
       WHERE id = ?`,
      [
        fm.expression,
        fm.variables,
        fm.units,
        fm.applicableConditions,
        fm.examples,
        fm.commonMistakes,
        fm.reviewNote,
        fm.id,
      ],
    )
    await conn.query(
      `UPDATE chem_reactions
       SET ox_product = ?, re_product = ?
       WHERE id = ? AND canonical_equation = '2Na+2H2O=2NaOH+H2'`,
      [rx.oxProduct, rx.reProduct, rx.id],
    )
    await conn.commit()
  } catch (e) {
    await conn.rollback()
    throw e
  }

  console.log(JSON.stringify({ restoredFrom: backupPath, kpId: kp.id, fmId: fm.id, rxId: rx.id }, null, 2))
  await conn.end()
}

main().catch((e) => {
  console.error(String(e && e.stack ? e.stack : e))
  process.exit(1)
})
