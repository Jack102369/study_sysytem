# 函数奇偶性 25 题 · 复核清单

> **P1-FUNC-DIFF-2B**：下表「难度」列为**目标难度**（源已更新）。DB 仍为旧值时标记 **SOURCE_UPDATED_DB_PENDING**。
> 原难度→目标：0017 2→1；0018 2→1；0020 2→1；0024 3→2；0025 3→1。其余不变。人工仍为 PENDING（≠ 审核 passed）。

| code | 内容组 | 主KP | 题型 | 难度 | 结构 | 数学 | 人工 | 备注 |
|------|--------|------|------|------|------|------|------|------|
| HSMA-RJA-CH03-PARITY-0001 | definition | rja.3.2.09 | single | 1 | PASS | VERIFIED_BY_LOGIC | PENDING | f(-x)=f(x) 且定义域对称 ⇒ 偶函数 |
| HSMA-RJA-CH03-PARITY-0002 | definition | rja.3.2.09 | judge | 1 | PASS | VERIFIED_BY_LOGIC | PENDING | 缺定义域对称前提不能直接称奇函数 |
| HSMA-RJA-CH03-PARITY-0003 | definition | rja.3.2.09 | single | 1 | PASS | VERIFIED_BY_LOGIC | PENDING | 奇函数定义需对称定义域 + f(-x)=-f(x) |
| HSMA-RJA-CH03-PARITY-0004 | definition | rja.3.2.09 | multi | 2 | PASS | VERIFIED_BY_LOGIC | PENDING | 奇偶定义与 f(0)=0、非奇非偶判别 |
| HSMA-RJA-CH03-PARITY-0005 | definition | rja.3.2.10 | single | 1 | PASS | VERIFIED_BY_LOGIC | PENDING | 先对称定义域再验证恒等式；单点不够 |
| HSMA-RJA-CH03-PARITY-0006 | domain_symmetry | rja.3.2.09 | single | 1 | PASS | VERIFIED_BY_LOGIC | PENDING | 定义域 {1}，-1 不在其中，不对称 ⇒ 非奇非偶 |
| HSMA-RJA-CH03-PARITY-0007 | domain_symmetry | rja.3.2.09 | judge | 1 | PASS | VERIFIED_BY_LOGIC | PENDING | R\{0} 关于原点对称，可讨论奇偶性 |
| HSMA-RJA-CH03-PARITY-0008 | domain_symmetry | rja.3.2.10 | single | 2 | PASS | VERIFIED_BY_LOGIC | PENDING | x^2-1≥0 ⇒ (-∞,-1]∪[1,+∞)，对称 |
| HSMA-RJA-CH03-PARITY-0009 | domain_symmetry | rja.3.2.10 | multi | 2 | PASS | VERIFIED_BY_LOGIC | PENDING | 独立检查四个定义域的对称性 |
| HSMA-RJA-CH03-PARITY-0010 | judgment | rja.3.2.10 | single | 1 | PASS | VERIFIED_BY_LOGIC | PENDING | 抽样验证 f(-x)=f(x) |
| HSMA-RJA-CH03-PARITY-0011 | judgment | rja.3.2.10 | single | 1 | PASS | VERIFIED_BY_LOGIC | PENDING | 抽样验证 f(-x)=-f(x) |
| HSMA-RJA-CH03-PARITY-0012 | judgment | rja.3.2.11 | multi | 2 | PASS | VERIFIED_BY_LOGIC | PENDING | 零函数在对称定义域上既奇又偶 |
| HSMA-RJA-CH03-PARITY-0013 | judgment | rja.3.2.11 | single | 2 | PASS | VERIFIED_BY_LOGIC | PENDING | x=1 处既非奇亦非偶 |
| HSMA-RJA-CH03-PARITY-0014 | judgment | rja.3.2.11 | judge | 1 | PASS | VERIFIED_BY_LOGIC | PENDING | f(-1)≠f(1)，不是偶函数 |
| HSMA-RJA-CH03-PARITY-0015 | evaluation | rja.3.2.12 | numeric | 1 | PASS | VERIFIED_BY_CALC | PENDING | f(-3)=-f(3)=-5 |
| HSMA-RJA-CH03-PARITY-0016 | evaluation | rja.3.2.12 | numeric | 1 | PASS | VERIFIED_BY_CALC | PENDING | f(2)=f(-2)=7 |
| HSMA-RJA-CH03-PARITY-0017 | evaluation | rja.3.2.12 | numeric | 1 | PASS | VERIFIED_BY_CALC | PENDING | (-2)+(-5)=-7 |
| HSMA-RJA-CH03-PARITY-0018 | evaluation | rja.3.2.12 | numeric | 1 | PASS | VERIFIED_BY_CALC | PENDING | f(-4)=f(4)=3 |
| HSMA-RJA-CH03-PARITY-0019 | graph | rja.3.2.11 | single | 1 | PASS | VERIFIED_BY_LOGIC | PENDING | 偶函数图象关于 y 轴对称 |
| HSMA-RJA-CH03-PARITY-0020 | graph | rja.3.2.11 | single | 1 | PASS | VERIFIED_BY_LOGIC | PENDING | (a,b)→(-a,-b) 对奇函数图象 |
| HSMA-RJA-CH03-PARITY-0021 | graph | rja.3.2.12 | multi | 2 | PASS | VERIFIED_BY_LOGIC | PENDING | 偶：过(3,-1)⇒过(-3,-1)；B 错误 |
| HSMA-RJA-CH03-PARITY-0022 | mono_combo | rja.3.2.12 | single | 3 | PASS | NEEDS_HUMAN_REVIEW | PENDING | 机检核对答案为 A；奇函数+正半轴递增⇒负半轴递增的证明需人工确认表述充分 |
| HSMA-RJA-CH03-PARITY-0023 | mono_combo | rja.3.2.12 | multi | 3 | PASS | NEEDS_HUMAN_REVIEW | PENDING | 答案 A/C/D：偶函数正减⇒负增；f(/x/)=f(x)；偶不蕴含单调。建议人工复核证明细节 |
| HSMA-RJA-CH03-PARITY-0024 | mono_combo | rja.3.2.10 | judge | 2 | PASS | VERIFIED_BY_LOGIC | PENDING | x^3-x 奇但不单调，命题为假 |
| HSMA-RJA-CH03-PARITY-0025 | mono_combo | rja.3.2.10 | single | 1 | PASS | VERIFIED_BY_LOGIC | PENDING | f(-1)=f(1)=2 |

人工：PENDING=25，APPROVED=0（未伪造审核人/时间）。