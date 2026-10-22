'use strict'
/**
 * Build structured advanced/challenge model catalog (no DB writes).
 *   node docs/chemistry_advanced_model/build_models_catalog.js
 */
const fs = require('fs')
const path = require('path')

function m(partial) {
  const id = partial.id
  if (!id || !/^ADV\.[a-z_]+\.\d{3}$/.test(id)) {
    throw new Error(`bad id ${id}`)
  }
  return {
    id,
    name: partial.name,
    specialtyCode: partial.specialtyCode,
    specialtyName: partial.specialtyName,
    categoryCodes: partial.categoryCodes,
    knowledgePoints: partial.knowledgePoints,
    difficulties: partial.difficulties,
    abilities: partial.abilities,
    stemStructure: partial.stemStructure,
    variableConditions: partial.variableConditions,
    reasoningSteps: partial.reasoningSteps,
    breakthrough: partial.breakthrough,
    coreMethods: partial.coreMethods,
    commonErrors: partial.commonErrors,
    grading: partial.grading,
    generation: partial.generation,
    scienceRisk: partial.scienceRisk,
    variantDirections: partial.variantDirections,
    dedupRules: partial.dedupRules,
    productionStatus: partial.productionStatus,
    priorityBatch1: !!partial.priorityBatch1,
    notes: partial.notes || '',
    samples: partial.samples || [],
  }
}

const models = []

// ========== 化学计算 (8) ==========
models.push(
  m({
    id: 'ADV.calculation.001',
    name: '物质的量—已知质量求物质的量与微粒数',
    specialtyCode: 'calculation',
    specialtyName: '化学计算',
    categoryCodes: ['amount'],
    knowledgePoints: ['n=m/M', 'N=n·NA', '摩尔质量'],
    difficulties: ['raise'],
    abilities: ['建立量关系', '单位换算', '两步计算'],
    stemStructure: '给出纯净物质量与摩尔质量（或可查相对分子质量）→求 n 与/或粒子数',
    variableConditions: ['物质种类', '所求量(n/N/m)', '是否给 NA 数值'],
    reasoningSteps: ['确认纯度与公式', '算 n', '若需求 N 再乘 NA'],
    breakthrough: '先统一到物质的量 n，再分支求其他量',
    coreMethods: ['关系式法', '单位追踪'],
    commonErrors: ['M 用错', '忘记 NA', '克与毫克混用'],
    grading: { modes: ['numeric', 'single'], note: '数值题需 numeric 判题；现阶段可用单选包选项' },
    generation: { primary: 'local_rule', aiAssist: false, needsKb: ['substance.Mr'] },
    scienceRisk: { level: 'low', curriculum: '必修', notes: '纯净物基础量关系' },
    variantDirections: {
      raise: ['改所求目标', '改物质', '给粒子数反求质量'],
      challenge: [],
    },
    dedupRules: ['同物质+同所求目标+仅改数字 → 低价值重复', '须改所求量或关系链才算新题'],
    productionStatus: 'NEEDS_ENGINE',
    priorityBatch1: true,
    notes: '可用单选包装为 READY 子集；开放数值填空需 numeric',
    samples: [
      {
        difficulty: 'raise',
        qtype: 'single',
        stem:
          '18 g H₂O 中含有的水分子数目约为（NA 表示阿伏加德罗常数的值）',
        options: [
          { key: 'A', text: 'NA' },
          { key: 'B', text: '2NA' },
          { key: 'C', text: '0.5NA' },
          { key: 'D', text: '18NA' },
        ],
        answer: 'A',
        steps: [
          'H₂O 的 M=18 g·mol⁻¹，n=m/M=18/18=1 mol',
          '分子数 N=n·NA=1·NA',
        ],
        coreMethod: '先求物质的量，再求微粒数',
        commonMistakes: ['误用 2NA（把 H 原子数当成分子数）', '用 18NA'],
        knowledgePoints: ['n=m/M', 'N=n·NA'],
      },
    ],
  }),
)

