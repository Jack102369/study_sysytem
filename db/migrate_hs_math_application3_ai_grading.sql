-- APPLICATION-3A：应用题 AI 批改结果字段（纯文字路径）
-- 目标库：study_system
--
-- 本文件为增量迁移。执行前请备份。
-- APPLICATION-3A 默认 NOT_EXECUTED：未经用户单独授权不得执行。
--
-- 幂等边界：
--   使用 information_schema 检查后再 ADD COLUMN（可重复执行脚本需人工确认已加列则跳过）。
--   不 DROP、不 TRUNCATE、不 UPDATE 现有题目 / 已有 grade_result 数据。
--   保留历史 pending_ai 行。
--
-- 执行前检查（只读）：
--   SELECT DATABASE();
--   SHOW COLUMNS FROM hs_math_train_session_items LIKE 'ai_%';
--
-- 回滚（需单独授权）：
--   ALTER TABLE hs_math_train_session_items
--     DROP COLUMN ai_grade_json,
--     DROP COLUMN ai_model,
--     DROP COLUMN ai_graded_at,
--     DROP COLUMN ai_attempt_count;

USE study_system;

-- MySQL 8：逐列添加（若列已存在会报错 — 执行前请核对）
ALTER TABLE hs_math_train_session_items
  ADD COLUMN ai_grade_json JSON NULL
    COMMENT 'APPLICATION-3：AI 批改结构化结果（校验通过后写入）'
    AFTER grade_reason,
  ADD COLUMN ai_model VARCHAR(64) NULL
    COMMENT '批改所用模型名'
    AFTER ai_grade_json,
  ADD COLUMN ai_graded_at DATETIME(3) NULL
    COMMENT 'AI 批改完成时间'
    AFTER ai_model,
  ADD COLUMN ai_attempt_count INT UNSIGNED NOT NULL DEFAULT 0
    COMMENT 'AI 批改尝试次数'
    AFTER ai_graded_at;

-- grade_result 注释扩展（列类型仍为 VARCHAR(32)，无需改类型）
ALTER TABLE hs_math_train_session_items
  MODIFY COLUMN grade_result VARCHAR(32) NULL
    COMMENT 'correct|wrong|pending_review|pending_ai|grading|graded|review_required|grading_failed';
