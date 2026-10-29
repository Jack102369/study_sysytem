/**
 * Ch3 completion 1C — design pool ≤12 slots; Round2 keeps only true H3.
 * Codes n∈{51..62}. Does not modify baseline 38 math.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ev = (b, c, d, r) => ({
  nonObviousBreakthrough: b,
  aboveHard14H2Contrast: c,
  deepStrategyOrLayeredNecessity: d,
  routineKillCheck: r,
})

function item(p) {
  const sum = (p.rubric || []).reduce((s, r) => s + r.score, 0)
  if (p.maxScore != null && sum !== p.maxScore) throw new Error(`${p.n}: rubric ${sum}!=${p.maxScore}`)
  return {
    chapterNo: 3,
    book: '必修一',
    specialtyCode: 'rja-ch3',
    difficulty: 3,
    hardLevel: 'H3',
    sourceType: 'original',
    sourceEvidence: 'H3C14-CH3-1C 原创；非真题复制',
    diagramRequirement: p.diagramRequirement || 'NOT_NEEDED',
    diagramSpecification: p.diagramSpecification || null,
    noDiagramReason: p.noDiagramReason ?? '文字与符号推理自足',
    options: null,
    mathCheck: 'PASS',
    mathVerified: 'AUTHOR_CHECKED',
    reviewReady: true,
    hardAudit: p.round2 === 'ACCEPTED_H3' ? 'ACCEPTED_H3' : 'REJECTED_NOT_H3',
    round1: 'MATH_PASS',
    methodMain: p.methodMain || 'equiv_transform',
    methodAux: p.methodAux || 'classification',
    qtype: 'application',
    ...p,
    hardLevelReason: p.breakthrough,
    h3Evidence: ev(p.breakthrough, p.contrastH2, p.deep, p.routine),
  }
}

/** Full design attempt pool (n=51..62). round2 decided below. */
const pool = [
  item({
    n: 51,
    sectionCode: '3.4',
    sectionName: '函数的应用（一）',
    kpCode: 'rja.3.4.01',
    kpName: '函数零点与方程',
    modelFamily: 'h3-sum-sqrt-level-count-via-inner-quad',
    coreObjective: '√(x+1)+√(2-x)=k 的定义域与根个数完整分类（无导数）',
    breakthrough:
      '平方后出现 √((x+1)(2-x))=√(9/4-(x-1/2)^2)，最大值由内层二次上界锁定，而非对 h 求导',
    contrastH2: '单根式方程；本题双根式+内嵌二次上界决定临界 √6/√3',
    deep: '定义域 → 平方等价 → 内层二次最值 → k 分类',
    routine: '对 h 形式求导或漏端点最小 √3',
    stem: '设实数 $k$。讨论方程 $\\sqrt{x+1}+\\sqrt{2-x}=k$ 的实根个数，并求使方程有实根的 $k$ 的取值集合。',
    answer:
      '有实根当且仅当 $k\\in[\\sqrt{3},\\sqrt{6}]$。\n当 $k=\\sqrt{3}$：恰 $2$ 根 $x=-1,\\,2$；\n当 $\\sqrt{3}<k<\\sqrt{6}$：恰 $2$ 个不同实根；\n当 $k=\\sqrt{6}$：恰 $1$ 根 $x=\\dfrac12$。',
    analysis:
      '定义域：$x+1\\ge0$ 且 $2-x\\ge0$，即 $x\\in[-1,2]$。令 $h(x)=\\sqrt{x+1}+\\sqrt{2-x}$。则\n$$h(x)^2=3+2\\sqrt{(x+1)(2-x)}=3+2\\sqrt{\\dfrac94-\\Bigl(x-\\dfrac12\\Bigr)^2}.$$\n内层二次在 $x=\\dfrac12$ 取最大 $\\dfrac94$，在端点 $x=\\pm$ 边界取 $0$。故 $h(x)^2$ 的值域为 $[3,6]$，从而 $h$ 的值域为 $[\\sqrt{3},\\sqrt{6}]$（$h>0$）。\n又对 $t=\\bigl(x-\\tfrac12\\bigr)^2$，映射 $t\\mapsto h$ 在可行 $t\\in[0,\\tfrac94]$ 上严格递减，故：每个 $u\\in(\\sqrt{3},\\sqrt{6})$ 对应唯一 $t\\in(0,\\tfrac94)$，从而恰两个对称的 $x$；端点 $u=\\sqrt{6}$ 对应 $t=0$ 即一根；$u=\\sqrt{3}$ 对应 $t=\\tfrac94$ 即两端点两根。\n全程未用导数。',
    maxScore: 14,
    rubric: [
      { step: '确定定义域 [-1,2]', score: 2 },
      { step: '平方并配方得值域', score: 6 },
      { step: '按 k 给出根的个数', score: 6 },
    ],
    round2: 'ACCEPTED_H3',
  }),
  item({
    n: 52,
    sectionCode: '3.2',
    sectionName: '函数的基本性质',
    kpCode: 'rja.3.2.03',
    kpName: '单调性',
    modelFamily: 'h3-quad-meet-abs-exactly-two-roots',
    coreObjective: '二次与 |x| 恰两交点的参数充要（双侧落入检验）',
    breakthrough: '非负/负半轴分别化二次后用判别式+根的符号检验，再排除四根与单根临界',
    contrastH2: '单侧 |x| 或纯判别式；本题双侧同时贡献时必须落入检验',
    deep: '半轴拆分 → 根的位置约束 → 并集恰为 2',
    routine: '只看总判别式或只解 x≥0',
    stem: '设实数 $a$。求使方程 $x^{2}-(a+1)x+a=|x|$ 恰有两个不同实根的 $a$ 的取值集合。',
    answer: '$a\\in(-\\infty,-1)\\cup(0,+\\infty)$',
    analysis:
      '（i）$x\\ge0$：方程化为 $x^{2}-(a+2)x+a=0$。记 $\\Delta_+=a^{2}+4>0$ 恒成立，根\n$$x_\\pm=\\dfrac{a+2\\pm\\sqrt{a^{2}+4}}{2}.$$\n积为 $a$，和为 $a+2$。故两根同号当且仅当 $a>0$；此时和 $a+2>0$，两根皆正，且不相等。若 $a=0$，根为 $0$ 与 $2$，皆 $\\ge0$，两根。若 $a<0$，积负，恰一正根。\n（ii）$x<0$：方程化为 $x^{2}-ax+a=0$。$\\Delta_-=a^{2}-4a=a(a-4)$。\n若 $\\Delta_-<0$ 即 $0<a<4$，无负根。若 $\\Delta_-=0$，则 $a=0$（根 $0$ 不在 $x<0$）或 $a=4$（根 $2$ 不在 $x<0$）。若 $\\Delta_->0$：积为 $a$，和为 $a$。\n— $a>4$：积正和正，两正根，无负根。\n— $a<0$：积负，恰一负根。\n合计不同实根个数：\n$a<0$：正侧 $1$ + 负侧 $1$ = $2$；\n$a=0$：正侧 $\{0,2\}$ 共 $2$，负侧无，共 $2$；\n$0<a<4$：正侧 $2$ + 负侧 $0$ = $2$；\n$a=4$：正侧两正根，负侧无，共 $2$；\n$a>4$：正侧 $2$ + 负侧 $0$ = $2$。\n等等：当 $a>0$ 时正侧已有两不同正根。当 $a<0$ 恰两根。\n但 $a=0$ 也恰两根。故所有 $a\\ne$？需排除多于两根：仅当负侧再贡献时。负侧仅在 $a<0$ 贡献一根，此时正侧一根，合计 $2$，不超额。\n是否存在少于 $2$？当正侧与负侧合计。复核 $a>0$：正侧两根；负侧在 $a>0$ 无贡献，恰两根。$a=0$ 恰两根。$a<0$ 恰两根。\n似乎对一切 $a$ 都恰两根？检查 $a=-1$：正侧积 $-1<0$，一正根；负侧 $\\Delta_-=(-1)(-5)=5>0$，积 $-1<0$，一负根。两根。\n检查是否重根合并：正侧 $x_\\pm$ 在 $a>0$ 两不同。似乎恒为 2。\n纠正：当 $a>0$ 时正侧两根 $x_\\pm$，需验证它们确实 $\\ge0$：积 $a>0$，和 $a+2>0$，且 $\\Delta>0$，是。\n题目要“恰有两个”，若恒为 2，则答案为 $\\mathbb{R}$——过易，需重审负侧方程。\n$x<0$：$x^{2}-(a+1)x+a=-x$，故 $x^{2}-(a+1)x+a+x=0$，即 $x^{2}-ax+a=0$。是。\n再核 $a=1$：原式 $x^{2}-2x+1=|x|$，$(x-1)^{2}=|x|$。$x\\ge0$：$(x-1)^{2}=x\\Rightarrow x^{2}-3x+1=0$，根 $(3\\pm\\sqrt5)/2$，皆正，两根。$x<0$：$(x-1)^{2}=-x$，左边 $\\ge0$ 右边 $>0$。展开 $x^{2}-2x+1+x=0\\Rightarrow x^{2}-x+1=0$，$\\Delta=1-4<0$，无。恰两根。\n恒为 2 则不够 H3。本题降为 REJECT。',
    maxScore: 12,
    rubric: [
      { step: '非负半轴讨论', score: 4 },
      { step: '负半轴讨论', score: 4 },
      { step: '合并得充要集', score: 4 },
    ],
    round2: 'REJECTED_NOT_H3',
    rejectReason: 'REJECTED_NOT_H3: after correction root count is constantly 2 — no param bite',
  }),
  item({
    n: 53,
    sectionCode: '3.2',
    sectionName: '函数的基本性质',
    kpCode: 'rja.3.2.01',
    kpName: '函数性质综合',
    modelFamily: 'h3-period-mono-on-full-period-force-const',
    coreObjective: '周期+整周期单调⇒常数',
    breakthrough: 'placeholder',
    contrastH2: 'placeholder',
    deep: 'placeholder',
    routine: 'placeholder',
    stem: '设 $f$ 周期为 $2$ 且在 $[0,2]$ 单调，证明常函数。',
    answer: '常函数',
    analysis: '教材定理级。',
    maxScore: 10,
    rubric: [
      { step: '端点', score: 3 },
      { step: '夹逼', score: 4 },
      { step: '严格情形', score: 3 },
    ],
    round2: 'REJECTED_NOT_H3',
    rejectReason: 'REJECTED_NOT_H3: simple_parity_or_monotonicity / textbook period+mono',
  }),
  item({
    n: 54,
    sectionCode: '3.1',
    sectionName: '函数的概念与表示',
    kpCode: 'rja.3.1.01',
    kpName: '函数的定义',
    modelFamily: 'h3-domain-equality-trivial',
    coreObjective: '定义域相等',
    breakthrough: 'x',
    contrastH2: 'x',
    deep: 'x',
    routine: 'x',
    stem: '求 a 使定义域为 [1,3]。',
    answer: '略',
    analysis: '过短。',
    maxScore: 6,
    rubric: [
      { step: 'a', score: 3 },
      { step: 'b', score: 3 },
    ],
    round2: 'REJECTED_NOT_H3',
    rejectReason: 'REJECTED_NOT_H3: domain equality H1/H2',
  }),
  item({
    n: 55,
    sectionCode: '3.2',
    sectionName: '函数的基本性质',
    kpCode: 'rja.3.2.03',
    kpName: '单调性',
    modelFamily: 'h3-linear-fraction-mono-domain-hole',
    coreObjective: '分式单调',
    breakthrough: 'x',
    contrastH2: 'x',
    deep: 'x',
    routine: 'x',
    stem: '求 (x+a)/(x+b) 在 (0,+∞) 严格减的充要。',
    answer: 'b≥0,a>b',
    analysis: '常规。',
    maxScore: 12,
    rubric: [
      { step: '域', score: 4 },
      { step: '形', score: 3 },
      { step: 'a>b', score: 5 },
    ],
    round2: 'REJECTED_NOT_H3',
    rejectReason: 'REJECTED_NOT_H3: ordinary fractional mono / simple mono',
  }),
  item({
    n: 56,
    sectionCode: '3.4',
    sectionName: '函数的应用（一）',
    kpCode: 'rja.3.4.01',
    kpName: '函数零点与方程',
    modelFamily: 'h3-abs-minus-x-zero-count-in-a',
    coreObjective: 'f(x)=|x-a|+|x-2|-x 在 a≤2 下的零点个数',
    breakthrough: '三段一次化后分别检验根是否落入对应区间，再按 a≤0、0<a≤1、1<a≤2 合并',
    contrastH2: '既有绝对值方程无 -x 打破对称',
    deep: '落入检验 + 参数三分',
    routine: '分段后不做落入检验',
    stem: '设 $a\\le 2$，令 $f(x)=|x-a|+|x-2|-x$。按 $a$ 的取值讨论方程 $f(x)=0$ 的实根个数。',
    answer: '当 $a<0$：无实根；当 $a=0$：恰一实根 $x=2$；当 $0<a\\le 2$：恰两实根。',
    analysis:
      '分段点为 $a,2$（已设 $a\\le 2$）。\n（i）$x<a$：$f=a+2-3x$，根 $x=\\dfrac{a+2}{3}$，落入 $x<a$ ⇔ $a>1$。\n（ii）$a\\le x\\le 2$：$f=2-a-x$，根 $x=2-a$，落入 ⇔ $0\\le a\\le 1$（由 $a\\le 2-a\\le 2$）。\n（iii）$x>2$：$f=x-a-2$，根 $x=a+2$，落入 ⇔ $a>0$（开区间，故 $a=0$ 时 $x=2$ 不计入本支）。\n合并：\n$a<0$：三支皆无落入根；\n$a=0$：仅中段根 $x=2$；\n$0<a\\le 1$：中段一根、右段一根；\n$1<a\\le 2$：左段一根、右段一根。\n故得所述分类。',
    maxScore: 14,
    rubric: [
      { step: '三段表达式', score: 3 },
      { step: '各段根的落入条件', score: 6 },
      { step: '合并给出个数分类', score: 5 },
    ],
    round2: 'ACCEPTED_H3',
  }),
  item({
    n: 57,
    sectionCode: '3.1',
    sectionName: '函数的概念与表示',
    kpCode: 'rja.3.1.03',
    kpName: '函数的表示法',
    modelFamily: 'h3-three-point-quad-fit',
    coreObjective: '三点定二次',
    breakthrough: 'x',
    contrastH2: 'x',
    deep: 'x',
    routine: 'x',
    stem: '过三点求二次。',
    answer: '略',
    analysis: '常规代数。',
    maxScore: 9,
    rubric: [
      { step: 'a', score: 3 },
      { step: 'b', score: 3 },
      { step: 'c', score: 3 },
    ],
    round2: 'REJECTED_NOT_H3',
    rejectReason: 'REJECTED_NOT_H3: 3-point quadratic fit is routine algebra',
  }),
  item({
    n: 58,
    sectionCode: '3.2',
    sectionName: '函数的基本性质',
    kpCode: 'rja.3.2.01',
    kpName: '对称性',
    modelFamily: 'h3-dual-axis-symmetry-period-mono-transfer',
    coreObjective: '关于 x=0 与 x=1 双对称 ⇒ 周期 2，并转移单调性',
    breakthrough: '两次反射复合为平移 2；再用关于 x=1 的反射把 [0,1] 递减映成 [1,2] 递增',
    contrastH2: '042/035 单轴；本题双轴强制周期并转移单调',
    deep: '周期导出 + 单调转移 + 对称点相等',
    routine: '只验证一个对称轴',
    stem: '设 $f:\\mathbb{R}\\to\\mathbb{R}$ 的图象既关于直线 $x=0$ 对称，又关于直线 $x=1$ 对称。\n（1）证明 $f(x+2)=f(x)$ 对一切实数 $x$ 成立；\n（2）若 $f$ 在 $[0,1]$ 上严格递减，证明 $f$ 在 $[1,2]$ 上严格递增，并证明 $f\\!\\left(\\dfrac12\\right)=f\\!\\left(\\dfrac32\\right)$。',
    answer: '（1）见解析；（2）见解析；$f(1/2)=f(3/2)$。',
    analysis:
      '关于 $x=0$：$f(-x)=f(x)$。关于 $x=1$：$f(1+t)=f(1-t)$。于是\n$f(x+2)=f\\big(1+(x+1)\\big)=f\\big(1-(x+1)\\big)=f(-x)=f(x)$。\n（2）对 $0\\le t_1<t_2\\le 1$，有 $1-t_2<1-t_1$，由 $[0,1]$ 严格减得 $f(1-t_2)>f(1-t_1)$，即 $f(1+t_2)>f(1+t_1)$，故在 $[1,2]$ 严格增。又 $f(1/2)=f(1-1/2)=f(1+1/2)=f(3/2)$。\n全程未假设连续性。',
    maxScore: 12,
    rubric: [
      { step: '推出周期 2', score: 4 },
      { step: '证明 [1,2] 严格增', score: 5 },
      { step: '对称点函数值相等', score: 3 },
    ],
    round2: 'ACCEPTED_H3',
  }),
  item({
    n: 59,
    sectionCode: '3.4',
    sectionName: '函数的应用（一）',
    kpCode: 'rja.3.4.01',
    kpName: '函数与方程',
    modelFamily: 'h3-piecewise-level-set-k-count',
    coreObjective: '分段函数与水平线交点个数随 k 分类',
    breakthrough: '中段抛物线在 k>1 时左根落入负半轴被丢掉，临界网为 3/4,1,3 而非误计 4 根',
    contrastH2: '既有零点族；本题完整水平切割且端点归属开闭',
    deep: '临界值网 + 中段单侧有效根 + 端点归属',
    routine: '以为抛物线每水平线总有两根而在 (1,3) 误计 4 根',
    stem: '设\n$f(x)=\\begin{cases}-x+1,&x<0\\\\ x^{2}-x+1,&0\\le x\\le 2\\\\ -x+5,&x>2\\end{cases}$\n按实数 $k$ 讨论方程 $f(x)=k$ 的实根个数。',
    answer:
      '当 $k<\\dfrac34$：恰 $1$ 根（仅右支）；\n当 $k=\\dfrac34$：恰 $2$ 根（中段顶点与右支）；\n当 $\\dfrac34<k\\le 1$：恰 $3$ 根（中段两根与右支）；\n当 $1<k<3$：恰 $3$ 根（左支、中段一根、右支）；\n当 $k=3$：恰 $2$ 根（左支 $x=-2$ 与中段 $x=2$）；\n当 $k>3$：恰 $1$ 根（仅左支）。',
    analysis:
      '左支 $x<0$：$f=1-x$ 严格减，值域 $(1,+\\infty)$，故 $k>1$ 时恰一根 $x=1-k<0$。\n中段：$f=\\bigl(x-\\tfrac12\\bigr)^{2}+\\tfrac34$，值域 $[\\tfrac34,3]$。方程 $f(x)=k$ 的无约束根为 $x=\\dfrac{1\\pm\\sqrt{4k-3}}{2}$。落入 $[0,2]$ 时：\n— $k=\\tfrac34$：仅 $x=\\tfrac12$；\n— $\\tfrac34<k\\le 1$：两根均在 $[0,1]\\subset[0,2]$；\n— $1<k<3$：仅较大根在 $(1,2)$，较小根为负，不落入；\n— $k=3$：仅 $x=2$。\n右支 $x>2$：$f=5-x$ 严格减，值域 $(-\\infty,3)$，故 $k<3$ 时恰一根（开区间，$k=3$ 不取 $x=2$）。\n按 $k$ 与 $\\tfrac34,1,3$ 叠加即得答案。注意：$1<k<3$ 时是 $3$ 根而非 $4$ 根。',
    maxScore: 14,
    rubric: [
      { step: '各支值域与单调', score: 4 },
      { step: '中段落入检验（含 k>1 仅一根）', score: 5 },
      { step: '分类计数', score: 5 },
    ],
    round2: 'ACCEPTED_H3',
    diagramRequirement: 'RECOMMENDED',
    diagramSpecification: '分段函数草图与若干水平线 k 示意（不标交点坐标）',
    noDiagramReason: null,
  }),
  item({
    n: 60,
    sectionCode: '3.1',
    sectionName: '函数的概念与表示',
    kpCode: 'rja.3.1.03',
    kpName: '函数的表示法',
    modelFamily: 'h3-dyadic-shift-mono-force-constant',
    coreObjective: '单调 + 1/n 平移不变 ⇒ 常数（不用连续性）',
    breakthrough: '有理分点同值，再用单调夹逼任意点；明确不依赖连续性',
    contrastH2: '039 用长度 1 窗口；本题用离散平移+单调',
    deep: '离散不变 + 单调夹逼',
    routine: '用连续性偷渡',
    stem: '设 $f:[0,1]\\to\\mathbb{R}$ 单调递增，且对一切 $x\\in[0,1]$ 与一切正整数 $n$，只要 $x+\\dfrac{1}{n}\\in[0,1]$，就有 $f\\!\\left(x+\\dfrac{1}{n}\\right)=f(x)$。证明 $f$ 为常函数。（证明中不得假设 $f$ 连续。）',
    answer: '$f$ 恒等于 $f(0)$（见证明）。',
    analysis:
      '对任意正整数 $n$ 与满足 $0\\le k\\le n$ 的整数 $k$，反复使用条件（在 $[0,1]$ 内逐步平移）得 $f\\!\\left(\\dfrac{k}{n}\\right)=f(0)$。特别地 $f(1)=f(0)$。\n任取 $x\\in(0,1)$。取正整数 $n>\\dfrac{1}{x}$，并取整数 $k\\ge0$ 使 $\\dfrac{k}{n}\\le x\\le \\dfrac{k+1}{n}\\le 1$（例如 $k=\\lfloor nx\\rfloor$，则 $k+1\\le n$ 当 $x<1$；若 $\\dfrac{k+1}{n}>1$ 则已有 $x$ 靠近 1，改用 $f(x)=f\\!\\left(x-\\dfrac{1}{m}\\bigr)$ 逐步连到某个 $\\dfrac{k}{m}$）。由单调性\n$f\\!\\left(\\dfrac{k}{n}\\right)\\le f(x)\\le f\\!\\left(\\dfrac{k+1}{n}\\right)$，\n两边等于 $f(0)$，故 $f(x)=f(0)$。全程未用连续性。',
    maxScore: 12,
    rubric: [
      { step: '分点处等于 f(0)', score: 4 },
      { step: '单调夹逼', score: 5 },
      { step: '说明未用连续性', score: 3 },
    ],
    round2: 'ACCEPTED_H3',
  }),
  item({
    n: 61,
    sectionCode: '3.2',
    sectionName: '函数的基本性质',
    kpCode: 'rja.3.2.03',
    kpName: '单调性',
    modelFamily: 'h3-compose-mono-table',
    coreObjective: '复合单调表',
    breakthrough: 'x',
    contrastH2: 'x',
    deep: 'x',
    routine: 'x',
    stem: '复合函数单调性口诀题。',
    answer: '略',
    analysis: '教材复述。',
    maxScore: 6,
    rubric: [
      { step: 'a', score: 3 },
      { step: 'b', score: 3 },
    ],
    round2: 'REJECTED_NOT_H3',
    rejectReason: 'REJECTED_NOT_H3: compose mono table is textbook restatement',
  }),
  item({
    n: 62,
    sectionCode: '3.2',
    sectionName: '函数的基本性质',
    kpCode: 'rja.3.2.02',
    kpName: '奇偶性',
    modelFamily: 'h3-odd-inc-functional-shift-unique-root',
    coreObjective: '奇+全局严格增下 f(x)+f(x-1)=0 的唯一根位置（不预设连续）',
    breakthrough: '由严格增与奇性得 f 在正半轴取正；证明至多一根后，用 f(0)+f(-1)= -f(1)<0 与 f(1)+f(0)=f(1)>0 夹出变号，但无连续不能介值——故改为只证至多一根，并在补设 f(1)=1 时构造？',
    contrastH2: 'x',
    deep: 'x',
    routine: 'x',
    stem: '设 f 奇且严格增，讨论 f(x)+f(x-1)=0。',
    answer: '至多一根',
    analysis:
      '若无连续，存在性不能用介值，仅“至多一根”偏 H2（与已淘汰 33 同类）。REJECT。',
    maxScore: 10,
    rubric: [
      { step: '至多', score: 5 },
      { step: '存在', score: 5 },
    ],
    round2: 'REJECTED_NOT_H3',
    rejectReason: 'REJECTED_NOT_H3: without continuity only uniqueness — isomorphic to rejected zero-count H2',
  }),
]

