# P1-FUNC-CORE-1A-2D.1a · PATCH / KP 关联无变化请求幂等审计与修复

> **阶段状态**：**PASS**  
> **库**：未写入  
> **API**：未重启  

---

## A. 执行结果

| 项 | 结果 |
|---|---|
| 阶段结论 | **PASS** |
| PATCH 审计 | **PASS**（发现问题并修复） |
| KP 关联审计 | **PASS**（发现问题并修复） |
| 无变化不升版 | **PASS**（代码+单测） |
| 真实变化只 +1 | **PASS** |
| 事务/行锁/expectedVersion | **PASS**（KP 补齐可选 expectedVersion） |
| 批准门禁 / status 独立 | **PASS**（未改门禁） |
| API build / selftest | **PASS** |
| MySQL 写库复验 | **NOT_RUN** |
| 数据库变更 | **无** |

---

## B. PATCH 原实现审计

**入口**：`PATCH /hs-math/admin/train-items/:id` → `HsMathAdminTrainItemsService.update`

| 字段 | 业务语义 | 进指纹？ | 原升版判定 |
|---|---|---|---|
| code | 题号 | 是 | DTO 出现即升版 |
| stem | 题干 | 是 | 同上 |
| optionsJson | 选项 | 是 | 同上 |
| answerPayloadJson | 答案 | 是 | 同上 |
| qtype | 题型 | 是 | 同上 |
| analysis | 解析 | 是 | 同上 |
| difficulty | 难度 1/2/3 | 是 | 同上 |
| specialtyId / categoryId | 章节/小节 | 是（code） | 同上 |
| knowledgePointId | 主 KP 列（冗余） | 间接（关联表为主） | **未**列入旧 substantive |
| source_* ×8 | 来源元数据 | V2 | DTO 出现即升版 |
| pool | 题池 | canonicalize 固定 formal | **不**升版（保留） |
| expectedContentVersion | 乐观锁 | 否 | 冲突 409 |
| status | 禁止 | — | 拒 PATCH，走 status 接口 |

**原问题**：`isSubstantiveTrainItemChange` 仅判断「字段是否出现在 DTO」，`{ difficulty: 1 }` 在已是 1 时仍升版；且无条件 `save` + `updatedBy`。

**已有正确点**：事务、`pessimistic_write`、`expectedContentVersion`、status 禁止、来源 merge 局部更新语义。

---

## C. KP 更新原实现审计

**入口**：`PUT /hs-math/admin/train-items/:id/knowledge-points` → `replaceKnowledgePoints`

| 项 | 原行为 |
|---|---|
| 传入 | `knowledgePointIds[]` + `primaryKnowledgePointId` |
| 主/辅 | `isPrimary`；非空时强制有主 KP |
| 排序 | `(idx+1)*10`，影响管理端展示 |
| 空 KP | 允许清空 |
| 唯一 | DTO `ArrayUnique` + 服务去重校验 |
| 归属 | 同 specialty + 启用 KP/小节/章节 |
| 事务/行锁 | 有 |
| expectedVersion | **无** |
| 升版 | **无条件** delete+insert + bump |

---

## D. 是否发现幂等问题

| 路径 | 问题 |
|---|---|
| PATCH | **是** — 字段出现即升版 |
| KP PUT | **是** — 无条件替换并升版 |

---

## E. 具体根因

与 2D.1 同类：**缺少锁后规范化业务值比较**，把「请求触及字段 / 调用替换接口」当成「内容已变」。

---

## F. 修改文件清单

| 文件 | 变更 |
|---|---|
| `util/train-item-meta-equality.ts` | 扩 KP 计划相等 + PATCH 内容快照 |
| `admin/hs-math-admin-train-items.service.ts` | `update` / `replaceKnowledgePoints` 幂等 |
| `dto/admin-train-item-kps.dto.ts` | 可选 `expectedContentVersion` |
| `util/train-item-status.ts` | 注释：`isSubstantive…` 不再作 PATCH 升版依据 |
| `util/hs-math-p1-func-core1a2d1a.selftest.ts` | **新增** |
| `package.json` | 脚本 `hs-math:p1-func-core1a2d1a-selftest` |
| `docs/.../49_....md` | 本报告 |
| `PROJECT_HANDOFF.md` | 阶段状态 |

