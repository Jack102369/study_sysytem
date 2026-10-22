# 高一化学知识库 · 377 条全局质量与覆盖核验报告

> 核验范围：inventory **377** 条（Batch2–6）
> 依据：`CHEMISTRY_QUALITY_STANDARD.md`、各批建设/质检/整改报告、DB 只读抽取
> 核验时间：2026-10-18T11:07:40.947Z
> **本报告为 AI 辅助全库核验，不是人工学科审核。**
> **只读审查：未改数据库、未改导入包、未改 inventory 知识内容、未发布、未开发引擎、未自动修复。**

机器可读结果：

- `docs/chemistry_global_audit/per_item.json`（377 条逐条）
- `docs/chemistry_global_audit/issues.json`
- `docs/chemistry_global_audit/conflicts.json`
- `docs/chemistry_global_audit/specialty_coverage.json`
- `docs/chemistry_global_audit/summary.json`

---

## 1. 全库核验范围与统计口径

| 口径 | 数量 | 说明 |
|------|------|------|
| 计划知识（inventory 编码） | **377** | 91+91+74+42+79 |
| 数据库实际覆盖（编码可解析到行） | **377** | 遗漏 **0** |
| 数据库物理记录合计 | **377** | 八类表 COUNT 之和 |
| inventory 复用/种子口径条数 | **18** | seeded / seeded_audited / q.eq.Na_water |
| 问题数 vs 涉及条数 | 见 §17 | **不得混用** |

物理分表：

| 类型 | 行数 |
|------|------|
| element | 30 |
| substance | 70 |
| reaction | 68 |
| experiment | 42 |
| formula | 17 |
| concept | 36 |
| knowledge | 96 |
| question | 18 |

---

## 2. 各批次知识状态

| 批次 | 计划条数 | published | pending_review |
|------|----------|-----------|----------------|
| batch2 | 91 | 11 | 80 |
| batch3 | 91 | 7 | 84 |
| batch4 | 74 | 0 | 74 |
| batch5 | 42 | 0 | 42 |
| batch6 | 79 | 1 | 78 |

全库 DB 状态合计：published **19**，pending_review **358**。

---

## 3. 覆盖结论

- **377 条编码均已匹配到数据库记录**（含 seeded：按 symbol/唯一 name/published 回退解析）。
- 解析方式分布见 extract（dbId / symbol / unique_name）。
- **遗漏：0。**

---

## 4. 重复知识清单

### 4.1 合理分型（不记为错误重复）

- 元素与单质同名：**12** 组（如 el.Na / sub.Na）。属于 element vs substance 分型，**允许多专项关联，不视为重复实体。**

### 4.2 同名多类型（建议人工确认是否冗余）

| 名称 | 编码 | 类型 | 说明 |
|------|------|------|------|
| 氧化还原反应 | concept.redox, kp.redox | concept+knowledge | 概念/知识点/反应/实验分型常见；复核定义是否冲突 |
| 电子守恒 | concept.electron_conserve, kp.redox.e_conserve | concept+knowledge | 概念/知识点/反应/实验分型常见；复核定义是否冲突 |
| 物质的量浓度 | formula.c_n_V, kp.calc.concentration | formula+knowledge | 概念/知识点/反应/实验分型常见；复核定义是否冲突 |
| 乙醇催化氧化 | rxn.C2H5OH_O2, exp.ethanol_oxid | reaction+experiment | 概念/知识点/反应/实验分型常见；复核定义是否冲突 |

疑似需关注同名组：**4**（非自动删除）。

### 4.3 同一 canonical 反应多编码 / 字段分歧

- 本次按 `canonical_equation` 归一聚类，**未发现**多编码间条件/ox/re 字段明显分歧。

> 多专项挂靠同一反应 **不属于** 重复知识。

---

## 5. 跨批次科学冲突

- 反应 canonical 聚类：**未见**跨编码 ox/re/conditions 硬冲突。
- 同名 concept+knowledge（如氧化还原反应、电子守恒、物质的量浓度）：属分层建设，**建议人工对照定义一致性**，本次未判定为 P0 事实冲突。
- 反应+实验同名（乙醇催化氧化）：反应条与实验条分工，**需保证条件/产物叙述一致**（B6 整改后催化氧化 ox=CH3CHO、re=H2O；实验条书面描述应与之对齐——未见字段级对调残留）。
- **明确错误关联（训练风险）**：若干复分解/酸碱反应 DB 挂了 `redox` 专项但无氧化剂/还原剂字段（见 §7），易导致错误出题池。

---

## 6. 化学方程式检查结果

- reaction 类型 **68** 条均存在 canonical/equation 字段抽查路径。
- B6 P0（乙醇催化氧化/燃烧 ox/re）整改后抽查：**已与目标口径一致**。
- 描述性方程式（如乙烯/KMnO4 不指定唯一产物）：保留限制，禁止当唯一产物填空。
- **局限**：全库未做逐式原子级自动配平证明；“配平正确≠反应一定成立”。无法可靠判定者记入待核实/人工复核建议。

