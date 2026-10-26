# P1-FUNC-CORE-1A-0 · 来源与方法标签 · 实施前预检

> **性质**：技术设计 + 指纹审计 + 迁移草案（**未执行迁移、未改业务代码、未写库**）  
> **库**：`study_system` · LAST_VERIFIED `2026-10-24T14:27:02.000Z`  
> **迁移草案**：`db/migrate_hs_math_p1_func_core1a.sql` 标记 **DRAFT_NOT_EXECUTED**  
> **范围**：仅 CORE-1A（来源 + 方法 + 指纹/审核/导入）；不含增强解析/解答题/错题等

---

## A. 当前结构审计

### A.1 库状态（只读）

| 项 | 值 |
|---|---|
| draft | 105 |
| disabled | 5 |
| approved formal active | **0** |
| PARITY 难度 | 16 / 7 / 2 |
| `hs_math_train_item_reviews` 行数 | **0** |
| 来源/方法列或表 | **不存在**（NOT_IMPLEMENTED） |

与 `PROJECT_HANDOFF` / CORE-0 记载一致。

### A.2 现有表（相关）

- `hs_math_train_items`：无 source_*  
- `hs_math_train_item_kps`：KP 多对多范式（可对标方法关联）  
- `hs_math_train_item_reviews`：存 `content_version` + `content_fingerprint`  
- 无 `hs_math_methods`

### A.3 关键代码位置

| 环节 | 路径 |
|---|---|
| 规范化 + 单题指纹 | `util/import-preview-token.ts` `canonicalizeImportItem` / `fingerprintCanonicalItem` |
| 服务端重算指纹 | `util/hs-math-item-content-fingerprint.ts`；`computeItemContentFingerprint` in `admin/hs-math-admin-train-item-reviews.service.ts` |
| 实质变更 | `util/train-item-status.ts` `isSubstantiveTrainItemChange` |
| 题目 PATCH | `admin/hs-math-admin-train-items.service.ts` `update`（**无行锁、无与关联表同事务**） |
| KP 替换 | 同文件 `replaceKnowledgePoints`（**事务 + `pessimistic_write` + version+1**） |
| 导入 | `admin/hs-math-admin-train-items-import.service.ts`；协议 `types/import-protocol.ts` |
| 审核提交/面板 | `admin/hs-math-admin-train-item-reviews.service.ts` |
| 批准门禁 | `util/hs-math-review-gate.ts` + `publishWithHumanReviewGate`（行锁+事务） |
| 导入幂等指纹比对 | `assertExistingMatchesImport`（含 difficulty、KP codes） |

### A.4 指纹调用链（现状）

```
创建/更新题目字段
  → isSubstantive? → content_version++（approved→draft）
替换 KP（独立 API）
  → 事务锁行 → 删插关联 → content_version++
人工审核提交
  → computeItemContentFingerprint(manager, item)
  → 写入 reviews(content_version, content_fingerprint)
审核面板 / 队列
  → 重算指纹；history.isStale = !(同 version && fp 匹配)
正式批准
  → 锁行 → 质量门禁 → 重算指纹
  → evaluateLatestReviewForPublish(同 version 最新 passed && fp 一致)
导入 preview
  → canonicalize + hashImportItems → preview token
导入 confirm
  → 新插入 draft；或全量已存在则 assertExistingMatchesImport（逐题指纹）
```

---

## B. 来源字段最终建议

相对 CORE-0 微调命名（与任务书对齐）：

| 列名 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `source_type` | VARCHAR(16) NOT NULL | `'original'` | `original` \| `adapted` \| `past_exam` |
| `source_year` | SMALLINT UNSIGNED NULL | NULL | 年份 |
| `source_exam_name` | VARCHAR(128) NULL | NULL | 试卷名 |
| `source_question_no` | VARCHAR(32) NULL | NULL | 题号 |
| `source_reference` | VARCHAR(512) NULL | NULL | 出处（管理端）；CORE-0 的 `source_ref` |
| `source_adaptation_note` | VARCHAR(512) NULL | NULL | 改编说明 |
| `source_verification_status` | VARCHAR(16) NOT NULL | `'unverified'` | `unverified` \| `verified` \| `rejected` |
| `source_license_status` | VARCHAR(16) NOT NULL | `'unknown'` | `unknown` \| `permitted` \| `restricted` \| `forbidden` |

### 旧题安全默认（关键）

