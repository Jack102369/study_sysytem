-- 高考评测模式（旧数据默认 structure）
ALTER TABLE writing_coach_sessions
  ADD COLUMN review_mode ENUM('structure','gaokao') NOT NULL DEFAULT 'structure'
  AFTER topic_source;
