# 全库第一轮整改 · Dry-Run 报告

> 生成时间：2026-10-18T11:21:53.349Z
> **本阶段只读：未执行任何 UPDATE/DELETE/INSERT，未改 inventory，未覆盖正式导入包。**
> 训练限制备注 ≠ 已生效访问控制（尚无训练引擎）。

## 1. 汇总

| 指标 | 数量 |
|------|------|
| 计划修改知识（去重编码） | **37** |
| 计划删除错误 redox 关联 | **10** |
| 计划新增正确 redox 关联 | **1** |
| 其他关联修复 | **3** |
| 计划补充 [inv:] | **5** |
| 计划补充 reviewNote/trainLimit | **18** |
| 拟改触及已发布知识 | **0** |
| 拟改触及23条待核实（仅关联/限制说明） | **4** |
| 无法安全回滚的操作 | **0** |
| 新发现重大科学错误 | **否** |

## 2. 价态验证后的 redox 误挂删除清单

判定依据：**实际反应与元素化合价变化**，而非「oxidant/reductant 为空」。

### `rxn.Na2O_H2O`（batch3，pending_review）
- 价态依据：Na₂O+H₂O→NaOH：Na(+1)/O(-2)/H(+1)均无价态变化，属氧化物与水的化合
- 变更前 specialty：equation, redox, substance
- 变更后 specialty：equation, substance
- 变更前 category：equation.balance, equation.write_from_text, redox.identify
- 变更后 category：equation.balance, equation.write_from_text
- DB：删除 redox 专项关联 + 删除 redox.* 二级分类关联
- 同步：inventory + batch3 导入包
- 回滚：完整（可由 backup 还原 link 行）

### `rxn.NaOH_CO2`（batch3，pending_review）
- 价态依据：NaOH+CO₂→碳酸盐+水：酸碱/吸收，无价态变化
- 变更前 specialty：equation, redox, substance
- 变更后 specialty：equation, substance
- 变更前 category：equation.balance, equation.write_from_text, redox.identify
- 变更后 category：equation.balance, equation.write_from_text
- DB：删除 redox 专项关联 + 删除 redox.* 二级分类关联
- 同步：inventory + batch3 导入包
- 回滚：完整（可由 backup 还原 link 行）
- ⚠️ 同时为 verifyNeeded：只改关联，不改方程式/产物化学结论

### `rxn.NaOH_HCl`（batch3，pending_review）
- 价态依据：NaOH+HCl→NaCl+H₂O：中和，无价态变化
- 变更前 specialty：equation, redox, substance
- 变更后 specialty：equation, substance
- 变更前 category：equation.balance, equation.write_from_text, redox.identify
- 变更后 category：equation.balance, equation.write_from_text
- DB：删除 redox 专项关联 + 删除 redox.* 二级分类关联
- 同步：inventory + batch3 导入包
- 回滚：完整（可由 backup 还原 link 行）

### `rxn.NaHCO3_heat`（batch3，pending_review）
- 价态依据：2NaHCO₃△→Na₂CO₃+CO₂+H₂O：分解，无价态变化
- 变更前 specialty：equation, redox, substance
- 变更后 specialty：equation, substance
- 变更前 category：equation.balance, equation.write_from_text, redox.identify
- 变更后 category：equation.balance, equation.write_from_text
- DB：删除 redox 专项关联 + 删除 redox.* 二级分类关联
- 同步：inventory + batch3 导入包
- 回滚：完整（可由 backup 还原 link 行）

### `rxn.Na2CO3_2HCl`（batch3，pending_review）
- 价态依据：碳酸盐+酸→盐+CO₂+H₂O：复分解，无价态变化
- 变更前 specialty：equation, redox, substance
- 变更后 specialty：equation, substance
- 变更前 category：equation.balance, equation.write_from_text, redox.identify
- 变更后 category：equation.balance, equation.write_from_text
- DB：删除 redox 专项关联 + 删除 redox.* 二级分类关联
- 同步：inventory + batch3 导入包
- 回滚：完整（可由 backup 还原 link 行）

