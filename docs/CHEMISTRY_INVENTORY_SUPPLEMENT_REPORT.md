# 高一化学知识库 · 清单增补报告

> 日期：2026-10-18
> 性质：**仅更新知识规划清单**；未生成正式知识数据、未导入数据库。
> 依据：`CHEMISTRY_INVENTORY_GAP_REPORT.md`、必修课程范围、质量标准。

## 1. 数量总览

| 指标 | 数量 |
|------|------|
| 原始知识数量 | **311** |
| 新增知识数量 | **66** |
| 更新后知识总数量 | **377** |
| Batch3 新增 | **20**（现 91） |
| Batch4 新增 | **9**（现 74） |
| Batch5 新增 | **8**（现 42） |
| Batch6 新增 | **29**（现 79） |
| Batch2 新增 | 0（未改） |

## 2. 保留与约束

- 原有 311 条编码**全部保留**，无删除。
- 新增编码均唯一，经与现有集合碰撞检查。
- 跨批次主题（如焰色反应、酸雨）只建一条主知识，其他批次建设时用关联引用。
- `kp.metal.smelting`（金属冶炼）原已在 Batch3，本次不重复新建。
- `concept.reaction_rate` / `concept.reaction_extent` 原已在 Batch2，本次以互补条目补充（因素、可逆反应、定性限度）。

## 3. 新增条目明细

### batch3（+20）

| 编码 | 名称 | 类型 | 重要程度 | 专项 | 二级分类 | 课程范围 | 待核实 |
|------|------|------|----------|------|----------|----------|--------|
| `sub.FeO` | 氧化亚铁 | substance | 1 | substance,memory | substance.formula,substance.chem_property,substance.color | 必修第一册·铁及其化合物 | 否 |
| `sub.FeOH2` | 氢氧化亚铁 | substance | 1 | substance,memory,experiment | substance.formula,substance.chem_property,substance.color | 必修第一册·铁及其化合物 | 否 |
| `sub.FeSO4` | 硫酸亚铁 | substance | 1 | substance,memory,ion | substance.formula,substance.chem_property | 必修第一册·铁及其化合物（亚铁盐代表） | 否 |
| `kp.Fe.fe2_property` | Fe²⁺的性质 | knowledge | 1 | ion,redox,substance | ion.ion_test,redox.ox_re_ability,substance.chem_property | 必修第一册·铁及其化合物 | 否 |
| `kp.Fe.fe3_property` | Fe³⁺的性质 | knowledge | 1 | ion,redox,substance | ion.ion_test,redox.ox_re_ability,substance.chem_property | 必修第一册·铁及其化合物 | 否 |
| `kp.Fe.fe2_fe3` | Fe²⁺与Fe³⁺的转化 | knowledge | 1 | redox,ion,equation | redox.identify,equation.redox_analysis,ion.mixed | 必修第一册·铁及其化合物 | 否 |
| `kp.Fe.test` | Fe²⁺与Fe³⁺的检验 | knowledge | 1 | ion,experiment,memory | ion.ion_test,experiment.substance_test,memory.color | 必修第一册·铁及其化合物 | 否 |
| `kp.Fe.salt` | 亚铁盐与铁盐 | knowledge | 1 | substance,memory,ion | substance.chem_property,memory.ions | 必修第一册·铁及其化合物 | 否 |
| `rxn.FeOH2_O2` | 氢氧化亚铁被氧气氧化 | reaction | 1 | equation,redox,substance | equation.write_from_text,equation.condition,equation.redox_analysis | 必修第一册·铁及其化合物 | 是 |
| `rxn.2Fe2_Cl2` | 亚铁离子被氯气氧化 | reaction | 1 | equation,redox,ion | equation.ionic_write,redox.identify,ion.mixed | 必修第一册·铁及其化合物 | 否 |
| `exp.Fe3_SCN` | Fe³⁺与KSCN的检验 | experiment | 1 | experiment,ion,substance | experiment.substance_test,ion.ion_test,experiment.phenomenon_desc | 必修第一册·铁及其化合物 | 否 |
| `concept.alloy` | 合金 | concept | 1 | substance,memory | substance.chem_property,memory.rules | 必修第一册·金属材料 | 否 |
| `kp.metal.pig_iron` | 生铁 | knowledge | 1 | substance,memory | substance.chem_property,memory.common_name | 必修第一册·金属材料 | 否 |
| `kp.metal.steel` | 钢 | knowledge | 1 | substance,memory | substance.chem_property,memory.common_name | 必修第一册·金属材料 | 否 |
| `kp.metal.stainless` | 不锈钢 | knowledge | 2 | substance,memory | substance.chem_property,memory.common_name | 必修第一册·金属材料（了解） | 否 |
| `sub.NaAlO2` | 偏铝酸钠 | substance | 1 | substance,ion,memory | substance.formula,substance.chem_property,substance.conversion | 必修第一册·铝及其化合物 | 是 |
| `sub.AlCl3` | 氯化铝 | substance | 1 | substance,memory,ion | substance.formula,substance.chem_property | 必修第一册·铝及其化合物（铝盐代表） | 否 |
| `rxn.Na2CO3_CO2_H2O` | 碳酸钠转化为碳酸氢钠 | reaction | 1 | equation,substance | equation.write_from_text,equation.conversion,substance.conversion | 必修第一册·钠及其化合物 | 否 |
| `rxn.2Na_2HCl` | 钠与盐酸反应 | reaction | 2 | equation,redox,substance | equation.write_from_text,equation.redox_analysis | 必修第一册·钠及其化合物 | 否 |
| `kp.Al.salt_aluminate` | 铝盐与偏铝酸盐转化 | knowledge | 1 | substance,equation,ion | substance.conversion,equation.conversion,ion.mixed | 必修第一册·铝及其化合物 | 否 |

