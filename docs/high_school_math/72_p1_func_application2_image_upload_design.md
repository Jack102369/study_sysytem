# P1-FUNC · APPLICATION-2 应用题手写解答图片上传 · 方案设计

> **日期**：2026-10-25  
> **范围**：方案核对与实施准备（**无代码 / 无写库 / 无迁移执行**）  
> **APPLICATION-1**：**PARTIAL**（API/DB PASS；UI NOT_RUN）  
> **APPLICATION-2**：**NOT_STARTED**（本文仅为设计，**未**开工实现）  
> **APPLICATION-3**（多模态 AI）：**未启动**（本文仅预留契约）  
> **CORE-1A-4B**：**BLOCKED**

---

## 1. 目标与需求摘要

| # | 需求 |
|---|---|
| 1 | 纯文字 / 纯图片 / 文字+图片 |
| 2 | 最多 **5** 张；JPG / PNG / WebP |
| 3 | 单张 **≤10MB** |
| 4 | 上传预览、删除未提交图、多图顺序展示 |
| 5 | 支持手机拍照（`<input accept="image/*" capture>`） |
| 6 | 安全：用户隔离、绑定 session_item、不可猜路径、禁路径穿越、禁脚本伪装 |
| 7 | **不得**经 `/uploads` 公开静态目录直接访问 |
| 8 | 本轮 **不** 调用外部 AI、不发送真实学生图片 |

---

## 2. 现有基础设施核对

### 2.1 已有能力

| 能力 | 现状 | 可否直接用于 APPLICATION-2 |
|---|---|---|
| 上传 API | `POST /attachments/upload`（`AttachmentsController`） | **不可直接复用**（见安全） |
| 存储 | 本地 `process.cwd()/uploads`，multer `diskStorage` | **复用模式**，换私有子目录 |
| 元数据 | 表 `attachments`（`user_id`, `url`, `mime_type`, …） | **不绑定 session_item**；错题本等通用 |
| 鉴权上传 | JWT `JwtAuthGuard` | **复用** |
| 鉴权下载 | `main.ts` → `useStaticAssets(uploads, '/uploads')` **无用户校验** | **禁止用于学生解答图** |
| MIME 校验 | 仅记录 `file.mimetype`，无白名单 / 魔数 | **需加强** |
| 大小限制 | `ATTACHMENT_MAX_BYTES = 500MB`（全局） | **需 APPLICATION-2 专用 10MB** |
| 删除 | 无通用 DELETE；错题本仅 `unlink` 关联 | **需新增** hs-math 生命周期删除 |
| 前端 | `uploadAttachment()` + `fileUrl()` 拼公开 URL | **不可用于 hs-math 私有图** |

### 2.2 结论（是否重复建设）

- **复用**：Nest + multer 上传模式、`JwtAuthGuard`、本地磁盘存储习惯、`TypeORM` 实体风格。  
- **新建**：高一数学专用 **私有存储路径**、**鉴权下载 API**、**session_item 图片元数据表**、**application 作答协议扩展**、**前端 `MathApplicationInput` 图片区**。  
- **不**把应用题图片挂到现有 `POST /attachments/upload` + `/uploads/{filename}` 公开链路上。

---

## 3. 推荐存储方案

### 3.1 目录与 storage_key

```
{API_ROOT}/uploads/hs-math/application-answers/{userId}/{uuid}.bin
```

- 磁盘文件名 **不含**用户可控扩展名；扩展名仅存在于 DB `mime_type`。  
- DB 字段 `storage_key`：相对 API 根的路径片段，例如 `hs-math/application-answers/2/550e8400-e29b-41d4-a716-446655440000.bin`。  
- **不**写入 `url` 为可猜的 `/uploads/...` 公开路径；对外仅 opaque `imageId`（表主键）。

### 3.2 读取方式

- **唯一对外**：`GET /hs-math/train/session-items/:sessionItemId/images/:imageId`  
  - JWT + 校验 `session.user_id === 当前用户`（及可选 ADMIN 只读策略，另议）。  
  - `Content-Type` 来自 DB；`Content-Disposition: inline`。  
  - 响应体从 `storage_key` 读文件；**不**返回绝对路径。  
- **禁止**将该目录加入 `useStaticAssets`。

### 3.3 上传校验（防伪装）

1. **声明 MIME** 白名单：`image/jpeg`, `image/png`, `image/webp`。  
2. **魔数**检测（读取文件头），与声明 MIME 一致才落盘。  
3. multer `limits.fileSize: 10 * 1024 * 1024`。  
4. 拒绝 `svg`、`html`、双扩展名等；上传后文件名由服务端 UUID 决定。

---

## 4. 数据库设计（草案 · 仅 migration 文件，不执行）

