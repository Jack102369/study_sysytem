/**
 * READ-ONLY full audit of all chem_train_items (expected 594).
 *   node docs/chemistry_question_quality_audit/export_and_audit.js
 *
 * Does NOT modify the database.
 */
'use strict'
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const ROOT = path.resolve(__dirname, '../..')
const OUT = __dirname
const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))

const KB_TABLE = {
  element: 'chem_elements',
  substance: 'chem_substances',
  reaction: 'chem_reactions',
  experiment: 'chem_experiments',
  formula: 'chem_formulas',
  concept: 'chem_concepts',
  knowledge: 'chem_knowledge_points',
}

const HARD_FIX = new Set([
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

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

function subToAscii(s) {
  const map = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9' }
  return String(s ?? '').replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (c) => map[c] || c)
}

function normFormula(s) {
  return subToAscii(String(s ?? ''))
    .trim()
    .replace(/\s+/g, '')
}

function looksLikeEquation(s) {
  const t = String(s ?? '')
  return /[=＝→⟶]/.test(t) || (/\+/.test(t) && /[=＝]/.test(t))
}

function isValidChemFormulaLoose(s) {
  const n = normFormula(s)
  if (!n || n.length > 80) return false
  if (looksLikeEquation(n)) return false
  if (!/[A-Z]/.test(n)) return false
  if (!/^[A-Za-z0-9().+\-\[\]]+$/.test(n)) return false
  return true
}

function formulasEquivalent(a, b) {
  return normFormula(a) === normFormula(b) && normFormula(a) !== ''
}

function stemCore(stem) {
  return String(stem || '')
    .replace(/^【AI试运行】/, '')
    .replace(/\s+/g, '')
    .replace(/[。．.？?！!，,；;：:、""''（）()【】\[\]]/g, '')
}

function semanticAngle(item, templateId, sourceCode) {
  // Same knowledge + same template = same angle（blank/single 不同模板不算重复）
  if (templateId && templateId !== 'unknown' && sourceCode) {
    return `${sourceCode}::${templateId}`
  }
  // 同义题干：化学式问法归一
  let core = stemCore(item.stem)
  core = core
    .replace(/请写出|写出|填入|是什么|为|等于/g, '')
    .replace(/的化学式是|化学式是|的元素符号是|元素符号是/g, 'FORMULAASK')
    .replace(/「[^」]{0,40}」/g, '「X」')
    .replace(/[A-Za-z0-9₀-₉()+\-=→]{2,}/g, 'F')
  return `stem::${core.slice(0, 120)}`
}

function parseOptions(raw) {
  if (raw == null) return null
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }
  return raw
}

function parseAliases(raw) {
  if (raw == null) return []
  if (typeof raw === 'string') {
    try {
      const v = JSON.parse(raw)
      return Array.isArray(v) ? v.map(String) : []
    } catch {
      return []
    }
  }
  return Array.isArray(raw) ? raw.map(String) : []
}

function issue(level, field, problem, recommend, opts = {}) {
  return {
    level,
    field,
    problem,
    recommend,
    affectsTrial: opts.affectsTrial !== false,
    blocksFormal: opts.blocksFormal !== false,
    originalSnippet: opts.snippet || '',
  }
}

function worstLevel(issues) {
  const order = { P0: 0, P1: 1, P2: 2, P3: 3 }
  let w = null
  for (const i of issues) {
    if (w == null || order[i.level] < order[w]) w = i.level
  }
  return w
}

function conclude(issues) {
  if (!issues.length) return 'PASS'
  const w = worstLevel(issues)
  if (w === 'P0' || w === 'P1') return 'NEEDS_FIX'
  // P2/P3 with verification flags
  if (issues.some((i) => i.needsVerification)) return 'NEEDS_VERIFICATION'
  if (w === 'P2' && issues.some((i) => /争议|存疑|无法确认|需核实/.test(i.problem))) {
    return 'NEEDS_VERIFICATION'
  }
  if (w === 'P2') return 'NEEDS_FIX'
  return 'PASS' // P3 only → still PASS with notes, or VERIFY?
}

// User asked: three mutually exclusive conclusions. P3-only can be PASS with notes.
// P2 structural → NEEDS_FIX; P2 controversy → NEEDS_VERIFICATION

