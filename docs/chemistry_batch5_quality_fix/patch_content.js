/**
 * Patch batch5_content.js for Batch5 quality remediation.
 */
'use strict'
const fs = require('fs')
const path = require('path')

const contentPath = path.join(__dirname, '../chemistry_batch5/batch5_content.js')
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

// --- kp.exp.error (P1) ---
replaceOnce(
  'kp.exp.error',
  `'kp.exp.error': {
    name: '实验误差分析',
    description:
      '误差分析必须对应操作阶段与测定量。以容量瓶定容为例：溶解未冷却、转移未洗涤、定容俯视/仰视、摇匀后液面下降再加水等，对c的影响方向不同；未指明阶段不能武断“偏高/偏低”。过滤、称量、气体收集不纯等亦同理。',
    difficulty: 3,
    importance: 5,
    reviewExtra: '定容误差分阶段；禁无阶段判偏向',
  },`,
  `'kp.exp.error': {
    name: '实验误差分析',
    description:
      '误差分析必须对应具体操作阶段与测定量，禁止脱离条件直接写“偏大/偏小”。以配制一定物质的量浓度溶液（c=n/V）为例（书面分析）：①洁净容量瓶内残留少量蒸馏水，随后按规范定容且无其他错误时，一般不改变溶质的物质的量n，也不改变最终溶液体积V，故c通常不变；②定容时俯视刻度线→读得V偏小→c偏大；仰视→V偏大→c偏小；③烧杯/玻璃棒未洗涤或洗涤液未转入→n偏小→c偏小；④溶解未冷却即定容→冷却后液面低于刻度→V偏小→c偏大；⑤定容摇匀后发现液面低于刻度又加水→V偏大且相当于稀释→c偏小；⑥超过刻度线后用胶头滴管吸出部分溶液→溶质与溶剂同时损失，n偏小→c通常偏小。过滤、称量、气体收集不纯等亦须先定位操作再谈影响。',
    difficulty: 3,
    importance: 5,
    reviewExtra: 'B5整改:容量瓶分阶段对照;禁无阶段绝对偏向题',
  },`,
)

// --- q.calc.excess (P1) ---
replaceOnce(
  'q.calc.excess',
  `'q.calc.excess': {
    qtype: 'calc',
    stem: '（骨架）Zn+H2SO4=ZnSO4+H2↑。若锌 6.5 g 与足量稀硫酸反应，与 0.2 mol H2SO4 和 13 g 锌相比，哪种情况产生 H2 更多？请判断并计算较多情况下 H2 的物质的量。（可改写为完整过量题）',
    answer:
      '骨架参考：先分别判断限量。6.5 g Zn 为 0.1 mol，与足量酸生成 0.1 mol H2；0.2 mol H2SO4 与 13 g Zn(0.2 mol) 恰好/需再判断后计算。正式题应给出单一明确数据组。',
    analysis: '过量题必须先比较 n/计量数，再按不足量算产物。',
    scoring: '判断过程分+n结果分；单位 mol。',
    difficulty: 2,
    reviewExtra: '骨架；建议导入时改写为单一清晰数据组',
  },`,
  `'q.calc.excess': {
    qtype: 'calc',
    stem: '（骨架）反应：Zn + H2SO4 = ZnSO4 + H2↑（稀硫酸，不可逆按完全反应计，无副反应）。现有 Zn 13.0 g 与 H2SO4 0.15 mol 混合充分反应。已知 M(Zn)=65 g/mol。求生成 H2 的物质的量（单位 mol）。要求：先判断过量，再按不足量计算。',
    answer: '0.15 mol（过程：n(Zn)=13.0/65=0.20 mol；计量数均为1，n(Zn)/1=0.20 > n(H2SO4)/1=0.15，故 H2SO4 不足；n(H2)=n(不足量)=0.15 mol）',
    analysis: '先算 n(Zn) 与 n(H2SO4)，用 n/计量数比较；小者为不足量，按不足量得 n(H2)。本骨架条件唯一，禁止再混入第二组对照数据。',
    scoring: '过量判断过程分+结果 0.15 mol；单位 mol 必写；未判断过量直接代算不得满分。',
    difficulty: 2,
    reviewExtra: 'B5整改:单一数据组过量骨架;可作模板',
  },`,
)

// --- formula.ion_conc reviewExtra ---
replaceOnce(
  'formula.ion_conc.reviewExtra',
  `reviewExtra: '禁Ka平衡计算；仅入门强电解质',`,
  `reviewExtra: 'B5整改:禁Ka/水解;category去equation_calc;仅强电解质入门',`,
)

