# P1-FUNC-DIFF-2B 实施准备报告

> **状态标记：`SOURCE_UPDATED_DB_PENDING`**  
> 权威源 / JSON / 前端文案已更新；**数据库尚未写入**。  
> 本阶段**未**调用 PATCH、未批准、未写审核、未跑 import/confirm。

---

## A. 实施结果

**PARTIAL（代码与源 PASS；库同步待授权）**

| 子项 | 结果 |
|---|---|
| 5 题权威 TS 难度 | 已改 |
| `parity_25.json` | 已与源一致（经 `hs-math:p1-func2-check`） |
| 目标分布 16/7/2 | 源侧 PASS |
| 三级难度文案 基础/提高/压轴 | 前端已统一 |
| 审核材料 DIFF-2B 说明 | 已同步（未篡改历史 DIFF-1） |
| API / Web build | PASS |
| 数据库 difficulty | **仍为 12/9/4**（未写） |

---

## B. 修改文件清单

### 权威源 / 校验

- `apps/api/src/hs-math/util/hs-math-p1-func2-parity-items.ts` — 5 题 difficulty
- `apps/api/src/hs-math/util/hs-math-p1-func2-parity-check.ts` — 期望分布 16/7/2 + 生成物页眉说明

### 题库生成物 / 文档

- `docs/high_school_math/question_bank/chapter_03/parity_25.json`
- `docs/.../review_book_parity.md`（生成）
- `docs/.../review_checklist_parity.md`（生成）
- `docs/.../review_issues_parity.md`（生成，若有）
- `docs/.../README.md` — SOURCE_UPDATED_DB_PENDING
- `docs/.../parity_import_manifest.json` — 目标难度数字 + **指纹/SHA 标 STALE**（禁止据此 confirm）
- `docs/high_school_math/40_p1_func_diff2b_implementation_preparation.md`（本文件）

### 前端（仅 hs-math）

- `apps/web/src/utils/hs-math-format.ts` — `3 → 压轴`
- `apps/web/src/views/hs-math/HsMathTrainSetupView.vue`
- `apps/web/src/views/settings/hs-math/HsMathTrainItemsAdminView.vue`
- `apps/web/src/views/settings/hs-math/HsMathTrainItemsReviewView.vue`
- `apps/web/src/views/settings/hs-math/HsMathTrainItemsImportView.vue`

会话/历史/结果/学情页已用 `difficultyLabel`，随中央函数自动变为「压轴」。

**未改**：化学、错题本、用户/积分、`.env`、迁移、业务 PATCH 执行。

---

## C. 5 题 TS 源修改结果

| code | 原 difficulty | 新 difficulty |
|---|---:|---:|
| HSMA-RJA-CH03-PARITY-0017 | 2 | 1 |
| HSMA-RJA-CH03-PARITY-0018 | 2 | 1 |
| HSMA-RJA-CH03-PARITY-0020 | 2 | 1 |
| HSMA-RJA-CH03-PARITY-0024 | 3 | 2 |
| HSMA-RJA-CH03-PARITY-0025 | 3 | 1 |

其余 20 题 difficulty 未改；题干/选项/答案/解析/qtype/KP **未改**。

---

## D. 5 题 JSON 修改结果

`parity_25.json` 由 check 自 TS 重生成；与源一致。上述 5 题 difficulty 同表。

---

## E. 25 题难度统计

| 层 | 基础(1) | 提高(2) | 压轴(3) |
|---|---:|---:|---:|
| 权威源 / JSON（本阶段） | **16** | **7** | **2** |
| 数据库（只读核对） | 12 | 9 | 4 |
| 目标（授权 PATCH 后） | 16 | 7 | 2 |

---

## F. 前端三级难度展示改造

统一映射入口：`difficultyLabel()` → **基础 / 提高 / 压轴**。

已消除 hs-math 范围内「挑战」文案与审核/导入裸数字难度名；筛选项改为中文标签（value 仍为 1/2/3）。  
API/DB 字段类型不变。

---

## G. 审核材料同步情况

- 复核清单 / 审核册页眉标明：**目标难度**、**SOURCE_UPDATED_DB_PENDING**、5 题「原→目标」。
- 表中「难度」列 = 源目标难度（非 DB 当前值）。
- 数学复核列 / 人工 PENDING **未伪造为 passed**。
- DIFF-1 报告（`37_*`、`parity_25_difficulty_review.json`）**未改写**历史审查正文。
- `parity_import_manifest.json`：难度数字对齐目标，但 **sha256 / contentFingerprint 标 STALE**，禁止重新 confirm。

