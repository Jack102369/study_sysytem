# 函数奇偶性 25 题 · 人工审核册

> 生成自 `hs-math:p1-func2-check`。人工状态均为 **PENDING**。结构/机器复核 PASS ≠ APPROVED。
>
> **P1-FUNC-DIFF-2B**：权威源难度已调为 16/7/2；下列「难度」为**目标难度**。
> 数据库尚未同步 → 状态标记 **SOURCE_UPDATED_DB_PENDING**。
> 5 题调整：0017 2→1；0018 2→1；0020 2→1；0024 3→2；0025 3→1。
> 历史 DIFF-1 审查结论见 `37_*` / `parity_25_difficulty_review.json`（未篡改）。

## HSMA-RJA-CH03-PARITY-0001

- 题型：single　难度：1　内容组：definition
- 主 KP：`rja.3.2.09`
- 关联 KP：`rja.3.2.09`
- 题干：设函数 $f$ 的定义域关于原点对称。若对定义域内任意 $x$ 都有 $f(-x)=f(x)$，则称 $f$ 为
- 选项：
  - A. 奇函数
  - B. 偶函数
  - C. 既奇又偶的函数
  - D. 非奇非偶函数
- 答案：single:B
  - 正确项文本：偶函数
- 解析：定义域关于原点对称是讨论奇偶性的前提。对任意 $x$ 有 $f(-x)=f(x)$ 时，$f$ 为偶函数。
- 数学复核：VERIFIED_BY_LOGIC（definition）— f(-x)=f(x) 且定义域对称 ⇒ 偶函数
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0002

- 题型：judge　难度：1　内容组：definition
- 主 KP：`rja.3.2.09`
- 关联 KP：`rja.3.2.09`
- 题干：判断：若函数 $f$ 满足对定义域内任意 $x$ 都有 $f(-x)=-f(x)$，则 $f$ 一定是奇函数（无需再检查定义域）。
- 答案：judge:false
- 解析：讨论奇偶性必须先检验定义域关于原点对称。仅有代数关系 $f(-x)=-f(x)$ 而定义域不对称时，不能称为奇函数。
- 数学复核：VERIFIED_BY_LOGIC（definition_prerequisite）— 缺定义域对称前提不能直接称奇函数
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0003

- 题型：single　难度：1　内容组：definition
- 主 KP：`rja.3.2.09`
- 关联 KP：`rja.3.2.09`, `rja.3.2.10`
- 题干：下列关于函数奇偶性定义的叙述，正确的是
- 选项：
  - A. 只要 $f(-x)=-f(x)$ 成立，$f$ 就是奇函数
  - B. 偶函数必满足 $f(-x)=-f(x)$
  - C. 奇函数要求定义域关于原点对称，且 $f(-x)=-f(x)$
  - D. 奇偶性与定义域是否对称无关
- 答案：single:C
  - 正确项文本：奇函数要求定义域关于原点对称，且 $f(-x)=-f(x)$
- 解析：奇函数定义：定义域关于原点对称，且对定义域内任意 $x$ 有 $f(-x)=-f(x)$。缺一不可。
- 数学复核：VERIFIED_BY_LOGIC（definition）— 奇函数定义需对称定义域 + f(-x)=-f(x)
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0004

- 题型：multi　难度：2　内容组：definition
- 主 KP：`rja.3.2.09`
- 关联 KP：`rja.3.2.09`, `rja.3.2.10`, `rja.3.2.11`
- 题干：设函数 $f$ 定义域关于原点对称。下列说法正确的是（多选）
- 选项：
  - A. 若 $f$ 为偶函数，则 $f(-x)=f(x)$
  - B. 若 $f$ 为奇函数，则 $f(-x)=-f(x)$
  - C. 若 $f(0)$ 有定义且 $f$ 为奇函数，则必有 $f(0)=0$
  - D. 若存在某 $a$ 使 $f(-a)\neq f(a)$ 且 $f(-a)\neq -f(a)$，则 $f$ 非奇非偶
- 答案：multi:A+B+C+D
- 解析：在定义域已对称的前提下：偶/奇分别对应 $f(-x)=f(x)$ / $f(-x)=-f(x)$。奇函数若 $0$ 在定义域，则 $f(0)=-f(0)\Rightarrow f(0)=0$。若既不满足偶又不满足奇的恒等式，则为非奇非偶。
- 数学复核：VERIFIED_BY_LOGIC（definition_props）— 奇偶定义与 f(0)=0、非奇非偶判别
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0005

