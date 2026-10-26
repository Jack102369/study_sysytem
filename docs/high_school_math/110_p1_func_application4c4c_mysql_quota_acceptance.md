# APPLICATION-4C-4C — DeepSeek 每日额度数据库迁移与真实 MySQL 验收

> 状态：**PASS**  
> 日期：2026-10-26  
> 前置：APPLICATION-4C-4B = PARTIAL（代码+SQL）

---

## 1. 授权依据

用户明确授权 **A–E**：

- A 备份本地 `study_system` 相关结构  
- B 执行 `db/migrate_hs_math_deepseek_daily_quota.sql`  
- C 仅在 `hs_math_deepseek_daily` 测试写入  
- D 验证真实并发 / 原子扣减 / 跨日  
- E 更新文档并跑相关测试  

**禁止项均遵守**：无 Qwen/DeepSeek HTTP、未开 AI、未重启 API、未建 session、未改训练/题库、未进 CORE-1B。

---

## 2. 迁移前状态

| 检查 | 结果 |
|------|------|
| 库名 | `study_system` |
| MySQL | **8.0.44** |
| synchronize | **false** |
| 表 `hs_math_deepseek_daily` | **不存在** |
| `users.id` | `bigint unsigned` |
| Vision/AI | **false / false** |
| MODE | 未配置 → **disabled** |
| SQL 内容 | 仅 `CREATE TABLE IF NOT EXISTS`；无 DROP/TRUNCATE 业务表 |

---

## 3. 备份

| 项 | 值 |
|----|-----|
| 路径 | `db/backups/application4c4c_20261026_122246/` |
| 库 | `study_system` |
| 时间 | 2026-10-26 12:22:46（本地） |
| SQL SHA256 | `C7A33BF54B44455515147D81679196F5F16816DA9C889C90C0180A49C97F8B18` |
| 内容 | `precheck.txt`、`pre_users_schema.sql`、`pre_hs_math_deepseek_daily.sql`（TABLE_ABSENT）、迁移副本、env 快照 |

未导出学生图片 / 训练历史正文。未覆盖既有备份目录。

---

## 4. 迁移结果

- 执行：`migrate_hs_math_deepseek_daily_quota.sql`（`utf8mb4` 文件 stdin；避免 PowerShell 管道破坏编码）  
- 结果：**PASS**（exit 0）  
- 行数初始：0  

### 表结构（摘要）

| 列 | 类型 |
|----|------|
| id | bigint unsigned PK AI |
| user_id | bigint unsigned |
| quota_date | date |
| used_count | int unsigned DEFAULT 0 |
| daily_limit | int unsigned DEFAULT 20 |
| created_at / updated_at | datetime(3) |

- **UNIQUE** `uk_hs_math_deepseek_daily_user_date (user_id, quota_date)`  
- KEY `idx_hs_math_deepseek_daily_date (quota_date)`  

完整 `SHOW CREATE` 见备份目录 `post_show_create.txt`。

---

## 5. 真实 MySQL 验收

脚本：`apps/api/src/hs-math/integration/hs-math-application4c4c-mysql-quota-it.ts`  
命令：`pnpm --filter api run hs-math:application4c4c-mysql-quota-it`

隔离：`user_id=2`，日期 **2099-06-01 / 2099-06-02**（不碰真实当天）。  
调用真实 `HsMathDeepseekDailyQuotaService.tryConsumeAtomic`（事务 + FOR UPDATE + 条件 UPDATE）。

| 项 | 结果 |
|----|------|
| 真实 MySQL 原子扣减 | **PASS** |
| 并发 20 → 恰好 20 | **PASS** |
| 最后一档 8 并发 → 成功 1 | **PASS** |
| UNIQUE 拒重 | **PASS** |
| 跨连接持久化 | **PASS** |
| 北京时间跨日 / UTC 换算 | **PASS** |
| 事务回滚 | **PASS** |
| 非负 / ≤20 | **PASS** |
| 清理 | **PASS**（删本轮 2 行；表回 0；既有行无） |

清理后只读：`hs_math_deepseek_daily` 行数=0；当天 user_id=2 行数=0。

---

## 6. Stub / Build

| 项 | 结果 |
|----|------|
| 4C-4B API stub | **33/33** |
| API build | **PASS** |
| Web build | **PASS** |

---

## 7. 环境（保持）

| 项 | 值 |
|----|-----|
| HS_MATH_VISION_GRADING_ENABLED | **false** |
| HS_MATH_AI_GRADING_ENABLED | **false** |
| HS_MATH_APPLICATION_AI_MODE | **disabled**（未配置） |
| Qwen HTTP | **0** |
| DeepSeek HTTP | **0** |
| API 重启 | **NOT_RUN** |
| UI | **UI_NOT_RUN** |
| 日常自动批改 | **NOT_ENABLED** |

---

## 8. 进入 APPLICATION-4C-4D 的条件（需单独授权）

建议 4C-4D 仅在用户明确授权后进行，例如：

1. 设置 `HS_MATH_APPLICATION_AI_MODE=owner_only`  
2. `HS_MATH_APPLICATION_AI_ALLOWED_USER_IDS=2`  
3. 开启 Vision/AI 开关（或按验收范围临时开启）  
4. **重启 API** 使配置生效  
5. 真实小流量日常路径验收（含 DeepSeek 日额度落库）  

**本轮停止；不自动进入 4C-4D / CORE-1B。**
