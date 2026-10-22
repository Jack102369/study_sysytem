-- 提高与挑战训练：session_kind 允许 advanced（无结构变更，仅注释对齐）
-- 不修改历史答题数据；不新增虚拟专项/分类；不影响每日完成次数统计

ALTER TABLE chem_train_sessions
  MODIFY COLUMN session_kind VARCHAR(16) NOT NULL DEFAULT 'specialty'
    COMMENT 'specialty|daily|advanced';
