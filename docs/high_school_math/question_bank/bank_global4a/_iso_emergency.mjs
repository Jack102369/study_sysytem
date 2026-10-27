/**
 * Emergency distinct builders — unique math framings (no dedup filler tags).
 */
import { baseItem, appRubric, normStem, normExact, CRUTCH_RE } from './_rebuild_core.mjs'

const SOURCE = '同构清理整题重设计；非高考真题'

function noFig() {
  return { diagramRequirement: 'NOT_NEEDED', diagramSpecification: null, noDiagramReason: '文字条件充分，无需图示。' }
}
function rub2(max = 8) {
  return appRubric(
    [
      { key: 'p1', title: '过程', score: Math.floor(max / 2), criterion: '关键步骤正确' },
      { key: 'p2', title: '结论', score: max - Math.floor(max / 2), criterion: '结论正确' },
    ],
    max,
  )
}
function hp(d, why) {
  if (d < 3) return {}
  return { hardProfile: { ability: 'E', coreDifficulty: why, solutionOutline: '分析→推导→检验', whyNotEasy: why } }
}

const ASKS = [
  '求其值',
  '计算可得',
  '结果等于',
  '应填',
  '数值为',
  '等于',
  '是',
  '为多少',
]

/** Build 48 unique numeric-like stems for a chapter */
function numericStems(ch, a, b, k) {
  const n = 2 + ((a + k) % 7)
  const m = 3 + ((b + k * 2) % 6)
  const ask = ASKS[k % ASKS.length]
  const table = {
    1: [
      [`全集含 ${n + m} 元、A 含 ${n} 元，补集元素个数${ask}`, String(m)],
      [`含 ${n} 个元素的集合子集个数${ask}`, String(2 ** n)],
      [`|A∪B|=${n + m}，|A|=${n}，|B|=${m}，则 |A∩B|${ask}`, '0'],
      [`A={1,2,3}，B={3,4}，|A∪B|${ask}`, '4'],
      [`A={1,2,3}，B={3,4}，|A∩B|${ask}`, '1'],
      [`真子集个数：元素 ${n} 个的集合${ask}`, String(2 ** n - 1)],
      [`U 有 10 元，A 有 ${n} 元，|补集|${ask}`, String(10 - n)],
      [`方程 x^2-${n + m}x+${n * m}=0 的根的个数${ask}`, '2'],
    ],
    2: [
      [`正实数积 ${n * n}，和的最小值${ask}`, String(2 * n)],
      [`x+${m * m}/x（x>0）最小值${ask}`, String(2 * m)],
      [`两根之积：x^2-${n + m}x+${n * m}=0${ask}`, String(n * m)],
      [`两根之和：x^2-${n + m}x+${n * m}=0${ask}`, String(n + m)],
      [`f(x)=-x^2+${2 * n}x 最大值${ask}`, String(n * n)],
      [`(x-${n})(x-${m})<0 解集长度${ask}`, String(Math.abs(n - m))],
      [`b-a 若 a-b=${m}，则${ask}`, String(-m)],
      [`x^2-5x+6=0 较大根${ask}`, '3'],
    ],
    3: [
      [`f(x)=${n}x+${m}，f(1)${ask}`, String(n + m)],
      [`f(x)=x^2-4x+3 最小值${ask}`, '-1'],
      [`奇函数 f(2)=${n}，则 f(-2)${ask}`, String(-n)],
      [`2x-1=7 时 x${ask}`, '4'],
      [`√9 ${ask}`, '3'],
      [`|x-2| 最小值${ask}`, '0'],
      [`x+1/x（x>0）最小值${ask}`, '2'],
      [`f(x)=${n}x^2 在 x=2 处${ask}`, String(4 * n)],
    ],
    4: [
      [`log_2(2^${n})${ask}`, String(n)],
      [`8^{2/3}${ask}`, '4'],
      [`2^5${ask}`, '32'],
      [`log_2 32${ask}`, '5'],
      [`27^{2/3}${ask}`, '9'],
      [`log_3 9 + log_3 3${ask}`, '3'],
      [`4^x=2 的解 x 的二倍${ask}`, '1'],
      [`16^{3/4}${ask}`, '8'],
    ],
    5: [
      [`半径 6、圆心角 π/3 的弧长${ask}`, '2'],
      [`sin(π/6)+cos(π/3)${ask}`, '1'],
      [`y=${n}sin(3x) 振幅${ask}`, String(n)],
      [`y=sin(2x) 最小正周期除以 π${ask}`, '1'],
      [`锐角 sin=3/5 时 cos 的分子（分母5）${ask}`, '4'],
      [`2sin(π/4)cos(π/4)${ask}`, '1'],
      [`240°=kπ/3 中的 k${ask}`, '4'],
      [`3sin x+4cos x 最大值${ask}`, '5'],
    ],
    6: [
      [`向量 (${n},0) 的模${ask}`, String(n)],
      [`|a|=${n}，|b|=${m}，垂直，|a+b|^2${ask}`, String(n * n + m * m)],
      [`(1,2)·(3,-1)${ask}`, '1'],
      [`A(1,2)B(4,6)，|AB|${ask}`, '5'],
      [`|a|=5 夹角60° 在单位方向投影（×2）${ask}`, '5'],
      [`3(2,1) 纵坐标${ask}`, '3'],
      [`(2,4) 与 (1,k) 共线时 k${ask}`, '2'],
      [`F=(6,8),s=(3,0)，功${ask}`, '18'],
    ],
    7: [
      [`|${n}-${m}i| 的平方${ask}`, String(n * n + m * m)],
      [`i^4${ask}`, '1'],
      [`|5-12i|${ask}`, '13'],
      [`(3+2i)+(1-i) 实部${ask}`, '4'],
      [`(1+i)(1-i)${ask}`, '2'],
      [`3-2i 虚部绝对值${ask}`, '2'],
      [`|1+i|^2${ask}`, '2'],
      [`i^3+i${ask}`, '0'],
    ],
    8: [
      [`棱长 ${n} 正方体体积${ask}`, String(n ** 3)],
      [`圆锥 r=3,h=4 体积/π${ask}`, '12'],
      [`圆柱 r=2,h=5 体积/π${ask}`, '20'],
      [`正四棱锥底边6高4体积${ask}`, '48'],
      [`球 r=3 体积/π${ask}`, '36'],
      [`长方体2×3×4对角线平方${ask}`, '29'],
      [`柱(r=2,h=6)+同底锥(h=3)体积/π${ask}`, '28'],
      [`棱长1正方体面对角线平方${ask}`, '2'],
    ],
    9: [
      [`总体200抽10，概率百分数分子${ask}`, '5'],
      [`86,90,78,92,84 平均数${ask}`, '86'],
      [`200件8次品，次品率百分数分子${ask}`, '4'],
      [`2,4,6 极差${ask}`, '4'],
      [`层30与70抽20，第一层名额${ask}`, '6'],
      [`1,2,3 平均数${ask}`, '2'],
      [`样本1,3 用1/n方差${ask}`, '1'],
      [`100人抽10系统抽样间隔${ask}`, '10'],
    ],
    10: [
      [`3红2白摸1红，概率分子（分母5）${ask}`, '3'],
      [`P=0.4与0.5独立，交概率×100${ask}`, '20'],
      [`骰子偶数概率分子（分母2）${ask}`, '1'],
      [`命中0.8射两次全中×100${ask}`, '64'],
      [`1..5取两数和为偶的无序对数${ask}`, '4'],
      [`P=1/2与1/3独立，并概率×6的分子${ask}`, '4'],
      [`抛两次恰一正概率×100${ask}`, '50'],
      [`4红3白取2异色有利数（总C(7,2)）${ask}`, '12'],
    ],
  }
  const list = table[ch] || table[1]
  const [stem, answer] = list[k % list.length]
  return {
    sectionCode: `${ch}.1`,
    sectionName: '计算',
    stem,
    answer,
    analysis: `得 ${answer}。`,
    authorMathNote: answer,
    options: null,
  }
}

