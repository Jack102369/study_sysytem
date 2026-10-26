# HS-MATH-BANK-DIAGRAM-1B — 题干插图基础能力实现

> 日期：2026-10-26  
> **最终状态：`IMPLEMENTATION_READY_FOR_MIGRATION`**  
> 前置：DIAGRAM-1A = `PREFLIGHT_COMPLETE`  
> **未**在真实 `study_system` 执行迁移；**未**改 CAND 正式题；**未**上传正式图；**未** review/approve

---

## 1. 结论

| 项 | 结果 |
|----|------|
| 迁移 SQL | 已编写，**未执行** |
| API / Entity / 存储 / SVG 清洗 | 已实现 |
| fingerprint 无图兼容 | selftest 通过（空列表不改哈希） |
| 升版 / approved→draft | 上传/替换/删除/调序统一 bump |
| session 快照时机 | `createSession` 事务内，与 session_item 同批 |
| 表未迁移时服务启动 | 可读降级为空；写接口 `MIGRATION_PENDING`；开训跳过快照 |
| 自动化测试 | `hs-math:diagram1b-selftest` **11 PASS** |
| API `tsc` / Web `vue-tsc` | **通过** |
| 真实网页验收 | 仍须用户：`WAITING_USER_UI`（迁移后） |

---

## 2. 数据库迁移是否执行

**否。**  

文件：`db/migrate_hs_math_item_diagrams.sql`  
权威结构同步：`db/init.sql`（新建库用；不表示已对现网执行）

三表：

1. `hs_math_train_item_diagram_objects` — 不可变对象  
2. `hs_math_train_item_diagrams` — 题目当前关联（≤3）  
3. `hs_math_train_session_item_diagrams` — 开训快照  

**部署顺序建议**：先跑迁移 → 再部署含 DIAGRAM-1B 的 API/Web。迁移前旧进程可运行；新代码在无表时开训/列表不崩。

---

## 3. 修改文件清单（主要）

### DB
- `db/migrate_hs_math_item_diagrams.sql`（新增）
- `db/init.sql`（增表段）

### API
- entities：`hs-math-train-item-diagram*.entity.ts` ×3  
- `util/hs-math-item-diagram-storage.ts`  
- `util/hs-math-item-diagram-security.ts`（MIME + SVG 清洗）  
- `util/hs-math-item-diagram.selftest.ts`  
- `admin/hs-math-admin-train-item-diagrams.service.ts`  
- `admin/hs-math-admin-train-items.controller.ts`（diagram 路由）  
- `dto/admin-train-item-diagram.dto.ts`  
- `hs-math.module.ts` / `hs-math.constants.ts`  
- `util/import-preview-token.ts` / `hs-math-item-content-fingerprint.ts`  
- `admin/...-reviews.service.ts`（`computeItemContentFingerprint` 纳入图）  
- `train/hs-math-train.service.ts`（开训快照 + 学生读图）  
- `train/hs-math-train.controller.ts`  
- `util/session-item-view.ts`  
- `package.json`（`hs-math:diagram1b-selftest`）

### Web
- `components/hs-math/HsMathStemDiagrams.vue`  
- `api/hs-math-admin.ts` / `api/hs-math-train.ts`  
- `views/settings/hs-math/HsMathTrainItemsAdminView.vue`  
- `views/hs-math/HsMathTrainSessionView.vue`  
- `views/hs-math/HsMathTrainResultView.vue`  

### 文档
- 本文 · `PROJECT_HANDOFF.md`

---

## 4. API 清单

### Admin（Jwt + AdminGuard）
| 方法 | 路径 |
|------|------|
| GET | `/hs-math/admin/train-items/:id/diagrams` |
| POST | `/hs-math/admin/train-items/:id/diagrams`（multipart `file`） |
| POST | `/hs-math/admin/train-items/:id/diagrams/:linkId/replace` |
| PATCH | `/hs-math/admin/train-items/:id/diagrams/order` |
| DELETE | `/hs-math/admin/train-items/:id/diagrams/:linkId` |
| GET | `/hs-math/admin/train-items/:id/diagrams/:linkId/content` |

### 学生（Jwt + 本人 session）
| 方法 | 路径 |
|------|------|
| GET | `/hs-math/train/sessions/:sid/items/:siid/diagrams/:objectId` |

会话详情 `items[].diagrams` 带快照元数据（objectId/sort/mime/sha）。

---

## 5. 权限模型

| 角色 | 能力 |
|------|------|
| Admin | 上传/替换/删/排序/预览当前题图 |
| 学生 | 仅读**本人** session 快照中的 object；防枚举 |
| 匿名 | 无；无私有静态直链 |

---

## 6. SVG 安全策略

- 魔数/内容检测；拒 script、foreignObject、事件属性、外链 `href`、危险 URL。  
- 白名单标签重建；清洗失败则拒收。  
- **禁止**前端 `v-html` 注入 SVG；用鉴权 blob + `<img>`。  
- **本阶段未引入 sharp**：无自动栅格化 PNG；`sanitize_status=passed` 存清洗后 SVG。后续可授权加栅格化。  
- 优先建议作者上传 PNG/WebP。

---

## 7. fingerprint / version

- 有序 `diagramSha256List`：**仅非空时**写入 canonicalize → **无图旧题哈希不变**。  
- 增删换序/替换：同事务锁题 → 改关联 → `content_version+1`；若 `approved` → `draft` 并清空 reviewed_*。  
- 旧 review 因版本/指纹不匹配而 stale，须重审再 `confirmPublish` 批准。

---

## 8. session 快照建立时机

在 `createSession` **同一事务**内：`save(session_items)` 后立即按当前 `hs_math_train_item_diagrams` 写入 `hs_math_train_session_item_diagrams`。  
**不是**交卷后。表不存在则 catch `NO_SUCH_TABLE` 跳过。

历史读快照 object；替换当前题图不删仍被引用的不可变对象。

---

## 9. 自动化测试 / 构建

| 检查 | 结果 |
|------|------|
| `npm run hs-math:diagram1b-selftest` | **11 PASS**（恶意 SVG、MIME、超大、指纹兼容/顺序、路径穿越） |
| `apps/api` `tsc -p tsconfig.build.json --noEmit` | **PASS** |
| `apps/web` `vue-tsc --noEmit` | **PASS** |
| Playwright / 真实 DB 集成 | **未跑**（边界内禁止） |

未用浏览器自动化；application 作答图/AI 路径未改开关。

---

## 10. 未完成项（须另授权）

1. **真实库执行** `migrate_hs_math_item_diagrams.sql`  
2. DIAGRAM-1C/制图：四题 REQUIRED 正式配图 → 升版 → 重审 → 重批  
3. （可选）引入 sharp 做 SVG→PNG 展示版  
4. 用户网页验收（迁移+有图后）  
5. 无引用对象的物理清理任务  

---

## 11. 最终状态

```
IMPLEMENTATION_READY_FOR_MIGRATION
```

**停止。** 不执行迁移，不进入 DIAGRAM-1C。
