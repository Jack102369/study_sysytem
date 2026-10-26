# APPLICATION-4C-4B — DeepSeek 每日额度 MySQL 持久化与日常 AI 启用准备

> 状态：**PARTIAL / BLOCKED**（代码 + SQL 已就绪；**未迁移、未启用 AI**）  
> 日期：2026-10-26  
> 前置：APPLICATION-4C-3 = PASS

---

## 1. 方案 B 选择依据

| 方案 | 说明 | 结论 |
|------|------|------|
| A 私有 JSON 文件 | 进程/多实例不一致；API 重启语义弱 | 否 |
| **B MySQL 表** | 与 `users.id` 同库；事务 + 唯一约束可原子扣减；重启仍在 | **已采用** |

本轮仅实现代码与 `db/migrate_hs_math_deepseek_daily_quota.sql`。  
**不得**把本轮写成「日常 AI 已正式启用」。

---

## 2. OWNER_ONLY 规则

环境变量：

- `HS_MATH_APPLICATION_AI_MODE` = `disabled`（默认）| `owner_only`
- `HS_MATH_APPLICATION_AI_ALLOWED_USER_IDS`（建议 `2`）

行为：

| MODE | 行为 |
|------|------|
| `disabled` | 日常关闭。若配置了既有 `TEST_USER`+`SESSION`(+ITEM) allowlist → **测试模式**仍可用 |
| `owner_only` | 仅 allowlist 用户；**不要求**事先知道 sessionId；动态 session 可调度 |
| 非法 MODE / allowlist 缺失/空/非法 | **fail-closed**，拒绝全部本模块 AI |

服务端真实路径（submit 调度、HTTP 前、regrade）均走 `resolveApplicationAiAccess`；不可仅靠前端隐藏。

不影响：`single` / `multi` / `judge` / `numeric` 确定性判分。  
不影响：其他学科 DeepSeek（未改通用 `DeepseekClientService`）。

---

## 3. DeepSeek 日额度表

表名：`hs_math_deepseek_daily`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT UNSIGNED PK AI | |
| user_id | BIGINT UNSIGNED | 对齐 `users.id` |
| quota_date | DATE | Asia/Shanghai 自然日 |
| used_count | INT UNSIGNED | 已消耗（含失败/超时） |
| daily_limit | INT UNSIGNED | 行创建时快照，默认 20 |
| created_at / updated_at | DATETIME(3) | |

唯一约束：`UNIQUE(user_id, quota_date)`。

Entity：`HsMathDeepseekDaily`（**synchronize=false**）。

---

## 4. SQL 迁移说明

文件：`db/migrate_hs_math_deepseek_daily_quota.sql`

- 本轮：**GENERATED / NOT_RUN**
- 执行需**单独授权**
- 回滚：`DROP TABLE`（亦需单独授权）

---

## 5. 北京时间日期逻辑

`shanghaiCalendarDate()` 使用 `Intl` + `timeZone: 'Asia/Shanghai'`，避免 UTC 日期错位。

示例：`2026-10-25T16:00:00.000Z` → `2026-10-26`。

---

## 6. 原子扣减

`HsMathDeepseekDailyQuotaService.tryConsumeAtomic`：

1. 事务  
2. `INSERT … ON DUPLICATE KEY UPDATE id=id`（安全建当日行）  
3. `SELECT … FOR UPDATE`  
4. `UPDATE … SET used_count=used_count+1 WHERE used_count < daily_limit`  
5. 以 `affectedRows` 判定成败  

并发争抢最后一个额度：仅一次成功。  
扣减成功但 HTTP 前崩溃：**保守计入，绝不自动返还**。

仅在 `MODE=owner_only` 时强制 MySQL 日额度；测试路径仍用进程 `LIVE_HTTP_BUDGET`。

---

## 7. 双阶段预检与最终扣减

`gradingProvider=deepseek` 且含图：

