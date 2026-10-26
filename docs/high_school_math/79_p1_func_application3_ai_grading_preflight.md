# P1-FUNC · APPLICATION-3 应用题 AI 批改预检

> **执行时间**：2026-10-25  
> **范围**：只读调研 + 设计文档  
> **禁止本轮**：改业务代码、迁移执行、写库、调 AI、装 SDK、图片外发  
> **APPLICATION-3**：**NOT_STARTED**（仅预检完成）  
> **APPLICATION-2F**：**PARTIAL**  
> **CORE-1A-4B**：**BLOCKED**

---

## 1. 现有 AI 能力

| 项 | 现状 |
|---|---|
| 服务 | [`DeepseekClientService`](../../apps/api/src/ai-reference/deepseek-client.service.ts) |
| 配置 | `DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`（默认 `https://api.deepseek.com`）、`DEEPSEEK_MODEL`（默认 `deepseek-chat`） |
| 调用 | `POST …/chat/completions`（`fetch`，Bearer） |
| 输出 | 强制/解析 JSON（`response_format: json_object`，推理模型例外） |
| 重试 | 业务层二次 chat + 反斜杠修复（相似题等路径） |
| 超时 | **无显式 AbortSignal 超时**（依赖运行时默认） |
| 多模态 | **无**（messages.content 仅为 string；无 image/base64/vision） |
| 复用方 | 写作教练、错题相似、知识卡片公式、宠物助手 |
| 权限 | [`AiAccessService`](../../apps/api/src/auth/ai-access.service.ts)（`users.ai_enabled`） |
| 成本 | 例：`AI_SIMILAR_DAILY_LIMIT`；高一数学需**单独**配额设计 |

**结论**：项目**已有**可用的中文文本 AI 封装；**不支持**当前封装下的手写图片多模态输入。

---

## 2. 可复用服务

优先复用，不新装 SDK：

1. `DeepseekClientService` — 文本批改 JSON（扩展专用方法，如 `gradeHsMathApplication`）。  
2. `AiAccessService` — 是否允许该用户触发 AI。  
3. 私有读图：`readApplicationImageFile` + 属主校验（仅服务端；**不**把 URL 交给模型）。  
4. 判分入口：`gradeHsMathAnswer` 现将 application → `pending_ai`；APPLICATION-3 在 submit 之后异步/队列批改，**不**在同步判分里伪造分。

---

## 3. 模型要求对照

| 需求 | 当前 DeepSeek 文本路径 | 缺口 |
|---|---|---|
| 中文数学理解 | 可用（命题/批改类 prompt） | — |
| 文字输入 | 支持 | — |
| JPEG/PNG/WebP | 未接入 | 需多模态或 OCR 链路 |
| 手写公式识别 | 未接入 | 同上 |
| 多图 | 未接入 | 同上 |
| JSON 结构化 | 支持 | 须服务端核验 |
| 超时 / 重试 | 重试有；超时弱 | 批改须显式 timeout |
| 模型版本记录 | 方法返回 `model` 字符串 | 须落库 |

**推荐（在未授权新厂商/外发前）**：

- **文字-only 应用题**：继续使用现有 `DEEPSEEK_MODEL`（默认 `deepseek-chat`），不引入新付费服务。  
- **含图片**：在获得「图片像素外发」或「本地/已有多模态」单独授权前，标记 `review_required`，**禁止**假 0 分。  
- **不**在本预检中自行选定 OpenAI Vision / 其他付费多模态。

---

## 4. 批改数据结构（建议，兼容现有）

题目标准答案已有（`answer_payload_json`）：

```json
{
  "kind": "application",
  "standardAnswer": "...",
  "maxScore": 10,
  "rubric": [{ "key": "model", "title": "...", "maxScore": 3, "criteria": "..." }]
}
```

满分 = 该题 `maxScore`（**不得**假设恒为 10）。

AI 批改结果建议（存 `ai_grade_json` 或等价）：

```json
{
  "status": "graded",
  "totalScore": 8,
  "maxScore": 10,
  "rubricScores": [
    {
      "key": "model",
      "maxScore": 3,
      "score": 3,
      "feedback": "建模正确"
    }
  ],
  "recognizedWork": "…",
  "errors": [],
  "personalizedExplanation": "…",
  "confidence": 0.9,
  "model": "deepseek-chat",
  "gradedAt": "2026-10-25T00:00:00.000Z"
}
```

与会话项关系：

| 字段 | 用途 |
|---|---|
| `grade_result` | `pending_ai` → `grading` → `graded` / `review_required` / `grading_failed` |
| `grade_reason` | 短码：`awaiting_ai` / `ai_timeout` / `schema_invalid` 等 |
| `ai_grade_json`（拟增） | 完整结构化结果 |
| `ai_model` / `ai_graded_at` / `ai_attempt_count`（拟增） | 审计与幂等 |

前端：`MathGradeTag` 需认识新状态；部分分用分数展示，**不要**映射成「错误」。

---

## 5. 评分可靠性

| 规则 | 要求 |
|---|---|
| 分项边界 | `0 ≤ score ≤ rubric[i].maxScore`，整数优先 |
| 求和 | `totalScore === sum(rubricScores.score)` |
| 满分 | `maxScore` 与题目标准一致；`sum(rubric.maxScore) === maxScore`（入库前已有 rubric 校验可复用） |
| JSON | 缺字段 / 未知 key / 非数字 → 拒收 → `grading_failed` 或重试 |
| 识别失败 | 图片无法理解 → `review_required`，**非** wrong |
| 不确定 | `confidence` 低于阈值 → `review_required`（阈值实施时定） |
| 超时 / 模型失败 | `grading_failed` 或保持可重试；**禁止**记 0 分 |
| 幂等 | 同一 `session_item` 已 `graded` 且内容指纹未变 → 跳过或显式「强制重批」授权 |
| 会话已 completed | 允许异步回填 `grade_result` + 重算 `pending_count`；**不**改 `submitted_at` |

