# 高一化学知识库 · 完整知识清单

> 阶段三知识规划清单（编码+名称级）。机器可读副本：[chemistry_kb_inventory.json](./chemistry_kb_inventory.json)
> 2026-10-18 增补见 [CHEMISTRY_INVENTORY_SUPPLEMENT_REPORT.md](./CHEMISTRY_INVENTORY_SUPPLEMENT_REPORT.md)

## 汇总

| 指标 | 数量 |
|------|------|
| 条目总计 | 377 |
| batch2 | 91 |
| batch3 | 91（建设+质检+整改完成；P0=0；待核实12；见 CHEMISTRY_BATCH3_FIX_REPORT；仍 pending_review≠人审） |
| batch4 | 74（建设完成：复用0+导入74 pending_review，见 CHEMISTRY_BATCH4_REPORT；未做专项质检） |
| batch5 | 42 |
| batch6 | 79 |

### 按知识类型

| 类型 | 数量 |
|------|------|
| concept | 36 |
| element | 30 |
| experiment | 42 |
| formula | 17 |
| knowledge | 96 |
| question | 18 |
| reaction | 68 |
| substance | 70 |

### 按状态

| 状态 | 数量 |
|------|------|
| imported | 81 |
| pending | 278 |
| seeded | 8 |
| seeded_audited | 10 |

## 字段说明

- `code`：稳定唯一编码
- `type`：八类知识实体之一
- `specialtyCodes` / `categoryCodes`：专项与二级分类
- `priority`：1 高 / 2 中 / 3 低
- `status`：pending / seeded / seeded_audited / imported 等
- `curriculumScope`：课程范围依据（增补条目）
- `verifyNeeded`：是否待人工核实是否属必修核心深度

## batch2 · 元素和基础概念

本批 91 条。

### element

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `el.H` | 氢 | periodic,memory,structure | 1 | seeded_audited | 阶段二示例已入库; batch2审计：不覆盖published；见CHEMISTRY_BATCH2_REPORT |
| `el.He` | 氦 | periodic,memory,structure | 2 | imported | batch2导入 pending_review |
| `el.Li` | 锂 | periodic,memory,structure | 2 | imported | batch2导入 pending_review |
| `el.Be` | 铍 | periodic,memory,structure | 3 | imported | batch2导入 pending_review |
| `el.B` | 硼 | periodic,memory,structure | 3 | imported | batch2导入 pending_review |
| `el.C` | 碳 | periodic,memory,structure | 1 | imported | batch2导入 pending_review |
| `el.N` | 氮 | periodic,memory,structure | 1 | imported | batch2导入 pending_review |
| `el.O` | 氧 | periodic,memory,structure | 1 | seeded_audited | 阶段二示例已入库; batch2审计：不覆盖published；见CHEMISTRY_BATCH2_REPORT |
| `el.F` | 氟 | periodic,memory,structure | 2 | imported | batch2导入 pending_review |
| `el.Ne` | 氖 | periodic,memory,structure | 2 | imported | batch2导入 pending_review |
| `el.Na` | 钠 | periodic,memory,structure | 1 | seeded_audited | 阶段二示例已入库; batch2审计：不覆盖published；见CHEMISTRY_BATCH2_REPORT |
| `el.Mg` | 镁 | periodic,memory,structure | 1 | imported | batch2导入 pending_review |
| `el.Al` | 铝 | periodic,memory,structure | 1 | imported | batch2导入 pending_review |
| `el.Si` | 硅 | periodic,memory,structure | 1 | imported | batch2导入 pending_review |
| `el.P` | 磷 | periodic,memory,structure | 1 | imported | batch2导入 pending_review |
| `el.S` | 硫 | periodic,memory,structure | 1 | imported | batch2导入 pending_review |
| `el.Cl` | 氯 | periodic,memory,structure | 1 | seeded_audited | 阶段二示例已入库; batch2审计：不覆盖published；见CHEMISTRY_BATCH2_REPORT |
| `el.Ar` | 氩 | periodic,memory,structure | 2 | imported | batch2导入 pending_review |
| `el.K` | 钾 | periodic,memory,structure | 1 | imported | batch2导入 pending_review |
| `el.Ca` | 钙 | periodic,memory,structure | 1 | imported | batch2导入 pending_review |
| `el.Fe` | 铁 | periodic,memory,structure | 1 | imported | batch2导入 pending_review |
| `el.Cu` | 铜 | periodic,memory,structure | 1 | imported | batch2导入 pending_review |
| `el.Zn` | 锌 | periodic,memory,structure | 1 | imported | batch2导入 pending_review |
| `el.Ag` | 银 | periodic,memory,structure | 2 | imported | batch2导入 pending_review |
| `el.Ba` | 钡 | periodic,memory,structure | 2 | imported | batch2导入 pending_review |
| `el.I` | 碘 | periodic,memory,structure | 2 | imported | batch2导入 pending_review |
| `el.Mn` | 锰 | periodic,memory,structure | 2 | imported | batch2导入 pending_review |
| `el.Cr` | 铬 | periodic,memory,structure | 3 | imported | batch2导入 pending_review |
| `el.Br` | 溴 | periodic,memory,structure | 2 | imported | batch2导入 pending_review |
| `el.Hg` | 汞 | periodic,memory,structure | 3 | imported | batch2导入 pending_review |

### concept

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `concept.substance_class` | 物质的分类 | substance,memory | 1 | imported | batch2导入 pending_review |
| `concept.pure_mixture` | 纯净物与混合物 | substance,memory | 1 | imported | batch2导入 pending_review |
| `concept.elemental_compound` | 单质与化合物 | substance,memory | 1 | imported | batch2导入 pending_review |
| `concept.electrolyte` | 电解质 | ion,memory | 1 | imported | batch2导入 pending_review |
| `concept.nonelectrolyte` | 非电解质 | ion,memory | 1 | imported | batch2导入 pending_review |
| `concept.ionization` | 电离 | ion | 1 | imported | batch2导入 pending_review |
| `concept.ionic_reaction` | 离子反应本质 | ion,equation | 1 | imported | batch2导入 pending_review |
| `concept.ion_coexist` | 离子共存条件 | ion | 1 | imported | batch2导入 pending_review |
| `concept.redox` | 氧化还原反应 | redox,equation | 1 | seeded_audited | 阶段二示例已入库; batch2审计：不覆盖published；见CHEMISTRY_BATCH2_REPORT |
| `concept.oxidant_reductant` | 氧化剂与还原剂 | redox | 1 | imported | batch2导入 pending_review |
| `concept.valence_rules` | 化合价规则 | redox,memory | 1 | imported | batch2导入 pending_review |
| `concept.periodic_law` | 元素周期律 | periodic | 1 | imported | batch2导入 pending_review |
| `concept.metal_trend` | 金属性递变 | periodic | 1 | imported | batch2导入 pending_review |
| `concept.nonmetal_trend` | 非金属性递变 | periodic | 1 | imported | batch2导入 pending_review |
| `concept.ionic_bond` | 离子键 | structure | 1 | imported | batch2导入 pending_review |
| `concept.covalent_bond` | 共价键 | structure | 1 | imported | batch2导入 pending_review |
| `concept.reaction_rate` | 化学反应速率 | calculation | 2 | imported | batch2导入 pending_review |
| `concept.reaction_extent` | 化学反应限度 | calculation | 2 | imported | batch2导入 pending_review |
| `concept.mass_conserve` | 质量守恒定律 | equation,calculation | 1 | imported | batch2导入 pending_review |
| `concept.charge_conserve` | 电荷守恒 | ion | 1 | imported | batch2导入 pending_review |
| `concept.electron_conserve` | 电子守恒 | redox | 1 | imported | batch2导入 pending_review |
| `concept.solution_colloid` | 溶液与胶体 | substance | 2 | imported | batch2导入 pending_review |
| `concept.acid_base_salt` | 酸碱盐概念 | substance,memory | 1 | imported | batch2导入 pending_review |
| `concept.oxide_class` | 氧化物分类 | substance | 1 | imported | batch2导入 pending_review |

