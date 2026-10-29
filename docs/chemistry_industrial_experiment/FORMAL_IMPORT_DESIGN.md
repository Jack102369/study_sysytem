# 工业实验正式入库与 SVG 存储设计（STEP_09 / D043）

**最后更新：** 2026-10-29 13:28:48 +08:00（PHASE_E2-B2：有效案例审核 + real publish 开关）

## 1. 现有题库结构（已核实）

`chem_train_items`：无 SVG 列。会话 `chem_train_session_items`：**尚无**图形哈希列（STEP_10）。

## 2. formalAllowed

管理列表 API 硬编码 `formalAllowed=false`（AI 试运行保护）。  
工业入库**不**改为 true；独立闸门 + eligibility 字段。

## 3. 方案决策

| 方案 | 结论 |
|------|------|
| A gate_note 仅哈希 | 否决为唯一方案 |
| B assets_json | 否决 |
| **C chem_train_item_assets** | **D043-APPROVED** |
| D attachments | 否决（仍缺题关联） |

## 4. 正式入库流程（已实现）

1. 管理员 JWT + AdminGuard  
2. 闸门：development_only / mock / 审核状态 / 人审 / 质检当前有效 / **有效案例审核**（fixture 可为 draft）/ 来源有效核验 / SVG 安全  
3. 文件系统：不可变 SVG 已存在（或先落盘）  
4. **事务**：`chem_train_items` + **一条或多条** `chem_train_item_assets`（任一资产失败则整单回滚）  
   - 主图：`industrial_flow_svg` / `question_diagram`（sortOrder 0）  
   - 副图（可选）：`industrial_apparatus_svg` / `supporting_diagram`（sortOrder 1，来自 `additionalAssets`）  
5. 更新候选 `reviewStatus=imported` + `importedItemCode`  
6. 返回 itemId / code / assetId / **assetIds[]**  

### E2-B2 dry-run / real publish 隔离

| 条件 | 行为 |
|------|------|
| 默认 / `dryRun≠false` | dry-run，不写库 |
| `dryRun=false` 且无 `confirmRealPublish` | 仍 dry-run / 拒绝真实 |
| env `INDUSTRIAL_FORMAL_REAL_PUBLISH` 关 | 真实请求 → `REAL_PUBLISH_DISABLED` |
| env 开 + `dryRun=false` + `confirmRealPublish=true` | 才注入 `dbWriter` 写库（属 E2-C） |

案例有效审核：`approve_for_publish` 覆盖层授予资格；**不**改写 fixture published。  
质检 `CURR_CASE_TRUST` / `CHEM_SOURCE_VERIFIED` 读 effective；案例变更使候选质检失效。

装置副图闸门：若审核记录声明装置字段，则必须已不可变落盘、通过 SVG 安全，且 `apparatusSafety.blocking` 为空。

**已移除：** `SVG_DB_BINDING_PROPOSED` 阻断。

### 事务与文件系统

- 先写不可变 SVG，再开 MySQL 事务  
- 事务失败：允许留下未引用哈希文件（本步不做 GC）  
- 禁止「有题无图」正式可用状态  

### 幂等（持久化程度）

| 机制 | 跨进程 | 说明 |
|------|--------|------|
| `chem_train_items.code` UNIQUE（含 candidateId） | 是 | 同候选重复导入复用行 |
| `uk_chem_train_item_asset` | 是 | 同题同用途同哈希不重复 |
| 候选 `importedItemCode` + status=imported | 是（文件仓） | 服务重启后仍有效 |
| 进程内锁 | 否 | **未宣称**跨进程仅靠内存锁 |

**说明：** 真实 MySQL 唯一约束需在目标库执行迁移后生效；当前代码层已按该约束编写。

### 入库后字段（闸门全过时）

pool=`formal`，status=`approved`，curriculum_ok=true，verify_blocked=false，ban_default_train=false；gate_note 含 industrial 标记与 svg hash。

## 5. 资源查询（STEP_09）

`GET /chemistry/admin/industrial-candidates/train-item-assets/:trainItemId`  

返回：assetType / assetRole / contentHash / diagramVersion / safeResourceUrl / sortOrder  
**不**返回绝对路径、答案、审核备注。

管理员 SVG：`GET .../svg/:hash`（受控）。  
公开 `/uploads/industrial-svg/` 为内容寻址；SVG 不含答案；学生会话受控读取待 STEP_10。

## 6. 历史训练契约（STEP_10 已落地）

`INDUSTRIAL_SVG_SESSION_CONTRACT` **v1.2**：  
- 表：`chem_train_item_assets` + `chem_train_session_item_assets`  
- `sessionSnapshot = IMPLEMENTED_STEP_10`  
- `publicStaticBlocked = true`（main.ts 对 `/uploads/industrial-svg` 返回 403）  
- 学生读取：`/chemistry/train/sessions/{sessionId}/items/{sessionItemId}/assets/{snapshotId}/svg`

## 7. 迁移执行状态

| 项 | 状态 |
|----|------|
| init.sql | 已含 D043 + D045 表 |
| migrate_chemistry_industrial_train_item_assets.sql | 已创建 |
| migrate_chemistry_industrial_session_item_assets.sql | 已创建（顺序：先 09 后 10） |
| 对真实 study_system / 生产执行 | **未执行** |

## 8. STEP_13 装置图资源（补充）

- `asset_type=industrial_apparatus_svg`（D043 已预留；`DEFAULT_INDUSTRIAL_APPARATUS_ASSET` 默认 supporting_diagram）  
- 与 flow SVG 可同题多图；会话快照仍走 D045  
- Mock 装置候选：`development_only` + `formalImportBlocked`；故意错误样例禁止入库  
- 正式双资源入库事务扩展属后续 IT；本步不写真实库  

## 9. STEP_11 变式与 KB（补充）

- 学生错题「变式训练」：只抽题库中已审核合格变式（原 `createVariationSession`）。  
- 「申请工业 AI 变式候选」：写入 `var/industrial-review`；`formalImportBlocked=true`；须人工审核 + 正式入库闸门后，方可被变式抽题命中。  
- Admin `POST /chemistry/admin/industrial-candidates/kb-bind`：仅绑定 **published** 知识实体到工业题；**不**放宽 eligibility；不伪造审核态。  
- `formalAllowed` 仍恒 false；development_only 不得进正式训练。
