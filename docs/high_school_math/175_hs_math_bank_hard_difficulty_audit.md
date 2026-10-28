# 175 · HS-MATH-BANK-HARD-DIFFICULTY-AUDIT-1A

> **状态：`DIFFICULTY_AUDIT_PARTIAL`**  
> **独立性：`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`**（作者侧离线审计，非独立数学终审）  
> **库写入：无**（只读导出 + 离线判定）  
> **审计时间：** 见 JSON `auditedAt`

---

## 1. 数据库真实 drawable 基线

| 项 | 值 |
|----|-----|
| 期望 drawable | 813 |
| 实际 drawable | **813** |
| 匹配 | 是 |
| 当前 d1 / d2 / d3 | **291 / 322 / 200** |
| 审计对象 | 全部正式 `difficulty=3` → **200** 题 |
| 其中第四批 G4A | **125** |
| 版本绑定 | 每题 `contentVersion` + `fingerprint`（内容 SHA）；版本变化则结论失效 |

快照：`question_bank/bank_global4a/_hard_audit_baseline_ro.json`  
全量导出：`question_bank/bank_global4a/_hard_audit_d3_export.json`

---

## 2–3. 当前难度与审计范围

- 全库五种题型 / 十章分布见基线快照（与库存统计页一致）。
- **实际审计 d3 数量：200 / 200（全量，无抽样）。**
- 未采信历史 `TRUE_D3` / `hardProfile` / 4B–4D PASS 作为合格结论。

---

## 4–7. 建议汇总（核心结论）

| 建议 | 数量 | 说明 |
|------|------|------|
| **保持 d3** | **0** | 按严格压轴标准，本批 200 题无一达到「非显然突破 + 深层综合」 |
| **降为 d2** | **141** | 常规提高 / 教材套路多步题 |
| **降为 d1** | **53** | 直接代入、特殊角、短概念辨析等 |
| **UNCERTAIN** | **6** | 有弱压轴信号但未达明确 d3，需人工复核（倾向仍应降为 d2） |

### 若仅按「明确建议」重标后的 813 分布（未改库）

| | d1 | d2 | d3 |
|--|----|----|-----|
| 建议后（UNCERTAIN 暂仍算 d3） | 344 | 463 | 6 |
| 严格仅保留明确 keep | 344 | 463 | **0** |

---

## 8. 各章节统计（原 d3）

| 章节 | 原 d3 | 保持 | →d2 | →d1 | UNCERTAIN |
|------|-------|------|-----|-----|-----------|
| rja-ch1 集合与逻辑 | 10 | 0 | 6 | 4 | 0 |
| rja-ch2 二次函数方程不等式 | 19 | 0 | 14 | 5 | 0 |
| rja-ch3 函数概念与性质 | 28 | 0 | 20 | 6 | 2 |
| rja-ch4 指数对数 | 29 | 0 | 16 | 12 | 1 |
| rja-ch5 三角函数 | 33 | 0 | 24 | 6 | 3 |
| rjb-ch1 平面向量 | 25 | 0 | 21 | 4 | 0 |
| rjb-ch2 复数 | 8 | 0 | 1 | 7 | 0 |
| rjb-ch3 立体几何 | 30 | 0 | 22 | 8 | 0 |
| rjb-ch4 统计 | 9 | 0 | 8 | 1 | 0 |
| rjb-ch5 概率 | 9 | 0 | 9 | 0 | 0 |

**主要虚标原因：** 题干短、直接公式/定义、两集合韦恩、中位线模板、辅助角最值模板、指对模型代入、复数求模等被标成 d3。

---

## 9. 各题型统计（原 d3）

| 题型 | 原 d3 | 保持 | →d2 | →d1 | UNCERTAIN |
|------|-------|------|-----|-----|-----------|
| application | 81 | 0 | 75 | 3 | 3 |
| single | 45 | 0 | 22 | 23 | 0 |
| numeric | 36 | 0 | 23 | 11 | 2 |
| judge | 20 | 0 | 18 | 1 | 1 |
| multi | 18 | 0 | 3 | 15 | 0 |

