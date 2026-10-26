# HS-MATH-BANK-GLOBAL-1F — 入库前独立质量复核（100 候选）

> 日期：2026-10-26  
> **本文件史实状态：`QUALITY_PARTIAL`**（复核当日；SUSPECT=CAND-G1B-091）  
> **后续修复**：见 `124_hs_math_bank_global1f_fix.md` → **`QUALITY_PASS`**（091 已消歧，全量回归通过）  
> 范围：`question_bank/candidates-g1b-100.mjs`（100 道）  
> **1F 当日禁止**：draft / approve / 训练写入 / git commit / CORE-1B / 关 AI

---

## 1. 目标与口径

在 GLOBAL-1E（KP=153）之后、draft 入库之前，对 100 道候选做**独立**质量复核：

| 维度 | 口径 |
|------|------|
| 结构/协议 | 五题型、options、numeric、application rubric、method ∈ 11 种正式方法 |
| 数学正确性 | **重新推导**，不以 `mathVerified` / analysis 为证明 |
| 来源 | `sourceType=original`；非 past_exam |
| 去重 | 与库内 formal+approved+active 题干粗归一化比对 |
| KP/方法 | 候选主 KP 均在库；方法 code 均 active |
| reviewReady | ≠ drawable；本阶段不入库 |

数学正确性优先于通过率；存在确定答案错误 → `QUALITY_BLOCKED`；仅软性问题/约定歧义 → `QUALITY_PARTIAL`。

---

## 2. DB 只读快照（本阶段无写库）

| 项 | 实测 |
|----|------|
| `hs_math_knowledge_points` | **153** |
| formal+approved+is_active（drawable） | **13**（仍仅第3章历史题） |
| active methods | **11**；候选 method 命中缺失 **0** |
| 候选 100 主 KP 缺库 | **0** |
| stem 与正式题粗撞库 | **0** |
| train_items / draft 写入 | **无**（本阶段未执行任何 INSERT/UPDATE） |

机器旁证：`_g1f_protocol.json`（由 `_g1f_protocol_check.mjs` 生成）。

---

## 3. 结构 / 协议检查

| 检查 | 结果 |
|------|------|
| 候选数 / id 001–100 | PASS |
| qtype ∈ {single,multi,judge,numeric,application} | PASS（34/7/16/19/24） |
| single：唯一字母且 ∈ options | PASS |
| multi：≥2 且字母合法 | PASS |
| judge：true/false | PASS |
| numeric：答案非空；无需 LaTeX 规范化告警 | PASS（0 notes） |
| application：rubric 分项正整数且和=maxScore | PASS（24/24） |
| methodMain(/Aux) ∈ 11 正式方法；无 text_only | PASS |
| sourceType=original | PASS（100）；past_exam=0 |
| analysis 过薄（<40） | 0 |
| **protocolOk** | **100/100** |

---

## 4. 数学独立复核范围

| 桶 | 数量 | 处理 |
|----|------|------|
| AUTHOR_CHECKED | 47 | **全量**独立重解（含全部 d3=25、全部 application=24） |
| SPOT_VERIFIED | 53 | 抽样 **14**（约每 4 题 1 道）独立重解 |
| multi | 7 | 全在 AUTHOR 桶内，已覆盖 |
| UNVERIFIED | 0 | — |

证据包：`_g1f_math_digest.txt` / `_g1f_math_cards.json`。

### 4.1 结论汇总

| 口径 | 值 |
|------|----|
| 复核题数（去重 id） | 61 |
| PASS | 60 |
| FAIL（确定答案错） | **0** |
| SUSPECT（软性/约定歧义） | **1**（CAND-G1B-091） |
| **阶段状态** | **`QUALITY_PARTIAL`** |

### 4.2 SUSPECT 明细

**CAND-G1B-091**（single / d3 / 斜二测）