// Replace failed 52 with a genuine H3: abs-square level set
pool[1] = item({
  n: 52,
  sectionCode: '3.4',
  sectionName: '函数的应用（一）',
  kpCode: 'rja.3.4.01',
  kpName: '函数零点与方程',
  modelFamily: 'h3-abs-quad-vs-shifted-abs-root-count',
  coreObjective: '|x^2-1|=|x-a| 对参数 a 的实根个数分类',
  breakthrough: '平方等价前必须分 |x|≥1 与 |x|≤1 两区；每区再与直线距离比较，临界在 a=0,±1,±2',
  contrastH2: '单绝对值线性；本题二次折线与竖线距离耦合',
  deep: '分区等价 + 几何/代数双诠 + 临界网',
  routine: '直接两边平方引入增根或不分区',
  stem: '设实数 $a$。讨论方程 $|x^{2}-1|=|x-a|$ 的实根个数。',
  answer:
    '当 $|a|>2$：恰 $2$ 个实根；\n当 $|a|=2$：恰 $3$ 个实根；\n当 $1<|a|<2$：恰 $4$ 个实根；\n当 $|a|=1$：恰 $3$ 个实根；\n当 $0<|a|<1$：恰 $4$ 个实根；\n当 $a=0$：恰 $2$ 个实根。',
  analysis:
    '方程等价于 $x^{2}-1=\\pm(x-a)$。\n支一：$x^{2}-x-(1-a)=0$，$\\Delta_1=1+4(1-a)=5-4a$。\n支二：$x^{2}+x-(1+a)=0$，$\\Delta_2=1+4(1+a)=5+4a$。\n两支的根均自动满足原方程（因由 $\\pm$ 还原），故只需统计两支实根的并集去重。\n$\\Delta_1\\ge0\\Leftrightarrow a\\le\\tfrac54$；$\\Delta_2\\ge0\\Leftrightarrow a\\ge -\\tfrac54$。\n公共重根检验：若一根同属两支，则 $x^{2}-1=x-a=-(x-a)\\Rightarrow x^{2}-1=0$ 且 $x=a$，即 $a=\\pm1$。\n逐段（以 $a$ 为横轴，结合 $\\Delta$ 与重合）：\n— $a>5/4$：仅支二可能；当 $a>5/4$ 时 $\\Delta_2>0$，两根。特别 $a>2$ 时两根；细算端点见下。\n更干净的几何：左边是 $y=|x^{2}-1|$（W 形，谷底 $(\\pm1,0)$，在 $0$ 处高 $1$），右边是水平“竖距”到 $x=a$ 的折线距离函数在每个 $x$ 的值——即求 $y=|x^{2}-1|$ 与 $y=|x-a|$ 交点。\n对固定 $a$，函数 $d(x)=|x^{2}-1|-|x-a|$ 的零点。按 $a$ 相对 $-2,-1,0,1,2$ 的位置，分别在区间 $(-\\infty,-1],[-1,1],[1,+\\infty)$ 上解无绝对值得二次并做落入检验，汇总得答案中的分类。\n关键校验：\n$a=0$：$|x^{2}-1|=|x|$。$x^{2}-1=\\pm x\\Rightarrow x^{2}\\mp x-1=0$，正支两实根一正一负；负支同构，但四根中验证原式后恰两根成立？展开：$x^{2}-1=x\\Rightarrow x^{2}-x-1=0$ 两根；$x^{2}-1=-x\\Rightarrow x^{2}+x-1=0$ 两根；四根皆实且互异，代入原式均成立。故 $a=0$ 应为 $4$ 根。更正答案。\n$a=0$：$\\Delta_1=5,\\Delta_2=5$，四异根，无重合，恰 $4$ 根。\n$a=1$：支一 $x^{2}-x=0$，$x=0,1$；支二 $x^{2}+x-2=0$，$(x+2)(x-1)=0$，$x=-2,1$。并集 $\\{-2,0,1\\}$，恰 $3$ 根。\n$a=2$：支一 $x^{2}-x+1=0$，$\\Delta=1-4<0$；支二 $x^{2}+x-3=0$，两根。仅 $2$？$\\Delta_1=5-8=-3<0$，恰 $2$ 根。\n$a=1.5$：支一 $\\Delta_1=5-6=-1<0$；支二 $\\Delta_2=5+6=11$，两根。恰 $2$。\n$a=0.5$：两支 $\\Delta>0$，四根；重合？$a\\ne\\pm1$，恰 $4$。\n$a=-1$：对称得 $3$ 根。\n$a=-2$：恰 $2$ 根。\n重新汇总（由 $\\Delta$ 与 $a=\\pm1$ 重合）：\n令 $N(a)$ 为去重后根数。\n$a>5/4$：仅支二两根（$\\Delta_2>0$），$N=2$；\n$a=5/4$：支一重根？$\\Delta_1=0$，一根，加支二两根，若无重合则 $3$；\n$-5/4\\le a\\le 5/4$：两支各两根，再减去重合。\n本答案改为以 $\\Delta$ 临界与 $a=\\pm1$ 为准的完整表，见定稿 answer。',
  maxScore: 14,
  rubric: [
    { step: '化为两支二次', score: 4 },
    { step: '判别式与重合根', score: 5 },
    { step: '按 a 分类计数', score: 5 },
  ],
  round2: 'REJECTED_MATH_UNSTABLE',
  rejectReason: 'REJECTED_MATH_UNSTABLE: answer table inconsistent during author check — do not ship',
})

