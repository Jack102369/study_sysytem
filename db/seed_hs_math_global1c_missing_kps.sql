-- HS-MATH-BANK-GLOBAL-1C KP 种子迁移草案
-- 库：study_system
-- 状态：NOT_EXECUTED（需单独授权后执行）
-- 生成自：docs/high_school_math/question_bank/kp-seed-g1c.mjs
-- 范围：仅 INSERT hs_math_knowledge_points（缺失章/小节）
-- 不改 specialty / category；不碰训练题 / 审核记录 / AI 开关
--
-- 安全：
-- 1) 禁止 REPLACE INTO / ON DUPLICATE KEY UPDATE
-- 2) 幂等：同 code 已存在则跳过（WHERE NOT EXISTS）
-- 3) 通过 JOIN 校验 specialty + category.code = section_code
-- 4) 字符集：utf8mb4
--
-- 本文件条数：111


-- ========== rja-ch2 (13) ==========
INSERT INTO hs_math_knowledge_points
  (code, name, specialty_id, category_id, parent_id, summary, sort_order, is_active)
SELECT v.code, v.name, s.id, c.id, NULL, v.summary, v.sort_order, 1
FROM (
  SELECT 'rja.2.1.01' AS code, '不等式的基本性质' AS name, '2.1' AS section_code,
    '不等式的传递、加法、乘法（注意乘数符号）等基本性质。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rja.2.1.02' AS code, '作差比较大小' AS name, '2.1' AS section_code,
    '通过作差并因式分解或配方比较两式大小。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rja.2.1.03' AS code, '不等式应用建模' AS name, '2.1' AS section_code,
    '把实际约束翻译成不等式并求解。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rja.2.1.04' AS code, '等式的基本性质' AS name, '2.1' AS section_code,
    '等式两边同加、同乘（非零）保持等式。' AS summary, 40 AS sort_order
  UNION ALL SELECT 'rja.2.2.01' AS code, '算术-几何平均不等式' AS name, '2.2' AS section_code,
    '对正数 a,b：(a+b)/2≥√(ab)，等号当且仅当 a=b。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rja.2.2.02' AS code, '配凑法求最值' AS name, '2.2' AS section_code,
    '通过换元或配凑使乘积或和为定值以求最值。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rja.2.2.03' AS code, '基本不等式双变量' AS name, '2.2' AS section_code,
    '两正变量和定积最大、积定和最小等典型模型。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rja.2.2.04' AS code, '基本不等式应用注意' AS name, '2.2' AS section_code,
    '正数条件、等号成立条件；一正二定三等号。' AS summary, 40 AS sort_order
  UNION ALL SELECT 'rja.2.3.01' AS code, '三个二次的关系' AS name, '2.3' AS section_code,
    '二次函数、方程、不等式通过图象与根相互转化。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rja.2.3.02' AS code, '一元二次不等式解法' AS name, '2.3' AS section_code,
    '先求根再根据开口确定解集（两根之间或之外）。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rja.2.3.03' AS code, '含参二次不等式' AS name, '2.3' AS section_code,
    '参数影响判别式、根的分布与解集分类讨论。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rja.2.3.04' AS code, '二次函数区间最值' AS name, '2.3' AS section_code,
    '闭区间上结合顶点是否落入区间求最值。' AS summary, 40 AS sort_order
  UNION ALL SELECT 'rja.2.3.05' AS code, '根的分布' AS name, '2.3' AS section_code,
    '用判别式、对称轴、端点符号讨论根的位置。' AS summary, 50 AS sort_order
) v
INNER JOIN hs_math_specialties s ON s.code = 'rja-ch2'
INNER JOIN hs_math_categories c
  ON c.specialty_id = s.id AND c.code = v.section_code
WHERE NOT EXISTS (
  SELECT 1 FROM hs_math_knowledge_points kp WHERE kp.code = v.code
);

-- ========== rja-ch3 (4) ==========
INSERT INTO hs_math_knowledge_points
  (code, name, specialty_id, category_id, parent_id, summary, sort_order, is_active)
