-- 延伸材料展示用文件名
ALTER TABLE extension_materials
  ADD COLUMN file_name VARCHAR(255) NULL COMMENT '展示用文件名' AFTER question_attachment_id;
