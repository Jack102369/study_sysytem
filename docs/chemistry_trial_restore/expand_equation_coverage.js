/**
 * Seed safe AI-trial questions into high-traffic equation categories
 * so 「方程式配平」等入口也有题可做。
 *
 *   node docs/chemistry_trial_restore/expand_equation_coverage.js
 */
'use strict'
const fs = require('fs')
const path = require('path')
const ROOT = path.resolve(__dirname, '../..')

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

const SEEDS = [
  {
    code: 'train.ai_trial.eq.balance.01',
    cat: 'balance',
    qtype: 'judge',
    stem: '【AI试运行】配平化学方程式时必须遵守原子种类与数目守恒。判断正误。',
    answer: '正确',
    aliases: ['对', 'T', 'true', '√'],
  },
  {
    code: 'train.ai_trial.eq.balance.02',
    cat: 'balance',
    qtype: 'single',
    stem: '【AI试运行】配平化学方程式时，下列做法正确的是？',
    options: [
      { key: 'A', text: '可以随意改变化学式来凑平' },
      { key: 'B', text: '只能通过调整计量数使原子守恒' },
      { key: 'C', text: '可以添加不存在的生成物' },
      { key: 'D', text: '不必考虑原子守恒' },
    ],
    answer: 'B',
  },
  {
    code: 'train.ai_trial.eq.balance.03',
    cat: 'balance',
    qtype: 'judge',
    stem: '【AI试运行】配平后方程式左右两边原子种类可以不同。判断正误。',
    answer: '错误',
    aliases: ['错', 'F', 'false', '×'],
  },
  {
    code: 'train.ai_trial.eq.balance.04',
    cat: 'balance',
    qtype: 'blank',
    stem: '【AI试运行】配平化学方程式的核心依据是____守恒。（填：原子）',
    answer: '原子',
    aliases: ['原子守恒', '质量'],
  },
  {
    code: 'train.ai_trial.eq.balance.05',
    cat: 'balance',
    qtype: 'judge',
    stem: '【AI试运行】离子方程式配平还需要满足电荷守恒。判断正误。',
    answer: '正确',
    aliases: ['对', 'T', 'true', '√'],
  },
  {
    code: 'train.ai_trial.eq.condition.01',
    cat: 'condition',
    qtype: 'judge',
    stem: '【AI试运行】反应条件会影响某些反应的产物种类。判断正误。',
    answer: '正确',
    aliases: ['对', 'T', 'true', '√'],
  },
  {
    code: 'train.ai_trial.eq.condition.02',
    cat: 'condition',
    qtype: 'single',
    stem: '【AI试运行】钠在空气中常温氧化与点燃燃烧的主要产物不同，说明了？',
    options: [
      { key: 'A', text: '反应条件不同可能导致产物不同' },
      { key: 'B', text: '化学方程式不必写条件' },
      { key: 'C', text: '所有反应产物都唯一且与条件无关' },
      { key: 'D', text: '钠不能与氧气反应' },
    ],
    answer: 'A',
  },
  {
    code: 'train.ai_trial.eq.condition.03',
    cat: 'condition',
    qtype: 'judge',
    stem: '【AI试运行】书写化学方程式时，重要反应条件通常需要注明。判断正误。',
    answer: '正确',
    aliases: ['对', 'T', 'true', '√'],
  },
  {
    code: 'train.ai_trial.eq.write.01',
    cat: 'write_from_text',
    qtype: 'judge',
    stem: '【AI试运行】根据文字描述书写化学方程式时，必须配平。判断正误。',
    answer: '正确',
    aliases: ['对', 'T', 'true', '√'],
  },
  {
    code: 'train.ai_trial.eq.write.02',
    cat: 'write_from_text',
    qtype: 'blank',
    stem: '【AI试运行】水的化学式是____。',
    answer: 'H2O',
    aliases: ['H₂O'],
  },
  {
    code: 'train.ai_trial.eq.product.01',
    cat: 'complete_product',
    qtype: 'judge',
    stem: '【AI试运行】补全生成物时必须保证原子守恒。判断正误。',
    answer: '正确',
    aliases: ['对', 'T', 'true', '√'],
  },
  {
    code: 'train.ai_trial.eq.reactant.01',
    cat: 'complete_reactant',
    qtype: 'judge',
    stem: '【AI试运行】补全反应物时可以随意改变化学式。判断正误。',
    answer: '错误',
    aliases: ['错', 'F', 'false', '×'],
  },
  {
    code: 'train.ai_trial.eq.ionic_write.01',
    cat: 'ionic_write',
    qtype: 'judge',
    stem: '【AI试运行】书写离子方程式时，强酸、强碱、可溶性盐通常拆成离子。判断正误。',
    answer: '正确',
    aliases: ['对', 'T', 'true', '√'],
  },
  {
    code: 'train.ai_trial.eq.ionic_correct.01',
    cat: 'ionic_correct',
    qtype: 'judge',
    stem: '【AI试运行】离子方程式除原子守恒外还须电荷守恒。判断正误。',
    answer: '正确',
    aliases: ['对', 'T', 'true', '√'],
  },
  {
    code: 'train.ai_trial.eq.redox_analysis.01',
    cat: 'redox_analysis',
    qtype: 'judge',
    stem: '【AI试运行】有化合价升降的反应属于氧化还原反应。判断正误。',
    answer: '正确',
    aliases: ['对', 'T', 'true', '√'],
  },
  {
    code: 'train.ai_trial.eq.conversion.01',
    cat: 'conversion',
    qtype: 'judge',
    stem: '【AI试运行】物质转化关系可用化学方程式表达。判断正误。',
    answer: '正确',
    aliases: ['对', 'T', 'true', '√'],
  },
]

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })

  const [[sp]] = await conn.query(
    `SELECT id FROM chem_specialties WHERE code='equation' LIMIT 1`,
  )
  if (!sp) throw new Error('equation specialty missing')

  const [cats] = await conn.query(
    `SELECT id, code FROM chem_categories WHERE specialty_id=?`,
    [sp.id],
  )
  const catId = new Map(cats.map((c) => [c.code, String(c.id)]))

  let inserted = 0
  let skipped = 0
  for (const s of SEEDS) {
    const cid = catId.get(s.cat)
    if (!cid) {
      skipped++
      continue
    }
    const [exist] = await conn.query(
      `SELECT id FROM chem_train_items WHERE code=? LIMIT 1`,
      [s.code],
    )
    if (exist.length) {
      skipped++
      continue
    }
    await conn.query(
      `INSERT INTO chem_train_items
       (code, pool, qtype, stem, options_json, answer, answer_aliases_json, analysis,
        difficulty, specialty_id, category_id, status, is_active, curriculum_ok,
        verify_blocked, ban_default_train, gate_note)
       VALUES (?, 'test', ?, ?, ?, ?, ?, ?, 1, ?, ?, 'approved', 1, 1, 0, 0, ?)`,
      [
        s.code,
        s.qtype,
        s.stem,
        s.options ? JSON.stringify(s.options) : null,
        s.answer,
        JSON.stringify(s.aliases || []),
        'AI试运行扩充分类覆盖',
        sp.id,
        cid,
        `ai_trial expand cat=${s.cat}`,
      ],
    )
    inserted++
  }

  const [cov] = await conn.query(
    `SELECT c.code, COUNT(*) n FROM chem_train_items i
     JOIN chem_categories c ON c.id=i.category_id
     JOIN chem_specialties s ON s.id=i.specialty_id
     WHERE s.code='equation' AND i.pool='test' AND i.status='approved'
     GROUP BY c.code ORDER BY c.code`,
  )
  await conn.end()
  console.log(JSON.stringify({ inserted, skipped, equationCoverage: cov }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
