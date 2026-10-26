# P0-02 化学专项架构与业务链路分析

> 任务编号：P0-02  
> 依据：仓库实际代码与 `db/init.sql`  
> 约束：本任务仅文档；未改化学业务、数据库或配置  

前置阅读：`.cursorrules`、`.cursor/rules/math-development.mdc`、`docs/math/00-existing-system-analysis.md`。

---

## 1. 化学专项实际模块结构

### 1.1 NestJS 模块

入口：`apps/api/src/chemistry/chemistry.module.ts`  
在 `AppModule` 中以 `ChemistryModule` 扁平导入。

| 分层 | Controllers | Services / 其它 |
|------|-------------|-----------------|
| 专项目录 | `ChemistryController` | `ChemistryService` |
| KB 只读 | `ChemKbController` | `ChemKbService` |
| KB 管理 | `ChemKbAdminController` | `ChemKbImportService` |
| 专项训练 | `ChemTrainController` | `ChemTrainService`、`ChemTrainEligibilityService` |
| 每日复习 | `ChemDailyReviewController` | `ChemDailyReviewService` |
| 进阶训练 | `ChemAdvancedTrainController` | `ChemAdvancedTrainService` |
| 错题 | `ChemWrongQuestionController` | `ChemWrongQuestionService` |
| 学情 | `ChemAnalyticsController` | `ChemAnalyticsService` |
| 学习首页 | `ChemLearningHomeController` | `ChemLearningHomeService` |
| 出题器（管理） | `LocalGeneratorController` | `LocalGeneratorService` |
| 训练题列表（管理） | `TrainItemsAdminController` | `TrainItemsAdminService` |

公共依赖：`AuthModule`、`AdminGuard`、`User` 实体；**未** import `AiReferenceModule` / `DeepseekClientService`。

### 1.2 模块依赖关系（实际）

```
ChemistryModule
├── AuthModule（JWT / AdminGuard）
├── TypeORM: specialties/categories + KB_ENTITIES + TRAIN_ENTITIES
│
├── 公共内容路径（无 userId）
│   ChemistryController / ChemKbController → 专项树、已发布 KB
│   ChemKbAdminController → 全状态 KB CRUD + status + import
│
└── 用户学习路径（有 userId）
    ChemTrainService ←── ChemDailyReviewService / ChemAdvancedTrainService / ChemWrongQuestionService
         │                      （创建会话后复用 getSession / submit）
         └── submit → ChemWrongQuestionService.onSessionSubmittedSafe
    ChemAnalyticsService ← sessions + session_items + wrong.summary
    ChemLearningHomeService ← wrong + daily status 等聚合
    LocalGeneratorService → chem_train_items（内存 preview，确认写库）
```

判题：纯函数 `apps/api/src/chemistry/train/chem-train-grade.ts`（+ `chem-formula.util.ts`）。

### 1.3 Vue 页面与 API

| 角色 | 路径 |
|------|------|
| 学生页 | `apps/web/src/views/chemistry/*`（Home / Specialty / Train* / Daily / Wrong / Analytics / Advanced / Kb*） |
| 管理页 | `apps/web/src/views/settings/chemistry/*`（KbAdmin / TrainGenerator / TrainItemsAdmin） |
| API 封装 | `apps/web/src/api/chemistry.ts`、`chemistry-kb.ts`、`chemistry-train.ts`、`chemistry-train-generator.ts`、`chemistry-train-items-admin.ts` |
| 路由 | `apps/web/src/router/index.ts`（`/chemistry/**`；管理 `requiresAdmin`） |
| 菜单 | `AppLayout.vue`「高一化学」；`SettingsLayout.vue` 化学三项管理 |

### 1.4 HTTP 前缀一览（无全局 `/api`）

