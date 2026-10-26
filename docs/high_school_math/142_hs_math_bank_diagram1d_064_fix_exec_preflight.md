# HS-MATH-BANK-DIAGRAM-1D-064-FIX-EXEC-PREFLIGHT — 正式 PATCH 执行前核验

> 日期：2026-10-26  
> **最终状态：`FIX_EXECUTION_READY`**  
> 前置：141 = `FIX_PLAN_READY` · 140 记 064 = `BLOCKED_STEM_AMBIGUITY`  
> **本阶段未调用 Admin PATCH、未写库、未改图**

---

## 1. 结论摘要

| 项 | 结果 |
|----|------|
| 当前题目 | id=**215** · CAND-G1B-064 · **approved** · **cv=1** |
| 状态漂移 | **无**（可继续按本方案执行） |
| drawable | **113**（只读） |
| 插图关联 | item 215 关联行 **0**（PATCH 不触碰 diagrams 表） |
| Admin API | `PATCH /hs-math/admin/train-items/:id` · JWT+Admin · 升版+退 draft **已确认** |
| 建议 PATCH 体 | **仅** `stem` + `expectedContentVersion: 1` |
| 答案/解析/rubric/KP/method/difficulty | **不改** |
| **状态** | **`FIX_EXECUTION_READY`** |

旁证：`_g1d_064_fix_preflight_ro.json`（重跑只读脚本）

---

## 2. 只读现状（须与执行前复验一致）

| 字段 | 值 |
|------|-----|
| id | 215 |
| code | CAND-G1B-064 |
| status | **approved** |
| content_version | **1** |
| pool / is_active | formal / 1 |
| qtype | application |
| difficulty | 3 |
| options | null |
| answer.standardAnswer | `$h=\dfrac{40\sqrt3}{3}\text{m}$。` |
| rubric | tan30°(4) / 40√3/3(4) / m(2) · max=10 |
| analysis | 已写「仰角 \(30^\circ\)…」 |
| KP | rja.5.7.03 |
| method | special_value |
| 最新 review | id=46 · cv=1 · passed · fp=`60a0888327a2a5a1eeb5e9c5f09a43ab06d2fce1b12547f74eccbab26f19d78e` |
| fingerprint 列 | 无常驻列；指纹在 review/approve 时计算 |

**若执行前复验发现 status≠approved 或 cv≠1 → 停止本方案，重新评估。**

---

## 3. 完整新旧题干与精确差异

### 旧（当前 DB）

```
塔高测量：距塔底 $40\text{m}$ 处测得顶角 $30^\circ$，求塔高（精确值）。
```

### 新（唯一允许的 stem）

```
塔高测量：距塔底 $40\text{m}$ 处测得塔顶的仰角为 $30^\circ$，求塔高（精确值）。
```

### 差异（逐字）

| 片段 | 旧 | 新 |
|------|----|----|
| 「测得」之后、「\(30^\circ\)」之前 | `顶角 ` | `塔顶的仰角为 ` |

其余字符（含 `$40\text{m}$`、`$30^\circ$`、首尾句）**不变**。

**不变字段**：answer_payload_json、analysis、difficulty、specialty/category、KP 关联、method 关联、pool、code、qtype、options。

---

## 4. Admin PATCH 审计

| 项 | 证据 |
|----|------|
| 路由 | `PATCH /hs-math/admin/train-items/:id` → `HsMathAdminTrainItemsController.update` |
| 守卫 | `@UseGuards(JwtAuthGuard, AdminGuard)` |
| DTO | `UpdateHsMathTrainItemDto`：`stem?`、`expectedContentVersion?`；**禁止** body 带 `status`（会 BadRequest） |
| 事务 | `dataSource.transaction` + 行锁 `pessimistic_write` |
| 乐观锁 | `expectedContentVersion` 不匹配 → **409 Conflict** |
| 内容变更检测 | `snapshotTrainItemContent` 前后比较；stem 变化 → `contentChanged=true` |
| 升版 | `bumpContentVersionOnMetaEdit`：`contentVersion += 1` |
| approved→draft | 同函数内：若 `status==='approved'` → `draft`，清 `reviewedBy/At`，`isActive=true` |
| fingerprint | 不写 items 表；下次 review/approve 按新内容重算；旧 review fp 对 cv2 **stale** |
| 正式抽题 | 抽题条件含 `status=approved` → draft 后 **排除** 本提 |
| 答案再校验 | stem 变更会触发 `validateAnswerPayload`（用**现有** answer/options）；不改 payload 则保持 |
| 插图关联 | `update()` **不**读写 `hs_math_train_item_diagrams*`；不会覆盖图片关联 |
| 其他题 | 仅 `WHERE id=:id` 锁本行；不影响其他题目 |

---

## 5. 建议请求体（执行阶段用 · 本阶段不发送）

```http
PATCH /hs-math/admin/train-items/215
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json
```

```json
{
  "stem": "塔高测量：距塔底 $40\\text{m}$ 处测得塔顶的仰角为 $30^\\circ$，求塔高（精确值）。",
  "expectedContentVersion": 1
}
```

说明：JSON 字符串中 LaTeX 反斜杠需写成 `\\text` / `\\circ`，入库后与上节「新题干」一致。

**禁止**在同一次 PATCH 中附带 analysis / answerPayloadJson / difficulty / status 等字段。

---

## 6. 执行前后检查方案

### PATCH 前（复验）

| 检查 | 期望 |
|------|------|
| id=215 code | CAND-G1B-064 |
| status | approved |
| content_version | 1 |
| stem | 含「顶角」 |
| drawable | 113 |
| review 46 | passed @ cv1 |

### PATCH 后（期望）

| 检查 | 期望 |
|------|------|
| status | **draft** |
| content_version | **2** |
| stem | 含「塔顶的仰角为」；无「顶角」 |
| answer / analysis / rubric | **字节级不变**（或规范化等价不变） |
| KP / method / difficulty | 不变 |
| reviewed_by / reviewed_at | 清空 |
| review 46 | 仍存在但 **cv1**；对 cv2 **不能**当有效 passed |
| drawable | **112**（064 暂出池） |
| 其他 112 题 | 不受影响 |
| diagram 表 | 仍空 / 215 仍无关联 |

**不得**为维持 drawable=113 而 SQL/接口强行改回 approved。

### 后续（另授权，非本 PATCH）

1. 人工 review（expectedContentVersion=2 + 新 fingerprint）passed  
2. `PATCH …/status` → approved + confirmPublish  
3. drawable 回到 113  
4. 再谈插图上传

---

## 7. 风险与回滚说明

| 风险 | 缓解 |
|------|------|
| 并发他人已改题 | `expectedContentVersion:1` 冲突则失败，安全 |
| 误传全量表单覆盖答案 | 执行时**只传 stem+version** |
| 半失败 | 单事务；成功则 cv2+draft 原子完成 |
| 「回滚」 | 无自动回滚；如需恢复旧 stem 须再 PATCH（再升 cv）并重审——**须另授权** |

---

## 8. 最终状态

```
FIX_EXECUTION_READY
```

**停止。等待单独授权正式 PATCH。**  
本阶段未调用写接口。
