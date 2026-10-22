# 高一化学专项训练 · 题库容量检查与扩充方案

> 审计时间：2026-10-19（只读，未改库、未批量出题）  
> 数据脚本：`docs/chemistry_trial_restore/capacity_audit.js`、`capacity_extra_stats.js`  
> 原始 JSON：`capacity_audit.json`、`capacity_extra_stats.json`

---

## 1. 页面显示「当前可用题目：3 道」的准确原因

### 结论（最常见路径）

`availableCount` = `findEligibleItems(专项, 分类, 难度, pool)` 返回长度，**不是**全库题量。

试运行（`poolMode=test`）抽题逻辑（`chem-train.service.ts`）：

1. 精确：专项 + 分类 + 难度  
2. 若空：同分类任意难度  
3. 若仍空：**同专项任意分类**（回退）

因此学生常看到 **3**，因为：

| 原因 | 证据 |
|------|------|
| **A. 专项本身只有 3 道可抽题** | 12 个一级专项中 **9 个** 测试池合计恰好 3 道：`experiment / substance / calculation / ion / periodic / structure / organic / inference / comprehensive` |
| **B. 二级分类无题 → 回退到专项合计** | 例：物质性质默认首分类 `name` 题量 0 → `same_spec_fallback` → 显示 **3**；氧化还原首分类 `valence` 无题 → 回退显示 **13** |
| **C. `specialty_cover_filler` 人为补满到 3** | `expand_all_specialties.js` 对缺题专项往**第一个二级分类**各插判断题，目标「≥3」；库中 `train.ai_trial.cov.*` **18** 道。多数「刚好 3」即此类填充题，**非** 239 知识生成 |

**不是**：全库只有 3 道；也**不是** 239 条知识算错成 3。

### 必须区分的两个数

| 指标 | 当前值 | 含义 |
|------|--------|------|
| **题库总数** | **94** | `chem_train_items` 全部 |
| **测试池可抽候选** | **94** | `pool=test` + `approved` + `is_active=1` |
| **正式池** | **0** | `pool=formal` |
| **当前筛选可抽取题数** | **0～22**（视专项/分类/难度） | API `GET /chemistry/train/availability` → `availableCount` |

默认首分类 + 难度 1 的模拟（含试运行回退）：

| 专项 | 首分类 | availableCount | 模式 |
|------|--------|----------------|------|
| equation | write_from_text | **2** | exact_d1 |
| experiment | instrument_id | **1** | exact_d1 |
| substance | name | **3** | **same_spec_fallback** |
| calculation | atomic_mass | **1** | exact_d1 |
| ion | electrolyte | **2** | exact_d1 |
| redox | valence | **13** | same_spec_fallback |
| periodic / structure / organic / inference / comprehensive | （各自首分类） | **3** | exact_d1（多为 cov 填充） |
| memory | symbol | **22** | exact_d1 |

若学生选「物质性质」任意空分类、或多数缺题专项：界面即显示 **3**。

---

## 2. 当前题库总量与题池分布

| 统计项 | 数量 |
|--------|------|
| 1. 训练题目总数 | **94** |
| 2. 正式题池 formal | **0** |
| 3. AI 试运行题池（`train.ai_trial.*`） | **85** |
| 4. 原始测试题池（`train.test.*` Phase1 seed） | **9** |
| 5. 已审核 approved | **94** |
| 6. 禁用/未激活 | **0** |
| 测试池合计（含旧 seed） | **94** |

### 难度

| 难度 | 题量 |
|------|------|
| 1 基础 | **88** |
| 2 提高 | **6** |
| 3 挑战 | **0** |

### 题型

| 题型 | 题量 |
|------|------|
| judge 判断 | **58** |
| single 单选 | **19** |
| blank 填空 | **17** |

### answer_type

| 类型 | 题量 |
|------|------|
| text | 78 |
| chem_formula | 16 |

### 有无知识关联

| | 题量 |
|--|------|
| 有 `chem_train_item_links` | 51 |
| 无 link（多为 expand / cov filler） | 43 |

---

## 3. 专项与二级分类覆盖

### 12 个一级专项（测试池 eligible）

