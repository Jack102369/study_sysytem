-- 高一数学 P0-3.5 独立集成测试库 schema（禁止用于生产）
-- 库名固定：study_system_hs_math_it
-- 用法（需具备 CREATE 权限的账号）：
--   mysql ... < db/hs_math_it_schema.sql

CREATE DATABASE IF NOT EXISTS study_system_hs_math_it
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE study_system_hs_math_it;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(128) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(64) NOT NULL,
  grade ENUM(
    '小学一年级','小学二年级','小学三年级','小学四年级','小学五年级','小学六年级',
    '初一','初二','初三',
    '高一','高二','高三'
  ) NOT NULL,
  role ENUM('ADMIN','USER') NOT NULL DEFAULT 'USER',
  is_disabled TINYINT(1) NOT NULL DEFAULT 0,
  ocr_enabled TINYINT(1) NOT NULL DEFAULT 0,
  ai_enabled TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hs_math_specialties (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL COMMENT '稳定编码',
  name VARCHAR(64) NOT NULL,
  book_code VARCHAR(32) NULL COMMENT '必修一/必修二等',
  chapter_no INT NULL,
  intro VARCHAR(255) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_hs_math_specialty_code (code),
  KEY idx_hs_math_specialty_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hs_math_categories (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  specialty_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(64) NOT NULL COMMENT '专项内唯一编码',
  name VARCHAR(64) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_hs_math_cat_specialty_code (specialty_id, code),
  KEY idx_hs_math_cat_specialty_sort (specialty_id, is_active, sort_order),
  CONSTRAINT fk_hs_math_cat_specialty FOREIGN KEY (specialty_id) REFERENCES hs_math_specialties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hs_math_train_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  pool VARCHAR(16) NOT NULL DEFAULT 'formal' COMMENT 'formal|test',
  qtype VARCHAR(16) NOT NULL COMMENT 'single|multi|judge|numeric',
  stem TEXT NOT NULL,
  options_json JSON NULL,
  answer_payload_json JSON NOT NULL COMMENT '结构化标准答案',
  analysis TEXT NULL,
  difficulty TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1基础 2提高 3挑战',
  specialty_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  knowledge_point_id BIGINT UNSIGNED NULL COMMENT 'P0占位，无FK',
  status VARCHAR(32) NOT NULL DEFAULT 'draft' COMMENT 'draft|approved|disabled',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  grade_rule_version VARCHAR(16) NOT NULL DEFAULT 'v1',
  content_version INT NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_hs_math_train_item_code (code),
  KEY idx_hs_math_train_item_pool (pool, status, is_active),
  KEY idx_hs_math_train_item_spec_cat (specialty_id, category_id, difficulty),
  CONSTRAINT fk_hs_math_train_item_sp FOREIGN KEY (specialty_id) REFERENCES hs_math_specialties(id),
  CONSTRAINT fk_hs_math_train_item_cat FOREIGN KEY (category_id) REFERENCES hs_math_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hs_math_train_sessions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  session_kind VARCHAR(16) NOT NULL DEFAULT 'specialty' COMMENT 'specialty|daily|advanced|wrong_review|wrong_variation',
  daily_date DATE NULL COMMENT 'P1每日用；P0预留',
  specialty_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NULL COMMENT '小节；NULL=整章抽题',
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
  counts_formal_stats TINYINT(1) NOT NULL DEFAULT 1,
  grade_rule_version VARCHAR(16) NOT NULL DEFAULT 'v1',
  source_wrong_item_id BIGINT UNSIGNED NULL COMMENT 'P1错题变式预留；无FK',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_hs_math_sess_user_started (user_id, started_at),
  KEY idx_hs_math_sess_user_status (user_id, status),
  KEY idx_hs_math_sess_user_kind_daily (user_id, session_kind, daily_date),
  CONSTRAINT fk_hs_math_sess_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_hs_math_sess_sp FOREIGN KEY (specialty_id) REFERENCES hs_math_specialties(id),
  CONSTRAINT fk_hs_math_sess_cat FOREIGN KEY (category_id) REFERENCES hs_math_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hs_math_train_session_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  session_id BIGINT UNSIGNED NOT NULL,
  sort_order INT UNSIGNED NOT NULL,
  item_id BIGINT UNSIGNED NULL COMMENT '题库删除后置空',
  item_code VARCHAR(64) NOT NULL DEFAULT '',
  qtype VARCHAR(16) NOT NULL,
  stem TEXT NOT NULL,
  options_json JSON NULL,
  answer_payload_json JSON NOT NULL COMMENT '标准答案快照',
  analysis TEXT NULL,
  knowledge_point_id BIGINT UNSIGNED NULL,
  specialty_id BIGINT UNSIGNED NULL,
  category_id BIGINT UNSIGNED NULL,
  difficulty TINYINT UNSIGNED NULL,
  content_version INT NOT NULL DEFAULT 1,
  grade_rule_version VARCHAR(16) NOT NULL DEFAULT 'v1',
  user_answer_payload_json JSON NULL COMMENT '覆盖作答',
  grade_result VARCHAR(32) NULL COMMENT 'correct|wrong|pending_review|pending_ai|grading|graded|review_required|grading_failed',
  grade_reason VARCHAR(255) NULL,
  ai_grade_json JSON NULL COMMENT 'APPLICATION-3：AI 批改结构化结果',
  ai_model VARCHAR(64) NULL,
  ai_graded_at DATETIME(3) NULL,
  ai_attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
  answered_at DATETIME(3) NULL,
  UNIQUE KEY uk_hs_math_sess_item_ord (session_id, sort_order),
  KEY idx_hs_math_sess_item_sess (session_id),
  KEY idx_hs_math_sess_item_item (item_id),
  CONSTRAINT fk_hs_math_sess_item_sess FOREIGN KEY (session_id) REFERENCES hs_math_train_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_hs_math_sess_item_item FOREIGN KEY (item_id) REFERENCES hs_math_train_items(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
