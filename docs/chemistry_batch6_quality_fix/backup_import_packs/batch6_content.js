/**
 * Batch6 content（有机、能量及综合知识）— 书面题目训练专用。
 * AI/脚本检查 ≠ 人工审核。不含已入库 seeded 题 q.eq.Na_water。
 */
'use strict'

const { PAPER_ONLY, expBase } = require('./_paper')

function sp(role, formula, coefficient, stateSymbol, opts, sortOrder) {
  const o = opts || {}
  return {
    role,
    formula,
    coefficient,
    stateSymbol,
    isGas: !!o.isGas,
    isPrecipitate: !!o.isPrecipitate,
    sortOrder,
  }
}

const SUBSTANCES = {
  'sub.CH4': {
    name: '甲烷',
    canonicalFormula: 'CH4',
    commonNames: '沼气主要成分、天然气主要成分（了解）',
    color: '无色',
    stateLabel: '气',
    solubility: '难溶于水',
    physicalProps:
      '无色无味气体（纯）；密度比空气小；极易燃烧。分子为正四面体结构，碳原子位于中心，四个氢原子位于顶点，键角约109°28′。',
    chemicalProps:
      '最简单烷烃。稳定，一般不与强酸强碱、强氧化剂反应（常温）。可发生取代反应：光照下与Cl2逐步取代，可生成CH3Cl、CH2Cl2、CHCl3、CCl4等多种氯代产物及HCl，不得把某一种氯代物写成唯一产物。可燃烧生成CO2和H2O。',
    commonUses: '燃料；有机化工原料（了解）。',
    testMethods: '可燃性；与氯气光照取代（现象：黄绿色褪去、油状液滴等，题设）；结合来源题设判断。',
    storageMethods: '气瓶或管道输送；远离火源；通风。',
    safetyNotes: '易燃易爆；与空气混合遇火源有爆炸危险；禁止家用制取与点燃实验。',
    tags: ['organic'],
    reviewExtra: '正四面体;取代多种氯代产物勿写唯一',
  },

  'sub.C2H4': {
    name: '乙烯',
    canonicalFormula: 'C2H4',
    commonNames: '乙烯',
    color: '无色',
    stateLabel: '气',
    solubility: '难溶于水',
    physicalProps:
      '无色气体，略带气味；密度与空气接近（题设为准）。结构简式CH2=CH2，含碳碳双键。',
    chemicalProps:
      '不饱和烃代表。易发生加成反应（如与Br2、H2、H2O等）。可使酸性KMnO4溶液褪色（被氧化，产物随条件变化，不指定唯一氧化产物）。可燃烧。可发生加聚反应生成聚乙烯（了解）。',
    commonUses: '石化重要原料；制聚乙烯、乙醇等（了解）。',
    testMethods: '使溴水（或Br2的CCl4溶液）褪色；使酸性KMnO4褪色（与饱和烃对比，题设）。',
    storageMethods: '钢瓶或现制；远离火源。',
    safetyNotes: '易燃；实验室制取涉及浓硫酸加热等危险操作，仅书面分析，禁止家用。',
    tags: ['organic'],
    reviewExtra: '结构简式CH2=CH2;KMnO4褪色不指定唯一氧化产物',
  },

  'sub.C2H6': {
    name: '乙烷',
    canonicalFormula: 'C2H6',
    commonNames: '乙烷',
    color: '无色',
    stateLabel: '气',
    solubility: '难溶于水',
    physicalProps: '无色气体；结构简式CH3CH3（或CH3−CH3），饱和烷烃。',
    chemicalProps:
      '烷烃通性：较稳定；可发生取代（如与Cl2光照，了解）；可燃烧。一般不能使溴水或酸性KMnO4因加成/氧化而明显褪色（与乙烯对比）。可由乙烯加氢得到。',
    commonUses: '燃料与化工原料（了解）。',
    testMethods: '与乙烯对比：通常不能使溴水/酸性KMnO4因不饱和性而褪色（题设条件）。',
    storageMethods: '气瓶；远离火源。',
    safetyNotes: '易燃；禁止家用危险实验。',
    tags: ['organic'],
  },

  'sub.C2H5OH': {
    name: '乙醇',
    canonicalFormula: 'C2H5OH',
    commonNames: '酒精',
    color: '无色',
    stateLabel: '液',
    solubility: '与水任意比互溶',
    physicalProps:
      '无色透明有特殊气味的液体；易挥发；密度小于水。结构简式CH3CH2OH，官能团为羟基（−OH）。',
    chemicalProps:
      '可燃烧：C2H5OH+3O2→2CO2+3H2O。催化氧化（Cu或Ag作催化剂、加热）：2CH3CH2OH+O2→2CH3CHO+2H2O（教材常见写法）。与乙酸在浓硫酸催化加热下发生酯化。羟基氢可与活泼金属反应（了解/题设）。',
    commonUses: '燃料、溶剂、消毒、饮料与化工原料（了解）。',
    testMethods: '燃烧；催化氧化时铜丝由黑变红等现象（题设）；酯化香味（结合条件）。',
    storageMethods: '密封，远离火源；易燃液体规范存放。',
    safetyNotes: '易燃；禁止家用蒸馏或催化氧化危险操作；本系统仅书面训练。',
    tags: ['organic'],
    reviewExtra: '官能团羟基;催化氧化条件须写清Cu/Ag加热',
  },

  'sub.CH3COOH': {
    name: '乙酸',
    canonicalFormula: 'CH3COOH',
    commonNames: '醋酸、古称醋酸',
    color: '无色',
    stateLabel: '液',
    solubility: '与水互溶',
    physicalProps:
      '无色有刺激性酸味的液体；纯乙酸低温可凝成冰状（冰醋酸，了解）。官能团为羧基（−COOH）。',
    chemicalProps:
      '弱酸，具酸的通性：使紫色石蕊变红；与活泼金属、碱、碱性氧化物、某些盐反应。酸性强于碳酸：可与Na2CO3反应放出CO2。与乙醇酯化生成乙酸乙酯。',
    commonUses: '食醋主要成分（稀）；有机合成与溶剂（了解）。',
    testMethods: '酸性（石蕊）；与Na2CO3产生使澄清石灰水变浑浊的气体；酯化实验现象（题设）。',
    storageMethods: '密封；腐蚀性试剂规范存放。',
    safetyNotes: '浓乙酸有腐蚀性与刺激性；禁止家用危险实验。',
    tags: ['organic'],
    reviewExtra: '弱酸;羧基;酸性强于碳酸',
  },

  'sub.CH3COOCH2CH3': {
    name: '乙酸乙酯',
    canonicalFormula: 'CH3COOCH2CH3',
    commonNames: '醋酸乙酯；亦可写作CH3COOC2H5',
    color: '无色',
    stateLabel: '液',
    solubility: '难溶于水，密度比水小（了解/题设）',
    physicalProps:
      '无色液体，有特殊香味。结构简式CH3COOCH2CH3或CH3COOC2H5，属酯类。',
    chemicalProps:
      '由乙酸与乙醇在浓硫酸催化、加热下酯化生成（可逆）。在水中溶解度小，常浮于上层；可用于认识酯的物理性质与酯化实验现象。水解等深度按教材题设，勿默认展开复杂机理。',
    commonUses: '溶剂、香料等（了解）。',
    testMethods: '酯化产物有香味；难溶于水、油状液体浮于水面（题设装置）。',
    storageMethods: '密封，远离火源。',
    safetyNotes: '易燃有机液体；酯化实验仅书面分析，禁止家用。',
    tags: ['organic'],
    reviewExtra: '可写CH3COOCH2CH3或CH3COOC2H5',
  },

  'sub.C2H2': {
    name: '乙炔',
    canonicalFormula: 'C2H2',
    commonNames: '电石气（粗乙炔，了解）',
    color: '无色',
    stateLabel: '气',
    solubility: '微溶于水（了解）',
    physicalProps: '无色气体；结构简式HC≡CH，含碳碳三键。',
    chemicalProps:
      '不饱和烃。可发生加成、燃烧等（深度以所用必修教材为准）。可使溴水、酸性KMnO4褪色（与不饱和性相关，题设）。实验室由电石与水制取等属了解/题设。',
    commonUses: '焊接气焰、有机合成原料（了解）。',
    testMethods: '不饱和性褪色实验（题设）；燃烧火焰等（了解）。',
    storageMethods: '钢瓶或现制；远离火源。',
    safetyNotes: '易燃易爆；电石反应放热，禁止家用制取。',
    tags: ['organic'],
    reviewExtra:
      'curriculumScope:必修了解/待核实深度;结构HC≡CH;勿默认深度选修炔烃训练',
  },

  'sub.C3H8': {
    name: '丙烷',
    canonicalFormula: 'C3H8',
    commonNames: '丙烷',
    color: '无色',
    stateLabel: '气',
    solubility: '难溶于水',
    physicalProps: '无色气体；烷烃同系物，分子式C3H8。',
    chemicalProps:
      '烷烃通性：可燃烧；可发生取代（了解）。用于认识同系物通式CnH2n+2及同系物比较。',
    commonUses: '液化石油气组分、燃料（了解）。',
    testMethods: '燃烧；与不饱和烃对比（题设）。',
    storageMethods: '液化气瓶；远离火源。',
    safetyNotes: '易燃易爆；禁止家用危险实验。',
    tags: ['organic'],
  },

  'sub.C6H6': {
    name: '苯',
    canonicalFormula: 'C6H6',
    commonNames: '苯',
    color: '无色',
    stateLabel: '液',
    solubility: '难溶于水，易溶于有机溶剂（了解）',
    physicalProps:
      '无色有特殊气味的液体；有毒。分子具平面正六边形碳环结构（教材表述），结构较稳定。',
    chemicalProps:
      '必修层面：认识结构稳定、不易使溴水因加成而褪色、不易被酸性KMnO4氧化褪色等对比结论（以所用教材为准）。芳香取代等深度属选修，不得作为默认高一训练核心。',
    commonUses: '有机溶剂与化工原料（了解）。',
    testMethods: '与烯烃对比：溴水/KMnO4褪色行为不同（题设，勿超纲展开机理）。',
    storageMethods: '密封，远离火源；有毒试剂规范管理。',
    safetyNotes: '有毒、易燃；禁止家用接触与实验。',
    tags: ['organic'],
    reviewExtra:
      'curriculumScope:必修了解结构稳定性;不要默认深度选修芳香取代训练;scope限了解',
  },
}

