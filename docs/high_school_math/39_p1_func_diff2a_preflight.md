# P1-FUNC-DIFF-2A 预检报告

> **阶段**：难度调整实施预检 + 三级难度展示改造设计  
> **约束**：本阶段仅审计与方案；**未改库、未改业务代码、未改题库源、未批准**。  
> **库**：仅连接 `study_system`（只读 SELECT）。

---

## 1. 执行结论

**PASS**

审查报告、权威源、数据库三者当前难度一致；5 题调整目标明确；可通过现有管理员 `PATCH` 接口合规更新（会升高 `content_version` 并改变内容指纹）；历史训练快照无 parity 记录，安全；展示层需将「挑战」统一为「压轴」，并消除裸数字难度名。  
**下一步需用户授权后**方可进入 DIFF-2B 实施（写源文件 + 经业务接口写库 + 改前端文案）。

---

## 2. 审查文件核对

| 文件 | 状态 |
|---|---|
| `docs/high_school_math/question_bank/chapter_03/37_p1_func_diff1_parity_difficulty_review.md` | 存在，已读 |
| `docs/high_school_math/question_bank/chapter_03/parity_25_difficulty_review.json` | 存在，可解析 |
| `docs/high_school_math/question_bank/chapter_03/38_p1_func_diff1_review_summary.md` | 存在，已读 |

JSON 不变量校验：

| 检查项 | 结果 |
|---|---|
| items 数量 = 25 | PASS |
| code 全部唯一 | PASS |
| suggestedDifficulty ∈ {1,2,3} | PASS |
| shouldChangeDifficulty=YES 恰好 5 题且为指定清单 | PASS |
| 建议分布 16/7/2 | PASS |
| 0022、0023 suggestedDifficulty=3 | PASS |
| mathCorrectness 全部 PASS（无 ISSUE） | PASS |
| suggestedDifficultyLabel ∈ {基础,提高,压轴} | PASS |

指定 5 题：

| code | current → suggested |
|---|---|
| HSMA-RJA-CH03-PARITY-0017 | 2 → 1 |
| HSMA-RJA-CH03-PARITY-0018 | 2 → 1 |
| HSMA-RJA-CH03-PARITY-0020 | 2 → 1 |
| HSMA-RJA-CH03-PARITY-0024 | 3 → 2 |
| HSMA-RJA-CH03-PARITY-0025 | 3 → 1 |

---

## 3. 数据库 25 题核对结果

连接：`DATABASE()=study_system`（只读）。

| 检查项 | 结果 |
|---|---|
| `HSMA-RJA-CH03-PARITY-%` 行数 | 25（无缺失、无额外） |
| status | 全部 `draft` |
| pool | 全部 `formal` |
| approved 数 | **0** |
| 难度分布 | **1:12 / 2:9 / 3:4**（与审查 current 一致） |
| 与 `parity_25.json` difficulty | **一致**（0 差异） |
| 与审查 JSON `currentDifficulty` | **一致** |
| `hs_math_train_item_reviews`（parity） | **0 条**（无 passed / 无任何审核） |
| `hs_math_train_session_items`（parity code） | **0** |
| `hs_math_train_sessions`（specialty `rja-ch3`） | **0** |
| KP 关联行数 | 49（存在；难度调整不触及） |

5 题 DB 快照（实施前）：

| code | id | difficulty | status | content_version |
|---|---:|---:|---|---:|
| …-0017 | 125 | 2 | draft | 1 |
| …-0018 | 126 | 2 | draft | 1 |
| …-0020 | 128 | 2 | draft | 1 |
| …-0024 | 132 | 3 | draft | 1 |
| …-0025 | 133 | 3 | draft | 1 |

权威源 TS 对应难度（`hs-math-p1-func2-parity-items.ts`）：0017=2、0018=2、0020=2、0024=3、0025=3（与库一致）。

---

## 4. 5 题修改前后清单（计划值，未执行）

| code | id | 改前 difficulty | 改后 difficulty | 预期 content_version |
|---|---:|---:|---:|---:|
| …-0017 | 125 | 2 | 1 | 1 → **2** |
| …-0018 | 126 | 2 | 1 | 1 → **2** |
| …-0020 | 128 | 2 | 1 | 1 → **2** |
| …-0024 | 132 | 3 | 2 | 1 → **2** |
| …-0025 | 133 | 3 | 1 | 1 → **2** |

改后全库 25 题期望分布：**16 / 7 / 2**；0022(id=130)、0023(id=131) 保持 3。

---

## 5. 内容版本与指纹影响分析

代码依据：

- `fingerprintTrainItemContent` / `canonicalizeImportItem`：**difficulty 计入内容指纹**。
- `isSubstantiveTrainItemChange`：`difficulty !== undefined` 即视为实质性变更。
- `HsMathAdminTrainItemsService.update`：实质性变更时 **`content_version += 1`**；若原为 approved 还会回 draft（本批均为 draft，仅升版本）。

影响：

1. **修改 difficulty → 指纹必变**（SHA 含 difficulty）。
2. **content_version 必须递增**（走现有 `PATCH /admin/.../train-items/:id`，不可绕过）。
3. 导入幂等比对同样含 difficulty：源与库不一致时 **Conflict，拒绝幂等**（见 `assertExistingMatchesImport`）。

