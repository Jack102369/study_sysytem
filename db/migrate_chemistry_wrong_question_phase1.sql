-- 化学错题中心第一阶段：主表 + 事件表；session_kind 注释对齐 wrong_review
-- 可重复执行（建表 IF NOT EXISTS；注释可重复 ALTER）

ALTER TABLE chem_train_sessions
  MODIFY COLUMN session_kind VARCHAR(16) NOT NULL DEFAULT 'specialty'
  COMMENT 'specialty|daily|advanced|wrong_review';

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