### batch4（+9）

| 编码 | 名称 | 类型 | 重要程度 | 专项 | 二级分类 | 课程范围 | 待核实 |
|------|------|------|----------|------|----------|----------|--------|
| `sub.Br2` | 溴 | substance | 2 | substance,memory,periodic | substance.formula,substance.color,substance.state,memory.color | 必修·卤族元素性质比较（了解+实验相关） | 否 |
| `sub.I2` | 碘 | substance | 2 | substance,memory,experiment | substance.formula,substance.color,substance.test,memory.color | 必修·卤族元素性质比较（了解+淀粉变蓝） | 否 |
| `sub.bleaching_powder` | 漂白粉 | substance | 2 | substance,memory | substance.chem_property,substance.usage,memory.common_name | 必修第一册·氯及其化合物（了解） | 是 |
| `kp.S.conc_H2SO4` | 浓硫酸的特性 | knowledge | 1 | substance,equation,experiment | substance.chem_property,equation.condition,experiment.safety | 必修第二册相关·硫及其化合物 / 必修常见物质性质 | 否 |
| `kp.N.ammonium` | 铵盐的性质 | knowledge | 1 | substance,equation,ion | substance.chem_property,equation.write_from_text,ion.mixed | 必修·氮及其化合物 | 否 |
| `rxn.NH4Cl_NaOH` | 氯化铵与氢氧化钠反应 | reaction | 1 | equation,substance,experiment | equation.write_from_text,experiment.substance_test | 必修·氮及其化合物（铵盐检验/性质） | 否 |
| `kp.halogen.compare` | 卤族元素性质比较 | knowledge | 2 | periodic,substance,memory | periodic.nonmetal_compare,substance.chem_property,memory.rules | 必修·氯为主，溴碘了解比较 | 否 |
| `kp.N.synth_ammonia` | 合成氨反应条件与可逆性 | knowledge | 2 | equation,substance | equation.condition,substance.chem_property | 必修·氮及其化合物；关联化学反应限度 | 否 |
| `kp.Cl.bleach` | 氯水与漂白原理 | knowledge | 2 | substance,equation,experiment | substance.chem_property,equation.condition | 必修第一册·氯及其化合物 | 否 |

### batch5（+8）

