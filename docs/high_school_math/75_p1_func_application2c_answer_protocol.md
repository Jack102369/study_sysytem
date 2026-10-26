# P1-FUNC · APPLICATION-2C 应用题作答协议扩展（文/图/混合）

> **执行时间**：2026-10-25  
> **范围**：协议 + 校验 + 保存属主锁 + 删图引用保护 + 无 DB 自测  
> **迁移**：**NOT_EXECUTED**  
> **真实上传**：**否**  
> **APPLICATION-2C**：**PASS**  
> **APPLICATION-2A/2B**：**PASS**  
> **APPLICATION-1**：**PARTIAL**  
> **CORE-1A-4B**：**BLOCKED**

---

## 1. 新作答协议

```typescript
{
  kind: 'application'
  text?: string          // 非空 trim 视为有文字
  imageIds?: string[]    // 正整数 id 的十进制字符串；最多 5；唯一
}
```

| 模式 | 条件 |
|---|---|
| 纯文字 | `text` 非空；可无 `imageIds` |
| 纯图片 | `imageIds.length ≥ 1`；可无 `text` |
| 文图混合 | 二者皆有效 |

拒绝：`text` 空白且无图片；未知字段；非 application 带 `imageIds`。

持久化仍用 `user_answer_payload_json`（实体字段名）；**不**新增列。  
旧答案 `{ kind, text }` **继续有效**。

输入可接受 `imageIds: number[]`，规范为字符串 id（兼容 bigint）。

---

## 2. 图片归属校验（保存时）

事务内：

1. 锁 session（属主 + `in_progress`）  
2. 锁 session_item  
3. 若有 `imageIds`：`pessimistic_write` 锁对应图片行  
4. `verifyApplicationImagesForAnswer`：同 user、同 session_item、`status=draft`、全部找到  

跨用户 / 跨题 / 缺失 / submitted → **400**（统一「不存在或无权引用」类文案，不泄露细节到跨用户码对外时可统一）。

---

## 3. 并发一致性

| 场景 | 机制 |
|---|---|
| 并发保存引用已删图 | 锁图片行后查无 → 拒绝 |
| 保存后并发删图 | 删除前检测 `isImageIdReferencedInUserAnswer` → **409** |
| 上传与保存 | session_item 行锁串行；引用须已存在 draft |

**结论**：在现有 MySQL 行锁下可保证「不可引用已删图」「不可删已写入答案的图」；**无**新分布式组件。  
缺口：进程崩溃导致的磁盘孤儿仍由 2A/2B 策略处理，与作答 JSON 无关。

---

## 4. pending_ai

- `gradeApplication`：有文字或 `imageIds` → `pending_ai` / `awaiting_ai`  
- 无内容 → `pending_ai` / `unanswered`（不计 wrong）  
- **无**字符串比对、**无**假分数  
- `hasUserAnswerPayload` 与上述一致 → answered_count / accuracy 分母规则不变（pending 不计）

---

## 5. 旧答案与旧题型

| 项 | 结果 |
|---|---|
| 仅 text 的旧 application 答案 | 解析/判分/已作答判定兼容 |
| single/multi/judge/numeric | 不变；带 imageIds → 400 |

---

## 6. 修改文件

| 文件 | 变更 |
|---|---|
| `types/answer-protocol.ts` | application 用户作答扩展 |
| `util/user-answer.validate.ts` | 解析 text/imageIds |
| `util/hs-math-grade.ts` | pending_ai / hasAnswer |
| `util/hs-math-application-image-policy.ts` | 归属校验 + 引用检测 |
| `train/hs-math-train.service.ts` | saveAnswer 锁图校验 |
| `train/hs-math-application-images.service.ts` | 删图引用保护 |
| `util/hs-math-application2c.selftest.ts` | 新增 |
| `package.json` | `hs-math:application2c-selftest` |

---

## 7. 静态测试

| 命令 | 结果 |
|---|---|
| `hs-math:application2c-selftest` | **PASS** |
| `hs-math:application1-selftest` | **PASS** |
| `hs-math:application2b-selftest` | **PASS** |

覆盖：纯文/纯图/混合、空答案、重复/超 5/非整数、跨用户/跨题、非 application、引用保护、pending_ai、旧四题型。

**未执行**：迁移、真实上传、HTTP 联调。

---

## 8. APPLICATION-2D 前置

1. 授权执行 `migrate_hs_math_application2_images.sql`（若尚未执行）。  
2. 会话 **submit** 时将本题 draft 图片 → `submitted`（锁定）。  
3. 结果/历史展示 imageIds（鉴权读图）。  
4. 前端 MathApplicationInput 绑定文+图（2E）。

---

## 9. 阶段标记

| 项 | 状态 |
|---|---|
| **APPLICATION-2C** | **PASS** |
| APPLICATION-2A/2B | **PASS** |
| APPLICATION-2D | **NOT_STARTED** |
| APPLICATION-1 | **PARTIAL** |
| CORE-1A-4B | **BLOCKED** |

**本轮停止。**
