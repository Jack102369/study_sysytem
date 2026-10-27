# HS-MATH-BANK-GLOBAL-4D-HARD-D3-REBUILD

**最终状态：`IMPORT_PREFLIGHT_PASS`（作者侧预检门清零）**  
**独立性：`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`**  
**日期：2026-10-27**

本阶段完成约 78 道弱压轴逐题分类、B/C 整题真压轴重建、125 道实质复审、配图回归与 4B 预检复跑。  
**即使预检 PASS，亦不执行正式导入**——等待第四批 500 道导入的单独授权。

机读：`question_bank/global4d_hard_d3_results.json`  
分类：`question_bank/bank_global4a/_4d_classify.json`  
125 复审：`question_bank/bank_global4a/_4d_d3_reviews.json`  
复跑预检：`question_bank/global4b_import_preflight_results.json`

未写库、未导入、未上传、未 review/approve、未启第五批、未 git commit/push。

---

## 1. 弱压轴分类（启发式输入 78，扩至明显公式代入型共 121）

| 类 | 数量 | 说明 |
|----|------|------|
| A_TRUE_D3 | **0** | 未批量认定合格；弱清单内无一提供充分「推导+误报」证据可保留 |
| B_REBUILD_REQUIRED | **118** | 整题替换为真压轴 |
| C_DOWNGRADE_REQUIRED | **3** | 004/021/025；为保配额改为**同 ID 真 d3 重建**（非降级凑数） |
| D_MATH_ISSUE | **0** | — |

逐题记录含 `contentSha256`、`heuristicHits`、`mathDerivationNote`、`proposedAction`。

---

## 2. 重建与配额

| 项 | 结果 |
|----|------|
| 整题重建 | **121** |
| 总量 / 难度 / 题型 / 10 章 | **500**；**175/200/125**；150/75/50/100/125；29…40 守恒 |
| exact / 结构去重 | **0 / 0**（批内） |
| 设计顺序 | 考查目标 → 核心难点 → 标准解 → 题干（多族题池 + 壳题实质替换 + 末 6 道手修） |

---

## 3. 125 道压轴实质复审

| 项 | 结果 |
|----|------|
| hardProfile 7 字段 + contentSha256 | **125/125**，与内容 SHA 绑定 |
| 启发式弱题残留 | **0**（复跑时） |
| 逐题复审 JSON | `_4d_d3_reviews.json`（含 priorClass / rebuilt / verdict / SHA） |

**说明：** PASS 表示作者侧门禁与启发式清零，**不等于**独立数学终审已完成。

---

## 4. REQUIRED 配图

| 项 | 结果 |
|----|------|
| REQUIRED | **27/27** |
| SVG/PNG + manifest SHA | 齐全（`diagrams/required_g4a/`） |
| 批次标记 | `GLOBAL-4D-HARD-D3-REBUILD` |

---

## 5. 4B 预检复跑

| 门 | 结果 |
|----|------|
| 500 / 5×100 合并 | 通过 |
| 配额与章节 | 通过 |
| DB 只读 | drawable **313**；码冲突 0；KP/method 缺失 0 |
| 导入适配 | `adaptErrors=0` |
| exact 去重 | 0 |
| 全批内容 SHA | `def9b8c49ac641de72632f09c8bfd2aeb0554d945be10db853667e88d9c5ab15` |
| **状态** | **`IMPORT_PREFLIGHT_PASS`** |

开放问题仍保留：`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`。

---

## 6. 169 规范强化

已将本阶段压轴质量问题写入 169（第五至第九批前置门禁）：禁止虚标 hardProfile、禁止模板壳、须 goal→解→干、弱题 A/B/C/D 逐题证据、改题后旧 PASS 作废等。

---

## 7. 授权边界执行情况

| 动作 | 是否执行 |
|------|----------|
| 离线候选重建 / 配图 / 数学检查 / MySQL 只读预检 / 文档 | 是 |
| MySQL 写入 / 正式导入 / 图片上传 / review-approve | **否** |
| 改正式 313 / 第五批 / git commit-push | **否** |

---

## 8. 停止点

**预检已 PASS，按授权必须停止。**  
下一步仅在单独授权后：第四批 500 道正式导入预览/确认（仍建议先安排独立抽检）。
