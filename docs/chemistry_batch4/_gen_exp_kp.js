/** Experiments + knowledge for Batch4; merge with _partial_sub_rxn.json → batch4_content.js */
const fs = require('fs')
const path = require('path')
const dir = __dirname

const { SUBSTANCES, REACTIONS } = JSON.parse(
  fs.readFileSync(path.join(dir, '_partial_sub_rxn.json'), 'utf8'),
)

const EXPERIMENTS = {
  'exp.Cl2_prep': {
    name: '氯气的实验室制法',
    category: 'gas_prep',
    purpose: '学习用MnO2与浓盐酸加热制取氯气，并认识收集与尾气处理。',
    principle: 'MnO2+4HCl(浓)=△=MnCl2+Cl2↑+2H2O；Cl2密度比空气大，可用向上排空气法；尾气用NaOH吸收。',
    instruments: '圆底烧瓶、分液漏斗、酒精灯、导管、集气瓶、尾气吸收装置等',
    reagents: 'MnO2、浓盐酸、NaOH溶液（尾气）',
    steps:
      '1.检查气密性；2.加入MnO2，分液漏斗加浓盐酸，加热；3.向上排空气法收集；4.多余Cl2用NaOH吸收；5.规范处理残液。',
    phenomenon: '产生黄绿色气体；集气瓶逐渐呈黄绿色。',
    conclusion: '可用MnO2与浓盐酸加热制Cl2；必须处理尾气。',
    precautions: '浓盐酸过量与加热控制；全通风；尾气吸收不可缺失。',
    safetyNotes: 'Cl2有毒；禁止家用；必须在通风橱由教师指导完成。',
    isHazardous: true,
    homeForbiddenNote: '危险气体实验禁止在家操作。',
  },
  'exp.Cl2_property': {
    name: '氯气性质实验',
    category: 'property',
    purpose: '观察氯气氧化性、与水/碱反应及漂白相关现象（教师演示为主）。',
    principle:
      'Cl2具强氧化性；Cl2+H2O⇌HCl+HClO；Cl2+2NaOH=NaCl+NaClO+H2O；湿润氯气漂白实质为HClO。',
    instruments: '集气瓶、胶头滴管、有色布条、试管等',
    reagents: '氯气、水、NaOH溶液、干燥/湿润有色布条、淀粉KI试纸等',
    steps:
      '1.对比干燥与湿润有色布条在Cl2中的现象；2.氯水滴加指示剂或观察颜色；3.Cl2通入NaOH观察气体吸收；4.湿润淀粉KI试纸检验（按教材）。',
    phenomenon:
      '湿润布条褪色、干燥布条通常不褪色（或褪色不明显）；氯水浅黄绿；通入碱液气体被吸收；淀粉KI试纸变蓝。',
    conclusion: '氯气氧化性强；漂白与HClO相关；可与碱反应。',
    precautions: '用量少；通风；区分现象与结论。',
    safetyNotes: '有毒气体；禁止家用。',
    isHazardous: true,
    homeForbiddenNote: '危险气体实验禁止在家操作。',
  },
  'exp.HCl_prep': {
    name: '氯化氢/盐酸相关实验',
    category: 'gas_prep',
    purpose: '认识HCl气体的制取思路、溶解性及与氨的白烟检验（按教材选取）。',
    principle: '浓硫酸与氯化钠加热可制HCl（了解）；HCl极易溶于水得盐酸；NH3+HCl=NH4Cl产生白烟。',
    instruments: '发生装置、导管、集气瓶或检验用品等',
    reagents: 'NaCl、浓硫酸（若制取）、浓氨水、蒸馏水、指示剂等',
    steps:
      '1.若做白烟检验：浓盐酸与浓氨水靠近观察白烟；2.盐酸性质：石蕊变红、与活泼金属等（按教材）；3.注意防倒吸与腐蚀。',
    phenomenon: '白烟；盐酸使石蕊变红；与活泼金属有气泡等。',
    conclusion: 'HCl与NH3可生成NH4Cl；盐酸具强酸通性。',
    precautions: '浓酸腐蚀；气体实验防倒吸。',
    safetyNotes: '刺激性/腐蚀性；禁止家用危险操作。',
    isHazardous: true,
    homeForbiddenNote: '危险实验禁止在家操作。',
  },
  'exp.SO2_property': {
    name: '二氧化硫漂白与还原性',
    category: 'property',
    purpose: '观察SO2使品红褪色及加热恢复，并认识其还原性表现（与Cl2漂白对比）。',
    principle:
      'SO2漂白：与有色物质生成不稳定无色物质，加热可恢复。还原性：可使某些氧化剂褪色（如酸性KMnO4，了解/题设）。与HClO漂白不可逆不同。',
    instruments: '试管、导管、酒精灯、品红溶液等',
    reagents: 'SO2（现制或通入）、品红溶液、酸性KMnO4（可选了解）',
    steps:
      '1.SO2通入品红，观察褪色；2.加热褪色后的溶液，观察是否恢复；3.可选：通入酸性KMnO4观察褪色（了解）；4.尾气吸收处理。',
    phenomenon: '品红褪色；加热后红色可恢复；KMnO4可褪色（若做）。',
    conclusion: 'SO2具漂白性（可逆恢复）和还原性；与次氯酸漂白不同。',
    precautions: 'SO2有毒，通风；尾气处理。',
    safetyNotes: '有毒气体；禁止家用。',
    isHazardous: true,
    homeForbiddenNote: '危险气体实验禁止在家操作。',
  },
  'exp.NH3_prep': {
    name: '氨的实验室制法与喷泉',
    category: 'gas_prep',
    purpose: '学习铵盐与碱共热制氨，并认识氨极易溶于水的喷泉实验原理。',
    principle: 'NH4Cl+NaOH=△=NaCl+NH3↑+H2O；氨密度比空气小，向下排空气法收集；喷泉体现极易溶于水且水溶液显碱性。',
    instruments: '大试管、酒精灯、导管、圆底烧瓶、胶头滴管、水槽等',
    reagents: 'NH4Cl、Ca(OH)2或NaOH、酚酞、水',
    steps:
      '1.铵盐与碱混匀加热制NH3；2.向下排空气法收集；3.湿润红色石蕊试纸检验；4.喷泉：烧瓶充满NH3，滴管挤入水，打开止水夹形成喷泉，酚酞变红。',
    phenomenon: '刺激性气味；石蕊试纸变蓝；喷泉，溶液变红。',
    conclusion: '可用铵盐与碱制NH3；氨极易溶于水，水溶液显碱性。',
    precautions: '防倒吸；加热均匀；收集方法正确。',
    safetyNotes: '刺激性气体；教师指导；禁止家用。',
    isHazardous: true,
    homeForbiddenNote: '危险实验禁止在家操作。',
  },
  'exp.HNO3_Cu': {
    name: '硝酸与铜反应对比',
    category: 'property',
    purpose: '对比稀硝酸与浓硝酸和铜反应的产物气体差异（教师演示）。',
    principle:
      '稀：3Cu+8HNO3=3Cu(NO3)2+2NO↑+4H2O；浓：Cu+4HNO3=Cu(NO3)2+2NO2↑+2H2O。条件不同产物不同。',
    instruments: '试管、导管、通风橱等',
    reagents: '铜片、稀硝酸、浓硝酸',
    steps:
      '1.通风橱中分别进行稀/浓硝酸与铜反应；2.观察气体颜色与溶液颜色；3.稀硝酸产生的NO遇空气变红棕；4.规范处理废液尾气。',
    phenomenon: '稀硝酸：无色气体遇空气变红棕，溶液变蓝；浓硝酸：立即大量红棕色气体，溶液变蓝。',
    conclusion: '浓稀硝酸氧化产物气态氮氧化物不同，必须分条件书写。',
    precautions: '氮氧化物有毒；用量少；通风。',
    safetyNotes: '强腐蚀与有毒气体；禁止家用。',
    isHazardous: true,
    homeForbiddenNote: '危险实验禁止在家操作。',
  },
  'exp.CO2_property': {
    name: '二氧化碳性质与检验',
    category: 'property',
    purpose: '检验CO2并使澄清石灰水变浑浊，认识不支持燃烧等性质（镁等例外另述）。',
    principle: 'CO2+Ca(OH)2=CaCO3↓+H2O；一般不燃烧也不支持燃烧（镁等例外见金属章）。',
    instruments: '集气瓶、导管、火柴、澄清石灰水等',
    reagents: 'CO2（大理石与稀盐酸制取）、澄清石灰水',
    steps:
      '1.制取并收集CO2；2.通入澄清石灰水观察浑浊；3.燃烧着的木条伸入集气瓶观察熄灭；4.与SO2区分时结合漂白等题设。',
    phenomenon: '石灰水变浑浊；木条熄灭。',
    conclusion: '可用澄清石灰水检验CO2；一般不支持燃烧。',
    precautions: '制取防倒吸；废液处理。',
    safetyNotes: '高浓度窒息；实验室规范操作。',
    isHazardous: false,
    homeForbiddenNote: '建议在教师指导下完成；勿使用不明化学品。',
  },
  'exp.SiO2_glass': {
    name: '二氧化硅与玻璃仪器腐蚀警示',
    category: 'safety',
    purpose: '认识玻璃含SiO2，热的强碱溶液可腐蚀玻璃，强化仪器使用安全。',
    principle: 'SiO2+2NaOH=Na2SiO3+H2O；长期盛放碱液会腐蚀玻璃磨口等。',
    instruments: '玻璃仪器（展示说明为主）',
    reagents: 'NaOH溶液（教师说明，不必真实长时间腐蚀演示）',
    steps:
      '1.讲解玻璃成分含SiO2；2.写出与NaOH反应方程式；3.强调碱液不宜长期存放于玻璃试剂瓶磨口；4.讨论塑料瓶等替代（了解）。',
    phenomenon: '本实验以讲解警示为主；若观察长期存放碱液的瓶塞黏结等现象按实物说明。',
    conclusion: 'SiO2显酸性氧化物性质；使用强碱需注意保护玻璃仪器。',
    precautions: '勿为“看腐蚀”故意损坏仪器。',
    safetyNotes: '碱腐蚀皮肤；规范取用。',
    isHazardous: false,
    homeForbiddenNote: '安全教育内容；勿自行用强碱破坏器皿。',
  },
}

