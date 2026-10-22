'use strict'
/** Read-only bank analysis for advanced/challenge model planning */
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
  })

  const [[{ total }]] = await c.query(`SELECT COUNT(*) AS total FROM chem_train_items`)
  const [[{ active }]] = await c.query(
    `SELECT COUNT(*) AS active FROM chem_train_items WHERE is_active=1`,
  )
  const [[{ inactive }]] = await c.query(
    `SELECT COUNT(*) AS inactive FROM chem_train_items WHERE is_active=0`,
  )
  const [byDiffAll] = await c.query(
    `SELECT difficulty, COUNT(*) n FROM chem_train_items GROUP BY difficulty ORDER BY difficulty`,
  )
  const [byDiffActive] = await c.query(
    `SELECT difficulty, COUNT(*) n FROM chem_train_items WHERE is_active=1 GROUP BY difficulty ORDER BY difficulty`,
  )
  const [byDiffTrainable] = await c.query(
    `SELECT difficulty, COUNT(*) n FROM chem_train_items
     WHERE pool='test' AND status='approved' AND is_active=1
       AND gate_note LIKE '%[trial_access:allow]%'
       AND gate_note NOT LIKE '%[trial_access:block]%'
     GROUP BY difficulty ORDER BY difficulty`,
  )
  const [byPool] = await c.query(
    `SELECT pool, status, is_active, COUNT(*) n FROM chem_train_items GROUP BY pool, status, is_active`,
  )
  const [[{ formalApproved }]] = await c.query(
    `SELECT COUNT(*) AS formalApproved FROM chem_train_items
     WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  const [[{ trialAllow }]] = await c.query(
    `SELECT COUNT(*) AS trialAllow FROM chem_train_items
     WHERE pool='test' AND status='approved' AND is_active=1
       AND gate_note LIKE '%[trial_access:allow]%'
       AND gate_note NOT LIKE '%[trial_access:block]%'`,
  )
  const [bySpec] = await c.query(
    `SELECT s.code, s.name,
       SUM(1) AS total,
       SUM(i.is_active=1) AS active,
       SUM(i.is_active=1 AND i.difficulty=1) AS d1,
       SUM(i.is_active=1 AND i.difficulty=2) AS d2,
       SUM(i.is_active=1 AND i.difficulty=3) AS d3,
       SUM(i.pool='test' AND i.status='approved' AND i.is_active=1
           AND i.gate_note LIKE '%[trial_access:allow]%'
           AND i.gate_note NOT LIKE '%[trial_access:block]%') AS trainable,
       SUM(i.pool='test' AND i.status='approved' AND i.is_active=1
           AND i.gate_note LIKE '%[trial_access:allow]%'
           AND i.gate_note NOT LIKE '%[trial_access:block]%'
           AND i.difficulty=1) AS train_d1,
       SUM(i.pool='test' AND i.status='approved' AND i.is_active=1
           AND i.gate_note LIKE '%[trial_access:allow]%'
           AND i.gate_note NOT LIKE '%[trial_access:block]%'
           AND i.difficulty=2) AS train_d2,
       SUM(i.pool='test' AND i.status='approved' AND i.is_active=1
           AND i.gate_note LIKE '%[trial_access:allow]%'
           AND i.gate_note NOT LIKE '%[trial_access:block]%'
           AND i.difficulty=3) AS train_d3
     FROM chem_specialties s
     LEFT JOIN chem_train_items i ON i.specialty_id=s.id
     GROUP BY s.id, s.code, s.name
     ORDER BY s.sort_order, s.id`,
  )
  const [byCat] = await c.query(
    `SELECT s.code AS specialty_code, c.code AS category_code, c.name AS category_name,
       COUNT(i.id) AS total,
       SUM(i.is_active=1) AS active,
       SUM(i.pool='test' AND i.status='approved' AND i.is_active=1
           AND i.gate_note LIKE '%[trial_access:allow]%'
           AND i.gate_note NOT LIKE '%[trial_access:block]%') AS trainable,
       SUM(i.is_active=1 AND i.difficulty=1) AS d1,
       SUM(i.is_active=1 AND i.difficulty=2) AS d2,
       SUM(i.is_active=1 AND i.difficulty=3) AS d3
     FROM chem_categories c
     JOIN chem_specialties s ON s.id=c.specialty_id
     LEFT JOIN chem_train_items i ON i.category_id=c.id
     GROUP BY s.code, c.code, c.name, s.sort_order, c.sort_order
     ORDER BY s.sort_order, c.sort_order`,
  )
  const [byQtype] = await c.query(
    `SELECT qtype, answer_type, COUNT(*) n FROM chem_train_items WHERE is_active=1
     GROUP BY qtype, answer_type ORDER BY n DESC`,
  )
  const [templates] = await c.query(
    `SELECT
       CASE
         WHEN code LIKE 'train.ai_trial.pa.%' THEN SUBSTRING_INDEX(SUBSTRING_INDEX(code,'.',4),'.',-1)
         WHEN code LIKE 'train.ai_trial.cov.%' THEN 'cov_filler'
         WHEN code LIKE 'train.test.%' THEN 'legacy_seed'
         ELSE 'other'
       END AS template_group,
       COUNT(*) n,
       SUM(is_active=1) active_n
     FROM chem_train_items
     GROUP BY template_group
     ORDER BY n DESC`,
  )
  const [gateQa] = await c.query(
    `SELECT
       SUM(gate_note LIKE '%[qa:pass]%') pass,
       SUM(gate_note LIKE '%[qa:fix]%') fix,
       SUM(gate_note LIKE '%[qa:verify]%' OR gate_note LIKE '%[qa:needs_verification]%') verify,
       SUM(gate_note LIKE '%[trial_access:allow]%') allow,
       SUM(gate_note LIKE '%[trial_access:block]%') block
     FROM chem_train_items WHERE is_active=1`,
  )

  // heuristic: memory-like stems
  const [[{ memoryLike }]] = await c.query(
    `SELECT COUNT(*) AS memoryLike FROM chem_train_items
     WHERE is_active=1 AND (
       stem LIKE '%判断正误%' AND (stem LIKE '%元素符号%' OR stem LIKE '%颜色%' OR stem LIKE '%俗称%' OR stem LIKE '%化学式%')
       OR code LIKE '%el_sym%' OR code LIKE '%color%' OR code LIKE '%memory%'
     )`,
  )

  const out = {
    total: Number(total),
    active: Number(active),
    inactive: Number(inactive),
    formalApprovedActive: Number(formalApproved),
    personalTrainable: Number(trialAllow),
    byDiffAll,
    byDiffActive,
    byDiffTrainable,
    byPool,
    bySpecialty: bySpec,
    categoriesWithZeroTrainable: byCat.filter((x) => Number(x.trainable || 0) === 0).length,
    categoriesTotal: byCat.length,
    byCategoryTop: byCat
      .filter((x) => Number(x.trainable || 0) > 0)
      .sort((a, b) => Number(b.trainable) - Number(a.trainable))
      .slice(0, 40),
    byCategoryEmptyPriority: byCat
      .filter((x) =>
        ['calculation', 'redox', 'ion', 'experiment', 'inference', 'comprehensive'].includes(
          x.specialty_code,
        ),
      )
      .map((x) => ({
        specialty: x.specialty_code,
        category: x.category_code,
        name: x.category_name,
        trainable: Number(x.trainable || 0),
        d1: Number(x.d1 || 0),
        d2: Number(x.d2 || 0),
        d3: Number(x.d3 || 0),
      })),
    byQtype,
    templates,
    gateQa: gateQa[0],
    memoryLikeHeuristic: Number(memoryLike),
  }
  fs.mkdirSync(path.dirname(__filename), { recursive: true })
  fs.writeFileSync(path.join(__dirname, 'bank_snapshot.json'), JSON.stringify(out, null, 2))
  console.log(JSON.stringify(out, null, 2))
  await c.end()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
