# 高一化学知识库 · Batch6 质量审查报告

> 审查对象：`batch6` **79** 条（有机 / 能量与原电池 / 综合；含复用 `q.eq.Na_water`）
> 依据：`CHEMISTRY_QUALITY_STANDARD.md`、`CHEMISTRY_BATCH6_REPORT.md`、导入包与 DB **只读**核对
> 审查日期：2026-10-18
> **产品定位**：实验专项 = 书面题目训练；不要求线下动手；不开发实验平台。
> **本报告为 AI 辅助专项质量审查，不是人工学科审核。** 通过 ≠ 已经人工审核。
> **本次只读审查，未修改知识正文 / 导入 JSON / 数据库。**

---

## 0. 总览

### 0.1 逐条审查结论（互斥，合计=79）

| 结论 | 数量 |
|------|------|
| 通过（自动检查通过） | **59** |
| 需要修改 | **15** |
| 待核实（待教材核实） | **5** |
| **合计** | **79** |

### 0.2 问题严重度

> **口径 A（知识条数）**：每条取一个主等级（含“通过”条上的提示等级）。

| 级别 | 知识条数 |
|------|----------|
| **P0** | **2** |
| **P1** | **6** |
| **P2** | **25** |
| **P3** | **23** |
| 无等级 | 23 |

> **口径 B（问题条目数）**：结论为「需要修改」或「待核实」的知识条数 = **20**（其中主等级 P0=2，P1=6，P2=12）。

### 0.3 发布与整改判断

| 问题 | 结论 |
|------|------|
| 是否存在重大科学错误（P0） | **是**（乙醇催化氧化/燃烧的氧化产物与还原产物字段对调） |
| 是否阻止正式发布 | **是**（pending_review 为主 + 需改/待核实 + 非人审；另有1条published复用题质量不足） |
| 是否可进入质量整改 | **是** |
| 是否已整改 | **否（本次停止）** |
| 是否开发训练引擎 | **否** |

### 0.4 数据库只读核对

- 79 条均存在；新建 78 条为 `pending_review`；复用 `q.eq.Na_water` 为 `published`。
- 新建 78 条含 `[inv:CODE]`；复用题无 inv 标签（历史数据）。
- 清单总量 **377**；Batch4 `sub.Cl2`、Batch5 `exp.instrument_basic` 样本仍在。
- **未改库。**

### 0.5 Batch5 question reviewNote 遗留（全库核验待办）

建设期曾怀疑 Batch5 的 8 条 question 缺 `reviewNote`。本次只读复查：`chem_questions` id=2..9 **均已含** `[inv:q.calc.*]` / `[inv:q.exp.*]` / `[inv:q.eq.balance]`。

**仍列入全库核验待办**：对全部 `chem_questions` 做一次 `[inv:]` 完整性扫描（含历史 seeded/published），避免遗漏其他批次。**本次不修改 Batch5。**

---

## 1. substance（9）

| 编码 | 名称 | 结论 | 等级 | 问题说明 | 修正建议 | 人工核实 | 范围 | 训练建议 |
|------|------|------|------|----------|----------|----------|------|----------|
| `sub.CH4` | 甲烷 | 通过 | P3 | 正四面体与多种氯代产物表述正确；未见唯一产物误导 | — | 否 | 必修核心 | 可训结构/取代产物多样性；禁唯一氯代物自动题 |
| `sub.C2H4` | 乙烯 | 通过 | P3 | CH2=CH2与加成/KMnO4不指定唯一氧化产物正确 | — | 否 | 必修核心 | 可训加成与褪色鉴别；禁指定唯一氧化产物 |
| `sub.C2H6` | 乙烷 | 通过 | — | — | — | 否 | 必修核心 | 可训与乙烯对比 |
| `sub.C2H5OH` | 乙醇 | 通过 | P3 | 羟基、催化氧化条件与酯化要点正确 | — | 否 | 必修核心 | 可训；催化氧化须写Cu/Ag+加热 |
| `sub.CH3COOH` | 乙酸 | 通过 | — | — | — | 否 | 必修核心 | 可训弱酸通性与强于碳酸 |
| `sub.CH3COOCH2CH3` | 乙酸乙酯 | 通过 | P3 | 两种结构简式写法已注明；水解深度已限 | — | 否 | 必修核心 | 可训酯化产物认知；勿默认复杂水解机理 |
| `sub.C2H2` | 乙炔 | 通过 | P2 | 已标必修了解/待核实深度；内容方向正确但默认训练边界需严格限制 | 默认池排除深度炔烃；仅了解级结构与不饱和性对比 | 否 | 必修了解 | 限了解；勿默认复杂加成/推断 |
| `sub.C3H8` | 丙烷 | 通过 | P3 | 作同系物示例合理；非独立核心物质考点 | — | 否 | 必修了解/同系物示例 | 宜作通式/同系物例，勿单独深挖 |
| `sub.C6H6` | 苯 | 通过 | P2 | 未用错误单双键交替解释化学性质；稳定性与褪色对比正确；已标勿默认芳香取代 | 保持了解级；禁止Kekulé性质误导题 | 否 | 必修了解 | 限结构稳定性与烯烃对比；禁选修芳香取代默认 |