### `rxn.Al2O3_6HCl`（batch3，pending_review）
- 价态依据：Al₂O₃+HCl→AlCl₃+H₂O：氧化物与酸，Al(+3)/Cl(-1)等无价态变化
- 变更前 specialty：equation, redox, substance
- 变更后 specialty：equation, substance
- 变更前 category：equation.balance, equation.write_from_text, redox.identify
- 变更后 category：equation.balance, equation.write_from_text
- DB：删除 redox 专项关联 + 删除 redox.* 二级分类关联
- 同步：inventory + batch3 导入包
- 回滚：完整（可由 backup 还原 link 行）

### `rxn.Al2O3_2NaOH`（batch3，pending_review）
- 价态依据：Al₂O₃+NaOH→偏铝酸盐+水：两性氧化物与碱，无价态变化
- 变更前 specialty：equation, redox, substance
- 变更后 specialty：equation, substance
- 变更前 category：equation.balance, equation.write_from_text, redox.identify
- 变更后 category：equation.balance, equation.write_from_text
- DB：删除 redox 专项关联 + 删除 redox.* 二级分类关联
- 同步：inventory + batch3 导入包
- 回滚：完整（可由 backup 还原 link 行）
- ⚠️ 同时为 verifyNeeded：只改关联，不改方程式/产物化学结论

### `rxn.AlOH3_NaOH`（batch3，pending_review）
- 价态依据：Al(OH)₃+NaOH→偏铝酸盐+水：两性氢氧化物与碱，无价态变化
- 变更前 specialty：equation, redox, substance
- 变更后 specialty：equation, substance
- 变更前 category：equation.balance, equation.write_from_text, redox.identify
- 变更后 category：equation.balance, equation.write_from_text
- DB：删除 redox 专项关联 + 删除 redox.* 二级分类关联
- 同步：inventory + batch3 导入包
- 回滚：完整（可由 backup 还原 link 行）
- ⚠️ 同时为 verifyNeeded：只改关联，不改方程式/产物化学结论

### `rxn.AlOH3_3HCl`（batch3，pending_review）
- 价态依据：Al(OH)₃+HCl→AlCl₃+H₂O：中和/复分解，无价态变化
- 变更前 specialty：equation, redox, substance
- 变更后 specialty：equation, substance
- 变更前 category：equation.balance, equation.write_from_text, redox.identify
- 变更后 category：equation.balance, equation.write_from_text
- DB：删除 redox 专项关联 + 删除 redox.* 二级分类关联
- 同步：inventory + batch3 导入包
- 回滚：完整（可由 backup 还原 link 行）

### `rxn.CuO_2HCl`（batch3，pending_review）
- 价态依据：CuO+HCl→CuCl₂+H₂O：氧化物与酸，Cu(+2)无价态变化
- 变更前 specialty：equation, redox, substance
- 变更后 specialty：equation, substance
- 变更前 category：equation.balance, equation.write_from_text, redox.identify
- 变更后 category：equation.balance, equation.write_from_text
- DB：删除 redox 专项关联 + 删除 redox.* 二级分类关联
- 同步：inventory + batch3 导入包
- 回滚：完整（可由 backup 还原 link 行）

## 3. 计划新增的正确 redox 关联

### `rxn.C2H4_KMnO4`
- 依据：乙烯被酸性KMnO₄氧化（有氧化剂/还原剂字段；产物条件依赖）
- 变更前 specialty：equation, experiment, organic
- 变更后 specialty：equation, experiment, organic, redox
- 变更前 category：equation.write_from_text, experiment.phenomenon_judge, organic.ethene, organic.oxidation
- 变更后 category：equation.write_from_text, experiment.phenomenon_judge, organic.ethene, organic.oxidation, redox.identify
- 训练注意：已有描述性产物限制；补挂redox后引擎仍须禁止以唯一ox/re产物填空自动判题。备注≠访问控制。

## 4. 其他关联修复（inventory 对齐 DB）

