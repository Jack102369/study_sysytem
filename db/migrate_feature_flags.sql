-- Global feature flags (page/module level), not per-user
CREATE TABLE IF NOT EXISTS feature_flags (
  flag_key VARCHAR(64) PRIMARY KEY,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  module_name VARCHAR(64) NOT NULL,
  label VARCHAR(128) NOT NULL,
  description VARCHAR(255) NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO feature_flags (flag_key, enabled, module_name, label, description)
VALUES (
  'errors.ocr_fill',
  1,
  '错题',
  '识别填入题干/解析',
  '仅控制错题编辑页的识别按钮显示与对应 OCR 接口；不影响 AI 参考页'
)
ON DUPLICATE KEY UPDATE
  module_name = VALUES(module_name),
  label = VALUES(label),
  description = VALUES(description);
