# 高一化学知识库 · Batch6 建设报告

> 第六阶段：有机化学、化学反应与能量及综合（清单 **79** 条）  
> 建设日期：2026-10-18  
> 依据：`chemistry_kb_inventory.json`（**377** 条全量）、`CHEMISTRY_QUALITY_STANDARD.md`  
> **产品定位**：实验专项 = **书面题目训练**。不要求线下动手；不开发器材管理/预约/操作记录/虚拟实验。  
> **AI/脚本基础检查 ≠ 人工审核；≠ Batch6 专项质量审查。**  
> 新增均为 `pending_review`。**未自动发布。未开发训练引擎。未执行 Batch6 专项质量审查。**

---

## 1. 建设情况总览

| 指标 | 数量 |
|------|------|
| 计划数量 | **79** |
| 实际复用 | **1**（`q.eq.Na_water`） |
| 实际新增并导入成功 | **78** |
| 导入失败 | **0** |
| 遗漏 | **0** |
| 重复创建 | **否**（`duplicateInv=0`） |
| 编码冲突 | **否** |
| 覆盖核对通过 | **79/79** |
| 待审核（pending_review，新建） | **78** |
| 专项关联 | **linkOk=78，linkFail=0** |
| 待教材核实（清单 verifyNeeded） | **5** |
| 清单总量 | **377**（未增删编码） |
| Batch2–5 样本完好 | `exp.instrument_basic`、`sub.Cl2` 仍在 |

按类型：

| 类型 | 计划 | 新建导入 | 复用 |
|------|------|----------|------|
| substance | 9 | 9 | 0 |
| reaction | 10 | 10 | 0 |
| experiment | 7 | 7 | 0 |
| concept | 10 | 10 | 0 |
| knowledge | 33 | 33 | 0 |
| question | 10 | 9 | 1（`q.eq.Na_water`） |
| **合计** | **79** | **78** | **1** |

导入包：

| 包 | 内容 | 数量 |
|----|------|------|
| B6-A | substance | 9 |
| B6-B | reaction | 10 |
| B6-C | experiment | 7 |
| B6-D | concept | 10 |
| B6-E | knowledge | 33 |
| B6-F | question | 9 |

---

## 2. 复用检查

对照 DB 名称 / `[inv:CODE]`：**仅 `q.eq.Na_water` 可复用**（已入库阶段二示例题）。  
其余 78 条均无同编码冲突，全部新建。  
见 `docs/chemistry_batch6/reuse_check.json`。

---

## 3. 有机知识建设情况

### 物质（9）

甲烷、乙烯、乙烷、乙醇、乙酸、乙酸乙酯、乙炔、丙烷、苯。  
分子式/结构简式写入 `canonicalFormula` 与性质字段；标签 `organic`。

课程范围标注：

| 编码 | 范围处理 |
|------|----------|
| `sub.C2H2` | 必修了解深度；勿默认复杂推断 |
| `sub.C6H6` | 必修了解结构稳定性；勿默认选修芳香取代训练 |

### 反应（10）

| 编码 | 要点 |
|------|------|
| `rxn.CH4_Cl2` | 光照取代；canonical 示第一步，原理明确可生成多种氯代产物 |
| `rxn.C2H4_Br2` / `H2O` / `H2` | 加成；条件齐全 |
| `rxn.C2H5OH_O2` | Cu/Ag 催化并加热 |
| `rxn.C2H5OH_burn` | 燃烧配平 |
| `rxn.esterification` | ⇌；浓硫酸催化加热；可逆 |
| `rxn.CH3COOH_NaOH` / `Na2CO3` | 中和；酸性强于碳酸 |
| `rxn.C2H4_KMnO4` | 褪色说明不饱和；**不指定唯一氧化产物** |

### 概念（有机相关）

同系物、同分异构、官能团初步、取代、加成、酯化规律、加聚。  
同分异构：高一书写有限，复杂推断限默认训练。

---

## 4. 能量与原电池知识建设情况

| 主题 | 编码 | 要点 |
|------|------|------|
| 吸热/放热 | `concept.endothermic` / `exothermic` | 加热≠吸热判据；断键吸能、成键放能 |
| 反应热 | `concept.heat_of_reaction` | **待教材核实**；概念级；禁复杂定量默认 |
| 化学键与能量 | `kp.energy.bond_change` | 定性 |
| 原电池族 | `kp.energy.galvanic*` / `chem_electric` / `chem_power` / `electrode_rxn` / `electron_flow` | 电子走外电路；离子走电解质；非必须两种不同金属 |
| 热化学方程式 | `kp.energy.thermo_eq` | 书写认知，非深度计算 |
| 铜锌实验 | `exp.galvanic_Zn_Cu` | 书面分析；CuSO₄ vs 稀 H₂SO₄ 正极不同 |

---

## 5. 实验知识建设情况（7）

全部 `expBase` + 书面专用说明；`homeForbiddenNote` 统一。

| 编码 | 用途 |
|------|------|
| `exp.CH4_property` | 甲烷性质/多氯代认知 |
| `exp.C2H4_prep` | 乙烯实验室制法装置分析 |
| `exp.C2H4_Br2` | 溴水褪色现象判断 |
| `exp.ethanol_oxid` | 催化氧化条件与现象 |
| `exp.esterification` | 酯化制备装置/吸收液分析 |
| `exp.acetic_acid` | 乙酸酸性验证 |
| `exp.galvanic_Zn_Cu` | 原电池电极与流向 |

不设计线下操作任务。