| 专项 code | 名称 | 题量 | 难度 1/2/3 |
|-----------|------|------|------------|
| equation | 化学方程式 | **32** | 32/0/0 |
| memory | 化学基础记忆 | **22** | 22/0/0 |
| redox | 氧化还原反应 | **13** | 8/5/0 |
| experiment | 化学实验 | **3** | 3/0/0 |
| substance | 化学物质性质 | **3** | 3/0/0 |
| calculation | 化学计算 | **3** | 2/1/0 |
| ion | 离子反应 | **3** | 3/0/0 |
| periodic | 元素周期表 | **3** | 3/0/0 |
| structure | 物质结构 | **3** | 3/0/0 |
| organic | 有机化学 | **3** | 3/0/0 |
| inference | 化学推断 | **3** | 3/0/0 |
| comprehensive | 化学综合训练 | **3** | 3/0/0 |

### 137 个二级分类

| 指标 | 数量 |
|------|------|
| 二级分类总数 | **137** |
| 有题分类 | **28** |
| **空分类** | **109**（约 80%） |

有题最多的分类：`memory.symbol` 22、`equation.true_false` 16、`redox.identify` 11、`equation.balance` 5；其余多为 1～3。

筛选是否过严：

- **一级专项**：映射正确。  
- **二级分类**：正式池仍严格；试运行有「同专项回退」，**掩盖了分类空题**，但合计仍常只有 3。  
- **难度**：精确匹配；试运行可放宽到同分类任意难度。挑战难度全库 0。  
- **试运行模式**：`pool=test` 正确；正式仍 0。  
- **统计错误**：`availableCount` 与抽题一致，**无计数 bug**；观感问题来自**题少 + 回退到专项合计 3**。  
- **关联遗漏**：43 道无 KB link；239 中 207 条无任何训练 link。

---

## 4. 239 条试运行知识利用率

白名单：`docs/chemistry_deepseek_audit/publish_whitelist.json`（239）。

| 指标 | 数量 / 编码 |
|------|-------------|
| 已用于出题（至少 1 条 link） | **32**（利用率 **13.4%**） |
| 尚未用于出题 | **207** |
| 已用知识平均出题数 | **1.59** 道/条 |
| 能生成 ≥2 道题（多题型/多角度）的知识 | **19** 条（均为 2 道：元素 blank+single，或反应 condition+redox） |

### 按知识类型

| type | 白名单 | 已用 | 未用 | 未用样例编码 |
|------|--------|------|------|--------------|
| element | 24 | 12 | **12** | `el.S` `el.K` `el.Ca` `el.Fe` `el.Cu` `el.Zn` `el.Ag` `el.Ba` |
| substance | 24 | **0** | **24** | `sub.Al` `sub.Fe` `sub.Fe2O3` … |
| reaction | 59 | 11 | **48** | `rxn.Fe_CuSO4` `rxn.Cu_O2_heat` …（含 FIX 跳过） |
| concept | 21 | 3 | **18** | `concept.substance_class` `concept.periodic_law` … |
| formula | 10 | 2 | **8** | `formula.N_n_NA` `formula.dilution` `formula.M_m_n` … |
| knowledge | 74 | 3 | **71** | `kp.structure.atom` `kp.periodic.trend` … |
| experiment | 27 | 1 | **26** | `exp.Na2O2_H2O` `exp.Cl2_prep` … |

### 因训练限制被排除（FIX / 硬跳过，编码实列）

生成器 `FIX_SKIP` ∪ 二审 `NEEDS_FIX`，白名单内命中 **11** 条：

`rxn.2Na2O2_2H2O`, `rxn.2Na2O2_2CO2`, `rxn.2Al_6HCl`, `rxn.3Fe_2O2`, `rxn.Fe_H2SO4`, `rxn.Cu_2H2SO4`, `rxn.C_2H2SO4`, `rxn.N2_3H2`, `rxn.Cu_4HNO3`, `rxn.Cu_4HNO3c`, `exp.CO2_prep_marble`  
（另有 `q.eq.Na_water` 在跳过集，但不在 239 白名单。）

### 因结构化字段 / 模板规则被跳过（非库坏，是出题器过窄）

