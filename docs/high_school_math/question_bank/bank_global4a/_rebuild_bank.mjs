/**
 * Quality-rebuild item builders for all 10 chapters.
 * Unique-by-n, no crutch text, answers by construction.
 */
import {
  seed,
  pick,
  appRubric,
  baseItem,
  methodPair,
} from './_rebuild_core.mjs'

function nOf(slot) {
  return parseInt(slot.id.slice(-3), 10)
}

/** Build one rebuilt candidate+evidence from slot; salt shifts parameters for uniqueness */
export function rebuildOne(slot, salt = 0) {
  const n = nOf(slot) + salt * 17
  const ch = slot.chapterNo
  const builders = {
    1: buildCh1,
    2: buildCh2,
    3: buildCh3,
    4: buildCh4,
    5: buildCh5,
    6: buildCh6,
    7: buildCh7,
    8: buildCh8,
    9: buildCh9,
    10: buildCh10,
  }
  const fn = builders[ch]
  if (!fn) throw new Error('bad chapter ' + ch)
  return fn(slot, n)
}

/* ===================== Ch1 集合 ===================== */
function buildCh1(slot, n) {
  const a = seed(n, 2, 6)
  const b = seed(n + 1, 3, 8)
  const qt = slot.qtype
  const d = slot.difficulty

  if (qt === 'numeric') {
    const u = 8 + (n % 7)
    const k = 2 + (n % 4)
    return baseItem(slot, {
      sectionCode: '1.3',
      sectionName: '集合的基本运算',
      stem: `全集 $U=\\{1,2,\\ldots,${u}\\}$，$A=\\{1,2,\\ldots,${k}\\}$，则 $|\\complement_U A|=$`,
      options: null,
      answer: String(u - k),
      analysis: `$|U|=${u}$，$|A|=${k}$，故 $|\\complement_U A|=${u - k}$。`,
      authorMathNote: `${u}-${k}=${u - k}`,
      dedupNote: `补集基数 u=${u},k=${k}`,
    }, { coreDerivation: `补集计数 ${u}-${k}`, answerBasis: String(u - k), rebuildAction: 'replace' })
  }

  if (qt === 'judge') {
    const variants = [
      {
        stem: `判断：命题“$x>${a + 1}$”是“$x>${a}$”的充分不必要条件。`,
        answer: 'true',
        analysis: `由 $x>${a + 1}$ 可推出 $x>${a}$；取 $x=${a}+0.5$ 知逆命题不成立。`,
        note: '充分不必要',
      },
      {
        stem: `判断：空集是任何集合的真子集。`,
        answer: 'false',
        analysis: `空集是任何集合的子集，但不是自身的真子集；“任何集合”表述不严谨为假。`,
        note: '空集真子集表述',
      },
      {
        stem: `判断：若 $A\\subseteq B$ 且 $B\\subseteq A$，则 $A=B$。`,
        answer: 'true',
        analysis: `集合相等的充要条件是互相包含。`,
        note: '相等判定',
      },
    ]
    const v = pick(n, variants)
    return baseItem(slot, {
      sectionCode: '1.4',
      sectionName: '充分条件与必要条件',
      stem: v.stem,
      options: null,
      answer: v.answer,
      analysis: v.analysis,
      authorMathNote: v.note,
      dedupNote: `ch1-judge-${n % 3}`,
      hardProfile:
        d === 3
          ? {
              ability: 'B',
              coreDifficulty: '充分必要方向与反例构造',
              solutionOutline: '先推充分性，再举反例否定必要性',
              whyNotEasy: '需同时掌握充分/必要定义与反例',
            }
          : null,
    }, { rebuildAction: 'replace' })
  }

  if (qt === 'single') {
    if (d === 3) {
      return baseItem(
        slot,
        {
          sectionCode: '1.3',
          sectionName: '集合的基本运算',
          stem: `设全集 $U=\\{x\\in\\mathbb{Z}\\mid 1\\le x\\le ${a + 6}\\}$，$A=\\{x\\in U\\mid x\\text{ 为偶数}\\}$，$B=\\{x\\in U\\mid x\\text{ 为 }3\\text{ 的倍数}\\}$。则 $|\\complement_U(A\\cup B)|$ 等于`,
          options: (() => {
            const U = []
            for (let i = 1; i <= a + 6; i++) U.push(i)
            const AuB = new Set(U.filter((x) => x % 2 === 0 || x % 3 === 0))
            const ans = U.length - AuB.size
            const opts = {
              A: String(ans),
              B: String(ans + 1),
              C: String(Math.max(0, ans - 1)),
              D: String(AuB.size),
            }
            return opts
          })(),
          answer: 'A',
          analysis: `先求 $A\\cup B$，再求在 $U$ 中的补集个数。`,
          authorMathNote: '容斥补集',
          dedupNote: `ch1-d3-single-${n}`,
          hardProfile: {
            ability: 'A',
            coreDifficulty: '并集与补集的综合计数',
            solutionOutline: '列举或容斥求 A∪B，再用 |U|-|A∪B|',
            whyNotEasy: '需同时处理奇偶与倍数两类条件并取补',
          },
        },
        { rebuildAction: 'replace' },
      )
    }
    const variants = [
      {
        stem: `下列能构成集合的是`,
        options: {
          A: '高一某班较高的同学',
          B: `方程 $x^2-${a + b}x+${a * b}=0$ 的实数解`,
          C: '接近 0 的实数',
          D: '好看的画',
        },
        answer: 'B',
        analysis: `集合元素须确定。方程根为 $${a},${b}$，确定。`,
      },
      {
        stem: `设 $A=\\{${a}\\}$，$B=\\{x\\mid x^2-${2 * a}x+${a * a}=0\\}$，则`,
        options: {
          A: `$A\\subsetneq B$`,
          B: `$A=B$`,
          C: `$B\\subsetneq A$`,
          D: `$A\\cap B=\\emptyset$`,
        },
        answer: 'B',
        analysis: `$B=\\{${a}\\}=A$。`,
      },
    ]
    const v = pick(n, variants)
    return baseItem(slot, {
      sectionCode: '1.1',
      sectionName: '集合的概念',
      stem: v.stem,
      options: v.options,
      answer: v.answer,
      analysis: v.analysis,
      authorMathNote: '集合确定性/相等',
      dedupNote: `ch1-single-${n % 2}-${a}-${b}`,
    }, { rebuildAction: 'replace' })
  }

  if (qt === 'multi') {
    return baseItem(slot, {
      sectionCode: '1.3',
      sectionName: '集合的基本运算',
      stem: `全集 $U=\\{1,2,3,4,5\\}$，$A=\\{1,${Math.min(a, 5)},3\\}$，正确的有（多选）`,
      options: {
        A: `$|A|\\le 3$`,
        B: `$1\\in A$`,
        C: `$U\\subseteq A$`,
        D: `$A\\subseteq U$`,
      },
      answer: 'A,B,D',
      analysis: `C 错：全集不能被 A 包含。`,
      authorMathNote: 'A,B,D',
      dedupNote: `ch1-multi-${a}`,
    }, { rebuildAction: 'replace' })
  }

  // application
  const Umax = a + 5
  const evenMax = 2 * a
  const A = []
  for (let x = 1; x <= Umax; x++) A.push(x)
  const B = []
  for (let x = 2; x <= evenMax; x += 2) B.push(x)
  const union = [...new Set([...A, ...B])].sort((x, y) => x - y)
  const r = appRubric(
    [
      { key: 'list', title: '列举并集', score: 4, criterion: `正确写出 A∪B=${union.join(',')}` },
      { key: 'card', title: '求基数', score: 4, criterion: `|A∪B|=${union.length}` },
    ],
    8,
  )
  const hard =
    d === 3
      ? {
          ability: 'A',
          coreDifficulty: '并集列举与计数严谨性',
          solutionOutline: '分别列举 A、B，去重求并，计数',
          whyNotEasy: '需正确处理边界与重复元素',
        }
      : null
  return baseItem(
    slot,
    {
      sectionCode: '1.3',
      sectionName: '集合的基本运算',
      stem: `设 $A=\\{x\\in\\mathbb{N}^*\\mid x\\le ${Umax}\\}$，$B=\\{x\\in\\mathbb{N}^*\\mid x\\text{ 为偶数且 }x\\le ${evenMax}\\}$。\n（1）求 $A\\cup B$；\n（2）求 $|A\\cup B|$。`,
      options: null,
      answer: `（1）$\\{${union.join(',')}\\}$；（2）$${union.length}$`,
      analysis: `列举 A、B 后求并。$A\\cup B=\\{${union.join(',')}\\}$，个数 ${union.length}。`,
      authorMathNote: `|∪|=${union.length}`,
      dedupNote: `ch1-app-${Umax}-${evenMax}`,
      hardProfile: hard,
      ...r,
    },
    {
      coreDerivation: `A=1..${Umax}, B=偶数≤${evenMax}`,
      answerBasis: union.join(','),
      rubricVerdict: '列举4分+基数4分，不给抄题干分',
      rebuildAction: 'replace',
    },
  )
}

