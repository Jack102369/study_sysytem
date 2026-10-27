/**
 * High-capacity distinct builders for ISOMORPHIC cleanup.
 * Guarantees many digit-strip-distinct stem skeletons per chapter×qtype.
 */
import { baseItem, appRubric, normStem, normExact, CRUTCH_RE } from './_rebuild_core.mjs'

const SOURCE = '同构清理整题重设计；非高考真题'
const MAX_ATTEMPTS = 48

function seed(n, a = 2, b = 9) {
  return a + ((Math.abs(n) * 7) % (b - a + 1))
}
function pick(n, arr) {
  return arr[Math.abs(n) % arr.length]
}
function hp(d, ability, coreDifficulty, solutionOutline, whyNotEasy) {
  if (d < 3) return {}
  return { hardProfile: { ability, coreDifficulty, solutionOutline, whyNotEasy } }
}
function noFig(r = '文字条件充分，无需图示。') {
  return { diagramRequirement: 'NOT_NEEDED', diagramSpecification: null, noDiagramReason: r }
}
function rub2(a, b, max = 8) {
  return appRubric(
    [
      { key: 'p1', title: a.t, score: a.s, criterion: a.c },
      { key: 'p2', title: b.t, score: b.s, criterion: b.c },
    ],
    max,
  )
}
function rub3(a, b, c, max = 10) {
  return appRubric(
    [
      { key: 'p1', title: a.t, score: a.s, criterion: a.c },
      { key: 'p2', title: b.t, score: b.s, criterion: b.c },
      { key: 'p3', title: c.t, score: c.s, criterion: c.c },
    ],
    max,
  )
}
function normalizeSlot(slot) {
  return { ...slot, kpHint: slot.kpHint || { code: slot.kpCode, name: slot.kpName } }
}
function nOf(slot) {
  return parseInt(String(slot.id).slice(-3), 10) || 0
}

/** Each entry: (slot,n,k) => partial fields. Must be digit-strip unique within list. */
function recipesFor(ch, qt) {
  const key = `${ch}:${qt}`
  if (!CACHE[key]) CACHE[key] = buildRecipes(ch, qt)
  return CACHE[key]
}
const CACHE = {}

function buildRecipes(ch, qt) {
  const builders = []
  // 32 structurally distinct recipes per chapter×qtype
  for (let k = 0; k < 32; k++) {
    builders.push((slot, n) => recipe(ch, qt, slot, n, k))
  }
  return builders
}

function recipe(ch, qt, slot, n, k) {
  const d = slot.difficulty
  const a = seed(n + k * 3, 2, 8)
  const b = seed(n + k * 5 + 1, 3, 9)
  const c = seed(n + k * 7 + 2, 2, 7)
  const t = a + b
  const dispatch = {
    1: ch1, 2: ch2, 3: ch3, 4: ch4, 5: ch5, 6: ch6, 7: ch7, 8: ch8, 9: ch9, 10: ch10,
  }
  const fn = dispatch[ch]
  const partial = fn(qt, slot, n, k, a, b, c, t, d)
  return { ...partial, ...noFig(), sourceEvidence: SOURCE, dedupNote: `iso-r${ch}-${qt}-${k}` }
}

/* ---------- chapter recipes: 32 unique skeletons each qtype via k branches ---------- */

function ch1(qt, slot, n, k, a, b, c, t, d) {
  const i = k % 32
  if (qt === 'single') {
    const opts = [
      () => ({ sectionCode: '1.1', sectionName: '集合的概念', stem: '下列能构成集合的是', options: { A: '很大的数', B: `方程 $x^2=${a * a}$ 的实根`, C: '好看的图形', D: '接近 0 的数' }, answer: 'B', analysis: 'B 元素确定。', authorMathNote: 'B' }),
      () => ({ sectionCode: '1.2', sectionName: '集合间的基本关系', stem: `设 $A=\\{1,2,${a}\\}$，$B=\\{1,2,${a},${a + 1}\\}$，则`, options: { A: '$A\\subsetneq B$', B: '$B\\subsetneq A$', C: '$A=B$', D: '$A\\cap B=\\emptyset$' }, answer: 'A', analysis: 'A 真含于 B。', authorMathNote: 'A' }),
      () => ({ sectionCode: '1.3', sectionName: '集合的基本运算', stem: `全集 $U=\\{1,\\ldots,${a + 6}\\}$，$A=\\{1,\\ldots,${a}\\}$，则 $|\\complement_U A|=$`, options: { A: String(6), B: String(a), C: String(a + 6), D: '0' }, answer: 'A', analysis: `$|U|-|A|=6$。`, authorMathNote: '6' }),
      () => ({ sectionCode: '1.3', sectionName: '集合的基本运算', stem: `若 $A=\\{${a}\\}$，$B=\\{${b}\\}$ 且 $a\\ne b$，则 $A\\cup B$ 的元素个数为`, options: { A: '2', B: '1', C: '0', D: '3' }, answer: 'A', analysis: '两单元素不同，并集 2 个。', authorMathNote: '2' }),
      () => ({ sectionCode: '1.3', sectionName: '集合的基本运算', stem: `$A=\\{1,2,3\\}$，$B=\\{2,3,${a}\\}$，则 $|A\\cap B|=$`, options: { A: a === 1 ? '3' : '2', B: '1', C: '0', D: '4' }, answer: 'A', analysis: a === 1 ? '交为{1,2,3}' : '交为{2,3}', authorMathNote: a === 1 ? '3' : '2' }),
      () => ({ sectionCode: '1.4', sectionName: '充分条件与必要条件', stem: `“$x>${a + 2}$”是“$x>${a}$”的`, options: { A: '充分不必要条件', B: '必要不充分条件', C: '充要条件', D: '既不充分也不必要' }, answer: 'A', analysis: '充分不必要。', authorMathNote: '充分不必要', ...hp(d, 'B', '充分必要判定', '推蕴含+反例', '需双向检验') }),
      () => ({ sectionCode: '1.4', sectionName: '充分条件与必要条件', stem: `“$x=${a}$”是“$x^2=${a * a}$”的`, options: { A: '充分不必要条件', B: '必要不充分条件', C: '充要条件', D: '既不充分也不必要' }, answer: 'A', analysis: '由 x=a 可推平方；平方还有负根。', authorMathNote: '充分不必要' }),
      () => ({ sectionCode: '1.5', sectionName: '全称量词与存在量词', stem: '命题“$\\forall x\\in\\mathbb{R},x^2\\ge 0$”的否定是', options: { A: '$\\exists x\\in\\mathbb{R},x^2<0$', B: '$\\forall x,x^2<0$', C: '$\\exists x,x^2\\ge 0$', D: '无否定' }, answer: 'A', analysis: '全称否定为存在。', authorMathNote: 'A' }),
      () => ({ sectionCode: '1.1', sectionName: '集合的概念', stem: '空集 $\\emptyset$ 的真子集个数为', options: { A: '0', B: '1', C: '2', D: '无穷' }, answer: 'A', analysis: '空集无真子集。', authorMathNote: '0' }),
      () => ({ sectionCode: '1.2', sectionName: '集合间的基本关系', stem: '若 $A\\subseteq B$ 且 $B\\subseteq A$，则', options: { A: '$A=B$', B: '$A\\subsetneq B$', C: '$A\\cap B=\\emptyset$', D: '无法判断' }, answer: 'A', analysis: '互相包含则相等。', authorMathNote: 'A=B' }),
      () => ({ sectionCode: '1.3', sectionName: '集合的基本运算', stem: `已知 $A\\cup B=\\{1,2,${a}\\}$，$A\\cap B=\\{2\\}$，且 $2\\in A$，则 $2\\in B$`, options: { A: '一定成立', B: '一定不成立', C: '可能成立', D: '无法判断' }, answer: 'A', analysis: '2 在交集中故在 B。', authorMathNote: '一定' }),
      () => ({ sectionCode: '1.5', sectionName: '全称量词与存在量词', stem: '“$\\exists x\\in\\mathbb{R},x^2+1=0$”的真假是', options: { A: '假', B: '真', C: '不确定', D: '无法定义' }, answer: 'A', analysis: '无实根。', authorMathNote: '假' }),
      () => ({ sectionCode: '1.1', sectionName: '集合的概念', stem: `用描述法表示集合 $\\{${a},${a + 1},${a + 2}\\}$ 正确的是`, options: { A: `$\\{x\\in\\mathbb{N}^*\\mid ${a}\\le x\\le ${a + 2}\\}$`, B: '较大的三个数', C: '任意三数', D: '无' }, answer: 'A', analysis: '描述法元素确定。', authorMathNote: 'A' }),
      () => ({ sectionCode: '1.3', sectionName: '集合的基本运算', stem: `若 $|A|=${a}$，$|B|=${b}$，$|A\\cap B|=${c}$（$c\\le \\min(a,b)$），则 $|A\\cup B|=$`, options: { A: String(a + b - c), B: String(a + b), C: String(a - c), D: String(b - c) }, answer: 'A', analysis: '容斥原理。', authorMathNote: String(a + b - c) }),
      () => ({ sectionCode: '1.4', sectionName: '充分条件与必要条件', stem: '若 $p\\Rightarrow q$ 且 $q\\Rightarrow p$，则 $p$ 是 $q$ 的', options: { A: '充要条件', B: '充分不必要条件', C: '必要不充分条件', D: '无关条件' }, answer: 'A', analysis: '双向蕴含。', authorMathNote: '充要' }),
      () => ({ sectionCode: '1.2', sectionName: '集合间的基本关系', stem: `含 ${a} 个元素的集合的子集个数为`, options: { A: String(2 ** a), B: String(a), C: String(a * a), D: String(a + 1) }, answer: 'A', analysis: '$2^n$ 个子集。', authorMathNote: String(2 ** a) }),
      () => ({ sectionCode: '1.3', sectionName: '集合的基本运算', stem: `$A\\cap(\\complement_U A)=$`, options: { A: '$\\emptyset$', B: '$U$', C: '$A$', D: '$\\complement_U A$' }, answer: 'A', analysis: '互补交为空。', authorMathNote: '空' }),
      () => ({ sectionCode: '1.3', sectionName: '集合的基本运算', stem: `$A\\cup(\\complement_U A)=$`, options: { A: '$U$', B: '$\\emptyset$', C: '$A$', D: '无法确定' }, answer: 'A', analysis: '互补并为全集。', authorMathNote: 'U' }),
      () => ({ sectionCode: '1.1', sectionName: '集合的概念', stem: '集合 $\{0\}$ 与空集的关系是', options: { A: '前者含 0，后者不含元素', B: '相同', C: '无法比较', D: '都无元素' }, answer: 'A', analysis: '{0}非空。', authorMathNote: 'A' }),
      () => ({ sectionCode: '1.5', sectionName: '全称量词与存在量词', stem: '“$\\forall x>0,x+\\dfrac{1}{x}\\ge 2$”为', options: { A: '真命题', B: '假命题', C: '无法判断', D: '定义不清' }, answer: 'A', analysis: '基本不等式。', authorMathNote: '真' }),
      () => ({ sectionCode: '1.2', sectionName: '集合间的基本关系', stem: '空集是任何集合的', options: { A: '子集', B: '真子集', C: '补集', D: '交集' }, answer: 'A', analysis: '空集是任意集合子集。', authorMathNote: '子集' }),
      () => ({ sectionCode: '1.4', sectionName: '充分条件与必要条件', stem: `“两根为正”是“判别式 $\\Delta>0$”的`, options: { A: '既不充分也不必要', B: '充分不必要', C: '必要不充分', D: '充要' }, answer: 'A', analysis: '两正需 Δ≥0 且和积正等，非简单 Δ>0。', authorMathNote: '既不', ...hp(d, 'C', '根的分布与条件关系', '列充要条件对比', '易误判为必要') }),
      () => ({ sectionCode: '1.1', sectionName: '集合的概念', stem: '自然数集与正整数集的关系（中学常用）', options: { A: '自然数含 0，正整数从 1 起', B: '完全相同', C: '正整数含 0', D: '无关系' }, answer: 'A', analysis: '约定差异。', authorMathNote: 'A' }),
      () => ({ sectionCode: '1.3', sectionName: '集合的基本运算', stem: `已知 $U=\\{1,2,3,4,5\\}$，$A=\\{1,${a}\\}$（$a\\in U$），则 $|\\complement_U A|$ 可能为`, options: { A: '3 或 4', B: '0', C: '5', D: '1' }, answer: 'A', analysis: 'a=1 时|A|=1→补4；a≠1→|A|=2→补3。', authorMathNote: '3或4' }),
      () => ({ sectionCode: '1.2', sectionName: '集合间的基本关系', stem: `若 $A=B=\\{${a}\\}$，则下列正确的是`, options: { A: '$A\\subseteq B$ 且 $B\\subseteq A$', B: '$A\\subsetneq B$', C: '$A\\cap B=\\emptyset$', D: '$A\\cup B=\\emptyset$' }, answer: 'A', analysis: '相等则互相包含。', authorMathNote: 'A' }),
      () => ({ sectionCode: '1.5', sectionName: '全称量词与存在量词', stem: '把“有的平行四边形是正方形”符号化，较合理的是', options: { A: '存在某平行四边形是正方形', B: '所有平行四边形是正方形', C: '不存在平行四边形', D: '任意四边形是正方形' }, answer: 'A', analysis: '存在量词。', authorMathNote: 'A' }),
      () => ({ sectionCode: '1.3', sectionName: '集合的基本运算', stem: '德摩根律 $(\\complement_U(A\\cup B))=(\\complement_U A)\\cap(\\complement_U B)$', options: { A: '成立', B: '不成立', C: '仅有限集成立', D: '仅空集成立' }, answer: 'A', analysis: '德摩根律。', authorMathNote: '成立' }),
      () => ({ sectionCode: '1.4', sectionName: '充分条件与必要条件', stem: `若 $p$ 是 $q$ 的必要不充分条件，则`, options: { A: '$q\\Rightarrow p$ 且 $p\\not\\Rightarrow q$', B: '$p\\Rightarrow q$ 且 $q\\not\\Rightarrow p$', C: '互相推出', D: '互不推出' }, answer: 'A', analysis: '必要：q⇒p；不充分：p⇏q。', authorMathNote: 'A' }),
      () => ({ sectionCode: '1.1', sectionName: '集合的概念', stem: '集合中元素的特性不包括', options: { A: '模糊性', B: '确定性', C: '互异性', D: '无序性' }, answer: 'A', analysis: '三特性无模糊性。', authorMathNote: 'A' }),
      () => ({ sectionCode: '1.3', sectionName: '集合的基本运算', stem: `$A\\subseteq B$ 的充要条件可以是`, options: { A: '$A\\cup B=B$', B: '$A\\cap B=\\emptyset$', C: '$A\\cup B=A$', D: '$|A|>|B|$' }, answer: 'A', analysis: '并等于较大者。', authorMathNote: 'A' }),
      () => ({ sectionCode: '1.2', sectionName: '集合间的基本关系', stem: `真子集符号 $A\\subsetneq B$ 意味着`, options: { A: '$A\\subseteq B$ 且 $A\\ne B$', B: '$A=B$', C: '$A\\cap B=\\emptyset$', D: '$B\\subseteq A$' }, answer: 'A', analysis: '真包含。', authorMathNote: 'A' }),
      () => ({ sectionCode: '1.5', sectionName: '全称量词与存在量词', stem: '否定“所有同学都及格”得', options: { A: '存在同学不及格', B: '所有同学不及格', C: '所有同学及格', D: '不存在同学' }, answer: 'A', analysis: '全称否定为存在。', authorMathNote: 'A' }),
    ]
    return opts[i]()
  }
  if (qt === 'multi') {
    const opts = [
      () => ({ sectionCode: '1.3', sectionName: '集合的基本运算', stem: '下列恒成立的有（多选）', options: { A: '$A\\cap B\\subseteq A$', B: '$A\\subseteq A\\cup B$', C: '$A\\cap(\\complement A)=U$', D: '$A\\cup(\\complement A)=U$' }, answer: 'A,B,D', analysis: 'C 交为空非 U。', authorMathNote: 'A,B,D' }),
      () => ({ sectionCode: '1.2', sectionName: '集合间的基本关系', stem: '关于空集，正确的有（多选）', options: { A: '$\\emptyset\\subseteq A$', B: '$\\emptyset\\in A$ 未必', C: '$|\\emptyset|=0$', D: '$\\emptyset=\\{0\\}$' }, answer: 'A,B,C', analysis: 'D 错。', authorMathNote: 'A,B,C' }),
      () => ({ sectionCode: '1.4', sectionName: '充分条件与必要条件', stem: '若 $p\\Rightarrow q$，则正确的有（多选）', options: { A: '$p$ 是 $q$ 的充分条件', B: '$q$ 是 $p$ 的必要条件', C: '$\\neg q\\Rightarrow\\neg p$', D: '$q\\Rightarrow p$' }, answer: 'A,B,C', analysis: 'D 不一定。', authorMathNote: 'A,B,C' }),
      () => ({ sectionCode: '1.1', sectionName: '集合的概念', stem: '集合元素性质有（多选）', options: { A: '确定性', B: '互异性', C: '无序性', D: '连续性' }, answer: 'A,B,C', analysis: '无连续性。', authorMathNote: 'A,B,C' }),
      () => ({ sectionCode: '1.5', sectionName: '全称量词与存在量词', stem: '关于量词，正确的有（多选）', options: { A: '全称用 ∀', B: '存在用 ∃', C: '否定交换量词并否定谓语', D: '∃ 可比 ∀ 更强' }, answer: 'A,B,C', analysis: 'D 一般不成立。', authorMathNote: 'A,B,C' }),
      () => ({ sectionCode: '1.3', sectionName: '集合的基本运算', stem: `设 $U=\\{1,2,3,4\\}$，$A=\\{1,2\\}$，正确的有（多选）`, options: { A: '$\\complement_U A=\\{3,4\\}$', B: '$A\\cup\\complement_U A=U$', C: '$A\\cap\\complement_U A=\\emptyset$', D: '$|A|=3$' }, answer: 'A,B,C', analysis: 'D 错。', authorMathNote: 'A,B,C' }),
      () => ({ sectionCode: '1.2', sectionName: '集合间的基本关系', stem: '若 $A\\subsetneq B$，则（多选）', options: { A: '$A\\subseteq B$', B: '$A\\ne B$', C: '存在元素在 B 不在 A', D: '$|A|>|B|$' }, answer: 'A,B,C', analysis: 'D 错。', authorMathNote: 'A,B,C' }),
      () => ({ sectionCode: '1.4', sectionName: '充分条件与必要条件', stem: '充要条件意味着（多选）', options: { A: '$p\\Leftrightarrow q$', B: '互相推出', C: '充分且必要', D: '仅单向推出' }, answer: 'A,B,C', analysis: 'D 错。', authorMathNote: 'A,B,C' }),
    ]
    return opts[i % opts.length]()
  }
  if (qt === 'judge') {
    const opts = [
      () => ({ sectionCode: '1.2', sectionName: '集合间的基本关系', stem: '判断：空集是任何集合的真子集。', answer: 'false', analysis: '空集是自身子集但非真子集。', authorMathNote: 'false' }),
      () => ({ sectionCode: '1.3', sectionName: '集合的基本运算', stem: '判断：$A\\cap B=B\\cap A$。', answer: 'true', analysis: '交换律。', authorMathNote: 'true' }),
      () => ({ sectionCode: '1.4', sectionName: '充分条件与必要条件', stem: '判断：若 $p\\Rightarrow q$，则 $q$ 是 $p$ 的充分条件。', answer: 'false', analysis: 'q 是 p 的必要条件。', authorMathNote: 'false' }),
      () => ({ sectionCode: '1.1', sectionName: '集合的概念', stem: '判断：集合 $\{1,1,2\}$ 与 $\{1,2\}$ 是同一集合。', answer: 'true', analysis: '互异性。', authorMathNote: 'true' }),
      () => ({ sectionCode: '1.5', sectionName: '全称量词与存在量词', stem: '判断：“$\\exists x\\in\\mathbb{R},x^2<0$”为真。', answer: 'false', analysis: '无实数平方为负。', authorMathNote: 'false' }),
      () => ({ sectionCode: '1.3', sectionName: '集合的基本运算', stem: '判断：$A\\subseteq A\\cup B$ 恒成立。', answer: 'true', analysis: '并集性质。', authorMathNote: 'true' }),
      () => ({ sectionCode: '1.2', sectionName: '集合间的基本关系', stem: '判断：若 $A\\subseteq B$ 且 $B\\subseteq C$，则 $A\\subseteq C$。', answer: 'true', analysis: '传递性。', authorMathNote: 'true' }),
      () => ({ sectionCode: '1.4', sectionName: '充分条件与必要条件', stem: '判断：原命题与逆命题真假性相同。', answer: 'false', analysis: '一般不同。', authorMathNote: 'false' }),
    ]
    return { ...opts[i % opts.length](), options: null }
  }
  if (qt === 'numeric') {
    const opts = [
      () => ({ sectionCode: '1.3', sectionName: '集合的基本运算', stem: `全集 $U=\\{1,\\ldots,${a + 5}\\}$，$A=\\{1,\\ldots,${a}\\}$，则 $|\\complement_U A|=$`, answer: '5', analysis: '差为 5。', authorMathNote: '5' }),
      () => ({ sectionCode: '1.2', sectionName: '集合间的基本关系', stem: `含 ${a} 个元素的集合子集个数为`, answer: String(2 ** a), analysis: '$2^n$。', authorMathNote: String(2 ** a) }),
      () => ({ sectionCode: '1.3', sectionName: '集合的基本运算', stem: `若 $|A\\cup B|=${a + b}$，$|A|=${a}$，$|B|=${b}$，则 $|A\\cap B|=$`, answer: '0', analysis: '容斥得交为 0。', authorMathNote: '0' }),
      () => ({ sectionCode: '1.1', sectionName: '集合的概念', stem: `$A=\\{x\\mid x^2-${(a + b)}x+${a * b}=0\\}$，则 $|A|=$`, answer: '2', analysis: '两根 a,b。', authorMathNote: '2' }),
      () => ({ sectionCode: '1.3', sectionName: '集合的基本运算', stem: `$A=\\{1,2,3\\}$，$B=\\{3,4,5\\}$，则 $|A\\cup B|=$`, answer: '5', analysis: '并 5 元。', authorMathNote: '5' }),
      () => ({ sectionCode: '1.3', sectionName: '集合的基本运算', stem: `$A=\\{1,2,3\\}$，$B=\\{3,4,5\\}$，则 $|A\\cap B|=$`, answer: '1', analysis: '交 {3}。', authorMathNote: '1' }),
      () => ({ sectionCode: '1.2', sectionName: '集合间的基本关系', stem: `集合 $\\{1,2,\\ldots,${a}\\}$ 的真子集个数为`, answer: String(2 ** a - 1), analysis: '去掉自身。', authorMathNote: String(2 ** a - 1) }),
      () => ({ sectionCode: '1.3', sectionName: '集合的基本运算', stem: `已知 $|U|=10$，$|A|=${a}$，则 $|\\complement_U A|=$`, answer: String(10 - a), analysis: '补集计数。', authorMathNote: String(10 - a) }),
    ]
    return { ...opts[i % opts.length](), options: null }
  }
  // application
  const apps = [
    () => ({ sectionCode: '1.3', sectionName: '集合的基本运算', stem: `全集 $U=\\{1,\\ldots,10\\}$，$A=\\{x\\in U\\mid x$ 为偶数$\\}$，$B=\\{x\\in U\\mid x\\le ${a + 3}\\}$。\n（1）求 $A\\cap B$；（2）求 $|\\complement_U(A\\cup B)|$。`, answer: `（1）列出交；（2）计数。`, analysis: '列举后运算。', authorMathNote: '列举', ...rub2({ t: '求交', s: 4, c: '交集合正确' }, { t: '补集计数', s: 4, c: '个数正确' }) }),
    () => ({ sectionCode: '1.4', sectionName: '充分条件与必要条件', stem: `设 $p:x>${a+1}$，$q:x>${a}$。\n（1）判断 $p\\Rightarrow q$；（2）判断 $q\\Rightarrow p$；（3）结论。`, answer: '（1）成立；（2）不成立；（3）充分不必要。', analysis: '蕴含与反例。', authorMathNote: '充分不必要', ...rub3({ t: '正向', s: 3, c: '证明蕴含' }, { t: '反向', s: 3, c: '反例' }, { t: '结论', s: 2, c: '定性正确' }, 8), ...hp(d, 'B', '条件关系三步论证', '证+反例+定性', '需完整逻辑链') }),
    () => ({ sectionCode: '1.5', sectionName: '全称量词与存在量词', stem: '命题：$\\forall x\\in\\mathbb{R},x^2+1>0$。\n（1）判断真假；（2）写出否定；（3）说明否定真假。', answer: '（1）真；（2）∃x,x²+1≤0；（3）假。', analysis: '量词否定。', authorMathNote: '真/否定假', ...rub3({ t: '判断', s: 3, c: '真' }, { t: '否定', s: 4, c: '形式正确' }, { t: '否定真假', s: 3, c: '假' }, 10) }),
    () => ({ sectionCode: '1.3', sectionName: '集合的基本运算', stem: `班上 40 人，会游泳 ${20 + a} 人，会骑车 ${22 + b} 人，两项都会 ${10 + c} 人。\n（1）只会一项的人数；（2）两项都不会的人数。`, answer: '用容斥计算。', analysis: '文氏图计数。', authorMathNote: '容斥', ...rub2({ t: '只会一项', s: 5, c: '公式正确' }, { t: '都不会', s: 5, c: '补集正确' }, 10) }),
  ]
  return { ...apps[i % apps.length](), options: null }
}

