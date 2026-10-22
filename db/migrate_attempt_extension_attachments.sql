-- 再练记录答案图、延伸训练题目文件
ALTER TABLE error_attempts
  ADD COLUMN answer_attachment_id BIGINT UNSIGNED NULL COMMENT '再练答案附件' AFTER note;

ALTER TABLE extensions
  ADD COLUMN question_attachment_id BIGINT UNSIGNED NULL COMMENT '延伸题附件' AFTER answer_text;
