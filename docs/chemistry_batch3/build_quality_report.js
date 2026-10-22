/** Build CHEMISTRY_BATCH3_QUALITY_REPORT.md from audit map. Read-only vs DB. */
const fs = require('fs')
const path = require('path')

const dir = __dirname
const extract = JSON.parse(
  fs.readFileSync(path.join(dir, 'quality_extract.json'), 'utf8'),
)

/** @type {Record<string, {v:string,s:string,issue:string,fix:string,h:boolean,scope:string,train:string}>} */
const audit = {
  'sub.Na': {
    v: '通过',
    s: 'P3',
    issue: '化学性质字段偏简；用途“散热”偏了解级',
    fix: '补与O2条件差异要点；用途标了解',
    h: false,
    scope: '高一必修核心',
    train: '可训保存/与水；深度用途勿默认',
  },
  'sub.Na2O': {
    v: '通过',
    s: '—',
    issue: '未见明确事实错误；溶解性已避免简单写溶于水',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训碱性氧化物与水',
  },
  'sub.Na2O2': {
    v: '通过',
    s: '—',
    issue: '淡黄色、歧化供氧、保存与安全准确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训颜色/与水CO2/氧化还原歧化',
  },
  'sub.NaOH': {
    v: '通过',
    s: 'P3',
    issue: '复用条目字段较简（潮解、吸收CO2等可更完整）',
    fix: '对照新导入标准补全潮解与吸收CO2',
    h: false,
    scope: '高一必修核心',
    train: '可训强碱性质；建议补字段后命题',
  },
  'sub.Na2CO3': {
    v: '通过',
    s: '—',
    issue: '与酸、与CO2转化、热稳定性表述正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训鉴别与转化',
  },
  'sub.NaHCO3': {
    v: '通过',
    s: '—',
    issue: '受热分解与鉴别要点正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训分解方程式与鉴别',
  },
  'sub.NaCl': {
    v: '通过',
    s: 'P3',
    issue: '一般不与稀酸稀碱复分解属了解级，可接受',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '中性盐/导电了解即可',
  },
  'sub.Mg': {
    v: '通过',
    s: '—',
    issue: '燃烧、与酸、CO2中燃烧要点正确；安全有强光提示',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训燃烧与活动性',
  },
  'sub.MgO': {
    v: '通过',
    s: '—',
    issue: '碱性氧化物表述正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训与酸反应',
  },
  'sub.MgOH2': {
    v: '通过',
    s: 'P3',
    issue: '与Al(OH)3对比正确；中强碱为中学常用口径',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训不溶于过量NaOH对比题',
  },
  'sub.Al': {
    v: '通过',
    s: 'P3',
    issue: '两性与氧化膜正确；已提示[Al(OH)4]-了解',
    fix: '与反应条产物写法统一',
    h: false,
    scope: '高一必修核心',
    train: '可训两性与氧化膜',
  },
  'sub.Al2O3': {
    v: '通过',
    s: 'P3',
    issue: '两性氧化物正确；NaAlO2写法需与教材统一',
    fix: '对齐所用教材产物写法',
    h: true,
    scope: '高一必修核心',
    train: '可训两性；产物写法随教材',
  },
  'sub.AlOH3': {
    v: '通过',
    s: 'P3',
    issue: '两性氢氧化物与胶状沉淀正确',
    fix: '统一偏铝酸盐写法',
    h: true,
    scope: '高一必修核心',
    train: '可训沉淀溶解现象',
  },
  'sub.Fe': {
    v: '通过',
    s: '—',
    issue: '点燃→Fe3O4、稀酸→Fe2+、置换与生锈要点正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训性质与易错点',
  },
  'sub.Fe2O3': {
    v: '通过',
    s: '—',
    issue: '红棕色、CO还原正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训颜色与炼铁还原',
  },
  'sub.Fe3O4': {
    v: '通过',
    s: '—',
    issue: '黑色磁性、点燃产物认识正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训燃烧产物记忆',
  },
  'sub.FeOH3': {
    v: '通过',
    s: '—',
    issue: '红褐色及由Fe(OH)2氧化而来正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训沉淀颜色',
  },
  'sub.FeCl3': {
    v: '通过',
    s: 'P3',
    issue: 'Fe3+检验正确；氧化I-/S2-已标选修/了解',
    fix: '默认训练勿考I-/S2-深度',
    h: false,
    scope: '高一必修核心（部分了解）',
    train: '可训SCN与碱沉淀；排除深氧化还原',
  },
  'sub.Cu': {
    v: '通过',
    s: '—',
    issue: '紫红、加热变黑、不与稀盐酸/稀硫酸反应正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训活动性与加热氧化',
  },
  'sub.CuO': {
    v: '通过',
    s: '—',
    issue: '黑色、还原与溶于酸正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训还原实验关联',
  },
  'sub.CuOH2': {
    v: '通过',
    s: 'P3',
    issue: '蓝色沉淀正确；醛基检验属后续了解已标注',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训Cu2+沉淀颜色',
  },
  'sub.CuSO4': {
    v: '通过',
    s: '—',
    issue: '无水白/蓝矾蓝区分清楚；毒性安全到位',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训颜色与置换',
  },
  'sub.Zn': {
    v: '通过',
    s: '—',
    issue: '与酸、置换Cu2+正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训活动性实验',
  },
  'sub.Ag': {
    v: '通过',
    s: 'P3',
    issue: '活动性弱表述正确；硝酸反应后置合理',
    fix: '—',
    h: false,
    scope: '高一必修核心/了解',
    train: '活动性顺序了解即可',
  },
  'sub.H2': {
    v: '通过',
    s: '—',
    issue: '可燃还原性与爆炸安全正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训还原与验纯安全',
  },
  'sub.H2O': {
    v: '通过',
    s: 'P3',
    issue: 'safety写“安全”过于绝对',
    fix: '改为常规实验室用水说明',
    h: false,
    scope: '高一必修核心',
    train: '作溶剂/反应物关联即可',
  },
  'sub.O2': {
    v: '通过',
    s: '—',
    issue: '助燃与安全注意正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训氧化剂角色',
  },
  'sub.CO2': {
    v: '通过',
    s: '—',
    issue: '酸性氧化物、石灰水、镁例外正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训性质与灭火边界',
  },
  'sub.FeO': {
    v: '需要人工核实',
    s: 'P1',
    issue: '黑色Fe(+2)正确，空气中易氧化等细节待对课本',
    fix: '对照课本补稳定性与保存表述',
    h: true,
    scope: '高一必修核心',
    train: '核实前勿出细节绝对判断题',
  },
  'sub.FeOH2': {
    v: '通过',
    s: '—',
    issue: '白→灰绿→红褐与总式正确；现制观察合理',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训现象链；关联rxn.FeOH2_O2',
  },
  'sub.FeSO4': {
    v: '通过',
    s: 'P3',
    issue: '浅绿、还原性正确；酸性KMnO4举例偏拓展',
    fix: '默认题用Cl2/O2；KMnO4标了解',
    h: false,
    scope: '高一必修核心',
    train: '可训Fe2+代表盐',
  },
  'sub.NaAlO2': {
    v: '需要人工核实',
    s: 'P1',
    issue: '固体NaAlO2与溶液[Al(OH)4]-存在形式口径需对教材',
    fix: '统一写法并在reviewNote固化教材版本',
    h: true,
    scope: '高一必修核心',
    train: '核实前方程式训练需题干指定写法',
  },
  'sub.AlCl3': {
    v: '通过',
    s: '—',
    issue: 'Al3+、水解酸性、与碱沉淀及过量溶解正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训铝盐转化',
  },

  'rxn.2Na_2H2O': {
    v: '通过',
    s: '—',
    issue: '方程式、现象、ox/re与产物NaOH/H2逻辑正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训方程式/现象/氧化还原',
  },
  'rxn.4Na_O2': {
    v: '通过',
    s: 'P3',
    issue: '常温→Na2O正确；化合反应ox/re产物同为Na2O需训练提示',
    fix: '题干说明化合反应氧化/还原产物可为同一物质',
    h: false,
    scope: '高一必修核心',
    train: '可训条件与产物对比',
  },
  'rxn.2Na_O2_heat': {
    v: '通过',
    s: 'P3',
    issue: '点燃→淡黄色Na2O2正确',
    fix: '同上化合反应产物说明',
    h: false,
    scope: '高一必修核心',
    train: '可训条件决定产物',
  },
  'rxn.2Na2O2_2H2O': {
    v: '通过',
    s: '—',
    issue: '歧化：氧化剂=还原剂=Na2O2；oxP=O2、reP=NaOH正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训歧化与供氧',
  },
  'rxn.2Na2O2_2CO2': {
    v: '通过',
    s: '—',
    issue: '方程式与歧化产物O2/Na2CO3正确；淡黄→白合理',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训供氧剂与现象',
  },
  'rxn.Na2O_H2O': {
    v: '通过',
    s: '—',
    issue: '非氧化还原字段置空正确；放热生成强碱正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训碱性氧化物通性',
  },
  'rxn.NaOH_CO2': {
    v: '需要人工核实',
    s: 'P1',
    issue: '主式2NaOH+CO2正确，过量分界与NaHCO3支路需对课本',
    fix: '按教材明确过量CO2→NaHCO3条件句',
    h: true,
    scope: '高一必修核心',
    train: '核实前避免过量绝对判题',
  },
  'rxn.NaOH_HCl': {
    v: '通过',
    s: '—',
    issue: '中和与离子式正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训中和/离子方程式',
  },
  'rxn.NaHCO3_heat': {
    v: '通过',
    s: '—',
    issue: '分解式与石灰水现象正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训分解与鉴别',
  },
  'rxn.Na2CO3_2HCl': {
    v: '通过',
    s: '—',
    issue: '足量酸条件与离子式正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训复分解放CO2',
  },
  'rxn.2Mg_O2': {
    v: '通过',
    s: '—',
    issue: '点燃、白光、MgO正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训燃烧现象',
  },
  'rxn.Mg_2HCl': {
    v: '通过',
    s: '—',
    issue: '稀盐酸条件与氧化还原字段正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训活动性与方程式',
  },
  'rxn.Mg_CO2': {
    v: '通过',
    s: '—',
    issue: '点燃、MgO+C、oxP/reP=MgO/C正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训CO2不支持燃烧例外',
  },
  'rxn.4Al_3O2': {
    v: '需要修改',
    s: 'P1',
    issue: '展示式带点燃，conditions混写常温氧化膜；现象把燃烧与成膜混写',
    fix: '拆分点燃燃烧与常温成膜，或分条件说明并校正方程式条件标记',
    h: false,
    scope: '高一必修核心',
    train: '修改前勿出唯一条件题',
  },
  'rxn.2Al_6HCl': {
    v: '通过',
    s: '—',
    issue: '稀盐酸、除膜提示与配平正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训方程式',
  },
  'rxn.2Al_2NaOH': {
    v: '需要人工核实',
    s: 'P1',
    issue: '含水式正确；AlO2-与[Al(OH)4]-口径待确认；氧化剂H2O正确',
    fix: '按课本统一分子式/离子式',
    h: true,
    scope: '高一必修核心',
    train: '题干需指定产物写法',
  },
  'rxn.Al2O3_6HCl': {
    v: '通过',
    s: '—',
    issue: '两性酸侧正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训两性',
  },
  'rxn.Al2O3_2NaOH': {
    v: '需要人工核实',
    s: 'P1',
    issue: 'NaAlO2常见写法与水溶液配位式口径待统一',
    fix: '统一教材写法',
    h: true,
    scope: '高一必修核心',
    train: '指定写法后可训',
  },
  'rxn.AlOH3_NaOH': {
    v: '需要人工核实',
    s: 'P1',
    issue: '沉淀溶解正确；产物写法待统一',
    fix: '统一教材写法',
    h: true,
    scope: '高一必修核心',
    train: '现象训练可用；方程式随教材',
  },
  'rxn.AlOH3_3HCl': {
    v: '通过',
    s: '—',
    issue: '酸溶正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训两性',
  },
  'rxn.3Fe_2O2': {
    v: '通过',
    s: '—',
    issue: '点燃生成Fe3O4、火星四射正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训燃烧产物',
  },
  'rxn.Fe_H2SO4': {
    v: '通过',
    s: '—',
    issue: '稀硫酸→FeSO4+H2正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训易错点（非Fe3+）',
  },
  'rxn.Fe_CuSO4': {
    v: '通过',
    s: '—',
    issue: '置换现象与oxP/reP=FeSO4/Cu正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训置换与氧化还原',
  },
  'rxn.Fe2O3_3CO': {
    v: '通过',
    s: '—',
    issue: '高温炼铁；oxP=CO2、reP=Fe正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训氧化还原产物判断',
  },
  'rxn.Cu_O2_heat': {
    v: '通过',
    s: '—',
    issue: '加热变黑CuO正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训现象',
  },
  'rxn.CuO_H2': {
    v: '通过',
    s: '—',
    issue: '操作顺序与oxP/reP=H2O/Cu正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训还原与安全顺序',
  },
  'rxn.CuO_2HCl': {
    v: '通过',
    s: '—',
    issue: '非氧化还原正确；蓝绿色Cu2+合理',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训氧化物通性',
  },
  'rxn.Zn_H2SO4': {
    v: '通过',
    s: '—',
    issue: '稀硫酸条件正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训制H2/活动性',
  },
  'rxn.Zn_CuSO4': {
    v: '通过',
    s: '—',
    issue: '置换与氧化还原字段正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训置换',
  },
  'rxn.FeOH2_O2': {
    v: '需要修改',
    s: 'P1',
    issue: '总式正确；oxP与reP均填Fe(OH)3，还原产物训练易歧义',
    fix: '按教材注明还原产物口径（进入Fe(OH)3的氧）；勿答成反应物H2O',
    h: true,
    scope: '高一必修核心',
    train: '修改说明前慎出还原产物自动题',
  },
  'rxn.2Fe2_Cl2': {
    v: '通过',
    s: '—',
    issue: '离子式与颜色变化正确；oxP=Fe3+/reP=Cl-',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训Fe2+→Fe3+',
  },
  'rxn.Na2CO3_CO2_H2O': {
    v: '通过',
    s: '—',
    issue: '足量CO2转化正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训碳酸盐转化',
  },
  'rxn.2Na_2HCl': {
    v: '需要修改',
    s: 'P1',
    issue: '方程式正确但极剧烈；安全不足以支撑学生实验训练',
    fix: '明确仅教师演示/了解对比；禁止学生操作',
    h: true,
    scope: '高一了解/对比',
    train: '排除学生实验操作题；可文字对比钠与水',
  },

  'exp.Na_H2O': {
    v: '通过',
    s: '—',
    issue: '目的步骤现象结论安全齐全',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训现象记忆与安全',
  },
  'exp.Na_O2': {
    v: '通过',
    s: '—',
    issue: '燃烧→淡黄色Na2O2与常温对比正确；危险标识到位',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训现象与产物',
  },
  'exp.Na2O2_H2O': {
    v: '通过',
    s: 'P3',
    issue: '原理含水与CO2两式正确；现象未按步骤分写',
    fix: '分步写清各步现象',
    h: false,
    scope: '高一必修核心',
    train: '可训O2检验与碱性',
  },
  'exp.Al_amphoteric': {
    v: '通过',
    s: 'P3',
    issue: 'Al(OH)3酸碱均溶核心正确；单质Al称两性略宽',
    fix: '区分单质与酸碱反应 vs 氧化物/氢氧化物两性',
    h: false,
    scope: '高一必修核心',
    train: '可训沉淀溶解现象',
  },
  'exp.Fe_rust': {
    v: '通过',
    s: 'P3',
    issue: '对照实验设计正确；isHazardous未显式标注',
    fix: '设为false并保留实验室规范',
    h: false,
    scope: '高一必修核心',
    train: '可训变量控制结论',
  },
  'exp.metal_activity': {
    v: '通过',
    s: '—',
    issue: '原理正确；结论写片段并指向课本顺序得当',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训活动性比较',
  },
  'exp.CuO_H2_reduce': {
    v: '通过',
    s: '—',
    issue: '先通H2再加热等安全要点完整；现象准确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训操作顺序与现象',
  },
  'exp.Fe3_SCN': {
    v: '通过',
    s: 'P3',
    issue: '血红色与Fe2+需先氧化正确；络合物写法已标了解',
    fix: '按课本统一Fe(SCN)3写法',
    h: true,
    scope: '高一必修核心',
    train: '可训检验步骤',
  },

  'kp.Na.property': {
    v: '需要修改',
    s: 'P1',
    issue: '复用条目description过短，不足支撑性质专项讲解',
    fix: '补与O2条件、与水现象、保存要点或关联细化kp',
    h: false,
    scope: '高一必修核心',
    train: '不宜单独作为详解唯一依据',
  },
  'kp.Na.oxide': {
    v: '通过',
    s: '—',
    issue: '常温/燃烧产物、颜色、价态、易错点完整正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训对比记忆',
  },
  'kp.Na.carbonate': {
    v: '通过',
    s: '—',
    issue: '稳定性、转化、鉴别与易错点正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训鉴别与方程式',
  },
  'kp.Al.amphoteric': {
    v: '通过',
    s: '—',
    issue: '两性范围与Mg(OH)2对比易错正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训两性概念',
  },
  'kp.Fe.property': {
    v: '通过',
    s: '—',
    issue: 'Fe3O4、Fe2+盐、易错点正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训性质易错',
  },
  'kp.metal.activity': {
    v: '通过',
    s: 'P3',
    issue: '应用正确但未给出完整金属活动性顺序表',
    fix: '补教材顺序表或关联实验条',
    h: false,
    scope: '高一必修核心',
    train: '判断题需另附顺序表',
  },
  'kp.metal.smelting': {
    v: '通过',
    s: 'P3',
    issue: '还原思路正确；电解炼铝已标了解',
    fix: '—',
    h: false,
    scope: '高一必修核心（电解了解）',
    train: '热还原可训；电解细节勿加深',
  },
  'kp.Fe.fe2_property': {
    v: '通过',
    s: '—',
    issue: '浅绿、还原性、沉淀变色正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训性质与检验铺垫',
  },
  'kp.Fe.fe3_property': {
    v: '通过',
    s: 'P3',
    issue: '颜色/沉淀/SCN正确；氧化I-/S2-已标了解',
    fix: '默认训练勿展开',
    h: false,
    scope: '高一必修核心',
    train: '可训核心性质',
  },
  'kp.Fe.fe2_fe3': {
    v: '需要修改',
    s: 'P2',
    issue: '酸性KMnO4、H2O2等未统一标了解/题设，易被默认基础训练取用',
    fix: '核心例保留Cl2/O2/Fe等；KMnO4/H2O2标了解',
    h: false,
    scope: '高一必修核心+了解剂',
    train: '排除未标记深剂自动命题',
  },
  'kp.Fe.test': {
    v: '通过',
    s: '—',
    issue: 'SCN与碱法、Fe2+间接检验正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训检验流程',
  },
  'kp.Fe.salt': {
    v: '通过',
    s: '—',
    issue: '亚铁盐/铁盐对照正确',
    fix: '—',
    h: false,
    scope: '高一必修核心',
    train: '可训分类记忆',
  },
  'kp.metal.pig_iron': {
    v: '需要人工核实',
    s: 'P1',
    issue: '含碳量约2%–4.3%等数值需与所用教材对齐',
    fix: '按教材改数值区间',
    h: true,
    scope: '高一了解',
    train: '核实前勿考具体百分数',
  },
  'kp.metal.steel': {
    v: '需要人工核实',
    s: 'P1',
    issue: '含碳量约0.03%–2%需与教材对齐',
    fix: '按教材改数值区间',
    h: true,
    scope: '高一了解',
    train: '核实前勿考具体百分数',
  },
  'kp.metal.stainless': {
    v: '通过',
    s: 'P2',
    issue: '了解级含铬抗腐蚀正确；不宜进默认核心题池',
    fix: '专项标签保持了解；默认训练排除',
    h: false,
    scope: '高一了解',
    train: '排除默认核心；可出简单认知题',
  },
  'kp.Al.salt_aluminate': {
    v: '通过',
    s: 'P3',
    issue: '过量酸碱沉淀转化正确；书写口径依赖核实',
    fix: '与反应条统一离子写法',
    h: true,
    scope: '高一必修核心',
    train: '可训图像/共存；写法随教材',
  },

  'concept.alloy': {
    v: '需要修改',
    s: 'P0',
    issue:
      'principle将熔点与硬度、抗腐蚀一并写为往往优于成分金属。教材通论：合金熔点一般低于成分金属，硬度一般更大——熔点优于易误导为熔点更高',
    fix: '改为硬度通常更大、抗腐蚀性往往更好、熔点一般更低（以课本为准）',
    h: false,
    scope: '高一必修核心',
    train: 'P0未修前禁止出合金熔点高低判断题',
  },
}

