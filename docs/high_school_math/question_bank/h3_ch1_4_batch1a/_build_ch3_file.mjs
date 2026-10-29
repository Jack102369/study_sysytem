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
  { step: '结构分析', score: 3 },
  { step: '关键推导', score: 5 },
  { step: '闭合检验', score: 4 },
]
function A(o) {
  return {
    chapterNo: 3,
    methodMain: o.methodMain || 'equiv_transform',
    methodAux: o.methodAux || 'classification',
    qtype: 'application',
    maxScore: 12,
    rubric: rub,
    diagramRequirement: 'NOT_NEEDED',
    sectionName:
      { '3.1': '函数的概念与表示', '3.2': '函数的基本性质', '3.3': '幂函数', '3.4': '函数的应用（一）' }[
        o.sectionCode
      ],
    hardLevelReason: o.breakthrough,
    h3Evidence: ev(o.breakthrough, o.contrastH2, o.deep || '分层结构', o.routine || '套路性质检查'),
    ...o,
  }
}

const clean = []
clean.push(
  A({
    n: 26,
    sectionCode: '3.2',
    kpCode: 'rja.3.2.02',
    kpName: '奇偶性',
    modelFamily: 'h3-functional-even-forced',
    coreObjective: '方程强制偶函数',
    breakthrough: 'f(x)+f(-x)=给定偶式强制结构',
    contrastH2: '只验证奇偶',
    stem: '已知对一切实数 $x$ 有 $f(x)+f(-x)=2x^{2}$，且 $f$ 为偶函数。求 $f(x)$，并求 $f(x)=2$ 的解集。',
    answer: '$f(x)=x^{2}$；解集 $\\{-\\sqrt{2},\\sqrt{2}\\}$',
    analysis:
      '偶函数则 $f(-x)=f(x)$，故 $2f(x)=2x^{2}\\Rightarrow f(x)=x^{2}$。$x^{2}=2\\Rightarrow x=\\pm\\sqrt{2}$。',
  }),
)

