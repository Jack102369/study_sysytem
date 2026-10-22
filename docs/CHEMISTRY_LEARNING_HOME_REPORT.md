# 高一化学 · 学习中心首页与每日学习流程整合报告

> 日期：2026-10-20  
> 范围：学习首页四区、`GET /chemistry/train/learning-home`、错题 `focus=due` 真实筛选、提高/挑战 URL 预选、结果页「接下来建议」、隔离冒烟。  
> **未做**：正式积分、正式掌握度、错题一键组卷新接口、数据库迁移、改题库/知识库/历史快照、改用户密码或角色。  
> **个人试运行题库 ≠ 人工审核通过 ≠ 正式上线。**

---

## 1. 首页实际功能

路径：`/chemistry`（`ChemistryHomeView.vue`）

| 区块 | 内容 |
|------|------|
| 今日状态条 | 基础巩固阶段（未开始/进行中/已完成）、今日待复习错题数、今日已完成训练次数、今日已练习题次 |
| 今日学习任务（建议顺序，非强制） | ① 每日10分钟 ② 今日错题复习 ③ 错题变式巩固 ④ 提高与挑战 |
| 今日 / 近7天概览 | 提交次数、练习题次、正确/错误、正确率、待复核；近7天新增错题 + **当前已掌握错题** |
| 全部学习功能 | 每日 / 提高挑战 / 错题 / 历史 / 知识库 / 各专项入口（随时可用，不因任务状态锁定） |

每日任务按钮行为：

- **未开始** →「开始」进每日页  
- **进行中** →「继续」直达原 `inProgressSessionId`（不新建会话）；另可「打开每日页」  
- **已完成** →「再次练习」（保留现有能力）

错题任务：有 `dueTodayCount` 时「复习今日错题」→ `/chemistry/wrong-questions?focus=due`（真实筛选）。

提高挑战：推荐项显示**该专项+难度模式下**真实可练题量；不足 5 题时展示 `shortfallHint`；无推荐时显示替代入口。

---

## 2. 学习流程如何衔接

建议路径（非强制）：

```
每日基础巩固 → 今日错题复习 → 错题变式巩固 → 提高/挑战训练
```

| 环节 | 衔接方式 |
|------|----------|
| 首页 → 每日 | `/chemistry/daily`；进行中则 `/chemistry/train/session/:id` |
| 首页 → 今日错题 | `?focus=due` → 错题中心自动切「今日复习」并用 `dueToday=1` 拉列表 |
| 首页 → 变式 | 进入错题中心；有效变式以详情页预览为准（首页不虚报全站变式数） |
| 首页 → 提高挑战 | 推荐 path 带 `specialty`+`mode`；设置页 URL 预选；或自主进入 `/chemistry/advanced` |
| 结果页 → 下一步 | 按 `session_kind` 生成可点击「接下来建议」；`wrong_variation` 仅在有 `sourceWrongItemId` 时提供返回来源错题 |

所有原有入口（专项、每日、提高、错题、历史、知识库）保持随时可用。

---

## 3. 新增接口及统计口径

### 3.1 新增接口

`GET /chemistry/train/learning-home`（JWT，按当前登录 `user_id`）

复用：

- `ChemDailyReviewService.status`
- `ChemWrongQuestionService.summary` / `weakStats` / `isDueToday`
- `ChemAdvancedTrainService.availability`（按推荐专项+难度验真实可练量）

**不**另起一套与 daily/wrong/advanced 不一致的业务规则。

### 3.2 统计口径（Asia/Shanghai）

| 指标 | 口径 |
|------|------|
| 今日 / 近7天窗口 | 应用层 `shanghaiDateString`；近7天含今天共 7 个自然日 |
| 已完成训练 | `status=completed` 且按 `submitted_at` 落在窗口内 |
| 练习题次 | 已提交会话中：有作答 **且** `grade_result` ∈ {correct, wrong, pending_review} |
| 正确率 | 分母 = correct + wrong；`pending_review` 可单计，**不进分母**；未作答不计练习题次 |
| 新增错题 | `first_wrong_at` 落在窗口内 |
| 已掌握错题 | 字段名 **「当前已掌握错题」**（当前状态计数，非近7天新增掌握） |

