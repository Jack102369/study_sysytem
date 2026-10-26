# APPLICATION-3D-8 · 提交后自动 Vision 批改

> **日期**：2026-10-25  
> **状态**：**PARTIAL**（代码 + stub 自测 + build；**未**开启真实 Vision；**未**真实自动验收；**未**重启 API）  
> **真实 Qwen**：0 次  
> **学生图片外发**：否  
> **迁移**：否

---

## 1. 修改文件

| 文件 | 说明 |
|---|---|
| `apps/api/src/hs-math/util/hs-math-application-vision-submit.ts` | 开关→状态、claim 拒绝、stale 判定 |
| `apps/api/src/hs-math/hs-math.constants.ts` | `VISION_MAX_INFLIGHT`、stale buffer |
| `apps/api/src/hs-math/train/hs-math-application-ai-grade.service.ts` | 信号量、`recoverStaleGradingForSession`、claim reason 时间戳 |
| `apps/api/src/hs-math/train/hs-math-train.service.ts` | submit 用 classify；getSession 调 stale 恢复 |
| `apps/api/src/hs-math/util/hs-math-application3d8.selftest.ts` | API stub |
| `apps/web/src/utils/hs-math-ai-grade-poll.ts` | 轮询条件 / 文案 |
| `apps/web/src/views/hs-math/HsMathTrainResultView.vue` | 4s 轮询 + 文案 |
| `apps/web/scripts/hs-math-application3d8-poll.selftest.mjs` | Web stub |
| `apps/api/.env.example`、`package.json`（api/web） | 配置与脚本 |
| 本文 + `PROJECT_HANDOFF.md` | 文档 |

---

## 2. 自动触发流程

1. `submit` 事务内：锁图 draft→submitted；含图且 Vision **开** → `pending_ai`；**关** → `review_required`。  
2. 事务提交后：仅对新 `visionAiItemIds` 调用 `scheduleVisionGrading`（幂等 submit 不重复）。  
3. `claimForGrading` 短事务 → `grading` → invoker（stub/真实）→ `graded` / `grading_failed` / 不确定 `review_required`。  
4. **不**扫描历史 `review_required`；**不**在事务内等待 Qwen。

---

## 3. 功能开关

`HS_MATH_VISION_GRADING_ENABLED` 默认 **false**（本轮保持关闭）。  
关：图片答案 → `review_required`，不调度。  
开：新提交 → `pending_ai` + 异步调度。

---

## 4. 并发与幂等

| 机制 | 作用 |
|---|---|
| `inFlight` Set | 同进程同 item 不重入 |
| DB 悲观锁 claim | 拒 graded / review_required；多进程依赖行锁（本轮无多进程实跑） |
| Vision 信号量 | 默认 max 2（`HS_MATH_VISION_MAX_INFLIGHT`） |
| submit 幂等 | completed 会话不再入队 |

---

## 5. 成本限制

- 最多 5 图 / 单图 10MB（既有）  
- 一次提交最多调度一次  
- 无自动无限重试；`ai_attempt_count` 上限  
- 超时 / 非法 JSON → `grading_failed`，不重发  
- 开关关不调用  

---

## 6. grading 恢复策略

进程崩溃后 `grading` 可卡住：  
`getSession` 对本 session 调用 `recoverStaleGradingForSession`：  
若 `gradeReason=ai_grading:<epoch>`（或回退 `submittedAt`）超过 **timeout+30s** → 就地 `grading_failed` / `stale_grading`。  
**不外发、不扫其它会话、不自动重试。**

---

## 7. 前端轮询

- 仅 `pending_ai` | `grading`  
- 间隔 4s；页面隐藏 15s；最多 90 次 / 5 次错误停  
- 卸载 / 换 session 清定时器  
- **不对** `review_required` 轮询  

文案：批改中 / 失败 / 识别不清 / 等待多模态。

---

## 8. 测试结果

```text
pnpm --filter api run hs-math:application3d8-selftest  → PASS 19
pnpm --filter web run hs-math:application3d8-selftest  → PASS 4
```

覆盖：开关、纯图/混合/纯文字、claim 拒绝、stale、非法 JSON、uncertain、0 分、部分分、旧题型、文字路径独立、轮询停止条件。  
多进程 claim：**未实跑**（依赖悲观锁，文档标明）。

---

## 9. Build

- `pnpm --filter api run build`：**OK**  
- `pnpm --filter web build`：**OK**

---

## 10. 未执行

- 真实 Qwen / DeepSeek  
- 学生图片外发  
- 开启 Vision 开关  
- API 重启 / 部署  
- 数据库迁移  

---

## 11. 后续真实自动批改验收

1. 授权开启 `HS_MATH_VISION_GRADING_ENABLED=true`（URL/KEY 已配）。  
2. 重启 API。  
3. 学生网页提交虚构双图应用题。  
4. 确认无需 Cursor 显式 `gradeOneVision`：`pending_ai`→`grading`→`graded`。  
5. 结果页轮询自动刷新分数。

---

## 阶段

**APPLICATION-3D-8 = PARTIAL**  
**APPLICATION-3D / APPLICATION-3 = PARTIAL** · **APPLICATION-3C = PASS**  
**CORE-1A-4B = BLOCKED** · **CORE-1B = NOT_STARTED**
