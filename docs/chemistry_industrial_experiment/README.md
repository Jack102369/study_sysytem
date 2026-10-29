# 高一化学 · 工业实验（Industrial Experiment）

> 开发管理文档入口。业务功能尚未开发；本目录用于进度管理、技术决策与跨会话上下文恢复。

## 项目定位

| 项 | 内容 |
|----|------|
| 所属模块 | 高一化学 |
| 专项名称 | 工业实验 |
| 专项 code | `industrial_experiment` |
| 级别 | 第 13 个一级专项（与 `experiment` 同级） |
| 性质 | 书面化学题目训练（非真实工业操作实训） |

### 与「化学实验」专项边界

- **experiment（化学实验）**：实验室场景——仪器、操作、气体制备、现象、安全、方案。
- **industrial_experiment（工业实验）**：工业生产背景——流程识读、原料处理、制备、反应原理与条件、分离提纯、装置分析、产率计算、资源循环、环保、综合分析。

## 文档索引

| 文件 | 用途 |
|------|------|
| [DEVELOPMENT_PROGRESS.md](./DEVELOPMENT_PROGRESS.md) | **进度唯一总账** |
| [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) | 分步开发路线（STEP_00–STEP_13） |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 架构说明（现状 / 目标 / 待确认） |
| [ARCHITECTURE_ANALYSIS.md](./ARCHITECTURE_ANALYSIS.md) | **STEP_01 真实仓库分析报告（证据级）** |
| [CATEGORY_DESIGN.md](./CATEGORY_DESIGN.md) | 工业实验 12 个二级分类正式设计 |
| [INDUSTRIAL_CASE_MODEL.md](./INDUSTRIAL_CASE_MODEL.md) | 工业案例领域模型（STEP_04） |
| [INDUSTRIAL_DIAGRAM_PROTOCOL.md](./INDUSTRIAL_DIAGRAM_PROTOCOL.md) | 流程图 JSON 协议（STEP_05，schema 1.0） |
| [cases/](./cases/) | 文件级候选案例 JSON（draft，非正式 KB） |
| [diagrams/](./diagrams/) | 流程图协议示例 JSON（structure-only） |
| [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) | 数据库约束与待确认项 |
| [DECISIONS.md](./DECISIONS.md) | 架构决策记录（ADR） |
| [TEST_REPORT.md](./TEST_REPORT.md) | 测试与验收记录 |
| [NEXT_SESSION.md](./NEXT_SESSION.md) | **新对话上下文恢复（必读）** |
| [steps/](./steps/) | 各步骤详细记录 |

## 技术栈（仓库约定）

- 前端：Vue3 + Vite + TypeScript + Element Plus + Pinia + Vue Router + Axios + ECharts
- 后端：NestJS + TypeScript + TypeORM + MySQL8 + JWT + bcrypt + multer
- Monorepo：pnpm workspace（`apps/web`、`apps/api`）
- 数据库权威结构：`db/init.sql`（禁止 TypeORM `synchronize=true`）
- 业务数据按 `user_id` 隔离

## 核心原则（摘要）

1. 优先复用现有高一化学架构、训练题库、训练会话、错题体系与知识库。
2. 不建立平行工业训练系统；不破坏原有 12 个化学专项；不修改高一数学业务。
3. 工业流程图：结构化 JSON → 程序生成 SVG；不信任 AI 原始 SVG。
4. AI 生成内容须经质量检查与管理员审核后才能进入正式题库。
5. 每次只执行明确指定的 STEP；所有新文件由 Cursor 自动创建。

## 当前状态

以 [DEVELOPMENT_PROGRESS.md](./DEVELOPMENT_PROGRESS.md) 与 [NEXT_SESSION.md](./NEXT_SESSION.md) 为准。  
STEP_00–STEP_05 已完成：专项/分类 + 案例模型 + 流程图协议 1.0（SVG/题目尚未开发；案例与图均为文件级草稿）。

## Cursor 规则

`.cursor/rules/industrial-experiment.mdc` —— 工业实验相关任务强制阅读本目录进度/决策/恢复文档。
