# 高一化学知识库 · Batch6 质量整改报告

> 依据：`docs/CHEMISTRY_BATCH6_QUALITY_REPORT.md`  
> 整改日期：2026-10-18  
> **AI 自动校验 ≠ 人工审核。** 新建 78 条仍为 `pending_review`。  
> **未进入 377 条全库核验；未开发训练引擎；未自动发布；未改 Batch2–5 正确内容。**  
> **实验专项定位**：书面题目训练，不要求线下动手。

---

## 1. 整改前质量统计

| 项 | 数量 |
|----|------|
| 通过 / 需要修改 / 待核实 | **59 / 15 / 5** |
| P0 / P1 / P2 / P3（按条主等级，含通过条提示等级） | **2 / 6 / 25 / 23** |

---

## 2. 执行摘要

| 项 | 结果 |
|----|------|
| 备份 | `docs/chemistry_batch6_quality_fix/backup_before_b6_remediate.json` + `backup_import_packs/` + `backup_inventory_before.json` |
| DB 更新 | **78** 行（仅 `pending_review` 白名单；**不含** published `q.eq.Na_water`） |
| linkUnresolved | **0** |
| 导入包 | 已重生成 `import_B6-A~F.json` |
| 内容源 | 已更新 `batch6_content.js` |
| 清单总量 | **377** 未变 |
| 复查通过 / 需改 / 待核实 | **74 / 0 / 5** |
| P0 剩余（需改口径） | **0** |
| 10 条 reaction | **全部复查** |
| 10 条 question | **全部复查** |
| `q.eq.Na_water` | **published 未改 DB 正文**；inventory 记训练限制 |
| 库 / 导入包 / content P0 字段 | **一致** |
| 其他批次样本 | Batch4 `sub.Cl2`、Batch5 `exp.instrument_basic` **仍在** |
| 可进入 377 条全库核验 | **是**（待指令） |
| 允许正式发布 | **否** |

---

## 3. 两条 P0 具体修复结果

### `rxn.C2H5OH_O2`（乙醇催化氧化）

| 字段 | 整改后 |
|------|--------|
| 方程式 | `2CH3CH2OH+O2=2CH3CHO+2H2O`（配平保持） |
| 条件 | Cu 或 Ag 催化并加热 |
| 氧化剂 / 还原剂 | O₂ / CH₃CH₂OH |
| **氧化产物** | **CH₃CHO**（—CH₂OH 中与羟基相连的碳被氧化为 —CHO） |
| **还原产物** | **H₂O**（O₂ 被还原） |
| 电子转移说明 | 已按结构连接关系重写，非机械互换 |

DB / 导入包 / content 三者均为 `ox=CH3CHO, re=H2O`。

### `rxn.C2H5OH_burn`（乙醇完全燃烧）

| 字段 | 整改后 |
|------|--------|
| 方程式 | `C2H5OH+3O2=2CO2+3H2O`（配平保持） |
| 条件 | **点燃 + 完全燃烧（氧气充足）**；不完全燃烧不在本条默认范围 |
| 氧化剂 / 还原剂 | O₂ / C₂H₅OH |
| **氧化产物** | **CO₂**（本条针对典型完全燃烧的字段口径） |
| **还原产物** | **H₂O** |
| 说明限制 | 明确 **勿机械推广** 到其他有机氧化还原（如催化氧化→乙醛）；价态分析须结合结构/题设，不能仅对分子式机械均分 |

DB / 导入包 / content 三者均为 `ox=CO2, re=H2O`。

---

## 4. 10 条 reaction 复查结果

| 编码 | 复查结论 | 主要处理 |
|------|----------|----------|
| `rxn.CH4_Cl2` | 通过 | category 收窄为 substitution + equation |
| `rxn.C2H4_Br2` | 通过 | category → addition |
| `rxn.C2H4_H2O` | 通过 | category → addition + condition |
| `rxn.C2H4_H2` | 通过 | category → addition + condition |
| `rxn.C2H5OH_O2` | 通过 | **P0 已修** + redox/organic.oxidation 关联 |
| `rxn.C2H5OH_burn` | 通过 | **P0 已修** + redox/organic.oxidation 关联 |
| `rxn.esterification` | 通过 | 仅 esterification + equation |
| `rxn.CH3COOH_NaOH` | 通过 | acetic + ionic_write |
| `rxn.CH3COOH_Na2CO3` | 通过 | 离子式 `CO3^2-`；关联收窄 |
| `rxn.C2H4_KMnO4` | 通过 | re_product 改为「Mn 的还原产物(条件依赖)」；禁唯一产物填空 |

原「取代+加成+酯化」机械三挂：**已消除**（DB 实测）。

---

## 5. 6 条 P1 处理结果

| 编码 | 处理 |
|------|------|
| `concept.heat_of_reaction` | **保留待核实** + 默认定量训练限制 |
| `kp.organic.cracking` | **保留待核实** + excludeDefaultTraining |
| `kp.organic.pyrolysis` | **保留待核实** + excludeDefaultTraining |
| `kp.sustain.atom_economy` | **保留待核实**；去掉 `calculation` / `calculation.mixed` 关联 |
| `kp.organic.biomolecule` | **保留待核实** + excludeDefaultTraining |
| `q.eq.Na_water` | 见第 7 节（published 安全处理；复查记为通过+P2 训练限制提示） |

**未**为清零 P1 而强行将 5 条 verifyNeeded 标为通过。

---

## 6. P2 / P3 处理结果

### 已修复（明确错误关联）

