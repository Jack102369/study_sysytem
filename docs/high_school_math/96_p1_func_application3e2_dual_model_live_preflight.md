# APPLICATION-3E-2 · 双模型真实联调预检

> **日期**：2026-10-25  
> **状态**：**PREFLIGHT_COMPLETE**  
> **真实 Qwen HTTP：0** · **真实 DeepSeek HTTP：0** · **API 重启：NOT_RUN** · **迁移：NOT_RUN** · **训练写库：NOT_RUN**

---

## 1. 本轮代码检查结果

| 项 | 结论 |
|---|---|
| `gradingProvider` 默认 qwen | **PASS**（校验落库；旧数据 resolve qwen） |
| 提交后不可改 | **PASS**（payload 锁定 + 会话 `completed` → 前端 `disabled`） |
| 写入 `user_answer_payload_json` | **PASS** |
| 结果页文案与 pipeline | **PASS**（千问 / DeepSeek / DeepSeek（千问识别）） |
| 非 application 无污染 | **PASS**（禁止该键；其它题型判分未改） |

**本轮最小修复（预检发现）：**

1. **deepseek + 文图混合**：DeepSeek 评分输入改为「学生原文 + 图片转写」合并（此前仅评转写）。  
2. **转写低置信**：`confidence < 0.5` 与 `recognitionUncertain` 一样 → `review_required`，**不**调 DeepSeek。  
3. dual 结果 JSON 增加 `visionCallCount` / `scoringCallCount`（无迁移）。

---

## 2. 双模型调用矩阵

| # | provider | 内容 | pipeline | 外发 |
|---|---|---|---|---|
| A | qwen | 有图 | `qwen_vision` | Qwen Vision 评分 |
| B | qwen | 纯文字 | `qwen_text` | Qwen（无图）+ rubric prompt |
| C | deepseek | 纯文字 | `deepseek_text` | 仅 DeepSeek |
| D | deepseek | 有图 | `qwen_then_deepseek` | Qwen 转写 → DeepSeek 评分 |
| E | deepseek | 文+图 | 同上 | Qwen 转写图 → **合并原文** → DeepSeek |

开关不足 → `review_required`，**不**静默改 provider；**不**把图发给纯文字 DeepSeek。

---

## 3. Qwen 转写安全检查

| 要求 | 结论 |
|---|---|
| imageIds 顺序 1～5 | **PASS**（`normalizeVisionImageIds` + loader 保序） |
| 不依赖文件名 | **PASS** |
| 不评分 / 不按标准答案改写 | **PASS**（prompt） |
| `recognizedWork` / uncertain / warnings / confidence | **PASS** |
| uncertain / 低置信 / 解析失败 → 不调 DeepSeek | **PASS**（本轮补低置信门禁） |
| 不默认 0 分伪装 | **PASS**（`review_required` / `grading_failed`） |

---

## 4. rubric 评分校验

`validateHsMathAiGradeResult`：**PASS**（key / 上限 / 总和 / 满分；合法 0 分可 `graded`；非法 → `grading_failed`）。

---

## 5. 幂等与并发

| 项 | 结论 |
|---|---|
| 进程内 `inFlight` 同 item 单飞 | **PASS** |
| claim 拒绝 `graded` / `review_required` | **PASS** |
| `ai_attempt_count` 整题一次 claim（双阶段同窗） | **PASS** |
| DeepSeek 失败不重试 Qwen | **PASS** |
| schedule 不扫历史 review_required | **PASS** |
| AI/Vision 关不外发 | **PASS**（当前 ENABLED=false） |
| Vision 并发槽 dual 共用 | **PASS**（`acquireVisionSlot`） |

---

## 6. 持久化检查

只读 `study_system.hs_math_train_session_items` 列：

`user_answer_payload_json`, `grade_result`, `grade_reason`, `ai_grade_json`, `ai_model`, `ai_graded_at`, `ai_attempt_count`

| 数据 | 存哪 |
|---|---|
| gradingProvider | `user_answer_payload_json` |
| pipeline / visionModel / scoringModel / recognizedWork / warnings / rubric / 解析 | `ai_grade_json` |
| 展示用模型名 | `ai_model`（双阶段写 scoringModel） |
| 尝试次数 | `ai_attempt_count`（整题；分阶段次数在 JSON） |

**迁移：不需要。**

---

## 7. stub 测试结果

| 命令 | 结果 |
|---|---|
| `pnpm --filter api run hs-math:application3e1-selftest` | **PASS 15** |
| `pnpm --filter api run hs-math:application3e2-selftest` | **PASS 20** |
| `pnpm --filter web run hs-math:application3e1-selftest` | **PASS 7** |
| `pnpm --filter web run hs-math:application3e2-selftest` | **PASS 5** |

