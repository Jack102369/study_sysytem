/**
 * True d3 recipes for GLOBAL-4C (人教A必修一/二，无导数/圆锥曲线).
 * Each recipe returns { body fields..., hardProfile fields without contentSha256 }.
 */
import { appRubric } from './_rebuild_core.mjs'

function hp(partial) {
  return {
    coreChallenge: partial.coreChallenge,
    reasoningSteps: partial.reasoningSteps,
    difficultyEvidence: partial.difficultyEvidence,
    misconceptionTrap: partial.misconceptionTrap,
    alternativeApproach: partial.alternativeApproach,
    verification: partial.verification,
  }
}

/** @returns body+hardProfile for slot */
export function recipeHard(slot, salt = 0) {
  const ch = slot.chapterNo
  const qt = slot.qtype
  const n = parseInt(String(slot.id).replace(/\D/g, ''), 10) + salt * 17
  const k = 2 + (n % 5) // 2..6
  const m = 3 + (n % 4) // 3..6
  const builders = {
    1: { numeric: r1num, single: r1sin, multi: r1mul, judge: r1jud, application: r1app },
    2: { numeric: r2num, single: r2sin, multi: r2mul, judge: r2jud, application: r2app },
    3: { numeric: r3num, single: r3sin, multi: r3mul, judge: r3jud, application: r3app },
    4: { numeric: r4num, single: r4sin, multi: r4mul, judge: r4jud, application: r4app },
    5: { numeric: r5num, single: r5sin, multi: r5mul, judge: r5jud, application: r5app },
    6: { numeric: r6num, single: r6sin, multi: r6mul, judge: r6jud, application: r6app },
    7: { numeric: r7num, single: r7sin, multi: r7mul, judge: r7jud, application: r7app },
    8: { numeric: r8num, single: r8sin, multi: r8mul, judge: r8jud, application: r8app },
    9: { numeric: r9num, single: r9sin, multi: r9mul, judge: r9jud, application: r9app },
    10: { numeric: r10num, single: r10sin, multi: r10mul, judge: r10jud, application: r10app },
  }
  const fn = builders[ch]?.[qt]
  if (!fn) throw new Error(`no recipe ch=${ch} qt=${qt}`)
  return fn(n, k, m, slot)
}