## 2. reaction（10）

| 编码 | 名称 | 结论 | 等级 | 问题说明 | 修正建议 | 人工核实 | 范围 | 训练建议 |
|------|------|------|------|----------|----------|----------|------|----------|
| `rxn.CH4_Cl2` | 甲烷与氯气取代 | 需要修改 | P2 | 科学内容：光照、多种氯代产物说明正确，canonical仅第一步示例可接受；清单categoryCodes机械挂 organic.substitution+addition+esterification，与反应类型不符，易误入错误二级分类题池 | 整改时收窄category为organic.substitution（及equation相关）；species保持示例并继续禁唯一产物判题 | 否 | 必修核心 | 修关联前勿按加成/酯化池抽题；内容可训取代多样性 |
| `rxn.C2H4_Br2` | 乙烯与溴加成 | 需要修改 | P2 | 加成方程式与常温条件正确；清单categoryCodes机械挂 organic.substitution+addition+esterification，与反应类型不符，易误入错误二级分类题池 | category改为organic.addition为主 | 否 | 必修核心 | 修关联前勿入取代/酯化池 |
| `rxn.C2H4_H2O` | 乙烯水化制乙醇 | 需要修改 | P2 | 水化条件写催化剂+加热加压，磷酸“以教材为准”合理；清单categoryCodes机械挂 organic.substitution+addition+esterification，与反应类型不符，易误入错误二级分类题池 | category改为addition；催化剂名称命题时跟教材 | 否 | 必修核心 | 可训条件认知；修关联 |
| `rxn.C2H4_H2` | 乙烯加氢 | 需要修改 | P2 | 加氢条件与产物正确；清单categoryCodes机械挂 organic.substitution+addition+esterification，与反应类型不符，易误入错误二级分类题池 | category改为organic.addition | 否 | 必修核心 | 修关联后可训 |
| `rxn.C2H5OH_O2` | 乙醇催化氧化 | 需要修改 | P0 | P0：ox_product/re_product对调。按高中口径：氧化产物应为CH3CHO（还原剂被氧化所得），还原产物应为H2O（氧化剂被还原所得）；现为ox=H2O、re=CH3CHO；条件Cu/Ag+加热正确；方程式配平正确；清单categoryCodes机械挂 organic.substitution+addition+esterification，与反应类型不符，易误入错误二级分类题池 | 对调ox_product与re_product；category改为oxidation/redox相关；禁用错误字段自动判氧化还原产物 | 否 | 必修核心 | 整改前禁止氧化还原产物自动判题 |
| `rxn.C2H5OH_burn` | 乙醇燃烧 | 需要修改 | P0 | P0：ox_product/re_product对调。氧化产物应侧重CO2（还原剂被氧化），还原产物应为H2O；现为ox=H2O、re=CO2；燃烧配平与点燃条件正确；清单categoryCodes机械挂 organic.substitution+addition+esterification，与反应类型不符，易误入错误二级分类题池 | 对调ox/re产物字段；category勿挂取代/加成/酯化 | 否 | 必修核心 | 整改前禁止依ox/re字段自动判题 |
| `rxn.esterification` | 乙酸乙酯酯化 | 需要修改 | P2 | ⇌、浓硫酸催化加热、产物正确；可逆性明确；清单categoryCodes机械挂 organic.substitution+addition+esterification，与反应类型不符，易误入错误二级分类题池（虽含esterification，但同时误挂substitution/addition） | 仅保留organic.esterification等正确分类 | 否 | 必修核心 | 内容可训酯化；修关联 |
| `rxn.CH3COOH_NaOH` | 乙酸与氢氧化钠 | 需要修改 | P2 | 中和与离子方程式正确（弱酸保留分子）；清单categoryCodes机械挂 organic.substitution+addition+esterification，与反应类型不符，易误入错误二级分类题池 | 改为酸碱/离子反应相关分类，去掉有机三类机械挂靠 | 否 | 必修核心 | 修关联后可训 |
| `rxn.CH3COOH_Na2CO3` | 乙酸与碳酸钠 | 需要修改 | P2 | 配平与酸性强于碳酸正确；离子式写“CO3 2-”不规范（应为CO3^2-）属表达；清单categoryCodes机械挂 organic.substitution+addition+esterification，与反应类型不符，易误入错误二级分类题池 | 规范离子电荷写法；收窄category | 否 | 必修核心 | 修关联与符号后可训 |
| `rxn.C2H4_KMnO4` | 乙烯使酸性高锰酸钾褪色 | 需要修改 | P2 | 不指定唯一氧化产物正确，适合现象题；ox_product与re_product均写成“氧化产物(条件依赖)”，还原产物字段命名错误，自动判题易混 | re_product改为“还原产物(条件依赖，不指定)”或留空并注明仅现象训练；禁产物填空自动题 | 否 | 必修核心（现象） | 仅现象/不饱和性判断；禁唯一产物与复杂离子方程式默认 |

