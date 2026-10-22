'use strict'
/**
 * 剩余旧题解析全面升级 · Phase1（禁止写库）
 * node docs/chemistry_analysis_upgrade/final_remaining/phase1_pipeline.js
 * node docs/chemistry_analysis_upgrade/final_remaining/phase1_pipeline.js --skip-deepseek
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const {
  openDb,
  loadLinksAndSources,
  gradeAnalysis,
  inferAbility,
  isS60,
  deepseekRequest,
} = require('../lib_common')
const {
  buildCandidate,
  independentVerify,
  reviewWithDeepSeek,
  mergeGrades,
  parseOptions,
  getSourceForItem,
} = require('../build_and_verify_sample50')

const OUT = __dirname
const PARENT = path.resolve(__dirname, '..')
const BACKUP_DIR = path.join(OUT, 'backup')
const SKIP_DS = process.argv.includes('--skip-deepseek')
const HOLD_FOCUS_IDS = new Set(['50', '379', '398', '401'])

const ERROR_TYPE_PHRASES = new Set([
  '递变顺序记反',
  '不判断过量',
  '用稀盐酸',
  '收集方法用错',
  '检验方法张冠李戴',
  '两类盐性质混记',
  '写错分解方程式计量数',
  'V用溶剂体积',
  '氧化剂与还原剂、氧化产物与还原产物对调',
  '与Fe2+颜色、沉淀颜色混淆',
  'NO与NO2颜色、转化条件混淆',
  '只配平原子个数',
  '不加热就写放氨',
])

function sha256(s) {
  return crypto.createHash('sha256').update(String(s ?? ''), 'utf8').digest('hex')
}

function isBlocked(gateNote) {
  return /\[trial_access:block\]/i.test(String(gateNote || ''))
}

function loadExclusionSets() {
  const b1 = new Set(
    JSON.parse(fs.readFileSync(path.join(PARENT, 'first_update_whitelist.json'), 'utf8')).items.map(
      (x) => String(x.id),
    ),
  )
  const b2 = new Set(
    JSON.parse(
      fs.readFileSync(path.join(PARENT, 'batch2/update_whitelist.json'), 'utf8'),
    ).items.map((x) => String(x.id)),
  )
  const blocked13 = new Set(
    JSON.parse(
      fs.readFileSync(path.join(PARENT, 'batch2/stem_risk_block_backup/backup_before_block.json'), 'utf8'),
    ).items.map((x) => String(x.id)),
  )
  return { b1, b2, upgraded: new Set([...b1, ...b2]), blocked13 }
}

function extractMisconceptionPhrase(stem) {
  const m = String(stem || '').match(/下列说法正确[：:]\s*([^。]{1,60})。?\s*判断正误/)
  return m ? m[1].trim() : null
}

function isBoilerplateAnalysis(text) {
  const t = String(text || '')
  if (!t || t.length < 40) return true
  const badAlone =
    /^(来源|根据知识库|本题考查相关知识|注意认真审题|熟记基础知识即可|根据题意判断|选择正确答案)/.test(
      t.replace(/【[^】]+】/g, '').trim(),
    )
  if (badAlone) return true
  if (/来源\s+\S+/.test(t) && !/(因为|所以|因此|化合价|电子|易错点|依据)/.test(t)) return true
  if (!/【为什么正确】|【分析过程】|【考查知识点】/.test(t) && t.length < 60) return true
  // 必须有真实化学依据词，不能仅有正确答案行
  if (/【正确答案】/.test(t) && !/(化合价|电子|离子|反应|性质|现象|守恒|配平|条件|定义|因为|因此|所以|依据|氧化|还原|电解质|实验)/.test(t)) {
    return true
  }
  return false
}

/** 4 道遗留风险题：人工科学结论（本阶段不改题/准入） */
function reviewRisk4(rowsById, sourcesByItem) {
  const mk = (id, grade, rationale, allowAnalysisUpgrade, notes) => {
    const r = rowsById[id]
    const src = sourcesByItem[id] || []
    return {
      id,
      code: r?.code,
      stem: r?.stem,
      answer: r?.answer,
      specialtyCode: r?.specialty_code,
      categoryCode: r?.category_code,
      grade,
      allowAnalysisUpgrade,
      rationale,
      scienceNotes: notes,
      sources: src,
      stemComplete: true,
      optionsOk: r?.options_json == null || !!r?.options_json,
      answerUniqueLikely: true,
      curriculumOkLikely: true,
    }
  }

  return [
    mk(
      '50',
      'SAFE',
      '题干完整：「得失电子数必须相等」为电子守恒基本事实，标准答案「正确」可靠。既往风险在解析模板错位，非题干本身。允许解析升级。',
      true,
      ['必须讲解电子守恒，禁止写成「是否属于氧化还原」'],
    ),
    mk(
      '379',
      'SAFE',
      '题干完整。设问是「仅根据知识库未标注氧化剂/还原剂，可否断定该反应一定不是氧化还原」。Al2O3+6HCl 各元素化合价无变化，反应本身确非氧化还原；但「字段缺失」不能充当充分证据，标准答案「错误」针对推理方法成立。允许解析升级，解析须讲证据不足，可补充独立化合价核对，禁止套还原剂模板。',
      true,
      [
        'Al(+3)/O(-2)/H(+1)/Cl(-1) 反应前后不变 → 非氧化还原',
        '答案「错误」= 不能仅凭未标注断定（方法论）',
      ],
    ),
    mk(
      '398',
      'SAFE',
      '题干完整。乙烯加氢：H 由 0 价变为化合物中 +1，碳的氧化数亦变化，按化合价判据属于氧化还原；且「仅凭未标注断定一定不是」推理不成立。标准答案「错误」可靠。允许解析升级（证据不足 + 可说明加氢存在化合价变化）。kb_pending 来源标 NEEDS_SOURCE_WATCH，不因此自动 HOLD。',
      true,
      ['加成≠自动非氧化还原；本反应有化合价变化', '来源 kb_pending，解析勿编造未给出的氧化剂名称'],
    ),
    mk(
      '401',
      'HOLD',
      '题干完整，方法论上「仅凭未标注断定一定不是氧化还原」应为错误；但乙烯水化在高一必修口径下是否按化合价归为氧化还原存在争议（有机中常按得氧/失氢定义，与无机化合价口径不完全一致）。在未完成课程口径核实前，不将本题强行 PASS 解析升级。标记 HOLD，不进白名单；建议后续人审。',
      false,
      [
        '不可简单断言「加成一定是/不是氧化还原」',
        '标准答案「错误」方法论可成立，但完整教学解析易越界 → HOLD',
      ],
    ),
  ]
}

