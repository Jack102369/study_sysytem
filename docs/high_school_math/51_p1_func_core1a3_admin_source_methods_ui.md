# P1-FUNC-CORE-1A-3 · 管理端来源 / 方法词典 / 审核展示 UI

> **阶段状态**：**PASS**（前端静态验收）  
> **范围**：仅前端；**无**写库、**无**迁移、**无**方法正式种子、**无**正式批准、**无**后端改动、**未**进入 CORE-1B  
> **库**：`study_system`（本阶段未写库；题库统计沿用 2D.2，未复验）

---

## A. 结论

| 项 | 结果 |
|---|---|
| 阶段结论 | **PASS** |
| 后端改动 | **无** |
| 写库 / 种子 / 批准 | **未执行** |
| Web `vue-tsc` + `vite build` | **PASS**（exit 0；~44s） |
| 浏览器只读冒烟 | **NOT_RUN**（未启动本地登录会话验收） |

---

## B. 用户授权范围

管理员 UI：方法词典 CRUD 页、题目编辑来源/方法（content-meta）、审核页只读展示来源与方法。  
**禁止越界**：不改后端、不写库、不种子、不批准、不进 CORE-1B。

---

## C. 交付清单

### C.1 API 客户端（既有契约封装）

- `apps/web/src/api/hs-math-admin.ts`  
  - 类型：`HsMathSource*`、`HsMathAdminMethod`、`methods` on train item  
  - `list/create/update` methods；`put …/content-meta`；`put …/methods`

### C.2 展示文案

- `apps/web/src/utils/hs-math-format.ts`  
  - `sourceTypeLabel` / `sourceVerificationLabel` / `sourceLicenseLabel`  
  - `isDefaultSourceCompat` / `sourceLicenseRiskHint`

### C.3 组件与页面

| 路径 | 作用 |
|---|---|
| `components/hs-math/HsMathSourceMethodFields.vue` | 来源 + 方法多选/主方法表单块 |
| `views/settings/hs-math/HsMathMethodsAdminView.vue` | 方法词典管理（ADMIN） |
| `views/settings/hs-math/HsMathTrainItemsAdminView.vue` | 编辑弹窗：独立「保存来源与方法」→ `content-meta`；与题干保存分离；`expectedContentVersion`；脏状态关闭确认 |
| `views/settings/hs-math/HsMathTrainItemsReviewView.vue` | 审核详情并行 `getById` 只读展示来源/方法/默认兼容警告 |

### C.4 路由与菜单

- 路由：`/settings/hs-math-methods` → `settings-hs-math-methods`
- 设置侧栏：高一数学 →「解题方法词典」

---

## D. 行为要点

1. **双保存**：题干/答案/知识点 ≠ 来源/方法；后者走 `PUT …/content-meta`。  
2. **默认来源 UI 明示**：原创 + 未核实 + 许可未知 ≠ 已核实原创。  
3. **方法可空**：未关联方法允许展示为空。  
4. **审核页**：review panel 不含来源方法 → 只读 `getAdminHsMathTrainItem`；不改审核/发布逻辑。  
5. **方法词典空表可用**：可手工新增；正式种子须另授权。

---

## E. 未做 / 待授权

- 方法词典正式种子  
- 正式批准端到端  
- 浏览器登录只读冒烟（可选）  
- CORE-1B

---

## F. 编译

```
pnpm --filter web build
# vue-tsc --noEmit && vite build → exit 0
# ✓ built in 27.94s（总耗时约 44s）
```

---

## G. 相关报告

| 报告 | 路径 |
|---|---|
| 本报告 | `docs/high_school_math/51_p1_func_core1a3_admin_source_methods_ui.md` |
| 上一阶段 2D.2 | `docs/high_school_math/50_p1_func_core1a2d2_mysql_idempotency_acceptance.md` |
| 交接 | `docs/high_school_math/PROJECT_HANDOFF.md` |