- 迁移后 105 draft：**`source_type=original` + `verification=unverified` + `license=unknown`**。  
- **不得**写成「已核实原创」；学生展示建议：`原创题（来源未单独核实）` 或中性「题库练习题」，**禁止**「已核实高考真题」。  
- `adapted` / `past_exam` 仅当管理员显式填写且校验通过才可设；`past_exam`/`adapted` 要求：`verification=verified` 且必填 year+exam_name+question_no+reference（adapted 还须 adaptation_note）。  
- **发布门禁加严**（见 §H）：`formal` 批准时若 `source_type≠original` 或（展示为真题/改编）则必须 `license=permitted`；`forbidden`/`restricted`/`unknown`（对非 original）→ 拒绝批准。对默认 `original+unverified`：**允许**走现有人工审核批准（否则旧题永远无法发布）；管理端醒目标注「来源未核实」。  
- 来源与 `difficulty` **完全独立**；`past_exam` ≠ 压轴。

### 校验（应用层）

| source_type | 必填 | verification | license 批准 formal |
|---|---|---|---|
| original | 无考试字段 | 可为 unverified | unknown 允许（标注） |
| adapted | year, exam, no, reference, adaptation_note | 须 verified 才可设为 adapted 展示 | 须 permitted |
| past_exam | year, exam, no, reference | 须 verified | 须 permitted |

---

## C. 方法标签结构

**确认采用两表**（对标 KP；不改 KP 表；不用化学表）：

### `hs_math_methods`

`code` UNIQUE、`name`、`summary`、`sort_order`、`is_active`、时间戳。

### `hs_math_train_item_methods`

`(item_id, method_id)` UNIQUE；`is_primary`；`sort_order`；  
FK：`item` ON DELETE CASCADE；`method` **无 ON DELETE CASCADE**（禁止硬删仍被引用的方法 → 应用层只允许 `is_active=0`）。

### 规则

| 规则 | 约定 |
|---|---|
| 主方法 | 应用层保证每题 **至多 1** 个 `is_primary=1`（与 KP 相同，可用部分唯一索引或保存前校验） |
| 排序 | `sort_order` 升序；写入时按数组序 ×10 |
| 改名 | 只改 `name`：**指纹不变**（指纹用 **code**） |
| 改 code / 换关联 | 指纹变 → 须 version+1 |
| 删除方法 | 软停用；有关联时拒绝硬删 |
| 历史训练 | CORE-1A **不强制** session 快照方法；学生展示方法仅 approved 当前题。若需历史不变，CORE-3 前可加 session 快照列（本阶段不扩） |
| 跨章 | 词典全局（数学模块内），不绑定 specialty |

---

## D. 审核指纹调用链（详）

见 §A.4。补充：

1. **当前指纹字段**（Q1）：`code, specialtyCode, categoryCode, qtype, difficulty, stem, options, answerPayload, analysis, knowledgePointCodes(sorted), primaryKnowledgePointCode, pool:'formal'`。  
2. **difficulty**（Q2）：`update` 中 `isSubstantiveTrainItemChange.difficulty` → `content_version+1`。  
3. **KP**（Q3）：`replaceKnowledgePoints` 事务内 **总是** `content_version+1`（不论内容是否语义相同）。  
4. **来源**（Q4）：扩展 `canonicalizeImportItem` + `fingerprintTrainItemContent` + `computeItemContentFingerprint` 读列；`isSubstantive` 增加 source_*。  
5. **方法**（Q5）：指纹增加 `methodCodes: string[]`（排序）+ `primaryMethodCode: string`；由关联表加载，对标 KP。  
6–7. **事务**（Q6/Q7）：现状 **update 与 replaceKP 分离**；方法关联必须新 API `PUT :id/methods` 仿 KP（事务+行锁+version+1）。**来源+方法同提交**须新聚合 API（见 §F），禁止前端两次调用冒充原子。  
8. **STALE**（Q8）：面板 `isStale = !(sameVer && fpOk)`；`summarizeCurrentReview`。  
9. **批准**（Q9）：`evaluateLatestReviewForPublish`：同 version 最新 passed 且 fp 匹配 + confirmPublish。  
10. **导入**（Q10）：协议扩展可选 source/methods；confirm 写入列与关联；幂等比对扩指纹字段。  
11. **旧题无字段**（Q11）：DB 默认值；canonicalize 缺省与默认一致。  
12. **批量升版本**（Q12）：**禁止**。迁移只加列/表；**不** `UPDATE content_version`。  
    - **注意**：指纹**代码**上线后，重算结果会因新增键而变化 → 若已有 passed，会 STALE。当前 reviews=0，风险低。策略：稳定默认规范化；上线说明「指纹算法扩展日」；不为此批量改 version。

---

## E. 新旧指纹兼容策略

规范化函数伪代码要点：

```
source_type = trim || 'original'
verification = trim || 'unverified'
license = trim || 'unknown'
year/exam/no/reference/note = trim || ''（空串而非省略键，保证 stableStringify 稳定）
methodCodes = sorted codes from links（无关联 → []）
primaryMethodCode = primary?.code || ''
```

