# 化学知识库 DeepSeek 发布前第二轮严格复核报告

> 生成时间：2026-10-18T12:47:13.505Z
> 复核范围：初审 PASS_PUBLISH 白名单 **239** 条
> 模型：`deepseek-chat`
> **只读复核**：未改数据库 / 未发布 / 未改正文 / 未生成正式训练题
> **声明**：DeepSeek 初审通过 ≠ 人工审核；二次 AI 复核通过 ≠ 人工审核 / ≠ published

## 1. 复核范围

- 输入：`publish_whitelist.json`（239）∩ 实时 DB 字段（`input_239.json`）
- 两轮独立提示词：Round A 科学性；Round B 课程范围与出题适配
- **未**将初审 PASS 结论作为模型输入依据

## 2. 覆盖情况

| 项 | 数量 |
|----|------|
| 预期 | 239 |
| 实际有结论 | 239 |
| Round 不完整 | 0 |
| READY+FIX+VERIFY | 119+11+109=239 |

## 3. DeepSeek 调用情况

| 指标 | 值 |
|------|----|
| API 调用次数 | 240 |
| 成功 | 240 |
| 失败 | 0 |
| 重试累计 | 0 |

详情见 `review_execution_log.json`（已脱敏，不含 API Key）。

## 4. 两轮独立复核

- Round A：化学定义、方程式真实性与配平、条件、氧化还原、实验、计算
- Round B：高一必修范围、教材争议、专项关联、自动出题/判题风险
- 合并规则：A 明确科学错误 → NEEDS_FIX；范围争议/失败/缺失 → NEEDS_VERIFICATION；仅两轮均过关 → READY_FOR_HUMAN_APPROVAL

## 5–7. 结论汇总

| 结论 | 数量 |
|------|------|
| READY_FOR_HUMAN_APPROVAL | 119 |
| NEEDS_FIX | 11 |
| NEEDS_VERIFICATION | 109 |

## 8. P0–P3 问题统计（问题条次数）

| 等级 | 数量 |
|------|------|
| P0 | 10 |
| P1 | 18 |
| P2 | 237 |
| P3 | 288 |

## 9. 新发现科学性错误（样本）

共 **11** 条涉及科学性 FAIL 或 A 轮 P0/P1。示例：

| 编码 | 结论 | 要点 |
|------|------|------|
| `rxn.2Na2O2_2H2O` | NEEDS_FIX | 该反应为歧化反应，Na2O2 中 -1 价氧既被氧化为 O2（0 价）又被还原为 NaOH 中的 -2 价氧。还原产物应为 NaOH（其中 -2 价氧），但更准 |
| `rxn.2Na2O2_2CO2` | NEEDS_FIX | 该反应同样是 Na2O2 中 -1 价氧的歧化：一部分氧被氧化为 O2（0 价），一部分被还原为 Na2CO3 中的 -2 价氧。还原产物标注为 Na2CO3  |
| `rxn.2Al_6HCl` | NEEDS_FIX | 氧化剂应为HCl中的H+（或HCl中的氢元素），而非整个HCl分子；在氧化还原反应中，HCl中只有H+被还原，Cl-未变价。 |
| `rxn.3Fe_2O2` | NEEDS_FIX | Fe3O4是Fe与O2反应的唯一产物，其中Fe同时被氧化（0→+2和+3）、O被还原（0→-2）。把同一产物同时标为氧化产物和还原产物在概念上不严谨：还原产物应 |
| `rxn.Fe_H2SO4` | NEEDS_FIX | 稀硫酸与铁反应中，真正被还原的是H2SO4电离出的H+（H+得电子生成H2），SO4^2-未参与氧化还原。将氧化剂标为H2SO4分子不够准确，严格应为H+（或表 |
| `rxn.Cu_2H2SO4` | NEEDS_FIX | 氧化产物标注错误。在反应 Cu + 2H2SO4(浓) → CuSO4 + SO2↑ + 2H2O 中，Cu 被氧化为 CuSO4（铜元素化合价由0升至+2）， |
| `rxn.C_2H2SO4` | NEEDS_FIX | 氧化产物与还原产物标注对调。该反应中C被氧化为CO2，CO2是氧化产物；H2SO4中S(+6)被还原为SO2，SO2是还原产物。条目把oxProduct写成SO |
| `rxn.N2_3H2` | NEEDS_FIX | 合成氨中N2被还原、H2被氧化，NH3既是氧化产物又是还原产物（同一物质）。但条目将oxProduct与reProduct都填为NH3而未区分来源，且更关键的是 |
| `rxn.Cu_4HNO3` | NEEDS_FIX | 氧化产物标注错误。该反应中Cu被氧化为Cu²⁺（存在于Cu(NO3)2中），Cu(NO3)2是氧化产物；NO是硝酸被还原的产物，即还原产物。此处把还原产物NO标 |
| `rxn.Cu_4HNO3c` | NEEDS_FIX | 氧化产物标注错误。Cu被氧化为Cu(NO3)2（氧化产物），NO2是硝酸被还原的产物（还原产物）。此处把还原产物NO2标为氧化产物，属氧化还原概念对调。 |
| `exp.CO2_prep_marble` | NEEDS_FIX | CO2在初中/高中教材语境中通常表述为“能溶于水”而非“可溶”，且不用排水法的根本原因是CO2溶于水且与水反应，导致收集量偏少、纯度下降；“可溶”表述不准确且理 |