const missing = extract.items.filter((i) => !audit[i.code]).map((i) => i.code)
if (missing.length) {
  console.error('MISSING AUDIT', missing)
  process.exit(1)
}

const counts = { 通过: 0, 需要修改: 0, 需要人工核实: 0, 疑似超纲: 0 }
const sev = { P0: 0, P1: 0, P2: 0, P3: 0, none: 0 }
const humanCodes = new Set()
const suggestModify = []
const excludeDefault = []
const p0list = []
const p1list = []
const p2list = []

for (const it of extract.items) {
  const a = audit[it.code]
  counts[a.v]++
  if (!a.s || a.s === '—') sev.none++
  else sev[a.s]++
  if (a.h || a.v === '需要人工核实') humanCodes.add(it.code)
  if (a.v === '需要修改' || a.s === 'P0' || a.s === 'P1' || a.s === 'P2') {
    if (a.v !== '通过' || a.s === 'P0' || a.s === 'P1' || a.s === 'P2') {
      if (a.v === '需要修改' || a.v === '需要人工核实' || a.s === 'P0' || a.s === 'P2')
        suggestModify.push(it.code)
    }
  }
  if (a.s === 'P0') p0list.push(it.code)
  if (a.s === 'P1') p1list.push(it.code)
  if (a.s === 'P2') p2list.push(it.code)
  if (
    a.scope.includes('了解') ||
    a.train.includes('排除') ||
    it.code === 'rxn.2Na_2HCl' ||
    it.code === 'kp.Fe.fe2_fe3' ||
    it.code === 'kp.metal.stainless' ||
    it.code === 'concept.alloy'
  ) {
    if (
      [
        'kp.metal.stainless',
        'kp.metal.pig_iron',
        'kp.metal.steel',
        'rxn.2Na_2HCl',
        'kp.Fe.fe2_fe3',
        'concept.alloy',
        'sub.FeCl3',
        'kp.Fe.fe3_property',
      ].includes(it.code)
    ) {
      excludeDefault.push(it.code)
    }
  }
}