SELECT v.code, v.name, s.id, c.id, NULL, v.summary, v.sort_order, 1
FROM (
  SELECT 'rja.3.4.01' AS code, '实际问题函数建模' AS name, '3.4' AS section_code,
    '从实际问题抽象函数关系并明确定义域。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rja.3.4.02' AS code, '分段实际模型' AS name, '3.4' AS section_code,
    '分段计费、分段税率等模型的列式与求值。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rja.3.4.03' AS code, '函数模型选择与比较' AS name, '3.4' AS section_code,
    '比较不同函数模型对同一问题的拟合与预测。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rja.3.4.04' AS code, '用函数解决最值实际问题' AS name, '3.4' AS section_code,
    '在实际约束下求函数最值并解释实际意义。' AS summary, 40 AS sort_order
) v
INNER JOIN hs_math_specialties s ON s.code = 'rja-ch3'
INNER JOIN hs_math_categories c
  ON c.specialty_id = s.id AND c.code = v.section_code
WHERE NOT EXISTS (
  SELECT 1 FROM hs_math_knowledge_points kp WHERE kp.code = v.code
);

-- ========== rja-ch4 (19) ==========
INSERT INTO hs_math_knowledge_points
  (code, name, specialty_id, category_id, parent_id, summary, sort_order, is_active)
SELECT v.code, v.name, s.id, c.id, NULL, v.summary, v.sort_order, 1
FROM (
  SELECT 'rja.4.1.01' AS code, 'n次方根' AS name, '4.1' AS section_code,
    '正数的 n 次方根；偶次根非负，奇次根符号随底数。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rja.4.1.02' AS code, '分数指数幂' AS name, '4.1' AS section_code,
    'a^{m/n} 与根式互化（注意底数条件）；负指数与零指数。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rja.4.1.03' AS code, '指数幂运算' AS name, '4.1' AS section_code,
    '同底数幂乘法、除法、幂的乘方等运算法则。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rja.4.1.04' AS code, '根式与指数互化' AS name, '4.1' AS section_code,
    '根式与分数指数幂的互化及化简。' AS summary, 40 AS sort_order
  UNION ALL SELECT 'rja.4.2.01' AS code, '指数函数概念' AS name, '4.2' AS section_code,
    'y=a^x（a>0,a≠1）的定义域、值域与过定点。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rja.4.2.02' AS code, '指数函数单调性' AS name, '4.2' AS section_code,
    'a>1 增，0<a<1 减；比较大小常用化同底。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rja.4.2.03' AS code, '指数方程' AS name, '4.2' AS section_code,
    '同底化简、换元解指数方程。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rja.4.2.04' AS code, '指数函数图象变换' AS name, '4.2' AS section_code,
    '平移、对称等对指数函数图象的影响。' AS summary, 40 AS sort_order
  UNION ALL SELECT 'rja.4.3.01' AS code, '对数概念' AS name, '4.3' AS section_code,
    '若 a^b=N（a>0,a≠1），则 b=log_a N。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rja.4.3.02' AS code, '对数运算法则' AS name, '4.3' AS section_code,
    '积商幂的对数法则及常用变形。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rja.4.3.03' AS code, '换底公式' AS name, '4.3' AS section_code,
    'log_a b = log_c b / log_c a。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rja.4.3.04' AS code, '对数方程初步' AS name, '4.3' AS section_code,
    '解对数方程时注意真数与底数限制。' AS summary, 40 AS sort_order
  UNION ALL SELECT 'rja.4.4.01' AS code, '对数函数概念' AS name, '4.4' AS section_code,
    'y=log_a x 与指数函数互为反函数；过定点(1,0)。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rja.4.4.02' AS code, '对数函数单调性' AS name, '4.4' AS section_code,
    'a>1 增，0<a<1 减；比大小注意底数。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rja.4.4.03' AS code, '对数函数图象与性质' AS name, '4.4' AS section_code,
    '定义域、值域、渐近线与图象特征。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rja.4.5.01' AS code, '指数增长模型' AS name, '4.5' AS section_code,
    '复利、人口、衰减等指数型实际模型。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rja.4.5.02' AS code, '对数应用' AS name, '4.5' AS section_code,
    '用对数处理乘积或数量级，或解指数型实际方程。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rja.4.5.03' AS code, '二分法思想' AS name, '4.5' AS section_code,
    '用零点存在定理与二分法逼近方程根。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rja.4.5.04' AS code, '复合增长模型' AS name, '4.5' AS section_code,
    '分段增长、多阶段指数或一次复合模型。' AS summary, 40 AS sort_order
) v
INNER JOIN hs_math_specialties s ON s.code = 'rja-ch4'
INNER JOIN hs_math_categories c
  ON c.specialty_id = s.id AND c.code = v.section_code
