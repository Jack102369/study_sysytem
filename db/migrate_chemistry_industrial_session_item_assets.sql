-- 化学工业实验 STEP_10 / D045
-- 新增 chem_train_session_item_assets：会话题目工业 SVG 版本快照。
--
-- 迁移顺序（依赖）：
--   1) migrate_chemistry_industrial_train_item_assets.sql（STEP_09 / D043）
--   2) 本文件（STEP_10 / D045）
-- 本文件不依赖 chem_train_item_assets 外键（历史快照独立）。
--
-- 约定：CREATE TABLE IF NOT EXISTS；不删表、不清数据。
-- 禁止 TypeORM synchronize；禁止本仓库 Agent 对未知/生产库自动执行。
--
-- 执行前：SHOW TABLES LIKE 'chem_train_session_items';
-- 执行后：SHOW CREATE TABLE chem_train_session_item_assets;

CREATE TABLE IF NOT EXISTS chem_train_session_item_assets (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  session_item_id BIGINT UNSIGNED NOT NULL,
  source_item_asset_id BIGINT UNSIGNED NULL COMMENT '开训时 chem_train_item_assets.id；无 FK 以免删题库关联破坏历史',
  asset_type VARCHAR(32) NOT NULL COMMENT 'industrial_flow_svg|industrial_apparatus_svg',
  asset_role VARCHAR(32) NOT NULL COMMENT 'question_diagram|supporting_diagram',
  content_hash CHAR(64) NOT NULL COMMENT '开训时固定的 SVG 内容哈希',
  mime_type VARCHAR(64) NOT NULL DEFAULT 'image/svg+xml',
  diagram_version VARCHAR(32) NOT NULL DEFAULT '',
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_chem_sess_item_asset (session_item_id, asset_type, asset_role, content_hash),
  KEY idx_chem_sess_item_asset_si (session_item_id, sort_order),
  KEY idx_chem_sess_item_asset_hash (content_hash),
  CONSTRAINT fk_chem_sess_item_asset_si
    FOREIGN KEY (session_item_id) REFERENCES chem_train_session_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='训练会话题图快照；历史还原只读本表+不可变文件';
