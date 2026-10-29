# STEP_09 · 后台审核与正式入库

| 字段 | 内容 |
|------|------|
| 步骤编号 | STEP_09 |
| 步骤名称 | 后台审核与正式入库 |
| 开发目标 | 接入现有管理员审核闸门并正式入库（含题-SVG 绑定） |
| 前置条件 | STEP_08 质检能力可用 |
| 当前状态 | **COMPLETED** |
| 完成时间 | 2026-10-29 10:01:15 +08:00 |

---

## D043 数据库绑定续做记录

| 项 | 内容 |
|----|------|
| 用户批准 | D043 方案 C → **D043-APPROVED**（保留 PROPOSED 历史） |
| 新表 | `chem_train_item_assets` |
| init.sql | 已同步 |
| 迁移 | `db/migrate_chemistry_industrial_train_item_assets.sql`（**未**自动对未知库执行） |
| Entity | `ChemTrainItemAsset` + module 注册 |
| 正式入库 | 事务写 item+asset；移除 `SVG_DB_BINDING_PROPOSED` |
| 闸门 | draft/mock/dev/未审核/质检失败等**全部保留** |
| formalAllowed | 仍为 false（D044） |
| MySQL 集成 | **代码完成；真实库迁移/IT 未执行** |

---

## 实际完成内容

1. 候选审核状态机 + 管理 API + 管理端 UI  
2. 不可变 SVG + 安全校验  
3. 正式入库闸门 + Nest 事务写入服务  
4. 题图资源查询 API  
5. 自检：review / item-asset / quality / ai / svg / diagram / case / seed  
6. api/web build 通过  

---

## 测试命令

```bash
pnpm --filter api run chem:industrial-item-asset-selftest
pnpm --filter api run chem:industrial-review-selftest
pnpm --filter api run chem:industrial-quality-selftest
pnpm --filter api run chem:industrial-ai-selftest
pnpm --filter api run chem:industrial-svg-selftest
pnpm --filter api run chem:industrial-diagram-selftest
pnpm --filter api run chem:industrial-case-selftest
pnpm --filter api run chem:seed-selftest
pnpm --filter api run build
pnpm --filter web run build
```

---

## 验收

STEP_09 完成条件已满足（含 D043）。  
未启动 STEP_10（训练会话 / 判题 / 每日训练 / 错题流转未改）。

---

## 下一步

**STEP_10**：工业实验前端训练集成（会话图形快照、学生端安全 Public、作答判题、历史与错题）。
