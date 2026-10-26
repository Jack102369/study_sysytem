# P1-FUNC-CORE-1A-2A · 来源与方法标签 · 迁移最终安全审查

> **阶段状态**：PASS  
> **迁移准备**：READY_FOR_MIGRATION  
> **库查询**：已执行只读（`study_system`）  
> **LAST_VERIFIED**：`2026-10-24T07:06:28.579Z`（UTC）≈ 本地 2026-10-24 15:06:28 CST  
> **本阶段禁止项确认**：未执行迁移 / 未写库 / 未改业务代码 / 未重启 API / 未部署

---

## A. 执行结果

| 项 | 结果 |
|---|---|
| 阶段结论 | **PASS** |
| 迁移准备 | **READY_FOR_MIGRATION** |
| 迁移执行 | **NOT_RUN** |
| 备份执行 | **NOT_RUN**（仅方案） |
| API 重启 | **NOT_RUN** |
| 写库 IT | **NOT_RUN** |
| 业务代码修改 | **无** |
| 静态自测 | `hs-math:p1-func-core1a-selftest` **PASS** |
| api build | **PASS** |

---

## B. 迁移 SQL 逐句审查

文件：`db/migrate_hs_math_p1_func_core1a.sql`（状态仍为草案注释 `DRAFT_NOT_EXECUTED`）。

### B.0 全局检查（任务书 1–25）

| # | 检查项 | 结论 |
|---|---|---|
| 1 | 明确作用于 study_system | **部分**：注释要求 `SELECT DATABASE()`；脚本**无** `USE study_system`。执行时必须连接已选中 `study_system`。 |
| 2 | 创建新数据库 | **无** |
| 3 | 修改连接 | **无** |
| 4 | 只改 hs_math_* | **是**（`hs_math_train_items` + 两新表） |
| 5 | 改其他模块表 | **无** |
| 6 | 危险 DROP | **无**（仅注释回滚草案） |
| 7 | TRUNCATE | **无** |
| 8 | DELETE | **无** |
| 9 | 数据回填 UPDATE | **无**（旧行吃列 DEFAULT，不碰 `content_version`） |
| 10 | 不必要存储过程 | **无**（注释提到幂等可用存储过程，未实现） |
| 11 | 动态 SQL | **无** |
| 12 | 临时表 | **无** |
| 13 | 重复执行风险 | **有**：`ADD COLUMN` / `ADD KEY` **非幂等**；`CREATE TABLE IF NOT EXISTS` 幂等 |
| 14 | 部分执行恢复 | **有风险**：DDL 隐式提交，见 §K |
| 15 | DDL 隐式提交 | **是**（InnoDB DDL 不可整脚本 ROLLBACK） |
| 16 | 长时间表锁 | **低–中**：110 行 ADD COLUMN；本地 normally 秒级；仍建议短停写窗口 |
| 17 | 影响已有题目读取 | **迁移瞬间** metadata lock 可能短阻塞；完成后旧 API 可读（多列忽略） |
| 18 | 影响进行中会话 | **不改** session / session_items；锁竞争可能短暂停答 |
| 19 | 改 content_version | **否** |
| 20 | 改审核记录 | **否**（reviews=0） |
| 21 | 改会话快照 | **否** |
| 22 | 改 status | **否** |
| 23 | 破坏现有外键 | **否**；新 FK 指向既有 `hs_math_train_items` 与新 `hs_math_methods` |
| 24 | 不合理默认值 | **否**：`original` / `unverified` / `unknown` 与兼容策略一致 |
| 25 | 截断已有字段 | **否**（仅 ADD，无 MODIFY 缩短） |

### B.1 语句明细

| # | 语句 | 用途 | 影响表 | 风险 | 可执行？ |
|---|---|---|---|---|---|
| 1 | `SET NAMES utf8mb4` | 客户端字符集 | 会话 | 无 | 是 |
| 2 | `ALTER TABLE hs_math_train_items ADD COLUMN` ×8 | 加来源列+默认 | `hs_math_train_items` | 表级 metadata lock；非幂等；缺 `USE` | **是（首次）** |
| 3 | `ALTER TABLE … ADD KEY idx_hs_math_item_source_type` | 管理端筛选索引 | 同上 | 非幂等；列不存在则失败 | **是（首次）** |
| 4 | `CREATE TABLE IF NOT EXISTS hs_math_methods` | 方法词典 | 新表 | 低 | 是 |
| 5 | `CREATE TABLE IF NOT EXISTS hs_math_train_item_methods` | 题-方法关联 | 新表 | 依赖 items+methods；FK | 是 |
| 6 | 注释种子 INSERT | 未启用 | — | — | 不执行 |
| 7 | 注释回滚 DROP | 未启用 | — | — | 不执行 |

