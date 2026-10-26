# APPLICATION-4C-1 — 清晰答案图被误显示为「识别失败」诊断与修复

**状态：PASS**（前端文案修复；未重批；人工 UI 点验 = UI_NOT_RUN）

---

## 1. 用户确认的 session

| 字段 | 值 |
|---|---|
| sessionId | **126** |
| sessionItemId | **349** |
| itemId | **151**（HSMA-RJA-CH03-APP-0001） |
| gradingProvider | **deepseek** |
| imageIds | **55 → 56**（submitted） |
| grade_result | `review_required` |
| grade_reason | **`awaiting_multimodal`** |
| ai_attempt_count | **0** |
| ai_grade_json | **null** |
| 提交时间 | 2026-10-26 02:58:42Z |

说明：正确答案应为 x=40；与 3E-9 的 session 124/125（x=50 部分正确）无关。

---

## 2. 图片原件检查（只读）

| imageId | sort | mime | size | 文件 | 头寸 |
|---|---|---|---|---|---|
| 55 | 1 | image/png | 10982 | 存在且 size 一致 | 467×310 |
| 56 | 2 | image/png | 10241 | 存在且 size 一致 | 886×347 |

- 第二张**非空文件**；缩略图发白 ≠ 坏图。
- 未修改原件；未复制到公开目录；报告不写 storage_key。

---

## 3. AI 元数据与调用证据

- 提交时 `HS_MATH_VISION_GRADING_ENABLED=false`、`HS_MATH_AI_GRADING_ENABLED=false`。
- `dispatchApplicationGrade`：deepseek + 有图 + vision 未就绪 → `review_required` + `awaiting_multimodal`，**不入队**。
- **Qwen HTTP = 0**（本记录从未转写）。
- **DeepSeek HTTP = 0**（本记录从未评分）。
- 不存在 `recognizedWork` / `recognitionUncertain` / warning —— 因为 AI 根本未跑。

---

## 4. 根因

| 层 | 结论 |
|---|---|
| 模型识别 | **未发生**（非 A） |
| 质量门禁 | **未进入**（非 B） |
| Parser | **未进入**（非 C） |
| 图片读写 | 原件正常（非 D 主因） |
| 前端展示 | **误导**：凡 `review_required` 一律显示「AI 未能可靠识别…」 |

**根因：AI 开关关闭导致未调度；前端把「未启用/未调度」显示成「识别失败」。**

是否确认「识别门禁误拦截」：**否**（无识别过程可拦截）。

---

## 5. 修复内容

仅前端展示；**未改门禁、未写库、未重批**。

| 文件 | 变更 |
|---|---|
| `apps/web/src/utils/hs-math-ai-grade-poll.ts` | 按 `gradeReason` 分支文案；`awaiting_multimodal` ≠ 识别失败；未知 reason 中性；tag 标签辅助函数 |
| `apps/web/src/components/hs-math/MathGradeTag.vue` | 接收 `gradeReason`；未启用 →「AI 未启用·未评分」 |
| `apps/web/src/views/hs-math/HsMathTrainResultView.vue` | 传 `gradeReason`；状态条 tone 区分 info/warn/fail |
| `apps/web/scripts/hs-math-application4c1-status.selftest.mjs` | 新增 15 项 stub |
| `apps/web/scripts/hs-math-application4a-display.selftest.mjs` | 对齐新文案 |
| `apps/web/scripts/hs-math-application3d8-poll.selftest.mjs` | 对齐新文案 |
| `apps/web/package.json` | 增加 `hs-math:application4c1-selftest` |

`gradeReason` 经既有 `session-item-view` / `HsMathSessionItem.gradeReason` 已下发，**未改 API DTO / 表结构**。

### 文案规则（摘要）

| 条件 | 文案 |
|---|---|
| `awaiting_multimodal` | 本次提交时 AI 图片批改未启用…图片已保存…无评分 |
| 识别失败类 reason | AI 未能可靠识别…没有给出分数 |
| 未知 / 空 reason | 本次 AI 批改尚未得到有效评分结果 |
| `grading_failed` | 本次 AI 批改未完成，暂时无法提供分数 |
| `pending_ai` / `grading` | 等待 / 正在批改（轮询逻辑不变） |
| `graded` | 不显示状态替代分；照常展示分数 |

---

## 6. 测试与构建

| 项 | 结果 |
|---|---|
| Web 4C-1 selftest | **15/15 PASS** |
| Web 4A selftest | **18 PASS** |
| Web 3D-8 selftest | **4 PASS** |
| Web build | **PASS**（vue-tsc + vite） |
| API build | **PASS**（兼容检查；无 API 业务改动） |
| Qwen HTTP | **0** |
| DeepSeek HTTP | **0** |
| DB 写入 | **0** |
| API 重启 | **NOT_RUN** |
| 重批 session 126 | **NOT_RUN** |

---

## 7. 遗留 / 后续授权

1. **人工 UI**：刷新结果页 `/hs-math/train/result/126`，确认不再出现「未能可靠识别」（本报告记 **UI_NOT_RUN**）。
2. **重新批改 session 126**：需独立授权（开 Vision/AI 开关 + 允许真实 HTTP + 允许写回该条）。当前禁止自动重批。
3. **APPLICATION-4B** 124/125 人工点验仍未闭环。
4. 不进入 APPLICATION-4C-2 / CORE-1B。

---

## 8. 结论

**APPLICATION-4C-1 = PASS**

截图对应 session **126**；图片 55/56 正常；根因是 **AI 未调度 + 错误文案**；已最小修复前端状态展示。
