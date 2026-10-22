# 高一化学知识库 · Batch4 建设报告

> 第四阶段：非金属化学数据（清单 **74** 条）  
> 建设日期：2026-10-18  
> 依据：`chemistry_kb_inventory.json`（377 条全量）、`CHEMISTRY_QUALITY_STANDARD.md`  
> **AI/脚本检查 ≠ 人工审核。** 新增内容均为 `pending_review`。  
> **未进入 Batch4 专项质量审查，未进入 Batch5。**

---

## 1. 建设情况总览

| 指标 | 数量 |
|------|------|
| 计划数量 | **74** |
| 已有复用 | **0** |
| 新建并导入成功 | **74** |
| 导入失败 | **0** |
| 遗漏 | **0** |
| 重复创建 | **否** |
| 编码冲突 | **否** |
| 待审核（新导入 pending_review） | **74** |
| 关联专项 | **linkOk=74，linkFail=0** |

按类型：

| 类型 | 条数 | 新建导入 |
|------|------|----------|
| substance | 28 | 28 |
| reaction | 25 | 25 |
| experiment | 8 | 8 |
| knowledge | 13 | 13 |

导入包：

| 包 | 内容 | 数量 |
|----|------|------|
| B4-A | substance | 28 |
| B4-B | reaction | 25 |
| B4-C | experiment | 8 |
| B4-D | knowledge | 13 |

---

## 2. 复用检查

对照库内物质名、反应 canonical、实验名、知识点名检索：**无已存在可复用条目**。  
Batch3 已有 `sub.CO2`/`sub.O2`/`sub.H2` 等不在 Batch4 的 74 编码内，本批未重复创建、未覆盖。

见 `docs/chemistry_batch4/reuse_check.json`。

---

## 3. 导入与安全

- 方式：`pnpm chem:import`（进程内，**不使用管理员密码**）  
- 未修改用户账号/密码  
- 未覆盖已发布知识  
- 未改 Batch2/Batch3 数据编码  
- 新增默认 `pending_review` + `[inv:CODE]`  

结果：

- `docs/chemistry_batch4/import_all_results.json`
- `docs/chemistry_batch4/verify_post_import.json`
- `docs/chemistry_batch4/import_log_B4-*.txt`

---

## 4. 数据库实际验证

| 检查项 | 结果 |
|--------|------|
| 74 编码均有 entity 映射 | 是 |
| 74 行均在对应表可查 | 是 |
| status=pending_review | 74 |
| review_note 含 [inv:CODE] | 74 |
| 专项关联 linkOk | 74 |
| 遗漏 | 0 |

---

## 5. 74 条逐条覆盖结果

