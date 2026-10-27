## CAND-G3A-001 | ch1 | single | d=1 | rja.1.1.01 | defn
STEM: 下列对象能构成集合的是
OPT: {"A":"高一(1)班个子较高的同学","B":"方程 $x^2-5x+6=0$ 的实数解","C":"接近 $0$ 的实数","D":"好看的风景照片"}
ANS: B
ANALYSIS: 集合元素须确定。A、C、D 中“较高”“接近”“好看”均不确定；B 的实数解为 $2,3$，元素明确，故选 B。
AUTHOR: B 根确定；A/C/D 描述模糊。

## CAND-G3A-002 | ch1 | multi | d=2 | rja.1.2.01 | classification+defn
STEM: 设 $A=\{0,1\}$，$B=\{x\mid x^2-x=0\}$，则下列正确的有（多选）
OPT: {"A":"$A\\subseteq B$","B":"$B\\subseteq A$","C":"$A=B$","D":"$A\\subsetneq B$"}
ANS: A,B,C
ANALYSIS: $x^2-x=0\Rightarrow x(x-1)=0$，得 $B=\{0,1\}=A$。故 $A\subseteq B$、$B\subseteq A$、$A=B$ 成立；真子集不成立，D 错。
AUTHOR: B={0,1}=A；真子集不成立。

## CAND-G3A-003 | ch1 | judge | d=1 | rja.1.4.01 | defn
STEM: 判断：$x>2$ 是 $x>1$ 的充分不必要条件。
ANS: true
ANALYSIS: 若 $x>2$ 则必有 $x>1$，故充分；取 $x=1.5$ 满足 $x>1$ 但不满足 $x>2$，故非必要。命题正确。
AUTHOR: 充分成立；反例1.5说明非必要。

## CAND-G3A-004 | ch1 | numeric | d=2 | rja.1.3.04 | equiv_transform
STEM: 全集 $U=\{1,2,3,4,5,6\}$，$A=\{1,2,3\}$，$B=\{2,3,4\}$，则 $|\complement_U(A\cap B)|=$
ANS: 4
ANALYSIS: $A\cap B=\{2,3\}$，$\complement_U(A\cap B)=\{1,4,5,6\}$，基数为 $4$。
AUTHOR: |U|-|A∩B|=6-2=4。

## CAND-G3A-005 | ch1 | application | d=3 | rja.1.3.01 | equiv_transform+classification
STEM: 设全集 $U=\{x\in\mathbb{N}^*\mid x\le 10\}$，$A=\{x\in U\mid x\text{ 为偶数}\}$，$B=\{x\in U\mid x\text{ 为 }3\text{ 的倍数}\}$。
（1）求 $A\cup B$；
（2）求 $|\complement_U(A\cup B)|$。
ANS: （1）$A\cup B=\{2,3,4,6,8,9,10\}$；（2）$3$。
ANALYSIS: $A=\{2,4,6,8,10\}$，$B=\{3,6,9\}$，故 $A\cup B=\{2,3,4,6,8,9,10\}$。$\complement_U(A\cup B)=\{1,5,7\}$，个数为 $3$。
AUTHOR: 并7元；补{1,5,7}共3。
RUBRIC: [{"key":"union","title":"并集","score":4,"criterion":"正确列出 A∪B 七元"},{"key":"comp","title":"补集个数","score":4,"criterion":"得 3"}]

## CAND-G3A-006 | ch1 | single | d=1 | rja.1.5.03 | defn
STEM: 命题“$\forall x\in\mathbb{R}$，$x^2+1>0$”的否定是
OPT: {"A":"$\\forall x\\in\\mathbb{R}$，$x^2+1\\le 0$","B":"$\\exists x\\in\\mathbb{R}$，$x^2+1\\le 0$","C":"$\\exists x\\in\\mathbb{R}$，$x^2+1>0$","D":"$\\forall x\\in\\mathbb{R}$，$x^2+1=0$"}
ANS: B
ANALYSIS: 全称命题否定为存在量词加谓词否定：$\exists x\in\mathbb{R}$，$x^2+1\le 0$。选 B。
AUTHOR: ∀P 否定为 ∃¬P。 [quota: d2→d1 基础题]

## CAND-G3A-007 | ch2 | single | d=1 | rja.2.1.02 | equiv_transform
STEM: 已知 $a=3.2$，$b=\dfrac{16}{5}$，则
OPT: {"A":"$a>b$","B":"$a<b$","C":"$a=b$","D":"不能确定"}
ANS: C
ANALYSIS: $\dfrac{16}{5}=3.2$，故 $a=b$，选 C。
AUTHOR: 16/5=3.2。

## CAND-G3A-008 | ch2 | judge | d=1 | rja.2.1.01 | classification
STEM: 判断：若 $a>b$，则 $a^2>b^2$。
ANS: false
ANALYSIS: 反例：$a=1$，$b=-2$，有 $a>b$ 但 $a^2=1<4=b^2$。命题错误。
AUTHOR: 未限定同号非负则不成立。

## CAND-G3A-009 | ch2 | numeric | d=2 | rja.2.2.01 | num_shape
STEM: 若正实数 $x,y$ 满足 $xy=9$，则 $x+y$ 的最小值是
ANS: 6
ANALYSIS: $x+y\ge 2\sqrt{xy}=2\sqrt{9}=6$，当且仅当 $x=y=3$ 时取等，故最小值为 $6$。
AUTHOR: 2√9=6，等号 x=y=3。

## CAND-G3A-010 | ch2 | single | d=1 | rja.2.2.02 | num_shape+special_value
STEM: 正实数 $x$ 使 $x+\dfrac{4}{x}$ 取最小值时，$x=$
OPT: {"A":"$1$","B":"$2$","C":"$4$","D":"$\\dfrac{1}{2}$"}
ANS: B
ANALYSIS: $x+\dfrac{4}{x}\ge 2\sqrt{4}=4$，等号当 $x=\dfrac{4}{x}$ 即 $x=2$（正）时成立。选 B。
AUTHOR: 等号 x=4/x ⇒ x=2。 [quota: d2→d1 基础题]

## CAND-G3A-011 | ch2 | multi | d=2 | rja.2.3.02 | classification
STEM: 关于不等式 $x^2-x-6\ge 0$ 的解集，正确的有（多选）
OPT: {"A":"解集为 $(-\\infty,-2]\\cup[3,+\\infty)$","B":"$-2$ 是解","C":"$0$ 是解","D":"$3$ 是解"}
ANS: A,B,D
ANALYSIS: $(x-3)(x+2)\ge 0$，解集 $(-\infty,-2]\cup[3,+\infty)$。$-2,3$ 为解；$x=0$ 使左边为 $-6<0$，不是解。故 A、B、D。
AUTHOR: 根 -2,3；含端点；0 不在解集。

## CAND-G3A-012 | ch2 | numeric | d=1 | rja.2.3.01 | equiv_transform
STEM: 若方程 $x^2-6x+k=0$ 有实根，则 $k$ 的最大值是
ANS: 9
ANALYSIS: $\Delta=36-4k\ge 0\Rightarrow k\le 9$，故 $k$ 最大值为 $9$。
AUTHOR: Δ≥0 ⇒ k≤9。

## CAND-G3A-013 | ch2 | application | d=3 | rja.2.3.03 | equiv_transform+mono_analysis
STEM: 设关于 $x$ 的方程 $x^2-mx+4=0$ 有两个实数根。
（1）求实数 $m$ 的取值范围；
（2）当 $m=5$ 时，求两根之和与两根之积。
ANS: （1）$m\le -4$ 或 $m\ge 4$；（2）两根之和为 $5$，两根之积为 $4$。
ANALYSIS: （1）$\Delta=m^2-16\ge 0\Rightarrow m\le -4$ 或 $m\ge 4$。（2）由韦达定理，和为 $5$，积为 $4$。
AUTHOR: Δ=m²-16≥0；m=5 时和5积4。
RUBRIC: [{"key":"delta","title":"判别式","score":3,"criterion":"写出 Δ=m²-16≥0"},{"key":"range","title":"参数范围","score":4,"criterion":"m≤-4 或 m≥4"},{"key":"vieta","title":"韦达","score":3,"criterion":"和为5、积为4"}]

## CAND-G3A-014 | ch2 | application | d=2 | rja.2.2.04 | num_shape+mono_analysis
STEM: 用长为 $18\,\mathrm{m}$ 的篱笆围矩形花坛（四边均用篱笆）。设垂直于墙方向不考虑，矩形一边长为 $x\,\mathrm{m}$（$0<x<9$），求面积的最大值。
ANS: 面积最大值为 $\dfrac{81}{2}\,\mathrm{m}^2$（当 $x=\dfrac{9}{2}$ 时）。
ANALYSIS: 另一边长为 $18-2x$。$S(x)=x(18-2x)=18x-2x^2=-2\left(x-\dfrac{9}{2}\right)^2+\dfrac{81}{2}$。顶点 $x=\dfrac{9}{2}\in(0,9)$，最大面积 $S_{\max}=\dfrac{81}{2}$？ 更正：$-2(x-9/2)^2+81/2，当 x=9/2 时 S=81/2。 再算：18·(9/2)-2·(81/4)=81-81/2=81/2。答案应为 81/2 m²。
AUTHOR: S(9/2)=81/2。
RUBRIC: [{"key":"model","title":"建模","score":3,"criterion":"写出 S=x(18-2x)"},{"key":"opt","title":"最值","score":3,"criterion":"最大面积 81/2"},{"key":"side","title":"边长","score":2,"criterion":"x=9/2 时取得"}]