结论：难度是「内容元数据」而非纯展示字段；调整必须走业务更新路径，并同步权威源。

---

## 6. 人工审核影响分析

- 当前 parity 25 题 **零审核记录** → 无「旧 passed 失效」的即时问题。
- 规则上：版本/指纹变化后，历史审核会标 `isStale`；批准门禁要求 **当前 version + 当前 fingerprint 的有效 passed**。
- 难度调整后若再审核/批准，必须基于 **新版本指纹** 重新 passed（不得沿用旧指纹）。
- **不得**为赶进度手工插入 passed 或绕过门禁。

审核队列：题目仍为 draft；队列可按难度筛选；难度变更后筛选结果变化属预期，不破坏队列状态机。

---

## 7. 历史快照安全分析

- `hs_math_train_sessions.difficulty`：会话级抽题难度（用户选择）。
- `hs_math_train_session_items.difficulty`：**题目难度快照**；学情统计明确「不依赖题库当前难度」。
- 现库 **parity 会话题项 = 0**，章节会话 = 0 → **无历史可污染**。
- 即便将来有快照：只改 `hs_math_train_items.difficulty` **不会回写** session_items。
- 判题使用 session_items 内 `answer_payload_json` 快照，**不读题库当前 difficulty** → 不影响已有会话判题。
- KP 关联表不因 difficulty PATCH 而变更。

---

## 8. 权威题库源文件同步策略

必须三方一致，顺序建议：

1. **先改权威 TS**：`apps/api/src/hs-math/util/hs-math-p1-func2-parity-items.ts`（5 处 `diff` 参数）。
2. **再生成/覆盖** `docs/.../chapter_03/parity_25.json`（经现有 `hs-math:p1-func2-check` 或同等导出），并更新审核书中难度列（如 `review_book_parity.md` / checklist）。
3. **再经业务接口**更新 DB 5 行 difficulty（见 §10），使指纹与源一致。
4. **验证**：对同一批 JSON 走导入 preview/confirm 应走 **idempotent 成功**（指纹匹配），不得 Conflict。

风险：只改库不改源 → 下次导入 Conflict 或误以为可覆盖；只改源不改库 → 同样 Conflict。  
**禁止**用「再导入覆盖」更新已存在题：导入对已存在 code 仅幂等校验，**不 UPDATE**。

---

## 9. 前端三级难度展示改造范围

统一目标文案：**1=基础，2=提高，3=压轴**。  
禁止：巩固 / 普通提高 / 高难 / 挑战；禁止裸数字作为难度**名称**。

### 9.1 现状问题（只读）

| 位置 | 现状 | 问题 |
|---|---|---|
| `apps/web/src/utils/hs-math-format.ts` `difficultyLabel` | 3→「挑战」 | 应用「压轴」 |
| `HsMathTrainSetupView.vue` | radio「挑战」 | 改「压轴」 |
| `HsMathTrainItemsAdminView.vue` | radio「挑战」；表格 `prop="difficulty"` 裸数字 | 标签 + `difficultyLabel` |
| `HsMathTrainItemsReviewView.vue` | 筛选项 label「1/2/3」；面板「难度 {{n}}」 | 应用中文名 |
| `HsMathTrainItemsImportView.vue` | 「难度{{n}}」 | 应用中文名 |
| 会话/历史/结果/学情 | 已用 `difficultyLabel` | 改中央函数即可连带修正 |
| DB COMMENT / `migrate_hs_math_p0.sql` | 「1基础 2提高 3挑战」 | 文档口径；**非必须迁移**，可另开文档对齐 |

化学模块同类「挑战」文案 **不在本任务范围**。

### 9.2 建议修改文件（DIFF-2B，本阶段不改）

**前端（展示）**

1. `apps/web/src/utils/hs-math-format.ts` — 核心：`3 → 压轴`
2. `apps/web/src/views/hs-math/HsMathTrainSetupView.vue`
3. `apps/web/src/views/settings/hs-math/HsMathTrainItemsAdminView.vue`
4. `apps/web/src/views/settings/hs-math/HsMathTrainItemsReviewView.vue`
5. `apps/web/src/views/settings/hs-math/HsMathTrainItemsImportView.vue`

（`HsMathTrainSessionView` / `History` / `Result` / `Analytics` 依赖 format，一般无需单独改文案。）

**后端**

- **不必**为展示新增 API；数值仍返回 1/2/3，标签由前端映射。
- **不必** schema migration（列类型与枚举不变）。
- 可选（非阻塞）：常量/注释中「挑战」改为「压轴」口径说明；`init.sql` COMMENT 对齐可随文档任务，非 DIFF-2B 硬依赖。

---

## 10. 最小实施步骤（DIFF-2B 草案，未执行）

### A. 数据库记录

仅 5 行 `hs_math_train_items`（id 125/126/128/132/133）的 `difficulty`（及由业务层触发的 `content_version`、`updated_by`、`updated_at`）。

### B. 权威源

