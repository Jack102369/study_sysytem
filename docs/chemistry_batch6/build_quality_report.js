/**
 * Build Batch6 quality audit map + CHEMISTRY_BATCH6_QUALITY_REPORT.md
 * Read-only; does not modify DB.
 */
'use strict'
const fs = require('fs')
const path = require('path')

const dir = __dirname
const ROOT = path.resolve(__dirname, '../..')
const extract = JSON.parse(
  fs.readFileSync(path.join(dir, 'quality_extract.json'), 'utf8'),
)
const inv = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'docs/chemistry_kb_inventory.json'), 'utf8'),
)
const b6 = inv.batches.find((b) => b.id === 'batch6')

/** @type {Record<string, {verdict:string, severity:string|null, issues:string[], fix:string, verify:boolean, scope:string, train:string, topic?:string[]}>} */
const AUDIT = {}

function set(code, o) {
  AUDIT[code] = o
}

// ---- substances (9) ----
set('sub.CH4', {
  verdict: '通过',
  severity: 'P3',
  issues: ['正四面体与多种氯代产物表述正确；未见唯一产物误导'],
  fix: '—',
  verify: false,
  scope: '必修核心',
  train: '可训结构/取代产物多样性；禁唯一氯代物自动题',
  topic: ['organic'],
})
set('sub.C2H4', {
  verdict: '通过',
  severity: 'P3',
  issues: ['CH2=CH2与加成/KMnO4不指定唯一氧化产物正确'],
  fix: '—',
  verify: false,
  scope: '必修核心',
  train: '可训加成与褪色鉴别；禁指定唯一氧化产物',
  topic: ['organic'],
})
set('sub.C2H6', {
  verdict: '通过',
  severity: null,
  issues: [],
  fix: '—',
  verify: false,
  scope: '必修核心',
  train: '可训与乙烯对比',
  topic: ['organic'],
})
set('sub.C2H5OH', {
  verdict: '通过',
  severity: 'P3',
  issues: ['羟基、催化氧化条件与酯化要点正确'],
  fix: '—',
  verify: false,
  scope: '必修核心',
  train: '可训；催化氧化须写Cu/Ag+加热',
  topic: ['organic'],
})
set('sub.CH3COOH', {
  verdict: '通过',
  severity: null,
  issues: [],
  fix: '—',
  verify: false,
  scope: '必修核心',
  train: '可训弱酸通性与强于碳酸',
  topic: ['organic'],
})
set('sub.CH3COOCH2CH3', {
  verdict: '通过',
  severity: 'P3',
  issues: ['两种结构简式写法已注明；水解深度已限'],
  fix: '—',
  verify: false,
  scope: '必修核心',
  train: '可训酯化产物认知；勿默认复杂水解机理',
  topic: ['organic'],
})
set('sub.C2H2', {
  verdict: '通过',
  severity: 'P2',
  issues: ['已标必修了解/待核实深度；内容方向正确但默认训练边界需严格限制'],
  fix: '默认池排除深度炔烃；仅了解级结构与不饱和性对比',
  verify: false,
  scope: '必修了解',
  train: '限了解；勿默认复杂加成/推断',
  topic: ['organic', 'scope'],
})
set('sub.C3H8', {
  verdict: '通过',
  severity: 'P3',
  issues: ['作同系物示例合理；非独立核心物质考点'],
  fix: '—',
  verify: false,
  scope: '必修了解/同系物示例',
  train: '宜作通式/同系物例，勿单独深挖',
  topic: ['organic', 'scope'],
})
set('sub.C6H6', {
  verdict: '通过',
  severity: 'P2',
  issues: [
    '未用错误单双键交替解释化学性质；稳定性与褪色对比正确；已标勿默认芳香取代',
  ],
  fix: '保持了解级；禁止Kekulé性质误导题',
  verify: false,
  scope: '必修了解',
  train: '限结构稳定性与烯烃对比；禁选修芳香取代默认',
  topic: ['organic', 'scope'],
})

// ---- reactions (10) ----
const RXN_CAT_ISSUE =
  '清单categoryCodes机械挂 organic.substitution+addition+esterification，与反应类型不符，易误入错误二级分类题池'

