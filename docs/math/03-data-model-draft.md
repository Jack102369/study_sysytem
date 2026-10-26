# P0-03 数学专项数据模型草稿（逻辑模型）

> 对齐 `db/init.sql` 惯例：`BIGINT UNSIGNED` PK、公共表无 `user_id`、用户表有 `user_id`、JSON 存结构化扩展、手工 migrate。  
> **本阶段不生成最终 DDL。**

约定：

- TS/API 层 bigint → `string`
- 时间：`DATETIME(3)`；复习日程用业务时区 **Asia/Shanghai** 日期语义
- 删除：用户行 `ON DELETE CASCADE`；内容被引用优先 `RESTRICT` 或软归档

---

## 1. 实体总览

### 1.1 公共内容（无 user_id）

| 逻辑实体 | 建议表名 | 用途 |
|----------|----------|------|
| KnowledgePoint | `math_knowledge_points` | 知识点 |
| KnowledgeDependency | `math_knowledge_dependencies` | 前置知识 |
| QuestionTemplate | `math_question_templates` | 题目模板（模型+参数模式） |
| Question | `math_questions` | 具体题目 |
| QuestionModel | `math_question_models` | 题↔数学模型绑定与参数实例 |
| TeachingScript | `math_teaching_scripts` | 教学步骤文案/结构 |
| AnimationScene | `math_animation_scenes` | MASP 文档（已校验） |
| VideoAsset | `math_video_assets` | 已登记视频元数据 |

### 1.2 生产任务（公共或系统级，操作者可记 admin id）

| 逻辑实体 | 建议表名 | 用途 |
|----------|----------|------|
| GenerationJob | `math_generation_jobs` | AI/流水线任务 |
| RenderJob | `math_render_jobs` | 视频渲染任务 |

### 1.3 用户学习（必有 user_id）

| 逻辑实体 | 建议表名 | 用途 |
|----------|----------|------|
| TrainingSession | `math_training_sessions` | 训练会话 |
| TrainingItem | `math_training_items` | 会话内题目实例+快照 |
| AnswerAttempt | `math_answer_attempts` | 每次作答（追加） |
| LearningEvent | `math_learning_events` | 提示/动画/变式等事件 |
| Mistake | `math_mistakes` | 专项错题索引 |
| MasteryRecord | `math_mastery_records` | 知识点掌握度 |

---

## 2. 公共内容详细设计

### 2.1 `math_knowledge_points`

| 字段建议 | 说明 |
|----------|------|
| id | PK |
| code | 稳定业务码，唯一 |
| name, description | |
| grade | 1/2/3（一期主 2） |
| topic | 专题枚举/字符串 |
| difficulty | 1–n |
| status | draft / pending_review / published / archived |
| content_version | 内容版本号 |
| supported_model_types_json | 支持的数学模型类型列表 |
| supported_animation_templates_json | 动画模板 id 列表 |
| created_at / updated_at | |

**唯一**：`uk_math_kp_code (code)`  
**索引**：`(grade, topic, status)`

### 2.2 `math_knowledge_dependencies`

| 字段 | 说明 |
|------|------|
| id | PK |
| knowledge_point_id | 当前 KP |
| prerequisite_id | 前置 KP |
| dependency_type | required / recommended |

**唯一**：`(knowledge_point_id, prerequisite_id)`  
禁止自环；应用层检测环。

### 2.3 `math_question_templates`（模板 ≠ 题目）

| 字段 | 说明 |
|------|------|
| id, code | code 唯一 |
| model_type | 如 `transfer_equalize`（移多补少） |
| param_schema_json | 参数定义 |
| param_constraints_json | 约束 |
| solver_key | math-core 注册名 |
| variation_types_json | 支持变式类型 |
| grade_span_json | 适用年级 |
| status, content_version | |
| created_at / updated_at | |

### 2.4 `math_questions`（具体题目）

| 字段 | 说明 |
|------|------|
| id, code | code 唯一 |
| template_id | FK → templates，RESTRICT |
| stem_text | 题干 |
| answer_payload_json | **程序求解结果**（结构化，非仅字符串） |
| grade, difficulty | |
| knowledge_point_id | 主 KP（快照来源） |
| model_type | 冗余便于查询 |
| content_version | |
| lifecycle_status | GENERATED / MATH_VALIDATED / TEACHING_VALIDATED / REVIEW_PENDING / APPROVED / PUBLISHED / REJECTED |
| review_note, reviewed_by, reviewed_at | |
| published_at | |
| created_by / updated_by | 可空 admin |

