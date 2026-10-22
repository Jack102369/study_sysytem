-- 化学训练：答案类型 + 判题原因（可回滚迁移）
-- 不修改历史 grade_result；不改正文知识。

ALTER TABLE chem_train_items
  ADD COLUMN answer_type VARCHAR(32) NOT NULL DEFAULT 'text'
    COMMENT 'text|chem_formula|equation|ionic|numeric（后三者预留）'
    AFTER qtype;

ALTER TABLE chem_train_session_items
  ADD COLUMN answer_type VARCHAR(32) NOT NULL DEFAULT 'text'
    COMMENT '创建会话时从题目快照，避免后续改标影响历史'
    AFTER qtype;

ALTER TABLE chem_train_session_items
  ADD COLUMN grade_reason VARCHAR(255) NULL
    COMMENT '判题说明（如化学式大小写错误）；仅新提交写入'
    AFTER grade_result;
