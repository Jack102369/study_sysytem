# P1-FUNC · APPLICATION-2A 应用题图片元数据与私有存储基础

> **执行时间**：2026-10-25  
> **范围**：实体 + 迁移草案 + 私有存储/安全工具 + 无 DB 自测  
> **迁移执行**：**否**（NOT_EXECUTED）  
> **写库**：**否**  
> **APPLICATION-2A**：**PASS**  
> **APPLICATION-2B**：**NOT_STARTED**  
> **APPLICATION-1**：**PARTIAL**  
> **CORE-1A-4B**：**BLOCKED**

---

## 1. 新增实体

`HsMathTrainSessionItemImage` → 表 `hs_math_train_session_item_images`

| 字段 | 说明 |
|---|---|
| id | PK |
| session_item_id | FK → session_items **ON DELETE CASCADE** |
| user_id | 冗余隔离；FK → users ON DELETE CASCADE |
| storage_key | 唯一；相对路径 |
| mime_type | jpeg/png/webp |
| size_bytes | 字节 |
| sort_order | 同题顺序 |
| status | `draft` \| `submitted` |
| created_at / updated_at | |
| submitted_at | 提交锁定时间，可空 |

注册于 `hs-math.module.ts` TypeORM `forFeature`（**synchronize 仍禁止**）。

删除会话 → session_items CASCADE → **仅该会话图片行**级联删除；**不会**删其他用户行。磁盘孤儿由 2B+ 清理接口处理（本轮无定时任务）。

---

## 2. 迁移文件

| 文件 | 说明 |
|---|---|
| `db/migrate_hs_math_application2_images.sql` | 增量；`CREATE TABLE IF NOT EXISTS`；**未执行** |
| `db/init.sql` | 权威结构已同步同表定义（新库建表用） |

**回滚**（另授）：`DROP TABLE IF EXISTS hs_math_train_session_item_images;` + 另授磁盘清理。

若目标库**已存在同名表且结构不符**：停止人工比对，禁止静默 ALTER。

---

## 3. 私有存储

| 项 | 值 |
|---|---|
| 根目录 | `{cwd}/uploads/hs-math/application-answers/` |
| storage_key | `hs-math/application-answers/{userId}/{uuid}.bin` |
| 公开 static | **不**挂入 `useStaticAssets` |
| 写入 | `wx` 防覆盖；失败清理半成品 |
| 读/删 | 须经 `resolveSafeAbsolutePath` + realpath 边界 |

工具：`apps/api/src/hs-math/util/hs-math-application-image-storage.ts`

---

## 4. 安全校验

工具：`hs-math-application-image-security.ts`

| 检查 | 实现 |
|---|---|
| MIME 白名单 | jpeg / png / webp（`image/jpg`→jpeg） |
| 魔数 | JPEG SOI、PNG 签名、RIFF/WEBP |
| 空文件 / 10MB | 拒绝 |
| 单题 5 张 | `assertImageCountWithinLimit`（API 层 2B 调用） |
| 路径穿越 | `..`、绝对路径、非法 key 形状拒绝 |
| 依赖 | **无新增**；魔数自研，未装 sharp/file-type |

**能力说明**：头字节校验可挡常见伪装；不做完整图像解码（无新依赖）。2B 上传 API 须再调本校验。

---

## 5. 常量

`hs-math.constants.ts`：`HS_MATH_SESSION_IMAGE_STATUSES`、`HS_MATH_APPLICATION_IMAGE_*`、`HS_MATH_APPLICATION_IMAGE_STORAGE_ROOT`。

---

## 6. 静态测试

| 命令 | 结果 |
|---|---|
| `pnpm --filter api run hs-math:application2a-selftest` | **PASS** |

覆盖：storage_key、UUID、穿越拒绝、魔数、大小、状态枚举、wx 防覆盖、读写删（临时目录）。

---

## 7. 未做（留给 2B）

- 上传 / 下载 / 删除 HTTP API  
- JWT × session × image 三方校验接线  
- 扩展 `userAnswerPayload`  
- 前端组件  
- 执行 migration  

---

## 8. APPLICATION-2B 前置

1. 用户**授权执行** `migrate_hs_math_application2_images.sql`。  
2. 只读确认表结构符合预期。  
3. 实现鉴权上传/下载 API（仅属主；ADMIN 默认不可读）。  
4. draft 可删；submitted 锁定。

---

## 9. 阶段标记

| 项 | 状态 |
|---|---|
| **APPLICATION-2A** | **PASS** |
| APPLICATION-2B | **NOT_STARTED** |
| APPLICATION-1 | **PARTIAL** |
| CORE-1A-4B | **BLOCKED** |

**本轮停止。未执行迁移、未写业务库、未上传真实图片。**
