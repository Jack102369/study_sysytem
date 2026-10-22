/**
 * Inventory supplement (planning only). Run:
 *   node docs/chemistry_inventory_supplement.js
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname)
const invPath = path.join(ROOT, 'chemistry_kb_inventory.json')
const mdPath = path.join(ROOT, 'CHEMISTRY_KB_INVENTORY.md')
const reportPath = path.join(ROOT, 'CHEMISTRY_INVENTORY_SUPPLEMENT_REPORT.md')

function it(o) {
  return {
    code: o.code,
    type: o.type,
    name: o.name,
    specialtyCodes: o.specialtyCodes,
    categoryCodes: o.categoryCodes || [],
    priority: o.priority,
    status: 'pending',
    note: o.note || '',
    curriculumScope: o.curriculumScope,
    verifyNeeded: !!o.verifyNeeded,
    supplementAt: '2026-10-18',
  }
}

/** @type {Record<string, ReturnType<typeof it>[]>} */
const SUPPLEMENT = {
  batch3: [
    it({
      code: 'sub.FeO',
      type: 'substance',
      name: '氧化亚铁',
      specialtyCodes: ['substance', 'memory'],
      categoryCodes: ['substance.formula', 'substance.chem_property', 'substance.color'],
      priority: 1,
      curriculumScope: '必修第一册·铁及其化合物',
      note: '增补；黑色粉末；FeO',
    }),
    it({
      code: 'sub.FeOH2',
      type: 'substance',
      name: '氢氧化亚铁',
      specialtyCodes: ['substance', 'memory', 'experiment'],
      categoryCodes: ['substance.formula', 'substance.chem_property', 'substance.color'],
      priority: 1,
      curriculumScope: '必修第一册·铁及其化合物',
      note: '增补；白色→灰绿→红褐氧化过程为重点',
    }),
    it({
      code: 'sub.FeSO4',
      type: 'substance',
      name: '硫酸亚铁',
      specialtyCodes: ['substance', 'memory', 'ion'],
      categoryCodes: ['substance.formula', 'substance.chem_property'],
      priority: 1,
      curriculumScope: '必修第一册·铁及其化合物（亚铁盐代表）',
      note: '增补；亚铁盐代表物；与 sub.FeCl3（铁盐）对照',
    }),
    it({
      code: 'kp.Fe.fe2_property',
      type: 'knowledge',
      name: 'Fe²⁺的性质',
      specialtyCodes: ['ion', 'redox', 'substance'],
      categoryCodes: ['ion.ion_test', 'redox.ox_re_ability', 'substance.chem_property'],
      priority: 1,
      curriculumScope: '必修第一册·铁及其化合物',
      note: '增补；还原性、浅绿色水溶液等',
    }),
    it({
      code: 'kp.Fe.fe3_property',
      type: 'knowledge',
      name: 'Fe³⁺的性质',
      specialtyCodes: ['ion', 'redox', 'substance'],
      categoryCodes: ['ion.ion_test', 'redox.ox_re_ability', 'substance.chem_property'],
      priority: 1,
      curriculumScope: '必修第一册·铁及其化合物',
      note: '增补；氧化性、黄色/棕黄色溶液等',
    }),
    it({
      code: 'kp.Fe.fe2_fe3',
      type: 'knowledge',
      name: 'Fe²⁺与Fe³⁺的转化',
      specialtyCodes: ['redox', 'ion', 'equation'],
      categoryCodes: ['redox.identify', 'equation.redox_analysis', 'ion.mixed'],
      priority: 1,
      curriculumScope: '必修第一册·铁及其化合物',
      note: '增补；通论知识点；具体代表反应另建反应条',
    }),
    it({
      code: 'kp.Fe.test',
      type: 'knowledge',
      name: 'Fe²⁺与Fe³⁺的检验',
      specialtyCodes: ['ion', 'experiment', 'memory'],
      categoryCodes: ['ion.ion_test', 'experiment.substance_test', 'memory.color'],
      priority: 1,
      curriculumScope: '必修第一册·铁及其化合物',
      note: '增补；KSCN、碱沉淀颜色等；实验细节见 exp.Fe3_SCN',
    }),
    it({
      code: 'kp.Fe.salt',
      type: 'knowledge',
      name: '亚铁盐与铁盐',
      specialtyCodes: ['substance', 'memory', 'ion'],
      categoryCodes: ['substance.chem_property', 'memory.ions'],
      priority: 1,
      curriculumScope: '必修第一册·铁及其化合物',
      note: '增补；概括两类盐；代表物见 sub.FeSO4 / sub.FeCl3',
    }),
    it({
      code: 'rxn.FeOH2_O2',
      type: 'reaction',
      name: '氢氧化亚铁被氧气氧化',
      specialtyCodes: ['equation', 'redox', 'substance'],
      categoryCodes: ['equation.write_from_text', 'equation.condition', 'redox_analysis'],
      priority: 1,
      curriculumScope: '必修第一册·铁及其化合物',
      note: '增补；空气中氧化；方程式写法建设时待核实总式表述',
      verifyNeeded: true,
    }),
    it({
      code: 'rxn.2Fe2_Cl2',
      type: 'reaction',
      name: '亚铁离子被氯气氧化',
      specialtyCodes: ['equation', 'redox', 'ion'],
      categoryCodes: ['equation.ionic_write', 'redox.identify', 'ion.mixed'],
      priority: 1,
      curriculumScope: '必修第一册·铁及其化合物',
      note: '增补；代表反应 2Fe²⁺+Cl₂=2Fe³⁺+2Cl⁻；canonical建设时核对',
    }),
    it({
      code: 'exp.Fe3_SCN',
      type: 'experiment',
      name: 'Fe³⁺与KSCN的检验',
      specialtyCodes: ['experiment', 'ion', 'substance'],
      categoryCodes: ['experiment.substance_test', 'ion.ion_test', 'experiment.phenomenon_desc'],
      priority: 1,
      curriculumScope: '必修第一册·铁及其化合物',
      note: '增补；血红色现象',
    }),
    it({
      code: 'concept.alloy',
      type: 'concept',
      name: '合金',
      specialtyCodes: ['substance', 'memory'],
      categoryCodes: ['substance.chem_property', 'memory.rules'],
      priority: 1,
      curriculumScope: '必修第一册·金属材料',
      note: '增补；混合物、性能优于纯金属等',
    }),
    it({
      code: 'kp.metal.pig_iron',
      type: 'knowledge',
      name: '生铁',
      specialtyCodes: ['substance', 'memory'],
      categoryCodes: ['substance.chem_property', 'memory.common_name'],
      priority: 1,
      curriculumScope: '必修第一册·金属材料',
      note: '增补；含碳量范围、脆性、用途等教材口径',
    }),
    it({
      code: 'kp.metal.steel',
      type: 'knowledge',
      name: '钢',
      specialtyCodes: ['substance', 'memory'],
      categoryCodes: ['substance.chem_property', 'memory.common_name'],
      priority: 1,
      curriculumScope: '必修第一册·金属材料',
      note: '增补；与生铁含碳量及性能区别',
    }),
    it({
      code: 'kp.metal.stainless',
      type: 'knowledge',
      name: '不锈钢',
      specialtyCodes: ['substance', 'memory'],
      categoryCodes: ['substance.chem_property', 'memory.common_name'],
      priority: 2,
      curriculumScope: '必修第一册·金属材料（了解）',
      note: '增补；了解级：含铬等提高抗腐蚀；勿展开铬酸盐深度化学',
    }),
    it({
      code: 'sub.NaAlO2',
      type: 'substance',
      name: '偏铝酸钠',
      specialtyCodes: ['substance', 'ion', 'memory'],
      categoryCodes: ['substance.formula', 'substance.chem_property', 'substance.conversion'],
      priority: 1,
      curriculumScope: '必修第一册·铝及其化合物',
      note: '增补；两性转化枢纽；溶液中存在形式表述建设时注意',
      verifyNeeded: true,
    }),
    it({
      code: 'sub.AlCl3',
      type: 'substance',
      name: '氯化铝',
      specialtyCodes: ['substance', 'memory', 'ion'],
      categoryCodes: ['substance.formula', 'substance.chem_property'],
      priority: 1,
      curriculumScope: '必修第一册·铝及其化合物（铝盐代表）',
      note: '增补；铝盐代表',
    }),
    it({
      code: 'rxn.Na2CO3_CO2_H2O',
      type: 'reaction',
      name: '碳酸钠转化为碳酸氢钠',
      specialtyCodes: ['equation', 'substance'],
      categoryCodes: ['equation.write_from_text', 'equation.conversion', 'substance.conversion'],
      priority: 1,
      curriculumScope: '必修第一册·钠及其化合物',
      note: '增补；Na2CO3+CO2+H2O=2NaHCO3；与 kp.Na.carbonate 关联',
    }),
    it({
      code: 'rxn.2Na_2HCl',
      type: 'reaction',
      name: '钠与盐酸反应',
      specialtyCodes: ['equation', 'redox', 'substance'],
      categoryCodes: ['equation.write_from_text', 'equation.redox_analysis'],
      priority: 2,
      curriculumScope: '必修第一册·钠及其化合物',
      note: '增补；与钠和水对比；实验安全性建设时强调',
    }),
    it({
      code: 'kp.Al.salt_aluminate',
      type: 'knowledge',
      name: '铝盐与偏铝酸盐转化',
      specialtyCodes: ['substance', 'equation', 'ion'],
      categoryCodes: ['substance.conversion', 'equation.conversion', 'ion.mixed'],
      priority: 1,
      curriculumScope: '必修第一册·铝及其化合物',
      note: '增补；与 kp.Al.amphoteric 互补，侧重盐类转化',
    }),
  ],
  batch4: [
    it({
      code: 'sub.Br2',
      type: 'substance',
      name: '溴',
      specialtyCodes: ['substance', 'memory', 'periodic'],
      categoryCodes: ['substance.formula', 'substance.color', 'substance.state', 'memory.color'],
      priority: 2,
      curriculumScope: '必修·卤族元素性质比较（了解+实验相关）',
      note: '增补；单质枢纽；勿展开复杂溴含氧酸体系',
    }),
    it({
      code: 'sub.I2',
      type: 'substance',
      name: '碘',
      specialtyCodes: ['substance', 'memory', 'experiment'],
      categoryCodes: ['substance.formula', 'substance.color', 'substance.test', 'memory.color'],
      priority: 2,
      curriculumScope: '必修·卤族元素性质比较（了解+淀粉变蓝）',
      note: '增补；淀粉变蓝；勿把 +5/+7 作为默认必修训练核心',
    }),
    it({
      code: 'sub.bleaching_powder',
      type: 'substance',
      name: '漂白粉',
      specialtyCodes: ['substance', 'memory'],
      categoryCodes: ['substance.chem_property', 'substance.usage', 'memory.common_name'],
      priority: 2,
      curriculumScope: '必修第一册·氯及其化合物（了解）',
      note: '增补；主要成分表述（次氯酸钙等）建设时待核实教材口径',
      verifyNeeded: true,
    }),
    it({
      code: 'kp.S.conc_H2SO4',
      type: 'knowledge',
      name: '浓硫酸的特性',
      specialtyCodes: ['substance', 'equation', 'experiment'],
      categoryCodes: ['substance.chem_property', 'equation.condition', 'experiment.safety'],
      priority: 1,
      curriculumScope: '必修第二册相关·硫及其化合物 / 必修常见物质性质',
      note: '增补；吸水性、脱水性、强氧化性；与稀硫酸对比',
    }),
    it({
      code: 'kp.N.ammonium',
      type: 'knowledge',
      name: '铵盐的性质',
      specialtyCodes: ['substance', 'equation', 'ion'],
      categoryCodes: ['substance.chem_property', 'equation.write_from_text', 'ion.mixed'],
      priority: 1,
      curriculumScope: '必修·氮及其化合物',
      note: '增补；受热分解、与碱反应等',
    }),
    it({
      code: 'rxn.NH4Cl_NaOH',
      type: 'reaction',
      name: '氯化铵与氢氧化钠反应',
      specialtyCodes: ['equation', 'substance', 'experiment'],
      categoryCodes: ['equation.write_from_text', 'experiment.substance_test'],
      priority: 1,
      curriculumScope: '必修·氮及其化合物（铵盐检验/性质）',
      note: '增补；加热生成氨气的代表反应',
    }),
    it({
      code: 'kp.halogen.compare',
      type: 'knowledge',
      name: '卤族元素性质比较',
      specialtyCodes: ['periodic', 'substance', 'memory'],
      categoryCodes: ['periodic.nonmetal_compare', 'substance.chem_property', 'memory.rules'],
      priority: 2,
      curriculumScope: '必修·氯为主，溴碘了解比较',
      note: '增补；单质氧化性、氢化物稳定性等递变；深度含氧酸标了解/勿超纲',
    }),
    it({
      code: 'kp.N.synth_ammonia',
      type: 'knowledge',
      name: '合成氨反应条件与可逆性',
      specialtyCodes: ['equation', 'substance'],
      categoryCodes: ['equation.condition', 'substance.chem_property'],
      priority: 2,
      curriculumScope: '必修·氮及其化合物；关联化学反应限度',
      note: '增补；挂接已有 rxn.N2_3H2；条件与限度表述勿写成选修平衡计算',
    }),
    it({
      code: 'kp.Cl.bleach',
      type: 'knowledge',
      name: '氯水与漂白原理',
      specialtyCodes: ['substance', 'equation', 'experiment'],
      categoryCodes: ['substance.chem_property', 'equation.condition'],
      priority: 2,
      curriculumScope: '必修第一册·氯及其化合物',
      note: '增补；次氯酸漂白；与 SO2 漂白对比见 batch4 实验',
    }),
  ],
  batch5: [
    it({
      code: 'kp.exp.gas_wash_dry',
      type: 'knowledge',
      name: '气体的洗涤与干燥',
      specialtyCodes: ['experiment'],
      categoryCodes: ['experiment.apparatus_link', 'experiment.gas_collect', 'experiment.plan_design'],
      priority: 1,
      curriculumScope: '必修·化学实验基础',
      note: '增补；试剂选择与顺序',
    }),
    it({
      code: 'exp.ops_volumetric_flask',
      type: 'experiment',
      name: '容量瓶定容操作',
      specialtyCodes: ['experiment', 'calculation'],
      categoryCodes: ['experiment.basic_ops', 'experiment.instrument_use'],
      priority: 1,
      curriculumScope: '必修·化学实验基础 / 物质的量浓度配制',
      note: '增补',
    }),
    it({
      code: 'exp.ops_burette',
      type: 'experiment',
      name: '滴定管认知与基本操作',
      specialtyCodes: ['experiment'],
      categoryCodes: ['experiment.instrument_id', 'experiment.basic_ops'],
      priority: 2,
      curriculumScope: '必修实验仪器了解（深度待核实）',
      note: '增补；是否作为必修核心训练待核实，避免按分析化学滴定展开',
      verifyNeeded: true,
    }),
    it({
      code: 'exp.flame_test',
      type: 'experiment',
      name: '焰色反应',
      specialtyCodes: ['experiment', 'substance', 'memory'],
      categoryCodes: ['experiment.substance_test', 'substance.test', 'memory.color'],
      priority: 1,
      curriculumScope: '必修第一册·钠及其化合物（焰色）',
      note: '增补；主知识在实验批；金属批通过关联引用',
    }),
    it({
      code: 'formula.rate_v',
      type: 'formula',
      name: '化学反应速率定义式',
      specialtyCodes: ['calculation'],
      categoryCodes: ['calculation.mixed'],
      priority: 2,
      curriculumScope: '必修第二册·化学反应速率（入门）',
      note: '增补；v=Δc/Δt；单位与平均速率口径建设时写清',
    }),
    it({
      code: 'kp.rate.factors',
      type: 'knowledge',
      name: '影响化学反应速率的因素',
      specialtyCodes: ['experiment', 'comprehensive'],
      categoryCodes: ['experiment.inquiry', 'comprehensive.basic'],
      priority: 1,
      curriculumScope: '必修第二册·化学反应速率',
      note: '增补；浓度、温度、催化剂、接触面积等；关联已有 concept.reaction_rate',
    }),
    it({
      code: 'concept.reversible',
      type: 'concept',
      name: '可逆反应',
      specialtyCodes: ['equation', 'memory'],
      categoryCodes: ['equation.condition', 'memory.rules'],
      priority: 1,
      curriculumScope: '必修第二册·化学反应限度相关',
      note: '增补；与 concept.reaction_extent 互补',
    }),
    it({
      code: 'kp.extent.le_chatelier_basic',
      type: 'knowledge',
      name: '化学反应限度与条件影响（定性）',
      specialtyCodes: ['comprehensive'],
      categoryCodes: ['comprehensive.basic'],
      priority: 2,
      curriculumScope: '必修第二册·化学反应限度（定性；深度待核实）',
      note: '增补；仅定性认识；禁止按选修平衡计算展开',
      verifyNeeded: true,
    }),
  ],
  batch6: [
    it({
      code: 'concept.endothermic',
      type: 'concept',
      name: '吸热反应',
      specialtyCodes: ['memory', 'comprehensive'],
      categoryCodes: ['memory.rules', 'comprehensive.basic'],
      priority: 1,
      curriculumScope: '必修第二册·化学反应与能量',
      note: '增补',
    }),
    it({
      code: 'concept.exothermic',
      type: 'concept',
      name: '放热反应',
      specialtyCodes: ['memory', 'comprehensive'],
      categoryCodes: ['memory.rules', 'comprehensive.basic'],
      priority: 1,
      curriculumScope: '必修第二册·化学反应与能量',
      note: '增补',
    }),
    it({
      code: 'kp.energy.bond_change',
      type: 'knowledge',
      name: '化学键与能量变化',
      specialtyCodes: ['structure', 'comprehensive'],
      categoryCodes: ['structure.ionic_bond', 'structure.covalent_bond', 'comprehensive.basic'],
      priority: 1,
      curriculumScope: '必修第二册·化学反应与能量',
      note: '增补；断键吸热、成键放热（中学口径）',
    }),
    it({
      code: 'kp.energy.chem_electric',
      type: 'knowledge',
      name: '化学能与电能',
      specialtyCodes: ['comprehensive', 'redox'],
      categoryCodes: ['comprehensive.basic', 'redox.e_transfer'],
      priority: 1,
      curriculumScope: '必修第二册·化学反应与能量',
      note: '增补',
    }),
    it({
      code: 'kp.energy.galvanic',
      type: 'knowledge',
      name: '原电池',
      specialtyCodes: ['redox', 'experiment', 'comprehensive'],
      categoryCodes: ['redox.e_direction', 'experiment.inquiry', 'comprehensive.basic'],
      priority: 1,
      curriculumScope: '必修第二册·原电池',
      note: '增补；构成条件总论',
    }),
    it({
      code: 'kp.energy.galvanic_poles',
      type: 'knowledge',
      name: '原电池正负极',
      specialtyCodes: ['redox', 'comprehensive'],
      categoryCodes: ['redox.e_direction', 'comprehensive.basic'],
      priority: 1,
      curriculumScope: '必修第二册·原电池',
      note: '增补',
    }),
    it({
      code: 'kp.energy.electron_flow',
      type: 'knowledge',
      name: '原电池电子流向',
      specialtyCodes: ['redox', 'comprehensive'],
      categoryCodes: ['redox.e_direction', 'comprehensive.basic'],
      priority: 1,
      curriculumScope: '必修第二册·原电池',
      note: '增补；外电路电子由负极到正极',
    }),
    it({
      code: 'kp.energy.electrode_rxn',
      type: 'knowledge',
      name: '原电池电极反应',
      specialtyCodes: ['redox', 'equation', 'comprehensive'],
      categoryCodes: ['redox.identify', 'equation.ionic_write', 'comprehensive.basic'],
      priority: 1,
      curriculumScope: '必修第二册·原电池',
      note: '增补',
    }),
    it({
      code: 'kp.energy.chem_power',
      type: 'knowledge',
      name: '常见化学电源',
      specialtyCodes: ['comprehensive', 'memory'],
      categoryCodes: ['comprehensive.basic', 'memory.rules'],
      priority: 2,
      curriculumScope: '必修第二册·化学电源（了解）',
      note: '增补；了解级，勿展开复杂电化学工程',
    }),
    it({
      code: 'exp.galvanic_Zn_Cu',
      type: 'experiment',
      name: '铜锌原电池实验',
      specialtyCodes: ['experiment', 'redox'],
      categoryCodes: ['experiment.inquiry', 'experiment.phenomenon_desc', 'redox.e_direction'],
      priority: 1,
      curriculumScope: '必修第二册·原电池',
      note: '增补；典型教学实验',
    }),
    it({
      code: 'concept.heat_of_reaction',
      type: 'concept',
      name: '反应热',
      specialtyCodes: ['comprehensive', 'memory'],
      categoryCodes: ['comprehensive.basic', 'memory.rules'],
      priority: 2,
      curriculumScope: '必修第二册·化学反应与能量',
      note: '增补；燃烧热/中和热等概念级；计算深度待核实',
      verifyNeeded: true,
    }),
    it({
      code: 'kp.energy.thermo_eq',
      type: 'knowledge',
      name: '热化学方程式书写',
      specialtyCodes: ['equation', 'comprehensive'],
      categoryCodes: ['equation.write_from_text', 'equation.condition', 'comprehensive.basic'],
      priority: 2,
      curriculumScope: '必修第二册·化学反应与能量',
      note: '增补；注明物质聚集状态与ΔH 符号口径',
    }),
    it({
      code: 'kp.sustain.seawater',
      type: 'knowledge',
      name: '海水资源开发',
      specialtyCodes: ['comprehensive', 'substance'],
      categoryCodes: ['comprehensive.basic', 'substance.usage'],
      priority: 2,
      curriculumScope: '必修第二册·化学与可持续发展',
      note: '增补',
    }),
    it({
      code: 'kp.sustain.coal',
      type: 'knowledge',
      name: '煤的综合利用',
      specialtyCodes: ['comprehensive', 'organic'],
      categoryCodes: ['comprehensive.basic', 'organic.basic'],
      priority: 2,
      curriculumScope: '必修第二册·化学与可持续发展',
      note: '增补',
    }),
    it({
      code: 'kp.organic.petroleum',
      type: 'knowledge',
      name: '石油分馏',
      specialtyCodes: ['organic', 'comprehensive'],
      categoryCodes: ['organic.basic', 'comprehensive.basic'],
      priority: 1,
      curriculumScope: '必修第二册·有机 / 可持续发展',
      note: '增补；物理变化认识',
    }),
    it({
      code: 'kp.organic.cracking',
      type: 'knowledge',
      name: '石油裂化',
      specialtyCodes: ['organic', 'comprehensive'],
      categoryCodes: ['organic.basic', 'comprehensive.basic'],
      priority: 2,
      curriculumScope: '必修第二册·有机化学相关（了解深度待核实）',
      note: '增补；与裂解区分；深度待核实',
      verifyNeeded: true,
    }),
    it({
      code: 'kp.organic.pyrolysis',
      type: 'knowledge',
      name: '石油裂解',
      specialtyCodes: ['organic', 'comprehensive'],
      categoryCodes: ['organic.basic', 'comprehensive.basic'],
      priority: 2,
      curriculumScope: '必修第二册·有机化学相关（了解深度待核实）',
      note: '增补；与裂化区分；深度待核实',
      verifyNeeded: true,
    }),
    it({
      code: 'kp.sustain.natural_gas',
      type: 'knowledge',
      name: '天然气利用',
      specialtyCodes: ['comprehensive', 'organic'],
      categoryCodes: ['comprehensive.basic', 'organic.methane'],
      priority: 2,
      curriculumScope: '必修第二册·化学与可持续发展',
      note: '增补',
    }),
    it({
      code: 'kp.sustain.fertilizer',
      type: 'knowledge',
      name: '化肥合理使用',
      specialtyCodes: ['comprehensive'],
      categoryCodes: ['comprehensive.basic'],
      priority: 2,
      curriculumScope: '必修第二册·化学与可持续发展',
      note: '增补',
    }),
    it({
      code: 'kp.sustain.pesticide',
      type: 'knowledge',
      name: '农药合理使用',
      specialtyCodes: ['comprehensive'],
      categoryCodes: ['comprehensive.basic'],
      priority: 2,
      curriculumScope: '必修第二册·化学与可持续发展',
      note: '增补',
    }),
    it({
      code: 'kp.sustain.medicine',
      type: 'knowledge',
      name: '药物合理使用',
      specialtyCodes: ['comprehensive'],
      categoryCodes: ['comprehensive.basic'],
      priority: 2,
      curriculumScope: '必修第二册·化学与可持续发展',
      note: '增补',
    }),
    it({
      code: 'kp.sustain.food_additive',
      type: 'knowledge',
      name: '食品添加剂',
      specialtyCodes: ['comprehensive'],
      categoryCodes: ['comprehensive.basic'],
      priority: 2,
      curriculumScope: '必修第二册·化学与可持续发展',
      note: '增补；合理使用与安全认知',
    }),
    it({
      code: 'kp.enviro.pollution',
      type: 'knowledge',
      name: '环境污染与防治认知',
      specialtyCodes: ['comprehensive'],
      categoryCodes: ['comprehensive.basic'],
      priority: 2,
      curriculumScope: '必修第二册·化学与可持续发展',
      note: '增补',
    }),
    it({
      code: 'kp.enviro.acid_rain',
      type: 'knowledge',
      name: '酸雨',
      specialtyCodes: ['comprehensive', 'substance'],
      categoryCodes: ['comprehensive.basic', 'substance.chem_property'],
      priority: 1,
      curriculumScope: '必修·硫氮氧化物与可持续发展',
      note: '增补；主知识在综合批；非金属批通过关联引用',
    }),
    it({
      code: 'kp.sustain.green_chem',
      type: 'knowledge',
      name: '绿色化学',
      specialtyCodes: ['comprehensive'],
      categoryCodes: ['comprehensive.basic'],
      priority: 1,
      curriculumScope: '必修第二册·化学与可持续发展',
      note: '增补',
    }),
    it({
      code: 'kp.sustain.atom_economy',
      type: 'knowledge',
      name: '原子经济性',
      specialtyCodes: ['comprehensive', 'calculation'],
      categoryCodes: ['comprehensive.basic', 'calculation.mixed'],
      priority: 2,
      curriculumScope: '必修第二册·绿色化学相关',
      note: '增补；概念级；计算题深度待核实',
      verifyNeeded: true,
    }),
    it({
      code: 'concept.addition_polymer',
      type: 'concept',
      name: '加成聚合',
      specialtyCodes: ['organic'],
      categoryCodes: ['organic.addition', 'organic.basic'],
      priority: 1,
      curriculumScope: '必修第二册·有机聚合物初步',
      note: '增补；如聚乙烯；与乙烯关联',
    }),
    it({
      code: 'kp.organic.biomolecule',
      type: 'knowledge',
      name: '生命中的基本有机物（了解）',
      specialtyCodes: ['organic', 'comprehensive'],
      categoryCodes: ['organic.basic', 'comprehensive.basic'],
      priority: 3,
      curriculumScope: '必修第二册·化学与可持续发展/有机（了解；待核实覆盖深度）',
      note: '增补；糖类油脂蛋白质认知级；勿展开生物详细代谢',
      verifyNeeded: true,
    }),
    it({
      code: 'rxn.C2H4_KMnO4',
      type: 'reaction',
      name: '乙烯使酸性高锰酸钾褪色',
      specialtyCodes: ['organic', 'equation', 'experiment'],
      categoryCodes: ['organic.oxidation', 'equation.write_from_text', 'experiment.phenomenon_judge'],
      priority: 1,
      curriculumScope: '必修第二册·乙烯',
      note: '增补；现象与鉴别用途；详细产物勿超纲展开',
    }),
  ],
}

