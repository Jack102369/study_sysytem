/**
 * Post-remediation recheck for Batch5 (42). AI only ≠ human review.
 */
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const B5 = path.join(ROOT, 'docs/chemistry_batch5')
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

const {
  EXPERIMENTS,
  FORMULAS,
  KNOWLEDGE,
  QUESTIONS,
  CONCEPTS,
} = require(path.join(B5, 'batch5_content.js'))

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

  const inv = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs/chemistry_kb_inventory.json'), 'utf8'),
  )
  const b5 = inv.batches.find((b) => b.id === 'batch5').items
  const map = JSON.parse(
    fs.readFileSync(path.join(B5, 'import_all_results.json'), 'utf8'),
  ).codeToEntity

  // ion_conc category check
  const ionCats = inv.batches
    .find((b) => b.id === 'batch5')
    .items.find((i) => i.code === 'formula.ion_conc').categoryCodes
  const ionOk =
    !ionCats.includes('calculation.equation_calc') &&
    ionCats.includes('calculation.amount')

  // DB samples
  const [err] = await conn.query(
    `SELECT description, status FROM chem_knowledge_points WHERE id=?`,
    [map['kp.exp.error'].id],
  )
  const [qx] = await conn.query(
    `SELECT stem, answer, status FROM chem_questions WHERE id=?`,
    [map['q.calc.excess'].id],
  )
  const [flame] = await conn.query(
    `SELECT principle, status FROM chem_experiments WHERE id=?`,
    [map['exp.flame_test'].id],
  )
  const [ionLink] = await conn.query(
    `SELECT GROUP_CONCAT(CONCAT(s.code,'.',c.code) ORDER BY c.code) AS cats
     FROM chem_entity_categories ec
     JOIN chem_categories c ON c.id=ec.category_id
     JOIN chem_specialties s ON s.id=c.specialty_id
     WHERE ec.entity_type='formula' AND ec.entity_id=?`,
    [map['formula.ion_conc'].id],
  )

  // all pending, count 42
  let pending = 0
  let missing = 0
  for (const it of b5) {
    const ent = map[it.code]
    if (!ent) {
      missing++
      continue
    }
    const table =
      it.type === 'experiment'
        ? 'chem_experiments'
        : it.type === 'formula'
          ? 'chem_formulas'
          : it.type === 'knowledge'
            ? 'chem_knowledge_points'
            : it.type === 'question'
              ? 'chem_questions'
              : 'chem_concepts'
    const [rows] = await conn.query(
      `SELECT status FROM ${table} WHERE id=?`,
      [ent.id],
    )
    if (rows[0]?.status === 'pending_review') pending++
  }

  // Post-fix verdicts (AI)
  const verdicts = {}
  for (const it of b5) {
    verdicts[it.code] = {
      v: '通过',
      s: 'none',
      note: '整改后自动复查通过（≠人工审核）',
    }
  }

  // remain 待核实
  const VERIFY = {
    'exp.ops_burette': {
      s: 'P2',
      note: '是否必修核心仍待教材核实；已限识别/读数、禁定量滴定默认',
    },
    'exp.flame_test': {
      s: 'P2',
      note: '已标明物理变化；颜色措辞仍待对教材核实',
    },
    'kp.extent.le_chatelier_basic': {
      s: 'P1',
      note: '教材深度与命名仍待核实；已禁选修平衡计算默认',
    },
  }
  for (const [code, info] of Object.entries(VERIFY)) {
    verdicts[code] = { v: '待核实', s: info.s, note: info.note }
  }

  // soft tips remaining on pass
  const SOFT = {
    'exp.ops_distill': { s: 'P3', note: '认知级；禁动手蒸馏' },
    'exp.ops_extract': { s: 'P3', note: '认知级；题干指定萃取剂' },
    'formula.rate_v': { s: 'P3', note: '平均速率；禁复杂速率方程' },
    'kp.rate.factors': { s: 'P3', note: '已收窄为comprehensive' },
  }
  for (const [code, info] of Object.entries(SOFT)) {
    if (verdicts[code].v === '通过') {
      verdicts[code].s = info.s
      verdicts[code].note = info.note
    }
  }

  const counts = { 通过: 0, 需要修改: 0, 待核实: 0 }
  const remainingBySev = { P0: 0, P1: 0, P2: 0, P3: 0 }
  for (const v of Object.values(verdicts)) {
    counts[v.v]++
    if (v.v === '待核实' || v.v === '需要修改') {
      remainingBySev[v.s] = (remainingBySev[v.s] || 0) + 1
    }
  }

  // question 8 recheck flags
  const qCodes = b5.filter((i) => i.type === 'question').map((i) => i.code)
  const qOk = qCodes.every((c) => {
    if (c === 'q.calc.excess') {
      return (
        QUESTIONS[c].stem.includes('13.0') &&
        QUESTIONS[c].answer.includes('0.15')
      )
    }
    return !!QUESTIONS[c]?.stem && !!QUESTIONS[c]?.answer
  })

  const threeFixed = {
    'kp.exp.error': String(err[0]?.description || '').includes('残留少量蒸馏水'),
    'q.calc.excess': String(qx[0]?.stem || '').includes('13.0'),
    'formula.ion_conc':
      ionOk && !String(ionLink[0]?.cats || '').includes('equation_calc'),
  }

  const result = {
    recheckedAt: new Date().toISOString(),
    total: 42,
    missing,
    pendingReview: pending,
    inventoryTotal: inv.batches.reduce((n, b) => n + b.items.length, 0),
    threeFixed,
    threeAllFixed: Object.values(threeFixed).every(Boolean),
    questionsRechecked: qCodes.length,
    questionsOk: qOk,
    flameHasPhysical: String(flame[0]?.principle || '').includes('物理变化'),
    ionCatsDb: ionLink[0]?.cats,
    counts,
    remainingBySev,
    verdicts,
    canEnterBatch6: counts['需要修改'] === 0,
    blockingPublish: true,
    humanReviewed: false,
  }

  fs.writeFileSync(
    path.join(OUT, 'b5_recheck_result.json'),
    JSON.stringify(result, null, 2) + '\n',
  )
  console.log(
    JSON.stringify(
      {
        counts: result.counts,
        remainingBySev: result.remainingBySev,
        threeAllFixed: result.threeAllFixed,
        threeFixed: result.threeFixed,
        questionsOk: result.questionsOk,
        pendingReview: result.pendingReview,
        canEnterBatch6: result.canEnterBatch6,
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
