/**
 * Patch batch4_content.js for Batch4 quality remediation.
 */
'use strict'
const fs = require('fs')
const path = require('path')

const contentPath = path.join(__dirname, '../chemistry_batch4/batch4_content.js')
let src = fs.readFileSync(contentPath, 'utf8')
let fail = 0

function replaceOnce(label, oldSnippet, newSnippet) {
  if (!src.includes(oldSnippet)) {
    console.error('MISSING:', label)
    fail++
    return
  }
  src = src.replace(oldSnippet, newSnippet)
  console.log('OK:', label)
}

replaceOnce(
  'sub.Cl2.chemicalProps',
  '"chemicalProps": "强氧化性。与H2光照或点燃生成HCl；与多数金属反应生成氯化物；与水：Cl2+H2O⇌HCl+HClO（可逆，有限）；与碱：Cl2+2NaOH=NaCl+NaClO+H2O。湿润氯气有漂白性（实质为HClO）。"',
  '"chemicalProps": "强氧化性。与H2光照或点燃生成HCl；与多数金属反应生成氯化物；与水：Cl2+H2O⇌HCl+HClO（可逆，有限）。与碱须分条件：冷的稀碱常用Cl2+2NaOH=NaCl+NaClO+H2O；热的浓碱另有反应（可生成氯酸盐等），不得与冷稀碱式混用。与石灰乳反应可制漂白粉（了解，见sub.bleaching_powder）。湿润氯气有漂白性（实质为HClO）。"',
)

replaceOnce(
  'sub.HCl_aq.testMethods',
  '"testMethods": "使紫色石蕊变红；与AgNO3生成白色AgCl沉淀（加稀HNO3不溶解）。"',
  '"testMethods": "使紫色石蕊变红；检Cl-：硝酸酸化后加AgNO3得白色AgCl沉淀（酸化可排除CO3 2-等干扰；沉淀不溶于稀HNO3）。"',
)

replaceOnce(
  'sub.HCl_aq.canonicalFormula',
  '"canonicalFormula": "HCl(aq)",',
  '"canonicalFormula": "HCl",',
)

replaceOnce(
  'sub.HCl_aq.physicalProps',
  '"physicalProps": "氯化氢的水溶液；挥发性强酸。"',
  '"physicalProps": "氯化氢的水溶液（常写作HCl或HCl(aq)）；挥发性强酸。"',
)

replaceOnce(
  'sub.HCl_aq.reviewExtra',
  '"commonUses": "实验室常用酸；工业清洗等（了解）。"\n  },\n  "sub.HClO":',
  '"commonUses": "实验室常用酸；工业清洗等（了解）。",\n    "reviewExtra": "canonical写HCl=水溶液;Cl-检验须硝酸酸化"\n  },\n  "sub.HClO":',
)

replaceOnce(
  'sub.P.chemicalProps',
  '"chemicalProps": "可燃烧生成P4O10（或写作P2O5了解口径）。白磷可自燃（条件），严禁学生接触白磷。",\n    "commonUses": "火柴等（了解红磷）；白磷剧毒禁常规实验。",\n    "reviewExtra": "同素异形体对比以课本为准;白磷严禁学生实验"',
  '"chemicalProps": "可燃烧生成P4O10（教材亦常见写作P2O5，口径以课本为准，二者不可未经说明等同）。白磷可自燃（具体自燃条件与同素异形体对比细节以所用教材为准）。严禁学生接触白磷。",\n    "commonUses": "火柴等（了解红磷）；白磷剧毒禁常规实验。",\n    "reviewExtra": "待核实:同素异形体对比细节;了解/拓展级;禁默认细对比绝对题;白磷禁操作题"',
)

replaceOnce(
  'sub.P4O10.commonNames',
  '"commonNames": "五氧化二磷（常写作P2O5了解）",',
  '"commonNames": "五氧化二磷；分子式常写P4O10，经验式/教材亦写P2O5",',
)

replaceOnce(
  'sub.P4O10.chemicalProps',
  '"chemicalProps": "酸性氧化物；与水生成磷酸。高中以磷燃烧产物认识为主。",\n    "commonUses": "干燥剂等（了解）。",\n    "reviewExtra": "P4O10与P2O5写法以课本为准"',
  '"chemicalProps": "酸性氧化物；与水生成磷酸。高中以磷燃烧产物认识为主。注意：P4O10为常见分子式写法，P2O5多为经验式/教材简写，题干须指定写法，不得默认二者完全等同。",\n    "commonUses": "干燥剂等（了解）。",\n    "reviewExtra": "待核实:教材主写法;题干须指定P4O10或P2O5;禁混同绝对填空"',
)

