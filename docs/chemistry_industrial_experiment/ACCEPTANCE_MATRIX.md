# 工业实验 · 综合验收矩阵（STEP_12）

**生成时间：** 2026-10-29 10:37:37 +08:00  
**PHASE_A 附注：** 2026-10-29 11:28:24 +08:00 — 只读确认 D043/D045 **absent**；代码层双图入库+HTTP 装置已补；**未**升格 ACCEPTED。  
**PHASE_B 附注：** 2026-10-29 11:38:29 +08:00 — 主库全量逻辑备份 **BACKUP_VERIFIED_STATICALLY**；真实 restore **未执行**。  
**PHASE_C 附注：** 2026-10-29 12:02:56 +08:00 — D043+D045 **MIGRATION_COMPLETED**（study_system）；新表曾为 0 行。  
**PHASE_D 附注：** 2026-10-29 12:13:39 +08:00 — batch `industrial_acceptance_20261029_121220` Mock 验收候选；**无** formal 写库。  
**PHASE_E1 附注：** batch `industrial_formal_candidate_20261029_121958` manual_fixture×4。  
**PHASE_E2-A 附注：** 内容 QUALITY_BLOCKERS=0；READY_FOR_HUMAN_REVIEW；发布闸门仍挡。  
**PHASE_E2-B 附注：** 2026-10-29 — REVIEW_WORKFLOW_READY；HUMAN_REVIEW_NOT_EXECUTED；formal dry-run only；**未**升格 ACCEPTED。  
**PHASE_E2-B2 附注：** 2026-10-29 13:28:48 — 案例有效审核↔闸门；real publish 默认关；**未**真实入库；**未**升格 ACCEPTED。  
**PHASE_E2-B5 附注：** 2026-10-29 14:37:31 — 科学来源证据包就绪；ACCESSED≠verified；覆盖层/人审/formal **未**执行；**未**升格 ACCEPTED。  
**PHASE_E2-B6 PART A 附注：** 2026-10-29 14:49:44 — 人审就绪；**HUMAN_BROWSER_REVIEW_PENDING**；未代审/未批准/未入库；**未**升格 ACCEPTED。  
**PHASE_E2-B7 附注：** 2026-10-29 15:04:21 — 多模型审核包导出就绪；外部 AI 审核未执行；**未**升格 ACCEPTED。  
**环境判定：** `DB_NAME=study_system`；无 Docker Compose / Playwright / Cypress。

状态取值：`PASS` | `FAIL` | `BLOCKED` | `NOT_EXECUTED`  
验证层级：静态 / Mock 自检 / 构建 ≠ 真实 MySQL IT ≠ 浏览器 E2E ≠ 在线 AI

---

## 汇总

| 状态 | 数量 |
|------|------|
| PASS | 29 |
| FAIL | 0 |
| BLOCKED | 0 |
| NOT_EXECUTED | 17 |
| **合计** | **46** |

---

## 矩阵

