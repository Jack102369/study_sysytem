# 高一化学知识库 · 311 清单完整性审查报告

> 审查对象：`docs/chemistry_kb_inventory.json`（规划合计 311 条）  
> 方法：以人教版**必修第一册 / 必修第二册**核心内容为出发点做**反向覆盖检查**（不是只数编码）  
> 依据：`docs/CHEMISTRY_QUALITY_STANDARD.md`  
> 审查日期：2026-10-18  
> **本次只提出补充建议，不修改 311 条清单，不导入数据。**  
> **本报告为 AI 辅助审查，不是人工审核。**

---

## 0. 清单结构快照

| 批次 | 名称 | 条数 | 当前状态概览 |
|------|------|------|----------------|
| batch2 | 元素和基础概念 | 91 | 10 seeded_audited + 81 imported |
| batch3 | 金属化学数据 | 71 | 7 seeded + 64 pending |
| batch4 | 非金属化学数据 | 65 | 全部 pending |
| batch5 | 实验和计算数据 | 34 | 全部 pending |
| batch6 | 有机及综合数据 | 50 | 1 seeded + 49 pending |
| **合计** | | **311** | |

按类型（清单 meta）：element 30 / concept 30 / formula 16 / knowledge 56 / substance 62 / reaction 62 / experiment 37 / question 18。

---

## 1. 课程模块 × 清单覆盖总评

| 高一核心模块 | 覆盖判断 | 主要落点 | 缺口级别 |
|--------------|----------|----------|----------|
| 物质分类 | 较完整 | batch2 概念 | — |
| 离子反应 | 较完整（概念） | batch2；具体离子反应多在 3/4 批 | P3（边界案例可增） |
| 氧化还原 | 较完整（概念） | batch2 | P3（父节点偏薄，见质量报告） |
| 物质的量 | 较完整（公式） | batch2+5 | P1（条件字段质量问题，非编码缺失） |
| 钠及其化合物 | 主体有 | batch3 | P2（转化链可再补） |
| 铁及其化合物 | **明显不足** | batch3 偏少 | **P2** |
| 铝及其化合物 | 中等 | batch3 有 Al/氧化物/氢氧化物与两性反应 | P2（缺铝盐/偏铝酸盐物质条） |
| 金属材料 | **明显不足** | 几乎无专条 | **P2** |
| 原子结构 / 周期律 / 化学键 | 较完整 | batch2 | P3 |
| 硫及其化合物 | 主体有 | batch4 | P2（浓硫酸通性/吸水性等可增强） |
| 氮及其化合物 | 主体有 | batch4 | P2（铵盐性质等可补） |
| 硅及其化合物 | 基本有 | batch4 | P3 |
| 氯及其化合物 | 较完整 | batch4 | P3（漂白粉可补） |
| 化学反应与能量 / 原电池 | **不足** | 概念零散 | **P2** |
| 反应速率与限度 | 有概念条 | batch2 | P3（缺实验探究专条） |
| 有机化学基础 | 主体有 | batch6 | P2（高分子/石油概要等） |
| 化学实验基础 | 部分有 | batch5 | P2（洗涤/干燥/滴定认知等） |
| 化学与可持续发展 | **不足** | 几乎无专条 | **P2** |

---

## 2. Batch3 重点遗漏研判（含你已指出项）

### 2.1 已点名项

| 知识名称 | 建议类型 | 高一范围 | 重要程度 | 是否必修核心 | 建议编码 | 建议批次 | 是否需进一步核实 | 结论 |
|----------|----------|----------|----------|--------------|----------|----------|------------------|------|
| 氧化亚铁 FeO | substance | 必修一·铁 | 高 | **是** | `sub.FeO` | batch3 增补或 batch3b | 否 | **应进入正式库** |
| 氢氧化亚铁 Fe(OH)₂ | substance | 必修一·铁（经典颜色变化） | 高 | **是** | `sub.FeOH2` | batch3 增补 | 否 | **应进入正式库** |
| 亚铁盐（如 FeCl₂ / FeSO₄） | substance | 必修一·Fe²⁺性质与转化 | 高 | **是** | `sub.FeCl2` 或 `sub.FeSO4`（择一为代表+知识点概括） | batch3 增补 | 编码取舍需核实 | **应进入正式库** |
| 合金 | concept 或 knowledge | 必修一·金属材料 | 高 | **是** | `concept.alloy` 或 `kp.metal.alloy` | batch3 增补 | 类型二选一需核实 | **应进入正式库** |
| 生铁 | substance 或 knowledge | 必修一·金属材料 | 高 | **是** | `sub.pig_iron` 或并入 `kp.metal.iron_steel` | batch3 增补 | 用物质还是知识点需核实 | **应进入正式库** |
| 钢 | 同上 | 同上 | 高 | **是** | `sub.steel` 或同上合并条 | batch3 增补 | 同上 | **应进入正式库** |
| 不锈钢 | 同上 | 同上（了解组成特点） | 中高 | **是**（了解级） | `sub.stainless` 或合并条 | batch3 增补 | 深度避免超纲 | **应进入正式库**（标「了解」） |

