-- AI 识题 · 作答批改（独立模块扩展；与错题本/高一数学隔离）
-- 不修改既有业务表；不启用 synchronize。本文件不由仓库自动执行。

CREATE TABLE IF NOT EXISTS ai_ocr_gradings (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  recognition_id BIGINT UNSIGNED NOT NULL,
  provider ENUM('qwen','deepseek') NOT NULL,
  status ENUM('pending','succeeded','failed') NOT NULL DEFAULT 'pending',
  answer_attachment_id BIGINT UNSIGNED NULL COMMENT '作答图片附件',
  student_answer_raw MEDIUMTEXT NULL COMMENT '作答图 OCR 原文；不可被用户修正覆盖',
  student_answer_snapshot MEDIUMTEXT NULL COMMENT '实际送入模型的作答快照；空作答为 NULL',
  question_text_snapshot MEDIUMTEXT NOT NULL COMMENT '实际送入模型的题目快照',
  score TINYINT UNSIGNED NULL COMMENT '0-100',
  verdict ENUM('correct','partial','wrong','no_answer') NULL,
  feedback_text MEDIUMTEXT NULL COMMENT '过程点评',
  correct_answer_text MEDIUMTEXT NULL,
  correct_analysis_text MEDIUMTEXT NULL,
  model VARCHAR(64) NULL,
  prompt_version VARCHAR(32) NULL,
  error_code VARCHAR(64) NULL,
  error_message VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_aog_user_created (user_id, created_at),
  KEY idx_aog_recognition_created (recognition_id, created_at),
  KEY idx_aog_answer_attachment (answer_attachment_id),
  CONSTRAINT fk_aog_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_aog_recognition FOREIGN KEY (recognition_id) REFERENCES ai_ocr_recognitions(id) ON DELETE CASCADE,
  CONSTRAINT fk_aog_answer_att FOREIGN KEY (answer_attachment_id) REFERENCES attachments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