**禁止** AI 直接写 `answer_payload_json` 为未经验证值；入库前必须 math-core 填充。

### 2.5 `math_question_models`

题与模型参数实例（一题可一主模型）：

| 字段 | 说明 |
|------|------|
| id | |
| question_id | UK 可一对一 |
| model_type | |
| params_json | 实例参数（如 a=18,b=12,transfer=3） |
| derived_json | 求解中间量（如最终两边 15） |

### 2.6 `math_teaching_scripts` / `math_animation_scenes`

| 表 | 关键字段 |
|----|----------|
| teaching_scripts | question_id, script_version, steps_json, status |
| animation_scenes | question_id 或 script_id, masp_version, masp_json, checksum, status |

`masp_json` 必须通过 protocol Schema；存库前校验。

### 2.7 `math_video_assets`

| 字段 | 说明 |
|------|------|
| id | |
| question_id / scene_id | |
| storage_class | public / private |
| path_or_url | public 才可 uploads 相对路径 |
| duration_ms, checksum | |
| review_status | pending / approved / rejected |
| published | bool |

---

## 3. 训练模型（重点）

### 3.1 三者分离

| 概念 | 表 | 说明 |
|------|-----|------|
| 模板 | `math_question_templates` | 可生成多题 |
| 题库题 | `math_questions` | 可发布内容 |
| 训练实例 | `math_training_items` | **会话级快照**，判题与统计只信快照 |

### 3.2 `math_training_sessions`

| 字段 | 说明 |
|------|------|
| id | PK AI |
| user_id | 必填，索引 |
| session_kind | specialty / daily / mistake_review / variation |
| status | `in_progress` / `completed` / `cancelled` |
| grade_filter, topic_filter | 可空 |
| planned_count, actual_count | |
| started_at, submitted_at | |
| duration_ms | |
| stats_json | 结束时固化：独立正确数、提示后正确数等 |
| client_request_id | 可选幂等建会话 |

**唯一建议**：`(user_id, client_request_id)` 在 request_id 非空时唯一。  
**索引**：`(user_id, status, started_at)`；`(user_id, session_kind, started_at)`

**恢复未完成**：查询 `user_id + status=in_progress`；产品可限制同时仅 1 个 in_progress（应用层）。

**结束条件**：用户提交结束；或全部 item 达终态且调用 complete；取消 → cancelled。  
**幂等 complete**：已 `completed` 则返回同一结果。

### 3.3 `math_training_items`

| 字段 | 说明 |
|------|------|
| id | |
| session_id | FK CASCADE |
| sort_order | |
| question_id | 可空（纯生成题）但建议有 |
| source_item_id | 变式关联原 item |
| item_status | `pending` / `active` / `answered` / `hinted` / `animated` / `resolved` / `skipped` |
| **快照** stem_snapshot | |
| **快照** answer_payload_snapshot_json | |
| **快照** knowledge_snapshot_json | id/code/name/grade 等 |
| **快照** model_params_snapshot_json | |
| **快照** template_code / model_type | |
| variation_of_question_id | 可空 |
| first_independent_attempt_id | 可空 FK attempts |
| final_grade | correct / wrong / partial / unknown |
| resolved_at | |

**唯一**：`(session_id, sort_order)`

### 3.4 `math_answer_attempts`（追加，不覆盖）

| 字段 | 说明 |
|------|------|
| id | |
| training_item_id | FK CASCADE |
| user_id | 冗余隔离 |
| attempt_no | 从 1 递增 |
| answer_payload_json | 学生作答 |
| grade_result | correct / wrong / partial / invalid |
| grade_detail_json | 逐步比对 |
| context_tag | `independent` / `after_hint` / `after_animation` / `variation` |
| hint_level | 0=无 |
| is_first_independent | bool |
| created_at | |
| idempotency_key | 可选 |

**唯一**：`(training_item_id, attempt_no)`；`(training_item_id, idempotency_key)` 当 key 非空。

### 3.5 `math_learning_events`

| 字段 | 说明 |
|------|------|
| id | |
| user_id, session_id, training_item_id | |
| event_type | hint_shown / animation_started / animation_completed / variation_spawned / session_completed / … |
| payload_json | |
| created_at | |

用于学情与掌握度，不替代 attempts。

---

## 4. 错题 `math_mistakes`