const KNOWLEDGE = {
  'kp.Cl.property': {
    name: '氯气的性质与用途',
    description:
      'Cl2黄绿色有毒气体，强氧化性：与H2、金属、水、碱等反应须分条件。氯水成分为混合物（Cl2、H2O、HCl、HClO等）。漂白看HClO。用途：消毒漂白等（了解）。易错：把干燥Cl2直接当成漂白；忽略可逆与歧化。',
    difficulty: 3,
    importance: 5,
  },
  'kp.Cl.prep': {
    name: '氯气的实验室制取',
    description:
      '实验室常用MnO2与浓盐酸加热：MnO2+4HCl(浓)=△=MnCl2+Cl2↑+2H2O。向上排空气法收集，NaOH吸收尾气。易错：用稀盐酸；忘记尾气处理；收集方法错误。',
    difficulty: 2,
    importance: 5,
  },
  'kp.S.oxide': {
    name: '硫的氧化物与硫酸',
    description:
      'S燃烧得SO2；SO2催化氧化得SO3；SO3与水得H2SO4。SO2：酸性氧化物、还原性、漂白（可恢复）。浓硫酸：吸水、脱水、强氧化（加热）；稀硫酸强酸通性。易错：混写浓稀硫酸与铜反应；混淆SO2与Cl2漂白。',
    difficulty: 3,
    importance: 5,
  },
  'kp.N.cycle': {
    name: '氮及其化合物转化',
    description:
      '重要转化：N2⇌NH3（合成氨条件了解）；NH3催化氧化→NO；NO→NO2；NO2与水→HNO3+NO；硝酸与铜因浓稀产物不同。氮氧化物与酸雨/污染了解。易错：NO与NO2颜色、转化条件混淆；浓稀硝酸方程式混用。',
    difficulty: 3,
    importance: 5,
  },
  'kp.N.ammonia': {
    name: '氨的性质与制取',
    description:
      'NH3刺激性、密度比空气小、极易溶于水显碱性。实验室：铵盐与碱共热。检验：湿润红色石蕊试纸变蓝；与HCl白烟。喷泉实验体现溶解性。易错：收集方法用错；忽视防倒吸。',
    difficulty: 2,
    importance: 5,
  },
  'kp.C.oxide': {
    name: '碳的氧化物',
    description:
      'CO：有毒、可燃、还原性，一般不使石灰水变浑浊。CO2：酸性氧化物，使石灰水变浑浊，一般不支持燃烧（镁例外）。碳燃烧产物随氧气是否充足为CO或CO2。易错：用石灰水检验CO；忽视CO毒性。',
    difficulty: 2,
    importance: 5,
  },
  'kp.Si.property': {
    name: '硅与二氧化硅',
    description:
      'Si是重要半导体材料（了解）。SiO2是原子晶体（了解表述）、酸性氧化物，与NaOH反应生成硅酸盐，故碱液腐蚀玻璃。粗硅可由SiO2与C高温制取（了解）。易错：认为SiO2与一般酸都反应；忽视玻璃腐蚀警示。',
    difficulty: 2,
    importance: 4,
  },
  'kp.nonmetal.test': {
    name: '常见气体检验方法',
    description:
      'H2：可燃，安静燃烧淡蓝火焰（验纯）。O2：带火星木条复燃。CO2：澄清石灰水变浑浊。Cl2：黄绿色；湿润淀粉KI试纸变蓝。NH3：湿润红色石蕊试纸变蓝；白烟。SO2：品红褪色加热恢复等。注意题设干扰与安全。易错：检验方法张冠李戴。',
    difficulty: 2,
    importance: 5,
  },
  'kp.S.conc_H2SO4': {
    name: '浓硫酸的特性',
    description:
      '浓硫酸三大特性：吸水性、脱水性、强氧化性（常需加热才显著表现氧化性，如与Cu、C）。稀硫酸主要表现为强酸通性，常温一般不氧化Cu。稀释：酸入水。易错：把稀硫酸当成强氧化性酸；稀释顺序颠倒。',
    difficulty: 3,
    importance: 5,
  },
  'kp.N.ammonium': {
    name: '铵盐的性质',
    description:
      '铵盐与碱共热放NH3；某些铵盐受热可分解（如NH4Cl受热分解为NH3和HCl，冷却又结合，了解）。铵根检验：加碱加热，湿润红色石蕊试纸变蓝。易错：不加热就写放氨；与硝酸盐性质混淆。',
    difficulty: 2,
    importance: 5,
  },
  'kp.halogen.compare': {
    name: '卤族元素性质比较',
    description:
      '卤族单质氧化性大致：F2>Cl2>Br2>I2；卤化氢稳定性大致HF>HCl>HBr>HI（以课本为准）。置换：Cl2可置换Br-、I-等（题设）。深度含氧酸体系标了解，不进默认核心。易错：递变顺序记反；把含氧酸深度当必修默认。',
    difficulty: 2,
    importance: 4,
    reviewExtra: '深度含氧酸了解;勿超纲默认训练',
  },
  'kp.N.synth_ammonia': {
    name: '合成氨反应条件与可逆性',
    description:
      'N2+3H2⇌2NH3（催化剂、高温、高压）。高一认识：需要条件、反应可逆、工业意义。不要写成选修化学平衡定量计算或勒夏特列深度训练默认题。挂接反应条rxn.N2_3H2。易错：写成常温即可大量合成；忽略可逆。',
    difficulty: 2,
    importance: 4,
    reviewExtra: '勿选修平衡定量默认训练',
  },
  'kp.Cl.bleach': {
    name: '氯水与漂白原理',
    description:
      '新制氯水含HClO而有漂白性；久置氯水HClO分解，漂白性减弱，主要剩盐酸。干燥Cl2通常无漂白性。与SO2漂白对比：HClO漂白不可逆（有色物质被氧化），SO2漂白加热可恢复。易错：认为Cl2分子直接漂白；混淆两种漂白。',
    difficulty: 3,
    importance: 5,
  },
}

