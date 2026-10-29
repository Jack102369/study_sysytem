# STEP_10 · 工业实验前端训练集成

| 字段 | 内容 |
|------|------|
| 步骤编号 | STEP_10 |
| 步骤名称 | 工业实验前端训练集成 |
| 开发目标 | 复用现有化学训练会话；会话图形快照；学生受控 SVG；历史不漂移 |
| 前置条件 | STEP_09 COMPLETED（D043） |
| 当前状态 | **COMPLETED**（代码层；真实 MySQL 迁移/IT **未执行**） |
| 完成时间 | 2026-10-29 10:13:17 +08:00 |

---

## 计划工作（已执行）

1. 核实训练会话/判题/错题/前端契约  
2. 新增 `chem_train_session_item_assets`（D045）  
3. 创建会话时写入多图快照（事务/失败回滚）  
4. 阻断公开 `/uploads/industrial-svg`；会话授权读取 API  
5. 训练页/结果页展示工业图  
6. 自检 + api/web build  
7. 更新文档（NEXT_SESSION 最后）

---

## 实际完成内容

- 复用：`ChemTrainController` / `ChemTrainService` / `gradeAnswer` / wrong 事件；前端 `ChemistryTrainSessionView` / `ChemistryTrainResultView`
- 表：`chem_train_session_item_assets`（init + migrate）
- Entity：`ChemTrainSessionItemAsset`；服务：`ChemTrainSessionDiagramService`
- 专项创建会话：题目快照 + 图形快照同事务
- daily/advanced/wrong_review/wrong_variation：保存 session_items 后补写快照，失败删除会话
- 学生 API：`GET /chemistry/train/sessions/:sessionId/items/:sessionItemId/assets/:assetId/svg`
- 前端：`TrainSessionIndustrialDiagrams.vue` + Blob JWT 拉取
- 公开静态工业 SVG：**403 阻断**
- 判题语义未改；无图题兼容
- 历史无快照：返回 `diagramAssets: []`，不伪造当前图

---

## 已知边界

- 正式池仍要求 eligibility（含 KB links）；工业入库题若无 KB 关联则**不会**进入正式抽题（空态），不放宽闸门
- 错题列表本身无会话快照字段；从**历史会话结果页**进入可还原图；纯错题条目不假装精确历史图（STEP_11 可扩展）
- 真实 MySQL 迁移与 IT：**NOT_EXECUTED**

---

## 测试命令

```bash
pnpm --filter api run chem:industrial-train-session-selftest
pnpm --filter api run chem:industrial-review-selftest
pnpm --filter api run chem:industrial-item-asset-selftest
pnpm --filter api run chem:seed-selftest
pnpm --filter api run build
pnpm --filter web run build
```

---

## 下一步建议

进入 **STEP_11**（每日巩固 / 错题策略 / 变式 / 提高挑战 / 学习分析）。**不要**重复开发 STEP_10 训练基础链路。