| # | 编码 | 类型 | 处理 | DB | 审核状态 |
|---|------|------|------|-----|----------|
| 1 | sub.Cl2 | substance | 新增导入 | 有 | pending_review |
| 2 | sub.HCl | substance | 新增导入 | 有 | pending_review |
| 3 | sub.HCl_aq | substance | 新增导入 | 有 | pending_review |
| 4 | sub.HClO | substance | 新增导入 | 有 | pending_review |
| 5 | sub.NaClO | substance | 新增导入 | 有 | pending_review |
| 6 | sub.S | substance | 新增导入 | 有 | pending_review |
| 7 | sub.SO2 | substance | 新增导入 | 有 | pending_review |
| 8 | sub.SO3 | substance | 新增导入 | 有 | pending_review |
| 9 | sub.H2SO4 | substance | 新增导入 | 有 | pending_review |
| 10 | sub.H2SO3 | substance | 新增导入 | 有 | pending_review |
| 11 | sub.N2 | substance | 新增导入 | 有 | pending_review |
| 12 | sub.NH3 | substance | 新增导入 | 有 | pending_review |
| 13 | sub.NO | substance | 新增导入 | 有 | pending_review |
| 14 | sub.NO2 | substance | 新增导入 | 有 | pending_review |
| 15 | sub.HNO3 | substance | 新增导入 | 有 | pending_review |
| 16 | sub.C | substance | 新增导入 | 有 | pending_review |
| 17 | sub.CO | substance | 新增导入 | 有 | pending_review |
| 18 | sub.Si | substance | 新增导入 | 有 | pending_review |
| 19 | sub.SiO2 | substance | 新增导入 | 有 | pending_review |
| 20 | sub.Na2SiO3 | substance | 新增导入 | 有 | pending_review |
| 21 | sub.P | substance | 新增导入 | 有 | pending_review |
| 22 | sub.P4O10 | substance | 新增导入 | 有 | pending_review |
| 23 | sub.H2S | substance | 新增导入 | 有 | pending_review |
| 24 | sub.CaCO3 | substance | 新增导入 | 有 | pending_review |
| 25 | sub.CaOH2 | substance | 新增导入 | 有 | pending_review |
| 26 | rxn.H2_Cl2 | reaction | 新增导入 | 有 | pending_review |
| 27 | rxn.2Na_Cl2 | reaction | 新增导入 | 有 | pending_review |
| 28 | rxn.2Fe_3Cl2 | reaction | 新增导入 | 有 | pending_review |
| 29 | rxn.Cl2_H2O | reaction | 新增导入 | 有 | pending_review |
| 30 | rxn.Cl2_2NaOH | reaction | 新增导入 | 有 | pending_review |
| 31 | rxn.MnO2_4HCl | reaction | 新增导入 | 有 | pending_review |
| 32 | rxn.S_O2 | reaction | 新增导入 | 有 | pending_review |
| 33 | rxn.2SO2_O2 | reaction | 新增导入 | 有 | pending_review |
| 34 | rxn.SO3_H2O | reaction | 新增导入 | 有 | pending_review |
| 35 | rxn.Cu_2H2SO4 | reaction | 新增导入 | 有 | pending_review |
| 36 | rxn.C_2H2SO4 | reaction | 新增导入 | 有 | pending_review |
| 37 | rxn.N2_3H2 | reaction | 新增导入 | 有 | pending_review |
| 38 | rxn.NH3_HCl | reaction | 新增导入 | 有 | pending_review |
| 39 | rxn.4NH3_5O2 | reaction | 新增导入 | 有 | pending_review |
| 40 | rxn.2NO_O2 | reaction | 新增导入 | 有 | pending_review |
| 41 | rxn.3NO2_H2O | reaction | 新增导入 | 有 | pending_review |
| 42 | rxn.Cu_4HNO3 | reaction | 新增导入 | 有 | pending_review |
| 43 | rxn.Cu_4HNO3c | reaction | 新增导入 | 有 | pending_review |
| 44 | rxn.C_O2_incomplete | reaction | 新增导入 | 有 | pending_review |
| 45 | rxn.C_O2_complete | reaction | 新增导入 | 有 | pending_review |
| 46 | rxn.CO2_CaOH2 | reaction | 新增导入 | 有 | pending_review |
| 47 | rxn.SiO2_2NaOH | reaction | 新增导入 | 有 | pending_review |
| 48 | rxn.SiO2_2C | reaction | 新增导入 | 有 | pending_review |
| 49 | rxn.CaCO3_2HCl | reaction | 新增导入 | 有 | pending_review |
| 50 | exp.Cl2_prep | experiment | 新增导入 | 有 | pending_review |
| 51 | exp.Cl2_property | experiment | 新增导入 | 有 | pending_review |
| 52 | exp.HCl_prep | experiment | 新增导入 | 有 | pending_review |
| 53 | exp.SO2_property | experiment | 新增导入 | 有 | pending_review |
| 54 | exp.NH3_prep | experiment | 新增导入 | 有 | pending_review |
| 55 | exp.HNO3_Cu | experiment | 新增导入 | 有 | pending_review |
| 56 | exp.CO2_property | experiment | 新增导入 | 有 | pending_review |
| 57 | exp.SiO2_glass | experiment | 新增导入 | 有 | pending_review |
| 58 | kp.Cl.property | knowledge | 新增导入 | 有 | pending_review |
| 59 | kp.Cl.prep | knowledge | 新增导入 | 有 | pending_review |
| 60 | kp.S.oxide | knowledge | 新增导入 | 有 | pending_review |
| 61 | kp.N.cycle | knowledge | 新增导入 | 有 | pending_review |
| 62 | kp.N.ammonia | knowledge | 新增导入 | 有 | pending_review |
| 63 | kp.C.oxide | knowledge | 新增导入 | 有 | pending_review |
| 64 | kp.Si.property | knowledge | 新增导入 | 有 | pending_review |
| 65 | kp.nonmetal.test | knowledge | 新增导入 | 有 | pending_review |
| 66 | sub.Br2 | substance | 新增导入 | 有 | pending_review |
| 67 | sub.I2 | substance | 新增导入 | 有 | pending_review |
| 68 | sub.bleaching_powder | substance | 新增导入 | 有 | pending_review |
| 69 | kp.S.conc_H2SO4 | knowledge | 新增导入 | 有 | pending_review |
| 70 | kp.N.ammonium | knowledge | 新增导入 | 有 | pending_review |
| 71 | rxn.NH4Cl_NaOH | reaction | 新增导入 | 有 | pending_review |
| 72 | kp.halogen.compare | knowledge | 新增导入 | 有 | pending_review |
| 73 | kp.N.synth_ammonia | knowledge | 新增导入 | 有 | pending_review |
| 74 | kp.Cl.bleach | knowledge | 新增导入 | 有 | pending_review |

