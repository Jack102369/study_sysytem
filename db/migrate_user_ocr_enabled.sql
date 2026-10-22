-- Optional OCR permission (including admin accounts; toggle in user management)
ALTER TABLE users
  ADD COLUMN ocr_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER is_disabled;
