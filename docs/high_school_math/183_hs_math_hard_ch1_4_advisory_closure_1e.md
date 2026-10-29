# 183 · HS-MATH-HARD-CH1-4-ADVISORY-CLOSURE-1E

> **最终状态：`HARD_IMPORT_PREFLIGHT_PASS`**  
> **独立性：`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`**  
> **本阶段：40 道 advisory 清零 + 预检复跑**（无 MySQL 写入、无正式导入、无 Git）

---

## 1. 原 40 道风险清单（已锁定）

来源：`hard_ch1_4_quality_fix_results.json` → `advisoryResidual.ids`  
数量：**40**（去重后 40，与声称一致）。

完整列表：

001, 002, 003, 004, 007, 010, 011, 014, 015, 017, 020, 022, 023, 029, 030, 032, 034, 042, 046, 048, 049, 050, 051, 053, 055, 059, 063, 064, 067, 068, 069, 080, 086, 087, 088, 089, 092, 093, 094, 097  

逐题旧 SHA / 风险原因 / 处置见 `question_bank/hard_ch1_4_advisory_closure_results.json`。

---

## 2–5. 复核与处置计数

| 结论 | n |
|------|---|
| 初审 MODERATE_ONLY → **整题重建** | **29** |
| 初审 TRUE_H1/H2 → **KEEP 确认** | **11** |
| MATH_ISSUE | **0** |
| 最终 UNCERTAIN | **0** |
| 最终 MODERATE_ONLY | **0** |

**KEEP（11）**：002, 003, 004, 007, 010, 015, 022, 023, 032, 053, 080  
（均有关键推导与突破点记录于 `_pf_adv40_rejudge_*.json`。）

**重建（29）**：其余 advisory ID；任务结构已改（非换数/加长）。

---

## 6–7. 最终 100 道 H 分布与数学

| 等级 | n |
|------|---|
| TRUE_H1 / 标签 H1 | **53** |
| TRUE_H2 / 标签 H2 | **47** |
| TRUE_H3 | **0**（诚实，不虚标） |

组装闸门：`HARD_BATCH100_READY_FOR_PREFLIGHT`；`moderateOrWorse=0`。  
五题型均覆盖：application66 / multi15 / single10 / numeric7 / judge2。

---

## 8–10. Rubric / 协议 / 去重 / 图

- application：重建题 rubric 分值和 = maxScore；导入映射器仍转换 `{step,score}`→协议形态。  
- numeric：dry-run 非法 **0**。  
- vs 813 精确题干碰撞 **0**。  
- REQUIRED **0**（重判仍文字自足；部分 RECOMMENDED）。

---

## 11–13. 导入适配与 SHA

| 项 | 结果 |
|----|------|
| 导入 dry-run | **100/100** |
| DB 基线 | drawable **813**；335/478/0；无 code/KP 冲突 |
| hardLevel | 离线保留；不入库 |
| **batchContentSha256** | `d8d22ad0bcbac2dba134d417e6a3db5cd6407f256492155345330ae043025819` |

设计档案已标记 `REVISED_FIX1E`（重建题）。

---

## 14–16. 未解决问题与独立性

- **无**未解决 MATH_ISSUE / MODERATE_ONLY / UNCERTAIN（就本批离线证据而言）。  
- H3=0：若产品需要顶格压轴，需另开设计（非本阶段失败）。  
- **`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`**：作者侧重推 + 双遍初审 + 重建，**不能**冒充外部独立终审。  
- **正式导入仍未授权。**

---

## 最终状态

# `HARD_IMPORT_PREFLIGHT_PASS`

### 停止声明

未写库、未导入、未改 813、未 Git。等待正式导入等下一阶段授权。

### 交付索引

| 文件 | 说明 |
|------|------|
| `183_…_advisory_closure_1e.md` | 本报告 |
| `hard_ch1_4_advisory_closure_results.json` | 40 题台账 |
| `hard_ch1_4_batch1a_candidates.mjs` | 最终候选 |
| `hard_ch1_4_import_preflight_results.json` | 复跑预检 |
| `_hard14_fix_1e_replacements.mjs` | 29 道重建源 |