---

## 7. 氧化还原检查结果

### 7.1 历史风险点复查

| 点 | 结果 |
|----|------|
| Batch6 乙醇催化氧化/燃烧 ox/re | **未见残留对调（P0=0）** |
| 钠与水等相关 | 种子/复用存在；published 保护；训练限制见 question |

### 7.2 疑似错误挂靠 redox（P2）

以下反应关联了 redox 专项但缺少氧化剂/还原剂字段（多为复分解/中和，**可能不应进氧化还原默认池**）：

- `rxn.Na2O_H2O`（batch3）：已关联redox专项但缺少氧化剂/还原剂字段
- `rxn.NaOH_CO2`（batch3）：已关联redox专项但缺少氧化剂/还原剂字段
- `rxn.NaOH_HCl`（batch3）：已关联redox专项但缺少氧化剂/还原剂字段
- `rxn.NaHCO3_heat`（batch3）：已关联redox专项但缺少氧化剂/还原剂字段
- `rxn.Na2CO3_2HCl`（batch3）：已关联redox专项但缺少氧化剂/还原剂字段
- `rxn.Al2O3_6HCl`（batch3）：已关联redox专项但缺少氧化剂/还原剂字段
- `rxn.Al2O3_2NaOH`（batch3）：已关联redox专项但缺少氧化剂/还原剂字段
- `rxn.AlOH3_NaOH`（batch3）：已关联redox专项但缺少氧化剂/还原剂字段
- `rxn.AlOH3_3HCl`（batch3）：已关联redox专项但缺少氧化剂/还原剂字段
- `rxn.CuO_2HCl`（batch3）：已关联redox专项但缺少氧化剂/还原剂字段

---

## 8. 计算公式检查结果

- formula **17** 条。
- 规则扫描：未见“22.4 且完全无标况字样”的新增 P1（若正文已含标况则通过规则）。
- Batch5 过量骨架 / 离子浓度：以批次整改报告为准，本次未见重新引入 P0。
- **禁止**将 22.4 L/mol 无条件用于非标况。

---

## 9. 实验知识检查结果

- experiment **42** 条。
- 产品定位：书面分析；禁止家用危险实验。
- 部分早期实验条（如钠相关种子实验）规则提示书面/`homeForbidden` 字段可能偏弱（P2 experiment），**建议全库整改时统一补强**，本次不改库。
- 焰色 / 滴定管 / 限度：仍在 verifyNeeded 清单。

---

## 10. question 骨架（全部 18 条）

| 编码 | 批次 | DB状态 | 有inv | 科学结论 | 训练等级 | 要点 |
|------|------|--------|-------|----------|----------|------|
| `q.calc.amount_basic` | batch5 | pending_review | 是 | 未见明确错误 | B | 题目骨架非正式卷库，自动判题需额外约束 |
| `q.calc.concentration` | batch5 | pending_review | 是 | 未见明确错误 | B | 题目骨架非正式卷库，自动判题需额外约束 |
| `q.calc.equation` | batch5 | pending_review | 是 | 未见明确错误 | B | 题目骨架非正式卷库，自动判题需额外约束 |
| `q.calc.excess` | batch5 | pending_review | 是 | 未见明确错误 | B | 题目骨架非正式卷库，自动判题需额外约束 |
| `q.exp.instrument` | batch5 | pending_review | 是 | 未见明确错误 | B | 题目骨架非正式卷库，自动判题需额外约束 |
| `q.exp.gas_collect` | batch5 | pending_review | 是 | 未见明确错误 | B | 题目骨架非正式卷库，自动判题需额外约束 |
| `q.exp.safety` | batch5 | pending_review | 是 | 未见明确错误 | B | 题目骨架非正式卷库，自动判题需额外约束 |
| `q.eq.balance` | batch5 | pending_review | 是 | 未见明确错误 | B | 题目骨架非正式卷库，自动判题需额外约束 |
| `q.organic.methane` | batch6 | pending_review | 是 | 未见明确错误 | B | 题目骨架非正式卷库，自动判题需额外约束 |
| `q.organic.ethene` | batch6 | pending_review | 是 | 未见明确错误 | B | 题目骨架非正式卷库，自动判题需额外约束 |
| `q.organic.ethanol` | batch6 | pending_review | 是 | 未见明确错误 | B | 题目骨架非正式卷库，自动判题需额外约束 |
| `q.organic.ester` | batch6 | pending_review | 是 | 未见明确错误 | B | 题目骨架非正式卷库，自动判题需额外约束 |
| `q.organic.isomer` | batch6 | pending_review | 是 | 未见明确错误 | B | 题目骨架非正式卷库，自动判题需额外约束 |
| `q.inference.block` | batch6 | pending_review | 是 | 未见明确错误 | B | 题目骨架非正式卷库，自动判题需额外约束 |
| `q.inference.phenomenon` | batch6 | pending_review | 是 | 未见明确错误 | B | 题目骨架非正式卷库，自动判题需额外约束 |
| `q.eq.Na_water` | batch6 | published | 否 | 未见明确错误 | C | published；生成物题非方程式；保留训练适配风险 |
| `q.substance.NaOH` | batch6 | pending_review | 是 | 未见明确错误 | B | 题目骨架非正式卷库，自动判题需额外约束 |
| `q.comprehensive.mock` | batch6 | pending_review | 是 | 未见明确错误 | B | 题目骨架非正式卷库，自动判题需额外约束 |

