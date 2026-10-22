# 高一化学知识库 · AI 上下文进度

> 供后续会话快速对齐。本文件记录建设/质检进度，**不是**人工审核证书。  
> 更新日期：2026-10-20

---

## 当前阶段

| 阶段 | 状态 |
|------|------|
| Batch2–6 知识建设 + 各批整改 | 已完成 |
| 377 条全库核验 + 第一轮整改 | 已完成 |
| 训练引擎第一阶段 | 已完成（基础框架） |
| DeepSeek 初审（358 pending） | 已完成 → PASS 239 / HOLD 118 / REJECT 1 |
| DeepSeek 第二轮复核（239） | 已完成 → READY 119 / VERIFY 109 / FIX 11（未写库） |
| AI 试用发布 + 本地规则出题 | 已完成（可回滚测试） |
| **化学式显示 / 输入 / 判题** | **已完成**（`answer_type=chem_formula`） |
| **题库容量审计与扩充方案** | **已完成（只读）** |
| **本地规则出题器阶段 A** | **已完成** |
| **594 题全量质量审查（只读）** | **已完成** |
| **题库整改 + AI试运行准入优化** | **已完成** → 见下节 |
| **个人试运行开放（授权 USER）** | **已完成** → 见下节 |
| **每日10分钟基础巩固** | **已完成** → 见下节（已支持 `[daily:exclude]`） |
| **提高/挑战题型模型体系（第一阶段）** | **已完成** → 见下节 |
| **第一批60道提高/挑战样题** | **已完成并入库试运行** → 见下节 |
| **提高与挑战训练入口** | **已完成** → 见下节 |
| **旧题解析质量扫描 + 首批50样本** | **已完成** → 见下节 |
| **首批48道解析安全更新（analysis）** | **已完成写库** → 见下节 |
| **第二批解析升级 Phase1（~120）** | **已完成**（计划/干跑）→ 见下节 |
| **第二批116道解析安全更新（analysis）** | **已完成写库** → 见下节 |
| **残缺题干风险处置（26 核验）** | **已完成**（13 block）→ 见下节 |
| **剩余旧题解析全面升级 Phase1** | **已完成**（计划/干跑）→ 见下节 |
| **剩余377道解析安全更新（analysis）** | **已完成写库** → 见下节 |
| **错题中心第一阶段** | **已完成** → 见下节 |
| **错题中心第二阶段（变式+方法总结）** | **已完成** → 见下节 |
| **学习中心首页与每日流程整合** | **已完成** → 见下节 |
| **学习分析看板** | **已完成** → 见下节 |
| 本地规则阶段 B（参数化/挑战/空分类映射） | **未开始**（待确认） |
| 人工学科审核 / 正式对学生开放 | **未开始**（正式池仍 0） |
| OCR / AI 出题 / AI 老师 / 积分 | **未开发** |
| 方程式 / 离子式 / 计算专用判题 | **未开发**（仅预留 answer_type） |
| AI 错因诊断 / 实时变式 | **未开发** |

---

## 产品定位

- 专项技能训练中心（非教材章节课）
- 实验专项 = **书面题目训练**
- 正式自动出题：**禁止**使用 pending_review / verifyNeeded / question 骨架 / 未准入题

---

## 学习分析看板（2026-10-20）

> **图表必须有真实数据；专项/难度按题目当前归属（非答题时快照），页面明示，不静默伪装。**

- 报告：`docs/CHEMISTRY_ANALYTICS_REPORT.md`
- 路由：`/chemistry/analytics`；首页「学习分析」入口
- 接口：`GET /chemistry/train/analytics?days=7|30`（日历固定 30 天）
- 图表：活跃度、练习量+正确率趋势、各专项近期答题表现（横向柱）、难度分组柱、错题环形、高频错误专项、轻量建议
- 口径：Asia/Shanghai；已提交；练习题次需作答+判题；正确率 correct/(correct+wrong)；pending 不进分母
- 错题状态复用 wrong.summary；建议复用 availability + due
- **未做**：session_items 专项/难度快照迁移、雷达图、AI 建议
- 冒烟：`node docs/chemistry_analytics/smoke_test.js` → **26/26 PASS**（`chem_analytics_smoke@local.test`）

