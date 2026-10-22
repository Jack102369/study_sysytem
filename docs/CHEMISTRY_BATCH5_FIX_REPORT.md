# 高一化学知识库 · Batch5 质量整改报告

> 依据：`docs/CHEMISTRY_BATCH5_QUALITY_REPORT.md`  
> 整改日期：2026-10-18  
> **AI 自动校验 ≠ 人工审核。** 42 条仍为 `pending_review`。  
> **未进入 Batch6；未开发训练功能；未改 Batch2/3/4。**  
> **实验专项定位**：书面题目训练，不要求线下动手。

---

## 1. 整改前统计

| 项 | 数量 |
|----|------|
| 通过 / 需要修改 / 待核实 | 36 / 3 / 3 |
| P0 / P1 / P2 / P3（按条主等级） | 0 / 3 / 8 / 13 |

---

## 2. 执行摘要

| 项 | 结果 |
|----|------|
| 备份 | `docs/chemistry_batch5_quality_fix/backup_before_b5_remediate_apply.json` 等 |
| DB 更新 | **42** 行（pending_review 白名单 + specialty/category 链接） |
| 有意修复编码 | **约 15+**（含 3 重点 + category 收窄 + 焰色/蒸发等） |
| 导入包 | 已重生成 `import_B5-A~E.json` |
| 清单总量 | **377** 未变 |
| 复查通过 / 需改 / 待核实 | **39 / 0 / 3** |
| 剩余问题（仅非通过） | P0=0，P1=1，P2=2 |
| 3 条重点 | **全部已修复** |
| 8 条 question 骨架 | **全部复查通过** |
| 库与导入包 | **一致** |
| 可进入 Batch6 | **是** |
| 允许正式发布 | **否** |

---

## 3. 三条重点修复结果

### `kp.exp.error`（原 P1 · 需要修改）

- **已补**：容量瓶配制分阶段对照——洁净瓶残留蒸馏水通常 **c 不变**；超刻度吸出 → **c 偏小**；俯仰视/未洗涤/未冷却/摇匀后再加水等分别写清。  
- **禁止**：无阶段绝对偏高/偏低自动题。

### `q.calc.excess`（原 P1 · 需要修改）

- **已改写**：单一数据组 Zn 13.0 g + H₂SO₄ 0.15 mol；明确完全反应、无副反应；唯一答案 **0.15 mol**。  
- 可作为模板；仍为骨架非完整卷库。

### `formula.ion_conc`（原 P2 · 需要修改）

- **内容**：强电解质入门、禁 Ka/水解 — 保持。  
- **关联**：`categoryCodes` 改为 `calculation.amount` + `calculation.mixed`，**去掉** `equation_calc`。  
- DB 链接已同步验证。

---

## 4. P1 处理结果

| 编码 | 处理 |
|------|------|
| `kp.exp.error` | **已修复** |
| `q.calc.excess` | **已修复** |
| `kp.extent.le_chatelier_basic` | **保留待核实**（强化禁选修定量/命名默认）；不改为通过 |

---

## 5. P2 / P3 处理摘要

| 处理 | 示例 |
|------|------|
| 已修 | `exp.flame_test` 补物理变化；`exp.ops_evaporate` 石棉网口径；`exp.O2_prep_H2O2` 催化剂写法；`exp.ops_volumetric_flask` 残留水提示；基础操作 **收窄 category**；`kp.rate.factors` specialty→comprehensive |
| 保留待核实 | `exp.ops_burette`、`exp.flame_test`（颜色措辞）、`kp.extent.le_chatelier_basic` |
| 低风险/记录 | distill/extract 认知限制备注；若干 P3 展示项未强改 |

---

## 6. 三条待核实（未标通过）

| 编码 | 状态 |
|------|------|
| `exp.ops_burette` | 待核实是否必修核心；禁定量滴定默认 |
| `exp.flame_test` | 已标物理变化；颜色措辞待对教材 |
| `kp.extent.le_chatelier_basic` | 教材深度/命名待核实；禁选修平衡计算默认 |

---

## 7. 八条 question 骨架复查

| 编码 | 结果 |
|------|------|
| `q.calc.amount_basic` | 通过（标况模板） |
| `q.calc.concentration` | 通过 |
| `q.calc.equation` | 通过 |
| `q.calc.excess` | **已修复**，条件唯一 |
| `q.exp.instrument` | 通过 |
| `q.exp.gas_collect` | 通过 |
| `q.exp.safety` | 通过 |
| `q.eq.balance` | 通过 |

---

## 8. 专项关联复查

- `formula.ion_conc`：无 equation_calc。  
- 基础操作实验：已去掉误挂的 gas_prep/gas_collect。  
- 制气/集气类：保留合理 gas 类别。  
- 无实验误挂 redox。  
- linkUnresolved=0。

---

## 9. 备份与回滚

| 文件 | 用途 |
|------|------|
| `backup_before_b5_remediate_apply.json` | DB 行 + 原链接 |
| `backup_pre_import_B5-*.json` / `backup_pre_batch5_content.js` | 导入包与内容源 |
| `backup_inventory_specialty_before.json` | 专项快照 |
| `b5_remediate.js` | 应用脚本 |

---

## 10. 整改后复查统计（AI，≠人审）

| 结论 | 数量 |
|------|------|
| 通过 | **39** |
| 需要修改 | **0** |
| 待教材核实 | **3** |
| **合计** | **42** |

| 剩余问题主等级（仅待核实/需改） | 数量 |
|------|------|
| P0 | **0** |
| P1 | **1**（le_chatelier 口径） |
| P2 | **2**（burette、flame_test） |
| P3 | **0** |

未解决严重化学错误：**否**  
可进入 Batch6：**是**  
允许正式发布：**否**

复查：`docs/chemistry_batch5_quality_fix/b5_recheck_result.json`

---

## 11. 停止点

Batch5 质量整改完成并停止。等待指令再进入 Batch6 或教材定点核实。
