# 首批50道解析更新 · 第一阶段干跑报告（未写库）

> 生成时间：2026-10-20T02:19:07.962Z
> **本阶段未执行任何数据库 UPDATE。**

## 一、最终质量统计

| 项 | 数量 |
|----|------|
| 候选总数 | 50 |
| 最终 PASS | **48** |
| 最终 NEEDS_FIX | 0 |
| 最终 HOLD | 2 |
| 最终 REJECT | 0 |
| 更新白名单 | **48** |
| 排除 | 2 |
| 干跑预计 UPDATE | **48** |
| 干跑跳过 | 0 |
| 数据冲突 | 0 |
| 题库总数 / 可训练 / formal / s60 | 638 / 634 / 0 / 60 |

## 二、强制排除（原题风险）

- **ID 215**：题干「V用溶剂体积」残缺，无法构成可可靠判断的化学命题；禁止仅靠解析掩盖
- **ID 250**：题干仅「递变顺序记反」，未给出具体卤素/递变内容，条件不足；排除更新

## 三、白名单逐题干跑（允许更新）

### ID 307 · `train.ai_trial.pa.rxn_cond_judge.rxn.2Fe_3Cl2`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 rxn.2Fe_3Cl2 字段 conditions
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题判断的是知识库对反应条件的记载，不是方程式配平。铁与氯气反应需要点燃或加热才能顺利进行，知识库标注为「点燃（或加热）」与常见反应条件一致，因此该记载正确。
【易错点】把本题当成配平题去核对化学式；忽略题干问的是「条件记载」是否正确。
```

### ID 309 · `train.ai_trial.pa.rxn_is_redox_judge.rxn.2Fe_3Cl2`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 rxn.2Fe_3Cl2；oxidant=Cl2 reductant=Fe
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】氧化还原反应的判据是反应前后有元素化合价变化（存在电子转移）。反应 2Fe + 3Cl2 =点燃= 2FeCl3 中，Fe 由 0 价升高到 +3 价，Cl 由 0 价降低到 −1 价，化合价有升有降，因此属于氧化还原反应。题干亦提示知识库已标注氧化剂/还原剂，与该判断一致。
【易错点】不要只看有没有氧气参加；有氧气≠氧化还原的唯一判据，关键看化合价是否变化。
```

### ID 22 · `train.ai_trial.013.con_j`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 concept.electrolyte
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】电解质是在水溶液里或熔融状态下能够导电的化合物。题干表述与该定义一致，因此正确。导电是因为电离产生自由移动的离子，不是因为有自由电子（那是金属导电）。
【易错点】把「能导电的单质（如金属、石墨）」也叫做电解质；电解质必须是化合物。
```

### ID 208 · `train.ai_trial.pa.kp_fact_judge.kp.calc.amount`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.calc.amount description 首句事实
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】物质的量常用关系：n=m/M；n=N/NA。气体还可用体积换算，但公式 n=V/22.4（V 单位为 L）只在标准状况下成立，因为 22.4 L/mol 是标况下的气体摩尔体积。题干三点表述正确。
【易错点】非标况仍直接用 22.4；把固体、液体的体积也拿去除以 22.4。
```

### ID 234 · `train.ai_trial.pa.kp_fact_judge.kp.exp.design`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.exp.design description 首句事实
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】书面评价实验方案通常按：目的是否明确→原理是否可行→试剂与仪器是否匹配→步骤顺序是否合理（如先检查气密性）→现象能否支持结论→安全与尾气/废液处理是否妥当。比较方案时还要看干扰、可操作性与试剂用量是否合适。题干概括正确。
【易错点】只看试剂名称，不检查步骤顺序与安全；或把「能得到现象」当成方案一定正确。
```

### ID 109 · `train.ai_trial.pa.sub_common_name_judge.sub.C2H5OH`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 sub.C2H5OH 字段 common_names
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】乙醇（C2H5OH）的常见俗称是酒精。题干判断「酒精」可作为「乙醇」的常见名称记载，与事实一致，因此正确。
【易错点】把「酒精」与其他含醇混合物概念混淆；本题只考俗称对应，不必扯到燃烧、酯化等性质。
```