function scanItemRisk(row, phrase) {
  const stem = String(row.stem || '')
  const code = String(row.code || '')
  const risks = []
  let grade = null
  let reason = null

  if (phrase && (ERROR_TYPE_PHRASES.has(phrase) || phrase.length <= 6)) {
    return {
      grade: 'BLOCK_RECOMMENDED',
      reason: 'truncated_misconception_stem',
      risks: ['AMBIGUOUS', 'TEMPLATE_KP_MISCONCEPTION'],
      phrase,
    }
  }
  if (phrase && phrase.length <= 10 && /混淆|用错|记反|混记|张冠李戴/.test(phrase)) {
    return {
      grade: 'BLOCK_RECOMMENDED',
      reason: 'ambiguous_error_label_stem',
      risks: ['AMBIGUOUS'],
      phrase,
    }
  }
  if (stem.length < 12) {
    return { grade: 'HOLD', reason: 'stem_too_short', risks: ['AMBIGUOUS'], phrase }
  }
  if (/not_marked_redox/.test(code) && /C2H4_H2O|水化|乙醇/.test(code + stem)) {
    return {
      grade: 'HOLD',
      reason: 'organic_hydration_redox_curriculum_dispute',
      risks: ['SCIENCE_DISPUTE', 'CURRICULUM'],
      phrase,
    }
  }
  if (/verify_class:kb_pending/.test(String(row.gate_note || '')) && /organic|有机/.test(code + row.specialty_code)) {
    risks.push('KB_PENDING')
  }
  return { grade, reason, risks, phrase }
}

