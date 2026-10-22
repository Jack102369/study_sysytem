# 高一化学知识库 · Batch2 质量审查报告

> 审查对象：`batch2` 计划 91 条（10 条复用 seeded + 81 条新导入）  
> 另附：阶段二 Na 体系 published 示例（修改建议，**未改库**）  
> 依据：`docs/CHEMISTRY_QUALITY_STANDARD.md`  
> 审查日期：2026-10-18  
> **本报告为 AI 辅助自动审查，不是人工审核。结论标签见质量标准 §6。**

---

## 0. 总览

### 0.1 Batch2 逐条结论统计（91）

| 结论 | 数量 | 说明 |
|------|------|------|
| 通过 | 65 | 未见明确科学性错误；仍需人工审核后方可视为发布合格 |
| 需要修改 | 21 | 含 P0/P1/P3 |
| 需要人工核实 | 3 | Ar、Be、Fe 等 |
| 疑似超纲 | 2 | el.I 价态表述、el.Cr 深度 |
| **合计** | **91** | |

### 0.2 严重度（非“通过”项 + Na 体系问题）

| 级别 | Batch2 | Na 示例（额外） |
|------|--------|----------------|
| P0 | 2 | 1（氧化/还原产物对调） |
| P1 | 约 12 | 1（氧元素缺过氧化物价态等，见下） |
| P2 | 0（条目级；包级关联见 §5） | — |
| P3 | 其余 | 若干表述优化 |

### 0.3 P0 必须优先人工处理

| 编码/对象 | 问题 | 建议（不自动改库） |
|-----------|------|-------------------|
| `kp.structure.atom` | 写「质量数≈质子数+中子数」；质量数定义应为 **=** | 改为等于；相对原子质量才谈近似 |
| `formula.rho_c_M` | `c=1000ρw/M` 未严格约定 ρ、w 单位与 w 是否小数 | 明确 ρ 为 g·mL⁻¹、w 为小数；并给百分数形式 |
| 阶段二反应「钠与水」 | `ox_product`/`re_product` 与氧化剂还原剂逻辑对调 | 见 §3 |

### 0.4 审核状态声明

| 数据范围 | 当前标签 |
|----------|----------|
| 81 条导入 | 库内 `pending_review` + 本报告「已通过自动校验/需修改…」 |
| 10 条 seeded | 库内多为 `published`，但**不等于**本轮已重新人工审核 |
| 本报告全部结论 | **需要人工审核**（最终裁定） |

---

## 1. 复用 seeded（10）逐条审查

来源：`db/migrate_chemistry_phase2.sql` + `docs/chemistry_batch2/seeded_audit.json`  
原则：不覆盖 published，只给建议。

| code | name | type | verdict | severity | issues | training_note |
|------|------|------|---------|----------|--------|---------------|
| el.H | 氢 | element | 通过 | — | 符号/序数/质量/价态基本正确 | 可出记忆/结构题；氢化物 −1 可在题干补充 |
| el.O | 氧 | element | 需要修改 | P1 | `common_valences` 仅 −2，缺过氧化物中 O 为 **−1**（后续 Na₂O₂ 训练需要） | 补 −1 并注明适用过氧化物前，勿考“氧只有 −2”绝对题 |
| el.Na | 钠 | element | 通过 | P3 | `common_compounds` 含 `Na`（单质非化合物）属表述不严谨 | 价态/与水反应可训；化合物列表建议人工整理 |
| el.Cl | 氯 | element | 需要修改 | P3 | `key_properties` 写成「黄绿色有毒气体」——实为 **Cl₂** 单质性质，元素条目易混淆 | 元素与 Cl₂ 物质分条出题；价态表可用 |
| concept.redox | 氧化还原反应 | concept | 通过 | P3 | 定义正确但偏短 | 可训识别；建议补氧化剂≠氧化产物 |
| formula.n_m_M | 物质的量与质量关系 | formula | 通过 | — | n=m/M、单位、纯净物条件已有 | 可支撑计算；与 `formula.M_m_n` 条件应对齐 |
| kp.redox | 氧化还原反应 | knowledge | 需要修改 | P3 | description 过短，训练解释不足 | 不宜单独作为详解题唯一依据 |
| kp.redox.valence_change | 化合价变化 | knowledge | 通过 | — | 表述正确 | 可支撑基础判断 |
| kp.redox.oxidant | 氧化剂判断 | knowledge | 通过 | — | 得电子/降价正确 | 可支撑氧化还原专项 |
| kp.redox.reductant | 还原剂判断 | knowledge | 通过 | — | 失电子/升价正确 | 同上 |