### ID 10 · `train.ai_trial.001.el_sym`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 el.He
```

- 新 analysis：

```
【正确答案】He
【为什么正确】本题属于基础记忆。按化学符号/名称/基本事实的标准对应关系，答案为「He」。
【易错点】元素符号大小写错误；中文名与符号不对应。
```

### ID 251 · `train.ai_trial.pa.kp_fact_judge.kp.inference.block`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.inference.block description 首句事实
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】框图推断的常用策略是：先找特征转化（气体、沉淀、颜色、焰色、酸碱性等）锁定突破口物质，再顺着箭头关系逐一验证，使全局转化自洽。题干概括的方法正确。
【易错点】抓住一个现象就下唯一结论，不回头用其余箭头验证；或条件未用尽却认定多解中的某一个。
```

### ID 204 · `train.ai_trial.pa.kp_fact_judge.kp.Al.amphoteric`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.Al.amphoteric description 首句事实
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】Al、Al2O3、Al(OH)3 都能与强酸、强碱反应，表现出两性相关性质。例如 Al 与 NaOH 溶液反应生成偏铝酸盐并放出 H2；Al(OH)3 既能溶于强酸也能溶于强碱。题干判断正确。
【易错点】误以为只有 Al(OH)3 两性而忽略 Al、Al2O3；或否认 Al 能与强碱反应。
```

### ID 24 · `train.ai_trial.015.con_j`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 concept.electron_conserve
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】在氧化还原反应中，还原剂失去电子，氧化剂得到电子。电子不能凭空产生或消失，因此还原剂失电子总数等于氧化剂得电子总数（电子守恒）。配平氧化还原反应时常利用这一关系。
【易错点】只配平原子个数而忽略电子得失是否相等；把「失电子总数=得电子总数」误记成质量守恒或原子守恒的替代说法。
```

### ID 23 · `train.ai_trial.014.con_j`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 concept.nonelectrolyte
```

- 新 analysis：

```
【正确答案】错误
【为什么正确】电解质须是在水溶液里或熔融状态下能导电的化合物。蔗糖溶于水后以分子形式存在，不发生电离，溶液中没有自由移动的离子，因此蔗糖是非电解质，不是电解质。题干说「蔗糖是电解质」错误。
【易错点】看见「化合物」或「能溶于水」就当成电解质；导电的关键是电离出离子，不是单纯溶解。
```

### ID 48 · `train.ai_trial.046.fm_c`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 formula.c_n_V
```

- 新 analysis：

```
【正确答案】A
【为什么正确】物质的量浓度 c 表示单位体积溶液中所含溶质的物质的量，常用单位是 mol/L（或 mol·L⁻¹）。选项中 A 为 mol/L；B g/mol 是摩尔质量；C L/mol 是摩尔体积单位；D mol 是物质的量单位。
【易错点】把摩尔质量、摩尔体积的单位与浓度单位记混。
```

### ID 235 · `train.ai_trial.pa.kp_fact_judge.kp.exp.error`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.exp.error description 首句事实
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】误差分析要落到具体操作阶段和具体测定量上，说明该操作如何影响测定结果，才能判断偏大或偏小。脱离条件直接写「偏大/偏小」没有依据，因此题干原则正确。
【易错点】不分析因果，只会背「偏大」「偏小」结论。
```

### ID 51 · `train.ai_trial.049.kp_j`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.metal.activity
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】金属活动性顺序可用于判断：较活泼金属能否从酸中置换出氢气，以及较活泼金属能否把较不活泼金属从其盐溶液中置换出来。题干说法正确（具体能否发生仍要结合酸的种类、盐是否可溶等题设条件）。
【易错点】只看顺序前后就忽略盐是否可溶、酸是否为氧化性酸等题设限制。
```

### ID 96 · `train.ai_trial.pa.sub_color_judge.sub.Al`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 sub.Al 字段 color
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题只核对知识库关于颜色的记载：铝单质通常描述为银白色，与记载一致，因此正确。
【易错点】把本题扩成铝的化学性质题；表面氧化膜可能使观感略暗，但不改变「银白色」这一常见记载。
```

### ID 252 · `train.ai_trial.pa.kp_fact_judge.kp.inference.color`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.inference.color description 首句事实
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题属于知识事实正误判断。相关知识要点：「利用物质或离子的特征颜色、溶液褪色/变色作为突破口：如酸性KMnO4紫红、溴水橙红、Cu2+蓝、Fe3+黄棕、沉淀颜色等。须结合题设试剂与条件，避免单一线索武断。」。结合题干表述与标准答案「正确」判定。
【易错点】不要加入题干未给出的额外条件；以定义/事实本身为准。
```