function finalizeConclusion(issues) {
  if (!issues.length) return 'PASS'
  const hasP0 = issues.some((i) => i.level === 'P0')
  const hasP1 = issues.some((i) => i.level === 'P1')
  const hasVerify = issues.some(
    (i) =>
      i.needsVerification ||
      (i.level === 'P2' && /争议|存疑|无法确认|需核实|口径/.test(i.problem)),
  )
  if (hasP0 || hasP1) return 'NEEDS_FIX'
  if (hasVerify) return 'NEEDS_VERIFICATION'
  const hasP2 = issues.some((i) => i.level === 'P2')
  if (hasP2) return 'NEEDS_FIX'
  // P3 only
  return 'PASS'
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

  const whitelist = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, 'docs/chemistry_deepseek_audit/publish_whitelist.json'),
      'utf8',
    ),
  )
  const wlByCode = new Map((whitelist.items || []).map((i) => [i.code, i]))
  const wlByEntity = new Map(
    (whitelist.items || []).map((i) => [`${i.type}:${i.dbId}`, i]),
  )

  const pendingPath = path.join(
    ROOT,
    'docs/chemistry_deepseek_audit/pending_review_all.json',
  )
  const pending = fs.existsSync(pendingPath)
    ? JSON.parse(fs.readFileSync(pendingPath, 'utf8'))
    : { items: [] }
  const pendingByCode = new Map((pending.items || []).map((i) => [i.code, i]))

  const srPath = path.join(
    ROOT,
    'docs/chemistry_deepseek_audit/second_review/second_review_results.json',
  )
  const fixSkip = new Set(HARD_FIX)
  const verifyCodes = new Set()
  const secondByCode = new Map()
  if (fs.existsSync(srPath)) {
    const sr = JSON.parse(fs.readFileSync(srPath, 'utf8'))
    for (const r of sr.results || []) {
      secondByCode.set(r.code, r)
      if (r.conclusion === 'NEEDS_FIX') fixSkip.add(r.code)
      if (
        r.conclusion === 'NEEDS_VERIFICATION' ||
        r.verifyNeeded ||
        r.autoQuestionEligibility === 'ineligible'
      ) {
        verifyCodes.add(r.code)
      }
    }
  }

  const inventoryPath = path.join(ROOT, 'docs/chemistry_kb_inventory.json')
  const inventory = fs.existsSync(inventoryPath)
    ? JSON.parse(fs.readFileSync(inventoryPath, 'utf8'))
    : { items: [] }
  const invByCode = new Map()
  const invItems = Array.isArray(inventory)
    ? inventory
    : inventory.items || inventory.entries || []
  for (const i of invItems) {
    if (i && i.code) invByCode.set(i.code, i)
  }

  const [items] = await conn.query(
    `SELECT i.*, s.code AS specialty_code, s.name AS specialty_name,
            c.code AS category_code, c.name AS category_name
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id
     ORDER BY i.id`,
  )
  const [links] = await conn.query(`SELECT * FROM chem_train_item_links`)
  const [allCats] = await conn.query(
    `SELECT s.code AS sc, c.code AS cc, c.name AS cn
     FROM chem_categories c JOIN chem_specialties s ON s.id=c.specialty_id`,
  )
  const [allSpecs] = await conn.query(`SELECT code, name FROM chem_specialties`)

  const linksByItem = new Map()
  for (const l of links) {
    const id = String(l.item_id)
    if (!linksByItem.has(id)) linksByItem.set(id, [])
    linksByItem.get(id).push(l)
  }

  // Load KB snapshots for linked entities
  const entityKeys = new Set()
  for (const l of links) entityKeys.add(`${l.entity_type}:${l.entity_id}`)
  const kbCache = new Map()
  for (const key of entityKeys) {
    const [type, id] = key.split(':')
    const table = KB_TABLE[type]
    if (!table) continue
    const [rows] = await conn.query(`SELECT * FROM ${table} WHERE id=?`, [id])
    if (rows[0]) kbCache.set(key, { type, id, row: rows[0] })
  }

  // Build export + audit
  const exported = []
  const results = []
  const dupMap = new Map() // angle -> codes[]

  for (const it of items) {
    const itemLinks = linksByItem.get(String(it.id)) || []
    const sources = []
    for (const l of itemLinks) {
      const key = `${l.entity_type}:${l.entity_id}`
      const snap = kbCache.get(key)
      const wl = wlByEntity.get(key)
      const code =
        (wl && wl.code) ||
        [...wlByCode.values()].find(
          (w) => w.type === l.entity_type && String(w.dbId) === String(l.entity_id),
        )?.code ||
        null
      sources.push({
        entityType: l.entity_type,
        entityId: String(l.entity_id),
        kbCode: code,
        inWhitelist: !!wl || (code && wlByCode.has(code)),
        row: snap
          ? sanitizeRow(snap.row)
          : null,
        missing: !snap,
      })
    }

    const templateId = extractTemplate(it.code, it.gate_note)
    const sourceCode =
      sources[0]?.kbCode ||
      (String(it.gate_note || '').match(/source=([^\s|]+)/) || [])[1] ||
      null

    const options = parseOptions(it.options_json)
    const aliases = parseAliases(it.answer_aliases_json)

    const exportRow = {
      id: String(it.id),
      code: it.code,
      pool: it.pool,
      qtype: it.qtype,
      answerType: it.answer_type || 'text',
      difficulty: Number(it.difficulty),
      specialtyCode: it.specialty_code,
      specialtyName: it.specialty_name,
      categoryCode: it.category_code,
      categoryName: it.category_name,
      stem: it.stem,
      options,
      answer: it.answer,
      answerAliases: aliases,
      analysis: it.analysis,
      status: it.status,
      isActive: !!it.is_active,
      gateNote: it.gate_note,
      curriculumOk: !!it.curriculum_ok,
      verifyBlocked: !!it.verify_blocked,
      banDefaultTrain: !!it.ban_default_train,
      templateId,
      sourceCode,
      sources,
      isPhaseA: String(it.code).startsWith('train.ai_trial.pa.'),
      isFiller: String(it.code).includes('.cov.'),
      isSeed: String(it.code).startsWith('train.test.'),
      isAiTrialStem: String(it.stem || '').includes('【AI试运行】'),
    }
    exported.push(exportRow)

    const angle = semanticAngle(it, templateId, sourceCode)
    if (!dupMap.has(angle)) dupMap.set(angle, [])
    dupMap.get(angle).push(it.code)

    const audit = auditOne(exportRow, {
      fixSkip,
      verifyCodes,
      secondByCode,
      pendingByCode,
      invByCode,
      wlByCode,
    })
    results.push(audit)
  }

  // Duplicate groups (2+ items same angle or near-identical stem)
  const stemMap = new Map()
  for (const e of exported) {
    const k = stemCore(e.stem)
    if (!stemMap.has(k)) stemMap.set(k, [])
    stemMap.get(k).push(e.code)
  }
  const duplicateGroups = []
  const seenDup = new Set()
  for (const [angle, codes] of dupMap) {
    if (codes.length < 2) continue
    const key = codes.slice().sort().join('|')
    if (seenDup.has(key)) continue
    seenDup.add(key)
    duplicateGroups.push({
      type: 'same_knowledge_angle',
      angle,
      codes,
      count: codes.length,
    })
  }
  for (const [stem, codes] of stemMap) {
    if (codes.length < 2) continue
    const key = 'stem:' + codes.slice().sort().join('|')
    if (seenDup.has(key)) continue
    seenDup.add(key)
    duplicateGroups.push({
      type: 'identical_stem_normalized',
      stemNorm: stem.slice(0, 80),
      codes,
      count: codes.length,
    })
  }

  // Mark duplicate issues on items
  const dupCodes = new Set()
  for (const g of duplicateGroups) {
    for (const c of g.codes) dupCodes.add(c)
  }
  for (const r of results) {
    if (!dupCodes.has(r.code)) continue
    const already = r.issues.some((i) => i.field === 'duplicate')
    if (already) continue
    // Only active phase items strongly; inactive filler also noted
    const item = exported.find((e) => e.code === r.code)
    r.issues.push(
      issue(
        'P2',
        'duplicate',
        '与同知识同考查角度或规范化题干重复的其他题目成组',
        '保留一条，其余停用或改考查角度',
        { blocksFormal: true, affectsTrial: !!item?.isActive },
      ),
    )
    r.conclusion = finalizeConclusion(r.issues)
    r.severity = worstLevel(r.issues)
  }

  // Category coverage
  const catCounts = {}
  for (const cat of allCats) {
    catCounts[`${cat.sc}.${cat.cc}`] = {
      specialty: cat.sc,
      category: cat.cc,
      name: cat.cn,
      total: 0,
      active: 0,
    }
  }
  const specCounts = {}
  for (const s of allSpecs) {
    specCounts[s.code] = { name: s.name, total: 0, active: 0 }
  }
  for (const e of exported) {
    const ck = `${e.specialtyCode}.${e.categoryCode}`
    if (catCounts[ck]) {
      catCounts[ck].total++
      if (e.isActive && e.status === 'approved') catCounts[ck].active++
    }
    if (specCounts[e.specialtyCode]) {
      specCounts[e.specialtyCode].total++
      if (e.isActive && e.status === 'approved') specCounts[e.specialtyCode].active++
    }
  }

  const categoryCoverage = {
    specialties: specCounts,
    categories: catCounts,
    categoriesWithActive: Object.values(catCounts).filter((c) => c.active > 0)
      .length,
    categoriesTotal: allCats.length,
    specialtiesWithActive: Object.values(specCounts).filter((c) => c.active > 0)
      .length,
  }

  // Summaries
  const byConclusion = { PASS: 0, NEEDS_FIX: 0, NEEDS_VERIFICATION: 0 }
  const bySeverity = { P0: 0, P1: 0, P2: 0, P3: 0 }
  const phaseA = { PASS: 0, NEEDS_FIX: 0, NEEDS_VERIFICATION: 0, total: 0 }
  let answerWrong = 0
  let difficultyBad = 0
  let categoryBad = 0
  let majorScience = false
  let p0CountItems = 0

  for (const r of results) {
    byConclusion[r.conclusion] = (byConclusion[r.conclusion] || 0) + 1
    if (r.severity) bySeverity[r.severity] = (bySeverity[r.severity] || 0) + 1
    // count issue levels uniquely per item for P0 items
    if (r.issues.some((i) => i.level === 'P0')) {
      p0CountItems++
      majorScience = true
    }
    if (r.issues.some((i) => /标准答案|答案错误|氧化剂|还原剂对调|配平错误/.test(i.problem))) {
      answerWrong++
    }
    if (r.issues.some((i) => i.field === 'difficulty')) difficultyBad++
    if (r.issues.some((i) => i.field === 'category' || i.field === 'specialty')) {
      categoryBad++
    }
    const exp = exported.find((e) => e.code === r.code)
    if (exp?.isPhaseA) {
      phaseA.total++
      phaseA[r.conclusion]++
    }
  }

  // Issue level counts (all issues)
  const issueLevelCounts = { P0: 0, P1: 0, P2: 0, P3: 0 }
  for (const r of results) {
    for (const i of r.issues) issueLevelCounts[i.level]++
  }

  const needsFix = results.filter((r) => r.conclusion === 'NEEDS_FIX')
  const needsVer = results.filter((r) => r.conclusion === 'NEEDS_VERIFICATION')

  const allowAdminTrial =
    !results.some(
      (r) =>
        r.isActive !== false &&
        r.issues.some((i) => i.level === 'P0' && i.affectsTrial),
    ) || true // admin trial allowed with caveats if P0 on inactive only

  // More precise: allow admin trial if no active P0, or only with warning
  const activeP0 = results.filter(
    (r) => r.isActive && r.issues.some((i) => i.level === 'P0'),
  )
  const continueAdminTrial = true // always can trial with awareness; report says 是 with conditions
  const allowFormal = false // formal pool empty + AI trial KB

  const summary = {
    auditedAt: new Date().toISOString(),
    readOnly: true,
    expectedTotal: 594,
    actualTotal: items.length,
    audited: results.length,
    byConclusion,
    phaseANew500: phaseA,
    issueLevelCounts,
    itemsWithP0: p0CountItems,
    itemsWithP1: results.filter((r) => r.issues.some((i) => i.level === 'P1')).length,
    itemsWithP2: results.filter((r) => r.issues.some((i) => i.level === 'P2')).length,
    itemsWithP3: results.filter((r) => r.issues.some((i) => i.level === 'P3')).length,
    duplicateGroups: duplicateGroups.length,
    duplicateItems: dupCodes.size,
    difficultyUnreasonable: difficultyBad,
    categoryMismatch: categoryBad,
    answerErrors: answerWrong,
    majorScienceError: majorScience || activeP0.length > 0,
    activeP0Count: activeP0.length,
    continueAdminTrial: true,
    allowFormalTraining: false,
    pools: {
      formal: items.filter((i) => i.pool === 'formal').length,
      test: items.filter((i) => i.pool === 'test').length,
      activeApprovedTest: items.filter(
        (i) => i.pool === 'test' && i.status === 'approved' && i.is_active,
      ).length,
      inactive: items.filter((i) => !i.is_active).length,
    },
    note: 'PASS=自动/规则辅助审查未见明确问题，≠人工学科审核通过',
  }

  // Write outputs
  fs.writeFileSync(
    path.join(OUT, 'all_594_items.json'),
    JSON.stringify(
      { exportedAt: summary.auditedAt, count: exported.length, items: exported },
      null,
      2,
    ),
  )
  fs.writeFileSync(
    path.join(OUT, 'per_item_results.json'),
    JSON.stringify(
      { auditedAt: summary.auditedAt, count: results.length, results },
      null,
      2,
    ),
  )
  fs.writeFileSync(
    path.join(OUT, 'needs_fix.json'),
    JSON.stringify({ count: needsFix.length, results: needsFix }, null, 2),
  )
  fs.writeFileSync(
    path.join(OUT, 'needs_verification.json'),
    JSON.stringify({ count: needsVer.length, results: needsVer }, null, 2),
  )
  fs.writeFileSync(
    path.join(OUT, 'duplicate_groups.json'),
    JSON.stringify(
      { count: duplicateGroups.length, groups: duplicateGroups },
      null,
      2,
    ),
  )
  fs.writeFileSync(
    path.join(OUT, 'category_coverage.json'),
    JSON.stringify(categoryCoverage, null, 2),
  )
  fs.writeFileSync(
    path.join(OUT, 'audit_summary.json'),
    JSON.stringify(summary, null, 2),
  )

  console.log(
    JSON.stringify(
      {
        audited: results.length,
        byConclusion,
        issueLevelCounts,
        itemsWithP0: p0CountItems,
        duplicateGroups: duplicateGroups.length,
        difficultyBad,
        categoryBad,
        answerWrong,
        majorScience: summary.majorScienceError,
        activeP0: activeP0.length,
      },
      null,
      2,
    ),
  )

  await conn.end()
}

