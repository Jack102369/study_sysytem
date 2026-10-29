# PHASE_E1 · 正式候选准备报告

| 字段 | 值 |
|------|-----|
| 执行日期 | 2026-10-29 |
| 阶段状态 | **COMPLETED**（候选准备）；后续 **PHASE_E2-A** 已修订内容（见 PHASE_E2A_*） |
| 数据库 | `study_system` / MySQL **8.0.44** |
| E1 batchId | `industrial_formal_candidate_20261029_121958` |
| 生成来源 | **manual_fixture**（人工编写 + 程序渲染；**未**冒充 HTTP AI） |
| PHASE_D 批次 | `industrial_acceptance_20261029_121220` **未修改** |
| 系统验收 | **CONDITIONALLY_ACCEPTED**（未升格） |

---

## 1. 数据库 / 备份

- D043/D045：已存在；本阶段**未迁移**  
- 正式工业题 formal COUNT：**0**（执行前只读确认）  
- 备份文件存在；SHA 与 PHASE_B 一致  
- 本阶段 **无** chem_train_items / links / sessions 写入  

## 2. 科学来源核验

| 结论 | **SOURCE_VERIFICATION_INCOMPLETE** |
|------|-------------------------------------|
| 已用依据 | 仓库案例 fixture；本地 DB `published` 实体（experiment#19/20、knowledge#61、substance#2） |
| 未做 | 外部教材页码 / DOI / 联网检索断言 |
| 注意 | experiment#19/#20 的 `review_note` 含 `ai_trial` / `human_unreviewed` / `trial_run` → KB 实绑前须管理员确认 |
| 禁止已遵守 | 未虚构页码；未把 AI 说明当参考文献；未伪造案例 published |

## 3. 候选一览（4）

| seq | candidateId | plannedCode | 题型 | 难度 | 分类 | 图形 | 质检 overall | formalPublishEligible |
|-----|-------------|-------------|------|------|------|------|--------------|------------------------|
| 01 | cand_63284abdddf24cee | ifc_20261029_121958_01 | single | 1 | flow_diagram_read | flow | failed_automatic_checks | false |
| 02 | cand_8ce596acabc64f26 | ifc_20261029_121958_02 | judge | 1 | industrial_apparatus_analysis | apparatus+flow stub | failed_automatic_checks | false |
| 03 | cand_03bf94425958444b | ifc_20261029_121958_03 | single | 2 | industrial_separation_purification | **flow+apparatus** | failed_automatic_checks | false |
| 04 | cand_312c51e0c9e249f7 | ifc_20261029_121958_04 | blank | 3 | industrial_production_cases | flow | failed_automatic_checks | false |

完整哈希与 KB 计划：`formal_candidate_batches/.../summary.json`。

## 4. 案例审核状态

全部引用 fixture 案例：`reviewStatus=draft`，来源 `unverified`。  
**未**伪造 `reviewedContentHash` / published / approved。

## 5. 图形

- 流程 SVG：程序渲染；不可变落盘 `uploads/industrial-svg/`  
- 装置 SVG：≥2；双图题 ≥1  
- Public 投影；安全渲染路径沿用既有校验  

## 6. 自动质检

- `requiresHumanReview=true`  
- unknown **未**改 pass  
- `formalPublishEligible=false`（案例不可信 + 质检未过正式门槛）  
- 辅助 AI 审查使用 **Mock reviewer**（非在线计费调用）  

## 7. 人工审核

全部 `pending_human_review`；`humanDecision=null`。  
清单：`PHASE_E1_HUMAN_REVIEW_CHECKLIST.md` + batch 内 `human_review_checklist.json`（项均为 PENDING_HUMAN_REVIEW）。

## 8. KB_BINDING_PLAN

每题已列 entityType/Id/Name/published/依据/adminConfirmRequired；**全部 NOT_BOUND**。实绑属 PHASE_E2。

## 9. 正式发布资格

**BLOCKED / NOT READY_FOR_FORMAL_IMPORT**

阻塞：人审未完成；案例 draft；来源核验不完整；质检未达 formal；KB 未绑；无 train_item。

## 10. 文件写入

- `apps/api/var/industrial-review/cand_*.json`  
- `docs/.../formal_candidate_batches/industrial_formal_candidate_20261029_121958/`  
- `industrial-phase-e1-prepare.ts` / `.selftest.ts`  
- `generationSource` 增加 `manual_fixture`  

## 11. 测试 / 构建

| 项 | 结果 |
|----|------|
| chem:industrial-phase-e1-selftest | **PASS** |
| phase-d-selftest（回归未破坏） | **PASS** |
| review / quality / item-asset / step12 | **PASS** |
| api / web build | **PASS** |
| 正式入库 / 人审 API / 抽题 IT | **NOT_EXECUTED** |

## 12. PHASE_E2 前置

| 项 | 状态 |
|----|------|
| E1 候选批次可追踪 | 满足 |
| 人审完成 + 案例可信 | **未满足** |
| formal 入库 + KB 实绑 | **未满足** |
| 可否开始 E2 业务闭环 | **仅可在用户批准后启动流程**；当前 **不满足「可无阻塞入库」** |

## 13. 剩余阻塞（优先）

1. 管理员真实人审 E1 候选与清单  
2. 案例来源可信度 / 审核升格（不得伪造）  
3. 质检 blocking/unknown 处理  
4. KB 实体 human_unreviewed 确认  
5. 再谈 formal import（PHASE_E2）  
