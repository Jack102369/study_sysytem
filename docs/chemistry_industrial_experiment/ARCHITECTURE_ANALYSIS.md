# STEP_01 · 真实仓库架构分析报告

> **性质：** 只读调查结论。路径与字段均来自仓库实测；推断单独标注。  
> **调查时间：** 2026-10-29  
> **Git：** 分支 `main`，HEAD `09caa4f`（高一数学压轴题重新判定难度）  
> **范围限制：** 未改业务代码 / 数据库 / 依赖；未执行 STEP_02。

---

## 0. 证据分级

| 标记 | 含义 |
|------|------|
| **已验证** | 直接来自 `db/init.sql`、Entity、Service/Controller 或前端源码 |
| **推断** | 由已验证事实推导，尚无二次运行时验证 |
| **待确认** | 需用户拍板或后续 STEP 再验 |

---

## 1. 化学专项 / 分类体系

### 1.1 表结构（已验证 · `db/init.sql`）

**chem_specialties：** `id`, `code`(UNIQUE), `name`, `icon`, `intro`, `sort_order`, `is_active`, `created_at`, `updated_at`

**chem_categories：** `id`, `specialty_id`(FK CASCADE), `code`, `name`, `sort_order`, `is_active`, timestamps；唯一约束 `(specialty_id, code)`

实体：`apps/api/src/chemistry/chem-specialty.entity.ts`、`chem-category.entity.ts` — 与 DDL 对齐。

### 1.2 种子与初始化（已验证）

- 文件：`apps/api/src/chemistry/chemistry.seed.ts`
- 数组 `CHEM_SPECIALTY_SEEDS` 含 **恰好 12** 个一级专项（注释写「12 专项」）。
- `ChemistryService.ensureSeeded()`（`onModuleInit`）：按 `code` 查找；不存在则创建，存在则**更新** name/icon/intro/sortOrder 并强制 `isActive=true`；分类同理。**幂等**（按 code upsert）。
- **无**「数量上限」硬编码限制；注释/控制器文案写「12 个」仅为文档性描述。
- **新增一级专项：不需要改表结构**（推断：只需扩展种子数组并重启/触发 ensureSeeded）。
- **新增分类：不需要迁移**（同上）。

### 1.3 现有 12 专项 code（已验证）

| sort | code | name |
|------|------|------|
| 1 | equation | 化学方程式 |
| 2 | experiment | 化学实验 |
| 3 | substance | 化学物质性质 |
| 4 | calculation | 化学计算 |
| 5 | ion | 离子反应 |
| 6 | redox | 氧化还原反应 |
| 7 | periodic | 元素周期表 |
| 8 | structure | 物质结构 |
| 9 | organic | 有机化学 |
| 10 | inference | 化学推断 |
| 11 | memory | 化学基础记忆 |
| 12 | comprehensive | 化学综合训练 |

`experiment` 二级分类 code 示例（命名风格）：`instrument_id`, `gas_prep`, `phenomenon_judge`, `plan_design`, `inquiry` 等 — **snake_case、专项内语义短词、与 specialty 无关的相对 code**（唯一性在 specialty 内）。

### 1.4 API / 前端（已验证）

- `GET /chemistry/specialties` → `listSpecialties()`：`is_active=1`，按 `sort_order`；附带 `categoryCount`。
- `GET /chemistry/specialties/:code` → 详情 + 活跃分类列表。
- 前端：`ChemistryHomeView` 调 `listChemSpecialties()`，点击进 `/chemistry/:code`。
- `ChemistrySpecialtyView`：分类为空时 `el-empty`「该专项暂无二级分类」；有分类则卡片「开始训练」。
- **无**专项 code 白名单过滤列表（列表即 DB 活跃行）。提高训练等按 specialty 筛选，不写死 12。

### 1.5 依赖专项 code 的业务分支（已验证摘录）

- 训练/每日/提高/错题：**按 specialtyId/categoryId 或 code 解析**，非写死 12 列表。
- 高级模型 catalog：`specialtyCode` 字段用于模型元数据（见 §6）。
- 生成器模板：按 KB 的 specialtyCodes 匹配偏好分类。

**未发现**「禁止第 13 专项」的代码闸门。风险：**文档注释仍写 12**；`merge_catalog` 文件列表不含新专项模型；部分 UI/文案可能仍写「12」。

### 1.6 工业实验二级分类推荐 code（待确认 · 本步不写种子）

命名规则对齐 `experiment`：`snake_case`、专项内唯一、语义清晰。