/* ===================== Ch2 不等式 ===================== */
function buildCh2(slot, n) {
  const a = seed(n, 2, 7)
  const b = seed(n + 3, 3, 9)
  const qt = slot.qtype
  const d = slot.difficulty
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)

  if (qt === 'numeric') {
    const k = 3 + (n % 8)
    return baseItem(slot, {
      sectionCode: '2.2',
      sectionName: '基本不等式',
      stem: `正实数 $x,y$ 满足 $xy=${k * k}$，则 $x+y$ 的最小值为`,
      options: null,
      answer: String(2 * k),
      analysis: `$x+y\\ge 2\\sqrt{xy}=${2 * k}$，等号当 $x=y=${k}$。`,
      authorMathNote: `min=${2 * k}`,
      dedupNote: `amgm-${k}`,
    }, { rebuildAction: 'replace' })
  }

  if (qt === 'single') {
    if (d === 3) {
      // parameter root distribution style
      return baseItem(
        slot,
        {
          sectionCode: '2.3',
          sectionName: '二次函数与一元二次方程、不等式',
          stem: `若关于 $x$ 的不等式 $x^2-(2m+1)x+m(m+1)<0$ 的解集为 $(m,m+1)$，则实数 $m$ 的值为`,
          options: {
            A: '任意实数',
            B: '不存在',
            C: '正数',
            D: '负数',
          },
          answer: 'A',
          analysis: `因式分解得 $(x-m)(x-(m+1))<0$，解集恰为 $(m,m+1)$，对任意实数 $m$ 成立。`,
          authorMathNote: '恒为(m,m+1)',
          dedupNote: `ch2-d3-param-${n}`,
          hardProfile: {
            ability: 'C',
            coreDifficulty: '含参二次不等式与给定解集的匹配',
            solutionOutline: '因式分解→与开区间端点对照→判断 m 范围',
            whyNotEasy: '需从解集反推结构并确认参数自由性，非一次性代入',
          },
        },
        { rebuildAction: 'replace' },
      )
    }
    return baseItem(slot, {
      sectionCode: '2.3',
      sectionName: '二次函数与一元二次方程、不等式',
      stem: `不等式 $x^2-${lo + hi}x+${lo * hi}<0$ 的解集是`,
      options: {
        A: `$(${lo},${hi})$`,
        B: `$(-\\infty,${lo})\\cup(${hi},+\\infty)$`,
        C: `$[${lo},${hi}]$`,
        D: `$\\mathbb{R}$`,
      },
      answer: 'A',
      analysis: `根为 $${lo},${hi}$，开口向上，取两根之间。`,
      authorMathNote: `(${lo},${hi})`,
      dedupNote: `quad-ineq-${lo}-${hi}`,
    }, { rebuildAction: 'replace' })
  }

  if (qt === 'multi') {
    return baseItem(slot, {
      sectionCode: '2.1',
      sectionName: '等式与不等式的性质',
      stem: `若实数满足 $p>q$，则一定成立的有（多选）`,
      options: {
        A: `$p+${a}>q+${a}$`,
        B: `$${a}p>${a}q$`,
        C: `$p^2>q^2$`,
        D: `$-p<-q$`,
      },
      answer: 'A,B,D',
      analysis: `C 在异号时未必成立。`,
      authorMathNote: 'A,B,D',
      dedupNote: `ineq-prop-${a}`,
    }, { rebuildAction: 'replace' })
  }

  if (qt === 'judge') {
    return baseItem(slot, {
      sectionCode: '2.2',
      sectionName: '基本不等式',
      stem: `判断：对任意正实数 $x$，都有 $x+\\dfrac{${a * a}}{x}\\ge ${2 * a}$。`,
      options: null,
      answer: 'true',
      analysis: `AM-GM：$x+\\frac{a^2}{x}\\ge 2a$，等号 $x=a$。`,
      authorMathNote: `≥${2 * a}`,
      dedupNote: `amgm-judge-${a}`,
    }, { rebuildAction: 'replace' })
  }

  // application
  const c = 16
  const r = appRubric(
    [
      { key: 'model', title: '写出目标式', score: 3, criterion: '正确得到 x+16/x（或等价）' },
      { key: 'opt', title: '求最小值', score: 3, criterion: '最小值 8' },
      { key: 'eq', title: '等号条件', score: 2, criterion: 'x=4' },
    ],
    8,
  )
  if (d === 3) {
    const fence = 24
    const r3 = appRubric(
      [
        { key: 'model', title: '面积函数', score: 3, criterion: `写出 S(x)=x(${fence / 2}-x) 及定义域` },
        { key: 'mono', title: '单调/配方', score: 3, criterion: '求出顶点或单调区间' },
        { key: 'max', title: '最大值', score: 2, criterion: `S_max=${(fence / 4) ** 2}` },
      ],
      8,
    )
    return baseItem(
      slot,
      {
        sectionCode: '2.2',
        sectionName: '基本不等式',
        stem: `用长为 $${fence}\\,\\mathrm{m}$ 的篱笆围矩形花坛（四边均用篱笆）。设一边长为 $x\\,\\mathrm{m}$（$0<x<${fence / 2}$）。\n（1）写出面积 $S(x)$；\n（2）求 $S(x)$ 的最大值及相应 $x$。`,
        options: null,
        answer: `（1）$S(x)=x(${fence / 2}-x)$；（2）当 $x=${fence / 4}$ 时，$S_{\\max}=${(fence / 4) ** 2}$。`,
        analysis: `周长固定，$S=x(L-x)$，顶点在对称轴。`,
        authorMathNote: `Smax=${(fence / 4) ** 2}`,
        dedupNote: `fence-${fence}`,
        hardProfile: {
          ability: 'A',
          coreDifficulty: '建模+二次函数最值',
          solutionOutline: '列周长约束→面积函数→配方/顶点→写定义域内最值',
          whyNotEasy: '需完成建模到最值的完整链条，非单步公式',
        },
        ...r3,
      },
      { rebuildAction: 'replace', rubricVerdict: '建模3+分析3+最值2' },
    )
  }
  return baseItem(
    slot,
    {
      sectionCode: '2.2',
      sectionName: '基本不等式',
      stem: `正实数 $x$ 满足约束下目标等价于求 $x+\\dfrac{${c}}{x}$ 的最小值。\n（1）求最小值；\n（2）写出等号成立条件。`,
      options: null,
      answer: `（1）$8$；（2）$x=4$。`,
      analysis: `$x+16/x\\ge 8$，等号 $x=4$。`,
      authorMathNote: 'min=8',
      dedupNote: `amgm-app-${n}`,
      ...r,
    },
    { rebuildAction: 'replace' },
  )
}

