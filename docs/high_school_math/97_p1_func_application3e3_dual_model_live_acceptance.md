# APPLICATION-3E-3 · 双模型真实批改验收

> **日期**：2026-10-25  
> **状态**：**PARTIAL**  
> **授权**：CONFIRMED（用户明确「A–H 全部同意，Qwen≤7 / DeepSeek≤5，允许 API:3000 重启及恢复」）  
> **不得沿用** 3D-9 session 108 授权

---

## 1. 授权依据

用户消息明确授权 APPLICATION-3E-3：A–H 全部同意，预算 Qwen≤7、DeepSeek≤5，允许本地 API:3000 重启及验收后恢复。

不含：迁移、改正式题库、全用户开放、部署、历史批量重批、CORE-1B。

---

## 2. 执行前环境

| 项 | 结果 |
|---|---|
| Qwen URL/KEY | 存在（不披露） |
| DeepSeek KEY | 存在（不披露） |
| DB | `study_system` |
| item 151 | approved + formal · rubric 3+2+3+2=10 |
| `.env` 开关初态 | Vision/AI = **false** |
| allowlist / budget 初态 | 空 |
| 本轮安全补强 | DeepSeek `HS_MATH_AI_GRADING_LIVE_HTTP_BUDGET` + 文字 allowlist（复用 TEST_USER/SESSION） |

联调在 Nest ApplicationContext 内临时 `process.env` 开启开关；**未**把 ENABLED=true 写入 `.env`（HTTP API:3000 全程保持 false）。

---

## 3. 测试会话（全部新建）

| 场景 | sessionId | sessionItemId | imageIds | gradingProvider |
|---|---|---|---|---|
| B | 110 | 333 | 31,32 | deepseek |
| E | 111 | 334 | 33 | deepseek |
| C | 112 | 335 | 34,35 | deepseek |
| F | 113 | 336 | 36 | deepseek |
| G | 114 | 337 | — | deepseek |
| H | 115 | 338 | 37 | qwen |
| A | 116 | 339 | 38,39 | qwen |
| D | 117 | 340 | 40 | deepseek |

禁止复用的 51/55/56/107/108：**未改写**（只读确认仍 completed）。

---

## 4. HTTP 预算实绩

| 模型 | 实际 / 上限 |
|---|---|
| Qwen | **7 / 7** |
| DeepSeek | **1 / 5** |

无重复计费：各 item `ai_attempt_count=1`。  
未通过重启重置预算后超额。

---

## 5. 场景结果（如实）

| 场景 | 状态 | Qwen | DS | 结果 | 总分 | 说明 |
|---|---|---|---|---|---|---|
| **B** DeepSeek+正确双图 | RAN | 1 | **0** | `review_required` / uncertain_recognition | — | 转写不确定，**正确拦截 DeepSeek**；双阶段满分路径**未跑通** |
| **E** 模糊图 | RAN | 1 | **0** | `grading_failed` / transcribe_parse_fail | — | **未调 DeepSeek**；期望更理想为 review_required，记质量/解析差异 |
| **C** 部分正确图 | RAN | 1 | **0** | `review_required` / uncertain | — | 同 B，未进入 DeepSeek 部分分 |
| **F** 文图混合 | RAN | 1 | **0** | `review_required` / uncertain | — | 同 B |
| **G** DeepSeek 纯文字 | RAN | 0 | 1 | **graded** | **10/10** | rubric 3+2+3+2；模型 deepseek-chat；**PASS** |
| **H** 千问部分正确 | RAN | 1 | 0 | **graded** | **6/10** | 分项 3+1+1+1；qwen3.8-27b-orca-q8；**PASS** |
| **A** 千问正确双图 | RAN | 1 | 0 | **graded** | **10/10** | rubric 满分；**PASS** |
| **D** 明显错误图 | RAN | 1 | **0** | `review_required` / uncertain | — | 未进入 DeepSeek 低分路径 |

费用：**UNKNOWN**（未返回可汇总账单；有 usage 字段时未统一汇总）。

---

## 6. 关键能力判定

| 能力 | 判定 |
|---|---|
| 提交后自动调度（非手动 gradeOne） | **PASS** |
| DeepSeek 纯文字 | **PASS**（G） |
| 千问 Vision 直接评分（正确/部分） | **PASS**（A/H） |
| 转写不确定 / 解析失败 → 不调 DeepSeek | **PASS**（B/C/F/D/E） |
| 双阶段「转写成功 → DeepSeek 评分」完整成功 | **NOT_DEMONSTRATED**（合成 PNG 转写阶段持续 uncertain） |
| 文图合并后 DeepSeek 评分 | **NOT_DEMONSTRATED**（F 停在转写门禁） |
| application 不计 correct/wrong/accuracy | **PASS**（graded 会话 accuracy null） |
| 图片发给 DeepSeek | **未发生** |
| 越权扫旧 session | **未发生** |

合成打印 PNG 对「仅转写」prompt 易触发 `recognitionUncertain`；同素材在千问**直接评分**路径（A/H）可读——属链路差异，**不得**把 B 改成假 PASS。

---

## 7. 持久化与历史

- `gradingProvider` 写入 user_answer；G/H/A 的 `ai_grade_json` / `ai_model` / `ai_graded_at` 可读。  
- review_required 项无假 0 分、无 ai_grade 伪装。  
- `getSession` 可读（脚本内核对）。  
- UI：**UI_NOT_RUN**

---

## 8. 环境恢复

| 项 | 结果 |
|---|---|
| `.env` Vision/AI ENABLED | **false**（始终未写成 true） |
| TEST_USER / SESSION / BUDGET | **absent** |
| API 再重启 | 已执行（恢复后 health 复核） |
| health | **200** |
| 旧 session | 未变 |
| Vision/AI 开关恢复 | **false / false** |

---

## 9. 结论

**APPLICATION-3E-3 = PARTIAL**

已证实：自动调度、千问图文评分、DeepSeek 纯文字、转写失败/不确定时 fail-closed 不调 DeepSeek、预算与 allowlist、DB 持久化。  
未证实：DeepSeek+图片双阶段完整 graded（B/C/F/D 均未越过转写门禁）。

原始数据：`_tmp_application3e3_live_raw.json`

---

## 10. 遗留 / 建议下一轮（需新授权）

1. 改进转写素材（更高清印刷/手写样张）或放宽仅对 dual 的转写置信策略（须单独评审）。  
2. 在预算内专测「转写成功 → DeepSeek」至少 1 例。  
3. UI 点验。  
4. E 期望统一为 `review_required`（parse_fail 可映射）。
