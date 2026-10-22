/**
 * Build CHEMISTRY_BATCH5_QUALITY_REPORT.md — audit only, no DB writes.
 */
'use strict'
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

// --- experiments (19) ---
set('exp.instrument_basic', {
  v: '通过',
  s: 'P3',
  issue: '书面定位正确；清单 category 同时挂 gas_prep/gas_collect，易被误入制气题池',
  fix: '整改时收窄 categoryCodes 为 basic_ops/instrument/safety',
  h: false,
  scope: '高一必修核心',
  train: '可训仪器识别；勿当制气流程题',
})
set('exp.ops_weigh', {
  v: '通过',
  s: 'P3',
  issue: '左物右码与腐蚀性药品器皿称量正确；category 过宽同仪器条',
  fix: '收窄 category；组卷勿混入气体收集',
  h: false,
  scope: '高一必修核心',
  train: '可训操作正误与误差方向',
})
set('exp.ops_dissolve', {
  v: '通过',
  s: 'P3',
  issue: '溶解与定容冷却衔接正确；浓硫酸稀释提示到位',
  fix: '收窄 category',
  h: false,
  scope: '高一必修核心',
  train: '可训；强酸稀释仅书面',
})
set('exp.ops_filter', {
  v: '通过',
  s: '—',
  issue: '一贴二低三靠与滤液浑浊原因正确；现象/结论区分清楚',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训步骤排序与正误',
})
set('exp.ops_evaporate', {
  v: '通过',
  s: 'P3',
  issue: '余热蒸干要点正确；“可直接加热/常垫石棉网”并存，易造成装置判断歧义',
  fix: '按教材统一：蒸发皿加热是否垫石棉网写清唯一口径或“以题设装置为准”',
  h: false,
  scope: '高一必修核心',
  train: '可训；装置题须给图示',
})
set('exp.ops_distill', {
  v: '通过',
  s: 'P2',
  issue: '温度计位置与冷凝管流向正确；认知级已标；乙醇示例易燃提示到位',
  fix: '默认训练限装置认知，勿工业精馏',
  h: false,
  scope: '高一必修了解/认知',
  train: '可训装置正误；禁动手蒸馏',
})
set('exp.ops_extract', {
  v: '通过',
  s: 'P2',
  issue: '上下口放液规则正确；CCl4 示例有毒已警示；试剂随教材',
  fix: '题干指定萃取剂；勿鼓励实际操作',
  h: false,
  scope: '高一必修了解/认知',
  train: '可训分液规则；禁家用有机溶剂',
})
set('exp.gas_collect_upward', {
  v: '通过',
  s: 'P3',
  issue: '密度判据正确；列举 Cl2 仅分析；“收集满”检验方法宜题设明确',
  fix: '命题时写明验满方法，勿默认唯一',
  h: false,
  scope: '高一必修核心',
  train: '可训方法选择；有毒气体仅方案评价',
})
set('exp.gas_collect_downward', {
  v: '通过',
  s: '—',
  issue: '轻气体判据与 H2 验纯安全提示正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训；H2 禁操作题',
})
set('exp.gas_collect_water', {
  v: '通过',
  s: 'P3',
  issue: '溶解性判据正确；提及 NO 遇空气干扰合理',
  fix: 'NO 相关勿展开深度氧化还原默认题',
  h: false,
  scope: '高一必修核心',
  train: '可训适用条件判断',
})
set('exp.O2_prep_KMnO4', {
  v: '通过',
  s: '—',
  issue: '方程式、管口向下、棉花、先撤管后停热正确；isHazardous+书面定位到位',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训装置正误；禁动手制气',
})
set('exp.O2_prep_H2O2', {
  v: '通过',
  s: 'P3',
  issue: '催化分解正确；方程式中催化剂写法用“=MnO2=”非正式但中学常见',
  fix: '整改可改为箭头上方写 MnO2',
  h: false,
  scope: '高一必修核心',
  train: '可训与 KMnO4 法对比',
})
set('exp.H2_prep_Zn', {
  v: '通过',
  s: '—',
  issue: '稀硫酸、验纯、禁浓硫酸混用、禁家用均正确；现象与结论区分清楚',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训安全与装置；严禁操作/点燃题',
})
set('exp.CO2_prep_marble', {
  v: '通过',
  s: '—',
  issue: '不用稀硫酸原因正确；石灰水检验与可溶不排水正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训；石灰水浑浊非唯一证明须结合题设',
})
set('exp.check_airtight', {
  v: '通过',
  s: '—',
  issue: '先检后装、气泡/水柱判据正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训步骤排序',
})
set('exp.safety_rules', {
  v: '通过',
  s: '—',
  issue: '通则与禁家用定位正确；适合安全判断题',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训安全判断',
})
set('exp.ops_volumetric_flask', {
  v: '通过',
  s: 'P2',
  issue: '定容步骤正确；已指向误差分阶段；未在本条展开“瓶内残留蒸馏水”经典例',
  fix: '与 kp.exp.error 互补完善；本条可补一句洁净瓶残留水一般不影响 c',
  h: false,
  scope: '高一必修核心',
  train: '可训步骤；误差题须指阶段',
})
set('exp.ops_burette', {
  v: '待核实',
  s: 'P2',
  issue: '酸式/碱式区分正确，但是否作为高一必修核心仪器训练口径待对教材；已避免分析化学深度',
  fix: '对照课本确认纳入默认池或标了解；禁止默认酸碱滴定定量计算',
  h: true,
  scope: '高一了解/待核实',
  train: '核实前勿默认滴定计算题；仅限识别/读数认知',
})
set('exp.flame_test', {
  v: '待核实',
  s: 'P2',
  issue: 'Na/K/Cu 颜色与钴玻璃正确方向；未明确写“焰色反应是物理变化”；颜色措辞待对教材',
  fix: '补物理变化定性；颜色以课本为准；勿写成化学反应',
  h: true,
  scope: '高一必修核心（措辞待核实）',
  train: '可训颜色与操作；禁绝对化未给钴玻璃的钾观察',
})