## 10. 新发现教材范围争议

标记需核实范围/教材口径相关：**109** 条（详见 needs_verification.json）。

## 11. 专项关联问题

存在专项关联质疑：**110** 条。

## 12. 自动出题风险

| 资格 | 数量 |
|------|------|
| eligible | 58 |
| restricted | 170 |
| ineligible | 11 |

## 13. 各批次统计

| 批次 | 数量 |
|------|------|
| batch2 | 63 |
| batch3 | 55 |
| batch4 | 45 |
| batch5 | 25 |
| batch6 | 51 |

## 14. 各类型 × 结论

| 类型 | READY | FIX | VERIFY |
|------|-------|-----|--------|
| concept | 8 | 0 | 13 |
| element | 14 | 0 | 10 |
| experiment | 11 | 1 | 15 |
| formula | 9 | 0 | 1 |
| knowledge | 32 | 0 | 42 |
| reaction | 30 | 10 | 19 |
| substance | 15 | 0 | 9 |

## 15–18. 发布候选与出题资格

- 知识发布候选（knowledgePublishCandidate=yes）：**119**
- 自动出题 eligible / restricted / ineligible：**58** / **170** / **11**

## 19. 推荐人工审核顺序

1. READY 且 autoQuestion=eligible
2. READY 且 restricted
3. READY 且 ineligible（仅知识发布、限制出题）
4. NEEDS_VERIFICATION（抽样核实教材/条件）
5. NEEDS_FIX（先改后再审）

优先抽检编码（前 30）：

`el.He`, `el.Li`, `el.C`, `el.F`, `el.Ne`, `el.Mg`, `el.Al`, `el.Ca`, `el.Cu`, `el.Zn`, `el.Ag`, `el.Br`, `concept.elemental_compound`, `concept.oxidant_reductant`, `concept.metal_trend`, `concept.ionic_bond`, `concept.covalent_bond`, `concept.electron_conserve`, `formula.N_n_NA`, `formula.M_m_n`, `kp.redox.e_transfer`, `kp.ion.electrolyte`, `kp.structure.isotope`, `kp.periodic.position`, `kp.calc.amount`, `kp.calc.dilution`, `sub.FeOH3`, `rxn.4Na_O2`, `rxn.2Na_O2_heat`, `rxn.Na2O_H2O`

## 20. 是否建议直接批量发布

**否** — 二次 AI 复核仅产生人工确认候选；按任务要求不得自动批量发布。当前 FIX=11，P0问题数=10，Round不完整=0。

## 产出文件

- `chemistry_deepseek_audit/second_review/second_review_results.json`
- `ready_for_human_approval.json` / `needs_fix.json` / `needs_verification.json`
- `auto_question_eligibility.json` / `review_execution_log.json`
- 本报告：`docs/CHEMISTRY_DEEPSEEK_SECOND_REVIEW_REPORT.md`
