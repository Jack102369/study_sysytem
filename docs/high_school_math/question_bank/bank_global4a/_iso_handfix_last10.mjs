import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { baseItem, appRubric, normStem, CRUTCH_RE } from './_rebuild_core.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const m = await import(pathToFileURL(path.join(root, 'candidates-g4a-500.mjs')).href + '?t=' + Date.now())
const candidates = m.candidates.map((c) => ({ ...c }))
const byId = new Map(candidates.map((c) => [c.id, c]))

function R(a, b, max = 8) {
  return appRubric(
    [
      { key: 'p1', title: a[0], score: a[1], criterion: a[2] },
      { key: 'p2', title: b[0], score: b[1], criterion: b[2] },
    ],
    max,
  )
}

function apply(id, partial) {
  const c = byId.get(id)
  const slot = {
    id: c.id,
    book: c.book,
    chapterNo: c.chapterNo,
    specialtyCode: c.specialtyCode,
    qtype: c.qtype,
    difficulty: c.difficulty,
    kpHint: { code: c.kpCode, name: c.kpName },
  }
  const { item } = baseItem(slot, { ...partial, sourceEvidence: '同构清理整题重设计；非高考真题' }, {
    rebuildAction: 'iso_last10',
    dedupVerdict: 'DISTINCT',
  })
  if (CRUTCH_RE.test(item.stem)) throw new Error('crutch ' + id)
  Object.assign(c, item)
}

const fixes = {
  'CAND-G4A-369': {
    chapterHint: 5,
    sectionCode: '5.6',
    sectionName: '函数 y=Asin(ωx+φ)',
    stem: '已知 $y=2\\sin\\left(3x+\\dfrac{\\pi}{6}\\right)$。\n（1）求振幅与最小正周期；（2）指出由 $y=\\sin x$ 到该函数的变换步骤要点。',
    answer: '振幅2，周期$2\\pi/3$；振幅→周期→平移。',
    analysis: 'A=2，ω=3；变换顺序说明。',
    authorMathNote: '2;2π/3',
    ...R(['参数', 4, 'A与T'], ['变换', 4, '步骤']),
  },
  'CAND-G4A-374': {
    chapterHint: 4,
    sectionCode: '4.5',
    sectionName: '指数函数与对数函数的应用',
    stem: '声音强度级 $L=10\\log_{10}(I/I_0)$。若 $I=10^{6}I_0$，求 $L$。并说明对数在压缩数量级中的作用（简述）。',
    answer: '$L=60$；对数把乘积量级化为加减。',
    analysis: '$10\\log_{10}10^{6}=60$。',
    authorMathNote: '60',
    ...R(['计算', 4, '60'], ['说明', 4, '数量级']),
  },
  'CAND-G4A-376': {
    chapterHint: 5,
    sectionCode: '5.7',
    sectionName: '三角函数的应用',
    stem: '港口水深 $h(t)=3+2\\sin\\dfrac{\\pi t}{6}$（$t$ 为小时）。\n（1）求最高水深；（2）求周期。',
    answer: '最高5；周期12。',
    analysis: '平衡3振幅2；T=12。',
    authorMathNote: '5;12',
    ...R(['最高', 4, '5'], ['周期', 4, '12']),
  },
  'CAND-G4A-435': {
    chapterHint: 5,
    sectionCode: '5.5',
    sectionName: '三角恒等变换',
    stem: '已知 $\\cos\\alpha=\\dfrac{5}{13}$，$\\alpha$ 为锐角。\n（1）求 $\\sin\\alpha$；（2）求 $\\cos 2\\alpha$。',
    answer: '（1）$12/13$；（2）$(25-144)/169=-119/169$。',
    analysis: '勾股+二倍角。',
    authorMathNote: '-119/169',
    ...R(['sin', 4, '12/13'], ['二倍角', 4, 'cos2α']),
  },
  'CAND-G4A-436': {
    chapterHint: 4,
    sectionCode: '4.2',
    sectionName: '指数函数',
    stem: '比较大小：设 $a=1.1^{0.9}$，$b=1.1^{1.1}$。\n（1）说明所用单调性；（2）给出 $a$ 与 $b$ 的大小关系。',
    answer: '底>1 递增；$a<b$。',
    analysis: '指数函数单调性。',
    authorMathNote: 'a<b',
    ...R(['单调性', 4, '递增'], ['比较', 4, 'a<b']),
  },
  'CAND-G4A-437': {
    chapterHint: 4,
    sectionCode: '4.4',
    sectionName: '对数函数',
    stem: '设 $f(x)=\\log_{1/3}x$。\n（1）求定义域；（2）判断单调性并比较 $f(2)$ 与 $f(4)$。',
    answer: '定义域$(0,+\\infty)$；递减；$f(2)>f(4)$。',
    analysis: '底∈(0,1)递减。',
    authorMathNote: '减;f(2)>f(4)',
    ...R(['定义域', 3, '(0,+∞)'], ['单调比较', 5, '递减且比较'], 8),
  },
  'CAND-G4A-477': {
    chapterHint: 4,
    sectionCode: '4.3',
    sectionName: '对数',
    stem: '化简并求值：$\\log_{4}16+\\log_{4}2$。\n（1）写出化简过程；（2）给出最终值。',
    answer: '可用换底或拆分得 $2+1/2=5/2$。',
    analysis: '对数运算。',
    authorMathNote: '5/2',
    ...R(['化简', 4, '过程'], ['求值', 4, '5/2']),
  },
  'CAND-G4A-484': {
    chapterHint: 5,
    sectionCode: '5.4',
    sectionName: '三角函数的图象与性质',
    stem: '函数 $y=\\tan x$ 在 $\\left(-\\dfrac{\\pi}{2},\\dfrac{\\pi}{2}\\right)$ 上。\n（1）说明单调性；（2）说明为何在端点无定义。',
    answer: '递增；余弦为0导致正切无定义。',
    analysis: '正切性质。',
    authorMathNote: '增;无定义',
    ...R(['单调', 4, '递增'], ['定义域', 4, '理由']),
  },
  'CAND-G4A-490': {
    chapterHint: 4,
    sectionCode: '4.1',
    sectionName: '指数与指数幂的运算',
    stem: '计算 $\\left(\\dfrac{1}{8}\\right)^{-2/3}$。\n（1）化为正指数；（2）求值。',
    answer: '$8^{2/3}=4$。',
    analysis: '负指数与分数指数。',
    authorMathNote: '4',
    ...R(['变形', 4, '正指数'], ['求值', 4, '4']),
  },
  'CAND-G4A-498': {
    chapterHint: 4,
    sectionCode: '4.5',
    sectionName: '指数函数与对数函数的应用',
    stem: '某菌群 $n(t)=50\\cdot 2^{t}$（$t$ 小时）。\n（1）求 $t=3$ 时的数量；（2）求数量达到 $800$ 的最早整小时 $t$。',
    answer: '（1）400；（2）$t=4$。',
    analysis: '$50\\cdot8=400$；$50\\cdot16=800$。',
    authorMathNote: '400;4',
    ...R(['求值', 4, '400'], ['反解', 4, 't=4']),
  },
}

