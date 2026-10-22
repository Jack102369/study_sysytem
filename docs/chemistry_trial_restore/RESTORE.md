# AI 试用发布 · 回滚说明

> 本目录备份用于**可回滚测试**。回滚后 239 条应回到 `pending_review`，试运行训练题删除。

## 备份内容

由 `backup.js` 生成 `snapshot_<ISO时间>/`：

| 文件 | 内容 |
|------|------|
| `manifest.json` | 条数摘要 |
| `kb_all.json` | 8 类知识全文 |
| `kb_status_index.json` | 全部 id→status/review_note（回滚主依据） |
| `published_19_snapshot.json` | 备份时已 published 条目 |
| `links.json` | 专项/分类关联 + reaction species |
| `train.json` | chem_train_* 全表 |
| `chemistry_kb_inventory.json` | inventory 副本 |
| `publish_whitelist.json` | 239 白名单副本 |

最新快照路径写在 `LATEST_SNAPSHOT.txt`。

## 标准回滚（推荐）

```bash
# 恢复全部知识 status/review_note + 删除 train.ai_trial.* 题目
node docs/chemistry_trial_restore/restore.js

# 指定快照
node docs/chemistry_trial_restore/restore.js --snapshot=snapshot_2026-10-18T...

# 同时删除备份之后新建的训练会话
node docs/chemistry_trial_restore/restore.js --full-train
```

回滚后请抽查：

1. `SELECT status, COUNT(*) FROM chem_elements GROUP BY status`（及各表）— 239 应回到 pending_review  
2. `SELECT COUNT(*) FROM chem_train_items WHERE code LIKE 'train.ai_trial.%'` → 0  
3. 原 published 条数与 `published_19_snapshot.json` 一致，正文未被本流程改写  

## 注意

- 默认回滚**只恢复 status/review_note**，不覆盖知识科学正文（试用发布本就不改正文）。  
- 若人工在试用期间改过正文，需对照 `kb_all.json` 人工决定是否覆盖。  
- 关联表（specialties/categories）试用发布不修改；无需回滚关联。  
- 旧 9 道 `train.test.*` 种子题不会被删除。