- 题型：single　难度：1　内容组：definition
- 主 KP：`rja.3.2.10`
- 关联 KP：`rja.3.2.09`, `rja.3.2.10`
- 题干：已知 $f(x)=x^{3}$ 的定义域为 $\mathbb{R}$。判断其奇偶性时，下列步骤正确的是
- 选项：
  - A. 直接看次数为奇数，故为奇函数，无需验证定义域
  - B. 先确认定义域关于原点对称，再验证 $f(-x)=-f(x)$
  - C. 只需验证 $f(-1)=-f(1)$ 即可断定为奇函数
  - D. 因为过原点，所以一定是偶函数
- 答案：single:B
  - 正确项文本：先确认定义域关于原点对称，再验证 $f(-x)=-f(x)$
- 解析：正确流程：先确认定义域对称（此处 $\mathbb{R}$ 对称），再验证对任意 $x$，$f(-x)=(-x)^{3}=-x^{3}=-f(x)$，故为奇函数。仅验证个别点或只看次数不够严谨。
- 数学复核：VERIFIED_BY_LOGIC（procedure）— 先对称定义域再验证恒等式；单点不够
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0006

- 题型：single　难度：1　内容组：domain_symmetry
- 主 KP：`rja.3.2.09`
- 关联 KP：`rja.3.2.09`, `rja.3.2.10`
- 题干：函数 $f(x)=\sqrt{x-1}+\sqrt{1-x}$ 的定义域
- 选项：
  - A. 关于原点对称，可讨论奇偶性
  - B. 为 $\{1\}$，关于原点不对称，故非奇非偶
  - C. 为 $[0,+\infty)$，可讨论奇偶性
  - D. 为空集，规定为偶函数
- 答案：single:B
  - 正确项文本：为 $\{1\}$，关于原点不对称，故非奇非偶
- 解析：由 $x-1\ge 0$ 且 $1-x\ge 0$ 得 $x=1$，定义域 $\{1\}$。关于原点的对称点 $-1\notin\{1\}$，定义域不对称，故非奇非偶。
- 数学复核：VERIFIED_BY_LOGIC（domain_enum）— 定义域 {1}，-1 不在其中，不对称 ⇒ 非奇非偶
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0007

- 题型：judge　难度：1　内容组：domain_symmetry
- 主 KP：`rja.3.2.09`
- 关联 KP：`rja.3.2.09`
- 题干：判断：函数 $f(x)=\dfrac{1}{x}$ 的定义域为 $(-\infty,0)\cup(0,+\infty)$，关于原点对称，因此可以进一步用定义讨论其奇偶性。
- 答案：judge:true
- 解析：定义域 $\mathbb{R}\setminus\{0\}$ 关于原点对称，具备讨论奇偶性的前提；再验证 $f(-x)=-1/x=-f(x)$ 可知其为奇函数。本题只考前提是否成立。
- 数学复核：VERIFIED_BY_LOGIC（domain_symmetry）— R\{0} 关于原点对称，可讨论奇偶性
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0008

- 题型：single　难度：2　内容组：domain_symmetry
- 主 KP：`rja.3.2.10`
- 关联 KP：`rja.3.2.09`, `rja.3.2.10`
- 题干：函数 $f(x)=\sqrt{x^{2}-1}$ 的定义域为
- 选项：
  - A. $[-1,1]$，关于原点对称
  - B. $(-\infty,-1]\cup[1,+\infty)$，关于原点对称
  - C. $(1,+\infty)$，关于原点不对称
  - D. $[0,+\infty)$，关于原点对称
- 答案：single:B
  - 正确项文本：$(-\infty,-1]\cup[1,+\infty)$，关于原点对称
- 解析：由 $x^{2}-1\ge 0$ 得 $x\le -1$ 或 $x\ge 1$，即 $(-\infty,-1]\cup[1,+\infty)$。若 $x$ 属于该集合，则 $-x$ 也属于，故关于原点对称，可继续讨论奇偶性。
- 数学复核：VERIFIED_BY_LOGIC（domain_ineq）— x^2-1≥0 ⇒ (-∞,-1]∪[1,+∞)，对称
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0009

- 题型：multi　难度：2　内容组：domain_symmetry
- 主 KP：`rja.3.2.10`
- 关联 KP：`rja.3.2.09`, `rja.3.2.10`
- 题干：下列函数中，定义域关于原点对称的是（多选）
- 选项：
  - A. $f(x)=\sqrt{4-x^{2}}$
  - B. $g(x)=\ln(x+2)$
  - C. $h(x)=\dfrac{1}{x^{2}-1}$
  - D. $p(x)=\sqrt{x}+\sqrt{-x}$