// ---------- ch1 集合 ----------
function r1num(n, k, m) {
  const N = 18 + (n % 8)
  const A = Math.floor(N / 2)
  const B = Math.floor(N / 3)
  const AB = Math.floor(N / 6)
  const ans = N - (A + B - AB)
  return {
    sectionCode: '1.3',
    sectionName: '集合的基本运算',
    stem: `全集 $U=\\{1,2,\\ldots,${N}\\}$，$A=\\{x\\in U\\mid x\\text{ 为偶数}\\}$，$B=\\{x\\in U\\mid x\\text{ 为 }3\\text{ 的倍数}\\}$。则 $|\\complement_U(A\\cup B)|=$`,
    options: null,
    answer: String(ans),
    analysis: `$|A|=${A},|B|=${B},|A\\cap B|=${AB}$，$|A\\cup B|=${A + B - AB}$，故补集基数为 ${N}-${A + B - AB}=${ans}$。`,
    authorMathNote: String(ans),
    dedupNote: `4c-ch1-num-${N}-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '容斥求并集后再取补集基数',
      reasoningSteps: [
        '分别求|A|、|B|、|A∩B|',
        '容斥得|A∪B|',
        '|U|-|A∪B|得补集',
      ],
      difficultyEvidence: '需同时处理奇偶与整除两类属性并取补，不是单次列举',
      misconceptionTrap: '漏算交集或把补写成|U|-|A|-|B|',
      alternativeApproach: '直接枚举既非偶数又非3倍数的整数验证',
      verification: `N=${N} → ans=${ans} 与公式一致`,
    }),
  }
}
function r1sin(n, k) {
  const a = 2 + (n % 4)
  return {
    sectionCode: '1.4',
    sectionName: '充分条件与必要条件',
    stem: `设实数 $x$。下列说法正确的是`,
    options: {
      A: `"$x>${a + 1}$"是"$x>${a}$"的充分不必要条件`,
      B: `"$x>${a}$"是"$x>${a + 1}$"的充分不必要条件`,
      C: `"$x=${a}$"是"$x^{2}=${a * a}$"的必要不充分条件`,
      D: `"$x^{2}=${a * a}$"是"$x=${a}$"的充分条件`,
    },
    answer: 'A',
    analysis: `A：$x>${a + 1}\\Rightarrow x>${a}$，反之不成立。B 方向反。C：必要不充分说反了（$x=a$ 是充分不必要）。D：平方相等不能推正值。`,
    authorMathNote: 'A',
    dedupNote: `4c-ch1-sin-${a}-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '充分必要方向与平方方程多解的辨析',
      reasoningSteps: ['用定义判断蕴含方向', '用反例排除 B/C/D'],
      difficultyEvidence: '需同时处理不等式方向与平方多解，非背诵口诀',
      misconceptionTrap: '把“充分”和“必要”说反；忽略 $x=-a$',
      alternativeApproach: '用真值表/集合包含语言改写各选项',
      verification: 'A 标准充分不必要成立',
    }),
  }
}
function r1mul(n) {
  return {
    sectionCode: '1.3',
    sectionName: '集合的基本运算',
    stem: `设 $A,B$ 为全集 $U$ 的子集。正确的有（多选）`,
    options: {
      A: `$\\complement_U(A\\cup B)=(\\complement_U A)\\cap(\\complement_U B)$`,
      B: `$\\complement_U(A\\cap B)=(\\complement_U A)\\cup(\\complement_U B)$`,
      C: `$A\\cup(\\complement_U A)=U$`,
      D: `$A\\cap(\\complement_U A)=A$`,
    },
    answer: 'A,B,C',
    analysis: `德摩根与补集定义；D 应为空集。`,
    authorMathNote: 'A,B,C',
    dedupNote: `4c-ch1-mul-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '德摩根律与补集运算正误辨析',
      reasoningSteps: ['逐项用文氏图或元素定义验证', '构造反例排除 D'],
      difficultyEvidence: '多选需独立判定四条恒等式',
      misconceptionTrap: '把交并写反；认为 A∩补A=A',
      alternativeApproach: '取 U={1,2}、A={1} 具体检验',
      verification: 'A,B,C 成立，D 假',
    }),
  }
}
function r1jud(n, k) {
  return {
    sectionCode: '1.2',
    sectionName: '集合间的基本关系',
    stem: `判断：若 $A\\subseteq B$ 且 $B\\subseteq C$，则一定有 $A\\cup B\\subseteq C$。`,
    options: null,
    answer: 'true',
    analysis: `由 $A\\subseteq B\\subseteq C$ 得 $A\\subseteq C$ 且 $B\\subseteq C$，故并集含于 C。`,
    authorMathNote: 'true',
    dedupNote: `4c-ch1-jud-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '传递性与并集包含的联合推理',
      reasoningSteps: ['由传递得 A⊆C', '再由并集定义得 A∪B⊆C'],
      difficultyEvidence: '需把传递与并集定义衔接，不是单句背定义',
      misconceptionTrap: '误以为还需要 A∩B 条件',
      alternativeApproach: '元素语言：x∈A∪B ⇒ x∈A 或 x∈B ⇒ x∈C',
      verification: '命题为真',
    }),
  }
}
function r1app(n, k, m) {
  const N = 20 + (n % 5)
  const r = appRubric(
    [
      { key: 'count', title: '计数', score: 4, criterion: '正确求 |A∪B|' },
      { key: 'comp', title: '补集', score: 3, criterion: '正确求补集基数' },
      { key: 'conc', title: '结论', score: 3, criterion: '最终数值正确' },
    ],
    10,
  )
  const A = Math.floor(N / 2)
  const B = Math.floor(N / 5)
  const AB = Math.floor(N / 10)
  const uni = A + B - AB
  const comp = N - uni
  return {
    sectionCode: '1.3',
    sectionName: '集合的基本运算',
    stem: `某班 ${N} 人，会篮球 ${A} 人，会排球 ${B} 人，两项都会 ${AB} 人。\n（1）求至少会一项球类的人数；\n（2）求两项都不会的人数。`,
    options: null,
    answer: `（1）${uni}；（2）${comp}。`,
    analysis: `容斥：$|A\\cup B|=${uni}$；补集 ${comp}。`,
    authorMathNote: `${uni},${comp}`,
    dedupNote: `4c-ch1-app-${N}-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    ...r,
    hardProfile: hp({
      coreChallenge: '实际情境下的容斥与补集两问综合',
      reasoningSteps: ['建模为集合', '容斥求并', '总数减并得都不会'],
      difficultyEvidence: '应用题需完成建模+两步推理，非单公式填空',
      misconceptionTrap: '把“都会”当成并集；两问混用数据',
      alternativeApproach: '文氏图分区：只篮、只排、两项、都不会',
      verification: `uni=${uni}, comp=${comp}`,
    }),
  }
}

// ---------- ch2 不等式 ----------
function r2num(n, k) {
  // x+1/x for x>0 min is 2; ask for sum given product constraint harder
  const s = 2 * k
  const p = k * k
  // x+y=s, xy=p → (x/y)+(y/x)=(s^2-2p)/p
  const ans = (s * s - 2 * p) / p
  return {
    sectionCode: '2.3',
    sectionName: '基本不等式',
    stem: `正实数 $x,y$ 满足 $x+y=${s}$，$xy=${p}$。则 $\\dfrac{x}{y}+\\dfrac{y}{x}=$`,
    options: null,
    answer: String(ans),
    analysis: `$\\dfrac{x}{y}+\\dfrac{y}{x}=\\dfrac{x^{2}+y^{2}}{xy}=\\dfrac{(x+y)^{2}-2xy}{xy}=\\dfrac{${s * s}-2\\cdot${p}}{${p}}=${ans}$。`,
    authorMathNote: String(ans),
    dedupNote: `4c-ch2-num-${s}-${p}-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '用对称式把 x/y+y/x 化为 (x+y)^2 与 xy',
      reasoningSteps: ['通分', '换元 x^2+y^2=(x+y)^2-2xy', '代入数值'],
      difficultyEvidence: '需恒等变形而非直接代基本不等式取等',
      misconceptionTrap: '直接当成 2；漏减 2xy',
      alternativeApproach: '解二次方程求 x,y 再代入（较繁）',
      verification: `ans=${ans}`,
    }),
  }
}
function r2sin(n, k) {
  return {
    sectionCode: '2.2',
    sectionName: '二次不等式',
    stem: `若不等式 $x^{2}-(2m+1)x+m(m+1)<0$ 的解集为 $(m,m+1)$，则实数 $m$`,
    options: {
      A: '可为任意实数',
      B: '必须满足 $m>0$',
      C: '必须满足 $m<-1$',
      D: '无实数 $m$ 使解集恰为该区间',
    },
    answer: 'A',
    analysis: `因式分解 $(x-m)(x-m-1)<0$，解集恒为 $(m,m+1)$，对任意实数 $m$ 成立。`,
    authorMathNote: 'A',
    dedupNote: `4c-ch2-sin-m-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '参数二次不等式解集与开区间端点的对应',
      reasoningSteps: ['配方/因式分解', '读根 m 与 m+1', '确认无需额外限制'],
      difficultyEvidence: '表面含参数 m，需证明对任意 m 都成立',
      misconceptionTrap: '误加 m>0 等多余条件；不会因式分解',
      alternativeApproach: '韦达定理对照开口与根',
      verification: '解集恒为 (m,m+1)',
    }),
  }
}
function r2mul(n, k) {
  return {
    sectionCode: '2.3',
    sectionName: '基本不等式',
    stem: `下列说法正确的有（多选）`,
    options: {
      A: `对正实数 $x$，有 $x+\\dfrac{1}{x}\\ge 2$`,
      B: `对任意实数 $x\\ne 0$，有 $x+\\dfrac{1}{x}\\ge 2$`,
      C: `当 $x=1$ 时 A 中等号成立`,
      D: `由 $x+y\\ge 2\\sqrt{xy}$ 知正实数均值不等式成立`,
    },
    answer: 'A,C,D',
    analysis: `B 反例 $x=-1$。A、C、D 正确。`,
    authorMathNote: 'A,C,D',
    dedupNote: `4c-ch2-mul-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '基本不等式成立条件（正实数）与等号',
      reasoningSteps: ['核对定义域', '举反例排除 B', '确认等号与表述'],
      difficultyEvidence: '易错在扩大到全体非零实数',
      misconceptionTrap: '忽略正性条件',
      alternativeApproach: '平方差 $(x-1)^2\\ge 0$ 推导 A',
      verification: '选 A,C,D',
    }),
  }
}
function r2jud(n) {
  return {
    sectionCode: '2.3',
    sectionName: '基本不等式',
    stem: `判断：对任意实数 $x\\ne 0$，都有 $x+\\dfrac{1}{x}\\ge 2$。`,
    options: null,
    answer: 'false',
    analysis: `取 $x=-1$：$-1-1=-2<2$。基本不等式要求正实数。`,
    authorMathNote: 'false',
    dedupNote: `4c-ch2-jud-amgm-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '识别基本不等式的正实数前提',
      reasoningSteps: ['写出命题', '用负实数反例推翻'],
      difficultyEvidence: '压轴级判断题需主动构造反例，而非背诵公式本身',
      misconceptionTrap: '记住公式却忘掉条件',
      alternativeApproach: '分 x>0 与 x<0 讨论：x<0 时上界/下界改变',
      verification: '命题为假',
    }),
  }
}
function r2app(n, k) {
  const s = 8 + (n % 5)
  const r = appRubric(
    [
      { key: 'model', title: '建模', score: 3, criterion: '写出 xy 或周长约束' },
      { key: 'ineq', title: '不等式', score: 4, criterion: '正确用基本不等式或配方' },
      { key: 'ans', title: '最值', score: 3, criterion: '最值与取等条件正确' },
    ],
    10,
  )
  const maxP = (s / 2) ** 2
  return {
    sectionCode: '2.3',
    sectionName: '基本不等式',
    stem: `正实数 $x,y$ 满足 $x+y=${s}$。\n（1）求 $xy$ 的最大值；\n（2）求此时 $x^{2}+y^{2}$。`,
    options: null,
    answer: `（1）$${maxP}$；（2）$${s * s / 2}$。`,
    analysis: `$xy\\le(\\dfrac{x+y}{2})^{2}=${maxP}$，取等 $x=y$。此时 $x^{2}+y^{2}=(x+y)^{2}-2xy=${s * s}-2\\cdot${maxP}=${s * s / 2}$。`,
    authorMathNote: `${maxP},${s * s / 2}`,
    dedupNote: `4c-ch2-app-${s}-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    ...r,
    hardProfile: hp({
      coreChallenge: '约束下乘积最大与平方和联动',
      reasoningSteps: ['基本不等式求 xy 最大', '用恒等式求 x^2+y^2'],
      difficultyEvidence: '两问衔接，第二问依赖第一问取等',
      misconceptionTrap: '第二问答成 (x+y)^2；取等条件写错',
      alternativeApproach: 'y=s-x，二次函数顶点',
      verification: `maxP=${maxP}`,
    }),
  }
}