set('rxn.CH4_Cl2', {
  verdict: '需要修改',
  severity: 'P2',
  issues: [
    '科学内容：光照、多种氯代产物说明正确，canonical仅第一步示例可接受',
    RXN_CAT_ISSUE,
  ],
  fix: '整改时收窄category为organic.substitution（及equation相关）；species保持示例并继续禁唯一产物判题',
  verify: false,
  scope: '必修核心',
  train: '修关联前勿按加成/酯化池抽题；内容可训取代多样性',
  topic: ['organic', 'link'],
})
set('rxn.C2H4_Br2', {
  verdict: '需要修改',
  severity: 'P2',
  issues: ['加成方程式与常温条件正确', RXN_CAT_ISSUE],
  fix: 'category改为organic.addition为主',
  verify: false,
  scope: '必修核心',
  train: '修关联前勿入取代/酯化池',
  topic: ['organic', 'link'],
})
set('rxn.C2H4_H2O', {
  verdict: '需要修改',
  severity: 'P2',
  issues: [
    '水化条件写催化剂+加热加压，磷酸“以教材为准”合理',
    RXN_CAT_ISSUE,
  ],
  fix: 'category改为addition；催化剂名称命题时跟教材',
  verify: false,
  scope: '必修核心',
  train: '可训条件认知；修关联',
  topic: ['organic', 'link'],
})
set('rxn.C2H4_H2', {
  verdict: '需要修改',
  severity: 'P2',
  issues: ['加氢条件与产物正确', RXN_CAT_ISSUE],
  fix: 'category改为organic.addition',
  verify: false,
  scope: '必修核心',
  train: '修关联后可训',
  topic: ['organic', 'link'],
})
set('rxn.C2H5OH_O2', {
  verdict: '需要修改',
  severity: 'P0',
  issues: [
    'P0：ox_product/re_product对调。按高中口径：氧化产物应为CH3CHO（还原剂被氧化所得），还原产物应为H2O（氧化剂被还原所得）；现为ox=H2O、re=CH3CHO',
    '条件Cu/Ag+加热正确；方程式配平正确',
    RXN_CAT_ISSUE,
  ],
  fix: '对调ox_product与re_product；category改为oxidation/redox相关；禁用错误字段自动判氧化还原产物',
  verify: false,
  scope: '必修核心',
  train: '整改前禁止氧化还原产物自动判题',
  topic: ['organic', 'redox'],
})
set('rxn.C2H5OH_burn', {
  verdict: '需要修改',
  severity: 'P0',
  issues: [
    'P0：ox_product/re_product对调。氧化产物应侧重CO2（还原剂被氧化），还原产物应为H2O；现为ox=H2O、re=CO2',
    '燃烧配平与点燃条件正确',
    RXN_CAT_ISSUE,
  ],
  fix: '对调ox/re产物字段；category勿挂取代/加成/酯化',
  verify: false,
  scope: '必修核心',
  train: '整改前禁止依ox/re字段自动判题',
  topic: ['organic', 'redox'],
})
set('rxn.esterification', {
  verdict: '需要修改',
  severity: 'P2',
  issues: [
    '⇌、浓硫酸催化加热、产物正确；可逆性明确',
    RXN_CAT_ISSUE + '（虽含esterification，但同时误挂substitution/addition）',
  ],
  fix: '仅保留organic.esterification等正确分类',
  verify: false,
  scope: '必修核心',
  train: '内容可训酯化；修关联',
  topic: ['organic', 'link'],
})
set('rxn.CH3COOH_NaOH', {
  verdict: '需要修改',
  severity: 'P2',
  issues: ['中和与离子方程式正确（弱酸保留分子）', RXN_CAT_ISSUE],
  fix: '改为酸碱/离子反应相关分类，去掉有机三类机械挂靠',
  verify: false,
  scope: '必修核心',
  train: '修关联后可训',
  topic: ['organic', 'link'],
})
set('rxn.CH3COOH_Na2CO3', {
  verdict: '需要修改',
  severity: 'P2',
  issues: [
    '配平与酸性强于碳酸正确；离子式写“CO3 2-”不规范（应为CO3^2-）属表达',
    RXN_CAT_ISSUE,
  ],
  fix: '规范离子电荷写法；收窄category',
  verify: false,
  scope: '必修核心',
  train: '修关联与符号后可训',
  topic: ['organic', 'link'],
})
set('rxn.C2H4_KMnO4', {
  verdict: '需要修改',
  severity: 'P2',
  issues: [
    '不指定唯一氧化产物正确，适合现象题',
    'ox_product与re_product均写成“氧化产物(条件依赖)”，还原产物字段命名错误，自动判题易混',
  ],
  fix: 're_product改为“还原产物(条件依赖，不指定)”或留空并注明仅现象训练；禁产物填空自动题',
  verify: false,
  scope: '必修核心（现象）',
  train: '仅现象/不饱和性判断；禁唯一产物与复杂离子方程式默认',
  topic: ['organic', 'auto'],
})