const REACTIONS = {
  'rxn.CH4_Cl2': {
    name: '甲烷与氯气取代',
    canonicalEquation: 'CH4+Cl2=CH3Cl+HCl',
    equation: 'CH4 + Cl2 =光照= CH3Cl + HCl（第一步示例）',
    ionicEquation: null,
    conditions: '光照（注意：氯气有毒、混合气有爆炸风险，仅书面分析）',
    phenomenon:
      '黄绿色氯气颜色逐渐变浅；可出现油状液滴（多种氯代烃混合物，题设）；生成HCl可用湿润蓝色石蕊试纸变红等检验（题设）。',
    principle:
      '取代反应：甲烷分子中的氢原子被氯原子逐步取代。可生成CH3Cl、CH2Cl2、CHCl3、CCl4等多种氯代产物及HCl，不得将某一种氯代物写成该反应的唯一产物。canonical式仅表示第一步示例。高中通常按有机取代分类，一般不作为氧化还原分析训练重点。',
    oxidant: null,
    reductant: null,
    oxProduct: null,
    reProduct: null,
    electronTransfer: 'N/A（高中有机取代分类；不作默认氧化还原归属）',
    difficulty: 2,
    importance: 5,
    isVerified: false,
    tags: ['organic', 'substitution', 'non-redox'],
    trainTypes: 'equation.write_from_text,equation.balance,organic.substitution',
    reviewExtra:
      'CRITICAL:多种氯代产物CH3Cl/CH2Cl2/CHCl3/CCl4;canonical仅第一步示例;禁写唯一产物',
    species: [
      sp('reactant', 'CH4', 1, 'g', { isGas: true }, 1),
      sp('reactant', 'Cl2', 1, 'g', { isGas: true }, 2),
      sp('product', 'CH3Cl', 1, 'g', { isGas: true }, 3),
      sp('product', 'HCl', 1, 'g', { isGas: true }, 4),
    ],
  },

  'rxn.C2H4_Br2': {
    name: '乙烯与溴加成',
    canonicalEquation: 'CH2=CH2+Br2=CH2BrCH2Br',
    equation: 'CH2=CH2 + Br2 =常温= CH2BrCH2Br',
    ionicEquation: null,
    conditions: '常温（溴水或Br2的CCl4溶液，题设）',
    phenomenon: '溴水（或溴的有机溶液）橙红色/棕红色褪去，生成无色的1,2-二溴乙烷。',
    principle: '加成反应：双键中的π键断裂，两个溴原子分别加到两个碳原子上。常用于检验不饱和键。',
    oxidant: null,
    reductant: null,
    oxProduct: null,
    reProduct: null,
    electronTransfer: null,
    difficulty: 2,
    importance: 5,
    isVerified: false,
    tags: ['organic', 'addition', 'non-redox'],
    trainTypes: 'equation.write_from_text,equation.balance,organic.addition',
    species: [
      sp('reactant', 'C2H4', 1, 'g', { isGas: true }, 1),
      sp('reactant', 'Br2', 1, 'aq', {}, 2),
      sp('product', 'CH2BrCH2Br', 1, 'l', {}, 3),
    ],
  },

  'rxn.C2H4_H2O': {
    name: '乙烯水化制乙醇',
    canonicalEquation: 'CH2=CH2+H2O=CH3CH2OH',
    equation: 'CH2=CH2 + H2O =催化剂、加热加压= CH3CH2OH',
    ionicEquation: null,
    conditions: '催化剂（如磷酸等，以教材为准）、加热、加压',
    phenomenon: '工业条件下乙烯与水加成生成乙醇（实验室少做，以方程式与条件认知为主）。',
    principle: '加成（水化）反应：水分子加到双键上，生成乙醇。',
    oxidant: null,
    reductant: null,
    oxProduct: null,
    reProduct: null,
    electronTransfer: null,
    difficulty: 2,
    importance: 4,
    isVerified: false,
    tags: ['organic', 'addition', 'non-redox'],
    trainTypes: 'equation.write_from_text,equation.balance,equation.condition',
    reviewExtra: '条件:催化剂+加热加压;催化剂写法随教材(如磷酸)',
    species: [
      sp('reactant', 'C2H4', 1, 'g', { isGas: true }, 1),
      sp('reactant', 'H2O', 1, 'g', {}, 2),
      sp('product', 'C2H5OH', 1, 'l', {}, 3),
    ],
  },

  'rxn.C2H4_H2': {
    name: '乙烯加氢',
    canonicalEquation: 'CH2=CH2+H2=CH3CH3',
    equation: 'CH2=CH2 + H2 =催化剂、加热= CH3CH3',
    ionicEquation: null,
    conditions: '催化剂、加热',
    phenomenon: '乙烯与氢气在催化剂加热条件下转化为乙烷（工业/题设认知）。',
    principle: '加成反应：氢原子加到双键碳上，乙烯变为饱和的乙烷。',
    oxidant: null,
    reductant: null,
    oxProduct: null,
    reProduct: null,
    electronTransfer: null,
    difficulty: 2,
    importance: 4,
    isVerified: false,
    tags: ['organic', 'addition', 'non-redox'],
    trainTypes: 'equation.write_from_text,equation.balance,equation.condition',
    species: [
      sp('reactant', 'C2H4', 1, 'g', { isGas: true }, 1),
      sp('reactant', 'H2', 1, 'g', { isGas: true }, 2),
      sp('product', 'C2H6', 1, 'g', { isGas: true }, 3),
    ],
  },

  'rxn.C2H5OH_O2': {
    name: '乙醇催化氧化',
    canonicalEquation: '2CH3CH2OH+O2=2CH3CHO+2H2O',
    equation: '2CH3CH2OH + O2 =Cu或Ag、加热= 2CH3CHO + 2H2O',
    ionicEquation: null,
    conditions: 'Cu或Ag作催化剂并加热（教材常见：灼热铜丝伸入乙醇）',
    phenomenon:
      '铜丝表面黑色CuO变为红色Cu（循环催化常见演示表述）；可闻到刺激性气味（乙醛，题设）。',
    principle:
      '乙醇被氧气氧化为乙醛，水为另一产物；Cu/Ag起催化作用。属氧化还原：氧化剂O2，还原剂乙醇。',
    oxidant: 'O2',
    reductant: 'CH3CH2OH',
    oxProduct: 'H2O',
    reProduct: 'CH3CHO',
    electronTransfer: '乙醇中与羟基相连的碳被氧化；O2被还原为H2O（高中定性）',
    difficulty: 3,
    importance: 5,
    isVerified: false,
    tags: ['organic', 'redox', 'oxidation'],
    trainTypes: 'equation.write_from_text,equation.balance,redox.identify,equation.condition',
    reviewExtra: '条件必须写清Cu或Ag催化剂加热;教材常见写法',
    species: [
      sp('reactant', 'C2H5OH', 2, 'l', {}, 1),
      sp('reactant', 'O2', 1, 'g', { isGas: true }, 2),
      sp('product', 'CH3CHO', 2, 'g', {}, 3),
      sp('product', 'H2O', 2, 'l', {}, 4),
    ],
  },

  'rxn.C2H5OH_burn': {
    name: '乙醇燃烧',
    canonicalEquation: 'C2H5OH+3O2=2CO2+3H2O',
    equation: 'C2H5OH + 3O2 =点燃= 2CO2 + 3H2O',
    ionicEquation: null,
    conditions: '点燃',
    phenomenon: '燃烧，发出淡蓝色火焰（题设）；生成CO2和H2O，放热。',
    principle: '乙醇完全燃烧的氧化还原反应；氧化剂O2，还原剂C2H5OH。',
    oxidant: 'O2',
    reductant: 'C2H5OH',
    oxProduct: 'H2O',
    reProduct: 'CO2',
    electronTransfer: 'C、H被氧化；O被还原（高中定性）',
    difficulty: 1,
    importance: 5,
    isVerified: false,
    tags: ['organic', 'redox', 'combustion'],
    trainTypes: 'equation.write_from_text,equation.balance,redox.identify',
    species: [
      sp('reactant', 'C2H5OH', 1, 'l', {}, 1),
      sp('reactant', 'O2', 3, 'g', { isGas: true }, 2),
      sp('product', 'CO2', 2, 'g', { isGas: true }, 3),
      sp('product', 'H2O', 3, 'g', {}, 4),
    ],
  },

  'rxn.esterification': {
    name: '乙酸乙酯酯化',
    canonicalEquation: 'CH3COOH+C2H5OH⇌CH3COOC2H5+H2O',
    equation: 'CH3COOH + C2H5OH ⇌浓硫酸、加热⇌ CH3COOC2H5 + H2O',
    ionicEquation: null,
    conditions: '浓硫酸作催化剂（兼吸水）、加热；可逆反应',
    phenomenon: '生成有香味的乙酸乙酯；产物难溶于水，常以油状液体浮于饱和碳酸钠溶液上层（题设装置）。',
    principle:
      '酯化：酸脱羟基、醇脱氢（教材规律表述）生成酯和水；浓硫酸催化并促进平衡移动；反应可逆，用⇌表示。',
    oxidant: null,
    reductant: null,
    oxProduct: null,
    reProduct: null,
    electronTransfer: null,
    difficulty: 3,
    importance: 5,
    isVerified: false,
    tags: ['organic', 'esterification', 'non-redox', 'reversible'],
    trainTypes: 'equation.write_from_text,equation.balance,equation.condition,organic.esterification',
    reviewExtra: '可逆;浓硫酸催化加热;species含酸与醇两侧',
    species: [
      sp('reactant', 'CH3COOH', 1, 'l', {}, 1),
      sp('reactant', 'C2H5OH', 1, 'l', {}, 2),
      sp('product', 'CH3COOC2H5', 1, 'l', {}, 3),
      sp('product', 'H2O', 1, 'l', {}, 4),
    ],
  },

  'rxn.CH3COOH_NaOH': {
    name: '乙酸与氢氧化钠',
    canonicalEquation: 'CH3COOH+NaOH=CH3COONa+H2O',
    equation: 'CH3COOH + NaOH = CH3COONa + H2O',
    ionicEquation: 'CH3COOH + OH- = CH3COO- + H2O',
    conditions: '常温水溶液中和',
    phenomenon: '酸性减弱/指示剂颜色变化（题设）；生成乙酸钠和水。',
    principle: '弱酸与强碱的中和反应；非氧化还原。',
    oxidant: null,
    reductant: null,
    oxProduct: null,
    reProduct: null,
    electronTransfer: null,
    difficulty: 1,
    importance: 4,
    isVerified: false,
    tags: ['organic', 'acid-base', 'non-redox'],
    trainTypes: 'equation.write_from_text,equation.balance,ion.ionic_eq',
    species: [
      sp('reactant', 'CH3COOH', 1, 'aq', {}, 1),
      sp('reactant', 'NaOH', 1, 'aq', {}, 2),
      sp('product', 'CH3COONa', 1, 'aq', {}, 3),
      sp('product', 'H2O', 1, 'l', {}, 4),
    ],
  },

  'rxn.CH3COOH_Na2CO3': {
    name: '乙酸与碳酸钠',
    canonicalEquation: '2CH3COOH+Na2CO3=2CH3COONa+CO2+H2O',
    equation: '2CH3COOH + Na2CO3 = 2CH3COONa + CO2↑ + H2O',
    ionicEquation: '2CH3COOH + CO3 2- = 2CH3COO- + CO2↑ + H2O',
    conditions: '常温水溶液',
    phenomenon: '产生使澄清石灰水变浑浊的无色气体（CO2）。',
    principle: '乙酸酸性强于碳酸，可与碳酸盐反应放出CO2；非氧化还原。用于证明乙酸酸性强于碳酸。',
    oxidant: null,
    reductant: null,
    oxProduct: null,
    reProduct: null,
    electronTransfer: null,
    difficulty: 2,
    importance: 5,
    isVerified: false,
    tags: ['organic', 'acid-base', 'non-redox'],
    trainTypes: 'equation.write_from_text,equation.balance,ion.ionic_eq',
    reviewExtra: '酸性强于碳酸;气体CO2↑',
    species: [
      sp('reactant', 'CH3COOH', 2, 'aq', {}, 1),
      sp('reactant', 'Na2CO3', 1, 'aq', {}, 2),
      sp('product', 'CH3COONa', 2, 'aq', {}, 3),
      sp('product', 'CO2', 1, 'g', { isGas: true }, 4),
      sp('product', 'H2O', 1, 'l', {}, 5),
    ],
  },

  'rxn.C2H4_KMnO4': {
    name: '乙烯使酸性高锰酸钾褪色',
    canonicalEquation: 'C2H4 + 酸性KMnO4 → 氧化产物(条件依赖)',
    equation: 'C2H4 + 酸性KMnO4 → 氧化产物（随条件变化，不指定唯一）',
    ionicEquation: null,
    conditions: '酸性KMnO4溶液，常温（题设）',
    phenomenon: '酸性KMnO4紫红色褪去（或变浅）。',
    principle:
      '乙烯具有不饱和性，可被酸性KMnO4氧化，使溶液紫红色褪去。用于鉴别不饱和烃与饱和烃。氧化产物随反应条件变化，不得指定唯一氧化产物，也不要求配平复杂离子方程式为默认训练。',
    oxidant: '酸性KMnO4',
    reductant: 'C2H4',
    oxProduct: '氧化产物(条件依赖，不指定)',
    reProduct: '氧化产物(条件依赖，不指定)',
    electronTransfer: '乙烯被氧化；MnO4-被还原（高中定性，不要求详细电子数默认训练）',
    difficulty: 2,
    importance: 5,
    isVerified: false,
    tags: ['organic', 'redox', 'oxidation'],
    trainTypes: 'phenomenon.judge,organic.unsaturation,redox.identify',
    reviewExtra: '产物随条件变化不指定唯一;canonical描述性≤255;禁唯一氧化产物填空',
    species: [
      sp('reactant', 'C2H4', 1, 'g', { isGas: true }, 1),
      sp('reactant', 'KMnO4', 1, 'aq', {}, 2),
      sp('product', '氧化产物', 1, '', {}, 3),
    ],
  },
}