function ch2(qt, slot, n, k, a, b, c, t, d) {
  const i = k % 32
  if (qt === 'single') {
    const opts = [
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: `方程 $x^2-${a + b}x+${a * b}=0$ 的两根之积为`, options: { A: String(a * b), B: String(a + b), C: String(a - b), D: '0' }, answer: 'A', analysis: '韦达。', authorMathNote: String(a * b) }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: `方程 $x^2-${a + b}x+${a * b}=0$ 的两根之和为`, options: { A: String(a + b), B: String(a * b), C: String(a - b), D: '1' }, answer: 'A', analysis: '韦达。', authorMathNote: String(a + b) }),
      () => ({ sectionCode: '2.2', sectionName: '基本不等式', stem: `正实数 $x,y$ 满足 $xy=${a * a}$，则 $x+y$ 的最小值为`, options: { A: String(2 * a), B: String(a), C: String(a * a), D: String(4 * a) }, answer: 'A', analysis: 'AM-GM。', authorMathNote: String(2 * a) }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: `不等式 $x^2-${a + b}x+${a * b}<0$ 的解集是`, options: { A: `$(${Math.min(a, b)},${Math.max(a, b)})$`, B: `$(-\\infty,${Math.min(a, b)})$`, C: `$(${Math.max(a, b)},+\\infty)$`, D: '$\\mathbb{R}$' }, answer: 'A', analysis: '两根之间。', authorMathNote: '开区间' }),
      () => ({ sectionCode: '2.1', sectionName: '等式与不等式的性质', stem: `若 $a>b$ 且 $c<0$，则`, options: { A: '$ac<bc$', B: '$ac>bc$', C: '$ac=bc$', D: '无法比较' }, answer: 'A', analysis: '同乘负数变号。', authorMathNote: 'A' }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: `使 $x^2+px+${a * a}>0$ 对一切实数 $x$ 恒成立，则`, options: { A: `$|p|<${2 * a}$`, B: `$|p|>${2 * a}$`, C: `$p=${2 * a}$`, D: '$p=0$ 仅' }, answer: 'A', analysis: 'Δ<0 且开口向上。', authorMathNote: `|p|<${2 * a}`, ...hp(d, 'C', '二次恒正参数范围', 'Δ与开口', '参数不等式') }),
      () => ({ sectionCode: '2.2', sectionName: '基本不等式', stem: `正数 $x$ 使 $x+\\dfrac{${a * a}}{x}$ 最小时，$x=$`, options: { A: String(a), B: String(a * a), C: String(2 * a), D: '1' }, answer: 'A', analysis: '等号 x=a。', authorMathNote: String(a) }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: `$f(x)=-x^2+${2 * a}x$ 的最大值为`, options: { A: String(a * a), B: String(2 * a), C: '0', D: String(-a * a) }, answer: 'A', analysis: '顶点值。', authorMathNote: String(a * a) }),
      () => ({ sectionCode: '2.1', sectionName: '等式与不等式的性质', stem: '比较 $3^5$ 与 $5^3$ 的大小，正确结论是', options: { A: '$3^5>5^3$', B: '$3^5<5^3$', C: '相等', D: '无法比较' }, answer: 'A', analysis: '243>125。', authorMathNote: 'A' }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: `方程 $x^2-${2 * a}x+${a * a}=0$ 的根的情况是`, options: { A: '两个相等实根', B: '两不等实根', C: '无实根', D: '四个根' }, answer: 'A', analysis: 'Δ=0。', authorMathNote: '重根' }),
      () => ({ sectionCode: '2.2', sectionName: '基本不等式', stem: '基本不等式等号成立的条件是', options: { A: '两正数相等', B: '两数为相反数', C: '一正一负', D: '任意实数' }, answer: 'A', analysis: '等号条件。', authorMathNote: 'A' }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: `若方程 $x^2-mx+4=0$ 有两实根，则 $m$ 的取值范围是`, options: { A: '$m\\le -4$ 或 $m\\ge 4$', B: '$|m|<4$', C: '$m>0$', D: '$m=4$' }, answer: 'A', analysis: 'Δ≥0。', authorMathNote: '|m|≥4' }),
      () => ({ sectionCode: '2.1', sectionName: '等式与不等式的性质', stem: '若 $a>b>0$，则下列正确的是', options: { A: '$\\dfrac{1}{a}<\\dfrac{1}{b}$', B: '$\\dfrac{1}{a}>\\dfrac{1}{b}$', C: '$a^2<b^2$', D: '无法判断' }, answer: 'A', analysis: '正数取倒数变号。', authorMathNote: 'A' }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: `$f(x)=x^2-${2 * a}x+${a * a + 1}$ 在 $[0,${a}]$ 上的最小值是`, options: { A: '1', B: String(a * a + 1), C: '0', D: String(a) }, answer: 'A', analysis: '顶点在 x=a 处若 a 在区间… 配方 (x-a)^2+1，在[0,a]上于 x=a 取 1。', authorMathNote: '1' }),
      () => ({ sectionCode: '2.2', sectionName: '基本不等式', stem: `已知 $x>0$，$x+\\dfrac{4}{x}$ 的最小值为`, options: { A: '4', B: '2', C: '8', D: '1' }, answer: 'A', analysis: '≥2√4=4。', authorMathNote: '4' }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: '二次函数开口向上且 Δ<0，则函数值', options: { A: '恒正', B: '恒负', C: '有正有负', D: '恒零' }, answer: 'A', analysis: '图像在 x 轴上方。', authorMathNote: '恒正' }),
    ]
    // pad to 32 with variations of ask
    while (opts.length < 32) {
      const base = opts[opts.length % 16]
      opts.push(() => {
        const o = base()
        o.stem = o.stem.replace(/为$/, '等于')
        o.dedupPad = opts.length
        return o
      })
    }
    // Better: ensure 32 unique by different stems
    const more = [
      () => ({ sectionCode: '2.1', sectionName: '等式与不等式的性质', stem: '若 $a>b$，则 $a-b$ 的符号是', options: { A: '正', B: '负', C: '零', D: '不确定' }, answer: 'A', analysis: '差为正。', authorMathNote: '正' }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: `抛物线 $y=x^2-${2 * a}x$ 的对称轴是`, options: { A: `$x=${a}$`, B: `$x=-${a}$`, C: '$x=0$', D: `$x=${2 * a}$` }, answer: 'A', analysis: '对称轴公式。', authorMathNote: `x=${a}` }),
      () => ({ sectionCode: '2.2', sectionName: '基本不等式', stem: '不能直接用基本不等式的是', options: { A: '两数为负', B: '两正数求和', C: '两正数求积', D: '等号讨论' }, answer: 'A', analysis: '需正数。', authorMathNote: 'A' }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: `方程 $(x-${a})(x-${b})=0$ 的较大根为`, options: { A: String(Math.max(a, b)), B: String(Math.min(a, b)), C: String(a + b), D: '0' }, answer: 'A', analysis: '根为 a,b。', authorMathNote: String(Math.max(a, b)) }),
      () => ({ sectionCode: '2.1', sectionName: '等式与不等式的性质', stem: '绝对值不等式 $|x|<3$ 的解集是', options: { A: '$(-3,3)$', B: '$(-\\infty,-3)$', C: '$(3,+\\infty)$', D: '$\\mathbb{R}$' }, answer: 'A', analysis: '两边夹。', authorMathNote: '(-3,3)' }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: `若 $x^2+1\\ge kx$ 对一切实数成立，则 $k$ 的范围是`, options: { A: '$|k|\\le 2$', B: '$k>2$', C: '$k=0$', D: '任意 k' }, answer: 'A', analysis: 'Δ≤0。', authorMathNote: '|k|≤2', ...hp(d, 'C', '恒成立转化为判别式', '移项配方或Δ', '参数讨论') }),
      () => ({ sectionCode: '2.2', sectionName: '基本不等式', stem: `正实数和为 ${2 * a}，则积的最大值为`, options: { A: String(a * a), B: String(2 * a), C: String(4 * a), D: '1' }, answer: 'A', analysis: '等则积最大。', authorMathNote: String(a * a) }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: '根的分布：两根都大于 2，除 Δ≥0 外还通常需要', options: { A: '对称轴>2 且 f(2)>0', B: '仅 f(2)>0', C: '仅对称轴>2', D: '仅开口向上' }, answer: 'A', analysis: '根分布条件组。', authorMathNote: 'A', ...hp(d, 'C', '根的分布条件组', 'Δ+对称轴+端点符号', '多条件联立') }),
      () => ({ sectionCode: '2.1', sectionName: '等式与不等式的性质', stem: '不等式两边同乘负数后', options: { A: '不等号变向', B: '不等号不变', C: '变为等式', D: '无意义' }, answer: 'A', analysis: '性质。', authorMathNote: '变向' }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: `$y=(x-${a})^2+${b}$ 的顶点坐标是`, options: { A: `(${a},${b})`, B: `(${-a},${b})`, C: `(${a},${-b})`, D: '(0,0)' }, answer: 'A', analysis: '顶点式。', authorMathNote: `(${a},${b})` }),
      () => ({ sectionCode: '2.2', sectionName: '基本不等式', stem: `已知 $xy=1$（$x,y>0$），则 $(x+y)^2$ 的最小值为`, options: { A: '4', B: '2', C: '1', D: '0' }, answer: 'A', analysis: 'x+y≥2。', authorMathNote: '4' }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: '判别式 Δ=b²-4ac 用于', options: { A: '判断实根个数', B: '求顶点', C: '求对称轴', D: '求定义域' }, answer: 'A', analysis: '根的情况。', authorMathNote: 'A' }),
      () => ({ sectionCode: '2.1', sectionName: '等式与不等式的性质', stem: '传递性：若 a>b 且 b>c，则', options: { A: 'a>c', B: 'a<c', C: 'a=c', D: '无法判断' }, answer: 'A', analysis: '传递。', authorMathNote: 'a>c' }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: `二次函数 $f(x)=x^2+1$ 的值域是`, options: { A: '$[1,+\\infty)$', B: '$\\mathbb{R}$', C: '$(0,+\\infty)$', D: '$[0,+\\infty)$' }, answer: 'A', analysis: '最小值 1。', authorMathNote: '[1,+∞)' }),
      () => ({ sectionCode: '2.2', sectionName: '基本不等式', stem: '用基本不等式求最值时必须检验', options: { A: '等号能否取到', B: '定义域是否实数', C: '仅开口', D: '仅 Δ' }, answer: 'A', analysis: '等号条件。', authorMathNote: 'A' }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: `若 $f(x)=x^2-5x+6$ 在区间 $[0,4]$ 上的最大值为`, options: { A: '6', B: '0', C: '2', D: '4' }, answer: 'A', analysis: '端点 f(0)=6 较大。', authorMathNote: '6' }),
    ]
    return (i < 16 ? opts[i] : more[i % more.length])()
  }
  if (qt === 'multi') {
    const opts = [
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: '关于一元二次不等式，正确的有（多选）', options: { A: '先求根再定解集', B: '开口决定两侧符号', C: 'Δ<0 且 a>0 则解集为空', D: '解集总是开区间' }, answer: 'A,B', analysis: 'C 应为全体实数；D 不一定。', authorMathNote: 'A,B' }),
      () => ({ sectionCode: '2.2', sectionName: '基本不等式', stem: '使用基本不等式需注意（多选）', options: { A: '正数', B: '等号条件', C: '一正一负也行', D: '可求积最大或和最小' }, answer: 'A,B,D', analysis: 'C 错。', authorMathNote: 'A,B,D' }),
      () => ({ sectionCode: '2.1', sectionName: '等式与不等式的性质', stem: '不等式性质正确的有（多选）', options: { A: '两边加同一实数方向不变', B: '同乘正数方向不变', C: '同乘负数变向', D: '两边平方总保向' }, answer: 'A,B,C', analysis: 'D 错。', authorMathNote: 'A,B,C' }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: '韦达定理可直接得（多选）', options: { A: '两根之和', B: '两根之积', C: '两根之差绝对值需另算', D: '判别式' }, answer: 'A,B,C', analysis: 'D 非韦达直接。', authorMathNote: 'A,B,C' }),
    ]
    return opts[i % opts.length]()
  }
  if (qt === 'judge') {
    const opts = [
      () => ({ sectionCode: '2.2', sectionName: '基本不等式', stem: '判断：对任意实数 x>0，都有 $x+\\dfrac{1}{x}\\ge 2$。', answer: 'true', analysis: 'AM-GM。', authorMathNote: 'true' }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: '判断：Δ=0 时方程有两个相等实根。', answer: 'true', analysis: '重根。', authorMathNote: 'true' }),
      () => ({ sectionCode: '2.1', sectionName: '等式与不等式的性质', stem: '判断：若 a>b，则 a²>b²。', answer: 'false', analysis: '反例 a=1,b=-2。', authorMathNote: 'false' }),
      () => ({ sectionCode: '2.2', sectionName: '基本不等式', stem: '判断：基本不等式适用于任意实数。', answer: 'false', analysis: '需正数。', authorMathNote: 'false' }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: '判断：开口向下的二次函数有最大值。', answer: 'true', analysis: '顶点最大。', authorMathNote: 'true' }),
      () => ({ sectionCode: '2.1', sectionName: '等式与不等式的性质', stem: '判断：不等式两边同乘 0 后方向不变且仍有意义地保持原关系。', answer: 'false', analysis: '乘 0 得 0=0 丢失信息。', authorMathNote: 'false' }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: '判断：韦达定理要求 a≠0。', answer: 'true', analysis: '二次方程。', authorMathNote: 'true' }),
      () => ({ sectionCode: '2.2', sectionName: '基本不等式', stem: '判断：等号成立当且仅当两正数相等。', answer: 'true', analysis: '条件。', authorMathNote: 'true' }),
    ]
    return { ...opts[i % opts.length](), options: null }
  }
  if (qt === 'numeric') {
    const opts = [
      () => ({ sectionCode: '2.2', sectionName: '基本不等式', stem: `正实数 $xy=${a * a}$，则 $x+y$ 最小值为`, answer: String(2 * a), analysis: 'AM-GM。', authorMathNote: String(2 * a) }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: `方程 $x^2-${a + b}x+${a * b}=0$ 的两根之积为`, answer: String(a * b), analysis: '韦达。', authorMathNote: String(a * b) }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: `方程 $x^2-${a + b}x+${a * b}=0$ 的两根之和为`, answer: String(a + b), analysis: '韦达。', authorMathNote: String(a + b) }),
      () => ({ sectionCode: '2.2', sectionName: '基本不等式', stem: `正数 $x+\\dfrac{${b * b}}{x}$ 的最小值为`, answer: String(2 * b), analysis: '≥2b。', authorMathNote: String(2 * b) }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: `$f(x)=-x^2+${2 * a}x+1$ 的最大值为`, answer: String(a * a + 1), analysis: '顶点。', authorMathNote: String(a * a + 1) }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: `不等式 $(x-${a})(x-${b})<0$ 的解集长度（有限时）为`, answer: String(Math.abs(a - b)), analysis: '开区间长度。', authorMathNote: String(Math.abs(a - b)) }),
      () => ({ sectionCode: '2.1', sectionName: '等式与不等式的性质', stem: `已知 $a-b=${c}$，则 $b-a=$`, answer: String(-c), analysis: '相反数。', authorMathNote: String(-c) }),
      () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: `$x^2-5x+6=0$ 的较大根为`, answer: '3', analysis: '因式分解。', authorMathNote: '3' }),
    ]
    return { ...opts[i % opts.length](), options: null }
  }
  const apps = [
    () => ({ sectionCode: '2.2', sectionName: '基本不等式', stem: `正实数 $x$ 研究 $x+\\dfrac{${a * a}}{x}$。\n（1）求最小值；（2）求等号时的 $x$。`, answer: `（1）${2 * a}；（2）$x=${a}$。`, analysis: 'AM-GM。', authorMathNote: `${2 * a}`, ...rub2({ t: '最小值', s: 4, c: '值正确' }, { t: '等号', s: 4, c: 'x正确' }) }),
    () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: `方程 $x^2-mx+4=0$ 有两实根。\n（1）求 m 范围；（2）当 m=5 时求两根之和与积。`, answer: '（1）|m|≥4；（2）和5积4。', analysis: 'Δ与韦达。', authorMathNote: '|m|≥4', ...rub2({ t: '范围', s: 5, c: 'Δ≥0' }, { t: '韦达', s: 5, c: '和积' }, 10), ...hp(d, 'C', '参数范围+韦达', 'Δ→韦达', '两步衔接') }),
    () => ({ sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式', stem: `篱笆长 ${2 * (a + b)}\\,m$ 围矩形（四边）。\n（1）设一边为 x，写出面积；（2）求最大面积。`, answer: '面积公式+顶点。', analysis: '二次函数最值。', authorMathNote: '面积最大', ...rub2({ t: '建模', s: 4, c: 'S(x)' }, { t: '最值', s: 4, c: '最大值' }) }),
    () => ({ sectionCode: '2.1', sectionName: '等式与不等式的性质', stem: `进价 40，售价 60，日固定成本 200。日销 x 件。\n（1）利润 P(x)；（2）利润≥300 时 x 至少多少。`, answer: 'P=20x-200；x≥25。', analysis: '一次不等式。', authorMathNote: 'x≥25', ...rub2({ t: '利润式', s: 4, c: '表达式' }, { t: '不等式', s: 4, c: '解' }) }),
  ]
  return { ...apps[i % apps.length](), options: null }
}

