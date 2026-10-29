# PHASE_E2-B · 管理员审核工作流报告

| 字段 | 值 |
|------|-----|
| 执行日期 | 2026-10-29 |
| 阶段状态 | **COMPLETED**（工作流就绪 ≠ 真人审完成） |
| 目标批次 | `industrial_formal_candidate_20261029_121958` |
| 候选数 | 4 |
| REVIEW_WORKFLOW_READY | **YES** |
| HUMAN_REVIEW_* | **HUMAN_REVIEW_NOT_EXECUTED** |
| 正式入库 | **NOT_EXECUTED** |
| 系统验收 | **CONDITIONALLY_ACCEPTED** |

---

## 1. 管理员页面

- 路径：`/settings/chemistry-industrial-candidates`  
- 能力：批次过滤、集中材料包、来源/案例/KB/双图/质检 fail+unknown、审核清单、案例意见、退回/驳回、受闸门的 approve、入库 dry-run  

## 2. 审核 API

均 `JwtAuthGuard` + `AdminGuard`：

- 列表 / 详情（含 `adminReviewPacket`）  
- patch / recheck / human-review / admin-checklist / case-review  
- formal-import **强制 dryRun**  

## 3. 案例审核机制

- 文件级覆盖层：`var/industrial-case-review/{caseCode}.json`  
- `elevatesToPublished=false`；不改 fixture `draft` / `unverified`  
- contentHash 校验；历史保留  

## 4. 科学来源核验

- 材料包展示 sourceReferences + risk  
- 清单 `sourceOutcome` 由管理员选择；服务端写 reviewer/time/hash  
- **未**伪造 verified  

## 5. 流程 / 装置图

- 抽屉内 SVG 预览；装置组件表 + safety blocking/unknown  
- schematic 免责声明  

## 6. unknown

- 单独表格展示；清单可 acknowledge checkId  
- **不**自动变 pass  

## 7. KB 计划

- 展示拟绑定与 `human_unreviewed`  
- 清单可确认「计划是否合理」；`kbLinksWritten=false`  
- **未**写 `chem_train_item_links`  

## 8. 状态机 / 哈希

- reject / needs_revision：质检失败仍可执行  
- approve→`approved_for_import`：案例 published + verified + 正式资格等齐备，否则 `APPROVE_FOR_IMPORT_BLOCKED`  
- 改题干/答案/图：清空质检与人审；revision 冲突保护  
- 审核仓原子 rename 写入；`reviewAuditHistory` / `adminChecklistHistory`  

## 9. 真实执行情况

| 项 | 结果 |
|----|------|
| 真实管理员逐题点击通过 | **NOT_EXECUTED** |
| 真实案例升格 published | **NOT_EXECUTED** |
| formal / KB / 会话 / 错题 | **NOT_EXECUTED** |
| DB 业务写 | **无**（只读确认；审核仓文件可被真实管理员后续写入） |

## 10. 测试 / 构建

| 项 | 结果 |
|----|------|
| chem:industrial-phase-e2b-selftest | **PASS** |
| review / e2a / e1 / quality / apparatus / phase-d | **PASS** |
| api / web build | **PASS** |

## 11. 剩余人工任务

1. 管理员按 GUIDE 逐题审核并保存清单  
2. 案例来源核验与（另流程）案例升格  
3. 满足闸门后再议 E2-C 入库  

## 12. 下一阶段前置

用户另批 **真实管理员审核执行** 或（仅当人审+案例资格满足）**PHASE_E2-C**。  
不得自动进入 E2-C。  