WHERE NOT EXISTS (
  SELECT 1 FROM hs_math_knowledge_points kp WHERE kp.code = v.code
);

-- ========== rja-ch5 (22) ==========
INSERT INTO hs_math_knowledge_points
  (code, name, specialty_id, category_id, parent_id, summary, sort_order, is_active)
SELECT v.code, v.name, s.id, c.id, NULL, v.summary, v.sort_order, 1
FROM (
  SELECT 'rja.5.1.01' AS code, '角的概念推广' AS name, '5.1' AS section_code,
    '任意角、象限角、终边相同的角。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rja.5.1.02' AS code, '弧度制' AS name, '5.1' AS section_code,
    '弧度定义；角度与弧度互化。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rja.5.1.03' AS code, '弧长应用' AS name, '5.1' AS section_code,
    '弧长公式 l=|α|r（α 为弧度）。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rja.5.2.01' AS code, '三角函数定义' AS name, '5.2' AS section_code,
    '单位圆或坐标定义正弦、余弦、正切。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rja.5.2.02' AS code, '同角关系' AS name, '5.2' AS section_code,
    'sin²θ+cos²θ=1 及商数关系等。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rja.5.2.03' AS code, '三角函数定义域与符号' AS name, '5.2' AS section_code,
    '各三角函数定义域与象限符号。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rja.5.3.01' AS code, '诱导公式' AS name, '5.3' AS section_code,
    '关于 π±α、π/2±α 等诱导公式。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rja.5.3.02' AS code, '互化求值' AS name, '5.3' AS section_code,
    '用诱导公式化为锐角或已知角求值。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rja.5.3.03' AS code, '化简证明' AS name, '5.3' AS section_code,
    '三角式化简与恒等证明。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rja.5.4.01' AS code, '正弦函数性质' AS name, '5.4' AS section_code,
    'y=sin x 的周期性、奇偶性、单调区间与最值。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rja.5.4.02' AS code, '余弦函数性质' AS name, '5.4' AS section_code,
    'y=cos x 的图象与性质。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rja.5.4.03' AS code, '正切函数' AS name, '5.4' AS section_code,
    'y=tan x 的定义域、周期与单调区间。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rja.5.5.01' AS code, '和差公式' AS name, '5.5' AS section_code,
    'sin/cos 的和角、差角公式。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rja.5.5.02' AS code, '二倍角公式' AS name, '5.5' AS section_code,
    '二倍角及降幂公式。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rja.5.5.03' AS code, '辅助角公式' AS name, '5.5' AS section_code,
    'a sinθ+b cosθ 化为单一正弦型。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rja.5.5.04' AS code, '恒等证明' AS name, '5.5' AS section_code,
    '综合运用公式证明三角恒等式。' AS summary, 40 AS sort_order
  UNION ALL SELECT 'rja.5.6.01' AS code, '振幅周期相位' AS name, '5.6' AS section_code,
    '由 A,ω,φ 读振幅、周期、初相。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rja.5.6.02' AS code, '图象变换' AS name, '5.6' AS section_code,
    '伸缩、平移顺序与图象变换。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rja.5.6.03' AS code, '由已知求解析式' AS name, '5.6' AS section_code,
    '由五点或条件待定 A,ω,φ。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rja.5.7.01' AS code, '简谐振动' AS name, '5.7' AS section_code,
    '简谐运动的三角模型。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rja.5.7.02' AS code, '潮汐模型' AS name, '5.7' AS section_code,
    '用正弦型函数刻画潮汐等周期现象。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rja.5.7.03' AS code, '测量应用' AS name, '5.7' AS section_code,
    '解三角形与测高测距等应用。' AS summary, 30 AS sort_order
) v
INNER JOIN hs_math_specialties s ON s.code = 'rja-ch5'
INNER JOIN hs_math_categories c
  ON c.specialty_id = s.id AND c.code = v.section_code
