# P1-FUNC · APPLICATION-3A 纯文字应用题 AI 自动批改

> **执行时间**：2026-10-25  
> **状态**：**PARTIAL**  
> **原因**：迁移未执行；真实 DeepSeek 未联调；真实 UI 未点验  
> **APPLICATION-3 整体**：仍 **NOT PASS**（本子阶段 PARTIAL）  
> **未授权**：执行迁移、真实 API 调用、外发学生数据、重启/部署

---

## 1. 实际修改文件

### 数据库（未执行）

- `db/migrate_hs_math_application3_ai_grading.sql`（新增）
- `db/init.sql`（权威结构同步）
- `db/hs_math_it_schema.sql`（IT 对齐）

### 后端

- `apps/api/src/hs-math/hs-math.constants.ts` — grade_result 扩展；AI 开关/超时/次数
- `apps/api/src/hs-math/entities/hs-math-train-session-item.entity.ts` — `ai_*` 列
- `apps/api/src/hs-math/types/ai-grade-protocol.ts` — AI 结果类型
- `apps/api/src/hs-math/util/hs-math-ai-grade.validate.ts` — rubric 严格校验 + 路由/计数
- `apps/api/src/hs-math/util/hs-math-ai-grade.prompt.ts` — 中文评分 prompt
- `apps/api/src/hs-math/train/hs-math-application-ai-grade.service.ts` — 状态机/幂等/异步批改
- `apps/api/src/hs-math/train/hs-math-train.service.ts` — submit 分流 + 调度
- `apps/api/src/hs-math/util/session-item-view.ts` — reveal 返回 `aiGrade`
- `apps/api/src/hs-math/train/hs-math-analytics.service.ts` — pending-like 统计
- `apps/api/src/hs-math/hs-math.module.ts` — 引入 `AiReferenceModule` + AI 服务
- `apps/api/src/ai-reference/deepseek-client.service.ts` — `gradeHsMathApplicationText` + 超时 AbortSignal（兼容旧调用方）
- `apps/api/src/hs-math/util/hs-math-application3a.selftest.ts`
- `apps/api/package.json` — `hs-math:application3a-selftest`

### 前端

- `apps/web/src/api/hs-math-train.ts` — 新 grade / aiGrade 类型
- `apps/web/src/components/hs-math/MathGradeTag.vue` — 新状态文案
- `apps/web/src/views/hs-math/HsMathTrainResultView.vue` — 分项得分与状态提示

### 文档

- 本文件 `80_…`
- `PROJECT_HANDOFF.md`

---

## 2. 数据结构

会话项增量列（`hs_math_train_session_items`）：

| 列 | 类型 | 说明 |
|---|---|---|
| `ai_grade_json` | JSON NULL | 校验通过后的结构化结果 |
| `ai_model` | VARCHAR(64) | 模型名 |
| `ai_graded_at` | DATETIME(3) | 完成时间 |
| `ai_attempt_count` | INT UNSIGNED | 尝试次数（默认 0） |

`grade_result` 仍为 `VARCHAR(32)`，取值扩展：

`correct|wrong|pending_review|pending_ai|grading|graded|review_required|grading_failed`

`ai_grade_json` 形状（服务端规范化后）：

```json
{
  "status": "graded",
  "totalScore": 8,
  "maxScore": 10,
  "rubricScores": [
    { "rubricKey": "model", "score": 3, "maxScore": 3, "feedback": "…" }
  ],
  "recognizedWork": "…",
  "errors": ["…"],
  "personalizedExplanation": "…",
  "confidence": 0.92,
  "model": "…",
  "gradedAt": "…"
}
```

未新建独立批改表（最小方案）。

---

## 3. AI 调用设计

1. 复用 `DeepseekClientService.gradeHsMathApplicationText`。  
2. **默认不外发**：须同时满足  
   - `HS_MATH_AI_GRADING_ENABLED=true`（或 `1`）  
   - 已配置 `DEEPSEEK_API_KEY`  
   否则写 `grading_failed` / `ai_disabled`，**不**调网络。  
3. 超时：`HS_MATH_AI_GRADING_TIMEOUT_MS = 60000`（AbortSignal）。  
4. 最大尝试：`HS_MATH_AI_GRADING_MAX_ATTEMPTS = 2`。  
5. Prompt：高中数学评分器；覆盖 APP-0001 rubric（model/domain/solve/conclusion）。  
6. 不把 API Key / 学生全文写入普通日志。  
7. 可注入 `invoker` stub（测试用）；生产路径不调用真实 API（本轮未启用开关）。