models.push(
  m({
    id: 'ADV.calculation.002',
    name: '化学方程式—已知一反应物质量求产物质量',
    specialtyCode: 'calculation',
    specialtyName: '化学计算',
    categoryCodes: ['equation_calc', 'amount'],
    knowledgePoints: ['化学计量数', '质量守恒相关量关系', 'n 与 m 换算'],
    difficulties: ['raise', 'challenge'],
    abilities: ['写/读计量关系', '比例计算', '步骤衔接'],
    stemStructure: '给出明确反应与一种已知量 → 求另一物质质量或物质的量',
    variableConditions: ['反应选择(KB核实)', '已知物/所求物对调', '给 n 或 m'],
    reasoningSteps: ['确认反应与计量比', '已知量→n', '按系数换算', '再求目标量'],
    breakthrough: '把质量全部换成物质的量再按系数比',
    coreMethods: ['关系式法', '物质的量桥梁'],
    commonErrors: ['系数用错', '未统一单位', '把质量比当物质的量比'],
    grading: { modes: ['numeric', 'single'], note: '开放填空需 numeric' },
    generation: { primary: 'local_rule', aiAssist: false, needsKb: ['reaction.balanced'] },
    scienceRisk: { level: 'medium', curriculum: '必修', notes: '仅用 KB 已核实方程式' },
    variantDirections: {
      raise: ['改已知/所求角色', '改反应'],
      challenge: ['加入“实际产率”或“纯度”一层（仍必修）'],
    },
    dedupRules: ['同反应+同已知所求对+仅改数字 → 重复', '改反应或改求解目标才算新结构'],
    productionStatus: 'NEEDS_ENGINE',
    priorityBatch1: true,
    samples: [
      {
        difficulty: 'raise',
        qtype: 'single',
        stem:
          '反应 2H₂ + O₂ = 2H₂O。完全反应消耗 4 g H₂ 时，生成水的质量为',
        options: [
          { key: 'A', text: '18 g' },
          { key: 'B', text: '36 g' },
          { key: 'C', text: '4 g' },
          { key: 'D', text: '32 g' },
        ],
        answer: 'B',
        steps: [
          'n(H₂)=4/2=2 mol',
          '由计量数 2H₂～2H₂O，n(H₂O)=2 mol',
          'm(H₂O)=2×18=36 g',
        ],
        coreMethod: '物质的量桥梁 + 计量比',
        commonMistakes: ['按质量 1:1 得到 4 g', '只用 18 g 忘记计量'],
        knowledgePoints: ['方程式计算', 'n=m/M'],
      },
      {
        difficulty: 'challenge',
        qtype: 'single',
        stem:
          '反应 2H₂ + O₂ = 2H₂O。某氢气样品纯度 80%（杂质不参加反应），取样品 5 g 与足量氧气完全反应，理论上生成水的质量最接近',
        options: [
          { key: 'A', text: '36 g' },
          { key: 'B', text: '45 g' },
          { key: 'C', text: '18 g' },
          { key: 'D', text: '22.5 g' },
        ],
        answer: 'A',
        steps: [
          '有效 H₂ 质量=5×80%=4 g',
          'n(H₂)=2 mol → n(H₂O)=2 mol → m=36 g',
        ],
        coreMethod: '先处理纯度，再进入计量计算',
        commonMistakes: ['直接用 5 g 计算得 45 g'],
        knowledgePoints: ['纯度', '方程式计算'],
      },
    ],
  }),
)