**结论**：脚本范围安全，适合授权后**首次**执行；执行前必须：`DATABASE()=study_system`、备份、确认 `source_%` 列与 methods 表尚不存在。

---

## C. Entity / DDL / init.sql 一致性

### C.1 source 八列

| 字段 | migrate | init.sql | Entity | 一致？ |
|---|---|---|---|---|
| source_type VARCHAR(16) NOT NULL DEFAULT original | ✓ | ✓ | varchar(16) default original | **是** |
| source_year SMALLINT UNSIGNED NULL | ✓ | ✓ | smallint unsigned nullable | **是** |
| source_exam_name VARCHAR(128) NULL | ✓ | ✓ | ✓ | **是** |
| source_question_no VARCHAR(32) NULL | ✓ | ✓ | ✓ | **是** |
| source_reference VARCHAR(512) NULL | ✓ | ✓ | ✓ | **是** |
| source_adaptation_note VARCHAR(512) NULL | ✓ | ✓ | ✓ | **是** |
| source_verification_status … DEFAULT unverified | ✓ | ✓ | ✓ | **是**（见注释差） |
| source_license_status … DEFAULT unknown | ✓ | ✓ | ✓ | **是** |
| idx_hs_math_item_source_type | ✓ | ✓ | Entity 无 Index 装饰器 | **结构一致**（synchronize=false，可接受） |

**差异（非阻塞，建议后续注释修正，本阶段不改 SQL/代码）**：

1. migrate COMMENT：`verification` 写了 `rejected`；init / constants / Entity **无** `rejected`（仅 `unverified|verified`）。  
2. Entity 未声明 `@Unique`/`@Index` 与 DB 约束一一对应（与本模块既有风格一致）。

### C.2 hs_math_methods

| 项 | migrate / init | Entity | 一致？ |
|---|---|---|---|
| PK BIGINT UNSIGNED AI | ✓ | ✓ | 是 |
| code VARCHAR(64) UNIQUE | ✓ | 列有；无 Unique 装饰器 | 运行靠 DB |
| name/summary/sort_order/is_active | ✓ | ✓ | 是 |
| created_at/updated_at DATETIME(3) | ✓ | Create/UpdateDateColumn precision 3 | 是 |
| CHARSET utf8mb4 | ✓ | N/A | 是（继承库 collation） |

### C.3 hs_math_train_item_methods

| 项 | migrate / init | Entity | 一致？ |
|---|---|---|---|
| UK (item_id, method_id) | ✓ | 无装饰器 | DB 保障 |
| is_primary / sort_order | ✓ | ✓ | 是 |
| FK item ON DELETE CASCADE | ✓ | ManyToOne CASCADE | 是 |
| FK method | **无 ON DELETE**（MySQL 默认 RESTRICT） | `onDelete: 'RESTRICT'` | **语义一致** |
| 主方法至多一个 | **仅应用层**（同 KP） | `assertPrimaryAmongMethodLinks` | 设计如此，非 DB 部分唯一 |

**三者结构对齐，可迁移。** 注释差异记录为建议修正，不构成 NOT_READY。

---

## D. 数据库当前状态（只读实测）

| 字段 | 实测值 |
|---|---|
| DATABASE() | `study_system` |
| VERSION | MySQL `8.0.44` |
| 库字符集 | `utf8mb4` / `utf8mb4_0900_ai_ci` |
| hs_math_* 表数 | **8**（无 methods / item_methods） |
| 题目总数 | **110** |
| draft / disabled / approved | **105 / 5 / 0** |
| draft formal | **105** |
| CH1 draft / CH1 disabled | **80 / 5** |
| CH3 draft（parity） | **25** |
| parity 难度 1/2/3 | **16 / 7 / 2** |
| reviews | **0** |
| content_version 分布 | **1→105；2→5** |
| DIFF-2C 五题 version=2 | `…-0017/0018/0020/0025` difficulty=1；`…-0024` difficulty=2 |
| sessions / session_items | **39 / 195** |
| source_% 列 | **不存在** |
| hs_math_methods / item_methods | **不存在** |
| 部分迁移迹象 | **无** |

与基线一致；**未**发生部分迁移。

---

## E. 指纹兼容复核