// Fix category code typo for rxn.FeOH2_O2 - used redox_analysis without specialty prefix
SUPPLEMENT.batch3 = SUPPLEMENT.batch3.map((x) => {
  if (x.code === 'rxn.FeOH2_O2') {
    return {
      ...x,
      categoryCodes: ['equation.write_from_text', 'equation.condition', 'equation.redox_analysis'],
    }
  }
  return x
})

function recount(inv) {
  const byBatch = {}
  const byType = {}
  const byStatus = {}
  let total = 0
  for (const b of inv.batches) {
    byBatch[b.id] = b.items.length
    total += b.items.length
    for (const it of b.items) {
      byType[it.type] = (byType[it.type] || 0) + 1
      byStatus[it.status] = (byStatus[it.status] || 0) + 1
    }
  }
  return { total, byBatch, byType, byStatus }
}

function specialtyCoverage(inv) {
  const specs = [
    'equation',
    'experiment',
    'substance',
    'calculation',
    'ion',
    'redox',
    'periodic',
    'structure',
    'organic',
    'inference',
    'memory',
    'comprehensive',
  ]
  const map = Object.fromEntries(specs.map((s) => [s, { count: 0, codes: [] }]))
  for (const b of inv.batches) {
    for (const it of b.items) {
      for (const s of it.specialtyCodes || []) {
        if (!map[s]) map[s] = { count: 0, codes: [] }
        map[s].count++
        if (map[s].codes.length < 8) map[s].codes.push(it.code)
      }
    }
  }
  return map
}