| 原因 | 影响 |
|------|------|
| **concept / knowledge 仅白名单 curated 安全句** | 仅约 5+3 条有模板；其余 18+71 条即使字段完整也不出题 |
| **element 硬顶 12 条 blank + 8 条 single** | 未用 `el.S` 等后半元素 |
| **substance 公式 ASCII 正则** `^[A-Za-z0-9().]+$` + 名称长度 | 下标/复杂式被跳；且当前 **0** 条 substance 进题库 |
| **reaction 上限 22、需 equation；氧化还原需 oxidant+reductant** | 大量反应未进；缺氧化还原字段则无 identify 题 |
| **experiment 上限 8、且部分题干与具体知识弱绑定** | 26 条未用 |
| **formula 仅 `gas_STP`/`Vm`/`c_n_V` 有硬编码题** | 8 条公式未用 |
| **总候选 `slice(0, 80)` 硬顶** | 即使用满模板也截断 |
| **无 link 的 expand/cov 题** | 不计入「知识已用于出题」 |

### 专项关联问题

- 题目写入时绑定 `specialtyCode`+`categoryCode`；分类缺失则 `skipped`（历史生成日志级）。  
- 大量知识未映射到 137 二级分类的「技能点」，导致 **109 空分类**。  
- filler 只填**专项首分类**，加剧「选首分类有 3 道、其他分类 0」的体验。

---

## 5. 本地规则出题器实际能力

### 实现位置

| 脚本 | 作用 | 产出规模（现库） |
|------|------|------------------|
| `generate_trial_questions.js` | 主规则模板（元素/物质/概念/反应/实验/公式/知识点） | 约 51 道带 link 的 ai_trial + 旧逻辑 |
| `expand_equation_coverage.js` | 方程式热门分类手工 SEEDS | **16**（`equation_expand`） |
| `expand_all_specialties.js` | 缺题专项补判断题至 ≥3 | **18**（`specialty_cover_filler`） |
| Phase1 seed | `train.test.*` | **9** |

### 模板桶（按题 code 推断）

| 模板桶 | 题量 | 适用知识类型 | 题型 | 备注 |
|--------|------|--------------|------|------|
| element_symbol | 20 | element | blank / single | 有硬上限 |
| reaction_judge_or_redox | 22 | reaction | judge / single | 达生成上限 |
| equation_expand | 16 | 手工 SEEDS（弱 KB） | judge/single/blank | 覆盖 balance 等 |
| specialty_cover_filler | 18 | **无真实知识** | judge | 「学习有助于突破薄弱点」类 |
| concept_judge | 6 | concept + knowledge curated | judge | 覆盖极窄 |
| calc_formula | 2 | formula 子集 | judge / single | |
| experiment | 1 | experiment | judge | 远低于生成上限意图 |
| phase1_seed | 9 | 早期测试 | 混合 | |

### 能力与风险

| 项 | 评估 |
|----|------|
| 模板数量 | 主生成器约 **8～10** 类规则 + expand SEEDS + cov filler；**不够支撑 137 分类** |
| 一条知识多角度 | 仅少数 element/reaction 达 2 道；无系统化「多角度」 |
| 重复题 | 生成器按 stem 去重；cov 题干高度同质（专项名不同） |
| 答案不唯一风险 | 中等：`rxn_nr`「一定是氧化还原」依赖专项标签；物质俗名→化学式；filler 答案恒「正确」价值低 |
| 固定题过少 | **是**；9 个专项卡在 3；109 分类为空；难度 3=0 |

---

## 6. 题量不足的主要原因（优先级）

1. **出题器人为截断**：总 cap 80、各类型小 cap，未吃满 239。  
2. **curated 白名单过窄**：concept/kp/formula 绝大多数被设计性跳过。  
3. **substance 完全未进题库**（24/24 未用）。  
4. **二级分类未做映射策略**：知识→分类稀疏，靠「专项回退」和 cov filler 撑门面。  
5. **filler 把专项题量钉在 3**：造成 UI 大量「3 道」观感。  
6. **无参数化计算 / 无系统化干扰项池**：难度分层几乎全是 1。  
7. **正式池仍为 0**：非试运行入口永远无题。

---

## 7. 推荐扩充方案（仅规划，本次不执行）

**原则**：本地结构化知识 + 确定性规则；一条知识多角度、多题型；基础/提高/挑战分层；条件与干扰项合理变化；**禁止**无依据或答案不唯一的题；**不做**本期 AI 出题。

### 阶段 A — 去天花板、吃满已有安全模板（低风险）