完整核对数据：`verify_post_import.json`。

---

## 6. 课程范围与争议点

| 主题 | 处理 | 默认训练 |
|------|------|----------|
| 合成氨工业条件/可逆 | 标了解；勿选修平衡定量 | 限制深度题 |
| SO2 催化氧化工业 | 了解 | 可记方程式，勿深算 |
| 卤族含氧酸深度 | 明确勿默认核心 | 排除 |
| 漂白粉主成分 | **待核实教材口径** | 核实前勿考精确组成绝对题 |
| P4O10 / P2O5 写法 | 双口径提示 | 随教材 |
| Cl2+NaOH | 采用高中常用冷稀碱歧化式 | 热水/浓碱其他产物勿混入默认 |
| 清单中部分反应 specialty 含 redox | 内容层对非氧化还原已置空 ox/re | 以化学事实为准 |

---

## 7. 建议后续重点审查（质量审查阶段）

1. 氯水成分、HClO 漂白与保存  
2. Cl2 与碱（冷稀 vs 热浓）口径  
3. SO2 漂白 vs HClO 漂白对比  
4. 浓硫酸三大特性与 Cu/C 反应条件  
5. 浓/稀硝酸与铜方程式  
6. NO/NO2 转化与歧化 ox/re  
7. 氨制取、收集、喷泉、铵盐与碱  
8. SiO2 与碱及玻璃腐蚀  
9. 漂白粉成分教材表述  
10. 合成氨是否写入默认可逆/条件题池  

**本次仅做建设期基础自动检查，不能代替 Batch4 化学内容专项质量审查。**

---

## 8. 基础自动检查（建设期）

| 项 | 结果 |
|----|------|
| JSON 结构 | 有效 |
| 必填（名/式/方程式等） | 生成器校验通过 |
| 知识编码唯一 | 74 清单无重复 |
| 方程式与 inventory note 对齐 | 已按 canonical 建设 |
| 非氧化还原 ox/re 置空 | 已处理（如 NH3+HCl、SO3+H2O、CO2+石灰水等） |
| 歧化反应 ox=re=自身 | Cl2/H2O、Cl2/NaOH、NO2/H2O 已填 |
| 专项关联 | linkOk=74 |
| 审核状态 | 全部 pending_review |

**未发现建设阶段可判定的重大化学事实错误**（仍须专项质检确认）。

---

## 9. 本次修改的文件

| 路径 | 说明 |
|------|------|
| `docs/chemistry_batch4/batch4_content.js` | 内容源 |
| `docs/chemistry_batch4/import_B4-*.json` | 导入包 |
| `docs/chemistry_batch4/generate_batch4.js` / `import_all.js` | 生成与导入 |
| `docs/chemistry_kb_inventory.json` | status→imported + `batch4Build` |
| `docs/CHEMISTRY_AI_CONTEXT.md` | 进度 |
| `docs/CHEMISTRY_BATCH4_REPORT.md` | 本报告 |

---

## 10. 是否具备进入 Batch4 质量审查的条件

**是。**  

前提：74 条均已入库且 pending_review，覆盖无遗漏；下一步应启动与 Batch3 同级的化学正确性/范围/训练适用性专项审查，**不得**将本报告视为已通过质量审查或人工审核。

---

## 11. 停止声明

Batch4 建设、安全导入、覆盖检查与报告已完成并停止。  
未进入 Batch4 专项质量审查、未进入 Batch5、未开发训练引擎/OCR。
