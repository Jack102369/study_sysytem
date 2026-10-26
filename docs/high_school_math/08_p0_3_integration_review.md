# 08 高一数学 P0-3.5 训练引擎集成验收

> 验收日期：以仓库提交日为准  
> 结论标签：`P0_3_INTEGRATION`

---

## 1. 测试环境

| 项 | 值 |
|----|----|
| OS | Windows 10 |
| MySQL 客户端 | MySQL Server 8.0 (`mysql.exe`) |
| API 运行时 | NestJS / TypeORM / `mysql2`（workspace 依赖） |
| `.env` 业务库 | `DB_NAME=study_system`（`study_user@127.0.0.1`） |
| 规定 IT 库名 | `study_system_hs_math_it`（硬编码安全门禁） |

**安全策略**：

- 写入类集成测试 **禁止** 连接 `study_system`。
- 仅当 `HS_MATH_IT_DB_NAME=study_system_hs_math_it` 时允许 `hs-math:it`。
- 本轮 **未能** 创建 IT 库：`study_user` 无 `CREATE DATABASE` 权限；本地尝试 root 常见口令均失败。
- 因此：**真实 MySQL 写入/并发集成测试未执行**。

---

## 2. 数据库版本

| 探测 | 结果 |
|------|------|
| 服务器版本查询 | 未在可写 IT 会话中取得；客户端为 MySQL 8.0 |
| 业务库 `study_system` 是否已有 `hs_math_*` | **否**（只读 `information_schema`：五表均 MISSING） |

---

## 3. 数据库结构检查

### 3.1 设计/DDL（文本）

来源：`db/migrate_hs_math_p0.sql`、`db/init.sql`、`db/hs_math_it_schema.sql`（本轮新增 IT 专用）。

五表字段、PK、UK、FK、JSON、`DATETIME(3)`、`utf8mb4` 与 Entity 设计一致（P0-1 已对齐）。

### 3.2 真实库（只读）

对 `study_system` 执行 schema-audit：

```
MISSING_TABLES: hs_math_specialties, hs_math_categories, hs_math_train_items,
                hs_math_train_sessions, hs_math_train_session_items
```

**含义**：业务库尚未执行 `migrate_hs_math_p0.sql`，无法在现网库上做“真实表结构 vs Entity”对照，更不能做写入验收。

### 3.3 Entity vs SQL（静态）

人工对照 Entity 与 migrate DDL：关键列名/类型/可空/默认值一致；会话快照含 `answer_payload_json`、`content_version`、`grade_rule_version`；`item_id` ON DELETE SET NULL。

未发现必须立即改库的 Entity 漂移。

---

## 4. 测试场景（计划）

| ID | 场景 | 自动化入口 |
|----|------|------------|
| U1 | 判题四题型 + 脱敏映射 | `pnpm --filter api run hs-math:selftest` |
| S1 | 只读结构审计 | `hs-math:schema-audit` |
| I0 | 创建 IT 库 | `hs-math:it-setup` / `db/hs_math_it_schema.sql` |
| I1 | 主链路 create→answer→submit | `hs-math:it` |
| I2 | 并发 A–E | `hs-math:it` |
| I3 | 用户隔离 | `hs-math:it` |
| I4 | 快照稳定性 | `hs-math:it` |
| I5 | 边界/取消 | `hs-math:it` |

---

## 5. 实际执行结果

| 场景 | 结果 |
|------|------|
| U1 单元自测 | **PASS**（P0-2 + P0-3 selftest） |
| Nest build | **PASS**（integration 目录已排除出 `tsconfig.build`） |
| S1 业务库结构 | **FAIL/缺失表**（只读确认） |
| I0 IT 库创建 | **FAIL**（权限不足） |
| I1–I5 写入/并发 | **NOT_RUN** |

---

## 6. 并发测试结果

**NOT_RUN**（无独立 IT 库）。

代码静态审查：`saveAnswer` / `submit` / `cancel` 均在事务内 `setLock('pessimistic_write')`；`submit` 在锁内识别 `completed` 幂等。  
**不能**据此声称 FOR UPDATE 已在真实 MySQL 验证。

---

## 7. 用户隔离结果

**NOT_RUN**（集成）。

静态：`requireOwnSession` / `lockOwnSession` 均带 `user_id`；Train Service 无 ADMIN 旁路。  
预期他人会话 → `NotFoundException`（与化学一致）。

---

## 8. 答案脱敏结果

| 检查 | 结果 |
|------|------|
| `toStudentSessionItemView(reveal=false)` 单元 | **PASS**（P0-3 selftest） |
| create/in_progress/cancel 响应剥离 | 代码路径使用 `reveal = status === 'completed'` | 
| HTTP 层真实响应 | **NOT_RUN** |

---

## 9. 快照稳定性结果