### ID 223 · `train.ai_trial.pa.kp_fact_judge.kp.comprehensive.basic`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.comprehensive.basic description 首句事实
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题属于知识事实正误判断。相关知识要点：「综合题一般路径：审清已知与设问→定位知识模块（元素/有机/能量/实验）→写关键方程式或关系式→检查计量、条件与单位→回代题设验证。先易后难，避免跳步丢条件。」。结合题干表述与标准答案「正确」判定。
【易错点】不要加入题干未给出的额外条件；以定义/事实本身为准。
```

### ID 224 · `train.ai_trial.pa.kp_fact_judge.kp.energy.bond_change`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.energy.bond_change description 首句事实
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题属于知识事实正误判断。相关知识要点：「化学反应中：断裂化学键吸收能量，形成化学键放出能量。反应吸热还是放热，取决于二者总效果的相对大小，不能仅凭是否加热判断。」。结合题干表述与标准答案「正确」判定。
【易错点】不要加入题干未给出的额外条件；以定义/事实本身为准。
```

### ID 225 · `train.ai_trial.pa.kp_fact_judge.kp.energy.chem_electric`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.energy.chem_electric description 首句事实
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题属于知识事实正误判断。相关知识要点：「原电池等装置可把化学能转化为电能；电解则是电能转化为化学能（了解对比）。认识能量转化形式是必修要点。」。结合题干表述与标准答案「正确」判定。
【易错点】不要加入题干未给出的额外条件；以定义/事实本身为准。
```

### ID 226 · `train.ai_trial.pa.kp_fact_judge.kp.energy.chem_power`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.energy.chem_power description 首句事实
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题属于知识事实正误判断。相关知识要点：「了解常见化学电源（如干电池、蓄电池、锂电池等名称与用途层次，以教材为准）。勿展开复杂电化学工程与电极材料细节作为默认训练。」。结合题干表述与标准答案「正确」判定。
【易错点】不要加入题干未给出的额外条件；以定义/事实本身为准。
```

### ID 228 · `train.ai_trial.pa.kp_fact_judge.kp.energy.electron_flow`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.energy.electron_flow description 首句事实
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题属于知识事实正误判断。相关知识要点：「外电路中电子由负极流向正极；电流方向与电子流向相反。溶液中阳离子向正极迁移、阴离子向负极迁移，不可说电子在溶液中流动。」。结合题干表述与标准答案「正确」判定。
【易错点】不要加入题干未给出的额外条件；以定义/事实本身为准。
```

### ID 229 · `train.ai_trial.pa.kp_fact_judge.kp.energy.galvanic`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.energy.galvanic description 首句事实
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题属于知识事实正误判断。相关知识要点：「原电池是将化学能转化为电能的装置。一般需：自发氧化还原反应、电极、电解质溶液（或离子导体）、形成闭合回路。电子在外电路迁移，离子在电解质中迁移。并非所有原电池都必须由两种不同金属构成，电极组合以题设与构成条件为准。」。结合题干表述与标准答案「正确」判定。
【易错点】不要加入题干未给出的额外条件；以定义/事实本身为准。
```

### ID 230 · `train.ai_trial.pa.kp_fact_judge.kp.energy.galvanic_poles`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.energy.galvanic_poles description 首句事实
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题属于知识事实正误判断。相关知识要点：「负极：发生氧化反应（失电子），通常是较活泼金属电极。正极：发生还原反应（得电子）。正负极判断要结合电极材料与电解质中的氧化剂。」。结合题干表述与标准答案「正确」判定。
【易错点】不要加入题干未给出的额外条件；以定义/事实本身为准。
```

### ID 231 · `train.ai_trial.pa.kp_fact_judge.kp.energy.thermo_eq`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.energy.thermo_eq description 首句事实
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题属于知识事实正误判断。相关知识要点：「热化学方程式须注明物质聚集状态，并给出ΔH（符号与单位口径随教材）。计量数与ΔH对应；同一反应计量数翻倍则ΔH相应变化。」。结合题干表述与标准答案「正确」判定。
【易错点】不要加入题干未给出的额外条件；以定义/事实本身为准。
```