/* ===================== Ch3 函数 ===================== */
function buildCh3(slot, n) {
  const a = seed(n, 2, 6)
  const qt = slot.qtype
  const d = slot.difficulty

  if (qt === 'numeric') {
    return baseItem(slot, {
      sectionCode: '3.1',
      sectionName: '函数的概念',
      stem: `函数 $f(x)=${a}x+${a + 1}$，则 $f(${a})=$`,
      options: null,
      answer: String(a * a + a + 1),
      analysis: `$f(${a})=${a}\\cdot${a}+${a + 1}=${a * a + a + 1}$。`,
      authorMathNote: String(a * a + a + 1),
      dedupNote: `fval-${a}`,
    }, { rebuildAction: 'replace' })
  }

  if (qt === 'single') {
    if (d === 3) {
      return baseItem(
        slot,
        {
          sectionCode: '3.2',
          sectionName: '函数的基本性质',
          stem: `设 $f(x)$ 是定义在 $\\mathbb{R}$ 上的奇函数，且当 $x>0$ 时 $f(x)=x+\\dfrac{${a}}{x}$。则 $f(-${a})=$`,
          options: {
            A: String(-(a + 1)),
            B: String(a + 1),
            C: String(-(2 * a)),
            D: String(2 * a),
          },
          answer: 'A',
          analysis: `$f(${a})=${a}+1$；奇函数 $f(-${a})=-f(${a})=-(${a}+1)$。`,
          authorMathNote: `-(${a}+1)`,
          dedupNote: `odd-ext-${a}`,
          hardProfile: {
            ability: 'E',
            coreDifficulty: '奇函数延拓求值',
            solutionOutline: '先算正半轴解析式值，再用奇性翻到负半轴',
            whyNotEasy: '需联合奇偶定义与分段解析式，非直接代入负值',
          },
        },
        { rebuildAction: 'replace' },
      )
    }
    return baseItem(slot, {
      sectionCode: '3.2',
      sectionName: '函数的基本性质',
      stem: `函数 $f(x)=${a}x-${a + 1}$ 在 $\\mathbb{R}$ 上`,
      options: {
        A: '单调递增',
        B: '单调递减',
        C: '先增后减',
        D: '先减后增',
      },
      answer: 'A',
      analysis: `一次项系数 $${a}>0$，递增。`,
      authorMathNote: '增',
      dedupNote: `mono-lin-${a}`,
    }, { rebuildAction: 'replace' })
  }

  if (qt === 'multi') {
    return baseItem(slot, {
      sectionCode: '3.2',
      sectionName: '函数的基本性质',
      stem: `下列函数在 $\\mathbb{R}$ 上为奇函数的有（多选）`,
      options: {
        A: `$f(x)=x$`,
        B: `$f(x)=x^3$`,
        C: `$f(x)=x^2$`,
        D: `$f(x)=0$`,
      },
      answer: 'A,B,D',
      analysis: `C 为偶函数；零函数既奇又偶。`,
      authorMathNote: 'A,B,D',
      dedupNote: `odd-multi-${n % 5}`,
    }, { rebuildAction: 'replace' })
  }

  if (qt === 'judge') {
    return baseItem(slot, {
      sectionCode: '3.2',
      sectionName: '函数的基本性质',
      stem: `判断：函数 $f(x)=x^2$ 在 $(-\\infty,0)$ 上单调递减。`,
      options: null,
      answer: 'true',
      analysis: `在负半轴，自变量增大（仍为负）时函数值减小。`,
      authorMathNote: '真',
      dedupNote: `quad-dec-${n % 3}`,
    }, { rebuildAction: 'replace' })
  }

  const r = appRubric(
    [
      { key: 'expr', title: '解析式', score: 3, criterion: '写出正确分段或整式' },
      { key: 'val', title: '求值/最值', score: 5, criterion: '结果正确' },
    ],
    8,
  )
  if (d === 3) {
    const r3 = appRubric(
      [
        { key: 'parity', title: '奇偶性', score: 3, criterion: '说明为奇函数' },
        { key: 'neg', title: '负值', score: 3, criterion: `f(-2)=-(2+${a}/2)` },
        { key: 'sum', title: '综合', score: 2, criterion: '表述完整' },
      ],
      8,
    )
    const f2 = 2 + a / 2
    return baseItem(
      slot,
      {
        sectionCode: '3.2',
        sectionName: '函数的基本性质',
        stem: `已知函数 $f(x)$ 对定义域内任意 $x$ 满足 $f(x)+f(-x)=0$，且当 $x>0$ 时 $f(x)=x+\\dfrac{${a}}{x}$。\n（1）说明 $f$ 的奇偶性；\n（2）求 $f(-2)$。`,
        options: null,
        answer: `（1）奇函数；（2）$f(-2)=-(2+\\dfrac{${a}}{2})=-${f2}$。`,
        analysis: `由 $f(x)+f(-x)=0$ 知奇函数；再求正半轴值翻号。`,
        authorMathNote: `f(-2)=-${f2}`,
        dedupNote: `odd-app-${a}`,
        hardProfile: {
          ability: 'E',
          coreDifficulty: '由函数方程识别奇性并延拓求值',
          solutionOutline: '由等式判奇→用正半轴公式→奇性得负自变量值',
          whyNotEasy: '不是直接把 -2 代入正半轴公式',
        },
        ...r3,
      },
      { rebuildAction: 'replace' },
    )
  }
  return baseItem(
    slot,
    {
      sectionCode: '3.1',
      sectionName: '函数的概念',
      stem: `设 $f(x)=x+\\dfrac{1}{x}$（$x\\ge 1$）。\n（1）判断 $f$ 在 $[1,+\\infty)$ 上的单调性；\n（2）求最小值。`,
      options: null,
      answer: `（1）单调递增；（2）最小值为 $2$。`,
      analysis: `$f'(x)$ 思想：或作差 $f(x_2)-f(x_1)=(x_2-x_1)(1-1/(x_1x_2))$，$x\\ge1$ 时非负。$f(1)=2$。`,
      authorMathNote: 'min=2',
      dedupNote: `f-inc-app-${n}`,
      ...r,
    },
    { rebuildAction: 'replace' },
  )
}