| 前缀 | 说明 |
|------|------|
| `chemistry` | 专项列表 |
| `chemistry/kb` | 已发布 KB |
| `chemistry/admin/kb` | KB 管理 |
| `chemistry/train` | 专项训练会话 |
| `chemistry/daily` | 每日（controller 路径以源码为准） |
| `chemistry/advanced` | 进阶 |
| `chemistry/wrong-questions` | 错题 |
| `chemistry/analytics` | 学情 |
| `chemistry/admin/train-generator` | 本地模板出题 |
| `chemistry/admin/train-items` | 训练题管理列表 |

（精确 path 以各 `*.controller.ts` 的 `@Controller` 为准。）

---

## 2. 完整训练业务链路

### 2.1 主链路（专项训练）

```
POST chemistry/train/sessions          ChemTrainController.create
        ↓ ChemTrainService.createSession
  校验 test 池权限 → 解析 specialty/category
        ↓ findEligibleItems（approved + 准入）
  选题（sequential / random）→ 落 chem_train_sessions + chem_train_session_items
        ↓ 返回会话（不含标准答案）
PATCH .../sessions/:id/answers         saveAnswer（仅写 user_answer，不判题）
        ↓ 可多次覆盖同一 sortOrder
POST  .../sessions/:id/submit          submit
        ↓ gradeAnswer 逐题 → 写 grade_result
        ↓ status=completed，汇总 correct/wrong/pending
        ↓ wrongQuestions.onSessionSubmittedSafe（失败不回滚）
GET   .../sessions / sessions/:id      历史与详情（user_id 隔离）
POST  .../sessions/:id/cancel          取消进行中
```

关键文件：

- Controller：`apps/api/src/chemistry/train/chem-train.controller.ts`
- Service：`apps/api/src/chemistry/train/chem-train.service.ts`
- 判题：`chem-train-grade.ts`
- 实体：`entities/chem-train-session.entity.ts`、`chem-train-session-item.entity.ts`
- 表：`chem_train_sessions`、`chem_train_session_items`（`db/init.sql`）

### 2.2 十问逐条结论

| # | 问题 | 实际结论 |
|---|------|----------|
| 1 | 会话如何创建 | `createSession`：`sessionsRepo.save(create({...}))`，题目快照写入 `session_items` |
| 2 | 会话 ID | TypeORM `@PrimaryGeneratedColumn` bigint → MySQL 自增；**非** UUID |
| 3 | 防重复提交 | `submit`：若 `status === 'completed'` **幂等直接返回**；`cancelled` 拒绝 |
| 4 | 多次作答 | `saveAnswer` **覆盖**同题 `user_answer`；**不**保留作答历史行。多次「正确/错误」体现在跨会话的错题事件回放 |
| 5 | 判题 | 提交时 `gradeAnswer`：单选/判断精确匹配；填空 text 标准+别名，否则 `pending_review`；`chem_formula` 走公式规则。**非 LLM 判题** |
| 6 | 得分 | 会话存 `correctCount/wrongCount/pendingCount`；**无**百分制总分字段。分析侧正确率 = correct/(correct+wrong)，pending 不进分母（`chem-analytics.service.ts` notes） |
| 7 | 结束 | `submit` → `completed`；或 `cancel` → `cancelled` |
| 8 | 历史 | `GET sessions` + `user_id` + kind/pool 过滤分页 |
| 9 | 恢复未完成 | `getSession` 可取 `in_progress`；每日 `status` 返回 `inProgressSessionId`。专项侧**当前未发现**「自动唯一进行中会话」约束；每日新建会取消当日未完成每日会话 |
| 10 | userId 隔离 | Controller 传 `user.sub`；`requireOwnSession` 校验 `session.userId`；列表 `where user_id` |

### 2.3 其它会话形态

| kind | 创建入口 | 说明 |
|------|----------|------|
| `specialty` | `ChemTrainService.createSession` | 默认专项 |
| `daily` | `ChemDailyReviewService.createSession` | 上海日、`countsFormalStats: false` |
| `advanced` | `ChemAdvancedTrainService` | 进阶 |
| `wrong_review` / `wrong_variation` | `ChemWrongQuestionService` | 错题重练 / 变式 |