---

## 2. 新导入 81 条逐条审查

### 2.1 B2-A 元素（26）

| code | name | type | verdict | severity | issues | training_note |
|------|------|------|---------|----------|--------|---------------|
| el.He | 氦 | element | 需要修改 | P3 | 「最轻惰性气体**之一**」不准确；氦是最轻稀有气体 | 勿暗示存在更轻惰性气体 |
| el.Li | 锂 | element | 通过 | — | — | +1 / Li⁺ |
| el.Be | 铍 | element | 需要人工核实 | P3 | 用途/毒性表述待对公开资料；高一多停留周期表 | 不宜深度性质题 |
| el.B | 硼 | element | 通过 | — | — | +3 |
| el.C | 碳 | element | 通过 | — | — | +2/+4/−4 |
| el.N | 氮 | element | 需要修改 | P1 | 常见价缺 **+3**（及常见表中的 +1） | 补价态后再出氮价态记忆题 |
| el.F | 氟 | element | 通过 | — | — | 仅 −1 |
| el.Ne | 氖 | element | 通过 | — | — | 0 价 |
| el.Mg | 镁 | element | 通过 | — | — | Mg²⁺；燃烧白光 |
| el.Al | 铝 | element | 通过 | — | — | Al³⁺；两性重点在 Batch3 |
| el.Si | 硅 | element | 通过 | — | — | +4/−4 |
| el.P | 磷 | element | 通过 | — | — | 注意同素异形体 |
| el.S | 硫 | element | 通过 | — | — | −2/+4/+6 |
| el.Ar | 氩 | element | 需要人工核实 | P3 | Ar≈39.95 需与课本相对原子质量表对齐 | 计算题取值以教材为准 |
| el.K | 钾 | element | 通过 | — | — | 比钠更活泼 |
| el.Ca | 钙 | element | 通过 | — | — | Ca²⁺ |
| el.Fe | 铁 | element | 需要人工核实 | P3 | `[Ar] 3d⁶ 4s²` 科学正确，高一记号口径待对课本 | 训练优先 Fe²⁺/Fe³⁺ |
| el.Cu | 铜 | element | 通过 | — | — | +1/+2 |
| el.Zn | 锌 | element | 通过 | — | — | Zn²⁺ |
| el.Ag | 银 | element | 通过 | — | — | Ag⁺；卤化银 |
| el.Ba | 钡 | element | 通过 | — | — | BaSO₄ 检验 |
| el.I | 碘 | element | 疑似超纲 | P2* | 将 +5,+7 列为常见价且未标选修；必修侧重 −1 与 I₂ | 价态题宜限 −1、I₂、淀粉变蓝 |
| el.Mn | 锰 | element | 通过 | — | — | MnO₂/KMnO₄ 了解即可 |
| el.Cr | 铬 | element | 疑似超纲 | P2* | K₂Cr₂O₇ 等偏超必修核心 | 勿出 dichromate 深度题；不锈钢了解可保留并标记 |
| el.Br | 溴 | element | 通过 | — | — | 卤族递变为主 |
| el.Hg | 汞 | element | 需要修改 | P1 | 列 +1 未说明实际为 **Hg₂²⁺**，易误写 Hg⁺ | 禁止接触实验；离子题必须 Hg₂²⁺/Hg²⁺ |

\*条目级按「疑似超纲」；严重度对应标准中的范围问题（报告统计归入疑似超纲，不以 P2 缺口计）。

### 2.2 B2-B 概念（23）

