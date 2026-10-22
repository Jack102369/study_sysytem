'use strict'
/**
 * Restore chem_train_* from a backup_* directory (destructive replace of those tables' rows).
 *   node docs/chemistry_question_bank_fix/restore_backup.js --dir=docs/chemistry_question_bank_fix/backup_XXXX
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

;(async () => {
  const dirArg = process.argv.find((a) => a.startsWith('--dir='))
  if (!dirArg) {
    console.error('需要 --dir=backup目录')
    process.exit(1)
  }
  const dir = path.resolve(ROOT, dirArg.slice(6))
  if (!fs.existsSync(path.join(dir, 'manifest.json'))) {
    console.error('无效备份目录', dir)
    process.exit(1)
  }
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })

  const order = [
    'chem_train_session_items',
    'chem_train_sessions',
    'chem_train_item_links',
    'chem_train_items',
    'chem_train_test_grants',
  ]
  const insertOrder = [...order].reverse()

  await conn.beginTransaction()
  try {
    await conn.query('SET FOREIGN_KEY_CHECKS=0')
    for (const t of order) {
      await conn.query(`DELETE FROM ${t}`)
    }
    for (const t of insertOrder) {
      const rows = JSON.parse(fs.readFileSync(path.join(dir, `${t}.json`), 'utf8'))
      if (!rows.length) continue
      const cols = Object.keys(rows[0])
      for (const row of rows) {
        const vals = cols.map((c) => row[c])
        await conn.query(
          `INSERT INTO ${t} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
          vals,
        )
      }
      console.log('restored', t, rows.length)
    }
    await conn.query('SET FOREIGN_KEY_CHECKS=1')
    await conn.commit()
    console.log(JSON.stringify({ restoredFrom: dir, ok: true }, null, 2))
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    await conn.end()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
