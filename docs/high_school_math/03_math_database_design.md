# 03 高一数学数据库设计（审查修订版）

> PK：`BIGINT UNSIGNED AUTO_INCREMENT`；TS 映射 `string`。  
> `user_id`：`BIGINT UNSIGNED` → `users(id)`。  
> `synchronize=false`；变更：`migrate_hs_math_*.sql` + 回写 `init.sql`。

---

## 1. 按阶段建表（避免过度设计）

### P0 必须创建

| 表 | 用途 |
|----|------|
| `hs_math_specialties` | 专项/章 |
| `hs_math_categories` | 分类/节 |
| `hs_math_train_items` | 训练题库 |
| `hs_math_train_sessions` | 训练会话 |
| `hs_math_train_session_items` | 题目快照+作答+判题结果 |

可选 P0（建议一并建，便于以后 test 池）：`hs_math_train_test_grants`。  
P0 **不建**：`hs_math_train_item_links`（可用题表上可空 `knowledge_point_id` 占位）、KB 全套、wrong、mastery。

### P1 再建

`hs_math_wrong_items`、`hs_math_wrong_events`、KB（concepts/formulas/kb_questions/links/knowledge_points）、`source_wrong_item_id` FK。

### P2/P3 再建

`hs_math_mastery_records`、`hs_math_answer_attempts`（若启用）、generation_jobs 等。

---

## 2. P0 表字段定稿

### 2.1 `hs_math_specialties`

| 字段 | 类型要点 |
|------|----------|
| id | BIGINT UNSIGNED PK AI |
| code | VARCHAR(64) UK |
| name | VARCHAR(64) |
| book_code | VARCHAR(32) NULL 注释必修一/二 |
| chapter_no | INT NULL |
| intro | VARCHAR(255) DEFAULT '' |
| sort_order, is_active | |
| created_at, updated_at | DATETIME(3) |

索引：`(is_active, sort_order)`。

### 2.2 `hs_math_categories`

| 字段 | 要点 |
|------|------|
| id | PK |
| specialty_id | FK → specialties ON DELETE CASCADE |
| code | 专项内 UK `(specialty_id, code)` |
| name, sort_order, is_active, timestamps | |

### 2.3 `hs_math_train_items`

| 字段 | 要点 |
|------|------|
| id | PK |
| code | UK |
| pool | formal\|test DEFAULT formal |
| qtype | single\|multi\|judge\|numeric |
| stem | TEXT（可含 `$...$`） |
| options_json | JSON NULL（选择题） |
| answer_payload_json | JSON NOT NULL（标准答案，见 04） |
| analysis | TEXT NULL |
| difficulty | TINYINT 1–3 |
| specialty_id, category_id | FK RESTRICT |
| knowledge_point_id | BIGINT NULL（P0 占位，无 FK 强制） |
| status | draft\|approved\|disabled |
| is_active | TINYINT(1) |
| grade_rule_version | VARCHAR(16) DEFAULT 'v1'（写入快照） |
| content_version | INT DEFAULT 1 |
| reviewed_by, reviewed_at, created_by, updated_by | |
| timestamps | |

索引：`(pool, status, is_active)`、`(specialty_id, category_id, difficulty)`。  
**软删除**：用 `status=disabled` + `is_active=0`；**不物理删**已出现在历史快照中的题（若必须删：session_items.item_id 允许 NULL，见下）。

### 2.4 `hs_math_train_sessions`

| 字段 | 要点 |
|------|------|
| id | PK |
| user_id | NOT NULL，FK CASCADE，索引 |
| session_kind | P0 固定写 `specialty`；列保留扩展 |
| specialty_id, category_id | NOT NULL（P0 专项训练） |
| pool_mode | formal\|test |
| difficulty, planned_count, actual_count, mode | sequential\|random |
| status | in_progress\|completed\|cancelled |
| answered_count, correct_count, wrong_count, pending_count | |
| duration_ms, started_at, submitted_at | |
| counts_formal_stats | TINYINT DEFAULT 1 |
| grade_rule_version | 会话级记录所用规则 |
| timestamps | |

索引：`(user_id, started_at)`、`(user_id, status)`。  
P0 **不建** `daily_date` / `source_wrong_item_id`（P1 migrate 再加列亦可；或预留 NULL 列——**推荐预留 NULL 列减少二次 ALTER**，见审查 07）。

**预留列（P0 建表即带，P0 业务不用）**：

- `daily_date DATE NULL`  
- `source_wrong_item_id BIGINT NULL`  

### 2.5 `hs_math_train_session_items`

| 字段 | 要点 |
|------|------|
| id | PK |
| session_id | FK CASCADE |
| sort_order | UK with session_id |
| item_id | BIGINT NULL（题库删除后置空，**历史仍完整**） |
| item_code | 快照 |
| qtype | 快照 |
| stem | 快照 |
| options_json | 快照 |
| answer_payload_json | 快照标准答案（库内保留；API 对 in_progress 脱敏） |
| analysis | 快照 |
| knowledge_point_id | 快照可空 |
| specialty_id, category_id, difficulty | 快照（防学情漂移） |
| content_version, grade_rule_version | 快照 |
| user_answer_payload_json | 覆盖作答 |
| grade_result | correct\|wrong\|pending_review NULL |
| grade_reason | VARCHAR(255) NULL |
| answered_at | NULL |

**无** `answer` 纯文本列亦可；展示用 payload 序列化。为与化学对齐可保留 `answer TEXT` 作展示副本（从 payload 生成）。

FK：`item_id` → train_items **ON DELETE SET NULL**（保证删题不毁历史）。

---

## 3. 一致性与并发

| 场景 | 设计 |
|------|------|
| createSession | **单事务**：insert session + batch insert items；题量不足见 04 |
| saveAnswer | 校验 user+status=in_progress；按 session_item 更新 |
| submit | **事务**内：`SELECT ... FROM sessions WHERE id=? AND user_id=? FOR UPDATE`；若 completed 则读出返回（幂等）；若 cancelled 抛错；否则加载 items、判题、写回 items、更新 session 计数与 status |
| 正确率 | 仅用 session 上固化的 correct/wrong；pending 不计分母 |

禁止：仅 `find` status 再 update 的无锁提交。

---

## 4. 与化学差异（刻意）

- 标准答案以 **JSON payload** 为主，而非仅 TEXT+aliases。  
- session_items 增加维度快照与 `grade_rule_version`。  
- item 删除 SET NULL，利于历史重建错题。  

---

## 5. 迁移策略

1. `db/migrate_hs_math_p0.sql`：上表 + 种子 specialties/categories。  
2. 同步追加到 `db/init.sql`。  
3. P1：`migrate_hs_math_p1_wrong_kb.sql`。  

---

## 6. 过度设计修正记录

| 原设计 | 修订 |
|--------|------|
| P0 建 KB concepts/formulas 等 | **移出 P0** |
| P0 建 wrong 表 | **移出 P0** |
| P0 建 item_links | **移出 P0**；用可空 knowledge_point_id |
| 多种 answer_type 枚举膨胀 | P0 由 qtype 推导即可 |

---

*文档结束：03_math_database_design.md*
