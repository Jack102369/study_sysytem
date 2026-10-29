# 工业实验 · 全链路停用报告

| 字段 | 值 |
|------|-----|
| 任务代号 | `INDUSTRIAL_EXPERIMENT_FULL_DISABLE` |
| 报告时间 | 2026-10-29 15:40:18 +08:00 |
| 验收等级 | **CODE_LEVEL_DISABLED** · `BROWSER_PENDING` · `HTTP_NOT_VERIFIED` |
| 最终验收 | 仍为 **CONDITIONALLY_ACCEPTED**（未因停用升格 ACCEPTED） |

---

## 1. 停用原因

用户明确要求暂时不使用高一化学「工业实验」模块：前端隐藏、专属 API 禁用、抽题/训练/统计隔离；同时保留全部历史数据与代码，便于日后恢复。

## 2. 功能开关设计

| 项 | 值 |
|----|-----|
| 环境变量 | `CHEM_INDUSTRIAL_EXPERIMENT_ENABLED` |
| 默认 | **false**（未设置 / 空 / 非法值均为关闭） |
| 启用 | 仅 `true` / `1` / `yes`（大小写不敏感） |
| 权威 | 后端 `industrial-feature.config.ts` |
| 前端 | `GET /chemistry/features/industrial-experiment`；失败视为关闭 |
| 重启 | 改 env 后需**重启 API**；Web 无需因开关重构建（运行时拉取） |

未复用 DB `feature_flags`：避免本轮写库；与工业实验「默认关、显式开」一致。

## 3. 默认关闭行为

生产与开发均默认关闭；不得因 `NODE_ENV=development` 自动开启。

## 4. 后端禁用范围

- `IndustrialExperimentEnabledGuard`：工业审核 Controller 全路由 → 关闭时 **404**
- `assertChemIndustrialExperimentEnabled`：AI 变式候选、会话 SVG 读取等
- `assertIndustrialSpecialtyAllowed`：专项训练 / 专项详情 / 提高挑战按专项创建等

## 5. 通用化学 API 隔离

| 路径 | 关闭时行为 |
|------|------------|
| `listSpecialties` | 过滤 `industrial_experiment`（不影响 `experiment`） |
| `getSpecialtyByCode(industrial…)` | 404 |
| 专项训练创建 | 404 |
| 每日复习抽题 | 排除工业 specialtyId |
| 提高挑战跨专项抽题 | 排除工业；按专项创建 assert |
| 错题列表 / 复练 / 变式 | 隐藏工业错题；不抽工业题；工业变式 404 |
| 学习统计 | 专项序列与 industrialFocus 不展示工业 |
| 工业 AI 变式候选 | assert → 404 |

## 6. 前端隐藏范围

- 设置菜单「工业实验候选」：`v-if="industrialEnabled"`
- 分析页专项筛选与 12 分类区：依赖开关
- 错题详情工业 AI 按钮 / 提示：依赖开关
- 首页/专项列表：来自后端 specialties（已过滤）

## 7. 路由保护

- 路由 meta：`requiresIndustrialExperiment: true`
- `beforeEach`：拉取后端 feature；`enabled=false` → 重定向 `/settings/chemistry-train-items`

## 8. SVG 资源保护

- `/uploads/industrial-svg` 静态路径本已 403（须会话授权 API）
- 会话 SVG API 关闭时 `assertChemIndustrialExperimentEnabled` → 404
- **未删除**任何 SVG / 哈希 / 快照文件

## 9. 数据保留情况

保留：候选 JSON、案例、审核记录、revisionHistory、来源证据包、Definition、SVG、DB 表与历史训练/错题。本轮**无** DROP/TRUNCATE/批量 DELETE/正式入库/real publish。

## 10. 恢复使用方法

见 [INDUSTRIAL_EXPERIMENT_REENABLE_GUIDE.md](./INDUSTRIAL_EXPERIMENT_REENABLE_GUIDE.md)。

## 11. 实际修改文件（本任务相关）

见最终输出【14】；核心含 `industrial-feature.config.ts`、`industrial-experiment-enabled.guard.ts`、训练/每日/错题/统计/前端路由与菜单、自检与本文档。

## 12–13. 测试命令与结果

| 命令 | 退出码 | 结果 |
|------|--------|------|
| `pnpm --filter api run chem:industrial-full-disable-selftest` | 0 | **PASS** |
| `pnpm --filter api run chem:seed-selftest` | 0 | **PASS** |
| `pnpm --filter api run chem:industrial-review-export-selftest` | 0 | **PASS** |
| `pnpm --filter api run build` | 0 | **PASS** |
| `pnpm --filter web run build` | 0 | **PASS** |

## 14–16. 未执行 / HTTP / 浏览器

| 项 | 状态 |
|----|------|
| 真实管理员 JWT HTTP 负测 | **HTTP_NOT_VERIFIED**（未伪造 JWT） |
| 浏览器菜单/直链 | **BROWSER_NOT_VERIFIED** / **BROWSER_PENDING** |
| 数据库业务写入 | **无** |

## 17–19. 风险与下一步

- 历史工业会话若已知 sessionId，题目文本仍可按用户隔离读取；工业 SVG 受控读取关闭。
- 管理员题库列表仍可能显示库中工业题行（数据保留）；不可走工业候选审核页与工业专属 API。
- 下一步：用户浏览器确认隐藏；需要时按恢复指南显式开启（不自动发布候选）。