const EXPERIMENTS = {
  'exp.CH4_property': expBase({
    name: '甲烷性质实验认知',
    category: 'property',
    purpose:
      '书面分析题训练：认识甲烷的可燃性及光照下与氯气取代的主要现象与结论，理解多种氯代产物可能并存。',
    principle:
      '甲烷可燃烧生成CO2和H2O。光照下与Cl2发生取代，可生成CH3Cl、CH2Cl2、CHCl3、CCl4等多种产物，不得写为唯一产物。',
    instruments: '集气瓶、导管、光源（题设）、燃烧匙或导管点燃装置（图示）等',
    reagents: 'CH4、Cl2、空气/O2（燃烧题设）',
    steps:
      '1.对照图示判断气体验纯与点燃要点；2.分析CH4与Cl2混合光照的现象描述；3.判断产物是否可能为混合物；4.安全与尾气评价（书面）。',
    phenomenon: '燃烧；氯气黄绿色变浅、可能出现油状液滴；生成HCl使石蕊变红（题设）。',
    conclusion: '甲烷可燃；光照下可发生取代且产物多样；实验仅作现象与原理书面训练。',
    precautions: '混合气体遇火源危险；Cl2有毒须尾气处理；禁止家用。',
    safetyNotes: PAPER_ONLY + ' 氯气与可燃气体实验高危，禁止动手。',
    isHazardous: false,
    reviewExtra: '书面only;多种氯代产物',
  }),

  'exp.C2H4_prep': expBase({
    name: '乙烯的实验室制法',
    category: 'gas_prep',
    purpose:
      '书面分析题训练：掌握乙醇浓硫酸加热制乙烯的原理、温度控制、装置与杂质干扰评价要点。',
    principle:
      '实验室常用乙醇与浓硫酸混合加热至约170℃制乙烯（消去，教材表述）：CH3CH2OH →浓H2SO4、170℃→ CH2=CH2↑ + H2O。温度不当可能生成乙醚等副产物（了解/题设）。',
    instruments: '圆底烧瓶、温度计、酒精灯、导管、集气瓶或后续性质检验装置等',
    reagents: '乙醇、浓硫酸；碎瓷片（防暴沸，题设）',
    steps:
      '1.检查气密性；2.按比例加入试剂与碎瓷片；3.迅速升温至约170℃；4.收集或通入后续试剂检验；5.评价尾气与废液处理（书面）。',
    phenomenon: '产生气体；后续可使溴水或酸性KMnO4褪色（性质联动题设）。',
    conclusion: '可用乙醇浓硫酸加热制乙烯；温度与防暴沸是常考点。',
    precautions: '温度计水银球位置；防暴沸；浓硫酸腐蚀；控制温度减少副反应。',
    safetyNotes: PAPER_ONLY + ' 浓硫酸加热高危，禁止家用。',
    isHazardous: false,
    reviewExtra: '约170℃;书面装置分析',
  }),

  'exp.C2H4_Br2': expBase({
    name: '乙烯使溴水褪色',
    category: 'property',
    purpose: '书面分析题训练：用溴水（或溴的四氯化碳溶液）检验乙烯不饱和性，区分加成褪色与萃取等干扰。',
    principle: 'CH2=CH2+Br2→CH2BrCH2Br（加成），溶液颜色褪去；属于化学变化导致的褪色。',
    instruments: '导管、试管或洗气瓶、集气装置（题设）',
    reagents: '乙烯、溴水（或Br2/CCl4）',
    steps:
      '1.将乙烯通入溴水；2.观察颜色变化；3.与甲烷/乙烷对照（题设）；4.判断褪色原因是否为加成。',
    phenomenon: '溴水橙红/棕红色褪去。',
    conclusion: '乙烯能与溴加成使溴水褪色，可用于检验不饱和键。',
    precautions: '溴水有腐蚀性与毒性；通入速率与装置气密性（书面评价）。',
    safetyNotes: PAPER_ONLY + ' 溴试剂危险，禁止家用。',
    isHazardous: false,
  }),

  'exp.ethanol_oxid': expBase({
    name: '乙醇催化氧化',
    category: 'property',
    purpose:
      '书面分析题训练：认识乙醇在Cu或Ag催化加热下被氧气氧化为乙醛的条件、现象与方程式。',
    principle:
      '2CH3CH2OH+O2=Cu或Ag、加热=2CH3CHO+2H2O。常见演示：铜丝加热变黑（CuO）后伸入乙醇，又变为红色，循环催化。',
    instruments: '酒精灯、铜丝（或银丝）、试管等（题设图示）',
    reagents: '乙醇、空气（O2）、Cu或Ag',
    steps:
      '1.加热铜丝至表面变黑；2.趁热伸入乙醇液面上方或按教材操作；3.观察铜丝颜色变化与气味；4.写出化学方程式并标明条件。',
    phenomenon: '铜丝由黑变红；可闻到刺激性气味（乙醛）。',
    conclusion: '乙醇可催化氧化为乙醛；条件必须写清催化剂与加热。',
    precautions: '乙醇易燃，远离明火隐患；仅书面分析操作正误。',
    safetyNotes: PAPER_ONLY + ' 禁止家用加热有机物实验。',
    isHazardous: false,
  }),

  'exp.esterification': expBase({
    name: '乙酸乙酯制备',
    category: 'organic_prep',
    purpose:
      '书面分析题训练：掌握酯化反应条件、装置要点、饱和碳酸钠溶液作用及产物分层现象分析。',
    principle:
      'CH3COOH+C2H5OH⇌浓硫酸、加热⇌CH3COOC2H5+H2O。浓硫酸催化并吸水；产物用饱和Na2CO3吸收乙酸、溶解乙醇并降低酯溶解度，便于分层观察。',
    instruments: '大试管、导管、酒精灯、接收试管等',
    reagents: '乙酸、乙醇、浓硫酸、饱和碳酸钠溶液',
    steps:
      '1.按顺序加入试剂（题设常考加料顺序）；2.加热；3.导管口在液面上防倒吸（题设）；4.观察上层油状有香味液体；5.评价可逆与提高产率措施（书面）。',
    phenomenon: '有香味；在饱和Na2CO3液面上出现油状液体层。',
    conclusion: '可制得乙酸乙酯；反应可逆；饱和碳酸钠有助于观察与分离酯。',
    precautions: '浓硫酸腐蚀；加热防暴沸/液体冲出；导管不可伸入碳酸钠液面下过深导致倒吸（题设）。',
    safetyNotes: PAPER_ONLY + ' 禁止家用酯化实验。',
    isHazardous: false,
  }),

  'exp.acetic_acid': expBase({
    name: '乙酸酸性验证',
    category: 'property',
    purpose:
      '书面分析题训练：通过石蕊、与活泼金属、碱、碳酸盐等反应验证乙酸酸性及“强于碳酸”的比较。',
    principle:
      '乙酸为弱酸但具酸通性；2CH3COOH+Na2CO3=2CH3COONa+CO2↑+H2O，可证明酸性强于碳酸。',
    instruments: '试管、胶头滴管、导管、澄清石灰水等',
    reagents: '乙酸、紫色石蕊、镁条（或锌）、NaOH、Na2CO3、澄清石灰水',
    steps:
      '1.石蕊变红；2.与活泼金属产生气泡；3.与NaOH中和；4.与Na2CO3反应，气体通入石灰水变浑浊；5.对比结论。',
    phenomenon: '石蕊变红；有气泡；石灰水变浑浊等。',
    conclusion: '乙酸具酸性；酸性强于碳酸。',
    precautions: '浓乙酸腐蚀刺激；气体检验注意量与装置。',
    safetyNotes: PAPER_ONLY,
    isHazardous: false,
  }),

  'exp.galvanic_Zn_Cu': expBase({
    name: '铜锌原电池实验',
    category: 'electrochem',
    purpose:
      '书面分析题训练：分析Zn-Cu原电池的电极、电子流向、离子迁移及电解质不同时正极反应的差异。',
    principle:
      '原电池将化学能转化为电能。电子经外电路从负极流向正极；溶液中阴、阳离子定向迁移形成闭合回路。负极：较活泼金属Zn失电子被氧化。正极还原反应取决于电解质：①电解质为CuSO4时，正极通常Cu2++2e-=Cu；②电解质为稀H2SO4时，正极通常2H++2e-=H2↑。须按题设电解质判断，不可混用。并非所有原电池都必须是两种不同金属（电极材料组合以题设为准）。',
    instruments: '锌片、铜片、导线、电流计（或小灯泡）、烧杯等（图示）',
    reagents: 'Zn、Cu；CuSO4溶液或稀H2SO4（题设二选一或对照）',
    steps:
      '1.辨认电极与电解质；2.判断负极氧化、正极还原；3.标出电子外电路方向；4.说明离子在溶液中的迁移；5.对照CuSO4与稀H2SO4两种题设写电极反应。',
    phenomenon:
      '电流计偏转或灯泡发光；锌片溶解；CuSO4中铜片上可析出铜；稀硫酸中铜片上可有气泡（题设）。',
    conclusion:
      '能构成原电池并产生电流；电子走外电路、离子走电解质；正极反应随电解质而变。',
    precautions: '电极与电解质匹配；书写电极反应须与题设一致；仅书面分析。',
    safetyNotes: PAPER_ONLY + ' 纸面分析，不要求动手。',
    isHazardous: false,
    reviewExtra: '电解质CuSO4 vs 稀H2SO4正极不同;电子外电路;离子溶液迁移',
  }),
}