- 答案：multi:A+C+D
- 解析：A：定义域 $[-2,2]$，对称。B：$x>-2$，不对称。C：$x\neq\pm 1$，仍关于原点对称。D：仅 $x=0$，对称。故选 A、C、D。
- 数学复核：VERIFIED_BY_LOGIC（domain_cases）— 独立检查四个定义域的对称性
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0010

- 题型：single　难度：1　内容组：judgment
- 主 KP：`rja.3.2.10`
- 关联 KP：`rja.3.2.10`, `rja.3.2.09`
- 题干：函数 $f(x)=x^{2}+1$（定义域 $\mathbb{R}$）是
- 选项：
  - A. 奇函数
  - B. 偶函数
  - C. 既奇又偶
  - D. 非奇非偶
- 答案：single:B
  - 正确项文本：偶函数
- 解析：定义域 $\mathbb{R}$ 对称。$f(-x)=(-x)^{2}+1=x^{2}+1=f(x)$，故为偶函数。
- 数学复核：VERIFIED_BY_LOGIC（sample_parity）— 抽样验证 f(-x)=f(x)
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0011

- 题型：single　难度：1　内容组：judgment
- 主 KP：`rja.3.2.10`
- 关联 KP：`rja.3.2.10`, `rja.3.2.09`
- 题干：函数 $f(x)=x^{3}-x$（定义域 $\mathbb{R}$）是
- 选项：
  - A. 奇函数
  - B. 偶函数
  - C. 既奇又偶
  - D. 非奇非偶
- 答案：single:A
  - 正确项文本：奇函数
- 解析：定义域对称。$f(-x)=(-x)^{3}-(-x)=-x^{3}+x=-(x^{3}-x)=-f(x)$，故为奇函数。
- 数学复核：VERIFIED_BY_LOGIC（sample_parity）— 抽样验证 f(-x)=-f(x)
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0012

- 题型：multi　难度：2　内容组：judgment
- 主 KP：`rja.3.2.11`
- 关联 KP：`rja.3.2.11`, `rja.3.2.09`, `rja.3.2.10`
- 题干：设 $f(x)=0$（定义域 $\mathbb{R}$）。下列说法正确的是（多选）
- 选项：
  - A. $f$ 是奇函数
  - B. $f$ 是偶函数
  - C. $f$ 既是奇函数又是偶函数
  - D. $f$ 非奇非偶
- 答案：multi:A+B+C
- 解析：零函数在关于原点对称的定义域上：$f(-x)=0=f(x)$ 且 $f(-x)=0=-f(x)$，故既奇又偶。A、B、C 均正确，D 错误。
- 数学复核：VERIFIED_BY_LOGIC（zero_fn）— 零函数在对称定义域上既奇又偶
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0013

- 题型：single　难度：2　内容组：judgment
- 主 KP：`rja.3.2.11`
- 关联 KP：`rja.3.2.10`, `rja.3.2.11`
- 题干：函数 $f(x)=x+|x|$（定义域 $\mathbb{R}$）的奇偶性是
- 选项：
  - A. 奇函数
  - B. 偶函数
  - C. 既奇又偶
  - D. 非奇非偶
- 答案：single:D
  - 正确项文本：非奇非偶
- 解析：定义域对称。$f(-x)=-x+|-x|=-x+|x|$。一般地 $f(-x)\neq f(x)$（如 $x=1$：$f(1)=2$，$f(-1)=0$），且 $f(-x)\neq -f(x)$（$-f(1)=-2\neq 0$），故非奇非偶。
- 数学复核：VERIFIED_BY_LOGIC（sample_parity）— x=1 处既非奇亦非偶
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0014

- 题型：judge　难度：1　内容组：judgment
- 主 KP：`rja.3.2.11`
- 关联 KP：`rja.3.2.10`, `rja.3.2.11`
- 题干：判断：函数 $f(x)=x^{2}+x$（定义域 $\mathbb{R}$）是偶函数。
- 答案：judge:false
- 解析：$f(-x)=x^{2}-x$。取 $x=1$，$f(-1)=0\neq f(1)=2$，故不是偶函数；也不是奇函数（$f(-1)=0\neq -2$），为非奇非偶。
- 数学复核：VERIFIED_BY_LOGIC（sample）— f(-1)≠f(1)，不是偶函数
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0015

