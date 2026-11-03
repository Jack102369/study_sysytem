# AI 识题 · AI 解题：逻辑与技术方案总结

> 独立模块「AI 识题」中与 **AI 解题（分析/解答）** 相关的完整说明。  
> 技术栈：前端 Vue3 + Vite + TS + Element Plus；后端 NestJS + TypeORM + MySQL8；业务数据按 `user_id` 隔离。  
> TypeORM `synchronize=false`，表结构以 `db/init.sql` 为准。

---

## 1. 模块边界与入口

| 层 | 位置 |
|---|---|
| 菜单 | `AppLayout`：`/ai-ocr`（需 AI 权限 `canUseAi`） |
| 路由 | `apps/web/src/router/index.ts` → `AiOcrHubView` |
| 前端页 | `apps/web/src/views/ai-ocr/AiOcrHubView.vue` |
| API 模块 | `apps/api/src/ai-ocr/*`（Controller / Service / Entity / DTO / helpers） |
| 识图复用 | `OcrClientService`（默认 Vision Qwen，可回退本机 OCR） |
| 解题模型 | Qwen 纯文本客户端 + DeepSeek `chatText` |

三大能力：

1. **识图 OCR**（上传题目图 → 文字）
2. **AI 解答**（本文重点）
3. **作答批改**（文字/作答图 → 评分与标准解析）

与错题本 / HsMath / Points **数据隔离**，不共享业务表。

---

## 2. 数据模型（解题相关）

### 2.1 `ai_ocr_recognitions`（识别）

- `user_id`、`subject`：`math|physics|chemistry`
- `attachment_id`：题目图片
- `status`：`pending|succeeded|failed`
- `recognized_text_raw`：OCR 原文（**不被用户修正覆盖**）
- `engine` / `model` / `prompt_version` / 错误信息

### 2.2 `ai_ocr_analyses`（解答，核心）

- `provider`：`qwen` | `deepseek`
- `status`：`pending|succeeded|failed`
- `input_text_snapshot`：实际送入解题模型的题干（可含用户修正）
- 结果字段：
  - `ai_answer_text`
  - `ai_analysis_text`
  - `knowledge_points_text`
  - `method_summary_text`
  - `self_check_text`（模型内自检摘要）
- 跨模型对比：
  - `compared_analysis_id`
  - `compare_verdict`：`agree|differ|uncertain`
  - `compare_note`
  - `revised_by_compare`：历史字段；**当前逻辑恒为 0**（对比不再改写答案）
- `prompt_version`：解答当前为 **`ai-ocr-parse-v9`**
- `model` / `error_code` / `error_message`

### 2.3 `ai_ocr_gradings`（批改，相邻能力）

- 题目快照 + 作答（文字 / 作答图 OCR）
- 空作答 → `verdict=no_answer`，分 0，仍给标准答案与解析
- 有作答 → `score` 0–100 + `correct|partial|wrong` + feedback + 标准答案/解析

所有业务查询/更新均带 `userId`，防越权。

---

## 3. 端到端流程

```
上传题目图
  → 隐私同意（consentAccepted）
  → OCR 识别（mode=smart）
  → 前端可编辑识别文字（原图仍可预览）
  → 选择 Qwen / DeepSeek 发起「AI 解答」
      → 落库 snapshot + 调模型（要求 JSON）
      → 解析 / 容错 / salvage → 成功落库
      → 若同题已有成功解答 → 对比（compare-v4），只标差异
  → 历史折叠展示：答案 / 解析 / 知识点 / 思路 / 自检 + 对比告警
（可选）作答批改：文字或作答图 → 评分与标准解析
```

门禁：OCR 能力 + AI 能力 + 隐私确认。

---

## 4. AI 解答核心逻辑（`createAnalysis`）

实现：`apps/api/src/ai-ocr/ai-ocr.service.ts` → `createAnalysis`。

### 4.1 步骤

1. **校验**  
   - `consentAccepted === true`  
   - `assertGates(userId)`  
   - 识别记录存在、属本用户、`status === succeeded`、识别文字非空  

2. **Snapshot**（`resolveInputSnapshot`）  
   - 优先用户传入的 `inputText`  
   - 否则用 `recognizedTextRaw`  
   - 上限 `AI_OCR_INPUT_TEXT_MAX_CHARS = 6000`  