## 3. experiment（7）

| 编码 | 名称 | 结论 | 等级 | 问题说明 | 修正建议 | 人工核实 | 范围 | 训练建议 |
|------|------|------|------|----------|----------|----------|------|----------|
| `exp.CH4_property` | 甲烷性质实验认知 | 通过 | P3 | 书面定位与多氯代、Cl2安全提示正确 | — | 否 | 必修核心 | 可训现象/安全判断；禁动手 |
| `exp.C2H4_prep` | 乙烯的实验室制法 | 通过 | P3 | 约170℃、浓硫酸、副产物了解提示正确；书面高危标注到位 | — | 否 | 必修核心 | 可训装置与温度；禁动手 |
| `exp.C2H4_Br2` | 乙烯使溴水褪色 | 通过 | — | — | — | 否 | 必修核心 | 可训褪色与加成判断 |
| `exp.ethanol_oxid` | 乙醇催化氧化 | 通过 | P3 | Cu丝颜色循环与条件正确 | — | 否 | 必修核心 | 可训条件与现象；禁动手 |
| `exp.esterification` | 乙酸乙酯制备 | 通过 | P3 | 饱和Na2CO3作用与防倒吸要点正确 | — | 否 | 必修核心 | 可训装置评价；禁动手 |
| `exp.acetic_acid` | 乙酸酸性验证 | 通过 | — | — | — | 否 | 必修核心 | 可训酸性验证书面分析 |
| `exp.galvanic_Zn_Cu` | 铜锌原电池实验 | 通过 | P3 | 电子外电路、离子溶液迁移、CuSO4 vs 稀H2SO4正极区分正确；非必须两金属已说明 | — | 否 | 必修核心 | 可训电极/流向；题设必须给出电解质 |

## 4. concept（10）

