-- 自检文案 + 对比后是否已修订答案
ALTER TABLE ai_ocr_analyses
  ADD COLUMN self_check_text MEDIUMTEXT NULL COMMENT '模型自检摘要' AFTER method_summary_text,
  ADD COLUMN revised_by_compare TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否因跨模型对比差异而修订过答案' AFTER compare_note;
