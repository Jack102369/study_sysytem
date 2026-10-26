# P1-FUNC-CORE-1A-2D.2 · 修复版 API 部署与真实 MySQL 幂等回归验收

> **阶段状态**：**PASS**  
> **库**：`study_system`  
> **runId**：`20261024161557_bf70`  
> **前缀**：`HS_MATH_CORE1A2D2_IT_20261024161557_bf70_`  
> **LAST_VERIFIED**：`2026-10-24T16:16:02.353Z`（UTC）  
> **脚本**：`apps/api/src/hs-math/integration/hs-math-p1-func-core1a2d2-mysql-it.mjs`  
> **结果 JSON**：`db/backups/_core1a2d2_it_20261024161557_bf70.json`

---

## A. 执行结果

| 项 | 结果 |
|---|---|
| 阶段结论 | **PASS** |
| 汇总 | PASS **107** / FAIL **0** / NOT_RUN **0** |
| API 身份确认 | **PASS** |
| 编译 | **PASS** |
| 安全重启 | **PASS**（20052 → **11544**） |
| /health | **PASS** |
| PATCH / KP / methods / content-meta 幂等 | **PASS** |
| 真实变化升版 / 指纹 / STALE | **PASS** |
| 并发 / 回滚 / 权限 | **PASS** |
| 清理 | **PASS**（无 CLEANUP_BLOCKED） |
| 原有 110 题保护 | **PASS**（hash 一致） |
| 其他模块 | **PASS** |
| 正式批准 / 方法种子 / 迁移 | **未执行** |

---

## B. 用户授权范围

确认本地 API 身份后部署/重启修复版；仅创建 `HS_MATH_CORE1A2D2_IT_` 临时记录验证幂等/版本/指纹/并发；测试后清理。  
**未扩大**：未迁移、未改 `.env`、未第二库、未批准正式题、未种子、未改其他模块、未杀全局 node。

---

## C. API 重启前后 PID

| 项 | 值 |
|---|---|
| 端口 | **3000** |
| 旧 PID | **20052** |
| 旧命令 | `node --enable-source-maps dist/main.js` |
| 身份 | 本仓库本地开发 API（与 2C 同源启动方式；`/health` db=ok；非生产迹象） |
| 停止 | `Stop-Process -Id 20052`（仅该 PID） |
| 新 PID | **11544**（Cursor 后台 shell 父进程 17292） |
| 新 cwd | `apps/api` |
| 新命令 | `node --enable-source-maps dist/main.js` |
| 新健康 | `GET /health` → 200 `{"app":"api","db":"ok"}` |

---

## D. 编译结果

| 项 | 值 |
|---|---|
| 命令 | `pnpm --filter api build` |
| 退出码 | **0** |
| dist 核验 | `trainItemContentSnapshotsEqual` / `knowledgePointLinkPlansEqual` / `methodLinkPlansEqual` / `sourceFieldsEqual` 均在 `hs-math-admin-train-items.service.js` |

---

## E. 数据库名称

`study_system`（`SELECT DATABASE()`）。

---

## F. 测试 runId

`20261024161557_bf70`  
（中途试跑 `fd4d` fetch-failed 无写；`7d66` 中断残留方法已按精确前缀安全清理；`0453` 仅 D9 用例误判后已用修正脚本重跑。）

---

## G. 测试前基线

| 指标 | 值 |
|---|---|
| 题目 | **110**（105 draft / 5 disabled / 0 approved） |
| reviews / methods / links | **0 / 0 / 0** |
| sessions / session_items | **39 / 195** |
| item_kps | **170** |
| parity | 25 · 16/7/2 |
| chem_specialties | **12** |
| 基线 hash | `e1053910a9c107385eee9ab1d1343fee08a38c12fa02a15ed6b19f0e8136f0bf` |

---

## H. PATCH 测试结果

| 用例 | 结果 |
|---|---|
| A1–A6 相同字段不升版 | **PASS** |
| A7 difficulty 变 → +1 + 指纹变 | **PASS** |
| A8 多字段变 → 只 +1 | **PASS** |
| A9 重复 A8 不升版 | **PASS** |
| A10 expectedVersion 过期 409 | **PASS** |

---

## I. KP 测试结果

| 用例 | 结果 |
|---|---|
| B1 首次关联 +1 | **PASS** |
| B2 相同计划不升版且关联未重建（max id 不变） | **PASS** |
| B3/B4/B5/B6 同计划/换主/增减 | **PASS** |
| B7 顺序变 +1；B8 重复不升版 | **PASS** |
| B9 409；B10 非法主 KP 回滚 | **PASS** |

---

## J. methods 测试结果

| 用例 | 结果 |
|---|---|
| C1 首次 +1；C2 相同不升版且关联未重建 | **PASS** |
| C3–C6 换主/增减 | **PASS** |
| C7 方法改名：题 version/指纹不变 | **PASS** |
| C8/C9 拒绝无脏写；C10 409 | **PASS** |

---

## K. content-meta 测试结果

| 用例 | 结果 |
|---|---|
| D1 来源+方法只 +1；D2 相同不升版 | **PASS** |
| D3–D7 仅来源/仅方法/双侧变化 | **PASS** |
| D8 非法 method 回滚；D9 非法来源（显式清空出处）400 | **PASS** |
| D10 409 | **PASS** |

---

## L. 指纹测试结果

相同 PATCH/methods/content-meta：指纹不变。真实修改：指纹变化。**PASS**

---

## M. 审核 STALE 结果

IT 审核 → 无变化保存仍有效 → 真实改 analysis 后 `reviewIsStale=true`。**PASS**  
未批准任何题；未改正式审核。

---

## N. 并发测试结果

| 场景 | 结果 |
|---|---|
| 两相同 PATCH / methods / KP / content-meta | **PASS**（可双 200；**version 不额外升**） |
| PATCH∥KP 不同变更同 expectedVersion | **PASS**（一 200 / 一 409；最终 +1） |
| methods∥content-meta | **PASS**（一 200 / 一 409） |

---

## O. 事务回滚结果

非法 method / 非法来源：关联与 version 不变。**PASS**

---

## P. 权限结果

匿名 / 普通用户写拒绝。**PASS**

---

## Q. 测试数据清理

按 runId 前缀：reviews → item_methods → item_kps → items → methods。  
残留：**0**。CLEANUP_BLOCKED：**无**。

---

## R. 测试后数据保护

110 题关键字段 hash 与基线相同；reviews/methods/links/sessions/item_kps 一致。**PASS**

---

## S. 其他模块保护

`chem_specialties=12`；approved=0。**PASS**

---

## T. 未执行项目

正式批准成功路径、方法正式种子、CORE-1A-3/1B、生产/nginx 操作 → **NOT_RUN**

---

## U. 风险与未完成项

1. 同仓库可能仍有未占 3000 的 watch 进程（本阶段未杀）。  
2. 管理端 UI / 方法种子仍待授权。  

---

## V. 下一阶段建议

1. 管理端来源/方法/难度 UI。  
2. 可选方法词典种子。  
3. 另授权后再做正式批准端到端。  
4. **不**进入 CORE-1A-3 / CORE-1B（未授权）。
