# 工业实验 · 二级分类设计

**最后更新：** 2026-10-29 08:50:00 +08:00（STEP_03 正式定稿）  
**状态：** 分类种子已写入；题库/案例/流程图 **尚未实现**（勿当作已上线训练内容）。

---

## 1. 一级专项

| 项 | 值 |
|----|-----|
| 名称 | 工业实验 |
| code | `industrial_experiment` |
| sortOrder | 13 |
| 简介（intro） | 学习工业生产流程、工业制备原理、工艺条件、装置分析与综合计算。 |
| 与 experiment | **同级**一级专项；非 experiment 的二级分类 |

### 与「化学实验」experiment 边界

| experiment（实验室） | industrial_experiment（工业） |
|----------------------|-------------------------------|
| 仪器、基本操作、实验室气体制备、现象、安全、方案 | 工业流程识读、原料预处理、工业反应原理/条件、工业分离提纯、工业气体制备净化、装置分析、产率计算、资源循环、环保安全、典型案例、综合分析 |
| 侧重实验室书面题 | 侧重工业生产背景下的书面化学训练 |

---

## 2. 十二个二级分类（正式 code · D029）

> 说明：`chem_categories` **无 description 列**；学习范围以下表「核心知识范围」为准，种子仅存 `code` / `name` / `sort_order`。

| 序 | 名称 | code | 核心知识范围 |
|----|------|------|--------------|
| 1 | 工业流程图识读 | `flow_diagram_read` | 流程图结构、箭头、物料流向、工艺步骤与节点、试剂加入位置、中间产物识别 |
| 2 | 工业原料与预处理 | `raw_material_pretreatment` | 原料选择、粉碎/溶解/酸浸基础、预处理、杂质初步去除、原料利用 |
| 3 | 工业反应原理 | `industrial_reaction_principle` | 工业情境下的方程式、离子/氧化还原、反应物产物、原理分析 |
| 4 | 工业反应条件 | `industrial_reaction_conditions` | 温度/浓度/压强/催化剂及影响；**高一范围**；不默认引入超纲平衡计算 |
| 5 | 工业分离与提纯 | `industrial_separation_purification` | 过滤/蒸发/结晶/蒸馏基础、除杂、方法选择与顺序 |
| 6 | 工业气体制备与净化 | `industrial_gas_preparation` | 工业气体制备原理、净化吸收、尾气处理、性质与装置用途 |
| 7 | 工业装置分析 | `industrial_apparatus_analysis` | 模拟装置作用、连接、气流、选择与合理性（**装置图生成属 STEP_13，本步仅分类**） |
| 8 | 工业产率与计算 | `industrial_yield_calculation` | 物质的量、纯度、理论/实际产量、产率、基础物料计算 |
| 9 | 工业资源循环利用 | `industrial_resource_recycling` | 试剂循环、物料回收、副产物利用、循环流程识读 |
| 10 | 工业环保与安全 | `industrial_environment_safety` | 废气废液、污染物识别、环保与安全**书面知识**（非真实危险操作指导） |
| 11 | 典型工业生产案例 | `industrial_production_cases` | 教材相关背景、粗盐提纯、海水资源基础流程、简化金属回收等（**案例审核属 STEP_04**） |
| 12 | 工业流程综合分析 | `flow_comprehensive` | 多步骤流程、推断、物料循环、分离与反应、基础计算综合 |

---

## 3. 高一课程适配原则

- 分类可覆盖训练难度：基础 / 提高 / 挑战（题目 `difficulty` 1–3）。
- **分类存在 ≠ 课程审核通过**；超纲内容不得因「挑战」进入正式题库。
- 课程白名单与质检规则在 **STEP_04 及后续**完善；本文件不宣称已实现。

---

## 4. 未来能力说明（规划，未实现）

### 4.1 AI 出题如何按分类选题（规划）

- 出题请求携带 `specialtyCode=industrial_experiment` + `categoryCode`。
- 按本表核心范围约束知识点与题型；生成物入 **test** 池并经质检/审核（见 DECISIONS）。
- **当前** LocalGenerator 为本地模板，真 AI 适配属 STEP_07。

### 4.2 学习分析如何按分类统计（规划）

- 复用现有按 `specialty_id` / `category_id` 聚合的分析链路（已有化学 analytics）。
- 工业实验在有正式题与训练记录后自然出现在统计中；**当前无工业题，统计为空属正常**。

---

## 5. 种子与接入

- 写入位置：`apps/api/src/chemistry/chemistry.seed.ts` → `industrial_experiment.categories`
- 关联方式：`ensureSeeded` 按专项 code 找到 specialty，再按 `(specialty_id, category.code)` upsert
- 前端：`GET /chemistry/specialties/industrial_experiment` → `ChemistrySpecialtyView` 动态列表
- 空题库：无题时沿用现有「该专项暂无已审核的训练题目」类提示；本步不插假题
