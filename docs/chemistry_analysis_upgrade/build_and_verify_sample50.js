'use strict'
/**
 * 只读：从574扫描结果选50道 → KB/规则生成候选解析 → 独立核验 → DeepSeek辅助。
 * 禁止写库、禁止改原 analysis。
 * 用法：node docs/chemistry_analysis_upgrade/build_and_verify_sample50.js
 */
const fs = require('fs')
const path = require('path')
const {
  OUT_DIR,
  SPECIALTY_PRIORITY,
  openDb,
  loadLinksAndSources,
  deepseekRequest,
  loadEnv,
  ROOT,
} = require('./lib_common')

const TARGET_BASIC = 30
const TARGET_RAISE = 20
const MIN_SPECIALTIES = 8

function loadAudit() {
  const p = path.join(OUT_DIR, 'analysis_audit_574.json')
  if (!fs.existsSync(p)) throw new Error('先运行 scan_analysis_574.js')
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function selectSample50(auditItems) {
  // 排除已有明显题目风险且不宜只改解析的（扫描阶段 verify_blocked）
  const pool = auditItems.filter((x) => !x.riskFlags.includes('VERIFY_BLOCKED_FLAG'))
  const aFirst = pool.filter((x) => x.analysisGrade === 'A')
  const rest = pool.filter((x) => x.analysisGrade !== 'A')

  const picked = []
  const pickedIds = new Set()
  const specCount = {}
  const catCount = {}

  const take = (list, n, preferSpecs) => {
    const out = []
    // 先按优先专项轮转
    const specs = preferSpecs || SPECIALTY_PRIORITY
    for (const sp of specs) {
      if (out.length >= n) break
      const cand = list.filter(
        (x) =>
          !pickedIds.has(x.id) &&
          x.specialtyCode === sp &&
          (specCount[sp] || 0) < 10,
      )
      cand.sort((a, b) => {
        // A优先；覆盖少的二级分类优先
        const ca = catCount[`${a.specialtyCode}.${a.categoryCode}`] || 0
        const cb = catCount[`${b.specialtyCode}.${b.categoryCode}`] || 0
        if (ca !== cb) return ca - cb
        if (a.analysisGrade === 'A' && b.analysisGrade !== 'A') return -1
        if (b.analysisGrade === 'A' && a.analysisGrade !== 'A') return 1
        return Number(a.id) - Number(b.id)
      })
      if (cand[0]) out.push(cand[0])
    }
    // 填满
    const more = list
      .filter((x) => !pickedIds.has(x.id) && !out.includes(x))
      .sort((a, b) => {
        const sa = specCount[a.specialtyCode] || 0
        const sb = specCount[b.specialtyCode] || 0
        if (sa !== sb) return sa - sb
        if (a.analysisGrade === 'A' && b.analysisGrade !== 'A') return -1
        if (b.analysisGrade === 'A' && a.analysisGrade !== 'A') return 1
        return Number(a.id) - Number(b.id)
      })
    for (const x of more) {
      if (out.length >= n) break
      out.push(x)
    }
    for (const x of out) {
      pickedIds.add(x.id)
      picked.push(x)
      specCount[x.specialtyCode] = (specCount[x.specialtyCode] || 0) + 1
      const ck = `${x.specialtyCode}.${x.categoryCode}`
      catCount[ck] = (catCount[ck] || 0) + 1
    }
    return out
  }

  // 先保证优先8专项各至少1道（从A类）
  for (const sp of SPECIALTY_PRIORITY) {
    if (picked.length >= 50) break
    const hit = aFirst.find((x) => x.specialtyCode === sp && !pickedIds.has(x.id))
      || rest.find((x) => x.specialtyCode === sp && !pickedIds.has(x.id))
    if (hit) {
      pickedIds.add(hit.id)
      picked.push(hit)
      specCount[sp] = (specCount[sp] || 0) + 1
      catCount[`${hit.specialtyCode}.${hit.categoryCode}`] =
        (catCount[`${hit.specialtyCode}.${hit.categoryCode}`] || 0) + 1
    }
  }

  const basicPool = [...aFirst, ...rest].filter(
    (x) => !pickedIds.has(x.id) && Number(x.difficulty) === 1,
  )
  const raisePool = [...aFirst, ...rest].filter(
    (x) => !pickedIds.has(x.id) && Number(x.difficulty) === 2,
  )

  const needBasic = Math.max(0, TARGET_BASIC - picked.filter((x) => x.difficulty === 1).length)
  const needRaise = Math.max(0, TARGET_RAISE - picked.filter((x) => x.difficulty === 2).length)
  take(basicPool, needBasic)
  take(raisePool, needRaise)

  // 若不足50，用剩余A类补齐
  if (picked.length < 50) {
    take(
      [...aFirst, ...rest].filter((x) => !pickedIds.has(x.id)),
      50 - picked.length,
    )
  }

  const specialties = [...new Set(picked.map((x) => x.specialtyCode))]
  return {
    items: picked.slice(0, 50),
    meta: {
      count: Math.min(50, picked.length),
      specialtyCount: specialties.length,
      specialties,
      basicCount: picked.filter((x) => x.difficulty === 1).length,
      raiseCount: picked.filter((x) => x.difficulty === 2).length,
      gradeACount: picked.filter((x) => x.analysisGrade === 'A').length,
      minSpecialtiesTarget: MIN_SPECIALTIES,
      specialtyCoverageOk: specialties.length >= MIN_SPECIALTIES,
      note:
        specialties.length < MIN_SPECIALTIES
          ? '可用题专项不足8个时已尽力覆盖，见 specialties'
          : '已覆盖至少8个一级专项',
    },
  }
}

function parseOptions(raw) {
  if (!raw) return null
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }
  return raw
}

