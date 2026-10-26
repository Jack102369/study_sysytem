# HS-MATH-BANK-GLOBAL-1F-FIX — 091 歧义修复 + 全量回归 + Git 版本保护

> 日期：2026-10-26  
> **最终状态：`QUALITY_PASS`**  
> 前置：GLOBAL-1F = `QUALITY_PARTIAL`（SUSPECT=CAND-G1B-091）  
> **本阶段禁止**：MySQL 写 / draft / approve / push / CORE-1B

---

## 1. CAND-G1B-091 修复

### 1.1 问题根因

原题干「斜二测画法中 \(x\) 轴与 \(x'\) 轴夹角通常为」把**原坐标系轴**与**直观图轴**混为一谈；选项同时出现 \(45^\circ\) / \(135^\circ\)，而教材对 \(\angle x'O'y'\) 二者皆允，导致单选答案不唯一（SUSPECT）。

### 1.2 约定澄清（修复依据）

| 对象 | 角度约定 |
|------|----------|
| 原水平面坐标系 | \(\angle xOy=90^\circ\)（直角） |
| 直观图坐标系 | \(\angle x'O'y'\) **通常取 \(45^\circ\) 或 \(135^\circ\)**（两种摆放均合法） |
| 配套（本题干扰项未考） | \(O'z'\) 竖直；\(\parallel x,z\) 长度不变；\(\parallel y\) 取原长 \(1/2\) |

**不得**把「原直角」与「直观图 \(45^\circ/135^\circ\)」说成同一夹角。

### 1.3 修改前后差异

| 字段 | 修改前 | 修改后 |
|------|--------|--------|
| stem | 斜二测画法中 \(x\) 轴与 \(x'\) 轴夹角通常为 | 斜二测画法画水平放置的平面图形时，下列说法正确的是 |
| A | \(45^\circ\) | 原 \(\angle xOy=90^\circ\)；直观图 \(\angle x'O'y'\) 通常 \(45^\circ\) 或 \(135^\circ\) |
| B | \(90^\circ\) | 原 \(45^\circ\)；直观图 \(90^\circ\)（对调，错） |
| C | \(135^\circ\) | 两套角均为 \(45^\circ\)（错） |
| D | \(180^\circ\) | 两套角均为 \(90^\circ\)（错） |
| answer | A | **A**（保留编号与正确项字母） |
| analysis | 混谈 \(x\)–\(x'\) 与 \(45^\circ/135^\circ\) | 明确两套角 + 排除 B/C/D |
| id | CAND-G1B-091 | **不变** |

同步文件：`candidates-g1b-100.mjs` · `analyses-g1c-overrides.mjs` · `bank_global1b/ch08_candidates.md`。

### 1.4 修订后数学结论

- 唯一正确选项 **A**：同时正确陈述原直角与直观图双约定。  
- 无「为保答案改数学事实」：事实未改，题干改为可唯一判定。  
- **SUSPECT 消除**。

---

## 2. 100 道全量回归

| 检查 | 结果 |
|------|------|
| 协议/题型/options/judge/numeric | **100/100 PASS** |
| application rubric 和=maxScore | PASS |
| KP 种子可解析 | 100；库内缺 KP **0**（只读） |
| method ∈ 11 正式方法 | PASS；缺 0 |
| analysis 过薄 | 0 |
| sourceType=original | 100 |
| stem 撞 formal 库 | 0 |
| drawable（未入库） | 仍 **13** |
| 091 独立复核 | **PASS**（非 SUSPECT） |
| FAIL / SUSPECT（本批） | **0 / 0** |

旁证脚本（含本地 DB 凭据，**未入 git**）：`_g1f_protocol_check.mjs` → `_g1f_protocol.json`。

---

## 3. Draft 入库清单（下一阶段 GLOBAL-1G，本阶段不执行）

| 项 | 值 |
|----|-----|
| 可入 draft 候选数 | **100**（`reviewReady` 齐；数学门禁无 BLOCK） |
| 源文件 | `question_bank/candidates-g1b-100.mjs` |
| 前置 KP | 库内 153（1E 已完成） |
| 本阶段 | **未** draft / **未** approve |

---

## 4. Git 版本保护

### 4.1 提交策略

- 显式白名单 `git add <paths>`；**未**使用 `git add .` / `-A`  
- **禁止** push / reset --hard / clean -fd  
- **排除**：`.env`、密钥、`_backups/`、`_g1e_result.json`、`_g1f_*` 临时产物、含明文 DB 密码的 `_g1e_migrate.mjs` / `_g1f_protocol_check.mjs`、无关 `apps/api` 删除项  

### 4.2 Commit

见本节执行后填写：

| 项 | 值 |
|----|-----|
| message | `hs-math: preserve global question bank batch 1 foundations` |
| hash | （commit 后回填） |
| 文件数 | （commit 后回填） |

---

## 5. 未解决疑点

**无。**（091 已消；回归 0 SUSPECT）

---

## 6. 最终状态

```
QUALITY_PASS
```

下一授权候选：**GLOBAL-1G** 首批 100 道 draft 入库（另授权；本阶段停止）。
