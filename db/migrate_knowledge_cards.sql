-- 公式/公理/定理/解题思路库（新库直接用此结构）
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