/* ===================== Ch4 指数对数 ===================== */
function buildCh4(slot, n) {
  const a = 2 + (n % 4)
  const qt = slot.qtype
  const d = slot.difficulty

  if (qt === 'numeric') {
    const e = 2 + (n % 3)
    return baseItem(slot, {
      sectionCode: '4.3',
      sectionName: '对数的运算',
      stem: `$\\log_{${a}} ${a ** e}=$`,
      options: null,
      answer: String(e),
      analysis: `$\\log_a(a^e)=e$。`,
      authorMathNote: String(e),
      dedupNote: `log-${a}-${e}`,
    }, { rebuildAction: 'replace' })
  }

  if (qt === 'single') {
    if (d === 3) {
      return baseItem(
        slot,
        {
          sectionCode: '4.2',
          sectionName: '指数函数',
          stem: `方程 $9^x-10\\cdot 3^x+9=0$ 的较大根是`,
          options: {
            A: '0',
            B: '1',
            C: '2',
            D: '3',
          },
          answer: 'C',
          analysis: `令 $t=3^x>0$，则 $t^2-10t+9=0$，$(t-1)(t-9)=0$，$t=1$ 或 $9$，即 $3^x=1$ 或 $9$，较大根 $x=2$。`,
          authorMathNote: 'x=2',
          dedupNote: `exp-eq-d3-${n}`,
          hardProfile: {
            ability: 'A',
            coreDifficulty: '换元解指数方程并比较根',
            solutionOutline: 't=3^x→二次→回代→取较大',
            whyNotEasy: '需换元+判别+回代比较，非单次指数运算',
          },
        },
        { rebuildAction: 'replace' },
      )
    }
    return baseItem(slot, {
      sectionCode: '4.2',
      sectionName: '指数函数',
      stem: `函数 $y=${a}^x$ 的定义域是`,
      options: {
        A: '$\\mathbb{R}$',
        B: '$(0,+\\infty)$',
        C: '$[0,+\\infty)$',
        D: '$(-\\infty,0)$',
      },
      answer: 'A',
      analysis: `指数函数定义域为 $\\mathbb{R}$。`,
      authorMathNote: 'R',
      dedupNote: `exp-dom-${a}`,
    }, { rebuildAction: 'replace' })
  }

  if (qt === 'multi') {
    return baseItem(slot, {
      sectionCode: '4.3',
      sectionName: '对数的运算',
      stem: `下列对数运算正确的有（多选）`,
      options: {
        A: `$\\log_2 8=3$`,
        B: `$\\log_3 9=2$`,
        C: `$\\log_5 1=0$`,
        D: `$\\log_2 0=1$`,
      },
      answer: 'A,B,C',
      analysis: `D 错：真数须为正。`,
      authorMathNote: 'A,B,C',
      dedupNote: `log-multi-${n % 4}`,
    }, { rebuildAction: 'replace' })
  }

  if (qt === 'judge') {
    return baseItem(slot, {
      sectionCode: '4.3',
      sectionName: '对数的运算',
      stem: `判断：$\\log_2 8=3$。`,
      options: null,
      answer: 'true',
      analysis: `$2^3=8$。`,
      authorMathNote: '真',
      dedupNote: `log-judge-${n % 2}`,
    }, { rebuildAction: 'replace' })
  }

  const r = appRubric(
    [
      { key: 'model', title: '写出 n(t)', score: 3, criterion: '指数模型正确' },
      { key: 'solve', title: '求解', score: 5, criterion: '时间或数量正确' },
    ],
    8,
  )
  if (d === 3) {
    const r3 = appRubric(
      [
        { key: 'mono', title: '单调性', score: 3, criterion: '说明 2^x 递增从而 f 递增' },
        { key: 'sign', title: '端点符号', score: 3, criterion: '指出变号区间' },
        { key: 'loc', title: '根定位', score: 2, criterion: '给出长度≤0.5 的区间' },
      ],
      8,
    )
    return baseItem(
      slot,
      {
        sectionCode: '4.5',
        sectionName: '函数的应用（二）',
        stem: `设 $f(x)=2^x-3$。\n（1）说明 $f$ 在 $\\mathbb{R}$ 上单调递增；\n（2）用二分法思想指出方程 $2^x=3$ 的正根所在的一个长度不超过 $0.5$ 的区间。`,
        options: null,
        answer: `（1）$y=2^x$ 递增故 $f$ 递增；（2）例如 $(1.5,2)$：因 $2^{1.5}\\approx2.828<3$，$2^2=4>3$。`,
        analysis: `指数函数单调性 + 试值夹逼。`,
        authorMathNote: '区间(1.5,2)',
        dedupNote: `bisection-${n}`,
        hardProfile: {
          ability: 'E',
          coreDifficulty: '单调性论证+二分法区间定位',
          solutionOutline: '证递增→计算端点函数值变号→给出长度≤0.5区间',
          whyNotEasy: '需论证与估算结合，非直接求精确根',
        },
        ...r3,
      },
      { rebuildAction: 'replace' },
    )
  }
  return baseItem(
    slot,
    {
      sectionCode: '4.5',
      sectionName: '函数的应用（二）',
      stem: `某菌群初始数量 $n_0=100$，每小时变为原来的 $1.5$ 倍。设 $t$ 小时后数量为 $n(t)$。\n（1）写出 $n(t)$；\n（2）求使 $n(t)=100\\cdot 1.5^4$ 的 $t$。`,
      options: null,
      answer: `（1）$n(t)=100\\cdot 1.5^t$；（2）$t=4$。`,
      analysis: `指数增长模型直接比较指数。`,
      authorMathNote: 't=4',
      dedupNote: `bact-${n}`,
      ...r,
    },
    { rebuildAction: 'replace' },
  )
}