| 编码 | 名称 | 结论 | 等级 | 问题说明 | 修正建议 | 人工核实 | 范围 | 训练建议 |
|------|------|------|------|----------|----------|----------|------|----------|
| `concept.homolog` | 同系物 | 通过 | — | — | — | 否 | 必修核心 | 可训 |
| `concept.isomer` | 同分异构体 | 通过 | P3 | 已限复杂推断；乙醇/二甲醚示例标了解 | — | 否 | 必修核心（书写限深度） | 可训简单书写；复杂限默认 |
| `concept.functional_group` | 官能团初步 | 需要修改 | P2 | 定义正确；categoryCodes挂organic.homolog/isomer，与官能团概念不符 | 改为官能团/有机基础相关分类 | 否 | 必修核心 | 修关联前勿进同系物/异构专池误抽 |
| `concept.substitution` | 取代反应 | 需要修改 | P2 | 取代定义正确；category误挂homolog/isomer | 改为organic.substitution | 否 | 必修核心 | 修关联 |
| `concept.addition` | 加成反应 | 需要修改 | P2 | 加成定义正确；category误挂homolog/isomer | 改为organic.addition | 否 | 必修核心 | 修关联 |
| `concept.esterification_rule` | 酯化反应规律 | 需要修改 | P2 | 酸脱羟基醇脱氢规律与可逆正确；category误挂homolog/isomer | 改为organic.esterification | 否 | 必修核心 | 修关联 |
| `concept.endothermic` | 吸热反应 | 通过 | — | 明确加热≠吸热；断键吸能成键放能正确 | — | 否 | 必修核心 | 可训易错判断 |
| `concept.exothermic` | 放热反应 | 通过 | — | 与吸热对称，未将放热等同于无需加热 | — | 否 | 必修核心 | 可训 |
| `concept.heat_of_reaction` | 反应热 | 待核实 | P1 | 概念方向正确；燃烧热/中和热与定量深度、ΔH符号口径待对必修二教材；verifyNeeded保留 | 教材定点后决定是否进默认池；禁复杂热量计算默认训练 | 是 | 必修第二册·待核实深度 | 核实前排除默认定量训练 |
| `concept.addition_polymer` | 加成聚合 | 通过 | P2 | 乙烯加聚示例正确；已标必修了解 | 默认限单体-链节对应，勿高分子工程 | 否 | 必修了解 | 了解级可训简单加聚识别 |

## 5. knowledge（33）