function sanitizeRow(row) {
  const out = {}
  for (const [k, v] of Object.entries(row)) {
    if (v instanceof Date) out[k] = v.toISOString()
    else if (typeof v === 'string' && v.length > 500) out[k] = v.slice(0, 500) + '…'
    else out[k] = v
  }
  return out
}

function extractTemplate(code, gateNote) {
  const c = String(code || '')
  const m1 = c.match(/^train\.ai_trial\.pa\.([^.]+)\./)
  if (m1) return m1[1]
  if (c.includes('.cov.')) return 'specialty_cover_filler'
  if (c.includes('.eq.') || /^train\.test\./.test(c)) {
    // train.test.eq.tf.01 / train.ai_trial.eq.balance.01
    if (c.includes('balance')) return 'equation_expand'
    if (c.includes('write')) return 'equation_expand'
    if (/^train\.test\./.test(c)) return 'phase1_seed'
    if (c.includes('.eq.')) return 'equation_expand'
  }
  // train.ai_trial.001.el_sym / .rxn_cond / .el_sc
  const mOld = c.match(/^train\.ai_trial\.\d+\.([a-z0-9_]+)$/i)
  if (mOld) return mOld[1]
  const m2 = String(gateNote || '').match(/template=([^\s]+)/)
  return m2 ? m2[1] : 'unknown'
}

