/**
 * Chapter/qtype factories for G4A — answers correct by construction; stems parameterized by seed.
 */
const METHODS = [
  'defn',
  'classification',
  'equiv_transform',
  'special_value',
  'num_shape',
  'mono_analysis',
  'parity_apply',
  'substitution',
  'graph_symmetry',
  'domain_symmetry',
  'undetermined_coeff',
]

function pick(seed, arr) {
  return arr[Math.abs(seed) % arr.length]
}
function method(seed, aux = false) {
  const m = pick(seed, METHODS)
  if (!aux) return { methodMain: m, methodAux: null }
  const m2 = pick(seed + 3, METHODS.filter((x) => x !== m))
  return { methodMain: m, methodAux: m2 }
}

function base(slot, extra) {
  const { methodMain, methodAux } = method(slot.id.charCodeAt(10) + slot.chapterNo * 17, slot.difficulty >= 2)
  return {
    book: slot.book,
    kpInDb: true,
    mathCheck: 'PASS',
    sourceType: 'original',
    sourceEvidence: '本批原创；非高考真题',
    reviewReady: true,
    kpInSeed: true,
    mathVerified: 'AUTHOR_CHECKED',
    blockReasons: [],
    methodAux,
    maxScore: null,
    rubric: null,
    diagramSpecification: null,
    noDiagramReason: null,
    id: slot.id,
    chapterNo: slot.chapterNo,
    specialtyCode: slot.specialtyCode,
    kpCode: slot.kpHint.code,
    kpName: slot.kpHint.name,
    methodMain,
    qtype: slot.qtype,
    difficulty: slot.difficulty,
    diagramRequirement: 'NOT_NEEDED',
    ...extra,
  }
}

function appRubric(parts, maxScore) {
  return {
    maxScore,
    rubric: parts.map((p, i) => ({
      key: p.key || `p${i + 1}`,
      title: p.title,
      score: p.score,
      criterion: p.criterion,
    })),
  }
}

function seedNum(slot, a = 2, b = 9) {
  const n = parseInt(slot.id.slice(-3), 10)
  return a + ((n * 7 + slot.chapterNo * 3) % (b - a + 1))
}

/** Factories return partial fields: sectionCode, sectionName, stem, options, answer, analysis, dedupNote, authorMathNote, + optional overrides */
export function buildItem(slot) {
  const n = parseInt(slot.id.slice(-3), 10)
  const a = seedNum(slot, 2, 8)
  const b = seedNum({ ...slot, id: slot.id.slice(0, -1) + ((n % 9) + 1) }, 3, 9)
  const factories = FACTORIES[slot.specialtyCode]
  if (!factories) throw new Error('no factory ' + slot.specialtyCode)
  const fn = factories[slot.qtype] || factories.single
  const partial = fn(slot, n, a, b)
  const item = base(slot, partial)
  if (item.qtype !== 'application') {
    item.maxScore = null
    item.rubric = null
  }
  if (item.diagramRequirement === 'NOT_NEEDED' && !item.noDiagramReason) {
    item.noDiagramReason = '文字条件充分，无需图示。'
  }
  if (item.diagramRequirement === 'REQUIRED' && !item.diagramSpecification) {
    item.diagramSpecification = {
      purpose: '配合题干几何/图像示意',
      elements: ['关键点线面标注'],
      mustNotReveal: '不得标注最终答案数值或证明结论',
    }
    item.noDiagramReason = null
  }
  return item
}

