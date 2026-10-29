/** AUTO-generated ADVISORY-CLOSURE-1E replacements. */
export const fix1eReplacements = {
  "CAND-HARD14-001": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 10,
    "rubric": [
      {
        "step": "非空+包含得[0,1]",
        "score": 6
      },
      {
        "step": "否定相等",
        "score": 4
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch1",
    "chapterNo": 1,
    "sectionCode": "1.2",
    "sectionName": "集合间的基本关系",
    "kpCode": "rja.1.2.01",
    "kpName": "子集与真子集",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "非空包含与集合相等分岔。",
    "methodMain": "classification",
    "stem": "设 $A_t=\\{x\\mid t\\le x\\le 2t+1\\}$，$B=\\{x\\mid 0\\le x\\le 3\\}$。求使 $A_t\\subseteq B$ 且 $A_t\\ne\\varnothing$ 的 $t$；并判断是否存在 $t$ 使 $A_t=B$。",
    "answer": "非空包含：$t\\in[0,1]$；不存在 $t$ 使 $A_t=B$。",
    "analysis": "非空 $\\Leftrightarrow t\\ge-1$。非空且 $A_t\\subseteq B$：$0\\le t$ 且 $2t+1\\le 3\\Leftrightarrow t\\in[0,1]$。若相等则 $t=0$ 且 $2t+1=3$，矛盾。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "非空包含与相等",
      "reasoningSteps": [
        "非空",
        "双边",
        "否定相等"
      ]
    },
    "modelFamily": "param-interval-nonempty-eq",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-011": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "符号条件",
        "score": 5
      },
      {
        "step": "解得开区间",
        "score": 5
      },
      {
        "step": "边界说明",
        "score": 2
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch2",
    "chapterNo": 2,
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.02",
    "kpName": "一元二次不等式解法",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "邻接开区间各恰一根的符号联立。",
    "methodMain": "classification",
    "stem": "设 $f(x)=x^{2}-2kx+k$。求使「在 $(0,1)$ 内恰有一根」且「在 $(1,2)$ 内恰有一根」的实数 $k$ 的范围。",
    "answer": "$k\\in\\left(1,\\dfrac{4}{3}\\right)$。",
    "analysis": "$\\Delta=4k(k-1)$，$f(0)=k$，$f(1)=1-k$，$f(2)=4-3k$。需 $\\Delta>0$，$f(1)<0$，$f(0)>0$，$f(2)>0$ ⇒ $k>1$ 且 $k<4/3$。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "邻接双区间各一根",
      "reasoningSteps": [
        "f(1)<0",
        "端点正",
        "解k"
      ]
    },
    "modelFamily": "adjacent-intervals-one-each",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-014": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "参数化",
        "score": 3
      },
      {
        "step": "求交得x",
        "score": 5
      },
      {
        "step": "P范围",
        "score": 4
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch2",
    "chapterNo": 2,
    "sectionCode": "2.2",
    "sectionName": "基本不等式",
    "kpCode": "rja.2.2.01",
    "kpName": "算术-几何平均不等式",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "定和下双目标可行域求交。",
    "methodMain": "num_shape",
    "stem": "正实数 $x,y$ 满足 $x+y=4$。记 $P=xy$，$Q=x+2y$。求使 $P\\ge 3$ 且 $Q\\le 7$ 同时成立的 $x$ 的范围，并求此时 $P$ 的取值范围。",
    "answer": "$x\\in[1,3]$；$P\\in[3,4]$。",
    "analysis": "$y=4-x$（$0<x<4$）。$P=x(4-x)$，$Q=8-x$。$P\\ge 3\\Leftrightarrow x\\in[1,3]$；$Q\\le 7\\Leftrightarrow x\\ge 1$。交为 $[1,3]$。在其上 $P$ 最大 $4$（$x=2$），端点 $P=3$。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "双约束可行域",
      "reasoningSteps": [
        "P≥3",
        "Q≤7",
        "P值域"
      ]
    },
    "modelFamily": "sum-constraint-dual-feasible",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-017": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 10,
    "rubric": [
      {
        "step": "a∈[-2,2]",
        "score": 6
      },
      {
        "step": "最大与等号点",
        "score": 4
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch2",
    "chapterNo": 2,
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.03",
    "kpName": "含参二次不等式",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "最佳常数并求等号唯一点。",
    "methodMain": "num_shape",
    "stem": "对一切实数 $x$ 有 $x^{2}+2x+2\\ge a(x+1)$。求 $a$ 的最大值，并求取最大时等号成立的 $x$。",
    "answer": "最大值为 $2$；等号当且仅当 $x=0$。",
    "analysis": "$Delta=(2-a)^{2}-4(2-a)\\le 0\\Leftrightarrow a\\in[-2,2]$，最大 $2$。$a=2$ 时 $\\Delta=0$，$x=0$。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "最佳a+等号点",
      "reasoningSteps": [
        "Δ",
        "最大2",
        "x=0"
      ]
    },
    "modelFamily": "best-constant-equality-unique",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-020": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 10,
    "rubric": [
      {
        "step": "最值",
        "score": 4
      },
      {
        "step": "差集",
        "score": 6
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch2",
    "chapterNo": 2,
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.02",
    "kpName": "一元二次不等式解法",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "存在与全称参数域差集。",
    "methodMain": "classification",
    "stem": "设 $g(x)=x^{2}-3x+k$。求使「$\\exists x\\in[0,2], g(x)\\le 0$」成立但「$\\forall x\\in[0,2], g(x)\\le 0$」不成立的 $k$。",
    "answer": "$k\\in\\left(0,\\dfrac{9}{4}\\right]$。",
    "analysis": "闭区间最小 $k-9/4$，最大 $k$。存在 $\\Leftrightarrow k\\le 9/4$；全称 $\\Leftrightarrow k\\le 0$。差集 $(0,9/4]$。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "E且非A",
      "reasoningSteps": [
        "min",
        "max",
        "差集"
      ]
    },
    "modelFamily": "exists-vs-forall-quad",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-029": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": null,
    "rubric": null,
    "options": {
      "A": "$p=-1$，$q=-2$",
      "B": "对应方程两根为 $-1$ 与 $2$",
      "C": "改为 $\\le 0$ 后解集为 $[-1,2]$",
      "D": "开口向下时也可能解集恰为 $(-1,2)$"
    },
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch2",
    "chapterNo": 2,
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.02",
    "kpName": "一元二次不等式解法",
    "qtype": "multi",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "解集形态反推并辨析开口干扰。",
    "methodMain": "equiv_transform",
    "stem": "若 $x^{2}+px+q<0$ 的解集恰好为 $(-1,2)$，下列正确的是（多选）",
    "answer": "A,B,C",
    "analysis": "开口向上时，严格不等式解集为两根之间的开区间，故两根必须恰为 -1 与 2，从而 x^2+px+q=(x+1)(x-2)=x^2-x-2，得 p=-1,q=-2。A、B 正确。将 < 改为 ≤ 后包含端点，解集变为[-1,2]，C 正确。若开口向下，解集为两根外侧，不可能是有界开区间，故 D 错误。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "形态+干扰",
      "reasoningSteps": [
        "开口",
        "反推",
        "否D"
      ]
    },
    "modelFamily": "solution-set-shape-multi",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-030": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "证明",
        "score": 3
      },
      {
        "step": "k≤2",
        "score": 5
      },
      {
        "step": "±1",
        "score": 4
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch2",
    "chapterNo": 2,
    "sectionCode": "2.2",
    "sectionName": "基本不等式",
    "kpCode": "rja.2.2.01",
    "kpName": "算术-几何平均不等式",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "证明+参数范围+等号点三层。",
    "methodMain": "num_shape",
    "stem": "（1）证明 $x^{2}+1\\ge 2|x|$ 对一切实数 $x$ 成立；\n（2）求使 $x^{2}+1\\ge k|x|$ 恒成立的 $k$ 的范围；\n（3）当 $k$ 最大时求等号成立的 $x$。",
    "answer": "（1）见解析；（2）$k\\le 2$；（3）$x=\\pm 1$。",
    "analysis": "$(|x|-1)^{2}\\ge 0$。令 $t=|x|$，$t^{2}-kt+1\\ge 0$（$t\\ge 0$）⇒ $k\\le 2$。$k=2$ 时 $t=1$。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "证明+范围+等号",
      "reasoningSteps": [
        "配方",
        "k≤2",
        "±1"
      ]
    },
    "modelFamily": "abs-best-k-equality",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-034": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "RECOMMENDED",
    "diagramSpecification": "数轴两点与解集区间",
    "noDiagramReason": null,
    "maxScore": 10,
    "rubric": [
      {
        "step": "最小值比较",
        "score": 5
      },
      {
        "step": "m=1解集",
        "score": 5
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch2",
    "chapterNo": 2,
    "sectionCode": "2.1",
    "sectionName": "等式与不等式的性质",
    "kpCode": "rja.2.1.03",
    "kpName": "不等式应用建模",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "距离和与常数比较，解集为闭区间。",
    "methodMain": "classification",
    "stem": "方程 $|x-1|+|x-m|=2$。求使方程有实根的 $m$ 的范围；当 $m=1$ 时写出解集。",
    "answer": "有实根 $\\Leftrightarrow |m-1|\\le 2$，即 $m\\in[-1,3]$；当 $m=1$ 时解集 $[-1,3]$。",
    "analysis": "最小值 $|m-1|$。有解 $\\Leftrightarrow |m-1|\\le 2$。$m=1$ 时 $|x-1|=1$，解集 $[-1,3]$。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "距离和=常数",
      "reasoningSteps": [
        "min=d",
        "d≤2",
        "特例"
      ]
    },
    "modelFamily": "abs-sum-constant",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-042": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 10,
    "rubric": [
      {
        "step": "求根",
        "score": 3
      },
      {
        "step": "区间交",
        "score": 7
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch2",
    "chapterNo": 2,
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "kpCode": "rja.2.3.01",
    "kpName": "一元二次方程",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "先解离散根，再求使两根同时落入同一绝对值为半径的闭区间的参数。",
    "methodMain": "classification",
    "stem": "设 $x_1,x_2$ 为方程 $x^{2}-3x+2=0$ 的两根。求使 $|x_1-k|\\le 1$ 与 $|x_2-k|\\le 1$ 同时成立的实数 $k$ 的取值范围。",
    "answer": "$k\\in[1,2]$。",
    "analysis": "根为 $1,2$。$k\\in[x_1-1,x_1+1]\\cap[x_2-1,x_2+1]=[0,2]\\cap[1,3]=[1,2]$。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "两根同窗覆盖",
      "reasoningSteps": [
        "求根",
        "区间交"
      ]
    },
    "modelFamily": "two-roots-common-window",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-046": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "c=1",
        "score": 4
      },
      {
        "step": "连续得b",
        "score": 4
      },
      {
        "step": "a>0",
        "score": 4
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch3",
    "chapterNo": 3,
    "sectionCode": "3.1",
    "sectionName": "函数的概念与表示",
    "kpCode": "rja.3.1.02",
    "kpName": "函数的表示法",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "连续+左支单调+右支值域联立定参。",
    "methodMain": "classification",
    "stem": "设 $$f(x)=\\begin{cases} ax+b, & x<1 \\\\ x^{2}+c, & x\\ge 1 \\end{cases}$$ 在 $x=1$ 连续，在 $(-\\infty,1)$ 上严格递增，且 $f([1,+\\infty))=[2,+\\infty)$。求 $a,b,c$。",
    "answer": "$c=1$，$a+b=2$，且 $a>0$（$b=2-a$）。",
    "analysis": "右支 $x^{2}+c$（$x\\ge 1$）最小 $1+c$，值域 $[1+c,+\\infty)=[2,+\\infty)\\Rightarrow c=1$。连续：$a+b=1+c=2$。左支斜率 $a>0$ 保证 $(-\\infty,1)$ 严格增。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "三条件联立",
      "reasoningSteps": [
        "值域",
        "连续",
        "增"
      ]
    },
    "modelFamily": "piecewise-cont-mono-range",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-048": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "k=2",
        "score": 3
      },
      {
        "step": "证奇",
        "score": 5
      },
      {
        "step": "c=0",
        "score": 4
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch3",
    "chapterNo": 3,
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "kpCode": "rja.3.2.03",
    "kpName": "奇偶性与对称性",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "定义域对称定参后，再讨论使 f 为奇的附加条件是否可能。",
    "methodMain": "parity_apply",
    "stem": "设 $f(x)=\\sqrt{k-x}-\\sqrt{x+2}$。\n（1）求使定义域关于原点对称的 $k$；\n（2）在（1）下判断 $f$ 奇偶性；\n（3）是否存在常数 $c$ 使 $g(x)=f(x)+c$ 为奇函数？",
    "answer": "（1）$k=2$；（2）$f$ 为奇函数；（3）仅当 $c=0$ 时 $g$ 为奇（即已是奇）。",
    "analysis": "定义域 $[-2,k]$ 对称 ⇒ $k=2$。$f(-x)=\\sqrt{2+x}-\\sqrt{2-x}=-f(x)$，奇。$g$ 奇 ⇔ $g(0)=0$ ⇔ $c=0$（且奇性保留）。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "对称定义域+奇性+平移",
      "reasoningSteps": [
        "k=2",
        "f奇",
        "c"
      ]
    },
    "modelFamily": "domain-sym-odd-shift",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-049": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 10,
    "rubric": [
      {
        "step": "x>1证明",
        "score": 5
      },
      {
        "step": "集合(0,1)",
        "score": 5
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch3",
    "chapterNo": 3,
    "sectionCode": "3.3",
    "sectionName": "幂函数",
    "kpCode": "rja.3.3.01",
    "kpName": "幂函数图象与性质",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "比较两幂在 (0,1) 与 (1,∞) 并求使不等式反转的临界。",
    "methodMain": "mono_analysis",
    "stem": "设 $a>b>0$。求使 $x^{a}>x^{b}$ 对一切 $x>1$ 成立的结论（证明）；并求集合 $\\{x>0\\mid x^{a}<x^{b}\\}$。",
    "answer": "对一切 $x>1$ 确有 $x^{a}>x^{b}$；集合为 $(0,1)$。",
    "analysis": "$x^{a}-x^{b}=x^{b}(x^{a-b}-1)$。$x>1\\Rightarrow x^{a-b}>1$。$0<x<1\\Rightarrow x^{a-b}<1\\Rightarrow x^{a}<x^{b}$。$x=1$ 相等不属 $<$。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "幂差因式化跨1",
      "reasoningSteps": [
        "因式",
        "两端"
      ]
    },
    "modelFamily": "power-compare-set",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-050": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "RECOMMENDED",
    "diagramSpecification": "对勾与y=m",
    "noDiagramReason": null,
    "maxScore": 10,
    "rubric": [
      {
        "step": "最小值4",
        "score": 4
      },
      {
        "step": "分类",
        "score": 4
      },
      {
        "step": "临界根",
        "score": 2
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch3",
    "chapterNo": 3,
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "kpCode": "rja.3.2.01",
    "kpName": "单调性",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "对勾与水平线交点个数分类并求临界。",
    "methodMain": "mono_analysis",
    "stem": "设 $f(x)=x+\\dfrac{4}{x}$（$x>0$）。按实数 $m$ 讨论方程 $f(x)=m$ 的正根个数，并求使恰有一正根时的根。",
    "answer": "$m>4$ 两正根；$m=4$ 一正根 $x=2$；$m<4$ 无正根。",
    "analysis": "令 φ(x)=x+4/x（x>0）。由基本不等式或配方，φ(x)≥2√(x·4/x)=4，等号 x=2。故最小值 4。对水平线 y=m：m>4 时两正根；m=4 时一正根 x=2；m<4 时无正根。在 (0,2) 递减、在 (2,+∞) 递增，与分类一致。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "对勾水平线分类",
      "reasoningSteps": [
        "min",
        "分类"
      ]
    },
    "modelFamily": "hook-level-classify",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-051": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 10,
    "rubric": [
      {
        "step": "a=1",
        "score": 5
      },
      {
        "step": "否定f=h",
        "score": 5
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch3",
    "chapterNo": 3,
    "sectionCode": "3.1",
    "sectionName": "函数的概念与表示",
    "kpCode": "rja.3.1.01",
    "kpName": "函数的概念",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "同一函数需定义域与对应法则同时对齐，并排除参数使定义域误扩。",
    "methodMain": "defn",
    "stem": "设 $f(x)=\\dfrac{x^{2}-1}{x-1}$（$x\\ne 1$），$g(x)=x+1$（$x\\ne a$），$h(x)=x+1$（$x\\in\\mathbb{R}$）。\n（1）求使 $f=g$ 的 $a$；\n（2）说明 $f$ 与 $h$ 是否为同一函数。",
    "answer": "（1）$a=1$；（2）不是（定义域不同）。",
    "analysis": "法则均为 $x+1$，同一函数 ⇔ 定义域相同。$D(f)=\\mathbb{R}\\setminus\\{1\\}$，故 $a=1$。$h$ 定义域为 $\\mathbb{R}$，与 $f$ 不同。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "三要素对齐",
      "reasoningSteps": [
        "法则",
        "定义域",
        "否h"
      ]
    },
    "modelFamily": "same-function-domain",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-055": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 10,
    "rubric": [
      {
        "step": "定义域值域",
        "score": 6
      },
      {
        "step": "a=2",
        "score": 4
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch3",
    "chapterNo": 3,
    "sectionCode": "3.1",
    "sectionName": "函数的概念与表示",
    "kpCode": "rja.3.1.02",
    "kpName": "函数的表示法",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "含参半圆定义域值域随 a 变化分类。",
    "methodMain": "classification",
    "stem": "设 $a>0$，$y=\\sqrt{ax-x^{2}}$。\n（1）用 $a$ 表示定义域与值域；\n（2）求使值域为 $[0,1]$ 的 $a$。",
    "answer": "（1）定义域 $[0,a]$，值域 $[0,a/2]$；\n（2）$a=2$。",
    "analysis": "$ax-x^{2}=x(a-x)\\ge 0\\Rightarrow x\\in[0,a]$。令 $x=\\dfrac{a}{2}+t$，最大 $\\sqrt{a^{2}/4}=a/2$。值域 $[0,1]\\Rightarrow a/2=1\\Rightarrow a=2$。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "参数半圆反解a",
      "reasoningSteps": [
        "配方",
        "最大",
        "反解"
      ]
    },
    "modelFamily": "param-semicircle-range",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-059": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "负支",
        "score": 4
      },
      {
        "step": "a≥0证明",
        "score": 8
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch3",
    "chapterNo": 3,
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "kpCode": "rja.3.2.03",
    "kpName": "奇偶性与对称性",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "奇延拓后附加半轴单调，反推一次项符号。",
    "methodMain": "parity_apply",
    "stem": "设当 $x\\ge 0$ 时 $f(x)=x^{2}+ax$，且 $f$ 为 $\\mathbb{R}$ 上奇函数，并在 $[0,+\\infty)$ 上严格递增。求 $a$ 的取值范围，并写出 $x<0$ 时 $f(x)$。",
    "answer": "$a\\ge 0$；$x<0$ 时 $f(x)=-x^{2}+ax$。",
    "analysis": "奇性自动给出负支 $f(x)=-x^{2}+ax$（$x<0$），$a$ 自由于奇性。$[0,+\\infty)$ 严格增：对 $0\\le x_1<x_2$，$f(x_2)-f(x_1)=(x_2-x_1)(x_1+x_2+a)>0$ 需 $a\\ge 0$（否则在 $0$ 附近可能失败：若 $a<0$，取 $x_1=0,x_2=-a/2>0$，则差 $=x_2(x_2+a)=x_2(-a/2)<0$）。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "奇延拓+严格增定a",
      "reasoningSteps": [
        "奇",
        "作差",
        "a≥0"
      ]
    },
    "modelFamily": "odd-extend-mono-param",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-063": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": null,
    "rubric": null,
    "options": {
      "A": "若 $k=2$，则恰有一正根 $x=1$",
      "B": "若 $k>2$，则恰有两正根且积为 $1$",
      "C": "若 $k=1$，则恰有一正根",
      "D": "两正根（若有）关于倒数互为对称"
    },
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch3",
    "chapterNo": 3,
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "kpCode": "rja.3.2.01",
    "kpName": "单调性",
    "qtype": "multi",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "对勾方程根个数与临界值多选辨析。",
    "methodMain": "mono_analysis",
    "stem": "设 $x>0$，方程 $x+\\dfrac{1}{x}=k$。下列正确的是（多选）",
    "answer": "A,B,D",
    "analysis": "最小 $2$。$k=2$ 一根 $1$。$k>2$ 两根积 $1$。$k=1<2$ 无根，C 错。倒数对称由积 $1$。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "对勾多选",
      "reasoningSteps": [
        "min2",
        "否C",
        "积1"
      ]
    },
    "modelFamily": "hook-equation-multi",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-064": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "值域",
        "score": 4
      },
      {
        "step": "m≠2",
        "score": 3
      },
      {
        "step": "反解x",
        "score": 5
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch3",
    "chapterNo": 3,
    "sectionCode": "3.1",
    "sectionName": "函数的概念与表示",
    "kpCode": "rja.3.1.02",
    "kpName": "函数的表示法",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "分式线性值域后求使方程有解的参数并排除渐近值。",
    "methodMain": "equiv_transform",
    "stem": "设 $f(x)=\\dfrac{2x-1}{x+1}$（$x\\ne-1$）。\n（1）求值域；\n（2）求使方程 $f(x)=m$ 有解的实数 $m$；\n（3）当有解时求 $x$。",
    "answer": "（1）$\\mathbb{R}\\setminus\\{2}$；（2）$m\\ne 2$；（3）$x=\\dfrac{m+1}{2-m}$（$m\\ne 2$）。",
    "analysis": "反解 $y(x+1)=2x-1\\Rightarrow x(y-2)= -1-y\\Rightarrow x=\\dfrac{y+1}{2-y}$（$y\\ne 2$）。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "反解排除渐近",
      "reasoningSteps": [
        "反解",
        "y≠2"
      ]
    },
    "modelFamily": "linear-fractional-inverse",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-067": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 8,
    "rubric": [
      {
        "step": "因式化",
        "score": 4
      },
      {
        "step": "S=[1,∞)",
        "score": 4
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch3",
    "chapterNo": 3,
    "sectionCode": "3.3",
    "sectionName": "幂函数",
    "kpCode": "rja.3.3.01",
    "kpName": "幂函数图象与性质",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "比较两幂并求使不等式在 (0,1) 与 (1,∞) 同时描述的集合。",
    "methodMain": "mono_analysis",
    "stem": "设 $\\alpha>\\beta$。求集合 $S=\\{x>0\\mid x^{\\alpha}\\ge x^{\\beta}\\}$，并说明 $x=1$ 的归属。",
    "answer": "$S=[1,+\\infty)$；$x=1$ 使等号成立，属于 $S$。",
    "analysis": "$x^{\\alpha}-x^{\\beta}=x^{\\beta}(x^{\\alpha-\\beta}-1)$。$x^{\\beta}>0$。$x^{\\alpha-\\beta}\\ge 1\\Leftrightarrow x\\ge 1$（因指数为正）。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "幂不等解集",
      "reasoningSteps": [
        "因式",
        "x≥1"
      ]
    },
    "modelFamily": "power-ineq-set",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-068": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "换元",
        "score": 4
      },
      {
        "step": "最小",
        "score": 4
      },
      {
        "step": "最大",
        "score": 4
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch3",
    "chapterNo": 3,
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "kpCode": "rja.3.2.01",
    "kpName": "单调性",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "绝对值换元后在受限区间求最值并比较两端。",
    "methodMain": "substitution",
    "stem": "求 $f(x)=x^{2}-2|x|-3$ 在 $[-2,3]$ 上的最大值与最小值，并指出相应 $x$。",
    "answer": "最小值为 $-4$（$x=\\pm 1$）；最大值为 $0$（$x=3$）（比较 $f(-2)=-3$，$f(3)=0$）。",
    "analysis": "令 $t=|x|\\ge 0$，$g(t)=t^{2}-2t-3=(t-1)^{2}-4$，最小 $-4$ 于 $t=1$。在 $[-2,3]$ 上 $t\\in[0,3]$，$g$ 在 $t=1$ 最小，在 $t=3$ 最大 $0$；对应 $x=\\pm1$ 与 $x=3$。$x=-2$ 时 $f=-3$。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "闭区间绝对值二次最值",
      "reasoningSteps": [
        "换元",
        "端点比较"
      ]
    },
    "modelFamily": "abs-quad-closed-interval",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-069": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 10,
    "rubric": [
      {
        "step": "最小2",
        "score": 4
      },
      {
        "step": "分类",
        "score": 6
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch3",
    "chapterNo": 3,
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "kpCode": "rja.3.2.01",
    "kpName": "单调性",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "证明最小值后讨论水平线交点个数。",
    "methodMain": "num_shape",
    "stem": "设 $h(x)=\\sqrt{x}+\\dfrac{1}{\\sqrt{x}}$（$x>0$）。\n（1）求最小值及取点；\n（2）按 $k$ 讨论 $h(x)=k$ 的正根个数。",
    "answer": "（1）最小 $2$ 于 $x=1$；（2）$k>2$ 两根；$k=2$ 一根；$k<2$ 无根。",
    "analysis": "令 t=√x>0，则 h=t+1/t。由 (t-1)^2≥0 得 t+1/t≥2，等号 t=1 即 x=1。故最小值为 2。方程 h(x)=k 等价于 t+1/t=k：k>2 两正 t（因而两正 x）；k=2 唯一 t=1；k<2 无解。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "根式对勾分类",
      "reasoningSteps": [
        "最小",
        "分类"
      ]
    },
    "modelFamily": "sqrt-hook-classify",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-086": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 10,
    "rubric": [
      {
        "step": "统一底",
        "score": 5
      },
      {
        "step": "解出x",
        "score": 5
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch4",
    "chapterNo": 4,
    "sectionCode": "4.2",
    "sectionName": "指数函数",
    "kpCode": "rja.4.2.02",
    "kpName": "指数函数性质与图象",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "统一底后讨论含参指数不等式的解集随参数变化。",
    "methodMain": "mono_analysis",
    "stem": "解关于 $x$ 的不等式 $2^{x}\\cdot 4^{x-1}<8^{t}$，其中参数 $t\\in\\mathbb{R}$；并将解集用 $t$ 表示。",
    "answer": "$x<\\dfrac{3t+2}{3}$。",
    "analysis": "左边 $2^{x}\\cdot(2^{2})^{x-1}=2^{x+2x-2}=2^{3x-2}$，右边 $(2^{3})^{t}=2^{3t}$。故 $3x-2<3t\\Leftrightarrow x<\\dfrac{3t+2}{3}$。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "含参指数不等式",
      "reasoningSteps": [
        "化2底",
        "比较指数"
      ]
    },
    "modelFamily": "exp-ineq-param-t",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-087": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "定义域",
        "score": 3
      },
      {
        "step": "值域",
        "score": 5
      },
      {
        "step": "x=2",
        "score": 4
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch4",
    "chapterNo": 4,
    "sectionCode": "4.4",
    "sectionName": "对数函数",
    "kpCode": "rja.4.4.01",
    "kpName": "对数函数概念",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "对数和定义域与合并后验根对照，防止扩域。",
    "methodMain": "domain_symmetry",
    "stem": "设 $y=\\log_{2}(x-1)+\\log_{2}(3-x)$。\n（1）求定义域；\n（2）求值域；\n（3）解方程 $y=0$。",
    "answer": "（1）$(1,3)$；（2）值域 $(-\\infty,0]$；（3）若方程为 $y=0$，则 $x=2$（原误写 y=1）。",
    "analysis": "定义域 $(1,3)$。$y=\\log_{2}[(x-1)(3-x)]$，真数最大 $1$（$x=2$），真数范围 $(0,1]$，值域 $(-\\infty,0]$。$y=0\\Leftrightarrow$ 真数 $=1\\Leftrightarrow x=2$。",
    "hardProfile": {
      "coreChallenge": "对数和定义域值域",
      "reasoningSteps": [
        "真数",
        "最大1",
        "y=0"
      ],
      "contentSha256": "PENDING",
      "verification": "x=2",
      "alternativeApproach": "换元",
      "misconceptionTrap": "合并扩域",
      "difficultyEvidence": "旧单求定义域"
    },
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild",
    "modelFamily": "log-sum-domain-range"
  },
  "CAND-HARD14-088": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 10,
    "rubric": [
      {
        "step": "证相等",
        "score": 5
      },
      {
        "step": "比较",
        "score": 5
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch4",
    "chapterNo": 4,
    "sectionCode": "4.3",
    "sectionName": "对数",
    "kpCode": "rja.4.3.02",
    "kpName": "对数运算",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "换底证相等后比较扰动项大小。",
    "methodMain": "equiv_transform",
    "stem": "（1）证明 $\\log_{3}2=\\log_{9}4=\\log_{27}8$；\n（2）比较 $\\log_{3}2$ 与 $\\log_{3}2+\\log_{9}2$ 的大小。",
    "answer": "（1）见解析；（2）前者较小。",
    "analysis": "换底：后者 $=\\log_{3}2+\\dfrac{\\log_{3}2}{\\log_{3}9}=\\log_{3}2+\\dfrac12\\log_{3}2=\\dfrac32\\log_{3}2>$ 前者。三者：令 $a=\\log_{3}2$，则 $\\log_{9}4=\\dfrac{2a}{2}=a$，$\\log_{27}8=\\dfrac{3a}{3}=a$。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "换底恒等+扰动比较",
      "reasoningSteps": [
        "换底",
        "加正项"
      ]
    },
    "modelFamily": "log-change-base-compare",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-089": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 10,
    "rubric": [
      {
        "step": "换元",
        "score": 4
      },
      {
        "step": "求根验根",
        "score": 6
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch4",
    "chapterNo": 4,
    "sectionCode": "4.2",
    "sectionName": "指数函数",
    "kpCode": "rja.4.2.02",
    "kpName": "指数函数性质与图象",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "换元后二次方程需验根并讨论参数变形。",
    "methodMain": "substitution",
    "stem": "解方程 $4^{x}-3\\cdot 2^{x+1}+8=0$，并说明每个根的检验过程。",
    "answer": "$x=1$ 或 $x=2$。",
    "analysis": "令 $t=2^{x}>0$，则 $t^{2}-6t+8=0$，$(t-2)(t-4)=0$，$t=2$ 或 $4$，即 $x=1$ 或 $2$。代回原式均成立。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "换元验根",
      "reasoningSteps": [
        "t",
        "因式",
        "验"
      ]
    },
    "modelFamily": "exp-sub-quadratic",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-092": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 12,
    "rubric": [
      {
        "step": "定义域",
        "score": 3
      },
      {
        "step": "严格增",
        "score": 5
      },
      {
        "step": "零点",
        "score": 4
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch4",
    "chapterNo": 4,
    "sectionCode": "4.5",
    "sectionName": "指数函数与对数函数综合",
    "kpCode": "rja.4.5.01",
    "kpName": "指对综合",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "复合对数定义域与零点、单调一体。",
    "methodMain": "mono_analysis",
    "stem": "设 $a>1$，$F(x)=\\log_{a}(2^{x}-1)$。\n（1）求定义域；\n（2）证明 $F$ 在定义域上严格增；\n（3）求零点。",
    "answer": "（1）$x>0$；（2）见解析；（3）$x=1$。",
    "analysis": "$2^{x}-1>0\\Leftrightarrow x>0$。内层严格增、外层严格增，复合严格增。$F=0\\Leftrightarrow 2^{x}-1=1\\Leftrightarrow x=1$。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "复合指对",
      "reasoningSteps": [
        "定义域",
        "复合增",
        "零点"
      ]
    },
    "modelFamily": "log-exp-composite",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-093": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 10,
    "rubric": [
      {
        "step": "换元≥2",
        "score": 6
      },
      {
        "step": "等号",
        "score": 4
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch4",
    "chapterNo": 4,
    "sectionCode": "4.2",
    "sectionName": "指数函数",
    "kpCode": "rja.4.2.02",
    "kpName": "指数函数性质与图象",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "双曲型指数和的最小值与参数 m 的充要。",
    "methodMain": "num_shape",
    "stem": "设 $a>0$，$a\\ne 1$。求使 $a^{x}+a^{-x}\\ge m$ 对一切实数 $x$ 成立的 $m$ 的充要条件，并指出等号可否取到。",
    "answer": "$m\\le 2$；当 $m=2$ 时等号在 $x=0$ 取到。",
    "analysis": "令 $t=a^{x}>0$，则 $t+1/t\\ge 2$，等号 $t=1\\Leftrightarrow x=0$。故 $m\\le 2$。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "指数和最佳下界",
      "reasoningSteps": [
        "换元",
        "m≤2"
      ]
    },
    "modelFamily": "exp-sum-lower-bound",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-094": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 10,
    "rubric": [
      {
        "step": "定义域",
        "score": 3
      },
      {
        "step": "求解",
        "score": 4
      },
      {
        "step": "验根",
        "score": 3
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch4",
    "chapterNo": 4,
    "sectionCode": "4.4",
    "sectionName": "对数函数",
    "kpCode": "rja.4.4.02",
    "kpName": "对数函数性质",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "合并对数后必须验定义域，排除增根。",
    "methodMain": "domain_symmetry",
    "stem": "解方程 $\\log_{2}(x-1)+\\log_{2}(x-3)=3$，写出定义域并验根。",
    "answer": "定义域 $x>3$；解为 $x=5$。",
    "analysis": "定义域 $x>3$。合并 $\\log_{2}[(x-1)(x-3)]=3\\Rightarrow (x-1)(x-3)=8\\Rightarrow x^{2}-4x-5=0\\Rightarrow x=5$ 或 $-1$（舍）。验 $x=5$ 成立。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "合并验根",
      "reasoningSteps": [
        "定义域",
        "合并",
        "舍-1"
      ]
    },
    "modelFamily": "log-eq-check-domain",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  },
  "CAND-HARD14-097": {
    "book": "必修一",
    "kpInDb": true,
    "kpInSeed": true,
    "sourceType": "original",
    "sourceEvidence": "HARD14；ADVISORY-CLOSURE-1E 重建；非高考真题",
    "mathCheck": "PASS",
    "mathVerified": "AUTHOR_CHECKED",
    "reviewReady": true,
    "blockReasons": [],
    "diagramRequirement": "NOT_NEEDED",
    "diagramSpecification": null,
    "noDiagramReason": "文字自足。",
    "maxScore": 10,
    "rubric": [
      {
        "step": "换元最小2",
        "score": 4
      },
      {
        "step": "分类",
        "score": 4
      },
      {
        "step": "临界根0",
        "score": 2
      }
    ],
    "options": null,
    "methodAux": "equiv_transform",
    "specialtyCode": "rja-ch4",
    "chapterNo": 4,
    "sectionCode": "4.5",
    "sectionName": "指数函数与对数函数综合",
    "kpCode": "rja.4.5.01",
    "kpName": "指对综合",
    "qtype": "application",
    "difficulty": 3,
    "hardLevel": "H1",
    "hardAudit": "TRUE_H1",
    "hardLevelReason": "偶性+换元后水平线分类，并求临界根。",
    "methodMain": "classification",
    "stem": "按实数 $k$ 讨论方程 $2^{x}+2^{-x}=k$ 的实根个数；当恰有一实根时求该根。",
    "answer": "$k>2$ 两实根；$k=2$ 一实根 $x=0$；$k<2$ 无实根。",
    "analysis": "令 $t=2^{x}>0$，$t+1/t=k$。最小 $2$ 于 $t=1$（$x=0$）。分类同上。偶性说明若 $x_0$ 是根则 $-x_0$ 也是。",
    "hardProfile": {
      "contentSha256": "PENDING",
      "verification": "边界代回",
      "alternativeApproach": "分类讨论",
      "misconceptionTrap": "漏分支",
      "difficultyEvidence": "旧题套路化",
      "coreChallenge": "指数偶和分类",
      "reasoningSteps": [
        "换元",
        "分类",
        "偶"
      ]
    },
    "modelFamily": "exp-even-sum-roots",
    "compareDowngrade": {
      "structureType": "REBUILD_1E",
      "contrast": "相对原 advisory 套路题，改任务结构。"
    },
    "authorMathNote": "ADVISORY-CLOSURE-1E 重建",
    "dedupNote": "1E rebuild"
  }
}
export const fix1eKeepIds = ["CAND-HARD14-002","CAND-HARD14-003","CAND-HARD14-004","CAND-HARD14-007","CAND-HARD14-010","CAND-HARD14-015","CAND-HARD14-022","CAND-HARD14-023","CAND-HARD14-032","CAND-HARD14-053","CAND-HARD14-080"]