// --- formulas (5) ---
set('formula.mixed_stoich', {
  v: '通过',
  s: '—',
  issue: '关系式法思路正确；单位与计量提示到位',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训；须配平方程式',
})
set('formula.excess_reactant', {
  v: '通过',
  s: '—',
  issue: 'n/计量数比较正确；示例清楚',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训；自动判题须要求写出判断过程',
})
set('formula.purity', {
  v: '通过',
  s: 'P3',
  issue: '纯度/产率定义正确；category 含 equation_calc 可接受（产率常联计量）',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训；理论产量须按不足量',
})
set('formula.ion_conc', {
  v: '需要修改',
  s: 'P2',
  issue: '强电解质入门化学正确且已禁 Ka；但清单 categoryCodes 含 calculation.equation_calc，易误入方程式计算专项池',
  fix: '去掉 equation_calc；改为 calculation.amount 或 ion 相关类别（按现有分类表选取）',
  h: false,
  scope: '高一必修核心（入门）',
  train: '内容可训；修关联前勿进方程式计算默认池',
})
set('formula.rate_v', {
  v: '通过',
  s: 'P2',
  issue: '平均速率口径正确；已限选修深度',
  fix: '默认训练限定义与单位',
  h: false,
  scope: '高一必修核心',
  train: '可训；禁复杂速率方程',
})