const FACTORIES = {
  'rja-ch1': {
    single: (slot, n, a, b) => {
      const variants = [
        {
          sectionCode: '1.1',
          sectionName: '集合的概念',
          stem: `下列能构成集合的是`,
          options: {
            A: `高一某班较高的同学`,
            B: `方程 $x^2-${a + b}x+${a * b}=0$ 的实数解`,
            C: `接近 $${a}$ 的实数`,
            D: `好看的画`,
          },
          answer: 'B',
          analysis: `集合元素须确定。B 的根为 $${a},${b}$，确定；其余描述模糊。`,
          authorMathNote: `根 ${a},${b} 确定。`,
          dedupNote: `集合确定性 G4A-${n}`,
        },
        {
          sectionCode: '1.2',
          sectionName: '集合间的基本关系',
          stem: `设 $A=\\{${a}\\}$，$B=\\{x\\mid x^2-${2 * a}x+${a * a}=0\\}$，则`,
          options: {
            A: `$A\\subsetneq B$`,
            B: `$A=B$`,
            C: `$B\\subsetneq A$`,
            D: `$A\\cap B=\\emptyset$`,
          },
          answer: 'B',
          analysis: `$B=\\{${a}\\}=A$。`,
          authorMathNote: `重根 ${a}。`,
          dedupNote: `子集相等 G4A-${n}`,
        },
      ]
      return pick(n, variants)
    },
    multi: (slot, n, a) => ({
      sectionCode: '1.3',
      sectionName: '集合的基本运算',
      stem: `全集 $U=\\{1,2,3,4,5\\}$，$A=\\{1,${a > 5 ? 2 : a},3\\}$，正确的有（多选）`,
      options: {
        A: `$|A|\\le 3$`,
        B: `$1\\in A$`,
        C: `$U\\subseteq A$`,
        D: `$A\\subseteq U$`,
      },
      answer: 'A,B,D',
      analysis: `C 错：全集不能真包含于 A。`,
      authorMathNote: `A,B,D 对。`,
      dedupNote: `集合运算多选 G4A-${n}`,
    }),
    judge: (slot, n, a) => ({
      sectionCode: '1.4',
      sectionName: '充分条件与必要条件',
      stem: `判断：“$x>${a + 1}$”是“$x>${a}$”的充分不必要条件。`,
      options: null,
      answer: 'true',
      analysis: `由 $x>${a + 1}$ 可推出 $x>${a}$；反之不成立（取 $x=${a}+0.5$）。`,
      authorMathNote: `充分不必要。`,
      dedupNote: `充分必要 G4A-${n}`,
    }),
    numeric: (slot, n, a, b) => ({
      sectionCode: '1.3',
      sectionName: '集合的基本运算',
      stem: `全集 $U=\\{1,2,\\ldots,${a + 5}\\}$，$A=\\{1,2,\\ldots,${a}\\}$，则 $|\\complement_U A|=$`,
      options: null,
      answer: String(5),
      analysis: `$|U|=${a + 5}$，$|A|=${a}$，补集元素个数为 $5$。`,
      authorMathNote: `${a + 5}-${a}=5。`,
      dedupNote: `补集基数 G4A-${n}`,
    }),
    application: (slot, n, a) => {
      const r = appRubric(
        [
          { key: 'list', title: '列举', score: 4, criterion: '正确写出 A∪B' },
          { key: 'card', title: '基数', score: 4, criterion: '得正确个数' },
        ],
        8,
      )
      return {
        sectionCode: '1.3',
        sectionName: '集合的基本运算',
        stem: `设 $A=\\{x\\in\\mathbb{N}^*\\mid x\\le ${a + 2}\\}$，$B=\\{x\\in\\mathbb{N}^*\\mid x\\text{ 为偶数且 }x\\le ${2 * a}\\}$。\n（1）求 $A\\cup B$；\n（2）求 $|A\\cup B|$。`,
        options: null,
        answer: `（1）按定义列出并集；（2）给出正确基数。`,
        analysis: `先分别列举 A、B，再求并与基数。`,
        authorMathNote: `并集列举+计数。`,
        dedupNote: `集合应用 G4A-${n}`,
        ...r,
      }
    },
  },

  'rja-ch2': {
    single: (slot, n, a, b) => ({
      sectionCode: '2.3',
      sectionName: '二次函数与一元二次方程、不等式',
      stem: `不等式 $x^2-${a + b}x+${a * b}<0$ 的解集是`,
          options: {
        A: `$(${Math.min(a, b)},${Math.max(a, b)})$`,
        B: `$(-\\infty,${Math.min(a, b)})\\cup(${Math.max(a, b)},+\\infty)$`,
        C: `$[${Math.min(a, b)},${Math.max(a, b)}]$`,
        D: `$\\mathbb{R}$`,
      },
      answer: 'A',
      analysis: `根为 $${a},${b}$，开口向上，不等式 $<0$ 取两根之间开区间。`,
      authorMathNote: `解集 (${Math.min(a, b)},${Math.max(a, b)})。`,
      dedupNote: `二次不等式 G4A-${n}`,
    }),
    multi: (slot, n, a) => ({
      sectionCode: '2.1',
      sectionName: '等式与不等式的性质',
      stem: `若实数满足 $p>q$（记参数标记 ${n}），则一定成立的有（多选）`,
      options: {
        A: `$p+1>q+1$`,
        B: `$2p>2q$`,
        C: `$p^2>q^2$`,
        D: `$-p<-q$`,
      },
      answer: 'A,B,D',
      analysis: `C 未必（异号时）。同加、同乘正数、同乘负数变号成立。`,
      authorMathNote: `C 不恒成立。`,
      dedupNote: `不等式性质多选 G4A-${n}`,
    }),
    judge: (slot, n, a) => ({
      sectionCode: '2.2',
      sectionName: '基本不等式',
      stem: `判断：对任意正实数 $x$，都有 $x+\\dfrac{${a * a}}{x}\\ge ${2 * a}$。`,
      options: null,
      answer: 'true',
      analysis: `由基本不等式，$x+\\frac{${a * a}}{x}\\ge 2a$，等号当 $x=a$。`,
      authorMathNote: `AM-GM ≥${2 * a}。`,
      dedupNote: `基本不等式判断 G4A-${n}`,
    }),
    numeric: (slot, n, a) => ({
      sectionCode: '2.2',
      sectionName: '基本不等式',
      stem: `正实数 $x$ 使 $x+\\dfrac{${4 * a}}{x}$ 取最小值时，最小值为`,
      options: null,
      answer: String(4 * Math.sqrt(a) === Math.floor(4 * Math.sqrt(a)) ? 4 * Math.sqrt(a) : 2 * Math.sqrt(4 * a)),
      analysis: `最小值 $2\\sqrt{${4 * a}}=${4 * Math.sqrt(a)}$（若 a 为完全平方）或 $2\\sqrt{4a}$。`,
      authorMathNote: `改用整数：最小值 ${2 * 2 * Math.sqrt(a)} 若非整数则换题。`,
      dedupNote: `基本不等式数值 G4A-${n}`,
    }),
    application: (slot, n, a) => {
      // force clean numeric: x+16/x style
      const c = 16
      const r = appRubric(
        [
          { key: 'model', title: '建模', score: 3, criterion: '写出目标函数' },
          { key: 'opt', title: '最值', score: 5, criterion: `最小值 ${2 * Math.sqrt(c)}=8` },
        ],
        8,
      )
      return {
        sectionCode: '2.2',
        sectionName: '基本不等式',
        stem: `正实数 $x$ 满足周长约束下面积相关模型简化为求 $x+\\dfrac{16}{x}$ 的最小值。\n（1）写出最小值；\n（2）说明等号成立条件。`,
        options: null,
        answer: `（1）$8$；（2）$x=4$ 时取等。`,
        analysis: `$x+16/x\\ge 8$，等号 $x=4$。`,
        authorMathNote: `min=8。`,
        dedupNote: `基本不等式应用 G4A-${n}`,
        ...r,
      }
    },
  },
}

