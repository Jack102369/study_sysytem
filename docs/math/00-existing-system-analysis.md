# P0-01 现有系统架构分析

> 任务编号：P0-01  
> 分析基准：仓库实际代码（非技术栈臆测）  
> 约束：本任务仅产出文档，未改业务代码 / 数据库 / 配置  

---

## 1. 实际工程结构

### 1.1 Monorepo / Workspace

| 项 | 实际结论 | 依据 |
|----|----------|------|
| Workspace | `pnpm-workspace.yaml` 仅包含 `apps/*` | `pnpm-workspace.yaml` |
| 根脚本 | `dev` / `dev:web` / `dev:api` / `build*` / `pack:release` | 根 `package.json` |
| `packages/` | **当前未发现** | 仓库根无 `packages` 目录 |
| 应用包 | 仅 `apps/api`、`apps/web` | `apps/` 目录列表 |
| 旁路服务 | `services/ocr`、`services/ocr-formula`（Python FastAPI，非 pnpm workspace 成员） | `services/` |
| 包管理器 | `packageManager: pnpm@10.33.0`，`engines.node >= 18` | 根 `package.json` |

### 1.2 TypeScript 配置

| 包 | 配置文件 | 说明 |
|----|----------|------|
| API | `apps/api/tsconfig.json`、`tsconfig.build.json` | Nest 构建 |
| Web | `apps/web/tsconfig.json`、`tsconfig.node.json` | `strict`、路径别名 `@/*` → `src/*` |
| 根级统一 tsconfig | **当前未发现** | 无根 `tsconfig.json` |

### 1.3 构建与发布脚本

| 脚本 | 行为 | 路径 |
|------|------|------|
| `pnpm build` | 先 api build 再 web build | 根 `package.json` |
| `pnpm pack:release` | 执行 `scripts/pack-release.mjs`，产出 `release/study-system/` | 根 `package.json`、`scripts/pack-release.mjs` |

### 1.4 目录鸟瞰（与数学相关的既有对照）

```
study_sysytem/
  apps/api/          NestJS API
  apps/web/          Vue3 前端
  db/                init.sql + migrate_*.sql
  deploy/            nginx 示例、部署相关
  nginx/             现场风格 nginx.conf
  scripts/           pack-release.mjs 等
  services/          ocr / ocr-formula
  docs/              大量化学文档；math/ 为本任务新建
  .cursorrules
  .cursor/rules/math-development.mdc
```

化学专项对照（仅作边界参考，禁止改其业务）：

- API：`apps/api/src/chemistry/`
- Web：`apps/web/src/views/chemistry/`、`apps/web/src/api/chemistry*.ts`

---

## 2. 后端模块开发规范（基于实际代码）

### 2.1 AppModule 组织

文件：`apps/api/src/app.module.ts`

- 全局 `ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] })`
- TypeORM MySQL：`autoLoadEntities: true`，**`synchronize: false`**
- 业务模块扁平 `imports`（Users / Auth / ErrorQuestions / Chemistry / …）

### 2.2 启动与横切能力

文件：`apps/api/src/main.ts`

| 能力 | 实际实现 |
|------|----------|
| 全局 API 前缀 | **当前未发现** `setGlobalPrefix`；Controller 路径即根路径（如 `auth`、`attachments`） |
| ValidationPipe | 全局：`whitelist` + `transform` + `forbidNonWhitelisted` |
| 成功响应 | `TransformInterceptor` → `{ success: true, data }`（`apps/api/src/common/interceptors/transform.interceptor.ts`） |
| 异常响应 | `AllExceptionsFilter` → `{ success: false, message }`（`apps/api/src/common/filters/all-exceptions.filter.ts`） |
| CORS | `origin: true`，`credentials: true` |
| 静态 uploads | `process.cwd()/uploads` → 前缀 `/uploads` |
| 可选挂载前端 | 若存在 `WEB_ROOT` / `../web` / `./web`，挂到 `/study-system` |

### 2.3 Controller / Service 约定（实际使用的一种）

以错题与化学训练为例：

1. Controller：`@UseGuards(JwtAuthGuard)` + `@CurrentUser() user`
2. 将 `user.sub` 作为 `userId` 传入 Service
3. Service 用 `where: { id, userId }` 或 SQL `user_id = :userId` 做隔离

样例：

- `apps/api/src/error-questions/error-questions.controller.ts`
- `apps/api/src/error-questions/error-questions.service.ts`（`findOwnedOrFail`）
- `apps/api/src/chemistry/train/chem-train.controller.ts`
- `apps/api/src/chemistry/train/chem-train.service.ts`