| code | name | type | verdict | severity | issues | training_note |
|------|------|------|---------|----------|--------|---------------|
| concept.substance_class | 物质的分类 | concept | 通过 | — | — | 合金=混合物等可出 |
| concept.pure_mixture | 纯净物与混合物 | concept | 通过 | — | — | 宏观中学定义合适 |
| concept.elemental_compound | 单质与化合物 | concept | 需要修改 | P1 | 定义缺「**纯净物**」（O₂+O₃ 不是单质） | 补全前不宜出严谨判断题 |
| concept.electrolyte | 电解质 | concept | 通过 | — | — | 强调化合物 |
| concept.nonelectrolyte | 非电解质 | concept | 通过 | — | — | CO₂/SO₂ 边界需题干说明 |
| concept.ionization | 电离 | concept | 通过 | — | — | 区分电解 |
| concept.ionic_reaction | 离子反应本质 | concept | 通过 | — | — | 拆分规则可训 |
| concept.ion_coexist | 离子共存条件 | concept | 通过 | — | — | 覆盖沉淀/气体/氧化还原 |
| concept.oxidant_reductant | 氧化剂与还原剂 | concept | 通过 | — | — | 勿混产物 |
| concept.valence_rules | 化合价规则 | concept | 通过 | — | — | 过氧化物 O 为 −1 |
| concept.periodic_law | 元素周期律 | concept | 通过 | — | — | 自变量为原子序数 |
| concept.metal_trend | 金属性递变 | concept | 通过 | — | — | 限主族比较 |
| concept.nonmetal_trend | 非金属性递变 | concept | 通过 | — | — | 判据完整 |
| concept.ionic_bond | 离子键 | concept | 通过 | — | — | 例外以课本为准 |
| concept.covalent_bond | 共价键 | concept | 通过 | — | — | — |
| concept.reaction_rate | 化学反应速率 | concept | 通过 | — | — | 计算需另补 v=Δc/Δt |
| concept.reaction_extent | 化学反应限度 | concept | 通过 | — | — | 区分快慢与转化程度 |
| concept.mass_conserve | 质量守恒定律 | concept | 通过 | — | — | — |
| concept.charge_conserve | 电荷守恒 | concept | 需要修改 | P3 | 「离子电荷总数相等」宜改为「**电荷代数和**守恒」 | 离子配平必查代数和 |
| concept.electron_conserve | 电子守恒 | concept | 通过 | — | — | — |
| concept.solution_colloid | 溶液与胶体 | concept | 通过 | — | — | 丁达尔；滤纸不能区分 |
| concept.acid_base_salt | 酸碱盐概念 | concept | 通过 | — | — | 电离观点 |
| concept.oxide_class | 氧化物分类 | concept | 通过 | — | — | 过氧化物另说明 |

### 2.3 B2-C 公式（11）

| code | name | type | verdict | severity | issues | training_note |
|------|------|------|---------|----------|--------|---------------|
| formula.N_n_NA | 粒子数与物质的量 | formula | 通过 | — | — | 可支撑计算 |
| formula.Vm | 气体摩尔体积 | formula | 需要修改 | P1 | 一般定义与标况≈22.4 混写；未强调随 T、p 变 | 与 `gas_STP` 分工；非标况禁套 22.4 |
| formula.c_n_V | 物质的量浓度 | formula | 通过 | — | V 为溶液体积已体现 | 出题强制单位 L |
| formula.dilution | 溶液稀释 | formula | 通过 | — | 已排除反应混合误用 | 可支撑稀释计算 |
| formula.M_m_n | 摩尔质量 | formula | 需要修改 | P1 | 条件偏薄；宜点明 M 数值上等于相对分子/原子质量（g/mol） | 与 seeded `n_m_M` 对齐 |
| formula.rho_c_M | 密度与浓度换算 | formula | 需要修改 | **P0** | 单位/ w 小数约定不完整（导入时已自注待核实） | **计算专项高风险，建议人工修订后再命题** |
| formula.mass_percent | 质量分数 | formula | 通过 | — | — | — |
| formula.equation_ratio | 化学计量比 | formula | 需要修改 | P1 | 未写过量/不足、转化率情形 | 必须补「按不足量」 |
| formula.electron_transfer | 电子转移计量 | formula | 通过 | — | — | 可支撑配平 |
| formula.gas_STP | 标况气体体积 | formula | 需要修改 | P1 | 未写清 0 ℃、101 kPa；易与常温常压混淆 | 必须绑定「标准状况」题设 |
| formula.Avogadro | 阿伏加德罗常数定义 | formula | 通过 | — | ≈6.02×10²³ 合适 | — |

