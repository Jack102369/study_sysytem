# P1-0F-C3B.1 人工审核记录表迁移前安全审查

**阶段**：只读审查。  
**日期**：2026-10-24（上海时区）。  
**数据库变更**：`NONE`（本阶段未执行迁移、未执行 DDL/DML）。  
**审查对象**：`db/migrate_hs_math_p1_0fc3b.sql`、`db/init.sql`、Entity/指纹/发布门禁、现网 `study_system` 只读基线。

---

## 1. SQL 安全审查

**文件**：`db/migrate_hs_math_p1_0fc3b.sql`

| # | 检查项 | 结果 |
|---|--------|------|
| 1 | 只创建 `hs_math_train_item_reviews` | PASS |
| 2 | 无可执行 `DROP` | PASS（L13 仅为回滚注释，非本文件执行语句） |
| 3 | 无 `TRUNCATE` | PASS |
| 4 | 无 `DELETE` | PASS |
| 5 | 无 `UPDATE` | PASS |
| 6 | 不修改其他业务表 | PASS |
| 7 | 不修改已有 `hs_math_*` 数据 | PASS |
| 8 | 不插入审核记录 | PASS |
| 9 | 不自动批准题目 | PASS |
| 10 | 无历史回填 | PASS |
| 11 | 字符集 `utf8mb4` | PASS（L35） |
| 12 | 引擎 `InnoDB` | PASS（与现表一致） |
| 13 | 幂等 | PASS：`CREATE TABLE IF NOT EXISTS`；表已存在则跳过，不改数据 |
| 14 | 不修改已执行旧迁移文件 | PASS（本审查未改任何历史 migrate） |

**危险 SQL**：未发现。无需停止。

**备注**：文件头注释写明「未经用户单独授权不得执行」；回滚方案单独授权，非本迁移自动执行。

---

## 2. Entity 与 Schema 一致性

**Entity**：`apps/api/src/hs-math/entities/hs-math-train-item-review.entity.ts`  
**权威 Schema**：`db/init.sql` L1074–1092  
**迁移**：`db/migrate_hs_math_p1_0fc3b.sql` L18–36

| 字段 | SQL | Entity | 一致 |
|------|-----|--------|------|
| id | BIGINT UNSIGNED AI PK | bigint unsigned | Y |
| item_id | BIGINT UNSIGNED NOT NULL | bigint unsigned + ManyToOne RESTRICT | Y |
| content_version | INT NOT NULL | int | Y |
| content_fingerprint | CHAR(64) NOT NULL | char(64) | Y |
| reviewer_user_id | BIGINT UNSIGNED NOT NULL | bigint unsigned | Y |
| review_status | VARCHAR(32) NOT NULL | varchar(32) | Y |
| review_comment | TEXT NOT NULL | text | Y |
| reviewed_at | DATETIME(3) NOT NULL | datetime precision 3 | Y |
| created_at | DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) | CreateDateColumn datetime(3) | Y |

索引名与列、`init.sql` 与迁移 DDL **字节级同构**（COMMENT 文案略有差异，不影响结构）。

**结论**：Entity / migrate / init.sql **一致**。

---

## 3. 外键兼容（只读实测）

现网确认：

| 项 | 实测 |
|----|------|
| 用户表名 | **`users`**（非假设；`information_schema` + Entity `@Entity('users')`） |
| `users.id` | `bigint unsigned`，PRI，AUTO_INCREMENT |
| `hs_math_train_items.id` | `bigint unsigned`，PRI |
| 引擎 | 两侧均为 **InnoDB** |
| 排序规则 | `users` / `hs_math_train_items` 均为 `utf8mb4_0900_ai_ci` |
| 新表字符集 | `DEFAULT CHARSET=utf8mb4`（继承库级 collation，与现表兼容） |

外键：

1. `item_id → hs_math_train_items(id)`：类型/UNSIGNED 一致；目标为 PK。  
2. `reviewer_user_id → users(id)`：类型/UNSIGNED 一致；目标为 PK。  
3. SQL **未写** `ON DELETE` / `ON UPDATE` → InnoDB 默认 **RESTRICT**（与 Entity `onDelete: 'RESTRICT'`、迁移 COMMENT「防误删」一致）。

**删除策略评估**：