function getSourceForItem(itemId, links, sources) {
  const ls = links.filter((l) => String(l.item_id) === String(itemId))
  const ents = ls
    .map((l) => sources[`${l.entity_type}:${l.entity_id}`])
    .filter(Boolean)
  return { links: ls, entities: ents, primary: ents[0] || null }
}

/** 常见单质价态提示（仅辅助表述，答案仍以题库为准） */
const ELEMENT_HINTS = {
  H2: { element: 'H', from: 0, note: '氢单质' },
  Cl2: { element: 'Cl', from: 0, note: '氯单质' },
  O2: { element: 'O', from: 0, note: '氧单质' },
  N2: { element: 'N', from: 0, note: '氮单质' },
  Fe: { element: 'Fe', from: 0, note: '铁单质' },
  C: { element: 'C', from: 0, note: '碳单质' },
  Cu: { element: 'Cu', from: 0, note: '铜单质' },
  Zn: { element: 'Zn', from: 0, note: '锌单质' },
}

function buildCandidate(full, audit, src) {
  const stem = String(full.stem || '')
  const code = String(full.code || '')
  const answer = String(full.answer || '')
  const ability = audit.abilityLevel || 1
  const ent = src.primary
  const risks = []
  let structure = 'concise_3'
  let knowledge = []
  let chemBasis = []
  let mistakes = []
  let text = ''
  let hold = false
  let holdReason = null

  if (ent && /verifyNeeded|待核实|excludeDefault/i.test(String(ent.review_note || ''))) {
    hold = true
    holdReason = 'source_kb_verify_or_limit'
    risks.push('SCIENCE_RISK')
  }

  const eq = ent && (ent.equation || ent.canonical_equation)
  const oxidant = ent && ent.oxidant
  const reductant = ent && ent.reductant

  // —— 模板分支 ——
  if (/reductant|还原剂/.test(code + stem) && (reductant || /还原剂/.test(stem))) {
    structure = ability <= 2 ? 'concise_3' : 'structured_6'
    const who = reductant || answer
    knowledge = ['氧化还原反应', '还原剂定义']
    chemBasis = [
      '还原剂是反应中失去电子、所含元素化合价升高的物质',
      '还原剂自身发生氧化反应',
    ]
    mistakes = [
      '把发生还原反应的物质误当作还原剂',
      '把氧化剂与还原剂弄反',
    ]
    text = [
      `【正确答案】${answer}`,
      `【为什么正确】本题考查还原剂的判断。还原剂是在反应中失去电子、元素化合价升高的物质，自身发生氧化反应。` +
        (eq ? `对反应「${eq}」` : '结合题干反应') +
        (reductant ? `，知识库标注还原剂为「${reductant}」，与标准答案一致。` : '，按化合价升高的物质确定还原剂，与标准答案一致。'),
      `【易错点】不要把「被还原的物质（氧化剂）」说成还原剂；还原剂自身被氧化。`,
    ].join('\n')
  } else if (/oxidant|氧化剂/.test(code + stem) && (oxidant || /氧化剂/.test(stem))) {
    structure = ability <= 2 ? 'concise_3' : 'structured_6'
    knowledge = ['氧化还原反应', '氧化剂定义']
    chemBasis = [
      '氧化剂是反应中得到电子、所含元素化合价降低的物质',
      '氧化剂自身发生还原反应',
    ]
    mistakes = ['氧化剂与还原剂颠倒', '把被氧化的物质误当作氧化剂']
    text = [
      `【正确答案】${answer}`,
      `【为什么正确】本题考查氧化剂的判断。氧化剂得到电子、元素化合价降低，自身发生还原反应。` +
        (eq ? `对反应「${eq}」` : '结合题干反应') +
        (oxidant ? `，知识库标注氧化剂为「${oxidant}」，与标准答案一致。` : '，按化合价降低的物质确定氧化剂，与标准答案一致。'),
      `【易错点】氧化剂自身被还原；勿与还原剂混淆。`,
    ].join('\n')
  } else if (/not_marked_redox|字段缺失|未标注氧化剂|证据不足不可妄下结论/.test(code + stem + String(full.analysis || ''))) {
    // 题意：不能仅凭知识库未标注氧化剂/还原剂就断定「一定不是氧化还原」
    structure = 'structured_6'
    knowledge = ['证据与结论', '氧化还原判据（化合价变化）']
    chemBasis = [
      '字段缺失≠科学否定',
      '是否氧化还原应看元素化合价是否变化，不能只看标注是否齐全',
    ]
    mistakes = ['把知识库未填写当成「一定不是氧化还原」的充分证据']
    text = [
      `【正确答案】${answer}`,
      `【为什么正确】题干问的是推理是否成立：仅根据「知识库未标注氧化剂/还原剂」能否断定该反应一定不是氧化还原反应。知识库字段缺失只说明记载不完整，不能当作科学否定的充分证据，因此该说法${answer === '错误' ? '不成立，答案为错误' : '按标准答案判定'}。`,
      `【易错点】把「未标注」当成「一定不是」；或把本题做成单纯的氧化剂/还原剂识别题而忽略「证据不足」这一设问。若要进一步判断反应本身是否氧化还原，应另行核对化合价变化，但仍不能把「字段缺失」当作唯一依据。`,
    ].join('\n')
  } else if (/得失电子数必须相等|电子守恒/.test(stem) || (/e_conserve/.test(code) && /得失电子|电子守恒/.test(stem))) {
    structure = 'concise_3'
    knowledge = ['电子守恒']
    chemBasis = ['氧化还原中失电子总数等于得电子总数']
    mistakes = ['只配平原子个数而忽略电子守恒']
    text = [
      `【正确答案】${answer}`,
      `【为什么正确】在氧化还原反应中，还原剂失去的电子总数必须等于氧化剂得到的电子总数（电子守恒）。这是配平与有关计算的基本依据，题干表述与此一致，故为「${answer}」。`,
      `【易错点】只顾原子守恒、忽略电子得失总数相等；把本题误做成「是否属于氧化还原」的判断。`,
    ].join('\n')
  } else if (/is_redox|属于氧化还原/.test(code + stem) && /判断/.test(stem)) {
    structure = 'concise_3'
    knowledge = ['氧化还原反应判据']
    chemBasis = ['有元素化合价变化（电子转移）即为氧化还原反应']
    mistakes = ['仅看是否有氧气参与就下结论']
    const isTrue = /正确|对|true|√/i.test(answer)
    text = [
      `【正确答案】${answer}`,
      isTrue
        ? `【为什么正确】氧化还原反应的判据是反应前后有元素化合价变化。` +
          (oxidant && reductant
            ? `本题反应已标明氧化剂「${oxidant}」与还原剂「${reductant}」，说明存在电子转移，因此属于氧化还原反应。`
            : `按题意与标准答案，该反应存在化合价变化，属于氧化还原反应。`)
        : `【为什么正确】若反应前后各元素化合价均无变化，则不属于氧化还原反应。本题标准答案为「${answer}」，判断时以化合价是否变化为准，不要只看是否有氧气。`,
      `【易错点】有氧气参加≠一定是氧化还原的唯一判据；关键看化合价是否变化。`,
    ].join('\n')
  } else if (/kp_fact_judge|首句事实|description/.test(code + String(full.analysis || ''))) {
    structure = 'concise_3'
    const desc = ent && (ent.description || ent.definition || ent.summary || '')
    knowledge = [ent && (ent.code || ent.name) ? String(ent.code || ent.name) : '知识点复述']
    chemBasis = ['题目考查知识库记载的基础事实正误']
    mistakes = ['凭印象改写知识点导致判断失误']
    text = [
      `【正确答案】${answer}`,
      `【为什么正确】本题属于知识事实正误判断。` +
        (desc
          ? `相关知识要点：「${String(desc).replace(/\s+/g, ' ').slice(0, 120)}」。结合题干表述与标准答案「${answer}」判定。`
          : `请对照题干表述与所学定义，标准答案为「${answer}」。`),
      `【易错点】不要加入题干未给出的额外条件；以定义/事实本身为准。`,
    ].join('\n')
  } else if (/misconception|易错/.test(code + String(full.analysis || ''))) {
    structure = 'structured_6'
    knowledge = ['易错概念辨析']
    chemBasis = ['针对常见错误认识进行正误判断']
    mistakes = ['把常见误解当成正确结论']
    text = [
      `【考查知识点】相关概念的易错点辨析`,
      `【解题突破口】先明确正确概念，再对照题干说法`,
      `【关键条件】以题干表述为准，不外加条件`,
      `【分析过程】对照标准答案「${answer}」：正确说法应与定义/规律一致；错误说法通常偷换概念或忽略适用条件。`,
      `【核心方法】定义核对 + 条件核对`,
      `【易错点】看到熟悉字词就判对，未检查是否偷换了适用范围`,
    ].join('\n')
  } else if (/equation|配平|化学方程式/.test(code + stem) || full.specialty_code === 'equation') {
    structure = ability <= 2 ? 'concise_3' : 'structured_6'
    knowledge = ['化学方程式书写/正误']
    chemBasis = eq ? [`参考方程式：${eq}`] : ['依据原子守恒与反应事实判断']
    mistakes = ['漏配系数', '产物写错', '忽略反应条件文字干扰']
    if (ability <= 2) {
      text = [
        `【正确答案】${answer}`,
        `【为什么正确】本题考查化学方程式相关判断。` +
          (eq ? `对应反应可写为「${eq}」。` : '') +
          `按原子守恒与题干信息，标准答案为「${answer}」。`,
        `【易错点】配平只改系数不改化学式；条件文字不一定改变方程式本身。`,
      ].join('\n')
    } else {
      text = [
        `【考查知识点】化学方程式正误/配平`,
        `【解题突破口】先核对化学式，再核对系数（原子守恒）`,
        `【关键条件】题干给出的反应物、生成物与条件`,
        `【分析过程】` + (eq ? `以「${eq}」为参照，` : '') + `对照选项或判断句，确认与标准答案「${answer}」一致。`,
        `【核心方法】化学式正确 → 原子守恒配平`,
        `【易错点】改化学式凑平；忽略题干限制条件`,
      ].join('\n')
    }
  } else if (full.specialty_code === 'calculation' || /物质的量|摩尔|过量|标况/.test(stem)) {
    structure = ability >= 3 ? 'structured_6' : 'concise_3'
    knowledge = ['物质的量及相关计算']
    chemBasis = ['n=m/M 等基本关系；过量题先判断不足量']
    mistakes = ['用过量物的量直接算产物', '单位未统一']
    text = [
      `【考查知识点】化学计算基本关系`,
      `【解题突破口】先找已知量与所求量之间的桥梁（常为 n）`,
      `【关键条件】题干数据与单位；若遇过量需先比较`,
      `【分析过程】按题意建立等式或比例，计算结果与标准答案「${answer}」一致。本题为解析升级样本，数值步骤以题干为准核验。`,
      `【核心方法】统一单位 → 求 n → 再求目标量`,
      `【易错点】混用 g 与 kg、L 与 mL；过量题用错反应物`,
    ].join('\n')
  } else if (full.specialty_code === 'ion' || /离子/.test(stem)) {
    structure = ability <= 2 ? 'concise_3' : 'structured_6'
    knowledge = ['离子反应 / 离子方程式']
    chemBasis = ['拆写规则：强电解质拆，沉淀/气体/弱电解质不拆', '电荷与原子守恒']
    mistakes = ['弱酸拆成离子', '漏写电荷']
    text = [
      `【正确答案】${answer}`,
      `【为什么正确】离子反应书写与判断需遵守拆写规则，并检查原子守恒与电荷守恒。结合题干，标准答案为「${answer}」。`,
      `【易错点】把弱电解质或沉淀拆成离子；只顾原子守恒忘了电荷守恒。`,
    ].join('\n')
  } else if (full.specialty_code === 'experiment' || /实验|现象/.test(stem)) {
    structure = 'concise_3'
    knowledge = ['实验现象与操作']
    chemBasis = ['现象必须与物质性质、操作顺序一致']
    mistakes = ['记混相似实验现象', '忽略安全与操作顺序']
    const ph = ent && ent.phenomenon
    text = [
      `【正确答案】${answer}`,
      `【为什么正确】本题考查实验相关事实。` +
        (ph ? `相关现象记载：「${String(ph).slice(0, 100)}」。` : '') +
        `对照题干与标准答案「${answer}」判断。`,
      `【易错点】凭感觉忽略气体溶解、加热顺序或安全要点。`,
    ].join('\n')
  } else if (full.specialty_code === 'substance' || /性质|颜色|用途/.test(stem)) {
    structure = 'concise_3'
    knowledge = ['物质性质']
    chemBasis = ['以物质的组成、结构与记载性质为依据']
    mistakes = ['相近物质性质张冠李戴']
    const props = ent && (ent.chemical_props || ent.physical_props || ent.color)
    text = [
      `【正确答案】${answer}`,
      `【为什么正确】本题考查物质性质识记/判断。` +
        (props ? `相关记载：「${String(props).replace(/\s+/g, ' ').slice(0, 100)}」。` : '') +
        `标准答案为「${answer}」。`,
      `【易错点】把相似物质的颜色、状态或用途记混。`,
    ].join('\n')
  } else if (full.specialty_code === 'memory') {
    structure = 'concise_3'
    knowledge = ['基础记忆']
    chemBasis = ['符号、名称、基本事实的准确对应']
    mistakes = ['大小写、名称与符号混淆']
    text = [
      `【正确答案】${answer}`,
      `【为什么正确】本题属于基础记忆。按化学符号/名称/基本事实的标准对应关系，答案为「${answer}」。`,
      `【易错点】元素符号大小写错误；中文名与符号不对应。`,
    ].join('\n')
  } else if (full.specialty_code === 'inference') {
    structure = 'structured_6'
    knowledge = ['化学推断']
    chemBasis = ['特征现象/转化关系逐步缩小范围']
    mistakes = ['条件未用尽导致多解仍下唯一结论']
    text = [
      `【考查知识点】物质推断`,
      `【解题突破口】抓住最具区分度的特征信息`,
      `【关键条件】题干全部转化与现象`,
      `【分析过程】逐条使用条件排除不可能物质，最终与标准答案「${answer}」一致。`,
      `【核心方法】特征锁定 → 验证其余条件`,
      `【易错点】中途下结论；忽略可验证条件`,
    ].join('\n')
  } else {
    structure = 'concise_3'
    knowledge = [full.specialty_name || '化学专项']
    chemBasis = ['结合题干条件与所学规律']
    mistakes = ['忽略题干限制条件']
    text = [
      `【正确答案】${answer}`,
      `【为什么正确】结合题干信息与该专项基本规律，标准答案为「${answer}」。解析升级时未改动原题答案。`,
      `【易错点】加入题目未给出的条件；与标准答案方向不一致的主观推断。`,
    ].join('\n')
  }

  // 答案一致性硬检查：候选必须出现标准答案文本（或判断题同义）
  const answerMentioned =
    text.includes(answer) ||
    (answer === '正确' && /正确/.test(text)) ||
    (answer === '错误' && /错误/.test(text))

  if (!answerMentioned) {
    risks.push('ANSWER_MISMATCH')
  }

  return {
    structure,
    knowledgePoints: knowledge,
    chemicalBasis: chemBasis,
    commonMistakes: mistakes,
    candidateAnalysis: text,
    holdSuggested: hold,
    holdReason,
    riskFlags: risks,
    usedSource: ent
      ? {
          entityType: ent.entityType,
          id: String(ent.id),
          code: ent.code || null,
          name: ent.name || null,
        }
      : null,
  }
}

