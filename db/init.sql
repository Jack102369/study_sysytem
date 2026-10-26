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

-- ========== 高一数学 P0（与 db/migrate_hs_math_p0.sql 对齐）==========

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
  qtype VARCHAR(16) NOT NULL COMMENT 'single|multi|judge|numeric|application',
  stem TEXT NOT NULL,
  options_json JSON NULL,
  answer_payload_json JSON NOT NULL COMMENT '结构化标准答案',
  analysis TEXT NULL,
  source_type VARCHAR(16) NOT NULL DEFAULT 'original' COMMENT 'original|adapted|past_exam',
  source_year SMALLINT UNSIGNED NULL COMMENT '考试年份，可空',
  source_exam_name VARCHAR(128) NULL COMMENT '试卷名称',
  source_question_no VARCHAR(32) NULL COMMENT '题号',
  source_reference VARCHAR(512) NULL COMMENT '出处/出版信息/链接，管理员可见',
  source_adaptation_note VARCHAR(512) NULL COMMENT '改编说明',
  source_verification_status VARCHAR(16) NOT NULL DEFAULT 'unverified' COMMENT 'unverified|verified',
  source_license_status VARCHAR(16) NOT NULL DEFAULT 'unknown' COMMENT 'unknown|permitted|restricted|forbidden',
  difficulty TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1基础 2提高 3压轴',
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
  KEY idx_hs_math_item_source_type (source_type, source_verification_status, source_license_status),
  CONSTRAINT fk_hs_math_train_item_sp FOREIGN KEY (specialty_id) REFERENCES hs_math_specialties(id),
  CONSTRAINT fk_hs_math_train_item_cat FOREIGN KEY (category_id) REFERENCES hs_math_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hs_math_train_sessions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  session_kind VARCHAR(16) NOT NULL DEFAULT 'specialty' COMMENT 'specialty|daily|advanced|wrong_review|wrong_variation',
  daily_date DATE NULL COMMENT 'P1每日用；P0预留',
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
  knowledge_point_codes_json JSON NULL COMMENT '知识点 code 快照数组',
  primary_knowledge_point_code VARCHAR(64) NULL COMMENT '主知识点 code 快照',
  specialty_id BIGINT UNSIGNED NULL,
  category_id BIGINT UNSIGNED NULL,
  difficulty TINYINT UNSIGNED NULL,
  content_version INT NOT NULL DEFAULT 1,
  grade_rule_version VARCHAR(16) NOT NULL DEFAULT 'v1',
  user_answer_payload_json JSON NULL COMMENT '覆盖作答',
  grade_result VARCHAR(32) NULL COMMENT 'correct|wrong|pending_review|pending_ai|grading|graded|review_required|grading_failed',
  grade_reason VARCHAR(255) NULL,
  ai_grade_json JSON NULL COMMENT 'APPLICATION-3：AI 批改结构化结果',
  ai_model VARCHAR(64) NULL COMMENT '批改所用模型名',
  ai_graded_at DATETIME(3) NULL COMMENT 'AI 批改完成时间',
  ai_attempt_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'AI 批改尝试次数',
  answered_at DATETIME(3) NULL,
  UNIQUE KEY uk_hs_math_sess_item_ord (session_id, sort_order),
  KEY idx_hs_math_sess_item_sess (session_id),
  KEY idx_hs_math_sess_item_item (item_id),
  CONSTRAINT fk_hs_math_sess_item_sess FOREIGN KEY (session_id) REFERENCES hs_math_train_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_hs_math_sess_item_item FOREIGN KEY (item_id) REFERENCES hs_math_train_items(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- APPLICATION-2A：应用题解答图片元数据（与 db/migrate_hs_math_application2_images.sql 对齐；默认未在已有库执行）
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

-- ========== DIAGRAM-1B：题干插图（与 db/migrate_hs_math_item_diagrams.sql 对齐）==========

CREATE TABLE IF NOT EXISTS hs_math_train_item_diagram_objects (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  content_sha256 CHAR(64) NOT NULL COMMENT '规范化后文件字节 SHA-256',
  storage_key VARCHAR(512) NOT NULL COMMENT '私有相对路径 hs-math/item-diagrams/{aa}/{sha}.bin',
  mime_type VARCHAR(64) NOT NULL COMMENT 'image/png|image/webp|image/svg+xml',
  size_bytes INT UNSIGNED NOT NULL,
  width_px INT UNSIGNED NULL,
  height_px INT UNSIGNED NULL,
  sanitize_status VARCHAR(16) NOT NULL DEFAULT 'passed' COMMENT 'passed|rasterized_png|rejected_not_stored',
  source_mime_type VARCHAR(64) NULL COMMENT '若由 SVG 栅格化，记录源 MIME',
  uploaded_by BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_hs_math_diagram_obj_sha (content_sha256),
  UNIQUE KEY uk_hs_math_diagram_obj_key (storage_key),
  KEY idx_hs_math_diagram_obj_uploader (uploaded_by, created_at),
  CONSTRAINT fk_hs_math_diagram_obj_user
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='题干插图不可变对象；禁止原地覆盖';

CREATE TABLE IF NOT EXISTS hs_math_train_item_diagrams (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  item_id BIGINT UNSIGNED NOT NULL,
  object_id BIGINT UNSIGNED NOT NULL,
  sort_order TINYINT UNSIGNED NOT NULL COMMENT '1..3 展示顺序',
  alt_text VARCHAR(256) NULL COMMENT '无答案暗示的短说明',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_hs_math_item_diagram_ord (item_id, sort_order),
  KEY idx_hs_math_item_diagram_obj (object_id),
  CONSTRAINT fk_hs_math_item_diagram_item
    FOREIGN KEY (item_id) REFERENCES hs_math_train_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_hs_math_item_diagram_obj
    FOREIGN KEY (object_id) REFERENCES hs_math_train_item_diagram_objects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='题目当前配图关联；每题最多3张';

CREATE TABLE IF NOT EXISTS hs_math_train_session_item_diagrams (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  session_item_id BIGINT UNSIGNED NOT NULL,
  object_id BIGINT UNSIGNED NOT NULL,
  sort_order TINYINT UNSIGNED NOT NULL,
  alt_text VARCHAR(256) NULL,
  content_sha256 CHAR(64) NOT NULL COMMENT '开训时冗余校验',
  mime_type VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_hs_math_sess_item_diagram_ord (session_item_id, sort_order),
  KEY idx_hs_math_sess_item_diagram_obj (object_id),
  CONSTRAINT fk_hs_math_sess_item_diagram_si
    FOREIGN KEY (session_item_id) REFERENCES hs_math_train_session_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_hs_math_sess_item_diagram_obj
    FOREIGN KEY (object_id) REFERENCES hs_math_train_item_diagram_objects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='开训事务内插图快照；不随当前题目关联变更';

-- ========== 高一数学 P1-0A（与 db/migrate_hs_math_p1_0.sql 对齐）==========

CREATE TABLE IF NOT EXISTS hs_math_knowledge_points (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL COMMENT '稳定编码，如 rja.1.1.01',
  name VARCHAR(128) NOT NULL,
  specialty_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  parent_id BIGINT UNSIGNED NULL COMMENT '可选父知识点',
  summary VARCHAR(512) NULL COMMENT '短说明，可含 LaTeX',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_hs_math_kp_code (code),
  KEY idx_hs_math_kp_spec_cat_active (specialty_id, category_id, is_active, sort_order),
  KEY idx_hs_math_kp_parent (parent_id),
  CONSTRAINT fk_hs_math_kp_specialty FOREIGN KEY (specialty_id) REFERENCES hs_math_specialties(id),
  CONSTRAINT fk_hs_math_kp_category FOREIGN KEY (category_id) REFERENCES hs_math_categories(id),
  CONSTRAINT fk_hs_math_kp_parent FOREIGN KEY (parent_id) REFERENCES hs_math_knowledge_points(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hs_math_train_item_kps (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  item_id BIGINT UNSIGNED NOT NULL,
  knowledge_point_id BIGINT UNSIGNED NOT NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0 COMMENT '主知识点标记；应用层保证每题至多一个',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_hs_math_item_kp (item_id, knowledge_point_id),
  KEY idx_hs_math_item_kp_kp (knowledge_point_id),
  CONSTRAINT fk_hs_math_item_kp_item FOREIGN KEY (item_id) REFERENCES hs_math_train_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_hs_math_item_kp_kp FOREIGN KEY (knowledge_point_id) REFERENCES hs_math_knowledge_points(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== 高一数学 P1-0F-C3B（人工审核历史；与 migrate_hs_math_p1_0fc3b.sql 对齐）==========
-- passed ≠ train_items.status=approved；禁止迁移时插入虚假审核记录。

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
  COMMENT='人工审核历史；passed不等于正式批准';

-- ========== 高一数学 P1-FUNC-CORE-1A（来源+方法；与 migrate_hs_math_p1_func_core1a.sql 对齐）==========
-- 注意：既有库须执行迁移草案；本段供全新 init。迁移执行前运行中库可能尚无这些对象。

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='题目与解题方法多对多';

INSERT INTO hs_math_specialties (code, name, book_code, chapter_no, intro, sort_order, is_active)
SELECT * FROM (
  SELECT 'rja-ch1' AS code, '集合与常用逻辑用语' AS name, '必修一' AS book_code, 1 AS chapter_no, '' AS intro, 10 AS sort_order, 1 AS is_active
  UNION ALL SELECT 'rja-ch2', '一元二次函数、方程和不等式', '必修一', 2, '', 20, 1
  UNION ALL SELECT 'rja-ch3', '函数的概念与性质', '必修一', 3, '', 30, 1
  UNION ALL SELECT 'rja-ch4', '指数函数与对数函数', '必修一', 4, '', 40, 1
  UNION ALL SELECT 'rja-ch5', '三角函数', '必修一', 5, '', 50, 1
  UNION ALL SELECT 'rjb-ch1', '平面向量及其应用', '必修二', 1, '', 60, 1
  UNION ALL SELECT 'rjb-ch2', '复数', '必修二', 2, '', 70, 1
  UNION ALL SELECT 'rjb-ch3', '立体几何初步', '必修二', 3, '', 80, 1
  UNION ALL SELECT 'rjb-ch4', '统计', '必修二', 4, '', 90, 1
  UNION ALL SELECT 'rjb-ch5', '概率', '必修二', 5, '', 100, 1
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM hs_math_specialties LIMIT 1);

INSERT INTO hs_math_categories (specialty_id, code, name, sort_order, is_active)
SELECT s.id, 'default', '综合练习', 900, 1
FROM hs_math_specialties s
WHERE NOT EXISTS (
  SELECT 1 FROM hs_math_categories c WHERE c.specialty_id = s.id AND c.code = 'default'
);

-- 教材小节种子（P1-0A；幂等；与 migrate_hs_math_p1_0.sql 对齐）
INSERT INTO hs_math_categories (specialty_id, code, name, sort_order, is_active)
SELECT s.id, v.code, v.name, v.sort_order, 1
FROM hs_math_specialties s
JOIN (
  SELECT '1.1' AS code, '集合的概念' AS name, 10 AS sort_order, 'rja-ch1' AS specialty_code
  UNION ALL SELECT '1.2', '集合间的基本关系', 20, 'rja-ch1'
  UNION ALL SELECT '1.3', '集合的基本运算', 30, 'rja-ch1'
  UNION ALL SELECT '1.4', '充分条件与必要条件', 40, 'rja-ch1'
  UNION ALL SELECT '1.5', '全称量词与存在量词', 50, 'rja-ch1'
  UNION ALL SELECT '2.1', '等式性质与不等式性质', 10, 'rja-ch2'
  UNION ALL SELECT '2.2', '基本不等式', 20, 'rja-ch2'
  UNION ALL SELECT '2.3', '二次函数与一元二次方程、不等式', 30, 'rja-ch2'
  UNION ALL SELECT '3.1', '函数的概念及其表示', 10, 'rja-ch3'
  UNION ALL SELECT '3.2', '函数的基本性质', 20, 'rja-ch3'
  UNION ALL SELECT '3.3', '幂函数', 30, 'rja-ch3'
  UNION ALL SELECT '3.4', '函数的应用（一）', 40, 'rja-ch3'
  UNION ALL SELECT '4.1', '指数', 10, 'rja-ch4'
  UNION ALL SELECT '4.2', '指数函数', 20, 'rja-ch4'
  UNION ALL SELECT '4.3', '对数', 30, 'rja-ch4'
  UNION ALL SELECT '4.4', '对数函数', 40, 'rja-ch4'
  UNION ALL SELECT '4.5', '函数的应用（二）', 50, 'rja-ch4'
  UNION ALL SELECT '5.1', '任意角和弧度制', 10, 'rja-ch5'
  UNION ALL SELECT '5.2', '三角函数的概念', 20, 'rja-ch5'
  UNION ALL SELECT '5.3', '诱导公式', 30, 'rja-ch5'
  UNION ALL SELECT '5.4', '三角函数的图象与性质', 40, 'rja-ch5'
  UNION ALL SELECT '5.5', '三角恒等变换', 50, 'rja-ch5'
  UNION ALL SELECT '5.6', '函数 y=Asin(ωx+φ)', 60, 'rja-ch5'
  UNION ALL SELECT '5.7', '三角函数的应用', 70, 'rja-ch5'
  UNION ALL SELECT '6.1', '平面向量的概念', 10, 'rjb-ch1'
  UNION ALL SELECT '6.2', '平面向量的运算', 20, 'rjb-ch1'
  UNION ALL SELECT '6.3', '平面向量基本定理及坐标表示', 30, 'rjb-ch1'
  UNION ALL SELECT '6.4', '平面向量的应用', 40, 'rjb-ch1'
  UNION ALL SELECT '7.1', '复数的概念', 10, 'rjb-ch2'
  UNION ALL SELECT '7.2', '复数的四则运算', 20, 'rjb-ch2'
  UNION ALL SELECT '7.3', '复数的三角表示', 30, 'rjb-ch2'
  UNION ALL SELECT '8.1', '基本立体图形', 10, 'rjb-ch3'
  UNION ALL SELECT '8.2', '立体图形的直观图', 20, 'rjb-ch3'
  UNION ALL SELECT '8.3', '简单几何体的表面积与体积', 30, 'rjb-ch3'
  UNION ALL SELECT '8.4', '空间点、直线、平面之间的位置关系', 40, 'rjb-ch3'
  UNION ALL SELECT '8.5', '空间直线、平面的平行', 50, 'rjb-ch3'
  UNION ALL SELECT '8.6', '空间直线、平面的垂直', 60, 'rjb-ch3'
  UNION ALL SELECT '9.1', '随机抽样', 10, 'rjb-ch4'
  UNION ALL SELECT '9.2', '用样本估计总体', 20, 'rjb-ch4'
  UNION ALL SELECT '9.3', '统计分析案例', 30, 'rjb-ch4'
  UNION ALL SELECT '10.1', '随机事件与概率', 10, 'rjb-ch5'
  UNION ALL SELECT '10.2', '事件的相互独立性', 20, 'rjb-ch5'
  UNION ALL SELECT '10.3', '频率与概率', 30, 'rjb-ch5'
) v ON s.code = v.specialty_code
WHERE NOT EXISTS (
  SELECT 1 FROM hs_math_categories c
  WHERE c.specialty_id = s.id AND c.code = v.code
);

INSERT INTO hs_math_knowledge_points
  (code, name, specialty_id, category_id, parent_id, summary, sort_order, is_active)
SELECT v.code, v.name, s.id, c.id, NULL, v.summary, v.sort_order, 1
FROM (
  SELECT 'rja.1.1.01' AS code, '集合的含义与元素' AS name, '1.1' AS section_code,
    '集合是具有确定属性的对象全体；元素属于集合记作 ∈。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rja.1.1.02', '集合的表示法', '1.1',
    '常用列举法与描述法表示集合。', 20
  UNION ALL SELECT 'rja.1.1.03', '空集与全集（描述层面）', '1.1',
    '空集不含任何元素，记作 ∅；讨论补集时常引入全集。', 30
  UNION ALL SELECT 'rja.1.2.01', '子集与真子集', '1.2',
    'A⊆B 表示 A 的元素都属于 B；真子集还要求 A≠B。', 10
  UNION ALL SELECT 'rja.1.2.02', '集合相等', '1.2',
    'A=B 当且仅当 A⊆B 且 B⊆A。', 20
  UNION ALL SELECT 'rja.1.3.01', '并集', '1.3',
    'A∪B 由属于 A 或属于 B 的元素组成。', 10
  UNION ALL SELECT 'rja.1.3.02', '交集', '1.3',
    'A∩B 由同时属于 A 与 B 的元素组成。', 20
  UNION ALL SELECT 'rja.1.3.03', '补集', '1.3',
    '在全集 U 下，∁_U A 由 U 中不属于 A 的元素组成。', 30
  UNION ALL SELECT 'rja.1.3.04', '文氏图与综合运算', '1.3',
    '用文氏图理解并、交、补的综合运算。', 40
  UNION ALL SELECT 'rja.1.4.01', '充分条件', '1.4',
    '若 p⇒q，则 p 是 q 的充分条件。', 10
  UNION ALL SELECT 'rja.1.4.02', '必要条件', '1.4',
    '若 p⇒q，则 q 是 p 的必要条件。', 20
  UNION ALL SELECT 'rja.1.4.03', '充要条件', '1.4',
    '若 p⇔q，则 p 是 q 的充要条件。', 30
  UNION ALL SELECT 'rja.1.5.01', '全称量词', '1.5',
    '∀ 表示“任意”；含全称量词的命题对论域中每一个对象成立。', 10
  UNION ALL SELECT 'rja.1.5.02', '存在量词', '1.5',
    '∃ 表示“存在”；含存在量词的命题至少对一个对象成立。', 20
  UNION ALL SELECT 'rja.1.5.03', '含有量词的命题否定', '1.5',
    '否定时全称与存在互换，并否定结论。', 30
) v
INNER JOIN hs_math_specialties s ON s.code = 'rja-ch1'
INNER JOIN hs_math_categories c
  ON c.specialty_id = s.id AND c.code = v.section_code
WHERE NOT EXISTS (
  SELECT 1 FROM hs_math_knowledge_points kp WHERE kp.code = v.code
);