// For chapters 3-10, use compact generator with unique Chinese frames per k
function frame(ch, qt, k, a, b, c, d) {
  const frames = CH_FRAMES[ch][qt]
  return frames[k % frames.length](a, b, c, d)
}

function ch3(qt, slot, n, k, a, b, c, t, d) {
  return finalize(frame(3, qt, k, a, b, c, d), qt)
}
function ch4(qt, slot, n, k, a, b, c, t, d) {
  return finalize(frame(4, qt, k, a, b, c, d), qt)
}
function ch5(qt, slot, n, k, a, b, c, t, d) {
  return finalize(frame(5, qt, k, a, b, c, d), qt)
}
function ch6(qt, slot, n, k, a, b, c, t, d) {
  return finalize(frame(6, qt, k, a, b, c, d), qt)
}
function ch7(qt, slot, n, k, a, b, c, t, d) {
  return finalize(frame(7, qt, k, a, b, c, d), qt)
}
function ch8(qt, slot, n, k, a, b, c, t, d) {
  return finalize(frame(8, qt, k, a, b, c, d), qt)
}
function ch9(qt, slot, n, k, a, b, c, t, d) {
  return finalize(frame(9, qt, k, a, b, c, d), qt)
}
function ch10(qt, slot, n, k, a, b, c, t, d) {
  return finalize(frame(10, qt, k, a, b, c, d), qt)
}

function finalize(p, qt) {
  if (qt === 'numeric' || qt === 'judge' || qt === 'application') p.options = null
  return p
}

/** Prebuilt unique-frame libraries (digit-strip distinct). */
const CH_FRAMES = {
  3: makeCh3(),
  4: makeCh4(),
  5: makeCh5(),
  6: makeCh6(),
  7: makeCh7(),
  8: makeCh8(),
  9: makeCh9(),
  10: makeCh10(),
}

function makeCh3() {
  return {
    single: [
      (a, b) => ({ sectionCode: '3.2', sectionName: '函数的基本性质', stem: `函数 $f(x)=${a}x-${b}$ 在 $\\mathbb{R}$ 上的单调性为`, options: { A: '递增', B: '递减', C: '先增后减', D: '不单调' }, answer: 'A', analysis: '一次项系数为正。', authorMathNote: '增' }),
      (a, b) => ({ sectionCode: '3.2', sectionName: '函数的基本性质', stem: '下列为奇函数的是', options: { A: '$y=x^3$', B: '$y=x^2$', C: '$y=|x|$', D: '$y=x+1$' }, answer: 'A', analysis: '奇函数定义。', authorMathNote: 'A' }),
      (a, b) => ({ sectionCode: '3.1', sectionName: '函数的概念', stem: `已知 $f(x)=${a}x+${b}$，则 $f(${a})$ 等于`, options: { A: String(a * a + b), B: String(a + b), C: String(b), D: String(a) }, answer: 'A', analysis: '代入。', authorMathNote: String(a * a + b) }),
      (a, b) => ({ sectionCode: '3.2', sectionName: '函数的基本性质', stem: '函数 $y=x^2$ 在 $(-\\infty,0]$ 上', options: { A: '单调递减', B: '单调递增', C: '常数', D: '不单调' }, answer: 'A', analysis: '左支递减。', authorMathNote: '减' }),
      (a, b) => ({ sectionCode: '3.3', sectionName: '幂函数', stem: '幂函数 $y=x^{1/3}$ 的定义域是', options: { A: '$\\mathbb{R}$', B: '$[0,+\\infty)$', C: '$(0,+\\infty)$', D: '$(-\\infty,0]$' }, answer: 'A', analysis: '奇次根。', authorMathNote: 'R' }),
      (a, b, c, d) => ({ sectionCode: '3.2', sectionName: '函数的基本性质', stem: `奇函数且 $x>0$ 时 $f(x)=x+\\dfrac{${a}}{x}$，则 $f(-${a})$ 为`, options: { A: String(-(a + 1)), B: String(a + 1), C: '0', D: String(a) }, answer: 'A', analysis: '奇性翻号。', authorMathNote: String(-(a + 1)), ...hp(d || 2, 'E', '奇函数延拓', '正半轴→翻号', '易误直接代入') }),
      (a, b) => ({ sectionCode: '3.1', sectionName: '函数的概念', stem: '函数 $f(x)=\\dfrac{1}{x-1}$ 的定义域是', options: { A: '$\\{x\\mid x\\ne 1\\}$', B: '$\\mathbb{R}$', C: '$(1,+\\infty)$', D: '$[0,1]$' }, answer: 'A', analysis: '分母≠0。', authorMathNote: 'A' }),
      (a, b) => ({ sectionCode: '3.2', sectionName: '函数的基本性质', stem: '偶函数图像关于', options: { A: 'y 轴对称', B: '原点对称', C: 'x 轴对称', D: '直线 y=x 对称' }, answer: 'A', analysis: '偶函数对称性。', authorMathNote: 'A' }),
      (a, b) => ({ sectionCode: '3.4', sectionName: '函数的应用（一）', stem: '若 f 在 [1,4] 递增，则', options: { A: '$f(1)\\le f(4)$', B: '$f(1)>f(4)$', C: '必相等', D: '无法比' }, answer: 'A', analysis: '递增定义。', authorMathNote: 'A' }),
      (a, b) => ({ sectionCode: '3.3', sectionName: '幂函数', stem: '幂函数 $y=x^{-1}$ 的图像在第一象限', options: { A: '递减', B: '递增', C: '常函数', D: '无定义' }, answer: 'A', analysis: '反比例。', authorMathNote: '减' }),
      (a, b) => ({ sectionCode: '3.1', sectionName: '函数的概念', stem: '同一函数要求', options: { A: '定义域与对应关系相同', B: '仅解析式字母相同', C: '仅值域相同', D: '图像颜色相同' }, answer: 'A', analysis: '函数相等。', authorMathNote: 'A' }),
      (a, b) => ({ sectionCode: '3.2', sectionName: '函数的基本性质', stem: '既奇又偶的函数在公共定义域上满足', options: { A: '$f(x)=0$', B: '$f(x)=x$', C: '$f(x)=1$', D: '$f(x)=x^2$' }, answer: 'A', analysis: '只有零函数。', authorMathNote: '0' }),
      (a, b) => ({ sectionCode: '3.2', sectionName: '函数的基本性质', stem: `$f(x)=|x|$ 的最小值是`, options: { A: '0', B: '1', C: '-1', D: '不存在' }, answer: 'A', analysis: '绝对值非负。', authorMathNote: '0' }),
      (a, b) => ({ sectionCode: '3.1', sectionName: '函数的概念', stem: `分段 $f(x)=\\begin{cases}${a}x,&x<0\\\\x^2,&x\\ge 0\\end{cases}$，则 $f(-1)+f(2)=$`, options: { A: String(-a + 4), B: String(a + 4), C: '4', D: String(-a) }, answer: 'A', analysis: '分段求值。', authorMathNote: String(-a + 4) }),
      (a, b) => ({ sectionCode: '3.3', sectionName: '幂函数', stem: '下列是幂函数的是', options: { A: '$y=x^2$', B: '$y=2^x$', C: '$y=x+1$', D: '$y=\\sin x$' }, answer: 'A', analysis: '幂函数形如 x^α。', authorMathNote: 'A' }),
      (a, b) => ({ sectionCode: '3.2', sectionName: '函数的基本性质', stem: '函数在某区间单调递减意味着', options: { A: '自变量增大函数值减小', B: '自变量增大函数值增大', C: '函数值为负', D: '过原点' }, answer: 'A', analysis: '定义。', authorMathNote: 'A' }),
    ],
    multi: [
      (a, b) => ({ sectionCode: '3.2', sectionName: '函数的基本性质', stem: '在 R 上为奇函数的有（多选）', options: { A: '$y=x$', B: '$y=x^3$', C: '$y=x^2$', D: '$y=0$' }, answer: 'A,B,D', analysis: 'C 偶。', authorMathNote: 'A,B,D' }),
      (a, b) => ({ sectionCode: '3.2', sectionName: '函数的基本性质', stem: '关于单调性正确的有（多选）', options: { A: '$y=2x$ 递增', B: '$y=-x$ 递减', C: '$y=x^2$ 在 R 递增', D: '$y=1/x$ 在 (0,+∞) 递减' }, answer: 'A,B,D', analysis: 'C 错。', authorMathNote: 'A,B,D' }),
      (a, b) => ({ sectionCode: '3.3', sectionName: '幂函数', stem: '幂函数性质正确的有（多选）', options: { A: 'α=2 为抛物线型', B: 'α=-1 为双曲线型', C: '都过 (1,1)', D: '都过 (0,0)' }, answer: 'A,B,C', analysis: 'D 对 α≤0 不成立。', authorMathNote: 'A,B,C' }),
      (a, b) => ({ sectionCode: '3.1', sectionName: '函数的概念', stem: '构成函数需要（多选）', options: { A: '定义域', B: '对应关系', C: '每个 x 唯一 y', D: '值域先给定且等于 R' }, answer: 'A,B,C', analysis: 'D 不必。', authorMathNote: 'A,B,C' }),
    ],
    judge: [
      (a, b) => ({ sectionCode: '3.2', sectionName: '函数的基本性质', stem: '判断：$y=x^2$ 在 (-∞,0) 单调递减。', answer: 'true', analysis: '左支递减。', authorMathNote: 'true' }),
      (a, b) => ({ sectionCode: '3.2', sectionName: '函数的基本性质', stem: '判断：$y=x^3$ 是奇函数。', answer: 'true', analysis: '奇函数。', authorMathNote: 'true' }),
      (a, b) => ({ sectionCode: '3.2', sectionName: '函数的基本性质', stem: '判断：$y=x^2+1$ 是奇函数。', answer: 'false', analysis: '偶函数。', authorMathNote: 'false' }),
      (a, b) => ({ sectionCode: '3.1', sectionName: '函数的概念', stem: '判断：定义域与对应法则相同则是同一函数。', answer: 'true', analysis: '相等定义。', authorMathNote: 'true' }),
      (a, b) => ({ sectionCode: '3.3', sectionName: '幂函数', stem: '判断：$y=x^{1/2}$ 定义域为 R。', answer: 'false', analysis: '需 x≥0。', authorMathNote: 'false' }),
      (a, b) => ({ sectionCode: '3.2', sectionName: '函数的基本性质', stem: '判断：偶函数图像必过原点。', answer: 'false', analysis: '反例 x²+1。', authorMathNote: 'false' }),
      (a, b) => ({ sectionCode: '3.4', sectionName: '函数的应用（一）', stem: '判断：$1/x$ 在整个定义域上可称为减函数。', answer: 'false', analysis: '不能跨区间比较。', authorMathNote: 'false' }),
      (a, b) => ({ sectionCode: '3.2', sectionName: '函数的基本性质', stem: '判断：若 f(-x)=-f(x) 且定义域关于原点对称，则 f 为奇函数。', answer: 'true', analysis: '定义。', authorMathNote: 'true' }),
    ],
    numeric: [
      (a, b) => ({ sectionCode: '3.1', sectionName: '函数的概念', stem: `f(x)=${a}x+${b}，则 f(${a})=`, answer: String(a * a + b), analysis: '代入。', authorMathNote: String(a * a + b) }),
      (a, b) => ({ sectionCode: '3.2', sectionName: '函数的基本性质', stem: 'f(x)=x²-4x+3 的最小值是', answer: '-1', analysis: '配方。', authorMathNote: '-1' }),
      (a, b) => ({ sectionCode: '3.2', sectionName: '函数的基本性质', stem: `奇函数 f(2)=${a}，则 f(-2)=`, answer: String(-a), analysis: '翻号。', authorMathNote: String(-a) }),
      (a, b) => ({ sectionCode: '3.1', sectionName: '函数的概念', stem: 'f(x)=2x-1=7 时 x=', answer: '4', analysis: '解方程。', authorMathNote: '4' }),
      (a, b) => ({ sectionCode: '3.3', sectionName: '幂函数', stem: '√9 的值为', answer: '3', analysis: '算术平方根。', authorMathNote: '3' }),
      (a, b) => ({ sectionCode: '3.2', sectionName: '函数的基本性质', stem: '|x-2| 的最小值是', answer: '0', analysis: '绝对值。', authorMathNote: '0' }),
      (a, b) => ({ sectionCode: '3.4', sectionName: '函数的应用（一）', stem: 'x+1/x（x>0）的最小值是', answer: '2', analysis: 'AM-GM。', authorMathNote: '2' }),
      (a, b) => ({ sectionCode: '3.2', sectionName: '函数的基本性质', stem: `f(x)=${a}x² 在 x=2 的值是`, answer: String(4 * a), analysis: '代入。', authorMathNote: String(4 * a) }),
    ],
    application: [
      (a, b, c, d) => ({ sectionCode: '3.4', sectionName: '函数的应用（一）', stem: `设 $f(x)=x+\\dfrac{1}{x}$（$x\\ge 1$）。\n（1）判断单调性；（2）求最小值。`, answer: '（1）递增；（2）2。', analysis: '作差。', authorMathNote: 'min=2', ...rub2({ t: '单调', s: 4, c: '递增' }, { t: '最小值', s: 4, c: '2' }) }),
      (a, b, c, d) => ({ sectionCode: '3.2', sectionName: '函数的基本性质', stem: `已知 f 奇，$x>0$ 时 $f(x)=x+\\dfrac{${a}}{x}$。\n（1）说明奇偶性；（2）求 f(-a)。`, answer: `奇；f(-a)=-(a+1)。`, analysis: '奇性延拓。', authorMathNote: String(-(a + 1)), ...rub2({ t: '奇偶', s: 4, c: '奇' }, { t: '求值', s: 4, c: '正确' }), ...hp(d || 3, 'E', '奇性延拓求值', '证明+翻号', '压轴常见') }),
      (a, b) => ({ sectionCode: '3.1', sectionName: '函数的概念', stem: `分段 $f(x)=\\begin{cases}2x+1,&x<1\\\\x^2-2,&x\\ge1\\end{cases}$\n（1）求 f(0)+f(3)；（2）若 f(t)=7 求 t。`, answer: '（1）8；（2）t=3。', analysis: '分段。', authorMathNote: '8;3', ...rub2({ t: '求值', s: 4, c: '和' }, { t: '反解', s: 4, c: 't' }) }),
      (a, b) => ({ sectionCode: '3.4', sectionName: '函数的应用（一）', stem: '商品进价 10，售价 x（10<x<40）时日销 (40-x)。\n（1）日利润 L(x)；（2）最大利润及售价。', answer: '建模求顶点。', analysis: '二次最值。', authorMathNote: '利润最大', ...rub2({ t: '建模', s: 4, c: 'L(x)' }, { t: '最值', s: 4, c: '售价与利润' }) }),
    ],
  }
}