### `kp.periodic.position`
- 知识点为元素位置/周期律，清单误标 ion；DB已正确为 periodic+structure，拟改inventory对齐DB，不向DB加ion
- inventory 前：ion
- inventory 后：periodic, structure
- DB specialty 不变：periodic, structure

### `kp.calc.concentration`
- 浓度为计算专项；清单误标 ion；DB已正确 calculation
- inventory 前：ion
- inventory 后：calculation
- DB specialty 不变：calculation

### `kp.calc.dilution`
- 稀释为计算专项；清单误标 ion；DB已正确 calculation
- inventory 前：ion
- inventory 后：calculation
- DB specialty 不变：calculation

## 5. [inv:] / reviewNote 拟补充

### `el.Be` · append_inv_tag
- 前：`[el.Be] 范围:保留基础信息；复杂性质/用途=了解，不进默认基础训练`
- 后：`[inv:el.Be] [el.Be] 范围:保留基础信息；复杂性质/用途=了解，不进默认基础训练`
- 说明：pending_review 缺 [inv:CODE] 同步瑕疵；不改科学字段

### `el.Ar` · append_inv_tag
- 前：`[el.Ar] 范围:保留基础信息；相对原子质量待所用教材附录核实(当前库约39.95)`
- 后：`[inv:el.Ar] [el.Ar] 范围:保留基础信息；相对原子质量待所用教材附录核实(当前库约39.95)`
- 说明：pending_review 缺 [inv:CODE] 同步瑕疵；不改科学字段

### `el.Fe` · append_inv_tag
- 前：`[el.Fe] 范围:Fe2+/Fe3+核心；复杂电子排布不进默认高一基础训练`
- 后：`[inv:el.Fe] [el.Fe] 范围:Fe2+/Fe3+核心；复杂电子排布不进默认高一基础训练`
- 说明：pending_review 缺 [inv:CODE] 同步瑕疵；不改科学字段

### `el.I` · append_inv_tag
- 前：`[el.I] 范围:I2/-1/淀粉变蓝可用；复杂正价=拓展，不进默认基础训练`
- 后：`[inv:el.I] [el.I] 范围:I2/-1/淀粉变蓝可用；复杂正价=拓展，不进默认基础训练`
- 说明：pending_review 缺 [inv:CODE] 同步瑕疵；不改科学字段

### `el.Cr` · append_inv_tag
- 前：`[el.Cr] 范围:基础+不锈钢了解；重铬酸盐不进默认高一专项训练`
- 后：`[inv:el.Cr] [el.Cr] 范围:基础+不锈钢了解；重铬酸盐不进默认高一专项训练`
- 说明：pending_review 缺 [inv:CODE] 同步瑕疵；不改科学字段

### `q.calc.amount_basic` · append_train_limit_note
- 前：`[inv:q.calc.amount_basic] 骨架；可替换数据后充实为正式训练题`
- 后：`[inv:q.calc.amount_basic] 骨架；可替换数据后充实为正式训练题 [trainLimit:非正式卷库骨架;禁无约束自动组卷判题;引擎未实现前本备注≠访问控制]`
- 说明：明确题目骨架训练风险；补充结构化限制说明。当前无训练引擎，本备注不能视为已生效访问控制。

### `q.calc.concentration` · append_train_limit_note
- 前：`[inv:q.calc.concentration] 骨架；单位得分点：mol/L`
- 后：`[inv:q.calc.concentration] 骨架；单位得分点：mol/L [trainLimit:非正式卷库骨架;禁无约束自动组卷判题;引擎未实现前本备注≠访问控制]`
- 说明：明确题目骨架训练风险；补充结构化限制说明。当前无训练引擎，本备注不能视为已生效访问控制。

### `q.calc.equation` · append_train_limit_note
- 前：`[inv:q.calc.equation] 骨架；计算短答模板`
- 后：`[inv:q.calc.equation] 骨架；计算短答模板 [trainLimit:非正式卷库骨架;禁无约束自动组卷判题;引擎未实现前本备注≠访问控制]`
- 说明：明确题目骨架训练风险；补充结构化限制说明。当前无训练引擎，本备注不能视为已生效访问控制。