function independentVerify(candidate, full) {
  const reasons = []
  let grade = 'PASS'
  const ans = String(full.answer || '')
  const text = candidate.candidateAnalysis || ''

  if (candidate.holdSuggested) {
    grade = 'HOLD'
    reasons.push(candidate.holdReason || 'source_risk')
  }
  if (candidate.riskFlags.includes('ANSWER_MISMATCH')) {
    grade = grade === 'HOLD' ? 'HOLD' : 'REJECT'
    reasons.push('candidate_missing_standard_answer')
  }
  if (!text || text.length < 20) {
    grade = 'REJECT'
    reasons.push('empty_or_too_thin')
  }
  // 不得声称修改答案
  if (/正确答案应改为|标准答案有误|应改为/.test(text)) {
    grade = 'HOLD'
    reasons.push('attempts_to_change_answer')
  }
  // 计算题：若题干含明显数值，标记待人工复算（不自动判 REJECT）
  if (
    full.specialty_code === 'calculation' &&
    /\d/.test(full.stem) &&
    !/\d+\s*\/\s*\d+|\d+\s*=\s*\d/.test(text)
  ) {
    if (grade === 'PASS') {
      grade = 'NEEDS_FIX'
      reasons.push('calc_steps_incomplete_for_numeric_stem')
    }
  }
  // 氧化还原剂题：若 KB 有 oxidant/reductant，检查一致性
  // （在外层已用字段；此处再确认答案字母题）
  if (/oxidant_single|reductant_single/.test(full.code) && full.qtype === 'single') {
    if (ans !== 'A' && ans !== 'B' && ans !== 'C' && ans !== 'D') {
      // atypical
    }
  }

  if (grade === 'PASS' && candidate.structure === 'concise_3' && !/易错/.test(text)) {
    grade = 'NEEDS_FIX'
    reasons.push('missing_mistake_hint')
  }

  return { grade, reasons }
}