## CAND-G3A-015 | ch2 | single | d=3 | rja.2.3.04 | mono_analysis
STEM: 函数 $f(x)=-x^2+4x+1$ 在区间 $[0,5]$ 上的最大值是
OPT: {"A":"$1$","B":"$5$","C":"$6$","D":"$-4$"}
ANS: B
ANALYSIS: 开口向下，对称轴 $x=2\in[0,5]$，最大值 $f(2)=-4+8+1=5$，选 B。
AUTHOR: 顶点 x=2，f(2)=5，选 B。

## CAND-G3A-016 | ch2 | application | d=3 | rja.2.3.05 | equiv_transform+classification
STEM: 已知方程 $x^2-(k+1)x+k=0$ 有两个不相等的正实根，求实数 $k$ 的取值范围。
ANS: $k>0$ 且 $k\ne 1$。
ANALYSIS: 需 $\Delta>0$，和 $>0$，积 $>0$。$\Delta=(k-1)^2$，故 $k\ne 1$；积 $k>0$；和 $k+1>0\Rightarrow k>-1$。综合得 $k>0$ 且 $k\ne 1$。
AUTHOR: Δ=(k-1)²；k>0且k≠1。
RUBRIC: [{"key":"cond","title":"根分布条件","score":4,"criterion":"写出 Δ>0、和>0、积>0"},{"key":"solve","title":"解不等式组","score":4,"criterion":"得 k>0 且 k≠1"},{"key":"verify","title":"检验","score":2,"criterion":"说明 k=1 为等根排除"}]

## CAND-G3A-017 | ch3 | single | d=1 | rja.3.1.02 | domain_symmetry
STEM: 函数 $f(x)=\dfrac{1}{x-3}+\sqrt{x+1}$ 的定义域是
OPT: {"A":"$[-1,+\\infty)$","B":"$(-1,+\\infty)\\setminus\\{3\\}$","C":"$[-1,+\\infty)\\setminus\\{3\\}$","D":"$(3,+\\infty)$"}
ANS: C
ANALYSIS: 需 $x+1\ge 0$ 且 $x\ne 3$，即 $x\ge -1$ 且 $x\ne 3$，选 C。
AUTHOR: x≥-1 且 x≠3。

## CAND-G3A-018 | ch3 | numeric | d=1 | rja.3.1.09 | special_value
STEM: 设 $f(x)=\begin{cases} x+2,&x<0\\ x^2,&x\ge 0\end{cases}$，则 $f(-3)+f(2)=$
ANS: 3
ANALYSIS: $f(-3)=-1$，$f(2)=4$，故和为 $3$。
AUTHOR: -1+4=3。

## CAND-G3A-019 | ch3 | multi | d=2 | rja.3.1.05 | classification+defn
STEM: 下列说法正确的有（多选）
OPT: {"A":"$y=x$ 与 $y=\\sqrt[3]{x^3}$ 是同一函数","B":"$y=x$ 与 $y=\\dfrac{x^2}{x}$ 是同一函数","C":"$y=\\sqrt{x^2}$ 与 $y=|x|$ 是同一函数","D":"$y=|x|$ 与 $y=x$ 是同一函数"}
ANS: A,C
ANALYSIS: A：对应法则与定义域皆为 $\mathbb{R}$ 上的恒等，相同。B：后者定义域不含 $0$，不同。C：二者均为 $|x|$，定义域 $\mathbb{R}$，相同。D：奇偶与取值不同，不同。故 A、C。
AUTHOR: A、C 同；B 缺0；D 非同。

## CAND-G3A-020 | ch3 | judge | d=1 | rja.3.2.01 | mono_analysis
STEM: 判断：函数 $f(x)=2x-5$ 在 $\mathbb{R}$ 上是增函数。
ANS: true
ANALYSIS: 对任意 $x_1<x_2$，有 $f(x_1)-f(x_2)=2(x_1-x_2)<0$，即 $f(x_1)<f(x_2)$，故为增函数。
AUTHOR: 斜率2>0，全局增。

## CAND-G3A-021 | ch3 | single | d=1 | rja.3.2.03 | mono_analysis+equiv_transform
STEM: 函数 $f(x)=-x^2+2x$ 的单调递减区间是
OPT: {"A":"$(-\\infty,1]$","B":"$[1,+\\infty)$","C":"$(-\\infty,0]$","D":"$[0,+\\infty)$"}
ANS: B
ANALYSIS: 开口向下，对称轴 $x=1$，故在 $[1,+\infty)$ 上递减。选 B。
AUTHOR: 对称轴 x=1；右侧递减。 [quota: d2→d1 基础题]

## CAND-G3A-022 | ch3 | single | d=2 | rja.3.2.10 | parity_apply+domain_symmetry
STEM: 函数 $f(x)=x^3-x$ 是
OPT: {"A":"奇函数","B":"偶函数","C":"既奇又偶","D":"非奇非偶"}
ANS: A
ANALYSIS: 定义域关于原点对称，$f(-x)=-x^3+x=-(x^3-x)=-f(x)$，故为奇函数。选 A。
AUTHOR: f(-x)=-f(x)。

## CAND-G3A-023 | ch3 | numeric | d=2 | rja.3.2.12 | parity_apply
STEM: 已知 $f(x)$ 是定义在 $\mathbb{R}$ 上的奇函数，且 $f(3)=5$，则 $f(-3)+f(0)=$
ANS: -5
ANALYSIS: 奇函数有 $f(0)=0$，$f(-3)=-f(3)=-5$，故 $f(-3)+f(0)=-5$。
AUTHOR: f(0)=0；f(-3)=-5。

## CAND-G3A-024 | ch3 | single | d=2 | rja.3.3.04 | mono_analysis+graph_symmetry
STEM: 在区间 $(0,+\infty)$ 上为减函数的幂函数是
OPT: {"A":"$y=x^{\\frac{1}{2}}$","B":"$y=x^2$","C":"$y=x^{-1}$","D":"$y=x^{3}$"}
ANS: C
ANALYSIS: $y=x^{-1}=\dfrac{1}{x}$ 在 $(0,+\infty)$ 上递减；其余在该区间均递增。选 C。
AUTHOR: α=-1<0，正半轴递减。

## CAND-G3A-025 | ch3 | multi | d=2 | rja.3.3.05 | parity_apply
STEM: 下列幂函数中是奇函数的有（多选）
OPT: {"A":"$y=x$","B":"$y=x^3$","C":"$y=x^2$","D":"$y=x^{-1}$"}
ANS: A,B,D
ANALYSIS: $y=x$、$y=x^3$、$y=x^{-1}$ 均为奇函数；$y=x^2$ 为偶函数。故 A、B、D。
AUTHOR: 偶指数偶函数；奇指数（含-1）奇函数。

## CAND-G3A-026 | ch3 | application | d=3 | rja.3.2.12 | parity_apply+special_value
STEM: 已知函数 $f(x)$ 对定义域内任意 $x$ 满足 $f(x)+f(-x)=0$，且当 $x>0$ 时 $f(x)=x+\dfrac{1}{x}$。
（1）说明 $f$ 的奇偶性；
（2）求 $f(-2)$。
ANS: （1）$f$ 为奇函数；（2）$f(-2)=-\dfrac{5}{2}$。
ANALYSIS: （1）$f(x)+f(-x)=0\Rightarrow f(-x)=-f(x)$，为奇函数。
（2）$f(2)=2+\dfrac{1}{2}=\dfrac{5}{2}$，故 $f(-2)=-f(2)=-\dfrac{5}{2}$。
AUTHOR: f(2)=5/2；f(-2)=-5/2。
RUBRIC: [{"key":"domain","title":"定义域","score":2,"criterion":"写出定义域条件"},{"key":"odd","title":"奇性","score":3,"criterion":"证 f(-x)=-f(x)"},{"key":"val","title":"求值","score":5,"criterion":"得 f(-2)=-3"}]

