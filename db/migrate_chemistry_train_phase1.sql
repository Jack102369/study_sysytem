-- 高一化学专项训练引擎 · 第一阶段
-- 独立训练题池与会话；不改 chem_* 知识正文；不改 users 密码
USE study_system;

-- ========== 训练题（正式 / 测试隔离）==========
CREATE TABLE IF NOT EXISTS chem_train_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  pool VARCHAR(16) NOT NULL COMMENT 'formal|test',
  qtype VARCHAR(16) NOT NULL COMMENT 'single|judge|blank',
  stem TEXT NOT NULL,
  options_json JSON NULL,
  answer TEXT NOT NULL,
  answer_aliases_json JSON NULL COMMENT '填空等价答案数组，精确匹配',
  analysis TEXT NULL,
  difficulty TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1基础 2提高 3挑战',
  specialty_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft' COMMENT 'draft|approved|disabled',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  curriculum_ok TINYINT(1) NOT NULL DEFAULT 0 COMMENT '课程范围已确认',
  verify_blocked TINYINT(1) NOT NULL DEFAULT 0 COMMENT '关联知识待核实则禁止正式',
  ban_default_train TINYINT(1) NOT NULL DEFAULT 0 COMMENT '禁止默认正式训练',
  gate_note VARCHAR(255) NOT NULL DEFAULT '',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_chem_train_item_code (code),
  KEY idx_chem_train_item_pool (pool, status, is_active),
  KEY idx_chem_train_item_spec_cat (specialty_id, category_id, difficulty),
  CONSTRAINT fk_chem_train_item_sp FOREIGN KEY (specialty_id) REFERENCES chem_specialties(id),
  CONSTRAINT fk_chem_train_item_cat FOREIGN KEY (category_id) REFERENCES chem_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 正式题必须关联知识；测试题可不关联
CREATE TABLE IF NOT EXISTS chem_train_item_links (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  item_id BIGINT UNSIGNED NOT NULL,
  entity_type VARCHAR(32) NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uk_chem_train_item_link (item_id, entity_type, entity_id),
  KEY idx_chem_train_item_link_ent (entity_type, entity_id),
  CONSTRAINT fk_chem_train_item_link_item FOREIGN KEY (item_id) REFERENCES chem_train_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 非管理员测试授权
CREATE TABLE IF NOT EXISTS chem_train_test_grants (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  note VARCHAR(128) NOT NULL DEFAULT '',
  granted_by BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_chem_train_test_grant_user (user_id),
  CONSTRAINT fk_chem_train_test_grant_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 训练任务
CREATE TABLE IF NOT EXISTS chem_train_sessions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  specialty_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  pool_mode VARCHAR(16) NOT NULL COMMENT 'formal|test',
  difficulty TINYINT UNSIGNED NOT NULL,
  planned_count INT UNSIGNED NOT NULL,
  actual_count INT UNSIGNED NOT NULL,
  mode VARCHAR(16) NOT NULL COMMENT 'sequential|random',
  status VARCHAR(16) NOT NULL DEFAULT 'in_progress' COMMENT 'in_progress|completed|cancelled',
  answered_count INT UNSIGNED NOT NULL DEFAULT 0,
  correct_count INT UNSIGNED NOT NULL DEFAULT 0,
  wrong_count INT UNSIGNED NOT NULL DEFAULT 0,
  pending_count INT UNSIGNED NOT NULL DEFAULT 0,
  duration_ms INT UNSIGNED NOT NULL DEFAULT 0,
  started_at DATETIME(3) NOT NULL,
  submitted_at DATETIME(3) NULL,
  counts_formal_stats TINYINT(1) NOT NULL DEFAULT 1 COMMENT '测试训练为0',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_chem_train_sess_user (user_id, started_at),
  KEY idx_chem_train_sess_status (user_id, status),
  CONSTRAINT fk_chem_train_sess_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_train_sess_sp FOREIGN KEY (specialty_id) REFERENCES chem_specialties(id),
  CONSTRAINT fk_chem_train_sess_cat FOREIGN KEY (category_id) REFERENCES chem_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 任务内固定题目快照（含服务端答案，接口不提前返回）
CREATE TABLE IF NOT EXISTS chem_train_session_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  session_id BIGINT UNSIGNED NOT NULL,
  sort_order INT UNSIGNED NOT NULL,
  item_id BIGINT UNSIGNED NULL,
  item_code VARCHAR(64) NOT NULL DEFAULT '',
  qtype VARCHAR(16) NOT NULL,
  stem TEXT NOT NULL,
  options_json JSON NULL,
  answer TEXT NOT NULL,
  answer_aliases_json JSON NULL,
  analysis TEXT NULL,
  user_answer TEXT NULL,
  grade_result VARCHAR(32) NULL COMMENT 'correct|wrong|pending_review',
  answered_at DATETIME(3) NULL,
  UNIQUE KEY uk_chem_train_sess_item_ord (session_id, sort_order),
  KEY idx_chem_train_sess_item_sess (session_id),
  CONSTRAINT fk_chem_train_sess_item_sess FOREIGN KEY (session_id) REFERENCES chem_train_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