实现：`buildFingerprintMetaBlock` + `canonicalizeImportItem` + `fingerprintTrainItemContent` + `computeItemContentFingerprint`（审核/批准共用）。

| 规则 | 结论 |
|---|---|
| V1 | 默认来源 + 无方法 → **不附** meta；与迁移前哈希兼容 |
| V2 | 非默认来源或存在方法 → `metaSchema=v2` + source + methodCodes(sorted) + primaryMethodCode |
| 方法指纹键 | **code**（改 name 不变指纹） |
| content_version | 迁移**不**升版；编辑/替换 methods/KP/source 升版 |
| 审核/队列/批准/导入 | 同 canonicalize 链；未见第二套算法 |

### 场景判定

| 场景 | 判定 |
|---|---|
| A 旧题完全不修改 | 指纹保持 V1 等价；version 不变 |
| B 首次添加来源 | →V2；version+1；旧 passed 会 STALE（当前 0） |
| C 首次添加方法 | →V2；version+1 |
| D 同时改来源+方法 | content-meta **单次** +1 |
| E 只改方法名称 | 指纹不变；无意义 STALE **否** |
| F 删除方法关联 | 指纹变（V2→可能回 V1）；version+1 |
| G 改 difficulty | substantive；version+1；指纹变 |
| H 改 KP | replaceKP 总是 +1 |
| I 导入旧 JSON | 缺省 source/methods → V1 兼容 |
| J 导入带 meta 的 JSON | V2；confirm 写列+关联 |

**残留风险（非阻塞）**：`PUT methods` / `replaceKP` / 带 source 的 content-meta **即使语义未变也总是 +1**（与既有 KP 策略一致）。`expectedContentVersion` 为可选。

---

## F. 并发与事务复核

| 路径 | 行锁 | 事务 | version | 备注 |
|---|---|---|---|---|
| PATCH :id | pessimistic_write | 是 | substantive 才 +1 | 可选 expectedVersion→409 |
| PUT :id/methods | 是 | 是 | **总是 +1** | 原子删插 |
| PUT :id/content-meta | 是 | 是 | 有变更时 **至多一次 +1** | 推荐入口 |
| PUT :id/knowledge-points | 是 | 是 | 总是 +1 | 既有 |
| POST reviews | 是 | 是 | 不改题 version；校验 expected fp/ver | 竞态→409 |
| PATCH status→approved | 是 | 是 | 不升版 | 指纹门禁+许可 |
| import confirm | 批事务 | 是 | 新题 version=1 | 幂等按指纹 |

**未发现必须标 BLOCKER 的并发漏洞。**  
说明：无 expectedVersion 时靠行锁串行，后写覆盖；非丢失更新检测，属已知可接受。未能用真实双会话压测（本阶段禁止写库）→ 不声称「实测并发安全」。

---

## G. 来源许可门禁

| 检查 | 结论 |
|---|---|
| 统一函数 | `assertValidSourceFields` / `assertSourceAllowsFormalPublish` |
| 正式批准入口 | 仅 `publishWithHumanReviewGate`（`status→approved`） |
| formal 叠加许可 | **是** |
| 导入 confirm → approved | **否**（恒 draft） |
| PATCH 字段绕过批准 | **否**（改内容回 draft，不设 approved） |
| 前端替代门禁 | 无（后端强制） |
| adapted/past_exam 无出处 | persist 即 400 |
| 空串绕过 | `emptyToNull` + 必填校验 |
| 来源≠难度 | 独立字段 |
| original+unverified+unknown | 允许批准（兼容旧题） |
| forbidden/restricted | 拒绝 |

---

## H. 旧题兼容与部署顺序影响

| 问题 | 答案 |
|---|---|
| 1 迁移前能否启动**新**API | **否**（Entity 已映射 source_* → Unknown column） |
| 2 迁移前旧 API | **可**（若仍跑未含 source Entity 的构建） |
| 3 迁移是否影响旧 API 读 | 瞬间锁；完成后多列可忽略 |
| 4 迁完未升 API | **旧 API 可跑** |
| 5 Entity SELECT 缺列 | **会**（新 API） |
| 6–8 审核/导入/训练 | 新 API 在缺列时整体失败风险高 |
| 9–11 停 API / 维护窗 / 重启 | **建议**：短维护窗；先迁后部署/重启新 API |
| 12 须单独授权 | 备份、执行迁移、部署/重启、种子、写库 IT、批准 |

---

## I. 推荐部署顺序

