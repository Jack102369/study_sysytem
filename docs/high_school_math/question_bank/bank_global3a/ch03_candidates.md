# 第三章 函数的概念与性质 · GLOBAL-3A 候选

> specialty `rja-ch3` · 题量 12 · **未入库**

## CAND-G3A-017

- 小节：3.1 函数的概念及其表示
- KP：`rja.3.1.02` 定义域
- 题型/难度：single / 1
- method：domain_symmetry
- 配图：NOT_NEEDED
- 来源：original

**题干**

函数 $f(x)=\dfrac{1}{x-3}+\sqrt{x+1}$ 的定义域是

**选项**

- A. $[-1,+\infty)$
- B. $(-1,+\infty)\setminus\{3\}$
- C. $[-1,+\infty)\setminus\{3\}$
- D. $(3,+\infty)$

**答案**

C

**解析**

需 $x+1\ge 0$ 且 $x\ne 3$，即 $x\ge -1$ 且 $x\ne 3$，选 C。

**作者自检**：x≥-1 且 x≠3。

---

## CAND-G3A-018

- 小节：3.1 函数的概念及其表示
- KP：`rja.3.1.09` 分段函数
- 题型/难度：numeric / 1
- method：special_value
- 配图：NOT_NEEDED
- 来源：original

**题干**

设 $f(x)=\begin{cases} x+2,&x<0\\ x^2,&x\ge 0\end{cases}$，则 $f(-3)+f(2)=$

**答案**

3

**解析**

$f(-3)=-1$，$f(2)=4$，故和为 $3$。

**作者自检**：-1+4=3。

---

## CAND-G3A-019

- 小节：3.1 函数的概念及其表示
- KP：`rja.3.1.05` 相同函数的判断
- 题型/难度：multi / 2
- method：classification + defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

下列说法正确的有（多选）

**选项**

- A. $y=x$ 与 $y=\sqrt[3]{x^3}$ 是同一函数
- B. $y=x$ 与 $y=\dfrac{x^2}{x}$ 是同一函数
- C. $y=\sqrt{x^2}$ 与 $y=|x|$ 是同一函数
- D. $y=|x|$ 与 $y=x$ 是同一函数

**答案**

A,C

**解析**

A：对应法则与定义域皆为 $\mathbb{R}$ 上的恒等，相同。B：后者定义域不含 $0$，不同。C：二者均为 $|x|$，定义域 $\mathbb{R}$，相同。D：奇偶与取值不同，不同。故 A、C。

**作者自检**：A、C 同；B 缺0；D 非同。

---

## CAND-G3A-020

- 小节：3.2 函数的基本性质
- KP：`rja.3.2.01` 单调递增
- 题型/难度：judge / 1
- method：mono_analysis
- 配图：NOT_NEEDED
- 来源：original

**题干**

判断：函数 $f(x)=2x-5$ 在 $\mathbb{R}$ 上是增函数。

**答案**

true

**解析**

对任意 $x_1<x_2$，有 $f(x_1)-f(x_2)=2(x_1-x_2)<0$，即 $f(x_1)<f(x_2)$，故为增函数。

**作者自检**：斜率2>0，全局增。

---

## CAND-G3A-021

- 小节：3.2 函数的基本性质
- KP：`rja.3.2.03` 单调区间
- 题型/难度：single / 1
- method：mono_analysis + equiv_transform
- 配图：NOT_NEEDED
- 来源：original

**题干**

函数 $f(x)=-x^2+2x$ 的单调递减区间是

**选项**

- A. $(-\infty,1]$
- B. $[1,+\infty)$
- C. $(-\infty,0]$
- D. $[0,+\infty)$

**答案**

B

**解析**

开口向下，对称轴 $x=1$，故在 $[1,+\infty)$ 上递减。选 B。

**作者自检**：对称轴 x=1；右侧递减。 [quota: d2→d1 基础题]

---

## CAND-G3A-022

- 小节：3.2 函数的基本性质
- KP：`rja.3.2.10` 奇函数与偶函数的判断
- 题型/难度：single / 2
- method：parity_apply + domain_symmetry
- 配图：NOT_NEEDED
- 来源：original

**题干**

函数 $f(x)=x^3-x$ 是

**选项**

- A. 奇函数
- B. 偶函数
- C. 既奇又偶
- D. 非奇非偶

**答案**

A

**解析**

定义域关于原点对称，$f(-x)=-x^3+x=-(x^3-x)=-f(x)$，故为奇函数。选 A。

**作者自检**：f(-x)=-f(x)。

---

## CAND-G3A-023

- 小节：3.2 函数的基本性质
- KP：`rja.3.2.12` 奇偶性求值与综合应用
- 题型/难度：numeric / 2
- method：parity_apply
- 配图：NOT_NEEDED
- 来源：original

**题干**

已知 $f(x)$ 是定义在 $\mathbb{R}$ 上的奇函数，且 $f(3)=5$，则 $f(-3)+f(0)=$

**答案**

-5

**解析**