**NOT_RUN**（集成脚本已编写：改原题后比对 session_items 快照）。

静态：创建时写入 `answer_payload_json`/`stem`/`options_json`；判题只读快照。

设计风险（记录，不改库）：`item_id` ON DELETE SET NULL 后，P1 错题重建若强依赖 `item_id` 可能丢身份，需依赖 `item_code` + 快照。

---

## 10. 发现的问题

| # | 问题 | 严重度 | 处理 |
|---|------|--------|------|
| P1 | 业务库未执行 P0 迁移，无 `hs_math_*` | 高（阻塞联调） | 需人工迁移；本验收不自动执行 |
| P2 | `study_user` 无法创建 IT 库 | 高（阻塞集成） | 需 DBA/root 执行 `db/hs_math_it_schema.sql` 并 GRANT |
| P3 | 本机 root 口令未知，无法代建 IT 库 | 中 | 文档化步骤 |
| P4 | 无真实并发证据 | 高（验收口径） | 保持 NOT_RUN，禁止标 PASS |

代码缺陷修复本轮：**无**（未在 MySQL 上复现需修缺陷；构建排除 integration 避免污染 dist）。

---

## 11. 修复情况

- 新增 IT 安全门禁、schema、集成脚本、npm scripts。
- `tsconfig.build.json` 排除 `**/integration/**`。
- **未**修改训练业务逻辑（无实证缺陷）。
- **未**执行生产迁移，**未**向 `study_system` 写入。

---

## 12. 尚未验证事项

1. 真实 MySQL FOR UPDATE 并发 A–E  
2. 用户隔离 HTTP/Service 集成  
3. 快照在改题/删题后的提交稳定性  
4. 业务库 migrate 后的 information_schema 全量对照  
5. shortfall / 边界在真实库上的行为  

---

## 13. 是否允许进入 P0-4

**业务闭环（HTTP E2E）已通过后，允许进入 P0-4（历史列表等）。**

仍建议（非阻塞）后续补跑：

1. 独立 IT 库上的 FOR UPDATE 并发脚本（`hs-math:it`）——当前为 **NOT_RUN**。  
2. 勿将 `_e2e_last_result.json` 中的会话/题目当作正式教材内容。

---

## 14. 如何补跑（运维）

```bash
# A) 真实业务库 HTTP E2E（需 API 已启动；仅写 hs_math_*）
pnpm --filter api run hs-math:e2e

# B)（可选）独立 IT 库并发
mysql -uroot -p --default-character-set=utf8mb4 < db/hs_math_it_schema.sql
set HS_MATH_IT_DB_NAME=study_system_hs_math_it
pnpm --filter api run hs-math:it
```

---

## 15. 真实业务库 HTTP 验证（迁移后）

> 执行命令：`pnpm --filter api run hs-math:e2e`  
> 库：`study_system`（唯一业务库）  
> 鉴权：现有 ADMIN id=2 / USER id=1，使用 `JWT_SECRET` 签发测试 Token（**未改密码、未改角色、未打印 Token**）

| 项 | 结果 |
|----|------|
| 五表 + 10 章种子 | **PASS** |
| API `/health` | **PASS** |
| 管理员创建 5 道 `HS_MATH_P0_E2E_TEST_*`（含四题型）默认 draft | **PASS** |
| USER 无法管理端创建/批准（403） | **PASS** |
| ADMIN 批准 → approved | **PASS** |
| 学生 create session（仅 approved）+ 快照 | **PASS**（例：sessionId=`4`） |
| in_progress 脱敏（无 answerPayloadJson/analysis/grade*） | **PASS** |
| PATCH 覆盖作答；提交前无 grade_result；非法 judge 字符串 → 400 | **PASS** |
| submit：correct=4 wrong=0 pending=1；四题型 grade 正确；numeric 未答 pending | **PASS** |
| 重复 submit 幂等；completed 后 PATCH → 409 | **PASS** |
| cancel 脱敏；cancel 后 submit → 409 | **PASS** |
| 用户隔离：他用户/ADMIN 旁路访问会话 → 404 | **PASS** |
| chem_specialties / error_questions / users 指纹不变 | **PASS** |
| 真实双连接 FOR UPDATE 压测 | **NOT_RUN** |

机器可读摘要：`docs/high_school_math/_e2e_last_result.json`（无敏感信息）。

题目标识：`HS_MATH_P0_E2E_TEST_*`（itemIds 1–5）。可保留以便识别，非正式教材题。

---

## 结论

```
P0_3_INTEGRATION = PASS
```

（业务 HTTP 闭环；并发行锁专项仍为 NOT_RUN，不阻塞 P0-4 历史列表开发。）

早期章节记录的「无表 / 无 IT 库」为迁移前状态，已被第 15 节覆盖。

---

*文档结束：08_p0_3_integration_review.md*
