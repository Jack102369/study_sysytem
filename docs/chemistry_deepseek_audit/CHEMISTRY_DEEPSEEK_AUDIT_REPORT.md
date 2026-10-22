# 化学知识库 DeepSeek 全量审核报告

> 生成时间：2026-10-18T12:15:46.003Z
> 模型：`deepseek-chat`
> 待审导出总数：358
> 已完成审核：**358**
> API/解析失败条目：**0**
> 未覆盖条目：**0**

## 重要说明

- 本报告为审核建议，**尚未**将数据库 `status` 改为 `published`。
- `verifyNeeded=true` 条目硬规则封顶为 `HOLD_RESTRICTED`。
- 发布前请人工抽检 `publish_whitelist.json`。

## 分级汇总

| 分级 | 数量 |
|------|------|
| PASS_PUBLISH（建议可发布） | 239 |
| HOLD_RESTRICTED（暂缓/受限） | 118 |
| REJECT_FIX（需修改） | 1 |

## 分类型 × 分级

| 类型 | PASS | HOLD | REJECT |
|------|------|------|--------|
| concept | 21 | 14 | 0 |
| element | 24 | 1 | 0 |
| experiment | 27 | 14 | 0 |
| formula | 10 | 6 | 0 |
| knowledge | 74 | 17 | 0 |
| question | 0 | 16 | 1 |
| reaction | 59 | 8 | 0 |
| substance | 24 | 42 | 0 |

## PASS_PUBLISH 白名单预览（239）