说明：无 `[inv:]` ≠ 无效知识（published 历史题常见）。Batch5/6 新建 pending 题多数已有 inv。

---

## 11. 教材范围争议 / 待核实清单

inventory.verifyNeeded 或历史争议标记合计问题侧 **P1 scope_verify = 26**（涉及条数见 itemCount）。

| 编码 | 批次 | verifyNeeded | 说明 |
|------|------|-------------|------|
| `el.Fe` | batch2 | 历史 | 历史报告待核实/范围争议条目，需再确认教材口径 |
| `el.I` | batch2 | 历史 | 历史报告待核实/范围争议条目，需再确认教材口径 |
| `el.Cr` | batch2 | 历史 | 历史报告待核实/范围争议条目，需再确认教材口径 |
| `sub.Al2O3` | batch3 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `sub.AlOH3` | batch3 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `rxn.NaOH_CO2` | batch3 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `rxn.2Al_2NaOH` | batch3 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `rxn.Al2O3_2NaOH` | batch3 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `rxn.AlOH3_NaOH` | batch3 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `sub.FeO` | batch3 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `exp.Fe3_SCN` | batch3 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `kp.metal.pig_iron` | batch3 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `kp.metal.steel` | batch3 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `sub.NaAlO2` | batch3 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `kp.Al.salt_aluminate` | batch3 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `sub.P` | batch4 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `sub.P4O10` | batch4 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `sub.bleaching_powder` | batch4 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `exp.ops_burette` | batch5 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `exp.flame_test` | batch5 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `kp.extent.le_chatelier_basic` | batch5 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `concept.heat_of_reaction` | batch6 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `kp.organic.cracking` | batch6 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `kp.organic.pyrolysis` | batch6 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `kp.sustain.atom_economy` | batch6 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |
| `kp.organic.biomolecule` | batch6 | 是 | inventory.verifyNeeded=true，待教材核实，不得视为人工已审 |

**以上均不得视为人工审核通过；默认训练应限制。**

---

## 12. 12 个一级专项覆盖

| 专项 | 关联知识条数 | 关联question | 自动出题就绪？ | 说明 |
|------|--------------|--------------|----------------|------|
| equation | 96 | 3 | **否** | 有知识且有question关联，仍非正式题库 |
| experiment | 64 | 3 | **否** | 有知识且有question关联，仍非正式题库 |
| substance | 178 | 2 | **否** | 有知识且有question关联，仍非正式题库 |
| calculation | 31 | 3 | **否** | 有知识且有question关联，仍非正式题库 |
| ion | 25 | 0 | **否** | 有知识无question骨架，不足以认定可自动出题 |
| redox | 71 | 0 | **否** | 有知识无question骨架，不足以认定可自动出题 |
| periodic | 35 | 0 | **否** | 有知识无question骨架，不足以认定可自动出题 |
| structure | 35 | 0 | **否** | 有知识无question骨架，不足以认定可自动出题 |
| organic | 49 | 5 | **否** | 有知识且有question关联，仍非正式题库 |
| inference | 5 | 2 | **否** | 有知识且有question关联，仍非正式题库 |
| memory | 117 | 0 | **否** | 有知识无question骨架，不足以认定可自动出题 |
| comprehensive | 30 | 1 | **否** | 有知识且有question关联，仍非正式题库 |

> **知识覆盖 ≠ 题目覆盖 ≠ 可正式自动出题。** 即使关联数>0，在 pending_review / 非人审 / 缺正式题库前，不得宣称可上线自动训练。

薄弱示例：`ion` / `redox` / `periodic` / `structure` / `memory` 的 question 关联为 **0**。

---

## 13. 137 个二级分类覆盖

| 指标 | 数量 |
|------|------|
| 二级分类总数 | **137** |
| 无任何实体关联（空分类） | **60** |
| 有关联 | **77** |

空分类完整列表见 `specialty_coverage.json` / 附录 B。

---

## 14. 数据库与导入包一致性

- 新建 imported 条：多数含 `[inv:CODE]`，与批次导入包对应。
- **合理差异**：seeded/published（无 inv 或无导入包行）；`q.eq.Na_water` published 不在 B6 导入包内。
- 部分元素（Be/Ar/Fe/I/Cr）规则提示 pending 缺 inv（P2 status）——属同步瑕疵，**非本次修复**。
- 清单 specialty 与 DB 不一致者见 issues kind=link。

