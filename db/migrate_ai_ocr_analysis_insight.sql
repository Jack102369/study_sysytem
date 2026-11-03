-- AI 识题 · 解答扩展：考点 + 解题思路总结
-- 不启用 synchronize。本文件不由仓库自动执行。

ALTER TABLE ai_ocr_analyses
  ADD COLUMN knowledge_points_text MEDIUMTEXT NULL COMMENT '本题考查的知识点' AFTER ai_analysis_text,
  ADD COLUMN method_summary_text MEDIUMTEXT NULL COMMENT '解题思路总结' AFTER knowledge_points_text;
