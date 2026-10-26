# P1-FUNC-CORE-0 · 第三章完整学习功能闭环 · 总体设计

> **性质**：设计文档（业务功能 **尚未实施**）  
> **约束**：本阶段未改业务代码、未写库、未迁移、未批准、未新增题目。  
> **库核对**：`study_system` · LAST_VERIFIED `2026-10-24T14:07:39.000Z`  
> **交接**：须同步 `PROJECT_HANDOFF.md`

---

## A. 项目当前状态

| 项 | 事实（只读核对） |
|---|---|
| 库 | `study_system` |
| train_items | draft **105**；disabled **5**；approved formal active **0** |
| CH01 | 80 题（draft） |
| CH03 PARITY | 25 题；难度 **16/7/2**；全 draft；reviews=0 |
| P0 测试题 | 5 disabled（不得恢复正式） |
| SOURCE_UPDATED_DB_PENDING | 已关闭（DIFF-2C） |
| 学生可练正式池 | **空** |
| 交接文件 | 与库一致（本阶段复验） |

教材范围（目录已有、本阶段 **不新增 KP**）：3.1–3.4 + 综合练习；3.4 仅保留目录。功能须 **跨章节可复用**，禁止写死第三章。

---

## B. 现有能力审计

### 已存在（可复用）

| 能力 | 关键路径 |
|---|---|
| 专项/小节 taxonomy | `taxonomy/*`；`HsMathSpecialty*` 视图 |
| 知识点 CRUD + 树 | `taxonomy/hs-math-knowledge*`；`admin/hs-math-admin-knowledge*` |
| 题库 CRUD / KP 关联 | `admin/hs-math-admin-train-items*`；`hs_math_train_item_kps` |
| 导入 preview/confirm | `hs-math-admin-train-items-import.service.ts`；`import-preview-token.ts` |
| 人工审核 + 批准门禁 | `hs-math-admin-train-item-reviews*`；`hs-math-review-gate.ts` |
| 专项训练会话 | `train/hs-math-train.service.ts`（仅 specialty + formal + approved） |
| 四题型判题 | `util/hs-math-grade.ts`；`HS_MATH_QTYPES` |
| 会话快照 + 脱敏 | `hs_math_train_session_items`；`session-item-view.ts` `reveal` |
| 历史 / 学情 / 首页 | `HsMathTrainHistory*`；`hs-math-analytics*`；`hs-math-home*` |
| KaTeX | `MathStem.vue` → `render-math.ts` |
| 三级难度展示 | `difficultyLabel`：基础/提高/压轴；API 仍 1/2/3 |
| 正确率口径 | `util/accuracy.ts`：`correct/(correct+wrong)`；pending 不计；0→null |
| session_kind 预留 | constants 含 daily/advanced/wrong_*；**业务未接** |
| 首页开关 | `dailyReviewAvailable:false` / `wrongBookAvailable:false`（不造假） |

### 缺失（NOT_IMPLEMENTED）

题目来源元数据；解题方法标签；增强解析/分步提示；`solution` 题型；数学错题本；每日巩固；掌握度；章节报告；多维筛题/压轴突破模式；test 池学生训练。

只读参考化学（**禁止改/禁复制表**）：`chem-wrong-*`、`chem-daily-review-*`、`chem-advanced-train-*`。

---

## C. 用户学习目标与功能闭环

目标用户约 120+ → 高考 140+：需基础巩固 + 综合提高 + **真实压轴思维**（非虚标 difficulty=3）。

目标闭环：

```
选 KP/模式 → 训练 → 反馈/提示 → 解析 → 错题 → 每日巩固 → 再练 → 掌握度 → 章节报告
```

本设计覆盖 CORE-1…6 的能力拼图；**实施必须分阶段**，不得一次落地。

---

## D. 三级难度与压轴训练设计

| difficulty | 展示 | 用途 |
|---:|---|---|
| 1 | 基础 | 概念/定义/一步应用 |
| 2 | 提高 | 多条件综合、常见模型 |
| 3 | 压轴 | 章节综合难题 **候选**；≠ 自动等于高考压轴 |

