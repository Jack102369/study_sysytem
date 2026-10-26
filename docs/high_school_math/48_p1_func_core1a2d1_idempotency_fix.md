# P1-FUNC-CORE-1A-2D.1 · methods / content-meta 无变化请求幂等修复

> **阶段状态**：**PASS**  
> **库**：未写入（本阶段禁止 MySQL 写库 IT）  
> **API**：未重启（运行中进程仍为旧 dist，直至另授权部署）

---

## 1. 执行结果

| 项 | 结果 |
|---|---|
| 阶段结论 | **PASS** |
| 根因定位 | **PASS** |
| methods 无变化不升版 | **PASS**（代码+单测） |
| content-meta 无变化不升版 | **PASS**（代码+单测） |
| 真实变化仍至多 +1 | **PASS**（逻辑保留单次 bump） |
| 事务/行锁/expectedVersion | **PASS**（保留） |
| V1/V2 指纹 | **PASS**（自测） |
| API build | **PASS** |
| 不写库自测 | **PASS** |
| 真实 MySQL 写库复验 | **NOT_RUN** |
| 数据库变更 | **无** |

---

## 2. 两个问题的根因

### 问题1：`PUT …/methods`

`replaceMethods` 在行锁与 `expectedContentVersion` 校验后，**无条件**：

1. `replaceItemMethodLinks`（delete + insert）  
2. `bumpContentVersionOnMetaEdit`

未读取当前关联，也未与请求计划做业务语义比较。

### 问题2：`PUT …/content-meta`

`putContentMeta` 在 DTO 提供 `source` 或 `methodIds` 时直接 `bumped = true`，再统一升版：

- 只要请求里带了 `source` 对象，即使 merge+normalize 后与库内完全一致，仍升版；  
- 只要带了 `methodIds`，即使关联相同，仍替换并升版。

**不是**「指纹误判」或「NULL/undefined 偶然不等」；根因是**缺少持久化业务内容比较，且无条件升版**。

---

## 3. 实际修改文件

| 文件 | 变更 |
|---|---|
| `apps/api/src/hs-math/util/train-item-meta-equality.ts` | **新增**：方法计划 / 来源规范化相等性 |
| `apps/api/src/hs-math/admin/hs-math-admin-train-items.service.ts` | `replaceMethods` / `putContentMeta` 锁后比较再写 |
| `apps/api/src/hs-math/util/hs-math-p1-func-core1a2d1.selftest.ts` | **新增** 不写库自测 |
| `apps/api/src/hs-math/util/hs-math-p1-func-core1a.selftest.ts` | 接线断言含幂等比较 |
| `apps/api/package.json` | 脚本 `hs-math:p1-func-core1a2d1-selftest` |
| `docs/high_school_math/48_…md` | 本报告 |
| `docs/high_school_math/PROJECT_HANDOFF.md` | 阶段状态 |

未改：迁移 SQL、`db/init.sql`、`.env`、其他模块、题库源、公共 Auth。

---

## 4. 修复前后行为

| 场景 | 修复前 | 修复后 |
|---|---|---|
| 相同 methods PUT | version+1，关联重写 | version 不变，不写关联 |
| 相同 content-meta PUT | version+1 | version 不变 |
| 仅方法变 / 仅来源变 | +1 | +1 |
| 来源+方法同时变 | +1（已原子） | +1（仍原子） |
| expectedVersion 冲突 | 409 | 409（锁后仍先校验） |
| 非法 method / 来源 | 400 + 回滚 | 不变 |

---

## 5. 规范化比较规则

### 方法关联

- 身份：`methodId`（字符串化）  
- **顺序敏感**：与写入 `sort_order = (idx+1)*10` 一致  
- **主方法敏感**：`primaryMethodId`（空/null/'' → null）  
- `is_primary` 用 `Boolean()`（兼容 MySQL 0/1）  
- 指纹仍用 **sorted codes + primary**（展示顺序变会升版；指纹是否变取决于 set/primary）

### 来源字段

- 使用既有 `normalizeSourceFields` / `assertValidSourceFields`  
- 空串/空白 → null；缺省枚举 → original/unverified/unknown  
- **局部更新语义不变**：`mergeSourcePatch` 仅对 DTO 中 `!== undefined` 的字段覆盖  
- 比较对象为「merge+validate 后的目标」vs「当前行 normalize」，而非「DTO 是否出现字段」

---

## 6. 事务与锁验证

仍在同一事务内：

1. `pessimistic_write` 锁题目行  
2. `assertExpectedContentVersion`  
3. **再**读当前方法关联 / 规范化来源并比较  
4. 仅变化时写关联 / applySource / bump / save  

禁止事务外预比较后写入。

---

## 7. expectedVersion 行为

- 未破坏：冲突仍 `ConflictException` 409  
- 两相同请求且均带旧 `expectedContentVersion`：第一个若真实修改成功升版，第二个锁后 409  
- 两相同无变化请求、无 expectedVersion：两者均可成功且 **均不升版**

---

## 8. 指纹与审核 STALE 影响

- 无变化不再无意义升版 → 避免「同内容重复保存导致 STALE」  
- 真实变化仍升版；指纹规则未改（V1 默认 / V2 meta）  
- 旧题未批量重算 version

---

## 9. 单元测试结果

| 命令 | 结果 |
|---|---|
| `pnpm --filter api run hs-math:p1-func-core1a2d1-selftest` | **PASS** |
| `pnpm --filter api run hs-math:p1-func-core1a-selftest` | **PASS** |
| `pnpm --filter api run hs-math:selftest`（P0-2/3/4） | **PASS**（本阶段曾跑） |
| `pnpm --filter api run hs-math:p1-0fc3c2-selftest` | **PASS**（本阶段曾跑） |

覆盖：空/单/主辅重复 PUT 语义、顺序/主方法/删除、来源 NULL/空串/类型变化、单侧与双侧变化、V1/V2、四题型指纹、源码锁后比较接线。

---

## 10. API build 结果

`pnpm --filter api build` → **PASS**（exit 0）

---

## 11. 未执行的 MySQL 测试

| 项 | 状态 |
|---|---|
| 真实 MySQL 写库复验 2D 幂等用例 | **NOT_RUN**（本阶段禁止） |
| API 重启加载新 dist | **NOT_RUN** |
| 方法种子 / 正式批准 | **NOT_RUN** |

---

## 12. 风险与未完成项

1. **运行中 API（PID 20052）未重启**：线上行为仍为旧逻辑，直至另授权部署。  
2. `PATCH /train-items/:id` 仍用「DTO 字段是否出现」判定 substantive（`isSubstantiveTrainItemChange`），**未**纳入本次相等性比较；重复 PATCH 相同来源值仍可能升版。  
3. KP `replaceKnowledgePoints` 仍总是 +1（本次范围外）。

---

## 13. 下一阶段建议

1. 授权部署/重启本地 API 后，重跑受控 MySQL IT 幂等项（可复用 2D 脚本断言）。  
2. 可选：将 PATCH / KP 替换也改为锁后语义相等再升版。  
3. 方法种子 / 管理端 UI / 正式批准另授权。  
4. **不**进入 CORE-1A-3 / CORE-1B（未授权）。