### 下一步建议（待指令）

1. 可选：为 `session_items` 增加专项/难度快照列（仅新会话）  
2. 知识链接回填 / 正式池建设  

---

## 学习中心首页与每日流程整合（2026-10-20）

> **建议路径 ≠ 强制锁定；首页统计复用 daily/wrong/advanced，不另起一套规则。**

- 报告：`docs/CHEMISTRY_LEARNING_HOME_REPORT.md`
- 接口：`GET /chemistry/train/learning-home`（JWT，按登录用户）
- 首页四区：今日状态 / 今日任务（每日→错题→变式→提高挑战）/ 今日与近7天概览 / 全部功能入口
- daily 阶段：`not_started` | `in_progress`（继续原会话）| `completed`（可再次练习）
- 错题：`/chemistry/wrong-questions?focus=due` → 真实 `dueToday=1` 筛选
- 提高挑战推荐：按薄弱专项调用 `advanced.availability` 验真实可练量；URL `?specialty=&mode=` 预选
- 结果页「接下来建议」：按 `session_kind` 可点击；`wrong_variation` 仅可靠 `sourceWrongItemId` 才回详情
- 统计：Asia/Shanghai；`submitted_at`；练习题次需作答+判题；正确率仅 correct+wrong；mastered 标「当前已掌握错题」
- 冒烟：`node docs/chemistry_learning_home/smoke_test.js` → **24/24 PASS**（`chem_learning_home_smoke@local.test`）
- **未做**：错题一键组卷新接口、正式积分/掌握度、DB 迁移

### 下一步建议（待指令）

1. 知识链接回填以提高变式命中  
2. 正式池建设 / 人工审核  
3. 可选：跨日 24:00 边界人工挂测  

---

## 错题中心第二阶段（2026-10-20）

> **变式来自题库匹配 ≠ AI 生成 ≠ 放宽到仅同分类/同专项。**

- 报告：`docs/CHEMISTRY_WRONG_QUESTION_PHASE2_REPORT.md`
- 迁移：`db/migrate_chemistry_wrong_question_phase2.sql`（`wrong_variation`；`source_wrong_item_id`）
- 详情：`methodSummary` + `variationPreview`；按钮「开始变式训练」5/10/20
- API：`POST /chemistry/train/wrong-questions/:id/variation-practice`
- 匹配档：同知识+同模型 → 同知识+相关模型（目录 KP/能力）→ 同知识不同情境 → 同分类+模型技能证据；**拒绝**仅同专项/仅同分类/仅 ADV 前缀；`knowledge_point`≠`knowledge` 不同实体
- 模型目录：只读 `docs/chemistry_advanced_model/models_catalog.json`（45）；读失败安全退化
- 变式结果更新变式题自身错题状态，**不改写**来源错题；不计每日完成
- 现状：许多 s60/旧题 0 链接或孤立模型 → 常无变式（少出/提示，不凑数）
- 冒烟：`node docs/chemistry_wrong_question/smoke_phase2.js` → **27/27 PASS**（`chem_wrong_p2_smoke@local.test`）

### 下一步建议（待指令）

1. 回填知识链接以提高变式命中  
2. 单题原题复练专用接口  
3. 可选持久化 `model_id` 列  

---

## 错题中心第一阶段（2026-10-20）

> **错题索引可重建 ≠ 改历史判题 ≠ 知识点已掌握 ≠ AI 诊断。**

