# E1 正式候选 · 人工审核材料索引（E2-B4 后）

| 字段 | 值 |
|------|-----|
| batchId | `industrial_formal_candidate_20261029_121958` |
| 材料版本 | **PHASE_E2-B4**（2026-10-29；取代 B3 旧表述） |
| 标注 | FACT / AUTOMATED_ANALYSIS / NEEDS_HUMAN_VERIFICATION |
| 禁止 | AI_REVIEW_APPROVED；不得写回人审通过 |

> B3 材料中「04 答案=过滤」等描述已过时；以本 INDEX 与各 cand_*.md 及仓库 cand JSON 为准。

---

## 汇总表

| 候选 ID | rev | 题型 | 案例 | E2-B4 | 答案 | 关键残留疑点 | 人审 | formal |
|---------|-----|------|------|-------|------|--------------|------|--------|
| [cand_63284abdddf24cee](./cand_63284abdddf24cee.md) | **9** | single/1 | salt | REVISED 题干澄清操作① | 过滤 | 案例 draft/来源 unverified | pending | blocked |
| [cand_8ce596acabc64f26](./cand_8ce596acabc64f26.md) | **9** | judge/1 | gas_wash | REVISED 图示顺序命题 | true | 未指定气体/洗液；尾气 unknown | pending | blocked |
| [cand_03bf94425958444b](./cand_03bf94425958444b.md) | **7** | single/2 | salt | **NO_CHANGE** | 除去不溶性杂质… | 同 salt 来源闸门 | pending | blocked |
| [cand_312c51e0c9e249f7](./cand_312c51e0c9e249f7.md) | **9** | blank/2 | seawater | REVISED 方案B→结晶 | **结晶** | 来源 unverified | pending | blocked |

## 共同阻断（FACT）

CURR_CASE_TRUST + CHEM_SOURCE_VERIFIED；QUALITY_BLOCKERS 内容向仍为空；humanDecision=null；案例覆盖层未批；real publish OFF。

## 操作

`PHASE_E2B3_HUMAN_REVIEW_OPERATIONS.md` + `PHASE_E2B4_SCIENTIFIC_REVISION_REPORT.md`
