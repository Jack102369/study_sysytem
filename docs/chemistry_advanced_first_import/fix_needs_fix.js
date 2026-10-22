const fs = require('fs')
const path = require('path')

const samplesPath = path.join(
  __dirname,
  '..',
  'chemistry_advanced_samples',
  'samples60.json',
)
const samples = JSON.parse(fs.readFileSync(samplesPath, 'utf8'))

function replaceById(id, patch) {
  const i = samples.findIndex((x) => x.id === id)
  if (i < 0) throw new Error('missing ' + id)
  const next = { ...samples[i], ...patch, id }
  delete next.provisionalGrade
  delete next.holdReason
  delete next.note
  next.trainingReadyCandidate = true
  next.gradingFeasible = true
  next.fixedAt = new Date().toISOString()
  samples[i] = next
}

replaceById('S60.ion.07', {
  fixNote: 'enrich_solution_optionAudit',
  difficulty: 'raise',
  breakthrough:
    '逐项用「原子守恒 + 电荷守恒 + 反应是否真实发生 + 是否删净旁观离子」四条标准审查',
  conditionAnalysis: [
    'A 写的是稀硫酸与 Ba(OH)₂ 恰好完全，正确净离子式应为 Ba²⁺+2OH⁻+2H⁺+SO₄²⁻=BaSO₄↓+2H₂O',
    'B 中 Cl⁻ 两边相同，属于旁观离子，净离子式应删去',
    'D 铜在金属活动性顺序中位于氢后，不能与稀盐酸置换出 H₂',
  ],
  steps: [
    '审查 A：OH⁻、H⁺、H₂O 系数均为 1，与恰好完全所需的 2OH⁻、2H⁺、2H₂O 不符，原子不守恒，故 A 错误',
    '审查 B：CaCO₃ 难溶保留化学式正确，但 2Cl⁻ 为旁观离子应删除，故 B 错误',
    '审查 D：Cu 不能置换稀盐酸中的 H⁺，反应不发生，故 D 错误',
    '审查 C：Fe + 2H⁺ = Fe²⁺ + H₂↑ 原子守恒、电荷守恒（左+2=右+2），反应真实，故 C 正确',
  ],
  coreMethod:
    '离子方程式正误四步法：守恒（原子/电荷）→ 删旁观 → 难溶/气体写法 → 核对反应事实',
  commonMistakes: [
    '漏看 A 的系数错误，误以为电荷数字相等就正确',
    '把完全离子式（含旁观离子）当成净离子方程式',
    '记错铜与稀酸能否反应而误选 D',
  ],
  similarFeatures: ['四选一离子方程式正误辨析', '系数错误、旁观离子、不反应金属并存'],
  knowledgePoints: ['离子方程式正误', '电荷守恒', '旁观离子', '金属活动性'],
  optionAudit: [
    {
      key: 'A',
      verdict: 'wrong',
      reason: '系数错误：恰好完全时应为 2OH⁻、2H⁺、2H₂O，原子不守恒',
      possibleWrongThinking: '可能只核对电荷数字未核对原子个数与计量系数',
      knowledgePoint: '守恒与系数',
    },
    {
      key: 'B',
      verdict: 'wrong',
      reason: '旁观离子 Cl⁻ 未删除，不是净离子方程式',
      possibleWrongThinking: '可能把完全离子式误当作最终答案',
      knowledgePoint: '删旁观离子',
    },
    {
      key: 'C',
      verdict: 'correct',
      reason: 'Fe+2H⁺=Fe²⁺+H₂↑ 守恒且符合反应事实',
      possibleWrongThinking: null,
      knowledgePoint: '置换反应离子式',
    },
    {
      key: 'D',
      verdict: 'wrong',
      reason: '铜不能与稀盐酸反应生成 H₂',
      possibleWrongThinking: '可能把铜误记为氢前金属',
      knowledgePoint: '金属活动性',
    },
  ],
})