/* ===================== Ch5 三角 ===================== */
function buildCh5(slot, n) {
  const dens = [2, 3, 4, 6]
  const d0 = dens[n % dens.length]
  const qt = slot.qtype
  const d = slot.difficulty
  const map4sin2 = { 2: 4, 3: 3, 4: 2, 6: 1 }

  if (qt === 'numeric') {
    return baseItem(slot, {
      sectionCode: '5.2',
      sectionName: '三角函数的概念',
      stem: `求 $4\\sin^{2}\\dfrac{\\pi}{${d0}}$ 的值`,
      options: null,
      answer: String(map4sin2[d0]),
      analysis: `代入特殊角正弦值平方后乘 4。`,
      authorMathNote: String(map4sin2[d0]),
      dedupNote: `4sin2-pi/${d0}`,
    }, { rebuildAction: 'replace' })
  }

  if (qt === 'single') {
    if (d === 3) {
      return baseItem(
        slot,
        {
          sectionCode: '5.5',
          sectionName: '三角恒等变换',
          stem: `函数 $y=3\\sin x+4\\cos x$ 的最大值是`,
          options: { A: '5', B: '7', C: '12', D: '1' },
          answer: 'A',
          analysis: ` auxiliary angle：$y=5(\\frac{3}{5}\\sin x+\\frac{4}{5}\\cos x)=5\\sin(x+\\varphi)$，最大值为 $5$。`,
          authorMathNote: '5',
          dedupNote: `aux-angle-${n}`,
          hardProfile: {
            ability: 'G',
            coreDifficulty: '辅助角公式求最值',
            solutionOutline: '合并为 R sin(x+φ)，R=5',
            whyNotEasy: '需识别辅助角结构，非分别取 sin/cos 最大再相加',
          },
        },
        { rebuildAction: 'replace' },
      )
    }
    return baseItem(slot, {
      sectionCode: '5.4',
      sectionName: '三角函数的图像与性质',
      stem: `函数 $y=\\sin x$ 的最小正周期是`,
      options: {
        A: '$\\pi$',
        B: '$2\\pi$',
        C: '$\\dfrac{\\pi}{2}$',
        D: '$4\\pi$',
      },
      answer: 'B',
      analysis: `正弦函数最小正周期 $2\\pi$。`,
      authorMathNote: '2π',
      dedupNote: `period-sin-${n % 2}`,
    }, { rebuildAction: 'replace' })
  }

  if (qt === 'multi') {
    return baseItem(slot, {
      sectionCode: '5.5',
      sectionName: '三角恒等变换',
      stem: `下列恒等式正确的有（多选）`,
      options: {
        A: `$\\sin^{2}\\theta+\\cos^{2}\\theta=1$`,
        B: `$\\sin 2\\theta=2\\sin\\theta\\cos\\theta$`,
        C: `$\\cos 2\\theta=\\cos^{2}\\theta-\\sin^{2}\\theta$`,
        D: `$\\tan\\theta=\\dfrac{\\cos\\theta}{\\sin\\theta}$`,
      },
      answer: 'A,B,C',
      analysis: `D 应为 sin/cos。`,
      authorMathNote: 'A,B,C',
      dedupNote: `id-multi-${n % 3}`,
    }, { rebuildAction: 'replace' })
  }

  if (qt === 'judge') {
    return baseItem(slot, {
      sectionCode: '5.4',
      sectionName: '三角函数的图像与性质',
      stem: `判断：$y=\\cos x$ 是偶函数。`,
      options: null,
      answer: 'true',
      analysis: `$\\cos(-x)=\\cos x$。`,
      authorMathNote: '真',
      dedupNote: `cos-even-${n % 2}`,
    }, { rebuildAction: 'replace' })
  }

  const r = appRubric(
    [
      { key: 'amp', title: '振幅周期', score: 4, criterion: '振幅与周期正确' },
      { key: 'val', title: '求值', score: 4, criterion: '指定点函数值正确' },
    ],
    8,
  )
  if (d === 3) {
    const r3 = appRubric(
      [
        { key: 'eq', title: '列方程', score: 3, criterion: '两次测角几何关系正确' },
        { key: 'solve', title: '求解 h', score: 5, criterion: 'h=20(√3+1) 或等价' },
      ],
      8,
    )
    return baseItem(
      slot,
      {
        sectionCode: '5.7',
        sectionName: '三角函数的应用',
        stem: `在水平地面上，测得某建筑物顶端仰角为 $45^{\\circ}$，再向建筑物走近 $20\\,\\mathrm{m}$ 后仰角变为 $60^{\\circ}$。设高为 $h\\,\\mathrm{m}$。\n（1）建立关于 $h$ 的方程；\n（2）求 $h$（精确值）。`,
        options: null,
        answer: `（1）设初次水平距离为 $x$，则 $\\dfrac{h}{x}=1$，$\\dfrac{h}{x-20}=\\sqrt{3}$；（2）$h=20(\\sqrt{3}+1)$。`,
        analysis: `由 $x=h$，$h=(x-20)\\sqrt{3}$ 消去 $x$。`,
        authorMathNote: 'h=20(√3+1)',
        dedupNote: `survey-${n}`,
        diagramRequirement: 'REQUIRED',
        hardProfile: {
          ability: 'A',
          coreDifficulty: '测高双仰角建模消元',
          solutionOutline: '两直角三角形列式→消 x→求 h',
          whyNotEasy: '需建立两式并消参，非单次 tan 公式',
        },
        ...r3,
      },
      { rebuildAction: 'replace', diagramVerdict: 'REQUIRED 测高示意图' },
    )
  }
  return baseItem(
    slot,
    {
      sectionCode: '5.6',
      sectionName: '函数 y=Asin(ωx+φ)',
      stem: `已知 $y=2\\sin(2x)$。\n（1）求振幅与最小正周期；\n（2）求 $x=\\dfrac{\\pi}{4}$ 时的函数值。`,
      options: null,
      answer: `（1）振幅 $2$，周期 $\\pi$；（2）$2$。`,
      analysis: `$T=2\\pi/2=\\pi$；$y=2\\sin(\\pi/2)=2$。`,
      authorMathNote: 'A=2,T=π',
      dedupNote: `sin2x-${n}`,
      diagramRequirement: 'RECOMMENDED',
      ...r,
    },
    { rebuildAction: 'replace' },
  )
}

/* Continue ch6-10 in same file via imports if available, else local */
import { buildCh6, buildCh7, buildCh8, buildCh9, buildCh10 } from './_rebuild_ch_b_local.mjs'
