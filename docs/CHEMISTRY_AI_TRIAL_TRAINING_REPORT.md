# 化学知识库 · AI 试用发布与本地规则出题报告

> 日期：2026-10-18  
> **性质：可回滚测试发布，不是人工学科审核完成，不是正式对学生上线。**

机器可读：

- `docs/chemistry_trial_restore/verify_result.json`
- `docs/chemistry_trial_restore/admin_session_smoke.json`
- `docs/chemistry_trial_restore/LATEST_SNAPSHOT.txt`

---

## 1. 备份与回滚

| 项 | 结果 |
|----|------|
| 备份路径 | `docs/chemistry_trial_restore/snapshot_2026-10-18T12-45-52-139Z/` |
| 回滚说明 | `docs/chemistry_trial_restore/RESTORE.md` |
| 回滚命令 | `node docs/chemistry_trial_restore/restore.js` |
| 备份校验 | kbTotal=**377**；原 published=**19**；train_items=9 |

备份含：知识全文、status/review_note 索引、专项/分类关联、reaction species、原 19 条快照、chem_train_*、inventory、白名单副本。

---

## 2. 239 条白名单试用发布

| 项 | 结果 |
|----|------|
| 白名单来源 | `publish_whitelist.json`（DeepSeek 初审 PASS_PUBLISH） |
| 实际试用发布 | **239 / 239** |
| review_note 标记 | `[ai_trial][human_unreviewed][trial_run][source:deepseek_r1]` |
| verifyNeeded 23 条 | **未发布**（泄漏=0） |
| 原 19 条 published | **正文未改**、未打 ai_trial 标 |
| REJECT `q.substance.NaOH` | 不在白名单，未误发 |

管理端展示：**「AI初审通过 · 待人工复核 · 试运行」**（非「人工审核通过」）。

### 第二轮复核风险（仍按指令纳入试用发布）

第二轮 `NEEDS_FIX` **11** 条已试用发布，但**未**对其生成依赖氧化产物/还原产物唯一答案的题：

`rxn.2Na2O2_2H2O`, `rxn.2Na2O2_2CO2`, `rxn.2Al_6HCl`, `rxn.3Fe_2O2`, `rxn.Fe_H2SO4`, `rxn.Cu_2H2SO4`, `rxn.C_2H2SO4`, `rxn.N2_3H2`, `rxn.Cu_4HNO3`, `rxn.Cu_4HNO3c`, `exp.CO2_prep_marble`

第二轮另有 `NEEDS_VERIFICATION` 109、`READY_FOR_HUMAN_APPROVAL` 119（见 `CHEMISTRY_DEEPSEEK_SECOND_REVIEW_REPORT.md`）。

---

## 3. 隔离机制

| 通道 | 行为 |
|------|------|
| 学生 KB API（publishedOnly） | 排除 `review_note` 含 `[ai_trial]` / `[trial_run]` |
| 学生可见 published | 仍为 **19** |
| 试运行题 | `chem_train_items.pool=test`，code=`train.ai_trial.*` |
| 正式题池 approved | **0** |
| 旧测试种子 | `train.test.*` **9** 道保留，不计入正式统计 |
| 训练设置文案 | 管理员可见「AI试运行训练」 |

普通学生正式训练：无已人审正式题 → 仍提示暂无已审核题目。

---

## 4. 本地规则出题

- **未**调用 DeepSeek 出题。  
- 确定性模板；跳过 FIX 高风险与答案不唯一条目。  
- 题干前缀 `【AI试运行】`；`gate_note` 含来源编码。

| 指标 | 数量 |
|------|------|
| 生成题目 | **51** |
| 单选 | 14 |
| 判断 | 25 |
| 填空 | 12 |
| 覆盖一级专项 | **7**（memory, ion, redox, equation, experiment, calculation, substance） |
| 覆盖二级分类 | **11** |

---

## 5. 管理员流程验证

DB 级冒烟（`admin_session_smoke.js`）：

- 选取 5 道 `train.ai_trial.*`  
- 创建 `pool_mode=test` 会话，`counts_formal_stats=0`  
- 判题 correct=5  
- 冒烟会话已清理  

结论：**管理员全流程通过**（库级）。HTTP 需管理员登录前端：专项 → 训练设置 → 选「AI试运行训练」→ 答题提交。

---

## 6. 验收对照

| # | 项 | 结果 |
|---|----|------|
| 1 | 备份完整+回滚说明 | 通过 |
| 2 | 239 精确试用发布 | 通过 |
| 3 | verifyNeeded 未动 | 通过 |
| 4 | 原 19 未改 | 通过 |
| 5 | 管理端 AI 试运行标签 | 已加 |
| 6 | 本地生成可答题 | 51 道 |
| 7 | 管理员完整训练 | 通过（DB 冒烟） |
| 8 | 普通学生隔离 | 通过 |
| 9 | 答案未进题干泄露 | 通过 |
| 10 | 未改密码/他学科 | 是 |

---

## 7. 已知风险与后续建议

1. 11 条第二轮 FIX 知识已试用发布 → 人工优先整改氧化还原产物字段后再开放相关题型。  
2. 109 条 VERIFY 亦在试用集中 → 人工抽检教材口径后再转正式人审发布。  
3. 试运行题仅 7/12 专项有覆盖 → 后续可扩展有机/结构/推断等安全模板。  
4. **不建议**直接对普通学生批量正式发布；先人工审核 READY 子集。  
5. 回滚：`node docs/chemistry_trial_restore/restore.js`（必要时加 `--full-train`）。

---

## 8. 代码改动摘要

- `apps/api/.../chem-kb.service.ts`：学生端过滤 ai_trial  
- `apps/web/.../ChemistryKbAdminView.vue`：试运行标签  
- `apps/web/.../ChemistryTrainSetupView.vue`：AI试运行训练文案  
- `docs/chemistry_trial_restore/*`：备份/发布/出题/校验/回滚脚本  