## CAND-G3A-027 | ch3 | application | d=2 | rja.3.4.04 | num_shape+mono_analysis
STEM: 某商品进价 $10$ 元/件，当售价为 $x$ 元（$10<x<40$）时，日销售量为 $(40-x)$ 件。求使日利润最大的售价及最大日利润。
ANS: 售价 $25$ 元时，最大日利润为 $225$ 元。
ANALYSIS: 日利润 $P(x)=(x-10)(40-x)=-x^2+50x-400=-(x-25)^2+225$。当 $x=25$ 时最大利润为 $225$ 元。
AUTHOR: 顶点 x=25，P=225。
RUBRIC: [{"key":"expr","title":"利润函数","score":3,"criterion":"写出 P(x)= (40-x)(x-10) 或等价"},{"key":"max","title":"最大利润","score":3,"criterion":"得最大利润 225"},{"key":"price","title":"定价","score":2,"criterion":"单价 25 元"}]

## CAND-G3A-028 | ch3 | application | d=3 | rja.3.2.08 | mono_analysis+substitution
STEM: 设 $f(x)=x+\dfrac{1}{x}$，$x\in[1,4]$。
（1）判断 $f$ 在 $[1,4]$ 上的单调性；
（2）求 $f$ 在该区间上的最大值与最小值。
ANS: （1）在 $[1,4]$ 上单调递增；（2）最小值为 $2$，最大值为 $\dfrac{17}{4}$。
ANALYSIS: 对 $1\le x_1<x_2\le 4$，$f(x_1)-f(x_2)=(x_1-x_2)\big(1-\dfrac{1}{x_1x_2}\big)$。因 $x_1x_2\ge 1$，括号非负且 $x_1-x_2<0$，故 $f(x_1)<f(x_2)$，递增。从而最小值 $f(1)=2$，最大值 $f(4)=\dfrac{17}{4}$。
AUTHOR: 递增；min=2；max=17/4。
RUBRIC: [{"key":"mono","title":"单调性","score":4,"criterion":"证在 [1,4] 上递增"},{"key":"minmax","title":"最值","score":4,"criterion":"min=2，max=17/4"},{"key":"range","title":"值域","score":4,"criterion":"值域 [2,17/4]"}]

## CAND-G3A-029 | ch4 | single | d=1 | rja.4.1.02 | equiv_transform
STEM: $16^{\frac{3}{4}}$ 等于
OPT: {"A":"$2$","B":"$4$","C":"$8$","D":"$12$"}
ANS: C
ANALYSIS: $16^{\frac{3}{4}}=(2^4)^{\frac{3}{4}}=2^3=8$，选 C。
AUTHOR: (2^4)^(3/4)=2^3=8。

## CAND-G3A-030 | ch4 | numeric | d=1 | rja.4.1.03 | equiv_transform
STEM: 计算 $2^3\cdot 2^{-1}=$
ANS: 4
ANALYSIS: $2^3\cdot 2^{-1}=2^{2}=4$。
AUTHOR: 2^(3-1)=4。

## CAND-G3A-031 | ch4 | single | d=2 | rja.4.2.02 | mono_analysis+special_value
STEM: 若 $0<a<b$，则下列正确的是
OPT: {"A":"$(\\dfrac{1}{2})^a>(\\dfrac{1}{2})^b$","B":"$(\\dfrac{1}{2})^a<(\\dfrac{1}{2})^b$","C":"$2^a<2^{-b}$","D":"$a^2>b^2$ 恒成立"}
ANS: A
ANALYSIS: 底 $\dfrac{1}{2}\in(0,1)$，指数函数递减，由 $a<b$ 得 $(\dfrac{1}{2})^a>(\dfrac{1}{2})^b$。选 A。
AUTHOR: (1/2)^x 递减 ⇒ a<b 时值反序。

## CAND-G3A-032 | ch4 | numeric | d=2 | rja.4.2.03 | substitution
STEM: 方程 $9^x-10\cdot 3^x+9=0$ 的较大根是
ANS: 2
ANALYSIS: 令 $t=3^x>0$，则 $t^2-10t+9=0$，$(t-1)(t-9)=0$，得 $t=1$ 或 $9$。$3^x=1\Rightarrow x=0$；$3^x=9\Rightarrow x=2$。较大根为 $2$。
AUTHOR: t=1或9 ⇒ x=0或2。

## CAND-G3A-033 | ch4 | judge | d=1 | rja.4.3.01 | defn
STEM: 判断：$\log_2 8=3$。
ANS: true
ANALYSIS: 因为 $2^3=8$，故 $\log_2 8=3$。命题正确。
AUTHOR: 2^3=8。

## CAND-G3A-034 | ch4 | single | d=2 | rja.4.3.02 | equiv_transform+special_value
STEM: $\log_2 24-\log_2 3$ 等于
OPT: {"A":"$2$","B":"$3$","C":"$4$","D":"$\\log_2 21$"}
ANS: B
ANALYSIS: $\log_2 24-\log_2 3=\log_2\dfrac{24}{3}=\log_2 8=3$。选 B。A 为 $\log_2 4$；C 为 $\log_2 16$；D 误用差为真数相减。
AUTHOR: log2(8)=3；去重改底数与真数。

## CAND-G3A-035 | ch4 | numeric | d=2 | rja.4.3.03 | equiv_transform
STEM: $\dfrac{\log_2 9}{\log_2 3}=$
ANS: 2
ANALYSIS: 由换底公式 $\dfrac{\log_2 9}{\log_2 3}=\log_3 9=2$。
AUTHOR: log3(9)=2。

## CAND-G3A-036 | ch4 | multi | d=2 | rja.4.4.02 | mono_analysis+special_value
STEM: 设 $f(x)=\log_{\frac{1}{2}} x$，则下列正确的有（多选）
OPT: {"A":"$f$ 在 $(0,+\\infty)$ 上递减","B":"$f(4)<f(2)$","C":"$f(4)>f(2)$","D":"$f(1)=0$"}
ANS: A,B,D
ANALYSIS: 底 $\in(0,1)$，$f$ 在 $(0,+\infty)$ 上递减，故 A 对；由 $4>2$ 得 $f(4)<f(2)$，B 对、C 错；$f(1)=\log_{\frac12}1=0$，D 对。故 A、B、D。
AUTHOR: 递减；f(4)<f(2)；f(1)=0。

## CAND-G3A-037 | ch4 | single | d=2 | rja.4.4.03 | graph_symmetry
STEM: 函数 $y=10^x$ 与 $y=\lg x$ 的图象（在各自定义域上）的位置关系是
OPT: {"A":"关于原点对称","B":"关于直线 $y=x$ 对称","C":"关于 $x$ 轴对称","D":"关于 $y$ 轴对称"}
ANS: B
ANALYSIS: 互为反函数的两个函数图象关于直线 $y=x$ 对称。$y=10^x$ 与 $y=\lg x$ 互为反函数，故选 B。
AUTHOR: 反函数图象关于 y=x；quota judge→single 保持d2

## CAND-G3A-038 | ch4 | single | d=3 | rja.4.2.04 | graph_symmetry+special_value
STEM: 要得到 $y=2^{x-1}$ 的图象，可将 $y=2^x$ 的图象
OPT: {"A":"向右平移 $1$ 个单位","B":"向左平移 $1$ 个单位","C":"向上平移 $1$ 个单位","D":"向下平移 $1$ 个单位"}
ANS: A
ANALYSIS: $y=2^{x-1}$ 由 $y=2^x$ 中 $x$ 换为 $x-1$，即向右平移 $1$ 个单位。选 A。
AUTHOR: x→x-1 为右移1。

## CAND-G3A-039 | ch4 | application | d=3 | rja.4.5.04 | special_value+equiv_transform
STEM: 某放射性样品初始质量 $800\,\mathrm{g}$，每经过 $1\,\mathrm{h}$ 质量变为原来的 $\dfrac{1}{2}$。设 $t$ 小时后质量为 $N(t)\,\mathrm{g}$。
（1）写出 $N(t)$；
（2）经过多少整小时质量首次低于 $100\,\mathrm{g}$？
ANS: （1）$N(t)=800\cdot\left(\dfrac{1}{2}\right)^t$；（2）$4\,\mathrm{h}$。
ANALYSIS: （1）$N(t)=800\cdot\left(\dfrac{1}{2}\right)^t$。
（2）$800\cdot2^{-t}<100\Rightarrow 2^{-t}<\dfrac{1}{8}=2^{-3}\Rightarrow t>3$。整小时取最小 $t=4$，此时 $N(4)=50\,\mathrm{g}<100\,\mathrm{g}$。
AUTHOR: 800·2^{-4}=50<100；t=4。
RUBRIC: [{"key":"model","title":"模型","score":4,"criterion":"写出 N(t)=800·0.5^t"},{"key":"half","title":"半衰期","score":3,"criterion":"t=3 时 N=100"},{"key":"read","title":"读数","score":3,"criterion":"数量为 100"}]

## CAND-G3A-040 | ch4 | application | d=2 | rja.4.5.02 | equiv_transform
STEM: 地震震级 $M=\lg\dfrac{E}{E_0}$（$E_0$ 为参考能量）。若某次地震释放能量 $E=10^4 E_0$，求震级 $M$。
ANS: $M=4$。
ANALYSIS: $M=\lg(10^4)=4$。
AUTHOR: lg(10^4)=4。
RUBRIC: [{"key":"sub","title":"代入","score":3,"criterion":"M=\\lg(E/E_0)"},{"key":"calc","title":"计算","score":5,"criterion":"M=4"}]