| 编码 | 类型 | 名称 | 置信度 | 主要理由 |
|------|------|------|--------|----------|
| `el.He` | element | 氦 | 0.95 | 符号He、原子序数2、中文名氦、英文名Helium均正确 |
| `el.Li` | element | 锂 | 0.95 | 符号Li、原子序数3、中文名锂、英文名Lithium均正确 |
| `el.Be` | element | 铍 | 0.93 | 符号Be、原子序数4、中文名铍、英文名Beryllium均正确 |
| `el.B` | element | 硼 | 0.95 | 符号B、原子序数5、中文名硼、英文名Boron均正确 |
| `el.C` | element | 碳 | 0.97 | 元素符号C、原子序数6、中文名碳、英文名Carbon均正确 |
| `el.N` | element | 氮 | 0.95 | 元素符号N、原子序数7、中文名氮、英文名Nitrogen均正确 |
| `el.F` | element | 氟 | 0.97 | 元素符号F、原子序数9、中文名氟、英文名Fluorine均正确 |
| `el.Ne` | element | 氖 | 0.95 | 元素符号Ne、原子序数10、中文名氖、英文名Neon均正确 |
| `el.Mg` | element | 镁 | 0.98 | 符号Mg、原子序数12、中文名镁、英文名Magnesium均正确 |
| `el.Al` | element | 铝 | 0.97 | 符号Al、原子序数13、中文名铝正确 |
| `el.Si` | element | 硅 | 0.98 | 符号Si、原子序数14、中文名硅、英文名Silicon均正确 |
| `el.P` | element | 磷 | 0.98 | 符号P、原子序数15、中文名磷、英文名Phosphorus均正确 |
| `el.S` | element | 硫 | 0.97 | 符号S、原子序数16、中文名硫、英文Sulfur均正确 |
| `el.K` | element | 钾 | 0.97 | 符号K、原子序数19、中文名钾、英文Potassium均正确 |
| `el.Ca` | element | 钙 | 0.97 | 符号Ca、原子序数20、中文名钙、英文Calcium均正确 |
| `el.Fe` | element | 铁 | 0.98 | 元素符号Fe、原子序数26、中文名铁、英文名Iron均正确 |
| `el.Cu` | element | 铜 | 0.98 | 元素符号Cu、原子序数29、中文名铜、英文名Copper均正确 |
| `el.Zn` | element | 锌 | 0.98 | 元素符号Zn、原子序数30、中文名锌、英文名Zinc均正确 |
| `el.Ag` | element | 银 | 0.98 | 元素符号Ag、原子序数47、中文名银、英文名Silver均正确 |
| `el.Ba` | element | 钡 | 0.95 | 符号Ba、原子序数56、中文名钡、英文名Barium、金属分类均正确 |
| `el.I` | element | 碘 | 0.95 | 符号I、原子序数53、中文名碘、英文名Iodine、非金属分类均正确 |
| `el.Mn` | element | 锰 | 0.95 | 符号Mn、原子序数25、中文名锰、英文名Manganese、金属分类均正确 |
| `el.Cr` | element | 铬 | 0.95 | 符号Cr、原子序数24、中文名铬、英文名Chromium、金属分类均正确 |
| `el.Br` | element | 溴 | 0.97 | 溴的元素符号Br、原子序数35、中文名溴、英文名Bromine均正确 |
| `concept.substance_class` | concept | 物质的分类 | 0.95 | 分类层级（纯净物/混合物→单质/化合物→氧化物、酸、碱、盐）符合人教版必修一表述 |
| `concept.pure_mixture` | concept | 纯净物与混合物 | 0.95 | 纯净物与混合物定义准确，强调各成分保持原有性质符合教材表述 |
| `concept.elemental_compound` | concept | 单质与化合物 | 0.96 | 定义已补“纯净物”，单质/化合物概念准确 |
| `concept.electrolyte` | concept | 电解质 | 0.95 | 定义与教材一致：水溶液或熔融状态能导电的化合物 |
| `concept.nonelectrolyte` | concept | 非电解质 | 0.95 | 定义准确：水溶液和熔融状态均不导电的化合物 |
| `concept.ionic_reaction` | concept | 离子反应本质 | 0.92 | 离子反应定义与实质（离子浓度减小）表述准确 |
| `concept.ion_coexist` | concept | 离子共存条件 | 0.95 | 定义准确：离子共存取决于离子间是否发生反应使离子大量减少 |
| `concept.oxidant_reductant` | concept | 氧化剂与还原剂 | 0.95 | 定义准确：氧化剂得电子化合价降低，还原剂失电子化合价升高 |
| `concept.periodic_law` | concept | 元素周期律 | 0.95 | 定义准确，符合人教版必修表述：性质随原子序数递增呈周期性变化 |
| `concept.metal_trend` | concept | 金属性递变 | 0.95 | 定义准确：同周期从左到右金属性减弱、同主族从上到下金属性增强，符合人教版必修与高考表述。 |
| `concept.nonmetal_trend` | concept | 非金属性递变 | 0.95 | 定义准确：同周期从左到右非金属性增强、同主族从上到下非金属性减弱，符合课标表述。 |
| `concept.ionic_bond` | concept | 离子键 | 0.95 | 定义采用'阴、阳离子之间通过静电作用形成'，为人教版标准表述，准确。 |
| `concept.covalent_bond` | concept | 共价键 | 0.95 | 定义'原子间通过共用电子对形成'符合教材标准表述。 |
| `concept.reaction_extent` | concept | 化学反应限度 | 0.9 | 明确区分反应限度与反应速率，符合高一必修对可逆反应限度的表述 |
| `concept.electron_conserve` | concept | 电子守恒 | 0.95 | 定义准确：还原剂失电子总数等于氧化剂得电子总数，符合氧化还原反应本质。 |
| `concept.solution_colloid` | concept | 溶液与胶体 | 0.95 | 分散系按分散质粒子大小分类及胶体粒子直径1–100 nm表述准确，符合人教版必修一。 |
| `formula.N_n_NA` | formula | 粒子数与物质的量 | 0.95 | 表达式 N = n·NA 正确，变量说明清晰，符合人教版必修一物质的量内容 |
| `formula.c_n_V` | formula | 物质的量浓度 | 0.95 | c = n/V 正确，变量明确 V 为溶液体积而非溶剂体积，符合规范 |
| `formula.dilution` | formula | 溶液稀释 | 0.95 | c1V1 = c2V2 稀释公式正确，变量说明体现溶质物质的量守恒 |
| `formula.M_m_n` | formula | 摩尔质量 | 0.95 | M=m/n 为摩尔质量定义式，符合高一必修表述 |
| `formula.rho_c_M` | formula | 密度与浓度换算 | 0.93 | c=1000ρω/M 为质量分数与物质的量浓度换算标准式，系数1000与ρ(g/cm³)、ω(小数)配套正确 |
| `formula.electron_transfer` | formula | 电子转移计量 | 0.95 | 表述“失电子总数=得电子总数”是氧化还原配平的核心依据，准确且符合高一/高考规范 |
| `formula.gas_STP` | formula | 标况气体体积 | 0.93 | V=n·22.4 L/mol 为标准状况下气体摩尔体积的通行近似表述，符合高一教学 |
| `kp.redox.ox_product` | knowledge | 氧化产物判断 | 0.92 | 氧化产物为还原剂被氧化（化合价升高）后的产物，定义准确 |
| `kp.redox.e_transfer` | knowledge | 电子转移 | 0.9 | 氧化还原本质为电子转移（含共用电子对偏移）表述准确 |
| `kp.redox.e_conserve` | knowledge | 电子守恒 | 0.92 | 电子守恒'失电子总数=得电子总数'表述准确 |
| `kp.ion.electrolyte` | knowledge | 电解质与非电解质 | 0.93 | 电解质/非电解质定义准确（水溶液或熔融状态导电的化合物） |
| `kp.ion.ionization_eq` | knowledge | 电离方程式书写 | 0.95 | 强电解质用“=”、弱电解质用“⇌”符合高一教材表述 |
| `kp.ion.ionic_eq` | knowledge | 离子方程式书写 | 0.93 | 拆分原则（强电解质拆、沉淀气体弱电解质单质氧化物不拆）表述准确 |
| `kp.structure.atom` | knowledge | 原子组成与三粒子 | 0.95 | 质子数=核电荷数=原子序数表述正确 |
| `kp.structure.isotope` | knowledge | 核素与同位素 | 0.95 | 核素定义（一定质子数和中子数的原子）准确 |
| `kp.structure.electron_formula` | knowledge | 电子式书写 | 0.9 | 简单阳离子只写离子符号、阴离子与复杂阳离子（NH₄⁺）画电子式的区分准确 |
| `kp.periodic.position` | knowledge | 周期与族定位 | 0.95 | 周期数=电子层数、主族序数=最外层电子数，符合高一教材表述 |
| `kp.periodic.trend` | knowledge | 周期律递变规律 | 0.92 | 同周期/同主族金属性、非金属性、原子半径递变方向正确 |
| `kp.calc.amount` | knowledge | 物质的量三公式 | 0.95 | n=m/M、n=N/NA、n=V/22.4（标况气体）三公式正确 |
| `kp.calc.dilution` | knowledge | 稀释计算 | 0.95 | 稀释前后溶质物质的量不变，c1V1=c2V2 表述正确，符合高一与高考规范 |
| `kp.memory.valence_table` | knowledge | 常见化合价速记 | 0.9 | K/Na +1、Ca/Mg/Ba/Zn +2、Al +3、F −1、O 通常−2（过氧化物−1）等均正确 |
| `kp.memory.ion_table` | knowledge | 常见离子速记 | 0.92 | 所列 NH₄⁺、SO₄²⁻、CO₃²⁻、Fe²⁺/Fe³⁺、Al³⁺ 等离子符号与电荷书写正确 |
| `kp.memory.color_table` | knowledge | 物质颜色速记 | 0.9 | Cl₂黄绿、Br₂深红棕、I₂紫黑、Cu²⁺蓝色、Fe²⁺浅绿、Fe³⁺黄/棕黄、Fe(OH)₂白、Fe(OH)₃红褐、Cu(OH)₂蓝均正确 |
| `sub.Al` | substance | 铝 | 0.95 | 铝为银白色金属，颜色描述准确 |
| `sub.Fe` | substance | 铁 | 0.95 | 铁为银白色金属，粉末呈灰黑描述合理 |
| `sub.Fe2O3` | substance | 氧化铁 | 0.95 | 氧化铁化学式Fe2O3正确，颜色红棕色符合人教版必修表述 |
| `sub.Fe3O4` | substance | 四氧化三铁 | 0.95 | 四氧化三铁化学式Fe3O4正确，颜色黑色符合教材表述 |
| `sub.FeOH3` | substance | 氢氧化铁 | 0.95 | 氢氧化铁化学式Fe(OH)3正确，颜色红褐色符合教材表述 |
| `sub.Cu` | substance | 铜 | 0.95 | 铜为紫红色固体，颜色描述符合高一教材与高考规范 |
| `sub.CuO` | substance | 氧化铜 | 0.95 | 氧化铜为黑色固体，颜色描述准确 |
| `sub.CuOH2` | substance | 氢氧化铜 | 0.95 | 氢氧化铜为蓝色沉淀，颜色描述准确 |
| `sub.CuSO4` | substance | 硫酸铜 | 0.95 | 无水硫酸铜白色、五水合硫酸铜蓝色，颜色描述准确且区分了水合状态 |
| `rxn.4Na_O2` | reaction | 钠常温与氧气 | 0.95 | 方程式4Na+O2=2Na2O配平正确，符合钠常温缓慢氧化的教材表述 |
| `rxn.2Na_O2_heat` | reaction | 钠加热与氧气 | 0.95 | 方程式2Na+O2=Na2O2配平正确，符合钠加热燃烧生成过氧化钠的教材表述 |
| `rxn.2Na2O2_2H2O` | reaction | 过氧化钠与水 | 0.95 | 方程式2Na2O2+2H2O=4NaOH+O2↑配平正确，符合教材表述 |
| `rxn.2Na2O2_2CO2` | reaction | 过氧化钠与二氧化碳 | 0.95 | 方程式2Na2O2+2CO2=2Na2CO3+O2↑配平正确，符合教材表述 |
| `rxn.Na2O_H2O` | reaction | 氧化钠与水 | 0.95 | 方程式Na2O+H2O=2NaOH配平正确，符合高一必修钠的氧化物性质 |
| `rxn.NaOH_HCl` | reaction | 氢氧化钠与盐酸 | 0.95 | NaOH+HCl=NaCl+H2O配平正确，中和反应典型 |
| `rxn.NaHCO3_heat` | reaction | 碳酸氢钠受热分解 | 0.95 | 2NaHCO3=△=Na2CO3+CO2↑+H2O配平正确，符合必修碳酸氢钠受热分解 |
| `rxn.Na2CO3_2HCl` | reaction | 碳酸钠与盐酸 | 0.95 | 方程式 Na2CO3+2HCl=2NaCl+CO2↑+H2O 配平正确，系数与物种一致 |
| `rxn.2Mg_O2` | reaction | 镁与氧气 | 0.95 | 2Mg+O2=点燃=2MgO 配平正确，条件点燃准确 |
| `rxn.Mg_2HCl` | reaction | 镁与盐酸 | 0.95 | Mg+2HCl=MgCl2+H2↑ 配平正确，稀盐酸条件合理 |
| `rxn.4Al_3O2` | reaction | 铝与氧气 | 0.95 | 方程式4Al+3O2=点燃=2Al2O3配平正确，符合高一教材表述 |
| `rxn.2Al_6HCl` | reaction | 铝与盐酸 | 0.95 | 方程式2Al+6HCl=2AlCl3+3H2↑配平正确，符合高一教材 |
| `rxn.Al2O3_6HCl` | reaction | 氧化铝与盐酸 | 0.95 | 方程式Al2O3+6HCl=2AlCl3+3H2O配平正确，符合高一教材 |
| `rxn.AlOH3_3HCl` | reaction | 氢氧化铝与盐酸 | 0.95 | 方程式配平正确：Al(OH)3+3HCl=AlCl3+3H2O，原子守恒。 |
| `rxn.3Fe_2O2` | reaction | 铁与氧气 | 0.95 | 方程式配平正确：3Fe+2O2=点燃=Fe3O4，原子守恒。 |
| `rxn.Fe_H2SO4` | reaction | 铁与稀硫酸 | 0.95 | 方程式Fe+H2SO4=FeSO4+H2↑配平正确，符合高一金属与酸反应规范 |
| `rxn.Fe_CuSO4` | reaction | 铁与硫酸铜 | 0.95 | 置换反应Fe+CuSO4=FeSO4+Cu配平正确，符合高一金属活动性顺序教学 |
| `rxn.Fe2O3_3CO` | reaction | 氧化铁与一氧化碳 | 0.95 | Fe2O3+3CO=高温=2Fe+3CO2配平正确，为高炉炼铁核心反应，符合课标 |
| `rxn.Cu_O2_heat` | reaction | 铜加热与氧气 | 0.95 | 2Cu+O2=△=2CuO配平正确，铜加热氧化为高一常见反应 |
| `rxn.CuO_H2` | reaction | 氧化铜与氢气 | 0.95 | 方程式CuO+H2=△=Cu+H2O配平正确，属置换/氧化还原反应 |
| `rxn.CuO_2HCl` | reaction | 氧化铜与盐酸 | 0.93 | CuO+2HCl=CuCl2+H2O配平正确，属碱性氧化物与酸反应 |
| `rxn.Zn_H2SO4` | reaction | 锌与稀硫酸 | 0.95 | Zn+H2SO4=ZnSO4+H2↑配平正确，属置换/氧化还原 |
| `rxn.Zn_CuSO4` | reaction | 锌与硫酸铜 | 0.95 | Zn+CuSO4=ZnSO4+Cu配平正确，属置换/氧化还原 |
| `exp.Na_O2` | experiment | 钠在空气中燃烧 | 0.95 | 反应方程式2Na+O2=点燃=Na2O2正确，产物淡黄色固体表述准确 |
| `exp.Na2O2_H2O` | experiment | 过氧化钠与水/二氧化碳 | 0.95 | 两个反应方程式配平正确，O2↑标注规范 |
| `exp.Al_amphoteric` | experiment | 铝及氧化铝两性验证 | 0.9 | 正确区分单质Al与酸碱反应放H2、Al2O3/Al(OH)3两性溶解两类内容 |
| `exp.metal_activity` | experiment | 金属活动性顺序实验 | 0.9 | 目的、原理符合高一必修金属活动性顺序内容，表述准确 |
| `exp.CuO_H2_reduce` | experiment | 氢气还原氧化铜 | 0.9 | 原理方程式CuO+H2=△=Cu+H2O正确 |
| … | … | 其余 139 条见 JSON | … | … |

