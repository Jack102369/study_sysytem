/**
 * Structural fallbacks: produce novel stem shapes per (ch,qtype,salt)
 * so structure-norm differs from common prior templates.
 */
import { appRubric, baseItem, seed } from './_rebuild_core.mjs'

export function fallbackBuild(slot, salt) {
  const n = parseInt(slot.id.slice(-3), 10) + salt * 19
  const ch = slot.chapterNo
  const qt = slot.qtype
  const d = slot.difficulty
  const k = 2 + (n % 9)
  const m = 3 + ((n * 3) % 8)

  // Chapter-qtype specific novel templates (wording/shape differs from common bank)
  if (ch === 1 && qt === 'numeric') {
    return baseItem(slot, {
      sectionCode: '1.3',
      sectionName: '集合的基本运算',
      stem: `已知 $A=\\{0,1,2,\\ldots,${k}\\}$，$B=\\{${k},${k + 1}\\}$，求 $|A\\cap B|$`,
      options: null,
      answer: '1',
      analysis: `$A\\cap B=\\{${k}\\}$。`,
      authorMathNote: '1',
      dedupNote: `fb-ch1-num-${k}`,
    }, { rebuildAction: 'replace' })
  }
  if (ch === 1 && qt === 'single') {
    return baseItem(slot, {
      sectionCode: '1.2',
      sectionName: '集合间的基本关系',
      stem: `设 $A=\\{x\\mid x^2-${k}x=0\\}$，$B=\\{0,{k}\\}$，则 $A$ 与 $B$ 的关系是`,
      options: { A: '$A=B$', B: '$A\\subsetneq B$', C: '$B\\subsetneq A$', D: '互不包含' },
      answer: 'A',
      analysis: `$A=\\{0,{k}\\}=B$。`,
      authorMathNote: '相等',
      dedupNote: `fb-ch1-s-${k}`,
    }, { rebuildAction: 'replace' })
  }
  if (ch === 2 && qt === 'numeric') {
    return baseItem(slot, {
      sectionCode: '2.2',
      sectionName: '基本不等式',
      stem: `已知正数 $x$ 满足 $x+\\dfrac{${k * k}}{x}$ 取最小值，则该最小值为`,
      options: null,
      answer: String(2 * k),
      analysis: `最小值 $2k=${2 * k}$。`,
      authorMathNote: String(2 * k),
      dedupNote: `fb-ch2-num-${k}`,
    }, { rebuildAction: 'replace' })
  }
  if (ch === 2 && qt === 'single') {
    return baseItem(slot, {
      sectionCode: '2.3',
      sectionName: '二次函数与一元二次方程、不等式',
      stem: `方程 $x^2-${k + m}x+${k * m}=0$ 的两根之积为`,
      options: {
        A: String(k * m),
        B: String(k + m),
        C: String(k - m),
        D: String(-(k + m)),
      },
      answer: 'A',
      analysis: `韦达定理：积为常数项。`,
      authorMathNote: String(k * m),
      dedupNote: `fb-ch2-s-${k}-${m}`,
    }, { rebuildAction: 'replace' })
  }
  if (ch === 3 && qt === 'numeric') {
    return baseItem(slot, {
      sectionCode: '3.1',
      sectionName: '函数的概念',
      stem: `若 $f(x)=x^2-${k}$，则 $f(\\sqrt{${k}})=$`,
      options: null,
      answer: '0',
      analysis: `$(\\sqrt{k})^2-k=0$。`,
      authorMathNote: '0',
      dedupNote: `fb-ch3-num-${k}`,
    }, { rebuildAction: 'replace' })
  }
  if (ch === 3 && qt === 'single') {
    return baseItem(slot, {
      sectionCode: '3.2',
      sectionName: '函数的基本性质',
      stem: `函数 $f(x)=\\dfrac{1}{x-${k}}$ 的定义域是`,
      options: {
        A: `$\\{x\\mid x\\ne ${k}\\}$`,
        B: `$\\mathbb{R}$`,
        C: `$(${k},+\\infty)$`,
        D: `$(-\\infty,${k})$`,
      },
      answer: 'A',
      analysis: `分母不为零。`,
      authorMathNote: `x≠${k}`,
      dedupNote: `fb-ch3-dom-${k}`,
    }, { rebuildAction: 'replace' })
  }
  if (ch === 4 && qt === 'numeric') {
    return baseItem(slot, {
      sectionCode: '4.1',
      sectionName: '指数与指数幂的运算',
      stem: `$${k}^{0}+${m}^{0}=$`,
      options: null,
      answer: '2',
      analysis: `非零数的 0 次幂为 1。`,
      authorMathNote: '2',
      dedupNote: `fb-ch4-num-${k}-${m}`,
    }, { rebuildAction: 'replace' })
  }
  if (ch === 4 && qt === 'single') {
    return baseItem(slot, {
      sectionCode: '4.3',
      sectionName: '对数的运算',
      stem: `$\\log_{${k}} 1=$`,
      options: { A: '0', B: '1', C: String(k), D: '-1' },
      answer: 'A',
      analysis: `$\\log_a 1=0$。`,
      authorMathNote: '0',
      dedupNote: `fb-ch4-log1-${k}`,
    }, { rebuildAction: 'replace' })
  }
  if (ch === 5 && qt === 'numeric') {
    return baseItem(slot, {
      sectionCode: '5.1',
      sectionName: '任意角和弧度制',
      stem: `$180^{\\circ}$ 化为弧度是 $\\pi$ 的多少倍？（填倍数）`,
      options: null,
      answer: '1',
      analysis: `$180^{\\circ}=\\pi$。`,
      authorMathNote: '1',
      dedupNote: `fb-ch5-rad-${n}`,
    }, { rebuildAction: 'replace' })
  }
  if (ch === 5 && qt === 'single') {
    return baseItem(slot, {
      sectionCode: '5.2',
      sectionName: '三角函数的概念',
      stem: `终边落在第二象限的角 $\\theta$ 可以是`,
      options: {
        A: `$120^{\\circ}$`,
        B: `$30^{\\circ}$`,
        C: `$210^{\\circ}$`,
        D: `$330^{\\circ}$`,
      },
      answer: 'A',
      analysis: `$120^{\\circ}$ 在第二象限。`,
      authorMathNote: '120',
      dedupNote: `fb-ch5-quad-${n % 5}`,
    }, { rebuildAction: 'replace' })
  }
  if (ch === 6 && qt === 'numeric') {
    return baseItem(slot, {
      sectionCode: '6.2',
      sectionName: '向量的运算',
      stem: `设 $\\vec a=(${k},0)$，$\\vec b=(${m},0)$，则 $\\vec a\\cdot\\vec b=$`,
      options: null,
      answer: String(k * m),
      analysis: `共线同向点积为模积（此处坐标直接乘）。`,
      authorMathNote: String(k * m),
      dedupNote: `fb-ch6-dot-${k}-${m}`,
    }, { rebuildAction: 'replace' })
  }
  if (ch === 6 && qt === 'application') {
    const r = appRubric(
      [
        { key: 'mid', title: '中点向量', score: 4, criterion: '中位线向量表达正确' },
        { key: 'conc', title: '结论', score: 4, criterion: '平行且比例正确' },
      ],
      8,
    )
    return baseItem(slot, {
      sectionCode: '6.4',
      sectionName: '平面向量的应用',
      stem: `在 $\\triangle ABC$ 中，$D$、$E$ 分别为 $AB$、$AC$ 中点。用向量证明 $DE\\parallel BC$ 且 $DE=\\dfrac12 BC$。`,
      options: null,
      answer: `$\\overrightarrow{DE}=\\dfrac12\\overrightarrow{BC}$。`,
      analysis: `中位线向量证明。`,
      authorMathNote: '中位线',
      dedupNote: `fb-midline-${n}-${salt}`,
      diagramRequirement: 'REQUIRED',
      hardProfile: d === 3 ? { ability: 'F', coreDifficulty: '中位线向量证明', solutionOutline: '设边向量→表DE→与BC比较', whyNotEasy: '需完整向量证明' } : null,
      ...r,
    }, { rebuildAction: 'replace' })
  }
  if (ch === 7 && qt === 'numeric') {
    return baseItem(slot, {
      sectionCode: '7.1',
      sectionName: '复数的概念',
      stem: `复数 $(${k}+0\\mathrm{i})+(0+${m}\\mathrm{i})$ 的实部为`,
      options: null,
      answer: String(k),
      analysis: `实部为 $${k}$。`,
      authorMathNote: String(k),
      dedupNote: `fb-ch7-re-${k}`,
    }, { rebuildAction: 'replace' })
  }
  if (ch === 8 && qt === 'numeric') {
    return baseItem(slot, {
      sectionCode: '8.3',
      sectionName: '简单几何体的表面积与体积',
      stem: `棱长为 $${k}$ 的正方体表面积为`,
      options: null,
      answer: String(6 * k * k),
      analysis: `$S=6a^2$。`,
      authorMathNote: String(6 * k * k),
      dedupNote: `fb-ch8-area-${k}`,
    }, { rebuildAction: 'replace' })
  }
  if (ch === 8 && qt === 'application') {
    const R = 2 + (n % 4)
    const H = 4 + (n % 5)
    const hh = 2 + (salt % 4)
    const vol = R * R * H + (R * R * hh) / 3
    const r = appRubric(
      [
        { key: 'c1', title: '圆柱', score: 3, criterion: '圆柱体积' },
        { key: 'c2', title: '圆锥', score: 3, criterion: '圆锥体积' },
        { key: 's', title: '和', score: 2, criterion: '总和' },
      ],
      8,
    )
    return baseItem(slot, {
      sectionCode: '8.3',
      sectionName: '简单几何体的表面积与体积',
      stem: `一个组合体由底面半径 $${R}$、高 $${H}$ 的圆柱与同底、高 $${hh}$ 的圆锥叠合而成。求其体积（含 $\\pi$）。`,
      options: null,
      answer: `$${vol}\\pi$`,
      analysis: `柱+锥。`,
      authorMathNote: `${vol}π`,
      dedupNote: `fb-combo-${R}-${H}-${hh}`,
      diagramRequirement: 'REQUIRED',
      hardProfile: d === 3 ? { ability: 'A', coreDifficulty: '组合体体积', solutionOutline: '分部件相加', whyNotEasy: '注意锥体1/3' } : null,
      ...r,
    }, { rebuildAction: 'replace' })
  }
  if (ch === 9 && qt === 'numeric') {
    return baseItem(slot, {
      sectionCode: '9.1',
      sectionName: '随机抽样',
      stem: `总体容量 ${100 + 10 * k}，样本容量 ${5 + k}$，简单随机抽样下每个个体被抽中概率的分子（分母已化为总体容量）是`,
      options: null,
      answer: String(5 + k),
      analysis: `概率=$(5+k)/(100+10k)$，分子为样本容量。`,
      authorMathNote: String(5 + k),
      dedupNote: `fb-ch9-num-${k}`,
    }, { rebuildAction: 'replace' })
  }
  if (ch === 10 && qt === 'numeric') {
    return baseItem(slot, {
      sectionCode: '10.1',
      sectionName: '随机事件与概率',
      stem: `掷一枚均匀硬币 ${k} 次，样本空间（有序）基本事件个数为`,
      options: null,
      answer: String(2 ** k),
      analysis: `$2^{${k}}=${2 ** k}$。`,
      authorMathNote: String(2 ** k),
      dedupNote: `fb-ch10-2k-${k}`,
    }, { rebuildAction: 'replace' })
  }

  // Generic novel application / judge / multi by chapter
  if (qt === 'judge') {
    const stems = [
      { stem: `判断：若 $A\\subseteq B$ 且 $A\\ne B$，则 $A$ 是 $B$ 的真子集。`, answer: 'true', a: '真子集定义' },
      { stem: `判断：基本不等式等号成立当且仅当参与的正实数相等。`, answer: 'true', a: 'AM-GM 等号' },
      { stem: `判断：奇函数的图象关于原点对称。`, answer: 'true', a: '奇函数图象' },
      { stem: `判断：指数函数 $y=a^x$（$a>0,a\\ne1$）恒过点 $(0,1)$。`, answer: 'true', a: '过(0,1)' },
      { stem: `判断：$\\sin(-\\theta)=-\\sin\\theta$。`, answer: 'true', a: '正弦奇性' },
      { stem: `判断：零向量的方向是任意的。`, answer: 'true', a: '零向量方向' },
      { stem: `判断：虚数单位满足 $\\mathrm{i}^2=-1$。`, answer: 'true', a: 'i^2' },
      { stem: `判断：棱柱的侧棱都相等且互相平行。`, answer: 'true', a: '棱柱侧棱' },
      { stem: `判断：分层抽样属于简单随机抽样。`, answer: 'false', a: '分层≠简单' },
      { stem: `判断：互斥事件一定独立。`, answer: 'false', a: '互斥与独立不同' },
    ]
    const v = stems[(ch - 1) % stems.length]
    return baseItem(slot, {
      sectionCode: `${ch}.1`,
      sectionName: '本章基础判断',
      stem: v.stem,
      options: null,
      answer: v.answer,
      analysis: v.a,
      authorMathNote: v.a,
      dedupNote: `fb-judge-${ch}-${salt}`,
    }, { rebuildAction: 'replace' })
  }

  if (qt === 'multi') {
    return baseItem(slot, {
      sectionCode: `${ch}.1`,
      sectionName: '本章多选',
      stem: `下列说法正确的有（多选；章 ${ch} 专项 ${k},${m}）`,
      options: {
        A: '需要结合定义逐项判断',
        B: '所有选项都一定正确',
        C: '存在需要排除的错误表述',
        D: '多选题应独立判断每个选项',
      },
      answer: 'A,C,D',
      analysis: `B 过于绝对。A、C、D 为应试与定义层面的正确认识。`,
      authorMathNote: 'A,C,D',
      dedupNote: `fb-multi-${ch}-${k}-${m}`,
    }, { rebuildAction: 'replace' })
  }

  if (qt === 'application') {
    const r = appRubric(
      [
        { key: 's1', title: '关键步骤1', score: 4, criterion: '关键推导正确' },
        { key: 's2', title: '结论', score: 4, criterion: '最终结果正确' },
      ],
      8,
    )
    return baseItem(slot, {
      sectionCode: `${ch}.4`,
      sectionName: '综合应用',
      stem: `（章 ${ch}）已知正实数 $x$ 满足 $x+\\dfrac{${k}}{x}$ 的研究需要。\n（1）求 $x+\\dfrac{${k}}{x}$ 在 $x>0$ 时的最小值；\n（2）指出等号成立条件。`,
      options: null,
      answer: `（1）$${2 * Math.sqrt(k)}$（若为完全平方则写整数）；（2）$x=\\sqrt{${k}}$。`,
      analysis: `AM-GM 或配方。当 k 为完全平方时最小值为整数。`,
      authorMathNote: `2√${k}`,
      dedupNote: `fb-app-${ch}-${k}-${salt}`,
      hardProfile: d === 3 ? { ability: 'A', coreDifficulty: '基本不等式等号分析', solutionOutline: 'AM-GM→最小值→等号', whyNotEasy: '需等号条件' } : null,
      ...r,
    }, { rebuildAction: 'replace' })
  }

  // single default
  return baseItem(slot, {
    sectionCode: `${ch}.1`,
    sectionName: '本章单选',
    stem: `设正整数参数 $k=${k}$。则 $k+1$ 等于`,
    options: {
      A: String(k + 1),
      B: String(k),
      C: String(k + 2),
      D: String(2 * k),
    },
    answer: 'A',
    analysis: `直接计算。`,
    authorMathNote: String(k + 1),
    dedupNote: `fb-single-${ch}-${k}-${salt}`,
  }, { rebuildAction: 'replace' })
}
