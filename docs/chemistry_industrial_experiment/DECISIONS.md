# 工业实验 · 架构决策记录（ADR）

**最后更新：** 2026-10-29 09:10:00 +08:00（STEP_05：流程图协议 schemaVersion 1.0）

状态取值：`已确认` | `待确认` | `已废弃` | `已调整`

---

## D001

| 项 | 内容 |
|----|------|
| 决策内容 | 工业实验作为高一化学第 13 个一级专项 |
| 决策原因 | 与现有 12 专项并列扩展；产品规划明确 |
| 状态 | 已确认 |
| 影响范围 | 专项注册、前端导航、训练筛选 |
| 后续调整规则 | 若调研发现一级专项模型无法扩展，须新决策并经用户确认 |

## D002

| 项 | 内容 |
|----|------|
| 决策内容 | 专项 code 为 `industrial_experiment` |
| 决策原因 | 语义清晰，与 `experiment` 区分 |
| 状态 | 已确认 |
| 影响范围 | 种子数据、API 筛选、前端路由/参数 |
| 后续调整规则 | 改 code 须全链路迁移方案 + 用户确认 |

## D003

| 项 | 内容 |
|----|------|
| 决策内容 | 第一版规划 12 个二级分类（名称已定，code 未最终确定） |
| 决策原因 | 覆盖工业流程教学主线 |
| 状态 | 已确认（名称）；code **待 STEP_01 后定稿** |
| 影响范围 | STEP_03、题库分类、训练选题 |
| 后续调整规则 | 增删改分类须更新本决策；不得在 STEP_00 改种子 |

## D004

| 项 | 内容 |
|----|------|
| 决策内容 | 复用现有化学训练题库 |
| 决策原因 | 避免平行题库与重复维护 |
| 状态 | 已确认 |
| 影响范围 | STEP_07–STEP_11 |
| 后续调整规则 | 仅当现有题库模型无法承载流程图字段时，可提案扩展字段/关联表 |

## D005

| 项 | 内容 |
|----|------|
| 决策内容 | 复用现有训练会话体系 |
| 决策原因 | 降低开发与测试成本；统一学习行为数据 |
| 状态 | 已确认 |
| 影响范围 | STEP_10–STEP_11 |
| 后续调整规则 | 禁止新建平行 session 系统；缺口以最小扩展解决 |

## D006

| 项 | 内容 |
|----|------|
| 决策内容 | 复用现有错题体系 |
| 决策原因 | 统一错题复习与变式入口 |
| 状态 | 已确认 |
| 影响范围 | STEP_11 |
| 后续调整规则 | 同 D005 |

## D007

| 项 | 内容 |
|----|------|
| 决策内容 | 工业流程图使用结构化 JSON |
| 决策原因 | 可校验、可版本化、可程序渲染 |
| 状态 | 已确认 |
| 影响范围 | STEP_05–STEP_08 |
| 后续调整规则 | Schema 变更须版本号与兼容策略 |

## D008

| 项 | 内容 |
|----|------|
| 决策内容 | 由程序根据受控 JSON 生成 SVG |
| 决策原因 | 不信任 AI 原始 SVG；保证结构可控 |
| 状态 | 已确认 |
| 影响范围 | STEP_06 |
| 后续调整规则 | 渲染器变更须回归流程图样例集 |

## D009

| 项 | 内容 |
|----|------|
| 决策内容 | AI 负责辅助生成工业案例和题目 |
| 决策原因 | 提高内容生产效率；AI 非权威科学源 |
| 状态 | 已确认 |
| 影响范围 | STEP_07 |
| 后续调整规则 | 不得绕过质检与审核 |

## D010

| 项 | 内容 |
|----|------|
| 决策内容 | AI 生成内容必须经过质量检查 |
| 决策原因 | 防止错误化学/流程内容进入训练 |
| 状态 | 已确认 |
| 影响范围 | STEP_08–STEP_09 |
| 后续调整规则 | 质检规则可迭代，关闭校验掩盖错误一律禁止 |

## D011