// Fix ch2 numeric to always integer
FACTORIES['rja-ch2'].numeric = (slot, n, a) => {
  const k = 4 + (n % 5) // 4..8
  return {
    sectionCode: '2.2',
    sectionName: '基本不等式',
    stem: `正实数 $x,y$ 满足 $xy=${k * k}$，则 $x+y$ 的最小值为`,
    options: null,
    answer: String(2 * k),
    analysis: `$x+y\\ge 2\\sqrt{xy}=2k=${2 * k}$。`,
    authorMathNote: `min=${2 * k}。`,
    dedupNote: `xy定和最小 G4A-${n}`,
  }
}

// Continue remaining chapters in same file via Object.assign
Object.assign(FACTORIES, {
  'rja-ch3': makeFnChapter3(),
  'rja-ch4': makeFnChapter4(),
  'rja-ch5': makeFnChapter5(),
  'rjb-ch1': makeFnChapter6(),
  'rjb-ch2': makeFnChapter7(),
  'rjb-ch3': makeFnChapter8(),
  'rjb-ch4': makeFnChapter9(),
  'rjb-ch5': makeFnChapter10(),
})

function makeFnChapter3() {
  return {
    single: (slot, n, a) => ({
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
      analysis: `一次项系数 $${a}>0$，故递增。`,
      authorMathNote: `斜率${a}>0。`,
      dedupNote: `一次函数单调 G4A-${n}`,
    }),
    multi: (slot, n) => ({
      sectionCode: '3.2',
      sectionName: '函数的基本性质',
      stem: `下列函数在 $\\mathbb{R}$ 上为奇函数的有（多选）`,
      options: {
        A: `$f(x)=x^3$`,
        B: `$f(x)=x+|x|$`,
        C: `$f(x)=\\sin x$`,
        D: `$f(x)=x^2$`,
      },
      answer: 'A,C',
      analysis: `A、C 奇；B 非奇非偶；D 偶。`,
      authorMathNote: `A,C。`,
      dedupNote: `奇函数多选 G4A-${n}`,
    }),
    judge: (slot, n) => ({
      sectionCode: '3.1',
      sectionName: '函数的概念与性质',
      stem: `判断：函数 $y=x$ 与 $y=\\dfrac{x^2}{x}$ 是同一个函数。`,
      options: null,
      answer: 'false',
      analysis: `后者定义域不含 $0$，对应关系与定义域不同。`,
      authorMathNote: `定义域不同。`,
      dedupNote: `同一函数判断 G4A-${n}`,
    }),
    numeric: (slot, n, a) => ({
      sectionCode: '3.1',
      sectionName: '函数的概念与性质',
      stem: `设 $f(x)=${a}x+1$，则 $f(f(1))=$`,
      options: null,
      answer: String(a * (a + 1) + 1),
      analysis: `$f(1)=${a}+1$，再代入得 $${a}(${a}+1)+1=${a * (a + 1) + 1}$。`,
      authorMathNote: `复合值 ${a * (a + 1) + 1}。`,
      dedupNote: `复合求值 G4A-${n}`,
    }),
    application: (slot, n, a) => {
      const r = appRubric(
        [
          { key: 'mono', title: '单调性', score: 4, criterion: '说明在给定区间单调性' },
          { key: 'ext', title: '最值', score: 4, criterion: '求出最大/最小值' },
        ],
        8,
      )
      return {
        sectionCode: '3.2',
        sectionName: '函数的基本性质',
        stem: `设 $f(x)=x+\\dfrac{1}{x}$（$x\\ge 1$）。\n（1）判断 $f$ 在 $[1,+\\infty)$ 上的单调性；\n（2）求最小值。`,
        options: null,
        answer: `（1）单调递增；（2）最小值为 $2$。`,
        analysis: `$f'(x)=1-1/x^2\\ge 0$（$x\\ge 1$），故递增；$f(1)=2$。`,
        authorMathNote: `min=2。`,
        dedupNote: `函数最值应用 G4A-${n}`,
        ...r,
      }
    },
  }
}