作答与提交仍落到同一套 `chem_train_sessions` / `session_items`，复用 `ChemTrainService.submit` 路径（错题创建后走 train 的 get/submit）。

---

## 3. 知识库与题库设计

### 3.1 KB 实体类型

常量：`apps/api/src/chemistry/kb/kb.constants.ts`  
`element | substance | reaction | experiment | formula | concept | knowledge | question`

表：`chem_elements` … `chem_questions` 等（`db/init.sql`）。

### 3.2 知识点组织

- 表 `chem_knowledge_points`：树形 **`parent_id`**（自引用层级）
- 实体：`kb/entities/chem-knowledge-point.entity.ts`
- 关联：
  - `chem_kp_links`：KP → 任意 KB 实体（`target_type/target_id`）
  - `chem_question_kps`：KB 题 `chem_questions` ↔ KP
  - `chem_kb_links`：通用 from/to 图谱边
  - `chem_entity_specialties` / `chem_entity_categories`：实体挂专项/分类

**知识点之间「先修依赖」专用表/边类型：当前未发现**（仅有 `parent_id` 层级 + 通用 links，无独立 prerequisite 语义在代码中强制执行）。

### 3.3 训练题库（与 KB 题库分离）

| | KB `chem_questions` | 训练 `chem_train_items` |
|--|---------------------|-------------------------|
| 用途 | 知识库题目展示 | 训练引擎实际出题 |
| 关联 KP | `chem_question_kps` | 经 `chem_train_item_links` 链到实体（含 knowledge 等），**非**强制 question_kps |
| 状态 | KB：`draft/pending_review/published/rejected/archived` | 训练：`draft/approved/disabled` |
| user_id | **无** | **无** |

训练选题读 `chem_train_items`（`status=approved` 等），会话时**快照** stem/answer 到 `session_items`。

### 3.4 公共库与 userId

KB 与 `chem_train_items` **均无 `user_id`**（公共内容）。  
用户数据：`chem_train_sessions`、`chem_wrong_items`、`chem_wrong_events`、`chem_train_test_grants`。

### 3.5 管理与发布

- 学生：`ChemKbController` `publishedOnly: true`
- 管理：`ChemKbAdminController` `@UseGuards(JwtAuthGuard, AdminGuard)`：CRUD、`PATCH .../status`、`import`、links
- KB 审核字段：`status`、`review_note`、`reviewed_by`、`reviewed_at`
- 训练题：`approved` 才进正式池；另有 `curriculum_ok`、`verify_blocked`、`ban_default_train`、`gate_note` 门控（`ChemTrainItem` 实体）

### 3.6 适合数学复用 vs 化学专有

| 适合借鉴 | 不宜照搬 |
|----------|----------|
| 公共内容无 user_id / 用户学习有 user_id | 元素/反应/方程式物种等化学本体 |
| 内容 status 发布流 | `chem_formula` 判题与化学公式工具 |
| 训练题与展示题分表 + 会话快照 | 「高一化学」专项/分类树语义 |
| Admin 挂 Settings + AdminGuard | 试运行 test pool + grant 表的产品策略可参考但不必同构 |

---

## 4. 错题与复习机制

### 4.1 化学错题本

| 问题 | 结论 | 依据 |
|------|------|------|
| 如何产生 | 会话 `submit` 后 `onSessionSubmittedSafe` → **全量回放**用户历史 correct/wrong | `chem-wrong-question.service.ts` |
| 是否自动 | 是（失败只打日志，不回滚训练） | `onSessionSubmittedSafe` |
| 重复错误 | 唯一键 `(user_id, item_id)`；`wrong_count` 累加；再错重置为 `open` | `uk_chem_wrong_user_item`、`replayState` |
| 独立表 | `chem_wrong_items` + `chem_wrong_events` | init.sql |
| 与通用错题本 | **无关联**（chemistry 代码中 **未发现** `error_questions` 引用） | grep 无匹配 |
| 错误次数 | `wrong_count` | 实体 |
| 掌握状态 | `open` / `consolidating` / `mastered` | 回放规则 |
| 重练 | `POST practice`、`variation-practice` 建新会话 | controller |
| userId | 全部按 `user_id` | 各查询 |