- 报告：`docs/CHEMISTRY_WRONG_QUESTION_PHASE1_REPORT.md`
- 迁移：`db/migrate_chemistry_wrong_question_phase1.sql`（`chem_wrong_items` / `chem_wrong_events`；`session_kind` 含 `wrong_review`）
- 入口：`/chemistry` →「我的错题」→ `/chemistry/wrong-questions`
- API：`/chemistry/train/wrong-questions`（summary / list / weak-stats / :id / practice / rebuild）
- 事实来源：训练快照；主表+事件为幂等可重建索引；submit 钩子失败不回滚训练
- 状态：`open` / `consolidating` / `mastered`（仅题目；错后≥2次明确正确且≥2 session 且上海自然日间隔≥3 → 已掌握；再错回待攻克）
- **今天建议复习**：待攻克全部；巩固中距上次明确正确≥2 自然日；已掌握默认不进
- `pending_review` 不参与流转；全 session_kind（含空）均参与明确对/错
- 复练：5/10/20；eligibility+grants；不足少出；**不计每日完成**；不改积分/掌握度
- 冒烟：`node docs/chemistry_wrong_question/smoke_phase1.js` → **21/21 PASS**（隔离账号 `chem_wrong_smoke@local.test`）

---

## 化学式输入与判题（最新）

- 报告：`docs/CHEMISTRY_FORMULA_INPUT_GRADING_REPORT.md`
- 迁移：`db/migrate_chemistry_train_answer_type.sql`
- `chem_train_items.answer_type`：`text`（默认）| `chem_formula`（预留 equation/ionic/numeric）
- 会话快照 `answer_type`；新提交可写 `grade_reason`
- 规则：`H2O`≡`H₂O`；`h2o`→**wrong**（非待复核）；普通 text 填空逻辑不变
- 显示：下标/电荷上标；反应系数不下标
- 历史 `grade_result` **不重评**

---

## AI 试用发布（可回滚）

> **声明：试用发布 ≠ 人工审核通过 ≠ 正式对学生上线。**

- 报告：`docs/CHEMISTRY_AI_TRIAL_TRAINING_REPORT.md`
- 备份：`docs/chemistry_trial_restore/` + `RESTORE.md`
- 回滚：`node docs/chemistry_trial_restore/restore.js`
- **239** 条白名单：`status=published` + `[ai_trial]…`
- 学生 KB 排除 ai_trial；正式 approved 题仍为 **0**
- 管理员 / 授权 USER：「个人试运行训练」（原 AI 试运行池）

### 下一步（待指令）

1. 人工审核 kb_pending 来源知识与 VERIFY 题  
2. 勿对普通学生默认开放正式训练；勿 OCR / 积分 / AI 老师  
3. **阶段 B / 正式池发布** 须用户确认  

---

## 个人试运行开放（2026-10-19）

> **个人试运行 ≠ 正式上线 ≠ 人工审核完成。**

- 报告：`docs/CHEMISTRY_PERSONAL_TRAINING_OPEN_REPORT.md`
- 备份：`docs/chemistry_personal_open/backup_2026-10-19T12-05-04-451Z/`  
  恢复：`node docs/chemistry_personal_open/restore_backup.js <backup_dir>`
- 清理：物理删除 **16**（无引用 filler/无来源）；永久停用 **4**（有历史引用）
- 题库：**594 → 578**；个人可训练 **574**；formal **0**
- 授权：`chem_train_test_grants` + 用户管理「化学试运行」；已授权 USER `dhm@189.cn`
- 入口：学习工具 → 高一化学 → 专项 → 设置「个人试运行训练」；页内提示 AI 初审未完人审
- filler 脚本 `expand_all_specialties.js`：**永久禁用**
- 一级专项有题 **12/12**；二级分类有题 **34/137**（不凑数）

---

## 每日10分钟基础巩固（2026-10-19）

> **每日巩固 ≠ 正式考试 ≠ 人工审核完成。**