| 项 | 内容 |
|----|------|
| 决策内容 | 必须验证题目、图形、答案与解析一致性 |
| 决策原因 | 图文答析不一致会导致错误教学 |
| 状态 | 已确认 |
| 影响范围 | STEP_08 |
| 后续调整规则 | 一致性规则细化可追加子决策 |

## D012

| 项 | 内容 |
|----|------|
| 决策内容 | AI 审查不等于科学正确性证明 |
| 决策原因 | LLM 可能幻觉；需程序规则 + 人工审核 |
| 状态 | 已确认 |
| 影响范围 | 质检设计、审核流程 |
| 后续调整规则 | 不得用「AI 已审查」替代确定性校验或人工终审 |

## D013

| 项 | 内容 |
|----|------|
| 决策内容 | 正式题库必须遵守管理员审核机制 |
| 决策原因 | 与现有化学题库闸门一致 |
| 状态 | 已确认 |
| 影响范围 | STEP_09 |
| 后续调整规则 | 不得直写正式库状态绕过审核 |

## D014

| 项 | 内容 |
|----|------|
| 决策内容 | 工业装置图优先使用 SVG 仪器组件组合 |
| 决策原因 | 可复用、可审核、可控复杂度 |
| 状态 | 已确认（方向） |
| 影响范围 | STEP_13 |
| 后续调整规则 | 复杂装置须严格审核（见原则） |

## D015

| 项 | 内容 |
|----|------|
| 决策内容 | 不得建立平行工业训练系统 |
| 决策原因 | 维护成本与数据割裂 |
| 状态 | 已确认 |
| 影响范围 | 全项目 |
| 后续调整规则 | 任何「独立工业 session/错题」提案须否决或升格为重大决策并用户确认 |

## D016

| 项 | 内容 |
|----|------|
| 决策内容 | 不得破坏原有 12 个化学专项 |
| 决策原因 | 回归风险 |
| 状态 | 已确认 |
| 影响范围 | STEP_02 及以后一切化学改动 |
| 后续调整规则 | 改动共享表/种子须说明对既有专项的影响 |

## D017

| 项 | 内容 |
|----|------|
| 决策内容 | 不得修改高一数学业务逻辑 |
| 决策原因 | 模块隔离；工业实验属于化学 |
| 状态 | 已确认 |
| 影响范围 | 全项目 |
| 后续调整规则 | 禁止顺手改 `hs-math` / 小学数学等 |

## D018

| 项 | 内容 |
|----|------|
| 决策内容 | `db/init.sql` 为权威数据库结构 |
| 决策原因 | 仓库统一约定 |
| 状态 | 已确认 |
| 影响范围 | 一切库表变更 |
| 后续调整规则 | 实体与 init.sql 必须同步 |

## D019

| 项 | 内容 |
|----|------|
| 决策内容 | 禁止 TypeORM `synchronize=true` |
| 决策原因 | 防止环境漂移与生产事故 |
| 状态 | 已确认 |
| 影响范围 | API TypeORM 配置 |
| 后续调整规则 | 无例外 |

## D020

| 项 | 内容 |
|----|------|
| 决策内容 | 工业案例优先复用现有 `chem_experiments` |
| 决策原因 | STEP_01 方案 A；用户 STEP_02 前确认原则批准 |
| 状态 | **原则已确认**（字段映射与适用性在 STEP_04 验证） |
| 影响范围 | STEP_04、DATABASE_DESIGN |
| 调查推荐 | 短期复用 `chem_experiments` + entity 挂靠；不足再最小扩展（C） |
| 限制 | 不得破坏现有实验知识结构；不得将普通实验室实验错误归类为工业案例；STEP_02 **不得**修改 `chem_experiments` |
| 确认记录 | 2026-10-29 用户确认原则批准；STEP_04 完成字段映射分析与文件候选（见 INDUSTRIAL_CASE_MODEL / D033） |
| 后续调整规则 | 持久化落地前须确认最小扩展；不得静默改表 |

## D021

