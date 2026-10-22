-- 附件原始文件名
ALTER TABLE attachments
  ADD COLUMN original_name VARCHAR(255) NULL COMMENT '原始文件名' AFTER mime_type;
