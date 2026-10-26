# HS-MATH-BANK-GLOBAL-1D — KP 种子迁移前预检

> 日期：2026-10-26  
> **本文档为史实保留 / RECOVERY 重建**：记录当时 **BLOCKED** 结论，**不得**改为 PASS。  
> 库：`study_system` 只读  
> SQL：`db/seed_hs_math_global1c_missing_kps.sql`（**从未在本阶段执行**）

---

## 0. 最终状态（锁定）

**HS-MATH-BANK-GLOBAL-1D = BLOCKED**

### 当时只读复验（通过部分）

| 项 | 结果 |
|----|------|
| 已存在 KP | **42** |
| 拟新增 | **111** |
| 命名空间/code 冲突 | **0** |
| 候选主 KP 相对「库∪SQL」 | **100/100** |
| text_only | **0** |
| SQL 幂等 `WHERE NOT EXISTS` | 有 |
| SQL 显式事务 | **无**（须外裹） |

### 当时阻断原因（关键）

| ID | 缺口 |
|----|------|
| B-SEED-MJS-MISSING | `kp-seed-g1c.mjs` 不在磁盘 |
| B-DOC-117-118-MISSING | 117 / 118 不在磁盘 |
| B-HANDOFF-REGRESSED | HANDOFF 回退为 APPLICATION-4D |

因此：**禁止执行迁移**。即使 SQL 与库无冲突，缺少权威结构化种子与 1C 文档闭环仍 fail-closed。

---

## 1. 迁移验收要求（供后续授权；本文件不授权执行）

1. 外裹 `START TRANSACTION` … 核验后 `COMMIT`，失败 `ROLLBACK`。  
2. 不得仅凭「无报错」报 PASS。  
3. 强制：`COUNT(*) WHERE code IN (111个) = 111`。  
4. 备份至少 `hs_math_knowledge_points`；不碰训练历史。

---

## 2. 与 RECOVERY 的关系

GLOBAL-1C-RECOVERY 可恢复种子与 117/118，但 **不得改写本节 BLOCKED 史实**。  
恢复完成后应 **重跑 GLOBAL-1D**；仅新预检通过才可标 `PREFLIGHT_PASS`。  