| 项 | 内容 |
|----|------|
| 决策内容 | 第一阶段优先实现工业流程图 |
| 决策原因 | 流程识读是核心教学场景；复杂度可控 |
| 状态 | 已确认 |
| 影响范围 | STEP_05–STEP_12 优先级 |
| 后续调整规则 | 与 D022 / STEP_13 配合 |

## D022

| 项 | 内容 |
|----|------|
| 决策内容 | 复杂工业装置图放在后续阶段（STEP_13） |
| 决策原因 | 审核与组件成本高 |
| 状态 | 已确认 |
| 影响范围 | STEP_12 验收范围不含 STEP_13 |
| 后续调整规则 | STEP_12 不得将 STEP_13 判为已完成 |

## D023

| 项 | 内容 |
|----|------|
| 决策内容 | 所有开发步骤必须更新进度文档 |
| 决策原因 | 跨会话可恢复 |
| 状态 | 已确认 |
| 影响范围 | 每次 STEP |
| 后续调整规则 | 失败也必须记录 |

## D024

| 项 | 内容 |
|----|------|
| 决策内容 | 所有开发步骤必须更新 NEXT_SESSION.md |
| 决策原因 | 新 AI / 新对话恢复上下文 |
| 状态 | 已确认 |
| 影响范围 | 每次 STEP 收尾 |
| 后续调整规则 | NEXT_SESSION 须含完整下一步提示词，禁止只写「继续下一步」 |

## D025

| 项 | 内容 |
|----|------|
| 决策内容 | 未通过必要验收不得标记 COMPLETED |
| 决策原因 | 防止虚假进度 |
| 状态 | 已确认 |
| 影响范围 | DEVELOPMENT_PROGRESS / STEP_XX |
| 后续调整规则 | 未测不得声称通过；阻塞记 BLOCKED |

## D026

| 项 | 内容 |
|----|------|
| 决策内容 | 所有新目录和文件由 Cursor 自动创建 |
| 决策原因 | 减少用户操作摩擦与路径错误 |
| 状态 | 已确认 |
| 影响范围 | 文档与后续代码落盘 |
| 后续调整规则 | 不得要求用户手动 mkdir/新建文件 |

## D027

| 项 | 内容 |
|----|------|
| 决策内容 | 用户只负责提供开发提示词和反馈执行结果 |
| 决策原因 | 分工清晰 |
| 状态 | 已确认 |
| 影响范围 | 协作流程 |
| 后续调整规则 | AI 负责创建/修改/验证文档与代码（在授权步骤内） |

## D028

| 项 | 内容 |
|----|------|
| 决策内容 | 每次只执行当前明确指定的开发步骤 |
| 决策原因 | 控制范围与风险 |
| 状态 | 已确认 |
| 影响范围 | 全项目 |
| 后续调整规则 | 禁止顺手执行后续 STEP；STEP_00 不得提前做 STEP_01 业务分析落地改码 |

## D029

| 项 | 内容 |
|----|------|
| 决策内容 | 工业实验 12 个二级分类 code **正式确定**并写入 `chemistry.seed.ts` |
| 决策原因 | 用户 STEP_03 提示词定稿；英文语义化 snake_case；与 experiment 边界清晰 |
| 状态 | **已确认（正式定稿）** |
| 影响范围 | 种子、训练选题、分析、STEP_04+ |
| 正式 code（sortOrder 1–12） | `flow_diagram_read`, `raw_material_pretreatment`, `industrial_reaction_principle`, `industrial_reaction_conditions`, `industrial_separation_purification`, `industrial_gas_preparation`, `industrial_apparatus_analysis`, `industrial_yield_calculation`, `industrial_resource_recycling`, `industrial_environment_safety`, `industrial_production_cases`, `flow_comprehensive` |
| 相对 STEP_01 推荐的调整 | 多数 code 加 `industrial_` 前缀或以更完整语义命名；`raw_material_prep` → `raw_material_pretreatment` 等（以本条正式列表为准） |
| 确认记录 | 2026-10-29 STEP_03 按用户给定名称与 code 写入种子；详见 `CATEGORY_DESIGN.md` |
| 后续调整规则 | 改 code 须全链路影响评估 + 用户确认；不得静默改名 |

