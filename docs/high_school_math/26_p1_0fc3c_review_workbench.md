# P1-0F-C3C：高一数学管理员人工审核工作台

**阶段**：工作台 API + 前端 + 自检。  
**数据库**：仅 `study_system`。本阶段 **未** 对 80 道正式题写审核、**未** 批准任何题、**未** 迁移。

---

## 1. API 实现

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/hs-math/admin/train-items/review-queue` | 分页队列；默认 `status=draft`、`pool=formal`；排除 test |
| GET | `/hs-math/admin/train-items/:id/review-panel` | 完整题目 + 指纹 + 历史 + canPublish 提示 |
| POST | `/hs-math/admin/train-items/:id/reviews` | 追加审核；必填 `expectedContentVersion` + `expectedContentFingerprint`；冲突 **409** |
| PATCH | `/hs-math/admin/train-items/:id/status` | `approved` 仍走 `publishWithHumanReviewGate`（统一门禁） |

权限：一律 `JwtAuthGuard` + `AdminGuard`。

提交规则：

- `reviewer_user_id` ← JWT.sub；`reviewed_at` ← 服务端  
- 仅 **draft + formal + active** 可提交；test / disabled / approved 拒绝  
- **只 INSERT** 审核行；**不改** `items.status`  
- 排序：`reviewed_at DESC, id DESC`

---

## 2. 前端页面

- 路由：`/settings/hs-math-train-review`（`requiresAdmin`）  
- 菜单：SettingsLayout「高一数学题目审核」  
- 页面：`HsMathTrainItemsReviewView.vue`（左队列 / 右面板）  
- 渲染：`MathStem` + `MathOptionList` + `renderMathHtml`（组件内转义）  
- 发布：独立卡片 + 二次确认 → `publishReviewedTrainItem`（`confirmPublish=true`）  
- 开发备注：0004/0008/0009 静态旗标，文案标明「非数据库人工审核」

---

## 3. 审核 / 发布流程

1. 打开面板 → 服务端算指纹 → 管理员填写意见 → 确认 → POST reviews  
2. 成功提示「人工审核已通过」，**不**提示已发布  
3. 正式批准：仅 `canPublish` 提示可点；后端重新锁行 + 审核门禁 + 质量门禁  
4. 旧题库页「批准」同样走统一门禁，无法绕过

---

## 4. 版本失效

- 绑定 `content_version` + `content_fingerprint`  
- 旧版本 passed → 队列/面板显示 **stale**，`canPublish=false`  
- KP/内容变更升版本或改指纹后旧审核失效，历史行保留

---

## 5. 安全与权限

- USER：无 ADMIN → 403（沿用现有 settings 守卫）  
- 禁止客户端传 reviewerId / reviewedAt  
- 不返回密码哈希 / JWT / 敏感用户字段；审核人展示 nickname

---

## 6. 测试结果

| 项 | 结果 |
|----|------|
| `hs-math:p1-0fc3c-selftest` | PASS |
| `hs-math:p1-0fc3b-selftest` | PASS |
| `hs-math:p1-0d1-selftest` | PASS |
| `hs-math:selftest` | PASS |
| `api build` | PASS |
| `web build` | PASS |
| 真实 MySQL 审核写入 | **NOT_RUN** |
| 浏览器 E2E 操作 | **NOT_RUN** |

---

## 7. 真实数据库状态（只读 SELECT，C3C 完成后）

| 指标 | 值 |
|------|-----|
| train_items | 85 |
| CH01 draft | 80 |
| approved formal | 0 |
| train_item_kps | 121 |
| sessions | 39 |
| session_items | 195 |
| review_records | **0** |
| chem_specialties | 12 |

与 C3B.2 迁移后基线一致。

---

## 8. 未执行项

- 不对 80 道正式题提交审核/发布  
- 不创建替身题做真实写入（待 C3C.1 授权）  
- 不部署、不重启

---

## 9. 下一阶段建议

**P1-0F-C3C.1**：审核工作台真实 HTTP + MySQL + 浏览器验收。  
通过后，管理员可在前端审核第一节 16 道题（仍须单独授权才可正式发布）。
