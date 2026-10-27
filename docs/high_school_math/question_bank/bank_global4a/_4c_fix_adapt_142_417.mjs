import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath, pathToFileURL } from 'url'
import { appRubric } from './_rebuild_core.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const { candidates: raw } = await import(
  pathToFileURL(path.join(qb, 'candidates-g4a-500.mjs')).href + '?t=' + Date.now()
)
const list = raw.map((c) => ({ ...c }))
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
function bind(c, hp) {
  c.hardProfile = { ...hp, contentSha256: sha(c) }
}

// Fix numeric adapt
{
  const c = byId.get('CAND-G4A-357')
  if (c) {
    // 2sin+3cos max = sqrt(13) keep exact
    Object.assign(c, {
      stem: `$y=2\\sin x+3\\cos x$ 的最大值是（填最简根式系数形式下的被开方数：若最大值为 $\\sqrt{n}$，填 $n$）`,
      answer: '13',
      analysis: `$R=\\sqrt{2^{2}+3^{2}}=\\sqrt{13}$，故被开方数为 13。`,
      authorMathNote: '13',
      sourceEvidence: 'GLOBAL-4C 数值格式修复；非高考真题',
    })
    bind(c, {
      coreChallenge: '辅助角化一求最大值',
      reasoningSteps: ['求 R=√(a²+b²)', '最大值即 R', '按题意填 n'],
      difficultyEvidence: '需构造辅助角而非 a+b',
      misconceptionTrap: '答 5',
      alternativeApproach: '向量点积',
      verification: '√13',
    })
  }
}
{
  const c = byId.get('CAND-G4A-419')
  if (c) {
    Object.assign(c, {
      stem: `$\\dfrac{5-\\mathrm{i}}{1+\\mathrm{i}}=a+b\\mathrm{i}$，则 $a+b=$（填小数或分数均可的标准值：填分数 $-\\dfrac{1}{1}$ 的分子分母和的相反？改为填有理数）`,
      answer: '-3',
      analysis: `乘 $1-\\mathrm{i}$：分子 $(5-\\mathrm{i})(1-\\mathrm{i})=5-5\\mathrm{i}-\\mathrm{i}+\\mathrm{i}^{2}=4-6\\mathrm{i}$，分母 2，故 $a=2,b=-3$，$a+b=-1$。更正答案为 -1。`,
      authorMathNote: '-1',
    })
    // fix properly
    c.answer = '-1'
    c.stem = `$\\dfrac{5-\\mathrm{i}}{1+\\mathrm{i}}=a+b\\mathrm{i}$，则 $a+b=$`
    c.analysis =
      '乘 $1-\\mathrm{i}$：分子 $(5-\\mathrm{i})(1-\\mathrm{i})=4-6\\mathrm{i}$，分母 2，得 $a=2,b=-3$，$a+b=-1$。'
    c.sourceEvidence = 'GLOBAL-4C 数值格式修复；非高考真题'
    bind(c, {
      coreChallenge: '复数除法后求实虚部和',
      reasoningSteps: ['乘共轭', '分离 a,b', '求和'],
      difficultyEvidence: '多步运算易错虚部',
      misconceptionTrap: '分母当 0',
      alternativeApproach: '无本质不同',
      verification: '-1',
    })
  }
}

// Rewrite 142 / 417 as real hard judges (same chapters)
{
  const c = byId.get('CAND-G4A-142')
  if (c) {
    Object.assign(c, {
      chapterNo: c.chapterNo,
      qtype: 'judge',
      difficulty: 3,
      stem: `判断：若 $\\sin\\theta=\\dfrac{3}{5}$ 且 $\\theta$ 为第二象限角，则 $\\cos\\theta=\\dfrac{4}{5}$。`,
      answer: 'false',
      analysis:
        '第二象限余弦为负：$\\cos\\theta=-\\dfrac{4}{5}$。仅由同角关系 $|\\cos|=4/5$，符号由象限决定。',
      authorMathNote: 'false',
      sourceEvidence: 'GLOBAL-4C 虚标压轴重写；非高考真题',
      dedupNote: '4c-142-rewrite',
      options: null,
      maxScore: null,
      rubric: null,
      diagramRequirement: 'NOT_NEEDED',
      noDiagramReason: '文字条件充分，无需图示。',
    })
    bind(c, {
      coreChallenge: '同角关系结合象限定号',
      reasoningSteps: ['由 sin 求 |cos|', '第二象限取负', '否定命题'],
      difficultyEvidence: '需象限定号，不是背公式',
      misconceptionTrap: '直接取正 4/5',
      alternativeApproach: '单位圆',
      verification: '假',
    })
  }
}
{
  const c = byId.get('CAND-G4A-417')
  if (c) {
    Object.assign(c, {
      qtype: 'judge',
      difficulty: 3,
      stem: `判断：平面内非零向量 $\\vec a,\\vec b$ 满足 $\\vec a\\cdot\\vec b=|\\vec a||\\vec b|$，则 $\\vec a$ 与 $\\vec b$ 方向相同（共线同向）。`,
      answer: 'true',
      analysis:
        '由数量积定义 $\\cos\\theta=1$，故夹角 0，方向相同。需注意零向量情形已排除。',
      authorMathNote: 'true',
      sourceEvidence: 'GLOBAL-4C 虚标压轴重写；非高考真题',
      dedupNote: '4c-417-rewrite',
      options: null,
      maxScore: null,
      rubric: null,
      diagramRequirement: 'NOT_NEEDED',
      noDiagramReason: '文字条件充分，无需图示。',
    })
    bind(c, {
      coreChallenge: '数量积取等与方向关系',
      reasoningSteps: ['写 cosθ=1', '得 θ=0', '结论同向'],
      difficultyEvidence: '等号条件的几何意义',
      misconceptionTrap: '以为只共线可反向',
      alternativeApproach: '坐标：成正比例且比例>0',
      verification: '真',
    })
  }
}

const merged = list.map((c) => byId.get(c.id))
function write(file, header, arr) {
  fs.writeFileSync(file, `${header}\nexport const candidates = ${JSON.stringify(arr, null, 2)};\n`)
}
write(path.join(qb, 'candidates-g4a-500.mjs'), '/** GLOBAL-4C adapt+142/417 fix */', merged)
for (let g = 1; g <= 5; g++) {
  write(path.join(__dirname, `g4a_group0${g}.mjs`), `/** GLOBAL-4C group ${g} */`, merged.slice((g - 1) * 100, g * 100))
}
console.log('fixed 357,419,142,417')