| # | 规划名称 | 推荐 code |
|---|----------|-----------|
| 01 | 工业流程图识读 | `flow_diagram_read` |
| 02 | 工业原料与预处理 | `raw_material_prep` |
| 03 | 工业反应原理 | `reaction_principle` |
| 04 | 工业反应条件 | `reaction_condition` |
| 05 | 工业分离与提纯 | `separation_purify` |
| 06 | 工业气体制备与净化 | `gas_prep_purify` |
| 07 | 工业装置分析 | `apparatus_analysis` |
| 08 | 工业产率与计算 | `yield_calc` |
| 09 | 工业资源循环利用 | `resource_recycle` |
| 10 | 工业环保与安全 | `env_safety` |
| 11 | 典型工业生产案例 | `typical_cases` |
| 12 | 工业流程综合分析 | `flow_comprehensive` |

一级：`industrial_experiment`，建议 `sortOrder: 13`（或插在 experiment 后并重排 — **待确认**）。

---

## 2. 化学训练题库 `chem_train_items`

### 2.1 字段（已验证 · init.sql + Entity）

`code`(UNIQUE), `pool`(`formal|test`), `qtype`(`single|judge|blank`), `answer_type`(默认 `text`；注释含 chem_formula/equation/ionic/numeric), `stem`, `options_json`, `answer`, `answer_aliases_json`, `analysis`, `difficulty`(1–3), `specialty_id`, `category_id`, `status`(`draft|approved|disabled`), `is_active`, `curriculum_ok`, `verify_blocked`, `ban_default_train`, `gate_note`, 审核人字段, timestamps。

**无：** 图片列、附件列、SVG 列、题组 ID、内容哈希列、版本号列、生成批次列、独立质检表。质检/闸门信息主要落在 **`gate_note` 文本约定**（已验证于 admin 列表解析）。

### 2.2 关联（已验证）

- 专项/分类：直接 FK。
- KB：`chem_train_item_links(item_id, entity_type, entity_id)`。
- 测试池授权：`chem_train_test_grants(user_id)`；ADMIN 默认可测；普通 USER 需 grant（`ChemTrainEligibilityService.canUseTestPool`）。

### 2.3 准入规则摘要（已验证 · eligibility）

| 池 | 条件 |
|----|------|
| test | pool 匹配 + approved + active；`gate_note` 不含 `[trial_access:block]` |
| formal | 上 + 非 ban_default_train + 非 verify_blocked + curriculum_ok + **至少一条 KB link** + 关联 KB 实体 published 且通过 KB gate |

### 2.4 出题写入（已验证 · LocalGeneratorService.confirm）

- 写入 **`pool='test'`**，`status='approved'`，常设 `curriculumOk=true`（试运行路径）。
- 去重：已有 `code`、同 pool 规范化 stem。
- **未发现** 将题目自动晋升 `pool=formal` 的 Service 方法；`train-items-admin` 列表中 **`formalAllowed` 恒为 `false`**（展示层硬编码）。正式入库流程在当前代码中**不完整/未暴露为该 admin API**（已验证事实；完整人工入库路径可能依赖种子/SQL/其他未在本次穷尽的脚本 — **待 STEP_09 再挖**）。

### 2.5 工业题与 SVG 存储建议（设计 · 不实现）

**现状能力：** stem 为 TEXT，可承载 Markdown/内联说明；会话创建时**整段 stem 快照**到 `chem_train_session_items`。无题级附件表。

| 方案 | 做法 | 优点 | 风险 |
|------|------|------|------|
| S1 内联/静态嵌入 stem | 题干含受控 SVG 或描述 + 图注 | 零新表；历史随 stem 快照固定 | stem 过大；难组件化 |
| S2 attachments + URL 写入 stem | 上传 SVG 到 attachments，stem 引 URL | 复用附件 | **可变 URL** 导致历史图漂移；attachments 有 user_id |
| S3 新增题-附件关联 + 版本（最小扩展） | 后续 STEP 再定 | 清晰版本 | 需改 init.sql |

**推荐（待确认）：** 流程图 JSON 与渲染产物优先走 **程序生成后快照进 session stem/独立快照字段（未来）**；第一阶段可用 S1（生成后把**最终 SVG 字符串或不可变内容**写入 stem/分析），避免可变外链。**不要假设现在就必须加列。**

---

## 3. 训练会话与判题

### 3.1 创建链路（已验证）

`createSession` → 校验 test 权限 → `resolveSpecCat` → `findEligibleItems`(专项+分类+难度+pool，**难度无回退**) → 可选 shuffle → 截断 count → 写 `chem_train_sessions`（`session_kind='specialty'`）→ 写 `chem_train_session_items` 快照 → `getSessionForUser(..., includeAnswers: false)`。

### 3.2 快照字段（已验证）

`item_id`, `item_code`, `qtype`, `answer_type`, `stem`, `options_json`, `answer`, `answer_aliases_json`, `analysis` + 作答/判题字段。

**不含：** 独立图片列、附件 ID、图形版本号。

### 3.3 答案泄露（已验证）

