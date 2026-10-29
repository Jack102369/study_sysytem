# PHASE_C · D043/D045 迁移执行报告

| 字段 | 值 |
|------|-----|
| 执行日期 | 2026-10-29 |
| 最终状态 | **MIGRATION_COMPLETED** |
| 数据库 | `study_system` |
| MySQL | **8.0.44** |
| 主机/端口 | `127.0.0.1:3306` |
| 用户 | `study_user` |
| 系统验收等级 | **CONDITIONALLY_ACCEPTED**（未升格） |

---

## 1. 备份复核（DDL 前）

| 项 | 结果 |
|----|------|
| 文件 | `D:\adu\wj\拉总\学习系统代码\study-system-backups\study_system_pre_industrial_migration_20261029_113813.sql` |
| 大小 | 2,927,610 bytes（一致） |
| SHA-256 重算 | `93d557bfe3b83b8a93c0503cb5a05739fecbf80c304c73f43ad49585063e7269`（一致） |
| 可读 | 是 |
| 原备份覆盖 | **否** |

---

## 2. 迁移前结构检查

| 项 | 结果 |
|----|------|
| BASE TABLE 数 | **74** |
| chem_train_items | 存在；InnoDB；`id` bigint unsigned |
| chem_train_session_items | 存在；InnoDB；`id` bigint unsigned |
| chem_train_item_assets | **不存在** |
| chem_train_session_item_assets | **不存在** |
| Schema drift | 无 |
| 脚本审查 | 仅 `CREATE TABLE IF NOT EXISTS`；无 DROP/TRUNCATE/DELETE/UPDATE/INSERT |

---

## 3. D043（chem_train_item_assets）

| 项 | 值 |
|----|-----|
| 脚本 | `db/migrate_chemistry_industrial_train_item_assets.sql` |
| 开始 | 2026-10-29 12:01:31 +08:00 |
| 结束 | 2026-10-29 12:01:32 +08:00 |
| 退出码 | **0** |
| 结果 | **成功** |

### 结构验证

| 检查 | 结果 |
|------|------|
| ENGINE | InnoDB |
| CHARSET/COLLATION | utf8mb4 / utf8mb4_0900_ai_ci |
| 列 | id, train_item_id, asset_type, asset_role, content_hash, storage_path, mime_type, file_size, diagram_version, sort_order, created_at — 与脚本/Entity 一致 |
| PRIMARY | id |
| UNIQUE | `uk_chem_train_item_asset` (train_item_id, asset_type, asset_role, content_hash) |
| INDEX | `idx_chem_train_item_asset_item` (train_item_id, sort_order)；`idx_chem_train_item_asset_hash` (content_hash) |
| FK | `fk_chem_train_item_asset_item` → chem_train_items(id) **ON DELETE CASCADE** |
| Entity | `ChemTrainItemAsset` 映射一致；已在 `chemistry.module.ts` 注册 |
| 初始行数 | **0** |

---

## 4. D045（chem_train_session_item_assets）

| 项 | 值 |
|----|-----|
| 前置 | D043 成功并验证通过 |
| 脚本 | `db/migrate_chemistry_industrial_session_item_assets.sql` |
| 开始 | 2026-10-29 12:01:51 +08:00 |
| 结束 | 2026-10-29 12:01:52 +08:00 |
| 退出码 | **0** |
| 结果 | **成功** |

### 结构验证

| 检查 | 结果 |
|------|------|
| ENGINE | InnoDB |
| 列 | id, session_item_id, source_item_asset_id(NULLABLE), asset_type, asset_role, content_hash, mime_type, diagram_version, sort_order, created_at — 一致 |
| UNIQUE | `uk_chem_sess_item_asset` (session_item_id, asset_type, asset_role, content_hash) |
| INDEX | `idx_chem_sess_item_asset_si`；`idx_chem_sess_item_asset_hash` |
| FK | `fk_chem_sess_item_asset_si` → chem_train_session_items(id) **ON DELETE CASCADE** |
| source_item_asset_id FK | **无**（符合设计；引用计数=0） |
| Entity | `ChemTrainSessionItemAsset` 一致；已注册 |
| 初始行数 | **0** |

---

## 5. 迁移后汇总

| 项 | 值 |
|----|-----|
| 迁移前表数 | 74 |
| 迁移后表数 | **76**（+2） |
| chem_train_item_assets COUNT | 0 |
| chem_train_session_item_assets COUNT | 0 |
| 锁等待 | 未观察到 |
| SQL 警告 | 无（DDL 退出 0） |
| 部分成功 | 否 |
| 触碰原业务数据 | **否**（仅新建空表） |

### 原业务只读抽检

| 检查 | 结果 |
|------|------|
| chem_train_items | 存在（COUNT=635，未改结构） |
| chem_train_sessions | 存在（30） |
| chem_train_session_items | 存在（142） |
| chem_wrong_items / events | 存在（16 / 18） |
| industrial_experiment 专项 | 1 |
| 工业分类 active | 12 |
| experiment 分类 active | 16 |
| 活跃专项合计 | 13 |

---

## 6. 未执行（本阶段禁止）

- 创建测试题 / 用户 / 会话 / KB 绑定 / 正式发布  
- ensureSeeded 写库 / 真实 MySQL IT 写库  
- 数据库恢复  
- PHASE_D+

---

## 7. 结论

**MIGRATION_COMPLETED**

D043 与 D045 均在 `study_system` 成功创建并通过结构/索引/外键/Entity 对照验证。  
**不等于**完整业务验收；正式题与训练闭环仍属后续阶段。
