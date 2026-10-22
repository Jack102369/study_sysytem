'use strict'
/**
 * Restore from a backup_* directory created by backup_and_clean.js
 *   node docs/chemistry_personal_open/restore_backup.js docs/chemistry_personal_open/backup_XXXX
 *
 * WARNING: replaces chem_train_* tables content from JSON (not passwords / kb body).
 */
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

function colsOf(rows) {
  if (!rows.length) return []
  return Object.keys(rows[0])
}

;(async () => {
  const dir = process.argv[2]
  if (!dir || !fs.existsSync(dir)) {
    console.error('Usage: node restore_backup.js <backup_dir>')
    process.exit(1)
  }
  const abs = path.resolve(dir)
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const c = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
    multipleStatements: true,
  })

  const tables = [
    'chem_train_session_items',
    'chem_train_sessions',
    'chem_train_item_links',
    'chem_train_items',
    'chem_train_test_grants',
  ]
  await c.beginTransaction()
  try {
    await c.query('SET FOREIGN_KEY_CHECKS=0')
    for (const t of tables) {
      await c.query(`DELETE FROM ${t}`)
    }
    // insert parents first
    const order = [
      'chem_train_items',
      'chem_train_item_links',
      'chem_train_sessions',
      'chem_train_session_items',
      'chem_train_test_grants',
    ]
    for (const t of order) {
      const rows = JSON.parse(fs.readFileSync(path.join(abs, `${t}.json`), 'utf8'))
      if (!rows.length) continue
      const cols = colsOf(rows)
      const ph = `(${cols.map(() => '?').join(',')})`
      const sql = `INSERT INTO ${t} (${cols.join(',')}) VALUES ${ph}`
      for (const row of rows) {
        await c.query(
          sql,
          cols.map((k) => row[k]),
        )
      }
    }
    await c.query('SET FOREIGN_KEY_CHECKS=1')
    await c.commit()
    console.log(JSON.stringify({ restoredFrom: abs, ok: true }, null, 2))
  } catch (e) {
    await c.rollback()
    throw e
  } finally {
    await c.end()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
