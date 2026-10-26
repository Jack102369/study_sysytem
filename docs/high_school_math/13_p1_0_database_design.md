# 13 P1-0 增量数据库设计

> 权威结构仍为 `db/init.sql`；变更走**新**文件 `db/migrate_hs_math_p1_0.sql`（**已于业务库 study_system 执行，P1-0A**）。  
> 禁止改写已执行的 `migrate_hs_math_p0.sql` / `migrate_hs_math_p1_0.sql`。  
> 仅 `hs_math_*`；不碰 chem_* / users / 错题本。

---

## 1. 设计目标

- 小节可管理，且不破坏 P0 `POST /hs-math/train/sessions`（仍要 specialtyId+categoryId）。  
- 知识点可维护、可多对多挂题。  
- 历史会话（含现有约 39 条）判题与学情口径不变。  
- 测试题不得再进 formal 抽题池（业务规则 + 已有 disabled）。

---

## 2. 方案比较

### 方案 A（推荐）：categories = 小节

| 优点 | 风险 |
|------|------|
| 与 P0 训练接口天然兼容 | 需批量插入小节种子，保留 `default` |
| 少一张「节」表，改动面小 | categories 语义从「综合分类」变为「教材小节」需文档约定 |
| 现有 FK/索引可复用 | 旧题全挂在 `default`，需迁移说明 |

### 方案 B：新建 `hs_math_sections`，categories 继续当标签

| 优点 | 风险 |
|------|------|
| 语义更纯 | 训练 DTO 要加 sectionId 或双轨；兼容层重 |
| | 易过度设计，P0 抽题路径分叉 |

**推荐方案 A。**

---

## 3. P1-0 新增表

### 3.1 `hs_math_knowledge_points`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT UNSIGNED PK AI | |
| code | VARCHAR(64) UK | 如 `rja.1.1.01` |
| name | VARCHAR(128) | |
| specialty_id | BIGINT UNSIGNED NOT NULL | FK → specialties RESTRICT |
| category_id | BIGINT UNSIGNED NOT NULL | FK → categories RESTRICT（须同 specialty） |
| parent_id | BIGINT UNSIGNED NULL | 可选层级，FK self SET NULL |
| summary | VARCHAR(512) NULL | 短定义，可含 LaTeX |
| sort_order | INT NOT NULL DEFAULT 0 | |
| is_active | TINYINT(1) NOT NULL DEFAULT 1 | |
| created_at / updated_at | DATETIME(3) | |

索引：`(specialty_id, category_id, is_active, sort_order)`、`uk(code)`。  
应用层校验：category.specialty_id === specialty_id。

### 3.2 `hs_math_train_item_kps`

| 字段 | 说明 |
|------|------|
| id | PK |
| item_id | FK → train_items CASCADE |
| knowledge_point_id | FK → knowledge_points RESTRICT |
| is_primary | TINYINT(1) DEFAULT 0 | 主知识点 |
| sort_order | INT DEFAULT 0 | |
| created_at | DATETIME(3) | |

唯一：`uk (item_id, knowledge_point_id)`。  
约定：每题最多一个 `is_primary=1`（应用层或生成列校验）。

### 3.3 `hs_math_kp_prerequisites`（可选但建议空表先建）

| 字段 | 说明 |
|------|------|
| kp_id | FK |
| requires_kp_id | FK |
| uk (kp_id, requires_kp_id) | |

P1-0 可不填数据；为后续学习路径预留。

---

## 4. P1-0 修改既有表（最小 ALTER）

### 4.1 `hs_math_train_items`

| 变更 | 说明 |
|------|------|
| **保留** `knowledge_point_id` | 可继续作为「主 KP 缓存」与 `train_item_kps.is_primary` 同步；或逐步弃用只读兼容 |
| 新增 `source` VARCHAR(32) NULL | 如 `manual` / `import` / `e2e`；便于过滤测试题 |
| 新增 `textbook_edition` VARCHAR(32) NULL DEFAULT 'rja2019' | 可选 |

**不改** difficulty 取值域（仍 1–3，见题库文档）。  
**不加** status 新枚举。

### 4.2 `hs_math_train_session_items`（知识点快照）

新增：

| 字段 | 说明 |
|------|------|
| `knowledge_point_codes_json` | JSON NULL，形如 `["rja.1.1.01","rja.1.3.02"]` |
| `primary_knowledge_point_code` | VARCHAR(64) NULL |

创建会话时从题库关联**快照写入**；之后管理员改题-KP **不漂移**历史。  
已有行保持 NULL → 学情按 specialty/difficulty 旧口径；新会话可选用 KP 维度（后续功能）。

**不改** stem/options/answer/grade 快照字段；**不重算** completed 会话。

### 4.3 `hs_math_categories`

无结构变更；**数据**：为每章插入小节行，**保留** `default`。

---

## 5. 迁移策略

文件：`db/migrate_hs_math_p1_0.sql`（待确认后由人工执行）

顺序建议：

1. CREATE knowledge_points / train_item_kps / kp_prerequisites  
2. ALTER session_items 加快照列  
3. ALTER train_items 加 source（可选）  
4. INSERT 小节 categories（WHERE NOT EXISTS）  
5. INSERT 第一章 KP（及后续批次）  
6. 回写 `db/init.sql` 同步权威结构 + 种子  

幂等：`CREATE IF NOT EXISTS` / `INSERT … WHERE NOT EXISTS`。  
**不** DELETE 历史 sessions/items。  
**不** 把 E2E 题改回 approved。

---

## 6. 历史兼容

| 对象 | 行为 |
|------|------|
| completed 会话 | 继续用既有快照判题结果；学情仍按 session.specialty_id / item.difficulty |
| in_progress | 创建逻辑不变；新快照字段仅新会话填充 |
| 挂在 `default` 的旧题 | 仍可抽题；可逐步关联 KP |
| disabled E2E 题 | 抽题条件 `status=approved` 已排除 |

---

## 7. 防止测试题回池

1. 业务：仅 `status=approved AND is_active=1 AND pool=formal`。  
2. 约定：`code LIKE 'HS_MATH_P0_%'` 或 `source='e2e'` **禁止** 管理员一键批准（API 校验，编码阶段实现）。  
3. 导入模板校验拒绝测试前缀。

---

## 8. 风险

| 风险 | 缓解 |
|------|------|
| categories 语义变化引起运营困惑 | 管理端标签「小节」；保留 default 文案「综合练习」 |
| knowledge_point_id 与多对多双写不一致 | Service 以 train_item_kps 为准，写库时同步 primary |
| 快照 JSON 过大 | 仅存 code 列表，不存名称 |

---

*文档结束：13_p1_0_database_design.md*
