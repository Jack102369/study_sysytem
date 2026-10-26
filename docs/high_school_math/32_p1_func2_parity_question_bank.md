# P1-FUNC-2：函数奇偶性 25 题题库

**日期**：2026-10-24  
**库**：`study_system`（本阶段 **无写入**）  
**教材**：人教 A 版必修第一册 · 第三章 · 3.2 函数的基本性质  
**专题**：函数的奇偶性

---

## 1. 教材定位

在已入库的奇偶性 4 个 KP（`rja.3.2.09`–`12`）上建设正式训练题文件，走既有 preview→confirm→draft 与审核工作台流程；本阶段只交付文件与校验。

## 2. 题库内容

| 内容组 | 题号 | 数量 |
|--------|------|------|
| 奇偶性定义 | 0001–0005 | 5 |
| 定义域对称性 | 0006–0009 | 4 |
| 奇偶函数判断 | 0010–0014 | 5 |
| 利用奇偶性求值 | 0015–0018 | 4 |
| 图象对称性 | 0019–0021 | 3 |
| 奇偶性与单调性综合 | 0022–0025 | 4 |

## 3–6. 统计

| 维度 | 分布 |
|------|------|
| 题型 | single 12 / multi 5 / judge 4 / numeric 4 |
| 难度 | 1→12 / 2→9 / 3→4 |
| 主 KP | `.09`→6 / `.10`→7 / `.11`→5 / `.12`→7 |

code：`HSMA-RJA-CH03-PARITY-0001` … `0025`  
`specialtyCode=rja-ch3`，`categoryCode=3.2`

## 7–8. 协议与权威源

- 权威源：`apps/api/src/hs-math/util/hs-math-p1-func2-parity-items.ts`
- 生成：`docs/high_school_math/question_bank/chapter_03/parity_25.json`
- 符合 `HsMathImportItem`；无 status / approved 等禁字段
- 命令：`pnpm --filter api run hs-math:p1-func2-check`

## 9–10. 程序验证与独立数学复核

`hs-math:p1-func2-check`：

- 结构/协议/答案 payload / KP / 去重 / LaTeX `$` 配对 / 分配表
- 独立复核：定义与定义域逻辑、有限点抽样奇偶、求值重算、图象对称规则、反例（如 $x^{3}-x$）
- 结果：**VERIFIED=23**，**NEEDS_HUMAN_REVIEW=2**（00022、00023 综合证明表述），**FAILED=0**

抽样验证不能代替全体实数证明；已在 `review_issues_parity.md` 声明。

## 11–12. 人工审核与已知错误

| 项 | 值 |
|----|-----|
| PENDING | 25 |
| APPROVED | 0 |
| 已确认数学错误 | **无** |

## 13. 数据库

**未执行** preview / confirm / INSERT；第一章 80 题与第三章 27 KP 未改。

## 14. 下一阶段

**READY_FOR_PARITY_IMPORT_PRECHECK**（导入预检授权后另开阶段）
