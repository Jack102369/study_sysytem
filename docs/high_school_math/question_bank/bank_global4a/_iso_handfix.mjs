/**
 * Hand-fix remaining low-value isomorphic clusters after automated rounds.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { normStem, normExact, appRubric, baseItem, CRUTCH_RE } from './_rebuild_core.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const m = await import(pathToFileURL(path.join(root, 'candidates-g4a-500.mjs')).href + '?t=' + Date.now())
const candidates = m.candidates.map((c) => ({ ...c }))
const byId = new Map(candidates.map((c) => [c.id, c]))

function rub2(a, b, max = 8) {
  return appRubric(
    [
      { key: 'p1', title: a.t, score: a.s, criterion: a.c },
      { key: 'p2', title: b.t, score: b.s, criterion: b.c },
    ],
    max,
  )
}

function apply(id, partial, evidenceExtra = {}) {
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
  const { item } = baseItem(slot, {
    ...partial,
    sourceEvidence: '同构清理整题重设计；非高考真题',
  }, {
    rebuildAction: 'iso_handfix',
    dedupVerdict: evidenceExtra.dedupVerdict || 'handfix DISTINCT',
    ...evidenceExtra,
  })
  if (CRUTCH_RE.test(item.stem)) throw new Error('crutch ' + id)
  Object.assign(c, item)
}

// --- ch4 single family: keep 021, replace others with distinct log/exp tasks ---
apply('CAND-G4A-161', {
  sectionCode: '4.3',
  sectionName: '对数',
  stem: '$\\log_3 27-\\log_3 3=$',
  options: { A: '2', B: '3', C: '1', D: '0' },
  answer: 'A',
  analysis: '$3-1=2$。',
  authorMathNote: '2',
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '文字条件充分，无需图示。',
})
apply('CAND-G4A-197', {
  sectionCode: '4.2',
  sectionName: '指数函数',
  stem: '方程 $2^{x}=16$ 的解为',
  options: { A: '4', B: '3', C: '2', D: '8' },
  answer: 'A',
  analysis: '$2^4=16$。',
  authorMathNote: '4',
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '文字条件充分，无需图示。',
})
apply('CAND-G4A-401', {
  sectionCode: '4.4',
  sectionName: '对数函数',
  stem: '函数 $y=\\log_{1/2}x$ 在 $(0,+\\infty)$ 上',
  options: { A: '单调递减', B: '单调递增', C: '先增后减', D: '常数' },
  answer: 'A',
  analysis: '底∈(0,1) 递减。',
  authorMathNote: '减',
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '文字条件充分，无需图示。',
})

// --- ch7 application ---
apply('CAND-G4A-104', {
  sectionCode: '7.2',
  sectionName: '复数的运算',
  stem: '设 $z=3-4\\mathrm{i}$。\n（1）求 $|z|$；（2）求 $z\\cdot\\overline{z}$。',
  options: null,
  answer: '（1）5；（2）25。',
  analysis: '$|z|=5$，$z\\overline{z}=|z|^2=25$。',
  authorMathNote: '5;25',
  ...rub2({ t: '模', s: 4, c: '5' }, { t: '乘共轭', s: 4, c: '25' }),
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '文字条件充分，无需图示。',
  hardProfile: {
    ability: 'B',
    coreDifficulty: '模与共轭乘积关系',
    solutionOutline: '求模→用模方公式',
    whyNotEasy: '需联系共轭与模方，非单步加减',
  },
})
apply('CAND-G4A-303', {
  sectionCode: '7.2',
  sectionName: '复数的运算',
  stem: '计算 $\\dfrac{1+2\\mathrm{i}}{1-\\mathrm{i}}$，并写成 $a+bi$ 形式，再求其模。',
  options: null,
  answer: '$-\\dfrac{1}{2}+\\dfrac{3}{2}i$；模 $\\sqrt{\\dfrac{10}{4}}=\\dfrac{\\sqrt{10}}{2}$。',
  analysis: '分母实化后求模。',
  authorMathNote: '模√10/2',
  ...rub2({ t: '化简', s: 5, c: 'a+bi' }, { t: '模', s: 5, c: '正确' }, 10),
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '文字条件充分，无需图示。',
  hardProfile: {
    ability: 'B',
    coreDifficulty: '复数除法实化与求模',
    solutionOutline: '乘共轭→化简→求模',
    whyNotEasy: '除法与模衔接',
  },
})

// --- ch8 cylinder+cone apps: keep 180, rewrite 440,483 ---
apply('CAND-G4A-440', {
  sectionCode: '8.3',
  sectionName: '空间几何体的表面积与体积',
  stem: '正四棱锥底面边长为 $6$，高为 $4$。\n（1）求体积；（2）求底面积。',
  options: null,
  answer: '（1）48；（2）36。',
  analysis: '$V=\\dfrac{1}{3}\\times 36\\times 4=48$。',
  authorMathNote: '48;36',
  ...rub2({ t: '体积', s: 4, c: '48' }, { t: '底面积', s: 4, c: '36' }),
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '文字条件充分，无需图示。',
})
apply('CAND-G4A-483', {
  sectionCode: '8.3',
  sectionName: '空间几何体的表面积与体积',
  stem: '球的半径为 $3$。\n（1）求体积（含 $\\pi$）；（2）求表面积（含 $\\pi$）。',
  options: null,
  answer: '（1）$36\\pi$；（2）$36\\pi$。',
  analysis: '$V=\\dfrac{4}{3}\\pi 27=36\\pi$，$S=4\\pi 9=36\\pi$。',
  authorMathNote: '36π;36π',
  ...rub2({ t: '体积', s: 4, c: '36π' }, { t: '表面积', s: 4, c: '36π' }),
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '文字条件充分，无需图示。',
})

// --- ch8 cone volume+section: keep 243, rewrite 438,449 ---
apply('CAND-G4A-438', {
  sectionCode: '8.6',
  sectionName: '空间直线、平面的垂直',
  stem: '在正方体 $ABCD-A_1B_1C_1D_1$ 中，说明为何 $AA_1\\perp$ 平面 $ABCD$，并由此指出 $AA_1$ 与 $BD$ 的位置关系。',
  options: null,
  answer: '侧棱垂直底面；故 $AA_1\\perp BD$。',
  analysis: '线面垂直⇒垂直面内直线。',
  authorMathNote: '垂直',
  ...rub2({ t: '线面垂直', s: 4, c: '理由' }, { t: '线线关系', s: 4, c: '垂直' }),
  diagramRequirement: 'REQUIRED',
  diagramSpecification: {
    purpose: '正方体中侧棱与底面对角线关系',
    elements: ['正方体', 'AA1', 'BD'],
    mustNotReveal: '不得标注最终证明结论为“已证”字样代替推理',
  },
  noDiagramReason: null,
  hardProfile: {
    ability: 'H',
    coreDifficulty: '线面垂直定义应用到线线垂直',
    solutionOutline: '直棱柱性质→线面垂直→推线线垂直',
    whyNotEasy: '需要空间位置关系推理而非套体积公式',
  },
})
apply('CAND-G4A-449', {
  sectionCode: '8.5',
  sectionName: '空间直线、平面的平行',
  stem: '长方体 $ABCD-A_1B_1C_1D_1$ 中，$E,F$ 分别为 $AA_1,CC_1$ 中点。\n（1）证明 $EF\\parallel$ 平面 $ABCD$；（2）求若 $AB=4,AD=3,AA_1=2$ 时 $|EF|$。',
  options: null,
  answer: '（1）中位线或坐标；（2）$5$。',
  analysis: 'EF 为侧面中位线类平行且长度等于 AC 一半相关——此处 EF 连接两侧中点，坐标得长度 5。',
  authorMathNote: '平行;5',
  ...rub2({ t: '平行证明', s: 5, c: '判定' }, { t: '长度', s: 5, c: '5' }, 10),
  diagramRequirement: 'REQUIRED',
  diagramSpecification: {
    purpose: '长方体中点连线与底面平行',
    elements: ['长方体', 'E', 'F', '底面'],
    mustNotReveal: '不得直接标注 EF 长度答案',
  },
  noDiagramReason: null,
  hardProfile: {
    ability: 'H',
    coreDifficulty: '线面平行证明+长度计算',
    solutionOutline: '构造平行→判定→坐标求长',
    whyNotEasy: '证明与计算综合',
  },
})

// --- ch4 application x+k/x clones → exp/log applications ---
const ch4Apps = {
  'CAND-G4A-365': {
    stem: '菌群初始 $100$，每小时变为 $1.5$ 倍。\n（1）写出 $n(t)$；（2）求使 $n(t)=100\\cdot 1.5^{3}$ 的 $t$。',
    answer: '$n=100\\cdot 1.5^{t}$；$t=3$。',
    analysis: '指数模型对照。',
    authorMathNote: 't=3',
    ...rub2({ t: '模型', s: 4, c: '解析式' }, { t: '求 t', s: 4, c: '3' }),
  },
  'CAND-G4A-436': {
    stem: '证明：方程 $2^{x}=6-x$ 在 $(1,2)$ 内有唯一实根（说明单调性与端点符号）。',
    answer: '构造 $f(x)=2^{x}+x-6$，连续严格增且 $f(1)<0<f(2)$。',
    analysis: '零点存在+单调唯一。',
    authorMathNote: '唯一根',
    ...rub2({ t: '构造与变号', s: 4, c: '端点' }, { t: '唯一性', s: 4, c: '单调' }),
    hardProfile: {
      ability: 'E',
      coreDifficulty: '指数方程根的存在唯一性证明',
      solutionOutline: '构造连续函数→端点变号→单调唯一',
      whyNotEasy: '证明型而非代入',
    },
  },
  'CAND-G4A-437': {
    stem: '已知 $\\log_2(x-1)+\\log_2(x+1)=3$ 且 $x>1$。求 $x$。',
    answer: '$x=3$。',
    analysis: '合并真数 $(x-1)(x+1)=8$，得 $x^2=9$，$x=3$（正）。',
    authorMathNote: '3',
    ...rub2({ t: '合并', s: 4, c: '变形' }, { t: '求解检验', s: 4, c: 'x=3' }),
  },
  'CAND-G4A-477': {
    stem: '样品质量 $800\\,g$，每小时变为原来的 $\\dfrac{1}{2}$。\n（1）写出 $n(t)$；（2）经过多少整小时首次低于 $100\\,g$？',
    answer: '$n=800\\cdot(1/2)^{t}$；$t=4$。',
    analysis: '$800/16=50<100$，且 $t=3$ 时 $100$ 边界需检验：$800/8=100$ 不低于，故 $t=4$。',
    authorMathNote: 't=4',
    ...rub2({ t: '模型', s: 4, c: '式' }, { t: '不等式', s: 4, c: 't=4' }),
  },
  'CAND-G4A-490': {
    stem: '设 $f(x)=2^{x}-4$。\n（1）说明 $f$ 在 $\\mathbb{R}$ 上单调递增；（2）用二分法思想判断方程 $2^{x}=4$ 的根落在哪个长度不超过 $1$ 的区间。',
    answer: '（1）指数增；（2）例如 $[1,2]$ 或精确根 $x=2$。',
    analysis: '单调性+定位。',
    authorMathNote: '增;[1,2]',
    ...rub2({ t: '单调', s: 4, c: '递增' }, { t: '定位', s: 4, c: '区间' }),
    hardProfile: {
      ability: 'E',
      coreDifficulty: '单调性说明与二分定位',
      solutionOutline: '指数单调→端点符号定位',
      whyNotEasy: '方法性说明',
    },
  },
  'CAND-G4A-498': {
    stem: '地震能量级近似 $M=\\log_{10}(E/E_0)$。若 $E=10^{5}E_0$，求 $M$。',
    answer: '$M=5$。',
    analysis: '对数定义。',
    authorMathNote: '5',
    ...rub2({ t: '代入', s: 4, c: '对数' }, { t: '结果', s: 4, c: '5' }),
  },
}
for (const [id, body] of Object.entries(ch4Apps)) {
  apply(id, {
    sectionCode: '4.5',
    sectionName: '指数函数与对数函数的应用',
    options: null,
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '文字条件充分，无需图示。',
    ...body,
  })
}

// --- ch5 application x+k/x → trig applications ---
const ch5Apps = {
  'CAND-G4A-369': {
    stem: '已知 $y=3\\sin(2x-\\pi/3)$。\n（1）求振幅与最小正周期；（2）求 $x=0$ 时的函数值。',
    answer: '振幅 $3$，周期 $\\pi$；值为 $3\\sin(-\\pi/3)=-\\dfrac{3\\sqrt{3}}{2}$。',
    analysis: '读 A,ω；代入。',
    authorMathNote: '3;π',
    ...rub2({ t: '参数', s: 4, c: 'A,T' }, { t: '求值', s: 4, c: '代入' }),
  },
  'CAND-G4A-376': {
    stem: '在水平地面测塔：远处仰角 $30^\\circ$，前进 $20\\,m$ 后仰角 $60^\\circ$。\n（1）建立关于塔高 $h$ 的方程；（2）求 $h$。',
    answer: '（1）$h(\\sqrt{3}-1/\\sqrt{3})=20$ 等形式；（2）$h=10\\sqrt{3}$。',
    analysis: '两仰角列式相减。',
    authorMathNote: '10√3',
    ...rub2({ t: '建模', s: 5, c: '方程' }, { t: '求解', s: 5, c: 'h' }, 10),
    hardProfile: {
      ability: 'G',
      coreDifficulty: '双仰角测量建模',
      solutionOutline: '设距离→列 tan 方程→求解',
      whyNotEasy: '几何建模非套公式',
    },
    diagramRequirement: 'REQUIRED',
    diagramSpecification: {
      purpose: '塔高双仰角测量示意',
      elements: ['地面', '塔', '两测点', '仰角标注'],
      mustNotReveal: '不得标注 h 最终值',
    },
    noDiagramReason: null,
  },
  'CAND-G4A-435': {
    stem: '已知 $\\sin\\alpha=\\dfrac{3}{5}$，$\\alpha$ 为锐角。\n（1）求 $\\cos\\alpha$；（2）求 $\\sin 2\\alpha$。',
    answer: '（1）$4/5$；（2）$24/25$。',
    analysis: '同角关系+二倍角。',
    authorMathNote: '24/25',
    ...rub2({ t: 'cos', s: 4, c: '4/5' }, { t: '二倍角', s: 4, c: '24/25' }),
  },
  'CAND-G4A-484': {
    stem: '潮高 $h(t)=2\\sin(\\pi t/6)+4$。\n（1）求最高潮高；（2）求周期。',
    answer: '（1）$6$；（2）$12$。',
    analysis: '振幅 2，平衡位置 4；T=2π/(π/6)=12。',
    authorMathNote: '6;12',
    ...rub2({ t: '最高', s: 4, c: '6' }, { t: '周期', s: 4, c: '12' }),
  },
}
for (const [id, body] of Object.entries(ch5Apps)) {
  apply(id, {
    sectionCode: '5.7',
    sectionName: '三角函数的应用',
    options: null,
    diagramRequirement: body.diagramRequirement || 'NOT_NEEDED',
    noDiagramReason: body.diagramRequirement === 'REQUIRED' ? null : '文字条件充分，无需图示。',
    ...body,
  })
}

// prior hit 275: keep as ACCEPTABLE_VARIANT (union vs prior intersection) — no change

// rewrite groups + merge
candidates.sort((a, b) => parseInt(a.id.slice(-3), 10) - parseInt(b.id.slice(-3), 10))
for (let g = 1; g <= 5; g++) {
  const part = candidates.filter((c) => {
    const n = parseInt(c.id.slice(-3), 10)
    return n >= (g - 1) * 100 + 1 && n <= g * 100
  })
  fs.writeFileSync(
    path.join(__dirname, `g4a_group0${g}.mjs`),
    `/** GLOBAL-4A ISOMORPHIC-FINAL-CLEANUP group0${g} */\nexport const candidates = ${JSON.stringify(part, null, 2)};\n`,
  )
}
fs.writeFileSync(
  path.join(root, 'candidates-g4a-500.mjs'),
  `/** GLOBAL-4A ISOMORPHIC-FINAL-CLEANUP merged 500 */\nexport const candidates = ${JSON.stringify(candidates, null, 2)};\n`,
)

// inventory check
const structMap = new Map()
for (const c of candidates) {
  const k = `${c.chapterNo}|${normStem(c.stem)}`
  if (!structMap.has(k)) structMap.set(k, [])
  structMap.get(k).push(c.id)
}
const fams = [...structMap.values()].filter((ids) => ids.length >= 2)
const prior = JSON.parse(fs.readFileSync(path.join(root, '_g4a_prior_stems.json'), 'utf8'))
const priorStruct = new Set((prior.stemsNorm || []).map((s) => normStem(s)))
const priorHits = candidates.filter((c) => priorStruct.has(normStem(c.stem))).map((c) => c.id)
console.log(JSON.stringify({ familiesLeft: fams.length, fams, priorHits, crutch: candidates.filter((c) => CRUTCH_RE.test(c.stem)).length }, null, 2))