replaceById('S60.ion.09', {
  fixNote: 'upgrade_to_real_challenge_amount_plus_rules',
  difficulty: 'challenge',
  categoryCodes: ['write_ion'],
  stem:
    '向盛有足量大理石（主要成分为 CaCO₃）的烧杯中滴入少量稀盐酸，固体仍明显剩余。下列离子方程式中，同时满足「难溶物不拆开」「删除旁观离子」「符合大理石与盐酸制 CO₂ 的规范写法」要求的是',
  options: [
    { key: 'A', text: 'CaCO₃ + 2H⁺ = Ca²⁺ + CO₂↑ + H₂O' },
    { key: 'B', text: 'CO₃²⁻ + 2H⁺ = CO₂↑ + H₂O' },
    { key: 'C', text: 'CaCO₃ + H⁺ = Ca²⁺ + HCO₃⁻' },
    {
      key: 'D',
      text: 'CaCO₃ + 2H⁺ + 2Cl⁻ = Ca²⁺ + 2Cl⁻ + CO₂↑ + H₂O',
    },
  ],
  answer: 'A',
  breakthrough:
    '先锁定难溶 CaCO₃ 必须写化学式；再排除拆成 CO₃²⁻、误套 HCO₃⁻ 分步模型、以及未删 Cl⁻ 的写法',
  conditionAnalysis: [
    '大理石难溶，不能写成 CO₃²⁻',
    '盐酸中的 Cl⁻ 为旁观离子',
    '中学对固体碳酸钙与盐酸制 CO₂，离子式按 CaCO₃+2H⁺ 产气书写；C 把可溶碳酸盐“酸少量→HCO₃⁻”误套到难溶大理石',
  ],
  steps: [
    'B 将难溶盐拆成 CO₃²⁻，违反难溶物写法，排除',
    'D 含未删除的旁观 Cl⁻，不是净离子方程式，排除',
    'C 套用可溶碳酸盐酸少量生成 HCO₃⁻ 的模型，不符合大理石制 CO₂ 的规范情景，排除',
    'A：难溶写 CaCO₃，酸拆为 H⁺，无旁观离子，原子与电荷守恒，符合题意',
  ],
  coreMethod: '多重约束下的离子方程式选型：物态写法 × 旁观离子 × 反应情景',
  commonMistakes: [
    '把可溶碳酸盐分步反应模型直接套到大理石',
    '把难溶碳酸盐拆成离子',
    '保留 Cl⁻ 写成完全离子式',
  ],
  similarFeatures: ['难溶物 + 酸制气 + 易混分步写法'],
  knowledgePoints: ['离子方程式', '难溶物写法', '旁观离子', '碳酸盐与酸'],
  scienceRisk: 'medium',
  optionAudit: [
    {
      key: 'A',
      verdict: 'correct',
      reason: '难溶不拆、无旁观、守恒，符合大理石与盐酸制 CO₂ 的规范写法',
      possibleWrongThinking: null,
      knowledgePoint: '难溶物离子式',
    },
    {
      key: 'B',
      verdict: 'wrong',
      reason: 'CaCO₃ 难溶不能拆成 CO₃²⁻',
      possibleWrongThinking: '可能误当成可溶性碳酸盐溶液',
      knowledgePoint: '难溶物写法',
    },
    {
      key: 'C',
      verdict: 'wrong',
      reason: '把可溶碳酸盐酸少量生成 HCO₃⁻ 的模型误套到难溶大理石制气',
      possibleWrongThinking: '可能只抓住“少量酸”而忽略物态与制气情景',
      knowledgePoint: '反应情景区分',
    },
    {
      key: 'D',
      verdict: 'wrong',
      reason: '旁观 Cl⁻ 未删',
      possibleWrongThinking: '可能停在完全离子式',
      knowledgePoint: '删旁观',
    },
  ],
})

replaceById('S60.ion.10', {
  fixNote: 'upgrade_dual_condition_charge_and_fact',
  difficulty: 'challenge',
  stem:
    '下列离子方程式中，同时满足「电荷不守恒」且「不符合铁与稀酸反应事实（应生成 Fe²⁺）」的是',
  options: [
    { key: 'A', text: 'Fe + 2H⁺ = Fe²⁺ + H₂↑' },
    { key: 'B', text: 'Fe + 2H⁺ = Fe³⁺ + H₂↑' },
    { key: 'C', text: '2Fe³⁺ + Fe = 3Fe²⁺' },
    { key: 'D', text: 'Zn + 2H⁺ = Zn²⁺ + H₂↑' },
  ],
  answer: 'B',
  breakthrough: '先算各式电荷，再对照铁与稀酸的真实产物价态；要同时命中两个条件',
  conditionAnalysis: [
    '题干是合取条件：既要电荷不守恒，又要违背 Fe→Fe²⁺ 事实',
    'A、D 为正确置换写法；C 电荷守恒且为常见归中反应',
  ],
  steps: [
    'A：左电荷 +2，右 +2，电荷守恒，且产物 Fe²⁺ 符合事实 → 不是本题答案',
    'C：左 2×(+3)=+6，右 3×(+2)=+6，电荷守恒 → 不满足“电荷不守恒”',
    'D：左 +2 右 +2，电荷守恒且反应真实 → 排除',
    'B：左 +2，右 Fe³⁺ 为 +3，电荷不守恒；且稀酸中 Fe 被氧化为 Fe²⁺ 而非 Fe³⁺，两条件同时满足 → 选 B',
  ],
  coreMethod: '合取条件筛选：电荷审计 + 反应事实双重过滤',
  commonMistakes: [
    '只看到产物价态不对却忽略题干还要求电荷不守恒',
    '误以为 C 中 Fe³⁺/Fe²⁺ 电荷不平',
    '把正确的 A 或 D 当成错误项',
  ],
  similarFeatures: ['指出特定错误类型的离子方程式题'],
  knowledgePoints: ['电荷守恒', '铁与酸反应', '离子方程式正误'],
  optionAudit: [
    {
      key: 'A',
      verdict: 'wrong',
      reason: '方程式正确：电荷守恒且产物为 Fe²⁺',
      possibleWrongThinking: '可能未理解题干在找错误项',
      knowledgePoint: '审题',
    },
    {
      key: 'B',
      verdict: 'correct',
      reason: '左+2右+3电荷不守恒，且 Fe³⁺ 不符合稀酸反应事实',
      possibleWrongThinking: null,
      knowledgePoint: '电荷守恒与反应事实',
    },
    {
      key: 'C',
      verdict: 'wrong',
      reason: '电荷守恒，不满足题干第一个条件',
      possibleWrongThinking: '可能对 Fe³⁺/Fe²⁺ 不熟而误判电荷',
      knowledgePoint: '电荷守恒',
    },
    {
      key: 'D',
      verdict: 'wrong',
      reason: '方程式正确',
      possibleWrongThinking: '随意排除',
      knowledgePoint: '审题',
    },
  ],
})