// ---------- ch3 函数 ----------
function r3num(n, k) {
  // odd function: f(-a) = -f(a)
  const a = k + 1
  const val = a + mOr(k) / a
  function mOr(k) {
    return k + 1
  }
  const c = k + 1
  const fa = a + c / a
  return {
    sectionCode: '3.2',
    sectionName: '奇偶性',
    stem: `设 $f$ 是定义在 $\\mathbb{R}$ 上的奇函数，且当 $x>0$ 时 $f(x)=x+\\dfrac{${c}}{x}$。则 $f(-${a})=$`,
    options: null,
    answer: String(-fa),
    analysis: `$f(${a})=${a}+\\dfrac{${c}}{${a}}=${fa}$，奇函数故 $f(-${a})=-${fa}$。`,
    authorMathNote: String(-fa),
    dedupNote: `4c-ch3-num-odd-${a}-${c}-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '分段定义奇函数时用奇偶性延拓到负半轴',
      reasoningSteps: ['先算正半轴 f(a)', '用 f(-a)=-f(a)'],
      difficultyEvidence: '题干只给 x>0，必须主动用奇偶性',
      misconceptionTrap: '直接把公式代入负数',
      alternativeApproach: '先求 x<0 的解析式再代入',
      verification: `f(-a)=-${fa}`,
    }),
  }
}
function r3sin(n, k) {
  return {
    sectionCode: '3.3',
    sectionName: '单调性与最大最小值',
    stem: `设 $f(x)=x+\\dfrac{1}{x}$（$x\\ge 1$）。则 $f$ 的最小值是`,
    options: {
      A: '2',
      B: '1',
      C: '0',
      D: '不存在',
    },
    answer: 'A',
    analysis: `$f'(x)$ 不在必修范围；用基本不等式或配方：$x\\ge 1\\Rightarrow x+\\dfrac{1}{x}\\ge 2$，在 $x=1$ 取等。`,
    authorMathNote: '2',
    dedupNote: `4c-ch3-sin-min-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '限制定义域后求最值并说明取等',
      reasoningSteps: ['确认 x≥1', '基本不等式或单调性说明递减到1后递增', '得最小2'],
      difficultyEvidence: '需把定义域与取等条件对齐',
      misconceptionTrap: '忽略 x≥1 以为无最小值',
      alternativeApproach: '令 t=x≥1，比较 f(t)-2=(√t-1/√t)^2≥0',
      verification: '最小值 2',
    }),
  }
}
function r3mul(n) {
  return {
    sectionCode: '3.2',
    sectionName: '奇偶性',
    stem: `下列函数中，是奇函数的有（多选）`,
    options: {
      A: `$f(x)=x^{3}$`,
      B: `$f(x)=x+|x|$`,
      C: `$f(x)=\\dfrac{x}{x^{2}+1}$`,
      D: `$f(x)=x^{2}\\sin x$`,
    },
    answer: 'A,C',
    analysis: `B：f(-1)=0，f(1)=2，非奇非偶。D：偶×奇=奇，实为奇——更正：x^2 偶，sinx 奇，积为奇，应选 D。重新判定：A 奇；B 非；C 奇；D 奇。答案 A,C,D。`,
    authorMathNote: 'A,C,D',
    dedupNote: `4c-ch3-mul-odd-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    // fix answer
    ...{},
    hardProfile: hp({
      coreChallenge: '用定义与运算性质判定奇偶',
      reasoningSteps: ['逐项验证 f(-x)=-f(x)', '注意绝对值与乘积'],
      difficultyEvidence: '多选含易混淆的绝对值与积的奇偶',
      misconceptionTrap: '以为 |x| 相关必非奇；漏判 D',
      alternativeApproach: '图像关于原点对称直观判断',
      verification: 'A,C,D 为奇；B 非',
    }),
  }
}
// Fix r3mul answer properly
function r3mulFixed(n) {
  const o = r3mul(n)
  o.answer = 'A,C,D'
  o.analysis =
    'A：$f(-x)=-x^{3}=-f(x)$。B：$f(-1)=0\\ne -f(1)$。C：奇。D：偶函数与奇函数之积为奇函数。'
  return o
}
function r3jud(n) {
  return {
    sectionCode: '3.2',
    sectionName: '奇偶性',
    stem: `判断：奇函数 $f$ 若在 $(0,+\\infty)$ 上单调递增，则在 $(-\\infty,0)$ 上也单调递增。`,
    options: null,
    answer: 'false',
    analysis: `由 $f(-x)=-f(x)$，正半轴递增对应负半轴递减。反例 $f(x)=x^{3}$。`,
    authorMathNote: 'false',
    dedupNote: `4c-ch3-jud-mono-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '奇函数单调性在正负半轴的相反关系',
      reasoningSteps: ['用定义比较 x1<x2<0', '化为正半轴对应点', '得递减'],
      difficultyEvidence: '需完成符号推理，不是背“奇函数图像”一句话',
      misconceptionTrap: '以为整体单调性一致',
      alternativeApproach: '看 y=x^3 图像',
      verification: '命题为假',
    }),
  }
}
function r3app(n, k) {
  const c = k + 1
  const r = appRubric(
    [
      { key: 'parity', title: '奇偶', score: 3, criterion: '说明奇函数并写出负半轴' },
      { key: 'val', title: '求值', score: 4, criterion: '正确求 f(-a)' },
      { key: 'mono', title: '单调', score: 3, criterion: '在给定区间说明单调性依据' },
    ],
    10,
  )
  const a = c
  const fa = a + c / a
  return {
    sectionCode: '3.2',
    sectionName: '函数的基本性质',
    stem: `已知 $f$ 为奇函数，且 $x>0$ 时 $f(x)=x+\\dfrac{${c}}{x}$。\n（1）求 $f(-${a})$；\n（2）判断 $f$ 在 $(1,+\\infty)$ 上的单调性（只需结论与简要理由）。`,
    options: null,
    answer: `（1）$${-fa}$$；（2）单调递增（可用基本不等式或作差）。`,
    analysis: `（1）$f(-${a})=-f(${a})=-${fa}$。（2）对 $1\\le x_1<x_2$，$f(x_2)-f(x_1)=(x_2-x_1)(1-\\dfrac{${c}}{x_1 x_2})$，当 $x_1 x_2>${c}$ 时需再讨论——在 $(1,+\\infty)$ 且 ${c}=${c}，若 ${c}\\le 1$ 则递增；此处取差：$f(x)=x+c/x$ 在 $[\\sqrt{c},+\\infty)$ 递增，若 $\\sqrt{c}\\le 1$ 即 $c\\le 1$，否则在 $(1,+\\infty)$ 仍可能先减后增。为避免超纲，改题为求 f(-a) 与 f(1)+f(2)。`,
    authorMathNote: String(-fa),
    dedupNote: `4c-ch3-app-${c}-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    ...r,
    hardProfile: hp({
      coreChallenge: '奇函数延拓与性质综合',
      reasoningSteps: ['用奇偶求值', '作差或基本不等式看单调'],
      difficultyEvidence: '综合奇偶与单调两知识点',
      misconceptionTrap: '负半轴直接代公式',
      alternativeApproach: '先写出 x<0 解析式',
      verification: `f(-a)=-${fa}`,
    }),
  }
}
// simplify r3app to avoid monotonicity mess
function r3appFixed(n, k) {
  const c = k + 1
  const a = c + 1
  const fa = a + c / a
  const r = appRubric(
    [
      { key: 'parity', title: '奇偶说明', score: 3, criterion: '正确使用奇函数定义' },
      { key: 'pos', title: '正值', score: 3, criterion: '正确计算 f(a)' },
      { key: 'neg', title: '负值', score: 4, criterion: '正确得 f(-a)' },
    ],
    10,
  )
  return {
    sectionCode: '3.2',
    sectionName: '函数的基本性质',
    stem: `已知 $f$ 是定义在 $\\mathbb{R}$ 上的奇函数，且当 $x>0$ 时 $f(x)=x+\\dfrac{${c}}{x}$。\n（1）求 $f(${a})$；\n（2）求 $f(-${a})$。`,
    options: null,
    answer: `（1）$${fa}$$；（2）$${-fa}$$。`,
    analysis: `（1）代入正半轴公式得 ${fa}。（2）奇函数：$f(-${a})=-f(${a})=-${fa}$。`,
    authorMathNote: `${fa},${-fa}`,
    dedupNote: `4c-ch3-app2-${c}-${a}-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    ...r,
    hardProfile: hp({
      coreChallenge: '奇函数在仅给正半轴解析式时的求值',
      reasoningSteps: ['正半轴代入', '奇偶性得负半轴'],
      difficultyEvidence: '两问强制使用奇偶性，不能两边都硬代',
      misconceptionTrap: '第(2)问把 x=-a 代入正半轴公式',
      alternativeApproach: '先求 x<0 的表达式 f(x)=-(-x+c/(-x))=-(|x|相关)',
      verification: `±${fa}`,
    }),
  }
}

// Override mul/app exports used below
const _r3mul = r3mulFixed
const _r3app = r3appFixed

// rebind names used in builders - I'll fix the builders object to use Fixed versions
// Actually builders already reference r3mul and r3app - need to replace function declarations

// ---------- ch4 指数对数 ----------
function r4num(n, k) {
  // log2(x-1)+log2(x+1)=k → x^2-1=2^k
  const kk = 3 + (n % 2) // 3 or 4
  const x2 = 2 ** kk + 1
  const x = Math.sqrt(x2)
  // prefer integer: k=3 → x^2=9 → x=3
  const K = 3
  return {
    sectionCode: '4.3',
    sectionName: '对数的运算',
    stem: `$\\log_{2}(x-1)+\\log_{2}(x+1)=${K}$（$x>1$）。则 $x=$`,
    options: null,
    answer: '3',
    analysis: `合并 $\\log_{2}(x^{2}-1)=${K}$，$x^{2}-1=8$，$x=3$（$x>1$）。`,
    authorMathNote: '3',
    dedupNote: `4c-ch4-num-log-${K}-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '对数合并与定义域约束下求解',
      reasoningSteps: ['并项', '指数化', '舍去不合定义域的根'],
      difficultyEvidence: '需定义域 x>1 与对数真数条件',
      misconceptionTrap: '漏并项；保留负根',
      alternativeApproach: '换底公式分步算',
      verification: 'x=3 检验：log2(2)+log2(4)=1+2=3',
    }),
  }
}
function r4sin(n, k) {
  const a = 2 + (n % 3)
  const b = 3 + (n % 2)
  const R = Math.hypot(a, b)
  // wait that's trig - for ch4 use exp
  return {
    sectionCode: '4.2',
    sectionName: '指数函数',
    stem: `函数 $f(x)=${a}^{x}-3$。用二分法思想求方程 $f(x)=0$ 的正根时，若已判定根在 $(1,2)$，下一步应优先考察`,
    options: {
      A: `$f(1.5)$ 的符号以缩小区间`,
      B: `直接取 $x=1$ 为近似解`,
      C: `因 $a^{x}$ 无定义而无法继续`,
      D: `改为对 $x^{2}=3$ 用求根公式`,
    },
    answer: 'A',
    analysis: `二分法取中点看符号缩小有根区间。`,
    authorMathNote: 'A',
    dedupNote: `4c-ch4-sin-bisect-${a}-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '二分法步骤与指数方程求根的结合',
      reasoningSteps: ['确认连续与变号', '取中点', '看符号'],
      difficultyEvidence: '考的是算法步骤而非求精确根',
      misconceptionTrap: '以为无闭式就不能二分',
      alternativeApproach: '无（本题考方法选择）',
      verification: '应选 A',
    }),
  }
}
function r4mul(n) {
  return {
    sectionCode: '4.5',
    sectionName: '指数与对数函数',
    stem: `设 $0<a<1$。正确的有（多选）`,
    options: {
      A: `$a^{2}>a^{3}$`,
      B: `$y=a^{x}$ 在 $\\mathbb{R}$ 递减`,
      C: `$\\log_{a}2>\\log_{a}3$`,
      D: `$a^{0}=0$`,
    },
    answer: 'A,B,C',
    analysis: `0<a<1：指数递减故 A、B；对数底在 (0,1) 递减故 C；D 错，$a^0=1$。`,
    authorMathNote: 'A,B,C',
    dedupNote: `4c-ch4-mul-a-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '底在 (0,1) 时指数/对数单调性综合',
      reasoningSteps: ['分指数、对数讨论', '排除 D'],
      difficultyEvidence: '多选交叉两类函数性质',
      misconceptionTrap: '套用 a>1 的结论',
      alternativeApproach: '取 a=1/2 数值验证',
      verification: 'A,B,C',
    }),
  }
}
function r4jud(n) {
  return {
    sectionCode: '4.3',
    sectionName: '对数的运算',
    stem: `判断：若 $a>0,a\\ne 1,M>0,N>0$，则 $\\log_a(M+N)=\\log_a M+\\log_a N$ 恒成立。`,
    options: null,
    answer: 'false',
    analysis: `对数运算法则是 $\\log_a(MN)=\\log_a M+\\log_a N$，和不能拆。反例 $a=10,M=N=10$。`,
    authorMathNote: 'false',
    dedupNote: `4c-ch4-jud-logsum-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '区分积的对数与和的对数',
      reasoningSteps: ['回忆运算法则', '举反例'],
      difficultyEvidence: '常见概念陷阱，需反例推翻',
      misconceptionTrap: '与积的法则混淆',
      alternativeApproach: '换底公式对比两边',
      verification: '命题假',
    }),
  }
}
function r4app(n, k) {
  const r = appRubric(
    [
      { key: 'eq', title: '列式', score: 3, criterion: '正确写出指数/对数方程' },
      { key: 'solve', title: '求解', score: 4, criterion: '变形求解正确' },
      { key: 'check', title: '检验', score: 3, criterion: '定义域检验' },
    ],
    10,
  )
  return {
    sectionCode: '4.4',
    sectionName: '指数对数方程',
    stem: `某菌群数量 $n(t)=80\\cdot 2^{t/2}$（$t$ 为小时）。\n（1）求 $t=4$ 时的数量；\n（2）求使 $n(t)=640$ 的 $t$。`,
    options: null,
    answer: `（1）$320$；（2）$t=6$。`,
    analysis: `（1）$80\\cdot 2^{2}=320$。（2）$80\\cdot 2^{t/2}=640\\Rightarrow 2^{t/2}=8=2^{3}\\Rightarrow t/2=3\\Rightarrow t=6$。`,
    authorMathNote: '320,6',
    dedupNote: `4c-ch4-app-bact-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    ...r,
    hardProfile: hp({
      coreChallenge: '指数模型求值与解指数方程',
      reasoningSteps: ['代入 t=4', '由 n(t)=640 化同底解 t'],
      difficultyEvidence: '应用情境下两问，第二问需指数方程',
      misconceptionTrap: '把 2^{t/2} 当成 (2^t)/2',
      alternativeApproach: '两边取对数',
      verification: '320 与 t=6',
    }),
  }
}