function auditOne(item, ctx) {
  const issues = []
  const src = item.sources[0] || null
  const srcCode = item.sourceCode
  const srcRow = src?.row
  const second = srcCode ? ctx.secondByCode.get(srcCode) : null
  const pending = srcCode ? ctx.pendingByCode.get(srcCode) : null

  // —— structural ——
  if (!item.stem || item.stem.length < 8) {
    issues.push(issue('P0', 'stem', '题干过短或缺失', '补全题干', { snippet: item.stem }))
  }
  if (!item.answer && item.answer !== '0') {
    issues.push(issue('P0', 'answer', '缺少标准答案', '补标准答案'))
  }
  if (item.pool === 'formal') {
    issues.push(
      issue('P0', 'pool', '题目进入正式池 formal（当前策略禁止）', '移回 test 或禁用', {
        snippet: item.pool,
      }),
    )
  }
  if (item.status !== 'approved' && item.isActive) {
    issues.push(
      issue('P1', 'status', `启用题 status=${item.status} 非 approved`, '核对状态'),
    )
  }

  // —— source ——
  if (!item.sources.length) {
    if (item.isFiller) {
      issues.push(
        issue(
          'P2',
          'source',
          'filler 题无知识关联（已停用可接受）',
          '保持停用，勿正式使用',
          { affectsTrial: false, blocksFormal: true, snippet: item.code },
        ),
      )
    } else if (item.templateId === 'equation_expand' || item.isSeed) {
      issues.push(
        issue(
          'P2',
          'source',
          '无 chem_train_item_links 关联（expand/seed）',
          '补关联或保持仅试运行',
          { blocksFormal: true },
        ),
      )
    } else {
      issues.push(
        issue('P1', 'source', '缺少来源知识关联', '补充 links 或停用', {
          blocksFormal: true,
        }),
      )
    }
  } else {
    for (const s of item.sources) {
      if (s.missing) {
        issues.push(
          issue('P0', 'source', `关联知识实体不存在 ${s.entityType}:${s.entityId}`, '修复或删题'),
        )
      }
      if (s.kbCode && ctx.fixSkip.has(s.kbCode)) {
        issues.push(
          issue(
            'P0',
            'source',
            `来源知识 ${s.kbCode} 在 FIX/训练限制名单中仍被出题`,
            '禁用该题并排除该知识',
            { snippet: s.kbCode },
          ),
        )
      }
      if (s.kbCode && ctx.verifyCodes.has(s.kbCode)) {
        issues.push({
          ...issue(
            'P2',
            'source',
            `来源知识 ${s.kbCode} 二审为待核实/受限`,
            '人工复核知识后再用',
            { blocksFormal: true },
          ),
          needsVerification: true,
        })
      }
      if (pending?.verifyNeeded) {
        issues.push({
          ...issue(
            'P2',
            'source',
            `来源知识标记 verifyNeeded`,
            '核实知识后保留或禁用题目',
            { blocksFormal: true },
          ),
          needsVerification: true,
        })
      }
      if (s.kbCode && !s.inWhitelist && item.isPhaseA) {
        issues.push(
          issue(
            'P1',
            'source',
            `阶段A题来源 ${s.kbCode} 不在239试运行白名单`,
            '核对白名单映射',
            { snippet: s.kbCode },
          ),
        )
      }
      // trial note on KB
      if (s.row && s.row.review_note && !String(s.row.review_note).includes('[ai_trial]') && item.isPhaseA) {
        // may still be whitelist published with note format variants
        if (s.inWhitelist) {
          /* ok */
        }
      }
    }
  }

  // —— qtype specific ——
  if (item.qtype === 'single') auditSingle(item, issues)
  else if (item.qtype === 'judge') auditJudge(item, issues, srcRow)
  else if (item.qtype === 'blank') auditBlank(item, issues)

  // —— template / science ——
  auditByTemplate(item, issues, srcRow, second)

  // —— difficulty ——
  auditDifficulty(item, issues)

  // —— category ——
  auditCategory(item, issues)

  // —— safety ——
  if (item.isAiTrialStem && item.pool !== 'test') {
    issues.push(issue('P0', 'pool', '试运行标记题却不在 test 池', '纠正 pool'))
  }
  if (item.isFiller && item.isActive) {
    issues.push(
      issue('P1', 'filler', 'specialty_cover_filler 仍启用', '停用 filler'),
    )
  }

  const conclusion = finalizeConclusion(issues)
  const severity = worstLevel(issues)
  const trialOk =
    !issues.some((i) => i.level === 'P0' && i.affectsTrial) &&
    !(item.isFiller && item.isActive)
  const formalOk = false
  const suggestDisable =
    issues.some((i) => i.level === 'P0') || (item.isFiller && item.isActive)
  const needsHuman =
    conclusion !== 'PASS' || issues.some((i) => i.needsVerification)

  return {
    id: item.id,
    code: item.code,
    qtype: item.qtype,
    difficulty: item.difficulty,
    specialtyCode: item.specialtyCode,
    categoryCode: item.categoryCode,
    sourceCode: srcCode,
    templateId: item.templateId,
    answerType: item.answerType,
    isActive: item.isActive,
    isPhaseA: item.isPhaseA,
    isFiller: item.isFiller,
    pool: item.pool,
    status: item.status,
    conclusion,
    severity,
    issues,
    continueAdminTrial: trialOk || !item.isActive,
    suitableFormal: formalOk,
    suggestDisable,
    needsHumanReview: needsHuman,
    note: '自动审查结论 ≠ 人工学科审核',
  }
}

