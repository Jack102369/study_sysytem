-- 化学错题中心第二阶段：wrong_variation + source_wrong_item_id
-- 可重复执行

ALTER TABLE chem_train_sessions
  MODIFY COLUMN session_kind VARCHAR(16) NOT NULL DEFAULT 'specialty'
  COMMENT 'specialty|daily|advanced|wrong_review|wrong_variation';

-- 变式训练来源错题（可空；历史会话不受影响）
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'chem_train_sessions'
    AND COLUMN_NAME = 'source_wrong_item_id'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE chem_train_sessions ADD COLUMN source_wrong_item_id BIGINT UNSIGNED NULL COMMENT ''变式训练来源 chem_wrong_items.id'' AFTER counts_formal_stats',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'chem_train_sessions'
    AND INDEX_NAME = 'idx_chem_train_sess_src_wrong'
);
SET @sql2 := IF(
  @idx_exists = 0,
  'ALTER TABLE chem_train_sessions ADD KEY idx_chem_train_sess_src_wrong (user_id, source_wrong_item_id)',
  'SELECT 1'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'chem_train_sessions'
    AND CONSTRAINT_NAME = 'fk_chem_train_sess_src_wrong'
);
SET @sql3 := IF(
  @fk_exists = 0,
  'ALTER TABLE chem_train_sessions ADD CONSTRAINT fk_chem_train_sess_src_wrong FOREIGN KEY (source_wrong_item_id) REFERENCES chem_wrong_items(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;
