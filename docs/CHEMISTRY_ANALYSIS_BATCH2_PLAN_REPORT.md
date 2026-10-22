# 第二批解析升级 · Phase1 计划与干跑报告

> 日期：2026-10-20  
> 状态：**只读完成 · 未写库**  
> 写库须单独确认。

---

## 一、范围与排除

| 排除项 | 数量 | 说明 |
|--------|------|------|
| 首批已更新 | 48 | `first_update_whitelist.json` |
| s60 | （池外） | 本批候选不包含 |
| 题干残缺（易错短句模板） | 26 | 含 215、250；见 `batch2/truncated_stem_scan.json` |
| ID215 / ID250 | 2 | 专项风险报告见下 |

候选池约 **524**（574 − 48 − 残缺重叠等）→ 本批选出 **120**。

---

## 二、ID215 / ID250 与同类残缺

- 风险报告：`docs/CHEMISTRY_QUESTION_215_250_RISK_REPORT.md`
  - **215**：FIXABLE（补全浓度 V 含义题干 + 建议调至 calculation/amount）；关联知识正确
  - **250**：FIXABLE（补全卤族氧化性记反命题）；来源 `kb_pending`
- 同类残缺清单：`docs/chemistry_analysis_upgrade/batch2/question_risks.json`（26 道）
- **本阶段均未改题干 / 答案 / 专项 / 准入**
- 修题干或 block 须**单独确认**（与本批 analysis 更新分开）

---

## 三、第二批选样（120）

| 项 | 值 |
|----|-----|
| 数量 | 120 |
| 一级专项 | **11**（equation/redox/ion/calculation/experiment/substance/memory/periodic/structure/organic/comprehensive） |
| 难度 | 基础 d1 **72** / 提高 d2 **48** |
| 原解析 A 级 | 106 |
| 文件 | `batch2/selected120.json` |

选样分布（选中时）：equation28 / redox36 / ion9 / calculation3 / experiment4 / substance9 / memory10 / periodic8 / structure3 / organic1 / comprehensive9。

---

## 四、候选生成与核验

| 阶段 | 结果 |
|------|------|
| 规则生成候选 | 120 |
| DeepSeek 辅助 | **120/120**（failed 0）；**≠人审** |
| 整改前评级 | PASS 82 / NEEDS_FIX 34 / HOLD 4 / REJECT 0 |
| 简易整改 | 补答案行 / 补易错点 / 氧化还原「属于」焦点等 |
| **终检白名单** | **PASS 116**（可更新） |
| HOLD 不出白名单 | **4**（ID 50, 379, 398, 401） |

HOLD 原因摘要（DeepSeek：答非所问 / 科学风险）：

| ID | 问题 |
|----|------|
| 50 | 题干考得失电子守恒，解析误做成「是否属于氧化还原」 |
| 379 | `rxn_not_marked_redox`：误套还原剂模板；Al₂O₃+HCl 非氧化还原 |
| 398 / 401 | 同上模板错位（乙烯加成类「证据不足」题） |

清单：`batch2/quality_results.json`；HOLD 不进入 `whitelist.json`。

---

## 五、白名单与干跑（未写库）

| 项 | 值 |
|----|-----|
| 白名单 | **116** |
| 仅字段 | `analysis` |
| 干跑 WOULD_UPDATE | **116** |
| 冲突 | **0** |
| 幂等已新 | 0 |
| 真实备份 | `batch2/batch2_backup/`（SELECT 落盘，非 UPDATE） |

白名单难度：d1 **71** / d2 **45**。  
专项（白名单）：equation25 / redox35 / ion9 / calculation3 / experiment4 / substance9 / memory10 / periodic8 / structure3 / organic1 / comprehensive9。

产物：

- `batch2/candidates120.json`
- `batch2/quality_results.json`
- `batch2/whitelist.json`
- `batch2/dryrun.json`
- `batch2/question_risks.json`
- `batch2/summary.json`
- `batch2/batch2_backup/`

脚本：`batch2/phase1_pipeline.js`（`--skip-deepseek` 可跳过 API）；HOLD 修正：`batch2/fix_whitelist_holds.js`。

---

## 六、保护与回滚预案（写库后）

与首批相同策略：

- `WHERE id=? AND code=? AND analysis=<原值>`
- 冲突跳过，不强制覆盖
- 备份可回滚至 `original_analyses.json`
- 旧会话 `session_items.analysis` 快照不受影响

**写库脚本尚未执行**（待你确认后再做 `apply_batch2_update.js`）。

---

## 七、待你确认的事项（分开）

1. **215/250（及可选其余残缺题）**：按风险报告修题干/调专项，或先 `trial_access:block`
2. **第二批 analysis 更新**：是否对白名单 **116** 道执行 UPDATE（仅 analysis）
3. HOLD 四题：是否人工重写后再单列小批

本阶段 **数据库零写入**。