## D030

| 项 | 内容 |
|----|------|
| 决策内容 | 化学 LocalGenerator **不是**在线 LLM；工业真 AI 出题需另建适配层 |
| 决策原因 | STEP_01 核实 generator 为本地模板 + 离线白名单，写入 test 池 |
| 状态 | 已确认（事实认定） |
| 影响范围 | STEP_07 |
| 后续调整规则 | 禁止将 LocalGenerator 宣传为已具备 DeepSeek/OpenAI 调用 |

## D031

| 项 | 内容 |
|----|------|
| 决策内容 | 新增一级专项/二级分类 **无需数据库迁移**（扩展种子 + ensureSeeded 即可） |
| 决策原因 | 表结构已支持任意 code；唯一约束在 code / (specialty_id,code) |
| 状态 | 已确认 |
| 影响范围 | STEP_02、STEP_03 |
| 后续调整规则 | 若未来改列类型/加字段仍须走 init.sql |

## D032

| 项 | 内容 |
|----|------|
| 决策内容 | 流程图展示优先保证会话题面不可变（内联 SVG 或内容哈希 URL）；防历史漂移 |
| 决策原因 | session_items 快照 stem 文本；可变外链会导致「改图后历史变脸」 |
| 状态 | 已确认（设计原则） |
| 影响范围 | STEP_05、STEP_06、STEP_10 |
| 后续调整规则 | 实现时不得默认使用可覆盖的同一 URL 资源 |

## D033

| 项 | 内容 |
|----|------|
| 决策内容 | STEP_04 工业案例以**仓库 JSON 候选 + TypeScript 领域模型**落地；**不**自动写入 chem_experiments / 正式 KB |
| 决策原因 | D020 原则复用 experiments，但结构化字段/版本/来源尚未落库；避免污染正式 KB |
| 状态 | 已确认 |
| 影响范围 | STEP_04–09 |
| 后续调整规则 | 持久化须单独设计最小扩展并经用户确认后再改 init.sql |

## D034

| 项 | 内容 |
|----|------|
| 决策内容 | 结构校验通过 ≠ 化学正确；无 verified 来源不得 published；contentHash 变化使旧审核失效 |
| 决策原因 | 防止 AI/候选内容伪科学认证与带病发布 |
| 状态 | 已确认 |
| 影响范围 | 校验、STEP_08/09 |
| 后续调整规则 | 不得关闭校验掩盖错误 |

## D035

| 项 | 内容 |
|----|------|
| 决策内容 | 工业流程图采用三层分离：Case / Definition / Public；学生端仅白名单 Public；schemaVersion=`1.0` |
| 决策原因 | 防止答案与内部引用经前端/SVG 泄露 |
| 状态 | 已确认 |
| 影响范围 | STEP_05–06、10 |
| 后续调整规则 | 未知 schemaVersion 必须报错，不得静默兼容 |

## D036

| 项 | 内容 |
|----|------|
| 决策内容 | 普通流边禁止意外有向环；`recycle` 边允许回流；流程图示例仅文件级，不入正式题库 |
| 决策原因 | 工业循环与错误环路需区分；协议测试不等于化学审核 |
| 状态 | 已确认 |
| 影响范围 | STEP_05–09 |
| 后续调整规则 | 持久化另案；不得把示例 JSON 当 published |

## D037

| 项 | 内容 |
|----|------|
| 决策内容 | SVG 仅由程序根据 **IndustrialDiagramPublic** 生成；渲染器不调用投影补救；不接受 Definition/任意 AI SVG |
| 决策原因 | 防止答案泄露与 XSS；保证可复现附图 |
| 状态 | 已确认 |
| 影响范围 | STEP_06–10 |
| 后续调整规则 | 前端禁止对未校验 SVG 使用 v-html；推荐 blob/`<img>` |

## D038

