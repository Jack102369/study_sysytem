-- P1-FUNC-1：高一数学第三章《函数的概念与性质》知识点种子
-- 库：study_system
-- 状态：NOT_EXECUTED（需单独授权后执行）
--
-- 范围：仅 INSERT hs_math_knowledge_points（3.1 / 3.2 / 3.3 共 27 条）
-- 不改 specialty / category；不碰第一章 KP / 训练题 / 审核记录
-- 3.4《函数的应用（一）》保留目录，本文件不建 KP（PLANNED_NOT_SEEDED）
--
-- 安全：
-- 1) 禁止 REPLACE INTO / ON DUPLICATE KEY UPDATE
-- 2) 幂等：同 code 已存在则跳过（WHERE NOT EXISTS）
-- 3) 若同 code 已存在但内容不同：本脚本不会覆盖；执行前须人工比对并报告冲突
-- 4) 通过 JOIN 校验 specialty=rja-ch3 且 category.code 属于 3.1|3.2|3.3
-- 5) 字符集：utf8mb4

INSERT INTO hs_math_knowledge_points
  (code, name, specialty_id, category_id, parent_id, summary, sort_order, is_active)
SELECT v.code, v.name, s.id, c.id, NULL, v.summary, v.sort_order, 1
FROM (
  -- ========== 3.1 函数的概念及其表示 ==========
  SELECT 'rja.3.1.01' AS code, '函数的定义' AS name, '3.1' AS section_code,
    '在数集 A 上，对任意 x∈A 按对应关系 f 有唯一确定的 y∈数集 B 与之对应，则称 f:A→B 为函数；记号 y=f(x)。' AS summary,
    10 AS sort_order
  UNION ALL SELECT 'rja.3.1.02', '定义域', '3.1',
    '使函数有意义的自变量取值全体，记作 D(f) 或定义域；求定义域须考虑分式、根式、对数等限制。', 20
  UNION ALL SELECT 'rja.3.1.03', '值域', '3.1',
    '函数值组成的集合，记作 R(f) 或值域；可由解析式、图象或单调性等求取。', 30
  UNION ALL SELECT 'rja.3.1.04', '对应关系', '3.1',
    '函数三要素之一；同一对应关系可用不同字母表示，关键在“对应法则”本身而非符号。', 40
  UNION ALL SELECT 'rja.3.1.05', '相同函数的判断', '3.1',
    '两函数相同当且仅当定义域相同且对应关系相同（值域随之相同）；仅解析式写法不同可能仍为同一函数。', 50
  UNION ALL SELECT 'rja.3.1.06', '解析法', '3.1',
    '用数学表达式给出对应关系；是高中最常用的表示法，便于求值、讨论性质。', 60
  UNION ALL SELECT 'rja.3.1.07', '图象法', '3.1',
    '在平面直角坐标系中用点集表示函数；图象是点 (x,f(x)) 的轨迹，可直观读定义域、值域与单调性等。', 70
  UNION ALL SELECT 'rja.3.1.08', '列表法', '3.1',
    '用表格列出部分自变量与函数值；适合离散取值或实验数据，一般不能完整刻画连续函数全部性质。', 80
  UNION ALL SELECT 'rja.3.1.09', '分段函数', '3.1',
    '在定义域不同子集上用不同解析式给出对应关系；求值、图象与性质须按区间分别讨论再综合。', 90
  UNION ALL SELECT 'rja.3.1.10', '函数求值', '3.1',
    '给定自变量（或表达式）求函数值；含复合、分段、抽象函数 f(g(x)) 等常见求值题型。', 100

  -- ========== 3.2 函数的基本性质 ==========
  UNION ALL SELECT 'rja.3.2.01', '单调递增', '3.2',
    '在区间 I 上，任意 x1<x2 都有 f(x1)<f(x2)（或 ≤）则称在 I 上（严格）单调递增；须明确所论区间。', 10
  UNION ALL SELECT 'rja.3.2.02', '单调递减', '3.2',
    '在区间 I 上，任意 x1<x2 都有 f(x1)>f(x2)（或 ≥）则称在 I 上（严格）单调递减；须明确所论区间。', 20
  UNION ALL SELECT 'rja.3.2.03', '单调区间', '3.2',
    '函数在其上保持单调的最大区间（或指定区间）；同一函数可有多个单调区间，书写时注意开闭。', 30
  UNION ALL SELECT 'rja.3.2.04', '单调性判断', '3.2',
    '用定义、图象、导数（后续）或已知结论判断单调性；比较 f(x1) 与 f(x2) 时注意变形等价性。', 40
  UNION ALL SELECT 'rja.3.2.05', '单调性与不等式', '3.2',
    '利用单调性比较大小或解不等式：同向可传递；复合时注意内外层单调性组合。', 50
  UNION ALL SELECT 'rja.3.2.06', '最大值', '3.2',
    '若存在 x0∈D 使对任意 x∈D 有 f(x)≤f(x0)，则 f(x0) 为最大值；注意定义域与是否取到。', 60
  UNION ALL SELECT 'rja.3.2.07', '最小值与区间最值', '3.2',
    '最小值类似定义；闭区间上连续函数必有最值。区间最值常结合端点与单调性（或极值）讨论。', 70
  UNION ALL SELECT 'rja.3.2.08', '单调性与最值', '3.2',
    '在单调区间上，端点（或区间趋向）决定最值；先定单调性再求最值，避免只看导数公式而忽略定义域。', 80
  UNION ALL SELECT 'rja.3.2.09', '奇偶性定义与定义域对称', '3.2',
    '讨论奇偶性必须先检验定义域关于原点对称；若不对称则既非奇也非偶。偶：f(-x)=f(x)；奇：f(-x)=-f(x)。零函数在对称定义域上既奇又偶。', 90
  UNION ALL SELECT 'rja.3.2.10', '奇函数与偶函数的判断', '3.2',
    '在定义域已关于原点对称的前提下，用定义、图象或赋值法判断奇/偶；不可仅凭解析式“看起来像”而跳过定义域。', 100
  UNION ALL SELECT 'rja.3.2.11', '既奇又偶、非奇非偶及图象对称', '3.2',
    '既奇又偶⇔在对称定义域上为常值 0（零函数）。非奇非偶常见。偶函数图象关于 y 轴对称；奇函数关于原点对称。', 110
  UNION ALL SELECT 'rja.3.2.12', '奇偶性求值与综合应用', '3.2',
    '用奇偶性求未知函数值、讨论分段/含参奇偶性。与单调性综合时必须明确所讨论的区间（如在 [0,+∞) 增则在对称负半轴相应递减等）。', 120

  -- ========== 3.3 幂函数 ==========
  UNION ALL SELECT 'rja.3.3.01', '幂函数概念', '3.3',
    '形如 y=x^α（α 为常数）的函数称为幂函数；定义域随 α 变化（整数、分数、无理数情形不同）。', 10
  UNION ALL SELECT 'rja.3.3.02', '常见幂函数图象', '3.3',
    '掌握 y=x,x^2,x^3,x^{1/2},x^{-1} 等典型图象过定点、象限分布与大致形状。', 20
  UNION ALL SELECT 'rja.3.3.03', '幂函数性质概览', '3.3',
    '综合定义域、值域、奇偶性、单调性与图象特征；不同 α 性质差异大，勿机械套用。', 30
  UNION ALL SELECT 'rja.3.3.04', '幂函数单调性', '3.3',
    '在各自定义域的合适区间上讨论增减；如 x^2 在 [0,+∞) 增、在 (-∞,0] 减；注意 α 与区间。', 40
  UNION ALL SELECT 'rja.3.3.05', '幂函数奇偶性', '3.3',
    '先看定义域是否关于原点对称，再判断奇偶：如 x^2 偶、x^3 奇、x^{1/2} 定义域非对称故非奇非偶。', 50
) v
INNER JOIN hs_math_specialties s ON s.code = 'rja-ch3'
INNER JOIN hs_math_categories c
  ON c.specialty_id = s.id AND c.code = v.section_code
WHERE NOT EXISTS (
  SELECT 1 FROM hs_math_knowledge_points kp WHERE kp.code = v.code
);

-- 执行后建议只读核验（本阶段不自动执行）：
-- SELECT code, name FROM hs_math_knowledge_points WHERE code LIKE 'rja.3.%' ORDER BY code;
-- SELECT COUNT(*) FROM hs_math_knowledge_points kp
--   JOIN hs_math_categories c ON c.id=kp.category_id
--   JOIN hs_math_specialties s ON s.id=c.specialty_id
--  WHERE s.code='rja-ch3';  -- 期望 27
-- 3.4 仍应存在且无本种子 KP：
-- SELECT code, name FROM hs_math_categories c
--   JOIN hs_math_specialties s ON s.id=c.specialty_id
--  WHERE s.code='rja-ch3' AND c.code='3.4';
