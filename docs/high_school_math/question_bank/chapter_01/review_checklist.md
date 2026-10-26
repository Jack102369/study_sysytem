# 第一章题库人工审核清单（P1-0F-A）

权威源：`apps/api/src/hs-math/util/hs-math-p1-0e-bank-items.ts`

人工审核状态全部为 **PENDING**（本阶段不得改为 APPROVED）。

| code | 小节 | 主KP | qtype | 难度 | 答案摘要 | 结构 | 数学独立复核 | 校验方法 | 歧义 | 答案冲突 | 解析 | 人工 | 备注 |
|------|------|------|-------|------|----------|------|--------------|----------|------|----------|------|------|------|
| HSMA-RJA-CH01-0001 | 1.1 | rja.1.1.01 | single | 1 | single:C | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0002 | 1.1 | rja.1.1.01 | single | 1 | single:B | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0003 | 1.1 | rja.1.1.02 | single | 1 | single:B | PASS | VERIFIED_BY_ENUM | 整数论域枚举 -2≤x<2 | none | none | yes | PENDING | {−2,−1,0,1} |
| HSMA-RJA-CH01-0004 | 1.1 | rja.1.1.02 | single | 2 | single:A | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0005 | 1.1 | rja.1.1.03 | single | 1 | single:A | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0006 | 1.1 | rja.1.1.01 | single | 2 | single:A | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0007 | 1.1 | rja.1.1.02 | single | 2 | single:A | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0008 | 1.1 | rja.1.1.01 | single | 3 | single:A | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0009 | 1.1 | rja.1.1.01 | multi | 2 | multi:A+B+D | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0010 | 1.1 | rja.1.1.02 | multi | 1 | multi:A+B+D | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0011 | 1.1 | rja.1.1.03 | multi | 2 | multi:A+B+D | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0012 | 1.1 | rja.1.1.01 | judge | 1 | judge:true | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0013 | 1.1 | rja.1.1.03 | judge | 2 | judge:false | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0014 | 1.1 | rja.1.1.02 | judge | 1 | judge:true | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0015 | 1.1 | rja.1.1.01 | numeric | 1 | numeric:4 | PASS | VERIFIED_BY_CALC | 独立计算期望=4 | none | none | yes | PENDING | 与题库 numeric 一致 |
| HSMA-RJA-CH01-0016 | 1.1 | rja.1.1.02 | numeric | 2 | numeric:5 | PASS | VERIFIED_BY_CALC | 独立计算期望=5 | none | none | yes | PENDING | 与题库 numeric 一致 |
| HSMA-RJA-CH01-0017 | 1.2 | rja.1.2.01 | single | 1 | single:A | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0018 | 1.2 | rja.1.2.01 | single | 1 | single:A | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0019 | 1.2 | rja.1.2.02 | single | 1 | single:A | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0020 | 1.2 | rja.1.2.01 | single | 2 | single:A | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0021 | 1.2 | rja.1.2.01 | single | 2 | single:C | PASS | VERIFIED_BY_CALC | 2^n 公式独立计算=8 | none | none | yes | PENDING | 选项与计算一致 |
| HSMA-RJA-CH01-0022 | 1.2 | rja.1.2.01 | single | 2 | single:A | PASS | VERIFIED_BY_CALC | 2^n 公式独立计算=7 | none | none | yes | PENDING | 选项与计算一致 |
| HSMA-RJA-CH01-0023 | 1.2 | rja.1.2.01 | single | 2 | single:B | PASS | VERIFIED_BY_CALC | 2^n 公式独立计算=2 | none | none | yes | PENDING | 选项与计算一致 |
| HSMA-RJA-CH01-0024 | 1.2 | rja.1.2.02 | single | 3 | single:A | PASS | VERIFIED_BY_ENUM | 有限整数试根枚举（二次因式） | none | none | yes | PENDING | A=B={1,2} |
| HSMA-RJA-CH01-0025 | 1.2 | rja.1.2.01 | multi | 2 | multi:A+B+C | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0026 | 1.2 | rja.1.2.02 | multi | 1 | multi:A+B+D | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0027 | 1.2 | rja.1.2.01 | multi | 3 | multi:A+B+D | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0028 | 1.2 | rja.1.2.02 | judge | 1 | judge:true | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0029 | 1.2 | rja.1.2.01 | judge | 1 | judge:true | PASS | VERIFIED_BY_CALC | 2^0-1=0 | none | none | yes | PENDING | 空集无真子集 |
| HSMA-RJA-CH01-0030 | 1.2 | rja.1.2.01 | numeric | 1 | numeric:4 | PASS | VERIFIED_BY_CALC | 独立计算期望=4 | none | none | yes | PENDING | 与题库 numeric 一致 |
| HSMA-RJA-CH01-0031 | 1.2 | rja.1.2.01 | numeric | 1 | numeric:15 | PASS | VERIFIED_BY_CALC | 独立计算期望=15 | none | none | yes | PENDING | 与题库 numeric 一致 |
| HSMA-RJA-CH01-0032 | 1.2 | rja.1.2.01 | numeric | 3 | numeric:4 | PASS | VERIFIED_BY_CALC | 独立计算期望=4 | none | none | yes | PENDING | 与题库 numeric 一致 |
| HSMA-RJA-CH01-0033 | 1.3 | rja.1.3.01 | single | 1 | single:B | PASS | VERIFIED_BY_ENUM | 有限并集枚举 | none | none | yes | PENDING | A∪B={1,2,3,4} |
| HSMA-RJA-CH01-0034 | 1.3 | rja.1.3.02 | single | 1 | single:B | PASS | VERIFIED_BY_ENUM | 有限交集枚举 | none | none | yes | PENDING | A∩B={2,3} |
| HSMA-RJA-CH01-0035 | 1.3 | rja.1.3.03 | single | 1 | single:B | PASS | VERIFIED_BY_ENUM | 有限补集枚举 | none | none | yes | PENDING | ∁UA={4,5} |
| HSMA-RJA-CH01-0036 | 1.3 | rja.1.3.02 | single | 1 | single:A | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0037 | 1.3 | rja.1.3.01 | single | 1 | single:A | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0038 | 1.3 | rja.1.3.03 | single | 1 | single:A | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0039 | 1.3 | rja.1.3.02 | single | 1 | single:A | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0040 | 1.3 | rja.1.3.01 | single | 1 | single:A | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0041 | 1.3 | rja.1.3.04 | single | 3 | single:A | PASS | VERIFIED_BY_ENUM | 并后补集枚举 | none | none | yes | PENDING | {4,6} |
| HSMA-RJA-CH01-0042 | 1.3 | rja.1.3.04 | single | 3 | single:A | PASS | VERIFIED_BY_ENUM | 补交综合枚举 | none | none | yes | PENDING | {c} |
| HSMA-RJA-CH01-0043 | 1.3 | rja.1.3.01 | multi | 1 | multi:A+B+D | PASS | VERIFIED_BY_ENUM | 逐项枚举真假 | none | none | yes | PENDING | A/B/D 真，C 假 |
| HSMA-RJA-CH01-0044 | 1.3 | rja.1.3.03 | multi | 2 | multi:A+B+C | PASS | VERIFIED_BY_ENUM | 补集逐项枚举 | none | none | yes | PENDING | A/B/C |
| HSMA-RJA-CH01-0045 | 1.3 | rja.1.3.02 | multi | 1 | multi:A+B+C | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0046 | 1.3 | rja.1.3.04 | multi | 3 | multi:A+B+C | PASS | VERIFIED_BY_ENUM | 交并综合枚举 | none | none | yes | PENDING | A/B/C |
| HSMA-RJA-CH01-0047 | 1.3 | rja.1.3.01 | judge | 1 | judge:true | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0048 | 1.3 | rja.1.3.03 | judge | 1 | judge:true | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0049 | 1.3 | rja.1.3.01 | numeric | 1 | numeric:4 | PASS | VERIFIED_BY_CALC | 独立计算期望=4 | none | none | yes | PENDING | 与题库 numeric 一致 |
| HSMA-RJA-CH01-0050 | 1.3 | rja.1.3.02 | numeric | 1 | numeric:2 | PASS | VERIFIED_BY_CALC | 独立计算期望=2 | none | none | yes | PENDING | 与题库 numeric 一致 |
| HSMA-RJA-CH01-0051 | 1.3 | rja.1.3.03 | numeric | 1 | numeric:4 | PASS | VERIFIED_BY_CALC | 独立计算期望=4 | none | none | yes | PENDING | 与题库 numeric 一致 |
| HSMA-RJA-CH01-0052 | 1.3 | rja.1.3.04 | numeric | 3 | numeric:5 | PASS | VERIFIED_BY_CALC | 独立计算期望=5 | none | none | yes | PENDING | 与题库 numeric 一致 |
| HSMA-RJA-CH01-0053 | 1.4 | rja.1.4.01 | single | 1 | single:A | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0054 | 1.4 | rja.1.4.02 | single | 1 | single:A | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0055 | 1.4 | rja.1.4.01 | single | 1 | single:A | PASS | VERIFIED_BY_LOGIC | 充分必要双向检验（反例 x=-1） | none | none | yes | PENDING | 充分不必要 |
| HSMA-RJA-CH01-0056 | 1.4 | rja.1.4.01 | single | 2 | single:A | PASS | VERIFIED_BY_LOGIC | 不等式蕴含 + 反例 x=1.5 | none | none | yes | PENDING | 充分不必要 |
| HSMA-RJA-CH01-0057 | 1.4 | rja.1.4.02 | single | 2 | single:A | PASS | VERIFIED_BY_LOGIC | 逆命题检验 | none | none | yes | PENDING | 必要不充分 |
| HSMA-RJA-CH01-0058 | 1.4 | rja.1.4.01 | single | 2 | single:A | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0059 | 1.4 | rja.1.4.03 | single | 2 | single:A | PASS | VERIFIED_BY_LOGIC | 实数平方零点充要 | none | none | yes | PENDING | 充要 |
| HSMA-RJA-CH01-0060 | 1.4 | rja.1.4.01 | single | 3 | single:A | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0061 | 1.4 | rja.1.4.03 | multi | 2 | multi:A+B+C | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0062 | 1.4 | rja.1.4.01 | multi | 1 | multi:A+C | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0063 | 1.4 | rja.1.4.02 | multi | 2 | multi:A+C+D | PASS | VERIFIED_BY_LOGIC | 必要条件定义 q⇒p 逐组检验 | none | none | yes | PENDING | A/C/D |
| HSMA-RJA-CH01-0064 | 1.4 | rja.1.4.03 | multi | 3 | multi:B+C | PASS | VERIFIED_BY_LOGIC | 充要双向检验 | none | none | yes | PENDING | B/C |
| HSMA-RJA-CH01-0065 | 1.4 | rja.1.4.02 | judge | 1 | judge:true | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0066 | 1.4 | rja.1.4.03 | judge | 2 | judge:false | PASS | VERIFIED_BY_LOGIC | 反例 a=-b | none | none | yes | PENDING | 非充要 |
| HSMA-RJA-CH01-0067 | 1.4 | rja.1.4.01 | judge | 2 | judge:true | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0068 | 1.4 | rja.1.4.01 | numeric | 2 | numeric:3 | PASS | VERIFIED_BY_CALC | 独立计算期望=3 | none | none | yes | PENDING | 与题库 numeric 一致 |
| HSMA-RJA-CH01-0069 | 1.5 | rja.1.5.01 | single | 1 | single:A | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0070 | 1.5 | rja.1.5.02 | single | 1 | single:A | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0071 | 1.5 | rja.1.5.03 | single | 2 | single:A | PASS | VERIFIED_BY_LOGIC | 全称否定：∃ + 谓词否定 | none | none | yes | PENDING | 否定正确 |
| HSMA-RJA-CH01-0072 | 1.5 | rja.1.5.03 | single | 2 | single:A | PASS | VERIFIED_BY_LOGIC | 存在否定：∀ + 谓词否定 | none | none | yes | PENDING | 否定正确 |
| HSMA-RJA-CH01-0073 | 1.5 | rja.1.5.02 | single | 2 | single:A | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0074 | 1.5 | rja.1.5.01 | single | 3 | single:A | PASS | VERIFIED_BY_ENUM | 有限论域全称枚举 | none | none | yes | PENDING | 全真 |
| HSMA-RJA-CH01-0075 | 1.5 | rja.1.5.01 | multi | 2 | multi:A+D | PASS | VERIFIED_BY_LOGIC | B/C/D 有限检验 + A 绝对值非负逻辑 | none | none | yes | PENDING | A 对全体实数属逻辑复核（非全实数枚举证明） |
| HSMA-RJA-CH01-0076 | 1.5 | rja.1.5.03 | multi | 3 | multi:A+B+D | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0077 | 1.5 | rja.1.5.02 | judge | 1 | judge:true | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0078 | 1.5 | rja.1.5.01 | judge | 2 | judge:false | PASS | NEEDS_HUMAN_REVIEW | LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本） | none | none | yes | PENDING | HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核 |
| HSMA-RJA-CH01-0079 | 1.5 | rja.1.5.02 | numeric | 1 | numeric:2 | PASS | VERIFIED_BY_CALC | 独立计算期望=2 | none | none | yes | PENDING | 与题库 numeric 一致 |
| HSMA-RJA-CH01-0080 | 1.5 | rja.1.5.01 | numeric | 2 | numeric:0 | PASS | VERIFIED_BY_CALC | 独立计算期望=0 | none | none | yes | PENDING | 与题库 numeric 一致 |