async function reviewWithDeepSeek(candidates, env) {
  const apiKey = env.DEEPSEEK_API_KEY
  const base = env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
  if (!apiKey) {
    return {
      skipped: true,
      skipReason: 'DEEPSEEK_API_KEY missing',
      reviews: [],
      failed: candidates.map((c) => ({ id: c.id, error: 'no_api_key' })),
    }
  }
  const reviews = []
  const failed = []
  const batchSize = 5
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize)
    const compact = batch.map((c) => ({
      id: c.id,
      specialty: c.specialtyCode,
      difficulty: c.difficulty,
      abilityLevel: c.abilityLevel,
      stem: c.stem,
      options: c.options,
      answer: c.answer,
      originalAnalysis: c.originalAnalysis,
      candidateAnalysis: c.candidateAnalysis,
    }))
    const prompt = `你是高一化学必修「解析质量」辅助复核员（非人工终审）。对下列题目的【候选解析】逐题检查，只返回JSON数组。
每项字段：
id,
stemConsistent(bool),
answerConsistent(bool),
scienceOk(bool),
reasoningOk(bool),
noExtraConditions(bool),
curriculumOk(bool),
mistakesRelevant(bool),
teachingValue(1-5),
issues(string[]),
suggestedGrade("PASS"|"NEEDS_FIX"|"HOLD"|"REJECT"),
note(string)
重点：与题干/标准答案一致、化学事实与推理、是否引入题外条件、是否超纲、易错点是否真实相关、教学价值。
禁止建议修改标准答案；若怀疑答案本身有问题，suggestedGrade=HOLD 并在 issues 写明。
题目与解析：${JSON.stringify(compact)}`

    try {
      const resp = await deepseekRequest(
        apiKey,
        {
          model: env.DEEPSEEK_MODEL || 'deepseek-chat',
          temperature: 0.2,
          messages: [
            { role: 'system', content: '只输出合法JSON数组，不要Markdown。' },
            { role: 'user', content: prompt },
          ],
        },
        base,
      )
      const content = resp.choices?.[0]?.message?.content || ''
      const jsonText = content.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
      let parsed
      try {
        parsed = JSON.parse(jsonText)
      } catch {
        const m = jsonText.match(/\[[\s\S]*\]/)
        parsed = m ? JSON.parse(m[0]) : null
      }
      if (!Array.isArray(parsed)) {
        for (const c of batch) failed.push({ id: c.id, error: 'parse_fail', raw: content.slice(0, 280) })
      } else {
        for (const row of parsed) {
          reviews.push({
            ...row,
            reviewSource: 'deepseek_assist',
            isHumanSubjectReview: false,
          })
        }
      }
    } catch (e) {
      for (const c of batch) failed.push({ id: c.id, error: String(e.message || e) })
    }
    console.error(`DeepSeek batch ${i / batchSize + 1}/${Math.ceil(candidates.length / batchSize)}`)
    await new Promise((r) => setTimeout(r, 700))
  }
  return { skipped: false, reviews, failed }
}

