# 180 · HS-MATH-HARD-CH1-4-CANDIDATES-1B

> **状态：`HARD_BATCH100_READY_FOR_PREFLIGHT`**  
> **独立性：`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`**  
> **本阶段：离线候选**（未导入、未正式配图上传、未改 813 库）

---

## 1. 候选与设计映射

| 项 | 值 |
|----|-----|
| 设计 | `HARD-DESIGN-001`…`100` |
| 候选 | `CAND-HARD14-001`…`100` |
| 映射 | **100/100 一一对应** |
| 文件 | `question_bank/hard_ch1_4_batch1a_candidates.mjs` |

---

## 2. 章节配额

| 章 | 数量 |
|----|------|
| rja-ch1 | 10 |
| rja-ch2 | 35 |
| rja-ch3 | 40 |
| rja-ch4 | 15 |
| **合计** | **100** |

---

## 3. H1/H2/H3 结果（诚实对齐后）

| | 目标配额 | 标签 hardLevel | 审计 TRUE_* |
|--|----------|----------------|-------------|
| H1 | 30 | **32** | **32** |
| H2 | 45 | **45** | **45** |
| H3 | 25 | **23** | **23** |

说明：相对设计目标少了 2 个 H3 标签——因诚实降标（如反函数交点完整参数分类触及超纲边缘、若干题审计为 TRUE_H1/H2），**不为凑 25 虚抬 H3**。  
`hardLevel` 与 `TRUE_*` **已对齐**；`MODERATE_ONLY` = **0**。

曾判 MODERATE 的 019/052/054 已实质重设计并升为 TRUE_H*。

---

## 4. 题型分布

| qtype | n |
|-------|---|
| application | 49 |
| numeric | 16 |
| single | 15 |
| multi | 15 |
| judge | 5 |
| **合计** | **100** |

五种题型均覆盖；题型服从数学设计，难度优先。

---

## 5–6. 数学验证与真实难度审核

| 项 | 结果 |
|----|------|
| 逐题解析 / hardProfile / contentSha256 | **100** |
| TRUE_H1 / TRUE_H2 / TRUE_H3 | 32 / 45 / 23 |
| MODERATE_ONLY / MATH_ISSUE / UNCERTAIN | **0** |
| 5×20 组 QC | 全部 **PASS** |

难度依据见各题 `hardLevelReason`、`hardProfile.difficultyEvidence`、`compareDowngrade.contrast`（对照容斥/辅助角/一步抽象单调等降级结构）。

---

## 7. 对照原 200 道降级题

每题含 `compareDowngrade`（structureType + 具体思维差异）。  
反例库：`hard_ch1_4_difficulty_reference.json`。  
禁止仅写「更综合」。

---

## 8. 去重

| 项 | 结果 |
|----|------|
| 批内 modelFamily / 设计 1:1 | 无机械扩题 |
| 留白/去重填充句 | **0**（结构扫描） |
| 低价值同构清零策略 | 发现常规 AM-GM/偶函数代入等已重写 |

与 813 正式题：本批为设计转化原创；导入前预检仍须做全文语义去重。

---

## 9. Rubric

application **49** 道均含 `maxScore` + 分项 `score`，分值和一致（组装校验通过）。

---

## 10. 插图

| 项 | 值 |
|----|-----|
| REQUIRED | **0**（本批题干文字自足，未强制图） |
| RECOMMENDED / NOT_NEEDED | 按题标注 |
| 目录 | `diagrams/hard_ch1_4_batch1a/`（manifest 已建；REQUIRED=0） |

若预检阶段抽检要求补图，可另授权补 REQUIRED。

---

## 11. 全批 SHA

见 `hard_ch1_4_batch1a_quality_results.json` → `batchContentSha256`；  
每题 `hardProfile.contentSha256` 绑定最终题干/选项/答案/解析/rubric。

---

## 12. 未解决问题

1. 作者侧审核 ≠ 独立终审。  
2. 导入预检 / 正式配图上传 / review / approve **未授权**。  
3. H3 实际 23＜目标 25（诚实）；若需补满须**新设计**而非抬标签。  
4. 与 813 的机器全文去重建议在预检阶段再跑一遍。

---

## 13. 独立性

`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`

---

## 最终状态

**`HARD_BATCH100_READY_FOR_PREFLIGHT`**

---

## 停止

禁止：MySQL 写入、正式导入、正式配图上传、review/approve、改 813、第五批、Git commit/push。  
等待下一阶段**导入预检**授权。