---

## 6. question 骨架建设情况（10）

| 编码 | 处理 |
|------|------|
| `q.eq.Na_water` | **复用已有**，不新建 |
| 其余 9 条 | 新建骨架；`pending_review` |

骨架用途：未来出题模板；**非正式训练卷**。  
题型覆盖：选择/判断/填空/简答/推断等。

### 导入缺陷与修复

`createQuestion` 原先未写入 `reviewNote`（Batch5 的 8 条 question 同样缺 `[inv:]`，**仅记录，未改 Batch5**）。  
本次已：

1. 修复 `apps/api/src/chemistry/kb/chem-kb.service.ts` 的 create/update question  
2. DTO 增加 `reviewNote`  
3. 回填 Batch6 的 9 条 `review_note`（`patch_question_review_notes.js`）

回填后覆盖 **79/79**。

---

## 7. 专项关联检查

导入 `linkOk=78`，`linkFail=0`。  
按清单 `specialtyCodes` / `categoryCodes` 写入，未机械全挂氧化还原。  
有机反应按内容关联 organic / equation；原电池主要挂 energy/comprehensive，非一律 experiment。

---

## 8. 基础科学性检查（建设期）

脚本：`docs/chemistry_batch6/basic_science_check.json`（内容侧抽查）。

| 检查项 | 结果 |
|--------|------|
| 分子式/结构简式（重点有机物） | 通过（建设期） |
| CH₄ 氯代多种产物 | 通过 |
| 酯化可逆与条件 | 通过 |
| 乙醇催化氧化条件 | 通过 |
| 乙烯/KMnO₄ 不指定唯一产物 | 通过（正文含「不得指定唯一氧化产物」） |
| 吸放热与加热条件区分 | 通过 |
| 原电池电子/离子区分 | 通过 |
| 5 条 verifyNeeded 保留待核实 | 通过 |
| 方程式配平（燃烧/酯化/中和等） | 建设期抽查通过 |

**不能把基础检查通过等同于专项质量审查通过。**

建设期未发现 **P0 级重大科学错误**（事实明显错误、必错方程式）。  
范围争议与待核实见下节。

---

## 9. 待教材核实知识清单（5）

| 编码 | 待核实问题 | 默认训练 |
|------|------------|----------|
| `concept.heat_of_reaction` | 燃烧热/中和热命名与定量深度是否入必修默认 | 限制 |
| `kp.organic.cracking` | 裂化定义、产物与教材表述深度 | 限制 |
| `kp.organic.pyrolysis` | 裂解与裂化区分、是否必修核心 | 限制 |
| `kp.sustain.atom_economy` | 原子经济性是否高一必修表述 | 限制 |
| `kp.organic.biomolecule` | 糖/蛋白/油脂了解深度 | 限制 |

均保留 `verifyNeeded`；**未**取消；**未**标人工审核通过。

---

## 10. 课程范围争议（摘要）

| 内容 | 建议定位 |
|------|----------|
| 乙炔、苯 | 必修了解；勿默认选修深度 |
| 裂化/裂解 | 待核实；限制默认训练 |
| 复杂有机推断 / 大量同分异构 | 限默认；骨架题注明条件 |
| 原电池电极反应定量 | 题设电解质限定；勿超纲 |
| 热化学复杂计算 | 非默认核心 |

---

## 11. 数据库实际验证结果

| 项 | 结果 |
|----|------|
| 导入成功 | 78 |
| 复用 | 1 |
| 失败 | 0 |
| `[inv:CODE]`（含回填后） | 79 覆盖 OK |
| status | 新建 78 = `pending_review` |
| 重复 `[inv:]` | 0 |
| 清单编码数 | 377 |
| 先验样本 Batch4/5 | 存在 |

详见 `docs/chemistry_batch6/verify_post_import.json`、`import_all_results.json`。

---

## 12. 审核状态统计

| 状态 | Batch6 |
|------|--------|
| pending_review（新建） | 78 |
| seeded（复用） | 1 |
| published（本批） | 0 |

全库 status 分布见 inventory `summary.byStatus`（建设后：`imported` 359 + `seeded_audited` 17 + `seeded` 1 等，以 JSON 为准）。

---

## 13. 是否可以进入 Batch6 专项质量审查

| 问题 | 结论 |
|------|------|
| 79 条是否齐备 | **是** |
| 安全导入是否成功 | **是** |
| 是否存在重大科学错误（建设期） | **否** |
| 是否可进入 Batch6 专项质量审查 | **是**（待指令；勿自动执行） |
| 是否允许正式发布 | **否** |
| 是否已做专项质量审查 | **否** |

---

## 14. 产物路径

| 路径 | 说明 |
|------|------|
| `docs/chemistry_batch6/batch6_content.js` | 内容源 |
| `docs/chemistry_batch6/import_B6-*.json` | 导入包 |
| `docs/chemistry_batch6/import_all_results.json` | 导入结果 |
| `docs/chemistry_batch6/verify_post_import.json` | DB 验证 |
| `docs/chemistry_batch6/reuse_check.json` | 复用检查 |
| `docs/CHEMISTRY_BATCH6_REPORT.md` | 本报告 |

---

## 15. 下一步（停止点）

1. **等待指令**后可启动 Batch6 专项质量审查  
2. 5 条待教材核实可定点核对  
3. 可选：回填 Batch5 的 8 条 question `review_note`（同 bug，本次未改）  
4. 人工审核前保持 `pending_review`，勿 published  
5. 勿自动开发训练引擎  