### formula

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `formula.n_m_M` | 物质的量与质量关系 | calculation,memory | 1 | seeded_audited | 阶段二示例已入库; batch2审计：不覆盖published；见CHEMISTRY_BATCH2_REPORT |
| `formula.N_n_NA` | 粒子数与物质的量 | calculation,memory | 1 | imported | batch2导入 pending_review |
| `formula.Vm` | 气体摩尔体积 | calculation,memory | 1 | imported | batch2导入 pending_review |
| `formula.c_n_V` | 物质的量浓度 | calculation,memory | 1 | imported | batch2导入 pending_review |
| `formula.dilution` | 溶液稀释 | calculation,memory | 1 | imported | batch2导入 pending_review |
| `formula.M_m_n` | 摩尔质量 | calculation,memory | 1 | imported | batch2导入 pending_review |
| `formula.rho_c_M` | 密度与浓度换算 | calculation,memory | 2 | imported | batch2导入 pending_review |
| `formula.mass_percent` | 质量分数 | calculation,memory | 2 | imported | batch2导入 pending_review |
| `formula.equation_ratio` | 化学计量比 | calculation,memory | 1 | imported | batch2导入 pending_review |
| `formula.electron_transfer` | 电子转移计量 | calculation,memory | 1 | imported | batch2导入 pending_review |
| `formula.gas_STP` | 标况气体体积 | calculation,memory | 1 | imported | batch2导入 pending_review |
| `formula.Avogadro` | 阿伏加德罗常数定义 | calculation,memory | 1 | imported | batch2导入 pending_review |

### knowledge

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `kp.redox` | 氧化还原反应 | redox | 1 | seeded_audited | 阶段二示例已入库; batch2审计：不覆盖published；见CHEMISTRY_BATCH2_REPORT |
| `kp.redox.valence_change` | 化合价变化 | redox | 1 | seeded_audited | parent=kp.redox；阶段二示例; batch2审计：不覆盖published；见CHEMISTRY_BATCH2_REPORT |
| `kp.redox.oxidant` | 氧化剂判断 | redox | 1 | seeded_audited | parent=kp.redox；阶段二示例; batch2审计：不覆盖published；见CHEMISTRY_BATCH2_REPORT |
| `kp.redox.reductant` | 还原剂判断 | redox | 1 | seeded_audited | parent=kp.redox；阶段二示例; batch2审计：不覆盖published；见CHEMISTRY_BATCH2_REPORT |
| `kp.redox.ox_product` | 氧化产物判断 | redox | 1 | imported | parent=kp.redox; batch2导入 pending_review |
| `kp.redox.re_product` | 还原产物判断 | redox | 1 | imported | parent=kp.redox; batch2导入 pending_review |
| `kp.redox.e_transfer` | 电子转移 | redox | 1 | imported | parent=kp.redox; batch2导入 pending_review |
| `kp.redox.e_conserve` | 电子守恒 | redox | 1 | imported | parent=kp.redox; batch2导入 pending_review |
| `kp.ion.electrolyte` | 电解质与非电解质 | ion | 1 | imported | batch2导入 pending_review |
| `kp.ion.ionization_eq` | 电离方程式书写 | ion | 1 | imported | batch2导入 pending_review |
| `kp.ion.coexist` | 离子共存判断 | ion | 1 | imported | batch2导入 pending_review |
| `kp.ion.ionic_eq` | 离子方程式书写 | ion | 1 | imported | batch2导入 pending_review |
| `kp.structure.atom` | 原子组成与三粒子 | structure | 1 | imported | batch2导入 pending_review |
| `kp.structure.isotope` | 核素与同位素 | structure | 1 | imported | batch2导入 pending_review |
| `kp.structure.bond` | 化学键类型判断 | structure | 1 | imported | batch2导入 pending_review |
| `kp.structure.electron_formula` | 电子式书写 | structure | 1 | imported | batch2导入 pending_review |
| `kp.periodic.position` | 周期与族定位 | ion | 1 | imported | batch2导入 pending_review |
| `kp.periodic.e_config` | 核外电子排布 | periodic | 1 | imported | batch2导入 pending_review |
| `kp.periodic.trend` | 周期律递变规律 | periodic | 1 | imported | batch2导入 pending_review |
| `kp.calc.amount` | 物质的量三公式 | calculation | 1 | imported | batch2导入 pending_review |
| `kp.calc.concentration` | 物质的量浓度 | ion | 1 | imported | batch2导入 pending_review |
| `kp.calc.dilution` | 稀释计算 | ion | 1 | imported | batch2导入 pending_review |
| `kp.memory.valence_table` | 常见化合价速记 | memory | 1 | imported | batch2导入 pending_review |
| `kp.memory.ion_table` | 常见离子速记 | ion | 1 | imported | batch2导入 pending_review |
| `kp.memory.color_table` | 物质颜色速记 | memory | 2 | imported | batch2导入 pending_review |

## batch3 · 金属化学数据

本批 91 条。