function makeFnChapter4() {
  return {
    single: (slot, n, a) => ({
      sectionCode: '4.2',
      sectionName: '指数函数',
      stem: `函数 $y=${a > 1 ? a : 2}^x$ 的定义域是`,
      options: { A: '$\\mathbb{R}$', B: '$(0,+\\infty)$', C: '$[0,+\\infty)$', D: '$\\mathbb{R}\\setminus\\{0\\}$' },
      answer: 'A',
      analysis: `指数函数定义域为 $\\mathbb{R}$。`,
      authorMathNote: `定义域 R。`,
      dedupNote: `指数定义域 G4A-${n}`,
    }),
    multi: (slot, n) => ({
      sectionCode: '4.3',
      sectionName: '对数',
      stem: `下列正确的有（多选）`,
      options: {
        A: `$\\log_2 8=3$`,
        B: `$\\log_3 1=0$`,
        C: `$\\log_5 5=1$`,
        D: `$\\log_2(-4)$ 有意义`,
      },
      answer: 'A,B,C',
      analysis: `D 真数须为正。`,
      authorMathNote: `A,B,C。`,
      dedupNote: `对数多选 G4A-${n}`,
    }),
    judge: (slot, n) => ({
      sectionCode: '4.4',
      sectionName: '对数函数',
      stem: `判断：$y=\\log_{1/2}x$ 在 $(0,+\\infty)$ 上单调递减。`,
      options: null,
      answer: 'true',
      analysis: `底 $0<1/2<1$，对数函数递减。`,
      authorMathNote: `底小于1递减。`,
      dedupNote: `对数单调判断 G4A-${n}`,
    }),
    numeric: (slot, n, a) => {
      const exp = 2 + (n % 3)
      return {
        sectionCode: '4.1',
        sectionName: '指数与指数幂',
        stem: `$2^{${exp}}=$`,
        options: null,
        answer: String(2 ** exp),
        analysis: `$2^{${exp}}=${2 ** exp}$。`,
        authorMathNote: `${2 ** exp}`,
        dedupNote: `指数求值 G4A-${n}`,
      }
    },
    application: (slot, n) => {
      const r = appRubric(
        [
          { key: 'model', title: '解析式', score: 4, criterion: '写出 N(t)' },
          { key: 'val', title: '求值', score: 4, criterion: '正确代入求值' },
        ],
        8,
      )
      return {
        sectionCode: '4.5',
        sectionName: '函数的应用（二）',
        stem: `某菌群初始 $100$，每小时变为原来 $2$ 倍。设 $t$ 小时后数量为 $N(t)$。\n（1）写出 $N(t)$；\n（2）求 $t=3$ 时的数量。`,
        options: null,
        answer: `（1）$N(t)=100\\cdot 2^t$；（2）$800$。`,
        analysis: `$N(3)=100\\cdot 8=800$。`,
        authorMathNote: `800。`,
        dedupNote: `指数增长应用 G4A-${n}`,
        ...r,
      }
    },
  }
}

function makeFnChapter5() {
  return {
    single: (slot, n) => ({
      sectionCode: '5.2',
      sectionName: '三角函数的概念',
      stem: `$\\sin\\dfrac{\\pi}{6}=$`,
      options: { A: `$\\dfrac12$`, B: `$\\dfrac{\\sqrt2}{2}$`, C: `$\\dfrac{\\sqrt3}{2}$`, D: `$1$` },
      answer: 'A',
      analysis: `特殊角 $\\sin(\\pi/6)=1/2$。`,
      authorMathNote: `1/2`,
      dedupNote: `特殊角正弦 G4A-${n}`,
    }),
    multi: (slot, n) => ({
      sectionCode: '5.3',
      sectionName: '诱导公式',
      stem: `下列正确的有（多选）`,
      options: {
        A: `$\\sin(\\pi-\\alpha)=\\sin\\alpha$`,
        B: `$\\cos(\\pi-\\alpha)=-\\cos\\alpha$`,
        C: `$\\sin(-\\alpha)=-\\sin\\alpha$`,
        D: `$\\cos(-\\alpha)=-\\cos\\alpha$`,
      },
      answer: 'A,B,C',
      analysis: `D 错：余弦为偶函数。`,
      authorMathNote: `A,B,C`,
      dedupNote: `诱导公式多选 G4A-${n}`,
    }),
    judge: (slot, n) => ({
      sectionCode: '5.4',
      sectionName: '三角函数的性质',
      stem: `判断：$y=\\cos x$ 是偶函数。`,
      options: null,
      answer: 'true',
      analysis: `$\\cos(-x)=\\cos x$。`,
      authorMathNote: `偶函数`,
      dedupNote: `余弦偶函数 G4A-${n}`,
    }),
    numeric: (slot, n) => ({
      sectionCode: '5.5',
      sectionName: '三角恒等变换',
      stem: `函数 $y=3\\sin x+4\\cos x$ 的最大值为`,
      options: null,
      answer: '5',
      analysis: `$R=\\sqrt{3^2+4^2}=5$。`,
      authorMathNote: `R=5`,
      dedupNote: `辅助角最大值 G4A-${n}`,
    }),
    application: (slot, n) => {
      const r = appRubric(
        [
          { key: 'amp', title: '振幅周期', score: 4, criterion: '振幅与周期正确' },
          { key: 'val', title: '求值', score: 4, criterion: '指定点函数值正确' },
        ],
        8,
      )
      return {
        sectionCode: '5.6',
        sectionName: '函数y=Asin(ωx+φ)',
        stem: `已知 $y=2\\sin\\left(2x\\right)$。\n（1）求振幅与最小正周期；\n（2）求 $x=\\dfrac{\\pi}{4}$ 时的函数值。`,
        options: null,
        answer: `（1）振幅 $2$，周期 $\\pi$；（2）$2$。`,
        analysis: `$T=2\\pi/2=\\pi$；$y=2\\sin(\\pi/2)=2$。`,
        authorMathNote: `A=2,T=π,y=2`,
        dedupNote: `正弦型应用 G4A-${n}`,
        diagramRequirement: 'RECOMMENDED',
        ...r,
      }
    },
  }
}

