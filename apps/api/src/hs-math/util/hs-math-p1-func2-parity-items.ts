/**
 * P1-FUNC-2：第三章函数奇偶性专项正式题库（权威源，不写库）。
 * specialtyCode=rja-ch3；categoryCode=3.2；主 KP ∈ {rja.3.2.09..12}。
 * code：HSMA-RJA-CH03-PARITY-0001 … 0025
 */
export type BankItem = {
  code: string
  specialtyCode: string
  categoryCode: string
  qtype: 'single' | 'multi' | 'judge' | 'numeric'
  difficulty: 1 | 2 | 3
  stem: string
  options?: { options: Array<{ id: string; text: string }> } | null
  answerPayload: Record<string, unknown>
  analysis: string
  knowledgePointCodes: string[]
  primaryKnowledgePointCode: string
  /** 内容分组标签（仅校验/文档用，不进导入 JSON） */
  contentGroup:
    | 'definition'
    | 'domain_symmetry'
    | 'judgment'
    | 'evaluation'
    | 'graph'
    | 'mono_combo'
}

const SP = 'rja-ch3'
const CAT = '3.2'
const KP09 = 'rja.3.2.09'
const KP10 = 'rja.3.2.10'
const KP11 = 'rja.3.2.11'
const KP12 = 'rja.3.2.12'

function c(n: number) {
  return `HSMA-RJA-CH03-PARITY-${String(n).padStart(4, '0')}`
}

function single(
  n: number,
  diff: 1 | 2 | 3,
  stem: string,
  opts: [string, string, string, string],
  ans: 'A' | 'B' | 'C' | 'D',
  analysis: string,
  kps: string[],
  primary: string,
  contentGroup: BankItem['contentGroup'],
): BankItem {
  return {
    code: c(n),
    specialtyCode: SP,
    categoryCode: CAT,
    qtype: 'single',
    difficulty: diff,
    stem,
    options: {
      options: [
        { id: 'A', text: opts[0] },
        { id: 'B', text: opts[1] },
        { id: 'C', text: opts[2] },
        { id: 'D', text: opts[3] },
      ],
    },
    answerPayload: { kind: 'single', optionId: ans },
    analysis,
    knowledgePointCodes: kps,
    primaryKnowledgePointCode: primary,
    contentGroup,
  }
}

function multi(
  n: number,
  diff: 1 | 2 | 3,
  stem: string,
  opts: Array<{ id: string; text: string }>,
  ans: string[],
  analysis: string,
  kps: string[],
  primary: string,
  contentGroup: BankItem['contentGroup'],
): BankItem {
  return {
    code: c(n),
    specialtyCode: SP,
    categoryCode: CAT,
    qtype: 'multi',
    difficulty: diff,
    stem,
    options: { options: opts },
    answerPayload: { kind: 'multi', optionIds: ans },
    analysis,
    knowledgePointCodes: kps,
    primaryKnowledgePointCode: primary,
    contentGroup,
  }
}

function judge(
  n: number,
  diff: 1 | 2 | 3,
  stem: string,
  value: boolean,
  analysis: string,
  kps: string[],
  primary: string,
  contentGroup: BankItem['contentGroup'],
): BankItem {
  return {
    code: c(n),
    specialtyCode: SP,
    categoryCode: CAT,
    qtype: 'judge',
    difficulty: diff,
    stem,
    answerPayload: { kind: 'judge', value },
    analysis,
    knowledgePointCodes: kps,
    primaryKnowledgePointCode: primary,
    contentGroup,
  }
}

function numeric(
  n: number,
  diff: 1 | 2 | 3,
  stem: string,
  value: string,
  analysis: string,
  kps: string[],
  primary: string,
  contentGroup: BankItem['contentGroup'],
): BankItem {
  return {
    code: c(n),
    specialtyCode: SP,
    categoryCode: CAT,
    qtype: 'numeric',
    difficulty: diff,
    stem,
    answerPayload: {
      kind: 'numeric',
      value,
      toleranceAbs: 0,
      toleranceRel: 0,
    },
    analysis,
    knowledgePointCodes: kps,
    primaryKnowledgePointCode: primary,
    contentGroup,
  }
}

