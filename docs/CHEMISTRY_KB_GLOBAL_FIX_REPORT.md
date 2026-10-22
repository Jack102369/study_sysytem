# 高一化学知识库 · 377 条全库第一轮质量整改报告

> 依据：`CHEMISTRY_KB_GLOBAL_AUDIT_REPORT.md`、dry-run 计划与用户批准白名单  
> 执行时间：2026-10-18  
> **本报告为 AI 辅助整改记录，不是人工学科审核。**  
> **未自动发布；未开发训练引擎；未做教材口径拍板。**

机器可读：

- `docs/chemistry_global_fix/dry_run_plan.json`
- `docs/chemistry_global_fix/DRY_RUN_REPORT.md`
- `docs/chemistry_global_fix/backup_before_global_fix.json`
- `docs/chemistry_global_fix/apply_result.json`
- `docs/chemistry_global_fix/recheck_result.json`

---

## 1. Dry-run 计划与实际执行差异

| 项目 | Dry-run | Apply 实际 |
|------|---------|------------|
| 计划修改编码 | 37 | **36** |
| 删错误 redox | 10 | **10**（执行） |
| 新增正确 redox | 1（`rxn.C2H4_KMnO4`） | **0**（用户明确不批准） |
| inventory ion 对齐 | 3 | **3** |
| 补 `[inv:]` | 5 | **5** |
| question trainLimit | 17 | **17** |
| `exp.Fe3_SCN` 限制 | 1 | **1** |
| 触及 published | 0 | **0** |

差异唯一项：`rxn.C2H4_KMnO4 → redox` **未执行**，保留现有专项；记入后续评估。

---

## 2. 实际修改知识数量

- **实际修改知识（去重编码）：36**
- **数据库写操作涉及编码：33**（另 3 条仅改 inventory，DB 未写）
- **编码集合：仍为 377，无增删**

---

## 3. 删除 redox 关联结果

已从 DB / inventory / `docs/chemistry_batch3/import_B3-B.json` 删除 **`redox`** 与 **`redox.identify`**，保留 `equation` + `substance`（及原有非 redox 分类）：

| 编码 | 价态依据（摘要） | verifyNeeded |
|------|------------------|--------------|
| `rxn.Na2O_H2O` | 氧化物+水，无价态变化 | 否 |
| `rxn.NaOH_CO2` | 碱吸收 CO₂，无价态变化 | **是**（只改关联） |
| `rxn.NaOH_HCl` | 中和 | 否 |
| `rxn.NaHCO3_heat` | 分解，无价态变化 | 否 |
| `rxn.Na2CO3_2HCl` | 复分解 | 否 |
| `rxn.Al2O3_6HCl` | 氧化物+酸 | 否 |
| `rxn.Al2O3_2NaOH` | 两性氧化物+碱 | **是**（只改关联） |
| `rxn.AlOH3_NaOH` | 两性氢氧化物+碱 | **是**（只改关联） |
| `rxn.AlOH3_3HCl` | 氢氧化物+酸 | 否 |
| `rxn.CuO_2HCl` | 氧化物+酸 | 否 |

未改：方程式、科学正文、审核状态。

---

## 4. 其他关联修复结果

| 编码 | 操作 | DB | inventory |
|------|------|----|-----------|
| `kp.periodic.position` | 去掉误标 `ion` → `periodic`+`structure` | 不变（已正确） | 已改 |
| `kp.calc.concentration` | 去掉误标 `ion` → `calculation` | 不变 | 已改 |
| `kp.calc.dilution` | 去掉误标 `ion` → `calculation` | 不变 | 已改 |

同步：`docs/chemistry_batch2/import_B2-D.json`（若含 specialtyByCode）。

---

## 5. `[inv:]` 补充结果

| 编码 | 结果 |
|------|------|
| `el.Be` / `el.Ar` / `el.Fe` / `el.I` / `el.Cr` | DB `review_note` 已含 `[inv:CODE]`；状态仍为 `pending_review`；化学字段未改 |

同步：`docs/chemistry_batch2/import_B2-A.json`。

---

## 6. question 限制说明结果

17 条 **pending_review** 骨架题已追加：

`[trainLimit:非正式卷库骨架;禁无约束自动组卷判题;引擎未实现前本备注≠访问控制]`

- **未改**题干、标准答案、审核状态  
- **未包含** `q.eq.Na_water`（published）  
- 同步：`import_B5-D.json`、`import_B6-F.json`

**重要**：`reviewNote` / `trainLimit` **不是**已生效访问控制；训练引擎尚未实现，必须在引擎中硬性执行过滤规则。

---

## 7. 23 条待核实保护结果

- inventory `verifyNeeded`：**仍为 23**
- 本轮触及 4 条（仅关联或限制说明）：`rxn.NaOH_CO2`、`rxn.Al2O3_2NaOH`、`rxn.AlOH3_NaOH`、`exp.Fe3_SCN`
- **未取消**待核实标记；**未改**未经核实的化学结论
- `exp.Fe3_SCN`：补充 `待核实…;excludeDefaultUntilVerified` 类限制说明

---

## 8. 19 条 published 保护结果

- published 仍为 **19**
- 复查：正文 / 题干 / 答案 / 审核状态 / 专项关联 **均未变化**
- `q.eq.Na_water`：仅保留训练适配风险记录（生成物题挂 equation；不得作方程式唯一答案自动判题）

---

## 9. 数据库实际修改数量

