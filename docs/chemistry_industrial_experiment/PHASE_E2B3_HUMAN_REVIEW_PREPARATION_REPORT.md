# PHASE_E2-B3 · 真实管理员人工审核辅助与科学来源核验准备报告

| 字段 | 值 |
|------|-----|
| 执行时间 | 2026-10-29 14:05:45 +08:00（文档）；构建至后续 |
| 阶段状态 | **COMPLETED**（辅助准备） |
| 真实人审 | **HUMAN_REVIEW_BROWSER_WORKFLOW_NOT_EXECUTED** |
| 科学来源人核 | **SCIENTIFIC_SOURCE_HUMAN_VERIFICATION_PENDING** |
| 外部来源访问 | **EXTERNAL_SOURCE_VERIFICATION_NOT_EXECUTED**（未宣称联网核验通过） |
| 正式入库 | **NOT_EXECUTED** |
| 最终验收 | **CONDITIONALLY_ACCEPTED**（未升格） |

---

## 1. 本轮任务

为 E1 四道正式候选生成可照做的人审辅助材料与操作顺序；核查页面与安全闸门；**不**代审、**不**改候选科学内容、**不**开 real publish。

用户已确认浏览器可列出 4 题并打开详情（列表/解包问题视为已过）。

## 2. 四道候选实际情况（FACT）

| ID | planned | 题型 | 难 | 案例 | 图 |
|----|---------|------|----|------|-----|
| cand_63284abdddf24cee | _01 | single | 1 | salt_purification_basic | flow |
| cand_8ce596acabc64f26 | _02 | judge | 1 | gas_wash_teaching_basic | apparatus+flow |
| cand_03bf94425958444b | _03 | single | 2 | salt_purification_basic | flow+apparatus |
| cand_312c51e0c9e249f7 | _04 | blank | 2 | seawater_resource_basic | flow |

共性：revision=7；humanDecision=null；pending_human_review；formalImportBlocked；QUALITY_BLOCKERS=[]；发布阻断 CURR_CASE_TRUST + CHEM_SOURCE_VERIFIED；案例覆盖层目录空；SVG 文件均存在（无装置者标不适用）。

## 3. 科学内容疑点（ANALYSIS，非证明）

1. **cand_312…（严重）**：题干要「图中」固液分离操作，答案「过滤」，但流程图与案例步骤均无过滤 → **建议退回修订**。  
2. **cand_8ce…（重点）**：比较式判断「更合理」；缺气体/洗液/收集法；尾气 unknown → **建议考虑退回或加严**。  
3. **cand_632…**：图示「操作①」对答案「过滤」 → 须确认教学意图。  
4. **cand_03bf…**：双图盐提纯；干扰项与解析大体一致 → 仍须人审；共享 salt 案例。

**不得**因 QUALITY_BLOCKERS=0 认定科学正确。

## 4. 来源证据缺口

三案例（salt / gas_wash / seawater）均为 draft + unverified textbook_knowledge + identifier null。  
KB published 条目含 human_unreviewed。  
metal_recovery_basic 本批次未用。  
管理员须自备教材页码/权威出处；本轮未伪造、未 verified。

## 5. 图形人工核验要求

- 01/04：仅流程；04 图文冲突优先。  
- 02：装置气路顺序 vs 题干；尾气 unknown。  
- 03：双图一致性。  
- schematic ≠ 施工图。

## 6. 页面功能检查

列表/详情/题干答案解析/双 SVG/案例/来源/阻断/unknown/清单/覆盖层/人审/dry-run/哈希 revision：**具备**。  
本轮最小 UI：闸门说明 alert；revisionHistory 只读表。  
未发现可绕过 Admin JWT 的公开审核口；approve 仍受服务端闸门拒绝。

## 7. 安全闸门检查

JwtAuth+Admin；案例 approve 需证据；覆盖层失效候选质检；内容哈希绑定；real publish 默认 OFF；人审通过不自动写 formal。自检确认四题 gates.ok=false、无 effective publish grant、humanDecision 仍 null。

## 8. 修改文件

- docs/.../human_review_packets/*  
- PHASE_E2B3_HUMAN_REVIEW_OPERATIONS.md  
- PHASE_E2B3_HUMAN_REVIEW_PREPARATION_REPORT.md（本文件）  
- ChemistryIndustrialCandidatesView.vue（提示+历史）  
- industrial-phase-e2b3.selftest.ts + package.json 脚本  
- 进度类文档 / NEXT_SESSION  

**未修改** cand_*.json 科学内容与审核字段。

## 9–10. 测试

| 命令 | 结果 |
|------|------|
| chem:industrial-phase-e2b3-selftest | PASS |
| candidate-list / e2b2 / e2b / review / quality / case / e1 | PASS |
| api/web build | 见 TEST_REPORT |
| 真实浏览器人审操作 | **HUMAN_REVIEW_BROWSER_WORKFLOW_NOT_EXECUTED** |
| 科学来源人核 | **PENDING** |

## 11. 未解决风险

图文冲突题仍在库；来源 unverified；unknown 大量；KB 未绑定；E2-C 未批。

## 12. 管理员操作顺序

见 OPERATIONS.md 十二步。

## 13. 进入下一阶段条件

1. 管理员完成案例证据核验（或明确退回）  
2. 严重内容问题题已修订或正式退回  
3. 重质检 + 逐题人审完成  
4. 用户**另批** PHASE_E2-C 才可开 real publish / formal / 训练闭环  
