# P1-0D.1 正式题库批量导入验收与安全加固

日期：2026-10-24  
数据库：`study_system`（唯一业务库）  
范围：`hs_math_*` 导入链路；不改 Schema、不迁库、不动 chemistry / 错题本 / 小学数学包。

## 1. Token 安全审计

| 项 | 结论 |
|----|------|
| 密钥来源 | 复用现有 `JWT_SECRET`（ConfigService，非启动随机、非硬编码默认值） |
| 派生 | HMAC-SHA256，key = `` `${JWT_SECRET}:hs-math-import-v1` `` |
| 跨实例 | 各 API 实例读同一 `.env` 中的 `JWT_SECRET` 即可验签 |
| 重启后 | 未过期令牌仍可验证（无进程内密钥） |
| 绑定 | `uid`（管理员 JWT sub）+ 内容哈希 + `exp` + `nonce` |
| 比较 | `crypto.timingSafeEqual` |
| 内容哈希 | `stableStringify` 规范化后 SHA-256，降低键序抖动 |
| 篡改 items | 哈希不匹配 → 拒绝 |
| 跨管理员 | uid 不匹配 → 拒绝 |
| 过期 | `exp` 检查 |
| 超长 token | 上限 4096 字符 |
| ADMIN | Controller 层 `JwtAuthGuard` + `AdminGuard` |
| 日志 | 不打印密钥 / 完整 JWT |

**边界**：不新增 `.env` 项；令牌安全性依赖 `JWT_SECRET` 强度与保密。进程内 `nonce` Map 仅为同进程防重复辅助，**不是**跨实例持久化 exactly-once 存储。

## 2. 幂等保证边界

| 场景 | 行为 |
|------|------|
| 相同 token + 相同 items 再次 confirm | 内容指纹一致 → `mode=idempotent`，不新建题/KP |
| 相同 code、不同题干/答案/KP | `409` 内容不一致，拒绝 |
| 部分 code 已存在 | 整批冲突，不写入其余题 |
| preview 后他人占用 code | preview 阶段 `CODE_EXISTS`；confirm 阶段部分存在则冲突 |
| 导入后改 draft 再旧 token confirm | 内容指纹不一致 → 冲突 |
| 双实例/并发同一批 | 唯一约束 + 事务回滚；对端已完整写入且内容一致时返回幂等成功 |
| 跨实例持久化 exactly-once | **不宣称**；无导入批次表 / Redis |

比对字段：code、章节/小节 code、题型、难度、题干、规范化 options/答案协议、解析、KP 集合（排序）、主 KP、pool=formal。

## 3. 事务与并发

- confirm 使用 `dataSource.transaction`；题目与 `hs_math_train_item_kps` 同一事务管理器。
- 任一步失败整批回滚。
- 事务内再次校验章节/小节/KP 启用与归属（降低 TOCTOU）。
- MySQL `uk_hs_math_train_item_code` 为最终防线。
- 真实 IT：`G_concurrent` → 最终仅一份；`modes=created,idempotent`。

## 4. 批准门禁审计

后端 `assertApproveQualityGate`（非仅前端）：

- 无 KP / 非唯一主 KP / 空解析 / 非法答案 → 拒绝
- 章节/小节/KP 停用或跨章 → 拒绝
- `isBlockedFromApprove`：`HS_MATH_P0_`、`DEMO.`/`EXAMPLE.`/`SAMPLE.`、`HS_MATH_P1_0D1_*` → 拒绝
- `pool=test`、题干测试/占位标识 → 拒绝
- create/update 不可指定 `status=approved`
- approved 改内容或 KP → 回 draft（P1-0C 既有行为）
- USER 调管理接口 → 403

## 5. 测试环境

- 库：`study_system`（`HS_MATH_P1_0D1_MYSQL_IT=1` 显式开启）
- 标记：`HS_MATH_P1_0D1_IT_*`；测后删除无会话引用的 IT 题
- 不触碰 P0 E2E id 1–5；不批准 IT 题留在正式池
- 单元：`pnpm --filter api run hs-math:p1-0d1-selftest`（不连库）
- 集成：`pnpm --filter api run hs-math:p1-0d1-mysql-it`

## 6. 真实 MySQL 测试结果（2026-10-24）

| 用例 | 结果 |
|------|------|
| A1/A2 未登录 401 | PASS |
| A3/A4 USER 403 | PASS |
| A5/A6 ADMIN preview/confirm | PASS |
| B preview 不写库 | PASS |
| C 四题型 draft + KP | PASS |
| D 重复 confirm 幂等 | PASS |
| E 篡改 items/角色/签名 | PASS |
| E 同 code 内容变更拒幂等 | PASS |
| F 已存在 code preview 拒绝 | PASS |
| G 并发 confirm | PASS |
| I IT 前缀不可批准 | PASS |
| I 缺解析/KP 不可批准 | PASS |
| I 合法题批准后 disabled 并清理 | PASS |
| I USER 不可批准 | PASS |
| Z 历史会话/P0 状态/approved 正式数不变 | PASS |

H「preview 后停用正式教材 KP」：未改种子结构 → 相关场景依赖事务内再校验代码路径，**未做破坏性停用实操**（避免伤教材）。

## 7. HTTP 鉴权

401 / 403 / ADMIN 成功：均 PASS（见上）。

## 8. 前端验收

源码审查：`HsMathTrainItemsImportView.vue`

- 本地 JSON/数量/体积校验；error/warning 区分；无 error 才可 confirm；二次确认；`confirmLock`；无自动批准；token 不入 localStorage。
- 浏览器手工 E2E：**NOT_RUN**
- Web build：随回归执行

## 9. 遗留风险

1. 无持久化导入批次表 → 跨实例 exactly-once 依赖唯一约束 + 内容指纹，非业务级导入单号。
2. 进程内 nonce 不跨实例共享。
3. 教材 KP 停用类 H 场景未做破坏性实操。
4. 结构合法 ≠ 数学正确，批准仍须人工。

## 10. P1-0E 准入

**READY**（在以下前提下）：

- 导入/幂等/门禁/鉴权真实 IT 已 PASS
- 不自动批准；第一章正式题仍须人工审核后批准
- 进入 P1-0E 前勿再跑会污染正式池的旧 P0 E2E 批准脚本
