# 验收测试批次清单（PHASE_D）

| 字段 | 值 |
|------|-----|
| batchId | `industrial_acceptance_20261029_121220` |
| 创建时间 | 2026-10-29 12:12:20 +08:00（约） |
| 候选数量 | **4** |
| 审核仓 | `apps/api/var/industrial-review/` |
| 批次目录 | `docs/chemistry_industrial_experiment/acceptance_batches/industrial_acceptance_20261029_121220/` |
| 正式池 | **未写入** |
| 测试池 | **未写入** |

## 候选一览

| seq | candidateId | plannedItemCode | 题型 | 难度 | 分类 | 图形 | 质检 overall | 人审 | DB item | KB |
|-----|-------------|-----------------|------|------|------|------|--------------|------|---------|-----|
| 01 | cand_e3487ce3d2684c3c | iaacc_20261029_121220_01 | single | 1 | flow_diagram_read | flow | incomplete_verification | pending_human_review | NOT_CREATED | NOT_BOUND |
| 02 | cand_8a7f989a35804380 | iaacc_20261029_121220_02 | single | 1 | industrial_apparatus_analysis | apparatus+flow(stub) | failed_automatic_checks | pending_human_review | NOT_CREATED | NOT_BOUND |
| 03 | cand_c196d1d8e32b41d3 | iaacc_20261029_121220_03 | single | 2 | industrial_separation_purification | **flow+apparatus** | failed_automatic_checks | pending_human_review | NOT_CREATED | NOT_BOUND |
| 04 | cand_c4142906635b4628 | iaacc_20261029_121220_04 | blank | 3 | industrial_production_cases | flow | incomplete_verification | pending_human_review | NOT_CREATED | NOT_BOUND |

## SVG contentHash

| seq | flow | apparatus |
|-----|------|-----------|
| 01 | `f2729bf85748da9244ac145d0bc81687e00fd379b6f470cf2aafaed0bb25c292` | — |
| 02 | `21d7bfe65f95fe5c4b28ba4155293ca586e4e1feeb79d8bfb3f5d028df22615a` | `d1e70920d636abe62dc3fedb0cbbed8005d567a2cf716ef280854bcf4a5fd5cf` |
| 03 | `f2729bf85748da9244ac145d0bc81687e00fd379b6f470cf2aafaed0bb25c292` | `255a5b54473c7d80d0c1cfb2e7629b48f253c22cb7143cd999ac9392efbaf39c` |
| 04 | `a06bc63331a94b1d0e8b3b6a4f8d328b8d502564cf9d038ced710c002bf92e62` | — |

物理文件：`apps/api/uploads/industrial-svg/<hash>.svg`（不可变）；批次目录有 SVG 副本。

## 闸门标记（全部）

- `generationSource=mock_generated`
- `developmentOnly=true`
- `formalImportBlocked=true`
- `humanDecision=null`（**无自动批准**）
- `importedItemCode=null`
- 案例 `reviewStatus=draft`（**未伪造 published**）

## KB_BINDING_PLAN（仅计划）

详见 `summary.json`。示例：experiment#20 过滤操作、#19 溶解与搅拌；knowledge#61 气体洗涤干燥；concept#2 物质的分类（需人审确认）。  
**当前全部 `NOT_BOUND`** — 正式 `chem_train_item_links` 留 PHASE_E（入库后经 admin kb-bind）。

## 数据库写入

| 表 | 本批次 |
|----|--------|
| chem_train_items | NOT_CREATED |
| chem_train_item_assets | NOT_CREATED（0 行仍） |
| chem_train_item_links | NOT_BOUND |
| chem_train_sessions / wrong_* | NOT_CREATED |

## 清理策略（PHASE_G）

1. 按 batchId / plannedItemCode 前缀 `iaacc_20261029_121220_` 定位  
2. 删除审核仓 JSON：`cand_*` 本批次  
3. 可选：未引用 SVG 哈希 GC（勿误删他用）  
4. **勿**删 D043/D045 表本身  
