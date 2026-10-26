# HS-MATH-BANK-DIAGRAM-1C-PREFLIGHT — 真实库迁移前最终核验

> 日期：2026-10-26  
> **最终状态：`MIGRATION_PREFLIGHT_PASS`**  
> 前置：DIAGRAM-1B = `IMPLEMENTATION_READY_FOR_MIGRATION`  
> **本阶段只读**；未执行迁移；未改题；未上传图；未写业务代码

---

## 1. 结论摘要

| 项 | 结果 |
|----|------|
| 数据库 | **`study_system`** · MySQL **8.0.44** · utf8mb4 |
| 三目标表 | **均不存在**（无半迁移） |
| FK 类型匹配 | items/session_items/users.`id` = **bigint unsigned** ✓ |
| 索引/约束名冲突 | **无** |
| 迁移 SQL 破坏性语句 | **无** DROP/DELETE/TRUNCATE/UPDATE 数据 |
| Entity ↔ SQL | **一致** |
| synchronize | **false**（`app.module.ts`） |
| fingerprint 无图兼容 | selftest **PASS** |
| 审核/升版/快照门禁 | 代码审阅 **通过**（无 BLOCKER） |
| SVG/权限安全 | 代码审阅 **通过**（栅格化仍为后续可选项） |
| 构建/selftest | **PASS** |
| **是否允许进入真实迁移** | **是**（须另授权 DIAGRAM-1C-MIGRATION） |

旁证（勿 git）：`question_bank/_g1c_diagram_mig_preflight_ro.mjs` → `_g1c_diagram_mig_preflight_ro.json`

---

## 2. 当前数据库实际结构（只读）

| 探测 | 实测 |
|------|------|
| `DATABASE()` | `study_system` |
| `VERSION()` | `8.0.44` |
| schema charset/collation | `utf8mb4` / `utf8mb4_0900_ai_ci` |
| CAND approved | **100** |
| formal+approved+active（drawable） | **113** |
| sessions / session_items | **133 / 357** |
| application 作答图行 | **64** |

说明：session 计数相对 1I 后基线略增（用户网页活动），**与本预检无关**；本阶段未写入。

### 2.1 三目标表存在情况

| 表 | 存在 |
|----|------|
| `hs_math_train_item_diagram_objects` | **否** |
| `hs_math_train_item_diagrams` | **否** |
| `hs_math_train_session_item_diagrams` | **否** |

`partialMigration` = **false**。

### 2.2 外键目标列类型

| 引用目标 | COLUMN_TYPE |
|----------|-------------|
| `hs_math_train_items.id` | bigint unsigned |
| `hs_math_train_session_items.id` | bigint unsigned |
| `users.id` | bigint unsigned |

与迁移脚本中 `BIGINT UNSIGNED` FK **一致**。

---

## 3. 迁移 SQL 审计（`db/migrate_hs_math_item_diagrams.sql`）

| 检查 | 结果 |
|------|------|
| 仅 `CREATE TABLE IF NOT EXISTS` | ✓ |
| 无 DROP / TRUNCATE / 数据 UPDATE/DELETE | ✓ |
| PK / UK（sha、storage_key、item+sort、session_item+sort） | ✓ |
| 对象表 `ON DELETE SET NULL`（uploaded_by→users） | ✓ 不删用户也不删对象 |
| 当前关联：删题 `ON DELETE CASCADE`（仅删关联行） | ✓ |
| 对象 FK：**未**设 `ON DELETE CASCADE`（默认 RESTRICT） | ✓ **历史引用保对象** |
| session 快照：删 session_item CASCADE 快照行；对象仍 RESTRICT | ✓ 不因解绑当前图丢对象 |
| `sort_order` / sha256 / mime / size / 宽高 | ✓（应用层限制 1..3；库无 CHECK，见观察项） |
| 重复执行 | `IF NOT EXISTS` → 已存在则跳过；**不会**自动修复错误结构 |
| 半迁移 | 当前无；若只建成部分表，再执行可补建缺失表 |

**历史保留机制**：解绑/换图只改关联；代码明确不物理删对象；session 快照持有 `object_id` + `content_sha256`。

---

## 4. Entity / SQL 一致性

三 Entity 列名、类型与迁移表对齐：

- `HsMathTrainItemDiagramObject`
- `HsMathTrainItemDiagram`（字段名 `sort_order`，非 display_order）
- `HsMathTrainSessionItemDiagram`

`HsMathModule` 已注册；`synchronize: false`。

---

## 5. fingerprint 兼容

| 场景 | 证据 |
|------|------|
| 无图 / 空列表 | `canonicalizeImportItem` **仅当** `diagramSha256List.length>0` 写入；selftest「empty list compat」**PASS** |
| 有图 / 顺序 | 有序 sha 入指纹；增删换序改变哈希；selftest **PASS** |
| 计算路径 | `computeItemContentFingerprint` 读关联表；表不存在 → `NO_SUCH_TABLE` 跳过（空列表） |