WHERE NOT EXISTS (
  SELECT 1 FROM hs_math_knowledge_points kp WHERE kp.code = v.code
);

-- ========== rjb-ch1 (17) ==========
INSERT INTO hs_math_knowledge_points
  (code, name, specialty_id, category_id, parent_id, summary, sort_order, is_active)
SELECT v.code, v.name, s.id, c.id, NULL, v.summary, v.sort_order, 1
FROM (
  SELECT 'rjb.6.1.01' AS code, '向量概念' AS name, '6.1' AS section_code,
    '向量的定义、几何表示与自由向量。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rjb.6.1.02' AS code, '向量模' AS name, '6.1' AS section_code,
    '向量的模（长度）及其非负性。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rjb.6.1.03' AS code, '相等向量' AS name, '6.1' AS section_code,
    '方向相同且模相等的向量相等。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rjb.6.1.04' AS code, '平行与共线向量' AS name, '6.1' AS section_code,
    '向量平行（共线）的几何含义。' AS summary, 40 AS sort_order
  UNION ALL SELECT 'rjb.6.2.01' AS code, '向量加法' AS name, '6.2' AS section_code,
    '三角形法则、平行四边形法则与运算律。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rjb.6.2.02' AS code, '数量积' AS name, '6.2' AS section_code,
    'a·b=|a||b|cosθ；垂直当且仅当数量积为 0。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rjb.6.2.03' AS code, '向量夹角' AS name, '6.2' AS section_code,
    '由数量积求夹角；注意夹角范围。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rjb.6.2.04' AS code, '投影' AS name, '6.2' AS section_code,
    '向量在某方向上的投影。' AS summary, 40 AS sort_order
  UNION ALL SELECT 'rjb.6.2.05' AS code, '数乘' AS name, '6.2' AS section_code,
    '实数与向量的数乘及几何意义。' AS summary, 50 AS sort_order
  UNION ALL SELECT 'rjb.6.3.01' AS code, '基底' AS name, '6.3' AS section_code,
    '平面向量基本定理：不共线向量作基底。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rjb.6.3.02' AS code, '坐标运算' AS name, '6.3' AS section_code,
    '坐标下的加减、数乘、数量积与模。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rjb.6.3.03' AS code, '共线条件' AS name, '6.3' AS section_code,
    '坐标或数量关系刻画共线。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rjb.6.3.04' AS code, '向量垂直的坐标条件' AS name, '6.3' AS section_code,
    '坐标数量积为 0 当且仅当垂直。' AS summary, 40 AS sort_order
  UNION ALL SELECT 'rjb.6.4.01' AS code, '向量应用' AS name, '6.4' AS section_code,
    '用向量处理平面几何与实际位移问题。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rjb.6.4.02' AS code, '位移合成' AS name, '6.4' AS section_code,
    '位移、速度等矢量合成。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rjb.6.4.03' AS code, '功的计算' AS name, '6.4' AS section_code,
    '恒力做功 W=F·s。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rjb.6.4.04' AS code, '几何证明' AS name, '6.4' AS section_code,
    '用向量证明平行、中点、垂直等。' AS summary, 40 AS sort_order
) v
INNER JOIN hs_math_specialties s ON s.code = 'rjb-ch1'
INNER JOIN hs_math_categories c
  ON c.specialty_id = s.id AND c.code = v.section_code
WHERE NOT EXISTS (
  SELECT 1 FROM hs_math_knowledge_points kp WHERE kp.code = v.code
);