| ID | 功能 | 步骤 | 关键代码 | 验证方式 | 命令/证据 | 预期 | 实际 | 状态 |
|----|------|------|----------|----------|-----------|------|------|------|
| A01 | 第13专项种子 | 01–02 | `chemistry.seed.ts` | Mock 自检 | `chem:seed-selftest` | 13专项含 industrial | OK | PASS |
| A02 | 12二级分类 | 01–02 | seed categories | Mock 自检 | 同上 | 工业12类 | OK | PASS |
| A03 | 工业案例模型 | 03–04 | `industrial-case.*` | Mock 自检 | `chem:industrial-case-selftest` | 校验通过 | OK | PASS |
| A04 | 流程 JSON 协议 | 05 | `industrial-diagram.*` | Mock 自检 | `chem:industrial-diagram-selftest` | Schema/案例一致 | OK | PASS |
| A05 | SVG 程序生成 | 06 | `industrial-svg-*` | Mock 自检 | `chem:industrial-svg-selftest` | 安全渲染 | OK | PASS |
| A06 | AI 出题 Mock | 07 | `industrial-ai-*` | Mock 自检 | `chem:industrial-ai-selftest` | Mock OK | OK；live 未跑 | PASS |
| A07 | AI 出题在线 | 07 | HttpProvider | 在线 AI | — | 有限次成功 | INDUSTRIAL_AI 未启用 | NOT_EXECUTED |
| A08 | 自动质检 | 08 | `industrial-quality.*` | Mock 自检 | `chem:industrial-quality-selftest` | unknown≠pass | OK | PASS |
| A09 | 审核仓/闸门 | 09 | `industrial-review.*` | Mock 自检 | `chem:industrial-review-selftest` | draft/mock/dev 阻断 | OK | PASS |
| A10 | item_assets DDL/Entity | 09/D043 | init+migrate+entity | 静态 | `chem:industrial-item-asset-selftest` + step12 | 结构一致 | OK | PASS |
| A11 | session_assets DDL/Entity | 10/D045 | init+migrate+entity | 静态 | train-session + step12 | 结构一致；顺序 D043→D045 | OK | PASS |
| A12 | 全新库 init 含两表 | 09–10 | `db/init.sql` | 静态 | step12 读 init | 两表+UK+FK | OK | PASS |
| A13 | 存量迁移真实执行 | 09–10 | migrate_*.sql | 真实 MySQL | PHASE_C 2026-10-29 | 升级成功 | D043+D045 于 study_system 成功；见 MIGRATION 报告 | PASS |
| A14 | 正式入库真实 DB | 09 | formal-import.db | 真实 MySQL IT | — | 事务/幂等 | 无隔离库 | NOT_EXECUTED |
| A15 | 正式入库 Mock 闸门 | 09 | review+formal | Mock 自检 | review / item-asset | 不合格阻断 | OK（案例未 publishEligible） | PASS |
| A16 | formalAllowed=false | 09/D044 | train-items-admin | 静态 | step12 | 恒 false | OK | PASS |
| A17 | 学生会话快照契约 | 10 | session-diagram.service | 静态/Mock | train-session-selftest | IMPLEMENTED | OK | PASS |
| A18 | 工业静态 uploads 403 | 10 | `main.ts` | 静态 | step12 / main.ts | 403 中间件在静态前 | OK | PASS |
| A19 | SVG 会话 HTTP 鉴权 E2E | 10 | train.controller svg | API IT | — | 跨用户拒绝等 | 无 IT 环境 | NOT_EXECUTED |
| A20 | 前端 Blob / 无 v-html | 10 | IndustrialFlowDiagram | 静态 | step12 | img+blob | OK | PASS |
| A21 | 人工视觉 SVG 布局 | 06/10 | 样例 SVG | 人工视觉 | — | 无穿模/溢出 | 未做视觉 | NOT_EXECUTED |
| A22 | 每日巩固接入 | 11 | ChemDailyReviewService | 静态/复用 | step11-selftest | 动态池+快照 | 契约 PASS；实抽未验 | PASS |
| A23 | 每日真实抽题 | 11 | daily | 真实 DB+API | — | 有/空态正确 | 无隔离库/正式题 | NOT_EXECUTED |
| A24 | 错题筛选+历史图 | 11/D046 | wrong-question.service | 静态 | step11 | events→session assets | 契约 PASS | PASS |
| A25 | 错题真实闭环 | 11 | wrong_* | 真实 DB | — | 记录/筛选/图 | 未执行 | NOT_EXECUTED |
| A26 | AI 变式→审核仓 | 11 | industrial-wrong-variation | 静态 | step11 | formalImportBlocked | OK | PASS |
| A27 | 变式正式训练实抽 | 11 | variation-practice | 真实 DB | — | 仅已审核题 | 无正式变式题 | NOT_EXECUTED |
| A28 | 提高 diff=2 | 11 | ChemAdvancedTrainService | 静态/复用 | step11 | 闸门不降 | 契约 PASS | PASS |
| A29 | 挑战 diff=3 | 11 | 同上 | 静态/复用 | step11 | 闸门不降 | 契约 PASS | PASS |
| A30 | 提高/挑战实抽 | 11 | advanced | 真实 DB | — | 有/空态 | 未执行 | NOT_EXECUTED |
| A31 | analytics industrialFocus | 11 | chem-analytics.service | 静态 | step11 | 12类/无数据≠0% | OK | PASS |
| A32 | 学习分析真实数据 | 11 | analytics API | 真实 DB | — | 隔离正确 | 未执行 | NOT_EXECUTED |
| A33 | Admin kb-bind 代码 | 11 | industrial-kb-bind | 静态 | step11/12 | published only | OK | PASS |
| A34 | kb-bind 后实抽 | 11 | eligibility | 真实 DB | — | 绑后可抽 | 未执行 | NOT_EXECUTED |
| A35 | single/judge/blank 判题 | 全 | chem-train-grade | Mock | step12 | 不回归 | OK | PASS |
| A36 | 原 experiment 16 分类种子 | 回归 | seed | Mock | seed-selftest | 保持16 | OK | PASS |
| A37 | 原化学训练回归实机 | 回归 | chem train | 浏览器/API | — | 不回归 | 未执行 | NOT_EXECUTED |
| A38 | 高一数学未改本步 | 回归 | — | git 审查 | status | 本步不触碰 hs-math | 本步未改；仓内既有脏改保留 | PASS |
| A39 | 路径穿越拒绝 | 安全 | svg-security | Mock | step12 | reject | OK | PASS |
| A40 | 浏览器 E2E 全家桶 | 12 | web views | Playwright等 | — | 入口/训练/分析 | 无 E2E 工具 | NOT_EXECUTED |
| A41 | api build | 12 | nest | 构建 | `pnpm --filter api run build` | 成功 | PASS | PASS |
| A42 | web build | 12 | vite+vue-tsc | 构建 | `pnpm --filter web run build` | 成功 | PASS | PASS |
| A43 | STEP_12 综合自检 | 12 | industrial-step12.selftest | Mock | `chem:industrial-step12-selftest` | PASS | PASS | PASS |
| A44 | STEP_11 自检 | 11 | step11.selftest | Mock | chem:industrial-step11-selftest | PASS | PASS | PASS |
| A45 | 正式题库可用性（生产级） | 09–11 | formal items+KB | 真实环境 | — | 可训可抽 | 案例 draft；无合格正式工业题验证 | NOT_EXECUTED |
| A46 | 隔离测试库创建与迁移 IT | 12 | Docker/IT | 环境 | — | 安全迁移 | 无 compose；业务库身份 | NOT_EXECUTED |

---

## 环境安全结论（MySQL）

| 项 | 结论 |
|----|------|
| 配置库名 | `study_system`（`.env`） |
| 是否明确隔离测试库 | **否** |
| Docker Compose 测试库 | **无** |
| 本次是否执行迁移 | **否（禁止）** |
| 是否触碰用户数据 | **否** |
| 标记 | `NOT_EXECUTED_ENVIRONMENT` |

---

## 说明

- **PASS** 表示：在声明的验证方式下通过；不等于真实环境全量验收。  
- 真实 MySQL / 浏览器 E2E / 在线 AI / 正式抽题 统一记 **NOT_EXECUTED**，不得改写为 PASS。  
- 最终系统结论见 `FINAL_ACCEPTANCE_REPORT.md`。