const inv = JSON.parse(
  fs.readFileSync(path.join(dir, '..', 'chemistry_kb_inventory.json'), 'utf8'),
)
const b4 = inv.batches.find((b) => b.id === 'batch4')
const missing = []
for (const it of b4.items) {
  if (it.type === 'substance' && !SUBSTANCES[it.code]) missing.push(it.code)
  if (it.type === 'reaction' && !REACTIONS[it.code]) missing.push(it.code)
  if (it.type === 'experiment' && !EXPERIMENTS[it.code]) missing.push(it.code)
  if (it.type === 'knowledge' && !KNOWLEDGE[it.code]) missing.push(it.code)
}
if (missing.length) {
  console.error('MISSING', missing)
  process.exit(1)
}

const out = `/**
 * Batch4 content (非金属化学) — auto-assembled. pending_review on import.
 * AI/脚本检查 ≠ 人工审核。
 */
'use strict'

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

const SUBSTANCES = ${JSON.stringify(SUBSTANCES, null, 2)}

const REACTIONS = ${JSON.stringify(REACTIONS, null, 2)}

const EXPERIMENTS = ${JSON.stringify(EXPERIMENTS, null, 2)}

const KNOWLEDGE = ${JSON.stringify(KNOWLEDGE, null, 2)}

const CONCEPTS = {}

module.exports = { SUBSTANCES, REACTIONS, EXPERIMENTS, KNOWLEDGE, CONCEPTS, sp }
`

fs.writeFileSync(path.join(dir, 'batch4_content.js'), out, 'utf8')
console.log(
  JSON.stringify(
    {
      substances: Object.keys(SUBSTANCES).length,
      reactions: Object.keys(REACTIONS).length,
      experiments: Object.keys(EXPERIMENTS).length,
      knowledge: Object.keys(KNOWLEDGE).length,
      total:
        Object.keys(SUBSTANCES).length +
        Object.keys(REACTIONS).length +
        Object.keys(EXPERIMENTS).length +
        Object.keys(KNOWLEDGE).length,
      missing: 0,
    },
    null,
    2,
  ),
)