// ---- experiments (7) ----
set('exp.CH4_property', {
  verdict: '通过',
  severity: 'P3',
  issues: ['书面定位与多氯代、Cl2安全提示正确'],
  fix: '—',
  verify: false,
  scope: '必修核心',
  train: '可训现象/安全判断；禁动手',
  topic: ['experiment'],
})
set('exp.C2H4_prep', {
  verdict: '通过',
  severity: 'P3',
  issues: ['约170℃、浓硫酸、副产物了解提示正确；书面高危标注到位'],
  fix: '—',
  verify: false,
  scope: '必修核心',
  train: '可训装置与温度；禁动手',
  topic: ['experiment'],
})
set('exp.C2H4_Br2', {
  verdict: '通过',
  severity: null,
  issues: [],
  fix: '—',
  verify: false,
  scope: '必修核心',
  train: '可训褪色与加成判断',
  topic: ['experiment'],
})
set('exp.ethanol_oxid', {
  verdict: '通过',
  severity: 'P3',
  issues: ['Cu丝颜色循环与条件正确'],
  fix: '—',
  verify: false,
  scope: '必修核心',
  train: '可训条件与现象；禁动手',
  topic: ['experiment'],
})
set('exp.esterification', {
  verdict: '通过',
  severity: 'P3',
  issues: ['饱和Na2CO3作用与防倒吸要点正确'],
  fix: '—',
  verify: false,
  scope: '必修核心',
  train: '可训装置评价；禁动手',
  topic: ['experiment'],
})
set('exp.acetic_acid', {
  verdict: '通过',
  severity: null,
  issues: [],
  fix: '—',
  verify: false,
  scope: '必修核心',
  train: '可训酸性验证书面分析',
  topic: ['experiment'],
})
set('exp.galvanic_Zn_Cu', {
  verdict: '通过',
  severity: 'P3',
  issues: [
    '电子外电路、离子溶液迁移、CuSO4 vs 稀H2SO4正极区分正确；非必须两金属已说明',
  ],
  fix: '—',
  verify: false,
  scope: '必修核心',
  train: '可训电极/流向；题设必须给出电解质',
  topic: ['galvanic', 'experiment'],
})

// ---- concepts (10) ----
set('concept.homolog', {
  verdict: '通过',
  severity: null,
  issues: [],
  fix: '—',
  verify: false,
  scope: '必修核心',
  train: '可训',
  topic: ['organic'],
})
set('concept.isomer', {
  verdict: '通过',
  severity: 'P3',
  issues: ['已限复杂推断；乙醇/二甲醚示例标了解'],
  fix: '—',
  verify: false,
  scope: '必修核心（书写限深度）',
  train: '可训简单书写；复杂限默认',
  topic: ['organic'],
})
set('concept.functional_group', {
  verdict: '需要修改',
  severity: 'P2',
  issues: [
    '定义正确',
    'categoryCodes挂organic.homolog/isomer，与官能团概念不符',
  ],
  fix: '改为官能团/有机基础相关分类',
  verify: false,
  scope: '必修核心',
  train: '修关联前勿进同系物/异构专池误抽',
  topic: ['organic', 'link'],
})
set('concept.substitution', {
  verdict: '需要修改',
  severity: 'P2',
  issues: ['取代定义正确', 'category误挂homolog/isomer'],
  fix: '改为organic.substitution',
  verify: false,
  scope: '必修核心',
  train: '修关联',
  topic: ['organic', 'link'],
})
set('concept.addition', {
  verdict: '需要修改',
  severity: 'P2',
  issues: ['加成定义正确', 'category误挂homolog/isomer'],
  fix: '改为organic.addition',
  verify: false,
  scope: '必修核心',
  train: '修关联',
  topic: ['organic', 'link'],
})
set('concept.esterification_rule', {
  verdict: '需要修改',
  severity: 'P2',
  issues: ['酸脱羟基醇脱氢规律与可逆正确', 'category误挂homolog/isomer'],
  fix: '改为organic.esterification',
  verify: false,
  scope: '必修核心',
  train: '修关联',
  topic: ['organic', 'link'],
})
set('concept.endothermic', {
  verdict: '通过',
  severity: null,
  issues: ['明确加热≠吸热；断键吸能成键放能正确'],
  fix: '—',
  verify: false,
  scope: '必修核心',
  train: '可训易错判断',
  topic: ['energy'],
})
set('concept.exothermic', {
  verdict: '通过',
  severity: null,
  issues: ['与吸热对称，未将放热等同于无需加热'],
  fix: '—',
  verify: false,
  scope: '必修核心',
  train: '可训',
  topic: ['energy'],
})
set('concept.heat_of_reaction', {
  verdict: '待核实',
  severity: 'P1',
  issues: [
    '概念方向正确；燃烧热/中和热与定量深度、ΔH符号口径待对必修二教材',
    'verifyNeeded保留',
  ],
  fix: '教材定点后决定是否进默认池；禁复杂热量计算默认训练',
  verify: true,
  scope: '必修第二册·待核实深度',
  train: '核实前排除默认定量训练',
  topic: ['energy', 'verify'],
})
set('concept.addition_polymer', {
  verdict: '通过',
  severity: 'P2',
  issues: ['乙烯加聚示例正确；已标必修了解'],
  fix: '默认限单体-链节对应，勿高分子工程',
  verify: false,
  scope: '必修了解',
  train: '了解级可训简单加聚识别',
  topic: ['organic', 'scope'],
})

// ---- knowledge (33) ----
const kpPass = (code, name, extra = {}) =>
  set(code, {
    verdict: '通过',
    severity: extra.severity || null,
    issues: extra.issues || [],
    fix: extra.fix || '—',
    verify: false,
    scope: extra.scope || '必修核心',
    train: extra.train || '可训',
    topic: extra.topic || ['knowledge'],
  })

