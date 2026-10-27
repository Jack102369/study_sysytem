/**
 * Ch6–10 rebuild builders (必修二)
 */
import { seed, pick, appRubric, baseItem } from './_rebuild_core.mjs'

export function buildCh6(slot, n) {
  const a = seed(n, 2, 6)
  const b = seed(n + 2, 3, 8)
  const qt = slot.qtype
  const d = slot.difficulty
  const triples = [
    [3, 4, 5],
    [5, 12, 13],
    [6, 8, 10],
    [8, 15, 17],
    [7, 24, 25],
    [9, 12, 15],
    [9, 40, 41],
    [20, 21, 29],
  ]
  const [ta, tb, tc] = triples[n % triples.length]

  if (qt === 'numeric') {
    return baseItem(
      slot,
      {
        sectionCode: '6.3',
        sectionName: '平面向量基本定理及坐标表示',
        stem: `设 $\\vec a=(${ta},${tb})$，则 $|\\vec a|=$`,
        options: null,
        answer: String(tc),
        analysis: `$\\sqrt{${ta}^2+${tb}^2}=${tc}$。`,
        authorMathNote: String(tc),
        dedupNote: `mod-${ta}-${tb}`,
      },
      { rebuildAction: 'replace' },
    )
  }

  if (qt === 'single') {
    if (d === 3) {
      return baseItem(
        slot,
        {
          sectionCode: '6.2',
          sectionName: '向量的运算',
          stem: `设 $|\\vec a|=${a}$，$|\\vec b|=${b}$，$\\vec a\\cdot\\vec b=${a}$。则 $|\\vec a+\\vec b|^2=$`,
          options: {
            A: String(a * a + b * b + 2 * a),
            B: String(a * a + b * b - 2 * a),
            C: String(a * a + b * b),
            D: String((a + b) * (a + b)),
          },
          answer: 'A',
          analysis: `$|\\vec a+\\vec b|^2=|\\vec a|^2+|\\vec b|^2+2\\vec a\\cdot\\vec b=${a * a}+${b * b}+2\\cdot${a}$。`,
          authorMathNote: String(a * a + b * b + 2 * a),
          dedupNote: `dot-expand-${a}-${b}`,
          hardProfile: {
            ability: 'F',
            coreDifficulty: '用数量积展开模的平方',
            solutionOutline: '展开 |a+b|^2=|a|^2+|b|^2+2a·b 代入',
            whyNotEasy: '需熟练数量积与模关系，非直接相加模长',
          },
        },
        { rebuildAction: 'replace' },
      )
    }
    return baseItem(
      slot,
      {
        sectionCode: '6.2',
        sectionName: '向量的运算',
        stem: `设 $\\vec a=(${a},0)$，$\\vec b=(0,${a})$，则 $\\vec a\\cdot\\vec b=$`,
        options: { A: '0', B: String(a * a), C: String(2 * a), D: String(a) },
        answer: 'A',
        analysis: `点积为 $0$。`,
        authorMathNote: '0',
        dedupNote: `perp-dot-${a}`,
      },
      { rebuildAction: 'replace' },
    )
  }

  if (qt === 'multi') {
    return baseItem(
      slot,
      {
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
        authorMathNote: 'A,B,C',
        dedupNote: `vec-concept-${n % 4}`,
      },
      { rebuildAction: 'replace' },
    )
  }

  if (qt === 'judge') {
    return baseItem(
      slot,
      {
        sectionCode: '6.3',
        sectionName: '平面向量基本定理及坐标表示',
        stem: `判断：平面内任意两个不共线向量都可作为基底。`,
        options: null,
        answer: 'true',
        analysis: `平面向量基本定理要求不共线。`,
        authorMathNote: '真',
        dedupNote: `basis-judge-${n % 2}`,
      },
      { rebuildAction: 'replace' },
    )
  }

  // application
  if (d === 3) {
    const r3 = appRubric(
      [
        { key: 'setup', title: '设向量', score: 3, criterion: '合理设 AB=a, AD=b 或位置向量' },
        { key: 'mid', title: '中点/对角线', score: 3, criterion: '得到对角线互相平分的向量等式' },
        { key: 'conc', title: '结论', score: 2, criterion: '完整写出证明结论' },
      ],
      8,
    )
    return baseItem(
      slot,
      {
        sectionCode: '6.4',
        sectionName: '平面向量的应用',
        stem: `在平行四边形 $ABCD$ 中，用向量方法证明：对角线 $AC$ 与 $BD$ 互相平分。`,
        options: null,
        answer: `设 $\\overrightarrow{AB}=\\vec a$，$\\overrightarrow{AD}=\\vec b$。设 $AC$、$BD$ 交于 $O$。则 $\\overrightarrow{AO}=\\dfrac12(\\vec a+\\vec b)$，$\\overrightarrow{BO}=\\dfrac12(\\vec b-\\vec a)+\\vec a=\\dfrac12(\\vec a+\\vec b)$，故 $O$ 亦为 $BD$ 中点。`,
        analysis: `用向量表示对角线并证交点同为中点。`,
        authorMathNote: '对角线互相平分',
        dedupNote: `para-diag-${n}`,
        diagramRequirement: 'REQUIRED',
        hardProfile: {
          ability: 'F',
          coreDifficulty: '向量法证明平行四边形对角线互相平分',
          solutionOutline: '设边向量→写对角线→证交点同为两边中点',
          whyNotEasy: '需完整向量证明，非记忆结论',
        },
        ...r3,
      },
      { rebuildAction: 'replace', diagramVerdict: 'REQUIRED 平行四边形' },
    )
  }

  const px = 2 + (n % 5)
  const qy = 3 + ((n * 2) % 4)
  const r = appRubric(
    [
      { key: 'ab', title: '求 AB', score: 4, criterion: `AB=(-${px},${qy})` },
      { key: 'mod', title: '求模', score: 4, criterion: `模=√(${px * px + qy * qy})` },
    ],
    8,
  )
  return baseItem(
    slot,
    {
      sectionCode: '6.4',
      sectionName: '平面向量的应用',
      stem: `平面内点 $O,A,B$ 满足 $\\overrightarrow{OA}=(${px},0)$，$\\overrightarrow{OB}=(0,${qy})$。\n（1）求 $\\overrightarrow{AB}$；\n（2）求 $|\\overrightarrow{AB}|$。`,
      options: null,
      answer: `（1）$(-${px},${qy})$；（2）$\\sqrt{${px * px + qy * qy}}$。`,
      analysis: `$\\overrightarrow{AB}=\\overrightarrow{OB}-\\overrightarrow{OA}$。`,
      authorMathNote: `√${px * px + qy * qy}`,
      dedupNote: `OAOB-${px}-${qy}`,
      diagramRequirement: 'REQUIRED',
      ...r,
    },
    { rebuildAction: 'replace', diagramVerdict: 'REQUIRED 向量示意' },
  )
}

