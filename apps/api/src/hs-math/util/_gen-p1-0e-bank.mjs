/**
 * One-off generator for hs-math-p1-0e-bank-items.ts — run: node _gen-p1-0e-bank.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, 'hs-math-p1-0e-bank-items.ts')

const VALID_KP = new Set([
  'rja.1.1.01', 'rja.1.1.02', 'rja.1.1.03',
  'rja.1.2.01', 'rja.1.2.02',
  'rja.1.3.01', 'rja.1.3.02', 'rja.1.3.03', 'rja.1.3.04',
  'rja.1.4.01', 'rja.1.4.02', 'rja.1.4.03',
  'rja.1.5.01', 'rja.1.5.02', 'rja.1.5.03',
])

const opts = (pairs) => ({
  options: pairs.map(([id, text]) => ({ id, text })),
})

/** @type {import('./hs-math-p1-0e-bank-items.ts').BankItem[]} */
const raw = [
  // === 1.1 0001-0016 ===
  {
    code: 'HSMA-RJA-CH01-0001', specialtyCode: 'rja-ch1', categoryCode: '1.1', qtype: 'single', difficulty: 1,
    stem: '设 $A=\\{2,4,6\\}$，下列各式正确的是',
    options: opts([['A', '$4\\in A$'], ['B', '$5\\in A$'], ['C', '$\\{4\\}\\in A$'], ['D', '$\\{2,4\\}\\subseteq A$ 且 $\\{2,4\\}\\in A$']]),
    answerPayload: { kind: 'single', optionId: 'A' },
    analysis: '元素 $4$ 在集合 $A$ 中，故 $4\\in A$ 成立。$5$ 不在 $A$ 中；$\\{4\\}$ 是集合而非 $A$ 的元素；子集关系用 $\\subseteq$，不能把子集当作元素。',
    knowledgePointCodes: ['rja.1.1.01'], primaryKnowledgePointCode: 'rja.1.1.01',
  },
  {
    code: 'HSMA-RJA-CH01-0002', specialtyCode: 'rja-ch1', categoryCode: '1.1', qtype: 'single', difficulty: 1,
    stem: '由方程 $x^2-5x+6=0$ 的所有实数根组成的集合，用列举法可写为',
    options: opts([['A', '$\\{2,3\\}$'], ['B', '$\\{(-5),6\\}$'], ['C', '$\\{x\\mid x=2\\ \\text{或}\\ x=3\\}$'], ['D', '$\\{2\\}\\cup\\{3\\}$ 的并集与 $\\{2,3\\}$ 不同']]),
    answerPayload: { kind: 'single', optionId: 'A' },
    analysis: '因式分解得 $(x-2)(x-3)=0$，实数根为 $2$ 与 $3$，互异，列举法写作 $\\{2,3\\}$。选项 C 为描述法，亦正确但题干要求列举法写法，A 最直接。',
    knowledgePointCodes: ['rja.1.1.01', 'rja.1.1.02'], primaryKnowledgePointCode: 'rja.1.1.01',
  },
  {
    code: 'HSMA-RJA-CH01-0003', specialtyCode: 'rja-ch1', categoryCode: '1.1', qtype: 'single', difficulty: 1,
    stem: '集合 $B=\\{x\\in\\mathbb{Z}\\mid -2<x\\le 1\\}$ 用列举法表示为',
    options: opts([['A', '$\\{-1,0,1\\}$'], ['B', '$\\{-2,-1,0,1\\}$'], ['C', '$\\{-1,0\\}$'], ['D', '$\\{0,1\\}$']]),
    answerPayload: { kind: 'single', optionId: 'A' },
    analysis: '整数 $x$ 满足 $-2<x\\le 1$，即 $x=-1,0,1$，故 $B=\\{-1,0,1\\}$。注意 $-2$ 不满足严格不等式 $-2<x$。',
    knowledgePointCodes: ['rja.1.1.02'], primaryKnowledgePointCode: 'rja.1.1.02',
  },
  {
    code: 'HSMA-RJA-CH01-0004', specialtyCode: 'rja-ch1', categoryCode: '1.1', qtype: 'single', difficulty: 2,
    stem: '下列集合中，两个集合相等的是',
    options: opts([['A', '$\\{1,2\\}$ 与 $\\{2,1\\}$'], ['B', '$\\{1\\}$ 与 $\\{\\{1\\}\\}$'], ['C', '$\\{x\\mid x^2=1\\}$ 与 $\\{1\\}$'], ['D', '$\\{0\\}$ 与 $\\varnothing$']]),
    answerPayload: { kind: 'single', optionId: 'A' },
    analysis: '集合元素互异且无序，$\\{1,2\\}$ 与 $\\{2,1\\}$ 表示同一集合。B 中 $\\{\\{1\\}\\}$ 含一个元素（集合 $\\{1\\}$）；C 漏 $-1$；D 空集无元素。',
    knowledgePointCodes: ['rja.1.1.02', 'rja.1.1.01'], primaryKnowledgePointCode: 'rja.1.1.02',
  },
  {
    code: 'HSMA-RJA-CH01-0005', specialtyCode: 'rja-ch1', categoryCode: '1.1', qtype: 'single', difficulty: 1,
    stem: '关于空集 $\\varnothing$，下列说法正确的是',
    options: opts([['A', '$\\varnothing\\subseteq\\{0\\}$'], ['B', '$0\\in\\varnothing$'], ['C', '$\\varnothing=\\{0\\}$'], ['D', '$\\varnothing\\in\\varnothing$']]),
    answerPayload: { kind: 'single', optionId: 'A' },
    analysis: '空集是任何集合的子集，故 $\\varnothing\\subseteq\\{0\\}$。空集不含任何元素，故 $0\\notin\\varnothing$；$\\varnothing$ 与 $\\{0\\}$ 不等；空集不能作为自身的元素。',
    knowledgePointCodes: ['rja.1.1.03'], primaryKnowledgePointCode: 'rja.1.1.03',
  },
  {
    code: 'HSMA-RJA-CH01-0006', specialtyCode: 'rja-ch1', categoryCode: '1.1', qtype: 'single', difficulty: 2,
    stem: '设全集 $U=\\{1,2,3,4,5\\}$，$A=\\{1,3\\}$，则 $4$ 与 $A$ 的关系是',
    options: opts([['A', '$4\\notin A$'], ['B', '$4\\in A$'], ['C', '$\\{4\\}\\subseteq A$'], ['D', '$A\\subseteq\\{4\\}$']]),
    answerPayload: { kind: 'single', optionId: 'A' },
    analysis: '$A$ 中元素仅为 $1$ 与 $3$，故 $4\\notin A$。$\\{4\\}$ 不是 $A$ 的子集；$A$ 也不含于 $\\{4\\}$。本题在明确 $U$ 的前提下讨论属于关系。',
    knowledgePointCodes: ['rja.1.1.01', 'rja.1.1.03'], primaryKnowledgePointCode: 'rja.1.1.01',
  },
  {
    code: 'HSMA-RJA-CH01-0007', specialtyCode: 'rja-ch1', categoryCode: '1.1', qtype: 'single', difficulty: 2,
    stem: '若 $M=\\{x\\mid x=2k,\\ k\\in\\mathbb{Z}\\}$ 表示偶数集，则下列元素属于 $M$ 的是',
    options: opts([['A', '$-6$'], ['B', '$3$'], ['C', '$\\frac{1}{2}$'], ['D', '$\\sqrt{4}$ 的算术平方根 $2$ 以外再含 $1$']]),
    answerPayload: { kind: 'single', optionId: 'A' },
    analysis: '$-6=2\\times(-3)$，$k=-3\\in\\mathbb{Z}$，故 $-6\\in M$。$3$ 为奇数；$\\frac{1}{2}$ 不是整数倍 $2$；D 为干扰表述。',
    knowledgePointCodes: ['rja.1.1.02', 'rja.1.1.01'], primaryKnowledgePointCode: 'rja.1.1.03',
  },
  {
    code: 'HSMA-RJA-CH01-0008', specialtyCode: 'rja-ch1', categoryCode: '1.1', qtype: 'single', difficulty: 3,
    stem: '已知 $P=\\{1,2\\}$，$Q=\\{\\{1\\},2\\}$，则下列判断正确的是',
    options: opts([['A', '$1\\in P$ 且 $\\{1\\}\\notin P$'], ['B', '$1\\in Q$ 且 $\\{1\\}\\in Q$'], ['C', '$P=Q$'], ['D', '$\\{1\\}\\subseteq Q$ 且 $\\{1\\}\\in Q$']]),
    answerPayload: { kind: 'single', optionId: 'A' },
    analysis: '$P$ 的元素是数 $1,2$，故 $1\\in P$，而集合 $\\{1\\}$ 不是 $P$ 的元素。$Q$ 的元素是集合 $\\{1\\}$ 与数 $2$，故 $1\\notin Q$ 但 $\\{1\\}\\in Q$，B 错；$P\\ne Q$。',
    knowledgePointCodes: ['rja.1.1.01', 'rja.1.1.02'], primaryKnowledgePointCode: 'rja.1.1.02',
  },
  {
    code: 'HSMA-RJA-CH01-0009', specialtyCode: 'rja-ch1', categoryCode: '1.1', qtype: 'multi', difficulty: 2,
    stem: '下列可作为集合元素的是（多选）',
    options: opts([['A', '整数 $0$'], ['B', '集合 $\\{1,2\\}$'], ['C', '字母 $a$'], ['D', '直线 $y=x$ 作为集合本身再嵌套一次']]),
    answerPayload: { kind: 'multi', optionIds: ['A', 'B', 'C'] },
    analysis: '集合的元素可以是数、字母、其他集合等确定对象。A、B、C 均为确定对象；D 表述含混且非标准元素写法，不宜选。',
    knowledgePointCodes: ['rja.1.1.01', 'rja.1.1.02'], primaryKnowledgePointCode: 'rja.1.1.02',
  },
  {
    code: 'HSMA-RJA-CH01-0010', specialtyCode: 'rja-ch1', categoryCode: '1.1', qtype: 'multi', difficulty: 2,
    stem: '下列关于集合表示的说法正确的有（多选）',
    options: opts([['A', '列举法适用于元素个数有限且可一一列出的集合'], ['B', '描述法 $\\{x\\mid p(x)\\}$ 中 $x$ 为集合的代表元素'], ['C', '同一集合的两种表示法描述的对象必须相同'], ['D', '集合 $\\{1,1,2\\}$ 与 $\\{1,2\\}$ 是不同集合']]),
    answerPayload: { kind: 'multi', optionIds: ['A', 'B', 'C'] },
    analysis: '列举法、描述法均为基本表示；代表元素与条件 $p(x)$ 共同确定集合；互异原则使 $\\{1,1,2\\}$ 即 $\\{1,2\\}$，故 D 错。',
    knowledgePointCodes: ['rja.1.1.02', 'rja.1.1.01'], primaryKnowledgePointCode: 'rja.1.1.01',
  },
  {
    code: 'HSMA-RJA-CH01-0011', specialtyCode: 'rja-ch1', categoryCode: '1.1', qtype: 'multi', difficulty: 3,
    stem: '设全集 $U=\\{1,2,3\\}$，下列命题正确的有（多选）',
    options: opts([['A', '$\\varnothing\\subseteq U$'], ['B', '$U\\subseteq U$'], ['C', '$\\varnothing\\in U$'], ['D', '若 $A\\subseteq U$，则 $A$ 中每个元素都属于 $U$']]),
    answerPayload: { kind: 'multi', optionIds: ['A', 'B', 'D'] },
    analysis: '空集是任何集合的子集；任何集合是其自身子集；$\\varnothing$ 不是 $U$ 的元素（除非把空集当作元素，此处 $U$ 元素为 $1,2,3$）；子集定义保证 D 正确。',
    knowledgePointCodes: ['rja.1.1.03', 'rja.1.2.01'], primaryKnowledgePointCode: 'rja.1.1.03',
  },
  {
    code: 'HSMA-RJA-CH01-0012', specialtyCode: 'rja-ch1', categoryCode: '1.1', qtype: 'judge', difficulty: 1,
    stem: '集合中的元素必须是确定的、互异的，且不考虑排列顺序。',
    answerPayload: { kind: 'judge', value: true },
    analysis: '集合三性：确定性、互异性、无序性，是集合含义的基本规定，故命题正确。',
    knowledgePointCodes: ['rja.1.1.01'], primaryKnowledgePointCode: 'rja.1.1.03',
  },
  {
    code: 'HSMA-RJA-CH01-0013', specialtyCode: 'rja-ch1', categoryCode: '1.1', qtype: 'judge', difficulty: 1,
    stem: '若 $a\\in A$ 且 $A\\subseteq B$，则 $a\\in B$。',
    answerPayload: { kind: 'judge', value: true },
    analysis: '$A\\subseteq B$ 指 $A$ 中任意元素都在 $B$ 中，故 $a\\in A$ 时必有 $a\\in B$，命题正确。',
    knowledgePointCodes: ['rja.1.1.01', 'rja.1.2.01'], primaryKnowledgePointCode: 'rja.1.1.01',
  },
  {
    code: 'HSMA-RJA-CH01-0014', specialtyCode: 'rja-ch1', categoryCode: '1.1', qtype: 'judge', difficulty: 2,
    stem: '对于任意集合 $A$，都有 $\\varnothing\\subseteq A$ 且 $\\varnothing\\in A$。',
    answerPayload: { kind: 'judge', value: false },
    analysis: '空集一定是 $A$ 的子集，但只有当 $\\varnothing$ 本身是 $A$ 的元素时才属于 $A$，一般集合（如 $\\{1,2\\}$）不以空集为元素，故后半句不总成立。',
    knowledgePointCodes: ['rja.1.1.03'], primaryKnowledgePointCode: 'rja.1.1.03',
  },
  {
    code: 'HSMA-RJA-CH01-0015', specialtyCode: 'rja-ch1', categoryCode: '1.1', qtype: 'numeric', difficulty: 1,
    stem: '集合 $\\{3,5,7,9,11\\}$ 的元素个数为',
    answerPayload: { kind: 'numeric', value: '5', toleranceAbs: 0, toleranceRel: 0 },
    analysis: '五个互异正整数，逐一计数得元素个数为 $5$。',
    knowledgePointCodes: ['rja.1.1.01'], primaryKnowledgePointCode: 'rja.1.1.01',
  },
  {
    code: 'HSMA-RJA-CH01-0016', specialtyCode: 'rja-ch1', categoryCode: '1.1', qtype: 'numeric', difficulty: 2,
    stem: '集合 $C=\\{x\\in\\mathbb{Z}\\mid x^2<10\\}$ 的元素个数为',
    answerPayload: { kind: 'numeric', value: '7', toleranceAbs: 0, toleranceRel: 0 },
    analysis: '整数满足 $x^2<10$ 即 $x\\in\\{-3,-2,-1,0,1,2,3\\}$，共 $7$ 个元素。',
    knowledgePointCodes: ['rja.1.1.02'], primaryKnowledgePointCode: 'rja.1.1.02',
  },

  // === 1.2 0017-0032 ===
  {
    code: 'HSMA-RJA-CH01-0017', specialtyCode: 'rja-ch1', categoryCode: '1.2', qtype: 'single', difficulty: 1,
    stem: '已知 $A=\\{1,2,3\\}$，$B=\\{1,2,3,4\\}$，则 $A$ 与 $B$ 的关系是',
    options: opts([['A', '$A\\subseteq B$ 且 $A\\ne B$'], ['B', '$B\\subseteq A$'], ['C', '$A=B$'], ['D', '$A\\not\\subseteq B$']]),
    answerPayload: { kind: 'single', optionId: 'A' },
    analysis: '$A$ 中每个元素都在 $B$ 中，且 $B$ 含 $4$ 而 $A$ 不含，故 $A$ 是 $B$ 的真子集，即 $A\\subseteq B$ 且 $A\\ne B$。',
    knowledgePointCodes: ['rja.1.2.01'], primaryKnowledgePointCode: 'rja.1.2.01',
  },
  {
    code: 'HSMA-RJA-CH01-0018', specialtyCode: 'rja-ch1', categoryCode: '1.2', qtype: 'single', difficulty: 1,
    stem: '若 $A\\subseteq B$，则下列一定成立的是',
    options: opts([['A', '若 $x\\in A$ 则 $x\\in B$'], ['B', '若 $x\\in B$ 则 $x\\in A$'], ['C', '$A$ 的元素个数等于 $B$'], ['D', '$B\\subseteq A$']]),
    answerPayload: { kind: 'single', optionId: 'A' },
    analysis: '子集定义：$A\\subseteq B$ 当且仅当 $A$ 的每个元素都属于 $B$，故 A 正确。B 为 $B\\subseteq A$ 的条件；C、D 均不一定。',
    knowledgePointCodes: ['rja.1.2.01'], primaryKnowledgePointCode: 'rja.1.2.01',
  },
  {
    code: 'HSMA-RJA-CH01-0019', specialtyCode: 'rja-ch1', categoryCode: '1.2', qtype: 'single', difficulty: 1,
    stem: '集合 $S=\\{a,b\\}$ 与 $T=\\{b,a\\}$ 的关系是',
    options: opts([['A', '$S=T$'], ['B', '$S\\subsetneq T$'], ['C', '$T\\subsetneq S$'], ['D', '$S\\cap T=\\varnothing$']]),
    answerPayload: { kind: 'single', optionId: 'A' },
    analysis: '集合相等当且仅当所含元素完全相同；无序性知 $S$ 与 $T$ 元素均为 $a,b$，故 $S=T$。',
    knowledgePointCodes: ['rja.1.2.02'], primaryKnowledgePointCode: 'rja.1.2.02',
  },
  {
    code: 'HSMA-RJA-CH01-0020', specialtyCode: 'rja-ch1', categoryCode: '1.2', qtype: 'single', difficulty: 2,
    stem: '设 $A=\\{x\\mid x\\ \\text{为小于}\\ 4\\ \\text{的正整数}\\}$，$B=\\{1,2,3\\}$，则',
    options: opts([['A', '$A=B$'], ['B', '$A\\subsetneq B$'], ['C', '$B\\subsetneq A$'], ['D', '$A\\cap B=\\varnothing$']]),
    answerPayload: { kind: 'single', optionId: 'A' },
    analysis: '小于 $4$ 的正整数为 $1,2,3$，故 $A=\\{1,2,3\\}=B$，集合相等。',
    knowledgePointCodes: ['rja.1.2.02', 'rja.1.2.01'], primaryKnowledgePointCode: 'rja.1.2.01',
  },
  {
    code: 'HSMA-RJA-CH01-0021', specialtyCode: 'rja-ch1', categoryCode: '1.2', qtype: 'single', difficulty: 2,
    stem: '若 $A\\subseteq B$ 且 $B\\subseteq A$，则下列结论正确的是',
    options: opts([['A', '$A=B$'], ['B', '$A\\subsetneq B$'], ['C', '$A\\cap B=\\varnothing$'], ['D', '$A\\cup B=\\varnothing$']]),
    answerPayload: { kind: 'single', optionId: 'A' },
    analysis: '互相包含是集合相等的充要条件，故 $A=B$。真子集要求至少一侧真包含不成立。',
    knowledgePointCodes: ['rja.1.2.02'], primaryKnowledgePointCode: 'rja.1.2.02',
  },
  {
    code: 'HSMA-RJA-CH01-0022', specialtyCode: 'rja-ch1', categoryCode: '1.2', qtype: 'single', difficulty: 2,
    stem: '含 $n$ 个元素的有限集 $A$，其真子集的个数是',
    options: opts([['A', '$2^n-1$'], ['B', '$2^n$'], ['C', '$n$'], ['D', '$2^n+1$']]),
    answerPayload: { kind: 'single', optionId: 'A' },
    analysis: '子集共 $2^n$ 个，其中含自身共 $2^n$ 个，真子集不含自身，个数为 $2^n-1$。',
    knowledgePointCodes: ['rja.1.2.01'], primaryKnowledgePointCode: 'rja.1.2.01',
  },
  {
    code: 'HSMA-RJA-CH01-0023', specialtyCode: 'rja-ch1', categoryCode: '1.2', qtype: 'single', difficulty: 3,
    stem: '已知 $A=\\{1,2\\}$，$B=\\{x\\mid x\\subseteq A\\}$，则 $B$ 中元素个数为',
    options: opts([['A', '$4$'], ['B', '$3$'], ['C', '$2$'], ['D', '$8$']]),
    answerPayload: { kind: 'single', optionId: 'A' },
    analysis: '$A$ 的子集为 $\\varnothing,\\{1\\},\\{2\\},\\{1,2\\}$ 共 $4$ 个，$B$ 的元素即这些子集本身，故 $|B|=4$。',
    knowledgePointCodes: ['rja.1.2.01', 'rja.1.1.03'], primaryKnowledgePointCode: 'rja.1.2.02',
  },
  {
    code: 'HSMA-RJA-CH01-0024', specialtyCode: 'rja-ch1', categoryCode: '1.2', qtype: 'single', difficulty: 3,
    stem: '若 $A\\subsetneq B\\subsetneq C$，且 $|A|=2$，$|C|=5$，则 $|B|$ 有多少种可能取值',
    options: opts([['A', '$2$ 种'], ['B', '$1$ 种'], ['C', '$3$ 种'], ['D', '$4$ 种']]),
    answerPayload: { kind: 'single', optionId: 'A' },
    analysis: '真包含要求 $|A|<|B|<|C|$，即 $2<|B|<5$，整数 $|B|$ 可为 $3$ 或 $4$，共两种可能取值。',
    knowledgePointCodes: ['rja.1.2.01'], primaryKnowledgePointCode: 'rja.1.2.01',
  },
  {
    code: 'HSMA-RJA-CH01-0025', specialtyCode: 'rja-ch1', categoryCode: '1.2', qtype: 'multi', difficulty: 2,
    stem: '下列关于子集与真子集的说法正确的有（多选）',
    options: opts([['A', '任何集合都是它自身的子集'], ['B', '空集是任何非空集合的真子集'], ['C', '若 $A\\subsetneq B$，则 $A\\subseteq B$ 且 $A\\ne B$'], ['D', '$A\\subseteq B$ 等价于 $B\\subseteq A$']]),
    answerPayload: { kind: 'multi', optionIds: ['A', 'C'] },
    analysis: 'A 由子集定义成立。B 中空集对空集不是真子集。C 为真子集定义。D 仅为集合相等的条件之一，不能等价。',
    knowledgePointCodes: ['rja.1.2.01'], primaryKnowledgePointCode: 'rja.1.2.01',
  },
  {
    code: 'HSMA-RJA-CH01-0026', specialtyCode: 'rja-ch1', categoryCode: '1.2', qtype: 'multi', difficulty: 2,
    stem: '下列能推出 $A=B$ 的条件有（多选）',
    options: opts([['A', '$A\\subseteq B$ 且 $B\\subseteq A$'], ['B', '$A\\cup B=B$ 且 $A\\cap B=A$'], ['C', '$A\\subsetneq B$'], ['D', '$A\\subseteq B$ 且 $|A|>|B|$']]),
    answerPayload: { kind: 'multi', optionIds: ['A', 'B'] },
    analysis: '互相包含是集合相等的充要条件；由 $A\\cup B=B$ 得 $A\\subseteq B$，由 $A\\cap B=A$ 得 $B\\subseteq A$，故 $A=B$。C 表示真包含；D 中 $|A|>|B|$ 与 $A\\subseteq B$ 不能同时成立。',
    knowledgePointCodes: ['rja.1.2.02'], primaryKnowledgePointCode: 'rja.1.2.02',
  },
]

console.log('partial - need full 80 items')