| 编码 | 名称 | 类型 | 重要程度 | 专项 | 二级分类 | 课程范围 | 待核实 |
|------|------|------|----------|------|----------|----------|--------|
| `kp.exp.gas_wash_dry` | 气体的洗涤与干燥 | knowledge | 1 | experiment | experiment.apparatus_link,experiment.gas_collect,experiment.plan_design | 必修·化学实验基础 | 否 |
| `exp.ops_volumetric_flask` | 容量瓶定容操作 | experiment | 1 | experiment,calculation | experiment.basic_ops,experiment.instrument_use | 必修·化学实验基础 / 物质的量浓度配制 | 否 |
| `exp.ops_burette` | 滴定管认知与基本操作 | experiment | 2 | experiment | experiment.instrument_id,experiment.basic_ops | 必修实验仪器了解（深度待核实） | 是 |
| `exp.flame_test` | 焰色反应 | experiment | 1 | experiment,substance,memory | experiment.substance_test,substance.test,memory.color | 必修第一册·钠及其化合物（焰色） | 否 |
| `formula.rate_v` | 化学反应速率定义式 | formula | 2 | calculation | calculation.mixed | 必修第二册·化学反应速率（入门） | 否 |
| `kp.rate.factors` | 影响化学反应速率的因素 | knowledge | 1 | experiment,comprehensive | experiment.inquiry,comprehensive.basic | 必修第二册·化学反应速率 | 否 |
| `concept.reversible` | 可逆反应 | concept | 1 | equation,memory | equation.condition,memory.rules | 必修第二册·化学反应限度相关 | 否 |
| `kp.extent.le_chatelier_basic` | 化学反应限度与条件影响（定性） | knowledge | 2 | comprehensive | comprehensive.basic | 必修第二册·化学反应限度（定性；深度待核实） | 是 |

### batch6（+29）

