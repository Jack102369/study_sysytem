/**
 * Ch3 wave A from _1e_design_ch3_a.json (agent 07d3cafd…).
 * Remapped: agent 201→211, 202→212, 203→213, 205→214, 206→215, 207→216.
 * Skipped: agent 204 (≅ shipped 204 midpoint-affine), 208 (REJECTED_NOT_H3).
 */
function ev(b, c, d, r) {
  return {
    nonObviousBreakthrough: b,
    aboveHard14H2Contrast: c,
    deepStrategyOrLayeredNecessity: d,
    routineKillCheck: r,
  }
}

export const acceptedCh3WaveA = [
  {
    n: 211,
    chapterNo: 3,
    sectionCode: '3.1',
    sectionName: '函数的概念及其表示',
    kpCode: 'rja.3.1.04',
    kpName: '对应关系',
    methodMain: 'equiv_transform',
    methodAux: 'mono_analysis',
    qtype: 'application',
    modelFamily: 'h3-reciprocal-sum-existence-global-mono',
    coreObjective: '倒数反射和的存在充要，与整体单调下端点可行域及构造',
    breakthrough:
      '存在 ⇔ g(x)=g(1/x)；整体递增迫使 f(x)≥x+1/x−1（x≥1），从而 f(2)≥3/2；用跳跃增函数构造证明上端无界可达',
    hardLevelReason:
      '对称充要 → 半值 f(1)=1 → 跨 1 单调下界 → 跳跃构造证上无界；特解 f=g/2 不在可行域',
    stem: '设 $g:(0,+\\infty)\\to\\mathbb{R}$。\n（1）证明：存在函数 $f:(0,+\\infty)\\to\\mathbb{R}$ 使对一切 $x>0$ 有 $f(x)+f\\!\\left(\\dfrac1x\\right)=g(x)$，当且仅当对一切 $x>0$ 有 $g(x)=g\\!\\left(\\dfrac1x\\right)$。\n（2）取 $g(x)=x+\\dfrac1x$。设 $f:(0,+\\infty)\\to\\mathbb{R}$ 满足上式，且 $f$ 在 $(0,+\\infty)$ 上单调递增。求 $f(1)$ 以及 $f(2)$ 的取值范围，并说明范围中每一点均可取到。',
    answer: '（1）见解析。\n（2）$f(1)=1$，$f(2)\\in\\left[\\dfrac32,+\\infty\\right)$。',
    analysis:
      '（1）必要性：若存在 $f$，则 $g\\!\\left(\\dfrac1x\\right)=f\\!\\left(\\dfrac1x\\right)+f(x)=g(x)$。充分性：若 $g(x)=g\\!\\left(\\dfrac1x\\right)$，取 $f=\\dfrac12 g$ 即可（亦可再加满足 $p(x)+p(1/x)=0$ 的任意 $p$）。\n（2）$g$ 满足对称条件。令 $x=1$：$2f(1)=2\\Rightarrow f(1)=1$。对 $x\\ge 1$，由 $0<\\dfrac1x\\le 1\\le x$ 及递增得 $f\\!\\left(\\dfrac1x\\right)\\le f(1)\\le f(x)$。左边 $g(x)-f(x)\\le 1\\Rightarrow f(x)\\ge g(x)-1=x+\\dfrac1x-1$；右边 $f(x)\\ge 1$。因 $x+\\dfrac1x-1\\ge 1$，故 $f(x)\\ge x+\\dfrac1x-1$。特取 $x=2$：$f(2)\\ge \\dfrac32$。\n可达性：$c=\\dfrac32$ 时取 $f(x)=x+\\dfrac1x-1$（$x\\ge 1$），$f(x)=1$（$0<x\\le 1$），可验证满足方程且整体非严增。若 $c>\\dfrac32$，在 $[1,2)$ 上取 $f=f_{\\min}:=g-1$，令 $f(2)=c$，在 $(2,+\\infty)$ 上取 $f(x)=f_{\\min}(x)+c-\\dfrac32$，再由 $f(1/x)=g(x)-f(x)$ 延拓到 $(0,1)$；单调允许在 $x=2$ 处跳跃。故 $f(2)\\in\\left[\\dfrac32,+\\infty\\right)$。',
    maxScore: 14,
    rubric: [
      { step: '证明存在性充要 g(x)=g(1/x)', score: 4 },
      { step: '求出 f(1)=1 与 f(2)≥3/2', score: 5 },
      { step: '构造说明 [3/2,+∞) 均可取到', score: 5 },
    ],
    h3Evidence: ev(
      'existence iff reciprocal symmetry; global mono lifts f(2)≥3/2; jump constructs unbounded range',
      'H2 only builds f=g/2; mono on [1,+∞) alone weakens to f(2)≥1',
      'symmetry-iff → f(1)=1 → cross-1 mono lower bound → jump construct',
      'taking f=g/2 then guessing f(2)≥1',
    ),
  },
  {
    n: 212,
    chapterNo: 3,
    sectionCode: '3.2',
    sectionName: '函数的基本性质',
    kpCode: 'rja.3.2.01',
    kpName: '单调递增',
    methodMain: 'equiv_transform',
    methodAux: 'mono_analysis',
    qtype: 'application',
    modelFamily: 'h3-equal-increment-mono-force-identity',
    coreObjective: '等步长增量条件 + 单调夹逼 ⇒ 恒等函数（不用连续性）',
    breakthrough:
      '先在全体有理分点得 f(k/n)=k/n，再用单调把任意 x 夹在相邻分点之间，全程不取极限定义连续性',
    hardLevelReason: '常速率增量推恒等；禁连续偷渡；与 060 平移不变推常数结论与方程均不同',
    stem: '设 $f:[0,1]\\to\\mathbb{R}$ 单调递增，$f(0)=0$，且对一切正整数 $n$ 与一切满足 $x+\\dfrac1n\\in[0,1]$ 的 $x$，都有\n$$f\\!\\left(x+\\dfrac1n\\right)-f(x)=\\dfrac1n.$$\n证明：$f(x)=x$ 对一切 $x\\in[0,1]$ 成立。（证明中不得假设 $f$ 连续，不得使用导数。）',
    answer: '$f(x)=x$（见证明）。',
    analysis:
      '对固定正整数 $n$，由 $f(0)=0$ 与增量条件归纳得：对 $k=0,1,\\ldots,n$，$f\\!\\left(\\dfrac kn\\right)=\\dfrac kn$。特别 $f(1)=1$。\n任取 $x\\in(0,1)$。取充分大的正整数 $n$，令 $k=\\lfloor nx\\rfloor$，则 $\\dfrac kn\\le x\\le \\dfrac{k+1}n$。由单调性\n$$f\\!\\left(\\dfrac kn\\right)\\le f(x)\\le f\\!\\left(\\dfrac{k+1}n\\right),$$\n即 $\\dfrac kn\\le f(x)\\le \\dfrac{k+1}n$。又 $\\dfrac kn\\le x\\le \\dfrac{k+1}n$，故 $|f(x)-x|\\le \\dfrac1n$。因 $n$ 可任意大，必有 $f(x)=x$。全程只用分点赋值与单调夹逼，未假设连续。',
    maxScore: 12,
    rubric: [
      { step: '归纳得全体分点 f(k/n)=k/n', score: 4 },
      { step: '单调夹逼得 |f(x)-x|≤1/n', score: 5 },
      { step: '说明未用连续性', score: 3 },
    ],
    h3Evidence: ev(
      'grid values + mono sandwich force identity without continuity',
      '060 is translation-invariant→constant; here constant-rate increment→identity',
      'grid-values → mono sandwich → identity; ban continuity smuggling',
      'assume continuous then differentiate the increment equation',
    ),
  },
  {
    n: 213,
    chapterNo: 3,
    sectionCode: '3.2',
    sectionName: '函数的基本性质',
    kpCode: 'rja.3.2.04',
    kpName: '单调性判断',
    methodMain: 'mono_analysis',
    methodAux: 'classification',
    qtype: 'application',
    modelFamily: 'h3-doubling-invariance-mono-half-const',
    coreObjective: '倍元不变 + 单调 ⇒ (0,1] 上常数；端点 0 可例外并构造反例',
    breakthrough:
      '由 f(1)=f(1/2)=f(2^{-n}) 与单调，对任意 x∈(0,1] 取 2^{-n}≤x 夹逼得 f(x)=f(1)；f(0) 不受倍元链约束',
    hardLevelReason: '不传值到 0，反而证明 0 可以例外；禁 lim 偷渡连续',
    stem: '设 $f:[0,1]\\to\\mathbb{R}$ 单调递增，且对一切 $x\\in\\bigl[0,\\dfrac12\\bigr]$ 有 $f(x)=f(2x)$。\n（1）证明：存在常数 $c$ 使对一切 $x\\in(0,1]$ 有 $f(x)=c$。（不得假设 $f$ 连续。）\n（2）$f(0)$ 是否必须等于 $c$？若不必，请构造反例；若在（1）的条件下再补充 $f(0)=f(1)$，结论如何？',
    answer:
      '（1）$c=f(1)$，见证明。\n（2）不必。反例：$f(0)=-1$，$f(x)=0$（$x\\in(0,1]$）。若再设 $f(0)=f(1)$，则 $f$ 为常函数。',
    analysis:
      '（1）条件改写为：对一切 $t\\in[0,1]$，$f(t)=f\\!\\left(\\dfrac t2\\right)$。于是 $f(1)=f\\!\\left(\\dfrac12\\right)=\\cdots=f(2^{-n})$。令 $c=f(1)$。任取 $x\\in(0,1]$，选取 $n$ 使 $2^{-n}\\le x$。由单调性 $f(2^{-n})\\le f(x)\\le f(1)$，但 $f(2^{-n})=f(1)$，故 $f(x)=c$。未用连续性。\n（2）取 $f(0)=-1$，$f(x)=0$（$x\\in(0,1]$）。则单调递增；对 $x\\in\\bigl[0,\\dfrac12\\bigr]$ 倍元条件成立。故 $f(0)$ 不必等于 $c$。若补充 $f(0)=f(1)=c$，则 $f$ 恒为 $c$。',
    maxScore: 12,
    rubric: [
      { step: '建立 dyadic 链 f(1)=f(2^{-n})', score: 3 },
      { step: '单调夹逼得 (0,1] 上为常值', score: 4 },
      { step: '构造 f(0) 例外反例并讨论补条件', score: 5 },
    ],
    h3Evidence: ev(
      'dyadic collapse on (0,1]; optional jump at 0 with explicit counterexample',
      'mistakenly thinks continuity needed to pass values to 0; here 0 may be exceptional',
      'dyadic collapse → optional jump at 0',
      'writing lim f(2^{-n})=f(0) to smuggle continuity',
    ),
  },
  {
    n: 214,
    chapterNo: 3,
    sectionCode: '3.2',
    sectionName: '函数的基本性质',
    kpCode: 'rja.3.2.12',
    kpName: '奇偶性求值与综合应用',
    methodMain: 'equiv_transform',
    methodAux: 'mono_analysis',
    qtype: 'application',
    modelFamily: 'h3-odd-additive-mono-force-linear',
    coreObjective: '奇函数 + 非负半轴可加 + 单调 ⇒ 全局一次（不用连续性）',
    breakthrough:
      '先在非负有理点得 f(q)=qf(1)，再用单调夹逼到非负实点，最后用奇性延拓到负半轴',
    hardLevelReason: '三者耦合才锁死 f(x)=cx；可加性仅在非负半轴，负向靠奇性',
    stem: '设 $f:\\mathbb{R}\\to\\mathbb{R}$ 为奇函数，且对一切 $x,y\\ge 0$ 有 $f(x+y)=f(x)+f(y)$，又 $f$ 在 $[0,+\\infty)$ 上单调递增。证明：存在常数 $c\\ge 0$，使得对一切实数 $x$ 有 $f(x)=cx$。（证明中不得假设 $f$ 连续。）',
    answer: '$f(x)=cx$，其中 $c=f(1)\\ge 0$（见证明）。',
    analysis:
      '奇函数 ⇒ $f(0)=0$。对 $x\\ge 0$ 与正整数 $n$，归纳得 $f(nx)=nf(x)$；进而对正整数 $m,n$ 有 $f\\!\\left(\\dfrac{m}{n}\\right)=\\dfrac{m}{n}f(1)$。令 $c=f(1)\\ge 0$（由递增）。\n任取 $x>0$。对正整数 $n$ 取 $k=\\lfloor nx\\rfloor$，单调性给出 $\\dfrac kn c\\le f(x)\\le \\dfrac{k+1}n c$，夹逼得 $f(x)=cx$。负半轴：$x<0$ 时 $f(x)=-f(-x)=cx$。未用连续性。',
    maxScore: 14,
    rubric: [
      { step: '得非负有理点 f(q)=qc', score: 4 },
      { step: '单调夹逼到 [0,+∞)', score: 5 },
      { step: '奇性延拓到 ℝ 并说明 c≥0', score: 5 },
    ],
    h3Evidence: ev(
      'odd + additive on [0,+∞) + mono force global linearity without continuity',
      'parity alone or integer additivity alone is H1/H2; coupling locks cx',
      'N-homogeneity → Q-linearity on [0,+∞) → mono sandwich → odd extension',
      'default continuous Cauchy equation template',
    ),
  },
  {
    n: 215,
    chapterNo: 3,
    sectionCode: '3.1',
    sectionName: '函数的概念及其表示',
    kpCode: 'rja.3.1.04',
    kpName: '对应关系',
    methodMain: 'equiv_transform',
    methodAux: 'mono_analysis',
    qtype: 'application',
    modelFamily: 'h3-reflection-sum-mono-below-id-unique',
    coreObjective: '反射和为 1 + 单调增 + 点点低于恒等 ⇒ 唯一解 f(x)=x',
    breakthrough:
      '端点先锁 f(0)=0,f(1)=1；左半 f≤id 与右半 f≤id（经反射化为左半 f≥id）夹出 f=id',
    hardLevelReason: '相对 027（求 f(0) 可行域、解不唯一）多一层 f≤id 后唯一性闭合',
    stem: '设 $f:[0,1]\\to\\mathbb{R}$ 满足：\n（i）对一切 $x\\in[0,1]$，$f(x)+f(1-x)=1$；\n（ii）$f$ 在 $[0,1]$ 上单调递增；\n（iii）对一切 $x\\in[0,1]$，$f(x)\\le x$。\n证明：$f(x)=x$ 对一切 $x\\in[0,1]$ 成立。',
    answer: '$f(x)=x$（见证明）。',
    analysis:
      '由（i），$f\\!\\left(\\dfrac12\\right)=\\dfrac12$，且 $f(0)+f(1)=1$。由（iii）$f(0)\\le 0$，$f(1)\\le 1$。结合 $f(1)=1-f(0)$ 得 $f(0)\\ge 0$，故 $f(0)=0$，$f(1)=1$。\n对 $x\\in\\bigl[0,\\dfrac12\\bigr]$，（iii）给出 $f(x)\\le x$。对 $z\\in\\bigl[\\dfrac12,1\\bigr]$，（iii）$f(z)\\le z$ 即 $f(1-z)\\ge 1-z$。令 $w=1-z\\in\\bigl[0,\\dfrac12\\bigr]$，则 $f(w)\\ge w$。于是对一切 $w\\in\\bigl[0,\\dfrac12\\bigr]$ 有 $w\\le f(w)\\le w$，故 $f(w)=w$。再由（i）得右半亦为恒等。',
    maxScore: 12,
    rubric: [
      { step: '锁定 f(0)=0,f(1)=1,f(1/2)=1/2', score: 4 },
      { step: '左半 f≤id 与反射后的 f≥id 夹出恒等', score: 6 },
      { step: '回代右半并核验充分性', score: 2 },
    ],
    h3Evidence: ev(
      'reflection sum + mono + f≤id force unique identity (vs 027 multi-solution range)',
      '027 seeks feasible f(0); here extra f≤id closes uniqueness',
      'endpoint lock → half-interval dual inequality → identity uniqueness',
      'only verifying f(x)=x works, not proving uniqueness',
    ),
  },
  {
    n: 216,
    chapterNo: 3,
    sectionCode: '3.2',
    sectionName: '函数的基本性质',
    kpCode: 'rja.3.2.01',
    kpName: '单调递增',
    methodMain: 'equiv_transform',
    methodAux: 'mono_analysis',
    qtype: 'application',
    modelFamily: 'h3-dyadic-step-mono-force-constant',
    coreObjective: '仅 2^{-k} 步长平移不变 + 单调 ⇒ 常数（条件弱于 1/n 平移）',
    breakthrough:
      '弱假设仍能得全体 dyadic 分点同值，而 dyadic 在 [0,1] 仍足以被单调夹逼到任意点',
    hardLevelReason: '假设真弱于 060 的一切 1/n 平移；易误判条件不够；禁连续偷渡',
    stem: '设 $f:[0,1]\\to\\mathbb{R}$ 单调递增，且对一切 $x\\in[0,1]$ 与一切正整数 $k$，只要 $x+2^{-k}\\in[0,1]$，就有\n$$f\\!\\left(x+2^{-k}\\right)=f(x).$$\n证明 $f$ 为常函数。（证明中不得假设 $f$ 连续。）',
    answer: '$f$ 恒等于 $f(0)$（见证明）。',
    analysis:
      '对固定正整数 $n$，令 $h=2^{-n}$。反复使用步长 $h$ 的平移不变性，得对一切整数 $m$ 满足 $0\\le m\\le 2^n$，有 $f(mh)=f(0)$。特别 $f(1)=f(0)$。\n任取 $x\\in(0,1)$。取充分大的 $n$，令 $m=\\lfloor 2^n x\\rfloor$，则 $\\dfrac{m}{2^n}\\le x\\le \\dfrac{m+1}{2^n}$。由单调性两端均为 $f(0)$，故 $f(x)=f(0)$。未用连续性。关键：假设弱于“一切 $1/n$ 平移”，但二进分点已足够密。',
    maxScore: 12,
    rubric: [
      { step: '得全体 dyadic 分点等于 f(0)', score: 4 },
      { step: '单调夹逼任意点', score: 5 },
      { step: '说明弱假设仍充分且未用连续', score: 3 },
    ],
    h3Evidence: ev(
      'weaker dyadic-only translation invariance still forces constant via mono sandwich',
      '060 uses all 1/n steps; here only 2^{-k} — easy to wrongly stop as insufficient',
      'weaker discrete invariance → dyadic grid constancy → mono sandwich',
      'claiming odd-denominator gaps block the proof; or continuity smuggling',
    ),
  },
]