- 旧行迁移后 DB 默认 = 规范化默认 → **与「无来源语义」一致**。  
- 部署指纹新代码瞬间：相对**旧算法**指纹值变化；因无审核行，无 STALE 包袱。  
- 若未来有 passed：扩展指纹前应先完成/作废旧审核，或接受重新审核（文档声明）。

---

## F. 事务原子性设计

### 最小改造（CORE-1A 实施时）

1. **新增** `PUT /hs-math/admin/train-items/:id/methods`  
   - 复制 `replaceKnowledgePoints`：事务、`pessimistic_write`、删插、`content_version+1`、approved→draft。  
2. **扩展** `PATCH :id`：支持 source_*；纳入 `isSubstantive`；**建议**改为事务内锁行（与批准一致），避免与 methods 并发丢更新。  
3. **新增聚合（推荐）** `PUT /hs-math/admin/train-items/:id/content-meta`  
   Body：`{ source?: {...}, methodIds?: string[], primaryMethodId?: string }`  
   单事务：锁行 → 更新 source 列 → 替换 methods → **至多 +1 次** version → 返回新 version/fingerprint。  
   避免「先 PATCH 来源 version=2，再 PUT 方法 version=3」双跳。

失败：事务回滚 → version 与关联均不变（Q7 满足）。

导入 confirm：已有事务写 items+kps；扩展为同事务写 source 列 + methods 关联。

---

## G. 并发与行锁

| 场景 | 方案 |
|---|---|
| 两管理员改同一题 | `SELECT … FOR UPDATE`（pessimistic_write） |
| 导入 confirm vs 编辑 | confirm 幂等按指纹；冲突 → Conflict，不部分写入 |
| 审核提交 vs 编辑 | 提交带 `expectedContentVersion`/`Fingerprint` → 409 |
| 批准 vs 编辑 | 批准锁行；编辑后 version 变 → 旧 passed 失效 |
| 重复 PUT methods | 幂等全量替换；version 仍 +1（与 KP 现状一致；可选：语义相等则不升级——**增强项**，CORE-1A 可先保持「总是+1」简单） |

`PATCH` 现状无 expectedVersion → CORE-1A 建议聚合 API 增加可选 `expectedContentVersion` 乐观校验。

---

## H. 发布许可门禁

在 `publishWithHumanReviewGate` / `assertApproveQualityGate` 增加：

```
if pool==formal && status→approved:
  if source_type in (adapted, past_exam):
    require verification==verified
    require license==permitted
    require year, exam_name, question_no, reference non-empty
    if adapted: require adaptation_note
  if license==forbidden: reject always
  if source_type==original && license in (restricted, forbidden): reject
```

`original + unverified + unknown`：**允许**批准（兼容旧题），审核意见中建议人工注明「来源未核实」。

学生接口：仅 `approved` 题返回来源**粗粒度**标签；不返回 `source_reference` 原文链接（或仅 verified+permitted 的脱敏文案）。

---

## I. 批量导入兼容

扩展 `HsMathImportItem`（均可选）：

```ts
sourceType?, sourceYear?, sourceExamName?, sourceQuestionNo?,
sourceReference?, sourceAdaptationNote?,
sourceVerificationStatus?, sourceLicenseStatus?,
methodCodes?: string[], primaryMethodCode?: string
```

- 缺省 → DB/规范化默认（original/unverified/unknown，无方法）。  
- preview：校验枚举与 adapted/past_exam 必填；未知 method code → error。  
- confirm：写入列 + 解析 method codes → 关联；禁止客户端传 status/version。  
- 幂等：`assertExistingMatchesImport` 扩 source 规范化字段 + method codes。

---

## J. 管理员 API 设计

| API | 动作 | 事务 | 说明 |
|---|---|---|---|
| `GET/POST/PATCH /admin/methods` | 词典 CRUD | 单行 | 禁硬删有引用 |
| `GET /admin/methods` 列表 | 只读 | 否 | |
| `PUT /admin/train-items/:id/methods` | 替换关联 | **是+锁** | 仿 KP |
| `PATCH /admin/train-items/:id` | 扩 source_* | **建议锁** | substantive |
| `PUT …/content-meta`（推荐） | 来源+方法原子 | **是+锁** | 单次 version+1 |
| 审核面板/队列 | 展示 source + methods | 否 | 只读 |
| 批准 | 许可门禁 | 已有事务 | 扩规则 |
| 导入 preview/confirm | 扩字段 | confirm 事务 | |

学生：`GET` 题目详情/会话 reveal 后可带 `sourceLabel` + `methods[{code,name,isPrimary}]`；draft 不经学生公开列表。

---

