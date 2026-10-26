-- 高一数学 P1-0A：教材小节种子 + 知识点表 + 题-KP 关联 + 会话 KP 快照列
-- 不改 chem_* / error_questions / users / 小学 math / P0 已执行迁移文件
-- 幂等可重复执行；不 DELETE/TRUNCATE 历史会话
-- 用法（禁止 PowerShell Get-Content 管道）：mysql ... < db/migrate_hs_math_p1_0.sql
-- 本任务默认不自动执行；由人工确认后执行。
USE study_system;

-- ========== 1. 知识点表 ==========
CREATE TABLE IF NOT EXISTS hs_math_knowledge_points (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL COMMENT '稳定编码，如 rja.1.1.01',
  name VARCHAR(128) NOT NULL,
  specialty_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  parent_id BIGINT UNSIGNED NULL COMMENT '可选父知识点',
  summary VARCHAR(512) NULL COMMENT '短说明，可含 LaTeX',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_hs_math_kp_code (code),
  KEY idx_hs_math_kp_spec_cat_active (specialty_id, category_id, is_active, sort_order),
  KEY idx_hs_math_kp_parent (parent_id),
  CONSTRAINT fk_hs_math_kp_specialty FOREIGN KEY (specialty_id) REFERENCES hs_math_specialties(id),
  CONSTRAINT fk_hs_math_kp_category FOREIGN KEY (category_id) REFERENCES hs_math_categories(id),
  CONSTRAINT fk_hs_math_kp_parent FOREIGN KEY (parent_id) REFERENCES hs_math_knowledge_points(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== 2. 训练题-知识点多对多 ==========
CREATE TABLE IF NOT EXISTS hs_math_train_item_kps (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  item_id BIGINT UNSIGNED NOT NULL,
  knowledge_point_id BIGINT UNSIGNED NOT NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0 COMMENT '主知识点标记；应用层保证每题至多一个',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_hs_math_item_kp (item_id, knowledge_point_id),
  KEY idx_hs_math_item_kp_kp (knowledge_point_id),
  CONSTRAINT fk_hs_math_item_kp_item FOREIGN KEY (item_id) REFERENCES hs_math_train_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_hs_math_item_kp_kp FOREIGN KEY (knowledge_point_id) REFERENCES hs_math_knowledge_points(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== 3. 会话题项 KP 快照（兼容旧行 NULL）==========
SET @col_kp_codes := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'hs_math_train_session_items'
    AND COLUMN_NAME = 'knowledge_point_codes_json'
);
SET @sql_kp_codes := IF(
  @col_kp_codes = 0,
  'ALTER TABLE hs_math_train_session_items ADD COLUMN knowledge_point_codes_json JSON NULL COMMENT ''知识点 code 快照数组'' AFTER knowledge_point_id',
  'SELECT 1'
);
PREPARE stmt_kp_codes FROM @sql_kp_codes;
EXECUTE stmt_kp_codes;
DEALLOCATE PREPARE stmt_kp_codes;

SET @col_primary_kp := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'hs_math_train_session_items'
    AND COLUMN_NAME = 'primary_knowledge_point_code'
);
SET @sql_primary_kp := IF(
  @col_primary_kp = 0,
  'ALTER TABLE hs_math_train_session_items ADD COLUMN primary_knowledge_point_code VARCHAR(64) NULL COMMENT ''主知识点 code 快照'' AFTER knowledge_point_codes_json',
  'SELECT 1'
);
PREPARE stmt_primary_kp FROM @sql_primary_kp;
EXECUTE stmt_primary_kp;
DEALLOCATE PREPARE stmt_primary_kp;

-- ========== 4. 教材小节种子（保留 default；幂等）==========
-- 将已有 default 排到章末（不改 code/name/id）
UPDATE hs_math_categories c
INNER JOIN hs_math_specialties s ON s.id = c.specialty_id
SET c.sort_order = 900
WHERE c.code = 'default' AND c.sort_order <> 900;

-- rja-ch1
INSERT INTO hs_math_categories (specialty_id, code, name, sort_order, is_active)
SELECT s.id, v.code, v.name, v.sort_order, 1
FROM hs_math_specialties s
JOIN (
  SELECT '1.1' AS code, '集合的概念' AS name, 10 AS sort_order
  UNION ALL SELECT '1.2', '集合间的基本关系', 20
  UNION ALL SELECT '1.3', '集合的基本运算', 30
  UNION ALL SELECT '1.4', '充分条件与必要条件', 40
  UNION ALL SELECT '1.5', '全称量词与存在量词', 50
) v
WHERE s.code = 'rja-ch1'
  AND NOT EXISTS (
    SELECT 1 FROM hs_math_categories c
    WHERE c.specialty_id = s.id AND c.code = v.code
  );

-- rja-ch2
INSERT INTO hs_math_categories (specialty_id, code, name, sort_order, is_active)
SELECT s.id, v.code, v.name, v.sort_order, 1
FROM hs_math_specialties s
JOIN (
  SELECT '2.1' AS code, '等式性质与不等式性质' AS name, 10 AS sort_order
  UNION ALL SELECT '2.2', '基本不等式', 20
  UNION ALL SELECT '2.3', '二次函数与一元二次方程、不等式', 30
) v
WHERE s.code = 'rja-ch2'
  AND NOT EXISTS (
    SELECT 1 FROM hs_math_categories c
    WHERE c.specialty_id = s.id AND c.code = v.code
  );

-- rja-ch3
INSERT INTO hs_math_categories (specialty_id, code, name, sort_order, is_active)
SELECT s.id, v.code, v.name, v.sort_order, 1
FROM hs_math_specialties s
JOIN (
  SELECT '3.1' AS code, '函数的概念及其表示' AS name, 10 AS sort_order
  UNION ALL SELECT '3.2', '函数的基本性质', 20
  UNION ALL SELECT '3.3', '幂函数', 30
  UNION ALL SELECT '3.4', '函数的应用（一）', 40
) v
WHERE s.code = 'rja-ch3'
  AND NOT EXISTS (
    SELECT 1 FROM hs_math_categories c
    WHERE c.specialty_id = s.id AND c.code = v.code
  );

-- rja-ch4
INSERT INTO hs_math_categories (specialty_id, code, name, sort_order, is_active)
SELECT s.id, v.code, v.name, v.sort_order, 1
FROM hs_math_specialties s
JOIN (
  SELECT '4.1' AS code, '指数' AS name, 10 AS sort_order
  UNION ALL SELECT '4.2', '指数函数', 20
  UNION ALL SELECT '4.3', '对数', 30
  UNION ALL SELECT '4.4', '对数函数', 40
  UNION ALL SELECT '4.5', '函数的应用（二）', 50
) v
WHERE s.code = 'rja-ch4'
  AND NOT EXISTS (
    SELECT 1 FROM hs_math_categories c
    WHERE c.specialty_id = s.id AND c.code = v.code
  );

-- rja-ch5
INSERT INTO hs_math_categories (specialty_id, code, name, sort_order, is_active)
SELECT s.id, v.code, v.name, v.sort_order, 1
FROM hs_math_specialties s
JOIN (
  SELECT '5.1' AS code, '任意角和弧度制' AS name, 10 AS sort_order
  UNION ALL SELECT '5.2', '三角函数的概念', 20
  UNION ALL SELECT '5.3', '诱导公式', 30
  UNION ALL SELECT '5.4', '三角函数的图象与性质', 40
  UNION ALL SELECT '5.5', '三角恒等变换', 50
  UNION ALL SELECT '5.6', '函数 y=Asin(ωx+φ)', 60
  UNION ALL SELECT '5.7', '三角函数的应用', 70
) v
WHERE s.code = 'rja-ch5'
  AND NOT EXISTS (
    SELECT 1 FROM hs_math_categories c
    WHERE c.specialty_id = s.id AND c.code = v.code
  );

-- rjb-ch1（教材第6章）
INSERT INTO hs_math_categories (specialty_id, code, name, sort_order, is_active)
SELECT s.id, v.code, v.name, v.sort_order, 1
FROM hs_math_specialties s
JOIN (
  SELECT '6.1' AS code, '平面向量的概念' AS name, 10 AS sort_order
  UNION ALL SELECT '6.2', '平面向量的运算', 20
  UNION ALL SELECT '6.3', '平面向量基本定理及坐标表示', 30
  UNION ALL SELECT '6.4', '平面向量的应用', 40
) v
WHERE s.code = 'rjb-ch1'
  AND NOT EXISTS (
    SELECT 1 FROM hs_math_categories c
    WHERE c.specialty_id = s.id AND c.code = v.code
  );

-- rjb-ch2（教材第7章；7.3 为选学，名称已确认；is_active=1）
INSERT INTO hs_math_categories (specialty_id, code, name, sort_order, is_active)
SELECT s.id, v.code, v.name, v.sort_order, 1
FROM hs_math_specialties s
JOIN (
  SELECT '7.1' AS code, '复数的概念' AS name, 10 AS sort_order
  UNION ALL SELECT '7.2', '复数的四则运算', 20
  UNION ALL SELECT '7.3', '复数的三角表示', 30
) v
WHERE s.code = 'rjb-ch2'
  AND NOT EXISTS (
    SELECT 1 FROM hs_math_categories c
    WHERE c.specialty_id = s.id AND c.code = v.code
  );

-- rjb-ch3（教材第8章；公开目录 8.1–8.6）
INSERT INTO hs_math_categories (specialty_id, code, name, sort_order, is_active)
SELECT s.id, v.code, v.name, v.sort_order, 1
FROM hs_math_specialties s
JOIN (
  SELECT '8.1' AS code, '基本立体图形' AS name, 10 AS sort_order
  UNION ALL SELECT '8.2', '立体图形的直观图', 20
  UNION ALL SELECT '8.3', '简单几何体的表面积与体积', 30
  UNION ALL SELECT '8.4', '空间点、直线、平面之间的位置关系', 40
  UNION ALL SELECT '8.5', '空间直线、平面的平行', 50
  UNION ALL SELECT '8.6', '空间直线、平面的垂直', 60
) v
WHERE s.code = 'rjb-ch3'
  AND NOT EXISTS (
    SELECT 1 FROM hs_math_categories c
    WHERE c.specialty_id = s.id AND c.code = v.code
  );

-- rjb-ch4（教材第9章；9.3 仅用已确认总标题「统计分析案例」，不入库未核实案例名）
INSERT INTO hs_math_categories (specialty_id, code, name, sort_order, is_active)
SELECT s.id, v.code, v.name, v.sort_order, 1
FROM hs_math_specialties s
JOIN (
  SELECT '9.1' AS code, '随机抽样' AS name, 10 AS sort_order
  UNION ALL SELECT '9.2', '用样本估计总体', 20
  UNION ALL SELECT '9.3', '统计分析案例', 30
) v
WHERE s.code = 'rjb-ch4'
  AND NOT EXISTS (
    SELECT 1 FROM hs_math_categories c
    WHERE c.specialty_id = s.id AND c.code = v.code
  );

-- rjb-ch5（教材第10章）
INSERT INTO hs_math_categories (specialty_id, code, name, sort_order, is_active)
SELECT s.id, v.code, v.name, v.sort_order, 1
FROM hs_math_specialties s
JOIN (
  SELECT '10.1' AS code, '随机事件与概率' AS name, 10 AS sort_order
  UNION ALL SELECT '10.2', '事件的相互独立性', 20
  UNION ALL SELECT '10.3', '频率与概率', 30
) v
WHERE s.code = 'rjb-ch5'
  AND NOT EXISTS (
    SELECT 1 FROM hs_math_categories c
    WHERE c.specialty_id = s.id AND c.code = v.code
  );

-- ========== 5. 第一章知识点种子（仅 rja-ch1；幂等）==========
INSERT INTO hs_math_knowledge_points
  (code, name, specialty_id, category_id, parent_id, summary, sort_order, is_active)
SELECT v.code, v.name, s.id, c.id, NULL, v.summary, v.sort_order, 1
FROM (
  SELECT 'rja.1.1.01' AS code, '集合的含义与元素' AS name, '1.1' AS section_code,
    '集合是具有确定属性的对象全体；元素属于集合记作 ∈。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rja.1.1.02', '集合的表示法', '1.1',
    '常用列举法与描述法表示集合。', 20
  UNION ALL SELECT 'rja.1.1.03', '空集与全集（描述层面）', '1.1',
    '空集不含任何元素，记作 ∅；讨论补集时常引入全集。', 30
  UNION ALL SELECT 'rja.1.2.01', '子集与真子集', '1.2',
    'A⊆B 表示 A 的元素都属于 B；真子集还要求 A≠B。', 10
  UNION ALL SELECT 'rja.1.2.02', '集合相等', '1.2',
    'A=B 当且仅当 A⊆B 且 B⊆A。', 20
  UNION ALL SELECT 'rja.1.3.01', '并集', '1.3',
    'A∪B 由属于 A 或属于 B 的元素组成。', 10
  UNION ALL SELECT 'rja.1.3.02', '交集', '1.3',
    'A∩B 由同时属于 A 与 B 的元素组成。', 20
  UNION ALL SELECT 'rja.1.3.03', '补集', '1.3',
    '在全集 U 下，∁_U A 由 U 中不属于 A 的元素组成。', 30
  UNION ALL SELECT 'rja.1.3.04', '文氏图与综合运算', '1.3',
    '用文氏图理解并、交、补的综合运算。', 40
  UNION ALL SELECT 'rja.1.4.01', '充分条件', '1.4',
    '若 p⇒q，则 p 是 q 的充分条件。', 10
  UNION ALL SELECT 'rja.1.4.02', '必要条件', '1.4',
    '若 p⇒q，则 q 是 p 的必要条件。', 20
  UNION ALL SELECT 'rja.1.4.03', '充要条件', '1.4',
    '若 p⇔q，则 p 是 q 的充要条件。', 30
  UNION ALL SELECT 'rja.1.5.01', '全称量词', '1.5',
    '∀ 表示“任意”；含全称量词的命题对论域中每一个对象成立。', 10
  UNION ALL SELECT 'rja.1.5.02', '存在量词', '1.5',
    '∃ 表示“存在”；含存在量词的命题至少对一个对象成立。', 20
  UNION ALL SELECT 'rja.1.5.03', '含有量词的命题否定', '1.5',
    '否定时全称与存在互换，并否定结论。', 30
) v
INNER JOIN hs_math_specialties s ON s.code = 'rja-ch1'
INNER JOIN hs_math_categories c
  ON c.specialty_id = s.id AND c.code = v.section_code
WHERE NOT EXISTS (
  SELECT 1 FROM hs_math_knowledge_points kp WHERE kp.code = v.code
);
