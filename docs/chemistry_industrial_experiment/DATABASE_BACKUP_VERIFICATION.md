# PHASE_B · 数据库备份验证报告

| 字段 | 值 |
|------|-----|
| 执行时间 | 2026-10-29 11:36–11:38 +08:00 |
| 阶段 | POST_STEP_13_ACCEPTANCE / **PHASE_B** |
| 备份验证状态 | **BACKUP_VERIFIED_STATICALLY** |
| 恢复实际执行 | **RESTORE_EXECUTION_NOT_PERFORMED** |
| 恢复静态检查 | **RESTORE_STATIC_CHECK_COMPLETED** |
| 系统验收等级 | **CONDITIONALLY_ACCEPTED**（未升格） |

---

## 1. 数据库身份

| 项 | 值 |
|----|-----|
| 名称 | `study_system` |
| 主机 | `127.0.0.1` |
| 端口 | `3306` |
| 用户 | `study_user` |
| MySQL 版本 | **8.0.44** |
| 身份结论 | 与配置一致；已备份目标库 |

密码 / JWT / AI Key：**未写入本报告**。

---

## 2. 备份工具

| 项 | 值 |
|----|-----|
| mysqldump 路径 | `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe` |
| mysqldump 版本 | **8.0.44** Win64 |
| mysql 客户端 | 同目录 8.0.44 |
| 与服务器兼容性 | 主次版本一致 |

认证：本机临时 `defaults-extra-file`（用后删除）；命令行**未**明文拼密码。

---

## 3. 空间与规模（备份前只读）

| 项 | 值 |
|----|-----|
| BASE TABLE | 74 |
| 引擎 | 全部 InnoDB（非事务表 **0**） |
| 数据约 | 4.52 MB |
| 索引约 | 3.52 MB |
| 合计约 | 8.03 MB |
| 视图 / 触发器 / 例程 / 事件 | 0 / 0 / 0 / 0 |
| 备份盘 | D: |
| 可用空间 | ≈ **21.72 GB**（充足） |

---

## 4. 主备份文件（推荐用于 PHASE_C 前置）

| 项 | 值 |
|----|-----|
| 开始 | 2026-10-29 11:38:13 +08:00 |
| 结束 | 2026-10-29 11:38:14 +08:00 |
| 耗时 | ≈ **1.08 s** |
| 路径 | `D:\adu\wj\拉总\学习系统代码\study-system-backups\study_system_pre_industrial_migration_20261029_113813.sql` |
| 大小 | **2,927,610** bytes（≈ 2.792 MB） |
| SHA-256 | `93d557bfe3b83b8a93c0503cb5a05739fecbf80c304c73f43ad49585063e7269` |
| 哈希复核 | 独立计算两次，**一致** |
| 校验文件 | 同名 `.sha256` |
| 元数据 | 同名 `.meta.json`（无密码） |
| 退出码 | **0** |
| stderr | **空** |
| 完成标记 | `-- Dump completed on 2026-10-29 11:38:14` |

参数：`--databases study_system --single-transaction --quick --set-gtid-purged=OFF --no-tablespaces --routines --triggers --events --hex-blob --default-character-set=utf8mb4`

---

## 5. 保留的早期备份（有警告）

| 项 | 值 |
|----|-----|
| 路径 | `...\study_system_pre_industrial_migration_20261029_113733.sql` |
| 大小 | 2,927,610 bytes |
| SHA-256 | `2556e431f17daf3d6300aec252cf3432a32d4a7c3125af93925b289c033521eb` |
| 退出码 | 0 |
| 警告 | `Access denied ... PROCESS privilege ... dump tablespaces` |
| 处理 | **未删除**；主推荐改用带 `--no-tablespaces` 的 113813 文件 |

---

## 6. 静态内容检查

| 检查项 | 结果 |
|--------|------|
| CREATE DATABASE | 1 |
| CREATE TABLE | **74**（与 live 一致） |
| live 缺失于 dump | **0** |
| INSERT 语句数 | 70 |
| FOREIGN KEY 约束痕迹 | 106 |
| UNIQUE 定义痕迹 | 48 |
| 视图/触发器/例程/事件 | 0 |
| 核心表 chem_train_items / sessions / wrong_items / item_links | **有** |
| chem_train_item_assets (D043) | **无**（迁移前预期） |
| chem_train_session_item_assets (D045) | **无**（迁移前预期） |
| DEFINER= | 无 |
| GTID_PURGED | 无（`--set-gtid-purged=OFF`） |
| 字符集样本 | utf8mb4 |
| 明显截断 | 未发现（有 Dump completed） |

---

## 7. 一致性说明

- 全部表 InnoDB → `--single-transaction` **适用**。  
- 备份窗口极短；业务可能并发写入 → 行数与事后 COUNT **允许正常漂移**，不据此判失败。  
- **未**声称跨长时间窗口的物理级停写一致性；逻辑快照在 InnoDB 事务快照语义下完成。  
- 备份期间未观察到 DDL（本阶段亦禁止 DDL）。

---

## 8. 恢复能力（静态）

| 项 | 结论 |
|----|------|
| 含建库/建表/数据 | 是 |
| 含索引/外键定义 | 是（在 CREATE TABLE 内） |
| 特殊对象 | 无（视图/触发器/例程/事件均为 0） |
| 外部文件依赖 | 逻辑 SQL 不依赖；uploads 物理文件**不在**本备份内 |
| 环境依赖 DEFINER | 无 |
| 字符集 | utf8mb4 兼容 MySQL 8 |
| GTID 限制 | 已关闭 purged 写入 |
| 真实恢复演练 | **未执行**（用户禁止备用库 / 禁止对本库 restore） |

状态字：`RESTORE_STATIC_CHECK_COMPLETED` + `RESTORE_EXECUTION_NOT_PERFORMED`  
**不得**写作 `RESTORE_VERIFIED`。

---

## 9. 备份安全

| 检查 | 结果 |
|------|------|
| 位置 | 仓库**外** `study-system-backups\` |
| Web public / uploads | **否** |
| Git 跟踪 | **否**（不在仓库内） |
| 仓库内兜底 ignore | `.gitignore` 含 `db/backups/` |
| 临时 cnf | 用后已删；残留 0 |
| 密码入文档/聊天 | **否** |
| HTTP 静态暴露 | 路径不在 API/Web 静态根下 |

---

## 10. D043 / D045（迁移前）

| 项 | live | backup |
|----|------|--------|
| chem_train_item_assets | absent | absent |
| chem_train_session_item_assets | absent | absent |

迁移脚本已复核：`IF NOT EXISTS`；顺序 D043→D045；本阶段**未执行**。详见 Runbook / MAIN plan。

---

## 11. 已知风险

1. 逻辑备份**不含** `uploads/` 下工业 SVG 等文件。  
2. 未做真实 restore 演练。  
3. `study_user` 无 PROCESS → 须 `--no-tablespaces`（已采用）。  
4. 并发写入可能使「备份后 COUNT」与 dump 行数不完全相同。  
5. 首次 dump（113733）有 tablespaces 警告，保留但不作为主文件。

---

## 12. 下一阶段建议

仅在用户**单独批准 PHASE_C** 后：按顺序执行 D043→D045 迁移；失败则按 `DATABASE_RESTORE_RUNBOOK.md` 评估恢复（仍禁止擅自 restore）。
