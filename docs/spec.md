# 学习系统 — 需求规格（对照 db/init.sql）

> 本文描述系统边界与模块语义。数据库结构以 `db/init.sql` 为准；本阶段仅工程骨架，不实现业务 CRUD。

## 1. 多用户与年级枚举

- 系统为多用户：所有业务数据按 `user_id` 隔离，查询/更新必须带当前用户条件，防止越权。
- 用户表 `users` 字段要点：`email`（唯一）、`password_hash`、`nickname`、`grade`。
- 年级 `grade` 为枚举，覆盖小学到高中：
  - 小学：小学一年级 … 小学六年级
  - 初中：初一、初二、初三
  - 高中：高一、高二、高三

## 2. 配置模块

用户可维护个人学习配置（均按 `user_id` 隔离）：

| 能力 | 对应表 | 说明 |
|------|--------|------|
| 科目 | `subjects` | 名称、排序、归档；同用户下名称唯一 |
| 标签 | `tags` | 名称、可选颜色；同用户下名称唯一 |
| 错因分类 | `error_categories` | 可挂科目、可树形（`parent_id`）、排序与归档 |
| 考试类型 | `assessment_types` | 如期中/期末/月考等；同用户下名称唯一 |
| 附件 | `attachments` | 本地存储元数据（`storage`/`url`/`mime_type`），供错题等引用 |

## 3. 错题模块

核心表：`error_questions`，关联科目、可选分类，记录题干/解析/要点/来源/难度等。

- 状态：`NEW` / `REVIEWING` / `MASTERED` / `ARCHIVED`
- 标签：`error_question_tags`（多对多）
- 附件：`error_question_attachments`（角色 `STEM`/`ANALYSIS`/`OTHER`）
- 拓展题：`extensions`（挂在错题下）
- 练习记录：`error_attempts`（`CORRECT`/`WRONG`/`PARTIAL`，可选用时与备注）

## 4. 复习闭环

围绕错题状态与复习时间形成闭环：

1. 录入错题 → 默认 `NEW`
2. 纳入复习 → `REVIEWING`，并维护 `next_review_at`
3. 每次练习写入 `error_attempts`
4. 掌握后标记 `MASTERED`；不再使用可 `ARCHIVED`
5. 待复习列表依据：`user_id` + `status` + `next_review_at`（见索引 `idx_eq_user_status_next` / `idx_eq_user_next`）

## 5. 成绩模块

| 能力 | 对应表 | 说明 |
|------|--------|------|
| 考试/测评 | `assessments` | 类型、标题、考试日、备注 |
| 科目得分 | `assessment_subject_scores` | 分数、满分、班级/年级（校）排名与规模、备注；同一考试下科目唯一 |
| 考试标签 | `assessment_tags` | 多对多标签 |

## 6. 趋势图

前端使用 ECharts，基于成绩与错题数据做可视化（实现阶段再定接口），典型维度：

- 按时间：某科目得分走势、满分占比
- 按考试类型：同类考试对比
- 错题：新增量、掌握率、复习完成情况随时间变化

本阶段仅安装 ECharts 依赖并预留页面骨架，不实现图表业务接口。
