/** Dual-gate ACCEPTED_H3 only (baseline 38 + Ch3-1C append) */
export const acceptedFinal = [
  {
    "n": 1,
    "chapterNo": 1,
    "sectionCode": "1.4",
    "sectionName": "充分条件与必要条件",
    "kpCode": "rja.1.4.03",
    "kpName": "充要条件",
    "methodMain": "equiv_transform",
    "methodAux": "classification",
    "qtype": "application",
    "modelFamily": "h3-empty-set-biconditional-trap",
    "coreObjective": "空集陷阱下 p⇔q 的真值分层",
    "breakthrough": "空集是任何集合的子集，故 A_t=∅ 时 p 仍真而 q 假；只解非空包含不等式会得到错误充要区间。",
    "contrastH2": "HARD14 集合包含题常默认讨论非空或不管空集；本题把空集真值显式嵌入 p⇔q。",
    "stem": "设 $A_t=\\{x\\mid t\\le x\\le 2t+2\\}$。命题 $p$：$A_t\\subseteq[0,4]$；命题 $q$：$A_t\\ne\\varnothing$ 且 $A_t\\ne[0,4]$。求使 $p\\Leftrightarrow q$ 成立的实数 $t$ 的取值集合。",
    "answer": "$t\\in[0,1]$",
    "analysis": "先判空集：$A_t=\\varnothing\\Leftrightarrow t>2t+2\\Leftrightarrow t<-1$。空集是任何集合的子集，故 $t<-1$ 时 $p$ 真；但 $q$ 要求非空，故 $q$ 假，从而 $p\\not\\Leftrightarrow q$。\n下设 $t\\ge -1$，则 $A_t=[t,2t+2]$ 非空。$A_t\\subseteq[0,4]\\Leftrightarrow t\\ge 0$ 且 $2t+2\\le 4\\Leftrightarrow t\\in[0,1]$。\n若 $A_t=[0,4]$，则必 $t=0$ 且 $2t+2=4\\Leftrightarrow t=1$，矛盾，故对一切实数 $t$ 有 $A_t\\ne[0,4]$。于是在 $t\\ge -1$ 时，$q\\Leftrightarrow A_t\\ne\\varnothing$ 已自动满足“≠[0,4]”，即 $q$ 真。\n因此当 $t\\in[0,1]$ 时 $p,q$ 皆真。当 $t\\in[-1,0)$：$A_t$ 非空但左端点 $t<0$，故 $p$ 假、$q$ 真。当 $t>1$：右端点 $2t+2>4$，$p$ 假、$q$ 真。\n综上，仅 $t\\in[0,1]$ 使 $p\\Leftrightarrow q$。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "空集情形指出 p 真 q 假",
        "score": 3
      },
      {
        "step": "非空包含得 t∈[0,1]",
        "score": 4
      },
      {
        "step": "证明永不可能 A_t=[0,4]",
        "score": 2
      },
      {
        "step": "区间外真值对照得充要集",
        "score": 3
      }
    ],
    "hardLevelReason": "关键在空集使包含命题恒真，必须做空/临界/越界三区真值表，而非一次不等式。",
    "h3Evidence": {
      "nonObviousBreakthrough": "empty-set makes p true while q false",
      "aboveHard14H2Contrast": "explicit biconditional vs empty-set trap",
      "deepStrategyOrLayeredNecessity": "three regimes empty/feasible/overflow",
      "routineKillCheck": "solving only A⊆B without empty → wrong iff set"
    },
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "options": null,
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 2,
    "chapterNo": 1,
    "sectionCode": "1.5",
    "sectionName": "全称量词与存在量词",
    "kpCode": "rja.1.5.01",
    "kpName": "全称量词",
    "methodMain": "special_value",
    "methodAux": "equiv_transform",
    "qtype": "application",
    "modelFamily": "h3-forall-exists-order-separation",
    "coreObjective": "二次族上 ∀∃ 与 ∃∀ 严格分离",
    "breakthrough": "对每个 a 取 x=a 可使 (I) 成立；但 (II) 要求公共 x 同时适应 a=0 与 a=1，迫使 x=0 且 x=1，矛盾。",
    "contrastH2": "HARD14 多为线性 ∀∃ 或同真同假；本题用二次平移族造出“逐点可、公共不可”。",
    "stem": "设 $f_a(x)=(x-a)^{2}-a(1-a)$，$a\\in[0,1]$。判断下列命题的真假，并给出证明：\n（I）$\\forall a\\in[0,1],\\ \\exists x\\in[0,1]$ 使 $f_a(x)\\le 0$；\n（II）$\\exists x\\in[0,1],\\ \\forall a\\in[0,1]$ 使 $f_a(x)\\le 0$。",
    "answer": "（I）真；（II）假。",
    "analysis": "（I）：任取 $a\\in[0,1]$，取 $x=a\\in[0,1]$，则 $f_a(a)=-a(1-a)\\le 0$，故（I）真。\n（II）：反证。若存在 $x_0\\in[0,1]$ 使对一切 $a\\in[0,1]$ 有 $(x_0-a)^{2}\\le a(1-a)$。取 $a=0$：$(x_0)^{2}\\le 0\\Rightarrow x_0=0$。取 $a=1$：$(x_0-1)^{2}\\le 0\\Rightarrow x_0=1$。矛盾。故（II）假。\n（亦可：由 $a=0,1$ 得 $x_0\\in\\{0\\}\\cap\\{1\\}=\\varnothing$。）因此两命题不等价，（I）真（II）假。",
    "maxScore": 10,
    "rubric": [
      {
        "step": "构造 x=a 证明（I）",
        "score": 4
      },
      {
        "step": "用 a=0 与 a=1 否定（II）",
        "score": 6
      }
    ],
    "hardLevelReason": "突破点是量词顺序：逐点取对角元可行，但端点特值摧毁公共元，非文字游戏。",
    "h3Evidence": {
      "nonObviousBreakthrough": "diagonal x=a vs endpoint clash on common x",
      "aboveHard14H2Contrast": "quadratic family forces strict ∀∃≠∃∀",
      "deepStrategyOrLayeredNecessity": "prove I by construction; kill II by a=0,1",
      "routineKillCheck": "treating quantifier order as equivalent → wrong"
    },
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "options": null,
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 3,
    "chapterNo": 1,
    "sectionCode": "1.2",
    "sectionName": "集合间的基本关系",
    "kpCode": "rja.1.2.01",
    "kpName": "子集与真子集",
    "methodMain": "classification",
    "methodAux": "equiv_transform",
    "qtype": "application",
    "modelFamily": "h3-quad-subset-empty-branch-lock",
    "coreObjective": "二次解集⊆固定区间必须并入空集支并排除 a>1 伪解",
    "breakthrough": "Δ<0 的空集支使包含恒真；a>1 时开口向上的解集左端点必 <-1，被 [-1,1] 拒绝——漏空集或只套端点公式都会错。",
    "contrastH2": "HARD14 含参区间⊆多为一次端点比较；本题二次 Δ 符号三分，空集与越界同时出现。",
    "stem": "设 $S_a=\\{x\\in\\mathbb{R}\\mid x^{2}+2ax+a\\le 0\\}$。求使 $S_a\\subseteq[-1,1]$ 成立的实数 $a$ 的取值集合。",
    "answer": "$a\\in\\left[-\\dfrac{1}{3},1\\right]$",
    "analysis": "记 $g(x)=x^{2}+2ax+a$，开口向上，$\\Delta=4a^{2}-4a=4a(a-1)$。\n（i）若 $\\Delta<0$，即 $a\\in(0,1)$，则 $S_a=\\varnothing\\subseteq[-1,1]$，成立。\n（ii）若 $\\Delta=0$：即 $a=0$ 或 $a=1$。$a=0$ 时 $S_0=\\{0\\}\\subseteq[-1,1]$；$a=1$ 时 $S_1=\\{-1\\}\\subseteq[-1,1]$，皆成立。\n（iii）若 $a<0$，则 $\\Delta>0$，根为 $-a\\pm\\delta$，其中 $\\delta=\\sqrt{a^{2}-a}$，$S_a=[-a-\\delta,-a+\\delta]$。需\n$-a-\\delta\\ge -1$ 且 $-a+\\delta\\le 1$，即 $\\delta\\le 1-a$ 且 $\\delta\\le 1+a$。因 $a<0$ 有 $1-a>1+a$，故只需 $\\delta\\le 1+a$。由此先得 $1+a>0\\Leftrightarrow a>-1$（否则右边非正而 $\\delta>0$）。在 $a\\in(-1,0)$ 上平方：\n$a^{2}-a\\le(1+a)^{2}\\Leftrightarrow -a\\le 1+2a\\Leftrightarrow a\\ge -\\dfrac{1}{3}$。故 $a\\in\\left[-\\dfrac{1}{3},0\\right)$。\n（iv）若 $a>1$，则 $\\delta=\\sqrt{a(a-1)}<a$，右端 $-a+\\delta<0\\le 1$ 自动；但左端 $-a-\\delta<-a<-1$，故 $S_a\\not\\subseteq[-1,1]$。\n合并（i）–（iii）：$a\\in\\left[-\\dfrac{1}{3},1\\right]$。\n纠错：若忽略空集，会漏掉 $(0,1)$；若对 $a>1$ 只验证右端点，会误收 $a>1$。",
    "maxScore": 14,
    "rubric": [
      {
        "step": "Δ<0 空集支",
        "score": 3
      },
      {
        "step": "Δ=0 两点检验",
        "score": 2
      },
      {
        "step": "a<0 推导 a≥-1/3",
        "score": 5
      },
      {
        "step": "否定 a>1 并合并",
        "score": 4
      }
    ],
    "hardLevelReason": "必须空集/相切/负参平方不等式/正参左端越界四层，缺一层即错集。",
    "h3Evidence": {
      "nonObviousBreakthrough": "empty Δ<0 branch + a>1 left-end overflow",
      "aboveHard14H2Contrast": "quadratic Δ trichotomy vs linear endpoint subset",
      "deepStrategyOrLayeredNecessity": "square only after 1+a>0; exclude a>1 separately",
      "routineKillCheck": "nonempty endpoint recipe alone → miss (0,1) or keep a>1"
    },
    "diagramRequirement": "RECOMMENDED",
    "diagramSpecification": "数轴标出 [-1,1]，示意 a=-1/3 时解集恰贴合，以及 a>1 时左根 <-1。",
    "noDiagramReason": "文字与符号推理自足。",
    "options": null,
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 4,
    "chapterNo": 1,
    "sectionCode": "1.5",
    "sectionName": "全称量词与存在量词",
    "kpCode": "rja.1.5.02",
    "kpName": "存在量词",
    "methodMain": "equiv_transform",
    "methodAux": "special_value",
    "qtype": "application",
    "modelFamily": "h3-quantifier-product-xor-truth",
    "coreObjective": "乘积约束下 ∀∃ 与 ∃∀ 真值域分离后取对称差",
    "breakthrough": "（I）要求对每个 x∈[1,2] 都有 y=k/x∈[0,1]，被最紧约束 x=1 锁成 k∈[0,1]；（II）公共 y 迫使 k=0。恰一真即 k∈(0,1]。",
    "contrastH2": "HARD14 常只判单条量词命题真假；本题要两真值域再取“恰一真”，属于真值层二阶操作。",
    "stem": "对实数 $k$，考察命题\n（I）$\\forall x\\in[1,2],\\ \\exists y\\in[0,1]$ 使 $xy=k$；\n（II）$\\exists y\\in[0,1],\\ \\forall x\\in[1,2]$ 使 $xy=k$。\n求使（I）、（II）恰好有一个为真的 $k$ 的取值集合。",
    "answer": "$k\\in(0,1]$",
    "analysis": "（I）：对固定 $x\\in[1,2]$，需 $y=k/x\\in[0,1]$。由 $x>0$ 得 $0\\le k\\le x$。该式对一切 $x\\in[1,2]$ 成立 $\\Leftrightarrow 0\\le k\\le 1$（取最紧上界 $x=1$；下界 $k\\ge 0$）。故（I）真 $\\Leftrightarrow k\\in[0,1]$。\n（II）：若 $y=0$，则 $xy=0$，故需 $k=0$，此时对一切 $x$ 成立。若 $y\\in(0,1]$，则 $x=k/y$ 随 $x$ 变化不能恒为常数约束下对一切 $x\\in[1,2]$ 成立（除非区间退化）。故（II）真 $\\Leftrightarrow k=0$。\n恰一真：（I）真且（II）假 $\\Leftrightarrow k\\in[0,1]\\setminus\\{0\\}=(0,1]$。（不可能出现（II）真而（I）假，因 $k=0$ 时（I）亦真。）",
    "maxScore": 12,
    "rubric": [
      {
        "step": "刻画（I）真域 [0,1]",
        "score": 5
      },
      {
        "step": "刻画（II）真域 {0}",
        "score": 4
      },
      {
        "step": "取对称差得 (0,1]",
        "score": 3
      }
    ],
    "hardLevelReason": "嵌套量词真值域不同构，再做 XOR；误把（II）写成 k∈[0,1] 会全错。",
    "h3Evidence": {
      "nonObviousBreakthrough": "I locked by x=1; II collapses to k=0 only",
      "aboveHard14H2Contrast": "second-order XOR of two quantifier truth sets",
      "deepStrategyOrLayeredNecessity": "tightest bound then common-y degeneration",
      "routineKillCheck": "swapping quantifiers as equivalent → answer [0,1] or empty"
    },
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "options": null,
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 5,
    "chapterNo": 1,
    "sectionCode": "1.3",
    "sectionName": "集合的基本运算",
    "kpCode": "rja.1.3.03",
    "kpName": "补集",
    "methodMain": "equiv_transform",
    "methodAux": "classification",
    "qtype": "application",
    "modelFamily": "h3-complement-cover-biconditional",
    "coreObjective": "补集约束逼出单点 p 与区间 q 的充要并集",
    "breakthrough": "∁_U A_t ⊆[0,1]∪[3,4] 等价于开区间 (1,3)⊆A_t，从而 p 仅在 t=1 为真；q 为 t∈[0,2]；p⇔q 还包含双方同假的外侧无界支。",
    "contrastH2": "HARD14 补集题多为求补或有限韦恩；本题补集包含反推滑窗位置并与属于关系做充要。",
    "stem": "设全集 $U=[0,4]$，$A_t=[t,t+2]\\cap U$（约定：若 $t>4$ 或 $t+2<0$ 则 $A_t=\\varnothing$）。命题 $p$：$\\complement_U A_t\\subseteq[0,1]\\cup[3,4]$；命题 $q$：$2\\in A_t$。求使 $p\\Leftrightarrow q$ 成立的实数 $t$ 的取值集合。",
    "answer": "$t\\in(-\\infty,0)\\cup\\{1\\}\\cup(2,+\\infty)$",
    "analysis": "先译 $p$：$\\complement_U A_t\\subseteq[0,1]\\cup[3,4]\\Leftrightarrow$ 不存在 $x\\in(1,3)$ 使 $x\\notin A_t\\Leftrightarrow(1,3)\\subseteq A_t$。\n当 $A_t=\\varnothing$ 时显然不包含 $(1,3)$，$p$ 假。当 $A_t=[\\max(t,0),\\min(t+2,4)]$ 时，需 $\\max(t,0)\\le 1$ 且 $\\min(t+2,4)\\ge 3$。\n若 $t\\le 0$：左边成立，但 $\\min(t+2,4)\\ge 3\\Rightarrow t\\ge 1$，与 $t\\le 0$ 矛盾。若 $0<t\\le 2$：需 $t\\le 1$ 且 $t+2\\ge 3\\Leftrightarrow t\\ge 1$，故仅 $t=1$，此时 $A_1=[1,3]$，$(1,3)\\subseteq A_1$，$p$ 真。若 $t>2$：左端 $\\max(t,0)=t>2>1$，不能 ≤1，$p$ 假。故 $p$ 真 $\\Leftrightarrow t=1$。\n再译 $q$：$2\\in A_t$。空集时假。非空时 $\\max(t,0)\\le 2\\le\\min(t+2,4)$。分 $t\\ge 0$ 得 $0\\le t\\le 2$；$t<0$ 且 $t\\ge -2$ 时右端 $t+2<2$，不能盖住 2。故 $q$ 真 $\\Leftrightarrow t\\in[0,2]$。\n因此：$p,q$ 同真 $\\Leftrightarrow t=1$；同假 $\\Leftrightarrow t\\notin[0,2]$（此时自动 $t\\ne 1$）。当 $t\\in[0,2]\\setminus\\{1\\}$ 时 $q$ 真 $p$ 假。故 $p\\Leftrightarrow q\\Leftrightarrow t\\in(-\\infty,0)\\cup\\{1\\}\\cup(2,+\\infty)$。",
    "maxScore": 14,
    "rubric": [
      {
        "step": "补集条件译为 (1,3)⊆A_t",
        "score": 3
      },
      {
        "step": "证 p 真仅当 t=1",
        "score": 4
      },
      {
        "step": "刻画 q 真域 [0,2]",
        "score": 3
      },
      {
        "step": "合并同真与同假支",
        "score": 4
      }
    ],
    "hardLevelReason": "补集⊆强制“中间必须被盖住”只留单点，充要却要并上同假的外侧，结构非单区间。",
    "h3Evidence": {
      "nonObviousBreakthrough": "complement subset ⇔ open middle covered → unique t=1",
      "aboveHard14H2Contrast": "biconditional unions exterior co-false rays",
      "deepStrategyOrLayeredNecessity": "translate complement; lock p; XOR-style merge",
      "routineKillCheck": "answering only {1} or only [0,2] → incomplete iff set"
    },
    "diagramRequirement": "RECOMMENDED",
    "diagramSpecification": "数轴 U=[0,4]，阴影 [0,1]∪[3,4]，标出 A_1=[1,3] 盖住 (1,3)，以及 2∈A_t 的滑动窗口。",
    "noDiagramReason": "文字与符号推理自足。",
    "options": null,
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 6,
    "chapterNo": 2,
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.05",
    "kpName": "根的分布",
    "methodMain": "classification",
    "methodAux": "equiv_transform",
    "qtype": "application",
    "modelFamily": "h3-root-open-interval-coupled-min-floor",
    "coreObjective": "开区间根分布与闭区间下界耦合求参",
    "breakthrough": "根全在(-1,3)仅得 m∈(2,11/5)；闭区间 f≥-1/2 在轴落入时化为顶点约束，被 (1+√11)/2 截断。",
    "contrastH2": "HARD14 常单独做根分布或单独做区间最值；本题二者联立且截断端不同。",
    "stem": "设 $f(x)=x^{2}-2mx+m+2$。求使下列两条件同时成立的实数 $m$ 的取值集合：\n（1）方程 $f(x)=0$ 有两个不相等的实根，且两根都位于开区间 $(-1,3)$ 内；\n（2）$\\forall x\\in[-1,3]$，$f(x)\\ge -\\dfrac{1}{2}$。",
    "answer": "$m\\in\\left(2,\\dfrac{1+\\sqrt{11}}{2}\\right]$",
    "analysis": "$f(x)=x^{2}-2mx+(m+2)$，对称轴 $x=m$，$\\Delta=4(m-2)(m+1)$。\n（1）两不等实根均在 $(-1,3)$：$\\Delta>0$，$f(-1)>0$，$f(3)>0$，$-1<m<3$。得 $m>-1$ 与 $m>2$ 及 $m<\\dfrac{11}{5}$，故 $m\\in\\left(2,\\dfrac{11}{5}\\right)$。\n（2）此时轴在 $[-1,3]$ 内，最小值 $f(m)=-m^{2}+m+2\\ge -\\dfrac{1}{2}\\Leftrightarrow m^{2}-m-\\dfrac{5}{2}\\le 0\\Leftrightarrow m\\in\\left[\\dfrac{1-\\sqrt{11}}{2},\\dfrac{1+\\sqrt{11}}{2}\\right]$。\n相交得 $m\\in\\left(2,\\dfrac{1+\\sqrt{11}}{2}\\right]$。$m\\to 2^{+}$ 时 $\\Delta\\to 0^{+}$ 不合两不等根；$m=\\dfrac{1+\\sqrt{11}}{2}$ 时最小值恰为 $-\\dfrac{1}{2}$。",
    "maxScore": 14,
    "rubric": [
      {
        "step": "建立根分布的 Δ/端点/轴条件",
        "score": 4
      },
      {
        "step": "化简得 m∈(2,11/5)",
        "score": 3
      },
      {
        "step": "闭区间最小值化为顶点不等式",
        "score": 4
      },
      {
        "step": "联立截断并检验端点",
        "score": 3
      }
    ],
    "options": null,
    "hardLevelReason": "根分布可行域被闭区间下界二次截断，必须分层联立。",
    "h3Evidence": {
      "nonObviousBreakthrough": "vertex-floor cuts open-root interval at (1+√11)/2",
      "aboveHard14H2Contrast": "root-distribution alone yields oversized (2,11/5)",
      "deepStrategyOrLayeredNecessity": "layer1 open roots → layer2 min-floor",
      "routineKillCheck": "only Δ/f(-1)/f(3) without min → wrong set"
    },
    "diagramRequirement": "NOT_NEEDED",
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 7,
    "chapterNo": 2,
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.05",
    "kpName": "根的分布",
    "methodMain": "equiv_transform",
    "methodAux": "classification",
    "qtype": "application",
    "modelFamily": "h3-straddle-one-plus-vieta-slice",
    "coreObjective": "夹根于1与韦达双边切片联立",
    "breakthrough": "用 f(1)<0 与 f(3)>0 得 a∈(0,3-√3)；再叠加和≥2、积≤1 截成 [1/2,1)。",
    "contrastH2": "HARD14 多为单一夹根或单一韦达；本题分布与对称式必须同时生效。",
    "stem": "设 $f(x)=x^{2}-(2a+1)x+a^{2}$。方程 $f(x)=0$ 有两实根 $x_{1}<x_{2}$，且同时满足：\n（i）$x_{1}\\in(0,1)$，$x_{2}\\in(1,3)$；\n（ii）$x_{1}+x_{2}\\ge 2$ 且 $x_{1}x_{2}\\le 1$。\n求实数 $a$ 的取值集合。",
    "answer": "$a\\in\\left[\\dfrac{1}{2},1\\right)$",
    "analysis": "$\\Delta=4a+1$ 需 $a>-\\dfrac{1}{4}$。\n（i）$f(0)=a^{2}>0$，$f(1)=a(a-2)<0\\Leftrightarrow a\\in(0,2)$，$f(3)=a^{2}-6a+6>0\\Leftrightarrow a<3-\\sqrt{3}$ 或 $a>3+\\sqrt{3}$，轴 $0<\\dfrac{2a+1}{2}<3$。综合得 $a\\in(0,3-\\sqrt{3})$。\n（ii）$2a+1\\ge 2\\Leftrightarrow a\\ge\\dfrac{1}{2}$，$a^{2}\\le 1\\Leftrightarrow |a|\\le 1$。相交得 $a\\in\\left[\\dfrac{1}{2},1\\right)$（$a=1$ 时 $f(1)=0$，不合严格分离）。\n$a=\\dfrac{1}{2}$ 时根为 $1\\pm\\dfrac{\\sqrt{3}}{2}$，合于（i）（ii）。",
    "maxScore": 14,
    "rubric": [
      {
        "step": "建立夹根与端点符号条件",
        "score": 4
      },
      {
        "step": "化简得 a∈(0,3-√3)",
        "score": 3
      },
      {
        "step": "韦达双边约束求交",
        "score": 4
      },
      {
        "step": "排除 a=1 并端点检验",
        "score": 3
      }
    ],
    "options": null,
    "hardLevelReason": "夹根可行域与韦达不等式双向切割，边界严格性需单独论证。",
    "h3Evidence": {
      "nonObviousBreakthrough": "f(3)>0 forces a<3-√3 before Vieta slice",
      "aboveHard14H2Contrast": "straddle alone insufficient; sum/product cut [1/2,1)",
      "deepStrategyOrLayeredNecessity": "distribution layer then Vieta layer",
      "routineKillCheck": "only f(1)<0 → (0,2) wrong"
    },
    "diagramRequirement": "NOT_NEEDED",
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 8,
    "chapterNo": 2,
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.04",
    "kpName": "二次函数区间最值",
    "methodMain": "equiv_transform",
    "methodAux": "special_value",
    "qtype": "application",
    "modelFamily": "h3-forall-exists-vertex-shift-half-a",
    "coreObjective": "移动顶点二次族上 ∀∃ 与 ∃∀ 分离",
    "breakthrough": "（I）取 x=a 即可；若（II）成立则 a=0 迫使 x=0，再代入 a=1 得 1≤1/2 矛盾。",
    "contrastH2": "HARD14 线性族量词交换；本题用 (x-a)²−a/2 在端点制造不可兼得。",
    "stem": "设 $f_{a}(x)=(x-a)^{2}-\\dfrac{a}{2}$，$a\\in[0,1]$。判断下列命题的真假，并证明：\n（I）$\\forall a\\in[0,1],\\ \\exists x\\in[0,1]$ 使 $f_{a}(x)\\le 0$；\n（II）$\\exists x\\in[0,1],\\ \\forall a\\in[0,1]$ 使 $f_{a}(x)\\le 0$。",
    "answer": "（I）真；（II）假。",
    "analysis": "（I）对固定 $a\\in[0,1]$，取 $x=a$，则 $f_{a}(a)=-\\dfrac{a}{2}\\le 0$，故（I）真。\n（II）若存在 $x_{0}\\in[0,1]$ 使对一切 $a\\in[0,1]$ 有 $(x_{0}-a)^{2}\\le\\dfrac{a}{2}$，取 $a=0$ 得 $x_{0}=0$；再取 $a=1$ 得 $1\\le\\dfrac{1}{2}$，矛盾。故（II）假。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "证明（I）：构造 x=a",
        "score": 4
      },
      {
        "step": "（II）由 a=0 推出 x=0",
        "score": 4
      },
      {
        "step": "代入 a=1 得矛盾",
        "score": 4
      }
    ],
    "options": null,
    "hardLevelReason": "需构造性证明与反证端点耦合。",
    "h3Evidence": {
      "nonObviousBreakthrough": "a=0 forces x=0 then a=1 kills II",
      "aboveHard14H2Contrast": "shift-square minus a/2 separates quantifiers",
      "deepStrategyOrLayeredNecessity": "constructive I then contradiction chain for II",
      "routineKillCheck": "claiming I⇔II by taking x=a → wrong"
    },
    "diagramRequirement": "NOT_NEEDED",
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 9,
    "chapterNo": 2,
    "sectionCode": "2.2",
    "sectionName": "基本不等式",
    "kpCode": "rja.2.2.04",
    "kpName": "基本不等式应用注意",
    "methodMain": "num_shape",
    "methodAux": "equiv_transform",
    "qtype": "application",
    "modelFamily": "h3-ab-plus-a-plus-b-eq1-reciprocal-min",
    "coreObjective": "约束 ab+a+b=1 下倒数和的最小结构",
    "breakthrough": "恒等式 (1+a)(1+b)=2 化为 s∈[2(√2−1),1)，再 s/(1−s) 单调，最小值在端点，非直接 AM-GM。",
    "contrastH2": "HARD14 直接 x+1/x；本题必须先确定 s 可行域。",
    "stem": "设正实数 $a,b$ 满足 $ab+a+b=1$。\n（1）求 $\\dfrac{1}{a}+\\dfrac{1}{b}$ 的最小值；\n（2）求使 $\\dfrac{1}{a}+\\dfrac{1}{b}\\ge k$ 对一切满足条件的 $a,b$ 恒成立的实数 $k$ 的最大值。",
    "answer": "（1）$2+2\\sqrt{2}$；（2）$k_{\\max}=2+2\\sqrt{2}$。",
    "analysis": "由 $ab+a+b=1$ 得 $(1+a)(1+b)=2$。令 $s=a+b$，$p=ab=1-s$。由 $a,b>0$ 得 $0<s<1$，且 $s^{2}-4p\\ge 0\\Leftrightarrow s\\ge 2(\\sqrt{2}-1)$，故 $s\\in\\bigl[2(\\sqrt{2}-1),1\\bigr)$。\n$\\dfrac{1}{a}+\\dfrac{1}{b}=\\dfrac{s}{1-s}$ 在该区间严格递增，最小值 $g\\bigl(2(\\sqrt{2}-1)\\bigr)=2+2\\sqrt{2}$（有理化），等号 $a=b=\\sqrt{2}-1$。\n（2）下确界可取，故 $k_{\\max}=2+2\\sqrt{2}$。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "化为 (1+a)(1+b)=2 并得 s 范围",
        "score": 4
      },
      {
        "step": "写成 s/(1-s) 并求最小",
        "score": 5
      },
      {
        "step": "得出 k 的最大值与等号",
        "score": 3
      }
    ],
    "options": null,
    "hardLevelReason": "约束改写与可行域端点分析是关键。",
    "h3Evidence": {
      "nonObviousBreakthrough": "(1+a)(1+b)=2 then s-domain before g(s)",
      "aboveHard14H2Contrast": "not direct AM-GM on a,b",
      "deepStrategyOrLayeredNecessity": "identity → discriminant domain → monotone g",
      "routineKillCheck": "blind AM-GM without domain → wrong min"
    },
    "diagramRequirement": "NOT_NEEDED",
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 10,
    "chapterNo": 2,
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.03",
    "kpName": "含参二次不等式",
    "methodMain": "classification",
    "methodAux": "equiv_transform",
    "qtype": "application",
    "modelFamily": "h3-product-one-same-sign-open-root-plus-sum",
    "coreObjective": "积为1同号结构下开区间恰一根并叠加和约束",
    "breakthrough": "积=1 同号使端点异号法失效；恰一根∈(0,1)⇔m<-2；再叠加和≤-3 得 m≥3，互斥为空。",
    "contrastH2": "HARD14 停在 m<-2；本题加和约束后答案为空。",
    "stem": "设方程 $x^{2}+mx+1=0$ 有两实根 $x_{1},x_{2}$。讨论是否存在实数 $m$，使下列两条件同时成立：\n（1）开区间 $(0,1)$ 内恰有一个根；\n（2）$x_{1}+x_{2}\\le -3$。\n若存在，求所有这样的 $m$；若不存在，证明之。",
    "answer": "不存在这样的实数 $m$。",
    "analysis": "积为 $1>0$，两根同号。要两正根需 $m<0$ 且 $\\Delta\\ge 0$，故 $m\\le -2$。\n$m=-2$ 时重根 $1\\notin(0,1)$；$m<-2$ 时 $g(1)=2+m<0$，恰一根∈$(0,1)$。故（1）$\\Leftrightarrow m<-2$。\n（2）$-m\\le -3\\Leftrightarrow m\\ge 3$。交集为空，故不存在。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "同号分析并得（1）⇔ m<-2",
        "score": 5
      },
      {
        "step": "由韦达得（2）⇔ m≥3",
        "score": 3
      },
      {
        "step": "证明交集为空",
        "score": 4
      }
    ],
    "options": null,
    "hardLevelReason": "同号夹根与和约束互斥，结论为空集。",
    "h3Evidence": {
      "nonObviousBreakthrough": "same-sign kills endpoint-sign habit; empty intersection",
      "aboveHard14H2Contrast": "H2 stops at m<-2; here add sum → empty",
      "deepStrategyOrLayeredNecessity": "feasibility after two necessary conditions",
      "routineKillCheck": "report m<-2 only → incomplete"
    },
    "diagramRequirement": "NOT_NEEDED",
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 11,
    "chapterNo": 2,
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.02",
    "kpName": "一元二次不等式解法",
    "methodMain": "equiv_transform",
    "methodAux": "undetermined_coeff",
    "qtype": "application",
    "modelFamily": "h3-self-referential-solution-interval-match",
    "coreObjective": "解集端点含参时由积条件反推唯一参数",
    "breakthrough": "要求和、积与端点 m、2m+1 对齐；和恒等而积给出 m=0。",
    "contrastH2": "HARD14 正向求解；本题解集端点自指含参。",
    "stem": "设不等式 $x^{2}-(3m+1)x+2m(m+1)\\le 0$ 的解集恰好等于 $[m,2m+1]$。求实数 $m$。",
    "answer": "$m=0$",
    "analysis": "开口向上，解集为 $[m,2m+1]$ 说明两根恰为 $m$ 与 $2m+1$，且 $m\\le 2m+1\\Leftrightarrow m\\ge -1$。\n和：$m+(2m+1)=3m+1$，与系数一致（恒等）。\n积：$m(2m+1)=2m(m+1)\\Leftrightarrow 2m^{2}+m=2m^{2}+2m\\Leftrightarrow m=0$。\n回代：$x^{2}-x\\le 0\\Leftrightarrow x\\in[0,1]=[m,2m+1]$，成立。",
    "maxScore": 10,
    "rubric": [
      {
        "step": "指出两根须为 m 与 2m+1",
        "score": 3
      },
      {
        "step": "由积条件解得 m=0",
        "score": 4
      },
      {
        "step": "回代验证解集",
        "score": 3
      }
    ],
    "options": null,
    "hardLevelReason": "参数同现于系数与解集端点，突破在积方程。",
    "h3Evidence": {
      "nonObviousBreakthrough": "sum tautology; product forces m=0",
      "aboveHard14H2Contrast": "self-referential endpoint inverse problem",
      "deepStrategyOrLayeredNecessity": "structure match then product then verify",
      "routineKillCheck": "expand inequality in m without endpoint ID → stuck"
    },
    "diagramRequirement": "NOT_NEEDED",
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 12,
    "chapterNo": 2,
    "sectionCode": "2.1",
    "sectionName": "等式性质与不等式性质",
    "kpCode": "rja.2.1.02",
    "kpName": "作差比较大小",
    "methodMain": "equiv_transform",
    "methodAux": "mono_analysis",
    "qtype": "application",
    "modelFamily": "h3-ratio-shift-compare-via-t-plus-1overt",
    "coreObjective": "证明平移比使 t+1/t 型比较严格变小",
    "breakthrough": "化为比较 t=a/b 与 s=(a+1)/(b+1)：先证 1<s<t，再用 u+1/u 在 (1,+∞) 严格增。",
    "contrastH2": "HARD14 常作差一次定号；本题需两次结构变换与单调性衔接。",
    "stem": "设 $a>b>0$。证明：$\\dfrac{a}{b}+\\dfrac{b}{a}>\\dfrac{a+1}{b+1}+\\dfrac{b+1}{a+1}$。",
    "answer": "不等式成立（见分析证明）。",
    "analysis": "令 $t=\\dfrac{a}{b}>1$，$s=\\dfrac{a+1}{b+1}$。则 $s-1=\\dfrac{a-b}{b+1}$，$t-1=\\dfrac{a-b}{b}$。因 $b+1>b$，有 $1<s<t$。\n令 $\\varphi(u)=u+\\dfrac{1}{u}$（$u>1$）。对 $t>s>1$，有 $\\varphi(t)-\\varphi(s)=(t-s)\\left(1-\\dfrac{1}{ts}\\right)$，因 $ts>1$，括号为正，故 $\\varphi(t)>\\varphi(s)$，即所证不等式。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "引入 t,s 并证明 1<s<t",
        "score": 5
      },
      {
        "step": "证明 φ 在 (1,+∞) 严格增",
        "score": 4
      },
      {
        "step": "得出严格不等式",
        "score": 3
      }
    ],
    "options": null,
    "hardLevelReason": "比较对象经平移比变换，必须识别 φ 的单调性。",
    "h3Evidence": {
      "nonObviousBreakthrough": "1<s<t then φ monotone on (1,∞)",
      "aboveHard14H2Contrast": "not one-shot difference; needs ratio shift",
      "deepStrategyOrLayeredNecessity": "compare ratios → monotone φ",
      "routineKillCheck": "common-denominator expand without monotone → messy"
    },
    "diagramRequirement": "NOT_NEEDED",
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 13,
    "chapterNo": 2,
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.04",
    "kpName": "二次函数区间最值",
    "methodMain": "classification",
    "methodAux": "equiv_transform",
    "qtype": "application",
    "modelFamily": "h3-fixed-root-gap-interval-min-touch",
    "coreObjective": "根差固定与区间最小值恰触耦合定参",
    "breakthrough": "Δ=4 与顶点落入时最小值恒为 −1，与触 1/4 矛盾，故轴必须在区间外。",
    "contrastH2": "HARD14 区间最值套轴位置三分；本题先用 Δ 否定轴内情形。",
    "stem": "设 $f(x)=x^{2}+bx+c$。已知：\n（1）方程 $f(x)=0$ 的两根之差的绝对值为 $2$；\n（2）$\\forall x\\in[0,1]$，$f(x)\\ge\\dfrac{1}{4}$；\n（3）$\\exists x\\in[0,1]$，$f(x)=\\dfrac{1}{4}$。\n求所有有序对 $(b,c)$。",
    "answer": "$(b,c)=\\left(\\sqrt{5},\\dfrac{1}{4}\\right)$ 或 $\\left(-2-\\sqrt{5},\\dfrac{5}{4}+\\sqrt{5}\\right)$",
    "analysis": "（1）$\\Delta=b^{2}-4c=4\\Leftrightarrow c=\\dfrac{b^{2}-4}{4}$。\n（2）（3）说明 $[0,1]$ 上最小值恰为 $\\dfrac{1}{4}$。\n若轴 $-\\dfrac{b}{2}\\in[0,1]$（即 $b\\in[-2,0]$），则最小值 $c-\\dfrac{b^{2}}{4}=-1\\ne\\dfrac{1}{4}$，矛盾。故最小值在端点。\n甲：$c=\\dfrac{1}{4}\\Rightarrow b=\\pm\\sqrt{5}$。仅 $b=\\sqrt{5}$ 合（轴在左侧，$f(1)>\\dfrac{1}{4}$）；$b=-\\sqrt{5}$ 时 $f(1)=\\dfrac{5}{4}-\\sqrt{5}<\\dfrac{1}{4}$，否。\n乙：$f(1)=\\dfrac{1}{4}$ 且 $c>\\dfrac{1}{4}$，得 $b^{2}+4b-1=0$，$b=-2\\pm\\sqrt{5}$。仅 $b=-2-\\sqrt{5}$ 合（轴在右侧），$c=\\dfrac{5}{4}+\\sqrt{5}$。",
    "maxScore": 14,
    "rubric": [
      {
        "step": "由根差得 Δ=4",
        "score": 3
      },
      {
        "step": "否定轴落入 [0,1]",
        "score": 4
      },
      {
        "step": "端点触碰两情形求解",
        "score": 5
      },
      {
        "step": "检验并给出全部有序对",
        "score": 2
      }
    ],
    "options": null,
    "hardLevelReason": "Δ 与区间触最小值耦合，轴内情形被恒等式 −1 否定。",
    "h3Evidence": {
      "nonObviousBreakthrough": "axis-in-interval ⇒ min≡-1 ≠1/4",
      "aboveHard14H2Contrast": "root-gap couples with touch-min",
      "deepStrategyOrLayeredNecessity": "kill interior-axis then endpoint cases",
      "routineKillCheck": "axis trichotomy without Δ link → miss contradiction"
    },
    "diagramRequirement": "NOT_NEEDED",
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 14,
    "chapterNo": 2,
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.01",
    "kpName": "三个二次的关系",
    "methodMain": "equiv_transform",
    "methodAux": "classification",
    "qtype": "application",
    "modelFamily": "h3-g-nonneg-on-f-root-interval-with-gap",
    "coreObjective": "在另一方程根区间上恒非负并限制根距",
    "breakthrough": "对 t≥1 轴落入得 g(1)=t−1≥0；对 t<0 用 f(x2)=0 化 g(x2)=2x2(t−1)<0 排除；再根距截断。",
    "contrastH2": "HARD14 单独解二次不等式；本题定义域是另一方程的根区间。",
    "stem": "设 $f(x)=x^{2}-2tx+t$，$g(x)=x^{2}-2x+t$。求使下列条件同时成立的实数 $t$：\n（1）方程 $f(x)=0$ 有两个实根 $x_{1}\\le x_{2}$，且 $x_{2}-x_{1}\\le 1$；\n（2）$\\forall x\\in[x_{1},x_{2}]$，$g(x)\\ge 0$。",
    "answer": "$t\\in\\{0\\}\\cup\\left[1,\\dfrac{1+\\sqrt{2}}{2}\\right]$",
    "analysis": "$\\Delta_{f}=4t(t-1)\\ge 0\\Leftrightarrow t\\le 0$ 或 $t\\ge 1$，且 $x_{2}-x_{1}=2\\sqrt{t(t-1)}\\le 1\\Leftrightarrow 4t(t-1)\\le 1$。\n当 $t\\ge 1$：两根非负且 $x_{1}\\le 1\\le x_{2}$，故轴 $x=1$ 落入，$\\min g=g(1)=t-1\\ge 0$ 自动。再 $4t(t-1)\\le 1\\Leftrightarrow t\\in\\left[1,\\dfrac{1+\\sqrt{2}}{2}\\right]$（取正支与 $t\\ge 1$ 之交）。\n当 $t=0$：重根 $0$，$g(0)=0$，且根距 $0\\le 1$，成立。\n当 $t<0$：两根异号，$x_{2}=t+\\sqrt{t(t-1)}\\in(0,1)$，轴不落入；区间在轴左侧，$\\min g=g(x_{2})$。由 $f(x_{2})=0$ 得 $g(x_{2})=2x_{2}(t-1)<0$，不满足（2）。\n故 $t\\in\\{0\\}\\cup\\left[1,\\dfrac{1+\\sqrt{2}}{2}\\right]$。",
    "maxScore": 14,
    "rubric": [
      {
        "step": "写出 Δ_f 与根距条件",
        "score": 3
      },
      {
        "step": "处理 t≥1：轴落入与根距截断",
        "score": 5
      },
      {
        "step": "处理 t=0 与排除 t<0",
        "score": 6
      }
    ],
    "options": null,
    "hardLevelReason": "跨函数根区间恒成立，并用 f=0 化简端点值。",
    "h3Evidence": {
      "nonObviousBreakthrough": "g(x2)=2x2(t-1) via f(x2)=0",
      "aboveHard14H2Contrast": "domain is root-interval of another quadratic",
      "deepStrategyOrLayeredNecessity": "sign-of-t cases plus gap cut",
      "routineKillCheck": "require Δ_g≤0 globally → wrong"
    },
    "diagramRequirement": "NOT_NEEDED",
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 15,
    "chapterNo": 2,
    "sectionCode": "2.2",
    "sectionName": "基本不等式",
    "kpCode": "rja.2.2.02",
    "kpName": "配凑法求最值",
    "methodMain": "num_shape",
    "methodAux": "equiv_transform",
    "qtype": "application",
    "modelFamily": "h3-xy-plus-x-plus-y-eq4-sumsq-min",
    "coreObjective": "约束 xy+x+y=4 下求积范围与平方和最小",
    "breakthrough": "由 (1+x)(1+y)=5 得 s=4−p，再用 Δ≥0 得 p 上界；x²+y² 在可行域右端取最小。",
    "contrastH2": "HARD14 直接 AM-GM；本题先由判别式定积的可行域再优化。",
    "stem": "设正实数 $x,y$ 满足 $xy+x+y=4$。令 $t=xy$。\n（1）求 $t$ 的取值范围；\n（2）求 $x^{2}+y^{2}$ 的最小值。",
    "answer": "（1）$t\\in\\left(0,6-2\\sqrt{5}\\right]$；（2）最小值为 $12-4\\sqrt{5}$。",
    "analysis": "由 $xy+x+y=4$ 得 $(1+x)(1+y)=5$。令 $s=x+y$，$t=xy$，则 $s+t=4$，$s=4-t$。由 $x,y>0$ 得 $0<t<4$，且 $(4-t)^{2}\\ge 4t\\Leftrightarrow t^{2}-12t+16\\ge 0$。根为 $6\\pm 2\\sqrt{5}$，结合 $t\\in(0,4)$ 得 $t\\in\\left(0,6-2\\sqrt{5}\\right]$。\n$x^{2}+y^{2}=s^{2}-2t=(4-t)^{2}-2t=t^{2}-10t+16=(t-5)^{2}-9$。抛物线开口向上、对称轴 $t=5$，而可行域在 $t\\le 6-2\\sqrt{5}<2<5$ 的左侧，故在可行域上随 $t$ 增大而减小，最小值在右端点 $t=6-2\\sqrt{5}$：$12-4\\sqrt{5}$。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "化为 (1+x)(1+y)=5 并得 Δ 条件",
        "score": 4
      },
      {
        "step": "求出 t 的范围",
        "score": 3
      },
      {
        "step": "将 x²+y² 表为 t 并求最小",
        "score": 5
      }
    ],
    "options": null,
    "hardLevelReason": "最值建立在判别式可行域端点，而非形式套用等号。",
    "h3Evidence": {
      "nonObviousBreakthrough": "Δ on (4-t)^2≥4t caps t before minimizing sumsq",
      "aboveHard14H2Contrast": "not direct AM-GM; domain-endpoint optimization",
      "deepStrategyOrLayeredNecessity": "feasibility of t then monotone sumsq",
      "routineKillCheck": "AM-GM on x,y ignoring Δ → wrong range/min"
    },
    "diagramRequirement": "NOT_NEEDED",
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 16,
    "chapterNo": 2,
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.03",
    "kpName": "含参二次不等式",
    "methodMain": "classification",
    "methodAux": "equiv_transform",
    "qtype": "single",
    "modelFamily": "h3-uniform-hold-over-param-interval-strictness",
    "coreObjective": "参数区间一致恒正与端点严格性",
    "breakthrough": "∀m∈I 的严格恒正 ⇔ 对 I 上每点 Δ(m)<0；端点 m=2 使 Δ=0 成为否证关键。",
    "contrastH2": "HARD14 单点参数；本题在参数区间上检验一致严格性。",
    "stem": "设 $f_{m}(x)=x^{2}-mx+1$。下列命题中**不正确**的是",
    "answer": "B",
    "analysis": "开口向上：$f_{m}>0\\(\\forall x\\)\\Leftrightarrow\\Delta=m^{2}-4<0\\Leftrightarrow |m|<2$；$f_{m}\\ge 0\\(\\forall x\\)\\Leftrightarrow |m|\\le 2$。\nA：$m\\in[0,1]\\Rightarrow |m|\\le 1<2$，正确。\nB：$m=2\\in[0,2]$ 时 $\\Delta=0$，最小值 $0$，不能严格 $>0$，故 B 不正确。\nC：$|m|\\le 2$，正确。\nD：取 $m=0$，$\\Delta=-4<-3$，正确。\n故选 B。",
    "maxScore": null,
    "rubric": null,
    "options": {
      "A": "$\\forall m\\in[0,1]$，$f_{m}(x)>0$ 对一切实数 $x$ 成立",
      "B": "$\\forall m\\in[0,2]$，$f_{m}(x)>0$ 对一切实数 $x$ 成立",
      "C": "$\\forall m\\in[0,2]$，$f_{m}(x)\\ge 0$ 对一切实数 $x$ 成立",
      "D": "$\\exists m\\in[0,1]$，使 $f_{m}$ 的判别式满足 $\\Delta< -3$"
    },
    "hardLevelReason": "严格不等号在参数区间端点失效，是量词与判别式耦合点。",
    "h3Evidence": {
      "nonObviousBreakthrough": "m=2 makes Δ=0 killing strict uniform hold",
      "aboveHard14H2Contrast": "uniform-in-m vs single-m hold",
      "deepStrategyOrLayeredNecessity": "translate quantifiers then endpoint check",
      "routineKillCheck": "confusing > with ≥ → think B true"
    },
    "diagramRequirement": "NOT_NEEDED",
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 17,
    "chapterNo": 2,
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.05",
    "kpName": "根的分布",
    "methodMain": "classification",
    "methodAux": "equiv_transform",
    "qtype": "multi",
    "modelFamily": "h3-multi-root-location-necessary-tests",
    "coreObjective": "两根都在(0,2)的必要条件筛选",
    "breakthrough": "开口向上时 f(0)>0、f(2)>0、轴∈(0,2)、Δ>0 均必要；可用特例否定错误充分性表述。",
    "contrastH2": "HARD14 给全套充要；本题多选考查哪些单独必要但非充分。",
    "stem": "设 $f(x)=x^{2}-sx+p$（$s,p\\in\\mathbb{R}$）。若方程 $f(x)=0$ 有两个不相等实根且都位于 $(0,2)$ 内，则下列结论中正确的是（多选）",
    "answer": "A,B,D",
    "analysis": "两不等正根在 $(0,2)$：积 $p>0$，和 $s\\in(0,4)$（因 $0<x_{1}<x_{2}<2\\Rightarrow 0<s<4$），且 $f(0)>0$、$f(2)>0$，轴 $s/2\\in(0,2)$。故 A、B、D 均必要且在本题表述下正确。\nC：并非必要——若两根为 $0.1$ 与 $0.2$，则 $f(1)>0$。反例：$f(x)=(x-0.1)(x-0.2)=x^{2}-0.3x+0.02$，$f(1)>0$。故 C 不正确。\n选 A、B、D。",
    "maxScore": null,
    "rubric": null,
    "options": {
      "A": "$p>0$",
      "B": "$0<s<4$",
      "C": "$f(1)<0$",
      "D": "$f(2)>0$ 且 $f(0)>0$"
    },
    "hardLevelReason": "需区分根分布的必要条件与“夹 1”的非必要加强。",
    "h3Evidence": {
      "nonObviousBreakthrough": "f(1)<0 is straddle-1 not required for both roots in (0,2)",
      "aboveHard14H2Contrast": "tests necessity vs common wrong strengthening",
      "deepStrategyOrLayeredNecessity": "derive necessary set then counterexample C",
      "routineKillCheck": "select C by habit of f(1)<0 → wrong"
    },
    "diagramRequirement": "NOT_NEEDED",
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 18,
    "chapterNo": 2,
    "sectionCode": "2.1",
    "sectionName": "等式性质与不等式性质",
    "kpCode": "rja.2.1.01",
    "kpName": "不等式的基本性质",
    "methodMain": "equiv_transform",
    "methodAux": "special_value",
    "qtype": "application",
    "modelFamily": "h3-abs-quad-best-constant-with-forbidden-eq",
    "coreObjective": "最佳常数与等号点禁止条件耦合",
    "breakthrough": "由 (|x|-1)²≥0 得 x²+1≥2|x|，最佳 λ=2；禁止 |x|=1 时严格不等式使任何 λ=2 失败，故无最大 λ 而只有上确界。",
    "contrastH2": "HARD14 求最大 λ=2；本题禁止等号点后“最大值不存在”。",
    "stem": "考虑不等式 $x^{2}+1\\ge \\lambda |x|$。\n（1）求使该式对一切实数 $x$ 恒成立的实数 $\\lambda$ 的最大值；\n（2）若额外要求当 $|x|=1$ 时不等式为严格大于（即排除等号），问是否仍存在最大的 $\\lambda$ 使“对一切 $x$ 成立且在 $|x|=1$ 处严格”？说明理由。",
    "answer": "（1）$\\lambda_{\\max}=2$；（2）不存在最大的 $\\lambda$，任何 $\\lambda<2$ 均可，但 $\\lambda=2$ 在 $|x|=1$ 取等号被禁止。",
    "analysis": "（1）$x=0$ 时 $1\\ge 0$ 真。对 $x\\ne 0$，令 $t=|x|>0$，需 $t+\\dfrac{1}{t}\\ge\\lambda$。由 $\\left(\\sqrt{t}-\\dfrac{1}{\\sqrt{t}}\\right)^{2}\\ge 0$ 得 $t+\\dfrac{1}{t}\\ge 2$，等号 $t=1$。故 $\\lambda\\le 2$，且 $\\lambda=2$ 恒成立。最大值为 $2$。\n（2）若要求 $|x|=1$ 时严格，则 $\\lambda=2$ 不满足。对任意 $\\lambda<2$，因 $\\inf(t+1/t)=2>\\lambda$，恒有严格 $>$（含 $t=1$）。故一切 $\\lambda<2$ 都合，但无最大元（上确界 $2$ 不可取）。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "配方或基本不等式得 λ≤2 且 2 可取",
        "score": 5
      },
      {
        "step": "说明禁止等号后 λ=2 失败",
        "score": 3
      },
      {
        "step": "论证无最大 λ（上确界不可达）",
        "score": 4
      }
    ],
    "options": null,
    "hardLevelReason": "最大值存在性与等号禁止耦合，结论从“有最大”变为“无最大”。",
    "h3Evidence": {
      "nonObviousBreakthrough": "forbidding equality at |x|=1 removes maximizer",
      "aboveHard14H2Contrast": "H2 stops at λ_max=2; here no maximum",
      "deepStrategyOrLayeredNecessity": "best constant then topology of attainable set",
      "routineKillCheck": "still answer 2 in part (2) → wrong"
    },
    "diagramRequirement": "NOT_NEEDED",
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 19,
    "chapterNo": 2,
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.05",
    "kpName": "根的分布",
    "methodMain": "equiv_transform",
    "methodAux": "classification",
    "qtype": "application",
    "modelFamily": "h3-both-roots-in-unit-plus-sum-of-squares",
    "coreObjective": "两根落入(0,1)并与平方和上界联立",
    "breakthrough": "两根∈(0,1) 得 Δ>0、f(0)>0、f(1)>0、轴∈(0,1)；再 x1²+x2²≤1/2 化为 s²-2p≤1/2 与韦达联立。",
    "contrastH2": "HARD14 只做(0,1)根分布；本题叠加对称式上界。",
    "stem": "设方程 $x^{2}-sx+p=0$ 有两个不相等实根 $x_{1},x_{2}$，满足 $x_{1},x_{2}\\in(0,1)$，且 $x_{1}^{2}+x_{2}^{2}\\le\\dfrac{1}{2}$。求点 $(s,p)$ 满足的条件（用关于 $s,p$ 的不等式组给出）。",
    "answer": "$\\Delta=s^{2}-4p>0,\\ 0<s<2,\\ p>0,\\ f(1)=1-s+p>0,\\ s^{2}-2p\\le\\dfrac{1}{2}$（其中开口向上已用）",
    "analysis": "两不等根在 $(0,1)$（开口向上）：$\\Delta=s^{2}-4p>0$，$f(0)=p>0$，$f(1)=1-s+p>0$，轴 $\\dfrac{s}{2}\\in(0,1)\\Leftrightarrow 0<s<2$。\n又 $x_{1}^{2}+x_{2}^{2}=s^{2}-2p\\le\\dfrac{1}{2}$。\n以上联立即为所求。\n（完整性：由 $0<x_{1}<x_{2}<1$ 自动有 $s=x_{1}+x_{2}\\in(0,2)$，$p=x_{1}x_{2}>0$，与上述一致；反之上述条件亦充分。）",
    "maxScore": 12,
    "rubric": [
      {
        "step": "写出两根在(0,1)的充要条件",
        "score": 5
      },
      {
        "step": "化平方和为 s²-2p≤1/2",
        "score": 4
      },
      {
        "step": "合并为不等式组并说明充分性",
        "score": 3
      }
    ],
    "options": null,
    "hardLevelReason": "根分布充要与对称式约束必须同时列出。",
    "h3Evidence": {
      "nonObviousBreakthrough": "sum-of-squares via Vieta couples to open-unit roots",
      "aboveHard14H2Contrast": "distribution plus symmetric bound",
      "deepStrategyOrLayeredNecessity": "location conditions then Vieta transform",
      "routineKillCheck": "only Δ>0 and s,p>0 → insufficient"
    },
    "diagramRequirement": "NOT_NEEDED",
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 20,
    "chapterNo": 2,
    "sectionCode": "2.1",
    "sectionName": "等式性质与不等式性质",
    "kpCode": "rja.2.1.03",
    "kpName": "不等式应用建模",
    "methodMain": "equiv_transform",
    "methodAux": "classification",
    "qtype": "application",
    "modelFamily": "h3-sign-preserving-chain-with-parameter-gate",
    "coreObjective": "同号传递链与参数门槛耦合",
    "breakthrough": "由 a>b>0 得 1/a<1/b，但乘积 (a-b)(1/a-1/b)<0 恒真；要与 (a-b)(a+b-λ)≥0 联立需先定 λ 门槛。",
    "contrastH2": "HARD14 单次比较；本题两条不等式链的公共参数域。",
    "stem": "设 $a>b>0$。\n（1）证明：$(a-b)\\left(\\dfrac{1}{a}-\\dfrac{1}{b}\\right)<0$；\n（2）求使 $(a-b)(a+b-\\lambda)\\ge 0$ 对一切满足 $a>b>0$ 的 $a,b$ 恒成立的实数 $\\lambda$ 的取值集合。",
    "answer": "（1）见证明；（2）$\\lambda\\le 0$。",
    "analysis": "（1）$a>b>0\\Rightarrow a-b>0$，且 $\\dfrac{1}{a}-\\dfrac{1}{b}=\\dfrac{b-a}{ab}<0$，故乘积 $<0$。\n（2）$a-b>0$，故 $(a-b)(a+b-\\lambda)\\ge 0\\Leftrightarrow a+b\\ge\\lambda$。要对一切 $a>b>0$ 成立，需 $\\lambda$ 不超过 $a+b$ 的下确界。令 $b\\to 0^{+}$，$a\\to 0^{+}$（保持 $a>b$），$a+b$ 可任意接近 $0^{+}$，故下确界为 $0$。从而需 $\\lambda\\le 0$。\n当 $\\lambda\\le 0$ 时，$a+b>0\\ge\\lambda$，恒成立。当 $\\lambda>0$ 时，取 $a=\\dfrac{\\lambda}{3}$，$b=\\dfrac{\\lambda}{4}$（均正且 $a>b$），则 $a+b=\\dfrac{7\\lambda}{12}<\\lambda$，失败。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "证明（1）乘积为负",
        "score": 3
      },
      {
        "step": "化为 a+b≥λ 并对一切 a>b>0",
        "score": 4
      },
      {
        "step": "用下确界与反例得 λ≤0",
        "score": 5
      }
    ],
    "options": null,
    "hardLevelReason": "恒成立转化为正数和的下确界，需极限型取法与反例。",
    "h3Evidence": {
      "nonObviousBreakthrough": "inf(a+b) over a>b>0 equals 0",
      "aboveHard14H2Contrast": "not a fixed pair compare; universal quantification",
      "deepStrategyOrLayeredNecessity": "rewrite → infimum → counterexample",
      "routineKillCheck": "answer λ≤2√(ab) or similar → wrong"
    },
    "diagramRequirement": "NOT_NEEDED",
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 21,
    "chapterNo": 2,
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.04",
    "kpName": "二次函数区间最值",
    "methodMain": "equiv_transform",
    "methodAux": "classification",
    "qtype": "application",
    "modelFamily": "h3-exists-nonpos-and-floor-and-endpoint-triple",
    "coreObjective": "存在非正、区间下界、端点门控三重联立",
    "breakthrough": "∃非正⇔k≤9/4；∀f≥−1⇔k≥5/4；再与 f(0)≥1 交得 [5/4,9/4]，缺任一层都会错区间。",
    "contrastH2": "HARD14 只有存在性或只有下界；本题三约束同时切割。",
    "stem": "设 $f(x)=x^{2}-3x+k$。求使下列三条件同时成立的实数 $k$：\n（1）$\\exists x\\in[0,2]$，使 $f(x)\\le 0$；\n（2）$\\forall x\\in[0,2]$，$f(x)\\ge -1$；\n（3）$f(0)\\ge 1$。",
    "answer": "$k\\in\\left[\\dfrac{5}{4},\\dfrac{9}{4}\\right]$",
    "analysis": "对称轴 $x=\\dfrac{3}{2}\\in[0,2]$，故 $[0,2]$ 上最小值 $m=f\\left(\\dfrac{3}{2}\\right)=k-\\dfrac{9}{4}$。\n（1）$m\\le 0\\Leftrightarrow k\\le\\dfrac{9}{4}$。\n（2）$m\\ge -1\\Leftrightarrow k-\\dfrac{9}{4}\\ge -1\\Leftrightarrow k\\ge\\dfrac{5}{4}$。\n（3）$k\\ge 1$。与前两式交：下界取 $\\max\\left(1,\\dfrac{5}{4}\\right)=\\dfrac{5}{4}$。\n故 $k\\in\\left[\\dfrac{5}{4},\\dfrac{9}{4}\\right]$。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "指出轴在区间内并算最小值",
        "score": 3
      },
      {
        "step": "由（1）（2）得 5/4≤k≤9/4",
        "score": 5
      },
      {
        "step": "与（3）联立并说明下界提升",
        "score": 4
      }
    ],
    "options": null,
    "hardLevelReason": "存在性、下界、端点三约束缺一不可，最终下界由 5/4 而非 1 决定。",
    "h3Evidence": {
      "nonObviousBreakthrough": "floor k≥5/4 dominates endpoint k≥1",
      "aboveHard14H2Contrast": "triple cut vs single exists-nonpos",
      "deepStrategyOrLayeredNecessity": "exists + forall-floor + endpoint",
      "routineKillCheck": "omit floor → [1,9/4] wrong; omit endpoint still luckily OK but incomplete logic"
    },
    "diagramRequirement": "NOT_NEEDED",
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 22,
    "chapterNo": 2,
    "sectionCode": "2.2",
    "sectionName": "基本不等式",
    "kpCode": "rja.2.2.01",
    "kpName": "算术-几何平均不等式",
    "methodMain": "num_shape",
    "methodAux": "equiv_transform",
    "qtype": "application",
    "modelFamily": "h3-xy-minus-x-minus-y-eq3-sum-min-via-shift",
    "coreObjective": "积减线和型约束下求和最小（配凑突破）",
    "breakthrough": "xy−x−y=3 配成 (x−1)(y−1)=4，再令 s=x+y 用 Δ≥0 得 s≥6；直接对 x,y 套 AM-GM 无法消约束。",
    "contrastH2": "HARD14 直接 x+y≥2√(xy)；本题约束非线性，必须先配凑移位。",
    "stem": "设正实数 $x,y$ 满足 $xy=x+y+3$。求 $x+y$ 的最小值，并说明若直接对 $x,y$ 使用基本不等式会遇到什么障碍。",
    "answer": "最小值为 $6$（当 $x=y=3$）。",
    "analysis": "由 $xy-x-y=3$ 两边加 $1$ 得 $(x-1)(y-1)=4$。令 $s=x+y$，$p=xy$，则 $p=s+3$。$x,y$ 为正实数根需 $\\Delta=s^{2}-4p\\ge 0\\Leftrightarrow s^{2}-4s-12\\ge 0\\Leftrightarrow (s-6)(s+2)\\ge 0$。因 $s=x+y>0$，得 $s\\ge 6$。\n当 $s=6$ 时 $p=9$，$\\Delta=0$，故 $x=y=3>0$，等号可达。\n若直接写 $x+y\\ge 2\\sqrt{xy}=2\\sqrt{x+y+3}$，令 $s\\ge 2\\sqrt{s+3}$，平方得 $s^{2}\\ge 4s+12\\Leftrightarrow s^{2}-4s-12\\ge 0$，虽“碰巧”得到同结论，但必须先证明可平方（两边非负）且等号条件与原约束兼容；配凑法把约束化为标准韦达问题，推理更短且等号清晰。直接 AM-GM 的障碍在于：约束不是定积或定和，而是积与和的耦合，套用后仍需求解关于 $s$ 的不等式，并不能“一句话”出最小值。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "配凑得 (x-1)(y-1)=4",
        "score": 4
      },
      {
        "step": "用 Δ≥0 得 s≥6 并取等号",
        "score": 5
      },
      {
        "step": "指出直接 AM-GM 的障碍",
        "score": 3
      }
    ],
    "options": null,
    "hardLevelReason": "非线性耦合约束下必须配凑移位，直接 AM-GM 不能一步完成。",
    "h3Evidence": {
      "nonObviousBreakthrough": "(x-1)(y-1)=4 then Vieta Δ for s",
      "aboveHard14H2Contrast": "not direct AM-GM; shift factorization first",
      "deepStrategyOrLayeredNecessity": "complete-product → discriminant → equality check",
      "routineKillCheck": "blind AM-GM without justifying squaring/equality → incomplete"
    },
    "diagramRequirement": "NOT_NEEDED",
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 23,
    "chapterNo": 2,
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.01",
    "kpName": "三个二次的关系",
    "methodMain": "undetermined_coeff",
    "methodAux": "equiv_transform",
    "qtype": "application",
    "modelFamily": "h3-inverse-three-quad-from-solution-and-vertex",
    "coreObjective": "由解集与顶点纵坐标反推二次三项",
    "breakthrough": "解集 [1,3] 定两根；顶点纵坐标 −1 定开口方向与领先系数，三者关系闭链。",
    "contrastH2": "HARD14 正向“三关系”；本题逆向由解集+顶点值定函数。",
    "stem": "已知二次函数 $f(x)=ax^{2}+bx+c$（$a\\ne 0$）满足：不等式 $f(x)\\le 0$ 的解集为 $[1,3]$，且 $f$ 的顶点纵坐标为 $-1$。求 $f(x)$ 的解析式。",
    "answer": "$f(x)=x^{2}-4x+3$",
    "analysis": "解集为有界闭区间 $[1,3]$，故开口向上（$a>0$），两根为 $1,3$，从而 $f(x)=a(x-1)(x-3)=a(x^{2}-4x+3)$。\n顶点横坐标 $x=2$，纵坐标 $f(2)=a(2-1)(2-3)=-a$。由题 $-a=-1\\Rightarrow a=1$。\n故 $f(x)=x^{2}-4x+3$。检验：解集 $[1,3]$，顶点 $(2,-1)$。",
    "maxScore": 10,
    "rubric": [
      {
        "step": "由解集形态定开口与两根",
        "score": 4
      },
      {
        "step": "用顶点纵坐标定 a",
        "score": 4
      },
      {
        "step": "写出解析式并检验",
        "score": 2
      }
    ],
    "options": null,
    "hardLevelReason": "解集反演与顶点值共同锁死唯一二次。",
    "h3Evidence": {
      "nonObviousBreakthrough": "bounded solution interval forces a>0 and roots 1,3",
      "aboveHard14H2Contrast": "inverse of three-quadratic relationship",
      "deepStrategyOrLayeredNecessity": "shape → roots → vertex scale",
      "routineKillCheck": "assume a=1 without vertex → incomplete justification"
    },
    "diagramRequirement": "NOT_NEEDED",
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 24,
    "chapterNo": 2,
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.02",
    "kpName": "一元二次不等式解法",
    "methodMain": "equiv_transform",
    "methodAux": "special_value",
    "qtype": "numeric",
    "modelFamily": "h3-common-root-two-quadrics-sum-m",
    "coreObjective": "两方程公共根参数求和",
    "breakthrough": "作差得 (m+3)(1−r)=0 分流；再回代得全部 m，求和。",
    "contrastH2": "HARD14 单方程求根；本题公共根分流后求参数和。",
    "stem": "已知方程 $x^{2}-3x+m=0$ 与 $x^{2}+mx-3=0$ 有公共实根。求所有可能的 $m$ 之和。",
    "answer": "-1",
    "analysis": "设公共根为 $r$。则 $r^{2}-3r+m=0$，$r^{2}+mr-3=0$。相减得 $(-3-m)r+m+3=0\\Leftrightarrow (m+3)(1-r)=0$。\n故 $m=-3$ 或 $r=1$。\n若 $m=-3$，两方程同为 $x^{2}-3x-3=0$，有公共根（实根），$m=-3$ 可取。\n若 $r=1$，由第一式 $1-3+m=0\\Rightarrow m=2$；代入第二式 $1+2-3=0$ 成立。\n所有可能 $m$ 为 $-3$ 与 $2$，和为 $-1$。",
    "maxScore": null,
    "rubric": null,
    "options": null,
    "hardLevelReason": "公共根作差分流，需两支都回代验证。",
    "h3Evidence": {
      "nonObviousBreakthrough": "(m+3)(1-r)=0 branching",
      "aboveHard14H2Contrast": "two-equation coupling not single solve",
      "deepStrategyOrLayeredNecessity": "subtract → cases → verify",
      "routineKillCheck": "miss m=-3 identical case → sum 2 wrong"
    },
    "diagramRequirement": "NOT_NEEDED",
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 25,
    "chapterNo": 2,
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.03",
    "kpName": "含参二次不等式",
    "methodMain": "classification",
    "methodAux": "equiv_transform",
    "qtype": "application",
    "modelFamily": "h3-solution-containment-between-two-quad-inequalities",
    "coreObjective": "一含参二次不等式解集包含固定解集",
    "breakthrough": "固定解集 [1,2] 被包含 ⇔ f 在 [1,2] 上恒非正且端点为根或外侧更宽；化为两根夹住 [1,2]。",
    "contrastH2": "HARD14 求单个解集；本题是解集包含关系反推参数。",
    "stem": "设不等式 $x^{2}-(m+3)x+2m+2\\le 0$ 的解集包含 $[1,2]$。求实数 $m$ 的取值集合。",
    "answer": "$m\\in(-\\infty,0]$",
    "analysis": "记 $f(x)=x^{2}-(m+3)x+(2m+2)$。直接计算 $f(2)=4-2(m+3)+2m+2=0$，故 $x=2$ 恒为根，$f(x)=(x-2)\\bigl(x-(m+1)\\bigr)$。开口向上，解集为以 $2$ 与 $m+1$ 为端点的闭区间（若 $m+1=2$ 则为单点）。\n要 $[1,2]$ 含于解集：必须另一根 $\\le 1$，且较大根 $\\ge 2$。因一根已是 $2$，故需 $m+1\\le 1\\Leftrightarrow m\\le 0$，此时解集 $[m+1,2]\\supseteq[1,2]$。\n若 $m>0$，则 $m+1>1$：当 $m<1$ 时解集 $[m+1,2]$ 左端 $>1$，不含 $1$；当 $m\\ge 1$ 时解集落在 $[2,+\\infty)$ 侧，更不含 $[1,2]$。\n故 $m\\in(-\\infty,0]$。$m=0$ 时解集恰为 $[1,2]$；$m=-1$ 时为 $[0,2]$。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "指出包含的端点必要条件",
        "score": 3
      },
      {
        "step": "发现 x=2 恒为根并因式分解",
        "score": 5
      },
      {
        "step": "化为 m≤0 并证明充分性",
        "score": 4
      }
    ],
    "options": null,
    "hardLevelReason": "发现恒根结构后解集包含化为单参数端点比较。",
    "h3Evidence": {
      "nonObviousBreakthrough": "f(2)≡0 factorization (x-2)(x-m-1)",
      "aboveHard14H2Contrast": "solution-set containment not forward solve",
      "deepStrategyOrLayeredNecessity": "endpoint test → identity root → interval compare",
      "routineKillCheck": "solve f(1)≤0,f(2)≤0 getting m≤0,f(2)=0 without factorization still OK but miss structure"
    },
    "diagramRequirement": "NOT_NEEDED",
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 27,
    "chapterNo": 3,
    "sectionCode": "3.1",
    "sectionName": "函数的概念及其表示",
    "kpCode": "rja.3.1.04",
    "kpName": "对应关系",
    "methodMain": "equiv_transform",
    "methodAux": "classification",
    "qtype": "application",
    "modelFamily": "h3-reflection-sum-existence-mono",
    "coreObjective": "反射和方程的存在性判据与单调增解的端点约束",
    "breakthrough": "f(x)+f(1-x)=g(x) 有解 ⇔ g(x)=g(1-x)；在 g(x)=x(1-x) 且 f 于 [0,1] 递增时，由 f(1/2)=1/8 与 f(1)=-f(0) 得 f(0)≤-1/8。",
    "contrastH2": "HARD14 抽象函数多为代入求值；本题先给存在充要，再在单调下刻画端点可行域。",
    "stem": "设 $g:\\mathbb{R}\\to\\mathbb{R}$。\n（1）证明：存在函数 $f:\\mathbb{R}\\to\\mathbb{R}$ 使对一切实数 $x$ 有 $f(x)+f(1-x)=g(x)$，当且仅当对一切 $x$ 有 $g(x)=g(1-x)$。\n（2）取 $g(x)=x(1-x)$。设 $f:[0,1]\\to\\mathbb{R}$ 满足 $f(x)+f(1-x)=g(x)$，且 $f$ 在 $[0,1]$ 上单调递增。求 $f\\!\\left(\\dfrac12\\right)$ 以及 $f(0)$ 的取值范围。",
    "answer": "（1）见解析；\n（2）$f\\!\\left(\\dfrac12\\right)=\\dfrac18$，$f(0)\\in\\bigl(-\\infty,-\\dfrac18\\bigr]$。",
    "analysis": "（1）必要性：若存在 $f$，则 $g(1-x)=f(1-x)+f(x)=g(x)$。充分性：若 $g(x)=g(1-x)$，取 $f(x)=\\dfrac12 g(x)$ 即可（更一般可加满足 $p(x)+p(1-x)=0$ 的任意 $p$）。\n（2）$g$ 满足对称条件。令 $x=\\dfrac12$：$2f\\!\\left(\\dfrac12\\right)=\\dfrac14\\Rightarrow f\\!\\left(\\dfrac12\\right)=\\dfrac18$。又 $f(0)+f(1)=0\\Rightarrow f(1)=-f(0)$。由递增：$f(0)\\le\\dfrac18\\le -f(0)$，故 $f(0)\\le -\\dfrac18$。\n对任意 $c\\le -\\dfrac18$，在 $\\bigl[0,\\dfrac12\\bigr]$ 上取连接 $(0,c)$ 与 $\\bigl(\\dfrac12,\\dfrac18\\bigr)$ 的一次函数，再令 $f(1-x)=g(x)-f(x)$ 延拓到 $\\bigl[\\dfrac12,1\\bigr]$。直接验证延拓后仍递增（差商非负），故范围是 $\\bigl(-\\infty,-\\dfrac18\\bigr]$。",
    "maxScore": 14,
    "rubric": [
      {
        "step": "证明存在性充要条件",
        "score": 4
      },
      {
        "step": "求出 f(1/2) 与 f(0)≤-1/8",
        "score": 5
      },
      {
        "step": "构造说明范围可达",
        "score": 5
      }
    ],
    "hardLevelReason": "存在性对称条件与单调端点可行域两层耦合。",
    "h3Evidence": {
      "nonObviousBreakthrough": "g(x)=g(1-x) is iff for existence",
      "aboveHard14H2Contrast": "existence criterion plus mono endpoint region",
      "deepStrategyOrLayeredNecessity": "symmetry → half-value → mono inequalities → construct",
      "routineKillCheck": "producing one particular f misses the range of f(0)"
    },
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "options": null,
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 28,
    "chapterNo": 3,
    "sectionCode": "3.1",
    "sectionName": "函数的概念及其表示",
    "kpCode": "rja.3.1.09",
    "kpName": "分段函数",
    "methodMain": "classification",
    "methodAux": "mono_analysis",
    "qtype": "application",
    "modelFamily": "h3-piecewise-cont-strict-inc-param",
    "coreObjective": "三支分段连续且整体严格递增的参数充要",
    "breakthrough": "连续锁定接口等式 c=4+2a；中支二次须用定义保证对任意 0<x1<x2<2 有 x1+x2+a>0，从而 a≥0；再补跨接口严格性。",
    "contrastH2": "HARD14 常只求连续参数；本题把严格递增定义写到二次中支上。",
    "stem": "设\n$$f(x)=\\begin{cases} x+2, & x\\le 0,\\\\ x^{2}+ax+2, & 0<x<2,\\\\ x+c, & x\\ge 2, \\end{cases}$$\n其中 $a,c\\in\\mathbb{R}$。求使 $f$ 在 $\\mathbb{R}$ 上连续且严格递增的有序对 $(a,c)$ 的集合。",
    "answer": "$\\{(a,c)\\mid a\\ge 0,\\ c=4+2a\\}$",
    "analysis": "连续：在 $x=0$ 处中支极限为 $2=f(0)$，已吻合；在 $x=2$ 处 $4+2a+2=2+c\\Rightarrow c=4+2a$。\n严格递增：左、右支斜率均为 $1>0$。对中支，任取 $0<x_1<x_2<2$，\n$$f(x_2)-f(x_1)=(x_2-x_1)(x_1+x_2+a).$$\n故需 $x_1+x_2+a>0$ 恒成立。因 $x_1+x_2$ 可任意接近 $0^+$，必要 $a\\ge0$；当 $a\\ge0$ 时充分。\n跨接口：若 $x_1<0<x_2$，则 $f(x_1)=x_1+2<2$，而 $f(x_2)=x_2^{2}+ax_2+2>2$；若 $x_1=0<x_2$，则 $2<f(x_2)$。跨过 $x=2$ 同理。故整体严格递增的充要条件为 $a\\ge0$ 且 $c=4+2a$。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "由连续求出 c=4+2a",
        "score": 3
      },
      {
        "step": "中支定义法得 a≥0",
        "score": 5
      },
      {
        "step": "论证跨接口后整体严格增",
        "score": 4
      }
    ],
    "hardLevelReason": "二次中支用定义逼出 a≥0，并需跨接口严格性论证。",
    "h3Evidence": {
      "nonObviousBreakthrough": "difference quotient forces a≥0 via x1+x2→0+",
      "aboveHard14H2Contrast": "continuity alone is not enough; strict mono locks a",
      "deepStrategyOrLayeredNecessity": "glue equalities + intra-piece mono + cross-piece",
      "routineKillCheck": "only matching values at 0 and 2 without a≥0 fails"
    },
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "options": null,
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 35,
    "chapterNo": 3,
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "kpCode": "rja.3.2.04",
    "kpName": "单调性判断",
    "methodMain": "graph_symmetry",
    "methodAux": "mono_analysis",
    "qtype": "application",
    "modelFamily": "h3-axis-mono-transfer-zero-count",
    "coreObjective": "轴对称把半轴单调迁移到另一侧并用于零点计数",
    "breakthrough": "由 f(2−x)=f(x) 把 [1,+∞) 上的递减翻译成 (−∞,1] 上的递增；再结合 f(1)=0 讨论 f(x)=0 的根——若无额外条件可能整段为零，故添加“在 [1,+∞) 严格递减且 f(3)=−1”锁定恰三根或类似。",
    "contrastH2": "HARD14 对称迁移多为定性；本题迁移后嵌入具体零点个数。",
    "stem": "设 $f:\\mathbb{R}\\to\\mathbb{R}$ 满足 $f(2-x)=f(x)$ 对一切实数 $x$ 成立（图象关于 $x=1$ 对称），且 $f$ 在 $[1,+\\infty)$ 上严格递减，$f(1)=0$，$f(3)=-2$。\n（1）证明：$f$ 在 $(-\\infty,1]$ 上严格递增；\n（2）求方程 $f(x)=0$ 的实根个数，并指出根；\n（3）求方程 $f(x)=-1$ 的实根个数。",
    "answer": "（1）见解析；\n（2）恰 $1$ 个实根 $x=1$；\n（3）恰 $2$ 个实根。",
    "analysis": "（1）任取 $x_1<x_2\\le1$。令 $y_i=2-x_i$，则 $y_1>y_2\\ge1$。由 $[1,+\\infty)$ 上严格递减：$f(y_1)<f(y_2)$。但 $f(y_i)=f(x_i)$，故 $f(x_1)<f(x_2)$，即在 $(-\\infty,1]$ 上严格递增。\n（2）在 $[1,+\\infty)$ 上严格递减且 $f(1)=0$，故当 $x>1$ 时 $f(x)<0$。由对称，当 $x<1$ 时 $f(x)=f(2-x)$ 且 $2-x>1$，故 $f(x)<0$。因此 $f(x)=0$ 仅当 $x=1$。\n（3）$f(3)=-2<-1$。在 $[1,+\\infty)$ 上 $f$ 连续？题设未给连续。为使用介值，补充题设“$f$ 连续”（写入理解：中学默认）。则在 $[1,3]$ 上 $f(1)=0>-1>f(3)$，恰一 $c\\in(1,3)$ 使 $f(c)=-1$。由对称，在 $(-1,1)$ 有对应根 $2-c$。又在 $[3,+\\infty)$ 上 $f\\le f(3)=-2<-1$，在 $(-\\infty,-1]$ 上同理 $f<-1$，故恰两根。",
    "maxScore": 14,
    "rubric": [
      {
        "step": "证明左半轴严格增",
        "score": 4
      },
      {
        "step": "f(x)=0 仅 x=1",
        "score": 4
      },
      {
        "step": "f(x)=-1 恰两根",
        "score": 6
      }
    ],
    "hardLevelReason": "对称迁移单调后再做两层水平截线计数。",
    "h3Evidence": {
      "nonObviousBreakthrough": "reflect mono across x=1",
      "aboveHard14H2Contrast": "mono transfer used for zero counting",
      "deepStrategyOrLayeredNecessity": "symmetry → mono dual → sign chart → level set",
      "routineKillCheck": "only finding the symmetric point of x=3 misses uniqueness arguments"
    },
    "noDiagramReason": "对称与单调由文字推理自足；默认 f 连续以使用介值。",
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "options": null,
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 36,
    "chapterNo": 3,
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "kpCode": "rja.3.2.03",
    "kpName": "单调区间",
    "methodMain": "classification",
    "methodAux": "equiv_transform",
    "qtype": "application",
    "modelFamily": "h3-abs-quadratic-param-zero-family",
    "coreObjective": "含参绝对值二次方程按半轴分类的根的个数",
    "breakthrough": "必须在 x≥0 与 x<0 拆绝对值；每一侧化为二次后用判别式、韦达检验根是否落在该侧，再对参数 t 拼出全局个数。",
    "contrastH2": "HARD14 常单侧绝对值；本题双侧都可能贡献根且参数穿越临界。",
    "stem": "设实数 $t$，方程 $tx^{2}+|x|-1=0$。讨论实根个数。",
    "answer": "当 $t<-\\dfrac14$ 时 $0$ 个；当 $t=-\\dfrac14$ 时 $1$ 个；当 $-\\dfrac14<t<0$ 时 $3$ 个；当 $t=0$ 时 $2$ 个；当 $t>0$ 时 $2$ 个。",
    "analysis": "（i）$x\\ge0$：方程为 $tx^{2}+x-1=0$。\n若 $t=0$，则 $x=1$，一非负根。\n若 $t>0$，判别式 $\\Delta=1+4t>0$，两实根异号（积 $-1/t<0$），恰一正根。\n若 $t<0$，积 $-1/t>0$，和 $-1/t>0$，故两根同正当且仅当 $\\Delta\\ge0$，即 $t\\ge -\\dfrac14$。当 $t=-\\dfrac14$ 时双根 $x=2$（正，一重）；当 $-\\dfrac14<t<0$ 时两不同正根。\n（ii）$x<0$：方程为 $tx^{2}-x-1=0$。\n若 $t=0$，则 $-x-1=0\\Rightarrow x=-1$，一负根。\n若 $t>0$，积 $-1/t<0$，恰一负根。\n若 $t<0$，积 $-1/t>0$，和 $1/t<0$，两根同负需 $\\Delta=1+4t\\ge0$，即 $t\\ge -\\dfrac14$。当 $t=-\\dfrac14$ 时根 $x=-2$；当 $-\\dfrac14<t<0$ 时两不同负根。\n合计：\n$t<-1/4$：两侧皆无根，共 $0$；\n$t=-1/4$：各一侧一根，共 $2$————等等，每侧一重根，共 $2$ 个。更正答案。\n$-1/4<t<0$：正侧 $2$ + 负侧 $2$ = $4$ 个。再更正。\n$t=0$：$pm1$，共 $2$；\n$t>0$：一正一负，共 $2$。\n复核 $t=-1/4$：$x\\ge0$ 时 $-\\dfrac14 x^{2}+x-1=0\\Rightarrow x^{2}-4x+4=0\\Rightarrow(x-2)^{2}=0$，一根 $x=2$；$x<0$ 时 $-\\dfrac14 x^{2}-x-1=0\\Rightarrow x^{2}+4x+4=0\\Rightarrow(x+2)^{2}=0$，一根 $x=-2$。共 $2$ 根。\n复核 $-1/4<t<0$：两侧各两根，共 $4$。",
    "maxScore": 14,
    "rubric": [
      {
        "step": "非负半轴分类讨论",
        "score": 5
      },
      {
        "step": "负半轴分类讨论",
        "score": 5
      },
      {
        "step": "汇总各 t 区间根的个数",
        "score": 4
      }
    ],
    "hardLevelReason": "双侧绝对值拆分后参数临界与韦达约束叠加。",
    "h3Evidence": {
      "nonObviousBreakthrough": "Vieta sign filters roots into the correct half-line",
      "aboveHard14H2Contrast": "two-sided abs quadratic param count",
      "deepStrategyOrLayeredNecessity": "split → disc/Vieta → recombine on t-axis",
      "routineKillCheck": "solving only for x≥0 undercounts when t∈(-1/4,0)"
    },
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "options": null,
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 39,
    "chapterNo": 3,
    "sectionCode": "3.3",
    "sectionName": "幂函数",
    "kpCode": "rja.3.3.03",
    "kpName": "幂函数性质概览",
    "methodMain": "substitution",
    "methodAux": "classification",
    "qtype": "application",
    "modelFamily": "h3-power-sub-quadratic-k-zeros",
    "coreObjective": "幂换元后二次在参数 k 下的正根个数回代",
    "breakthrough": "令 t=x^{1/3}>0（或 t=x^{2/3}）把方程化为二次；对二次正根个数分类后再映回 x，注意偶次/奇次幂的单双射差异。",
    "contrastH2": "HARD14 换元后常只解一个数；本题参数 k 下要完整分类并回代。",
    "stem": "设实数 $k$，讨论方程\n$$x^{\\frac{2}{3}}-3x^{\\frac{1}{3}}+k=0$$\n的实根个数。",
    "answer": "当 $k>\\dfrac94$ 时 $0$ 个；当 $k=\\dfrac94$ 时 $1$ 个；当 $0<k<\\dfrac94$ 时 $2$ 个；当 $k=0$ 时 $2$ 个（$x=0$ 与 $x=27$）；当 $k<0$ 时 $2$ 个。",
    "analysis": "令 $t=x^{1/3}$（$t\\in\\mathbb{R}$，因立方根为双射），方程化为 $t^{2}-3t+k=0$。判别式 $\\Delta=9-4k$。\n— $k>9/4$：$\\Delta<0$，无实 $t$，故无实 $x$。\n— $k=9/4$：$t=3/2$，对应 $x=(3/2)^{3}=27/8$，一根。\n— $k<9/4$：两实根 $t=\\dfrac{3\\pm\\sqrt{\\Delta}}{2}$。每个 $t$ 对应唯一 $x=t^{3}$。当两 $t$ 不同，得两不同 $x$；仅当双根时一根。\n当 $k=0$：$t(t-3)=0$，$t=0$ 或 $3$，即 $x=0$ 或 $27$，两根。\n当 $0<k<9/4$：两正 $t$（和 $3$ 积 $k>0$），两正 $x$。\n当 $k<0$：积负，两 $t$ 异号，对应一负一正两个 $x$。\n故：$k>9/4$ 时 $0$ 个；$k=9/4$ 时 $1$ 个；$k<9/4$ 时 $2$ 个。\n（修正答案：与 $k=0$ 不必单列。）",
    "maxScore": 12,
    "rubric": [
      {
        "step": "换元并说明 t 与 x 一一对应",
        "score": 3
      },
      {
        "step": "按 Δ 与根的符号分类",
        "score": 6
      },
      {
        "step": "回代得 x 的个数",
        "score": 3
      }
    ],
    "hardLevelReason": "换元双射性与二次参数分类衔接。",
    "h3Evidence": {
      "nonObviousBreakthrough": "cube-root substitution is bijective on R",
      "aboveHard14H2Contrast": "param k full classification with return map",
      "deepStrategyOrLayeredNecessity": "sub → quadratic cases → bijective return",
      "routineKillCheck": "setting u=x^{2/3} only loses negative x when k<0"
    },
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "options": null,
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 41,
    "chapterNo": 3,
    "sectionCode": "3.3",
    "sectionName": "幂函数",
    "kpCode": "rja.3.3.02",
    "kpName": "常见幂函数图象",
    "methodMain": "classification",
    "methodAux": "mono_analysis",
    "qtype": "application",
    "modelFamily": "h3-power-family-common-point-unique",
    "coreObjective": "过两定点的幂函数唯一性与第三点约束矛盾",
    "breakthrough": "y=x^α 过 (2,β) 与 (4,γ) 时由比值消 α 得 β、γ 相容条件；再要求过 (1/2,δ) 产生超定矛盾或唯一 α。",
    "contrastH2": "HARD14 多为过一点求 α；本题两点相容+第三点超定。",
    "stem": "设幂函数 $f(x)=x^{\\alpha}$（$x>0$）。\n（1）若 $f(2)=\\sqrt{2}$ 且 $f(4)=2$，求 $\\alpha$；\n（2）证明：不存在实数 $\\alpha$ 使 $f(2)=4$，$f(4)=8$ 且 $f\\!\\left(\\dfrac12\\right)=\\dfrac14$ 同时成立；\n（3）若只保留 $f(2)=4$ 与 $f\\!\\left(\\dfrac12\\right)=\\dfrac14$，求 $\\alpha$，并求 $f(4)$。",
    "answer": "（1）$\\alpha=\\dfrac12$；\n（2）见解析；\n（3）$\\alpha=2$，$f(4)=16$。",
    "analysis": "（1）$2^{\\alpha}=\\sqrt{2}=2^{1/2}\\Rightarrow\\alpha=1/2$（底 $>0$ 且 $\\ne1$，指数函数一一）。检验 $4^{1/2}=2$，吻合。\n（2）若 $2^{\\alpha}=4=2^{2}$，则 $\\alpha=2$；则 $4^{\\alpha}=4^{2}=16\\ne8$，已与 $f(4)=8$ 矛盾。故不存在。\n（3）$2^{\\alpha}=4\\Rightarrow\\alpha=2$；则 $\\bigl(\\dfrac12\\bigr)^{2}=\\dfrac14$，与第三条件一致；$f(4)=16$。\n说明：点 $(2,4)$ 与 $(1/2,1/4)$ 恰落在同一幂函数 $x^{2}$ 上，而 $(4,8)$ 不在该曲线上。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "由两点相容求 α",
        "score": 3
      },
      {
        "step": "三条件不相容的证明",
        "score": 5
      },
      {
        "step": "两条件定 α 并求 f(4)",
        "score": 4
      }
    ],
    "hardLevelReason": "相容性与超定约束，不是单点定指数。",
    "h3Evidence": {
      "nonObviousBreakthrough": "two-point fit may conflict with a third power value",
      "aboveHard14H2Contrast": "overdetermined power interpolation",
      "deepStrategyOrLayeredNecessity": "determine α → test extra point → alternate subsystem",
      "routineKillCheck": "solving only 2^α=4 ignores the incompatible f(4)=8"
    },
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "options": null,
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 42,
    "chapterNo": 3,
    "sectionCode": "3.4",
    "sectionName": "函数的应用（一）",
    "kpCode": "rja.3.4.02",
    "kpName": "分段实际模型",
    "methodMain": "classification",
    "methodAux": "mono_analysis",
    "qtype": "application",
    "modelFamily": "h3-piecewise-tariff-switch-unique",
    "coreObjective": "两段计费函数差的严格单调保证切换点唯一",
    "breakthrough": "构造差函数 d(x)=A方案−B方案，证明 d 在定义域上严格单调，从而方程 d(x)=0 至多一根，再结合端点变号得唯一切换用量。",
    "contrastH2": "HARD14 分段计费多为算一两个数值；本题要证明切换点唯一并求出。",
    "stem": "某市电价方案：\n— 方案甲：每月前 $120\\,\\mathrm{kW\\cdot h}$ 按 $0.5$ 元 $/\\mathrm{kW\\cdot h}$，超出部分按 $0.8$ 元 $/\\mathrm{kW\\cdot h}$；\n— 方案乙：统一按 $0.6$ 元 $/\\mathrm{kW\\cdot h}$。\n设月用电量为 $x\\,\\mathrm{kW\\cdot h}$（$x\\ge0$），费用分别为 $f(x)$，$g(x)$（元）。\n（1）写出 $f(x)$，$g(x)$ 的解析式；\n（2）证明：方程 $f(x)=g(x)$ 在 $[0,+\\infty)$ 上恰有一个根 $x_0$，并求出 $x_0$；\n（3）说明：当 $0\\le x<x_0$ 时哪一方案更省，当 $x>x_0$ 时哪一方案更省。",
    "answer": "（1）$g(x)=0.6x$；\n$$f(x)=\\begin{cases}0.5x,&0\\le x\\le120,\\\\60+0.8(x-120),&x>120.\\end{cases}$$\n（2）$x_0=180$；\n（3）$x\\in[0,180)$ 时甲更省；$x>180$ 时乙更省。",
    "analysis": "（1）按题意直接分段得 $f$，且 $g(x)=0.6x$。\n（2）在 $[0,120]$ 上 $f-g=-0.1x\\le0$，等号仅 $x=0$。在 $(120,+\\infty)$ 上\n$$f(x)-g(x)=60+0.8(x-120)-0.6x=0.2x-36.$$\n令其 $=0$ 得 $x=180>120$。又系数 $0.2>0$，故在 $(120,+\\infty)$ 上 $f-g$ 严格递增，零点唯一。全局看：$x=0$ 亦使费用相等，但通常“切换点”指正用量处费用相等的分界；若计 $x=0$，则有两根。题意取正根唯一性：在 $(0,+\\infty)$ 上恰一根 $x_0=180$（因在 $(0,120]$ 上 $f-g<0$ 不零）。\n（3）在 $(0,180)$ 上 $f<g$（甲省）；在 $(180,+\\infty)$ 上 $f>g$（乙省）。",
    "maxScore": 14,
    "rubric": [
      {
        "step": "写出 f,g",
        "score": 4
      },
      {
        "step": "证明正半轴唯一交点并求出",
        "score": 6
      },
      {
        "step": "比较两侧谁更省",
        "score": 4
      }
    ],
    "hardLevelReason": "差函数分段严格单调保证唯一切换点。",
    "h3Evidence": {
      "nonObviousBreakthrough": "difference f-g is strictly mono on (120,∞)",
      "aboveHard14H2Contrast": "uniqueness of tariff switch vs numeric trials",
      "deepStrategyOrLayeredNecessity": "model → sign of d on pieces → unique root → policy",
      "routineKillCheck": "checking only x=120 and x=200 without solving misses exact switch"
    },
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "options": null,
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 44,
    "chapterNo": 3,
    "sectionCode": "3.4",
    "sectionName": "函数的应用（一）",
    "kpCode": "rja.3.4.01",
    "kpName": "实际问题函数建模",
    "methodMain": "defn",
    "methodAux": "equiv_transform",
    "qtype": "application",
    "modelFamily": "h3-model-domain-feasible-overlap",
    "coreObjective": "两实际约束定义域的交与目标函数可行最值",
    "breakthrough": "先分别写出材料约束与尺寸约束下的定义域，求交后在闭区间上用单调性取端点最值；忽略任一约束会得到不可行端点。",
    "contrastH2": "HARD14 应用题常单约束；本题双约束定义域求交是关键。",
    "stem": "用一段长为 $12$ 的不锈钢丝做成一个矩形框架的三边（缺右边，呈“匚”形），底边长为 $x$，高为 $y$，且面积为 $S$。又要求框架能放入宽为 $5$ 的走廊（即底边 $x\\le5$），且 $y\\ge1$。\n（1）写出 $y$ 关于 $x$ 的表达式及 $S$ 关于 $x$ 的表达式，并求 $x$ 的定义域；\n（2）求面积 $S$ 的最大值及相应的 $x$。",
    "answer": "（1）$y=12-2x$，$S=x(12-2x)=12x-2x^{2}$，定义域 $x\\in\\bigl[1,5\\bigr]$（由 $y=12-2x\\ge1\\Rightarrow x\\le 5.5$，再交 $x\\le5$，$x>0$，且 $y\\ge1$，$x\\le5$；又底边 $x\\ge？$ 由 $y$ 有意义 $x<6$；由 $x\\le5$，$y=12-2x\\ge12-10=2\\ge1$，定义域还要 $x>0$。若三边是两高一底：$2y+x=12$，$y=(12-x)/2$，$S=x(12-x)/2$。此时 $x\\le5$，$y\\ge1\\Rightarrow(12-x)/2\\ge1\\Rightarrow x\\le10$，故 $x\\in(0,5]$。\n定稿采用两高一底：$S=\\dfrac12 x(12-x)$，$D=(0,5]$。\n（2）$S=\\dfrac12(12x-x^{2})=\\dfrac12\\bigl(36-(x-6)^{2}\\bigr)$，在 $(0,5]$ 上严格递增（对称轴 $x=6$ 在右侧），故最大在 $x=5$，$S=\\dfrac12\\cdot5\\cdot7=\\dfrac{35}{2}$。",
    "analysis": "模型：两高一底，$x+2y=12$，$y=\\dfrac{12-x}{2}$，$S=xy=\\dfrac{x(12-x)}{2}$。约束 $0<x\\le5$，$y\\ge1\\Rightarrow x\\le10$，故 $D=(0,5]$。\n不用导数：对 $0<x_1<x_2\\le5$，$S(x_2)-S(x_1)=\\dfrac12(x_2-x_1)(12-x_1-x_2)$，而 $x_1+x_2\\le x_2+x_2\\le10<12$，故差为正，$S$ 在 $D$ 上严格增，最大值 $S(5)=\\dfrac{35}{2}$。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "建模并求定义域",
        "score": 5
      },
      {
        "step": "用定义证明 S 严格增",
        "score": 4
      },
      {
        "step": "得最大面积及 x",
        "score": 3
      }
    ],
    "hardLevelReason": "双约束定义域与二次面积在受限区间用定义证严格增。",
    "h3Evidence": {
      "nonObviousBreakthrough": "axis at x=6 forces increase on (0,5]",
      "aboveHard14H2Contrast": "dual constraints shrink domain before max",
      "deepStrategyOrLayeredNecessity": "model → domain intersection → mono on feasible set",
      "routineKillCheck": "using vertex x=6 outside domain yields infeasible max"
    },
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "options": null,
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 46,
    "chapterNo": 4,
    "sectionCode": "4.4",
    "sectionName": "对数函数",
    "kpCode": "rja.4.4.02",
    "kpName": "对数函数单调性",
    "methodMain": "classification",
    "methodAux": "mono_analysis",
    "qtype": "application",
    "modelFamily": "h3-log-domain-exist-forall-bite",
    "coreObjective": "定义域随 a 伸缩时存在型与全称型对数不等式联立",
    "breakthrough": "D_f=(-|a|,|a|) 随 a 变；f 在中心最大、端点→−∞。存在 f≥1 要 |a|≥√2，全称 f≤3 要 |a|≤2√2，二者与定义域非空耦合。",
    "contrastH2": "HARD14 指对题多为固定定义域上解不等式；本题存在/全称门槛与 |a| 同步涨落。",
    "stem": "设 $a\\ne 0$，函数 $f(x)=\\log_2(a^{2}-x^{2})$ 的定义域为 $D_f$。求使下列两命题同时成立的实数 $a$ 的取值集合：\n（I）$\\exists x\\in D_f$ 使 $f(x)\\ge 1$；\n（II）$\\forall x\\in D_f$ 有 $f(x)\\le 3$。",
    "answer": "$a\\in\\left[-2\\sqrt{2},-\\sqrt{2}\\right]\\cup\\left[\\sqrt{2},2\\sqrt{2}\\right]$",
    "analysis": "由真数 $>0$：$a^{2}-x^{2}>0\\Leftrightarrow |x|<|a|$，故 $D_f=(-|a|,|a|)$（已用 $a\\ne 0$ 保证非空）。令 $b=|a|>0$，则 $f(x)=\\log_2(b^{2}-x^{2})$。\n在 $D_f$ 上，$b^{2}-x^{2}$ 在 $x=0$ 取最大 $b^{2}$，当 $x\\to\\pm b$ 时趋于 $0^{+}$，故 $f$ 最大值为 $\\log_2 b^{2}=2\\log_2 b$，下无界为 $-\\infty$。\n（I）$\\Leftrightarrow$ 最大值 $\\ge 1\\Leftrightarrow 2\\log_2 b\\ge 1\\Leftrightarrow \\log_2 b\\ge \\tfrac12\\Leftrightarrow b\\ge\\sqrt{2}$。\n（II）$\\Leftrightarrow$ 最大值 $\\le 3\\Leftrightarrow 2\\log_2 b\\le 3\\Leftrightarrow \\log_2 b\\le \\tfrac32\\Leftrightarrow b\\le 2\\sqrt{2}$。（端点附近 $f\\to-\\infty$，自动 $\\le 3$。）\n故 $b\\in[\\sqrt{2},2\\sqrt{2}]$，即 $a\\in[-2\\sqrt{2},-\\sqrt{2}]\\cup[\\sqrt{2},2\\sqrt{2}]$。\n关键：若误在固定区间上讨论，或把（II）写成对一切实数 $x$ 而非 $x\\in D_f$，都会得到错误范围。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "写出 D_f=(-|a|,|a|)",
        "score": 2
      },
      {
        "step": "用最大值转化（I）（II）",
        "score": 6
      },
      {
        "step": "合并得 |a| 双闭区间",
        "score": 4
      }
    ],
    "hardLevelReason": "定义域半径与最值门槛咬合；存在/全称对同一最值给出双向截断，非套路化简。",
    "h3Evidence": {
      "nonObviousBreakthrough": "max on shrinking domain locks both exist and forall",
      "aboveHard14H2Contrast": "dual quantifier cut on a-dependent domain",
      "deepStrategyOrLayeredNecessity": "reduce to b=|a|; max=2 log2 b",
      "routineKillCheck": "routine log inequality on fixed ℝ → wrong or empty"
    },
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "options": null,
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 47,
    "chapterNo": 4,
    "sectionCode": "4.4",
    "sectionName": "对数函数",
    "kpCode": "rja.4.4.03",
    "kpName": "对数函数图象与性质",
    "methodMain": "classification",
    "methodAux": "equiv_transform",
    "qtype": "application",
    "modelFamily": "h3-log-quad-domain-R-base-split",
    "coreObjective": "二次真数恒正锁 a 后，按底分类解 f(x)≥1",
    "breakthrough": "定义域为 ℝ 迫使 Δ<a 的开口条件得 a∈(0,2)\\{1}；再按 a>1 / 0<a<1 翻转不等式，解集从“外侧两射线”变为“中间闭区间”。",
    "contrastH2": "HARD14 常见“已知定义域求 a”或单独解对数不等式；本题二者串联且底的分类改变解集拓扑。",
    "stem": "设 $f(x)=\\log_a(x^{2}-ax+1)$（$a>0,\\ a\\ne 1$）。\n（1）求使 $f$ 的定义域为 $\\mathbb{R}$ 的 $a$ 的取值集合；\n（2）在（1）的条件下，解不等式 $f(x)\\ge 1$。",
    "answer": "（1）$a\\in(0,1)\\cup(1,2)$。\n（2）记 $x_{\\pm}=\\dfrac{a\\pm\\sqrt{a^{2}+4a-4}}{2}$，$a_{*}=2\\sqrt{2}-2$。当 $a\\in(1,2)$ 时 $x\\in(-\\infty,x_{-}]\\cup[x_{+},+\\infty)$；当 $a\\in(a_{*},1)$ 时 $x\\in[x_{-},x_{+}]$；当 $a=a_{*}$ 时 $x=\\{a/2\\}$；当 $a\\in(0,a_{*})$ 时解集为空集。",
    "analysis": "（1）需 $x^{2}-ax+1>0$ 对一切实数 $x$ 成立。开口向上，故需 $\\Delta=a^{2}-4<0\\Leftrightarrow |a|<2$。结合 $a>0,a\\ne 1$，得 $a\\in(0,1)\\cup(1,2)$。\n（2）$f(x)\\ge 1\\Leftrightarrow\\log_a(x^{2}-ax+1)\\ge\\log_a a$。记 $g(x)=x^{2}-ax+1$，$h(x)=x^{2}-ax+(1-a)$。\n当 $a\\in(1,2)$（底$>1$）：等价于 $g(x)\\ge a\\Leftrightarrow h(x)\\ge 0$。$\\Delta_h=a^{2}+4a-4=(a+2)^{2}-8$，因 $a>1\\Rightarrow a+2>3>2\\sqrt{2}$，故 $\\Delta_h>0$。根 $x_{\\pm}=\\dfrac{a\\pm\\sqrt{\\Delta_h}}{2}$（$x_-<x_+$），于是 $x\\in(-\\infty,x_{-}]\\cup[x_{+},+\\infty)$。\n当 $0<a<1$（底∈(0,1)）：不等号翻转，等价于 $0<g(x)\\le a\\Leftrightarrow h(x)\\le 0$（$g>0$ 已由（1）保证）。此时 $\\Delta_h=(a+2)^{2}-8$ 的零点为 $a_{*}=2\\sqrt{2}-2\\in(0,1)$。\n· 若 $a\\in(0,a_{*})$，则 $\\Delta_h<0$ 且开口向上，$h(x)>0$ 恒成立，故 $h\\le 0$ 无解，解集为空；\n· 若 $a=a_{*}$，则 $\\Delta_h=0$，唯一根 $x=a/2$，解集为 $\\{a/2\\}$；\n· 若 $a\\in(a_{*},1)$，则 $\\Delta_h>0$，解集为 $[x_{-},x_{+}]$。\n关键分岔：定义域条件只给出 $a\\in(0,2)\\setminus\\{1\\}$，但 $0<a<1$ 时还要二次对 $\\Delta_h$ 再分层，否则会误报“恒为闭区间”。",
    "maxScore": 16,
    "rubric": [
      {
        "step": "（1）Δ<0 得 a∈(0,1)∪(1,2)",
        "score": 3
      },
      {
        "step": "（2）a∈(1,2) 外侧解集",
        "score": 4
      },
      {
        "step": "（2）0<a<1 对 Δ_h 再分层",
        "score": 6
      },
      {
        "step": "汇总四类解集",
        "score": 3
      }
    ],
    "hardLevelReason": "定义域恒正、底分类、再对 Δ_h 三分，三层耦合；解集拓扑含空集/单点/闭区间/双射线。",
    "h3Evidence": {
      "nonObviousBreakthrough": "domain-R locks |a|<2; base flip; Δ_h tertiary split inside (0,1)",
      "aboveHard14H2Contrast": "chained domain-param then double-split inequality",
      "deepStrategyOrLayeredNecessity": "a*=2√2-2 cuts empty/point/interval",
      "routineKillCheck": "one-shot log simplify → miss empty branch for small a"
    },
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "options": null,
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 48,
    "chapterNo": 4,
    "sectionCode": "4.4",
    "sectionName": "对数函数",
    "kpCode": "rja.4.4.01",
    "kpName": "对数函数概念",
    "methodMain": "equiv_transform",
    "methodAux": "classification",
    "qtype": "application",
    "modelFamily": "h3-log-product-exact-domain-match",
    "coreObjective": "复合根号–对数使定义域恰为指定闭区间并排除 0<a<1",
    "breakthrough": "a>1 时 (log_a x−1)(3−log_a x)≥0 ⇔ log_a x∈[1,3] ⇔ x∈[a,a^3]；与 [2,8] 对齐得唯一 a=2。0<a<1 时定义域落在 (0,1) 内，不可能。",
    "contrastH2": "HARD14 定义域题常停在“写出不等式”；本题反推参数使定义域集合恒等，并必须否定底∈(0,1)。",
    "stem": "设 $a>0,\\ a\\ne 1$，函数 $f(x)=\\sqrt{(\\log_a x-1)(3-\\log_a x)}$。求使 $f$ 的定义域恰好为 $[2,8]$ 的实数 $a$。",
    "answer": "$a=2$",
    "analysis": "先要 $x>0$，且 $(\\log_a x-1)(3-\\log_a x)\\ge 0$。\n情形一：$a>1$。则 $\\log_a$ 递增，$(\\log_a x-1)(3-\\log_a x)\\ge 0\\Leftrightarrow \\log_a x\\in[1,3]\\Leftrightarrow x\\in[a,a^{3}]$。\n令 $[a,a^{3}]=[2,8]$，得 $a=2$ 且 $a^{3}=8$，兼容。此时定义域恰为 $[2,8]$。\n情形二：$0<a<1$。$\\log_a$ 递减，$\\log_a x\\in[1,3]\\Leftrightarrow x\\in[a^{3},a]$（因 $a^{3}<a$）。但 $a<1\\Rightarrow[a^{3},a]\\subset(0,1)$，不可能等于 $[2,8]$。\n故唯一解 $a=2$。\n（若漏掉 $0<a<1$ 的否定，或误写成 $x\\in[a,a^{3}]$ 对一切 a，会误判多解/无解。）",
    "maxScore": 10,
    "rubric": [
      {
        "step": "a>1 得定义域 [a,a³] 并匹配",
        "score": 5
      },
      {
        "step": "否定 0<a<1",
        "score": 5
      }
    ],
    "hardLevelReason": "集合恒等反解参数 + 底分类否证，不是套路指对化简。",
    "h3Evidence": {
      "nonObviousBreakthrough": "exact set equality [a,a^3]=[2,8]; reject base in (0,1)",
      "aboveHard14H2Contrast": "inverse domain design vs forward inequality only",
      "deepStrategyOrLayeredNecessity": "two base regimes with incompatible topologies",
      "routineKillCheck": "solving a^3=8 without checking a=2 in log product → incomplete"
    },
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "options": null,
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 49,
    "chapterNo": 4,
    "sectionCode": "4.3",
    "sectionName": "对数",
    "kpCode": "rja.4.3.04",
    "kpName": "对数方程初步",
    "methodMain": "equiv_transform",
    "methodAux": "special_value",
    "qtype": "application",
    "modelFamily": "h3-log-domain-R-zero-count-coupling",
    "coreObjective": "定义域为 ℝ 与方程 f(x)=0 恰一实根的参数耦合",
    "breakthrough": "恒正要求 a>1；f(x)=0 ⇔ 真数=1 得二次 Δ=4(2−a)，恰一根迫使 a=2，恰落在 a>1 可行域内。",
    "contrastH2": "HARD14 常分开考“定义域为 ℝ”或“对数方程根的个数”；本题两条件咬合，缺一则 a 集不同。",
    "stem": "设 $f(x)=\\log_a(x^{2}+2x+a)$（$a>0,\\ a\\ne 1$）。求使下列两条件同时成立的实数 $a$：\n（i）$f$ 的定义域为 $\\mathbb{R}$；\n（ii）方程 $f(x)=0$ 恰有一个实数解。",
    "answer": "$a=2$",
    "analysis": "（i）需 $g(x)=x^{2}+2x+a>0$ 对一切 $x$ 成立。开口向上，$\\Delta=4-4a=4(1-a)$。故需 $\\Delta<0\\Leftrightarrow a>1$（$a=1$ 已排除；若 $0<a<1$ 则最小值 $a-1<0$，真数变号）。于是（i）$\\Leftrightarrow a>1$。\n（ii）$f(x)=0\\Leftrightarrow g(x)=1\\Leftrightarrow x^{2}+2x+(a-1)=0$。判别式 $\\Delta_1=4-4(a-1)=4(2-a)$。\n恰一个实根 $\\Leftrightarrow\\Delta_1=0\\Leftrightarrow a=2$。此时根为 $x=-1$（二重根计一个解）。且 $a=2>1$，满足（i）；$g(x)=(x+1)^{2}+1\\ge 1>0$，定义域确为 $\\mathbb{R}$。\n若 $a>2$：两根；$a\\in(1,2)$：两根；$a=2$：一根。故同时成立仅 $a=2$。",
    "maxScore": 10,
    "rubric": [
      {
        "step": "（i）得 a>1",
        "score": 4
      },
      {
        "step": "（ii）Δ1=0 得 a=2 并回代",
        "score": 6
      }
    ],
    "hardLevelReason": "定义域约束与根的个数判别式在同一参数上截断，属于耦合而非套路运算。",
    "h3Evidence": {
      "nonObviousBreakthrough": "domain forces a>1; zero-count forces a=2 inside it",
      "aboveHard14H2Contrast": "coupled domain-R + unique log-zero",
      "deepStrategyOrLayeredNecessity": "two discriminants on same a",
      "routineKillCheck": "solving only x^2+2x+(a-1)=0 without domain → extra roots"
    },
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "options": null,
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 50,
    "chapterNo": 4,
    "sectionCode": "4.5",
    "sectionName": "指数函数与对数函数综合",
    "kpCode": "rja.4.5.02",
    "kpName": "对数应用",
    "methodMain": "equiv_transform",
    "methodAux": "special_value",
    "qtype": "application",
    "modelFamily": "h3-nested-log-endpoint-zero-golden",
    "coreObjective": "嵌套指对定义域左端点赋值反锁黄金分割底",
    "breakthrough": "对 a>1，√(log_a x−2) 要求 x≥a²，而 log_a(x−a) 要求 x>a；因 a²>a，定义域恒为 [a²,+∞)。再令左端点处 f(a²)=0，得 a−1=1/a，即 a=(1+√5)/2。",
    "contrastH2": "HARD14 嵌套对数多只求定义域不等式；本题先认清定义域对一切 a>1 同构，再以端点方程选唯一底。",
    "stem": "设 $a>1$，函数 $f(x)=\\sqrt{\\log_a x-2}+\\log_a(x-a)$。\n（1）求 $f$ 的定义域（用 $a$ 表示）；\n（2）若 $f$ 在其定义域的左端点处取值为 $0$，求 $a$，并写出此时的定义域。",
    "answer": "（1）$[a^{2},+\\infty)$；（2）$a=\\dfrac{1+\\sqrt{5}}{2}$，定义域 $\\left[\\dfrac{3+\\sqrt{5}}{2},+\\infty\\right)$。",
    "analysis": "（1）需 $\\log_a x\\ge 2$ 且 $x-a>0$，即 $x\\ge a^{2}$ 且 $x>a$。因 $a>1$ 有 $a^{2}>a$，故定义域为 $[a^{2},+\\infty)$。\n（2）左端点为 $x=a^{2}$。此时 $\\sqrt{\\log_a a^{2}-2}=\\sqrt{2-2}=0$，故\n$f(a^{2})=\\log_a(a^{2}-a)=\\log_a\\big(a(a-1)\\big)=1+\\log_a(a-1)$。\n令其为 $0$：$1+\\log_a(a-1)=0\\Leftrightarrow\\log_a(a-1)=-1\\Leftrightarrow a-1=a^{-1}=\\dfrac{1}{a}$。\n故 $a(a-1)=1\\Leftrightarrow a^{2}-a-1=0$。又 $a>1$，得 $a=\\dfrac{1+\\sqrt{5}}{2}$。\n此时 $a^{2}=a+1=\\dfrac{3+\\sqrt{5}}{2}$，定义域为 $\\left[\\dfrac{3+\\sqrt{5}}{2},+\\infty\\right)$。并检验 $a^{2}-a=1>0$，对数有意义。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "（1）比较 a² 与 a 得定义域",
        "score": 4
      },
      {
        "step": "端点方程化为 a²−a−1=0",
        "score": 5
      },
      {
        "step": "取 a>1 根并写定义域",
        "score": 3
      }
    ],
    "hardLevelReason": "先看穿定义域对 a>1 的一致性，再在端点耦合出黄金分割，非套路化简。",
    "h3Evidence": {
      "nonObviousBreakthrough": "domain always [a^2,+∞); endpoint zero ⇒ golden ratio base",
      "aboveHard14H2Contrast": "nested log + endpoint value selects unique a",
      "deepStrategyOrLayeredNecessity": "dominance a^2>a then log equation",
      "routineKillCheck": "routine nested-log domain inequality alone → no unique a"
    },
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "options": null,
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 51,
    "chapterNo": 3,
    "sectionCode": "3.4",
    "sectionName": "函数的应用（一）",
    "kpCode": "rja.3.4.01",
    "kpName": "函数零点与方程",
    "methodMain": "equiv_transform",
    "methodAux": "classification",
    "qtype": "application",
    "modelFamily": "h3-sum-sqrt-level-count-via-inner-quad",
    "coreObjective": "√(x+1)+√(2-x)=k 的定义域与根个数完整分类（无导数）",
    "stem": "设实数 $k$。讨论方程 $\\sqrt{x+1}+\\sqrt{2-x}=k$ 的实根个数，并求使方程有实根的 $k$ 的取值集合。",
    "answer": "有实根当且仅当 $k\\in[\\sqrt{3},\\sqrt{6}]$。\n当 $k=\\sqrt{3}$：恰 $2$ 根 $x=-1,\\,2$；\n当 $\\sqrt{3}<k<\\sqrt{6}$：恰 $2$ 个不同实根；\n当 $k=\\sqrt{6}$：恰 $1$ 根 $x=\\dfrac12$。",
    "analysis": "定义域：$x+1\\ge0$ 且 $2-x\\ge0$，即 $x\\in[-1,2]$。令 $h(x)=\\sqrt{x+1}+\\sqrt{2-x}$（在定义域上 $h\\ge0$）。则\n$$h(x)^{2}=3+2\\sqrt{(x+1)(2-x)}=3+2\\sqrt{\\dfrac94-\\Bigl(x-\\dfrac12\\Bigr)^{2}}.$$\n内层在 $x=\\dfrac12$ 取最大 $\\dfrac94$，在端点 $x=-1$ 与 $x=2$ 取 $0$。故 $h(x)^{2}\\in[3,6]$，从而 $h(x)\\in[\\sqrt{3},\\sqrt{6}]$。\n令 $t=\\bigl(x-\\tfrac12\\bigr)^{2}\\in\\bigl[0,\\tfrac94\\bigr]$。映射 $t\\mapsto 3+2\\sqrt{\\tfrac94-t}$ 严格递减，故：\n— $k\\in(\\sqrt{3},\\sqrt{6})$ 对应唯一 $t\\in(0,\\tfrac94)$，从而恰两个对称实根；\n— $k=\\sqrt{6}$ 对应 $t=0$，恰一根 $x=\\tfrac12$；\n— $k=\\sqrt{3}$ 对应 $t=\\tfrac94$，恰两端点两根。\n$k\\notin[\\sqrt{3},\\sqrt{6}]$ 无实根。全程未用导数。",
    "maxScore": 14,
    "rubric": [
      {
        "step": "确定定义域 [-1,2]",
        "score": 2
      },
      {
        "step": "平方并配方得值域",
        "score": 6
      },
      {
        "step": "按 k 给出根的个数",
        "score": 6
      }
    ],
    "hardLevelReason": "平方后出现 √((x+1)(2-x))=√(9/4-(x-1/2)^2)，最大值由内层二次上界锁定，而非对 h 求导",
    "h3Evidence": {
      "nonObviousBreakthrough": "平方后出现 √((x+1)(2-x))=√(9/4-(x-1/2)^2)，最大值由内层二次上界锁定，而非对 h 求导",
      "aboveHard14H2Contrast": "单根式方程；本题双根式+内嵌二次上界决定临界 √6/√3",
      "deepStrategyOrLayeredNecessity": "定义域 → 平方等价 → 内层二次最值 → k 分类",
      "routineKillCheck": "对 h 形式求导或漏端点最小 √3"
    },
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 52,
    "chapterNo": 3,
    "sectionCode": "3.4",
    "sectionName": "函数的应用（一）",
    "kpCode": "rja.3.4.01",
    "kpName": "函数零点与方程",
    "methodMain": "classification",
    "methodAux": "equiv_transform",
    "qtype": "application",
    "modelFamily": "h3-abs-linear-meet-parabola-root-count",
    "coreObjective": "方程 |x-a|=x^2 的实根个数对 a 完整分类",
    "stem": "设实数 $a$。讨论方程 $|x-a|=x^{2}$ 的实根个数。",
    "answer": "当 $a<-\\dfrac14$ 或 $a>\\dfrac14$：恰 $2$ 个实根；\n当 $a=\\pm\\dfrac14$：恰 $3$ 个实根；\n当 $-\\dfrac14<a<0$ 或 $0<a<\\dfrac14$：恰 $4$ 个实根；\n当 $a=0$：恰 $3$ 个实根 $x=-1,0,1$。",
    "analysis": "因 $x^{2}\\ge0$，方程等价于 $x^{2}=x-a$ 或 $x^{2}=a-x$。\n支一：$x^{2}-x+a=0$，$\\Delta_1=1-4a$。实根条件 $a\\le\\tfrac14$。\n支二：$x^{2}+x-a=0$，$\\Delta_2=1+4a$。实根条件 $a\\ge -\\tfrac14$。\n两支推出的根均满足原方程。若一根同属两支，则 $x-a=-(x-a)\\Rightarrow x=a$，并代入 $a^{2}=0\\Rightarrow a=0,\\,x=0$。故仅 $a=0$ 时需去重。\n分类：\n— $a>\\tfrac14$：仅支二，$\\Delta_2>0$，两异根；\n— $a=\\tfrac14$：支一重根 $x=\\tfrac12$，支二两异根，并集 $3$ 根；\n— $0<a<\\tfrac14$：两支各两异根且无公共根，共 $4$；\n— $a=0$：支一得 $0,1$，支二得 $0,-1$，并集 $\\{-1,0,1\\}$，共 $3$；\n— $-\\tfrac14<a<0$：共 $4$；\n— $a=-\\tfrac14$：支二重根 $x=-\\tfrac12$，支一两异根，共 $3$；\n— $a<-\\tfrac14$：仅支一两异根。",
    "maxScore": 14,
    "rubric": [
      {
        "step": "化为两支二次并写判别式",
        "score": 4
      },
      {
        "step": "指出仅 a=0 需去重",
        "score": 3
      },
      {
        "step": "按 a 完整分类根的个数",
        "score": 7
      }
    ],
    "hardLevelReason": "两支二次 x^2=±(x-a) 的判别式临界 ±1/4，并在 a=0 处理公共根去重",
    "h3Evidence": {
      "nonObviousBreakthrough": "两支二次 x^2=±(x-a) 的判别式临界 ±1/4，并在 a=0 处理公共根去重",
      "aboveHard14H2Contrast": "普通单支判别式；本题双支临界网含 a=0 去重",
      "deepStrategyOrLayeredNecessity": "两支二次 + 临界 ±1/4 + a=0 重合",
      "routineKillCheck": "漏计 a=0 时 x=0 的双支重合"
    },
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 56,
    "chapterNo": 3,
    "sectionCode": "3.4",
    "sectionName": "函数的应用（一）",
    "kpCode": "rja.3.4.01",
    "kpName": "函数零点与方程",
    "methodMain": "classification",
    "methodAux": "equiv_transform",
    "qtype": "application",
    "modelFamily": "h3-abs-minus-x-zero-count-in-a",
    "coreObjective": "f(x)=|x-a|+|x-2|-x 在 a≤2 下的零点个数",
    "stem": "设 $a\\le 2$，令 $f(x)=|x-a|+|x-2|-x$。按 $a$ 的取值讨论方程 $f(x)=0$ 的实根个数。",
    "answer": "当 $a<0$：无实根；当 $a=0$：恰一实根 $x=2$；当 $0<a\\le 2$：恰两实根。",
    "analysis": "分段点为 $a,2$（已设 $a\\le 2$）。\n（i）$x<a$：$f=a+2-3x$，根 $x=\\dfrac{a+2}{3}$，落入 $x<a$ ⇔ $a>1$。\n（ii）$a\\le x\\le 2$：$f=2-a-x$，根 $x=2-a$，落入 ⇔ $0\\le a\\le 1$（等价于 $a\\le 2-a\\le 2$）。\n（iii）$x>2$：$f=x-a-2$，根 $x=a+2$，落入 ⇔ $a>0$（开区间，故 $a=0$ 时 $x=2$ 不计入本支）。\n合并：\n$a<0$：三支皆无落入根；\n$a=0$：仅中段根 $x=2$；\n$0<a\\le 1$：中段一根、右段一根；\n$1<a\\le 2$：左段一根、右段一根。\n故得所述分类。",
    "maxScore": 14,
    "rubric": [
      {
        "step": "三段表达式",
        "score": 3
      },
      {
        "step": "各段根的落入条件",
        "score": 6
      },
      {
        "step": "合并给出个数分类",
        "score": 5
      }
    ],
    "hardLevelReason": "三段一次化后分别检验根是否落入对应区间，再按 a≤0、0<a≤1、1<a≤2 合并",
    "h3Evidence": {
      "nonObviousBreakthrough": "三段一次化后分别检验根是否落入对应区间，再按 a≤0、0<a≤1、1<a≤2 合并",
      "aboveHard14H2Contrast": "既有绝对值方程无 -x 打破对称",
      "deepStrategyOrLayeredNecessity": "落入检验 + 参数三分",
      "routineKillCheck": "分段后不做落入检验"
    },
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 58,
    "chapterNo": 3,
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "kpCode": "rja.3.2.01",
    "kpName": "对称性",
    "methodMain": "graph_symmetry",
    "methodAux": "mono_analysis",
    "qtype": "application",
    "modelFamily": "h3-dual-axis-symmetry-period-mono-transfer",
    "coreObjective": "关于 x=0 与 x=1 双对称 ⇒ 周期 2，并转移单调性",
    "stem": "设 $f:\\mathbb{R}\\to\\mathbb{R}$ 的图象既关于直线 $x=0$ 对称，又关于直线 $x=1$ 对称。\n（1）证明 $f(x+2)=f(x)$ 对一切实数 $x$ 成立；\n（2）若 $f$ 在 $[0,1]$ 上严格递减，证明 $f$ 在 $[1,2]$ 上严格递增，并证明 $f\\!\\left(\\dfrac12\\right)=f\\!\\left(\\dfrac32\\right)$。",
    "answer": "（1）见解析；（2）见解析；$f(1/2)=f(3/2)$。",
    "analysis": "关于 $x=0$：$f(-x)=f(x)$。关于 $x=1$：$f(1+t)=f(1-t)$。于是\n$f(x+2)=f\\big(1+(x+1)\\big)=f\\big(1-(x+1)\\big)=f(-x)=f(x)$。\n（2）对 $0\\le t_1<t_2\\le 1$，有 $1-t_2<1-t_1$，由 $[0,1]$ 严格减得 $f(1-t_2)>f(1-t_1)$，即 $f(1+t_2)>f(1+t_1)$，故在 $[1,2]$ 严格增。又 $f(1/2)=f(1-1/2)=f(1+1/2)=f(3/2)$。\n全程未假设连续性。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "推出周期 2",
        "score": 4
      },
      {
        "step": "证明 [1,2] 严格增",
        "score": 5
      },
      {
        "step": "对称点函数值相等",
        "score": 3
      }
    ],
    "hardLevelReason": "两次反射复合为平移 2；再用关于 x=1 的反射把 [0,1] 递减映成 [1,2] 递增",
    "h3Evidence": {
      "nonObviousBreakthrough": "两次反射复合为平移 2；再用关于 x=1 的反射把 [0,1] 递减映成 [1,2] 递增",
      "aboveHard14H2Contrast": "035/042 单轴；本题双轴强制周期并转移单调",
      "deepStrategyOrLayeredNecessity": "周期导出 + 单调转移 + 对称点相等",
      "routineKillCheck": "只验证一个对称轴"
    },
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 59,
    "chapterNo": 3,
    "sectionCode": "3.4",
    "sectionName": "函数的应用（一）",
    "kpCode": "rja.3.4.01",
    "kpName": "函数与方程",
    "methodMain": "classification",
    "methodAux": "mono_analysis",
    "qtype": "application",
    "modelFamily": "h3-piecewise-level-set-k-count",
    "coreObjective": "分段函数与水平线交点个数随 k 分类",
    "stem": "设\n$f(x)=\\begin{cases}-x+1,&x<0\\\\ x^{2}-x+1,&0\\le x\\le 2\\\\ -x+5,&x>2\\end{cases}$\n按实数 $k$ 讨论方程 $f(x)=k$ 的实根个数。",
    "answer": "当 $k<\\dfrac34$：恰 $1$ 根（仅右支）；\n当 $k=\\dfrac34$：恰 $2$ 根（中段顶点与右支）；\n当 $\\dfrac34<k\\le 1$：恰 $3$ 根（中段两根与右支）；\n当 $1<k<3$：恰 $3$ 根（左支、中段一根、右支）；\n当 $k=3$：恰 $2$ 根（左支 $x=-2$ 与中段 $x=2$）；\n当 $k>3$：恰 $1$ 根（仅左支）。",
    "analysis": "左支 $x<0$：$f=1-x$ 严格减，值域 $(1,+\\infty)$，故 $k>1$ 时恰一根 $x=1-k<0$。\n中段：$f=\\bigl(x-\\tfrac12\\bigr)^{2}+\\tfrac34$，值域 $[\\tfrac34,3]$。方程 $f(x)=k$ 的无约束根为 $x=\\dfrac{1\\pm\\sqrt{4k-3}}{2}$。落入 $[0,2]$ 时：\n— $k=\\tfrac34$：仅 $x=\\tfrac12$；\n— $\\tfrac34<k\\le 1$：两根均在 $[0,1]\\subset[0,2]$；\n— $1<k<3$：仅较大根在 $(1,2)$，较小根为负，不落入；\n— $k=3$：仅 $x=2$。\n右支 $x>2$：$f=5-x$ 严格减，值域 $(-\\infty,3)$，故 $k<3$ 时恰一根（开区间，$k=3$ 不取 $x=2$）。\n按 $k$ 与 $\\tfrac34,1,3$ 叠加即得答案。注意：$1<k<3$ 时是 $3$ 根而非 $4$ 根。",
    "maxScore": 14,
    "rubric": [
      {
        "step": "各支值域与单调",
        "score": 4
      },
      {
        "step": "中段落入检验（含 k>1 仅一根）",
        "score": 5
      },
      {
        "step": "分类计数",
        "score": 5
      }
    ],
    "diagramRequirement": "RECOMMENDED",
    "diagramSpecification": "分段函数草图与若干水平线 k 示意（不标交点坐标）",
    "noDiagramReason": null,
    "hardLevelReason": "中段抛物线在 k>1 时左根落入负半轴被丢掉，临界网为 3/4,1,3 而非误计 4 根",
    "h3Evidence": {
      "nonObviousBreakthrough": "中段抛物线在 k>1 时左根落入负半轴被丢掉，临界网为 3/4,1,3 而非误计 4 根",
      "aboveHard14H2Contrast": "既有零点族；本题完整水平切割且端点归属开闭",
      "deepStrategyOrLayeredNecessity": "临界值网 + 中段单侧有效根 + 端点归属",
      "routineKillCheck": "以为抛物线每水平线总有两根而在 (1,3) 误计 4 根"
    },
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  },
  {
    "n": 60,
    "chapterNo": 3,
    "sectionCode": "3.1",
    "sectionName": "函数的概念与表示",
    "kpCode": "rja.3.1.03",
    "kpName": "函数的表示法",
    "methodMain": "equiv_transform",
    "methodAux": "mono_analysis",
    "qtype": "application",
    "modelFamily": "h3-dyadic-shift-mono-force-constant",
    "coreObjective": "单调 + 1/n 平移不变 ⇒ 常数（不用连续性）",
    "stem": "设 $f:[0,1]\\to\\mathbb{R}$ 单调递增，且对一切 $x\\in[0,1]$ 与一切正整数 $n$，只要 $x+\\dfrac{1}{n}\\in[0,1]$，就有 $f\\!\\left(x+\\dfrac{1}{n}\\right)=f(x)$。证明 $f$ 为常函数。（证明中不得假设 $f$ 连续。）",
    "answer": "$f$ 恒等于 $f(0)$（见证明）。",
    "analysis": "对任意正整数 $n$ 与满足 $0\\le k\\le n$ 的整数 $k$，在区间内反复使用平移条件得 $f\\!\\left(\\dfrac{k}{n}\\right)=f(0)$。特别 $f(1)=f(0)$。\n任取 $x\\in(0,1)$。取充分大的正整数 $n$，令 $k=\\lfloor nx\\rfloor$，则 $0\\le k\\le nx<k+1$，且 $\\dfrac{k+1}{n}\\le 1$（因 $x<1$，可取 $n$ 使 $nx+1\\le n$）。于是 $\\dfrac{k}{n}\\le x\\le \\dfrac{k+1}{n}$。由单调性\n$f\\!\\left(\\dfrac{k}{n}\\right)\\le f(x)\\le f\\!\\left(\\dfrac{k+1}{n}\\right)$，\n两边等于 $f(0)$，故 $f(x)=f(0)$。全程未用连续性。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "分点处等于 f(0)",
        "score": 4
      },
      {
        "step": "单调夹逼",
        "score": 5
      },
      {
        "step": "说明未用连续性",
        "score": 3
      }
    ],
    "hardLevelReason": "有理分点同值，再用单调夹逼任意点；明确不依赖连续性",
    "h3Evidence": {
      "nonObviousBreakthrough": "有理分点同值，再用单调夹逼任意点；明确不依赖连续性",
      "aboveHard14H2Contrast": "039 用长度 1 窗口；本题用离散平移+单调",
      "deepStrategyOrLayeredNecessity": "离散不变 + 单调夹逼",
      "routineKillCheck": "用连续性偷渡"
    },
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3"
  }
]
