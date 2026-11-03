-- AI 识题 · 解答跨模型对比字段
-- 不启用 synchronize。本文件不由仓库自动执行。

ALTER TABLE ai_ocr_analyses
  ADD COLUMN compared_analysis_id BIGINT UNSIGNED NULL COMMENT '对照的先前解答 id' AFTER method_summary_text,
  ADD COLUMN compare_verdict ENUM('agree','differ','uncertain') NULL COMMENT '与对照解答的结论' AFTER compared_analysis_id,
  ADD COLUMN compare_note MEDIUMTEXT NULL COMMENT '对比说明' AFTER compare_verdict,
  ADD KEY idx_aoa_compared_analysis (compared_analysis_id),
  ADD CONSTRAINT fk_aoa_compared_analysis FOREIGN KEY (compared_analysis_id) REFERENCES ai_ocr_analyses(id) ON DELETE SET NULL;