| 类型 | 数量 |
|------|------|
| DELETE `chem_entity_specialties`（redox） | 10 |
| DELETE `chem_entity_categories`（redox.identify） | 10 |
| UPDATE `review_note`（元素） | 5 |
| UPDATE `review_note`（question） | 17 |
| UPDATE `review_note`（experiment） | 1 |
| DB 写操作涉及知识编码 | **33** |

---

## 10. 导入包同步结果

| 文件 | 同步内容 |
|------|----------|
| `docs/chemistry_batch3/import_B3-B.json` | 10 反应去掉 redox / redox.identify |
| `docs/chemistry_batch2/import_B2-A.json` | 5 元素 reviewNote |
| `docs/chemistry_batch2/import_B2-D.json` | 3 kp specialty |
| `docs/chemistry_batch3/import_B3-C.json` | exp.Fe3_SCN reviewNote |
| `docs/chemistry_batch5/import_B5-D.json` | 8 question trainLimit |
| `docs/chemistry_batch6/import_B6-F.json` | 9 question trainLimit |
| `docs/chemistry_kb_inventory.json` | redox 删除 + ion 对齐；377 不变 |

---

## 11. 377 条复查结果

`recheck_result.json`：**allOk = true**

| 检查项 | 结果 |
|--------|------|
| 377 条全部存在 / 无重复编码 | 通过 |
| 10 条错误 redox 已删 | 通过 |
| 其他专项仍在 | 通过 |
| 3 条 inventory ion 已修 | 通过 |
| 5 条 `[inv:]` 已补 | 通过 |
| 17 条 question 限制已补 | 通过 |
| exp.Fe3_SCN 限制已补 | 通过 |
| 23 verifyNeeded 保留 | 通过 |
| 19 published 未变 | 通过 |
| C2H4_KMnO4 未新增 redox | 通过 |
| B3-B 导入包一致 | 通过 |

---

## 12. 剩余 P0 / P1 / P2 / P3（相对全库核验）

| 级别 | 整改前（问题数） | 本轮处理后估计 |
|------|------------------|----------------|
| P0 | 0 | **0** |
| P1 | 26（多为 scope_verify / 教材核实） | **仍约 26**（未做教材拍板；非新增科学错误） |
| P2 | 46 | **下降**：10 条 redox 误挂 + 相关 link/status 部分已消；实验「书面」展示优化、空分类等仍保留 |
| P3 | 17 | **下降**：17 条 question 已补 trainLimit 说明（备注≠ACL） |

**明确 P1「新科学事实错误」：0**（本轮未发现；剩余 P1 主要为待教材核实）。

---

## 13. 未解决教材争议

仍待教材定点核实（23 条 verifyNeeded），包括但不限于：

铝酸盐表示、生铁/钢含碳量、漂白粉组成、磷及氧化物、滴定管、焰色试验、勒夏特列、裂化/裂解、反应热、原子经济性等。

另：历史关注 `el.Fe` / `el.I` / `el.Cr` 范围口径仍属核实清单侧，本轮只补了 `[inv:]`。

---

## 14. 未解决训练适配风险

1. **`q.eq.Na_water`（published）**：题干为生成物，挂 equation；禁止覆盖；引擎须特殊处理。  
2. **`rxn.C2H4_KMnO4`**：化学上属氧化还原，本轮**未**挂 redox；产物描述性 + 禁唯一产物填空；后续再评估是否挂 redox。  
3. **`rxn.CH4_Cl2` / `C2H4_Br2` / `C2H4_H2`**：教学口径不确定，仅记录。  
4. **60 个空二级分类**：保留，不强行填充。  
5. **reviewNote / trainLimit ≠ 访问控制**；引擎未实现前不得视为已拦截。

### 未来训练引擎必须实现的规则（摘要）

1. 默认排除 `pending_review` 进入正式自动组卷（或仅人工题池）。  
2. `verifyNeeded` / `excludeDefault*` / `trainLimit:` **不得**进入默认核心训练池。  
3. question 骨架（含 trainLimit）禁止无条件自动判题。  
4. `q.eq.Na_water` 不得作为方程式配平/完整方程式唯一答案源。  
5. 非氧化还原反应不得因历史误挂进入 redox 出题池（本轮已清 10 条）。  
6. `rxn.C2H4_KMnO4` 禁止唯一产物填空自动判题。

---

## 15. 回滚说明

| 资源 | 路径 |
|------|------|
| DB 全量行+关联快照 | `docs/chemistry_global_fix/backup_before_global_fix.json` |
| inventory 副本 | `docs/chemistry_global_fix/backup_inventory_before.json` |
| 导入包副本 | `docs/chemistry_global_fix/backup_import_packs/` |

回滚方法：按 backup 中 `specialtyLinks` / `categoryLinks` 恢复 DELETE；按 `entities[].review_note` 恢复 UPDATE；文件用 backup 覆盖。本轮操作均可完整回滚。

---

## 16. 是否具备开发训练引擎基础

**是（有库结构与专项关联基础）**；  
**否（不具备未经人审即正式自动出题上线条件）**。

可开始引擎骨架开发时，必须内置上文「必须实现的规则」。

---

## 17. 是否允许正式发布

**否。** 358 条仍为 pending_review；23 条待教材核实；published 题仍有适配风险。

---

## 18. 总判断

| 问题 | 结论 |
|------|------|
| 本轮是否引入新 P0 | **否** |
| 明确 P1 科学错误剩余 | **0**（剩余为教材核实类） |
| 377 完整 | **是** |
| 19 published 未变化 | **是** |
| 23 verifyNeeded 保留 | **是** |
| DB 与导入包（本轮改动项）一致 | **是** |
| 允许正式发布 | **否** |
| 可开发引擎（带硬限制）基础 | **有结构基础，无上线自动出题条件** |
