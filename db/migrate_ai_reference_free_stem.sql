-- AI 参考：允许无来源错题（自由粘贴题干生成）
ALTER TABLE ai_reference_items
  DROP FOREIGN KEY fk_ari_source_eq;

ALTER TABLE ai_reference_items
  MODIFY COLUMN source_error_question_id BIGINT UNSIGNED NULL;

ALTER TABLE ai_reference_items
  ADD CONSTRAINT fk_ari_source_eq
  FOREIGN KEY (source_error_question_id) REFERENCES error_questions(id) ON DELETE SET NULL;