kpPass('kp.organic.methane', '甲烷', {
  severity: 'P3',
  issues: ['与物质条一致，强调多氯代'],
  topic: ['organic'],
})
kpPass('kp.organic.alkane', '烷烃', { topic: ['organic'] })
kpPass('kp.organic.ethene', '乙烯', {
  severity: 'P3',
  issues: ['KMnO4不指定唯一产物正确'],
  topic: ['organic'],
})
kpPass('kp.organic.ethanol', '乙醇', { topic: ['organic'] })
kpPass('kp.organic.acetic', '乙酸', { topic: ['organic'] })
kpPass('kp.organic.isomer_skill', '异构书写', {
  severity: 'P2',
  issues: ['已限复杂推断'],
  scope: '必修核心（限深度）',
  train: '可训简单书写；复杂排除默认',
  topic: ['organic'],
})
kpPass('kp.inference.color', '颜色推断', {
  topic: ['inference'],
  train: '可训；须多线索验证',
})
kpPass('kp.inference.block', '框图推断', {
  severity: 'P2',
  issues: ['策略正确；复杂综合题勿默认超纲无机链'],
  train: '可训策略；题干控制范围',
  topic: ['inference'],
})
kpPass('kp.inference.conversion', '转化推断', { topic: ['inference'] })
kpPass('kp.comprehensive.basic', '综合框架', { topic: ['comprehensive'] })
kpPass('kp.energy.bond_change', '键与能量', {
  issues: ['断键吸能成键放能正确'],
  topic: ['energy'],
})
kpPass('kp.energy.chem_electric', '化学能电能', {
  severity: 'P3',
  issues: ['电解对比了解级；specialty含redox可接受'],
  topic: ['energy'],
})
kpPass('kp.energy.galvanic', '原电池', {
  severity: 'P2',
  issues: [
    '原理正确；非必须两金属正确',
    'specialty挂experiment略宽（知识点非实验步骤条）',
  ],
  fix: '可选去掉experiment主关联，保留redox/comprehensive',
  train: '内容可训；关联可收窄',
  topic: ['galvanic', 'link'],
})
kpPass('kp.energy.galvanic_poles', '正负极', { topic: ['galvanic'] })
kpPass('kp.energy.electron_flow', '电子流向', {
  issues: ['电子负极→正极；电流相反；离子迁移正确'],
  topic: ['galvanic'],
})
kpPass('kp.energy.electrode_rxn', '电极反应', {
  severity: 'P3',
  issues: ['强调题设电解质正确'],
  train: '可训；必须给电解质条件',
  topic: ['galvanic'],
})
kpPass('kp.energy.chem_power', '化学电源', {
  severity: 'P2',
  issues: ['了解级已标'],
  scope: '必修了解',
  train: '限名称用途认知',
  topic: ['energy', 'scope'],
})
kpPass('kp.energy.thermo_eq', '热化学方程式', {
  severity: 'P2',
  issues: ['书写要求正确；定量深度应跟教材，勿默认复杂计算'],
  train: '可训书写格式；禁超纲计算默认',
  topic: ['energy'],
})
kpPass('kp.sustain.seawater', '海水', {
  scope: '必修了解',
  severity: 'P3',
  topic: ['sustain'],
})
kpPass('kp.sustain.coal', '煤', { scope: '必修了解', severity: 'P3', topic: ['sustain'] })
kpPass('kp.organic.petroleum', '石油分馏', {
  issues: ['物理变化与裂化区分正确'],
  scope: '必修了解',
  topic: ['organic', 'sustain'],
})
set('kp.organic.cracking', {
  verdict: '待核实',
  severity: 'P1',
  issues: ['与裂解区分方向正确；考法/深度/是否默认核心待教材核实；verifyNeeded保留'],
  fix: '核实前excludeDefaultTraining',
  verify: true,
  scope: '了解/待核实',
  train: '核实前不进默认核心池',
  topic: ['organic', 'verify'],
})
set('kp.organic.pyrolysis', {
  verdict: '待核实',
  severity: 'P1',
  issues: ['裂解获乙烯等方向正确；与裂化边界待核实；verifyNeeded保留'],
  fix: '核实前excludeDefaultTraining',
  verify: true,
  scope: '了解/待核实',
  train: '核实前不进默认核心池',
  topic: ['organic', 'verify'],
})
kpPass('kp.sustain.natural_gas', '天然气', {
  scope: '必修了解',
  severity: 'P3',
  topic: ['sustain'],
})
kpPass('kp.sustain.fertilizer', '化肥', { scope: '必修了解', topic: ['sustain'] })
kpPass('kp.sustain.pesticide', '农药', { scope: '必修了解', topic: ['sustain'] })
kpPass('kp.sustain.medicine', '药物', { scope: '必修了解', topic: ['sustain'] })
kpPass('kp.sustain.food_additive', '食品添加剂', {
  scope: '必修了解',
  topic: ['sustain'],
})
kpPass('kp.enviro.pollution', '污染防治', { topic: ['sustain'] })
kpPass('kp.enviro.acid_rain', '酸雨', { topic: ['sustain'] })
kpPass('kp.sustain.green_chem', '绿色化学', {
  severity: 'P3',
  issues: ['概念认识层次；勿当计算默认'],
  topic: ['sustain'],
})
set('kp.sustain.atom_economy', {
  verdict: '待核实',
  severity: 'P1',
  issues: [
    '概念方向正确',
    '挂calculation.mixed易入计算题池；定量公式深度待核实；verifyNeeded保留',
  ],
  fix: '核实前去掉计算默认关联或标了解；禁原子经济定量默认题',
  verify: true,
  scope: '了解/待核实',
  train: '核实前排除默认计算训练',
  topic: ['sustain', 'verify', 'link'],
})
set('kp.organic.biomolecule', {
  verdict: '待核实',
  severity: 'P1',
  issues: ['认知级表述妥当；覆盖深度与是否默认训练待教材核实；verifyNeeded保留'],
  fix: '核实前excludeDefaultTraining',
  verify: true,
  scope: '了解/待核实',
  train: '核实前不进默认核心',
  topic: ['organic', 'verify'],
})

