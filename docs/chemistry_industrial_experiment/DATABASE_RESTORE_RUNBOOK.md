# study_system 恢复操作说明（Runbook）

| 字段 | 值 |
|------|-----|
| 适用库 | `study_system`（MySQL **8.0.x**，已验证备份源为 8.0.44） |
| 编写时间 | 2026-10-29 11:38 +08:00 |
| 本文件性质 | **操作说明 only** |
| PHASE_B 执行状态 | **未执行**任何 restore |

> 禁止把「静态解析成功」写成「恢复已验证」。  
> 禁止在未获批准时对本机 `study_system` 执行恢复或删库。

---

## 1. 识别正确备份

主推荐文件（PHASE_B）：

```
D:\adu\wj\拉总\学习系统代码\study-system-backups\
  study_system_pre_industrial_migration_20261029_113813.sql
```

配套：

- `.sha256` — SHA-256 校验  
- `.meta.json` — 时间/大小/参数（无密码）

另有 `..._113733.sql`（含 PROCESS/tablespaces 警告）— **优先用 113813**。

文件名含义：`pre_industrial_migration` = **D043/D045 迁移前**快照；备份内**不应**含 `chem_train_item_assets` / `chem_train_session_item_assets`。

---

## 2. SHA-256 校验

PowerShell 示例（勿把哈希文件内容当 SQL 执行）：

```powershell
Get-FileHash -Algorithm SHA256 -Path "....\study_system_pre_industrial_migration_20261029_113813.sql"
# 期望：93d557bfe3b83b8a93c0503cb5a05739fecbf80c304c73f43ad49585063e7269
```

与 `.sha256` 文件对照；不一致则**停止**，不得恢复。

---

## 3. MySQL 版本要求

- 目标实例建议 **MySQL 8.0.x**（与源 8.0.44 同主版本）。  
- 字符集：utf8mb4。  
- 备份使用 `--set-gtid-purged=OFF`，降低跨实例 GTID 冲突风险；若目标开启 GTID，仍需 DBA 评估。

---

## 4. 恢复前必须停止的服务

1. 停止本机 API（Nest）与 Web 开发服务器，避免连接写入。  
2. 确认无其他批处理/种子脚本连库。  
3. **再次确认**连接目标库名是预期库（防止覆盖错误库）。  
4. 用户明确书面批准「允许恢复 / 覆盖」。

---

## 5. 防止覆盖错误数据库

恢复前强制检查清单：

1. `SELECT DATABASE();` / 配置中的 `DB_NAME` 是否为目标。  
2. 备份文件头 `CREATE DATABASE` / `USE` 是否为 `study_system`。  
3. 若恢复到**同名业务库**：等同于**灾难恢复覆盖**，必须单独批准。  
4. 本项目用户决策「不使用备用库」→ 任何 restore 风险极高，默认**不做**。

---

## 6. 确认备份时间

查看：

- 文件名时间戳 `YYYYMMDD_HHMMSS`  
- 文件尾 `-- Dump completed on ...`  
- `.meta.json` 的 `backupStart` / `backupEnd`

---

## 7. 外键 / 触发器 / 例程

本备份：视图、触发器、存储过程、函数、事件均为 **0**。  
表内 FK 随 `CREATE TABLE` 重建。恢复时若手工拆分脚本，注意：

- 可按 mysqldump 默认顺序；或临时 `SET FOREIGN_KEY_CHECKS=0`（仅维护窗口，恢复结束改回 1）。

---

## 8. 建议恢复命令形态（**勿自动执行**）

使用 `defaults-extra-file` 认证，**禁止**把密码写进文档或聊天：

```text
mysql --defaults-extra-file=<受限cnf> < 备份.sql
```

或先建空库再导入（视策略而定）。  
**PHASE_B / 当前会话禁止运行上述命令。**

---

## 9. 恢复结果检查（若将来获批执行）

只读/结构检查示例：

```sql
SELECT COUNT(*) FROM information_schema.tables
 WHERE table_schema='study_system' AND table_type='BASE TABLE';
-- 迁移前快照期望约 74；迁移后应 +2（D043/D045）

SHOW TABLES LIKE 'chem_train_item_assets';
SHOW TABLES LIKE 'chem_train_session_item_assets';
```

勿为「证明成功」导出用户学习内容。

---

## 10. 恢复失败处理

1. 立即停止后续迁移/写题。  
2. 保留失败日志与当时备份哈希。  
3. 评估是否需二次恢复或从更早文件回退。  
4. **不要**在未分析前反复 drop/import。

---

## 11. 恢复后应用检查

| 层 | 检查 |
|----|------|
| API | 能连库启动；化学列表/训练读接口可用 |
| Web | 登录与化学首页可开 |
| 数据 | 专项/分类数量合理；**不**抽样输出隐私作答内容 |
| 工业 | 迁移前：D043/D045 仍应 absent；迁移后另按验收清单 |

---

## 12. uploads 与逻辑库备份的关系

`mysqldump` **不包含** `uploads/industrial-svg/` 等文件。  
灾难恢复若涉及图题，需另行备份/还原文件系统；PHASE_B 范围仅逻辑库。

---

## 13. 安全注意

- 备份目录在仓库外；勿拷入 `apps/web/public` 或 `uploads`。  
- 勿提交 Git；勿上传 AI Provider。  
- 勿在文档记录真实密码。  
- 临时 cnf 用后删除。