- 报告：`docs/CHEMISTRY_DAILY_REVIEW_REPORT.md`
- 迁移：`db/migrate_chemistry_daily_review.sql`（`session_kind` / `daily_date`；daily 会话专项/分类可空）
- 入口：`/chemistry` →「每日10分钟」→ `/chemistry/daily`
- API：`/chemistry/train/daily/status|sessions|history|sessions/:id/insight`
- 组卷：目标 10 题；约 8 基础 + 2 提高；错题知识→久未练→随机（软比例）；近 7 天去重降权
- 「今日」：`Asia/Shanghai`；用时=开始到提交经过时间
- 复用试运行题 + grants；不建假专项；专项历史排除 daily
- **组卷排除** `gate_note` 含 `[daily:exclude]` 的题（通用机制；s60 本批已打标）
- 冒烟：`docs/chemistry_daily_review/smoke_test.js`；s60 入库后每日可抽量仍为 **574**
- 提高与挑战入口的 `advanced` 会话**不计入**每日完成次数（见上节）

### 下一步建议（待指令）

1. 按模型扩量（目标仍指向约 500，不自动正式池）；新难题继续打 `[daily:exclude]`  
2. 完善 `numeric` 等判题后再投产 NEEDS_ENGINE 模型  
3. 人工审核 VERIFY / kb_pending / 本批 s60  
4. 阶段 B 生成器对接模型 ID（须确认）  

---

## 首批48道解析安全更新（2026-10-20）

> **已写入 analysis ≠ 人工终审证书 ≠ 剩余500+题已升级。**

- 报告：`docs/CHEMISTRY_ANALYSIS_FIRST_UPDATE_REPORT.md`
- 白名单 48：仅 `chem_train_items.analysis`；原值校验 + 事务；冲突 0
- 排除：**215、250**（题干残缺/过空，未改题干/答案/准入）
- 幂等：复查 UPDATED 0 / SKIP 48
- 旧会话快照保留原文；新会话显示新解析（隔离用户冒烟 ok）
- 题库 **638** / 可训练 **634** / formal **0** / 每日 cand **574** / s60 **60** 不变
- 回滚：`node docs/chemistry_analysis_upgrade/rollback_first_update.js`
- 备份：`docs/chemistry_analysis_upgrade/first_update_backup/`

---

## 第二批116道解析安全更新（2026-10-20）

> **已写入 analysis ≠ 人工终审证书 ≠ HOLD四题已处理 ≠ 残缺题已修题干。**

- 报告：`docs/CHEMISTRY_ANALYSIS_BATCH2_UPDATE_REPORT.md`
- 白名单 **116**：仅 `chem_train_items.analysis`；原值校验 + 事务；冲突 **0**
- 不含：首批48、s60、13 道 stem-block、HOLD(50/379/398/401)
- 幂等：UPDATED 0 / SKIP 116
- 旧会话快照保留；新会话显示新解析（隔离冒烟 ok）
- 题库 **638** / 可训练 **621** / formal **0** / 每日 cand **561** / s60 **60**
- 回滚：`node docs/chemistry_analysis_upgrade/batch2/rollback_batch2_update.js`
- 备份：`docs/chemistry_analysis_upgrade/batch2/batch2_backup/`
- 遗留：HOLD 50/379/398/401 仍 NEEDS_VERIFICATION（未改）

---

## 第二批解析升级 Phase1（2026-10-20）

> 计划与干跑记录；入库结果见上一节。

- 报告：`docs/CHEMISTRY_ANALYSIS_BATCH2_PLAN_REPORT.md`
- 选样 **120**；终检白名单 **116**；HOLD **4**
- 产物：`docs/chemistry_analysis_upgrade/batch2/`

---

## 残缺题干风险处置（2026-10-20）

> **已对 13 道 CONFIRMED_BLOCK 写入 trial_access:block ≠ 已修题干。**

- 报告：`docs/CHEMISTRY_QUESTION_STEM_RISK_FIX_REPORT.md`
- 核验 26 道：CONFIRMED_BLOCK **13** / FALSE_POSITIVE **13**
- 215、250 已 block；50/379/398/401 题层另见剩余升级报告
- 题库 **638** / formal **0** / 可训练 **621** / 每日 cand 约 **561** / s60 **60**
- 回滚：`node docs/chemistry_analysis_upgrade/batch2/stem_risk_review_and_block.js --rollback`
- 备份：`docs/chemistry_analysis_upgrade/batch2/stem_risk_block_backup/`

