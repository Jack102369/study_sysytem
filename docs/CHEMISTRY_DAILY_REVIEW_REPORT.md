# 高一化学 · 每日10分钟基础巩固训练开发报告

> 日期：2026-10-19  
> 范围：仅「每日10分钟」；未做提高专线 / 挑战 / OCR / AI 出题 / 积分。  
> **个人试运行题库 ≠ 人工审核通过 ≠ 正式上线。**

---

## 1. 实际开发了哪些功能

| 能力 | 说明 |
|------|------|
| 入口 | 学习工具 → 高一化学 →「每日10分钟」卡片/按钮 → `/chemistry/daily` |
| 状态页 | 今日是否完成、完成次数、目标 10 题、约 10 分钟、继续上次 / 开始新训练 / 再次练习 |
| 自动组卷 | 跨专项从试运行准入题池抽题；`session_kind=daily`；`specialty_id/category_id` 为空 |
| 答题/判题 | 完全复用现有 session / answers / submit / 化学式规则 |
| 结果增强 | 正确率、用时说明、涉及/答错知识点、规则生成复习提示 |
| 每日历史 | 按 Asia/Shanghai 日期聚合：完成次数、题量、正确率、用时、详情跳转 |
| 权限 | 复用 `chem_train_test_grants` / `canUseTestPool`；未授权不可开练 |
| 隔离 | 专项训练历史默认排除 `daily`；不污染 12 专项 / 137 分类 |

### 关键文件

- `db/migrate_chemistry_daily_review.sql`、`db/init.sql`
- `apps/api/src/chemistry/train/chem-daily-review.service.ts`
- `apps/api/src/chemistry/train/chem-daily-review.controller.ts`
- `apps/api/src/chemistry/train/shanghai-date.util.ts`
- `apps/api/src/chemistry/train/entities/chem-train-session.entity.ts`
- `apps/api/src/chemistry/train/chem-train.service.ts`（daily 展示 + 专项列表排除 daily）
- `apps/api/src/chemistry/chemistry.module.ts`
- 前端：`ChemistryDailyReviewView.vue`、`ChemistryHomeView.vue`、`ChemistryTrainResultView.vue`、`router`、`api/chemistry-train.ts`
- 冒烟：`docs/chemistry_daily_review/smoke_test.js`、`verify_extra.js`

---

## 2. 每日选题的真实规则

1. **题池**：有试运行权限 → `pool=test` 且 eligibility 通过（含 `[trial_access:allow]`、排除 block/停用）；否则 formal（当前为空则提示开通授权）。
2. **难度**：仅 `difficulty∈{1,2}`；目标约 **8 基础 + 2 提高**；排除挑战题（3）。
3. **题量**：目标 10；不足则少出并提示，**不用**停用/不合格题凑数。
4. **软比例**：错题相关 ≈4、久未练 ≈3、随机巩固 ≈3；任一类不足则从其余候选填满。
5. **覆盖**：排序时偏好尚未覆盖的二级分类 / 一级专项，但不为覆盖牺牲准入质量。

---

## 3. 如何利用错题和历史记录

错题来源：当前用户 `completed` 会话中 `grade_result=wrong` 的 `item_id`。

匹配优先级（高→低）：

1. 共享同一 `chem_train_item_links`（具体知识点关联）的其他题目  
2. 同一错题本身（权重低于同知识点其他题）  
3. 同一二级分类  
4. 同一一级专项（最低，避免整专项被当成薄弱点）

无错题 / 新用户：退化为基础+轻度提高的随机巩固。

---

## 4. 如何控制重复题目

时区：**Asia/Shanghai** 日历日。

近 **7** 天窗口权重：

| 窗口 | 权重 |
|------|------|
| 当天已出现 | 极低（优先排除；题不够才降级启用） |
| 近 1～3 天 | 大幅降权（×0.12） |
| 近 4～7 天 | 适度降权（×0.45） |
| 更早 / 未做 | 正常 |

同日再次练习：取消当日未完成 daily 后重新组卷；冒烟中第二次组卷与第一次题干重叠启发式为 **0**。

错题知识点允许合理提前复习（提高权重），但仍尽量避开当天刚做过的原题。

---

## 5. 普通学生账号是否可以使用

**可以。**

- 账号：`dhm@189.cn`（USER + 已授权试运行）
- 状态接口：`canTrain=true`，`candidateCount=574`
- 未授权时：`canTrain=false`，创建返回 400 提示开通试运行；grant 已测后恢复

页面提示保留：「AI初审题库，尚未完成全部人工学科审核。」

---

## 6. 实际测试结果

`node docs/chemistry_daily_review/smoke_test.js`（USER JWT，未改密码）：

| 项 | 结果 |
|----|------|
| status | 574 候选，Asia/Shanghai 今日 |
| create | 10 题；basic 8 / raise 2；`sessionKind=daily` |
| submit | 判题正常；正确率排除待复核；`durationNote` 明确 |
| insight | 多专项知识点；错题提示基于真实结果 |
| history | 按日聚合；`todayCompletedOnce=true` |
| 再次组卷 | 成功；未强制重复当日题 |
| DB | 专项仍 12、分类仍 137、题库 578；**无** `daily_review` 哨兵专项 |
| 专项历史 | 不泄漏 daily 会话 |
| 无 grant | 不可训练 |

用时含义：**开始训练到提交的经过时间**，非专注时长。

---

## 7. 发现的限制和遗留问题

1. 二级分类大量仍无题 → 每日覆盖依赖现有 34 个有题分类，无法保证每天扫过全部 137。  
2. 知识点标签目前以「专项 · 二级分类」为主；有 `item_links` 时用于错题匹配，结果页未展开 KB 标题全文。  
3. 完整自适应 / 打卡奖励 / 积分未做。  
4. 中途退出的 in_progress 可「继续」；点「开始新训练」会取消当日未完成 daily。  
5. 浏览器端 UI 需登录学生账号目视确认；API 冒烟已覆盖主路径。

---

## 8. 是否影响已有功能

| 项 | 结论 |
|----|------|
| 管理员/用户密码 | 未改 |
| 题库正文 / 知识 377 | 未改 |
| 专项列表 12 / 分类 137 | 未增假数据 |
| 专项训练创建/答题/判题 | 保留；历史默认不含 daily |
| 正式积分 / 掌握度 | 未接入（`counts_formal_stats=0`） |
| 化学式判题 | 未改路径，仍走原 `gradeAnswer` |

---

## 迁移与回滚提示

```bash
# 已执行
# db/migrate_chemistry_daily_review.sql
```

回滚需手工：删除 `session_kind='daily'` 会话及相关 `session_items`，再视需要 drop 新增列（一般不必）。  
不要用清空全表方式回滚。