- 删题目：有审核行则 **RESTRICT** → 符合「审核历史保留、禁止静默丢历史」。  
- 删用户：有审核行则 **RESTRICT** → 符合审计留痕；公共 `users` **结构未改**，仅新增引用。  

**对现有业务表影响**：仅新增子表引用；不改 `users` / `hs_math_train_items` 列定义。建表瞬间对已有行无数据变更。

**最小修改方案**：当前 **无需修改** FK。

---

## 4. 索引合理性

已建：

- `(item_id, reviewed_at)` — 按题拉历史 / 最新审核  
- `(item_id, review_status, reviewed_at)` — 按状态筛  
- `(reviewer_user_id, reviewed_at)` — 按审核人

应用侧查询：`WHERE item_id=? ORDER BY reviewed_at DESC, id DESC`，再在内存按 `content_version` 过滤（`evaluateLatestReviewForPublish`）。

**评估**：当前量级（0 审核行起步、单题历史短）**足够**，无需堆索引。  
**可选非阻断优化**（迁移后若单题审核极多再议）：`(item_id, content_version, reviewed_at, id)`。本阶段 **不建议** 为「可能」加索引。

---

## 5. 指纹一致性

**实现**：`hs-math-item-content-fingerprint.ts` → `validateAnswerPayload` + `canonicalizeImportItem` + `fingerprintCanonicalItem`（`stableStringify` 键排序 + SHA-256）。

| # | 检查项 | 结果 |
|---|--------|------|
| 1 | 覆盖 code/章节/题型/难度/题干/选项/答案/解析 | PASS |
| 2 | 覆盖 KP 集合（排序后） | PASS |
| 3 | 覆盖主 KP | PASS |
| 4 | JSON 规范化（判题协议 + stableStringify） | PASS |
| 5 | 不依赖 DB JSON 键顺序 | PASS |
| 6 | 审核提交与发布门禁共用 `computeItemContentFingerprint` | PASS |
| 7 | 内容变更 → 指纹变 → 旧审核失效 | PASS（另：实质改动升 `content_version`） |
| 8 | 不仅依赖 content_version（另比指纹） | PASS |
| 9 | 不信任客户端指纹（服务端重算；禁客户端 reviewerId/reviewedAt） | PASS |
| 10 | 答案经 `validateAnswerPayload` 规范化后再指纹，降低缺省容差抖动 | PASS |

---

## 6. 统一发布门禁审计

**入口**：`patchStatus(..., approved)` → **仅** `publishWithHumanReviewGate`（`JwtAuthGuard` + `AdminGuard`）。

| # | 检查项 | 结果 |
|---|--------|------|
| 1 | 事务内 `pessimistic_write`（FOR UPDATE）锁题目 | PASS |
| 2 | 读该题全部审核，按 reviewed_at/id DESC | PASS |
| 3 | 校验当前 content_version | PASS |
| 4 | 校验指纹一致 | PASS |
| 5 | 最新同版本须 `passed` | PASS |
| 6 | 原质量门禁 `assertApproveQualityGate` | PASS |
| 7 | `confirmPublish === true` | PASS |
| 8 | JWT + ADMIN | PASS |
| 9 | 旧 status→approved 无法绕过 | PASS |
| 10 | 缺表 `ER_NO_SUCH_TABLE` fail-closed | PASS |
| 11 | 并发 | 见下 |

**并发分析**：

- `submitReview` 与 `publish` **均对同一 `item` 行 FOR UPDATE**，串行化内容变更/审核写入/批准。  
- 批准持锁期间：其他事务无法提交该题新审核或改内容；持锁方读到的审核集与判定一致。  
- 审核先提交并释放锁后，批准再加锁：可看到最新审核。  
- **残留风险（低，非阻断）**：同毫秒多条审核依赖 `id DESC` 打破平局——已实现。  
- **不**仅凭 FOR UPDATE 宣称绝对安全：跨题无关；本门禁范围是单题行锁 + 服务端指纹，足够。

**结论**：无真实阻断级并发洞；无需改代码即可授权迁移。

---

## 7. 当前数据库基线（只读 SELECT）

**库**：`study_system`  
**MySQL**：`8.0.44`