// unique suggest modify: 需要修改 + P0 + key P1 human items for remediation list
const remediate = [
  ...new Set([
    ...extract.items.filter((i) => audit[i.code].v === '需要修改').map((i) => i.code),
    ...p0list,
    ...p1list,
    ...p2list,
  ]),
]

const typeOrder = ['substance', 'reaction', 'experiment', 'knowledge', 'concept']
const typeTitle = {
  substance: '物质 substance',
  reaction: '反应 reaction',
  experiment: '实验 experiment',
  knowledge: '知识点 knowledge',
  concept: '概念 concept',
}

let md = ''
md += '# 高一化学知识库 · Batch3 质量审查报告\n\n'
md +=
  '> 审查对象：`batch3` 计划 **91** 条（7 条复用 seeded + 84 条新导入 pending_review）  \n'
md +=
  '> 依据：`docs/CHEMISTRY_QUALITY_STANDARD.md`、`docs/CHEMISTRY_BATCH3_REPORT.md`、`docs/chemistry_kb_inventory.json`、导入包与库内复用行  \n'
md += '> 审查日期：2026-10-18  \n'
md +=
  '> **本报告为 AI 辅助自动审查，不是人工审核。** 通过 ≠ 已经人工审核；不得将本报告直接作为 published 依据。\n\n'
