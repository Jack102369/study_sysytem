# 高一化学知识库 · Batch5 建设报告

> 第五阶段：实验和计算数据（清单 **42** 条）  
> 建设日期：2026-10-18  
> 依据：`chemistry_kb_inventory.json`（377 条全量）、`CHEMISTRY_QUALITY_STANDARD.md`  
> **产品定位**：实验专项 = **书面题目训练**（现象/操作正误/步骤排序/结论推断/装置/误差/方案评价/安全判断）。**不要求**学生线下动手；不开发器材管理、预约、操作记录、虚拟实验。  
> **AI/脚本检查 ≠ 人工审核。** 新增均为 `pending_review`。  
> **未进入 Batch5 专项质量审查；未进入 Batch6；未开发训练/判题引擎。**

---

## 1. 建设情况总览

| 指标 | 数量 |
|------|------|
| 计划数量 | **42** |
| 已有复用 | **0** |
| 新建并导入成功 | **42** |
| 导入失败 | **0** |
| 遗漏 | **0** |
| 重复创建 | **否** |
| 编码冲突 | **否** |
| 待审核（pending_review） | **42** |
| 专项关联 | **linkOk=42，linkFail=0** |
| 清单总量 | **377**（未增删编码） |

按类型：

| 类型 | 条数 | 新建导入 |
|------|------|----------|
| experiment | 19 | 19 |
| formula | 5 | 5 |
| knowledge | 9 | 9 |
| question | 8 | 8（骨架） |
| concept | 1 | 1 |

导入包：

| 包 | 内容 | 数量 |
|----|------|------|
| B5-A | experiment | 19 |
| B5-B | formula | 5 |
| B5-C | knowledge | 9 |
| B5-D | question | 8 |
| B5-E | concept | 1 |

---

## 2. 复用检查

对照 DB 名称 / `[inv:CODE]`：**0** 条可复用。  
Batch2 已有基础公式（`formula.n_m_M`、`formula.c_n_V`、`formula.Vm` 等）不在本批 42 编码内，未重复创建。  

见 `docs/chemistry_batch5/reuse_check.json`。

---

## 3. 产品定位落实（实验）

| 要求 | 落实 |
|------|------|
| 仅书面分析题训练 | 全部实验 `purpose` 含「书面分析题训练」；统一 `homeForbiddenNote` |
| 不引导学生动手危险实验 | `exp.H2_prep_Zn`、`exp.O2_prep_KMnO4` 标 `isHazardous=true` + 强安全提示 |
| 仍保留原理/步骤/现象/结论 | 结构化字段齐全，供未来出题依据 |
| 不开发实验平台功能 | 本次仅知识库建设 |

未来题型预期（本批未开发引擎）：选择、填空、判断、排序、简答分析。

---

## 4. 实验知识建设情况（19）

覆盖：仪器识别、称量、溶解、过滤、蒸发、蒸馏/萃取认知、三种集气、O₂/H₂/CO₂ 制取认知、气密性、安全通则、容量瓶定容、滴定管认知、焰色反应。

安全限制摘要：

| 编码 | 说明 |
|------|------|
| `exp.H2_prep_Zn` | 易燃气体；书面专用 |
| `exp.O2_prep_KMnO4` | 加热高锰酸钾；书面专用 |
| 全部实验 | 禁止家用自行实验声明 |

---

## 5. 计算知识建设情况

### 公式（5）

| 编码 | 要点 |
|------|------|
| `formula.mixed_stoich` | 多步关系式法 |
| `formula.excess_reactant` | n/计量数比较判断过量 |
| `formula.purity` | 纯度与产率定义 |
| `formula.ion_conc` | 强电解质入门；禁 Ka |
| `formula.rate_v` | v=Δc/Δt 平均速率 |

### 知识点（计算相关）

| 编码 | 要点 |
|------|------|
| `kp.calc.stoich` | 方程式计算步骤 |
| `kp.calc.excess` | 过量分析方法 |
| `kp.calc.gas` | **Vm≈22.4 仅标况** |
| `kp.calc.solution` | c=n/V；稀释；勿混质量分数 |
| `kp.exp.error` | 定容误差须分阶段 |

公式与单位：各 formula 条目写明 expression / variables / units / applicableConditions / commonMistakes。

---

## 6. 专项关联检查

导入后 `chem_entity_specialties` 与清单 `specialtyCodes` 核对：**42/42 匹配**。  
说明：清单中部分基本操作实验的 `categoryCodes` 较宽（含 gas_prep 等），**按清单关联**，未擅自改清单结构。

---

## 7. 课程范围与待核实

| 编码 | 说明 |
|------|------|
| `exp.ops_burette` | 是否必修核心训练 **待核实**；未按分析化学滴定展开 |
| `kp.extent.le_chatelier_basic` | 仅定性；禁选修平衡计算；**待核实**教材深度 |
| `exp.flame_test` | Na/K/Cu 等颜色表述建议对照所用教材 |
| `exp.ops_distill` / `exp.ops_extract` | 认知级，勿大学实验深度 |

待教材核实（建设期标记）：**至少 2～3 条**（burette、le_chatelier；焰色措辞建议核实）。

---

## 8. 题骨架（8）

`q.calc.*` / `q.exp.*` / `q.eq.balance`：最小可入库 stem/answer，`reviewNote` 标明骨架。  
**不是**完整卷库；未开发自动判题。

---

## 9. 导入与安全

- 方式：`pnpm chem:import`（**不使用管理员密码**）  
- 未修改用户账号/密码  
- 未覆盖已发布知识  
- 未改 Batch2/3/4 既有实体  
- 新增默认 `pending_review` + `[inv:CODE]`  

