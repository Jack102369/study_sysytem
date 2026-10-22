# 高一化学 · 错题中心第一阶段开发报告

> 日期：2026-10-20  
> 范围：错题主表/事件、历史回放初始化、自动收集、列表详情、原题复练、薄弱统计、「今天建议复习」。  
> **未做**：AI 错因诊断、实时变式、正式积分/掌握度接入、改历史答题、放宽准入。  
> **个人试运行题库 ≠ 人工审核通过 ≠ 正式上线。**

---

## 1. 实际交付

| 能力 | 说明 |
|------|------|
| 入口 | `/chemistry` →「我的错题」→ `/chemistry/wrong-questions`；详情 `/chemistry/wrong-questions/:id` |
| 数据表 | `chem_wrong_items`（`user_id+item_id` 唯一）、`chem_wrong_events`（`session_item_id` 唯一） |
| session_kind | 新增 `wrong_review`；历史列表可筛「错题复练」 |
| 初始化 | 全量回放：先找至少错过一次的题 → 按时间回放全部明确 `correct/wrong` → 还原状态；幂等 |
| 提交钩子 | `submit` 成功后 `onSessionSubmittedSafe`；失败只打日志，不回滚训练；可 `POST …/rebuild` 补偿 |
| 列表/摘要 | 待攻克 / 巩固中 / 已掌握 / **今天建议复习**；筛选排序分页 |
| 详情 | 历次做错快照（会话快照，不重判）；当前题库题干/解析可对照 |
| 一键复练 | 5/10/20；题量不足少出并提示；不凑普通题；`countsFormalStats=false`；**不计入每日完成** |
| 薄弱统计 | 按二级分类聚合真实 `correct/wrong`；不接入正式掌握度 |
| 准入 | 复用完整 eligibility + grants；block/停用/无权限不可进新复练；历史快照仍可看 |

### 主要文件

- `db/migrate_chemistry_wrong_question_phase1.sql`、`db/init.sql`
- `apps/api/src/chemistry/train/entities/chem-wrong-item.entity.ts`
- `apps/api/src/chemistry/train/entities/chem-wrong-event.entity.ts`
- `apps/api/src/chemistry/train/chem-wrong-question.service.ts`
- `apps/api/src/chemistry/train/chem-wrong-question.controller.ts`
- `apps/api/src/chemistry/train/dto/wrong-question.dto.ts`
- `apps/api/src/chemistry/train/chem-train.service.ts`（submit 钩子、`wrong_review` 列表/展示）
- `apps/api/src/chemistry/chemistry.module.ts`
- 前端：`ChemistryWrongQuestionsView.vue`、`ChemistryWrongQuestionDetailView.vue`、`ChemistryHomeView.vue`、`ChemistryTrainHistoryView.vue`、`router`、`api/chemistry-train.ts`
- 冒烟：`docs/chemistry_wrong_question/smoke_phase1.js`；迁移辅助：`run_migration.js`

### API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/chemistry/train/wrong-questions/summary` | 四态计数 + 到期规则说明 |
| GET | `/chemistry/train/wrong-questions` | 列表 |
| GET | `/chemistry/train/wrong-questions/weak-stats` | 薄弱分类 |
| GET | `/chemistry/train/wrong-questions/:id` | 详情 |
| POST | `/chemistry/train/wrong-questions/practice` | `{ count: 5\|10\|20 }` |
| POST | `/chemistry/train/wrong-questions/rebuild` | 幂等重建索引 |

---

## 2. 状态机与回放规则

事实来源：**答题快照**（`chem_train_session_items.grade_result`）。  
错题主表/事件表：可重建索引。

### 参与流转的结果

- 计入：`wrong`、`correct`
- **不计入**：`pending_review`（不推进、不回退、不计入对/错次数）
- 训练模式均参与：`specialty` / `daily` / `advanced` / `wrong_review` / 早期空 `session_kind`