**禁止**第 4/5 级 difficulty。题库建设目标比例约 30/40/30，**不得为凑比例虚标**。

**压轴突破模式**额外标签（见 §F/§E，不改 difficulty 枚举）：

- `boss_value`: `none | chapter | gaokao_borderline | gaokao`（管理员标注；默认 none）
- `needs_construction` / `multi_case` / `proof_heavy`（布尔或位标志，可放 JSON `pedagogy_flags`）
- 题型含 `solution` 时优先进入压轴池

筛题：`difficulty=3` **AND**（`boss_value != none` OR 显式标签）— 避免 0022/0023 这类「章节综合」被当成高考压轴而不加说明。

学情：难度维度继续用 **session_items.difficulty 快照**（`hs-math-analytics.service.ts` 已声明）。

---

## E. 题目来源设计

### 字段（扩展 `hs_math_train_items`，CORE-1）

| 字段 | 说明 |
|---|---|
| `source_type` | `original` \| `adapted` \| `past_exam`；默认 `original` |
| `source_year` | 可空 INT |
| `source_exam_name` | 可空；试卷名 |
| `source_question_no` | 可空 |
| `source_ref` | 可空；出版/链接（管理员可见） |
| `source_adapt_note` | 改编说明 |
| `source_verify_status` | `unverified` \| `verified` \| `rejected` |
| `source_license_status` | `unknown` \| `permitted` \| `restricted` \| `forbidden` |

### 规则

- **禁止编造出处**；`past_exam`/`adapted` 须 `verified` 才可进入批准门禁加严检查（建议：license≠permitted → **禁止 approve** 或强制 pool=test）。
- 学生端默认只显示粗粒度：`原创` / `改编（已核实）` / `真题风格训练题`；**不展示**敏感链接。
- 导入：新字段可选；缺省 original + unverified + unknown。
- **指纹**：`source_*` 中影响教学诚信的（type/year/exam/no/adapt_note）纳入 canonicalize；license/verify 亦纳入（防「未核可却显示真题」绕过审核）。

---

## F. 方法标签设计

**取舍**：新建独立表（对标 KP），**不**混入 `hs_math_knowledge_points`。

| 表 | 用途 |
|---|---|
| `hs_math_methods` | code/name/summary/sort/is_active；**全局可复用跨章** |
| `hs_math_train_item_methods` | item_id + method_id + is_primary + sort_order |

理由：方法生命周期 ≠ 教材 KP；需管理端维护、筛题、报告统计；多对多与主方法标记与 KP 同构，复用交互模式。

**指纹**：方法 code 列表 + primary 纳入指纹（教学实质变更 → 旧 passed STALE）。

种子方法示例（实施时种子，本阶段不写库）：定义法、数形结合、分类讨论、函数构造、换元、配方、待定系数、反证、特殊值、参数分析、单调性、奇偶性、对称性、函数与方程、等价转化、整体代换。

---

## G. 增强解析设计

### 存储

扩展 `hs_math_train_items`：

- 保留 `analysis`（基础解析，兼容旧题）
- 新增 `pedagogy_json` JSON NULL：

```json
{
  "breakthrough": "...",
  "hints": [{ "level": 1, "text": "...", "leaksAnswer": false }],
  "commonMistakes": ["..."],
  "altSolutions": [{ "title": "...", "body": "..." }],
  "compareNote": "...",
  "keySteps": ["..."],
  "methodTransfer": "..."
}
```

### 可见性（对齐 `toStudentSessionItemView`）

| 时机 | 可返回 |
|---|---|
| in_progress / cancelled（reveal=false） | 仅 `hints` 中 `leaksAnswer=false`；**禁止** analysis / answer / altSolutions / keySteps |
| completed + reveal=true | 全量 pedagogy + analysis + answer |
| 提示点击 | `POST .../session-items/:id/hints/reveal` 写 `hint_use_count`（见下） |

### 会话扩展

`hs_math_train_session_items` 增：

- `pedagogy_json` 快照（创建会话时拷贝；历史不被题库后续修改覆盖）
- `hint_use_count` INT DEFAULT 0
- `hints_revealed_json` JSON（已揭示的 hint level 列表）

