-- Listening module (English TTS) - run once on remote study_system DB
-- If table already exists without voice_key, run the ALTER at the bottom only.

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

-- Only if table existed from older migrate without voice_key (skip if column already exists):
-- ALTER TABLE listening_materials
--   ADD COLUMN voice_key VARCHAR(64) NULL COMMENT 'piper voice model key' AFTER attachment_id;