---

## 10. 逐题数学依据

全量 200 条见：

`question_bank/hard_difficulty_audit_results.json` → `items[]`

每条含：`keyReasoning`、`difficultyReason`、`complexityAssessment`、`confidence`、`contentVersion`、`fingerprint`、`stemSnippet`。

**示例（虚标 d1）：**
- `CAND-G4A-373` `|3-4i|=` → 复数模直接计算 → **d1**
- `CAND-G4A-202` `sin(π-π/6)=` → 诱导公式特殊角 → **d1**

**示例（虚标 d2）：**
- `CAND-G2A-006` 游泳/骑车韦恩两问 → 标准容斥 → **d2**
- `CAND-G4A-246` 中点向量证中位线 → 教材常规证明 → **d2**

---

## 11. 第四批（G4A）专项发现

| 项 | 值 |
|----|-----|
| G4A 原 d3 | 125 |
| 建议保持 d3 | **0** |
| →d2 | 76 |
| →d1 | 43 |
| UNCERTAIN | 6 |

- G4A 原 d3 题干规范化长度中位数约 **33**，大量「一行式」计算/判断被标压轴。
- 此前 GLOBAL-4D `IMPORT_PREFLIGHT_PASS` / hardProfile **不得**作为本次合格依据。
- 用户反馈「压轴偏简单」与库内实质一致。

UNCERTAIN（6，均 G4A，建议人工仍倾向 d2）：

| code | 摘要 |
|------|------|
| CAND-G4A-088 | √+ln 定义域及是否取 0 |
| CAND-G4A-419 | 抽象增函数 f(1)+f(2)=0 ⇒ f(1)≤0 |
| CAND-G4A-437 | log_a 定义域与 a 分类单调 |
| CAND-G4A-089 | 「辅助角最值」前提判断 |
| CAND-G4A-369 | 三角形求 sin B（两解讨论） |
| CAND-G4A-428 | y=3sinx+4cosx 最大值 |

---

## 12. 降级建议清单

文件：`question_bank/hard_difficulty_downgrade_candidates.json`

- **candidates：** 194 条（141×d2 + 53×d1）  
- 每条含：`itemId`、`recommendedDifficulty`、数学理由、`contentVersion`、`fingerprint`、`needsHumanReview`  
- **uncertain：** 6 条  
- **正式调整前必须**校验 DB 中 `content_version` 与 `fingerprint` 仍匹配，否则结论失效

---

## 13. 对 3120 / 压轴 780 目标的影响

| 项 | 值 |
|----|-----|
| 长期 d3 目标 | 780 |
| 本次建议明确保留 d3 | **0** |
| 距 780 缺口 | **780**（若 6 道 UNCERTAIN 也不保留） |
| 本阶段 | **不补题、不生成第五批** |

813 题建议难度重心上移到 d1/d2；真正压轴需后续专项命题。

---

## 14. 审计独立性限制

`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`

- 作者侧规则+题面证据审计，非第二人独立终审。  
- 未调用真实 AI 改库。  
- 未冒充独立数学委员会结论。

---

## 15. 未解决问题

1. 6 道 UNCERTAIN 待人工定稿（建议多数降 d2）。  
2. 正式 `UPDATE difficulty` **未授权**。  
3. 真压轴题库（冲 780）未启动。  
4. 非 d3 的 d1/d2 是否虚高/虚低：本任务未审计。

---

## 最终状态

**`DIFFICULTY_AUDIT_PARTIAL`**

含义：200 道正式 d3 均已给出有题面依据的评价；因存在 6 道 UNCERTAIN，未标 PASS。  
**不表示**原 d3 应保留；明确 keep=0。

---

## 停止

等待用户审核降级清单后，**单独授权**再执行难度调整。  
禁止本阶段：改 difficulty、review/approve、补题、Git commit/push。