md += '---\n\n'
md += '## 0. 总览\n\n'
md += '### 0.1 逐条结论统计（91）\n\n'
md += '| 结论 | 数量 | 说明 |\n|------|------|------|\n'
md += `| 通过（自动检查通过） | **${counts['通过']}** | 未见明确科学性错误；仍需人工审核方可发布 |\n`
md += `| 需要修改 | **${counts['需要修改']}** | 含 P0/P1/P2 |\n`
md += `| 需要人工核实 | **${counts['需要人工核实']}** | 教材口径/数值/产物写法 |\n`
md += `| 疑似超纲 | **${counts['疑似超纲']}** | 本批无整条未标记超纲；了解级见 P2/排除清单 |\n`
md += `| **合计** | **91** | |\n\n`

md += '### 0.2 问题等级统计（按条目最高相关等级计；“—”视为无等级）\n\n'
md += '| 级别 | 数量 | 含义 |\n|------|------|------|\n'
md += `| **P0** | **${sev.P0}** | 明确化学事实错误 |\n`
md += `| **P1** | **${sev.P1}** | 条件/结论/限定缺失或训练关键歧义 |\n`
md += `| **P2** | **${sev.P2}** | 课程范围/默认训练池不合适 |\n`
md += `| **P3** | **${sev.P3}** | 表述或关联优化 |\n`
md += `| 无等级（通过且无明显问题） | ${sev.none} | |\n\n`