const CONCEPTS = {
  'concept.homolog': {
    name: '同系物',
    definition:
      '结构相似、分子组成上相差一个或若干个CH2原子团的有机物互称为同系物；同系物通式相同（如烷烃CnH2n+2）。',
    principle: '同系物化学性质相似，物理性质随碳原子数增加呈规律变化（教材定性认识）。',
    applicableConditions: '比较须结构相似且通式一致；官能团种类与数目须对应（高一常见：烷烃、烯烃等）。',
    judgeMethods: '看结构是否相似、组成差是否为n个CH2、通式是否相同。',
    examples: 'CH4、C2H6、C3H8为同系物；CH2=CH2与CH3CH=CH2为同系物（烯烃）。',
    commonMistakes: '仅看分子式相差CH2就判同系物而忽略结构不相似；把同分异构体当成同系物。',
  },

  'concept.isomer': {
    name: '同分异构体',
    definition: '分子式相同、结构不同的化合物互为同分异构体。',
    principle: '分子式相同而原子连接方式或官能团位置等不同，导致性质可能不同。',
    applicableConditions:
      '高一以碳链异构、位置异构等基础书写为主；复杂立体异构、大量推断限默认训练。',
    judgeMethods: '先确认分子式相同，再比较结构是否不同；可用结构简式列举。',
    examples: 'C4H10的正丁烷与异丁烷；乙醇与二甲醚（分子式C2H6O，了解级示例以教材为准）。',
    commonMistakes: '把同系物当成同分异构体；重复书写同一结构；漏写或超纲展开。',
    reviewExtra: '高一书写技能有限;复杂推断限默认训练',
  },

  'concept.functional_group': {
    name: '官能团初步',
    definition: '决定有机化合物主要化学性质的原子或原子团，叫做官能团。',
    principle: '相同官能团的化合物往往表现相似的化学性质；学习有机物常抓住官能团。',
    applicableConditions: '必修常见：碳碳双键、羟基、羧基、酯基等；深度以教材为准。',
    judgeMethods: '从结构简式中识别官能团，并联系典型反应（加成、酯化、酸性等）。',
    examples: '乙烯含碳碳双键；乙醇含羟基；乙酸含羧基；乙酸乙酯含酯基。',
    commonMistakes: '把碳碳单键或甲基当成官能团；混淆羟基与羧基。',
  },

  'concept.substitution': {
    name: '取代反应',
    definition:
      '有机物分子中的某些原子或原子团被其他原子或原子团所替代的反应，叫做取代反应。',
    principle: '取代不是简单“丢掉”，而是一种原子/基团被另一种替代；甲烷氯代是典型例子。',
    applicableConditions: '烷烃光照氯代等；注意可生成多种取代产物。',
    judgeMethods: '看是否有原子/基团被替代，并生成相应小分子（如HCl）。',
    examples: 'CH4与Cl2光照取代；苯的溴代等属更深层次，勿默认超纲。',
    commonMistakes: '把加成当成取代；把甲烷氯代写成只有一种产物。',
  },

  'concept.addition': {
    name: '加成反应',
    definition:
      '有机物分子中不饱和键两端的原子与其他原子或原子团直接结合生成新化合物的反应，叫做加成反应。',
    principle: '不饱和键（如双键）断裂π键，试剂两部分分别加到不饱和碳上。',
    applicableConditions: '烯烃与Br2、H2、H2O等；条件因试剂而异。',
    judgeMethods: '不饱和键数目减少、原子利用率高、常使溴水褪色等。',
    examples: '乙烯与溴、乙烯加氢、乙烯水化。',
    commonMistakes: '与取代混淆；误以为加成一定需要光照。',
  },

  'concept.esterification_rule': {
    name: '酯化反应规律',
    definition: '酸与醇反应生成酯和水的反应叫做酯化反应；乙酸与乙醇酯化是典型。',
    principle:
      '教材规律：酯化时羧酸提供羟基（−OH），醇提供羟基上的氢（−H），结合成水，其余部分结合成酯；反应可逆，常用浓硫酸催化并加热。',
    applicableConditions: '浓硫酸、加热；可逆，注意产率与分离。',
    judgeMethods: '反应物为酸+醇，产物为酯+水，条件含浓硫酸加热，箭头用⇌。',
    examples: 'CH3COOH+C2H5OH⇌CH3COOC2H5+H2O',
    commonMistakes: '写成不可逆；漏写浓硫酸或加热；酸醇脱水部位记反（按教材规律记忆）。',
  },

  'concept.endothermic': {
    name: '吸热反应',
    definition: '吸收热量的化学反应叫做吸热反应。',
    principle:
      '反应热效应取决于断键吸收能量与成键放出能量的相对大小：断键吸能、成键放能；若总效果为体系从环境吸热，则为吸热。加热只是反应条件，不等于该反应一定是吸热反应。',
    applicableConditions: '判断依据是反应的热效应，不是是否需要加热启动。',
    judgeMethods: '看ΔH符号或题给“吸热/放热”；不能仅凭“需要加热”判定为吸热。',
    examples: '某些分解反应（题设）；以教材列举为准。',
    commonMistakes: '把“需要加热”等同于吸热反应；忽略断键/成键能量比较。',
    reviewExtra: '加热≠吸热判据;断键吸能成键放能',
  },

  'concept.exothermic': {
    name: '放热反应',
    definition: '放出热量的化学反应叫做放热反应。',
    principle:
      '成键放出的总能量大于断键吸收的总能量时，反应放热。燃烧、中和等多属放热，但仍须以题设或能量数据为准。加热≠吸热，同样“能发生”也不等于放热判据。',
    applicableConditions: '热效应判断；可与原电池、燃烧等综合。',
    judgeMethods: 'ΔH<0或题干明确放热；结合键能/能量图定性（教材深度）。',
    examples: '燃料燃烧；酸碱中和（常见）。',
    commonMistakes: '认为凡是燃烧以外的反应都吸热；用是否加热反推热效应。',
    reviewExtra: '加热≠吸热判据;总热效应看相对大小',
  },

  'concept.heat_of_reaction': {
    name: '反应热',
    definition:
      '化学反应中放出或吸收的热量叫做反应热（概念级认识）；可用热化学方程式表示反应热与物质聚集状态的关系。',
    principle:
      '反应热与物质的聚集状态、计量数有关；燃烧热、中和热等为相关概念（了解）。定量计算深度以所用教材为准。',
    applicableConditions: '必修第二册概念级；复杂热量计算不作为默认高一训练。',
    judgeMethods: '识别热化学方程式中的ΔH与状态；区分吸热/放热符号口径（随教材）。',
    examples: '热化学方程式示例以教材为准；注明气、液、固状态。',
    commonMistakes: '忽略聚集状态；把反应热与温度变化简单等同；超纲定量。',
    reviewExtra:
      '待教材核实:verifyNeeded;概念级;禁复杂定量默认训练;curriculumScope:必修第二册',
  },

  'concept.addition_polymer': {
    name: '加成聚合',
    definition:
      '不饱和单体通过加成的方式互相结合成为高分子化合物的反应，叫做加成聚合反应（加聚）。',
    principle: '如乙烯加聚生成聚乙烯：nCH2=CH2 →催化剂等→ ┄[CH2−CH2]┄n（写法随教材）。',
    applicableConditions: '必修了解聚合物与单体关系；不展开复杂高分子工程。',
    judgeMethods: '由高分子链节推断单体；单体含不饱和键。',
    examples: '乙烯→聚乙烯。',
    commonMistakes: '缩聚与加聚混淆；链节与单体写错。',
    reviewExtra: '乙烯加聚示例;范围按必修了解',
  },
}