### 2.2 Batch3 继续发现的其他遗漏

| 知识名称 | 建议类型 | 高一范围 | 重要程度 | 必修核心 | 建议编码 | 建议批次 | 需核实 | 遗漏原因（推断） |
|----------|----------|----------|----------|----------|----------|----------|--------|------------------|
| Fe²⁺ / Fe³⁺ 相互转化（通论） | knowledge | 铁的化合物 | 高 | 是 | `kp.Fe.fe2_fe3` | batch3 | 否 | 清单偏单质/氧化物，缺转化专条 |
| Fe³⁺ 检验（KSCN） | experiment 或 knowledge | 铁离子检验 | 高 | 是 | `exp.Fe3_SCN` / `kp.Fe.test` | batch3 | 试剂细节 | 实验批未挂到金属批 |
| Fe(OH)₂ 被氧化 | reaction | 铁 | 高 | 是 | `rxn.FeOH2_O2` | batch3 | 写法（总式/分步） | 无 Fe(OH)₂ 则无反应条 |
| Fe²⁺→Fe³⁺（如 Cl₂/H₂O₂ 等代表反应） | reaction | 铁 | 高 | 是 | `rxn.2Fe2+_Cl2` 等 | batch3 | 选用哪条代表反应 | 清单未列 |
| 偏铝酸钠 / 铝盐代表物 | substance | 铝两性配套 | 中高 | 是 | `sub.NaAlO2`、`sub.AlCl3` | batch3 | 化学式书写口径 | 仅有反应无物质枢纽 |
| 碳酸钠⇄碳酸氢钠转化（通论） | knowledge 或 reaction | 钠 | 高 | 是 | `kp.Na.carbonate` 已有知识点；可补 `rxn.Na2CO3_CO2` 等 | batch3 | 是否拆反应 | 知识点 pending，反应链不完整 |
| 钠与酸反应 | reaction | 钠 | 中 | 是 | `rxn.2Na_2HCl` | batch3 | 与水类比是否单列 | 清单未列 |
| 金属活动性顺序表（专条） | knowledge | 已有 `kp.metal.activity` | — | 是 | 已有 | — | — | **已规划**，非遗漏 |
| 原电池（金属模块关联） | experiment/knowledge | 必修二能量 | 高 | 是 | 见 §4 | batch6 或独立能量小批 | 放置批次 | 金属批未覆盖能量章 |

### 2.3 Batch3 覆盖结论

- 现有 71 条对「钠、镁、铝、铜、锌」反应面较宽，但对**铁的化合物完整性**和**金属材料**明显偏弱。  
- 你列出的 FeO、Fe(OH)₂、亚铁盐、合金/生铁/钢/不锈钢：**均建议作为必修核心补充**（不锈钢深度标「了解」）。  
- **不要删除**现有 71 编码；以「增补清单」方式在后续批次或 batch3 修订任务中加入。

---

## 3. Batch4（非金属）遗漏建议

| 知识名称 | 建议类型 | 范围 | 重要程度 | 必修核心 | 建议编码 | 建议批次 | 需核实 | 说明 |
|----------|----------|------|----------|----------|----------|----------|--------|------|
| 溴单质 Br₂ | substance | 卤族比较 | 中高 | 是（了解+实验相关） | `sub.Br2` | batch4 | 否 | 现有 el.Br，缺物质条 |
| 碘单质 I₂ | substance | 同上 | 中高 | 是 | `sub.I2` | batch4 | 否 | 淀粉变蓝需要物质枢纽 |
| 漂白粉 / 次氯酸钙 | substance | 氯 | 中 | 是（了解） | `sub.CaClO2` 等 | batch4 | 化学式写法 | 有 NaClO，缺漂白粉 |
| 浓硫酸的特性（吸水/脱水/强氧化） | knowledge | 硫 | 高 | 是 | `kp.S.conc_H2SO4` | batch4 | 否 | 仅有反应例，缺通论 |
| 铵盐性质（加热/碱反应） | knowledge/reaction | 氮 | 高 | 是 | `kp.N.ammonium` / `rxn.NH4Cl_NaOH` | batch4 | 否 | 清单偏氨与氮氧化物 |
| SO₂ 漂白与加热恢复 | 已有实验方向 | 硫 | — | 是 | `exp.SO2_property` 已有 | — | 内容建设时写清 | 编码已有 |
| 可逆反应与合成氨条件 | knowledge | 氮+限度 | 中高 | 是 | 可挂 `rxn.N2_3H2` + 限度概念 | batch4/2 | 否 | 条件化表述要严 |
| 粗硅制备条件 | reaction 已有 | 硅 | 中 | 了解 | `rxn.SiO2_2C` | — | 高温条件必写 | 编码已有 |
| 酸雨 / 大气污染认知 | knowledge | 可持续发展交叉 | 中 | 是 | `kp.enviro.acid_rain` | batch4 或 batch6 | 否 | 清单几乎无环保专条 |
| 氟化氢 / 氢氟酸腐蚀 | 了解 | 卤族 | 低中 | 边缘 | 可选 | 不强制 | 是 | 避免过度扩展 |