提示使用计入掌握度辅助信号，**不**引入通用事件总线。

### 指纹

`pedagogy_json` 规范化后纳入指纹；改增强解析 → version+1 → 旧审核 STALE。

---

## H. 数学解答题设计（qtype=`solution`）

### 原则

- **第一版无 AI 评分**；禁止字符串匹配「证明对错」。
- **不得**进入 `gradeHsMathAnswer` 客观题分支；未知/solution → 非 `correct/wrong` 自动结果。
- 自评枚举与客观结果 **隔离**。

### 建议枚举

客观（既有）：`correct | wrong | pending_review`

解答题自评（新，存 session_item）：

`not_self_assessed | self_assessed_mastered | self_assessed_partial | self_assessed_unmastered`

`grade_result` 对 solution：**固定** `pending_review` 或新增并列字段 `self_assess_status`（推荐 **独立字段**，避免污染正确率 SQL）。

推荐：`self_assess_status` + `self_assessed_at`；`grade_result` 对 solution 保持 null 直至策略明确（或恒为 `pending_review` 且 analytics **排除**）。

### 题库侧

- `answer_payload_json`：`{ kind:'solution', rubric:[{id,text,scoreHint}], referenceSolution, maxScoreHint }`
- 导入/校验：新 validator；旧四题型不变。

### 学生流程

1. 训练中：编辑区写过程（`user_answer_payload_json.kind='solution_draft'`，含 `stepsText`）
2. 可多次 PATCH 草稿（幂等覆盖）
3. 可请求不泄题 hint
4. 交卷后才 reveal 参考解 + rubric
5. 自评一次或允许有限次修改（建议：completed 后 24h 内可改一次，记 `self_assess_version`）
6. `unmastered`/`partial` → 进入错题本候选；`mastered` → 可降低每日权重；`not_self_assessed` → **不计入**掌握度分子分母

### 对判题器影响（Q4）

在 `HS_MATH_QTYPES` 增加 `solution`；`hs-math-grade.ts` 对 solution **短路**返回「不自动判」；抽题 SQL 按模式包含/排除；旧四题型路径不变。

---

## I. 专项训练设计

### 扩展创建会话 DTO（兼容旧字段）

新增可选：`knowledgePointIds[]`、`methodIds[]`、`qtypes[]`、`sourceTypes[]`、`trainMode`：`basic|raise|boss|custom`、`excludeItemIds`、`onlyWrong`、`weakKpOnly`。

旧客户端只传 specialty+category+difficulty → 行为不变。

### 模式预设

| 模式 | 默认筛选 |
|---|---|
| 基础巩固 | difficulty=1；优先概念类 KP |
| 综合提高 | difficulty=2 |
| 压轴突破 | difficulty=3 **且** boss 标签；优先 solution |
| custom | 用户全自选 |

用户可在预设上二次收紧；**不得**放宽到 draft。

### 空池与题量不足

- approved=0：明确文案「正式题池为空，请联系管理员审核批准」，禁止静默抽 draft。
- 不足 planned_count：返回 `actual_count < planned` + `shortageReason`（现有能力可沿用）。
- 去重：同用户近期 N 天做过的 item_id 降权/排除（CORE-3）。

验收（Q13）：使用 **pool=test** 或明确 `code` 前缀的受控测试题 + 管理员批准到 test 池；或临时 IT 流程；**禁止**擅自批准 25 道 formal draft。测完按引用清理。

---

## J. 数学错题本设计

**独立** `hs_math_*` 表；只读参考 chem；**不改**通用错题本。

| 表 | 要点 |
|---|---|
| `hs_math_wrong_items` | `(user_id, identity_key)` 唯一；identity_key = `item_code` 优先，辅以首次 session_item 快照哈希 |
| `hs_math_wrong_events` | 每 session_item 至多一条事件（幂等 `uk(session_item_id)`） |

字段建议：status open|consolidating|mastered；wrong_count；last_wrong_at；来源类型 objective_wrong | solution_unmastered | solution_partial；`last_session_item_id` 指向快照回放。

