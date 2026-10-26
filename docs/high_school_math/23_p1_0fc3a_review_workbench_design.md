# P1-0F-C3A：高一数学管理员人工审核工作台设计

> 阶段性质：**仅设计**。不执行迁移、不开发完整工作台、不批准任何题目。  
> 数据库：仅 `study_system`。人工审核通过 ≠ `hs_math_train_items.status=approved`。

---

## 1. 现有功能审查

### 1.1 前端（可复用）

| 资产 | 路径 | 复用方式 |
|------|------|----------|
| 题库管理页 | `apps/web/src/views/settings/hs-math/HsMathTrainItemsAdminView.vue` | **参考**列表/筛选/编辑对话框；**不**在审核台复用「一键批准」交互 |
| 导入预览页 | `HsMathTrainItemsImportView.vue` | 复用 MathStem 预览模式 |
| KaTeX | `utils/render-math.ts` + `components/hs-math/MathStem.vue` / `MathOptionList.vue` | **直接复用**题干/选项/解析渲染 |
| 管理 API 客户端 | `apps/web/src/api/hs-math-admin.ts` | 扩展 review / publish 新方法；现有 list/get/status 保留 |
| 路由/布局 | `router/index.ts` + SettingsLayout | 新增 `settings/hs-math-train-review` |
| JWT / ADMIN 路由守卫 | 现有 settings 需 ADMIN | **不改**公共 Guard |

**缺口（必须新建，不可假装已有）：**

- 无独立「审核工作台」路由与页面。  
- 现题库页对 draft 可直接点「批准」→ 调用 `PATCH .../status`，**无**强制「当前版本人工审核通过」前置。  
- 无审核意见持久化、无审核历史列表、无指纹失效提示 UI。  
- `human_review_section_1_1.json` 仅为文件侧记录，前端未接入。

### 1.2 后端（可复用）

| 资产 | 说明 | 复用 |
|------|------|------|
| `HsMathAdminTrainItemsController` | JWT + AdminGuard；CRUD；`PATCH :id/status` | 列表/详情复用；**批准逻辑需加强门禁** |
| `assertApproveQualityGate` | 解析/KP/前缀/池/归属等结构门禁 | **保留并叠加**「有效人工审核」条件 |
| `canonicalizeImportItem` + `fingerprintCanonicalItem` | 内容指纹（键序无关） | **审核绑定与失效的权威算法** |
| `content_version` / `reviewed_by` / `reviewed_at` | 已在 `hs_math_train_items` | `content_version` 继续用；`reviewed_*` **重定义为正式批准人/时间**，与人工审核表分离 |
| 学生抽题 | 仅 `status=approved` + `isActive` + `pool=formal` | **不改**；保证未发布题进不了训练池 |
| 导入 preview/confirm | 只写 draft | 不变 |

### 1.3 身份机制

- `JwtAuthGuard` 解析 `sub`；`AdminGuard` 再查库确认 `role=ADMIN`。  
- 审核人 **必须**取自 `request.user.sub`（服务端），禁止信任 body 中的 `reviewerId`。  
- 审核时间 **必须** `NOW()` / `new Date()` 服务端生成。

### 1.4 数据现状（兼容背景）

- 正式题：80 draft + 5 P0 disabled；`approved formal = 0`。  
- `human_review_section_1_1.json`：16 题全部 **PENDING**（无真实具名通过记录可导入）。  
- 文件侧代理复核 ≠ 人工审核；**禁止**导入为 DB `passed`。

---

## 2. 管理员审核页面设计

### 2.1 路由

- 路径：`/settings/hs-math-train-review`  
- name：`settings-hs-math-train-review`  
- 权限：与其他 settings/hs-math 相同（ADMIN）  
- 导航：SettingsLayout「高一数学」下增加「题目人工审核」；题库页增加入口链接。

### 2.2 信息架构（一页双栏）