## CAND-G3A-041 | ch4 | numeric | d=2 | rja.4.3.04 | equiv_transform+substitution
STEM: 方程 $\log_3 x+\log_3(x-2)=1$ 的解是
ANS: 3
ANALYSIS: 需 $x>2$。$\log_3[x(x-2)]=1\Rightarrow x(x-2)=3\Rightarrow x^2-2x-3=0\Rightarrow(x-3)(x+1)=0$，取 $x=3$。
AUTHOR: log3(x)+log3(x-2)=1 ⇒ x=3。

## CAND-G3A-042 | ch4 | application | d=3 | rja.4.5.03 | mono_analysis+num_shape
STEM: 设 $f(x)=2^x-3$。
（1）说明 $f$ 在 $\mathbb{R}$ 上单调递增；
（2）用二分法思想判断方程 $2^x=3$ 的正根位于哪个长度不超过 $0.5$ 的区间内。
ANS: （1）$f$ 递增；（2）根位于 $(1.5,2)$。
ANALYSIS: （1）$2^x$ 底 $>1$，在 $\mathbb{R}$ 递增，故 $f(x)=2^x-3$ 递增。
（2）$f(1)=2-3=-1<0$，$f(2)=4-3=1>0$，由零点存在定理根在 $(1,2)$。$f(1.5)=2\sqrt{2}-3\approx2.828-3<0$，故根在 $(1.5,2)$，区间长 $0.5$。
AUTHOR: f(1)<0,f(2)>0,f(1.5)<0 ⇒ 根∈(1.5,2)。
RUBRIC: [{"key":"mono","title":"单调性","score":4,"criterion":"说明 f 在 [1,2] 递增"},{"key":"mid","title":"中点","score":3,"criterion":"f(1.5)<0"},{"key":"root","title":"根区间","score":3,"criterion":"根在 (1.5,2)"}]

## CAND-G3A-043 | ch5 | single | d=1 | rja.5.1.02 | equiv_transform
STEM: $210^\circ$ 化为弧度是
OPT: {"A":"$\\dfrac{7\\pi}{6}$","B":"$\\dfrac{5\\pi}{6}$","C":"$\\dfrac{4\\pi}{3}$","D":"$\\dfrac{3\\pi}{4}$"}
ANS: A
ANALYSIS: $210^\circ=210\cdot\dfrac{\pi}{180}=\dfrac{7\pi}{6}$，选 A。
AUTHOR: 210π/180=7π/6。

## CAND-G3A-044 | ch5 | numeric | d=1 | rja.5.1.01 | defn
STEM: 与角 $\dfrac{11\pi}{6}$ 终边相同且位于 $[0,2\pi)$ 的角是 $\dfrac{k\pi}{6}$，则正整数 $k=$
ANS: 11
ANALYSIS: $\dfrac{11\pi}{6}$ 本身已在 $[0,2\pi)$，故 $k=11$。
AUTHOR: 11π/6∈[0,2π)，k=11。

## CAND-G3A-045 | ch5 | application | d=2 | rja.5.1.03 | special_value
STEM: 在单位圆（半径为 $1$）中，圆心角为 $\dfrac{2\pi}{3}$ 的扇形。
（1）求弧长 $l$；
（2）求扇形面积 $S$。
ANS: （1）$l=\dfrac{2\pi}{3}$；（2）$S=\dfrac{\pi}{3}$。
ANALYSIS: （1）$l=r\theta=1\cdot\dfrac{2\pi}{3}=\dfrac{2\pi}{3}$。
（2）$S=\dfrac{1}{2}r^2\theta=\dfrac{1}{2}\cdot\dfrac{2\pi}{3}=\dfrac{\pi}{3}$。
AUTHOR: r=1；l=2π/3；S=π/3。
RUBRIC: [{"key":"arc","title":"弧长","score":4,"criterion":"π/3"},{"key":"area","title":"扇形面积","score":4,"criterion":"π/6"}]

## CAND-G3A-046 | ch5 | single | d=1 | rja.5.2.01 | defn
STEM: 角 $\beta$ 终边上一点 $Q(-5,12)$，则 $\cos\beta=$
OPT: {"A":"$-\\dfrac{5}{13}$","B":"$\\dfrac{5}{13}$","C":"$\\dfrac{12}{13}$","D":"$-\\dfrac{12}{13}$"}
ANS: A
ANALYSIS: $r=\sqrt{(-5)^2+12^2}=13$，$\cos\beta=\dfrac{x}{r}=\dfrac{-5}{13}$，选 A。
AUTHOR: r=13，cos=-5/13。 [quota: d2→d1 基础题]

## CAND-G3A-047 | ch5 | multi | d=2 | rja.5.2.02 | equiv_transform
STEM: 若 $\cos\theta=\dfrac{5}{13}$ 且 $\theta$ 在第四象限，则正确的有（多选）
OPT: {"A":"$\\sin\\theta=-\\dfrac{12}{13}$","B":"$\\tan\\theta=-\\dfrac{12}{5}$","C":"$\\sin\\theta=\\dfrac{12}{13}$","D":"$\\tan\\theta=\\dfrac{12}{5}$"}
ANS: A,B
ANALYSIS: 第四象限正弦为负：$\sin\theta=-\sqrt{1-\cos^2\theta}=-\dfrac{12}{13}$。$\tan\theta=\dfrac{\sin\theta}{\cos\theta}=\dfrac{-12/13}{5/13}=-\dfrac{12}{5}$。故 A、B。
AUTHOR: sin=-12/13，tan=-12/5。

## CAND-G3A-048 | ch5 | numeric | d=1 | rja.5.3.01 | equiv_transform+special_value
STEM: $\cos\left(\pi-\dfrac{\pi}{3}\right)=$（填小数）
ANS: -0.5
ANALYSIS: 由诱导公式 $\cos(\pi-\alpha)=-\cos\alpha$，得 $\cos\left(\pi-\dfrac{\pi}{3}\right)=-\cos\dfrac{\pi}{3}=-\dfrac{1}{2}=-0.5$。
AUTHOR: cos(π-π/3)=cos(2π/3)=-1/2。

## CAND-G3A-049 | ch5 | single | d=2 | rja.5.4.01 | defn
STEM: 函数 $y=\sin x$ 在 $[0,2\pi]$ 上取最大值的 $x$ 为
OPT: {"A":"$\\dfrac{\\pi}{2}$","B":"$\\pi$","C":"$\\dfrac{3\\pi}{2}$","D":"$2\\pi$"}
ANS: A
ANALYSIS: $\sin x$ 在 $[0,2\pi]$ 上于 $x=\dfrac{\pi}{2}$ 取最大值 $1$，选 A。
AUTHOR: sin(π/2)=1 为最大。

## CAND-G3A-050 | ch5 | judge | d=1 | rja.5.4.02 | parity_apply
STEM: 判断：$y=\cos x$ 的图象关于 $y$ 轴对称。
ANS: true
ANALYSIS: $\cos(-x)=\cos x$，为偶函数，图象关于 $y$ 轴对称，命题正确。
AUTHOR: 偶函数 ⇒ y轴对称。

## CAND-G3A-051 | ch5 | application | d=3 | rja.5.5.02 | equiv_transform
STEM: 已知 $\cos\alpha=-\dfrac{12}{13}$，且 $\alpha$ 为钝角。
（1）求 $\sin\alpha$；
（2）求 $\sin 2\alpha$。
ANS: （1）$\sin\alpha=\dfrac{5}{13}$；（2）$\sin 2\alpha=-\dfrac{120}{169}$。
ANALYSIS: 钝角正弦为正：$\sin\alpha=\sqrt{1-\cos^2\alpha}=\dfrac{5}{13}$。
$\sin2\alpha=2\sin\alpha\cos\alpha=2\cdot\dfrac{5}{13}\cdot\left(-\dfrac{12}{13}\right)=-\dfrac{120}{169}$。
AUTHOR: sin=5/13；sin2α=-120/169。
RUBRIC: [{"key":"sin","title":"正弦","score":3,"criterion":"5/13"},{"key":"double","title":"二倍角正弦","score":5,"criterion":"120/169"}]

## CAND-G3A-052 | ch5 | multi | d=2 | rja.5.5.01 | equiv_transform
STEM: 关于和差角与二倍角公式，下列说法正确的有（多选）
OPT: {"A":"$\\cos(A-B)=\\cos A\\cos B+\\sin A\\sin B$","B":"$\\sin 2A=2\\sin A\\cos A$","C":"$\\cos 2A=\\cos^2 A-\\sin^2 A$","D":"$\\tan(A-B)=\\dfrac{\\tan A-\\tan B}{1+\\tan A\\tan B}$ 在定义成立时恒成立"}
ANS: A,B,C,D
ANALYSIS: A 为余弦差角公式；B、C 为二倍角常见形式；D 为正切差角公式（在使式中分母非零且正切有定义时成立）。四项均正确。
AUTHOR: 全对；避免与旧批「下列恒等式正确的有」撞 stem。

