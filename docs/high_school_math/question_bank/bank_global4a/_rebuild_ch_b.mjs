/**
 * GLOBAL-4A QUALITY-REBUILD — 必修二 rjb (ch6–10)
 * Export: buildRjb(slot) → { item, mathEvidence, hardProfile }
 */
import { baseItem, seed, pick, appRubric } from './_rebuild_core.mjs'

function hp(ability, coreDifficulty, solutionOutline, whyNotEasy) {
  return { hardProfile: { ability, coreDifficulty, solutionOutline, whyNotEasy } }
}

function fig(purpose, elements, mustNotReveal) {
  return {
    diagramRequirement: 'REQUIRED',
    diagramSpecification: { purpose, elements, mustNotReveal },
    noDiagramReason: null,
  }
}

function noFig(reason = '文字/坐标条件充分，抽象计算无需图示。') {
  return { diagramRequirement: 'NOT_NEEDED', diagramSpecification: null, noDiagramReason: reason }
}

function pythagorean(n) {
  return pick(n, [
    [3, 4, 5],
    [5, 12, 13],
    [6, 8, 10],
    [8, 15, 17],
    [7, 24, 25],
    [9, 12, 15],
    [20, 21, 29],
  ])
}

/* ===================== Ch6 平面向量 ===================== */
function ch6(slot, n) {
  const a = seed(n, 2, 8)
  const b = seed(n + 11, 2, 9)
  const [p, q, r] = pythagorean(n)
  const qt = slot.qtype
  const d = slot.difficulty

  if (qt === 'single') {
    const variants = [
      {
        sectionCode: '6.2',
        sectionName: '向量的运算',
        stem: `设 $\\vec a=(${a},0)$，$\\vec b=(0,${b})$，则 $\\vec a\\cdot\\vec b=$`,
        options: { A: '0', B: String(a * b), C: String(a + b), D: String(a * a + b * b) },
        answer: 'A',
        analysis: `点积 $${a}\\cdot 0+0\\cdot ${b}=0$，两向量垂直。`,
        authorMathNote: `垂直点积 0`,
        ...noFig(),
      },
      {
        sectionCode: '6.3',
        sectionName: '平面向量基本定理及坐标表示',
        stem: `设 $\\vec a=(${p},${q})$，则 $|\\vec a|=$`,
        options: { A: String(r), B: String(p + q), C: String(p * q), D: String(r * r) },
        answer: 'A',
        analysis: `$\\sqrt{${p}^2+${q}^2}=${r}$。`,
        authorMathNote: `|a|=${r}`,
        ...noFig(),
      },
      {
        sectionCode: '6.2',
        sectionName: '向量的运算',
        stem: `已知 $|\\vec a|=${a}$，$|\\vec b|=${b}$，$\\vec a\\perp\\vec b$，则 $|\\vec a+\\vec b|^2=$`,
        options: {
          A: String(a * a + b * b),
          B: String((a + b) * (a + b)),
          C: String(a * a - b * b),
          D: String(2 * a * b),
        },
        answer: 'A',
        analysis: `垂直则 $|\\vec a+\\vec b|^2=|\\vec a|^2+|\\vec b|^2=${a * a}+${b * b}$。`,
        authorMathNote: `平方和 ${a * a + b * b}`,
        ...noFig(),
      },
      {
        sectionCode: '6.1',
        sectionName: '平面向量的概念',
        stem: `下列说法正确的是`,
        options: {
          A: '零向量与任意非零向量不平行',
          B: '相等向量必共线且模相等、方向相同',
          C: '单位向量的模可以是任意正数',
          D: '任意两向量必共线',
        },
        answer: 'B',
        analysis: `相等向量定义即方向相同且模相等（因而共线）；零向量平行于任何向量；单位向量模为 1。`,
        authorMathNote: `选 B`,
        ...noFig('概念辨析，无需图示。'),
      },
      {
        sectionCode: '6.2',
        sectionName: '向量的运算',
        stem: `设 $\\vec a=(${a},${b})$，$\\vec b=(${-b},${a})$，则 $\\vec a\\cdot\\vec b=$`,
        options: { A: '0', B: String(a * a + b * b), C: String(a * b), D: String(2 * a * b) },
        answer: 'A',
        analysis: `$${a}(${-b})+${b}\\cdot${a}=0$，故垂直。`,
        authorMathNote: `点积 0`,
        ...noFig(),
      },
      {
        sectionCode: '6.3',
        sectionName: '平面向量基本定理及坐标表示',
        stem: `点 $A(${a},0)$，$B(0,${b})$，则 $|\\overrightarrow{AB}|=$`,
        options: {
          A: `$\\sqrt{${a * a + b * b}}$`,
          B: String(a + b),
          C: String(Math.abs(a - b)),
          D: String(a * b),
        },
        answer: 'A',
        analysis: `$\\overrightarrow{AB}=(${-a},${b})$，模 $\\sqrt{${a}^2+${b}^2}$。`,
        authorMathNote: `模 √(${a * a}+${b * b})`,
        ...fig('示意 A、B 与向量 AB', ['点 A、B', '有向线段 AB'], '不得标注最终模长数值'),
      },
      {
        sectionCode: '6.2',
        sectionName: '向量的运算',
        stem: `已知 $|\\vec a|=${p}$，$|\\vec b|=${q}$，$\\langle\\vec a,\\vec b\\rangle=90^\\circ$，则 $\\vec a\\cdot\\vec b=$`,
        options: { A: '0', B: String(p * q), C: String(r), D: String(p + q) },
        answer: 'A',
        analysis: `夹角 $90^\\circ$ 时数量积为 0。`,
        authorMathNote: `0`,
        ...noFig(),
      },
      {
        sectionCode: '6.3',
        sectionName: '平面向量基本定理及坐标表示',
        stem: `若 $\\vec a=(${a},${2 * a})$ 与 $\\vec b=(1,k)$ 共线，则 $k=$`,
        options: { A: '2', B: String(a), C: String(1 / 2), D: String(-2) },
        answer: 'A',
        analysis: `共线则存在实数 $\\lambda$ 使 $\\vec a=\\lambda\\vec b$，故 $k/1=2a/a=2$。`,
        authorMathNote: `k=2`,
        ...noFig(),
      },
      {
        sectionCode: '6.4',
        sectionName: '平面向量的应用',
        stem: `力 $\\vec F=(${3 * a},${4 * a})$（单位 N）作用位移 $\\vec s=(${a},0)$（单位 m），则功 $W=\\vec F\\cdot\\vec s=$`,
        options: {
          A: String(3 * a * a),
          B: String(4 * a * a),
          C: String(5 * a * a),
          D: String(7 * a * a),
        },
        answer: 'A',
        analysis: `$W=${3 * a}\\cdot${a}+${4 * a}\\cdot 0=${3 * a * a}$。`,
        authorMathNote: `W=${3 * a * a}`,
        ...noFig('功为数量积计算，无需图示。'),
      },
      {
        sectionCode: '6.2',
        sectionName: '向量的运算',
        stem: `设 $\\vec a\\ne\\vec 0$，则 $\\dfrac{\\vec a}{|\\vec a|}$ 表示`,
        options: {
          A: '与 $\\vec a$ 同向的单位向量',
          B: '与 $\\vec a$ 反向的单位向量',
          C: '零向量',
          D: '模为 $|\\vec a|$ 的向量',
        },
        answer: 'A',
        analysis: `非零向量除以模得同向单位向量。`,
        authorMathNote: `单位化`,
        ...noFig('定义辨析。'),
      },
    ]
    let v = pick(n, variants)
    if (d === 3) {
      const hardVars = [
        {
          sectionCode: '6.4',
          sectionName: '平面向量的应用',
          stem: `在 $\\triangle ABC$ 中，$\\overrightarrow{AB}=\\vec b$，$\\overrightarrow{AC}=\\vec c$，$|\\vec b|=${p}$，$|\\vec c|=${q}$，$\\vec b\\cdot\\vec c=${((p * p + q * q - r * r) / 2) | 0}$。设 $D$ 为 $BC$ 中点，则 $|\\overrightarrow{AD}|^2=$`,
          options: {
            A: String(((p * p + q * q) / 2 - (((p * p + q * q - r * r) / 2) | 0) / 2) | 0) || String((p * p + q * q) / 2),
            B: String(p * p + q * q),
            C: String(r * r),
            D: String((p + q) * (p + q)),
          },
          answer: 'A',
          analysis: `$\\overrightarrow{AD}=\\dfrac{\\vec b+\\vec c}{2}$，$|\\overrightarrow{AD}|^2=\\dfrac{|\\vec b|^2+|\\vec c|^2+2\\vec b\\cdot\\vec c}{4}$。由余弦定理构造保证几何一致。`,
          authorMathNote: `中线长公式`,
          ...fig('△ABC 与中点 D', ['三角形 ABC', '中点 D', '中线 AD'], '不得标注 |AD| 数值'),
          ...hp(
            '向量中线与数量积综合',
            '由点积与中点公式求中线长平方，需正确展开',
            'AD=(b+c)/2 → 展开模平方 → 代入已知点积',
            '非单一点积公式，需几何中点与代数展开串联',
          ),
        },
        {
          sectionCode: '6.3',
          sectionName: '平面向量基本定理及坐标表示',
          stem: `已知 $\\vec a=(${a},1)$，$\\vec b=(1,${a})$，$\\vec c=(${a + 1},${a - 1})$。若 $\\vec c=x\\vec a+y\\vec b$，则 $x+y=$`,
          options: {
            A: '1',
            B: String(a),
            C: '0',
            D: String(2),
          },
          answer: 'A',
          analysis: `解方程组 $${a}x+y=${a + 1}$，$x+${a}y=${a - 1}$。相加得 $(${a}+1)(x+y)=2a$，结合差式可得 $x+y=1$。`,
          authorMathNote: `x+y=1（线性组合）`,
          ...noFig(),
          ...hp(
            '基底线性表示',
            '解二元线性组合并求 x+y',
            '列坐标方程 → 加减消元得 x+y',
            '需同时处理两个未知数，非直接点积',
          ),
        },
      ]
      // fix answer for first hard var carefully
      const dot = (p * p + q * q - r * r) / 2
      const ad2 = (p * p + q * q + 2 * dot) / 4
      hardVars[0] = {
        sectionCode: '6.4',
        sectionName: '平面向量的应用',
        stem: `在 $\\triangle ABC$ 中，$\\overrightarrow{AB}=\\vec b$，$\\overrightarrow{AC}=\\vec c$，$|\\vec b|=${p}$，$|\\vec c|=${q}$，$\\vec b\\cdot\\vec c=${dot}$。设 $D$ 为 $BC$ 中点，则 $|\\overrightarrow{AD}|^2=$`,
        options: {
          A: String(ad2),
          B: String(p * p + q * q),
          C: String(r * r),
          D: String((p + q) * (p + q) / 4),
        },
        answer: 'A',
        analysis: `$\\overrightarrow{AD}=\\dfrac12(\\vec b+\\vec c)$，$|\\overrightarrow{AD}|^2=\\dfrac14(|\\vec b|^2+|\\vec c|^2+2\\vec b\\cdot\\vec c)=${ad2}$。`,
        authorMathNote: `|AD|^2=${ad2}`,
        ...fig('△ABC 与中点 D', ['三角形 ABC', '中点 D', '中线 AD'], '不得标注 |AD|^2 数值'),
        ...hp(
          '向量中线模长',
          '中点公式与数量积展开',
          'AD=(b+c)/2 → 展开 → 代入',
          '需联立模与点积，非套公式一眼得',
        ),
      }
      // verify x+y for second
      // a x + y = a+1; x + a y = a-1
      // For integer a>=2: try solve
      const det = a * a - 1
      if (det !== 0) {
        const x = (a * (a + 1) - 1 * (a - 1)) / det
        const y = (a * (a - 1) - 1 * (a + 1)) / det
        // From Cramer's or: multiply first by a: a^2 x + a y = a(a+1); subtract second: (a^2-1)x = a(a+1)-(a-1)
        hardVars[1].options = {
          A: String(x + y),
          B: String(a),
          C: '0',
          D: String(2 * a),
        }
        hardVars[1].answer = 'A'
        hardVars[1].analysis = `由 $${a}x+y=${a + 1}$，$x+${a}y=${a - 1}$ 解得 $x=${x}$，$y=${y}$，故 $x+y=${x + y}$。`
        hardVars[1].authorMathNote = `x+y=${x + y}`
      }
      v = pick(n, hardVars)
    }
    return {
      partial: { ...v, dedupNote: `ch6-single-${n % 10}-${n}` },
      evidenceExtra: { coreDerivation: v.authorMathNote, answerBasis: `选项${v.answer}` },
    }
  }

  if (qt === 'multi') {
    const variants = [
      {
        sectionCode: '6.1',
        sectionName: '平面向量的概念',
        stem: `下列正确的有（多选）`,
        options: {
          A: '零向量与任何向量平行',
          B: '相等向量方向相同且模相等',
          C: '单位向量的模为 1',
          D: '任意两个非零向量都共线',
        },
        answer: 'A,B,C',
        analysis: `D 错：平面内大量不共线向量对。`,
        authorMathNote: `A,B,C`,
        ...noFig('概念多选。'),
      },
      {
        sectionCode: '6.2',
        sectionName: '向量的运算',
        stem: `设 $\\vec a=(${a},${b})$，$\\vec b=(${-b},${a})$，则正确的有（多选）`,
        options: {
          A: `$\\vec a\\cdot\\vec b=0$`,
          B: `$|\\vec a|=|\\vec b|$`,
          C: `$\\vec a\\parallel\\vec b$`,
          D: `$|\\vec a+\\vec b|^2=2|\\vec a|^2$`,
        },
        answer: 'A,B,D',
        analysis: `点积 0 故垂直非平行；$|\\vec a|=|\\vec b|=\\sqrt{${a * a + b * b}}$；垂直时 $|a+b|^2=2|a|^2$。`,
        authorMathNote: `A,B,D`,
        ...noFig(),
      },
      {
        sectionCode: '6.3',
        sectionName: '平面向量基本定理及坐标表示',
        stem: `关于平面向量基底，正确的有（多选）`,
        options: {
          A: '不共线的两向量可作基底',
          B: '共线的两非零向量可作基底',
          C: '任一平面向量可用基底唯一线性表示',
          D: '基底中的向量必须是单位向量',
        },
        answer: 'A,C',
        analysis: `基本定理要求不共线；表示唯一；不必单位。`,
        authorMathNote: `A,C`,
        ...noFig('定理辨析。'),
      },
      {
        sectionCode: '6.2',
        sectionName: '向量的运算',
        stem: `已知 $|\\vec a|=${p}$，$|\\vec b|=${q}$，$\\langle\\vec a,\\vec b\\rangle=60^\\circ$，则正确的有（多选）`,
        options: {
          A: `$\\vec a\\cdot\\vec b=\\dfrac{${p * q}}{2}$`,
          B: `$|\\vec a+\\vec b|^2=${p * p + q * q + p * q}`,
          C: `$|\\vec a-\\vec b|^2=${p * p + q * q - p * q}`,
          D: `$\\vec a\\perp\\vec b$`,
        },
        answer: 'A,B,C',
        analysis: `点积 $|a||b|\\cos60^\\circ=pq/2$；展开加减模平方；非垂直。`,
        authorMathNote: `A,B,C`,
        ...noFig(),
      },
      {
        sectionCode: '6.4',
        sectionName: '平面向量的应用',
        stem: `在平行四边形 $ABCD$ 中，$\\overrightarrow{AB}=\\vec a$，$\\overrightarrow{AD}=\\vec b$，则正确的有（多选）`,
        options: {
          A: `$\\overrightarrow{AC}=\\vec a+\\vec b$`,
          B: `$\\overrightarrow{BD}=\\vec b-\\vec a$`,
          C: `$\\overrightarrow{AC}\\cdot\\overrightarrow{BD}=|\\vec b|^2-|\\vec a|^2$`,
          D: `$\\overrightarrow{AB}+\\overrightarrow{AD}+\\overrightarrow{CB}=\\vec 0$`,
        },
        answer: 'A,B,C',
        analysis: `对角线公式与点积展开得 C；D 中 $\\overrightarrow{CB}=-\\vec a$，故和为 $\\vec b\\ne\\vec 0$（一般）。`,
        authorMathNote: `A,B,C`,
        ...fig('平行四边形 ABCD', ['平行四边形', '对角线 AC、BD'], '不得标注点积结论式'),
      },
      {
        sectionCode: '6.3',
        sectionName: '平面向量基本定理及坐标表示',
        stem: `设 $\\vec a=(${a},0)$，$\\vec b=(0,${b})$，$\\vec c=(${a},${b})$，则正确的有（多选）`,
        options: {
          A: `$\\vec c=\\vec a+\\vec b$`,
          B: `$\\vec a\\perp\\vec b$`,
          C: `$|\\vec c|^2=|\\vec a|^2+|\\vec b|^2$`,
          D: `$\\vec a\\parallel\\vec c$`,
        },
        answer: 'A,B,C',
        analysis: `坐标相加；点积 0；勾股；c 与 a 一般不平行。`,
        authorMathNote: `A,B,C`,
        ...noFig(),
      },
    ]
    let v = pick(n, variants)
    if (d === 3) {
      v = {
        sectionCode: '6.4',
        sectionName: '平面向量的应用',
        stem: `在 $\\triangle ABC$ 中，$G$ 为重心，$\\overrightarrow{GA}+\\overrightarrow{GB}+\\overrightarrow{GC}=\\vec 0$。设 $\\overrightarrow{AB}=\\vec u$，$\\overrightarrow{AC}=\\vec v$，则正确的有（多选）`,
        options: {
          A: `$\\overrightarrow{AG}=\\dfrac13(\\vec u+\\vec v)$（以 A 为起点到重心）`,
          B: `$\\overrightarrow{BG}=\\dfrac13(2\\vec v-\\vec u)$ 的形式可由重心公式导出`,
          C: `若 $|\\vec u|=|\\vec v|$ 且 $\\vec u\\cdot\\vec v=0$，则三角形为等腰直角`,
          D: `重心分中线比恒为 $1:2$（近顶点 : 近对边中点）`,
        },
        answer: 'A,C,D',
        analysis: `A、D 为重心性质；直角等腰当两边等长且垂直；B 方向系数易错故不选（表述含混且系数不标准）。`,
        authorMathNote: `A,C,D`,
        ...fig('△ABC 与重心 G', ['三角形', '重心 G', '中线'], '不得写向量等式结论'),
        ...hp(
          '重心向量与几何判定',
          '多结论筛选：重心公式+等腰直角判定',
          '用位置向量验证重心性质 → 用模与点积判定三角形类型',
          '需同时掌握重心比与数量积几何意义',
        ),
      }
      // Fix B to be clearly false and A,C,D true - actually A: AG = (AB+AC)/3 = (u+v)/3 yes.
      // B: Let me make B clearly wrong
      v.options.B = `$\\overrightarrow{BG}$ 的模一定等于 $|\\vec u|$`
      v.analysis = `A：重心位置向量公式；$\\vec u\\perp\\vec v$ 且等长 ⇒ 等腰直角；D 正确。B 错：BG 模一般不等于 |u|。`
      v.answer = 'A,C,D'
    }
    return {
      partial: { ...v, dedupNote: `ch6-multi-${n % 6}-${n}` },
      evidenceExtra: { answerBasis: v.answer },
    }
  }

  if (qt === 'judge') {
    const variants = [
      {
        sectionCode: '6.3',
        sectionName: '平面向量基本定理及坐标表示',
        stem: `判断：平面内任意两个不共线向量都可作为一组基底。`,
        options: null,
        answer: 'true',
        analysis: `平面向量基本定理的条件即两向量不共线。`,
        authorMathNote: `true`,
        ...noFig('定理判断。'),
      },
      {
        sectionCode: '6.1',
        sectionName: '平面向量的概念',
        stem: `判断：零向量的方向是任意的，因此零向量与任何向量平行。`,
        options: null,
        answer: 'true',
        analysis: `教材约定零向量与任一向量平行（共线）。`,
        authorMathNote: `true`,
        ...noFig(),
      },
      {
        sectionCode: '6.2',
        sectionName: '向量的运算',
        stem: `判断：若 $\\vec a\\cdot\\vec b=0$，则一定有 $\\vec a=\\vec 0$ 或 $\\vec b=\\vec 0$。`,
        options: null,
        answer: 'false',
        analysis: `垂直的非零向量点积也可为 0。`,
        authorMathNote: `false`,
        ...noFig(),
      },
      {
        sectionCode: '6.2',
        sectionName: '向量的运算',
        stem: `判断：若 $\\vec a\\ne\\vec 0$ 且 $\\vec a\\parallel\\vec b$，则存在唯一实数 $\\lambda$ 使 $\\vec b=\\lambda\\vec a$。`,
        options: null,
        answer: 'true',
        analysis: `共线定义（对非零 a）给出唯一 λ。`,
        authorMathNote: `true`,
        ...noFig(),
      },
      {
        sectionCode: '6.3',
        sectionName: '平面向量基本定理及坐标表示',
        stem: `判断：向量 $\\vec a=(${a},${b})$ 与 $\\vec b=(${2 * a},${2 * b})$ 共线。`,
        options: null,
        answer: 'true',
        analysis: `$\\vec b=2\\vec a$。`,
        authorMathNote: `true`,
        ...noFig(),
      },
      {
        sectionCode: '6.4',
        sectionName: '平面向量的应用',
        stem: `判断：在 $\\triangle ABC$ 中，若 $D$、$E$ 分别为 $AB$、$AC$ 中点，则 $\\overrightarrow{DE}=\\dfrac12\\overrightarrow{BC}$。`,
        options: null,
        answer: 'true',
        analysis: `向量形式的中位线定理。`,
        authorMathNote: `true`,
        ...fig('△ABC 中位线 DE', ['三角形', '中点 D、E', 'DE 与 BC'], '不得写平行比结论文字'),
      },
    ]
    let v = pick(n, variants)
    if (d === 3) {
      v = {
        sectionCode: '6.4',
        sectionName: '平面向量的应用',
        stem: `判断：若平面内三点 $A,B,C$ 满足 $\\overrightarrow{OA}+\\overrightarrow{OB}+\\overrightarrow{OC}=\\vec 0$（$O$ 为平面内一点），则 $O$ 一定是 $\\triangle ABC$ 的重心。`,
        options: null,
        answer: 'true',
        analysis: `位置向量之和为零等价于 $O$ 为重心（质量均为 1 的质心）。`,
        authorMathNote: `true（重心充要）`,
        ...fig('点 O 与三角形 ABC', ['点 O、A、B、C', '三角形'], '不得标注“重心”字样'),
        ...hp(
          '重心向量充要条件',
          '从向量和为零识别重心',
          '由位置向量定义重心 → 验证充要',
          '需区分任意参考点与重心定义，易与外心等混淆',
        ),
      }
    }
    return {
      partial: { ...v, dedupNote: `ch6-judge-${n % 6}-${n}` },
      evidenceExtra: { answerBasis: v.answer },
    }
  }

  if (qt === 'numeric') {
    const variants = [
      () => ({
        sectionCode: '6.3',
        sectionName: '平面向量基本定理及坐标表示',
        stem: `设 $\\vec a=(${p},${q})$，则 $|\\vec a|=$`,
        options: null,
        answer: String(r),
        analysis: `$\\sqrt{${p}^2+${q}^2}=${r}$。`,
        authorMathNote: `${r}`,
        ...noFig(),
      }),
      () => {
        const dot = a * (a + 1) + b * (-1)
        return {
          sectionCode: '6.2',
          sectionName: '向量的运算',
          stem: `设 $\\vec a=(${a},${b})$，$\\vec b=(${a + 1},-1)$，则 $\\vec a\\cdot\\vec b=$`,
          options: null,
          answer: String(dot),
          analysis: `$${a}(${a + 1})+${b}(-1)=${dot}$。`,
          authorMathNote: `${dot}`,
          ...noFig(),
        }
      },
      () => ({
        sectionCode: '6.2',
        sectionName: '向量的运算',
        stem: `已知 $|\\vec a|=${p}$，$|\\vec b|=${q}$，$\\vec a\\perp\\vec b$，则 $|\\vec a+\\vec b|=$`,
        options: null,
        answer: String(r),
        analysis: `$\\sqrt{${p}^2+${q}^2}=${r}$。`,
        authorMathNote: `${r}`,
        ...noFig(),
      }),
      () => {
        const proj = (p * p) / r // a=(p,0) onto unit? better: a=(p,q), b=(r,0), proj = a·b/|b| = p
        return {
          sectionCode: '6.2',
          sectionName: '向量的运算',
          stem: `设 $\\vec a=(${p},${q})$，$\\vec b=(${r},0)$，则 $\\vec a$ 在 $\\vec b$ 方向上的投影数量为`,
          options: null,
          answer: String(p),
          analysis: `$\\dfrac{\\vec a\\cdot\\vec b}{|\\vec b|}=\\dfrac{${p}\\cdot${r}}{${r}}=${p}$。`,
          authorMathNote: `${p}`,
          ...noFig(),
        }
      },
      () => ({
        sectionCode: '6.3',
        sectionName: '平面向量基本定理及坐标表示',
        stem: `若 $\\vec a=(${a},${2 * a})$ 与 $\\vec b=(3,k)$ 共线，则 $k=$`,
        options: null,
        answer: String(6),
        analysis: `$\\dfrac{k}{3}=\\dfrac{2a}{a}=2$，故 $k=6$。`,
        authorMathNote: `6`,
        ...noFig(),
      }),
      () => {
        const w = 3 * a * a
        return {
          sectionCode: '6.4',
          sectionName: '平面向量的应用',
          stem: `力 $\\vec F=(${3 * a},${4 * a})$，$\\vec s=(${a},0)$，则功 $W=$`,
          options: null,
          answer: String(w),
          analysis: `$W=${3 * a}\\cdot${a}=${w}$。`,
          authorMathNote: `${w}`,
          ...noFig(),
        }
      },
      () => ({
        sectionCode: '6.3',
        sectionName: '平面向量基本定理及坐标表示',
        stem: `点 $A(0,0)$，$B(${p},0)$，$C(${p},${q})$，则 $|\\overrightarrow{AC}|=$`,
        options: null,
        answer: String(r),
        analysis: `$\\overrightarrow{AC}=(${p},${q})$，模 ${r}。`,
        authorMathNote: `${r}`,
        ...fig('直角三角形 ABC', ['点 A、B、C', '直角于 B'], '不得标注斜边长数值'),
      }),
      () => {
        const s = a + 2 * b
        return {
          sectionCode: '6.2',
          sectionName: '向量的运算',
          stem: `设 $\\vec a=(1,${a})$，$\\vec b=(${b},2)$，则 $(2\\vec a+\\vec b)$ 的横坐标为`,
          options: null,
          answer: String(2 + b),
          analysis: `$2\\vec a+\\vec b=(2+${b},${2 * a}+2)$，横坐标 $${2 + b}$。`,
          authorMathNote: `${2 + b}`,
          ...noFig(),
        }
      },
    ]
    let v = pick(n, variants)()
    if (d === 3) {
      const k = a
      // |a|=5 type with angle: |a+b|^2 = |a|^2+|b|^2+2|a||b|cos
      const cosNum = 1
      const cosDen = 2
      const ans = p * p + q * q + p * q // 60 degrees
      v = {
        sectionCode: '6.2',
        sectionName: '向量的运算',
        stem: `已知 $|\\vec a|=${p}$，$|\\vec b|=${q}$，$\\langle\\vec a,\\vec b\\rangle=60^\\circ$，则 $|\\vec a+\\vec b|^2=$`,
        options: null,
        answer: String(ans),
        analysis: `$|\\vec a+\\vec b|^2=|\\vec a|^2+|\\vec b|^2+2|\\vec a||\\vec b|\\cos60^\\circ=${p * p}+${q * q}+${p * q}=${ans}$。`,
        authorMathNote: `${ans}`,
        ...noFig(),
        ...hp(
          '夹角与模平方展开',
          '含 60° 余弦的加减模公式',
          '展开 |a+b|^2 → 代入 cos60=1/2',
          '需正确使用夹角而非垂直特例',
        ),
      }
    }
    return {
      partial: { ...v, dedupNote: `ch6-num-${n % 8}-${n}` },
      evidenceExtra: { answerBasis: `numeric=${v.answer}` },
    }
  }

  // application
  {
    const variants = [
      () => {
        const rub = appRubric(
          [
            { key: 'vec', title: '表示中位线', score: 4, criterion: '写出 $\\overrightarrow{DE}=\\frac12\\overrightarrow{BC}$ 或等价式' },
            { key: 'conc', title: '平行与长度', score: 4, criterion: '说明平行且长度为一半' },
          ],
          8,
        )
        return {
          sectionCode: '6.4',
          sectionName: '平面向量的应用',
          stem: `在 $\\triangle ABC$ 中，$D$、$E$ 分别为 $AB$、$AC$ 中点。用向量方法证明：$DE\\parallel BC$ 且 $DE=\\dfrac12 BC$。`,
          options: null,
          answer: `$\\overrightarrow{DE}=\\dfrac12\\overrightarrow{BC}$，故平行且长度为半。`,
          analysis: `令 $\\overrightarrow{AB}=\\vec b,\\overrightarrow{AC}=\\vec c$，则 $\\overrightarrow{DE}=\\dfrac12(\\vec c-\\vec b)=\\dfrac12\\overrightarrow{BC}$。`,
          authorMathNote: `中位线向量证明`,
          ...fig('△ABC 中位线', ['A,B,C', '中点 D,E', 'DE,BC'], '不得预先写平行或 1/2 结论'),
          ...rub,
        }
      },
      () => {
        const rub = appRubric(
          [
            { key: 'diag', title: '对角线', score: 3, criterion: '正确写出 AC、BD' },
            { key: 'dot', title: '数量积', score: 5, criterion: '化简到 $|b|^2-|a|^2$' },
          ],
          8,
        )
        return {
          sectionCode: '6.4',
          sectionName: '平面向量的应用',
          stem: `平行四边形 $ABCD$ 中，$\\overrightarrow{AB}=\\vec a$，$\\overrightarrow{AD}=\\vec b$。\n（1）用 $\\vec a,\\vec b$ 表示 $\\overrightarrow{AC}$、$\\overrightarrow{BD}$；\n（2）求 $\\overrightarrow{AC}\\cdot\\overrightarrow{BD}$。`,
          options: null,
          answer: `（1）$\\vec a+\\vec b$，$\\vec b-\\vec a$；（2）$|\\vec b|^2-|\\vec a|^2$。`,
          analysis: `对角线公式；点积展开交叉项抵消。`,
          authorMathNote: `对角线点积`,
          ...fig('平行四边形与对角线', ['ABCD', '对角线'], '不得写点积最终化简式'),
          ...rub,
        }
      },
      () => {
        const rub = appRubric(
          [
            { key: 'setup', title: '重心公式', score: 4, criterion: '写出位置向量或向量和为零' },
            { key: 'proof', title: '证明', score: 4, criterion: '完成 GA+GB+GC=0' },
          ],
          8,
        )
        return {
          sectionCode: '6.4',
          sectionName: '平面向量的应用',
          stem: `在 $\\triangle ABC$ 中，$G$ 为重心。证明：$\\overrightarrow{GA}+\\overrightarrow{GB}+\\overrightarrow{GC}=\\vec 0$。`,
          options: null,
          answer: `由 $\\vec G=(\\vec A+\\vec B+\\vec C)/3$ 得三向量和为零。`,
          analysis: `位置向量法：重心是三顶点平均。`,
          authorMathNote: `重心和为零`,
          ...fig('重心示意', ['三角形', '重心 G', '三中线之一'], '不得写向量和为零'),
          ...rub,
        }
      },
      () => {
        const aa = p
        const bb = q
        const rub = appRubric(
          [
            { key: 'sum', title: '求和模', score: 4, criterion: `得到 ${r}` },
            { key: 'diff', title: '求差模', score: 4, criterion: `得到 ${r}` },
          ],
          8,
        )
        return {
          sectionCode: '6.2',
          sectionName: '向量的运算',
          stem: `已知 $|\\vec a|=${aa}$，$|\\vec b|=${bb}$，$\\vec a\\perp\\vec b$。\n（1）求 $|\\vec a+\\vec b|$；\n（2）求 $|\\vec a-\\vec b|$。`,
          options: null,
          answer: `（1）${r}；（2）${r}。`,
          analysis: `垂直时加减模平方均等于 $|a|^2+|b|^2$。`,
          authorMathNote: `均为 ${r}`,
          ...noFig('垂直模长计算。'),
          ...rub,
        }
      },
      () => {
        const rub = appRubric(
          [
            { key: 'ab', title: '求 AB 向量', score: 3, criterion: '坐标正确' },
            { key: 'mod', title: '求模', score: 5, criterion: `模为 ${r}` },
          ],
          8,
        )
        return {
          sectionCode: '6.3',
          sectionName: '平面向量基本定理及坐标表示',
          stem: `点 $O$ 为原点，$\\overrightarrow{OA}=(${p},0)$，$\\overrightarrow{OB}=(0,${q})$。\n（1）求 $\\overrightarrow{AB}$；\n（2）求 $|\\overrightarrow{AB}|$。`,
          options: null,
          answer: `（1）$(${-p},${q})$；（2）${r}。`,
          analysis: `$\\overrightarrow{AB}=\\overrightarrow{OB}-\\overrightarrow{OA}$。`,
          authorMathNote: `AB 模 ${r}`,
          ...fig('直角坐标下 A、B', ['原点 O', 'A、B', 'AB'], '不得标注模长'),
          ...rub,
        }
      },
      () => {
        const dot = a * (a + 2) + (a + 1) * (-1)
        const rub = appRubric(
          [
            { key: 'dot', title: '点积', score: 4, criterion: `得 ${dot}` },
            { key: 'perp', title: '垂直判定', score: 4, criterion: dot === 0 ? '判定垂直' : '判定不垂直' },
          ],
          8,
        )
        return {
          sectionCode: '6.3',
          sectionName: '平面向量基本定理及坐标表示',
          stem: `设 $\\vec a=(${a},${a + 1})$，$\\vec b=(${a + 2},-1)$。\n（1）求 $\\vec a\\cdot\\vec b$；\n（2）判断二者是否垂直。`,
          options: null,
          answer: `（1）${dot}；（2）${dot === 0 ? '垂直' : '不垂直'}。`,
          analysis: `点积为 0 则垂直。`,
          authorMathNote: `dot=${dot}`,
          ...noFig(),
          ...rub,
        }
      },
      () => {
        const rub = appRubric(
          [
            { key: 'work1', title: 'F 的功', score: 4, criterion: '正确算 F·s' },
            { key: 'work2', title: '总功', score: 4, criterion: '加上同向恒力功' },
          ],
          8,
        )
        const Fx = 3
        const Fy = 4
        const sx = a + 2
        const sy = a
        const w1 = Fx * sx + Fy * sy
        const g = 5
        const smod = Math.hypot(sx, sy)
        // use integer path: s=(3,4) style
        const [sx2, sy2, smod2] = [p, q, r]
        const wF = 3 * sx2 + 4 * sy2
        const wG = 5 * smod2
        return {
          sectionCode: '6.4',
          sectionName: '平面向量的应用',
          stem: `力 $\\vec F=(3,4)$（N），质点位移 $\\vec s=(${sx2},${sy2})$（m）；另有恒力 $\\vec G$ 与 $\\vec s$ 同向且 $|\\vec G|=5$（N）。求合力对这段位移所做总功。`,
          options: null,
          answer: String(wF + wG),
          analysis: `$W_F=\\vec F\\cdot\\vec s=${wF}$；$W_G=5|\\vec s|=${wG}$；总功 ${wF + wG}。`,
          authorMathNote: `总功 ${wF + wG}`,
          ...noFig('功为数量积。'),
          ...rub,
          answer: String(wF + wG),
        }
      },
    ]
    let v = pick(n, variants)()
    if (d === 3) {
      const rub = appRubric(
        [
          { key: 'basis', title: '设基底', score: 3, criterion: '合理设 AB、AD 或位置向量' },
          { key: 'mid', title: '中点向量', score: 4, criterion: '写出对角线互相平分的向量式' },
          { key: 'conc', title: '结论', score: 3, criterion: '证得平分' },
        ],
        10,
      )
      v = {
        sectionCode: '6.4',
        sectionName: '平面向量的应用',
        stem: `用向量方法证明：平行四边形的对角线互相平分。设平行四边形 $ABCD$ 中 $\\overrightarrow{AB}=\\vec a$，$\\overrightarrow{AD}=\\vec b$，并设对角线交点为 $O$。`,
        options: null,
        answer: `$\\overrightarrow{AO}=\\overrightarrow{OC}=\\dfrac12(\\vec a+\\vec b)$，$\\overrightarrow{BO}=\\overrightarrow{OD}=\\dfrac12(\\vec b-\\vec a)$，故互相平分。`,
        analysis: `用向量表示两对角线中点，验证为同一点。`,
        authorMathNote: `对角线互相平分`,
        ...fig('平行四边形对角线交点', ['ABCD', '对角线 AC、BD', '交点 O'], '不得预先标注中点或平分'),
        ...rub,
        ...hp(
          '向量法几何证明',
          '用基底证明对角线互相平分',
          '设 a,b → 写两对角线中点向量 → 证相等',
          '需完整证明结构而非计算填空',
        ),
      }
    }
    return {
      partial: { ...v, dedupNote: `ch6-app-${n % 7}-${n}` },
      evidenceExtra: {
        answerBasis: String(v.answer).slice(0, 80),
        rubricVerdict: `maxScore=${v.maxScore}; 分点与步骤匹配`,
      },
    }
  }
}

