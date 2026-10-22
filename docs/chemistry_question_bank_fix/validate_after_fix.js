'use strict'
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
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const c = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })

  const [[{ total }]] = await c.query(`SELECT COUNT(1) AS total FROM chem_train_items`)
  const [[{ formal }]] = await c.query(
    `SELECT COUNT(1) AS formal FROM chem_train_items WHERE pool='formal'`,
  )
  const [[{ fillerActive }]] = await c.query(
    `SELECT COUNT(1) AS fillerActive FROM chem_train_items
     WHERE code LIKE 'train.ai_trial.cov.%' AND is_active=1`,
  )
  const [[{ fillerTotal }]] = await c.query(
    `SELECT COUNT(1) AS fillerTotal FROM chem_train_items WHERE code LIKE 'train.ai_trial.cov.%'`,
  )
  const [[{ trialAllow }]] = await c.query(
    `SELECT COUNT(1) AS trialAllow FROM chem_train_items
     WHERE pool='test' AND status='approved' AND is_active=1
       AND gate_note LIKE '%[trial_access:allow]%'`,
  )
  const [[{ trialBlock }]] = await c.query(
    `SELECT COUNT(1) AS trialBlock FROM chem_train_items
     WHERE gate_note LIKE '%[trial_access:block]%'`,
  )
  const [[{ withLinks }]] = await c.query(
    `SELECT COUNT(DISTINCT item_id) AS withLinks FROM chem_train_item_links`,
  )
  const noLinkCodes = [
    'train.test.eq.tf.01',
    'train.test.eq.single.01',
    'train.ai_trial.eq.balance.01',
    'train.ai_trial.eq.write.02',
    'train.ai_trial.eq.conversion.01',
  ]
  const [linkCheck] = await c.query(
    `SELECT i.code, COUNT(l.id) AS n
     FROM chem_train_items i
     LEFT JOIN chem_train_item_links l ON l.item_id=i.id
     WHERE i.code IN (${noLinkCodes.map(() => '?').join(',')})
     GROUP BY i.code`,
    noLinkCodes,
  )
  const [[{ write02 }]] = await c.query(
    `SELECT answer_type AS write02 FROM chem_train_items WHERE code='train.ai_trial.eq.write.02'`,
  )
  // ensure write.02 is chem_formula
  if (write02 !== 'chem_formula') {
    await c.query(
      `UPDATE chem_train_items SET answer_type='chem_formula' WHERE code='train.ai_trial.eq.write.02'`,
    )
  }

  const [bySpec] = await c.query(
    `SELECT s.code, COUNT(1) AS n FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     WHERE i.pool='test' AND i.status='approved' AND i.is_active=1
       AND i.gate_note LIKE '%[trial_access:allow]%'
     GROUP BY s.code ORDER BY n DESC`,
  )
  const [byDiff] = await c.query(
    `SELECT difficulty, COUNT(1) AS n FROM chem_train_items
     WHERE pool='test' AND status='approved' AND is_active=1
       AND gate_note LIKE '%[trial_access:allow]%'
     GROUP BY difficulty`,
  )
  const [[{ cats }]] = await c.query(
    `SELECT COUNT(DISTINCT CONCAT(specialty_id,'-',category_id)) AS cats
     FROM chem_train_items
     WHERE pool='test' AND status='approved' AND is_active=1
       AND gate_note LIKE '%[trial_access:allow]%'`,
  )
  const [[{ sessions }]] = await c.query(
    `SELECT COUNT(1) AS sessions FROM chem_train_sessions`,
  )
  const [[{ sessionItems }]] = await c.query(
    `SELECT COUNT(1) AS sessionItems FROM chem_train_session_items`,
  )

  const [vc] = await c.query(
    `SELECT
       SUM(gate_note LIKE '%[verify_class:kb_pending]%') AS kb_pending,
       SUM(gate_note LIKE '%[verify_class:science]%') AS science,
       SUM(gate_note LIKE '%[verify_class:qtype_limit]%') AS qtype_limit,
       SUM(gate_note LIKE '%[verify_class:curriculum]%') AS curriculum,
       SUM(gate_note LIKE '%[qa:NEEDS_VERIFICATION]%') AS qa_verify
     FROM chem_train_items`,
  )

  const out = {
    total: Number(total),
    formal: Number(formal),
    fillerTotal: Number(fillerTotal),
    fillerActive: Number(fillerActive),
    trialAllow: Number(trialAllow),
    trialBlock: Number(trialBlock),
    itemsWithLinks: Number(withLinks),
    linkCheck,
    write02AnswerType: write02,
    specialtiesWithTrial: bySpec.length,
    bySpec,
    byDiff,
    categoriesWithTrial: Number(cats),
    sessions: Number(sessions),
    sessionItems: Number(sessionItems),
    verifyClass: vc[0],
  }
  fs.writeFileSync(path.join(__dirname, 'validate_result.json'), JSON.stringify(out, null, 2))
  console.log(JSON.stringify(out, null, 2))
  await c.end()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