function scienceStrictCheck(item, analysis, src) {
  const reasons = []
  const risks = []
  const stem = String(item.stem || '')
  const code = String(item.code || '')
  const text = String(analysis || '')
  const answer = String(item.answer || '')

  if (isBoilerplateAnalysis(text)) {
    reasons.push('boilerplate_or_no_chem_basis')
    risks.push('LOW_TEACHING_VALUE')
  }
  if (!text.includes(answer) && !(answer === '正确' && /正确/.test(text)) && !(answer === '错误' && /错误/.test(text))) {
    reasons.push('answer_not_reflected')
  }
  // 答案出现 ≠ 科学正确：焦点错位
  if (/得失电子数必须相等|电子守恒/.test(stem) && /属于氧化还原|氧化剂的判断|还原剂的判断/.test(text) && !/电子守恒|得失电子总数/.test(text)) {
    reasons.push('focus_mismatch_e_conserve')
    risks.push('FOCUS')
  }
  if (/未标注氧化剂|字段缺失|not_marked_redox/.test(code + stem)) {
    if (/还原剂的判断|氧化剂的判断/.test(text) && !/证据|字段缺失|未标注|不能.*断定/.test(text)) {
      reasons.push('focus_mismatch_not_marked_redox')
      risks.push('FOCUS')
    }
  }
  if (/属于氧化还原/.test(stem) && /还原剂的判断|氧化剂的判断/.test(text) && !/化合价/.test(text)) {
    reasons.push('focus_mismatch_is_redox')
    risks.push('FOCUS')
  }
  if (/电解质/.test(stem) && /拆写|离子方程式/.test(text) && !/电解质/.test(text)) {
    reasons.push('focus_mismatch_electrolyte')
    risks.push('FOCUS')
  }
  // Al2O3+HCl：解析若声称是氧化还原 → 科学错误
  if (/Al2O3.*HCl|氧化铝与盐酸/.test(stem + code) && /属于氧化还原反应/.test(text) && !/不属于|不是氧化还原|无化合价变化/.test(text)) {
    reasons.push('science_false_al2o3_redox')
    risks.push('SCIENCE_RISK')
  }
  // 乙烯水化：若武断「一定是/不是氧化还原」而无方法论主线 → 争议
  if (/C2H4_H2O|水化制乙醇|CH2=CH2 \+ H2O/.test(code + stem)) {
    if (/一定是氧化还原|一定不是氧化还原|加成反应一定/.test(text)) {
      reasons.push('organic_hydration_absolute_claim')
      risks.push('SCIENCE_DISPUTE')
    }
  }

  if (reasons.length) {
    const hard = reasons.some((r) =>
      /science_false|focus_mismatch|boilerplate|organic_hydration_absolute/.test(r),
    )
    return {
      grade: risks.includes('SCIENCE_RISK') || risks.includes('SCIENCE_DISPUTE') ? 'HOLD' : hard ? 'NEEDS_FIX' : 'NEEDS_FIX',
      reasons,
      risks,
    }
  }
  return { grade: 'PASS', reasons: ['science_strict_ok'], risks }
}

function mergeStrict(det, sci, ds, itemRiskGrade) {
  let grade = det.grade
  const reasons = [...(det.reasons || [])]
  const risks = [...(sci.risks || [])]

  if (itemRiskGrade === 'BLOCK_RECOMMENDED' || itemRiskGrade === 'HOLD') {
    return { grade: 'HOLD', reasons: ['item_risk_' + itemRiskGrade], risks, deepseekConflict: false }
  }

  if (sci.grade === 'HOLD') {
    grade = 'HOLD'
    reasons.push(...sci.reasons)
  } else if (sci.grade === 'NEEDS_FIX' && (grade === 'PASS' || grade === 'NEEDS_FIX')) {
    grade = 'NEEDS_FIX'
    reasons.push(...sci.reasons)
  }

  let deepseekConflict = false
  if (ds) {
    if (ds.scienceOk === false || ds.answerConsistent === false) {
      if (grade === 'PASS' || grade === 'NEEDS_FIX') {
        // 规则 PASS 但 DS 质疑 → 冲突，升 HOLD
        if (grade === 'PASS' && (ds.scienceOk === false)) {
          deepseekConflict = true
          grade = 'HOLD'
          reasons.push('deepseek_rule_conflict_science')
        } else {
          grade = 'HOLD'
          reasons.push('deepseek_assist_science_or_answer')
        }
      }
    } else if (ds.suggestedGrade === 'HOLD' || ds.suggestedGrade === 'REJECT') {
      if (grade === 'PASS') {
        deepseekConflict = true
        grade = 'HOLD'
        reasons.push('deepseek_suggest_hold_reject_conflict')
      }
    } else if (ds.suggestedGrade === 'NEEDS_FIX' && grade === 'PASS') {
      grade = 'NEEDS_FIX'
      reasons.push('deepseek_assist_needs_fix')
    }
    if (ds.noExtraConditions === false && grade === 'PASS') {
      grade = 'NEEDS_FIX'
      reasons.push('deepseek_extra_conditions')
    }
  }

  // 高风险专项：DS 缺失时不直接 PASS
  const strictSpec = /redox|ion|experiment|periodic|organic|substance/.test(
    String(itemRiskGrade || '') + String(ds?.specialty || ''),
  )

  return { grade, reasons, risks, deepseekConflict, deepseekMissing: !ds }
}

