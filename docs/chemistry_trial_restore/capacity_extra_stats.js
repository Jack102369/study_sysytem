'use strict'
/**
 * Extra read-only stats for capacity report (unused KB by type, UI eligible).
 *   node docs/chemistry_trial_restore/capacity_extra_stats.js
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
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const wl = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs/chemistry_deepseek_audit/publish_whitelist.json'), 'utf8'),
  )
  const pending = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs/chemistry_deepseek_audit/pending_review_all.json'), 'utf8'),
  )
  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME || env.DB_DATABASE,
    charset: 'utf8mb4',
  })

  const [links] = await conn.query('SELECT * FROM chem_train_item_links')
  const codeByEntity = new Map()
  for (const it of pending.items || []) {
    codeByEntity.set(`${it.type}:${it.dbId}`, it.code)
  }
  for (const w of wl.items || []) {
    codeByEntity.set(`${w.type}:${w.dbId}`, w.code)
  }

  const usedCodes = new Set()
  const qpc = new Map()
  for (const l of links) {
    const c = codeByEntity.get(`${l.entity_type}:${l.entity_id}`)
    if (!c) continue
    usedCodes.add(c)
    qpc.set(c, (qpc.get(c) || 0) + 1)
  }

  // FIX skip from second review
  const fixSkip = new Set([
    'rxn.2Na2O2_2H2O',
    'rxn.2Na2O2_2CO2',
    'rxn.2Al_6HCl',
    'rxn.3Fe_2O2',
    'rxn.Fe_H2SO4',
    'rxn.Cu_2H2SO4',
    'rxn.C_2H2SO4',
    'rxn.N2_3H2',
    'rxn.Cu_4HNO3',
    'rxn.Cu_4HNO3c',
    'exp.CO2_prep_marble',
    'q.eq.Na_water',
  ])
  const srPath = path.join(
    ROOT,
    'docs/chemistry_deepseek_audit/second_review/second_review_results.json',
  )
  if (fs.existsSync(srPath)) {
    const sr = JSON.parse(fs.readFileSync(srPath, 'utf8'))
    for (const r of sr.results || []) {
      if (r.conclusion === 'NEEDS_FIX') fixSkip.add(r.code)
    }
  }

  const byType = {}
  const usedByType = {}
  const unusedByType = {}
  const fixSkippedInWl = []
  const multiLink = []
  const unusedByTypeCodes = {}

  for (const it of wl.items) {
    byType[it.type] = (byType[it.type] || 0) + 1
    const n = qpc.get(it.code) || 0
    if (fixSkip.has(it.code)) {
      fixSkippedInWl.push(it.code)
    }
    if (n > 0) {
      usedByType[it.type] = (usedByType[it.type] || 0) + 1
      if (n >= 2) multiLink.push({ code: it.code, type: it.type, n })
    } else {
      unusedByType[it.type] = (unusedByType[it.type] || 0) + 1
      if (!unusedByTypeCodes[it.type]) unusedByTypeCodes[it.type] = []
      unusedByTypeCodes[it.type].push(it.code)
    }
  }

  const [specs] = await conn.query(
    'SELECT id, code, name FROM chem_specialties ORDER BY sort_order, id',
  )
  const uiEligible = []
  for (const sp of specs) {
    const [cats] = await conn.query(
      'SELECT id, code FROM chem_categories WHERE specialty_id=? ORDER BY sort_order, id LIMIT 1',
      [sp.id],
    )
    const cat = cats[0]
    if (!cat) continue
    let [rows] = await conn.query(
      "SELECT COUNT(1) AS c FROM chem_train_items WHERE specialty_id=? AND category_id=? AND difficulty=1 AND pool='test' AND status='approved' AND is_active=1",
      [sp.id, cat.id],
    )
    let c = Number(rows[0].c)
    let mode = 'exact_d1'
    if (!c) {
      ;[rows] = await conn.query(
        "SELECT COUNT(1) AS c FROM chem_train_items WHERE specialty_id=? AND category_id=? AND pool='test' AND status='approved' AND is_active=1",
        [sp.id, cat.id],
      )
      c = Number(rows[0].c)
      mode = 'same_cat'
    }
    if (!c) {
      ;[rows] = await conn.query(
        "SELECT COUNT(1) AS c FROM chem_train_items WHERE specialty_id=? AND pool='test' AND status='approved' AND is_active=1",
        [sp.id],
      )
      c = Number(rows[0].c)
      mode = 'same_spec_fallback'
    }
    uiEligible.push({
      specialty: sp.code,
      name: sp.name,
      firstCategory: cat.code,
      eligible: c,
      mode,
    })
  }

  const out = {
    whitelistTotal: wl.items.length,
    byType,
    usedByType,
    unusedByType,
    usedTotal: usedCodes.size,
    unusedTotal: wl.items.length - usedCodes.size,
    multiLinkCount: multiLink.length,
    multiLink,
    fixSkippedInWhitelist: fixSkippedInWl,
    unusedByTypeSample: Object.fromEntries(
      Object.entries(unusedByTypeCodes).map(([t, arr]) => [t, arr.slice(0, 8)]),
    ),
    uiEligibleDefaultFirstCatD1: uiEligible,
  }
  fs.writeFileSync(path.join(__dirname, 'capacity_extra_stats.json'), JSON.stringify(out, null, 2))
  console.log(JSON.stringify(out, null, 2))
  await conn.end()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
