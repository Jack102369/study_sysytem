-- AI reference items (isolated from error_questions / extensions)
CREATE TABLE IF NOT EXISTS ai_reference_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  source_error_question_id BIGINT UNSIGNED NOT NULL,
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
  CONSTRAINT fk_ari_source_eq FOREIGN KEY (source_error_question_id) REFERENCES error_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