作答中 `includeAnswers: false` 时响应**不含** `standardAnswer` / `analysis` / `gradeResult`。提交完成后 `includeAnswers: true` 才返回。答案存在 session_items 表中，仅 API 层过滤 — **合理，无额外泄露路径于本 Service**（推断：需确保无其它接口直接 dump session_items）。

### 3.4 判题（已验证 · `chem-train-grade.ts`）

| qtype | 规则 |
|-------|------|
| single/judge | 去空白精确匹配 → correct/wrong |
| blank + text | 标准答案+aliases 精确；否则 **pending_review** |
| blank + chem_formula | `gradeChemFormula`；可 wrong/correct/pending |
| 未答 | pending_review |

### 3.5 session_kind（已验证 · DDL 注释）

`specialty | daily | advanced | wrong_review | wrong_variation`

错题：`chem_wrong_items` / `chem_wrong_events`；提交后由错题服务按 wrong/correct 事件回放（pending 不计入掌握）。

### 3.6 题组 / 一图多问（已验证）

当前模型**一题一行**；无 shared material / 题组表。一图多问需产品层用多题重复材料或后续扩展 — **尚未实现**。

### 3.7 历史图漂移风险与版本固定（设计）

- 历史展示读的是 **session_items.stem 快照**，不是实时 `chem_train_items`。
- 若后台改正式题 stem，**已完成会话仍显示旧 stem**（已验证行为）。
- 若 stem 内是**可变外链**指向同一 URL 的更新文件，则浏览器加载时可能看到新图 — **风险**。

**最小侵入方案（仅设计）：**

1. 优先：渲染后的 SVG **内联进 stem 快照**（或 base64 data URL）。  
2. 或：attachments 使用内容哈希文件名，URL 不可变；改图即新 URL，旧 stem 仍指旧 URL。  
3. 远期：session_items 增加 `diagram_json`/`diagram_svg` 快照列（需迁移，非本步）。

---

## 4. 化学知识库

### 4.1 实体类型（已验证 · `kb.constants.ts`）

`element | substance | reaction | experiment | formula | concept | knowledge | question`

状态：`draft | pending_review | published | rejected | archived`

### 4.2 chem_experiments（已验证）

字段偏**实验室实验**：purpose/principle/instruments/reagents/steps/phenomenon/…/`is_hazardous`/`home_forbidden_note`。`steps` 等为 **TEXT**，**无**通用 JSON 工艺树字段、**无**版本号。

关联：`chem_experiment_images`→`attachments`；`chem_experiment_reactions`；`chem_experiment_substances`。

跨实体：`chem_kb_links`；挂专项/分类：`chem_entity_specialties` / `chem_entity_categories`。

### 4.3 工业案例存储方案比较（待确认 · 回应 D020）

| 方案 | 说明 | 优点 | 风险 / 迁移 |
|------|------|------|-------------|
| **A** 直接复用 `chem_experiments` | 用现有表存工业案例 | 零新表；已有反应/物质/图片关联与审核状态机 | 语义混杂（实验室文案字段）；无结构化流程 JSON |
| **B** 通用 KB + links | 用 concept/knowledge/reaction 组合 | 灵活 | 案例整体性弱；流程步骤难表达 |
| **C** 最小扩展字段 | 在 experiments 增加 `kind`/`process_json` 等 | 结构化空间 | **需改 init.sql**；本步禁止 |
| **D** 新工业案例表 | 专用表 | 模型清晰 | 成本最高；平行实体风险 |

**推荐（待用户确认，记入决策后再生效）：优先 A（短期）+ 约定 `category`/`chem_entity_specialties` 挂到 `industrial_experiment`；流程 JSON 未定前用 steps/principle 文本承载。** 当 STEP_05 协议稳定且 TEXT 不足时，再提案 **C** 最小列或独立存储，避免过早 **D**。

未发布知识：正式训练 eligibility **要求** KB `published`；生成器试运行路径允许未人工审知识（gate 注释）— 与现有 AI 试运行策略一致。

---

## 5. 「AI」出题基础设施（关键结论）

### 5.1 名称 vs 实现（已验证）

路径：`apps/api/src/chemistry/train/generator/`  
主服务：`LocalGeneratorService`（**Local**）。

- **未发现** OpenAI/DeepSeek HTTP 客户端调用于 chemistry generator。
- 实际：`generator-templates.ts` **本地模板**从 KB/白名单拼题；题干前缀 `【AI试运行】`；code 形如 `train.ai_trial.pa.*`。
- 读取 `docs/chemistry_deepseek_audit/publish_whitelist.json` 等 — **离线审计产物**，非在线模型推理。
- 流程：preview（内存 Map，30min）→ confirm 写 `pool=test`。
- 有 qualityCheck（本地）、去重、批次式 confirm 上限 500。
- 前端：`ChemistryTrainGeneratorView` + admin train-items。

