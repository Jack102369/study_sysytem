# 01 现有系统审计（高一数学设计前置）

> 审计性质：只读代码与 `db/init.sql`  
> 日期：2026-10-24  
> 原则：结论均标注路径；未找到则写「当前未发现」  
>  
> **P0 定稿与范围修正**：以 `02`–`06` 修订版及 `07_design_review.md` 为准（本文件保留审计事实，不单独描述 P0 交付清单）。

---

## 1. 项目实际结构

### 1.1 Workspace（实测）

文件：`pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

| 包 | 路径 | package.json name |
|----|------|-------------------|
| API | `apps/api` | `api` |
| Web | `apps/web` | `web` |
| 数学协议 | `packages/math-protocol` | `@study/math-protocol` |
| 数学核心 | `packages/math-core` | `@study/math-core` |

根脚本（`package.json`）：`dev` / `build` / `pack:release`。  
**差异记录**：早期分析曾写「无 packages」；当前 workspace **已包含** `packages/*`（P1-01 已落地骨架）。

### 1.2 旁路与文档

- `services/ocr`、`services/ocr-formula`：OCR，与化学训练判题无关  
- `docs/math/*`：小学数学思维专项设计（P0/P1），**不是**高一数学业务实现  
- `docs/chemistry_*`：化学内容生产/审计产物  

---

## 2. 化学后端实现分析

入口模块：`apps/api/src/chemistry/chemistry.module.ts`  
在 `apps/api/src/app.module.ts` 中 `imports: [..., ChemistryModule]`。

### 2.1 Controller / Service 对照

| 能力 | Controller | Service | 路由前缀 |
|------|------------|---------|----------|
| 专项目录 | `chemistry.controller.ts` | `chemistry.service.ts` | `chemistry` |
| KB 只读 | `kb/chem-kb.controller.ts` | `kb/chem-kb.service.ts` | `chemistry/kb` |
| KB 管理 | `kb/chem-kb-admin.controller.ts` | + `chem-kb-import.service.ts` | `chemistry/admin/kb` |
| 专项训练 | `train/chem-train.controller.ts` | `train/chem-train.service.ts` | `chemistry/train` |
| 学习首页 | `train/chem-learning-home.controller.ts` | `chem-learning-home.service.ts` | `chemistry/train`（`learning-home`） |
| 每日 | `train/chem-daily-review.controller.ts` | `chem-daily-review.service.ts` | `chemistry/train/daily` |
| 进阶 | `train/chem-advanced-train.controller.ts` | `chem-advanced-train.service.ts` | `chemistry/train/advanced` |
| 错题 | `train/chem-wrong-question.controller.ts` | `chem-wrong-question.service.ts` | `chemistry/train/wrong-questions` |
| 学情 | `train/chem-analytics.controller.ts` | `chem-analytics.service.ts` | `chemistry/train`（`analytics`） |
| 出题器 | `train/generator/local-generator.controller.ts` | `local-generator.service.ts` | `chemistry/admin/train-generator` |
| 训练题列表 | `train/generator/train-items-admin.controller.ts` | `train-items-admin.service.ts` | `chemistry/admin/train-items` |

准入：`ChemTrainEligibilityService`（formal/test 池与 `chem_train_test_grants`）。

### 2.2 训练关键方法（实测）

文件：`chem-train.service.ts`

| 方法 | 作用 |
|------|------|
| `createSession` | 选题、写 session + session_items 快照 |
| `saveAnswer` | 覆盖 `user_answer`，不判题 |
| `submit` | 幂等；`gradeAnswer`；更新计数；触发错题回放 |
| `cancel` / `listSessions` / `getSession` | 取消与查询；`requireOwnSession` |

判题：`train/chem-train-grade.ts` + `chem-formula.util.ts`（程序判题，非 LLM）。

错题：`onSessionSubmittedSafe` → `rebuildUserWrongBook` 全量回放（`chem-wrong-question.service.ts`）。

出题器：**本地模板** `LocalGeneratorService`，**运行时不调用** `DeepseekClientService`（chemistry 内仅引用 docs 白名单路径）。

### 2.3 公共依赖

- `AuthModule`、`AdminGuard`、`JwtAuthGuard`、`CurrentUser`  
- **未** import `AiReferenceModule`（化学训练不依赖 DeepSeek 客户端）

---

## 3. 化学前端实现分析

### 3.1 入口

- 菜单：`apps/web/src/layouts/AppLayout.vue` →「高一化学」`/chemistry`  
- 路由：`apps/web/src/router/index.ts`（`/chemistry/**`；管理页 `requiresAdmin`）  
- 管理菜单：`SettingsLayout.vue`（KB / generator / train-items）

### 3.2 页面（实测文件）

`apps/web/src/views/chemistry/`：

- Home / Specialty / KbHome / KbDetail  
- TrainSetup / TrainSession / TrainResult / TrainHistory  
- DailyReview / AdvancedTrainSetup  
- WrongQuestions / WrongQuestionDetail  
- Analytics  

管理：`views/settings/chemistry/*`

### 3.3 API 封装

`apps/web/src/api/chemistry.ts`、`chemistry-kb.ts`、`chemistry-train.ts`、`chemistry-train-generator.ts`、`chemistry-train-items-admin.ts`  
共用：`api/http.ts`（Bearer、401 跳转）。

### 3.4 公式渲染

| 能力 | 路径 | 说明 |
|------|------|------|
| KaTeX 文本 | `utils/render-math.ts` | `$...$` / `$$...$$` → HTML |
| 化学式上下标 | `components/chemistry/ChemFormula.vue` | **非** KaTeX，专用于化学式 |

Pinia：化学页主要本地状态；全局仅见 `stores/pet.ts`。

---

## 4. 化学数据库结构分析

权威：`db/init.sql`（约 L385–910）。  
增量：`db/migrate_chemistry_*.sql`（phase1/2、train、daily、wrong、answer_type 等）。

### 4.1 表清单（实测存在）

**目录**：`chem_specialties`、`chem_categories`  

**KB**：elements / substances(+tags,elements) / reactions(+tags,species) / experiments(+images) / formulas / concepts / knowledge_points / questions + 多类 link 表  

**训练**：`chem_train_items`、`chem_train_item_links`、`chem_train_test_grants`、`chem_train_sessions`、`chem_train_session_items`  

**错题**：`chem_wrong_items`、`chem_wrong_events`  

### 4.2 关键字段模式（摘录）

**chem_train_items**：`code` UK；`pool` formal|test；`qtype` single|judge|blank；`answer_type`；`options_json`/`answer_aliases_json`；`status` draft|approved|disabled；门控 `curriculum_ok`/`verify_blocked`/`ban_default_train`；**无 user_id**  

**chem_train_sessions**：`user_id` + FK CASCADE；`session_kind`；`daily_date`；`status`；计数与 `counts_formal_stats`；`source_wrong_item_id`  

**chem_train_session_items**：题目快照（stem/options/answer/aliases）；`user_answer`；`grade_result`；UK `(session_id,sort_order)`  

**chem_wrong_items**：UK `(user_id,item_id)`；`open|consolidating|mastered`；**无 next_review_at**  

**隔离**：公共内容无 `user_id`；学习数据有 `user_id`。

---

## 5. 权限机制（实测）

| 组件 | 路径 | 行为 |
|------|------|------|
| JwtAuthGuard | `auth/jwt-auth.guard.ts` | Bearer → `request.user`（`sub/email/role`） |
| CurrentUser | `auth/current-user.decorator.ts` | 取 `request.user` |
| AdminGuard | `auth/admin.guard.ts` | 回库校验 `role==='ADMIN'` 且未停用 |
| AiAccessService | `auth/ai-access.service.ts` | `users.ai_enabled`（化学训练主路径未用） |
| Test 池 | `chem_train_test_grants` + eligibility | 按用户授权 |

学生端：`user.sub` 传入 Service；`requireOwnSession` 校验归属。  
**当前未发现** 通用 `RolesGuard` / `@Roles()`。

---

## 6. 数学共享包现状（实测）

### 6.1 `@study/math-protocol`

- 内容：`MASP_VERSION='1.0'`、层名类型、`maspVersionSchema`（Zod 字面量信封）  
- **当前未发现**：完整 MASP Schema、表达式 AST、题型协议  

### 6.2 `@study/math-core`

- 内容：`MATH_CORE_VERSION`、re-export `MASP_VERSION`；`models/solvers/validators/generators` 仅 `.gitkeep`  
- **当前未发现**：表达式解析、求解器、判题实现  

### 6.3 被引用情况

`apps/api` / `apps/web` 中 **`@study/math` 引用：当前未发现**。

### 6.4 与「高一数学」关系

| 文档/包 | 定位 |
|---------|------|
| `docs/math/*` + packages | **小学**思维训练与 AI 动画（设计中） |
| 本目录 `docs/high_school_math/*` | **高一**必修体系训练子系统（本审计） |

**可复用**：TS 工程约定、未来可把「表达式规范化」抽到 packages（需新建模块，勿占用小学 MASP 语义）。  
**不宜直接当高一题库/判题**：包内尚无实现。

---

## 7. 可复用代码

| 类别 | 路径/能力 |
|------|-----------|
| 鉴权 | JWT / CurrentUser / AdminGuard |
| 响应 | `TransformInterceptor`、`AllExceptionsFilter` |
| 校验 | class-validator + 全局 ValidationPipe |
| HTTP 客户端 | `apps/web/src/api/http.ts` |
| KaTeX 渲染 | `apps/web/src/utils/render-math.ts` |
| 布局模式 | AppLayout 硬编码菜单；Settings + requiresAdmin |
| 化学「模式」 | 独立 Module、公共/用户分表、会话快照、submit 幂等、错题回放、每日加权抽题、学情实时聚合、Admin 挂 Settings |
| 时区工具可参考 | `chemistry/train/shanghai-date.util.ts` |
| 打包注意 | nginx 白名单；`pack-release` 不含自动打 packages |

---

## 8. 不建议复用的代码

| 项 | 原因 |
|----|------|
| `chem_*` 表与 Entity | 本体不同；规范要求独立子系统 |
| `chem-train-grade` / `chem-formula.util` | 化学式规则，非高中数学等价性 |
| `ChemFormula.vue` | 化学上下标专用 |
| `LocalGenerator` 化学模板 | 绑定 chem KB |
| 覆盖式 `saveAnswer` 若高一要「多次尝试分析」 | 化学模式无法支撑提示后正确率等（可选改进） |
| 通用 `error_questions` | 化学已证明不适合自动训练错题；高一同样独立错题表 |
| 假设 DeepSeek 可做化学式出题链路 | 实测化学出题为本地模板 |

---

## 9. 潜在风险

1. **表名前缀冲突**：小学设计使用 `math_*`；高一必须用独立前缀（建议 `hs_math_*`）。  
2. **nginx**：新前缀 `hs-math` 或 `math-hs` 需改白名单（现状无自动）。  
3. **packages 未接入 api/web**：高一若先做 Nest 内 util，需规划何时迁入 packages。  
4. **学情无 KP 掌握度**：化学已免责；高一若要掌握度须新建，勿假称已有。  
5. **判题复杂度**：表达式/集合/定义域远超化学字符串匹配；P0 必须收窄题型。  
6. **改化学代码回归**：规范禁止；高一并行 Module 即可。  

---

## 10. 项目约定摘要（实测）

| 约定 | 实际 |
|------|------|
| API 前缀 | **无** `setGlobalPrefix` |
| 成功体 | `{ success:true, data }` |
| 失败体 | `{ success:false, message }` |
| DTO | class-validator |
| TypeORM | `autoLoadEntities`，`synchronize:false`，`Repository` / QueryBuilder |
| 事务 | 如 generator `dataSource.transaction`；训练 submit 非大事务包裹错题 |
| 分页 | `page`/`pageSize`，上限各模块自限 |
| 时区 | 化学每日用上海日历工具 |
| 测试 | 化学有 `chem-formula.util.selftest.ts`；packages 用 Vitest；api/web **无**统一 jest |

---

## 11. 重要代码路径索引

```
apps/api/src/chemistry/**
apps/api/src/auth/**
apps/api/src/common/interceptors/transform.interceptor.ts
apps/api/src/common/filters/all-exceptions.filter.ts
apps/api/src/main.ts
apps/web/src/router/index.ts
apps/web/src/layouts/AppLayout.vue
apps/web/src/layouts/SettingsLayout.vue
apps/web/src/views/chemistry/**
apps/web/src/api/chemistry*.ts
apps/web/src/utils/render-math.ts
db/init.sql (chem_*)
db/migrate_chemistry_*.sql
packages/math-protocol/**
packages/math-core/**
docs/math/**
pnpm-workspace.yaml
nginx/nginx.conf
scripts/pack-release.mjs
```

---

*文档结束：01_existing_system_audit.md*