**item_id 可空**：回放一律读 `hs_math_train_session_items` 快照；当前题 disabled/删除仍可回放历史。  
所有查询强制 `user_id = JWT.sub`（ADMIN 也不越权看他人）。

交卷钩子：客观 `wrong` → 记错；solution 自评 unmastered/partial → 记错；再次正确/自评 mastered → 推进 consolidating（规则 CORE-4 细化）。

---

## K. 每日巩固设计

复用预留：`session_kind='daily'` + `daily_date`（Asia/Shanghai，`util/shanghai-date.ts`）。

| 表 | 用途 |
|---|---|
| `hs_math_daily_plans` | `(user_id, plan_date)` 唯一；生成规则版本；status |
| `hs_math_daily_plan_items` | 计划条目：指向 wrong_item 或 item_id + 快照 session_item 可选 |

**幂等（Q10）**：同用户同日 GET/POST 生成 → 已有 plan 则返回同一 plan_id，不重抽；完成态不再生。  
规则版 v1（可解释，无 AI）：错题权重 > 部分掌握解答题 > 久未复习 > 薄弱 KP；difficulty 混合；已掌握降权。  
题目不足：返回可做数量 + 引导去专项训练。禁用题跳过。

---

## L. 知识点掌握度设计

**第一版可不建表**：由 session_items + item_kps 聚合查询；样本大后再加 `hs_math_user_kp_stats` 缓存表。

三套指标（强制分离）：

1. **客观正确率**：`correct/(correct+wrong)`；pending 不计；分母 0→null（沿用 `accuracy.ts`）
2. **解答自评分布**：四态计数；**不进**客观正确率
3. **综合档位**（展示用，须标注「含自评、非纯客观」）：例如低样本（客观作答 <5）→ `insufficient_data`，禁止显示 100% 掌握

多 KP：一题按关联 KP 各计一次（或主 KP 权重 1.0、辅 0.5——实施时选定并写进 API 文档）。  
重复刷题：可用「最近 K 次」窗口降噪。

---

## M. 章节学习报告设计

新页 `/hs-math/specialties/:code/report` + `GET /hs-math/specialties/:code/learning-report`。

指标来源：sessions/session_items（user 隔离）+ wrong_items + daily_plans + KP 聚合 + method 关联统计。  
必须分开展示客观正确率 vs 解答自评；低样本角标；7/30 日趋势复用 analytics 模式。

---

## N. 最小数据库增量方案

### 扩展现有表

| 表 | 增量 |
|---|---|
| `hs_math_train_items` | source_*；pedagogy_json；boss_value 等 flags（或并入 pedagogy_json.meta） |
| `hs_math_train_session_items` | pedagogy_json 快照；hint_use_count；hints_revealed_json；self_assess_status；self_assessed_at；user solution draft 已有 user_answer 字段 |

### 建议新增表（控制数量）

1. `hs_math_methods`  
2. `hs_math_train_item_methods`  
3. `hs_math_wrong_items`  
4. `hs_math_wrong_events`  
5. `hs_math_daily_plans`  
6. `hs_math_daily_plan_items`  

可选延后：`hs_math_user_kp_stats`（CORE-5 若查询过慢再加）。

**合计约 +6 表**，避免表爆炸；禁止 chem_* / 第二库。

兼容：旧会话无新列 → NULL/默认；旧题 pedagogy/source 空 → 行为与现网一致；快照冻结历史。

迁移：后续阶段用户授权后改 `db/init.sql` + migrate SQL；本阶段 **不执行**。

---

## O. API 方案（摘要）

前缀 `/hs-math`；管理端 Jwt+Admin；学生 Jwt+user_id。