```
┌──────────────┬────────────────────────────────────────┐
│ 筛选 + 列表   │ 题目完整预览 + 审核操作 + 历史           │
└──────────────┴────────────────────────────────────────┘
```

**左栏 — 待办列表**

- 默认：`item.status=draft` 且「无当前版本有效 passed 审核」。  
- 筛选：章节 specialty、小节 category、qtype、difficulty、  
  - 审核态：`needs_review` / `passed_pending_publish` / `deferred` / `returned` / `stale`  
  - 题目 status：draft / approved / disabled（默认 draft）  
- 列：code、小节、题型、难度、最新审核态、content_version、是否指纹失效。

**右栏 — 预览（只读题目内容）**

1. code / 章节 / 小节 / 题型 / 难度 / pool / item.status / content_version  
2. 题干：`MathStem`  
3. 选项：`MathOptionList`（judge/numeric 无选项则隐藏）  
4. 标准答案：结构化展示（与训练结果页同类）  
5. 解析：`MathStem`  
6. KP 列表（主 KP 标记）  
7. **版本条**：当前指纹摘要 + 若存在旧 passed 且指纹/版本不一致 → 红色「审核已失效（STALE）」  

**审核操作区（与「正式发布」分离）**

| 按钮 | 写入 review_status | 说明 |
|------|-------------------|------|
| 人工审核通过 | `passed` | 意见必填（建议 ≥8 字）；二次确认文案强调「不等于进入学生题池」 |
| 退回修改 | `returned` | 意见必填 |
| 暂缓 | `deferred` | 意见可选但建议填写 |
| （隐式） | — | 不提供「取消他人审核」给非特权；新审核追加历史 |

**正式批准发布区（独立卡片）**

- 仅当：`item.status=draft` 且存在**当前版本有效** `passed` 审核。  
- 按钮：「正式批准并发布到训练池」  
- **二次确认**：`ElMessageBox.confirm`，文案含 code + content_version。  
- 调用独立 publish API（见 §3），**不是**旧的无审核校验的一键批准（旧入口需改造，见 §11）。

**审核历史**

- 时间倒序列表：审核人显示名、时间、status、意见、当时 content_version、指纹前 12 位、是否仍匹配当前题。

### 2.3 明确禁止的 UI 行为

- 前端不可编辑/提交 `reviewerUserId` / `reviewedAt`。  
- 「审核通过」按钮不得调用 `status=approved`。  
- 无有效审核时，「正式批准」禁用并说明原因。

---

## 3. API 设计

前缀：`/hs-math/admin/...`，一律 `JwtAuthGuard` + `AdminGuard`。

