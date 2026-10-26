-- HS-MATH DIAGRAM-1B：题干插图（不可变对象 + 题目关联 + session 快照）
-- 显式迁移；禁止 TypeORM synchronize。
-- 本文件由运维/授权阶段执行；DIAGRAM-1B 实现阶段默认不在真实 study_system 执行。

CREATE TABLE IF NOT EXISTS hs_math_train_item_diagram_objects (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  content_sha256 CHAR(64) NOT NULL COMMENT '规范化后文件字节 SHA-256',
  storage_key VARCHAR(512) NOT NULL COMMENT '私有相对路径 hs-math/item-diagrams/{aa}/{sha}.bin',
  mime_type VARCHAR(64) NOT NULL COMMENT 'image/png|image/webp|image/svg+xml',
  size_bytes INT UNSIGNED NOT NULL,
  width_px INT UNSIGNED NULL,
  height_px INT UNSIGNED NULL,
  sanitize_status VARCHAR(16) NOT NULL DEFAULT 'passed' COMMENT 'passed|rasterized_png|rejected_not_stored',
  source_mime_type VARCHAR(64) NULL COMMENT '若由 SVG 栅格化，记录源 MIME',
  uploaded_by BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_hs_math_diagram_obj_sha (content_sha256),
  UNIQUE KEY uk_hs_math_diagram_obj_key (storage_key),
  KEY idx_hs_math_diagram_obj_uploader (uploaded_by, created_at),
  CONSTRAINT fk_hs_math_diagram_obj_user
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='题干插图不可变对象；禁止原地覆盖';

CREATE TABLE IF NOT EXISTS hs_math_train_item_diagrams (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  item_id BIGINT UNSIGNED NOT NULL,
  object_id BIGINT UNSIGNED NOT NULL,
  sort_order TINYINT UNSIGNED NOT NULL COMMENT '1..3 展示顺序',
  alt_text VARCHAR(256) NULL COMMENT '无答案暗示的短说明',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_hs_math_item_diagram_ord (item_id, sort_order),
  KEY idx_hs_math_item_diagram_obj (object_id),
  CONSTRAINT fk_hs_math_item_diagram_item
    FOREIGN KEY (item_id) REFERENCES hs_math_train_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_hs_math_item_diagram_obj
    FOREIGN KEY (object_id) REFERENCES hs_math_train_item_diagram_objects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='题目当前配图关联；每题最多3张';

CREATE TABLE IF NOT EXISTS hs_math_train_session_item_diagrams (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  session_item_id BIGINT UNSIGNED NOT NULL,
  object_id BIGINT UNSIGNED NOT NULL,
  sort_order TINYINT UNSIGNED NOT NULL,
  alt_text VARCHAR(256) NULL,
  content_sha256 CHAR(64) NOT NULL COMMENT '开训时冗余校验',
  mime_type VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_hs_math_sess_item_diagram_ord (session_item_id, sort_order),
  KEY idx_hs_math_sess_item_diagram_obj (object_id),
  CONSTRAINT fk_hs_math_sess_item_diagram_si
    FOREIGN KEY (session_item_id) REFERENCES hs_math_train_session_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_hs_math_sess_item_diagram_obj
    FOREIGN KEY (object_id) REFERENCES hs_math_train_item_diagram_objects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='开训事务内插图快照；不随当前题目关联变更';
