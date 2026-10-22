-- Optional AI reference permission (including admin accounts; toggle in user management)
ALTER TABLE users
  ADD COLUMN ai_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER ocr_enabled;
