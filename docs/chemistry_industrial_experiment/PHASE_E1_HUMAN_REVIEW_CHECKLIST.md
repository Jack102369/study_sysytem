# PHASE_E1/E2-A · 人工审核清单

| 字段 | 值 |
|------|-----|
| batchId | `industrial_formal_candidate_20261029_121958` |
| 阶段 | PHASE_E2-B 工作流就绪后 |
| 说明 | **未**自动勾选；一律 `PENDING_HUMAN_REVIEW`；**HUMAN_REVIEW_NOT_EXECUTED** |
| 机器可读 | `formal_candidate_batches/.../human_review_checklist.json` |
| 操作指南 | PHASE_E2B_ADMIN_REVIEW_GUIDE.md |

> 管理员在 `/settings/chemistry-industrial-candidates` 本人操作；不得由 Cursor/脚本写入 approve / reviewedContentHash / published。

---

## 候选 01 · cand_63284abdddf24cee

| 字段 | 值 |
|------|-----|
| 版本 revision | 见 store（当前 ≥5） |
| auditContentHash | `83651f1b22d1844c…` |
| 来源 | SOURCE_VERIFICATION_INCOMPLETE |
| 案例 | salt_purification_basic / draft |
| 质检 | failed_automatic_checks（发布闸门）；QUALITY_BLOCKERS=0 |
| READY_FOR_HUMAN_REVIEW | **YES** |
| READY_FOR_FORMAL_IMPORT | **NO** |

| 检查项 | 状态 |
|--------|------|
| 题干/答案/解析 | PENDING_HUMAN_REVIEW |
| 化学事实 / 案例来源 | PENDING_HUMAN_REVIEW |
| 流程图 / 图文 | PENDING_HUMAN_REVIEW |
| 课程与难度 | PENDING_HUMAN_REVIEW |
| KB #20/#19/#2 | PENDING_HUMAN_REVIEW |
| unknown 确认 | PENDING_HUMAN_REVIEW |
| 管理员审核状态 | PENDING_HUMAN_REVIEW |

blocking（发布）：CURR_CASE_TRUST；CHEM_SOURCE_VERIFIED  
待核验：案例是否可升格；过滤答案与「操作①」一致。

---

## 候选 02 · cand_8ce596acabc64f26

| 字段 | 值 |
|------|-----|
| 案例（修订后） | **gas_wash_teaching_basic** / draft |
| auditContentHash | `5d8e06f29a79b8ec…` |
| 图形 | 装置主图 + 流程占位；schematic |
| READY_FOR_HUMAN_REVIEW | **YES** |
| READY_FOR_FORMAL_IMPORT | **NO** |

| 检查项 | 状态 |
|--------|------|
| 题干/判断答案/解析 | PENDING_HUMAN_REVIEW |
| 气路 / 洗气 / 倒吸等安全 | PENDING_HUMAN_REVIEW |
| 流程图占位可接受性 | PENDING_HUMAN_REVIEW |
| KB#61 | PENDING_HUMAN_REVIEW |
| 管理员审核状态 | PENDING_HUMAN_REVIEW |

原内容阻塞（分类错配、CASE_BIND）已在 E2-A 清除。

---

## 候选 03 · cand_03bf94425958444b（双图）

| 字段 | 值 |
|------|-----|
| auditContentHash | `e54861a90eefc162…` |
| 双图哈希 | flow `f2729bf85748…` / apparatus `255a5b54473c…` |
| READY_FOR_HUMAN_REVIEW | **YES** |
| READY_FOR_FORMAL_IMPORT | **NO** |

| 检查项 | 状态 |
|--------|------|
| 题干/答案/解析 | PENDING_HUMAN_REVIEW |
| 双图一致性 | PENDING_HUMAN_REVIEW |
| 安全 / 图文 | PENDING_HUMAN_REVIEW |
| KB#20/#19 | PENDING_HUMAN_REVIEW |
| 管理员审核状态 | PENDING_HUMAN_REVIEW |

原 FILTER_SOLUBLE_SALT 误判已修复；须确认解析科学表述。

---

## 候选 04 · cand_312c51e0c9e249f7

| 字段 | 值 |
|------|-----|
| 难度（修订后） | **2**（原 3） |
| auditContentHash | `30c49a534627f3b1…` |
| 案例 | seawater_resource_basic / draft |
| READY_FOR_HUMAN_REVIEW | **YES** |
| READY_FOR_FORMAL_IMPORT | **NO** |

| 检查项 | 状态 |
|--------|------|
| 题干/答案「过滤」/解析 | PENDING_HUMAN_REVIEW |
| 流程图是否考查该点 | PENDING_HUMAN_REVIEW |
| 海水案例可否正式发布 | PENDING_HUMAN_REVIEW |
| SOURCE_VERIFICATION_INCOMPLETE | PENDING_HUMAN_REVIEW |
| 管理员审核状态 | PENDING_HUMAN_REVIEW |

---

## 共用提醒

- 全部清单项保持 **PENDING_HUMAN_REVIEW**  
- KB 实体 #19/#20 含 human_unreviewed → 实绑前确认  
- 具备人审交接条件；**不具备**正式入库条件  