// ---- questions (10) ----
set('q.organic.methane', {
  verdict: '通过',
  severity: 'P3',
  issues: ['骨架选择题强调正四面体与非唯一氯代；reviewNote已回填'],
  fix: '充实为正式题前补全选项规范性检查',
  verify: false,
  scope: '必修核心',
  train: '骨架非正式卷；可作模板',
  topic: ['question'],
})
set('q.organic.ethene', {
  verdict: '通过',
  severity: 'P3',
  issues: ['加成判断骨架合理；reviewNote已回填'],
  fix: '—',
  verify: false,
  scope: '必修核心',
  train: '骨架模板',
  topic: ['question'],
})
set('q.organic.ethanol', {
  verdict: '通过',
  severity: 'P3',
  issues: ['催化氧化条件填空合理'],
  fix: '—',
  verify: false,
  scope: '必修核心',
  train: '骨架模板',
  topic: ['question'],
})
set('q.organic.ester', {
  verdict: '通过',
  severity: 'P2',
  issues: ['简答骨架；自动判题需限定要点清单（⇌、浓硫酸、加热、产物）'],
  fix: '正式启用前写采分点与可接受等价写法',
  verify: false,
  scope: '必修核心',
  train: '非正式自动判题直至采分点固化',
  topic: ['question', 'auto'],
})
set('q.organic.isomer', {
  verdict: '通过',
  severity: 'P2',
  issues: ['书写题多解；须限定碳数与同分异构类型'],
  fix: '正式题必须限定分子式与异构类型',
  verify: false,
  scope: '必修核心（限）',
  train: '限条件后方可自动/半自动判',
  topic: ['question', 'auto'],
})
set('q.inference.block', {
  verdict: '通过',
  severity: 'P2',
  issues: ['骨架无完整框图数据；不可直接组卷'],
  fix: '补充具体框图与唯一突破口后再用',
  verify: false,
  scope: '视题设',
  train: '禁止直接自动出题',
  topic: ['question', 'auto'],
})
set('q.inference.phenomenon', {
  verdict: '通过',
  severity: 'P2',
  issues: ['现象推断骨架需具体试剂链'],
  fix: '补全现象序列与唯一结论条件',
  verify: false,
  scope: '视题设',
  train: '禁止直接自动出题',
  topic: ['question', 'auto'],
})
set('q.eq.Na_water', {
  verdict: '需要修改',
  severity: 'P1',
  issues: [
    '复用published题：题干问“生成物”，答案“NaOH 和 H2”，未要求方程式，与equation专项不完全匹配',
    '无[inv:q.eq.Na_water]；缺options_json等完整选择题结构（视库内实际）',
    'DB专项另挂substance，清单仅equation',
    '未写2Na+2H2O=2NaOH+H2，自动方程式判题不可用',
  ],
  fix: '整改时另建完整方程式骨架或升级本题：补方程式、配平、条件/现象采分点；勿覆盖时需新建pending题替换训练',
  verify: false,
  scope: '必修核心',
  train: '整改前不宜作方程式自动判题唯一标准',
  topic: ['question', 'auto'],
})
set('q.substance.NaOH', {
  verdict: '通过',
  severity: 'P3',
  issues: ['烧碱俗称骨架；reviewNote已回填'],
  fix: '—',
  verify: false,
  scope: '必修核心',
  train: '骨架模板',
  topic: ['question'],
})
set('q.comprehensive.mock', {
  verdict: '通过',
  severity: 'P2',
  issues: ['综合模拟题组仅为骨架占位，无完整卷面'],
  fix: '充实小题集与评分细则后方可训练',
  verify: false,
  scope: '视组成',
  train: '禁止直接当正式套卷',
  topic: ['question', 'auto'],
})

// validate coverage
const missing = b6.items.filter((i) => !AUDIT[i.code]).map((i) => i.code)
if (missing.length) throw new Error('AUDIT missing: ' + missing.join(','))
if (Object.keys(AUDIT).length !== 79) {
  throw new Error('AUDIT size ' + Object.keys(AUDIT).length)
}

