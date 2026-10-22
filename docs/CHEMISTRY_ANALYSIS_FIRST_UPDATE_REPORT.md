# 首批48道化学题解析正式更新报告

> 日期：2026-10-20  
> 状态：**已完成写库并验收**  
> 范围：仅 `chem_train_items.analysis`（白名单 48 道）

---

## 一、实际更新数量

| 项 | 数量 |
|----|------|
| 候选样本 | 50 |
| 最终白名单 PASS | 48 |
| **实际 UPDATE** | **48** |
| 跳过 / 冲突 | **0** |
| 强制排除（未更新） | **2**（ID 215、250） |

幂等复查：再次执行 → **UPDATED 0 / SKIP_IDEMPOTENT 48**。

脚本：`docs/chemistry_analysis_upgrade/apply_first_update.js`  
结果：`first_update_apply_result.json`

---

## 二、更新前后解析质量

### 更新前（题库字段，本批 48 道）

- 原 analysis 多为「来源 … 字段 …」类 **A 级溯源备注**
- 候选阶段曾有 PASS30 / NEEDS_FIX17 / HOLD3；经整改后 48 道终检 PASS

### 更新后（本批 48 道）

- 库内 `analysis` 与白名单 `newAnalysis` **48/48 一致**
- 学生可见内容含：正确答案依据、关键说明、相关易错点（基础题简洁结构）

全库 574 旧题整体 A/B/C/D 分布**未重新全量扫描**；本批仅替换 48 条字段。粗估：A 类约减少 48（若原文均为 A）。

---

## 三、数据冲突情况

- 更新前复检：白名单与干跑 WOULD_UPDATE 集合一致；ID/code 匹配；原 analysis 与备份一致
- 更新中：条件 `WHERE id=? AND code=? AND analysis=<原值>`；**冲突 0**
- 不含 s60；不含 215/250

---

## 四、幂等验证

| 运行 | UPDATED | SKIP_IDEMPOTENT |
|------|---------|-----------------|
| 首次正式更新 | 48 | 0 |
| `--idempotent-check` | 0 | 48 |

---

## 五、旧快照保护 / 新会话新解析

机制：组卷时拷贝 `analysis` → `chem_train_session_items.analysis`。

冒烟（`first_update_smoke_result.json`，ok=true）：

| 检查 | 结果 |
|------|------|
| 旧 session_item 仍为原 analysis | PASS（多条样例） |
| 新会话快照含新解析 | PASS（如 item 22） |
| 提交后结果页可见解析 | PASS |
| 判题字段存在 | PASS |
| 历史行数未减少 | PASS（sessions 38→39，因隔离账号新建） |
| 未使用 dhm@189.cn | PASS |

---

## 六、题库数量与权限回归

| 指标 | 更新后 |
|------|--------|
| 题库总数 | **638** |
| 个人可训练 | **634** |
| 正式池 | **0** |
| s60 | **60**（解析样本仍在，未被白名单文覆盖） |
| 每日可抽 cand | **574** |
| 无 grant 访问 test | **403** |
| 临时 grant | 冒烟后已撤销 |

---

## 七、回滚方案

```bash
node docs/chemistry_analysis_upgrade/rollback_first_update.js
```

行为：

- 仅处理白名单 48 道
- 仅当当前 `analysis === newAnalysis` 时恢复为备份 `originalAnalysis`
- 若已被他改 → **SKIP_CONFLICT**，不强制覆盖
- 不删题、不改编准入、不改历史快照

备份目录：`docs/chemistry_analysis_upgrade/first_update_backup/`

---

## 八、遗留风险（必须单独处理）

| ID | code | 问题 | 本次 |
|----|------|------|------|
| **215** | `…kp.calc.solution` | 题干「V用溶剂体积」**残缺/歧义** | **未更新** analysis；题干/答案/准入均未改 |
| **250** | `…kp.halogen.compare` | 题干仅「递变顺序记反」，**条件不足** | 同上 |

建议后续：改写题干或暂停试运行抽题（另开任务确认）；**禁止**只用解析掩盖题干问题。

风险记录：`question_risk_list.json` / 干跑报告强制排除节。

---

## 九、未改动字段确认

本批 SQL 仅：

`UPDATE chem_train_items SET analysis=? WHERE id=? AND code=? AND analysis=?`

未修改 stem/options/answer/difficulty/分类/准入/关联/sessions/session_items/权限/积分。  
`updated_at` 可能随行更新（系统审计字段）。

---

## 十、相关文件

| 文件 | 说明 |
|------|------|
| `first_update_whitelist.json` | 48 道白名单 |
| `first_update_quality_results.json` | 终检 |
| `first_update_dryrun.json` / `FIRST_UPDATE_DRYRUN_REPORT.md` | 写库前干跑 |
| `first_update_backup/` | 原文备份 |
| `first_update_apply_result.json` | 写库结果 |
| `first_update_smoke_result.json` | 隔离冒烟 |
| `apply_first_update.js` / `rollback_first_update.js` | 更新与回滚 |
| `smoke_after_update.js` | 冒烟 |

---

## 十一、结论

**48 道合格解析已安全写入题库。**  
旧训练快照保留原文；新训练读取新解析。  
215、250 仍待题干级整改。  
