/**
 * Build g4a_group01.mjs from compact defs + slots.
 * Run: node _build_g4a_g1.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const slots = JSON.parse(fs.readFileSync(path.join(__dirname, '_slots_g1.json'), 'utf8')).slots
const prior = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../_g4a_prior_stems.json'), 'utf8'),
)
const kpMap = Object.fromEntries(prior.kps.map((k) => [k.code, k]))

const SEC = {
  '1.1': '集合的概念',
  '1.2': '集合间的基本关系',
  '1.3': '集合的基本运算',
  '1.4': '充分条件与必要条件',
  '1.5': '全称量词与存在量词',
  '2.1': '等式性质与不等式性质',
  '2.2': '基本不等式',
  '2.3': '二次函数与一元二次方程、不等式',
  '3.1': '函数的概念及其表示',
  '3.2': '函数的基本性质',
  '3.3': '幂函数',
  '3.4': '函数的应用（一）',
  '4.1': '指数',
  '4.2': '指数函数',
  '4.3': '对数',
  '4.4': '对数函数',
  '4.5': '函数的应用（二）',
  '5.1': '任意角和弧度制',
  '5.2': '三角函数的概念',
  '5.3': '诱导公式',
  '5.4': '三角函数的图象与性质',
  '5.5': '三角恒等变换',
  '5.6': '函数 y=Asin(ωx+φ)',
  '5.7': '三角函数的应用',
  '6.1': '平面向量的概念',
  '6.2': '平面向量的运算',
  '6.3': '平面向量基本定理及坐标表示',
  '6.4': '平面向量的应用',
  '7.1': '复数的概念',
  '7.2': '复数的运算',
  '7.3': '复数的三角表示',
  '8.1': '基本立体图形',
  '8.2': '立体图形的直观图',
  '8.3': '简单几何体的表面积与体积',
  '8.4': '空间点、直线、平面之间的位置关系',
  '8.5': '空间中的平行关系',
  '8.6': '空间中的垂直关系',
  '9.1': '随机抽样',
  '9.2': '用样本估计总体',
  '9.3': '变量间的相关关系',
  '10.1': '随机事件与概率',
  '10.2': '事件的相互独立性',
  '10.3': '频率与概率',
}

/** Compact defs keyed by id. Fields override/add to slot. */
const DEFS = {
  'CAND-G4A-001': {
    methodMain: 'defn',
    stem: '从含有 $50$ 个个体的总体中用抽签法抽取 $5$ 个个体，则每个个体被抽到的概率为（填最简分数）',
    options: null,
    answer: '1/10',
    analysis:
      '简单随机抽样中每个个体被抽到的概率相等，均为 $\\dfrac{5}{50}=\\dfrac{1}{10}$。',
    dedupNote: '抽签法概率5/50（异于200抽10）',
    authorMathNote: '5/50=1/10。',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '抽样概率公式计算即可。',
  },
  'CAND-G4A-002': {
    methodMain: 'classification',
    methodAux: 'defn',
    stem: '判断：对容量为 $1000$ 的总体按学号每隔 $20$ 号抽取 $1$ 人得容量 $50$ 的样本，若起始号在 $1$—$20$ 中随机确定，则该抽样必为分层抽样。',
    options: null,
    answer: 'false',
    analysis:
      '按固定间隔抽取且起始号随机，属于系统抽样；分层抽样需先按层划分再在各层抽样。命题把系统抽样误称为分层抽样，故错误。',
    dedupNote: '系统与分层辨析（d3概念陷阱）',
    authorMathNote: '间隔抽样=系统抽样，非分层。',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '抽样类型概念辨析。',
  },
  'CAND-G4A-003': {
    methodMain: 'special_value',
    stem: '半径为 $4$ 的圆中，圆心角为 $\\dfrac{\\pi}{3}$ 的弧长等于',
    options: { A: '$\\dfrac{2\\pi}{3}$', B: '$\\dfrac{4\\pi}{3}$', C: '$2\\pi$', D: '$\\dfrac{\\pi}{3}$' },
    answer: 'B',
    analysis: '弧长 $l=r\\theta=4\\cdot\\dfrac{\\pi}{3}=\\dfrac{4\\pi}{3}$，选 B。',
    dedupNote: '弧长r=4,θ=π/3',
    authorMathNote: 'l=4π/3。',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '弧长公式直接计算。',
  },
  'CAND-G4A-004': {
    methodMain: 'equiv_transform',
    methodAux: 'substitution',
    stem: '已知正实数 $a$ 满足 $\\sqrt[3]{a^2}=a^{\\frac{m}{n}}$（$m,n$ 为正整数且 $\\dfrac{m}{n}$ 为最简分数），则 $m+n$ 等于',
    options: { A: '$3$', B: '$4$', C: '$5$', D: '$6$' },
    answer: 'C',
    analysis:
      '$\\sqrt[3]{a^2}=a^{\\frac{2}{3}}$，故 $\\dfrac{m}{n}=\\dfrac{2}{3}$，$m=2$，$n=3$，$m+n=5$。再验证：$\\left(a^{\\frac{2}{3}}\\right)^3=a^2$，与立方根定义一致。选 C。',
    dedupNote: '根式写成分数指数最简m+n',
    authorMathNote: 'a^{2/3}；m+n=5。',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '根式指数互化代数完成。',
  },
  'CAND-G4A-005': {
    methodMain: 'equiv_transform',
    stem: '已知 $\\vec a=(2,-1)$，$\\vec b=(-3,4)$，则 $|\\vec a+\\vec b|=$',
    options: null,
    answer: 'sqrt(10)',
    analysis:
      '$\\vec a+\\vec b=(-1,3)$，$|\\vec a+\\vec b|=\\sqrt{1+9}=\\sqrt{10}$。答案按数值规范写作需匹配正则：改用可解析形式。',
    dedupNote: '向量和模√10',
    authorMathNote: '(-1,3) 模√10。',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '坐标加法求模即可。',
    // fix answer to match NUMERIC_RE — √10 not allowed; use decimal or leave as expression?
    // NUMERIC_RE: /^[+-]?(?:\d+(?:\.\d{1,8})?|\.\d{1,8}|\d+\/[1-9]\d*)$/
    // So sqrt not allowed. Change question to ask integer.
  },
}