export function buildCh7(slot, n) {
  const qt = slot.qtype
  const d = slot.difficulty
  const triples = [
    [3, 4, 5],
    [5, 12, 13],
    [6, 8, 10],
    [8, 15, 17],
  ]
  const [ta, tb, tc] = triples[n % triples.length]

  if (qt === 'numeric') {
    return baseItem(
      slot,
      {
        sectionCode: '7.3',
        sectionName: '复数的三角表示初步',
        stem: `$|${ta}-${tb}\\mathrm{i}|=$`,
        options: null,
        answer: String(tc),
        analysis: `$\\sqrt{${ta}^2+${tb}^2}=${tc}$。`,
        authorMathNote: String(tc),
        dedupNote: `cmod-${ta}-${tb}`,
      },
      { rebuildAction: 'replace' },
    )
  }

  if (qt === 'single') {
    if (d === 3) {
      return baseItem(
        slot,
        {
          sectionCode: '7.2',
          sectionName: '复数的四则运算',
          stem: `计算 $\\dfrac{2-\\mathrm{i}}{1+\\mathrm{i}}$，结果化为 $a+b\\mathrm{i}$ 后，$a+b=$`,
          options: { A: '1', B: '0', C: '2', D: '-1' },
          answer: 'B',
          analysis: `分子分母乘 $1-\\mathrm{i}$：分子 $(2-\\mathrm{i})(1-\\mathrm{i})=2-2\\mathrm{i}-\\mathrm{i}+\\mathrm{i}^2=1-3\\mathrm{i}$，分母 $2$，得 $\\dfrac12-\\dfrac32\\mathrm{i}$，$a+b=0$。`,
          authorMathNote: 'a+b=0',
          dedupNote: `cdiv-d3-${n}`,
          hardProfile: {
            ability: 'A',
            coreDifficulty: '复数除法化简后再求 a+b',
            solutionOutline: '乘共轭→化 a+bi→求和',
            whyNotEasy: '多步代数运算且易符号出错',
          },
        },
        { rebuildAction: 'replace' },
      )
    }
    const exp = 2 + (n % 4) * 2
    return baseItem(
      slot,
      {
        sectionCode: '7.1',
        sectionName: '复数的概念',
        stem: `$\\mathrm{i}^{${exp}}=$`,
        options: { A: '1', B: '-1', C: 'i', D: '0' },
        answer: exp % 4 === 0 ? 'A' : 'B',
        analysis: `$\\mathrm{i}^{${exp}}=${exp % 4 === 0 ? 1 : -1}$。`,
        authorMathNote: String(exp % 4 === 0 ? 1 : -1),
        dedupNote: `i-pow-${exp}`,
      },
      { rebuildAction: 'replace' },
    )
  }

  if (qt === 'multi') {
    return baseItem(
      slot,
      {
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
        analysis: `$z\\bar z=25$，D 错。`,
        authorMathNote: 'A,B,C',
        dedupNote: `cplx-multi-${n % 3}`,
      },
      { rebuildAction: 'replace' },
    )
  }

  if (qt === 'judge') {
    return baseItem(
      slot,
      {
        sectionCode: '7.1',
        sectionName: '复数的概念',
        stem: `判断：两个复数相等的充要条件是实部相等且虚部相等。`,
        options: null,
        answer: 'true',
        analysis: `复数相等定义。`,
        authorMathNote: '真',
        dedupNote: `ceq-${n % 2}`,
      },
      { rebuildAction: 'replace' },
    )
  }

  const r = appRubric(
    [
      { key: 'mul', title: '乘法', score: 4, criterion: '得到正确 a+bi' },
      { key: 'mod', title: '求模', score: 4, criterion: '模正确' },
    ],
    8,
  )
  return baseItem(
    slot,
    {
      sectionCode: '7.2',
      sectionName: '复数的四则运算',
      stem: `计算 $(1+\\mathrm{i})(${2 + (n % 3)}-\\mathrm{i})$，并求结果的模。`,
      options: null,
      answer: (() => {
        const c = 2 + (n % 3)
        // (1+i)(c-i)=c-i+ci-i^2=c+1+(c-1)i
        const re = c + 1
        const im = c - 1
        return `$${re}+${im}\\mathrm{i}$；$\\sqrt{${re * re + im * im}}$`
      })(),
      analysis: `展开并求模。`,
      authorMathNote: '乘法+模',
      dedupNote: `cmul-app-${n}`,
      hardProfile:
        d === 3
          ? {
              ability: 'A',
              coreDifficulty: '复数乘法与模的衔接',
              solutionOutline: '展开→a+bi→求模',
              whyNotEasy: '两步衔接且虚部系数依赖参数',
            }
          : null,
      ...r,
    },
    { rebuildAction: 'replace' },
  )
}

