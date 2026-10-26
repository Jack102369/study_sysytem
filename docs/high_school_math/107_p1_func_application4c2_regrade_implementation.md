# APPLICATION-4C-2 — 应用题重新申请 AI 批改（实现）

**状态：PARTIAL**（代码 + 离线 stub + build 完成；真实重批 / UI 点验 = NOT_RUN）

---

## 1. 目标

学生无需重新上传图片，即可对已保存应用题答案主动申请 AI 批改。  
本轮**未**真实批改 session 126，**未**开启 AI 开关，**未**写库。

---

## 2. 重批资格

| 允许 | 条件 |
|---|---|
| A | `application` + session `completed` + 属主 + `review_required` + `awaiting_multimodal` / `awaiting_text_ai` |
| B | `grading_failed` 且 `ai_attempt_count < HS_MATH_AI_GRADING_MAX_ATTEMPTS`（=2） |

| 拒绝 | 说明 |
|---|---|
| `graded` / `pending_ai` / `grading` | 禁止覆盖或重复 |
| 识别类 `review_required` | `uncertain_recognition` / `low_confidence` / `critical_recognition_warning` 等 |
| 非 application / 未完成 / 跨用户 / 图片非 submitted | |

客户端**不得**传入 `gradingProvider` / `imageIds` / `text` / score。

---

## 3. API 协议

```
POST /hs-math/train/sessions/:sessionId/items/:sessionItemId/regrade
Authorization: Bearer <JWT>
Body: （空）
```

成功：返回 session 详情 + `regradeMeta.accepted=true`；题目变为 `pending_ai` 并入队。  
AI 不可用：`400`，文案「当前 AI 批改暂未开放，请稍后再试。」（`AI_GRADING_DISABLED`），**不改 DB 状态**。

---

## 4. 状态机

```
review_required(awaiting_*) | grading_failed
        │ 资格 + 开关（同锁）
        ▼
   pending_ai  →  grading  →  graded | review_required | grading_failed
```

- 沿用已保存答案与 `gradingProvider`。  
- qwen → vision；deepseek+图 → dual；deepseek 文 → text。  
- 无假 0 分；pending 不计入 correct/wrong。

---

## 5. 并发与幂等

1. 事务内 `SELECT … FOR UPDATE` session + item（及引用图片）。  
2. **资格与开关在同一锁内判定**；开关不足直接抛错，**不写 pending_ai**。  
3. 成功后原子写 `pending_ai`；第二次请求见 `pending_ai` → `ALREADY_PENDING`。  
4. 事务外复用 `schedule*` + 进程内 `inFlight` + `claimForGrading`。  
5. 离线 `simulateConcurrentRegradeAttempts`：第一次 dual queue，第二次拒绝。

残留竞态（与 submit 同源）：事务提交后、schedule 前若开关被关，可能短暂停在 `pending_ai`（schedule 会 skip）；本轮未改全局开关热切换语义。

---

## 6. 次数限制

复用 `ai_attempt_count` + `HS_MATH_AI_GRADING_MAX_ATTEMPTS=2`。  
**无迁移**。claim 时仍递增 attempt。

---

## 7. 前端

- 结果页按钮「重新申请 AI 批改」（`canRequestApplicationRegrade`）。  
- 确认 → `regradeHsMathApplicationItem` → 复用轮询。  
- 关开关：展示「当前 AI 批改暂未开放，请稍后再试。」  
- 刷新页面不自动申请。

---

## 8. 修改文件

| 文件 |
|---|
| `apps/api/src/hs-math/util/hs-math-application-regrade.ts` |
| `apps/api/src/hs-math/util/hs-math-application4c2.selftest.ts` |
| `apps/api/src/hs-math/train/hs-math-train.service.ts` |
| `apps/api/src/hs-math/train/hs-math-train.controller.ts` |
| `apps/api/package.json` |
| `apps/web/src/utils/hs-math-ai-grade-poll.ts` |
| `apps/web/src/api/hs-math-train.ts` |
| `apps/web/src/views/hs-math/HsMathTrainResultView.vue` |
| `apps/web/scripts/hs-math-application4c2-regrade.selftest.mjs` |
| `apps/web/package.json` |

---

## 9. 测试与构建

| 项 | 结果 |
|---|---|
| API 4C-2 stub | **31/31 PASS** |
| API 3E-1 / 3E-2 / 3E-8 / 4A 回归 | PASS |
| Web 4C-2 stub | **11/11 PASS** |
| Web 4C-1 / 3D-8 | PASS |
| API build | PASS |
| Web build | PASS |
| Qwen / DeepSeek HTTP | **0 / 0** |
| DB 写入（本任务对业务库） | **0** |
| session 126 | **未修改** |
| API 重启 | NOT_RUN |
| 真实重批 | NOT_RUN |
| UI | UI_NOT_RUN |

---

## 10. 后续授权（APPLICATION-4C-3 候选）

真实重批 session 126 需要独立授权：开启 Vision/AI、allowlist、真实 HTTP、允许写回该条。  
不得自动进入 4C-3 / CORE-1B。
