# 第三章首批正式审核准备 · 方法种子草案 + 最小题集清单

> **性质**：主营业务数据准备（**未**写库、**未**执行种子、**未**人工审核 passed、**未**正式批准）  
> **日期**：2026-10-25  
> **库**：`study_system`（本文件不连库；题目以权威源 / 历史导入 code 为准）  
> **4B**：`P1-FUNC-CORE-1A-4B = BLOCKED`（本文件不改判）

---

## A. 范围与证据来源

| 项 | 说明 |
|---|---|
| 方法种子草案 | `db/seed_hs_math_methods.sql`（**NOT_EXECUTED**） |
| 题库权威源 | `apps/api/src/hs-math/util/hs-math-p1-func2-parity-items.ts` |
| 历史复核 | `docs/high_school_math/question_bank/chapter_03/review_checklist_parity.md` |
| KP | 27 条已入库（历史验收）；本批题主 KP ∈ `rja.3.2.09`–`12` |
| 数值 `train_items.id` | **未在本轮 SELECT**；清单只列 **code**，写库/审核前须 `SELECT id,code,status,pool,...` 核实 |

### 覆盖局限（必须正视）

现有第三章**可导入正式题**仅为 **3.2 奇偶性 PARITY 25 题**（`categoryCode=3.2`）。  
**3.1 / 3.3 / 3.4 尚无对等正式题集** → 本「首批」无法覆盖全部主要小节；只覆盖 **3.2 · 奇偶性** 内多内容组。  
打通学生学习闭环的最小路径：先发布本批 3.2 子集，再另阶段补 3.1/3.3 题。

---

## B. 正式方法词典草案（11）

| code | name | 适用 KP（示意） | 典型题（PARITY code） |
|---|---|---|---|
| `defn` | 定义法 | 3.2.09–11；单调定义 | 0001–0005, 0010–0012 |
| `domain_symmetry` | 定义域对称检验 | 3.2.09–10 | 0002, 0006–0009 |
| `special_value` | 特殊值法 | 3.2.10–11；反例 | 0013–0014, 0024 |
| `graph_symmetry` | 图象对称分析 | 3.2.11–12 | 0019–0021 |
| `num_shape` | 数形结合 | 3.2.11；图象组 | 0019–0021 |
| `classification` | 分类讨论 | 分段/幂函数等（跨 3.1/3.3） | 本批奇偶题较少主用；词典预留 |
| `mono_analysis` | 单调性分析 | 3.2.01–08, 12 | 0022–0025 |
| `parity_apply` | 奇偶性应用 | 3.2.12 | 0015–0018, 0025 |
| `equiv_transform` | 等价转化 | 通用 | 定义辨析类辅助 |
| `undetermined_coeff` | 待定系数法 | 3.1 求值/建模预留 | 0018 题面含参数但所求不依赖定参 |
| `substitution` | 换元法 | 跨章预留 | 本批非主方法 |

**未纳入**（避免近义堆砌、本阶段无稳定题锚）：反证、配方、函数构造、参数分析（可后续按题扩充）。

幂等：同 `code` **跳过不覆盖**。回滚：仅删未被 `hs_math_train_item_methods` 引用的本批 code（见 SQL 注释）。

---

## C. 来源与发布门禁（适用于全批）

历史导入默认（CORE-1A 兼容）：

- `source_type=original`
- `source_verification_status=unverified`
- `source_license_status=unknown`

按 `assertSourceAllowsFormalPublish`：**默认三项不构成 SOURCE_BLOCKED**（允许 formal 批准路径）。  

**产品诚信要求（本清单强制标注）**：

- **不得**把默认元数据当作「已核实原创」。  
- **不得**虚构高考/竞赛真题出处。  
- 进入人工审核前，管理员应**显式确认**为自编/校本原创，并建议将核实状态改为 `verified`、许可改为 `permitted`（改来源会升 `content_version`，须在审核前完成）。  
- `adapted` / `past_exam` 未核实或 license≠permitted → **SOURCE_BLOCKED**（本批候选均非此类型）。

学生抽题：`createSession` 仅 `status=approved` + `pool=formal` + `is_active`（见 `hs-math-train.service.ts`）。  
**READY_FOR_REVIEW ≠ approved**；须人工 passed + 质量门禁 +（可选）`confirmPublish` 后才可能批准。

---

## D. 首批候选题（12）· 建议进入人工审核

选题原则：质量优先；覆盖定义 / 定义域 / 判断 / 求值 / 图象 / 简单综合；含 single / judge / multi / numeric；难度以 **1** 为主、含 **2**；**暂缓**压轴 0022/0023。