## CAND-G3A-053 | ch5 | application | d=3 | rja.5.6.01 | special_value+defn
STEM: 已知 $y=2\sin\left(\dfrac{1}{2}x+\dfrac{\pi}{4}\right)$。
（1）求振幅与最小正周期；
（2）求 $x=\dfrac{\pi}{2}$ 时的函数值。
ANS: （1）振幅 $2$，周期 $4\pi$；（2）$2$。
ANALYSIS: 振幅 $A=2$，$\omega=\dfrac{1}{2}$，周期 $T=\dfrac{2\pi}{|\omega|}=4\pi$。$x=\dfrac{\pi}{2}$ 时，$y=2\sin\left(\dfrac{\pi}{4}+\dfrac{\pi}{4}\right)=2\sin\dfrac{\pi}{2}=2$。
AUTHOR: A=2,T=4π；x=π/2时 y=2。
RUBRIC: [{"key":"amp","title":"振幅","score":2,"criterion":"2"},{"key":"T","title":"周期","score":4,"criterion":"4π"},{"key":"val","title":"x=π/2 值","score":4,"criterion":"2"}]

## CAND-G3A-054 | ch5 | multi | d=3 | rja.5.6.02 | graph_symmetry+special_value
STEM: 要把 $y=\cos x$ 的图象变成 $y=\cos 2x$，正确叙述有（多选）
OPT: {"A":"横坐标缩短为原来的一半","B":"横坐标伸长为原来的两倍","C":"纵坐标不变","D":"必须同时向右平移 $\\dfrac{\\pi}{4}$"}
ANS: A,C
ANALYSIS: $y=\cos 2x$ 中 $x$ 换为 $2x$，横坐标变为原来的 $\dfrac{1}{2}$，纵坐标不变，无需平移。故 A、C。
AUTHOR: x→2x 横坐标减半。

## CAND-G3A-055 | ch5 | application | d=3 | rja.5.7.03 | special_value+classification
STEM: 在 $\triangle ABC$ 中，$A=30^\circ$，$BC=a=6$，$AC=b=6\sqrt{2}$。
（1）用正弦定理求 $\sin B$；
（2）求角 $B$ 的可能值并说明此题属于哪种情形。
ANS: （1）$\sin B=\dfrac{\sqrt{2}}{2}$；（2）$B=45^\circ$ 或 $B=135^\circ$，属于 SSA 可能两解情形。
ANALYSIS: （1）$\sin B=\dfrac{b\sin A}{a}=\dfrac{6\sqrt{2}\cdot\sin30^\circ}{6}=\dfrac{6\sqrt{2}\cdot\dfrac{1}{2}}{6}=\dfrac{\sqrt{2}}{2}$。
（2）$\sin B=\dfrac{\sqrt{2}}{2}$，且 $0^\circ<B<180^\circ$，得 $B=45^\circ$ 或 $B=135^\circ$。当 $B=135^\circ$ 时 $A+B=165^\circ$，$C=15^\circ$ 仍合法；当 $B=45^\circ$ 时 $C=105^\circ$。故为 SSA 两解情形。
AUTHOR: sin B=√2/2；B=45°或135°。
RUBRIC: [{"key":"law","title":"正弦定理","score":4,"criterion":"写出 sin B=bsinA/a"},{"key":"sinB","title":"sin B","score":4,"criterion":"√2/2"},{"key":"ambig","title":"解的个数","score":4,"criterion":"两解 B=45°或135°"}]

## CAND-G3A-056 | ch5 | numeric | d=3 | rja.5.5.03 | equiv_transform+special_value
STEM: 函数 $y=5\sin x+12\cos x$ 的最大值为
ANS: 13
ANALYSIS: $R=\sqrt{5^2+12^2}=13$，故最大值为 $13$。
AUTHOR: R=13。

## CAND-G3A-057 | ch5 | single | d=2 | rja.5.3.02 | equiv_transform
STEM: 已知 $\tan\alpha=2$，则 $\dfrac{\sin\alpha+\cos\alpha}{\sin\alpha-\cos\alpha}=$
OPT: {"A":"$3$","B":"$-3$","C":"$\\dfrac{1}{3}$","D":"$-\\dfrac{1}{3}$"}
ANS: A
ANALYSIS: 分子分母同除以 $\cos\alpha$（$\cos\alpha\ne0$），得 $\dfrac{\tan\alpha+1}{\tan\alpha-1}=\dfrac{2+1}{2-1}=3$，选 A。
AUTHOR: (tan+1)/(tan-1)=3。

## CAND-G3A-058 | ch5 | application | d=2 | rja.5.7.02 | special_value+mono_analysis
STEM: 某港口水深（单位 m）近似为 $h(t)=2+\sin\dfrac{\pi t}{6}$，其中 $t$ 为从某日 $0:00$ 起的小时数。
（1）求最高水深；
（2）在 $0\le t\le 12$ 内，首次达到最高水深的时刻 $t$。
ANS: （1）最高水深 $3\,\mathrm{m}$；（2）$t=3$。
ANALYSIS: $\sin\dfrac{\pi t}{6}\in[-1,1]$，故 $h\in[1,3]$，最高为 $3\,\mathrm{m}$。
$\sin\dfrac{\pi t}{6}=1\Rightarrow\dfrac{\pi t}{6}=\dfrac{\pi}{2}+2k\pi$，最小非负解 $t=3$。
AUTHOR: max h=3；sin(πt/6)=1 ⇒ t=3。
RUBRIC: [{"key":"model","title":"模型","score":3,"criterion":"h=2+sin(πt/6)"},{"key":"max","title":"最高水位","score":3,"criterion":"3 m"},{"key":"t","title":"时刻","score":2,"criterion":"t=3 时首次达到最高"}]

## CAND-G3A-059 | ch6 | single | d=1 | rjb.6.1.01 | defn
STEM: 下列物理量中，属于标量的是
OPT: {"A":"速度","B":"加速度","C":"功","D":"动量"}
ANS: C
ANALYSIS: 向量既有大小又有方向；标量只有大小。速度、加速度、动量均有方向，是向量；功只有大小（正负表示做功或克服阻力），是标量。故选 C。
AUTHOR: 功为标量；速加动量为向量

## CAND-G3A-060 | ch6 | judge | d=1 | rjb.6.1.02 | defn
STEM: 零向量的模等于 $0$。
ANS: true
ANALYSIS: 由定义，模长为 $0$ 的向量叫做零向量，故命题正确。
AUTHOR: |0|=0

## CAND-G3A-061 | ch6 | numeric | d=1 | rjb.6.1.02 | num_shape
STEM: 设 $\vec a=(6,-8)$，则 $|\vec a|=$
ANS: 10
ANALYSIS: $|\vec a|=\sqrt{6^2+(-8)^2}=\sqrt{36+64}=\sqrt{100}=10$。
AUTHOR: sqrt(36+64)=10

## CAND-G3A-062 | ch6 | single | d=1 | rjb.6.2.05 | defn
STEM: 已知非零向量 $\vec a$，则实数 $\lambda$ 满足 $\lambda\vec a=\vec 0$ 的充要条件是
OPT: {"A":"$\\lambda>0$","B":"$\\lambda<0$","C":"$\\lambda=0$","D":"$\\lambda=1$"}
ANS: C
ANALYSIS: 非零向量的数乘结果为零向量，当且仅当数乘系数为 $0$。故选 C。
AUTHOR: a≠0 ⇒ λa=0 ⇔ λ=0

## CAND-G3A-063 | ch6 | multi | d=2 | rjb.6.1.03 | classification+defn
STEM: 设 $\vec a\ne\vec 0$，下列说法正确的有（多选）
OPT: {"A":"$|-\\vec a|=|\\vec a|$","B":"$-\\vec a$ 与 $\\vec a$ 方向相反","C":"零向量与任意向量都共线","D":"对任意 $\\vec b$，都有 $|\\vec a|+|\\vec b|=|\\vec a+\\vec b|$"}
ANS: A,B,C
ANALYSIS: A：相反向量模相等。B：非零向量与其相反向量方向相反。C：规定零向量与任意向量共线。D：仅当 $\vec a,\vec b$ 同向（含零）时成立，并非恒成立。故选 A、B、C。
AUTHOR: D三角不等式等号条件

## CAND-G3A-064 | ch6 | numeric | d=2 | rjb.6.2.02 | num_shape
STEM: 设 $\vec a=(3,-1)$，$\vec b=(2,4)$，则 $\vec a\cdot\vec b=$
ANS: 2
ANALYSIS: $\vec a\cdot\vec b=3\times2+(-1)\times4=6-4=2$。
AUTHOR: 6-4=2

