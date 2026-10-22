-- 高一化学专项训练中心 · 阶段一：专项/二级分类字典（无 user 学习数据）
USE study_system;

CREATE TABLE IF NOT EXISTS chem_specialties (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL COMMENT '稳定编码，如 equation',
  name VARCHAR(64) NOT NULL,
  icon VARCHAR(64) NULL COMMENT '前端图标 key',
  intro VARCHAR(255) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_chem_specialty_code (code),
  KEY idx_chem_specialty_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chem_categories (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  specialty_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(64) NOT NULL COMMENT '专项内唯一编码',
  name VARCHAR(64) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_chem_cat_specialty_code (specialty_id, code),
  KEY idx_chem_cat_specialty_sort (specialty_id, is_active, sort_order),
  CONSTRAINT fk_chem_cat_specialty FOREIGN KEY (specialty_id) REFERENCES chem_specialties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 一级专项（幂等）
INSERT INTO chem_specialties (code, name, icon, intro, sort_order) VALUES
('equation', '化学方程式', 'Opportunity', '文字写方程式、配平、离子式与物质转化', 1),
('experiment', '化学实验', 'SetUp', '仪器、装置、气体制备检验与实验探究', 2),
('substance', '化学物质性质', 'Box', '名称、化学式、颜色状态与性质鉴别', 3),
('calculation', '化学计算', 'DataAnalysis', '物质的量、浓度、方程式与守恒计算', 4),
('ion', '离子反应', 'Connection', '电离、离子方程式与离子共存检验', 5),
('redox', '氧化还原反应', 'Switch', '化合价、氧化剂还原剂与电子转移', 6),
('periodic', '元素周期表', 'Grid', '周期族、原子结构与元素周期律', 7),
('structure', '物质结构', 'Share', '原子组成、化学键与电子式', 8),
('organic', '有机化学', 'Orange', '烷烯醇酸、反应类型与同分异构', 9),
('inference', '化学推断', 'Search', '现象与框图推断、物质转化推断', 10),
('memory', '化学基础记忆', 'Collection', '符号、化合价、俗称与常见方程式速记', 11),
('comprehensive', '化学综合训练', 'Trophy', '分层综合、错题薄弱与限时模拟', 12)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  icon = VALUES(icon),
  intro = VALUES(intro),
  sort_order = VALUES(sort_order),
  is_active = 1;

-- 二级分类：按 specialty code 插入（幂等：依赖 uk）
INSERT INTO chem_categories (specialty_id, code, name, sort_order)
SELECT s.id, v.code, v.name, v.sort_order
FROM chem_specialties s
JOIN (
  SELECT 'equation' sp, 'write_from_text' code, '根据文字写方程式' name, 1 sort_order UNION ALL
  SELECT 'equation', 'balance', '方程式配平', 2 UNION ALL
  SELECT 'equation', 'complete_reactant', '补全反应物', 3 UNION ALL
  SELECT 'equation', 'complete_product', '补全生成物', 4 UNION ALL
  SELECT 'equation', 'condition', '反应条件', 5 UNION ALL
  SELECT 'equation', 'true_false', '方程式正误判断', 6 UNION ALL
  SELECT 'equation', 'ionic_write', '离子方程式书写', 7 UNION ALL
  SELECT 'equation', 'ionic_correct', '离子方程式纠错', 8 UNION ALL
  SELECT 'equation', 'redox_analysis', '氧化还原分析', 9 UNION ALL
  SELECT 'equation', 'conversion', '物质转化', 10 UNION ALL
  SELECT 'experiment', 'instrument_id', '实验仪器识别', 1 UNION ALL
  SELECT 'experiment', 'instrument_use', '实验仪器用途', 2 UNION ALL
  SELECT 'experiment', 'basic_ops', '实验基本操作', 3 UNION ALL
  SELECT 'experiment', 'apparatus_id', '实验装置识别', 4 UNION ALL
  SELECT 'experiment', 'apparatus_link', '实验装置连接', 5 UNION ALL
  SELECT 'experiment', 'gas_prep', '气体制备', 6 UNION ALL
  SELECT 'experiment', 'gas_collect', '气体收集', 7 UNION ALL
  SELECT 'experiment', 'substance_test', '物质检验', 8 UNION ALL
  SELECT 'experiment', 'phenomenon_judge', '实验现象判断', 9 UNION ALL
  SELECT 'experiment', 'phenomenon_desc', '实验现象描述', 10 UNION ALL
  SELECT 'experiment', 'step_order', '实验步骤排序', 11 UNION ALL
  SELECT 'experiment', 'conclusion', '实验结论分析', 12 UNION ALL
  SELECT 'experiment', 'error_fix', '实验错误纠正', 13 UNION ALL
  SELECT 'experiment', 'safety', '实验安全', 14 UNION ALL
  SELECT 'experiment', 'plan_design', '实验方案设计', 15 UNION ALL
  SELECT 'experiment', 'inquiry', '实验综合探究', 16 UNION ALL
  SELECT 'substance', 'name', '物质名称', 1 UNION ALL
  SELECT 'substance', 'formula', '化学式', 2 UNION ALL
  SELECT 'substance', 'color', '物质颜色', 3 UNION ALL
  SELECT 'substance', 'state', '物质状态', 4 UNION ALL
  SELECT 'substance', 'solubility', '溶解性', 5 UNION ALL
  SELECT 'substance', 'chem_property', '化学性质', 6 UNION ALL
  SELECT 'substance', 'test', '物质检验', 7 UNION ALL
  SELECT 'substance', 'usage', '物质用途', 8 UNION ALL
  SELECT 'substance', 'storage', '物质保存', 9 UNION ALL
  SELECT 'substance', 'identify', '物质鉴别', 10 UNION ALL
  SELECT 'substance', 'conversion', '物质转化', 11 UNION ALL
  SELECT 'calculation', 'atomic_mass', '相对原子质量', 1 UNION ALL
  SELECT 'calculation', 'molecular_mass', '相对分子质量', 2 UNION ALL
  SELECT 'calculation', 'molar_mass', '摩尔质量', 3 UNION ALL
  SELECT 'calculation', 'amount', '物质的量', 4 UNION ALL
  SELECT 'calculation', 'avogadro', '阿伏加德罗常数', 5 UNION ALL
  SELECT 'calculation', 'molar_volume', '气体摩尔体积', 6 UNION ALL
  SELECT 'calculation', 'concentration', '物质的量浓度', 7 UNION ALL
  SELECT 'calculation', 'dilution', '溶液稀释', 8 UNION ALL
  SELECT 'calculation', 'equation_calc', '化学方程式计算', 9 UNION ALL
  SELECT 'calculation', 'mass_conserve', '质量守恒', 10 UNION ALL
  SELECT 'calculation', 'electron_conserve', '电子守恒', 11 UNION ALL
  SELECT 'calculation', 'mixed', '综合计算', 12 UNION ALL
  SELECT 'ion', 'electrolyte', '电解质判断', 1 UNION ALL
  SELECT 'ion', 'nonelectrolyte', '非电解质判断', 2 UNION ALL
  SELECT 'ion', 'ionization', '电离方程式', 3 UNION ALL
  SELECT 'ion', 'ionic_write', '离子方程式书写', 4 UNION ALL
  SELECT 'ion', 'formula_split', '化学式拆分', 5 UNION ALL
  SELECT 'ion', 'ionic_balance', '离子方程式配平', 6 UNION ALL
  SELECT 'ion', 'ionic_correct', '离子方程式纠错', 7 UNION ALL
  SELECT 'ion', 'coexist', '离子共存', 8 UNION ALL
  SELECT 'ion', 'ion_test', '离子检验', 9 UNION ALL
  SELECT 'ion', 'mixed', '综合应用', 10 UNION ALL
  SELECT 'redox', 'valence', '化合价判断', 1 UNION ALL
  SELECT 'redox', 'identify', '氧化还原反应识别', 2 UNION ALL
  SELECT 'redox', 'oxidant', '氧化剂判断', 3 UNION ALL
  SELECT 'redox', 'reductant', '还原剂判断', 4 UNION ALL
  SELECT 'redox', 'ox_product', '氧化产物', 5 UNION ALL
  SELECT 'redox', 're_product', '还原产物', 6 UNION ALL
  SELECT 'redox', 'e_direction', '电子转移方向', 7 UNION ALL
  SELECT 'redox', 'e_count', '电子转移数量', 8 UNION ALL
  SELECT 'redox', 'double_bridge', '双线桥法', 9 UNION ALL
  SELECT 'redox', 'single_bridge', '单线桥法', 10 UNION ALL
  SELECT 'redox', 'ox_re_ability', '氧化性与还原性', 11 UNION ALL
  SELECT 'redox', 'e_conserve', '电子守恒', 12 UNION ALL
  SELECT 'periodic', 'elem_name', '元素名称', 1 UNION ALL
  SELECT 'periodic', 'symbol', '元素符号', 2 UNION ALL
  SELECT 'periodic', 'atomic_number', '原子序数', 3 UNION ALL
  SELECT 'periodic', 'atomic_mass', '相对原子质量', 4 UNION ALL
  SELECT 'periodic', 'period', '周期', 5 UNION ALL
  SELECT 'periodic', 'group_col', '族', 6 UNION ALL
  SELECT 'periodic', 'atom_structure', '原子结构', 7 UNION ALL
  SELECT 'periodic', 'electron_config', '核外电子排布', 8 UNION ALL
  SELECT 'periodic', 'common_valence', '常见化合价', 9 UNION ALL
  SELECT 'periodic', 'metal_compare', '金属性比较', 10 UNION ALL
  SELECT 'periodic', 'nonmetal_compare', '非金属性比较', 11 UNION ALL
  SELECT 'periodic', 'periodic_law', '元素周期律', 12 UNION ALL
  SELECT 'structure', 'atom_compose', '原子组成', 1 UNION ALL
  SELECT 'structure', 'proton', '质子数', 2 UNION ALL
  SELECT 'structure', 'neutron', '中子数', 3 UNION ALL
  SELECT 'structure', 'electron', '电子数', 4 UNION ALL
  SELECT 'structure', 'atom_diagram', '原子结构示意图', 5 UNION ALL
  SELECT 'structure', 'ion_diagram', '离子结构示意图', 6 UNION ALL
  SELECT 'structure', 'nuclide', '核素', 7 UNION ALL
  SELECT 'structure', 'isotope', '同位素', 8 UNION ALL
  SELECT 'structure', 'ionic_bond', '离子键', 9 UNION ALL
  SELECT 'structure', 'covalent_bond', '共价键', 10 UNION ALL
  SELECT 'structure', 'electron_formula', '电子式', 11 UNION ALL
  SELECT 'structure', 'ionic_compound', '离子化合物', 12 UNION ALL
  SELECT 'structure', 'covalent_compound', '共价化合物', 13 UNION ALL
  SELECT 'organic', 'basic', '有机物基础概念', 1 UNION ALL
  SELECT 'organic', 'methane', '甲烷', 2 UNION ALL
  SELECT 'organic', 'alkane', '烷烃', 3 UNION ALL
  SELECT 'organic', 'ethene', '乙烯', 4 UNION ALL
  SELECT 'organic', 'ethanol', '乙醇', 5 UNION ALL
  SELECT 'organic', 'acetic', '乙酸', 6 UNION ALL
  SELECT 'organic', 'homolog', '同系物', 7 UNION ALL
  SELECT 'organic', 'isomer', '同分异构体', 8 UNION ALL
  SELECT 'organic', 'substitution', '取代反应', 9 UNION ALL
  SELECT 'organic', 'addition', '加成反应', 10 UNION ALL
  SELECT 'organic', 'oxidation', '氧化反应', 11 UNION ALL
  SELECT 'organic', 'esterification', '酯化反应', 12 UNION ALL
  SELECT 'organic', 'structure_formula', '有机结构式', 13 UNION ALL
  SELECT 'organic', 'property', '有机物性质', 14 UNION ALL
  SELECT 'inference', 'color', '颜色推断', 1 UNION ALL
  SELECT 'inference', 'phenomenon', '实验现象推断', 2 UNION ALL
  SELECT 'inference', 'relation', '反应关系推断', 3 UNION ALL
  SELECT 'inference', 'composition', '元素组成推断', 4 UNION ALL
  SELECT 'inference', 'valence', '化合价推断', 5 UNION ALL
  SELECT 'inference', 'conversion', '物质转化推断', 6 UNION ALL
  SELECT 'inference', 'block_diagram', '无机框图推断', 7 UNION ALL
  SELECT 'inference', 'mixed', '综合推断', 8 UNION ALL
  SELECT 'memory', 'symbol', '元素符号', 1 UNION ALL
  SELECT 'memory', 'valence', '常见化合价', 2 UNION ALL
  SELECT 'memory', 'ions', '常见离子', 3 UNION ALL
  SELECT 'memory', 'formula', '化学式', 4 UNION ALL
  SELECT 'memory', 'color', '物质颜色', 5 UNION ALL
  SELECT 'memory', 'precipitate', '沉淀颜色', 6 UNION ALL
  SELECT 'memory', 'gas', '气体性质', 7 UNION ALL
  SELECT 'memory', 'common_name', '物质俗称', 8 UNION ALL
  SELECT 'memory', 'phenomenon', '实验现象', 9 UNION ALL
  SELECT 'memory', 'equation', '化学方程式', 10 UNION ALL
  SELECT 'memory', 'chem_formula', '化学公式', 11 UNION ALL
  SELECT 'memory', 'rules', '化学规律', 12 UNION ALL
  SELECT 'comprehensive', 'basic', '基础综合', 1 UNION ALL
  SELECT 'comprehensive', 'medium', '中等综合', 2 UNION ALL
  SELECT 'comprehensive', 'advanced', '提高综合', 3 UNION ALL
  SELECT 'comprehensive', 'mistakes', '错题综合', 4 UNION ALL
  SELECT 'comprehensive', 'weak', '薄弱知识综合', 5 UNION ALL
  SELECT 'comprehensive', 'timed', '限时训练', 6 UNION ALL
  SELECT 'comprehensive', 'mock', '模拟测试', 7
) v ON v.sp = s.code
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  sort_order = VALUES(sort_order),
  is_active = 1;
