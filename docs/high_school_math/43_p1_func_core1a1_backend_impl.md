# P1-FUNC-CORE-1A-1 · 来源 + 方法标签 · 后端实现

> **状态**：代码完成 · **迁移未执行**（`MIGRATION_PENDING`）  
> **库**：`study_system` · **禁止**：本阶段未写库、未跑 DDL  
> **前置**：`42_p1_func_core1a0_implementation_preflight.md`  
> **迁移草案**：`db/migrate_hs_math_p1_func_core1a.sql`（仍为 `DRAFT_NOT_EXECUTED`）

---

## 1. 交付摘要

| 项 | 结果 |
|---|---|
| 方法词典 CRUD | `GET/POST/PATCH /hs-math/admin/methods` |
| 题目方法替换 | `PUT /hs-math/admin/train-items/:id/methods`（事务+行锁+version+1） |
| 来源+方法原子 | `PUT …/content-meta`（单次 version+1） |
| PATCH 扩 source | 事务+行锁；`expectedContentVersion` 可选 409 |
| 正式批准许可门禁 | `assertSourceAllowsFormalPublish`（forbidden/restricted；真题/改编须 permitted） |
| 指纹 V1/V2 | 默认来源+无方法 → 与旧指纹兼容；否则 `metaSchema=v2` |
| 导入 | 协议扩 source/methodCodes；preview 校验；confirm 同事务写入 |
| `db/init.sql` | 已回写 source 列 + methods 两表（权威结构） |
| 自测 | `npm run hs-math:p1-func-core1a-selftest` → **PASS** |
| `npm run build`（api） | **PASS** |
| 前端 | **未做**（本阶段仅后端） |
| 数据库迁移 | **未执行** |

---

## 2. 主要代码位置

| 能力 | 路径 |
|---|---|
| 常量枚举 | `apps/api/src/hs-math/hs-math.constants.ts` |
| 来源校验/门禁 | `util/hs-math-source.validate.ts` |
| 指纹 meta | `util/hs-math-item-meta-fingerprint.ts` + `import-preview-token.ts` |
| 方法关联规则 | `util/train-item-methods.validate.ts` |
| 方法词典 API | `admin/hs-math-admin-methods.{controller,service}.ts` |
| 题目 API | `admin/hs-math-admin-train-items.{controller,service}.ts` |
| 导入 | `admin/hs-math-admin-train-items-import.service.ts` + `types/import-protocol.ts` |
| Entity | `entities/hs-math-method.entity.ts`、`hs-math-train-item-method.entity.ts`；train-item 扩 source 列 |
| 模块注册 | `hs-math.module.ts` |
| 自测 | `util/hs-math-p1-func-core1a.selftest.ts` |

---

## 3. API 一览（AdminGuard）

| Method | Path | 说明 |
|---|---|---|
| GET | `/hs-math/admin/methods` | 词典列表（`activeOnly`） |
| POST | `/hs-math/admin/methods` | 创建（code 唯一） |
| PATCH | `/hs-math/admin/methods/:id` | 改 name/summary/sort/active；**禁改 code** |
| PUT | `/hs-math/admin/train-items/:id/methods` | 全量替换方法关联 |
| PUT | `/hs-math/admin/train-items/:id/content-meta` | `{ source?, methodIds?, primaryMethodId?, expectedContentVersion? }` |
| PATCH | `/hs-math/admin/train-items/:id` | 扩 `source_*` + 行锁 |
| PATCH | `/hs-math/admin/train-items/:id/status` | 批准时叠加许可门禁 |

表未创建时方法相关接口返回明确 `MIGRATION_PENDING` 提示（fail-soft / 400）。

---

## 4. 发布许可规则（formal）

| 条件 | 结果 |
|---|---|
| `license=forbidden` | 拒绝 |
| `license=restricted` | 拒绝 |
| `adapted` / `past_exam` | 须 `verified` + `permitted` + provenance 齐全 |
| `original` + `unverified` + `unknown` | **允许**（兼容旧题；展示须标明未核实） |

---

## 5. 指纹兼容

- 默认来源且无方法 → **不附** `metaSchema`（与迁移前 V1 哈希一致）。  
- 任一非默认来源或存在方法 → 附 V2：`source` + `methodCodes` + `primaryMethodCode`。  
- 迁移**不**批量 `UPDATE content_version`。当前 reviews=0，无 STALE 包袱。

---

## 6. 验证

```text
cd apps/api
npm run hs-math:p1-func-core1a-selftest   # PASS
npm run build                             # PASS
```

未跑写库 IT（须另授权）。

---

## 7. 待授权下一步

1. **执行** `db/migrate_hs_math_p1_func_core1a.sql`（确认 `DATABASE()=study_system`；备份 `hs_math_*`）。  
2. 验证：旧行默认 `original/unverified/unknown`；`content_version` 分布未批量变化；methods 表空可用。  
3. 可选：方法词典种子。  
4. 管理端 UI（来源表单、方法多选、审核展示）。  
5. 授权后写库 IT。  
6. 再开 CORE-1B。

---

## 8. 风险与限制

1. **现网库尚未迁移**：Entity 已声明 source 列与方法表 → 迁移前部署会导致 Unknown column / 缺表；须「先迁移再上线 API」或同窗发布。  
2. KP/methods「总是 version+1」可能过度升版（与预检一致，后续可加语义相等短路）。  
3. 本阶段无前端、无学生端 sourceLabel 展示改造。