---

## 6. 结果与学情

状态流：

```
pending_ai → grading → graded
                 ↘ review_required
                 ↘ grading_failed
```

对会话计数建议：

| grade_result | correct | wrong | pending | accuracy 分母 |
|---|---|---|---|---|
| pending_ai / grading / review_required / grading_failed | 否 | 否 | 是 | 不计 |
| graded（部分分） | 否* | 否* | 否 | 不计* 或单独「得分率」指标 |
| correct / wrong（旧四题型） | 是 | 是 | 否 | 计 |

\*部分分**不得**简单并入 correct/wrong；可另增 `score_earned` / `score_possible` 展示，或仅在结果页显示分数。  
Analytics 现有 SQL 对 pending 多只认 `pending_review`，实施时须纳入 `pending_ai` 等，避免学情漏计。

---

## 7. 图片隐私

| 规则 | 说明 |
|---|---|
| 读取 | 仅服务端按属主读私有盘 buffer |
| 禁止 | JWT 图片 URL、storage_key、公开 `/uploads` 直链交给模型 |
| 外发 | **当前未授权**。若未来要把像素发给第三方（含 DeepSeek 若支持 vision）：须报告服务商、数据范围、是否落日志/训练、风险，**等待单独授权**后再开发 |
| 本预检策略 | 有 `imageIds` → 不自动外发；`review_required` |

---

## 8. 数据库需求（只设计，不执行）

最小必要（二选一，实施阶段定稿）：

**方案 A — 扩会话项列**（改动小）：

- `ai_grade_json` JSON NULL  
- `ai_model` VARCHAR(64) NULL  
- `ai_graded_at` DATETIME(3) NULL  
- `ai_attempt_count` INT UNSIGNED NOT NULL DEFAULT 0  

**方案 B — 批改记录表**（可审计多次重试）：

- `hs_math_train_session_item_ai_grades`（session_item_id、attempt、status、payload、model、error、created_at）  
- 会话项仍写最新 `grade_result` + 指向最新成功 attempt  

另：

- 扩展写入允许的 `grade_result` 枚举/校验（现 `HS_MATH_APPLICATION_GRADE_RESULTS_RESERVED`）。  
- **禁止** TypeORM `synchronize=true`。  
- 迁移文件可命名如 `db/migrate_hs_math_application3_ai_grade.sql`，**未经授权不得执行**。

---

## 9. 最小开发步骤（待授权后）

1. **授权范围确认**：是否允许文字-only 自动批改；图片是否允许外发 / 仅人工复核。  
2. 设计并评审迁移（不执行直至授权）。  
3. 扩展 `DeepseekClientService`：应用题 rubric 批改（纯文本）；显式 timeout。  
4. `HsMathApplicationGradeService`：组 prompt、调 AI、校验分数、写库、重算 session counts。  
5. 触发：submit 后异步（或管理端「批改」按钮）；幂等。  
6. 前端：结果页分数 + 个性化解析；新状态标签；**不**显示假「错误」。  
7. 自测：schema 校验、边界分、失败不写 0、幂等；无真实外发图片直至授权。

---

## 10. 待授权操作

1. 执行 APPLICATION-3 业务开发（代码）。  
2. 执行 AI 批改相关 DB 迁移。  
3. 在配置了 `DEEPSEEK_API_KEY` 的环境调用真实 AI（文字）。  
4. （若需要）**图片像素外发**多模态批改 — 单独隐私授权。  
5. 不进 CORE-1B / 4B / 未授权 approve。

---

## 11. 预检问答摘要

1. **是否已有 AI 服务？** 有 — DeepSeek 文本客户端。  
2. **是否支持多模态？** **否**（现封装）。  
3. **推荐模型？** 文字批改继续 `DEEPSEEK_MODEL`（默认 deepseek-chat）；多模态待授权后再选。  
4. **是否需要新依赖？** 文字路径：**否**。  
5. **是否需要迁移？** **是**（存批改 JSON/模型/时间）；只设计未执行。  
6. **结果如何持久化？** `grade_result` + 拟增 `ai_grade_json`（或批改表）。  
7. **部分得分？** rubric 分项校验后存 `totalScore`；不并入 correct/wrong。  
8. **学情如何更新？** pending 类不计 accuracy；graded 用独立得分展示；修 analytics 对 pending_ai 的统计。  
9. **AI 失败？** `grading_failed` / `review_required`；禁止 0 分冒充答错。  
10. **下一步最小任务？** 用户授权「文字-only APPLICATION-3 开发 + 迁移草案」后开工；图片路径先 `review_required`。

---

## 12. 阶段标记

| 项 | 状态 |
|---|---|
| APPLICATION-3 | **NOT_STARTED**（预检文档完成 ≠ 开工） |
| APPLICATION-2 API/DB | **PASS** |
| APPLICATION-2F | **PARTIAL**（UI_NOT_RUN） |
| APPLICATION-1 | **PARTIAL** |
| CORE-1A-4B | **BLOCKED** |

**本轮停止。**
