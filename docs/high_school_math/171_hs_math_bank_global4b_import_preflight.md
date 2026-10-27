# HS-MATH-BANK-GLOBAL-4B-IMPORT-PREFLIGHT（含 4D 复跑）

**最终状态：`IMPORT_PREFLIGHT_PASS`**  
**独立性：`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`**  
**最近复跑：GLOBAL-4D-HARD-D3-REBUILD（2026-10-27）**

机读：`question_bank/global4b_import_preflight_results.json`  
4D 报告：`173_hs_math_bank_global4d_hard_d3_rebuild.md`  
4C 报告：`172_hs_math_bank_global4c_d3_quality_fix.md`（历史 PARTIAL，已被 4D 覆盖）

---

## 0. ACCEPTABLE 口径（维持）

「275 ACCEPTABLE」实为候选 **`CAND-G4A-275`**，ACCEPTABLE 仅 **1** 条（并 vs 交），4B 已 `ACCEPTABLE_CONFIRMED`。

---

## 1. 正式题库只读基线（复跑）

drawable **313**；CAND-G4A 冲突 0；KP/method 缺失 0。

---

## 2–3. 快照与五组一致性（复跑）

| 项 | 结果 |
|----|------|
| 500 / 5×100 / 合并一致 | 通过 |
| 全批内容 SHA | `def9b8c49ac641de72632f09c8bfd2aeb0554d945be10db853667e88d9c5ab15` |
| 配额 175/200/125 与题型/章节 | 通过 |

---

## 4–9. 质量门（4D 复跑结论）

| 门 | 结果 |
|----|------|
| hardProfile 125/125 + SHA 绑定 | 通过 |
| 弱压轴启发式 | **0** |
| exact 去重 | 0 |
| application rubric | 结构 OK，`adaptErrors=0` |
| REQUIRED | **27/27** |
| 导入适配 | 500/500 |

作者侧门禁清零 → **`IMPORT_PREFLIGHT_PASS`**。  
独立终审仍未建立；**不授权正式导入**（须单独授权）。

---

## 10–11. Schema / 协议

preview/confirm ≤100/批；drawable=`formal+approved+is_active`；本阶段仍不执行写操作。

---

## 12–14. 开放问题与停止点

- 保留：`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`  
- **状态：`IMPORT_PREFLIGHT_PASS`**  
- **已停止；等待第四批 500 道正式导入的单独授权**

详见 `173`。