models.push(
  m({
    id: 'ADV.calculation.003',
    name: '过量与不足—判断限制反应物并求产物',
    specialtyCode: 'calculation',
    specialtyName: '化学计算',
    categoryCodes: ['amount', 'equation_calc'],
    knowledgePoints: ['过量判断', '限制反应物', '计量比'],
    difficulties: ['raise', 'challenge'],
    abilities: ['比较“所需与所有”', '避免用过量物直接算产物'],
    stemStructure: '给出两反应物量与反应 → 判断谁过量 → 求产物或剩余量',
    variableConditions: ['两物过量关系互换', '所求改为剩余量/产物量'],
    reasoningSteps: ['算两物的 n', '按系数比较谁不足', '用不足量求产物', '必要时求剩余'],
    breakthrough: '先判断限制反应物，再计算',
    coreMethods: ['过量判断法', '关系式法'],
    commonErrors: ['两量都拿去算再相加', '用过量物算产物'],
    grading: { modes: ['single', 'numeric'] },
    generation: { primary: 'local_rule', aiAssist: false, needsKb: ['reaction.balanced'] },
    scienceRisk: { level: 'medium', curriculum: '必修', notes: '反应须真实可进行' },
    variantDirections: {
      raise: ['改过量方', '改所求为剩余'],
      challenge: ['连续两问：产物+剩余'],
    },
    dedupRules: ['同反应同所求类型+仅改数字 → 重复', '须改判断结构或所求类型'],
    productionStatus: 'NEEDS_ENGINE',
    priorityBatch1: true,
    samples: [
      {
        difficulty: 'raise',
        qtype: 'single',
        stem:
          '2H₂ + O₂ = 2H₂O。将 4 g H₂ 与 16 g O₂ 混合点燃至完全，生成水的质量为',
        options: [
          { key: 'A', text: '18 g' },
          { key: 'B', text: '36 g' },
          { key: 'C', text: '20 g' },
          { key: 'D', text: '32 g' },
        ],
        answer: 'A',
        steps: [
          'n(H₂)=2 mol，n(O₂)=0.5 mol',
          '按 2H₂～O₂，2 mol H₂ 需 1 mol O₂，O₂ 不足',
          '以 O₂ 计：0.5 mol O₂ → 1 mol H₂O → 18 g',
        ],
        coreMethod: '过量判断后用不足量计算',
        commonMistakes: ['用 H₂ 算得 36 g'],
        knowledgePoints: ['过量判断', '方程式计算'],
      },
      {
        difficulty: 'challenge',
        qtype: 'single',
        stem:
          '同上反应，4 g H₂ 与 16 g O₂ 完全反应后，剩余气体的物质的量为',
        options: [
          { key: 'A', text: '0' },
          { key: 'B', text: '1 mol' },
          { key: 'C', text: '0.5 mol' },
          { key: 'D', text: '2 mol' },
        ],
        answer: 'B',
        steps: [
          'O₂ 不足 0.5 mol，消耗 H₂=1 mol，剩余 H₂=2-1=1 mol',
          '剩余气体为 H₂，1 mol',
        ],
        coreMethod: '过量判断 + 求剩余',
        commonMistakes: ['认为无剩余', '剩余算成氧气'],
        knowledgePoints: ['过量判断', '剩余量'],
      },
    ],
  }),
)

models.push(
  m({
    id: 'ADV.calculation.004',
    name: '溶液—物质的量浓度与配制相关计算',
    specialtyCode: 'calculation',
    specialtyName: '化学计算',
    categoryCodes: ['concentration'],
    knowledgePoints: ['c=n/V', '稀释前后溶质守恒'],
    difficulties: ['raise', 'challenge'],
    abilities: ['浓度定义应用', '稀释守恒'],
    stemStructure: '给 n、V 或稀释数据 → 求 c 或 V',
    variableConditions: ['所求为 c/V/n', '是否稀释'],
    reasoningSteps: ['识别是否稀释', '溶质 n 守恒或 n=cV', '求解'],
    breakthrough: '稀释题抓“溶质物质的量不变”',
    coreMethods: ['定义式', '稀释守恒定律'],
    commonErrors: ['体积单位未统一(L/mL)', '稀释时溶剂体积当溶液体积'],
    grading: { modes: ['single', 'numeric'] },
    generation: { primary: 'local_rule', aiAssist: false, needsKb: [] },
    scienceRisk: { level: 'low', curriculum: '必修', notes: '理想溶液近似' },
    variantDirections: {
      raise: ['改所求', '改稀释倍数'],
      challenge: ['两步：先算浓溶液再稀释'],
    },
    dedupRules: ['同结构仅改数字 → 重复'],
    productionStatus: 'NEEDS_ENGINE',
    priorityBatch1: true,
    samples: [
      {
        difficulty: 'raise',
        qtype: 'single',
        stem: '将 0.2 mol NaCl 溶于水配成 0.5 L 溶液，该溶液物质的量浓度为',
        options: [
          { key: 'A', text: '0.1 mol·L⁻¹' },
          { key: 'B', text: '0.2 mol·L⁻¹' },
          { key: 'C', text: '0.4 mol·L⁻¹' },
          { key: 'D', text: '0.5 mol·L⁻¹' },
        ],
        answer: 'C',
        steps: ['c=n/V=0.2/0.5=0.4 mol·L⁻¹'],
        coreMethod: 'c=n/V',
        commonMistakes: ['写成 0.2/0.5 算反', '用 0.2 mol·L⁻¹'],
        knowledgePoints: ['物质的量浓度'],
      },
      {
        difficulty: 'challenge',
        qtype: 'single',
        stem:
          '将 100 mL 2.0 mol·L⁻¹ 的 NaCl 溶液加水稀释至 500 mL，稀释后浓度为',
        options: [
          { key: 'A', text: '0.2 mol·L⁻¹' },
          { key: 'B', text: '0.4 mol·L⁻¹' },
          { key: 'C', text: '1.0 mol·L⁻¹' },
          { key: 'D', text: '2.0 mol·L⁻¹' },
        ],
        answer: 'B',
        steps: [
          '稀释前后 n 不变：n=0.1 L×2.0=0.2 mol',
          'c=0.2/0.5=0.4 mol·L⁻¹',
        ],
        coreMethod: '稀释时溶质守恒',
        commonMistakes: ['按 2.0×100/500 以外的错误比例'],
        knowledgePoints: ['稀释', '物质的量浓度'],
      },
    ],
  }),
)