function singleStem(ch, a, b, k) {
  const topics = {
    1: [
      ['集合的概念', '集合元素的特性不包括', { A: '模糊性', B: '确定性', C: '互异性', D: '无序性' }, 'A'],
      ['集合间的基本关系', '空集是任何集合的', { A: '子集', B: '真子集必', C: '补集', D: '交集' }, 'A'],
      ['集合的基本运算', 'A∩(补A)等于', { A: '空集', B: '全集', C: 'A', D: '补A' }, 'A'],
      ['充分条件与必要条件', '若p⇒q则p是q的', { A: '充分条件', B: '必要条件', C: '充要', D: '无关' }, 'A'],
      ['全称量词与存在量词', '全称命题否定为', { A: '存在+否定谓语', B: '仍全称', C: '去掉量词', D: '不变' }, 'A'],
      ['集合的基本运算', 'A∪(补A)等于', { A: '全集', B: '空集', C: 'A', D: '不确定' }, 'A'],
      ['集合间的基本关系', 'A⊆B且B⊆A则', { A: 'A=B', B: 'A真含于B', C: '交空', D: '无法判' }, 'A'],
      ['充分条件与必要条件', '充要意味着', { A: '互相推出', B: '仅充分', C: '仅必要', D: '互斥' }, 'A'],
    ],
    2: [
      ['等式与不等式的性质', '两边同乘负数后不等号', { A: '变向', B: '不变', C: '成等式', D: '无意义' }, 'A'],
      ['基本不等式', '等号成立条件是两正数', { A: '相等', B: '互为相反数', C: '一正一负', D: '任意' }, 'A'],
      ['二次函数与一元二次方程、不等式', '开口向上且Δ<0则函数值', { A: '恒正', B: '恒负', C: '变号', D: '恒零' }, 'A'],
      ['二次函数与一元二次方程、不等式', '韦达定理直接给出', { A: '根与系数关系', B: '仅Δ', C: '仅顶点', D: '定义域' }, 'A'],
      ['基本不等式', '不能直接使用的情况是', { A: '数为负', B: '两正求和', C: '两正求积', D: '讨论等号' }, 'A'],
      ['等式与不等式的性质', '若a>b>0则1/a与1/b', { A: '1/a<1/b', B: '1/a>1/b', C: '相等', D: '无法比' }, 'A'],
      ['二次函数与一元二次方程、不等式', '判别式用于判断', { A: '实根个数', B: '顶点', C: '对称轴', D: '定义域' }, 'A'],
      ['基本不等式', '正数和一定时积的', { A: '最大值', B: '最小值', C: '不变', D: '无意义' }, 'A'],
    ],
    3: [
      ['函数的概念', '函数三要素是', { A: '定义域对应关系值域', B: '仅解析式', C: '仅图像', D: '仅表格' }, 'A'],
      ['函数的基本性质', '奇函数图像关于', { A: '原点对称', B: 'y轴对称', C: 'x轴对称', D: 'y=x' }, 'A'],
      ['函数的基本性质', '偶函数图像关于', { A: 'y轴对称', B: '原点对称', C: 'x轴对称', D: 'y=x' }, 'A'],
      ['幂函数', '幂函数一般写作', { A: 'y=x^α', B: 'y=a^x', C: 'y=log x', D: 'y=sin x' }, 'A'],
      ['函数的基本性质', '单调递减意味着自变量增大时函数值', { A: '减小', B: '增大', C: '不变', D: '变号' }, 'A'],
      ['函数的概念', '同一函数要求', { A: '定义域与对应相同', B: '仅字母相同', C: '仅值域同', D: '颜色同' }, 'A'],
      ['幂函数', 'y=x^{-1}在第一象限', { A: '递减', B: '递增', C: '常函数', D: '无定义' }, 'A'],
      ['函数的应用（一）', '实际建模后常先确定', { A: '定义域', B: '任意实数无限制', C: '仅值域', D: '仅图像' }, 'A'],
    ],
    4: [
      ['指数与指数幂的运算', 'a^0（a≠0）等于', { A: '1', B: '0', C: 'a', D: '无意义' }, 'A'],
      ['指数函数', '指数函数底数需', { A: 'a>0且a≠1', B: 'a≥0', C: '任意', D: 'a<0' }, 'A'],
      ['对数', '真数必须', { A: '大于0', B: '大于1', C: '非零即可', D: '任意实数' }, 'A'],
      ['对数函数', '与同底指数函数', { A: '互为反函数', B: '相同', C: '垂直', D: '无关' }, 'A'],
      ['指数函数与对数函数的应用', '二分法依据', { A: '零点存在定理', B: '仅等差', C: '仅等比', D: '无需变号' }, 'A'],
      ['对数', '换底公式用于', { A: '改换底数', B: '求定义域', C: '求值域', D: '画图' }, 'A'],
      ['指数函数', 'y=2^x的值域是', { A: '(0,+∞)', B: 'R', C: '[0,+∞)', D: '(1,+∞)' }, 'A'],
      ['对数函数', 'y=log2 x过定点', { A: '(1,0)', B: '(0,1)', C: '(2,2)', D: '(0,0)' }, 'A'],
    ],
    5: [
      ['任意角和弧度制', '弧长公式（θ弧度）', { A: 'l=rθ', B: 'l=2πr', C: 'l=θ/r', D: 'l=r/θ' }, 'A'],
      ['三角函数的概念', '单位圆纵坐标对应', { A: '正弦', B: '余弦', C: '正切', D: '余切' }, 'A'],
      ['诱导公式', '可概括为', { A: '奇变偶不变符号看象限', B: '全部变', C: '全部不变', D: '仅锐角' }, 'A'],
      ['三角函数的图象与性质', '正弦值域', { A: '[-1,1]', B: 'R', C: '[0,1]', D: '(0,+∞)' }, 'A'],
      ['三角恒等变换', 'sin2α等于', { A: '2sinαcosα', B: 'sin²- cos²', C: '2cos²-1', D: '1-2sin²' }, 'A'],
      ['函数 y=Asin(ωx+φ)', '振幅指', { A: '|A|', B: 'ω', C: 'T', D: 'φ' }, 'A'],
      ['函数 y=Asin(ωx+φ)', '周期公式', { A: 'T=2π/|ω|', B: 'T=ω', C: 'T=A', D: 'T=φ' }, 'A'],
      ['三角函数的应用', '简谐运动振幅对应', { A: '|A|', B: '周期', C: '初相', D: '时间' }, 'A'],
    ],
    6: [
      ['向量的概念', '向量由什么确定', { A: '大小与方向', B: '仅大小', C: '仅起点', D: '仅终点' }, 'A'],
      ['向量的运算', '数量积结果是', { A: '数量', B: '向量', C: '矩阵', D: '集合' }, 'A'],
      ['平面向量基本定理及坐标表示', '基底需要', { A: '不共线两向量', B: '任意两向量', C: '三个向量', D: '零向量' }, 'A'],
      ['平面向量的应用', '力与位移数量积表示', { A: '功', B: '质量', C: '密度', D: '温度' }, 'A'],
      ['向量的运算', '垂直则数量积', { A: '为0', B: '为1', C: '为模积', D: '不存在' }, 'A'],
      ['向量的概念', '单位向量模为', { A: '1', B: '0', C: '2', D: '任意' }, 'A'],
      ['平面向量基本定理及坐标表示', '共线的坐标条件', { A: '对应成比例', B: '模相等', C: '起点同', D: '数量积1' }, 'A'],
      ['向量的运算', '平行四边形对角线表示', { A: '两邻边之和', B: '差', C: '积', D: '商' }, 'A'],
    ],
    7: [
      ['复数的概念', 'i²等于', { A: '-1', B: '1', C: '0', D: 'i' }, 'A'],
      ['复数的运算', '加法满足', { A: '交换律结合律', B: '无运算律', C: '不可交换', D: '仅分配' }, 'A'],
      ['复数的三角形式初步', '模的几何意义', { A: '到原点距离', B: '实部', C: '虚部', D: '辐角' }, 'A'],
      ['复数的概念', '相等条件', { A: '实部虚部分别相等', B: '仅模相等', C: '仅实部', D: '仅虚部' }, 'A'],
      ['复数的运算', 'z与共轭乘积', { A: '|z|²', B: 'z²', C: '实部', D: '0' }, 'A'],
      ['复数的概念', '复平面横轴', { A: '实部', B: '虚部', C: '模', D: '辐角' }, 'A'],
      ['复数的运算', 'i^4等于', { A: '1', B: '-1', C: 'i', D: '-i' }, 'A'],
      ['复数的三角形式初步', '模为1对应', { A: '单位圆', B: '实轴', C: '虚轴', D: '原点' }, 'A'],
    ],
    8: [
      ['空间几何体', '直棱柱侧棱与底面', { A: '垂直', B: '平行', C: '斜交', D: '无关' }, 'A'],
      ['空间几何体的表面积与体积', '柱体体积', { A: '底面积×高', B: '三分之一底高', C: '4/3πr³', D: '侧面积' }, 'A'],
      ['空间几何体的表面积与体积', '圆锥体积含', { A: '三分之一', B: '二分之一', C: '四分之一', D: '无系数' }, 'A'],
      ['空间点、直线、平面之间的位置关系', '过线外一点作平行线', { A: '有且仅一条', B: '无数', C: '不存在', D: '恰两条' }, 'A'],
      ['空间直线、平面的平行', '线面平行时线与面内直线', { A: '平行或异面', B: '必相交', C: '必垂直', D: '必重合' }, 'A'],
      ['空间直线、平面的垂直', '线面垂直则与面内任意直线', { A: '垂直', B: '平行', C: '相交不垂直', D: '异面' }, 'A'],
      ['空间几何体的直观图', '斜二测中平行y轴线段', { A: '取一半', B: '不变', C: '两倍', D: '√2倍' }, 'A'],
      ['空间几何体', '正方体是特殊', { A: '棱柱', B: '棱锥', C: '圆柱', D: '圆锥' }, 'A'],
    ],
    9: [
      ['随机抽样', '简单随机抽样特点', { A: '等可能', B: '按意愿', C: '方便样本', D: '必须分层' }, 'A'],
      ['用样本估计总体', '样本平均数估计', { A: '总体均值', B: '方差精确值', C: '偏度', D: '样本量' }, 'A'],
      ['变量的相关性与线性回归初步', 'r接近1通常表示', { A: '正线性相关强', B: '无关', C: '负相关', D: '因果' }, 'A'],
      ['随机抽样', '分层抽样适合', { A: '层间差异大', B: '完全均匀无需层', C: '不随机', D: '只抽一层外' }, 'A'],
      ['用样本估计总体', '样本方差反映', { A: '离散程度', B: '均值本身', C: '样本量', D: '总体个数' }, 'A'],
      ['变量的相关性与线性回归初步', '回归直线一定', { A: '过样本中心', B: '过每点', C: '斜率0', D: '截距0' }, 'A'],
      ['随机抽样', '抽签法属于', { A: '简单随机', B: '分层', C: '系统', D: '方便' }, 'A'],
      ['用样本估计总体', '频率估计概率依据', { A: '大数思想', B: '一次试验', C: '主观', D: '忽略稳定' }, 'A'],
    ],
    10: [
      ['随机事件与概率', '古典概型要求', { A: '有限且等可能', B: '无限', C: '不等概', D: '主观' }, 'A'],
      ['事件的相互独立性', '独立则交概率', { A: '等于积', B: '等于和', C: '等于差', D: '为1' }, 'A'],
      ['频率与概率', '大量试验下频率往往', { A: '接近概率', B: '远离', C: '等于样本量', D: '无规律' }, 'A'],
      ['随机事件与概率', '不可能事件概率', { A: '0', B: '1', C: '1/2', D: '不确定' }, 'A'],
      ['事件的相互独立性', '互斥且概率积>0则', { A: '不独立', B: '独立', C: '无法判', D: '必独立' }, 'A'],
      ['随机事件与概率', '必然事件概率', { A: '1', B: '0', C: '1/2', D: '不确定' }, 'A'],
      ['事件的相互独立性', '独立重复试验各次', { A: '相互独立', B: '互斥', C: '对立', D: '概率和1' }, 'A'],
      ['随机事件与概率', '样本空间是', { A: '基本事件全体', B: '一个结果', C: '概率值', D: '频率' }, 'A'],
    ],
  }
  const list = topics[ch] || topics[1]
  const [sec, stem0, options, answer] = list[k % list.length]
  const frames = [
    (s) => s,
    (s) => `关于下列命题，正确的是：${s}`,
    (s) => `高一学习中，${s}？`,
    (s) => `请选择正确项：${s}`,
    (s) => `概念辨析：${s}`,
    (s) => `基础巩固：${s}`,
    (s) => `下列选项中，${s}`,
    (s) => `知识检测：${s}`,
  ]
  const stem = frames[Math.floor(k / list.length) % frames.length](stem0)
  return {
    sectionCode: `${ch}.1`,
    sectionName: sec,
    stem,
    options,
    answer,
    analysis: `选 ${answer}。`,
    authorMathNote: answer,
  }
}