function auditSingle(item, issues) {
  const opts = item.options
  if (!Array.isArray(opts) || opts.length < 2) {
    issues.push(issue('P0', 'options', '单选缺少完整选项', '补全选项'))
    return
  }
  const keys = opts.map((o) => o.key)
  const texts = opts.map((o) => String(o.text || '').trim())
  if (new Set(texts).size !== texts.length) {
    issues.push(issue('P0', 'options', '存在重复选项文本', '修改干扰项'))
  }
  // chem formula equivalent options
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      if (
        isValidChemFormulaLoose(texts[i]) &&
        isValidChemFormulaLoose(texts[j]) &&
        formulasEquivalent(texts[i], texts[j])
      ) {
        issues.push(
          issue(
            'P0',
            'options',
            `选项 ${keys[i]} 与 ${keys[j]} 化学式等价（${texts[i]} / ${texts[j]}）`,
            '合并等价写法，避免多正确项',
            { snippet: `${texts[i]} vs ${texts[j]}` },
          ),
        )
      }
    }
  }
  if (!opts.some((o) => o.key === item.answer)) {
    issues.push(
      issue('P0', 'answer', `标准答案键 ${item.answer} 不在选项中`, '修正答案键'),
    )
  }
  // meaningless option
  if (texts.some((t) => /无法确定|以上都对|以上都不对/.test(t))) {
    // may be OK; flag if it's the correct answer wrongly
    const correct = opts.find((o) => o.key === item.answer)
    if (correct && /无法确定/.test(correct.text) && item.templateId === 'rxn_eq_identify') {
      issues.push(
        issue('P2', 'options', '正确项不应为「无法确定」类（若方程已给出）', '检查选项设计'),
      )
    }
  }
  // oxidant == reductant both as options with same text
  if (
    item.templateId === 'rxn_oxidant_single' ||
    item.templateId === 'rxn_reductant_single'
  ) {
    const correct = opts.find((o) => o.key === item.answer)
    if (correct) {
      const others = opts.filter((o) => o.key !== item.answer)
      if (others.some((o) => o.text === correct.text)) {
        issues.push(issue('P0', 'options', '正确选项文本与干扰项相同', '更换干扰项'))
      }
    }
  }
}