| 项 | 内容 |
|----|------|
| 决策内容 | 第一版布局为确定性分层+正交折线；recycle 不入拓扑层；复杂交叉允许警告，禁止静默改拓扑 |
| 决策原因 | 可测可复现优先于美学最优；化学正确性另步验证 |
| 状态 | 已确认 |
| 影响范围 | STEP_06–08 |
| 后续调整规则 | 布局升级不得改变边 from/to 语义 |

## D039

| 项 | 内容 |
|----|------|
| 决策内容 | 化学 LocalGenerator 保持本地模板；工业出题使用独立 Industrial AI Provider（HTTP+Mock），不删除/不改造成唯一路径 |
| 决策原因 | LocalGenerator≠LLM；避免破坏现有管理出题 |
| 状态 | 已确认 |
| 影响范围 | STEP_07–09 |
| 后续调整规则 | 生成来源必须区分 local_template / ai_generated / mock_generated |

## D040

| 项 | 内容 |
|----|------|
| 决策内容 | `formal_candidate` 仅接受可信案例；`development_test` 可用 draft 但强制 `development_only`；默认开发走 Mock；候选仅文件级，禁止直入 chem_train_items |
| 决策原因 | 未审核知识不得成为正式可信依据；Mock 不得冒充真实 AI / 正式题 |
| 状态 | 已确认 |
| 影响范围 | STEP_07–09 |
| 后续调整规则 | 不得因 Mock 通过自动 verified / approved |

## D041

| 项 | 内容 |
|----|------|
| 决策内容 | 质量检查六维分离；`unknown`≠`pass`；AI 辅助审查不得覆盖程序 fail；`requiresHumanReview` 恒 true |
| 决策原因 | 防止伪科学认证与自动放行 |
| 状态 | 已确认 |
| 影响范围 | STEP_08–09 |
| 后续调整规则 | 不得为全 pass 伪造 verified 来源或关闭校验 |

## D042

| 项 | 内容 |
|----|------|
| 决策内容 | 质量报告绑定 `auditContentHash`；语义变化旧报告失效；`formalPublishEligible` 独立于 `passed_automatic_checks` |
| 决策原因 | 防止改题后复用旧报告入库 |
| 状态 | 已确认 |
| 影响范围 | STEP_08–09 |
| 后续调整规则 | STEP_09 入库前必须校验报告当前有效 |

## D043-PROPOSED（历史）

| 项 | 内容 |
|----|------|
| 决策内容 | **当时待确认**：新增 `chem_train_item_assets`（方案 C）绑定不可变工业 SVG（content_hash + relative_path）；同步 init.sql + migrate |
| 决策原因 | chem_train_items 无 SVG 字段；仅 gate_note 不足；附件表无题关联 |
| 状态 | **历史：PROPOSED**（提出于 STEP_09 前期；写库曾以 `SVG_DB_BINDING_PROPOSED` 阻断） |
| 影响范围 | STEP_09–10 |
| 后续调整规则 | 见 **D043-APPROVED** |

## D043-APPROVED

| 项 | 内容 |
|----|------|
| 决策内容 | **批准方案 C**：新增 `chem_train_item_assets`；不可变文件 `uploads/industrial-svg/<sha256>.svg`；题-图多对多引用；UNIQUE(train_item_id, asset_type, asset_role, content_hash)；content_hash **非**全表唯一 |
| 批准原因 | 工业流程图属正式题目内容；需一题多图、多题共享、内容哈希、版本固定、历史还原、未来装置图扩展；禁止仅靠可变 URL / HTML 内嵌 |
| 状态 | **APPROVED**（2026-10-29；代码+init.sql+migrate 已落地；**未**对未知/生产库自动执行迁移） |
| 影响范围 | STEP_09 完成；STEP_10 会话快照接入 |
| 后续调整规则 | 不得回退为「仅 gate_note」；不得改 formalAllowed=true；物理 SVG 不随题 CASCADE 删除；GC 另议 |

## D044