| 方法 | 路径 | 权限 | 写库 | 答案泄露 |
|---|---|---|---|---|
| CRUD | `/admin/methods` | Admin | 是 | — |
| PUT | `/admin/train-items/:id/methods` | Admin | 是+version | — |
| PATCH | `/admin/train-items/:id` 扩字段 | Admin | 是+指纹 | — |
| GET | `/train/sessions/:id/items/:iid` | 学生 | 否 | reveal 控制 |
| POST | `.../items/:iid/hints/reveal` | 学生 | hint 计数 | 仅非泄题 hint |
| PATCH | `.../items/:iid/answer` | 学生 | 草稿/作答 | 进行中不返标答 |
| POST | `.../items/:iid/self-assess` | 学生 | 自评 | 须已 completed |
| GET/POST | `/wrong-items` 等 | 学生 | 事件 | 回放用快照 |
| GET/POST | `/daily-plans/today` | 学生 | 计划幂等 | 训练中脱敏 |
| GET | `/knowledge-points/:code/mastery` | 学生 | 否 | 无标答 |
| GET | `/specialties/:code/learning-report` | 学生 | 否 | 无标答 |
| POST | `/train/sessions` 扩筛选 | 学生 | 会话 | 抽题不带标答 |

事务：交卷+错题写入同事务或可靠 outbox；每日计划插入唯一键防并发双份。

---

## P. 前端页面方案

| 需求 | 策略 |
|---|---|
| 训练设置 | **扩展** `HsMathTrainSetupView`（模式+筛选） |
| 会话/结果 | **扩展** `HsMathTrainSessionView` / Result；新组件 `MathSolutionEditor`、`MathHintPanel`、`MathRubricSelfAssess` |
| 错题本/回放 | **新页** + 复用 MathStem |
| 每日巩固 | **新页**；home shortcuts 改 true（功能就绪后） |
| 掌握度/报告 | **新页**或 analytics 子页；ECharts 复用 |
| 管理：来源/方法/增强解析/解答题 | **扩展** Admin 编辑弹窗 + 小管理页 Methods；审核台展示新字段 |
| 压轴突破 | Setup 模式入口，复用会话页 |

不重写整站；不改化学页。

---

## Q. 审核版本与指纹兼容

纳入指纹（改则 STALE）：stem/options/answer/analysis/**pedagogy_json**/difficulty/qtype/code/spec/cat/KP/**methods**/关键 source 字段。

**不**纳入指纹：纯用户学习表（wrong/daily/mastery 缓存）、hint_use_count（会话侧）。

`isSubstantiveTrainItemChange` 与 import canonicalize **同步扩展**；否则出现「内容变了 passed 仍有效」漏洞。

导入：旧 JSON 无新字段 → 默认值；新字段可选。

---

## R. 历史快照与用户隔离

- 会话项已快照 stem/answer/analysis/difficulty/KP；CORE 起并快照 pedagogy。  
- **禁止** UPDATE 历史 session_items 题面。  
- 所有 wrong/daily/mastery/report：**user_id=JWT**。  
- item_id ON DELETE SET NULL 已有；错题回放靠 code+session_item。

---

## S. CORE-1 → CORE-6 路线图

### CORE-1 元数据与增强解析（中复杂度）

前置：DIFF-2C 完成。  
DB：items 扩列；methods 两表。  
后端：指纹扩；admin API；导入兼容。  
前端：管理编辑；训练中 hint（不泄题）。  
测试：指纹变更→审核 STALE；reveal=false 无标答。  
验收：改 pedagogy 升 version；学生进行中看不到参考解。  
风险：指纹漏字段。回滚：迁移 down + 忽略新列。  
授权：迁移+写库。影响审核：是（新字段变更）。快照：新会话起生效。

建议拆：1A 来源+方法；1B pedagogy+hints。

### CORE-2 解答题（高）

前置：CORE-1B。  
DB：session_item 自评字段；qtype 扩。  
后端：grade 短路；草稿/自评 API。  
前端：编辑器+评分点。  
验收：solution 不进客观正确率。  
风险：枚举污染 analytics。授权：迁移。快照：草稿在 user_answer。

### CORE-3 专项筛选与三模式（中）

前置：有 **少量** approved 或 test 池验收策略。  
DB：可无新表。  
后端：扩展 create session。  
前端：Setup。  
验收：draft 不可抽；空池文案。  
风险：approved=0 无法真练 → 用 test 池。授权：可仅代码。

### CORE-4 错题本+每日（高）

前置：CORE-2/3。  
DB：wrong* + daily*。  
参考 chem 行为，自建 hs_math 表。  
验收：幂等事件；同日计划稳定；user 隔离。  
风险：item_id 空。授权：迁移。