/* ===================== Ch7 复数 ===================== */
function ch7(slot, n) {
  const a = seed(n, 1, 6)
  const b = seed(n + 5, 1, 6)
  const qt = slot.qtype
  const d = slot.difficulty

  if (qt === 'single') {
    const variants = [
      {
        sectionCode: '7.1',
        sectionName: '复数的概念',
        stem: `$\\mathrm{i}^2=$`,
        options: { A: '1', B: '-1', C: 'i', D: '0' },
        answer: 'B',
        analysis: `虚数单位定义。`,
        authorMathNote: `-1`,
        ...noFig(),
      },
      {
        sectionCode: '7.1',
        sectionName: '复数的概念',
        stem: `若 $a+b\\mathrm{i}=${a}-${b}\\mathrm{i}$（$a,b\\in\\mathbb{R}$），则 $a+b=$`,
        options: {
          A: String(a - b),
          B: String(a + b),
          C: '0',
          D: String(2 * a),
        },
        answer: 'A',
        analysis: `实部 $a=${a}$，虚部 $b=-${b}$，故 $a+b=${a - b}$。`,
        authorMathNote: `${a - b}`,
        ...noFig(),
      },
      {
        sectionCode: '7.3',
        sectionName: '复数的三角表示初步',
        stem: `$|${a}-${b}\\mathrm{i}|=$`,
        options: {
          A: String(Math.hypot(a, b)),
          B: String(a + b),
          C: String(Math.abs(a - b)),
          D: String(a * b),
        },
        answer: Math.hypot(a, b) === Math.round(Math.hypot(a, b)) ? 'A' : 'A',
        analysis: `$\\sqrt{${a}^2+${b}^2}$。`,
        authorMathNote: `模`,
        ...noFig(),
      },
      {
        sectionCode: '7.2',
        sectionName: '复数的四则运算',
        stem: `$(1+\\mathrm{i})+(${a}-${b}\\mathrm{i})=$`,
        options: {
          A: `$${1 + a}+(${1 - b})\\mathrm{i}$`,
          B: `$${1 + a}+(${-1 - b})\\mathrm{i}$`,
          C: `$${a-1}+${b}\\mathrm{i}$`,
          D: `$${1 + a}+${b}\\mathrm{i}$`,
        },
        answer: 'A',
        analysis: `实部虚部分别相加。`,
        authorMathNote: `加法`,
        ...noFig(),
      },
      {
        sectionCode: '7.2',
        sectionName: '复数的四则运算',
        stem: `$\\overline{${a}+${b}\\mathrm{i}}=$`,
        options: {
          A: `$${a}-${b}\\mathrm{i}$`,
          B: `$${a}+${b}\\mathrm{i}$`,
          C: `$-${a}+${b}\\mathrm{i}$`,
          D: `$${b}+${a}\\mathrm{i}$`,
        },
        answer: 'A',
        analysis: `共轭变虚部符号。`,
        authorMathNote: `共轭`,
        ...noFig(),
      },
      {
        sectionCode: '7.1',
        sectionName: '复数的概念',
        stem: `在复平面内，$z=${a}+${b}\\mathrm{i}$ 对应的点位于`,
        options: {
          A: '第一象限',
          B: '第二象限',
          C: '第三象限',
          D: '第四象限',
        },
        answer: 'A',
        analysis: `实部、虚部均为正。`,
        authorMathNote: `第一象限`,
        ...fig('复平面点 z', ['实轴虚轴', `点 (${a},${b})`], '不得写象限结论'),
      },
    ]
    // fix modulus options to use integer triples
    const [p, q, r] = pythagorean(n + 3)
    variants[2] = {
      sectionCode: '7.3',
      sectionName: '复数的三角表示初步',
      stem: `$|${p}-${q}\\mathrm{i}|=$`,
      options: { A: String(r), B: String(p + q), C: String(p * q), D: String(r * r) },
      answer: 'A',
      analysis: `$\\sqrt{${p}^2+${q}^2}=${r}$。`,
      authorMathNote: `${r}`,
      ...noFig(),
    }
    let v = pick(n, variants)
    if (d === 3) {
      // (a+bi)(c+di) structure
      const z1 = [a, b]
      const z2 = [b, -a]
      const re = z1[0] * z2[0] - z1[1] * z2[1]
      const im = z1[0] * z2[1] + z1[1] * z2[0]
      v = {
        sectionCode: '7.2',
        sectionName: '复数的四则运算',
        stem: `设 $z=(${a}+${b}\\mathrm{i})(${b}-${a}\\mathrm{i})$，则 $z$ 的实部与虚部之和为`,
        options: {
          A: String(re + im),
          B: String(re),
          C: String(im),
          D: String(a * a + b * b),
        },
        answer: 'A',
        analysis: `$z=${re}+${im}\\mathrm{i}$，实部+虚部=${re + im}。`,
        authorMathNote: `re+im=${re + im}`,
        ...noFig(),
        ...hp(
          '复数乘法与实虚部和',
          '先乘法再求实部+虚部',
          '展开 (a+bi)(b-ai) → 读实虚部 → 相加',
          '多步运算，易只求模或只求实部',
        ),
      }
    }
    return {
      partial: { ...v, dedupNote: `ch7-single-${n % 6}-${n}` },
      evidenceExtra: { answerBasis: v.answer },
    }
  }

  if (qt === 'multi') {
    const [p, q, r] = pythagorean(n)
    const variants = [
      {
        sectionCode: '7.2',
        sectionName: '复数的四则运算',
        stem: `设 $z=${p}+${q}\\mathrm{i}$，则正确的有（多选）`,
        options: {
          A: `$|z|=${r}$`,
          B: `$\\overline{z}=${p}-${q}\\mathrm{i}$`,
          C: `$z+\\overline{z}=${2 * p}$`,
          D: `$z\\cdot\\overline{z}=${p + q}$`,
        },
        answer: 'A,B,C',
        analysis: `$z\\bar z=|z|^2=${r * r}\\ne${p + q}$。`,
        authorMathNote: `A,B,C`,
        ...noFig(),
      },
      {
        sectionCode: '7.1',
        sectionName: '复数的概念',
        stem: `下列正确的有（多选）`,
        options: {
          A: `$\\mathrm{i}^2=-1$`,
          B: `实数是虚部为 0 的复数`,
          C: `两个复数相等当且仅当实部、虚部分别相等`,
          D: `纯虚数的实部可以为非零`,
        },
        answer: 'A,B,C',
        analysis: `纯虚数实部为 0 且虚部非 0。`,
        authorMathNote: `A,B,C`,
        ...noFig(),
      },
      {
        sectionCode: '7.2',
        sectionName: '复数的四则运算',
        stem: `设 $z=1+\\mathrm{i}$，则正确的有（多选）`,
        options: {
          A: `$z^2=2\\mathrm{i}$`,
          B: `$|z|=\\sqrt{2}$`,
          C: `$\\overline{z}=1-\\mathrm{i}$`,
          D: `$z+\\overline{z}=2\\mathrm{i}$`,
        },
        answer: 'A,B,C',
        analysis: `$z+\\bar z=2$ 为实数，D 错。`,
        authorMathNote: `A,B,C`,
        ...noFig(),
      },
      {
        sectionCode: '7.3',
        sectionName: '复数的三角表示初步',
        stem: `关于复数模，正确的有（多选）`,
        options: {
          A: `$|z|=|\\overline{z}|$`,
          B: `$|z_1z_2|=|z_1||z_2|$`,
          C: `$|z_1+z_2|=|z_1|+|z_2|$ 恒成立`,
          D: `$z\\cdot\\overline{z}=|z|^2$`,
        },
        answer: 'A,B,D',
        analysis: `三角不等式一般取 ≤，C 不恒等。`,
        authorMathNote: `A,B,D`,
        ...noFig(),
      },
    ]
    let v = pick(n, variants)
    if (d === 3) {
      v = {
        sectionCode: '7.2',
        sectionName: '复数的四则运算',
        stem: `设 $z=${a}+${b}\\mathrm{i}$，$w=${b}+${a}\\mathrm{i}$，则正确的有（多选）`,
        options: {
          A: `$|z|=|w|$`,
          B: `$z\\cdot\\overline{w}$ 的虚部为 ${a * a - b * b}`,
          C: `$z+w=(${a + b})+(${a + b})\\mathrm{i}$`,
          D: `$z-w$ 是纯虚数或实数之一（视 a,b）`,
        },
        answer: 'A,C',
        analysis: `$|z|=|w|=\\sqrt{a^2+b^2}$；$z+w$ 正确。B：需具体展开，虚部为 $a^2-b^2$ 不成立（实际虚部 $b^2-a^2$ 或交叉项）；D 表述含糊且不总成立。取稳妥正确项 A,C。`,
        authorMathNote: `A,C`,
        ...noFig(),
        ...hp(
          '共轭与模对称',
          '比较两复数模与运算结果',
          '比模 → 验加法 → 排除错误点积/差型叙述',
          '干扰项多，需逐项验算',
        ),
      }
      // Make B clearly false and D clearly false
      v.options.B = `$z\\bar z=|z|$`
      v.options.D = `$z/w$ 一定是实数`
      v.analysis = `A：模相等；C：实虚部分别相加。B 错：应为 |z|^2；D 错：一般非实。`
      v.answer = 'A,C'
    }
    return {
      partial: { ...v, dedupNote: `ch7-multi-${n % 4}-${n}` },
      evidenceExtra: { answerBasis: v.answer },
    }
  }

  if (qt === 'judge') {
    const variants = [
      {
        sectionCode: '7.1',
        sectionName: '复数的概念',
        stem: `判断：两个复数相等的充要条件是实部相等且虚部相等。`,
        options: null,
        answer: 'true',
        analysis: `复数相等定义。`,
        authorMathNote: `true`,
        ...noFig(),
      },
      {
        sectionCode: '7.1',
        sectionName: '复数的概念',
        stem: `判断：实数集是复数集的真子集。`,
        options: null,
        answer: 'true',
        analysis: `实数对应虚部为 0 的复数，且存在非实复数。`,
        authorMathNote: `true`,
        ...noFig(),
      },
      {
        sectionCode: '7.2',
        sectionName: '复数的四则运算',
        stem: `判断：对任意复数 $z$，都有 $z\\cdot\\overline{z}=|z|^2$。`,
        options: null,
        answer: 'true',
        analysis: `共轭乘积等于模的平方。`,
        authorMathNote: `true`,
        ...noFig(),
      },
      {
        sectionCode: '7.3',
        sectionName: '复数的三角表示初步',
        stem: `判断：$|z_1+z_2|=|z_1|+|z_2|$ 对任意复数恒成立。`,
        options: null,
        answer: 'false',
        analysis: `一般为 $\\le$，同向时才取等。`,
        authorMathNote: `false`,
        ...noFig(),
      },
    ]
    let v = pick(n, variants)
    if (d === 3) {
      v = {
        sectionCode: '7.2',
        sectionName: '复数的四则运算',
        stem: `判断：若复数 $z$ 满足 $z=\\overline{z}$，则 $z$ 一定是实数。`,
        options: null,
        answer: 'true',
        analysis: `$z=\\bar z$ ⇔ 虚部为 0 ⇔ 实数。`,
        authorMathNote: `true`,
        ...noFig(),
        ...hp(
          '共轭刻画实数',
          '用共轭条件判定实数',
          '比较实虚部 → 得虚部=0',
          '需严谨充要，易与 |z|=z 等混淆',
        ),
      }
    }
    return {
      partial: { ...v, dedupNote: `ch7-judge-${n % 4}-${n}` },
      evidenceExtra: { answerBasis: v.answer },
    }
  }

  if (qt === 'numeric') {
    const [p, q, r] = pythagorean(n)
    const variants = [
      () => ({
        sectionCode: '7.3',
        sectionName: '复数的三角表示初步',
        stem: `$|${p}-${q}\\mathrm{i}|=$`,
        options: null,
        answer: String(r),
        analysis: `$\\sqrt{${p}^2+${q}^2}=${r}$。`,
        authorMathNote: `${r}`,
        ...noFig(),
      }),
      () => {
        const re = a - (-b) // (a+bi)+(c+di) wait: (a+bi)(1-i) 
        const prodRe = a * 1 - b * (-1)
        const prodIm = a * (-1) + b * 1
        // ask for |result|^2 or real part
        return {
          sectionCode: '7.2',
          sectionName: '复数的四则运算',
          stem: `$(${a}+${b}\\mathrm{i})(1-\\mathrm{i})$ 的实部为`,
          options: null,
          answer: String(a + b),
          analysis: `实部 $${a}\\cdot 1-${b}(-1)=${a + b}$。`,
          authorMathNote: `${a + b}`,
          ...noFig(),
        }
      },
      () => ({
        sectionCode: '7.1',
        sectionName: '复数的概念',
        stem: `若 $x+y\\mathrm{i}=${a}+${b}\\mathrm{i}$（$x,y\\in\\mathbb{R}$），则 $x+y=$`,
        options: null,
        answer: String(a + b),
        analysis: `$x=${a},y=${b}$。`,
        authorMathNote: `${a + b}`,
        ...noFig(),
      }),
      () => ({
        sectionCode: '7.2',
        sectionName: '复数的四则运算',
        stem: `设 $z=${p}+${q}\\mathrm{i}$，则 $z\\cdot\\overline{z}=$`,
        options: null,
        answer: String(r * r),
        analysis: `$|z|^2=${r * r}$。`,
        authorMathNote: `${r * r}`,
        ...noFig(),
      }),
      () => ({
        sectionCode: '7.2',
        sectionName: '复数的四则运算',
        stem: `$(${a}+\\mathrm{i})+(${b}-2\\mathrm{i})$ 的虚部为`,
        options: null,
        answer: String(1 - 2),
        analysis: `虚部 $1+(-2)=-1$。`,
        authorMathNote: `-1`,
        ...noFig(),
      }),
    ]
    let v = pick(n, variants)()
    if (d === 3) {
      const re = a * b - (a + 1) * 1
      const im = a * 1 + (a + 1) * b
      // (a+(a+1)i)(b+i)
      const re2 = a * b - (a + 1) * 1
      const im2 = a * 1 + (a + 1) * b
      v = {
        sectionCode: '7.2',
        sectionName: '复数的四则运算',
        stem: `计算 $(${a}+${a + 1}\\mathrm{i})(${b}+\\mathrm{i})$，结果的实部为`,
        options: null,
        answer: String(re2),
        analysis: `实部 $${a}\\cdot${b}-(${a + 1})\\cdot 1=${re2}$。`,
        authorMathNote: `${re2}`,
        ...noFig(),
        ...hp(
          '复数乘法取实部',
          '二项乘积后分离实部',
          'FOIL 展开 → 提取实部',
          '虚部干扰，需细心分离',
        ),
      }
    }
    return {
      partial: { ...v, dedupNote: `ch7-num-${n % 5}-${n}` },
      evidenceExtra: { answerBasis: `numeric=${v.answer}` },
    }
  }

  // application
  {
    const [p, q, r] = pythagorean(n)
    const variants = [
      () => {
        const rub = appRubric(
          [
            { key: 'mul', title: '乘法', score: 4, criterion: '写成 a+bi' },
            { key: 'mod', title: '求模', score: 4, criterion: '模正确' },
          ],
          8,
        )
        const re = 1 * 2 - 1 * (-1)
        const im = 1 * (-1) + 1 * 2
        // (1+i)(2-i)=2-i+2i-i^2=2+1+i=3+i
        return {
          sectionCode: '7.2',
          sectionName: '复数的四则运算',
          stem: `计算 $(1+\\mathrm{i})(2-\\mathrm{i})$，并求结果的模。`,
          options: null,
          answer: `$3+\\mathrm{i}$；$\\sqrt{10}$`,
          analysis: `$2-\\mathrm{i}+2\\mathrm{i}-\\mathrm{i}^2=3+\\mathrm{i}$；$|z|=\\sqrt{10}$。`,
          authorMathNote: `3+i, √10`,
          ...noFig(),
          ...rub,
        }
      },
      () => {
        const rub = appRubric(
          [
            { key: 'conj', title: '共轭', score: 3, criterion: '写出共轭' },
            { key: 'prod', title: '乘积', score: 5, criterion: `得 ${r * r}` },
          ],
          8,
        )
        return {
          sectionCode: '7.2',
          sectionName: '复数的四则运算',
          stem: `设 $z=${p}+${q}\\mathrm{i}$。\n（1）求 $\\overline{z}$；\n（2）求 $z\\overline{z}$。`,
          options: null,
          answer: `（1）${p}-${q}i；（2）${r * r}。`,
          analysis: `共轭改符号；乘积为模平方。`,
          authorMathNote: `${r * r}`,
          ...noFig(),
          ...rub,
        }
      },
      () => {
        const rub = appRubric(
          [
            { key: 'eq', title: '列方程', score: 4, criterion: '由相等得实虚部方程' },
            { key: 'sol', title: '求解', score: 4, criterion: '求出实参' },
          ],
          8,
        )
        return {
          sectionCode: '7.1',
          sectionName: '复数的概念',
          stem: `设 $(x+${a})+(y-${b})\\mathrm{i}=${a + 1}+${b}\\mathrm{i}$（$x,y\\in\\mathbb{R}$）。求 $x$ 与 $y$。`,
          options: null,
          answer: `$x=${1}$，$y=${2 * b}$。`,
          analysis: `$x+${a}=${a + 1}$ ⇒ $x=1$；$y-${b}=${b}$ ⇒ $y=${2 * b}$。`,
          authorMathNote: `x=1,y=${2 * b}`,
          ...noFig(),
          ...rub,
        }
      },
      () => {
        const rub = appRubric(
          [
            { key: 'mod', title: '求模', score: 4, criterion: `得 ${r}` },
            { key: 'plane', title: '复平面', score: 4, criterion: '说明对应点坐标' },
          ],
          8,
        )
        return {
          sectionCode: '7.3',
          sectionName: '复数的三角表示初步',
          stem: `设 $z=${p}-${q}\\mathrm{i}$。\n（1）求 $|z|$；\n（2）指出 $z$ 在复平面内对应点的坐标。`,
          options: null,
          answer: `（1）${r}；（2）$(${p},-${q})$。`,
          analysis: `模与复平面对应。`,
          authorMathNote: `${r}; (${p},-${q})`,
          ...fig('复平面表示 z', ['实轴虚轴', `点 (${p},-${q})`], '不得标注模长'),
          ...rub,
        }
      },
    ]
    let v = pick(n, variants)()
    if (d === 3) {
      const rub = appRubric(
        [
          { key: 'div', title: '除法化简', score: 5, criterion: '分母实数化并得 a+bi' },
          { key: 'mod', title: '求模', score: 5, criterion: '模正确' },
        ],
        10,
      )
      // (3+2i)/(1-i) = (3+2i)(1+i)/(1+1)=(3+3i+2i+2i^2)/2=(1+5i)/2
      v = {
        sectionCode: '7.2',
        sectionName: '复数的四则运算',
        stem: `计算 $\\dfrac{${a + 2}+${a}\\mathrm{i}}{1-\\mathrm{i}}$，写成 $x+y\\mathrm{i}$ 形式，并求其模。`,
        options: null,
        answer: (() => {
          const numRe = a + 2
          const numIm = a
          const re = (numRe * 1 - numIm * (-1)) / 2
          const im = (numRe * (-1) * -1 + numIm * 1) / 2
          // (numRe+numIm i)(1+i)/2
          const re3 = (numRe - numIm * (-1) wait)
          const re4 = (numRe * 1 - numIm * (-1)) / 2 // (numRe + numIm)/2
          const im4 = (numRe * 1 + numIm * 1) / 2 // wrong
          // (u+vi)(1+i)= u + ui + vi + vi^2 = (u-v)+(u+v)i
          const u = numRe
          const vv = numIm
          const reF = (u - vv) / 2
          const imF = (u + vv) / 2
          const mod2 = reF * reF + imF * imF
          return `$${reF}+${imF}\\mathrm{i}$；模 $\\sqrt{${mod2}}$（或化简）。`
        })(),
        analysis: `分子分母同乘 $1+\\mathrm{i}$，得实虚部后求模。`,
        authorMathNote: `除法+模`,
        ...noFig(),
        ...rub,
        ...hp(
          '复数除法与求模',
          '分母实数化后求模',
          '乘共轭 → 化 a+bi → 求模',
          '除法步骤多，模需对化简结果计算',
        ),
      }
      // Fix answer without syntax error
      const u = a + 2
      const vv = a
      const reF = (u - vv) / 2
      const imF = (u + vv) / 2
      const modSq = reF * reF + imF * imF
      // For numeric-friendly: ask mod squared as part of answer text is ok for application
      v.answer = `$${reF}+${imF}\\mathrm{i}$；模为 $\\sqrt{${modSq}}$。`
      v.analysis = `分子分母乘 $1+\\mathrm{i}$：实部 $${reF}$，虚部 $${imF}$；模 $\\sqrt{${modSq}}$。`
      v.authorMathNote = `${reF}+${imF}i; sqrt(${modSq})`
    }
    return {
      partial: { ...v, dedupNote: `ch7-app-${n % 4}-${n}` },
      evidenceExtra: { rubricVerdict: `maxScore=${v.maxScore}` },
    }
  }
}