## CAND-G3A-065 | ch6 | single | d=2 | rjb.6.2.03 | num_shape+special_value
STEM: 设 $\vec a=(\sqrt3,1)$，$\vec b=(1,\sqrt3)$，则 $\cos\langle\vec a,\vec b\rangle=$
OPT: {"A":"$\\dfrac12$","B":"$\\dfrac{\\sqrt3}{2}$","C":"$\\dfrac{\\sqrt2}{2}$","D":"$1$"}
ANS: B
ANALYSIS: $\vec a\cdot\vec b=\sqrt3+\sqrt3=2\sqrt3$，$|\vec a|=|\vec b|=\sqrt{3+1}=2$，故 $\cos\theta=\dfrac{2\sqrt3}{4}=\dfrac{\sqrt3}{2}$。选 B。
AUTHOR: 2√3/(2·2)=√3/2

## CAND-G3A-066 | ch6 | numeric | d=2 | rjb.6.2.04 | num_shape
STEM: 设 $\vec a=(3,4)$，$\vec b=(1,0)$，则 $\vec a$ 在 $\vec b$ 方向上的投影（数量）为
ANS: 3
ANALYSIS: 投影数量为 $\dfrac{\vec a\cdot\vec b}{|\vec b|}=\dfrac{3}{1}=3$。
AUTHOR: a·b/|b|=3

## CAND-G3A-067 | ch6 | multi | d=2 | rjb.6.3.01 | classification+special_value
STEM: 下列向量组可以作为平面内一组基底的有（多选）
OPT: {"A":"$\\vec e_1=(1,0)$，$\\vec e_2=(0,1)$","B":"$\\vec u=(1,1)$，$\\vec v=(2,2)$","C":"$\\vec p=(1,0)$，$\\vec q=(0,0)$","D":"$\\vec m=(2,1)$，$\\vec n=(-1,3)$"}
ANS: A,D
ANALYSIS: 基底须为两个不共线（线性无关）的向量。A：标准正交基底。B：共线。C：含零向量。D：$2\times3-1\times(-1)=7\ne0$，不共线。故选 A、D。
AUTHOR: D行列式7≠0

## CAND-G3A-068 | ch6 | application | d=3 | rjb.6.4.04 | equiv_transform+substitution
STEM: 如图，在平行四边形 $ABCD$ 中，用向量方法证明：对角线 $AC$ 与 $BD$ 互相平分。
ANS: 设对角线交点为 $O$，则 $\overrightarrow{AO}=\overrightarrow{OC}$ 且 $\overrightarrow{BO}=\overrightarrow{OD}$（或证得交点为两对角线中点）。
ANALYSIS: 设 $\overrightarrow{AB}=\vec a$，$\overrightarrow{AD}=\vec b$。则 $\overrightarrow{AC}=\vec a+\vec b$，$\overrightarrow{BD}=\vec b-\vec a$。对角线中点：取 $AC$ 中点 $M$，则 $\overrightarrow{AM}=\dfrac12(\vec a+\vec b)$；取 $BD$ 中点 $N$，由 $\overrightarrow{AB}+\overrightarrow{BN}=\overrightarrow{AN}$ 得 $\overrightarrow{AN}=\vec a+\dfrac12(\vec b-\vec a)=\dfrac12(\vec a+\vec b)$。故 $M$ 与 $N$ 重合，两对角线互相平分。
AUTHOR: 两对角线中点位置向量同为(a+b)/2
RUBRIC: [{"key":"setup","title":"设基向量","score":3,"criterion":"合理用邻边表示四边形向量"},{"key":"mid","title":"中点向量","score":4,"criterion":"分别写出两对角线中点的位置向量并相等"},{"key":"conc","title":"结论","score":3,"criterion":"得出对角线互相平分"}]

## CAND-G3A-069 | ch6 | application | d=3 | rjb.6.3.02 | num_shape+equiv_transform
STEM: 已知点 $A(1,2)$，$B(7,8)$，$C(3,4)$。判断点 $C$ 是否在线段 $AB$ 上；若是，求 $\overrightarrow{AC}:\overrightarrow{CB}$。
ANS: 是；$\overrightarrow{AC}:\overrightarrow{CB}=1:2$
ANALYSIS: $\overrightarrow{AB}=(6,6)$，$\overrightarrow{AC}=(2,2)=\dfrac13\overrightarrow{AB}$，故 $C$ 在线段 $AB$ 上（分点参数 $t=\dfrac13\in[0,1]$）。$\overrightarrow{CB}=(4,4)$，因此 $\overrightarrow{AC}:\overrightarrow{CB}=1:2$。
AUTHOR: AC=(2,2)=AB/3；CB=(4,4)
RUBRIC: [{"key":"col","title":"共线判定","score":3,"criterion":"说明 $\\overrightarrow{AC}$ 与 $\\overrightarrow{AB}$ 共线且参数在 $[0,1]$"},{"key":"ratio","title":"比值","score":5,"criterion":"得比值 $1:2$"}]

## CAND-G3A-070 | ch6 | judge | d=2 | rjb.6.4.03 | num_shape+special_value
STEM: 大小为 $8\,\mathrm{N}$ 的力作用于物体，物体沿与该力成 $60^\circ$ 角的方向移动 $5\,\mathrm{m}$，则该力所做的功为 $20\,\mathrm{J}$。
ANS: true
ANALYSIS: $W=|\vec F||\vec s|\cos60^\circ=8\times5\times\dfrac12=20$（J）。命题正确。
AUTHOR: 8*5*(1/2)=20；异于G2A的W=100

## CAND-G3A-071 | ch6 | single | d=1 | rjb.6.3.03 | defn
STEM: 非零向量 $\vec a$ 与 $\vec b$ 共线的充要条件是
OPT: {"A":"$\\vec a\\cdot\\vec b=0$","B":"存在实数 $\\lambda$，使 $\\vec b=\\lambda\\vec a$","C":"$|\\vec a|=|\\vec b|$","D":"$\\vec a+\\vec b=\\vec 0$"}
ANS: B
ANALYSIS: 两向量共线（平行）的充要条件是其中一个是另一个的实数倍。A 为垂直；C、D 仅为特殊情形。故选 B。
AUTHOR: b=λa ⇔ 共线

## CAND-G3A-072 | ch6 | application | d=3 | rjb.6.4.01 | equiv_transform+num_shape
STEM: 在 $\triangle ABC$ 中，$\angle C=90^\circ$，$M$ 为斜边 $AB$ 的中点。用向量方法证明：$|\overrightarrow{CM}|=\dfrac12|\overrightarrow{AB}|$。
ANS: $|\overrightarrow{CM}|=\dfrac12|\overrightarrow{AB}|$
ANALYSIS: 设 $\overrightarrow{CA}=\vec a$，$\overrightarrow{CB}=\vec b$，则 $\vec a\cdot\vec b=0$。$\overrightarrow{AB}=\vec b-\vec a$，$M$ 为中点：$\overrightarrow{CM}=\dfrac12(\vec a+\vec b)$。于是 $|\overrightarrow{CM}|^2=\dfrac14(|\vec a|^2+|\vec b|^2)=\dfrac14|\overrightarrow{AB}|^2$，故 $|\overrightarrow{CM}|=\dfrac12|\overrightarrow{AB}|$。
AUTHOR: a·b=0 ⇒ |a+b|^2=|a|^2+|b|^2=|b-a|^2
RUBRIC: [{"key":"setup","title":"设向量","score":3,"criterion":"以直角顶点为原点设两直角边向量并写垂直"},{"key":"mid","title":"中线模","score":5,"criterion":"推出 $|CM|^2=\\frac14|AB|^2$"},{"key":"conc","title":"结论","score":2,"criterion":"得中线为斜边一半"}]

## CAND-G3A-073 | ch7 | single | d=1 | rjb.7.1.01 | defn
STEM: 虚数单位 $\mathrm{i}$ 满足
OPT: {"A":"$\\mathrm{i}^2=1$","B":"$\\mathrm{i}^2=-1$","C":"$\\mathrm{i}=0$","D":"$\\mathrm{i}^2=\\mathrm{i}$"}
ANS: B
ANALYSIS: 由定义，$\mathrm{i}^2=-1$。故选 B。
AUTHOR: i^2=-1

## CAND-G3A-074 | ch7 | judge | d=1 | rjb.7.2.01 | defn
STEM: 两个复数相等的充要条件是它们的实部相等且虚部相等。
ANS: true
ANALYSIS: 设 $z_1=a+b\mathrm{i}$，$z_2=c+d\mathrm{i}$（$a,b,c,d\in\mathbb{R}$），则 $z_1=z_2\Leftrightarrow a=c$ 且 $b=d$。命题正确。
AUTHOR: 实部虚部分别相等

## CAND-G3A-075 | ch7 | numeric | d=2 | rjb.7.3.01 | num_shape
STEM: 复数 $z=5-12\mathrm{i}$ 的模 $|z|=$
ANS: 13
ANALYSIS: $|z|=\sqrt{5^2+(-12)^2}=\sqrt{25+144}=\sqrt{169}=13$。
AUTHOR: sqrt(25+144)=13

