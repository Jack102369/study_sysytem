# P1-FUNC · 学生训练结果页关联解题方法展示

> **库**：`study_system`（本轮**无写库**）  
> **执行时间**：`2026-10-25`（代码 + 只读 API 验收）  
> **结果**：**API/代码 PASS**；**UI_NOT_RUN**（无真实页面操作证据）  
> **4B**：仍 **BLOCKED**  
> **语义**：`methods` = 题目**当前有效**关联（`methodsSemantics: current_item_link`），**非**答题时快照

---

## 1. 修改文件

| 文件 | 变更 |
|---|---|
| `apps/api/src/hs-math/util/session-item-view.ts` | 增加 `SessionItemMethodLabel`；`methods[]` 注入视图 |
| `apps/api/src/hs-math/train/hs-math-train.service.ts` | 批量 `loadActiveMethodsByItemIds`；会话级 `methodsSemantics` |
| `apps/web/src/api/hs-math-train.ts` | `HsMathSessionItemMethod` / `methods` / `methodsSemantics` 类型 |
| `apps/web/src/views/hs-math/HsMathTrainResultView.vue` | 「关联解题方法」标签 + `el-popover` 简介 |
| 本报告 / `PROJECT_HANDOFF.md` | 文档 |

未改：`hs-math.module.ts`（实体已注册）。未改判分/提交/学情/题库/方法数据。

---

## 2. API 字段

会话详情（`GET /hs-math/train/sessions/:id`）：

```ts
methodsSemantics: 'current_item_link'

items[].methods: Array<{
  code: string
  name: string
  summary: string   // 实体 summary；空则 ''
  isPrimary: boolean
}>
```

规则：

- 按会话 `itemId` 集合批量查关联；`is_active=1` 才返回  
- 排序：`is_primary DESC` → `sort_order ASC` → `id ASC`  
- `itemId` 空 / 无关联 → `[]`  
- 禁用方法不出现在数组中  

---

## 3. 前端展示

- 位置：关联知识点**下方**、解析**上方**  
- `el-tag`（主方法 `success`+dark；辅 `info`+plain）+ 点击 `el-popover` 显示 `summary`  
- 文案提示：「按题目当前关联展示」  
- `methods` 空则整块不渲染  

历史详情：复用同一结果页路由 → **兼容**（同一 API）。

---

## 4. 验收

### 静态 / 单元

| 项 | 结果 |
|---|---|
| `pnpm --filter api run hs-math:selftest`（P0-2/3/4） | **PASS** |

### 只读 API（已有会话 `id=49`，ADMIN）

| 项 | 结果 |
|---|---|
| HTTP | 200 |
| `methodsSemantics` | `current_item_link` |
| 单方法 0001 → `defn` | **PASS** |
| 多方法 0002 → `defn` + `domain_symmetry` | **PASS** |
| 单方法 0006 → `domain_symmetry` | **PASS** |
| 答案/解析仍返回 | **PASS** |
| user1 读 ADMIN 会话 | **404** |
| 库内 `is_active=0` 方法数 | **0**（过滤逻辑就位；无禁用样本可泄漏） |
| 题库/方法/关联/reviews/sessions 计数前后 | **不变**（`wroteDb=false`） |

### 未验证 / 限制

| 项 | 说明 |
|---|---|
| 无方法题 UI/API 实样 | 本批 12 题均有关联；代码路径返回 `[]` |
| `itemId` 为空实样 | 代码分支覆盖；当前会话无空 itemId |
| 禁用方法实样 | 库内无 `is_active=0`；过滤在 `methodsRepo.find({ isActive: true })` |
| **学生浏览器 UI** | **UI_NOT_RUN** |

---

## 5. 结论

| 分项 | 状态 |
|---|---|
| 后端 methods 字段 | **PASS** |
| 前端结果页实现 | **已落地**（UI 操作未跑） |
| 历史兼容 | **PASS**（同页同 API） |
| 数据库写入 | **无** |
| 判分影响 | **无** |
| **本轮业务** | **PASS**（API）；UI **NOT_RUN** |
| 1A-4B | **BLOCKED** |
