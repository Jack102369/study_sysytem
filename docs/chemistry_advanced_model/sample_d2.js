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
  })
  const [rows] = await c.query(
    `SELECT i.id, i.code, i.qtype, i.difficulty, i.stem, i.answer, i.gate_note,
            s.code AS specialty, c.code AS category
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id
     WHERE i.is_active=1 AND i.difficulty=2
       AND i.pool='test' AND i.status='approved'
       AND i.gate_note LIKE '%[trial_access:allow]%'
     ORDER BY s.sort_order, i.id`,
  )
  // stratified sample: up to 8 per specialty, max 48
  const by = new Map()
  for (const r of rows) {
    if (!by.has(r.specialty)) by.set(r.specialty, [])
    by.get(r.specialty).push(r)
  }
  const sample = []
  for (const [sp, list] of by) {
    const step = Math.max(1, Math.floor(list.length / 8))
    let taken = 0
    for (let i = 0; i < list.length && taken < 8; i += step) {
      sample.push(list[i])
      taken++
    }
  }
  // heuristic classify by code/template
  function classify(r) {
    const code = r.code || ''
    const stem = r.stem || ''
    if (/oxidant|reductant|is_redox|eq_identify|chem_prop|misconception|not_marked/.test(code)) {
      return 'single_step_recognition'
    }
    if (/el_|symbol|color|uses_judge|cond_judge|formula|common_name|kp_fact|concept_fact|stp_judge|c_unit|home_forbidden|obs_judge/.test(code)) {
      return 'memory_or_fact'
    }
    if (stem.includes('计算') || stem.includes('多少') || /\d+\s*g|\d+\s*mol|物质的量/.test(stem)) {
      return 'possible_multi_step'
    }
    if (stem.length > 120 && (stem.includes('若') || stem.includes('则') || stem.includes('由此'))) {
      return 'possible_multi_step'
    }
    return 'single_step_recognition'
  }
  const labeled = sample.map((r) => ({
    id: String(r.id),
    code: r.code,
    specialty: r.specialty,
    category: r.category,
    qtype: r.qtype,
    stemPreview: String(r.stem).slice(0, 160),
    capabilityLabel: classify(r),
  }))
  const summary = {
    totalD2Trainable: rows.length,
    sampleSize: labeled.length,
    byLabel: {},
    bySpecialtySample: {},
  }
  for (const x of labeled) {
    summary.byLabel[x.capabilityLabel] = (summary.byLabel[x.capabilityLabel] || 0) + 1
    if (!summary.bySpecialtySample[x.specialty]) {
      summary.bySpecialtySample[x.specialty] = { n: 0, labels: {} }
    }
    summary.bySpecialtySample[x.specialty].n++
    summary.bySpecialtySample[x.specialty].labels[x.capabilityLabel] =
      (summary.bySpecialtySample[x.specialty].labels[x.capabilityLabel] || 0) + 1
  }
  // full d2 by template heuristic
  const fullLabels = { memory_or_fact: 0, single_step_recognition: 0, possible_multi_step: 0 }
  for (const r of rows) {
    fullLabels[classify(r)]++
  }
  const out = { summary, fullD2Heuristic: fullLabels, sample: labeled }
  fs.writeFileSync(path.join(__dirname, 'd2_capability_sample.json'), JSON.stringify(out, null, 2))
  console.log(JSON.stringify({ summary, fullD2Heuristic: fullLabels }, null, 2))
  await c.end()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