| 编码 | 名称 | 结论 | 等级 | 问题说明 | 修正建议 | 人工核实 | 范围 | 训练建议 |
|------|------|------|------|----------|----------|----------|------|----------|
| `kp.organic.methane` | 甲烷结构与性质 | 通过 | P3 | 与物质条一致，强调多氯代 | — | 否 | 必修核心 | 可训 |
| `kp.organic.alkane` | 烷烃通式与性质 | 通过 | — | — | — | 否 | 必修核心 | 可训 |
| `kp.organic.ethene` | 乙烯结构与性质 | 通过 | P3 | KMnO4不指定唯一产物正确 | — | 否 | 必修核心 | 可训 |
| `kp.organic.ethanol` | 乙醇结构与性质 | 通过 | — | — | — | 否 | 必修核心 | 可训 |
| `kp.organic.acetic` | 乙酸结构与性质 | 通过 | — | — | — | 否 | 必修核心 | 可训 |
| `kp.organic.isomer_skill` | 同分异构体书写技能 | 通过 | P2 | 已限复杂推断 | — | 否 | 必修核心（限深度） | 可训简单书写；复杂排除默认 |
| `kp.inference.color` | 颜色推断方法 | 通过 | — | — | — | 否 | 必修核心 | 可训；须多线索验证 |
| `kp.inference.block` | 无机框图推断策略 | 通过 | P2 | 策略正确；复杂综合题勿默认超纲无机链 | — | 否 | 必修核心 | 可训策略；题干控制范围 |
| `kp.inference.conversion` | 物质转化推断 | 通过 | — | — | — | 否 | 必修核心 | 可训 |
| `kp.comprehensive.basic` | 基础综合解题框架 | 通过 | — | — | — | 否 | 必修核心 | 可训 |
| `kp.energy.bond_change` | 化学键与能量变化 | 通过 | — | 断键吸能成键放能正确 | — | 否 | 必修核心 | 可训 |
| `kp.energy.chem_electric` | 化学能与电能 | 通过 | P3 | 电解对比了解级；specialty含redox可接受 | — | 否 | 必修核心 | 可训 |
| `kp.energy.galvanic` | 原电池 | 通过 | P2 | 原理正确；非必须两金属正确；specialty挂experiment略宽（知识点非实验步骤条） | 可选去掉experiment主关联，保留redox/comprehensive | 否 | 必修核心 | 内容可训；关联可收窄 |
| `kp.energy.galvanic_poles` | 原电池正负极 | 通过 | — | — | — | 否 | 必修核心 | 可训 |
| `kp.energy.electron_flow` | 原电池电子流向 | 通过 | — | 电子负极→正极；电流相反；离子迁移正确 | — | 否 | 必修核心 | 可训 |
| `kp.energy.electrode_rxn` | 原电池电极反应 | 通过 | P3 | 强调题设电解质正确 | — | 否 | 必修核心 | 可训；必须给电解质条件 |
| `kp.energy.chem_power` | 常见化学电源 | 通过 | P2 | 了解级已标 | — | 否 | 必修了解 | 限名称用途认知 |
| `kp.energy.thermo_eq` | 热化学方程式书写 | 通过 | P2 | 书写要求正确；定量深度应跟教材，勿默认复杂计算 | — | 否 | 必修核心 | 可训书写格式；禁超纲计算默认 |
| `kp.sustain.seawater` | 海水资源开发 | 通过 | P3 | — | — | 否 | 必修了解 | 可训 |
| `kp.sustain.coal` | 煤的综合利用 | 通过 | P3 | — | — | 否 | 必修了解 | 可训 |
| `kp.organic.petroleum` | 石油分馏 | 通过 | — | 物理变化与裂化区分正确 | — | 否 | 必修了解 | 可训 |
| `kp.organic.cracking` | 石油裂化 | 待核实 | P1 | 与裂解区分方向正确；考法/深度/是否默认核心待教材核实；verifyNeeded保留 | 核实前excludeDefaultTraining | 是 | 了解/待核实 | 核实前不进默认核心池 |
| `kp.organic.pyrolysis` | 石油裂解 | 待核实 | P1 | 裂解获乙烯等方向正确；与裂化边界待核实；verifyNeeded保留 | 核实前excludeDefaultTraining | 是 | 了解/待核实 | 核实前不进默认核心池 |
| `kp.sustain.natural_gas` | 天然气利用 | 通过 | P3 | — | — | 否 | 必修了解 | 可训 |
| `kp.sustain.fertilizer` | 化肥合理使用 | 通过 | — | — | — | 否 | 必修了解 | 可训 |
| `kp.sustain.pesticide` | 农药合理使用 | 通过 | — | — | — | 否 | 必修了解 | 可训 |
| `kp.sustain.medicine` | 药物合理使用 | 通过 | — | — | — | 否 | 必修了解 | 可训 |
| `kp.sustain.food_additive` | 食品添加剂 | 通过 | — | — | — | 否 | 必修了解 | 可训 |
| `kp.enviro.pollution` | 环境污染与防治认知 | 通过 | — | — | — | 否 | 必修核心 | 可训 |
| `kp.enviro.acid_rain` | 酸雨 | 通过 | — | — | — | 否 | 必修核心 | 可训 |
| `kp.sustain.green_chem` | 绿色化学 | 通过 | P3 | 概念认识层次；勿当计算默认 | — | 否 | 必修核心 | 可训 |
| `kp.sustain.atom_economy` | 原子经济性 | 待核实 | P1 | 概念方向正确；挂calculation.mixed易入计算题池；定量公式深度待核实；verifyNeeded保留 | 核实前去掉计算默认关联或标了解；禁原子经济定量默认题 | 是 | 了解/待核实 | 核实前排除默认计算训练 |
| `kp.organic.biomolecule` | 生命中的基本有机物（了解） | 待核实 | P1 | 认知级表述妥当；覆盖深度与是否默认训练待教材核实；verifyNeeded保留 | 核实前excludeDefaultTraining | 是 | 了解/待核实 | 核实前不进默认核心 |

## 6. question（10，含复用）

