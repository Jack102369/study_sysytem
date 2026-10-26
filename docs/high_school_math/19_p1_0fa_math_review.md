# P1-0F-A 第一章逐题数学复核说明

日期：2026-10-24

## 题库唯一数据源

权威维护入口：

`apps/api/src/hs-math/util/hs-math-p1-0e-bank-items.ts`

生成物（禁止分头手工改）：

- 五个小节 JSON + `chapter_01_all.json`（`hs-math:p1-0e-check`）
- `review_book.md` / `review_checklist.md` / `review_issues.md`（`hs-math:p1-0fa-verify`）

操作：改 TS → 跑上述两条命令 → 提交生成物。

## 逐题复核方法

1. 结构：复用 `validateAnswerPayload` / 导入协议校验。  
2. 独立计算：子集个数、元素个数、有限交并补计数等在 `hs-math-p1-0fa-math-verify.ts` 内**重新计算**后再比对题库。  
3. 独立枚举：有限整数/有限全集上枚举真假。  
4. 重点逻辑：充分必要双向、量词否定规则等在脚本中单独断言。  
5. 其余：通读推导，标记 `NEEDS_HUMAN_REVIEW`（不得伪称机器证明）。

## 覆盖说明（2026-10-24 实测）

| 状态 | 题数 |
|------|------|
| VERIFIED_BY_CALC | 16 |
| VERIFIED_BY_ENUM | 11 |
| VERIFIED_BY_LOGIC | 10 |
| NEEDS_HUMAN_REVIEW | 43 |
| FAILED | 0 |

- `VERIFIED_BY_CALC`：公式/计数独立计算后再比对题库  
- `VERIFIED_BY_ENUM`：有限论域枚举  
- `VERIFIED_BY_LOGIC`：脚本内显式充分必要/量词否定等检验  
- `NEEDS_HUMAN_REVIEW`：通读未发现矛盾，但无独立自动证明 → 待具名人工审核  
- `FAILED`：不得保留

**注意**：有限枚举不能自动证明“对一切实数”成立；`VERIFIED_BY_LOGIC` ≠ 人工 APPROVED。

## 发现的问题及修复

- `HSMA-RJA-CH01-0065`：解析英文残留已改为中文（非答案错误）。

## OPEN 问题

见 `question_bank/chapter_01/review_issues.md`：

- 1.2 子集计数题同质化（质量，非阻断）
- 实数全称命题需人工抽查
- 几何文字充分必要题需人工抽查

## 人工审核状态

80 题均为 **PENDING**；APPROVED=0；REJECTED=0。

## 下一阶段导入风险

- 未人工审核前不得批量批准。  
- 导入仅应进入 draft。  
- 同质化题可能影响训练体验，可在后续迭代替换。

## P1-0F-B 准入建议

**READY**：允许进入受控 draft 导入**准备**。  

READY ≠ 允许批量批准。