---

## 剩余377道解析安全更新（2026-10-20）

> **已写入 analysis ≠ 人工终审证书 ≠ HOLD20 已修 ≠ 残缺13 已修题干。**

- 报告：`docs/CHEMISTRY_ANALYSIS_FINAL_UPDATE_REPORT.md`
- 白名单 **377**：仅 `analysis`；冲突 **0**；幂等 SKIP **377**
- 累计旧题解析升级：**541**（48+116+377）
- 不含：164 已升级、s60、13 block、HOLD20（含 401）
- 题库 **638** / 可训练 **621** / formal **0** / 每日 cand **561** / s60 **60**
- 隔离冒烟 ok；回滚：`final_remaining/rollback_final_update.js`
- 备份：`final_remaining/backup/`
- 遗留 HOLD20：多为 `rxn_not_marked_redox` 焦点/DS；401 题层水化口径

---

## 剩余旧题解析全面升级 Phase1（2026-10-20）

> 计划与干跑记录；入库见上一节。

- 报告：`docs/CHEMISTRY_ANALYSIS_FINAL_REMAINING_REPORT.md`
- 剩余 **397**；候选 **396**；PASS **377** / HOLD **20**
- 目录：`docs/chemistry_analysis_upgrade/final_remaining/`

---

## 旧题解析质量升级 · 扫描 + 首批50样本（2026-10-20）

> 扫描与候选阶段记录；入库结果以上一节为准。

- 报告：`docs/CHEMISTRY_ANALYSIS_UPGRADE_SAMPLE50_REPORT.md`
- 目录：`docs/chemistry_analysis_upgrade/`（audit / sample50 / quality / risk / summary）
- 范围：原有可训练 **574**（排除 s60×60）；扫描阶段未写库
- 解析质量：**A 498 / B 75 / C 1 / D 0**（短而有依据可为 C；来源字段式为 A）
- 能力标注：记忆386 / 单步93 / 条件69 / 多步26；虚高 d2 约 **86**
- 样本50：覆盖 **10** 专项；终检后白名单 **48** 已入库（见上节）
- DeepSeek：50/50 辅助复核；**≠人审**

---

## 提高与挑战训练入口（2026-10-20）

> **入口已上线（试运行）≠ 人工审核完成 ≠ 正式池。**

- 报告：`docs/CHEMISTRY_ADVANCED_TRAINING_ENTRY_REPORT.md`
- 冒烟：`docs/chemistry_advanced_entry/smoke_test.js`（ok=true）
- **根因修复**：专项 availability/组卷 **禁止难度回退**（方程式配平：基础5 / 提高0 / 挑战0）
- 首页入口 → `/chemistry/advanced`；`session_kind=advanced`
- 模式：提高(d2) / 挑战(d3) / 混合(~70:30，不足互调)；**永不抽 d1**
- 范围：全部或单专项 + 二级分类；全部可用或首批60（`[s60]` / `train.ai_trial.s60.*`）
- 题量 5/10/20；顺序/随机；跨专项软均衡；答题页显示真实专项·分类
- 历史 `kindFilter`：specialty / advanced / daily / all；advanced **不计入**每日完成
- dhm 实测（test）：提高 **203** / 挑战 **24** / 混合 **227**；s60=**60**；每日可抽仍 **574**；题库 **638**

---

## 第一批 60 道提高/挑战题入库（2026-10-20）

> **已入个人试运行池 ≠ 人工学科审核 ≠ 正式池。**

