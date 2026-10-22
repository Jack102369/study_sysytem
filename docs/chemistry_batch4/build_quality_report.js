/**
 * Build CHEMISTRY_BATCH4_QUALITY_REPORT.md — audit only, no DB writes.
 */
const fs = require('fs')
const path = require('path')
const extract = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'quality_extract.json'), 'utf8'),
)

/** @type {Record<string,{v:string,s:string,issue:string,fix:string,h:boolean,scope:string,train:string}>} */
const A = {}

function set(code, o) {
  A[code] = o
}

// --- substances (28) ---
set('sub.Cl2', {
  v: '通过',
  s: 'P3',
  issue: '性质与安全准确；碱反应仅写NaOH式，未点明与石灰乳/漂白粉链路及热浓碱另一产物',
  fix: '补一句：冷稀碱→次氯酸盐；热浓碱另有产物勿混用；关联漂白粉条',
  h: false,
  scope: '高一必修核心',
  train: '可训；碱反应题必须给温度/浓度条件',
})
set('sub.HCl', {
  v: '通过',
  s: '—',
  issue: '气体HCl与盐酸区分清楚',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('sub.HCl_aq', {
  v: '通过',
  s: 'P3',
  issue: 'canonicalFormula写作HCl(aq)略非常规；AgNO3检Cl-已提但干扰排除可更完整',
  fix: '可改为HCl并注明水溶液；补硝酸酸化排除干扰要点',
  h: false,
  scope: '高一必修核心',
  train: '可训强酸通性与Cl-检验（建议补干扰排除后出严谨题）',
})
set('sub.HClO', {
  v: '通过',
  s: '—',
  issue: '弱酸、漂白、见光分解与避光保存正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训漂白与稳定性',
})
set('sub.NaClO', {
  v: '通过',
  s: 'P3',
  issue: '漂白实质与HClO相关已注明了解',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训；加酸放Cl2仅演示/题设',
})
set('sub.S', {
  v: '通过',
  s: '—',
  issue: '淡黄色、燃烧生成SO2正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('sub.SO2', {
  v: '通过',
  s: '—',
  issue: '酸性氧化物、还原性、漂白可恢复、与HClO对比正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训鉴别与漂白对比；KMnO4标了解',
})
set('sub.SO3', {
  v: '通过',
  s: 'P3',
  issue: '与水生成硫酸正确；工业了解已标',
  fix: '—',
  h: false,
  scope: '高一必修核心（工业了解）',
  train: '可训方程式；勿深工业细节',
})
set('sub.H2SO4', {
  v: '通过',
  s: '—',
  issue: '浓稀区分、三大特性、稀释顺序正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训；浓稀必须分条件',
})
set('sub.H2SO3', {
  v: '通过',
  s: '—',
  issue: 'SO2水溶液认识正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('sub.N2', {
  v: '通过',
  s: '—',
  issue: '稳定与合成氨条件了解正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训稳定性；合成氨挂接了解级',
})
set('sub.NH3', {
  v: '通过',
  s: '—',
  issue: '溶解性、碱性、与酸、催化氧化了解正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('sub.NO', {
  v: '通过',
  s: '—',
  issue: '遇O2变红棕链条正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训现象链',
})
set('sub.NO2', {
  v: '通过',
  s: '—',
  issue: '歧化与水反应正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('sub.HNO3', {
  v: '通过',
  s: '—',
  issue: '浓稀与Cu产物分写正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训；必须标明浓/稀',
})
set('sub.C', {
  v: '通过',
  s: '—',
  issue: '完全/不完全燃烧条件正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('sub.CO', {
  v: '通过',
  s: '—',
  issue: '毒性、还原性、不使石灰水变浑浊正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训；禁学生制取实验题',
})
set('sub.Si', {
  v: '通过',
  s: 'P3',
  issue: 'HF相关已标了解勿展开',
  fix: '—',
  h: false,
  scope: '高一必修核心/了解',
  train: '材料认识为主；禁HF学生实验',
})
set('sub.SiO2', {
  v: '通过',
  s: 'P3',
  issue: '酸性氧化物与NaOH、腐蚀玻璃正确；HF除外了解',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训；勿等同CO2全部类比',
})
set('sub.Na2SiO3', {
  v: '通过',
  s: '—',
  issue: '碱性与硅酸沉淀了解正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('sub.P', {
  v: '待核实',
  s: 'P2',
  issue: '同素异形体对比与自燃条件“以课本为准”；白磷安全正确但细节待对教材',
  fix: '对照所用教材统一白磷/红磷对比表述',
  h: true,
  scope: '高一了解/必修对比',
  train: '核实前勿出细对比绝对题；白磷禁操作题',
})
set('sub.P4O10', {
  v: '待核实',
  s: 'P2',
  issue: 'P4O10与P2O5教材写法口径待统一',
  fix: '按课本选定主写法，另一写法标了解',
  h: true,
  scope: '高一必修核心',
  train: '题干须指定写法',
})
set('sub.H2S', {
  v: '通过',
  s: 'P3',
  issue: '剧毒安全到位；还原性了解',
  fix: '—',
  h: false,
  scope: '高一了解/必修安全',
  train: '禁大量制取实验题',
})
set('sub.CaCO3', {
  v: '通过',
  s: '—',
  issue: '与酸放CO2正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('sub.CaOH2', {
  v: '通过',
  s: '—',
  issue: '澄清石灰水与过量CO2分支正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训；过量须题干说明',
})
set('sub.Br2', {
  v: '通过',
  s: 'P2',
  issue: '递变正确；已禁溴含氧酸深度',
  fix: '默认训练限单质递变与颜色',
  h: false,
  scope: '高一必修核心（深度了解禁）',
  train: '排除含氧酸深度默认题',
})
set('sub.I2', {
  v: '通过',
  s: 'P2',
  issue: '淀粉变蓝正确；+5/+7已排除默认核心',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训淀粉检验；正价勿默认',
})
set('sub.bleaching_powder', {
  v: '待核实',
  s: 'P1',
  issue: '混合物/有效成分Ca(ClO)2等精确表述待对教材；工业组成与教材简化可能差异',
  fix: '按所用教材写主要成分与有效成分，并保留混合物说明',
  h: true,
  scope: '高一必修了解',
  train: '核实前禁止考精确组成绝对填空；可了解级认知',
})

// --- reactions (25) ---
set('rxn.H2_Cl2', {
  v: '通过',
  s: 'P3',
  issue: '条件光照/点燃与安全正确；化合产物同为HCl',
  fix: '训练注明化合反应ox/re产物可同',
  h: false,
  scope: '高一必修核心',
  train: '可训方程式；光照实验高危勿学生操作题',
})
set('rxn.2Na_Cl2', {
  v: '通过',
  s: '—',
  issue: '点燃生成NaCl正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('rxn.2Fe_3Cl2', {
  v: '通过',
  s: '—',
  issue: '生成FeCl3非FeCl2正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训易错点',
})
set('rxn.Cl2_H2O', {
  v: '通过',
  s: '—',
  issue: '可逆、歧化ox/re产物HClO/HCl正确；氯水混合物表述正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训歧化与可逆；勿写成不可逆唯一',
})
set('rxn.Cl2_2NaOH', {
  v: '通过',
  s: 'P1',
  issue: '冷稀碱歧化式正确且已限定；但未在正文显式写出“热浓碱产物不同、禁止混用”完整对照句（易被无条件组卷）',
  fix: 'conditions增补：热的浓碱另有反应（如生成氯酸盐），不得套用本式',
  h: false,
  scope: '高一必修核心',
  train: '自动出题必须带冷/稀条件；禁无条件碱反应填空',
})
set('rxn.MnO2_4HCl', {
  v: '通过',
  s: '—',
  issue: '浓盐酸加热、离子式与ox/re正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训；强调浓与加热',
})
set('rxn.S_O2', {
  v: '通过',
  s: '—',
  issue: '点燃生成SO2正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('rxn.2SO2_O2', {
  v: '通过',
  s: 'P2',
  issue: '催化氧化正确；已标了解勿选修定量',
  fix: '—',
  h: false,
  scope: '高一必修了解',
  train: '可记方程式；禁平衡定量默认题',
})
set('rxn.SO3_H2O', {
  v: '需要修改',
  s: 'P2',
  issue: '化学正确且非氧化还原字段已空，但清单/关联specialty含redox，易被错误纳入氧化还原专项自动组卷',
  fix: '去掉specialty中的redox，改为acid-base/non-redox类',
  h: false,
  scope: '高一必修核心',
  train: '内容可训方程式；修复关联前勿进redox池',
})
set('rxn.Cu_2H2SO4', {
  v: '通过',
  s: '—',
  issue: '浓硫酸加热、ox/re=SO2/CuSO4正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训；必须标注浓+加热',
})
set('rxn.C_2H2SO4', {
  v: '通过',
  s: '—',
  issue: '浓硫酸加热、ox/re正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('rxn.N2_3H2', {
  v: '通过',
  s: 'P2',
  issue: '条件与可逆已限制选修深度',
  fix: '—',
  h: false,
  scope: '高一必修了解',
  train: '条件认识可训；禁勒夏特列定量默认',
})
set('rxn.NH3_HCl', {
  v: '需要修改',
  s: 'P2',
  issue: '非氧化还原正确，但specialty含redox，专项关联错误',
  fix: '移除redox专项标签',
  h: false,
  scope: '高一必修核心',
  train: '可训白烟/方程式；修复前勿进redox池',
})
set('rxn.4NH3_5O2', {
  v: '通过',
  s: 'P3',
  issue: '催化氧化ox/re正确；工业了解',
  fix: '—',
  h: false,
  scope: '高一必修了解',
  train: '可训方程式；勿深工艺',
})
set('rxn.2NO_O2', {
  v: '通过',
  s: '—',
  issue: '常温迅速、现象正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('rxn.3NO2_H2O', {
  v: '通过',
  s: '—',
  issue: '歧化ox/re=HNO3/NO正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训歧化',
})
set('rxn.Cu_4HNO3', {
  v: '通过',
  s: 'P3',
  issue: '稀硝酸计量式正确；编码名Cu_4HNO3与实际3Cu+8HNO3易混淆',
  fix: '整改时可改展示名/备注强调稀硝酸计量',
  h: false,
  scope: '高一必修核心',
  train: '可训；题干必须写稀硝酸',
})
set('rxn.Cu_4HNO3c', {
  v: '通过',
  s: '—',
  issue: '浓硝酸式与ox/re正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训；必须写浓',
})
set('rxn.C_O2_incomplete', {
  v: '通过',
  s: '—',
  issue: '氧气不足条件明确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训；条件必给',
})
set('rxn.C_O2_complete', {
  v: '通过',
  s: '—',
  issue: '氧气充足条件明确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('rxn.CO2_CaOH2', {
  v: '需要修改',
  s: 'P2',
  issue: '非氧化还原正确，specialty误含redox',
  fix: '移除redox标签',
  h: false,
  scope: '高一必修核心',
  train: '可训检验；过量变清须另条件',
})
set('rxn.SiO2_2NaOH', {
  v: '需要修改',
  s: 'P2',
  issue: '化学正确；specialty误含redox',
  fix: '移除redox标签',
  h: false,
  scope: '高一必修核心',
  train: '可训；强调碱腐蚀玻璃',
})
set('rxn.SiO2_2C', {
  v: '通过',
  s: 'P3',
  issue: '高温制粗硅ox/re正确；了解级',
  fix: '—',
  h: false,
  scope: '高一了解',
  train: '可记方程式',
})
set('rxn.CaCO3_2HCl', {
  v: '需要修改',
  s: 'P2',
  issue: '非氧化还原正确；specialty误含redox',
  fix: '移除redox标签',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('rxn.NH4Cl_NaOH', {
  v: '通过',
  s: '—',
  issue: '加热放氨、非氧化还原正确；specialty无错误redox',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训；条件加热',
})

// --- experiments (8) ---
set('exp.Cl2_prep', {
  v: '通过',
  s: '—',
  issue: '制取、收集、尾气与安全完整',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训流程与安全；禁家用操作题',
})
set('exp.Cl2_property', {
  v: '通过',
  s: 'P3',
  issue: '干燥/湿润布条对比正确；教师演示定位正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '现象题可训；禁学生自行操作Cl2',
})
set('exp.HCl_prep', {
  v: '通过',
  s: 'P3',
  issue: '条目综合制取了解+白烟+盐酸通性，边界略宽但已标按教材选取',
  fix: '整改时可拆主题或明确本条主考白烟/盐酸',
  h: false,
  scope: '高一必修核心',
  train: '可训白烟与酸性；制取细节了解',
})
set('exp.SO2_property', {
  v: '通过',
  s: '—',
  issue: '漂白可恢复与还原性、安全区分清楚',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训；KMnO4步骤了解',
})
set('exp.NH3_prep', {
  v: '通过',
  s: '—',
  issue: '制取、收集、检验、喷泉正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('exp.HNO3_Cu', {
  v: '通过',
  s: '—',
  issue: '浓稀对比与安全到位',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训现象对比；禁学生擅自操作',
})
set('exp.CO2_property', {
  v: '通过',
  s: '—',
  issue: '检验与不支持燃烧及镁例外正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('exp.SiO2_glass', {
  v: '通过',
  s: 'P3',
  issue: '以讲解警示为主合理；非传统动手实验',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '适合安全认知题；勿当气体实验流程题',
})

// --- knowledge (13) ---
set('kp.Cl.property', {
  v: '通过',
  s: '—',
  issue: '氯水成分、漂白实质、分条件正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('kp.Cl.prep', {
  v: '通过',
  s: '—',
  issue: '制取要点正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('kp.S.oxide', {
  v: '通过',
  s: '—',
  issue: '转化与漂白对比、浓稀硫酸正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('kp.N.cycle', {
  v: '通过',
  s: '—',
  issue: '转化链与浓稀硝酸警示正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训推断',
})
set('kp.N.ammonia', {
  v: '通过',
  s: '—',
  issue: '性质制取检验正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('kp.C.oxide', {
  v: '通过',
  s: '—',
  issue: 'CO/CO2对比正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('kp.Si.property', {
  v: '通过',
  s: '—',
  issue: 'SiO2与CO2不可简单等同已通过易错点体现',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('kp.nonmetal.test', {
  v: '通过',
  s: 'P3',
  issue: '常见气体检验汇总正确；Cl-盐溶液检验未单列（清单未要求）',
  fix: '可选补Cl-检验关联到盐酸条',
  h: false,
  scope: '高一必修核心',
  train: '可训记忆',
})
set('kp.S.conc_H2SO4', {
  v: '通过',
  s: '—',
  issue: '三大特性与稀硫酸对比正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('kp.N.ammonium', {
  v: '通过',
  s: '—',
  issue: '与碱共热、铵根检验正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('kp.halogen.compare', {
  v: '通过',
  s: 'P2',
  issue: '递变正确；含氧酸深度已排除；F2等以课本为准',
  fix: '默认训练限必修递变',
  h: false,
  scope: '高一必修核心（深度了解禁）',
  train: '排除含氧酸深度与超纲定量',
})
set('kp.N.synth_ammonia', {
  v: '通过',
  s: 'P2',
  issue: '已明确勿选修平衡定量',
  fix: '—',
  h: false,
  scope: '高一必修了解',
  train: '条件/可逆认知可训；禁选修计算默认',
})
set('kp.Cl.bleach', {
  v: '通过',
  s: '—',
  issue: '新制/久置氯水、与SO2漂白对比正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})

const missing = extract.items.filter((i) => !A[i.code]).map((i) => i.code)
if (missing.length) {
  console.error('MISSING', missing)
  process.exit(1)
}

const counts = { 通过: 0, 需要修改: 0, 待核实: 0 }
const sevItems = { P0: 0, P1: 0, P2: 0, P3: 0, none: 0 }
const human = []
const modifyCodes = []
const verifyCodes = []
const p0 = []
const p1 = []
const p2 = []
const p3 = []

for (const it of extract.items) {
  const a = A[it.code]
  counts[a.v]++
  if (!a.s || a.s === '—') sevItems.none++
  else {
    sevItems[a.s]++
    if (a.s === 'P0') p0.push(it.code)
    if (a.s === 'P1') p1.push(it.code)
    if (a.s === 'P2') p2.push(it.code)
    if (a.s === 'P3') p3.push(it.code)
  }
  if (a.h || a.v === '待核实') human.push(it.code)
  if (a.v === '需要修改') modifyCodes.push(it.code)
  if (a.v === '待核实') verifyCodes.push(it.code)
}

const sum = counts['通过'] + counts['需要修改'] + counts['待核实']
if (sum !== 74) {
  console.error('verdict sum', sum)
  process.exit(1)
}

let md = ''
md += '# 高一化学知识库 · Batch4 质量审查报告\n\n'
md +=
  '> 审查对象：`batch4` **74** 条非金属化学知识（全部新导入 `pending_review`）  \n'
md +=
  '> 依据：`CHEMISTRY_QUALITY_STANDARD.md`、`CHEMISTRY_BATCH4_REPORT.md`、导入包与 DB 核对  \n'
md += '> 审查日期：2026-10-18  \n'
md +=
  '> **本报告为 AI 辅助专项质量审查，不是人工学科审核。** 通过 ≠ 已经人工审核。  \n'
md += '> **本次只读审查，未修改知识正文/导入JSON/数据库。**\n\n'
md += '---\n\n'
md += '## 0. 总览\n\n'
md += '### 0.1 逐条审查结论（互斥，合计=74）\n\n'
md += '| 结论 | 数量 |\n|------|------|\n'
md += `| 通过（自动检查通过） | **${counts['通过']}** |\n`
md += `| 需要修改 | **${counts['需要修改']}** |\n`
md += `| 待核实（待教材核实） | **${counts['待核实']}** |\n`
md += `| **合计** | **${sum}** |\n\n`

md += '### 0.2 问题严重度（按条目主等级统计，可与上表交叉）\n\n'
md +=
  '> 说明：下表统计的是**知识条数**（每条取一个主等级）；“—”视为无等级。\n\n'
md += '| 级别 | 知识条数 | 含义 |\n|------|----------|------|\n'
md += `| **P0** | **${sevItems.P0}** | 严重科学性错误 |\n`
md += `| **P1** | **${sevItems.P1}** | 重要错误/条件缺失/范围或训练高风险 |\n`
md += `| **P2** | **${sevItems.P2}** | 关联不严谨、范围/训练歧义 |\n`
md += `| **P3** | **${sevItems.P3}** | 表述/编码/展示优化 |\n`
md += `| 无等级 | ${sevItems.none} | |\n\n`

md += '### 0.3 发布与整改判断\n\n'
md += `| 问题 | 结论 |\n|------|------|\n`
md += `| 是否存在严重化学错误（P0） | **否** |\n`
md += `| 是否存在超纲知识（整条未标记混入） | **否**（了解/禁默认项已有标记；专项误挂需改） |\n`
md += `| 是否阻止正式发布 | **是**（pending_review + 需改/待核实 + 非人审） |\n`
md += `| 是否可进入质量整改 | **是** |\n\n`

md += '### 0.4 数据库只读核对\n\n'
md +=
  '- 74 条均存在、无编码遗漏；均为 `pending_review`。  \n'
md += '- 未见未审核直接 published。  \n'
md += '- 未发现本审查改写 Batch2/Batch3（只读）。  \n'
md += '- 5 条非氧化还原反应在清单 specialty 中误挂 `redox`（见下）。  \n\n'

md += '---\n\n'

const typeOrder = ['substance', 'reaction', 'experiment', 'knowledge']
const typeTitle = {
  substance: '物质',
  reaction: '反应',
  experiment: '实验',
  knowledge: '知识点',
}

for (const type of typeOrder) {
  const items = extract.items.filter((i) => i.type === type)
  md += `## ${typeTitle[type]}（${items.length}）逐条结果\n\n`
  md +=
    '| 编码 | 名称 | 结论 | 等级 | 问题说明 | 修正建议 | 人工核实 | 范围 | 训练建议 |\n'
  md +=
    '|------|------|------|------|----------|----------|----------|------|----------|\n'
  for (const it of items) {
    const a = A[it.code]
    md += `| \`${it.code}\` | ${it.inventoryName} | ${a.v} | ${a.s} | ${a.issue} | ${a.fix} | ${
      a.h || a.v === '待核实' ? '是' : '否'
    } | ${a.scope} | ${a.train} |\n`
  }
  md += '\n'
}

md += '## 化学科学性问题清单\n\n'
md +=
  '- **P0：无。** 未发现明确教错学生的方程式配平/氧化还原对调等事实错误。  \n'
md +=
  '- 歧化反应（Cl2+H2O、Cl2+NaOH、NO2+H2O）ox/re 字段总体正确。  \n'
md +=
  '- 浓/稀硝酸、浓硫酸与Cu/C、碳完全/不完全燃烧等条件区分总体正确。  \n\n'

md += '## 反应条件问题清单\n\n'
md +=
  '| 编码 | 说明 |\n|------|------|\n'
md +=
  '| `rxn.Cl2_2NaOH` | 已写冷稀碱，建议显式禁套热浓碱（P1训练风险） |\n'
md +=
  '| `rxn.Cu_2H2SO4` / `C_2H2SO4` / 硝酸两条 | 条件已有，组卷必须带出 |\n'
md +=
  '| `rxn.C_O2_*` | 氧气是否充足必须入题 |\n'
md +=
  '| `rxn.CO2_CaOH2` | 过量变清须另条件 |\n\n'

md += '## 实验与安全问题清单\n\n'
md +=
  '- Cl2/SO2/HNO3/NH3 等相关实验均有有毒/禁止家用说明，**适宜教师演示，不适宜学生自行操作自动题**。  \n'
md +=
  '- 白磷、H2S、CO 安全警示到位。  \n'
md +=
  '- 清单**未收录** SiO2+HF 反应条：审查中确认不得设计学生 HF 实验（物质条已提示了解勿展开）。  \n'
md +=
  '- 清单**未收录**独立 Cl2+Ca(OH)2 反应条：漂白粉链路依赖物质描述，待核实组成。  \n\n'

md += '## 教材范围争议 / 待核实清单\n\n'
md += verifyCodes.map((c) => `- \`${c}\`：${A[c].issue}`).join('\n') + '\n\n'
md +=
  '另：卤族含氧酸深度、合成氨选修平衡、酸性KMnO4 检验等已在正文标了解/排除默认。  \n'
md +=
  '**说明：本环境未逐页打开人教版纸质教材核对页码；争议项标记待核实，不虚构页码与课标原文。**\n\n'

md += '## 专项关联错误（需修改）\n\n'
md +=
  '下列反应**内容层已正确置空氧化剂/还原剂**，但 inventory specialty 含 `redox`，会导致错误进入氧化还原专项：\n\n'
for (const c of modifyCodes) {
  md += `- \`${c}\`\n`
}
md += '\n'

md += '## 自动出题风险清单\n\n'
md +=
  '| 编码/主题 | 风险 | 建议限制 |\n|------|------|----------|\n'
md +=
  '| Cl2与碱 | 冷稀 vs 热浓产物不同 | 必须给条件；禁无条件填空 |\n'
md +=
  '| 漂白粉组成 | 教材简化 vs 工业 | 待核实前禁精确组成绝对题 |\n'
md +=
  '| P4O10/P2O5 | 写法口径 | 题干指定写法 |\n'
md +=
  '| 合成氨/SO2催化氧化 | 选修平衡 | 禁定量平衡默认题 |\n'
md +=
  '| 浓稀硝酸/硫酸 | 多答案 | 必须标明浓稀与是否加热 |\n'
md +=
  '| 非氧化还原误挂redox | 专项错池 | 整改关联前勿进redox自动卷 |\n'
md +=
  '| Cl2/氮氧化物实验 | 安全 | 禁学生操作类自动题 |\n'
md +=
  '| SO2 vs HClO漂白 | 易混 | 对比题须写清可逆/不可逆 |\n'
md +=
  '| CO2过量石灰水 | 两步产物 | 适量/过量分题 |\n\n'

md += '## 推荐修复方案（待下一步整改任务执行）\n\n'
md +=
  '1. **优先**：从 5 条非氧化还原反应的 specialty 中移除 `redox`。  \n'
md +=
  '2. **P1**：`rxn.Cl2_2NaOH` 补热浓碱禁止混用说明；`sub.bleaching_powder` 对教材定成分表述。  \n'
md +=
  '3. **待核实**：P4O10/P2O5、白磷对比细节按课本统一。  \n'
md +=
  '4. **训练策略**：危险气体实验、HF、白磷等只保留认知/方程式，不生成操作步骤题。  \n'
md +=
  '5. **不要删除**有争议但科学正确的了解级知识，用范围标记与出题限制处理。  \n\n'

md += '## 审查局限性\n\n'
md +=
  '1. AI 辅助审查，非教师人工终审。  \n'
md +=
  '2. 未逐页核对具体教材版本页码。  \n'
md +=
  '3. 基础自动检查（建设期）已通过，不能替代本报告；本报告也不能替代人工审核。  \n'
md +=
  '4. 清单外知识点（如独立 HF 反应、Cl2+石灰乳方程式条）仅作覆盖备注，未增删编码。  \n\n'

md += '---\n\n'
md += '**停止：未改数据、未进 Batch5、未开发训练功能。等待质量整改指令。**\n'

fs.writeFileSync(
  path.join(__dirname, '..', 'CHEMISTRY_BATCH4_QUALITY_REPORT.md'),
  md,
  'utf8',
)
fs.writeFileSync(
  path.join(__dirname, 'quality_audit_map.json'),
  JSON.stringify(A, null, 2),
)

console.log(
  JSON.stringify(
    {
      counts,
      sevItems,
      modifyCodes,
      verifyCodes,
      p0: p0.length,
      p1: p1.length,
      p2: p2.length,
      p3: p3.length,
      blocking: true,
      canRemediate: true,
    },
    null,
    2,
  ),
)
