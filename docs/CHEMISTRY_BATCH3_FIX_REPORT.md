# 高一化学知识库 · Batch3 质量整改报告

> 依据：`docs/CHEMISTRY_BATCH3_QUALITY_REPORT.md`  
> 整改日期：2026-10-18  
> **AI 自动校验 ≠ 人工审核。** 84 条新导入仍为 `pending_review`；本报告不宣称已经人工审核。

---

## 1. 执行摘要

| 项 | 结果 |
|----|------|
| 备份 | `docs/chemistry_batch3_quality_fix/backup_before_b3_remediate_apply.json` |
| DB 更新行数 | **88**（84 导入包同步 + 4 条复用 seeded：`kp.Na.property` / `sub.Na` / `sub.NaOH` / `sub.H2O`） |
| 同步导入包 | 已重生成 `import_B3-A/B/C/D.json`（自 `batch3_content.js`） |
| P0 剩余 | **0** |
| 需要修改（复查） | **0** |
| 需要人工核实 | **12** |
| 自动检查通过（复查估计） | **79** |
| 阻止正式发布 | **是**（待核实 + pending_review + 非人审） |
| Batch4 | **未开始** |

---

## 2. 已修复问题（按等级）

### 2.1 P0（1）— 已修

#### `concept.alloy`

| | 内容 |
|--|------|
| **修改前** | principle：许多合金的硬度、熔点、抗腐蚀性等性能往往优于成分金属 |
| **修改后** | 合金性能与组成结构有关；许多常见合金硬度更大、熔点往往较低；抗腐蚀性可能改善但须看具体种类；禁止“所有合金…”绝对化 |
| **原因** | 熔点“优于”易误导为熔点更高，与教材通论冲突 |
| **状态** | 已写入 DB + 导入包；**尚未人工审核** |

### 2.2 重点反应（P1）— 已修

#### `rxn.4Al_3O2`

| | 内容 |
|--|------|
| **修改前** | conditions/phenomenon 混写点燃与常温成膜 |
| **修改后** | 明确本条方程式=点燃/高温；常温氧化膜分述；现象分条件 |
| **原因** | 避免把特殊条件写成唯一规律 |

#### `rxn.FeOH2_O2`

| | 内容 |
|--|------|
| **修改前** | ox/re 产物均为 Fe(OH)3 无说明；trainTypes 含 `redox.identify` |
| **修改后** | 明确氧化剂 O2、还原剂 Fe(OH)2；氧化产物 Fe(OH)3；还原产物为 O 进入后的 Fe(OH)3（≠反应物 H2O）；去掉默认 `redox.identify` |
| **原因** | 消除还原产物训练歧义；限制自动命题题型 |

#### `rxn.2Na_2HCl`

| | 内容 |
|--|------|
| **修改前** | 安全强调不足，可被当成学生实验 |
| **修改后** | 了解/纸笔对比；禁止学生自行实验；trainTypes 去掉危险实验向；reviewNote 排除默认实验操作训练 |
| **原因** | 化学正确但训练不安全 |

### 2.3 知识点 — 已修

#### `kp.Na.property`（**published 复用，已按任务授权修改**）

| | 内容 |
|--|------|
| **修改前** | “钠与氧气、水、酸等反应规律”（过短） |
| **修改后** | 分条件：与 O2（常温/燃烧）、与水、与酸（了解对比禁学生实验）、与盐溶液；保存要点与易错 |
| **原因** | P1 训练支撑不足 |

#### `kp.Fe.fe2_fe3`（原 P2）

| | 内容 |
|--|------|
| **修改前** | Cl2/O2/酸性KMnO4/H2O2 并列 |
| **修改后** | 必修核心示例 vs 了解/题设试剂分开；标明不进默认基础训练 |
| **原因** | 范围控制 |

### 2.4 其余 P1 处理策略

| 编码 | 处理 |
|------|------|
| `rxn.NaOH_CO2` | 已写清 2:1→碳酸盐、过量 CO2→碳酸氢盐分支；**教材“过量”措辞仍待核实** |
| `rxn.2Al_2NaOH` / `Al2O3_2NaOH` / `AlOH3_NaOH` | 默认保留 NaAlO2/AlO2- 简化式，注明 [Al(OH)4]- 了解；**命题须指定写法；待教材核实** |
| `sub.NaAlO2` / `Al2O3` / `AlOH3` | 同上双口径说明；**待核实** |
| `sub.FeO` | 保留待核实氧化细节；限制绝对细节题 |
| `kp.metal.pig_iron` / `steel` | 改为“以课本为准”；**排除默认百分数题**；数值待核实 |

### 2.5 P2 — 已处理（不删除知识）

| 编码 | 处理 |
|------|------|
| `kp.Fe.fe2_fe3` | 见上 |
| `kp.metal.stainless` | 正文标明了解级 + `excludeDefaultTraining` |

### 2.6 P3 — 已做可确定修正