- 报告：`docs/CHEMISTRY_ADVANCED_FIRST_IMPORT_REPORT.md`
- 样题报告：`docs/CHEMISTRY_ADVANCED_SAMPLE60_REPORT.md`
- 目录：`docs/chemistry_advanced_first_import/`（whitelist / backup / import / smoke）
- 修复 NEEDS_FIX **4/4** 后白名单 **60**；实际插入 **60**
- 题库：**578 → 638**；个人可训练：**574 → 634**；formal **0**
- 新增提高 **36** / 挑战 **24**（code：`train.ai_trial.s60.*`）
- `gate_note`：`[ai_trial][trial_access:allow][qa:PASS][daily:exclude][human_unreviewed][s60]…`
- 每日可抽（test）：**574 → 574**（真实组卷未抽到 s60）
- 授权账号 `dhm@189.cn`：提高/挑战 availability >0；冒烟未改其历史
- 回滚：按 code 前缀软停用 + `[trial_access:block]`（见入库报告）
- 幂等：重复导入 skip 60、不产生重复行

---

## 第一批 60 道提高/挑战样题（文档生产，2026-10-19）

> 生产阶段记录；入库状态以上一节为准。

- 报告：`docs/CHEMISTRY_ADVANCED_SAMPLE60_REPORT.md`
- 数据：`docs/chemistry_advanced_samples/`
- 初验：PASS 56 / NEEDS_FIX 4 → 已全部修复入库

---

## 提高/挑战题型模型体系（2026-10-19，第一阶段）

> **模型设计 ≠ 已生成 500 题 ≠ 人工审核通过。**

- 报告：`docs/CHEMISTRY_ADVANCED_MODEL_PLAN.md`
- 程序可读库：`docs/chemistry_advanced_model/models_catalog.json`（编号 `ADV.{specialty}.{nnn}`）
- 模型 **45**：READY **38** / NEEDS_ENGINE **3** / HOLD **4**
- 代表样例：提高 **38**、挑战 **30**（仅模型库，未入库）
- 现有可训练 d2=167：抽样显示多为**单步识别**，不能当作真提高产能
- 挑战题 `difficulty=3`：本批入库后全库挑战 **24**（均为 s60）
- 第一批 500 题配额：计算100 / 氧化还原90 / 离子70 / 实验70 / 推断80 / 综合90（约350提高+150挑战）
- 模型库本身未改；样题已入试运行池（见「60 道入库」节）

---

## 题库整改与试运行准入（2026-10-19）

- 报告：`docs/CHEMISTRY_QUESTION_BANK_FIX_REPORT.md`
- 备份：`docs/chemistry_question_bank_fix/backup_*`（可 `restore_backup.js`）
- 补关联 **22**；无法可靠关联禁试运行 **2**；filler **18** 曾停用 → **个人开放时已清理**（见上节）
- VERIFY 分类：`kb_pending` **223**（允许试运行）；science/curriculum **0**
- 整改后可试运行 **574**；formal **0**
- 抽题：尊重 `trial_access:block`；**不再**跨二级分类凑数
- 管理页：`/settings/chemistry-train-items`

---

## 594 题质量审查（2026-10-19，只读）

> **自动审查 ≠ 人工学科审核。**

- 报告：`docs/CHEMISTRY_QUESTION_QUALITY_AUDIT_REPORT.md`
- 数据：`docs/chemistry_question_quality_audit/`
- PASS **328** / FIX **43** / VERIFY **223**；P0/P1 **0**

---

## 本地规则出题器阶段 A（2026-10-19）

- 报告：`docs/CHEMISTRY_LOCAL_GENERATOR_PHASE_A_REPORT.md`
- 管理页：`/settings/chemistry-generator`；API：`/chemistry/admin/train-generator/*`
- CLI：`apps/api` → `pnpm chem:gen-phase-a -- --preview` / `--apply --confirm`
- **题库 94 → 594**（formal 仍 0；测试可用 **576**；新增 pa 题 **500**）
- **239 知识利用 32 → 173**；substance **24/24**；knowledge **72/74**；reaction **49/59**
- filler `cov.*`：**停用 18**（不删）；旧 seed 9 保留
- 化学式填空：`answer_type=chem_formula`（24 道）
- 必须预览确认；不去重凑数；挑战题未生成

---

## 题库容量审计（2026-10-19，只读 · 扩充前基线）

- 报告：`docs/CHEMISTRY_QUESTION_BANK_CAPACITY_REPORT.md`
- 扩充前：总数 94；239 用 32；filler 致多专项显示 3 道
- 扩充后数据以阶段 A 报告为准