管理员接口叠加：`@UseGuards(JwtAuthGuard, AdminGuard)`（如 `admin-users`、`feature-flags`、化学 KB/生成器管理端）。

### 2.4 TypeORM 实体与 Repository

| 项 | 实际方式 | 依据 |
|----|----------|------|
| 实体注册 | 根配置 `autoLoadEntities: true` + 各模块 `TypeOrmModule.forFeature([...])` | `app.module.ts`、`chemistry.module.ts` |
| 表名/列名 | `@Entity('snake_table')` + `@Column({ name: 'snake_col' })`；属性 camelCase | `error-question.entity.ts`、`chem-category.entity.ts` |
| bigint 主键 | `@PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })`，TS 类型为 **`string`** | 同上 |
| Repository | `@InjectRepository(Entity) private readonly repo: Repository<Entity>` | 各 service |
| synchronize | **强制 false** | `app.module.ts` |

### 2.5 DTO 与校验

- 使用 **class-validator / class-transformer** DTO 类（非 Zod）
- 样例：`apps/api/src/auth/dto/*.ts`、`apps/api/src/error-questions/dto/error-question.dto.ts`
- Swagger 作为校验层：**当前未发现**（未作为主路径）

### 2.6 公共内容 vs 用户数据（化学已实践）

| 类型 | 是否有 `user_id` | 示例 |
|------|------------------|------|
| 公共目录/题库 | 无 | `chem_specialties`、`chem_train_items`、`chem_questions`（`db/init.sql`） |
| 用户学习记录 | 有 | `chem_train_sessions`、`chem_wrong_items` |

目录类接口可仅 JWT、不做 userId 过滤（如 `chemistry.controller.ts` 专项列表）；会话/错题必须隔离。

---

## 3. 前端模块开发规范（基于实际代码）

### 3.1 工程与自动导入

文件：`apps/web/vite.config.ts`

- 插件：`@vitejs/plugin-vue`、`@tailwindcss/vite`、`unplugin-auto-import`、`unplugin-vue-components`
- **两者均配置 `ElementPlusResolver({ importStyle: 'css' })`**
- 别名：`@` → `./src`
- `base`：`VITE_BASE` 或 `/`
- 同时 `main.ts` 仍 `app.use(ElementPlus, { locale: zhCn })`（全量注册 + resolver 并存）

说明：AutoImport **未**配置 `imports: ['vue','vue-router','pinia']` 列表；以 Element Plus resolver 为主。

### 3.2 路由

文件：`apps/web/src/router/index.ts`

| meta | 用途 |
|------|------|
| `requiresAuth` | 父路由 `/` + `AppLayout` |
| `requiresAdmin` | settings 下用户/功能开关/化学管理等 |
| `requiresAi` | ai-reference / writing-coach / knowledge-cards |

守卫：检查 `getToken()`；admin/ai 再 `fetchMe()` 校验 `role` / `aiEnabled`。

### 3.3 菜单与布局

| 布局 | 路径 | 菜单方式 |
|------|------|----------|
| 主站 | `apps/web/src/layouts/AppLayout.vue` | **模板内硬编码** `el-menu`（非独立 menu 配置文件） |
| 设置 | `apps/web/src/layouts/SettingsLayout.vue` | 硬编码侧栏；admin 项按 `role === 'ADMIN'` 显示 |

**当前未发现** 集中式路由驱动菜单配置模块。

### 3.4 Pinia / 鉴权状态

| 项 | 结论 | 路径 |
|----|------|------|
| Pinia | 已启用 | `apps/web/src/main.ts` |
| Store 文件 | 目前仅 `pet` | `apps/web/src/stores/pet.ts` |
| Auth Store | **当前未发现** | Token：`apps/web/src/utils/auth-token.ts`（localStorage `access_token`） |

### 3.5 Axios 与 API 组织

| 项 | 实际 | 路径 |
|----|------|------|
| 实例 | 单例 `http` | `apps/web/src/api/http.ts` |
| Base URL | `VITE_API_BASE_URL`（默认 `http://localhost:3000`） | `apps/web/src/utils/api-base.ts`、`.env.example` |
| 超时 | `15000` ms | `http.ts` |
| 请求头 | `Authorization: Bearer ${token}` | `http.ts` |
| 401 | 清 token 并跳转登录 | `http.ts` |
| API 文件 | `src/api/` 下**扁平**按域拆分（`chemistry.ts`、`errors.ts`…） | 无 `api/admin/` 子树 |

响应约定：后端包一层 `{ success, data }`，前端模块通常取 `response.data.data`。

### 3.6 管理员页面组织