- `exp.Na2O2_H2O`：现象分步（加水 / 通 CO2）
- `exp.Al_amphoteric`：区分单质反应 vs 氧化物/氢氧化物两性
- `exp.Fe_rust`：`isHazardous=false`（内容源已为 false，DB 同步）
- `kp.metal.activity`：补教材常见活动性顺序（以课本为准）
- `sub.FeCl3` / `kp.Fe.fe3_property` / `sub.FeSO4`：了解级试剂排除默认训练说明
- `rxn.4Na_O2` / `2Na_O2_heat`：化合反应 ox/re 产物同物质训练提示
- `sub.Na` / `NaOH` / `H2O`：轻量补全（复用条）

不确定处未强行“清零”。

---

## 3. 修改前后对照（关键字段摘录）

| 编码 | 字段 | 修改前 | 修改后 |
|------|------|--------|--------|
| concept.alloy | principle | …硬度、熔点、抗腐蚀性等性能往往优于… | …硬度更大，熔点往往较低…禁绝对化 |
| rxn.FeOH2_O2 | re_product | Fe(OH)3 | Fe(OH)3（O被还原后进入；≠反应物H2O） |
| rxn.FeOH2_O2 | train_types | …,redox.identify | equation…,phenomenon.observe |
| rxn.4Al_3O2 | conditions/phenomenon | 混写 | 分条件 |
| kp.Na.property | description | 一句概述 | 分条件完整说明 |
| kp.Fe.fe2_fe3 | description | 试剂混列 | 核心/了解分离 |

完整备份：`docs/chemistry_batch3_quality_fix/backup_before_b3_remediate_apply.json`  
应用后抽样：`docs/chemistry_batch3_quality_fix/after_b3_remediate.json`

---

## 4. 尚未解决 / 待人工核实（12）

| 编码 | 待核实点 |
|------|----------|
| sub.NaAlO2 | 溶液存在形式 vs NaAlO2 固体写法 |
| sub.Al2O3 / sub.AlOH3 | 与碱产物写法 |
| rxn.2Al_2NaOH / Al2O3_2NaOH / AlOH3_NaOH | AlO2- 与 [Al(OH)4]- |
| rxn.NaOH_CO2 | 教材“过量”措辞 |
| sub.FeO | 空气中氧化细节 |
| kp.metal.pig_iron / steel | 含碳量教材表 |
| kp.Al.salt_aluminate | 离子写法统一 |
| exp.Fe3_SCN | Fe(SCN)3 等写法以课本为准 |

**未自行宣布已通过人工审核。**

---

## 5. 训练范围调整（排除默认基础训练）

| 编码 | 限制 |
|------|------|
| concept.alloy | 禁止绝对化熔点/硬度判断题（内容已修正，仍慎出无条件绝对题） |
| kp.metal.stainless | 了解级，不进默认核心池 |
| kp.metal.pig_iron / steel | 不考未核实百分数 |
| rxn.2Na_2HCl | 排除学生实验操作类 |
| kp.Fe.fe2_fe3 | 未标记深剂（KMnO4/H2O2 等）勿默认命题 |
| rxn.FeOH2_O2 | 排除无说明的 redox.identify 自动题 |
| sub.FeCl3 等 I-/S2- 深度 | 了解/选修，勿默认 |

清单已写入 `chemistry_kb_inventory.json` → `summary.batch3QualityFix` 与条目 `excludeDefaultTraining`。

---

## 6. 质量复查结果（AI 自动，≠人审）

抽样复查 6/6 通过（alloy / 4Al_O2 / FeOH2_O2 / 2Na_2HCl / kp.Na.property / kp.Fe.fe2_fe3）。

| 结论 | 数量 |
|------|------|
| 自动检查通过 | **79** |
| 需要修改 | **0** |
| 需要人工核实 | **12** |
| 疑似超纲 | **0** |
| P0 | **0** |
| P1（仍开放，主要为待核实口径） | **约 8** |
| P2 | **0**（已用范围标记消化） |
| P3 | 已处理可确定项；未追求零 P3 |

详见 `docs/chemistry_batch3_quality_fix/after_b3_recheck.json`。

---

## 7. 已发布知识变更说明

| 编码 | 原状态 | 变更 | 说明 |
|------|--------|------|------|
| kp.Na.property | published | description 扩展 | 任务明确要求修正；非发布为“已人审” |
| sub.Na / NaOH / H2O | published | 轻量字段 | 补条件表述与 safety |

未覆盖无关批次；未改用户账号；未改库结构；未进 Batch4。

---

## 8. 运维文件

| 文件 | 作用 |
|------|------|
| `docs/chemistry_batch3/batch3_content.js` | 内容源（已改） |
| `docs/chemistry_batch3/import_B3-*.json` | 重生成，防重复导入旧错 |
| `docs/chemistry_batch3_quality_fix/b3_remediate.js` | DB 应用脚本 |
| `docs/chemistry_kb_inventory.json` | `batch3QualityFix` + verify 标记 |
| `docs/CHEMISTRY_AI_CONTEXT.md` | 进度记录 |

---

## 9. 停止点

Batch3 质量整改完成并停止。等待你确认教材口径后，可再做定点核实修订；**不要**将本报告视为人工审核通过或正式发布许可。