## CAND-G3A-076 | ch7 | application | d=3 | rjb.7.2.01 | equiv_transform+num_shape
STEM: 计算 $(1+2\mathrm{i})(3-\mathrm{i})$，并求结果的模。
ANS: $5+5\mathrm{i}$；$|z|=5\sqrt2$
ANALYSIS: $(1+2\mathrm{i})(3-\mathrm{i})=3-\mathrm{i}+6\mathrm{i}-2\mathrm{i}^2=3+5\mathrm{i}+2=5+5\mathrm{i}$。$|5+5\mathrm{i}|=\sqrt{25+25}=5\sqrt2$。
AUTHOR: 3-i+6i+2=5+5i；模5√2
RUBRIC: [{"key":"prod","title":"乘积","score":4,"criterion":"得 $5+5\\mathrm{i}$"},{"key":"mod","title":"模","score":4,"criterion":"得 $5\\sqrt2$"}]

## CAND-G3A-077 | ch8 | single | d=1 | rjb.8.1.01 | defn
STEM: 下列几何体中，一定是棱柱的是
OPT: {"A":"三棱锥","B":"四棱台","C":"直三棱柱","D":"圆锥"}
ANS: C
ANALYSIS: 棱柱有两个平行且全等的底面，侧面均为平行四边形。直三棱柱符合；三棱锥、棱台、圆锥都不是棱柱。故选 C。
AUTHOR: 直三棱柱是棱柱

## CAND-G3A-078 | ch8 | single | d=1 | rjb.8.2.01 | defn
STEM: 用斜二测画法画水平放置的平面图形的直观图时，与 $x$ 轴平行的线段长度
OPT: {"A":"变为原来的一半","B":"保持不变","C":"变为原来的两倍","D":"变为原来的 $\\dfrac{\\sqrt2}{2}$ 倍"}
ANS: B
ANALYSIS: 斜二测画法：平行于 $x$ 轴（或 $z$ 轴）的线段长度不变；平行于 $y$ 轴的线段变为原来的一半。故选 B。
AUTHOR: ∥x轴长度不变

## CAND-G3A-079 | ch8 | numeric | d=1 | rjb.8.3.01 | num_shape
STEM: 底面边长为 $3$ 的正四棱柱，高为 $4$，则其体积为
ANS: 36
ANALYSIS: $V=$ 底面积 $\times$ 高 $=3^2\times4=36$。
AUTHOR: 9*4=36

## CAND-G3A-080 | ch8 | application | d=3 | rjb.8.3.03 | num_shape+classification
STEM: 如图，一个圆柱上底面同心叠放一个同底圆锥：圆柱底面半径为 $2$，高为 $6$；圆锥高为 $3$。求该组合体的体积（用含 $\pi$ 的式子表示）。
ANS: $28\pi$
ANALYSIS: 圆柱体积 $V_1=\pi r^2 h=\pi\cdot4\cdot6=24\pi$。圆锥体积 $V_2=\dfrac13\pi r^2 h=\dfrac13\pi\cdot4\cdot3=4\pi$。组合体体积 $V=V_1+V_2=28\pi$。
AUTHOR: 24π+4π=28π；异于正三棱锥PO=4
RUBRIC: [{"key":"cyl","title":"圆柱","score":3,"criterion":"得圆柱体积 $24\\pi$"},{"key":"cone","title":"圆锥","score":3,"criterion":"得圆锥体积 $4\\pi$"},{"key":"sum","title":"合计","score":2,"criterion":"得 $28\\pi$"}]

## CAND-G3A-081 | ch8 | application | d=3 | rjb.8.3.02 | num_shape+equiv_transform
STEM: 如图，正四面体 $ABCD$ 的棱长为 $2$。求其体积。
ANS: $\dfrac{2\sqrt2}{3}$
ANALYSIS: 正四面体体积公式 $V=\dfrac{\sqrt2}{12}a^3$。代入 $a=2$：$V=\dfrac{\sqrt2}{12}\cdot8=\dfrac{2\sqrt2}{3}$。亦可取底面正三角形面积 $\sqrt3$，高 $h=\dfrac{\sqrt6}{3}\cdot2=\dfrac{2\sqrt6}{3}$，再算 $V=\dfrac13\cdot\sqrt3\cdot\dfrac{2\sqrt6}{3}=\dfrac{2\sqrt2}{3}$（底面积为 $\sqrt3$：边长2的正三角形面积 $\dfrac{\sqrt3}{4}\cdot4=\sqrt3$）。
AUTHOR: √2/12*8=2√2/3；非PO=4棱锥
RUBRIC: [{"key":"base","title":"底或公式","score":4,"criterion":"正确用公式或求出底面积与高"},{"key":"vol","title":"体积","score":6,"criterion":"得 $\\dfrac{2\\sqrt2}{3}$"}]

## CAND-G3A-082 | ch8 | multi | d=2 | rjb.8.1.01 | classification+defn
STEM: 关于棱柱，下列说法正确的有（多选）
OPT: {"A":"两底面平行且全等","B":"侧棱都相等且互相平行","C":"侧面一定是矩形","D":"直棱柱的侧棱垂直于底面"}
ANS: A,B,D
ANALYSIS: A、B 为棱柱基本性质。D 为直棱柱定义。C：斜棱柱侧面是平行四边形，不一定是矩形。故选 A、B、D。
AUTHOR: C仅直棱柱且底边⊥侧棱截面等特殊

## CAND-G3A-083 | ch8 | single | d=1 | rjb.8.4.01 | defn
STEM: 空间中，过直线外一点
OPT: {"A":"有且只有一条直线与已知直线平行","B":"有无数条直线与已知直线平行","C":"没有直线与已知直线平行","D":"有且只有两条直线与已知直线平行"}
ANS: A
ANALYSIS: 平行公理：过直线外一点有且只有一条直线与已知直线平行。故选 A。
AUTHOR: 过线外一点唯一平行线

## CAND-G3A-084 | ch8 | judge | d=2 | rjb.8.5.01 | defn
STEM: 若平面外一条直线与平面内一条直线平行，则该直线与此平面平行。
ANS: true
ANALYSIS: 这是线面平行的判定定理：平面外一条直线平行于平面内一条直线，则该直线与平面平行。命题正确。
AUTHOR: 判定定理原文

## CAND-G3A-085 | ch8 | application | d=3 | rjb.8.6.02 | num_shape+equiv_transform
STEM: 如图，在长方体 $ABCD-A_1B_1C_1D_1$ 中，$AB=AD=2$，$AA_1=1$。求直线 $A_1B$ 与平面 $ABCD$ 所成角的正弦值。
ANS: $\dfrac{\sqrt5}{5}$
ANALYSIS: 直线 $A_1B$ 在底面 $ABCD$ 上的射影为 $AB$。设所成角为 $\theta$，则在直角三角形 $A_1AB$ 中，$\sin\theta=\dfrac{AA_1}{A_1B}$。$A_1B=\sqrt{AB^2+AA_1^2}=\sqrt{4+1}=\sqrt5$，故 $\sin\theta=\dfrac{1}{\sqrt5}=\dfrac{\sqrt5}{5}$。
AUTHOR: 异于双仰角45/60；sin=1/√5
RUBRIC: [{"key":"proj","title":"射影","score":3,"criterion":"指出射影为 $AB$（或等价说明）"},{"key":"len","title":"斜线长","score":3,"criterion":"得 $A_1B=\\sqrt5$"},{"key":"sin","title":"正弦","score":4,"criterion":"得 $\\dfrac{\\sqrt5}{5}$"}]

## CAND-G3A-086 | ch8 | application | d=3 | rjb.8.4.01 | num_shape+classification
STEM: 如图，正方体 $ABCD-A_1B_1C_1D_1$ 的棱长为 $1$，$M$、$N$ 分别是棱 $AB$、$CC_1$ 的中点。求线段 $MN$ 的长。
ANS: $\dfrac{\sqrt6}{2}$
ANALYSIS: 建系：$A(0,0,0)$，$B(1,0,0)$，$C(1,1,0)$，$C_1(1,1,1)$，则 $M\!\left(\dfrac12,0,0\right)$，$N\!\left(1,1,\dfrac12\right)$。$\overrightarrow{MN}=\left(\dfrac12,1,\dfrac12\right)$，$|MN|=\sqrt{\dfrac14+1+\dfrac14}=\sqrt{\dfrac32}=\dfrac{\sqrt6}{2}$。
AUTHOR: 异于AC与A1B题；中点MN
RUBRIC: [{"key":"coord","title":"坐标","score":3,"criterion":"正确表示 $M$、$N$ 坐标"},{"key":"len","title":"长度","score":5,"criterion":"得 $\\dfrac{\\sqrt6}{2}$"}]