### `q.calc.excess` · append_train_limit_note
- 前：`[inv:q.calc.excess] B5整改:单一数据组过量骨架;可作模板`
- 后：`[inv:q.calc.excess] B5整改:单一数据组过量骨架;可作模板 [trainLimit:非正式卷库骨架;禁无约束自动组卷判题;引擎未实现前本备注≠访问控制]`
- 说明：明确题目骨架训练风险；补充结构化限制说明。当前无训练引擎，本备注不能视为已生效访问控制。

### `q.exp.instrument` · append_train_limit_note
- 前：`[inv:q.exp.instrument] 骨架；仪器识别选择题模板`
- 后：`[inv:q.exp.instrument] 骨架；仪器识别选择题模板 [trainLimit:非正式卷库骨架;禁无约束自动组卷判题;引擎未实现前本备注≠访问控制]`
- 说明：明确题目骨架训练风险；补充结构化限制说明。当前无训练引擎，本备注不能视为已生效访问控制。

### `q.exp.gas_collect` · append_train_limit_note
- 前：`[inv:q.exp.gas_collect] 骨架；气体收集方法判断模板`
- 后：`[inv:q.exp.gas_collect] 骨架；气体收集方法判断模板 [trainLimit:非正式卷库骨架;禁无约束自动组卷判题;引擎未实现前本备注≠访问控制]`
- 说明：明确题目骨架训练风险；补充结构化限制说明。当前无训练引擎，本备注不能视为已生效访问控制。

### `q.exp.safety` · append_train_limit_note
- 前：`[inv:q.exp.safety] 骨架；安全判断题；强化禁家用`
- 后：`[inv:q.exp.safety] 骨架；安全判断题；强化禁家用 [trainLimit:非正式卷库骨架;禁无约束自动组卷判题;引擎未实现前本备注≠访问控制]`
- 说明：明确题目骨架训练风险；补充结构化限制说明。当前无训练引擎，本备注不能视为已生效访问控制。

### `q.eq.balance` · append_train_limit_note
- 前：`[inv:q.eq.balance] 骨架；方程式配平填空模板`
- 后：`[inv:q.eq.balance] 骨架；方程式配平填空模板 [trainLimit:非正式卷库骨架;禁无约束自动组卷判题;引擎未实现前本备注≠访问控制]`
- 说明：明确题目骨架训练风险；补充结构化限制说明。当前无训练引擎，本备注不能视为已生效访问控制。

### `q.organic.methane` · append_train_limit_note
- 前：`[inv:q.organic.methane] 骨架非正式训练题;可充实选项`
- 后：`[inv:q.organic.methane] 骨架非正式训练题;可充实选项 [trainLimit:非正式卷库骨架;禁无约束自动组卷判题;引擎未实现前本备注≠访问控制]`
- 说明：明确题目骨架训练风险；补充结构化限制说明。当前无训练引擎，本备注不能视为已生效访问控制。

### `q.organic.ethene` · append_train_limit_note
- 前：`[inv:q.organic.ethene] 骨架非正式训练题`
- 后：`[inv:q.organic.ethene] 骨架非正式训练题 [trainLimit:非正式卷库骨架;禁无约束自动组卷判题;引擎未实现前本备注≠访问控制]`
- 说明：明确题目骨架训练风险；补充结构化限制说明。当前无训练引擎，本备注不能视为已生效访问控制。

### `q.organic.ethanol` · append_train_limit_note
- 前：`[inv:q.organic.ethanol] 骨架非正式训练题`
- 后：`[inv:q.organic.ethanol] 骨架非正式训练题 [trainLimit:非正式卷库骨架;禁无约束自动组卷判题;引擎未实现前本备注≠访问控制]`
- 说明：明确题目骨架训练风险；补充结构化限制说明。当前无训练引擎，本备注不能视为已生效访问控制。

### `q.organic.ester` · append_train_limit_note
- 前：`[inv:q.organic.ester] 骨架非正式训练题`
- 后：`[inv:q.organic.ester] 骨架非正式训练题 [trainLimit:非正式卷库骨架;禁无约束自动组卷判题;引擎未实现前本备注≠访问控制]`
- 说明：明确题目骨架训练风险；补充结构化限制说明。当前无训练引擎，本备注不能视为已生效访问控制。

