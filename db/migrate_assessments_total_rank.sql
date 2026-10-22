-- 已有库升级：测评测评级总分/班排/校排（若列已存在会报错，可忽略）
USE study_system;

ALTER TABLE assessments ADD COLUMN total_score DECIMAL(8,2) NULL AFTER note;
ALTER TABLE assessments ADD COLUMN class_rank INT UNSIGNED NULL AFTER total_score;
ALTER TABLE assessments ADD COLUMN school_rank INT UNSIGNED NULL AFTER class_rank;