### 题目状态（仅代表该 `item_id`，不是知识点掌握）

| 状态 | 含义 |
|------|------|
| `open`（待攻克） | 最近一次明确结果为做错，或尚未形成巩固 |
| `consolidating`（巩固中） | 错后已有至少 1 次明确正确 |
| `mastered`（已掌握） | 错后累计明确正确 ≥ **2** 次，且来自 ≥ **2** 个不同 session，且首次错后正确到「达成那次正确」的上海自然日间隔 ≥ **3** 天 |

再次明确做错 → **立刻回到待攻克**，错后正确计数清零。

掌握状态**不会**把知识点标为已掌握；薄弱程度只看真实答题统计。

---

## 3. 「今天建议复习」到期规则（实际实现）

时区：**Asia/Shanghai** 自然日。

| 状态 | 是否计入「今天建议复习」 |
|------|--------------------------|
| 待攻克 `open` | **全部计入**（新错题优先安排） |
| 巩固中 `consolidating` | 距「上次明确正确」（无则上次练习/做错）≥ **2** 个自然日则计入 |
| 已掌握 `mastered` | **默认不计入**高频错题复练推荐 |

复练组卷优先级：待攻克（错次多/最近错优先）→ 到期巩固中 → 未到期巩固中；已掌握不进入默认池。

常量（代码）：`WRONG_MASTER_MIN_CORRECT=2`，`WRONG_MASTER_GAP_DAYS=3`，`WRONG_CONSOLIDATING_DUE_DAYS=2`。

---

## 4. 一致性与安全边界

1. **提交优先**：训练 `submit` 事务成功后才更新错题索引；索引失败不回滚训练。  
2. **补偿**：任意时刻 `rebuild` 可从快照全量重放；事件按 `session_item_id` 去重。  
3. **不改历史**：不重判 `grade_result`，不改会话快照。  
4. **准入**：复练抽题走 `isItemEligible` + `canUseTestPool`；正式/试运行不混池。  
5. **用户隔离**：所有查询带 `user_id`；越权详情 404。  
6. **每日不受影响**：`wrong_review` 不计入 `session_kind=daily` 的今日完成次数。

---

## 5. 隔离冒烟结果

账号：`chem_wrong_smoke@local.test`（自动创建 USER + grant；**未改管理员密码**）。

命令：`node docs/chemistry_wrong_question/smoke_phase1.js`

| 用例 | 结果 |
|------|------|
| 历史先错后对 → consolidating | PASS |
| 同一题重复做错 → open，wrong_count=2 | PASS |
| 跨模式（specialty/daily/wrong_review）再对仍推进 | PASS |
| 跨 ≥3 上海自然日 + 多 session → mastered | PASS |
| 再次做错 → 回 open | PASS |
| pending_review 不参与计数/流转 | PASS |
| block 题不进入复练卷 | PASS |
| 无 grant → 403 | PASS |
| 重复 submit 事件数不变（3→3） | PASS |
| rebuild 幂等 | PASS |
| 每日完成次数不被 wrong_review 影响 | PASS |
| advanced availability 仍可用 | PASS |
| 列表/详情/用户隔离 | PASS |

**汇总：21 / 21 PASS**

---

## 6. 明确未做 / 未改

- 未改历史答题结果与快照内容  
- 未放宽 eligibility / grants  
- 未改正式积分与正式掌握度系统  
- 未开发 AI 错因诊断与变式生成  
- 未改现有题库题干/答案/知识库正文（冒烟中临时 block 已还原）  
- 未改管理员密码  

---

## 7. 下一步建议（待指令）

1. 详情页「只练这一题」专用组卷（当前入口走全局优先复练）  
2. 巩固中更细的到期提醒文案 / 日历视图  
3. 正式池有题后验证 formal 复练路径  
4. Phase2：错因标签（仍非 AI 生成）或薄弱专项快捷入口  