### `q.organic.isomer` · append_train_limit_note
- 前：`[inv:q.organic.isomer] 骨架非正式训练题;基础书写`
- 后：`[inv:q.organic.isomer] 骨架非正式训练题;基础书写 [trainLimit:非正式卷库骨架;禁无约束自动组卷判题;引擎未实现前本备注≠访问控制]`
- 说明：明确题目骨架训练风险；补充结构化限制说明。当前无训练引擎，本备注不能视为已生效访问控制。

### `q.inference.block` · append_train_limit_note
- 前：`[inv:q.inference.block] 骨架非正式训练题;框图模板`
- 后：`[inv:q.inference.block] 骨架非正式训练题;框图模板 [trainLimit:非正式卷库骨架;禁无约束自动组卷判题;引擎未实现前本备注≠访问控制]`
- 说明：明确题目骨架训练风险；补充结构化限制说明。当前无训练引擎，本备注不能视为已生效访问控制。

### `q.inference.phenomenon` · append_train_limit_note
- 前：`[inv:q.inference.phenomenon] 骨架非正式训练题`
- 后：`[inv:q.inference.phenomenon] 骨架非正式训练题 [trainLimit:非正式卷库骨架;禁无约束自动组卷判题;引擎未实现前本备注≠访问控制]`
- 说明：明确题目骨架训练风险；补充结构化限制说明。当前无训练引擎，本备注不能视为已生效访问控制。

### `q.substance.NaOH` · append_train_limit_note
- 前：`[inv:q.substance.NaOH] 骨架非正式训练题`
- 后：`[inv:q.substance.NaOH] 骨架非正式训练题 [trainLimit:非正式卷库骨架;禁无约束自动组卷判题;引擎未实现前本备注≠访问控制]`
- 说明：明确题目骨架训练风险；补充结构化限制说明。当前无训练引擎，本备注不能视为已生效访问控制。

### `q.comprehensive.mock` · append_train_limit_note
- 前：`[inv:q.comprehensive.mock] 骨架非正式训练题;综合模拟组`
- 后：`[inv:q.comprehensive.mock] 骨架非正式训练题;综合模拟组 [trainLimit:非正式卷库骨架;禁无约束自动组卷判题;引擎未实现前本备注≠访问控制]`
- 说明：明确题目骨架训练风险；补充结构化限制说明。当前无训练引擎，本备注不能视为已生效访问控制。

### `exp.Fe3_SCN` · append_verify_train_limit
- 前：`[inv:exp.Fe3_SCN] 增补；血红色现象; batch3导入 pending_review id=8`
- 后：`[inv:exp.Fe3_SCN] 增补；血红色现象; batch3导入 pending_review id=8 待核实:教材现象口径;非默认核心训练;excludeDefaultUntilVerified`
- 说明：verifyNeeded但note未标明训练限制；只补限制说明，不改实验化学结论

## 6. 全库反应 redox 扫描（含观察项）

反应总数：68
- 明确误挂拟删：10
- 漏挂（拟增或仅观察）：1
- 教学口径不确定（仅观察）：3

### 仅观察、不自动修改
- `rxn.CH4_Cl2`：有机反应价态/教学口径不确定，不自动改关联 — 取代中Cl₂→HCl、C价态变化，化学上属氧化还原；高一多按取代训练，是否挂redox需教学口径确认
- `rxn.C2H4_Br2`：有机反应价态/教学口径不确定，不自动改关联 — 加成中Br(0)→-1，化学上可归氧化还原；高一多按加成训练
- `rxn.C2H4_H2`：有机反应价态/教学口径不确定，不自动改关联 — 加氢中H(0)→+1，化学上可归氧化还原；高一多按加成训练

## 7. 已发布知识保护清单

published 总数：19；拟改白名单中触及 published：**0**