function renderMd(inv) {
  const s = inv.summary
  const lines = []
  lines.push('# 高一化学知识库 · 完整知识清单')
  lines.push('')
  lines.push('> 阶段三知识规划清单（编码+名称级）。机器可读副本：[chemistry_kb_inventory.json](./chemistry_kb_inventory.json)')
  lines.push('> 2026-10-18 增补见 [CHEMISTRY_INVENTORY_SUPPLEMENT_REPORT.md](./CHEMISTRY_INVENTORY_SUPPLEMENT_REPORT.md)')
  lines.push('')
  lines.push('## 汇总')
  lines.push('')
  lines.push('| 指标 | 数量 |')
  lines.push('|------|------|')
  lines.push(`| 条目总计 | ${s.total} |`)
  for (const b of inv.batches) {
    lines.push(`| ${b.id} | ${b.items.length} |`)
  }
  lines.push('')
  lines.push('### 按知识类型')
  lines.push('')
  lines.push('| 类型 | 数量 |')
  lines.push('|------|------|')
  for (const [t, n] of Object.entries(s.byType).sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`| ${t} | ${n} |`)
  }
  lines.push('')
  lines.push('### 按状态')
  lines.push('')
  lines.push('| 状态 | 数量 |')
  lines.push('|------|------|')
  for (const [st, n] of Object.entries(s.byStatus).sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`| ${st} | ${n} |`)
  }
  lines.push('')
  lines.push('## 字段说明')
  lines.push('')
  lines.push('- `code`：稳定唯一编码')
  lines.push('- `type`：八类知识实体之一')
  lines.push('- `specialtyCodes` / `categoryCodes`：专项与二级分类')
  lines.push('- `priority`：1 高 / 2 中 / 3 低')
  lines.push('- `status`：pending / seeded / seeded_audited / imported 等')
  lines.push('- `curriculumScope`：课程范围依据（增补条目）')
  lines.push('- `verifyNeeded`：是否待人工核实是否属必修核心深度')
  lines.push('')

  for (const b of inv.batches) {
    lines.push(`## ${b.id} · ${b.name}`)
    lines.push('')
    lines.push(`本批 ${b.items.length} 条。`)
    lines.push('')
    const byType = {}
    for (const item of b.items) {
      if (!byType[item.type]) byType[item.type] = []
      byType[item.type].push(item)
    }
    for (const [type, items] of Object.entries(byType)) {
      lines.push(`### ${type}`)
      lines.push('')
      lines.push('| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |')
      lines.push('|------|------|------|--------|------|------|')
      for (const item of items) {
        const note = (item.note || '').replace(/\|/g, '/')
        lines.push(
          `| \`${item.code}\` | ${item.name} | ${(item.specialtyCodes || []).join(',')} | ${item.priority} | ${item.status} | ${note} |`,
        )
      }
      lines.push('')
    }
  }

  // Keep appendix by reading old md after marker if present
  const old = fs.readFileSync(mdPath, 'utf8')
  const idx = old.indexOf('## 附录 · 12 专项与二级分类 code')
  if (idx >= 0) {
    lines.push(old.slice(idx).trimEnd())
    lines.push('')
  }
  return lines.join('\n') + '\n'
}