| 字段 | 说明 |
|------|------|
| id | |
| user_id | |
| question_id | 题库题（稳定） |
| active | 是否当前活动错题 |
| wrong_count | |
| first_wrong_at, last_wrong_at | |
| next_review_at | **显式日程**（化学无此列，数学一期采用） |
| mastery_status | open / consolidating / mastered（或与四级对齐映射） |
| last_training_item_id | 可空 |
| content_version_at_mistake | 出错时题目版本 |

**唯一**：活动错题 `(user_id, question_id)` WHERE active=1（可用唯一键 + active，或应用保证单行更新）。  
**索引**：`(user_id, next_review_at)`、`(user_id, mastery_status)`

不写 `error_questions`。

---

## 5. 掌握度 `math_mastery_records`

| 字段 | 说明 |
|------|------|
| id | |
| user_id | |
| knowledge_point_id | |
| status | NOT_STARTED / LEARNING / BASIC_MASTERED / STABLE_MASTERED |
| rule_version | 如 `v1` |
| metrics_json | 独立正确率、提示依赖率、变式率、间隔结果、有效次数 |
| sample_size | |
| last_calculated_at | |
| kp_code_snapshot | 防改名漂移 |

**唯一**：`(user_id, knowledge_point_id, rule_version)`  
可重算：同 version 覆盖 metrics；升 version 保留旧行或归档。

**规则要点（v1 草案）**：

- STABLE_MASTERED：需多次**独立**正确 + 至少一次间隔复习独立正确 + 变式达标；样本不足保持 LEARNING
- 单题正确 ≠ STABLE
- 提示后正确不计入「独立正确率」分子

---

## 6. 复习逻辑（规则驱动，可配置）

配置建议放 `math-core` 常量/JSON（可测），非写死散落 Service。

| 信号 | 对 next_review_at 的影响（示例策略） |
|------|--------------------------------------|
| 首次独立错误 | 短间隔（如 +1 天）写入 mistakes |
| 提示后正确 | 间隔略长于纯错误，但短于独立正确 |
| 动画后正确 | 同上或稍长 |
| 数值/情境变式独立正确 | 延长间隔 |
| 间隔复习独立正确 | 显著延长；推动掌握度 |
| 再次独立错误 | 缩短间隔，wrong_count++，status 回退 |

**任务产生**：每日进入复习页时，查 `next_review_at <= today` 的 mistakes + 策略补题；生成 `session_kind=daily|mistake_review`。  
**防重复**：同一 user 同一 question 同一自然日已完成复习会话则跳过（唯一或查询）。  
**历史**：即 training_sessions/items/attempts，不另造平行真相源。

---

## 7. 生成与渲染任务

### 7.1 `math_generation_jobs`

| 字段 | 说明 |
|------|------|
| id | |
| idempotency_key | UK |
| knowledge_point_id / template_id | |
| status | queued / running / succeeded / failed / cancelled |
| stage | 流水线阶段枚举 |
| request_json / result_json | |
| error_message | |
| attempt_count | |
| created_by | admin |
| created_at / updated_at | |

### 7.2 `math_render_jobs`

| 字段 | 说明 |
|------|------|
| id | |
| idempotency_key | UK |
| scene_id / question_id | |
| status | queued / leased / running / succeeded / failed / dead |
| lease_owner, lease_until | 抢占与租约 |
| attempt_count, max_attempts | |
| output_path | private 路径 |
| log_path | |
| created_at / updated_at | |

超时：lease 过期可被其他 Worker 抢回。

---

## 8. 状态模型汇总

| 对象 | 状态 |
|------|------|
| 题目 lifecycle | GENERATED → MATH_VALIDATED → TEACHING_VALIDATED → REVIEW_PENDING → APPROVED → PUBLISHED（可 REJECTED） |
| 会话 | in_progress / completed / cancelled |
| 训练 item | pending → active → … → resolved |
| 掌握度 | 四级 |
| 渲染任务 | queued → leased → running → succeeded/failed/dead |

---

## 9. 外键与删除策略（摘要）

| 关系 | 策略 |
|------|------|
| session → items → attempts | CASCADE |
| question ← training_item.question_id | SET NULL 或保留 id + 快照（推荐保留 id + 快照，删题 RESTRICT） |
| template ← question | RESTRICT |
| user 删除 | 用户学习表 CASCADE |

---

## 10. 可能额外表（可选）

| 表 | 必要性 |
|----|--------|
| `math_hint_templates` | 若提示结构化复用多题 |
| `math_review_rules` | 若规则要运营可配入库（一期可用代码配置） |
| `math_feature_quotas` | 若 AI 日限额与现有分离 |

一期可不建；需要时再 migrate。

---

*文档：`docs/math/03-data-model-draft.md`*