---

## 15. 审核状态与发布风险

| 状态 | 条数 |
|------|------|
| published | 19 |
| pending_review | 358 |

- **绝大多数知识仍为 pending_review，未完成人工审核。**
- 未发现“verifyNeeded 且 published”组合（除需持续关注的训练限制题）。
- `q.eq.Na_water` published：保留方程式专项适配风险，**禁止**当作合格方程式自动判题标准。
- **本次不改变任何审核状态。**

---

## 16. 训练可用性 A/B/C/D（建议级，≠人审）

| 等级 | 条数 | 含义 |
|------|------|------|
| A | **0** | 本核验不授予 A（避免绕过人审） |
| B | **350** | 基本可用建议，仍须人工审核 |
| C | **27** | 待核实/受限/published适配风险 |
| D | **0** | 明确严重错误禁自动出题 |

全部 `formalTrainReady=false`。

---

## 17. P0–P3 统计（问题数 / 涉及条数）

| 级别 | 问题数 | 涉及知识条数 |
|------|--------|--------------|
| P0 | **0** | **0** |
| P1 | **26** | **26** |
| P2 | **46** | **36** |
| P3 | **17** | **17** |

P1 几乎全部为 **教材核实/范围**（scope_verify），不是新发现的方程式配平 P0。

---

## 18. 推荐整改优先级（供下一步圈定范围）

1. **P2 redox 误挂**：酸碱/复分解反应取消或纠正 redox 专项关联。
2. **空二级分类 + 无 question 专项**：补骨架或明确“暂缓自动出题”。
3. **统一实验书面定位字段**（早期种子实验）。
4. **补 pending 缺 [inv:] 的元素等同步瑕疵。**
5. **教材定点核实** verifyNeeded 清单（约 23 口径）。
6. **published 钠水题**：新建 pending 方程式骨架，勿覆盖。

---

## 19. 总判断

| 问题 | 结论 |
|------|------|
| 是否存在重大科学错误（未修复 P0） | **否**（P0 问题数=0） |
| 是否可以进入全库整改 | **是** |
| 是否允许正式发布 | **否** |
| 是否具备开发训练引擎的基础 | **有数据与专项结构基础；不具备未经人审即自动出题上线的条件** |

---

## 20. 审查局限性

- AI/规则扫描辅助，**不能替代**教师对全部方程式与教材页码的确认。
- 未运行自动组卷引擎实测。
- 跨批次“同名分层”未展开全文语义差分。
- 空分类可能仍可通过上级专项抽题，但二级覆盖不足会影响精细化训练。

---

## 附录 A · 377 条逐条核验结果

> 完整字段见 `per_item.json`。下表为逐条结论摘要。