### 3.1 审核队列与详情

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/train-items/review-queue` | 分页列表 + 筛选；返回最新审核摘要、是否 stale、是否可 publish |
| GET | `/train-items/:id/review-panel` | 题目完整视图 + KP + 当前指纹 + 历史 reviews |

### 3.2 提交审核（仅写审核表）

| 方法 | 路径 | Body |
|------|------|------|
| POST | `/train-items/:id/reviews` | `{ decision: 'passed'\|'returned'\|'deferred', comment: string }` |

服务端行为：

1. 锁题目行（`SELECT ... FOR UPDATE`）。  
2. 计算当前内容指纹（含 KP，与导入 canonicalize 同构）。  
3. 插入 `hs_math_train_item_reviews`：`reviewer_user_id = JWT.sub`，`reviewed_at = NOW(3)`，绑定 `content_version` + `content_fingerprint`。  
4. **不**修改 `hs_math_train_items.status`。  
5. 返回新 review 记录。

拒绝：空意见（passed/returned）；非 draft 是否允许审核 —— **建议允许**对 draft/disabled 审核，但对 **已 approved** 题目提交 `passed` 应拒绝或仅允许 `returned` 触发「需回 draft」流程（实施期二选一，推荐：approved 题须先退回 draft 再审，避免双轨）。

### 3.3 正式发布（批准）

| 方法 | 路径 | Body |
|------|------|------|
| POST | `/train-items/:id/publish` | `{ confirm: true }`（强制二次确认标记） |

或演进现有：

| 方法 | 路径 | 变更 |
|------|------|------|
| PATCH | `/train-items/:id/status` | 当 `status=approved` 时 **新增**「有效人工审核」门禁 + 事务锁 |

**推荐**：新增 `POST .../publish`，旧 `PATCH status→approved` 在实施阶段改为调用同一门禁，避免绕过。

服务端（事务）：

1. `FOR UPDATE` 锁 item。  
2. 断言 `status=draft`、`pool≠test`、质量门禁。  
3. 取**最新** `passed` 且 `content_version` 与 `content_fingerprint` 均匹配当前题的审核行；否则 400。  
4. 设 `status=approved`，`is_active=1`，`reviewed_by=JWT.sub`，`reviewed_at=NOW`（此处语义=**发布人**）。  
5. Commit。

### 3.4 响应字段约定

- 列表项增加：`latestReviewStatus`、`latestReviewAt`、`reviewStale`、`publishReady`。  
- 不返回 JWT、不返回 DB 密码、指纹可全量返回便于对账。

---

## 4. 审核数据模型

### 4.1 新表 `hs_math_train_item_reviews`（独立历史表）

与题目表解耦：题目修改**不删除**旧审核行。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT UNSIGNED PK AI | review_id |
| item_id | BIGINT UNSIGNED NOT NULL | FK → hs_math_train_items(id) ON DELETE RESTRICT |
| content_version | INT NOT NULL | 审核时题目版本 |
| content_fingerprint | CHAR(64) NOT NULL | SHA-256 hex |
| reviewer_user_id | BIGINT UNSIGNED NOT NULL | FK → users(id) |
| review_status | VARCHAR(32) NOT NULL | `passed` / `returned` / `deferred` |
| review_comment | TEXT NOT NULL | 审核意见 |
| reviewed_at | DATETIME(3) NOT NULL | 服务端时间 |
| created_at | DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) |

索引建议：

- `KEY idx_hs_math_review_item_time (item_id, reviewed_at)`  
- `KEY idx_hs_math_review_item_status (item_id, review_status, reviewed_at)`  
- `KEY idx_hs_math_review_reviewer (reviewer_user_id, reviewed_at)`

**不**建「每题唯一 passed」唯一索引（允许多次通过历史）；「当前有效」由查询逻辑判定。

### 4.2 题目表字段语义调整（无删列）

| 字段 | 新语义 |
|------|--------|
| content_version | 实质内容/KP 变更时 +1（已有逻辑保留并确保 KP 替换也 +1） |
| reviewed_by / reviewed_at | **仅正式 publish/批准**写入；不是人工审题意见载体 |

可选后续（非本阶段必须）：`hs_math_train_items` 增加生成列/缓存 `latest_review_status` —— **不推荐**首版，以免双写；首版实时 join/子查询即可。

### 4.3 审核状态 vs 题目状态

| 概念 | 存储 | 学生可见抽题 |
|------|------|--------------|
| 人工审核 passed | reviews 表 | 否 |
| 退回 returned | reviews 表 | 否 |
| 暂缓 deferred | reviews 表 | 否 |
| 正式 approved | items.status | 是（若 is_active） |
| draft | items.status | 否 |

---

## 5. 数据库迁移草案（NOT_EXECUTED）

文件建议名：`db/migrate_hs_math_p1_0fc3_reviews.sql`（**本阶段只设计，不执行、不改 init 除非后续实施阶段批准**）。

```sql
-- DRAFT ONLY — DO NOT EXECUTE IN P1-0F-C3A
USE study_system;