/**
 * 25 题顺序固定；校验脚本按序号与分配表核对。
 * 内容组：定义5 / 定义域4 / 判断5 / 求值4 / 图象3 / 综合4
 */
export const PARITY25_ITEMS: BankItem[] = [
  // ========== 1–5 奇偶性定义 ==========
  single(
    1,
    1,
    '设函数 $f$ 的定义域关于原点对称。若对定义域内任意 $x$ 都有 $f(-x)=f(x)$，则称 $f$ 为',
    ['奇函数', '偶函数', '既奇又偶的函数', '非奇非偶函数'],
    'B',
    '定义域关于原点对称是讨论奇偶性的前提。对任意 $x$ 有 $f(-x)=f(x)$ 时，$f$ 为偶函数。',
    [KP09],
    KP09,
    'definition',
  ),
  judge(
    2,
    1,
    '判断：若函数 $f$ 满足对定义域内任意 $x$ 都有 $f(-x)=-f(x)$，则 $f$ 一定是奇函数（无需再检查定义域）。',
    false,
    '讨论奇偶性必须先检验定义域关于原点对称。仅有代数关系 $f(-x)=-f(x)$ 而定义域不对称时，不能称为奇函数。',
    [KP09],
    KP09,
    'definition',
  ),
  single(
    3,
    1,
    '下列关于函数奇偶性定义的叙述，正确的是',
    [
      '只要 $f(-x)=-f(x)$ 成立，$f$ 就是奇函数',
      '偶函数必满足 $f(-x)=-f(x)$',
      '奇函数要求定义域关于原点对称，且 $f(-x)=-f(x)$',
      '奇偶性与定义域是否对称无关',
    ],
    'C',
    '奇函数定义：定义域关于原点对称，且对定义域内任意 $x$ 有 $f(-x)=-f(x)$。缺一不可。',
    [KP09, KP10],
    KP09,
    'definition',
  ),
  multi(
    4,
    2,
    '设函数 $f$ 定义域关于原点对称。下列说法正确的是（多选）',
    [
      { id: 'A', text: '若 $f$ 为偶函数，则 $f(-x)=f(x)$' },
      { id: 'B', text: '若 $f$ 为奇函数，则 $f(-x)=-f(x)$' },
      { id: 'C', text: '若 $f(0)$ 有定义且 $f$ 为奇函数，则必有 $f(0)=0$' },
      {
        id: 'D',
        text: '若存在某 $a$ 使 $f(-a)\\neq f(a)$ 且 $f(-a)\\neq -f(a)$，则 $f$ 非奇非偶',
      },
    ],
    ['A', 'B', 'C', 'D'],
    '在定义域已对称的前提下：偶/奇分别对应 $f(-x)=f(x)$ / $f(-x)=-f(x)$。奇函数若 $0$ 在定义域，则 $f(0)=-f(0)\\Rightarrow f(0)=0$。若既不满足偶又不满足奇的恒等式，则为非奇非偶。',
    [KP09, KP10, KP11],
    KP09,
    'definition',
  ),
  single(
    5,
    1,
    '已知 $f(x)=x^{3}$ 的定义域为 $\\mathbb{R}$。判断其奇偶性时，下列步骤正确的是',
    [
      '直接看次数为奇数，故为奇函数，无需验证定义域',
      '先确认定义域关于原点对称，再验证 $f(-x)=-f(x)$',
      '只需验证 $f(-1)=-f(1)$ 即可断定为奇函数',
      '因为过原点，所以一定是偶函数',
    ],
    'B',
    '正确流程：先确认定义域对称（此处 $\\mathbb{R}$ 对称），再验证对任意 $x$，$f(-x)=(-x)^{3}=-x^{3}=-f(x)$，故为奇函数。仅验证个别点或只看次数不够严谨。',
    [KP09, KP10],
    KP10,
    'definition',
  ),

  // ========== 6–9 定义域对称性 ==========
  single(
    6,
    1,
    '函数 $f(x)=\\sqrt{x-1}+\\sqrt{1-x}$ 的定义域',
    [
      '关于原点对称，可讨论奇偶性',
      '为 $\\{1\\}$，关于原点不对称，故非奇非偶',
      '为 $[0,+\\infty)$，可讨论奇偶性',
      '为空集，规定为偶函数',
    ],
    'B',
    '由 $x-1\\ge 0$ 且 $1-x\\ge 0$ 得 $x=1$，定义域 $\\{1\\}$。关于原点的对称点 $-1\\notin\\{1\\}$，定义域不对称，故非奇非偶。',
    [KP09, KP10],
    KP09,
    'domain_symmetry',
  ),
  judge(
    7,
    1,
    '判断：函数 $f(x)=\\dfrac{1}{x}$ 的定义域为 $(-\\infty,0)\\cup(0,+\\infty)$，关于原点对称，因此可以进一步用定义讨论其奇偶性。',
    true,
    '定义域 $\\mathbb{R}\\setminus\\{0\\}$ 关于原点对称，具备讨论奇偶性的前提；再验证 $f(-x)=-1/x=-f(x)$ 可知其为奇函数。本题只考前提是否成立。',
    [KP09],
    KP09,
    'domain_symmetry',
  ),
  single(
    8,
    2,
    '函数 $f(x)=\\sqrt{x^{2}-1}$ 的定义域为',
    [
      '$[-1,1]$，关于原点对称',
      '$(-\\infty,-1]\\cup[1,+\\infty)$，关于原点对称',
      '$(1,+\\infty)$，关于原点不对称',
      '$[0,+\\infty)$，关于原点对称',
    ],
    'B',
    '由 $x^{2}-1\\ge 0$ 得 $x\\le -1$ 或 $x\\ge 1$，即 $(-\\infty,-1]\\cup[1,+\\infty)$。若 $x$ 属于该集合，则 $-x$ 也属于，故关于原点对称，可继续讨论奇偶性。',
    [KP09, KP10],
    KP10,
    'domain_symmetry',
  ),
  multi(
    9,
    2,
    '下列函数中，定义域关于原点对称的是（多选）',
    [
      { id: 'A', text: '$f(x)=\\sqrt{4-x^{2}}$' },
      { id: 'B', text: '$g(x)=\\ln(x+2)$' },
      { id: 'C', text: '$h(x)=\\dfrac{1}{x^{2}-1}$' },
      { id: 'D', text: '$p(x)=\\sqrt{x}+\\sqrt{-x}$' },
    ],
    ['A', 'C', 'D'],
    'A：定义域 $[-2,2]$，对称。B：$x>-2$，不对称。C：$x\\neq\\pm 1$，仍关于原点对称。D：仅 $x=0$，对称。故选 A、C、D。',
    [KP09, KP10],
    KP10,
    'domain_symmetry',
  ),

  // ========== 10–14 奇偶函数判断 ==========
  single(
    10,
    1,
    '函数 $f(x)=x^{2}+1$（定义域 $\\mathbb{R}$）是',
    ['奇函数', '偶函数', '既奇又偶', '非奇非偶'],
    'B',
    '定义域 $\\mathbb{R}$ 对称。$f(-x)=(-x)^{2}+1=x^{2}+1=f(x)$，故为偶函数。',
    [KP10, KP09],
    KP10,
    'judgment',
  ),
  single(
    11,
    1,
    '函数 $f(x)=x^{3}-x$（定义域 $\\mathbb{R}$）是',
    ['奇函数', '偶函数', '既奇又偶', '非奇非偶'],
    'A',
    '定义域对称。$f(-x)=(-x)^{3}-(-x)=-x^{3}+x=-(x^{3}-x)=-f(x)$，故为奇函数。',
    [KP10, KP09],
    KP10,
    'judgment',
  ),
  multi(
    12,
    2,
    '设 $f(x)=0$（定义域 $\\mathbb{R}$）。下列说法正确的是（多选）',
    [
      { id: 'A', text: '$f$ 是奇函数' },
      { id: 'B', text: '$f$ 是偶函数' },
      { id: 'C', text: '$f$ 既是奇函数又是偶函数' },
      { id: 'D', text: '$f$ 非奇非偶' },
    ],
    ['A', 'B', 'C'],
    '零函数在关于原点对称的定义域上：$f(-x)=0=f(x)$ 且 $f(-x)=0=-f(x)$，故既奇又偶。A、B、C 均正确，D 错误。',
    [KP11, KP09, KP10],
    KP11,
    'judgment',
  ),
  single(
    13,
    2,
    '函数 $f(x)=x+|x|$（定义域 $\\mathbb{R}$）的奇偶性是',
    ['奇函数', '偶函数', '既奇又偶', '非奇非偶'],
    'D',
    '定义域对称。$f(-x)=-x+|-x|=-x+|x|$。一般地 $f(-x)\\neq f(x)$（如 $x=1$：$f(1)=2$，$f(-1)=0$），且 $f(-x)\\neq -f(x)$（$-f(1)=-2\\neq 0$），故非奇非偶。',
    [KP10, KP11],
    KP11,
    'judgment',
  ),
  judge(
    14,
    1,
    '判断：函数 $f(x)=x^{2}+x$（定义域 $\\mathbb{R}$）是偶函数。',
    false,
    '$f(-x)=x^{2}-x$。取 $x=1$，$f(-1)=0\\neq f(1)=2$，故不是偶函数；也不是奇函数（$f(-1)=0\\neq -2$），为非奇非偶。',
    [KP10, KP11],
    KP11,
    'judgment',
  ),

  // ========== 15–18 利用奇偶性求值（numeric） ==========
  numeric(
    15,
    1,
    '已知奇函数 $f$ 的定义域关于原点对称，且 $f(3)=5$。求 $f(-3)$ 的值。',
    '-5',
    '奇函数满足 $f(-x)=-f(x)$，故 $f(-3)=-f(3)=-5$。',
    [KP12, KP09],
    KP12,
    'evaluation',
  ),
  numeric(
    16,
    1,
    '已知偶函数 $f$ 的定义域关于原点对称，且 $f(-2)=7$。求 $f(2)$ 的值。',
    '7',
    '偶函数满足 $f(-x)=f(x)$，故 $f(2)=f(-2)=7$。',
    [KP12, KP09],
    KP12,
    'evaluation',
  ),
  numeric(
    17,
    1,
    '已知奇函数 $f$ 定义在 $\\mathbb{R}$ 上，$f(1)=2$，$f(2)=5$。求 $f(-1)+f(-2)$ 的值。',
    '-7',
    '$f(-1)=-f(1)=-2$，$f(-2)=-f(2)=-5$，故和为 $-7$。',
    [KP12],
    KP12,
    'evaluation',
  ),
  numeric(
    18,
    1,
    '已知偶函数 $f$ 定义在 $\\mathbb{R}$ 上，$f(4)=3$，且 $f(x)=ax^{2}+b$（$a,b$ 为常数）。若还已知 $f(0)=1$，求 $f(-4)$ 的值。',
    '3',
    '偶函数有 $f(-4)=f(4)=3$。由 $f(0)=1$ 可知常数项，但不影响 $f(\\pm 4)$ 的相等关系；本题所求仅为 $f(-4)$。',
    [KP12, KP10],
    KP12,
    'evaluation',
  ),

  // ========== 19–21 图象对称性 ==========
  single(
    19,
    1,
    '若函数 $y=f(x)$ 是偶函数，则其图象',
    [
      '关于原点对称',
      '关于 $y$ 轴对称',
      '关于 $x$ 轴对称',
      '关于直线 $y=x$ 对称',
    ],
    'B',
    '由偶函数定义，$f(-x)=f(x)$，图象上点 $(x,y)$ 与 $(-x,y)$ 同时出现，故图象关于 $y$ 轴对称。奇函数则关于原点对称，二者不可混淆。',
    [KP11, KP09],
    KP11,
    'graph',
  ),
  single(
    20,
    1,
    '已知点 $(2,5)$ 在奇函数 $y=f(x)$ 的图象上，则下列点也在该图象上的是',
    ['$(-2,5)$', '$(-2,-5)$', '$(2,-5)$', '$(5,2)$'],
    'B',
    '奇函数图象关于原点对称：点 $(a,b)$ 在图象上则 $(-a,-b)$ 也在图象上。故 $(2,5)$ 对应 $(-2,-5)$。',
    [KP11, KP12],
    KP11,
    'graph',
  ),
  multi(
    21,
    2,
    '已知偶函数 $y=f(x)$ 的图象过点 $(3,-1)$。下列说法正确的是（多选）',
    [
      { id: 'A', text: '图象也过点 $(-3,-1)$' },
      { id: 'B', text: '图象也过点 $(-3,1)$' },
      { id: 'C', text: '图象关于 $y$ 轴对称' },
      { id: 'D', text: '必有 $f(-3)=f(3)$' },
    ],
    ['A', 'C', 'D'],
    '偶函数关于 $y$ 轴对称，故过 $(3,-1)$ 必过 $(-3,-1)$，且 $f(-3)=f(3)=-1$。B 的纵坐标符号错误。',
    [KP11, KP12],
    KP12,
    'graph',
  ),

  // ========== 22–25 奇偶性与单调性综合 ==========
  single(
    22,
    3,
    '设 $f$ 是定义在 $\\mathbb{R}$ 上的奇函数，且 $f$ 在 $[0,+\\infty)$ 上单调递增。则 $f$ 在 $(-\\infty,0]$ 上',
    ['单调递增', '单调递减', '先增后减', '无法判断'],
    'A',
    '取 $x_{1}<x_{2}\\le 0$，则 $0\\le -x_{2}<-x_{1}$。由正半轴递增得 $f(-x_{2})<f(-x_{1})$。又奇函数 $f(-x)=-f(x)$，故 $-f(x_{2})<-f(x_{1})$，即 $f(x_{1})<f(x_{2})$，从而在 $(-\\infty,0]$ 上也单调递增。必须明确所论区间与奇偶性。',
    [KP12, KP09, KP10],
    KP12,
    'mono_combo',
  ),
  multi(
    23,
    3,
    '设 $f$ 是定义在 $\\mathbb{R}$ 上的偶函数，且 $f$ 在 $[0,+\\infty)$ 上单调递减。下列正确的是（多选）',
    [
      { id: 'A', text: '$f$ 在 $(-\\infty,0]$ 上单调递增' },
      { id: 'B', text: '$f$ 在 $(-\\infty,0]$ 上单调递减' },
      { id: 'C', text: '对任意 $x$，有 $f(|x|)=f(x)$' },
      { id: 'D', text: '仅由偶函数不能推出其在正半轴单调' },
    ],
    ['A', 'C', 'D'],
    '偶函数关于 $y$ 轴对称：正半轴递减对应负半轴递增（可类似用对称点证明）。$f(|x|)=f(x)$ 对偶函数成立。偶函数本身不蕴含单调性，D 正确。B 错误。',
    [KP12, KP11],
    KP12,
    'mono_combo',
  ),
  judge(
    24,
    2,
    '判断：任意奇函数在其整个定义域上都一定是单调函数。',
    false,
    '反例：$f(x)=x^{3}-x$ 是奇函数，但在 $\\mathbb{R}$ 上不单调（局部有增减）。奇偶性与单调性相互独立，综合题必须另行给出单调区间条件。',
    [KP10, KP12],
    KP10,
    'mono_combo',
  ),
  single(
    25,
    1,
    '设 $f$ 是定义在 $[-2,2]$ 上的偶函数，且当 $x\\in[0,2]$ 时 $f(x)=x+1$。则 $f(-1)$ 等于',
    ['$0$', '$1$', '$2$', '$-1$'],
    'C',
    '偶函数有 $f(-1)=f(1)$。又 $1\\in[0,2]$，故 $f(1)=1+1=2$，从而 $f(-1)=2$。定义域 $[-2,2]$ 关于原点对称，条件充分。',
    [KP10, KP12],
    KP10,
    'mono_combo',
  ),
]

/** 导入用：去掉 contentGroup */
export function toImportItems(items: BankItem[] = PARITY25_ITEMS) {
  return items.map(
    ({ contentGroup: _g, ...rest }) =>
      rest as Omit<BankItem, 'contentGroup'>,
  )
}
