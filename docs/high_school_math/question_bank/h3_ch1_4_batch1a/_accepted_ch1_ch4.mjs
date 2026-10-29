import { appItem } from './_mk_item.mjs'

/**
 * H3 exclusive offline pack — 人教A版必修一
 * Chapter 1: n=1..5 (sets / logic / quantifiers)
 * Chapter 4: n=46..50 (exp/log composite, domain–parameter coupling)
 * Dual-gated ACCEPTED_H3 candidates (offline only; no DB write).
 */

export const acceptedCh1 = [
  appItem({
    n: 1,
    chapterNo: 1,
    sectionCode: '1.4',
    sectionName: '充分条件与必要条件',
    kpCode: 'rja.1.4.03',
    kpName: '充要条件',
    methodMain: 'equiv_transform',
    methodAux: 'classification',
    qtype: 'application',
    modelFamily: 'h3-empty-set-biconditional-trap',
    coreObjective: '空集陷阱下 p⇔q 的真值分层',
    breakthrough:
      '空集是任何集合的子集，故 A_t=∅ 时 p 仍真而 q 假；只解非空包含不等式会得到错误充要区间。',
    contrastH2:
      'HARD14 集合包含题常默认讨论非空或不管空集；本题把空集真值显式嵌入 p⇔q。',
    stem:
      '设 $A_t=\\{x\\mid t\\le x\\le 2t+2\\}$。命题 $p$：$A_t\\subseteq[0,4]$；命题 $q$：$A_t\\ne\\varnothing$ 且 $A_t\\ne[0,4]$。求使 $p\\Leftrightarrow q$ 成立的实数 $t$ 的取值集合。',
    answer: '$t\\in[0,1]$',
    analysis:
      '先判空集：$A_t=\\varnothing\\Leftrightarrow t>2t+2\\Leftrightarrow t<-1$。空集是任何集合的子集，故 $t<-1$ 时 $p$ 真；但 $q$ 要求非空，故 $q$ 假，从而 $p\\not\\Leftrightarrow q$。\n' +
      '下设 $t\\ge -1$，则 $A_t=[t,2t+2]$ 非空。$A_t\\subseteq[0,4]\\Leftrightarrow t\\ge 0$ 且 $2t+2\\le 4\\Leftrightarrow t\\in[0,1]$。\n' +
      '若 $A_t=[0,4]$，则必 $t=0$ 且 $2t+2=4\\Leftrightarrow t=1$，矛盾，故对一切实数 $t$ 有 $A_t\\ne[0,4]$。于是在 $t\\ge -1$ 时，$q\\Leftrightarrow A_t\\ne\\varnothing$ 已自动满足“≠[0,4]”，即 $q$ 真。\n' +
      '因此当 $t\\in[0,1]$ 时 $p,q$ 皆真。当 $t\\in[-1,0)$：$A_t$ 非空但左端点 $t<0$，故 $p$ 假、$q$ 真。当 $t>1$：右端点 $2t+2>4$，$p$ 假、$q$ 真。\n' +
      '综上，仅 $t\\in[0,1]$ 使 $p\\Leftrightarrow q$。',
    maxScore: 12,
    rubric: [
      { step: '空集情形指出 p 真 q 假', score: 3 },
      { step: '非空包含得 t∈[0,1]', score: 4 },
      { step: '证明永不可能 A_t=[0,4]', score: 2 },
      { step: '区间外真值对照得充要集', score: 3 },
    ],
    hardLevelReason:
      '关键在空集使包含命题恒真，必须做空/临界/越界三区真值表，而非一次不等式。',
    h3Evidence: {
      nonObviousBreakthrough: 'empty-set makes p true while q false',
      aboveHard14H2Contrast: 'explicit biconditional vs empty-set trap',
      deepStrategyOrLayeredNecessity: 'three regimes empty/feasible/overflow',
      routineKillCheck: 'solving only A⊆B without empty → wrong iff set',
    },
    diagramRequirement: 'NOT_NEEDED',
  }),

  appItem({
    n: 2,
    chapterNo: 1,
    sectionCode: '1.5',
    sectionName: '全称量词与存在量词',
    kpCode: 'rja.1.5.01',
    kpName: '全称量词',
    methodMain: 'special_value',
    methodAux: 'equiv_transform',
    qtype: 'application',
    modelFamily: 'h3-forall-exists-order-separation',
    coreObjective: '二次族上 ∀∃ 与 ∃∀ 严格分离',
    breakthrough:
      '对每个 a 取 x=a 可使 (I) 成立；但 (II) 要求公共 x 同时适应 a=0 与 a=1，迫使 x=0 且 x=1，矛盾。',
    contrastH2:
      'HARD14 多为线性 ∀∃ 或同真同假；本题用二次平移族造出“逐点可、公共不可”。',
    stem:
      '设 $f_a(x)=(x-a)^{2}-a(1-a)$，$a\\in[0,1]$。判断下列命题的真假，并给出证明：\n' +
      '（I）$\\forall a\\in[0,1],\\ \\exists x\\in[0,1]$ 使 $f_a(x)\\le 0$；\n' +
      '（II）$\\exists x\\in[0,1],\\ \\forall a\\in[0,1]$ 使 $f_a(x)\\le 0$。',
    answer: '（I）真；（II）假。',
    analysis:
      '（I）：任取 $a\\in[0,1]$，取 $x=a\\in[0,1]$，则 $f_a(a)=-a(1-a)\\le 0$，故（I）真。\n' +
      '（II）：反证。若存在 $x_0\\in[0,1]$ 使对一切 $a\\in[0,1]$ 有 $(x_0-a)^{2}\\le a(1-a)$。取 $a=0$：$(x_0)^{2}\\le 0\\Rightarrow x_0=0$。取 $a=1$：$(x_0-1)^{2}\\le 0\\Rightarrow x_0=1$。矛盾。故（II）假。\n' +
      '（亦可：由 $a=0,1$ 得 $x_0\\in\\{0\\}\\cap\\{1\\}=\\varnothing$。）因此两命题不等价，（I）真（II）假。',
    maxScore: 10,
    rubric: [
      { step: '构造 x=a 证明（I）', score: 4 },
      { step: '用 a=0 与 a=1 否定（II）', score: 6 },
    ],
    hardLevelReason:
      '突破点是量词顺序：逐点取对角元可行，但端点特值摧毁公共元，非文字游戏。',
    h3Evidence: {
      nonObviousBreakthrough: 'diagonal x=a vs endpoint clash on common x',
      aboveHard14H2Contrast: 'quadratic family forces strict ∀∃≠∃∀',
      deepStrategyOrLayeredNecessity: 'prove I by construction; kill II by a=0,1',
      routineKillCheck: 'treating quantifier order as equivalent → wrong',
    },
    diagramRequirement: 'NOT_NEEDED',
  }),

  appItem({
    n: 3,
    chapterNo: 1,
    sectionCode: '1.2',
    sectionName: '集合间的基本关系',
    kpCode: 'rja.1.2.01',
    kpName: '子集与真子集',
    methodMain: 'classification',
    methodAux: 'equiv_transform',
    qtype: 'application',
    modelFamily: 'h3-quad-subset-empty-branch-lock',
    coreObjective: '二次解集⊆固定区间必须并入空集支并排除 a>1 伪解',
    breakthrough:
      'Δ<0 的空集支使包含恒真；a>1 时开口向上的解集左端点必 <-1，被 [-1,1] 拒绝——漏空集或只套端点公式都会错。',
    contrastH2:
      'HARD14 含参区间⊆多为一次端点比较；本题二次 Δ 符号三分，空集与越界同时出现。',
    stem:
      '设 $S_a=\\{x\\in\\mathbb{R}\\mid x^{2}+2ax+a\\le 0\\}$。求使 $S_a\\subseteq[-1,1]$ 成立的实数 $a$ 的取值集合。',
    answer: '$a\\in\\left[-\\dfrac{1}{3},1\\right]$',
    analysis:
      '记 $g(x)=x^{2}+2ax+a$，开口向上，$\\Delta=4a^{2}-4a=4a(a-1)$。\n' +
      '（i）若 $\\Delta<0$，即 $a\\in(0,1)$，则 $S_a=\\varnothing\\subseteq[-1,1]$，成立。\n' +
      '（ii）若 $\\Delta=0$：即 $a=0$ 或 $a=1$。$a=0$ 时 $S_0=\\{0\\}\\subseteq[-1,1]$；$a=1$ 时 $S_1=\\{-1\\}\\subseteq[-1,1]$，皆成立。\n' +
      '（iii）若 $a<0$，则 $\\Delta>0$，根为 $-a\\pm\\delta$，其中 $\\delta=\\sqrt{a^{2}-a}$，$S_a=[-a-\\delta,-a+\\delta]$。需\n' +
      '$-a-\\delta\\ge -1$ 且 $-a+\\delta\\le 1$，即 $\\delta\\le 1-a$ 且 $\\delta\\le 1+a$。因 $a<0$ 有 $1-a>1+a$，故只需 $\\delta\\le 1+a$。由此先得 $1+a>0\\Leftrightarrow a>-1$（否则右边非正而 $\\delta>0$）。在 $a\\in(-1,0)$ 上平方：\n' +
      '$a^{2}-a\\le(1+a)^{2}\\Leftrightarrow -a\\le 1+2a\\Leftrightarrow a\\ge -\\dfrac{1}{3}$。故 $a\\in\\left[-\\dfrac{1}{3},0\\right)$。\n' +
      '（iv）若 $a>1$，则 $\\delta=\\sqrt{a(a-1)}<a$，右端 $-a+\\delta<0\\le 1$ 自动；但左端 $-a-\\delta<-a<-1$，故 $S_a\\not\\subseteq[-1,1]$。\n' +
      '合并（i）–（iii）：$a\\in\\left[-\\dfrac{1}{3},1\\right]$。\n' +
      '纠错：若忽略空集，会漏掉 $(0,1)$；若对 $a>1$ 只验证右端点，会误收 $a>1$。',
    maxScore: 14,
    rubric: [
      { step: 'Δ<0 空集支', score: 3 },
      { step: 'Δ=0 两点检验', score: 2 },
      { step: 'a<0 推导 a≥-1/3', score: 5 },
      { step: '否定 a>1 并合并', score: 4 },
    ],
    hardLevelReason:
      '必须空集/相切/负参平方不等式/正参左端越界四层，缺一层即错集。',
    h3Evidence: {
      nonObviousBreakthrough: 'empty Δ<0 branch + a>1 left-end overflow',
      aboveHard14H2Contrast: 'quadratic Δ trichotomy vs linear endpoint subset',
      deepStrategyOrLayeredNecessity: 'square only after 1+a>0; exclude a>1 separately',
      routineKillCheck: 'nonempty endpoint recipe alone → miss (0,1) or keep a>1',
    },
    diagramRequirement: 'RECOMMENDED',
    diagramSpecification:
      '数轴标出 [-1,1]，示意 a=-1/3 时解集恰贴合，以及 a>1 时左根 <-1。',
    noDiagramReason: null,
  }),

  appItem({
    n: 4,
    chapterNo: 1,
    sectionCode: '1.5',
    sectionName: '全称量词与存在量词',
    kpCode: 'rja.1.5.02',
    kpName: '存在量词',
    methodMain: 'equiv_transform',
    methodAux: 'special_value',
    qtype: 'application',
    modelFamily: 'h3-quantifier-product-xor-truth',
    coreObjective: '乘积约束下 ∀∃ 与 ∃∀ 真值域分离后取对称差',
    breakthrough:
      '（I）要求对每个 x∈[1,2] 都有 y=k/x∈[0,1]，被最紧约束 x=1 锁成 k∈[0,1]；（II）公共 y 迫使 k=0。恰一真即 k∈(0,1]。',
    contrastH2:
      'HARD14 常只判单条量词命题真假；本题要两真值域再取“恰一真”，属于真值层二阶操作。',
    stem:
      '对实数 $k$，考察命题\n' +
      '（I）$\\forall x\\in[1,2],\\ \\exists y\\in[0,1]$ 使 $xy=k$；\n' +
      '（II）$\\exists y\\in[0,1],\\ \\forall x\\in[1,2]$ 使 $xy=k$。\n' +
      '求使（I）、（II）恰好有一个为真的 $k$ 的取值集合。',
    answer: '$k\\in(0,1]$',
    analysis:
      '（I）：对固定 $x\\in[1,2]$，需 $y=k/x\\in[0,1]$。由 $x>0$ 得 $0\\le k\\le x$。该式对一切 $x\\in[1,2]$ 成立 $\\Leftrightarrow 0\\le k\\le 1$（取最紧上界 $x=1$；下界 $k\\ge 0$）。故（I）真 $\\Leftrightarrow k\\in[0,1]$。\n' +
      '（II）：若 $y=0$，则 $xy=0$，故需 $k=0$，此时对一切 $x$ 成立。若 $y\\in(0,1]$，则 $x=k/y$ 随 $x$ 变化不能恒为常数约束下对一切 $x\\in[1,2]$ 成立（除非区间退化）。故（II）真 $\\Leftrightarrow k=0$。\n' +
      '恰一真：（I）真且（II）假 $\\Leftrightarrow k\\in[0,1]\\setminus\\{0\\}=(0,1]$。（不可能出现（II）真而（I）假，因 $k=0$ 时（I）亦真。）',
    maxScore: 12,
    rubric: [
      { step: '刻画（I）真域 [0,1]', score: 5 },
      { step: '刻画（II）真域 {0}', score: 4 },
      { step: '取对称差得 (0,1]', score: 3 },
    ],
    hardLevelReason:
      '嵌套量词真值域不同构，再做 XOR；误把（II）写成 k∈[0,1] 会全错。',
    h3Evidence: {
      nonObviousBreakthrough: 'I locked by x=1; II collapses to k=0 only',
      aboveHard14H2Contrast: 'second-order XOR of two quantifier truth sets',
      deepStrategyOrLayeredNecessity: 'tightest bound then common-y degeneration',
      routineKillCheck: 'swapping quantifiers as equivalent → answer [0,1] or empty',
    },
    diagramRequirement: 'NOT_NEEDED',
  }),

  appItem({
    n: 5,
    chapterNo: 1,
    sectionCode: '1.3',
    sectionName: '集合的基本运算',
    kpCode: 'rja.1.3.03',
    kpName: '补集',
    methodMain: 'equiv_transform',
    methodAux: 'classification',
    qtype: 'application',
    modelFamily: 'h3-complement-cover-biconditional',
    coreObjective: '补集约束逼出单点 p 与区间 q 的充要并集',
    breakthrough:
      '∁_U A_t ⊆[0,1]∪[3,4] 等价于开区间 (1,3)⊆A_t，从而 p 仅在 t=1 为真；q 为 t∈[0,2]；p⇔q 还包含双方同假的外侧无界支。',
    contrastH2:
      'HARD14 补集题多为求补或有限韦恩；本题补集包含反推滑窗位置并与属于关系做充要。',
    stem:
      '设全集 $U=[0,4]$，$A_t=[t,t+2]\\cap U$（约定：若 $t>4$ 或 $t+2<0$ 则 $A_t=\\varnothing$）。命题 $p$：$\\complement_U A_t\\subseteq[0,1]\\cup[3,4]$；命题 $q$：$2\\in A_t$。求使 $p\\Leftrightarrow q$ 成立的实数 $t$ 的取值集合。',
    answer: '$t\\in(-\\infty,0)\\cup\\{1\\}\\cup(2,+\\infty)$',
    analysis:
      '先译 $p$：$\\complement_U A_t\\subseteq[0,1]\\cup[3,4]\\Leftrightarrow$ 不存在 $x\\in(1,3)$ 使 $x\\notin A_t\\Leftrightarrow(1,3)\\subseteq A_t$。\n' +
      '当 $A_t=\\varnothing$ 时显然不包含 $(1,3)$，$p$ 假。当 $A_t=[\\max(t,0),\\min(t+2,4)]$ 时，需 $\\max(t,0)\\le 1$ 且 $\\min(t+2,4)\\ge 3$。\n' +
      '若 $t\\le 0$：左边成立，但 $\\min(t+2,4)\\ge 3\\Rightarrow t\\ge 1$，与 $t\\le 0$ 矛盾。若 $0<t\\le 2$：需 $t\\le 1$ 且 $t+2\\ge 3\\Leftrightarrow t\\ge 1$，故仅 $t=1$，此时 $A_1=[1,3]$，$(1,3)\\subseteq A_1$，$p$ 真。若 $t>2$：左端 $\\max(t,0)=t>2>1$，不能 ≤1，$p$ 假。故 $p$ 真 $\\Leftrightarrow t=1$。\n' +
      '再译 $q$：$2\\in A_t$。空集时假。非空时 $\\max(t,0)\\le 2\\le\\min(t+2,4)$。分 $t\\ge 0$ 得 $0\\le t\\le 2$；$t<0$ 且 $t\\ge -2$ 时右端 $t+2<2$，不能盖住 2。故 $q$ 真 $\\Leftrightarrow t\\in[0,2]$。\n' +
      '因此：$p,q$ 同真 $\\Leftrightarrow t=1$；同假 $\\Leftrightarrow t\\notin[0,2]$（此时自动 $t\\ne 1$）。当 $t\\in[0,2]\\setminus\\{1\\}$ 时 $q$ 真 $p$ 假。故 $p\\Leftrightarrow q\\Leftrightarrow t\\in(-\\infty,0)\\cup\\{1\\}\\cup(2,+\\infty)$。',
    maxScore: 14,
    rubric: [
      { step: '补集条件译为 (1,3)⊆A_t', score: 3 },
      { step: '证 p 真仅当 t=1', score: 4 },
      { step: '刻画 q 真域 [0,2]', score: 3 },
      { step: '合并同真与同假支', score: 4 },
    ],
    hardLevelReason:
      '补集⊆强制“中间必须被盖住”只留单点，充要却要并上同假的外侧，结构非单区间。',
    h3Evidence: {
      nonObviousBreakthrough: 'complement subset ⇔ open middle covered → unique t=1',
      aboveHard14H2Contrast: 'biconditional unions exterior co-false rays',
      deepStrategyOrLayeredNecessity: 'translate complement; lock p; XOR-style merge',
      routineKillCheck: 'answering only {1} or only [0,2] → incomplete iff set',
    },
    diagramRequirement: 'RECOMMENDED',
    diagramSpecification:
      '数轴 U=[0,4]，阴影 [0,1]∪[3,4]，标出 A_1=[1,3] 盖住 (1,3)，以及 2∈A_t 的滑动窗口。',
    noDiagramReason: null,
  }),
]