replaceById('S60.comprehensive.08', {
  fixNote: 'upgrade_oxygen_limiting_CO_vs_CO2',
  difficulty: 'challenge',
  stem:
    '将 12 g 碳与 16 g 氧气置于密闭容器中点燃并充分反应（C=12，O₂=32）。已知氧气不足以把碳全部氧化为 CO₂，但按生成 CO 的计量恰好耗尽。下列判断正确的是',
  options: [
    { key: 'A', text: '生成 1 mol CO₂' },
    { key: 'B', text: '生成 1 mol CO' },
    { key: 'C', text: '生成 0.5 mol CO₂，且碳有剩余' },
    { key: 'D', text: '生成 2 mol CO' },
  ],
  answer: 'B',
  breakthrough:
    '先算 n(C)、n(O₂)，再比较生成 CO₂ 与生成 CO 所需氧气，判断限制反应路径',
  conditionAnalysis: [
    'n(C)=12/12=1 mol，n(O₂)=16/32=0.5 mol',
    '若全部生成 CO₂：C+O₂=CO₂ 需 1 mol O₂，现仅 0.5 mol，不足',
    '若全部生成 CO：C+1/2O₂=CO 需 0.5 mol O₂，与现有氧气恰好',
  ],
  steps: [
    '计算物质的量：n(C)=1 mol，n(O₂)=0.5 mol',
    '按生成 CO₂ 检验：需 O₂ 1 mol > 0.5 mol，不能全部生成 CO₂，排除 A',
    '按生成 CO 检验：1 mol C 需 0.5 mol O₂，恰好完全，生成 1 mol CO',
    'C 未按充分反应下的产物路径处理；D 的 2 mol CO 缺少碳来源',
    '故答案为 B',
  ],
  coreMethod: '过量判断 + 不同产物路径的氧气需求比较',
  commonMistakes: [
    '未判断氧气不足仍按 CO₂ 计量',
    '把氧气 0.5 mol 直接当成 CO₂ 物质的量',
    '忽略“按生成 CO 恰好耗尽”的条件',
  ],
  similarFeatures: ['密闭体系碳燃烧产物由氧气量决定'],
  knowledgePoints: ['过量计算', '碳的氧化物', '方程式计量'],
  scienceRisk: 'medium',
  optionAudit: [
    {
      key: 'A',
      verdict: 'wrong',
      reason: '生成 CO₂ 需 1 mol O₂，实际只有 0.5 mol',
      possibleWrongThinking: '可能只算了碳为 1 mol 就当作 CO₂',
      knowledgePoint: '过量判断',
    },
    {
      key: 'B',
      verdict: 'correct',
      reason: '按 C+1/2O₂=CO，1 mol C 与 0.5 mol O₂ 恰好生成 1 mol CO',
      possibleWrongThinking: null,
      knowledgePoint: '限制反应物计量',
    },
    {
      key: 'C',
      verdict: 'wrong',
      reason: '未正确处理充分反应下的产物路径',
      possibleWrongThinking: '可能用 O₂ 直接当 CO₂ 物质的量',
      knowledgePoint: '燃烧产物判断',
    },
    {
      key: 'D',
      verdict: 'wrong',
      reason: '碳只有 1 mol，不可能生成 2 mol CO',
      possibleWrongThinking: '可能把质量数字误当成物质的量再翻倍',
      knowledgePoint: '原子守恒',
    },
  ],
})

fs.writeFileSync(samplesPath, JSON.stringify(samples, null, 2), 'utf8')

const bySpec = {}
for (const it of samples) {
  ;(bySpec[it.specialtyCode] ||= []).push(it)
}
const specDir = path.join(__dirname, '..', 'chemistry_advanced_samples', 'by_specialty')
for (const [sp, arr] of Object.entries(bySpec)) {
  fs.writeFileSync(path.join(specDir, sp + '.json'), JSON.stringify(arr, null, 2), 'utf8')
}

const fixed = samples.filter((x) =>
  ['S60.ion.07', 'S60.ion.09', 'S60.ion.10', 'S60.comprehensive.08'].includes(x.id),
)
console.log(
  JSON.stringify(
    fixed.map((x) => ({ id: x.id, difficulty: x.difficulty, answer: x.answer })),
    null,
    2,
  ),
)