1. 用户授权备份 → 执行备份 → 校验文件大小/头尾。  
2. 停写或确认无管理员并发改题（建议短暂停本地 API 写操作）。  
3. 预检：`SELECT DATABASE()`；`SHOW COLUMNS … source_%` 空；methods 表不存在。  
4. 执行 `migrate_hs_math_p1_func_core1a.sql`。  
5. 只读核对：8 列默认值；methods 表空；`content_version` 分布仍为 105×1 + 5×2；status 未变。  
6. **再**部署/重启含 CORE-1A-1 的 API。  
7. 冒烟：list items、methods list、任选一题 GET。  
8. 管理 UI / 写库 IT / 批准 → 另授权。

---

## J. 备份方案（本阶段 NOT_RUN）

| 项 | 建议 |
|---|---|
| 对象 | `study_system`（至少 `hs_math_*`；推荐全库） |
| 目录 | `db/backups/`（已在 `.gitignore`） |
| 命名 | `study_system_pre_core1a_YYYYMMDD_HHMMSS.sql` |
| 命令示例 | `mysqldump -h 127.0.0.1 -P 3306 -u … -p --default-character-set=utf8mb4 --single-transaction --routines --triggers study_system > db/backups/….sql` |
| 完整性 | 文件非空；尾含 `Dump completed`；抽查 `hs_math_train_items` |
| 失败停 | dump 非 0 / 文件过小 → **禁止迁移** |
| 停写 | 建议短窗口，降低 dump 与业务交叉 |
| 恢复 | **须二次授权**；不得自动全库恢复；不得删旧备份 |

---

## K. 部分失败恢复

MySQL DDL **隐式提交**，整文件不能事务回滚。

| 失败点 | 状态 | 建议 |
|---|---|---|
| ADD COLUMN 中途失败 | 通常整句原子；未加列 | 修错后重跑该 ALTER（先确认列不存在） |
| 列已加、索引失败 | 有列无索引 | 仅补 `ADD KEY`（确认索引名不存在） |
| 表已建、关联表失败 | methods 在、item_methods 无 | 补建关联表 |
| 全成功后业务回退 | — | 另授权：DROP 两表 + DROP 八列（须先撤新 API） |

**禁止**：用迁移后备份覆盖迁移后新产生的业务数据而未评估。

---

## L. 静态测试结果

| 测试 | 结果 |
|---|---|
| `npm run hs-math:p1-func-core1a-selftest` | **PASS** |
| `npm run build`（api） | **PASS** |
| 写库 IT / 导入 confirm / E2E / 审核写入 / 批准 | **NOT_RUN**（禁止） |
| 真实双会话并发压测 | **NOT_RUN** |

---

## M. 风险与阻塞项

| 级别 | 项 |
|---|---|
| 操作 | ADD COLUMN 非幂等 → 执行前预检 |
| 操作 | 脚本无 `USE study_system` → 靠连接库名 |
| 部署 | **必须先迁移再上新 API** |
| 产品 | original+unverified 可批准（已选兼容） |
| 注释 | migrate verification COMMENT 含 rejected（与代码枚举不一致） |
| 无 BLOCKER | 未发现阻止首次迁移的结构/安全缺陷 |

---

## N. 是否建议授权迁移

**建议授权**：在完成备份与预检后，执行 `db/migrate_hs_math_p1_func_core1a.sql`。

**不建议**同时授权：部署新 API、种子数据、写库 IT、批准题目（应分步）。

---

## O. 建议授权范围（下一批）

1. 执行 mysqldump 备份（全库或 hs_math_*）。  
2. 执行 CORE-1A 迁移 SQL（仅该文件）。  
3. 迁移后只读复验。  
4. （可选另批）部署/重启新 API。  
5. （另批）方法词典种子 / 管理 UI / 写库 IT / 批准。

---

## P. 下一阶段执行步骤（CORE-1A-2B 设想；本阶段不进入）

1. 用户授权备份+迁移。  
2. 执行并复验。  
3. 更新 HANDOFF §8 LAST_VERIFIED。  
4. 授权后部署新 API。  
5. 再开管理端来源/方法 UI。

---

## 附录 · 本阶段文件动作

| 动作 | 路径 |
|---|---|
| 新增报告 | `docs/high_school_math/44_p1_func_core1a2a_migration_final_review.md` |
| 更新交接 | `docs/high_school_math/PROJECT_HANDOFF.md` |
| 业务代码 | **未改** |
| 迁移 SQL | **未改、未执行** |
| 临时只读脚本 | 已用后删除（不保留） |