const KNOWLEDGE = {
  'kp.organic.methane': {
    name: '甲烷结构与性质',
    description:
      '甲烷分子为正四面体结构，分子式CH4。性质稳定，可燃烧；光照下与氯气发生取代，产物可为多种氯代甲烷，不得写唯一产物。是认识烷烃的典型代表。',
    difficulty: 2,
    importance: 5,
  },
  'kp.organic.alkane': {
    name: '烷烃通式与性质',
    description:
      '烷烃通式CnH2n+2（链状），为饱和烃。化学性质较稳定，可发生取代与燃烧；一般不能因加成使溴水褪色。同系物物理性质递变。',
    difficulty: 2,
    importance: 5,
  },
  'kp.organic.ethene': {
    name: '乙烯结构与性质',
    description:
      '乙烯结构简式CH2=CH2，含碳碳双键。易加成（Br2、H2、H2O等）；使酸性KMnO4褪色但不指定唯一氧化产物；可加聚。实验室可由乙醇浓硫酸加热制取（认知）。',
    difficulty: 2,
    importance: 5,
  },
  'kp.organic.ethanol': {
    name: '乙醇结构与性质',
    description:
      '乙醇CH3CH2OH，官能团羟基。可燃烧；Cu/Ag催化加热下氧化为乙醛；与乙酸酯化。物理性质：无色液体、与水互溶、易燃。',
    difficulty: 2,
    importance: 5,
  },
  'kp.organic.acetic': {
    name: '乙酸结构与性质',
    description:
      '乙酸CH3COOH，官能团羧基，弱酸但具酸通性；酸性强于碳酸（与碳酸盐放CO2）。可发生酯化。食醋中含乙酸（了解）。',
    difficulty: 2,
    importance: 5,
  },
  'kp.organic.isomer_skill': {
    name: '同分异构体书写技能',
    description:
      '先固定分子式，再按碳链异构、官能团位置等有序列举，检查重复与遗漏。高一以简单烷烃/烯烃/醇醚等基础题型为主，复杂推断不作为默认训练。',
    difficulty: 3,
    importance: 4,
    reviewExtra: '高一基础书写;复杂推断限默认',
  },
  'kp.inference.color': {
    name: '颜色推断方法',
    description:
      '利用物质或离子的特征颜色、溶液褪色/变色作为突破口：如酸性KMnO4紫红、溴水橙红、Cu2+蓝、Fe3+黄棕、沉淀颜色等。须结合题设试剂与条件，避免单一线索武断。',
    difficulty: 2,
    importance: 5,
  },
  'kp.inference.block': {
    name: '无机框图推断策略',
    description:
      '框图推断：先找特征转化（气、沉淀、颜色、焰色、酸碱性），再确定突破口物质，最后用箭头关系验证全局自洽。注意过量与气体通入顺序对产物的影响。',
    difficulty: 3,
    importance: 5,
  },
  'kp.inference.conversion': {
    name: '物质转化推断',
    description:
      '沿转化关系写可能反应类型（置换、复分解、氧化还原、有机加成/取代等），用计量与现象约束排除干扰。有机转化抓住官能团变化。',
    difficulty: 3,
    importance: 4,
  },
  'kp.comprehensive.basic': {
    name: '基础综合解题框架',
    description:
      '综合题一般路径：审清已知与设问→定位知识模块（元素/有机/能量/实验）→写关键方程式或关系式→检查计量、条件与单位→回代题设验证。先易后难，避免跳步丢条件。',
    difficulty: 2,
    importance: 4,
  },
  'kp.energy.bond_change': {
    name: '化学键与能量变化',
    description:
      '化学反应中：断裂化学键吸收能量，形成化学键放出能量。反应吸热还是放热，取决于二者总效果的相对大小，不能仅凭是否加热判断。',
    difficulty: 2,
    importance: 5,
  },
  'kp.energy.chem_electric': {
    name: '化学能与电能',
    description:
      '原电池等装置可把化学能转化为电能；电解则是电能转化为化学能（了解对比）。认识能量转化形式是必修要点。',
    difficulty: 2,
    importance: 4,
  },
  'kp.energy.galvanic': {
    name: '原电池',
    description:
      '原电池是将化学能转化为电能的装置。一般需：自发氧化还原反应、电极、电解质溶液（或离子导体）、形成闭合回路。电子在外电路迁移，离子在电解质中迁移。并非所有原电池都必须由两种不同金属构成，电极组合以题设与构成条件为准。',
    difficulty: 2,
    importance: 5,
    reviewExtra: '电子外电路;离子在电解质;不必须两种不同金属',
  },
  'kp.energy.galvanic_poles': {
    name: '原电池正负极',
    description:
      '负极：发生氧化反应（失电子），通常是较活泼金属电极。正极：发生还原反应（得电子）。正负极判断要结合电极材料与电解质中的氧化剂。',
    difficulty: 2,
    importance: 5,
  },
  'kp.energy.electron_flow': {
    name: '原电池电子流向',
    description:
      '外电路中电子由负极流向正极；电流方向与电子流向相反。溶液中阳离子向正极迁移、阴离子向负极迁移，不可说电子在溶液中流动。',
    difficulty: 2,
    importance: 5,
  },
  'kp.energy.electrode_rxn': {
    name: '原电池电极反应',
    description:
      '分别写出负极氧化、正极还原的电极反应式，再相加得总反应。Zn-Cu原电池：电解质为CuSO4时正极多为Cu2+得电子；为稀H2SO4时正极多为H+得电子。须按题设书写。',
    difficulty: 3,
    importance: 5,
  },
  'kp.energy.chem_power': {
    name: '常见化学电源',
    description:
      '了解常见化学电源（如干电池、蓄电池、锂电池等名称与用途层次，以教材为准）。勿展开复杂电化学工程与电极材料细节作为默认训练。',
    difficulty: 2,
    importance: 3,
    reviewExtra: '了解级;勿展开工程细节',
  },
  'kp.energy.thermo_eq': {
    name: '热化学方程式书写',
    description:
      '热化学方程式须注明物质聚集状态，并给出ΔH（符号与单位口径随教材）。计量数与ΔH对应；同一反应计量数翻倍则ΔH相应变化。',
    difficulty: 3,
    importance: 4,
  },
  'kp.sustain.seawater': {
    name: '海水资源开发',
    description:
      '海水中含丰富水资源与化学资源（如NaCl、镁、溴等，了解）。认识海水淡化与综合利用的意义，深度以教材案例为准。',
    difficulty: 1,
    importance: 3,
  },
  'kp.sustain.coal': {
    name: '煤的综合利用',
    description:
      '煤可通过干馏、气化、液化等途径综合利用（了解名称与意义），减少污染、提高资源利用率。勿展开复杂工艺计算。',
    difficulty: 2,
    importance: 3,
  },
  'kp.sustain.natural_gas': {
    name: '天然气利用',
    description:
      '天然气主要成分为甲烷，是较清洁的化石燃料；也可作化工原料（了解）。注意安全使用与碳中和背景认知（教材层次）。',
    difficulty: 1,
    importance: 3,
  },
  'kp.sustain.fertilizer': {
    name: '化肥合理使用',
    description:
      '认识氮、磷、钾肥等作用与合理施用，避免过量导致污染。结合元素化合物知识作了解级综合。',
    difficulty: 1,
    importance: 3,
  },
  'kp.sustain.pesticide': {
    name: '农药合理使用',
    description:
      '农药有助于防治病虫害，但须合理使用，减少残留与生态危害。属社会责任与科学态度类认知条目。',
    difficulty: 1,
    importance: 3,
  },
  'kp.sustain.medicine': {
    name: '药物合理使用',
    description:
      '认识药物按说明书与医嘱使用的重要性，了解滥用抗生素等危害（教材案例层次），不涉及诊疗指导。',
    difficulty: 1,
    importance: 3,
  },
  'kp.sustain.food_additive': {
    name: '食品添加剂',
    description:
      '食品添加剂在规定范围与剂量内可改善食品品质；应正确认识“合法合规使用”与安全，抵制非法添加。',
    difficulty: 1,
    importance: 3,
  },
  'kp.sustain.green_chem': {
    name: '绿色化学',
    description:
      '绿色化学强调从源头减少或消除污染，提高原子利用率，选用更安全的原料、溶剂与反应路径（概念认识）。',
    difficulty: 2,
    importance: 4,
  },
  'kp.sustain.atom_economy': {
    name: '原子经济性',
    description:
      '原子经济性关注反应物原子进入目标产物的比例，加成等反应原子利用率高（概念级）。定量计算公式与训练深度待教材核实。',
    difficulty: 2,
    importance: 3,
    reviewExtra:
      '待教材核实:概念级;计算题深度待核实;excludeDefaultTrainingUntilVerified;非人工已审',
  },
  'kp.organic.petroleum': {
    name: '石油分馏',
    description:
      '石油分馏是利用各组分沸点不同进行分离的物理变化过程，得到汽油、煤油、柴油等馏分（了解）。与裂化、裂解等化学加工区分。',
    difficulty: 2,
    importance: 4,
  },
  'kp.organic.cracking': {
    name: '石油裂化',
    description:
      '裂化是使长链烃断裂为较短链烃的过程，以提高轻质燃油产量等（了解）。与裂解区分；具体反应深度与考法待教材核实。',
    difficulty: 2,
    importance: 3,
    reviewExtra:
      '待教材核实:与裂解区分;深度待核实;excludeDefaultTrainingUntilVerified;非人工已审',
  },
  'kp.organic.pyrolysis': {
    name: '石油裂解',
    description:
      '裂解是深度断裂以获得乙烯、丙烯等化工原料的过程（了解）。与裂化目的与条件不同；细节待教材核实前不作默认核心训练。',
    difficulty: 2,
    importance: 3,
    reviewExtra:
      '待教材核实:与裂化区分;深度待核实;excludeDefaultTrainingUntilVerified;非人工已审',
  },
  'kp.organic.biomolecule': {
    name: '生命中的基本有机物（了解）',
    description:
      '糖类、油脂、蛋白质、维生素等是生命中的基本有机物（认知级）。了解存在与功能层次即可，勿展开生物学详细代谢途径。',
    difficulty: 1,
    importance: 3,
    reviewExtra:
      '待教材核实:覆盖深度;认知级;勿展开代谢;excludeDefaultTrainingUntilVerified;非人工已审',
  },
  'kp.enviro.pollution': {
    name: '环境污染与防治认知',
    description:
      '认识大气污染、水污染、土壤污染等类型及防治思路：源头控制、达标排放、绿色工艺与个人环保行为。结合硫氧化物、氮氧化物、塑料等教材案例。',
    difficulty: 2,
    importance: 4,
  },
  'kp.enviro.acid_rain': {
    name: '酸雨',
    description:
      '酸雨主要与SO2、NOx等排放有关；可酸化水体与土壤、腐蚀建筑。防治：脱硫脱硝、清洁能源、节能等。与硫、氮氧化物知识综合。',
    difficulty: 2,
    importance: 4,
  },
}