export function buildCh8(slot, n) {
  const R = 2 + (n % 4)
  const H = 3 + (n % 5)
  const h = 2 + ((n * 3) % 4)
  const a = 2 + (n % 3)
  const qt = slot.qtype
  const d = slot.difficulty

  if (qt === 'numeric') {
    return baseItem(
      slot,
      {
        sectionCode: '8.3',
        sectionName: '简单几何体的表面积与体积',
        stem: `底面半径 $${R}$、高 $${H}$ 的圆柱，其体积除以 $\\pi$ 的结果为`,
        options: null,
        answer: String(R * R * H),
        analysis: `$V/\\pi=r^2 h=${R * R * H}$。`,
        authorMathNote: String(R * R * H),
        dedupNote: `cyl-${R}-${H}`,
        diagramRequirement: 'RECOMMENDED',
      },
      { rebuildAction: 'replace' },
    )
  }

  if (qt === 'single') {
    if (d === 3) {
      return baseItem(
        slot,
        {
          sectionCode: '8.5',
          sectionName: '空间直线与平面',
          stem: `在正方体 $ABCD-A_1B_1C_1D_1$ 中，下列结论正确的是`,
          options: {
            A: `$BD_1\\parallel$ 平面 $A_1C_1D$`,
            B: `$BD_1$ 与平面 $A_1C_1D$ 相交但不垂直`,
            C: `$AA_1\\parallel BD_1$`,
            D: `$AC\\parallel A_1C_1$ 且 $AC=A_1C_1$ 故四边形 $ACC_1A_1$ 是平行四边形但不一定是矩形`,
          },
          answer: 'A',
          analysis: `可用向量或三角面平行判定证明 $BD_1\\parallel$ 平面 $A_1C_1D$。`,
          authorMathNote: '线面平行',
          dedupNote: `cube-d3-${n}`,
          diagramRequirement: 'REQUIRED',
          hardProfile: {
            ability: 'F',
            coreDifficulty: '正方体中线面平行的判定',
            solutionOutline: '找平面内与 BD1 平行的直线或用向量共面',
            whyNotEasy: '需空间想象与平行判定，非套体积公式',
          },
        },
        { rebuildAction: 'replace' },
      )
    }
    return baseItem(
      slot,
      {
        sectionCode: '8.3',
        sectionName: '简单几何体的表面积与体积',
        stem: `棱长为 $${a + 1}$ 的正方体体积为`,
        options: {
          A: String((a + 1) ** 3),
          B: String(6 * (a + 1) ** 2),
          C: String((a + 1) ** 2),
          D: String(4 * (a + 1)),
        },
        answer: 'A',
        analysis: `$V=a^3$。`,
        authorMathNote: String((a + 1) ** 3),
        dedupNote: `cube-vol-${a + 1}`,
      },
      { rebuildAction: 'replace' },
    )
  }

  if (qt === 'multi') {
    return baseItem(
      slot,
      {
        sectionCode: '8.4',
        sectionName: '空间点线面位置关系',
        stem: `下列关于空间直线与平面的说法正确的有（多选）`,
        options: {
          A: '过直线外一点有且仅有一条直线与已知直线平行',
          B: '直线与平面平行则与平面内所有直线平行',
          C: '若直线垂直平面内两条相交直线，则线面垂直',
          D: '两平面平行则一线面夹角相等对应',
        },
        answer: 'A,C',
        analysis: `B 错：线面平行只保证与面内直线不相交，可能异面；D 表述不完整不当选。`,
        authorMathNote: 'A,C',
        dedupNote: `space-multi-${n % 3}`,
      },
      { rebuildAction: 'replace' },
    )
  }

  if (qt === 'judge') {
    return baseItem(
      slot,
      {
        sectionCode: '8.5',
        sectionName: '空间直线与平面',
        stem: `判断：平面外一条直线与平面内一条直线平行，则该直线与平面平行。`,
        options: null,
        answer: 'true',
        analysis: `线面平行判定定理。`,
        authorMathNote: '真',
        dedupNote: `lplane-judge-${n % 2}`,
      },
      { rebuildAction: 'replace' },
    )
  }

  const volCombo = R * R * H + (R * R * h) / 3
  if (d === 3) {
    const r3 = appRubric(
      [
        { key: 'cyl', title: '圆柱体积', score: 3, criterion: `πR²H` },
        { key: 'cone', title: '圆锥体积', score: 3, criterion: `(1/3)πR²h` },
        { key: 'sum', title: '总和', score: 2, criterion: `${volCombo}π` },
      ],
      8,
    )
    return baseItem(
      slot,
      {
        sectionCode: '8.3',
        sectionName: '简单几何体的表面积与体积',
        stem: `圆柱（底面半径 $${R}$，高 $${H}$）上叠放同底圆锥（高 $${h}$）。求组合体体积（含 $\\pi$）。`,
        options: null,
        answer: `$${volCombo}\\pi$`,
        analysis: `圆柱 $${R * R * H}\\pi$ + 圆锥 $${(R * R * h) / 3}\\pi$。`,
        authorMathNote: `${volCombo}π`,
        dedupNote: `combo-${R}-${H}-${h}`,
        diagramRequirement: 'REQUIRED',
        hardProfile: {
          ability: 'A',
          coreDifficulty: '柱锥组合体积（同底叠放）',
          solutionOutline: '分部件求体积再相加',
          whyNotEasy: '需分清锥体系数 1/3 且不重复底',
        },
        ...r3,
      },
      { rebuildAction: 'replace', diagramVerdict: 'REQUIRED 柱锥' },
    )
  }

  const kind = n % 4
  if (kind === 0) {
    const r = appRubric(
      [
        { key: 'v1', title: '柱', score: 3, criterion: '圆柱体积' },
        { key: 'v2', title: '锥', score: 3, criterion: '圆锥体积' },
        { key: 'sum', title: '和', score: 2, criterion: '总和' },
      ],
      8,
    )
    return baseItem(
      slot,
      {
        sectionCode: '8.3',
        sectionName: '简单几何体的表面积与体积',
        stem: `圆柱（底面半径 $${R}$，高 $${H}$）上叠放同底圆锥（高 $${h}$）。求组合体体积（含 $\\pi$）。`,
        options: null,
        answer: `$${volCombo}\\pi$`,
        analysis: `分部件相加。`,
        authorMathNote: `${volCombo}π`,
        dedupNote: `combo2-${R}-${H}-${h}`,
        diagramRequirement: 'REQUIRED',
        ...r,
      },
      { rebuildAction: 'replace' },
    )
  }
  if (kind === 1) {
    const r = appRubric(
      [
        { key: 'cube', title: '正方体', score: 3, criterion: '体积正确' },
        { key: 'cyl', title: '挖柱', score: 3, criterion: '圆柱体积正确' },
        { key: 'rest', title: '剩余', score: 2, criterion: '差正确' },
      ],
      8,
    )
    return baseItem(
      slot,
      {
        sectionCode: '8.3',
        sectionName: '简单几何体的表面积与体积',
        stem: `正方体棱长 $${a + 2}$，内部挖去底面半径 $${a}$、高 $${a + 1}$ 的圆柱（轴平行于棱）。求剩余体积（含 $\\pi$）。`,
        options: null,
        answer: `$${(a + 2) ** 3}-\\pi\\cdot${a * a * (a + 1)}$`,
        analysis: `大正方体减圆柱。`,
        authorMathNote: '挖柱',
        dedupNote: `dig-${a}`,
        diagramRequirement: 'REQUIRED',
        ...r,
      },
      { rebuildAction: 'replace' },
    )
  }
  if (kind === 2) {
    const r = appRubric(
      [
        { key: 'vol', title: '体积', score: 4, criterion: '圆锥体积' },
        { key: 'sec', title: '轴截面', score: 4, criterion: '面积 RH' },
      ],
      8,
    )
    return baseItem(
      slot,
      {
        sectionCode: '8.3',
        sectionName: '简单几何体的表面积与体积',
        stem: `圆锥底面半径 $${R}$、高 $${H}$。\n（1）求体积（含 $\\pi$）；\n（2）求轴截面面积。`,
        options: null,
        answer: `（1）$\\dfrac13\\pi\\cdot${R * R}\\cdot${H}$；（2）$${R * H}$。`,
        analysis: `体积公式；轴截面为等腰三角形面积 $R H$。`,
        authorMathNote: '圆锥两问',
        dedupNote: `cone-${R}-${H}`,
        diagramRequirement: 'REQUIRED',
        ...r,
      },
      { rebuildAction: 'replace' },
    )
  }
  const r = appRubric(
    [
      { key: 'sq', title: '平方和', score: 8, criterion: '三棱平方和' },
    ],
    8,
  )
  return baseItem(
    slot,
    {
      sectionCode: '8.3',
      sectionName: '简单几何体的表面积与体积',
      stem: `长方体棱长分别为 $${a + 1},${a + 2},${a + 3}$。求体对角线长的平方。`,
      options: null,
      answer: String((a + 1) ** 2 + (a + 2) ** 2 + (a + 3) ** 2),
      analysis: `体对角线平方等于三度平方和。`,
      authorMathNote: '对角线平方',
      dedupNote: `boxdiag-${a}`,
      diagramRequirement: 'REQUIRED',
      ...r,
    },
    { rebuildAction: 'replace' },
  )
}

