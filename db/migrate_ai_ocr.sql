-- AI 识题（独立模块：识图 + 解析；与错题本/高一数学数据隔离）
-- 不修改既有业务表；不启用 synchronize。本文件不由仓库自动执行。

CREATE TABLE IF NOT EXISTS ai_ocr_recognitions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  subject ENUM('math','physics','chemistry') NOT NULL,
  attachment_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending','succeeded','failed') NOT NULL DEFAULT 'pending',
  recognized_text_raw MEDIUMTEXT NULL COMMENT 'Qwen 原始识别；不可被用户修正覆盖',
  engine VARCHAR(64) NULL,
  model VARCHAR(64) NULL,
  prompt_version VARCHAR(32) NULL,
  error_code VARCHAR(64) NULL,
  error_message VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_aor_user_created (user_id, created_at),
  KEY idx_aor_user_subject_created (user_id, subject, created_at),
  KEY idx_aor_attachment (attachment_id),
  CONSTRAINT fk_aor_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_aor_att FOREIGN KEY (attachment_id) REFERENCES attachments(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_ocr_analyses (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  recognition_id BIGINT UNSIGNED NOT NULL,
  provider ENUM('qwen','deepseek') NOT NULL,
  status ENUM('pending','succeeded','failed') NOT NULL DEFAULT 'pending',
  input_text_snapshot MEDIUMTEXT NULL COMMENT '实际送入解析模型的文字快照',
  ai_answer_text MEDIUMTEXT NULL,
  ai_analysis_text MEDIUMTEXT NULL,
  model VARCHAR(64) NULL,
  prompt_version VARCHAR(32) NULL,
  error_code VARCHAR(64) NULL,
  error_message VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_aoa_recognition_created (recognition_id, created_at),
  KEY idx_aoa_user_created (user_id, created_at),
  CONSTRAINT fk_aoa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_aoa_recognition FOREIGN KEY (recognition_id) REFERENCES ai_ocr_recognitions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