- 题型：numeric　难度：1　内容组：evaluation
- 主 KP：`rja.3.2.12`
- 关联 KP：`rja.3.2.12`, `rja.3.2.09`
- 题干：已知奇函数 $f$ 的定义域关于原点对称，且 $f(3)=5$。求 $f(-3)$ 的值。
- 答案：numeric:-5
- 解析：奇函数满足 $f(-x)=-f(x)$，故 $f(-3)=-f(3)=-5$。
- 数学复核：VERIFIED_BY_CALC（odd_eval）— f(-3)=-f(3)=-5
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0016

- 题型：numeric　难度：1　内容组：evaluation
- 主 KP：`rja.3.2.12`
- 关联 KP：`rja.3.2.12`, `rja.3.2.09`
- 题干：已知偶函数 $f$ 的定义域关于原点对称，且 $f(-2)=7$。求 $f(2)$ 的值。
- 答案：numeric:7
- 解析：偶函数满足 $f(-x)=f(x)$，故 $f(2)=f(-2)=7$。
- 数学复核：VERIFIED_BY_CALC（even_eval）— f(2)=f(-2)=7
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0017

- 题型：numeric　难度：1　内容组：evaluation
- 主 KP：`rja.3.2.12`
- 关联 KP：`rja.3.2.12`
- 题干：已知奇函数 $f$ 定义在 $\mathbb{R}$ 上，$f(1)=2$，$f(2)=5$。求 $f(-1)+f(-2)$ 的值。
- 答案：numeric:-7
- 解析：$f(-1)=-f(1)=-2$，$f(-2)=-f(2)=-5$，故和为 $-7$。
- 数学复核：VERIFIED_BY_CALC（odd_eval_sum）— (-2)+(-5)=-7
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0018

- 题型：numeric　难度：1　内容组：evaluation
- 主 KP：`rja.3.2.12`
- 关联 KP：`rja.3.2.12`, `rja.3.2.10`
- 题干：已知偶函数 $f$ 定义在 $\mathbb{R}$ 上，$f(4)=3$，且 $f(x)=ax^{2}+b$（$a,b$ 为常数）。若还已知 $f(0)=1$，求 $f(-4)$ 的值。
- 答案：numeric:3
- 解析：偶函数有 $f(-4)=f(4)=3$。由 $f(0)=1$ 可知常数项，但不影响 $f(\pm 4)$ 的相等关系；本题所求仅为 $f(-4)$。
- 数学复核：VERIFIED_BY_CALC（even_eval）— f(-4)=f(4)=3
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0019

- 题型：single　难度：1　内容组：graph
- 主 KP：`rja.3.2.11`
- 关联 KP：`rja.3.2.11`, `rja.3.2.09`
- 题干：若函数 $y=f(x)$ 是偶函数，则其图象
- 选项：
  - A. 关于原点对称
  - B. 关于 $y$ 轴对称
  - C. 关于 $x$ 轴对称
  - D. 关于直线 $y=x$ 对称
- 答案：single:B
  - 正确项文本：关于 $y$ 轴对称
- 解析：由偶函数定义，$f(-x)=f(x)$，图象上点 $(x,y)$ 与 $(-x,y)$ 同时出现，故图象关于 $y$ 轴对称。奇函数则关于原点对称，二者不可混淆。
- 数学复核：VERIFIED_BY_LOGIC（graph_def）— 偶函数图象关于 y 轴对称
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0020

- 题型：single　难度：1　内容组：graph
- 主 KP：`rja.3.2.11`
- 关联 KP：`rja.3.2.11`, `rja.3.2.12`
- 题干：已知点 $(2,5)$ 在奇函数 $y=f(x)$ 的图象上，则下列点也在该图象上的是
- 选项：
  - A. $(-2,5)$
  - B. $(-2,-5)$
  - C. $(2,-5)$
  - D. $(5,2)$
- 答案：single:B
  - 正确项文本：$(-2,-5)$
- 解析：奇函数图象关于原点对称：点 $(a,b)$ 在图象上则 $(-a,-b)$ 也在图象上。故 $(2,5)$ 对应 $(-2,-5)$。
- 数学复核：VERIFIED_BY_LOGIC（origin_symmetry）— (a,b)→(-a,-b) 对奇函数图象
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0021

- 题型：multi　难度：2　内容组：graph
- 主 KP：`rja.3.2.12`
- 关联 KP：`rja.3.2.11`, `rja.3.2.12`
- 题干：已知偶函数 $y=f(x)$ 的图象过点 $(3,-1)$。下列说法正确的是（多选）
- 选项：
  - A. 图象也过点 $(-3,-1)$
  - B. 图象也过点 $(-3,1)$
  - C. 图象关于 $y$ 轴对称
  - D. 必有 $f(-3)=f(3)$
