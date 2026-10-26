# P1-FUNC · APPLICATION-3B 数据库迁移与 stub 业务验收

> **执行时间**：2026-10-25  
> **状态**：**PARTIAL**  
> **原因**：真实 DeepSeek 未联调；HTTP 服务未重启（本轮未授权）；UI 未点验  
> **APPLICATION-3A**：迁移已落地，代码能力可用；仍 PARTIAL（真实 AI / UI）  
> **APPLICATION-3**：PARTIAL  
> **未做**：真实 DeepSeek 调用、外发学生数据、重启服务、改正式题库

---

## 1. 迁移前基线（只读）

| 项 | 值 |
|---|---|
| DATABASE() | `study_system` |
| 目标表 | `hs_math_train_session_items` 等存在 |
| `grade_result` | `varchar(32)` NULL |
| `ai_%` 列 | **不存在**（迁移未部分执行） |
| session_items | 262 |
| application 行 | 5（全部 `pending_ai`） |
| grade 分布 | null 140 / correct 56 / wrong 33 / pending_review 28 / pending_ai 5 |
| images | 10 |
| train_items | 111；approved 13 |
| item 151 | `HSMA-RJA-CH03-APP-0001` approved / formal / application / maxScore=10 |
| session 51/55/56 | completed，user_id=2（本轮不改答案） |

---

## 2. 数据备份位置

`db/backups/application3b_20261025_153625/`（已 gitignore）

| 文件 | 说明 |
|---|---|
| `pre_migrate_tables.sql` | mysqldump：session_items / sessions / images / train_items |
| `pre_show_create_session_items.txt` | SHOW CREATE TABLE |
| `pre_counts.txt` | 迁移前计数 |

---

## 3. 执行的 SQL

仅：`db/migrate_hs_math_application3_ai_grading.sql`

内容：

1. `ADD COLUMN`：`ai_grade_json` / `ai_model` / `ai_graded_at` / `ai_attempt_count`  
2. `MODIFY COLUMN grade_result` 注释扩展（类型仍 `varchar(32)`）  

无 DELETE / TRUNCATE / 改题库 / 重置 grade_result。

执行方式：`Get-Content` 管道入 `mysql`（因路径含中文，避免 SOURCE 失败）。

---

## 4. 迁移执行结果

**成功**（exit 0）。

---

## 5. 迁移后数据库结构

| 列 | 类型 | Null | Default |
|---|---|---|---|
| ai_grade_json | json | YES | NULL |
| ai_model | varchar(64) | YES | NULL |
| ai_graded_at | datetime(3) | YES | NULL |
| ai_attempt_count | int unsigned | NO | 0 |
| grade_result | varchar(32) | YES | NULL；注释含 grading/graded/review_required/grading_failed |

历史：`pending_ai` 旧 5 条保留；images / approved 题量在迁移瞬间未变。  
IT 新建会话后计数上升属预期（见 §6）。

---

## 6. 业务测试结果

命令：`pnpm --filter api run hs-math:application3b-mysql-it`

方式：独立 Nest `ApplicationContext`（**不**重启 HTTP）；`user_id=2`；item 151；虚构答案；**stub AI**（`ai_model=stub-application3b`）。

| 用例 | 结果 |
|---|---|
| A 满分 10/10 stub → graded 持久化 | PASS |
| B 部分分 7 | PASS |
| C 合法 0 分 graded | PASS |
| 超时 → grading_failed，无 0 分 JSON | PASS |
| 非法 JSON → grading_failed | PASS |
| 幂等：已 graded 不被覆盖 | PASS |
| API 视图返回 aiGrade | PASS |
| graded 不计 correct/wrong/accuracy 分母 | PASS |
| D 纯图 → review_required；图 submitted；无 storage_key 泄露 | PASS |
| E 文+图 → review_required | PASS |
| session 51/55/56 完好 | PASS |
| approved=13 不变 | PASS |
| 旧 single 题 correct + accuracy 分母可用 | PASS |

**最终：30/30 PASS**

说明：submit 异步 schedule 在 `HS_MATH_AI_GRADING_ENABLED` 关闭时会先写 `ai_disabled`；IT 在 stub 批改前 reset 为 `pending_ai`，避免与 stub 竞态。日志中的 `ai_disabled` **不是**外发。

---

## 7. AI fake/stub 使用范围

- 仅进程内 `invoker` 返回 JSON。  
- `ai_model` 固定 `stub-application3b`（明确非真实 DeepSeek）。  
- `HS_MATH_AI_GRADING_ENABLED` 全程强制 `false`。  
- **未**调用 `api.deepseek.com`。

---

## 8. 原有四题型回归

| 项 | 结果 |
|---|---|
| application1-selftest | PASS |
| 3B IT legacy_single_correct | PASS（correct；accuracy=1 于 correct/(correct+wrong)） |

---

## 9. 图片业务回归

| 项 | 结果 |
|---|---|
| application2d-selftest | PASS |
| 3B D/E 上传+submit+review_required | PASS |
| storage_key 不进会话 API JSON | PASS |

---

## 10. 历史与学情验证

- 历史会话 51/55/56：status 仍 completed，未改答案。  
- application `graded`：correct/wrong/pending 均为 0（单题会话）。  
- `grading_failed` / `review_required`：计入 pending，不计 wrong。  
- 旧 pending_ai（迁移前 5 条）保留。

---

## 11. DeepSeek 联调准备（只检查，未调用）

| 项 | 状态 |
|---|---|
| API Key | **已配置**（报告不输出明文） |
| DEEPSEEK_BASE_URL | `https://api.deepseek.com` |
| DEEPSEEK_MODEL | `deepseek-chat` |
| 超时 | 代码 `HS_MATH_AI_GRADING_TIMEOUT_MS=60000` |
| 功能开关 | `HS_MATH_AI_GRADING_ENABLED` **未设置＝关闭** |
| JSON | `response_format: json_object`（非推理模型） |
| 是否发图片 | 文本路径不发；含图走 review_required |
| 误发历史答案 | schedule 仅处理本会话 pending 纯文字项；默认关闭不外发 |
| 调用次数限制 | `HS_MATH_AI_GRADING_MAX_ATTEMPTS=2`；无独立日配额 |
| 可用虚构答案 | 是 |

### 建议真实联调（待单独授权）

- 最多 **3** 次；完全虚构文字；无图；无用户身份/历史附带。  
- 记录：模型、延迟、评分、token；**不**记凭据。  
- 费用与数据处理政策：**待授权确认**（本轮未查询厂商账单）。

---

## 12. 未执行的真实 AI 调用

本轮 **0** 次真实 DeepSeek 请求；**0** 次学生数据外发。

---

## 13. 尚存风险

1. 运行中的 HTTP `dist` 可能仍是迁移前构建；本轮**未授权重启** → 浏览器走旧进程时可能缺 AI 字段映射。  
2. 含图长期 `review_required`。  
3. `grading_failed` 尚无正式学生侧重试 API。  
4. stub 验收 ≠ 真实模型质量验收。

---

## 14. 下一步最小任务

1. **授权重启 API**（加载含 3A/3B 的 dist）。  
2. **授权 APPLICATION-3C**：真实 DeepSeek ≤3 次虚构文字联调。  
3. 可选：UI 点验结果页 AI 分项展示。  
4. 不进 CORE-1B；保持 2F PARTIAL、1A-4B BLOCKED。

---

## 变更日志

| 时间 | 说明 |
|---|---|
| 2026-10-25 | 迁移执行成功；stub IT 30/30；3B=PARTIAL |