// Strong replacement for 52: |x|-param meet x^2 exactly-two with verified table
pool[1] = item({
  n: 52,
  sectionCode: '3.4',
  sectionName: '函数的应用（一）',
  kpCode: 'rja.3.4.01',
  kpName: '函数零点与方程',
  modelFamily: 'h3-abs-linear-meet-parabola-root-count',
  coreObjective: '方程 |x-a|=x^2 的实根个数对 a 完整分类',
  breakthrough: '几何上水平弦长与开口向上抛物线；代数上 x^2±(x-a)=0 两支+落入（自动）与重根临界 a=±1/4,0',
  contrastH2: '普通判别式求根；本题两支参数临界网含 0 与 ±1/4',
  deep: '两支二次 + 临界值拼合',
  routine: '画图估数不写临界',
  stem: '设实数 $a$。讨论方程 $|x-a|=x^{2}$ 的实根个数。',
  answer:
    '当 $a<-\\dfrac14$ 或 $a>\\dfrac14$：恰 $2$ 个实根；\n当 $a=\\pm\\dfrac14$：恰 $3$ 个实根；\n当 $-\\dfrac14<a<\\dfrac14$ 且 $a\\ne0$：恰 $4$ 个实根；\n当 $a=0$：恰 $2$ 个实根（$x=0$ 为二支公共根，计一次，另加一支的非零根——复核后：$a=0$ 时恰 $1$ 个实根 $x=0$？）。',
  analysis: 'PENDING_VERIFY',
  maxScore: 14,
  rubric: [
    { step: '两支二次', score: 4 },
    { step: '临界', score: 5 },
    { step: '分类', score: 5 },
  ],
  round2: 'REJECTED_MATH_UNSTABLE',
  rejectReason: 'REJECTED_MATH_UNSTABLE: a=0 edge needs clean rewrite — withhold',
})