| 项 | 内容 |
|----|------|
| 决策内容 | 保持 train-items-admin `formalAllowed=false`；工业入库走独立闸门，不绕过 curriculum_ok/verify_blocked/ban_default_train |
| 决策原因 | formalAllowed 为 AI 试运行安全叙事，不是工业开关 |
| 状态 | 已确认 |
| 影响范围 | STEP_09–10 |
| 后续调整规则 | 不得删除该硬编码以「方便入库」 |

## D045

| 项 | 内容 |
|----|------|
| 决策内容 | 新增 `chem_train_session_item_assets`：开训时快照多图（asset_type/role/content_hash/diagram_version/sort_order）；学生 SVG 仅会话授权 API；公开 `/uploads/industrial-svg` 403 |
| 决策原因 | 历史训练不得按 train_item_id 动态取当前图；一题多图；disabled 后仍可还原；防静态绕过 |
| 状态 | **APPROVED / IMPLEMENTED（STEP_10 代码层；真实库迁移未执行）** |
| 影响范围 | STEP_10–11 |
| 后续调整规则 | 不得改回「仅存单个 svgContentHash」丢多图；不得用当前 item_assets 冒充历史；不得放开公开静态工业 SVG |

## D046

| 项 | 内容 |
|----|------|
| 决策内容 | STEP_11：错题历史图经 `chem_wrong_events.session_id/session_item_id` → `chem_train_session_item_assets`；无新错题图字段。工业 AI 变式仅写入审核仓（`formalImportBlocked`）；学生变式训练只抽已审核正式变式。管理员 `kb-bind` 仅绑定 published KB，不放宽 eligibility。 |
| 决策原因 | 事件表已有会话溯源；禁止平行错题/变式系统；禁止未审核 AI 进 formal |
| 状态 | **已确认 / IMPLEMENTED（STEP_11 代码层）** |
| 影响范围 | STEP_11 |
| 后续调整规则 | 不得用当前 `chem_train_item_assets` 冒充历史错题图；不得把 AI 变式直写 formal；不得伪造 KB / 案例审核态 |

## D047

| 项 | 内容 |
|----|------|
| 决策内容 | STEP_13：工业装置图使用独立 JSON 协议（Definition/Public）；程序渲染 SVG；端口介质校验；安全规则 unknown≠pass。资源复用 D043 `industrial_apparatus_svg` 与 D045 会话快照；不新建平行资源/训练系统；不改 STEP_12 CONDITIONALLY_ACCEPTED。 |
| 决策原因 | 装置语义≠流程节点；须可验证端口与安全启发式；保持题库/会话闸门 |
| 状态 | **已确认 / IMPLEMENTED（STEP_13 代码层；真实环境未验证）** |
| 影响范围 | STEP_13 |
| 后续调整规则 | 不得让 AI 直出任意 SVG；不得把 schematic 冒充施工图；不得放宽 formal；重大 DB 变更须另批 |

## D048

| 项 | 内容 |
|----|------|
| 决策内容 | POST_STEP_13 PHASE_E1：正式候选可用 `generationSource=manual_fixture`（人工编写 + 程序渲染）；与 Mock 验收批次隔离；formal 闸门对 Mock 仍阻断，对 manual_fixture 不再按 Mock 拦；候选仍须人审 + 案例可信 + 质检 + KB，**不得**因 E1 完成即视为 READY_FOR_FORMAL_IMPORT。PHASE_E2（入库/绑定/训练）须另批。 |
| 决策原因 | 控制在线 AI 成本与不可控输出；保留可追溯 curated 路径；禁止把「候选准备完成」冒充「可入库」 |
| 状态 | **已确认 / IMPLEMENTED（E1 文件级批次；无 formal 写库）** |
| 影响范围 | PHASE_E1；review.types / formal-import Mock 闸门；文档 |
| 后续调整规则 | 不得伪造人审/案例审核/页码；不得自动 approve；不得改 PHASE_D Mock 批次冒充正式；未解阻塞不得进 E2 |

## D049

