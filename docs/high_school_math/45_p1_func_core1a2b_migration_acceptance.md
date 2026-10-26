# P1-FUNC-CORE-1A-2B · 来源与方法标签 · 迁移执行与安全验收

> **阶段状态**：PASS  
> **库**：`study_system`  
> **迁移文件**：`db/migrate_hs_math_p1_func_core1a.sql`  
> **SQL SHA-256**：`72074e47542e36d71e4a06d66ab5678d0cd94c37745a578ac1303705b0fe2949`  
> **LAST_VERIFIED（迁移后）**：`2026-10-24T07:15:39.973Z`（UTC）

---

## A. 执行结果

| 项 | 结果 |
|---|---|
| 阶段结论 | **PASS** |
| 备份 | **成功** |
| 迁移 DDL | **成功**（exit 0） |
| 结构验收 | **PASS** |
| 数据保护验收 | **PASS** |
| API 重启 / 部署 | **NOT_RUN**（未做） |
| 方法种子 | **NOT_RUN** |
| 写库 IT | **NOT_RUN** |
| 批准 / 审核写入 | **NOT_RUN** |

---

## B. 用户授权范围

授权原文要点：先备份 `study_system`，再执行已审查的 `db/migrate_hs_math_p1_func_core1a.sql`，并做迁移后只读验收。

**未扩大**：未重启 API、未部署、未种子、未写库 IT、未改题/批准/改会话、未执行其他迁移、未改 `.env`。

---

## C. 迁移前环境

| 项 | 值 |
|---|---|
| 时间（UTC） | `2026-10-24T07:15:37.253Z` |
| MySQL | `8.0.44` |
| `DATABASE()` | `study_system` |
| 字符集 / 排序 | `utf8mb4` / `utf8mb4_0900_ai_ci` |
| 迁移路径 | `db/migrate_hs_math_p1_func_core1a.sql`（5626 bytes） |
| SQL SHA-256 | `72074e47542e36d71e4a06d66ab5678d0cd94c37745a578ac1303705b0fe2949` |
| 与 2A 审查一致性 | **一致**（内容仍为审查版：8×ADD COLUMN + 索引 + 两表；无活跃 DROP/DELETE/UPDATE；未改文件） |
| 目标 source 列 | **不存在** |
| 目标方法表 | **不存在** |
| 目标索引 | **不存在** |
| 部分迁移迹象 | **无** |

### API 进程（只读观察，未重启）

| 观察 | 说明 |
|---|---|
| `node dist/main.js`（约端口 3000） | 终端仍 running；启动于迁移前 |
| `apps/api/dist/.../entities` | **无** `source_type` / methods 映射 → 当前磁盘 dist 为迁移前旧 Entity |
| `pnpm dev` | 另有会话曾加载路由日志；**本阶段未重启/未部署** |
| 风险 | 若某处已热加载 CORE-1A-1 源码 Entity 而库未迁，会缺列报错；本机 dist 仍为旧版，迁移后旧 API 可读（忽略新列）。新 API 部署须**另授权** |

---

## D. SQL 文件 SHA-256

```
72074e47542e36d71e4a06d66ab5678d0cd94c37745a578ac1303705b0fe2949
```

执行前后校验未变化。

---

## E. 备份

| 项 | 值 |
|---|---|
| 路径 | `db/backups/study_system_pre_p1_func_core1a2b_20261024_231537.sql` |
| 大小 | **1 313 588** bytes |
| 开始 / 结束（UTC） | `2026-10-24T15:15:37.278Z` → `15:15:37.750Z` |
| 退出码 | **0** |
| 参数 | `--default-character-set=utf8mb4 --single-transaction --routines --triggers --result-file=…`（**非** PowerShell 管道） |
| 校验 | 非空；含 `CREATE TABLE`；含 `hs_math_train_items` / sessions；含 `users`；尾部 Dump completed |
| Git | `db/backups/` 已在 `.gitignore` |
| 警告 | `Access denied … PROCESS privilege … dump tablespaces`（表空间元数据；**不影响** InnoDB 表结构与数据 dump；exit 仍为 0） |

本阶段**未**做恢复演练；**未**向库恢复。

---

## F. 备份大小及校验结果

见 §E：**有效**。

---

## G. 迁移前数据基线

| 指标 | 值 |
|---|---|
| 题目总数 | 110 |
| draft / disabled / approved | 105 / 5 / 0 |
| reviews | 0 |
| parity 25 · 难度 | 16 / 7 / 2 |
| id 125/126/128/132/133 | 均 draft · content_version=**2** |
| sessions / session_items | 39 / 195 |
| item_kps / knowledge_points | 170 / 42 |
| chem_specialties | 12 |
| content_version 分布 | 1×105 + 2×5 |

---

## H. 迁移执行日志

| 项 | 值 |
|---|---|
| 开始（UTC） | `2026-10-24T15:15:37.780Z` |
| 结束（UTC） | `2026-10-24T15:15:39.972Z` |
| 方式 | `mysql … --default-character-set=utf8mb4 study_system` + **stdin 二进制读入 SQL 文件**（避免 PS 管道） |
| 退出码 | **0** |
| stderr | 仅 CLI password insecure 警告 |
| 实际 DDL | `SET NAMES`；`ALTER` 加 8 列；`ALTER` 加 `idx_hs_math_item_source_type`；`CREATE hs_math_methods`；`CREATE hs_math_train_item_methods` |
| 种子 INSERT | **未执行**（仍为注释） |
| 错误 | **无** |