models.push(
  m({
    id: 'ADV.calculation.005',
    name: '气体摩尔体积—标准状况简单计算',
    specialtyCode: 'calculation',
    specialtyName: '化学计算',
    categoryCodes: ['molar_volume'],
    knowledgePoints: ['Vm≈22.4 L·mol⁻¹(标准状况)', 'V=n·Vm'],
    difficulties: ['raise'],
    abilities: ['判断是否可用 Vm', '气体体积与 n 换算'],
    stemStructure: '明确标准状况 → 给 V 或 n 求另一量',
    variableConditions: ['所求 V/n/m', '气体种类'],
    reasoningSteps: ['确认标准状况', 'n=V/Vm 或 V=nVm', '必要时联系 m'],
    breakthrough: '先确认适用条件，再用 Vm',
    coreMethods: ['气体摩尔体积关系'],
    commonErrors: ['非标况仍用 22.4', '把固体液体用 Vm'],
    grading: { modes: ['single', 'judge'] },
    generation: { primary: 'local_rule', aiAssist: false, needsKb: [] },
    scienceRisk: { level: 'low', curriculum: '必修', notes: '必须写明标准状况' },
    variantDirections: {
      raise: ['改所求', '结合质量'],
      challenge: [],
    },
    dedupRules: ['同所求类型仅改气体与数字 → 低价值'],
    productionStatus: 'READY',
    priorityBatch1: true,
    samples: [
      {
        difficulty: 'raise',
        qtype: 'single',
        stem: '标准状况下，11.2 L O₂ 的物质的量为',
        options: [
          { key: 'A', text: '0.25 mol' },
          { key: 'B', text: '0.5 mol' },
          { key: 'C', text: '1 mol' },
          { key: 'D', text: '2 mol' },
        ],
        answer: 'B',
        steps: ['n=V/Vm=11.2/22.4=0.5 mol'],
        coreMethod: '标准状况下 V=n·Vm',
        commonMistakes: ['用 22.4/11.2 得到 2'],
        knowledgePoints: ['气体摩尔体积'],
      },
    ],
  }),
)