掌握规则（代码常量）：

- 错后累计正确 ≥ `WRONG_MASTER_MIN_CORRECT`（2）
- 至少 2 个不同 session 的正确
- 首次错后正确与最近正确间隔 ≥ `WRONG_MASTER_GAP_DAYS`（3）个上海自然日  
文件：`chem-wrong-question.service.ts`

「今日到期」：`open` 恒 due；`consolidating` 距上次正确/练习 ≥ `WRONG_CONSOLIDATING_DUE_DAYS`（2）天；**无 `next_review_at` 列**。

### 4.2 每日复习

| 问题 | 结论 |
|------|------|
| 任务如何产生 | 用户主动 `POST` 创建每日会话；非 cron 推送 |
| 调度 | `pickDailyItems`：近期出现降权 + 错题关联加权 + 专项/分类分散；目标 10 题；难度 1–2 |
| `next_review_at` | **每日会话表无此字段**；错题用 gap 天数计算 due |
| 多次复习 | 同日可多次 completed；新建会 cancel 当日 in_progress |
| 掌握 | 不由每日单独判定；错题状态靠全局回放 |
| 与训练历史 | 同表 `session_kind='daily'`；`countsFormalStats=false` |

文件：`chem-daily-review.service.ts`、`shanghai-date.util.ts`。

### 4.3 对数学错题策略的判断（不预设唯一答案）

基于事实的对比：

| 维度 | 通用错题本 `error_questions` | 化学 `chem_wrong_*` |
|------|------------------------------|---------------------|
| 来源 | 用户手工录入为主 | 训练自动索引 |
| 结构 | 题干/解析/分类/附件/复习 next_review_at | 绑定 `train_item_id` + 事件回放 |
| 隔离 | user_id | user_id |

**建议倾向（供后续设计确认，非实现）：**  
数学思维训练若以「系统出题 + 自动判分」为主，更接近化学错题索引（**专项错题表**），再在产品层做统一入口聚合；不宜把训练自动错题硬塞进通用错题本（字段与生命周期不匹配）。  
若数学也支持「拍照/手写错题归档」，可继续用通用错题本，与专项训练错题并存。

---

## 5. 学情分析机制

文件：`chem-analytics.service.ts` / `chem-analytics.controller.ts`  
前端：`ChemistryAnalyticsView.vue`（ECharts 消费 API 返回的 series）。

| 项 | 实际 |
|----|------|
| 数据来源 | 用户 `completed` 会话 + `session_items` 年级结果；错题 summary |
| 正确率 | correct/(correct+wrong)；pending 不计分母 |
| 知识点掌握度 | **当前未实现为指标**；文案明确「答题正确率 ≠ 知识点掌握度」 |
| 薄弱点 | 专项维度错误题次、错题 status、建议 `buildSuggestions` |
| 聚合位置 | **请求时实时聚合**，无独立统计表 |
| 缓存 | **当前未发现** |
| 仪表盘 | 化学有 `learning-home`；与全局 Dashboard **无强耦合**（化学模块内自洽） |
| 归因局限 | 专项/难度按**题目当前归属**，非历史快照（API notes） |

数学未来要的「独立正确率 / 提示后 / 变式 / 间隔复习」：

- 化学已有：`session_kind`、变式会话、错题 consolidating due —— **可借鉴维度拆分**
- 化学**未**区分「提示后正确」字段 —— 属 **D：需数学改进设计**
- 无 KP 掌握度模型 —— 数学若要做，需新建，勿假称化学已有

---

## 6. AI 生成与审核机制

### 6.1 实际链路（重要更正）

化学管理端「训练题生成器」是 **`LocalGeneratorService`**：