| # | code | 小节 | 主 KP | 难度 | 题型 | 内容组 | 建议主方法 | 辅方法 | 来源状态（预期） | 前置判定 | 建议进人工审核 |
|---:|---|---|---|---:|---|---|---|---|---|---|---|
| 1 | `HSMA-RJA-CH03-PARITY-0001` | 3.2 | rja.3.2.09 | 1 | single | definition | defn | — | original / unverified / unknown | **READY_FOR_REVIEW** | 是 |
| 2 | `HSMA-RJA-CH03-PARITY-0002` | 3.2 | rja.3.2.09 | 1 | judge | definition | defn | domain_symmetry | 同上 | **READY_FOR_REVIEW** | 是 |
| 3 | `HSMA-RJA-CH03-PARITY-0005` | 3.2 | rja.3.2.10 | 1 | single | definition | defn | domain_symmetry | 同上 | **READY_FOR_REVIEW** | 是 |
| 4 | `HSMA-RJA-CH03-PARITY-0006` | 3.2 | rja.3.2.09 | 1 | single | domain_symmetry | domain_symmetry | — | 同上 | **READY_FOR_REVIEW** | 是 |
| 5 | `HSMA-RJA-CH03-PARITY-0007` | 3.2 | rja.3.2.09 | 1 | judge | domain_symmetry | domain_symmetry | — | 同上 | **READY_FOR_REVIEW** | 是 |
| 6 | `HSMA-RJA-CH03-PARITY-0010` | 3.2 | rja.3.2.10 | 1 | single | judgment | defn | — | 同上 | **READY_FOR_REVIEW** | 是 |
| 7 | `HSMA-RJA-CH03-PARITY-0011` | 3.2 | rja.3.2.10 | 1 | single | judgment | defn | — | 同上 | **READY_FOR_REVIEW** | 是 |
| 8 | `HSMA-RJA-CH03-PARITY-0012` | 3.2 | rja.3.2.11 | 2 | multi | judgment | defn | special_value | 同上 | **READY_FOR_REVIEW** | 是 |
| 9 | `HSMA-RJA-CH03-PARITY-0015` | 3.2 | rja.3.2.12 | 1 | numeric | evaluation | parity_apply | — | 同上 | **READY_FOR_REVIEW** | 是 |
| 10 | `HSMA-RJA-CH03-PARITY-0019` | 3.2 | rja.3.2.11 | 1 | single | graph | graph_symmetry | num_shape | 同上 | **READY_FOR_REVIEW** | 是 |
| 11 | `HSMA-RJA-CH03-PARITY-0020` | 3.2 | rja.3.2.11 | 1 | single | graph | graph_symmetry | — | 同上 | **READY_FOR_REVIEW** | 是 |
| 12 | `HSMA-RJA-CH03-PARITY-0025` | 3.2 | rja.3.2.10 | 1 | single | mono_combo | parity_apply | — | 同上 | **READY_FOR_REVIEW** | 是 |

### 逐题质量与门禁摘要

| code | 题干/答案/解析（权威源） | 质量问题 | 审核前置 |
|---|---|---|---|
| 0001–0002,0005–0007,0010–0012,0015,0019–0020,0025 | 结构 PASS；历史机检/逻辑核验见 checklist | 来源默认未核实（非门禁阻断） | 确认原创表述 → 贴方法 → 提交人工审核；**勿**直接 approve |
| （全批） | pool 预期 formal；status 预期 draft | 方法关联尚未写入（种子未执行） | 种子执行后才能按上表贴标签 |

**本批无 SOURCE_BLOCKED / QUALITY_BLOCKED / NEEDS_FIX 项**（就权威源内容而言）。  
运营风险统一记为：**来源未显式核实**（须在审核操作中处理，不得假装已核实）。

---

## E. 暂缓 / 第二波（不进本轮最小集）

| code | 原因 | 建议前置 |
|---|---|---|
| 0003,0004,0008,0009,0013,0014,0016–0018,0021,0024 | 可扩覆盖；本轮控量 | 首批通过后再审 |
| **0022, 0023** | 难度 3；`review_issues_parity` 标 **NEEDS_HUMAN_REVIEW**（证明表述） | 证明人工确认前建议 **NEEDS_FIX** 或加强解析后再审；**不**作首批 |

---

## F. 统计

| 指标 | 值 |
|---|---|
| 方法草案条数 | **11** |
| 首批候选题 | **12** |
| 小节 | **仅 3.2**（奇偶性） |
| 难度 | 1×**11**，2×**1**（0012）；无 3 |
| 题型 | single×8，judge×2，multi×1，numeric×1 |
| KP | 09–12 均有主 KP 覆盖 |
| READY_FOR_REVIEW | **12** |
| NEEDS_FIX / SOURCE_BLOCKED / QUALITY_BLOCKED | **0**（本批）；0022/0023 未入选 |

---

## G. 后续所需授权（本文件不授予）

1. **只读 SELECT**：核实 12 题 `id/status/pool/source_*` 与库一致。  
2. **执行** `db/seed_hs_math_methods.sql`（写 `hs_math_methods`）。  
3. 管理员为 12 题写入来源确认 + 方法关联（升版 → 须新审核）。  
4. **真实人工审核** passed（≠ approve）。  
5. **另授权**后最小集 `confirmPublish` 正式批准（打通学生池）。  

禁止本轮：执行 SQL、approve、改 110 题内容、进 CORE-1B、改门禁代码。