---

## DeepSeek 第二轮复核

- 目录：`docs/chemistry_deepseek_audit/second_review/`
- 报告：`docs/CHEMISTRY_DEEPSEEK_SECOND_REVIEW_REPORT.md`
- READY_FOR_HUMAN_APPROVAL **119** / NEEDS_VERIFICATION **109** / NEEDS_FIX **11**
- AI 复核 ≠ 人工审核；READY ≠ published（正式人审语义）

---

## 训练引擎 Phase1

- 报告：`docs/CHEMISTRY_TRAINING_PHASE1_REPORT.md`
- API：`/chemistry/train/*`；测试池需 ADMIN 或 grants
- 正式池关联知识须 published 且非 trial 隔离字段（学生端）
- `q.eq.Na_water` 不得作方程式唯一答案源

---

## 全库知识（摘要）

- 377 条完整；inventory 未删编码  
- 23 条 verifyNeeded（仍未试用发布）  
- 当前：原人审 published 约 19 + AI trial published 239（学生只见 19）  

---

## 硬约束

1. `db/init.sql` 权威；synchronize=false  
2. user_id 隔离  
3. `pnpm chem:import` 禁密码  
4. AI 检查 ≠ 人工审核  
5. 377 条清单不得擅自删编码  
6. 已发布知识不得静默覆盖正文  
7. 试用可用 `restore.js` 完整回滚 status/note 与试运行题  

---

## 关键路径

| 文档 | 用途 |
|------|------|
| `CHEMISTRY_QUESTION_BANK_FIX_REPORT.md` | **题库整改与试运行准入** |
| `CHEMISTRY_QUESTION_QUALITY_AUDIT_REPORT.md` | 594 题质量审查 |
| `CHEMISTRY_LOCAL_GENERATOR_PHASE_A_REPORT.md` | 本地出题器阶段 A |
| `CHEMISTRY_QUESTION_BANK_CAPACITY_REPORT.md` | 题库容量审计（扩充前） |
| `CHEMISTRY_FORMULA_INPUT_GRADING_REPORT.md` | **化学式显示/判题** |
| `CHEMISTRY_AI_TRIAL_TRAINING_REPORT.md` | 试用发布与本地出题 |
| `chemistry_trial_restore/RESTORE.md` | 回滚步骤 |
| `CHEMISTRY_DEEPSEEK_SECOND_REVIEW_REPORT.md` | 第二轮复核 |
| `chemistry_deepseek_audit/publish_whitelist.json` | 初审白名单 |
| `CHEMISTRY_TRAINING_PHASE1_REPORT.md` | 训练引擎 Phase1 |
| `CHEMISTRY_KB_GLOBAL_FIX_REPORT.md` | 全库第一轮整改 |
| `docs/chemistry_kb_inventory.json` | 377 清单 |
| `CHEMISTRY_MODULE_PLAN.md` | 模块阶段规划 |
| `CHEMISTRY_ADVANCED_MODEL_PLAN.md` | 提高/挑战模型体系 |
| `CHEMISTRY_ADVANCED_SAMPLE60_REPORT.md` | 第一批60道样题核验（文档） |
| `CHEMISTRY_ADVANCED_FIRST_IMPORT_REPORT.md` | **首批60道入库与试运行** |
| `CHEMISTRY_ADVANCED_TRAINING_ENTRY_REPORT.md` | **提高与挑战训练入口** |
| `CHEMISTRY_ANALYSIS_UPGRADE_SAMPLE50_REPORT.md` | 旧题解析扫描+50样本 |
| `CHEMISTRY_ANALYSIS_FIRST_UPDATE_REPORT.md` | **首批48道 analysis 正式更新** |
| `CHEMISTRY_PERSONAL_TRAINING_OPEN_REPORT.md` | 个人试运行开放 |
| `CHEMISTRY_DAILY_REVIEW_REPORT.md` | 每日10分钟 |
