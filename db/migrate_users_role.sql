-- 用户角色与停用
ALTER TABLE users
  ADD COLUMN role ENUM('ADMIN','USER') NOT NULL DEFAULT 'USER' COMMENT '角色' AFTER grade,
  ADD COLUMN is_disabled TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否停用' AFTER role;

-- 将最早注册的用户提升为管理员（可按需改）
UPDATE users SET role = 'ADMIN' WHERE id = (
  SELECT id FROM (SELECT MIN(id) AS id FROM users) t
);