export const acceptedCh4 = [
  appItem({
    n: 46,
    chapterNo: 4,
    sectionCode: '4.4',
    sectionName: '对数函数',
    kpCode: 'rja.4.4.02',
    kpName: '对数函数单调性',
    methodMain: 'classification',
    methodAux: 'mono_analysis',
    qtype: 'application',
    modelFamily: 'h3-log-domain-exist-forall-bite',
    coreObjective: '定义域随 a 伸缩时存在型与全称型对数不等式联立',
    breakthrough:
      'D_f=(-|a|,|a|) 随 a 变；f 在中心最大、端点→−∞。存在 f≥1 要 |a|≥√2，全称 f≤3 要 |a|≤2√2，二者与定义域非空耦合。',
    contrastH2:
      'HARD14 指对题多为固定定义域上解不等式；本题存在/全称门槛与 |a| 同步涨落。',
    stem:
      '设 $a\\ne 0$，函数 $f(x)=\\log_2(a^{2}-x^{2})$ 的定义域为 $D_f$。求使下列两命题同时成立的实数 $a$ 的取值集合：\n' +
      '（I）$\\exists x\\in D_f$ 使 $f(x)\\ge 1$；\n' +
      '（II）$\\forall x\\in D_f$ 有 $f(x)\\le 3$。',
    answer: '$a\\in\\left[-2\\sqrt{2},-\\sqrt{2}\\right]\\cup\\left[\\sqrt{2},2\\sqrt{2}\\right]$',
    analysis:
      '由真数 $>0$：$a^{2}-x^{2}>0\\Leftrightarrow |x|<|a|$，故 $D_f=(-|a|,|a|)$（已用 $a\\ne 0$ 保证非空）。令 $b=|a|>0$，则 $f(x)=\\log_2(b^{2}-x^{2})$。\n' +
      '在 $D_f$ 上，$b^{2}-x^{2}$ 在 $x=0$ 取最大 $b^{2}$，当 $x\\to\\pm b$ 时趋于 $0^{+}$，故 $f$ 最大值为 $\\log_2 b^{2}=2\\log_2 b$，下无界为 $-\\infty$。\n' +
      '（I）$\\Leftrightarrow$ 最大值 $\\ge 1\\Leftrightarrow 2\\log_2 b\\ge 1\\Leftrightarrow \\log_2 b\\ge \\tfrac12\\Leftrightarrow b\\ge\\sqrt{2}$。\n' +
      '（II）$\\Leftrightarrow$ 最大值 $\\le 3\\Leftrightarrow 2\\log_2 b\\le 3\\Leftrightarrow \\log_2 b\\le \\tfrac32\\Leftrightarrow b\\le 2\\sqrt{2}$。（端点附近 $f\\to-\\infty$，自动 $\\le 3$。）\n' +
      '故 $b\\in[\\sqrt{2},2\\sqrt{2}]$，即 $a\\in[-2\\sqrt{2},-\\sqrt{2}]\\cup[\\sqrt{2},2\\sqrt{2}]$。\n' +
      '关键：若误在固定区间上讨论，或把（II）写成对一切实数 $x$ 而非 $x\\in D_f$，都会得到错误范围。',
    maxScore: 12,
    rubric: [
      { step: '写出 D_f=(-|a|,|a|)', score: 2 },
      { step: '用最大值转化（I）（II）', score: 6 },
      { step: '合并得 |a| 双闭区间', score: 4 },
    ],
    hardLevelReason:
      '定义域半径与最值门槛咬合；存在/全称对同一最值给出双向截断，非套路化简。',
    h3Evidence: {
      nonObviousBreakthrough: 'max on shrinking domain locks both exist and forall',
      aboveHard14H2Contrast: 'dual quantifier cut on a-dependent domain',
      deepStrategyOrLayeredNecessity: 'reduce to b=|a|; max=2 log2 b',
      routineKillCheck: 'routine log inequality on fixed ℝ → wrong or empty',
    },
    diagramRequirement: 'NOT_NEEDED',
  }),

  appItem({
    n: 47,
    chapterNo: 4,
    sectionCode: '4.4',
    sectionName: '对数函数',
    kpCode: 'rja.4.4.03',
    kpName: '对数函数图象与性质',
    methodMain: 'classification',
    methodAux: 'equiv_transform',
    qtype: 'application',
    modelFamily: 'h3-log-quad-domain-R-base-split',
    coreObjective: '二次真数恒正锁 a 后，按底分类解 f(x)≥1',
    breakthrough:
      '定义域为 ℝ 迫使 Δ<a 的开口条件得 a∈(0,2)\\{1}；再按 a>1 / 0<a<1 翻转不等式，解集从“外侧两射线”变为“中间闭区间”。',
    contrastH2:
      'HARD14 常见“已知定义域求 a”或单独解对数不等式；本题二者串联且底的分类改变解集拓扑。',
    stem:
      '设 $f(x)=\\log_a(x^{2}-ax+1)$（$a>0,\\ a\\ne 1$）。\n' +
      '（1）求使 $f$ 的定义域为 $\\mathbb{R}$ 的 $a$ 的取值集合；\n' +
      '（2）在（1）的条件下，解不等式 $f(x)\\ge 1$。',
    answer:
      '（1）$a\\in(0,1)\\cup(1,2)$。\n' +
      '（2）记 $x_{\\pm}=\\dfrac{a\\pm\\sqrt{a^{2}+4a-4}}{2}$，$a_{*}=2\\sqrt{2}-2$。当 $a\\in(1,2)$ 时 $x\\in(-\\infty,x_{-}]\\cup[x_{+},+\\infty)$；当 $a\\in(a_{*},1)$ 时 $x\\in[x_{-},x_{+}]$；当 $a=a_{*}$ 时 $x=\\{a/2\\}$；当 $a\\in(0,a_{*})$ 时解集为空集。',
    analysis:
      '（1）需 $x^{2}-ax+1>0$ 对一切实数 $x$ 成立。开口向上，故需 $\\Delta=a^{2}-4<0\\Leftrightarrow |a|<2$。结合 $a>0,a\\ne 1$，得 $a\\in(0,1)\\cup(1,2)$。\n' +
      '（2）$f(x)\\ge 1\\Leftrightarrow\\log_a(x^{2}-ax+1)\\ge\\log_a a$。记 $g(x)=x^{2}-ax+1$，$h(x)=x^{2}-ax+(1-a)$。\n' +
      '当 $a\\in(1,2)$（底$>1$）：等价于 $g(x)\\ge a\\Leftrightarrow h(x)\\ge 0$。$\\Delta_h=a^{2}+4a-4=(a+2)^{2}-8$，因 $a>1\\Rightarrow a+2>3>2\\sqrt{2}$，故 $\\Delta_h>0$。根 $x_{\\pm}=\\dfrac{a\\pm\\sqrt{\\Delta_h}}{2}$（$x_-<x_+$），于是 $x\\in(-\\infty,x_{-}]\\cup[x_{+},+\\infty)$。\n' +
      '当 $0<a<1$（底∈(0,1)）：不等号翻转，等价于 $0<g(x)\\le a\\Leftrightarrow h(x)\\le 0$（$g>0$ 已由（1）保证）。此时 $\\Delta_h=(a+2)^{2}-8$ 的零点为 $a_{*}=2\\sqrt{2}-2\\in(0,1)$。\n' +
      '· 若 $a\\in(0,a_{*})$，则 $\\Delta_h<0$ 且开口向上，$h(x)>0$ 恒成立，故 $h\\le 0$ 无解，解集为空；\n' +
      '· 若 $a=a_{*}$，则 $\\Delta_h=0$，唯一根 $x=a/2$，解集为 $\\{a/2\\}$；\n' +
      '· 若 $a\\in(a_{*},1)$，则 $\\Delta_h>0$，解集为 $[x_{-},x_{+}]$。\n' +
      '关键分岔：定义域条件只给出 $a\\in(0,2)\\setminus\\{1\\}$，但 $0<a<1$ 时还要二次对 $\\Delta_h$ 再分层，否则会误报“恒为闭区间”。',
    maxScore: 16,
    rubric: [
      { step: '（1）Δ<0 得 a∈(0,1)∪(1,2)', score: 3 },
      { step: '（2）a∈(1,2) 外侧解集', score: 4 },
      { step: '（2）0<a<1 对 Δ_h 再分层', score: 6 },
      { step: '汇总四类解集', score: 3 },
    ],
    hardLevelReason:
      '定义域恒正、底分类、再对 Δ_h 三分，三层耦合；解集拓扑含空集/单点/闭区间/双射线。',
    h3Evidence: {
      nonObviousBreakthrough: 'domain-R locks |a|<2; base flip; Δ_h tertiary split inside (0,1)',
      aboveHard14H2Contrast: 'chained domain-param then double-split inequality',
      deepStrategyOrLayeredNecessity: 'a*=2√2-2 cuts empty/point/interval',
      routineKillCheck: 'one-shot log simplify → miss empty branch for small a',
    },
    diagramRequirement: 'NOT_NEEDED',
  }),

  appItem({
    n: 48,
    chapterNo: 4,
    sectionCode: '4.4',
    sectionName: '对数函数',
    kpCode: 'rja.4.4.01',
    kpName: '对数函数概念',
    methodMain: 'equiv_transform',
    methodAux: 'classification',
    qtype: 'application',
    modelFamily: 'h3-log-product-exact-domain-match',
    coreObjective: '复合根号–对数使定义域恰为指定闭区间并排除 0<a<1',
    breakthrough:
      'a>1 时 (log_a x−1)(3−log_a x)≥0 ⇔ log_a x∈[1,3] ⇔ x∈[a,a^3]；与 [2,8] 对齐得唯一 a=2。0<a<1 时定义域落在 (0,1) 内，不可能。',
    contrastH2:
      'HARD14 定义域题常停在“写出不等式”；本题反推参数使定义域集合恒等，并必须否定底∈(0,1)。',
    stem:
      '设 $a>0,\\ a\\ne 1$，函数 $f(x)=\\sqrt{(\\log_a x-1)(3-\\log_a x)}$。求使 $f$ 的定义域恰好为 $[2,8]$ 的实数 $a$。',
    answer: '$a=2$',
    analysis:
      '先要 $x>0$，且 $(\\log_a x-1)(3-\\log_a x)\\ge 0$。\n' +
      '情形一：$a>1$。则 $\\log_a$ 递增，$(\\log_a x-1)(3-\\log_a x)\\ge 0\\Leftrightarrow \\log_a x\\in[1,3]\\Leftrightarrow x\\in[a,a^{3}]$。\n' +
      '令 $[a,a^{3}]=[2,8]$，得 $a=2$ 且 $a^{3}=8$，兼容。此时定义域恰为 $[2,8]$。\n' +
      '情形二：$0<a<1$。$\\log_a$ 递减，$\\log_a x\\in[1,3]\\Leftrightarrow x\\in[a^{3},a]$（因 $a^{3}<a$）。但 $a<1\\Rightarrow[a^{3},a]\\subset(0,1)$，不可能等于 $[2,8]$。\n' +
      '故唯一解 $a=2$。\n' +
      '（若漏掉 $0<a<1$ 的否定，或误写成 $x\\in[a,a^{3}]$ 对一切 a，会误判多解/无解。）',
    maxScore: 10,
    rubric: [
      { step: 'a>1 得定义域 [a,a³] 并匹配', score: 5 },
      { step: '否定 0<a<1', score: 5 },
    ],
    hardLevelReason:
      '集合恒等反解参数 + 底分类否证，不是套路指对化简。',
    h3Evidence: {
      nonObviousBreakthrough: 'exact set equality [a,a^3]=[2,8]; reject base in (0,1)',
      aboveHard14H2Contrast: 'inverse domain design vs forward inequality only',
      deepStrategyOrLayeredNecessity: 'two base regimes with incompatible topologies',
      routineKillCheck: 'solving a^3=8 without checking a=2 in log product → incomplete',
    },
    diagramRequirement: 'NOT_NEEDED',
  }),

  appItem({
    n: 49,
    chapterNo: 4,
    sectionCode: '4.3',
    sectionName: '对数',
    kpCode: 'rja.4.3.04',
    kpName: '对数方程初步',
    methodMain: 'equiv_transform',
    methodAux: 'special_value',
    qtype: 'application',
    modelFamily: 'h3-log-domain-R-zero-count-coupling',
    coreObjective: '定义域为 ℝ 与方程 f(x)=0 恰一实根的参数耦合',
    breakthrough:
      '恒正要求 a>1；f(x)=0 ⇔ 真数=1 得二次 Δ=4(2−a)，恰一根迫使 a=2，恰落在 a>1 可行域内。',
    contrastH2:
      'HARD14 常分开考“定义域为 ℝ”或“对数方程根的个数”；本题两条件咬合，缺一则 a 集不同。',
    stem:
      '设 $f(x)=\\log_a(x^{2}+2x+a)$（$a>0,\\ a\\ne 1$）。求使下列两条件同时成立的实数 $a$：\n' +
      '（i）$f$ 的定义域为 $\\mathbb{R}$；\n' +
      '（ii）方程 $f(x)=0$ 恰有一个实数解。',
    answer: '$a=2$',
    analysis:
      '（i）需 $g(x)=x^{2}+2x+a>0$ 对一切 $x$ 成立。开口向上，$\\Delta=4-4a=4(1-a)$。故需 $\\Delta<0\\Leftrightarrow a>1$（$a=1$ 已排除；若 $0<a<1$ 则最小值 $a-1<0$，真数变号）。于是（i）$\\Leftrightarrow a>1$。\n' +
      '（ii）$f(x)=0\\Leftrightarrow g(x)=1\\Leftrightarrow x^{2}+2x+(a-1)=0$。判别式 $\\Delta_1=4-4(a-1)=4(2-a)$。\n' +
      '恰一个实根 $\\Leftrightarrow\\Delta_1=0\\Leftrightarrow a=2$。此时根为 $x=-1$（二重根计一个解）。且 $a=2>1$，满足（i）；$g(x)=(x+1)^{2}+1\\ge 1>0$，定义域确为 $\\mathbb{R}$。\n' +
      '若 $a>2$：两根；$a\\in(1,2)$：两根；$a=2$：一根。故同时成立仅 $a=2$。',
    maxScore: 10,
    rubric: [
      { step: '（i）得 a>1', score: 4 },
      { step: '（ii）Δ1=0 得 a=2 并回代', score: 6 },
    ],
    hardLevelReason:
      '定义域约束与根的个数判别式在同一参数上截断，属于耦合而非套路运算。',
    h3Evidence: {
      nonObviousBreakthrough: 'domain forces a>1; zero-count forces a=2 inside it',
      aboveHard14H2Contrast: 'coupled domain-R + unique log-zero',
      deepStrategyOrLayeredNecessity: 'two discriminants on same a',
      routineKillCheck: 'solving only x^2+2x+(a-1)=0 without domain → extra roots',
    },
    diagramRequirement: 'NOT_NEEDED',
  }),

  appItem({
    n: 50,
    chapterNo: 4,
    sectionCode: '4.5',
    sectionName: '指数函数与对数函数综合',
    kpCode: 'rja.4.5.02',
    kpName: '对数应用',
    methodMain: 'equiv_transform',
    methodAux: 'special_value',
    qtype: 'application',
    modelFamily: 'h3-nested-log-endpoint-zero-golden',
    coreObjective: '嵌套指对定义域左端点赋值反锁黄金分割底',
    breakthrough:
      '对 a>1，√(log_a x−2) 要求 x≥a²，而 log_a(x−a) 要求 x>a；因 a²>a，定义域恒为 [a²,+∞)。再令左端点处 f(a²)=0，得 a−1=1/a，即 a=(1+√5)/2。',
    contrastH2:
      'HARD14 嵌套对数多只求定义域不等式；本题先认清定义域对一切 a>1 同构，再以端点方程选唯一底。',
    stem:
      '设 $a>1$，函数 $f(x)=\\sqrt{\\log_a x-2}+\\log_a(x-a)$。\n' +
      '（1）求 $f$ 的定义域（用 $a$ 表示）；\n' +
      '（2）若 $f$ 在其定义域的左端点处取值为 $0$，求 $a$，并写出此时的定义域。',
    answer:
      '（1）$[a^{2},+\\infty)$；（2）$a=\\dfrac{1+\\sqrt{5}}{2}$，定义域 $\\left[\\dfrac{3+\\sqrt{5}}{2},+\\infty\\right)$。',
    analysis:
      '（1）需 $\\log_a x\\ge 2$ 且 $x-a>0$，即 $x\\ge a^{2}$ 且 $x>a$。因 $a>1$ 有 $a^{2}>a$，故定义域为 $[a^{2},+\\infty)$。\n' +
      '（2）左端点为 $x=a^{2}$。此时 $\\sqrt{\\log_a a^{2}-2}=\\sqrt{2-2}=0$，故\n' +
      '$f(a^{2})=\\log_a(a^{2}-a)=\\log_a\\big(a(a-1)\\big)=1+\\log_a(a-1)$。\n' +
      '令其为 $0$：$1+\\log_a(a-1)=0\\Leftrightarrow\\log_a(a-1)=-1\\Leftrightarrow a-1=a^{-1}=\\dfrac{1}{a}$。\n' +
      '故 $a(a-1)=1\\Leftrightarrow a^{2}-a-1=0$。又 $a>1$，得 $a=\\dfrac{1+\\sqrt{5}}{2}$。\n' +
      '此时 $a^{2}=a+1=\\dfrac{3+\\sqrt{5}}{2}$，定义域为 $\\left[\\dfrac{3+\\sqrt{5}}{2},+\\infty\\right)$。并检验 $a^{2}-a=1>0$，对数有意义。',
    maxScore: 12,
    rubric: [
      { step: '（1）比较 a² 与 a 得定义域', score: 4 },
      { step: '端点方程化为 a²−a−1=0', score: 5 },
      { step: '取 a>1 根并写定义域', score: 3 },
    ],
    hardLevelReason:
      '先看穿定义域对 a>1 的一致性，再在端点耦合出黄金分割，非套路化简。',
    h3Evidence: {
      nonObviousBreakthrough: 'domain always [a^2,+∞); endpoint zero ⇒ golden ratio base',
      aboveHard14H2Contrast: 'nested log + endpoint value selects unique a',
      deepStrategyOrLayeredNecessity: 'dominance a^2>a then log equation',
      routineKillCheck: 'routine nested-log domain inequality alone → no unique a',
    },
    diagramRequirement: 'NOT_NEEDED',
  }),
]