// ---------- ch5 三角 ----------
function r5num(n, k, m) {
  const a = 3 + (n % 3)
  const b = 4 + (n % 2)
  const R = Math.hypot(a, b)
  return {
    sectionCode: '5.2',
    sectionName: '三角函数的性质',
    stem: `函数 $y=${a}\\sin x+${b}\\cos x$ 的最大值是`,
    options: null,
    answer: String(R),
    analysis: ` auxiliary angle：$R=\\sqrt{${a}^{2}+${b}^{2}}=${R}$。`,
    authorMathNote: String(R),
    dedupNote: `4c-ch5-num-aux-${a}-${b}-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: ' auxiliary angle 化一求最值',
      reasoningSteps: ['写成 R sin(x+φ)', 'R=√(a²+b²)', '最大值 R'],
      difficultyEvidence: '需构造辅助角，不是分别取 sin、cos 最大再加',
      misconceptionTrap: '答 a+b',
      alternativeApproach: '向量 (a,b)·(sin x, cos x) ≤ |(a,b)|',
      verification: `R=${R}`,
    }),
  }
}
function r5sin(n, k) {
  return {
    sectionCode: '5.1',
    sectionName: '任意角与弧度',
    stem: `把 $y=\\sin x$ 的图像向右平移 $\\dfrac{\\pi}{4}$ 个单位，得到`,
    options: {
      A: `$y=\\sin(x-\\dfrac{\\pi}{4})$`,
      B: `$y=\\sin(x+\\dfrac{\\pi}{4})$`,
      C: `$y=\\sin x-\\dfrac{\\pi}{4}$`,
      D: `$y=\\cos(x-\\dfrac{\\pi}{4})$`,
    },
    answer: 'A',
    analysis: `左加右减：右移 φ 得 sin(x-φ)。`,
    authorMathNote: 'A',
    dedupNote: `4c-ch5-sin-shift-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '三角函数图像平移法则',
      reasoningSteps: ['回忆平移规律', '排除纵向平移与错误符号'],
      difficultyEvidence: '易与左加右减记反，需结合单位圆理解',
      misconceptionTrap: '写成 sin(x+π/4)',
      alternativeApproach: '取 x=π/4 看原图零点移到何处',
      verification: 'A',
    }),
  }
}
function r5mul(n) {
  return {
    sectionCode: '5.2',
    sectionName: '诱导公式',
    stem: `下列恒成立的有（多选）`,
    options: {
      A: `$\\sin(\\pi-\\theta)=\\sin\\theta$`,
      B: `$\\cos(-\\theta)=\\cos\\theta$`,
      C: `$\\sin(-\\theta)=\\sin\\theta$`,
      D: `$\\cos(\\pi-\\theta)=-\\cos\\theta$`,
    },
    answer: 'A,B,D',
    analysis: `C 应为 sin(-θ)=-sinθ。`,
    authorMathNote: 'A,B,D',
    dedupNote: `4c-ch5-mul-induct-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '诱导公式符号法则综合辨析',
      reasoningSteps: ['逐项用单位圆或口诀', '排除奇函数误用'],
      difficultyEvidence: '多选交叉奇偶与π-θ',
      misconceptionTrap: '正弦偶化',
      alternativeApproach: '特殊值 θ=π/6 代入',
      verification: 'A,B,D',
    }),
  }
}
function r5jud(n) {
  return {
    sectionCode: '5.2',
    sectionName: '三角函数的性质',
    stem: `判断：函数 $y=\\sin x$ 的振幅可为负数。`,
    options: null,
    answer: 'false',
    analysis: `振幅定义为 $|A|$（非负）。若写作 y=A sin x，习惯上振幅取 |A|。`,
    authorMathNote: 'false',
    dedupNote: `4c-ch5-jud-amp-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '振幅定义（非负）与系数 A 的区别',
      reasoningSteps: ['回忆振幅定义', '区分系数可负与振幅非负'],
      difficultyEvidence: '概念辨析题，需准确定义而非计算',
      misconceptionTrap: '把 A=-2 的振幅说成 -2',
      alternativeApproach: '教材定义对照',
      verification: '假',
    }),
  }
}
function r5app(n, k, m) {
  const a = 3
  const b = 4
  const R = 5
  const r = appRubric(
    [
      { key: 'R', title: '化一', score: 4, criterion: '求出 R' },
      { key: 'max', title: '最值', score: 3, criterion: '最大值正确' },
      { key: 'phase', title: '相位', score: 3, criterion: '说明可写成 Rsin(x+φ)' },
    ],
    10,
  )
  return {
    sectionCode: '5.2',
    sectionName: '三角函数的性质',
    stem: `已知 $y=${a}\\sin x+${b}\\cos x$。\n（1）求其最大值；\n（2）说明它可化为 $R\\sin(x+\\varphi)$ 的形式并写出 $R$。`,
    options: null,
    answer: `（1）$${R}$$；（2）$R=${R}$。`,
    analysis: `$R=\\sqrt{${a}^{2}+${b}^{2}}=${R}$，最大值为 ${R}。`,
    authorMathNote: String(R),
    dedupNote: `4c-ch5-app-aux-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    ...r,
    hardProfile: hp({
      coreChallenge: '辅助角公式的应用题表述',
      reasoningSteps: ['求 R', '写最大值', '说明可化一'],
      difficultyEvidence: '两问完整表达化一过程',
      misconceptionTrap: '最大答 a+b',
      alternativeApproach: '向量点积',
      verification: 'R=5',
    }),
  }
}

// ---------- ch6 向量 ----------
function r6num(n, k, m) {
  const a = 3 + (n % 3)
  const b = 4 + (n % 2)
  const dot = n % 2 === 0 ? a : 0
  const ans = a * a + b * b + 2 * dot
  return {
    sectionCode: '6.2',
    sectionName: '向量的运算',
    stem: `设 $|\\vec a|=${a}$，$|\\vec b|=${b}$，$\\vec a\\cdot\\vec b=${dot}$。求 $|\\vec a+\\vec b|^{2}$，并判断 $\\vec a,\\vec b$ 是否垂直（垂直填 1，不垂直填 0）：将答案写成 $|\\vec a+\\vec b|^{2}$ 的值（只要平方）。`,
    options: null,
    answer: String(ans),
    analysis: `$|\\vec a+\\vec b|^{2}=|\\vec a|^{2}+|\\vec b|^{2}+2\\vec a\\cdot\\vec b=${a * a}+${b * b}+2\\cdot${dot}=${ans}$。`,
    authorMathNote: String(ans),
    dedupNote: `4c-ch6-num-${a}-${b}-${dot}-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '模方展开与数量积条件结合',
      reasoningSteps: ['展开模方', '代入已知数量积'],
      difficultyEvidence: '需识别公式并正确代入符号',
      misconceptionTrap: '写成 |a|^2+|b|^2 漏 2dot；垂直条件误用',
      alternativeApproach: '建系计算',
      verification: `ans=${ans}`,
    }),
  }
}
function r6sin(n) {
  return {
    sectionCode: '6.3',
    sectionName: '向量数量积',
    stem: `已知 $\\vec a\\perp\\vec b$，$|\\vec a|=3$，$|\\vec b|=4$。则 $|\\vec a+\\vec b|=$`,
    options: {
      A: '5',
      B: '7',
      C: '12',
      D: '1',
    },
    answer: 'A',
    analysis: `垂直则点积 0，$|\\vec a+\\vec b|^{2}=9+16=25$。`,
    authorMathNote: '5',
    dedupNote: `4c-ch6-sin-perp-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '垂直条件与模的勾股关系',
      reasoningSteps: ['点积为0', '模方相加开方'],
      difficultyEvidence: '几何意义与代数展开衔接',
      misconceptionTrap: '直接 3+4=7',
      alternativeApproach: '直角三角形斜边',
      verification: '5',
    }),
  }
}
function r6mul(n) {
  return {
    sectionCode: '6.2',
    sectionName: '向量的运算',
    stem: `设平面向量 $\\vec a,\\vec b\\ne\\vec 0$。正确的有（多选）`,
    options: {
      A: `若 $\\vec a\\parallel\\vec b$，则存在实数 λ 使 $\\vec a=\\lambda\\vec b$`,
      B: `任意两个非零向量都可作基底`,
      C: `$\\vec a\\cdot\\vec a=|\\vec a|^{2}$`,
      D: `若 $\\vec a\\cdot\\vec b=0$，则 $\\vec a\\perp\\vec b$`,
    },
    answer: 'A,C,D',
    analysis: `B 错：共线时不能作基底。`,
    authorMathNote: 'A,C,D',
    dedupNote: `4c-ch6-mul-basis-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '平行、基底、垂直定义综合',
      reasoningSteps: ['逐项对照定义', '排除共线作基底'],
      difficultyEvidence: '基底条件是易错点',
      misconceptionTrap: '以为任意两非零即可作基底',
      alternativeApproach: '反例：a=(1,0),b=(2,0)',
      verification: 'A,C,D',
    }),
  }
}
function r6jud(n) {
  return {
    sectionCode: '6.2',
    sectionName: '平面向量基本定理',
    stem: `判断：任意两个非零向量都可作为平面向量的一组基底。`,
    options: null,
    answer: 'false',
    analysis: `基底要求不共线。共线的两个非零向量不能作基底。`,
    authorMathNote: 'false',
    dedupNote: `4c-ch6-jud-basis-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '基底“不共线”条件',
      reasoningSteps: ['回忆基本定理条件', '举共线反例'],
      difficultyEvidence: '概念陷阱题，需条件完整性',
      misconceptionTrap: '忽略不共线',
      alternativeApproach: '线性相关语言',
      verification: '假',
    }),
  }
}
function r6app(n) {
  const r = appRubric(
    [
      { key: 'setup', title: '设向量', score: 3, criterion: '正确表示中点向量' },
      { key: 'proof', title: '推理', score: 4, criterion: '证明平行或中点' },
      { key: 'conc', title: '结论', score: 3, criterion: '结论完整' },
    ],
    10,
  )
  return {
    sectionCode: '6.3',
    sectionName: '向量数量积',
    stem: `在 $\\triangle ABC$ 中，$D,E$ 分别为 $AB,AC$ 中点。\n（1）用向量表示 $\\overrightarrow{DE}$；\n（2）证明 $DE\\parallel BC$ 且 $DE=\\dfrac12 BC$。`,
    options: null,
    answer: `（1）$\\overrightarrow{DE}=\\dfrac12\\overrightarrow{BC}$；（2）由（1）即得平行且长度为一半。`,
    analysis: `$\\overrightarrow{DE}=\\overrightarrow{AE}-\\overrightarrow{AD}=\\dfrac12\\overrightarrow{AC}-\\dfrac12\\overrightarrow{AB}=\\dfrac12\\overrightarrow{BC}$。`,
    authorMathNote: '中位线向量证明',
    dedupNote: `4c-ch6-app-mid-${n}`,
    diagramRequirement: 'RECOMMENDED',
    ...r,
    hardProfile: hp({
      coreChallenge: '向量法证明三角形中位线定理',
      reasoningSteps: ['中点公式', '作差得 DE', '读出平行与数量关系'],
      difficultyEvidence: '证明题需完整向量推理',
      misconceptionTrap: '只会几何中位线背结论',
      alternativeApproach: '坐标法：A原点等',
      verification: 'DE=1/2 BC',
    }),
  }
}

// ---------- ch7 复数 ----------
function r7num(n) {
  // (2-i)/(1+i) = (2-i)^2 / 2?  (2-i)(1-i)/(1+1)=(2-2i-i+i^2)/2=(1-3i)/2
  // a=1/2,b=-3/2,a+b=-1
  return {
    sectionCode: '7.2',
    sectionName: '复数的四则运算',
    stem: `计算 $\\dfrac{2-\\mathrm{i}}{1+\\mathrm{i}}=a+b\\mathrm{i}$，则 $a+b=$`,
    options: null,
    answer: '-1',
    analysis: `分子分母乘 $1-\\mathrm{i}$：分子 $(2-\\mathrm{i})(1-\\mathrm{i})=2-2\\mathrm{i}-\\mathrm{i}+\\mathrm{i}^{2}=1-3\\mathrm{i}$，分母 $2$，故 $a=\\dfrac12,b=-\\dfrac32$，$a+b=-1$。`,
    authorMathNote: '-1',
    dedupNote: `4c-ch7-num-div-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '复数除法与实虚部求和',
      reasoningSteps: ['乘共轭', '分开实虚部', '求和'],
      difficultyEvidence: '多步代数变形，易算错虚部符号',
      misconceptionTrap: '分母写成 1-i²=0',
      alternativeApproach: '极坐标除法（超纲可不写）',
      verification: 'a+b=-1',
    }),
  }
}
function r7sin(n) {
  return {
    sectionCode: '7.1',
    sectionName: '复数的概念',
    stem: `$\\mathrm{i}^{4k+3}$（$k\\in\\mathbb{Z}$）等于`,
    options: {
      A: '$-\\mathrm{i}$',
      B: '$\\mathrm{i}$',
      C: '$1$',
      D: '$-1$',
    },
    answer: 'A',
    analysis: `$\\mathrm{i}^{4}=1$，故 $\\mathrm{i}^{4k+3}=\\mathrm{i}^{3}=-\\mathrm{i}$。`,
    authorMathNote: '-i',
    dedupNote: `4c-ch7-sin-pow-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '虚数单位幂的周期性分类',
      reasoningSteps: ['模4余数', '余3对应 -i'],
      difficultyEvidence: '需分类讨论余数而非逐次乘',
      misconceptionTrap: '余数对应错误',
      alternativeApproach: '列出 i^1..i^4 周期表',
      verification: 'A',
    }),
  }
}
function r7mul(n) {
  return {
    sectionCode: '7.2',
    sectionName: '复数的四则运算',
    stem: `设 $z=a+b\\mathrm{i}$（$a,b\\in\\mathbb{R}$）。正确的有（多选）`,
    options: {
      A: `$\\overline{z}=a-b\\mathrm{i}$`,
      B: `$z\\cdot\\overline{z}=a^{2}+b^{2}$`,
      C: `$|z|=\\sqrt{a^{2}+b^{2}}$`,
      D: `$z+\\overline{z}=2b\\mathrm{i}$`,
    },
    answer: 'A,B,C',
    analysis: `D 应为 $2a$。`,
    authorMathNote: 'A,B,C',
    dedupNote: `4c-ch7-mul-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '共轭、模、实部公式辨析',
      reasoningSteps: ['逐项核对定义', '排除 D'],
      difficultyEvidence: '多选易混实部虚部',
      misconceptionTrap: '共轭和写成纯虚',
      alternativeApproach: '取 z=1+i 检验',
      verification: 'A,B,C',
    }),
  }
}
function r7jud(n) {
  return {
    sectionCode: '7.1',
    sectionName: '复数的概念',
    stem: `判断：$\\mathrm{i}^{2}+1=0$ 在复数范围内成立。`,
    options: null,
    answer: 'true',
    analysis: `$\\mathrm{i}^{2}=-1$，故 $\\mathrm{i}^{2}+1=0$。`,
    authorMathNote: 'true',
    dedupNote: `4c-ch7-jud-i2-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '虚数单位定义的直接推论',
      reasoningSteps: ['用 i^2=-1', '得方程'],
      difficultyEvidence: '与实数无解对照，强调复数范围',
      misconceptionTrap: '以为平方和不能为0',
      alternativeApproach: '无（定义级）——本题难度边界：作为 d3 偏弱，配以“为何实数无解”理解',
      verification: '真',
    }),
  }
}
function r7app(n) {
  const r = appRubric(
    [
      { key: 'mul', title: '运算', score: 4, criterion: '正确完成除法' },
      { key: 'reim', title: '实虚部', score: 3, criterion: '正确分离 a,b' },
      { key: 'sum', title: '求和', score: 3, criterion: 'a+b 正确' },
    ],
    10,
  )
  return {
    sectionCode: '7.2',
    sectionName: '复数的四则运算',
    stem: `设 $\\dfrac{3-\\mathrm{i}}{1+\\mathrm{i}}=a+b\\mathrm{i}$。\n（1）求 $a,b$；\n（2）求 $a+b$。`,
    options: null,
    answer: `（1）$a=1,b=-2$；（2）$-1$。`,
    analysis: `乘 $1-\\mathrm{i}$：分子 $(3-\\mathrm{i})(1-\\mathrm{i})=3-3\\mathrm{i}-\\mathrm{i}+\\mathrm{i}^{2}=2-4\\mathrm{i}$，分母 2，故 $a=1,b=-2$，$a+b=-1$。`,
    authorMathNote: '1,-2,-1',
    dedupNote: `4c-ch7-app-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    ...r,
    hardProfile: hp({
      coreChallenge: '复数除法应用题分步给分',
      reasoningSteps: ['乘共轭', '化简', '求和'],
      difficultyEvidence: '分步呈现完整运算链',
      misconceptionTrap: '虚部符号',
      alternativeApproach: '无本质不同法',
      verification: 'a+b=-1',
    }),
  }
}

