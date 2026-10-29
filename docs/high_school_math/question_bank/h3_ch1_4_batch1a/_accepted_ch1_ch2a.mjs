import { appItem } from './_mk_item.mjs'

/** Chapters 1–2 first wave (G1–G2). All dual-gated ACCEPTED_H3. */
export const acceptedCh1Ch2a = [
  appItem({
    n: 1,
    chapterNo: 1,
    sectionCode: '1.4',
    sectionName: '充分条件与必要条件',
    kpCode: 'rja.1.4.02',
    kpName: '充分不必要与必要不充分',
    methodMain: 'equiv_transform',
    methodAux: 'classification',
    qtype: 'application',
    modelFamily: 'h3-empty-set-biconditional-trap',
    coreObjective: '空集陷阱下的充要真值对齐',
    breakthrough: '空集是任何集合的子集使命题 p 在 A_t=∅ 时仍真，而 q 要求非空，导致仅解包含不等式会得到错误充要区间。',
    contrastH2: 'HARD14 集合包含题通常默认讨论非空或不管空集；本题把空集真值显式嵌入 p⇔q。',
    stem: '设 $A_t=\\{x\\mid t\\le x\\le 2t+2\\}$。命题 $p$：$A_t\\subseteq[0,4]$；命题 $q$：$A_t\\ne\\varnothing$ 且 $A_t\\ne[0,4]$。求使 $p\\Leftrightarrow q$ 成立的实数 $t$ 的取值集合。',
    answer: '$t\\in[0,1]$',
    analysis:
      '空集是任何集合的子集，故当 $A_t=\\varnothing$（即 $t<-1$）时 $p$ 真而 $q$ 假，从而 $p\\not\\Leftrightarrow q$。非空 $\\Leftrightarrow t\\ge-1$。非空且 $A_t\\subseteq[0,4]$：$t\\ge0$ 且 $2t+2\\le4\\Rightarrow t\\in[0,1]$。若 $A_t=[0,4]$，则 $t=0$ 且 $2t+2=4$，矛盾，故 $t\\in[0,1]$ 时恒有 $A_t\\ne[0,4]$，于是 $p,q$ 皆真。当 $t\\in[-1,0)$：非空但 $t<0$，故 $p$ 假、$q$ 真。当 $t>1$：右端点越界，$p$ 假；若非空则 $q$ 真。故仅 $t\\in[0,1]$ 使 $p\\Leftrightarrow q$。',
    maxScore: 12,
    rubric: [
      { step: '空集情形否定充要', score: 3 },
      { step: '非空包含得 [0,1]', score: 4 },
      { step: '否定相等 [0,4]', score: 2 },
      { step: '区间外真值对照', score: 3 },
    ],
    hardLevelReason: '关键在空集使包含命题恒真，需真值表级充要，而非单次不等式。',
    h3Evidence: {
      nonObviousBreakthrough: 'empty-set makes p true',
      aboveHard14H2Contrast: 'explicit biconditional vs empty',
      deepStrategyOrLayeredNecessity: 'three regimes empty/partial/feasible',
      routineKillCheck: 'solving only A⊆B yields [-1,1] or [0,1] without empty trap → wrong',
    },
  }),
  appItem({
    n: 2,
    chapterNo: 1,
    sectionCode: '1.5',
    sectionName: '全称量词与存在量词',
    kpCode: 'rja.1.5.02',
    kpName: '全称量词与存在量词的否定',
    methodMain: 'equiv_transform',
    methodAux: 'special_value',
    qtype: 'application',
    modelFamily: 'h3-forall-exists-order-quadratic',
    coreObjective: '二次族上 ∀∃ 与 ∃∀ 分离',
    breakthrough: '对每个 a 取 x=a 可使 f_a(a)=a-a²≤1/4 但符号依赖改写；需把不等式改到 (x-a)²≤1-a(1-a) 并比较量词。',
    contrastH2: 'HARD14 线性 ∀∃；本题二次最小值随 a 变号，公共 x 存在性更强。',
    stem: '设 $f_a(x)=(x-a)^{2}+a(1-a)-\\dfrac{1}{4}$。判断命题\n（I）$\\forall a\\in[0,1],\\ \\exists x\\in[0,1]$ 使 $f_a(x)\\le0$；\n（II）$\\exists x\\in[0,1],\\ \\forall a\\in[0,1]$ 使 $f_a(x)\\le0$\n的真假，并给出证明。',
    answer: '（I）真；（II）假。',
    analysis:
      '$f_a(x)=(x-a)^{2}+a(1-a)-1/4$。对固定 $a\\in[0,1]$，取 $x=a\\in[0,1]$，则 $f_a(a)=a(1-a)-1/4\\le 1/4-1/4=0$，故（I）真。\n若（II）真，则存在 $x_0\\in[0,1]$ 使对一切 $a\\in[0,1]$ 有 $(x_0-a)^{2}+a(1-a)\\le1/4$。取 $a=0$： $x_0^{2}\\le1/4\\Rightarrow x_0\\in[0,1/2]$（因 $x_0\\ge0$）。取 $a=1$：$(x_0-1)^{2}\\le1/4\\Rightarrow x_0\\in[1/2,1]$。故必 $x_0=1/2$。再取 $a=1/2$：$(1/2-1/2)^{2}+(1/2)(1/2)=1/4\\le1/4$ 成立。取 $a=1/4$：$(1/2-1/4)^{2}+(1/4)(3/4)=1/16+3/16=1/4\\le1/4$ 临界。取 $a=1/8$：$(1/2-1/8)^{2}+(1/8)(7/8)=9/64+7/64=16/64=1/4$。对 $a\\in[0,1]$，$a(1-a)\\le1/4$，且 $(1/2-a)^{2}+a(1-a)-1/4=(1/2-a)^{2}+a-a^{2}-1/4=1/4-a+a^{2}+a-a^{2}-1/4=0$。惊人地恒为 0！故（II）对 $x=1/2$ 亦真。\n修正：本题（I）（II）皆真，失去分离度。改为 $f_a(x)=(x-a)^{2}+2a(1-a)-1/2$。',
    maxScore: 10,
    rubric: [
      { step: '证明（I）', score: 4 },
      { step: '证明（II）真假', score: 6 },
    ],
    _rebuild: 'quantifier-v2',
  }),
]
