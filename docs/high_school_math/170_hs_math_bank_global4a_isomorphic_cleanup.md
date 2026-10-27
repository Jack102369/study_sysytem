# HS-MATH-BANK-GLOBAL-4A-ISOMORPHIC-FINAL-CLEANUP

**最终状态：`BATCH500_READY_FOR_IMPORT_PREFLIGHT`**  
**独立性：`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`**  
**日期：2026-10-27**

本阶段仅做第四批离线同构清理。未写库、未导入、未上传、未 review/approve、未启第五批、未 git commit/push。

---

## 1. 原 13 处既有题相似关系的实际判定

盘点确认：**13 道候选**（不是 13 个抽象关系各自一题）。

| 判定 | 数量 | 说明 |
|------|------|------|
| EXACT_DUPLICATE | 0 | 无完全相同题干 |
| SEMANTIC_DUPLICATE | 12 | 正方体体积/模长/i^n/奇函数+x+k/x 等仅换数 |
| ACCEPTABLE_VARIANT | 1 | **CAND-G4A-275**：既有求独立交概率，本题求并概率 |
| DISTINCT | 0（盘点时） | — |

12 道 SEMANTIC 已整题替换。275 保留并记录教学增量。

---

## 2. 原 48 个同构族及其涉及题数

| 项 | 值 |
|----|-----|
| 族数 | **48** |
| **涉及不同候选** | **424** |
| 与 prior 重叠 | 10 |
| 并集涉及候选 | 427 |
| 族规模直方图 | 2×2 … 最大族 55/51/49（空壳模板） |

**不能把 48 族当成 48 题。** 主因是跨章粘贴的空壳模板（参数个位数、章专项多选、x+k/x、向量模方等）。

---

## 3. ACCEPTABLE_VARIANT 数量与依据

**最终保留 1 道：**

- **CAND-G4A-275**：训练独立事件下 **并集** 公式 \(P(A\cup B)=P(A)+P(B)-P(A)P(B)\)，与既有题交概率乘法公式考查目标不同。

---

## 4. 发现的低价值同构数量

- 批内：48 族 / 424 题（盘点时几乎全为 LOW_VALUE / SEMANTIC）
- prior：12 道 SEMANTIC
- 清理中另发现跨章错位模板（圆柱体积落在 ch1/2/6、空壳“设 k=…多选”等）并清除

---

## 5. 整题替换数量

约 **394** 道标注为「同构清理整题重设计」（含自动 3 轮 + nonsense/族/跨章定向修补）。  
禁止手段未使用：单纯换数、换皮、留白句、只改 difficulty 标签。

---

## 6. 替换后的新同构数量

| 口径 | 最终 |
|------|------|
| 章内结构族（chapter\|normStem） | **0** |
| 全局数字抹平多题族 | **0** |
| prior 结构命中 | **1**（均为 ACCEPTABLE） |

---

## 7. 500 道最终数学质量结果

- `validate all` → **ok**（配额/KP/method/rubric/精确去重）
- 留白句：**0**
- 章节/难度/题型配额：与槽位一致
- 500 唯一 ID；分组与合并一致
- **不能仅凭 validate ok**：已另做同构盘点清零、nonsense 清除、REQUIRED 覆盖

---

## 8. 125 道压轴真实性

- 受替换影响的 d3 在重建时写入 hardProfile / 分析
- 未改动压轴作作者侧抽查口径保留
- **限制**：仍为作者侧，非正式独立压轴审计

---

## 9. 125 道 application rubric

- validate：`rubricBad=0`
- 修改过的 application 按 maxScore 分点和
- 未修改题做结构回归（求和/字段）
- **限制**：替代解法公平性非独立终审

---

## 10. REQUIRED 最终数量与覆盖率

| 项 | 值 |
|----|-----|
| 最终 REQUIRED | **13**（由题干重判，不强制维持 46） |
| 配图覆盖 | **13/13** SVG+PNG+SHA |
| manifest | `diagrams/required_g4a/_manifest.json` |

---

## 11. 留白句剩余数量

**0**

---

## 12. 配额和 KP/method 回归

validate：配额对齐；`kpMiss=0`；`methodIssues=0`。

---

## 13. 未解决问题

1. `INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`
2. 压轴真实性 / 应用题替代解法仍待独立抽检
3. 本状态仅表示可申请 **导入预检**，不表示已入库

---

## 14. 独立审核限制

全部判定与替换为 **作者侧** 工作流。不得视为独立数学终审或 pedagogic sign-off。

---

## 证据路径

- `question_bank/global4a_isomorphic_cleanup_results.json`
- `question_bank/bank_global4a/_iso_inventory.json`
- `question_bank/candidates-g4a-500.mjs`
- `question_bank/bank_global4a/g4a_group01–05.mjs`
- `diagrams/required_g4a/_manifest.json`

---

## 停止声明

阶段结束即停止。禁止自动导入、禁止启动第五批。