### substance

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `sub.Na` | 钠 | substance,memory | 1 | seeded | 阶段二示例已入库 |
| `sub.Na2O` | 氧化钠 | substance,memory | 1 | pending |  |
| `sub.Na2O2` | 过氧化钠 | substance,memory | 1 | pending |  |
| `sub.NaOH` | 氢氧化钠 | substance,memory | 1 | seeded | 阶段二示例已入库 |
| `sub.Na2CO3` | 碳酸钠 | substance,memory | 1 | pending |  |
| `sub.NaHCO3` | 碳酸氢钠 | substance,memory | 1 | pending |  |
| `sub.NaCl` | 氯化钠 | substance,memory | 2 | pending |  |
| `sub.Mg` | 镁 | substance,memory | 1 | pending |  |
| `sub.MgO` | 氧化镁 | substance,memory | 2 | pending |  |
| `sub.MgOH2` | 氢氧化镁 | substance,memory | 2 | pending |  |
| `sub.Al` | 铝 | substance,memory | 1 | pending |  |
| `sub.Al2O3` | 氧化铝 | substance,memory | 1 | pending |  |
| `sub.AlOH3` | 氢氧化铝 | substance,memory | 1 | pending |  |
| `sub.Fe` | 铁 | substance,memory | 1 | pending |  |
| `sub.Fe2O3` | 氧化铁 | substance,memory | 1 | pending |  |
| `sub.Fe3O4` | 四氧化三铁 | substance,memory | 2 | pending |  |
| `sub.FeOH3` | 氢氧化铁 | substance,memory | 2 | pending |  |
| `sub.FeCl3` | 氯化铁 | substance,memory | 2 | pending |  |
| `sub.Cu` | 铜 | substance,memory | 1 | pending |  |
| `sub.CuO` | 氧化铜 | substance,memory | 1 | pending |  |
| `sub.CuOH2` | 氢氧化铜 | substance,memory | 2 | pending |  |
| `sub.CuSO4` | 硫酸铜 | substance,memory | 1 | pending |  |
| `sub.Zn` | 锌 | substance,memory | 1 | pending |  |
| `sub.Ag` | 银 | substance,memory | 2 | pending |  |
| `sub.H2` | 氢气 | substance,memory | 1 | seeded | 阶段二示例已入库 |
| `sub.H2O` | 水 | substance,memory | 1 | seeded | 阶段二示例已入库 |
| `sub.O2` | 氧气 | substance,memory | 1 | pending |  |
| `sub.CO2` | 二氧化碳 | substance,memory | 1 | pending |  |
| `sub.FeO` | 氧化亚铁 | substance,memory | 1 | pending | 增补；黑色粉末；FeO |
| `sub.FeOH2` | 氢氧化亚铁 | substance,memory,experiment | 1 | pending | 增补；白色→灰绿→红褐氧化过程为重点 |
| `sub.FeSO4` | 硫酸亚铁 | substance,memory,ion | 1 | pending | 增补；亚铁盐代表物；与 sub.FeCl3（铁盐）对照 |
| `sub.NaAlO2` | 偏铝酸钠 | substance,ion,memory | 1 | pending | 增补；两性转化枢纽；溶液中存在形式表述建设时注意 |
| `sub.AlCl3` | 氯化铝 | substance,memory,ion | 1 | pending | 增补；铝盐代表 |

### reaction

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `rxn.2Na_2H2O` | 钠与水反应 | equation,redox,substance | 1 | seeded | 阶段二示例已入库；canonical=2Na+2H2O=2NaOH+H2 |
| `rxn.4Na_O2` | 钠常温与氧气 | equation,redox,substance | 1 | pending | canonical=4Na+O2=2Na2O |
| `rxn.2Na_O2_heat` | 钠加热与氧气 | equation,redox,substance | 1 | pending | canonical=2Na+O2=Na2O2 |
| `rxn.2Na2O2_2H2O` | 过氧化钠与水 | equation,redox,substance | 1 | pending | canonical=2Na2O2+2H2O=4NaOH+O2 |
| `rxn.2Na2O2_2CO2` | 过氧化钠与二氧化碳 | equation,redox,substance | 1 | pending | canonical=2Na2O2+2CO2=2Na2CO3+O2 |
| `rxn.Na2O_H2O` | 氧化钠与水 | equation,redox,substance | 1 | pending | canonical=Na2O+H2O=2NaOH |
| `rxn.NaOH_CO2` | 氢氧化钠与二氧化碳 | equation,redox,substance | 1 | pending | canonical=2NaOH+CO2=Na2CO3+H2O |
| `rxn.NaOH_HCl` | 氢氧化钠与盐酸 | equation,redox,substance | 1 | pending | canonical=NaOH+HCl=NaCl+H2O |
| `rxn.NaHCO3_heat` | 碳酸氢钠受热分解 | equation,redox,substance | 1 | pending | canonical=2NaHCO3=Na2CO3+CO2+H2O |
| `rxn.Na2CO3_2HCl` | 碳酸钠与盐酸 | equation,redox,substance | 1 | pending | canonical=Na2CO3+2HCl=2NaCl+CO2+H2O |
| `rxn.2Mg_O2` | 镁与氧气 | equation,redox,substance | 1 | pending | canonical=2Mg+O2=2MgO |
| `rxn.Mg_2HCl` | 镁与盐酸 | equation,redox,substance | 1 | pending | canonical=Mg+2HCl=MgCl2+H2 |
| `rxn.Mg_CO2` | 镁与二氧化碳 | equation,redox,substance | 2 | pending | canonical=2Mg+CO2=2MgO+C |
| `rxn.4Al_3O2` | 铝与氧气 | equation,redox,substance | 1 | pending | canonical=4Al+3O2=2Al2O3 |
| `rxn.2Al_6HCl` | 铝与盐酸 | equation,redox,substance | 1 | pending | canonical=2Al+6HCl=2AlCl3+3H2 |
| `rxn.2Al_2NaOH` | 铝与氢氧化钠溶液 | equation,redox,substance | 1 | pending | canonical=2Al+2NaOH+2H2O=2NaAlO2+3H2 |
| `rxn.Al2O3_6HCl` | 氧化铝与盐酸 | equation,redox,substance | 1 | pending | canonical=Al2O3+6HCl=2AlCl3+3H2O |
| `rxn.Al2O3_2NaOH` | 氧化铝与氢氧化钠 | equation,redox,substance | 1 | pending | canonical=Al2O3+2NaOH=2NaAlO2+H2O |
| `rxn.AlOH3_NaOH` | 氢氧化铝与氢氧化钠 | equation,redox,substance | 1 | pending | canonical=Al(OH)3+NaOH=NaAlO2+2H2O |
| `rxn.AlOH3_3HCl` | 氢氧化铝与盐酸 | equation,redox,substance | 1 | pending | canonical=Al(OH)3+3HCl=AlCl3+3H2O |
| `rxn.3Fe_2O2` | 铁与氧气 | equation,redox,substance | 1 | pending | canonical=3Fe+2O2=Fe3O4 |
| `rxn.Fe_H2SO4` | 铁与稀硫酸 | equation,redox,substance | 1 | pending | canonical=Fe+H2SO4=FeSO4+H2 |
| `rxn.Fe_CuSO4` | 铁与硫酸铜 | equation,redox,substance | 1 | pending | canonical=Fe+CuSO4=FeSO4+Cu |
| `rxn.Fe2O3_3CO` | 氧化铁与一氧化碳 | equation,redox,substance | 1 | pending | canonical=Fe2O3+3CO=2Fe+3CO2 |
| `rxn.Cu_O2_heat` | 铜加热与氧气 | equation,redox,substance | 1 | pending | canonical=2Cu+O2=2CuO |
| `rxn.CuO_H2` | 氧化铜与氢气 | equation,redox,substance | 1 | pending | canonical=CuO+H2=Cu+H2O |
| `rxn.CuO_2HCl` | 氧化铜与盐酸 | equation,redox,substance | 1 | pending | canonical=CuO+2HCl=CuCl2+H2O |
| `rxn.Zn_H2SO4` | 锌与稀硫酸 | equation,redox,substance | 1 | pending | canonical=Zn+H2SO4=ZnSO4+H2 |
| `rxn.Zn_CuSO4` | 锌与硫酸铜 | equation,redox,substance | 1 | pending | canonical=Zn+CuSO4=ZnSO4+Cu |
| `rxn.FeOH2_O2` | 氢氧化亚铁被氧气氧化 | equation,redox,substance | 1 | pending | 增补；空气中氧化；方程式写法建设时待核实总式表述 |
| `rxn.2Fe2_Cl2` | 亚铁离子被氯气氧化 | equation,redox,ion | 1 | pending | 增补；代表反应 2Fe²⁺+Cl₂=2Fe³⁺+2Cl⁻；canonical建设时核对 |
| `rxn.Na2CO3_CO2_H2O` | 碳酸钠转化为碳酸氢钠 | equation,substance | 1 | pending | 增补；Na2CO3+CO2+H2O=2NaHCO3；与 kp.Na.carbonate 关联 |
| `rxn.2Na_2HCl` | 钠与盐酸反应 | equation,redox,substance | 2 | pending | 增补；与钠和水对比；实验安全性建设时强调 |