- 10 条 reaction category 机械三挂 → 按反应类型重绑（DB 已核）。  
- 4 条 concept（`functional_group` / `substitution` / `addition` / `esterification_rule`）误挂 homolog/isomer → 已改。  
- `kp.energy.galvanic`：去掉 **experiment** 主挂靠 → `redox` + `comprehensive`。  
- `kp.energy.chem_electric`：无效 `redox.e_transfer` → `redox.e_direction`。  
- `rxn.C2H4_KMnO4` ox/re 命名；`CH3COOH+Na2CO3` 离子式规范。  
- `sub.C2H2` / `sub.C6H6`：inventory 强化了解级/默认训练限制说明。

### 保留说明

- 部分通过条仍可带了解级/骨架限自动出题备注（复查主等级：P2=1 为 `q.eq.Na_water` 训练限制提示；5 条待核实记 P1）。  
- 未为减少 P3 数量引入新科学错误。

---

## 7. `q.eq.Na_water` 处理结果（已发布知识保护）

| 项 | 结论 |
|----|------|
| DB id | 1 |
| status | **published（未改）** |
| 题干 / 答案 | **未覆盖**（仍为「生成物是？」「NaOH 和 H2」） |
| review_note / [inv:] | **未写入**（无法确认对其他批次/训练的副作用时不改 published 字段） |
| inventory | 已追加说明：不宜作方程式自动判题标准；训练限制 |
| 安全结论 | **记录整改建议 + 训练限制；本次不修改该记录** |
| 与导入包差异 | **单独列明**：published 复用题不在 B6-F 导入包内；content 源亦不含该题 |

建议后续（非本次）：新建 pending 方程式骨架题替换训练，或经人工确认后升级本题采分点。

---

## 8. 5 条待核实知识状态

| 编码 | verifyNeeded | 默认训练 |
|------|--------------|----------|
| `concept.heat_of_reaction` | 是 | 限制定量 |
| `kp.organic.cracking` | 是 | 限制 |
| `kp.organic.pyrolysis` | 是 | 限制 |
| `kp.sustain.atom_economy` | 是 | 限制；已去计算关联 |
| `kp.organic.biomolecule` | 是 | 限制 |

**未**标人工审核通过。

---

## 9. 原电池复查结果

- 电子外电路、电流相反、离子迁移、CuSO₄ vs 稀 H₂SO₄ 正极差异：内容保持正确。  
- `kp.energy.galvanic` 关联过宽：**已收窄**（DB：`comprehensive,redox` / `comprehensive.basic,redox.e_direction`）。  
- `exp.galvanic_Zn_Cu`：书面定位保持。

---

## 10. 10 条 question 骨架复查

| 编码 | 复查 |
|------|------|
| 9 条新建 | 通过；`pending_review` + `[inv:]` 在库 |
| `q.eq.Na_water` | 见第 7 节；通过（训练限制 P2 提示） |

骨架仍非正式卷库；推断/异构/综合骨架需限定条件后方可自动判题。

---

## 11. 专项关联修复结果

| 范围 | DB 核验 |
|------|---------|
| 10 reaction | 关联已按 inventory 同步；无未解析 code |
| 4 concept | 已同步 |
| galvanic / atom_economy / chem_electric | 已同步 |
| 机械三挂 | 已清除 |

---

## 12. 数据库修改数量与同步

| 项 | 数量/状态 |
|----|-----------|
| UPDATE 实体行 | **78** |
| 跳过 published | **1**（`q.eq.Na_water`） |
| 导入包同步 | **是**（generate 后 apply） |
| content 同步 | **是** |
| inventory | 仅 Batch6 说明/关联；编码 **377** |

恢复：用 `backup_before_b6_remediate.json` 中 `before` 行回写（脚本未内置自动 restore，可按表/id 恢复）。

---

## 13. 整改后 79 条质量统计

| 结论（互斥） | 数量 |
|--------------|------|
| 通过 | **74** |
| 需要修改 | **0** |
| 待核实 | **5** |
| **合计** | **79** |

| 主等级（含提示） | 条数 |
|------------------|------|
| P0 | **0** |
| P1 | **5**（均为待核实） |
| P2 | **1**（`q.eq.Na_water` 训练限制提示） |
| P3 | **0** |
| 无等级 | 73 |

详见 `docs/chemistry_batch6_quality_fix/b6_recheck_result.json`。

---

## 14. 验收对照

| 验收项 | 结果 |
|--------|------|
| 79 条全部重新检查 | **是** |
| 2 条 P0 全部修复 | **是** |
| 10 条 reaction 全部复查 | **是** |
| 10 条 question 全部复查 | **是** |
| 明确错误专项关联全部修复 | **是** |
| `q.eq.Na_water` 安全处理结论明确 | **是**（不改 published） |
| 5 条争议保留限制 | **是** |
| DB / 导入包 / inventory 一致（复用 published 单独列明） | **是** |
| 未改其他批次正确知识 | **是** |
| 未自动发布 | **是** |

---

## 15. 结论

| 问题 | 答案 |
|------|------|
| 是否存在未解决 P0 | **否** |
| 是否存在未解决明确科学错误（需改口径） | **否** |
| 是否可以进入 377 条全库核验 | **是**（待指令） |
| 是否允许正式发布 | **否**（pending_review + 待核实 + 非人审 + 复用题限制） |

---

## 16. 产物路径

| 路径 | 说明 |
|------|------|
| `docs/chemistry_batch6_quality_fix/` | 备份 / remediate / recheck |
| `docs/CHEMISTRY_BATCH6_FIX_REPORT.md` | 本报告 |
| `docs/chemistry_batch6/batch6_content.js` | 内容源 |
| `docs/chemistry_batch6/import_B6-*.json` | 导入包 |

*整改完成。停止。等待下一步指令。*
