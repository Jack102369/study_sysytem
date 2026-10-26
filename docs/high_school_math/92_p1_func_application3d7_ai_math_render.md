# APPLICATION-3D-7 · AI 批改反馈数学公式渲染

> **日期**：2026-10-25  
> **状态**：**PASS**（代码 + 自测 + Web build；**UI_NOT_RUN**）  
> **调用 AI**：否  
> **修改数据库**：否

---

## 1. 问题原因

训练结果页 [`HsMathTrainResultView.vue`](../../apps/web/src/views/hs-math/HsMathTrainResultView.vue) 中：

| 字段 | 修复前 |
|---|---|
| 题干 / 标准答案 / 解析 | 已用 `MathStem` |
| `personalizedExplanation` | 已用 `MathStem` |
| `rubricScores[].feedback` | `{{ }}` 纯文本 → 露出 `$...$` |
| `errors` / `recognitionWarnings` | `{{ }}` 纯文本 |
| `recognizedWork` | 未展示 |

session **107** / item **330** 的 rubric feedback 含 `$y=2400x-30x^2$` 等，故页面显示原始 LaTeX。

---

## 2. 修改文件

| 文件 | 说明 |
|---|---|
| `apps/web/src/views/hs-math/HsMathTrainResultView.vue` | feedback / errors / warnings / recognizedWork → `MathStem` |
| `apps/web/src/components/hs-math/MathStem.vue` | 新增可选 `inline`（`span`）便于行内 rubric |
| `apps/web/scripts/hs-math-application3d7-math-render.selftest.mjs` | 公式 + XSS 自测 |
| `apps/web/package.json` | 脚本 `hs-math:application3d7-selftest` |
| 本文 + `PROJECT_HANDOFF.md` | 文档 |

**未改**：后端评分、DB、题库、`render-math.ts` 核心算法、未装新依赖、未调 Qwen。

---

## 3. 复用组件

- `MathStem.vue` → `renderMathHtml`（[`apps/web/src/utils/render-math.ts`](../../apps/web/src/utils/render-math.ts)）
- 依赖：**已有** `katex`（未新增）

---

## 4. 字段覆盖

| 字段 | 渲染 |
|---|---|
| `rubricScores[].feedback` | `MathStem` + `inline` |
| `personalizedExplanation` | `MathStem`（保持） |
| `errors` | `MathStem` |
| `recognitionWarnings` | `MathStem` |
| `recognizedWork` | 有值时新增「识别过程」+ `MathStem` |

---

## 5. 安全措施

1. 非公式段：`& < > "` HTML 转义。  
2. 公式段：仅经 KaTeX `renderToString`（`throwOnError: false`）。  
3. 禁止把 AI 原文未经转义塞进 `v-html`（仅经 `renderMathHtml`）。  
4. 不执行 AI 返回的 HTML/JS；恶意 `<script>` / `<img onerror>` 被转义。  
5. 不修改 `ai_grade_json` 原始库记录。

---

## 6. 测试

```bash
pnpm --filter web run hs-math:application3d7-selftest
# PASS 14 tests
```

覆盖：普通中文、中文+行内、块级、分数、根号、集合、上下标、不等式、多行、非法 LaTeX、恶意 HTML、XSS、session107 样例 feedback、空串。

手机端：未实机；`MathStem` 已有 `overflow-x: auto` / `word-break`。

---

## 7. Web build

```bash
pnpm --filter web build
```

**成功**（`vue-tsc --noEmit && vite build`）。

---

## 8. UI

**UI_NOT_RUN**（Cursor 未打开浏览器点验 session 107）。  
请本地刷新：`/hs-math/.../result` 对应 session **107**，确认公式不再显示 `$...$` 原文。

---

## 9. 阶段

**APPLICATION-3D-7 = PASS**（代码验收；UI 待人工）  
**APPLICATION-3D = PARTIAL** · **APPLICATION-3 = PARTIAL** · **APPLICATION-3C = PASS**  
**CORE-1A-4B = BLOCKED** · **CORE-1B = NOT_STARTED**

---

## 10. 剩余问题

1. 人工刷新 107 结果页确认观感。  
2. 3D-6 仍缺部分正确/错误样本覆盖（与本轮无关）。
