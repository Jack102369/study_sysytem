# P1-FUNC · APPLICATION-3C 真实 DeepSeek 文字批改联调

> **执行时间**：2026-10-25  
> **状态**：**PASS**  
> **APPLICATION-3 整体**：仍 **PARTIAL**（图片多模态未做）  
> **原始结果 JSON**：`docs/high_school_math/_tmp_application3c_live_raw.json`（含评分细节；无 API Key）

---

## 1. 用户授权原文

> 授权 APPLICATION-3C：允许重启本地 API（3000），并允许使用虚构 A/B/C 文字答案调用真实 DeepSeek deepseek-chat，最多 3 次 HTTP 请求。

---

## 2. API 重启结果

| 项 | 值 |
|---|---|
| 重启前 PID | 16828（`node dist/main.js` :3000） |
| 操作 | build → kill 16828 → `node dist/main.js`（cwd=`apps/api`） |
| 重启后 | LISTENING PID **5456**；`/health` **200**；`db:ok` |
| AI 开关 | `.env` 写入并保持 `HS_MATH_AI_GRADING_ENABLED=false` |
| 其它服务 | 未重启 |

联调脚本使用独立 Nest `ApplicationContext`，**未**打开全局外发；submit 异步 schedule 仅产生 `ai_disabled`（计入日志，**不计** DeepSeek HTTP）。

---

## 3. 真实 HTTP 请求次数

**3 / 3**（A、B、C 各 1 次；无重试补发）。

| # | 样本 | 延迟 | 结果 |
|---|---|---|---|
| 1 | A | 2221 ms | ok |
| 2 | B | 3210 ms | ok |
| 3 | C | 3213 ms | ok |

`gradeHsMathApplicationText` 为单次 `chat`（无二次重试）。预算计数器在 invoker 内，达 3 即停。

---

## 4. 模型

`deepseek-chat`（与 `DEEPSEEK_MODEL` 一致；落库 `ai_model=deepseek-chat`）。

---

## 5. A/B/C 答案摘要（虚构）

| 样本 | 摘要 |
|---|---|
| A | 正确：`y=x(2400-30x)`、定义域 `{30…60}`、配方至 `(x-40)`、票价 40 / 收入 48000 |
| B | 建模+定义域正确；对称轴误为 30；错误结论 30 元 / 45000 |
| C | 误把收入当人数 `y=2400-30x`；定义域与结论均错 |

正式题：item **151** / `HSMA-RJA-CH03-APP-0001`；新建 session **104/105/106**；未改 51/55/56。

---

## 6–7. Rubric 分数与总分

| 样本 | model | domain | solve | conclusion | **总分** |
|---|---|---|---|---|---|
| A | 3/3 | 2/2 | 3/3 | 2/2 | **10/10** |
| B | 3/3 | 2/2 | 1/3 | 1/2 | **7/10** |
| C | 0/3 | 0/2 | 0/3 | 0/2 | **0/10** |

---

## 8. 数学批改质量

| 样本 | 判断 |
|---|---|
| A | 识别完整正确过程，给满分，合理 |
| B | **保留**建模 3 + 定义域 2；扣求解/结论；错误定位指出对称轴应为 40 —— **符合过程分预期** |
| C | 识别「收入≠人数」概念错误，合法 0 分，解析到位 |

未篡改模型输出。

---

## 9. JSON / 服务端校验

三项均：`graded`；四 key 齐全；整数分；分项和=totalScore；maxScore=10；有 feedback / personalizedExplanation；confidence 经服务端校验入库。

---

## 10. 数据库持久化

| session_item | grade_result | ai_model | attempt | total |
|---|---|---|---|---|
| 327 | graded | deepseek-chat | 1 | 10 |
| 328 | graded | deepseek-chat | 1 | 7 |
| 329 | graded | deepseek-chat | 1 | 0 |

`ai_grade_json` / `ai_graded_at` 已写入。

---

## 11. 历史 / 结果 API

`train.getSession` 返回 `aiGrade.totalScore` 分别为 10 / 7 / 0。  
session 51/55/56 仍为 completed。

---

## 12. 学情统计

三场应用题会话：`correct=0, wrong=0, pending=0, accuracy=null`（graded 不计 correct/wrong/分母）。

---

## 13. Token 用量

| 样本 | prompt | completion | total |
|---|---|---|---|
| A | 902 | 336 | 1238 |
| B | 879 | 495 | 1374 |
| C | 805 | 530 | 1335 |
| **合计** | | | **3947** |

---

## 14. 费用

**UNKNOWN**（本轮未查询账单；不编造）。

---

## 15. 异常与风险

- submit 后 schedule 因开关关闭写 `ai_disabled`（预期；已 reset 后正式批改）。  
- 全局开关保持 **false**；若误开 true，HTTP submit 会外发 —— 生产需保持关闭直至产品授权。  
- 图片多模态仍未做 → APPLICATION-3 整体 PARTIAL。  
- 原始 JSON 曾写入 `apps/docs/...`（脚本相对路径）；已复制到 `docs/high_school_math/`。

---

## 16. UI 状态

**UI_NOT_RUN**（未做真实浏览器点验；未装 Playwright）。

---

## 17. 下一步

1. 可选：人工 UI 点验结果页分项展示。  
2. 图片多模态 / 外发须**单独授权**（APPLICATION-3 后续）。  
3. 不进 CORE-1B；保持 2F PARTIAL、1A-4B BLOCKED。  
4. 保持 `HS_MATH_AI_GRADING_ENABLED=false`。

---

## 变更日志

| 时间 | 说明 |
|---|---|
| 2026-10-25 | 只读准备 BLOCKED |
| 2026-10-25 | **真实联调 PASS**：HTTP×3；A10/B7/C0；库与 API 验证通过 |