### ID 232 · `train.ai_trial.pa.kp_fact_judge.kp.enviro.acid_rain`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.enviro.acid_rain description 首句事实
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题属于知识事实正误判断。相关知识要点：「酸雨主要与SO2、NOx等排放有关；可酸化水体与土壤、腐蚀建筑。防治：脱硫脱硝、清洁能源、节能等。与硫、氮氧化物知识综合。」。结合题干表述与标准答案「正确」判定。
【易错点】不要加入题干未给出的额外条件；以定义/事实本身为准。
```

### ID 276 · `train.ai_trial.pa.kp_fact_judge.kp.organic.acetic`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.organic.acetic description 首句事实
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题属于知识事实正误判断。相关知识要点：「乙酸CH3COOH，官能团羧基，弱酸但具酸通性；酸性强于碳酸（与碳酸盐放CO2）。可发生酯化。食醋中含乙酸（了解）。」。结合题干表述与标准答案「正确」判定。
【易错点】不要加入题干未给出的额外条件；以定义/事实本身为准。
```

### ID 277 · `train.ai_trial.pa.kp_fact_judge.kp.organic.alkane`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.organic.alkane description 首句事实
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题属于知识事实正误判断。相关知识要点：「烷烃通式CnH2n+2（链状），为饱和烃。化学性质较稳定，可发生取代与燃烧；一般不能因加成使溴水褪色。同系物物理性质递变。」。结合题干表述与标准答案「正确」判定。
【易错点】不要加入题干未给出的额外条件；以定义/事实本身为准。
```

### ID 278 · `train.ai_trial.pa.kp_fact_judge.kp.organic.ethanol`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.organic.ethanol description 首句事实
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题属于知识事实正误判断。相关知识要点：「乙醇CH3CH2OH，官能团羟基。可燃烧；Cu/Ag催化加热下氧化为乙醛；与乙酸酯化。物理性质：无色液体、与水互溶、易燃。」。结合题干表述与标准答案「正确」判定。
【易错点】不要加入题干未给出的额外条件；以定义/事实本身为准。
```

### ID 279 · `train.ai_trial.pa.kp_fact_judge.kp.organic.ethene`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.organic.ethene description 首句事实
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题属于知识事实正误判断。相关知识要点：「乙烯结构简式CH2=CH2，含碳碳双键。易加成（Br2、H2、H2O等）；使酸性KMnO4褪色但不指定唯一氧化产物；可加聚。实验室可由乙醇浓硫酸加热制取（认知）。」。结合题干表述与标准答案「正确」判定。
【易错点】不要加入题干未给出的额外条件；以定义/事实本身为准。
```

### ID 280 · `train.ai_trial.pa.kp_fact_judge.kp.organic.isomer_skill`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.organic.isomer_skill description 首句事实
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题属于知识事实正误判断。相关知识要点：「先固定分子式，再按碳链异构、官能团位置等有序列举，检查重复与遗漏。高一以简单烷烃/烯烃/醇醚等基础题型为主，复杂推断不作为默认训练。」。结合题干表述与标准答案「正确」判定。
【易错点】不要加入题干未给出的额外条件；以定义/事实本身为准。
```

### ID 308 · `train.ai_trial.pa.rxn_eq_identify.rxn.2Fe_3Cl2`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 rxn.2Fe_3Cl2 字段 equation
```

- 新 analysis：

```
【正确答案】A
【为什么正确】本题考查化学方程式相关判断。对应反应可写为「2Fe + 3Cl2 =点燃= 2FeCl3」。按原子守恒与题干信息，标准答案为「A」。
【易错点】配平只改系数不改化学式；条件文字不一定改变方程式本身。
```

### ID 310 · `train.ai_trial.pa.rxn_oxidant_single.rxn.2Fe_3Cl2`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 rxn.2Fe_3Cl2 字段 oxidant
```

- 新 analysis：

```
【正确答案】A
【为什么正确】本题考查氧化剂的判断。氧化剂得到电子、元素化合价降低，自身发生还原反应。对反应「2Fe + 3Cl2 =点燃= 2FeCl3」，知识库标注氧化剂为「Cl2」，与标准答案一致。
【易错点】氧化剂自身被还原；勿与还原剂混淆。
```

### ID 49 · `train.ai_trial.047.fm_stp`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
仅标况；来源 formula.gas_STP
```

- 新 analysis：

```
【正确答案】错误
【为什么正确】气体摩尔体积 22.4 L/mol 只在标准状况（0℃、101 kPa，即教材所说标况）下、对气体成立。题干说「适用于任何温度和压强下的气体」，扩大了适用范围，因此该说法错误。
【易错点】把 22.4 L/mol 当成任何条件下气体的通用换算常数；非标况应使用对应条件下的摩尔体积或理想气体相关关系（以题设为准），不能直接套 22.4。
```

### ID 248 · `train.ai_trial.pa.kp_misconception_judge.kp.Fe.test`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 kp.Fe.test 「易错」标注，考查易错点辨析
```

