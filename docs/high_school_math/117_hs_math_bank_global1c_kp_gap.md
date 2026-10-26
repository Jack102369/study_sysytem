# HS-MATH-BANK-GLOBAL-1C — KP 缺口分析与种子方案

> 日期：2026-10-26  
> **文档状态：RECOVERY 重生**（原文件曾丢失；由 GLOBAL-1C-RECOVERY 按现存 SQL/候选现算重写）  
> 本阶段：**无写库**；种子仅为可审阅草案  

---

## 1. 候选题 KP 缺口（相对库内事实）

| 口径 | 数量 |
|------|------|
| 候选总数 | 100 |
| `kpInDb=false`（需迁移后方可挂库内 KP） | **80** |
| `kpInDb=true`（Ch1+Ch3） | **20** |
| 拟 INSERT 种子条数 | **111**（含教材小节补齐，多于 80） |

### 1.1 按章分布（`kpInDb=false` 候选）

| 章 | 影响候选题数 |
|----|-------------|
| 2 | 10 |
| 4 | 15 |
| 5 | 20 |
| 6 | 15 |
| 7 | 3 |
| 8 | 10 |
| 9 | 3 |
| 10 | 4 |
| **合计** | **80** |

### 1.2 编码修正（1C 已落地于候选）

| 题 | 修正 |
|----|------|
| CAND-G1B-033 | → `rja.4.5.01` 指数增长模型 · §4.5 |
| CAND-G1B-038 | → `rja.4.5.02` 对数应用 · §4.5 |

原则：`code` 中段须与 `sectionCode` 一致；禁止「综合知识点」兜底。

---

## 2. 种子方案

权威结构化：[`question_bank/kp-seed-g1c.mjs`](./question_bank/kp-seed-g1c.mjs)（RECOVERY 自 SQL 重建）  
SQL 草案：[`db/seed_hs_math_global1c_missing_kps.sql`](../db/seed_hs_math_global1c_missing_kps.sql)（**NOT_EXECUTED**）

| 集合 | 数量 | 来源 |
|------|------|------|
| `existingInDb` | **42** | migrate Ch1(15) + seed Ch3.1–3.3(27) |
| `seedsToInsert` | **111** | global1c SQL |
| `allKpSeeds` | **153** | 42+111 |

### 2.1 拟 INSERT 按章

| 章 | 条数 |
|----|------|
| 2 | 13 |
| 3.4 | 4 |
| 4 | 19 |
| 5 | 22 |
| 6 | 17 |
| 7 | 7 |
| 8 | 15 |
| 9 | 7 |
| 10 | 7 |

### 2.2 现算一致性（RECOVERY）

- insert code 与 SQL：**111=111**，差集空  
- insert ∩ existing：**空**  
- code↔section↔specialty 映射：**0** 错位  

---

## 3. 后续迁移（须另授权）

1. 重跑 GLOBAL-1D 预检至 `PREFLIGHT_PASS`  
2. 外裹事务执行 SQL  
3. 强制核验 `COUNT(code IN 111)=111`  
4. 再授权 draft（勿自动 CORE-1B）  

---

## 4. 说明

本文件为恢复重生，**不是** git 历史检出。指标以本机现算为准，见 `120_hs_math_bank_global1c_recovery.md`。  