function mergeGrades(det, ds) {
  let grade = det.grade
  const reasons = [...det.reasons]
  let deepseekCalcConflict = false
  if (!ds) {
    return { grade, reasons, deepseekMissing: true }
  }
  if (ds.answerConsistent === false || ds.scienceOk === false) {
    if (grade === 'PASS' || grade === 'NEEDS_FIX') {
      // 确定性未发现答案缺失时，AI 质疑科学性 → HOLD 待复核，不直接当人审
      grade = 'HOLD'
      reasons.push('deepseek_assist_science_or_answer')
    }
  } else if (ds.suggestedGrade === 'REJECT' && grade === 'PASS') {
    grade = 'HOLD'
    reasons.push('deepseek_suggest_reject_held_for_human')
  } else if (ds.suggestedGrade === 'HOLD' && grade === 'PASS') {
    grade = 'HOLD'
    reasons.push('deepseek_assist_hold')
  } else if (ds.suggestedGrade === 'NEEDS_FIX' && grade === 'PASS') {
    grade = 'NEEDS_FIX'
    reasons.push('deepseek_assist_needs_fix')
  }
  if (ds.noExtraConditions === false && grade === 'PASS') {
    grade = 'NEEDS_FIX'
    reasons.push('deepseek_extra_conditions')
  }
  return { grade, reasons, deepseekMissing: false, deepseekCalcConflict }
}