### CORE-5 掌握度+报告（中）

前置：CORE-4 有数据更佳。  
DB：可选 stats 表。  
验收：低样本不显示假 100%；客观/自评分列。

### CORE-6 综合验收（中）

安全/性能/清理测试数据；题库扩充准备清单（须 CORE-1 元数据就绪后再扩 95 题更稳——见 Q16）。

---

## T. 风险清单

1. approved=0 → 学生功能难真验收（须 test 池策略）。  
2. 指纹漏扩 → 审核门禁被绕过。  
3. 自评混入正确率 → 学情失真。  
4. 提示泄题 → 破坏脱敏。  
5. 错题仅靠 item_id → 历史断裂。  
6. 表设计膨胀 → 坚持 §N 上限。  
7. 虚标压轴 → boss_value 强制。  
8. 真题许可 → license 门禁。

---

## U. 待用户授权事项

1. CORE-1 起的 **DB 迁移**（init.sql + migrate）。  
2. 任何 **批准** draft 题 / 写 reviews。  
3. 受控 **test 池** 验收题的创建与清理。  
4. 扩充剩余 95 题（另阶段）。  

本设计阶段 **不授权** 上述写入。

---

## V. 下一阶段实施建议

**建议下一阶段：CORE-1A**

- 迁移：source_* + methods 两表  
- 扩指纹与 admin 编辑  
- 不改学生训练主路径  
- 验收：导入兼容；改方法→version+1  

然后 CORE-1B（pedagogy/hints）→ CORE-2。

---

## W. Q1–Q16 逐项回答

**Q1 可复用**：taxonomy/KP/题库/导入/审核门禁/专项训练/四题型判题/快照脱敏/历史学情/KaTeX/三级难度/accuracy 口径/session_kind 与 home 开关预留。

**Q2 新表**：methods、item_methods、wrong_items、wrong_events、daily_plans、daily_plan_items；（可选）user_kp_stats。

**Q3 扩展表**：train_items（source/pedagogy/boss）；session_items（pedagogy 快照、hint、自评）。

**Q4 solution 破坏？**：否——独立分支，不进 `gradeHsMathAnswer` 自动 correct/wrong；旧四题型不变。

**Q5 自评隔离**：独立 `self_assess_status`；analytics 客观分母排除 solution；报告分列展示。

**Q6 提示不泄题**：hint.leaksAnswer=false 才允许 in_progress；完整解析仅 reveal=true；沿用 `session-item-view.ts`。

**Q7 增强解析改审核**：pedagogy 入指纹 + substantive → version+1 → passed STALE。

**Q8 旧导入**：新字段可选默认；旧 JSON 仍可 preview/confirm。

**Q9 item_id 空/删除**：错题 identity 用 item_code + 事件绑 session_item_id；回放快照。

**Q10 每日幂等**：`(user_id,plan_date)` 唯一；已存在则返回；完成不重生成。

**Q11 掌握度多KP/低样本**：多 KP 分计；作答<阈值 → insufficient_data；客观与自评分列。

**Q12 压轴真实性**：difficulty=3 仅必要条件；加 boss_value/标签；UI 区分「章节综合」vs「高考压轴训练」。

**Q13 验收**：formal approved=0 时用 **test 池受控题** 或显式测试 code；禁止擅自批准 25 draft；测后清理；不建第二库。

**Q14 管理维护**：扩展题编辑表单分区（来源/方法/增强解析/解答题评分点）；Methods 独立小页；审核台只读展示。

**Q15 防失控**：上限约 6 新表；能 JSON 则 JSON；掌握度先查询后缓存；分阶段 CORE。

**Q16 扩 95 题前优先**：CORE-1（来源+方法+增强解析结构）就绪，避免日后大批回填；CORE-2 若要写解答题再扩；**不**阻塞「先审先批现有 25 客观题」——可并行：人工审 25 客观题进池，与 CORE-1 元数据迁移分开授权。

---

## 附录 · 设计验收对照（§二十三）

1–18 条：本文件覆盖；**18/19**：未写库、未改业务代码。  
20：须更新 `PROJECT_HANDOFF.md`（与本交付同时完成）。