---

## G. PATCH 比较规则

1. 锁行 → `expectedContentVersion`  
2. `before = snapshotTrainItemContent(entity)`  
3. 按 DTO 局部语义 apply（undefined=不改；显式 null=清空允许字段）  
4. `after = snapshot…`；`contentChanged = !equal(before,after)`  
5. `pool` 单独：可变但不升版；仅 pool 变则 save 不 bump  
6. 内容与 pool 均无变化 → **不 save、不改 updatedBy**  
7. 内容变 → 单次 `bumpContentVersionOnMetaEdit`（approved→draft 规则保留）

快照含：code/qtype/stem/options/answer/analysis/difficulty/specialty/category/knowledgePointId/规范化 source。  
JSON 用 `stableStringify`；文本 trim；analysis null↔空白等价。

---

## H. KP 比较规则

- 身份：`knowledgePointId`  
- **顺序敏感**（与 sort_order 写入一致，影响展示）  
- 主 KP 敏感  
- 锁后读当前关联 → `knowledgePointLinkPlansEqual`  
- 相同：不 DELETE/INSERT、不升版  
- 不同：事务内替换 + 同步 `item.knowledgePointId` + 单次 +1  
- KP **名称**改动不经本接口；指纹用 **code**，词典改名不改题指纹（既有）  
- 历史会话快照不写  

---

## I. 无变化行为

| 请求 | 行为 |
|---|---|
| PATCH 相同 difficulty/题干/答案/解析/来源 | version 不变 |
| PUT 相同 KP 列表+主 KP+顺序 | 不换关联、version 不变 |

---

## J. 真实变化行为

| 请求 | 行为 |
|---|---|
| 任一内容字段真实变 | version **只 +1** |
| 多字段同时变 | 仍 **只 +1** |
| KP 增删/换主/换序 | version **只 +1** |

---

## K. 事务与并发保护

- 仍事务 + 行锁；比较在锁后  
- PATCH / KP / methods 均可带 `expectedContentVersion` → 过期 409  
- Mock：源码路径断言；**非**真实 MySQL 并发验收  

---

## L. 指纹和审核影响

- 无变化不升版 → 避免无意义 STALE  
- V1/V2 规则未改  
- `patchStatus` / `publishWithHumanReviewGate` / `assertSourceAllowsFormalPublish` **未改**  

---

## M. 单元测试结果

| 命令 | 结果 |
|---|---|
| `hs-math:p1-func-core1a2d1a-selftest` | **PASS** |
| `hs-math:p1-func-core1a2d1-selftest` | **PASS** |
| `hs-math:p1-func-core1a-selftest` | **PASS** |
| `hs-math:selftest` | **PASS** |

---

## N. API 编译结果

`pnpm --filter api build` → **PASS**

---

## O. 数据库状态

本阶段**无**查询刷新、**无**写入。LAST_VERIFIED 保持 2D 时点（交接文档不伪刷新）。

---

## P. 未执行的 MySQL 测试

真实写库 IT、API 重启、方法种子、正式批准 → **NOT_RUN**

---

## Q. 风险与未完成项

1. 运行中 API 未加载新 dist。  
2. 仅改 `pool` 会 save 但不升版（与指纹一致；刻意）。  
3. KP 顺序变化会升版（展示顺序业务含义）；指纹 KP codes 仍排序，顺序单独变时 version 变、指纹可能不变 → STALE 仍因 version（符合「展示序属业务」）。  

---

## R. 下一阶段建议

1. 授权部署 API 后，统一复验 methods / content-meta / PATCH / KP 幂等（MySQL IT）。  
2. 方法种子 / UI / 批准另授权。  
3. 不进入 CORE-1A-3 / CORE-1B。