### 5.2 含义

当前**没有**可直接复用的「在线 LLM 出题 Provider 抽象」在化学 generator 内。仓库其他模块（如 `ai-reference`、高一数学）可能有 DeepSeek — **工业实验若要真 AI，需最小侵入新建调用层并对齐试运行池+审核闸门**，不可假装 LocalGenerator 已是 LLM。

**最小侵入 AI 集成建议（设计）：**

1. 保留 LocalGenerator 作为规则/模板基线。  
2. 新增可选 `AiAssistGenerator`（或扩展 preview 源）：输出严格 JSON Schema → 同一套 qualityCheck → 仍只入 test pool。  
3. 复用 attachments/审核/eligibility；**禁止** confirm 直写 formal。

---

## 6. 提高训练模型（chemistry_advanced_model）

### 6.1 已实现（已验证）

- 文档目录：`docs/chemistry_advanced_model/`，含 `models/*.json`、`models_catalog.json`、`schema` 相关脚本。
- `experiment.json`：数组模型，字段含 id(`ADV.experiment.NNN`)、specialtyCode、categoryCodes、knowledgePoints、generation.`primary: local_rule`、samples 等。
- 运行时：`chem-model-catalog.loader.ts` 加载 **`models_catalog.json`**（多候选路径），用于变式「模型相关性」匹配；失败则退化为纯知识链接。
- `merge_catalog.js`：**硬编码**合并文件列表（calculation/redox/ion/experiment/inference/comprehensive/planning_other）→ 写出 catalog。

### 6.2 文档规划 / 未实现

- 模型 JSON **不是**出题引擎直接源；LocalGenerator 用 templates，不读 ADV 模型出题。
- `generation.aiAssist: optional` 多为规划标注。
- **增加 `industrial_experiment.json` 不会自动生效**：须改 `merge_catalog.js` 文件列表并重新生成 `models_catalog.json`；id 须匹配 `^ADV\.[a-z_]+\.\d{3}$`（`industrial_experiment` 合法）。

### 6.3 流程图

模型字段**无**流程图 JSON Schema；不能描述工业流程图联合生成 — **尚未实现**（属 STEP_05+）。

---

## 7. 附件

**attachments**（已验证）：`user_id`, `storage`, `url`, `mime_type`, `original_name`。化学实验图经 `chem_experiment_images` 关联。训练题**无**对等关联表。

---

## 8. 前端训练相关能力（已验证存在页面）

专项训练、每日、提高、错题/变式、历史、分析、KB、管理端生成器与题库列表 — 均已有 Vue 路由/视图。工业实验接入应以 **新 specialty 种子 + 既有训练 URL 模式** `/chemistry/:code/train` 为主，避免平行系统。

---

## 9. 对开发计划的顺序建议

现有 STEP_02→03（专项/分类）仍合理且**低风险**（仅种子）。  
建议微调（**非强制**，重大调整需用户确认）：

1. STEP_02/03 注册专项与分类后，**并行文档化**正式入库缺口（STEP_09 前置调查：如何把 test→formal）。  
2. STEP_04（案例）采用 A 方案试点，推迟新表。  
3. STEP_05/06（JSON/SVG）优先于真 AI（STEP_07）；STEP_07 需新建 LLM 适配而非扩展 Local 模板即可声称「AI」。  
4. STEP_13 装置图仍置后（维持 D021/D022）。

---

## 10. 本步明确未做

- 未改 `chemistry.seed.ts` / 业务代码 / `db/init.sql` / 依赖  
- 未启动 MySQL / 前后端完整回归  
- 未穷尽所有 SQL 手工入库脚本与 deepseek_audit 全目录  

---

## 11. 关键文件索引

| 主题 | 路径 |
|------|------|
| 种子 | `apps/api/src/chemistry/chemistry.seed.ts` |
| 专项服务 | `apps/api/src/chemistry/chemistry.service.ts` |
| DDL | `db/init.sql`（chem_specialties 起） |
| 题实体 | `apps/api/src/chemistry/train/entities/chem-train-item.entity.ts` |
| 训练 | `apps/api/src/chemistry/train/chem-train.service.ts` |
| 判题 | `apps/api/src/chemistry/train/chem-train-grade.ts` |
| 准入 | `apps/api/src/chemistry/train/chem-train-eligibility.service.ts` |
| 本地生成 | `apps/api/src/chemistry/train/generator/local-generator.service.ts` |
| 模板 | `.../generator/generator-templates.ts` |
| 模型加载 | `.../chem-model-catalog.loader.ts` |
| 模型合并 | `docs/chemistry_advanced_model/merge_catalog.js` |
| TypeORM | `apps/api/src/app.module.ts` `synchronize: false` |