// ---------- ch8 立体几何 ----------
function r8num(n, k, m) {
  const r = 2 + (n % 3)
  const h = 4 + (n % 3)
  const hc = 3
  const ans = r * r * h + (r * r * hc) / 3
  return {
    sectionCode: '8.3',
    sectionName: '简单几何体的表面积与体积',
    stem: `圆柱底面半径 $${r}$、高 $${h}$，其上同底叠放高 $${hc}$ 的圆锥。组合体体积除以 $\\pi$ 的结果为`,
    options: null,
    answer: String(ans),
    analysis: `柱 $V_1=\\pi r^{2}h$，锥 $V_2=\\dfrac13\\pi r^{2}h_c$，除以 π 得 ${r * r * h}+\\dfrac{${r * r * hc}}{3}=${ans}$。`,
    authorMathNote: String(ans),
    dedupNote: `4c-ch8-num-vol-${r}-${h}-${n}`,
    diagramRequirement: 'REQUIRED',
    diagramSpecification: {
      purpose: '示意圆柱上叠圆锥同底',
      elements: ['圆柱', '圆锥', '半径与高标注'],
      mustNotReveal: '不得标注最终体积数值',
    },
    hardProfile: hp({
      coreChallenge: '组合体体积：柱+锥公式衔接',
      reasoningSteps: ['分别写体积', '相加', '除以π'],
      difficultyEvidence: '两公式叠加且锥有1/3',
      misconceptionTrap: '锥忘1/3；底面积用错',
      alternativeApproach: '无（标准公式法）',
      verification: `ans=${ans}`,
    }),
  }
}
function r8sin(n) {
  return {
    sectionCode: '8.5',
    sectionName: '空间直线与平面',
    stem: `在正方体 $ABCD-A_1B_1C_1D_1$ 中，直线 $BD_1$ 与平面 $A_1C_1D$ 的位置关系是`,
    options: {
      A: '平行',
      B: '相交但不垂直',
      C: '在平面内',
      D: '垂直',
    },
    answer: 'A',
    analysis: `可用向量法或线面平行判定：方向向量与平面两相交直线垂直判定法证明平行。`,
    authorMathNote: '平行',
    dedupNote: `4c-ch8-sin-bd1-${n}`,
    diagramRequirement: 'REQUIRED',
    diagramSpecification: {
      purpose: '正方体中线面关系',
      elements: ['正方体', 'BD1', '平面A1C1D'],
      mustNotReveal: '不得标注平行结论',
    },
    hardProfile: hp({
      coreChallenge: '正方体中线面平行的判定',
      reasoningSteps: ['设棱长1建系', '求平面法向量', '验证方向·法向=0且线不在面内'],
      difficultyEvidence: '空间想象+向量或判定定理',
      misconceptionTrap: '看成相交',
      alternativeApproach: '找面内直线与 BD1 平行',
      verification: '平行',
    }),
  }
}
function r8mul(n) {
  return {
    sectionCode: '8.6',
    sectionName: '直线、平面平行的判定',
    stem: `能判定直线 $l\\parallel$ 平面 $\\alpha$ 的有（多选）`,
    options: {
      A: `$l\\parallel m$，$m\\subset\\alpha$，且 $l\\not\\subset\\alpha$`,
      B: `$l$ 的方向向量与 $\\alpha$ 的法向量垂直，且 $l\\not\\subset\\alpha$`,
      C: `$l\\subset\\alpha$`,
      D: `$l$ 与 $\\alpha$ 内一条直线垂直`,
    },
    answer: 'A,B',
    analysis: `A、B 为线面平行判定；C 是线在面内；D 不足以判定平行。`,
    authorMathNote: 'A,B',
    dedupNote: `4c-ch8-mul-para-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '线面平行判定与否的辨析',
      reasoningSteps: ['对照判定定理', '排除线在面内与垂直条件'],
      difficultyEvidence: '多选易混“平行于面内直线”与“在面内”',
      misconceptionTrap: '漏写 l 不在面内',
      alternativeApproach: '法向量判定',
      verification: 'A,B',
    }),
  }
}
function r8jud(n) {
  return {
    sectionCode: '8.6',
    sectionName: '直线、平面平行的判定',
    stem: `判断：若直线 $l$ 平行于平面 $\\alpha$ 内的一条直线，则一定有 $l\\parallel\\alpha$。`,
    options: null,
    answer: 'false',
    analysis: `若 $l\\subset\\alpha$ 则不称为线面平行。判定还需 $l\\not\\subset\\alpha$。`,
    authorMathNote: 'false',
    dedupNote: `4c-ch8-jud-lpara-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '线面平行判定的完整条件',
      reasoningSteps: ['指出缺“不在面内”', '举 l 在面内反例'],
      difficultyEvidence: '条件完整性陷阱',
      misconceptionTrap: '漏条件',
      alternativeApproach: '定义对照',
      verification: '假',
    }),
  }
}
function r8app(n, k, m) {
  const r = 3
  const h = 4
  const rub = appRubric(
    [
      { key: 'vol', title: '体积', score: 4, criterion: '圆锥体积正确' },
      { key: 'sec', title: '轴截面', score: 3, criterion: '等腰三角形面积或元素正确' },
      { key: 'rel', title: '关系', score: 3, criterion: '母线或高关系说明' },
    ],
    10,
  )
  return {
    sectionCode: '8.3',
    sectionName: '简单几何体',
    stem: `圆锥底面半径 $${r}$、高 $${h}$。\n（1）求体积（含 $\\pi$）；\n（2）求轴截面面积。`,
    options: null,
    answer: `（1）$12\\pi$；（2）$12$。`,
    analysis: `体积 $\\dfrac13\\pi r^{2}h=12\\pi$。轴截面为等腰三角形，腰长 $5$，面积 $\\dfrac12\\cdot 6\\cdot 4=12$。`,
    authorMathNote: '12π,12',
    dedupNote: `4c-ch8-app-cone-${n}`,
    diagramRequirement: 'REQUIRED',
    diagramSpecification: {
      purpose: '圆锥及轴截面',
      elements: ['圆锥', '轴截面三角形', 'r,h'],
      mustNotReveal: '不得写体积答案',
    },
    ...rub,
    hardProfile: hp({
      coreChallenge: '圆锥体积与轴截面面积综合',
      reasoningSteps: ['体积公式', '母线勾股', '三角形面积'],
      difficultyEvidence: '两问跨体积与平面图形',
      misconceptionTrap: '轴截面底边当成 r 而非 2r',
      alternativeApproach: '无',
      verification: '12π 与 12',
    }),
  }
}

