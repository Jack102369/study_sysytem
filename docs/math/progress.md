# 数学专项进度

| 任务 | 名称 | 状态 | 日期 | 产出 |
|------|------|------|------|------|
| P0-01 | 现有系统架构分析 | 完成 | 2026-10-23 | `docs/math/00-existing-system-analysis.md` |
| P0-02 | 化学专项架构与业务链路分析 | 完成 | 2026-10-23 | `docs/math/chem-reference-analysis.md` |
| P0-03 | 小学数学思维专项最终集成架构设计 | 完成 | 2026-10-23 | `01`–`04` 架构/计划/模型/契约文档 |

## P0-01 摘要

- 基于实际代码完成 Monorepo / Nest / Vue / DB / Auth / AI / uploads / 部署分析
- 明确可复用：JWT、AdminGuard、AiAccess、DeepseekClient、attachments、化学模块边界模式
- 主要风险：nginx 路径白名单、uploads 无鉴权、DeepSeek 无超时重试、无 packages 共享层

## P0-02 摘要

- 梳理化学 Module / KB / 训练 / 错题 / 每日 / 学情 / 生成器 / 管理端与表模式
- 训练主链路：create → saveAnswer → submit(幂等) → 程序判题 → 错题回放
- 化学训练出题主路径为本地模板生成器，非在线 DeepSeek
- 化学错题与通用 `error_questions` 无关联；无 `next_review_at`，用间隔天数
- 复用分类 A/B/C/D 已写入 `chem-reference-analysis.md` §9

## P0-03 摘要

- 最终工程：`apps/api/src/math`、`apps/web` 数学页、`packages/math-core|protocol`、`apps/math-renderer`
- 冲突已记录：workspace 仅 `apps/*`、pack:release 不含 packages、nginx 无 `math`、uploads 无鉴权
- 训练：attempts 追加；模板/题目/会话快照三分离；独立错题 + next_review_at；四级掌握度
- AI 状态机禁止生成即 approved；MASP 含移多补少完整示例
- 开发顺序 P1→P7 及验收见 `02-development-plan.md`
- **未改业务代码 / DB / 配置**；不自动进入 P1