- 路径：`chemistry/admin/train-generator`
- 实现：`generator-templates.ts` + KB 数据 **本地模板拼题**
- **运行时不调用** `DeepseekClientService`（chemistry 目录仅引用 `docs/chemistry_deepseek_audit/*.json` 白名单文件做过滤）
- 流程：`preview`（内存 Map + TTL）→ `confirm` 事务写入 `chem_train_items`（默认 `status: 'approved'`）
- **同步**请求；**当前未发现**队列/异步 Job
- 批量：单次 confirm 有上限（`MAX_PER_CONFIRM`）
- 失败：无自动 retry；preview 过期需重新 preview

DeepSeek 在全站用于 ai-reference / writing-coach / pet 等；**化学训练出题主路径 ≠ DeepSeek 在线生成**。  
仓库另有大量 `docs/chemistry_deepseek_audit*` **离线审计脚本/结果**，不属于 Nest 训练 API 在线链路。

### 6.2 三环节是否分离

| 环节 | 化学训练生成器实际 |
|------|-------------------|
| AI 生成内容 | **主要是模板程序生成**；DeepSeek 不在该 Controller 链路 |
| 程序校验 | 有 skip/门控、白名单、利用率统计等 |
| 人工审核 | KB 有 status 工作流；生成器 confirm **直接 approved** —— 人工审核**弱/可跳过**，依赖 admin 事后改 status 或 docs 白名单 |

---

## 7. 管理后台实现

| 能力 | 实现 |
|------|------|
| 入口 | Settings 侧栏 + `meta.requiresAdmin` |
| KB | `/settings/chemistry` → admin KB API |
| AI/模板生成器 | `/settings/chemistry-generator` |
| 训练题 | `/settings/chemistry-train-items` |
| 后端权限 | `JwtAuthGuard` + `AdminGuard` |
| 前端权限 | router `requiresAdmin` + 菜单 `role==='ADMIN'` |

数学应同样挂 Settings，扩展侧栏与路由，**不新建**独立后台应用。

---

## 8. 数据库设计模式（化学摘要）

| 模式 | 说明 |
|------|------|
| PK | `BIGINT UNSIGNED AI`；TS `string` |
| 公共表 | 无 `user_id`；业务唯一键如 `uk_chem_train_item_code` |
| 用户表 | 必有 `user_id` + 索引；错题 `uk_chem_wrong_user_item (user_id,item_id)` |
| 会话题 | `uk_chem_train_sess_item_ord (session_id, sort_order)`；FK CASCADE |
| JSON | `options_json`、`answer_aliases_json` |
| 状态 | KB 五态；训练题 draft/approved/disabled；会话 in_progress/completed/cancelled；判题 correct/wrong/pending_review |
| 时间 | `datetime(3)`；每日用 `daily_date` + 上海时区工具 |
| 删除 | 会话项随会话 CASCADE；错题事件关联会话 |

---

## 9. 数学专项复用分类表

| 能力 | 分类 | 说明 |
|------|------|------|
| JWT / CurrentUser / AdminGuard | **A** | 直接复用 auth |
| 统一响应 / ValidationPipe / DTO | **A** | 全局已有 |
| Settings 管理入口模式 | **A** | 扩展菜单与路由 |
| attachments 上传 | **A** | 若需配图/动画资源 |
| DeepseekClientService | **A（有限）** | 仅文案/教学语言；**勿**用于最终算数判分 |
| 模块边界（独立 Nest module + views + api） | **B** | 建 `math/` 平行化学 |
| 公共内容 vs 用户学习分表 | **B** | 同模式，数学本体不同 |
| 训练会话 + 题目快照 + 提交判题 | **B** | 独立表 `math_*`，流程可借鉴 |
| 确定性判题函数 | **B** | 数学需自写运算/表达式判题 |
| 专项错题索引 + 事件回放 | **B** | 独立于通用错题本 |
| 加权抽题的每日练习 | **B** | 可借鉴，规则重定 |
| 学情实时聚合 API | **B** | 维度按数学重做 |
| 化学元素/反应/公式本体 | **C** | 不复用 |
| chem_formula 判题 | **C** | 化学专有 |
| LocalGenerator 模板与 chem KB 绑定 | **C** | 不直接复用代码 |
| 试运行 test pool + grant | **C/可选 B** | 产品策略可选，非必须 |
| 生成器 confirm 即 approved | **D** | 数学应加强审核/程序校验分离 |
| 学情无历史专项快照 | **D** | 数学宜会话内固化维度 |
| 无提示后正确率字段 | **D** | 数学若需要须建模 |
| 无严格 KP 掌握度 | **D** | 勿假装已有 |
| 出题器自称 AI 但主路径非 DeepSeek | **D** | 文档/产品勿混淆；数学若用 DeepSeek 须显式设计 |
| nginx 白名单 | **D** | 新前缀必改（见 P0-01） |
| 通用错题本 | **A/B 视产品** | 手录错题可 A；训练自动错题建议 B 专项表 |