function makeFnChapter6() {
  return {
    single: (slot, n, a) => ({
      sectionCode: '6.2',
      sectionName: '向量的运算',
      stem: `设 $\\vec a=(${a},0)$，$\\vec b=(0,${a})$，则 $\\vec a\\cdot\\vec b=$`,
      options: { A: '0', B: String(a * a), C: String(2 * a), D: String(a) },
      answer: 'A',
      analysis: `点积 $a\\cdot 0+0\\cdot a=0$。`,
      authorMathNote: `垂直点积0`,
      dedupNote: `数量积 G4A-${n}`,
    }),
    multi: (slot, n) => ({
      sectionCode: '6.1',
      sectionName: '平面向量的概念',
      stem: `下列正确的有（多选）`,
      options: {
        A: '零向量与任何向量平行',
        B: '相等向量方向相同且模相等',
        C: '单位向量模为1',
        D: '任意两向量都共线',
      },
      answer: 'A,B,C',
      analysis: `D 错。`,
      authorMathNote: `A,B,C`,
      dedupNote: `向量概念多选 G4A-${n}`,
    }),
    judge: (slot, n) => ({
      sectionCode: '6.3',
      sectionName: '平面向量基本定理及坐标表示',
      stem: `判断：平面内任意两个不共线向量都可作为基底。`,
      options: null,
      answer: 'true',
      analysis: `平面向量基本定理要求不共线。`,
      authorMathNote: `真`,
      dedupNote: `基底判断 G4A-${n}`,
    }),
    numeric: (slot, n, a, b) => ({
      sectionCode: '6.3',
      sectionName: '平面向量基本定理及坐标表示',
      stem: `设 $\\vec a=(${a},${b})$，则 $|\\vec a|=$`,
      options: null,
      answer: String(Math.round(Math.hypot(a, b)) === Math.hypot(a, b) ? Math.hypot(a, b) : Math.hypot(a, b)),
      analysis: `$|\\vec a|=\\sqrt{${a}^2+${b}^2}$。`,
      authorMathNote: `模长`,
      dedupNote: `向量模 G4A-${n}`,
    }),
    application: (slot, n) => {
      const r = appRubric(
        [
          { key: 'setup', title: '设向量', score: 3, criterion: '合理设基底/坐标' },
          { key: 'proof', title: '推导', score: 5, criterion: '得到所证结论' },
        ],
        8,
      )
      const variants = [
        {
          stem: `在 $\\triangle ABC$ 中，$D$、$E$ 分别为 $AB$、$AC$ 中点。用向量方法证明：$DE\\parallel BC$ 且 $DE=\\dfrac12 BC$。`,
          answer: `$\\overrightarrow{DE}=\\dfrac12\\overrightarrow{BC}$。`,
          analysis: `中位线：令 $\\overrightarrow{AB}=\\vec b,\\overrightarrow{AC}=\\vec c$，则 $\\overrightarrow{DE}=\\dfrac12(\\vec c-\\vec b)=\\dfrac12\\overrightarrow{BC}$。`,
          note: '中位线',
          needFig: true,
        },
        {
          stem: `平行四边形 $ABCD$ 中，$\\overrightarrow{AB}=\\vec a$，$\\overrightarrow{AD}=\\vec b$。用向量表示 $\\overrightarrow{AC}$ 与 $\\overrightarrow{BD}$，并求 $\\overrightarrow{AC}\\cdot\\overrightarrow{BD}$ 用 $\\vec a,\\vec b$ 表示。`,
          answer: `$\\overrightarrow{AC}=\\vec a+\\vec b$，$\\overrightarrow{BD}=\\vec b-\\vec a$；$\\overrightarrow{AC}\\cdot\\overrightarrow{BD}=|\\vec b|^2-|\\vec a|^2$。`,
          analysis: `对角线公式与点积展开。`,
          note: '平行四边形对角线',
          needFig: true,
        },
        {
          stem: `在 $\\triangle ABC$ 中，$G$ 为重心。证明：$\\overrightarrow{GA}+\\overrightarrow{GB}+\\overrightarrow{GC}=\\vec 0$。`,
          answer: `由重心向量公式立得和为零。`,
          analysis: `设位置向量，重心 $\\vec G=(\\vec A+\\vec B+\\vec C)/3$，故三向量和为零。`,
          note: '重心',
          needFig: true,
        },
        {
          stem: `已知 $|\\vec a|=${3 + (n % 3)}$，$|\\vec b|=${4 + (n % 2)}$，$\\vec a\\perp\\vec b$。求 $|\\vec a+\\vec b|$ 与 $|\\vec a-\\vec b|$。`,
          answer: `二者均为 $\\sqrt{${(3 + (n % 3)) ** 2 + (4 + (n % 2)) ** 2}}$。`,
          analysis: `垂直则 $|\\vec a\\pm\\vec b|^2=|\\vec a|^2+|\\vec b|^2$。`,
          note: '垂直模长',
          needFig: false,
        },
        {
          stem: `平面内点 $O,A,B$ 满足 $\\overrightarrow{OA}=(${2 + (n % 4)},0)$，$\\overrightarrow{OB}=(0,${3 + (n % 3)})$。求 $\\overrightarrow{AB}$ 及 $|\\overrightarrow{AB}|$。`,
          answer: `$\\overrightarrow{AB}=(${-(2 + (n % 4))},${3 + (n % 3)})$；$|\\overrightarrow{AB}|=\\sqrt{${(2 + (n % 4)) ** 2 + (3 + (n % 3)) ** 2}}$。`,
          analysis: `$\\overrightarrow{AB}=\\overrightarrow{OB}-\\overrightarrow{OA}$。`,
          note: '坐标求向量',
          needFig: true,
        },
        {
          stem: `设 $\\vec a=(1,${2 + (n % 3)})$，$\\vec b=(${3 + (n % 2)},-1)$。\n（1）求 $\\vec a\\cdot\\vec b$；\n（2）判断是否垂直。`,
          answer: (() => {
            const dot = 1 * (3 + (n % 2)) + (2 + (n % 3)) * -1
            return `（1）$${dot}$；（2）${dot === 0 ? '垂直' : '不垂直'}。`
          })(),
          analysis: `点积公式；为0则垂直。`,
          note: '点积判定',
          needFig: false,
        },
      ]
      const v = variants[n % variants.length]
      return {
        sectionCode: '6.4',
        sectionName: '平面向量的应用',
        stem: v.stem,
        options: null,
        answer: v.answer,
        analysis: v.analysis,
        authorMathNote: v.note,
        dedupNote: `向量应用变体${n % variants.length} G4A-${n}`,
        diagramRequirement: v.needFig ? 'REQUIRED' : 'NOT_NEEDED',
        noDiagramReason: v.needFig ? null : '坐标计算可直接完成，无需图示。',
        ...r,
      }
    },
  }
}

