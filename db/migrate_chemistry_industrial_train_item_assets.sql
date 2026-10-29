-- 化学工业实验 STEP_09 / D043-APPROVED（方案 C）
-- 新增 chem_train_item_assets：正式题目 ↔ 不可变工业 SVG 资源关联。
--
-- 执行约定：
-- 1. 本迁移仅 CREATE TABLE IF NOT EXISTS；不删表、不清空数据、不改现有 chem_train_items 列。
-- 2. 禁止 TypeORM synchronize；须由运维在**已确认的目标库**显式执行。
-- 3. 本仓库 STEP_09 续做**不自动**对未知/生产库执行本文件。
-- 4. 可重复执行：IF NOT EXISTS；已存在同名表则跳过创建
-- 5. ON DELETE CASCADE 仅删除关联行，不会删除 uploads/industrial-svg 物理文件。
--
-- 执行前检查（示例）：
--   SHOW TABLES LIKE 'chem_train_item_assets';
--   SHOW CREATE TABLE chem_train_items;  -- 确认 id 为 BIGINT UNSIGNED
--
-- 执行后检查：
--   SHOW CREATE TABLE chem_train_item_assets;
--   SELECT CONSTRAINT_NAME, COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE
--     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chem_train_item_assets';

CREATE TABLE IF NOT EXISTS chem_train_item_assets (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  train_item_id BIGINT UNSIGNED NOT NULL,
  asset_type VARCHAR(32) NOT NULL COMMENT 'industrial_flow_svg|industrial_apparatus_svg',
  asset_role VARCHAR(32) NOT NULL COMMENT 'question_diagram|supporting_diagram',
  content_hash CHAR(64) NOT NULL COMMENT 'SVG 文件字节 SHA-256（不可变）',
  storage_path VARCHAR(512) NOT NULL COMMENT '相对 uploads/，如 industrial-svg/<sha256>.svg',
  mime_type VARCHAR(64) NOT NULL DEFAULT 'image/svg+xml',
  file_size INT UNSIGNED NOT NULL,
  diagram_version VARCHAR(32) NOT NULL DEFAULT '' COMMENT '渲染器/协议版本',
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_chem_train_item_asset (train_item_id, asset_type, asset_role, content_hash),
  KEY idx_chem_train_item_asset_item (train_item_id, sort_order),
  KEY idx_chem_train_item_asset_hash (content_hash),
  CONSTRAINT fk_chem_train_item_asset_item
    FOREIGN KEY (train_item_id) REFERENCES chem_train_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='题图不可变资源关联；禁止以可变 URL 作为唯一版本依据';