### 3.3 前端配套

| 能力 | 说明 |
|------|------|
| 错题 `focus=due` | 状态筛选项「今日复习」+ API `dueToday=1`（或 `status=due_today`） |
| 提高挑战 URL | `/chemistry/advanced?specialty=&mode=` 预选专项与难度模式 |
| 结果页下一步 | 拉取 learning-home 生成真实链接；无可靠来源 id 不伪造返回链接 |

### 3.4 主要文件

- `apps/api/src/chemistry/train/chem-learning-home.service.ts`
- `apps/api/src/chemistry/train/chem-learning-home.controller.ts`
- `apps/api/src/chemistry/chemistry.module.ts`
- `apps/web/src/views/chemistry/ChemistryHomeView.vue`
- `apps/web/src/views/chemistry/ChemistryWrongQuestionsView.vue`
- `apps/web/src/views/chemistry/ChemistryTrainResultView.vue`
- `apps/web/src/views/chemistry/ChemistryAdvancedTrainSetupView.vue`
- `apps/web/src/api/chemistry-train.ts`
- 冒烟：`docs/chemistry_learning_home/smoke_test.js`

---

## 4. 隔离测试结果

账号：`chem_learning_home_smoke@local.test`（另建 `chem_learning_home_other@local.test` 做隔离对照）

命令：`node docs/chemistry_learning_home/smoke_test.js`

结果：**24/24 PASS**（`docs/chemistry_learning_home/smoke_result.json`）

| 项 | 结果 |
|----|------|
| learning-home 200 / 上海时区 / 今日日期 | PASS |
| daily 未开始 → 进行中（恢复原会话 id）→ 已完成且可再练 | PASS |
| `dueToday=1` 列表含 open 错题；首页 due 计数 | PASS |
| 练习题次排除未作答；正确率排除 pending | PASS |
| 近7天窗口；新增错题按 first_wrong_at | PASS |
| 推荐题量 = advanced.availability 同参结果 | PASS |
| 另一用户 due/今日会话为 0 | PASS |
| daily / advanced / wrong 原入口仍可用 | PASS |
| 未改 dhm@189.cn 学习数据（隔离账号冒烟） | PASS |

---

## 5. 未完成项

| 项 | 说明 |
|----|------|
| 错题「一键组卷」专用接口 | 按确认暂不新建；复用现有复练 + `focus=due` 筛选 |
| 首页汇总全站「可训变式数」 | 刻意不做，避免放宽匹配；变式以详情预览为准 |
| 正式积分 / 正式掌握度 | 未接入 |
| 数据库迁移 | 本阶段无 |
| 北京时间跨日 UI 专项回归 | 后端口径与冒烟用上海日；跨日边界靠 `shanghaiDateString`，未做人工挂起到 24:00 的端到端挂测 |

---

## 6. 是否可作为日常化学学习闭环使用

**可以，作为个人试运行环境下的日常学习闭环使用：**

首页看状态 → 每日巩固 → 今日错题 → 详情变式 → 提高/挑战 → 结果页引导回下一步。

限制需知：

1. 正式池仍可能为空；日常依赖个人试运行授权与试运行题库。  
2. 变式命中率依赖知识链接/模型目录，部分题可能无可靠变式。  
3. 非人工学科审核完成态；不计入正式积分。  
4. 「已掌握」仅为错题索引状态规则，非正式学科掌握度。

---

## 7. 安全与约束核验

| 约束 | 状态 |
|------|------|
| 业务按 user_id 隔离 | 是（接口 + 冒烟） |
| 未改题库 / KB / 历史答题快照内容 | 是（仅隔离账号写会话/错题索引） |
| 未接入正式积分/掌握度 | 是 |
| 未改密码/角色；不影响试运行授权逻辑 | 是（仅 INSERT IGNORE grant 给冒烟账号） |
| 无 DB 迁移 | 是 |