---

## 4. Rubric 校验规则

`validateHsMathAiGradeResult`：

1. 合法对象 / 可解析 JSON  
2. rubric 与题目一一对应：无缺项、无重复、无未知 key  
3. 分项整数；`0 ≤ score ≤ 题目该项 maxScore`  
4. `totalScore === sum(scores)` 且 `≤ 题目 maxScore`  
5. 题目 rubric 合计须等于题目 `maxScore`  
6. `feedback` / `personalizedExplanation` 非空文本  
7. `confidence` 若存在须在 `[0,1]`  
8. **忽略** AI 自报 `maxScore`，强制题目满分  
9. 失败 → `grading_failed`，不改 rubric、不写 0 分伪装

---

## 5. 状态流转

```
submit 纯文字 → pending_ai → (async) grading → graded
                                      ↘ grading_failed
submit 含图（纯图/混合）→ review_required（不调文本 AI）
```

- `grading_failed` / `review_required` / `pending_ai` / `grading` ≠ wrong  
- 合法 0 分仅当 AI 输出通过全部校验后以 `graded` 保存

---

## 6. 并发与幂等

1. 进程内 `inFlight` Set：同 `session_item` 不并行双写  
2. 短事务 claim：`pending_ai|grading_failed|grading` → `grading`，再释放锁后调 AI  
3. 已 `graded` 且已有 `ai_grade_json` → 不覆盖  
4. AI 期间不持长事务锁  
5. submit 幂等（已 completed）不重复调度 AI  
6. 无复杂队列；故障边界：进程崩溃可能留在 `grading`，后续可凭 `grading`/`grading_failed` 再 claim（受 max_attempts 限制）

---

## 7. 统计兼容

- 旧四题型：`correct`/`wrong` 行为不变  
- `graded`：不计 correct/wrong/pending；不计 accuracy 分母  
- pending-like：`pending_review|pending_ai|grading|review_required|grading_failed` → `pendingCount`  
- Analytics `byDifficulty` SQL 已纳入上述 pending-like

---

## 8. 前端展示

结果页：

| 状态 | 文案 |
|---|---|
| pending_ai | 等待 AI 批改 |
| grading | AI 批改中 |
| review_required | 包含手写图片，等待多模态 AI 批改 |
| grading_failed | AI 批改暂未完成，可稍后重试（无假「立即重试」按钮） |
| graded | 总分/满分、分项、反馈、错误定位、个性化解析 |

历史仍走同一会话详情 API；`storage_key` 不暴露。

---

## 9. 测试命令

```bash
pnpm --filter api run hs-math:application3a-selftest
pnpm --filter api run build
```

---

## 10. 测试结果

| 项 | 结果 |
|---|---|
| application3a-selftest | **PASS**（19 checks：A–P + prompt/未知 key 等） |
| api build | **PASS** |
| 真实 DeepSeek | **未调用** |
| 迁移执行 | **未执行** |
| UI 点验 | **未做** |

---

## 11. 尚未执行的数据库迁移

`db/migrate_hs_math_application3_ai_grading.sql`  
执行前检查 / 回滚说明见文件头注释。  
**须单独授权后执行。**

---

## 12. 尚未进行的真实 DeepSeek 联调

须单独授权：打开 `HS_MATH_AI_GRADING_ENABLED` + 密钥 + 迁移已执行后，再对正式题（如 item 151）联调。

---

## 13. 已知风险

1. 迁移未执行时，写 `ai_*` 列会失败 → 批改路径不可用。  
2. 含图题长期积压 `review_required`（无多模态授权）。  
3. `grading` 卡死依赖 max_attempts / 再调度，尚无正式重试 API。  
4. 默认开关关闭：即使迁移执行，也不会外发，直至显式启用。

---

## 14. 下一步最小任务

1. **授权执行** `migrate_hs_math_application3_ai_grading.sql`  
2. **授权** 真实 DeepSeek 联调（APPLICATION-3B 建议）  
3. 可选：`grading_failed` 正式重试入口  
4. 不进 CORE-1B；APPLICATION-2F / CORE-1A-4B 门禁不变

---

## 变更日志

| 时间 | 说明 |
|---|---|
| 2026-10-25 | APPLICATION-3A 代码闭环 + stub 测试；标 PARTIAL |