| 编码 | 批次 | 类型 | 存在 | 状态 | inv | 科学结论 | 训练等级 | 最高问题 |
|------|------|------|------|------|-----|----------|----------|----------|
| `el.H` | batch2 | element | Y | published | N | 未见明确错误 | B | — |
| `el.He` | batch2 | element | Y | pending_review | Y | 未见明确错误 | B | — |
| `el.Li` | batch2 | element | Y | pending_review | Y | 未见明确错误 | B | — |
| `el.Be` | batch2 | element | Y | pending_review | N | 未见明确错误 | B | P2 |
| `el.B` | batch2 | element | Y | pending_review | Y | 未见明确错误 | B | — |
| `el.C` | batch2 | element | Y | pending_review | Y | 未见明确错误 | B | — |
| `el.N` | batch2 | element | Y | pending_review | Y | 未见明确错误 | B | — |
| `el.O` | batch2 | element | Y | published | N | 未见明确错误 | B | — |
| `el.F` | batch2 | element | Y | pending_review | Y | 未见明确错误 | B | — |
| `el.Ne` | batch2 | element | Y | pending_review | Y | 未见明确错误 | B | — |
| `el.Na` | batch2 | element | Y | published | N | 未见明确错误 | B | — |
| `el.Mg` | batch2 | element | Y | pending_review | Y | 未见明确错误 | B | — |
| `el.Al` | batch2 | element | Y | pending_review | Y | 未见明确错误 | B | — |
| `el.Si` | batch2 | element | Y | pending_review | Y | 未见明确错误 | B | — |
| `el.P` | batch2 | element | Y | pending_review | Y | 未见明确错误 | B | — |
| `el.S` | batch2 | element | Y | pending_review | Y | 未见明确错误 | B | — |
| `el.Cl` | batch2 | element | Y | published | N | 未见明确错误 | B | — |
| `el.Ar` | batch2 | element | Y | pending_review | N | 未见明确错误 | B | P2 |
| `el.K` | batch2 | element | Y | pending_review | Y | 未见明确错误 | B | — |
| `el.Ca` | batch2 | element | Y | pending_review | Y | 未见明确错误 | B | — |
| `el.Fe` | batch2 | element | Y | pending_review | N | 待核实 | C | P1 |
| `el.Cu` | batch2 | element | Y | pending_review | Y | 未见明确错误 | B | — |
| `el.Zn` | batch2 | element | Y | pending_review | Y | 未见明确错误 | B | — |
| `el.Ag` | batch2 | element | Y | pending_review | Y | 未见明确错误 | B | — |
| `el.Ba` | batch2 | element | Y | pending_review | Y | 未见明确错误 | B | — |
| `el.I` | batch2 | element | Y | pending_review | N | 待核实 | C | P1 |
| `el.Mn` | batch2 | element | Y | pending_review | Y | 未见明确错误 | B | — |
| `el.Cr` | batch2 | element | Y | pending_review | N | 待核实 | C | P1 |
| `el.Br` | batch2 | element | Y | pending_review | Y | 未见明确错误 | B | — |
| `el.Hg` | batch2 | element | Y | published | Y | 未见明确错误 | B | — |
| `concept.substance_class` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.pure_mixture` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.elemental_compound` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.electrolyte` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.nonelectrolyte` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.ionization` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.ionic_reaction` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.ion_coexist` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.redox` | batch2 | concept | Y | published | N | 未见明确错误 | B | — |
| `concept.oxidant_reductant` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.valence_rules` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.periodic_law` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.metal_trend` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.nonmetal_trend` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.ionic_bond` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.covalent_bond` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.reaction_rate` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.reaction_extent` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.mass_conserve` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.charge_conserve` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.electron_conserve` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.solution_colloid` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.acid_base_salt` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.oxide_class` | batch2 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `formula.n_m_M` | batch2 | formula | Y | published | N | 未见明确错误 | B | — |
| `formula.N_n_NA` | batch2 | formula | Y | pending_review | Y | 未见明确错误 | B | — |
| `formula.Vm` | batch2 | formula | Y | pending_review | Y | 未见明确错误 | B | — |
| `formula.c_n_V` | batch2 | formula | Y | pending_review | Y | 未见明确错误 | B | — |
| `formula.dilution` | batch2 | formula | Y | pending_review | Y | 未见明确错误 | B | — |
| `formula.M_m_n` | batch2 | formula | Y | pending_review | Y | 未见明确错误 | B | — |
| `formula.rho_c_M` | batch2 | formula | Y | pending_review | Y | 未见明确错误 | B | — |
| `formula.mass_percent` | batch2 | formula | Y | pending_review | Y | 未见明确错误 | B | — |
| `formula.equation_ratio` | batch2 | formula | Y | pending_review | Y | 未见明确错误 | B | — |
| `formula.electron_transfer` | batch2 | formula | Y | pending_review | Y | 未见明确错误 | B | — |
| `formula.gas_STP` | batch2 | formula | Y | pending_review | Y | 未见明确错误 | B | — |
| `formula.Avogadro` | batch2 | formula | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.redox` | batch2 | knowledge | Y | published | N | 未见明确错误 | B | — |
| `kp.redox.valence_change` | batch2 | knowledge | Y | published | N | 未见明确错误 | B | — |
| `kp.redox.oxidant` | batch2 | knowledge | Y | published | N | 未见明确错误 | B | — |
| `kp.redox.reductant` | batch2 | knowledge | Y | published | N | 未见明确错误 | B | — |
| `kp.redox.ox_product` | batch2 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.redox.re_product` | batch2 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.redox.e_transfer` | batch2 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.redox.e_conserve` | batch2 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.ion.electrolyte` | batch2 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.ion.ionization_eq` | batch2 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.ion.coexist` | batch2 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.ion.ionic_eq` | batch2 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.structure.atom` | batch2 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.structure.isotope` | batch2 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.structure.bond` | batch2 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.structure.electron_formula` | batch2 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.periodic.position` | batch2 | knowledge | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `kp.periodic.e_config` | batch2 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.periodic.trend` | batch2 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.calc.amount` | batch2 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.calc.concentration` | batch2 | knowledge | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `kp.calc.dilution` | batch2 | knowledge | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `kp.memory.valence_table` | batch2 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.memory.ion_table` | batch2 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.memory.color_table` | batch2 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.Na` | batch3 | substance | Y | published | N | 未见明确错误 | B | — |
| `sub.Na2O` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.Na2O2` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.NaOH` | batch3 | substance | Y | published | N | 未见明确错误 | B | — |
| `sub.Na2CO3` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.NaHCO3` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.NaCl` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.Mg` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.MgO` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.MgOH2` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.Al` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.Al2O3` | batch3 | substance | Y | pending_review | Y | 待核实 | C | P1 |
| `sub.AlOH3` | batch3 | substance | Y | pending_review | Y | 待核实 | C | P1 |
| `sub.Fe` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.Fe2O3` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.Fe3O4` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.FeOH3` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.FeCl3` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.Cu` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.CuO` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.CuOH2` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.CuSO4` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.Zn` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.Ag` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.H2` | batch3 | substance | Y | published | N | 未见明确错误 | B | — |
| `sub.H2O` | batch3 | substance | Y | published | N | 未见明确错误 | B | — |
| `sub.O2` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.CO2` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.2Na_2H2O` | batch3 | reaction | Y | published | N | 未见明确错误 | B | — |
| `rxn.4Na_O2` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.2Na_O2_heat` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.2Na2O2_2H2O` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.2Na2O2_2CO2` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.Na2O_H2O` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `rxn.NaOH_CO2` | batch3 | reaction | Y | pending_review | Y | 待核实 | C | P1 |
| `rxn.NaOH_HCl` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `rxn.NaHCO3_heat` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `rxn.Na2CO3_2HCl` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `rxn.2Mg_O2` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.Mg_2HCl` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.Mg_CO2` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.4Al_3O2` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.2Al_6HCl` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.2Al_2NaOH` | batch3 | reaction | Y | pending_review | Y | 待核实 | C | P1 |
| `rxn.Al2O3_6HCl` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `rxn.Al2O3_2NaOH` | batch3 | reaction | Y | pending_review | Y | 待核实 | C | P1 |
| `rxn.AlOH3_NaOH` | batch3 | reaction | Y | pending_review | Y | 待核实 | C | P1 |
| `rxn.AlOH3_3HCl` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `rxn.3Fe_2O2` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.Fe_H2SO4` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.Fe_CuSO4` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.Fe2O3_3CO` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.Cu_O2_heat` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.CuO_H2` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.CuO_2HCl` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `rxn.Zn_H2SO4` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.Zn_CuSO4` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.Na_H2O` | batch3 | experiment | Y | published | N | 未见明确错误 | B | P2 |
| `exp.Na_O2` | batch3 | experiment | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `exp.Na2O2_H2O` | batch3 | experiment | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `exp.Al_amphoteric` | batch3 | experiment | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `exp.Fe_rust` | batch3 | experiment | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `exp.metal_activity` | batch3 | experiment | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `exp.CuO_H2_reduce` | batch3 | experiment | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `kp.Na.property` | batch3 | knowledge | Y | published | N | 未见明确错误 | B | — |
| `kp.Na.oxide` | batch3 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.Na.carbonate` | batch3 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.Al.amphoteric` | batch3 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.Fe.property` | batch3 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.metal.activity` | batch3 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.metal.smelting` | batch3 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.FeO` | batch3 | substance | Y | pending_review | Y | 待核实 | C | P1 |
| `sub.FeOH2` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.FeSO4` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.Fe.fe2_property` | batch3 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.Fe.fe3_property` | batch3 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.Fe.fe2_fe3` | batch3 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.Fe.test` | batch3 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.Fe.salt` | batch3 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.FeOH2_O2` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.2Fe2_Cl2` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.Fe3_SCN` | batch3 | experiment | Y | pending_review | Y | 待核实 | C | P1 |
| `concept.alloy` | batch3 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.metal.pig_iron` | batch3 | knowledge | Y | pending_review | Y | 待核实 | C | P1 |
| `kp.metal.steel` | batch3 | knowledge | Y | pending_review | Y | 待核实 | C | P1 |
| `kp.metal.stainless` | batch3 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.NaAlO2` | batch3 | substance | Y | pending_review | Y | 待核实 | C | P1 |
| `sub.AlCl3` | batch3 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.Na2CO3_CO2_H2O` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.2Na_2HCl` | batch3 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.Al.salt_aluminate` | batch3 | knowledge | Y | pending_review | Y | 待核实 | C | P1 |
| `sub.Cl2` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.HCl` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.HCl_aq` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.HClO` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.NaClO` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.S` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.SO2` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.SO3` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.H2SO4` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.H2SO3` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.N2` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.NH3` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.NO` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.NO2` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.HNO3` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.C` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.CO` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.Si` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.SiO2` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.Na2SiO3` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.P` | batch4 | substance | Y | pending_review | Y | 待核实 | C | P1 |
| `sub.P4O10` | batch4 | substance | Y | pending_review | Y | 待核实 | C | P1 |
| `sub.H2S` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.CaCO3` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.CaOH2` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.H2_Cl2` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.2Na_Cl2` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.2Fe_3Cl2` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.Cl2_H2O` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.Cl2_2NaOH` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.MnO2_4HCl` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.S_O2` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.2SO2_O2` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.SO3_H2O` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.Cu_2H2SO4` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.C_2H2SO4` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.N2_3H2` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.NH3_HCl` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.4NH3_5O2` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.2NO_O2` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.3NO2_H2O` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.Cu_4HNO3` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.Cu_4HNO3c` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.C_O2_incomplete` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.C_O2_complete` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.CO2_CaOH2` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.SiO2_2NaOH` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.SiO2_2C` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.CaCO3_2HCl` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.Cl2_prep` | batch4 | experiment | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `exp.Cl2_property` | batch4 | experiment | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `exp.HCl_prep` | batch4 | experiment | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `exp.SO2_property` | batch4 | experiment | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `exp.NH3_prep` | batch4 | experiment | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `exp.HNO3_Cu` | batch4 | experiment | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `exp.CO2_property` | batch4 | experiment | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `exp.SiO2_glass` | batch4 | experiment | Y | pending_review | Y | 未见明确错误 | B | P2 |
| `kp.Cl.property` | batch4 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.Cl.prep` | batch4 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.S.oxide` | batch4 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.N.cycle` | batch4 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.N.ammonia` | batch4 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.C.oxide` | batch4 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.Si.property` | batch4 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.nonmetal.test` | batch4 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.Br2` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.I2` | batch4 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.bleaching_powder` | batch4 | substance | Y | pending_review | Y | 待核实 | C | P1 |
| `kp.S.conc_H2SO4` | batch4 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.N.ammonium` | batch4 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.NH4Cl_NaOH` | batch4 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.halogen.compare` | batch4 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.N.synth_ammonia` | batch4 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.Cl.bleach` | batch4 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.instrument_basic` | batch5 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.ops_weigh` | batch5 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.ops_dissolve` | batch5 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.ops_filter` | batch5 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.ops_evaporate` | batch5 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.ops_distill` | batch5 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.ops_extract` | batch5 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.gas_collect_upward` | batch5 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.gas_collect_downward` | batch5 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.gas_collect_water` | batch5 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.O2_prep_KMnO4` | batch5 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.O2_prep_H2O2` | batch5 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.H2_prep_Zn` | batch5 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.CO2_prep_marble` | batch5 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.check_airtight` | batch5 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.safety_rules` | batch5 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `formula.mixed_stoich` | batch5 | formula | Y | pending_review | Y | 未见明确错误 | B | — |
| `formula.excess_reactant` | batch5 | formula | Y | pending_review | Y | 未见明确错误 | B | — |
| `formula.purity` | batch5 | formula | Y | pending_review | Y | 未见明确错误 | B | — |
| `formula.ion_conc` | batch5 | formula | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.calc.stoich` | batch5 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.calc.excess` | batch5 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.calc.gas` | batch5 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.calc.solution` | batch5 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.exp.design` | batch5 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.exp.error` | batch5 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `q.calc.amount_basic` | batch5 | question | Y | pending_review | Y | 未见明确错误 | B | P3 |
| `q.calc.concentration` | batch5 | question | Y | pending_review | Y | 未见明确错误 | B | P3 |
| `q.calc.equation` | batch5 | question | Y | pending_review | Y | 未见明确错误 | B | P3 |
| `q.calc.excess` | batch5 | question | Y | pending_review | Y | 未见明确错误 | B | P3 |
| `q.exp.instrument` | batch5 | question | Y | pending_review | Y | 未见明确错误 | B | P3 |
| `q.exp.gas_collect` | batch5 | question | Y | pending_review | Y | 未见明确错误 | B | P3 |
| `q.exp.safety` | batch5 | question | Y | pending_review | Y | 未见明确错误 | B | P3 |
| `q.eq.balance` | batch5 | question | Y | pending_review | Y | 未见明确错误 | B | P3 |
| `kp.exp.gas_wash_dry` | batch5 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.ops_volumetric_flask` | batch5 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.ops_burette` | batch5 | experiment | Y | pending_review | Y | 待核实 | C | P1 |
| `exp.flame_test` | batch5 | experiment | Y | pending_review | Y | 待核实 | C | P1 |
| `formula.rate_v` | batch5 | formula | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.rate.factors` | batch5 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.reversible` | batch5 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.extent.le_chatelier_basic` | batch5 | knowledge | Y | pending_review | Y | 待核实 | C | P1 |
| `sub.CH4` | batch6 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.C2H4` | batch6 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.C2H6` | batch6 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.C2H5OH` | batch6 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.CH3COOH` | batch6 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.CH3COOCH2CH3` | batch6 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.C2H2` | batch6 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.C3H8` | batch6 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `sub.C6H6` | batch6 | substance | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.CH4_Cl2` | batch6 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.C2H4_Br2` | batch6 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.C2H4_H2O` | batch6 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.C2H4_H2` | batch6 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.C2H5OH_O2` | batch6 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.C2H5OH_burn` | batch6 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.esterification` | batch6 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.CH3COOH_NaOH` | batch6 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `rxn.CH3COOH_Na2CO3` | batch6 | reaction | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.CH4_property` | batch6 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.C2H4_prep` | batch6 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.C2H4_Br2` | batch6 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.ethanol_oxid` | batch6 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.esterification` | batch6 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.acetic_acid` | batch6 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.homolog` | batch6 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.isomer` | batch6 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.functional_group` | batch6 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.substitution` | batch6 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.addition` | batch6 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.esterification_rule` | batch6 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.organic.methane` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.organic.alkane` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.organic.ethene` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.organic.ethanol` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.organic.acetic` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.organic.isomer_skill` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.inference.color` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.inference.block` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.inference.conversion` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.comprehensive.basic` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `q.organic.methane` | batch6 | question | Y | pending_review | Y | 未见明确错误 | B | P3 |
| `q.organic.ethene` | batch6 | question | Y | pending_review | Y | 未见明确错误 | B | P3 |
| `q.organic.ethanol` | batch6 | question | Y | pending_review | Y | 未见明确错误 | B | P3 |
| `q.organic.ester` | batch6 | question | Y | pending_review | Y | 未见明确错误 | B | P3 |
| `q.organic.isomer` | batch6 | question | Y | pending_review | Y | 未见明确错误 | B | P3 |
| `q.inference.block` | batch6 | question | Y | pending_review | Y | 未见明确错误 | B | P3 |
| `q.inference.phenomenon` | batch6 | question | Y | pending_review | Y | 未见明确错误 | B | P3 |
| `q.eq.Na_water` | batch6 | question | Y | published | N | 未见明确错误 | C | P2 |
| `q.substance.NaOH` | batch6 | question | Y | pending_review | Y | 未见明确错误 | B | P3 |
| `q.comprehensive.mock` | batch6 | question | Y | pending_review | Y | 未见明确错误 | B | P3 |
| `concept.endothermic` | batch6 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.exothermic` | batch6 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.energy.bond_change` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.energy.chem_electric` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.energy.galvanic` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.energy.galvanic_poles` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.energy.electron_flow` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.energy.electrode_rxn` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.energy.chem_power` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `exp.galvanic_Zn_Cu` | batch6 | experiment | Y | pending_review | Y | 未见明确错误 | B | — |
| `concept.heat_of_reaction` | batch6 | concept | Y | pending_review | Y | 待核实 | C | P1 |
| `kp.energy.thermo_eq` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.sustain.seawater` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.sustain.coal` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.organic.petroleum` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.organic.cracking` | batch6 | knowledge | Y | pending_review | Y | 待核实 | C | P1 |
| `kp.organic.pyrolysis` | batch6 | knowledge | Y | pending_review | Y | 待核实 | C | P1 |
| `kp.sustain.natural_gas` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.sustain.fertilizer` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.sustain.pesticide` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.sustain.medicine` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.sustain.food_additive` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.enviro.pollution` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.enviro.acid_rain` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.sustain.green_chem` | batch6 | knowledge | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.sustain.atom_economy` | batch6 | knowledge | Y | pending_review | Y | 待核实 | C | P1 |
| `concept.addition_polymer` | batch6 | concept | Y | pending_review | Y | 未见明确错误 | B | — |
| `kp.organic.biomolecule` | batch6 | knowledge | Y | pending_review | Y | 待核实 | C | P1 |
| `rxn.C2H4_KMnO4` | batch6 | reaction | Y | pending_review | Y | 未见明确错误 | B | P2 |

