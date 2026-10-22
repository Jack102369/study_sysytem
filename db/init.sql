CREATE DATABASE IF NOT EXISTS study_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE study_system;

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

CREATE TABLE IF NOT EXISTS subjects (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(32) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_archived TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_subject_user_name (user_id, name),
  KEY idx_subject_user_order (user_id, sort_order),
  CONSTRAINT fk_subject_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tags (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(32) NOT NULL,
  color VARCHAR(16) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_tag_user_name (user_id, name),
  CONSTRAINT fk_tag_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS attachments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  storage VARCHAR(16) NOT NULL DEFAULT 'local',
  url TEXT NOT NULL,
  mime_type VARCHAR(128) NULL,
  original_name VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_attach_user_created (user_id, created_at),
  CONSTRAINT fk_attach_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS error_categories (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NULL,
  parent_id BIGINT UNSIGNED NULL,
  name VARCHAR(64) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_archived TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_cat_user_subject_parent_name (user_id, subject_id, parent_id, name),
  KEY idx_cat_user_subject (user_id, subject_id),
  CONSTRAINT fk_cat_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cat_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  CONSTRAINT fk_cat_parent FOREIGN KEY (parent_id) REFERENCES error_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS error_questions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NULL,
  occurred_at DATE NOT NULL,
  title VARCHAR(128) NULL,
  stem_text MEDIUMTEXT NULL,
  analysis_text MEDIUMTEXT NULL,
  key_points TEXT NULL,
  source VARCHAR(64) NULL,
  difficulty TINYINT UNSIGNED NULL,
  status ENUM('NEW','REVIEWING','MASTERED','ARCHIVED') NOT NULL DEFAULT 'NEW',
  next_review_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_eq_user_subject_date (user_id, subject_id, occurred_at),
  KEY idx_eq_user_status_next (user_id, status, next_review_at),
  KEY idx_eq_user_next (user_id, next_review_at),
  CONSTRAINT fk_eq_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_eq_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
  CONSTRAINT fk_eq_category FOREIGN KEY (category_id) REFERENCES error_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS error_question_tags (
  error_question_id BIGINT UNSIGNED NOT NULL,
  tag_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (error_question_id, tag_id),
  CONSTRAINT fk_eqt_eq FOREIGN KEY (error_question_id) REFERENCES error_questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_eqt_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS error_question_attachments (
  error_question_id BIGINT UNSIGNED NOT NULL,
  attachment_id BIGINT UNSIGNED NOT NULL,
  role ENUM('STEM','ANALYSIS','OTHER') NOT NULL DEFAULT 'OTHER',
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (error_question_id, attachment_id),
  KEY idx_eqa_eq_role (error_question_id, role, sort_order),
  CONSTRAINT fk_eqa_eq FOREIGN KEY (error_question_id) REFERENCES error_questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_eqa_att FOREIGN KEY (attachment_id) REFERENCES attachments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS error_attempts (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  error_question_id BIGINT UNSIGNED NOT NULL,
  attempted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  result ENUM('CORRECT','WRONG','PARTIAL') NOT NULL,
  time_spent_seconds INT UNSIGNED NULL,
  note TEXT NULL,
  answer_attachment_id BIGINT UNSIGNED NULL,
  KEY idx_attempt_eq_time (error_question_id, attempted_at),
  CONSTRAINT fk_attempt_eq FOREIGN KEY (error_question_id) REFERENCES error_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS extensions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  error_question_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(128) NULL,
  content_text MEDIUMTEXT NULL,
  answer_text MEDIUMTEXT NULL,
  question_attachment_id BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_ext_eq (error_question_id),
  CONSTRAINT fk_ext_eq FOREIGN KEY (error_question_id) REFERENCES error_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS assessment_types (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(32) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_archived TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_at_user_name (user_id, name),
  CONSTRAINT fk_at_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS assessments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(128) NOT NULL,
  held_at DATE NOT NULL,
  note TEXT NULL,
  total_score DECIMAL(8,2) NULL,
  class_rank INT UNSIGNED NULL,
  school_rank INT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_assess_user_date (user_id, held_at),
  KEY idx_assess_user_type_date (user_id, type_id, held_at),
  CONSTRAINT fk_assess_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_assess_type FOREIGN KEY (type_id) REFERENCES assessment_types(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS assessment_subject_scores (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  assessment_id BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  score DECIMAL(6,2) NOT NULL,
  full_score DECIMAL(6,2) NULL,
  class_rank INT UNSIGNED NULL,
  class_size INT UNSIGNED NULL,
  school_rank INT UNSIGNED NULL,
  school_size INT UNSIGNED NULL,
  note TEXT NULL,
  UNIQUE KEY uk_assess_subject (assessment_id, subject_id),
  KEY idx_score_subject (subject_id),
  CONSTRAINT fk_score_assess FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  CONSTRAINT fk_score_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS assessment_tags (
  assessment_id BIGINT UNSIGNED NOT NULL,
  tag_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (assessment_id, tag_id),
  CONSTRAINT fk_ast_assess FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  CONSTRAINT fk_ast_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS extension_materials (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(128) NULL,
  content_text MEDIUMTEXT NULL,
  answer_text MEDIUMTEXT NULL,
  question_attachment_id BIGINT UNSIGNED NULL,
  file_name VARCHAR(255) NULL,
  learn_status ENUM('NOT_STARTED','IN_PROGRESS','DONE') NOT NULL DEFAULT 'NOT_STARTED' COMMENT '学习状态：未学/学习中/已学',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_em_user_subject_cat (user_id, subject_id, category_id),
  CONSTRAINT fk_em_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_em_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  CONSTRAINT fk_em_category FOREIGN KEY (category_id) REFERENCES error_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS listening_materials (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(128) NULL,
  content_text MEDIUMTEXT NOT NULL,
  attachment_id BIGINT UNSIGNED NULL,
  voice_key VARCHAR(64) NULL COMMENT 'piper voice model key',
  length_scale DECIMAL(3,2) NOT NULL DEFAULT 1.00 COMMENT 'piper length_scale, larger=slower',
  duration_ms INT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_lm_user_created (user_id, created_at),
  CONSTRAINT fk_lm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_lm_attachment FOREIGN KEY (attachment_id) REFERENCES attachments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_reference_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  source_error_question_id BIGINT UNSIGNED NULL,
  stem_text MEDIUMTEXT NOT NULL,
  answer_text MEDIUMTEXT NULL,
  analysis_text MEDIUMTEXT NULL,
  status ENUM('UNVERIFIED','VERIFIED') NOT NULL DEFAULT 'UNVERIFIED',
  model VARCHAR(64) NULL,
  verify_count INT UNSIGNED NOT NULL DEFAULT 0,
  verified_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_ari_user_created (user_id, created_at),
  KEY idx_ari_user_source (user_id, source_error_question_id),
  KEY idx_ari_user_status (user_id, status),
  CONSTRAINT fk_ari_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ari_source_eq FOREIGN KEY (source_error_question_id) REFERENCES error_questions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS writing_coach_sessions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  subject_track ENUM('chinese','english') NOT NULL,
  topic_source ENUM('manual','ai') NOT NULL DEFAULT 'manual',
  review_mode ENUM('structure','gaokao') NOT NULL DEFAULT 'structure',
  topic_text MEDIUMTEXT NOT NULL,
  topic_requirements MEDIUMTEXT NULL,
  outline_text MEDIUMTEXT NULL,
  opening_text MEDIUMTEXT NULL,
  final_draft_text MEDIUMTEXT NULL,
  review_json JSON NULL,
  review_model VARCHAR(64) NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_wcs_user_track_created (user_id, subject_track, created_at),
  CONSTRAINT fk_wcs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_study_prefs (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  compare_mode ENUM('score','class_rank','school_rank') NOT NULL DEFAULT 'score',
  score_threshold DECIMAL(6,2) NOT NULL DEFAULT 1.00,
  rank_threshold INT UNSIGNED NOT NULL DEFAULT 1,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_usp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_points (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  total_points INT UNSIGNED NOT NULL DEFAULT 0,
  week_points INT UNSIGNED NOT NULL DEFAULT 0,
  week_start DATE NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_up_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS point_ledger (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  reason VARCHAR(64) NOT NULL,
  points INT NOT NULL,
  ref_type VARCHAR(32) NULL,
  ref_id VARCHAR(64) NULL,
  note VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_ledger_user_reason_ref (user_id, reason, ref_id),
  KEY idx_ledger_user_created (user_id, created_at),
  CONSTRAINT fk_pl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reward_tiers (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  points_needed INT UNSIGNED NOT NULL,
  title VARCHAR(64) NOT NULL,
  reward_note VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_rt_user_points (user_id, points_needed),
  KEY idx_rt_user_sort (user_id, sort_order, points_needed),
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_reward_unlocks (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  tier_id BIGINT UNSIGNED NOT NULL,
  unlocked_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_uru_user_tier (user_id, tier_id),
  CONSTRAINT fk_uru_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_uru_tier FOREIGN KEY (tier_id) REFERENCES reward_tiers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS knowledge_cards (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  kind ENUM('formula','axiom','theorem','method') NOT NULL DEFAULT 'method',
  title VARCHAR(128) NOT NULL,
  content TEXT NOT NULL,
  tip VARCHAR(255) NULL,
  status ENUM('draft','active') NOT NULL DEFAULT 'active',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_kc_user_subject (user_id, subject_id),
  KEY idx_kc_user_kind (user_id, kind),
  KEY idx_kc_user_status (user_id, status),
  CONSTRAINT fk_kc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_kc_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS error_question_knowledge_cards (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  error_question_id BIGINT UNSIGNED NOT NULL,
  knowledge_card_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_eqkc (error_question_id, knowledge_card_id),
  KEY idx_eqkc_user (user_id),
  KEY idx_eqkc_card (knowledge_card_id),
  CONSTRAINT fk_eqkc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_eqkc_eq FOREIGN KEY (error_question_id) REFERENCES error_questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_eqkc_card FOREIGN KEY (knowledge_card_id) REFERENCES knowledge_cards(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS feature_flags (
  flag_key VARCHAR(64) PRIMARY KEY,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  module_name VARCHAR(64) NOT NULL,
  label VARCHAR(128) NOT NULL,
  description VARCHAR(255) NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pet_chat_daily (
  user_id BIGINT UNSIGNED NOT NULL,
  day_date DATE NOT NULL,
  chat_count INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day_date),
  CONSTRAINT fk_pcd_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_pet_prefs (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  skin_id VARCHAR(32) NOT NULL DEFAULT 'robin',
  pet_enabled TINYINT(1) NOT NULL DEFAULT 1,
  wake_word_overrides JSON NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_upp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 高一化学专项训练中心（字典表，无 user_id；学习记录后续 chem_* 再加）
CREATE TABLE IF NOT EXISTS chem_specialties (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL COMMENT '稳定编码，如 equation',
  name VARCHAR(64) NOT NULL,
  icon VARCHAR(64) NULL COMMENT '前端图标 key',
  intro VARCHAR(255) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_chem_specialty_code (code),
  KEY idx_chem_specialty_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_categories (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  specialty_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(64) NOT NULL COMMENT '专项内唯一编码',
  name VARCHAR(64) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_chem_cat_specialty_code (specialty_id, code),
  KEY idx_chem_cat_specialty_sort (specialty_id, is_active, sort_order),
  CONSTRAINT fk_chem_cat_specialty FOREIGN KEY (specialty_id) REFERENCES chem_specialties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 高一化学专项训练中心（阶段二：结构化知识库）
-- 内容状态：draft | pending_review | published | rejected | archived

CREATE TABLE IF NOT EXISTS chem_elements (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  symbol VARCHAR(8) NOT NULL,
  name_zh VARCHAR(32) NOT NULL,
  name_en VARCHAR(64) NOT NULL DEFAULT '',
  atomic_number INT UNSIGNED NOT NULL,
  atomic_mass DECIMAL(12,6) NULL,
  period_no TINYINT UNSIGNED NULL,
  group_label VARCHAR(16) NULL,
  category VARCHAR(32) NULL,
  common_valences VARCHAR(64) NULL,
  atom_structure TEXT NULL,
  electron_config VARCHAR(128) NULL,
  common_compounds TEXT NULL,
  key_properties TEXT NULL,
  common_uses TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  review_note VARCHAR(255) NOT NULL DEFAULT '',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_chem_element_symbol (symbol),
  UNIQUE KEY uk_chem_element_atomic_number (atomic_number),
  KEY idx_chem_element_status (status),
  KEY idx_chem_element_name (name_zh)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_substances (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  canonical_formula VARCHAR(64) NOT NULL,
  common_names VARCHAR(255) NOT NULL DEFAULT '',
  color VARCHAR(64) NOT NULL DEFAULT '',
  state_label VARCHAR(32) NOT NULL DEFAULT '',
  solubility TEXT NULL,
  physical_props TEXT NULL,
  chemical_props TEXT NULL,
  common_uses TEXT NULL,
  test_methods TEXT NULL,
  storage_methods TEXT NULL,
  safety_notes TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  review_note VARCHAR(255) NOT NULL DEFAULT '',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_chem_substance_formula_name (canonical_formula, name),
  KEY idx_chem_substance_status (status),
  KEY idx_chem_substance_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_substance_tags (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  substance_id BIGINT UNSIGNED NOT NULL,
  tag VARCHAR(32) NOT NULL,
  UNIQUE KEY uk_chem_sub_tag (substance_id, tag),
  CONSTRAINT fk_chem_sub_tag FOREIGN KEY (substance_id) REFERENCES chem_substances(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_substance_elements (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  substance_id BIGINT UNSIGNED NOT NULL,
  element_id BIGINT UNSIGNED NOT NULL,
  atom_count INT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uk_chem_sub_el (substance_id, element_id),
  CONSTRAINT fk_chem_sub_el_sub FOREIGN KEY (substance_id) REFERENCES chem_substances(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_sub_el_el FOREIGN KEY (element_id) REFERENCES chem_elements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_reactions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  canonical_equation VARCHAR(255) NOT NULL,
  equation VARCHAR(255) NOT NULL,
  ionic_equation VARCHAR(255) NULL,
  conditions VARCHAR(255) NOT NULL DEFAULT '',
  phenomenon TEXT NULL,
  principle TEXT NULL,
  oxidant VARCHAR(128) NULL,
  reductant VARCHAR(128) NULL,
  ox_product VARCHAR(128) NULL,
  re_product VARCHAR(128) NULL,
  electron_transfer TEXT NULL,
  difficulty TINYINT UNSIGNED NOT NULL DEFAULT 2,
  importance TINYINT UNSIGNED NOT NULL DEFAULT 3,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  train_types VARCHAR(255) NOT NULL DEFAULT '',
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  review_note VARCHAR(255) NOT NULL DEFAULT '',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_chem_reaction_canonical (canonical_equation),
  KEY idx_chem_reaction_status (status),
  KEY idx_chem_reaction_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_reaction_tags (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  reaction_id BIGINT UNSIGNED NOT NULL,
  tag VARCHAR(32) NOT NULL,
  UNIQUE KEY uk_chem_rxn_tag (reaction_id, tag),
  CONSTRAINT fk_chem_rxn_tag FOREIGN KEY (reaction_id) REFERENCES chem_reactions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_reaction_species (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  reaction_id BIGINT UNSIGNED NOT NULL,
  role VARCHAR(16) NOT NULL,
  substance_id BIGINT UNSIGNED NULL,
  formula VARCHAR(64) NOT NULL,
  coefficient DECIMAL(10,4) NOT NULL DEFAULT 1,
  state_symbol VARCHAR(8) NULL,
  is_gas TINYINT(1) NOT NULL DEFAULT 0,
  is_precipitate TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  KEY idx_chem_rxn_sp_rxn (reaction_id, role, sort_order),
  CONSTRAINT fk_chem_rxn_sp_rxn FOREIGN KEY (reaction_id) REFERENCES chem_reactions(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_rxn_sp_sub FOREIGN KEY (substance_id) REFERENCES chem_substances(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_experiments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  category VARCHAR(32) NOT NULL DEFAULT 'other',
  purpose TEXT NULL,
  principle TEXT NULL,
  instruments TEXT NULL,
  reagents TEXT NULL,
  steps TEXT NULL,
  phenomenon TEXT NULL,
  conclusion TEXT NULL,
  precautions TEXT NULL,
  safety_notes TEXT NULL,
  is_hazardous TINYINT(1) NOT NULL DEFAULT 0,
  home_forbidden_note VARCHAR(255) NOT NULL DEFAULT '危险实验请在实验室由教师指导下完成，禁止在家自行操作。',
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  review_note VARCHAR(255) NOT NULL DEFAULT '',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_chem_exp_status (status),
  KEY idx_chem_exp_name (name),
  KEY idx_chem_exp_cat (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_experiment_images (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  experiment_id BIGINT UNSIGNED NOT NULL,
  attachment_id BIGINT UNSIGNED NOT NULL,
  caption VARCHAR(255) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  KEY idx_chem_exp_img (experiment_id, sort_order),
  CONSTRAINT fk_chem_exp_img_exp FOREIGN KEY (experiment_id) REFERENCES chem_experiments(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_exp_img_att FOREIGN KEY (attachment_id) REFERENCES attachments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_formulas (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  expression VARCHAR(255) NOT NULL,
  variables TEXT NULL,
  units VARCHAR(128) NOT NULL DEFAULT '',
  applicable_conditions TEXT NULL,
  examples TEXT NULL,
  common_mistakes TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  review_note VARCHAR(255) NOT NULL DEFAULT '',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_chem_formula_status (status),
  KEY idx_chem_formula_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_concepts (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  definition TEXT NULL,
  principle TEXT NULL,
  applicable_conditions TEXT NULL,
  judge_methods TEXT NULL,
  examples TEXT NULL,
  common_mistakes TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  review_note VARCHAR(255) NOT NULL DEFAULT '',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_chem_concept_status (status),
  KEY idx_chem_concept_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_knowledge_points (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  parent_id BIGINT UNSIGNED NULL,
  name VARCHAR(128) NOT NULL,
  description TEXT NULL,
  difficulty TINYINT UNSIGNED NOT NULL DEFAULT 2,
  importance TINYINT UNSIGNED NOT NULL DEFAULT 3,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  review_note VARCHAR(255) NOT NULL DEFAULT '',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_chem_kp_status (status),
  KEY idx_chem_kp_parent (parent_id),
  KEY idx_chem_kp_name (name),
  CONSTRAINT fk_chem_kp_parent FOREIGN KEY (parent_id) REFERENCES chem_knowledge_points(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_questions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  qtype VARCHAR(32) NOT NULL,
  stem TEXT NOT NULL,
  options_json JSON NULL,
  answer TEXT NOT NULL,
  analysis TEXT NULL,
  scoring TEXT NULL,
  difficulty TINYINT UNSIGNED NOT NULL DEFAULT 2,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  review_note VARCHAR(255) NOT NULL DEFAULT '',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_chem_q_status (status),
  KEY idx_chem_q_type (qtype)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_entity_specialties (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  entity_type VARCHAR(32) NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  specialty_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uk_chem_ent_spec (entity_type, entity_id, specialty_id),
  KEY idx_chem_ent_spec_spec (specialty_id),
  CONSTRAINT fk_chem_ent_spec_s FOREIGN KEY (specialty_id) REFERENCES chem_specialties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_entity_categories (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  entity_type VARCHAR(32) NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uk_chem_ent_cat (entity_type, entity_id, category_id),
  KEY idx_chem_ent_cat_cat (category_id),
  CONSTRAINT fk_chem_ent_cat_c FOREIGN KEY (category_id) REFERENCES chem_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_kp_links (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  knowledge_point_id BIGINT UNSIGNED NOT NULL,
  target_type VARCHAR(32) NOT NULL,
  target_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uk_chem_kp_link (knowledge_point_id, target_type, target_id),
  KEY idx_chem_kp_link_tgt (target_type, target_id),
  CONSTRAINT fk_chem_kp_link_kp FOREIGN KEY (knowledge_point_id) REFERENCES chem_knowledge_points(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_question_kps (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  question_id BIGINT UNSIGNED NOT NULL,
  knowledge_point_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uk_chem_q_kp (question_id, knowledge_point_id),
  CONSTRAINT fk_chem_q_kp_q FOREIGN KEY (question_id) REFERENCES chem_questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_q_kp_kp FOREIGN KEY (knowledge_point_id) REFERENCES chem_knowledge_points(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_reaction_substances (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  reaction_id BIGINT UNSIGNED NOT NULL,
  substance_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uk_chem_rxn_sub (reaction_id, substance_id),
  CONSTRAINT fk_chem_rxn_sub_r FOREIGN KEY (reaction_id) REFERENCES chem_reactions(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_rxn_sub_s FOREIGN KEY (substance_id) REFERENCES chem_substances(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_reaction_elements (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  reaction_id BIGINT UNSIGNED NOT NULL,
  element_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uk_chem_rxn_el (reaction_id, element_id),
  CONSTRAINT fk_chem_rxn_el_r FOREIGN KEY (reaction_id) REFERENCES chem_reactions(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_rxn_el_e FOREIGN KEY (element_id) REFERENCES chem_elements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_experiment_reactions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  experiment_id BIGINT UNSIGNED NOT NULL,
  reaction_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uk_chem_exp_rxn (experiment_id, reaction_id),
  CONSTRAINT fk_chem_exp_rxn_e FOREIGN KEY (experiment_id) REFERENCES chem_experiments(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_exp_rxn_r FOREIGN KEY (reaction_id) REFERENCES chem_reactions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_experiment_substances (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  experiment_id BIGINT UNSIGNED NOT NULL,
  substance_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uk_chem_exp_sub (experiment_id, substance_id),
  CONSTRAINT fk_chem_exp_sub_e FOREIGN KEY (experiment_id) REFERENCES chem_experiments(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_exp_sub_s FOREIGN KEY (substance_id) REFERENCES chem_substances(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_kb_links (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  from_type VARCHAR(32) NOT NULL,
  from_id BIGINT UNSIGNED NOT NULL,
  to_type VARCHAR(32) NOT NULL,
  to_id BIGINT UNSIGNED NOT NULL,
  note VARCHAR(128) NOT NULL DEFAULT '',
  UNIQUE KEY uk_chem_kb_link (from_type, from_id, to_type, to_id),
  KEY idx_chem_kb_link_to (to_type, to_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== 化学训练引擎 Phase1 ==========
CREATE TABLE IF NOT EXISTS chem_train_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  pool VARCHAR(16) NOT NULL COMMENT 'formal|test',
  qtype VARCHAR(16) NOT NULL COMMENT 'single|judge|blank',
  answer_type VARCHAR(32) NOT NULL DEFAULT 'text' COMMENT 'text|chem_formula|equation|ionic|numeric（后三者预留）',
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

CREATE TABLE IF NOT EXISTS chem_train_item_links (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  item_id BIGINT UNSIGNED NOT NULL,
  entity_type VARCHAR(32) NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uk_chem_train_item_link (item_id, entity_type, entity_id),
  KEY idx_chem_train_item_link_ent (entity_type, entity_id),
  CONSTRAINT fk_chem_train_item_link_item FOREIGN KEY (item_id) REFERENCES chem_train_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_train_test_grants (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  note VARCHAR(128) NOT NULL DEFAULT '',
  granted_by BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_chem_train_test_grant_user (user_id),
  CONSTRAINT fk_chem_train_test_grant_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_train_sessions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  session_kind VARCHAR(16) NOT NULL DEFAULT 'specialty' COMMENT 'specialty|daily|advanced|wrong_review|wrong_variation',
  daily_date DATE NULL COMMENT '每日训练所属日历日（Asia/Shanghai）',
  specialty_id BIGINT UNSIGNED NULL COMMENT '专项训练必填；daily 可为空（跨专项）',
  category_id BIGINT UNSIGNED NULL COMMENT '专项训练必填；daily 可为空（跨专项）',
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
  duration_ms INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '开始到提交的经过时间（非专注时长）',
  started_at DATETIME(3) NOT NULL,
  submitted_at DATETIME(3) NULL,
  counts_formal_stats TINYINT(1) NOT NULL DEFAULT 1 COMMENT '测试训练为0',
  source_wrong_item_id BIGINT UNSIGNED NULL COMMENT '变式训练来源 chem_wrong_items.id；FK 见错题表之后',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_chem_train_sess_user (user_id, started_at),
  KEY idx_chem_train_sess_status (user_id, status),
  KEY idx_chem_train_sess_daily (user_id, session_kind, daily_date),
  KEY idx_chem_train_sess_kind (user_id, session_kind, started_at),
  KEY idx_chem_train_sess_src_wrong (user_id, source_wrong_item_id),
  CONSTRAINT fk_chem_train_sess_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_train_sess_sp FOREIGN KEY (specialty_id) REFERENCES chem_specialties(id),
  CONSTRAINT fk_chem_train_sess_cat FOREIGN KEY (category_id) REFERENCES chem_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_train_session_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  session_id BIGINT UNSIGNED NOT NULL,
  sort_order INT UNSIGNED NOT NULL,
  item_id BIGINT UNSIGNED NULL,
  item_code VARCHAR(64) NOT NULL DEFAULT '',
  qtype VARCHAR(16) NOT NULL,
  answer_type VARCHAR(32) NOT NULL DEFAULT 'text' COMMENT '创建会话时快照',
  stem TEXT NOT NULL,
  options_json JSON NULL,
  answer TEXT NOT NULL,
  answer_aliases_json JSON NULL,
  analysis TEXT NULL,
  user_answer TEXT NULL,
  grade_result VARCHAR(32) NULL COMMENT 'correct|wrong|pending_review',
  grade_reason VARCHAR(255) NULL COMMENT '判题说明；仅新提交写入',
  answered_at DATETIME(3) NULL,
  UNIQUE KEY uk_chem_train_sess_item_ord (session_id, sort_order),
  KEY idx_chem_train_sess_item_sess (session_id),
  CONSTRAINT fk_chem_train_sess_item_sess FOREIGN KEY (session_id) REFERENCES chem_train_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_wrong_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  item_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'open' COMMENT 'open|consolidating|mastered',
  first_wrong_at DATETIME(3) NOT NULL,
  last_wrong_at DATETIME(3) NOT NULL,
  wrong_count INT UNSIGNED NOT NULL DEFAULT 0,
  correct_after_wrong_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '错后累计明确正确次数（达掌握前）',
  last_correct_at DATETIME(3) NULL,
  first_correct_after_wrong_at DATETIME(3) NULL COMMENT '错后首次明确正确',
  last_grade_result VARCHAR(32) NULL COMMENT 'correct|wrong',
  last_practiced_at DATETIME(3) NULL,
  last_session_kind VARCHAR(16) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_chem_wrong_user_item (user_id, item_id),
  KEY idx_chem_wrong_user_status (user_id, status, last_wrong_at),
  KEY idx_chem_wrong_user_item (user_id, item_id),
  CONSTRAINT fk_chem_wrong_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_wrong_item FOREIGN KEY (item_id) REFERENCES chem_train_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_wrong_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  wrong_item_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  item_id BIGINT UNSIGNED NOT NULL,
  session_id BIGINT UNSIGNED NOT NULL,
  session_item_id BIGINT UNSIGNED NOT NULL,
  session_kind VARCHAR(16) NOT NULL DEFAULT '',
  event_type VARCHAR(16) NOT NULL COMMENT 'wrong|correct',
  occurred_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_chem_wrong_event_si (session_item_id),
  KEY idx_chem_wrong_event_wi (wrong_item_id, occurred_at),
  KEY idx_chem_wrong_event_user_item (user_id, item_id, occurred_at),
  CONSTRAINT fk_chem_wrong_ev_wi FOREIGN KEY (wrong_item_id) REFERENCES chem_wrong_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_wrong_ev_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_wrong_ev_item FOREIGN KEY (item_id) REFERENCES chem_train_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_wrong_ev_sess FOREIGN KEY (session_id) REFERENCES chem_train_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_wrong_ev_si FOREIGN KEY (session_item_id) REFERENCES chem_train_session_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 注意：chem_train_sessions.source_wrong_item_id → chem_wrong_items 的 FK
-- 由 db/migrate_chemistry_wrong_question_phase2.sql 在错题表存在后添加（避免建表顺序循环）。