---

## 6. 审核门禁（代码审阅）

| # | 要求 | 结论 |
|---|------|------|
| 1 | 增删换序统一升版 | `bumpItemOnDiagramChange` + 同事务 `save(item)` ✓ |
| 2 | approved→draft | bump 内处理 ✓ |
| 3 | 旧 review 失效 | 升版+指纹变 → gate/stale ✓ |
| 4 | 事务原子性 | upload/replace/reorder/remove 均 `dataSource.transaction` + 锁行 ✓ |
| 5 | 未重批不可抽 | 退 draft 后抽题条件 `status=approved` 排除 ✓ |
| 6 | createSession 内快照 | 同事务 `save(session_items)` 后写 snapshot；表缺则 catch 跳过 ✓ |
| 7 | 历史读快照 | `getSessionForUser` / `getSessionDiagramBinary` 读 snapshot，校验属主+sha ✓ |

**无 BLOCKER。**

---

## 7. SVG / 文件 / 权限安全

| 项 | 结论 |
|----|------|
| MIME 魔数 | PNG/WebP/SVG 检测；拒伪 MIME ✓ |
| 大小 | 2MB 上限 ✓ |
| SVG 清洗 | 拒 script/foreignObject/事件/外链；白名单重建 ✓ |
| 展示 | 鉴权 blob + `<img>`；禁 v-html 注入 ✓ |
| 栅格化 PNG | **本阶段未做**（无 sharp）；属功能债，**非迁移阻塞** |
| 私有路径 | `uploads/hs-math/item-diagrams/{aa}/{sha}.bin`；防穿越 ✓ |
| Admin 写 / 学生读 | AdminGuard；学生须本人 session 快照含 objectId ✓ |

未上传正式图；selftest 未写正式图目录业务数据。

---

## 8. 兼容性

| 项 | 结论 |
|----|------|
| 无表启动 | Entity 注册不要求表已存在；TypeORM 不 synchronize ✓ |
| 读接口 | `listForItem` 无表 → `diagrams=[]` + `migrationPending` ✓ |
| 写接口 | `ServiceUnavailableException` 文案含 **MIGRATION_PENDING** ✓ |
| 开训 | 无表跳过快照，开训成功 ✓ |
| application 图/AI | 独立表与路径；本阶段未改 AI 开关 ✓ |
| 部署顺序 | **先执行迁移 SQL → 再依赖插图写路径的流量**；读路径已兼容旧库 |

---

## 9. 测试与构建

| 命令 | 结果 |
|------|------|
| `npm run hs-math:diagram1b-selftest` | **11 PASS** |
| `apps/api` `tsc -p tsconfig.build.json --noEmit` | **PASS** |
| `apps/web` `vue-tsc --noEmit` | **PASS**（随同执行） |

未建真实 session；未调真实 AI；未装 Playwright。

---

## 10. 迁移风险与回退

| 风险 | 缓解 / 回退 |
|------|-------------|
| 迁移中断半建成 | 再执行脚本可 `IF NOT EXISTS` 补表；当前起点干净 |
| 错误手改表结构 | IF NOT EXISTS 不会修复；须人工 DROP 错误空表后重跑（仅空新表、另授权） |
| 回退 | 新表无业务数据时可 DROP 三表（**须另授权**；勿动既有训练表） |
| 对现网题/历史 | DDL 仅新增表；不改 `train_items` 行；不触碰 approved/review |

---

## 11. 维护窗口与部署要求

1. **短窗口**：执行 `db/migrate_hs_math_item_diagrams.sql`（建议低峰；预计秒级）。  
2. 验证：`SHOW TABLES LIKE 'hs_math_train_item_diagram%'` 三表齐全；`drawable` 仍 113；CAND approved 仍 100。  
3. 确认运行中 API 已包含 DIAGRAM-1B 代码（若尚未部署代码，可先迁表再发版，或发版后迁表；**写插图前必须表已存在**）。  
4. **不要**在迁移阶段上传正式四题图（留 DIAGRAM-1C 后续制图授权）。

---

## 12. 观察项（非 BLOCKER）

1. 库层无 `CHECK (sort_order BETWEEN 1 AND 3)`，靠应用强制。  
2. SVG→PNG 栅格化待可选依赖授权。  
3. 无引用对象的物理清理另授权。

---

## 13. 最终状态

```
MIGRATION_PREFLIGHT_PASS
```

**允许进入真实迁移阶段（须独立授权 DIAGRAM-1C-MIGRATION）。**  
本阶段停止；**不**自动执行迁移。