### experiment

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `exp.Na_H2O` | 钠与水的反应 | experiment,substance | 1 | seeded | 阶段二示例已入库；危险实验需标注 |
| `exp.Na_O2` | 钠在空气中燃烧 | experiment,substance | 1 | pending |  |
| `exp.Na2O2_H2O` | 过氧化钠与水/二氧化碳 | experiment,substance | 1 | pending |  |
| `exp.Al_amphoteric` | 铝及氧化铝两性验证 | experiment,substance | 1 | pending |  |
| `exp.Fe_rust` | 铁生锈条件探究 | experiment,substance | 2 | pending |  |
| `exp.metal_activity` | 金属活动性顺序实验 | experiment,substance | 1 | pending |  |
| `exp.CuO_H2_reduce` | 氢气还原氧化铜 | experiment,substance | 1 | pending |  |
| `exp.Fe3_SCN` | Fe³⁺与KSCN的检验 | experiment,ion,substance | 1 | pending | 增补；血红色现象 |

### knowledge

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `kp.Na.property` | 钠的化学性质 | substance,equation | 1 | seeded | 阶段二示例已入库 |
| `kp.Na.oxide` | 钠的氧化物与过氧化物 | substance,equation | 1 | pending |  |
| `kp.Na.carbonate` | 碳酸钠与碳酸氢钠 | substance,equation | 1 | pending |  |
| `kp.Al.amphoteric` | 铝及其化合物的两性 | substance,equation | 1 | pending |  |
| `kp.Fe.property` | 铁的化学性质 | substance,equation | 1 | pending |  |
| `kp.metal.activity` | 金属活动性顺序 | substance,equation | 1 | pending |  |
| `kp.metal.smelting` | 金属冶炼思路 | substance,equation | 2 | pending |  |
| `kp.Fe.fe2_property` | Fe²⁺的性质 | ion,redox,substance | 1 | pending | 增补；还原性、浅绿色水溶液等 |
| `kp.Fe.fe3_property` | Fe³⁺的性质 | ion,redox,substance | 1 | pending | 增补；氧化性、黄色/棕黄色溶液等 |
| `kp.Fe.fe2_fe3` | Fe²⁺与Fe³⁺的转化 | redox,ion,equation | 1 | pending | 增补；通论知识点；具体代表反应另建反应条 |
| `kp.Fe.test` | Fe²⁺与Fe³⁺的检验 | ion,experiment,memory | 1 | pending | 增补；KSCN、碱沉淀颜色等；实验细节见 exp.Fe3_SCN |
| `kp.Fe.salt` | 亚铁盐与铁盐 | substance,memory,ion | 1 | pending | 增补；概括两类盐；代表物见 sub.FeSO4 / sub.FeCl3 |
| `kp.metal.pig_iron` | 生铁 | substance,memory | 1 | pending | 增补；含碳量范围、脆性、用途等教材口径 |
| `kp.metal.steel` | 钢 | substance,memory | 1 | pending | 增补；与生铁含碳量及性能区别 |
| `kp.metal.stainless` | 不锈钢 | substance,memory | 2 | pending | 增补；了解级：含铬等提高抗腐蚀；勿展开铬酸盐深度化学 |
| `kp.Al.salt_aluminate` | 铝盐与偏铝酸盐转化 | substance,equation,ion | 1 | pending | 增补；与 kp.Al.amphoteric 互补，侧重盐类转化 |

### concept

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `concept.alloy` | 合金 | substance,memory | 1 | pending | 增补；混合物、性能优于纯金属等 |

## batch4 · 非金属化学数据

本批 74 条。

### substance

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `sub.Cl2` | 氯气 | substance,memory | 1 | pending |  |
| `sub.HCl` | 氯化氢 | substance,memory | 1 | pending |  |
| `sub.HCl_aq` | 盐酸 | substance,memory | 1 | pending |  |
| `sub.HClO` | 次氯酸 | substance,memory | 1 | pending |  |
| `sub.NaClO` | 次氯酸钠 | substance,memory | 2 | pending |  |
| `sub.S` | 硫 | substance,memory | 1 | pending |  |
| `sub.SO2` | 二氧化硫 | substance,memory | 1 | pending |  |
| `sub.SO3` | 三氧化硫 | substance,memory | 2 | pending |  |
| `sub.H2SO4` | 硫酸 | substance,memory | 1 | pending |  |
| `sub.H2SO3` | 亚硫酸 | substance,memory | 2 | pending |  |
| `sub.N2` | 氮气 | substance,memory | 1 | pending |  |
| `sub.NH3` | 氨 | substance,memory | 1 | pending |  |
| `sub.NO` | 一氧化氮 | substance,memory | 1 | pending |  |
| `sub.NO2` | 二氧化氮 | substance,memory | 1 | pending |  |
| `sub.HNO3` | 硝酸 | substance,memory | 1 | pending |  |
| `sub.C` | 碳 | substance,memory | 1 | pending |  |
| `sub.CO` | 一氧化碳 | substance,memory | 1 | pending |  |
| `sub.Si` | 硅 | substance,memory | 1 | pending |  |
| `sub.SiO2` | 二氧化硅 | substance,memory | 1 | pending |  |
| `sub.Na2SiO3` | 硅酸钠 | substance,memory | 2 | pending |  |
| `sub.P` | 白磷/红磷 | substance,memory | 2 | pending |  |
| `sub.P4O10` | 五氧化二磷 | substance,memory | 2 | pending |  |
| `sub.H2S` | 硫化氢 | substance,memory | 2 | pending |  |
| `sub.CaCO3` | 碳酸钙 | substance,memory | 1 | pending |  |
| `sub.CaOH2` | 氢氧化钙 | substance,memory | 1 | pending |  |
| `sub.Br2` | 溴 | substance,memory,periodic | 2 | pending | 增补；单质枢纽；勿展开复杂溴含氧酸体系 |
| `sub.I2` | 碘 | substance,memory,experiment | 2 | pending | 增补；淀粉变蓝；勿把 +5/+7 作为默认必修训练核心 |
| `sub.bleaching_powder` | 漂白粉 | substance,memory | 2 | pending | 增补；主要成分表述（次氯酸钙等）建设时待核实教材口径 |