- 新 analysis：

```
【正确答案】错误
【为什么正确】检验 Fe3+ 常用 KSCN（或 NH4SCN）：Fe3+ 与 SCN- 反应生成血红色络合物，可报「阳性」。Fe2+ 与 SCN- 不会出现该血红色特征现象。若溶液中主要是 Fe2+，直接加 KSCN 一般看不到血红色，不能据此报 Fe3+ 阳性。若要检查是否被氧化为 Fe3+，通常需先把 Fe2+ 氧化为 Fe3+，再加 KSCN。
【易错点】把 Fe2+ 与 Fe3+ 的检验混为一谈；误以为加 KSCN 就能直接确认 Fe2+。
```

### ID 95 · `train.ai_trial.pa.sub_chem_prop_judge.sub.Al`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 sub.Al 字段 chemical_props 原文片段
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题考查物质性质识记/判断。相关记载：「表面易生成致密Al2O3氧化膜；可与酸放H2；也可与NaOH溶液反应：2Al+2NaOH+2H2O=2NaAlO2+3H2↑（溶液中常写[Al(OH)4]-，了解）。」。标准答案为「正确」。
【易错点】把相似物质的颜色、状态或用途记混。
```

### ID 113 · `train.ai_trial.pa.sub_chem_prop_judge.sub.CH3COOCH2CH3`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 sub.CH3COOCH2CH3 字段 chemical_props 原文片段
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题考查物质性质识记/判断。相关记载：「由乙酸与乙醇在浓硫酸催化、加热下酯化生成（可逆）。在水中溶解度小，常浮于上层；可用于认识酯的物理性质与酯化实验现象。水解等深度按教材题设，勿默认展开复杂机理。」。标准答案为「正确」。
【易错点】把相似物质的颜色、状态或用途记混。
```

### ID 119 · `train.ai_trial.pa.sub_chem_prop_judge.sub.CH3COOH`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 sub.CH3COOH 字段 chemical_props 原文片段
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题考查物质性质识记/判断。相关记载：「弱酸，具酸的通性：使紫色石蕊变红；与活泼金属、碱、碱性氧化物、某些盐反应。酸性强于碳酸：可与Na2CO3反应放出CO2。与乙醇酯化生成乙酸乙酯。」。标准答案为「正确」。
【易错点】把相似物质的颜色、状态或用途记混。
```

### ID 140 · `train.ai_trial.pa.sub_chem_prop_judge.sub.CuOH2`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 sub.CuOH2 字段 chemical_props 原文片段
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题考查物质性质识记/判断。相关记载：「由Cu2+与碱生成；可溶于酸；受热分解为黑色CuO（了解）。弱碱性。」。标准答案为「正确」。
【易错点】把相似物质的颜色、状态或用途记混。
```

### ID 149 · `train.ai_trial.pa.sub_chem_prop_judge.sub.Fe`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 sub.Fe 字段 chemical_props 原文片段
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】铁在氧气中点燃（如火柴点燃的细铁丝）生成黑色的四氧化三铁 Fe3O4，知识库记载与该事实一致，因此正确。
【易错点】误记为只生成 Fe2O3 或 FeO；忽略「点燃」条件与产物 Fe3O4 的对应。
```

### ID 158 · `train.ai_trial.pa.sub_chem_prop_judge.sub.Fe3O4`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 sub.Fe3O4 字段 chemical_props 原文片段
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】四氧化三铁 Fe3O4 可从组成上理解为 FeO·Fe2O3（了解层次），知识库如此记载正确。这有助于理解其中同时含有 +2、+3 价铁。
【易错点】把「可看作」理解成混合物机械混合；它是一种化合物的组成认识方式。
```

### ID 163 · `train.ai_trial.pa.sub_chem_prop_judge.sub.FeOH2`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 sub.FeOH2 字段 chemical_props 原文片段
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】氢氧化亚铁由 Fe2+ 与碱反应生成，例如 Fe2+ + 2OH- = Fe(OH)2↓（白色沉淀，在空气中易被氧化变色）。知识库记载正确。
【易错点】与 Fe(OH)3 的生成混淆（Fe3+ 与碱）；或忽略 Fe(OH)2 易被氧化的现象干扰记忆。
```

### ID 168 · `train.ai_trial.pa.sub_chem_prop_judge.sub.FeOH3`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 sub.FeOH3 字段 chemical_props 原文片段
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】氢氧化铁由 Fe3+ 与碱反应生成，例如 Fe3+ + 3OH- = Fe(OH)3↓（红褐色沉淀）。知识库记载正确。
【易错点】与 Fe(OH)2（Fe2+ 与碱）记混。
```

