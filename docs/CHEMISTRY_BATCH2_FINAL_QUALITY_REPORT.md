# 高一化学知识库 · Batch2 最终质量报告

> 日期：2026-10-18  
> 范围：Batch2 规划 91 条（10 复用 + 81 导入）及相关已修 P0  
> 依据：`CHEMISTRY_BATCH2_QUALITY_REPORT.md`、`CHEMISTRY_P0_FIX_REPORT.md`、库内实态复查  
> **本报告为自动检查与整改记录，不是人工审核结论。**  
> **不得将「自动检查通过」视为「已经人工审核」。**

---

## 0. 执行摘要

| 指标 | 数量 |
|------|------|
| Batch2 总条数 | 91 |
| P0 已修复（此前） | 3（含钠与水反应字段；其中 2 条属 Batch2 编码） |
| 本轮已执行内容整改（pending_review） | 19 条知识字段 + 3 条专项关联 |
| 本轮仅追加「待人工核实」备注 | 3 |
| 已发布数据变更提案（**未改库，等待确认**） | 4 |
| 当前自动检查通过（未见明确科学错误） | **82** |
| 需要人工核实 | **3** |
| 疑似超纲（已标注了解，仍待人工确认范围） | **2** |
| 存在明确错误但因 published 未改 | **3**（另 1 条 P3 建议） |
| 阻止「全部自动视为可正式发布」的问题 | **有**（见 §7） |

---

## 1. P0 修复后实态（避免重复修复）

对照库内当前值：

| 对象 | 原问题 | 当前状态 | 本轮处理 |
|------|--------|----------|----------|
| `kp.structure.atom` | 质量数≈ | 已为 `A = Z + N`，并区分相对原子质量 | **跳过（已修）** |
| `formula.rho_c_M` | 单位/ω 不清 | 已为 `c=1000ρω/M` 且单位条件完整 | **跳过（已修）** |
| 钠与水反应 `ox/re` | 产物对调 | `ox_product=NaOH`，`re_product=H2` | **跳过（已修）** |

备份与记录：`docs/chemistry_p0_fix/`、`docs/CHEMISTRY_P0_FIX_REPORT.md`

---

## 2. 本轮整改做了什么

### 2.1 已执行修改（仅 `pending_review`）

备份：`docs/chemistry_batch2_quality_fix/backup_before_b2_remediate.json`  
回放脚本：`docs/chemistry_batch2_quality_fix/b2_remediate.js`  
导入包已同步：`import_B2-A/B/C/D.json`

| 编码 | 整改要点 |
|------|----------|
| el.He | 「最轻惰性气体之一」→最轻稀有气体 |
| el.N | 常见价补 `+1,+3` |
| el.Hg | 明确 `Hg2^2+`，禁止写成 Hg+ |
| el.I | 价态标注必修/−1 vs 了解/+5,+7 |
| el.Cr | 收缩为不锈钢了解；重铬酸盐不进默认训练 |
| concept.elemental_compound | 定义补「纯净物」 |
| concept.charge_conserve | 改为电荷**代数和** |
| formula.Vm | 区分定义式与标况 22.4 |
| formula.M_m_n | 补单位与适用说明 |
| formula.equation_ratio | 补过量/不足/转化率 |
| formula.gas_STP | 写明 0℃、101kPa |
| kp.ion.electrolyte | 完整定义+单质边界 |
| kp.ion.ionic_eq | 补微溶/过量/酸式盐边界 |
| kp.structure.electron_formula | 区分简单/复杂阳离子 |
| kp.periodic.trend | 补递变方向与比较方法 |
| kp.calc.amount | 强调非标况不可用 22.4 |
| kp.memory.valence_table | 补 Fe/Cu/H 等 |
| kp.memory.ion_table | 补 Fe²⁺/Ag⁺/S²⁻ 等 |
| kp.memory.color_table | 补卤素与 Fe²⁺；MnO₄⁻ 标拓展 |
| 关联 | `kp.periodic.position`→periodic/structure；`kp.calc.concentration/dilution`→calculation |

### 2.2 未修改的已发布数据（变更清单，等待确认）

见：`docs/chemistry_batch2_quality_fix/published_change_proposals.json`

| 编码 | 现状问题 | 建议修改 | 状态 |
|------|----------|----------|------|
| el.O | 价态仅 −2 | 增 −1（过氧化物） | **待确认后改** |
| el.Cl | 性质写成 Cl₂ 气体 | 元素/单质分述 | **待确认后改** |
| kp.redox | description 过短 | 加长并强调氧化剂≠氧化产物 | **待确认后改** |
| el.Na | common_compounds 含 Na | 改为化合物列表 | **待确认后改（P3）** |

按你的要求：**影响 published 的修改未执行**，需你确认后另开任务。

---

## 3. 疑似超纲（2）