| 项 | 内容 |
|----|------|
| 决策内容 | PHASE_E2-A：区分 QUALITY_BLOCKERS 与 PUBLISH_ELIGIBILITY_BLOCKERS；`FILTER_SOLUBLE_SALT` 仅匹配肯定错误表述；允许修订未发布候选并失效旧人审/质检；最多宣布 READY_FOR_HUMAN_REVIEW，不得因内容修复自动 READY_FOR_FORMAL_IMPORT；案例 draft/unverified 保持 fail 于正式模式。 |
| 决策原因 | 避免教学正确表述被工艺规则误伤；避免把发布资格问题与题目内容错误混为一谈；保持人审与来源闸门 |
| 状态 | **已确认 / IMPLEMENTED（E2-A）** |
| 影响范围 | quality.constants；case fixtures（gas_wash）；phase-e2a-revise；管理端详情展示 |
| 后续调整规则 | 不得删确定性安全规则；不得 unknown→pass；不得脚本批准人审/案例；重大案例审核架构变更须另批 |

## D050

| 项 | 内容 |
|----|------|
| 决策内容 | PHASE_E2-B：区分 REVIEW_WORKFLOW_READY 与 HUMAN_REVIEW_COMPLETED；管理员审核清单/案例覆盖层不升格 `approved_for_import`/`published`；reject/needs_revision 在质检失败时仍可执行；approve→入库态须案例 published+来源 verified+正式资格；formal-import 在 E2-B 强制 dry-run；审核人/时间/哈希仅服务端写入。 |
| 决策原因 | 防止 AI/脚本冒充人审；防止清单确认被当成正式发布；保持闸门 |
| 状态 | **已确认 / IMPLEMENTED（E2-B 工作流；真人审 NOT_EXECUTED）** |
| 影响范围 | review.service/controller/dto/nest；admin packet；case-review store；CandidatesView |
| 后续调整规则 | 不得 Cursor 代点通过；不得伪造 verified/published；E2-C 须另批 |

## D051

| 项 | 内容 |
|----|------|
| 决策内容 | PHASE_E2-B2：不可变 fixture + 文件覆盖层 + `resolveIndustrialCaseEffectiveReview`；`approve_for_publish` 授予有效发布资格但不改写 fixture published/verified；投影仅改 reviewStatus/reviewedContentHash（避 contentHash 污染）；质检 CURR_CASE_TRUST/CHEM_SOURCE_VERIFIED 读 effective；案例审核后失效候选质检；formal-import 默认 dry-run，真实写库需 `INDUSTRIAL_FORMAL_REAL_PUBLISH` + `confirmRealPublish`（默认关）。 |
| 决策原因 | 打通合法案例资格与正式闸门，同时禁止伪造历史与自动发布 |
| 状态 | **已确认 / IMPLEMENTED（E2-B2；真人审/真实入库 NOT_EXECUTED）** |
| 影响范围 | case-effective-review；case-review.store；quality；formal-import；review API/UI；formal-publish.config |
| 后续调整规则 | 不得自动批准；不得默认开 real publish；E2-C 须另批 |

## D052

| 项 | 内容 |
|----|------|
| 决策内容 | `INDUSTRIAL_EXPERIMENT_FULL_DISABLE`：用环境变量 `CHEM_INDUSTRIAL_EXPERIMENT_ENABLED`（默认 false）全链路停用工业实验；专属 API Guard→404；通用抽题/训练/错题/统计隔离；前端菜单与路由 fail-closed；**不删除**数据与代码；重新启用不自动发布候选、不自动写库；停用≠升格 ACCEPTED。 |
| 决策原因 | 用户要求暂时不用工业实验，同时保留恢复能力与历史资产 |
| 状态 | **已确认 / IMPLEMENTED（代码级停用；浏览器/HTTP 真实验收 PENDING）** |
| 影响范围 | industrial-feature.config；EnabledGuard；chemistry/train/daily/advanced/wrong/analytics；web router/menu；会话 SVG |
| 后续调整规则 | 恢复须显式 env=true 并重启 API；不得因恢复自动 formal；不得删历史数据 |
