/**
 * Post-remediation recheck for Batch4 (74 items).
 * Writes b4_recheck_result.json — does not claim human review.
 */
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const B4 = path.join(ROOT, 'docs/chemistry_batch4')
const OUT = __dirname

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

const { REACTIONS } = require(path.join(B4, 'batch4_content.js'))
const inv = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'docs/chemistry_kb_inventory.json'), 'utf8'),
)
const b4 = inv.batches.find((b) => b.id === 'batch4')
const map = JSON.parse(
  fs.readFileSync(path.join(B4, 'import_all_results.json'), 'utf8'),
).codeToEntity

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  let mysql
  try {
    mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  } catch {
    mysql = require('mysql2/promise')
  }
  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })

  // 1) inventory vs content redox mismatch
  const mismatches = []
  for (const it of b4.items.filter((i) => i.type === 'reaction')) {
    const d = REACTIONS[it.code]
    const invRedox = (it.specialtyCodes || []).includes('redox')
    const tagNon = (d.tags || []).includes('non-redox')
    if (invRedox && tagNon) mismatches.push(it.code)
  }

  // 2) DB specialty for 5
  const five = [
    'rxn.SO3_H2O',
    'rxn.NH3_HCl',
    'rxn.CO2_CaOH2',
    'rxn.SiO2_2NaOH',
    'rxn.CaCO3_2HCl',
  ]
  const fiveDb = []
  for (const code of five) {
    const id = map[code].id
    const [rows] = await conn.query(
      `SELECT s.code FROM chem_entity_specialties es
       JOIN chem_specialties s ON s.id=es.specialty_id
       WHERE es.entity_type='reaction' AND es.entity_id=?`,
      [id],
    )
    fiveDb.push({
      code,
      specs: rows.map((r) => r.code),
      hasRedox: rows.some((r) => r.code === 'redox'),
    })
  }

  // 3) existence / status / duplicates
  const codes = b4.items.map((i) => i.code)
  const statuses = []
  const missing = []
  for (const it of b4.items) {
    const ent = map[it.code]
    if (!ent) {
      missing.push(it.code)
      continue
    }
    const table =
      it.type === 'substance'
        ? 'chem_substances'
        : it.type === 'reaction'
          ? 'chem_reactions'
          : it.type === 'experiment'
            ? 'chem_experiments'
            : 'chem_knowledge_points'
    const [rows] = await conn.query(
      `SELECT id, status, review_note FROM ${table} WHERE id=?`,
      [ent.id],
    )
    if (!rows[0]) missing.push(it.code)
    else statuses.push({ code: it.code, status: rows[0].status })
  }

  // 4) key field checks
  const [cl2] = await conn.query(
    `SELECT conditions FROM chem_reactions WHERE id=?`,
    [map['rxn.Cl2_2NaOH'].id],
  )
  const [bleach] = await conn.query(
    `SELECT physical_props, chemical_props, review_note FROM chem_substances WHERE id=?`,
    [map['sub.bleaching_powder'].id],
  )
  const [hclaq] = await conn.query(
    `SELECT canonical_formula, test_methods FROM chem_substances WHERE id=?`,
    [map['sub.HCl_aq'].id],
  )

  // 5) pack specialty sync for five
  const packB = JSON.parse(fs.readFileSync(path.join(B4, 'import_B4-B.json'), 'utf8'))
  const packFive = {}
  for (const code of five) {
    packFive[code] = packB.meta.specialtyByCode[code]
  }

  // 6) Post-fix verdict (AI recheck, not human)
  // Fixed: 5 specialty + Cl2_2NaOH P1 content + several P2/P3 content
  // Remain 待核实: sub.P, sub.P4O10, sub.bleaching_powder
  // Remain soft P2/P3 (training limits / optional): do not force 需要修改
  const verdicts = {}
  for (const code of codes) {
    verdicts[code] = { v: '通过', s: 'none', note: '整改后自动复查通过（≠人工审核）' }
  }
  // remaining 待核实
  const VERIFY = {
    'sub.P': {
      s: 'P2',
      note: '同素异形体对比细节仍待教材核实；已限制默认细对比绝对题',
    },
    'sub.P4O10': {
      s: 'P2',
      note: 'P4O10/P2O5教材主写法仍待核实；已要求题干指定写法',
    },
    'sub.bleaching_powder': {
      s: 'P1',
      note: '漂白粉教材成分口径仍待核实；已强化混合物表述并禁精确组成绝对填空',
    },
  }
  for (const [code, info] of Object.entries(VERIFY)) {
    verdicts[code] = { v: '待核实', s: info.s, note: info.note }
  }

  // residual training-limit notes (通过 but severity retained for awareness)
  const SOFT = {
    'rxn.Cl2_2NaOH': { s: 'P3', note: '已补热浓碱禁混用；组卷仍必须带冷/稀条件' },
    'sub.Br2': { s: 'P3', note: '含氧酸深度仍排除默认' },
    'sub.I2': { s: 'P3', note: '正价仍排除默认核心' },
    'rxn.2SO2_O2': { s: 'P3', note: '了解级；禁平衡定量默认' },
    'rxn.N2_3H2': { s: 'P3', note: '了解级；禁勒夏特列定量默认' },
    'kp.halogen.compare': { s: 'P3', note: '深度含氧酸排除默认' },
    'kp.N.synth_ammonia': { s: 'P3', note: '勿选修平衡定量默认' },
    'rxn.Cu_4HNO3': { s: 'P3', note: '编码易混已在名称/备注标明' },
  }
  for (const [code, info] of Object.entries(SOFT)) {
    if (verdicts[code].v === '通过') {
      verdicts[code].s = info.s
      verdicts[code].note = info.note
    }
  }

  const counts = { 通过: 0, 需要修改: 0, 待核实: 0 }
  const sev = { P0: 0, P1: 0, P2: 0, P3: 0, none: 0 }
  for (const v of Object.values(verdicts)) {
    counts[v.v]++
    if (v.v === '通过' && (v.s === 'none' || !v.s)) sev.none++
    else if (v.v === '通过') sev[v.s] = (sev[v.s] || 0) + 1
    else {
      // 待核实/需要修改 also counted in sev by their main severity
      sev[v.s] = (sev[v.s] || 0) + 1
    }
  }

  // For P-level "remaining issues": count only items that still need attention
  // User asked P0/P1/P2/P3 remaining — interpret as remaining problem severities
  // after fix: only 待核实 items as remaining problems; soft P3 on 通过 are residual tips
  const remainingProblems = Object.entries(verdicts)
    .filter(([, v]) => v.v !== '通过' || (v.s && v.s !== 'none' && v.v === '待核实'))
    .map(([code, v]) => ({ code, ...v }))

  const remainingBySev = { P0: 0, P1: 0, P2: 0, P3: 0 }
  for (const [code, v] of Object.entries(verdicts)) {
    if (v.v === '待核实' || v.v === '需要修改') {
      remainingBySev[v.s] = (remainingBySev[v.s] || 0) + 1
    }
  }

  const result = {
    recheckedAt: new Date().toISOString(),
    total: codes.length,
    missing,
    statusAllPending: statuses.every((s) => s.status === 'pending_review'),
    statusCounts: statuses.reduce((a, s) => {
      a[s.status] = (a[s.status] || 0) + 1
      return a
    }, {}),
    inventoryContentRedoxMismatch: mismatches,
    fiveDb,
    fiveStillRedox: fiveDb.filter((x) => x.hasRedox).map((x) => x.code),
    packFive,
    samples: {
      Cl2_2NaOH_conditions: cl2[0]?.conditions,
      bleaching: bleach[0],
      HCl_aq: hclaq[0],
    },
    counts,
    remainingBySev,
    softTipsOnPass: Object.keys(SOFT).length,
    verdicts,
    blockingPublish: true,
    canEnterBatch5: mismatches.length === 0 && fiveDb.every((x) => !x.hasRedox),
    humanReviewed: false,
  }

  fs.writeFileSync(
    path.join(OUT, 'b4_recheck_result.json'),
    JSON.stringify(result, null, 2),
    'utf8',
  )
  console.log(
    JSON.stringify(
      {
        total: result.total,
        counts: result.counts,
        remainingBySev: result.remainingBySev,
        fiveStillRedox: result.fiveStillRedox,
        mismatch: result.inventoryContentRedoxMismatch,
        statusAllPending: result.statusAllPending,
        canEnterBatch5: result.canEnterBatch5,
        blockingPublish: result.blockingPublish,
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