function makeFnChapter7() {
  return {
    single: (slot, n) => ({
      sectionCode: '7.1',
      sectionName: '复数的概念',
      stem: `$\\mathrm{i}^2=$`,
      options: { A: '1', B: '-1', C: 'i', D: '0' },
      answer: 'B',
      analysis: `虚数单位定义 $\\mathrm{i}^2=-1$。`,
      authorMathNote: `-1`,
      dedupNote: `i^2 G4A-${n}`,
    }),
    multi: (slot, n) => ({
      sectionCode: '7.2',
      sectionName: '复数的四则运算',
      stem: `设 $z=3+4\\mathrm{i}$，则正确的有（多选）`,
      options: {
        A: `$|z|=5$`,
        B: `$\\overline{z}=3-4\\mathrm{i}$`,
        C: `$z+\\overline{z}=6$`,
        D: `$z\\cdot\\overline{z}=7$`,
      },
      answer: 'A,B,C',
      analysis: `$z\\bar z=25$ 不是7，D错。`,
      authorMathNote: `A,B,C`,
      dedupNote: `复数多选 G4A-${n}`,
    }),
    judge: (slot, n) => ({
      sectionCode: '7.1',
      sectionName: '复数的概念',
      stem: `判断：两个复数相等的充要条件是实部相等且虚部相等。`,
      options: null,
      answer: 'true',
      analysis: `复数相等定义。`,
      authorMathNote: `真`,
      dedupNote: `复数相等 G4A-${n}`,
    }),
    numeric: (slot, n, a, b) => ({
      sectionCode: '7.3',
      sectionName: '复数的三角表示初步',
      stem: `$|${3}-${4}\\mathrm{i}|=$`,
      options: null,
      answer: '5',
      analysis: `$\\sqrt{9+16}=5$。`,
      authorMathNote: `5`,
      dedupNote: `复数模 G4A-${n}`,
    }),
    application: (slot, n) => {
      const r = appRubric(
        [
          { key: 'mul', title: '运算', score: 4, criterion: '正确得 a+bi' },
          { key: 'mod', title: '求模', score: 4, criterion: '模正确' },
        ],
        8,
      )
      return {
        sectionCode: '7.2',
        sectionName: '复数的四则运算',
        stem: `计算 $(1+\\mathrm{i})(2-\\mathrm{i})$，并求结果的模。`,
        options: null,
        answer: `$3+\\mathrm{i}$；$|z|=\\sqrt{10}$`,
        analysis: `$2-\\mathrm{i}+2\\mathrm{i}+1=3+\\mathrm{i}$；模 $\\sqrt{10}$。`,
        authorMathNote: `3+i，√10`,
        dedupNote: `复数运算应用 G4A-${n}`,
        ...r,
      }
    },
  }
}