### 2.4 B2-D 知识点（21）

| code | name | type | verdict | severity | issues | training_note |
|------|------|------|---------|----------|--------|---------------|
| kp.redox.ox_product | 氧化产物判断 | knowledge | 通过 | — | — | 适合氧化还原专项 |
| kp.redox.re_product | 还原产物判断 | knowledge | 通过 | — | — | — |
| kp.redox.e_transfer | 电子转移 | knowledge | 通过 | — | — | — |
| kp.redox.e_conserve | 电子守恒 | knowledge | 通过 | — | — | — |
| kp.ion.electrolyte | 电解质与非电解质 | knowledge | 需要修改 | P1 | 文本偏口号，缺完整可教学定义与「单质两者都不是」 | 定义题支撑不足 |
| kp.ion.ionization_eq | 电离方程式书写 | knowledge | 通过 | — | — | — |
| kp.ion.coexist | 离子共存判断 | knowledge | 通过 | — | — | — |
| kp.ion.ionic_eq | 离子方程式书写 | knowledge | 需要修改 | P3 | 缺微溶、过量、酸式盐等边界 | 规则需再补 |
| kp.structure.atom | 原子组成与三粒子 | knowledge | 需要修改 | **P0** | 质量数用「≈」错误 | **概念题高风险** |
| kp.structure.isotope | 核素与同位素 | knowledge | 通过 | — | — | — |
| kp.structure.bond | 化学键类型判断 | knowledge | 通过 | — | — | 避开 AlCl₃ 例外或另标 |
| kp.structure.electron_formula | 电子式书写 | knowledge | 需要修改 | P3 | 「阳离子一般不画电子」对 NH₄⁺ 等不适用 | 区分简单/复杂阳离子 |
| kp.periodic.position | 周期与族定位 | knowledge | 通过 | — | 科学表述 OK；**专项标签误挂 ion** | 见 §5 |
| kp.periodic.e_config | 核外电子排布 | knowledge | 通过 | — | — | — |
| kp.periodic.trend | 周期律递变规律 | knowledge | 需要修改 | P1 | 几乎无具体递变方向 | 无法直接命题 |
| kp.calc.amount | 物质的量三公式 | knowledge | 需要修改 | P3 | 非标况限制不够醒目 | 与 Vm/STP 对齐加严 |
| kp.calc.concentration | 物质的量浓度 | knowledge | 通过 | — | 科学 OK；**专项标签误挂 ion** | 见 §5 |
| kp.calc.dilution | 稀释计算 | knowledge | 通过 | — | 同上标签问题 | 见 §5 |
| kp.memory.valence_table | 常见化合价速记 | knowledge | 需要修改 | P3 | 缺 Fe、Cu 等变价高频 | 记忆表需补全 |
| kp.memory.ion_table | 常见离子速记 | knowledge | 需要修改 | P3 | 缺 Fe²⁺、Ag⁺、S²⁻ 等 | 离子训练清单不足 |
| kp.memory.color_table | 物质颜色速记 | knowledge | 需要修改 | P3 | MnO₄⁻ 偏扩展；缺 Cl₂/Br₂/I₂ 等更常见色 | 宜标范围 |

---

## 3. 阶段二 Na 体系审查（修改建议，不覆盖）

审查来源：`db/migrate_chemistry_phase2.sql` 中 published 示例。