// Fix 005 to integer answer
DEFS['CAND-G4A-005'] = {
  methodMain: 'equiv_transform',
  stem: '已知 $\\vec a=(3,-4)$，$\\vec b=(-1,2)$，则 $|\\vec a+\\vec b|^2=$',
  options: null,
  answer: '8',
  analysis: '$\\vec a+\\vec b=(2,-2)$，$|\\vec a+\\vec b|^2=4+4=8$。',
  dedupNote: '向量和模的平方（非|a|直接）',
  authorMathNote: '(2,-2)^2=8。',
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '坐标运算即可。',
}

DEFS['CAND-G4A-006'] = {
  methodMain: 'special_value',
  stem: '设 $\\vec a=(1,2)$，$\\vec b=(3,-1)$，则 $\\vec a\\cdot\\vec b=$',
  options: null,
  answer: '1',
  analysis: '$\\vec a\\cdot\\vec b=1\\cdot3+2\\cdot(-1)=3-2=1$。',
  dedupNote: '数量积1·3+2·(-1)',
  authorMathNote: '3-2=1。异于(1,2)·(3,-1)先验同结构需改',
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '坐标数量积。',
}
// prior has a=(1,2),b=(3,-1),则ab= — DUPLICATE! Change vectors
DEFS['CAND-G4A-006'] = {
  methodMain: 'special_value',
  stem: '设 $\\vec u=(2,-3)$，$\\vec v=(4,1)$，则 $\\vec u\\cdot\\vec v=$',
  options: null,
  answer: '5',
  analysis: '$2\\cdot4+(-3)\\cdot1=8-3=5$。',
  dedupNote: '数量积(2,-3)·(4,1)=5',
  authorMathNote: '8-3=5。',
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '坐标数量积。',
}

