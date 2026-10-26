# P1-FUNC · APPLICATION-2D 提交锁定与历史快照

> **执行时间**：2026-10-25  
> **范围**：submit 同事务 draft→submitted；历史只返回答案引用图；孤儿分类；无 DB 自测  
> **迁移**：**NOT_EXECUTED**  
> **真实上传**：**否**  
> **APPLICATION-2D**：按下方证据判定  
> **APPLICATION-2A/2B/2C**：**PASS**  
> **APPLICATION-1**：**PARTIAL**  
> **CORE-1A-4B**：**BLOCKED**

---

## 1. 提交事务设计

锁顺序（防死锁）：

1. `session`（`pessimistic_write`，属主）
2. 加载 session items（`sortOrder ASC`）
3. 对每道 application 且答案含 `imageIds`：按 **id 升序** 锁图片行
4. `planSubmitImageLocks` + `applyDraftToSubmittedTransition`
5. 判分 → session `completed` + `submittedAt`

**要点**：图片状态变更与会话提交在**同一** `dataSource.transaction`；不得先完成 session 再改图。

与设计 72 差异（本轮以需求为准）：

| 设计 72 | 本轮 |
|---|---|
| 会话下全部 draft → submitted | **仅答案 `imageIds` 引用的图** → submitted |

未引用 draft 保持 draft，不进历史 `images`。

---

## 2. 图片锁定

| 步骤 | 行为 |
|---|---|
| 读 `user_answer_payload_json` | `extractApplicationImageIds` |
| 核对归属 | 同 user / session_item / 存在 |
| 状态 | 必须 `draft` |
| 写入 | `status=submitted`，`submitted_at=now` |
| 之后 | 不可删（`NOT_DRAFT`）；不可再被 saveAnswer 引用 |

纯文字应用题：无 `imageIds` → 跳过锁图。

---

## 3. 并发保护

| 场景 | 机制 |
|---|---|
| 重复 submit | `completed` 早退，`idempotent=true`，**不**再改图 |
| 提交 vs 删除 | 双方先锁 session；submitted 禁删；引用 draft 删 409（2C） |
| 提交 vs 保存 | 先锁 session 串行；提交后 in_progress 结束 → save 409 |
| 提交 vs 上传 | 上传要求 in_progress；完成后 409 |
| 多图部分失败 | 缺图/非 draft → 整事务回滚，无部分 submitted |
| 已 submitted 再引用 | save/plan 均拒 `IMAGE_NOT_DRAFT` |

---

## 4. 历史数据结构

`getSessionForUser` 在 `reveal=true`（completed）时：

```typescript
item.images?: Array<{
  imageId: string
  mimeType: string
  sortOrder: number
}>
```

- 来源：答案 `imageIds` ∩ `status=submitted` 行  
- **不含**未引用 draft  
- **不含** `storage_key` / 绝对路径 / 公开 URL  
- 二进制仍走 JWT 鉴权 GET  
- `userAnswerPayloadJson.text` 原样保留  
- in_progress / cancelled：**不**附提交快照（编辑仍用 list images API）

---

## 5. 孤儿处理（最小安全）

| 场景 | 分类 | 本轮动作 |
|---|---|---|
| 上传未引用 | `unreferenced_draft` / `replace_left_draft` | 不删 |
| 换图留下 draft | `replace_left_draft` | 不删 |
| 会话取消 | `cancel_session_draft` | 不碰 submitted；draft 保留 |
| 上传中断 / 磁盘孤儿 | 2A/2B 既有尽力清理 | 不扩任务平台 |
| 历史 submitted | — | **禁止删除** |

清理任务推后；仅提供 `classifyApplicationImageOrphan`。

---

## 6. 统计 / pending_ai

- 纯图 / 文图 → `grade_result=pending_ai`  
- 不计 correct / wrong / 正确率分母  
- 旧四题型判分未改  

---

## 7. 修改文件

| 文件 | 变更 |
|---|---|
| `util/hs-math-application-image-policy.ts` | extract / plan / transition / history / orphan |
| `train/hs-math-train.service.ts` | submit 锁图；getSession 历史图 |
| `util/session-item-view.ts` | reveal 时 `images` |
| `util/hs-math-application2d.selftest.ts` | 新增 |
| `package.json` | `hs-math:application2d-selftest` |

---

## 8. 静态测试

| 命令 | 结果 |
|---|---|
| `hs-math:application2d-selftest` | **PASS** |
| `hs-math:application2c-selftest` | **PASS** |
| `hs-math:application2b-selftest` | **PASS** |
| `hs-math:application1-selftest` | **PASS** |

覆盖：纯图/混合、draft→submitted、幂等 transition 拒绝、删/保存冲突、多图全有或全无、历史仅引用、无 storage_key、跨用户、pending_ai、旧文字、单选回归、孤儿分类、锁序。

**未验证**：迁移后真实 HTTP submit、真实上传、多进程死锁压测。

---

## 9. APPLICATION-2E 前置

1. 授权执行 `migrate_hs_math_application2_images.sql`（若未执行）。  
2. 前端 MathApplicationInput：上传 + payload `imageIds`。  
3. 结果/历史页用鉴权 API 展示 `images`。  

---

## 10. 阶段标记

| 项 | 状态 |
|---|---|
| **APPLICATION-2D** | **PASS**（代码+无 DB 自测；迁移未执行） |
| APPLICATION-2A/2B/2C | **PASS** |
| APPLICATION-1 | **PARTIAL** |
| CORE-1A-4B | **BLOCKED** |

**本轮停止。**