CREATE TABLE IF NOT EXISTS hs_math_train_item_reviews (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  item_id BIGINT UNSIGNED NOT NULL,
  content_version INT NOT NULL,
  content_fingerprint CHAR(64) NOT NULL,
  reviewer_user_id BIGINT UNSIGNED NOT NULL,
  review_status VARCHAR(32) NOT NULL COMMENT 'passed|returned|deferred',
  review_comment TEXT NOT NULL,
  reviewed_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_hs_math_review_item_time (item_id, reviewed_at),
  KEY idx_hs_math_review_item_status (item_id, review_status, reviewed_at),
  KEY idx_hs_math_review_reviewer (reviewer_user_id, reviewed_at),
  CONSTRAINT fk_hs_math_review_item
    FOREIGN KEY (item_id) REFERENCES hs_math_train_items(id),
  CONSTRAINT fk_hs_math_review_user
    FOREIGN KEY (reviewer_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

约束：

- 仅新增 `hs_math_*` 表。  
- 不改 chemistry / 错题本 / 小学数学表。  
- 不改 `.env` / 连接。  
- **P1-0F-C3A：NOT_EXECUTED。**

同步：实施阶段再更新 `db/init.sql` 权威结构（需单独确认）。

---

## 6. 审核与批准状态流转

```
[导入/新建] → item.status=draft
       │
       ▼
  审核台阅读题目
       │
       ├─► reviews.passed  ──(版本仍匹配)──► publishReady
       │         │                              │
       │         │  题目/KP 被修改               ▼
       │         │  content_version++      POST publish
       │         │  指纹变化                     │
       │         ▼                              ▼
       │    旧 passed → 逻辑 STALE         item.status=approved
       │    需重新审核                      （学生可抽）
       │
       ├─► reviews.returned → 编辑题目 → 再审
       └─► reviews.deferred → 稍后继续
```

要点：

- `passed` **永不**自动改 `items.status`。  
- `approved` **永不**由审核 POST 触发。  
- 从 `approved` 改实质内容 → 已有逻辑回 `draft` 并升版本 → 旧审核 STALE → 须重审再 publish。

---

## 7. 内容版本及指纹绑定方案

### 7.1 指纹输入（与导入幂等一致）

对 DB 题目组装与 `canonicalizeImportItem` 同构对象后 `fingerprintCanonicalItem`：

- code, specialtyCode, categoryCode, qtype, difficulty  
- stem, options（答案协议规范化后）, answerPayload（规范化后）  
- analysis, knowledgePointCodes（排序）, primaryKnowledgePointCode  
- pool=`formal`

**KP 变更必须计入指纹**（已含）。选项/答案经 `validateAnswerPayload` 再指纹，避免 JSON 键序误报。

### 7.2 有效审核判定

```
effectivePassed(item) :=
  exists review where
    review.item_id = item.id
    AND review.review_status = 'passed'
    AND review.content_version = item.content_version
    AND review.content_fingerprint = fingerprint(item)
  取 reviewed_at 最新一条即可用于展示；存在任意一条匹配即 publishReady
```

任一不等 → UI 标 STALE；不可 publish。

### 7.3 何时升高 content_version

已有：题干/选项/答案/qtype 实质变更。  
实施时确认：**替换 KP（PUT knowledge-points）** 也必须 +1（若尚未，属缺口，实施阶段补齐）。

---

## 8. 并发与事务设计

| 场景 | 策略 |
|------|------|
| 审通过 vs 同时改题 | 审：锁 item → 算指纹 → insert review（绑定当时版本）。改题：锁 item → 改内容 → version++。旧 review 自然 STALE。 |
| 发布 vs 同时改题 | publish：锁 item → 再算指纹 → 查有效 passed → 更新 status。若中途被改，指纹/版本对不上则失败。 |
| 双管理员同时 publish | 行锁串行；第二人发现已是 approved → 幂等或 409。 |
| TOCTOU | 禁止「先查后改无锁」；一律事务内 `FOR UPDATE`。 |

不在应用层用「前端传来的 fingerprint」作为信任源；可作乐观提示，服务端重算。

---

## 9. 权限与安全设计

- 所有审核/发布 API：AdminGuard；审核人=JWT.sub。  
- Body 中的 reviewerId / reviewedAt **忽略或 400**。  
- 意见长度上限（如 2000 字）防滥用。  
- 审计：reviews 表即审计日志；publish 写 items.reviewed_*。  
- 不把文件 JSON 的 PENDING/代理结论写成 passed。  
- 学生 API 零改动前提下，未 approved 不可抽题（已有）。

---

## 10. 现有 80 道 draft 与文件审核的兼容

| 来源 | 处理 |
|------|------|
| 80 draft | 迁移后全部进入「待审核」队列；无 reviews 行 |
| `human_review_section_1_1.json` | **不自动导入**为 DB passed；保留作参考。未来若用户在工作台审过，以 DB 为准 |
| `review_section_1_1.md` / review_book | 只读参考链接，可在审核台「打开教材审核册」外链 |
| Cursor 代理复核 | 可只读展示「代理备注」字段（可选，来自文件），**禁止**一键采纳为 passed |
| 聊天中未完成的 C3 人工结论 | 须用户在工作台用 JWT 身份重做；或实施阶段提供「管理员确认导入」且仅导入用户明确授权过的 code（另立项） |

首版推荐：**零迁移文件数据**，避免伪造审核人/时间。

---

## 11. 实施阶段划分（后续，非本阶段）

| 阶段 | 内容 | 停点 |
|------|------|------|
| C3B | 执行迁移 + Entity/Module；指纹服务抽取；publish 门禁加固；**禁用**旧页无审核批准或改走新门禁 | 迁移需用户授权 |
| C3C | 审核 API + 工作台页面 + 路由/导航 | 不批量批准 |
| C3D | 1.1 在工作台完成具名审核 → 用户授权后单题/清单 publish | 显式授权 |
| C3E | 其余小节批次 | — |

P1-0F-C3A **止于设计文档**。

---

## 12. 风险与验收标准

### 风险

1. 旧题库页「批准」绕过审核 → 实施时必须堵。  
2. KP 变更未升 version → 指纹/版本不一致漏洞。  
3. 误把文件 APPROVED 当 DB 审核 → 禁止自动导入。  
4. `reviewed_by` 语义混淆（审题人 vs 发布人）→ 文档与 UI 文案区分；审题人只在 reviews 表。  
5. 迁移误执行 → 本阶段明确 NOT_EXECUTED。

### 设计验收（本阶段）

- [x] 复用点与缺口列清  
- [x] 页面/API/表结构/迁移草案齐全  
- [x] 审核 ≠ 批准 写清  
- [x] 指纹与 STALE、事务 TOCTOU 写清  
- [x] 80 draft 兼容与文件迁移策略写清  
- [x] 未执行迁移、未改题状态、未开发完整台  

### 实施后验收（预告）

- 无 JWT 不能写审核。  
- passed 后学生仍抽不到，直至 publish。  
- 改题后旧 passed 不能 publish。  
- 并发改题/发布不出现脏批准。  

---

## 附录 A：与现有批准门禁叠加清单

`assertApproveQualityGate` 保留全部条件，并增加：

- 存在 effectivePassed(item)  
- `confirm` 类防误触（publish API）  

## 附录 B：前端组件复用清单

- `MathStem` / `MathOptionList`  
- 答案展示可抽小组件（从 TrainResultView 提炼，实施时做）  
- Element Plus：`el-table` / `el-form` / `el-dialog` / `MessageBox`  

## 附录 C：本阶段明确未做事项

- 未执行 SQL 迁移  
- 未新增 Nest Module/Entity 落地代码（仅设计）  
- 未改 Vue 路由与页面  
- 未修改 80 题 status  
- 未调用 approve/publish  