Object.assign(DEFS, {
  'CAND-G4A-007': {
    methodMain: 'classification',
    stem: '阅读某研究“身高与体重”的散点图与回归报告后，下列说法正确的有（多选）',
    options: {
      A: '若散点大致呈带状上升，可考虑用线性回归刻画趋势',
      B: '回归方程一定精确经过每一个样本点',
      C: '相关系数接近 $0$ 时，通常不宜强行用直线拟合',
      D: '残差较大的点可能对回归直线影响更明显，应结合实际检查',
    },
    answer: 'A,C,D',
    analysis:
      'A、C、D 符合回归分析常识；B 错误，最小二乘回归直线一般不经过每个样本点。',
    dedupNote: '回归案例阅读多选（异于r接近1单判）',
    authorMathNote: 'B错；A/C/D对。',
    diagramRequirement: 'RECOMMENDED',
    diagramSpecification: {
      type: 'scatter',
      intent: '示意身高-体重散点略呈正线性趋势，便于对照选项。',
    },
  },
  'CAND-G4A-008': {
    methodMain: 'special_value',
    stem: '半径为 $3$ 的球的体积为 $V$，则 $\\dfrac{V}{\\pi}=$',
    options: null,
    answer: '36',
    analysis: '$V=\\dfrac{4}{3}\\pi r^3=\\dfrac{4}{3}\\pi\\cdot27=36\\pi$，故 $\\dfrac{V}{\\pi}=36$。',
    dedupNote: '球体积r=3得36π',
    authorMathNote: '4/3*27=36。',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '球体体积公式直接算。',
  },
  'CAND-G4A-009': {
    methodMain: 'defn',
    stem: '判断：$\\log_2 8=3$ 成立，是因为 $2^3=8$。',
    options: null,
    answer: 'true',
    analysis: '由对数定义：$\\log_a b=c\\Leftrightarrow a^c=b$（$a>0,a\\ne1,b>0$）。此处 $2^3=8$，故命题正确。',
    dedupNote: '对数定义互化判断',
    authorMathNote: '2^3=8⇒log2 8=3。',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '对数定义判定。',
  },
  'CAND-G4A-010': {
    methodMain: 'equiv_transform',
    methodAux: 'special_value',
    stem: '某厂抽检 $400$ 件产品，发现次品 $12$ 件。\n（1）用频率估计次品率；\n（2）据此估计 $10000$ 件中约有多少件次品。',
    options: null,
    answer: '（1）$0.03$；（2）约 $300$ 件。',
    analysis:
      '（1）频率 $\\dfrac{12}{400}=0.03$，用以估计次品率。\n（2）$10000\\times0.03=300$。',
    dedupNote: '频率估次品率400件12次（异于200/8）',
    authorMathNote: '12/400=0.03；10000×0.03=300。',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '频率估计计算。',
    maxScore: 8,
    rubric: [
      { key: 'rate', title: '次品率', score: 3, criterion: '得频率/次品率 0.03' },
      { key: 'est', title: '估计件数', score: 5, criterion: '得约 300 件' },
    ],
  },
  'CAND-G4A-011': {
    methodMain: 'mono_analysis',
    methodAux: 'equiv_transform',
    stem: '若不等式 $x^2-2ax+a<0$ 的解集为非空开区间，则实数 $a$ 的取值范围是',
    options: {
      A: '$a>0$',
      B: '$a<0$',
      C: '$0<a<1$',
      D: '$a>1$ 或 $a<0$',
    },
    answer: 'D',
    analysis:
      '开口向上，要解集为非空开区间需 $\\Delta>0$。$\\Delta=4a^2-4a=4a(a-1)>0\\Rightarrow a<0$ 或 $a>1$。选 D。',
    dedupNote: '含参二次不等式Δ>0范围',
    authorMathNote: 'Δ=4a(a-1)>0⇒a<0或a>1。',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '判别式代数条件。',
  },
  'CAND-G4A-012': {
    methodMain: 'defn',
    stem: '下列条件中，能判定平面 $\\alpha\\parallel$ 平面 $\\beta$ 的是',
    options: {
      A: '$\\alpha$ 内一条直线平行于 $\\beta$',
      B: '$\\alpha$ 内两条平行直线分别平行于 $\\beta$',
      C: '$\\alpha$ 内两条相交直线分别平行于 $\\beta$',
      D: '$\\alpha$ 与 $\\beta$ 有一条公共直线',
    },
    answer: 'C',
    analysis:
      '面面平行判定：一平面内两条相交直线分别平行于另一平面。A、B 不足；D 表示相交。选 C。',
    dedupNote: '面面平行判定相交直线',
    authorMathNote: '两相交直线∥β⇒α∥β。',
    diagramRequirement: 'RECOMMENDED',
    diagramSpecification: {
      type: 'space_planes',
      intent: '示意α内两相交直线分别∥β。',
    },
  },
  'CAND-G4A-013': {
    methodMain: 'mono_analysis',
    stem: '判断：函数 $f(x)=x^2$ 在 $\\mathbb{R}$ 上的单调递增区间是 $[0,+\\infty)$。',
    options: null,
    answer: 'true',
    analysis:
      '$f(x)=x^2$ 在 $(-\\infty,0]$ 递减，在 $[0,+\\infty)$ 递增。命题正确。',
    dedupNote: '二次函数单调区间判断',
    authorMathNote: '对称轴0，右半递增。',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '常见函数单调性识记。',
  },
  'CAND-G4A-014': {
    methodMain: 'equiv_transform',
    methodAux: 'special_value',
    stem: '已知 $\\cos\\theta=\\dfrac{3}{5}$，且 $\\theta$ 为锐角。\n（1）求 $\\sin 2\\theta$；\n（2）求 $\\cos 2\\theta$。',
    options: null,
    answer: '（1）$\\dfrac{24}{25}$；（2）$-\\dfrac{7}{25}$。',
    analysis:
      '锐角故 $\\sin\\theta=\\dfrac{4}{5}$。\n（1）$\\sin2\\theta=2\\sin\\theta\\cos\\theta=2\\cdot\\dfrac{4}{5}\\cdot\\dfrac{3}{5}=\\dfrac{24}{25}$。\n（2）$\\cos2\\theta=\\cos^2\\theta-\\sin^2\\theta=\\dfrac{9}{25}-\\dfrac{16}{25}=-\\dfrac{7}{25}$。',
    dedupNote: '锐角cos=3/5二倍角',
    authorMathNote: 'sin=4/5；sin2=24/25；cos2=-7/25。',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '同角关系与二倍角公式。',
    maxScore: 10,
    rubric: [
      { key: 'sin', title: 'sin2θ', score: 5, criterion: '得 24/25' },
      { key: 'cos', title: 'cos2θ', score: 5, criterion: '得 -7/25' },
    ],
  },
  'CAND-G4A-015': {
    methodMain: 'classification',
    stem: '在正方体 $ABCD-A_1B_1C_1D_1$ 中，下列说法正确的有（多选）',
    options: {
      A: '平面 $ABB_1A_1\\perp$ 平面 $ABCD$',
      B: '平面 $ACC_1A_1\\perp$ 平面 $BDD_1B_1$',
      C: '平面 $ABC\\perp$ 平面 $A_1B_1C_1$',
      D: '平面 $AA_1B_1B\\perp$ 平面 $ADD_1A_1$',
    },
    answer: 'A,B,D',
    analysis:
      '正方体相邻侧面与底面垂直，A、D 对；对角面 $ACC_1A_1$ 与 $BDD_1B_1$ 互相垂直，B 对；上下底面平行而不垂直，C 错。',
    dedupNote: '正方体面面垂直多选',
    authorMathNote: 'C上下底平行非垂直。',
    diagramRequirement: 'REQUIRED',
    diagramSpecification: {
      type: 'cube',
      intent: '标出相关对角面与侧面，辅助判断面面垂直。',
    },
  },
  'CAND-G4A-016': {
    methodMain: 'num_shape',
    methodAux: 'equiv_transform',
    stem: '力 $\\vec F=(5,12)$（单位 N）作用于质点，位移 $\\vec s=(3,4)$（单位 m）。另有恒力 $\\vec G$ 与 $\\vec s$ 同向且 $|\\vec G|=2$。求合力 $\\vec F+\\vec G$ 对位移所做总功 $W$（单位 J）',
    options: null,
    answer: '83',
    analysis:
      '$\\vec s$ 方向单位向量 $\\dfrac{\\vec s}{|\\vec s|}=\\left(\\dfrac{3}{5},\\dfrac{4}{5}\\right)$，故 $\\vec G=\\left(\\dfrac{6}{5},\\dfrac{8}{5}\\right)$。$\\vec F+\\vec G=\\left(\\dfrac{31}{5},\\dfrac{68}{5}\\right)$。$W=(\\vec F+\\vec G)\\cdot\\vec s=\\dfrac{31}{5}\\cdot3+\\dfrac{68}{5}\\cdot4=\\dfrac{93+272}{5}=73$？重算：$\\vec F\\cdot\\vec s=15+48=63$，$\\vec G\\cdot\\vec s=|G||s|=2\\cdot5=10$，总功 $73$。',
    dedupNote: '合力功F·s+G·s（异于(3,4)与(6,8)）',
    authorMathNote: '63+10=73。',
    diagramRequirement: 'RECOMMENDED',
    diagramSpecification: {
      type: 'vector_plane',
      intent: '示意力与位移向量夹角关系。',
    },
  },
})

