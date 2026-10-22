-- 化学「每日10分钟」基础巩固：会话类型区分，不新增假专项/分类
-- Asia/Shanghai 日历日写入 daily_date；每日会话 specialty_id/category_id 可为空
-- 不修改历史答题；不改知识正文；不改用户密码

ALTER TABLE chem_train_sessions
  ADD COLUMN session_kind VARCHAR(16) NOT NULL DEFAULT 'specialty'
    COMMENT 'specialty|daily'
    AFTER user_id,
  ADD COLUMN daily_date DATE NULL
    COMMENT '每日训练所属日历日（Asia/Shanghai）'
    AFTER session_kind;

ALTER TABLE chem_train_sessions
  DROP FOREIGN KEY fk_chem_train_sess_sp,
  DROP FOREIGN KEY fk_chem_train_sess_cat;

ALTER TABLE chem_train_sessions
  MODIFY specialty_id BIGINT UNSIGNED NULL,
  MODIFY category_id BIGINT UNSIGNED NULL;

ALTER TABLE chem_train_sessions
  ADD CONSTRAINT fk_chem_train_sess_sp
    FOREIGN KEY (specialty_id) REFERENCES chem_specialties(id),
  ADD CONSTRAINT fk_chem_train_sess_cat
    FOREIGN KEY (category_id) REFERENCES chem_categories(id);

ALTER TABLE chem_train_sessions
  ADD KEY idx_chem_train_sess_daily (user_id, session_kind, daily_date),
  ADD KEY idx_chem_train_sess_kind (user_id, session_kind, started_at);
