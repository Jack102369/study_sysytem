-- APPLICATION-2A：高一数学应用题解答图片元数据表
-- 目标库：study_system
--
-- 本文件为增量迁移。执行前请备份。
-- APPLICATION-2A 阶段默认 NOT_EXECUTED：未经用户单独授权不得执行。
--
-- 幂等边界：
--   CREATE TABLE IF NOT EXISTS —— 表已存在时跳过建表，不改数据、不改列。
--   不 DROP、不 TRUNCATE、不 UPDATE 现有题目 / 会话 / 学习记录。
--   若表已存在但结构不符预期：须人工比对后停止，禁止静默 ALTER 覆盖。
--
-- 回滚（需单独授权，非本迁移自动执行）：
--   -- 先确认无业务依赖与磁盘孤儿策略后再执行：
--   DROP TABLE IF EXISTS hs_math_train_session_item_images;
--   （仅删本表；磁盘 uploads/hs-math/application-answers/ 须另授权清理）

USE study_system;

CREATE TABLE IF NOT EXISTS hs_math_train_session_item_images (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  session_item_id BIGINT UNSIGNED NOT NULL COMMENT 'hs_math_train_session_items.id',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '冗余隔离，须与 session.user_id 一致',
  storage_key VARCHAR(512) NOT NULL COMMENT '相对私有路径 hs-math/application-answers/{userId}/{uuid}.bin',
  mime_type VARCHAR(64) NOT NULL COMMENT 'image/jpeg|image/png|image/webp',
  size_bytes INT UNSIGNED NOT NULL COMMENT '字节数',
  sort_order INT UNSIGNED NOT NULL COMMENT '同 session_item 内展示顺序 1..5',
  status VARCHAR(16) NOT NULL COMMENT 'draft|submitted',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  submitted_at DATETIME(3) NULL COMMENT '会话 submit 时锁定写入',
  UNIQUE KEY uk_hs_math_sess_img_storage (storage_key),
  KEY idx_hs_math_sess_img_item (session_item_id, sort_order),
  KEY idx_hs_math_sess_img_user_status (user_id, status, created_at),
  CONSTRAINT fk_hs_math_sess_img_item
    FOREIGN KEY (session_item_id) REFERENCES hs_math_train_session_items(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_hs_math_sess_img_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='应用题解答图片元数据；二进制私有盘；禁止公开 /uploads 直链';

-- 验证（只读，可选）：
-- SELECT COUNT(*) AS c FROM information_schema.tables
--  WHERE table_schema='study_system' AND table_name='hs_math_train_session_item_images';
--
-- 结构冲突检查（若表已存在，人工比对）：
-- SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
--   FROM information_schema.columns
--  WHERE table_schema='study_system'
--    AND table_name='hs_math_train_session_item_images'
--  ORDER BY ORDINAL_POSITION;