| 指标 | 值 |
|------|-----|
| `hs_math_train_items` 总数 | **85**（80 CH01 formal draft + 5 P0 测试题） |
| 第一章 draft（`HSMA-RJA-CH01-%` + status=draft） | **80** |
| approved formal | **0** |
| `hs_math_train_item_kps` | **121** |
| `hs_math_train_sessions` | **39** |
| `hs_math_train_session_items` | **195** |
| `hs_math_train_item_reviews` 是否存在 | **否**（information_schema count=0） |
| P0 id 1–5 | 均为 `status=disabled`，`pool=formal` |
| 公共用户表 | `users`（InnoDB，utf8mb4）；摘要仅含结构元数据，**未导出密码/JWT** |
| chemistry 抽样 | `chem_specialties` = 12（基线参照，未改） |

---

## 8. 备份方案（本阶段只制定，未执行写入式备份）

**前置（迁移授权前必须完成）**：

1. 在 `.gitignore` 增加（当前 **缺失**）：
   ```
   db/backups/
   ```
   避免 mysqldump 进入 Git。  
2. 获用户明确授权后执行一致性备份，例如：
   ```bash
   mysqldump -u... -p --single-transaction --routines --triggers \
     study_system > db/backups/study_system_pre_p1_0fc3b_YYYYMMDD_HHMM.sql
   ```
3. 备份覆盖：全库结构 + 业务数据（含数学题库、训练历史、用户与其他模块）。  
4. **不得**把备份内容粘贴进报告；不得提交 Git。  
5. 校验备份文件非空、可 `head` 看到 `-- MySQL dump` 头。

本阶段：**未执行** mysqldump / 未写 `db/backups/`。

---

## 9. 迁移后验收方案（授权执行迁移之后）

只读/构建类验证（迁移 DDL 本身除外）：

1. `information_schema.tables`：`hs_math_train_item_reviews` 存在。  
2. `SHOW CREATE TABLE hs_math_train_item_reviews`：字段与 init/migrate 一致。  
3. `information_schema.KEY_COLUMN_USAGE`：两条 FK 正确。  
4. `SHOW INDEX`：三个业务索引存在。  
5. `SELECT COUNT(*) FROM hs_math_train_item_reviews` = **0**。  
6. CH01 draft 仍为 **80**。  
7. approved formal 仍为 **0**。  
8. `hs_math_train_item_kps` 仍为 **121**。  
9. sessions = **39**；session_items = **195**。  
10. P0 id1–5 仍为 **disabled**。  
11. chemistry 等模块计数相对迁移前基线无变化（如 `chem_specialties=12`）。  
12. API build / 相关 selftest PASS。  
13. Admin 查询某 draft 审核列表 → 空列表（表已存在，非缺表错误）。  
14. 无审核记录时 `PATCH ... status=approved` + `confirmPublish=true` → 拒绝（`NO_REVIEW`）。  
15. **禁止**用 80 道正式题做破坏性写入；真实审核写入须另开受控阶段。

---

## 10. 风险与阻断项

| 级别 | 项 | 处理 |
|------|----|------|
| 信息 | `.gitignore` 未忽略 `db/backups/` | 迁移前补一行（非 SQL 风险） |
| 信息 | 可选复合索引 `(item_id, content_version, …)` 未建 | 可接受；量上来再议 |
| 信息 | FK 默认 RESTRICT 未显式写出 | 行为正确；可选后续显式 `ON DELETE RESTRICT` 仅增强可读性，**非必须** |
| 阻断 | 无 | — |

**危险 SQL**：无。  
**外键类型不兼容**：无。  
**门禁可绕过**：无（代码层；表未建时 fail-closed）。

---

## 11. 迁移执行建议

1. 补 `.gitignore` → `db/backups/`  
2. 用户授权后 mysqldump 全库到 `db/backups/`  
3. 用户**单独授权**后执行：`db/migrate_hs_math_p1_0fc3b.sql`（仅 `study_system`）  
4. 按 §9 只读验收  
5. 不在本迁移中插入审核、不批准、不重启生产（除非另授权）

**授权状态建议**：**READY_FOR_AUTHORIZATION**（须先完成备份与 gitignore；执行迁移仍需用户明确指令）。

---

## 12. 本阶段声明

- 未创建第二数据库  
- 未改 `.env` / 连接  
- 未执行迁移 / DDL / INSERT/UPDATE/DELETE  
- 未改 chemistry / 80 道题 / 训练历史  
- 未批准题目、未建会话、未部署  
- 临时只读审计脚本已删除  

**数据库变更：NONE**
