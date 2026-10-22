'use strict'
/**
 * Backup train items/links/sessions (READ then WRITE files only).
 *   node docs/chemistry_question_bank_fix/backup_and_inspect.js
 */
const fs = require('fs')
const path = require('path')
const ROOT = path.resolve(__dirname, '../..')
const OUT = __dirname
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
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const c = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dir = path.join(OUT, `backup_${stamp}`)
  fs.mkdirSync(dir, { recursive: true })

  const tables = [
    'chem_train_items',
    'chem_train_item_links',
    'chem_train_sessions',
    'chem_train_session_items',
    'chem_train_test_grants',
  ]
  const dump = {}
  for (const t of tables) {
    const [rows] = await c.query(`SELECT * FROM ${t}`)
    dump[t] = rows
    fs.writeFileSync(path.join(dir, `${t}.json`), JSON.stringify(rows, null, 2))
  }
  fs.writeFileSync(
    path.join(dir, 'manifest.json'),
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        counts: Object.fromEntries(
          Object.entries(dump).map(([k, v]) => [k, v.length]),
        ),
        note: 'Restore: node docs/chemistry_question_bank_fix/restore_backup.js --dir=' + dir,
      },
      null,
      2,
    ),
  )

  // inspect 25 no-link
  const codes = [
    'train.test.eq.tf.01',
    'train.test.eq.tf.02',
    'train.test.eq.single.01',
    'train.test.mem.blank.01',
    'train.test.sub.single.01',
    'train.test.exp.judge.01',
    'train.test.eq.blank.01',
    'train.test.eq.single.02',
    'train.test.mem.blank.02',
    'train.ai_trial.eq.balance.01',
    'train.ai_trial.eq.balance.02',
    'train.ai_trial.eq.balance.03',
    'train.ai_trial.eq.balance.04',
    'train.ai_trial.eq.balance.05',
    'train.ai_trial.eq.condition.01',
    'train.ai_trial.eq.condition.02',
    'train.ai_trial.eq.condition.03',
    'train.ai_trial.eq.write.01',
    'train.ai_trial.eq.write.02',
    'train.ai_trial.eq.product.01',
    'train.ai_trial.eq.reactant.01',
    'train.ai_trial.eq.ionic_write.01',
    'train.ai_trial.eq.ionic_correct.01',
    'train.ai_trial.eq.redox_analysis.01',
    'train.ai_trial.eq.conversion.01',
  ]
  const [rows] = await c.query(
    `SELECT id, code, stem, answer, analysis, gate_note, is_active, qtype, answer_type
     FROM chem_train_items WHERE code IN (${codes.map(() => '?').join(',')})`,
    codes,
  )
  fs.writeFileSync(path.join(dir, 'no_link_25.json'), JSON.stringify(rows, null, 2))
  console.log(JSON.stringify({ backupDir: dir, counts: dump.chem_train_items.length, noLink: rows.length }, null, 2))
  await c.end()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
