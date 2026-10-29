import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ev = (b, c, d, r) => ({
  nonObviousBreakthrough: b,
  aboveHard14H2Contrast: c,
  deepStrategyOrLayeredNecessity: d,
  routineKillCheck: r,
})
const rub = [
  { step: '定义域', score: 3 },
  { step: '转化推导', score: 5 },
  { step: '参数闭合', score: 4 },
]
function A(o) {
  return {
    chapterNo: 4,
    methodMain: 'equiv_transform',
    methodAux: 'classification',
    qtype: 'application',
    maxScore: 12,
    rubric: rub,
    diagramRequirement: 'NOT_NEEDED',
    sectionName:
      { '4.2': '指数函数', '4.3': '对数', '4.4': '对数函数', '4.5': '指数函数与对数函数综合' }[
        o.sectionCode
      ] || '指数与对数综合',
    hardLevelReason: o.breakthrough,
    h3Evidence: ev(o.breakthrough, o.contrastH2, o.deep || '定义域耦合', o.routine || '只化简'),
    ...o,
  }
}

const acceptedCh4 = [
  A({
    n: 46,
    sectionCode: '4.5',
    kpCode: 'rja.4.5.01',
    kpName: '指数与对数综合',
    modelFamily: 'h3-log-domain-param-bite',
    coreObjective: '对数不等式定义域与参数互咬',
    breakthrough: '先定定义域依赖a再谈不等式方向',
    contrastH2: 'HARD14指对化简壳',
    stem: '求实数 $a>1$，使对一切满足 $x>a$ 的 $x$ 都有 $\\log_a(x-1)\\ge \\log_a(x-a)$。',
    answer: '空集（在 $a>1$ 且 $x>a$ 时 $x-1>x-a\\Leftrightarrow a>1$ 恒真，但真数须正：需 $x>a\\ge1$ 时 $x-1>0$ 自动；而 $\\log_a$ 递增使不等式 $\\Leftrightarrow x-1\\ge x-a\\Leftrightarrow a\\ge1$，对 $a>1$ 恒真。故所有 $a>1$。）',
    analysis:
      '对 $a>1$，$\\log_a$ 增。定义域需 $x>a$（题设）且 $x>1$（真数 $x-1>0$）；因 $a>1$，$x>a$ 已含 $x>1$。不等式 $\\Leftrightarrow x-1\\ge x-a\\Leftrightarrow a\\ge1$，成立。故一切 $a>1$。',
  }),
  A({
    n: 47,
    sectionCode: '4.4',
    kpCode: 'rja.4.4.02',
    kpName: '对数函数性质',
    modelFamily: 'h3-log-base-param-ineq',
    coreObjective: '底数参数跨越1改变方向',
    breakthrough: '必须分0<a<1与a>1讨论方向',
    contrastH2: '固定底常规题',
    stem: '解关于 $x$ 的不等式 $\\log_a(x^{2}-3x+2)\\ge1$，其中 $a>0,a\\ne1$。按 $a$ 分类给出解集。',
    answer:
      '先真数 $>0$：$(x-1)(x-2)>0$，即 $x<1$ 或 $x>2$。当 $a>1$：等价 $x^{2}-3x+2\\ge a$，再与定义域交。当 $0<a<1$：不等式变向 $x^{2}-3x+2\\le a$，再交定义域。',
    analysis:
      '定义域 $(x-1)(x-2)>0$。$\\log_a t\\ge1=\\log_a a$：若 $a>1$ 则 $t\\ge a$；若 $0<a<1$ 则 $0<t\\le a$。再与定义域求交。',
  }),
  A({
    n: 48,
    sectionCode: '4.2',
    kpCode: 'rja.4.2.02',
    kpName: '指数函数性质',
    modelFamily: 'h3-exp-two-base-intersect',
    coreObjective: '两指数方程交点参数',
    breakthrough: '化同一底或取对数后分析单调交点个数',
    contrastH2: '单指数方程',
    stem: '求实数 $k$，使方程 $2^{x}=k\\cdot 3^{x}$ 有解，并求有解时的解。',
    answer: '对一切 $k>0$ 有唯一解 $x=\\log_{2/3}k$；等价 $x=\\ln k/\\ln(2/3)$。$k\\le0$ 无解。',
    analysis: '$(2/3)^{x}=k$。左边恒正，故 $k>0$，且对 $k>0$ 唯一 $x$。',
  }),
  A({
    n: 49,
    sectionCode: '4.5',
    kpCode: 'rja.4.5.02',
    kpName: '指数与对数综合',
    modelFamily: 'h3-exp-log-composite-domain',
    coreObjective: '复合对数指数定义域耦合',
    breakthrough: '内层指数值域限制外层对数真数',
    contrastH2: '分步化简无耦合',
    stem: '求函数 $f(x)=\\log_{2}(4^{x}-a\\cdot 2^{x}+1)$ 的定义域为 $\\mathbb{R}$ 的充要条件（对参数 $a$）。',
    answer: '令 $t=2^{x}>0$，需对一切 $t>0$ 有 $t^{2}-a t+1>0$。⇔Δ<0 或（Δ≥0但根不落正）即 $a^{2}-4<0\\Leftrightarrow |a|<2$。当 $|a|=2$ 时切于 $t=1$，值为0，真数不大于0，失败。故 $|a|<2$。',
    analysis: '对一切 $t>0$，$t^{2}-at+1>0$。最小值：若 $|a|<2$，Δ<0恒正；若 $|a|=2$，在 $t=1$ 取0不入；若 $|a|>2$ 有正根使区间非正。故 $|a|<2$。',
  }),
  A({
    n: 50,
    sectionCode: '4.3',
    kpCode: 'rja.4.3.02',
    kpName: '对数运算',
    modelFamily: 'h3-change-base-identity-constraint',
    coreObjective: '换底公式下的参数恒等约束',
    breakthrough: '恒等式对一切真数成立强制系数关系',
    contrastH2: '单次数值换底',
    stem: '设 $a>0,a\\ne1,b>0,b\\ne1$。若对一切 $x>0,x\\ne1$ 有 $\\log_a x= b\\log_x a$，求 $b$，并求此时 $a$ 与底的关系是否还受限。',
    answer: '由换底 $\\log_a x=\\frac{1}{\\log_x a}$，故 $\\frac{1}{\\log_x a}=b\\log_x a\\Rightarrow b(\\log_x a)^{2}=1$。要对一切 $x$ 成立不可能（左边随x变）。故无这样的 $b$。若改题为存在 $x$：则 $b=1/(\\log_x a)^{2}>0$。最终按原题：不存在常数 $b$ 使对一切 $x$ 成立。',
    analysis: '换底得 $\\log_a x=1/\\log_x a$，故需 $b(\\log_x a)^{2}=1$ 对一切合格 $x$，不可能。答案：不存在。',
  }),
]

fs.writeFileSync(
  path.join(__dirname, '_accepted_ch4.mjs'),
  '/** Ch4 ×5 ACCEPTED_H3 */\nexport const acceptedCh4 = ' +
    JSON.stringify(acceptedCh4, null, 2) +
    '\n',
)
console.log('ch4', acceptedCh4.length)
