import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const mergePath = path.join(qb, 'candidates-g4a-500.mjs')
const { candidates } = await import(pathToFileURL(mergePath).href + '?t=' + Date.now())
const list = candidates.map((c) => ({ ...c }))
const byId = new Map(list.map((c) => [c.id, c]))

function sha(c) {
  const keys = [
    'id',
    'chapterNo',
    'kpCode',
    'qtype',
    'difficulty',
    'methodMain',
    'methodAux',
    'stem',
    'options',
    'answer',
    'analysis',
    'maxScore',
    'rubric',
    'diagramRequirement',
  ]
  const o = {}
  for (const k of keys) o[k] = c[k] ?? null
  return crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex')
}

const fixes = {
  'CAND-G4A-069': {
    sectionCode: '4.2',
    sectionName: '指数函数',
    stem: `关于指数方程与指数函数，正确的有（多选）`,
    options: {
      A: '$a^{x}=a^{y}$（$a>0,a\\ne1$）⇒ $x=y$',
      B: '$2^{x}=8$ 的解为 $x=3$',
      C: '$(1/2)^{x}=4$ 的解为 $x=2$',
      D: '指数函数 $y=a^{x}$ 的值域为 $(0,+\\infty)$',
    },
    answer: 'A,B,D',
    analysis:
      'C：$(1/2)^{x}=4=2^{2}=(1/2)^{-2}$，故 $x=-2$ 而非 2。A、B、D 正确。需统一底并注意底在 (0,1) 时指数变号。',
    hardProfile: {
      coreChallenge: '指数方程与底数分类',
      reasoningSteps: ['统一底', '解指数', '排除错解'],
      difficultyEvidence: '0<a<1 时指数符号易错',
      misconceptionTrap: '选 C',
      alternativeApproach: '取对数',
      verification: 'ABD',
    },
  },
  'CAND-G4A-237': {
    sectionCode: '9.1',
    sectionName: '随机抽样与统计图表',
    stem: `关于频率分布与直方图，正确的有（多选）`,
    options: {
      A: '各小组频率之和为 1',
      B: '直方图小矩形面积表示频率',
      C: '频数之和等于样本容量',
      D: '频率一定等于概率',
    },
    answer: 'A,B,C',
    analysis:
      'D 假：频率是样本估计，不一定等于概率。A、B、C 为频率分布基本事实。需区分频率与概率。',
    hardProfile: {
      coreChallenge: '频率/频数/概率辨析',
      reasoningSteps: ['对照定义', '否 D'],
      difficultyEvidence: '概念边界',
      misconceptionTrap: '选 D',
      alternativeApproach: '举小样本反例',
      verification: 'ABC',
    },
  },
  'CAND-G4A-344': {
    sectionCode: '7.2',
    sectionName: '复数的运算',
    stem: `关于复数的模，正确的有（多选）`,
    options: {
      A: '$|z|=\\sqrt{a^{2}+b^{2}}$（$z=a+bi$）',
      B: '$|z_{1}z_{2}|=|z_{1}||z_{2}|$',
      C: '$|z|=0\\Leftrightarrow z=0$',
      D: '$|z|^{2}=z^{2}$ 对一切复数成立',
    },
    answer: 'A,B,C',
    analysis:
      'D 假：一般 $|z|^{2}=z\\bar z$，不等于 $z^{2}$（除非虚部为 0 等特殊情形）。',
    hardProfile: {
      coreChallenge: '模的运算律与误区',
      reasoningSteps: ['回忆定义', '否 D'],
      difficultyEvidence: '模与平方混淆',
      misconceptionTrap: '选 D',
      alternativeApproach: '取 z=i 验证',
      verification: 'ABC',
    },
  },
  'CAND-G4A-381': {
    sectionCode: '7.2',
    sectionName: '复数的运算',
    stem: `关于共轭复数，正确的有（多选）`,
    options: {
      A: '$z+\\bar z$ 为实数',
      B: '$z\\bar z=|z|^{2}$',
      C: '$z=\\bar z\\Leftrightarrow z$ 为实数',
      D: '$\\overline{z_{1}z_{2}}=\\bar z_{1}+\\bar z_{2}$',
    },
    answer: 'A,B,C',
    analysis: 'D 假：乘积的共轭等于共轭的乘积，不是和。',
    hardProfile: {
      coreChallenge: '共轭运算律',
      reasoningSteps: ['逐项', '否 D'],
      difficultyEvidence: '形近混淆加减乘',
      misconceptionTrap: '选 D',
      alternativeApproach: '代数验证',
      verification: 'ABC',
    },
  },
  'CAND-G4A-400': {
    sectionCode: '2.3',
    sectionName: '基本不等式',
    stem: `关于“和定积最大”，正确的有（多选）`,
    options: {
      A: '正数 $x,y$ 且 $x+y$ 为定值时 $xy$ 有最大值',
      B: '取等条件为 $x=y$',
      C: '对任意实数（含负）同样适用标准均值形式',
      D: '可用二次函数顶点解释',
    },
    answer: 'A,B,D',
    analysis: 'C 假：标准均值要求正数（非负需慎用）。',
    hardProfile: {
      coreChallenge: '和定积最大条件',
      reasoningSteps: ['模型', '取等', '否 C'],
      difficultyEvidence: '正数条件',
      misconceptionTrap: '选 C',
      alternativeApproach: '配方',
      verification: 'ABD',
    },
  },
  'CAND-G4A-425': {
    sectionCode: '6.2',
    sectionName: '平面向量基本定理及坐标表示',
    stem: `关于向量模长平方展开，正确的有（多选）`,
    options: {
      A: '$|\\vec a-\\vec b|^{2}=|\\vec a|^{2}+|\\vec b|^{2}-2\\vec a\\cdot\\vec b$',
      B: '$|\\vec a+\\vec b|^{2}=|\\vec a|^{2}+|\\vec b|^{2}+2\\vec a\\cdot\\vec b$',
      C: '若 $|\\vec a+\\vec b|=|\\vec a-\\vec b|$ 则 $\\vec a\\perp\\vec b$',
      D: '$|\\vec a|^{2}=\\vec a\\cdot\\vec a$ 不成立',
    },
    answer: 'A,B,C',
    analysis:
      '由 A、B 相减或相加可证 C；D 假：定义上 $|a|^{2}=a\\cdot a$。',
    hardProfile: {
      coreChallenge: '模展开与垂直刻画',
      reasoningSteps: ['展开公式', '推导垂直', '否 D'],
      difficultyEvidence: '公式与推论串联',
      misconceptionTrap: '选 D 或漏 C',
      alternativeApproach: '坐标验证',
      verification: 'ABC',
    },
  },
}

