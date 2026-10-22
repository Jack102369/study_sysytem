-- 知识卡片 → 公式/公理/定理/解题思路库（从 v1 背诵卡升级）
-- 若表已是 v2（无 front 列），请跳过本文件。
SET NAMES utf8mb4;

ALTER TABLE knowledge_cards
  ADD COLUMN kind ENUM('formula','axiom','theorem','method') NOT NULL DEFAULT 'method' AFTER subject_id,
  ADD COLUMN title VARCHAR(128) NOT NULL DEFAULT '' AFTER kind,
  ADD COLUMN content TEXT NULL AFTER title;

UPDATE knowledge_cards
SET
  title = CASE WHEN title = '' OR title IS NULL THEN LEFT(CONVERT(IFNULL(front, '未命名') USING utf8mb4), 128) ELSE title END,
  content = CASE WHEN content IS NULL OR content = '' THEN CONVERT(IFNULL(back, '') USING utf8mb4) ELSE content END;

ALTER TABLE knowledge_cards
  MODIFY COLUMN status ENUM('new','learning','mastered','draft','active') NOT NULL DEFAULT 'active';

UPDATE knowledge_cards SET status = 'active' WHERE status IN ('new', 'learning', 'mastered');

ALTER TABLE knowledge_cards
  MODIFY COLUMN status ENUM('draft','active') NOT NULL DEFAULT 'active';

UPDATE knowledge_cards SET content = '' WHERE content IS NULL;
ALTER TABLE knowledge_cards MODIFY COLUMN content TEXT NOT NULL;
ALTER TABLE knowledge_cards MODIFY COLUMN title VARCHAR(128) NOT NULL;

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

INSERT IGNORE INTO error_question_knowledge_cards (user_id, error_question_id, knowledge_card_id)
SELECT user_id, source_error_question_id, id
FROM knowledge_cards
WHERE source_error_question_id IS NOT NULL;

ALTER TABLE knowledge_cards DROP FOREIGN KEY fk_kc_source_eq;
ALTER TABLE knowledge_cards DROP COLUMN front;
ALTER TABLE knowledge_cards DROP COLUMN back;
ALTER TABLE knowledge_cards DROP COLUMN source_error_question_id;
ALTER TABLE knowledge_cards DROP COLUMN next_review_at;
ALTER TABLE knowledge_cards DROP COLUMN review_count;
ALTER TABLE knowledge_cards DROP COLUMN ease;