- **无**独立 `views/admin/`
- 管理能力挂在 `/settings/*`，`meta.requiresAdmin` + SettingsLayout 侧栏过滤
- 化学管理：`apps/web/src/views/settings/chemistry/*`

### 3.7 Element Plus

- 全量 `app.use(ElementPlus)` + unplugin resolver 并存（`main.ts` + `vite.config.ts`）

---

## 4. 数据库设计规范

### 4.1 权威结构与升级

| 项 | 实际 |
|----|------|
| 权威 DDL | `db/init.sql`（建库 `study_system`） |
| 增量 SQL | `db/migrate_*.sql`（仓库内约 31 个）；**手工按序执行**（见 `DEPLOY.md`） |
| TypeORM Migrations 目录 / 自动 runner | **当前未发现** |

### 4.2 类型与命名约定（来自 init.sql + 实体）

| 约定 | 实际 |
|------|------|
| 主键 | 多数 `BIGINT UNSIGNED AUTO_INCREMENT`；实体映射为 TS `string` |
| `user_id` | `BIGINT UNSIGNED`；用户拥有表普遍有 FK → `users(id)`，多 `ON DELETE CASCADE` |
| 索引命名 | `uk_*` / `idx_*` / `fk_*` |
| JSON 列 | 已使用，如 `writing_coach_sessions.review_json`、`chem_train_items.options_json`、`user_pet_prefs.wake_word_overrides` |
| 公共教学内容 | 化学 KB/训练题等表**无** `user_id` |
| 用户学习数据 | 会话、错题事件等表**有** `user_id` |

### 4.3 synchronize

- 代码中为 `false`（`app.module.ts`）
- 规则与 `.cursorrules` 禁止改为 `true`

---

## 5. JWT 及权限复用方案

### 5.1 实际组件（均位于 `apps/api/src/auth/`）

| 组件 | 文件 | 行为 |
|------|------|------|
| 登录发 Token | `auth.service.ts` | payload：`{ sub, email, role }`，`sub` 为用户 id 字符串 |
| 校验 Guard | `jwt-auth.guard.ts` | Bearer JWT → `request.user` |
| 取当前用户 | `current-user.decorator.ts` | `@CurrentUser()` → `JwtPayload` |
| 管理员 | `admin.guard.ts` | **回库**校验 `role === 'ADMIN'` 且未停用；刷新 request.user.role |
| AI 开关 | `ai-access.service.ts` | 读 `users.ai_enabled`；`assertCanUseAi(userId)` |
| OCR 开关 | `ocr-access.service.ts` | 读 `users.ocr_enabled` |

角色常量：`apps/api/src/common/constants/biz.ts`（`ADMIN` / `USER`）。

### 5.2 当前未发现

- `RolesGuard` / `@Roles()` 装饰器体系
- `@nestjs/passport` PassportStrategy
- 独立 `AiAccessGuard`（AI 在各 Service 内调用 `AiAccessService`）

### 5.3 数学专项复用建议（最小改动）

1. 新模块 Controller：`JwtAuthGuard` + `@CurrentUser()`，`userId = user.sub`
2. 用户学习数据 Service 层强制 `userId` 条件
3. 公共教学内容表无 `user_id`（对齐化学 KB）
4. 管理端：`JwtAuthGuard` + `AdminGuard`，前端 `meta.requiresAdmin` + Settings 侧栏入口
5. 若数学 AI 能力需开关：复用 `AiAccessService.assertCanUseAi` 与用户 `ai_enabled`（或后续单独 flag，须先报告冲突方案）

---

## 6. AI 基础设施复用方案

### 6.1 实际接入

| 项 | 结论 | 路径 |
|----|------|------|
| 主客户端 | **DeepSeek** `DeepseekClientService` | `apps/api/src/ai-reference/deepseek-client.service.ts` |
| 协议 | HTTP `fetch` → `{base}/chat/completions` | 同上 `chatMessages` |
| 环境变量 | `DEEPSEEK_API_KEY` / `DEEPSEEK_BASE_URL` / `DEEPSEEK_MODEL` | `apps/api/.env.example` |
| OpenAI SDK / 通用 AiClient 抽象 | **当前未发现** | — |
| Prompt | **写在该 Service 方法内**（system/user 字符串），非独立 prompt 仓库 | 同文件 |
| JSON 解析 | 多处 `JSON.parse` + 候选抽取/LaTeX 转义修补 | 同文件 `parseItems` / `extractJsonCandidates` 等 |
| 超时 | `fetch` **未设置** `AbortSignal`/显式 timeout | `chatMessages` |
| 重试 | **当前未发现** 自动 retry 循环 | — |
| 功能开关 | Service 入口 `AiAccessService.assertCanUseAi` | writing-coach / ai-reference / knowledge-cards / pet-assistant |
| 日限额 | env：`AI_SIMILAR_DAILY_LIMIT`、`PET_CHAT_DAILY_LIMIT` | `.env.example` |