- 题干：「斜二测画法中 \(x\) 轴与 \(x'\) 轴夹角通常为」；答案 **A \(45^\circ\)**
- 独立意见：人教约定常写 \(\angle x'O'y'=45^\circ\)（亦见 \(135^\circ\) 摆放）；题干「\(x\) 与 \(x'\)」与教材「\(\angle x'O'y'\)」措辞不完全同构；C \(135^\circ\) 在部分示意图合法
- 严重度：**soft**（非算错；约定/措辞）。**不升格为 FAIL**，但阻止标 `QUALITY_PASS`
- 建议：draft 前改写题干为「\(\angle x'O'y'\) 通常取」并明确唯一约定，或改为填空/判断

### 4.3 抽样 PASS 要点（摘录）

- 量词否定 005、恒成立 011、利润 012、奇偶/单调 023–026、指数/对数 033–045、三角恒等 052/056、向量 068–076、复数 082–083、立体体积 086/090、概率 098 等：独立推导与标准答案一致；application rubric 和分正确。
- SPOT 抽样 001/006/010/017/028/034/043/050/055/066/071/081 等：无答案错误。

未发现确定数学答案错误；未因本阶段改动候选正文（仅评审）。

---

## 5. Git 未跟踪 / 变更清单（风险）

**分支**：`main...origin/main`  
**统计**：未跟踪约 **23+**（含本阶段产物）；另有无关已跟踪删除 2 个 `apps/api/.../util/*.ts`（非本链产物，勿误提交）。

### 5.1 GLOBAL 链核心（建议后续授权 commit）

| 路径 | 说明 |
|------|------|
| `db/seed_hs_math_global1c_missing_kps.sql` | 1E 已执行种子 SQL |
| `docs/.../question_bank/candidates-g1b-100.mjs` | 100 候选 |
| `docs/.../question_bank/kp-seed-g1c.mjs` | KP 种子 |
| `docs/.../question_bank/analyses-g1c-overrides.mjs` | 1C 解析覆盖 |
| `docs/.../115`–`122` + 本文件 `123` | 阶段报告 |
| `docs/.../bank_global1b/` | 1B 产物目录 |
| `docs/.../question_bank/_g1e_migrate.mjs` | 1E 迁移器 |
| `docs/.../_backups/g1e_*` | 1E 备份 |
| `docs/.../PROJECT_HANDOFF.md` | 交接（已改） |

### 5.2 辅助 / 可清理（不必强提交）

`_g1f_*.json` / `_g1f_math_digest.txt` / `_g1f_protocol_check.mjs` / `_g1f_math_export.mjs` / `_tmp_g1f_ro.sql` / `_global1b_*.txt` / `_g1e_result.json` / `_rebuild_kp_seed_g1c.mjs`

### 5.3 风险说明

- 1B–1E 交付文件此前曾「未入库 git 即消失」；**仍大量 untracked**，丢文件风险未消除。
- 本阶段**未**执行 `git commit` / `git add`（按授权）。

---

## 6. 与 drawable / 下一步边界

| 项 | 状态 |
|----|------|
| reviewReady（候选侧） | 100（结构+KP 齐） |
| 库内 drawable | **仍 13** |
| draft / approve | **未做** |
| 119 GLOBAL-1D | **保持史实 BLOCKED**（不改写） |

**下一授权候选**（需用户明确一句）：

1. 先修 091（或接受 soft 并入库）→ draft 100  
2. git commit 种子+115–123+备份元数据  
3. **勿**自动 CORE-1B；**勿**关日常 AI  

---

## 7. 最终判定（1F 当日史实）

```
QUALITY_PARTIAL
```

理由：协议/KP/方法/去重全过；独立数学复核 **0 FAIL**；存在 **1 SUSPECT（091 斜二测约定措辞）**，故不标 PASS，亦不因无算错而 BLOCKED。

---

## 8. 1F-FIX 回写（2026-10-26）

- 已按 `124` 重写 CAND-G1B-091：区分原 \(\angle xOy=90^\circ\) 与直观图 \(\angle x'O'y'=45^\circ/135^\circ\)；答案仍为 A。  
- 全量回归：protocol 100/100；FAIL=0；SUSPECT=0。  
- **链路当前质量门禁以 `124` 的 `QUALITY_PASS` 为准**；本文件保留 PARTIAL 作为 1F 评审史实。

---

## 变更对照

| 动作 | 1F 当日 | 1F-FIX |
|------|---------|--------|
| 写 123 / 更新 HANDOFF | 是 | 是（+124） |
| DB 写 / draft / approve | **否** | **否** |
| git commit | **否** | **是**（白名单本地） |
| 改 candidates 正文 | **否** | **是**（仅 091） |