## K. 迁移说明

草案文件：`db/migrate_hs_math_p1_func_core1a.sql`（**DRAFT_NOT_EXECUTED**）。

- 扩展 8 个 source 列 + 索引  
- 建 `hs_math_methods`、`hs_math_train_item_methods`  
- **不**改 content_version  
- **本阶段不改** `db/init.sql`（实施授权时同步回写）  
- 执行前：确认 `DATABASE()=study_system`；备份 `hs_math_*`  
- 回滚：DROP 两表；DROP 新增列（须无依赖代码已上线）

---

## L. 测试矩阵（设计；本阶段不跑写库）

| # | 用例 | 期望 |
|---|---|---|
| 1 | 旧题读出默认来源 | original+unverified+unknown；version 不变 |
| 2 | 新建 original | 可保存；指纹含默认 source |
| 3 | adapted 缺字段 | 400 |
| 4 | past_exam 缺年份 | 400 |
| 5 | adapted+unknown license 批准 formal | 拒绝 |
| 6 | 重复 method 关联 | UNIQUE 或 400 |
| 7 | 两个 primary | 400 |
| 8 | 改 methods | version+1；旧 passed STALE |
| 9 | 改 source_type | version+1 |
| 10 | 审核 STALE 展示 | isStale true |
| 11 | 有效 passed+许可 批准 | OK |
| 12 | 导入无新字段 preview | OK 默认 |
| 13 | confirm 指纹冲突 | 整批中止/回滚 |
| 14 | 并发 content-meta | 串行锁；后写成功或 409 |
| 15 | methods 失败回滚 | version 不增 |
| 16 | 历史 session_items | 行内容不变 |
| 17 | 学生只能看自己会话 | user_id |
| 18 | 化学模块冒烟 | 无回归 |

写库测试须另授权；用 test 池/可控 code；测后清理；不污染 approved。

---

## M. 回滚方案

1. 代码回滚至不含新指纹字段的版本。  
2. DB：DROP 关联表与 methods；DROP source 列（若已迁）。  
3. 若已产生新 version 的编辑：保留数据，勿强行改回 version 数字。  
4. 备份恢复：仅授权下对 hs_math 子集。

---

## N. 风险清单

1. 指纹算法扩展导致未来 passed 一次性 STALE（当前 reviews=0 可接受）。  
2. `PATCH` 无锁与 `PUT methods` 并发 → 须聚合 API 或锁 PATCH。  
3. KP「总是+1」模式用于 methods 可能过度升版本 → 可后续加语义相等短路。  
4. original+unverified 允许批准 vs 许可严格性的产品权衡（已选兼容旧题）。  
5. ADD COLUMN 非幂等 → 实施脚本需预检。  
6. 方法硬删误用 → FK 无 CASCADE + 应用禁删。

---

## O. 待授权操作

1. 执行 `migrate_hs_math_p1_func_core1a.sql`（及回写 `db/init.sql`）。  
2. 实施 CORE-1A 业务代码（实体/DTO/指纹/API/前端）。  
3. 方法词典种子数据。  
4. 任何写库集成测试。  
5. 批准题目 / 写审核（仍禁止本阶段）。

---

## P. CORE-1A 下一步实施顺序

1. 用户授权迁移 → 执行 DDL → 验证默认值与 version 未批量变化。  
2. 实体 + constants 枚举 + canonicalize/指纹扩展 + selftest。  
3. `PUT methods` + 扩 `PATCH` source + **content-meta 聚合**。  
4. 批准许可门禁。  
5. 导入协议与幂等。  
6. 管理端 UI：来源表单、方法多选、审核展示。  
7. 回归：api build + 指纹 selftest；可选授权后 IT。  
8. 更新 HANDOFF；再开 CORE-1B（增强解析）。

---

## 附录 · Q1–Q12 短答

| Q | 答 |
|---|---|
| Q1 | 见 §D：题干答案难度分析 KP 等（现无 source/methods） |
| Q2 | substantive.difficulty → version+1 |
| Q3 | replaceKnowledgePoints 事务内 version+1 |
| Q4 | 入 canonicalize；缺省稳定默认 |
| Q5 | methodCodes+primaryMethodCode 入指纹 |
| Q6 | 须 content-meta 或同事务；现状两 API 不够 |
| Q7 | 同事务则回滚；分 API 则不能 |
| Q8 | version/fp 不一致 → isStale |
| Q9 | evaluateLatestReviewForPublish |
| Q10 | 协议可选字段；confirm 写列+关联；幂等扩 fp |
| Q11 | DB 默认 + canonicalize 默认一致 |
| Q12 | **不**批量升版本 |

---

**本阶段结论目标：PASS（设计与草案完整；零写入零改代码）。**