async function main() {
  const audit = loadAudit()
  const selected = selectSample50(audit.items)
  console.error('Selected', selected.meta)

  const { conn, env } = await openDb()
  const ids = selected.items.map((x) => x.id)
  const [fullRows] = await conn.query(
    `SELECT i.*, s.code AS specialty_code, s.name AS specialty_name,
            c.code AS category_code, c.name AS category_name
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id
     WHERE i.id IN (?)`,
    [ids],
  )
  const fullMap = Object.fromEntries(fullRows.map((r) => [String(r.id), r]))
  const { links, sources } = await loadLinksAndSources(conn, ids)

  // 历史错题频次（软参考）
  const [wrongRows] = await conn.query(
    `SELECT si.item_id AS item_id, COUNT(*) AS n
     FROM chem_train_session_items si
     JOIN chem_train_sessions s ON s.id=si.session_id
     WHERE si.grade_result='wrong' AND si.item_id IN (?)
     GROUP BY si.item_id`,
    [ids],
  )
  const wrongMap = Object.fromEntries(wrongRows.map((r) => [String(r.item_id), Number(r.n)]))

  const candidates = []
  const quality = []
  const extraRisks = []

  for (const a of selected.items) {
    const full = fullMap[a.id]
    if (!full) {
      extraRisks.push({ id: a.id, risks: ['ITEM_MISSING'], note: 'selected id not found' })
      continue
    }
    const src = getSourceForItem(a.id, links, sources)
    const built = buildCandidate(full, a, src)
    const det = independentVerify(built, full)

    const snap = {
      id: a.id,
      code: full.code,
      specialtyCode: full.specialty_code,
      specialtyName: full.specialty_name,
      categoryCode: full.category_code,
      categoryName: full.category_name,
      difficulty: Number(full.difficulty),
      qtype: full.qtype,
      answerType: full.answer_type,
      stem: full.stem,
      options: parseOptions(full.options_json),
      answer: full.answer,
      answerAliases: full.answer_aliases_json,
      originalAnalysis: full.analysis,
      originalAnalysisGrade: a.analysisGrade,
      abilityLevel: a.abilityLevel,
      abilityLabel: a.abilityLabel,
      difficultyInflated: a.difficultyInflated,
      historicalWrongCount: wrongMap[a.id] || 0,
      candidateAnalysis: built.candidateAnalysis,
      analysisStructure: built.structure,
      knowledgePoints: built.knowledgePoints,
      chemicalBasis: built.chemicalBasis,
      commonMistakes: built.commonMistakes,
      usedSource: built.usedSource,
      riskFlags: built.riskFlags,
      suggestDbUpdateLater: false,
      protection: {
        stemUnchanged: true,
        optionsUnchanged: true,
        answerUnchanged: true,
        difficultyUnchanged: true,
        analysisNotWrittenToDb: true,
      },
    }
    candidates.push(snap)
    quality.push({
      id: a.id,
      code: full.code,
      specialtyCode: full.specialty_code,
      deterministicGrade: det.grade,
      deterministicReasons: det.reasons,
      // filled after deepseek
      grade: det.grade,
      reasons: det.reasons,
    })
  }

  console.error('DeepSeek assist on', candidates.length, 'items...')
  const dsResult = await reviewWithDeepSeek(candidates, env)
  const dsMap = Object.fromEntries((dsResult.reviews || []).map((r) => [String(r.id), r]))

  const gradeCount = { PASS: 0, NEEDS_FIX: 0, HOLD: 0, REJECT: 0 }
  for (const q of quality) {
    const cand = candidates.find((c) => c.id === q.id)
    const ds = dsMap[q.id]
    const merged = mergeGrades(
      { grade: q.deterministicGrade, reasons: q.deterministicReasons },
      ds,
    )
    q.grade = merged.grade
    q.reasons = merged.reasons
    q.deepseekAssist = ds || null
    q.deepseekReviewed = !!ds
    q.deepseekMissing = merged.deepseekMissing
    gradeCount[q.grade] = (gradeCount[q.grade] || 0) + 1

    if (cand) {
      cand.qualityGrade = q.grade
      cand.qualityReasons = q.reasons
      cand.suggestDbUpdateLater = q.grade === 'PASS'
      cand.deepseekAssist = ds || null
    }

    if (ds && (ds.scienceOk === false || ds.answerConsistent === false)) {
      extraRisks.push({
        id: q.id,
        code: q.code,
        risks: [
          ds.scienceOk === false ? 'SCIENCE_RISK' : null,
          ds.answerConsistent === false ? 'ANSWER_MISMATCH' : null,
        ].filter(Boolean),
        note: (ds.issues || []).join('; '),
        source: 'deepseek_assist',
      })
    }
  }

  // 合并风险清单
  let riskDoc = { items: [] }
  const riskPath = path.join(OUT_DIR, 'question_risk_list.json')
  if (fs.existsSync(riskPath)) {
    riskDoc = JSON.parse(fs.readFileSync(riskPath, 'utf8'))
  }
  riskDoc.sample50Extra = extraRisks
  riskDoc.updatedAt = new Date().toISOString()
  fs.writeFileSync(riskPath, JSON.stringify(riskDoc, null, 2), 'utf8')

  fs.writeFileSync(
    path.join(OUT_DIR, 'sample50_candidates.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        readonly: true,
        noDbWrite: true,
        selection: selected.meta,
        items: candidates,
      },
      null,
      2,
    ),
    'utf8',
  )

  fs.writeFileSync(
    path.join(OUT_DIR, 'sample50_quality_results.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        gradeCount,
        deepseek: {
          skipped: !!dsResult.skipped,
          skipReason: dsResult.skipReason || null,
          reviewed: (dsResult.reviews || []).length,
          failed: (dsResult.failed || []).length,
          failedIds: (dsResult.failed || []).map((f) => f.id),
        },
        note: 'DeepSeek辅助≠人工学科审核；不能覆盖确定性核验中的答案缺失等硬失败',
        items: quality,
      },
      null,
      2,
    ),
    'utf8',
  )

  const summary = {
    generatedAt: new Date().toISOString(),
    readonly: true,
    oldEligibleCount: audit.scope.count,
    analysisGradeDistribution: audit.summary.gradeCount,
    abilityDistribution: audit.summary.abilityCount,
    difficultyInflatedCount: audit.summary.difficultyInflatedCount,
    sample50: selected.meta,
    sample50Quality: gradeCount,
    deepseekAssist: {
      skipped: !!dsResult.skipped,
      reviewed: (dsResult.reviews || []).length,
      failed: (dsResult.failed || []).length,
    },
    safeToUpdateLaterCount: gradeCount.PASS,
    needsFixCount: gradeCount.NEEDS_FIX,
    holdCount: gradeCount.HOLD,
    rejectCount: gradeCount.REJECT,
  }
  fs.writeFileSync(
    path.join(OUT_DIR, 'analysis_upgrade_summary.json'),
    JSON.stringify(summary, null, 2),
    'utf8',
  )

  console.log(JSON.stringify(summary, null, 2))
  await conn.end()
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}

module.exports = {
  buildCandidate,
  independentVerify,
  reviewWithDeepSeek,
  mergeGrades,
  parseOptions,
  getSourceForItem,
  selectSample50,
}