// Fix 016 answer to 73
DEFS['CAND-G4A-016'].answer = '73'
DEFS['CAND-G4A-016'].analysis =
  '先算 $\\vec F\\cdot\\vec s=5\\cdot3+12\\cdot4=15+48=63$。$\\vec G$ 与 $\\vec s$ 同向且 $|\\vec G|=2$，$|\\vec s|=5$，故 $\\vec G\\cdot\\vec s=2\\cdot5=10$。总功 $W=63+10=73$。'

Object.assign(DEFS, {
  'CAND-G4A-017': {
    methodMain: 'classification',
    stem: '集合 $A=\\{x\\in\\mathbb{Z}\\mid x^2\\le 4\\}$ 用列举法表示正确的是',
    options: {
      A: '$\\{-2,-1,0,1,2\\}$',
      B: '$\\{-2,2\\}$',
      C: '$\\{0,1,2\\}$',
      D: '$\\{-1,0,1\\}$',
    },
    answer: 'A',
    analysis: '$x^2\\le4$ 且 $x\\in\\mathbb{Z}$，得 $x=-2,-1,0,1,2$。选 A。',
    dedupNote: '整数平方≤4列举（异于x²≤4先验表述）',
    authorMathNote: '{-2,-1,0,1,2}。',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '有限枚举。',
  },
  'CAND-G4A-018': {
    methodMain: 'special_value',
    stem: '若正实数 $x$ 满足 $x+\\dfrac{9}{x}$ 取最小值，则该最小值为',
    options: { A: '$3$', B: '$6$', C: '$9$', D: '$12$' },
    answer: 'B',
    analysis: '由基本不等式 $x+\\dfrac{9}{x}\\ge2\\sqrt{x\\cdot\\dfrac{9}{x}}=6$，当 $x=3$ 时取等。选 B。',
    dedupNote: 'x+9/x最小值6',
    authorMathNote: '2√9=6。',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '基本不等式。',
  },
  'CAND-G4A-019': {
    methodMain: 'equiv_transform',
    methodAux: 'special_value',
    stem: '正实数 $x$ 使 $x+\\dfrac{16}{x}$ 取最小值时，求该最小值。',
    options: null,
    answer: '最小值为 $8$（当 $x=4$ 时）。',
    analysis: '$x+\\dfrac{16}{x}\\ge2\\sqrt{16}=8$，当且仅当 $x=\\dfrac{16}{x}$ 即 $x=4$ 时取等。',
    dedupNote: '配凑x+16/x最小8',
    authorMathNote: '等号x=4，最小8。',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '基本不等式配凑。',
    maxScore: 8,
    rubric: [
      { key: 'ineq', title: '不等式', score: 4, criterion: '写出 ≥8 并说明等号条件' },
      { key: 'val', title: '最值', score: 4, criterion: '得最小值 8' },
    ],
  },
  'CAND-G4A-020': {
    methodMain: 'defn',
    stem: '简谐振动位移 $s=3\\sin\\left(\\dfrac{\\pi}{2}t\\right)$（$t$ 以秒计）。其振幅为',
    options: null,
    answer: '3',
    analysis: '形如 $s=A\\sin(\\omega t+\\varphi)$，振幅 $|A|=3$。',
    dedupNote: '简谐振幅读系数3',
    authorMathNote: 'A=3。',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '振幅定义读系数。',
  },
  'CAND-G4A-021': {
    methodMain: 'equiv_transform',
    methodAux: 'special_value',
    stem: '计算 $\\left(\\dfrac{27}{8}\\right)^{-\\frac{2}{3}}+\\left(\\dfrac{16}{81}\\right)^{\\frac{1}{4}}$ 的值等于',
    options: { A: '$\\dfrac{7}{6}$', B: '$\\dfrac{4}{3}$', C: '$\\dfrac{5}{4}$', D: '$\\dfrac{3}{2}$' },
    answer: 'A',
    analysis:
      '$\\left(\\dfrac{27}{8}\\right)^{-\\frac{2}{3}}=\\left(\\dfrac{8}{27}\\right)^{\\frac{2}{3}}=\\dfrac{4}{9}$；$\\left(\\dfrac{16}{81}\\right)^{\\frac{1}{4}}=\\dfrac{2}{3}$。和为 $\\dfrac{4}{9}+\\dfrac{2}{3}=\\dfrac{4}{9}+\\dfrac{6}{9}=\\dfrac{10}{9}$？重算第一项：$\\left(\\dfrac{3^3}{2^3}\\right)^{-2/3}=\\left(\\dfrac{2}{3}\\right)^2=\\dfrac{4}{9}$，第二项 $\\dfrac{2}{3}$，和 $\\dfrac{10}{9}$ 不在选项。改题。',
    dedupNote: '分数指数综合运算',
    authorMathNote: 'placeholder',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '指数运算。',
  },
})