### reaction

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `rxn.H2_Cl2` | 氢气与氯气 | equation,redox,substance | 1 | pending | canonical=H2+Cl2=2HCl |
| `rxn.2Na_Cl2` | 钠与氯气 | equation,redox,substance | 1 | pending | canonical=2Na+Cl2=2NaCl |
| `rxn.2Fe_3Cl2` | 铁与氯气 | equation,redox,substance | 1 | pending | canonical=2Fe+3Cl2=2FeCl3 |
| `rxn.Cl2_H2O` | 氯气与水 | equation,redox,substance | 1 | pending | canonical=Cl2+H2O=HCl+HClO |
| `rxn.Cl2_2NaOH` | 氯气与氢氧化钠 | equation,redox,substance | 1 | pending | canonical=Cl2+2NaOH=NaCl+NaClO+H2O |
| `rxn.MnO2_4HCl` | 二氧化锰与浓盐酸制氯气 | equation,redox,substance | 1 | pending | canonical=MnO2+4HCl(conc)=MnCl2+Cl2+2H2O |
| `rxn.S_O2` | 硫与氧气 | equation,redox,substance | 1 | pending | canonical=S+O2=SO2 |
| `rxn.2SO2_O2` | 二氧化硫催化氧化 | equation,redox,substance | 1 | pending | canonical=2SO2+O2=2SO3 |
| `rxn.SO3_H2O` | 三氧化硫与水 | equation,redox,substance | 1 | pending | canonical=SO3+H2O=H2SO4 |
| `rxn.Cu_2H2SO4` | 铜与浓硫酸 | equation,redox,substance | 1 | pending | canonical=Cu+2H2SO4(conc)=CuSO4+SO2+2H2O |
| `rxn.C_2H2SO4` | 碳与浓硫酸 | equation,redox,substance | 2 | pending | canonical=C+2H2SO4(conc)=CO2+2SO2+2H2O |
| `rxn.N2_3H2` | 氮气与氢气合成氨 | equation,redox,substance | 1 | pending | canonical=N2+3H2=2NH3 |
| `rxn.NH3_HCl` | 氨与氯化氢 | equation,redox,substance | 1 | pending | canonical=NH3+HCl=NH4Cl |
| `rxn.4NH3_5O2` | 氨的催化氧化 | equation,redox,substance | 1 | pending | canonical=4NH3+5O2=4NO+6H2O |
| `rxn.2NO_O2` | 一氧化氮与氧气 | equation,redox,substance | 1 | pending | canonical=2NO+O2=2NO2 |
| `rxn.3NO2_H2O` | 二氧化氮与水 | equation,redox,substance | 1 | pending | canonical=3NO2+H2O=2HNO3+NO |
| `rxn.Cu_4HNO3` | 铜与稀硝酸 | equation,redox,substance | 1 | pending | canonical=3Cu+8HNO3=3Cu(NO3)2+2NO+4H2O |
| `rxn.Cu_4HNO3c` | 铜与浓硝酸 | equation,redox,substance | 1 | pending | canonical=Cu+4HNO3(conc)=Cu(NO3)2+2NO2+2H2O |
| `rxn.C_O2_incomplete` | 碳不完全燃烧 | equation,redox,substance | 1 | pending | canonical=2C+O2=2CO |
| `rxn.C_O2_complete` | 碳完全燃烧 | equation,redox,substance | 1 | pending | canonical=C+O2=CO2 |
| `rxn.CO2_CaOH2` | 二氧化碳与澄清石灰水 | equation,redox,substance | 1 | pending | canonical=CO2+Ca(OH)2=CaCO3+H2O |
| `rxn.SiO2_2NaOH` | 二氧化硅与氢氧化钠 | equation,redox,substance | 1 | pending | canonical=SiO2+2NaOH=Na2SiO3+H2O |
| `rxn.SiO2_2C` | 二氧化硅与碳制粗硅 | equation,redox,substance | 2 | pending | canonical=SiO2+2C=Si+2CO |
| `rxn.CaCO3_2HCl` | 碳酸钙与盐酸 | equation,redox,substance | 1 | pending | canonical=CaCO3+2HCl=CaCl2+CO2+H2O |
| `rxn.NH4Cl_NaOH` | 氯化铵与氢氧化钠反应 | equation,substance,experiment | 1 | pending | 增补；加热生成氨气的代表反应 |

### experiment

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `exp.Cl2_prep` | 氯气的实验室制法 | experiment,substance | 1 | pending | 危险气体实验禁止家用 |
| `exp.Cl2_property` | 氯气性质实验 | experiment,substance | 1 | pending | 危险气体实验禁止家用 |
| `exp.HCl_prep` | 氯化氢/盐酸相关实验 | experiment,substance | 2 | pending | 危险气体实验禁止家用 |
| `exp.SO2_property` | 二氧化硫漂白与还原性 | experiment,substance | 1 | pending | 危险气体实验禁止家用 |
| `exp.NH3_prep` | 氨的实验室制法与喷泉 | experiment,substance | 1 | pending | 危险气体实验禁止家用 |
| `exp.HNO3_Cu` | 硝酸与铜反应对比 | experiment,substance | 1 | pending | 危险气体实验禁止家用 |
| `exp.CO2_property` | 二氧化碳性质与检验 | experiment,substance | 1 | pending | 危险气体实验禁止家用 |
| `exp.SiO2_glass` | 二氧化硅与玻璃仪器腐蚀警示 | experiment,substance | 2 | pending | 危险气体实验禁止家用 |

### knowledge

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `kp.Cl.property` | 氯气的性质与用途 | substance,experiment,equation | 1 | pending |  |
| `kp.Cl.prep` | 氯气的实验室制取 | substance,experiment,equation | 1 | pending |  |
| `kp.S.oxide` | 硫的氧化物与硫酸 | substance,experiment,equation | 1 | pending |  |
| `kp.N.cycle` | 氮及其化合物转化 | substance,experiment,equation | 1 | pending |  |
| `kp.N.ammonia` | 氨的性质与制取 | substance,experiment,equation | 1 | pending |  |
| `kp.C.oxide` | 碳的氧化物 | substance,experiment,equation | 1 | pending |  |
| `kp.Si.property` | 硅与二氧化硅 | substance,experiment,equation | 1 | pending |  |
| `kp.nonmetal.test` | 常见气体检验方法 | substance,experiment,equation | 1 | pending |  |
| `kp.S.conc_H2SO4` | 浓硫酸的特性 | substance,equation,experiment | 1 | pending | 增补；吸水性、脱水性、强氧化性；与稀硫酸对比 |
| `kp.N.ammonium` | 铵盐的性质 | substance,equation,ion | 1 | pending | 增补；受热分解、与碱反应等 |
| `kp.halogen.compare` | 卤族元素性质比较 | periodic,substance,memory | 2 | pending | 增补；单质氧化性、氢化物稳定性等递变；深度含氧酸标了解/勿超纲 |
| `kp.N.synth_ammonia` | 合成氨反应条件与可逆性 | equation,substance | 2 | pending | 增补；挂接已有 rxn.N2_3H2；条件与限度表述勿写成选修平衡计算 |
| `kp.Cl.bleach` | 氯水与漂白原理 | substance,equation,experiment | 2 | pending | 增补；次氯酸漂白；与 SO2 漂白对比见 batch4 实验 |

## batch5 · 实验和计算数据

本批 42 条。

