-- =============================================================================
-- P1-FUNC-CORE-1A 迁移草案
-- 文件：db/migrate_hs_math_p1_func_core1a.sql
-- 状态：DRAFT_NOT_EXECUTED
-- 目标库：仅 study_system
--
-- 本文件在 CORE-1A-0 预检阶段创建，**禁止执行**，直至用户明确授权 CORE-1A 实施。
-- 不得用于其他模块表。
-- =============================================================================

-- 执行前验证（手工）：
--   SELECT DATABASE();  -- 必须 study_system
--   SHOW TABLES LIKE 'hs_math_train_items';
--   SHOW TABLES LIKE 'hs_math_methods';  -- 应不存在
-- 备份：mysqldump study_system hs_math_* > backup_pre_core1a_YYYYMMDD.sql

SET NAMES utf8mb4;

-- -----------------------------------------------------------------------------
-- 1) 扩展 hs_math_train_items：题目来源（旧行吃默认值；不批量改 content_version）
-- -----------------------------------------------------------------------------
-- 幂等：若列已存在则跳过（MySQL 8 无 IF NOT EXISTS for ADD COLUMN → 实施脚本用存储过程或预检）

ALTER TABLE hs_math_train_items
  ADD COLUMN source_type VARCHAR(16) NOT NULL DEFAULT 'original'
    COMMENT 'original|adapted|past_exam' AFTER analysis,
  ADD COLUMN source_year SMALLINT UNSIGNED NULL
    COMMENT '考试年份，可空' AFTER source_type,
  ADD COLUMN source_exam_name VARCHAR(128) NULL
    COMMENT '试卷名称' AFTER source_year,
  ADD COLUMN source_question_no VARCHAR(32) NULL
    COMMENT '题号' AFTER source_exam_name,
  ADD COLUMN source_reference VARCHAR(512) NULL
    COMMENT '出处/出版信息/链接，管理员可见' AFTER source_question_no,
  ADD COLUMN source_adaptation_note VARCHAR(512) NULL
    COMMENT '改编说明' AFTER source_reference,
  ADD COLUMN source_verification_status VARCHAR(16) NOT NULL DEFAULT 'unverified'
    COMMENT 'unverified|verified|rejected' AFTER source_adaptation_note,
  ADD COLUMN source_license_status VARCHAR(16) NOT NULL DEFAULT 'unknown'
    COMMENT 'unknown|permitted|restricted|forbidden' AFTER source_verification_status;

-- 索引：按来源筛题（管理端）
ALTER TABLE hs_math_train_items
  ADD KEY idx_hs_math_item_source_type (source_type, source_verification_status, source_license_status);

-- -----------------------------------------------------------------------------
-- 2) 方法词典（高一数学模块内共享，非化学）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_math_methods (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL COMMENT '稳定编码，如 defn / classification',
  name VARCHAR(64) NOT NULL,
  summary VARCHAR(512) NULL COMMENT '简介，可含简短说明',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_hs_math_method_code (code),
  KEY idx_hs_math_method_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='高一数学解题方法标签词典';

-- -----------------------------------------------------------------------------
-- 3) 题目-方法关联
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_math_train_item_methods (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  item_id BIGINT UNSIGNED NOT NULL,
  method_id BIGINT UNSIGNED NOT NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0 COMMENT '主方法；应用层保证每题至多一个 true',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_hs_math_item_method (item_id, method_id),
  KEY idx_hs_math_item_method_method (method_id),
  KEY idx_hs_math_item_method_primary (item_id, is_primary),
  CONSTRAINT fk_hs_math_item_method_item
    FOREIGN KEY (item_id) REFERENCES hs_math_train_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_hs_math_item_method_method
    FOREIGN KEY (method_id) REFERENCES hs_math_methods(id)
    -- 禁止硬删仍被引用的方法；停用走 is_active=0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='题目与解题方法多对多';

-- -----------------------------------------------------------------------------
-- 4) 可选种子方法（实施阶段可另开授权；此处仅草案注释）
-- -----------------------------------------------------------------------------
-- INSERT INTO hs_math_methods (code, name, summary, sort_order) VALUES
--   ('defn', '定义法', '直接用定义验证', 10),
--   ...
-- ON DUPLICATE KEY UPDATE name=VALUES(name);

-- -----------------------------------------------------------------------------
-- 执行后验证（手工）：
--   SHOW COLUMNS FROM hs_math_train_items LIKE 'source_%';
--   SELECT COUNT(*) FROM hs_math_methods;
--   SELECT source_type, source_verification_status, COUNT(*) FROM hs_math_train_items GROUP BY 1,2;
--   -- 期望：全部 original + unverified；content_version 分布与迁移前一致（未批量+1）
-- -----------------------------------------------------------------------------

-- 回滚草案（另文件或注释；授权后才执行）：
-- ALTER TABLE hs_math_train_items DROP COLUMN source_license_status, ...;
-- DROP TABLE IF EXISTS hs_math_train_item_methods;
-- DROP TABLE IF EXISTS hs_math_methods;