### 4.1 新表 `hs_math_train_session_item_images`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | BIGINT PK | 对外 imageId |
| session_item_id | BIGINT NOT NULL | FK → `hs_math_train_session_items.id` ON DELETE CASCADE |
| user_id | BIGINT NOT NULL | 冗余隔离，FK → users；与 session 所属用户一致 |
| storage_key | VARCHAR(512) NOT NULL | 私有相对路径，唯一 |
| mime_type | VARCHAR(64) NOT NULL | image/jpeg \| png \| webp |
| size_bytes | INT UNSIGNED NOT NULL | 文件大小 |
| sort_order | INT UNSIGNED NOT NULL | 1…5，同 session_item 内顺序 |
| status | ENUM | `draft` \| `submitted`（提交会话后锁定） |
| created_at | DATETIME(3) | |
| submitted_at | DATETIME(3) NULL | 随会话 submit 写入 |

索引建议：

- `UNIQUE (session_item_id, sort_order)` 仅在 status=draft 时由业务保证重排；或 `(session_item_id, id)` + 应用层排序。  
- `KEY (user_id, status, created_at)` 便于孤儿清理。  
- `UNIQUE (storage_key)`。

**不**使用 `synchronize`；新增 `db/migrate_hs_math_application2_images.sql`（实施阶段编写，**本轮不执行**）。

### 4.2 与 `attachments` 表关系

- **不**混用 `attachments` 作为 session_item 绑定（避免与错题本公开 URL 语义耦合）。  
- 若未来统一对象存储，可抽象 `StorageDriver`，P0 仍本地盘。

---

## 5. 与 APPLICATION-1 的兼容

### 5.1 扩展 `user_answer_payload_json`（application）

当前（APP-1）：

```typescript
{ kind: 'application', text: string }  // text 非空必填
```

建议（APP-2，向后兼容）：

```typescript
{
  kind: 'application'
  text?: string           // 可空字符串；与图片至少其一
  imageIds?: string[]     // 有序，长度 0…5；以 DB 关联为准时可省略，仅作快照
}
```

**有效作答规则**（与 `hasUserAnswerPayload` / `gradeApplication` 对齐）：

- `text.trim()` 非空 **或** 已绑定 `submitted` 前 `draft` 图片 ≥1 → 视为已作答。  
- 提交会话时：若两者皆空 → `pending_ai` + `unanswered`（与 APP-1 一致，**不计 wrong**）。  
- 有文字和/或图片 → `pending_ai` + `awaiting_ai`（**仍不伪造分数**）。

### 5.2 保存答案 API

- 仍用 `PATCH /hs-math/train/sessions/:id/answers` 传 `userAnswerPayload`。  
- **图片文件**不走 JSON：先 `POST .../images` 上传，再在 payload 中带 `imageIds` 顺序（或仅依赖关联表 sort_order，save 时服务端校验集合一致）。  
- **已完成会话**：现有 `ConflictException`「任务已结束」→ **同样禁止** 上传/删图/改 payload（409）。

### 5.3 pending_ai

- 逻辑不变：不字符串比对、不调 AI。  
- 图片仅影响「是否已作答」与 APPLICATION-3 输入素材，**不改变** correct/wrong/pending_count 规则（仍为 pending）。

### 5.4 历史与结果展示

- `getSessionForUser` 在 `reveal=true` 时：  
  - 返回 `userAnswerPayloadJson`（含 text）。  
  - 图片列表：`[{ imageId, sortOrder, mimeType }]`，**不含** storage_key。  
  - 前端用鉴权 GET 拉 blob / object URL 展示。  
- 列表历史摘要仍不含图片二进制（与 APP-1 一致）。

### 5.5 防重复与孤儿清理

| 场景 | 规则 |
|---|---|
| 同 session_item 超过 5 张 draft | 上传拒绝 400 |
| 重复 submit | 已有 idempotent；图片 status 已是 submitted 不可删 |
| 未提交孤儿 | `status=draft` 且 `session_item` 仍 in_progress，用户 DELETE 图片 API；定时任务删除 `draft` 且 `created_at` 超过 24h 且 session 已 cancel 或 item 无引用的记录（实施阶段定具体 SQL） |
| 会话 submit | 将该 session 下所有 draft 图片 → `submitted`，写 `submitted_at` |

---

## 6. 需要新增的 API（建议）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/hs-math/train/sessions/:sessionId/items/:sortOrder/images` | multipart 上传一张；校验 in_progress、≤5、10MB、MIME |
| GET | `/hs-math/train/sessions/:sessionId/items/:sortOrder/images` | 列出 draft/submitted 元数据（无路径） |
| PATCH | `/hs-math/train/sessions/:sessionId/items/:sortOrder/images/order` | 调整 sort_order（仅 draft） |
| DELETE | `/hs-math/train/sessions/:sessionId/items/:sortOrder/images/:imageId` | 仅 draft + 属主 |
| GET | `/hs-math/train/session-items/:sessionItemId/images/:imageId` | **二进制下载**（JWT + 属主） |

