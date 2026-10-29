# PHASE_E2-A · 正式候选审核阻塞诊断

| 字段 | 值 |
|------|-----|
| 执行日期 | 2026-10-29 |
| 阶段状态 | **COMPLETED** |
| 目标批次 | `industrial_formal_candidate_20261029_121958` |
| 候选数 | 4 |
| PHASE_D | `industrial_acceptance_20261029_121220` **未修改** |
| 系统验收 | **CONDITIONALLY_ACCEPTED**（未升格） |
| DB | 只读确认；无 formal/KB/会话写入 |

---

## 1. 原始质检（E1 / rev1）

| candidateId | overall | blocking | unknown | 内容向 fail | 发布向 fail |
|-------------|---------|----------|---------|-------------|-------------|
| cand_63284abdddf24cee | failed_automatic_checks | 2 | 12 | — | CURR_CASE_TRUST, CHEM_SOURCE_VERIFIED |
| cand_8ce596acabc64f26 | failed_automatic_checks | 4 | 15 | CURR_CATEGORY, DIAG_CASE_BIND | CURR_CASE_TRUST, CHEM_SOURCE_VERIFIED |
| cand_03bf94425958444b | failed_automatic_checks | 3 | 13 | FILTER_SOLUBLE_SALT（误伤） | CURR_CASE_TRUST, CHEM_SOURCE_VERIFIED |
| cand_312c51e0c9e249f7 | failed_automatic_checks | 2 | 14 | —（难度/KP 为 unknown） | CURR_CASE_TRUST, CHEM_SOURCE_VERIFIED |

---

## 2. 逐题阻塞分类

### cand_63284abdddf24cee（粗盐过滤识读）

| 类别 | 项 |
|------|-----|
| A–G 内容/图错误 | 未发现确定性化学/答案错误；题干略啰嗦 |
| H 来源 | SOURCE_VERIFICATION_INCOMPLETE；案例 source unverified |
| J 规则误判 | 无 |
| K unknown | 无反应条目、引擎范围、Mock AI 六维、工艺深层、解析语义、grade 兼容等 |
| L 人审 | pending |
| M 发布资格 | 案例 draft；无 verified 来源；KB 未绑 |

### cand_8ce596acabc64f26（气体洗涤判断）

| 类别 | 项 |
|------|-----|
| C/F | 流程 stub `caseVersion/hash` 与案例不一致 → DIAG_CASE_BIND |
| I | category=`industrial_apparatus_analysis` 不在粗盐案例 categoryCodes → CURR_CATEGORY；主题错配（气体题绑粗盐案） |
| H/M | 同上 draft + unverified |
| K | 尾气吸收必要性 unknown；装置-题干充分一致 unknown |

### cand_03bf94425958444b（双图）

| 类别 | 项 |
|------|-----|
| J **规则误判** | 解析「过滤针对不溶…可溶性杂质需另选」命中旧 `FILTER_SOLUBLE_SALT` 宽正则 |
| H/M | draft + unverified |
| 双图 | 流程/装置主题一致（粗盐+过滤）；audit 覆盖双图哈希 |

### cand_312c51e0c9e249f7（海水填空）

| 类别 | 项 |
|------|-----|
| I | 难度 3 超出案例 range 1–2 → unknown；KP「海水资源」不在白名单 → unknown |
| H/M | draft + unverified |

---

## 3. QUALITY vs PUBLISH（修复后）

| 桶 | 含义 | 修复后 |
|----|------|--------|
| QUALITY_BLOCKERS | 题干/图/分类/规则可修内容 | **全部 0** |
| PUBLISH_ELIGIBILITY_BLOCKERS | 案例 draft、来源 unverified | **每题 2**（CURR_CASE_TRUST, CHEM_SOURCE_VERIFIED） |
| KB_BINDING_BLOCKERS | 未实绑 | NOT_BOUND |
| HUMAN_REVIEW_PENDING | 人审 | 全部 true |
| UNKNOWN_SCIENCE_ITEMS | 引擎/Mock AI/安全等 | 每题约 12–14 |

**不得**将 PUBLISH 阻塞通过改 `publishEligible` 或把 unverified 伪造成 verified 来消除。

---

## 4. 代码规则误判与修复

| 规则 | 原意图 | 误判输入 | 错误输出 | 预期 | 处置 |
|------|--------|----------|----------|------|------|
| FILTER_SOLUBLE_SALT | 拦截「用过滤除去可溶盐」 | 「过滤针对不溶；可溶需另法」 | fail | pass | 收窄为肯定错误表述；quality selftest 回归 |

---

## 5. 实际修复摘要

见 `PHASE_E2A_FIX_LOG.md`。要点：

- 新增 `CASE_GAS_WASH_TEACHING`；cand_02 换案 + stub 对齐 hash
- cand_03 解析改写；规则收窄
- cand_04 难度→2、KP 对齐
- 全部重质检；人审保持 pending；revision 递增；旧审核不复用

---

## 6. 修复后质检

| candidateId | overall | B | U | QUALITY_BLOCKERS | READY_FOR_HUMAN_REVIEW | READY_FOR_FORMAL_IMPORT |
|-------------|---------|---|---|------------------|------------------------|-------------------------|
| cand_63284abdddf24cee | failed_automatic_checks* | 2 | 12 | 0 | **YES** | **NO** |
| cand_8ce596acabc64f26 | failed_automatic_checks* | 2 | 14 | 0 | **YES** | **NO** |
| cand_03bf94425958444b | failed_automatic_checks* | 2 | 13 | 0 | **YES** | **NO** |
| cand_312c51e0c9e249f7 | failed_automatic_checks* | 2 | 12 | 0 | **YES** | **NO** |

\* overall 仍为 failed，因正式模式对 draft/unverified **故意 fail**（发布闸门），非残留内容错误。

---

## 7. 科学来源 / 案例 / KB（只读核验）

| 实体 | 存在 | status | 备注 |
|------|------|--------|------|
| experiment#19/#20 | 是 | published | review_note 含 human_unreviewed → 实绑前须确认 |
| knowledge#61 | 是 | published | 气体洗涤 |
| substance#2 | 是 | published | 水 |
| 案例 fixtures | draft | unverified | **未**伪造 published / reviewedContentHash |
| 外部教材页码/DOI | — | — | **未核验** → SOURCE_VERIFICATION_INCOMPLETE |

案例管理：系统有候选审核页与 case 校验；**无**自动「一键案例升格」；不得由脚本批准案例。

---

## 8. 人工审核条件

| 项 | 状态 |
|----|------|
| 内容 QUALITY_BLOCKERS | 已清 |
| 清单 / 管理端材料 | 已更新（来源、KB、blocking 明细、双图预览） |
| 具备交给管理员审核 | **YES（READY_FOR_HUMAN_REVIEW）** |
| 具备正式发布 | **NO** |

---

## 9. 剩余阻塞（进正式入库前）

1. 管理员真人审（不得脚本勾选）  
2. 案例来源可信 / 审核升格（不得伪造）  
3. verified 科学来源（不得虚构页码）  
4. KB 实绑与 human_unreviewed 确认  
5. 装置安全 unknown 人工确认  

下一阶段建议：**PHASE_E2-B**（真实管理员人审），须另批。  
