# P1-0F-C3B：审核表结构、指纹与批准门禁

> 本阶段：**代码 + 迁移 SQL 已准备**；迁移 **NOT_EXECUTED**。  
> 未批准任何题目；未插入审核记录。

## 1. 批准入口审计

| 路径 | 类型 | 处理 |
|------|------|------|
| `PATCH /hs-math/admin/train-items/:id/status` → `approved` | **生产写入** | 已改为 `publishWithHumanReviewGate`（事务锁 + 质量门禁 + 有效 passed + confirmPublish） |
| `POST /hs-math/admin/train-items` 创建 | 仅写 `draft` | DTO 无 status 字段 |
| `PATCH /hs-math/admin/train-items/:id` 更新 | 禁止 body.status | 明确报错 |
| `POST .../import/confirm` | 仅 draft | 未改，仍禁止 approved |
| `HsMathTrainItemsAdminView`「批准」 | 前端触发 | 二次确认 + `confirmPublish:true`；最终仍靠后端门禁 |
| IT/E2E 脚本直接 SQL 或 status | 测试脚本 | 仅本地/受控；不改生产流程 |
| 学生抽题 | 只读筛选 approved | 不写入 |

**结论**：正式 HTTP 批准唯一入口为 status→approved，且必须过统一审核门禁。前端隐藏不是安全措施。

## 2. 数据库结构

表：`hs_math_train_item_reviews`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT UNSIGNED AI PK | |
| item_id | BIGINT UNSIGNED NOT NULL | FK → hs_math_train_items(id) RESTRICT |
| content_version | INT NOT NULL | |
| content_fingerprint | CHAR(64) NOT NULL | SHA-256 hex |
| reviewer_user_id | BIGINT UNSIGNED NOT NULL | FK → users(id)；来自 JWT |
| review_status | VARCHAR(32) | passed / rejected / deferred |
| review_comment | TEXT NOT NULL | |
| reviewed_at | DATETIME(3) NOT NULL | 服务端 |
| created_at | DATETIME(3) | |

索引：`(item_id, reviewed_at)`、`(item_id, review_status, reviewed_at)`、`(reviewer_user_id, reviewed_at)`。

**不**改 users 表；**不**插入种子审核数据。

## 3. 迁移 SQL 审计

| 项 | 说明 |
|----|------|
| 文件 | `db/migrate_hs_math_p1_0fc3b.sql` |
| init 同步 | `db/init.sql` 已追加同表 |
| 幂等 | `CREATE TABLE IF NOT EXISTS` |
| 其他模块表 | 无 |
| 改已有数据 | 无 |
| 假审核 INSERT | 无 |
| 回滚 | `DROP TABLE hs_math_train_item_reviews`（需另授权） |
| 备份 | 执行前建议备份 study_system |
| **状态** | **NOT_EXECUTED** |

## 4. 审核指纹

- 工具：`fingerprintTrainItemContent`（`hs-math-item-content-fingerprint.ts`）  
- 复用：`canonicalizeImportItem` + `fingerprintCanonicalItem` + `validateAnswerPayload`  
- 覆盖：code / specialty / category / qtype / difficulty / stem / options / answer / analysis / KP 列表 / 主 KP  
- 审核提交与批准时均在服务端重算；不信任前端指纹。

## 5. 审核记录规则

- `POST .../train-items/:id/reviews`：Admin only；审核人=`JWT.sub`；时间服务端；意见必填；追加历史不覆盖。  
- 锁题目行后写记录；**不**改 `items.status`。  
- 客户端传 `reviewerId` / `reviewedAt` → 400。  
- 表缺失 → fail-closed 报错。

## 6. 统一批准门禁

位置：`HsMathAdminTrainItemsService.publishWithHumanReviewGate`

顺序：

1. 事务 + `FOR UPDATE`  
2. 原 `assertApproveQualityGate`  
3. 服务端重算指纹  
4. 读审核历史；缺表 → 拒绝批准  
5. `evaluateLatestReviewForPublish`：当前 version 最新一条须 `passed` 且指纹一致、意见/人/时间有效、`confirmPublish=true`  
6. 写 `status=approved`，`reviewed_*=发布人`

最新有效结论规则：同 `content_version` 下按 `reviewed_at DESC` 取最新；非 passed 禁止批准。

## 7. 旧入口防绕过

| 检查 | 结果 |
|------|------|
| status→approved 走新门禁 | PASS |
| 无审核/指纹漂移拒绝 | PASS（逻辑自检） |
| import 不批准 | PASS |
| create/update 不能指定 approved | PASS |

## 8. 缺表兼容

- `synchronize: false`；注册 Entity **不**自动建表。  
- Nest 启动不因缺表而失败（仅查询时失败）。  
- 批准/提交审核：识别 `ER_NO_SUCH_TABLE` → **fail-closed** 明确错误，**不**退回旧批准逻辑。  
- 化学/登录/其他模块：未改公共模块。

## 9. 测试结果

见实施报告（同期执行）。

## 10. 迁移执行前置条件

1. 备份 `study_system`。  
2. 用户明确授权执行 `migrate_hs_math_p1_0fc3b.sql`。  
3. 确认 API 已部署含门禁代码。  
4. 执行后验证表存在；抽查 80 题仍为 draft、approved=0。  
5. 再进入工作台/具名审核阶段。

## 11. 下一阶段建议

**READY_FOR_MIGRATION_REVIEW** — 可请用户审查并授权执行迁移；之后 C3C 审核工作台 UI。
