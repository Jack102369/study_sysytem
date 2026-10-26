# P1-FUNC · 第三章首批 12 题人工审核（建议清单 · 待确认）

> **阶段**：强制停止点 — **仅生成审核建议，未写入 reviews.passed**  
> **库**：`study_system` · LAST_VERIFIED `2026-10-25T11:40:45+08:00`  
> **AI 核对 ≠ 真实人工审核**；`PASS_RECOMMENDED` ≠ 库内 `passed` ≠ `approved`  
> **4B**：仍 **BLOCKED**  
> 快照：`db/backups/_ch03_review_prep_20261025.json`

---

## 0. 人工确认状态

| 项 | 值 |
|---|---|
| 人工确认 | **AWAITING**（等待用户逐题确认允许写入 passed 的 code 列表） |
| 本轮写入 reviews | **0** |
| 本轮 approve | **未执行** |

确认后请回复例如：

```text
确认写入 passed：
HSMA-RJA-CH03-PARITY-0001
HSMA-RJA-CH03-PARITY-0002
…（列出允许的 code）
```

或：`确认全部 12 题写入 passed`（须明示）。  
未确认前 **不得** 调用审核 API。

---

## 1. 实时基线（SELECT）

| 指标 | 值 |
|---|---|
| items | **110** |
| status | 105 draft / 5 disabled / **0 approved** |
| methods | **11** |
| item_methods | **16** |
| reviews（全库 / 目标 12） | **0 / 0** |

---

## 2. 汇总建议

| 建议 | 数量 |
|---|---:|
| PASS_RECOMMENDED | **12** |
| NEEDS_FIX | **0** |
| QUALITY_REVIEW_REQUIRED | **0** |
| SOURCE_REVIEW_REQUIRED（伴生风险旗标） | **12**（全为默认 unverified/unknown） |

说明：

- 发布门禁 `assertSourceAllowsFormalPublish`：**不因**默认 original/unverified/unknown 阻断。  
- **诚信要求**：人工确认 passed 即表示你认可其为可用自编/校本训练题；**本轮不会**擅自改 `verified/permitted`。  
- 当前 `canPublish=false`：原因均为「需要先完成当前版本人工审核」（尚无 review）。  
- STALE：无历史审核 → 不适用。

---

## 3. 逐题审核意见

### HSMA-RJA-CH03-PARITY-0001（id=109）

| 项 | 内容 |
|---|---|
| 题干摘要 | 定义域已对称且 f(-x)=f(x) → 称 f 为？ |
| 标准答案 | single **B**（偶函数） |
| 解析评价 | 正确点明对称前提与偶定义 |
| 数学正确性 | **通过** |
| 教材匹配 | rja-ch3 / 3.2 / 主KP rja.3.2.09；难度 1 合理 |
| 来源 | original / unverified / unknown（**SOURCE_REVIEW_REQUIRED**） |
| 方法 | 主 `defn` — 适用 |
| 质量问题 | 无 |
| version / fingerprint | **2** / `45d4ad41…f2ca72` |
| 审核建议 | **PASS_RECOMMENDED** |

### HSMA-RJA-CH03-PARITY-0002（id=110）

| 项 | 内容 |
|---|---|
| 题干摘要 | 仅有 f(-x)=-f(x) 且无需查定义域 ⇒ 一定奇？ |
| 标准答案 | judge **false** |
| 解析评价 | 正确强调必须先对称定义域 |
| 数学正确性 | **通过** |
| 教材匹配 | 3.2 / rja.3.2.09；难度 1 |
| 来源 | 默认三项（SOURCE_REVIEW_REQUIRED） |
| 方法 | `defn`* + `domain_symmetry` — 适用 |
| version / fingerprint | **2** / `2bcce5a1…f3131d` |
| 审核建议 | **PASS_RECOMMENDED** |

### HSMA-RJA-CH03-PARITY-0005（id=113）

| 项 | 内容 |
|---|---|
| 题干摘要 | f(x)=x³ 判断奇偶的正确步骤 |
| 标准答案 | single **B**（先对称再验证恒等式） |
| 解析评价 | 正确否定「只看次数/单点」 |
| 数学正确性 | **通过** |
| 教材匹配 | 3.2 / 主KP rja.3.2.10 |
| 来源 | 默认（SOURCE_REVIEW_REQUIRED） |
| 方法 | `defn`* + `domain_symmetry` |
| version / fingerprint | **2** / `6ae18da3…521c17b` |
| 审核建议 | **PASS_RECOMMENDED** |

### HSMA-RJA-CH03-PARITY-0006（id=114）

| 项 | 内容 |
|---|---|
| 题干摘要 | √(x-1)+√(1-x) 的定义域与奇偶可讨论性 |
| 标准答案 | single **B**（{1} 不对称 ⇒ 非奇非偶） |
| 解析评价 | 定义域推导与对称结论正确 |
| 数学正确性 | **通过** |
| 教材匹配 | 3.2 / rja.3.2.09 |
| 来源 | 默认（SOURCE_REVIEW_REQUIRED） |
| 方法 | `domain_symmetry`* |
| version / fingerprint | **2** / `47c92adb…95167c` |
| 审核建议 | **PASS_RECOMMENDED** |

### HSMA-RJA-CH03-PARITY-0007（id=115）

| 项 | 内容 |
|---|---|
| 题干摘要 | 1/x 定义域关于原点对称，可否讨论奇偶 |
| 标准答案 | judge **true** |
| 解析评价 | 只考前提；正确 |
| 数学正确性 | **通过** |
| 教材匹配 | 3.2 / rja.3.2.09 |
| 来源 | 默认（SOURCE_REVIEW_REQUIRED） |
| 方法 | `domain_symmetry`* |
| version / fingerprint | **2** / `ae966a69…6244f5f` |
| 审核建议 | **PASS_RECOMMENDED** |