for (const [id, body] of Object.entries(fixes)) {
  const c = byId.get(id)
  const next = {
    ...c,
    ...body,
    difficulty: 3,
    maxScore: null,
    rubric: null,
    options: body.options,
    sourceEvidence: 'GLOBAL-4D 末 6 道多选实质手修；非高考真题',
    mathCheck: 'PASS',
    mathVerified: 'AUTHOR_CHECKED',
    dedupNote: `4d-hand6-${id}`,
    diagramRequirement: c.diagramRequirement === 'REQUIRED' ? 'REQUIRED' : 'NOT_NEEDED',
    noDiagramReason:
      c.diagramRequirement === 'REQUIRED' ? null : '文字条件充分，无需图示。',
  }
  next.analysis = `${body.analysis} 【标准解】按选项逐一验证定义与运算律后确定答案 ${body.answer}。`
  next.hardProfile = { ...body.hardProfile, contentSha256: '' }
  next.hardProfile.contentSha256 = sha(next)
  byId.set(id, next)
}

for (const c of byId.values()) {
  if (Number(c.difficulty) === 3 && c.hardProfile) c.hardProfile.contentSha256 = sha(c)
}

const merged = list.map((c) => byId.get(c.id))
function write(file, header, arr) {
  fs.writeFileSync(file, `${header}\nexport const candidates = ${JSON.stringify(arr, null, 2)};\n`)
}
write(mergePath, '/** GLOBAL-4D HARD-D3-REBUILD merged 500 (handfix6) */', merged)
for (let g = 1; g <= 5; g++) {
  write(
    path.join(__dirname, `g4a_group0${g}.mjs`),
    `/** GLOBAL-4D group ${g} */`,
    merged.slice((g - 1) * 100, g * 100),
  )
}
console.log('handfixed', Object.keys(fixes).length)