运行日志（无密码）：`db/backups/_core1a2b_run_log_20261024_231539.json`

---

## I. 迁移后结构验收

### 8 个 source 列

| 列 | 类型 | NULL | 默认 |
|---|---|---|---|
| source_type | varchar(16) | NO | original |
| source_year | smallint unsigned | YES | NULL |
| source_exam_name | varchar(128) | YES | NULL |
| source_question_no | varchar(32) | YES | NULL |
| source_reference | varchar(512) | YES | NULL |
| source_adaptation_note | varchar(512) | YES | NULL |
| source_verification_status | varchar(16) | NO | unverified |
| source_license_status | varchar(16) | NO | unknown |

索引：`idx_hs_math_item_source_type (source_type, source_verification_status, source_license_status)` **存在**。

### 方法表

| 表 | collation | ENGINE | 行数 |
|---|---|---|---|
| hs_math_methods | utf8mb4_0900_ai_ci | InnoDB | **0** |
| hs_math_train_item_methods | utf8mb4_0900_ai_ci | InnoDB | **0** |

约束要点：

- `uk_hs_math_method_code` UNIQUE  
- `uk_hs_math_item_method (item_id, method_id)` UNIQUE  
- FK item → train_items：**ON DELETE CASCADE** / UPDATE NO ACTION  
- FK method → methods：**ON DELETE NO ACTION**（≡ RESTRICT）/ UPDATE NO ACTION  

与 Entity / `init.sql` / 审查稿一致。hs_math_* 表现 **10** 张（原 8 + 2）。无意外其它新表。

---

## J. 迁移后数据验收（对比基线）

| 指标 | 前 | 后 | 结论 |
|---|---|---|---|
| 题目总数 | 110 | 110 | 不变 |
| draft/disabled/approved | 105/5/0 | 105/5/0 | 不变 |
| reviews | 0 | 0 | 不变 |
| parity 16/7/2 | ✓ | ✓ | 不变 |
| 五题 version=2 | ✓ | ✓ | 不变 |
| sessions / items | 39 / 195 | 39 / 195 | 不变 |
| item_kps / kps | 170 / 42 | 170 / 42 | 不变 |
| chem_specialties | 12 | 12 | 不变 |
| content_version 分布 | 1×105+2×5 | 同 | **未批量升版** |

---

## K. 默认来源字段验收

110 题全部：

- `source_type=original`  
- `source_verification_status=unverified`  
- `source_license_status=unknown`  
- year/exam/qno/reference/note 均为 NULL  

**解释**：仅为旧题兼容默认值，**不等于**已核实原创；未做任何来源 UPDATE。

---

## L. 新增方法表验收

见 §I：表存在、空表、无种子。

---

## M. 历史训练保护

sessions / session_items 数量与迁移前一致；未改快照内容（本阶段无写会话 SQL）。

---

## N. 其他模块保护

`chem_specialties=12` 不变；迁移 SQL 仅 hs_math_*。

---

## O. API 当前状态

| 项 | 状态 |
|---|---|
| 本阶段是否重启 | **否** |
| 本阶段是否部署新代码 | **否** |
| 库是否已迁 | **是** |
| 下一阶段部署条件 | 库已就绪；部署/重启 CORE-1A-1 API 须**单独授权** |
| 旧 dist API | 多列可忽略，预期仍可读 |
| 新功能线上验收 | **未做**（禁止宣称已完成） |

---

## P. 未执行测试

| 项 | 状态 |
|---|---|
| 写库 MySQL IT | NOT_RUN |
| methods / content-meta 写入 API | NOT_RUN |
| 导入 confirm | NOT_RUN |
| 人工审核写入 | NOT_RUN |
| 正式批准 | NOT_RUN |
| 训练会话写入 | NOT_RUN |
| 方法种子 | NOT_RUN |
| 管理端 UI | NOT_RUN |

---

## Q. 风险与异常

1. mysqldump PROCESS/tablespaces 警告（非失败）。  
2. 运行中 API 未纳入本阶段验收；部署新 API 另授权。  
3. migrate 文件头注释仍写 `DRAFT_NOT_EXECUTED`（本阶段按授权**禁止改 SQL 文件**；以本报告与 HANDOFF 为准标记已执行）。  
4. verification 列 COMMENT 仍含 `rejected`（与代码枚举差，审查已记，非阻塞）。

---

## R. 下一阶段建议

1. 用户授权 → 部署/重启含 CORE-1A Entity 的 API。  
2. 冒烟：list train-items、GET methods、单题详情。  
3. （另批）方法词典种子、管理 UI、写库 IT。  
4. 勿在未授权下批准题目。

---

## 附录 · 本阶段文件

| 动作 | 路径 |
|---|---|
| 备份新增 | `db/backups/study_system_pre_p1_func_core1a2b_20261024_231537.sql` |
| 运行日志 | `db/backups/_core1a2b_run_log_20261024_231539.json` |
| 本报告 | `docs/high_school_math/45_p1_func_core1a2b_migration_acceptance.md` |
| 交接更新 | `docs/high_school_math/PROJECT_HANDOFF.md` |
| 业务代码 | **未改** |
| 迁移 SQL 正文 | **未改**（仅执行） |