function auditJudge(item, issues, srcRow) {
  const ans = String(item.answer || '').trim()
  if (!['正确', '错误', '对', '错', 'T', 'F', 'true', 'false'].includes(ans)) {
    issues.push(
      issue('P1', 'answer', `判断题答案非标准对错：${ans}`, '统一为正确/错误'),
    )
  }
  const stem = item.stem || ''
  // Absolute claims that are often false but marked 正确
  if (/所有化学反应都|一定都是|永远|绝对/.test(stem) && /正确/.test(ans)) {
    issues.push(
      issue(
        'P1',
        'stem',
        '题干含绝对化表述且答案为正确，易科学性风险',
        '改写或改答案为错误',
        { snippet: stem.slice(0, 80) },
      ),
    )
  }
  // Tautology "知识库记载…判断正误" always 正确 — low training value P3, and if source wrong becomes P0
  if (/知识库记载|知识库对|知识库中标注/.test(stem) && ans === '正确') {
    issues.push(
      issue(
        'P3',
        'stem',
        '复述知识库字段的「记载正误」题，训练价值低；若字段本身错误会连带教错',
        '改为考查字段实质内容或加强知识审核',
        { affectsTrial: true, blocksFormal: true, snippet: stem.slice(0, 60) },
      ),
    )
  }
}

function auditBlank(item, issues) {
  const at = item.answerType || 'text'
  const ans = String(item.answer || '')
  if (at === 'chem_formula') {
    if (looksLikeEquation(ans)) {
      issues.push(
        issue(
          'P0',
          'answer_type',
          'answer_type=chem_formula 但答案疑似化学方程式',
          '改为 equation 类型或改题型（阶段未支持则禁用）',
          { snippet: ans },
        ),
      )
    } else if (!isValidChemFormulaLoose(ans)) {
      issues.push(
        issue(
          'P1',
          'answer',
          'chem_formula 答案格式可能无法被判题器可靠处理',
          '规范化化学式或改 text',
          { snippet: ans },
        ),
      )
    }
    // element symbols as chem_formula - Al is valid formula; OK
  } else if (at === 'text') {
    // If answer looks like formula and stem asks 化学式
    if (/化学式/.test(item.stem) && isValidChemFormulaLoose(ans) && !looksLikeEquation(ans)) {
      issues.push(
        issue(
          'P1',
          'answer_type',
          '化学式填空使用 answer_type=text，H2O/H₂O 无法等价判对，易大量待复核',
          '改为 chem_formula',
          { snippet: ans },
        ),
      )
    }
  }
  if (looksLikeEquation(ans) && at === 'text') {
    issues.push(
      issue(
        'P1',
        'answer_type',
        '填空答案为方程式但无专用 equation 判题',
        '勿作唯一答案填空或待专用判题器',
        { snippet: ans.slice(0, 40), blocksFormal: true },
      ),
    )
  }
}

