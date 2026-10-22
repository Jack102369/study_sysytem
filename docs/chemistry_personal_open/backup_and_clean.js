'use strict'
/**
 * Backup + clean 20 blocked items (18 filler + 2 no-source).
 *   node docs/chemistry_personal_open/backup_and_clean.js --dry-run
 *   node docs/chemistry_personal_open/backup_and_clean.js --apply
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

const BLOCK_EXTRA = [
  'train.test.eq.single.01',
  'train.ai_trial.eq.conversion.01',
]

;(async () => {
  const apply = process.argv.includes('--apply')
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const conn = await mysql.createConnection({
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
  for (const t of [
    'chem_train_items',
    'chem_train_item_links',
    'chem_train_sessions',
    'chem_train_session_items',
    'chem_train_test_grants',
  ]) {
    const [rows] = await conn.query(`SELECT * FROM ${t}`)
    fs.writeFileSync(path.join(dir, `${t}.json`), JSON.stringify(rows, null, 2))
  }

  const [filler] = await conn.query(
    `SELECT id, code, is_active FROM chem_train_items WHERE code LIKE 'train.ai_trial.cov.%'`,
  )
  const [extra] = await conn.query(
    `SELECT id, code, is_active, gate_note FROM chem_train_items WHERE code IN (?,?)`,
    BLOCK_EXTRA,
  )
  const targets = [...filler, ...extra]
  const ids = targets.map((t) => String(t.id))

  let referenced = []
  if (ids.length) {
    const [refs] = await conn.query(
      `SELECT DISTINCT si.item_id, i.code
       FROM chem_train_session_items si
       JOIN chem_train_items i ON i.id=si.item_id
       WHERE si.item_id IN (${ids.map(() => '?').join(',')})`,
      ids,
    )
    referenced = refs
  }
  const refIds = new Set(referenced.map((r) => String(r.item_id)))

  const plan = {
    backupDir: dir,
    fillerCount: filler.length,
    extraCount: extra.length,
    targets: targets.map((t) => ({
      id: String(t.id),
      code: t.code,
      action: refIds.has(String(t.id)) ? 'soft_disable' : 'physical_delete',
    })),
    physicalDelete: targets.filter((t) => !refIds.has(String(t.id))).map((t) => t.code),
    softDisable: targets.filter((t) => refIds.has(String(t.id))).map((t) => t.code),
    referenced,
  }
  fs.writeFileSync(path.join(dir, 'clean_plan.json'), JSON.stringify(plan, null, 2))

  if (!apply) {
    console.log(JSON.stringify({ dryRun: true, ...plan, targetCount: targets.length }, null, 2))
    await conn.end()
    return
  }

  await conn.beginTransaction()
  try {
    let deleted = 0
    let soft = 0
    for (const t of targets) {
      const id = String(t.id)
      if (refIds.has(id)) {
        await conn.query(
          `UPDATE chem_train_items SET is_active=0, ban_default_train=1, verify_blocked=1,
             gate_note=CONCAT(IFNULL(gate_note,''),' [trial_access:block] [personal_open:soft_delete]')
           WHERE id=?`,
          [id],
        )
        soft++
      } else {
        await conn.query(`DELETE FROM chem_train_item_links WHERE item_id=?`, [id])
        await conn.query(`DELETE FROM chem_train_items WHERE id=?`, [id])
        deleted++
      }
    }
    await conn.commit()
    const [[{ total }]] = await conn.query(`SELECT COUNT(1) AS total FROM chem_train_items`)
    const [[{ trialAllow }]] = await conn.query(
      `SELECT COUNT(1) AS trialAllow FROM chem_train_items
       WHERE pool='test' AND status='approved' AND is_active=1
         AND gate_note LIKE '%[trial_access:allow]%'`,
    )
    const result = {
      applied: true,
      backupDir: dir,
      physicalDeleted: deleted,
      softDisabled: soft,
      remainingTotal: Number(total),
      trialAllow: Number(trialAllow),
      deletedCodes: plan.physicalDelete,
      softCodes: plan.softDisable,
    }
    fs.writeFileSync(path.join(OUT, 'clean_result.json'), JSON.stringify(result, null, 2))
    console.log(JSON.stringify(result, null, 2))
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
