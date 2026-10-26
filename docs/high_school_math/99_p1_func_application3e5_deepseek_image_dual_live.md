# APPLICATION-3E-5 · DeepSeek 图片双阶段真实闭环

> **日期**：2026-10-26  
> **状态**：**PARTIAL**  
> **授权**：CONFIRMED（用户明确「A–I 全部同意，Qwen≤3 / DeepSeek≤2，允许临时开关与 API:3000 重启及恢复」）  
> **前置**：3E-4 转写可靠性（离线）已合入 dist；禁止复用 3E-3 session 110–117

---

## 1. 授权依据

用户消息明确授权 APPLICATION-3E-5：A–I 全部同意；预算 Qwen≤3、DeepSeek≤2；允许新建会话、虚构样张、临时 Vision/AI 开关、user_id=2 + session allowlist、重建/重启 API:3000、验收后恢复。

不含：迁移、改正式题库、全用户开放 AI、历史批量重批、CORE-1B、其他学科、超预算、造假结果。

---

## 2. 执行前环境

| 项 | 结果 |
|---|---|
| Qwen / DeepSeek 密钥 | 存在（不披露） |
| DB | `study_system` |
| item | approved formal 应用题 · rubric 3+2+3+2=10 |
| `.env` 开关初态 | Vision/AI = **false** |
| allowlist / budget 初态 | 空 |
| dist | 含 3E-4 `evaluateTranscribeForDeepSeek` / `commitTranscribeReviewRequired` |

联调脚本在 Nest ApplicationContext 内临时 `process.env` 开启开关与预算；**未**把 ENABLED=true 写入 `.env`。

---

## 3. 测试会话（全部新建）

| 场景 | sessionId | sessionItemId | imageIds | gradingProvider |
|---|---|---|---|---|
| A 正确双图 | 119 | 342 | 43,44 | deepseek |
| B 部分正确双图 | 120 | 343 | 45,46 | deepseek |
| C 模糊单图 | 121 | 344 | 47 | deepseek |

禁止复用的 51/55/56/107/108/110–117：**未改写**（只读确认仍 completed）。

样张：`apps/api/src/hs-math/integration/fixtures/application3e5/`（`_gen-3e5-png.ps1` 生成）。

---

## 4. HTTP 预算实绩

| 模型 | 实际 / 上限 |
|---|---|
| Qwen | **3 / 3** |
| DeepSeek | **1 / 2** |

各 item `ai_attempt_count=1`；无重启重置预算后超额。  
原始记录：`docs/high_school_math/_tmp_application3e5_live_raw.json`（`at=2026-10-26T00:53:40.492Z`）。

---

## 5. 场景结果（如实）

| 场景 | 状态 | Qwen | DS | 结果 | 总分 | 说明 |
|---|---|---|---|---|---|---|
| **A** 正确双图 | RAN | 1 | **1** | **graded** / ai_graded | **10/10** | pipeline=`qwen_then_deepseek`；rubric 3+2+3+2；`ai_model=deepseek-chat`；vision=`qwen3.8-27b-orca-q8`；中文有乱码警告但公式可辨，`recognitionUncertain` 未拦 → DeepSeek 评分成功 |
| **B** 部分正确 | RAN | 1 | **0** | `review_required` / uncertain_recognition | — | 转写标记 uncertain（中文乱码+推断还原）；**正确拦截 DeepSeek**；部分分路径**未演示** |
| **C** 模糊图 | RAN | 1 | **0** | `review_required` / uncertain_recognition | — | 「无法辨认」；**未调 DeepSeek**；符合 fail-closed |

费用：**UNKNOWN**（未统一汇总账单）。

---

## 6. 关键能力判定

| 能力 | 判定 |
|---|---|
| 提交后自动调度（非手动 gradeOne） | **PASS** |
| 双阶段「转写成功 → DeepSeek 评分」完整成功 | **PASS**（A：10/10） |
| 模糊 / 不确定 → 不调 DeepSeek | **PASS**（B/C） |
| 部分正确图 → DeepSeek 部分分 | **NOT_DEMONSTRATED**（B 停在转写门禁） |
| application 不计 correct/wrong/accuracy | **PASS**（A 的 accuracy null） |
| 图片字节发给 DeepSeek | **未发生**（仅文本转写） |
| 越权扫旧 session | **未发生** |
| 相对 3E-3 | **进步**：3E-3 双图全停在 uncertain；本轮 A 首次跑通双阶段满分 |

合成 PNG 中文 GDI 编码仍易触发 uncertain；A 因关键公式清晰且模型未置 `recognitionUncertain=true` 而放行——**不得**把 B 记成假 PASS。

---

## 7. 持久化与历史

- A：`grade_result=graded`，`ai_model=deepseek-chat`，`ai_grade_json.pipeline=qwen_then_deepseek`，`totalScore=10`，`scoringCallCount=1`，`ai_graded_at` 有值。  
- B/C：`review_required` / `uncertain_recognition`，无假 0 分、无 DeepSeek 评分 JSON。  
- `getSession`：A=`graded`/10；B/C=`review_required`。  
- UI：**UI_NOT_RUN**

---

## 8. 环境恢复

| 项 | 结果 |
|---|---|
| `.env` Vision/AI ENABLED | **false**（始终未写成 true） |
| TEST_USER / SESSION / BUDGET | **absent** |
| API 再重启 | 已执行 |
| health | **200** |
| 旧 session | 未变 |
| Vision/AI 开关恢复 | **false / false** |

---

## 9. 结论

**PARTIAL**

已证明：DeepSeek 图片路径在自动提交下可走通「Qwen 转写 → DeepSeek 文本评分」并得到满分（场景 A）。模糊与转写不确定仍 fail-closed、不消耗 DeepSeek（B/C）。部分正确满分/部分分闭环仍未在 live 演示。

**下一步（需新授权）**：APPLICATION-4 或后续质量迭代（样张/转写门禁调优）；**不得**擅自开 CORE-1B / 全用户 Vision。

脚本：`pnpm --filter api run hs-math:application3e5-dual-live`
