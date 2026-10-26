# P1-FUNC-CORE-1A-3.1 · 管理员来源/方法编辑补齐与静态验收

> **阶段状态**：**PASS**（前端补齐 + Mock + web build；**非**真实写库验收）  
> **范围**：仅前端；**无**写库、**无**种子、**无**审核提交、**无**批准、**无**后端改动、**未**进入 CORE-1B  
> **库**：`study_system`（本阶段未查询/未写入；LAST_VERIFIED 不刷新）

---

## A. 执行结果

| 项 | 结果 |
|---|---|
| 阶段结论 | **PASS** |
| 20 项审计 | **完整**（见 B） |
| Mock 自测 | **PASS**（18 checks；无 HTTP 写） |
| Web build | **PASS**（vue-tsc + vite；exit 0） |
| 浏览器只读 | **NOT_RUN** |
| 数据库写入 | **无** |
| 后端改动 | **无** |

---

## B. 20 项前端功能审计（补齐前 → 补齐后）

| ID | 功能 | 文件 | 补齐前 | 补齐后 |
|---|---|---|---|---|
| A1 | 方法词典列表 | `HsMathMethodsAdminView.vue` | IMPLEMENTED | IMPLEMENTED |
| A2 | 方法新增 | 同上 | IMPLEMENTED | IMPLEMENTED |
| A3 | 方法编辑 | 同上 | IMPLEMENTED | IMPLEMENTED |
| A4 | 启用/禁用 | 同上 | PARTIAL（无禁用确认） | **IMPLEMENTED**（禁用二次确认） |
| A5 | 搜索 code/名称 | 同上 | IMPLEMENTED | IMPLEMENTED |
| A6 | 空状态 | 同上 | IMPLEMENTED | IMPLEMENTED |
| A7 | 来源类型编辑 | `HsMathSourceMethodFields.vue` + TrainItemsAdmin | IMPLEMENTED | IMPLEMENTED |
| A8 | 年/卷/题号 | 同上 | IMPLEMENTED | IMPLEMENTED（+ maxlength） |
| A9 | 出处引用 | 同上 | IMPLEMENTED | IMPLEMENTED |
| A10 | 改编说明 | 同上 | IMPLEMENTED | IMPLEMENTED |
| A11 | 核实状态 | 同上 | IMPLEMENTED | IMPLEMENTED |
| A12 | 许可状态 | 同上（含 forbidden） | IMPLEMENTED | IMPLEMENTED |
| A13 | 主方法 | 同上 | IMPLEMENTED | IMPLEMENTED |
| A14 | 辅助方法 | 同上（多选非主） | IMPLEMENTED | IMPLEMENTED |
| A15 | 方法关联保存 | TrainItemsAdmin → content-meta | PARTIAL（总是整包 PUT） | **IMPLEMENTED**（仅变更块） |
| A16 | 原子 content-meta | `putAdminHsMathTrainItemContentMeta` | IMPLEMENTED | IMPLEMENTED（强化） |
| A17 | expectedVersion / 409 | TrainItemsAdmin | PARTIAL | **IMPLEMENTED**（冲突可选重载/保留草稿） |
| A18 | 未保存保护 | 关闭确认；contentDirty 未跟踪 | PARTIAL | **IMPLEMENTED**（双脏+互斥保存） |
| A19 | 审核展示 | ReviewView | IMPLEMENTED | IMPLEMENTED（主/辅拆分） |
| A20 | 审核版本一致性 | ReviewView 并行 getById | **MISSING** | **IMPLEMENTED**（version/id 对齐门禁） |

---

## C. 已存在功能清单（CORE-1A-3 已有，本阶段复用）

- 路由 `/settings/hs-math-methods`、侧栏入口  
- 方法词典 CRUD UI 骨架、题库编辑内嵌来源/方法表单  
- API 客户端 methods / content-meta  
- format：来源/许可中文与默认兼容提示  

---

## D. 新补齐功能清单

1. `hs-math-admin-meta.ts`：diff / buildContentMetaBody / 版本合并 / 校验 / 错误提示  
2. 无变化不发送 PUT；仅变更 source 或 methods 块  
3. 保存前变化摘要确认  
4. 409 不自动覆盖；可选重载或保留草稿  
5. 题干脏与 meta 脏互斥提示  
6. 审核 panel↔getById `contentVersion`+`itemId` 一致才合并；否则隐藏 meta 并禁止审/批  
7. 方法禁用二次确认；字段 maxlength 对齐 DTO  
8. Mock 自测脚本  

