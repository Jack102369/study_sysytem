# 186 · HS-MATH-H3-CH3-EXCLUSIVE-COMPLETION-1C

> **最终状态：`QUALITY_PARTIAL`**  
> **独立性：`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`**  
> **日期：2026-10-28**

第 3 章真 H3 专属补题（离线）。在保护既有 **38** 道候选前提下，最多新增 12 道；本阶段实际新增 **6** 道 ACCEPTED_H3。  
**未**正式导入；**未**写库；**未**配图上传；**未** review/approve；**未** Git。

---

## 0. Gate0 锁定（执行前）

| 项 | 值 |
|----|-----|
| 基线 ACCEPTED_H3 | **38** |
| 章分布 | 1→5 / 2→20 / 3→8 / 4→5 |
| 基线 `batchContentSha256` | `a0f1b60b8690a0e4d8fc73ab31162d4c26495d4f265ce67f40d34d0aff653415` |
| 基线整文件 SHA（当时） | `27e08a5677a575b4a71afe708ccab2f50dad46a0cfa5c76ea2356101f924c4a6` |
| DB RO | drawable **913**；d1=335 / d2=478 / d3=100；CAND-H3C14=**0** |
| 机读 | `question_bank/h3_ch1_4_batch1a/_ch3_1c_gate0.json` |

说明：HANDOFF 旧文“23 真 H3”为过时统计，本阶段以 **38** 为权威基线。

---

## 1. 设计 / Round2 / 入库资格

| 项 | 数量 |
|----|-----:|
| 设计尝试槽位（n=51..62 意图） | 12 |
| Round2 **ACCEPTED_H3**（本阶段新增） | **6** |
| REJECTED_NOT_H3 / MATH_UNSTABLE | **6**（见下） |
| 用 H1/H2 凑数 | **0** |
| 最终候选总数 | **44**（38+6） |
| 正式预检/入库 | **未进入**（仅离线合格） |

### 新增合格 ID

`CAND-H3C14-051`、`052`、`056`、`058`、`059`、`060`

### 淘汰摘要

| n | 原因 |
|---|------|
| 53 | 教材级周期+整周期单调 ⇒ 常数（simple mono） |
| 54 | 定义域等式 H1/H2 |
| 55 | 常规分式单调 |
| 57 | 三点定二次套路代数 |
| 61 | 复合单调表教材复述 |
| 62 | 无连续仅唯一性，近已淘汰零点 H2 |

另有草稿 `|x²-1|=|x-a|` 等因作者核对中答案表不稳定，**未发运**（`REJECTED_MATH_UNSTABLE`）。

---

## 2. 章节最终分布（合格）

| 章 | 目标 | 1A 后 | 1C 后 |
|----|-----:|------:|------:|
| 1 | 5 | 5 | **5** |
| 2 | 20 | 20 | **20** |
| 3 | 20 | 8 | **14** |
| 4 | 5 | 5 | **5** |
| 合计 | 50 | 38 | **44** |

Ch3 仍短缺（14/20）；**如实 PARTIAL，不降标凑满。**

---

## 3. 基线保护核验

| 检查 | 结果 |
|------|------|
| 原 38 道 `contentSha256` 逐题比对 | **全部一致**（`baselineIntact=true`） |
| 原 38 道数学正文 | **未改**（仅无损追加） |
| 机读 | `_ch3_1c_verify.json` / `_baseline38_sha_snap.json` |

---

## 4. SHA 口径（必须可复算）

| 名称 | 算法 | 本阶段终值 |
|------|------|------------|
| **item `contentSha256`** | `sha256(JSON.stringify(contentPayload))`，字段见 `_h3c14_lib.mjs`：`id,qtype,stem,options,answer,analysis,difficulty,maxScore,rubric,kpCode,methodMain` | 每题 `hardProfile.contentSha256` |
| **`batchContentSha256`** | `sha256(itemShas.join('|'))`，`itemShas` 为按候选顺序的各题 contentSha | `293f44add5373711b642593f58c61ce867f6362a0ff81314ca618ca2af02dde2` |
| **整文件 `fileSha256`** | `sha256(h3_ch1_4_candidates.mjs` 原始字节`)` | `68b705e7cdd79941037df8783729077187fe9198670958288259da2634fdfcc6` |

**`batchContentSha256` ≠ `fileSha256` 是正常的**（内容串联哈希 vs 整文件字节哈希）。

基线批次 SHA（38 题时）仍为：`a0f1b60b8690a0e4d8fc73ab31162d4c26495d4f265ce67f40d34d0aff653415`。

HARD14 参照 SHA：`d8d22ad0bcbac2dba134d417e6a3db5cd6407f256492155345330ae043025819`

---

## 5. 数学核查要点（本批新增）

- **051**：双根式平方 → 内层二次上界，无导数；值域 `[√3,√6]`。  
- **052**：`|x-a|=x²` 两支二次；临界 `±1/4`；**a=0 去重**得 3 根。  
- **056**：`|x-a|+|x-2|-x=0` 三段落入；`a≤2`。  
- **058**：双轴对称 ⇒ 周期 2 + 单调转移；**未设连续**。  
- **059**：分段水平切割；**纠正** `1<k<3` 为 3 根（中段仅一有效根），非 4。  
- **060**：`1/n` 平移 + 单调夹逼 ⇒ 常数；**禁止用连续性偷渡**。

程序抽样仅作辅助；证明以解析文为准。

---

## 6. 配图

- REQUIRED：**0**  
- RECOMMENDED：`CAND-H3C14-059`（仅规格，**未上传**对象存储）

---

## 7. 生成侧合格 ≠ 预检通过

本批离线 `ACCEPTED_H3=44` 且 `status=QUALITY_PARTIAL`。  
即使将来达到 50，也只能进入 **只读 IMPORT-PREFLIGHT**，**不能**直接入库。

---

## 8. 机读产物

- `question_bank/h3_ch1_4_candidates.mjs`  
- `question_bank/h3_ch1_4_designs.json`  
- `question_bank/h3_ch1_4_quality_results.json`  
- `question_bank/h3_ch1_4_batch1a/_accepted_ch3_1c.mjs`  
- `question_bank/h3_ch1_4_batch1a/_ch3_1c_verify.json`  
- `question_bank/h3_ch1_4_batch1a/_rejected_ledger.json`（含 1C 淘汰）

---

## 最终状态

# `QUALITY_PARTIAL`

**`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`**

### 停止声明

禁止：正式导入、MySQL 写、正式配图上传、review/approve、改 913、第五批、Git commit/push。  
等待下一阶段授权（继续 Ch3 补题，或对 44 道子集做只读预检）。