- `q.eq.Na_water`：published题目：题干为「生成物」非方程式书写；标准答案「NaOH和H₂」；挂equation专项存在适配风险；默认不改关联/正文；引擎必须实现：不得作方程式配平/完整方程式唯一答案自动判题；题干=钠与水反应的生成物是？；答案=NaOH 和 H2

## 8. 23 条待核实

- inventory.verifyNeeded 条数：23
- 拟改中触及（仅删错误redox关联或补限制说明，不改化学结论）：rxn.NaOH_CO2, rxn.Al2O3_2NaOH, rxn.AlOH3_NaOH, exp.Fe3_SCN
- 化学结论 / 教材口径：**不修改**

## 9. 备份与回滚

- DB快照：`docs/chemistry_global_fix/backup_before_global_fix.json`
- inventory副本：`docs/chemistry_global_fix/backup_inventory_before.json`
- 导入包副本：`docs/chemistry_global_fix/backup_import_packs/`
- 能否完整回滚：是
- 方法：apply前所有拟改均为可逆：specialty/category DELETE可按backup.specialtyLinks/categoryLinks INSERT还原；review_note UPDATE可按backup.entities[].review_note还原；inventory/导入包用 backup 文件覆盖还原。dry-run本身未改任何正式数据。

## 10. 暂缓项

- **60 empty secondary categories**：keep empty — 本次不提高覆盖率，不为填空而硬挂
- **23 verifyNeeded chemical conclusions**：no content change — 不进行教材口径拍板；仅允许训练限制配置
- **experiment paper-mark P2 (书面关键字)**：defer — 多数已有 home_forbidden_note；缺「书面」字样属展示优化，不强制改写
- **organic CH4_Cl2 / C2H4_Br2 / C2H4_H2 redox specialty**：observe only — 教学口径不确定，证据不足以自动挂/摘
- **19 published entities content/links**：protect — 默认不修改；问题只记录

## 11. 全部拟修改编码一览

- `el.Ar`：append_inv_tag
- `el.Be`：append_inv_tag
- `el.Cr`：append_inv_tag
- `el.Fe`：append_inv_tag
- `el.I`：append_inv_tag
- `exp.Fe3_SCN`：append_verify_train_limit
- `kp.calc.concentration`：inventory_specialty_align_to_db
- `kp.calc.dilution`：inventory_specialty_align_to_db
- `kp.periodic.position`：inventory_specialty_align_to_db
- `q.calc.amount_basic`：append_train_limit_note
- `q.calc.concentration`：append_train_limit_note
- `q.calc.equation`：append_train_limit_note
- `q.calc.excess`：append_train_limit_note
- `q.comprehensive.mock`：append_train_limit_note
- `q.eq.balance`：append_train_limit_note
- `q.exp.gas_collect`：append_train_limit_note
- `q.exp.instrument`：append_train_limit_note
- `q.exp.safety`：append_train_limit_note
- `q.inference.block`：append_train_limit_note
- `q.inference.phenomenon`：append_train_limit_note
- `q.organic.ester`：append_train_limit_note
- `q.organic.ethanol`：append_train_limit_note
- `q.organic.ethene`：append_train_limit_note
- `q.organic.isomer`：append_train_limit_note
- `q.organic.methane`：append_train_limit_note
- `q.substance.NaOH`：append_train_limit_note
- `rxn.Al2O3_2NaOH`：remove_redox_specialty
- `rxn.Al2O3_6HCl`：remove_redox_specialty
- `rxn.AlOH3_3HCl`：remove_redox_specialty
- `rxn.AlOH3_NaOH`：remove_redox_specialty
- `rxn.C2H4_KMnO4`：add_redox_specialty
- `rxn.CuO_2HCl`：remove_redox_specialty
- `rxn.Na2CO3_2HCl`：remove_redox_specialty
- `rxn.Na2O_H2O`：remove_redox_specialty
- `rxn.NaHCO3_heat`：remove_redox_specialty
- `rxn.NaOH_CO2`：remove_redox_specialty
- `rxn.NaOH_HCl`：remove_redox_specialty

---

**Dry-run 完成。等待批准后再执行 apply。**