说明：`sessionItemId` 用表主键 id，便于结果页 deep link；上传阶段可用 sessionId + sortOrder 解析出 session_item_id。

**不修改**旧四题型 API。

---

## 7. 前端组件（实施阶段）

| 组件/页面 | 变更 |
|---|---|
| `MathApplicationInput.vue` | 增加图片列表、上传、预览、删除、拖拽排序（可选 P1 仅按钮排序） |
| `HsMathTrainSessionView.vue` | 绑定 sessionId/sortOrder 调上传 API；save 时 payload 含 text + imageIds |
| `HsMathTrainResultView.vue` | 展示文字 + 鉴权加载图片缩略图 |
| `apps/web/src/api/hs-math-train.ts` | 新增 images 相关类型与方法 |
| 手机拍照 | `<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment">` |

**不**复用 `uploadAttachment()` / 公开 `fileUrl()`。

---

## 8. 图片访问权限设计（摘要）

```
上传 → 校验 JWT.userId === session.userId
     → 校验 session.status === in_progress
     → 校验 session_item 属于 session
     → 写 DB + 私有文件

下载 → JWT
     → image.user_id === 当前用户
     → image.session_item_id 所属 session.user_id === 当前用户
     → 读 storage_key（realpath 校验在 API 根下，防 ../）
```

- 不使用可猜测的连续 id 暴露内容：**必须**带 JWT；id 枚举风险由属主校验挡住。  
- ADMIN 是否可读学生图：默认 **否**（隐私）；若批改台需要，单独授权与审计（APPLICATION-3 内部服务账号读盘，不走公开 HTTP）。

---

## 9. APPLICATION-3（AI）接口契约（预留）

**本轮不实现。**

内部接口（示意）：

```typescript
type HsMathApplicationAiGradeInput = {
  sessionItemId: string
  userId: string
  standardAnswer: string
  rubric: HsMathApplicationRubricItem[]
  userText: string | null
  images: Array<{
    imageId: string
    sortOrder: number
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
    /** 服务端从 storage_key 读取，转 base64 或内存 Buffer；不经过公网 URL */
    bytes: Buffer
  }>
}
```

- 仅在内网/进程内调用；**禁止**把 `storage_key` 或 `/uploads` URL 发给 DeepSeek 等外网（除非用户单独授权且走合规通道）。  
- 输出仍写 `grade_result` / 分项 rubric 分（APPLICATION-3 阶段定义）。

---

## 10. APPLICATION-2 分阶段实施步骤

| 阶段 | 内容 | 依赖 |
|---|---|---|
| **2A** | migration 草案 + Entity；私有目录约定 | 用户授权执行迁移 |
| **2B** | 上传 / 列表 / 删除 / 排序 API + 魔数校验 | 2A |
| **2C** | 扩展 `user-answer.validate` / `hasUserAnswerPayload` / `gradeApplication` | 2B |
| **2D** | `saveAnswer` 与 submit 时 status=submitted；409 已完成 | 2C |
| **2E** | 前端 MathApplicationInput + Session/Result | 2D |
| **2F** | 孤儿 draft 清理 job + 文档验收 | 2E |
| **2G** | HTTP 验收报告（类似 71）；**仍不**做浏览器自动化 | 2F |

**APPLICATION-1 UI 点验**可与 2E 并行，但不阻塞 2A–2D 后端开发（需单独授权）。

---

## 11. 需要用户授权的操作

1. **执行** `migrate_hs_math_application2_images.sql`（及 `init.sql` 同步）。  
2. **开始** APPLICATION-2 代码实现（2A 起）。  
3. 是否允许 **ADMIN** 在管理端查看学生提交图片（默认建议否，APPLICATION-3 用内部服务读）。  
4. 生产部署时 **私有目录**备份与磁盘配额策略。  
5. APPLICATION-3 时再授权：外网多模态 API、数据出境与留存策略。

---

## 12. 风险与未决项

| 风险 | 缓解 |
|---|---|
| 现有 `/uploads` 公开访问习惯与隐私冲突 | hs-math 走独立私有路径 + 鉴权 GET |
| 500MB 全局上传上限误导 | APP-2 控制器内单独 10MB |
| session_item 删除 CASCADE | 图片表 ON DELETE CASCADE |
| 纯图片 OCR 前置 | APPLICATION-3；APP-2 仅存储与展示 |
| 磁盘占满 | 清理 job + 监控（运维） |

---

## 13. 阶段标记

| 项 | 状态 |
|---|---|
| 本文（方案） | **完成** |
| APPLICATION-2 实现 | **NOT_STARTED** |
| APPLICATION-1 | **PARTIAL** |
| CORE-1A-4B | **BLOCKED** |

**本轮停止。无代码、无写库、无迁移执行。**
