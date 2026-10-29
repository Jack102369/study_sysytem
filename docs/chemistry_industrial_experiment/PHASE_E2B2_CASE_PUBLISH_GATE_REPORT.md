# PHASE_E2-B2 · 案例有效审核与正式发布闸门报告

| 字段 | 值 |
|------|-----|
| 执行日期 | 2026-10-29 13:28:48 +08:00 |
| 阶段状态 | **COMPLETED**（代码路径） |
| 最终验收 | **CONDITIONALLY_ACCEPTED**（未升格） |
| 真实人审 / 真实入库 | **未执行** |

---

## 1. 案例原始状态

E1 批次所用案例 fixture（如 `salt_purification_basic`）仍为：

- `reviewStatus=draft`
- 来源 `verificationStatus=unverified`
- `curriculumReviewStatus=pending`
- `reviewedContentHash` 空或未绑定

未改写 STEP_04 fixture 伪造历史。

## 2. 案例覆盖层结构

路径：`apps/api/var/industrial-case-review/<caseCode>.json`

关键字段：

- `decision`：含 `approve_for_publish` 及意见类决策
- `contentHashAtReview` / `reviewedContentHash`（服务端）
- `sourceNotes[]`：`verified_by_admin` + `evidenceNote≥8`
- `grantsEffectivePublishEligibility`
- `elevatesFixtureToPublished: false`（恒 false）
- `history[]`

## 3. 案例有效审核状态

`resolveIndustrialCaseEffectiveReview()`：

- 区分 raw / overlay / effective
- 仅当 overlay 当前哈希匹配 + `approve_for_publish` + 来源证据齐全时：
  - `effectiveReviewStatus=approved`
  - `effectiveSourceVerification=verified`
  - `grantsEffectivePublishEligibility=true`

`projectIndustrialCaseForPublishGates()`：

- 仅投影 `reviewStatus` + `reviewedContentHash`（不参与 contentHash）
- **不**改写 `sourceReferences` / `curriculumScope`（二者参与语义哈希）

## 4. 来源核验规则

- 禁止一键无条件 verified
- `approve_for_publish` 要求每条来源 `verified_by_admin` + 证据
- 须覆盖案例全部 `sourceTitle`
- reviewer / reviewedAt / reviewedContentHash 仅服务端写入

## 5. 案例升格条件（有效资格，非改 fixture）

结构合法、contentHash/version 有效、管理员主动操作、来源证据、哈希绑定、历史可追踪；内容/来源变化后旧覆盖层失效（`OVERLAY_STALE_CONTENT_HASH`）。

## 6. 质检联动

| 检查码 | 无有效审核 | 有有效审核 |
|--------|------------|------------|
| CURR_CASE_TRUST | fail | pass（仅解除本项） |
| CHEM_SOURCE_VERIFIED | fail | pass（仅解除本项） |

其它 error/critical / unknown **不**自动转 pass。案例审核后候选质检与人审失效（`invalidateCandidatesAfterCaseReview`）。

## 7. dry-run 原始阻断位置

- Controller/Nest：`formal-import` 默认 dry-run
- 真实写库需：`dryRun===false` + `confirmRealPublish===true` + `INDUSTRIAL_FORMAL_REAL_PUBLISH` 开启
- 本阶段 env **未开启**；`.env` 未改开

## 8. 真实发布代码路径

已具备：闸门 → `IndustrialFormalImportDbService` 事务双图 → 幂等 code/asset。  
开关：`industrial-formal-publish.config.ts`，默认 false。

## 9. 双图事务 / 幂等

保持 D043 设计：flow + apparatus；失败回滚；重复导入复用。

## 10. 安全测试 / 构建

| 项 | 结果 |
|----|------|
| chem:industrial-phase-e2b2-selftest | PASS |
| e2b / e2a / quality / review / case | PASS |
| API / Web build | 见 TEST_REPORT |
| study_system 写库 | **未执行** |

## 11. 剩余阻塞

1. 真实管理员案例来源核验与 `approve_for_publish`
2. 候选重新质检与逐题人审
3. 用户另批后才可 E2-C 开启 real publish

## 12. 下一步

按更新后的 `PHASE_E2B_ADMIN_REVIEW_GUIDE.md` 由管理员本人操作；不得由 AI 代审。

## 13. 后续缺陷（列表）

2026-10-29：管理员按 batchId 列表曾因 `_phase_e2a_latest_batch.json` 误入导致 `caseCode.replace` 崩溃；已修复，见 [PHASE_E2B2_CANDIDATE_LIST_BUGFIX.md](./PHASE_E2B2_CANDIDATE_LIST_BUGFIX.md)。