replaceOnce(
  'sub.bleaching_powder',
  '"physicalProps": "混合物；有效成分常表述为次氯酸钙等（以课本为准，待核实）。",\n    "chemicalProps": "由氯气与石灰乳反应制得（了解）。有效成分具氧化漂白性；久置失效（了解）。主要成分精确表述待教材核实。",\n    "commonUses": "漂白、消毒（了解）。",\n    "reviewExtra": "待核实:主要成分教材口径;混合物"',
  '"physicalProps": "工业产品为混合物，不是严格唯一组成的纯净物；教材常简化表述。",\n    "chemicalProps": "由氯气与石灰乳反应制得（了解）。有效成分常表述为次氯酸钙Ca(ClO)2（以所用教材为准）；另含氯化钙等。有效成分具氧化漂白性；久置失效（了解）。精确主要成分/组成比不得写成唯一绝对答案。",\n    "commonUses": "漂白、消毒（了解）。",\n    "reviewExtra": "待核实:教材成分口径;混合物;禁精确组成绝对填空;excludeDefaultCompositionFill"',
)

replaceOnce(
  'rxn.Cl2_2NaOH.conditions',
  '"conditions": "常温，NaOH溶液（冷的稀碱，高中常用此式）",\n    "phenomenon": "黄绿色气体被吸收，溶液仍近无色/淡黄。",\n    "principle": "歧化：氧化剂=还原剂=Cl2；氧化产物NaClO，还原产物NaCl。",',
  '"conditions": "本条仅适用：常温、冷的稀NaOH溶液。禁止无条件套用。热的浓碱另有反应（如可生成氯酸盐等），产物不同，不得与本式混用。",\n    "phenomenon": "黄绿色气体被吸收，溶液仍近无色/淡黄。",\n    "principle": "冷稀碱下歧化：氧化剂=还原剂=Cl2；氧化产物NaClO，还原产物NaCl。热浓碱条件禁止套用本结论。",',
)

replaceOnce(
  'rxn.Cl2_2NaOH.reviewExtra',
  '"trainTypes": "equation.write_from_text,equation.balance,redox.identify,ion.ionic_eq",\n    "species": [\n      {\n        "role": "reactant",\n        "formula": "Cl2",\n        "coefficient": 1,\n        "stateSymbol": "g",\n        "isGas": true,\n        "isPrecipitate": false,\n        "sortOrder": 1\n      },\n      {\n        "role": "reactant",\n        "formula": "NaOH",\n        "coefficient": 2,',
  '"trainTypes": "equation.write_from_text,equation.balance,redox.identify,ion.ionic_eq",\n    "reviewExtra": "必须带冷/稀条件;禁无条件碱反应填空;热浓碱另产物",\n    "species": [\n      {\n        "role": "reactant",\n        "formula": "Cl2",\n        "coefficient": 1,\n        "stateSymbol": "g",\n        "isGas": true,\n        "isPrecipitate": false,\n        "sortOrder": 1\n      },\n      {\n        "role": "reactant",\n        "formula": "NaOH",\n        "coefficient": 2,',
)

replaceOnce(
  'rxn.H2_Cl2.reviewExtra',
  '"trainTypes": "equation.write_from_text,equation.balance,redox.identify",\n    "species": [\n      {\n        "role": "reactant",\n        "formula": "H2",',
  '"trainTypes": "equation.write_from_text,equation.balance,redox.identify",\n    "reviewExtra": "化合反应ox/re产物同为HCl;光照实验高危勿学生操作题",\n    "species": [\n      {\n        "role": "reactant",\n        "formula": "H2",',
)

replaceOnce(
  'rxn.CO2_CaOH2.conditions',
  '"conditions": "常温，澄清石灰水；CO2适量。过量CO2可变清（另反应，题设说明）",',
  '"conditions": "常温，澄清石灰水；本式对应CO2适量（变浑浊）。若CO2过量可变清（生成可溶性酸式盐，另反应），必须在题干分条件说明，禁止与本式混答。",',
)