### experiment

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `exp.instrument_basic` | 常见仪器识别与用途 | experiment | 1 | pending |  |
| `exp.ops_weigh` | 托盘天平称量 | experiment | 1 | pending |  |
| `exp.ops_dissolve` | 溶解与搅拌 | experiment | 1 | pending |  |
| `exp.ops_filter` | 过滤操作 | experiment | 1 | pending |  |
| `exp.ops_evaporate` | 蒸发结晶 | experiment | 1 | pending |  |
| `exp.ops_distill` | 蒸馏操作认知 | experiment | 2 | pending |  |
| `exp.ops_extract` | 分液与萃取认知 | experiment | 2 | pending |  |
| `exp.gas_collect_upward` | 向上排空气法 | experiment | 1 | pending |  |
| `exp.gas_collect_downward` | 向下排空气法 | experiment | 1 | pending |  |
| `exp.gas_collect_water` | 排水集气法 | experiment | 1 | pending |  |
| `exp.O2_prep_KMnO4` | 高锰酸钾制氧气 | experiment | 1 | pending |  |
| `exp.O2_prep_H2O2` | 过氧化氢制氧气 | experiment | 1 | pending |  |
| `exp.H2_prep_Zn` | 锌与稀硫酸制氢气 | experiment | 1 | pending |  |
| `exp.CO2_prep_marble` | 大理石与稀盐酸制二氧化碳 | experiment | 1 | pending |  |
| `exp.check_airtight` | 装置气密性检查 | experiment | 1 | pending |  |
| `exp.safety_rules` | 实验室安全通则 | experiment | 1 | pending |  |
| `exp.ops_volumetric_flask` | 容量瓶定容操作 | experiment,calculation | 1 | pending | 增补 |
| `exp.ops_burette` | 滴定管认知与基本操作 | experiment | 2 | pending | 增补；是否作为必修核心训练待核实，避免按分析化学滴定展开 |
| `exp.flame_test` | 焰色反应 | experiment,substance,memory | 1 | pending | 增补；主知识在实验批；金属批通过关联引用 |

### formula

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `formula.mixed_stoich` | 多步方程式计算关系式法 | calculation | 2 | pending |  |
| `formula.excess_reactant` | 过量计算判断 | calculation | 1 | pending |  |
| `formula.purity` | 纯度与产率 | calculation | 2 | pending |  |
| `formula.ion_conc` | 离子浓度计算入门 | calculation | 2 | pending |  |
| `formula.rate_v` | 化学反应速率定义式 | calculation | 2 | pending | 增补；v=Δc/Δt；单位与平均速率口径建设时写清 |

### knowledge

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `kp.calc.stoich` | 化学方程式计算步骤 | calculation | 1 | pending |  |
| `kp.calc.excess` | 过量问题分析方法 | calculation | 1 | pending |  |
| `kp.calc.gas` | 气体相关计算 | calculation | 1 | pending |  |
| `kp.calc.solution` | 溶液浓度综合 | calculation | 1 | pending |  |
| `kp.exp.design` | 实验方案设计要点 | experiment | 2 | pending |  |
| `kp.exp.error` | 实验误差分析 | experiment | 2 | pending |  |
| `kp.exp.gas_wash_dry` | 气体的洗涤与干燥 | experiment | 1 | pending | 增补；试剂选择与顺序 |
| `kp.rate.factors` | 影响化学反应速率的因素 | experiment,comprehensive | 1 | pending | 增补；浓度、温度、催化剂、接触面积等；关联已有 concept.reaction_rate |
| `kp.extent.le_chatelier_basic` | 化学反应限度与条件影响（定性） | comprehensive | 2 | pending | 增补；仅定性认识；禁止按选修平衡计算展开 |

### question

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `q.calc.amount_basic` | 物质的量基础选择题 | calculation | 1 | pending | 仅骨架，无完整题面 |
| `q.calc.concentration` | 浓度计算填空题 | calculation | 1 | pending | 仅骨架，无完整题面 |
| `q.calc.equation` | 方程式计算题 | equation | 1 | pending | 仅骨架，无完整题面 |
| `q.calc.excess` | 过量计算题 | calculation | 1 | pending | 仅骨架，无完整题面 |
| `q.exp.instrument` | 仪器识别选择题 | experiment | 1 | pending | 仅骨架，无完整题面 |
| `q.exp.gas_collect` | 气体收集方法判断 | experiment | 1 | pending | 仅骨架，无完整题面 |
| `q.exp.safety` | 实验安全判断题 | experiment | 1 | pending | 仅骨架，无完整题面 |
| `q.eq.balance` | 方程式配平题骨架 | equation | 1 | pending | 仅骨架，无完整题面 |

### concept

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `concept.reversible` | 可逆反应 | equation,memory | 1 | pending | 增补；与 concept.reaction_extent 互补 |

## batch6 · 有机、能量及综合知识

本批 79 条。

### substance

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `sub.CH4` | 甲烷 | organic,substance | 1 | pending |  |
| `sub.C2H4` | 乙烯 | organic,substance | 1 | pending |  |
| `sub.C2H6` | 乙烷 | organic,substance | 2 | pending |  |
| `sub.C2H5OH` | 乙醇 | organic,substance | 1 | pending |  |
| `sub.CH3COOH` | 乙酸 | organic,substance | 1 | pending |  |
| `sub.CH3COOCH2CH3` | 乙酸乙酯 | organic,substance | 1 | pending |  |
| `sub.C2H2` | 乙炔 | organic,substance | 2 | pending |  |
| `sub.C3H8` | 丙烷 | organic,substance | 2 | pending |  |
| `sub.C6H6` | 苯 | organic,substance | 3 | pending |  |

### reaction

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `rxn.CH4_Cl2` | 甲烷与氯气取代 | organic,equation | 1 | pending | canonical~CH4+Cl2→CH3Cl+HCl |
| `rxn.C2H4_Br2` | 乙烯与溴加成 | organic,equation | 1 | pending | canonical~C2H4+Br2→C2H4Br2 |
| `rxn.C2H4_H2O` | 乙烯水化制乙醇 | organic,equation | 1 | pending | canonical~C2H4+H2O→C2H5OH |
| `rxn.C2H4_H2` | 乙烯加氢 | organic,equation | 1 | pending | canonical~C2H4+H2→C2H6 |
| `rxn.C2H5OH_O2` | 乙醇催化氧化 | organic,equation | 1 | pending | canonical~2C2H5OH+O2→2CH3CHO+2H2O |
| `rxn.C2H5OH_burn` | 乙醇燃烧 | organic,equation | 1 | pending | canonical~C2H5OH+3O2→2CO2+3H2O |
| `rxn.esterification` | 乙酸乙酯酯化 | organic,equation | 1 | pending | canonical~CH3COOH+C2H5OH⇌CH3COOC2H5+H2O |
| `rxn.CH3COOH_NaOH` | 乙酸与氢氧化钠 | organic,equation | 1 | pending | canonical~CH3COOH+NaOH→CH3COONa+H2O |
| `rxn.CH3COOH_Na2CO3` | 乙酸与碳酸钠 | organic,equation | 1 | pending | canonical~2CH3COOH+Na2CO3→2CH3COONa+CO2+H2O |
| `rxn.C2H4_KMnO4` | 乙烯使酸性高锰酸钾褪色 | organic,equation,experiment | 1 | pending | 增补；现象与鉴别用途；详细产物勿超纲展开 |

### experiment

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `exp.CH4_property` | 甲烷性质实验认知 | organic,experiment | 2 | pending |  |
| `exp.C2H4_prep` | 乙烯的实验室制法 | organic,experiment | 1 | pending |  |
| `exp.C2H4_Br2` | 乙烯使溴水褪色 | organic,experiment | 1 | pending |  |
| `exp.ethanol_oxid` | 乙醇催化氧化 | organic,experiment | 1 | pending |  |
| `exp.esterification` | 乙酸乙酯制备 | organic,experiment | 1 | pending |  |
| `exp.acetic_acid` | 乙酸酸性验证 | organic,experiment | 1 | pending |  |
| `exp.galvanic_Zn_Cu` | 铜锌原电池实验 | experiment,redox | 1 | pending | 增补；典型教学实验 |

