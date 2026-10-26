# HS-MATH-BANK-DIAGRAM-1C-MIGRATION — 题干插图数据库正式迁移

> 日期：2026-10-26  
> **最终状态：`MIGRATION_PASS`**  
> 前置：DIAGRAM-1C-PREFLIGHT = `MIGRATION_PREFLIGHT_PASS`  
> **仅**执行已审计 `db/migrate_hs_math_item_diagrams.sql`；未上传正式图；未改题；未开训；未调 AI；未重启服务；未 git commit/push

---

## 1. 结论摘要

| 项 | 结果 |
|----|------|
| 数据库 | **`study_system`** · MySQL **8.0.44** · utf8mb4 / utf8mb4_0900_ai_ci |
| SQL | `db/migrate_hs_math_item_diagrams.sql` |
| SQL SHA256 | `940275ce2556c31af54affbce0cd17ad2ee05124cf172cbfbf95d961c5e364d6` |
| 执行语句 | 3× `CREATE TABLE IF NOT EXISTS`（全部成功） |
| 新建表 | 三表均存在 · 行数均为 **0** |
| 半迁移 | **否** |
| 业务计数 | 迁移前后一致（drawable **113** · CAND approved **100**） |
| API/Web 部署验收 | **未做**（本阶段仅迁库） |
| **最终状态** | **`MIGRATION_PASS`** |

旁证：`question_bank/_g1c_diagram_migrate_run.mjs` → `_g1c_diagram_migrate_result.json`

---

## 2. 时间线

| 事件 | 时间（UTC / 本地 UTC+8） |
|------|--------------------------|
| 迁移开始 | `2026-10-26T11:40:06.393Z` / **19:40:06** |
| 三表 DDL 完成 | 约 3.6s（818 + 1859 + 909 ms） |
| 迁移结束（含核验） | `2026-10-26T11:40:10.128Z` / **19:40:10** |

说明：同日稍早一次预检脚本因把 `ON DELETE` 误判为破坏性语句而 **ABORT（未执行任何 DDL）**；修正检测后正式执行，起点仍为三表不存在。

---

## 3. 执行前保护（与 137 对照）

| 检查 | 实测 | 与 137 |
|------|------|--------|
| `DATABASE()` | `study_system` | ✓ |
| `VERSION()` | `8.0.44` | ✓ |
| schema charset | utf8mb4 / utf8mb4_0900_ai_ci | ✓ |
| 三目标表存在 | **均否** | ✓ |
| items/session_items/users.`id` | bigint unsigned | ✓ |
| CAND approved | **100** | ✓ |
| formal+approved+active | **113** | ✓ |
| reviews | **115** | （137 未单列；本阶段基线） |
| sessions / session_items | **133 / 357** | ✓ |
| application 作答图 | **64** | ✓ |
| items / kps / methods | **211 / 273 / 127** | 本阶段基线 |

**无与 137 冲突；未停止。**

---

## 4. 实际执行语句

仅以下三条（自迁移文件拆分，逐条执行；DDL 隐式提交）：

1. `CREATE TABLE IF NOT EXISTS hs_math_train_item_diagram_objects (...)`  
2. `CREATE TABLE IF NOT EXISTS hs_math_train_item_diagrams (...)`  
3. `CREATE TABLE IF NOT EXISTS hs_math_train_session_item_diagrams (...)`  

未执行 DROP / TRUNCATE / DELETE FROM / UPDATE；未使用 TypeORM synchronize。

---

## 5. 新建表与约束验证

### 5.1 存在性与字符集

| 表 | ENGINE | COLLATION | COUNT(*) |
|----|--------|-----------|----------|
| `hs_math_train_item_diagram_objects` | InnoDB | utf8mb4_0900_ai_ci | **0** |
| `hs_math_train_item_diagrams` | InnoDB | utf8mb4_0900_ai_ci | **0** |
| `hs_math_train_session_item_diagrams` | InnoDB | utf8mb4_0900_ai_ci | **0** |

### 5.2 关键索引 / 唯一键

| 表 | 约束 |
|----|------|
| objects | PK(`id`)；UK `uk_hs_math_diagram_obj_sha`；UK `uk_hs_math_diagram_obj_key`；IDX uploader |
| item_diagrams | PK；UK `uk_hs_math_item_diagram_ord`(`item_id`,`sort_order`)；IDX `object_id` |
| session_item_diagrams | PK；UK `uk_hs_math_sess_item_diagram_ord`(`session_item_id`,`sort_order`)；IDX `object_id` |

### 5.3 外键 DELETE_RULE（information_schema）

| 约束 | 引用 | DELETE_RULE |
|------|------|-------------|
| `fk_hs_math_diagram_obj_user` | users.id | **SET NULL** |
| `fk_hs_math_item_diagram_item` | train_items.id | **CASCADE**（仅删关联行） |
| `fk_hs_math_item_diagram_obj` | diagram_objects.id | **NO ACTION**（= RESTRICT，保对象） |
| `fk_hs_math_sess_item_diagram_si` | session_items.id | **CASCADE**（删快照行） |
| `fk_hs_math_sess_item_diagram_obj` | diagram_objects.id | **NO ACTION**（= RESTRICT，保对象） |

对象表不被当前关联/快照 **CASCADE** 删除，与协议一致。

---

## 6. 迁移前后业务数量对照

| 指标 | 迁移前 | 迁移后 | 变化 |
|------|--------|--------|------|
| CAND approved | 100 | 100 | 0 |
| drawable | 113 | 113 | 0 |
| reviews | 115 | 115 | 0 |
| sessions | 133 | 133 | 0 |
| session_items | 357 | 357 | 0 |
| application images | 64 | 64 | 0 |
| items / kps / methods | 211 / 273 / 127 | 同左 | 0 |
| 三新表行数 | n/a | 0 / 0 / 0 | 新建空表 |

**无并发业务数字漂移；无半迁移。**

---

## 7. 错误与处理

| 事件 | 处理 |
|------|------|
| 首次运行脚本误把 `ON DELETE` 判为破坏语句 | **未执行 DDL**；收紧检测后重跑 |
| 正式执行 | 三语句全部 `ok: true` |
| 部分迁移 | **未发生** |
| 擅自 DROP / 自动重跑错误结构 | **未做** |

---

## 8. 部署边界说明（本阶段未做）

- **未**重启 API / Web  
- **未**改环境变量 / AI 开关  
- **未**上传正式题干插图、未改四道 REQUIRED 题  
- **未**创建训练 session、未 review/approve  
- **未**调用真实 Qwen/DeepSeek  
- **未** git commit / push  

迁移完成 **≠** 网页插图功能验收通过。运行中进程若仍为迁表前代码，读路径已兼容；**写插图前**需确认 API 已含 DIAGRAM-1B 实现且指向本库。

---

## 9. 下一阶段建议

1. **停止**本迁移阶段。  
2. 等待独立授权后再进入正式配图（建议 DIAGRAM-1D：四道 REQUIRED 制图上传 + 升版后重审重批）。  
3. 可选：用户侧确认 Admin 插图写接口与学生 session 读图（部署/热更新边界由运维决定）。  
4. 勿自动进入 CORE-1B；勿 push。

---

## 10. 最终状态

```
MIGRATION_PASS
```

**本阶段停止。不得自动上传四道正式题图，不得自动进入 DIAGRAM-1D。**