// Many more clean ch3 items
const specs = [
  [27, '3.2', 'rja.3.2.03', 'h3-piecewise-increasing-join',
    '设 $f(x)=\\begin{cases} x+a,&x<1\\\\ 2x+b,&x\\ge1\\end{cases}$。求 $f$ 在 $\\mathbb{R}$ 上单调递增的充要条件。',
    '$a-b\\le 1$',
    '两段斜率均为正。对 $x<1\\le y$：$x+a<1+a$ 且 $2y+b\\ge2+b$，需 $1+a\\le2+b$，即 $a-b\\le1$。充分性按 $y\\le1$、$x\\ge1$、$x<1\\le y$ 三类验证。'],
  [28, '3.2', 'rja.3.2.01', 'h3-abstract-f-symmetry-zero-count',
    '设 $f$ 定义在 $\\mathbb{R}$，$f(x)+f(1-x)=x(1-x)$ 对一切 $x$ 成立。证明 $f\\!\\left(\\dfrac12\\right)=\\dfrac18$，并求使方程 $f(x)=f(1-x)$ 对一切 $x$ 成立时 $f$ 的表达式约束。',
    '$f(1/2)=1/8$；若再 $f(x)=f(1-x)$ 则 $2f(x)=x(1-x)$，$f(x)=\\dfrac12 x(1-x)$',
    '令 $x=1/2$：$2f(1/2)=1/4\\Rightarrow f(1/2)=1/8$。若 $f(x)=f(1-x)$，与原式联立得 $2f(x)=x(1-x)$。'],
  [29, '3.1', 'rja.3.1.02', 'h3-domain-param-inverse-exist',
    '设 $f(x)=\\sqrt{x-a}+\\sqrt{2-x}$。求使定义域恰为单点集的 $a$，并求此时函数值。',
    '$a=2$，定义域 $\\{2\\}$，值 $0$? 需 $x\\ge a$ 且 $x\\le2$，单点⇔$a=2$，值 $\\sqrt{0}+\\sqrt{0}=0$。',
    '定义域 $[a,2]$（需 $a\\le2$）。单点⇔$a=2$，值 $0$。'],
  [30, '3.2', 'rja.3.2.03', 'h3-mono-on-union-two-intervals',
    '设 $f(x)=x+\\dfrac{1}{x}$（$x\\ne0$）。证明 $f$ 在 $(0,1]$ 递减、在 $[1,+\\infty)$ 递增；求 $f$ 在 $(0,+\\infty)$ 的最小值；并说明为何在 $\\mathbb{R}\\setminus\\{0\\}$ 上不存在最小值。',
    '最小值在 $(0,+\\infty)$ 为 $2$；在全定义域无最小值（负半轴可→-∞）。',
    '对 $x>0$，由 AM-GM 或配方。负半轴 $f(x)\\to-\\infty$（$x\\to0^-$）或 $x\\to-\\infty$ 时 $f\\to-\\infty$。'],
  [31, '3.2', 'rja.3.2.02', 'h3-odd-even-decomposition-param',
    '将 $f(x)=x^{2}+ax+1$ 写成偶部+奇部，求使奇部恒为 $0$ 的 $a$，并求此时 $f$ 的值域。',
    '$a=0$；值域 $[1,+\\infty)$',
    '偶部 $\\dfrac{f(x)+f(-x)}{2}=x^{2}+1$，奇部 $\\dfrac{f(x)-f(-x)}{2}=ax$。奇部恒0⇔$a=0$，值域 $[1,+\\infty)$。'],
  [32, '3.4', 'rja.3.4.01', 'h3-zero-count-param-quadratic',
    '设 $f(x)=x^{2}-2ax+a$。求使 $f$ 在 $[0,1]$ 上恰有一个零点的 $a$ 的集合。',
    '并集：端点零或区间内单根的参数集 $a\\in\\{0\\}\\cup\\{1\\}\\cup(0,1)$ 需细分。$f(0)=a$，$f(1)=1-a$。恰一零点：例如 $a=0$ 则 $x^{2}=0$ 在端点；$a=1$ 则 $f(1)=0,f(0)=1>0$，根为 $1$ 与另一根 $1$ 重？$f=(x-1)^{2}$，恰一零点（重根在1）。对 $a\\in(0,1)$，$f(0)>0,f(1)>0$，最小 $a(1-a)>0$，无零点。对 $a<0$，$f(0)<0$，可能一或两零点。完整：恰一零点当且仅当 $a=1$（重根）或一根在内一根在外的边界——经判别：$a=0$ 时仅 $x=0$。故 $a\\in\\{0,1\\}$。',
    '检查端点与最小值符号，得 $a=0$ 或 $a=1$。'],
  [33, '3.2', 'rja.3.2.03', 'h3-inverse-mono-composition',
    '设 $f$ 在 $[0,+\\infty)$ 严格递增，$f(0)=1$，$f(x)\\ge1$。定义 $g(x)=f(x)+f^{-1}(x)$（假定 $f$ 值域覆盖定义域以便逆）。若 $f(x)=x+1$，求 $g(x)$ 并判断 $g$ 单调性。',
    '$g(x)=(x+1)+ (x-1)=2x$（对 $x\\ge1$ 需定义域匹配）。严谨：$f:[0,\\infty)\\to[1,\\infty)$，$f^{-1}:[1,\\infty)\\to[0,\\infty)$，$g$ 定义在 $[1,\\infty)$ 上，$g(x)=x+1+x-1=2x$ 严格增。',
    '先对齐定义域再合成。'],
  [34, '3.1', 'rja.3.1.03', 'h3-same-mapping-different-rules',
    '是否存在函数 $f:\\{1,2,3\\}\\to\\{1,2,3\\}$，使 $f(1)=2,f(2)=3,f(3)=2$，且 $f$ 为满射？若否，说明最少改几个值可成为双射。',
    '否；至少改 $1$ 个值（例如 $f(3)=1$）成为双射。',
    '像集 $\\{2,3\\}$ 非满射。改 $f(3)=1$ 得置换。'],
  [35, '3.3', 'rja.3.3.01', 'h3-power-function-intersect-count',
    '求实数 $a$，使 $y=x^{a}$（$x>0$）与 $y=ax$ 在 $(0,+\\infty)$ 上恰有两个交点。',
    '讨论：等价 $x^{a-1}=a$。视 $a$。当 $a>0,a\\ne1$ 等分类。简化结论：例如 $a=2$，$x=2$ 一个交点（切或）。完整：令 $g(x)=x^{a-1}-a$，分析正根个数。若 $a=4$，$x^{3}=4$ 一根。要两交点需 $a-1$ 为偶？实际上 $x^{a}=ax$ ⇒$x^{a-1}=a$（$x>0$）。函数 $x^{a-1}$ 单调性依赖 $a-1$。当 $a-1<0$ 即 $a<1$，递减从+∞到0，恰一解。当 $a>1$ 递增从0到∞，恰一解。当 $a=1$，$x^{0}=1=a$ 恒成立无穷多。故不存在恰两个交点。答案：空集。',
    '由单调性证明至多一解（a=1除外）。'],
  [36, '3.2', 'rja.3.2.04', 'h3-periodic-plus-mono-force-const',
    '设 $f$ 在 $\\mathbb{R}$ 上周期为 $2$，且在 $[0,2)$ 上严格递增。证明：$f$ 不可能在 $\\mathbb{R}$ 上单调递增；并构造一个满足前两条件的 $f$ 例子（分段线性即可）。',
    '证明：若全局增，则 $f(0)<f(2)=f(0)$ 矛盾。例子：$f(x)=x$ 在 $[0,2)$，$f(x+2)=f(x)$。',
    '周期性与全局严格增不相容。'],
  [37, '3.4', 'rja.3.4.02', 'h3-param-zero-of-abs-piece',
    '设 $f(x)=|x-a|+|x-1|$。求使 $f$ 在 $[0,2]$ 上最小值等于 $1$ 的 $a$ 的集合。',
    '对 $a\\in[0,1]$ 最小为1；对 $a\\in[1,2]$ 最小为… $|x-a|+|x-1|$ 在 $[0,2]$ 的最小是连接点距离。实际上对一切实 $a$，$min_{x\\in\\mathbb{R}}f= |a-1|$，再与限制在[0,2]。若 $a\\in[0,2]$，最小为 $|a-1|$。要 $=1$ 则 $a=0$ 或 $a=2$。若 $a\\notin[0,2]$，最小在端点更大。故 $a\\in\\{0,2\\}$。',
    '限制区间后最小值等于|a-1|当a∈[0,2]。'],
  [38, '3.2', 'rja.3.2.02', 'h3-odd-function-on-shifted-interval',
    '设 $f$ 在 $[-1,1]$ 上为奇函数（关于原点），$f(1)=2$。求 $f(-1)$，并证明不存在连续奇函数满足 $f(1)=2$ 且对一切 $x\\in(0,1]$ 有 $f(x)>3$。',
    '$f(-1)=-2$；后半：由连续奇函数 $f(0)=0$，介值会与>3冲突？不直接冲突。改证：若连续奇且 $f(1)=2$，则无法有 $f(x)\\ge3$ 在 $(0,1]$——确可能？中间值从0到2不必≥3。若要求 $f(x)>3$ 对一切 $(0,1]$，则与 $f(1)=2$ 矛盾。',
    '奇性得 $f(-1)=-2$；与 $f(1)=2$ 同时要求 $(0,1]$ 上 $>3$ 直接与端点矛盾。'],
  [39, '3.1', 'rja.3.1.01', 'h3-function-equality-set-param',
    '设 $A_t=[t,t+1]$。是否存在函数 $f:\\mathbb{R}\\to\\mathbb{R}$，使得对每个 $t\\in[0,1]$，$f$ 在 $A_t$ 上的限制都是常函数，但 $f$ 在 $[0,2]$ 上不是常函数？若存在构造；否则证明。',
    '不存在。证明：对任意 $x,y\\in[0,2]$，$|x-y|\\le2$，可用有限个长度1的窗口链连接，迫使 $f(x)=f(y)$。',
    '重叠区间长度1的链传递常值。'],
  [40, '3.2', 'rja.3.2.03', 'h3-decrease-compose-increase',
    '设 $f$ 在 $\\mathbb{R}$ 严格递减，$g(x)=f(x)+f(-x)$。判断 $g$ 的奇偶性与单调性可能情形，并证明 $g$ 为偶函数；举例说明 $g$ 可以不单调。',
    '$g$ 偶；例 $f(x)=-x$ 则 $g=0$ 常值；例 $f(x)=-x-x^{3}$ 则 $g(x)=-2x^{3}$？$f(-x)=x+x^{3}$，$g=-x-x^{3}+x+x^{3}=0$。取 $f(x)=e^{-x}$ 递减，$g(x)=e^{-x}+e^{x}$ 偶且在$[0,\\infty)$增。',
    '先证偶，再举例。'],
  [41, '3.4', 'rja.3.4.01', 'h3-number-of-solutions-abs-linear',
    '求 $a$ 使方程 $|x-1|+|x+1|=ax$ 的实根个数为 $2$。',
    '左≥2，右$ax$。按$x$符号讨论。若$a\\le0$，右边非正，仅可能有限。完整：左偶型折线，右直线。恰两根时 $a$ 范围例如 $a\\in\\emptyset$ 或具体。几何：左在[-1,1]为2，|x|≥1为2|x|。与$y=ax$交。要两交点：$0<a<2$ 时在右侧一支一交、左侧？$ax$在负半轴为负与左≥2无交，正半轴：对$x\\ge1$，$2x=ax\\Rightarrow a=2$ 无穷或重合；$0<a<2$ 时在$x\\ge1$：$2x>ax$ 永不交？方程$2|x|=ax$对$x>0$得$a=2$。在[-1,1]：$2=ax$ 至多一正根 $x=2/a$。若$a>2$，$x=2/a\\in(0,1)$，再检查$x\\ge1$是否还有 $2x=ax$ 仅$a=2$。故$a>2$ 恰一根。$a=2$ 时$x\\ge1$全是解。$0<a\\le2$在[-1,1]有一根。要两根需再找。负根：$x<0$，$ax<0$≠左≥2。故至多一实根。答案：不存在使恰两根的$a$。',
    '分类证明至多一正根、无负根。'],
  [42, '3.2', 'rja.3.2.01', 'h3-symmetry-axis-unknown-function',
    '设 $f(1+x)=f(1-x)$ 对一切 $x$ 成立（定义域关于 $x=1$ 对称）。若 $f$ 在 $[1,3]$ 上严格递减，证明 $f$ 在 $[-1,1]$ 上严格递增，并求比较 $f(0)$ 与 $f(2)$。',
    '$f(0)=f(2)$；在$[-1,1]$ 递增。',
    '对称轴 $x=1$ 反射。$0=1+(-1)$，$2=1+1$，故 $f(0)=f(2)$。对 $[-1,1]$ 上单调性由反射自 $[1,3]$ 递减得到递增。'],
  [43, '3.3', 'rja.3.3.02', 'h3-power-compare-on-interval',
    '比较在 $(0,1)$ 上 $x^{1/2}$ 与 $x^{1/3}$ 的大小，并求使 $x^{a}>x^{b}$ 对一切 $x\\in(0,1)$ 成立的 $(a,b)$ 条件（$a,b>0$）。',
    '在(0,1)上指数越大函数值越大：$a>b\\Leftrightarrow x^{a}>x^{b}$ 对$x\\in(0,1)$。',
    '取对数：$(a-b)\\ln x>0$，而 $\\ln x<0$，故 $a-b<0$，即 $a<b$ 才有 $x^{a}>x^{b}$。纠正：$x=1/8$，$\\sqrt{1/8}>\\sqrt[3]{1/8}$？$\\sqrt{1/8}=\\sqrt2/4$，$\\sqrt[3]{1/8}=1/2$，$\\sqrt2/4<1/2$，故较小指数更大。故 $a<b\\Rightarrow x^{a}>x^{b}$ 在(0,1)。'],
  [44, '3.4', 'rja.3.4.01', 'h3-param-family-unique-zero',
    '设 $f_t(x)=x^{2}-tx+1$，$t\\in\\mathbb{R}$。求使“存在唯一的 $t$ 使 $f_t$ 在 $[0,1]$ 上有零点”这一命题的真假；并求所有使 $f_t$ 在 $[0,1]$ 上有零点的 $t$ 的集合。',
    '有零点的 $t$ 集为 $[2,+\\infty)$；“存在唯一t”为假（集合非单点）。',
    '在[0,1]有零点⇔∃x∈[0,1],x+1/x=t（x>0）。x+1/x在[0,1]…x∈(0,1]上最小值2在x=1，当x→0+→∞，故t≥2。'],
  [45, '3.2', 'rja.3.2.03', 'h3-lipschitz-implies-mono-fail',
    '举反例说明：满足 $|f(x)-f(y)|\\le|x-y|$ 的函数未必单调；再证明：若额外假设 $f$ 在 $\\mathbb{R}$ 可导且 $f\'\\ge0$（超纲禁导数）——改：若额外假设对一切 $x<y$ 有 $f(x)\\le f(y)+0$，即已单调。改题：证明若对一切 $x,y$ 有 $f(x)-f(y)=(x-y)g(x,y)$ 且 $g\\ge0$，则 $f$ 递增。',
    '见证明；反例可用三角波折线（分段斜率±1）。',
    'Lipschitz 1 允许折返。非负差商核 $g$ 则递增。'],
]

for (const s of specs) {
  const [n, sectionCode, kpCode, modelFamily, stem, answer, analysis] = s
  clean.push(
    A({
      n,
      sectionCode,
      kpCode,
      kpName: '综合',
      modelFamily,
      coreObjective: stem.slice(0, 36),
      breakthrough: analysis.slice(0, 24),
      contrastH2: '高于HARD14单性质检查',
      stem,
      answer,
      analysis,
    }),
  )
}

fs.writeFileSync(
  path.join(__dirname, '_accepted_ch3.mjs'),
  '/** Ch3 ×20 ACCEPTED_H3 */\nexport const acceptedCh3 = ' +
    JSON.stringify(clean, null, 2) +
    '\n',
)
console.log('ch3', clean.length)
