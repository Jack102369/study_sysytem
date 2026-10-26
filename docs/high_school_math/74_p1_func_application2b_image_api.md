# P1-FUNC · APPLICATION-2B 应用题图片上传/列表/读取/删除 API

> **执行时间**：2026-10-25  
> **范围**：业务 API + 策略自测（**无**迁移执行、**无**真实上传、**无**写库验收）  
> **APPLICATION-2B**：**PASS**（代码与静态自测；运行时依赖 2A 迁移落地）  
> **APPLICATION-2A**：**PASS**  
> **APPLICATION-1**：**PARTIAL**  
> **CORE-1A-4B**：**BLOCKED**

---

## 1. 新增 API

均需 JWT；挂在 `HsMathTrainController`（`/hs-math/train`）。

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/sessions/:sessionId/items/:sessionItemId/images` | multipart `file`；返回公开元数据 |
| GET | `/sessions/:sessionId/items/:sessionItemId/images` | 列表（无 storage_key） |
| GET | `/sessions/:sessionId/items/:sessionItemId/images/:imageId` | 二进制；`Content-Type` + `Cache-Control: private, no-store` |
| DELETE | `/sessions/:sessionId/items/:sessionItemId/images/:imageId` | 仅 draft + session in_progress |

跨用户 / 错绑：**NotFoundException**（不泄露是否存在）。  
ADMIN **不**自动越权。

---

## 2. 修改文件列表

| 文件 | 变更 |
|---|---|
| `train/hs-math-application-images.service.ts` | **新增** Service |
| `util/hs-math-application-image-policy.ts` | **新增** 属主/上传/删除/视图纯函数 |
| `train/hs-math-train.controller.ts` | 注册 4 路由 + multer memory 10MB |
| `hs-math.module.ts` | 注册 Provider / export |
| `util/hs-math-application2b.selftest.ts` | **新增** 自测 |
| `apps/api/package.json` | `hs-math:application2b-selftest` |

---

## 3. 上传安全

1. multer `memoryStorage` + `limits.fileSize = 10MB`  
2. `validateApplicationImageBuffer`：空文件、大小、MIME 白名单、魔数  
3. 仅 `qtype=application` 且 `session.status=in_progress`  
4. 服务端生成 `storage_key`（UUID `.bin`）；不存原始文件名  
5. 私有目录写入（`wx` 防覆盖）  
6. 落库 `status=draft`

---

## 4. JWT 属主校验

每次操作校验：

`jwt.userId === session.userId`  
且 `sessionItem.sessionId === sessionId`  
且（读/删时）`image.userId === jwt` 且 `image.sessionItemId === sessionItemId`

策略函数：`assertImageOwnershipMatches`。

---

## 5. 图片读取

- 鉴权 GET → `readApplicationImageFile(storage_key)`  
- 响应二进制 + 正确 MIME  
- **不**走 `useStaticAssets` / `/uploads` 公开链  
- 响应体**不含** storage_key

---

## 6. draft 删除规则

| 条件 | 结果 |
|---|---|
| session = in_progress 且 status = draft | 允许：先删 DB 行，再删磁盘 |
| status = submitted | 400 NOT_DRAFT |
| session 已 completed/cancelled | 409 SESSION_LOCKED |

失败策略：DB 已删而磁盘失败 → 仅磁盘孤儿（列表不可见）；上传则相反：DB 失败必删刚写文件。

---

## 7. 并发数量控制

事务内：

1. `pessimistic_write` 锁 **session** + **session_item**  
2. 再锁该 item 下全部 **image** 行并 COUNT  
3. `>= 5` → 400  
4. 写盘 → INSERT  

不引入分布式锁；依赖 MySQL 行锁串行化同题上传。

---

## 8. 失败清理

| 阶段 | 策略 |
|---|---|
| 写盘失败 | storage 层清理半成品 |
| 写盘成功、INSERT 失败 | 立即 `deleteApplicationImageFile` |
| 事务外兜底 | catch 再删 writtenKey |
| 删除：DB 成功、文件失败 | 接受磁盘孤儿；不回滚元数据（避免已删图复活） |

---

## 9. 静态测试

| 命令 | 结果 |
|---|---|
| `hs-math:application2b-selftest` | **PASS** |
| `hs-math:application2a-selftest` | **PASS** |
| `hs-math:application1-selftest` | **PASS** |

覆盖属主拒绝、非 application、会话关闭、MIME/魔数/大小、满 5 张、draft/submitted 删除、视图无密钥、临时盘写删清理。

**未**跑：需迁移的 HTTP IT、真实 multipart 上传。

---

## 10. 迁移 / 真实上传

| 项 | 状态 |
|---|---|
| 执行 migration | **否** |
| 真实上传验收 | **否** |
| 写业务库 | **否** |

运行库尚无 `hs_math_train_session_item_images` 时，API 会因缺表失败——属预期，待授权执行 2A 迁移后再做 HTTP 验收。

---

## 11. APPLICATION-2C 前置

1. **授权执行** `migrate_hs_math_application2_images.sql` 并只读确认结构。  
2. 扩展 `user_answer_payload`：纯图 / 文+图（2C）。  
3. submit 时 draft→submitted（2D）。  
4. 前端组件（2E）另授。

---

## 12. 阶段标记

| 项 | 状态 |
|---|---|
| **APPLICATION-2B** | **PASS** |
| APPLICATION-2A | **PASS** |
| APPLICATION-2C+ | **NOT_STARTED** |
| APPLICATION-1 | **PARTIAL** |
| CORE-1A-4B | **BLOCKED** |

**本轮停止。**