md += '### 0.3 关键指标（任务要求对照）\n\n'
md += `| 指标 | 结果 |\n|------|------|\n`
md += `| 自动检查通过数量 | **${counts['通过']}** |\n`
md += `| P0 问题数量 | **${sev.P0}** |\n`
md += `| P1 问题数量 | **${sev.P1}** |\n`
md += `| P2 问题数量 | **${sev.P2}** |\n`
md += `| P3 问题数量 | **${sev.P3}** |\n`
md += `| 需要人工核实数量（结论为核实 或 标注 h=true） | **${humanCodes.size}** |\n`
md += `| 建议修改的知识编码数 | **${remediate.length}** |\n`
md += `| 是否存在阻止正式发布的问题 | **是** |\n\n`

md += '### 0.4 P0 明细\n\n'
md += '| 编码 | 问题 | 修正建议 |\n|------|------|----------|\n'
for (const code of p0list) {
  const a = audit[code]
  md += `| \`${code}\` | ${a.issue} | ${a.fix} |\n`
}
md += '\n'

md += '### 0.5 阻止正式发布的原因\n\n'
md += '1. 存在 **P0**：`concept.alloy` 合金熔点表述与教材通论冲突。  \n'
md += '2. 新导入 **84** 条仍为 `pending_review`，自动检查 ≠ 人工审核。  \n'
md += '3. 铝酸盐产物写法、生铁/钢含碳量、NaOH–CO2 过量口径等多处 **需人工核实**。  \n'
md += '4. 若干条目不宜进入默认必修训练池（见 §8）。  \n\n'
md += '---\n\n'

