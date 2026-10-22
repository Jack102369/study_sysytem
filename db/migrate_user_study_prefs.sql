-- 学情对比偏好（仪表盘心情条口径）
CREATE TABLE IF NOT EXISTS user_study_prefs (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  compare_mode ENUM('score','class_rank','school_rank') NOT NULL DEFAULT 'score',
  score_threshold DECIMAL(6,2) NOT NULL DEFAULT 1.00,
  rank_threshold INT UNSIGNED NOT NULL DEFAULT 1,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_usp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