### concept

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `concept.homolog` | 同系物 | organic | 1 | pending |  |
| `concept.isomer` | 同分异构体 | organic | 1 | pending |  |
| `concept.functional_group` | 官能团初步 | organic | 1 | pending |  |
| `concept.substitution` | 取代反应 | organic | 1 | pending |  |
| `concept.addition` | 加成反应 | organic | 1 | pending |  |
| `concept.esterification_rule` | 酯化反应规律 | organic | 1 | pending |  |
| `concept.endothermic` | 吸热反应 | memory,comprehensive | 1 | pending | 增补 |
| `concept.exothermic` | 放热反应 | memory,comprehensive | 1 | pending | 增补 |
| `concept.heat_of_reaction` | 反应热 | comprehensive,memory | 2 | pending | 增补；燃烧热/中和热等概念级；计算深度待核实 |
| `concept.addition_polymer` | 加成聚合 | organic | 1 | pending | 增补；如聚乙烯；与乙烯关联 |

### knowledge

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `kp.organic.methane` | 甲烷结构与性质 | organic | 1 | pending |  |
| `kp.organic.alkane` | 烷烃通式与性质 | organic | 1 | pending |  |
| `kp.organic.ethene` | 乙烯结构与性质 | organic | 1 | pending |  |
| `kp.organic.ethanol` | 乙醇结构与性质 | organic | 1 | pending |  |
| `kp.organic.acetic` | 乙酸结构与性质 | organic | 1 | pending |  |
| `kp.organic.isomer_skill` | 同分异构体书写技能 | organic | 1 | pending |  |
| `kp.inference.color` | 颜色推断方法 | inference | 1 | pending |  |
| `kp.inference.block` | 无机框图推断策略 | inference | 1 | pending |  |
| `kp.inference.conversion` | 物质转化推断 | inference | 1 | pending |  |
| `kp.comprehensive.basic` | 基础综合解题框架 | comprehensive | 2 | pending |  |
| `kp.energy.bond_change` | 化学键与能量变化 | structure,comprehensive | 1 | pending | 增补；断键吸热、成键放热（中学口径） |
| `kp.energy.chem_electric` | 化学能与电能 | comprehensive,redox | 1 | pending | 增补 |
| `kp.energy.galvanic` | 原电池 | redox,experiment,comprehensive | 1 | pending | 增补；构成条件总论 |
| `kp.energy.galvanic_poles` | 原电池正负极 | redox,comprehensive | 1 | pending | 增补 |
| `kp.energy.electron_flow` | 原电池电子流向 | redox,comprehensive | 1 | pending | 增补；外电路电子由负极到正极 |
| `kp.energy.electrode_rxn` | 原电池电极反应 | redox,equation,comprehensive | 1 | pending | 增补 |
| `kp.energy.chem_power` | 常见化学电源 | comprehensive,memory | 2 | pending | 增补；了解级，勿展开复杂电化学工程 |
| `kp.energy.thermo_eq` | 热化学方程式书写 | equation,comprehensive | 2 | pending | 增补；注明物质聚集状态与ΔH 符号口径 |
| `kp.sustain.seawater` | 海水资源开发 | comprehensive,substance | 2 | pending | 增补 |
| `kp.sustain.coal` | 煤的综合利用 | comprehensive,organic | 2 | pending | 增补 |
| `kp.organic.petroleum` | 石油分馏 | organic,comprehensive | 1 | pending | 增补；物理变化认识 |
| `kp.organic.cracking` | 石油裂化 | organic,comprehensive | 2 | pending | 增补；与裂解区分；深度待核实 |
| `kp.organic.pyrolysis` | 石油裂解 | organic,comprehensive | 2 | pending | 增补；与裂化区分；深度待核实 |
| `kp.sustain.natural_gas` | 天然气利用 | comprehensive,organic | 2 | pending | 增补 |
| `kp.sustain.fertilizer` | 化肥合理使用 | comprehensive | 2 | pending | 增补 |
| `kp.sustain.pesticide` | 农药合理使用 | comprehensive | 2 | pending | 增补 |
| `kp.sustain.medicine` | 药物合理使用 | comprehensive | 2 | pending | 增补 |
| `kp.sustain.food_additive` | 食品添加剂 | comprehensive | 2 | pending | 增补；合理使用与安全认知 |
| `kp.enviro.pollution` | 环境污染与防治认知 | comprehensive | 2 | pending | 增补 |
| `kp.enviro.acid_rain` | 酸雨 | comprehensive,substance | 1 | pending | 增补；主知识在综合批；非金属批通过关联引用 |
| `kp.sustain.green_chem` | 绿色化学 | comprehensive | 1 | pending | 增补 |
| `kp.sustain.atom_economy` | 原子经济性 | comprehensive,calculation | 2 | pending | 增补；概念级；计算题深度待核实 |
| `kp.organic.biomolecule` | 生命中的基本有机物（了解） | organic,comprehensive | 3 | pending | 增补；糖类油脂蛋白质认知级；勿展开生物详细代谢 |

### question

| 编码 | 名称 | 专项 | 优先级 | 状态 | 备注 |
|------|------|------|--------|------|------|
| `q.organic.methane` | 甲烷选择题骨架 | organic | 1 | pending | 仅骨架 |
| `q.organic.ethene` | 乙烯加成判断题 | organic | 1 | pending | 仅骨架 |
| `q.organic.ethanol` | 乙醇性质填空题 | organic | 1 | pending | 仅骨架 |
| `q.organic.ester` | 酯化反应简答题 | organic | 1 | pending | 仅骨架 |
| `q.organic.isomer` | 同分异构体书写题 | organic | 1 | pending | 仅骨架 |
| `q.inference.block` | 框图推断题骨架 | inference | 1 | pending | 仅骨架 |
| `q.inference.phenomenon` | 现象推断题骨架 | inference | 1 | pending | 仅骨架 |
| `q.eq.Na_water` | 钠与水方程式题 | equation | 1 | seeded | 阶段二示例题已入库 |
| `q.substance.NaOH` | 烧碱俗称与性质题 | substance | 1 | pending | 仅骨架 |
| `q.comprehensive.mock` | 综合模拟题组骨架 | comprehensive | 2 | pending | 仅骨架 |

## 附录 · 12 专项与二级分类 code

（与 `apps/api/src/chemistry/chemistry.seed.ts` 对齐）

### equation · 化学方程式

| 分类 code | 名称 |
|-----------|------|
| `equation.write_from_text` | 根据文字写方程式 |
| `equation.balance` | 方程式配平 |
| `equation.complete_reactant` | 补全反应物 |
| `equation.complete_product` | 补全生成物 |
| `equation.condition` | 反应条件 |
| `equation.true_false` | 方程式正误判断 |
| `equation.ionic_write` | 离子方程式书写 |
| `equation.ionic_correct` | 离子方程式纠错 |
| `equation.redox_analysis` | 氧化还原分析 |
| `equation.conversion` | 物质转化 |

### experiment · 化学实验