### 6.2 使用该客户端的业务

- `ai-reference`、`writing-coach`、`knowledge-cards`、`pet-assistant`
- 化学训练主路径为本地/生成器逻辑；DeepSeek 更多出现在化学**文档审计脚本**侧，而非上述 HTTP 客户端复用清单的核心

### 6.3 OCR（非 LLM）

- `services/ocr`（9100）、`services/ocr-formula`（9101）
- API：`OCR_BASE_URL` / `OCR_FORMULA_BASE_URL`；`ocr-client.service.ts`

### 6.4 数学专项复用建议

- **优先注入复用** `DeepseekClientService`（已由 `AiReferenceModule` export），或按现有模式在数学 Module import 该模块
- 仅用于题干/教学语言/辅助设计；**算数与判分不得交给模型**（见 `.cursor/rules/math-development.mdc`）
- 若需更强 Schema 校验（MASP），在数学模块新增校验层；现有 DeepSeek 客户端以启发式 JSON 解析为主，**不等同于严格 Schema**

---

## 7. 文件存储复用方案

| 项 | 实际 | 路径 |
|----|------|------|
| 存储根 | `process.cwd()/uploads` | `main.ts`、`attachments.controller.ts` |
| 上传接口 | `POST /attachments/upload`，字段名 `file`，需 JWT | `attachments.controller.ts` |
| Multer | 控制器内 `FileInterceptor` + `diskStorage`（**非**全局 `MulterModule`） | 同上 |
| 大小上限 | `ATTACHMENT_MAX_BYTES`（常量 500MB） | `common/constants/biz.ts` |
| URL | `/uploads/{filename}` 写入 attachments 表 | 同上 |
| 静态访问 | Express `useStaticAssets`；**无 JWT** | `main.ts` |
| nginx | `location ^~ /uploads/` 反代到 API | `nginx/nginx.conf`、`deploy/nginx.conf.example` |
| 其它写入 | 听力 TTS → `uploads/listening/` | `listening/piper-tts.service.ts` |
| 对象存储 S3 等 | **当前未发现**（`storage` 字段默认 local） | `attachments` |

**权限风险**：上传需登录，但已知 URL 的文件可被匿名 GET（静态托管）。数学动画大文件若敏感，需单独方案（先报告冲突）。

---

## 8. 构建与部署约束

### 8.1 发布产物

`scripts/pack-release.mjs` → `release/study-system/`，包含：

- `api/dist` + api `package.json` / `.env.example`
- `web/`（前端 build 产物）
- `db/`、`deploy/`、部分 `docs/`、`services/ocr*`

### 8.2 环境变量（摘录）

| 侧 | 关键变量 | 来源 |
|----|----------|------|
| API | `PORT`、`DB_*`、`JWT_*`、`DEEPSEEK_*`、`OCR_*`、配额 | `apps/api/.env.example` |
| Web | `VITE_API_BASE_URL`；构建还可 `VITE_BASE` | `apps/web/.env.example`、`vite.config.ts` |

### 8.3 Nginx 约束（对数学模块重要）

现网风格反代路径为**显式正则白名单**（`nginx/nginx.conf`）：

```text
auth|meta|health|subjects|...|chemistry|...
```

**若新增 `math` 或其它顶级 Controller 前缀，必须同步更新 nginx 配置**，否则生产环境会出现前端可达、API 404/进 SPA 的问题。  
模板：`deploy/nginx.conf.example` 同样需维护。

### 8.4 DB 升级

- 新环境：`mysql < db/init.sql`
- 已有环境：追加 `db/migrate_*.sql` 并回写 `init.sql`（与 `.cursorrules` / math 规则一致）

---

## 9. 数学专项建议落位

在不重建用户/权限/后台的前提下，对齐化学专项边界：

