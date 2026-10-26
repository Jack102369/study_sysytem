# APPLICATION-3E-7 · DeepSeek 图片部分得分真实验收

> **日期**：2026-10-26  
> **状态**：**PARTIAL**  
> **授权**：CONFIRMED（用户明确「A–I 全部同意，Qwen≤2 / DeepSeek≤2，允许临时开关与 API:3000 重启及恢复」）  
> **前置**：3E-6 Prompt/门禁已合入源码与 dist；样张 `application3e6`

---

## 1. 授权依据

用户确认按 3E-7 计划执行；A–I 权限适用；预算不得扩大。  
不含：超预算、改正式题库、迁移、部署、历史批量重批、全用户 AI、CORE-1B、APPLICATION-4。

---

## 2. 执行前环境

| 项 | 结果 |
|---|---|
| item 151 | approved + formal · rubric **3/2/3/2=10** |
| Qwen URL/KEY · DeepSeek KEY | 存在（不披露） |
| `.env` Vision/AI 初态 | **false** |
| allowlist / budget 初态 | 空 |
| dist / stub | 含 3E-6；`application3e6-selftest` **17/17**；`nest build` PASS |
| 联调方式 | Nest ApplicationContext 临时 `process.env`；**未**写 ENABLED=true 入 `.env` |

禁止复用 51/55/56/107/108/110–120：**未改写**。

---

## 3. 测试会话（本轮新建）

| 场景 | sessionId | sessionItemId | imageIds | 样张 | kind |
|---|---|---|---|---|---|
| A | **122** | **345** | 48→49 | A_printed_partial_p1/p2 | PRINTED_SYNTHETIC |
| B | **123** | **346** | 50→51 | C_printed_partial_p1/p2 | PRINTED_SYNTHETIC |

`gradingProvider=deepseek`；正常 `submit` 自动批改（非手动 gradeOne）。

---

## 4. HTTP 预算实绩

| 模型 | 实际 / 上限 |
|---|---|
| Qwen | **2 / 2** |
| DeepSeek | **0 / 2** |

各 item `ai_attempt_count=1`；无重启清预算；无自动重试。  
原始：`_tmp_application3e7_live_raw.json`（`at=2026-10-26T02:15:32.856Z`）。

---

## 5. 场景结果（如实）

### 场景 A（清晰印刷部分正确双图）

| 项 | 结果 |
|---|---|
| grade_result | `review_required` |
| grade_reason | **`critical_recognition_warning`** |
| recognitionUncertain | **false** |
| confidence | 0.85 |
| x=50 保留 | **是**（`x50Check.ok=true`；未见改写为仅 x=40） |
| DeepSeek | **0** |
| totalScore | 无（未评分） |
| visionModel | qwen3.8-27b-orca-q8 |

转写摘要：建模与 `y=-30(x-50)^2+48000`、`x=50`、48000 可读；中文大量乱码；warnings 含「无法辨认具体语义」。  
门禁因 **critical warning**（warning 文含「无法辨认」）拦截 DeepSeek——符合 fail-closed；**部分分未演示**。

### 场景 B（清晰印刷双图，多图顺序）

| 项 | 结果 |
|---|---|
| grade_result | `review_required` |
| grade_reason | **`critical_recognition_warning`** |
| recognitionUncertain | **false** |
| confidence | 0.85 |
| x=50 保留 | **是** |
| DeepSeek | **0** |
| imageIds 顺序 | 50→51 保持 |

同因：中文乱码 → warnings「无法识别」→ critical 拦截。公式与错误步骤仍保留。

费用：**UNKNOWN**。

---

## 6. 关键能力判定

| 能力 | 判定 |
|---|---|
| 正常提交自动调度 | **PASS** |
| Qwen 保留错误 `x=50`（不改为 x=40） | **PASS**（A/B） |
| uncertain/关键 warning → 不调 DeepSeek | **PASS**（A/B scoringCallCount=0） |
| DeepSeek 真实部分分 `0<score<10` | **NOT_DEMONSTRATED** |
| rubric 校验部分分落库 | **NOT_DEMONSTRATED** |
| DeepSeek 收图片 | **未发生** |
| 重复外发 / 越权旧 session | **未发生** |
| application 不污染 correct/wrong/accuracy | **PASS**（accuracy null；pending=1） |
| 假 0 分 | **未写入** |

相对 3E-5 B：本轮 **uncertain=false** 且明确保留 x=50（Prompt 进步可见）；仍被 **critical_recognition_warning** 挡住（合成 PNG 中文 GDI 乱码 → 模型 warning 带「无法辨认」）。

---

## 7. 持久化与历史

- `gradingProvider=deepseek` 已写 user_answer。  
- `ai_grade_json` 含转写诊断（recognizedWork / warnings / confidence / visionCallCount=1 / scoringCallCount=0）。  
- `ai_graded_at` 空；无 DeepSeek 评分 JSON。  
- `getSession`：review_required / score null。  
- UI：**UI_NOT_RUN**

---

## 8. 环境恢复

| 项 | 结果 |
|---|---|
| `.env` Vision/AI | **false / false**（始终未写成 true） |
| TEST_USER / SESSION / BUDGET | **absent** |
| API 再重启 | 已执行 |
| health | **200** |
| 旧 session 51…120 | 未变 |
| 本轮 122/123 | 保留 |

---

## 9. 遗留问题

1. **真实部分得分闭环仍未跑通**（DeepSeek 0 次）。  
2. 合成中文 PNG 乱码导致 warning 含「无法辨认」→ critical 门禁；不宜为过测试放宽 fail-closed。  
3. 下一轮若再授权：需**更高质量样张**（避免 GDI 中文乱码，或纯公式大字少中文），预算另批；**不得**人为绕过 critical/uncertain。

---

## 10. 结论

**APPLICATION-3E-7 = PARTIAL**

已确认：自动双阶段调度、错误步骤 `x=50` 保留、关键 warning fail-closed、预算与 allowlist 有效、环境已恢复。  
未确认：DeepSeek 对部分正确图的真实部分分与 rubric 落库。

**停止。** 不得自动进入 APPLICATION-4。
