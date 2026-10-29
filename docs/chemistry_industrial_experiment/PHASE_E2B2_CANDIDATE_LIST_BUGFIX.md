# PHASE_E2-B2 后续 · 管理员候选列表 replace(undefined) 修复

| 字段 | 值 |
|------|-----|
| 用户发现 | 浏览器 Network：`GET /chemistry/admin/industrial-candidates?batchId=industrial_formal_candidate_20261029_121958` |
| 实际错误 | `Cannot read properties of undefined (reading 'replace')` |
| 修复时间 | 2026-10-29 13:42:04 +08:00 |
| 状态 | **FIXED**（Service 复现 + 自检；HTTP_E2E_NOT_EXECUTED） |

---

## 1. 根本原因

`listIndustrialReviewRecords` 扫描 `var/industrial-review/*.json` 时，把批次摘要文件一并当作候选：

- `_phase_e2a_latest_batch.json`（含 `e1BatchId=industrial_formal_candidate_20261029_121958`）
- `_phase_e1_latest_batch.json` / `_phase_d_latest_batch.json`

按 `batchId` 筛选时，摘要因 `e1BatchId` 匹配被纳入列表（matched=5：1 个 META + 4 个真实候选）。

随后 `toListItem` → `evaluateIndustrialFormalImportGates` → `resolveIndustrialCaseEffectiveReview` → `loadIndustrialCaseReviewOverlay(caseCode)`；摘要无 `caseCode`（undefined）→

`industrial-case-review.store.ts` `pathFor`：`caseCode.replace(...)` 抛错。

### 复现堆栈（Service，非编造）

```
TypeError: Cannot read properties of undefined (reading 'replace')
  at pathFor (industrial-case-review.store.ts:51)
  at loadIndustrialCaseReviewOverlay (...)
  at resolveIndustrialCaseEffectiveReview (...)
  at evaluateIndustrialFormalImportGates (...)
  at toListItem (industrial-review.service.ts)
  at listIndustrialReviews (...)
```

触发字段：`caseCode === undefined`（来自 `_phase_e2a_latest_batch.json`，非 cand_*.json）。

与 E2-B2 新增「有效案例审核」读取链路相关：列表为算 formal 资格会走 effective review；旧摘要文件缺少 caseCode 即崩溃。

---

## 2. 修复方法

1. **store**：仅加载 `cand_<id>.json` 且 `candidateId`/`caseCode`/`candidate` 合法、文件名与 id 一致；跳过 `_phase_*.json`。
2. **list**：`normalizeIndustrialListBatchId` 拒绝非法字符/类型；空串视为未传；`toListItem` 对不完整记录跳过并 warn；`blockingIssues?.length` 防空。
3. **case-review.store**：`loadIndustrialCaseReviewOverlay` 对空 caseCode 返回 null；`pathFor` 写路径前校验。
4. **DTO**：`batchId` `@Matches(/^[a-zA-Z0-9_-]*$/)`。

未删除/改写任何 E1 候选内容；未改人审/案例审核态；未开 real publish。

---

## 3. 修改文件

- `apps/api/src/chemistry/industrial/industrial-review.store.ts`
- `apps/api/src/chemistry/industrial/industrial-review.service.ts`
- `apps/api/src/chemistry/industrial/industrial-review.nest.ts`
- `apps/api/src/chemistry/industrial/industrial-review.dto.ts`
- `apps/api/src/chemistry/industrial/industrial-case-review.store.ts`
- `apps/api/src/chemistry/industrial/industrial-candidate-list.selftest.ts`（新增）
- `apps/api/package.json`（脚本）

---

## 4. 回归测试

| 项 | 结果 |
|----|------|
| chem:industrial-candidate-list-selftest | **PASS**（E1=4；meta 跳过；非法 batchId；文件未变） |
| chem:industrial-phase-e2b2-selftest | **PASS** |
| chem:industrial-phase-e2b-selftest | **PASS** |
| chem:industrial-review-selftest | **PASS** |
| chem:industrial-phase-e1-selftest | **PASS** |
| chem:industrial-quality-selftest | **PASS** |
| api build | **PASS** |
| web build | 见 TEST_REPORT |
| 真实 HTTP（带管理员 JWT） | **HTTP_E2E_NOT_EXECUTED** |
| 服务重启 | 未杀整个 `pnpm dev`；nest `--watch` 已于 13:43:58 热重载（新 PID）；请浏览器硬刷新确认 |

---

## 5. 候选与审核

| 项 | 值 |
|----|-----|
| E1 可列出 | **4** |
| humanDecision | 仍 null |
| reviewStatus | 仍 pending_human_review |
| 案例 fixture | 仍 draft |
| formal 写库 | 无 |
| 数据库业务写入 | 无 |

---

## 6. 遗留风险

- 若 API 进程未热加载旧 dist，浏览器仍可能见旧错误 → 需确认 watch 已编译或手动重启 `pnpm --filter api`。
- 未执行带 JWT 的真实 HTTP 断言。
