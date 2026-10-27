# HS-MATH-BANK-GLOBAL-2A — 第二批 100 道候选题索引

> 日期：2026-10-26  
> **最终状态：`CANDIDATES_READY_FOR_INDEPENDENT_REVIEW`**  
> 权威结构化数据：`question_bank/candidates-g2a-100.mjs`  
> 分章全文：`question_bank/bank_global2a/chXX_candidates.md`  
> REQUIRED 离线图：`diagrams/required_g2a/`  
> **未写入 MySQL**；**未**进入 GLOBAL-2B / 导入 / review / approve  
> 基线 drawable（只读）：**113**

---

## 1. 章节分布

| 章 | specialty | 题量 | 文件 |
|----|-----------|------|------|
| 1 | `rja-ch1` | 6 | [`ch01_candidates.md`](./question_bank/bank_global2a/ch01_candidates.md) |
| 2 | `rja-ch2` | 10 | [`ch02_candidates.md`](./question_bank/bank_global2a/ch02_candidates.md) |
| 3 | `rja-ch3` | 12 | [`ch03_candidates.md`](./question_bank/bank_global2a/ch03_candidates.md) |
| 4 | `rja-ch4` | 14 | [`ch04_candidates.md`](./question_bank/bank_global2a/ch04_candidates.md) |
| 5 | `rja-ch5` | 16 | [`ch05_candidates.md`](./question_bank/bank_global2a/ch05_candidates.md) |
| 6 | `rjb-ch1` | 14 | [`ch06_candidates.md`](./question_bank/bank_global2a/ch06_candidates.md) |
| 7 | `rjb-ch2` | 4 | [`ch07_candidates.md`](./question_bank/bank_global2a/ch07_candidates.md) |
| 8 | `rjb-ch3` | 14 | [`ch08_candidates.md`](./question_bank/bank_global2a/ch08_candidates.md) |
| 9 | `rjb-ch4` | 4 | [`ch09_candidates.md`](./question_bank/bank_global2a/ch09_candidates.md) |
| 10 | `rjb-ch5` | 6 | [`ch10_candidates.md`](./question_bank/bank_global2a/ch10_candidates.md) |
| **合计** | | **100** | |

编号：`CAND-G2A-001` … `CAND-G2A-100`。

---

## 2. 难度 / 题型

| difficulty | 题量 | 目标 |
|------------|------|------|
| 1 | 35 | 35 |
| 2 | 40 | 40 |
| 3 | 25 | 25 |

| qtype | 题量 | 目标 |
|-------|------|------|
| single | 30 | 30 |
| multi | 15 | 15 |
| judge | 10 | 10 |
| numeric | 20 | 20 |
| application | 25 | 25 |

25 道 application 均含完整 `rubric`，且分值之和 = `maxScore`。

---

## 3. 配图标记

| diagramRequirement | 题量 |
|--------------------|------|
| REQUIRED | 7 |
| RECOMMENDED | 8 |
| NOT_NEEDED | 85 |

REQUIRED（均已制 SVG+PNG，见 `diagrams/required_g2a/`）：

- CAND-G2A-045 扇形弧长/面积  
- CAND-G2A-055 双仰角测高  
- CAND-G2A-081 正三棱锥体积  
- CAND-G2A-084 正方体位置关系多选  
- CAND-G2A-086 长方体中点线面平行证明  
- CAND-G2A-088 直三棱柱线面垂直证明  
- CAND-G2A-089 正方体面面垂直多选  

题干**未**嵌入 HTML/base64 图片。

---

## 4. KP / method

- 主 KP 均取自库内 active 知识点（只读导出 `_g2a_readonly_baseline.json`，153 个）。  
- 本批使用 distinct KP：**97**。  
- method 覆盖全部 11 个合法枚举；无未知 method。  
- 未执行 KP 迁移；未发现需硬映射无关 KP 的题目。

---

## 5. 来源

| sourceType | 题量 |
|------------|------|
| original | 100 |
| past_exam | 0 |

未编造高考来源；`verified ≠ permitted` 规则遵守。

---

## 6. 字段协议

与 `candidates-g1b-100.mjs` 兼容，并扩展：

- `authorMathNote`  
- `diagramRequirement` / `diagramSpecification` / `noDiagramReason`  

导入器未使用字段可忽略；未引入破坏性新结构。

---

## 7. 旁证

- `question_bank/bank_global2a/_g2a_stats.json`  
- `question_bank/bank_global2a/_g2a_math_spotcheck.md`  
- `diagrams/required_g2a/_manifest.json`

---

*文档结束：150_hs_math_bank_global2a_candidates.md*