// --- exp.ops_evaporate principle ---
replaceOnce(
  'exp.ops_evaporate.principle',
  `principle:
      '加热使溶剂挥发，溶质浓度增大直至析出晶体；蒸发皿可直接加热（常垫石棉网按题设/教材）。',`,
  `principle:
      '加热使溶剂挥发，溶质浓度增大直至析出晶体；蒸发皿加热装置以题设图示/所用教材为准（常见为铁圈上放置蒸发皿加热；是否垫石棉网按题给装置判断，勿混写两种口径为同时必然）。',`,
)

// --- exp.O2_prep_H2O2 principle ---
replaceOnce(
  'exp.O2_prep_H2O2.principle',
  `principle: '2H2O2=MnO2=2H2O+O2↑（MnO2为催化剂）；常温即可，常用分液漏斗/长颈漏斗加液。',`,
  `principle: '2H2O2 --MnO2--> 2H2O+O2↑（MnO2为催化剂，写在反应条件处）；常温即可，常用分液漏斗/长颈漏斗加液。',`,
)

// --- exp.ops_volumetric_flask conclusion ---
replaceOnce(
  'exp.ops_volumetric_flask.conclusion',
  `conclusion: '定容操作直接影响溶液体积V，从而影响浓度c；误差须对应溶解/转移/定容等阶段分析。',`,
  `conclusion: '定容操作直接影响溶液体积V，从而影响浓度c；误差须对应溶解/转移/定容等阶段分析。洁净容量瓶内原有少量蒸馏水，在后续规范定容且无其他错误时，通常不影响最终c（详见kp.exp.error）。',`,
)

// --- exp.flame_test principle (物理变化) keep 待核实 for colors ---
replaceOnce(
  'exp.flame_test.principle',
  `principle:
      '某些金属或其化合物在无色火焰中灼烧时使火焰呈现特征颜色（焰色反应），可用于初步检验。',`,
  `principle:
      '某些金属或其化合物在无色火焰中灼烧时使火焰呈现特征颜色，称为焰色反应；属于物理变化（没有生成新物质），可用于初步检验某些金属元素。',`,
)
replaceOnce(
  'exp.flame_test.reviewExtra',
  `reviewExtra: 'Na/K/Cu颜色以人教必修常见表述；钴玻璃观察K；具体措辞待对照所用教材核实',`,
  `reviewExtra: '待核实:教材颜色措辞;已明确物理变化;禁当化学反应;钴玻璃观察K',`,
)

// --- exp.ops_burette strengthen ---
replaceOnce(
  'exp.ops_burette.reviewExtra',
  `reviewExtra: '待核实是否必修核心；避免分析化学滴定深度',`,
  `reviewExtra: '待核实是否必修核心;仅识别/读数认知;excludeDefaultTitrationCalc;禁定量滴定默认训练',`,
)

// --- kp.extent.le_chatelier ---
replaceOnce(
  'kp.extent.le_chatelier_basic.description',
  `description:
      '可逆反应存在一定限度（转化不能按“进行到底”理解）。必修要求定性认识条件对平衡移动方向的影响（如浓度、温度、压强对有气体参与体系的影响），不进行选修化学平衡常数计算与复杂图像定量。表述以所用教材为准，深度待核实。',
    difficulty: 2,
    importance: 4,
    reviewExtra: 'verifyNeeded；仅定性；禁止选修平衡计算',
  },`,
  `description:
      '可逆反应存在一定限度（转化不能按“进行到底”理解）。高一以定性认识为主：条件改变可能影响转化方向/限度的认识层次以所用必修教材为准；不把“勒夏特列原理”命名与选修化学平衡常数、复杂图像定量作为默认核心训练。禁止选修深度计算。',
    difficulty: 2,
    importance: 4,
    reviewExtra: '待核实:教材深度与命名;仅极浅定性;excludeDefaultEquilibriumCalc',
  },`,
)

// --- distill/extract reviewExtra reinforce ---
replaceOnce(
  'exp.ops_distill.reviewExtra',
  `reviewExtra: 'priority2/认知级；勿按大学有机实验深度展开',`,
  `reviewExtra: '认知级;限装置正误书面训练;禁工业精馏与动手蒸馏',`,
)
replaceOnce(
  'exp.ops_extract.reviewExtra',
  `reviewExtra: '认知级；试剂示例随教材，勿鼓励实际操作',`,
  `reviewExtra: '认知级;题干须指定萃取剂;禁家用有机溶剂操作',`,
)

if (fail) {
  console.error('patch failed', fail)
  process.exit(1)
}
fs.writeFileSync(contentPath, src, 'utf8')
console.log(JSON.stringify({ ok: true, bytes: src.length }, null, 2))
