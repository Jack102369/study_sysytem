# PHASE_E2-B4 · 正式候选科学一致性修订报告

| 字段 | 值 |
|------|-----|
| 执行 | 2026-10-29（revise `2026-10-29T06:15:46.827Z`） |
| 批次 | `industrial_formal_candidate_20261029_121958` |
| 工作流 | `patchIndustrialReview` + `recheckIndustrialReviewQuality` |
| 真实人审 | **HUMAN_SCIENTIFIC_REVIEW_PENDING** |
| 案例覆盖层 | 未写 |
| formal / real publish | **NOT_EXECUTED** / **OFF** |
| 最终验收 | **CONDITIONALLY_ACCEPTED** |

---

## 逐题

### 01 cand_63284abdddf24cee — **REVISED**

| 项 | 前 | 后 |
|----|----|-----|
| revision | 7 | **9** |
| auditContentHash | `83651f1b…` | `bf726079…` |
| svgContentHash | `f2729bf8…` | **同**（Definition 未改） |
| 答案 | 过滤 | 过滤 |

**修订内容：** 题干点明「操作①」在混合液之后并分出滤液/滤渣；解析对齐读图依据。  
**科学依据：** 案例含过滤步骤；节点 internal.answerLabel=过滤。  
**质检：** failed_automatic_checks；fail=CURR_CASE_TRUST+CHEM_SOURCE_VERIFIED；unknown≈12；formalEligible=false。  
**仍须人审：** 案例来源。

### 02 cand_8ce596acabc64f26 — **REVISED**

| 项 | 前 | 后 |
|----|----|-----|
| revision | 7 | **9** |
| audit | `5d8e06f2…` | `db8cf682…` |
| flow/app SVG | 不变 | 不变 |

**修订内容：** 去掉「更合理/任意颠倒」；改为「洗气瓶在发生器与集气瓶之间」可由图连接唯一判定；不虚构气体/洗液。  
**质检：** 同上发布闸门 fail；尾气等 unknown 仍在。  
**仍须人审：** 是否接受仅考图示顺序；尾气 unknown。

### 03 cand_03bf94425958444b — **NO_CHANGE_REQUIRED**

| 项 | 值 |
|----|-----|
| revision | **7**（未 bump） |
| hashes | 未因 B4 变化 |

**原因：** 双图与「过滤目的」答案一致；无图文冲突。不为凑修订而改。

### 04 cand_312c51e0c9e249f7 — **REVISED（方案 B）**

| 项 | 前 | 后 |
|----|----|-----|
| revision | 7 | **9** |
| audit | `30c49a53…` | `826c9090…` |
| svg | `a06bc633…` | **同**（不虚构过滤节点） |
| 答案 | 过滤 | **结晶** |

**方案选择：** 案例/图均无过滤 → **不用方案 A**；改题干答案对齐「结晶」。  
**质检：** 发布闸门仍 fail；知识点已对齐案例白名单。  
**仍须人审：** 来源；结晶表述与教材一致性。

---

## SVG

修订三题均为**题面修订**，未改 Definition → **未生成新 SVG hash**；旧不可变 SVG 文件保留。03 未改。

## 审核失效

修订题：revision↑；auditContentHash 变；quality 重跑；humanDecision=null；pending_human_review。  
未批准案例；来源仍 unverified。

## 测试入口

`chem:industrial-phase-e2b4-revise` / `chem:industrial-phase-e2b4-selftest`