- 去掉 `slice(0,80)` 与 element/substance/reaction/experiment 硬顶。  
- 用尽 24 元素（符号 / 序数 / 名称→符号 单选干扰项轮换）。  
- 修复 substance 公式（规范化下标后再校验），名称→化学式 blank（`answer_type=chem_formula`）。  
- 对非 FIX 反应：条件判断、产物选择、氧化还原 identify（字段齐全才出）。  
- **预计增量：+80～150**；substance/element/reaction 利用率显著上升。

### 阶段 B — 知识多角度模板矩阵（中风险，需学科校验表）

每类知识固定「安全题型包」，例如：

| 知识类型 | 基础 | 提高 | 挑战（仅字段充分） |
|----------|------|------|-------------------|
| element | 符号填空 | 单选干扰 | 周期/族（有字段才出） |
| substance | 化学式 | 类别判断 | 性质判断（有 property 字段） |
| reaction | 条件有无 / 原子守恒判断 | 氧化剂选择 | 配平计量数（方程可解析） |
| formula | 单位/适用条件判断 | 代入计算（参数表） | 过量/纯度（公式明确） |
| concept/kp | **仅**人工或二审 READY 句库 | — | — |
| experiment | 安全 / 现象有无 | 步骤正误（observations/steps 字段） | 禁止危险操作题 |

- 一条知识目标 **2～4** 道、题型交叉。  
- **预计增量：+200～400**（相对现 94）。

### 阶段 C — 分类覆盖与 UI 诚实化

- 建立 `kb.type + tags → specialty.category` 映射表，优先填满空分类中的高频入口。  
- **停用或降权** `specialty_cover_filler` 类无知识判断题；或标 `ban_default_train`。  
- UI：同时展示「本分类精确题量」与「试运行回退后题量」，避免误以为全库只有 3。  
- 是否调整筛选：建议 **试运行保留回退**，但报表与前端标明；正式池保持严格。可选：回退范围改为「同专项同难度」而非任意分类。

### 阶段 D — 参数化与去重（保证唯一答案）

- 计算题：从公式条目取 Vm、c、n 等，参数从有限安全集合抽样，答案由同一公式算出。  
- 单选干扰项：同类型其他知识实体随机，避免与正确答案同义。  
- 题指纹：`sourceCode + templateId + paramsHash` 防重复。  
- **预计再增：+100～250**（视公式/反应可解析比例）。

### 合计量级（保守）

| 方案 | 预计总题量（测试池） |
|------|----------------------|
| 现状 | 94 |
| 仅阶段 A | ~180–250 |
| A+B | ~350–550 |
| A+B+D | **~450–800** |

不以牺牲科学准确性换量；FIX 11 与字段不足条目继续跳过。

### 优先扩充的专项（当前卡在 3 或入口空）

1. **substance**（知识 24 条全未用）  
2. **calculation**（公式 8 条未用 + 难度分层）  
3. **ion / structure / periodic**（kp 大量未用）  
4. **experiment**（书面安全/现象，26 条未用）  
5. **organic / inference / comprehensive**（需先有映射与安全句库，忌瞎 filler）  
6. **equation.write_from_text**（现仅 2 道 d1，热门入口）

相对充足、可后置：`memory.symbol`、`equation.true_false`、`redox.identify`。

---

## 8. 是否需要调整分类筛选方式

| 建议 | 说明 |
|------|------|
| **短期** | 不改后端严格度；改前端文案：区分「本分类」「同专项回退」 |
| **中期** | 试运行回退改为「同专项 + 同难度」；或列出有题的兄弟分类引导 |
| **长期** | 正式池仍专项+分类+难度；扩充靠映射与出题，不靠回退伪装题量 |

**统计错误**：无。问题是**真实可抽题少** + **filler=3** + **回退展示专项合计**。

---

## 9. 本次未做事项（按指令）

- ✗ 未修改数据库  
- ✗ 未批量生成题目  
- ✗ 未开发 AI 出题  

下一步需你确认后再执行阶段 A/B 脚本与映射表。

---

## 10. 附录：关键文件

- 审计：`docs/chemistry_trial_restore/capacity_audit.js` → `capacity_audit.json`  
- 补充：`capacity_extra_stats.js` → `capacity_extra_stats.json`  
- 出题：`generate_trial_questions.js`、`expand_equation_coverage.js`、`expand_all_specialties.js`  
- API：`apps/api/src/chemistry/train/chem-train.service.ts`（`availability` / `findEligibleItems`）  
- UI：`apps/web/src/views/chemistry/ChemistryTrainSetupView.vue`