const rejected = []
const accepted = []
for (const p of pool) {
  if (p.round2 === 'ACCEPTED_H3') accepted.push(p)
  else
    rejected.push({
      n: p.n,
      reason: p.rejectReason || p.round2,
      chapterNo: 3,
      modelFamily: p.modelFamily,
    })
}

// Final ACCEPTED list: only ship verified
const ship = accepted.filter((p) =>
  [51, 56, 58, 59, 60].includes(p.n),
)

fs.writeFileSync(
  path.join(__dirname, '_accepted_ch3_1c.mjs'),
  '/** Ch3-1C ACCEPTED_H3 append pool (math-verified) */\nexport const acceptedCh3_1c = ' +
    JSON.stringify(ship, null, 2) +
    '\n',
)
fs.writeFileSync(
  path.join(__dirname, '_ch3_1c_rejected.json'),
  JSON.stringify(
    {
      designedAttempted: pool.length,
      acceptedN: ship.length,
      rejected,
      acceptedIds: ship.map((k) => `CAND-H3C14-${String(k.n).padStart(3, '0')}`),
      note: 'Honest underfill: only math-stable true H3 shipped; no H1/H2 padding',
    },
    null,
    2,
  ),
)
console.log(
  JSON.stringify(
    {
      designed: pool.length,
      accepted: ship.length,
      ids: ship.map((k) => k.n),
      rejected: rejected.map((r) => ({ n: r.n, reason: r.reason })),
    },
    null,
    2,
  ),
)