// --- knowledge (9) ---
set('kp.calc.stoich', {
  v: '通过',
  s: '—',
  issue: '步骤完整；强调标况才用 22.4',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('kp.calc.excess', {
  v: '通过',
  s: '—',
  issue: '与过量公式互补正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训',
})
set('kp.calc.gas', {
  v: '通过',
  s: '—',
  issue: '明确 Vm≈22.4 仅标况；禁止任何条件套用',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训；题干必须标明标况',
})
set('kp.calc.solution', {
  v: '通过',
  s: '—',
  issue: 'c=n/V、稀释、勿混质量分数正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训；V 必须溶液体积且单位匹配',
})
set('kp.exp.design', {
  v: '通过',
  s: '—',
  issue: '方案评价维度完整；书面非动手',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训方案评价',
})
set('kp.exp.error', {
  v: '需要修改',
  s: 'P1',
  issue:
    '已强调误差须对应阶段，但未写清经典对照：洁净容量瓶内残留少量蒸馏水一般不改变最终 c；超过刻度线后吸出导致溶质损失通常使 c 偏小等。缺少这些对照易生成错误标准答案',
  fix: '按操作阶段补充正误对照表（残留水/俯仰视/未洗涤/摇匀后再加水等）',
  h: false,
  scope: '高一必修核心',
  train: '补全前禁“无阶段绝对偏高/偏低”自动题',
})
set('kp.exp.gas_wash_dry', {
  v: '通过',
  s: 'P3',
  issue: '先除杂后干燥、长进短出正确；试剂组合以教材为准',
  fix: '命题指定试剂组合',
  h: false,
  scope: '高一必修核心',
  train: '可训顺序与选型',
})
set('kp.rate.factors', {
  v: '通过',
  s: 'P2',
  issue: '因素定性正确；specialty 含 experiment 略宽（更偏综合/概念）但仍可用',
  fix: '可选改为 comprehensive 为主',
  h: false,
  scope: '高一必修核心',
  train: '可训定性；禁平衡转化率混淆',
})
set('kp.extent.le_chatelier_basic', {
  v: '待核实',
  s: 'P1',
  issue: '仅定性正确方向；必修表述深度与勒夏特列命名/口径待对教材；已禁选修计算',
  fix: '对照必修二教材统一表述；核实前勿默认平衡移动定量/命名必考',
  h: true,
  scope: '高一必修了解/待核实',
  train: '核实前仅限极浅定性或排除默认池',
})

// --- questions (8) ---
set('q.calc.amount_basic', {
  v: '通过',
  s: 'P3',
  issue: '骨架正确且强调标况；可作为出题模板',
  fix: '正式卷替换数据并保留标况',
  h: false,
  scope: '高一必修核心',
  train: '模板可用；非完整卷库',
})
set('q.calc.concentration', {
  v: '通过',
  s: 'P3',
  issue: '500 mL→0.5 L 与 c=n/V 正确；评分已提示单位',
  fix: '正式题可要求带单位或双空',
  h: false,
  scope: '高一必修核心',
  train: '模板可用',
})
set('q.calc.equation', {
  v: '通过',
  s: 'P3',
  issue: '标况计量计算正确；specialty=equation 合理',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '模板可用；过程分+单位',
})
set('q.calc.excess', {
  v: '需要修改',
  s: 'P1',
  issue:
    '题干把“6.5 g Zn 与足量酸”和“0.2 mol H2SO4 与 13 g Zn”混问“哪种更多”，条件拼盘、答案自承“正式题应给单一数据组”，无法生成唯一标准答案',
  fix: '改写为单一清晰过量数据组；给出明确比较对象与唯一 n(H2)',
  h: false,
  scope: '高一必修核心',
  train: '修复前暂不适合自动出题/正式卷',
})
set('q.exp.instrument', {
  v: '通过',
  s: '—',
  issue: '量筒不可加热正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '模板可用',
})
set('q.exp.gas_collect', {
  v: '通过',
  s: 'P3',
  issue: 'CO2 向上排空气法正确；选项 C 干扰合理',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '模板可用',
})
set('q.exp.safety', {
  v: '通过',
  s: '—',
  issue: '禁家用制 H2 判断正确，符合产品定位',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '模板可用',
})
set('q.eq.balance', {
  v: '通过',
  s: '—',
  issue: 'Fe+2HCl 配平正确',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '模板可用',
})

// --- concept (1) ---
set('concept.reversible', {
  v: '通过',
  s: '—',
  issue: '可逆定义与限度区分正确；已限选修定量',
  fix: '—',
  h: false,
  scope: '高一必修核心',
  train: '可训概念判断',
})

// validate 42
const codes = extract.items.map((i) => i.code)
const missing = codes.filter((c) => !A[c])
const extra = Object.keys(A).filter((c) => !codes.includes(c))
if (missing.length || extra.length) {
  console.error({ missing, extra })
  process.exit(1)
}

const counts = { 通过: 0, 需要修改: 0, 待核实: 0 }
const sev = { P0: 0, P1: 0, P2: 0, P3: 0, none: 0 }
for (const c of codes) {
  const a = A[c]
  counts[a.v]++
  const s = a.s === '—' || a.s === '-' ? 'none' : a.s
  sev[s] = (sev[s] || 0) + 1
}

function row(code) {
  const it = extract.items.find((x) => x.code === code)
  const a = A[code]
  return `| \`${code}\` | ${it.inventoryName} | ${a.v} | ${a.s} | ${a.issue} | ${a.fix} | ${a.h ? '是' : '否'} | ${a.scope} | ${a.train} |`
}

const expCodes = codes.filter((c) => c.startsWith('exp.'))
const formulaCodes = codes.filter((c) => c.startsWith('formula.'))
const kpCodes = codes.filter((c) => c.startsWith('kp.'))
const qCodes = codes.filter((c) => c.startsWith('q.'))
const conceptCodes = codes.filter((c) => c.startsWith('concept.'))

const md = []
md.push('# 高一化学知识库 · Batch5 质量审查报告')
md.push('')
md.push('> 审查对象：`batch5` **42** 条实验与计算知识（全部新导入 `pending_review`）')
md.push('> 依据：`CHEMISTRY_QUALITY_STANDARD.md`、`CHEMISTRY_BATCH5_REPORT.md`、导入包与 DB 只读核对')
md.push('> 审查日期：2026-10-18')
md.push('> **产品定位**：实验专项 = 书面题目训练；不要求线下动手；不开发实验平台。')
md.push('> **本报告为 AI 辅助专项质量审查，不是人工学科审核。** 通过 ≠ 已经人工审核。')
md.push('> **本次只读审查，未修改知识正文/导入JSON/数据库。**')
md.push('')
md.push('---')
md.push('')
md.push('## 0. 总览')
md.push('')
md.push('### 0.1 逐条审查结论（互斥，合计=42）')
md.push('')
md.push('| 结论 | 数量 |')
md.push('|------|------|')
md.push(`| 通过（自动检查通过） | **${counts['通过']}** |`)
md.push(`| 需要修改 | **${counts['需要修改']}** |`)
md.push(`| 待核实（待教材核实） | **${counts['待核实']}** |`)
md.push(`| **合计** | **${counts['通过'] + counts['需要修改'] + counts['待核实']}** |`)
md.push('')
md.push('### 0.2 问题严重度（按条目主等级统计）')
md.push('')
md.push('> 统计口径：**知识条数**（每条取一个主等级）；“—”计入无等级。')
md.push('')
md.push('| 级别 | 知识条数 | 含义 |')
md.push('|------|----------|------|')
md.push(`| **P0** | **${sev.P0 || 0}** | 严重科学性错误 |`)
md.push(`| **P1** | **${sev.P1 || 0}** | 重要错误/条件缺失/训练高风险 |`)
md.push(`| **P2** | **${sev.P2 || 0}** | 关联不严谨、范围/训练歧义 |`)
md.push(`| **P3** | **${sev.P3 || 0}** | 表述/展示优化 |`)
md.push(`| 无等级 | ${sev.none || 0} | |`)
md.push('')
md.push('### 0.3 发布与整改判断')
md.push('')
md.push('| 问题 | 结论 |')
md.push('|------|------|')
md.push('| 是否存在严重化学错误（P0） | **否** |')
md.push('| 是否阻止正式发布 | **是**（pending_review + 需改/待核实 + 非人审） |')
md.push('| 是否可进入质量整改 | **是** |')
md.push('| 是否进入 Batch6 | **否（本次停止）** |')
md.push('')
md.push('### 0.4 数据库只读核对')
md.push('')
md.push('- 42 条均存在；均为 `pending_review`；无 published。')
md.push('- 专项链接与清单 specialtyCodes 一致（建设期 linkOk=42）。')
md.push('- 未改库；未影响其他批次。')
md.push('- 产品定位：实验条目均含书面训练/`homeForbiddenNote`，未见引导家用动手表述。')
md.push('')
md.push('---')
md.push('')
md.push('## 实验（19）逐条结果')
md.push('')
md.push('| 编码 | 名称 | 结论 | 等级 | 问题说明 | 修正建议 | 人工核实 | 范围 | 训练建议 |')
md.push('|------|------|------|------|----------|----------|----------|------|----------|')
for (const c of expCodes) md.push(row(c))
md.push('')
md.push('## 公式（5）逐条结果')
md.push('')
md.push('| 编码 | 名称 | 结论 | 等级 | 问题说明 | 修正建议 | 人工核实 | 范围 | 训练建议 |')
md.push('|------|------|------|------|----------|----------|----------|------|----------|')
for (const c of formulaCodes) md.push(row(c))
md.push('')
md.push('## 知识点（9）逐条结果')
md.push('')
md.push('| 编码 | 名称 | 结论 | 等级 | 问题说明 | 修正建议 | 人工核实 | 范围 | 训练建议 |')
md.push('|------|------|------|------|----------|----------|----------|------|----------|')
for (const c of kpCodes) md.push(row(c))
md.push('')
md.push('## 题目骨架（8）逐条结果')
md.push('')
md.push('| 编码 | 名称 | 结论 | 等级 | 问题说明 | 修正建议 | 人工核实 | 范围 | 训练建议 |')
md.push('|------|------|------|------|----------|----------|----------|------|----------|')
for (const c of qCodes) md.push(row(c))
md.push('')
md.push('## 概念（1）逐条结果')
md.push('')
md.push('| 编码 | 名称 | 结论 | 等级 | 问题说明 | 修正建议 | 人工核实 | 范围 | 训练建议 |')
md.push('|------|------|------|------|----------|----------|----------|------|----------|')
for (const c of conceptCodes) md.push(row(c))
md.push('')
md.push('## 实验误差分析专项')
md.push('')
md.push('| 编码 | 检查结论 |')
md.push('|------|----------|')
md.push('| `exp.ops_volumetric_flask` | 步骤正确；误差分析依赖 `kp.exp.error` |')
md.push('| `kp.exp.error` | **需改**：缺“洁净瓶残留蒸馏水通常不影响 c”与“超刻度后吸出→溶质损失→c 偏小”等对照 |')
md.push('')
md.push('## 公式与单位专项')
md.push('')
md.push('- Batch5 本批 formula 未重复定义 n=m/M、c=n/V、Vm（在 Batch2）；本批补充过量、纯度产率、离子浓度入门、关系式、速率。')
md.push('- `kp.calc.gas` / 题骨架均强调 **22.4 仅标况**。')
md.push('- 稀释：`kp.calc.solution` 写明溶质 n 不变（只加水）。')
md.push('- 自动判题风险：单位缺失、mL/L、标况未声明却用 22.4、过量题无判断过程。')
md.push('')
md.push('## 专项关联错误清单')
md.push('')
md.push('| 编码 | 问题 |')
md.push('|------|------|')
md.push('| `formula.ion_conc` | category 含 `calculation.equation_calc`（需改） |')
md.push('| 多数基础操作实验 | inventory `categoryCodes` 模板含 gas_prep/gas_collect（易误入制气池；建设未改清单结构） |')
md.push('| `kp.rate.factors` | specialty 含 experiment 略宽（提示级） |')
md.push('')
md.push('未发现实验被误挂 redox。')
md.push('')
md.push('## 课程范围争议 / 待核实')
md.push('')
md.push('- `exp.ops_burette`：是否必修核心')
md.push('- `exp.flame_test`：颜色措辞；应明确物理变化')
md.push('- `kp.extent.le_chatelier_basic`：定性深度与表述')
md.push('')
md.push('## 自动出题风险清单')
md.push('')
md.push('| 主题 | 风险 | 建议 |')
md.push('|------|------|------|')
md.push('| 容量瓶误差 | 无阶段判偏向 | 补对照表前禁绝对题 |')
md.push('| 气体 Vm | 非标况套 22.4 | 题干强制标况 |')
md.push('| `q.calc.excess` | 条件不唯一 | 修复前禁用 |')
md.push('| 题骨架 | 非完整卷 | 仅模板 |')
md.push('| H2/O2 制取 | 安全 | 仅书面；禁操作类 |')
md.push('| 滴定管 | 超纲定量 | 核实前禁滴定计算默认 |')
md.push('')
md.push('## 推荐整改方案（待下一步）')
md.push('')
md.push('1. 重写 `q.calc.excess` 为单一数据过量题。')
md.push('2. 扩充 `kp.exp.error`（及可选 `exp.ops_volumetric_flask`）误差对照。')
md.push('3. 修正 `formula.ion_conc` 的 categoryCodes。')
md.push('4. 收窄基础操作实验过宽 category（改清单关联，不增删编码）。')
md.push('5. 焰色补物理变化；滴定管/限度按教材定范围。')
md.push('')
md.push('## 审查局限性')
md.push('')
md.push('1. AI 辅助审查，非教师终审。')
md.push('2. 未逐页核对纸质教材页码。')
md.push('3. 基础建设检查通过不能替代本报告；本报告不能替代人工审核。')
md.push('')
md.push('---')
md.push('')
md.push('**停止：未改数据、未进 Batch6、未开发训练功能。等待质量整改指令。**')
md.push('')

const reportPath = path.join(__dirname, '..', 'CHEMISTRY_BATCH5_QUALITY_REPORT.md')
fs.writeFileSync(reportPath, md.join('\n'), 'utf8')

const auditMap = { counts, sev, items: A }
fs.writeFileSync(
  path.join(__dirname, 'quality_audit_map.json'),
  JSON.stringify(auditMap, null, 2) + '\n',
  'utf8',
)

console.log(
  JSON.stringify(
    {
      counts,
      sev,
      modify: codes.filter((c) => A[c].v === '需要修改'),
      verify: codes.filter((c) => A[c].v === '待核实'),
      sum: counts['通过'] + counts['需要修改'] + counts['待核实'],
      blocking: true,
      canRemediate: true,
      p0: sev.P0 || 0,
    },
    null,
    2,
  ),
)
