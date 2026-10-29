-- HS-Math: 训练会话 category_id 可空（整章抽题）
-- 幂等：已为 NULL 时再执行无害（同定义）
ALTER TABLE hs_math_train_sessions
  MODIFY COLUMN category_id BIGINT UNSIGNED NULL COMMENT '小节；NULL=整章抽题';