## CAND-G3A-087 | ch8 | multi | d=2 | rjb.8.5.02 | classification+defn
STEM: 下列条件中，能判定平面 $\alpha\parallel$ 平面 $\beta$ 的有（多选）
OPT: {"A":"$\\alpha$ 内两条相交直线分别平行于 $\\beta$","B":"$\\alpha$ 内一条直线平行于 $\\beta$","C":"存在平面 $\\gamma$，使 $\\alpha\\parallel\\gamma$ 且 $\\beta\\parallel\\gamma$","D":"$\\alpha$ 内两条平行直线分别平行于 $\\beta$"}
ANS: A,C
ANALYSIS: A：面面平行判定定理（平面内两条相交直线分别∥另一平面）。C：平行于同一平面的两个平面平行。B：仅一条线∥面不能保证面面平行。D：两条平行线方向不独立，不能判定。故选 A、C。
AUTHOR: A判定；C传递；B,D不足

## CAND-G3A-088 | ch8 | single | d=1 | rjb.8.6.01 | defn
STEM: 判定直线 $l\perp$ 平面 $\alpha$ 的一种常用方法是：若 $l$ 垂直于 $\alpha$ 内
OPT: {"A":"一条直线","B":"两条平行直线","C":"两条相交直线","D":"无数条直线（可共线）"}
ANS: C
ANALYSIS: 线面垂直判定定理：若一条直线垂直于平面内两条相交直线，则该直线垂直于这个平面。故选 C。
AUTHOR: 须两条相交直线 [quota: d2→d1 基础题]

## CAND-G3A-089 | ch8 | multi | d=3 | rjb.8.6.02 | classification+num_shape
STEM: 在长方体 $ABCD-A_1B_1C_1D_1$ 中，$AB=2$，$AD=1$，$AA_1=1$。下列结论正确的有（多选）
OPT: {"A":"$AA_1\\perp$ 平面 $ABCD$","B":"$AB\\perp AD$","C":"$A_1C\\perp BD$","D":"平面 $ABB_1A_1\\perp$ 平面 $ABCD$"}
ANS: A,B,D
ANALYSIS: A、D：侧棱垂直底面，侧面含侧棱故⊥底面。B：底面邻边垂直。C：建系 $A(0,0,0)$，$B(2,0,0)$，$D(0,1,0)$，$A_1(0,0,1)$，$C(2,1,0)$，则 $\overrightarrow{A_1C}=(2,1,-1)$，$\overrightarrow{BD}=(-2,1,0)$，点积 $-4+1+0=-3\ne0$，不垂直。故选 A、B、D。
AUTHOR: A1C·BD=-3≠0

## CAND-G3A-090 | ch8 | numeric | d=2 | rjb.8.3.01 | num_shape
STEM: 底面半径为 $2$、高为 $5$ 的圆柱，其体积除以 $\pi$ 的结果为
ANS: 20
ANALYSIS: $V=\pi r^2 h=\pi\cdot4\cdot5=20\pi$，故 $V/\pi=20$。
AUTHOR: 4*5=20

## CAND-G3A-091 | ch9 | single | d=1 | rjb.9.1.01 | defn
STEM: 从含 $200$ 个个体的总体中用抽签法抽取 $10$ 个个体，则每个个体被抽到的概率为
OPT: {"A":"$\\dfrac{1}{200}$","B":"$\\dfrac{1}{10}$","C":"$\\dfrac{10}{200}$","D":"$\\dfrac{10}{190}$"}
ANS: C
ANALYSIS: 简单随机抽样中每个个体被抽中的概率相等，均为样本量与总体容量之比 $\dfrac{10}{200}$。故选 C。
AUTHOR: 10/200=1/20

## CAND-G3A-092 | ch9 | multi | d=2 | rjb.9.1.01 | classification+defn
STEM: 下列抽样方式中，属于简单随机抽样的有（多选）
OPT: {"A":"抽签法","B":"随机数法","C":"按学号每隔 $10$ 人抽 $1$ 人","D":"先按年级分层再在各层抽样"}
ANS: A,B
ANALYSIS: 抽签法与随机数法是简单随机抽样的常用实施方法。C 为系统抽样，D 为分层抽样。故选 A、B。
AUTHOR: C系统D分层

## CAND-G3A-093 | ch9 | application | d=3 | rjb.9.2.01 | num_shape+special_value
STEM: 某批零件抽检 $200$ 件，发现次品 $8$ 件。用频率估计次品率，并据此估计 $5000$ 件中约有多少件次品。
ANS: 次品率估计为 $0.04$；约 $200$ 件
ANALYSIS: 频率 $\dfrac{8}{200}=0.04$，用以估计次品率。则 $5000\times0.04=200$（件）。
AUTHOR: 8/200=0.04；5000*0.04=200
RUBRIC: [{"key":"rate","title":"频率","score":3,"criterion":"得 $0.04$（或 $4\\%$）"},{"key":"est","title":"估计","score":5,"criterion":"得约 $200$ 件"}]

## CAND-G3A-094 | ch9 | judge | d=1 | rjb.9.3.01 | defn
STEM: 相关系数的绝对值越接近 $1$，两个变量的线性相关程度通常越强。
ANS: true
ANALYSIS: 样本相关系数 $r$ 满足 $|r|\le1$，$|r|$ 越接近 $1$，线性相关程度越强；$|r|$ 接近 $0$ 则线性相关越弱。命题正确。
AUTHOR: |r|→1 线性强

## CAND-G3A-095 | ch10 | single | d=1 | rjb.10.1.01 | defn
STEM: 掷一枚质地均匀的骰子一次，样本空间所含基本事件的个数为
OPT: {"A":"2","B":"4","C":"6","D":"12"}
ANS: C
ANALYSIS: 结果为点数 $1$ 至 $6$，共 $6$ 个基本事件。选 C。
AUTHOR: 异于硬币2结果

## CAND-G3A-096 | ch10 | numeric | d=1 | rjb.10.1.02 | num_shape
STEM: 袋中有 $3$ 个红球、$2$ 个白球，从中随机摸出 $1$ 个球，则摸到红球的概率为（填最简分数）
ANS: 3/5
ANALYSIS: 古典概型：$P=\dfrac{3}{3+2}=\dfrac{3}{5}$。
AUTHOR: 3/5

## CAND-G3A-097 | ch10 | numeric | d=2 | rjb.10.2.01 | num_shape
STEM: 独立事件 $A,B$ 满足 $P(A)=0.4$，$P(B)=0.5$，则 $P(AB)=$
ANS: 0.2
ANALYSIS: 独立 ⇒ $P(AB)=P(A)P(B)=0.4\times0.5=0.2$。
AUTHOR: 0.4*0.5=0.2

## CAND-G3A-098 | ch10 | multi | d=2 | rjb.10.2.01 | classification+defn
STEM: 设事件 $A,B$ 相互独立，且 $0<P(A)<1$，$0<P(B)<1$。下列一定成立的有（多选）
OPT: {"A":"$P(AB)=P(A)P(B)$","B":"$A$ 与 $\\overline{B}$ 相互独立","C":"$P(A\\cup B)=P(A)+P(B)$","D":"$P(A|B)=P(A)$"}
ANS: A,B,D
ANALYSIS: A、D 为独立性等价说法。B：独立事件与对方对立事件仍独立。C：仅当互斥时成立，独立未必互斥。故选 A、B、D。
AUTHOR: C需互斥；独立≠互斥

## CAND-G3A-099 | ch10 | single | d=2 | rjb.10.3.01 | defn
STEM: 大量重复试验下，随机事件发生的频率会
OPT: {"A":"越来越远离概率","B":"稳定在概率附近","C":"始终等于概率","D":"越来越接近 $0$"}
ANS: B
ANALYSIS: 大数定律思想：试验次数很大时，频率稳定在概率附近，但不保证每一次都等于概率。故选 B。
AUTHOR: 稳定附近非恒等

## CAND-G3A-100 | ch10 | application | d=3 | rjb.10.1.02 | num_shape+classification
STEM: 从 $1,2,3,4,5$ 五个数中随机取出两个不同的数，求两数之和为偶数的概率。
ANS: $2/5$
ANALYSIS: 基本事件总数 $\mathrm{C}_5^2=10$。和为偶数当且仅当两奇或两偶：奇有 $1,3,5$ 共 $3$ 个，偶有 $2,4$ 共 $2$ 个，故 $\mathrm{C}_3^2+\mathrm{C}_2^2=3+1=4$。$P=\dfrac{4}{10}=\dfrac{2}{5}$。
AUTHOR: C(3,2)+C(2,2)=4；4/10=2/5
RUBRIC: [{"key":"tot","title":"总数","score":2,"criterion":"得 $\\mathrm{C}_5^2=10$"},{"key":"fav","title":"有利","score":4,"criterion":"得有利 $4$ 种（两奇或两偶）"},{"key":"p","title":"概率","score":2,"criterion":"得 $\\dfrac{2}{5}$"}]