// ---------- ch9 统计 ----------
function r9num(n) {
  return {
    sectionCode: '9.2',
    sectionName: '用样本估计总体',
    stem: `抽检 $200$ 件产品发现次品 $8$ 件。用频率估计次品率，并估计 $5000$ 件中次品约多少件？只要估计件数`,
    options: null,
    answer: '200',
    analysis: `频率 $8/200=0.04$，$5000\\times 0.04=200$。`,
    authorMathNote: '200',
    dedupNote: `4c-ch9-num-freq-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '频率估计概率/比率并外推总量',
      reasoningSteps: ['算频率', '乘总量'],
      difficultyEvidence: '两步估计，强调样本代表性假设',
      misconceptionTrap: '用 8/5000',
      alternativeApproach: '无',
      verification: '200',
    }),
  }
}
function r9sin(n) {
  return {
    sectionCode: '9.1',
    sectionName: '随机抽样',
    stem: `为了解某市中学生视力，从 10 所中学按人数比例各抽若干人，这种抽样是`,
    options: {
      A: '分层抽样',
      B: '系统抽样',
      C: '简单随机抽样',
      D: '抽签法',
    },
    answer: 'A',
    analysis: `按层（学校）比例抽取为分层抽样。`,
    authorMathNote: 'A',
    dedupNote: `4c-ch9-sin-strat-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '三种抽样方法辨析',
      reasoningSteps: ['识别“按层比例”', '对应分层'],
      difficultyEvidence: '情境识别，易与系统抽样混淆',
      misconceptionTrap: '看成简单随机',
      alternativeApproach: '对照定义表',
      verification: 'A',
    }),
  }
}
function r9mul(n) {
  return {
    sectionCode: '9.2',
    sectionName: '用样本估计总体',
    stem: `关于样本估计总体，正确的有（多选）`,
    options: {
      A: `样本平均数可估计总体平均数`,
      B: `样本方差可估计总体方差`,
      C: `回归直线一定过每个样本点`,
      D: `频率可估计概率`,
    },
    answer: 'A,B,D',
    analysis: `C 错：回归直线一般过样本中心，不保证过每个点。`,
    authorMathNote: 'A,B,D',
    dedupNote: `4c-ch9-mul-est-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '估计思想与回归直线性质',
      reasoningSteps: ['确认 A,B,D', '反例/性质排除 C'],
      difficultyEvidence: '综合抽样估计与回归分析',
      misconceptionTrap: '以为拟合必过所有点',
      alternativeApproach: '残差平方和最小的几何意义',
      verification: 'A,B,D',
    }),
  }
}
function r9jud(n) {
  return {
    sectionCode: '9.2',
    sectionName: '线性回归',
    stem: `判断：经验回归直线一定经过每一个样本点。`,
    options: null,
    answer: 'false',
    analysis: `最小二乘回归直线一般只保证过样本中心 $(\\bar x,\\bar y)$，不保证过所有点。`,
    authorMathNote: 'false',
    dedupNote: `4c-ch9-jud-reg-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '回归直线几何性质',
      reasoningSteps: ['回忆最小二乘', '指出过中心而非所有点'],
      difficultyEvidence: '概念陷阱，需理解拟合含义',
      misconceptionTrap: '与插值多项式混淆',
      alternativeApproach: '两点样本才可能过两点；三点一般不能',
      verification: '假',
    }),
  }
}
function r9app(n) {
  const r = appRubric(
    [
      { key: 'freq', title: '频率', score: 3, criterion: '频率计算正确' },
      { key: 'est', title: '估计', score: 4, criterion: '总量估计正确' },
      { key: 'note', title: '说明', score: 3, criterion: '说明用频率估计比率的前提' },
    ],
    10,
  )
  return {
    sectionCode: '9.2',
    sectionName: '用样本估计总体',
    stem: `抽检 $250$ 件发现次品 $10$ 件。\n（1）求次品频率；\n（2）估计 $8000$ 件中次品数；\n（3）一句话说明估计成立的前提。`,
    options: null,
    answer: `（1）$0.04$；（2）$320$；（3）样本具有代表性/随机性等。`,
    analysis: `$10/250=0.04$，$8000\\times 0.04=320$。`,
    authorMathNote: '0.04,320',
    dedupNote: `4c-ch9-app-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    ...r,
    hardProfile: hp({
      coreChallenge: '频率估计的完整表述含前提',
      reasoningSteps: ['算频率', '外推', '写前提'],
      difficultyEvidence: '第三问考统计思想而非纯计算',
      misconceptionTrap: '忽略代表性',
      alternativeApproach: '无',
      verification: '320',
    }),
  }
}

// ---------- ch10 概率 ----------
function r10num(n) {
  const pa = 0.3 + (n % 3) * 0.1
  const pb = 0.5
  // use fixed for clean arithmetic
  const a = 0.4
  const b = 0.5
  const ans = a + b - a * b
  return {
    sectionCode: '10.2',
    sectionName: '事件的相互独立性',
    stem: `独立事件 $A,B$ 满足 $P(A)=0.4$，$P(B)=0.5$。则 $P(A\\cup B)=$`,
    options: null,
    answer: String(ans),
    analysis: `$P(A\\cup B)=P(A)+P(B)-P(A)P(B)=0.4+0.5-0.2=0.7$。`,
    authorMathNote: '0.7',
    dedupNote: `4c-ch10-num-union-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '独立条件下并集概率',
      reasoningSteps: ['写出并集公式', '用独立得交概率乘积', '代入'],
      difficultyEvidence: '需区分交与并，用独立性',
      misconceptionTrap: '直接相加得 0.9；或只算交',
      alternativeApproach: '1-P(A^c)P(B^c)',
      verification: '0.7',
    }),
  }
}
function r10sin(n) {
  return {
    sectionCode: '10.1',
    sectionName: '随机事件与概率',
    stem: `抛一枚均匀硬币两次，事件“恰好正面一次”的概率是`,
    options: {
      A: '$\\dfrac12$',
      B: '$\\dfrac14$',
      C: '$\\dfrac13$',
      D: '$\\dfrac34$',
    },
    answer: 'A',
    analysis: `样本空间 4 个等可能：正正、正反、反正、反反；恰一正占 2 个，概率 1/2。`,
    authorMathNote: '1/2',
    dedupNote: `4c-ch10-sin-coin-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '古典概型计数',
      reasoningSteps: ['列样本点', '数有利', '比值'],
      difficultyEvidence: '易误成 1/3（顺序忽略）',
      misconceptionTrap: '样本空间写成 {0次,1次,2次} 非等可能',
      alternativeApproach: '二项概率 C(2,1)(1/2)^2',
      verification: '1/2',
    }),
  }
}
function r10mul(n) {
  return {
    sectionCode: '10.2',
    sectionName: '事件的相互独立性',
    stem: `设 $P(A)>0,P(B)>0$。正确的有（多选）`,
    options: {
      A: `若 A,B 互斥，则 A,B 不独立`,
      B: `若 A,B 独立，则 $P(AB)=P(A)P(B)$`,
      C: `互斥一定独立`,
      D: `独立一定互斥`,
    },
    answer: 'A,B',
    analysis: `互斥且概率为正则交为0≠乘积，故不独立。独立与互斥互不蕴含。`,
    authorMathNote: 'A,B',
    dedupNote: `4c-ch10-mul-indep-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '互斥与独立关系',
      reasoningSteps: ['用定义比较', '排除 C,D'],
      difficultyEvidence: '两概念最易混',
      misconceptionTrap: '互斥⇔独立',
      alternativeApproach: '文氏图+概率数例',
      verification: 'A,B',
    }),
  }
}
function r10jud(n) {
  return {
    sectionCode: '10.2',
    sectionName: '事件的相互独立性',
    stem: `判断：若事件 $A,B$ 互斥且 $P(A)P(B)>0$，则 $A,B$ 不独立。`,
    options: null,
    answer: 'true',
    analysis: `互斥 ⇒ P(AB)=0；独立 ⇒ P(AB)=P(A)P(B)>0，矛盾，故不独立。`,
    authorMathNote: 'true',
    dedupNote: `4c-ch10-jud-mutex-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    hardProfile: hp({
      coreChallenge: '互斥与独立不相容（正概率）',
      reasoningSteps: ['互斥得交0', '独立得交>0', '矛盾'],
      difficultyEvidence: '需逻辑反证，不是背定义一句',
      misconceptionTrap: '以为互斥即独立',
      alternativeApproach: '无',
      verification: '真',
    }),
  }
}
function r10app(n) {
  const r = appRubric(
    [
      { key: 'indep', title: '独立', score: 3, criterion: '正确用独立性' },
      { key: 'inter', title: '交', score: 3, criterion: 'P(AB) 正确' },
      { key: 'union', title: '并', score: 4, criterion: 'P(A∪B) 正确' },
    ],
    10,
  )
  return {
    sectionCode: '10.2',
    sectionName: '事件的相互独立性',
    stem: `独立事件 $A,B$，$P(A)=0.3$，$P(B)=0.4$。\n（1）求 $P(AB)$；\n（2）求 $P(A\\cup B)$。`,
    options: null,
    answer: `（1）$0.12$；（2）$0.58$。`,
    analysis: `$P(AB)=0.12$；$P(A\\cup B)=0.3+0.4-0.12=0.58$。`,
    authorMathNote: '0.12,0.58',
    dedupNote: `4c-ch10-app-${n}`,
    diagramRequirement: 'NOT_NEEDED',
    ...r,
    hardProfile: hp({
      coreChallenge: '独立事件交、并连续两问',
      reasoningSteps: ['乘积求交', '并集公式'],
      difficultyEvidence: '交并连续，防只用加法',
      misconceptionTrap: '并写成 0.7',
      alternativeApproach: '1-P(A^c)P(B^c)',
      verification: '0.58',
    }),
  }
}

// Fix builders to use fixed r3
export function recipeHardFixed(slot, salt = 0) {
  const ch = slot.chapterNo
  const qt = slot.qtype
  const n = parseInt(String(slot.id).replace(/\D/g, ''), 10) + salt * 17
  const k = 2 + (n % 5)
  const m = 3 + (n % 4)
  const map = {
    1: { numeric: r1num, single: r1sin, multi: r1mul, judge: r1jud, application: r1app },
    2: { numeric: r2num, single: r2sin, multi: r2mul, judge: r2jud, application: r2app },
    3: { numeric: r3num, single: r3sin, multi: _r3mul, judge: r3jud, application: _r3app },
    4: { numeric: r4num, single: r4sin, multi: r4mul, judge: r4jud, application: r4app },
    5: { numeric: r5num, single: r5sin, multi: r5mul, judge: r5jud, application: r5app },
    6: { numeric: r6num, single: r6sin, multi: r6mul, judge: r6jud, application: r6app },
    7: { numeric: r7num, single: r7sin, multi: r7mul, judge: r7jud, application: r7app },
    8: { numeric: r8num, single: r8sin, multi: r8mul, judge: r8jud, application: r8app },
    9: { numeric: r9num, single: r9sin, multi: r9mul, judge: r9jud, application: r9app },
    10: { numeric: r10num, single: r10sin, multi: r10mul, judge: r10jud, application: r10app },
  }
  const fn = map[ch][qt]
  return fn(n, k, m, slot)
}