-- ========== rjb-ch2 (7) ==========
INSERT INTO hs_math_knowledge_points
  (code, name, specialty_id, category_id, parent_id, summary, sort_order, is_active)
SELECT v.code, v.name, s.id, c.id, NULL, v.summary, v.sort_order, 1
FROM (
  SELECT 'rjb.7.1.01' AS code, '虚数单位' AS name, '7.1' AS section_code,
    'i²=-1；复数 a+bi 及实部虚部。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rjb.7.1.02' AS code, '复数相等' AS name, '7.1' AS section_code,
    '两复数相等当且仅当实部、虚部分别相等。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rjb.7.1.03' AS code, '复平面' AS name, '7.1' AS section_code,
    '复数与复平面点或向量的对应。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rjb.7.2.01' AS code, '复数运算' AS name, '7.2' AS section_code,
    '加减乘除运算法则（除法用共轭）。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rjb.7.2.02' AS code, '共轭复数' AS name, '7.2' AS section_code,
    '共轭的性质与几何意义。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rjb.7.3.01' AS code, '复数模' AS name, '7.3' AS section_code,
    '|a+bi|=√(a²+b²)；模的乘法性质。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rjb.7.3.02' AS code, '复数三角形式初步' AS name, '7.3' AS section_code,
    '选学：三角形式与辐角（系统保留小节）。' AS summary, 20 AS sort_order
) v
INNER JOIN hs_math_specialties s ON s.code = 'rjb-ch2'
INNER JOIN hs_math_categories c
  ON c.specialty_id = s.id AND c.code = v.section_code
WHERE NOT EXISTS (
  SELECT 1 FROM hs_math_knowledge_points kp WHERE kp.code = v.code
);

-- ========== rjb-ch3 (15) ==========
INSERT INTO hs_math_knowledge_points
  (code, name, specialty_id, category_id, parent_id, summary, sort_order, is_active)
SELECT v.code, v.name, s.id, c.id, NULL, v.summary, v.sort_order, 1
FROM (
  SELECT 'rjb.8.1.01' AS code, '棱柱概念' AS name, '8.1' AS section_code,
    '棱柱、棱锥、棱台、圆柱圆锥球等基本结构。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rjb.8.1.02' AS code, '简单组合体' AS name, '8.1' AS section_code,
    '识别由基本几何体组成的组合体。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rjb.8.2.01' AS code, '斜二测' AS name, '8.2' AS section_code,
    '斜二测画法规则与直观图还原。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rjb.8.2.02' AS code, '直观图与原图关系' AS name, '8.2' AS section_code,
    '长度、平行性在直观图中的保持与变化。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rjb.8.3.01' AS code, '柱体体积' AS name, '8.3' AS section_code,
    '柱体体积 V=Sh。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rjb.8.3.02' AS code, '锥体应用' AS name, '8.3' AS section_code,
    '锥体体积 V=(1/3)Sh 及应用。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rjb.8.3.03' AS code, '组合体' AS name, '8.3' AS section_code,
    '组合体表面积与体积的分割或补形。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rjb.8.3.04' AS code, '球体表面积与体积' AS name, '8.3' AS section_code,
    '球的表面积与体积公式。' AS summary, 40 AS sort_order
  UNION ALL SELECT 'rjb.8.4.01' AS code, '平行公理' AS name, '8.4' AS section_code,
    '平行公理及推论；异面直线概念。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rjb.8.4.02' AS code, '直线与平面位置关系' AS name, '8.4' AS section_code,
    '线面平行、相交、在平面内。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rjb.8.5.01' AS code, '线面平行判定' AS name, '8.5' AS section_code,
    '线面平行的判定与性质定理。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rjb.8.5.02' AS code, '面面平行' AS name, '8.5' AS section_code,
    '面面平行的判定与性质。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rjb.8.6.01' AS code, '线面垂直' AS name, '8.6' AS section_code,
    '线面垂直判定与性质；线线垂直关系。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rjb.8.6.02' AS code, '垂直证明' AS name, '8.6' AS section_code,
    '综合运用线面、面面垂直证明。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rjb.8.6.03' AS code, '面面垂直' AS name, '8.6' AS section_code,
    '面面垂直判定与性质。' AS summary, 30 AS sort_order
) v
INNER JOIN hs_math_specialties s ON s.code = 'rjb-ch3'
INNER JOIN hs_math_categories c
  ON c.specialty_id = s.id AND c.code = v.section_code