3. **先插入 pending 行**  
   - 含 `prompt_version = ai-ocr-parse-v9`  
   - 对比相关字段置空，`revised_by_compare = 0`  

4. **组 Prompt**  
   - `buildParseSystemPrompt(学科中文名)`  
   - `buildParseUserPrompt(snapshot)`  

5. **`chatModel(provider)`**  
   - Qwen：Vision 同源网关的**纯文本** chat，`maxTokens` 默认约 2048（504/502 可降 token 重试）  
   - DeepSeek：`forceJson: true`，`temperature: 0.2`  

6. **解析响应** `parseModelAnalysisJson(content)`  
   - 失败且 Qwen `finish_reason === length` → `model_truncated`  
   - 否则尽量 **salvage**（答案字段已完整写出则保答案）  

7. **成功落库**  
   - answer / analysis / knowledgePoints / methodSummary / selfCheck  

8. **`maybeCompareWithPriorAnalysis`**  
   - 同 `recognition_id` + `userId` 找更早成功解答（**优先不同 provider**）  
   - 调对比 Prompt → 只写 `verdict` + `note`  
   - **绝不覆盖**当前或历史任一侧的答案/解析  
   - 对比失败不影响本次解答成功状态  

### 4.2 统一调模型封装

```text
chatModel(provider, system, user, maxTokens?)
  ├─ qwen     → AiOcrQwenTextClient.chatText（不传图）
  └─ deepseek → DeepseekClientService.chatText(forceJson: true)
```

---

## 5. Prompt 体系

| 版本常量 | 当前值 | 用途 |
|---|---|---|
| `AI_OCR_RECOG_PROMPT_VERSION` | `ai-ocr-recog-v1` | 识图（经 OCR 服务；smart 抽文字+公式） |
| `AI_OCR_PARSE_PROMPT_VERSION` | **`ai-ocr-parse-v9`** | 单次解题 + 模型内自检 |
| `AI_OCR_COMPARE_PROMPT_VERSION` | **`ai-ocr-compare-v4`** | 跨模型对比（等价判定，不改正文） |
| `AI_OCR_GRADE_PROMPT_VERSION` | `ai-ocr-grade-v2` | 作答批改 |

定义位置：`apps/api/src/ai-ocr/ai-ocr.constants.ts`  
Prompt 正文：`apps/api/src/ai-ocr/util/ai-ocr-helpers.ts`

### 5.1 识图（OCR smart，解题前置）

要求大致为：完整识别中英文与公式；公式用 `$...$`；保持换行与题号；**不要解题、不要改写**；只输出正文。

**现状缺口**：不强制输出「【图示】装置/连接关系」结构化描述。纯图信息（如弹簧串联 \(k_1{-}m{-}k_2{-}2m\)）若未进文字，后续解题等于看不见图。

### 5.2 解题 parse-v9

要求模型**只输出一个 JSON**：

```json
{
  "answer": "...",
  "analysis": "...",
  "knowledgePoints": "...",
  "methodSummary": "...",
  "selfCheck": "..."
}
```

约定要点：

- 流程（脑中完成，草稿不进 `analysis`）：① 逐问求解 → ② 用答案自检 → ③ 不通过则改正再输出  
- **自检（仅针对本模型自己的答案）**：  
  - 把 answer **代入**原题条件；或由答案 **反推**中间量/摩擦力/加速度是否自洽  
  - 多问则逐问检查  
- **明显矛盾红线**（命中须先改正再输出）：  
  - 条件已变更（翻面、μ 互换、更换接触面等）不得照搬变更前结论  
  - 若答案隐含相对静止/整体匀速，须核最大静摩擦（或等价上限）是否 ≥ 所需力  
- 篇幅压缩（防 Qwen 截断）：`analysis≤200` 字等；禁止「不对/重新」类草稿进 analysis  
- JSON 内换行写成 `\n`；LaTeX 反斜杠写成 `\\`

### 5.3 对比 compare-v4

输出：

```json
{"verdict":"agree|differ|uncertain","note":"..."}
```

约定要点：