---

## 10. 数学专项需要避免的问题

1. **照搬化学本体表**（元素/反应等）——边界应对齐「模块模式」而非表结构复制。  
2. **用 LLM 做最终对错**——化学训练判题是程序；数学更应坚持确定性计算。  
3. **生成即 approved**——审核与程序校验应真正分离。  
4. **把训练错题写入 `error_questions`**——字段与自动回放模型不匹配。  
5. **假设化学已有知识点掌握度/提示后正确率**——当前未实现。  
6. **忽略会话题目快照**——改题库会污染历史分析（化学已注明该风险）。  
7. **漏改 nginx 路径白名单**。  
8. **混淆「DeepSeek 审计文档」与「在线生成 API」**。  
9. **saveAnswer 无历史版本**——若数学要「多次尝试计分」，需新设计，不能假设化学已支持。  
10. **为修数学去改化学业务**——违反 math-development 规则。

---

## 11. 关键代码路径索引

### API

- `apps/api/src/chemistry/chemistry.module.ts`
- `apps/api/src/chemistry/chemistry.controller.ts` / `chemistry.service.ts`
- `apps/api/src/chemistry/kb/*`
- `apps/api/src/chemistry/train/chem-train.*`
- `apps/api/src/chemistry/train/chem-train-grade.ts`
- `apps/api/src/chemistry/train/chem-daily-review.*`
- `apps/api/src/chemistry/train/chem-wrong-question.*`
- `apps/api/src/chemistry/train/chem-analytics.*`
- `apps/api/src/chemistry/train/chem-advanced-train.*`
- `apps/api/src/chemistry/train/chem-learning-home.*`
- `apps/api/src/chemistry/train/generator/*`
- `apps/api/src/chemistry/train/entities/*`
- `apps/api/src/chemistry/train/train.constants.ts`

### Web

- `apps/web/src/views/chemistry/*`
- `apps/web/src/views/settings/chemistry/*`
- `apps/web/src/api/chemistry*.ts`
- `apps/web/src/router/index.ts`
- `apps/web/src/layouts/AppLayout.vue` / `SettingsLayout.vue`

### DB

- `db/init.sql`（`chem_*` 段）

### 公共

- `apps/api/src/auth/*`（JwtAuthGuard、AdminGuard、CurrentUser）

---

## 附录：能力存在性速查

| 能力 | 状态 |
|------|------|
| 化学独立 Nest Module | 存在 |
| 训练会话 CRUD + 提交幂等 | 存在 |
| 程序判题（非 LLM） | 存在 |
| 专项错题表与通用错题本打通 | **当前未发现** |
| `next_review_at` 字段（化学错题/每日） | **当前未发现**（用间隔天数） |
| 知识点先修依赖引擎 | **当前未发现** |
| 学情缓存表 | **当前未发现** |
| 知识点掌握度统计 | **当前未发现**（有免责声明） |
| 在线 DeepSeek 训练出题 | **当前未发现**（本地模板生成器） |
| 生成异步队列 | **当前未发现** |
| KB 发布状态机 | 存在 |
| 训练题 approve 门控 | 存在 |

---

*文档结束（P0-02）。不自动进入 P0-03。*
