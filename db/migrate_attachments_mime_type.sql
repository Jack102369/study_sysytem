-- Office/OpenXML 等 MIME 可超过 64 字符
ALTER TABLE attachments
  MODIFY COLUMN mime_type VARCHAR(128) NULL;