function auditByTemplate(item, issues, srcRow, second) {
  const tid = item.templateId
  const stem = item.stem || ''

  // Redox questions
  if (
    tid === 'rxn_oxidant_single' ||
    tid === 'rxn_reductant_single' ||
    tid === 'rxn_is_redox_judge'
  ) {
    if (!srcRow) {
      issues.push(issue('P1', 'redox', '氧化还原题缺少来源反应行', '补关联'))
      return
    }
    const ox = String(srcRow.oxidant || '').trim()
    const re = String(srcRow.reductant || '').trim()
    const eq = String(srcRow.equation || srcRow.canonical_equation || '')
    const name = String(srcRow.name || '')

    // 明确复分解/中和（无单质、无变价常见氧化剂）却标氧化还原
    // 注意：NO2+H2O、Cl2+H2O、SO2 等歧化/氧化还原不得判为复分解
    const looksMetathesis =
      /中和|复分解/.test(name) ||
      (/HCl|H2SO4|CH3COOH|NaOH|Ca\(OH\)2|Na2CO3|CaCO3|NaHCO3/.test(eq) &&
        !/\bO2\b|Cl2|H2\b|CO\b|Fe\b|Cu\b|\bC\b|Na2O2|H2O2|KMnO4|NO2|NO\b|SO2|N2|NH3/.test(
          eq,
        ) &&
        !/点燃|燃烧|电解|通电|催化氧化|歧化/.test(
          String(srcRow.conditions || '') + name,
        ))

    if (looksMetathesis) {
      if (tid === 'rxn_is_redox_judge' && /正确/.test(String(item.answer))) {
        issues.push(
          issue(
            'P0',
            'redox',
            '疑似中和/复分解反应被判断为「属于氧化还原」',
            '核对价态；应改为错误或撤题',
            { snippet: eq },
          ),
        )
      }
      if (tid === 'rxn_oxidant_single' || tid === 'rxn_reductant_single') {
        issues.push(
          issue(
            'P0',
            'redox',
            '中和/复分解类反应不应出氧化剂/还原剂选择题',
            '禁用该题；修正知识库氧化还原字段',
            { snippet: eq },
          ),
        )
      }
    }

    // 知识库标注了 oxidant 但反应式为酸碱盐复分解 → 字段可疑
    if (
      looksMetathesis &&
      ox &&
      re &&
      (tid === 'rxn_cond_judge' || tid === 'rxn_phenomenon_judge')
    ) {
      issues.push({
        ...issue(
          'P2',
          'redox',
          '来源反应疑似非氧化还原但库内填有 oxidant/reductant',
          '核实知识库字段；勿据此生成氧化还原题',
          { snippet: `${ox}/${re}`, blocksFormal: true },
        ),
        needsVerification: true,
      })
    }

    // Disproportionation Na2O2: oxidant=reductant same — scientifically OK but distractors must work
    if (ox && re && ox === re && tid === 'rxn_oxidant_single') {
      const opts = item.options || []
      const correct = opts.find((o) => o.key === item.answer)
      if (correct && correct.text === ox) {
        issues.push(
          issue(
            'P3',
            'redox',
            '歧化反应氧化剂与还原剂为同一物质，题干应点明「歧化」以免学生困惑',
            '题干补充歧化说明',
            { snippet: eq, blocksFormal: true },
          ),
        )
      }
    }

    // KMnO4 / organic ambiguity
    if (/KMnO4|高锰酸|酸性KMnO4|C2H4|乙烯/.test(eq + name + stem)) {
      issues.push({
        ...issue(
          'P2',
          'redox',
          '涉及有机氧化/KMnO4 等易歧义体系',
          '人工核实产物与条件后决定去留',
          { blocksFormal: true },
        ),
        needsVerification: true,
      })
    }

    // Ethanol combustion / catalytic oxidation
    if (/C2H5OH|乙醇/.test(eq + name) && /O2|催化|Cu|Ag/.test(eq + name + String(srcRow.conditions || ''))) {
      issues.push({
        ...issue(
          'P2',
          'redox',
          '乙醇氧化/燃烧条件敏感，需核实 oxidant/reductant 字段',
          '对照教材核实后保留',
          { snippet: `${ox}/${re}`, blocksFormal: true },
        ),
        needsVerification: true,
      })
    }

    // Cross-check answer vs field
    if (tid === 'rxn_oxidant_single' && ox) {
      const correct = (item.options || []).find((o) => o.key === item.answer)
      if (correct && correct.text !== ox) {
        issues.push(
          issue(
            'P0',
            'answer',
            `氧化剂题标准选项「${correct.text}」与知识库 oxidant「${ox}」不一致`,
            '以核实后的知识库字段为准改正',
            { snippet: `${correct.text} vs ${ox}` },
          ),
        )
      }
    }
    if (tid === 'rxn_reductant_single' && re) {
      const correct = (item.options || []).find((o) => o.key === item.answer)
      if (correct && correct.text !== re) {
        issues.push(
          issue(
            'P0',
            'answer',
            `还原剂题标准选项与知识库 reductant 不一致`,
            '改正答案或字段',
            { snippet: `${correct?.text} vs ${re}` },
          ),
        )
      }
    }

    // Na + water historical
    if (/Na.*H2O|钠.*水/.test(eq + name) || item.sourceCode === 'rxn.2Na_2H2O') {
      issues.push({
        ...issue(
          'P2',
          'redox',
          '钠与水反应：历史重点复查项，需确认氧化剂为 H2O',
          '人工核对 oxidant/reductant',
          { blocksFormal: true },
        ),
        needsVerification: true,
      })
    }
  }

  if (tid === 'rxn_not_marked_redox') {
    // Pedagogical meta-question — answer 错误 is intentional
    if (item.answer !== '错误' && item.answer !== '错') {
      issues.push(
        issue('P1', 'answer', '证据不足题标准答案应为「错误」', '改正答案'),
      )
    }
    issues.push(
      issue(
        'P3',
        'stem',
        '元认知判断题（字段缺失≠非氧化还原），训练价值有限且易让学生误解',
        '阶段B考虑替换为实质价态判断',
        { blocksFormal: true },
      ),
    )
  }

  if (tid === 'rxn_eq_identify') {
    const correct = (item.options || []).find((o) => o.key === item.answer)
    if (srcRow && correct) {
      const eq = String(srcRow.equation || '').replace(/\s+/g, '')
      const opt = String(correct.text || '').replace(/\s+/g, '')
      if (eq && opt && eq !== opt && normFormula(eq) !== normFormula(opt)) {
        // allow minor space diff already stripped
        if (eq.replace(/ /g, '') !== opt.replace(/ /g, '')) {
          issues.push(
            issue(
              'P0',
              'answer',
              '方程式识别题正确选项与知识库 equation 不一致',
              '同步选项与知识库',
              { snippet: `${opt} | ${eq}` },
            ),
          )
        }
      }
    }
    // distractor H2O  as reactant replacement may accidentally equal real equation for water reactions
    const opts = item.options || []
    const texts = opts.map((o) => normFormula(o.text))
    if (new Set(texts).size !== texts.length) {
      issues.push(issue('P1', 'options', '方程式选项规范化后重复', '更换干扰项'))
    }
  }

  if (tid === 'sub_formula_blank' || tid === 'sub_formula_single') {
    if (srcRow) {
      const f = String(srcRow.canonical_formula || srcRow.formula || '')
      if (item.qtype === 'blank' && item.answerType === 'chem_formula') {
        if (normFormula(item.answer) !== normFormula(f) && f) {
          issues.push(
            issue(
              'P0',
              'answer',
              `化学式答案 ${item.answer} 与知识库 ${f} 不一致`,
              '以知识库为准',
            ),
          )
        }
      }
      if (item.qtype === 'single') {
        const correct = (item.options || []).find((o) => o.key === item.answer)
        if (correct && f && normFormula(correct.text) !== normFormula(f)) {
          issues.push(
            issue('P0', 'answer', '单选化学式与知识库不一致', '改正'),
          )
        }
      }
    }
  }

  // Element vs substance confusion in stem
  if (/氯元素.*氯气|元素性质.*单质/.test(stem)) {
    issues.push(
      issue('P1', 'stem', '可能混淆元素与单质概念', '改写题干'),
    )
  }

  // Home experiment danger
  if (tid === 'exp_home_forbidden' && item.answer !== '错误' && item.answer !== '错') {
    issues.push(issue('P0', 'answer', '禁止家用实验题答案必须为错误', '改正'))
  }

  // 22.4 condition
  if (tid === 'fm_stp_judge') {
    if (item.answer !== '错误' && item.answer !== '错') {
      issues.push(
        issue('P0', 'answer', '22.4 适用任意 T/P 应为错误', '改正答案'),
      )
    }
  }

  // kp misconception: answer should be 错误
  if (tid === 'kp_misconception_judge' && item.answer !== '错误' && item.answer !== '错') {
    issues.push(
      issue('P0', 'answer', '易错点辨析题答案应为「错误」', '改正'),
    )
  }

  // Second review FIX on source already handled
  if (second?.conclusion === 'NEEDS_FIX') {
    issues.push(
      issue('P0', 'source', '来源知识二审 NEEDS_FIX', '禁用关联题目'),
    )
  }
}