---

## 附录 B · 空二级分类列表

`equation.complete_reactant`、`equation.complete_product`、`equation.true_false`、`equation.ionic_correct`、`experiment.conclusion`、`substance.solubility`、`substance.storage`、`substance.identify`、`calculation.atomic_mass`、`calculation.molecular_mass`、`calculation.molar_mass`、`calculation.avogadro`、`calculation.molar_volume`、`calculation.concentration`、`calculation.dilution`、`calculation.electron_conserve`、`ion.formula_split`、`ion.ionic_correct`、`redox.reductant`、`redox.e_count`、`redox.double_bridge`、`redox.single_bridge`、`periodic.atomic_number`、`periodic.atomic_mass`、`periodic.period`、`periodic.group_col`、`periodic.atom_structure`、`periodic.electron_config`、`periodic.common_valence`、`structure.atom_compose`、`structure.proton`、`structure.neutron`、`structure.electron`、`structure.atom_diagram`、`structure.ion_diagram`、`structure.nuclide`、`structure.isotope`、`structure.electron_formula`、`structure.ionic_compound`、`structure.covalent_compound`、`organic.alkane`、`inference.color`、`inference.phenomenon`、`inference.relation`、`inference.composition`、`inference.valence`、`inference.conversion`、`inference.block_diagram`、`inference.mixed`、`memory.formula`、`memory.precipitate`、`memory.gas`、`memory.phenomenon`、`memory.equation`、`comprehensive.medium`、`comprehensive.advanced`、`comprehensive.mistakes`、`comprehensive.weak`、`comprehensive.timed`、`comprehensive.mock`

---

*全库核验完成。停止。等待根据本报告确定整改范围。*