WHERE NOT EXISTS (
  SELECT 1 FROM hs_math_knowledge_points kp WHERE kp.code = v.code
);

-- ========== rjb-ch4 (7) ==========
INSERT INTO hs_math_knowledge_points
  (code, name, specialty_id, category_id, parent_id, summary, sort_order, is_active)
SELECT v.code, v.name, s.id, c.id, NULL, v.summary, v.sort_order, 1
FROM (
  SELECT 'rjb.9.1.01' AS code, '简单随机抽样' AS name, '9.1' AS section_code,
    '简单随机抽样的含义与实施要点。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rjb.9.1.02' AS code, '系统抽样与分层抽样' AS name, '9.1' AS section_code,
    '系统抽样、分层抽样的适用场景。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rjb.9.2.01' AS code, '频率估计概率' AS name, '9.2' AS section_code,
    '用频率稳定估计概率或总体比例。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rjb.9.2.02' AS code, '样本数字特征' AS name, '9.2' AS section_code,
    '均值、方差、百分位数等估计总体。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rjb.9.2.03' AS code, '用样本估计总体分布' AS name, '9.2' AS section_code,
    '频率分布直方图等。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rjb.9.3.01' AS code, '回归思想' AS name, '9.3' AS section_code,
    '线性回归思想与相关性直观理解。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rjb.9.3.02' AS code, '统计分析案例阅读' AS name, '9.3' AS section_code,
    '阅读案例中的抽样与推断逻辑。' AS summary, 20 AS sort_order
) v
INNER JOIN hs_math_specialties s ON s.code = 'rjb-ch4'
INNER JOIN hs_math_categories c
  ON c.specialty_id = s.id AND c.code = v.section_code
WHERE NOT EXISTS (
  SELECT 1 FROM hs_math_knowledge_points kp WHERE kp.code = v.code
);

-- ========== rjb-ch5 (7) ==========
INSERT INTO hs_math_knowledge_points
  (code, name, specialty_id, category_id, parent_id, summary, sort_order, is_active)
SELECT v.code, v.name, s.id, c.id, NULL, v.summary, v.sort_order, 1
FROM (
  SELECT 'rjb.10.1.01' AS code, '样本空间' AS name, '10.1' AS section_code,
    '随机试验与样本空间。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rjb.10.1.02' AS code, '古典概型' AS name, '10.1' AS section_code,
    '等可能基本事件下的概率计算。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rjb.10.1.03' AS code, '事件关系与运算' AS name, '10.1' AS section_code,
    '并、交、对立事件及概率性质。' AS summary, 30 AS sort_order
  UNION ALL SELECT 'rjb.10.2.01' AS code, '独立事件' AS name, '10.2' AS section_code,
    '独立当且仅当 P(AB)=P(A)P(B)。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rjb.10.2.02' AS code, '独立重复试验初步' AS name, '10.2' AS section_code,
    '独立重复情境下的概率计算入门。' AS summary, 20 AS sort_order
  UNION ALL SELECT 'rjb.10.3.01' AS code, '大数定律思想' AS name, '10.3' AS section_code,
    '频率稳定于概率的直观（大数定律思想）。' AS summary, 10 AS sort_order
  UNION ALL SELECT 'rjb.10.3.02' AS code, '频率与概率关系' AS name, '10.3' AS section_code,
    '用频率估计概率的适用条件与误差意识。' AS summary, 20 AS sort_order
) v
INNER JOIN hs_math_specialties s ON s.code = 'rjb-ch5'
INNER JOIN hs_math_categories c
  ON c.specialty_id = s.id AND c.code = v.section_code
WHERE NOT EXISTS (
  SELECT 1 FROM hs_math_knowledge_points kp WHERE kp.code = v.code
);
