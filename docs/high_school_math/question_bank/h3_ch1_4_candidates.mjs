/** H3 redesign 1E offline candidates. Do NOT import without authorization.
 * Frozen PASS8 from 1D + new 1E ACCEPTED_H3 only. Honest underfill.
 * FIX-204-5I: analysis/rubric protocol repair for CAND-H3C14-204 only.
 */
export const phase = 'HS-MATH-H3-REDESIGN-1E'
export const independence = 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED'
export const status = "QUALITY_PARTIAL"
export const batchContentSha256 = "0460dd64b366d2a475a19317153d727968e8b5d94f4d741ab9f67c730fded24c"
export const hard14ReferenceSha = "d8d22ad0bcbac2dba134d417e6a3db5cd6407f256492155345330ae043025819"
export const frozenPass8Ids = ["CAND-H3C14-006","CAND-H3C14-013","CAND-H3C14-014","CAND-H3C14-018","CAND-H3C14-027","CAND-H3C14-046","CAND-H3C14-047","CAND-H3C14-060"]
export const candidates = [
  {
    "id": "CAND-H3C14-006",
    "chapterNo": 2,
    "modelFamily": "h3-root-open-interval-coupled-min-floor",
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
    "kpCode": "rja.2.3.05",
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "qtype": "application",
    "methodMain": "classification",
    "methodAux": "equiv_transform",
    "h3Evidence": {
      "nonObviousBreakthrough": "vertex-floor cuts open-root interval at (1+√11)/2",
      "aboveHard14H2Contrast": "root-distribution alone yields oversized (2,11/5)",
      "deepStrategyOrLayeredNecessity": "layer1 open roots → layer2 min-floor",
      "routineKillCheck": "only Δ/f(-1)/f(3) without min → wrong set"
    },
    "hardLevelReason": "根分布可行域被闭区间下界二次截断，必须分层联立。",
    "hardProfile": {
      "coreChallenge": "开区间根分布与闭区间下界耦合求参",
      "reasoningSteps": [
        "建模",
        "突破",
        "充要闭合",
        "检验"
      ],
      "difficultyEvidence": "根全在(-1,3)仅得 m∈(2,11/5)；闭区间 f≥-1/2 在轴落入时化为顶点约束，被 (1+√11)/2 截断。",
      "misconceptionTrap": "only Δ/f(-1)/f(3) without min → wrong set",
      "alternativeApproach": "分类/构造/对称转化",
      "verification": "边界与特例回代",
      "contentSha256": "81b28f1490ad8dd8d4c05d17d38bb813da3a268a50328b002635a203a36c9ab3"
    },
    "diagramRequirement": "NOT_NEEDED",
    "noDiagramReason": "文字自足",
    "designId": "H3-DESIGN-006",
    "book": "必修一",
    "specialtyCode": "rja-ch2",
    "kpInDb": true,
    "difficulty": 3,
    "hardLevel": "H3",
    "sourceType": "original",
    "sourceEvidence": "H3C14 原创；1E 冻结 PASS",
    "options": null,
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3",
    "compareDowngrade": {
      "structureType": "h3-root-open-interval-coupled-min-floor",
      "contrast": "root-distribution alone yields oversized (2,11/5)"
    },
    "authorMathNote": "FROZEN_PASS_FROM_1D"
  },
  {
    "id": "CAND-H3C14-013",
    "chapterNo": 2,
    "modelFamily": "h3-fixed-root-gap-interval-min-touch",
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
    "kpCode": "rja.2.3.04",
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "qtype": "application",
    "methodMain": "classification",
    "methodAux": "equiv_transform",
    "h3Evidence": {
      "nonObviousBreakthrough": "axis-in-interval ⇒ min≡-1 ≠1/4",
      "aboveHard14H2Contrast": "root-gap couples with touch-min",
      "deepStrategyOrLayeredNecessity": "kill interior-axis then endpoint cases",
      "routineKillCheck": "axis trichotomy without Δ link → miss contradiction"
    },
    "hardLevelReason": "Δ 与区间触最小值耦合，轴内情形被恒等式 −1 否定。",
    "hardProfile": {
      "coreChallenge": "根差固定与区间最小值恰触耦合定参",
      "reasoningSteps": [
        "建模",
        "突破",
        "充要闭合",
        "检验"
      ],
      "difficultyEvidence": "Δ=4 与顶点落入时最小值恒为 −1，与触 1/4 矛盾，故轴必须在区间外。",
      "misconceptionTrap": "axis trichotomy without Δ link → miss contradiction",
      "alternativeApproach": "分类/构造/对称转化",
      "verification": "边界与特例回代",
      "contentSha256": "652d8c81dd66ac2c463231ce4455e81d7318056c57e1dd869507a65276b4247a"
    },
    "diagramRequirement": "NOT_NEEDED",
    "noDiagramReason": "文字自足",
    "designId": "H3-DESIGN-013",
    "book": "必修一",
    "specialtyCode": "rja-ch2",
    "kpInDb": true,
    "difficulty": 3,
    "hardLevel": "H3",
    "sourceType": "original",
    "sourceEvidence": "H3C14 原创；1E 冻结 PASS",
    "options": null,
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3",
    "compareDowngrade": {
      "structureType": "h3-fixed-root-gap-interval-min-touch",
      "contrast": "root-gap couples with touch-min"
    },
    "authorMathNote": "FROZEN_PASS_FROM_1D"
  },
  {
    "id": "CAND-H3C14-014",
    "chapterNo": 2,
    "modelFamily": "h3-g-nonneg-on-f-root-interval-with-gap",
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
    "kpCode": "rja.2.3.01",
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "qtype": "application",
    "methodMain": "equiv_transform",
    "methodAux": "classification",
    "h3Evidence": {
      "nonObviousBreakthrough": "g(x2)=2x2(t-1) via f(x2)=0",
      "aboveHard14H2Contrast": "domain is root-interval of another quadratic",
      "deepStrategyOrLayeredNecessity": "sign-of-t cases plus gap cut",
      "routineKillCheck": "require Δ_g≤0 globally → wrong"
    },
    "hardLevelReason": "跨函数根区间恒成立，并用 f=0 化简端点值。",
    "hardProfile": {
      "coreChallenge": "在另一方程根区间上恒非负并限制根距",
      "reasoningSteps": [
        "建模",
        "突破",
        "充要闭合",
        "检验"
      ],
      "difficultyEvidence": "对 t≥1 轴落入得 g(1)=t−1≥0；对 t<0 用 f(x2)=0 化 g(x2)=2x2(t−1)<0 排除；再根距截断。",
      "misconceptionTrap": "require Δ_g≤0 globally → wrong",
      "alternativeApproach": "分类/构造/对称转化",
      "verification": "边界与特例回代",
      "contentSha256": "89be21ced2dc68531ed83a648d610e6e6737be22a9e59322d1bc9d25814de638"
    },
    "diagramRequirement": "NOT_NEEDED",
    "noDiagramReason": "文字自足",
    "designId": "H3-DESIGN-014",
    "book": "必修一",
    "specialtyCode": "rja-ch2",
    "kpInDb": true,
    "difficulty": 3,
    "hardLevel": "H3",
    "sourceType": "original",
    "sourceEvidence": "H3C14 原创；1E 冻结 PASS",
    "options": null,
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3",
    "compareDowngrade": {
      "structureType": "h3-g-nonneg-on-f-root-interval-with-gap",
      "contrast": "domain is root-interval of another quadratic"
    },
    "authorMathNote": "FROZEN_PASS_FROM_1D"
  },
  {
    "id": "CAND-H3C14-018",
    "chapterNo": 2,
    "modelFamily": "h3-abs-quad-best-constant-with-forbidden-eq",
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
    "kpCode": "rja.2.1.01",
    "sectionCode": "2.1",
    "sectionName": "等式性质与不等式性质",
    "qtype": "application",
    "methodMain": "equiv_transform",
    "methodAux": "special_value",
    "h3Evidence": {
      "nonObviousBreakthrough": "forbidding equality at |x|=1 removes maximizer",
      "aboveHard14H2Contrast": "H2 stops at λ_max=2; here no maximum",
      "deepStrategyOrLayeredNecessity": "best constant then topology of attainable set",
      "routineKillCheck": "still answer 2 in part (2) → wrong"
    },
    "hardLevelReason": "最大值存在性与等号禁止耦合，结论从“有最大”变为“无最大”。",
    "hardProfile": {
      "coreChallenge": "最佳常数与等号点禁止条件耦合",
      "reasoningSteps": [
        "建模",
        "突破",
        "充要闭合",
        "检验"
      ],
      "difficultyEvidence": "由 (|x|-1)²≥0 得 x²+1≥2|x|，最佳 λ=2；禁止 |x|=1 时严格不等式使任何 λ=2 失败，故无最大 λ 而只有上确界。",
      "misconceptionTrap": "still answer 2 in part (2) → wrong",
      "alternativeApproach": "分类/构造/对称转化",
      "verification": "边界与特例回代",
      "contentSha256": "67530024badb41dce8f8da109144f225140a77834f65ece9fb1f23556b00977a"
    },
    "diagramRequirement": "NOT_NEEDED",
    "noDiagramReason": "文字自足",
    "designId": "H3-DESIGN-018",
    "book": "必修一",
    "specialtyCode": "rja-ch2",
    "kpInDb": true,
    "difficulty": 3,
    "hardLevel": "H3",
    "sourceType": "original",
    "sourceEvidence": "H3C14 原创；1E 冻结 PASS",
    "options": null,
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3",
    "compareDowngrade": {
      "structureType": "h3-abs-quad-best-constant-with-forbidden-eq",
      "contrast": "H2 stops at λ_max=2; here no maximum"
    },
    "authorMathNote": "FROZEN_PASS_FROM_1D"
  },
  {
    "id": "CAND-H3C14-027",
    "chapterNo": 3,
    "modelFamily": "h3-reflection-sum-existence-mono",
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
    "kpCode": "rja.3.1.04",
    "sectionCode": "3.1",
    "sectionName": "函数的概念及其表示",
    "qtype": "application",
    "methodMain": "equiv_transform",
    "methodAux": "classification",
    "h3Evidence": {
      "nonObviousBreakthrough": "g(x)=g(1-x) is iff for existence",
      "aboveHard14H2Contrast": "existence criterion plus mono endpoint region",
      "deepStrategyOrLayeredNecessity": "symmetry → half-value → mono inequalities → construct",
      "routineKillCheck": "producing one particular f misses the range of f(0)"
    },
    "hardLevelReason": "存在性对称条件与单调端点可行域两层耦合。",
    "hardProfile": {
      "coreChallenge": "反射和方程的存在性判据与单调增解的端点约束",
      "reasoningSteps": [
        "建模",
        "突破",
        "充要闭合",
        "检验"
      ],
      "difficultyEvidence": "f(x)+f(1-x)=g(x) 有解 ⇔ g(x)=g(1-x)；在 g(x)=x(1-x) 且 f 于 [0,1] 递增时，由 f(1/2)=1/8 与 f(1)=-f(0) 得 f(0)≤-1/8。",
      "misconceptionTrap": "producing one particular f misses the range of f(0)",
      "alternativeApproach": "分类/构造/对称转化",
      "verification": "边界与特例回代",
      "contentSha256": "d04c21b8b9312ddbb87480434e144f7d9a4e4219fb6c24078567ce0900d1d533"
    },
    "diagramRequirement": "NOT_NEEDED",
    "noDiagramReason": "文字与符号推理自足。",
    "designId": "H3-DESIGN-027",
    "book": "必修一",
    "specialtyCode": "rja-ch3",
    "kpInDb": true,
    "difficulty": 3,
    "hardLevel": "H3",
    "sourceType": "original",
    "sourceEvidence": "H3C14 原创；1E 冻结 PASS",
    "options": null,
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3",
    "compareDowngrade": {
      "structureType": "h3-reflection-sum-existence-mono",
      "contrast": "existence criterion plus mono endpoint region"
    },
    "authorMathNote": "FROZEN_PASS_FROM_1D"
  },
  {
    "id": "CAND-H3C14-046",
    "chapterNo": 4,
    "modelFamily": "h3-log-domain-exist-forall-bite",
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
    "kpCode": "rja.4.4.02",
    "sectionCode": "4.4",
    "sectionName": "对数函数",
    "qtype": "application",
    "methodMain": "classification",
    "methodAux": "mono_analysis",
    "h3Evidence": {
      "nonObviousBreakthrough": "max on shrinking domain locks both exist and forall",
      "aboveHard14H2Contrast": "dual quantifier cut on a-dependent domain",
      "deepStrategyOrLayeredNecessity": "reduce to b=|a|; max=2 log2 b",
      "routineKillCheck": "routine log inequality on fixed ℝ → wrong or empty"
    },
    "hardLevelReason": "定义域半径与最值门槛咬合；存在/全称对同一最值给出双向截断，非套路化简。",
    "hardProfile": {
      "coreChallenge": "定义域随 a 伸缩时存在型与全称型对数不等式联立",
      "reasoningSteps": [
        "建模",
        "突破",
        "充要闭合",
        "检验"
      ],
      "difficultyEvidence": "D_f=(-|a|,|a|) 随 a 变；f 在中心最大、端点→−∞。存在 f≥1 要 |a|≥√2，全称 f≤3 要 |a|≤2√2，二者与定义域非空耦合。",
      "misconceptionTrap": "routine log inequality on fixed ℝ → wrong or empty",
      "alternativeApproach": "分类/构造/对称转化",
      "verification": "边界与特例回代",
      "contentSha256": "55592189e50a21c1aea7f54b955f478e97edbe64770f7df70c67b6f41aee1935"
    },
    "diagramRequirement": "NOT_NEEDED",
    "noDiagramReason": "文字与符号推理自足。",
    "designId": "H3-DESIGN-046",
    "book": "必修一",
    "specialtyCode": "rja-ch4",
    "kpInDb": true,
    "difficulty": 3,
    "hardLevel": "H3",
    "sourceType": "original",
    "sourceEvidence": "H3C14 原创；1E 冻结 PASS",
    "options": null,
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3",
    "compareDowngrade": {
      "structureType": "h3-log-domain-exist-forall-bite",
      "contrast": "dual quantifier cut on a-dependent domain"
    },
    "authorMathNote": "FROZEN_PASS_FROM_1D"
  },
  {
    "id": "CAND-H3C14-047",
    "chapterNo": 4,
    "modelFamily": "h3-log-quad-domain-R-base-split",
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
    "kpCode": "rja.4.4.03",
    "sectionCode": "4.4",
    "sectionName": "对数函数",
    "qtype": "application",
    "methodMain": "classification",
    "methodAux": "equiv_transform",
    "h3Evidence": {
      "nonObviousBreakthrough": "domain-R locks |a|<2; base flip; Δ_h tertiary split inside (0,1)",
      "aboveHard14H2Contrast": "chained domain-param then double-split inequality",
      "deepStrategyOrLayeredNecessity": "a*=2√2-2 cuts empty/point/interval",
      "routineKillCheck": "one-shot log simplify → miss empty branch for small a"
    },
    "hardLevelReason": "定义域恒正、底分类、再对 Δ_h 三分，三层耦合；解集拓扑含空集/单点/闭区间/双射线。",
    "hardProfile": {
      "coreChallenge": "二次真数恒正锁 a 后，按底分类解 f(x)≥1",
      "reasoningSteps": [
        "建模",
        "突破",
        "充要闭合",
        "检验"
      ],
      "difficultyEvidence": "定义域为 ℝ 迫使 Δ<a 的开口条件得 a∈(0,2)\\{1}；再按 a>1 / 0<a<1 翻转不等式，解集从“外侧两射线”变为“中间闭区间”。",
      "misconceptionTrap": "one-shot log simplify → miss empty branch for small a",
      "alternativeApproach": "分类/构造/对称转化",
      "verification": "边界与特例回代",
      "contentSha256": "5b9b5764776861b47c2af75abfbc3b2e3bc8a8e288b3a2d60eaebc8433fedfe7"
    },
    "diagramRequirement": "NOT_NEEDED",
    "noDiagramReason": "文字与符号推理自足。",
    "designId": "H3-DESIGN-047",
    "book": "必修一",
    "specialtyCode": "rja-ch4",
    "kpInDb": true,
    "difficulty": 3,
    "hardLevel": "H3",
    "sourceType": "original",
    "sourceEvidence": "H3C14 原创；1E 冻结 PASS",
    "options": null,
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3",
    "compareDowngrade": {
      "structureType": "h3-log-quad-domain-R-base-split",
      "contrast": "chained domain-param then double-split inequality"
    },
    "authorMathNote": "FROZEN_PASS_FROM_1D"
  },
  {
    "id": "CAND-H3C14-060",
    "chapterNo": 3,
    "modelFamily": "h3-dyadic-shift-mono-force-constant",
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
    "kpCode": "rja.3.1.03",
    "sectionCode": "3.1",
    "sectionName": "函数的概念与表示",
    "qtype": "application",
    "methodMain": "equiv_transform",
    "methodAux": "mono_analysis",
    "h3Evidence": {
      "nonObviousBreakthrough": "有理分点同值，再用单调夹逼任意点；明确不依赖连续性",
      "aboveHard14H2Contrast": "039 用长度 1 窗口；本题用离散平移+单调",
      "deepStrategyOrLayeredNecessity": "离散不变 + 单调夹逼",
      "routineKillCheck": "用连续性偷渡"
    },
    "hardLevelReason": "有理分点同值，再用单调夹逼任意点；明确不依赖连续性",
    "hardProfile": {
      "coreChallenge": "单调 + 1/n 平移不变 ⇒ 常数（不用连续性）",
      "reasoningSteps": [
        "建模",
        "突破",
        "充要闭合",
        "检验"
      ],
      "difficultyEvidence": "",
      "misconceptionTrap": "用连续性偷渡",
      "alternativeApproach": "分类/构造/对称转化",
      "verification": "边界与特例回代",
      "contentSha256": "a2da1f83cf18f435e9623bb33c7da7b72bea95c5abcaeaeba81e66b7cecad1b2"
    },
    "diagramRequirement": "NOT_NEEDED",
    "noDiagramReason": "文字自足",
    "designId": "H3-DESIGN-060",
    "book": "必修一",
    "specialtyCode": "rja-ch3",
    "kpInDb": true,
    "difficulty": 3,
    "hardLevel": "H3",
    "sourceType": "original",
    "sourceEvidence": "H3C14 原创；1E 冻结 PASS",
    "options": null,
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3",
    "compareDowngrade": {
      "structureType": "h3-dyadic-shift-mono-force-constant",
      "contrast": "039 用长度 1 窗口；本题用离散平移+单调"
    },
    "authorMathNote": "FROZEN_PASS_FROM_1D"
  },
  {
    "id": "CAND-H3C14-101",
    "designId": "H3-DESIGN-101",
    "book": "必修一",
    "chapterNo": 2,
    "specialtyCode": "rja-ch2",
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.05",
    "kpName": "根的分布",
    "kpInDb": true,
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H3",
    "hardLevelReason": "平方和割线与根分布多边形的相对位置随 s 跨越 1 改变，必须分段证明蕴含关系",
    "methodMain": "classification",
    "methodAux": "equiv_transform",
    "sourceType": "original",
    "sourceEvidence": "H3C14-1E 原创；非真题复制",
    "stem": "设 $f(x)=x^{2}-sx+p$。求使下列两条件同时成立的 $(s,p)$ 的集合：\n（1）$f(x)=0$ 有两个不相等实根，且都属于 $(0,1)$；\n（2）两根 $x_1,x_2$ 满足 $x_1^{2}+x_2^{2}\\ge\\dfrac12$。",
    "options": null,
    "answer": "$s\\in\\left(\\sqrt{\\dfrac12},1\\right)$ 且 $0<p\\le\\dfrac{s^{2}}{2}-\\dfrac14$；\n或 $s\\in[1,2)$ 且 $\\max(0,s-1)<p<\\dfrac{s^{2}}{4}$（当 $s\\in[1,2)$ 时下界为 $s-1$）。",
    "analysis": "（1）开口向上两异根∈(0,1) ⇔ $\\Delta=s^{2}-4p>0$，$p>0$，$f(1)=1-s+p>0$，$0<s<2$。即 $0<s<2$，$\\max(0,s-1)<p<\\dfrac{s^{2}}{4}$。\n（2）$s^{2}-2p\\ge\\tfrac12\\Leftrightarrow p\\le\\dfrac{s^{2}}{2}-\\dfrac14$。\n比较上界：$\\dfrac{s^{2}}{2}-\\dfrac14-\\dfrac{s^{2}}{4}=\\dfrac14(s^{2}-1)$。\n当 $s\\in\\bigl(\\sqrt{\\tfrac12},1\\bigr)$：$\\dfrac{s^{2}}{2}-\\dfrac14\\in\\bigl(0,\\dfrac{s^{2}}{4}\\bigr)$，故（2）把上界收到 $\\dfrac{s^{2}}{2}-\\dfrac14$，下界仍为 $0$。\n当 $s\\in[1,2)$：$\\dfrac{s^{2}}{2}-\\dfrac14\\ge\\dfrac{s^{2}}{4}$，故只要（1）成立就自动有 $s^{2}-2p>\\dfrac{s^{2}}{2}\\ge\\tfrac12$，（2）不新增约束；下界为 $s-1$。\n当 $s\\le\\sqrt{\\tfrac12}$：$\\dfrac{s^{2}}{2}-\\dfrac14\\le0$，与 $p>0$ 无法同时满足（2）。\n$s\\to2^{-}$ 时（1）的 $p$ 区间退化。",
    "maxScore": 14,
    "rubric": [
      {
        "step": "根分布充要",
        "score": 4
      },
      {
        "step": "平方和化为 p 上界",
        "score": 3
      },
      {
        "step": "比较两上界并分段",
        "score": 5
      },
      {
        "step": "说明 s≥1 时（2）自动",
        "score": 2
      }
    ],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3",
    "compareDowngrade": {
      "structureType": "h3-open-unit-roots-sumsq-cut-only-when-s-lt-1",
      "contrast": "root-distribution alone keeps too many (s,p) when s<1"
    },
    "hardProfile": {
      "coreChallenge": "两根∈(0,1) 与平方和下界耦合；证明仅 s<1 时后者真正截断",
      "reasoningSteps": [
        "建模",
        "突破",
        "充要闭合",
        "检验"
      ],
      "difficultyEvidence": "根分布可行域上 s²-2p≥1/2 仅在 s∈(√(1/2),1) 改变上界；s∈[1,2) 时被 Δ 边界蕴含",
      "misconceptionTrap": "omitting the implication check over-cuts when s≥1",
      "alternativeApproach": "分类/构造/对称转化",
      "verification": "边界与特例回代",
      "contentSha256": "74525b10d2d5da12fb4b271422852c3d34b79dd67d275e65029e81273064910e"
    },
    "h3Evidence": {
      "nonObviousBreakthrough": "sum-of-squares cut binds only for s∈(√(1/2),1); for s∈[1,2) implied by Δ-boundary",
      "aboveHard14H2Contrast": "root-distribution alone keeps too many (s,p) when s<1",
      "deepStrategyOrLayeredNecessity": "feasible polygon → compare ceilings → case split at s=1",
      "routineKillCheck": "omitting the implication check over-cuts when s≥1"
    },
    "modelFamily": "h3-open-unit-roots-sumsq-cut-only-when-s-lt-1",
    "authorMathNote": "H3 redesign 1E dual-gate"
  },
  {
    "id": "CAND-H3C14-102",
    "designId": "H3-DESIGN-102",
    "book": "必修一",
    "chapterNo": 2,
    "specialtyCode": "rja-ch2",
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.04",
    "kpName": "根的分布",
    "kpInDb": true,
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H3",
    "hardLevelReason": "充要闭合依赖“较小根>1”与端点条件的等价性，而不是停在片面韦达",
    "methodMain": "classification",
    "methodAux": "equiv_transform",
    "sourceType": "original",
    "sourceEvidence": "H3C14-1E 原创；非真题复制",
    "stem": "设实数 $m$，方程 $x^{2}-2mx+(m+1)=0$ 的实根集为 $R_m$。求使 $R_m\\ne\\varnothing$ 且 $\\forall x\\in R_m\\ (x>1)$ 成立的 $m$ 的集合。",
    "options": null,
    "answer": "$m\\in\\left[\\dfrac{1+\\sqrt{5}}{2},\\,2\\right)$",
    "analysis": "记 $f(x)=x^{2}-2mx+(m+1)$。实根需 $\\Delta=4(m^{2}-m-1)\\ge0$，即 $m\\le\\dfrac{1-\\sqrt5}{2}$ 或 $m\\ge\\dfrac{1+\\sqrt5}{2}$。\n若全体实根 $>1$（开口向上）：必须 $f(1)>0$，对称轴 $m>1$，积 $m+1>1$，和 $2m>2$。即 $m<2$，$m>1$。与 Δ 的右侧支求交得候选 $m\\in\\bigl[\\dfrac{1+\\sqrt5}{2},2\\bigr)$。\n充分性：对该区间，$\\Delta\\ge0$，且 $f(1)=2-m>0$（$m<2$）。较小根为 $m-\\sqrt{m^{2}-m-1}$（$\\Delta=0$ 时就是 $m$）。当 $\\Delta>0$ 时比较 $m-1$ 与 $\\sqrt{m^{2}-m-1}$：$(m-1)^{2}-(m^{2}-m-1)=2-m>0$，故 $m-1>\\sqrt{\\cdots}$，从而较小根 $=m-\\sqrt{\\cdots}>1$。较大根更大于 $1$。$\\Delta=0$ 时根 $m=\\dfrac{1+\\sqrt5}{2}>1$。\n$m=2$ 时根为 $1,3$，含 $1$，不满足严格 $>$。左侧 Δ 支 $m\\le\\dfrac{1-\\sqrt5}{2}<0$ 使和 $2m\\le0$，不可能两根都 $>1$。\n故所求为 $\\bigl[\\dfrac{1+\\sqrt5}{2},2\\bigr)$。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "Δ 与两根>1 的必要条件",
        "score": 4
      },
      {
        "step": "求交得候选区间",
        "score": 3
      },
      {
        "step": "平方比较证充分并排除 m=2",
        "score": 5
      }
    ],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3",
    "compareDowngrade": {
      "structureType": "h3-all-roots-gt-one-forces-empty-after-delta",
      "contrast": "H2 stops at f(1)>0 and axis>1; closing sufficiency needs the square comparison"
    },
    "hardProfile": {
      "coreChallenge": "全体实根>1：Δ 与端点/轴/韦达联立；再用平方比较证明较小根>1 与候选一致",
      "reasoningSteps": [
        "建模",
        "突破",
        "充要闭合",
        "检验"
      ],
      "difficultyEvidence": "必要条件给出 m∈[φ,2)；平方差 2-m>0 证明较小根>1，从而必要条件亦充分；m=2 因根=1 被开条件排除",
      "misconceptionTrap": "claiming empty set or closed [φ,2] both wrong",
      "alternativeApproach": "分类/构造/对称转化",
      "verification": "边界与特例回代",
      "contentSha256": "1d4d4c0df7c67ace2b5f577fba027983b66cdc60f9bc29a7fab6ae2da018d0fa"
    },
    "h3Evidence": {
      "nonObviousBreakthrough": "necessity interval becomes sufficient only after proving smaller root >1 via (m-1)^2−(Δ/4)=2−m",
      "aboveHard14H2Contrast": "H2 stops at f(1)>0 and axis>1; closing sufficiency needs the square comparison",
      "deepStrategyOrLayeredNecessity": "Δ ∩ Vieta necessity → square identity → open at m=2",
      "routineKillCheck": "claiming empty set or closed [φ,2] both wrong"
    },
    "modelFamily": "h3-all-roots-gt-one-forces-empty-after-delta",
    "authorMathNote": "H3 redesign 1E dual-gate"
  },
  {
    "id": "CAND-H3C14-104",
    "designId": "H3-DESIGN-104",
    "book": "必修一",
    "chapterNo": 2,
    "specialtyCode": "rja-ch2",
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.05",
    "kpName": "根的分布",
    "kpInDb": true,
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H3",
    "hardLevelReason": "固定积把二维问题降成一维符号网，开闭依赖开区间",
    "methodMain": "classification",
    "methodAux": "vieta",
    "sourceType": "original",
    "sourceEvidence": "H3C14-1E 原创；非真题复制",
    "stem": "设 $f(x)=x^{2}+ax+b$。方程 $f(x)=0$ 有两不等实根，一根属于 $(-2,0)$，另一根属于 $(1,3)$，且两根之积为 $-2$。求所有有序对 $(a,b)$。",
    "options": null,
    "answer": "$b=-2$ 且 $a\\in\\left(-\\dfrac{7}{3},1\\right)$",
    "analysis": "积 $b=-2$。开口向上、一根∈(-2,0)、一根∈(1,3) 的充要：\n$f(-2)>0$，$f(0)<0$，$f(1)<0$，$f(3)>0$。\n$f(0)=-2<0$ 恒真。\n$f(-2)=4-2a-2=2-2a>0\\Leftrightarrow a<1$。\n$f(1)=1+a-2=a-1<0\\Leftrightarrow a<1$。\n$f(3)=9+3a-2=7+3a>0\\Leftrightarrow a>-\\dfrac73$。\n$\\Delta=a^{2}+8>0$ 恒真。\n端点：$a\\to1^{-}$ 时正根$\\to1^{+}$；$a\\to(-7/3)^{+}$ 时正根$\\to3^{-}$。均不含端点。\n故 $(a,b)\\in\\bigl(-7/3,1\\bigr)\\times\\{-2\\}$。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "锁定 b=-2",
        "score": 2
      },
      {
        "step": "四端点符号条件",
        "score": 5
      },
      {
        "step": "化简开区间并说明开闭",
        "score": 5
      }
    ],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3",
    "compareDowngrade": {
      "structureType": "h3-dual-gap-straddle-with-fixed-product",
      "contrast": "single-gap root location H2; dual-gap + product is layered"
    },
    "hardProfile": {
      "coreChallenge": "一根∈(-2,0)、一根∈(1,3) 且积=-2",
      "reasoningSteps": [
        "建模",
        "突破",
        "充要闭合",
        "检验"
      ],
      "difficultyEvidence": "积锁定 b 后，四端点符号网化成 a 的开区间，端点开闭由开区间根位置决定",
      "misconceptionTrap": "using closed endpoints includes a=1 or a=-7/3 illegally",
      "alternativeApproach": "分类/构造/对称转化",
      "verification": "边界与特例回代",
      "contentSha256": "1912d2b72a2393257ff1499b734503b7ceaff681af299154b1e81b0f46477366"
    },
    "h3Evidence": {
      "nonObviousBreakthrough": "fixed product collapses to a 1D sign net with open endpoints",
      "aboveHard14H2Contrast": "single-gap root location H2; dual-gap + product is layered",
      "deepStrategyOrLayeredNecessity": "Vieta product → four endpoint inequalities → open interval",
      "routineKillCheck": "using closed endpoints includes a=1 or a=-7/3 illegally"
    },
    "modelFamily": "h3-dual-gap-straddle-with-fixed-product",
    "authorMathNote": "H3 redesign 1E dual-gate"
  },
  {
    "id": "CAND-H3C14-108",
    "designId": "H3-DESIGN-108",
    "book": "必修一",
    "chapterNo": 2,
    "specialtyCode": "rja-ch2",
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.05",
    "kpName": "根的分布",
    "kpInDb": true,
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H3",
    "hardLevelReason": "三条件耦合后平方变形需验证等价性方向",
    "methodMain": "equiv_transform",
    "methodAux": "classification",
    "sourceType": "original",
    "sourceEvidence": "H3C14-1E 原创；非真题复制",
    "stem": "设 $f(x)=x^{2}-sx+p$。求使下列条件同时成立的 $(s,p)$ 集合：\n（1）方程有两个不等实根且异号；\n（2）两根之和 $s\\le0$；\n（3）正的那个根 $\\ge2$。",
    "options": null,
    "answer": "$s\\le0$ 且 $p\\le2s-4$",
    "analysis": "（1）⇔$p<0$ 且 $\\Delta=s^{2}-4p>0$（$p<0$ 时 Δ 自动 $>s^{2}\\ge0$，且根不等）。\n异号时正根为较大根 $\\dfrac{s+\\sqrt{\\Delta}}{2}$。\n（3）⇔$s+\\sqrt{\\Delta}\\ge4$。在 $s\\le0$ 时 $4-s>0$，移项 $\\sqrt{\\Delta}\\ge4-s$，两边非负可平方：$s^{2}-4p\\ge16-8s+s^{2}\\Leftrightarrow p\\le2s-4$。\n反之，若 $s\\le0$ 且 $p\\le2s-4$，则 $p<0$ 自动（因 $2s-4\\le-4$），Δ$>0$，且平方步骤可逆，得正根≥2。\n故充要为 $s\\le0$ 且 $p\\le2s-4$。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "异号⇔p<0",
        "score": 3
      },
      {
        "step": "正根公式与不等式",
        "score": 4
      },
      {
        "step": "平方得充要并检验",
        "score": 5
      }
    ],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3",
    "compareDowngrade": {
      "structureType": "h3-opposite-sign-roots-sum-nonpos-posroot-ge2",
      "contrast": "sign-only or sum-only is H2; third bound forces conversion"
    },
    "hardProfile": {
      "coreChallenge": "异号根+和≤0+正根≥2 的充要半平面",
      "reasoningSteps": [
        "建模",
        "突破",
        "充要闭合",
        "检验"
      ],
      "difficultyEvidence": "较大根公式平方后得 p≤2s-4，与 p<0,s≤0 合成",
      "misconceptionTrap": "forgetting reversibility of square misstates boundary",
      "alternativeApproach": "分类/构造/对称转化",
      "verification": "边界与特例回代",
      "contentSha256": "20033ccc99b1900b5b2dff7d5e884856cbfe08097f1b2d385a66cb81ae74596f"
    },
    "h3Evidence": {
      "nonObviousBreakthrough": "squaring larger-root inequality yields half-plane coupled with s≤0",
      "aboveHard14H2Contrast": "sign-only or sum-only is H2; third bound forces conversion",
      "deepStrategyOrLayeredNecessity": "p<0 + s≤0 + larger root ≥2 → equivalent half-plane",
      "routineKillCheck": "forgetting reversibility of square misstates boundary"
    },
    "modelFamily": "h3-opposite-sign-roots-sum-nonpos-posroot-ge2",
    "authorMathNote": "H3 redesign 1E dual-gate"
  },
  {
    "id": "CAND-H3C14-201",
    "designId": "H3-DESIGN-201",
    "book": "必修一",
    "chapterNo": 3,
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "kpCode": "rja.3.2.01",
    "kpName": "奇偶性与单调性",
    "kpInDb": true,
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H3",
    "hardLevelReason": "避免介值偷渡；存在性来自奇性代数，唯一性来自严增",
    "methodMain": "parity_apply",
    "methodAux": "mono_analysis",
    "sourceType": "original",
    "sourceEvidence": "H3C14-1E 原创；非真题复制",
    "stem": "设 $f:\\mathbb{R}\\to\\mathbb{R}$ 为奇函数且严格递增。证明方程 $f(x)+f(x-1)=0$ 有且仅有一个实根，并求出该根。",
    "options": null,
    "answer": "唯一实根 $x=\\dfrac12$",
    "analysis": "奇性⇒$f(-t)=-f(t)$。取 $x=\\tfrac12$：$f(\\tfrac12)+f(-\\tfrac12)=0$，故为根。\n若 $f(y)+f(y-1)=0$，则 $f(y)=-f(y-1)=f(1-y)$。严格增⇒$y=1-y$⇒$y=\\tfrac12$。\n未使用连续性。",
    "maxScore": 10,
    "rubric": [
      {
        "step": "验证中点是根",
        "score": 3
      },
      {
        "step": "严格增得唯一",
        "score": 5
      },
      {
        "step": "指出未用连续",
        "score": 2
      }
    ],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3",
    "compareDowngrade": {
      "structureType": "h3-odd-inc-midpoint-root-unique-no-continuity",
      "contrast": "H2 often assumes continuity to get existence"
    },
    "hardProfile": {
      "coreChallenge": "奇+严增 ⇒ f(x)+f(x-1)=0 恰一根 x=1/2（不用连续）",
      "reasoningSteps": [
        "建模",
        "突破",
        "充要闭合",
        "检验"
      ],
      "difficultyEvidence": "奇性直接给出中点根；严增把 f(y)=f(1-y) 逼成 y=1/2",
      "misconceptionTrap": "invoking IVT on g(x)=f(x)+f(x-1) without continuity is invalid",
      "alternativeApproach": "分类/构造/对称转化",
      "verification": "边界与特例回代",
      "contentSha256": "cb63bebfa83bd47d920e3eba5a4e7ce713615a10041d9cfc874a9611ae52d59b"
    },
    "h3Evidence": {
      "nonObviousBreakthrough": "oddness supplies the root; strict mono supplies uniqueness — no IVT",
      "aboveHard14H2Contrast": "H2 often assumes continuity to get existence",
      "deepStrategyOrLayeredNecessity": "evaluate midpoint → f(y)=f(1-y) → uniqueness",
      "routineKillCheck": "invoking IVT on g(x)=f(x)+f(x-1) without continuity is invalid"
    },
    "modelFamily": "h3-odd-inc-midpoint-root-unique-no-continuity",
    "authorMathNote": "H3 redesign 1E dual-gate"
  },
  {
    "id": "CAND-H3C14-202",
    "designId": "H3-DESIGN-202",
    "book": "必修一",
    "chapterNo": 3,
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.1",
    "sectionName": "函数的概念与表示",
    "kpCode": "rja.3.1.04",
    "kpName": "函数性质",
    "kpInDb": true,
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H3",
    "hardLevelReason": "存在性与唯一性拆分，连续只用于（3）",
    "methodMain": "equiv_transform",
    "methodAux": "mono_analysis",
    "sourceType": "original",
    "sourceEvidence": "H3C14-1E 原创；非真题复制",
    "stem": "设 $f:[0,1]\\to[0,1]$ 满足 $f(f(x))=x$（$x\\in[0,1]$），且 $f$ 严格递减。\n（1）证明 $f(0)=1$，$f(1)=0$；\n（2）证明 $f$ 至多一个不动点；\n（3）若再设 $f$ 连续，证明恰有一个不动点。",
    "options": null,
    "answer": "（1）（2）（3）见解析。",
    "analysis": "（1）$f$ 为双射。由严格递减，$f(0)$ 为最大值，故 $f(0)=1$；同理 $f(1)=0$。\n（2）若 $a<b$ 均为不动点，则 $f(a)>f(b)$⇒$a>b$ 矛盾。\n（3）$g(x)=f(x)-x$ 连续，$g(0)=1>0$，$g(1)=-1<0$，介值得一根；合（2）恰一。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "端点",
        "score": 4
      },
      {
        "step": "至多一不动点",
        "score": 3
      },
      {
        "step": "连续下存在",
        "score": 5
      }
    ],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3",
    "compareDowngrade": {
      "structureType": "h3-involution-strict-dec-endpoint-fixedpoint",
      "contrast": "bare involution problems rarely force f(0)=1 without mono"
    },
    "hardProfile": {
      "coreChallenge": "对合+严减锁定端点；连续假设下恰一不动点",
      "reasoningSteps": [
        "建模",
        "突破",
        "充要闭合",
        "检验"
      ],
      "difficultyEvidence": "严减对合⇒f(0)=1,f(1)=0；至多一不动点；连续写入后介值",
      "misconceptionTrap": "using IVT in (1)(2) without continuity is illicit",
      "alternativeApproach": "分类/构造/对称转化",
      "verification": "边界与特例回代",
      "contentSha256": "9c90e2e79c5809ea267193a5010a4d2b32a5e5b7730408fbc152d6ebaa5ed515"
    },
    "h3Evidence": {
      "nonObviousBreakthrough": "strict decrease + involution locks endpoints before fixed-point count",
      "aboveHard14H2Contrast": "bare involution problems rarely force f(0)=1 without mono",
      "deepStrategyOrLayeredNecessity": "bijection max → endpoints → uniqueness → IVT only if continuous",
      "routineKillCheck": "using IVT in (1)(2) without continuity is illicit"
    },
    "modelFamily": "h3-involution-strict-dec-endpoint-fixedpoint",
    "authorMathNote": "H3 redesign 1E dual-gate"
  },
  {
    "id": "CAND-H3C14-204",
    "designId": "H3-DESIGN-204",
    "book": "必修一",
    "chapterNo": 3,
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "kpCode": "rja.3.2.03",
    "kpName": "单调性",
    "kpInDb": true,
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H3",
    "hardLevelReason": "函数方程与单调性耦合；夹逼替代显式连续假设",
    "methodMain": "equiv_transform",
    "methodAux": "mono_analysis",
    "sourceType": "original",
    "sourceEvidence": "H3C14-1E 原创；非真题复制",
    "stem": "设 $f:\\mathbb{R}\\to\\mathbb{R}$ 严格递增，且对一切实数 $x,y$ 满足\n$$f\\!\\left(\\dfrac{x+y}{2}\\right)=\\dfrac{f(x)+f(y)}{2}.$$\n证明：存在常数 $c$，使对一切实数 $x$ 有 $f(x)=f(0)+cx$。并求 $c$ 用 $f(1)$ 表示。",
    "options": null,
    "answer": "$c=f(1)-f(0)$，$f(x)=f(0)+x\\bigl(f(1)-f(0)\\bigr)$",
    "analysis": "令 $c=f(1)-f(0)$，$g(x)=f(x)-f(0)-cx$。因 $f$ 严格递增，$f(1)>f(0)$，故必有 $c>0$（否则 $c\\le 0$ 推出 $f(1)\\le f(0)$，矛盾）。\n先验证 $g$ 亦满足中点等式：\n$$g\\!\\left(\\dfrac{x+y}{2}\\right)=f\\!\\left(\\dfrac{x+y}{2}\\right)-f(0)-c\\dfrac{x+y}{2}=\\dfrac{f(x)+f(y)}{2}-f(0)-c\\dfrac{x+y}{2}=\\dfrac{g(x)+g(y)}{2}.$$\n且 $g(0)=0$，$g(1)=0$。\n（一）整数点。由中点式取 $x=0,y=2$：$g(1)=\\dfrac{g(0)+g(2)}{2}\\Rightarrow g(2)=0$。归纳得对一切非负整数 $n$，$g(n)=0$。再取 $x=-1,y=1$：$g(0)=\\dfrac{g(-1)+g(1)}{2}\\Rightarrow g(-1)=0$，同理一切负整数亦有 $g(m)=0$。\n（二）二进有理。对固定正整数 $n$，断言：对 $k=0,1,\\ldots,2^{n}$ 有 $g\\!\\left(\\dfrac{k}{2^{n}}\\right)=0$。$n=0$ 已含于 $g(0)=g(1)=0$。若对某 $n$ 成立，则对相邻端点取中点得 $g\\!\\left(\\dfrac{2k+1}{2^{n+1}}\\right)=0$，从而对 $n+1$ 成立。故对一切二进有理 $r\\in[0,1]$，$g(r)=0$，即 $f(r)=f(0)+cr$。\n对任意整数 $m$ 与二进有理 $r\\in[0,1]$，令 $x=m+r$。反复用中点关系（或在 $[m,m+1]$ 上对 $g(\\cdot+m)$ 重复上述归纳，并注意到 $g(m)=g(m+1)=0$）得 $g(m+r)=0$。因此对一切二进有理 $q\\in\\mathbb{R}$，$f(q)=f(0)+cq$。\n（三）任意实数。任取 $x\\in\\mathbb{R}$。因二进有理在 $\\mathbb{R}$ 上稠密，可取二进有理序列 $(r_n),(s_n)$ 使 $r_n\\le x\\le s_n$ 且 $s_n-r_n\\to 0$。由 $f$ 严格递增：\n$$f(r_n)\\le f(x)\\le f(s_n),$$\n即 $f(0)+cr_n\\le f(x)\\le f(0)+cs_n$。两边夹逼（$c>0$）得 $f(x)=f(0)+cx$。\n全程只用中点等式、整数/二进归纳与严格递增夹逼，**未假设** $f$ 连续，也未使用导数。\n结论：$c=f(1)-f(0)>0$，且 $f(x)=f(0)+x\\bigl(f(1)-f(0)\\bigr)$ 对一切实数 $x$ 成立。",
    "maxScore": 14,
    "rubric": [
      {
        "key": "s1_normalize_c_g",
        "step": "定义 c=f(1)-f(0) 与 g，并证 c>0、g 满足中点式且 g(0)=g(1)=0",
        "title": "定义 c=f(1)-f(0) 与 g，并证 c>0、g 满足中点式且 g(0)=g(1)=0",
        "score": 3,
        "maxScore": 3,
        "criteria": "正确引入规范化函数；由严增得 c>0；验证中点方程遗传与端点归零"
      },
      {
        "key": "s2_integer_dyadic",
        "step": "证全体整数与全体二进有理上 f(q)=f(0)+cq",
        "title": "证全体整数与全体二进有理上 f(q)=f(0)+cq",
        "score": 5,
        "maxScore": 5,
        "criteria": "整数归纳 + [0,1] 二进中点归纳 + 平移到 ℝ 上全体二进有理"
      },
      {
        "key": "s3_strict_mono_squeeze",
        "step": "用严增夹逼把结论从二进有理扩到任意实数，并声明未用连续",
        "title": "用严增夹逼把结论从二进有理扩到任意实数，并声明未用连续",
        "score": 6,
        "maxScore": 6,
        "criteria": "取夹逼二进序列；由严增不等式与 c>0 得唯一极限值；明确禁连续/导数偷渡"
      }
    ],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "证明题文字与符号推理自足；无强制图示用语。",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3",
    "compareDowngrade": {
      "structureType": "h3-midpoint-convex-strict-mono-affine",
      "contrast": "H2 states continuity to get Cauchy/affine; here mono replaces it"
    },
    "hardProfile": {
      "coreChallenge": "中点凸+严增 ⇒ 仿射（用二进有理+夹逼，不预设连续）",
      "reasoningSteps": [
        "建模",
        "突破",
        "充要闭合",
        "检验"
      ],
      "difficultyEvidence": "严增把中点凸的病态解排除，二进有理仿射后夹逼到全实线",
      "misconceptionTrap": "quoting continuity without justification",
      "alternativeApproach": "分类/构造/对称转化",
      "verification": "边界与特例回代",
      "contentSha256": "6866fc47f5f500dd2af281642c694a91a8bbfe3fe2ff3d3f609083ee165287b2"
    },
    "h3Evidence": {
      "nonObviousBreakthrough": "strict mono upgrades midpoint convexity to affinity via dyadic squeeze",
      "aboveHard14H2Contrast": "H2 states continuity to get Cauchy/affine; here mono replaces it",
      "deepStrategyOrLayeredNecessity": "normalize → dyadics → squeeze",
      "routineKillCheck": "quoting continuity without justification"
    },
    "modelFamily": "h3-midpoint-convex-strict-mono-affine",
    "authorMathNote": "H3 redesign 1E dual-gate; FIX-204-5I analysis/rubric protocol repair"
  },
  {
    "id": "CAND-H3C14-211",
    "designId": "H3-DESIGN-211",
    "book": "必修一",
    "chapterNo": 3,
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.1",
    "sectionName": "函数的概念及其表示",
    "kpCode": "rja.3.1.04",
    "kpName": "对应关系",
    "kpInDb": true,
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H3",
    "hardLevelReason": "对称充要 → 半值 f(1)=1 → 跨 1 单调下界 → 跳跃构造证上无界；特解 f=g/2 不在可行域",
    "methodMain": "equiv_transform",
    "methodAux": "mono_analysis",
    "sourceType": "original",
    "sourceEvidence": "H3C14-1E 原创；非真题复制",
    "stem": "设 $g:(0,+\\infty)\\to\\mathbb{R}$。\n（1）证明：存在函数 $f:(0,+\\infty)\\to\\mathbb{R}$ 使对一切 $x>0$ 有 $f(x)+f\\!\\left(\\dfrac1x\\right)=g(x)$，当且仅当对一切 $x>0$ 有 $g(x)=g\\!\\left(\\dfrac1x\\right)$。\n（2）取 $g(x)=x+\\dfrac1x$。设 $f:(0,+\\infty)\\to\\mathbb{R}$ 满足上式，且 $f$ 在 $(0,+\\infty)$ 上单调递增。求 $f(1)$ 以及 $f(2)$ 的取值范围，并说明范围中每一点均可取到。",
    "options": null,
    "answer": "（1）见解析。\n（2）$f(1)=1$，$f(2)\\in\\left[\\dfrac32,+\\infty\\right)$。",
    "analysis": "（1）必要性：若存在 $f$，则 $g\\!\\left(\\dfrac1x\\right)=f\\!\\left(\\dfrac1x\\right)+f(x)=g(x)$。充分性：若 $g(x)=g\\!\\left(\\dfrac1x\\right)$，取 $f=\\dfrac12 g$ 即可（亦可再加满足 $p(x)+p(1/x)=0$ 的任意 $p$）。\n（2）$g$ 满足对称条件。令 $x=1$：$2f(1)=2\\Rightarrow f(1)=1$。对 $x\\ge 1$，由 $0<\\dfrac1x\\le 1\\le x$ 及递增得 $f\\!\\left(\\dfrac1x\\right)\\le f(1)\\le f(x)$。左边 $g(x)-f(x)\\le 1\\Rightarrow f(x)\\ge g(x)-1=x+\\dfrac1x-1$；右边 $f(x)\\ge 1$。因 $x+\\dfrac1x-1\\ge 1$，故 $f(x)\\ge x+\\dfrac1x-1$。特取 $x=2$：$f(2)\\ge \\dfrac32$。\n可达性：$c=\\dfrac32$ 时取 $f(x)=x+\\dfrac1x-1$（$x\\ge 1$），$f(x)=1$（$0<x\\le 1$），可验证满足方程且整体非严增。若 $c>\\dfrac32$，在 $[1,2)$ 上取 $f=f_{\\min}:=g-1$，令 $f(2)=c$，在 $(2,+\\infty)$ 上取 $f(x)=f_{\\min}(x)+c-\\dfrac32$，再由 $f(1/x)=g(x)-f(x)$ 延拓到 $(0,1)$；单调允许在 $x=2$ 处跳跃。故 $f(2)\\in\\left[\\dfrac32,+\\infty\\right)$。",
    "maxScore": 14,
    "rubric": [
      {
        "step": "证明存在性充要 g(x)=g(1/x)",
        "score": 4
      },
      {
        "step": "求出 f(1)=1 与 f(2)≥3/2",
        "score": 5
      },
      {
        "step": "构造说明 [3/2,+∞) 均可取到",
        "score": 5
      }
    ],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3",
    "compareDowngrade": {
      "structureType": "h3-reciprocal-sum-existence-global-mono",
      "contrast": "H2 only builds f=g/2; mono on [1,+∞) alone weakens to f(2)≥1"
    },
    "hardProfile": {
      "coreChallenge": "倒数反射和的存在充要，与整体单调下端点可行域及构造",
      "reasoningSteps": [
        "建模",
        "突破",
        "充要闭合",
        "检验"
      ],
      "difficultyEvidence": "存在 ⇔ g(x)=g(1/x)；整体递增迫使 f(x)≥x+1/x−1（x≥1），从而 f(2)≥3/2；用跳跃增函数构造证明上端无界可达",
      "misconceptionTrap": "taking f=g/2 then guessing f(2)≥1",
      "alternativeApproach": "分类/构造/对称转化",
      "verification": "边界与特例回代",
      "contentSha256": "7a7d20e7242d0caf156feb4f3db1c286bf0d007311d9bbdefceef64d738d899d"
    },
    "h3Evidence": {
      "nonObviousBreakthrough": "existence iff reciprocal symmetry; global mono lifts f(2)≥3/2; jump constructs unbounded range",
      "aboveHard14H2Contrast": "H2 only builds f=g/2; mono on [1,+∞) alone weakens to f(2)≥1",
      "deepStrategyOrLayeredNecessity": "symmetry-iff → f(1)=1 → cross-1 mono lower bound → jump construct",
      "routineKillCheck": "taking f=g/2 then guessing f(2)≥1"
    },
    "modelFamily": "h3-reciprocal-sum-existence-global-mono",
    "authorMathNote": "H3 redesign 1E dual-gate"
  },
  {
    "id": "CAND-H3C14-212",
    "designId": "H3-DESIGN-212",
    "book": "必修一",
    "chapterNo": 3,
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "kpCode": "rja.3.2.01",
    "kpName": "单调递增",
    "kpInDb": true,
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H3",
    "hardLevelReason": "常速率增量推恒等；禁连续偷渡；与 060 平移不变推常数结论与方程均不同",
    "methodMain": "equiv_transform",
    "methodAux": "mono_analysis",
    "sourceType": "original",
    "sourceEvidence": "H3C14-1E 原创；非真题复制",
    "stem": "设 $f:[0,1]\\to\\mathbb{R}$ 单调递增，$f(0)=0$，且对一切正整数 $n$ 与一切满足 $x+\\dfrac1n\\in[0,1]$ 的 $x$，都有\n$$f\\!\\left(x+\\dfrac1n\\right)-f(x)=\\dfrac1n.$$\n证明：$f(x)=x$ 对一切 $x\\in[0,1]$ 成立。（证明中不得假设 $f$ 连续，不得使用导数。）",
    "options": null,
    "answer": "$f(x)=x$（见证明）。",
    "analysis": "对固定正整数 $n$，由 $f(0)=0$ 与增量条件归纳得：对 $k=0,1,\\ldots,n$，$f\\!\\left(\\dfrac kn\\right)=\\dfrac kn$。特别 $f(1)=1$。\n任取 $x\\in(0,1)$。取充分大的正整数 $n$，令 $k=\\lfloor nx\\rfloor$，则 $\\dfrac kn\\le x\\le \\dfrac{k+1}n$。由单调性\n$$f\\!\\left(\\dfrac kn\\right)\\le f(x)\\le f\\!\\left(\\dfrac{k+1}n\\right),$$\n即 $\\dfrac kn\\le f(x)\\le \\dfrac{k+1}n$。又 $\\dfrac kn\\le x\\le \\dfrac{k+1}n$，故 $|f(x)-x|\\le \\dfrac1n$。因 $n$ 可任意大，必有 $f(x)=x$。全程只用分点赋值与单调夹逼，未假设连续。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "归纳得全体分点 f(k/n)=k/n",
        "score": 4
      },
      {
        "step": "单调夹逼得 |f(x)-x|≤1/n",
        "score": 5
      },
      {
        "step": "说明未用连续性",
        "score": 3
      }
    ],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3",
    "compareDowngrade": {
      "structureType": "h3-equal-increment-mono-force-identity",
      "contrast": "060 is translation-invariant→constant; here constant-rate increment→identity"
    },
    "hardProfile": {
      "coreChallenge": "等步长增量条件 + 单调夹逼 ⇒ 恒等函数（不用连续性）",
      "reasoningSteps": [
        "建模",
        "突破",
        "充要闭合",
        "检验"
      ],
      "difficultyEvidence": "先在全体有理分点得 f(k/n)=k/n，再用单调把任意 x 夹在相邻分点之间，全程不取极限定义连续性",
      "misconceptionTrap": "assume continuous then differentiate the increment equation",
      "alternativeApproach": "分类/构造/对称转化",
      "verification": "边界与特例回代",
      "contentSha256": "66ae2717b80699026378fd53aa65fa8773bcacdc731767027e5e88735a7e1363"
    },
    "h3Evidence": {
      "nonObviousBreakthrough": "grid values + mono sandwich force identity without continuity",
      "aboveHard14H2Contrast": "060 is translation-invariant→constant; here constant-rate increment→identity",
      "deepStrategyOrLayeredNecessity": "grid-values → mono sandwich → identity; ban continuity smuggling",
      "routineKillCheck": "assume continuous then differentiate the increment equation"
    },
    "modelFamily": "h3-equal-increment-mono-force-identity",
    "authorMathNote": "H3 redesign 1E dual-gate"
  },
  {
    "id": "CAND-H3C14-213",
    "designId": "H3-DESIGN-213",
    "book": "必修一",
    "chapterNo": 3,
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "kpCode": "rja.3.2.04",
    "kpName": "单调性判断",
    "kpInDb": true,
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H3",
    "hardLevelReason": "不传值到 0，反而证明 0 可以例外；禁 lim 偷渡连续",
    "methodMain": "mono_analysis",
    "methodAux": "classification",
    "sourceType": "original",
    "sourceEvidence": "H3C14-1E 原创；非真题复制",
    "stem": "设 $f:[0,1]\\to\\mathbb{R}$ 单调递增，且对一切 $x\\in\\bigl[0,\\dfrac12\\bigr]$ 有 $f(x)=f(2x)$。\n（1）证明：存在常数 $c$ 使对一切 $x\\in(0,1]$ 有 $f(x)=c$。（不得假设 $f$ 连续。）\n（2）$f(0)$ 是否必须等于 $c$？若不必，请构造反例；若在（1）的条件下再补充 $f(0)=f(1)$，结论如何？",
    "options": null,
    "answer": "（1）$c=f(1)$，见证明。\n（2）不必。反例：$f(0)=-1$，$f(x)=0$（$x\\in(0,1]$）。若再设 $f(0)=f(1)$，则 $f$ 为常函数。",
    "analysis": "（1）条件改写为：对一切 $t\\in[0,1]$，$f(t)=f\\!\\left(\\dfrac t2\\right)$。于是 $f(1)=f\\!\\left(\\dfrac12\\right)=\\cdots=f(2^{-n})$。令 $c=f(1)$。任取 $x\\in(0,1]$，选取 $n$ 使 $2^{-n}\\le x$。由单调性 $f(2^{-n})\\le f(x)\\le f(1)$，但 $f(2^{-n})=f(1)$，故 $f(x)=c$。未用连续性。\n（2）取 $f(0)=-1$，$f(x)=0$（$x\\in(0,1]$）。则单调递增；对 $x\\in\\bigl[0,\\dfrac12\\bigr]$ 倍元条件成立。故 $f(0)$ 不必等于 $c$。若补充 $f(0)=f(1)=c$，则 $f$ 恒为 $c$。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "建立 dyadic 链 f(1)=f(2^{-n})",
        "score": 3
      },
      {
        "step": "单调夹逼得 (0,1] 上为常值",
        "score": 4
      },
      {
        "step": "构造 f(0) 例外反例并讨论补条件",
        "score": 5
      }
    ],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3",
    "compareDowngrade": {
      "structureType": "h3-doubling-invariance-mono-half-const",
      "contrast": "mistakenly thinks continuity needed to pass values to 0; here 0 may be exceptional"
    },
    "hardProfile": {
      "coreChallenge": "倍元不变 + 单调 ⇒ (0,1] 上常数；端点 0 可例外并构造反例",
      "reasoningSteps": [
        "建模",
        "突破",
        "充要闭合",
        "检验"
      ],
      "difficultyEvidence": "由 f(1)=f(1/2)=f(2^{-n}) 与单调，对任意 x∈(0,1] 取 2^{-n}≤x 夹逼得 f(x)=f(1)；f(0) 不受倍元链约束",
      "misconceptionTrap": "writing lim f(2^{-n})=f(0) to smuggle continuity",
      "alternativeApproach": "分类/构造/对称转化",
      "verification": "边界与特例回代",
      "contentSha256": "5fcdab4cc8dfdf4ccf88ca6aa553197cfaa85117cea067ad99443726e622baa4"
    },
    "h3Evidence": {
      "nonObviousBreakthrough": "dyadic collapse on (0,1]; optional jump at 0 with explicit counterexample",
      "aboveHard14H2Contrast": "mistakenly thinks continuity needed to pass values to 0; here 0 may be exceptional",
      "deepStrategyOrLayeredNecessity": "dyadic collapse → optional jump at 0",
      "routineKillCheck": "writing lim f(2^{-n})=f(0) to smuggle continuity"
    },
    "modelFamily": "h3-doubling-invariance-mono-half-const",
    "authorMathNote": "H3 redesign 1E dual-gate"
  },
  {
    "id": "CAND-H3C14-214",
    "designId": "H3-DESIGN-214",
    "book": "必修一",
    "chapterNo": 3,
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "kpCode": "rja.3.2.12",
    "kpName": "奇偶性求值与综合应用",
    "kpInDb": true,
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H3",
    "hardLevelReason": "三者耦合才锁死 f(x)=cx；可加性仅在非负半轴，负向靠奇性",
    "methodMain": "equiv_transform",
    "methodAux": "mono_analysis",
    "sourceType": "original",
    "sourceEvidence": "H3C14-1E 原创；非真题复制",
    "stem": "设 $f:\\mathbb{R}\\to\\mathbb{R}$ 为奇函数，且对一切 $x,y\\ge 0$ 有 $f(x+y)=f(x)+f(y)$，又 $f$ 在 $[0,+\\infty)$ 上单调递增。证明：存在常数 $c\\ge 0$，使得对一切实数 $x$ 有 $f(x)=cx$。（证明中不得假设 $f$ 连续。）",
    "options": null,
    "answer": "$f(x)=cx$，其中 $c=f(1)\\ge 0$（见证明）。",
    "analysis": "奇函数 ⇒ $f(0)=0$。对 $x\\ge 0$ 与正整数 $n$，归纳得 $f(nx)=nf(x)$；进而对正整数 $m,n$ 有 $f\\!\\left(\\dfrac{m}{n}\\right)=\\dfrac{m}{n}f(1)$。令 $c=f(1)\\ge 0$（由递增）。\n任取 $x>0$。对正整数 $n$ 取 $k=\\lfloor nx\\rfloor$，单调性给出 $\\dfrac kn c\\le f(x)\\le \\dfrac{k+1}n c$，夹逼得 $f(x)=cx$。负半轴：$x<0$ 时 $f(x)=-f(-x)=cx$。未用连续性。",
    "maxScore": 14,
    "rubric": [
      {
        "step": "得非负有理点 f(q)=qc",
        "score": 4
      },
      {
        "step": "单调夹逼到 [0,+∞)",
        "score": 5
      },
      {
        "step": "奇性延拓到 ℝ 并说明 c≥0",
        "score": 5
      }
    ],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3",
    "compareDowngrade": {
      "structureType": "h3-odd-additive-mono-force-linear",
      "contrast": "parity alone or integer additivity alone is H1/H2; coupling locks cx"
    },
    "hardProfile": {
      "coreChallenge": "奇函数 + 非负半轴可加 + 单调 ⇒ 全局一次（不用连续性）",
      "reasoningSteps": [
        "建模",
        "突破",
        "充要闭合",
        "检验"
      ],
      "difficultyEvidence": "先在非负有理点得 f(q)=qf(1)，再用单调夹逼到非负实点，最后用奇性延拓到负半轴",
      "misconceptionTrap": "default continuous Cauchy equation template",
      "alternativeApproach": "分类/构造/对称转化",
      "verification": "边界与特例回代",
      "contentSha256": "3bc499c5e2becaed73f7743712692454a7a101090728cb69849c5993fd5f3d11"
    },
    "h3Evidence": {
      "nonObviousBreakthrough": "odd + additive on [0,+∞) + mono force global linearity without continuity",
      "aboveHard14H2Contrast": "parity alone or integer additivity alone is H1/H2; coupling locks cx",
      "deepStrategyOrLayeredNecessity": "N-homogeneity → Q-linearity on [0,+∞) → mono sandwich → odd extension",
      "routineKillCheck": "default continuous Cauchy equation template"
    },
    "modelFamily": "h3-odd-additive-mono-force-linear",
    "authorMathNote": "H3 redesign 1E dual-gate"
  },
  {
    "id": "CAND-H3C14-215",
    "designId": "H3-DESIGN-215",
    "book": "必修一",
    "chapterNo": 3,
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.1",
    "sectionName": "函数的概念及其表示",
    "kpCode": "rja.3.1.04",
    "kpName": "对应关系",
    "kpInDb": true,
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H3",
    "hardLevelReason": "相对 027（求 f(0) 可行域、解不唯一）多一层 f≤id 后唯一性闭合",
    "methodMain": "equiv_transform",
    "methodAux": "mono_analysis",
    "sourceType": "original",
    "sourceEvidence": "H3C14-1E 原创；非真题复制",
    "stem": "设 $f:[0,1]\\to\\mathbb{R}$ 满足：\n（i）对一切 $x\\in[0,1]$，$f(x)+f(1-x)=1$；\n（ii）$f$ 在 $[0,1]$ 上单调递增；\n（iii）对一切 $x\\in[0,1]$，$f(x)\\le x$。\n证明：$f(x)=x$ 对一切 $x\\in[0,1]$ 成立。",
    "options": null,
    "answer": "$f(x)=x$（见证明）。",
    "analysis": "由（i），$f\\!\\left(\\dfrac12\\right)=\\dfrac12$，且 $f(0)+f(1)=1$。由（iii）$f(0)\\le 0$，$f(1)\\le 1$。结合 $f(1)=1-f(0)$ 得 $f(0)\\ge 0$，故 $f(0)=0$，$f(1)=1$。\n对 $x\\in\\bigl[0,\\dfrac12\\bigr]$，（iii）给出 $f(x)\\le x$。对 $z\\in\\bigl[\\dfrac12,1\\bigr]$，（iii）$f(z)\\le z$ 即 $f(1-z)\\ge 1-z$。令 $w=1-z\\in\\bigl[0,\\dfrac12\\bigr]$，则 $f(w)\\ge w$。于是对一切 $w\\in\\bigl[0,\\dfrac12\\bigr]$ 有 $w\\le f(w)\\le w$，故 $f(w)=w$。再由（i）得右半亦为恒等。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "锁定 f(0)=0,f(1)=1,f(1/2)=1/2",
        "score": 4
      },
      {
        "step": "左半 f≤id 与反射后的 f≥id 夹出恒等",
        "score": 6
      },
      {
        "step": "回代右半并核验充分性",
        "score": 2
      }
    ],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3",
    "compareDowngrade": {
      "structureType": "h3-reflection-sum-mono-below-id-unique",
      "contrast": "027 seeks feasible f(0); here extra f≤id closes uniqueness"
    },
    "hardProfile": {
      "coreChallenge": "反射和为 1 + 单调增 + 点点低于恒等 ⇒ 唯一解 f(x)=x",
      "reasoningSteps": [
        "建模",
        "突破",
        "充要闭合",
        "检验"
      ],
      "difficultyEvidence": "端点先锁 f(0)=0,f(1)=1；左半 f≤id 与右半 f≤id（经反射化为左半 f≥id）夹出 f=id",
      "misconceptionTrap": "only verifying f(x)=x works, not proving uniqueness",
      "alternativeApproach": "分类/构造/对称转化",
      "verification": "边界与特例回代",
      "contentSha256": "9378abebe88fcfaf1f1c9020027b990e674191007ea979f38983a2d85b761c15"
    },
    "h3Evidence": {
      "nonObviousBreakthrough": "reflection sum + mono + f≤id force unique identity (vs 027 multi-solution range)",
      "aboveHard14H2Contrast": "027 seeks feasible f(0); here extra f≤id closes uniqueness",
      "deepStrategyOrLayeredNecessity": "endpoint lock → half-interval dual inequality → identity uniqueness",
      "routineKillCheck": "only verifying f(x)=x works, not proving uniqueness"
    },
    "modelFamily": "h3-reflection-sum-mono-below-id-unique",
    "authorMathNote": "H3 redesign 1E dual-gate"
  },
  {
    "id": "CAND-H3C14-216",
    "designId": "H3-DESIGN-216",
    "book": "必修一",
    "chapterNo": 3,
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "kpCode": "rja.3.2.01",
    "kpName": "单调递增",
    "kpInDb": true,
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H3",
    "hardLevelReason": "假设真弱于 060 的一切 1/n 平移；易误判条件不够；禁连续偷渡",
    "methodMain": "equiv_transform",
    "methodAux": "mono_analysis",
    "sourceType": "original",
    "sourceEvidence": "H3C14-1E 原创；非真题复制",
    "stem": "设 $f:[0,1]\\to\\mathbb{R}$ 单调递增，且对一切 $x\\in[0,1]$ 与一切正整数 $k$，只要 $x+2^{-k}\\in[0,1]$，就有\n$$f\\!\\left(x+2^{-k}\\right)=f(x).$$\n证明 $f$ 为常函数。（证明中不得假设 $f$ 连续。）",
    "options": null,
    "answer": "$f$ 恒等于 $f(0)$（见证明）。",
    "analysis": "对固定正整数 $n$，令 $h=2^{-n}$。反复使用步长 $h$ 的平移不变性，得对一切整数 $m$ 满足 $0\\le m\\le 2^n$，有 $f(mh)=f(0)$。特别 $f(1)=f(0)$。\n任取 $x\\in(0,1)$。取充分大的 $n$，令 $m=\\lfloor 2^n x\\rfloor$，则 $\\dfrac{m}{2^n}\\le x\\le \\dfrac{m+1}{2^n}$。由单调性两端均为 $f(0)$，故 $f(x)=f(0)$。未用连续性。关键：假设弱于“一切 $1/n$ 平移”，但二进分点已足够密。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "得全体 dyadic 分点等于 f(0)",
        "score": 4
      },
      {
        "step": "单调夹逼任意点",
        "score": 5
      },
      {
        "step": "说明弱假设仍充分且未用连续",
        "score": 3
      }
    ],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字与符号推理自足。",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "hardAudit": "ACCEPTED_H3",
    "round1": "MATH_PASS",
    "round2": "ACCEPTED_H3",
    "compareDowngrade": {
      "structureType": "h3-dyadic-step-mono-force-constant",
      "contrast": "060 uses all 1/n steps; here only 2^{-k} — easy to wrongly stop as insufficient"
    },
    "hardProfile": {
      "coreChallenge": "仅 2^{-k} 步长平移不变 + 单调 ⇒ 常数（条件弱于 1/n 平移）",
      "reasoningSteps": [
        "建模",
        "突破",
        "充要闭合",
        "检验"
      ],
      "difficultyEvidence": "弱假设仍能得全体 dyadic 分点同值，而 dyadic 在 [0,1] 仍足以被单调夹逼到任意点",
      "misconceptionTrap": "claiming odd-denominator gaps block the proof; or continuity smuggling",
      "alternativeApproach": "分类/构造/对称转化",
      "verification": "边界与特例回代",
      "contentSha256": "4c6157a397e3b4455ef38f6acc61ee4ed5931facc9516eab4e7ffc803ba59e0b"
    },
    "h3Evidence": {
      "nonObviousBreakthrough": "weaker dyadic-only translation invariance still forces constant via mono sandwich",
      "aboveHard14H2Contrast": "060 uses all 1/n steps; here only 2^{-k} — easy to wrongly stop as insufficient",
      "deepStrategyOrLayeredNecessity": "weaker discrete invariance → dyadic grid constancy → mono sandwich",
      "routineKillCheck": "claiming odd-denominator gaps block the proof; or continuity smuggling"
    },
    "modelFamily": "h3-dyadic-step-mono-force-constant",
    "authorMathNote": "H3 redesign 1E dual-gate"
  }
]