奇函数有 $f(0)=0$，$f(-3)=-f(3)=-5$，故 $f(-3)+f(0)=-5$。

**作者自检**：f(0)=0；f(-3)=-5。

---

## CAND-G3A-024

- 小节：3.3 幂函数
- KP：`rja.3.3.04` 幂函数单调性
- 题型/难度：single / 2
- method：mono_analysis + graph_symmetry
- 配图：RECOMMENDED
- 来源：original

**题干**

在区间 $(0,+\infty)$ 上为减函数的幂函数是

**选项**

- A. $y=x^{\frac{1}{2}}$
- B. $y=x^2$
- C. $y=x^{-1}$
- D. $y=x^{3}$

**答案**

C

**解析**

$y=x^{-1}=\dfrac{1}{x}$ 在 $(0,+\infty)$ 上递减；其余在该区间均递增。选 C。

**作者自检**：α=-1<0，正半轴递减。

---

## CAND-G3A-025

- 小节：3.3 幂函数
- KP：`rja.3.3.05` 幂函数奇偶性
- 题型/难度：multi / 2
- method：parity_apply
- 配图：NOT_NEEDED
- 来源：original

**题干**

下列幂函数中是奇函数的有（多选）

**选项**

- A. $y=x$
- B. $y=x^3$
- C. $y=x^2$
- D. $y=x^{-1}$

**答案**

A,B,D

**解析**

$y=x$、$y=x^3$、$y=x^{-1}$ 均为奇函数；$y=x^2$ 为偶函数。故 A、B、D。

**作者自检**：偶指数偶函数；奇指数（含-1）奇函数。

---

## CAND-G3A-026

- 小节：3.2 函数的基本性质
- KP：`rja.3.2.12` 奇偶性求值与综合应用
- 题型/难度：application / 3
- method：parity_apply + special_value
- 配图：NOT_NEEDED
- 来源：original

**题干**

已知函数 $f(x)$ 对定义域内任意 $x$ 满足 $f(x)+f(-x)=0$，且当 $x>0$ 时 $f(x)=x+\dfrac{1}{x}$。
（1）说明 $f$ 的奇偶性；
（2）求 $f(-2)$。

**答案**

（1）$f$ 为奇函数；（2）$f(-2)=-\dfrac{5}{2}$。

**解析**

（1）$f(x)+f(-x)=0\Rightarrow f(-x)=-f(x)$，为奇函数。
（2）$f(2)=2+\dfrac{1}{2}=\dfrac{5}{2}$，故 $f(-2)=-f(2)=-\dfrac{5}{2}$。

**Rubric**（满分 10）

- domain 定义域 2：写出定义域条件
- odd 奇性 3：证 f(-x)=-f(x)
- val 求值 5：得 f(-2)=-3

**作者自检**：f(2)=5/2；f(-2)=-5/2。

---

## CAND-G3A-027

- 小节：3.4 函数的应用（一）
- KP：`rja.3.4.04` 用函数解决最值实际问题
- 题型/难度：application / 3
- method：num_shape + mono_analysis
- 配图：NOT_NEEDED
- 来源：original

**题干**

某商品进价 $10$ 元/件，当售价为 $x$ 元（$10<x<40$）时，日销售量为 $(40-x)$ 件。求使日利润最大的售价及最大日利润。

**答案**

售价 $25$ 元时，最大日利润为 $225$ 元。

**解析**

日利润 $P(x)=(x-10)(40-x)=-x^2+50x-400=-(x-25)^2+225$。当 $x=25$ 时最大利润为 $225$ 元。

**Rubric**（满分 8）

- expr 利润函数 3：写出 P(x)= (40-x)(x-10) 或等价
- max 最大利润 3：得最大利润 225
- price 定价 2：单价 25 元

**作者自检**：顶点 x=25，P=225。

---

## CAND-G3A-028

- 小节：3.2 函数的基本性质
- KP：`rja.3.2.08` 单调性与最值
- 题型/难度：application / 3
- method：mono_analysis + substitution
- 配图：NOT_NEEDED
- 来源：original

**题干**

设 $f(x)=x+\dfrac{1}{x}$，$x\in[1,4]$。
（1）判断 $f$ 在 $[1,4]$ 上的单调性；
（2）求 $f$ 在该区间上的最大值与最小值。

**答案**

（1）在 $[1,4]$ 上单调递增；（2）最小值为 $2$，最大值为 $\dfrac{17}{4}$。

**解析**

对 $1\le x_1<x_2\le 4$，$f(x_1)-f(x_2)=(x_1-x_2)\big(1-\dfrac{1}{x_1x_2}\big)$。因 $x_1x_2\ge 1$，括号非负且 $x_1-x_2<0$，故 $f(x_1)<f(x_2)$，递增。从而最小值 $f(1)=2$，最大值 $f(4)=\dfrac{17}{4}$。

**Rubric**（满分 12）

- mono 单调性 4：证在 [1,4] 上递增
- minmax 最值 4：min=2，max=17/4
- range 值域 4：值域 [2,17/4]

**作者自检**：递增；min=2；max=17/4。

---
