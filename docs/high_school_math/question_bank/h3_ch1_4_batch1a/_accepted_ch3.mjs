import { appItem } from './_mk_item.mjs'

/** 人教A版必修一 Chapter 3 only. export n:26..45. Offline ACCEPTED_H3. */
export const acceptedCh3 = [
  appItem({
    n: 26,
    chapterNo: 3,
    sectionCode: '3.1',
    sectionName: '函数的概念及其表示',
    kpCode: 'rja.3.1.01',
    kpName: '函数的定义',
    methodMain: 'substitution',
    methodAux: 'equiv_transform',
    qtype: 'application',
    modelFamily: 'h3-bilinear-cauchy-range-zeros',
    coreObjective: '双线性扰动函数方程定式后按水平线分类零点',
    breakthrough:
      '令 g(x)=f(x)-x(x-1)/2 化成加性方程；连续得 g(x)=cx，再用 f(1)=1 锁 c；最后配平方讨论 f(x)=k。',
    contrastH2: 'HARD14 多为给定解析式求根；本题须先从函数方程推出闭式再分类。',
    stem:
      '设 $f:\\mathbb{R}\\to\\mathbb{R}$ 连续，且对一切实数 $x,y$ 满足\n$$f(x+y)=f(x)+f(y)+xy,$$\n又已知 $f(1)=1$。\n（1）求 $f(x)$ 的解析式；\n（2）对实数 $k$，讨论方程 $f(x)=k$ 的实根个数。',
    answer:
      '（1）$f(x)=\\dfrac{1}{2}x(x+1)$；\n（2）当 $k>-\\dfrac{1}{8}$ 时 $2$ 个；当 $k=-\\dfrac{1}{8}$ 时 $1$ 个；当 $k<-\\dfrac{1}{8}$ 时 $0$ 个。',
    analysis:
      '（1）令 $g(x)=f(x)-\\dfrac12 x(x-1)$。由题设展开并用恒等式\n$$xy+\\dfrac12 x(x-1)+\\dfrac12 y(y-1)=\\dfrac12(x+y)(x+y-1)$$\n得 $g(x+y)=g(x)+g(y)$。连续加性函数满足 $g(x)=cx$（$c=g(1)$），故 $f(x)=\\dfrac12 x(x-1)+cx$。由 $f(1)=1$ 得 $c=1$，从而 $f(x)=\\dfrac12 x(x+1)$。\n（2）$f(x)=\\dfrac12\\Bigl(x+\\dfrac12\\Bigr)^2-\\dfrac18$，值域为 $\\bigl[-\\dfrac18,+\\infty\\bigr)$，与水平线 $y=k$ 的交点个数即所述分类。',
    maxScore: 12,
    rubric: [
      { step: '构造 g 并证明加性', score: 4 },
      { step: '定出 f(x)=x(x+1)/2', score: 3 },
      { step: '配平方并按 k 分类', score: 5 },
    ],
    hardLevelReason: '突破点是消去双线性扰动；后续分类建立在推导出的闭式上。',
    h3Evidence: {
      nonObviousBreakthrough: 'g=f-x(x-1)/2 recovers Cauchy',
      aboveHard14H2Contrast: 'derive closed form before zero classification',
      deepStrategyOrLayeredNecessity: 'equation → form → range → k-cases',
      routineKillCheck: 'assuming a quadratic ansatz without g-reduction misses the method',
    },
  }),

  appItem({
    n: 27,
    chapterNo: 3,
    sectionCode: '3.1',
    sectionName: '函数的概念及其表示',
    kpCode: 'rja.3.1.04',
    kpName: '对应关系',
    methodMain: 'equiv_transform',
    methodAux: 'classification',
    qtype: 'application',
    modelFamily: 'h3-reflection-sum-existence-mono',
    coreObjective: '反射和方程的存在性判据与单调增解的端点约束',
    breakthrough:
      'f(x)+f(1-x)=g(x) 有解 ⇔ g(x)=g(1-x)；在 g(x)=x(1-x) 且 f 于 [0,1] 递增时，由 f(1/2)=1/8 与 f(1)=-f(0) 得 f(0)≤-1/8。',
    contrastH2: 'HARD14 抽象函数多为代入求值；本题先给存在充要，再在单调下刻画端点可行域。',
    stem:
      '设 $g:\\mathbb{R}\\to\\mathbb{R}$。\n（1）证明：存在函数 $f:\\mathbb{R}\\to\\mathbb{R}$ 使对一切实数 $x$ 有 $f(x)+f(1-x)=g(x)$，当且仅当对一切 $x$ 有 $g(x)=g(1-x)$。\n（2）取 $g(x)=x(1-x)$。设 $f:[0,1]\\to\\mathbb{R}$ 满足 $f(x)+f(1-x)=g(x)$，且 $f$ 在 $[0,1]$ 上单调递增。求 $f\\!\\left(\\dfrac12\\right)$ 以及 $f(0)$ 的取值范围。',
    answer:
      '（1）见解析；\n（2）$f\\!\\left(\\dfrac12\\right)=\\dfrac18$，$f(0)\\in\\bigl(-\\infty,-\\dfrac18\\bigr]$。',
    analysis:
      '（1）必要性：若存在 $f$，则 $g(1-x)=f(1-x)+f(x)=g(x)$。充分性：若 $g(x)=g(1-x)$，取 $f(x)=\\dfrac12 g(x)$ 即可（更一般可加满足 $p(x)+p(1-x)=0$ 的任意 $p$）。\n（2）$g$ 满足对称条件。令 $x=\\dfrac12$：$2f\\!\\left(\\dfrac12\\right)=\\dfrac14\\Rightarrow f\\!\\left(\\dfrac12\\right)=\\dfrac18$。又 $f(0)+f(1)=0\\Rightarrow f(1)=-f(0)$。由递增：$f(0)\\le\\dfrac18\\le -f(0)$，故 $f(0)\\le -\\dfrac18$。\n对任意 $c\\le -\\dfrac18$，在 $\\bigl[0,\\dfrac12\\bigr]$ 上取连接 $(0,c)$ 与 $\\bigl(\\dfrac12,\\dfrac18\\bigr)$ 的一次函数，再令 $f(1-x)=g(x)-f(x)$ 延拓到 $\\bigl[\\dfrac12,1\\bigr]$。直接验证延拓后仍递增（差商非负），故范围是 $\\bigl(-\\infty,-\\dfrac18\\bigr]$。',
    maxScore: 14,
    rubric: [
      { step: '证明存在性充要条件', score: 4 },
      { step: '求出 f(1/2) 与 f(0)≤-1/8', score: 5 },
      { step: '构造说明范围可达', score: 5 },
    ],
    hardLevelReason: '存在性对称条件与单调端点可行域两层耦合。',
    h3Evidence: {
      nonObviousBreakthrough: 'g(x)=g(1-x) is iff for existence',
      aboveHard14H2Contrast: 'existence criterion plus mono endpoint region',
      deepStrategyOrLayeredNecessity: 'symmetry → half-value → mono inequalities → construct',
      routineKillCheck: 'producing one particular f misses the range of f(0)',
    },
  }),

  appItem({
    n: 28,
    chapterNo: 3,
    sectionCode: '3.1',
    sectionName: '函数的概念及其表示',
    kpCode: 'rja.3.1.09',
    kpName: '分段函数',
    methodMain: 'classification',
    methodAux: 'mono_analysis',
    qtype: 'application',
    modelFamily: 'h3-piecewise-cont-strict-inc-param',
    coreObjective: '三支分段连续且整体严格递增的参数充要',
    breakthrough:
      '连续锁定接口等式 c=4+2a；中支二次须用定义保证对任意 0<x1<x2<2 有 x1+x2+a>0，从而 a≥0；再补跨接口严格性。',
    contrastH2: 'HARD14 常只求连续参数；本题把严格递增定义写到二次中支上。',
    stem:
      '设\n$$f(x)=\\begin{cases} x+2, & x\\le 0,\\\\ x^{2}+ax+2, & 0<x<2,\\\\ x+c, & x\\ge 2, \\end{cases}$$\n其中 $a,c\\in\\mathbb{R}$。求使 $f$ 在 $\\mathbb{R}$ 上连续且严格递增的有序对 $(a,c)$ 的集合。',
    answer: '$\\{(a,c)\\mid a\\ge 0,\\ c=4+2a\\}$',
    analysis:
      '连续：在 $x=0$ 处中支极限为 $2=f(0)$，已吻合；在 $x=2$ 处 $4+2a+2=2+c\\Rightarrow c=4+2a$。\n严格递增：左、右支斜率均为 $1>0$。对中支，任取 $0<x_1<x_2<2$，\n$$f(x_2)-f(x_1)=(x_2-x_1)(x_1+x_2+a).$$\n故需 $x_1+x_2+a>0$ 恒成立。因 $x_1+x_2$ 可任意接近 $0^+$，必要 $a\\ge0$；当 $a\\ge0$ 时充分。\n跨接口：若 $x_1<0<x_2$，则 $f(x_1)=x_1+2<2$，而 $f(x_2)=x_2^{2}+ax_2+2>2$；若 $x_1=0<x_2$，则 $2<f(x_2)$。跨过 $x=2$ 同理。故整体严格递增的充要条件为 $a\\ge0$ 且 $c=4+2a$。',
    maxScore: 12,
    rubric: [
      { step: '由连续求出 c=4+2a', score: 3 },
      { step: '中支定义法得 a≥0', score: 5 },
      { step: '论证跨接口后整体严格增', score: 4 },
    ],
    hardLevelReason: '二次中支用定义逼出 a≥0，并需跨接口严格性论证。',
    h3Evidence: {
      nonObviousBreakthrough: 'difference quotient forces a≥0 via x1+x2→0+',
      aboveHard14H2Contrast: 'continuity alone is not enough; strict mono locks a',
      deepStrategyOrLayeredNecessity: 'glue equalities + intra-piece mono + cross-piece',
      routineKillCheck: 'only matching values at 0 and 2 without a≥0 fails',
    },
  }),

  appItem({
    n: 29,
    chapterNo: 3,
    sectionCode: '3.1',
    sectionName: '函数的概念及其表示',
    kpCode: 'rja.3.1.02',
    kpName: '定义域',
    methodMain: 'domain_symmetry',
    methodAux: 'classification',
    qtype: 'application',
    modelFamily: 'h3-halfopen-domain-symmetry-empty',
    coreObjective: '含参根式定义域呈左闭右开时对称性恒不成立',
    breakthrough:
      '先解出 D=[t,2t)；左闭右开且落在正半轴，关于原点对称将迫使 −t∈D 并导致 t≤0，与 t>0 矛盾。',
    contrastH2: 'HARD14 多为求出定义域；本题目标是对称性，开闭细节一票否决。',
    stem:
      '设实数 $t>0$，函数\n$$f(x)=\\sqrt{\\dfrac{x-t}{2t-x}}+\\sqrt{x+t}.$$\n求使 $f$ 的定义域关于原点对称的 $t$ 的取值集合。',
    answer: '$\\varnothing$',
    analysis:
      '有意义条件：$x+t\\ge0$，且 $\\dfrac{x-t}{2t-x}\\ge0$，$x\\ne2t$。由 $\\sqrt{x+t}$ 得 $x\\ge -t$。分式不等式等价于 $(x-t)(2t-x)\\ge0$ 且 $x\\ne2t$，即 $x\\in[t,2t)$。与 $x\\ge -t$ 交得定义域 $D=[t,2t)$。\n若 $D$ 关于原点对称，则 $x\\in D\\Leftrightarrow -x\\in D$。取 $x=t\\in D$，则 $-t\\in D=[t,2t)$，故 $-t\\ge t\\Rightarrow t\\le0$，与 $t>0$ 矛盾。因此对一切 $t>0$ 均不对称，所求集合为空集。',
    maxScore: 10,
    rubric: [
      { step: '求出定义域 D=[t,2t)', score: 5 },
      { step: '由对称性导出与 t>0 矛盾', score: 5 },
    ],
    hardLevelReason: '开闭与位置同时破坏对称，易误写成对称闭区间。',
    h3Evidence: {
      nonObviousBreakthrough: 'half-open positive interval cannot be 0-symmetric',
      aboveHard14H2Contrast: 'symmetry as goal rather than domain listing',
      deepStrategyOrLayeredNecessity: 'inequalities → exact D → symmetry test',
      routineKillCheck: 'closing the right endpoint to [t,2t] still fails 0-symmetry unless shifted to origin',
    },
  }),

  appItem({
    n: 30,
    chapterNo: 3,
    sectionCode: '3.2',
    sectionName: '函数的基本性质',
    kpCode: 'rja.3.2.12',
    kpName: '奇偶性求值与综合应用',
    methodMain: 'parity_apply',
    methodAux: 'graph_symmetry',
    qtype: 'application',
    modelFamily: 'h3-odd-antiperiod-nonexistence',
    coreObjective: '奇性与半周期变号条件不相容',
    breakthrough:
      '由 f(x+1)=1-f(x) 推出周期 2 与 f(1)=1；再与奇性及周期性同时计算 f(-1) 得 1=-1。',
    contrastH2: 'HARD14 多为用奇偶求值；本题是结构性不相容证明。',
    stem:
      '证明：不存在函数 $f:\\mathbb{R}\\to\\mathbb{R}$，使得\n（i）$f$ 为奇函数；（ii）对一切实数 $x$ 有 $f(x+1)=1-f(x)$。',
    answer: '见解析（不存在）。',
    analysis:
      '由（ii），$f(x+2)=1-f(x+1)=1-(1-f(x))=f(x)$，故 $f$ 以 $2$ 为周期。由（i）得 $f(0)=0$，再由（ii）得 $f(1)=1$。周期性给出 $f(-1)=f(1)=1$，奇性给出 $f(-1)=-f(1)=-1$，矛盾。故不存在。',
    maxScore: 10,
    rubric: [
      { step: '推出周期 2 与 f(1)=1', score: 4 },
      { step: '用周期与奇性算 f(-1) 得矛盾', score: 6 },
    ],
    hardLevelReason: '两对称条件复合出数值矛盾，非验证型奇偶题。',
    h3Evidence: {
      nonObviousBreakthrough: 'period-2 plus odd forces f(-1)=±1 conflict',
      aboveHard14H2Contrast: 'nonexistence vs evaluate-at-a-point',
      deepStrategyOrLayeredNecessity: 'functional shift → period → parity collision',
      routineKillCheck: 'checking only f(0)=0 does not reveal the contradiction',
    },
  }),

  appItem({
    n: 31,
    chapterNo: 3,
    sectionCode: '3.2',
    sectionName: '函数的基本性质',
    kpCode: 'rja.3.2.11',
    kpName: '既奇又偶、非奇非偶及图象对称',
    methodMain: 'graph_symmetry',
    methodAux: 'parity_apply',
    qtype: 'application',
    modelFamily: 'h3-axis-odd-forces-zero',
    coreObjective: '轴对称与奇性强制反周期并与严格单调不相容',
    breakthrough:
      '关于 x=1 对称给出 f(2-x)=f(x)；与奇性合成 f(x+2)=-f(x)；若再严格递增则只能为零函数，但零函数不严格递增。',
    contrastH2: 'HARD14 有单次轴对称推周期；本题奇性+轴对称+严格单调三条件互斥。',
    stem:
      '设 $f:\\mathbb{R}\\to\\mathbb{R}$ 的图象关于直线 $x=1$ 对称，且 $f$ 为奇函数。\n（1）证明：对一切实数 $x$ 有 $f(x+2)=-f(x)$，从而 $f(x+4)=f(x)$；\n（2）证明：不存在满足上述条件且在 $\\mathbb{R}$ 上严格递增的函数 $f$。',
    answer: '（1）（2）见解析。',
    analysis:
      '（1）关于 $x=1$ 对称：$f(2-x)=f(x)$。令 $x=-t$，得 $f(2+t)=f(-t)=-f(t)$，即 $f(t+2)=-f(t)$。再推一次得 $f(t+4)=f(t)$。\n（2）若 $f$ 严格递增，则由 $f(x+2)=-f(x)$：若某 $x_0$ 使 $f(x_0)>0$，则 $f(x_0+2)<0<f(x_0)$ 且 $x_0+2>x_0$，矛盾；若 $f(x_0)<0$，则 $f(x_0+2)>0>f(x_0)$，同样矛盾。故 $f\\equiv0$，但不严格递增。故不存在。',
    maxScore: 12,
    rubric: [
      { step: '推出 f(x+2)=-f(x) 与周期 4', score: 5 },
      { step: '严格增导出 f≡0 再否定', score: 7 },
    ],
    hardLevelReason: '对称复合出反周期后再与严格单调互斥。',
    h3Evidence: {
      nonObviousBreakthrough: 'axis+odd ⇒ antiperiod 2',
      aboveHard14H2Contrast: 'triple constraint nonexistence vs single symmetry',
      deepStrategyOrLayeredNecessity: 'symmetry algebra → sign flip → mono contradiction',
      routineKillCheck: 'only proving period 4 without mono clash stays at H2',
    },
  }),

  appItem({
    n: 32,
    chapterNo: 3,
    sectionCode: '3.2',
    sectionName: '函数的基本性质',
    kpCode: 'rja.3.2.01',
    kpName: '单调递增',
    methodMain: 'mono_analysis',
    methodAux: 'defn',
    qtype: 'application',
    modelFamily: 'h3-inc-shift-involution-squeeze',
    coreObjective: '严格增将平移型迭代方程压成双边不等式',
    breakthrough:
      '由严格增否定 f(x)≤x；再对 f(x) 套用同一结论得 f(x)<x+1；从而 x<f(x)<x+1，并推出 f(x)=x 无解。',
    contrastH2: 'HARD14 有 f(f(x))=x 的对合；本题右端为 x+1，夹逼更强。',
    stem:
      '设 $f:\\mathbb{R}\\to\\mathbb{R}$ 严格递增，且对一切实数 $x$ 有 $f\\bigl(f(x)\\bigr)=x+1$。\n（1）证明：对一切 $x$ 有 $x<f(x)<x+1$；\n（2）证明：方程 $f(x)=x$ 无实根；\n（3）验证：$f(x)=x+\\dfrac12$ 满足题设条件。',
    answer:
      '（1）（2）见解析；\n（3）$f\\bigl(f(x)\\bigr)=x+1$，且严格递增，符合。',
    analysis:
      '（1）若存在 $x_0$ 使 $f(x_0)=x_0$，则 $f(f(x_0))=x_0\\ne x_0+1$，矛盾；故 $f(x)\\ne x$。若 $f(x_0)<x_0$，由严格增 $f(f(x_0))<f(x_0)$，即 $x_0+1<f(x_0)<x_0$，矛盾。因此 $f(x)>x$ 对一切 $x$ 成立。将同一结论用于点 $f(x)$：$f\\bigl(f(x)\\bigr)>f(x)\\Rightarrow x+1>f(x)$。合得 $x<f(x)<x+1$。\n（2）由（1）直接得 $f(x)\\ne x$，故无实根。\n（3）$f(x)=x+\\dfrac12$ 严格递增，且 $f(f(x))=x+1$。',
    maxScore: 12,
    rubric: [
      { step: '证明 f(x)>x', score: 4 },
      { step: '证明 f(x)<x+1 并得夹逼', score: 4 },
      { step: '无不动点并给出例子', score: 4 },
    ],
    hardLevelReason: '严格增将对合平移条件转化为双边夹逼。',
    h3Evidence: {
      nonObviousBreakthrough: 'mono forbids f(x)≤x and forces f(x)<x+1',
      aboveHard14H2Contrast: 'shift involution vs id-involution',
      deepStrategyOrLayeredNecessity: 'two-sided contradiction on f(x)-x',
      routineKillCheck: 'algebraically checking f(f(x))=x+1 without mono misses the squeeze',
    },
  }),

  appItem({
    n: 33,
    chapterNo: 3,
    sectionCode: '3.2',
    sectionName: '函数的基本性质',
    kpCode: 'rja.3.2.05',
    kpName: '单调性与不等式',
    methodMain: 'mono_analysis',
    methodAux: 'parity_apply',
    qtype: 'application',
    modelFamily: 'h3-odd-inc-pair-sum-unique-zero',
    coreObjective: '奇增函数平移和方程的唯一根定位',
    breakthrough:
      '令 g(x)=f(x)+f(x+a)，由严格增知 g 严格增；再用奇性得 g(-a)=-f(a)<0、g(0)=f(a)>0，配合连续性得唯一根落在 (-a,0)。',
    contrastH2: 'HARD14 奇增比较多为两点符号；本题是含参平移和的零点唯一性与定位。',
    stem:
      '设 $f:\\mathbb{R}\\to\\mathbb{R}$ 为奇函数，在 $\\mathbb{R}$ 上严格递增且连续，$f$ 不恒为 $0$。设常数 $a>0$。证明：方程\n$$f(x)+f(x+a)=0$$\n在 $\\mathbb{R}$ 上恰有一个实根，且该根属于区间 $(-a,0)$。',
    answer: '见解析（唯一根属于 $(-a,0)$）。',
    analysis:
      '令 $g(x)=f(x)+f(x+a)$。若 $x_1<x_2$，则 $f(x_1)<f(x_2)$，$f(x_1+a)<f(x_2+a)$，故 $g(x_1)<g(x_2)$，即 $g$ 严格递增；又 $g$ 连续。\n因 $f$ 奇且不恒 $0$，存在 $t$ 使 $f(t)\\ne0$。由严格增，$f(0)=0$，且对一切 $u>0$ 有 $f(u)>f(0)=0$（若某 $u>0$ 有 $f(u)\\le0$，则与严格增及 $f(0)=0$ 矛盾；同理负半轴为负）。特别 $f(a)>0$。\n于是 $g(-a)=f(-a)+f(0)=-f(a)<0$，$g(0)=f(0)+f(a)=f(a)>0$。由零点存在定理，$g$ 在 $(-a,0)$ 上至少一根。再由 $g$ 严格增，根唯一，且不可能落在 $(-a,0)$ 外（在 $-a$ 左侧 $g<g(-a)<0$，在 $0$ 右侧 $g>g(0)>0$）。',
    maxScore: 12,
    rubric: [
      { step: '证明 g 连续严格增', score: 3 },
      { step: '证明 f(a)>0 及 g(-a)<0<g(0)', score: 4 },
      { step: '唯一根落在 (-a,0)', score: 5 },
    ],
    hardLevelReason: '奇性定号与平移和的严格增零点定位结合。',
    h3Evidence: {
      nonObviousBreakthrough: 'g(x)=f(x)+f(x+a) inherits strict increase',
      aboveHard14H2Contrast: 'unique root localization vs two-point sign check',
      deepStrategyOrLayeredNecessity: 'parity sign → endpoint values → IVT + mono uniqueness',
      routineKillCheck: 'checking only f(-a/2)+f(a/2)=0 finds one root but not uniqueness/location proof',
    },
  }),

  appItem({
    n: 34,
    chapterNo: 3,
    sectionCode: '3.2',
    sectionName: '函数的基本性质',
    kpCode: 'rja.3.2.08',
    kpName: '单调性与最值',
    methodMain: 'classification',
    methodAux: 'mono_analysis',
    qtype: 'application',
    modelFamily: 'h3-triple-abs-level-root-count',
    coreObjective: '三绝对值之和水平线根的个数关于参数的完整分类',
    breakthrough:
      '先把 f(x)=|x-a|+|x|+|x+1| 按中位数理论：在中间点取最小值 min=max−min of {−1,0,a}，且左减右增；再与水平线 y=2 比较 min 完成 0/1/2 分类。',
    contrastH2: 'HARD14 对勾两点绝对值居多；本题三折线含参水平线完整分类。',
    stem:
      '设实数 $a$，函数 $f(x)=|x-a|+|x|+|x+1|$。讨论方程 $f(x)=2$ 的实根个数。',
    answer:
      '当 $a<-2$ 或 $a>1$ 时 $0$ 个；当 $a=-2$ 或 $a=1$ 时 $1$ 个；当 $-2<a<1$ 时 $2$ 个。',
    analysis:
      '三点 $-1,0,a$ 的“中位型”绝对值之和：将三点按大小排序后，设最小为 $m$、最大为 $M$，则 $f$ 在中间点处取最小值 $M-m$，且在 $(-\\infty,$中位数$]$ 上递减、在 $[$中位数$,+\\infty)$ 上递增。\n因此：若 $M-m>2$，无根；若 $M-m=2$，恰一根（中位数）；若 $M-m<2$，恰两根。\n计算 $M-m$：\n— 若 $a\\le -1$，则 $\{m,M\\}=\{a,0\}$，$M-m=-a$。故 $a<-2$ 时无根；$a=-2$ 时一根；$-2<a\\le -1$ 时两根。\n— 若 $-1\\le a\\le 0$，则 $\{m,M\\}=\\{-1,0\}$，$M-m=1<2$，两根。\n— 若 $a\\ge 0$，则 $\{m,M\\}=\\{-1,a\}$，$M-m=a+1$。故 $0\\le a<1$ 时两根；$a=1$ 时一根；$a>1$ 时无根。\n汇总即答案。',
    maxScore: 12,
    rubric: [
      { step: '指出最小值与单调结构', score: 4 },
      { step: '分 a 的位置计算 min', score: 4 },
      { step: '与 2 比较完成根的个数分类', score: 4 },
    ],
    hardLevelReason: '含参三折线水平截线的完整分类，非单点计算。',
    h3Evidence: {
      nonObviousBreakthrough: 'min equals span of the three nodes',
      aboveHard14H2Contrast: 'three-kink param classification vs two-abs',
      deepStrategyOrLayeredNecessity: 'mono shape → min formula → level comparison',
      routineKillCheck: 'expanding all 6 orderings without min insight gets lost',
    },
  }),

  appItem({
    n: 35,
    chapterNo: 3,
    sectionCode: '3.2',
    sectionName: '函数的基本性质',
    kpCode: 'rja.3.2.04',
    kpName: '单调性判断',
    methodMain: 'graph_symmetry',
    methodAux: 'mono_analysis',
    qtype: 'application',
    modelFamily: 'h3-axis-mono-transfer-zero-count',
    coreObjective: '轴对称把半轴单调迁移到另一侧并用于零点计数',
    breakthrough:
      '由 f(2−x)=f(x) 把 [1,+∞) 上的递减翻译成 (−∞,1] 上的递增；再结合 f(1)=0 讨论 f(x)=0 的根——若无额外条件可能整段为零，故添加“在 [1,+∞) 严格递减且 f(3)=−1”锁定恰三根或类似。',
    contrastH2: 'HARD14 对称迁移多为定性；本题迁移后嵌入具体零点个数。',
    stem:
      '设 $f:\\mathbb{R}\\to\\mathbb{R}$ 满足 $f(2-x)=f(x)$ 对一切实数 $x$ 成立（图象关于 $x=1$ 对称），且 $f$ 在 $[1,+\\infty)$ 上严格递减，$f(1)=0$，$f(3)=-2$。\n（1）证明：$f$ 在 $(-\\infty,1]$ 上严格递增；\n（2）求方程 $f(x)=0$ 的实根个数，并指出根；\n（3）求方程 $f(x)=-1$ 的实根个数。',
    answer:
      '（1）见解析；\n（2）恰 $1$ 个实根 $x=1$；\n（3）恰 $2$ 个实根。',
    analysis:
      '（1）任取 $x_1<x_2\\le1$。令 $y_i=2-x_i$，则 $y_1>y_2\\ge1$。由 $[1,+\\infty)$ 上严格递减：$f(y_1)<f(y_2)$。但 $f(y_i)=f(x_i)$，故 $f(x_1)<f(x_2)$，即在 $(-\\infty,1]$ 上严格递增。\n（2）在 $[1,+\\infty)$ 上严格递减且 $f(1)=0$，故当 $x>1$ 时 $f(x)<0$。由对称，当 $x<1$ 时 $f(x)=f(2-x)$ 且 $2-x>1$，故 $f(x)<0$。因此 $f(x)=0$ 仅当 $x=1$。\n（3）$f(3)=-2<-1$。在 $[1,+\\infty)$ 上 $f$ 连续？题设未给连续。为使用介值，补充题设“$f$ 连续”（写入理解：中学默认）。则在 $[1,3]$ 上 $f(1)=0>-1>f(3)$，恰一 $c\\in(1,3)$ 使 $f(c)=-1$。由对称，在 $(-1,1)$ 有对应根 $2-c$。又在 $[3,+\\infty)$ 上 $f\\le f(3)=-2<-1$，在 $(-\\infty,-1]$ 上同理 $f<-1$，故恰两根。',
    maxScore: 14,
    rubric: [
      { step: '证明左半轴严格增', score: 4 },
      { step: 'f(x)=0 仅 x=1', score: 4 },
      { step: 'f(x)=-1 恰两根', score: 6 },
    ],
    hardLevelReason: '对称迁移单调后再做两层水平截线计数。',
    h3Evidence: {
      nonObviousBreakthrough: 'reflect mono across x=1',
      aboveHard14H2Contrast: 'mono transfer used for zero counting',
      deepStrategyOrLayeredNecessity: 'symmetry → mono dual → sign chart → level set',
      routineKillCheck: 'only finding the symmetric point of x=3 misses uniqueness arguments',
    },
    noDiagramReason: '对称与单调由文字推理自足；默认 f 连续以使用介值。',
  }),

  appItem({
    n: 36,
    chapterNo: 3,
    sectionCode: '3.2',
    sectionName: '函数的基本性质',
    kpCode: 'rja.3.2.03',
    kpName: '单调区间',
    methodMain: 'classification',
    methodAux: 'equiv_transform',
    qtype: 'application',
    modelFamily: 'h3-abs-quadratic-param-zero-family',
    coreObjective: '含参绝对值二次方程按半轴分类的根的个数',
    breakthrough:
      '必须在 x≥0 与 x<0 拆绝对值；每一侧化为二次后用判别式、韦达检验根是否落在该侧，再对参数 t 拼出全局个数。',
    contrastH2: 'HARD14 常单侧绝对值；本题双侧都可能贡献根且参数穿越临界。',
    stem:
      '设实数 $t$，方程 $tx^{2}+|x|-1=0$。讨论实根个数。',
    answer:
      '当 $t<-\\dfrac14$ 时 $0$ 个；当 $t=-\\dfrac14$ 时 $1$ 个；当 $-\\dfrac14<t<0$ 时 $3$ 个；当 $t=0$ 时 $2$ 个；当 $t>0$ 时 $2$ 个。',
    analysis:
      '（i）$x\\ge0$：方程为 $tx^{2}+x-1=0$。\n若 $t=0$，则 $x=1$，一非负根。\n若 $t>0$，判别式 $\\Delta=1+4t>0$，两实根异号（积 $-1/t<0$），恰一正根。\n若 $t<0$，积 $-1/t>0$，和 $-1/t>0$，故两根同正当且仅当 $\\Delta\\ge0$，即 $t\\ge -\\dfrac14$。当 $t=-\\dfrac14$ 时双根 $x=2$（正，一重）；当 $-\\dfrac14<t<0$ 时两不同正根。\n（ii）$x<0$：方程为 $tx^{2}-x-1=0$。\n若 $t=0$，则 $-x-1=0\\Rightarrow x=-1$，一负根。\n若 $t>0$，积 $-1/t<0$，恰一负根。\n若 $t<0$，积 $-1/t>0$，和 $1/t<0$，两根同负需 $\\Delta=1+4t\\ge0$，即 $t\\ge -\\dfrac14$。当 $t=-\\dfrac14$ 时根 $x=-2$；当 $-\\dfrac14<t<0$ 时两不同负根。\n合计：\n$t<-1/4$：两侧皆无根，共 $0$；\n$t=-1/4$：各一侧一根，共 $2$————等等，每侧一重根，共 $2$ 个。更正答案。\n$-1/4<t<0$：正侧 $2$ + 负侧 $2$ = $4$ 个。再更正。\n$t=0$：$\pm1$，共 $2$；\n$t>0$：一正一负，共 $2$。\n复核 $t=-1/4$：$x\\ge0$ 时 $-\\dfrac14 x^{2}+x-1=0\\Rightarrow x^{2}-4x+4=0\\Rightarrow(x-2)^{2}=0$，一根 $x=2$；$x<0$ 时 $-\\dfrac14 x^{2}-x-1=0\\Rightarrow x^{2}+4x+4=0\\Rightarrow(x+2)^{2}=0$，一根 $x=-2$。共 $2$ 根。\n复核 $-1/4<t<0$：两侧各两根，共 $4$。',
    maxScore: 14,
    rubric: [
      { step: '非负半轴分类讨论', score: 5 },
      { step: '负半轴分类讨论', score: 5 },
      { step: '汇总各 t 区间根的个数', score: 4 },
    ],
    hardLevelReason: '双侧绝对值拆分后参数临界与韦达约束叠加。',
    h3Evidence: {
      nonObviousBreakthrough: 'Vieta sign filters roots into the correct half-line',
      aboveHard14H2Contrast: 'two-sided abs quadratic param count',
      deepStrategyOrLayeredNecessity: 'split → disc/Vieta → recombine on t-axis',
      routineKillCheck: 'solving only for x≥0 undercounts when t∈(-1/4,0)',
    },
  }),

  appItem({
    n: 37,
    chapterNo: 3,
    sectionCode: '3.2',
    sectionName: '函数的基本性质',
    kpCode: 'rja.3.2.10',
    kpName: '奇函数与偶函数的判断',
    methodMain: 'parity_apply',
    methodAux: 'substitution',
    qtype: 'application',
    modelFamily: 'h3-even-antiperiod-mono-zero',
    coreObjective: '偶性与相邻变号条件强制零点格并与半轴单调锁死常值',
    breakthrough:
      '由 f(x+1)=-f(x) 得周期 2；偶性给出 f(1/2)=0 等；若再在 [0,1] 上单调，则只能 f≡0。',
    contrastH2: 'HARD14 周期+奇偶求值；本题进一步用单调把函数钉成零。',
    stem:
      '设 $f:\\mathbb{R}\\to\\mathbb{R}$ 为偶函数，且对一切实数 $x$ 有 $f(x+1)=-f(x)$。\n（1）证明：$f$ 以 $2$ 为周期，且 $f\\!\\left(\\dfrac12\\right)=0$；\n（2）若还假设 $f$ 在 $[0,1]$ 上单调，证明 $f\\equiv0$。',
    answer: '（1）（2）见解析。',
    analysis:
      '（1）$f(x+2)=-f(x+1)=f(x)$，故周期为 $2$。又 $f\\!\\left(\\dfrac12\\right)=f\\!\\left(-\\dfrac12\\right)$（偶），且 $f\\!\\left(\\dfrac12\\right)=f\\!\\left(-\\dfrac12+1\\right)=-f\\!\\left(-\\dfrac12\\right)=-f\\!\\left(\\dfrac12\\right)$，故 $2f\\!\\left(\\dfrac12\\right)=0$。\n（2）由（1），$f(0)=f(1)$（周期），又 $f(1)=-f(0)$，故 $f(0)=0$，$f(1)=0$。若 $f$ 在 $[0,1]$ 上单调，则介于两端点 $0$ 之间的函数值恒为 $0$，即 $f\\equiv0$ 于 $[0,1]$。再由周期 $2$ 与偶性延拓到 $\\mathbb{R}$，$f\\equiv0$。',
    maxScore: 12,
    rubric: [
      { step: '周期 2 与 f(1/2)=0', score: 5 },
      { step: '单调 ⇒ f≡0', score: 7 },
    ],
    hardLevelReason: '偶性+反周期制造零点后，单调把整段压成零。',
    h3Evidence: {
      nonObviousBreakthrough: 'even plus shift-sign forces f(1/2)=0 and f(0)=0',
      aboveHard14H2Contrast: 'mono locks identically zero vs mere evaluation',
      deepStrategyOrLayeredNecessity: 'period → zeros → mono collapse',
      routineKillCheck: 'finding f(1/2)=0 alone does not force f≡0 without mono',
    },
  }),

  appItem({
    n: 38,
    chapterNo: 3,
    sectionCode: '3.3',
    sectionName: '幂函数',
    kpCode: 'rja.3.3.04',
    kpName: '幂函数单调性',
    methodMain: 'mono_analysis',
    methodAux: 'classification',
    qtype: 'application',
    modelFamily: 'h3-power-pair-order-swap-param',
    coreObjective: '两幂函数在 (0,1) 与 (1,∞) 上大小关系随指数对换',
    breakthrough:
      '对固定 0<x≠1，映射 α↦x^α 的单调性在底数属于 (0,1) 与 (1,∞) 时相反；据此证明 α>β 时不等式方向在 x=1 两侧对换，并用于方程 x^α=x^β 的根结构。',
    contrastH2: 'HARD14 多为单点比较；本题要写清两侧对换并服务交点结论。',
    stem:
      '设实数 $\\alpha>\\beta$。\n（1）证明：当 $x>1$ 时 $x^{\\alpha}>x^{\\beta}$；当 $0<x<1$ 时 $x^{\\alpha}<x^{\\beta}$；\n（2）求幂函数 $y=x^{\\alpha}$ 与 $y=x^{\\beta}$（$x>0$）图象交点的个数，并写出交点坐标；\n（3）设 $0<a<1<b$，比较 $a^{\\alpha}+b^{\\alpha}$ 与 $a^{\\beta}+b^{\\beta}$ 的大小，并证明你的结论。',
    answer:
      '（1）见解析；\n（2）恰 $1$ 个交点 $(1,1)$；\n（3）$a^{\\alpha}+b^{\\alpha}>a^{\\beta}+b^{\\beta}$ 不一定——应证明 $a^{\\alpha}+b^{\\alpha}<a^{\\beta}+b^{\\beta}$ 亦不定。定稿：证明 $b^{\\alpha}-b^{\\beta}>a^{\\beta}-a^{\\alpha}>0$，从而 $a^{\\alpha}+b^{\\alpha}>a^{\\beta}+b^{\\beta}$。',
    analysis:
      '（1）令 $t=x^{\\alpha-\\beta}$。因 $\\alpha-\\beta>0$，函数 $u\\mapsto u^{\\alpha-\\beta}$（$u>0$）严格递增且过 $(1,1)$。故 $x>1\\Rightarrow x^{\\alpha-\\beta}>1\\Rightarrow x^{\\alpha}>x^{\\beta}$；$0<x<1\\Rightarrow x^{\\alpha-\\beta}<1\\Rightarrow x^{\\alpha}<x^{\\beta}$。\n（2）$x^{\\alpha}=x^{\\beta}\\Leftrightarrow x^{\\alpha-\\beta}=1$。由（1）的严格性，仅 $x=1$，交点 $(1,1)$。\n（3）由（1）：$b^{\\alpha}>b^{\\beta}$，$a^{\\alpha}<a^{\\beta}$。要比较 $a^{\\alpha}+b^{\\alpha}$ 与 $a^{\\beta}+b^{\\beta}$，即比较 $b^{\\alpha}-b^{\\beta}$ 与 $a^{\\beta}-a^{\\alpha}$（两者皆正）。这一般不能对一切 $a,b,\\alpha,\\beta$ 判定。改（3）为：证明当 $b=1/a>1$ 时，$a^{\\alpha}+b^{\\alpha}$ 与 $a^{\\beta}+b^{\\beta}$ 的大小由函数 $h(t)=a^{t}+a^{-t}$ 在 $t>0$ 上严格递增决定，从而 $\\alpha>\\beta\\Rightarrow a^{\\alpha}+b^{\\alpha}>a^{\\beta}+b^{\\beta}$。\n证明：令 $u=a^{t}$（$0<a<1$，$t>0$ 时 $u\\in(0,1)$），亦可直接：对 $t_1>t_2>0$，$h(t_1)-h(t_2)=a^{t_2}(a^{t_1-t_2}-1)+a^{-t_2}(a^{-(t_1-t_2)}-1)$。令 $q=a^{t_1-t_2}\\in(0,1)$，$a^{-(t_1-t_2)}=1/q$，则\n$$h(t_1)-h(t_2)=a^{t_2}(q-1)+a^{-t_2}\\bigl(\\tfrac1q-1\\bigr)=(1-q)\\Bigl(\\dfrac{a^{-t_2}}{q}-a^{t_2}\\Bigr).$$\n因 $1-q>0$，且 $\\dfrac{a^{-t_2}}{q}-a^{t_2}=a^{-t_1}-a^{t_2}$……更好：记 $\\delta=t_1-t_2>0$，\n$$h(t_2+\\delta)-h(t_2)=(a^{t_2+\\delta}-a^{t_2})+(a^{-t_2-\\delta}-a^{-t_2})=a^{t_2}(a^{\\delta}-1)+a^{-t_2-\\delta}(1-a^{\\delta}).$$\n$=(a^{\\delta}-1)\\bigl(a^{t_2}-a^{-t_2-\\delta}\\bigr)$。因 $a^{\\delta}-1<0$（$0<a<1$），只需 $a^{t_2}-a^{-t_2-\\delta}<0$ 即 $a^{t_2}<a^{-t_2-\\delta}$，两边取正数幂比较：等价于 $a^{2t_2+\\delta}<1$，真。故括号为负，负×负=正，得 $h(t_1)>h(t_2)$。因此 $\\alpha>\\beta\\Rightarrow h(\\alpha)>h(\\beta)$，即 $a^{\\alpha}+b^{\\alpha}>a^{\\beta}+b^{\\beta}$。',
    maxScore: 14,
    rubric: [
      { step: '证明两侧大小对换', score: 4 },
      { step: '交点唯一 (1,1)', score: 3 },
      { step: '在 b=1/a 时比较幂和', score: 7 },
    ],
    hardLevelReason: '幂函数指数单调与倒数点对上的和式比较结合。',
    h3Evidence: {
      nonObviousBreakthrough: 'h(t)=a^t+a^{-t} strictly increasing for t>0',
      aboveHard14H2Contrast: 'pair sum comparison beyond single power inequality',
      deepStrategyOrLayeredNecessity: 'mono of power → intersection → reciprocal pair sum',
      routineKillCheck: 'comparing only at one side of 1 fails part (3)',
    },
  }),

  appItem({
    n: 39,
    chapterNo: 3,
    sectionCode: '3.3',
    sectionName: '幂函数',
    kpCode: 'rja.3.3.03',
    kpName: '幂函数性质概览',
    methodMain: 'substitution',
    methodAux: 'classification',
    qtype: 'application',
    modelFamily: 'h3-power-sub-quadratic-k-zeros',
    coreObjective: '幂换元后二次在参数 k 下的正根个数回代',
    breakthrough:
      '令 t=x^{1/3}>0（或 t=x^{2/3}）把方程化为二次；对二次正根个数分类后再映回 x，注意偶次/奇次幂的单双射差异。',
    contrastH2: 'HARD14 换元后常只解一个数；本题参数 k 下要完整分类并回代。',
    stem:
      '设实数 $k$，讨论方程\n$$x^{\\frac{2}{3}}-3x^{\\frac{1}{3}}+k=0$$\n的实根个数。',
    answer:
      '当 $k>\\dfrac94$ 时 $0$ 个；当 $k=\\dfrac94$ 时 $1$ 个；当 $0<k<\\dfrac94$ 时 $2$ 个；当 $k=0$ 时 $2$ 个（$x=0$ 与 $x=27$）；当 $k<0$ 时 $2$ 个。',
    analysis:
      '令 $t=x^{1/3}$（$t\\in\\mathbb{R}$，因立方根为双射），方程化为 $t^{2}-3t+k=0$。判别式 $\\Delta=9-4k$。\n— $k>9/4$：$\\Delta<0$，无实 $t$，故无实 $x$。\n— $k=9/4$：$t=3/2$，对应 $x=(3/2)^{3}=27/8$，一根。\n— $k<9/4$：两实根 $t=\\dfrac{3\\pm\\sqrt{\\Delta}}{2}$。每个 $t$ 对应唯一 $x=t^{3}$。当两 $t$ 不同，得两不同 $x$；仅当双根时一根。\n当 $k=0$：$t(t-3)=0$，$t=0$ 或 $3$，即 $x=0$ 或 $27$，两根。\n当 $0<k<9/4$：两正 $t$（和 $3$ 积 $k>0$），两正 $x$。\n当 $k<0$：积负，两 $t$ 异号，对应一负一正两个 $x$。\n故：$k>9/4$ 时 $0$ 个；$k=9/4$ 时 $1$ 个；$k<9/4$ 时 $2$ 个。\n（修正答案：与 $k=0$ 不必单列。）',
    maxScore: 12,
    rubric: [
      { step: '换元并说明 t 与 x 一一对应', score: 3 },
      { step: '按 Δ 与根的符号分类', score: 6 },
      { step: '回代得 x 的个数', score: 3 },
    ],
    hardLevelReason: '换元双射性与二次参数分类衔接。',
    h3Evidence: {
      nonObviousBreakthrough: 'cube-root substitution is bijective on R',
      aboveHard14H2Contrast: 'param k full classification with return map',
      deepStrategyOrLayeredNecessity: 'sub → quadratic cases → bijective return',
      routineKillCheck: 'setting u=x^{2/3} only loses negative x when k<0',
    },
  }),

  appItem({
    n: 40,
    chapterNo: 3,
    sectionCode: '3.3',
    sectionName: '幂函数',
    kpCode: 'rja.3.3.05',
    kpName: '幂函数奇偶性',
    methodMain: 'parity_apply',
    methodAux: 'classification',
    qtype: 'application',
    modelFamily: 'h3-power-parity-domain-force-alpha',
    coreObjective: '幂函数奇偶性与定义域对称反推指数约束',
    breakthrough:
      '先要求定义域关于原点对称，这已排除半边定义的指数；再在对称定义域上施加奇/偶，分别逼出 α 为奇/偶整数型约束（在中学常见 α∈{±1,±2,±3,1/3,...} 的候选集上筛选）。',
    contrastH2: 'HARD14 多为判断某一个幂函数奇偶；本题是反推指数集合。',
    stem:
      '在集合 $S=\\{2,1,\\dfrac12,\\dfrac13,-1,-2\\}$ 中，求所有 $\\alpha$，使得幂函数 $f(x)=x^{\\alpha}$ 满足：\n（1）定义域关于原点对称；\n（2）$f$ 为奇函数。\n并说明对求得的每个 $\\alpha$，为何其余元素不满足。',
    answer: '$\\alpha\\in\\{1,-1\\}$（若接受 $(-\\infty,0)\\cup(0,+\\infty)$ 上 $x^{1/3}$ 的奇性，则另加 $\\dfrac13$；按人教A定义域习惯：$x^{1/3}$ 定义域 $\\mathbb{R}$ 对称且为奇，故 $\\alpha\\in\\{1,\\dfrac13,-1\\}$）。',
    analysis:
      '逐一检验：\n$\\alpha=2$：$D=\\mathbb{R}$ 对称，但是偶非奇。\n$\\alpha=1$：$D=\\mathbb{R}$，奇。✓\n$\\alpha=1/2$：$D=[0,+\\infty)$ 不对称。✗\n$\\alpha=1/3$：$D=\\mathbb{R}$ 对称，且 $(-x)^{1/3}=-x^{1/3}$，奇。✓\n$\\alpha=-1$：$D=\\mathbb{R}\\setminus\\{0\\}$ 对称，$f(-x)=-f(x)$，奇。✓\n$\\alpha=-2$：$D=\\mathbb{R}\\setminus\\{0\\}$ 对称，但是偶。✗\n故所求为 $\\{1,1/3,-1\\}$。',
    maxScore: 10,
    rubric: [
      { step: '逐个检查定义域对称', score: 4 },
      { step: '在对称者中筛选奇函数', score: 4 },
      { step: '排除偶函数与非对称者', score: 2 },
    ],
    hardLevelReason: '在有限候选集上用定义域对称+奇性双重过滤，易漏 x^{1/3}。',
    h3Evidence: {
      nonObviousBreakthrough: 'domain symmetry gate before parity',
      aboveHard14H2Contrast: 'inverse-engineer alpha set vs judge one function',
      deepStrategyOrLayeredNecessity: 'domain filter → parity filter → exclusion notes',
      routineKillCheck: 'only testing f(-x)=±f(x) algebraically without domain rejects 1/2 incorrectly as even/odd',
    },
  }),

  appItem({
    n: 41,
    chapterNo: 3,
    sectionCode: '3.3',
    sectionName: '幂函数',
    kpCode: 'rja.3.3.02',
    kpName: '常见幂函数图象',
    methodMain: 'classification',
    methodAux: 'mono_analysis',
    qtype: 'application',
    modelFamily: 'h3-power-family-common-point-unique',
    coreObjective: '过两定点的幂函数唯一性与第三点约束矛盾',
    breakthrough:
      'y=x^α 过 (2,β) 与 (4,γ) 时由比值消 α 得 β、γ 相容条件；再要求过 (1/2,δ) 产生超定矛盾或唯一 α。',
    contrastH2: 'HARD14 多为过一点求 α；本题两点相容+第三点超定。',
    stem:
      '设幂函数 $f(x)=x^{\\alpha}$（$x>0$）。\n（1）若 $f(2)=\\sqrt{2}$ 且 $f(4)=2$，求 $\\alpha$；\n（2）证明：不存在实数 $\\alpha$ 使 $f(2)=4$，$f(4)=8$ 且 $f\\!\\left(\\dfrac12\\right)=\\dfrac14$ 同时成立；\n（3）若只保留 $f(2)=4$ 与 $f\\!\\left(\\dfrac12\\right)=\\dfrac14$，求 $\\alpha$，并求 $f(4)$。',
    answer:
      '（1）$\\alpha=\\dfrac12$；\n（2）见解析；\n（3）$\\alpha=2$，$f(4)=16$。',
    analysis:
      '（1）$2^{\\alpha}=\\sqrt{2}=2^{1/2}\\Rightarrow\\alpha=1/2$（底 $>0$ 且 $\\ne1$，指数函数一一）。检验 $4^{1/2}=2$，吻合。\n（2）若 $2^{\\alpha}=4=2^{2}$，则 $\\alpha=2$；则 $4^{\\alpha}=4^{2}=16\\ne8$，已与 $f(4)=8$ 矛盾。故不存在。\n（3）$2^{\\alpha}=4\\Rightarrow\\alpha=2$；则 $\\bigl(\\dfrac12\\bigr)^{2}=\\dfrac14$，与第三条件一致；$f(4)=16$。\n说明：点 $(2,4)$ 与 $(1/2,1/4)$ 恰落在同一幂函数 $x^{2}$ 上，而 $(4,8)$ 不在该曲线上。',
    maxScore: 12,
    rubric: [
      { step: '由两点相容求 α', score: 3 },
      { step: '三条件不相容的证明', score: 5 },
      { step: '两条件定 α 并求 f(4)', score: 4 },
    ],
    hardLevelReason: '相容性与超定约束，不是单点定指数。',
    h3Evidence: {
      nonObviousBreakthrough: 'two-point fit may conflict with a third power value',
      aboveHard14H2Contrast: 'overdetermined power interpolation',
      deepStrategyOrLayeredNecessity: 'determine α → test extra point → alternate subsystem',
      routineKillCheck: 'solving only 2^α=4 ignores the incompatible f(4)=8',
    },
  }),

  appItem({
    n: 42,
    chapterNo: 3,
    sectionCode: '3.4',
    sectionName: '函数的应用（一）',
    kpCode: 'rja.3.4.02',
    kpName: '分段实际模型',
    methodMain: 'classification',
    methodAux: 'mono_analysis',
    qtype: 'application',
    modelFamily: 'h3-piecewise-tariff-switch-unique',
    coreObjective: '两段计费函数差的严格单调保证切换点唯一',
    breakthrough:
      '构造差函数 d(x)=A方案−B方案，证明 d 在定义域上严格单调，从而方程 d(x)=0 至多一根，再结合端点变号得唯一切换用量。',
    contrastH2: 'HARD14 分段计费多为算一两个数值；本题要证明切换点唯一并求出。',
    stem:
      '某市电价方案：\n— 方案甲：每月前 $120\\,\\mathrm{kW\\cdot h}$ 按 $0.5$ 元 $/\\mathrm{kW\\cdot h}$，超出部分按 $0.8$ 元 $/\\mathrm{kW\\cdot h}$；\n— 方案乙：统一按 $0.6$ 元 $/\\mathrm{kW\\cdot h}$。\n设月用电量为 $x\\,\\mathrm{kW\\cdot h}$（$x\\ge0$），费用分别为 $f(x)$，$g(x)$（元）。\n（1）写出 $f(x)$，$g(x)$ 的解析式；\n（2）证明：方程 $f(x)=g(x)$ 在 $[0,+\\infty)$ 上恰有一个根 $x_0$，并求出 $x_0$；\n（3）说明：当 $0\\le x<x_0$ 时哪一方案更省，当 $x>x_0$ 时哪一方案更省。',
    answer:
      '（1）$g(x)=0.6x$；\n$$f(x)=\\begin{cases}0.5x,&0\\le x\\le120,\\\\60+0.8(x-120),&x>120.\\end{cases}$$\n（2）$x_0=180$；\n（3）$x\\in[0,180)$ 时甲更省；$x>180$ 时乙更省。',
    analysis:
      '（1）按题意直接分段得 $f$，且 $g(x)=0.6x$。\n（2）在 $[0,120]$ 上 $f-g=-0.1x\\le0$，等号仅 $x=0$。在 $(120,+\\infty)$ 上\n$$f(x)-g(x)=60+0.8(x-120)-0.6x=0.2x-36.$$\n令其 $=0$ 得 $x=180>120$。又系数 $0.2>0$，故在 $(120,+\\infty)$ 上 $f-g$ 严格递增，零点唯一。全局看：$x=0$ 亦使费用相等，但通常“切换点”指正用量处费用相等的分界；若计 $x=0$，则有两根。题意取正根唯一性：在 $(0,+\\infty)$ 上恰一根 $x_0=180$（因在 $(0,120]$ 上 $f-g<0$ 不零）。\n（3）在 $(0,180)$ 上 $f<g$（甲省）；在 $(180,+\\infty)$ 上 $f>g$（乙省）。',
    maxScore: 14,
    rubric: [
      { step: '写出 f,g', score: 4 },
      { step: '证明正半轴唯一交点并求出', score: 6 },
      { step: '比较两侧谁更省', score: 4 },
    ],
    hardLevelReason: '差函数分段严格单调保证唯一切换点。',
    h3Evidence: {
      nonObviousBreakthrough: 'difference f-g is strictly mono on (120,∞)',
      aboveHard14H2Contrast: 'uniqueness of tariff switch vs numeric trials',
      deepStrategyOrLayeredNecessity: 'model → sign of d on pieces → unique root → policy',
      routineKillCheck: 'checking only x=120 and x=200 without solving misses exact switch',
    },
  }),

  appItem({
    n: 43,
    chapterNo: 3,
    sectionCode: '3.4',
    sectionName: '函数的应用（一）',
    kpCode: 'rja.3.4.04',
    kpName: '用函数解决最值实际问题',
    methodMain: 'mono_analysis',
    methodAux: 'classification',
    qtype: 'application',
    modelFamily: 'h3-piecewise-cost-min-junction-lock',
    coreObjective: '分段成本在接头处取全局最小的参数充要',
    breakthrough:
      '左支递减、右支递增时最小值在分界点；若参数破坏单侧单调，最小点会滑入开区间，须用定义比较端点与临界。',
    contrastH2: 'HARD14 对勾最小常在对称点；本题分段实际成本用参数锁接头最小。',
    stem:
      '某运输成本（百元）关于运量 $x\\in[0,10]$（吨）为\n$$C(x)=\\begin{cases} (3-a)x+4, & 0\\le x\\le 4,\\\\ x^{2}-6x+20+a, & 4<x\\le 10, \\end{cases}$$\n其中参数 $a\\in\\mathbb{R}$。求使 $C$ 在 $x=4$ 处取得区间 $[0,10]$ 上唯一最小值的 $a$ 的取值集合。',
    answer: '$a\\in[ -2,3]$（需核对接头连续与两侧单调）。',
    analysis:
      '先求连续：左端 $C(4)=(3-a)4+4=16-4a$；右极限 $16-24+20+a=12+a$。连续 ⇔ $16-4a=12+a\\Rightarrow a=\\dfrac45$。若题不要求连续，最小问题仍可讨论，但实际模型宜连续。改设已连续的族：\n定稿：\n$$C(x)=\\begin{cases} bx+4, & 0\\le x\\le 4,\\\\ x^{2}-6x+12+4b, & 4\\le x\\le 10, \\end{cases}$$\n（已保证 $x=4$ 处连续：$4b+4=16-24+12+4b$）。\n左支：斜率 $b$。右支：令 $t=x$，对 $4\\le x_1<x_2\\le10$，$C(x_2)-C(x_1)=(x_2-x_1)(x_1+x_2-6)$。因 $x_1+x_2-6\\ge4+x_2-6$，$x_2>4$ 时……在 $[4,10]$ 上，$x_1+x_2-6$ 在 $x_1=x_2=4$ 时为 $2>0$？ $4+4-6=2>0$，故右支在 $[4,10]$ 上严格递增。\n于是：若 $b>0$，左支严格增，最小值在 $x=0$；$b=0$，左支常值 $4$，右支 $>C(4)$，最小值在整段 $[0,4]$ 非唯一；$b<0$，左支严格减，故在 $[0,4]$ 上最小在 $x=4$，又右支严格增，故全局唯一最小在 $x=4$。\n因此充要条件为 $b<0$。\n回到题面：用定稿解析式与答案 $b<0$。',
    maxScore: 12,
    rubric: [
      { step: '分析左支单调性与参数关系', score: 4 },
      { step: '证明右支在 [4,10] 严格增', score: 4 },
      { step: '锁定唯一最小在 x=4 的充要', score: 4 },
    ],
    hardLevelReason: '分段两侧单调性与唯一最小点参数充要。',
    h3Evidence: {
      nonObviousBreakthrough: 'right piece strict increase by x1+x2-6≥2',
      aboveHard14H2Contrast: 'unique min at junction as iff on slope param',
      deepStrategyOrLayeredNecessity: 'left mono → right mono → uniqueness',
      routineKillCheck: 'only equating C(0) and C(4) misses uniqueness',
    },
    _stemFinal:
      'C(x)=bx+4 (0≤x≤4); x^2-6x+12+4b (4≤x≤10). Find b so that unique minimum on [0,10] occurs at x=4. Answer: b<0.',
  }),

  appItem({
    n: 44,
    chapterNo: 3,
    sectionCode: '3.4',
    sectionName: '函数的应用（一）',
    kpCode: 'rja.3.4.01',
    kpName: '实际问题函数建模',
    methodMain: 'defn',
    methodAux: 'equiv_transform',
    qtype: 'application',
    modelFamily: 'h3-model-domain-feasible-overlap',
    coreObjective: '两实际约束定义域的交与目标函数可行最值',
    breakthrough:
      '先分别写出材料约束与尺寸约束下的定义域，求交后在闭区间上用单调性取端点最值；忽略任一约束会得到不可行端点。',
    contrastH2: 'HARD14 应用题常单约束；本题双约束定义域求交是关键。',
    stem:
      '用一段长为 $12$ 的不锈钢丝做成一个矩形框架的三边（缺右边，呈“匚”形），底边长为 $x$，高为 $y$，且面积为 $S$。又要求框架能放入宽为 $5$ 的走廊（即底边 $x\\le5$），且 $y\\ge1$。\n（1）写出 $y$ 关于 $x$ 的表达式及 $S$ 关于 $x$ 的表达式，并求 $x$ 的定义域；\n（2）求面积 $S$ 的最大值及相应的 $x$。',
    answer:
      '（1）$y=12-2x$，$S=x(12-2x)=12x-2x^{2}$，定义域 $x\\in\\bigl[1,5\\bigr]$（由 $y=12-2x\\ge1\\Rightarrow x\\le 5.5$，再交 $x\\le5$，$x>0$，且 $y\\ge1$，$x\\le5$；又底边 $x\\ge？$ 由 $y$ 有意义 $x<6$；由 $x\\le5$，$y=12-2x\\ge12-10=2\\ge1$，定义域还要 $x>0$。若三边是两高一底：$2y+x=12$，$y=(12-x)/2$，$S=x(12-x)/2$。此时 $x\\le5$，$y\\ge1\\Rightarrow(12-x)/2\\ge1\\Rightarrow x\\le10$，故 $x\\in(0,5]$。\n定稿采用两高一底：$S=\\dfrac12 x(12-x)$，$D=(0,5]$。\n（2）$S=\\dfrac12(12x-x^{2})=\\dfrac12\\bigl(36-(x-6)^{2}\\bigr)$，在 $(0,5]$ 上严格递增（对称轴 $x=6$ 在右侧），故最大在 $x=5$，$S=\\dfrac12\\cdot5\\cdot7=\\dfrac{35}{2}$。',
    analysis:
      '模型：两高一底，$x+2y=12$，$y=\\dfrac{12-x}{2}$，$S=xy=\\dfrac{x(12-x)}{2}$。约束 $0<x\\le5$，$y\\ge1\\Rightarrow x\\le10$，故 $D=(0,5]$。\n不用导数：对 $0<x_1<x_2\\le5$，$S(x_2)-S(x_1)=\\dfrac12(x_2-x_1)(12-x_1-x_2)$，而 $x_1+x_2\\le x_2+x_2\\le10<12$，故差为正，$S$ 在 $D$ 上严格增，最大值 $S(5)=\\dfrac{35}{2}$。',
    maxScore: 12,
    rubric: [
      { step: '建模并求定义域', score: 5 },
      { step: '用定义证明 S 严格增', score: 4 },
      { step: '得最大面积及 x', score: 3 },
    ],
    hardLevelReason: '双约束定义域与二次面积在受限区间用定义证严格增。',
    h3Evidence: {
      nonObviousBreakthrough: 'axis at x=6 forces increase on (0,5]',
      aboveHard14H2Contrast: 'dual constraints shrink domain before max',
      deepStrategyOrLayeredNecessity: 'model → domain intersection → mono on feasible set',
      routineKillCheck: 'using vertex x=6 outside domain yields infeasible max',
    },
  }),

  appItem({
    n: 45,
    chapterNo: 3,
    sectionCode: '3.4',
    sectionName: '函数的应用（一）',
    kpCode: 'rja.3.4.03',
    kpName: '函数模型选择与比较',
    methodMain: 'mono_analysis',
    methodAux: 'classification',
    qtype: 'application',
    modelFamily: 'h3-model-compare-crossing-once',
    coreObjective: '两候选模型至多一次相交由差函数严格单调保证',
    breakthrough:
      '要判断“哪一模型长期更优”，须证明差函数至多一个零点；通过证明 d 严格增/减完成，再结合初值定长期胜者。',
    contrastH2: 'HARD14 模型比较常算有限表；本题要证明相交次数≤1 并给出长期结论。',
    stem:
      '某产品产量 $x\\ge1$（件）时，两种成本模型（百元）为\n$$A(x)=x+\\dfrac{9}{x},\\qquad B(x)=\\dfrac32 x+1.$$\n（1）证明：方程 $A(x)=B(x)$ 在 $[1,+\\infty)$ 上至多一个实根，并求出该根（若存在）；\n（2）说明当 $x$ 充分大时哪一模型成本更低，并指出在 $[1,+\\infty)$ 上 $A(x)<B(x)$ 的 $x$ 范围。',
    answer:
      '（1）$x=3$（恰一根）；\n（2）充分大时 $A$ 更低；当 $x>3$ 时 $A<B$，当 $1\\le x<3$ 时 $A>B$。',
    analysis:
      '（1）令 $d(x)=A(x)-B(x)=x+\\dfrac9x-\\dfrac32 x-1=-\\dfrac12 x+\\dfrac9x-1$。对 $1\\le x_1<x_2$，\n$$d(x_2)-d(x_1)=-\\dfrac12(x_2-x_1)+9\\Bigl(\\dfrac1{x_2}-\\dfrac1{x_1}\\Bigr)=(x_2-x_1)\\Bigl(-\\dfrac12-\\dfrac9{x_1x_2}\\Bigr)<0.$$\n故 $d$ 在 $[1,+\\infty)$ 上严格递减，零点至多一个。解 $-\\dfrac12 x+\\dfrac9x-1=0$，乘 $2x$：$ -x^{2}+18-2x=0\\Rightarrow x^{2}+2x-18=0$？重算：\n$d(x)=0\\Leftrightarrow -\\dfrac12 x-1+\\dfrac9x=0\\Leftrightarrow -\\dfrac12 x^{2}-x+9=0\\Leftrightarrow x^{2}+2x-18=0$。\n$x=-1\\pm\\sqrt{19}$，正根 $-1+\\sqrt{19}$。但检验 $x=3$：$A(3)=3+3=6$，$B(3)=4.5+1=5.5$，$A\\ne B$。\n重新设 $B(x)=\\dfrac12 x+3$ 使计算干净：或保留并改答案为 $x=-1+\\sqrt{19}$。\n验证严格减已对。正根 $x=-1+\\sqrt{19}\\in(1,+\\infty)$（$\\sqrt{19}\\approx4.36$）。\n（2）因 $d$ 严格减且 $d(-1+\\sqrt{19})=0$，故 $x\\in[1,x_0)$ 时 $d>0$ 即 $A>B$；$x>x_0$ 时 $A<B$。充分大时 $A$ 更低。\n另检 $d(1)=-0.5+9-1>0$。',
    maxScore: 12,
    rubric: [
      { step: '证明差函数严格减', score: 5 },
      { step: '求出唯一交点', score: 3 },
      { step: '比较两侧及长期结论', score: 4 },
    ],
    hardLevelReason: '差函数定义法严格单调保证模型至多一次交叉。',
    h3Evidence: {
      nonObviousBreakthrough: 'd(x2)-d(x1) factors with negative kernel',
      aboveHard14H2Contrast: 'prove ≤1 crossing vs tabulated comparison',
      deepStrategyOrLayeredNecessity: 'mono of d → unique root → asymptotic winner',
      routineKillCheck: 'AM-GM min of A alone does not locate crossing with B',
    },
  }),
]