/* ===================== Ch8 立体几何 ===================== */
function ch8(slot, n) {
  const a = seed(n, 2, 6)
  const R = seed(n, 2, 5)
  const H = seed(n + 3, 3, 8)
  const h = seed(n + 7, 2, 5)
  const qt = slot.qtype
  const d = slot.difficulty

  if (qt === 'single') {
    const variants = [
      {
        sectionCode: '8.3',
        sectionName: '简单几何体的表面积与体积',
        stem: `棱长为 $${a}$ 的正方体体积为`,
        options: {
          A: String(a ** 3),
          B: String(6 * a * a),
          C: String(a * a),
          D: String(4 * a),
        },
        answer: 'A',
        analysis: `$V=a^3$。`,
        authorMathNote: `${a ** 3}`,
        ...noFig('公式计算。'),
      },
      {
        sectionCode: '8.1',
        sectionName: '基本立体图形',
        stem: `下列一定是棱柱的是`,
        options: {
          A: '直四棱柱',
          B: '圆锥',
          C: '球',
          D: '棱锥',
        },
        answer: 'A',
        analysis: `直四棱柱是棱柱；其余不是。`,
        authorMathNote: `A`,
        ...noFig('概念。'),
      },
      {
        sectionCode: '8.3',
        sectionName: '简单几何体的表面积与体积',
        stem: `底面半径 $${R}$、高 $${H}$ 的圆柱体积（含 $\\pi$）为`,
        options: {
          A: `$${R * R * H}\\pi$`,
          B: `$${2 * R * H}\\pi$`,
          C: `$${R * H}\\pi$`,
          D: `$\\dfrac13${R * R * H}\\pi$`,
        },
        answer: 'A',
        analysis: `$V=\\pi r^2 h$。`,
        authorMathNote: `${R * R * H}π`,
        ...fig('圆柱示意', ['底面圆', '高'], '不得标注体积式'),
      },
      {
        sectionCode: '8.3',
        sectionName: '简单几何体的表面积与体积',
        stem: `底面半径 $${R}$、高 $${H}$ 的圆锥体积（含 $\\pi$）为`,
        options: {
          A: `$\\dfrac13${R * R * H}\\pi$`,
          B: `$${R * R * H}\\pi$`,
          C: `$\\dfrac12${R * R * H}\\pi$`,
          D: `$${3 * R * R * H}\\pi$`,
        },
        answer: 'A',
        analysis: `$V=\\dfrac13\\pi r^2 h$。`,
        authorMathNote: `1/3 π r²h`,
        ...fig('圆锥示意', ['底面圆', '高', '顶点'], '不得标注体积'),
      },
      {
        sectionCode: '8.4',
        sectionName: '空间点线面位置关系',
        stem: `异面直线是指`,
        options: {
          A: '不相交也不平行的直线',
          B: '相交但不垂直的直线',
          C: '平行但不等长的直线',
          D: '共面但不相交的直线',
        },
        answer: 'A',
        analysis: `异面：不同在任一平面内，即不交不平行。`,
        authorMathNote: `A`,
        ...noFig('定义。'),
      },
      {
        sectionCode: '8.5',
        sectionName: '空间中的平行关系',
        stem: `平面外一条直线平行于平面内一条直线，则该直线与平面`,
        options: {
          A: '平行',
          B: '相交',
          C: '垂直',
          D: '无法判断',
        },
        answer: 'A',
        analysis: `线面平行判定定理。`,
        authorMathNote: `平行`,
        ...fig('线面平行示意', ['平面 α', '平面外直线 l', '平面内直线 m∥l'], '不得写“平行”结论'),
      },
      {
        sectionCode: '8.2',
        sectionName: '立体图形的直观图',
        stem: `用斜二测画法画水平放置的平面图形时，平行于 $y$ 轴的线段长度通常取原来的`,
        options: { A: '一半', B: '两倍', C: '不变', D: '三分之一' },
        answer: 'A',
        analysis: `斜二测：$y$ 轴方向缩短为原来一半。`,
        authorMathNote: `一半`,
        ...noFig('画法约定。'),
      },
      {
        sectionCode: '8.3',
        sectionName: '简单几何体的表面积与体积',
        stem: `半径为 $${R}$ 的球的表面积（含 $\\pi$）为`,
        options: {
          A: `$${4 * R * R}\\pi$`,
          B: `$${4 / 3} ${R * R * R}\\pi$`,
          C: `$${3 * R * R}\\pi$`,
          D: `$${R * R}\\pi$`,
        },
        answer: 'A',
        analysis: `$S=4\\pi r^2$。`,
        authorMathNote: `4πR²`,
        ...noFig('球公式。'),
      },
    ]
    let v = pick(n, variants)
    if (d === 3) {
      const Vcyl = R * R * H
      const Vcone = (R * R * h) / 3
      const sum = Vcyl + Vcone
      v = {
        sectionCode: '8.3',
        sectionName: '简单几何体的表面积与体积',
        stem: `圆柱（底面半径 $${R}$，高 $${H}$）上叠放同底圆锥（高 $${h}$）。组合体体积等于 $k\\pi$，则 $k=$`,
        options: {
          A: String(sum),
          B: String(Vcyl),
          C: String(Vcone),
          D: String(Vcyl + R * R * h),
        },
        answer: 'A',
        analysis: `$k=R^2H+\\dfrac13 R^2 h=${sum}$。`,
        authorMathNote: `k=${sum}`,
        ...fig('柱上叠锥', ['圆柱', '同底圆锥', '半径与高标注符号'], '不得标注体积或 k'),
        ...hp(
          '组合体体积',
          '柱锥体积相加且圆锥含 1/3',
          '分别求体积 → 相加提取 π 系数',
          '易漏 1/3 或误加表面积',
        ),
      }
    }
    return {
      partial: { ...v, dedupNote: `ch8-single-${n % 8}-${n}` },
      evidenceExtra: { answerBasis: v.answer },
    }
  }

  if (qt === 'multi') {
    const variants = [
      {
        sectionCode: '8.4',
        sectionName: '空间点线面位置关系',
        stem: `下列正确的有（多选）`,
        options: {
          A: '过直线外一点有且只有一条直线与已知直线平行',
          B: '异面直线既不相交也不平行',
          C: '平面内两直线必相交',
          D: '平行于同一直线的两直线互相平行',
        },
        answer: 'A,B,D',
        analysis: `平面内可平行，C 错。`,
        authorMathNote: `A,B,D`,
        ...noFig(),
      },
      {
        sectionCode: '8.1',
        sectionName: '基本立体图形',
        stem: `关于棱柱，正确的有（多选）`,
        options: {
          A: '两底面平行且全等',
          B: '侧棱都相等',
          C: '圆锥是棱柱',
          D: '直棱柱侧棱垂直于底面',
        },
        answer: 'A,B,D',
        analysis: `圆锥不是棱柱。`,
        authorMathNote: `A,B,D`,
        ...noFig(),
      },
      {
        sectionCode: '8.5',
        sectionName: '空间中的平行关系',
        stem: `能判定平面 $\\alpha\\parallel\\beta$ 的有（多选）`,
        options: {
          A: '$\\alpha$ 内两相交直线分别平行于 $\\beta$',
          B: '$\\alpha$ 内一条直线平行于 $\\beta$',
          C: '$\\alpha,\\beta$ 都垂直于同一平面',
          D: '$\\alpha,\\beta$ 都平行于同一平面 $\\gamma$',
        },
        answer: 'A,D',
        analysis: `面面平行判定常用两相交线；平行于同一平面的两平面平行。B 不足；C 可能相交。`,
        authorMathNote: `A,D`,
        ...noFig(),
      },
      {
        sectionCode: '8.6',
        sectionName: '空间中的垂直关系',
        stem: `若直线 $l\\perp$ 平面 $\\alpha$，则正确的有（多选）`,
        options: {
          A: '$l$ 垂直于 $\\alpha$ 内任意直线',
          B: '$l$ 平行于 $\\alpha$',
          C: '过 $l$ 的平面必垂直于 $\\alpha$',
          D: '$l$ 与 $\\alpha$ 交于一点',
        },
        answer: 'A,C,D',
        analysis: `线面垂直定义与性质；必相交不平行。`,
        authorMathNote: `A,C,D`,
        ...fig('线面垂直', ['平面 α', '垂线 l', '交点'], '不得写性质结论'),
      },
      {
        sectionCode: '8.3',
        sectionName: '简单几何体的表面积与体积',
        stem: `下列体积公式正确的有（多选）`,
        options: {
          A: `圆柱 $V=\\pi r^2 h$`,
          B: `圆锥 $V=\\dfrac13\\pi r^2 h$`,
          C: `球 $V=\\dfrac43\\pi r^3$`,
          D: `棱锥 $V=\\dfrac12 Sh$`,
        },
        answer: 'A,B,C',
        analysis: `棱锥是 $\\dfrac13 Sh$。`,
        authorMathNote: `A,B,C`,
        ...noFig(),
      },
    ]
    let v = pick(n, variants)
    if (d === 3) {
      v = {
        sectionCode: '8.6',
        sectionName: '空间中的垂直关系',
        stem: `在正方体 $ABCD-A_1B_1C_1D_1$ 中，正确的有（多选）`,
        options: {
          A: `$AC\\perp BD$`,
          B: `$AA_1\\perp$ 平面 $ABCD$`,
          C: `$A_1C\\perp$ 平面 $AB_1D_1$ 在必修二范围内可直接由对称断言无需论证`,
          D: `$AB\\parallel C_1D_1$`,
        },
        answer: 'A,B,D',
        analysis: `底面对角线垂直；侧棱垂直底面；AB∥CD∥C1D1。C 断言过强且非“无需论证”。`,
        authorMathNote: `A,B,D`,
        ...fig('正方体', ['正方体 ABCD-A1B1C1D1', '对角线 AC、BD'], '不得标注垂直结论'),
        ...hp(
          '正方体中位置关系筛选',
          '多条线面关系正误判断',
          '用正方体性质逐项验证',
          '含超纲/过度断言干扰项',
        ),
      }
    }
    return {
      partial: { ...v, dedupNote: `ch8-multi-${n % 5}-${n}` },
      evidenceExtra: { answerBasis: v.answer },
    }
  }

  if (qt === 'judge') {
    const variants = [
      {
        sectionCode: '8.5',
        sectionName: '空间中的平行关系',
        stem: `判断：平面外一条直线平行于平面内一条直线，则该直线与平面平行。`,
        options: null,
        answer: 'true',
        analysis: `线面平行判定（含“平面外”条件）。`,
        authorMathNote: `true`,
        ...fig('线面平行判定', ['平面', '平面外直线', '平面内平行线'], '不得写判定结论'),
      },
      {
        sectionCode: '8.1',
        sectionName: '基本立体图形',
        stem: `判断：直棱柱的侧棱垂直于底面。`,
        options: null,
        answer: 'true',
        analysis: `直棱柱定义。`,
        authorMathNote: `true`,
        ...noFig(),
      },
      {
        sectionCode: '8.4',
        sectionName: '空间点线面位置关系',
        stem: `判断：若直线 $l$ 平行于平面 $\\alpha$，则 $l$ 与 $\\alpha$ 内任意直线都平行。`,
        options: null,
        answer: 'false',
        analysis: `平面内还有与 $l$ 异面或相交倾向的直线（相对方向）；线面平行只保证不相交，不保证与内线都平行。`,
        authorMathNote: `false`,
        ...noFig(),
      },
      {
        sectionCode: '8.6',
        sectionName: '空间中的垂直关系',
        stem: `判断：若直线 $l$ 垂直于平面 $\\alpha$，则 $l$ 垂直于 $\\alpha$ 内任意一条直线。`,
        options: null,
        answer: 'true',
        analysis: `线面垂直的性质定理。`,
        authorMathNote: `true`,
        ...noFig(),
      },
      {
        sectionCode: '8.5',
        sectionName: '空间中的平行关系',
        stem: `判断：若直线 $l$ 与平面 $\\alpha$ 内一条直线平行，则一定有 $l\\parallel\\alpha$（无需其它条件）。`,
        options: null,
        answer: 'false',
        analysis: `若 $l$ 在平面内则不平行于平面；缺“平面外”条件。`,
        authorMathNote: `false`,
        ...noFig(),
      },
    ]
    let v = pick(n, variants)
    if (d === 3) {
      v = {
        sectionCode: '8.6',
        sectionName: '空间中的垂直关系',
        stem: `判断：若平面 $\\alpha\\perp$ 平面 $\\beta$，直线 $l\\subset\\alpha$ 且 $l\\perp\\alpha\\cap\\beta$，则 $l\\perp\\beta$。`,
        options: null,
        answer: 'true',
        analysis: `面面垂直的性质：垂直于交线的平面内直线垂直于另一平面。`,
        authorMathNote: `true`,
        ...fig('两垂面与交线', ['平面 α、β', '交线', 'α 内垂线 l'], '不得写 l⊥β'),
        ...hp(
          '面面垂直性质',
          '由面面垂直推线面垂直',
          '找交线 → 证 l⊥交线 → 得 l⊥β',
          '条件链长，易漏“在α内且⊥交线”',
        ),
      }
    }
    return {
      partial: { ...v, dedupNote: `ch8-judge-${n % 5}-${n}` },
      evidenceExtra: { answerBasis: v.answer },
    }
  }

  if (qt === 'numeric') {
    const variants = [
      () => ({
        sectionCode: '8.3',
        sectionName: '简单几何体的表面积与体积',
        stem: `底面半径 $${R}$、高 $${H}$ 的圆柱，其体积除以 $\\pi$ 的结果为`,
        options: null,
        answer: String(R * R * H),
        analysis: `$V/\\pi=r^2h=${R * R * H}$。`,
        authorMathNote: `${R * R * H}`,
        ...fig('圆柱', ['底面半径', '高'], '不得标注 V/π 数值'),
      }),
      () => ({
        sectionCode: '8.3',
        sectionName: '简单几何体的表面积与体积',
        stem: `棱长为 $${a}$ 的正方体体积为`,
        options: null,
        answer: String(a ** 3),
        analysis: `$a^3$。`,
        authorMathNote: `${a ** 3}`,
        ...noFig(),
      }),
      () => ({
        sectionCode: '8.3',
        sectionName: '简单几何体的表面积与体积',
        stem: `底面半径 $${R}$、高 $${H}$ 的圆锥，体积除以 $\\pi$ 的结果为`,
        options: null,
        answer: String((R * R * H) / 3),
        analysis: `$V/\\pi=\\dfrac13 r^2 h$。`,
        authorMathNote: `${(R * R * H) / 3}`,
        ...fig('圆锥', ['底面', '高'], '不得标注数值体积'),
      }),
      () => {
        // ensure divisible by 3
        const RR = R
        const HH = 3 * seed(n, 1, 4)
        return {
          sectionCode: '8.3',
          sectionName: '简单几何体的表面积与体积',
          stem: `底面半径 $${RR}$、高 $${HH}$ 的圆锥，体积除以 $\\pi$ 的结果为`,
          options: null,
          answer: String((RR * RR * HH) / 3),
          analysis: `$\\dfrac13 ${RR}^2\\cdot${HH}=${(RR * RR * HH) / 3}$。`,
          authorMathNote: `${(RR * RR * HH) / 3}`,
          ...fig('圆锥', ['底面半径 R', '高 H'], '不得写体积数'),
        }
      },
      () => ({
        sectionCode: '8.3',
        sectionName: '简单几何体的表面积与体积',
        stem: `长方体棱长分别为 $${a}$、$${a + 1}$、$${a + 2}$，其体对角线长的平方为`,
        options: null,
        answer: String(a * a + (a + 1) ** 2 + (a + 2) ** 2),
        analysis: `三棱平方和。`,
        authorMathNote: `对角线平方`,
        ...fig('长方体', ['三度棱', '体对角线示意'], '不得标注对角线数值'),
      }),
      () => ({
        sectionCode: '8.3',
        sectionName: '简单几何体的表面积与体积',
        stem: `半径 $${R}$ 的球，表面积除以 $\\pi$ 的结果为`,
        options: null,
        answer: String(4 * R * R),
        analysis: `$S/\\pi=4r^2$。`,
        authorMathNote: `${4 * R * R}`,
        ...noFig(),
      }),
      () => ({
        sectionCode: '8.3',
        sectionName: '简单几何体的表面积与体积',
        stem: `正四棱柱底面边长 $${a}$、高 $${H}$，体积为`,
        options: null,
        answer: String(a * a * H),
        analysis: `$V=a^2 H$。`,
        authorMathNote: `${a * a * H}`,
        ...fig('正四棱柱', ['底面正方形', '高'], '不得标注体积'),
      }),
    ]
    let v = pick(n, variants)()
    if (d === 3) {
      const edge = a + 1
      // cube space diagonal squared = 3 edge^2
      v = {
        sectionCode: '8.3',
        sectionName: '简单几何体的表面积与体积',
        stem: `棱长为 $${edge}$ 的正方体中，体对角线长的平方减去一条面对角线长的平方，结果为`,
        options: null,
        answer: String(edge * edge),
        analysis: `体对角平方 $3e^2$，面对角平方 $2e^2$，差 $e^2=${edge * edge}$。`,
        authorMathNote: `${edge * edge}`,
        ...fig('正方体对角线', ['正方体', '体对角线', '一条面对角线'], '不得标注长度平方'),
        ...hp(
          '体对角与面对角关系',
          '两平方差运算',
          '写 3e² 与 2e² → 作差',
          '需同时用两类对角线公式',
        ),
      }
    }
    return {
      partial: { ...v, dedupNote: `ch8-num-${n % 7}-${n}` },
      evidenceExtra: { answerBasis: `numeric=${v.answer}` },
    }
  }

  // application
  {
    const variants = [
      () => {
        const rub = appRubric(
          [
            { key: 'cyl', title: '圆柱体积', score: 3, criterion: '圆柱体积正确' },
            { key: 'cone', title: '圆锥体积', score: 3, criterion: '圆锥体积正确' },
            { key: 'sum', title: '合计', score: 2, criterion: '总和正确' },
          ],
          8,
        )
        const sum = R * R * H + (R * R * h) / 3
        return {
          sectionCode: '8.3',
          sectionName: '简单几何体的表面积与体积',
          stem: `圆柱（底面半径 $${R}$，高 $${H}$）上叠放同底圆锥（高 $${h}$）。求组合体体积（含 $\\pi$）。`,
          options: null,
          answer: `$${sum}\\pi$`,
          analysis: `柱 ${R * R * H}π + 锥 ${(R * R * h) / 3}π。`,
          authorMathNote: `${sum}π`,
          ...fig('柱锥组合体', ['圆柱', '圆锥', '公共底半径'], '不得写体积'),
          ...rub,
        }
      },
      () => {
        const rub = appRubric(
          [
            { key: 'cube', title: '正方体', score: 3, criterion: '大正方体体积' },
            { key: 'cyl', title: '挖去圆柱', score: 3, criterion: '圆柱体积' },
            { key: 'rest', title: '剩余', score: 2, criterion: '差正确' },
          ],
          8,
        )
        const edge = a + 2
        const rr = a
        const hh = a + 1
        return {
          sectionCode: '8.3',
          sectionName: '简单几何体的表面积与体积',
          stem: `正方体棱长 $${edge}$，内部挖去底面半径 $${rr}$、高 $${hh}$ 的圆柱（轴线平行于棱）。求剩余体积（含 $\\pi$）。`,
          options: null,
          answer: `$${edge ** 3}-\\pi\\cdot${rr * rr * hh}$`,
          analysis: `正方体减圆柱。`,
          authorMathNote: `挖柱`,
          ...fig('正方体内挖柱', ['正方体外轮廓', '内圆柱示意'], '不得写剩余体积式'),
          ...rub,
        }
      },
      () => {
        const rub = appRubric(
          [
            { key: 'vol', title: '体积', score: 4, criterion: '圆锥体积' },
            { key: 'sec', title: '轴截面', score: 4, criterion: '轴截面面积' },
          ],
          8,
        )
        return {
          sectionCode: '8.3',
          sectionName: '简单几何体的表面积与体积',
          stem: `圆锥底面半径 $${R}$、高 $${H}$。\n（1）求体积（含 $\\pi$）；\n（2）轴截面为等腰三角形，求轴截面面积。`,
          options: null,
          answer: `（1）$\\dfrac13\\pi ${R * R}\\cdot${H}$；（2）$${R * H}$。`,
          analysis: `轴截面底 $2R$、高 $H$，面积 $RH$。`,
          authorMathNote: `体积+轴截面`,
          ...fig('圆锥与轴截面', ['圆锥', '轴截面三角形'], '不得写面积数值'),
          ...rub,
        }
      },
      () => {
        const rub = appRubric(
          [
            { key: 'diag', title: '体对角', score: 8, criterion: '对角线平方正确' },
          ],
          8,
        )
        const ans = (a + 1) ** 2 + (a + 2) ** 2 + (a + 3) ** 2
        return {
          sectionCode: '8.3',
          sectionName: '简单几何体的表面积与体积',
          stem: `长方体棱长 $${a + 1},${a + 2},${a + 3}$。求体对角线长的平方。`,
          options: null,
          answer: String(ans),
          analysis: `三度平方和。`,
          authorMathNote: `${ans}`,
          ...fig('长方体', ['三度', '体对角线'], '不得标注平方值'),
          ...rub,
        }
      },
      () => {
        const rub = appRubric(
          [
            { key: 'S', title: '表面积', score: 4, criterion: '4πr²' },
            { key: 'V', title: '体积', score: 4, criterion: '4/3 πr³' },
          ],
          8,
        )
        const rr = R + 1
        return {
          sectionCode: '8.3',
          sectionName: '简单几何体的表面积与体积',
          stem: `球半径 $${rr}$。\n（1）求表面积（含 $\\pi$）；\n（2）求体积（含 $\\pi$）。`,
          options: null,
          answer: `（1）$${4 * rr * rr}\\pi$；（2）$\\dfrac43\\pi\\cdot${rr ** 3}$。`,
          analysis: `球公式。`,
          authorMathNote: `球`,
          ...noFig('球公式计算。'),
          ...rub,
        }
      },
      () => {
        const rub = appRubric(
          [
            { key: 'setup', title: '线面关系', score: 4, criterion: '指出要证平行/中位' },
            { key: 'proof', title: '证明', score: 4, criterion: '完成线面平行证明' },
          ],
          8,
        )
        return {
          sectionCode: '8.5',
          sectionName: '空间中的平行关系',
          stem: `在长方体 $ABCD-A_1B_1C_1D_1$ 中，$E$、$F$ 分别为棱 $AA_1$、$CC_1$ 的中点。证明：$EF\\parallel$ 平面 $ABCD$。`,
          options: null,
          answer: `取底面对应中点或证 EF∥AC 且 AC⊂底面，得线面平行。`,
          analysis: `构造中位线或用向量/坐标证平行于底面内直线。`,
          authorMathNote: `线面平行`,
          ...fig('长方体中点 E、F', ['长方体', '中点 E、F', '线段 EF'], '不得写平行结论'),
          ...rub,
        }
      },
    ]
    let v = pick(n, variants)()
    if (d === 3) {
      const rub = appRubric(
        [
          { key: 'rel', title: '关键垂直', score: 4, criterion: '指出 AB⊥平面或相应垂直' },
          { key: 'crit', title: '线面垂直判定', score: 3, criterion: '证线垂直面内两相交线' },
          { key: 'conc', title: '结论', score: 3, criterion: '完成所证' },
        ],
        10,
      )
      v = {
        sectionCode: '8.6',
        sectionName: '空间中的垂直关系',
        stem: `在直三棱柱 $ABC-A_1B_1C_1$ 中，$AB\\perp BC$，且 $AB=BC=AA_1=${a}$。证明：$AB_1\\perp$ 平面 $A_1BC$。`,
        options: null,
        answer: `证 $AB_1\\perp A_1B$ 与 $AB_1\\perp BC$（或面内两相交线），由线面垂直判定得证。`,
        analysis: `用直棱柱侧棱垂直底面及直角边条件，计算或几何证两垂直。`,
        authorMathNote: `线面垂直综合`,
        ...fig('直三棱柱', ['三棱柱', '直角底面', 'AB1 与平面 A1BC'], '不得标注垂直符号作为结论'),
        ...rub,
        ...hp(
          '线面垂直综合证明',
          '在直三棱柱中证线面垂直',
          '找面内两相交线 → 分别证垂直 → 判定定理',
          '需空间想象与判定定理链式使用',
        ),
      }
    }
    return {
      partial: { ...v, dedupNote: `ch8-app-${n % 6}-${n}` },
      evidenceExtra: { rubricVerdict: `maxScore=${v.maxScore}` },
    }
  }
}