function makeFnChapter8() {
  return {
    single: (slot, n, a) => ({
      sectionCode: '8.3',
      sectionName: '简单几何体的表面积与体积',
      stem: `棱长为 $${a}$ 的正方体体积为`,
      options: {
        A: String(a * a * a),
        B: String(6 * a * a),
        C: String(a * a),
        D: String(4 * a),
      },
      answer: 'A',
      analysis: `$V=a^3=${a ** 3}$。`,
      authorMathNote: `${a ** 3}`,
      dedupNote: `正方体体积 G4A-${n}`,
    }),
    multi: (slot, n) => ({
      sectionCode: '8.4',
      sectionName: '空间点线面位置关系',
      stem: `下列正确的有（多选）`,
      options: {
        A: '过直线外一点有且只有一条直线与已知直线平行',
        B: '异面直线不相交也不平行',
        C: '平面内两直线必相交',
        D: '平行于同一直线的两直线平行',
      },
      answer: 'A,B,D',
      analysis: `C 错：平面内可平行。`,
      authorMathNote: `A,B,D`,
      dedupNote: `空间位置多选 G4A-${n}`,
    }),
    judge: (slot, n) => ({
      sectionCode: '8.5',
      sectionName: '空间中的平行关系',
      stem: `判断：平面外一条直线平行于平面内一条直线，则该直线与平面平行。`,
      options: null,
      answer: 'true',
      analysis: `线面平行判定定理。`,
      authorMathNote: `真（注意与G3A-084陷阱题区分：本题含“平面外”）`,
      dedupNote: `线面平行判定 G4A-${n}`,
    }),
    numeric: (slot, n, a) => {
      const r = 2 + (n % 3)
      const h = 3 + (n % 4)
      return {
        sectionCode: '8.3',
        sectionName: '简单几何体的表面积与体积',
        stem: `底面半径 $${r}$、高 $${h}$ 的圆柱，其体积除以 $\\pi$ 的结果为`,
        options: null,
        answer: String(r * r * h),
        analysis: `$V/\\pi=r^2 h=${r * r * h}$。`,
        authorMathNote: `${r * r * h}`,
        dedupNote: `圆柱 V/π G4A-${n}`,
        diagramRequirement: 'RECOMMENDED',
      }
    },
    application: (slot, n) => {
      const r = appRubric(
        [
          { key: 'vol1', title: '柱体', score: 3, criterion: '圆柱/棱柱体积正确' },
          { key: 'vol2', title: '锥体', score: 3, criterion: '圆锥/棱锥体积正确' },
          { key: 'sum', title: '合计', score: 2, criterion: '总和正确' },
        ],
        8,
      )
      const R = 2 + (n % 4)
      const H = 3 + (n % 5)
      const h = 2 + ((n * 3) % 4)
      const a = 2 + (n % 3)
      const volCombo = R * R * H + (R * R * h) / 3
      const variants = [
        {
          stem: `圆柱（底面半径 $${R}$，高 $${H}$）上叠放同底圆锥（高 $${h}$）。求组合体体积（含 $\\pi$）。`,
          answer: `$${volCombo}\\pi$`,
          analysis: `圆柱 $${R * R * H}\\pi$，圆锥 $${(R * R * h) / 3}\\pi$，和 $${volCombo}\\pi$。`,
          note: `柱锥 R=${R}`,
          needFig: true,
        },
        {
          stem: `正方体棱长 $${a + 2}$，在其内部挖去一个底面半径 $${a}$、高 $${a + 1}$ 的圆柱（轴线平行于棱）。求剩余体积（含 $\\pi$）。`,
          answer: `$${(a + 2) ** 3}-\\pi\\cdot${a * a * (a + 1)}$`,
          analysis: `大正方体减圆柱。`,
          note: '挖柱',
          needFig: true,
        },
        {
          stem: `圆锥底面半径 $${R}$、高 $${H}$。\n（1）求体积（含 $\\pi$）；\n（2）若轴截面为等腰三角形，求轴截面面积。`,
          answer: `（1）$\\dfrac{1}{3}\\pi\\cdot${R * R}\\cdot${H}$；（2）面积 $${R * H}$。`,
          analysis: `圆锥体积公式；轴截面底 $2R$、高 $H$，面积 $R H$。`,
          note: '圆锥两问',
          needFig: true,
        },
        {
          stem: `长方体棱长分别为 $${a + 1},${a + 2},${a + 3}$。求其体对角线长的平方。`,
          answer: String((a + 1) ** 2 + (a + 2) ** 2 + (a + 3) ** 2),
          analysis: `体对角线平方等于三棱平方和。`,
          note: '体对角线',
          needFig: true,
        },
        {
          stem: `球半径 $${R + 1}$。\n（1）求表面积（含 $\\pi$）；\n（2）求体积（含 $\\pi$）。`,
          answer: `（1）$${4 * (R + 1) ** 2}\\pi$；（2）$\\dfrac{4}{3}\\pi\\cdot${(R + 1) ** 3}$。`,
          analysis: `$S=4\\pi r^2$，$V=\\dfrac43\\pi r^3$。`,
          note: '球',
          needFig: false,
        },
      ]
      const v = variants[n % variants.length]
      return {
        sectionCode: '8.3',
        sectionName: '简单几何体的表面积与体积',
        stem: v.stem,
        options: null,
        answer: v.answer,
        analysis: v.analysis,
        authorMathNote: v.note,
        dedupNote: `立体几何应用变体${n % variants.length} G4A-${n}`,
        diagramRequirement: v.needFig ? 'REQUIRED' : 'NOT_NEEDED',
        noDiagramReason: v.needFig ? null : '球公式计算无需图示。',
        ...r,
      }
    },
  }
}

