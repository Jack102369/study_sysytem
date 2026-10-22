'use strict'
const fs = require('fs')
const path = require('path')
const ROOT = path.resolve(__dirname, '../../..')
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
  const wl = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs/chemistry_deepseek_audit/publish_whitelist.json'), 'utf8'),
  )
  const pending = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs/chemistry_deepseek_audit/pending_review_all.json'), 'utf8'),
  )
  const c = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })

  const [items] = await c.query('SELECT * FROM chem_train_items')
  const [links] = await c.query('SELECT * FROM chem_train_item_links')
  const [specs] = await c.query('SELECT id, code, name FROM chem_specialties')
  const [cats] = await c.query('SELECT id, specialty_id, code, name FROM chem_categories')
  const specById = new Map(specs.map((s) => [String(s.id), s]))
  const catById = new Map(cats.map((x) => [String(x.id), x]))

  const active = items.filter((i) => i.pool === 'test' && i.status === 'approved' && i.is_active)
  const formal = items.filter((i) => i.pool === 'formal')
  const pa = items.filter((i) => String(i.code).startsWith('train.ai_trial.pa.'))
  const cov = items.filter((i) => String(i.code).startsWith('train.ai_trial.cov.'))
  const seed = items.filter((i) => String(i.code).startsWith('train.test.'))
  const chemFormula = pa.filter((i) => i.answer_type === 'chem_formula')

  const byDiff = { 1: 0, 2: 0, 3: 0 }
  const byQ = {}
  const bySpec = {}
  for (const s of specs) bySpec[s.code] = 0
  const byCat = {}
  for (const it of active) {
    byDiff[it.difficulty] = (byDiff[it.difficulty] || 0) + 1
    byQ[it.qtype] = (byQ[it.qtype] || 0) + 1
    const sp = specById.get(String(it.specialty_id))
    if (sp) bySpec[sp.code] = (bySpec[sp.code] || 0) + 1
    const cat = catById.get(String(it.category_id))
    if (sp && cat) {
      const k = `${sp.code}.${cat.code}`
      byCat[k] = (byCat[k] || 0) + 1
    }
  }

  const codeByEntity = new Map()
  for (const it of pending.items || []) codeByEntity.set(`${it.type}:${it.dbId}`, it.code)
  for (const w of wl.items || []) codeByEntity.set(`${w.type}:${w.dbId}`, w.code)
  const used = new Set()
  for (const l of links) {
    const code = codeByEntity.get(`${l.entity_type}:${l.entity_id}`)
    if (code) used.add(code)
  }
  const byType = {}
  const usedBy = {}
  for (const w of wl.items) {
    byType[w.type] = (byType[w.type] || 0) + 1
    if (used.has(w.code)) usedBy[w.type] = (usedBy[w.type] || 0) + 1
  }

  // stem dup check among active
  const stems = new Map()
  let stemDups = 0
  for (const it of active) {
    const k = String(it.stem).replace(/^【AI试运行】/, '').replace(/\s+/g, '')
    if (stems.has(k)) stemDups++
    else stems.set(k, it.code)
  }

  // kb status unchanged sample
  const [pub] = await c.query(
    `SELECT status, COUNT(1) c FROM chem_substances GROUP BY status`,
  )

  const out = {
    total: items.length,
    formal: formal.length,
    testActive: active.length,
    phaseAInserted: pa.length,
    covTotal: cov.length,
    covActive: cov.filter((i) => i.is_active).length,
    seedActive: seed.filter((i) => i.is_active).length,
    chemFormulaBlanks: chemFormula.length,
    byDiff,
    byQ,
    bySpec,
    categoriesFilled: Object.keys(byCat).length,
    categoriesTotal: cats.length,
    specialtiesWithQuestions: Object.values(bySpec).filter((n) => n > 0).length,
    whitelistUsed: used.size,
    usedByType: usedBy,
    byTypeTotal: byType,
    stemDupsAmongActive: stemDups,
    substanceStatusSample: pub,
  }
  fs.writeFileSync(path.join(__dirname, 'post_stats.json'), JSON.stringify(out, null, 2))
  console.log(JSON.stringify(out, null, 2))
  await c.end()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