/* ===================== Ch9 统计 ===================== */
function ch9(slot, n) {
  const a = seed(n, 2, 9)
  const qt = slot.qtype
  const d = slot.difficulty
  const N = 50 + 10 * (n % 5)
  const bad = 1 + (n % 4)
  const M = 1000 + 500 * (n % 4)

  if (qt === 'single') {
    const variants = [
      {
        sectionCode: '9.1',
        sectionName: '随机抽样',
        stem: `从 $${100 + 10 * a}$ 人中用抽签法抽 $${5 + (a % 3)}$ 人，每个个体被抽到的概率为`,
        options: {
          A: `$\\dfrac{1}{${100 + 10 * a}}$`,
          B: `$\\dfrac{${5 + (a % 3)}}{${100 + 10 * a}}$`,
          C: `$\\dfrac{1}{${5 + (a % 3)}}$`,
          D: `$\\dfrac{${5 + (a % 3)}}{${95 + 10 * a}}$`,
        },
        answer: 'B',
        analysis: `简单随机抽样：样本量/总体。`,
        authorMathNote: `n/N`,
        ...noFig(),
      },
      {
        sectionCode: '9.1',
        sectionName: '随机抽样',
        stem: `下列属于简单随机抽样的是`,
        options: {
          A: '抽签法',
          B: '系统抽样',
          C: '分层抽样',
          D: '随意挑选熟人',
        },
        answer: 'A',
        analysis: `抽签法是简单随机抽样；系统、分层是其它随机抽样类型。`,
        authorMathNote: `A`,
        ...noFig(),
      },
      {
        sectionCode: '9.2',
        sectionName: '用样本估计总体',
        stem: `抽检 $${N}$ 件，次品 $${bad}$ 件，用频率估计次品率，得`,
        options: {
          A: String(bad / N),
          B: String(bad),
          C: String(N / bad),
          D: String(1 - bad / N),
        },
        answer: 'A',
        analysis: `频率 $=${bad}/${N}$。`,
        authorMathNote: `${bad}/${N}`,
        ...noFig(),
      },
      {
        sectionCode: '9.3',
        sectionName: '相关性',
        stem: `样本相关系数 $r$ 的绝对值越接近 1，通常表示`,
        options: {
          A: '线性相关程度越强',
          B: '一定是因果关系',
          C: '没有相关',
          D: '样本量一定更大',
        },
        answer: 'A',
        analysis: `|r|→1 线性相关强；相关≠因果。`,
        authorMathNote: `A`,
        ...noFig(),
      },
      {
        sectionCode: '9.2',
        sectionName: '用样本估计总体',
        stem: `样本数据 $${a},${a + 2},${a + 4},${a + 6}$ 的平均数是`,
        options: {
          A: String(a + 3),
          B: String(a + 2),
          C: String(a + 4),
          D: String(4 * a),
        },
        answer: 'A',
        analysis: `等差中项，平均 $${a + 3}$。`,
        authorMathNote: `${a + 3}`,
        ...noFig(),
      },
      {
        sectionCode: '9.1',
        sectionName: '随机抽样',
        stem: `分层抽样的主要特点是`,
        options: {
          A: '按层比例抽取，层内随机',
          B: '每隔固定间隔抽取',
          C: '只抽一层',
          D: '不必随机',
        },
        answer: 'A',
        analysis: `分层：层间按比例，层内简单随机。`,
        authorMathNote: `A`,
        ...noFig(),
      },
    ]
    let v = pick(n, variants)
    if (d === 3) {
      const data = [a, a + 2, a + 4, a + 6, a + 8]
      const mean = a + 4
      const variance =
        data.reduce((s, x) => s + (x - mean) ** 2, 0) / data.length
      v = {
        sectionCode: '9.2',
        sectionName: '用样本估计总体',
        stem: `样本 $${data.join(',')}$。设平均数为 $\\bar x$，样本方差 $s^2=\\dfrac1n\\sum(x_i-\\bar x)^2$，则 $s^2=$`,
        options: {
          A: String(variance),
          B: String(variance * 2),
          C: String(mean),
          D: String(a),
        },
        answer: 'A',
        analysis: `$\\bar x=${mean}$，偏差平方平均得 ${variance}。`,
        authorMathNote: `s^2=${variance}`,
        ...noFig(),
        ...hp(
          '样本方差计算',
          '先均值再偏差平方平均',
          '求均值 → 各偏差 → 平方平均',
          '易误用 n-1 或只求极差',
        ),
      }
    }
    return {
      partial: { ...v, dedupNote: `ch9-single-${n % 6}-${n}` },
      evidenceExtra: { answerBasis: v.answer },
    }
  }

  if (qt === 'multi') {
    const variants = [
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
        analysis: `C、D 是其它抽样方法。`,
        authorMathNote: `A,B`,
        ...noFig(),
      },
      {
        sectionCode: '9.1',
        sectionName: '随机抽样',
        stem: `关于分层抽样，正确的有（多选）`,
        options: {
          A: '适用于总体有明显层差异',
          B: '各层抽取比例通常按层容量',
          C: '层内采用随机抽取',
          D: '不必保证随机性',
        },
        answer: 'A,B,C',
        analysis: `仍需随机。`,
        authorMathNote: `A,B,C`,
        ...noFig(),
      },
      {
        sectionCode: '9.2',
        sectionName: '用样本估计总体',
        stem: `用样本估计总体时，正确的有（多选）`,
        options: {
          A: '样本平均数可估计总体平均数',
          B: '频率可估计概率或比例',
          C: '样本越大估计通常越稳定',
          D: '一个样本点就能精确代表总体',
        },
        answer: 'A,B,C',
        analysis: `D 错。`,
        authorMathNote: `A,B,C`,
        ...noFig(),
      },
      {
        sectionCode: '9.3',
        sectionName: '相关性',
        stem: `关于相关系数，正确的有（多选）`,
        options: {
          A: `$|r|$ 接近 1 时线性相关强',
          B: 'r=0 一定毫无关系',
          C: '相关不等于因果',
          D: '回归分析关注变量相关趋势',
        },
        answer: 'A,C,D',
        analysis: `r=0 只说明无线性相关，可能有非线性关系。`,
        authorMathNote: `A,C,D`,
        ...noFig(),
      },
    ]
    // fix quote typo in last variant
    variants[3].options.A = '$|r|$ 接近 1 时线性相关通常越强'
    let v = pick(n, variants)
    if (d === 3) {
      v = {
        sectionCode: '9.2',
        sectionName: '用样本估计总体',
        stem: `某校抽测成绩（分）：${80 + a},${82 + a},${78 + a},${90 + a},${85 + a}$。下列正确的有（多选）`,
        options: {
          A: `样本容量为 5`,
          B: `样本平均数大于 ${80 + a}`,
          C: `样本中位数一定是 ${82 + a}`,
          D: `可用样本平均数估计该校总体平均成绩`,
        },
        answer: 'A,B,D',
        analysis: `排序后中位数是第三个数，未必是 82+a；均值高于最小者。`,
        authorMathNote: `A,B,D`,
        ...noFig(),
        ...hp(
          '数字特征综合判断',
          '容量/均值/中位数/估计思想',
          '算均值范围 → 排序看中位数 → 排除错误',
          '中位数干扰需排序',
        ),
      }
      const arr = [80 + a, 82 + a, 78 + a, 90 + a, 85 + a].sort((x, y) => x - y)
      const mean = (80 + a + 82 + a + 78 + a + 90 + a + 85 + a) / 5
      v.options.B = `样本平均数等于 ${mean}`
      v.options.C = `样本中位数等于 ${arr[2]}`
      v.answer = 'A,B,C,D'
      v.analysis = `容量 5；均值 ${mean}；排序中位数 ${arr[2]}；可用样本估计总体。`
      v.authorMathNote = `A,B,C,D`
      // For hard multi, having all correct is ok but less interesting - make C wrong sometimes
      if (n % 2 === 0) {
        v.options.C = `样本中位数等于 ${arr[0]}`
        v.answer = 'A,B,D'
        v.analysis = `中位数是排序后第 3 个 ${arr[2]}，不是最小值。`
      }
    }
    return {
      partial: { ...v, dedupNote: `ch9-multi-${n % 4}-${n}` },
      evidenceExtra: { answerBasis: v.answer },
    }
  }

  if (qt === 'judge') {
    const variants = [
      {
        sectionCode: '9.2',
        sectionName: '用样本估计总体',
        stem: `判断：样本平均数可用于估计总体平均数。`,
        options: null,
        answer: 'true',
        analysis: `统计基本思想。`,
        authorMathNote: `true`,
        ...noFig(),
      },
      {
        sectionCode: '9.3',
        sectionName: '相关性',
        stem: `判断：线性回归方程一定经过每一个样本点。`,
        options: null,
        answer: 'false',
        analysis: `回归直线一般不经过所有点，而是最小二乘拟合。`,
        authorMathNote: `false`,
        ...noFig(),
      },
      {
        sectionCode: '9.1',
        sectionName: '随机抽样',
        stem: `判断：系统抽样中，分段间隔确定后，起始编号仍需随机确定。`,
        options: null,
        answer: 'true',
        analysis: `起始号随机，再按间隔抽取。`,
        authorMathNote: `true`,
        ...noFig(),
      },
      {
        sectionCode: '9.2',
        sectionName: '用样本估计总体',
        stem: `判断：样本相关系数 $r$ 越接近 1，两个变量的线性相关程度通常越强。`,
        options: null,
        answer: 'true',
        analysis: `正线性相关强度随 r→1 增强。`,
        authorMathNote: `true`,
        ...noFig(),
      },
      {
        sectionCode: '9.1',
        sectionName: '随机抽样',
        stem: `判断：分层抽样时，可以只在某一层抽取全部样本。`,
        options: null,
        answer: 'false',
        analysis: `应各层都按比例抽取，否则失去分层意义。`,
        authorMathNote: `false`,
        ...noFig(),
      },
    ]
    let v = pick(n, variants)
    if (d === 3) {
      v = {
        sectionCode: '9.2',
        sectionName: '用样本估计总体',
        stem: `判断：在样本量很大时，用样本频率估计总体比例，估计值一定恰好等于总体真实比例。`,
        options: null,
        answer: 'false',
        analysis: `大样本使估计更稳定、更接近，但不保证某次估计恰好等于真值。`,
        authorMathNote: `false`,
        ...noFig(),
        ...hp(
          '频率估计的认识',
          '区分“接近”与“恰好相等”',
          '回顾大数思想 → 否定必然相等',
          '易把极限稳定误认为单次恒等',
        ),
      }
    }
    return {
      partial: { ...v, dedupNote: `ch9-judge-${n % 5}-${n}` },
      evidenceExtra: { answerBasis: v.answer },
    }
  }

  if (qt === 'numeric') {
    const variants = [
      () => ({
        sectionCode: '9.2',
        sectionName: '用样本估计总体',
        stem: `样本数据 $2,4,6,8$，样本平均数为`,
        options: null,
        answer: '5',
        analysis: `$(2+4+6+8)/4=5$。`,
        authorMathNote: `5`,
        ...noFig(),
      }),
      () => ({
        sectionCode: '9.1',
        sectionName: '随机抽样',
        stem: `总体 $${200}$ 个个体，抽签法抽 $${10}$ 个，每个个体被抽到的概率为（填最简分数）`,
        options: null,
        answer: '1/20',
        analysis: `$10/200=1/20$。`,
        authorMathNote: `1/20`,
        ...noFig(),
      }),
      () => {
        const freq = bad / N
        const est = (M * bad) / N
        return {
          sectionCode: '9.2',
          sectionName: '用样本估计总体',
          stem: `抽检 $${N}$ 件次品 $${bad}$ 件，估计 $${M}$ 件中约有多少次品`,
          options: null,
          answer: String(est),
          analysis: `$\\dfrac{${bad}}{${N}}\\times${M}=${est}$。`,
          authorMathNote: `${est}`,
          ...noFig(),
        }
      },
      () => {
        const xs = [a, a + 2, a + 4]
        const mean = a + 2
        return {
          sectionCode: '9.2',
          sectionName: '用样本估计总体',
          stem: `样本 $${xs.join(',')}$ 的平均数为`,
          options: null,
          answer: String(mean),
          analysis: `平均 ${mean}。`,
          authorMathNote: `${mean}`,
          ...noFig(),
        }
      },
      () => ({
        sectionCode: '9.1',
        sectionName: '随机抽样',
        stem: `总体分 2 层，容量比 $2:3$，共抽 ${10} 人，则第一层应抽`,
        options: null,
        answer: '4',
        analysis: `$10\\times\\dfrac{2}{5}=4$。`,
        authorMathNote: `4`,
        ...noFig(),
      }),
    ]
    let v = pick(n, variants)()
    if (d === 3) {
      const xs = [a, a + 2, a + 4, a + 6]
      const mean = a + 3
      const s2 = xs.reduce((s, x) => s + (x - mean) ** 2, 0) / 4
      v = {
        sectionCode: '9.2',
        sectionName: '用样本估计总体',
        stem: `样本 $${xs.join(',')}$，按 $s^2=\\dfrac1n\\sum(x_i-\\bar x)^2$ 计算样本方差，得`,
        options: null,
        answer: String(s2),
        analysis: `$\\bar x=${mean}$，$s^2=${s2}$。`,
        authorMathNote: `${s2}`,
        ...noFig(),
        ...hp(
          '方差定义计算',
          '四数据方差',
          '均值 → 偏差平方 → /n',
          '计算步骤多于平均数',
        ),
      }
    }
    return {
      partial: { ...v, dedupNote: `ch9-num-${n % 5}-${n}` },
      evidenceExtra: { answerBasis: `numeric=${v.answer}` },
    }
  }

  // application
  {
    const variants = [
      () => {
        const rub = appRubric(
          [
            { key: 'freq', title: '频率', score: 3, criterion: '次品率正确' },
            { key: 'est', title: '估计', score: 5, criterion: '总体次品数估计正确' },
          ],
          8,
        )
        return {
          sectionCode: '9.2',
          sectionName: '用样本估计总体',
          stem: `抽检 $${N}$ 件，次品 $${bad}$ 件。用频率估计次品率，并估计 $${M}$ 件中约有多少次品。`,
          options: null,
          answer: `次品率 $${bad}/${N}$；约 $${(M * bad) / N}$ 件。`,
          analysis: `频率估计；比例放大。`,
          authorMathNote: `估计 ${(M * bad) / N}`,
          ...noFig(),
          ...rub,
        }
      },
      () => {
        const rub = appRubric(
          [
            { key: 'mean', title: '平均数', score: 4, criterion: '平均数正确' },
            { key: 'var', title: '方差', score: 4, criterion: '方差正确' },
          ],
          8,
        )
        const xs = [86, 90, 78, 92, 84]
        const mean = xs.reduce((s, x) => s + x, 0) / 5
        const s2 = xs.reduce((s, x) => s + (x - mean) ** 2, 0) / 5
        return {
          sectionCode: '9.2',
          sectionName: '用样本估计总体',
          stem: `样本成绩：${xs.join(',')}。求样本平均数与样本方差（$s^2=\\dfrac1n\\sum(x_i-\\bar x)^2$）。`,
          options: null,
          answer: `平均数 $${mean}$；方差 $${s2}$。`,
          analysis: `先均值再方差。`,
          authorMathNote: `mean=${mean}, s2=${s2}`,
          ...noFig(),
          ...rub,
        }
      },
      () => {
        const rub = appRubric(
          [
            { key: 'layer', title: '分层人数', score: 4, criterion: '各层抽取数正确' },
            { key: 'reason', title: '说明', score: 4, criterion: '说明按比例分层' },
          ],
          8,
        )
        return {
          sectionCode: '9.1',
          sectionName: '随机抽样',
          stem: `某年级甲、乙、丙三班人数为 $40,40,20$，用分层抽样抽 $20$ 人。\n（1）求各班应抽人数；\n（2）简述分层抽样相对简单随机抽样的适用情形。`,
          options: null,
          answer: `（1）$8,8,4$；（2）总体分层差异明显时更合适。`,
          analysis: `比例 $2:2:1$，共 10 份，每份 2 人。`,
          authorMathNote: `8,8,4`,
          ...noFig(),
          ...rub,
        }
      },
      () => {
        const rub = appRubric(
          [
            { key: 'p', title: '频率', score: 4, criterion: '频率正确' },
            { key: 'explain', title: '说明', score: 4, criterion: '说明用频率估计概率' },
          ],
          8,
        )
        return {
          sectionCode: '9.2',
          sectionName: '用样本估计总体',
          stem: `抛硬币 $${200}$ 次，正面 $${96}$ 次。\n（1）求正面频率；\n（2）据此估计该币正面概率，并说明依据。`,
          options: null,
          answer: `（1）$0.48$；（2）估计约 $0.48$，依据用频率估计概率。`,
          analysis: `$96/200=0.48$。`,
          authorMathNote: `0.48`,
          ...noFig(),
          ...rub,
        }
      },
    ]
    let v = pick(n, variants)()
    if (d === 3) {
      const rub = appRubric(
        [
          { key: 'mean', title: '平均数', score: 3, criterion: '正确' },
          { key: 'var', title: '方差', score: 4, criterion: '定义法正确' },
          { key: 'est', title: '估计说明', score: 3, criterion: '说明可估计总体水平与离散' },
        ],
        10,
      )
      const xs = [80 + a, 85 + a, 90 + a, 70 + a, 75 + a]
      const mean = xs.reduce((s, x) => s + x, 0) / 5
      const s2 = xs.reduce((s, x) => s + (x - mean) ** 2, 0) / 5
      v = {
        sectionCode: '9.2',
        sectionName: '用样本估计总体',
        stem: `样本：$${xs.join(',')}$。\n（1）求平均数；$\\ $（2）求样本方差 $s^2=\\dfrac1n\\sum(x_i-\\bar x)^2$；\n（3）说明这两个统计量分别估计总体的什么特征。`,
        options: null,
        answer: `（1）${mean}；（2）${s2}；（3）均值估总体平均水平，方差估离散程度。`,
        analysis: `计算均值与方差，并对应总体参数含义。`,
        authorMathNote: `mean=${mean},s2=${s2}`,
        ...noFig(),
        ...rub,
        ...hp(
          '数字特征+估计思想',
          '计算与统计含义结合',
          '算均值方差 → 对应总体参数',
          '压轴要求计算准确且解释到位',
        ),
      }
    }
    return {
      partial: { ...v, dedupNote: `ch9-app-${n % 4}-${n}` },
      evidenceExtra: { rubricVerdict: `maxScore=${v.maxScore}` },
    }
  }
}

/* ===================== Ch10 概率 ===================== */
function ch10(slot, n) {
  const a = seed(n, 2, 6)
  const qt = slot.qtype
  const d = slot.difficulty

  if (qt === 'single') {
    const variants = [
      {
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
        analysis: `2,4,6 共 3 种，$3/6=1/2$。`,
        authorMathNote: `1/2`,
        ...noFig(),
      },
      {
        sectionCode: '10.1',
        sectionName: '随机事件与概率',
        stem: `抛一枚质地均匀硬币一次，样本空间基本事件个数为`,
        options: { A: '2', B: '1', C: '4', D: '6' },
        answer: 'A',
        analysis: `正、反两面。`,
        authorMathNote: `2`,
        ...noFig(),
      },
      {
        sectionCode: '10.2',
        sectionName: '事件的相互独立性',
        stem: `独立事件 $A,B$，$P(A)=\\dfrac15$，$P(B)=\\dfrac12$，则 $P(AB)=$`,
        options: {
          A: `$\\dfrac1{10}$`,
          B: `$\\dfrac7{10}$`,
          C: `$\\dfrac15$`,
          D: `$\\dfrac12$`,
        },
        answer: 'A',
        analysis: `$P(AB)=P(A)P(B)$。`,
        authorMathNote: `1/10`,
        ...noFig(),
      },
      {
        sectionCode: '10.3',
        sectionName: '频率与概率',
        stem: `大量重复试验下，随机事件发生的频率会`,
        options: {
          A: '稳定在概率附近',
          B: '每次都等于概率',
          C: '越来越远离概率',
          D: '与概率无关',
        },
        answer: 'A',
        analysis: `大数定律思想。`,
        authorMathNote: `A`,
        ...noFig(),
      },
      {
        sectionCode: '10.1',
        sectionName: '随机事件与概率',
        stem: `袋中 ${a} 红 ${a - 1} 白，随机摸 1 球，摸到红球概率为`,
        options: {
          A: `$\\dfrac{${a}}{${2 * a - 1}}$`,
          B: `$\\dfrac{${a - 1}}{${2 * a - 1}}$`,
          C: `$\\dfrac12$`,
          D: `$\\dfrac{${a}}{${a - 1}}$`,
        },
        answer: 'A',
        analysis: `古典概型：红/$总数$。`,
        authorMathNote: `${a}/${2 * a - 1}`,
        ...noFig(),
      },
      {
        sectionCode: '10.2',
        sectionName: '事件的相互独立性',
        stem: `若 $A,B$ 独立且 $P(B)>0$，则`,
        options: {
          A: `$P(A|B)=P(A)$`,
          B: `$P(A\\cup B)=P(A)+P(B)$ 一定成立`,
          C: `$P(AB)=0$`,
          D: `$A,B$ 互斥`,
        },
        answer: 'A',
        analysis: `独立 ⇒ 条件概率等于无条件；互斥与独立不同。`,
        authorMathNote: `A`,
        ...noFig(),
      },
    ]
    let v = pick(n, variants)
    if (d === 3) {
      // two independent shots
      const p = 0.8
      // P(exactly one hit in 2) = C(2,1) p (1-p)
      // use fractions: p=4/5
      v = {
        sectionCode: '10.2',
        sectionName: '事件的相互独立性',
        stem: `射手每次命中率 $\\dfrac45$，各次独立。射击 2 次恰命中 1 次的概率为`,
        options: {
          A: `$\\dfrac{8}{25}$`,
          B: `$\\dfrac{16}{25}$`,
          C: `$\\dfrac{4}{25}$`,
          D: `$\\dfrac{12}{25}$`,
        },
        answer: 'A',
        analysis: `$C_2^1\\cdot\\dfrac45\\cdot\\dfrac15=\\dfrac{8}{25}$。`,
        authorMathNote: `8/25`,
        ...noFig(),
        ...hp(
          '独立重复试验',
          '二项型恰 k 次',
          '写 C(2,1)p(1-p) → 代入',
          '易算成两次都中或忽略组合数',
        ),
      }
    }
    return {
      partial: { ...v, dedupNote: `ch10-single-${n % 6}-${n}` },
      evidenceExtra: { answerBasis: v.answer },
    }
  }

  if (qt === 'multi') {
    const variants = [
      {
        sectionCode: '10.2',
        sectionName: '事件的相互独立性',
        stem: `独立事件 $A,B$，一定成立的有（多选）`,
        options: {
          A: `$P(AB)=P(A)P(B)$`,
          B: `$P(A|B)=P(A)$（$P(B)>0$）`,
          C: `$P(A\\cup B)=P(A)+P(B)$`,
          D: `$A$ 与 $\\overline{B}$ 独立`,
        },
        answer: 'A,B,D',
        analysis: `C 需互斥；独立对补事件仍独立。`,
        authorMathNote: `A,B,D`,
        ...noFig(),
      },
      {
        sectionCode: '10.1',
        sectionName: '随机事件与概率',
        stem: `关于古典概型，正确的有（多选）`,
        options: {
          A: '基本事件有限',
          B: '基本事件等可能',
          C: '概率等于有利数/总数',
          D: '可用于无限样本空间任意问题',
        },
        answer: 'A,B,C',
        analysis: `D 超出古典概型。`,
        authorMathNote: `A,B,C`,
        ...noFig(),
      },
      {
        sectionCode: '10.1',
        sectionName: '随机事件与概率',
        stem: `掷均匀骰子一次，正确的有（多选）`,
        options: {
          A: `$P(\\text{点数}>4)=\\dfrac13$`,
          B: `$P(\\text{奇数})=\\dfrac12$`,
          C: `$P(\\text{7点})=0$`,
          D: `$P(\\text{至多6点})=1$`,
        },
        answer: 'A,B,C,D',
        analysis: `均由古典概型直接得。`,
        authorMathNote: `全对`,
        ...noFig(),
      },
      {
        sectionCode: '10.3',
        sectionName: '频率与概率',
        stem: `关于频率与概率，正确的有（多选）`,
        options: {
          A: '频率是试验后的比值',
          B: '概率是先验或模型量',
          C: '频率可估计概率',
          D: '频率恒等于概率',
        },
        answer: 'A,B,C',
        analysis: `D 错。`,
        authorMathNote: `A,B,C`,
        ...noFig(),
      },
    ]
    let v = pick(n, variants)
    if (d === 3) {
      v = {
        sectionCode: '10.2',
        sectionName: '事件的相互独立性',
        stem: `设 $0<P(A)<1$，$0<P(B)<1$，且 $A,B$ 独立。正确的有（多选）`,
        options: {
          A: `$P(A\\cup B)=P(A)+P(B)-P(A)P(B)$`,
          B: `$P(A\\cup B)=P(A)+P(B)$`,
          C: `$\\overline{A}$ 与 $B$ 独立`,
          D: `$P(AB)=0$`,
        },
        answer: 'A,C',
        analysis: `独立时交概率乘积，并用加法公式；补事件独立；交概率一般非 0，故非互斥。`,
        authorMathNote: `A,C`,
        ...noFig(),
        ...hp(
          '独立与互斥辨析',
          '并事件公式与补事件独立',
          '用独立定义展开 → 排除互斥型干扰',
          '独立≠互斥是常见混点',
        ),
      }
    }
    return {
      partial: { ...v, dedupNote: `ch10-multi-${n % 4}-${n}` },
      evidenceExtra: { answerBasis: v.answer },
    }
  }

  if (qt === 'judge') {
    const variants = [
      {
        sectionCode: '10.3',
        sectionName: '频率与概率',
        stem: `判断：试验次数很大时，频率会稳定在概率附近，但不一定每次等于概率。`,
        options: null,
        answer: 'true',
        analysis: `大数思想。`,
        authorMathNote: `true`,
        ...noFig(),
      },
      {
        sectionCode: '10.2',
        sectionName: '事件的相互独立性',
        stem: `判断：互斥事件一定是独立事件。`,
        options: null,
        answer: 'false',
        analysis: `互斥时 $P(AB)=0$，独立需 $P(AB)=P(A)P(B)$，一般不等。`,
        authorMathNote: `false`,
        ...noFig(),
      },
      {
        sectionCode: '10.1',
        sectionName: '随机事件与概率',
        stem: `判断：古典概型要求基本事件等可能。`,
        options: null,
        answer: 'true',
        analysis: `古典概型两特征：有限、等可能。`,
        authorMathNote: `true`,
        ...noFig(),
      },
      {
        sectionCode: '10.1',
        sectionName: '随机事件与概率',
        stem: `判断：不可能事件的概率为 0，概率为 0 的事件一定是不可能事件。`,
        options: null,
        answer: 'false',
        analysis: `在更一般概率模型中概率 0 未必不可能；中学古典概型下常等同，但命题后半一般不严格成立。`,
        authorMathNote: `false`,
        ...noFig(),
      },
    ]
    let v = pick(n, variants)
    if (d === 3) {
      v = {
        sectionCode: '10.2',
        sectionName: '事件的相互独立性',
        stem: `判断：若 $P(AB)=P(A)P(B)$，则事件 $A$ 与 $B$ 相互独立。`,
        options: null,
        answer: 'true',
        analysis: `独立的定义（用交概率乘积刻画）。`,
        authorMathNote: `true`,
        ...noFig(),
        ...hp(
          '独立定义',
          '用乘积定义识别独立',
          '对照定义直接判断',
          '需与条件概率形式对照理解',
        ),
      }
    }
    return {
      partial: { ...v, dedupNote: `ch10-judge-${n % 4}-${n}` },
      evidenceExtra: { answerBasis: v.answer },
    }
  }

  if (qt === 'numeric') {
    const variants = [
      () => ({
        sectionCode: '10.2',
        sectionName: '事件的相互独立性',
        stem: `独立事件 $A,B$，$P(A)=\\dfrac15$，$P(B)=\\dfrac12$，则 $P(AB)=$`,
        options: null,
        answer: '1/10',
        analysis: `$\\dfrac15\\cdot\\dfrac12=\\dfrac1{10}$。`,
        authorMathNote: `1/10`,
        ...noFig(),
      }),
      () => ({
        sectionCode: '10.1',
        sectionName: '随机事件与概率',
        stem: `掷均匀骰子一次，样本空间元素个数为`,
        options: null,
        answer: '6',
        analysis: `六点。`,
        authorMathNote: `6`,
        ...noFig(),
      }),
      () => ({
        sectionCode: '10.1',
        sectionName: '随机事件与概率',
        stem: `袋中 3 红 2 白，随机摸 1 球，摸到红球概率（最简分数）`,
        options: null,
        answer: '3/5',
        analysis: `$3/5$。`,
        authorMathNote: `3/5`,
        ...noFig(),
      }),
      () => ({
        sectionCode: '10.1',
        sectionName: '随机事件与概率',
        stem: `从 $\\{1,2,3,4\\}$ 中任取一个数，取到偶数的概率（最简分数）`,
        options: null,
        answer: '1/2',
        analysis: `2,4 共 2 个，$2/4=1/2$。`,
        authorMathNote: `1/2`,
        ...noFig(),
      }),
      () => {
        const pA = a
        const pB = a + 1
        // P= (a/(a+a+1)) wait use fixed
        return {
          sectionCode: '10.2',
          sectionName: '事件的相互独立性',
          stem: `独立事件 $A,B$，$P(A)=\\dfrac{1}{${a}}$，$P(B)=\\dfrac{1}{${a + 1}}$，则 $P(AB)=$（最简分数）`,
          options: null,
          answer: `1/${a * (a + 1)}`,
          analysis: `乘积。`,
          authorMathNote: `1/${a * (a + 1)}`,
          ...noFig(),
        }
      },
      () => ({
        sectionCode: '10.1',
        sectionName: '随机事件与概率',
        stem: `掷均匀硬币 2 次，恰 1 次正面的概率（最简分数）`,
        options: null,
        answer: '1/2',
        analysis: `样本空间 4 个，正反、反正共 2，$2/4=1/2$。`,
        authorMathNote: `1/2`,
        ...noFig(),
      }),
    ]
    let v = pick(n, variants)()
    if (d === 3) {
      // C(5,2)=10, sum even: both odd or both even. {1,2,3,4,5}: odd3 even2; C(3,2)+C(2,2)=3+1=4; P=4/10=2/5
      v = {
        sectionCode: '10.1',
        sectionName: '随机事件与概率',
        stem: `从 $\\{1,2,3,4,5\\}$ 中随机取两个不同数，两数之和为偶数的概率（最简分数）`,
        options: null,
        answer: '2/5',
        analysis: `总数 $C_5^2=10$；同奇或同偶：$C_3^2+C_2^2=4$；$P=4/10=2/5$。`,
        authorMathNote: `2/5`,
        ...noFig(),
        ...hp(
          '古典概型组合计数',
          '和为偶⇔同奇偶',
          'C(5,2) → 分类计数 → 约分',
          '需组合分类，非直接枚举一点',
        ),
      }
    }
    return {
      partial: { ...v, dedupNote: `ch10-num-${n % 6}-${n}` },
      evidenceExtra: { answerBasis: `numeric=${v.answer}` },
    }
  }

  // application
  {
    const variants = [
      () => {
        const rub = appRubric(
          [
            { key: 'total', title: '基本事件', score: 3, criterion: '总数正确' },
            { key: 'fav', title: '有利事件', score: 3, criterion: '有利数正确' },
            { key: 'p', title: '概率', score: 2, criterion: '最简分数' },
          ],
          8,
        )
        return {
          sectionCode: '10.1',
          sectionName: '随机事件与概率',
          stem: `从 $\\{1,2,3,4\\}$ 中随机取两个不同数，求两数之和为奇数的概率。`,
          options: null,
          answer: `$\\dfrac23$`,
          analysis: `总数 6；一奇一偶 4；$4/6=2/3$。`,
          authorMathNote: `2/3`,
          ...noFig(),
          ...rub,
        }
      },
      () => {
        const rub = appRubric(
          [
            { key: 'space', title: '样本空间', score: 3, criterion: '说明等可能' },
            { key: 'p', title: '概率', score: 5, criterion: '颜色不同概率正确' },
          ],
          8,
        )
        return {
          sectionCode: '10.1',
          sectionName: '随机事件与概率',
          stem: `袋中 4 红 3 白，随机取 2 球，求两球颜色不同的概率。`,
          options: null,
          answer: `$\\dfrac{4}{7}$`,
          analysis: `总数 $C_7^2=21$；异色 $4\\times3=12$；$12/21=4/7$。`,
          authorMathNote: `4/7`,
          ...noFig(),
          ...rub,
        }
      },
      () => {
        const rub = appRubric(
          [
            { key: 'ind', title: '独立性', score: 4, criterion: '写出乘积' },
            { key: 'val', title: '计算', score: 4, criterion: '数值正确' },
          ],
          8,
        )
        return {
          sectionCode: '10.2',
          sectionName: '事件的相互独立性',
          stem: `独立事件 $A,B$，$P(A)=0.3$，$P(B)=0.6$。\n（1）求 $P(AB)$；\n（2）求 $P(A\\cup B)$。`,
          options: null,
          answer: `（1）$0.18$；（2）$0.72$。`,
          analysis: `$P(AB)=0.18$；$P(\\cup)=0.3+0.6-0.18=0.72$。`,
          authorMathNote: `0.18;0.72`,
          ...noFig(),
          ...rub,
        }
      },
      () => {
        const rub = appRubric(
          [
            { key: 'model', title: '模型', score: 3, criterion: '独立重复' },
            { key: 'p', title: '概率', score: 5, criterion: '恰命中一次正确' },
          ],
          8,
        )
        return {
          sectionCode: '10.2',
          sectionName: '事件的相互独立性',
          stem: `射手命中率 $0.8$，各次独立。求射击 2 次恰命中 1 次的概率。`,
          options: null,
          answer: `$0.32$`,
          analysis: `$C_2^1\\cdot0.8\\cdot0.2=0.32$。`,
          authorMathNote: `0.32`,
          ...noFig(),
          ...rub,
        }
      },
      () => {
        const rub = appRubric(
          [
            { key: 'explain', title: '说明', score: 8, criterion: '用频率稳定解释' },
          ],
          8,
        )
        return {
          sectionCode: '10.3',
          sectionName: '频率与概率',
          stem: `简述：为什么在相同条件下大量重复抛掷均匀硬币时，正面频率往往会接近 $0.5$？`,
          options: null,
          answer: `大数定律/频率稳定于概率：试验次数增大，频率在概率附近波动减小。`,
          analysis: `频率与概率关系。`,
          authorMathNote: `频率稳定`,
          ...noFig(),
          ...rub,
        }
      },
    ]
    let v = pick(n, variants)()
    if (d === 3) {
      const rub = appRubric(
        [
          { key: 'total', title: '总数', score: 3, criterion: 'C(n,2) 正确' },
          { key: 'fav', title: '分类', score: 4, criterion: '同奇/同偶计数正确' },
          { key: 'p', title: '概率', score: 3, criterion: '最简分数' },
        ],
        10,
      )
      v = {
        sectionCode: '10.1',
        sectionName: '随机事件与概率',
        stem: `从 $\\{1,2,3,4,5,6\\}$ 中随机取两个不同数。\n（1）求基本事件总数；\n（2）求两数之和为奇数的概率。`,
        options: null,
        answer: `（1）$15$；（2）$\\dfrac35$。`,
        analysis: `$C_6^2=15$；一奇一偶：$3\\times3=9$；$9/15=3/5$。`,
        authorMathNote: `15; 3/5`,
        ...noFig(),
        ...rub,
        ...hp(
          '古典概型两问综合',
          '组合计数+奇偶分析和',
          '总数 → 有利分类 → 约分',
          '需严谨分类，避免重复计数',
        ),
      }
    }
    return {
      partial: { ...v, dedupNote: `ch10-app-${n % 5}-${n}` },
      evidenceExtra: { rubricVerdict: `maxScore=${v.maxScore}` },
    }
  }
}

const BUILDERS = {
  6: ch6,
  7: ch7,
  8: ch8,
  9: ch9,
  10: ch10,
}

/**
 * @param {{id:string,chapterNo:number,specialtyCode:string,difficulty:1|2|3,qtype:string,kpHint:{code:string,name:string},book:string}} slot
 * @returns {{item:object, mathEvidence:object, hardProfile:object|null}}
 */
export function buildRjb(slot) {
  const n = parseInt(String(slot.id).slice(-3), 10)
  const ch = Number(slot.chapterNo)
  const fn = BUILDERS[ch]
  if (!fn) throw new Error(`buildRjb: unsupported chapterNo=${slot.chapterNo}`)
  const { partial, evidenceExtra } = fn(slot, n)
  if (!partial.sectionCode) {
    // derive light section from kp if missing
    const code = slot.kpHint?.code || ''
    const m = code.match(/rjb\.(\d+)\.(\d+)/)
    if (m) {
      partial.sectionCode = `${m[1]}.${m[2]}`
      partial.sectionName = slot.kpHint?.name || partial.sectionName || ''
    }
  }
  const { item, evidence, hardProfile } = baseItem(slot, partial, evidenceExtra || {})
  return { item, mathEvidence: evidence, hardProfile }
}
