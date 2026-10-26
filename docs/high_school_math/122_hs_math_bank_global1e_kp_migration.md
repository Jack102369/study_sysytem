# HS-MATH-BANK-GLOBAL-1E — KP 正式迁移与 MySQL 验收

> 日期：2026-10-26  
> **最终状态：`MIGRATION_PASS`**  
> 库：`study_system`  
> 脚本：`db/seed_hs_math_global1c_missing_kps.sql`  
> 运行器：`question_bank/_g1e_migrate.mjs`（同连接事务）

---

## 1. 授权

用户明确授权 GLOBAL-1E：允许备份并向 `study_system` **新增 111 个 KP**，事务核验通过后 COMMIT；**禁止** draft / approve / 其他库写入。

---

## 2. 执行时间与产物指纹

| 项 | 值 |
|----|-----|
| 开始 (UTC) | 2026-10-26T06:58:26.378Z |
| 结束 (UTC) | 2026-10-26T06:58:27.054Z |
| 事务连接 ID | 174 |
| 事后独立连接 ID | 175 |
| SQL SHA256 | `24ad4e0e15ead9d183da24ca99a5933fd98573705471d0233f79429eb5d3e1fd` |
| 事务动作 | **COMMIT** |

机器可读结果：`docs/high_school_math/_g1e_result.json`

---

## 3. 备份

| 对象 | 路径 | bytes | sha256 |
|------|------|------:|--------|
| KP 表 | `docs/high_school_math/_backups/g1e_hs_math_knowledge_points_2026-10-26T06-58-26.sql` | 12129 | `f9be03aa…50b63df5` |
| categories | `…/g1e_hs_math_categories_2026-10-26T06-58-26.sql` | 7738 | `a6c74d43…cf92848a4` |
| specialties | `…/g1e_hs_math_specialties_2026-10-26T06-58-26.sql` | 3748 | `4c63c4e1…3515a85d` |

- 备份存在、可读、非空；时间戳 2026-10-26T06:58:26Z  
- 未备份学生训练历史 / 图片  
- mysqldump 有 PROCESS privilege 警告（tablespaces），数据 dump 仍成功写出  

---

## 4. 执行前只读核验（实测）

| 检查 | 实测 |
|------|------|
| KP 总数 | **42** |
| 111 目标 code 已存在 | **0** |
| existingInDb 42 仍在 | **42** |
| 插入命名空间已有行 | **0** |
| category 缺失 | **0**（35 对） |
| 种子↔SQL | **111/111** |

未发现关键条件变化 → 继续迁移。

---

## 5. 事务内验收（COMMIT 前，同连接实测）

| 检查 | 期望 | 实测 | 结果 |
|------|------|------|------|
| KP 总数 | 153 | **153** | PASS |
| 111 目标 code 存在 | 111 | **111** | PASS |
| 旧 42 code 仍在 | 42 | **42** | PASS |
| 重复 code | 0 | **0** | PASS |
| specialty/section JOIN | 全对 | **0** 错挂 | PASS |
| 100 候选主 KP 可解析 | 100 | **100** | PASS |
| `hs_math_train_items` COUNT | 不变 | 111→**111** | PASS |

全部通过 → **COMMIT**。

---

## 6. COMMIT 后独立连接验收（实测）

| 检查 | 实测 |
|------|------|
| KP 总数 | **153** |
| 新增 111 存在 | **111** |
| 旧 42 完整 | **42** |
| 候选 KP 缺失 | **0** |

### specialty 分布（实测）

| specialty | kp_n |
|-----------|------|
| rja-ch1 | 15 |
| rja-ch2 | 13 |
| rja-ch3 | 31（原27+3.4 的4） |
| rja-ch4 | 19 |
| rja-ch5 | 22 |
| rjb-ch1 | 17 |
| rjb-ch2 | 7 |
| rjb-ch3 | 15 |
| rjb-ch4 | 7 |
| rjb-ch5 | 7 |
| **合计** | **153** |

---

## 7. 未做事项（边界）

- 未 draft 入库 / review / approve  
- 未改训练历史、正式题正文、AI 开关  
- 未进 CORE-1B；未重启服务  
- 未 git commit / reset / clean  

---

## 8. Git 未跟踪风险（只报告）

关键文件（种子、SQL、117–122、candidates、备份等）多数仍为工作区未跟踪或 HANDOFF 已改。  
**建议尽快人工 commit**，避免再次丢失。本阶段不提交。

---

## 9. 最终状态

**HS-MATH-BANK-GLOBAL-1E = MIGRATION_PASS**

下一步须**另授权**：draft 入库等。本阶段停止。  
