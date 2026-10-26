-- P1-0F-C3B：高一数学人工审核记录表
-- 目标库：study_system
--
-- 本文件为增量迁移。执行前请备份。
-- P1-0F-C3B 阶段默认 NOT_EXECUTED：未经用户单独授权不得执行。
--
-- 幂等边界：
--   CREATE TABLE IF NOT EXISTS —— 表已存在时跳过建表，不改数据。
--   不 DROP、不 TRUNCATE、不 UPDATE 现有题目。
--   不插入任何人工审核 passed 记录。
--
-- 回滚（需单独授权，非本迁移自动执行）：
--   DROP TABLE IF EXISTS hs_math_train_item_reviews;
--   （仅删本表，不影响 train_items / sessions）

USE study_system;

CREATE TABLE IF NOT EXISTS hs_math_train_item_reviews (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  item_id BIGINT UNSIGNED NOT NULL COMMENT '题目 ID',
  content_version INT NOT NULL COMMENT '审核时题目 content_version',
  content_fingerprint CHAR(64) NOT NULL COMMENT '服务端规范化内容 SHA-256 hex',
  reviewer_user_id BIGINT UNSIGNED NOT NULL COMMENT 'JWT 管理员 users.id',
  review_status VARCHAR(32) NOT NULL COMMENT 'passed|rejected|deferred',
  review_comment TEXT NOT NULL COMMENT '人工审核意见',
  reviewed_at DATETIME(3) NOT NULL COMMENT '服务端审核时间',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_hs_math_review_item_time (item_id, reviewed_at),
  KEY idx_hs_math_review_item_status (item_id, review_status, reviewed_at),
  KEY idx_hs_math_review_reviewer (reviewer_user_id, reviewed_at),
  CONSTRAINT fk_hs_math_review_item
    FOREIGN KEY (item_id) REFERENCES hs_math_train_items(id),
  CONSTRAINT fk_hs_math_review_user
    FOREIGN KEY (reviewer_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='人工审核历史；passed≠items.status=approved；题目删除默认 RESTRICT 防误删';

-- 验证（只读，可选）：
-- SELECT COUNT(*) AS c FROM information_schema.tables
--  WHERE table_schema='study_system' AND table_name='hs_math_train_item_reviews';
