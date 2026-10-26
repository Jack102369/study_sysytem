# P0-03 数学专项系统总体架构

> 面向：小学 1～3 年级数学思维训练与 AI 动画教学（一期重点二年级）  
> 性质：设计文档（未改代码）  
> 依据：P0-01 / P0-02 实码分析 + 本任务核对 `pnpm-workspace.yaml`、`scripts/pack-release.mjs`、`nginx/nginx.conf`

---

## 1. 系统总体架构

```
┌─────────────────────────────────────────────────────────────────┐
│  apps/web (Vue3)                                                │
│  views/math + components/math-animation + api/math*             │
│  依赖：@study/math-protocol（类型/Schema）                        │
│  可选轻量：@study/math-core 的浏览器安全子集（展示用公式校验等）   │
└────────────┬────────────────────────────────────────────────────┘
             │ JWT Bearer  HTTPS/同源反代
┌────────────▼────────────────────────────────────────────────────┐
│  apps/api (NestJS MathModule)                                   │
│  复用 Auth / AdminGuard / TransformInterceptor / Attachments    │
│  import AiReferenceModule → DeepseekClientService（仅文案）      │
│  依赖：@study/math-core + @study/math-protocol                  │
└──────┬───────────────────────────────┬──────────────────────────┘
       │ MySQL                         │ 任务表轮询
       ▼                               ▼
┌──────────────┐            ┌──────────────────────────┐
│ MySQL8       │            │ apps/math-renderer       │
│ math_* 表    │◄───────────│ Remotion Worker + TTS    │
│ init.sql权威 │  读写任务  │ + FFmpeg（独立进程）      │
└──────────────┘            │ 依赖 math-protocol       │
                            │ 不依赖 Vue/Nest 运行时   │
                            └──────────────────────────┘
```

**不引入**第二套 FastAPI 业务后端。OCR 旁路服务与数学无关，保持现状。

---

## 2. 模块划分

| 模块 | 职责 | 运行时 |
|------|------|--------|
| `@study/math-core` | 数学模型、参数约束、确定性求解、判题、复习/掌握度纯函数规则 | Node（API / 单测）；禁止依赖 UI 框架 |
| `@study/math-protocol` | MASP 四层类型、Zod/JSON Schema、动作注册表、版本常量 | Node + 可被 Vite 打包进 Web |
| `apps/api/src/math` | Nest 模块：训练/错题/复习/学情/生成任务/渲染任务/管理 API | NestJS |
| `apps/web/.../math*` | 学生端与 Settings 管理页、SVG 交互动画 | Vue3 |
| `apps/math-renderer` | Remotion 合成、TTS、FFmpeg、Worker 抢占 | 独立 Node 进程 |

---

## 3. 模块依赖方向（禁止环）

```
math-protocol  ←── 无业务依赖（最底层）
     ▲
     │
math-core  ──► math-protocol
     ▲
     │
api/math  ──► math-core, math-protocol, Auth, AiReference(Deepseek)
web/math  ──► math-protocol （尽量不引 math-core；若引仅纯函数子集）
math-renderer ──► math-protocol （渲染层；数学真值以任务载荷已校验结果为准）
```

| 包 | 可依赖 | 禁止依赖 |
|----|--------|----------|
| math-protocol | 仅 TS / zod（或等价 schema lib，新增须确认） | Vue、React、Nest、TypeORM |
| math-core | math-protocol | Vue、React、Nest、TypeORM、Axios |
| api/math | core、protocol、现有 Nest 模块 | renderer 源码、web |
| web | protocol（+ 可选 core 浏览器安全导出） | Nest、renderer、Remotion |
| math-renderer | protocol | Nest、Vue、math-core（避免把求解塞进渲染进程；求解在 API 侧完成） |

**循环依赖规避**：协议只描述数据；核心只算数；API 编排；渲染只消费已校验 MASP。

---

## 4. 工程目录（目标）

```
packages/
  math-core/          # @study/math-core
  math-protocol/      # @study/math-protocol
apps/
  api/src/math/       # Nest MathModule
  web/src/views/math/
  web/src/components/math-animation/
  web/src/api/math*.ts
  math-renderer/      # Remotion Worker（独立包名）
docs/math/
db/init.sql + db/migrate_math_*.sql
```

### 4.1 与现状的冲突与最小改动（设计记录，本任务不改代码）