结果文件：

- `docs/chemistry_batch5/import_all_results.json`
- `docs/chemistry_batch5/verify_post_import.json`
- `docs/chemistry_batch5/import_log_B5-*.txt`

---

## 10. 数据库实际验证

| 检查项 | 结果 |
|--------|------|
| 42 编码均有 entity 映射 | 是 |
| 对应表可查 | 是 |
| status=pending_review | 42 |
| review_note 含 [inv:CODE] | 是 |
| 专项关联匹配 | 42 |
| 遗漏 / 失败 | 0 |
| 基础覆盖检查 | **通过** |

**基础检查通过 ≠ 专项质量审查通过 ≠ 人工审核。**

---

## 11. 42 条逐条覆盖

| # | 编码 | 类型 | 处理 | DB id | 审核状态 |
|---|------|------|------|-------|----------|
| 1 | `exp.instrument_basic` | experiment | 新增导入 | 17 | pending_review |
| 2 | `exp.ops_weigh` | experiment | 新增导入 | 18 | pending_review |
| 3 | `exp.ops_dissolve` | experiment | 新增导入 | 19 | pending_review |
| 4 | `exp.ops_filter` | experiment | 新增导入 | 20 | pending_review |
| 5 | `exp.ops_evaporate` | experiment | 新增导入 | 21 | pending_review |
| 6 | `exp.ops_distill` | experiment | 新增导入 | 22 | pending_review |
| 7 | `exp.ops_extract` | experiment | 新增导入 | 23 | pending_review |
| 8 | `exp.gas_collect_upward` | experiment | 新增导入 | 24 | pending_review |
| 9 | `exp.gas_collect_downward` | experiment | 新增导入 | 25 | pending_review |
| 10 | `exp.gas_collect_water` | experiment | 新增导入 | 26 | pending_review |
| 11 | `exp.O2_prep_KMnO4` | experiment | 新增导入 | 27 | pending_review |
| 12 | `exp.O2_prep_H2O2` | experiment | 新增导入 | 28 | pending_review |
| 13 | `exp.H2_prep_Zn` | experiment | 新增导入 | 29 | pending_review |
| 14 | `exp.CO2_prep_marble` | experiment | 新增导入 | 30 | pending_review |
| 15 | `exp.check_airtight` | experiment | 新增导入 | 31 | pending_review |
| 16 | `exp.safety_rules` | experiment | 新增导入 | 32 | pending_review |
| 17 | `formula.mixed_stoich` | formula | 新增导入 | 13 | pending_review |
| 18 | `formula.excess_reactant` | formula | 新增导入 | 14 | pending_review |
| 19 | `formula.purity` | formula | 新增导入 | 15 | pending_review |
| 20 | `formula.ion_conc` | formula | 新增导入 | 16 | pending_review |
| 21 | `kp.calc.stoich` | knowledge | 新增导入 | 55 | pending_review |
| 22 | `kp.calc.excess` | knowledge | 新增导入 | 56 | pending_review |
| 23 | `kp.calc.gas` | knowledge | 新增导入 | 57 | pending_review |
| 24 | `kp.calc.solution` | knowledge | 新增导入 | 58 | pending_review |
| 25 | `kp.exp.design` | knowledge | 新增导入 | 59 | pending_review |
| 26 | `kp.exp.error` | knowledge | 新增导入 | 60 | pending_review |
| 27 | `q.calc.amount_basic` | question | 新增导入 | 2 | pending_review |
| 28 | `q.calc.concentration` | question | 新增导入 | 3 | pending_review |
| 29 | `q.calc.equation` | question | 新增导入 | 4 | pending_review |
| 30 | `q.calc.excess` | question | 新增导入 | 5 | pending_review |
| 31 | `q.exp.instrument` | question | 新增导入 | 6 | pending_review |
| 32 | `q.exp.gas_collect` | question | 新增导入 | 7 | pending_review |
| 33 | `q.exp.safety` | question | 新增导入 | 8 | pending_review |
| 34 | `q.eq.balance` | question | 新增导入 | 9 | pending_review |
| 35 | `kp.exp.gas_wash_dry` | knowledge | 新增导入 | 61 | pending_review |
| 36 | `exp.ops_volumetric_flask` | experiment | 新增导入 | 33 | pending_review |
| 37 | `exp.ops_burette` | experiment | 新增导入 | 34 | pending_review |
| 38 | `exp.flame_test` | experiment | 新增导入 | 35 | pending_review |
| 39 | `formula.rate_v` | formula | 新增导入 | 17 | pending_review |
| 40 | `kp.rate.factors` | knowledge | 新增导入 | 62 | pending_review |
| 41 | `concept.reversible` | concept | 新增导入 | 26 | pending_review |
| 42 | `kp.extent.le_chatelier_basic` | knowledge | 新增导入 | 63 | pending_review |

---

## 12. 是否可进入专项质量审查

| 问题 | 结论 |
|------|------|
| 建设与导入是否完成 | **是** |
| 基础覆盖是否通过 | **是** |
| 是否发现重大科学错误（建设期） | **否**（未做专项质检） |
| 是否可进入 Batch5 专项质量审查 | **是** |
| 是否可进入 Batch6 | **否（本次停止）** |
| 是否允许正式发布 | **否** |

---

## 13. 停止点

Batch5 建设、安全导入、基础检查与本报告完成。  
**等待指令**再进行 Batch5 专项质量审查；不要自动进入 Batch6 或开发训练功能。