| 对象 | 类型 | verdict | severity | 问题与建议 |
|------|------|---------|----------|------------|
| 物质：钠 | substance | 通过 | P3 | 性质/保存（煤油）正确；「切割观察光泽」可作检验方法。建议化学性质中条件化写出与 O₂ 常温/加热差异（可链到后续反应条） |
| 物质：氢氧化钠 | substance | 通过 | — | 潮解、强碱、密封干燥、腐蚀性正确 |
| 物质：水 | substance | 通过 | P3 | 化学性质过简；可接受为溶剂枢纽 |
| 物质：氢气 | substance | 通过 | — | 可燃、验纯安全点到位 |
| 反应：钠与水 | reaction | **需要修改** | **P0** | 字段：`oxidant=H2O, reductant=Na` 正确；但 `ox_product=H2, re_product=NaOH` **对调**。正确应为：氧化产物 NaOH（或 Na⁺），还原产物 H₂。`electron_transfer` 按原子计可接受，建议同时给出方程式计量下 2e⁻ |
| 实验：钠与水的反应 | experiment | 通过 | P1 | 现象「浮、熔、游、响」正确；安全与禁止家用到位。建议步骤中强调「绿豆大」、吸干煤油；收集氢气注意验纯（可补一句） |
| 知识点：钠的化学性质 | knowledge | 需要修改 | P1 | 仅一句总述，缺少与 O₂/H₂O/酸的条件化要点，训练解释不足 |
| 题目：钠与水生成物 | question | 通过 | — | 答案与分析正确 |
| 关联 | links | 通过 | — | 元素↔物质↔反应↔实验↔知识点链路完整，可作关联样板 |

**训练适用性（Na 示例）**

| 方向 | 是否可支撑 | 说明 |
|------|------------|------|
| 方程式书写/配平 | 是 | 方程式正确 |
| 实验现象 | 是 | 现象字段可用 |
| 氧化还原判断 | **否（当前）** | 产物字段对调会导致教错 |
| 安全类 | 是 | 危险标注充分 |

---

## 4. 训练适用性综合（Batch2）

| 专项方向 | 总体判断 | 阻塞点 |
|----------|----------|--------|
| 元素记忆/周期律定位 | 大部分可用 | N 价态、I/Cr 范围、Ar 取值 |
| 概念判断（离子/氧化还原/分类） | 较好 | 单质定义、电荷守恒措辞 |
| 化学计算 | **谨慎** | P0 密度换算；Vm/STP/过量条件 |
| 氧化还原详解 | 子节点可用 | seeded 父节点偏短；Na 反应产物字段错误 |
| 结构（原子/同位素） | 阻塞 | 质量数 P0 |
| 专项路由 | 部分失灵 | B2-D `categoryByCode` 全空；部分 `specialtyByCode` 错挂 |

---

## 5. 包级 / 关联问题（非单条化学事实）

| 问题 | 严重度 | 说明 |
|------|--------|------|
| B2-D `categoryByCode` 全部为 `[]` | P3/路由 | 二级分类关联未写入，影响按分类组卷 |
| `kp.periodic.position` → specialty `ion` | P3 | 应为 periodic/structure |
| `kp.calc.concentration` / `dilution` → `ion` | P3 | 应为 calculation |
| 格式校验 `check_B2-*.md` 全绿 | — | 仅证明编码/格式，**不**等于化学正确 |

---

## 6. 建议的人工处理顺序（不执行，仅建议）

1. **P0**：`kp.structure.atom`、`formula.rho_c_M`、钠与水反应氧化/还原产物字段  
2. **P1**：N 价态、单质定义、Vm/STP/计量比条件、电解质知识点补全、周期律递变补全、Hg₂²⁺  
3. **疑似超纲**：el.I / el.Cr 加标记或收缩「常见价」表述  
4. **路由**：修正 B2-D specialty/category 关联（属数据修复，需另开任务）  
5. 全部 `pending_review` 条目：由人工裁定是否 `published`

---

## 7. 审查方法说明

- 对照导入 JSON：`docs/chemistry_batch2/import_B2-A.json` … `B2-D.json`  
- 对照种子 SQL：`db/migrate_chemistry_phase2.sql`  
- 对照清单状态：`docs/chemistry_kb_inventory.json`（batch2）  
- **未**连接生产库做字段级 diff；published 以迁移脚本为准  
- **未**声称任何条目「已经人工审核」

---

## 8. 下一步（等待确认）

本报告完成后：**不**生成 Batch3，**不**改清单，**不**改库。  
待你确认后，可另开任务：按 P0→P1 提交「修改建议补丁包」或人工审核工作流。