## HOLD_RESTRICTED（118）

| 编码 | 类型 | 名称 | 置信度 | 主要理由 |
|------|------|------|--------|----------|
| `el.Ar` | element | 氩 | 0.8 | 符号Ar、原子序数18、名称氩/Argon正确 |
| `concept.ionization` | concept | 电离 | 0.85 | 定义基本正确，但电离方程式书写不规范：NaCl=Na++Cl- 应为 NaCl=Na⁺+Cl⁻，H2SO4=2H++SO42- 应为 H2SO4=2H⁺+SO₄ |
| `concept.valence_rules` | concept | 化合价规则 | 0.8 | 定义表述笼统，'化合能力'非规范术语，未给出具体规则内容 |
| `concept.reaction_rate` | concept | 化学反应速率 | 0.8 | 定义仅说“表示反应进行的快慢”，过于笼统，未给出高中通行表述（单位时间内反应物浓度减少或生成物浓度增加） |
| `concept.mass_conserve` | concept | 质量守恒定律 | 0.75 | 定义表述准确，符合初中/高一质量守恒定律通行说法 |
| `concept.charge_conserve` | concept | 电荷守恒 | 0.7 | 定义采用“正负电荷代数和守恒”表述，方向正确，符合整改说明 |
| `concept.acid_base_salt` | concept | 酸碱盐概念 | 0.8 | 酸碱盐定义基于电离理论，符合高中表述，基本可用。 |
| `concept.oxide_class` | concept | 氧化物分类 | 0.85 | 氧化物定义准确：两种元素组成且一种为氧。 |
| `formula.Vm` | formula | 气体摩尔体积 | 0.8 | Vm = V/n 为定义式，本身正确 |
| `formula.mass_percent` | formula | 质量分数 | 0.85 | w=m(溶质)/m(溶液) 定义正确 |
| `formula.equation_ratio` | formula | 化学计量比 | 0.8 | 计量数之比等于物质的量之比表述正确 |
| `formula.Avogadro` | formula | 阿伏加德罗常数定义 | 0.8 | NA≈6.02×10^23 mol^-1 数值正确，但条目名为“定义”，而定义应为“1 mol 粒子所含粒子数”，此处仅给近似值，名实略不符 |
| `kp.redox.re_product` | knowledge | 还原产物判断 | 0.8 | 还原产物定义正确（氧化剂得电子、化合价降低后的产物） |
| `kp.ion.coexist` | knowledge | 离子共存判断 | 0.8 | 判断角度（沉淀、气体、水、氧化还原、弱电解质）基本正确 |
| `kp.structure.bond` | knowledge | 化学键类型判断 | 0.8 | “活泼金属+活泼非金属倾向离子键、非金属之间倾向共价键”为经验性判断，表述偏绝对 |
| `kp.periodic.e_config` | knowledge | 核外电子排布 | 0.75 | 核外电子排布基本规则（先内后外、每层最多2n^2、最外层≤8）符合高中口径 |
| `kp.calc.concentration` | knowledge | 物质的量浓度 | 0.7 | c=n/V基本公式正确，体积单位L的提醒正确 |
| `sub.Na2O` | substance | 氧化钠 | 0.7 | 氧化钠为白色固体，颜色描述正确 |
| `sub.Na2O2` | substance | 过氧化钠 | 0.7 | 过氧化钠为淡黄色固体，颜色描述正确 |
| `sub.Na2CO3` | substance | 碳酸钠 | 0.7 | 碳酸钠为白色固体，颜色正确 |
| `sub.NaHCO3` | substance | 碳酸氢钠 | 0.7 | 碳酸氢钠为白色固体，颜色正确 |
| `sub.NaCl` | substance | 氯化钠 | 0.8 | 名称、颜色（白色）符合高一/高考表述，无科学错误 |
| `sub.Mg` | substance | 镁 | 0.8 | 名称、颜色（银白色）符合规范表述 |
| `sub.MgO` | substance | 氧化镁 | 0.8 | 名称、颜色（白色）正确，符合高一表述 |
| `sub.MgOH2` | substance | 氢氧化镁 | 0.8 | 名称、颜色（白色）正确 |
| `sub.Al2O3` | substance | 氧化铝 | 0.8 | 氧化铝为白色固体，颜色正确 |
| `sub.AlOH3` | substance | 氢氧化铝 | 0.8 | 氢氧化铝为白色固体，颜色正确 |
| `sub.FeCl3` | substance | 氯化铁 | 0.7 | 氯化铁化学式FeCl3正确，颜色描述基本准确 |
| `sub.Zn` | substance | 锌 | 0.7 | 锌为银白色金属，颜色描述基本正确 |
| `sub.Ag` | substance | 银 | 0.7 | 银为银白色金属，颜色描述正确 |
| `sub.O2` | substance | 氧气 | 0.7 | 氧气为无色气体，颜色描述正确 |
| `sub.CO2` | substance | 二氧化碳 | 0.7 | 二氧化碳为无色气体，颜色描述正确 |
| `rxn.NaOH_CO2` | reaction | 氢氧化钠与二氧化碳 | 0.9 | 主方程式2NaOH+CO2=Na2CO3+H2O配平正确 |
| `rxn.Mg_CO2` | reaction | 镁与二氧化碳 | 0.8 | 方程式 2Mg+CO2=点燃=2MgO+C 配平正确，属高考常见反应 |
| `rxn.2Al_2NaOH` | reaction | 铝与氢氧化钠溶液 | 0.8 | verifyNeeded=true，按规则最高只能HOLD |
| `rxn.Al2O3_2NaOH` | reaction | 氧化铝与氢氧化钠 | 0.9 | 方程式配平正确：Al2O3+2NaOH=2NaAlO2+H2O，原子与电荷守恒。 |
| `rxn.AlOH3_NaOH` | reaction | 氢氧化铝与氢氧化钠 | 0.9 | 方程式配平正确：Al(OH)3+NaOH=NaAlO2+2H2O，原子守恒。 |
| `exp.Fe_rust` | experiment | 铁生锈条件探究 | 0.75 | 铁生锈需O2与H2O共同作用为高中定性结论，表述基本正确 |
| `kp.metal.smelting` | knowledge | 金属冶炼思路 | 0.8 | 冶炼本质为化合态还原为单质，正确 |
| `sub.FeO` | substance | 氧化亚铁 | 0.9 | FeO为黑色粉末、化学式FeO，符合教材表述 |
| `exp.Fe3_SCN` | experiment | Fe³⁺与KSCN的检验 | 0.8 | verifyNeeded=true，按硬性规则最高只能HOLD |
| `kp.metal.pig_iron` | knowledge | 生铁 | 0.9 | 生铁为铁碳合金、含碳量高于钢、质硬而脆、可铸不可锻等表述符合教材口径 |
| `kp.metal.steel` | knowledge | 钢 | 0.9 | 钢为含碳量低于生铁的铁碳合金、塑性好、可锻造等表述正确 |
| `sub.NaAlO2` | substance | 偏铝酸钠 | 0.85 | 偏铝酸钠作为铝两性转化枢纽的定位合理 |
| `sub.AlCl3` | substance | 氯化铝 | 0.7 | 颜色描述基本正确：无水AlCl3为白色，水溶液近无色 |
| `kp.Al.salt_aluminate` | knowledge | 铝盐与偏铝酸盐转化 | 0.85 | verifyNeeded=true，按硬性规则最高只能HOLD_RESTRICTED |
| `sub.HClO` | substance | 次氯酸 | 0.7 | 次氯酸颜色描述为无色（稀溶液）基本合理，但HClO仅存在于水溶液中，作为独立物质条目表述不够严谨 |
| `sub.NaClO` | substance | 次氯酸钠 | 0.7 | 名称与颜色描述基本正确：NaClO为白色固体，溶液近无色 |
| `sub.S` | substance | 硫 | 0.7 | 名称与颜色'淡黄色'正确，符合硫单质常见表述 |
| `sub.SO2` | substance | 二氧化硫 | 0.7 | 名称与颜色'无色'正确 |
| `sub.SO3` | substance | 三氧化硫 | 0.65 | 名称正确，但'无色（固体常见）'表述不严谨：SO3常温下为无色液体/易挥发，固态需低温 |
| `sub.H2SO4` | substance | 硫酸 | 0.7 | 颜色描述“无色油状液体（纯）”基本正确，但未区分浓硫酸黏稠、吸水等关键性质，信息偏简 |
| `sub.H2SO3` | substance | 亚硫酸 | 0.65 | 亚硫酸为弱酸、不稳定、易分解，仅标“无色”信息不足 |
| `sub.N2` | substance | 氮气 | 0.7 | “无色”正确，但氮气关键性质（难溶于水、化学性质稳定、N≡N）未体现 |
| `sub.NH3` | substance | 氨 | 0.7 | “无色”正确，但未体现刺激性气味、极易溶于水、碱性等关键性质 |
| `sub.C` | substance | 碳 | 0.85 | 碳存在金刚石、石墨、C60等同素异形体，颜色不能统一描述为黑色 |
| `sub.CO` | substance | 一氧化碳 | 0.8 | 名称、颜色（无色）等基本属性正确，符合高一表述 |
| `sub.Si` | substance | 硅 | 0.8 | 名称“硅”正确，颜色“灰黑色”与晶体硅外观基本相符 |
| `sub.SiO2` | substance | 二氧化硅 | 0.8 | 名称“二氧化硅”正确，颜色描述“白色/无色（水晶等了解）”基本合理 |
| `sub.Na2SiO3` | substance | 硅酸钠 | 0.8 | 名称“硅酸钠”正确，颜色“无色/白色”合理 |
| … | … | 其余 58 条见 JSON | … | … |

## REJECT_FIX（1）

| 编码 | 类型 | 名称 | 置信度 | 主要理由 |
|------|------|------|--------|----------|
| `q.substance.NaOH` | question | 烧碱俗称与性质题 | 0.9 | 题干为“下列说法正确的是？”但未给出任何选项，答案却为“A,C”，关键字段缺失严重，无法作答 |

## 产出文件

- `pending_review_all.json` / `PENDING_REVIEW_ALL.md`
- `deepseek_audit_results.json`
- `publish_whitelist.json`
- `CHEMISTRY_DEEPSEEK_AUDIT_REPORT.md`（本文件）
