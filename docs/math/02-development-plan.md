# P0-03 数学专项开发计划

> 在现有 monorepo 上分阶段交付；每阶段结束须更新 `docs/math/progress.md` 并满足验收。  
> 顺序已按依赖与风险调整说明见 §8。

---

## 1. 阶段总览

| 阶段 | 名称 | 核心目标 |
|------|------|----------|
| P1 | 数学核心与 MASP | packages + 求解/判题 + 协议 Schema + 移多补少示例 |
| P2 | Vue 动画与 Remotion 技术验证 | SVG 播放器 POC + Remotion 单场景 POC（可无业务库） |
| P3 | 数据库与后端基础 | `math_*` DDL、MathModule 骨架、鉴权路由空壳 |
| P4 | 数学训练闭环 | 会话/尝试/快照/提示/结束/历史（无 AI 也可手录题） |
| P5 | AI 题目生产 | 模型驱动流水线 + 状态机 + 审核 |
| P6 | 视频生产任务系统 | render_jobs + Worker + 私有文件访问 |
| P7 | 复习与学情 | mistakes、mastery、复习调度、分析 API + 前端图表 |

**不自动跨阶段**；每阶段人工确认后再开下一阶段。

---

## 2. P1 数学核心与 MASP

**依赖**：P0 文档；确认 workspace 是否引入 `packages/*`（见架构 C1）。

**交付物**：

- `packages/math-protocol`：四层类型、版本常量、Zod（或确认的 schema）校验入口、动作注册表骨架
- `packages/math-core`：至少 1 个模型（移多补少）参数生成、求解、答案等价判断
- 单测：求解正确性、非法参数拒绝、MASP 示例通过 Schema
- 文档：示例 JSON（见 `04-integration-contracts.md`）

**验收**：

- `pnpm --filter @study/math-core test`（或等价）通过
- 无 Vue/Nest 依赖（package.json 检查）
- 示例「18/12 移 3 → 15/15」求解与 MASP 校验通过

**高风险**：schema 库选型；workspace 未改导致无法引用。

**回滚**：删除 packages 即可；无 DB 变更。

---

## 3. P2 Vue 动画与 Remotion 技术验证

**依赖**：P1 protocol（至少可播放静态示例）。

**交付物**：

- `components/math-animation`：加载已校验 MASP，SVG 播放/暂停/重播/步进
- `apps/math-renderer`：最小 Remotion 组合，从 JSON 渲染短视频（可 CLI）
- 记录：帧率、中文字体、与 TTS 对接可行性备忘（TTS 可 mock）

**验收**：

- Web 能播移多补少示例，不执行任意 JS 字符串
- Remotion 产出一段 mp4（本地）
- 不接入主站菜单也可（POC 页或 Story 级）

**高风险**：Remotion 与 Vue 依赖隔离；中文字体授权。

**回滚**：移除 POC 组件/renderer 包；不影响主站。

**顺序说明**：P2 在 P3 前，便于尽早暴露渲染风险；P3 不依赖完整视频。

---

## 4. P3 数据库与后端基础

**依赖**：P1 类型稳定；架构确认表名。

**交付物**：

- `db/migrate_math_p3.sql` + 回写 `db/init.sql` 中数学表（内容表为主，训练表可先建骨架）
- `apps/api/src/math/math.module.ts` 注册到 AppModule
- 健康/占位：`GET math/meta`（需 JWT）
- 实体映射 snake_case；`synchronize` 仍为 false
- **文档列出**待改 nginx 白名单（本阶段可只改 deploy example 的说明，或等联调再改——实施时须改）

**验收**：

- 迁移在空库+增量库可执行
- MathModule 启动无报错
- 无化学/通用错题代码改动

**高风险**：表过多一次迁移失败 → 可拆 migrate 文件。

**回滚**：提供 down SQL（设计要求编写，执行需确认）。

---

## 5. P4 数学训练闭环

**依赖**：P3 会话/题目/尝试表；P1 判题。

**交付物**：