models.push(
  m({
    id: 'ADV.calculation.006',
    name: '守恒法—质量守恒快速求未知量',
    specialtyCode: 'calculation',
    specialtyName: '化学计算',
    categoryCodes: ['amount', 'equation_calc'],
    knowledgePoints: ['质量守恒', '元素守恒(入门)'],
    difficulties: ['raise', 'challenge'],
    abilities: ['选择守恒对象', '减少方程个数'],
    stemStructure: '给出反应前后部分质量数据 → 用守恒求未知',
    variableConditions: ['守恒对象(总质量/某元素)', '已知缺失位置'],
    reasoningSteps: ['选守恒量', '列等式', '求解'],
    breakthrough: '先想“什么量前后不变”',
    coreMethods: ['质量守恒', '元素守恒'],
    commonErrors: ['把体积当质量守恒', '忽略沉淀/气体带出的量'],
    grading: { modes: ['single', 'numeric'] },
    generation: { primary: 'local_rule', aiAssist: 'optional', needsKb: ['reaction'] },
    scienceRisk: { level: 'medium', curriculum: '必修', notes: '情境须封闭体系表述清楚' },
    variantDirections: {
      raise: ['改未知位置'],
      challenge: ['气体逸出 + 残留固体质量'],
    },
    dedupRules: ['同守恒对象同数据模式仅改数字 → 重复'],
    productionStatus: 'NEEDS_ENGINE',
    priorityBatch1: true,
    samples: [
      {
        difficulty: 'raise',
        qtype: 'single',
        stem:
          '在密盖容器中，一定量碳酸钙与足量稀盐酸完全反应。反应前容器与试剂总质量为 120.0 g，反应后（气体已逸出）总质量为 98.0 g。生成二氧化碳的质量为',
        options: [
          { key: 'A', text: '12.0 g' },
          { key: 'B', text: '22.0 g' },
          { key: 'C', text: '22.4 g' },
          { key: 'D', text: '44.0 g' },
        ],
        answer: 'B',
        steps: ['逸出气体质量=反应前总质量−反应后总质量=120.0−98.0=22.0 g'],
        coreMethod: '质量守恒（体系质量差=逸出气体）',
        commonMistakes: ['直接答 22.4 g（摩尔体积干扰）'],
        knowledgePoints: ['质量守恒', '碳酸盐与酸反应'],
      },
      {
        difficulty: 'challenge',
        qtype: 'single',
        stem:
          '同上情境，若生成的 CO₂ 在标准状况下体积约为 11.2 L，则其物质的量与上述质量 22.0 g 是否一致？最合理的判断是',
        options: [
          { key: 'A', text: '一致，因为 22.0 g CO₂ 约为 0.5 mol，标况约 11.2 L' },
          { key: 'B', text: '不一致，质量守恒与气体体积无关' },
          { key: 'C', text: '一致，因为任何气体 11.2 L 都是 22 g' },
          { key: 'D', text: '无法判断' },
        ],
        answer: 'A',
        steps: [
          'M(CO₂)=44 g·mol⁻¹，22.0 g ≈ 0.5 mol',
          '标况 V≈0.5×22.4=11.2 L，与质量守恒结果一致',
        ],
        coreMethod: '守恒结果与 Vm 交叉检验',
        commonMistakes: ['认为任意气体同体积同质量'],
        knowledgePoints: ['质量守恒', '气体摩尔体积'],
      },
    ],
  }),
)

models.push(
  m({
    id: 'ADV.calculation.007',
    name: '混合物—两成分体系的简单组成计算',
    specialtyCode: 'calculation',
    specialtyName: '化学计算',
    categoryCodes: ['amount'],
    knowledgePoints: ['混合物平均组成', '设未知量列方程'],
    difficulties: ['challenge'],
    abilities: ['设未知', '列方程', '检验合理性'],
    stemStructure: '给混合物总质量与某一可测总量(如生成气体) → 求质量分数',
    variableConditions: ['混合物组分对', '观测量类型'],
    reasoningSteps: ['设一组分质量', '写反应计量', '列方程', '求分数'],
    breakthrough: '把“可测总量”写成两组分贡献之和',
    coreMethods: ['设未知量', '方程组/比例'],
    commonErrors: ['把混合物当纯净物', '方程漏一项'],
    grading: { modes: ['single', 'numeric'] },
    generation: { primary: 'ai_assist', aiAssist: true, needsKb: ['reaction'] },
    scienceRisk: { level: 'high', curriculum: '必修边缘', notes: '组分反应必须互不干扰且答案唯一' },
    variantDirections: {
      raise: [],
      challenge: ['改观测量', '改组分'],
    },
    dedupRules: ['同组分同观测量结构仅改数字 → 重复'],
    productionStatus: 'HOLD',
    priorityBatch1: false,
    notes: '答案唯一性与干扰反应难自动保证，暂缓批量生产',
    samples: [
      {
        difficulty: 'challenge',
        qtype: 'single',
        stem:
          '（示意样例，生产前须人工复核）Na₂CO₃ 与 NaCl 混合物 10.6 g，与足量稀盐酸充分反应，生成 CO₂ 2.2 g。原混合物中 Na₂CO₃ 的质量分数最接近',
        options: [
          { key: 'A', text: '25%' },
          { key: 'B', text: '50%' },
          { key: 'C', text: '75%' },
          { key: 'D', text: '100%' },
        ],
        answer: 'B',
        steps: [
          '仅 Na₂CO₃ 产生 CO₂：n(CO₂)=2.2/44=0.05 mol',
          'n(Na₂CO₃)=0.05 mol，m=0.05×106=5.3 g',
          '质量分数=5.3/10.6=50%',
        ],
        coreMethod: '用产物反推有效成分',
        commonMistakes: ['把总质量都当碳酸钠'],
        knowledgePoints: ['混合物计算', '方程式计量'],
      },
    ],
  }),
)

