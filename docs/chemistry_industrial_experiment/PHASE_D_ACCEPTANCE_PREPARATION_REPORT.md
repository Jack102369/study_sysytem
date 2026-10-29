# PHASE_D · 受控测试候选准备报告

| 字段 | 值 |
|------|-----|
| 执行日期 | 2026-10-29 |
| 阶段状态 | **COMPLETED** |
| 数据库 | `study_system` / MySQL **8.0.44** |
| batchId | `industrial_acceptance_20261029_121220` |
| 系统验收 | **CONDITIONALLY_ACCEPTED**（未升格） |

---

## 1. 备份复核

| 项 | 结果 |
|----|------|
| 文件 | `...\study_system_pre_industrial_migration_20261029_113813.sql` |
| 大小 / SHA-256 | 与 PHASE_B 记录一致（写入前已复核） |

## 2. D043 / D045

两表 **present**（PHASE_C）；本阶段 **未**再迁移；资产行数仍为 **0**（未写 item_assets）。

## 3. 候选概况

| 项 | 值 |
|----|-----|
| 数量 | **4** |
| 题型 | single×3，blank×1 |
| 难度 | 1、1、2、3（覆盖） |
| 分类 | flow_diagram_read / industrial_apparatus_analysis / industrial_separation_purification / industrial_production_cases |
| 流程 SVG | **4**（含 1 个装置题流程占位） |
| 装置 SVG | **2** |
| 真双图（流程定义+装置） | **≥1**（seq03；seq02 为装置+流程占位） |

## 4. 质检

| seq | overall | blocking | unknown | requiresHumanReview | formalPublishEligible |
|-----|---------|----------|---------|---------------------|------------------------|
| 01 | incomplete_verification | 0 | 14 | true | false |
| 02 | failed_automatic_checks | 2 | 17 | true | false |
| 03 | failed_automatic_checks | 1 | 15 | true | false |
| 04 | incomplete_verification | 0 | 16 | true | false |

说明：案例仍为 draft/unverified → 正式发布资格 **false**（预期）。unknown **未**改写成 pass。

## 5. 科学来源 / 案例

复用现有 fixture 案例（粗盐提纯、海水资源等）；`reviewStatus=draft`；**未**伪造 published / reviewedContentHash。题干标注 `acceptance_test_only`。

## 6. 审核状态

全部 `pending_human_review`；`humanDecision=null`；mock + development_only + formalImportBlocked。**无自动批准 / 无正式发布。**

## 7. KB

- 库内存在 published experiment/substance/knowledge/concept 等（可用）。  
- 本阶段输出 **KB_BINDING_PLAN**（见 summary / MANIFEST）。  
- **无** `chem_train_item_links` 写入 → `NOT_BOUND`。  
- 不伪造绑定成功。

## 8. 数据库实际写入

| 操作 | 结果 |
|------|------|
| chem_train_items（iaacc_%） | COUNT=**0** |
| chem_train_item_assets | COUNT=**0** |
| sessions / wrong（本时段） | **0** |
| 不可变 SVG 文件 | 写入 `apps/api/uploads/industrial-svg/`（内容寻址） |
| 审核仓 JSON | `apps/api/var/industrial-review/cand_*.json` |

## 9. 文件写入

- `acceptance_batches/industrial_acceptance_20261029_121220/`（summary、meta、svg 副本）  
- 准备脚本：`industrial-phase-d-prepare.ts`  
- 自检：`industrial-phase-d.selftest.ts`  

## 10. 测试 / 构建

| 项 | 结果 |
|----|------|
| chem:industrial-phase-d-selftest | **PASS** |
| apparatus / svg / quality / review / item-asset / step12 | **PASS** |
| api build / web build | **PASS** |
| 正式入库 IT / 抽题 / E2E | **NOT_EXECUTED** |

## 11. 清理范围

见 MANIFEST：按 batch / plannedCode 前缀追踪；PHASE_G 再精确清理。

## 12. 未验证事项

管理员真实人审；案例升格；formal import；KB link 实绑；学生训练闭环；真实 restore。

## 13. PHASE_E 前置条件

| 条件 | 状态 |
|------|------|
| D043/D045 表 | 满足 |
| 可追踪候选批次 | 满足 |
| 双图/装置/流程 SVG | 满足（文件级） |
| 人审闸门保持 | 满足 |
| 案例可信 / 人审通过 | **未满足**（仍 draft；需真实审核） |
| formal 题 + KB links | **未满足** |
| **可否直接宣称 PHASE_E 业务验收就绪** | **否** — 仅具备「候选准备」前置；进入 PHASE_E 仍需用户批准并完成人审/入库流程 |

## 14. 结论

PHASE_D **COMPLETED**（文件级受控候选准备完成；无 formal/test 写库；KB 仅计划）。
