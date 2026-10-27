/** helper: section map + wrap for G4A group02 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const prior = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../_g4a_prior_stems.json'), 'utf8'),
)
const slots = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_slots_g2.json'), 'utf8'),
).slots
export const kpMap = Object.fromEntries(prior.kps.map((k) => [k.code, k]))
export { slots, prior }

export const SECTION = {
  '1.1': ['1.1', '集合的概念'],
  '1.2': ['1.2', '集合间的基本关系'],
  '1.3': ['1.3', '集合的基本运算'],
  '1.4': ['1.4', '充分条件与必要条件'],
  '1.5': ['1.5', '全称量词与存在量词'],
  '2.1': ['2.1', '等式性质与不等式性质'],
  '2.2': ['2.2', '基本不等式'],
  '2.3': ['2.3', '二次函数与一元二次方程、不等式'],
  '3.1': ['3.1', '函数的概念'],
  '3.2': ['3.2', '函数的基本性质'],
  '3.3': ['3.3', '幂函数'],
  '3.4': ['3.4', '函数的应用（一）'],
  '4.1': ['4.1', '指数'],
  '4.2': ['4.2', '指数函数'],
  '4.3': ['4.3', '对数'],
  '4.4': ['4.4', '对数函数'],
  '4.5': ['4.5', '函数的应用（二）'],
  '5.1': ['5.1', '任意角和弧度制'],
  '5.2': ['5.2', '三角函数的概念'],
  '5.3': ['5.3', '诱导公式'],
  '5.4': ['5.4', '三角函数的图象与性质'],
  '5.5': ['5.5', '三角恒等变换'],
  '5.6': ['5.6', '函数 y=Asin(ωx+φ)'],
  '5.7': ['5.7', '三角函数的应用'],
  '6.1': ['6.1', '平面向量的概念'],
  '6.2': ['6.2', '平面向量的运算'],
  '6.3': ['6.3', '平面向量基本定理及坐标表示'],
  '6.4': ['6.4', '平面向量的应用'],
  '7.1': ['7.1', '复数的概念'],
  '7.2': ['7.2', '复数的运算'],
  '7.3': ['7.3', '数系的扩充与复数的引入'],
  '8.1': ['8.1', '基本立体图形'],
  '8.2': ['8.2', '立体图形的直观图'],
  '8.3': ['8.3', '简单几何体的表面积与体积'],
  '8.4': ['8.4', '空间点、直线、平面之间的位置关系'],
  '8.5': ['8.5', '空间直线、平面的平行'],
  '8.6': ['8.6', '空间直线、平面的垂直'],
  '9.1': ['9.1', '随机抽样'],
  '9.2': ['9.2', '用样本估计总体'],
  '9.3': ['9.3', '统计案例初步'],
  '10.1': ['10.1', '随机事件与概率'],
  '10.2': ['10.2', '事件的相互独立性'],
  '10.3': ['10.3', '频率与概率'],
}

export function secOf(code) {
  const m = String(code).match(/^rj[ab]\.(\d+)\.(\d+)/)
  if (!m) throw new Error('bad kp ' + code)
  const key = m[1] + '.' + m[2]
  const s = SECTION[key]
  if (!s) throw new Error('no section ' + key)
  return s
}

export function wrap(slot, body) {
  const kpCode = body.kpCode || slot.kpHint.code
  const kp = kpMap[kpCode]
  if (!kp) throw new Error('kp missing ' + kpCode)
  const [sectionCode, sectionName] = secOf(kpCode)
  const req = body.diagramRequirement || 'NOT_NEEDED'
  const o = {
    book: slot.book,
    kpInDb: true,
    mathCheck: 'PASS',
    sourceType: 'original',
    sourceEvidence: '本批原创；非高考真题',
    reviewReady: true,
    kpInSeed: true,
    mathVerified: 'AUTHOR_CHECKED',
    blockReasons: [],
    methodAux: body.methodAux ?? null,
    maxScore: body.maxScore ?? null,
    rubric: body.rubric ?? null,
    diagramSpecification: body.diagramSpecification ?? null,
    noDiagramReason:
      req === 'NOT_NEEDED'
        ? body.noDiagramReason || '文字条件足够，无需配图。'
        : null,
    id: slot.id,
    chapterNo: slot.chapterNo,
    specialtyCode: slot.specialtyCode,
    sectionCode,
    sectionName,
    kpCode,
    kpName: kp.name,
    methodMain: body.methodMain,
    qtype: slot.qtype,
    difficulty: slot.difficulty,
    stem: body.stem,
    options: body.options ?? null,
    answer: body.answer,
    analysis: body.analysis,
    dedupNote: body.dedupNote,
    authorMathNote: body.authorMathNote,
    diagramRequirement: req,
  }
  return o
}