覆盖任务要求 1–18（stub/mock；无真实 HTTP）。

---

## 8. build 结果

| 命令 | 结果 |
|---|---|
| `pnpm --filter api run build` | **PASS** |
| `pnpm --filter web run build` | **PASS** |

---

## 9. 真实联调测试矩阵（未执行）

题目：**itemId=151** / `HSMA-RJA-CH03-APP-0001` · rubric 3+2+3+2=10  
建议 **user_id=2** · **新建 session**（勿复用 3D-9 session 108）

| 场景 | 操作 | 预期 |
|---|---|---|
| A | 千问 + 正确双图 | graded ≈10/10 |
| B | DeepSeek + 正确双图 | dual → ≈10/10 |
| C | DeepSeek + 部分正确图 | 合法部分分 |
| D | DeepSeek + 明显错误图 | graded 低分/0 |
| E | DeepSeek + 模糊图 | `review_required`，**0× DeepSeek** |
| F | DeepSeek + 文图混合 | 合并后评分 |
| G | DeepSeek + 纯文字 | **0× Qwen** |
| H | 千问 + 部分正确图 | 分项部分分 |

虚构数学答案即可；任意文件名。

---

## 10. 各模型预计调用预算

| 场景 | Qwen | DeepSeek | 合计上限建议 |
|---|---|---|---|
| A | 1 | 0 | 1 |
| B | 1 | 1 | 2 |
| C | 1 | 1 | 2 |
| D | 1 | 1 | 2 |
| E | 1 | **0** | 1 |
| F | 1 | 1 | 2 |
| G | 0 | 1 | 1 |
| H | 1 | 0 | 1 |
| **合计（全跑）** | **≤7** | **≤5** | **≤12** |

建议进程预算：`HS_MATH_VISION_LIVE_HTTP_BUDGET=8`；DeepSeek 由文字开关 + 单 session 控制；失败不重试。

---

## 11. 数据外发范围

| 目标 | 内容 |
|---|---|
| Qwen | 题干、学生文字（若有）、图片像素（Base64）、转写或评分 prompt；**不含**密钥日志 |
| DeepSeek | 题干、标准答案、rubric、合并后的学生文字/转写；**无图片** |

费用：视本地/云模型计费；预算按上表次数封顶可估。

---

## 12. 需要用户单独授权的操作

1. 临时 `HS_MATH_VISION_GRADING_ENABLED=true` + URL/KEY（已配置存在性，值不披露）  
2. 临时 `HS_MATH_AI_GRADING_ENABLED=true`（DeepSeek 场景）  
3. `HS_MATH_VISION_GRADING_TEST_USER_ID=2`  
4. `HS_MATH_VISION_GRADING_TEST_SESSION_IDS=<新建 sessionId>`  
5. `HS_MATH_VISION_LIVE_HTTP_BUDGET=8`（或协商值）  
6. **重启 API** 使 env 生效  
7. 允许对指定新 session **写入**训练答案/图片/批改结果  
8. 明确 Qwen ≤7、DeepSeek ≤5 的 HTTP 预算  

**不能**沿用 3D-9 旧授权 / 旧 session 108。

验收后恢复：两 ENABLED → false；清空 TEST_USER / SESSION_IDS / BUDGET；再重启 API。

当前本机（只读）：两 ENABLED=**false**；TEST_USER/SESSION/BUDGET=**EMPTY**；密钥与 URL **已配置存在**。

---

## 13. 尚未完成的真实验收项

- 真实 Qwen / DeepSeek HTTP  
- 新建 session 写库联调  
- API 重启  
- UI 点验  
- 场景 A–H 实测分值

---

## 14. 最终结论

**APPLICATION-3E-2 = PREFLIGHT_COMPLETE**

| 项 | 值 |
|---|---|
| 代码检查 | **PASS**（含本轮 2 处安全修复） |
| API stub | **15 + 20 PASS** |
| Web 测试 | **7 + 5 PASS** |
| API build | **PASS** |
| Web build | **PASS** |
| 数据库迁移 | **NOT_RUN**（不需要） |
| 数据库写入 | **NOT_RUN** |
| 真实 Qwen HTTP | **0** |
| 真实 DeepSeek HTTP | **0** |
| API 重启 | **NOT_RUN** |
| 真实 UI 点验 | **UI_NOT_RUN** |
| 阻塞项 | **等待用户授权** live（开关/预算/重启/写库） |

**停止。** 不得自行进入真实联调。
