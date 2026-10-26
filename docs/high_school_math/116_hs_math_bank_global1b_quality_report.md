# HS-MATH-BANK-GLOBAL-1B/1C — 候选题质量快照（自动渲染）

> 日期：2026-10-26
> 数据：`question_bank/candidates-g1b-100.mjs`（100 道，**GLOBAL-1C 修复后**）
> 详细修复说明见 `118_hs_math_bank_global1c_quality_repair.md`；KP 缺口见 `117_…_kp_gap.md`
> 本阶段：**无写库** / **无真实 AI HTTP** / **未 approve**

## 1. 全10章可抽取与缺口（摘要）

详见 `114_hs_math_bank_global1b_inventory.md`（盘点时点）。

| 口径 | 值 |
|------|-----|
| 现可抽取合计 | **13**（仅第3章；DB 未改） |
| 目标 | **3120** |
| 缺口 | **3107** |
| KP 种子草案 | 见 `kp-seed-g1c.mjs` / SQL NOT_EXECUTED |

## 2. 本批 100 道结构统计

| 项 | 数量 |
|----|------|
| 候选总数 | 100 |
| 基础/提高/压轴 | 35 / 40 / 25 |
| single/multi/judge/numeric/application | 34 / 7 / 16 / 19 / 24 |
| application | 24 |
| sourceType=original | 100 |
| past_exam | 0 |
| kpInDb=true | 20 |
| kpInSeed=true | 100 |
| mathVerified SPOT/AUTHOR/UNVERIFIED | 53 / 47 / 0 |
| reviewReady（迁移后可进 draft 候选） | **100** |
| 质量门禁 blocked | **0** |

章配额：1:5 · 2:10 · 3:15 · 4:15 · 5:20 · 6:15 · 7:3 · 8:10 · 9:3 · 10:4。

## 3. 自动检查

| 检查 | 结果 |
|------|------|
| id 唯一且连续 001–100 | PASS |
| 章配额 | PASS |
| 难度 35/40/25 | PASS |
| 五题型齐全 | PASS |
| application rubric 分项和=maxScore | PASS |
| 解析过短（<80字） | 0 |

## 4. 数学正确性说明

- `mathVerified`：SPOT_VERIFIED / AUTHOR_CHECKED / UNVERIFIED；**不等于**独立第三方审稿。
- 人工终审优先：application、difficulty=3、multi、空间证明。

## 5. 最终状态

**READY_FOR_KP_MIGRATION**（详见 118）。下一授权：执行 KP SQL → draft 入库。勿自动 CORE-1B。