- 答案：multi:A+C+D
- 解析：偶函数关于 $y$ 轴对称，故过 $(3,-1)$ 必过 $(-3,-1)$，且 $f(-3)=f(3)=-1$。B 的纵坐标符号错误。
- 数学复核：VERIFIED_BY_LOGIC（y_axis_symmetry）— 偶：过(3,-1)⇒过(-3,-1)；B 错误
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0022

- 题型：single　难度：3　内容组：mono_combo
- 主 KP：`rja.3.2.12`
- 关联 KP：`rja.3.2.12`, `rja.3.2.09`, `rja.3.2.10`
- 题干：设 $f$ 是定义在 $\mathbb{R}$ 上的奇函数，且 $f$ 在 $[0,+\infty)$ 上单调递增。则 $f$ 在 $(-\infty,0]$ 上
- 选项：
  - A. 单调递增
  - B. 单调递减
  - C. 先增后减
  - D. 无法判断
- 答案：single:A
  - 正确项文本：单调递增
- 解析：取 $x_{1}<x_{2}\le 0$，则 $0\le -x_{2}<-x_{1}$。由正半轴递增得 $f(-x_{2})<f(-x_{1})$。又奇函数 $f(-x)=-f(x)$，故 $-f(x_{2})<-f(x_{1})$，即 $f(x_{1})<f(x_{2})$，从而在 $(-\infty,0]$ 上也单调递增。必须明确所论区间与奇偶性。
- 数学复核：NEEDS_HUMAN_REVIEW（mono_parity_proof）— 机检核对答案为 A；奇函数+正半轴递增⇒负半轴递增的证明需人工确认表述充分
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0023

- 题型：multi　难度：3　内容组：mono_combo
- 主 KP：`rja.3.2.12`
- 关联 KP：`rja.3.2.12`, `rja.3.2.11`
- 题干：设 $f$ 是定义在 $\mathbb{R}$ 上的偶函数，且 $f$ 在 $[0,+\infty)$ 上单调递减。下列正确的是（多选）
- 选项：
  - A. $f$ 在 $(-\infty,0]$ 上单调递增
  - B. $f$ 在 $(-\infty,0]$ 上单调递减
  - C. 对任意 $x$，有 $f(|x|)=f(x)$
  - D. 仅由偶函数不能推出其在正半轴单调
- 答案：multi:A+C+D
- 解析：偶函数关于 $y$ 轴对称：正半轴递减对应负半轴递增（可类似用对称点证明）。$f(|x|)=f(x)$ 对偶函数成立。偶函数本身不蕴含单调性，D 正确。B 错误。
- 数学复核：NEEDS_HUMAN_REVIEW（even_mono_combo）— 答案 A/C/D：偶函数正减⇒负增；f(|x|)=f(x)；偶不蕴含单调。建议人工复核证明细节
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0024

- 题型：judge　难度：2　内容组：mono_combo
- 主 KP：`rja.3.2.10`
- 关联 KP：`rja.3.2.10`, `rja.3.2.12`
- 题干：判断：任意奇函数在其整个定义域上都一定是单调函数。
- 答案：judge:false
- 解析：反例：$f(x)=x^{3}-x$ 是奇函数，但在 $\mathbb{R}$ 上不单调（局部有增减）。奇偶性与单调性相互独立，综合题必须另行给出单调区间条件。
- 数学复核：VERIFIED_BY_LOGIC（counterexample）— x^3-x 奇但不单调，命题为假
- 人工审核状态：**PENDING**

## HSMA-RJA-CH03-PARITY-0025

- 题型：single　难度：1　内容组：mono_combo
- 主 KP：`rja.3.2.10`
- 关联 KP：`rja.3.2.10`, `rja.3.2.12`
- 题干：设 $f$ 是定义在 $[-2,2]$ 上的偶函数，且当 $x\in[0,2]$ 时 $f(x)=x+1$。则 $f(-1)$ 等于
- 选项：
  - A. $0$
  - B. $1$
  - C. $2$
  - D. $-1$
- 答案：single:C
  - 正确项文本：$2$
- 解析：偶函数有 $f(-1)=f(1)$。又 $1\in[0,2]$，故 $f(1)=1+1=2$，从而 $f(-1)=2$。定义域 $[-2,2]$ 关于原点对称，条件充分。
- 数学复核：VERIFIED_BY_LOGIC（even_piecewise_eval）— f(-1)=f(1)=2
- 人工审核状态：**PENDING**
