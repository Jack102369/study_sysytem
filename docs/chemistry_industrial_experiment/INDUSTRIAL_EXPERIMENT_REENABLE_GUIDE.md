# 工业实验 · 重新启用指南

## 前提

- 模块当前默认 **关闭**（`CHEM_INDUSTRIAL_EXPERIMENT_ENABLED` 未设置或非 true）。
- 历史候选、案例、SVG、审核记录、DB 表均应仍在（停用任务禁止删除）。
- 重新启用 **不会** 自动人审、自动 formal 入库、自动开启 `INDUSTRIAL_FORMAL_REAL_PUBLISH`。

## 步骤

1. 在 `apps/api/.env`（或部署环境）设置：

   ```env
   CHEM_INDUSTRIAL_EXPERIMENT_ENABLED=true
   ```

2. **重启 API** 进程（改 env 不热更新）。

3. Web 一般无需重构建；刷新页面后会请求  
   `GET /chemistry/features/industrial-experiment`，`enabled` 应为 `true`。

4. 确认：
   - 设置 → 高一化学 → 「工业实验候选」菜单出现
   - `/settings/chemistry-industrial-candidates` 可打开（仍须 ADMIN + JWT）
   - 专项列表含「工业实验」（与 `experiment` 并列，不是其子类）

5. 人审 / 来源核验 / formal 入库仍按原闸门与 PHASE_E2-C 另批流程执行。

## 关闭

删除该变量或设为 `false`，再重启 API。前端失败时默认按关闭处理。

## 注意

- 不要把工业实验重新归入 `experiment`。
- 不要为「方便测试」把生产默认改成 `true`。
- CONDITIONALLY_ACCEPTED 不因启用而变为 ACCEPTED。
