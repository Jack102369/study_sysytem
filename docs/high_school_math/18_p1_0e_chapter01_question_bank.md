# P1-0E 第一章正式题库建设说明

日期：2026-10-24

## 1. 教材定位

- 全国通用人教 A 版
- 普通高中数学 **必修第一册**
- 第一章：**集合与常用逻辑用语**
- 不标注未经核实的“修订版”；非上海地方教材

## 2. 题库范围

仅第一章五小节：`1.1`–`1.5`  
`specialtyCode = rja-ch1`  
知识点仅使用库中已有 15 个 `rja.1.*.*` code（已 SELECT 核实启用）。

## 3. 总题数

**80**

## 4. 五小节分配

| 小节 | 题量 | 文件 |
|------|------|------|
| 1.1 | 16 | `01_sets_concept.json` |
| 1.2 | 16 | `02_set_relations.json` |
| 1.3 | 20 | `03_set_operations.json` |
| 1.4 | 16 | `04_sufficient_necessary.json` |
| 1.5 | 12 | `05_quantifiers.json` |

## 5. 四题型统计

| qtype | 数量 |
|-------|------|
| single | 40 |
| multi | 16 |
| judge | 12 |
| numeric | 12 |

## 6. 难度统计

| difficulty | 数量 |
|------------|------|
| 1 | 40 |
| 2 | 28 |
| 3 | 12 |

## 7. 知识点覆盖（主 KP）

| KP | 主知识点题数 |
|----|----------------|
| rja.1.1.01 | 7 |
| rja.1.1.02 | 6 |
| rja.1.1.03 | 3 |
| rja.1.2.01 | 12 |
| rja.1.2.02 | 4 |
| rja.1.3.01 | 6 |
| rja.1.3.02 | 5 |
| rja.1.3.03 | 5 |
| rja.1.3.04 | 4 |
| rja.1.4.01 | 8 |
| rja.1.4.02 | 4 |
| rja.1.4.03 | 4 |
| rja.1.5.01 | 5 |
| rja.1.5.02 | 4 |
| rja.1.5.03 | 3 |

均 ≥ 3。

## 8. 正式题 code

- 起始：`HSMA-RJA-CH01-0001`
- 结束：`HSMA-RJA-CH01-0080`
- 符合 `CODE_RE`；无测试/示例前缀；与库中现有 code 无冲突（建设时 SELECT 确认无 `HSMA-RJA-CH01%`）

## 9. 导入协议兼容

字段与 P1-0D 导入协议一致：`code/specialtyCode/categoryCode/qtype/difficulty/stem/options/answerPayload/analysis/knowledgePointCodes/primaryKnowledgePointCode`。  
校验复用 `validateImportItemStructure` + `validateAnswerPayload`。

## 10. 程序校验结果

`pnpm --filter api run hs-math:p1-0e-check` → **PASS**

含：JSON 写出、数量、code、题型/难度、KP、结构、答案协议、题干去重、聚合一致性。

## 11. 数学复核方式

- 有限集合交并补、子集/真子集个数、枚举真假：可手算/枚举（清单标 `ENUM_OR_CALC`）
- 充分必要方向、量词否定：逻辑复核（`LOGIC_REVIEW`）
- **整体仍标 NEEDS_HUMAN_REVIEW**，不得视为计算机证明

## 12. 尚需人工审核

- 全部 80 题人工状态 **PENDING**
- 多选是否漏正确项、充分必要方向、区间端点、量词否定细节

## 13. 疑似错误题

建设与自检阶段未发现已确认的数学错误保留项。  
若审核发现错误：改 `hs-math-p1-0e-bank-items.ts` 后重跑 `hs-math:p1-0e-check`。

## 14. 本阶段是否写数据库

**否。** 未调用 preview/confirm，未批准，未改 `study_system` 业务数据。

## 15. P1-0F 准入建议

**READY（文件侧）**：题库文件与结构校验完成，可进入「人工审核 → 受控 preview/confirm → draft → 批准」流程。  

**前置**：完成人工审核清单；禁止未审核批量批准。