1. **预检** `hasAvailableQuota`（不扣减）→ 已满则**不调 Qwen 转写**  
2. Qwen 转写成功且可靠后  
3. DeepSeek HTTP 前 **`tryConsumeAtomic`**  
4. 若竞态耗尽 → 停 DeepSeek；不改成 Qwen 评分；`grading_failed` + `deepseek_daily_quota_exceeded`

Qwen 转写失败 / Qwen 直评：**不扣** DeepSeek 额度。

---

## 8. 超额后状态

- 业务码：`deepseek_daily_quota_exceeded`  
- 状态：`grading_failed`（不写假 0 分；不永久卡 `grading`）  
- `gradingProvider` 仍为 `deepseek`  
- 前端：**「今日 DeepSeek 批改次数已用完，请明天再试。」**（≠ 识别不可靠）  
- regrade：owner_only 下改状态**前**预检；不足则拒绝且不改库  

---

## 9. Stub 测试

API：`pnpm --filter api run hs-math:application4c4b-selftest`（OWNER + 内存额度 stub）  
Web：`pnpm --filter web run hs-math:application4c4b-selftest`  

另回归：3E / 4C-2 相关 stub（见执行记录）。

**真实 MySQL 原子扣减：NOT_RUN**（禁止本轮写库）。

---

## 10. API / Web build

见最终报告执行结果。

---

## 11–12. 未执行项

| 项 | 状态 |
|----|------|
| 数据库迁移 | **NOT_RUN** |
| 数据库写入 | **0** |
| Qwen / DeepSeek HTTP | **0** |
| AI 开关 | 保持 **false / false** |
| API 重启 | **NOT_RUN** |
| UI 真机 | **UI_NOT_RUN** |
| 日常 AI 自动批改 | **NOT_ENABLED** |

---

## 13. 后续 MySQL 集成验收（需授权）

建议阶段 **APPLICATION-4C-4C**（需单独授权）：

1. 执行迁移建表  
2. 只读确认表结构  
3. 设 `MODE=owner_only` + `ALLOWED_USER_IDS=2` + 开开关（或临时验收后再关）  
4. 真实并发争抢最后 1 次额度  
5. 跨日、重启后 used_count 仍在  
6. 双阶段预检 / 扣减 / 超额文案  

---

## 14. 需要单独授权的操作

1. 执行 `migrate_hs_math_deepseek_daily_quota.sql`  
2. 设置 `HS_MATH_APPLICATION_AI_MODE=owner_only` 并重启 API  
3. 开启 `HS_MATH_VISION_GRADING_ENABLED` / `HS_MATH_AI_GRADING_ENABLED`  
4. 真实 Qwen / DeepSeek HTTP  
5. 进入 APPLICATION-4C-4C / CORE-1B  

---

## 变更文件（本轮）

- `db/migrate_hs_math_deepseek_daily_quota.sql`
- `apps/api/src/hs-math/entities/hs-math-deepseek-daily.entity.ts`
- `apps/api/src/hs-math/train/hs-math-deepseek-daily-quota.service.ts`
- `apps/api/src/hs-math/util/hs-math-application-ai-owner-scope.ts`
- `apps/api/src/hs-math/util/hs-math-deepseek-daily-quota.ts`
- `apps/api/src/hs-math/util/hs-math-application4c4b.selftest.ts`
- `apps/api/src/hs-math/train/hs-math-application-ai-grade.service.ts`
- `apps/api/src/hs-math/train/hs-math-train.service.ts`
- `apps/api/src/hs-math/hs-math.module.ts` / `hs-math.constants.ts`
- `apps/api/.env.example`
- `apps/web/src/utils/hs-math-ai-grade-poll.ts`
- `apps/web/src/components/hs-math/MathApplicationInput.vue`
- `apps/web/scripts/hs-math-application4c4b-status.selftest.mjs`
- 本文档 + `PROJECT_HANDOFF.md`
