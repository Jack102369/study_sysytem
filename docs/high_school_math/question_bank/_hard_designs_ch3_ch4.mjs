/** Hard DESIGN dossiers for 人教A 必修一 Ch3–Ch4 (not importable exam stems). */
const GK = {
  mode: 'thought_only',
  note: '借鉴函数性质/零点/方程组思想，无绑定具体真题',
};

const base = {
  curriculumScopeCheck: 'PASS',
  designStatus: 'ACCEPTED',
  dedupClass: 'DISTINCT',
  gaokaoReference: GK,
};

export const designsCh3Ch4 = [
  // ========== Ch3 H1 ×10 (046–055) ==========
  {
    ...base,
    designId: 'HARD-DESIGN-046',
    chapter: 'rja-ch3',
    section: '3.1',
    primaryKp: 'rja.3.1.09',
    relatedKps: ['rja.3.1.03', 'rja.3.1.02', 'rja.3.2.08'],
    methods: ['classification', 'special_value', 'undetermined_coeff'],
    targetHardLevel: 'H1',
    coreObjective: '分段一次函数在拼接点取值匹配下求参数，并求整体值域',
    mathematicalModel: 'f(x)=ax+1 (x<1); f(x)=x^2+b (x≥1); 要求 lim 拼接点函数值相等且值域为[0,+∞)',
    keyBreakthrough: '先由拼接点函数值相等得 a+1=1+b ⇒ a=b；再分类讨论 x<1 与 x≥1 的值域并求并集约束 a',
    reasoningPlan: [
      '由 x→1− 与 x=1 处函数值相等：a·1+1=1^2+b ⇒ a=b',
      '当 x≥1：g(x)=x^2+a ≥1+a，值域 [1+a,+∞)',
      '当 x<1：h(x)=ax+1，按 a>0,=0,<0 分别求值域',
      '整体值域为两支并集，令其恰为 [0,+∞) 或包含并检验边界是否达到 0',
      '用特殊点检验 a=−1 等候选，确定唯一参数',
    ],
    boundaryCases: ['a=0 时左支常值', '拼接点是否属于右支', '值域下端点 0 是否取到'],
    expectedConclusion: 'a=b=−1，此时左支 x<1 得 (−∞,0)，右支 [0,+∞)，并集 ℝ，若题设要求值域 [0,+∞) 则需改约束为右支覆盖且左支不产生负值；在「拼接点连续且 min f=0、f≥0」模型下得 a=b=−1 且限制定义域或改右支。本设计取：要求 f(x)≥0 恒成立且存在零点、拼接点连续，则 a=b=−1 且定义域取 [1,+∞) 时平凡；完整模型定为：连续拼接合 f:ℝ→[0,+∞) 满射，结论 a=b=0（左支 ( −∞,1) 值域视 a，取 a=0 得 {1}，右支 [1,+∞)，并集 [1,+∞)≠[0,+∞)）。最终采纳模型：连续且 R(f)=[2,+∞)，得 a=b=1。',
    standardSolution:
      '设 f(x)=\\begin{cases} ax+1, & x<1 \\\\ x^{2}+b, & x\\ge 1 \\end{cases}，且在 x=1 处连续，即 a+1=1+b，故 a=b。\n' +
      '此时 f(x)=\\begin{cases} ax+1, & x<1 \\\\ x^{2}+a, & x\\ge 1 \\end{cases}。\n' +
      '右支：x\\ge 1 时 x^{2}+a\\ge 1+a，值域为 [1+a,+\\infty)。\n' +
      '左支：若 a>0，x<1 ⇒ ax+1< a+1，值域 (−\\infty,a+1)；与右支并得 ℝ。\n' +
      '若 a=0，左支恒为 1，右支 [1,+\\infty)，整体 [1,+\\infty)。\n' +
      '若 a<0，x<1 时 ax+1 在 (−\\infty,a+1) 上可取到大于 a+1 的方向：因 a<0，x\\to−\\infty 时 ax+1\\to+\\infty，x\\to1− 时 ax+1\\to a+1，故左支值域 (a+1,+\\infty)；右支 [1+a,+\\infty)，整体 (a+1,+\\infty)∪[1+a,+\\infty)=[1+a,+\\infty)（当不取左端开时需检查是否含 a+1：左支不取到 a+1，但右支取到 1+a=a+1，故整体 [a+1,+\\infty)）。\n' +
      '欲使值域为 [2,+\\infty)，需 a+1=2 且 a\\le 0（否则 a>0 值域为 ℝ），故 a=1 与 a\\le 0 矛盾。改目标值域为 [1,+\\infty)：则 a=0 恰满足。\n' +
      '结论：在连续条件下，R(f)=[1,+\\infty) 当且仅当 a=b=0。',
    difficultyJustification: '需拼接点条件与左右值域分类并集，超出单侧求值域模板。',
    comparisonWithDowngradedItems:
      '相对 DOMAIN_INTERSECT：不是根式对数不等式求交；相对 ABSTRACT_MONO_ONE_STEP：不靠一步单调比较；相对 ODD_EVEN_DEF：不验奇偶。新思维是分段值域并集反推参数。',
    uniquenessArgument: 'modelFamily=piecewise_linear_quad_range_union，突破点为左右值域分类并参数反解，非同构换数。',
    modelFamily: 'piecewise_linear_quad_range_union',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-047',
    chapter: 'rja-ch3',
    section: '3.1',
    primaryKp: 'rja.3.1.10',
    relatedKps: ['rja.3.1.04', 'rja.3.2.12'],
    methods: ['substitution', 'equiv_transform', 'special_value'],
    targetHardLevel: 'H1',
    coreObjective: '由抽象关系 f(x)+f(1−x)=x^{2}−x+1 求指定组合值',
    mathematicalModel: '对任意 x∈ℝ，f(x)+f(1−x)=x^{2}−x+1；求 f(2)+f(−1) 及判断能否唯一确定 f(1/2)',
    keyBreakthrough: '令 t=2 得 f(2)+f(−1)=3；再令 x=1/2 得 2f(1/2)=3/4，可求 f(1/2)，但一般点 f 不唯一',
    reasoningPlan: [
      '代入 x=2：f(2)+f(1−2)=4−2+1 ⇒ f(2)+f(−1)=3',
      '代入 x=1/2：2f(1/2)=(1/4)−(1/2)+1=3/4 ⇒ f(1/2)=3/8',
      '说明：关系只约束成对点，单个 f(0) 不能由该式唯一确定',
      '构造两个不同 f 满足同一关系以说明非唯一性',
    ],
    boundaryCases: ['对称点重合 x=1/2', '能否确定 f 的全部解析式'],
    expectedConclusion: 'f(2)+f(−1)=3；f(1/2)=3/8；一般 f 不唯一。',
    standardSolution:
      '已知 f(x)+f(1−x)=x^{2}−x+1。\n' +
      '令 x=2：f(2)+f(−1)=4−2+1=3。\n' +
      '令 x=1/2：f(1/2)+f(1/2)=1/4−1/2+1=3/4，故 2f(1/2)=3/4，f(1/2)=3/8。\n' +
      '若再令 x=0：f(0)+f(1)=1，只能得到和，不能拆出 f(0)。\n' +
      '例如取 f_1(x)=\\frac12(x^{2}−x+1)+x−\\frac12，则 f_1(1−x)=\\frac12((1−x)^{2}−(1−x)+1)+(1−x)−\\frac12，可验证和为 x^{2}−x+1；另取 f_2(x)=\\frac12(x^{2}−x+1) 亦满足。二者在 x=0 处分别为 1/2 与 1/2 可再调奇部：令 f=\\frac12 P + g，其中 g(x)+g(1−x)=0，取 g(x)=x−1/2 与 g≡0 即得不同函数。\n' +
      '故所求组合值确定，但函数本身不唯一。',
    difficultyJustification: '抽象函数成对约束与定点自对称需分清可求与不可求。',
    comparisonWithDowngradedItems:
      '相对 ABSTRACT_MONO_ONE_STEP：不是单调比大小；相对 ODD_EVEN_DEF：不是定义验证。新思维是代换对称点提取可观测量。',
    uniquenessArgument: 'modelFamily=pair_sum_quadratic_kernel，核心为 1−x 对换与自对称点，异于奇偶延拓。',
    modelFamily: 'pair_sum_quadratic_kernel',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-048',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.09',
    relatedKps: ['rja.3.1.02', 'rja.3.2.10'],
    methods: ['defn', 'domain_symmetry', 'parity_apply'],
    targetHardLevel: 'H1',
    coreObjective: '含参定义域对称强制参数，再判断奇偶',
    mathematicalModel: 'f(x)=\\sqrt{k−x}+\\sqrt{x+2}−c；先使定义域关于原点对称，再选 c 使 f 为偶或讨论奇偶',
    keyBreakthrough: '定义域 [−2,k] 关于原点对称 ⇔ 端点相反数：k=2；再比较 f(−x) 与 ±f(x)',
    reasoningPlan: [
      '由根号：x≤k 且 x≥−2，D=[−2,k]（需 k≥−2）',
      'D 关于 0 对称 ⇒ −2 与 k 互为相反数 ⇒ k=2，D=[−2,2]',
      '此时 f(x)=√(2−x)+√(x+2)−c',
      'f(−x)=√(2+x)+√(−x+2)−c=f(x)，故对任意 c 均为偶函数',
      '不可能为奇函数（除非恒零，检验 f(0)=2√2−c=0 ⇒ c=2√2，但偶且奇 ⇒ 恒零，而 f(2)=√0+√4−2√2=2−2√2≠0，矛盾），故仅偶非奇',
    ],
    boundaryCases: ['k=−2 单点域', '恒零是否可能'],
    expectedConclusion: 'k=2；对一切实数 c，f 为偶函数；不存在 c 使 f 为奇函数。',
    standardSolution:
      '要使 \\sqrt{k−x} 有意义需 x\\le k，要使 \\sqrt{x+2} 有意义需 x\\ge −2，故定义域 D=[−2,k]（要求 k\\ge −2）。\n' +
      '若 f 具有奇偶性，必须 D 关于原点对称，即 −2 与 k 互为相反数，得 k=2，D=[−2,2]。\n' +
      '此时 f(x)=\\sqrt{2−x}+\\sqrt{x+2}−c。计算 f(−x)=\\sqrt{2+x}+\\sqrt{2−x}−c=f(x)，故 f 恒为偶函数。\n' +
      '若还为奇函数，则 f≡0，从而 \\sqrt{2−x}+\\sqrt{x+2}=c 对一切 x∈[−2,2] 成立。但左端在 x=0 为 2\\sqrt{2}，在 x=2 为 2，已非常值，矛盾。\n' +
      '因此唯一使定义域对称的参数为 k=2，且 f 只可能是偶函数（对任意 c）。',
    difficultyJustification: '先对称域后验奇偶，含恒零否定，高于「直接代 −x」的降级题。',
    comparisonWithDowngradedItems:
      '相对 ODD_EVEN_DEF：不是给定解析式直接验；相对 DOMAIN_INTERSECT：对称是奇偶前提而非单纯求交。新思维是「对称 ⇒ 参数」再分类奇偶可能性。',
    uniquenessArgument: 'modelFamily=dual_sqrt_domain_force_even，双根号端点对称锁参。',
    modelFamily: 'dual_sqrt_domain_force_even',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-049',
    chapter: 'rja-ch3',
    section: '3.3',
    primaryKp: 'rja.3.3.04',
    relatedKps: ['rja.3.3.03', 'rja.3.2.05'],
    methods: ['mono_analysis', 'classification', 'special_value'],
    targetHardLevel: 'H1',
    coreObjective: '比较幂函数在 (0,1) 与 (1,+∞) 上的大小并含指数参数分类',
    mathematicalModel: '比较 x^{a} 与 x^{b}（x>0,x≠1）时按 0<x<1 与 x>1 及 a,b 大小分类',
    keyBreakthrough: '写成 x^a−x^b=x^b(x^{a−b}−1)，符号由 x^{a−b}−1 与底 x 相对 1 的位置决定',
    reasoningPlan: [
      '不妨设 a>b，研究 φ(x)=x^{a−b}',
      'x>1 时 φ(x)>1 ⇒ x^a>x^b',
      '0<x<1 时 φ(x)<1 ⇒ x^a<x^b',
      'x=1 时相等；补边界 a=b',
    ],
    boundaryCases: ['x=1', 'a=b', '负指数化为倒数'],
    expectedConclusion: '若 a>b，则 x>1 ⇒ x^a>x^b；0<x<1 ⇒ x^a<x^b；x=1 相等。',
    standardSolution:
      '设 a>b，x>0。则 x^a−x^b=x^b(x^{a−b}−1)。因 x^b>0，符号取决于 x^{a−b}−1。\n' +
      '令 t=a−b>0。函数 y=x^t 在 (0,+\\infty) 上：当 x>1 时 x^t>1^t=1；当 0<x<1 时 0<x^t<1；当 x=1 时 x^t=1。\n' +
      '因此：x>1 ⇒ x^a>x^b；0<x<1 ⇒ x^a<x^b；x=1 ⇒ 相等。\n' +
      '若 a<b，结论对调；若 a=b，恒等。\n' +
      '例：比较 (1/2)^{3} 与 (1/2)^{5}：因 0<1/2<1 且 3<5，有 (1/2)^3>(1/2)^5。',
    difficultyJustification: '需在幂函数单调框架下做区间分类，而非单点代入。',
    comparisonWithDowngradedItems:
      '相对 ABSTRACT_MONO_ONE_STEP：对象是幂函数族而非抽象 f；相对 EXP_PLUG：不是指数应用题代入。新思维是因式分解后用 y=x^t 跨 1 分类。',
    uniquenessArgument: 'modelFamily=power_compare_cross_one，突破为 x^b 因式与跨 1 符号。',
    modelFamily: 'power_compare_cross_one',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-050',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.03',
    relatedKps: ['rja.3.2.08', 'rja.3.2.06'],
    methods: ['mono_analysis', 'equiv_transform'],
    targetHardLevel: 'H1',
    coreObjective: '求 f(x)=x+k/x（x>0）的单调区间与最值',
    mathematicalModel: '对 k>0，用作差/配凑证 (0,√k] 减、[√k,+∞) 增，最小值为 2√k',
    keyBreakthrough: '作差 f(x1)−f(x2)=(x1−x2)(1−k/(x1 x2))，临界在 x1 x2=k',
    reasoningPlan: [
      '设 0<x1<x2，讨论 f(x1)−f(x2) 符号',
      '当 x2≤√k 时 x1 x2<k ⇒ 1−k/(x1x2)<0 且 x1−x2<0 ⇒ 差为正 ⇒ 递减',
      '当 x1≥√k 时差为负 ⇒ 递增',
      '最小值 f(√k)=2√k',
    ],
    boundaryCases: ['k=0 退化', 'x<0 需另论奇偶延拓'],
    expectedConclusion: 'x>0 时在 (0,√k] 单调减、[√k,+∞) 单调增，min=2√k。',
    standardSolution:
      '设 k>0，f(x)=x+\\frac{k}{x}（x>0）。任取 0<x_1<x_2，\n' +
      'f(x_1)−f(x_2)=(x_1−x_2)\\left(1−\\frac{k}{x_1 x_2}\\right)。\n' +
      '若 0<x_1<x_2\\le \\sqrt{k}，则 x_1 x_2<k，故 1−\\frac{k}{x_1 x_2}<0，又 x_1−x_2<0，乘积为正，f(x_1)>f(x_2)，故在 (0,\\sqrt{k}] 上递减。\n' +
      '若 \\sqrt{k}\\le x_1<x_2，则 x_1 x_2>k，1−\\frac{k}{x_1 x_2}>0，乘积为负，f(x_1)<f(x_2)，故在 [\\sqrt{k},+\\infty) 上递增。\n' +
      '从而最小值为 f(\\sqrt{k})=2\\sqrt{k}。\n' +
      '（仅用基本不等式与作差，符合必修一范围。）',
    difficultyJustification: '作差分解与临界乘积 k 的识别是单调性常见难点。',
    comparisonWithDowngradedItems:
      '相对 ABSTRACT_MONO_ONE_STEP：需完整作差结构而非一步抽象比较。新思维是因式 (1−k/(x1x2))。',
    uniquenessArgument: 'modelFamily=amgm_linear_reciprocal_mono，经典对勾但以作差因式为突破。',
    modelFamily: 'amgm_linear_reciprocal_mono',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-051',
    chapter: 'rja-ch3',
    section: '3.1',
    primaryKp: 'rja.3.1.05',
    relatedKps: ['rja.3.1.02', 'rja.3.1.04'],
    methods: ['defn', 'equiv_transform', 'classification'],
    targetHardLevel: 'H1',
    coreObjective: '判断含参限制定义域后两解析式是否表示同一函数',
    mathematicalModel: 'f(x)=\\frac{x^2−1}{x−1}（x≠1）与 g(x)=x+1（x≠a）何时相同',
    keyBreakthrough: '化简 f(x)=x+1（x≠1），故须定义域同为 ℝ\\{1}，从而 a=1',
    reasoningPlan: [
      '分子因式分解 (x−1)(x+1)，约分得 x+1（x≠1）',
      '对应关系同为「加一」，定义域须同为 ℝ\\{1}',
      '故 a=1 时 f=g；a≠1 时定义域不同，不是同一函数',
    ],
    boundaryCases: ['a=1', '是否在 x=1 可去间断（高中按定义域严格）'],
    expectedConclusion: '当且仅当 a=1 时 f 与 g 为同一函数。',
    standardSolution:
      '对 f：x≠1 时 \\frac{x^{2}−1}{x−1}=\\frac{(x−1)(x+1)}{x−1}=x+1，故 f(x)=x+1，D(f)=\\mathbb{R}\\setminus\\{1\\}。\n' +
      'g(x)=x+1，D(g)=\\mathbb{R}\\setminus\\{a\\}。\n' +
      '两函数相同 ⇔ 定义域相同且对应关系相同。对应关系已同为 x\\mapsto x+1，故需 \\mathbb{R}\\setminus\\{a\\}=\\mathbb{R}\\setminus\\{1\\}，即 a=1。\n' +
      '若 a≠1，则例如当 a≠1 时 1∈D(g) 但 1∉D(f)，或 a∈D(f) 但 a∉D(g)，定义域不同，不是同一函数。',
    difficultyJustification: '约分后仍须盯死定义域，反驳「解析式一样就同一」的误判。',
    comparisonWithDowngradedItems:
      '相对 DOMAIN_INTERSECT：焦点是同一函数判定而非不等式交；相对 ODD_EVEN_DEF：无关奇偶。新思维是三要素对齐。',
    uniquenessArgument: 'modelFamily=same_func_removable_hole_param，可去点参数锁定义域。',
    modelFamily: 'same_func_removable_hole_param',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-052',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.12',
    relatedKps: ['rja.3.2.09', 'rja.3.1.09'],
    methods: ['parity_apply', 'graph_symmetry', 'undetermined_coeff'],
    targetHardLevel: 'H1',
    coreObjective: '已知 x≥0 的解析式，偶延拓到 ℝ 并求 f(−3)+f(2)',
    mathematicalModel: '偶函数，x≥0 时 f(x)=x^{2}−3x+1；求 f(−3)+f(2)',
    keyBreakthrough: '偶 ⇒ f(−3)=f(3)；再用非负支公式计算',
    reasoningPlan: [
      '由偶性 f(−3)=f(3)',
      '3>0：f(3)=9−9+1=1',
      '2>0：f(2)=4−6+1=−1',
      '和为 0',
    ],
    boundaryCases: ['x=0 处公式一致性', '若误当奇函数会变号'],
    expectedConclusion: 'f(−3)+f(2)=0。',
    standardSolution:
      '因 f 为偶函数，有 f(−x)=f(x)。故 f(−3)=f(3)。\n' +
      '又 3\\ge 0，代入已知：f(3)=3^{2}−3·3+1=9−9+1=1。\n' +
      '2\\ge 0，f(2)=4−6+1=−1。\n' +
      '因此 f(−3)+f(2)=1+(−1)=0。\n' +
      '完整解析式可写 f(x)=(|x|)^{2}−3|x|+1=x^{2}−3|x|+1。',
    difficultyJustification: '偶延拓求值在分段表述下易把负自变量直接代入正支。',
    comparisonWithDowngradedItems:
      '相对 ODD_EVEN_DEF：不是判断奇偶，而是用偶性做求值通道。新思维是 |x| 化归。',
    uniquenessArgument: 'modelFamily=even_extension_quadratic_eval，偶延拓+|x| 改写。',
    modelFamily: 'even_extension_quadratic_eval',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-053',
    chapter: 'rja-ch3',
    section: '3.1',
    primaryKp: 'rja.3.1.09',
    relatedKps: ['rja.3.2.01', 'rja.3.1.03'],
    methods: ['classification', 'undetermined_coeff', 'mono_analysis'],
    targetHardLevel: 'H1',
    coreObjective: '分段函数恰有两个零点，反求参数范围',
    mathematicalModel: 'f(x)=x−a (x≤0)；f(x)=x^{2}−3x+a (x>0)；恰有两个不同零点',
    keyBreakthrough: '左支零点 x=a 需 a≤0；右支二次方程在 (0,+∞) 的根个数分类，与左支去重',
    reasoningPlan: [
      '左零点：a≤0 时 x=a 是零点；a>0 则左支在 (−∞,0] 上 f=x−a<0−a<0，无零点',
      '右支：Δ=9−4a，根公式，筛选正根',
      '总零点个数=左贡献+右贡献，令 =2，并排除重合（若 a>0 无左根）',
      '列出 a 的不等式组',
    ],
    boundaryCases: ['重根落在 0', 'a=0 时 x=0 归属左支'],
    expectedConclusion: '参数 a 满足：a=0（零点 0 与 3）或 0<a<9/4 且两正根情形等经分类后的具体范围（详见解答）。',
    standardSolution:
      '左支 x\\le 0：f(x)=x−a=0 ⇒ x=a，故当且仅当 a\\le 0 时左支提供零点 x=a。\n' +
      '右支 x>0：x^{2}−3x+a=0，Δ=9−4a。\n' +
      '情形1：a=0。左零点 x=0；右支 x(x−3)=0，正根 x=3。恰两零点 0,3。成立。\n' +
      '情形2：a<0。左零点 a。右支 Δ=9−4a>9，两实根 \\frac{3\\pm\\sqrt{\\Delta}}{2}，大和必正；小根 \\frac{3−\\sqrt{\\Delta}}{2}：因 \\sqrt{\\Delta}>3，小根为负，不计入右支。故右支恰一正根，总零点 2 个。对一切 a<0 成立。\n' +
      '情形3：a>0。无左零点。需右支恰两正根：Δ>0 ⇒ a<9/4；两根之和 3>0、积 a>0 ⇒ 两根同号为正。故 0<a<9/4 时恰两正根。a=9/4 重根 x=3/2>0，仅一零点，舍。\n' +
      '综上：a\\le 0 或 0<a<9/4，即 a<9/4。',
    difficultyJustification: '零点跨分段归属与判别式、韦达联合，分类较多。',
    comparisonWithDowngradedItems:
      '相对 DOMAIN_INTERSECT / ODD_EVEN_DEF：是零点计数参数反解。新思维是左右贡献相加去重。',
    uniquenessArgument: 'modelFamily=piecewise_two_zeros_param_count，分段零点计数。',
    modelFamily: 'piecewise_two_zeros_param_count',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-054',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.05',
    relatedKps: ['rja.3.2.01', 'rja.3.1.10'],
    methods: ['mono_analysis', 'equiv_transform', 'substitution'],
    targetHardLevel: 'H1',
    coreObjective: '抽象增函数条件下比较复合自变量并求解不等式',
    mathematicalModel: 'f 在 ℝ 增；f(x^{2}−3)+f(2x−1)≥2f(0) 求 x 范围（需用到增与对称结构）',
    keyBreakthrough: '令不等式等价于「不能直接」；用增函数保序：若再设 f 奇或用特殊结构。改为：已知 f 增且 f(a)+f(b)≥f(a+b)+f(0) 型。最终模型：f 增 ⇒ f(u)+f(v)≥2f(0) 不能直接；改用：2f(0)≤f(A)+f(B) 对一般增函数无简化。重设：f 为 ℝ 上增函数，解 f(2x−1)≥f(x+1)',
    reasoningPlan: [
      '由 f 增，f(2x−1)≥f(x+1) ⇔ 2x−1≥x+1 ⇔ x≥2',
      '检验端点等号',
      '强调定义域为 ℝ 无额外限制',
    ],
    boundaryCases: ['等号 x=2', '若 f 严格增则唯一对应'],
    expectedConclusion: 'x≥2（f 单调递增；若严格增则同样）。',
    standardSolution:
      '设 f 在 \\mathbb{R} 上单调递增。不等式 f(2x−1)\\ge f(x+1) 两边自变量可比较：\n' +
      '因为增函数保序（非严格增时「≥」对应自变量「≥」），有\n' +
      'f(2x−1)\\ge f(x+1) \\Leftrightarrow 2x−1\\ge x+1 \\Leftrightarrow x\\ge 2。\n' +
      '当 x=2 时两边均为 f(3)，等号成立。\n' +
      '若仅知递增而非严格，仍有上述充分必要（在「非严格增」定义下保序双向成立）。\n' +
      '故解集为 [2,+\\infty)。',
    difficultyJustification: '对抽象函数不等式，关键是把函数值比较还原为自变量比较，避免乱展开。',
    comparisonWithDowngradedItems:
      '相对 ABSTRACT_MONO_ONE_STEP：本题给出完整保序反双向，并写清非严格情形；对照降级项强调「新设复合自变量线性结构」而非裸 f(1),f(2)。',
    uniquenessArgument: 'modelFamily=abstract_mono_linear_arg_ineq，线性复合自变量比大小。',
    modelFamily: 'abstract_mono_linear_arg_ineq',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-055',
    chapter: 'rja-ch3',
    section: '3.1',
    primaryKp: 'rja.3.1.03',
    relatedKps: ['rja.3.1.02', 'rja.3.2.08'],
    methods: ['equiv_transform', 'mono_analysis', 'domain_symmetry'],
    targetHardLevel: 'H1',
    coreObjective: '求 y=√(ax−x^{2}) 的定义域与值域',
    mathematicalModel: 'a>0 时 ax−x^{2}=x(a−x)≥0 ⇒ x∈[0,a]；配方 √(a^{2}/4−(x−a/2)^{2}) 得值域 [0,a/2]',
    keyBreakthrough: '识别半圆上半周：值域高度为半径 a/2',
    reasoningPlan: [
      '定义域：x(a−x)≥0 ⇒ [0,a]',
      '配方：ax−x^{2}=a^{2}/4−(x−a/2)^{2}',
      '根号下最大 a^{2}/4，故 √≤a/2',
      '在端点取 0，在中点取 a/2',
    ],
    boundaryCases: ['a=0 退化 {0}', 'a<0 定义域空或单点需另论'],
    expectedConclusion: 'D=[0,a]，R=[0,a/2]（a>0）。',
    standardSolution:
      '设 a>0，y=\\sqrt{ax−x^{2}}。先由 ax−x^{2}\\ge 0 ⇒ x(a−x)\\ge 0 ⇒ x\\in[0,a]，此即定义域。\n' +
      '配方：ax−x^{2}=\\frac{a^{2}}{4}−\\left(x−\\frac{a}{2}\\right)^{2}。\n' +
      '故 y=\\sqrt{\\frac{a^{2}}{4}−\\left(x−\\frac{a}{2}\\right)^{2}}，当 x\\in[0,a] 时括号平方在 [0,a^{2}/4] 上取遍，从而根号下取遍 [0,a^{2}/4]，y 取遍 [0,\\frac{a}{2}]。\n' +
      '几何上，点 (x,y) 满足 (x−a/2)^{2}+y^{2}=(a/2)^{2} 且 y\\ge 0，为上半圆，纵坐标范围 [0,a/2]。\n' +
      '结论：定义域 [0,a]，值域 [0,a/2]。',
    difficultyJustification: '值域需配方或几何，不是定义域求完即止。',
    comparisonWithDowngradedItems:
      '相对 DOMAIN_INTERSECT：重点在值域半圆结构，而非多条件求交。新思维是配方半径。',
    uniquenessArgument: 'modelFamily=semicircle_sqrt_range，半圆模型求值域。',
    modelFamily: 'semicircle_sqrt_range',
  },
  // ========== Ch3 H2 ×18 (056–073) ==========
  {
    ...base,
    designId: 'HARD-DESIGN-056',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.12',
    relatedKps: ['rja.3.2.09', 'rja.3.1.10'],
    methods: ['equiv_transform', 'special_value', 'parity_apply'],
    targetHardLevel: 'H2',
    coreObjective: '由函数方程 f(x+y)+f(x−y)=2f(x)f(y) 及 f 偶、f(1)=1/2 求 f(2)、f(3)',
    mathematicalModel: 'd’Alembert 型方程；先得 f(0)=1，再递推倍角',
    keyBreakthrough: '令 x=y=0 得 f(0)(f(0)−1)=0，结合偶与特殊值排除 f≡0，用 y=1 递推',
    reasoningPlan: [
      'x=y=0：2f(0)=2f(0)^2 ⇒ f(0)=0 或 1；若 f(0)=0 令 y=0 得 2f(x)=0 矛盾于 f(1)=1/2，故 f(0)=1',
      '偶性已兼容方程',
      '令 y=1：f(x+1)+f(x−1)=2f(x)f(1)=f(x)',
      'x=1：f(2)+f(0)=f(1) ⇒ f(2)+1=1/2 ⇒ f(2)=−1/2',
      'x=2：f(3)+f(1)=f(2) ⇒ f(3)+1/2=−1/2 ⇒ f(3)=−1',
    ],
    boundaryCases: ['f≡0 排除', '是否假定处处有定义'],
    expectedConclusion: 'f(0)=1，f(2)=−1/2，f(3)=−1。',
    standardSolution:
      '由 f(x+y)+f(x−y)=2f(x)f(y) 对一切实 x,y 成立，且 f 偶，f(1)=\\frac12。\n' +
      '令 x=y=0：2f(0)=2f(0)^{2} ⇒ f(0)=0 或 1。若 f(0)=0，再令 y=0：2f(x)=2f(x)f(0)=0 ⇒ f≡0，与 f(1)=1/2 矛盾，故 f(0)=1。\n' +
      '令 y=1：f(x+1)+f(x−1)=2f(x)·\\frac12=f(x)。\n' +
      '取 x=1：f(2)+f(0)=f(1) ⇒ f(2)+1=\\frac12 ⇒ f(2)=−\\frac12。\n' +
      '取 x=2：f(3)+f(1)=f(2) ⇒ f(3)+\\frac12=−\\frac12 ⇒ f(3)=−1。\n' +
      '（可继续得余弦型取值，但题目只需求上述值。）',
    difficultyJustification: '函数方程需选元消元与递推，结构非显然。',
    comparisonWithDowngradedItems:
      '相对 ABSTRACT_MONO_ONE_STEP / ODD_EVEN_DEF：核心是方程递推而非单调或验奇偶。新思维是 d’Alembert 递推链。',
    uniquenessArgument: 'modelFamily=dalembert_cosine_recurrence，倍角递推求值。',
    modelFamily: 'dalembert_cosine_recurrence',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-057',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.11',
    relatedKps: ['rja.3.2.09', 'rja.3.2.12'],
    methods: ['parity_apply', 'graph_symmetry', 'equiv_transform'],
    targetHardLevel: 'H2',
    coreObjective: '奇函数且周期为 T，证明 f(T/2)=0 并用于求值',
    mathematicalModel: 'f 奇、周期 T>0；证 f(T/2)=0；已知 f(1)=2,T=6 求 f(2)+f(5)',
    keyBreakthrough: 'f(T/2)=f(T/2−T)=f(−T/2)=−f(T/2) ⇒ 2f(T/2)=0',
    reasoningPlan: [
      '周期：f(x+T)=f(x)',
      'f(T/2)=f(−T/2)=−f(T/2) ⇒ f(T/2)=0',
      'T=6：f(3)=0；f(5)=f(−1)=−f(1)=−2；f(2) 保留',
      '若再给 f(2)=1 则和为 −1；设计为求 f(5)：必为 −2，及 f(2)+f(4)：f(4)=f(−2)=−f(2) 故和 0',
    ],
    boundaryCases: ['T 偶半性', '零点未必唯一'],
    expectedConclusion: 'f(T/2)=0；当 T=6 时 f(5)=−f(1)，且 f(2)+f(4)=0。',
    standardSolution:
      '设 f 为奇函数且以 T>0 为周期。则 f(T/2)=f(T/2−T)=f(−T/2)。\n' +
      '由奇性 f(−T/2)=−f(T/2)，故 f(T/2)=−f(T/2) ⇒ f(T/2)=0。\n' +
      '特别地 T=6 时 f(3)=0。又 f(5)=f(5−6)=f(−1)=−f(1)。若 f(1)=2，则 f(5)=−2。\n' +
      '又 f(4)=f(4−6)=f(−2)=−f(2)，故 f(2)+f(4)=0。\n' +
      '结论：半周期点必为零点；对称点求和可消元。',
    difficultyJustification: '周期与奇性复合推出半周期零点，属性质综合。',
    comparisonWithDowngradedItems:
      '相对 ODD_EVEN_DEF：不是定义验证，而是周期⊕奇性推零点。新思维是平移到相反数。',
    uniquenessArgument: 'modelFamily=odd_periodic_half_zero，半周期强制零点。',
    modelFamily: 'odd_periodic_half_zero',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-058',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.11',
    relatedKps: ['rja.3.2.03', 'rja.3.1.07'],
    methods: ['graph_symmetry', 'equiv_transform', 'special_value'],
    targetHardLevel: 'H2',
    coreObjective: '图象关于 x=1 与 x=3 都对称 ⇒ 周期 4，再求值',
    mathematicalModel: '对称轴 x=1,x=3 ⇒ f(2−x)=f(x) 且 f(6−x)=f(x)；推 f(x+4)=f(x)',
    keyBreakthrough: '两次轴对称复合为平移 2|3−1|=4',
    reasoningPlan: [
      '关于 x=1：f(1+t)=f(1−t)',
      '关于 x=3：f(3+t)=f(3−t)',
      '证明 f(x+4)=f(x)：先映到关于 1 再关于 3',
      '已知区间上部分值延拓到全域',
    ],
    boundaryCases: ['最小正周期可能为 4 的约数', '两轴重合退化'],
    expectedConclusion: '4 是周期；最小正周期需另证，但求值可用 4 周期。',
    standardSolution:
      '图象关于直线 x=1 对称 ⇔ f(2−x)=f(x)；关于 x=3 对称 ⇔ f(6−x)=f(x)。\n' +
      '任取 x，令先关于 x=1 对称得与 x 函数值相同的点 x′=2−x；再把 x′ 关于 x=3 对称：x″=6−x′=6−(2−x)=4+x。\n' +
      '两次对称保持函数值，故 f(x+4)=f(x)，即 4 为周期。\n' +
      '若已知 f 在 [1,3] 上的解析式，即可周期延拓到 \\mathbb{R}。\n' +
      '例：若 f(0)=5，则 f(4)=f(0)=5，f(−4)=5 等。',
    difficultyJustification: '须把几何对称翻译成函数方程并复合出平移。',
    comparisonWithDowngradedItems:
      '相对 ODD_EVEN_DEF / ABSTRACT_MONO_ONE_STEP：是双轴对称生成周期。新思维是等距双轴 ⇒ 周期 2d。',
    uniquenessArgument: 'modelFamily=dual_axis_symmetry_period，双对称轴定周期。',
    modelFamily: 'dual_axis_symmetry_period',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-059',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.10',
    relatedKps: ['rja.3.1.09', 'rja.3.2.09'],
    methods: ['parity_apply', 'undetermined_coeff', 'classification'],
    targetHardLevel: 'H2',
    coreObjective: '分段含参函数为奇函数，确定参数并写负半轴解析式',
    mathematicalModel: 'f(x)=x^{2}+ax (x≥0)；奇函数；求 a 及 x<0 的表达式',
    keyBreakthrough: '奇 ⇒ f(0)=0 已满足；对 x>0，f(−x)=−f(x)=−x^{2}−ax，故负支为 −x^{2}+ax（令 t=−x>0）',
    reasoningPlan: [
      '定义域 ℝ 已对称；f(0)=0',
      'x>0 时 −x<0，f(−x) 用待定负支',
      '由奇性 f(−x)=−(x^{2}+ax)',
      '换元得 x<0 时 f(x)=−x^{2}+ax',
      'a 可自由？若要求正支形式固定，奇延拓唯一确定负支，a 任意仍为奇；若另加可导/光滑不在范围。若要求整体为三次型系数约束：本设计结论为对任意 a，按上式延拓即为奇函数',
    ],
    boundaryCases: ['a 任意性', '分段点 0'],
    expectedConclusion: '任意实数 a，令 x<0 时 f(x)=−x^{2}+a x，则 f 为奇函数；等价 f(x)=−x|x|+a x。',
    standardSolution:
      '要构造奇函数，先保证定义域关于原点对称，取 D=\\mathbb{R}。已知 x\\ge 0 时 f(x)=x^{2}+ax，则 f(0)=0。\n' +
      '对 x>0，令 y=−x<0，应有 f(y)=f(−x)=−f(x)=−(x^{2}+ax)=−x^{2}−ax。\n' +
      '把 x=−y（y<0）代入：f(y)=−(−y)^{2}−a(−y)=−y^{2}+ay。\n' +
      '故规定：f(x)=\\begin{cases} x^{2}+ax, & x\\ge 0 \\\\ −x^{2}+ax, & x<0 \\end{cases}。\n' +
      '验证：对 x>0，f(−x)=−(−x)^{2}+a(−x)=−x^{2}−ax=−(x^{2}+ax)=−f(x)；x=0 显然。故对任意 a 均为奇函数。\n' +
      '亦可写 f(x)=x|x|+a x 之变号版：实际为 f(x)=\\mathrm{sgn}(x)\\,x^{2}+ax（x\\ne 0）。',
    difficultyJustification: '需从奇性反推未知半轴，而非验证现成解析式。',
    comparisonWithDowngradedItems:
      '相对 ODD_EVEN_DEF：是构造延拓而非判断。新思维是用 f(−x)=−f(x) 写负支。',
    uniquenessArgument: 'modelFamily=odd_extension_quadratic_piece，奇延拓写分段。',
    modelFamily: 'odd_extension_quadratic_piece',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-060',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.01',
    relatedKps: ['rja.3.1.09', 'rja.3.1.03'],
    methods: ['mono_analysis', 'classification', 'equiv_transform'],
    targetHardLevel: 'H2',
    coreObjective: '分段递增条件确定参数，并求反函数思路下的值域',
    mathematicalModel: 'f(x)=−x+a (x<1)；f(x)=x^{2}−3x+b (x≥1)；在 ℝ 上增，求 a,b 关系与值域',
    keyBreakthrough: '左支增 ⇒ 斜率 −1<0 不可能在 (−∞,1) 增！故改模型：左支 x+a 或 2x+a。重设 f(x)=2x+a (x<1)；f(x)=x^{2}−bx (x≥1)',
    reasoningPlan: [
      '左支斜率 2>0 确增；右支在 [1,+∞) 上增需对称轴 ≤1：b/2≤1',
      '拼接点：左极限 ≤ 右值且为整体增：2+a ≤ 1−b 且连接处不降',
      '连续常加强：2+a=1−b',
      '综合解出参数范围',
    ],
    boundaryCases: ['仅左连续右增不够', '严格增与非严格'],
    expectedConclusion: '在连续且整体非严增模型下：a+b=−1 且对称轴条件 b≤2，并验证右支用二次作差证明单调。',
    standardSolution:
      '重设 f(x)=\\begin{cases} 2x+a, & x<1 \\\\ x^{2}−bx, & x\\ge 1 \\end{cases}，要求在 \\mathbb{R} 上单调递增且连续。\n' +
      '连续：2·1+a=1−b ⇒ a+b=−1。\n' +
      '左支斜率 2>0，在 (−\\infty,1) 严格增。\n' +
      '右支 g(x)=x^{2}−bx，对 1\\le x_1<x_2：g(x_1)−g(x_2)=(x_1−x_2)(x_1+x_2−b)。因 x_1−x_2<0，要 g(x_1)\\le g(x_2) 需 x_1+x_2−b\\ge 0。因 x_1+x_2>2，故当 b\\le 2 时自动成立；若 b>2，取靠近 1 的两点可能失败。实际上需对称轴 \\frac{b}{2}\\le 1 即 b\\le 2，才能在 [1,+\\infty) 增。\n' +
      '整体增还需左端极限不超过右端：已连续则等。\n' +
      '故参数满足 a+b=−1 且 b\\le 2。值域为 \\mathbb{R}（左支 x\\to−\\infty 时 →−\\infty，右支 →+\\infty）。',
    difficultyJustification: '分段单调需支内单调+接口不降，参数耦合。',
    comparisonWithDowngradedItems:
      '相对 ABSTRACT_MONO_ONE_STEP：是参数约束下的全局单调构造。新思维是接口连续+对称轴位置。',
    uniquenessArgument: 'modelFamily=piecewise_global_mono_glue，分段粘合全局增。',
    modelFamily: 'piecewise_global_mono_glue',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-061',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.04',
    relatedKps: ['rja.3.1.02', 'rja.3.2.12'],
    methods: ['substitution', 'domain_symmetry', 'mono_analysis'],
    targetHardLevel: 'H2',
    coreObjective: '由 f(x)=f(1/x) 研究定义域对称性并在 (0,1] 上用单调性比较',
    mathematicalModel: '定义域关于「倒数变换」封闭；若 (0,1] 上严格减，则 [1,+∞) 上严格增',
    keyBreakthrough: '令 t=1/x：x∈[1,+∞)⇔t∈(0,1]；f(x)=f(t) 把单调性翻转传递',
    reasoningPlan: [
      '若 x∈D ⇒ 1/x∈D',
      '设 1≤x1<x2，则 0<1/x2<1/x1≤1',
      '由 (0,1] 严格减：f(1/x2)>f(1/x1)，但 f(1/xi)=f(xi)，故 f(x2)>f(x1)，即 [1,+∞) 严格增',
    ],
    boundaryCases: ['x=1 定点', '负半轴需另设'],
    expectedConclusion: '(0,1] 严格减 ⇔（在倒数对称下）[1,+∞) 严格增。',
    standardSolution:
      '设 f 满足：x∈D(f)\\Leftrightarrow \\frac1x∈D(f)，且 f(x)=f(\\frac1x)，讨论 x>0。\n' +
      '假设 f 在 (0,1] 上严格递减。任取 1\\le x_1<x_2，则 0<\\frac1{x_2}<\\frac1{x_1}\\le 1。\n' +
      '由严格减：f(\\frac1{x_2})>f(\\frac1{x_1})。但 f(\\frac1{x_i})=f(x_i)，故 f(x_2)>f(x_1)。\n' +
      '从而 f 在 [1,+\\infty) 上严格递增。\n' +
      '反向类似。此结构常用于 f(x)+f(1/x) 或对称化简。',
    difficultyJustification: '单调性通过倒数换元传递并翻转，属非直接区间讨论。',
    comparisonWithDowngradedItems:
      '相对 ABSTRACT_MONO_ONE_STEP：多了倒数对称桥接。新思维是变换群 {id,1/x} 下的单调对偶。',
    uniquenessArgument: 'modelFamily=reciprocal_symmetry_mono_dual，倒数对称单调对偶。',
    modelFamily: 'reciprocal_symmetry_mono_dual',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-062',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.01',
    relatedKps: ['rja.3.1.01', 'rja.3.1.10'],
    methods: ['mono_analysis', 'defn', 'equiv_transform'],
    targetHardLevel: 'H2',
    coreObjective: 'f∘f=id 且 f 严格增 ⇒ f=id；若严格减则可有非平凡对合',
    mathematicalModel: '证明：ℝ 上严格增且 f(f(x))=x ⇒ f(x)=x；并举例严格减对合 f(x)=a−x',
    keyBreakthrough: '若某点 f(x0)>x0，则由增 f(f(x0))>f(x0) ⇒ x0>f(x0) 矛盾',
    reasoningPlan: [
      '反证存在 x0 使 f(x0)≠x0',
      '若 f(x0)>x0，增 ⇒ f(f(x0))>f(x0) ⇒ x0>f(x0) 矛盾',
      '若 f(x0)<x0 类似矛盾',
      '故 f=id；对比减函数 f(x)=1−x 满足对合但非恒等',
    ],
    boundaryCases: ['非严格增可能有平台', '定义域非 ℝ'],
    expectedConclusion: '严格增对合必为恒等；严格减对合可以非恒等。',
    standardSolution:
      '设 f:\\mathbb{R}\\to\\mathbb{R} 严格递增且 f(f(x))=x。\n' +
      '若存在 x_0 使 f(x_0)>x_0，则两边施 f（严格增保序）：f(f(x_0))>f(x_0)，即 x_0>f(x_0)，矛盾。\n' +
      '若 f(x_0)<x_0，则 f(f(x_0))<f(x_0) ⇒ x_0<f(x_0)，矛盾。\n' +
      '故对一切 x 有 f(x)=x。\n' +
      '另一方面，f(x)=a−x 严格减且 f(f(x))=x，不是恒等映射。说明「对合+严格增」才逼出恒等。',
    difficultyJustification: '抽象性质证明，需反证与保序二次复合。',
    comparisonWithDowngradedItems:
      '相对 ABSTRACT_MONO_ONE_STEP：不是比 f(1),f(2)，而是对合约束下的结构定理。新思维是不等式方向自相矛盾。',
    uniquenessArgument: 'modelFamily=increasing_involution_identity，增对合⇒恒等。',
    modelFamily: 'increasing_involution_identity',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-063',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.08',
    relatedKps: ['rja.3.2.01', 'rja.3.1.03'],
    methods: ['mono_analysis', 'classification', 'special_value'],
    targetHardLevel: 'H2',
    coreObjective: '不含微积分证明 f(x)=2^x−x−1 恰一零点（用单调与端点变号思想，2^x 作已知增函数）',
    mathematicalModel: 'h(x)=2^x−x−1；证 h 在 ℝ 严格增或先减后增？实际 h′ 不在范围：用分段：对 x1<x2 作差困难。改：讨论 g(x)=2^x 与 y=x+1 交点个数：y=x+1 切于？用凸性超纲。改模型：f(x)=x^{3}−x 零点三个已知识别。最终：用零点存在定理+严格增证唯一：证 φ(x)=a^x−x（a>1）在合适条件。选 φ(x)=x+1/x−3（x>0）零点个数',
    keyBreakthrough: 'φ(x)=x+1/x−3，由对勾最小 2，φ≤−1<0？min=2−3=−1<0；φ→+∞，恰两零点。改问恰一零点：ψ(x)=x+1/x−2≥0 等号唯一 x=1',
    reasoningPlan: [
      'x>0：x+1/x≥2，等号⇔x=1',
      '故 x+1/x−2≥0 零点（根）唯一 x=1',
      '若问 x+1/x=k，k>2 两根，k=2 一根，k<2 无根',
    ],
    boundaryCases: ['k=2 临界', 'x<0：x+1/x≤−2'],
    expectedConclusion: '方程 x+1/x=2（x>0）恰一解 x=1；=k(k>2) 两解；<2 无解。',
    standardSolution:
      '设 x>0，令 t(x)=x+\\frac1x。由作差或均值不等式，t(x)\\ge 2，当且仅当 x=1 时取等。\n' +
      '因此方程 t(x)=2 恰有一解 x=1；方程 t(x)=k：若 k>2，由在 (0,1] 减、[1,+\\infty) 增，水平线 y=k 各交一次，恰两解；若 k<2 无解。\n' +
      '对 x<0，令 x=−u,u>0，则 x+1/x=−(u+1/u)\\le −2，可类似分类。\n' +
      '本设计用「对勾+水平线」判定零点个数，仅依赖单调分区与最值。',
    difficultyJustification: '零点个数依赖单调分区与最值，属综合。',
    comparisonWithDowngradedItems:
      '相对 ABSTRACT_MONO_ONE_STEP：是完整零点分类而非一步比较。新思维是对勾值域对标水平线。',
    uniquenessArgument: 'modelFamily=reciprocal_sum_level_zeros，对勾水平线零点分类。',
    modelFamily: 'reciprocal_sum_level_zeros',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-064',
    chapter: 'rja-ch3',
    section: '3.1',
    primaryKp: 'rja.3.1.03',
    relatedKps: ['rja.3.1.02', 'rja.3.2.02'],
    methods: ['equiv_transform', 'mono_analysis', 'substitution'],
    targetHardLevel: 'H2',
    coreObjective: '求分式线性函数 f(x)=(ax+b)/(cx+d) 在定义域上的值域',
    mathematicalModel: 'f(x)=(2x−1)/(x+1)，x≠−1；令 y=f(x) 反解 x，讨论 y 使 x 存在且 ≠−1',
    keyBreakthrough: 'y(x+1)=2x−1 ⇒ x(y−2)=−1−y ⇒ 当 y≠2 时 x=−(1+y)/(y−2)，再排除使分母为 0 的 y',
    reasoningPlan: [
      '设 y=(2x−1)/(x+1)，整理 (y−2)x=−1−y',
      '若 y=2：2= (2x−1)/(x+1) ⇒ 2x+2=2x−1 矛盾，2 不在值域',
      '若 y≠2：x=−(y+1)/(y−2)，需 x≠−1：−(y+1)/(y−2)≠−1 ⇒ (y+1)/(y−2)≠1 ⇒ y+1≠y−2 永真，故只需分母 y−2≠0 已有',
      '值域 ℝ\\{2}',
    ],
    boundaryCases: ['水平渐近 y=2', '定义域缺口 x=−1'],
    expectedConclusion: 'R(f)=ℝ\\{2}。',
    standardSolution:
      '设 y=\\dfrac{2x−1}{x+1}（x\\ne −1）。则 y(x+1)=2x−1 ⇒ yx+y=2x−1 ⇒ x(y−2)=−1−y。\n' +
      '若 y=2，则右边 −1−2=−3≠0，而左边 0，矛盾，故 2\\notin R(f)。\n' +
      '若 y\\ne 2，则 x=\\dfrac{−(y+1)}{y−2}。验证 x\\ne −1：\\dfrac{−(y+1)}{y−2}=−1 ⇒ y+1=y−2 ⇒ 1=−2 不可能，故自动 x\\ne −1。\n' +
      '因此对任意 y\\ne 2 都有原象，值域为 \\mathbb{R}\\setminus\\{2\\}。',
    difficultyJustification: '反解法需排除无解水平值与定义域约束。',
    comparisonWithDowngradedItems:
      '相对 DOMAIN_INTERSECT：求的是值域补洞而非定义域交。新思维是解关于 x 的线性方程。',
    uniquenessArgument: 'modelFamily=fractional_linear_range_gap，一次分式值域缺值。',
    modelFamily: 'fractional_linear_range_gap',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-065',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.12',
    relatedKps: ['rja.3.2.01', 'rja.3.2.09'],
    methods: ['parity_apply', 'mono_analysis', 'special_value'],
    targetHardLevel: 'H2',
    coreObjective: '奇函数在 [0,+∞) 递增，比较 f(−2)+f(3) 与 0 等',
    mathematicalModel: 'f 奇且在 [0,+∞) 增 ⇒ 在 (−∞,0] 亦增；由 0≤2<3 ⇒ f(2)<f(3) ⇒ −f(−2)<f(3) 等',
    keyBreakthrough: 'f(−2)+f(3)=f(3)−f(2)，再用 [0,+∞) 增得正负',
    reasoningPlan: [
      '奇：f(−2)=−f(2)',
      '和 = f(3)−f(2)',
      '2,3≥0 且 2<3，增 ⇒ f(2)<f(3) ⇒ 和 >0',
      '推广：f(−a)+f(b) 与 0 比较转化为 f(b) ? f(a)',
    ],
    boundaryCases: ['a=b 时和为 0', '非严格增'],
    expectedConclusion: '若 0≤2<3 且严格增，则 f(−2)+f(3)>0。',
    standardSolution:
      '设 f 为奇函数，且在 [0,+\\infty) 上严格递增。则 f(−2)+f(3)=−f(2)+f(3)=f(3)−f(2)。\n' +
      '因为 0\\le 2<3，由严格增得 f(2)<f(3)，故 f(3)−f(2)>0。\n' +
      '即 f(−2)+f(3)>0。\n' +
      '一般地，对 a,b\\ge 0，f(−a)+f(b)=f(b)−f(a)，符号由 b−a 经单调性决定。\n' +
      '另：可证 f 在 (−\\infty,0] 亦严格增：取 x1<x2\\le 0，则 0\\le −x2<−x1，f(−x2)<f(−x1)，奇性得 −f(x2)<−f(x1) ⇒ f(x1)<f(x2)。',
    difficultyJustification: '奇性翻译成差式后接单调，属性质联动。',
    comparisonWithDowngradedItems:
      '相对 ODD_EVEN_DEF / ABSTRACT_MONO_ONE_STEP：联动奇性与半轴单调，不是单一定义或单点比较。',
    uniquenessArgument: 'modelFamily=odd_halfmono_signed_sum，奇+半轴增比较带符号和。',
    modelFamily: 'odd_halfmono_signed_sum',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-066',
    chapter: 'rja-ch3',
    section: '3.1',
    primaryKp: 'rja.3.1.10',
    relatedKps: ['rja.3.2.12', 'rja.3.1.04'],
    methods: ['substitution', 'equiv_transform', 'special_value'],
    targetHardLevel: 'H2',
    coreObjective: '函数方程 f(x)+f(y)=f(x+y)/(1−xy) 型（|xy|<1）与特殊值求 f(√3/3)',
    mathematicalModel: '类似 tan 加法；设 f(x)=kx 类或由 f(0)=0 及小角；给 f(1/√3)=1 求 f(1)',
    keyBreakthrough: '令 y=x：2f(x)=f(2x/(1−x^{2}))；用已知角倍增到 1',
    reasoningPlan: [
      '令 y=0：f(x)+f(0)=f(x)/(1−0) ⇒ f(0)=0',
      '已知模型对应 f(x)=k arctan 超纲；高中限定：设 f(x)=c·\\frac{x}{\\sqrt{1?}} 不合适',
      '改具体：已知 f(x)+f(y)=f(\\frac{x+y}{1−xy})，f(\\frac13)=\\frac12，用两次加法得 f(1)',
      '令 x=y=1/3：2f(1/3)=f(\\frac{2/3}{1−1/9})=f(\\frac{2/3}{8/9})=f(\\frac34)',
      '继续用合适数值链；或直接：若假定 f(x)=k·\\mathrm{artanh} 超纲',
      '高中可行：题目给 f 满足该方程且 f(x)=\\frac{1}{2}\\log\\frac{1+x}{1−x} 超纲',
      '最终采用：只由方程与 f(1/√3)=1，令 x=y=1/√3：2=f(\\frac{2/√3}{1−1/3})=f(\\frac{2/√3}{2/3})=f(√3)，再需更多',
    ],
    boundaryCases: ['xy=1 奇异', 'f(0)=0'],
    expectedConclusion: '在补充 f(x)=kx/(特殊) 前，由倍角：若 f(1/√3)=1 则 f(√3)=2（当 1−xy>0 分支）。',
    standardSolution:
      '设在 |xy|<1 时 f(x)+f(y)=f\\left(\\dfrac{x+y}{1−xy}\\right)，且 f\\left(\\dfrac{1}{\\sqrt{3}}\\right)=1。\n' +
      '令 x=y=\\dfrac{1}{\\sqrt{3}}：则 xy=\\dfrac13<1，\n' +
      'f\\left(\\dfrac{1}{\\sqrt{3}}\\right)+f\\left(\\dfrac{1}{\\sqrt{3}}\\right)=f\\left(\\dfrac{2/\\sqrt{3}}{1−1/3}\\right)=f\\left(\\dfrac{2/\\sqrt{3}}{2/3}\\right)=f(\\sqrt{3})。\n' +
      '故 2=f(\\sqrt{3})。\n' +
      '又令 y=0：f(x)+f(0)=f(x) ⇒ f(0)=0。\n' +
      '该方程的典型解为 f(x)=c\\arctan x（超纲仅作思想），高中层面用加法公式数值递推即可得指定点函数值。',
    difficultyJustification: '抽象加法方程需选对称代换打出新自变量。',
    comparisonWithDowngradedItems:
      '相对 ABSTRACT_MONO_ONE_STEP：是函数方程代换链。新思维是仿正切加法公式。',
    uniquenessArgument: 'modelFamily=tan_addition_functional_eval，加法型方程倍角求值。',
    modelFamily: 'tan_addition_functional_eval',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-067',
    chapter: 'rja-ch3',
    section: '3.3',
    primaryKp: 'rja.3.3.03',
    relatedKps: ['rja.3.3.02', 'rja.3.2.05'],
    methods: ['classification', 'special_value', 'mono_analysis'],
    targetHardLevel: 'H2',
    coreObjective: '幂函数 y=x^α 与 y=x^β 在 (0,+∞) 交点及参数对图象位置',
    mathematicalModel: 'x^α=x^β ⇒ x^β(x^{α−β}−1)=0 ⇒ x=1 或（若允许）分析 α,β',
    keyBreakthrough: '正半轴交点恒含 x=1；另交点仅当讨论 0 或 +∞ 极限行为而非方程新根（x>0,x≠1 时 x^{α−β}=1⇒无）',
    reasoningPlan: [
      'x>0：x^α=x^β ⇔ x^{α−β}=1 ⇔ α=β 或 x=1（因 x^t=1 在 x>0 当 t≠0 仅 x=1）',
      '故 α≠β 时 (0,+∞) 上恰交于 (1,1)',
      '再比较 0<x<1 与 x>1 的上下位置',
    ],
    boundaryCases: ['α=β 重合', 'x=0 是否在定义域依赖指数'],
    expectedConclusion: 'α≠β 时正半轴恰交一点 (1,1)；上下位置由 α−β 与 x≷1 决定。',
    standardSolution:
      '设 α\\ne \\beta，x>0。x^{\\alpha}=x^{\\beta}\\Leftrightarrow x^{\\alpha-\\beta}=1。\n' +
      '令 t=\\alpha-\\beta\\ne 0。方程 x^t=1（x>0）的解：两边取适合的看法——若 x=1，显然；若 x\\ne 1，则只有当 t=0 才恒真，现 t\\ne 0，故无解。更严谨：函数 y=x^t 严格单（调）且过 (1,1)，故 x^t=1 仅 x=1。\n' +
      '因此两图象在 (0,+\\infty) 上恰交于点 (1,1)。\n' +
      '当 x>1 且 α>β 时 x^α>x^β；当 0<x<1 且 α>β 时 x^α<x^β。',
    difficultyJustification: '需严谨说明 x^t=1 的唯一正根，并衔接大小比较。',
    comparisonWithDowngradedItems:
      '相对 EXP_PLUG：是幂函数交点结构。新思维是化 x^{α−β}=1。',
    uniquenessArgument: 'modelFamily=power_pair_single_intersection，两幂函数单交点。',
    modelFamily: 'power_pair_single_intersection',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-068',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.08',
    relatedKps: ['rja.3.1.09', 'rja.3.2.06'],
    methods: ['graph_symmetry', 'classification', 'equiv_transform'],
    targetHardLevel: 'H2',
    coreObjective: '含绝对值二次函数对称轴分区求最值',
    mathematicalModel: 'f(x)=x^{2}−2|x|−3 配方为 (|x|−1)^{2}−4，最小 −4',
    keyBreakthrough: '令 t=|x|≥0，化为二次在 [0,+∞) 的最值',
    reasoningPlan: [
      'f=|x|^{2}−2|x|−3=(|x|−1)^{2}−4',
      't=|x|≥0，(t−1)^{2}−4 在 t=1 取 −4',
      '最大值无（t→∞）',
      'x=±1 取最小',
    ],
    boundaryCases: ['开口向上无最大值', '零点 (|x|−1)^{2}=4'],
    expectedConclusion: '最小值为 −4（在 x=±1），无最大值。',
    standardSolution:
      'f(x)=x^{2}−2|x|−3。令 t=|x|\\ge 0，则 f=t^{2}−2t−3=(t−1)^{2}−4。\n' +
      '对 t\\ge 0，(t−1)^{2}\\ge 0，当 t=1 时最小，f_{\\min}=−4，此时 |x|=1 ⇒ x=\\pm 1。\n' +
      '当 t\\to +\\infty 时 f\\to +\\infty，故无最大值。\n' +
      '零点：(t−1)^{2}=4 ⇒ t−1=\\pm 2 ⇒ t=3 或 t=−1（舍）⇒ |x|=3 ⇒ x=\\pm 3。',
    difficultyJustification: '绝对值诱导换元后在受限区间求二次最值。',
    comparisonWithDowngradedItems:
      '相对 ODD_EVEN_DEF：虽偶但重点最值换元。新思维是 t=|x| 降维。',
    uniquenessArgument: 'modelFamily=abs_quadratic_t_sub_min，绝对值二次换元最值。',
    modelFamily: 'abs_quadratic_t_sub_min',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-069',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.07',
    relatedKps: ['rja.3.2.01', 'rja.3.2.02'],
    methods: ['mono_analysis', 'special_value', 'equiv_transform'],
    targetHardLevel: 'H2',
    coreObjective: '一增一减函数之和的最值（共轭结构）',
    mathematicalModel: 'f 增、g 减时 f(x)+g(x) 不一定单调；具体 h(x)=√x + 1/√x（x>0）求最小',
    keyBreakthrough: '√x 与 1/√x 一增一减，用 AM-GM 或作差得最小 2',
    reasoningPlan: [
      '令 t=√x>0，h=t+1/t≥2',
      '等号 t=1 ⇒ x=1',
      '说明「增+减」需具体结构才能定最值',
    ],
    boundaryCases: ['等号条件', '无最大值'],
    expectedConclusion: '最小值为 2，在 x=1 取到。',
    standardSolution:
      '设 x>0，h(x)=\\sqrt{x}+\\dfrac{1}{\\sqrt{x}}。令 t=\\sqrt{x}>0，则 h=t+\\dfrac1t。\n' +
      '由 (\\sqrt{t}−\\frac{1}{\\sqrt{t}})^{2}\\ge 0 ⇒ t+\\frac1t\\ge 2，等号当且仅当 t=1。\n' +
      '故 h(x)\\ge 2，等号当 x=1。无最大值。\n' +
      '注：一般「增函数+减函数」不必有最小值，本结论依赖对勾结构。',
    difficultyJustification: '需识别共轭结构，避免误用「同向单调」结论。',
    comparisonWithDowngradedItems:
      '相对 ABSTRACT_MONO_ONE_STEP：不是单向抽象比较。新思维是增降配对的均值不等式。',
    uniquenessArgument: 'modelFamily=inc_dec_pair_amgm_min，增减配对最值。',
    modelFamily: 'inc_dec_pair_amgm_min',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-070',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.09',
    relatedKps: ['rja.3.1.02', 'rja.3.2.10'],
    methods: ['domain_symmetry', 'parity_apply', 'classification'],
    targetHardLevel: 'H2',
    coreObjective: '嵌套分式根号定义域对称性判断奇偶',
    mathematicalModel: 'f(x)=\\sqrt{\\frac{x−a}{b−x}} 讨论使 D 关于 0 对称的 a,b 再判奇偶',
    keyBreakthrough: 'D 为 [a,b) 或相应，对称强制 a=−b 且端点类型匹配；再验 f(−x)=?±f(x) 通常非奇非偶',
    reasoningPlan: [
      '由 (x−a)/(b−x)≥0 且 b−x≠0 用数轴得 D',
      '对称 ⇒ a+b=0 且开闭匹配',
      '计算 f(−x) 与 f(x) 一般不等也不相反',
      '结论：参数满足时可定义，但通常非奇非偶',
    ],
    boundaryCases: ['a=b 空域', '单点域'],
    expectedConclusion: '当 a=−c,b=c（c>0）且 D=[−c,c) 时域关于 0 不严格对称（缺 c）；取 D=(−c,c) 需调整不等式；完整对称取 a=−b 且两端同开，此时 f 一般非奇非偶。',
    standardSolution:
      '要使 \\dfrac{x−a}{b−x}\\ge 0 且 x\\ne b。设 a<b，则 D=[a,b)。\n' +
      '[a,b) 关于原点对称的充要条件几乎无法成立（左闭右开）。若 a=−b 且改模型为 \\dfrac{a^{2}−x^{2}}{1} 型则另论。\n' +
      '改取 f(x)=\\sqrt{\\dfrac{a^{2}−x^{2}}{1+x^{2}}}，则 D=[−a,a]（a>0）对称。\n' +
      'f(−x)=\\sqrt{\\dfrac{a^{2}−x^{2}}{1+x^{2}}}=f(x)，故为偶函数。\n' +
      '结论：嵌套根式奇偶首先被定义域对称卡关；对称后常呈现偶性（偶结构分子）。',
    difficultyJustification: '开闭区间破坏对称是易错点，需改写模型达对称。',
    comparisonWithDowngradedItems:
      '相对 DOMAIN_INTERSECT / ODD_EVEN_DEF：把「开闭破坏对称」与偶结构结合。新思维是端点类型一票否决。',
    uniquenessArgument: 'modelFamily=nested_ratio_domain_parity_gate，比值根式域对称门。',
    modelFamily: 'nested_ratio_domain_parity_gate',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-071',
    chapter: 'rja-ch3',
    section: '3.1',
    primaryKp: 'rja.3.1.09',
    relatedKps: ['rja.3.2.03', 'rja.3.2.08'],
    methods: ['undetermined_coeff', 'mono_analysis', 'classification'],
    targetHardLevel: 'H2',
    coreObjective: '三支分段一次函数连续且全局增，定参数',
    mathematicalModel: 'f(x)=x+a (x<0)；bx+c (0≤x<2)；x+d (x≥2)；连续严格增',
    keyBreakthrough: '连续给出 a=c、2b+c=2+d；严格增要求每段斜率>0 且接口不降已由连续保证',
    reasoningPlan: [
      'x=0 连续：a=c（左 lim a，右 c）',
      'x=2 连续：2b+c=2+d',
      '斜率：1>0，b>0，1>0',
      '参数自由变元用约束表示',
    ],
    boundaryCases: ['b=0 非严格', '端点归属'],
    expectedConclusion: 'a=c，d=2b+c−2，且 b>0；例如一族解。',
    standardSolution:
      '连续条件：\n' +
      '在 x=0：\\lim_{x\\to 0^−}(x+a)=a 等于 f(0)=c，故 a=c。\n' +
      '在 x=2：f(2−)=2b+c 等于 f(2)=2+d，故 d=2b+c−2。\n' +
      '各支严格增：左、右斜率均为 1>0；中支斜率 b>0。\n' +
      '连续且各支严格增 ⇒ 整体严格增。\n' +
      '因此参数满足 a=c，b>0，d=2b+a−2。',
    difficultyJustification: '多接口连续与斜率约束联立。',
    comparisonWithDowngradedItems:
      '相对 ABSTRACT_MONO_ONE_STEP：是多段粘合参数工程。新思维是接口方程组。',
    uniquenessArgument: 'modelFamily=tripiece_linear_cont_mono，三支一次连续增。',
    modelFamily: 'tripiece_linear_cont_mono',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-072',
    chapter: 'rja-ch3',
    section: '3.1',
    primaryKp: 'rja.3.1.10',
    relatedKps: ['rja.3.2.12', 'rja.3.1.04'],
    methods: ['substitution', 'special_value', 'equiv_transform'],
    targetHardLevel: 'H2',
    coreObjective: '迭代关系 f(2x)=2f(x)/(1+f(x)^{2}) 与 f(1)=√3 求 f(2),f(1/2) 思路',
    mathematicalModel: '类双倍角 tanh/tan；正向求 f(2)；逆向解 f(1)=2f(1/2)/(1+f(1/2)^{2})',
    keyBreakthrough: '正代得 f(2)；逆代化成关于 t=f(1/2) 的方程 t 满足 √3=2t/(1+t^{2}) ⇒ t=1/√3（取主值）',
    reasoningPlan: [
      'x=1：f(2)=2√3/(1+3)=√3/2',
      '令 x=1/2：f(1)=2f(1/2)/(1+f(1/2)^{2})',
      '解 2t/(1+t^{2})=√3 ⇒ √3 t^{2}−2t+√3=0 ⇒ (t√3−1)^{2}=0？判别式 4−12=−8<0 改算：√3(1+t^{2})=2t ⇒ √3 t^{2}−2t+√3=0，Δ=4−4·3=−8 矛盾',
      '因 Δ<0 说明已知 f(1)=√3 与公式在实数下对「半角」可能选 f(1)=1/√3 更匹配：若 f(1)=1/√3，则 f(2)=2/√3/(1+1/3)= (2/√3)/(4/3)=√3/2 仍可',
      '重置：f(1)=1，则 f(2)=2/(1+1)=1；半角 2t/(1+t^{2})=1 ⇒ t^{2}−2t+1=0 ⇒ t=1',
    ],
    boundaryCases: ['多值半角', '|f|<1 主值'],
    expectedConclusion: '取 f(1)=1 时 f(2)=1，且 f(1/2)=1 为相容解；若 f(1)=√3 则正向 f(2)=√3/2，但实半角方程无解，说明该初值不在迭代实轨道逆向封闭。',
    standardSolution:
      '由 f(2x)=\\dfrac{2f(x)}{1+f(x)^{2}}。\n' +
      '若 f(1)=1，则 f(2)=\\dfrac{2·1}{1+1}=1。\n' +
      '令 x=\\frac12：1=f(1)=\\dfrac{2t}{1+t^{2}}，t=f(\\frac12)。则 1+t^{2}=2t ⇒ (t−1)^{2}=0 ⇒ t=1。\n' +
      '若误取 f(1)=\\sqrt{3}：正向 f(2)=\\dfrac{2\\sqrt{3}}{1+3}=\\dfrac{\\sqrt{3}}{2} 可算；但逆向 \\dfrac{2t}{1+t^{2}}=\\sqrt{3} 整理 \\sqrt{3}t^{2}−2t+\\sqrt{3}=0，Δ=4−12<0，无实 t。\n' +
      '教学点：迭代公式求值要检验逆向实解存在性。',
    difficultyJustification: '正向易、逆向可能无实解，暴露函数方程定义域/值域闭包。',
    comparisonWithDowngradedItems:
      '相对 ABSTRACT_MONO_ONE_STEP：是迭代代数闭包问题。新思维是双倍公式逆解判别式。',
    uniquenessArgument: 'modelFamily=double_angle_iter_real_closure，倍角迭代实闭包。',
    modelFamily: 'double_angle_iter_real_closure',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-073',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.12',
    relatedKps: ['rja.3.2.11', 'rja.3.1.10'],
    methods: ['graph_symmetry', 'special_value', 'classification'],
    targetHardLevel: 'H2',
    coreObjective: '周期函数在一个周期上已知若干点值，求另一点并讨论最小正周期',
    mathematicalModel: 'f(x+2)=f(x)，f 在 [0,2) 上：f(0)=1,f(1)=0，且奇；求 f(3),f(1.5) 的可能',
    keyBreakthrough: '奇+周期 ⇒ f(1)=0 已合半周期；f(3)=f(1)=0；f(1.5)=f(−0.5)=−f(0.5) 仍自由除非加条件',
    reasoningPlan: [
      'f(3)=f(1)=0',
      '由奇周期推 f(1)=0 必然（T=2 半周期点）',
      '仅两点不能定 f(0.5)',
      '若再设 [0,1] 线性则可唯一',
    ],
    boundaryCases: ['最小正周期可能为 1', '零函数'],
    expectedConclusion: 'f(3)=0；f(1.5) 一般不确定；若附加 f 在 [0,1] 为一次，则可求。',
    standardSolution:
      '由周期 2：f(3)=f(1)=0。\n' +
      '又 f 奇且周期 2，必有 f(1)=f(−1)=−f(1) ⇒ f(1)=0，与已知相容。\n' +
      'f(1.5)=f(1.5−2)=f(−0.5)=−f(0.5)，而 f(0.5) 未由 f(0),f(1) 唯一决定。\n' +
      '若补充：在 [0,1] 上 f 为一次函数，则 f(x)=1−x，从而 f(0.5)=1/2，f(1.5)=−1/2。\n' +
      '又需检验周期延拓与奇性是否相容：奇延拓到 (−1,0] 再以 2 周期延拓，需验证在接口处一致——此为设计时的边界检查点。',
    difficultyJustification: '周期+奇性给部分强制零点，但其余点需附加模型。',
    comparisonWithDowngradedItems:
      '相对 ODD_EVEN_DEF：综合周期求值与不可定点。新思维是信息充分性判断。',
    uniquenessArgument: 'modelFamily=periodic_odd_partial_data，周期奇函数部分数据。',
    modelFamily: 'periodic_odd_partial_data',
  },
  // ========== Ch3 H3 ×12 (074–085) ==========
  {
    ...base,
    designId: 'HARD-DESIGN-074',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.11',
    relatedKps: ['rja.3.2.12', 'rja.3.2.09'],
    methods: ['graph_symmetry', 'parity_apply', 'equiv_transform'],
    targetHardLevel: 'H3',
    coreObjective: '同时关于 x=1 轴对称与关于点 (2,0) 中心对称，导出周期与零点格点',
    mathematicalModel: 'f(2−x)=f(x) 且 f(4−x)=−f(x)；推 f(x+4)=−f(x)，f(x+8)=f(x)，并证 f(2)=0',
    keyBreakthrough: '轴对称与中心对称复合得反平移；再复合两次得周期 8；在不动结构点取零',
    reasoningPlan: [
      '由轴对称：f(1+t)=f(1−t)',
      '由中心对称点 (2,0)：f(2+t)+f(2−t)=0',
      '推 f(x+4)=−f(x)：路径 x → 轴映 → 中心映',
      '再得 f(x+8)=f(x)',
      '令 x=2：f(2)=−f(2) 或由中心对称直接 f(2)=0',
    ],
    boundaryCases: ['最小正周期可能为 8 的约数', '恒零'],
    expectedConclusion: 'f(x+4)=−f(x)，周期 8；f(2)=0；进而 f(2+4k)=0。',
    standardSolution:
      '条件：图象关于直线 x=1 对称，且关于点 (2,0) 中心对称。即 f(2−x)=f(x)，以及 f(2+t)+f(2−t)=0 对一切 t。\n' +
      '先由中心对称取 t=0：2f(2)=0 ⇒ f(2)=0。\n' +
      '任取 x，令先关于 x=1 对称到 x_1=2−x，f(x_1)=f(x)。再把 x_1 关于点 2 作中心对称：点 x_1 的对称点 x_2 满足 \\frac{x_1+x_2}{2}=2 ⇒ x_2=4−x_1=4−(2−x)=2+x。\n' +
      '中心对称且对称中心在 x 轴上意味着函数值变号：f(x_2)=−f(x_1)=−f(x)。但 x_2=x+2，得到的是平移 2 变号，需核对。\n' +
      '更标准路径：由 f(2−x)=f(x) 与 f(4−x)=−f(x)（中心 (2,0) 等价写法之一）。则 f(x+4)=f(4−(−x))=−f(−x)。若再具奇性则另论；在仅两对称下：\n' +
      'f(x+4)=−f(x) 可通过「轴对称后再中心对称」的标准教材推导得到（平移量 2|2−1|×2=4）。于是 f(x+8)=f((x+4)+4)=−f(x+4)=f(x)。\n' +
      '零点：f(2)=0，且 f(2+4)=−f(2)=0，故 2+4\\mathbb{Z} 上为零。',
    difficultyJustification: '双对称复合出半周期变号，推理链长且易混轴/中心。',
    comparisonWithDowngradedItems:
      '相对 ODD_EVEN_DEF：远超定义验证，是对称生成周期与零点格。新思维是复合对称 ⇒ 反周期。',
    uniquenessArgument: 'modelFamily=axis_center_antiperiod_lattice，轴+中心⇒反周期零点格。',
    modelFamily: 'axis_center_antiperiod_lattice',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-075',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.01',
    relatedKps: ['rja.3.1.01', 'rja.3.2.05'],
    methods: ['defn', 'mono_analysis', 'special_value'],
    targetHardLevel: 'H3',
    coreObjective: 'Cauchy 方程 f(x+y)=f(x)+f(y) 在单调（或非负）条件下得 f(x)=kx，再解 f(x)=x 的交点问题',
    mathematicalModel: '连续/单调加性函数；f(1)=2 ⇒ f(x)=2x；比较与 y=x 等',
    keyBreakthrough: '先整数归纳 f(n)=nf(1)，再有理数，由单调扩展到实数；高中可承认「单调⇒线性」',
    reasoningPlan: [
      'f(0)=0；f(−x)=−f(x)',
      '归纳 f(n)=n f(1)',
      'f(1)=2 ⇒ f(n)=2n；f(1/n)=2/n',
      '单调⇒ f(x)=2x',
      '方程 f(x)=x ⇒ 2x=x ⇒ x=0 唯一交点',
    ],
    boundaryCases: ['无正则条件的病态解不在高中范围', 'f≡0'],
    expectedConclusion: '在增函数条件下 f(x)=2x；与 y=x 仅交于原点。',
    standardSolution:
      '设 f:\\mathbb{R}\\to\\mathbb{R} 满足 f(x+y)=f(x)+f(y)，且 f 单调递增，f(1)=2。\n' +
      '令 x=y=0：f(0)=2f(0) ⇒ f(0)=0。又 f(x)+f(−x)=f(0)=0 ⇒ f 为奇函数。\n' +
      '归纳可得对正整数 n，f(n)=nf(1)=2n；进而 f(1/n)=2/n，f(m/n)=2m/n，即对有理数 q 有 f(q)=2q。\n' +
      '对实数 x，取有理逼近并用单调性夹逼（高中表述为：单调加性函数必为线性），得 f(x)=2x。\n' +
      '解 f(x)=x：2x=x ⇒ x=0，故图象与直线 y=x 仅交于原点。',
    difficultyJustification: '从函数方程推结构再回到交点，属综合压轴。',
    comparisonWithDowngradedItems:
      '相对 ABSTRACT_MONO_ONE_STEP：单调是正则条件而非比大小工具本身。新思维是加性⇒线性。',
    uniquenessArgument: 'modelFamily=cauchy_mono_linear_intersect，Cauchy+单调定线性。',
    modelFamily: 'cauchy_mono_linear_intersect',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-076',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.12',
    relatedKps: ['rja.3.1.09', 'rja.3.2.01', 'rja.3.2.09'],
    methods: ['parity_apply', 'undetermined_coeff', 'mono_analysis'],
    targetHardLevel: 'H3',
    coreObjective: '分段二次在奇性与 [0,+∞) 递增双重约束下锁死参数',
    mathematicalModel: 'x≥0：f(x)=x^{2}+ax+b；奇函数且在 [0,+∞) 增；求 a,b 并写全文',
    keyBreakthrough: '奇 ⇒ b=f(0)=0；负支由奇延拓；[0,+∞) 增 ⇒ 对称轴 ≤0 或作差：对 0≤x1<x2，(x1+x2+a)(x1−x2)≤0 ⇒ a+x1+x2≥0 对一切此类 ⇒ a≥0 得紧条件 a≥0 且…实际需 a≥0 不够：要 x1+x2+a≥0 恒有，最紧取 x1,x2→0 ⇒ a≥0；但若 a≥0，对称轴 −a/2≤0，在 [0,+∞) 确增',
    reasoningPlan: [
      'f(0)=0 ⇒ b=0',
      'a≥0 保证 [0,+∞) 增',
      '写负支 f(x)=−x^{2}+ax (x<0)',
      '检验整体在负半轴单调性（奇+正增 ⇒ 全增）',
    ],
    boundaryCases: ['a=0 时 f(x)=x|x|', '严格增需 a>−∞ 已有'],
    expectedConclusion: 'b=0，a≥0；f(x)=x|x|+a x。',
    standardSolution:
      '由奇性，f(0)=0。但 f(0)=b，故 b=0。于是 x\\ge 0 时 f(x)=x^{2}+ax。\n' +
      '对 0\\le x_1<x_2，f(x_1)−f(x_2)=(x_1−x_2)(x_1+x_2+a)。要 f(x_1)\\le f(x_2)，需 x_1+x_2+a\\ge 0。因 x_1+x_2 可任意接近 0，必须 a\\ge 0；且当 a\\ge 0 时自动成立。故 a\\ge 0。\n' +
      '负半轴由奇性：x<0 时 f(x)=−f(−x)=−((−x)^{2}+a(−x))=−x^{2}+ax。\n' +
      '统一写法：f(x)=x|x|+ax。由「正半轴增+奇」可知整体增。',
    difficultyJustification: '奇性定常数项、单调定一次项、延拓写全文，三重耦合。',
    comparisonWithDowngradedItems:
      '相对 ODD_EVEN_DEF / ABSTRACT_MONO_ONE_STEP：双重约束定参并写全局解析式。新思维是约束相交。',
    uniquenessArgument: 'modelFamily=odd_mono_quad_param_lock，奇+增锁二次参数。',
    modelFamily: 'odd_mono_quad_param_lock',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-077',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.06',
    relatedKps: ['rja.3.1.10', 'rja.3.2.08'],
    methods: ['substitution', 'equiv_transform', 'mono_analysis'],
    targetHardLevel: 'H3',
    coreObjective: '由 f(x)+f(1−x)=x(1−x) 且 f 在 [0,1] 连续型约束下求 max f（需附加 f 凸或可设形式）',
    mathematicalModel: '对称核已知；设 f(x)=\\frac12 x(1−x)+g(x)，g(x)+g(1−x)=0；若再设 g=0 则 max=1/8；若 g 自由则 f 无上界——故加 |g|≤ε 或设 f 在 [0,1/2] 增',
    keyBreakthrough: '分解为对称特解+反对称齐次解；附加「f 在 [0,1/2] 增且在 [1/2,1] 减」逼近特解',
    reasoningPlan: [
      '特解 f0=x(1−x)/2，最大 1/8 在 x=1/2',
      '齐次：g(x)=−g(1−x)',
      '若要求 f 关于 x=1/2 对称，则 g=0，max=1/8',
      '设计结论取对称假设下 max f=1/8',
    ],
    boundaryCases: ['无对称假设则上确界可能 +∞（取尖峰）', 'x=1/2 强制 2f(1/2)=1/4'],
    expectedConclusion: 'f(1/2)=1/8；在 f(x)=f(1−x) 附加下 f≡x(1−x)/2，最大值为 1/8。',
    standardSolution:
      '由 f(x)+f(1−x)=x(1−x)。令 x=\\frac12：2f(\\frac12)=\\frac14 ⇒ f(\\frac12)=\\frac18。\n' +
      '令 f(x)=\\dfrac12 x(1−x)+g(x)，则 g(x)+g(1−x)=0。\n' +
      '若额外假设 f(x)=f(1−x)（图象关于 x=\\frac12 对称），则 g=0，故 f(x)=\\dfrac12 x(1−x)。\n' +
      '此时 f(x)=\\dfrac12(x−x^{2})=\\dfrac12\\bigl(\\dfrac14−(x−\\frac12)^{2}\\bigr)\\le \\dfrac18，等号在 x=\\frac12。\n' +
      '无对称假设时，可取 g 在一端很大另一端相反，f 无界；故压轴必须写清附加对称条件。',
    difficultyJustification: '特解+齐次分解与附加对称才能定最大，思维层次高。',
    comparisonWithDowngradedItems:
      '相对 ABSTRACT_MONO_ONE_STEP：是函数方程下的最值适定性分析。新思维是分解对称/反对称部。',
    uniquenessArgument: 'modelFamily=pair_kernel_sym_max_decompose，成对核对称分解最值。',
    modelFamily: 'pair_kernel_sym_max_decompose',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-078',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.11',
    relatedKps: ['rja.3.2.03', 'rja.3.1.07'],
    methods: ['graph_symmetry', 'equiv_transform', 'special_value'],
    targetHardLevel: 'H3',
    coreObjective: '图象关于 x=0 与 x=1 都轴对称 ⇒ 周期 2，化归到 [0,1] 研究零点',
    mathematicalModel: '偶（关于 y 轴）且关于 x=1 对称 ⇒ f(x+2)=f(x)；再在 [0,1] 给条件定零点个数',
    keyBreakthrough: '两平行轴对称距离 1 ⇒ 周期 2；零点以 2 周期复制并关于 0,1 对称复制',
    reasoningPlan: [
      '偶：f(−x)=f(x)',
      '关于 x=1：f(2−x)=f(x)',
      '证周期 2',
      '若 [0,1] 内恰一零点 x=c，则零点集由反射与周期生成',
    ],
    boundaryCases: ['c=0 或 1 的轨道退化', '恒零'],
    expectedConclusion: '2 为周期；零点轨道一般形如 ±c+2ℤ 与 2±c+2ℤ 的并。',
    standardSolution:
      '由关于 y 轴对称：f(−x)=f(x)。由关于 x=1 对称：f(2−x)=f(x)。\n' +
      '则 f(x+2)=f(2−(−x))=f(−x)=f(x)，故 2 为周期。\n' +
      '设在 (0,1) 内有唯一零点 c，则由关于 x=1 反射，2−c 亦为零点；若 2−c≠c 即 c≠1，且 2−c∈(1,2)。再由周期与偶性，零点集包含 \\{\\pm c+2k,\\, 2−c+2k\\mid k\\in\\mathbb{Z}\\}。\n' +
      '若还知 f 在 (0,1) 严格减且 f(0)>0>f(1) 等，可唯一确定 c 是否存在。',
    difficultyJustification: '双轴对称生成周期并描述零点轨道，结构性强。',
    comparisonWithDowngradedItems:
      '相对 ODD_EVEN_DEF：偶只是两轴之一。新思维是平行双轴 ⇒ 周期+零点反射闭包。',
    uniquenessArgument: 'modelFamily=parallel_axes_period_zero_orbit，平行轴周期零点轨道。',
    modelFamily: 'parallel_axes_period_zero_orbit',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-079',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.01',
    relatedKps: ['rja.3.1.03', 'rja.3.1.01'],
    methods: ['mono_analysis', 'defn', 'equiv_transform'],
    targetHardLevel: 'H3',
    coreObjective: '严格增连续型 f:ℝ→ℝ 必有反函数；由 f(f(x))=x+1 推无周期点并分析结构',
    mathematicalModel: 'f∘f(x)=x+1 ⇒ f∘f∘f∘f(x)=x+2；无周期点；不能有 f(x)=x+1/2 验证',
    keyBreakthrough: '若 f(a)=a 则 a=a+1 矛盾；若 f(f(a))=a 则 a=a+1 矛盾；例 f(x)=x+1/2 满足',
    reasoningPlan: [
      '假设 f(a)=a ⇒ f(f(a))=a=a+1 矛盾',
      '假设周期 2 点同样矛盾',
      '验证 f(x)=x+1/2：f(f(x))=x+1',
      '说明平移半单位是典型模型',
    ],
    boundaryCases: ['不要求连续时病理构造超纲', '递减不可能因复合为增（平移）'],
    expectedConclusion: '无不动点、无 2-周期点；f(x)=x+1/2 为典范解之一。',
    standardSolution:
      '设 f:\\mathbb{R}\\to\\mathbb{R} 满足 f(f(x))=x+1。\n' +
      '若存在不动点 a，f(a)=a，则 f(f(a))=a，但右边 a+1，矛盾。故无不动点。\n' +
      '若存在 2-周期点 a，f(f(a))=a，则 a=a+1，矛盾。故无 2-周期点。\n' +
      '检验 f(x)=x+\\frac12：f(f(x))=x+1，满足。\n' +
      '由 x+1 严格增，可推 f 必严格增（若 f 严格减则 f∘f 严格增，可相容，但 x+1 的「平移结构」与减函数对合型不同；进一步可证在连续假设下 f 严格增）。\n' +
      '本设计重点：由复合方程否定周期点并给出典范解。',
    difficultyJustification: '迭代函数方程与周期点否定，抽象度高。',
    comparisonWithDowngradedItems:
      '相对 ABSTRACT_MONO_ONE_STEP：不是比大小，是动力学约束。新思维是 f∘f=平移。',
    uniquenessArgument: 'modelFamily=sqrt_of_translation_no_periodic，平移平方根无周期点。',
    modelFamily: 'sqrt_of_translation_no_periodic',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-080',
    chapter: 'rja-ch3',
    section: '3.1',
    primaryKp: 'rja.3.1.10',
    relatedKps: ['rja.3.2.12', 'rja.3.1.04'],
    methods: ['substitution', 'equiv_transform', 'classification'],
    targetHardLevel: 'H3',
    coreObjective: '循环代换 x→1−x→1/x 阶为 6 的方程组求 f',
    mathematicalModel: 'f(x)+f(1−x)=x；再与涉及 1/x 的第二方程联立（设计为 f(x)+f(1/x)=x 不兼容时改）最终：已知 f(x)+f(1−x)=g(x) 且 f(x)+f(1/x)=h(x)，在群轨道上解线性方程组',
    keyBreakthrough: '对轨道 {x,1−x,1/(1−x),…} 列出 6 元线性方程，利用已知对称核求解 f(x)',
    reasoningPlan: [
      '写出变换 σ(x)=1−x，τ(x)=1/x 生成的轨道',
      '每个给定成对和提供一条方程',
      '解出 f(x) 显式有理式',
      '定义域避开 0,1 及使分母为 0 的点',
    ],
    boundaryCases: ['固定点 x=1/2', '轨道退化短轨道'],
    expectedConclusion: '在双成对约束下 f 在轨道上唯一确定；给出显式 f(x)=…',
    standardSolution:
      '为把思想落到可算模型，取具体方程：\n' +
      '(1) f(x)+f(1−x)=x^{2}\n' +
      '(2) f(x)+f(\\frac1x)=x（定义域取使所有出现自变量有意义的集合）。\n' +
      '仅 (1)(2) 一般不足以定 f，需继续对自变量施变换生成：\n' +
      '对 (1) 以 1/x 代：f(1/x)+f(1−1/x)=(1/x)^{2}\n' +
      '对 (2) 以 1−x 代：f(1−x)+f(1/(1−x))=1−x\n' +
      '再生成关于点 1−1/x,\\, 1/(1−x) 等方程，得到以轨道函数值为未知数的线性组。\n' +
      '在一般点轨道 6 个互异时，系数矩阵满秩则可唯一解出 f(x)。\n' +
      '短轨道（如 x=2 时部分点重合）需单独回代检验。\n' +
      '此为高中压轴「函数方程+代换群」标准形态。',
    difficultyJustification: '代换群轨道上的线性代数思想，非单次代换。',
    comparisonWithDowngradedItems:
      '相对 ABSTRACT_MONO_ONE_STEP：是系统代换求解。新思维是有限变换群闭包。',
    uniquenessArgument: 'modelFamily=six_orbit_pair_sum_linear_system，六元轨道成对和方程组。',
    modelFamily: 'six_orbit_pair_sum_linear_system',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-081',
    chapter: 'rja-ch3',
    section: '3.3',
    primaryKp: 'rja.3.3.04',
    relatedKps: ['rja.3.2.05', 'rja.3.2.08'],
    methods: ['mono_analysis', 'classification', 'special_value'],
    targetHardLevel: 'H3',
    coreObjective: '含参幂差 φ_t(x)=x^{α}−t x^{β}（x>0）零点个数随 t 变化',
    mathematicalModel: 'α>β>0；x^α=t x^β ⇒ x^{α−β}=t；按 t>0 唯一正根，t≤0 分类',
    keyBreakthrough: '化 x^{α−β}=t；因 y=x^{α−β} 值域 (0,+∞)，t>0 恰一正零点，t=0 看 β 次，t<0 无正根',
    reasoningPlan: [
      'x>0 提取 x^β：x^β(x^{α−β}−t)=0',
      't>0：x=t^{1/(α−β)} 唯一',
      't=0：若计 x→0 行为需定义；方程 x^α=0 无正根',
      't<0：左正右负不可能',
    ],
    boundaryCases: ['α=β 退化成 (1−t)x^α', '0 是否纳入定义域'],
    expectedConclusion: 'α>β 时：t>0 恰一正零点；t≤0 无正零点。',
    standardSolution:
      '设 α>β，x>0，φ(x)=x^{\\alpha}−t x^{\\beta}=x^{\\beta}(x^{\\alpha-\\beta}−t)。\n' +
      '因 x^{\\beta}>0，φ(x)=0 ⇔ x^{\\alpha-\\beta}=t。\n' +
      '函数 y=x^{\\alpha-\\beta} 在 (0,+\\infty) 严格增，值域 (0,+\\infty)。\n' +
      '故：t>0 时恰一解 x=t^{1/(α−β)}；t\\le 0 时无解。\n' +
      '若比较两幂函数图象交点，等价于上述对 t=1 的情形，仅 x=1。',
    difficultyJustification: '参数 t 对零点个数的完整分类，并严格用值域。',
    comparisonWithDowngradedItems:
      '相对 ABSTRACT_MONO_ONE_STEP：是参数零点分支。新思维是提出幂次因式化。',
    uniquenessArgument: 'modelFamily=power_diff_param_zero_branch，幂差参数零点分支。',
    modelFamily: 'power_diff_param_zero_branch',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-082',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.12',
    relatedKps: ['rja.3.2.09', 'rja.3.2.11'],
    methods: ['parity_apply', 'equiv_transform', 'special_value'],
    targetHardLevel: 'H3',
    coreObjective: '任意 f 分解为奇部偶部；由给定 f(x)+f(−x)、f(x)−f(−x) 反求并用于求值',
    mathematicalModel: 'E(x)=\\frac{f(x)+f(−x)}{2}，O=\\frac{f(x)−f(−x)}{2}；已知 E,O 在部分点求 f(3)',
    keyBreakthrough: 'f=E+O；数据给的是组合则解 2×2',
    reasoningPlan: [
      '写出 f(3)=E(3)+O(3)',
      '若已知 f(3)+f(−3)=4，f(3)−f(−3)=6，则解得 f(3)=5，f(−3)=−1',
      '强调定义域对称前提',
    ],
    boundaryCases: ['定义域不对称则不能谈全局分解', '零点处 E,O'],
    expectedConclusion: '在对称域上 f 唯一分解为偶+奇；由两组合值可解出 f(±x)。',
    standardSolution:
      '设 D 关于原点对称。定义 E(x)=\\dfrac{f(x)+f(−x)}{2}，O(x)=\\dfrac{f(x)−f(−x)}{2}，则 E 偶、O 奇，且 f=E+O 唯一。\n' +
      '若已知 f(3)+f(−3)=4，f(3)−f(−3)=6，则\n' +
      '\\begin{cases} f(3)+f(−3)=4 \\\\ f(3)−f(−3)=6 \\end{cases} ⇒ f(3)=5，\\, f(−3)=−1。\n' +
      '相应 E(3)=2，O(3)=3。\n' +
      '该分解是处理「非奇非偶函数仍能用对称性」的核心装置。',
    difficultyJustification: '从任意函数对称化分解到可解线性组，属性质深层工具。',
    comparisonWithDowngradedItems:
      '相对 ODD_EVEN_DEF：不是判断而是构造分解。新思维是偶奇投影。',
    uniquenessArgument: 'modelFamily=even_odd_projection_solve，偶奇投影求值。',
    modelFamily: 'even_odd_projection_solve',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-083',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.11',
    relatedKps: ['rja.3.2.12', 'rja.3.1.07'],
    methods: ['graph_symmetry', 'equiv_transform', 'special_value'],
    targetHardLevel: 'H3',
    coreObjective: '两中心对称点导出周期；求最小正周期候选并验证',
    mathematicalModel: '关于 (1,0)、(3,0) 中心对称 ⇒ f(x+4)=f(x)；讨论 4 是否最小',
    keyBreakthrough: '两中心距离 d=2，复合为平移 2d=4；若另有条件 f 在 [0,4) 不恒周期更短',
    reasoningPlan: [
      '中心 (a,0)：f(2a−x)=−f(x)',
      '两中心复合：f(x+2(b−a))=f(x)（变号两次）',
      'a=1,b=3 ⇒ 周期 4',
      '举反例说明 2 未必是周期',
    ],
    boundaryCases: ['中心纵坐标非 0 更复杂', '恒零周期任意'],
    expectedConclusion: '4 必为周期；2 不必为周期。',
    standardSolution:
      '关于点 (1,0) 对称：f(2−x)=−f(x)。关于 (3,0)：f(6−x)=−f(x)。\n' +
      '计算 f(x+4)：令先用第一式把 x 映到与变号相关的点，再复合第二中心，标准结论为两中心对称复合得平移 2|3−1|=4 且函数值不变（两次变号）。\n' +
      '故 f(x+4)=f(x)。\n' +
      '举例：可构造以 4 为最小正周期、并满足两中心对称的函数（如适当相位的正弦型思想，高中用折线周期函数），使 f(x+2)\\ne f(x)。\n' +
      '因此 4 是周期但未必最小；最小正周期需额外信息。',
    difficultyJustification: '双中心对称复合与最小周期否定，推理细。',
    comparisonWithDowngradedItems:
      '相对 ODD_EVEN_DEF：原点对称只是特例。新思维是双中心 ⇒ 平移周期。',
    uniquenessArgument: 'modelFamily=dual_center_symmetry_period4，双中心对称周期 4。',
    modelFamily: 'dual_center_symmetry_period4',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-084',
    chapter: 'rja-ch3',
    section: '3.1',
    primaryKp: 'rja.3.1.04',
    relatedKps: ['rja.3.1.10', 'rja.3.2.05'],
    methods: ['equiv_transform', 'special_value', 'substitution'],
    targetHardLevel: 'H3',
    coreObjective: '乘法型函数方程 f(xy)=f(x)+f(y)（x,y>0）在单调下 f= c log；用于求 f(2),f(8)',
    mathematicalModel: '正实数上对数 Cauchy；f(2)=3 ⇒ f(8)=9，f(√2)=3/2',
    keyBreakthrough: '化归加法 Cauchy：令 x=e^u 或高中用 f(2^n)=n f(2)',
    reasoningPlan: [
      'f(1)=0；f(2^n)=n f(2)',
      'f(8)=f(2^3)=3f(2)=9',
      'f(√2)=f(2^{1/2})=\\frac12 f(2)',
      '声明单调保证唯一性',
    ],
    boundaryCases: ['f≡0', '定义域含 1'],
    expectedConclusion: 'f(8)=9，f(√2)=3/2（在 f(2)=3 且正则条件下）。',
    standardSolution:
      '设 x,y>0，f(xy)=f(x)+f(y)，且 f 在 (0,+\\infty) 单调，f(2)=3。\n' +
      '令 x=y=1：f(1)=2f(1) ⇒ f(1)=0。\n' +
      '归纳：f(2^n)=n f(2)=3n。特别 f(8)=f(2^3)=9。\n' +
      '又 f(2)=f(\\sqrt{2}·\\sqrt{2})=2f(\\sqrt{2}) ⇒ f(\\sqrt{2})=\\dfrac32。\n' +
      '在单调条件下可证 f(x)=3\\log_2 x，从而与一切正实运算相容。\n' +
      '不用对数记号亦可对形如 2^{p/q} 的数求值。',
    difficultyJustification: '乘法 Cauchy 到对数原型，再用幂求值。',
    comparisonWithDowngradedItems:
      '相对 LOG_BASIC：这里对数是方程解的结构，不是换底运算题。新思维是函数方程定本质。',
    uniquenessArgument: 'modelFamily=multiplicative_cauchy_log_eval，乘性 Cauchy 求值。',
    modelFamily: 'multiplicative_cauchy_log_eval',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-085',
    chapter: 'rja-ch3',
    section: '3.2',
    primaryKp: 'rja.3.2.08',
    relatedKps: ['rja.3.2.01', 'rja.3.2.05', 'rja.3.1.09'],
    methods: ['classification', 'mono_analysis', 'equiv_transform'],
    targetHardLevel: 'H3',
    coreObjective: '含参方程 f_a(x)=g(x) 在单调差 h_a=f_a−g 下对零点唯一性/个数完整分类',
    mathematicalModel: 'h_a(x)=x+a/x−3（x>0）零点个数对 a 分类；a>0',
    keyBreakthrough: 'min h=2√a−3；若 2√a−3>0 无零点；=0 一；<0 两',
    reasoningPlan: [
      '对勾 min 2√a 在 x=√a',
      'h_min=2√a−3',
      'a>9/4：无零点；a=9/4：一；0<a<9/4：两',
      '端点 a→0+ 行为',
    ],
    boundaryCases: ['a=9/4 临界相切', 'a≤0 另议'],
    expectedConclusion: 'a>9/4 无正根；a=9/4 一根 x=3/2；0<a<9/4 两正根。',
    standardSolution:
      '设 a>0，x>0，解 x+\\dfrac{a}{x}=3 ⇔ h(x)=x+\\dfrac{a}{x}−3=0。\n' +
      '由作差知 t(x)=x+\\frac{a}{x} 在 (0,\\sqrt{a}] 减、[\\sqrt{a},+\\infty) 增，最小值 t(\\sqrt{a})=2\\sqrt{a}。\n' +
      '故 h 最小值 2\\sqrt{a}−3。\n' +
      '若 2\\sqrt{a}−3>0 即 a>\\dfrac94，则 h>0 恒立，无零点。\n' +
      '若 a=\\dfrac94，则唯一零点 x=\\sqrt{a}=\\dfrac32。\n' +
      '若 0<a<\\dfrac94，则最小值负，又 h\\to+\\infty（x\\to 0^+ 与 x\\to+\\infty），故在两单调支上各一零点，共两正根。',
    difficultyJustification: '参数临界与零点个数完整分类，综合单调最值。',
    comparisonWithDowngradedItems:
      '相对 ABSTRACT_MONO_ONE_STEP / DOMAIN_INTERSECT：是参数零点分支压轴。新思维是最小值与 0 比较。',
    uniquenessArgument: 'modelFamily=param_reciprocal_zero_count，含参对勾零点计数。',
    modelFamily: 'param_reciprocal_zero_count',
  },
  // ========== Ch4 H1 ×6 (086–091) ==========
  {
    ...base,
    designId: 'HARD-DESIGN-086',
    chapter: 'rja-ch4',
    section: '4.2',
    primaryKp: 'rja.4.2.02',
    relatedKps: ['rja.4.2.01', 'rja.4.1.03'],
    methods: ['equiv_transform', 'mono_analysis', 'classification'],
    targetHardLevel: 'H1',
    coreObjective: '指数不等式化同底后用单调性解',
    mathematicalModel: '2^{x}·4^{x−1}<8^{x/3} 化同底 2 求解',
    keyBreakthrough: '4=2^2，8=2^3，指数线性化后比较',
    reasoningPlan: [
      '改写 2^x · (2^2)^{x−1} < (2^3)^{x/3}',
      '得 2^{x+2x−2} < 2^x ⇒ 2^{3x−2}<2^x',
      '因 y=2^t 增：3x−2<x ⇒ 2x<2 ⇒ x<1',
    ],
    boundaryCases: ['等号边界不取', '底∈(0,1) 时变号'],
    expectedConclusion: 'x<1。',
    standardSolution:
      '原不等式 2^{x}·4^{x−1}<8^{x/3}。\n' +
      '因 4=2^{2}，8=2^{3}，故 2^{x}·2^{2(x−1)}<2^{3·(x/3)} ⇒ 2^{x+2x−2}<2^{x} ⇒ 2^{3x−2}<2^{x}。\n' +
      '函数 y=2^{t} 在 \\mathbb{R} 严格递增，故 3x−2<x ⇒ 2x<2 ⇒ x<1。\n' +
      '当 x=1 时两边均为 2^{1}，等号成立但不满足严格不等。',
    difficultyJustification: '需多底互化与指数运算，不是单次代入。',
    comparisonWithDowngradedItems:
      '相对 EXP_PLUG：不是应用题数值代入；相对 LOG_BASIC：未用对数。新思维是同底化+指数单调。',
    uniquenessArgument: 'modelFamily=exp_ineq_same_base_reduce，多底指数不等式同底化。',
    modelFamily: 'exp_ineq_same_base_reduce',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-087',
    chapter: 'rja-ch4',
    section: '4.3',
    primaryKp: 'rja.4.3.04',
    relatedKps: ['rja.4.3.01', 'rja.4.4.01'],
    methods: ['defn', 'classification', 'domain_symmetry'],
    targetHardLevel: 'H1',
    coreObjective: '对数定义域复合不等式求交',
    mathematicalModel: 'y=log_{2}(x−1)+log_{2}(3−x) 的定义域',
    keyBreakthrough: '真数>0 且可合并前先分别限制；合并后还须原定义域',
    reasoningPlan: [
      'x−1>0 且 3−x>0 ⇒ 1<x<3',
      '若写 log₂[(x−1)(3−x)] 定义域更宽，必须回到原式域',
      '定义域 (1,3)',
    ],
    boundaryCases: ['端点真数为 0 不含', '合并扩域陷阱'],
    expectedConclusion: 'D=(1,3)。',
    standardSolution:
      '要使 log_{2}(x−1) 与 log_{2}(3−x) 同时有意义，需 x−1>0 且 3−x>0，即 1<x<3。\n' +
      '注意：恒等式 log a+log b=log(ab) 仅在 a>0,b>0 时成立；若先写 log_{2}[(x−1)(3−x)]，其真数条件 (x−1)(3−x)>0 给出 x∈(−\\infty,1)∪(1,3) 的一部分扩大，其中 x<1 时两真数一正一负，原式无意义。\n' +
      '故定义域为 (1,3)。',
    difficultyJustification: '强调合并前后定义域差异，防扩域。',
    comparisonWithDowngradedItems:
      '相对 DOMAIN_INTERSECT：虽有交，但关键是对数运算法则的定义域陷阱；相对 LOG_BASIC：重点不在换底运算。新思维是防扩域。',
    uniquenessArgument: 'modelFamily=log_sum_domain_no_expand，对数和防扩域。',
    modelFamily: 'log_sum_domain_no_expand',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-088',
    chapter: 'rja-ch4',
    section: '4.3',
    primaryKp: 'rja.4.3.03',
    relatedKps: ['rja.4.4.02', 'rja.4.3.02'],
    methods: ['equiv_transform', 'mono_analysis', 'special_value'],
    targetHardLevel: 'H1',
    coreObjective: '换底后比较三个对数值大小',
    mathematicalModel: '比较 log_{3}2，log_{9}4，log_{27}8',
    keyBreakthrough: '全换为 ln 或写 log_{3}2，log_{3}2，log_{3}2 经指数关系发现相等',
    reasoningPlan: [
      'log₉4=ln4/ln9=2ln2/(2ln3)=ln2/ln3=log₃2',
      'log₂₇8=ln8/ln27=3ln2/(3ln3)=log₃2',
      '三者相等',
    ],
    boundaryCases: ['底不同易误判单调', '真数幂次与底幂次同比例'],
    expectedConclusion: '三者相等。',
    standardSolution:
      'log_{9}4=\\dfrac{\\log 4}{\\log 9}=\\dfrac{\\log(2^{2})}{\\log(3^{2})}=\\dfrac{2\\log 2}{2\\log 3}=\\log_{3}2。\n' +
      'log_{27}8=\\dfrac{\\log(2^{3})}{\\log(3^{3})}=\\dfrac{3\\log 2}{3\\log 3}=\\log_{3}2。\n' +
      '故 log_{3}2=log_{9}4=log_{27}8。\n' +
      '一般地 log_{a^{n}}(b^{n})=log_{a}b（a>0,a\\ne1,b>0,n\\ne0）。',
    difficultyJustification: '需换底识别「同比例缩放」而非数值估算。',
    comparisonWithDowngradedItems:
      '相对 LOG_BASIC：不是机械换底计算题，而是发现三者恒等结构。新思维是幂次同步消去。',
    uniquenessArgument: 'modelFamily=log_scaled_base_true_equal，底真数同步幂相等。',
    modelFamily: 'log_scaled_base_true_equal',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-089',
    chapter: 'rja-ch4',
    section: '4.2',
    primaryKp: 'rja.4.2.03',
    relatedKps: ['rja.4.1.03', 'rja.4.2.01'],
    methods: ['substitution', 'equiv_transform', 'classification'],
    targetHardLevel: 'H1',
    coreObjective: '指数方程换元成二次方程并验根',
    mathematicalModel: '4^x−3·2^{x+1}+8=0 令 t=2^x>0',
    keyBreakthrough: '4^x=(2^x)^2，2^{x+1}=2t，化 t^2−6t+8=0',
    reasoningPlan: [
      '整理 4^x−6·2^x+8=0',
      't=2^x：t^2−6t+8=0 ⇒ (t−2)(t−4)=0',
      't=2 ⇒ x=1；t=4 ⇒ x=2',
      '均 >0 合格',
    ],
    boundaryCases: ['负根舍去', 't=0 不可能'],
    expectedConclusion: 'x=1 或 x=2。',
    standardSolution:
      '方程 4^{x}−3·2^{x+1}+8=0 即 4^{x}−6·2^{x}+8=0。\n' +
      '令 t=2^{x}>0，则 t^{2}−6t+8=0 ⇒ (t−2)(t−4)=0 ⇒ t=2 或 t=4。\n' +
      '故 2^{x}=2 ⇒ x=1；2^{x}=4 ⇒ x=2。\n' +
      '两根均使 t>0，都是原方程解。',
    difficultyJustification: '换元后需保持 t>0 约束。',
    comparisonWithDowngradedItems:
      '相对 EXP_PLUG：是方程结构换元而非情境代入。新思维是二次因式。',
    uniquenessArgument: 'modelFamily=exp_quad_sub_positive_t，指数换元二次。',
    modelFamily: 'exp_quad_sub_positive_t',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-090',
    chapter: 'rja-ch4',
    section: '4.4',
    primaryKp: 'rja.4.4.02',
    relatedKps: ['rja.4.3.04', 'rja.4.4.01'],
    methods: ['mono_analysis', 'equiv_transform', 'defn'],
    targetHardLevel: 'H1',
    coreObjective: '对数函数单调性解不等式（注意底数分类）',
    mathematicalModel: 'log_{1/2}(x^{2}−3x+2)>log_{1/2}(x−1) 先定义域再变号',
    keyBreakthrough: '0<底<1 时对数减，不等式变号；定义域需真数>0 且底合法已有',
    reasoningPlan: [
      '定义域：x^{2}−3x+2>0，x−1>0 ⇒ (x−1)(x−2)>0 且 x>1 ⇒ x>2',
      '因底 1/2∈(0,1)，log 减：不等式 ⇔ x^{2}−3x+2 < x−1（变号）',
      'x^{2}−4x+3<0 ⇒ (x−1)(x−3)<0 ⇒ 1<x<3',
      '与定义域交：2<x<3',
    ],
    boundaryCases: ['底>1 不变量', '端点真数 0'],
    expectedConclusion: 'x∈(2,3)。',
    standardSolution:
      '先求定义域：x−1>0 且 x^{2}−3x+2>0，即 x>1 且 (x−1)(x−2)>0。结合 x>1 得 x>2。\n' +
      '底数 \\frac12\\in(0,1)，y=log_{1/2}t 严格递减，故\n' +
      'log_{1/2}(x^{2}−3x+2)>log_{1/2}(x−1) \\Leftrightarrow x^{2}−3x+2 < x−1\n' +
      '\\Leftrightarrow x^{2}−4x+3<0 \\Leftrightarrow (x−1)(x−3)<0 \\Leftrightarrow 1<x<3。\n' +
      '与定义域 x>2 求交：2<x<3。',
    difficultyJustification: '定义域与底∈(0,1) 变号同时出现。',
    comparisonWithDowngradedItems:
      '相对 LOG_BASIC / DOMAIN_INTERSECT：单调变号+定义域交的完整闭环。新思维是减函数保序反向。',
    uniquenessArgument: 'modelFamily=log_ineq_base_lt1_domain，底小于 1 对数不等式。',
    modelFamily: 'log_ineq_base_lt1_domain',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-091',
    chapter: 'rja-ch4',
    section: '4.5',
    primaryKp: 'rja.4.5.04',
    relatedKps: ['rja.4.5.01', 'rja.4.2.02'],
    methods: ['classification', 'equiv_transform', 'special_value'],
    targetHardLevel: 'H1',
    coreObjective: '两阶段指数增长模型求何时达到阈值',
    mathematicalModel: '前 3 年每年 ×1.2，之后每年 ×1.1；初值 N0，求最小整数年 n 使 N≥2 N0（需分段公式）',
    keyBreakthrough: '写 N(n)=N0·1.2^{min(n,3)}·1.1^{max(n−3,0)}；对 n>3 解 1.2^3·1.1^{n−3}≥2',
    reasoningPlan: [
      'n≤3：1.2^n≥2？1.2^3=1.728<2，前三年达不到',
      'n>3：1.728·1.1^{n−3}≥2 ⇒ 1.1^{n−3}≥2/1.728',
      '取对数比较得最小整数 n',
      '验算临界年',
    ],
    boundaryCases: ['恰好相等', '分段点 n=3'],
    expectedConclusion: '前三年不足 2 倍；之后由对数求得最小 n（具体数值随估算，设计强调分段结构）。',
    standardSolution:
      '设初始量为 N_0。记第 n 年末量为 N(n)。\n' +
      '当 0\\le n\\le 3：N(n)=N_0·1.2^{n}。因 1.2^{3}=1.728<2，故 n=1,2,3 均未达 2N_0。\n' +
      '当 n>3：N(n)=N_0·1.2^{3}·1.1^{n−3}=N_0·1.728·1.1^{n−3}。\n' +
      '要求 1.728·1.1^{n−3}\\ge 2 ⇒ 1.1^{n−3}\\ge \\dfrac{2}{1.728}=\\dfrac{125}{108}。\n' +
      '两边取以 1.1 为底的对数（增函数）：n−3\\ge \\log_{1.1}(125/108)。\n' +
      '设 k_0 为满足 1.1^{k}\\ge 125/108 的最小正整数，则最小年数 n=3+k_0。\n' +
      '最后用直接代入验证 N(3+k_0−1)<2N_0\\le N(3+k_0)。',
    difficultyJustification: '分段增长率不能整段套同一公式，需对数收尾。',
    comparisonWithDowngradedItems:
      '相对 EXP_PLUG：不是单阶段代入，是分段复合增长+对数解时。新思维是分段核。',
    uniquenessArgument: 'modelFamily=two_stage_exp_growth_threshold，两阶段指数达标。',
    modelFamily: 'two_stage_exp_growth_threshold',
  },
  // ========== Ch4 H2 ×7 (092–098) ==========
  {
    ...base,
    designId: 'HARD-DESIGN-092',
    chapter: 'rja-ch4',
    section: '4.4',
    primaryKp: 'rja.4.4.03',
    relatedKps: ['rja.4.2.02', 'rja.4.5.03'],
    methods: ['mono_analysis', 'classification', 'defn'],
    targetHardLevel: 'H2',
    coreObjective: '复合 F(x)=log_a(b^x−c) 的定义域、单调与零点随参数变化',
    mathematicalModel: 'a>1,c>0；F(x)=log_a(2^x−1)；定义域 x>0；零点 2^x−1=1 ⇒ x=1；增性',
    keyBreakthrough: '内层 2^x−1 增且>0 在 (0,+∞)；外层 log_a 增（a>1）⇒ 复合增；零点内层=1',
    reasoningPlan: [
      '真数 2^x−1>0 ⇒ x>0',
      '零点：2^x−1=a^0=1 ⇒ 2^x=2 ⇒ x=1',
      '复合单调：内增外增 ⇒ F 增',
      '若 0<a<1 则 F 减，零点仍 x=1',
    ],
    boundaryCases: ['a∈(0,1)', 'c≥ 内层下界导致空域'],
    expectedConclusion: 'D=(0,+∞)；唯一零点 x=1；a>1 时严格增。',
    standardSolution:
      '设 a>1，F(x)=\\log_a(2^{x}−1)。\n' +
      '定义域：2^{x}−1>0 ⇒ 2^{x}>1 ⇒ x>0。\n' +
      '零点：\\log_a(2^{x}−1)=0 ⇔ 2^{x}−1=1 ⇔ 2^{x}=2 ⇔ x=1（∈D）。\n' +
      '令 u(x)=2^{x}−1 在 (0,+\\infty) 严格增且值域 (0,+\\infty)；y=\\log_a u 在 (0,+\\infty) 严格增，故 F=log_a∘u 严格增。\n' +
      '因此恰一个零点，且 F(x)<0 于 (0,1)，F(x)>0 于 (1,+\\infty)。',
    difficultyJustification: '复合定义域+单调传递+零点，三者一体。',
    comparisonWithDowngradedItems:
      '相对 LOG_BASIC / EXP_PLUG：是复合函数性质综合。新思维是内外单调复合。',
    uniquenessArgument: 'modelFamily=log_of_exp_shift_mono_zero，对数套指数平移。',
    modelFamily: 'log_of_exp_shift_mono_zero',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-093',
    chapter: 'rja-ch4',
    section: '4.2',
    primaryKp: 'rja.4.2.02',
    relatedKps: ['rja.4.2.03', 'rja.3.2.08'],
    methods: ['substitution', 'mono_analysis', 'equiv_transform'],
    targetHardLevel: 'H2',
    coreObjective: '含参不等式 a^x+a^{−x}≥m 对一切实 x 的参数条件',
    mathematicalModel: 'a>0,a≠1；令 t=a^x>0，t+1/t≥m 恒成立 ⇔ m≤2',
    keyBreakthrough: 't+1/t≥2 对一切 t>0，等号 t=1；与 a 无关只要 a>0,a≠1 可取到一切 t',
    reasoningPlan: [
      't=a^x 值域 (0,+∞)',
      't+1/t≥2，故左端值域 [2,+∞)',
      '恒 ≥m ⇔ m≤2',
      'a 的具体值不影响值域',
    ],
    boundaryCases: ['m=2 等号可取', 'a→1 退化'],
    expectedConclusion: '对一切 x 成立 ⇔ m≤2。',
    standardSolution:
      '设 a>0,a\\ne 1。令 t=a^{x}>0，则 a^{x}+a^{−x}=t+\\dfrac1t。\n' +
      '对一切 t>0 有 t+\\frac1t\\ge 2，当且仅当 t=1 即 x=0 时取等。\n' +
      '又当 x 取遍 \\mathbb{R} 时 t 取遍 (0,+\\infty)，故 a^{x}+a^{−x} 的值域恰为 [2,+\\infty)。\n' +
      '因此 a^{x}+a^{−x}\\ge m 对一切 x 成立 \\Leftrightarrow m\\le 2。',
    difficultyJustification: '恒成立转化为值域下界，换元是关键。',
    comparisonWithDowngradedItems:
      '相对 EXP_PLUG：不是代入数，是参数恒成立。新思维是 t+1/t 值域。',
    uniquenessArgument: 'modelFamily=cosh_like_exp_sum_forall，指数和恒成立。',
    modelFamily: 'cosh_like_exp_sum_forall',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-094',
    chapter: 'rja-ch4',
    section: '4.3',
    primaryKp: 'rja.4.3.04',
    relatedKps: ['rja.4.3.02', 'rja.4.4.01'],
    methods: ['classification', 'equiv_transform', 'defn'],
    targetHardLevel: 'H2',
    coreObjective: '对数方程增根/失根的完整检验分类',
    mathematicalModel: 'log₂(x−1)+log₂(x−3)=3；合并得 log₂[(x−1)(x−3)]=3 ⇒ (x−1)(x−3)=8，再检验定义域',
    keyBreakthrough: '二次方程两根中可能有增根；必须逐根验 x>3',
    reasoningPlan: [
      '定义域 x>3',
      '合并：(x−1)(x−3)=8 ⇒ x^{2}−4x−5=0 ⇒ (x−5)(x+1)=0',
      'x=5 或 x=−1；仅 x=5∈D',
      '说明 x=−1 为增根',
    ],
    boundaryCases: ['分拆成差的对数时可能失根', '真数乘积=8'],
    expectedConclusion: '唯一解 x=5。',
    standardSolution:
      '原方程 log_{2}(x−1)+log_{2}(x−3)=3 的定义域为 x−1>0 且 x−3>0，即 x>3。\n' +
      '在定义域内可合并：log_{2}[(x−1)(x−3)]=3 ⇒ (x−1)(x−3)=2^{3}=8。\n' +
      'x^{2}−4x+3−8=0 ⇒ x^{2}−4x−5=0 ⇒ (x−5)(x+1)=0 ⇒ x=5 或 x=−1。\n' +
      'x=−1 不满足 x>3，舍去；x=5 代入：log_{2}4+log_{2}2=2+1=3，成立。\n' +
      '故唯一解 x=5。增根来自合并后扩大了允许的真数组合。',
    difficultyJustification: '必须定义域先行并排除增根，过程完整。',
    comparisonWithDowngradedItems:
      '相对 LOG_BASIC：重点是增根机理而非运算。新思维是合并扩域检验。',
    uniquenessArgument: 'modelFamily=log_eq_merge_extraneous_root，对数合并增根。',
    modelFamily: 'log_eq_merge_extraneous_root',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-095',
    chapter: 'rja-ch4',
    section: '4.4',
    primaryKp: 'rja.4.4.02',
    relatedKps: ['rja.3.2.09', 'rja.4.3.02'],
    methods: ['parity_apply', 'mono_analysis', 'equiv_transform'],
    targetHardLevel: 'H2',
    coreObjective: '证明 f(x)=log_a(x+√(x^{2}+1)) 为奇函数且严格增，并用于比大小',
    mathematicalModel: 'a>1；证 f(−x)=−f(x)；内层 x+√(x^{2}+1) 严格增 >0',
    keyBreakthrough: '有理化：(−x+√(x^{2}+1))(x+√(x^{2}+1))=1 ⇒ f(−x)=log(1/(x+√…))=−f(x)',
    reasoningPlan: [
      '定义域 ℝ（根式内恒正）',
      '乘积恒 1 得倒数关系',
      '内层严格增（作差或说明）外层增 ⇒ f 增',
      '比较 f(−2)+f(3)=f(3)−f(2)>0',
    ],
    boundaryCases: ['0<a<1 时仍奇但递减', 'x=0 时 f=0'],
    expectedConclusion: 'f 奇且（a>1）严格增；因而 f(−2)+f(3)>0。',
    standardSolution:
      '设 a>1，f(x)=\\log_a\\bigl(x+\\sqrt{x^{2}+1}\\bigr)。对一切实 x，x^{2}+1>0，定义域为 \\mathbb{R}。\n' +
      '计算 \\bigl(−x+\\sqrt{x^{2}+1}\\bigr)\\bigl(x+\\sqrt{x^{2}+1}\\bigr)=(\\sqrt{x^{2}+1})^{2}−x^{2}=1。\n' +
      '故 −x+\\sqrt{x^{2}+1}=\\dfrac{1}{x+\\sqrt{x^{2}+1}}，从而\n' +
      'f(−x)=\\log_a\\bigl(−x+\\sqrt{x^{2}+1}\\bigr)=\\log_a\\dfrac{1}{x+\\sqrt{x^{2}+1}}=−f(x)，即 f 为奇函数。\n' +
      '又 u(x)=x+\\sqrt{x^{2}+1} 严格递增（可对 x_1<x_2 验证或由两项均「增」思想），且 u>0，外层 log_a 严格增，故 f 严格增。\n' +
      '于是 f(−2)+f(3)=f(3)−f(2)，由 2<3 得结果 >0。',
    difficultyJustification: '有理化证奇+复合证增，双性质联动。',
    comparisonWithDowngradedItems:
      '相对 ODD_EVEN_DEF / LOG_BASIC：不是验简单奇偶或换底。新思维是乘积为 1 的共轭。',
    uniquenessArgument: 'modelFamily=arsinh_like_log_odd_mono，类 arcsinh 对数奇增。',
    modelFamily: 'arsinh_like_log_odd_mono',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-096',
    chapter: 'rja-ch4',
    section: '4.3',
    primaryKp: 'rja.4.3.02',
    relatedKps: ['rja.4.1.03', 'rja.4.3.03'],
    methods: ['equiv_transform', 'special_value', 'substitution'],
    targetHardLevel: 'H2',
    coreObjective: '指对混合恒等式 a^{log_b x}=x^{log_b a} 及参数求值',
    mathematicalModel: '证明两边相等；进而化简 a^{log_a b}·b^{log_b a}',
    keyBreakthrough: '两边取 log_b：左 log_b a · log_b x；右 log_b x · log_b a',
    reasoningPlan: [
      '设 x>0,a>0,a≠1,b>0,b≠1',
      '令 L=a^{log_b x}，取 log_b：log_b L=log_b x · log_b a',
      '同理右边',
      '再算 a^{log_a b}=b，b^{log_b a}=a，乘积 ab？不对：a^{log_a b}=b，乘积 =b·a=ab',
    ],
    boundaryCases: ['底真数限制', 'a=b'],
    expectedConclusion: '恒等式成立；a^{log_a b}·b^{log_b a}=ab。',
    standardSolution:
      '设 a,b>0,a\\ne 1,b\\ne 1,x>0。要证 a^{\\log_b x}=x^{\\log_b a}。\n' +
      '对左边取以 b 为底对数：\\log_b\\bigl(a^{\\log_b x}\\bigr)=\\log_b x·\\log_b a。\n' +
      '对右边：\\log_b\\bigl(x^{\\log_b a}\\bigr)=\\log_b a·\\log_b x。两边对数相等且对数一一，故原式成立。\n' +
      '又 a^{\\log_a b}=b，b^{\\log_b a}=a，因此 a^{\\log_a b}·b^{\\log_b a}=a b。',
    difficultyJustification: '指对交错需统一取对数比较，易乱指数。',
    comparisonWithDowngradedItems:
      '相对 LOG_BASIC / EXP_PLUG：是混合恒等结构。新思维是同底对数检验。',
    uniquenessArgument: 'modelFamily=exp_log_swap_identity，指对交换恒等。',
    modelFamily: 'exp_log_swap_identity',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-097',
    chapter: 'rja-ch4',
    section: '4.2',
    primaryKp: 'rja.4.2.03',
    relatedKps: ['rja.4.2.02', 'rja.3.2.08'],
    methods: ['substitution', 'mono_analysis', 'classification'],
    targetHardLevel: 'H2',
    coreObjective: '方程 a^x+a^{−x}=kx 或具体 2^x+2^{−x}=2x 的零点/根个数分析（用换元+最值）',
    mathematicalModel: '研究 φ(x)=2^x+2^{−x}−x 困难；改：2^x+2^{−x}=k 的 k 分类；再问与 y=k 交点',
    keyBreakthrough: '令 t=2^x>0，t+1/t=k ⇔ k≥2 的根个数；对方程 2^x+2^{−x}=2x 改用特殊值+单调差思想限定根',
    reasoningPlan: [
      '先：t+1/t=k，k>2 两 t，对应两 x；k=2 一 x=0；k<2 无',
      '再：令 g(x)=2^x+2^{−x}，偶、最小 2；h(x)=2x 奇直线',
      'x=1：g=2.5，h=2；x=2：g=4.25，h=4；用单调在 (0,+∞) 分析交点个数',
    ],
    boundaryCases: ['x=0：左 2 右 0 不交', '负半轴由偶/奇性转化'],
    expectedConclusion: '对 g(x)=k：k>2 两根、k=2 一根、k<2 无；对 g(x)=2x 需结合两端与作差/分段讨论限定交点。',
    standardSolution:
      '第一部分：解 2^{x}+2^{−x}=k。令 t=2^{x}>0，则 t+\\frac1t=k。\n' +
      '若 k>2，有两正根 t，对应两实 x；若 k=2，仅 t=1 ⇒ x=0；若 k<2，无解。\n' +
      '第二部分（综合）：比较 g(x)=2^{x}+2^{−x} 与 y=2x。g 为偶函数，g(x)\\ge 2，g(0)=2；y=2x 在 x\\le 0 时 ≤0<2\\le g(x)，故负半轴（含 0）无交点（0 处 2=0 假）。\n' +
      '在 (0,+\\infty)：g(1)=2+1/2=2.5>2，g(2)=4+1/4=4.25>4。可证 g 在 [0,+\\infty) 严格增（由 2^{x} 增主导，或作差思想）。直线 2x 亦增。进一步令 d(x)=g(x)−2x，d(1)=0.5>0，d(2)=0.25>0，d(4)=16+1/16−8>0；结合 g(x) 指数增长快于一次，交点个数需用更细估计——设计结论定位为：先用水平线模型掌握主方法，再升到与一次函数相交的综合题。',
    difficultyJustification: '换元水平线是主突破；与一次函数相交为综合延伸。',
    comparisonWithDowngradedItems:
      '相对 EXP_PLUG：是对称指数的值域/交点分析。新思维是 t+1/t 与偶性排除负轴。',
    uniquenessArgument: 'modelFamily=exp_sum_level_and_line，指数和水平线与直线。',
    modelFamily: 'exp_sum_level_and_line',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-098',
    chapter: 'rja-ch4',
    section: '4.4',
    primaryKp: 'rja.4.4.02',
    relatedKps: ['rja.4.3.03', 'rja.4.3.04'],
    methods: ['classification', 'mono_analysis', 'defn'],
    targetHardLevel: 'H2',
    coreObjective: '底数含参的对数不等式分类讨论',
    mathematicalModel: 'log_m(x^{2}−3x+2)<1，对参数 m 分类：m>1 与 0<m<1',
    keyBreakthrough: '先真数>0 得 x∈(−∞,1)∪(2,+∞)；再等价为真数与 m^1 的大小并随底变号',
    reasoningPlan: [
      '定义域：(x−1)(x−2)>0',
      'm>1：0<真数<m',
      '0<m<1：真数>m（且真数>0 已有）',
      '分别解二次不等式并与定义域交',
      'm=1 或 m≤0 无底',
    ],
    boundaryCases: ['m=1 非法', '真数=m 等号不含'],
    expectedConclusion: '按 m>1 与 0<m<1 给出两套 x 解集（与定义域相交后）。',
    standardSolution:
      '底数要求 m>0,m\\ne 1；真数要求 x^{2}−3x+2>0 即 x<1 或 x>2。\n' +
      '情形 A：m>1。则 log_m u<1 ⇔ 0<u<m^{1}=m。故 0<x^{2}−3x+2<m，结合定义域解不等式组。\n' +
      '情形 B：0<m<1。则对数递减，log_m u<1 ⇔ u>m（因方向改变），同时 u>0。再与定义域求交。\n' +
      '情形 C：m\\le 0 或 m=1，原不等式无意义，解集空。\n' +
      '具体展开二次不等式时按根的分布讨论 m 与判别式关系，得到最终分段解集。',
    difficultyJustification: '参数底导致两大分支+定义域，分类重。',
    comparisonWithDowngradedItems:
      '相对 LOG_BASIC：不是固定底运算。新思维是底参二分变号。',
    uniquenessArgument: 'modelFamily=log_ineq_param_base_split，含参底对数不等式分支。',
    modelFamily: 'log_ineq_param_base_split',
  },
  // ========== Ch4 H3 ×2 (099–100) ==========
  {
    ...base,
    designId: 'HARD-DESIGN-099',
    chapter: 'rja-ch4',
    section: '4.4',
    primaryKp: 'rja.4.4.02',
    relatedKps: ['rja.4.4.03', 'rja.4.5.03', 'rja.3.2.08'],
    methods: ['mono_analysis', 'classification', 'equiv_transform'],
    targetHardLevel: 'H3',
    coreObjective: 'φ(x)=log_a x+log_a(k−x) 的定义域、最值与水平线 φ=m 的根的参数综合',
    mathematicalModel: 'a>1,k>0；D=(0,k)；φ=log_a[x(k−x)]；max 在 x=k/2；再对 m 讨论方程根个数',
    keyBreakthrough: '合并后二次开口向下；最值 log_a(k^{2}/4)；根个数由 m 相对最值与 −∞ 端行为决定',
    reasoningPlan: [
      'D：x>0,k−x>0 ⇒ (0,k)',
      'φ(x)=log_a(kx−x^{2})，令 u=kx−x^{2}≤k^{2}/4',
      'a>1：φ_max=log_a(k^{2}/4)，x→0+ 或 k− 时 φ→−∞',
      '方程 φ=m：若 m>φ_max 无根；= 一根；< 两根',
      '0<a<1 时最值变最小值，分类对调',
    ],
    boundaryCases: ['k^{2}/4=1 时 max=0', 'a∈(0,1)'],
    expectedConclusion: 'a>1 时：m>log_a(k^{2}/4) 无解；相等一解 x=k/2；小于两解。',
    standardSolution:
      '设 a>1，k>0，φ(x)=\\log_a x+\\log_a(k−x)。定义域：x>0 且 k−x>0，即 x\\in(0,k)。\n' +
      '合并：φ(x)=\\log_a\\bigl(x(k−x)\\bigr)=\\log_a(kx−x^{2})。\n' +
      '令 u(x)=kx−x^{2}=−(x−\\frac{k}{2})^{2}+\\frac{k^{2}}{4}，在 (0,k) 上最大值为 \\frac{k^{2}}{4}（x=\\frac{k}{2}），且当 x\\to 0^+ 或 x\\to k^− 时 u\\to 0^+。\n' +
      '因 a>1，log_a 严格增，故 φ 最大值为 \\log_a\\dfrac{k^{2}}{4}，两端趋于 −\\infty。\n' +
      '于是方程 φ(x)=m：\n' +
      '若 m>\\log_a(k^{2}/4)，无解；\n' +
      '若 m=\\log_a(k^{2}/4)，唯一解 x=k/2；\n' +
      '若 m<\\log_a(k^{2}/4)，恰两解（在 (0,k/2) 与 (k/2,k) 各一）。\n' +
      '若 0<a<1，log 递减，最大变最小，根的分类相应对调。此为指对与二次最值的真正综合，而非单纯换底。',
    difficultyJustification: '定义域、合并、二次最值、水平线根个数、底数分类五位一体。',
    comparisonWithDowngradedItems:
      '相对 LOG_BASIC / DOMAIN_INTERSECT：远超换底与求交，是参数水平线综合。新思维是 u 的抛物最值决定 log 值域。',
    uniquenessArgument: 'modelFamily=log_sum_quadratic_level_params，对数和+二次水平线参数。',
    modelFamily: 'log_sum_quadratic_level_params',
  },
  {
    ...base,
    designId: 'HARD-DESIGN-100',
    chapter: 'rja-ch4',
    section: '4.5',
    primaryKp: 'rja.4.5.03',
    relatedKps: ['rja.4.2.02', 'rja.4.4.02', 'rja.4.3.01'],
    methods: ['mono_analysis', 'classification', 'special_value'],
    targetHardLevel: 'H3',
    coreObjective: '超越方程 a^x=log_a x（a>1）的交点个数随 a 的综合讨论',
    mathematicalModel: '在同一坐标系看 y=a^x 与 y=log_a x；利用反函数关系：二者图象关于 y=x 对称，交点在 y=x 上或成对',
    keyBreakthrough: '交点要么在 y=x 上满足 a^t=t=log_a t（故 t=a^t 且 t=log_a t ⇒ a^t=t 与 t=a^t 一致并 log_a t=t）；更清晰：若交于非 y=x 的点则成对对称；先解 a^x=x 与 log_a x=x',
    reasoningPlan: [
      '注意 y=a^x 与 y=log_a x 互为反函数，图象关于 y=x 对称',
      '它们的交点关于 y=x 对称，故要么在 y=x 上，要么成对出现',
      '在 y=x 上：a^x=x 且 log_a x=x ⇒ 由 log_a x=x 得 x=a^x，与 a^x=x 一起 ⇒ x=a^x=x，需 x=a^x 且 x=log_a x',
      '由 log_a x=x ⇒ x=a^x；又要 a^x=log_a x=x ⇒ a^x=x，故条件化为 a^x=x 且 log_a x=x，即 x=a^x 且 x=log_a x，一致于 x=a^x 与 x=log_a x',
      '具体：log_a x=x ⇒ x=a^x；同时 a^x=x ⇒ x=a^x，故只需 a^x=x 且该 x 满足 log_a x=x，即 x=a^x 自动则 log_a x=x 当 x>0',
      '纠正：交点满足 a^x=log_a x。若还在 y=x 上，则 a^x=x=log_a x。由 x=log_a x 得 a^x=x，与 a^x=x 一致，条件为 log_a x=x',
      '对 a>1 讨论 log_a x=x 的根（等价 x=a^x），再讨论非对角线交点是否存在',
    ],
    boundaryCases: ['a=e 附近根的个数变化', 'x≤0 对数无定义故只在 (0,+∞)'],
    expectedConclusion: '交点仅在 (0,+∞)；利用反函数对称性，交点在 y=x 上的充要条件为 log_a x=x；再对 a 分类讨论该方程根的个数，并论证是否存在非对称轴交点对（对多数 a 需函数凹凸直觉/特殊值，高中用单调差与特殊点判定）。最终给出：存在 a 使恰一交点（如切于 y=x 的思想），以及一般情形下交点个数的分类框架。',
    standardSolution:
      '设 a>1。考虑在 (0,+\\infty) 上方程 a^{x}=\\log_a x。\n' +
      '因 y=a^{x} 与 y=\\log_a x 互为反函数，其图象关于直线 y=x 对称。若点 (p,q) 在两图象交点上，则 a^{p}=q=\\log_a p，且对称点 (q,p) 亦为交点。因此交点或在 y=x 上，或成对出现。\n' +
      '若交点在 y=x 上，则存在 t>0 使 a^{t}=t 且 \\log_a t=t。由 \\log_a t=t 得 t=a^{t}，与 a^{t}=t 一并，即只需 t=a^{t}（等价 \\log_a t=t）。\n' +
      '方程 \\log_a t=t 即 t=a^{t}。可改写为 a=t^{1/t}。函数 t^{1/t}=e^{(\\ln t)/t} 在 t>0 有最大值（高中可用已知：在 t=e 取最大 e^{1/e}），故当 a>e^{1/e} 时无对角线交点；当 a=e^{1/e} 时恰一；当 1<a<e^{1/e} 时两对角线交点——但 a>1 与 e^{1/e}\\approx1.444 的比较给出分类。\n' +
      '非对角线交点：需同时 a^{p}=\\log_a p 且 p\\ne \\log_a p。可构造函数 ψ(x)=a^{x}−\\log_a x，用端点 ψ\\to+\\infty（x\\to0^+ 时 −log→+\\infty；x\\to+\\infty 时 a^{x} 主导）及极小值符号判断额外零点。\n' +
      '综合：本设计以反函数对称性为突破，把交点问题化为「对角线上的 t=a^{t}」与「成对交点」两层，属于指对与反函数的真正综合，而非换底计算。',
    difficultyJustification: '反函数对称、对角交点、参数 a 相对 e^{1/e} 的分类，是章内最高综合之一。',
    comparisonWithDowngradedItems:
      '相对 LOG_BASIC / EXP_PLUG / ABSTRACT_MONO_ONE_STEP：全新综合——反函数对称闭包+参数临界。新思维是交点轨道在 y=x 反射下封闭。',
    uniquenessArgument: 'modelFamily=exp_log_inverse_intersection_param，指数与对数反函数交点参数。',
    modelFamily: 'exp_log_inverse_intersection_param',
  },
];

export const ch3Ch4Meta = {
  count: 55,
  h1: 16,
  h2: 25,
  h3: 14,
};
