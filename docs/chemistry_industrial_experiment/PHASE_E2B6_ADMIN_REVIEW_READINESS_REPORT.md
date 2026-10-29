# PHASE_E2-B6 · 管理员审核就绪报告（PART A）

| 字段 | 值 |
|------|-----|
| 执行 | 2026-10-29 14:49:44 +08:00 |
| 状态 | **PHASE_E2-B6_PART_A_COMPLETED** |
| 人工审核 | **HUMAN_BROWSER_REVIEW_PENDING** / **NOT_EXECUTED** |
| 来源真实核验 | **否** |
| 案例真实批准 | **否** |
| 候选真实批准 | **否** |
| formal / real publish | **否** / **OFF** |
| 最终验收 | **CONDITIONALLY_ACCEPTED** |

---

## 1. 当前任务

为真实管理员完成科学来源核验、案例有效审核、四题人审准备就绪检查与最小 UI 修复；**禁止** Cursor 代审。

## 2. E1 四道候选状态

| ID | rev | case | status | humanDecision | quality |
|----|-----|------|--------|---------------|---------|
| cand_63284abdddf24cee | **9** | salt | pending_human_review | null | failed_automatic_checks |
| cand_8ce596acabc64f26 | **9** | gas_wash | pending_human_review | null | failed_automatic_checks |
| cand_03bf94425958444b | **7** | salt | pending_human_review | null | failed_automatic_checks |
| cand_312c51e0c9e249f7 | **9** | seawater | pending_human_review | null | failed_automatic_checks |

批次：`industrial_formal_candidate_20261029_121958`。revision 与预期一致。

## 3. 三个工业案例状态

| caseCode | fixture | 覆盖层有效资格 | 证据辅助态 |
|----------|---------|----------------|------------|
| salt_purification_basic | draft / unverified | 无 | SOURCE_EVIDENCE_PARTIAL |
| gas_wash_teaching_basic | draft / unverified | 无 | **SOURCE_EVIDENCE_INCOMPLETE** |
| seawater_resource_basic | draft / unverified | 无 | SOURCE_EVIDENCE_PARTIAL |

## 4. 科学来源状态

登记 8；历史 ACCESSED 3 / ACCESS_FAILED 5；verified_by_admin=0。  
本轮只读重试：JSNT/ZUST 仍可读；SZ 洗气页仍失败（500）。ACCESSED ≠ verified。

## 5. 页面审核功能

`/settings/chemistry-industrial-candidates`：列表 4 题、抽屉题面/双图/来源/质检 fail·unknown/KB 计划/清单/案例覆盖层/人审/dry-run 入库。  
本轮增强：审核步骤条、B5 外链、SOURCE_EVIDENCE_INCOMPLETE 警告、逐条 evidence 手填（禁预填已核验）。

## 6. 审核表单状态

案例：`approve_for_publish` 须每条 verified_by_admin + evidenceNote≥8 + 意见≥8；服务端记 reviewer/时间/哈希；不升格 fixture published。  
候选：approve 受 formalImportBlockers；recheck 清空 humanDecision。

## 7. 管理员鉴权

Controller：`JwtAuthGuard` + `AdminGuard`。匿名 `GET …/industrial-candidates` → **HTTP 401**（本轮已测）。  
**AUTHENTICATED_HTTP_NOT_EXECUTED** / **HUMAN_BROWSER_REVIEW_PENDING**（无合法管理员会话代测/代审）。

## 8. 安全闸门

real publish 默认 OFF；PHASE_D Mock 不可正式发布；unknown 不自动 pass；人审≠入库；列表只读不写业务库。见 e2b2/e2b6 自检。

## 9. 修改文件

- `industrial-scientific-evidence-helpers.ts`（新）  
- `industrial-admin-review-packet.ts`（steps + helpers）  
- `ChemistryIndustrialCandidatesView.vue`（步骤/外链/证据行）  
- `industrial-phase-e2b6.selftest.ts` + package.json script  
- 本报告 + ACTION_CHECKLIST + 进度文档 / NEXT_SESSION  

**未改** cand JSON 人审态、案例 fixture、覆盖层批准、DB 业务。

## 10–11. 测试

见 TEST_REPORT（e2b6 + e2b2–e2b5 / case / quality / review / list + api/web build）。

## 12–17. 未执行 / 否

真实浏览器人审、来源核验、案例批准、候选批准、formal、DB 业务写：**均未执行 / 否**。

## 18. 剩余风险

洗气外部证据弱；API 若因 watch 丢 dist 需重建后重启；管理员须本人登录。

## 19. 下一步

按 `PHASE_E2B6_ADMIN_ACTION_CHECKLIST.md` 执行 **PART B**；完成后另议 E2-C。
