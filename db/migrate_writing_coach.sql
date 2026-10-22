-- Writing coach sessions (essay structure coach: chinese / english)
CREATE TABLE IF NOT EXISTS writing_coach_sessions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  subject_track ENUM('chinese','english') NOT NULL,
  topic_source ENUM('manual','ai') NOT NULL DEFAULT 'manual',
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