export function buildCh9(slot, n) {
  const qt = slot.qtype
  const d = slot.difficulty
  const a0 = 1 + (n % 5)
  const arr = [a0, a0 + 2, a0 + 4, a0 + 6]
  const mean = arr.reduce((s, x) => s + x, 0) / arr.length

  if (qt === 'numeric') {
    return baseItem(
      slot,
      {
        sectionCode: '9.2',
        sectionName: '用样本估计总体',
        stem: `样本数据 $${arr.join(',')}$，则样本平均数为`,
        options: null,
        answer: String(mean),
        analysis: `$(${arr.join('+')})/4=${mean}$。`,
        authorMathNote: String(mean),
        dedupNote: `mean-${arr.join('-')}`,
      },
      { rebuildAction: 'replace' },
    )
  }

  if (qt === 'single') {
    if (d === 3) {
      return baseItem(
        slot,
        {
          sectionCode: '9.2',
          sectionName: '用样本估计总体',
          stem: `抽检 $200$ 件产品发现次品 $8$ 件。用频率估计次品率，并据此估计 $5000$ 件中次品约多少件？应选`,
          options: {
            A: '40',
            B: '200',
            C: '8',
            D: '160',
          },
          answer: 'B',
          analysis: `频率 $8/200=0.04$；$5000\\times 0.04=200$。`,
          authorMathNote: '200',
          dedupNote: `freq-est-${n}`,
          hardProfile: {
            ability: 'H',
            coreDifficulty: '频率估计概率并外推总量',
            solutionOutline: '算频率→乘总体容量',
            whyNotEasy: '两步推断，易误用抽检件数当答案',
          },
        },
        { rebuildAction: 'replace' },
      )
    }
    return baseItem(
      slot,
      {
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
        authorMathNote: '5/100',
        dedupNote: `srs-p-${n % 3}`,
      },
      { rebuildAction: 'replace' },
    )
  }

  if (qt === 'multi') {
    return baseItem(
      slot,
      {
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
        authorMathNote: 'A,B',
        dedupNote: `srs-multi-${n % 2}`,
      },
      { rebuildAction: 'replace' },
    )
  }

  if (qt === 'judge') {
    const variants = [
      {
        stem: `判断：样本平均数可用于估计总体平均数。`,
        answer: 'true',
        analysis: `用样本数字特征估计总体。`,
      },
      {
        stem: `判断：线性回归方程一定经过每一个样本点。`,
        answer: 'false',
        analysis: `回归直线一般不经过所有样本点，通常过样本中心。`,
      },
    ]
    const v = pick(n, variants)
    return baseItem(
      slot,
      {
        sectionCode: '9.2',
        sectionName: '用样本估计总体',
        stem: v.stem,
        options: null,
        answer: v.answer,
        analysis: v.analysis,
        authorMathNote: v.answer,
        dedupNote: `stat-judge-${n % 2}`,
        hardProfile:
          d === 3
            ? {
                ability: 'H',
                coreDifficulty: '回归性质正误辨析',
                solutionOutline: '回忆回归直线性质→举反例或说理',
                whyNotEasy: '易与“过样本中心”混淆',
              }
            : null,
      },
      { rebuildAction: 'replace' },
    )
  }

  const r = appRubric(
    [
      { key: 'freq', title: '频率', score: 3, criterion: '频率正确' },
      { key: 'est', title: '估计', score: 5, criterion: '总体估计正确' },
    ],
    8,
  )
  return baseItem(
    slot,
    {
      sectionCode: '9.2',
      sectionName: '用样本估计总体',
      stem: `抛硬币 $200$ 次出现正面 $96$ 次。\n（1）估计正面出现概率；\n（2）据此估计再抛 $500$ 次约出现多少次正面。`,
      options: null,
      answer: `（1）$0.48$；（2）$240$。`,
      analysis: `频率 $96/200=0.48$；$500\\times 0.48=240$。`,
      authorMathNote: '0.48→240',
      dedupNote: `coin-est-${n}`,
      ...r,
    },
    { rebuildAction: 'replace' },
  )
}

