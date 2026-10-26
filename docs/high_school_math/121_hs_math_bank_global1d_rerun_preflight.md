# HS-MATH-BANK-GLOBAL-1D-RERUN — KP 迁移前预检（重跑）

> 日期：2026-10-26  
> 前置：GLOBAL-1C-RECOVERY = RECOVERY_PASS；历史 GLOBAL-1D = BLOCKED（见 119，**不改写**）  
> 库：`study_system` **只读**  
> SQL：`db/seed_hs_math_global1c_missing_kps.sql`（**本阶段未执行**）  
> **最终状态：`PREFLIGHT_PASS`**

---

## 0. 结论摘要（现算，不沿用旧数）

| 项 | 结果 |
|----|------|
| 当前库内 KP 总量 | **42** |
| 已有 42 条是否仍在 | **是**（与 `existingInDb` code 全等；无缺失） |
| 拟新增 111 code 是否仍不存在 | **是**（冲突 **0**；命名空间探测 0） |
| 实际待迁移数量 | **111** |
| SQL ↔ 结构化种子 | **111/111**；差集空 |
| 索引 | **153 = 42 + 111** |
| category 覆盖（种子所需） | **35/35** |
| 候选主 KP 覆盖 | **100/100** |
| text_only / rubric 失败 / 映射错位 | **0 / 0 / 0** |
| 文件保护（117–120、seed、sql、HANDOFF） | **全部存在** |
| 正式迁移条件 | **具备**（须按 §5 runbook 执行；本阶段不执行） |

**GLOBAL-1D-RERUN = PREFLIGHT_PASS**  
（历史 **119 仍为 BLOCKED 史实**；本轮为独立重跑结论。）

---

## 1. 数据库只读复验

### 1.1 specialty 分布

| specialty | kp_n |
|-----------|------|
| rja-ch1 | 15 |
| rja-ch2 | 0 |
| rja-ch3 | 27 |
| rja-ch4 … rjb-ch5 | 0 |
| **合计** | **42** |

### 1.2 冲突与差异

- `insert_namespace_existing`（`rja.2.%` / `rja.3.4.%` / `rja.4.%` / `rja.5.%` / `rjb.%`）= **0**  
- 111 拟插入 code ∩ 库内 code = **∅**  
- 库内无「种子未登记」的额外 KP  
- 未发现其他进程已写入拟插入命名空间  

### 1.3 表结构与约束

`hs_math_knowledge_points`：`code` **UNIQUE**；FK → specialty / category / parent；`summary` varchar(512)；与实体/init 一致。

### 1.4 category

种子 INSERT 依赖的 (specialty, section) **35** 对全部存在（含 3.4、4.5、7.3、8.2 等）。

---

## 2. 种子与 SQL 一致性

| 检查 | 结果 |
|------|------|
| existingInDb / seedsToInsert / all | 42 / 111 / 153 |
| SQL SELECT code 数 / 唯一 | 111 / 111 |
| onlySeed / onlySql | 空 |
| code↔section↔specialty | 0 错位 |
| REPLACE / ON DUPLICATE（正文） | **无** |
| WHERE NOT EXISTS | 9（与 INSERT 块一致） |
| 其他表 INSERT | **无** |
| START TRANSACTION | **无**（见 runbook） |

---

## 3. 候选题（100）

| 检查 | 结果 |
|------|------|
| 主 KP ∈ 种子 | 100/100 |
| method ∈ 11 字典；无 text_only | PASS |
| application rubric 和=maxScore | PASS |
| section 与 kpCode 中段 | PASS |
| `reviewReady` 字段 | 100（= 迁移后可进 draft 候选） |
| `kpInDb` | 20（事实） |
| mathVerified | SPOT 53 / AUTHOR 47 / UNVERIFIED 0 |

说明：`reviewReady` **≠** approved；`AUTHOR_CHECKED` **≠** 独立终审。无独立 `kpAux` 数组。

---

## 4. Git 文件保护（只报告，不提交）

关键交付均在磁盘。当前多为 **未跟踪 `??`**（含 seed、117–120、SQL、candidates 等）；`PROJECT_HANDOFF.md` 为 **modified**。

**建议纳入版本管理（下次人工 commit，本阶段不 commit）：**

- `db/seed_hs_math_global1c_missing_kps.sql`  
- `docs/high_school_math/question_bank/kp-seed-g1c.mjs`  
- `docs/high_school_math/question_bank/candidates-g1b-100.mjs`  
- `docs/high_school_math/117`…`121`  
- `docs/high_school_math/PROJECT_HANDOFF.md`  

未执行：`git reset --hard` / `git clean -fd` / 强制 checkout / 擅自 commit。

---

## 5. 迁移 Runbook（设计与检查；本阶段不执行）

### 5.1 执行前

1. 备份：`mysqldump study_system hs_math_knowledge_points > backup_kp_YYYYMMDD.sql`  
2. 只读确认：`COUNT(*)=42`；`COUNT(code IN 111个)=0`  
3. 确认 35 category 仍在  

### 5.2 事务方式（强制）

现行 SQL **无**显式事务。正式迁移必须：

```text
START TRANSACTION;
SOURCE db/seed_hs_math_global1c_missing_kps.sql;
-- 核验（见下）全部通过后再：
COMMIT;
-- 任一项失败：
ROLLBACK;
```

禁止「无报错即 PASS」。INNER JOIN 不到 category 时会**静默 0 行**——必须以计数为准。

### 5.3 执行后强制核验（fail-closed）

| # | 条件 | 期望 |
|---|------|------|
| 1 | `COUNT(*)` | **153**（42+111） |
| 2 | `COUNT(*) WHERE code IN (111…)` | **111** |
| 3 | 按 specialty 抽样 JOIN category | 无错挂 |
| 4 | 训练表 row count（抽查） | 与执行前一致 |

任一项不符 → **迁移失败**，不得报告 PASS；依赖备份或 ROLLBACK。

### 5.4 幂等

允许重跑；`WHERE NOT EXISTS` 跳过已有 code。重跑后仍须 `IN (111)=111`。

### 5.5 范围

仅 `hs_math_knowledge_points`；不碰 train / AI / 其他学科。

---

## 6. 是否具备正式迁移条件

**是（PREFLIGHT_PASS）**，但仍须：

1. 独立迁移授权  
2. 按 §5 事务 + 计数验收  
3. 建议先将关键文件 commit，避免再次丢失  

本阶段：**停止；未写库；未迁移。**  