for (const type of typeOrder) {
  const items = extract.items.filter((i) => i.type === type)
  md += `## ${typeTitle[type]}（${items.length}）\n\n`
  md +=
    '| 知识编码 | 知识名称 | 检查结果 | 问题等级 | 问题说明 | 修正建议 | 是否需要人工核实 | 课程范围 | 训练适用性 |\n'
  md +=
    '|----------|----------|----------|----------|----------|----------|------------------|----------|------------|\n'
  for (const it of items) {
    const a = audit[it.code]
    const name = it.inventoryName || (it.data && it.data.name) || ''
    md += `| \`${it.code}\` | ${name} | ${a.v} | ${a.s} | ${a.issue} | ${a.fix} | ${
      a.h || a.v === '需要人工核实' ? '是' : '否'
    } | ${a.scope} | ${a.train} |\n`
  }
  md += '\n'
}

md += '## 8. 建议修改的知识编码\n\n'
md += '### 8.1 必须优先（P0）\n\n'
md += '- `concept.alloy`\n\n'
md += '### 8.2 需要修改（结论=需要修改）\n\n'
for (const code of extract.items
  .filter((i) => audit[i.code].v === '需要修改')
  .map((i) => i.code)) {
  md += `- \`${code}\`（${audit[code].s}）— ${audit[code].issue}\n`
}
md += '\n### 8.3 需要人工核实后定稿\n\n'
for (const code of [...humanCodes].sort()) {
  md += `- \`${code}\` — ${audit[code].issue}\n`
}
md += '\n### 8.4 全量建议处理清单（P0+P1+P2+结论需改）\n\n'
md += remediate.map((c) => `\`${c}\``).join('、') + '\n\n'

