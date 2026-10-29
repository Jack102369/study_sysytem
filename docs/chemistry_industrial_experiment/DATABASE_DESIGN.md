# 工业实验 · 数据库设计说明

**最后更新：** 2026-10-29 12:02:56 +08:00（PHASE_C：`study_system` 已迁移 D043+D045）

> 权威结构以 `db/init.sql` 为准；TypeORM `synchronize=false`。

---

## 1. 权威原则（已验证）

| 原则 | 证据 |
|------|------|
| `db/init.sql` 权威 | 仓库约定 |
| `synchronize: false` | `apps/api/src/app.module.ts` |
| user_id 隔离 | 会话/错题等用户态表 |
| 专项扩展可不改表 | `chem_specialties.code` UNIQUE + 种子 |

---

## 2. 与工业实验相关的表

| 表 | 关系 |
|----|------|
| chem_specialties / chem_categories | 第 13 专项 industrial_experiment（种子） |
| chem_train_items / chem_train_item_links | 正式题目 |
| **chem_train_item_assets** | **D043：题 ↔ 不可变 SVG 元数据关联** |
| chem_train_sessions / chem_train_session_items | 训练题面快照（stem/options/answer/analysis） |
| **chem_train_session_item_assets** | **D045：会话题图版本快照（一题多图）** |
| chem_wrong_items / chem_wrong_events | 错题池；events 含 session_id/session_item_id → 关联会话图快照（D046，STEP_11 **无新表**） |
| chem_experiments 等 | 案例持久化仍待后续（当前文件候选） |

> PHASE_C（2026-10-29）：在业务库 `study_system` **已执行** D043→D045；状态 `MIGRATION_COMPLETED`。详见 `DATABASE_MIGRATION_EXECUTION_REPORT.md`。Entity / `init.sql` / migrate 脚本与真实表结构已对照通过。

---

## 3. D043：chem_train_item_assets

### 字段

| 列 | 类型 | 说明 |
|----|------|------|
| id | BIGINT UNSIGNED PK AI | |
| train_item_id | BIGINT UNSIGNED NOT NULL | FK → chem_train_items.id |
| asset_type | VARCHAR(32) | `industrial_flow_svg` \| `industrial_apparatus_svg`（本步主用前者） |
| asset_role | VARCHAR(32) | `question_diagram` \| `supporting_diagram` |
| content_hash | CHAR(64) | SVG 文件字节 SHA-256 |
| storage_path | VARCHAR(512) | 相对 uploads/，如 `industrial-svg/<sha>.svg` |
| mime_type | VARCHAR(64) | 默认 `image/svg+xml` |
| file_size | INT UNSIGNED | 字节数 |
| diagram_version | VARCHAR(32) | 渲染器/协议版本 |
| sort_order | SMALLINT UNSIGNED | 稳定排序 |
| created_at | DATETIME(3) | |

### 索引 / 约束

| 名 | 定义 |
|----|------|
| uk_chem_train_item_asset | UNIQUE(train_item_id, asset_type, asset_role, content_hash) — 防同题重复绑定；**允许多题共享同哈希** |
| idx_chem_train_item_asset_item | (train_item_id, sort_order) |
| idx_chem_train_item_asset_hash | (content_hash) |
| fk_chem_train_item_asset_item | ON DELETE CASCADE — **仅删关联行，不删物理 SVG** |

### 文件存储

- 目录：`uploads/industrial-svg/<sha256>.svg`
- 同内容幂等；同哈希不同内容拒绝覆盖
- 不存 MySQL BLOB

### 迁移

| 文件 | 状态 |
|------|------|
| `db/init.sql` | **已同步** |
| `db/migrate_chemistry_industrial_train_item_assets.sql` | **已创建**（IF NOT EXISTS；可重复执行） |
| 真实 MySQL 执行 | **未执行**（本步不对未知/生产库自动迁移） |

### Entity

`apps/api/src/chemistry/train/entities/chem-train-item-asset.entity.ts`  
已注册于 `chemistry.module.ts` TRAIN_ENTITIES。

---

## 4. 题库关键字段（未改列）

pool / status / curriculum_ok / verify_blocked / ban_default_train / gate_note — **未修改 chem_train_items 表结构**。

---

## 5. 历史待办（非本步）

| 编号 | 议题 | 状态 |
|------|------|------|
| DB-Q01 | 工业案例 MySQL 持久化 | 仍文件候选 |
| DB-Q02 | 流程图 Definition JSON DB | 文件级 |
| DB-Q03 | SVG 版本绑定 | **D043-APPROVED 已解决关联层** |
| DB-Q04 | 题组 | 待产品 |
## 6. D045：chem_train_session_item_assets

| 列 | 说明 |
|----|------|
| session_item_id | FK → chem_train_session_items ON DELETE CASCADE |
| source_item_asset_id | 开训时 item_asset id（**无 FK**，避免删题库关联破坏历史） |
| asset_type / asset_role / content_hash / mime_type / diagram_version / sort_order | 与 D043 对齐的快照字段 |
| 唯一 | (session_item_id, asset_type, asset_role, content_hash) |

迁移：`db/migrate_chemistry_industrial_session_item_assets.sql`（须在 D043 迁移之后；本步**未**自动执行真实库）。

还原：content_hash → `uploads/industrial-svg/<hash>.svg`（仅受控 API；公开静态已 403）。

| 会话图形快照 | chem_train_session_item_assets | **STEP_10 已落地（代码层）** |