- 学生 API：开始训练、提交尝试、提示、结束、历史、恢复 in_progress
- 前端：训练 Setup / Session / Result / History
- 菜单：AppLayout 增加「小学数学」入口（硬编码）
- 题目可来自种子数据（非 AI）

**验收**：

- 同一题多次 attempt 均落库且序号递增
- 可区分首次独立 / 提示后（event 或 attempt 标记）
- 重复 submit 会话幂等
- userId 隔离抽测
- 改题库后历史快照答案不变

**高风险**：状态机复杂；与化学行为差异导致产品误解。

**回滚**：功能开关 `feature_flags` 或隐藏菜单。

---

## 6. P5 AI 题目生产

**依赖**：P4（有题可训）；P1 求解；DeepseekClient 复用。

**交付物**：

- `MathDeepseekAdapter`（超时/重试/严格 JSON 解析包装，**不修改**原 Client 默认行为）
- 生成任务状态机：GENERATED → … → PUBLISHED
- 管理页：工厂 + 审核列表
- Settings 入口硬编码

**验收**：

- AI 输出从不直接写最终 numeric answer
- 未 MATH_VALIDATED 不可进题库可用池
- 无 `eval` AI 代码

**高风险**：DeepSeek 不稳定；JSON 不合格率。

**回滚**：关闭管理入口；保留手工录题。

---

## 7. P6 视频生产任务系统

**依赖**：P2 Remotion POC；P5 教学脚本/MASP；私有存储方案。

**交付物**：

- `math_render_jobs` 抢占/租约/重试
- Worker 进程与 env 文档
- Admin 下载未审核视频（鉴权流）
- 发布后拷贝/登记到 public uploads

**验收**：

- 未审核文件不可匿名 URL 直链
- 任务幂等键防重复渲染
- pack:release / 部署文档说明如何启动 Worker

**高风险**：FFmpeg/TTS 环境；pack 未含 renderer。

**回滚**：仅用 Web 动画，视频非阻塞训练。

---

## 8. P7 复习与学情分析

**依赖**：P4 尝试数据；建议 P5 有足够题目。

**交付物**：

- `math_mistakes` + `next_review_at` 规则引擎（math-core 可测）
- `math_mastery_records` 四级状态 + `rule_version`
- 每日复习 / 错题再练 API + 页面
- 学情：独立正确率、提示后、变式、间隔（基于 attempt/event）
- ECharts 页

**验收**：

- 单题正确不足以 STABLE_MASTERED
- 掌握度可按 rule_version 重算
- 历史统计用快照字段，不因 KP 改名漂移（或明确归因 note）

**高风险**：规则调参；样本不足误判。

**回滚**：隐藏学情页；复习退回简单 due 列表。

---

## 9. 阶段依赖图

```
P1 ──► P2 ──► P6
 │      │
 │      └─────────┐
 └──► P3 ──► P4 ──► P5 ──► P7
              │            ▲
              └────────────┘
```

**是否调整顺序**：相对提案，**保持** P2 在 P3 前（渲染风险前置）；P7 必须在 P4 后；P6 可与 P5 部分并行，但发布链路依赖教学脚本，建议 P5 主路径可用后再做完整 P6。

---

## 10. 跨阶段通用约束

- 每次任务先【计划】确认（`.cursorrules`）
- 不改化学、不改通用错题本业务
- DB 变更维护 `init.sql` + `migrate_*.sql`
- 相关 `tsc`/test/build
- 更新 `progress.md`
- nginx / workspace / pack 变更单列 PR/任务，禁止夹带无关重构

---

## 11. 进入 P1 前检查清单

- [ ] 确认采用 `packages/*` 并改 workspace，或临时 `apps/math-core`
- [ ] 确认 schema 库（建议 zod，需依赖审批）
- [ ] 确认 Remotion 目录名 `apps/math-renderer`
- [ ] 确认一期年级范围与移多补少为首发模型
- [ ] 确认 AI 是否共用 `ai_enabled` 开关

---

*文档：`docs/math/02-development-plan.md`*