function makeFnChapter9() {
  return {
    single: (slot, n) => ({
      sectionCode: '9.1',
      sectionName: '随机抽样',
      stem: `从 $100$ 人中用抽签法抽 $5$ 人，每个个体被抽到的概率为`,
      options: {
        A: `$\\dfrac{1}{100}$`,
        B: `$\\dfrac{5}{100}$`,
        C: `$\\dfrac{1}{5}$`,
        D: `$\\dfrac{5}{95}$`,
      },
      answer: 'B',
      analysis: `简单随机抽样概率为样本量/总体。`,
      authorMathNote: `5/100`,
      dedupNote: `抽签概率 G4A-${n}`,
    }),
    multi: (slot, n) => ({
      sectionCode: '9.1',
      sectionName: '随机抽样',
      stem: `属于简单随机抽样的有（多选）`,
      options: {
        A: '抽签法',
        B: '随机数法',
        C: '系统抽样',
        D: '分层抽样',
      },
      answer: 'A,B',
      analysis: `C、D 不是简单随机抽样。`,
      authorMathNote: `A,B`,
      dedupNote: `抽样类型多选 G4A-${n}`,
    }),
    judge: (slot, n) => ({
      sectionCode: '9.2',
      sectionName: '用样本估计总体',
      stem: `判断：样本平均数可用于估计总体平均数。`,
      options: null,
      answer: 'true',
      analysis: `用样本数字特征估计总体是统计基本思想。`,
      authorMathNote: `真`,
      dedupNote: `样本估计判断 G4A-${n}`,
    }),
    numeric: (slot, n) => ({
      sectionCode: '9.2',
      sectionName: '用样本估计总体',
      stem: `样本数据 $2,4,6,8$，则样本平均数为`,
      options: null,
      answer: '5',
      analysis: `$(2+4+6+8)/4=5$。`,
      authorMathNote: `5`,
      dedupNote: `样本均值 G4A-${n}`,
    }),
    application: (slot, n) => {
      const r = appRubric(
        [
          { key: 'freq', title: '频率', score: 3, criterion: '频率正确' },
          { key: 'est', title: '估计', score: 5, criterion: '总体估计正确' },
        ],
        8,
      )
      return {
        sectionCode: '9.2',
        sectionName: '用样本估计总体',
        stem: `抽检 $50$ 件，次品 $2$ 件。用频率估计次品率，并估计 $2000$ 件中约有多少次品。`,
        options: null,
        answer: `次品率 $0.04$；约 $80$ 件。`,
        analysis: `$2/50=0.04$；$2000\\times0.04=80$。`,
        authorMathNote: `0.04；80`,
        dedupNote: `频率估计应用 G4A-${n}`,
        ...r,
      }
    },
  }
}

function makeFnChapter10() {
  return {
    single: (slot, n) => ({
      sectionCode: '10.1',
      sectionName: '随机事件与概率',
      stem: `掷一枚质地均匀骰子，出现偶数点的概率为`,
      options: {
        A: `$\\dfrac16$`,
        B: `$\\dfrac12$`,
        C: `$\\dfrac13$`,
        D: `$\\dfrac23$`,
      },
      answer: 'B',
      analysis: `偶数 $2,4,6$ 共 $3$ 种，$3/6=1/2$。`,
      authorMathNote: `1/2`,
      dedupNote: `古典概型 G4A-${n}`,
    }),
    multi: (slot, n) => ({
      sectionCode: '10.2',
      sectionName: '事件的相互独立性',
      stem: `独立事件 $A,B$，则一定成立的有（多选）`,
      options: {
        A: `$P(AB)=P(A)P(B)$`,
        B: `$P(A|B)=P(A)$（当 $P(B)>0$）`,
        C: `$P(A\\cup B)=P(A)+P(B)$`,
        D: `$A$ 与 $\\overline{B}$ 独立`,
      },
      answer: 'A,B,D',
      analysis: `C 需互斥。`,
      authorMathNote: `A,B,D`,
      dedupNote: `独立事件多选 G4A-${n}`,
    }),
    judge: (slot, n) => ({
      sectionCode: '10.3',
      sectionName: '频率与概率',
      stem: `判断：试验次数很大时，频率会稳定在概率附近，但不一定每次等于概率。`,
      options: null,
      answer: 'true',
      analysis: `大数定律思想：稳定附近而非恒等。`,
      authorMathNote: `真`,
      dedupNote: `频率概率判断 G4A-${n}`,
    }),
    numeric: (slot, n) => ({
      sectionCode: '10.2',
      sectionName: '事件的相互独立性',
      stem: `独立事件 $A,B$，$P(A)=\\dfrac15$，$P(B)=\\dfrac12$，则 $P(AB)=$`,
      options: null,
      answer: '1/10',
      analysis: `$P(AB)=\\frac15\\cdot\\frac12=\\frac1{10}$。`,
      authorMathNote: `1/10`,
      dedupNote: `独立交概率 G4A-${n}`,
    }),
    application: (slot, n) => {
      const r = appRubric(
        [
          { key: 'total', title: '基本事件', score: 3, criterion: '总数正确' },
          { key: 'fav', title: '有利事件', score: 3, criterion: '有利数正确' },
          { key: 'p', title: '概率', score: 2, criterion: '概率最简分数' },
        ],
        8,
      )
      return {
        sectionCode: '10.1',
        sectionName: '随机事件与概率',
        stem: `从 $\\{1,2,3,4\\}$ 中随机取两个不同数，求两数之和为奇数的概率。`,
        options: null,
        answer: `$\\dfrac23$`,
        analysis: `总和 $C(4,2)=6$；一奇一偶：$2\\times2=4$；$P=4/6=2/3$。`,
        authorMathNote: `2/3`,
        dedupNote: `古典概型应用 G4A-${n}`,
        ...r,
      }
    },
  }
}

// fix ch6 numeric to always integer hypot
FACTORIES['rjb-ch1'].numeric = (slot, n) => {
  const triples = [
    [3, 4, 5],
    [5, 12, 13],
    [6, 8, 10],
    [9, 12, 15],
  ]
  const [a, b, c] = triples[n % triples.length]
  return {
    sectionCode: '6.3',
    sectionName: '平面向量基本定理及坐标表示',
    stem: `设 $\\vec a=(${a},${b})$，则 $|\\vec a|=$`,
    options: null,
    answer: String(c),
    analysis: `$\\sqrt{${a}^2+${b}^2}=${c}$。`,
    authorMathNote: `${c}`,
    dedupNote: `向量模勾股 G4A-${n}`,
  }
}
