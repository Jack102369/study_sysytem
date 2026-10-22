# 高一化学 · 学习分析看板开发报告

> 日期：2026-10-20  
> 范围：独立页面 `/chemistry/analytics`、`GET /chemistry/train/analytics`、首页入口、隔离冒烟。  
> **未做**：DB 迁移、答题时专项/难度快照列、AI 建议、正式积分/掌握度、改题库/KB/历史快照。  
> **个人试运行题库 ≠ 人工审核通过 ≠ 正式上线。**

---

## 1. 实际完成的图表

| 区块 | 实现 |
|------|------|
| 学习数据概览 | 近 7/30 天：完成训练、练习题次、正确/错误/待复核、明确正确率 |
| 活跃度日历 | 固定最近 30 上海自然日；柱色按练习题次深浅；悬停含训练次数/题次/对错 |
| 正确率与练习量趋势 | 柱=练习题次，线=正确率；无明确对错日正确率为 `null`（图上断开，非 0%） |
| 各专项近期答题表现 | 横向柱 + 表格；无记录显示「无数据」；graded&lt;5「样本较少」；**无雷达图** |
| 基础/提高/挑战难度 | 分组柱（练习/正确/错误/待复核）+ 文字摘要；含「未知难度」 |
| 错题环形图 | open / consolidating / mastered；中心总数；旁注今日待复习 |
| 高频错误专项 | 横向柱，按明确错误题次降序 |
| 下一步建议 | 规则引擎轻量建议，可点击真实入口 |

入口：化学首页「学习分析」→ `/chemistry/analytics`。

---

## 2. 统计数据来源

- `chem_train_sessions`：`status=completed` + `submitted_at`
- `chem_train_session_items`：`user_answer` + `grade_result`
- 专项/难度：`LEFT JOIN chem_train_items`（**当前** `specialty_id` / `difficulty`）
- 错题：`ChemWrongQuestionService.summary`（与错题中心同源）
- 建议可训性：`ChemAdvancedTrainService.availability` + 试运行授权

---

## 3. 7天 / 30天时间口径

- 时区：`Asia/Shanghai`（`shanghaiDateString` / `shanghaiDateMinusDays`）
- `days=7|30`：含今天共 N 个自然日 → `trend` / `specialties` / `difficulties` / `topWrong` / `overview`
- `calendar`：**始终**最近 30 天（与 `days` 无关）

---

## 4. 正确率及练习题次口径

| 指标 | 口径 |
|------|------|
| 练习题次 | 已提交会话中：有作答且 grade ∈ {correct, wrong, pending_review}；同题多次按次数 |
| 正确率 | correct / (correct + wrong)；pending 可单计不进分母；分母 0 → `null` |
| 未提交/进行中 | 不计 |

与 learning-home 一致。

---

## 5. 专项和难度历史快照处理

**现状：** `chem_train_session_items` 未快照专项/难度；会话级 `difficulty` 不可靠（daily=1、mix=0、wrong=0）。

**本阶段方案（已披露，非静默）：**

- `attribution.specialty/difficulty = current_item`
- UI 固定提示：按题目**当前**归属；改题库后历史分析会变
- `item_id` 空或题目缺失 →「未知专项」/「未知难度」，不归为基础
- 跨专项会话按**题**拆到各专项

未做迁移；真正答题时快照需另立项。

---

## 6. 错题状态统计方式

复用错题中心 `summary`：`open` / `consolidating` / `mastered` / `dueTodayCount`。

文案：已掌握 = 该错题满足复练条件，≠ 知识点已掌握；**当前状态图，非历史趋势**。不重算掌握规则。

---

## 7. 轻量建议规则

优先级：今日待复习 → 近7天无训练 → 薄弱专项+有 open 错题 → 基础多/提高少且可训 → 挑战样本少且可训。

每条含 reason / cta / path；无授权或无可练题不推。

---

## 8. 隔离测试结果

账号：`chem_analytics_smoke@local.test`  
命令：`node docs/chemistry_analytics/smoke_test.js`  
结果：**26/26 PASS**（`docs/chemistry_analytics/smoke_result.json`）

覆盖：空数据、7/30、日历30、未提交不计、练习题次、pending 不进分母、正确率 null、未知桶、错题与 summary 一致、建议 path、用户隔离、刷新一致、原入口存活。

---

## 9. 数据缺失和低样本限制

- 无记录专项：`empty=true`，`accuracyPercent=null`（不显示虚假 0%）
- graded &lt; 5：`sampleLow` +「样本较少」
- 挑战样本少：额外提示正确率仅供参考
- 专项/难度随当前题库归属变化（见 §5）

---

## 10. 未完成事项

| 项 | 说明 |
|----|------|
| session_items 专项/难度快照迁移 | 未做 |
| 完整月历网格（按周对齐） | 用 30 日柱状热力代替 |
| 雷达图 | 刻意不做，避免缺失填 0 |
| AI 建议 / 正式掌握度 / 积分 | 未做 |

---

## 主要文件

**新增：**  
`chem-analytics.service.ts` / `.controller.ts` / `dto/analytics.dto.ts`  
`ChemistryAnalyticsView.vue`  
`docs/chemistry_analytics/smoke_test.js`  
`docs/CHEMISTRY_ANALYTICS_REPORT.md`

**修改：**  
`chemistry.module.ts`、`router/index.ts`、`ChemistryHomeView.vue`、`chemistry-train.ts`、`ChemistryWrongQuestionsView.vue`（`specialtyCode` query）、`CHEMISTRY_AI_CONTEXT.md`
