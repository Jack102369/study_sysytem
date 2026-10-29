/** G1: Ch1×3 + Ch2×7 target designs → ACCEPTED_H3 only after dual gate. */
export const rawG1 = [
  {
    n: 1,
    chapterNo: 1,
    sectionCode: '1.4',
    kpCode: 'rja.1.4.02',
    kpName: '充分不必要与必要不充分',
    methodMain: 'equiv_transform',
    methodAux: 'classification',
    qtype: 'application',
    modelFamily: 'h3-logic-iff-nested-param-set',
    coreObjective: '参数命题嵌套充要与集合非空耦合',
    breakthrough:
      '须先将“p⇔q”拆成双向，再与 A_t≠∅ 联立；单向包含的充分条件会漏掉相等禁止支，常规只推 t∈I 会误判。',
    contrastH2: 'HARD14 多为单层 A⊆B 或单一充要；本题双向+非空+禁止相等三约束互锁。',
    stem: '设命题 $p$：$t\\in\\mathbb{R}$ 使集合 $A_t=\\{x\\mid t\\le x\\le 2t+2\\}$ 满足 $A_t\\subseteq[0,4]$；命题 $q$：$A_t\\ne\\varnothing$ 且 $A_t\\ne[0,4]$。求使“$p$ 是 $q$ 的充分必要条件”成立的 $t$ 的取值集合；并说明理由。',
    answer: '$t\\in[0,1)$（即 $p\\Leftrightarrow q$ 的 $t$ 集为 $[0,1)$）。',
    analysis:
      '非空 $\\Leftrightarrow t\\ge-1$。$A_t\\subseteq[0,4]$：$t\\ge0$ 且 $2t+2\\le4\\Rightarrow t\\in[0,1]$。若 $A_t=[0,4]$ 则必 $t=0$ 且 $2t+2=4$，矛盾，故在 $t\\in[0,1]$ 上恒有 $A_t\\ne[0,4]$。于是 $q\\Leftrightarrow(t\\ge-1)\\land(A_t\\ne[0,4])$ 在讨论域与 $p$ 比较时：当 $t\\in[0,1]$ 时 $p$ 真；但 $t=1$ 时 $A_1=[1,4]\\subseteq[0,4]$ 且非空且≠[0,4]，故 $p,q$ 皆真。需 $p\\Leftrightarrow q$：两边真值相同。对 $t\\in[0,1)$：$A_t=[t,2t+2]\\subsetneq[0,4]$，$p$ 真且 $q$ 真。$t=1$：$p$ 真 $q$ 真，亦同真。重新核对 $q$ 定义：题目 $q$ 已含非空且≠[0,4]。在 $t\\in[0,1]$ 上 $p\\Leftrightarrow q$ 皆真。但 $t<-1$ 时 $A_t=\\varnothing$，$p$ 假（空集⊆成立！）——空集是任何集合子集，故 $p$ 在 $t$ 使 $A_t=\\varnothing$ 时仍真。因此 $t<-1$：$p$ 真而 $q$ 假（空），$p\\not\\Leftrightarrow q$。$t\\in[-1,0)$：非空但左端点 $t<0$，$A_t\\not\\subseteq[0,4]$，$p$ 假；$q$ 真（非空且≠[0,4]），故不同真。$t>1$：$2t+2>4$，$p$ 假；若仍非空则 $q$ 真。故仅 $t\\in[0,1]$ 使 $p,q$ 同真。又 $t=1$ 亦同真，故 $t\\in[0,1]$。更正答案为 $[0,1]$。关键在于空集使 $p$ 恒真这一陷阱。',
    maxScore: 12,
    rubric: [
      { step: '指出空集导致 p 真而 q 假', score: 3 },
      { step: '给出 A_t⊆[0,4] 且非空的参数区间', score: 4 },
      { step: '证明该区间上 A_t≠[0,4]', score: 2 },
      { step: '检验区间外真值并得充要 t 集', score: 3 },
    ],
    correctedAnswer: '$t\\in[0,1]$',
    h3Why:
      '突破点是空集⊆使充分必要的真值表塌陷；需对空/非空/越界三类分别比对 p,q，而非只解包含不等式。',
  },
  {
    n: 2,
    chapterNo: 1,
    sectionCode: '1.5',
    kpCode: 'rja.1.5.02',
    kpName: '全称量词与存在量词的否定',
    methodMain: 'equiv_transform',
    methodAux: 'classification',
    qtype: 'application',
    modelFamily: 'h3-quantifier-swap-quadratic-family',
    coreObjective: '∀∃ 与 ∃∀ 在二次族上不等价的参数刻画',
    breakthrough: '须构造“对每个 a 选 x”与“先选 x 再对所有 a”的反例间隔，不能把量词顺序当文字游戏。',
    contrastH2: 'HARD14 有线性 ∀∃ 交换；本题二次开口与顶点随 a 移动，反例构造依赖判别式与顶点落点。',
    stem: '设 $f_a(x)=x^{2}-2ax+a$，讨论下列两命题是否等价，并求使二者都成立的实数 $a$ 的集合（若存在）：\n（I）$\\forall a\\in[0,1],\\ \\exists x\\in[0,1]$ 使 $f_a(x)\\le0$；\n（II）$\\exists x\\in[0,1],\\ \\forall a\\in[0,1]$ 使 $f_a(x)\\le0$。',
    answer:
      '（I）与（II）不等价。（I）对题中量化的 $a$ 范围恒真（作为关于族的陈述需澄清）；正确解读：视 $a$ 为参数变量时，（I）意为“对每个 $a\\in[0,1]$ 都存在 $x\\in[0,1]$ 使 $f_a(x)\\le0$”，（II）为存在公共 $x$。二者都成立的 $a$ 不应再量化——题意是判断两命题真假并求使（II）成立的条件。最终：（I）真；（II）真当且仅当存在 $x\\in[0,1]$ 使对一切 $a\\in[0,1]$ 有 $x^{2}-2ax+a\\le0$。化简得公共 $x$ 条件并求解。',
    analysis:
      '（I）：对固定 $a\\in[0,1]$，$f_a(x)=(x-a)^{2}+a-a^{2}=(x-a)^{2}+a(1-a)\\ge0$，且最小值 $a(1-a)\\ge0$。$f_a\\le0$ 需最小值≤0 且在 $[0,1]$ 可达。$a(1-a)\\ge0$，故 $f_a\\le0\\Leftrightarrow f_a=0\\Leftrightarrow x=a$ 且 $a(1-a)=0$，即 $a=0$ 或 $1$。因此当 $a\\in(0,1)$ 时 $f_a(x)\\ge a(1-a)>0$，对一切 $x$ 有 $f_a>0$，故（I）为假！\n重新检查：$f_a(x)=x^{2}-2ax+a=(x-a)^{2}-a^{2}+a=(x-a)^{2}+a(1-a)$，是。对 $a\\in(0,1)$ 恒正，（I）假。\n（II）：需 $\\exists x\\in[0,1]\\ \\forall a\\in[0,1]:(x-a)^{2}+a(1-a)\\le0$。左边≥$a(1-a)\\ge0$，故必须对一切 $a$ 有 $a(1-a)=0$ 且 $x=a$，不可能对一切 $a$。故（II）亦假。\n两命题都假，但不等价于“同真同假意义上的逻辑等价讨论”——它们恰为同假，逻辑上等价（同假）。更有教学价值的改题：改 $f_a(x)=x^{2}-2ax+a^{2}-1=(x-a)^{2}-1$。',
    // Will replace with corrected problem below in fix pass
    _needsRebuild: true,
    rejectReason: 'MATH_ISSUE_and_weak_after_correction_path',
  },
]
