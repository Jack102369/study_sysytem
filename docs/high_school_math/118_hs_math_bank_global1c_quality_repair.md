# HS-MATH-BANK-GLOBAL-1C — 候选题质量修复报告

> 日期：2026-10-26  
> **文档状态：RECOVERY 重生**（按现存 `candidates-g1b-100.mjs` **现算**，非照抄历史 READY）  
> 数据：`question_bank/candidates-g1b-100.mjs`  
> 本阶段：**无写库** / **无真实 AI HTTP** / **未 draft/approve**

---

## 1. 现算摘要

| 项 | 现算结果 |
|----|----------|
| 候选总数 | **100** |
| KP 编码修正痕迹 | 033→`rja.4.5.01`；038→`rja.4.5.02`（字段已在候选中） |
| `text_only` | **0** |
| 解析（优先 d≥2/application &lt;120 字） | **0** |
| 新增字段存在 | `kpInSeed` / `mathVerified` / `blockReasons` |
| rubric 和≠maxScore | **0** |

辅助修复来源文件（仍在盘）：`analyses-g1c-overrides.mjs`（用于追溯 remap；权威以 candidates 为准）。

---

## 2. 门禁分层（现算）

| 层级 | 结果 |
|------|------|
| 结构（难度 35/40/25、五题型、章配额） | 与 1B 配额一致（现文件保留） |
| method ∈ 11 字典；无 text_only | **PASS** |
| 主 KP ∈ 恢复后种子 | **100/100** |
| `mathVerified` | SPOT **53** · AUTHOR **47** · UNVERIFIED **0** |
| 来源 | 100 × `original` |
| `reviewReady` | **100** |
| 库内 `kpInDb` | **20**（事实） |
| 库内可抽题 | 约 **13**（未改库） |

`reviewReady=true` 含义：KP 在种子中 + 质量门禁通过 → **迁移后可进 draft 候选**；**不等于**已可抽取/已批准。  
`mathVerified` **不是**独立第三方审稿。

---

## 3. method / KP

- 原 1C 曾将 23 处 `text_only` remap；现算残留 **0**。  
- 主 KP 覆盖恢复后 `allKpSeeds`：**100/100**。  
- 无独立 `kpAux` 数组；仅 `methodAux`。

---

## 4. 重复与来源

- 全部 `original`；无 `past_exam`。  
- 结构性 `dedupNote` 保留；未做 embedding 去重。

---

## 5. 结论（RECOVERY 语境）

候选文件现算质量门禁可通过；结构化种子已重建并与 SQL 对齐。  
**GLOBAL-1D 仍为 BLOCKED 史实**（见 119），须重跑预检后才能迁移。  

详见 `120_hs_math_bank_global1c_recovery.md`。  