| 编码 | 名称 | 结论 | 等级 | 问题说明 | 修正建议 | 人工核实 | 范围 | 训练建议 |
|------|------|------|------|----------|----------|----------|------|----------|
| `q.organic.methane` | 甲烷选择题骨架 | 通过 | P3 | 骨架选择题强调正四面体与非唯一氯代；reviewNote已回填 | 充实为正式题前补全选项规范性检查 | 否 | 必修核心 | 骨架非正式卷；可作模板 |
| `q.organic.ethene` | 乙烯加成判断题 | 通过 | P3 | 加成判断骨架合理；reviewNote已回填 | — | 否 | 必修核心 | 骨架模板 |
| `q.organic.ethanol` | 乙醇性质填空题 | 通过 | P3 | 催化氧化条件填空合理 | — | 否 | 必修核心 | 骨架模板 |
| `q.organic.ester` | 酯化反应简答题 | 通过 | P2 | 简答骨架；自动判题需限定要点清单（⇌、浓硫酸、加热、产物） | 正式启用前写采分点与可接受等价写法 | 否 | 必修核心 | 非正式自动判题直至采分点固化 |
| `q.organic.isomer` | 同分异构体书写题 | 通过 | P2 | 书写题多解；须限定碳数与同分异构类型 | 正式题必须限定分子式与异构类型 | 否 | 必修核心（限） | 限条件后方可自动/半自动判 |
| `q.inference.block` | 框图推断题骨架 | 通过 | P2 | 骨架无完整框图数据；不可直接组卷 | 补充具体框图与唯一突破口后再用 | 否 | 视题设 | 禁止直接自动出题 |
| `q.inference.phenomenon` | 现象推断题骨架 | 通过 | P2 | 现象推断骨架需具体试剂链 | 补全现象序列与唯一结论条件 | 否 | 视题设 | 禁止直接自动出题 |
| `q.eq.Na_water` | 钠与水方程式题 | 需要修改 | P1 | 复用published题：题干问“生成物”，答案“NaOH 和 H2”，未要求方程式，与equation专项不完全匹配；无[inv:q.eq.Na_water]；缺options_json等完整选择题结构（视库内实际）；DB专项另挂substance，清单仅equation；未写2Na+2H2O=2NaOH+H2，自动方程式判题不可用 | 整改时另建完整方程式骨架或升级本题：补方程式、配平、条件/现象采分点；勿覆盖时需新建pending题替换训练 | 否 | 必修核心 | 整改前不宜作方程式自动判题唯一标准 |
| `q.substance.NaOH` | 烧碱俗称与性质题 | 通过 | P3 | 烧碱俗称骨架；reviewNote已回填 | — | 否 | 必修核心 | 骨架模板 |
| `q.comprehensive.mock` | 综合模拟题组骨架 | 通过 | P2 | 综合模拟题组仅为骨架占位，无完整卷面 | 充实小题集与评分细则后方可训练 | 否 | 视组成 | 禁止直接当正式套卷 |

---

## 7. 有机化学问题清单

| 编码 | 等级 | 摘要 |
|------|------|------|
| `rxn.CH4_Cl2` | P2 | 科学内容：光照、多种氯代产物说明正确，canonical仅第一步示例可接受 |
| `rxn.C2H4_Br2` | P2 | 加成方程式与常温条件正确 |
| `rxn.C2H4_H2O` | P2 | 水化条件写催化剂+加热加压，磷酸“以教材为准”合理 |
| `rxn.C2H4_H2` | P2 | 加氢条件与产物正确 |
| `rxn.C2H5OH_O2` | P0 | P0：ox_product/re_product对调。按高中口径：氧化产物应为CH3CHO（还原剂被氧化所得），还原产物应为H2O（氧化剂被还原所得）；现为ox=H2O、re=CH3CHO |
| `rxn.C2H5OH_burn` | P0 | P0：ox_product/re_product对调。氧化产物应侧重CO2（还原剂被氧化），还原产物应为H2O；现为ox=H2O、re=CO2 |
| `rxn.esterification` | P2 | ⇌、浓硫酸催化加热、产物正确；可逆性明确 |
| `rxn.CH3COOH_NaOH` | P2 | 中和与离子方程式正确（弱酸保留分子） |
| `rxn.CH3COOH_Na2CO3` | P2 | 配平与酸性强于碳酸正确；离子式写“CO3 2-”不规范（应为CO3^2-）属表达 |
| `concept.functional_group` | P2 | 定义正确 |
| `concept.substitution` | P2 | 取代定义正确 |
| `concept.addition` | P2 | 加成定义正确 |
| `concept.esterification_rule` | P2 | 酸脱羟基醇脱氢规律与可逆正确 |
| `kp.organic.cracking` | P1 | 与裂解区分方向正确；考法/深度/是否默认核心待教材核实；verifyNeeded保留 |
| `kp.organic.pyrolysis` | P1 | 裂解获乙烯等方向正确；与裂化边界待核实；verifyNeeded保留 |
| `kp.organic.biomolecule` | P1 | 认知级表述妥当；覆盖深度与是否默认训练待教材核实；verifyNeeded保留 |
| `rxn.C2H4_KMnO4` | P2 | 不指定唯一氧化产物正确，适合现象题 |

有机相关需改反应条数：**10**（含 2 条 P0）。

## 8. 能量变化问题清单