models.push(
  m({
    id: 'ADV.calculation.008',
    name: '实验数据表—读取数据完成计算',
    specialtyCode: 'calculation',
    specialtyName: '化学计算',
    categoryCodes: ['amount', 'concentration'],
    knowledgePoints: ['数据读取', '误差意识(入门)', '量关系'],
    difficulties: ['raise', 'challenge'],
    abilities: ['读表', '选有效数据', '计算'],
    stemStructure: '给出简单称量/体积数据表 → 计算 n 或 c',
    variableConditions: ['表内字段', '所求量'],
    reasoningSteps: ['读出有效数字对应物理量', '代入公式', '得结果'],
    breakthrough: '先对应“表头含义”，再计算',
    coreMethods: ['实验数据计算'],
    commonErrors: ['用错行/列', '未扣空瓶质量'],
    grading: { modes: ['single'] },
    generation: { primary: 'local_rule', aiAssist: 'optional', needsKb: [] },
    scienceRisk: { level: 'low', curriculum: '必修', notes: '书面数据，非真实实验操作' },
    variantDirections: {
      raise: ['改表结构'],
      challenge: ['设置冗余数据需筛选'],
    },
    dedupRules: ['同表结构同所求仅改数 → 重复'],
    productionStatus: 'READY',
    priorityBatch1: true,
    samples: [
      {
        difficulty: 'raise',
        qtype: 'single',
        stem:
          '配制溶液时记录：溶质质量 5.85 g（NaCl），溶液体积 0.250 L。该溶液物质的量浓度约为（M(NaCl)=58.5 g·mol⁻¹）',
        options: [
          { key: 'A', text: '0.100 mol·L⁻¹' },
          { key: 'B', text: '0.200 mol·L⁻¹' },
          { key: 'C', text: '0.400 mol·L⁻¹' },
          { key: 'D', text: '1.00 mol·L⁻¹' },
        ],
        answer: 'C',
        steps: ['n=5.85/58.5=0.100 mol', 'c=0.100/0.250=0.400 mol·L⁻¹'],
        coreMethod: '由称量数据求 n 再求 c',
        commonMistakes: ['忘记除以体积得到 0.100'],
        knowledgePoints: ['物质的量浓度', '实验数据'],
      },
      {
        difficulty: 'challenge',
        qtype: 'single',
        stem:
          '记录：空烧杯 50.00 g；烧杯+粗盐 55.85 g；溶解并转移到容量瓶后定容至 0.250 L。若粗盐中 NaCl 质量分数为 100%（理想），浓度约为',
        options: [
          { key: 'A', text: '0.100 mol·L⁻¹' },
          { key: 'B', text: '0.400 mol·L⁻¹' },
          { key: 'C', text: '0.234 mol·L⁻¹' },
          { key: 'D', text: '无法计算' },
        ],
        answer: 'B',
        steps: [
          '溶质质量=55.85−50.00=5.85 g',
          '同上一题得 0.400 mol·L⁻¹',
        ],
        coreMethod: '先从数据差求溶质质量',
        commonMistakes: ['直接用 55.85 g 当溶质'],
        knowledgePoints: ['数据差减', '物质的量浓度'],
      },
    ],
  }),
)

fs.writeFileSync(
  path.join(__dirname, '_partial_calc.json'),
  JSON.stringify(models, null, 2),
)
console.log('calc models', models.length)