function auditDifficulty(item, issues) {
  if (item.difficulty === 2) {
    const memTemplates = new Set([
      'el_symbol_blank',
      'el_symbol_single',
      'el_z_blank',
      'sub_formula_blank',
      'sub_formula_single',
      'sub_color_judge',
      'sub_common_name_judge',
      'kp_term_blank',
      'sub_uses_judge',
    ])
    if (memTemplates.has(item.templateId)) {
      issues.push(
        issue(
          'P2',
          'difficulty',
          '标记为提高(2)但模板属基础记忆/复述',
          '建议降为难度1（本次不改库）',
          { blocksFormal: false, affectsTrial: false },
        ),
      )
    }
    // chem_prop_judge / oxidant as 2 is OK
  }
  if (item.difficulty === 3) {
    issues.push(
      issue('P3', 'difficulty', '存在挑战难度标记（阶段A本应无挑战题）', '核实'),
    )
  }
}

function auditCategory(item, issues) {
  const sp = item.specialtyCode
  const cat = item.categoryCode
  const tid = item.templateId

  const expect = {
    sub_formula_blank: ['substance.formula', 'memory.formula'],
    sub_formula_single: ['substance.formula', 'memory.formula'],
    sub_color_judge: ['memory.color', 'substance.color'],
    rxn_oxidant_single: ['redox.oxidant', 'redox.identify'],
    rxn_reductant_single: ['redox.reductant', 'redox.identify'],
    rxn_is_redox_judge: ['redox.identify', 'equation.redox_analysis'],
    rxn_cond_judge: ['equation.condition', 'equation.true_false'],
    el_symbol_blank: ['memory.symbol', 'periodic.elem_name'],
    fm_stp_judge: ['calculation.molar_volume'],
    exp_home_forbidden: ['experiment.safety'],
  }
  const key = `${sp}.${cat}`
  if (expect[tid] && !expect[tid].includes(key)) {
    issues.push(
      issue(
        'P2',
        'category',
        `模板 ${tid} 挂在 ${key}，预期之一为 ${expect[tid].join('|')}`,
        '调整分类或确认有意映射',
        { blocksFormal: true },
      ),
    )
  }
  // redox specialty but neutralization
  if (sp === 'redox' && /中和反应|复分解反应/.test(item.stem)) {
    issues.push(
      issue('P1', 'specialty', '中和/复分解题挂在氧化还原专项', '改挂 equation/ion'),
    )
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
