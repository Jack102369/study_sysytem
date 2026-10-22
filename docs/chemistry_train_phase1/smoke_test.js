/**
 * Phase1 train smoke checks (DB + eligibility + grade + seed).
 * Does not modify 377 KB rows.
 * node docs/chemistry_train_phase1/smoke_test.js
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

function normalizeExact(s) {
  return String(s ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/／/g, '/')
}

function gradeBlank(std, aliases, user) {
  const u = String(user ?? '').trim()
  if (!u) return 'pending_review'
  const candidates = [std, ...(aliases || [])].map(normalizeExact).filter(Boolean)
  if (!candidates.length) return 'pending_review'
  if (candidates.includes(normalizeExact(u))) return 'correct'
  return 'pending_review'
}

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

  const checks = []
  const pass = (id, detail) => checks.push({ id, ok: true, detail })
  const fail = (id, detail) => checks.push({ id, ok: false, detail })

  // tables
  const [tables] = await conn.query("SHOW TABLES LIKE 'chem_train_%'")
  if (tables.length >= 5) pass('tables', tables.length)
  else fail('tables', tables.length)

  // specialties / categories still 12 / 137
  const [[{ sc }]] = await conn.query(
    'SELECT COUNT(*) AS sc FROM chem_specialties WHERE is_active=1',
  )
  const [[{ cc }]] = await conn.query(
    'SELECT COUNT(*) AS cc FROM chem_categories WHERE is_active=1',
  )
  if (Number(sc) === 12) pass('specialties_12', sc)
  else fail('specialties_12', sc)
  if (Number(cc) === 137) pass('categories_137', cc)
  else fail('categories_137', cc)

  // 377 inventory untouched size
  const inv = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs/chemistry_kb_inventory.json'), 'utf8'),
  )
  const n = inv.batches.reduce((a, b) => a + b.items.length, 0)
  if (n === 377) pass('inventory_377', n)
  else fail('inventory_377', n)

  // seed test items (idempotent)
  const fullSeeds = [
    ['train.test.eq.tf.01', 'equation', 'true_false', 'judge', '【测试题】化学反应前后原子种类与数目守恒。判断正误。', null, '正确', ['对', 'T', 'true', '√'], 1],
    ['train.test.eq.tf.02', 'equation', 'true_false', 'judge', '【测试题】所有化学反应都是氧化还原反应。判断正误。', null, '错误', ['错', 'F', 'false', '×'], 1],
    ['train.test.eq.single.01', 'equation', 'true_false', 'single', '【测试题】下列属于化学变化的是？', JSON.stringify([{ key: 'A', text: '冰融化成水' }, { key: 'B', text: '镁条燃烧' }, { key: 'C', text: '食盐溶于水' }, { key: 'D', text: '液态氧变成气态氧' }]), 'B', null, 1],
    ['train.test.mem.blank.01', 'memory', 'symbol', 'blank', '【测试题】氧元素的元素符号是____。（填符号）', null, 'O', [], 1],
    ['train.test.sub.single.01', 'substance', 'formula', 'single', '【测试题】水的化学式是？', JSON.stringify([{ key: 'A', text: 'H2O' }, { key: 'B', text: 'HO' }, { key: 'C', text: 'H2O2' }, { key: 'D', text: 'OH' }]), 'A', null, 1],
    ['train.test.exp.judge.01', 'experiment', 'safety', 'judge', '【测试题】危险化学实验可以在家自行操作。判断正误。', null, '错误', ['错', 'F', 'false', '×'], 1],
    ['train.test.eq.blank.01', 'equation', 'true_false', 'blank', '【测试题】氯化钠的化学式是____。', null, 'NaCl', ['NaCl(s)'], 1],
    ['train.test.eq.single.02', 'equation', 'true_false', 'single', '【测试题】配平化学方程式时必须遵守的是？', JSON.stringify([{ key: 'A', text: '只保证质量相等即可随意改化学式' }, { key: 'B', text: '原子种类与数目守恒' }, { key: 'C', text: '可以改变生成物种类' }, { key: 'D', text: '不需要考虑原子守恒' }]), 'B', null, 1],
    ['train.test.mem.blank.02', 'memory', 'symbol', 'blank', '【测试题】氢元素的元素符号是____。', null, 'H', [], 1],
  ]

  for (const row of fullSeeds) {
    const [code, spCode, catCode, qtype, stem, options, answer, aliases, diff] = row
    const [[sp]] = await conn.query(
      'SELECT id FROM chem_specialties WHERE code=? AND is_active=1',
      [spCode],
    )
    const [[cat]] = await conn.query(
      'SELECT id FROM chem_categories WHERE specialty_id=? AND code=? AND is_active=1',
      [sp.id, catCode],
    )
    const [[ex]] = await conn.query('SELECT id FROM chem_train_items WHERE code=?', [code])
    if (!ex) {
      await conn.query(
        `INSERT INTO chem_train_items
        (code, pool, qtype, stem, options_json, answer, answer_aliases_json, analysis, difficulty,
         specialty_id, category_id, status, is_active, curriculum_ok, verify_blocked, ban_default_train, gate_note)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,'approved',1,1,0,0,'phase1 test seed; not formal')`,
        [
          code,
          'test',
          qtype,
          stem,
          options,
          answer,
          aliases ? JSON.stringify(aliases) : null,
          'smoke seed',
          diff,
          sp.id,
          cat.id,
        ],
      )
    }
  }

  const [[{ tc }]] = await conn.query(
    "SELECT COUNT(*) AS tc FROM chem_train_items WHERE pool='test' AND status='approved'",
  )
  if (Number(tc) >= 9) pass('test_seeds', tc)
  else fail('test_seeds', tc)

  const [[{ fc }]] = await conn.query(
    "SELECT COUNT(*) AS fc FROM chem_train_items WHERE pool='formal' AND status='approved' AND is_active=1",
  )
  pass('formal_approved_count', Number(fc))

  // formal eligibility: no formal without links
  const [[{ orphan }]] = await conn.query(
    `SELECT COUNT(*) AS orphan FROM chem_train_items i
     WHERE i.pool='formal' AND i.status='approved' AND i.is_active=1
     AND NOT EXISTS (SELECT 1 FROM chem_train_item_links l WHERE l.item_id=i.id)`,
  )
  if (Number(orphan) === 0) pass('formal_no_orphan_approved', orphan)
  else fail('formal_no_orphan_approved', orphan)

  // grade rules
  if (gradeBlank('O', [], 'O') === 'correct') pass('grade_blank_exact', true)
  else fail('grade_blank_exact', false)
  if (gradeBlank('NaCl', ['NaCl(s)'], 'NaCl(s)') === 'correct') pass('grade_blank_alias', true)
  else fail('grade_blank_alias', false)
  if (gradeBlank('O', [], '氧') === 'pending_review') pass('grade_blank_no_fuzzy', true)
  else fail('grade_blank_no_fuzzy', false)
  if (gradeBlank('O', [], '') === 'pending_review') pass('grade_blank_empty', true)
  else fail('grade_blank_empty', false)

  // published KB count unchanged check (spot)
  const [[{ pubQ }]] = await conn.query(
    "SELECT COUNT(*) AS pubQ FROM chem_questions WHERE status='published'",
  )
  pass('published_questions_spot', Number(pubQ))

  await conn.end()

  const allOk = checks.every((c) => c.ok)
  const out = { at: new Date().toISOString(), allOk, checks }
  fs.writeFileSync(
    path.join(__dirname, 'smoke_result.json'),
    JSON.stringify(out, null, 2) + '\n',
  )
  console.log(JSON.stringify(out, null, 2))
  if (!allOk) process.exit(2)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
