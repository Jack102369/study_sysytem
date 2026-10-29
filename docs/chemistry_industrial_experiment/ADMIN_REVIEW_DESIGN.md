# 工业实验后台审核设计（STEP_09）

## 1. 候选审核架构

```
Mock/AI 生成产物
  → createIndustrialReviewRecord（文件仓 var/industrial-review/）
  → 不可变 SVG（uploads/industrial-svg/<sha256>.svg）
  → 质检报告绑定 auditContentHash
  → 管理员列表/详情/修改/重质检/人工审核
  → formal-import 闸门（默认 dry-run，当前因 PROPOSED 阻断写库）
```

管理 API：`/chemistry/admin/industrial-candidates/*`  
守卫：`JwtAuthGuard` + `AdminGuard`

## 2. 状态流转

`generated` → `pending_quality_review` → `quality_checked` / `pending_human_review`  
→ `needs_revision` | `rejected` | `approved_for_import` → `imported`

规则：

- 修改题干/答案/解析/Definition → 质检与人工审核失效 → `needs_revision`
- `development_only` 人工「通过」不得进入 `approved_for_import`
- Mock 来源不得正式入库

## 3. formalAllowed 原始设计

`train-items-admin.service.ts` 中 **`formalAllowed = false` 硬编码**：

- 目的：AI 试运行题库管理 UI **禁止**宣称「可正式训练」
- **不是**可随意改 true 的开关
- 工业入库使用**独立闸门服务**，且仍尊重 `curriculum_ok` / `verify_blocked` / `ban_default_train` / `pool`
- **未**修改该硬编码

## 4. 质量报告与失效

复用 `isIndustrialQualityReportCurrent` / `auditContentHash`。  
人工审核记录 `humanReviewedAuditHash`；不一致则拦截入库。

## 5. 正式发布资格

`evaluateIndustrialFormalImportGates` 阻断：

- development_only / mock_generated
- 非 approved_for_import / 无人审通过
- 质检失败或过期 / 关键 unknown 未核验
- 案例 draft / unverified / 课程未批准
- **`SVG_DB_BINDING_PROPOSED`**（待用户确认 DB 方案）

## 6. 前端

- `ChemistryIndustrialCandidatesView.vue`
- 路由 `/settings/chemistry-industrial-candidates`
- 复用 `IndustrialFlowDiagram.vue`
- unknown 不以「通过」展示

## 7. 已知限制

- 正式写 `chem_train_items`：**未执行**（等待 SVG 绑定方案确认）
- 会话图形快照：**契约已定**，接入属 STEP_10
- 浏览器 E2E 管理页：**未执行**
