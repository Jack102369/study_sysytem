-- add voice_key for Piper voice selection
ALTER TABLE listening_materials
  ADD COLUMN voice_key VARCHAR(64) NULL COMMENT 'piper voice model key' AFTER attachment_id;