| 编码 | 名称 | 类型 | 重要程度 | 专项 | 二级分类 | 课程范围 | 待核实 |
|------|------|------|----------|------|----------|----------|--------|
| `concept.endothermic` | 吸热反应 | concept | 1 | memory,comprehensive | memory.rules,comprehensive.basic | 必修第二册·化学反应与能量 | 否 |
| `concept.exothermic` | 放热反应 | concept | 1 | memory,comprehensive | memory.rules,comprehensive.basic | 必修第二册·化学反应与能量 | 否 |
| `kp.energy.bond_change` | 化学键与能量变化 | knowledge | 1 | structure,comprehensive | structure.ionic_bond,structure.covalent_bond,comprehensive.basic | 必修第二册·化学反应与能量 | 否 |
| `kp.energy.chem_electric` | 化学能与电能 | knowledge | 1 | comprehensive,redox | comprehensive.basic,redox.e_transfer | 必修第二册·化学反应与能量 | 否 |
| `kp.energy.galvanic` | 原电池 | knowledge | 1 | redox,experiment,comprehensive | redox.e_direction,experiment.inquiry,comprehensive.basic | 必修第二册·原电池 | 否 |
| `kp.energy.galvanic_poles` | 原电池正负极 | knowledge | 1 | redox,comprehensive | redox.e_direction,comprehensive.basic | 必修第二册·原电池 | 否 |
| `kp.energy.electron_flow` | 原电池电子流向 | knowledge | 1 | redox,comprehensive | redox.e_direction,comprehensive.basic | 必修第二册·原电池 | 否 |
| `kp.energy.electrode_rxn` | 原电池电极反应 | knowledge | 1 | redox,equation,comprehensive | redox.identify,equation.ionic_write,comprehensive.basic | 必修第二册·原电池 | 否 |
| `kp.energy.chem_power` | 常见化学电源 | knowledge | 2 | comprehensive,memory | comprehensive.basic,memory.rules | 必修第二册·化学电源（了解） | 否 |
| `exp.galvanic_Zn_Cu` | 铜锌原电池实验 | experiment | 1 | experiment,redox | experiment.inquiry,experiment.phenomenon_desc,redox.e_direction | 必修第二册·原电池 | 否 |
| `concept.heat_of_reaction` | 反应热 | concept | 2 | comprehensive,memory | comprehensive.basic,memory.rules | 必修第二册·化学反应与能量 | 是 |
| `kp.energy.thermo_eq` | 热化学方程式书写 | knowledge | 2 | equation,comprehensive | equation.write_from_text,equation.condition,comprehensive.basic | 必修第二册·化学反应与能量 | 否 |
| `kp.sustain.seawater` | 海水资源开发 | knowledge | 2 | comprehensive,substance | comprehensive.basic,substance.usage | 必修第二册·化学与可持续发展 | 否 |
| `kp.sustain.coal` | 煤的综合利用 | knowledge | 2 | comprehensive,organic | comprehensive.basic,organic.basic | 必修第二册·化学与可持续发展 | 否 |
| `kp.organic.petroleum` | 石油分馏 | knowledge | 1 | organic,comprehensive | organic.basic,comprehensive.basic | 必修第二册·有机 / 可持续发展 | 否 |
| `kp.organic.cracking` | 石油裂化 | knowledge | 2 | organic,comprehensive | organic.basic,comprehensive.basic | 必修第二册·有机化学相关（了解深度待核实） | 是 |
| `kp.organic.pyrolysis` | 石油裂解 | knowledge | 2 | organic,comprehensive | organic.basic,comprehensive.basic | 必修第二册·有机化学相关（了解深度待核实） | 是 |
| `kp.sustain.natural_gas` | 天然气利用 | knowledge | 2 | comprehensive,organic | comprehensive.basic,organic.methane | 必修第二册·化学与可持续发展 | 否 |
| `kp.sustain.fertilizer` | 化肥合理使用 | knowledge | 2 | comprehensive | comprehensive.basic | 必修第二册·化学与可持续发展 | 否 |
| `kp.sustain.pesticide` | 农药合理使用 | knowledge | 2 | comprehensive | comprehensive.basic | 必修第二册·化学与可持续发展 | 否 |
| `kp.sustain.medicine` | 药物合理使用 | knowledge | 2 | comprehensive | comprehensive.basic | 必修第二册·化学与可持续发展 | 否 |
| `kp.sustain.food_additive` | 食品添加剂 | knowledge | 2 | comprehensive | comprehensive.basic | 必修第二册·化学与可持续发展 | 否 |
| `kp.enviro.pollution` | 环境污染与防治认知 | knowledge | 2 | comprehensive | comprehensive.basic | 必修第二册·化学与可持续发展 | 否 |
| `kp.enviro.acid_rain` | 酸雨 | knowledge | 1 | comprehensive,substance | comprehensive.basic,substance.chem_property | 必修·硫氮氧化物与可持续发展 | 否 |
| `kp.sustain.green_chem` | 绿色化学 | knowledge | 1 | comprehensive | comprehensive.basic | 必修第二册·化学与可持续发展 | 否 |
| `kp.sustain.atom_economy` | 原子经济性 | knowledge | 2 | comprehensive,calculation | comprehensive.basic,calculation.mixed | 必修第二册·绿色化学相关 | 是 |
| `concept.addition_polymer` | 加成聚合 | concept | 1 | organic | organic.addition,organic.basic | 必修第二册·有机聚合物初步 | 否 |
| `kp.organic.biomolecule` | 生命中的基本有机物（了解） | knowledge | 3 | organic,comprehensive | organic.basic,comprehensive.basic | 必修第二册·化学与可持续发展/有机（了解；待核实覆盖深度） | 是 |
| `rxn.C2H4_KMnO4` | 乙烯使酸性高锰酸钾褪色 | reaction | 1 | organic,equation,experiment | organic.oxidation,equation.write_from_text,experiment.phenomenon_judge | 必修第二册·乙烯 | 否 |

## 4. 各专项知识覆盖情况（更新后）

