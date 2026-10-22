-- 高一化学专项训练中心 · 阶段二：结构化知识库
USE study_system;

-- ========== 公共：内容状态 ==========
-- draft | pending_review | published | rejected | archived

CREATE TABLE IF NOT EXISTS chem_elements (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  symbol VARCHAR(8) NOT NULL,
  name_zh VARCHAR(32) NOT NULL,
  name_en VARCHAR(64) NOT NULL DEFAULT '',
  atomic_number INT UNSIGNED NOT NULL,
  atomic_mass DECIMAL(12,6) NULL,
  period_no TINYINT UNSIGNED NULL,
  group_label VARCHAR(16) NULL,
  category VARCHAR(32) NULL COMMENT '金属/非金属/惰性气体等',
  common_valences VARCHAR(64) NULL COMMENT '如 +1,-1',
  atom_structure TEXT NULL,
  electron_config VARCHAR(128) NULL,
  common_compounds TEXT NULL,
  key_properties TEXT NULL,
  common_uses TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  review_note VARCHAR(255) NOT NULL DEFAULT '',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_chem_element_symbol (symbol),
  UNIQUE KEY uk_chem_element_atomic_number (atomic_number),
  KEY idx_chem_element_status (status),
  KEY idx_chem_element_name (name_zh)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_substances (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  canonical_formula VARCHAR(64) NOT NULL,
  common_names VARCHAR(255) NOT NULL DEFAULT '' COMMENT '俗称，逗号分隔',
  color VARCHAR(64) NOT NULL DEFAULT '',
  state_label VARCHAR(32) NOT NULL DEFAULT '' COMMENT '固/液/气',
  solubility TEXT NULL,
  physical_props TEXT NULL,
  chemical_props TEXT NULL,
  common_uses TEXT NULL,
  test_methods TEXT NULL,
  storage_methods TEXT NULL,
  safety_notes TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  review_note VARCHAR(255) NOT NULL DEFAULT '',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_chem_substance_formula_name (canonical_formula, name),
  KEY idx_chem_substance_status (status),
  KEY idx_chem_substance_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_substance_tags (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  substance_id BIGINT UNSIGNED NOT NULL,
  tag VARCHAR(32) NOT NULL COMMENT 'elemental|oxide|acid|base|salt|organic|other',
  UNIQUE KEY uk_chem_sub_tag (substance_id, tag),
  CONSTRAINT fk_chem_sub_tag FOREIGN KEY (substance_id) REFERENCES chem_substances(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_substance_elements (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  substance_id BIGINT UNSIGNED NOT NULL,
  element_id BIGINT UNSIGNED NOT NULL,
  atom_count INT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uk_chem_sub_el (substance_id, element_id),
  CONSTRAINT fk_chem_sub_el_sub FOREIGN KEY (substance_id) REFERENCES chem_substances(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_sub_el_el FOREIGN KEY (element_id) REFERENCES chem_elements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_reactions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  canonical_equation VARCHAR(255) NOT NULL COMMENT '规范化配平方程式，去重用',
  equation VARCHAR(255) NOT NULL COMMENT '完整配平方程式展示',
  ionic_equation VARCHAR(255) NULL,
  conditions VARCHAR(255) NOT NULL DEFAULT '',
  phenomenon TEXT NULL,
  principle TEXT NULL,
  oxidant VARCHAR(128) NULL,
  reductant VARCHAR(128) NULL,
  ox_product VARCHAR(128) NULL,
  re_product VARCHAR(128) NULL,
  electron_transfer TEXT NULL,
  difficulty TINYINT UNSIGNED NOT NULL DEFAULT 2 COMMENT '1-5',
  importance TINYINT UNSIGNED NOT NULL DEFAULT 3 COMMENT '1-5',
  is_verified TINYINT(1) NOT NULL DEFAULT 0 COMMENT '人工确认真实成立',
  train_types VARCHAR(255) NOT NULL DEFAULT '' COMMENT '适用训练类型，逗号分隔',
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  review_note VARCHAR(255) NOT NULL DEFAULT '',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_chem_reaction_canonical (canonical_equation),
  KEY idx_chem_reaction_status (status),
  KEY idx_chem_reaction_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_reaction_tags (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  reaction_id BIGINT UNSIGNED NOT NULL,
  tag VARCHAR(32) NOT NULL,
  UNIQUE KEY uk_chem_rxn_tag (reaction_id, tag),
  CONSTRAINT fk_chem_rxn_tag FOREIGN KEY (reaction_id) REFERENCES chem_reactions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_reaction_species (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  reaction_id BIGINT UNSIGNED NOT NULL,
  role VARCHAR(16) NOT NULL COMMENT 'reactant|product|catalyst',
  substance_id BIGINT UNSIGNED NULL,
  formula VARCHAR(64) NOT NULL,
  coefficient DECIMAL(10,4) NOT NULL DEFAULT 1,
  state_symbol VARCHAR(8) NULL COMMENT 's|l|g|aq',
  is_gas TINYINT(1) NOT NULL DEFAULT 0,
  is_precipitate TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  KEY idx_chem_rxn_sp_rxn (reaction_id, role, sort_order),
  CONSTRAINT fk_chem_rxn_sp_rxn FOREIGN KEY (reaction_id) REFERENCES chem_reactions(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_rxn_sp_sub FOREIGN KEY (substance_id) REFERENCES chem_substances(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_experiments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  category VARCHAR(32) NOT NULL DEFAULT 'other' COMMENT 'basic_ops|prep|test|property|gas_prep|gas_collect|inquiry|other',
  purpose TEXT NULL,
  principle TEXT NULL,
  instruments TEXT NULL,
  reagents TEXT NULL,
  steps TEXT NULL,
  phenomenon TEXT NULL,
  conclusion TEXT NULL,
  precautions TEXT NULL,
  safety_notes TEXT NULL,
  is_hazardous TINYINT(1) NOT NULL DEFAULT 0,
  home_forbidden_note VARCHAR(255) NOT NULL DEFAULT '危险实验请在实验室由教师指导下完成，禁止在家自行操作。',
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  review_note VARCHAR(255) NOT NULL DEFAULT '',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_chem_exp_status (status),
  KEY idx_chem_exp_name (name),
  KEY idx_chem_exp_cat (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_experiment_images (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  experiment_id BIGINT UNSIGNED NOT NULL,
  attachment_id BIGINT UNSIGNED NOT NULL,
  caption VARCHAR(255) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  KEY idx_chem_exp_img (experiment_id, sort_order),
  CONSTRAINT fk_chem_exp_img_exp FOREIGN KEY (experiment_id) REFERENCES chem_experiments(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_exp_img_att FOREIGN KEY (attachment_id) REFERENCES attachments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_formulas (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  expression VARCHAR(255) NOT NULL,
  variables TEXT NULL COMMENT '变量说明',
  units VARCHAR(128) NOT NULL DEFAULT '',
  applicable_conditions TEXT NULL,
  examples TEXT NULL,
  common_mistakes TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  review_note VARCHAR(255) NOT NULL DEFAULT '',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_chem_formula_status (status),
  KEY idx_chem_formula_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_concepts (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  definition TEXT NULL,
  principle TEXT NULL,
  applicable_conditions TEXT NULL,
  judge_methods TEXT NULL,
  examples TEXT NULL,
  common_mistakes TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  review_note VARCHAR(255) NOT NULL DEFAULT '',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_chem_concept_status (status),
  KEY idx_chem_concept_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_knowledge_points (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  parent_id BIGINT UNSIGNED NULL,
  name VARCHAR(128) NOT NULL,
  description TEXT NULL,
  difficulty TINYINT UNSIGNED NOT NULL DEFAULT 2,
  importance TINYINT UNSIGNED NOT NULL DEFAULT 3,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  review_note VARCHAR(255) NOT NULL DEFAULT '',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_chem_kp_status (status),
  KEY idx_chem_kp_parent (parent_id),
  KEY idx_chem_kp_name (name),
  CONSTRAINT fk_chem_kp_parent FOREIGN KEY (parent_id) REFERENCES chem_knowledge_points(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_questions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  qtype VARCHAR(32) NOT NULL COMMENT 'single|multi|judge|blank|equation|ionic|calc|experiment|short|inference|image',
  stem TEXT NOT NULL,
  options_json JSON NULL,
  answer TEXT NOT NULL,
  analysis TEXT NULL,
  scoring TEXT NULL,
  difficulty TINYINT UNSIGNED NOT NULL DEFAULT 2,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  review_note VARCHAR(255) NOT NULL DEFAULT '',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_chem_q_status (status),
  KEY idx_chem_q_type (qtype)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== 与专项/分类关联 ==========
CREATE TABLE IF NOT EXISTS chem_entity_specialties (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  entity_type VARCHAR(32) NOT NULL COMMENT 'element|substance|reaction|experiment|formula|concept|knowledge|question',
  entity_id BIGINT UNSIGNED NOT NULL,
  specialty_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uk_chem_ent_spec (entity_type, entity_id, specialty_id),
  KEY idx_chem_ent_spec_spec (specialty_id),
  CONSTRAINT fk_chem_ent_spec_s FOREIGN KEY (specialty_id) REFERENCES chem_specialties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_entity_categories (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  entity_type VARCHAR(32) NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uk_chem_ent_cat (entity_type, entity_id, category_id),
  KEY idx_chem_ent_cat_cat (category_id),
  CONSTRAINT fk_chem_ent_cat_c FOREIGN KEY (category_id) REFERENCES chem_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== 知识点与各实体关联 ==========
CREATE TABLE IF NOT EXISTS chem_kp_links (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  knowledge_point_id BIGINT UNSIGNED NOT NULL,
  target_type VARCHAR(32) NOT NULL COMMENT 'element|substance|reaction|experiment|formula|concept|knowledge',
  target_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uk_chem_kp_link (knowledge_point_id, target_type, target_id),
  KEY idx_chem_kp_link_tgt (target_type, target_id),
  CONSTRAINT fk_chem_kp_link_kp FOREIGN KEY (knowledge_point_id) REFERENCES chem_knowledge_points(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_question_kps (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  question_id BIGINT UNSIGNED NOT NULL,
  knowledge_point_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uk_chem_q_kp (question_id, knowledge_point_id),
  CONSTRAINT fk_chem_q_kp_q FOREIGN KEY (question_id) REFERENCES chem_questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_q_kp_kp FOREIGN KEY (knowledge_point_id) REFERENCES chem_knowledge_points(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_reaction_substances (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  reaction_id BIGINT UNSIGNED NOT NULL,
  substance_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uk_chem_rxn_sub (reaction_id, substance_id),
  CONSTRAINT fk_chem_rxn_sub_r FOREIGN KEY (reaction_id) REFERENCES chem_reactions(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_rxn_sub_s FOREIGN KEY (substance_id) REFERENCES chem_substances(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_reaction_elements (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  reaction_id BIGINT UNSIGNED NOT NULL,
  element_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uk_chem_rxn_el (reaction_id, element_id),
  CONSTRAINT fk_chem_rxn_el_r FOREIGN KEY (reaction_id) REFERENCES chem_reactions(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_rxn_el_e FOREIGN KEY (element_id) REFERENCES chem_elements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_experiment_reactions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  experiment_id BIGINT UNSIGNED NOT NULL,
  reaction_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uk_chem_exp_rxn (experiment_id, reaction_id),
  CONSTRAINT fk_chem_exp_rxn_e FOREIGN KEY (experiment_id) REFERENCES chem_experiments(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_exp_rxn_r FOREIGN KEY (reaction_id) REFERENCES chem_reactions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_experiment_substances (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  experiment_id BIGINT UNSIGNED NOT NULL,
  substance_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uk_chem_exp_sub (experiment_id, substance_id),
  CONSTRAINT fk_chem_exp_sub_e FOREIGN KEY (experiment_id) REFERENCES chem_experiments(id) ON DELETE CASCADE,
  CONSTRAINT fk_chem_exp_sub_s FOREIGN KEY (substance_id) REFERENCES chem_substances(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 通用跨类型关联（详情页跳转兜底）
CREATE TABLE IF NOT EXISTS chem_kb_links (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  from_type VARCHAR(32) NOT NULL,
  from_id BIGINT UNSIGNED NOT NULL,
  to_type VARCHAR(32) NOT NULL,
  to_id BIGINT UNSIGNED NOT NULL,
  note VARCHAR(128) NOT NULL DEFAULT '',
  UNIQUE KEY uk_chem_kb_link (from_type, from_id, to_type, to_id),
  KEY idx_chem_kb_link_to (to_type, to_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== 示例种子（Na 体系，幂等） ==========
INSERT INTO chem_elements (
  symbol, name_zh, name_en, atomic_number, atomic_mass, period_no, group_label, category,
  common_valences, atom_structure, electron_config, common_compounds, key_properties, common_uses, status
) VALUES
('H', '氢', 'Hydrogen', 1, 1.008000, 1, 'IA', '非金属', '+1,-1', '质子数1，核外1个电子', '1s1', 'H2O,HCl,H2', '最轻气体，可燃', '燃料、还原剂', 'published'),
('O', '氧', 'Oxygen', 8, 15.999000, 2, 'VIA', '非金属', '-2', '质子数8', '1s2 2s2 2p4', 'H2O,O2,氧化物', '助燃、氧化性强', '呼吸、冶炼', 'published'),
('Na', '钠', 'Sodium', 11, 22.990000, 3, 'IA', '金属', '+1', '质子数11，三层电子', '1s2 2s2 2p6 3s1', 'Na,NaOH,NaCl,Na2O2', '银白色软金属，还原性强，与水剧烈反应', '还原剂、散热、合金', 'published'),
('Cl', '氯', 'Chlorine', 17, 35.450000, 3, 'VIIA', '非金属', '-1,+1,+3,+5,+7', '质子数17', '1s2 2s2 2p6 3s2 3p5', 'Cl2,HCl,NaCl', '黄绿色有毒气体', '消毒、制盐酸', 'published')
ON DUPLICATE KEY UPDATE
  name_zh = VALUES(name_zh),
  name_en = VALUES(name_en),
  atomic_mass = VALUES(atomic_mass),
  period_no = VALUES(period_no),
  group_label = VALUES(group_label),
  category = VALUES(category),
  common_valences = VALUES(common_valences),
  status = VALUES(status);

INSERT INTO chem_substances (
  name, canonical_formula, common_names, color, state_label, solubility, physical_props, chemical_props,
  common_uses, test_methods, storage_methods, safety_notes, status
) VALUES
('钠', 'Na', '金属钠', '银白色', '固', '与水反应', '软、密度小于水', '强还原性，与水、酸、氧气反应', '散热、还原剂', '切割观察光泽', '煤油或石蜡油中密封', '遇水剧烈，禁止徒手接触水中操作', 'published'),
('水', 'H2O', '水', '无色', '液', '溶剂', '无色无味液体', '可与活泼金属、氧化物等反应', '溶剂、反应物', '—', '常温密封', '安全', 'published'),
('氢氧化钠', 'NaOH', '烧碱,火碱,苛性钠', '白色', '固', '易溶于水放热', '潮解', '强碱，与酸、二氧化碳、盐等反应', '工业制皂、除油', '酚酞变红', '密封干燥', '腐蚀性，禁止直接接触皮肤', 'published'),
('氢气', 'H2', '氢气', '无色', '气', '难溶', '最轻气体', '可燃，还原性', '燃料、还原剂', '点燃有淡蓝色火焰', '钢瓶或发生器', '与空气混合遇明火爆炸', 'published')
ON DUPLICATE KEY UPDATE
  common_names = VALUES(common_names),
  color = VALUES(color),
  state_label = VALUES(state_label),
  status = VALUES(status);

-- 物质标签
INSERT IGNORE INTO chem_substance_tags (substance_id, tag)
SELECT s.id, t.tag FROM chem_substances s
JOIN (
  SELECT 'Na' f, '钠' n, 'elemental' tag UNION ALL
  SELECT 'H2O', '水', 'other' UNION ALL
  SELECT 'NaOH', '氢氧化钠', 'base' UNION ALL
  SELECT 'H2', '氢气', 'elemental'
) t ON s.canonical_formula = t.f AND s.name = t.n;

-- 物质组成元素
INSERT IGNORE INTO chem_substance_elements (substance_id, element_id, atom_count)
SELECT s.id, e.id, x.cnt FROM (
  SELECT 'Na' f, '钠' n, 'Na' sym, 1 cnt UNION ALL
  SELECT 'H2O', '水', 'H', 2 UNION ALL
  SELECT 'H2O', '水', 'O', 1 UNION ALL
  SELECT 'NaOH', '氢氧化钠', 'Na', 1 UNION ALL
  SELECT 'NaOH', '氢氧化钠', 'O', 1 UNION ALL
  SELECT 'NaOH', '氢氧化钠', 'H', 1 UNION ALL
  SELECT 'H2', '氢气', 'H', 2
) x
JOIN chem_substances s ON s.canonical_formula = x.f AND s.name = x.n
JOIN chem_elements e ON e.symbol = x.sym;

INSERT INTO chem_reactions (
  name, canonical_equation, equation, ionic_equation, conditions, phenomenon, principle,
  oxidant, reductant, ox_product, re_product, electron_transfer,
  difficulty, importance, is_verified, train_types, status
) VALUES (
  '钠与水反应',
  '2Na+2H2O=2NaOH+H2',
  '2Na + 2H2O = 2NaOH + H2↑',
  '2Na + 2H2O = 2Na+ + 2OH- + H2↑',
  '常温',
  '钠浮于水面、熔化成小球、四处游动、发出嘶嘶声，滴酚酞变红；产生可燃气体',
  '钠失电子被氧化，水中氢得电子被还原',
  'H2O', 'Na', 'NaOH', 'H2', 'Na 失 1e-；H 得 1e-（按原子计）',
  2, 5, 1,
  'equation_write,balance,redox,property,phenomenon,conversion',
  'published'
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  equation = VALUES(equation),
  ionic_equation = VALUES(ionic_equation),
  is_verified = VALUES(is_verified),
  status = VALUES(status);

INSERT IGNORE INTO chem_reaction_tags (reaction_id, tag)
SELECT r.id, t.tag FROM chem_reactions r
JOIN (
  SELECT '2Na+2H2O=2NaOH+H2' eq, '置换反应' tag UNION ALL
  SELECT '2Na+2H2O=2NaOH+H2', '氧化还原反应' UNION ALL
  SELECT '2Na+2H2O=2NaOH+H2', '离子反应' UNION ALL
  SELECT '2Na+2H2O=2NaOH+H2', '气体生成反应'
) t ON r.canonical_equation = t.eq;

-- 反应物种（先清再插不方便；用 NOT EXISTS）
INSERT INTO chem_reaction_species (reaction_id, role, substance_id, formula, coefficient, state_symbol, is_gas, is_precipitate, sort_order)
SELECT r.id, x.role, s.id, x.formula, x.coef, x.st, x.gas, 0, x.so
FROM chem_reactions r
JOIN (
  SELECT '2Na+2H2O=2NaOH+H2' eq, 'reactant' role, 'Na' f, '钠' n, 'Na' formula, 2 coef, 's' st, 0 gas, 1 so UNION ALL
  SELECT '2Na+2H2O=2NaOH+H2', 'reactant', 'H2O', '水', 'H2O', 2, 'l', 0, 2 UNION ALL
  SELECT '2Na+2H2O=2NaOH+H2', 'product', 'NaOH', '氢氧化钠', 'NaOH', 2, 'aq', 0, 3 UNION ALL
  SELECT '2Na+2H2O=2NaOH+H2', 'product', 'H2', '氢气', 'H2', 1, 'g', 1, 4
) x ON r.canonical_equation = x.eq
LEFT JOIN chem_substances s ON s.canonical_formula = x.f AND s.name = x.n
WHERE NOT EXISTS (
  SELECT 1 FROM chem_reaction_species sp WHERE sp.reaction_id = r.id AND sp.role = x.role AND sp.formula = x.formula
);

INSERT IGNORE INTO chem_reaction_substances (reaction_id, substance_id)
SELECT r.id, s.id FROM chem_reactions r
JOIN chem_substances s ON s.canonical_formula IN ('Na','H2O','NaOH','H2')
WHERE r.canonical_equation = '2Na+2H2O=2NaOH+H2';

INSERT IGNORE INTO chem_reaction_elements (reaction_id, element_id)
SELECT r.id, e.id FROM chem_reactions r
JOIN chem_elements e ON e.symbol IN ('Na','H','O')
WHERE r.canonical_equation = '2Na+2H2O=2NaOH+H2';

INSERT INTO chem_experiments (
  name, category, purpose, principle, instruments, reagents, steps, phenomenon, conclusion,
  precautions, safety_notes, is_hazardous, home_forbidden_note, status
)
SELECT
  '钠与水的反应',
  'property',
  '观察钠与水反应的现象并验证产物',
  '钠与水发生置换反应生成氢氧化钠和氢气',
  '烧杯、镊子、小刀、玻璃片、滤纸、酚酞、火柴',
  '金属钠、水、酚酞',
  '1.用镊子取绿豆大钠，滤纸吸干煤油；2.放入盛水烧杯；3.滴入酚酞；4.收集气体点燃检验',
  '浮、熔、游、响，溶液变红，气体可燃',
  '产物为 NaOH 与 H2，反应放热',
  '钠取用量要小；用镊子操作；不可用手直接接触',
  '钠遇水剧烈放热，可能溅射；禁止在家自行操作',
  1,
  '危险实验请在实验室由教师指导下完成，禁止在家自行操作。',
  'published'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM chem_experiments WHERE name = '钠与水的反应');

INSERT IGNORE INTO chem_experiment_reactions (experiment_id, reaction_id)
SELECT e.id, r.id FROM chem_experiments e
JOIN chem_reactions r ON r.canonical_equation = '2Na+2H2O=2NaOH+H2'
WHERE e.name = '钠与水的反应';

INSERT IGNORE INTO chem_experiment_substances (experiment_id, substance_id)
SELECT e.id, s.id FROM chem_experiments e
JOIN chem_substances s ON s.canonical_formula IN ('Na','H2O','NaOH','H2')
WHERE e.name = '钠与水的反应';

INSERT INTO chem_formulas (
  name, expression, variables, units, applicable_conditions, examples, common_mistakes, status
)
SELECT
  '物质的量与质量关系',
  'n = m / M',
  'n:物质的量；m:质量；M:摩尔质量',
  'n:mol；m:g；M:g/mol',
  '适用于纯净物定量换算',
  '18g水：n=18/18=1mol',
  '混淆摩尔质量与相对分子质量单位',
  'published'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM chem_formulas WHERE name = '物质的量与质量关系');

INSERT INTO chem_concepts (
  name, definition, principle, applicable_conditions, judge_methods, examples, common_mistakes, status
)
SELECT
  '氧化还原反应',
  '有电子转移（或化合价升降）的反应',
  '氧化与还原同时发生，得失电子守恒',
  '存在化合价变化的化学反应',
  '看化合价是否升降；找氧化剂还原剂',
  '2Na+2H2O=2NaOH+H2↑',
  '把有氧参与才叫氧化；忽略电子守恒',
  'published'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM chem_concepts WHERE name = '氧化还原反应');

-- 知识点（无唯一键，用 NOT EXISTS）
INSERT INTO chem_knowledge_points (parent_id, name, description, difficulty, importance, status)
SELECT NULL, '氧化还原反应', '高一核心：化合价变化与电子转移', 2, 5, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM chem_knowledge_points WHERE name = '氧化还原反应' AND parent_id IS NULL);

INSERT INTO chem_knowledge_points (parent_id, name, description, difficulty, importance, status)
SELECT p.id, c.name, c.desc_text, 2, 4, 'published'
FROM chem_knowledge_points p
JOIN (
  SELECT '化合价变化' name, '反应前后元素化合价升降' desc_text UNION ALL
  SELECT '氧化剂判断', '得电子、化合价降低的物质' UNION ALL
  SELECT '还原剂判断', '失电子、化合价升高的物质'
) c
WHERE p.name = '氧化还原反应' AND p.parent_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM chem_knowledge_points x WHERE x.parent_id = p.id AND x.name = c.name
  );

INSERT INTO chem_knowledge_points (parent_id, name, description, difficulty, importance, status)
SELECT NULL, '钠的化学性质', '钠与氧气、水、酸等反应规律', 2, 5, 'published'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM chem_knowledge_points WHERE name = '钠的化学性质' AND parent_id IS NULL);

-- 知识点关联目标
INSERT IGNORE INTO chem_kp_links (knowledge_point_id, target_type, target_id)
SELECT kp.id, 'reaction', r.id FROM chem_knowledge_points kp
JOIN chem_reactions r ON r.canonical_equation = '2Na+2H2O=2NaOH+H2'
WHERE kp.name IN ('氧化还原反应', '钠的化学性质');

INSERT IGNORE INTO chem_kp_links (knowledge_point_id, target_type, target_id)
SELECT kp.id, 'element', e.id FROM chem_knowledge_points kp
JOIN chem_elements e ON e.symbol = 'Na'
WHERE kp.name = '钠的化学性质';

INSERT IGNORE INTO chem_kp_links (knowledge_point_id, target_type, target_id)
SELECT kp.id, 'substance', s.id FROM chem_knowledge_points kp
JOIN chem_substances s ON s.canonical_formula = 'Na' AND s.name = '钠'
WHERE kp.name = '钠的化学性质';

INSERT IGNORE INTO chem_kp_links (knowledge_point_id, target_type, target_id)
SELECT kp.id, 'experiment', e.id FROM chem_knowledge_points kp
JOIN chem_experiments e ON e.name = '钠与水的反应'
WHERE kp.name = '钠的化学性质';

INSERT IGNORE INTO chem_kp_links (knowledge_point_id, target_type, target_id)
SELECT kp.id, 'concept', c.id FROM chem_knowledge_points kp
JOIN chem_concepts c ON c.name = '氧化还原反应'
WHERE kp.name = '氧化还原反应';

-- 关联专项
INSERT IGNORE INTO chem_entity_specialties (entity_type, entity_id, specialty_id)
SELECT 'reaction', r.id, s.id FROM chem_reactions r
JOIN chem_specialties s ON s.code IN ('equation','redox','substance','experiment')
WHERE r.canonical_equation = '2Na+2H2O=2NaOH+H2';

INSERT IGNORE INTO chem_entity_categories (entity_type, entity_id, category_id)
SELECT 'reaction', r.id, c.id FROM chem_reactions r
JOIN chem_specialties sp ON sp.code = 'equation'
JOIN chem_categories c ON c.specialty_id = sp.id AND c.code IN ('write_from_text','balance','redox_analysis')
WHERE r.canonical_equation = '2Na+2H2O=2NaOH+H2';

INSERT IGNORE INTO chem_entity_specialties (entity_type, entity_id, specialty_id)
SELECT 'knowledge', kp.id, s.id FROM chem_knowledge_points kp
JOIN chem_specialties s ON s.code IN ('redox','substance')
WHERE kp.name IN ('氧化还原反应', '钠的化学性质');

INSERT IGNORE INTO chem_entity_specialties (entity_type, entity_id, specialty_id)
SELECT 'element', e.id, s.id FROM chem_elements e
JOIN chem_specialties s ON s.code IN ('periodic','memory','structure')
WHERE e.symbol = 'Na';

INSERT IGNORE INTO chem_entity_specialties (entity_type, entity_id, specialty_id)
SELECT 'formula', f.id, s.id FROM chem_formulas f
JOIN chem_specialties s ON s.code = 'calculation'
WHERE f.name = '物质的量与质量关系';

INSERT IGNORE INTO chem_entity_specialties (entity_type, entity_id, specialty_id)
SELECT 'experiment', e.id, s.id FROM chem_experiments e
JOIN chem_specialties s ON s.code = 'experiment'
WHERE e.name = '钠与水的反应';

-- 通用跳转链接（元素 -> 物质 -> 反应 -> 实验）
INSERT IGNORE INTO chem_kb_links (from_type, from_id, to_type, to_id, note)
SELECT 'element', e.id, 'substance', s.id, '单质'
FROM chem_elements e JOIN chem_substances s ON s.canonical_formula = 'Na' AND s.name = '钠'
WHERE e.symbol = 'Na';

INSERT IGNORE INTO chem_kb_links (from_type, from_id, to_type, to_id, note)
SELECT 'substance', s.id, 'reaction', r.id, '典型反应'
FROM chem_substances s
JOIN chem_reactions r ON r.canonical_equation = '2Na+2H2O=2NaOH+H2'
WHERE s.canonical_formula = 'Na' AND s.name = '钠';

INSERT IGNORE INTO chem_kb_links (from_type, from_id, to_type, to_id, note)
SELECT 'reaction', r.id, 'experiment', e.id, '配套实验'
FROM chem_reactions r
JOIN chem_experiments e ON e.name = '钠与水的反应'
WHERE r.canonical_equation = '2Na+2H2O=2NaOH+H2';

INSERT IGNORE INTO chem_kb_links (from_type, from_id, to_type, to_id, note)
SELECT 'reaction', r.id, 'knowledge', kp.id, '相关知识点'
FROM chem_reactions r
JOIN chem_knowledge_points kp ON kp.name = '氧化还原反应' AND kp.parent_id IS NULL
WHERE r.canonical_equation = '2Na+2H2O=2NaOH+H2';

-- 示例题目（骨架）
INSERT INTO chem_questions (qtype, stem, options_json, answer, analysis, scoring, difficulty, status)
SELECT 'single',
  '钠与水反应的生成物是？',
  JSON_ARRAY('Na2O 和 H2', 'NaOH 和 H2', 'NaOH 和 O2', 'Na2O2 和 H2'),
  'NaOH 和 H2',
  '钠与水发生置换反应：2Na+2H2O=2NaOH+H2↑',
  '选对得满分',
  1,
  'published'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM chem_questions WHERE stem = '钠与水反应的生成物是？'
);

INSERT IGNORE INTO chem_question_kps (question_id, knowledge_point_id)
SELECT q.id, kp.id FROM chem_questions q
JOIN chem_knowledge_points kp ON kp.name = '钠的化学性质'
WHERE q.stem = '钠与水反应的生成物是？';

INSERT IGNORE INTO chem_entity_specialties (entity_type, entity_id, specialty_id)
SELECT 'question', q.id, s.id FROM chem_questions q
JOIN chem_specialties s ON s.code IN ('equation','substance')
WHERE q.stem = '钠与水反应的生成物是？';
