# 185 · HS-MATH-H3-CH1-4-EXCLUSIVE-BATCH1A

> **最终状态：`QUALITY_PARTIAL`**  
> **独立性：`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`**  
> **日期：2026-10-28**

前四章 **真 H3** 专属离线批次。目标上限 50；**仅 ACCEPTED_H3 计入合格**。  
本批诚实合格：**38**（未为凑 50 降标或塞入 H1/H2；已并入强化 Ch1/Ch2/Ch4 包）。  
> **后续：** `186`（HS-MATH-H3-CH3-EXCLUSIVE-COMPLETION-1C）在保护本 38 道前提下追加 Ch3 真 H3 **+6** → 离线合计 **44**；仍为 `QUALITY_PARTIAL`。详见 `186`。

机读：

- `question_bank/h3_ch1_4_designs.json`
- `question_bank/h3_ch1_4_candidates.mjs`
- `question_bank/h3_ch1_4_quality_results.json`
- `question_bank/h3_ch1_4_batch1a/_h3_benchmark.json`
- `question_bank/h3_ch1_4_batch1a/_rejected_ledger.json`

未写 MySQL；未正式导入；未配图上传；未 review/approve；未 Git。

---

## 1. H3 难度标准（准入门槛）

见 `_h3_benchmark.json` / `H3_EXCLUSIVE_GATE_V1`。

必须同时满足：

1. 非显然突破点（常规套路会卡死或误判充分条件）  
2. 相对已入库 HARD14 的 H2 有明确更高分岔/结构  
3. 充要分层或策略选择或耦合约束  
4. 分类合理必要  
5. 限必修一前四章；禁导数、圆锥曲线  

自动否决：普通含参不等式、常规判别式、直 AM-GM、对勾、简单奇偶单调、指对化简、换数换皮、与 HARD14-H2 低价值同构。

**hardProfile 文字不能单独证明 H3。**

---

## 2. 为何此前 100 道无 H3（标杆根因）

| 来源 | 结论 |
|------|------|
| 181/182/183 | 作者标 H3→双遍后 **TRUE_H3=0**；套路含参/判别式/AM-GM 等被降 |
| 175/176 | 虚标 d3 多为短题干+公式壳 |
| 169 §12 | 目标→解→干；字段齐全≠达标 |
| HARD14 最终 | H1=53 / H2=47 / **H3=0**（诚实） |

本批 Round2 对照上述 H2 顶格：可被套路秒杀者一律 `REJECTED_NOT_H3`，**禁止降为 H2 后留在本批**。

---

## 3–5. 设计 / 合格 / 淘汰计数

| 项 | 数量 |
|----|-----:|
| 建设目标上限 | 50 |
| 进入双轮候选池（章模块） | 50 设计意图（含后淘汰） |
| Round2 **ACCEPTED_H3** | **38** |
| **REJECTED_NOT_H3**（及草稿） | **12**（见 ledger；多为 Ch3 未过门禁） |
| 数学错误淘汰（组装层） | 当前 MATH 阻断 0 |
| 最终写入 candidates | **38** |

### 章节实际分布（合格）

| 章 | 目标 | 实际 ACCEPTED_H3 |
|----|-----:|-----------------:|
| 1 | 5 | **5** |
| 2 | 20 | **20** |
| 3 | 20 | **8** |
| 4 | 5 | **5** |
| 合计 | 50 | **38** |

不足目标处：**如实短缺，不跨章虚标补满。**

---

## 6. 与既有 H2 的难度对照（摘要）

合格题均要求写明：

- `contrastH2`：相对 HARD14-H2 高在何处  
- `routineKillCheck`：何种套路会失败  

典型升格结构：空集充要真值、∀∃ 夹逼矛盾、变半径覆盖端点退化、双开区间符号网、恒非负 vs 深负互斥、韦达区间不相容、分段全局单调接合、周期与全局增互斥、指对定义域对一切实参耦合等。

---

## 7–8. 标准解 / 验证 / 去重

- 每道 ACCEPTED 含完整 `analysis` + application `rubric`（和校验通过）  
- 批内 stem-norm 精确重复：**0**  
- vs HARD14 精确 stem：**0**  
- `batchContentSha256`：见 `h3_ch1_4_candidates.mjs`（算法：`sha256(itemShas.join('|'))`）

---

## 9–11. Rubric / 配图 / 真题参考

- application rubric：合格题均 `sum(score)=maxScore`  
- **REQUIRED = 0**（全部文字自足）；目录 `diagrams/h3_ch1_4_batch1a/` 仅占位说明  
- 真题：仅思想结构参考（定义域咬合、抽象对称、参数互斥）；**不复制题干**；`verified ≠ permitted`；全部 `sourceType=original`

---

## 12–14. 未解决问题与独立性

1. **ACCEPTED_H3=38 < 50**（1A 时点）：若产品需要满额真 H3，须另开授权扩写，不得放宽门禁。  
2. 章配额：Ch1/Ch2/Ch4 已满目标；**Ch3 在 1A 时为 8/20**（后由 **186 / 1C** 追加至 14/20）。  
3. 作者侧双轮 ≠ 外部独立终审 → **`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`**  
4. 正式导入 / 预检写库：**未授权**  
5. 强化来源：`_accepted_ch1_ch4.mjs`、`_accepted_ch2.mjs`（Ch2 全量 20 经门禁）。  
6. **1C 续作**：见 `186_hs_math_h3_ch3_exclusive_completion_1c.md`（+6 Ch3；合计 44；仍未入库）。

---

## 最终状态

# `QUALITY_PARTIAL`

（1A 时点：不足 50 如实 PARTIAL；Ch1=5、Ch2=20、Ch4=5 已达标；Ch3=8。）

可进入下一阶段预检的前提建议：用户确认接受当时 **38** 道真 H3 子集，或授权继续扩写 **Ch3**（已执行 → `186`）。

### 停止声明

禁止：正式导入、MySQL 写、正式配图上传、review/approve、改 913、第五批、Git commit/push。  
等待下一阶段授权。