| 层 | 建议路径 | 接入点 |
|----|----------|--------|
| API Module | `apps/api/src/math/` | `AppModule.imports` 增加 `MathModule` |
| 实体/DTO | `math/**/entities`、`dto` | `TypeOrmModule.forFeature`；表名 `math_*` |
| Web 页面 | `apps/web/src/views/math/` | `router/index.ts` 挂到 `AppLayout` children |
| Web API | `apps/web/src/api/math*.ts` | 使用现有 `http.ts` |
| 菜单 | 改 `AppLayout.vue` / 管理项改 `SettingsLayout.vue` | 硬编码菜单模式 |
| 管理端 | `views/settings/math/` + `requiresAdmin` | 扩展现有 settings，不新建后台 |
| SQL | `db/init.sql` + `db/migrate_math_*.sql` | 手工升级 |
| 文档 | `docs/math/`（本文件、`progress.md`） | — |
| Remotion | **独立**应用/包（如未来 `apps/math-remotion`），勿并入 `apps/web` 运行时 | math-development 规则 |
| nginx | 白名单增加 `math`（或实际前缀） | `nginx/nginx.conf`、`deploy/*.example` |

公共教学内容与用户学习数据分表（无/有 `user_id`），对齐化学 `chem_*` 模式。

---

## 10. 已发现的技术风险

| # | 风险 | 依据 | 对数学专项影响 |
|---|------|------|----------------|
| R1 | nginx API 路径白名单，新前缀易漏配 | `nginx/nginx.conf` L65 | 上线必改 nginx，否则接口不通 |
| R2 | `/uploads` 静态无鉴权 | `main.ts` | 动画/课件若敏感需额外方案 |
| R3 | DeepSeek 无统一超时/重试 | `deepseek-client.service.ts` `chatMessages` | 长教学生成可能挂起；需模块内自行约束 |
| R4 | DeepSeek JSON 为启发式解析，非严格 Schema | 同文件多处 `JSON.parse` | MASP 必须在数学侧自建严格校验，不能假设客户端已保证 |
| R5 | 前端菜单硬编码 | `AppLayout.vue` / `SettingsLayout.vue` | 每个入口都要改布局文件，易漏 |
| R6 | DB 升级靠手工 migrate 文件 | `db/migrate_*.sql`、`DEPLOY.md` | 无自动迁移 runner；漏跑导致实体与库不一致 |
| R7 | bigint 在 TS 中为 string | 实体定义 | 前后端 ID 比较勿用 `===` number |
| R8 | 无共享 `packages/` | workspace 仅 `apps/*` | 数学与 Remotion 共享类型需另议（复制 / 新 package 需确认） |
| R9 | Axios 全局 timeout 15s | `apps/web/src/api/http.ts` | AI/渲染相关接口可能需单请求加长 timeout |
| R10 | AI 开关粒度为用户级 `ai_enabled` | `AiAccessService` | 数学 AI 与写作/参考共用同一开关；若要独立开关需先报告冲突 |

---

## 附录 A：能力存在性速查

| 能力 | 状态 |
|------|------|
| JWT + CurrentUser + AdminGuard | 存在 |
| RolesGuard / @Roles | **当前未发现** |
| 统一响应拦截器 | 存在 |
| 全局 `/api` 前缀 | **当前未发现** |
| TypeORM synchronize=false | 存在 |
| TypeORM 官方 migrations runner | **当前未发现** |
| DeepSeek 客户端 | 存在 |
| OpenAI 官方 SDK | **当前未发现** |
| Prompt 独立配置中心 | **当前未发现** |
| AI 自动重试 | **当前未发现** |
| AI fetch 超时 | **当前未发现** |
| 本地 uploads + multer | 存在 |
| 上传文件访问鉴权 | **当前未发现**（静态公开） |
| `packages/` 共享库 | **当前未发现** |
| 集中菜单配置 | **当前未发现** |
| Auth Pinia Store | **当前未发现** |

---

## 附录 B：本任务检查过的关键文件（节选）

- `.cursorrules`
- `.cursor/rules/math-development.mdc`
- `pnpm-workspace.yaml`、根 `package.json`
- `db/init.sql`、`db/migrate_*.sql`（目录级）、`DEPLOY.md`
- `apps/api/src/main.ts`、`app.module.ts`
- `apps/api/src/auth/*`（jwt-auth.guard、current-user、admin.guard、ai-access、auth.service）
- `apps/api/src/common/interceptors/transform.interceptor.ts`、`common/filters/all-exceptions.filter.ts`
- `apps/api/src/error-questions/*`、`apps/api/src/chemistry/**`（模块边界抽样）
- `apps/api/src/attachments/attachments.controller.ts`
- `apps/api/src/ai-reference/deepseek-client.service.ts`
- `apps/api/.env.example`
- `apps/web/vite.config.ts`、`src/router/index.ts`、`src/api/http.ts`
- `apps/web/src/layouts/AppLayout.vue`、`SettingsLayout.vue`
- `apps/web/.env.example`
- `nginx/nginx.conf`、`deploy/nginx.conf.example`
- `scripts/pack-release.mjs`

---

*文档结束（P0-01）。不自动进入 P0-02。*
