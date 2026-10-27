# HS-MATH-BANK-GLOBAL-2A — 质量报告

> 日期：2026-10-26  
> **最终状态：`CANDIDATES_READY_FOR_INDEPENDENT_REVIEW`**  
> 前置：GLOBAL-1K-FIX-REVIEW-APPROVE = `MINOR_FIX_REVIEW_APPROVE_PASS` · drawable **113**  
> **本阶段未入库、未改正式题、未上传正式图、未 review/approve、未进 GLOBAL-2B**

---

## 1. 结论摘要

| 项 | 结果 |
|----|------|
| 候选数量 | **100 / 100** |
| 章节 / 难度 / 题型配额 | **全部命中目标** |
| application rubric | **25/25 完整且分值和 = maxScore** |
| REQUIRED 插图 | **7/7** SVG+PNG 已生成 |
| KP / method | 库内合法；KP distinct 97；method 11/11 |
| 来源 | 全部 `original`；past_exam **0**（未编造） |
| 数学检查身份 | **作者自检**（非独立终审） |
| 去重 | 批内无重复；修复 034 与 G1B-036 撞题、027 低价值周长题 |

---

## 2. 独立性声明（强制）

本批出题、作者自检、配图制作与本报告撰写为**同一助手族系**。  
因此：

- `mathVerified = AUTHOR_CHECKED` 表示作者自检通过；  
- **不得**冒充独立数学终审 / 独立配图验收；  
- 后续须另派独立主体执行 GLOBAL-2B（或等价独立审核）后再导入。

---

## 3. 配额核验

见 `question_bank/bank_global2a/_g2a_stats.json`。

| 维度 | 实测 | 目标 |
|------|------|------|
| 章 1…10 | 6/10/12/14/16/14/4/14/4/6 | 同左 |
| difficulty 1/2/3 | 35/40/25 | 同左 |
| single/multi/judge/numeric/application | 30/15/10/20/25 | 同左 |

---

## 4. 数学作者自检

### 4.1 分组

按 15–20 题分组完成作者自检；application + REQUIRED 另做独立重导，见：

`question_bank/bank_global2a/_g2a_math_spotcheck.md`

### 4.2 已修复项

| id | 问题 | 处理 |
|----|------|------|
| CAND-G2A-034 | stem 与 G1B-036 同为 \(\log_2 32\) | 改为 \(\log_3 81=4\) |
| CAND-G2A-027 | 与 G1B 周长→最大面积低价值重复 | 改为分段单价预算应用题 |

### 4.3 抽检结论

抽检范围内未发现 CRITICAL/MAJOR 数学错误；其余题以作者自检 PASS 记录。  
**独立终审仍为 PENDING。**

---

## 5. 去重

对照范围：

1. 库内全部 formal active（只读导出）  
2. CAND-G1B-001…100  
3. 本批内部 100 题  

结果：

- 完全相同 stem 前缀命中：034（已修）  
- 批内 `dedupNote` / stem 规范化重复：**0**  
- 语义低价值重复：027（已修）  
- 未仅依赖字符串比较；application/几何另做题意比对  

---

## 6. 配图质量（作者自检）

| code | 资产 | 自检 |
|------|------|------|
| 045/055/081/084/086/088/089 | SVG+PNG | 元素与题干一致；无答案数值/垂直结论标注；无 script/外链 |

独立图审：`MATH_REVIEW_PENDING`（见 `diagrams/required_g2a/NOTES.md`）。

RECOMMENDED（8）：无图仍可由解析式/文字理解；未制图。

---

## 7. KP / method / 来源

- 全部 `kpInDb=true` / `kpInSeed=true`；未迁库。  
- method ∈ 平台 11 枚举；`unusedMethods=[]`。  
- 来源全部原创说明；无 past_exam。

---

## 8. 未解决问题

1. **独立数学终审未做**（同族系作者自检）。  
2. RECOMMENDED 8 题尚未制图（允许）。  
3. 未与全部 211 道 formal 做人工语义全量两两比对（做了 stem 规范化 + 关键题意抽查）。  
4. 导入预检 / GLOBAL-2B **未开始**。

---

## 9. 后续独立审核清单（建议 GLOBAL-2B）

1. 另主体逐题重导答案/解析/rubric（至少全部 application + difficulty=3）。  
2. 复核 7 张 REQUIRED 图是否泄题、是否与题干一致。  
3. 再跑一次与 formal+G1B 的语义去重。  
4. 导入器字段映射预检（含 diagram 字段忽略策略）。  
5. 用户授权后再 draft 导入；**禁止本阶段自动导入**。

---

## 10. 执行边界遵守情况

| 允许 | 已做 |
|------|------|
| 只读查库 | 是 |
| 生成候选 / 离线图 / 质检脚本 / 文档 | 是 |

| 禁止 | 状态 |
|------|------|
| 导入正式库 | **未做** |
| 改 113 正式题 / 上传正式图 / review-approve | **未做** |
| 迁移 / session / 真 AI / 改配置 / 重启 / commit·push（本阶段交付后） | **未做** |
| 进入 GLOBAL-2B | **未做** |

---

*文档结束：151_hs_math_bank_global2a_quality_report.md*