| 专项 | 关联条目数（可多重关联） | 覆盖简评 |
|------|--------------------------|----------|
| equation | 98 | 金属/非金属反应增补后方程素材更完整；能量热化学式新增 |
| experiment | 65 | 补洗气干燥、定容、焰色、Fe³⁺检验、原电池实验 |
| substance | 181 | 铁系/铝盐/卤素单质/漂白粉等物质枢纽增强 |
| calculation | 30 | 补速率定义式；原子经济性概念级挂接 |
| ion | 26 | Fe²⁺/Fe³⁺性质、检验与转化增强 |
| redox | 77 | 铁转化与原电池相关增强 |
| periodic | 37 | 卤族比较知识点增强 |
| structure | 37 | 能量章化学键与能量变化挂接 |
| organic | 49 | 石油分馏/裂化/裂解、加聚、乙烯鉴别增强 |
| inference | 5 | 仍主要依赖综合骨架；物质反应充实后方能真正组卷 |
| memory | 125 | 合金材料与颜色/俗称类增强 |
| comprehensive | 30 | 可持续发展与能量章主体落在此专项 |

### 覆盖偏薄但仍可接受的专项

- **inference（推断）**：清单以策略型知识点与题骨架为主，依赖 Batch3/4 物质反应数据建设后串联。
- **calculation（计算）**：公式主体在 Batch2/5；本次仅补速率定义式，未扩选修计算。

## 5. 仍需人工核实的内容

| 编码 | 名称 | 核实点 |
|------|------|--------|
| `rxn.FeOH2_O2` | 氢氧化亚铁被氧气氧化 | 增补；空气中氧化；方程式写法建设时待核实总式表述 |
| `sub.NaAlO2` | 偏铝酸钠 | 增补；两性转化枢纽；溶液中存在形式表述建设时注意 |
| `sub.bleaching_powder` | 漂白粉 | 增补；主要成分表述（次氯酸钙等）建设时待核实教材口径 |
| `exp.ops_burette` | 滴定管认知与基本操作 | 增补；是否作为必修核心训练待核实，避免按分析化学滴定展开 |
| `kp.extent.le_chatelier_basic` | 化学反应限度与条件影响（定性） | 增补；仅定性认识；禁止按选修平衡计算展开 |
| `concept.heat_of_reaction` | 反应热 | 增补；燃烧热/中和热等概念级；计算深度待核实 |
| `kp.organic.cracking` | 石油裂化 | 增补；与裂解区分；深度待核实 |
| `kp.organic.pyrolysis` | 石油裂解 | 增补；与裂化区分；深度待核实 |
| `kp.sustain.atom_economy` | 原子经济性 | 增补；概念级；计算题深度待核实 |
| `kp.organic.biomolecule` | 生命中的基本有机物（了解） | 增补；糖类油脂蛋白质认知级；勿展开生物详细代谢 |

以上条目**不能**直接认定为已确认的必修核心深度；建设前需对照所用教材版本。

## 6. 是否仍有尚未覆盖的高一核心知识

本次增补后，质量缺口报告中的 **P2 级主缺口**（铁系完整性、金属材料、原电池/能量、可持续发展、卤素单质枢纽、关键实验操作）已进入清单。

仍可能存在的**非阻断性**缺口（建议后续人工课标对照，不在本次强行扩编）：

1. 个别地区教材对「蒸馏/萃取」必修深度不一（Batch5 已有认知条，是否升格待定）。
2. 胶体专项实验（丁达尔）仅有概念，可按需补实验条。
3. 氮肥/磷肥/钾肥分条（本次化肥为综合条）。
4. 具体品牌化学电源结构细节（刻意保持了解级）。
5. 硅酸盐工业（玻璃/水泥）若教材强调，可再补 1–2 条了解级知识点。

## 7. 未纳入本次清单的内容（防超纲）

- 选择性必修化学反应原理中的定量平衡常数、活化能计算等
- 铬酸盐/重铬酸盐深度氧化还原（不锈钢仅了解）
- 碘/溴的高价含氧酸体系作为默认核心
- 氢氟酸专项（边缘，不强制）

## 8. 下一步（等待指令）

- 可对 `verifyNeeded=true` 条目做课标确认
- 确认后再启动 Batch3 **数据**建设与安全导入
- 本次**停止**：不生成知识正文、不导入数据库