for (const [id, body] of Object.entries(fixes)) {
  apply(id, {
    options: null,
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '文字条件充分，无需图示。',
    ...body,
  })
}

candidates.sort((a, b) => parseInt(a.id.slice(-3), 10) - parseInt(b.id.slice(-3), 10))
for (let g = 1; g <= 5; g++) {
  const part = candidates.filter((c) => {
    const n = parseInt(c.id.slice(-3), 10)
    return n >= (g - 1) * 100 + 1 && n <= g * 100
  })
  fs.writeFileSync(path.join(__dirname, `g4a_group0${g}.mjs`), `/** GLOBAL-4A ISOMORPHIC-FINAL-CLEANUP group0${g} */\nexport const candidates = ${JSON.stringify(part, null, 2)};\n`)
}
fs.writeFileSync(path.join(root, 'candidates-g4a-500.mjs'), `/** GLOBAL-4A ISOMORPHIC-FINAL-CLEANUP merged 500 */\nexport const candidates = ${JSON.stringify(candidates, null, 2)};\n`)

function nonsense(c) {
  const st = String(c.stem)
  return /个位数/.test(st) || /多选；章/.test(st) || /研究需要/.test(st) || /目标式\s*\$x\+\\dfrac/.test(st)
}
const chMap = new Map()
for (const c of candidates) {
  const k = `${c.chapterNo}|${normStem(c.stem)}`
  if (!chMap.has(k)) chMap.set(k, [])
  chMap.get(k).push(c.id)
}
const fams = [...chMap.values()].filter((x) => x.length >= 2)
console.log({
  nonsenseLeft: candidates.filter(nonsense).length,
  chapterFamilies: fams.length,
  members: new Set(fams.flat()).size,
  fixedStem369: byId.get('CAND-G4A-369').stem.slice(0, 50),
})