| 编码 | 判断 | 课程依据（可核实方向） | 处理 |
|------|------|------------------------|------|
| el.I | **高一拓展/了解**为主；−1 与 I₂、淀粉变蓝属必修常见；+5/+7 不宜作默认必修核心 | 人教版必修以氯为主，溴碘多为卤族比较了解；碘价态系统多在后续拓展 | 已标注「必修/−1；了解/+5,+7」。**仍待人工确认教材版本口径**。不得直接归入“已确认必修核心”。 |
| el.Cr | **超出高一必修默认训练**（重铬酸盐氧化还原）；不锈钢组成属了解 | 必修一金属材料提及不锈钢；K₂Cr₂O₇ 体系通常非必修核心 | 已收缩表述并标注。**仍待人工确认**。 |

---

## 4. 需要人工核实（3）

| 编码 | 库内要点 | 疑问点 | 可能问题 | 建议处理 | 建议核实资料 |
|------|----------|--------|----------|----------|--------------|
| el.Be | 用途/毒性“了解”表述 | 高一是否需要用途细节 | 超范围或资料不准 | 维持周期表层面；用途或删或标了解 | 所用教材元素周期表章节；公开元素数据 |
| el.Ar | 相对原子质量约 39.95 | 与课本表是否一致 | 计算题数值不一致 | 按教材表统一 Ar | 教材相对原子质量表 / 课标推荐数据 |
| el.Fe | `[Ar] 3d6 4s2` 记号 | 课本是否采用该写法 | 训练口径混乱 | 训练优先 Fe²⁺/Fe³⁺；排布按课本 | 所用教材原子结构/过渡元素表述 |

**AI 不能代替人工审核。** 上表仅列疑问与建议。

---

## 5. Batch2 共 91 条最终状态表

状态标签说明：

- **自动检查通过**：本轮未见明确科学性错误（仍需人工审核）
- **待核实**：需人对教材/数据
- **疑似超纲**：已标注了解，范围待人确认
- **待确认修改**：published 已提案未改
- **P0已修复**：此前已修

### 5.1 元素（30）

| code | 最终状态 | 备注 |
|------|----------|------|
| el.H | 自动检查通过 | seeded/published |
| el.He | 自动检查通过 | 本轮已改措辞 |
| el.Li | 自动检查通过 | |
| el.Be | 待核实 | |
| el.B | 自动检查通过 | |
| el.C | 自动检查通过 | |
| el.N | 自动检查通过 | 本轮已补价态 |
| el.O | 待确认修改 | published 提案 |
| el.F | 自动检查通过 | |
| el.Ne | 自动检查通过 | |
| el.Na | 待确认修改 | published P3 提案 |
| el.Mg | 自动检查通过 | |
| el.Al | 自动检查通过 | |
| el.Si | 自动检查通过 | |
| el.P | 自动检查通过 | |
| el.S | 自动检查通过 | |
| el.Cl | 待确认修改 | published 提案 |
| el.Ar | 待核实 | |
| el.K | 自动检查通过 | |
| el.Ca | 自动检查通过 | |
| el.Fe | 待核实 | |
| el.Cu | 自动检查通过 | |
| el.Zn | 自动检查通过 | |
| el.Ag | 自动检查通过 | |
| el.Ba | 自动检查通过 | |
| el.I | 疑似超纲 | 已标注了解 |
| el.Mn | 自动检查通过 | |
| el.Cr | 疑似超纲 | 已标注了解 |
| el.Br | 自动检查通过 | |
| el.Hg | 自动检查通过 | 本轮已改 Hg2^2+ |

### 5.2 概念（24）

| code | 最终状态 | 备注 |
|------|----------|------|
| concept.substance_class | 自动检查通过 | |
| concept.pure_mixture | 自动检查通过 | |
| concept.elemental_compound | 自动检查通过 | 本轮已改 |
| concept.electrolyte | 自动检查通过 | |
| concept.nonelectrolyte | 自动检查通过 | |
| concept.ionization | 自动检查通过 | |
| concept.ionic_reaction | 自动检查通过 | |
| concept.ion_coexist | 自动检查通过 | |
| concept.redox | 自动检查通过 | seeded；仍偏短属优化非阻断 |
| concept.oxidant_reductant | 自动检查通过 | |
| concept.valence_rules | 自动检查通过 | |
| concept.periodic_law | 自动检查通过 | |
| concept.metal_trend | 自动检查通过 | |
| concept.nonmetal_trend | 自动检查通过 | |
| concept.ionic_bond | 自动检查通过 | |
| concept.covalent_bond | 自动检查通过 | |
| concept.reaction_rate | 自动检查通过 | |
| concept.reaction_extent | 自动检查通过 | |
| concept.mass_conserve | 自动检查通过 | |
| concept.charge_conserve | 自动检查通过 | 本轮已改 |
| concept.electron_conserve | 自动检查通过 | |
| concept.solution_colloid | 自动检查通过 | |
| concept.acid_base_salt | 自动检查通过 | |
| concept.oxide_class | 自动检查通过 | |

### 5.3 公式（12）