| 分类 code | 名称 |
|-----------|------|
| `experiment.instrument_id` | 实验仪器识别 |
| `experiment.instrument_use` | 实验仪器用途 |
| `experiment.basic_ops` | 实验基本操作 |
| `experiment.apparatus_id` | 实验装置识别 |
| `experiment.apparatus_link` | 实验装置连接 |
| `experiment.gas_prep` | 气体制备 |
| `experiment.gas_collect` | 气体收集 |
| `experiment.substance_test` | 物质检验 |
| `experiment.phenomenon_judge` | 实验现象判断 |
| `experiment.phenomenon_desc` | 实验现象描述 |
| `experiment.step_order` | 实验步骤排序 |
| `experiment.conclusion` | 实验结论分析 |
| `experiment.error_fix` | 实验错误纠正 |
| `experiment.safety` | 实验安全 |
| `experiment.plan_design` | 实验方案设计 |
| `experiment.inquiry` | 实验综合探究 |

### substance · 化学物质性质

| 分类 code | 名称 |
|-----------|------|
| `substance.name` | 物质名称 |
| `substance.formula` | 化学式 |
| `substance.color` | 物质颜色 |
| `substance.state` | 物质状态 |
| `substance.solubility` | 溶解性 |
| `substance.chem_property` | 化学性质 |
| `substance.test` | 物质检验 |
| `substance.usage` | 物质用途 |
| `substance.storage` | 物质保存 |
| `substance.identify` | 物质鉴别 |
| `substance.conversion` | 物质转化 |

### calculation · 化学计算

| 分类 code | 名称 |
|-----------|------|
| `calculation.atomic_mass` | 相对原子质量 |
| `calculation.molecular_mass` | 相对分子质量 |
| `calculation.molar_mass` | 摩尔质量 |
| `calculation.amount` | 物质的量 |
| `calculation.avogadro` | 阿伏加德罗常数 |
| `calculation.molar_volume` | 气体摩尔体积 |
| `calculation.concentration` | 物质的量浓度 |
| `calculation.dilution` | 溶液稀释 |
| `calculation.equation_calc` | 化学方程式计算 |
| `calculation.mass_conserve` | 质量守恒 |
| `calculation.electron_conserve` | 电子守恒 |
| `calculation.mixed` | 综合计算 |

### ion · 离子反应

| 分类 code | 名称 |
|-----------|------|
| `ion.electrolyte` | 电解质判断 |
| `ion.nonelectrolyte` | 非电解质判断 |
| `ion.ionization` | 电离方程式 |
| `ion.ionic_write` | 离子方程式书写 |
| `ion.formula_split` | 化学式拆分 |
| `ion.ionic_balance` | 离子方程式配平 |
| `ion.ionic_correct` | 离子方程式纠错 |
| `ion.coexist` | 离子共存 |
| `ion.ion_test` | 离子检验 |
| `ion.mixed` | 综合应用 |

### redox · 氧化还原反应

| 分类 code | 名称 |
|-----------|------|
| `redox.valence` | 化合价判断 |
| `redox.identify` | 氧化还原反应识别 |
| `redox.oxidant` | 氧化剂判断 |
| `redox.reductant` | 还原剂判断 |
| `redox.ox_product` | 氧化产物 |
| `redox.re_product` | 还原产物 |
| `redox.e_direction` | 电子转移方向 |
| `redox.e_count` | 电子转移数量 |
| `redox.double_bridge` | 双线桥法 |
| `redox.single_bridge` | 单线桥法 |
| `redox.ox_re_ability` | 氧化性与还原性 |
| `redox.e_conserve` | 电子守恒 |

### periodic · 元素周期表

| 分类 code | 名称 |
|-----------|------|
| `periodic.elem_name` | 元素名称 |
| `periodic.symbol` | 元素符号 |
| `periodic.atomic_number` | 原子序数 |
| `periodic.atomic_mass` | 相对原子质量 |
| `periodic.period` | 周期 |
| `periodic.group_col` | 族 |
| `periodic.atom_structure` | 原子结构 |
| `periodic.electron_config` | 核外电子排布 |
| `periodic.common_valence` | 常见化合价 |
| `periodic.metal_compare` | 金属性比较 |
| `periodic.nonmetal_compare` | 非金属性比较 |
| `periodic.periodic_law` | 元素周期律 |

### structure · 物质结构

| 分类 code | 名称 |
|-----------|------|
| `structure.atom_compose` | 原子组成 |
| `structure.proton` | 质子数 |
| `structure.neutron` | 中子数 |
| `structure.electron` | 电子数 |
| `structure.atom_diagram` | 原子结构示意图 |
| `structure.ion_diagram` | 离子结构示意图 |
| `structure.nuclide` | 核素 |
| `structure.isotope` | 同位素 |
| `structure.ionic_bond` | 离子键 |
| `structure.covalent_bond` | 共价键 |
| `structure.electron_formula` | 电子式 |
| `structure.ionic_compound` | 离子化合物 |
| `structure.covalent_compound` | 共价化合物 |

### organic · 有机化学

| 分类 code | 名称 |
|-----------|------|
| `organic.basic` | 有机物基础概念 |
| `organic.methane` | 甲烷 |
| `organic.alkane` | 烷烃 |
| `organic.ethene` | 乙烯 |
| `organic.ethanol` | 乙醇 |
| `organic.acetic` | 乙酸 |
| `organic.homolog` | 同系物 |
| `organic.isomer` | 同分异构体 |
| `organic.substitution` | 取代反应 |
| `organic.addition` | 加成反应 |
| `organic.oxidation` | 氧化反应 |
| `organic.esterification` | 酯化反应 |
| `organic.structure_formula` | 有机结构式 |
| `organic.property` | 有机物性质 |

### inference · 化学推断

| 分类 code | 名称 |
|-----------|------|
| `inference.color` | 颜色推断 |
| `inference.phenomenon` | 实验现象推断 |
| `inference.relation` | 反应关系推断 |
| `inference.composition` | 元素组成推断 |
| `inference.valence` | 化合价推断 |
| `inference.conversion` | 物质转化推断 |
| `inference.block_diagram` | 无机框图推断 |
| `inference.mixed` | 综合推断 |

### memory · 化学基础记忆

| 分类 code | 名称 |
|-----------|------|
| `memory.symbol` | 元素符号 |
| `memory.valence` | 常见化合价 |
| `memory.ions` | 常见离子 |
| `memory.formula` | 化学式 |
| `memory.color` | 物质颜色 |
| `memory.precipitate` | 沉淀颜色 |
| `memory.gas` | 气体性质 |
| `memory.common_name` | 物质俗称 |
| `memory.phenomenon` | 实验现象 |
| `memory.equation` | 化学方程式 |
| `memory.chem_formula` | 化学公式 |
| `memory.rules` | 化学规律 |

### comprehensive · 化学综合训练

| 分类 code | 名称 |
|-----------|------|
| `comprehensive.basic` | 基础综合 |
| `comprehensive.medium` | 中等综合 |
| `comprehensive.advanced` | 提高综合 |
| `comprehensive.mistakes` | 错题综合 |
| `comprehensive.weak` | 薄弱知识综合 |
| `comprehensive.timed` | 限时训练 |
| `comprehensive.mock` | 模拟测试 |

## 下一步

第2步：按 `batch2` 灌入元素和基础概念正式数据（JSON 导入或管理端录入），完成后将对应 `status` 更新为 `done`。