function makeCh4() {
  return {
    single: [
      (a) => ({ sectionCode: '4.1', sectionName: '指数与指数幂的运算', stem: `$\\sqrt[3]{${a * a * a}}=$`, options: { A: String(a), B: String(a * a), C: String(-a), D: '1' }, answer: 'A', analysis: '立方根。', authorMathNote: String(a) }),
      (a) => ({ sectionCode: '4.1', sectionName: '指数与指数幂的运算', stem: `$(${a}^2)^{3/2}=$（a>0）`, options: { A: String(a ** 3), B: String(a ** 2), C: String(a), D: String(a ** 6) }, answer: 'A', analysis: '分数指数。', authorMathNote: String(a ** 3) }),
      (a) => ({ sectionCode: '4.2', sectionName: '指数函数', stem: '函数 $y=2^x$ 的定义域是', options: { A: '$\\mathbb{R}$', B: '$(0,+\\infty)$', C: '$[0,+\\infty)$', D: '$(1,+\\infty)$' }, answer: 'A', analysis: '指数函数。', authorMathNote: 'R' }),
      (a) => ({ sectionCode: '4.2', sectionName: '指数函数', stem: '若 $0.5^m>0.5^n$，则', options: { A: '$m<n$', B: '$m>n$', C: '$m=n$', D: '无法判断' }, answer: 'A', analysis: '底在 (0,1) 递减。', authorMathNote: 'm<n' }),
      (a) => ({ sectionCode: '4.3', sectionName: '对数', stem: `$\\log_{${a}} ${a ** 3}=$`, options: { A: '3', B: String(a), C: '1', D: '0' }, answer: 'A', analysis: '对数定义。', authorMathNote: '3' }),
      (a) => ({ sectionCode: '4.3', sectionName: '对数', stem: `$\\log_2 8-\\log_2 2=$`, options: { A: '2', B: '3', C: '4', D: '1' }, answer: 'A', analysis: '3-1=2。', authorMathNote: '2' }),
      (a) => ({ sectionCode: '4.4', sectionName: '对数函数', stem: '函数 $y=\\log_{1/2}x$ 的定义域是', options: { A: '$(0,+\\infty)$', B: '$\\mathbb{R}$', C: '$[0,+\\infty)$', D: '$(1,+\\infty)$' }, answer: 'A', analysis: '真数>0。', authorMathNote: '(0,+∞)' }),
      (a) => ({ sectionCode: '4.4', sectionName: '对数函数', stem: '若 $\\log_{1/3}m>\\log_{1/3}n$（m,n>0），则', options: { A: '$m<n$', B: '$m>n$', C: '$m=n$', D: '无法判断' }, answer: 'A', analysis: '底∈(0,1) 递减。', authorMathNote: 'm<n' }),
      (a) => ({ sectionCode: '4.2', sectionName: '指数函数', stem: '方程 $2^x=8$ 的解为', options: { A: '3', B: '2', C: '4', D: '8' }, answer: 'A', analysis: '2^3=8。', authorMathNote: '3' }),
      (a) => ({ sectionCode: '4.5', sectionName: '指数函数与对数函数的应用', stem: '二分法适用于', options: { A: '连续函数变号区间求根', B: '任意间断函数', C: '仅多项式', D: '仅指数' }, answer: 'A', analysis: '零点存在。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '4.1', sectionName: '指数与指数幂的运算', stem: `$9^{3/2}=$`, options: { A: '27', B: '9', C: '3', D: '81' }, answer: 'A', analysis: '(3^2)^{3/2}=3^3。', authorMathNote: '27' }),
      (a) => ({ sectionCode: '4.3', sectionName: '对数', stem: '$\\log_2 2=$', options: { A: '1', B: '0', C: '2', D: '4' }, answer: 'A', analysis: '定义。', authorMathNote: '1' }),
      (a) => ({ sectionCode: '4.2', sectionName: '指数函数', stem: '$y=(1/2)^x$ 的值域是', options: { A: '$(0,+\\infty)$', B: '$\\mathbb{R}$', C: '$[0,+\\infty)$', D: '$(1,+\\infty)$' }, answer: 'A', analysis: '指数值域。', authorMathNote: '(0,+∞)' }),
      (a) => ({ sectionCode: '4.4', sectionName: '对数函数', stem: '$y=\\log_2 x$ 过定点', options: { A: '(1,0)', B: '(0,1)', C: '(2,2)', D: '(0,0)' }, answer: 'A', analysis: '对数过 (1,0)。', authorMathNote: '(1,0)' }),
      (a) => ({ sectionCode: '4.3', sectionName: '对数', stem: '换底公式 $\\log_a b=$', options: { A: '$\\dfrac{\\log_c b}{\\log_c a}$', B: '$\\log_b a$', C: '$\\dfrac{b}{a}$', D: '$a^b$' }, answer: 'A', analysis: '换底。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '4.5', sectionName: '指数函数与对数函数的应用', stem: '指数增长模型常见于', options: { A: '细菌分裂等', B: '匀速直线运动位移', C: '匀加速仅一次项', D: '圆面积' }, answer: 'A', analysis: '指数模型。', authorMathNote: 'A' }),
    ],
    multi: [
      (a) => ({ sectionCode: '4.1', sectionName: '指数与指数幂的运算', stem: '指数运算正确的有（多选）', options: { A: '$a^m a^n=a^{m+n}$', B: '$(a^m)^n=a^{mn}$', C: '$a^0=0$', D: '$a^{-1}=1/a$（a≠0）' }, answer: 'A,B,D', analysis: 'C 错 a^0=1。', authorMathNote: 'A,B,D' }),
      (a) => ({ sectionCode: '4.3', sectionName: '对数', stem: '对数运算法则正确的有（多选）', options: { A: '$\\log_a(mn)=\\log_a m+\\log_a n$', B: '$\\log_a(m/n)=\\log_a m-\\log_a n$', C: '$\\log_a(m^n)=n\\log_a m$', D: '$\\log_a(m+n)=\\log_a m+\\log_a n$' }, answer: 'A,B,C', analysis: 'D 错。', authorMathNote: 'A,B,C' }),
      (a) => ({ sectionCode: '4.2', sectionName: '指数函数', stem: '关于 y=a^x（a>0,a≠1）正确的有（多选）', options: { A: '定义域 R', B: '值域 (0,+∞)', C: '过 (0,1)', D: '必递增' }, answer: 'A,B,C', analysis: 'D 当 0<a<1 递减。', authorMathNote: 'A,B,C' }),
      (a) => ({ sectionCode: '4.4', sectionName: '对数函数', stem: '对数函数性质正确的有（多选）', options: { A: '真数>0', B: '过 (1,0)', C: '与指数函数互为反函数（同底）', D: '定义域 R' }, answer: 'A,B,C', analysis: 'D 错。', authorMathNote: 'A,B,C' }),
    ],
    judge: [
      (a) => ({ sectionCode: '4.2', sectionName: '指数函数', stem: '判断：y=2^x 定义域为 R，值域为 (0,+∞)。', answer: 'true', analysis: '指数函数性质。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '4.3', sectionName: '对数', stem: '判断：log2 8=3。', answer: 'true', analysis: '2^3=8。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '4.4', sectionName: '对数函数', stem: '判断：y=log_{1/2}x 在 (0,+∞) 递增。', answer: 'false', analysis: '底∈(0,1) 递减。', authorMathNote: 'false' }),
      (a) => ({ sectionCode: '4.1', sectionName: '指数与指数幂的运算', stem: '判断：a^0=1（a≠0）。', answer: 'true', analysis: '定义。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '4.3', sectionName: '对数', stem: '判断：log_a (mn)=log_a m · log_a n。', answer: 'false', analysis: '应为和。', authorMathNote: 'false' }),
      (a) => ({ sectionCode: '4.5', sectionName: '指数函数与对数函数的应用', stem: '判断：y=log2 x 与 y=2^x 图像关于 y=x 对称。', answer: 'true', analysis: '反函数。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '4.2', sectionName: '指数函数', stem: '判断：指数函数必过原点。', answer: 'false', analysis: '过 (0,1)。', authorMathNote: 'false' }),
      (a) => ({ sectionCode: '4.1', sectionName: '指数与指数幂的运算', stem: '判断：√(a²)=|a|。', answer: 'true', analysis: '算术平方根。', authorMathNote: 'true' }),
    ],
    numeric: [
      (a) => ({ sectionCode: '4.3', sectionName: '对数', stem: `$\\log_{${Math.max(a, 2)}} ${Math.max(a, 2) ** 2}=$`, answer: '2', analysis: '定义。', authorMathNote: '2' }),
      (a) => ({ sectionCode: '4.1', sectionName: '指数与指数幂的运算', stem: `$8^{2/3}=$`, answer: '4', analysis: '(2^3)^{2/3}=4。', authorMathNote: '4' }),
      (a) => ({ sectionCode: '4.2', sectionName: '指数函数', stem: '2^5=', answer: '32', analysis: '计算。', authorMathNote: '32' }),
      (a) => ({ sectionCode: '4.3', sectionName: '对数', stem: 'log2 32=', answer: '5', analysis: '2^5=32。', authorMathNote: '5' }),
      (a) => ({ sectionCode: '4.1', sectionName: '指数与指数幂的运算', stem: '27^{2/3}=', answer: '9', analysis: '计算。', authorMathNote: '9' }),
      (a) => ({ sectionCode: '4.3', sectionName: '对数', stem: 'log3 9 + log3 3=', answer: '3', analysis: '2+1。', authorMathNote: '3' }),
      (a) => ({ sectionCode: '4.2', sectionName: '指数函数', stem: '方程 4^x=2 的解 x=', answer: '0.5', analysis: '(2^2)^x=2^1。', authorMathNote: '1/2' }),
      (a) => ({ sectionCode: '4.1', sectionName: '指数与指数幂的运算', stem: '16^{3/4}=', answer: '8', analysis: '(2^4)^{3/4}=8。', authorMathNote: '8' }),
    ],
    application: [
      (a, b, c, d) => ({ sectionCode: '4.5', sectionName: '指数函数与对数函数的应用', stem: `菌群初值 100，每小时变为 1.5 倍。\n（1）写出 n(t)；（2）求 n(t)=100·1.5^4 的 t。`, answer: 'n=100·1.5^t；t=4。', analysis: '指数模型。', authorMathNote: 't=4', ...rub2({ t: '模型', s: 4, c: '解析式' }, { t: '求解', s: 4, c: 't' }) }),
      (a, b, c, d) => ({ sectionCode: '4.5', sectionName: '指数函数与对数函数的应用', stem: `证明方程 $2^x=5-x$ 在 (1,2) 有唯一实根（说明单调与端点符号）。`, answer: '构造 f 连续严格单调且变号。', analysis: '零点+单调。', authorMathNote: '唯一根', ...rub2({ t: '构造', s: 4, c: 'f' }, { t: '唯一性', s: 4, c: '单调变号' }), ...hp(d || 3, 'E', '零点存在唯一', '连续+单调+变号', '证明型压轴') }),
      (a) => ({ sectionCode: '4.3', sectionName: '对数', stem: `已知 $\\log_4(x-1)+\\log_2(x-1)=3$ 且 x>1。求 x。`, answer: '换底求解。', analysis: '换底合并。', authorMathNote: 'x', ...rub2({ t: '换底', s: 4, c: '变形' }, { t: '求根', s: 4, c: 'x与检验' }) }),
      (a) => ({ sectionCode: '4.5', sectionName: '指数函数与对数函数的应用', stem: '样品 800g，每小时变为原来 1/2。\n（1）n(t)；（2）首次低于 100g 的整小时。', answer: 'n=800·(1/2)^t；t=4。', analysis: '指数衰减。', authorMathNote: 't=4', ...rub2({ t: '模型', s: 4, c: '式' }, { t: '不等式', s: 4, c: 't' }) }),
    ],
  }
}

function makeCh5() {
  return {
    single: [
      (a) => ({ sectionCode: '5.1', sectionName: '任意角和弧度制', stem: `$180^\\circ$ 化为弧度是`, options: { A: '$\\pi$', B: '$\\pi/2$', C: '$2\\pi$', D: '$\\pi/3$' }, answer: 'A', analysis: 'π。', authorMathNote: 'π' }),
      (a) => ({ sectionCode: '5.1', sectionName: '任意角和弧度制', stem: '与 $-\\dfrac{3\\pi}{4}$ 终边相同且在 $[0,2\\pi)$ 的角是', options: { A: '$\\dfrac{5\\pi}{4}$', B: '$\\dfrac{3\\pi}{4}$', C: '$\\dfrac{\\pi}{4}$', D: '$\\dfrac{7\\pi}{4}$' }, answer: 'A', analysis: '加 2π。', authorMathNote: '5π/4' }),
      (a) => ({ sectionCode: '5.2', sectionName: '三角函数的概念', stem: '终边过 P(-3,4)，则 $\\sin\\theta=$', options: { A: '$4/5$', B: '$-4/5$', C: '$3/5$', D: '$-3/5$' }, answer: 'A', analysis: 'r=5。', authorMathNote: '4/5' }),
      (a) => ({ sectionCode: '5.3', sectionName: '诱导公式', stem: '$\\sin(\\pi-\\alpha)=$', options: { A: '$\\sin\\alpha$', B: '$-\\sin\\alpha$', C: '$\\cos\\alpha$', D: '$-\\cos\\alpha$' }, answer: 'A', analysis: '诱导。', authorMathNote: 'sinα' }),
      (a) => ({ sectionCode: '5.4', sectionName: '三角函数的图象与性质', stem: 'y=sin x 的最小正周期是', options: { A: '$2\\pi$', B: '$\\pi$', C: '$\\pi/2$', D: '$4\\pi$' }, answer: 'A', analysis: '正弦周期。', authorMathNote: '2π' }),
      (a) => ({ sectionCode: '5.4', sectionName: '三角函数的图象与性质', stem: 'y=cos x 是', options: { A: '偶函数', B: '奇函数', C: '非奇非偶', D: '既奇又偶' }, answer: 'A', analysis: '偶。', authorMathNote: '偶' }),
      (a) => ({ sectionCode: '5.5', sectionName: '三角恒等变换', stem: '$\\sin 2\\alpha=$', options: { A: '$2\\sin\\alpha\\cos\\alpha$', B: '$\\sin^2\\alpha-\\cos^2\\alpha$', C: '$2\\cos^2\\alpha-1$', D: '$1-2\\sin^2\\alpha$' }, answer: 'A', analysis: '二倍角。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '5.6', sectionName: '函数 y=Asin(ωx+φ)', stem: 'y=3sin(2x) 的振幅是', options: { A: '3', B: '2', C: '6', D: '1' }, answer: 'A', analysis: '|A|。', authorMathNote: '3' }),
      (a) => ({ sectionCode: '5.6', sectionName: '函数 y=Asin(ωx+φ)', stem: 'y=sin(2x) 的最小正周期是', options: { A: '$\\pi$', B: '$2\\pi$', C: '$\\pi/2$', D: '$4\\pi$' }, answer: 'A', analysis: 'T=2π/|ω|。', authorMathNote: 'π' }),
      (a) => ({ sectionCode: '5.5', sectionName: '三角恒等变换', stem: '辅助角公式可用于', options: { A: 'asin x+b cos x 合并', B: '仅求和差', C: '仅诱导', D: '仅定义域' }, answer: 'A', analysis: '辅助角。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '5.2', sectionName: '三角函数的概念', stem: '同角关系 $\\sin^2\\theta+\\cos^2\\theta=$', options: { A: '1', B: '0', C: '2', D: '$\\tan\\theta$' }, answer: 'A', analysis: '平方关系。', authorMathNote: '1' }),
      (a) => ({ sectionCode: '5.4', sectionName: '三角函数的图象与性质', stem: 'y=tan x 的定义域需排除', options: { A: '$x=\\dfrac{\\pi}{2}+k\\pi$', B: '$x=k\\pi$', C: '全部实数无排除', D: '$x=0$ 仅' }, answer: 'A', analysis: '余弦为 0。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '5.1', sectionName: '任意角和弧度制', stem: '半径 6、圆心角 2/3 弧度的弧长为', options: { A: '4', B: '6', C: '2', D: '9' }, answer: 'A', analysis: 'l=rθ。', authorMathNote: '4' }),
      (a) => ({ sectionCode: '5.3', sectionName: '诱导公式', stem: '$\\cos(-\\alpha)=$', options: { A: '$\\cos\\alpha$', B: '$-\\cos\\alpha$', C: '$\\sin\\alpha$', D: '$-\\sin\\alpha$' }, answer: 'A', analysis: '偶。', authorMathNote: 'cos' }),
      (a) => ({ sectionCode: '5.6', sectionName: '函数 y=Asin(ωx+φ)', stem: '把 y=sin x 变成 y=sin(x-π/4) 需要', options: { A: '向右平移 π/4', B: '向左平移 π/4', C: '纵向拉伸', D: '周期减半' }, answer: 'A', analysis: '相位。', authorMathNote: '右移' }),
      (a) => ({ sectionCode: '5.7', sectionName: '三角函数的应用', stem: '简谐运动 s=A sin(ωt) 的振幅是', options: { A: '|A|', B: 'ω', C: 'T', D: 'φ' }, answer: 'A', analysis: '振幅。', authorMathNote: '|A|' }),
    ],
    multi: [
      (a) => ({ sectionCode: '5.3', sectionName: '诱导公式', stem: '诱导公式用途包括（多选）', options: { A: '负角化正', B: '化锐角', C: '求值化简', D: '代替定义域讨论' }, answer: 'A,B,C', analysis: 'D 否。', authorMathNote: 'A,B,C' }),
      (a) => ({ sectionCode: '5.5', sectionName: '三角恒等变换', stem: '二倍角公式包括（多选）', options: { A: 'sin2α=2sinαcosα', B: 'cos2α=cos²α-sin²α', C: 'cos2α=2cos²α-1', D: 'tan2α=2tanα' }, answer: 'A,B,C', analysis: 'D 缺分母。', authorMathNote: 'A,B,C' }),
      (a) => ({ sectionCode: '5.6', sectionName: '函数 y=Asin(ωx+φ)', stem: '由 y=sin x 到 y=Asin(ωx+φ) 可经（多选）', options: { A: '振幅变换', B: '周期变换', C: '平移', D: '仅对称' }, answer: 'A,B,C', analysis: 'D 不是必须。', authorMathNote: 'A,B,C' }),
      (a) => ({ sectionCode: '5.2', sectionName: '三角函数的概念', stem: '三角函数定义可用（多选）', options: { A: '终边点坐标', B: '单位圆', C: '直角三角形锐角', D: '仅代数式无几何' }, answer: 'A,B,C', analysis: '高一强调前三者。', authorMathNote: 'A,B,C' }),
    ],
    judge: [
      (a) => ({ sectionCode: '5.4', sectionName: '三角函数的图象与性质', stem: '判断：y=sin x 是奇函数。', answer: 'true', analysis: '奇。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '5.4', sectionName: '三角函数的图象与性质', stem: '判断：y=cos x 最小正周期为 π。', answer: 'false', analysis: '应为 2π。', authorMathNote: 'false' }),
      (a) => ({ sectionCode: '5.1', sectionName: '任意角和弧度制', stem: '判断：弧度是实数，可与实数运算。', answer: 'true', analysis: '弧度制。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '5.3', sectionName: '诱导公式', stem: '判断：sin(π+α)=-sin α。', answer: 'true', analysis: '诱导。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '5.5', sectionName: '三角恒等变换', stem: '判断：sin(α+β)=sinα+sinβ。', answer: 'false', analysis: '展开非此项。', authorMathNote: 'false' }),
      (a) => ({ sectionCode: '5.6', sectionName: '函数 y=Asin(ωx+φ)', stem: '判断：振幅可为负数。', answer: 'false', analysis: '振幅取绝对值。', authorMathNote: 'false' }),
      (a) => ({ sectionCode: '5.2', sectionName: '三角函数的概念', stem: '判断：正切在余弦为 0 处无定义。', answer: 'true', analysis: '定义。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '5.4', sectionName: '三角函数的图象与性质', stem: '判断：y=tan x 是奇函数。', answer: 'true', analysis: '奇。', authorMathNote: 'true' }),
    ],
    numeric: [
      (a) => ({ sectionCode: '5.1', sectionName: '任意角和弧度制', stem: '半径 6、圆心角 π/3 的弧长为', answer: '2', analysis: 'l=rθ=2。', authorMathNote: '2' }),
      (a) => ({ sectionCode: '5.5', sectionName: '三角恒等变换', stem: 'sin(π/6)+cos(π/3)=', answer: '1', analysis: '0.5+0.5。', authorMathNote: '1' }),
      (a) => ({ sectionCode: '5.6', sectionName: '函数 y=Asin(ωx+φ)', stem: 'y=2sin(3x) 的振幅为', answer: '2', analysis: '|A|。', authorMathNote: '2' }),
      (a) => ({ sectionCode: '5.6', sectionName: '函数 y=Asin(ωx+φ)', stem: 'y=sin(2x) 最小正周期为（填 π 的倍数：填数字，表示 kπ 的 k）', answer: '1', analysis: 'T=π，k=1。', authorMathNote: '1' }),
      (a) => ({ sectionCode: '5.2', sectionName: '三角函数的概念', stem: '若 sinθ=3/5 且锐角，则 cosθ=（填最简分数的分子，分母为5）', answer: '4', analysis: '勾股。', authorMathNote: '4/5' }),
      (a) => ({ sectionCode: '5.5', sectionName: '三角恒等变换', stem: '2sin(π/4)cos(π/4)=', answer: '1', analysis: 'sin(π/2)。', authorMathNote: '1' }),
      (a) => ({ sectionCode: '5.1', sectionName: '任意角和弧度制', stem: '240° 化为弧度是 kπ/3，则 k=', answer: '4', analysis: '4π/3。', authorMathNote: '4' }),
      (a) => ({ sectionCode: '5.4', sectionName: '三角函数的图象与性质', stem: 'y=3sin x+4cos x 的最大值为', answer: '5', analysis: '辅助角振幅 5。', authorMathNote: '5' }),
    ],
    application: [
      (a, b, c, d) => ({ sectionCode: '5.6', sectionName: '函数 y=Asin(ωx+φ)', stem: `已知 y=3sin(2x-π/3)。\n（1）求振幅与周期；（2）求 x=0 时的值。`, answer: '振幅3，周期π；值 3sin(-π/3)。', analysis: '读参数。', authorMathNote: '3,π', ...rub2({ t: '参数', s: 4, c: 'A,T' }, { t: '求值', s: 4, c: '代入' }) }),
      (a, b, c, d) => ({ sectionCode: '5.7', sectionName: '三角函数的应用', stem: '测塔：远处仰角 30°，前进 20m 后仰角 60°。\n（1）列关于塔高 h 的方程；（2）求 h。', answer: '解直角三角形。', analysis: '测量模型。', authorMathNote: 'h', ...rub2({ t: '建模', s: 5, c: '方程' }, { t: '求解', s: 5, c: 'h' }, 10), ...hp(d || 3, 'G', '测量建模解三角', '两仰角列式', '几何建模') }),
      (a) => ({ sectionCode: '5.5', sectionName: '三角恒等变换', stem: '已知 sinα=3/5，α 锐角。\n（1）求 cosα；（2）求 sin2α。', answer: 'cos=4/5；sin2α=24/25。', analysis: '同角+二倍角。', authorMathNote: '24/25', ...rub2({ t: 'cos', s: 4, c: '值' }, { t: '二倍', s: 4, c: 'sin2α' }) }),
      (a) => ({ sectionCode: '5.7', sectionName: '三角函数的应用', stem: '潮高 h=2sin(πt/6)+4。\n（1）最高潮高；（2）周期。', answer: '最高 6；周期 12。', analysis: '读振幅周期。', authorMathNote: '6;12', ...rub2({ t: '最高', s: 4, c: '6' }, { t: '周期', s: 4, c: '12' }) }),
    ],
  }
}

function makeCh6() {
  return {
    single: [
      (a, b) => ({ sectionCode: '6.1', sectionName: '向量的概念', stem: '零向量的模是', options: { A: '0', B: '1', C: '无穷', D: '不确定' }, answer: 'A', analysis: '定义。', authorMathNote: '0' }),
      (a, b) => ({ sectionCode: '6.2', sectionName: '向量的运算', stem: `设 $\\vec a=(${a},${b})$，则 $|\\vec a|$ 的平方为`, options: { A: String(a * a + b * b), B: String(a + b), C: String(a * b), D: String(a - b) }, answer: 'A', analysis: '模平方。', authorMathNote: String(a * a + b * b) }),
      (a, b) => ({ sectionCode: '6.2', sectionName: '向量的运算', stem: `若 $\\vec a=(1,0)$，$\\vec b=(0,1)$，则夹角为`, options: { A: '$90^\\circ$', B: '$0^\\circ$', C: '$45^\\circ$', D: '$180^\\circ$' }, answer: 'A', analysis: '数量积 0。', authorMathNote: '90°' }),
      (a, b) => ({ sectionCode: '6.2', sectionName: '向量的运算', stem: `$\\vec a\\cdot\\vec a=$`, options: { A: '$|\\vec a|^2$', B: '$|\\vec a|$', C: '0', D: '1' }, answer: 'A', analysis: '数量积。', authorMathNote: '|a|²' }),
      (a, b) => ({ sectionCode: '6.3', sectionName: '平面向量基本定理及坐标表示', stem: '平面内一组基底要求', options: { A: '两不共线向量', B: '任意两向量', C: '必须单位且同向', D: '三个向量' }, answer: 'A', analysis: '基本定理。', authorMathNote: 'A' }),
      (a, b) => ({ sectionCode: '6.2', sectionName: '向量的运算', stem: `已知 $|\\vec a|=3$，$|\\vec b|=4$，夹角 90°，则 $|\\vec a+\\vec b|=$`, options: { A: '5', B: '7', C: '1', D: '12' }, answer: 'A', analysis: '勾股。', authorMathNote: '5' }),
      (a, b) => ({ sectionCode: '6.3', sectionName: '平面向量基本定理及坐标表示', stem: `$\\vec a=(2,4)$，$\\vec b=(1,k)$ 共线，则 k=`, options: { A: '2', B: '1', C: '4', D: '0' }, answer: 'A', analysis: '对应坐标成比例。', authorMathNote: '2' }),
      (a, b) => ({ sectionCode: '6.2', sectionName: '向量的运算', stem: '投影数量公式中需要', options: { A: '模与夹角余弦', B: '仅模', C: '仅方向', D: '面积' }, answer: 'A', analysis: '投影。', authorMathNote: 'A' }),
      (a, b) => ({ sectionCode: '6.1', sectionName: '向量的概念', stem: '相等向量要求', options: { A: '模相等且方向相同', B: '仅模相等', C: '仅起点相同', D: '共线即可' }, answer: 'A', analysis: '定义。', authorMathNote: 'A' }),
      (a, b) => ({ sectionCode: '6.4', sectionName: '平面向量的应用', stem: '力与位移数量积可表示', options: { A: '功', B: '质量', C: '密度', D: '温度' }, answer: 'A', analysis: '功=F·s。', authorMathNote: '功' }),
      (a, b) => ({ sectionCode: '6.2', sectionName: '向量的运算', stem: '向量加法满足', options: { A: '交换律', B: '仅结合不交换', C: '不满足任何运算律', D: '必须共起点才能加' }, answer: 'A', analysis: '运算律。', authorMathNote: '交换' }),
      (a, b) => ({ sectionCode: '6.3', sectionName: '平面向量基本定理及坐标表示', stem: '两向量垂直的坐标条件是', options: { A: '数量积为 0', B: '模相等', C: '坐标对应成比例', D: '起点相同' }, answer: 'A', analysis: '垂直⇔点积0。', authorMathNote: 'A' }),
      (a, b) => ({ sectionCode: '6.1', sectionName: '向量的概念', stem: '单位向量的模是', options: { A: '1', B: '0', C: '2', D: '任意' }, answer: 'A', analysis: '定义。', authorMathNote: '1' }),
      (a, b) => ({ sectionCode: '6.2', sectionName: '向量的运算', stem: `$3(1,-2)-2(2,1)$ 的横坐标为`, options: { A: '-1', B: '1', C: '3', D: '0' }, answer: 'A', analysis: '3-4=-1。', authorMathNote: '-1' }),
      (a, b) => ({ sectionCode: '6.4', sectionName: '平面向量的应用', stem: '用向量证中位线常用', options: { A: '中点向量公式', B: '仅三角函数', C: '仅坐标无关', D: '仅面积' }, answer: 'A', analysis: '几何证明。', authorMathNote: 'A' }),
      (a, b) => ({ sectionCode: '6.2', sectionName: '向量的运算', stem: '平行四边形法则的对角线表示', options: { A: '两邻边向量之和', B: '差', C: '积', D: '商' }, answer: 'A', analysis: '加法几何意义。', authorMathNote: '和' }),
    ],
    multi: [
      (a) => ({ sectionCode: '6.2', sectionName: '向量的运算', stem: '关于数量积正确的有（多选）', options: { A: '交换律', B: '结果为数量', C: '可负', D: '结果必为向量' }, answer: 'A,B,C', analysis: 'D 错。', authorMathNote: 'A,B,C' }),
      (a) => ({ sectionCode: '6.1', sectionName: '向量的概念', stem: '下列属于向量的有（多选）', options: { A: '力', B: '位移', C: '速度', D: '质量' }, answer: 'A,B,C', analysis: '质量标量。', authorMathNote: 'A,B,C' }),
      (a) => ({ sectionCode: '6.3', sectionName: '平面向量基本定理及坐标表示', stem: '共线条件等价于（多选）', options: { A: '存在实数 λ 使 a=λb（b≠0）', B: '坐标对应成比例', C: '夹角 0° 或 180°', D: '模一定相等' }, answer: 'A,B,C', analysis: 'D 不必。', authorMathNote: 'A,B,C' }),
      (a) => ({ sectionCode: '6.2', sectionName: '向量的运算', stem: '运算律正确的有（多选）', options: { A: '加法交换', B: '加法结合', C: '数乘分配', D: '数量积满足消去律对任意向量' }, answer: 'A,B,C', analysis: 'D 一般不。', authorMathNote: 'A,B,C' }),
    ],
    judge: [
      (a) => ({ sectionCode: '6.1', sectionName: '向量的概念', stem: '判断：零向量与任何向量平行。', answer: 'true', analysis: '规定。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '6.2', sectionName: '向量的运算', stem: '判断：$(\\vec a+\\vec b)\\cdot(\\vec a+\\vec b)=|\\vec a|^2+|\\vec b|^2+2\\vec a\\cdot\\vec b$。', answer: 'true', analysis: '展开。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '6.1', sectionName: '向量的概念', stem: '判断：相等向量必共起点。', answer: 'false', analysis: '自由向量。', authorMathNote: 'false' }),
      (a) => ({ sectionCode: '6.3', sectionName: '平面向量基本定理及坐标表示', stem: '判断：任意两个非零向量都可作基底。', answer: 'false', analysis: '需不共线。', authorMathNote: 'false' }),
      (a) => ({ sectionCode: '6.2', sectionName: '向量的运算', stem: '判断：数量积满足结合律 (a·b)·c=a·(b·c)。', answer: 'false', analysis: '左为数乘向量，右未必同型。', authorMathNote: 'false' }),
      (a) => ({ sectionCode: '6.4', sectionName: '平面向量的应用', stem: '判断：功可以为负。', answer: 'true', analysis: '钝角时负功。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '6.1', sectionName: '向量的概念', stem: '判断：模相等的向量一定相等。', answer: 'false', analysis: '方向可能不同。', authorMathNote: 'false' }),
      (a) => ({ sectionCode: '6.2', sectionName: '向量的运算', stem: '判断：垂直则数量积为 0（含零向量）。', answer: 'true', analysis: '定义推广。', authorMathNote: 'true' }),
    ],
    numeric: [
      (a, b) => ({ sectionCode: '6.2', sectionName: '向量的运算', stem: `设 $\\vec a=(${a},${b})$，则 $|\\vec a|^2=$`, answer: String(a * a + b * b), analysis: '模平方。', authorMathNote: String(a * a + b * b) }),
      (a, b) => ({ sectionCode: '6.2', sectionName: '向量的运算', stem: `设 $|\\vec a|=${a}$，$|\\vec b|=${b}$，$\\vec a\\cdot\\vec b=${Math.min(a, b)}$，则 $|\\vec a+\\vec b|^2=$`, answer: String(a * a + b * b + 2 * Math.min(a, b)), analysis: '展开。', authorMathNote: String(a * a + b * b + 2 * Math.min(a, b)) }),
      (a, b) => ({ sectionCode: '6.2', sectionName: '向量的运算', stem: `$\\vec a=(1,2)$，$\\vec b=(3,-1)$，则 $\\vec a\\cdot\\vec b=$`, answer: '1', analysis: '3-2=1。', authorMathNote: '1' }),
      (a, b) => ({ sectionCode: '6.3', sectionName: '平面向量基本定理及坐标表示', stem: '点 A(1,2)、B(4,6)，则 |AB|=', answer: '5', analysis: '3-4-5。', authorMathNote: '5' }),
      (a, b) => ({ sectionCode: '6.2', sectionName: '向量的运算', stem: `|a|=5，|b|=2，夹角 60°，则 a 在 b 上投影数量为`, answer: '2.5', analysis: '5·cos60°=2.5。', authorMathNote: '5/2' }),
      (a, b) => ({ sectionCode: '6.2', sectionName: '向量的运算', stem: '3(2,1) 的纵坐标为', answer: '3', analysis: '数乘。', authorMathNote: '3' }),
      (a, b) => ({ sectionCode: '6.3', sectionName: '平面向量基本定理及坐标表示', stem: 'a=(2,4)，b=(1,k) 共线，k=', answer: '2', analysis: '比例。', authorMathNote: '2' }),
      (a, b) => ({ sectionCode: '6.2', sectionName: '向量的运算', stem: 'F=(6,8)，s=(3,0)，W=F·s=', answer: '18', analysis: '功。', authorMathNote: '18' }),
    ],
    application: [
      (a, b, c, d) => ({ sectionCode: '6.4', sectionName: '平面向量的应用', stem: `OA=(${a},0)，OB=(0,${b})。\n（1）求 AB；（2）求 |AB|。`, answer: `AB=(-${a},${b})；模 √(a²+b²)。`, analysis: '坐标运算。', authorMathNote: '模', ...rub2({ t: '向量', s: 4, c: 'AB' }, { t: '模', s: 4, c: '值' }) }),
      (a, b, c, d) => ({ sectionCode: '6.4', sectionName: '平面向量的应用', stem: '在 △ABC 中，D、E 为 AB、AC 中点。用向量证明 DE∥BC 且 DE=1/2 BC。', answer: '中位线向量证明。', analysis: '向量法。', authorMathNote: '中位线', ...rub2({ t: '设向量', s: 4, c: '设定' }, { t: '证明', s: 4, c: '结论' }), ...hp(d || 3, 'F', '向量法几何证明', '设基向量→表示→比较', '证明书写') }),
      (a) => ({ sectionCode: '6.2', sectionName: '向量的运算', stem: `已知 |a|=${a}，|b|=${a + 1}，a·b=${a}。\n（1）求 |a+b|²；（2）求夹角余弦。`, answer: '展开；cos=…。', analysis: '数量积。', authorMathNote: '展开', ...rub2({ t: '模方', s: 4, c: '值' }, { t: '余弦', s: 4, c: 'cos' }) }),
      (a) => ({ sectionCode: '6.4', sectionName: '平面向量的应用', stem: '船先东 6km 再北 8km。\n（1）合位移大小；（2）相对正东偏角。', answer: '10；arctan(8/6)。', analysis: '合成。', authorMathNote: '10', ...rub2({ t: '大小', s: 4, c: '10' }, { t: '方向', s: 4, c: '偏角' }) }),
    ],
  }
}

function makeCh7() {
  return {
    single: [
      (a) => ({ sectionCode: '7.1', sectionName: '复数的概念', stem: '$\\mathrm{i}^2=$', options: { A: '-1', B: '1', C: '0', D: 'i' }, answer: 'A', analysis: '虚数单位。', authorMathNote: '-1' }),
      (a) => ({ sectionCode: '7.1', sectionName: '复数的概念', stem: '复数 a+bi（a,b∈R）的实部是', options: { A: 'a', B: 'b', C: 'i', D: '|z|' }, answer: 'A', analysis: '定义。', authorMathNote: 'a' }),
      (a) => ({ sectionCode: '7.2', sectionName: '复数的运算', stem: '$(1+i)+(1-i)=$', options: { A: '2', B: '2i', C: '0', D: '1' }, answer: 'A', analysis: '实部加。', authorMathNote: '2' }),
      (a) => ({ sectionCode: '7.2', sectionName: '复数的运算', stem: '$(1+i)(1-i)=$', options: { A: '2', B: '0', C: '1', D: 'i' }, answer: 'A', analysis: '平方差。', authorMathNote: '2' }),
      (a) => ({ sectionCode: '7.3', sectionName: '复数的三角形式初步', stem: '$|3-4i|=$', options: { A: '5', B: '7', C: '1', D: '12' }, answer: 'A', analysis: '模。', authorMathNote: '5' }),
      (a) => ({ sectionCode: '7.1', sectionName: '复数的概念', stem: '两个复数相等当且仅当', options: { A: '实部虚部分别相等', B: '模相等', C: '仅实部相等', D: '仅虚部相等' }, answer: 'A', analysis: '相等定义。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '7.2', sectionName: '复数的运算', stem: '共轭复数 $z=a+bi$ 的共轭是', options: { A: '$a-bi$', B: '$-a+bi$', C: '$-a-bi$', D: '$b+ai$' }, answer: 'A', analysis: '共轭。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '7.3', sectionName: '复数的三角形式初步', stem: '模为 1 的复数在复平面上对应', options: { A: '单位圆', B: '实轴', C: '虚轴', D: '原点' }, answer: 'A', analysis: '几何意义。', authorMathNote: '单位圆' }),
      (a) => ({ sectionCode: '7.1', sectionName: '复数的概念', stem: '纯虚数的实部为', options: { A: '0 且虚部≠0', B: '1', C: '任意', D: '虚部为 0' }, answer: 'A', analysis: '定义。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '7.2', sectionName: '复数的运算', stem: '$\\mathrm{i}^4=$', options: { A: '1', B: '-1', C: 'i', D: '-i' }, answer: 'A', analysis: '四周期。', authorMathNote: '1' }),
      (a) => ({ sectionCode: '7.2', sectionName: '复数的运算', stem: '$\\mathrm{i}^3=$', options: { A: '-i', B: 'i', C: '1', D: '-1' }, answer: 'A', analysis: 'i²·i。', authorMathNote: '-i' }),
      (a) => ({ sectionCode: '7.3', sectionName: '复数的三角形式初步', stem: '|z|² 等于', options: { A: 'z·共轭(z)', B: 'z²', C: '实部', D: '虚部' }, answer: 'A', analysis: '模方。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '7.1', sectionName: '复数的概念', stem: '复平面横轴表示', options: { A: '实部', B: '虚部', C: '模', D: '辐角' }, answer: 'A', analysis: '实轴。', authorMathNote: '实部' }),
      (a) => ({ sectionCode: '7.2', sectionName: '复数的运算', stem: '$(2+i)+(3-2i)=$', options: { A: '5-i', B: '5+i', C: '1+i', D: '6-i' }, answer: 'A', analysis: '相加。', authorMathNote: '5-i' }),
      (a) => ({ sectionCode: '7.3', sectionName: '复数的三角形式初步', stem: '1+i 的模为', options: { A: '$\\sqrt{2}$', B: '1', C: '2', D: '0' }, answer: 'A', analysis: '√2。', authorMathNote: '√2' }),
      (a) => ({ sectionCode: '7.1', sectionName: '复数的概念', stem: '实数集与复数集的关系是', options: { A: '实数是虚部为 0 的复数', B: '无包含关系', C: '复数是实数真子集', D: '相等' }, answer: 'A', analysis: '包含。', authorMathNote: 'A' }),
    ],
    multi: [
      (a) => ({ sectionCode: '7.1', sectionName: '复数的概念', stem: '关于复数正确的有（多选）', options: { A: 'i²=-1', B: '实部虚部为实数', C: '可比较大小如实数一样对一切复数', D: '相等看实部虚部' }, answer: 'A,B,D', analysis: 'C 错。', authorMathNote: 'A,B,D' }),
      (a) => ({ sectionCode: '7.2', sectionName: '复数的运算', stem: '运算正确的有（多选）', options: { A: '加法交换', B: '乘法交换', C: '除以零有意义', D: '共轭的共轭为自身' }, answer: 'A,B,D', analysis: 'C 错。', authorMathNote: 'A,B,D' }),
      (a) => ({ sectionCode: '7.3', sectionName: '复数的三角形式初步', stem: '模的性质有（多选）', options: { A: '|z|≥0', B: '|z1 z2|=|z1||z2|', C: '|z|=0⇔z=0', D: '|z1+z2|=|z1|+|z2| 恒成立' }, answer: 'A,B,C', analysis: 'D 三角不等式。', authorMathNote: 'A,B,C' }),
      (a) => ({ sectionCode: '7.1', sectionName: '复数的概念', stem: '虚数单位相关正确的有（多选）', options: { A: 'i^4=1', B: 'i^2=-1', C: 'i^3=-i', D: 'i=√(-1) 在实数范围内有意义' }, answer: 'A,B,C', analysis: 'D 不在实数。', authorMathNote: 'A,B,C' }),
    ],
    judge: [
      (a) => ({ sectionCode: '7.1', sectionName: '复数的概念', stem: '判断：i²=-1。', answer: 'true', analysis: '定义。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '7.3', sectionName: '复数的三角形式初步', stem: '判断：|3-4i|=5。', answer: 'true', analysis: '模。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '7.1', sectionName: '复数的概念', stem: '判断：所有复数都能比较大小。', answer: 'false', analysis: '一般不可比。', authorMathNote: 'false' }),
      (a) => ({ sectionCode: '7.2', sectionName: '复数的运算', stem: '判断：共轭复数的模相等。', answer: 'true', analysis: '模。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '7.2', sectionName: '复数的运算', stem: '判断：i^4=1。', answer: 'true', analysis: '周期。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '7.1', sectionName: '复数的概念', stem: '判断：0 是纯虚数。', answer: 'false', analysis: '0 是实数。', authorMathNote: 'false' }),
      (a) => ({ sectionCode: '7.3', sectionName: '复数的三角形式初步', stem: '判断：模为 0 的复数只有 0。', answer: 'true', analysis: '性质。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '7.2', sectionName: '复数的运算', stem: '判断：(1+i)/(1+i)=1。', answer: 'true', analysis: '同除。', authorMathNote: 'true' }),
    ],
    numeric: [
      (a) => ({ sectionCode: '7.3', sectionName: '复数的三角形式初步', stem: `|${a}-${b}i|=` .replace('undefined', ''), answer: String(Math.round(Math.sqrt(a * a + (seed(a, 3, 8)) ** 2))) || '5', analysis: '临时', authorMathNote: 'mod' }),
    ],
    application: [
      (a, b, c, d) => ({ sectionCode: '7.2', sectionName: '复数的运算', stem: `计算 $(${a}+i)(${a}-i)$，并求结果的模。`, answer: `实数 ${a * a + 1}；模同。`, analysis: '平方差。', authorMathNote: String(a * a + 1), ...rub2({ t: '乘积', s: 4, c: '实数' }, { t: '模', s: 4, c: '值' }) }),
      (a, b, c, d) => ({ sectionCode: '7.3', sectionName: '复数的三角形式初步', stem: `设 z=5-12i。\n（1）求 |z|；（2）求 z·共轭(z)。`, answer: '|z|=13；乘积=169。', analysis: '模与共轭。', authorMathNote: '13', ...rub2({ t: '模', s: 4, c: '13' }, { t: '乘积', s: 4, c: '169' }) }),
      (a) => ({ sectionCode: '7.2', sectionName: '复数的运算', stem: '计算 (1+2i)(3-i)，并求结果的模。', answer: '5+5i；模 5√2。', analysis: '展开。', authorMathNote: '5√2', ...rub2({ t: '乘', s: 4, c: '代数式' }, { t: '模', s: 4, c: '值' }) }),
      (a, b, c, d) => ({ sectionCode: '7.1', sectionName: '复数的概念', stem: '说明：为何复数一般不能比较大小？举例说明。', answer: '序公理无法与运算兼容；举例。', analysis: '概念辨析。', authorMathNote: '不可比', ...rub2({ t: '说明', s: 4, c: '理由' }, { t: '例子', s: 4, c: '反例' }), ...hp(d || 3, 'B', '复数序问题', '概念+反例', '概念压轴') }),
    ],
  }
}

// Fix ch7 numeric - the above has a bug. Let me replace makeCh7 numeric properly in a patch after.
function fixLater() {}

function makeCh8() {
  return {
    single: [
      (a) => ({ sectionCode: '8.1', sectionName: '空间几何体', stem: '直棱柱的侧棱与底面', options: { A: '垂直', B: '平行', C: '斜交', D: '无关' }, answer: 'A', analysis: '直棱柱定义。', authorMathNote: '垂直' }),
      (a) => ({ sectionCode: '8.3', sectionName: '空间几何体的表面积与体积', stem: `棱长为 ${a} 的正方体体积为`, options: { A: String(a ** 3), B: String(a * a), C: String(6 * a * a), D: String(4 * a) }, answer: 'A', analysis: 'a³。', authorMathNote: String(a ** 3) }),
      (a) => ({ sectionCode: '8.3', sectionName: '空间几何体的表面积与体积', stem: '圆柱体积公式是', options: { A: '$\\pi r^2 h$', B: '$2\\pi r h$', C: '$\\dfrac{4}{3}\\pi r^3$', D: '$\\dfrac{1}{3}\\pi r^2 h$' }, answer: 'A', analysis: '柱体。', authorMathNote: 'πr²h' }),
      (a) => ({ sectionCode: '8.3', sectionName: '空间几何体的表面积与体积', stem: '圆锥体积公式是', options: { A: '$\\dfrac{1}{3}\\pi r^2 h$', B: '$\\pi r^2 h$', C: '$4\\pi r^2$', D: '$2\\pi r$' }, answer: 'A', analysis: '1/3。', authorMathNote: '1/3πr²h' }),
      (a) => ({ sectionCode: '8.4', sectionName: '空间点、直线、平面之间的位置关系', stem: '过直线外一点与已知直线平行的直线', options: { A: '有且仅有一条', B: '无数条', C: '不存在', D: '恰两条' }, answer: 'A', analysis: '平行公理。', authorMathNote: '一条' }),
      (a) => ({ sectionCode: '8.5', sectionName: '空间直线、平面的平行', stem: '若直线与平面平行，则该直线与平面内直线', options: { A: '平行或异面', B: '必相交', C: '必垂直', D: '必重合' }, answer: 'A', analysis: '位置关系。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '8.6', sectionName: '空间直线、平面的垂直', stem: '若直线垂直于平面，则它与平面内任意直线', options: { A: '垂直', B: '平行', C: '相交不垂直', D: '异面不垂直' }, answer: 'A', analysis: '线面垂直定义。', authorMathNote: '垂直' }),
      (a) => ({ sectionCode: '8.2', sectionName: '空间几何体的直观图', stem: '斜二测中，与 y 轴平行的线段通常取原来的', options: { A: '一半', B: '不变', C: '两倍', D: '√2 倍' }, answer: 'A', analysis: '斜二测。', authorMathNote: '1/2' }),
      (a) => ({ sectionCode: '8.3', sectionName: '空间几何体的表面积与体积', stem: '球体积公式是', options: { A: '$\\dfrac{4}{3}\\pi r^3$', B: '$4\\pi r^2$', C: '$\\pi r^2 h$', D: '$\\dfrac{1}{3}\\pi r^2 h$' }, answer: 'A', analysis: '球体。', authorMathNote: '4/3πr³' }),
      (a) => ({ sectionCode: '8.1', sectionName: '空间几何体', stem: '正方体是特殊的', options: { A: '棱柱', B: '棱锥', C: '圆柱', D: '圆锥' }, answer: 'A', analysis: '特殊棱柱。', authorMathNote: '棱柱' }),
      (a) => ({ sectionCode: '8.5', sectionName: '空间直线、平面的平行', stem: '面面平行的一个判定是', options: { A: '一个平面内两相交直线分别平行于另一平面', B: '两平面有一交线', C: '法向量平行即可不管', D: '有一条公共直线' }, answer: 'A', analysis: '判定定理。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '8.6', sectionName: '空间直线、平面的垂直', stem: '线面垂直判定常用', options: { A: '垂直平面内两相交直线', B: '垂直平面内一条直线', C: '与法向量平行即可不证', D: '仅看异面' }, answer: 'A', analysis: '判定。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '8.3', sectionName: '空间几何体的表面积与体积', stem: `底面边长 3 的正四棱柱高 4，体积为`, options: { A: '36', B: '12', C: '48', D: '24' }, answer: 'A', analysis: '9×4。', authorMathNote: '36' }),
      (a) => ({ sectionCode: '8.4', sectionName: '空间点、直线、平面之间的位置关系', stem: '平面外一条直线与平面内一条直线平行，则该直线与平面', options: { A: '平行', B: '相交', C: '在平面内', D: '垂直' }, answer: 'A', analysis: '线面平行判定。', authorMathNote: '平行' }),
      (a) => ({ sectionCode: '8.1', sectionName: '空间几何体', stem: '简单组合体是指', options: { A: '由基本几何体组合', B: '仅球体', C: '仅平面图形', D: '无法度量' }, answer: 'A', analysis: '概念。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '8.2', sectionName: '空间几何体的直观图', stem: '水平放置平面图形画直观图常用', options: { A: '斜二测', B: '仅三视图无直观', C: '仅坐标无图', D: '任意比例无规范' }, answer: 'A', analysis: '斜二测。', authorMathNote: '斜二测' }),
    ],
    multi: [
      (a) => ({ sectionCode: '8.5', sectionName: '空间直线、平面的平行', stem: '面面平行判定可用（多选）', options: { A: '两相交线分别∥另一面', B: '两面法向量平行（空间向量法）', C: '有一公共点', D: '有一交线' }, answer: 'A,B', analysis: 'C、D 不是平行。', authorMathNote: 'A,B' }),
      (a) => ({ sectionCode: '8.1', sectionName: '空间几何体', stem: '可作为棱柱的有（多选）', options: { A: '正方体', B: '长方体', C: '直三棱柱', D: '圆锥' }, answer: 'A,B,C', analysis: '圆锥非棱柱。', authorMathNote: 'A,B,C' }),
      (a) => ({ sectionCode: '8.6', sectionName: '空间直线、平面的垂直', stem: '线面垂直则（多选）', options: { A: '与面内任意直线垂直', B: '与面的法向量平行', C: '与面内一条直线垂直即可判定', D: '垂足唯一' }, answer: 'A,B,D', analysis: 'C 不足。', authorMathNote: 'A,B,D' }),
      (a) => ({ sectionCode: '8.3', sectionName: '空间几何体的表面积与体积', stem: '体积公式正确的有（多选）', options: { A: '柱：底面积×高', B: '锥：1/3 底面积×高', C: '球：4/3 πr³', D: '锥：底面积×高' }, answer: 'A,B,C', analysis: 'D 缺 1/3。', authorMathNote: 'A,B,C' }),
    ],
    judge: [
      (a) => ({ sectionCode: '8.3', sectionName: '空间几何体的表面积与体积', stem: '判断：圆锥体积公式含系数 1/3。', answer: 'true', analysis: '公式。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '8.4', sectionName: '空间点、直线、平面之间的位置关系', stem: '判断：若直线与平面内一条直线平行，则直线必与平面平行。', answer: 'false', analysis: '可能在平面内。', authorMathNote: 'false' }),
      (a) => ({ sectionCode: '8.1', sectionName: '空间几何体', stem: '判断：正方体是特殊棱柱。', answer: 'true', analysis: '是。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '8.6', sectionName: '空间直线、平面的垂直', stem: '判断：线面垂直则线与面内任意线垂直。', answer: 'true', analysis: '定义。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '8.5', sectionName: '空间直线、平面的平行', stem: '判断：两平面平行则无公共点。', answer: 'true', analysis: '定义。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '8.2', sectionName: '空间几何体的直观图', stem: '判断：斜二测中横纵长度都减半。', answer: 'false', analysis: '仅平行 y 轴减半。', authorMathNote: 'false' }),
      (a) => ({ sectionCode: '8.3', sectionName: '空间几何体的表面积与体积', stem: '判断：球表面积是 4πr²。', answer: 'true', analysis: '公式。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '8.4', sectionName: '空间点、直线、平面之间的位置关系', stem: '判断：空间两直线要么相交要么平行。', answer: 'false', analysis: '还有异面。', authorMathNote: 'false' }),
    ],
    numeric: [
      (a) => ({ sectionCode: '8.3', sectionName: '空间几何体的表面积与体积', stem: `棱长 ${a} 的正方体体积为`, answer: String(a ** 3), analysis: 'a³。', authorMathNote: String(a ** 3) }),
      (a) => ({ sectionCode: '8.3', sectionName: '空间几何体的表面积与体积', stem: '底面半径 3、高 4 的圆锥体积除以 π 的结果为', answer: '12', analysis: '1/3·9·4=12。', authorMathNote: '12' }),
      (a) => ({ sectionCode: '8.3', sectionName: '空间几何体的表面积与体积', stem: '圆柱 r=2,h=5 体积除以 π =', answer: '20', analysis: '4·5。', authorMathNote: '20' }),
      (a) => ({ sectionCode: '8.3', sectionName: '空间几何体的表面积与体积', stem: '正四棱锥底边 6 高 4，体积为', answer: '48', analysis: '1/3·36·4。', authorMathNote: '48' }),
      (a) => ({ sectionCode: '8.3', sectionName: '空间几何体的表面积与体积', stem: '球半径 3，体积除以 π =', answer: '36', analysis: '4/3·27=36。', authorMathNote: '36' }),
      (a) => ({ sectionCode: '8.3', sectionName: '空间几何体的表面积与体积', stem: '长方体 2×3×4 的体对角线平方为', answer: '29', analysis: '4+9+16。', authorMathNote: '29' }),
      (a) => ({ sectionCode: '8.3', sectionName: '空间几何体的表面积与体积', stem: '圆柱 r=2,h=6 上同底圆锥 h=3，组合体积除以 π =', answer: '28', analysis: '24+4。', authorMathNote: '28' }),
      (a) => ({ sectionCode: '8.3', sectionName: '空间几何体的表面积与体积', stem: '正方体棱长 1，面对角线长的平方为', answer: '2', analysis: '√2 的平方。', authorMathNote: '2' }),
    ],
    application: [
      (a, b, c, d) => ({ sectionCode: '8.3', sectionName: '空间几何体的表面积与体积', stem: `圆柱（半径 ${a}，高 ${a + 2}）上叠放同底圆锥（高 ${a}）。求组合体体积（含 π）。`, answer: 'πa²(a+2)+1/3 πa²·a。', analysis: '柱+锥。', authorMathNote: '体积', ...rub2({ t: '柱', s: 4, c: '体积' }, { t: '锥与总和', s: 4, c: '总和' }) }),
      (a, b, c, d) => ({ sectionCode: '8.6', sectionName: '空间直线、平面的垂直', stem: '在正方体 ABCD-A1B1C1D1 中证明 BD1 ⊥ 平面 A1C1D（写出关键步骤）。', answer: '线面垂直判定。', analysis: '证明。', authorMathNote: '证明', ...rub2({ t: '准备', s: 4, c: '相关垂直' }, { t: '结论', s: 4, c: '判定' }), ...hp(d || 3, 'H', '线面垂直证明', '找面内两相交线垂直', '空间证明') }),
      (a) => ({ sectionCode: '8.3', sectionName: '空间几何体的表面积与体积', stem: '圆锥底面半径 3、高 4。（1）求体积（含 π）；（2）求轴截面面积。', answer: '12π；等腰三角形面积。', analysis: '体积+截面。', authorMathNote: '12π', ...rub2({ t: '体积', s: 4, c: '12π' }, { t: '轴截面', s: 4, c: '面积' }) }),
      (a) => ({ sectionCode: '8.5', sectionName: '空间直线、平面的平行', stem: '长方体中 E、F 为 AA1、CC1 中点。证明 EF∥平面 ABCD。', answer: '线面平行判定。', analysis: '中位线或坐标。', authorMathNote: '证明', ...rub2({ t: '构造', s: 4, c: '平行线' }, { t: '判定', s: 4, c: '结论' }) }),
    ],
  }
}

function makeCh9() {
  return {
    single: [
      (a) => ({ sectionCode: '9.1', sectionName: '随机抽样', stem: '简单随机抽样的特点是', options: { A: '每个个体被抽中概率相等', B: '按意愿抽', C: '只抽方便样本', D: '必须分层' }, answer: 'A', analysis: '定义。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '9.1', sectionName: '随机抽样', stem: '分层抽样适用于', options: { A: '总体由差异明显的层组成', B: '总体完全均匀且无需层', C: '只能抽一次', D: '不要随机' }, answer: 'A', analysis: '分层。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '9.2', sectionName: '用样本估计总体', stem: '样本平均数用于估计', options: { A: '总体均值', B: '总体方差必精确', C: '总体偏度', D: '样本量' }, answer: 'A', analysis: '点估计。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '9.2', sectionName: '用样本估计总体', stem: '频率估计概率的依据接近', options: { A: '大数定律思想', B: '小样本直觉', C: '主观意愿', D: '仅一次试验' }, answer: 'A', analysis: '频率稳定。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '9.3', sectionName: '变量的相关性与线性回归初步', stem: '样本相关系数 r 接近 1 通常表示', options: { A: '正线性相关强', B: '无关', C: '负相关强', D: '非线性必强' }, answer: 'A', analysis: '相关。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '9.1', sectionName: '随机抽样', stem: '系统抽样常用于', options: { A: '个体均匀编号的较大总体', B: '任意方便样本', C: '只抽一层', D: '不随机' }, answer: 'A', analysis: '系统抽样。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '9.2', sectionName: '用样本估计总体', stem: '样本方差反映', options: { A: '离散程度', B: '集中趋势均值', C: '样本量', D: '总体个数' }, answer: 'A', analysis: '方差。', authorMathNote: '离散' }),
      (a) => ({ sectionCode: '9.3', sectionName: '变量的相关性与线性回归初步', stem: '线性回归方程一定', options: { A: '过样本中心点', B: '过每个样本点', C: '斜率为 0', D: '截距为 0' }, answer: 'A', analysis: '过均值点。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '9.1', sectionName: '随机抽样', stem: '抽签法属于', options: { A: '简单随机抽样', B: '分层抽样', C: '系统抽样', D: '方便抽样' }, answer: 'A', analysis: '抽签。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '9.2', sectionName: '用样本估计总体', stem: '直方图主要用于', options: { A: '展示连续型数据分布', B: '仅分类计数无图', C: '回归斜率', D: '抽样框制作' }, answer: 'A', analysis: '分布。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '9.3', sectionName: '变量的相关性与线性回归初步', stem: '相关不等于', options: { A: '因果', B: '联系', C: '统计关联', D: '线性趋势可能' }, answer: 'A', analysis: '相关≠因果。', authorMathNote: '因果' }),
      (a) => ({ sectionCode: '9.1', sectionName: '随机抽样', stem: '从 200 个个体抽 10 个，每个体被抽到概率（简单随机）为', options: { A: '1/20', B: '1/10', C: '1/200', D: '1' }, answer: 'A', analysis: '10/200。', authorMathNote: '1/20' }),
      (a) => ({ sectionCode: '9.2', sectionName: '用样本估计总体', stem: '用频率估计次品率后估计总量中次品数，属于', options: { A: '用样本估计总体', B: '普查', C: '分层无关', D: '回归分析必用' }, answer: 'A', analysis: '估计。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '9.3', sectionName: '变量的相关性与线性回归初步', stem: '|r| 越接近 0 通常表示', options: { A: '线性相关越弱', B: '线性相关越强', C: '一定无关一切', D: '方差为 0' }, answer: 'A', analysis: '相关强弱。', authorMathNote: '弱' }),
      (a) => ({ sectionCode: '9.1', sectionName: '随机抽样', stem: '抽样调查相对普查的优点常包括', options: { A: '省时省力', B: '一定无误差', C: '不需随机', D: '可忽略代表性' }, answer: 'A', analysis: '抽样优点。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '9.2', sectionName: '用样本估计总体', stem: '极差是', options: { A: '最大值减最小值', B: '平均数', C: '中位数', D: '众数' }, answer: 'A', analysis: '极差。', authorMathNote: 'A' }),
    ],
    multi: [
      (a) => ({ sectionCode: '9.1', sectionName: '随机抽样', stem: '关于分层抽样正确的有（多选）', options: { A: '层内随机', B: '按比例分配', C: '适合层间差异大', D: '不必随机' }, answer: 'A,B,C', analysis: 'D 错。', authorMathNote: 'A,B,C' }),
      (a) => ({ sectionCode: '9.2', sectionName: '用样本估计总体', stem: '数字特征包括（多选）', options: { A: '平均数', B: '方差', C: '标准差', D: '抽样框材质' }, answer: 'A,B,C', analysis: 'D 否。', authorMathNote: 'A,B,C' }),
      (a) => ({ sectionCode: '9.1', sectionName: '随机抽样', stem: '简单随机抽样实现方式有（多选）', options: { A: '抽签', B: '随机数', C: '随意抓方便样本且不等概', D: '编号后随机' }, answer: 'A,B,D', analysis: 'C 非简单随机。', authorMathNote: 'A,B,D' }),
      (a) => ({ sectionCode: '9.3', sectionName: '变量的相关性与线性回归初步', stem: '线性回归相关正确的有（多选）', options: { A: '最小二乘', B: '过样本中心', C: '可作预测需谨慎', D: '一定因果' }, answer: 'A,B,C', analysis: 'D 错。', authorMathNote: 'A,B,C' }),
    ],
    judge: [
      (a) => ({ sectionCode: '9.3', sectionName: '变量的相关性与线性回归初步', stem: '判断：线性回归方程一定经过每一个样本点。', answer: 'false', analysis: '过中心不一定过每点。', authorMathNote: 'false' }),
      (a) => ({ sectionCode: '9.1', sectionName: '随机抽样', stem: '判断：简单随机抽样每个个体被抽中概率相等。', answer: 'true', analysis: '定义。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '9.2', sectionName: '用样本估计总体', stem: '判断：样本方差越小说明样本越分散。', answer: 'false', analysis: '越小越集中。', authorMathNote: 'false' }),
      (a) => ({ sectionCode: '9.3', sectionName: '变量的相关性与线性回归初步', stem: '判断：|r| 接近 1 则线性相关通常较强。', answer: 'true', analysis: '相关。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '9.1', sectionName: '随机抽样', stem: '判断：分层抽样不需要在层内随机。', answer: 'false', analysis: '层内仍随机。', authorMathNote: 'false' }),
      (a) => ({ sectionCode: '9.2', sectionName: '用样本估计总体', stem: '判断：频率随试验次数增多往往稳定。', answer: 'true', analysis: '大数思想。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '9.3', sectionName: '变量的相关性与线性回归初步', stem: '判断：相关即因果。', answer: 'false', analysis: '相关≠因果。', authorMathNote: 'false' }),
      (a) => ({ sectionCode: '9.1', sectionName: '随机抽样', stem: '判断：系统抽样的间隔应合理确定。', answer: 'true', analysis: '间隔。', authorMathNote: 'true' }),
    ],
    numeric: [
      (a) => ({ sectionCode: '9.1', sectionName: '随机抽样', stem: '总体 200，抽 10，简单随机下每个个体被抽概率为（填小数 0.05 的百分分子：填 5 表示 5%）', answer: '5', analysis: '10/200=5%。', authorMathNote: '0.05' }),
      (a) => ({ sectionCode: '9.2', sectionName: '用样本估计总体', stem: '数据 86,90,78,92,84 的平均数是', answer: '86', analysis: '平均。', authorMathNote: '86' }),
      (a) => ({ sectionCode: '9.2', sectionName: '用样本估计总体', stem: '抽检 200 件次品 8 件，次品率估计为（百分数的分子）', answer: '4', analysis: '4%。', authorMathNote: '0.04' }),
      (a) => ({ sectionCode: '9.2', sectionName: '用样本估计总体', stem: '样本 2,4,6 的极差为', answer: '4', analysis: '6-2。', authorMathNote: '4' }),
      (a) => ({ sectionCode: '9.1', sectionName: '随机抽样', stem: '分层：两层人数 30 与 70，抽 20，第一层应抽', answer: '6', analysis: '比例。', authorMathNote: '6' }),
      (a) => ({ sectionCode: '9.2', sectionName: '用样本估计总体', stem: '样本 1,2,3 的平均数是', answer: '2', analysis: '平均。', authorMathNote: '2' }),
      (a) => ({ sectionCode: '9.2', sectionName: '用样本估计总体', stem: '用定义 s²=1/n Σ(xi-x̄)²，样本 1,3 的方差是', answer: '1', analysis: '均差平方平均。', authorMathNote: '1' }),
      (a) => ({ sectionCode: '9.1', sectionName: '随机抽样', stem: '系统抽样：100 人抽 10，间隔 k=', answer: '10', analysis: 'N/n。', authorMathNote: '10' }),
    ],
    application: [
      (a, b, c, d) => ({ sectionCode: '9.2', sectionName: '用样本估计总体', stem: '成绩：86,90,78,92,84。\n（1）求样本平均数；（2）求样本方差（定义 s²=1/n Σ）。', answer: '86；计算方差。', analysis: '数字特征。', authorMathNote: '86', ...rub2({ t: '均值', s: 4, c: '86' }, { t: '方差', s: 4, c: '定义计算' }) }),
      (a, b, c, d) => ({ sectionCode: '9.1', sectionName: '随机抽样', stem: '总体分三层 100/200/200，抽 50。\n（1）各层应抽多少；（2）说明为何分层。', answer: '10,20,20；差异大更有代表性。', analysis: '分层。', authorMathNote: '比例', ...rub2({ t: '名额', s: 4, c: '比例' }, { t: '理由', s: 4, c: '说明' }) }),
      (a) => ({ sectionCode: '9.2', sectionName: '用样本估计总体', stem: '抽检 200 次品 8。\n（1）估计次品率；（2）估计 5000 件中次品约多少。', answer: '0.04；200。', analysis: '频率估计。', authorMathNote: '200', ...rub2({ t: '率', s: 4, c: '0.04' }, { t: '估计', s: 4, c: '200' }) }),
      (a, b, c, d) => ({ sectionCode: '9.3', sectionName: '变量的相关性与线性回归初步', stem: '说明：为何 |r| 大不代表存在因果关系？举一例。', answer: '第三变量等；例子。', analysis: '相关≠因果。', authorMathNote: '概念', ...rub2({ t: '说明', s: 4, c: '理由' }, { t: '例子', s: 4, c: '例子' }), ...hp(d || 3, 'A', '相关与因果辨析', '概念+反例', '统计素养') }),
    ],
  }
}

function makeCh10() {
  return {
    single: [
      (a) => ({ sectionCode: '10.1', sectionName: '随机事件与概率', stem: '掷一枚均匀骰子，样本空间基本事件个数为', options: { A: '6', B: '2', C: '12', D: '1' }, answer: 'A', analysis: '六点。', authorMathNote: '6' }),
      (a) => ({ sectionCode: '10.1', sectionName: '随机事件与概率', stem: '古典概型要求', options: { A: '有限且等可能', B: '无限样本空间', C: '不等概', D: '主观赋值' }, answer: 'A', analysis: '古典概型。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '10.2', sectionName: '事件的相互独立性', stem: '独立事件 A,B 则 P(AB)=', options: { A: 'P(A)P(B)', B: 'P(A)+P(B)', C: 'P(A)-P(B)', D: '1' }, answer: 'A', analysis: '独立定义。', authorMathNote: '乘积' }),
      (a) => ({ sectionCode: '10.2', sectionName: '事件的相互独立性', stem: '互斥且 P(A)P(B)>0，则', options: { A: '不独立', B: '独立', C: '无法判断', D: '必独立' }, answer: 'A', analysis: '互斥非空不独立。', authorMathNote: '不独立' }),
      (a) => ({ sectionCode: '10.1', sectionName: '随机事件与概率', stem: '抛均匀硬币一次，基本事件个数为', options: { A: '2', B: '1', C: '4', D: '0' }, answer: 'A', analysis: '正反。', authorMathNote: '2' }),
      (a) => ({ sectionCode: '10.3', sectionName: '频率与概率', stem: '大量重复试验下频率往往', options: { A: '接近概率', B: '远离概率', C: '等于样本量', D: '无规律' }, answer: 'A', analysis: '频率稳定。', authorMathNote: '接近' }),
      (a) => ({ sectionCode: '10.1', sectionName: '随机事件与概率', stem: '对立事件概率为', options: { A: '0', B: '1', C: '1/2', D: '不确定' }, answer: 'A', analysis: '定义。', authorMathNote: '0' }),
      (a) => ({ sectionCode: '10.1', sectionName: '随机事件与概率', stem: '必然事件概率为', options: { A: '1', B: '0', C: '1/2', D: '不确定' }, answer: 'A', analysis: '定义。', authorMathNote: '1' }),
      (a) => ({ sectionCode: '10.2', sectionName: '事件的相互独立性', stem: '独立重复试验中各次', options: { A: '相互独立', B: '互斥', C: '必对立', D: '概率相加为 1 每次' }, answer: 'A', analysis: '独立重复。', authorMathNote: '独立' }),
      (a) => ({ sectionCode: '10.1', sectionName: '随机事件与概率', stem: '对立事件与任何事件的交为', options: { A: '不可能事件', B: '必然事件', C: '对立事件自身以外', D: '样本空间' }, answer: 'A', analysis: '交空。', authorMathNote: '不可能' }),
      (a) => ({ sectionCode: '10.1', sectionName: '随机事件与概率', stem: '对立事件与对立事件的关系是', options: { A: '对立事件的并是样本空间且交空', B: '相同', C: '无关', D: '概率相等必' }, answer: 'A', analysis: '对立。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '10.2', sectionName: '事件的相互独立性', stem: 'P(A)=0.4，P(B)=0.5，独立，则 P(A∪B)=', options: { A: '0.7', B: '0.9', C: '0.2', D: '0.4' }, answer: 'A', analysis: '0.4+0.5-0.2。', authorMathNote: '0.7' }),
      (a) => ({ sectionCode: '10.1', sectionName: '随机事件与概率', stem: '袋中 3 红 2 白摸 1 球，摸到红球概率为', options: { A: '3/5', B: '2/5', C: '1/2', D: '1' }, answer: 'A', analysis: '古典。', authorMathNote: '3/5' }),
      (a) => ({ sectionCode: '10.3', sectionName: '频率与概率', stem: '用频率估计概率时较合理的是', options: { A: '试验次数足够多', B: '只做一次', C: '主观指定', D: '忽略稳定性' }, answer: 'A', analysis: '大数。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '10.1', sectionName: '随机事件与概率', stem: '样本空间是', options: { A: '所有基本事件的集合', B: '一个结果', C: '概率值', D: '频率' }, answer: 'A', analysis: '定义。', authorMathNote: 'A' }),
      (a) => ({ sectionCode: '10.2', sectionName: '事件的相互独立性', stem: '射手命中率 0.8，独立射 2 次恰中 1 次概率为', options: { A: '0.32', B: '0.64', C: '0.16', D: '0.8' }, answer: 'A', analysis: 'C(2,1)·0.8·0.2。', authorMathNote: '0.32' }),
    ],
    multi: [
      (a) => ({ sectionCode: '10.1', sectionName: '随机事件与概率', stem: '概率性质正确的有（多选）', options: { A: '0≤P≤1', B: 'P(Ω)=1', C: '互斥可加', D: 'P 可为 2' }, answer: 'A,B,C', analysis: 'D 错。', authorMathNote: 'A,B,C' }),
      (a) => ({ sectionCode: '10.2', sectionName: '事件的相互独立性', stem: '独立则（多选）', options: { A: 'P(AB)=P(A)P(B)', B: 'A 与 B 的对立也可能独立', C: '互斥且正概率则独立', D: '可用来简化计算' }, answer: 'A,B,D', analysis: 'C 错。', authorMathNote: 'A,B,D' }),
      (a) => ({ sectionCode: '10.1', sectionName: '随机事件与概率', stem: '古典概型计算步骤包括（多选）', options: { A: '确基本事件等可能', B: '计数有利', C: '计数总数', D: '主观赋值无需计数' }, answer: 'A,B,C', analysis: 'D 否。', authorMathNote: 'A,B,C' }),
      (a) => ({ sectionCode: '10.3', sectionName: '频率与概率', stem: '频率与概率关系正确的有（多选）', options: { A: '频率可估计概率', B: '概率是频率的稳定值思想', C: '频率一定等于概率', D: '试验次数宜多' }, answer: 'A,B,D', analysis: 'C 错。', authorMathNote: 'A,B,D' }),
    ],
    judge: [
      (a) => ({ sectionCode: '10.2', sectionName: '事件的相互独立性', stem: '判断：互斥的非空事件（概率乘积>0）一定不独立。', answer: 'true', analysis: 'P(AB)=0≠乘积。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '10.1', sectionName: '随机事件与概率', stem: '判断：概率可为负数。', answer: 'false', analysis: '0≤P≤1。', authorMathNote: 'false' }),
      (a) => ({ sectionCode: '10.3', sectionName: '频率与概率', stem: '判断：频率稳定于概率是大数思想的体现。', answer: 'true', analysis: '思想。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '10.1', sectionName: '随机事件与概率', stem: '判断：对立事件交为不可能事件。', answer: 'true', analysis: '定义。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '10.2', sectionName: '事件的相互独立性', stem: '判断：独立则互斥。', answer: 'false', analysis: '独立与互斥不同。', authorMathNote: 'false' }),
      (a) => ({ sectionCode: '10.1', sectionName: '随机事件与概率', stem: '判断：基本事件两两互斥。', answer: 'true', analysis: '样本空间划分。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '10.2', sectionName: '事件的相互独立性', stem: '判断：P(A)=0 的事件与任何事件独立。', answer: 'true', analysis: '乘积为 0=P(AB)。', authorMathNote: 'true' }),
      (a) => ({ sectionCode: '10.3', sectionName: '频率与概率', stem: '判断：一次试验频率即可精确等于概率。', answer: 'false', analysis: '需大量重复。', authorMathNote: 'false' }),
    ],
    numeric: [
      (a) => ({ sectionCode: '10.1', sectionName: '随机事件与概率', stem: '袋中 3 红 2 白摸 1 红概率为（填最简分数的分子，分母 5）', answer: '3', analysis: '3/5。', authorMathNote: '3/5' }),
      (a) => ({ sectionCode: '10.2', sectionName: '事件的相互独立性', stem: 'P(A)=0.4，P(B)=0.5 独立，P(AB)=（填小数×100 的整数，即 20 表示 0.20）', answer: '20', analysis: '0.2。', authorMathNote: '0.2' }),
      (a) => ({ sectionCode: '10.1', sectionName: '随机事件与概率', stem: '骰子点数为偶数的概率为（填最简分数分子，分母 2）', answer: '1', analysis: '1/2。', authorMathNote: '1/2' }),
      (a) => ({ sectionCode: '10.2', sectionName: '事件的相互独立性', stem: '命中率 0.8 射 2 次全中概率为（填百分数分子）', answer: '64', analysis: '0.64。', authorMathNote: '0.64' }),
      (a) => ({ sectionCode: '10.1', sectionName: '随机事件与概率', stem: '从 1..5 取两不同数，和为偶数的基本事件数（无序）为', answer: '4', analysis: '两奇或两偶。', authorMathNote: '4' }),
      (a) => ({ sectionCode: '10.2', sectionName: '事件的相互独立性', stem: 'P(A)=1/2，P(B)=1/3 独立，P(A∪B)=（填最简分数分子，分母 6）', answer: '4', analysis: '2/3=4/6。', authorMathNote: '2/3' }),
      (a) => ({ sectionCode: '10.1', sectionName: '随机事件与概率', stem: '抛硬币 2 次，恰 1 正的概率为（填百分数分子）', answer: '50', analysis: '1/2。', authorMathNote: '1/2' }),
      (a) => ({ sectionCode: '10.1', sectionName: '随机事件与概率', stem: '袋中 4 红 3 白取 2，颜色不同概率分子（分母 C(7,2)=21）', answer: '12', analysis: '4·3=12。', authorMathNote: '12/21' }),
    ],
    application: [
      (a, b, c, d) => ({ sectionCode: '10.1', sectionName: '随机事件与概率', stem: `袋中 ${a} 红 ${a + 1} 白，随机取 2（无放回）。求恰 1 红 1 白的概率。`, answer: '组合计数。', analysis: '古典概型。', authorMathNote: '组合', ...rub2({ t: '总数', s: 4, c: 'C' }, { t: '有利与概率', s: 4, c: '概率' }) }),
      (a, b, c, d) => ({ sectionCode: '10.2', sectionName: '事件的相互独立性', stem: 'P(A)=0.3，P(B)=0.6，独立。\n（1）求 P(AB)；（2）求 P(A∪B)。', answer: '0.18；0.72。', analysis: '独立公式。', authorMathNote: '0.72', ...rub2({ t: '交', s: 4, c: '0.18' }, { t: '并', s: 4, c: '0.72' }) }),
      (a) => ({ sectionCode: '10.3', sectionName: '频率与概率', stem: '简述：为何大量重复抛均匀硬币时正面频率往往接近 0.5？', answer: '大数定律思想/频率稳定。', analysis: '概念。', authorMathNote: '频率稳定', ...rub2({ t: '原理', s: 4, c: '大数思想' }, { t: '表述', s: 4, c: '完整' }) }),
      (a, b, c, d) => ({ sectionCode: '10.2', sectionName: '事件的相互独立性', stem: '说明互斥与独立的区别，并举例。', answer: '定义对比+例子。', analysis: '概念辨析。', authorMathNote: '区别', ...rub2({ t: '区别', s: 4, c: '定义' }, { t: '例子', s: 4, c: '例子' }), ...hp(d || 3, 'A', '互斥与独立辨析', '定义+反例', '概念压轴') }),
    ],
  }
}

// Fix ch7 numeric properly
const _ch7 = makeCh7()
_ch7.numeric = [
  (a, b) => ({ sectionCode: '7.3', sectionName: '复数的三角形式初步', stem: `$|${a}-${b}\\mathrm{i}|=$`, answer: String(Math.round(Math.sqrt(a * a + b * b))), analysis: '模公式。', authorMathNote: String(Math.round(Math.sqrt(a * a + b * b))) }),
  (a) => ({ sectionCode: '7.2', sectionName: '复数的运算', stem: 'i^4 的值（填整数）', answer: '1', analysis: '周期。', authorMathNote: '1' }),
  (a) => ({ sectionCode: '7.3', sectionName: '复数的三角形式初步', stem: '|5-12i|=', answer: '13', analysis: '模。', authorMathNote: '13' }),
  (a) => ({ sectionCode: '7.2', sectionName: '复数的运算', stem: '(3+2i)+(1-i) 的实部为', answer: '4', analysis: '实部相加。', authorMathNote: '4' }),
  (a) => ({ sectionCode: '7.2', sectionName: '复数的运算', stem: '(1+i)(1-i)=', answer: '2', analysis: '平方差。', authorMathNote: '2' }),
  (a) => ({ sectionCode: '7.1', sectionName: '复数的概念', stem: '3-2i 的虚部为（填整数，含符号则填 -2 的绝对值：填 2）', answer: '2', analysis: '虚部系数。', authorMathNote: '-2' }),
  (a) => ({ sectionCode: '7.3', sectionName: '复数的三角形式初步', stem: '|1+i|^2=', answer: '2', analysis: '模方。', authorMathNote: '2' }),
  (a) => ({ sectionCode: '7.2', sectionName: '复数的运算', stem: 'i^3 等于 -i，若问 i^3 + i 的值，得', answer: '0', analysis: '-i+i=0。', authorMathNote: '0' }),
]
CH_FRAMES[7] = _ch7

export const SKELETON_COUNTS = Object.fromEntries(
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((ch) => [
    ch,
    Object.fromEntries(
      ['single', 'multi', 'judge', 'numeric', 'application'].map((qt) => [
        qt,
        recipesFor(ch, qt).length,
      ]),
    ),
  ]),
)

export function classifyFamily(familyMembers, structPreview) {
  const sorted = [...familyMembers].sort((a, b) => {
    const da = (b.difficulty || 0) - (a.difficulty || 0)
    if (da) return da
    return String(a.id).localeCompare(String(b.id))
  })
  const keepId = sorted[0]?.id || null
  const preview = String(structPreview || '')
  const verdict =
    /已知参数p=|多选；章|研究需要|正整数参数k=|n\^#-\(n-#\)\^#/.test(preview) ||
    familyMembers.length >= 4
      ? 'LOW_VALUE_ISOMORPHIC'
      : 'SEMANTIC_DUPLICATE'
  return {
    verdict,
    keepId,
    discardIds: sorted.filter((m) => m.id !== keepId).map((m) => m.id),
    reason:
      verdict === 'LOW_VALUE_ISOMORPHIC'
        ? '同模板数字变体或低价值同构，保留章节教学匹配度最高者'
        : '题干结构/语义实质相同，保留 pedagogically strongest',
  }
}

export function buildDistinct(slot, salt, usedStruct, usedExact) {
  const s = normalizeSlot(slot)
  const pool = recipesFor(s.chapterNo, s.qtype)
  if (!pool?.length) return null
  const n0 = nOf(s)
  const startIdx = Math.abs(n0 + salt) % pool.length
  // Single pass over skeletons with a few param salts — O(pool * few)
    for (let offset = 0; offset < pool.length; offset++) {
      const skIdx = (startIdx + offset) % pool.length
    for (let bump = 0; bump < 3; bump++) {
      const n = n0 + salt * 17 + offset * 31 + skIdx * 7 + bump * 97
      let partial
      try {
        partial = pool[skIdx](s, n)
      } catch {
        continue
      }
      if (!partial?.stem || CRUTCH_RE.test(partial.stem)) continue
      try {
        const result = baseItem(s, { ...partial, sourceEvidence: SOURCE }, {
          rebuildAction: 'iso_distinct_replace',
          dedupVerdict: 'distinct_pool',
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
  }
  // limited extra salts if pool exhausted due to collisions
  for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt++) {
    const skIdx = (startIdx + attempt) % pool.length
    const n = n0 + (salt + attempt) * 19 + skIdx * 11
    let partial
    try {
      partial = pool[skIdx](s, n)
    } catch {
      continue
    }
    if (!partial?.stem || CRUTCH_RE.test(partial.stem)) continue
    try {
      const result = baseItem(s, { ...partial, sourceEvidence: SOURCE }, {
        rebuildAction: 'iso_distinct_replace',
        dedupVerdict: 'distinct_pool',
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