### HSMA-RJA-CH03-PARITY-0010（id=118）

| 项 | 内容 |
|---|---|
| 题干摘要 | f(x)=x²+1（R）奇偶性 |
| 标准答案 | single **B**（偶） |
| 解析评价 | 定义验证正确 |
| 数学正确性 | **通过** |
| 教材匹配 | 3.2 / 主KP rja.3.2.10 |
| 来源 | 默认（SOURCE_REVIEW_REQUIRED） |
| 方法 | `defn`* |
| version / fingerprint | **2** / `97b2e41b…bf4ca83` |
| 审核建议 | **PASS_RECOMMENDED** |

### HSMA-RJA-CH03-PARITY-0011（id=119）

| 项 | 内容 |
|---|---|
| 题干摘要 | f(x)=x³-x（R）奇偶性 |
| 标准答案 | single **A**（奇） |
| 解析评价 | 定义验证正确 |
| 数学正确性 | **通过** |
| 教材匹配 | 3.2 / rja.3.2.10 |
| 来源 | 默认（SOURCE_REVIEW_REQUIRED） |
| 方法 | `defn`* |
| version / fingerprint | **2** / `6d21785a…475cad4` |
| 审核建议 | **PASS_RECOMMENDED** |

### HSMA-RJA-CH03-PARITY-0012（id=120）

| 项 | 内容 |
|---|---|
| 题干摘要 | 零函数 f≡0 奇偶多选 |
| 标准答案 | multi **A,B,C**（既奇又偶；D 错） |
| 解析评价 | 完整；多选无漏选 |
| 数学正确性 | **通过** |
| 教材匹配 | 3.2 / 主KP rja.3.2.11；难度 2 合理 |
| 来源 | 默认（SOURCE_REVIEW_REQUIRED） |
| 方法 | `defn`* + `special_value` — 适用、未过度 |
| version / fingerprint | **2** / `175f2c25…694c0909` |
| 审核建议 | **PASS_RECOMMENDED** |

### HSMA-RJA-CH03-PARITY-0015（id=123）

| 项 | 内容 |
|---|---|
| 题干摘要 | 奇函数 f(3)=5 求 f(-3) |
| 标准答案 | numeric **-5**（容差 0） |
| 解析评价 | 直接用奇函数性质；答案唯一 |
| 数学正确性 | **通过** |
| 教材匹配 | 3.2 / 主KP rja.3.2.12 |
| 来源 | 默认（SOURCE_REVIEW_REQUIRED） |
| 方法 | `parity_apply`* |
| version / fingerprint | **2** / `0f6a522d…5a30e06` |
| 审核建议 | **PASS_RECOMMENDED** |

### HSMA-RJA-CH03-PARITY-0019（id=127）

| 项 | 内容 |
|---|---|
| 题干摘要 | 偶函数图象对称性 |
| 标准答案 | single **B**（关于 y 轴） |
| 解析评价 | 正确区分原点对称 |
| 数学正确性 | **通过** |
| 教材匹配 | 3.2 / 主KP rja.3.2.11 |
| 来源 | 默认（SOURCE_REVIEW_REQUIRED） |
| 方法 | `graph_symmetry`* + `num_shape` |
| version / fingerprint | **2** / `0a038497…9591ea8` |
| 审核建议 | **PASS_RECOMMENDED** |

### HSMA-RJA-CH03-PARITY-0020（id=128）

| 项 | 内容 |
|---|---|
| 题干摘要 | 奇函数过 (2,5)，哪点也在图象上 |
| 标准答案 | single **B**（(-2,-5)） |
| 解析评价 | 原点对称点正确 |
| 数学正确性 | **通过** |
| 教材匹配 | 3.2 / rja.3.2.11 |
| 来源 | 默认（SOURCE_REVIEW_REQUIRED） |
| 方法 | `graph_symmetry`* |
| version / fingerprint | **3** / `57a3e3ea…de16181` |
| 审核建议 | **PASS_RECOMMENDED** |

### HSMA-RJA-CH03-PARITY-0025（id=133）

| 项 | 内容 |
|---|---|
| 题干摘要 | [-2,2] 偶函数，[0,2] 上 f(x)=x+1，求 f(-1) |
| 标准答案 | single **C**（=2） |
| 解析评价 | f(-1)=f(1)=2；条件充分 |
| 数学正确性 | **通过** |
| 教材匹配 | 3.2 / 主KP rja.3.2.10；难度 1 |
| 来源 | 默认（SOURCE_REVIEW_REQUIRED） |
| 方法 | `parity_apply`* |
| version / fingerprint | **3** / `4344fe14…47092a7` |
| 审核建议 | **PASS_RECOMMENDED** |

---

## 4. 发布门禁（审核前）

全部 12 题 review-panel：

- `canPublish` = **false**  
- `publishBlockReasons` = `需要先完成当前版本人工审核`  
- 来源门禁无额外阻断  
- 质量门禁无额外阻断（KP/方法已齐）

写入 passed 后 `canPublish` 预期可变 true（仍须另授权 approve）。

---

## 5. 未写入 / 待批准

| 项 | 状态 |
|---|---|
| 审核 API 写入 | **未执行**（待确认） |
| 未通过题 | 无（建议层） |
| 待批准题 | 全部仍 draft；approve **禁止本轮** |

---

## 6. 下一步授权需求

1. **你逐题确认**允许写入 `passed` 的 code。  
2. 确认后 Agent 用 admin `POST .../reviews` + version/fingerprint 写入。  
3. 再另授权最小集 **approve**（本文件不授予）。

**P1-FUNC-CORE-1A-4B = BLOCKED**（不改判）。
