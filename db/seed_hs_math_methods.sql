-- =============================================================================
-- 高一数学 · 正式方法词典种子草案（P1-FUNC 主营数据准备）
-- =============================================================================
-- 库：study_system（唯一业务库；禁止指向第二库）
-- 状态：EXECUTED on study_system @ 2026-10-25T11:31:03+08:00（见 docs/high_school_math/56_…acceptance.md）
-- 仍可安全重复执行（同 code NOT EXISTS 跳过；禁止改为 ON DUPLICATE KEY UPDATE）
-- 表：仅 hs_math_methods；不写 train_items / item_methods / reviews / KP
-- 教材锚点：人教 A 版必修第一册 · 第三章《函数的概念与性质》（跨章可复用）
--
-- 设计依据：
--   - 实体：apps/api/src/hs-math/entities/hs-math-method.entity.ts
--   - 结构：db/init.sql · hs_math_methods
--   - 总体设计示例：docs/high_school_math/36_p1_func_core0_full_learning_design.md §F
--   - 实际用途：对齐第三章 KP（概念/单调/奇偶/幂函数）与 PARITY 奇偶性题组
--
-- 安全与幂等：
--   1) 禁止 REPLACE INTO
--   2) 禁止 ON DUPLICATE KEY UPDATE（避免覆盖已有正式方法 name/summary）
--   3) 同 code 已存在则跳过（WHERE NOT EXISTS）
--   4) 若同 code 已存在但内容不同：本脚本不覆盖；执行前须人工比对并报告冲突
--   5) 字符集 utf8mb4；不影响化学或其他模块表
--
-- 执行前建议只读核验：
--   SELECT DATABASE();  -- 期望 study_system
--   SELECT COUNT(*) FROM hs_math_methods;
--   SELECT code, name FROM hs_math_methods WHERE code IN (
--     'defn','domain_symmetry','special_value','graph_symmetry','num_shape',
--     'classification','mono_analysis','parity_apply','equiv_transform',
--     'undetermined_coeff','substitution'
--   );
-- =============================================================================

INSERT INTO hs_math_methods (code, name, summary, sort_order, is_active)
SELECT v.code, v.name, v.summary, v.sort_order, 1
FROM (
  -- —— 第三章高频：定义与定义域 ——
  SELECT
    'defn' AS code,
    '定义法' AS name,
    '用教材定义直接验证结论。第三章常见：先确认定义域条件，再验证 f(-x)=±f(x) 或区间上的单调性定义。' AS summary,
    10 AS sort_order
  UNION ALL SELECT
    'domain_symmetry',
    '定义域对称检验',
    '讨论奇偶性前，先检验定义域是否关于原点对称；不对称则直接判定非奇非偶。亦可用于分段/根式等定义域梳理。',
    20
  UNION ALL SELECT
    'special_value',
    '特殊值法',
    '代入特殊点检验命题、举反例或排除选项。适用于奇偶判断、非奇非偶辨析及否定“任意奇函数都单调”等全称命题。',
    30

  -- —— 图象与数形 ——
  UNION ALL SELECT
    'graph_symmetry',
    '图象对称分析',
    '利用偶函数关于 y 轴对称、奇函数关于原点对称，由已知点推对称点或读图判断性质。',
    40
  UNION ALL SELECT
    'num_shape',
    '数形结合',
    '解析式与图象互相印证：由图读定义域/对称性/单调，或由代数结论核对图象位置。',
    50

  -- —— 讨论与区间性质 ——
  UNION ALL SELECT
    'classification',
    '分类讨论',
    '按区间、分段解析式或参数取值分类，再综合结论。适用于分段函数、含绝对值及幂函数不同 α 情形。',
    60
  UNION ALL SELECT
    'mono_analysis',
    '单调性分析',
    '在明确区间上用定义或已知单调性比较函数值、传递不等式；与奇偶综合时必须写清所论区间。',
    70
  UNION ALL SELECT
    'parity_apply',
    '奇偶性应用',
    '在已判定奇偶的前提下，用 f(-x)=±f(x) 求值、延拓到对称区间或与单调性联立。',
    80

  -- —— 通用变形（第三章偶用，跨章复用） ——
  UNION ALL SELECT
    'equiv_transform',
    '等价转化',
    '将待证/待判命题变形为等价条件（如定义域条件、恒等式），避免非等价跳步。',
    90
  UNION ALL SELECT
    'undetermined_coeff',
    '待定系数法',
    '设出含参解析式，由已知点或性质列方程确定系数。第三章函数求值与简单建模中偶用。',
    100
  UNION ALL SELECT
    'substitution',
    '换元法',
    '通过变量代换简化复合或对称结构。函数概念与后续指数对数章均可复用；本批奇偶题较少直接依赖。',
    110
) AS v
WHERE NOT EXISTS (
  SELECT 1 FROM hs_math_methods m WHERE m.code = v.code
);

-- =============================================================================
-- 执行后建议只读核验（授权执行后手工跑；本阶段不自动执行）
-- =============================================================================
-- SELECT code, name, sort_order, is_active FROM hs_math_methods
--  WHERE code IN (
--    'defn','domain_symmetry','special_value','graph_symmetry','num_shape',
--    'classification','mono_analysis','parity_apply','equiv_transform',
--    'undetermined_coeff','substitution'
--  )
--  ORDER BY sort_order;
-- -- 期望：上述 11 条均存在且 is_active=1（若执行前已有同 code，条数仍为跳过后的实有数）

-- =============================================================================
-- 回滚策略（须单独授权；禁止在有题目关联时硬删）
-- =============================================================================
-- 仅删除「本种子 code 且未被 hs_math_train_item_methods 引用」的行：
--
-- DELETE FROM hs_math_methods
-- WHERE code IN (
--   'defn','domain_symmetry','special_value','graph_symmetry','num_shape',
--   'classification','mono_analysis','parity_apply','equiv_transform',
--   'undetermined_coeff','substitution'
-- )
-- AND id NOT IN (
--   SELECT method_id FROM hs_math_train_item_methods
-- );
--
-- 若仍有引用：先解除题目-方法关联或将方法 is_active=0（停用），禁止 DROP 表。
-- 不得用本回滚影响其他模块。
-- =============================================================================