---

## H. 编译结果

| 命令 | 结果 |
|---|---|
| `pnpm --filter api run hs-math:p1-func2-check` | PASS（难度 16/7/2；未写库） |
| `pnpm --filter api build` | PASS |
| `pnpm --filter web build` | PASS（`✓ built in 32.32s`） |

---

## I. 数据库当前状态（只读）

- 库：`study_system`
- parity 25：全部存在，全部 **draft**
- 分布：**12 / 9 / 4**
- 审核记录：0（此前预检）
- 本阶段：**零写入**

5 题当前：

| id | code | difficulty | content_version | status |
|---:|---|---:|---:|---|
| 125 | …-0017 | 2 | 1 | draft |
| 126 | …-0018 | 2 | 1 | draft |
| 128 | …-0020 | 2 | 1 | draft |
| 132 | …-0024 | 3 | 1 | draft |
| 133 | …-0025 | 3 | 1 | draft |

---

## J. 待执行 PATCH 方案（未执行）

### 接口

- 方法：`PATCH`
- 路径：`/hs-math/admin/train-items/:id`  
  （前端封装：`updateAdminHsMathTrainItem`；全局前缀以部署为准，多为 `/api`）
- 鉴权：管理员 JWT（`AdminGuard`）
- DTO：`UpdateHsMathTrainItemDto` — **全部字段可选**；**仅传 `difficulty` 即可**局部更新
- Service：`difficulty` 属实质性变更 → **`content_version += 1`**；指纹含 difficulty（下次审核按新指纹）
- **无** `expectedContentVersion` 乐观锁字段 → 执行前须人工 GET 核对

### 请求体（每题）

```json
{ "difficulty": <目标整数 1|2|3> }
```

### 执行顺序（建议串行）

1. GET 每题，断言：`status=draft`、`content_version=1`、`difficulty=当前值`
2. 依次 PATCH（顺序任意；建议按 code 升序）：

| 顺序 | id | code | body | 预期 version |
|---:|---|---|---|---:|
| 1 | 125 | …-0017 | `{"difficulty":1}` | 1→2 |
| 2 | 126 | …-0018 | `{"difficulty":1}` | 1→2 |
| 3 | 128 | …-0020 | `{"difficulty":1}` | 1→2 |
| 4 | 132 | …-0024 | `{"difficulty":2}` | 1→2 |
| 5 | 133 | …-0025 | `{"difficulty":1}` | 1→2 |

3. 只读验证 SQL（授权后执行）：

```sql
SELECT code, difficulty, content_version, status
FROM hs_math_train_items
WHERE code LIKE 'HSMA-RJA-CH03-PARITY-%'
ORDER BY code;

-- 期望：difficulty 计数 1→16, 2→7, 3→2
-- 上述 5 题 content_version=2，其余仍为 1
```

4. 可选：对更新后库与新源做指纹比对（导入幂等预检）；**仍禁止**无授权 confirm。

### 失败恢复

- 对已成功的 id：再 `PATCH` 回旧 difficulty → version 再 +1（接受单调递增）
- **禁止**裸 SQL 改回 `content_version=1`
- 源文件已在 git；库回滚用业务接口

---

## K. 数据库写入风险

| 风险 | 说明 | 缓解 |
|---|---|---|
| 源/库不一致窗口 | 现已处于此窗口 | 尽快授权 PATCH；期间禁止 confirm |
| 误改其它字段 | 传多字段会升 version 并可能改内容 | **只传 difficulty** |
| 无乐观锁 | 并发编辑可能覆盖 | 单人执行；先 GET 再 PATCH |
| 指纹变化 | 旧审核将 STALE | 本批无审核；之后重审 |
| 用过期 manifest confirm | Conflict 或错误幂等 | manifest 已标 STALE |

---

## L. 后续人工授权事项

请用户明确授权后进入 **DIFF-2C（或同名写库阶段）**：

1. 管理员身份对 id `125,126,128,132,133` 执行上述 5 次 PATCH  
2. 跑只读验证 SQL，确认 16/7/2  
3. （可选）重算并更新 import manifest 指纹；仍不批准  
4. **不**自动批准、不写 reviews

---

## M. 未完成项

- [ ] 数据库 5 题 difficulty 同步  
- [ ] 关闭 `SOURCE_UPDATED_DB_PENDING`  
- [ ] manifest SHA/指纹刷新（DB 同步后）  
- [ ] 人工审核 / 批准（另开阶段）

---

**本阶段停止。等待用户数据库写入授权。**
