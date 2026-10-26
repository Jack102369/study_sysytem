# 高一数学模块 · 项目交接文档

> **用途**：新建对话时先读本文。  
> **维护**：`.cursor\rules\hs-math-handoff.mdc`

---

## 1. 项目目标

应用题多模态 + 学生训练入口；全10章题库向 **3120** 目标推进。  
**当前执行阶段**：**HS-MATH-BANK-GLOBAL-1F-FIX**  
**当前阶段状态**：`QUALITY_PASS`  
**1F-FIX = QUALITY_PASS** · 1F史实=QUALITY_PARTIAL · **GLOBAL-1E = MIGRATION_PASS** · 1D-RERUN=PREFLIGHT_PASS · 1D史实=BLOCKED · 1C-RECOVERY=RECOVERY_PASS · 1B=PARTIAL · 4D=PASS  
**CORE-1B = NOT_STARTED** · **GLOBAL-1G = NOT_STARTED**（draft 入库待授权）

---

## 2. 技术要点

| 项 | 说明 |
|---|---|
| 日常 AI | 仍应 ENABLED；本阶段**未改**开关 |
| 库内 KP | **153**（1E 已 COMMIT） |
| drawable | **13**（未 draft） |
| 候选 100 | 协议 100/100；KP/method 齐；**0 FAIL / 0 SUSPECT** |
| 091 | 已消歧：原 \(\angle xOy=90^\circ\) vs 直观图 \(\angle x'O'y'=45^\circ/135^\circ\) |
| 本阶段 | 修题 + 文档 + **本地 git commit**；无 MySQL 写 / 无 draft / 无 push |

---

## 4. 已完成阶段（节选）

- APPLICATION-4D = PASS  
- GLOBAL-1B = PARTIAL  
- GLOBAL-1C-RECOVERY = RECOVERY_PASS  
- GLOBAL-1D = BLOCKED（119 史实）  
- GLOBAL-1D-RERUN = PREFLIGHT_PASS  
- GLOBAL-1E = MIGRATION_PASS  
- GLOBAL-1F = QUALITY_PARTIAL（史实）  
- **GLOBAL-1F-FIX = QUALITY_PASS**

---

## 5–7. 本阶段结果（1F-FIX）

- 修复 CAND-G1B-091；回归 PASS  
- 可入 draft 候选：**100**（待 GLOBAL-1G 授权）  
- Git：本地白名单 commit（见 124）；禁 push  

---

## 8. 数据库状态

- LAST_VERIFIED：2026-10-26（1F-FIX 只读回归）  
- KP=**153** · drawable=**13**  
- 本阶段 DB 变更：**无**

---

## 9. 题库

候选源：`question_bank/candidates-g1b-100.mjs`（091 已修订）。未 draft / 未 approve。

---

## 10. 待授权

1. **GLOBAL-1G**：首批 100 道 draft 入库  
2. 勿自动 CORE-1B；勿关 AI；勿 push（除非另授权）  

---

## 11. 风险

- 含凭据的迁移/校验脚本**未**入 git（`_g1e_migrate.mjs`、`_g1f_protocol_check.mjs`）  
- reviewReady ≠ drawable  

---

## 12. 下一步

1. **停止**本阶段。  
2. 等待 GLOBAL-1G draft 授权。  

---

## 13. 报告路径

- `124_hs_math_bank_global1f_fix.md`  
- `123_hs_math_bank_global1f_quality_review.md`（史实 PARTIAL + FIX 回写）  
- `122` · SQL · `candidates-g1b-100.mjs` · `kp-seed-g1c.mjs`  

---

## 变更日志

| 日期 | 阶段 | 摘要 |
|------|------|------|
| 2026-10-26 | GLOBAL-1F-FIX | 修091；回归PASS；白名单本地commit；QUALITY_PASS |
| 2026-10-26 | GLOBAL-1F | 复核；0 FAIL / 1 SUSPECT(091)；QUALITY_PARTIAL |
| 2026-10-26 | GLOBAL-1E | 迁移111 KP；153；MIGRATION_PASS |
| 2026-10-26 | 1D-RERUN | PREFLIGHT_PASS |
| 2026-10-26 | 1C-RECOVERY | RECOVERY_PASS |
| 2026-10-26 | GLOBAL-1D | BLOCKED（史实） |
| 2026-10-26 | GLOBAL-1B | PARTIAL |
| 2026-10-26 | 4D-FINAL | PASS |