const items = b6.items.map((it) => {
  const a = AUDIT[it.code]
  const ex = extract.items.find((e) => e.code === it.code)
  return {
    code: it.code,
    type: it.type,
    name: it.name,
    ...a,
    dbStatus: ex?.dbStatus,
    dbId: ex?.dbId,
    hasInv: String(ex?.dbReviewNote || '').includes(`[inv:${it.code}]`),
    source: ex?.source,
    dbSpecialtyCodes: ex?.dbSpecialtyCodes || [],
    specialtyCodes: it.specialtyCodes || [],
    categoryCodes: it.categoryCodes || [],
  }
})

const verdictCount = { 通过: 0, 需要修改: 0, 待核实: 0 }
const sevItem = { P0: 0, P1: 0, P2: 0, P3: 0, none: 0 }
const sevProblem = { P0: 0, P1: 0, P2: 0, P3: 0 }
for (const it of items) {
  verdictCount[it.verdict]++
  if (it.severity) sevItem[it.severity]++
  else sevItem.none++
  if (it.severity && it.verdict !== '通过') {
    // count as problem items
  }
  if (it.severity) sevProblem[it.severity]++
}

// problem count: each non-empty issues line that is a real problem for 需要修改/待核实
let problemRows = 0
for (const it of items) {
  if (it.verdict === '需要修改' || it.verdict === '待核实') {
    problemRows += Math.max(1, (it.issues || []).filter((x) => x && !x.startsWith('—')).length)
  }
}

const mapOut = {
  auditedAt: new Date().toISOString(),
  planned: 79,
  verdictCount,
  severityByItem: sevItem,
  severityByItemNote: '每条知识一个主等级；通过条也可带P2/P3提示等级',
  problemItemCount: items.filter((i) => i.verdict !== '通过').length,
  readOnly: true,
  items,
}
fs.writeFileSync(
  path.join(dir, 'quality_audit_map.json'),
  JSON.stringify(mapOut, null, 2) + '\n',
)

function table(rows) {
  const head =
    '| 编码 | 名称 | 结论 | 等级 | 问题说明 | 修正建议 | 人工核实 | 范围 | 训练建议 |\n|------|------|------|------|----------|----------|----------|------|----------|'
  const body = rows
    .map((r) => {
      const issues = (r.issues || []).join('；') || '—'
      return `| \`${r.code}\` | ${r.name} | ${r.verdict} | ${r.severity || '—'} | ${issues.replace(/\|/g, '/')} | ${(r.fix || '—').replace(/\|/g, '/')} | ${r.verify ? '是' : '否'} | ${r.scope} | ${(r.train || '').replace(/\|/g, '/')} |`
    })
    .join('\n')
  return head + '\n' + body
}

const byType = (t) => items.filter((i) => i.type === t)
const needFix = items.filter((i) => i.verdict === '需要修改')
const verifyItems = items.filter((i) => i.verdict === '待核实')
const organicRxnIssues = needFix.filter((i) => i.type === 'reaction')
const galvanicIssues = items.filter(
  (i) =>
    (i.topic || []).includes('galvanic') &&
    (i.verdict !== '通过' || (i.severity && i.severity !== 'P3' && i.issues?.length)),
)
const qIssues = items.filter(
  (i) => i.type === 'question' && (i.verdict !== '通过' || i.severity === 'P1' || i.severity === 'P2'),
)

