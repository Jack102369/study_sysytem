'use strict'
/** 只读探测：定位原有574题与来源式解析占比。不写库。 */
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

function isS60(row) {
  const code = String(row.code || '')
  const note = String(row.gate_note || '')
  return /^train\.ai_trial\.s60\./i.test(code) || /\[s60\]/i.test(note)
}

function isSourceOnlyAnalysis(a) {
  const t = String(a || '').trim()
  if (!t) return true
  if (/^来源\s+\S+/.test(t) && t.length < 120) return true
  if (/^来源\s+\S+\s*(字段|；|;)/.test(t)) return true
  if (/^来源\s+\S+\s*$/.test(t)) return true
  return false
}

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })

  const [all] = await conn.query(
    `SELECT i.id, i.code, i.pool, i.status, i.is_active, i.difficulty, i.analysis, i.gate_note,
            i.qtype, s.code AS specialty_code, c.code AS category_code
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id`,
  )

  const total = all.length
  const s60 = all.filter(isS60)
  const eligible = all.filter(
    (r) =>
      r.pool === 'test' &&
      r.status === 'approved' &&
      Number(r.is_active) === 1 &&
      !/\[trial_access:block\]/i.test(String(r.gate_note || '')) &&
      !isS60(r),
  )

  const byDiff = {}
  const bySpec = {}
  let sourceOnly = 0
  let emptyA = 0
  for (const r of eligible) {
    byDiff[r.difficulty] = (byDiff[r.difficulty] || 0) + 1
    bySpec[r.specialty_code] = (bySpec[r.specialty_code] || 0) + 1
    const a = String(r.analysis || '').trim()
    if (!a) emptyA++
    if (isSourceOnlyAnalysis(r.analysis)) sourceOnly++
  }

  const samples = eligible
    .filter((r) => isSourceOnlyAnalysis(r.analysis))
    .slice(0, 5)
    .map((r) => ({
      id: String(r.id),
      code: r.code,
      specialty: r.specialty_code,
      difficulty: r.difficulty,
      analysis: String(r.analysis || '').slice(0, 100),
    }))

  const [[linkCnt]] = await conn.query(
    `SELECT COUNT(DISTINCT l.item_id) AS n
     FROM chem_train_item_links l
     JOIN chem_train_items i ON i.id=l.item_id
     WHERE i.pool='test' AND i.is_active=1
       AND i.code NOT LIKE 'train.ai_trial.s60.%'
       AND IFNULL(i.gate_note,'') NOT LIKE '%[s60]%'`,
  )

  console.log(
    JSON.stringify(
      {
        totalItems: total,
        s60Count: s60.length,
        oldEligibleApprox574: eligible.length,
        byDiff,
        bySpecialty: bySpec,
        emptyAnalysis: emptyA,
        sourceOnlyHeuristic: sourceOnly,
        linkedDistinct: Number(linkCnt.n),
        samples,
      },
      null,
      2,
    ),
  )
  await conn.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