function main() {
  const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'))
  const beforeTotal = inv.summary.total
  const existing = new Set()
  for (const b of inv.batches) for (const x of b.items) existing.add(x.code)

  const addedByBatch = {}
  const verifyList = []
  let added = 0

  for (const b of inv.batches) {
    const list = SUPPLEMENT[b.id] || []
    addedByBatch[b.id] = 0
    for (const neu of list) {
      if (existing.has(neu.code)) {
        throw new Error('duplicate code: ' + neu.code)
      }
      // fix invalid category if any
      b.items.push(neu)
      existing.add(neu.code)
      addedByBatch[b.id]++
      added++
      if (neu.verifyNeeded) verifyList.push(neu)
    }
  }

  // rename batch6 for clarity
  const b6 = inv.batches.find((x) => x.id === 'batch6')
  if (b6) b6.name = '有机、能量及综合知识'

  const counts = recount(inv)
  inv.summary = {
    ...inv.summary,
    ...counts,
    previousTotal: beforeTotal,
    supplement: {
      addedAt: '2026-10-18T12:07:49+08:00',
      addedCount: added,
      addedByBatch,
      verifyNeededCount: verifyList.length,
      basedOn: ['CHEMISTRY_INVENTORY_GAP_REPORT.md', 'CHEMISTRY_QUALITY_STANDARD.md'],
    },
  }
  inv.generatedFor = 'phase3-inventory-supplement-2026-10-18'
  inv.version = 2

  fs.writeFileSync(invPath, JSON.stringify(inv, null, 2) + '\n', 'utf8')
  fs.writeFileSync(mdPath, renderMd(inv), 'utf8')

  const cov = specialtyCoverage(inv)
  const report = []
  report.push('# 高一化学知识库 · 清单增补报告')
  report.push('')
  report.push('> 日期：2026-10-18')
  report.push('> 性质：**仅更新知识规划清单**；未生成正式知识数据、未导入数据库。')
  report.push('> 依据：`CHEMISTRY_INVENTORY_GAP_REPORT.md`、必修课程范围、质量标准。')
  report.push('')
  report.push('## 1. 数量总览')
  report.push('')
  report.push('| 指标 | 数量 |')
  report.push('|------|------|')
  report.push(`| 原始知识数量 | **${beforeTotal}** |`)
  report.push(`| 新增知识数量 | **${added}** |`)
  report.push(`| 更新后知识总数量 | **${counts.total}** |`)
  report.push(`| Batch3 新增 | **${addedByBatch.batch3 || 0}**（现 ${counts.byBatch.batch3}） |`)
  report.push(`| Batch4 新增 | **${addedByBatch.batch4 || 0}**（现 ${counts.byBatch.batch4}） |`)
  report.push(`| Batch5 新增 | **${addedByBatch.batch5 || 0}**（现 ${counts.byBatch.batch5}） |`)
  report.push(`| Batch6 新增 | **${addedByBatch.batch6 || 0}**（现 ${counts.byBatch.batch6}） |`)
  report.push('| Batch2 新增 | 0（未改） |')
  report.push('')
  report.push('## 2. 保留与约束')
  report.push('')
  report.push('- 原有 311 条编码**全部保留**，无删除。')
  report.push('- 新增编码均唯一，经与现有集合碰撞检查。')
  report.push('- 跨批次主题（如焰色反应、酸雨）只建一条主知识，其他批次建设时用关联引用。')
  report.push('- `kp.metal.smelting`（金属冶炼）原已在 Batch3，本次不重复新建。')
  report.push('- `concept.reaction_rate` / `concept.reaction_extent` 原已在 Batch2，本次以互补条目补充（因素、可逆反应、定性限度）。')
  report.push('')
  report.push('## 3. 新增条目明细')
  report.push('')

  for (const [bid, list] of Object.entries(SUPPLEMENT)) {
    report.push(`### ${bid}（+${list.length}）`)
    report.push('')
    report.push('| 编码 | 名称 | 类型 | 重要程度 | 专项 | 二级分类 | 课程范围 | 待核实 |')
    report.push('|------|------|------|----------|------|----------|----------|--------|')
    for (const x of list) {
      report.push(
        `| \`${x.code}\` | ${x.name} | ${x.type} | ${x.priority} | ${(x.specialtyCodes || []).join(',') || '—'} | ${(x.categoryCodes || []).join(',') || '—'} | ${x.curriculumScope || '—'} | ${x.verifyNeeded ? '是' : '否'} |`,
      )
    }
    report.push('')
  }

  report.push('## 4. 各专项知识覆盖情况（更新后）')
  report.push('')
  report.push('| 专项 | 关联条目数（可多重关联） | 覆盖简评 |')
  report.push('|------|--------------------------|----------|')
  const comments = {
    equation: '金属/非金属反应增补后方程素材更完整；能量热化学式新增',
    experiment: '补洗气干燥、定容、焰色、Fe³⁺检验、原电池实验',
    substance: '铁系/铝盐/卤素单质/漂白粉等物质枢纽增强',
    calculation: '补速率定义式；原子经济性概念级挂接',
    ion: 'Fe²⁺/Fe³⁺性质、检验与转化增强',
    redox: '铁转化与原电池相关增强',
    periodic: '卤族比较知识点增强',
    structure: '能量章化学键与能量变化挂接',
    organic: '石油分馏/裂化/裂解、加聚、乙烯鉴别增强',
    inference: '仍主要依赖综合骨架；物质反应充实后方能真正组卷',
    memory: '合金材料与颜色/俗称类增强',
    comprehensive: '可持续发展与能量章主体落在此专项',
  }
  for (const [s, info] of Object.entries(cov)) {
    report.push(`| ${s} | ${info.count} | ${comments[s] || '—'} |`)
  }
  report.push('')
  report.push('### 覆盖偏薄但仍可接受的专项')
  report.push('')
  report.push('- **inference（推断）**：清单以策略型知识点与题骨架为主，依赖 Batch3/4 物质反应数据建设后串联。')
  report.push('- **calculation（计算）**：公式主体在 Batch2/5；本次仅补速率定义式，未扩选修计算。')
  report.push('')
  report.push('## 5. 仍需人工核实的内容')
  report.push('')
  report.push('| 编码 | 名称 | 核实点 |')
  report.push('|------|------|--------|')
  for (const x of verifyList) {
    report.push(`| \`${x.code}\` | ${x.name} | ${x.note} |`)
  }
  report.push('')
  report.push('以上条目**不能**直接认定为已确认的必修核心深度；建设前需对照所用教材版本。')
  report.push('')
  report.push('## 6. 是否仍有尚未覆盖的高一核心知识')
  report.push('')
  report.push('本次增补后，质量缺口报告中的 **P2 级主缺口**（铁系完整性、金属材料、原电池/能量、可持续发展、卤素单质枢纽、关键实验操作）已进入清单。')
  report.push('')
  report.push('仍可能存在的**非阻断性**缺口（建议后续人工课标对照，不在本次强行扩编）：')
  report.push('')
  report.push('1. 个别地区教材对「蒸馏/萃取」必修深度不一（Batch5 已有认知条，是否升格待定）。')
  report.push('2. 胶体专项实验（丁达尔）仅有概念，可按需补实验条。')
  report.push('3. 氮肥/磷肥/钾肥分条（本次化肥为综合条）。')
  report.push('4. 具体品牌化学电源结构细节（刻意保持了解级）。')
  report.push('5. 硅酸盐工业（玻璃/水泥）若教材强调，可再补 1–2 条了解级知识点。')
  report.push('')
  report.push('## 7. 未纳入本次清单的内容（防超纲）')
  report.push('')
  report.push('- 选择性必修化学反应原理中的定量平衡常数、活化能计算等')
  report.push('- 铬酸盐/重铬酸盐深度氧化还原（不锈钢仅了解）')
  report.push('- 碘/溴的高价含氧酸体系作为默认核心')
  report.push('- 氢氟酸专项（边缘，不强制）')
  report.push('')
  report.push('## 8. 下一步（等待指令）')
  report.push('')
  report.push('- 可对 `verifyNeeded=true` 条目做课标确认')
  report.push('- 确认后再启动 Batch3 **数据**建设与安全导入')
  report.push('- 本次**停止**：不生成知识正文、不导入数据库')
  report.push('')

  fs.writeFileSync(reportPath, report.join('\n'), 'utf8')

  console.log(
    JSON.stringify(
      {
        beforeTotal,
        added,
        afterTotal: counts.total,
        addedByBatch,
        verifyNeeded: verifyList.map((x) => x.code),
      },
      null,
      2,
    ),
  )
}

main()
