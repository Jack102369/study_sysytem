# P1-FUNC-CORE-1A-2C · 新版 API 本地部署/重启与只读冒烟验收

> **阶段状态**：PASS  
> **库**：`study_system`（本阶段无业务写）  
> **LAST_VERIFIED**：`2026-10-24T07:28:09.859Z`（UTC）

---

## A. 执行结果

| 项 | 结果 |
|---|---|
| 阶段结论 | **PASS** |
| 进程身份确认 | **PASS**（本地 Cursor 终端启动的 `dist/main.js`） |
| 编译 | **PASS**（`pnpm --filter api build` exit 0） |
| 重启 | **PASS**（仅停止确认 PID；新进程监听 3000） |
| /health | **PASS**（200） |
| 匿名权限 | **PASS**（401） |
| 管理员只读 | **PASS** |
| 学生只读 | **PASS** |
| 其他模块只读冒烟 | **PASS**（有限 GET） |
| 数据库不变 | **PASS** |
| 写库 IT / 种子 / 批准 | **NOT_RUN** |

---

## B. 用户授权范围

授权：确认本地 API 身份后部署/重启本地开发 API，并只读冒烟。

**未扩大**：未动生产/nginx/MySQL、未改 `.env`、未写库、未种子、未批准、未杀全局 node。

---

## C. 原 API 进程身份

| 项 | 值 |
|---|---|
| 端口 | **3000** |
| 原 PID | **16220** |
| 进程 | `node.exe` |
| 启动参数 | `node --enable-source-maps dist/main.js` |
| 父进程 | PID **15212** `powershell.exe`（Cursor Agent 临时脚本） |
| 创建时间 | 2026-10-24 19:28:32 |
| 项目归属 | 工作目录为 `apps/api`；命令为相对 `dist/main.js`；属本仓库本地开发实例 |
| 生产迹象 | **无** |
| 重启前健康 | `GET /health` → 200；`{"app":"api","db":"ok"}` |
| 重启前版本证据 | 旧 dist **无** `source_type` / methods controller；`GET /hs-math/admin/methods` → **404** |

另有本仓库 `pnpm … api nest start --watch`（PID 25576）**未占用 3000**（此前端口被 16220 占用）；本阶段**未**停止该进程。

---

## D. 编译结果

| 项 | 值 |
|---|---|
| 命令 | `pnpm --filter api build` → `nest build` |
| 退出码 | **0** |
| DB 写 | **无** |
| 产物核验 | `dist/.../hs-math-admin-methods.controller.js` 存在；entity 含 `source_type` |

---

## E / F. 重启前后 PID

| 项 | 值 |
|---|---|
| 重启前 PID | **16220** |
| 停止方式 | `Stop-Process -Id 16220`（二次校验仍为 3000 监听者且 cmdline 含 `dist/main.js`） |
| 重启后 PID | **20052** |
| 启动方式 | `node --enable-source-maps dist/main.js`（cwd=`apps/api`，与原方式一致） |
| 新监听 | 3000 → PID 20052 |
| 新健康 | `GET /health` → **200** |

---

## G. 启动方式

本地生产式启动（非 watch）：`node --enable-source-maps dist/main.js` @ `apps/api`。

---

## H. /health

```json
{"success":true,"data":{"app":"api","db":"ok"}}
```

HTTP 200。

---

## I. 匿名权限测试

| 接口 | 结果 |
|---|---|
| `GET /hs-math/admin/methods` | **401** PASS |
| `GET /hs-math/admin/train-items` | **401** PASS |
| `GET /hs-math/admin/train-items/review-queue` | **401** PASS |
| 响应无 JWT/DB 密码泄露 | PASS |

---

## J. 管理员只读接口

使用对已有 `ADMIN` 用户（id=2）本地签发的短时 JWT（**未** POST `/auth/login`；报告不收录 token）。

| 接口 | 结果 |
|---|---|
| `GET /hs-math/admin/methods` | 200；`items=[]` |
| `GET /hs-math/admin/train-items?page=1&pageSize=5` | 200；有数据 |
| `GET /hs-math/admin/train-items/:id`（draft `HSMA-RJA-CH01-0001`） | 200；`sourceType=original`；`unverified`；`unknown`；`methods=[]` |
| `GET …/review-queue` | 200 |
| `GET …/:id/review-panel` | 200 |
| `GET /hs-math/admin/specialties` | 200 |
| `GET /hs-math/admin/knowledge-points` | 200 |

---

## K. 学生只读接口

对已有 `USER`（id=1）本地签发 JWT。

| 接口 | 结果 |
|---|---|
| `GET /hs-math/specialties` | 200 |
| `GET /hs-math/home` | 200 |
| `GET /hs-math/train/sessions` | 200 |
| `GET /hs-math/train/analytics` | 200 |
| draft 未批准进正式池 | 当前 approved=0；未创建会话；列表/学情正常空或历史只读 |

---

## L. 其他模块只读回归（有限）

| 接口 | 结果 |
|---|---|
| `GET /auth/me` | 200 |
| `GET /chemistry/specialties` | 200 |
| `GET /chemistry/train/analytics` | 200 |

**说明**：仅为冒烟，**不是**化学模块全面回归 PASS。

---

## M. 数据库前后基线

| 指标 | 前 | 后 |
|---|---|---|
| 题目总数 | 110 | 110 |
| draft/disabled | 105/5 | 105/5 |
| approved | 0 | 0 |
| reviews | 0 | 0 |
| methods / links | 0 / 0 | 0 / 0 |
| sessions / items | 39 / 195 | 39 / 195 |
| item_kps | 170 | 170 |
| parity 16/7/2 | ✓ | ✓（冒烟前核对） |
| chem_specialties | 12 | 12 |

**结论**：本阶段无业务数据变化。

---

## N. 未执行的写库测试

全部 **NOT_RUN**：方法创建、methods PUT、content-meta、来源变更、审核写入、批准、导入 confirm、并发 IT、方法种子。

---

## O. 异常与风险

1. 同仓库仍存在未占 3000 的 `nest start --watch`；未杀，以免越权；若日后抢端口需人工协调。  
2. 管理员/学生 JWT 为本地 HMAC 签发（与仓库既有 smoke 相同做法），非浏览器登录态。  
3. 新 API 功能**写路径**尚未验收。

---

## P. 下一阶段建议

1. 授权方法词典种子（可选）+ 管理 UI。  
2. 授权写库 IT（methods / content-meta / 许可门禁）。  
3. 勿在未授权下批准 draft。

---

## 附录

| 动作 | 说明 |
|---|---|
| 业务代码 | **未改** |
| 临时冒烟脚本 | 已删除 |
| 本报告 | `docs/high_school_math/46_p1_func_core1a2c_api_smoke_acceptance.md` |