---

## E. 实际修改文件

| 路径 | 变更 |
|---|---|
| `apps/web/src/utils/hs-math-admin-meta.ts` | **新增** |
| `apps/web/scripts/hs-math-p1-func-core1a31.selftest.mjs` | **新增** |
| `apps/web/src/components/hs-math/HsMathSourceMethodFields.vue` | maxlength / clearable |
| `apps/web/src/views/settings/hs-math/HsMathMethodsAdminView.vue` | 校验、禁用确认、409/权限提示 |
| `apps/web/src/views/settings/hs-math/HsMathTrainItemsAdminView.vue` | baseline、原子 body、409、脏状态 |
| `apps/web/src/views/settings/hs-math/HsMathTrainItemsReviewView.vue` | 版本合并门禁、主辅展示 |
| `docs/high_school_math/52_…md` | 本报告 |
| `docs/high_school_math/PROJECT_HANDOFF.md` | 交接 |

**未改**：`apps/api/**`、DB、`.env`、题库 TS/JSON、化学模块。

---

## F. 方法词典完整管理

列表 / 搜索 / 状态筛选 / 新增编辑 / 排序 / 启用禁用（禁用确认）/ 空态 / loading / 409 code 冲突提示 / 401·403 提示。  
**未**对本库执行真实 POST/PATCH（仅 UI 接线；本阶段验收靠 Mock + build）。

---

## G. 题目来源编辑

三类来源中文标签；核实/许可（含 forbidden）；真题字段条件展示；默认兼容警告；许可风险提示；长度与 DTO 对齐；清空→`null`。

---

## H. 主辅方法关联

多选有序；主方法 ∈ 已选；禁用不可新选、已关联可展示；空词典提示；可清空。

---

## I. content-meta 原子保存

`PUT …/content-meta`；同时改来源+方法时一次提交；仅变更块；`expectedContentVersion`；保存中防重复；成功刷新 version/来源/方法。

---

## J. expectedVersion 处理

提交带当前 `form.contentVersion`；409 提示冲突；不自动覆盖；可选重新加载。

---

## K. 未保存内容保护

关闭弹窗确认；题干脏时禁止 content-meta；meta 脏时禁止题干保存。

---

## L. 审核版本一致性

`mergeReviewPanelWithDetail`：itemId + contentVersion 一致才展示来源/方法；否则告警、禁止提交审核与正式批准、提供刷新。

---

## M. 审核工作台展示

保留题干/选项/答案/解析/KP/历史/指纹/STALE/批准确认；新增来源全字段、主/辅方法、未核实与许可风险；不把 unknown 标成 permitted、不把 unverified 标成 verified。

---

## N. 错误处理

`adminWriteErrorHint`：400/401/403/404/409；失败不清空表单；不绕过 Admin 路由守卫。

---

## O. Mock 测试

```
node apps/web/scripts/hs-math-p1-func-core1a31.selftest.mjs
# ALL PASS: 18 checks (no DB / no HTTP write)
```

**不得**将 Mock PASS 解释为真实管理员保存已验收。

---

## P. Web build

```
pnpm --filter web build  → exit 0
```

既有 chunk 体积警告，非本阶段新增阻塞。

---

## Q. 浏览器只读检查

**NOT_RUN**

---

## R. 数据库状态

未查询、未写入。沿用 2D.2：`LAST_VERIFIED=2026-10-24T16:16:02.353Z`；105/5/0；methods=0。

---

## S. 未完成事项

- 浏览器只读冒烟  
- 方法正式种子  
- 真实 content-meta / 方法 CRUD 写库验收（须另授权）  
- 正式批准 E2E  
- CORE-1B  

**已知残留风险**：若仅改来源却仍附带含「已禁用方法」的 methodIds，后端 `loadActiveMethodsOrFail` 可能 400——本阶段通过「仅变更块」规避无变化与仅来源变更路径；用户主动改方法且保留禁用关联时仍可能触发后端限制（须另开后端任务）。

---

## T. 下一阶段建议

1. 授权 → 只读浏览器冒烟 / 方法种子。  
2. 授权 → 隔离写库验收 content-meta / 方法 CRUD。  
3. 授权 → CORE-1B。  
4. 可选：后端允许「已关联禁用方法」在幂等/仅来源更新时通过校验。