---

## 4. Batch5（实验与计算）遗漏建议

| 知识名称 | 建议类型 | 范围 | 重要程度 | 必修核心 | 建议编码 | 建议批次 | 需核实 |
|----------|----------|------|----------|----------|----------|----------|--------|
| 洗气 / 干燥（试剂选择） | knowledge 或 experiment | 实验 | 高 | 是 | `kp.exp.gas_wash_dry` | batch5 | 否 |
| 容量瓶定容 | experiment | 实验 | 高 | 是 | `exp.ops_volumetric_flask` | batch5 | 否 |
| 移液管 / 滴定管认知 | experiment | 实验（了解仪器） | 中 | 部分教材强调不一 | `exp.ops_burette` | batch5 | **是**（课标深度） |
| 焰色反应 | experiment | 钠/钾 | 高 | 是 | `exp.flame_test` | batch5 或 batch3 | 否 |
| 热化学方程式书写规则 | knowledge/formula | 能量 | 中高 | 是 | `kp.energy.thermo_eq` | batch5/6 | 否 |
| 燃烧热 / 中和热（概念级） | concept | 能量 | 中高 | 是 | `concept.heat_of_reaction` | batch6 能量块 | 否 |
| 原电池构成条件 | knowledge | 能量 | 高 | 是 | `kp.energy.galvanic` | batch5/6 | 否 |
| 原电池实验（铜锌等） | experiment | 能量 | 高 | 是 | `exp.galvanic_Zn_Cu` | batch5/6 | 否 |
| 化学平衡移动定性（勒夏特列中学口径） | knowledge | 限度 | 中 | 必修有初步 | `kp.extent.le_chatelier_basic` | batch5 | **是**（深度防超纲） |
| 关系式法 / 差量法专条 | 部分已有 formula | 计算 | 中 | 是 | 已有 `formula.mixed_stoich` 等 | — | 建设时写清适用条件 |

Batch5 现有仪器/制气/安全骨架方向正确；**能量与原电池**是跨批次最大空洞之一。

---

## 5. Batch6（有机及综合）遗漏建议

| 知识名称 | 建议类型 | 范围 | 重要程度 | 必修核心 | 建议编码 | 建议批次 | 需核实 |
|----------|----------|------|----------|----------|----------|----------|--------|
| 石油分馏（概要） | knowledge | 有机/可持续发展 | 中高 | 是 | `kp.organic.petroleum` | batch6 | 否 |
| 乙烯使酸性 KMnO₄ 褪色 | reaction/experiment | 乙烯 | 高 | 是 | `rxn.C2H4_KMnO4` / 并入实验 | batch6 | 否 |
| 加成聚合（聚乙烯） | concept/knowledge | 有机 | 中高 | 是 | `concept.addition_polymer` | batch6 | 否 |
| 糖类 / 油脂 / 蛋白质（认知级） | knowledge | 必修二生命物质 | 中 | 是（了解） | `kp.organic.biomolecule` | batch6 | 深度 |
| 苯（已有 priority 3） | substance | 了解 | 中低 | 了解 | `sub.C6H6` 已有 | — | 建设时标超纲/了解 |
| 乙炔（已有） | substance | 了解 | 中低 | 边缘 | `sub.C2H2` 已有 | — | 同上 |
| 化学与可持续发展专章（资源/环保/绿色化学） | knowledge | 必修二末章 | 高 | 是 | `kp.sustain.green_chem` 等 | batch6 | 否 |
| 无机框图推断素材库 | 已有 kp.inference.* | 综合 | — | 是 | 已有 | — | 依赖 3/4 批物质反应充实 |

---

## 6. 横切遗漏（多批次）