- **禁止改写**任何一方答案  
- 判定前先做**代数/物理等价**：可用其它小问结果互代化简（如用 (2) 的 \(\mu_1\) 化简 (1)）  
- 允许 \(\ge/\geq\)、分数写法、因子顺序、纯文本与 LaTeX 差异  
- `agree`：实质一致（含等价）；`differ`：化简后仍矛盾；`uncertain`：题干不足  
- `note`：按小问写；仅写法不同写「(k)等价：…」；不要写「应改成谁的答案」

---

## 6. Qwen vs DeepSeek（解题通道）

| 项 | Qwen | DeepSeek |
|---|---|---|
| 配置 | `OCR_VISION_*` / `HS_MATH_VISION_*` | `DEEPSEEK_*` |
| 解题通道 | 与 Vision 同源 URL，**解答不传图** | DeepSeek Chat Completions 文本 |
| JSON 约束 | 主要靠 Prompt | `response_format: json_object`（`forceJson`） |
| max_tokens | 解答约 2048；网关 504 可降到 1024 重试 | 默认约 4096（客户端封装） |
| finish_reason | 有，可用于判截断 | 当前封装常返回 `null` |
| 实践表现 | 易 504/截断/明显物理错误 | 相对更稳；偶发细节错误 |

**建议**：重要题优先 DeepSeek；Qwen 适合作为第二意见，结合对比看差异。

---

## 7. JSON 解析与容错（解题结果落地）

实现：`parseModelAnalysisJson` 等，位于 `ai-ocr-helpers.ts`。

目标：模型输出不完美时尽量抽出可用结果，减少「格式无效」。

1. **去噪声** `stripModelNoise`：BOM、`<think>` / 思考标签、Markdown 代码围栏  
2. **定位 JSON 对象**：优先含 `"answer"` 的平衡 `{...}` 切片  
3. **多次尝试 `JSON.parse`**：  
   原文 → 去尾逗号 → 修反斜杠 → 修字符串内裸换行 → 组合修补  
4. **反斜杠修复** `repairJsonBackslashes`：  
   裸 `\frac` 等抬成合法转义；避免 `\f`/`\b` 被 JSON 当成控制字符  
5. **字段宽松**：  
   - `answer` / `analysis` 必填（可为字符串或字符串数组拼接）  
   - `knowledgePoints` / `methodSummary` / `selfCheck` 可选  
6. **截断抢救 salvage**：  
   - `"answer"` 已闭合写出 → 仍可成功  
   - `analysis` 未闭合 → 保留已有内容并标记截断  
7. **失败落库**：  
   - `error_code`：`parse_*` / `model_truncated` / `model_unavailable` 等  
   - `error_message` 可带压缩原文预览（便于排查）

对比结果：`parseModelCompareJson`（`verdict` + `note`）。

---

## 8. 前端展示方案

### 8.1 页面结构

`AiOcrHubView.vue`：Tabs ≈ 识别与题干 / 解答历史 / 作答批改。

### 8.2 解答历史

- 每条：provider 标签、成功/失败、id、时间、模型名  
- 成功时折叠区块：  
  - 答案  
  - 解析  
  - 本题考查的知识点  
  - 解题思路总结  
  - **自检**（`selfCheckText`）  
- 有 `compareVerdict` 时顶部 `el-alert`：  
  - agree / differ / uncertain 不同样式  
  - 展示 `compareNote`  
  - 文案强调：**对比只标异同，不改写本条答案**  
- 公式渲染：`MathStem` → `renderMathHtml`  
  - 支持 `$...$` / `$$...$$`  
  - `wrapBareLatexSegments`：裸 `\mu`、`\frac`、`\in` 等自动包 `$`（已修 `\mu_2` 因 `_` 与 `\b` 冲突导致反斜杠落在公式外的问题）  
- 识别区：可编辑文字、原图、加载/空态/错误提示；长文滚动  

### 8.3 API 类型

`apps/web/src/api/ai-ocr.ts`：  
`AiOcrAnalysis` 含 `selfCheckText`、`compareVerdict`、`compareNote`、`revisedByCompare` 等。

---

## 9. 作答批改（与解题并列）

- 输入：题目快照 + 作答文字和/或作答图 OCR  
- **空作答**：0 分 + `no_answer` + 标准答案与解析  
- **有作答**：评分与点评 + 标准答案/解析  
- 同样经 `chatModel` + JSON 解析；版本 `ai-ocr-grade-v2`  

---

## 10. 架构示意（解题）

