# 工业实验自动质量检查设计（STEP_08）

> **自动检查通过 ≠ 人工审核通过 ≠ 化学正确。**  
> `unknown` 不得视为 `pass`。AI 辅助审查不得覆盖程序确定性 `fail`。

## 1. 架构

```
IndustrialQualityCandidateBundle
  (Case + Candidate + Definition + Public + SVG + RenderReport)
        ↓
六维确定性检查（并行组合）
        ↓
可选 AI 辅助审查（Mock / HTTP；结果降级为 unknown 辅助）
        ↓
聚合 overallStatus + blockingIssues
        ↓
IndustrialQualityReport（requiresHumanReview=true）
        ↓
quality-report.json（受控候选目录）
```

入口：`checkIndustrialCandidateQuality()`  
版本：`qualityVersion=1.0.0`

## 2. 六个质量维度

| 维度 | 模块 | 覆盖 |
|------|------|------|
| curriculum | `industrial-quality.curriculum.ts` | gradeScope、课程审核态、难度范围、有限知识点白名单、分类、案例信任 |
| chemistry | `industrial-quality.chemistry.ts` | 有限非法化学式、来源 verified、反应 pending、方程格式粗检 |
| process | `industrial-quality.process.ts` | 过滤除可溶盐、过度宣称真实工业、物料/步骤引用、产品入边、recycle |
| diagram | `industrial-quality.diagram.ts` | 复用 Definition/Public/SVG 校验；泄露/脚本/渲染报告 |
| consistency | `industrial-quality.consistency.ts` | 节点/标签/操作①、答案-选项、未知节点答案链、解析存在性 |
| teaching | `industrial-quality.teaching.ts` | 题干/选项、答案入干、标签泄露、开放题风险、题型匹配 |

## 3. 化学正确性边界（如实）

**已实现（有限）：**

- 命中 `H3O4` / `NaCl2` 等明显非法片段 → fail  
- unverified 来源 / pendingVerification → fail 或 unknown  
- 方程缺少 `=`/`→` → fail；有等号 → **unknown**（不宣称配平正确）

**未实现：**

- 完整配平引擎  
- 氧化还原自动推理  
- 与正式 chem_reactions KB 自动对齐证明  

未覆盖一律 `unknown`。

## 4. 工艺合理性

确定性：过滤除可溶盐、教学简化过度宣称、引用缺失、产品无入边、recycle 端点。  
深层收率/放大：`PROCESS_DEEP_REASONING` → unknown。

## 5. 图形与 SVG

复用 STEP_05/06：`validateIndustrialDiagramDefinition` / `AgainstCase` / `Public` / `renderReport`。  
结构通过 ≠ 化学流程正确。

## 6. 图文答案一致性

题干 `操作①`、referencedNodeIds/Labels 必须存在；单选答案映射选项；未知节点需 internal 答案关联。

## 7. AI 辅助审查

- `runIndustrialAiQualityReview` 与出题服务分离  
- 默认 Mock：各维度辅助检查强制 `unknown`  
- 真实 HTTP：解析 JSON，但 **pass/fail 均降级为 unknown 辅助**，不得科学证明  
- 配置缺失：`not_executed`，确定性检查照常  

同模型两次调用 ≠ 独立科学证明（报告 notes 已声明）。

## 8. 质量报告与版本绑定

字段：`reportId/candidateId/case*/diagram*/public*/questionContentHash/auditContentHash/checks/summary/blockingIssues/warnings/unknownIssues/overallStatus/requiresHumanReview/developmentOnly/formalPublishEligible/aiReview*`  

`isIndustrialQualityReportCurrent()`：题干/答案/解析/Definition/Public/案例哈希任一变化 → 旧报告失效。

## 9. 聚合与拦截

| 条件 | overallStatus |
|------|----------------|
| 任一 fail（含 critical/error） | failed_automatic_checks |
| 无 fail 但有 unknown | incomplete_verification |
| 无 fail 无 unknown | passed_automatic_checks |

`requiresHumanReview` **恒为 true**。  
`formalPublishEligible`：仅非 development_only + 案例可信 + passed；当前 draft 案例为 false。

阻断示例：答案泄露、SVG 脚本、Public 内泄、严重化学/工艺/图文错误、案例未审核（正式模式）。

## 10. 持久化

`docs/chemistry_industrial_experiment/generated_candidates/task_*/quality-report.json`  
非正式学生 API；不含写入 chem_train_items。

## 11. 测试状态

| 类型 | 结果 |
|------|------|
| Mock 完整质检链路 | 通过 |
| 真实 AI 审查 | NOT_EXECUTED（无密钥） |

## 12. STEP_09 建议

管理端展示报告 + blockingIssues + 报告是否过期；入库前强制当前报告；解决 chem_train_items SVG 字段；**不得**绕过 formalAllowed / curriculum_ok / verify_blocked。