export function buildCh10(slot, n) {
  const qt = slot.qtype
  const d = slot.difficulty
  const nn = 4 + (n % 5)
  const r0 = 1 + (n % 2)

  if (qt === 'numeric') {
    const comb = r0 === 1 ? nn : (nn * (nn - 1)) / 2
    return baseItem(
      slot,
      {
        sectionCode: '10.1',
        sectionName: '随机事件与概率',
        stem: `从 $${nn}$ 人中选 $${r0}$ 人的组合数 $C(${nn},${r0})=$`,
        options: null,
        answer: String(comb),
        analysis: `$C(${nn},${r0})=${comb}$。`,
        authorMathNote: String(comb),
        dedupNote: `C-${nn}-${r0}`,
      },
      { rebuildAction: 'replace' },
    )
  }

  if (qt === 'single') {
    if (d === 3) {
      return baseItem(
        slot,
        {
          sectionCode: '10.2',
          sectionName: '事件的相互独立性',
          stem: `独立事件 $A,B$ 满足 $P(A)=0.4$，$P(B)=0.5$，则 $P(A\\cup B)=$`,
          options: {
            A: '0.7',
            B: '0.9',
            C: '0.2',
            D: '0.6',
          },
          answer: 'A',
          analysis: `$P(A\\cup B)=P(A)+P(B)-P(A)P(B)=0.4+0.5-0.2=0.7$。`,
          authorMathNote: '0.7',
          dedupNote: `indep-union-${n}`,
          hardProfile: {
            ability: 'H',
            coreDifficulty: '独立事件并集概率',
            solutionOutline: '用独立得交→容斥求并',
            whyNotEasy: '易误加为 0.9 或误乘为 0.2',
          },
        },
        { rebuildAction: 'replace' },
      )
    }
    return baseItem(
      slot,
      {
        sectionCode: '10.1',
        sectionName: '随机事件与概率',
        stem: `掷一枚质地均匀骰子一次，样本空间基本事件个数为`,
        options: { A: '5', B: '6', C: '2', D: '12' },
        answer: 'B',
        analysis: `六个面。`,
        authorMathNote: '6',
        dedupNote: `dice-n-${n % 2}`,
      },
      { rebuildAction: 'replace' },
    )
  }

  if (qt === 'multi') {
    return baseItem(
      slot,
      {
        sectionCode: '10.2',
        sectionName: '事件的相互独立性',
        stem: `设 $0<P(A)<1$，$0<P(B)<1$，且 $A,B$ 相互独立。一定成立的有（多选）`,
        options: {
          A: `$P(AB)=P(A)P(B)$`,
          B: `$P(A\\cup B)=P(A)+P(B)$`,
          C: `$P(\\overline{A}\\,B)=P(\\overline{A})P(B)$`,
          D: `$A$ 与 $\\overline{B}$ 也独立`,
        },
        answer: 'A,C,D',
        analysis: `B 仅当互斥才成立；独立保留对补事件。`,
        authorMathNote: 'A,C,D',
        dedupNote: `indep-multi-${n % 3}`,
      },
      { rebuildAction: 'replace' },
    )
  }

  if (qt === 'judge') {
    return baseItem(
      slot,
      {
        sectionCode: '10.3',
        sectionName: '频率与概率',
        stem: `判断：在相同条件下大量重复试验时，随机事件频率往往会稳定于某一常数（概率）。`,
        options: null,
        answer: 'true',
        analysis: `大数定律思想。`,
        authorMathNote: '真',
        dedupNote: `lln-${n % 2}`,
      },
      { rebuildAction: 'replace' },
    )
  }

  const r = appRubric(
    [
      { key: 'space', title: '样本空间', score: 3, criterion: '总基本事件数正确' },
      { key: 'fav', title: '有利事件', score: 3, criterion: '有利计数正确' },
      { key: 'p', title: '概率', score: 2, criterion: '概率最简分数或等价' },
    ],
    8,
  )
  // classic: sum odd when picking 2 from {1,2,3,4}
  return baseItem(
    slot,
    {
      sectionCode: '10.1',
      sectionName: '随机事件与概率',
      stem: `从 $\\{1,2,3,4\\}$ 中随机取两个不同数，求两数之和为奇数的概率。`,
      options: null,
      answer: `$\\dfrac{2}{3}$`,
      analysis: `总 $C(4,2)=6$；一奇一偶 $2\\times 2=4$；$P=4/6=2/3$。`,
      authorMathNote: '2/3',
      dedupNote: `class-odd-sum-${n}`,
      hardProfile:
        d === 3
          ? {
              ability: 'H',
              coreDifficulty: '古典概型分类计数',
              solutionOutline: '总数→奇偶配对→比值化简',
              whyNotEasy: '需分类而非枚举偶然',
            }
          : null,
      ...r,
    },
    { rebuildAction: 'replace' },
  )
}