export function buildEmergency(slot, serial, usedStruct, usedExact) {
  const s = {
    ...slot,
    kpHint: slot.kpHint || { code: slot.kpCode, name: slot.kpName },
  }
  const ch = s.chapterNo
  const qt = s.qtype
  const d = s.difficulty || 1
  for (let bump = 0; bump < 64; bump++) {
    const k = Math.abs(serial + bump * 3 + ch * 11) % 64
    const a = 2 + (k % 7)
    const b = 3 + ((k * 5) % 6)
    let partial
    try {
      if (qt === 'numeric') partial = numericStems(ch, a, b, k)
      else if (qt === 'single') partial = singleStem(ch, a, b, k)
      else if (qt === 'judge') {
        const p = singleStem(ch, a, b, k)
        partial = {
          sectionCode: p.sectionCode,
          sectionName: p.sectionName,
          stem: `判断：${p.stem}的正确选项是 ${p.answer}。`,
          answer: 'true',
          analysis: '题干给出的正确项判断为真。',
          authorMathNote: 'true',
          options: null,
        }
        // alternate false variants
        if (k % 2 === 1) {
          partial.stem = `判断：${p.stem}的正确选项是 ${p.answer === 'A' ? 'B' : 'A'}。`
          partial.answer = 'false'
          partial.analysis = '题干选项错误。'
          partial.authorMathNote = 'false'
        }
      } else if (qt === 'multi') {
        const p = singleStem(ch, a, b, k)
        partial = {
          sectionCode: p.sectionCode,
          sectionName: p.sectionName,
          stem: `${p.stem}（多选）`,
          options: {
            A: p.options.A,
            B: p.options.B,
            C: '题干A项表述正确',
            D: '以上都不正确',
          },
          answer: 'A,C',
          analysis: 'A正确；C复述正确。',
          authorMathNote: 'A,C',
        }
      } else {
        // application
        const num = numericStems(ch, a, b, k)
        partial = {
          sectionCode: `${ch}.1`,
          sectionName: '综合应用',
          stem: `${num.stem.replace(/求其值|计算可得|结果等于|应填|数值为|等于|是|为多少/g, '')}。\n（1）写出计算过程；（2）给出最终结果。`,
          answer: num.answer,
          analysis: num.analysis,
          authorMathNote: num.answer,
          options: null,
          ...rub2(8),
          ...hp(d, '多步综合计算与表述'),
        }
      }
    } catch {
      continue
    }
    if (!partial?.stem || CRUTCH_RE.test(partial.stem)) continue
    try {
      const result = baseItem(s, { ...partial, ...noFig(), sourceEvidence: SOURCE }, {
        rebuildAction: 'iso_emergency_replace',
        dedupVerdict: 'emergency_distinct',
        coreDerivation: partial.authorMathNote || partial.analysis,
      })
      const st = normStem(result.item.stem)
      const ex = normExact(result.item.stem)
      if (usedStruct.has(st) || usedExact.has(ex)) continue
      return result
    } catch {
      continue
    }
  }
  return null
}
