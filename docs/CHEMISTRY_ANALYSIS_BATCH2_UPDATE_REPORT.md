# 第二批 116 道化学题解析正式更新报告

> 日期：2026-10-20  
> 状态：**已完成写库并验收**  
> 范围：仅 `chem_train_items.analysis`（白名单 116 道）

---

## 一、实际更新数量

| 项 | 数量 |
|----|------|
| 白名单 PASS | 116 |
| **实际 UPDATE** | **116** |
| 跳过 / 冲突 | **0** |
| 幂等复查 | UPDATED **0** / SKIP_IDEMPOTENT **116** |

白名单：`docs/chemistry_analysis_upgrade/batch2/update_whitelist.json`  
脚本：`batch2/apply_batch2_update.js`  
结果：`batch2/batch2_apply_result.json`

写前复核：ID/code、原 analysis 与 checksum、非首批48、非 s60、非 13 道 block、非 HOLD(50/379/398/401)、干跑 WOULD_UPDATE=116 / 冲突=0。

---

## 二、更新前后解析质量

### 更新前（本批 116）

- 多为「来源 … 字段 …」类 **A 级**溯源备注（选样时 gradeA 约 106/120）

### 更新后（本批 116）

- 库内 `analysis` 与白名单 `newAnalysis` **116/116** 一致
- 结构含正确答案依据 / 说明 / 易错点（或六段式）

全库 A/B/C/D **未重新全量扫描**；本批仅替换 116 条字段。

---

## 三、跳过与冲突

| 阶段 | 结果 |
|------|------|
| 写前 live 冲突 | **0** |
| 事务内 SKIP_CONFLICT | **0** |
| 整批回滚 | **未触发** |

---

## 四、幂等复查

| 运行 | UPDATED | SKIP_IDEMPOTENT |
|------|---------|-----------------|
| 首次正式更新 | 116 | 0 |
| `--idempotent-check` | 0 | 116 |

---

## 五、备份与回滚

- 写前备份：`batch2/batch2_backup/original_analyses.json`（phase1 落盘）
- 独立回滚：

```bash
node docs/chemistry_analysis_upgrade/batch2/rollback_batch2_update.js
```

回滚规则：

- 仅本批 116
- 仅当当前 `analysis === newAnalysis` 时恢复 `originalAnalysis`
- 冲突跳过，不强制覆盖
- **不影响**首批 48、13 道 block、`gate_note`、历史快照

---

## 六、旧快照 / 新解析 / 训练冒烟

隔离用户：`chem_batch2_upd_smoke@local.test`（**未**使用 dhm@189.cn）  
结果：`batch2/batch2_smoke_result.json`（ok=true）

| 检查 | 结果 |
|------|------|
| 旧 session_item 快照独立 | PASS（多样例仍为旧文） |
| 新会话快照含第二批新解析 | PASS（如 item 313） |
| 提交 / 判题 / 结果页解析 | PASS |
| 首批 48 新解析保持 | PASS（抽样 5/5） |
| s60 七段式仍在 | PASS |
| 每日 status cand | **561** |
| 每日组卷不含 13 block | PASS |
| 新会话不含 13 block | PASS |
| 无 grant → 403 | PASS |
| 历史行数未减少 | PASS（sessions 39→41，因隔离账号新建） |

测试结束后已撤销临时 grant。

---

## 七、与其它批次隔离验证

| 项 | 结果 |
|----|------|
| 首批 48 | analysis 仍为第一批新文（48/48） |
| s60×60 | 未被写成第二批白名单文；数量仍 60 |
| 13 道 stem block | 仍 `[trial_access:block]`；不可训 |
| HOLD 50/379/398/401 | **未修改**（不在白名单） |
| 非白名单题 | 未误写成第二批新文 |

---

## 八、当前题库真实统计

| 指标 | 值 |
|------|-----|
| 题库总数 | **638** |
| 个人可训练 | **621** |
| 正式池 | **0** |
| 每日 cand 约 | **561** |
| s60 | **60** |
| 含 block 标记合计 | 17（历史 4 + 本轮残缺 13） |

---

## 九、遗留风险（本次未改）

| ID | 状态 | 说明 |
|----|------|------|
| 50 | NEEDS_VERIFICATION | Batch2 解析 HOLD：得失电子守恒题套错模板 |
| 379 | NEEDS_VERIFICATION | `rxn_not_marked_redox` 答非所问 / 科学质疑 |
| 398 | NEEDS_VERIFICATION | 同上（乙烯加成类） |
| 401 | NEEDS_VERIFICATION | 同上 |
| 残缺已 block×13 | 已暂停试运行 | 待另批修题干后再恢复准入 |
| FALSE_POSITIVE×13 | 仍可训 | 可选润色题干，非必须 |

供后续单独核实；**不得**与本批 analysis 回滚混操作。

---

## 十、脚本索引

| 文件 | 用途 |
|------|------|
| `batch2/update_whitelist.json` | 正式白名单 |
| `batch2/apply_batch2_update.js` | 更新 / `--idempotent-check` / `--rollback` |
| `batch2/rollback_batch2_update.js` | 回滚入口 |
| `batch2/smoke_batch2_update.js` | 隔离冒烟 |
| `batch2/batch2_backup/` | 原 analysis 备份 |
