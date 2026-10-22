/**
 * READ-ONLY capacity audit for chem train items vs 239 whitelist KB.
 *   node docs/chemistry_trial_restore/capacity_audit.js
 */
'use strict'
const fs = require('fs')
const path = require('path')
const ROOT = path.resolve(__dirname, '../..')
const OUT = path.join(ROOT, 'docs')

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
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

  const whitelist = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, 'docs/chemistry_deepseek_audit/publish_whitelist.json'),
      'utf8',
    ),
  )
  const wlCodes = (whitelist.items || []).map((i) => i.code)
  const wlByCode = new Map((whitelist.items || []).map((i) => [i.code, i]))

  const [allItems] = await conn.query(`SELECT * FROM chem_train_items ORDER BY id`)
  const [links] = await conn.query(`SELECT * FROM chem_train_item_links`)
  const [specs] = await conn.query(
    `SELECT id, code, name FROM chem_specialties ORDER BY sort_order, id`,
  )
  const [cats] = await conn.query(
    `SELECT id, specialty_id, code, name FROM chem_categories ORDER BY specialty_id, sort_order, id`,
  )

  const specById = new Map(specs.map((s) => [String(s.id), s]))
  const catById = new Map(cats.map((c) => [String(c.id), c]))

  const total = allItems.length
  const byPool = { formal: 0, test: 0, other: 0 }
  const byStatus = {}
  const byActive = { active: 0, inactive: 0 }
  const byDiff = { 1: 0, 2: 0, 3: 0 }
  const byQtype = {}
  const byAnswerType = {}
  let aiTrial = 0
  let oldTest = 0
  let approved = 0
  let disabled = 0

  for (const it of allItems) {
    const pool = it.pool || 'other'
    byPool[pool] = (byPool[pool] || 0) + 1
    byStatus[it.status] = (byStatus[it.status] || 0) + 1
    if (it.is_active) byActive.active++
    else byActive.inactive++
    byDiff[it.difficulty] = (byDiff[it.difficulty] || 0) + 1
    byQtype[it.qtype] = (byQtype[it.qtype] || 0) + 1
    byAnswerType[it.answer_type || 'text'] =
      (byAnswerType[it.answer_type || 'text'] || 0) + 1
    if (String(it.code).startsWith('train.ai_trial.')) aiTrial++
    if (String(it.code).startsWith('train.test.')) oldTest++
    if (it.status === 'approved') approved++
    if (it.status === 'disabled' || !it.is_active) disabled++
  }

  // specialty / category coverage for eligible test items
  const eligibleTest = allItems.filter(
    (i) => i.pool === 'test' && i.status === 'approved' && i.is_active,
  )
  const bySpec = {}
  const byCat = {}
  const emptyCats = []
  for (const s of specs) {
    bySpec[s.code] = { name: s.name, count: 0, byDifficulty: { 1: 0, 2: 0, 3: 0 } }
  }
  for (const c of cats) {
    const sp = specById.get(String(c.specialty_id))
    const key = `${sp?.code || '?'}.${c.code}`
    byCat[key] = { name: c.name, specialty: sp?.code, count: 0 }
  }
  for (const it of eligibleTest) {
    const sp = specById.get(String(it.specialty_id))
    const cat = catById.get(String(it.category_id))
    if (sp) {
      bySpec[sp.code].count++
      bySpec[sp.code].byDifficulty[it.difficulty] =
        (bySpec[sp.code].byDifficulty[it.difficulty] || 0) + 1
    }
    if (sp && cat) {
      const key = `${sp.code}.${cat.code}`
      if (byCat[key]) byCat[key].count++
    }
  }
  for (const [k, v] of Object.entries(byCat)) {
    if (v.count === 0) emptyCats.push(k)
  }

  // sample: equation.write_from_text difficulty 1 (user screenshot path)
  const eqWrite = eligibleTest.filter((i) => {
    const sp = specById.get(String(i.specialty_id))
    const cat = catById.get(String(i.category_id))
    return sp?.code === 'equation' && cat?.code === 'write_from_text'
  })
  const eqWriteD1 = eqWrite.filter((i) => Number(i.difficulty) === 1)

  // KB utilization via links
  // Map entity_type+id -> inventory codes via whitelist dbId + pending export if present
  const pendingPath = path.join(
    ROOT,
    'docs/chemistry_deepseek_audit/pending_review_all.json',
  )
  const pending = fs.existsSync(pendingPath)
    ? JSON.parse(fs.readFileSync(pendingPath, 'utf8'))
    : { items: [] }
  const codeByEntity = new Map()
  for (const it of pending.items || []) {
    codeByEntity.set(`${it.type}:${it.dbId}`, it.code)
  }
  for (const w of whitelist.items || []) {
    codeByEntity.set(`${w.type}:${w.dbId}`, w.code)
  }

  const linksByItem = new Map()
  for (const l of links) {
    const id = String(l.item_id)
    if (!linksByItem.has(id)) linksByItem.set(id, [])
    linksByItem.get(id).push(l)
  }

  const usedCodes = new Set()
  const questionsPerCode = new Map()
  const linkedItemCodes = []
  let itemsWithLink = 0
  let itemsWithoutLink = 0
  for (const it of allItems) {
    const ls = linksByItem.get(String(it.id)) || []
    if (!ls.length) {
      itemsWithoutLink++
      continue
    }
    itemsWithLink++
    for (const l of ls) {
      const code = codeByEntity.get(`${l.entity_type}:${l.entity_id}`)
      if (code) {
        usedCodes.add(code)
        questionsPerCode.set(code, (questionsPerCode.get(code) || 0) + 1)
        linkedItemCodes.push({ itemCode: it.code, kbCode: code })
      }
    }
  }

  const wlUsed = wlCodes.filter((c) => usedCodes.has(c))
  const wlUnused = wlCodes.filter((c) => !usedCodes.has(c))
  const avgPerUsed =
    wlUsed.length === 0
      ? 0
      : wlUsed.reduce((s, c) => s + (questionsPerCode.get(c) || 0), 0) / wlUsed.length

  // templates inference from code prefixes
  const templateBuckets = {}
  for (const it of allItems) {
    const code = String(it.code)
    let bucket = 'other'
    if (code.startsWith('train.test.')) bucket = 'phase1_seed'
    else if (code.includes('.el_sym') || code.includes('.el_sc')) bucket = 'element_symbol'
    else if (code.includes('.sub_f') || code.includes('formula')) bucket = 'substance_formula'
    else if (code.includes('.con_j') || code.includes('.kp_j')) bucket = 'concept_judge'
    else if (code.includes('.rxn_')) bucket = 'reaction_judge_or_redox'
    else if (code.includes('.exp_')) bucket = 'experiment'
    else if (code.includes('.fm_')) bucket = 'calc_formula'
    else if (code.includes('.eq.')) bucket = 'equation_expand'
    else if (code.includes('.cov.')) bucket = 'specialty_cover_filler'
    else if (code.startsWith('train.ai_trial.')) bucket = 'ai_trial_misc'
    templateBuckets[bucket] = (templateBuckets[bucket] || 0) + 1
  }

  // why 3: specialty fallback logic means same specialty any category
  // if user sees 3 - likely specialty with only 3 eligible, or category with 3 and no more after filter
  const why3Candidates = Object.entries(bySpec)
    .filter(([, v]) => v.count === 3)
    .map(([code, v]) => ({ specialty: code, ...v }))

  const catsWith3 = Object.entries(byCat)
    .filter(([, v]) => v.count === 3)
    .map(([k, v]) => ({ category: k, ...v }))

  await conn.end()

  const report = {
    auditedAt: new Date().toISOString(),
    readOnly: true,
    totals: {
      total,
      formal: byPool.formal || 0,
      test: byPool.test || 0,
      aiTrialPrefix: aiTrial,
      oldTestPrefix: oldTest,
      approved,
      disabledOrInactive: disabled,
      byStatus,
      byActive,
      byDifficulty: byDiff,
      byQtype,
      byAnswerType,
      itemsWithKbLink: itemsWithLink,
      itemsWithoutKbLink: itemsWithoutLink,
    },
    eligibleTestPool: {
      count: eligibleTest.length,
      note: 'pool=test AND status=approved AND is_active=1（抽题候选，不含 formal）',
    },
    pageShow3Analysis: {
      likelyReasons: [
        '抽题按「专项+分类+难度」过滤；多数二级分类题量为 0～2，少数为 3',
        'AI试运行测试池若某分类无题，会回退到「同专项任意分类」——此时显示的是该专项合计可抽题数',
        '正式池 formal approved 仍为 0；若误选正式训练则为 0 而非 3',
        'specialty_cover_filler 曾为每个缺题专项补 3 道判断题，极易导致「当前可用题目：3道」',
      ],
      specialtiesWithExactly3Eligible: why3Candidates,
      categoriesWithExactly3Eligible: catsWith3.slice(0, 30),
      equationWriteFromText: {
        total: eqWrite.length,
        difficulty1: eqWriteD1.length,
        codes: eqWrite.map((i) => i.code),
      },
    },
    specialtyDistribution: bySpec,
    categoryDistributionSummary: {
      totalCategories: cats.length,
      categoriesWithQuestions: Object.values(byCat).filter((c) => c.count > 0).length,
      categoriesEmpty: emptyCats.length,
      emptySample: emptyCats.slice(0, 40),
      topFilled: Object.entries(byCat)
        .filter(([, v]) => v.count > 0)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 25)
        .map(([k, v]) => ({ category: k, ...v })),
    },
    whitelist239Utilization: {
      whitelistTotal: wlCodes.length,
      usedInAnyTrainItem: wlUsed.length,
      unused: wlUnused.length,
      unusedSample: wlUnused.slice(0, 50),
      avgQuestionsPerUsedKb: Math.round(avgPerUsed * 100) / 100,
      questionsPerCodeTop: [...questionsPerCode.entries()]
        .filter(([c]) => wlByCode.has(c))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([code, n]) => ({ code, questions: n, type: wlByCode.get(code)?.type })),
      note: '利用率按 chem_train_item_links 关联编码统计；大量 filler/expand 题无 KB link',
    },
    templateBuckets,
  }

  fs.writeFileSync(
    path.join(__dirname, 'capacity_audit.json'),
    JSON.stringify(report, null, 2) + '\n',
  )
  console.log(
    JSON.stringify(
      {
        total,
        test: byPool.test,
        formal: byPool.formal,
        aiTrial,
        oldTest,
        eligibleTest: eligibleTest.length,
        wlUsed: wlUsed.length,
        wlUnused: wlUnused.length,
        specsWith3: why3Candidates.map((x) => x.specialty),
        eqWriteD1: eqWriteD1.length,
        emptyCats: emptyCats.length,
        templateBuckets,
      },
      null,
      2,
    ),
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