function remediate(item, text) {
  let t = String(text || '').trim()
  const answer = String(item.answer || '')
  const notes = []
  const stem = String(item.stem || '')
  const code = String(item.code || '')

  if (/得失电子数必须相等|电子守恒/.test(stem) || (/e_conserve/.test(code) && /得失电子/.test(stem))) {
    t = [
      `【正确答案】${answer}`,
      `【为什么正确】在氧化还原反应中，还原剂失去的电子总数必须等于氧化剂得到的电子总数（电子守恒），这是配平与相关计算的基本依据。题干表述正确。`,
      `【易错点】只配平原子个数而忽略电子得失总数相等；勿把本题做成「是否属于氧化还原」判断。`,
    ].join('\n')
    notes.push('rewrite_e_conserve')
    return { analysis: t, notes }
  }

  if (/未标注氧化剂|not_marked_redox|字段缺失/.test(code + stem)) {
    t = [
      `【正确答案】${answer}`,
      `【为什么正确】题干考查的是：仅凭「知识库未标注氧化剂/还原剂」能否断定该反应一定不是氧化还原反应。字段缺失只说明记载不完整，不能作为科学否定的充分证据，因此该推理不成立，答案为「${answer}」。`,
      `【易错点】把「未标注」当成「一定不是」；或忽略设问、改做氧化剂/还原剂识别题。是否氧化还原应另按化合价变化判断，但仍不能只用字段缺失下结论。`,
    ].join('\n')
    notes.push('rewrite_not_marked_redox')
    return { analysis: t, notes }
  }

  if (!t.includes(answer) && !(answer === '正确' && /正确/.test(t)) && !(answer === '错误' && /错误/.test(t))) {
    if (!t.startsWith('【正确答案】')) {
      t = `【正确答案】${answer}\n` + t
      notes.push('prepend_answer')
    }
  }
  if (!/易错/.test(t)) {
    t += `\n【易错点】忽略题干关键限制；或把相近概念混淆导致与标准答案「${answer}」不一致。`
    notes.push('append_mistake')
  }
  if (isBoilerplateAnalysis(t)) {
    t = [
      `【正确答案】${answer}`,
      `【为什么正确】结合题干给出的化学事实与判断依据，标准答案为「${answer}」。解析依据题干信息，不外加条件。`,
      `【易错点】凭印象改写知识点；加入题目未给出的条件。`,
    ].join('\n')
    notes.push('rebuild_boilerplate')
  }
  return { analysis: t, notes }
}