replaceOnce(
  'rxn.CO2_CaOH2.reviewExtra',
  '"trainTypes": "equation.write_from_text,equation.balance,ion.ionic_eq",\n    "species": [\n      {\n        "role": "reactant",\n        "formula": "CO2",',
  '"trainTypes": "equation.write_from_text,equation.balance,ion.ionic_eq",\n    "reviewExtra": "B4整改:去redox专项;适量/过量分题",\n    "species": [\n      {\n        "role": "reactant",\n        "formula": "CO2",',
)

replaceOnce(
  'rxn.SO3_H2O.reviewExtra',
  '"trainTypes": "equation.write_from_text,equation.balance",\n    "species": [\n      {\n        "role": "reactant",\n        "formula": "SO3",',
  '"trainTypes": "equation.write_from_text,equation.balance",\n    "reviewExtra": "B4整改:非氧化还原;specialty去redox",\n    "species": [\n      {\n        "role": "reactant",\n        "formula": "SO3",',
)

replaceOnce(
  'rxn.NH3_HCl.reviewExtra',
  '"trainTypes": "equation.write_from_text,equation.balance",\n    "species": [\n      {\n        "role": "reactant",\n        "formula": "NH3",',
  '"trainTypes": "equation.write_from_text,equation.balance",\n    "reviewExtra": "B4整改:非氧化还原;specialty去redox",\n    "species": [\n      {\n        "role": "reactant",\n        "formula": "NH3",',
)

replaceOnce(
  'rxn.SiO2_2NaOH.reviewExtra',
  '"trainTypes": "equation.write_from_text,equation.balance",\n    "species": [\n      {\n        "role": "reactant",\n        "formula": "SiO2",',
  '"trainTypes": "equation.write_from_text,equation.balance",\n    "reviewExtra": "B4整改:非氧化还原;specialty去redox;碱腐蚀玻璃",\n    "species": [\n      {\n        "role": "reactant",\n        "formula": "SiO2",',
)

replaceOnce(
  'rxn.CaCO3_2HCl.reviewExtra',
  '"trainTypes": "equation.write_from_text,equation.balance,ion.ionic_eq",\n    "species": [\n      {\n        "role": "reactant",\n        "formula": "CaCO3",',
  '"trainTypes": "equation.write_from_text,equation.balance,ion.ionic_eq",\n    "reviewExtra": "B4整改:非氧化还原;specialty去redox;保留离子式",\n    "species": [\n      {\n        "role": "reactant",\n        "formula": "CaCO3",',
)

replaceOnce(
  'rxn.Cu_4HNO3.name',
  '"name": "铜与稀硝酸",\n    "canonicalEquation": "3Cu+8HNO3=3Cu(NO3)2+2NO+4H2O",',
  '"name": "铜与稀硝酸（计量3Cu+8HNO3）",\n    "canonicalEquation": "3Cu+8HNO3=3Cu(NO3)2+2NO+4H2O",',
)

replaceOnce(
  'rxn.Cu_4HNO3.reviewExtra',
  '"trainTypes": "equation.write_from_text,equation.balance,redox.identify,ion.ionic_eq",\n    "species": [\n      {\n        "role": "reactant",\n        "formula": "Cu",\n        "coefficient": 3,',
  '"trainTypes": "equation.write_from_text,equation.balance,redox.identify,ion.ionic_eq",\n    "reviewExtra": "编码Cu_4HNO3易混;实际稀硝酸计量3Cu+8HNO3;题干必须写稀",\n    "species": [\n      {\n        "role": "reactant",\n        "formula": "Cu",\n        "coefficient": 3,',
)

replaceOnce(
  'sub.Br2.reviewExtra',
  '"reviewExtra": "增补;勿展开溴含氧酸深度"',
  '"reviewExtra": "增补;勿展开溴含氧酸深度;默认训练限单质递变与颜色"',
)

replaceOnce(
  'sub.I2.reviewExtra',
  '"reviewExtra": "增补;淀粉变蓝;正价不进默认核心"',
  '"reviewExtra": "增补;淀粉变蓝;正价不进默认核心;可训淀粉检验"',
)

if (fail) {
  console.error('patch failed count=', fail)
  process.exit(1)
}

fs.writeFileSync(contentPath, src, 'utf8')
console.log(JSON.stringify({ ok: true, bytes: src.length }, null, 2))