必须同步改 TS + 再生 JSON（及审查书难度列）。

### C. 一致性

改完后：源指纹 == 库指纹；`p1-func2-check` PASS；导入幂等 PASS。

### D. content_version

是：每题 +1（走 `update()`）。

### E. 人工审核规则

走现有 Service；不插审核行；不批准。将来审核基于新 version/fingerprint。

### F. 历史快照

不触碰 `hs_math_train_sessions` / `session_items`。

### G. 前端文件

见 §9.2。

### H. 后端 API

**不新增接口**。使用已有：

`PATCH /api/.../hs-math/admin/train-items/:id`  
body: `{ "difficulty": <1|2|3> }`  
（管理员 JWT；DTO 已校验 `@IsIn([1,2,3])`）

亦可在管理员题库页对 5 题逐一手动保存（同一 API）。

### I. 回归

1. SELECT 25 题分布 = 16/7/2；5 题 version=2。  
2. 重算 5 题指纹 ≠ 旧指纹；与新源一致。  
3. `npm run hs-math:p1-func2-check`（或项目既定脚本）。  
4. 导入 preview：幂等匹配。  
5. 前端：训练设置/学情/管理/审核/导入预览均显示「基础/提高/压轴」。  
6. 抽题：draft 仍不可进学生池（保持）。  
7. api build / 既有 hs-math selftest 无回归。

### J. 回滚

对同一 5 个 id 再 `PATCH` 回原 difficulty → version 再 +1（变为 3）。  
源文件用 git 回退。  
**不建议**用 SQL 强行改回 version（破坏审计）。若必须完整还原 version=1，需单独授权与书面例外（本方案默认接受 version 单调递增）。

---

## 11. 回滚方案（摘要）

| 层 | 回滚 |
|---|---|
| DB | 业务 PATCH 恢复旧 difficulty（version 继续递增） |
| 源 | git revert TS/JSON |
| 前端 | git revert 文案提交 |
| 审核 | 无历史 passed，无需回滚审核表 |

---

## 12. 风险与阻塞项

| 级别 | 项 | 说明 |
|---|---|---|
| 高 | 源/库不同步 | 导入 Conflict；必须同阶段完成 |
| 中 | 绕过 Service 的裸 SQL | **禁止**；会漏 version/指纹语义 |
| 中 | 文案「挑战」残留 | 学生/管理认知与审查口径不一致 |
| 低 | version 递增后「看起来被改过」 | 符合规则；本批无审核包袱 |
| 低 | 0022/0023 称「压轴」 | 审查已标明章节综合 BORDERLINE，非高考压轴；展示名仍用三级标签「压轴」 |
| 无阻塞 | 迁移 / 新 API / 第二库 | 均不需要 |

**无 BLOCKED 项。**

---

## 13. 需要用户授权的具体数据库操作

下一阶段（DIFF-2B）请求授权：

1. 经管理员身份调用现有 **`PATCH train-items/:id`**，仅对下列 5 个 id 更新 `difficulty`（连带 `content_version+1`）：  
   `125, 126, 128, 132, 133`。  
2. **不** UPDATE/INSERT/DELETE 其它表。  
3. **不** 改 status、不批准、不写 `hs_math_train_item_reviews`。  
4. **不** 执行 SQL 迁移。  
5. **不** 连接非 `study_system` 库。

（同步修改 TS/JSON/前端属代码变更，另按仓库「计划确认」规则执行。）

---

## 14. 下一阶段建议

**P1-FUNC-DIFF-2B**（实施，需确认后启动）：

1. 改权威 TS 5 处难度 → 再生 `parity_25.json` + 更新 chapter_03 审核书难度列。  
2. 管理员 API 更新 DB 5 题。  
3. 前端统一「压轴」文案与标签展示。  
4. 回归清单 §10.I。  
5. 输出实施结果文档（建议 `40_p1_func_diff2b_apply.md`）。  
6. **仍不批准**；人工审核与发布另开阶段。

---

## 附录：任务 3 问答速查

| # | 问题 | 答 |
|---|---|---|
| 1 | difficulty 是否纳入内容指纹？ | **是** |
| 2 | 修改是否使 content_version 递增？ | **是**（substantive） |
| 3 | 旧人工审核是否失效？ | 会 STALE；本批无旧审核 |
| 4 | 是否已有统一更新接口？ | **有** `PATCH .../train-items/:id` |
| 5 | 是否需新增 API？ | **否** |
| 6 | 能否管理页修改？ | **能**（同一接口） |
| 7 | JSON 与 DB 如何一致？ | 先改源再生 JSON，再 API 改库，再幂等校验 |
| 8 | 重导入导致难度回退？ | 导入不覆盖已存在题；不一致则 Conflict。源旧库新 → 冲突而非静默回退 |
| 9 | 影响历史训练快照？ | **否**（且现为 0） |
| 10 | 影响会话判题？ | **否** |
| 11 | 影响 KP 关联？ | **否** |
| 12 | 影响审核队列？ | 仅难度筛选展示变化；无状态破坏 |
| 13 | 影响批准质量门禁？ | 指纹/版本变化后需新 passed；本批尚未批准 |
