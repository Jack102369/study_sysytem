-- APPLICATION-4C-4B：高一数学 DeepSeek 应用题每日额度（方案 B · MySQL）
-- 目标库：study_system
--
-- 本文件为增量迁移。执行前请备份。
-- APPLICATION-4C-4B 默认 NOT_EXECUTED：未经用户单独授权不得执行本脚本。
-- 本轮仅生成文件，不建表、不写业务数据、不启用 AI。
--
-- 业务说明：
--   仅统计「高一数学 application 真实 DeepSeek 评分 HTTP」次数。
--   按 Asia/Shanghai 自然日；默认上限 20（运行时可由 HS_MATH_DEEPSEEK_DAILY_LIMIT 覆盖写入 daily_limit）。
--   不限制 Qwen 自部署 Vision / 转写。
--   不影响其他学科 DeepSeek 调用。
--
-- 执行前检查（只读）：
--   SELECT DATABASE();
--   SHOW TABLES LIKE 'hs_math_deepseek_daily';
--   SHOW COLUMNS FROM users LIKE 'id';
--
-- 回滚（需单独授权）：
--   DROP TABLE IF EXISTS hs_math_deepseek_daily;

USE study_system;

CREATE TABLE IF NOT EXISTS hs_math_deepseek_daily (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL COMMENT '对应用户 users.id',
  quota_date DATE NOT NULL COMMENT 'Asia/Shanghai 日历日',
  used_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '当日已消耗 DeepSeek 评分次数（含失败/超时）',
  daily_limit INT UNSIGNED NOT NULL DEFAULT 20 COMMENT '当日上限快照（创建行时写入）',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_hs_math_deepseek_daily_user_date (user_id, quota_date),
  KEY idx_hs_math_deepseek_daily_date (quota_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='高一数学 application DeepSeek 日额度（APPLICATION-4C-4B）';