const md = []
md.push('# 高一化学知识库 · Batch6 质量审查报告')
md.push('')
md.push(
  '> 审查对象：`batch6` **79** 条（有机 / 能量与原电池 / 综合；含复用 `q.eq.Na_water`）',
)
md.push(
  '> 依据：`CHEMISTRY_QUALITY_STANDARD.md`、`CHEMISTRY_BATCH6_REPORT.md`、导入包与 DB **只读**核对',
)
md.push('> 审查日期：2026-10-18')
md.push(
  '> **产品定位**：实验专项 = 书面题目训练；不要求线下动手；不开发实验平台。',
)
md.push(
  '> **本报告为 AI 辅助专项质量审查，不是人工学科审核。** 通过 ≠ 已经人工审核。',
)
md.push('> **本次只读审查，未修改知识正文 / 导入 JSON / 数据库。**')
md.push('')
md.push('---')
md.push('')
md.push('## 0. 总览')
md.push('')
md.push('### 0.1 逐条审查结论（互斥，合计=79）')
md.push('')
md.push('| 结论 | 数量 |')
md.push('|------|------|')
md.push(`| 通过（自动检查通过） | **${verdictCount['通过']}** |`)
md.push(`| 需要修改 | **${verdictCount['需要修改']}** |`)
md.push(`| 待核实（待教材核实） | **${verdictCount['待核实']}** |`)
md.push(`| **合计** | **${verdictCount['通过'] + verdictCount['需要修改'] + verdictCount['待核实']}** |`)
md.push('')
md.push('### 0.2 问题严重度')
md.push('')
md.push('> **口径 A（知识条数）**：每条取一个主等级（含“通过”条上的提示等级）。')
md.push('')
md.push('| 级别 | 知识条数 |')
md.push('|------|----------|')
md.push(`| **P0** | **${sevItem.P0}** |`)
md.push(`| **P1** | **${sevItem.P1}** |`)
md.push(`| **P2** | **${sevItem.P2}** |`)
md.push(`| **P3** | **${sevItem.P3}** |`)
md.push(`| 无等级 | ${sevItem.none} |`)
md.push('')
md.push(
  `> **口径 B（问题条目数）**：结论为「需要修改」或「待核实」的知识条数 = **${items.filter((i) => i.verdict !== '通过').length}**（其中主等级 P0=${items.filter((i) => i.verdict !== '通过' && i.severity === 'P0').length}，P1=${items.filter((i) => i.verdict !== '通过' && i.severity === 'P1').length}，P2=${items.filter((i) => i.verdict !== '通过' && i.severity === 'P2').length}）。`,
)
md.push('')
md.push('### 0.3 发布与整改判断')
md.push('')
md.push('| 问题 | 结论 |')
md.push('|------|------|')
md.push(
  `| 是否存在重大科学错误（P0） | **${sevItem.P0 > 0 ? '是' : '否'}**（乙醇催化氧化/燃烧的氧化产物与还原产物字段对调） |`,
)
md.push('| 是否阻止正式发布 | **是**（pending_review 为主 + 需改/待核实 + 非人审；另有1条published复用题质量不足） |')
md.push('| 是否可进入质量整改 | **是** |')
md.push('| 是否已整改 | **否（本次停止）** |')
md.push('| 是否开发训练引擎 | **否** |')
md.push('')
md.push('### 0.4 数据库只读核对')
md.push('')
md.push('- 79 条均存在；新建 78 条为 `pending_review`；复用 `q.eq.Na_water` 为 `published`。')
md.push('- 新建 78 条含 `[inv:CODE]`；复用题无 inv 标签（历史数据）。')
md.push('- 清单总量 **377**；Batch4 `sub.Cl2`、Batch5 `exp.instrument_basic` 样本仍在。')
md.push('- **未改库。**')
md.push('')
md.push('### 0.5 Batch5 question reviewNote 遗留（全库核验待办）')
md.push('')
md.push(
  '建设期曾怀疑 Batch5 的 8 条 question 缺 `reviewNote`。本次只读复查：`chem_questions` id=2..9 **均已含** `[inv:q.calc.*]` / `[inv:q.exp.*]` / `[inv:q.eq.balance]`。',
)
md.push('')
md.push(
  '**仍列入全库核验待办**：对全部 `chem_questions` 做一次 `[inv:]` 完整性扫描（含历史 seeded/published），避免遗漏其他批次。**本次不修改 Batch5。**',
)
md.push('')
md.push('---')
md.push('')
md.push('## 1. substance（9）')
md.push('')
md.push(table(byType('substance')))
md.push('')
md.push('## 2. reaction（10）')
md.push('')
md.push(table(byType('reaction')))
md.push('')
md.push('## 3. experiment（7）')
md.push('')
md.push(table(byType('experiment')))
md.push('')
md.push('## 4. concept（10）')
md.push('')
md.push(table(byType('concept')))
md.push('')
md.push('## 5. knowledge（33）')
md.push('')
md.push(table(byType('knowledge')))
md.push('')
md.push('## 6. question（10，含复用）')
md.push('')
md.push(table(byType('question')))
md.push('')
md.push('---')
md.push('')
md.push('## 7. 有机化学问题清单')
md.push('')
md.push('| 编码 | 等级 | 摘要 |')
md.push('|------|------|------|')
for (const r of items.filter(
  (i) =>
    (i.topic || []).includes('organic') &&
    (i.verdict === '需要修改' || i.verdict === '待核实' || i.severity === 'P0'),
)) {
  md.push(
    `| \`${r.code}\` | ${r.severity || '—'} | ${(r.issues || [])[0] || r.verdict} |`,
  )
}
md.push('')
md.push(`有机相关需改反应条数：**${organicRxnIssues.length}**（含 2 条 P0）。`)
md.push('')
md.push('## 8. 能量变化问题清单')
md.push('')
md.push('- `concept.endothermic` / `exothermic` / `kp.energy.bond_change`：**通过**（加热≠吸热；断键吸能、成键放能）。')
md.push('- `concept.heat_of_reaction`：**待核实**（定量/燃烧热中和热口径）。')
md.push('- `kp.energy.thermo_eq`：通过，但限制默认复杂计算。')
md.push('')
md.push('## 9. 原电池问题清单')
md.push('')
md.push('- 原理/电子流向/电极反应/实验书面条：科学表述**通过**。')
md.push('- `kp.energy.galvanic`：experiment 专项挂靠略宽（P2 提示，结论仍通过）。')
md.push('- 未发现“电子在溶液中流动”或“必须两种不同金属”的错误断言。')
md.push('')
md.push('## 10. 实验知识问题清单')
md.push('')
md.push('- 7 条均书面定位 + 禁家用；高危（Cl2、浓硫酸加热等）有安全限制。')
md.push('- 未见鼓励线下动手。建设期实验条**无「需要修改」**。')
md.push('')
md.push('## 11. 专项关联问题清单')
md.push('')
md.push('| 问题 | 涉及 |')
md.push('|------|------|')
md.push(
  '| 有机反应 category 机械三挂（取代+加成+酯化） | 除 `rxn.C2H4_KMnO4` 外共 9 条 reaction |',
)
md.push(
  '| 概念 category 误挂 homolog/isomer | functional_group / substitution / addition / esterification_rule |',
)
md.push('| atom_economy 挂 calculation.mixed | 待核实条，易入计算池 |')
md.push('| galvanic 知识点挂 experiment | 可收窄 |')
md.push('')
md.push('## 12. 课程范围争议清单')
md.push('')
md.push('| 内容 | 建议定位 |')
md.push('|------|----------|')
md.push('| 乙炔、苯、丙烷 | 必修了解；限制默认深度 |')
md.push('| 裂化/裂解 | 待核实；排除默认核心 |')
md.push('| 反应热定量、原子经济性计算 | 待核实/限制 |')
md.push('| 生物大分子 | 待核实了解级 |')
md.push('| 加聚、化学电源 | 了解级 |')
md.push('')
md.push('## 13. 自动出题风险清单')
md.push('')
md.push('| 风险 | 编码 |')
md.push('|------|------|')
md.push('| ox/re 字段对调导致氧化还原产物误判 | `rxn.C2H5OH_O2`, `rxn.C2H5OH_burn` |')
md.push('| 错误二级分类抽题 | 9 条有机反应 + 4 条概念 |')
md.push('| KMnO4 产物填空 | `rxn.C2H4_KMnO4` |')
md.push('| 复用题不能作方程式自动标准 | `q.eq.Na_water` |')
md.push('| 推断/综合/异构骨架缺约束 | `q.inference.*`, `q.organic.isomer`, `q.comprehensive.mock` |')
md.push('| 酯化简答需采分点 | `q.organic.ester` |')
md.push('')
md.push('## 14. 5 条待教材核实详情')
md.push('')
md.push('| 编码 | 可确认事实 | 争议/待核实 | 默认训练 |')
md.push('|------|------------|-------------|----------|')
md.push(
  '| `concept.heat_of_reaction` | 反应热与状态、ΔH相关 | 燃烧热/中和热是否默认、定量深度 | 限制 |',
)
md.push('| `kp.organic.cracking` | 长链变短链、提轻质油 | 与裂解边界、考法 | 限制 |')
md.push('| `kp.organic.pyrolysis` | 深度断裂得乙烯等 | 条件与必修地位 | 限制 |')
md.push('| `kp.sustain.atom_economy` | 原子利用率概念 | 公式与计算是否入必修 | 限制 |')
md.push('| `kp.organic.biomolecule` | 糖脂蛋白等认知 | 覆盖深度 | 限制 |')
md.push('')
md.push('**未取消 verifyNeeded；未标人工审核通过。**')
md.push('')
md.push('## 15. 推荐整改方案（本次不执行）')
md.push('')
md.push('1. **P0优先**：对调 `rxn.C2H5OH_O2`、`rxn.C2H5OH_burn` 的 ox/re 产物字段。')
md.push('2. **关联整改**：按真实反应类型重写 9 条 reaction 与 4 条 concept 的 categoryCodes，并同步 DB 关联。')
md.push('3. **KMnO4**：修正 re_product 命名；训练限现象。')
md.push('4. **`q.eq.Na_water`**：新建完整方程式骨架（pending）或升级采分点；勿静默覆盖 published。')
md.push('5. **5 条核实**：教材对照后决定去标或继续限制。')
md.push('6. **全库核验待办**：扫描全部 question 的 `[inv:]`（Batch5 本次抽查已有标签，仍建议全量）。')
md.push('')
md.push('## 16. 审查局限性')
md.push('')
md.push('- AI 审查 ≠ 人工学科审核；未核对具体教材页码。')
md.push('- 未跑自动组卷引擎实测。')
md.push('- 离子式电荷排版、催化剂商品名等以教材题设为准的细节可能仍有口径差。')
md.push('')
md.push('## 17. 统计复核')
md.push('')
md.push(
  `通过 ${verdictCount['通过']} + 需要修改 ${verdictCount['需要修改']} + 待核实 ${verdictCount['待核实']} = ${verdictCount['通过'] + verdictCount['需要修改'] + verdictCount['待核实']}（必须为 79）。`,
)
md.push('')
md.push('---')
md.push('')
md.push('*报告结束。等待指令后再进入质量整改。*')
md.push('')

fs.writeFileSync(
  path.join(ROOT, 'docs/CHEMISTRY_BATCH6_QUALITY_REPORT.md'),
  md.join('\n'),
  'utf8',
)

console.log(
  JSON.stringify(
    {
      verdictCount,
      severityByItem: sevItem,
      needFix: needFix.map((i) => i.code + ':' + i.severity),
      verify: verifyItems.map((i) => i.code),
      sum:
        verdictCount['通过'] +
        verdictCount['需要修改'] +
        verdictCount['待核实'],
      P0_items: items.filter((i) => i.severity === 'P0').map((i) => i.code),
    },
    null,
    2,
  ),
)