md += '## 9. 需要排除默认训练的内容\n\n'
md +=
  '默认训练（未标注了解/拓展的高一必修核心池）建议排除或降级处理：\n\n'
md +=
  '| 编码 | 原因 |\n|------|------|\n'
md +=
  '| `concept.alloy` | P0 未修前禁止合金熔点高低题 |\n'
md +=
  '| `kp.metal.stainless` | 了解级；勿进默认核心池 |\n'
md +=
  '| `kp.metal.pig_iron` / `kp.metal.steel` | 含碳量数值未核教材前勿考具体百分数 |\n'
md +=
  '| `rxn.2Na_2HCl` | 仅了解/演示对比；排除学生实验操作类 |\n'
md +=
  '| `kp.Fe.fe2_fe3` | 未标记的酸性KMnO4/H2O2勿作默认基础剂 |\n'
md +=
  '| `sub.FeCl3` / `kp.Fe.fe3_property` 中 I⁻/S²⁻ 深度 | 已标了解/选修，勿默认命题 |\n'
md +=
  '| `rxn.FeOH2_O2` | 还原产物字段未说明前慎出氧化还原产物自动题 |\n'
md +=
  '| 铝系 `NaAlO2`/`AlO2-` 相关反应 | 教材写法未统一前，题干必须指定口径 |\n\n'

