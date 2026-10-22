-- 延伸训练学习状态：未学 / 学习中 / 已学
ALTER TABLE extension_materials
  ADD COLUMN learn_status ENUM('NOT_STARTED','IN_PROGRESS','DONE')
    NOT NULL DEFAULT 'NOT_STARTED'
    COMMENT '学习状态：未学/学习中/已学'
    AFTER file_name;