const QUESTIONS = {
  'q.organic.methane': {
    qtype: 'single',
    stem:
      '（骨架）关于甲烷的叙述正确的是？A.分子呈平面正方形  B.分子呈正四面体  C.与Cl2光照只生成一种有机产物  D.不能燃烧',
    answer: 'B',
    optionsJson: [
      { key: 'A', text: '分子呈平面正方形' },
      { key: 'B', text: '分子呈正四面体' },
      { key: 'C', text: '与Cl2光照只生成一种有机产物' },
      { key: 'D', text: '不能燃烧' },
    ],
    analysis: '甲烷为正四面体；氯代可生成多种氯代产物，C错。',
    scoring: '选对得分。',
    difficulty: 1,
    reviewExtra: '骨架非正式训练题;可充实选项',
  },

  'q.organic.ethene': {
    qtype: 'judge',
    stem: '（骨架）判断：乙烯能使溴水褪色，该反应属于加成反应。',
    answer: '正确',
    analysis: 'CH2=CH2+Br2→CH2BrCH2Br，为加成，溴水褪色。',
    scoring: '判断正确得分。',
    difficulty: 1,
    reviewExtra: '骨架非正式训练题',
  },

  'q.organic.ethanol': {
    qtype: 'blank',
    stem:
      '（骨架）乙醇催化氧化常用______或______作催化剂并加热，产物乙醛的化学式为______。',
    answer: 'Cu；Ag；CH3CHO',
    analysis: '教材常见Cu或Ag催化加热；2CH3CH2OH+O2→2CH3CHO+2H2O。',
    scoring: '催化剂与产物均对得分。',
    difficulty: 2,
    reviewExtra: '骨架非正式训练题',
  },

  'q.organic.ester': {
    qtype: 'short',
    stem:
      '（骨架）写出乙酸与乙醇酯化的化学方程式（标明条件与可逆），并说明浓硫酸的作用。',
    answer:
      'CH3COOH+C2H5OH⇌浓硫酸、加热⇌CH3COOC2H5+H2O；浓硫酸作催化剂并吸水（促进平衡）。',
    analysis: '酯化可逆；条件与规律为得分点。',
    scoring: '方程式+条件+浓硫酸作用要点。',
    difficulty: 2,
    reviewExtra: '骨架非正式训练题',
  },

  'q.organic.isomer': {
    qtype: 'short',
    stem: '（骨架）写出分子式为C4H10的烷烃的同分异构体结构简式（要求不重复）。',
    answer: 'CH3CH2CH2CH3；CH3CH(CH3)CH3（正丁烷与异丁烷）',
    analysis: '碳链异构两种；检查重复。',
    scoring: '两种均写出且不重复得分。',
    difficulty: 2,
    reviewExtra: '骨架非正式训练题;基础书写',
  },

  'q.inference.block': {
    qtype: 'inference',
    stem:
      '（骨架）某无机框图：A为淡黄色固体单质，燃烧得气体B；B使品红褪色且加热可恢复。推断A、B（写化学式）并给出关键依据。',
    answer: 'A为S；B为SO2（依据：淡黄色单质硫；SO2漂白可逆恢复）',
    analysis: '颜色+漂白可逆是突破口；需用转化验证。',
    scoring: '物质正确+依据要点。',
    difficulty: 2,
    reviewExtra: '骨架非正式训练题;框图模板',
  },

  'q.inference.phenomenon': {
    qtype: 'inference',
    stem:
      '（骨架）气体X通入溴水褪色，通入酸性KMnO4也褪色；另有气体Y与溴水混合长时间颜色变化不明显。X、Y更可能分别是乙烯与乙烷还是相反？简述理由。',
    answer: 'X为乙烯，Y为乙烷；乙烯不饱和可加成/被氧化褪色，乙烷饱和通常不能。',
    analysis: '用现象反推饱和性差异。',
    scoring: '对应正确+理由。',
    difficulty: 2,
    reviewExtra: '骨架非正式训练题',
  },

  'q.substance.NaOH': {
    qtype: 'multi',
    stem: '（骨架）下列关于烧碱（NaOH）的说法正确的是？',
    answer: 'A,C',
    optionsJson: [
      { key: 'A', text: '俗名烧碱、火碱、苛性钠' },
      { key: 'B', text: '水溶液显酸性' },
      { key: 'C', text: '能与乙酸发生中和反应' },
      { key: 'D', text: '固体可敞口长期放置于空气中而无变化' },
    ],
    analysis: 'NaOH为强碱；易潮解并吸收CO2，不可敞口长期放置。',
    scoring: '多选全对得分（或按评分标准给漏选分）。',
    difficulty: 1,
    reviewExtra: '骨架非正式训练题',
  },

  'q.comprehensive.mock': {
    qtype: 'short',
    stem:
      '（骨架·综合）简述：①甲烷氯代为何不能写成“只生成CH3Cl”；②Zn-Cu原电池在CuSO4与稀H2SO4中正极反应有何不同；③加热能否作为吸热反应的判据。',
    answer:
      '①可生成多种氯代产物；②CuSO4中正极Cu2+得电子，稀H2SO4中正极H+得电子；③不能，加热是条件不是热效应判据。',
    analysis: '覆盖有机取代、原电池电解质差异、能量概念易错点。',
    scoring: '三点分别给分。',
    difficulty: 3,
    reviewExtra: '骨架非正式训练题;综合模拟组',
  },
}

module.exports = {
  SUBSTANCES,
  REACTIONS,
  EXPERIMENTS,
  KNOWLEDGE,
  QUESTIONS,
  CONCEPTS,
}
