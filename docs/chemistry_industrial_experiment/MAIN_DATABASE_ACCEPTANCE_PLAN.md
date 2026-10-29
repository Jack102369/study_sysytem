# 主库（study_system）受控验收执行方案

| 字段 | 值 |
|------|-----|
| 生成时间 | 2026-10-29 11:28 +08:00 |
| 用户决定 | **不使用备用数据库**；后续在现有 `study_system` 受控推进 |
| 本文件状态 | PHASE_A～E2-B2 **已执行**（E2-B2=有效案例闸门；真人审/真实入库 NOT_EXECUTED）；E2-C+ **尚未执行** |
| 当前验收 | CONDITIONALLY_ACCEPTED |
| 最后更新 | 2026-10-29 13:10:00 +08:00 |

---

## 总原则

1. 每一阶段开始前必须有用户**明确批准**。  
2. 任一阶段失败 → **停止**，不得自动进入下一阶段。  
3. 禁止把 Mock / 静态自检冒充真实 IT PASS。  
4. 测试数据必须可识别、可追踪、可精确删除。  
5. 不降低 eligibility / SVG 安全 / 人审闸门。

---

## PHASE_A — 只读检查（本次）

| 项 | 内容 |
|----|------|
| 前置 | 可读 `.env`；MySQL 可连 |
| 允许 | SELECT / INFORMATION_SCHEMA；代码缺陷修复；文档 |
| 禁止 | 迁移、INSERT/UPDATE/DELETE、ensureSeeded 写库 |
| 命令 | `pnpm --filter api run chem:industrial-readonly-audit` |
| 验证 | D043/D045 absent；工业 formal=0；见 POST_STEP_13_READONLY_AUDIT.md |
| 状态 | **已执行（只读）** |
| 失败停止 | 连接失败则记录 NOT_EXECUTED_CONNECTION，不进入 B |

---

## PHASE_B — 备份与迁移准备

| 项 | 内容 |
|----|------|
| 前置 | PHASE_A 完成；**用户已批准 PHASE_B**（2026-10-29） |
| 允许 | `mysqldump` 全库逻辑备份；SHA-256；静态结构对照；migrate 脚本只读复核 |
| 禁止 | 执行 migrate；写业务表；真实 restore；建备用库 |
| 实际结果 | **BACKUP_VERIFIED_STATICALLY**；主文件 `..._20261029_113813.sql`；见 DATABASE_BACKUP_VERIFICATION.md |
| 恢复 | 仅静态评估 + Runbook；**RESTORE_EXECUTION_NOT_PERFORMED** |
| 影响 | 仓库外备份目录占用约 6MB；无业务写 |
| 失败停止 | 若曾失败则禁止 PHASE_C — **本次未失败** |

**已关闭批准节点：** 主库 dump。恢复演练仍禁止（无备用库策略）。

---

## PHASE_C — D043/D045 正式迁移

| 项 | 内容 |
|----|------|
| 前置 | PHASE_B 备份已验证；**用户已批准 PHASE_C**（2026-10-29） |
| 已执行 | 1) D043 `migrate_chemistry_industrial_train_item_assets.sql` 成功  
  2) D045 `migrate_chemistry_industrial_session_item_assets.sql` 成功 |
| 结果 | **MIGRATION_COMPLETED**；表 74→76；新表 0 行；见 DATABASE_MIGRATION_EXECUTION_REPORT.md |
| 禁止（仍有效） | 改其他业务表；synchronize=true；擅自 restore；自动进入 PHASE_D |
| 影响范围 | 仅新增两空表；存量训练数据未改 |

**已关闭批准节点：** study_system 上 D043+D045 迁移。

---

## PHASE_D — 少量受控测试题 + KB links

| 项 | 内容 |
|----|------|
| 前置 | PHASE_C 迁移成功；**用户已批准 PHASE_D** |
| 实际执行 | 文件级审核仓 4 候选（batch `industrial_acceptance_20261029_121220`）；**未**写 test/formal 池；**未**写 KB links |
| 结果 | **COMPLETED**；见 PHASE_D_ACCEPTANCE_PREPARATION_REPORT.md / ACCEPTANCE_TEST_BATCH_MANIFEST.md |
| KB | 仅 KB_BINDING_PLAN；实绑留 PHASE_E |
| 清理策略 | 按 plannedCode 前缀 `iaacc_20261029_121220_` + 审核仓 cand_*（PHASE_G） |

---

## PHASE_E1 — 正式候选准备（已执行）