```
[题目图]
   │
   │  Vision OCR (smart) —— 抽文字/公式，默认不结构化描述图示
   ▼
recognized_text_raw
   │
   │  用户可编辑
   ▼
input_text_snapshot
   │
   ├──────────────► Qwen 文本 JSON ──┐
   │                                 │
   └──────────────► DeepSeek JSON ───┼──► parseModelAnalysisJson
                                     │         │
                                     │         ▼
                                     │   answer / analysis / kp /
                                     │   method / selfCheck 落库
                                     │         │
                                     │         ▼
                                     │   同题已有成功解答？
                                     │         │
                                     │    否 ──► 返回前端
                                     │         │
                                     │        是
                                     │         ▼
                                     │   compare-v4
                                     │   （只写 verdict/note，
                                     │    不改写任何一方答案）
```

**关键结论**：识图阶段看图；解题阶段默认只看文字快照。图中结构若未进入文字，解题模型无法可靠使用图信息。

---

## 11. 已知限制与产品取舍

| 点 | 现状 |
|---|---|
| 图示 | OCR 不强制「【图示】连接关系」；弹簧/受力图易丢结构信息 |
| 解题无图 | Qwen/DeepSeek 解答通道为纯文本，不传原图 |
| Qwen | 易 504、输出截断、明显物理错误；自检靠 Prompt，不保证拦住 |
| 对比 | 可识别部分等价变形，仍可能误判；**永不改写**任一侧答案 |
| `revised_by_compare` | 列保留；自动修订流程已移除，新记录为 0 |
| 正确率 | Prompt + 自检只提高概率，**不能当标准答案**；需人工核对 |

### 可选演进（尚未实现）

1. 识别 Prompt 强制输出结构化「【图示】」描述（低成本，DeepSeek/Qwen 解答均受益）  
2. 解答阶段多模态继续带原图（更准，更慢更贵；DeepSeek 文本通道需另议）  
3. 产品默认推荐 DeepSeek  
4. 对比 note 分问表格化展示  

---

## 12. 关键文件清单

### 后端

- `apps/api/src/ai-ocr/ai-ocr.module.ts`
- `apps/api/src/ai-ocr/ai-ocr.controller.ts`
- `apps/api/src/ai-ocr/ai-ocr.service.ts`
- `apps/api/src/ai-ocr/ai-ocr.constants.ts`
- `apps/api/src/ai-ocr/ai-ocr-qwen-text.client.ts`
- `apps/api/src/ai-ocr/util/ai-ocr-helpers.ts`
- `apps/api/src/ai-ocr/util/ai-ocr-vision-url.ts`
- `apps/api/src/ai-ocr/entities/ai-ocr-recognition.entity.ts`
- `apps/api/src/ai-ocr/entities/ai-ocr-analysis.entity.ts`
- `apps/api/src/ai-ocr/entities/ai-ocr-grading.entity.ts`
- `apps/api/src/ai-ocr/dto/ai-ocr.dto.ts`
- `apps/api/src/ai-reference/ocr-client.service.ts`
- `apps/api/src/ai-reference/deepseek-client.service.ts`

### 前端

- `apps/web/src/views/ai-ocr/AiOcrHubView.vue`
- `apps/web/src/api/ai-ocr.ts`
- `apps/web/src/utils/render-math.ts`
- `apps/web/src/components/hs-math/MathStem.vue`
- `apps/web/src/router/index.ts`
- `apps/web/src/layouts/AppLayout.vue`

### 数据库

- `db/init.sql`（`ai_ocr_recognitions` / `ai_ocr_analyses` / `ai_ocr_gradings`）
- `db/migrate_ai_ocr.sql`
- `db/migrate_ai_ocr_gradings.sql`
- `db/migrate_ai_ocr_analysis_insight.sql`
- `db/migrate_ai_ocr_analysis_compare.sql`
- `db/migrate_ai_ocr_analysis_selfcheck_revise.sql`

---

## 13. 一句话归纳

**AI 解题** = 用户确认后的题干文字快照 → 单模型 JSON 解答（含代入/反推自检，parse-v9）→ 同题跨模型只对比不改正文（compare-v4）→ 前端 KaTeX（含裸 LaTeX 包裹）展示。

识图与解题解耦：图必须先变成文字（或将来解答带图多模态），解题才可靠；模型输出不能替代人工核对。