### ID 173 · `train.ai_trial.pa.sub_chem_prop_judge.sub.FeSO4`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 sub.FeSO4 字段 chemical_props 原文片段
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】硫酸亚铁 FeSO4 在溶液中可提供 Fe2+。Fe2+ 处于较低价态，易被氧化为 Fe3+，因而具有还原性。知识库记载正确。
【易错点】把 Fe2+ 的还原性与 Fe3+ 的氧化性记反。
```

### ID 183 · `train.ai_trial.pa.sub_chem_prop_judge.sub.HCl_aq`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 sub.HCl_aq 字段 chemical_props 原文片段
```

- 新 analysis：

```
【正确答案】正确
【为什么正确】本题考查物质性质识记/判断。相关记载：「强酸通性：与活泼金属、碱、碱性氧化物、部分盐反应。浓盐酸有挥发性；可与MnO2加热制Cl2。」。标准答案为「正确」。
【易错点】把相似物质的颜色、状态或用途记混。
```

### ID 312 · `train.ai_trial.pa.rxn_reductant_single.rxn.2Fe_3Cl2`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 rxn.2Fe_3Cl2 字段 reductant
```

- 新 analysis：

```
【正确答案】A
【为什么正确】本题考查还原剂的判断。还原剂是在反应中失去电子、元素化合价升高的物质，自身发生氧化反应。对反应「2Fe + 3Cl2 =点燃= 2FeCl3」，知识库标注还原剂为「Fe」，与标准答案一致。
【易错点】不要把「被还原的物质（氧化剂）」说成还原剂；还原剂自身被氧化。
```

### ID 314 · `train.ai_trial.pa.rxn_eq_identify.rxn.2Fe2_Cl2`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 rxn.2Fe2_Cl2 字段 equation
```

- 新 analysis：

```
【正确答案】A
【为什么正确】本题考查化学方程式相关判断。对应反应可写为「2Fe2+ + Cl2 = 2Fe3+ + 2Cl-」。按原子守恒与题干信息，标准答案为「A」。
【易错点】配平只改系数不改化学式；条件文字不一定改变方程式本身。
```

### ID 316 · `train.ai_trial.pa.rxn_oxidant_single.rxn.2Fe2_Cl2`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 rxn.2Fe2_Cl2 字段 oxidant
```

- 新 analysis：

```
【正确答案】A
【为什么正确】本题考查氧化剂的判断。氧化剂得到电子、元素化合价降低，自身发生还原反应。对反应「2Fe2+ + Cl2 = 2Fe3+ + 2Cl-」，知识库标注氧化剂为「Cl2」，与标准答案一致。
【易错点】氧化剂自身被还原；勿与还原剂混淆。
```

### ID 318 · `train.ai_trial.pa.rxn_reductant_single.rxn.2Fe2_Cl2`

- 最终质量等级：PASS
- 原题科学性检查：OK_WITH_GIVEN_ANSWER
- 数据库当前值与备份一致：true
- 是否允许更新：true
- 干跑决策：WOULD_UPDATE
- 原 analysis：

```
来源 rxn.2Fe2_Cl2 字段 reductant
```

- 新 analysis：

```
【正确答案】A
【为什么正确】本题考查还原剂的判断。还原剂是在反应中失去电子、元素化合价升高的物质，自身发生氧化反应。对反应「2Fe2+ + Cl2 = 2Fe3+ + 2Cl-」，知识库标注还原剂为「Fe2+」，与标准答案一致。
【易错点】不要把「被还原的物质（氧化剂）」说成还原剂；还原剂自身被氧化。
```

## 四、排除题目一览

| ID | code | 最终等级 | 原因 |
|----|------|----------|------|
| 215 | train.ai_trial.pa.kp_misconception_judge.kp.calc.solution | HOLD | stem_incomplete_ambiguous |
| 250 | train.ai_trial.pa.kp_misconception_judge.kp.halogen.compare | HOLD | stem_too_vague |

## 五、下一步

等待你明确确认后，才执行白名单 `analysis` 字段的数据库 UPDATE。