| 冲突 | 事实 | 最小改动方案（待 P1 确认后实施） |
|------|------|----------------------------------|
| C1 workspace | `pnpm-workspace.yaml` 仅 `apps/*` | 改为同时包含 `packages/*` |
| C2 包名 | 无 packages | 新增 `packages/math-core`、`packages/math-protocol`，`package.json` name 建议 `@study/math-core` / `@study/math-protocol` |
| C3 pack:release | 只拷 `apps/api/dist`、`apps/web/dist`、ocr；**不**拷 packages，也不 `pnpm deploy` | **方案优选**：Nest/Vite 构建时将 workspace 包 **打包进 dist**（api 用 tsc/webpack 编译进 bundle 或确保 dist 含编译后的依赖路径）；release 的 `api/package.json` 增加对已打包产物的自洽启动。备选：release 增加 `packages/` 拷贝 + `pnpm install --prod` 在 api 目录解析 workspace —— 改动更大 |
| C4 nginx | 白名单无 `math` | 在 `nginx/nginx.conf` 与 `deploy/nginx.conf.example` 正则中增加 `math` |
| C5 Remotion 命名 | 规则曾写 `math-remotion` | 统一为 **`apps/math-renderer`**（本设计）；与规则精神一致（独立应用） |
| C6 uploads | 静态无鉴权 | 见 §7 文件安全边界 |

**备选目录（若暂时不改 workspace）**：把 `math-core` / `math-protocol` 暂放 `apps/math-core`、`apps/math-protocol`（已被 `apps/*` 覆盖）。**推荐仍用 `packages/`**，语义更清晰，但必须先改 workspace + 打包策略。

---

## 5. 运行时关系

1. 学生打开 `/math` → Vue 调 `math/*` API（JWT）。  
2. 训练：API 用 math-core 出题/判题；尝试写入 `math_answer_attempts`。  
3. 提示/动画：API 返回教学脚本 + 已校验 MASP；Web SVG 播放。  
4. AI 出题：API 调 Deepseek **仅生成题干文案**；答案由 math-core 求解；状态机不直接 PUBLISHED。  
5. 视频：管理员触发 → `math_render_jobs` → Worker 抢占 → 输出到受控目录 → 审核后发布到可公开路径。

---

## 6. 安全边界

| 边界 | 策略 |
|------|------|
| 身份 | JWT `CurrentUser.sub` 为唯一 userId 来源 |
| 管理 | `AdminGuard`；前端 `requiresAdmin` |
| AI | `AiAccessService`（若数学 AI 功能需开关）；DeepSeek 不算数 |
| 判题 | 仅 math-core；禁止 `eval` AI 代码 |
| MASP | protocol Schema 校验失败则拒绝 |
| 文件 | 未审核/私人文件 **不得** 放公开 `/uploads`；见 §7 |
| 化学/通用错题 | 不改；数学独立错题表 |

### 7. 文件访问（uploads 无鉴权的最小方案）

| 类别 | 存放 | 访问 |
|------|------|------|
| 公共已发布视频 | 例如 `uploads/math/public/{assetId}.mp4` 或 CDN | 可走现有 `/uploads` 静态 |
| 未审核渲染产物 | `storage/math/private/renders/{jobId}/`（**api cwd 外或非静态挂载目录**） | 仅 `GET math/admin/videos/:id/download` + AdminGuard 流式输出 |
| 用户私人学习文件 | `storage/math/private/users/{userId}/...` | `GET math/files/...` + JwtAuthGuard 且校验归属 |

**最小改动**：不改造全局 uploads 鉴权；数学敏感文件绕开 `useStaticAssets('/uploads')`。

---

## 8. 部署架构

```
[Nginx]
  /study-system/     → 静态 Web
  /uploads/          → API 静态（仅公开资源）
  /(…|math)(/|$)     → API :3000   ← 需改白名单
[API :3000]          → MySQL；写 render_jobs
[math-renderer]      → 轮询 MySQL；读 private 目录；写产物
[可选 TTS/FFmpeg]    → 本机二进制（env 配置）
```

Worker 与 API **同机或内网**；Worker **不**对外暴露端口（由 API 管理任务）。

---

## 9. 关键技术决策

| # | 决策 | 理由 |
|---|------|------|
| D1 | 与化学并列独立 Module，不复用 chem 表 | P0-02；本体不同 |
| D2 | 作答尝试表追加，禁止覆盖 | 化学覆盖模式无法支持提示后/独立正确率 |
| D3 | 错题独立 `math_mistakes`，不改通用错题本 | P0-02 结论 |
| D4 | 掌握度四级 + 规则版本可重算 | 化学无 KP 掌握度 |
| D5 | AI 流水线状态机，禁止生成即 approved | 化学生成器弱点 |
| D6 | Remotion 独立 Worker + MySQL 任务表 | 规则 14；一期不强制 Redis |
| D7 | packages 共享 + 须改 workspace/打包 | 现状不支持自动集成 |
| D8 | 一期菜单硬编码进 Layout | 避免全局菜单重构 |
| D9 | DeepSeek 复用 export，数学侧封装 Adapter | 不改 DeepseekClient 行为；超时/Schema 在 Adapter 增强 |

---

## 10. 与化学专项边界

| 可借鉴 | 禁止 |
|--------|------|
| Module 边界、公共/用户分表、会话快照思想、Settings 管理挂载、AdminGuard | 改 chem 代码/表；复制公式判题；复制覆盖作答；假设有 KP 掌握度 |

---

*文档：`docs/math/01-architecture.md`*
