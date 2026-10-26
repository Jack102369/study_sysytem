# APPLICATION-3E-9 · 结构化警告与 DeepSeek 图片部分得分真实验收

> **日期**：2026-10-26  
> **状态**：**PASS**  
> **授权**：CONFIRMED（A–I；Qwen≤2 / DeepSeek≤2；临时开关与 API:3000 重启/恢复）  
> **前置**：3E-8 结构化 warning 门禁已合入；样张 `application3e9`（公式为主 ASCII）

---

## 1. 授权依据

用户确认按 3E-9 执行；不增加权限或预算。  
不含：超预算、改正式题库、迁移、部署、全用户 AI、历史批量重批、CORE-1B、APPLICATION-4。

---

## 2. 执行前环境

| 项 | 结果 |
|---|---|
| item 151 | approved + formal · rubric **3/2/3/2=10** |
| Qwen / DeepSeek KEY | 存在（不披露） |
| `.env` Vision/AI 初态 | **false** |
| allowlist / budget 初态 | 空 |
| dist | 含 3E-8；`application3e8-selftest` 28/28；`nest build` PASS |
| 联调 | Nest ApplicationContext 临时 `process.env`；**未**写 ENABLED=true 入 `.env` |

禁止复用 51…123：**未改写**。

---

## 3. 测试会话（本轮新建）

| 场景 | sessionId | sessionItemId | imageIds | 样张 | kind |
|---|---|---|---|---|---|
| A 单图部分正确 | **124** | **347** | 52 | A_partial_single.png | PRINTED_SYNTHETIC |
| B 双图部分正确 | **125** | **348** | 53→54 | B_partial_p1/p2.png | PRINTED_SYNTHETIC |

`gradingProvider=deepseek`；正常 `submit` 自动批改。

---

## 4. HTTP 预算实绩

| 模型 | 实际 / 上限 |
|---|---|
| Qwen | **2 / 2** |
| DeepSeek | **2 / 2** |

各 item `ai_attempt_count=1`；无重启清预算；无自动重试。  
原始：`_tmp_application3e9_live_raw.json`（`at=2026-10-26T02:41:19.165Z`）。

---

## 5. 场景结果

### 场景 A

| 项 | 结果 |
|---|---|
| grade_result | **graded** / ai_graded |
| totalScore | **7 / 10**（0&lt;score&lt;10） |
| rubric | model **3** · domain **2** · solve **1** · conclusion **1** |
| x=50 | **保留**（`y=-30(x-50)^2+48000`；未改成仅 x=40） |
| warning 格式 | **object[]**（结构化生效） |
| warning 样例 | `auxiliary_text` / `minor` / `affectsScoring=false` / pageIndex=1 |
| confidence | 0.98 |
| pipeline | `qwen_then_deepseek` |
| vision / scoring | qwen3.8-27b-orca-q8 / **deepseek-chat** |
| 调用 | Qwen 1 · DeepSeek 1 |
| 解析 | 指出配方对称轴错误（应为 x=40） |
| getSession | graded / 7 |
| accuracy | **null**（correct=0 wrong=0） |

### 场景 B

| 项 | 结果 |
|---|---|
| grade_result | **graded** / ai_graded |
| totalScore | **7 / 10** |
| rubric | 3+2+1+1 |
| x=50 | **保留**；双图顺序 53→54 |
| warning 格式 | **empty**（无非关键 warning；亦通过门禁） |
| confidence | 1 |
| 调用 | Qwen 1 · DeepSeek 1 |
| getSession | graded / 7 |

费用：**UNKNOWN**。

---

## 6. 关键能力判定

| 能力 | 判定 |
|---|---|
| 自动 submit 双阶段 | **PASS** |
| 结构化 warning 真实生效（场景 A） | **PASS** |
| x=50 不被纠成 x=40 | **PASS** |
| DeepSeek 真实部分分 + rubric | **PASS** |
| DeepSeek 仅收文字（无图） | **PASS**（pipeline 文本评分） |
| 多图顺序 | **PASS**（B） |
| DB + getSession 持久化 | **PASS** |
| 不污染 correct/wrong/accuracy | **PASS** |
| 无重复外发 / 无越权旧 session | **PASS** |
| 无假 0 分 | **PASS** |

---

## 7. 环境恢复

| 项 | 结果 |
|---|---|
| Vision/AI `.env` | **false / false** |
| allowlist / budget | **absent** |
| API 重启 | 已执行 |
| health | **200** |
| 旧 session 51…123 | 未变 |
| 本轮 124/125 | 保留 |

UI：**UI_NOT_RUN**

---

## 8. 遗留问题

- 场景 B 未再输出结构化 warning（empty 亦合法）；结构化路径以场景 A 证明。  
- 合成 ASCII 样张成功；真实手写中文场景仍需后续专项（另授权）。  
- 费用未汇总。

---

## 9. 结论

**APPLICATION-3E-9 = PASS**

DeepSeek 图片部分得分闭环在自动提交下真实跑通（7/10×2）；结构化 auxiliary warning 可放行；错误 `x=50` 保留；环境已恢复。

**停止。** 不得自动进入 APPLICATION-4 / CORE-1B。