| 项 | 内容 |
|----|------|
| 结果 | **COMPLETED**；batch `industrial_formal_candidate_20261029_121958` |
| 说明 | manual_fixture 文件级候选；见 PHASE_E1_FORMAL_CANDIDATES_REPORT.md |

## PHASE_E2-A — 阻塞诊断与修复（已执行）

| 项 | 内容 |
|----|------|
| 结果 | **COMPLETED**；READY_FOR_HUMAN_REVIEW=YES；READY_FOR_FORMAL_IMPORT=NO |
| 说明 | 见 PHASE_E2A_BLOCKER_DIAGNOSIS.md / PHASE_E2A_FIX_LOG.md |
| 禁止已遵守 | 无自动批准；无 formal/KB；未伪造 verified；未改 PHASE_D |

## PHASE_E2-B — 管理员审核工作流（已执行）

| 项 | 内容 |
|----|------|
| 结果 | **COMPLETED**：REVIEW_WORKFLOW_READY；**HUMAN_REVIEW_NOT_EXECUTED** |
| 说明 | 集中审核页+材料包+清单/案例覆盖层 API；formal-import 强制 dry-run |
| 报告 | PHASE_E2B_ADMIN_REVIEW_REPORT.md / PHASE_E2B_ADMIN_REVIEW_GUIDE.md |
| 禁止已遵守 | 无 AI 冒充批准；无 formal/KB/会话写库 |

## PHASE_E2-B2 — 案例有效审核与正式闸门（已执行）

| 项 | 内容 |
|----|------|
| 结果 | **COMPLETED**：有效审核解析+质检联动+real publish 默认关 |
| 说明 | fixture 仍 draft；未自动批准；未写 formal |
| 报告 | PHASE_E2B2_CASE_PUBLISH_GATE_REPORT.md |

## PHASE_E2-B5 — 科学来源证据补全（已执行）

| 项 | 内容 |
|----|------|
| 结果 | **COMPLETED**：证据包 + 指南 + UI；人核/覆盖层/formal **未**执行 |
| 报告 | PHASE_E2B5_SOURCE_EVIDENCE_REPORT.md / scientific_source_packets/ |

## PHASE_E2-B′ — 真实管理员逐题审核（需另行批准/人工操作）

| 项 | 内容 |
|----|------|
| 前置 | E2-B/B2 工作流与闸门就绪；B5 证据材料可用 |
| 允许 | 管理员：来源核验 → 案例 approve_for_publish → 重质检 → 清单/退回/驳回/（闸门满足时）通过 |
| 禁止 | Cursor 代点；伪造 fixture published / verified_by_admin |

## PHASE_E2-C — 正式入库与学生训练闭环（需另行批准）

| 项 | 内容 |
|----|------|
| 前置 | 真实人审通过 + 案例有效审核 + 显式开 `INDUSTRIAL_FORMAL_REAL_PUBLISH` |
| 允许 | 有限条 approved_for_import → formalImport（双图+confirmRealPublish）；kb-bind；学生会话+快照 |
| 禁止 | 无限批量；跨用户读 SVG；公开 `/uploads/industrial-svg`；跳过人审；默认开 real publish |
| 验证 | session_item_assets 行数=题目 assets；鉴权拒绝跨用户 |
| 清理 | 会话/错题/统计/快照级联策略见下 |

---

## PHASE_F — 浏览器 E2E 与权限（按环境）

| 项 | 内容 |
|----|------|
| 前置 | 有可用浏览器自动化或人工脚本 |
| 允许 | 管理审核页、训练页双图、错题历史图、分析页 |
| 禁止 | 把手工点一点记成自动化 PASS 而不标注 |

---

## PHASE_G — 测试数据核对与精确清理（需再次确认）

清理前必须列出：item codes、session ids、wrong events、asset hashes、文件系统未引用 SVG。  
删除顺序建议：session_item_assets → session_items/sessions（仅测试）→ wrong_* → item_assets → item_links → train_items → 可选 GC 未引用 SVG。  
**不得**简单删题即认为清理完成。

---

## PHASE_H — 更新验收矩阵 / 升格评估

仅当真实证据充分时，才允许将系统结论从 CONDITIONALLY_ACCEPTED 升为 ACCEPTED。  
升格需单独用户确认。

---

## 测试数据与会话清理注意

- 错题事件、analytics、图形快照、外键、uploads 哈希文件均需纳入清理清单。  
- 正式用户历史会话若误绑测试题，清理前必须人工确认影响面。

---

## 本方案未执行声明

PHASE_B～H **均未在本次 PHASE_A 执行**。  
不得将本文解读为「主库已验收完成」。