- `concept.endothermic` / `exothermic` / `kp.energy.bond_change`：**通过**（加热≠吸热；断键吸能、成键放能）。
- `concept.heat_of_reaction`：**待核实**（定量/燃烧热中和热口径）。
- `kp.energy.thermo_eq`：通过，但限制默认复杂计算。

## 9. 原电池问题清单

- 原理/电子流向/电极反应/实验书面条：科学表述**通过**。
- `kp.energy.galvanic`：experiment 专项挂靠略宽（P2 提示，结论仍通过）。
- 未发现“电子在溶液中流动”或“必须两种不同金属”的错误断言。

## 10. 实验知识问题清单

- 7 条均书面定位 + 禁家用；高危（Cl2、浓硫酸加热等）有安全限制。
- 未见鼓励线下动手。建设期实验条**无「需要修改」**。

## 11. 专项关联问题清单

| 问题 | 涉及 |
|------|------|
| 有机反应 category 机械三挂（取代+加成+酯化） | 除 `rxn.C2H4_KMnO4` 外共 9 条 reaction |
| 概念 category 误挂 homolog/isomer | functional_group / substitution / addition / esterification_rule |
| atom_economy 挂 calculation.mixed | 待核实条，易入计算池 |
| galvanic 知识点挂 experiment | 可收窄 |

## 12. 课程范围争议清单

| 内容 | 建议定位 |
|------|----------|
| 乙炔、苯、丙烷 | 必修了解；限制默认深度 |
| 裂化/裂解 | 待核实；排除默认核心 |
| 反应热定量、原子经济性计算 | 待核实/限制 |
| 生物大分子 | 待核实了解级 |
| 加聚、化学电源 | 了解级 |

## 13. 自动出题风险清单

| 风险 | 编码 |
|------|------|
| ox/re 字段对调导致氧化还原产物误判 | `rxn.C2H5OH_O2`, `rxn.C2H5OH_burn` |
| 错误二级分类抽题 | 9 条有机反应 + 4 条概念 |
| KMnO4 产物填空 | `rxn.C2H4_KMnO4` |
| 复用题不能作方程式自动标准 | `q.eq.Na_water` |
| 推断/综合/异构骨架缺约束 | `q.inference.*`, `q.organic.isomer`, `q.comprehensive.mock` |
| 酯化简答需采分点 | `q.organic.ester` |

## 14. 5 条待教材核实详情

| 编码 | 可确认事实 | 争议/待核实 | 默认训练 |
|------|------------|-------------|----------|
| `concept.heat_of_reaction` | 反应热与状态、ΔH相关 | 燃烧热/中和热是否默认、定量深度 | 限制 |
| `kp.organic.cracking` | 长链变短链、提轻质油 | 与裂解边界、考法 | 限制 |
| `kp.organic.pyrolysis` | 深度断裂得乙烯等 | 条件与必修地位 | 限制 |
| `kp.sustain.atom_economy` | 原子利用率概念 | 公式与计算是否入必修 | 限制 |
| `kp.organic.biomolecule` | 糖脂蛋白等认知 | 覆盖深度 | 限制 |

**未取消 verifyNeeded；未标人工审核通过。**

## 15. 推荐整改方案（本次不执行）

1. **P0优先**：对调 `rxn.C2H5OH_O2`、`rxn.C2H5OH_burn` 的 ox/re 产物字段。
2. **关联整改**：按真实反应类型重写 9 条 reaction 与 4 条 concept 的 categoryCodes，并同步 DB 关联。
3. **KMnO4**：修正 re_product 命名；训练限现象。
4. **`q.eq.Na_water`**：新建完整方程式骨架（pending）或升级采分点；勿静默覆盖 published。
5. **5 条核实**：教材对照后决定去标或继续限制。
6. **全库核验待办**：扫描全部 question 的 `[inv:]`（Batch5 本次抽查已有标签，仍建议全量）。

## 16. 审查局限性

- AI 审查 ≠ 人工学科审核；未核对具体教材页码。
- 未跑自动组卷引擎实测。
- 离子式电荷排版、催化剂商品名等以教材题设为准的细节可能仍有口径差。

## 17. 统计复核

通过 59 + 需要修改 15 + 待核实 5 = 79（必须为 79）。

---

*报告结束。等待指令后再进入质量整改。*