md += '## 10. 重点化学核对摘要\n\n'
md += '### 10.1 钠系\n\n'
md +=
  '- 常温 `4Na+O2=2Na2O`、燃烧 `2Na+O2=Na2O2`：条件区分正确。  \n'
md +=
  '- `Na2O2` 与水/CO2：方程式与歧化 ox/re 字段正确（oxP=O2）。  \n'
md += '- 复用钠与水：ox/re 产物逻辑正确。  \n\n'
md += '### 10.2 铁系\n\n'
md +=
  '- 点燃→Fe3O4、稀酸→Fe2+、Fe(OH)2 氧化总式、Fe2+/Fe3+/SCN：主体正确。  \n'
md += '- `rxn.FeOH2_O2` 还原产物字段需补训练说明。  \n\n'
md += '### 10.3 铝系\n\n'
md +=
  '- 两性与铝+碱放H2：反应真实成立。  \n'
md += '- **统一口径待核**：NaAlO2 / AlO2- / [Al(OH)4]-。  \n\n'
md += '### 10.4 金属材料\n\n'
md +=
  '- 合金/生铁/钢/不锈钢以 concept+knowledge 收录，方向正确。  \n'
md += '- **P0**：合金熔点表述。  \n'
md += '- 生铁/钢含碳量：**人工核实教材表**。  \n\n'

md += '## 11. 审核状态声明\n\n'
md += '| 数据范围 | 当前标签 |\n|----------|----------|\n'
md += '| 84 条导入 | 库内 `pending_review` + 本报告自动审查结论 |\n'
md += '| 7 条 seeded | 库内多为 `published`，本轮复检 ≠ 重新人工审核 |\n'
md += '| 本报告全部结论 | **需要人工审核**（最终裁定） |\n\n'
md +=
  '**未修改知识内容、未发布 pending_review、未进入 Batch4、未改库结构/用户。**\n\n'
md += '---\n\n'
md += '## 12. 下一步（待你确认）\n\n'
md += '1. 确认是否按本报告整改 P0/P1/P2。  \n'
md += '2. 确认铝酸盐教材口径与生铁/钢含碳量取值。  \n'
md += '3. 确认后再执行内容修正（本任务已停止于检查）。  \n'

const outPath = path.join(dir, '..', 'CHEMISTRY_BATCH3_QUALITY_REPORT.md')
fs.writeFileSync(outPath, md, 'utf8')
fs.writeFileSync(
  path.join(dir, 'quality_audit_map.json'),
  JSON.stringify(audit, null, 2),
  'utf8',
)

console.log(
  JSON.stringify(
    {
      outPath,
      counts,
      sev,
      human: humanCodes.size,
      remediate: remediate.length,
      p0: p0list,
      blocking: true,
    },
    null,
    2,
  ),
)
