# 02 高一数学整体架构（审查修订版）

> 已确认前缀：后端 `apps/api/src/hs-math/`，表 `hs_math_*`，API/路由 `/hs-math`，页面 `apps/web/src/views/hs-math/`。  
> 不改化学、通用错题本、小学 `packages/math-*`。

---

## 1. 总体架构

```
apps/web/src/views/hs-math + settings/hs-math
        │ JWT Bearer
apps/api/src/hs-math (HsMathModule)
        │ TypeORM synchronize=false
MySQL hs_math_*  （init.sql + migrate_hs_math_*.sql）
```

判题：P0 仅 TypeScript 确定性逻辑，位于 `hs-math/train/grade/`。  
**不**引入 SymPy / mathjs / AI 判题。公式展示复用 `apps/web/src/utils/render-math.ts`（KaTeX）。

---

## 2. 功能分层（按阶段）

### 2.1 P0（必须交付）

| 端 | 功能 |
|----|------|
| 学生 | 菜单入口、首页（专项入口+进行中会话）、专项目录、专项训练创建/作答/提交/结果/历史、基础正确率（会话级+历史汇总） |
| 管理 | 专项分类管理、训练题 CRUD、审核批准（draft→approved/disabled）、章节种子 |

题型：`single` | `multi` | `judge` | `numeric`。

### 2.2 P1+（扩展，P0 仅预留字段/kind，不实现页面）

每日巩固、进阶、错题本/变式、知识库浏览、掌握度、AI 出题、表达式判题、解答题。

---

## 3. 后端模块（P0 目录）

```
apps/api/src/hs-math/
  hs-math.module.ts
  taxonomy/          # specialties + categories
  train/
    hs-math-train.controller.ts
    hs-math-train.service.ts
    grade/           # 四题型判题纯函数 + 单测
    dto/
    entities/
  admin/             # train-items 管理
```

`AppModule` 仅 `imports: [HsMathModule]`。  
HTTP：`hs-math/...`、`hs-math/admin/...`。

---

## 4. 前端模块（P0）

```
views/hs-math/Home|Specialty|TrainSetup|TrainSession|TrainResult|TrainHistory
views/settings/hs-math/TaxonomyView|TrainItemsAdminView
api/hs-math.ts | hs-math-train.ts | hs-math-admin.ts
components/hs-math/MathStem|MathOptionList|MathNumericInput|MathGradeTag
```

Settings 仅挂：**分类管理**、**训练题管理**（P0 不出题器/KB 页）。

---

## 5. 训练数据流（P0 定稿）

```
Admin 录入 → status=approved
Student createSession（事务：session + items 快照）
  → getSession（in_progress 脱敏：无标准答案/解析）
  → saveAnswer 覆盖 user_answer_payload
  → submit（事务+行锁：判题→写结果→status=completed）
  → getResult / listHistory（可含答案）
```

- 作答：**覆盖保存**，不建 attempts 表（P0）。  
- 错题回放：**P0 不做**；快照须足以支撑 P1 重建（见 04/07）。

---

## 6. 权限

| 接口 | Guard |
|------|-------|
| 学生 train/taxonomy 读 | JwtAuthGuard；`user.sub` |
| 管理 train-items / taxonomy 写 | JwtAuthGuard + AdminGuard |

统一响应：`{ success, data|message }`。

---

## 7. 隔离

| 对象 | 策略 |
|------|------|
| 化学 | 零改 `chemistry/**`、零共享 `chem_*` |
| 通用错题 | 不写 `error_questions` |
| 小学 packages | 不修改；P0 不依赖其实现 |
| 用户数据 | 会话查询/更新带 `user_id` |

---

## 8. 部署（强制检查项）

1. **nginx API 白名单**增加 `hs-math`（现网为正则枚举，Nest 注册不等于外网可达）。  
2. **SPA**：`/study-system/` 已有 `try_files` → 前端路由 `/hs-math` 无需新 location（若 `VITE_BASE=/study-system/`）。  
3. **pack-release**：api/web 源码进 dist 即可；无新 workspace 包则不必改拷贝逻辑；实施时核对。

---

*修订说明：明确 P0/P1 边界；目录与前缀定稿；部署检查入架构。*