DEFS['CAND-G4A-021'] = {
  methodMain: 'equiv_transform',
  methodAux: 'special_value',
  stem: '计算 $\\left(\\dfrac{8}{27}\\right)^{-\\frac{2}{3}}-\\left(\\dfrac{16}{81}\\right)^{\\frac{1}{2}}$ 的值等于',
  options: { A: '$\\dfrac{5}{9}$', B: '$\\dfrac{7}{9}$', C: '$1$', D: '$\\dfrac{11}{9}$' },
  answer: 'B',
  analysis:
    '$\\left(\\dfrac{8}{27}\\right)^{-\\frac{2}{3}}=\\left(\\dfrac{27}{8}\\right)^{\\frac{2}{3}}=\\left(\\dfrac{3}{2}\\right)^2=\\dfrac{9}{4}$；$\\left(\\dfrac{16}{81}\\right)^{\\frac{1}{2}}=\\dfrac{4}{9}$。差为 $\\dfrac{9}{4}-\\dfrac{4}{9}=\\dfrac{81-16}{36}=\\dfrac{65}{36}$ 仍不对。再改。',
  dedupNote: '分数指数综合',
  authorMathNote: 'fix',
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '指数运算。',
}

DEFS['CAND-G4A-021'] = {
  methodMain: 'equiv_transform',
  methodAux: 'special_value',
  stem: '化简求值：$\\sqrt[3]{27^2}\\cdot 8^{-\\frac{2}{3}}+\\left(\\dfrac{1}{16}\\right)^{-\\frac{1}{4}}$ 等于',
  options: { A: '$\\dfrac{11}{4}$', B: '$\\dfrac{13}{4}$', C: '$\\dfrac{15}{4}$', D: '$4$' },
  answer: 'B',
  analysis:
    '$\\sqrt[3]{27^2}=27^{\\frac{2}{3}}=(3^3)^{\\frac{2}{3}}=9$；$8^{-\\frac{2}{3}}=(2^3)^{-\\frac{2}{3}}=2^{-2}=\\dfrac{1}{4}$，积为 $\\dfrac{9}{4}$。$\\left(\\dfrac{1}{16}\\right)^{-\\frac{1}{4}}=16^{\\frac{1}{4}}=2$。故 $\\dfrac{9}{4}+2=\\dfrac{17}{4}$ 仍不在选项。再改选项。',
  dedupNote: '根式分数指数综合d3',
  authorMathNote: '9/4+2=17/4',
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '指数运算。',
}

DEFS['CAND-G4A-021'] = {
  methodMain: 'equiv_transform',
  methodAux: 'special_value',
  stem: '化简求值：$\\sqrt[3]{27^2}\\cdot 8^{-\\frac{2}{3}}+\\left(\\dfrac{1}{16}\\right)^{-\\frac{1}{4}}$ 等于',
  options: { A: '$\\dfrac{11}{4}$', B: '$\\dfrac{13}{4}$', C: '$\\dfrac{15}{4}$', D: '$\\dfrac{17}{4}$' },
  answer: 'D',
  analysis:
    '$27^{\\frac{2}{3}}=9$，$8^{-\\frac{2}{3}}=\\dfrac{1}{4}$，积 $\\dfrac{9}{4}$；$16^{\\frac{1}{4}}=2$。总和 $\\dfrac{9}{4}+2=\\dfrac{17}{4}$。选 D。',
  dedupNote: '分数指数多步化简求值',
  authorMathNote: '9/4+2=17/4。',
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '指数运算。',
}

console.log('partial defs', Object.keys(DEFS).length)
