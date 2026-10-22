# 高一化学知识库 · Batch3 建设报告

> 第三阶段：金属化学数据（清单最新 **91** 条，非旧版 71 条）  
> 建设日期：2026-10-18  
> 依据：`chemistry_kb_inventory.json`、`CHEMISTRY_QUALITY_STANDARD.md`  
> **AI 自动检查 ≠ 人工审核。** 新内容均为 `pending_review`。

---

## 1. 建设情况总览

| 指标 | 数量 |
|------|------|
| 计划数量 | **91** |
| 已有复用（seeded → seeded_audited） | **7** |
| 新建并导入成功 | **84** |
| 导入失败 | **0** |
| 重复跳过（本批新建包内） | **0** |
| 缺失编码 | **0** |
| 待审核（新导入 pending_review） | **84** |
| 关联专项写入成功 | **84**（linkFail=0） |

按类型（全批 91）：

| 类型 | 条数 | 其中新建导入 |
|------|------|--------------|
| substance | 33 | 29 |
| reaction | 33 | 32 |
| experiment | 8 | 7 |
| knowledge | 16 | 15 |
| concept | 1 | 1 |

导入包：

| 包 | 内容 | 数量 |
|----|------|------|
| B3-A | substance | 29 |
| B3-B | reaction | 32 |
| B3-C | experiment | 7 |
| B3-D | knowledge + concept | 16 |

---

## 2. 已有知识复用

未覆盖 published：

| 编码 | 类型 | 说明 |
|------|------|------|
| sub.Na / sub.NaOH / sub.H2 / sub.H2O | substance | 阶段二示例 |
| rxn.2Na_2H2O | reaction | 钠与水；P0 已修正 ox/re 产物 |
| exp.Na_H2O | experiment | 钠与水实验 |
| kp.Na.property | knowledge | 钠的化学性质 |

见 `docs/chemistry_batch3/seeded_audit.json`。

---

## 3. 导入与安全

- 方式：`pnpm chem:import`（进程内，**不使用管理员密码**）  
- 审计：只读 ADMIN id 写入 createdBy  
- 未修改用户账号/密码  
- 未覆盖已发布知识  
- 小修复：`createSubstance` / `createReaction` / `createExperiment` 写入 `reviewNote`（便于 `[inv:CODE]` 对账，非新功能模块）

结果文件：

- `docs/chemistry_batch3/import_B3-*.json`
- `docs/chemistry_batch3/import_all_results.json`
- `docs/chemistry_batch3/reconcile.json`

---

## 4. 化学正确性检查（自动）

已做检查（生成器/内容层）：

- 清单 84 待建编码均有内容映射  
- 物质必填 name + canonicalFormula  
- 反应必填 canonicalEquation + equation；与 inventory note 中 canonical 对齐  
- 非氧化还原反应 oxidant/reductant/oxProduct/reProduct/electronTransfer 置空  
- 氧化还原反应填写氧化剂/还原剂/产物（注意歧化反应如 Na₂O₂ 自身既是氧化剂又是还原剂）  
- 条件区分：钠常温→Na₂O，点燃→Na₂O₂；Fe 与稀硫酸；铁燃烧→Fe₃O₄ 等  

**未宣称人工审核通过。**

---

## 5. 课程范围检查

- 内容定位：人教版必修第一册金属相关（钠/铁/铝/金属材料及常见金属活动性实验）  
- 不锈钢、合金：了解级表述  
- Al 与碱产物写作 NaAlO₂ / AlO₂⁻，并标注可能与 `[Al(OH)₄]⁻` 教材口径差异 → **待核实**  
- 未引入选择性必修深度（如复杂配位、大学结构）  

---

## 6. 知识关联

- 导入后按清单 `specialtyCodes` / `categoryCodes` 写入 `chem_entity_specialties` / `chem_entity_categories`  
- linkOk=84，linkFail=0  
- 典型关联意图：钠与水类→方程式/氧化还原/物质/实验；Fe²⁺/Fe³⁺→氧化还原/离子/物质/推断  

---

## 7. 待核实内容

| 编码/主题 | 疑问 |
|-----------|------|
| rxn.2Al_2NaOH 等 | 离子式 AlO₂⁻ 与 [Al(OH)₄]⁻ |
| rxn.Al2O3_2NaOH / AlOH3_NaOH | 产物写法口径 |
| rxn.NaOH_CO2 | “过量”表述 |
| rxn.FeOH2_O2 | 总式 4Fe(OH)₂+O₂+2H₂O=4Fe(OH)₃ |
| rxn.2Na_2HCl | 课堂演示安全性强调 |
| sub.NaAlO2 | 溶液中实际存在形式 |
| sub.FeO / FeOH2 细节 | 部分性质表述 |

---

## 8. 最终对账（91 编码）

| 统计项 | 结果 |
|--------|------|
| 计划 | 91 |
| 已有复用 | 7 |
| 新增导入成功 | 84 |
| 失败 | 0 |
| 重复（新建失败因已存在） | 0 |
| 待审核（新） | 84 |
| 缺失 | **0** |
| 全部编码有明确状态 | **是**（seeded_audited / imported） |

清单已更新：`docs/chemistry_kb_inventory.json` → `summary.batch3Build`。

---

## 9. 内容分类摘要

- **钠系**：氧化物/过氧化物、碳酸盐转化、与酸等（复用钠与水）  
- **铁系**：FeO/Fe(OH)₂/FeSO₄、Fe²⁺/Fe³⁺性质·转化·检验、生锈实验  
- **铝系**：两性氧化物/氢氧化物、铝盐与偏铝酸盐  
- **其他金属**：Mg/Cu/Zn/Ag 及典型置换、氢气还原 CuO  
- **金属材料**：合金概念、生铁/钢/不锈钢  
- **实验**：燃烧、过氧化钠、两性、活动性、SCN 检验等  

---

## 10. 存在问题 / 下一步

1. 84 条需人工审核后方可 `published`  
2. 待核实项对照所用教材统一口径  
3. 勿将 AI 检查当作人工审核  
4. **本任务停止**；不自动进入 Batch4  

---

## 11. 运维

```bash
cd apps/api
pnpm chem:import -- ../../docs/chemistry_batch3/import_B3-A.json
```

禁止设置 `CHEM_ADMIN_PASSWORD` 等密码环境变量导入。