| 主题 | 说明 | 级别 |
|------|------|------|
| 原电池与能量 | 必修二重点，清单几乎无独立实验/知识点 | P2 |
| 化学与可持续发展 | 课标独立主题，清单近空 | P2 |
| 铁系完整性 | FeO / Fe(OH)₂ / 亚铁盐 / 检验 / 转化 | P2 |
| 金属材料 | 合金、生铁、钢、不锈钢 | P2 |
| 卤素单质物质条 | Br₂、I₂ | P2 |
| 焰色反应 | 钠钾经典实验 | P2 |
| 问题骨架 question | batch5/6 有 18 条骨架，依赖知识充实后才能真题化 | P3 |

---

## 7. 建议增补总表（汇总，供后续确认）

> 下列编码均为**建议**，确认前不得写入 `chemistry_kb_inventory.json`。

### 7.1 高优先级（必修核心，建议优先确认）

| 建议编码 | 名称 | 类型 | 建议批次 | 重要程度 |
|----------|------|------|----------|----------|
| sub.FeO | 氧化亚铁 | substance | batch3+ | 高 |
| sub.FeOH2 | 氢氧化亚铁 | substance | batch3+ | 高 |
| sub.FeSO4 或 sub.FeCl2 | 亚铁盐代表 | substance | batch3+ | 高 |
| rxn.FeOH2_O2 | 氢氧化亚铁氧化 | reaction | batch3+ | 高 |
| kp.Fe.fe2_fe3 | Fe²⁺与Fe³⁺转化 | knowledge | batch3+ | 高 |
| exp.Fe3_SCN | Fe³⁺的检验 | experiment | batch3+ | 高 |
| concept.alloy（或 kp.metal.alloy） | 合金 | concept/knowledge | batch3+ | 高 |
| kp.metal.iron_steel | 生铁与钢 | knowledge | batch3+ | 高 |
| sub.NaAlO2 | 偏铝酸钠 | substance | batch3+ | 中高 |
| sub.AlCl3 | 氯化铝（铝盐代表） | substance | batch3+ | 中高 |
| sub.Br2 / sub.I2 | 溴/碘单质 | substance | batch4+ | 中高 |
| kp.S.conc_H2SO4 | 浓硫酸特性 | knowledge | batch4+ | 高 |
| kp.N.ammonium | 铵盐性质 | knowledge | batch4+ | 高 |
| exp.flame_test | 焰色反应 | experiment | batch3+/5+ | 高 |
| kp.energy.galvanic | 原电池 | knowledge | batch5+/6+ | 高 |
| exp.galvanic_Zn_Cu | 铜锌原电池实验 | experiment | batch5+/6+ | 高 |
| kp.sustain.green_chem | 绿色化学/可持续发展入门 | knowledge | batch6+ | 高 |
| concept.addition_polymer | 加聚 | concept | batch6+ | 中高 |
| kp.organic.petroleum | 石油分馏概要 | knowledge | batch6+ | 中高 |

### 7.2 中优先级

| 建议编码 | 名称 | 类型 | 建议批次 |
|----------|------|------|----------|
| rxn.Na2CO3_CO2_H2O | 碳酸钠转化为碳酸氢钠 | reaction | batch3+ |
| rxn.2Na_2HCl | 钠与盐酸 | reaction | batch3+ |
| sub.bleaching_powder | 漂白粉 | substance | batch4+ |
| kp.exp.gas_wash_dry | 洗气与干燥 | knowledge | batch5+ |
| exp.ops_volumetric_flask | 容量瓶定容 | experiment | batch5+ |
| concept.heat_of_reaction | 反应热概念 | concept | batch6+ |
| kp.organic.biomolecule | 生命中的基础有机物（了解） | knowledge | batch6+ |

---

## 8. 与「不得擅自改清单」的衔接

| 动作 | 本次 | 后续需你确认 |
|------|------|----------------|
| 修改 311 编码 | **不做** | 另开「清单增补」任务 |
| 删除错误编码 | **不做**（发现内容问题只记录） | 人工决定 |
| 生成 Batch3 知识 | **不做** | 建议先处理质量 P0 + 确认增补编码 |
| 导入数据 | **不做** | — |

---

## 9. 完整性结论（一句话）

311 条清单对「元素—概念—钠氯硫氮硅有机骨架」覆盖尚可，但对**铁系化合物与检验、金属材料、原电池/能量、可持续发展、部分实验操作与卤素单质枢纽**存在必修级缺口；Batch3 不应在未确认增补前被视为「金属化学完整」。

---

## 10. 等待确认的事项

1. 是否采纳 §7.1 高优先级增补编码列表？  
2. 金属材料用「合并知识点」还是「分条物质」？  
3. 原电池/能量放入 batch5 还是 batch6？  
4. 是否先修复 Batch2/Na 的 P0，再启动 Batch3 建设？  

确认前：停止生成与导入。