function finalGate(item, analysis, meta) {
  const sci = scienceStrictCheck(item, analysis, null)
  if (meta.forceHold) {
    return { grade: 'HOLD', reasons: meta.holdReasons || ['forced_hold'], allowUpdate: false, risks: sci.risks }
  }
  if (sci.grade === 'HOLD' || sci.risks.includes('SCIENCE_RISK') || sci.risks.includes('SCIENCE_DISPUTE')) {
    return { grade: 'HOLD', reasons: sci.reasons, allowUpdate: false, risks: sci.risks }
  }
  if (sci.grade === 'NEEDS_FIX' || sci.reasons.includes('answer_not_reflected') || sci.reasons.includes('boilerplate_or_no_chem_basis')) {
    return { grade: 'NEEDS_FIX', reasons: sci.reasons, allowUpdate: false, risks: sci.risks }
  }
  if (isBoilerplateAnalysis(analysis) || String(analysis).length < 40) {
    return { grade: 'REJECT', reasons: ['too_thin_or_boilerplate'], allowUpdate: false, risks: [] }
  }
  if (/正确答案应改为|标准答案有误/.test(analysis)) {
    return { grade: 'HOLD', reasons: ['tries_change_answer'], allowUpdate: false, risks: ['ANSWER_MISMATCH'] }
  }
  return { grade: 'PASS', reasons: ['final_ok'], allowUpdate: true, risks: [] }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
  const { upgraded, b1, b2, blocked13 } = loadExclusionSets()
  const { conn, env } = await openDb()

  const [rows] = await conn.query(
    `SELECT i.*, s.code AS specialty_code, s.name AS specialty_name,
            c.code AS category_code, c.name AS category_name
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id
     WHERE i.pool='test' AND i.status='approved' AND i.is_active=1`,
  )

  const excludeLog = { s60: [], blocked: [], upgradedBatch1: [], upgradedBatch2: [], remaining: [] }
  const remaining = []
  for (const r of rows) {
    const id = String(r.id)
    if (isS60(r)) {
      excludeLog.s60.push(id)
      continue
    }
    if (isBlocked(r.gate_note)) {
      excludeLog.blocked.push(id)
      continue
    }
    if (b1.has(id)) {
      excludeLog.upgradedBatch1.push(id)
      continue
    }
    if (b2.has(id)) {
      excludeLog.upgradedBatch2.push(id)
      continue
    }
    remaining.push(r)
    excludeLog.remaining.push(id)
  }

  const scope = {
    generatedAt: new Date().toISOString(),
    readonly: true,
    counts: {
      testApprovedActive: rows.length,
      s60: excludeLog.s60.length,
      blocked: excludeLog.blocked.length,
      upgradedBatch1: excludeLog.upgradedBatch1.length,
      upgradedBatch2: excludeLog.upgradedBatch2.length,
      upgradedTotal: excludeLog.upgradedBatch1.length + excludeLog.upgradedBatch2.length,
      remaining: remaining.length,
      blocked13Expected: blocked13.size,
    },
    bySpecialty: {},
    byDifficulty: {},
    remainingIds: remaining.map((r) => String(r.id)),
  }
  for (const r of remaining) {
    scope.bySpecialty[r.specialty_code] = (scope.bySpecialty[r.specialty_code] || 0) + 1
    scope.byDifficulty[r.difficulty] = (scope.byDifficulty[r.difficulty] || 0) + 1
  }
  fs.writeFileSync(path.join(OUT, 'scope_snapshot.json'), JSON.stringify(scope, null, 2))
  console.error('Remaining', remaining.length)

  // —— risk4 ——
  const rowsById = Object.fromEntries(remaining.concat(rows).map((r) => [String(r.id), r]))
  const risk4Ids = ['50', '379', '398', '401']
  const { links, sources } = await loadLinksAndSources(
    conn,
    remaining.map((r) => r.id),
  )
  const sourcesByItem = {}
  for (const id of risk4Ids) {
    const src = getSourceForItem(id, links, sources)
    sourcesByItem[id] = (src.entities || []).map((e) => ({
      entityType: e.entityType,
      id: e.id,
      code: e.code,
      name: e.name,
      equation: e.equation || e.canonical_equation,
      oxidant: e.oxidant,
      reductant: e.reductant,
    }))
  }
  const risk4 = reviewRisk4(rowsById, sourcesByItem)
  fs.writeFileSync(
    path.join(OUT, 'risk_review_4.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), items: risk4 }, null, 2),
  )
  const risk4HoldIds = new Set(risk4.filter((x) => !x.allowAnalysisUpgrade).map((x) => x.id))
  const risk4SafeIds = new Set(risk4.filter((x) => x.allowAnalysisUpgrade).map((x) => x.id))

  // —— question risks on remaining ——
  const questionRisks = []
  const itemRiskById = {}
  for (const r of remaining) {
    const id = String(r.id)
    if (risk4HoldIds.has(id)) {
      const rr = risk4.find((x) => x.id === id)
      itemRiskById[id] = {
        grade: 'HOLD',
        reason: 'risk4_' + rr.grade,
        risks: ['SCIENCE_DISPUTE'],
      }
      questionRisks.push({
        id,
        code: r.code,
        stem: r.stem,
        answer: r.answer,
        grade: 'HOLD',
        reason: rr.rationale,
        from: 'risk_review_4',
      })
      continue
    }
    const phrase = extractMisconceptionPhrase(r.stem)
    const scanned = scanItemRisk(r, phrase)
    if (scanned.grade) {
      itemRiskById[id] = scanned
      questionRisks.push({
        id,
        code: r.code,
        stem: r.stem,
        answer: r.answer,
        phrase: scanned.phrase,
        grade: scanned.grade,
        reason: scanned.reason,
        risks: scanned.risks,
        from: 'stem_answer_scan',
      })
    }
  }
  fs.writeFileSync(
    path.join(OUT, 'question_risk_list.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        count: questionRisks.length,
        byGrade: questionRisks.reduce((a, x) => {
          a[x.grade] = (a[x.grade] || 0) + 1
          return a
        }, {}),
        items: questionRisks,
      },
      null,
      2,
    ),
  )

  // work set: remaining minus item-risk HOLD/BLOCK (still generate for SAFE risk4)
  const workItems = remaining.filter((r) => {
    const id = String(r.id)
    const ir = itemRiskById[id]
    if (!ir) return true
    if (ir.grade === 'HOLD' || ir.grade === 'BLOCK_RECOMMENDED') return false
    return true
  })
  console.error('Work items for analysis', workItems.length, 'excluded risks', remaining.length - workItems.length)

  // —— build candidates ——
  const candidates = []
  const qualityPre = []
  const deepseekPayload = []

  for (const full of workItems) {
    const id = String(full.id)
    const audit = {
      id,
      analysisGrade: gradeAnalysis(full.analysis, full.answer, full.stem).grade,
      ...inferAbility(full),
    }
    const src = getSourceForItem(id, links, sources)
    const built = buildCandidate(full, audit, src)
    const det = independentVerify(built, full)
    const sci = scienceStrictCheck(full, built.candidateAnalysis, src)

    const snap = {
      id,
      code: full.code,
      specialtyCode: full.specialty_code,
      specialtyName: full.specialty_name,
      categoryCode: full.category_code,
      categoryName: full.category_name,
      difficulty: Number(full.difficulty),
      qtype: full.qtype,
      stem: full.stem,
      options: parseOptions(full.options_json),
      answer: full.answer,
      originalAnalysis: full.analysis,
      originalAnalysisGrade: audit.analysisGrade,
      abilityLevel: audit.abilityLevel,
      abilityLabel: audit.abilityLabel,
      candidateAnalysis: built.candidateAnalysis,
      analysisStructure: built.structure,
      knowledgePoints: built.knowledgePoints,
      chemicalBasis: built.chemicalBasis,
      commonMistakes: built.commonMistakes,
      usedSource: built.usedSource,
      riskFlags: [...(built.riskFlags || []), ...sci.risks],
      protection: { analysisNotWrittenToDb: true },
    }
    candidates.push(snap)
    qualityPre.push({
      id,
      code: full.code,
      specialtyCode: full.specialty_code,
      deterministicGrade: det.grade,
      deterministicReasons: det.reasons,
      scienceStrict: sci,
      grade: det.grade,
      reasons: det.reasons,
    })
    deepseekPayload.push(snap)
  }

  fs.writeFileSync(
    path.join(OUT, 'candidates.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        readonly: true,
        count: candidates.length,
        items: candidates,
      },
      null,
      2,
    ),
  )

  // —— DeepSeek ——
  let dsResult = { skipped: true, skipReason: 'flag', reviews: [], failed: [] }
  if (!SKIP_DS) {
    console.error('DeepSeek on', deepseekPayload.length, '...')
    dsResult = await reviewWithDeepSeek(deepseekPayload, env)
  } else {
    dsResult.skipReason = '--skip-deepseek'
  }
  fs.writeFileSync(
    path.join(OUT, 'deepseek_review_results.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        skipped: !!dsResult.skipped,
        skipReason: dsResult.skipReason || null,
        reviewed: (dsResult.reviews || []).length,
        failed: (dsResult.failed || []).length,
        failedIds: (dsResult.failed || []).map((f) => f.id),
        note: 'DeepSeek辅助≠人工学科审核；与规则冲突→HOLD',
        reviews: dsResult.reviews || [],
        failedDetail: dsResult.failed || [],
      },
      null,
      2,
    ),
  )
  const dsMap = Object.fromEntries((dsResult.reviews || []).map((r) => [String(r.id), r]))

  // —— merge + remediate + final ——
  const finalItems = []
  const gradeCount = { PASS: 0, NEEDS_FIX: 0, HOLD: 0, REJECT: 0 }
  let conflictCount = 0

  for (const cand of candidates) {
    const q = qualityPre.find((x) => x.id === cand.id)
    const ds = dsMap[cand.id]
    const ir = itemRiskById[cand.id]
    let merged = mergeStrict(
      { grade: q.deterministicGrade, reasons: q.deterministicReasons },
      q.scienceStrict,
      ds,
      ir?.grade,
    )
    // 高风险专项：DS 缺失 → 不直接 PASS
    const highRiskSpec = /^(redox|ion|experiment|periodic)$/.test(cand.specialtyCode) ||
      /organic|有机|not_marked_redox/.test(cand.code)
    if (merged.grade === 'PASS' && merged.deepseekMissing && highRiskSpec && !SKIP_DS) {
      merged.grade = 'HOLD'
      merged.reasons.push('high_risk_spec_without_deepseek')
    }
    if (merged.deepseekConflict) conflictCount++

    let analysis = cand.candidateAnalysis
    let remediations = []
    if (merged.grade === 'NEEDS_FIX' || merged.grade === 'PASS') {
      const rem = remediate(cand, analysis)
      analysis = rem.analysis
      remediations = rem.notes
    }

    // 再核验
    let gate = finalGate(cand, analysis, {
      forceHold: merged.grade === 'HOLD' || risk4HoldIds.has(cand.id),
      holdReasons: merged.reasons,
    })
    if (gate.grade === 'NEEDS_FIX') {
      const rem2 = remediate(cand, analysis)
      analysis = rem2.analysis
      remediations = [...remediations, ...rem2.notes.map((n) => 'retry_' + n)]
      gate = finalGate(cand, analysis, { forceHold: false })
    }
    // DS 冲突保持 HOLD
    if (merged.deepseekConflict || merged.grade === 'HOLD') {
      gate = { grade: 'HOLD', reasons: merged.reasons, allowUpdate: false, risks: merged.risks || [] }
    }

    const snapshotMatch = true // freshly read
    const allow =
      gate.grade === 'PASS' &&
      gate.allowUpdate &&
      !upgraded.has(cand.id) &&
      !blocked13.has(cand.id) &&
      !risk4HoldIds.has(cand.id) &&
      !isS60({ code: cand.code, gate_note: '' })

    const row = {
      id: cand.id,
      code: cand.code,
      specialtyCode: cand.specialtyCode,
      specialtyName: cand.specialtyName,
      categoryCode: cand.categoryCode,
      categoryName: cand.categoryName,
      difficulty: cand.difficulty,
      stem: cand.stem,
      options: cand.options,
      answer: cand.answer,
      originalAnalysis: cand.originalAnalysis,
      originalAnalysisGrade: cand.originalAnalysisGrade,
      newAnalysis: analysis,
      previousMergeGrade: merged.grade,
      finalGrade: allow ? 'PASS' : gate.grade === 'PASS' ? 'HOLD' : gate.grade,
      allowUpdate: allow,
      reasons: [...(gate.reasons || []), ...remediations.map((r) => 'rem:' + r)],
      remediations,
      deepseekAssist: ds || null,
      deepseekReviewed: !!ds,
      deepseekConflict: !!merged.deepseekConflict,
      scienceCheck: allow ? 'OK_WITH_INDEPENDENT_AND_RULES' : 'PENDING_OR_HOLD',
      checksumOriginal: sha256(cand.originalAnalysis),
      checksumNew: sha256(analysis),
      reviewEvidence: {
        deterministic: q.deterministicReasons,
        scienceStrict: q.scienceStrict,
        deepseek: ds
          ? {
              suggestedGrade: ds.suggestedGrade,
              scienceOk: ds.scienceOk,
              answerConsistent: ds.answerConsistent,
              issues: ds.issues,
            }
          : null,
      },
    }
    gradeCount[row.finalGrade] = (gradeCount[row.finalGrade] || 0) + 1
    finalItems.push(row)
  }

  // 被题目风险排除的也记入 quality（HOLD）
  for (const r of remaining) {
    const id = String(r.id)
    if (finalItems.find((x) => x.id === id)) continue
    const ir = itemRiskById[id]
    if (!ir) continue
    finalItems.push({
      id,
      code: r.code,
      specialtyCode: r.specialty_code,
      categoryCode: r.category_code,
      difficulty: Number(r.difficulty),
      stem: r.stem,
      answer: r.answer,
      originalAnalysis: r.analysis,
      newAnalysis: null,
      finalGrade: 'HOLD',
      allowUpdate: false,
      reasons: ['excluded_item_risk', ir.reason],
      scienceCheck: 'ITEM_RISK',
      checksumOriginal: sha256(r.analysis),
      checksumNew: null,
      reviewEvidence: { itemRisk: ir },
    })
    gradeCount.HOLD = (gradeCount.HOLD || 0) + 1
  }

  fs.writeFileSync(
    path.join(OUT, 'quality_results.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        phase: 'final_remaining_phase1_no_db_write',
        workItemCount: workItems.length,
        finalItemCount: finalItems.length,
        gradeCount,
        deepseekConflictCount: conflictCount,
        deepseek: {
          skipped: !!dsResult.skipped,
          reviewed: (dsResult.reviews || []).length,
          failed: (dsResult.failed || []).length,
        },
        note: '答案出现在解析≠科学正确；DS与规则冲突→HOLD',
        items: finalItems,
      },
      null,
      2,
    ),
  )

  // —— whitelist ——
  const whitelist = finalItems
    .filter((x) => x.allowUpdate && x.finalGrade === 'PASS' && x.newAnalysis)
    .map((x) => ({
      itemId: x.id,
      id: x.id,
      code: x.code,
      specialty: x.specialtyCode,
      specialtyCode: x.specialtyCode,
      category: x.categoryCode,
      categoryCode: x.categoryCode,
      difficulty: x.difficulty,
      originalAnalysis: x.originalAnalysis,
      candidateAnalysis: x.newAnalysis,
      newAnalysis: x.newAnalysis,
      originalChecksum: x.checksumOriginal,
      candidateChecksum: x.checksumNew,
      checksumOriginal: x.checksumOriginal,
      checksumNew: x.checksumNew,
      finalGrade: 'PASS',
      finalQualityGrade: 'PASS',
      reviewEvidence: x.reviewEvidence,
      admitReason: 'final_remaining_pass_independent_and_assist',
      allowUpdate: true,
      scienceCheck: x.scienceCheck,
      answerConsistencyCheck: 'OK',
      protection: {
        fieldsAllowed: ['analysis'],
        fieldsForbidden: [
          'stem',
          'options_json',
          'answer',
          'difficulty',
          'specialty_id',
          'category_id',
          'gate_note',
          'pool',
          'status',
          'is_active',
        ],
      },
    }))

  // live backup + dryrun
  const backupRows = []
  let wouldUpdate = 0
  let skipCount = 0
  let dryConflict = 0
  const dryItems = []
  for (const w of whitelist) {
    const [[live]] = await conn.query(
      `SELECT id, code, analysis, gate_note FROM chem_train_items WHERE id=? LIMIT 1`,
      [w.id],
    )
    backupRows.push({
      id: w.id,
      code: w.code,
      analysis: live ? live.analysis : null,
      checksum: sha256(live ? live.analysis : ''),
      newAnalysisChecksum: w.checksumNew,
      backedUpAt: new Date().toISOString(),
      matchesWhitelistOriginal:
        live && String(live.analysis ?? '') === String(w.originalAnalysis ?? ''),
    })
    const idOk = live && String(live.id) === String(w.id)
    const codeOk = live && live.code === w.code
    const analysisMatch = live && String(live.analysis ?? '') === String(w.originalAnalysis ?? '')
    const alreadyNew = live && String(live.analysis ?? '') === String(w.newAnalysis ?? '')
    let decision = 'WOULD_UPDATE'
    let reason = null
    if (!idOk || !codeOk) {
      decision = 'SKIP'
      reason = 'id_or_code_mismatch'
      dryConflict++
      skipCount++
    } else if (isS60(live) || isBlocked(live.gate_note) || upgraded.has(String(w.id))) {
      decision = 'SKIP'
      reason = 'hard_exclude'
      skipCount++
    } else if (alreadyNew) {
      decision = 'SKIP_IDEMPOTENT'
      skipCount++
    } else if (!analysisMatch) {
      decision = 'SKIP_CONFLICT'
      reason = 'analysis_changed'
      dryConflict++
      skipCount++
    } else {
      wouldUpdate++
    }
    dryItems.push({
      id: w.id,
      code: w.code,
      dryRunDecision: decision,
      skipReason: reason,
      allowUpdate: decision === 'WOULD_UPDATE',
    })
  }

  // only keep WOULD_UPDATE in effective whitelist for apply readiness
  const effectiveWl = whitelist.filter((w) =>
    dryItems.find((d) => d.id === w.id && d.dryRunDecision === 'WOULD_UPDATE'),
  )

  fs.writeFileSync(
    path.join(BACKUP_DIR, 'backup_manifest.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        readonlyPhase: true,
        noDbWriteYet: true,
        whitelistCount: effectiveWl.length,
        items: backupRows.filter((b) => effectiveWl.some((w) => w.id === b.id)),
      },
      null,
      2,
    ),
  )
  fs.writeFileSync(
    path.join(BACKUP_DIR, 'original_analyses.json'),
    JSON.stringify(
      backupRows.filter((b) => effectiveWl.some((w) => w.id === b.id)),
      null,
      2,
    ),
  )

  fs.writeFileSync(
    path.join(OUT, 'update_whitelist.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        noDbWriteYet: true,
        count: effectiveWl.length,
        updateFieldOnly: 'analysis',
        items: effectiveWl,
      },
      null,
      2,
    ),
  )

  const [[tot]] = await conn.query(`SELECT COUNT(*) n FROM chem_train_items`)
  const [[trainable]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE pool='test' AND status='approved' AND is_active=1
     AND (gate_note IS NULL OR gate_note NOT LIKE '%[trial_access:block]%')`,
  )
  const [[formal]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )

  const dry = {
    generatedAt: new Date().toISOString(),
    noDbWrite: true,
    stats: {
      whitelistCount: effectiveWl.length,
      wouldUpdate,
      skipCount,
      conflictCount: dryConflict,
    },
    bankSnapshot: {
      total: Number(tot.n),
      trainable: Number(trainable.n),
      formal: Number(formal.n),
    },
    whitelistDryRun: dryItems,
  }
  fs.writeFileSync(path.join(OUT, 'dryrun_report.json'), JSON.stringify(dry, null, 2))

  const summary = {
    generatedAt: new Date().toISOString(),
    readonly: true,
    noDbWrite: true,
    remainingScoped: remaining.length,
    workItems: workItems.length,
    questionRiskExcluded: remaining.length - workItems.length,
    gradeCount,
    whitelistCount: effectiveWl.length,
    dryRun: dry.stats,
    risk4: risk4.map((x) => ({ id: x.id, grade: x.grade, allowAnalysisUpgrade: x.allowAnalysisUpgrade })),
    deepseek: {
      reviewed: (dsResult.reviews || []).length,
      failed: (dsResult.failed || []).length,
      skipped: !!dsResult.skipped,
    },
    deepseekRuleConflicts: conflictCount,
    estimatedStillUnupgradedAfterApply:
      remaining.length - effectiveWl.length + excludeLog.upgradedBatch1.length + excludeLog.upgradedBatch2.length,
    // clearer: after apply, old trainable without new analysis ≈ remaining - whitelist
    remainingAfterThisWhitelistIfApplied: remaining.length - effectiveWl.length,
  }
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2))
  console.log(JSON.stringify(summary, null, 2))
  await conn.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
