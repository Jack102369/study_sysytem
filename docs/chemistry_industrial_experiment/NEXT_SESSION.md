# 工业实验 · NEXT_SESSION

**更新：** 2026-10-29 15:40:18 +08:00（最后更新）

## 当前状态

**工业实验模块已全链路停用（代码级）**

| 项 | 值 |
|----|-----|
| 任务 | `INDUSTRIAL_EXPERIMENT_FULL_DISABLE` |
| 开关 | `CHEM_INDUSTRIAL_EXPERIMENT_ENABLED` 默认 **false** |
| 验收等级 | `CODE_LEVEL_DISABLED` · `BROWSER_PENDING` · `HTTP_NOT_VERIFIED` |
| 系统验收 | 仍为 **CONDITIONALLY_ACCEPTED**（未升格） |
| 决策 | D052 |

## 数据保留

候选批次、案例、审核记录、来源证据包、SVG、DB 表与历史训练/错题均**保留**；代码未删。

## 恢复方式

见 `INDUSTRIAL_EXPERIMENT_REENABLE_GUIDE.md`：设 `CHEM_INDUSTRIAL_EXPERIMENT_ENABLED=true` → **重启 API**。启用不自动发布候选。

## 停用前阶段（冻结）

POST_STEP_13 · PHASE_E2-B7 COMPLETED；E2-B6 PART B 仍 `HUMAN_BROWSER_REVIEW_PENDING`；E2-C 未批。

## 尚未执行

- 浏览器确认菜单/直链隐藏（BROWSER_PENDING）
- 真实管理员 JWT 对工业 API 的 404 负测（HTTP_NOT_VERIFIED）
- PART B 人审 / 外部多模型审核 / E2-C（模块开启后另议）

## 报告

- `INDUSTRIAL_EXPERIMENT_DISABLE_REPORT.md`
- `INDUSTRIAL_EXPERIMENT_REENABLE_GUIDE.md`

## 下一步

1. 用户刷新前端，确认工业入口不可见、直链跳转安全页。  
2. 需要再用时按恢复指南开启。  
3. 开启后的人审/入库仍须另批；禁止代审、开 real publish、自动 commit。

## 可复制提示词

```
高一化学工业实验当前已停用（CHEM_INDUSTRIAL_EXPERIMENT_ENABLED 默认 false）。

请先阅读 NEXT_SESSION.md、INDUSTRIAL_EXPERIMENT_DISABLE_REPORT.md、INDUSTRIAL_EXPERIMENT_REENABLE_GUIDE.md。

不要删除数据/代码；不要升格 ACCEPTED；不要自动 commit；不要开 real publish。
等我指定：浏览器验收停用 / 重新启用 / 或其他任务。
```