| code | 最终状态 | 备注 |
|------|----------|------|
| formula.n_m_M | 自动检查通过 | seeded |
| formula.N_n_NA | 自动检查通过 | |
| formula.Vm | 自动检查通过 | 本轮已改 |
| formula.c_n_V | 自动检查通过 | |
| formula.dilution | 自动检查通过 | |
| formula.M_m_n | 自动检查通过 | 本轮已改 |
| formula.rho_c_M | P0已修复 / 自动检查通过 | |
| formula.mass_percent | 自动检查通过 | |
| formula.equation_ratio | 自动检查通过 | 本轮已改 |
| formula.electron_transfer | 自动检查通过 | |
| formula.gas_STP | 自动检查通过 | 本轮已改 |
| formula.Avogadro | 自动检查通过 | |

### 5.4 知识点（25）

| code | 最终状态 | 备注 |
|------|----------|------|
| kp.redox | 待确认修改 | published 提案 |
| kp.redox.valence_change | 自动检查通过 | |
| kp.redox.oxidant | 自动检查通过 | |
| kp.redox.reductant | 自动检查通过 | |
| kp.redox.ox_product | 自动检查通过 | |
| kp.redox.re_product | 自动检查通过 | |
| kp.redox.e_transfer | 自动检查通过 | |
| kp.redox.e_conserve | 自动检查通过 | |
| kp.ion.electrolyte | 自动检查通过 | 本轮已改 |
| kp.ion.ionization_eq | 自动检查通过 | |
| kp.ion.coexist | 自动检查通过 | |
| kp.ion.ionic_eq | 自动检查通过 | 本轮已改 |
| kp.structure.atom | P0已修复 / 自动检查通过 | |
| kp.structure.isotope | 自动检查通过 | |
| kp.structure.bond | 自动检查通过 | |
| kp.structure.electron_formula | 自动检查通过 | 本轮已改 |
| kp.periodic.position | 自动检查通过 | 专项关联已纠正 |
| kp.periodic.e_config | 自动检查通过 | |
| kp.periodic.trend | 自动检查通过 | 本轮已改 |
| kp.calc.amount | 自动检查通过 | 本轮已改 |
| kp.calc.concentration | 自动检查通过 | 专项关联已纠正 |
| kp.calc.dilution | 自动检查通过 | 专项关联已纠正 |
| kp.memory.valence_table | 自动检查通过 | 本轮已改 |
| kp.memory.ion_table | 自动检查通过 | 本轮已改 |
| kp.memory.color_table | 自动检查通过 | 本轮已改 |

---

## 6. 统计对照（整改前 → 现）

| 原标签（首轮报告） | 原数量 | 现处理结果 |
|--------------------|--------|------------|
| 通过 | 65 | 多数仍为自动检查通过 |
| 需要修改 | 21 | 其中 pending 明确项已改；P0 已修；published 3+1 待确认 |
| 需要人工核实 | 3 | 仍为 3（Be/Ar/Fe），已写核实指引 |
| 疑似超纲 | 2 | 仍为 2（I/Cr），已标注了解，待人确认范围 |

**当前工作标签汇总（91）**

| 标签 | 数量 |
|------|------|
| 自动检查通过（含 P0 已修） | 82 |
| 待核实 | 3 |
| 疑似超纲（已标注） | 2 |
| 待确认修改（published） | 4（O/Cl/kp.redox/Na；Na 为 P3） |

> 82+3+2+4=91。

---

## 7. 是否存在阻止正式发布的问题

**是（对“一键全部 published”而言）。**

阻止因素：

1. **published 提案未落地**：`el.O` 价态缺过氧化物 −1（会影响后续 Na₂O₂ 训练口径）。  
2. **81 条导入仍为 `pending_review`**：即使自动检查通过，也**不是**已经人工审核。  
3. **el.I / el.Cr** 范围需人工裁定后才能进默认必修题池。  
4. **el.Be / el.Ar / el.Fe** 待核实项不宜作为权威计算/排布唯一依据。

**不阻止**的部分：

- P0 三类错误已消除。  
- pending_review 中原明确科学错误（单质定义、电荷守恒措辞、标况条件、氮价态、Hg₂²⁺ 等）已整改。

建议发布策略：人工审核通过后分批 `published`；计算专项优先确认公式类；碘/铬默认不进核心卷。

---

## 8. 尚未解决清单（给下一步）

1. 确认是否应用 `published_change_proposals.json`（el.O / el.Cl / kp.redox / el.Na）。  
2. 人工核实 Be / Ar / Fe。  
3. 人工裁定 I / Cr 是否保留在默认训练池。  
4. 对 81 条 `pending_review` 做真正人工审核。  

---

## 9. 限制遵守情况

- 未生成 Batch3 数据  
- 未导入新知识  
- 未修改 377 条清单  
- 未改库结构 / 用户账号 / 新功能  
- 未将自动检查称为人工审核  

**本次 Batch2 质量整改到此停止。**
