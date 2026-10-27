# 第三章 函数的概念与性质 · GLOBAL-2A 候选

> specialty `rja-ch3` · 题量 12 · **未入库**

## CAND-G2A-017

- 小节：3.1 函数的概念及其表示
- KP：`rja.3.1.02` 定义域
- 题型/难度：single / 1
- method：classification
- 配图：NOT_NEEDED
- 来源：original

**题干**

函数 $f(x)=\dfrac{\sqrt{x-1}}{x-3}$ 的定义域是

**选项**

- A. $[1,+\infty)$
- B. $[1,3)\cup(3,+\infty)$
- C. $(1,3)\cup(3,+\infty)$
- D. $[1,3]$

**答案**

B

**解析**

需 $x-1\ge0$ 且 $x-3\ne0$，即 $x\ge1$ 且 $x\ne3$，故定义域 $[1,3)\cup(3,+\infty)$，选 B。

**作者自检**：x≥1且x≠3。

---

## CAND-G2A-018

- 小节：3.1 函数的概念及其表示
- KP：`rja.3.1.10` 函数求值
- 题型/难度：numeric / 1
- method：substitution
- 配图：NOT_NEEDED
- 来源：original

**题干**

设 $f(x)=2x-5$，则 $f(f(3))=$

**答案**

-3

**解析**

$f(3)=6-5=1$，$f(f(3))=f(1)=2-5=-3$。

**作者自检**：f(3)=1，f(1)=-3。

---

## CAND-G2A-019

- 小节：3.1 函数的概念及其表示
- KP：`rja.3.1.05` 相同函数的判断
- 题型/难度：judge / 1
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

判断：函数 $f(x)=x$ 与 $g(x)=\dfrac{x^2}{x}$ 是同一个函数。

**答案**

false

**解析**

$g(x)=\dfrac{x^2}{x}$ 要求 $x\ne0$，定义域为 $\{x\mid x\ne0\}$，而 $f(x)=x$ 定义域为 $\mathbb{R}$。定义域不同，不是同一函数。

**作者自检**：g 缺 x=0；三要素定义域不同则不同。

---

## CAND-G2A-020

- 小节：3.2 函数的基本性质
- KP：`rja.3.2.04` 单调性判断
- 题型/难度：multi / 2
- method：mono_analysis
- 配图：NOT_NEEDED
- 来源：original

**题干**

下列函数在 $(0,+\infty)$ 上单调递增的有（多选）

**选项**

- A. $y=x^2$
- B. $y=\sqrt{x}$
- C. $y=\dfrac{1}{x}$
- D. $y=2x+1$

**答案**

A,B,D

**解析**

在 $(0,+\infty)$：$x^2$ 导数 $2x>0$ 或作差可证递增；$\sqrt{x}$ 递增；$\dfrac{1}{x}$ 递减；$2x+1$ 递增。故 A、B、D。

**作者自检**：1/x 递减排除；其余递增。

---

## CAND-G2A-021

- 小节：3.2 函数的基本性质
- KP：`rja.3.2.01` 单调递增
- 题型/难度：single / 2
- method：mono_analysis
- 配图：NOT_NEEDED
- 来源：original

**题干**

已知 $f(x)=x^3$ 在 $\mathbb{R}$ 上单调递增。若 $f(a)>f(2)$，则

**选项**

- A. $a>2$
- B. $a<2$
- C. $a>8$
- D. $a=2$

**答案**

A

**解析**

严格增函数保持不等号方向：$f(a)>f(2)\Leftrightarrow a>2$，选 A。

**作者自检**：x^3 严格增 ⇒ a>2。

---

## CAND-G2A-022

- 小节：3.2 函数的基本性质
- KP：`rja.3.2.06` 最大值
- 题型/难度：numeric / 2
- method：mono_analysis + special_value
- 配图：NOT_NEEDED
- 来源：original

**题干**

函数 $f(x)=-x^2+2x+3$ 的最大值为

**答案**

4

**解析**

$f(x)=-(x-1)^2+4$，开口向下，最大值 $4$（在 $x=1$ 处）。

**作者自检**：顶点值4。

---

## CAND-G2A-023

- 小节：3.1 函数的概念及其表示
- KP：`rja.3.1.09` 分段函数
- 题型/难度：application / 2
- method：classification
- 配图：NOT_NEEDED
- 来源：original

**题干**

设 $f(x)=\begin{cases} 2x+1, & x<1,\\ x^2-2, & x\ge1. \end{cases}$
（1）求 $f(0)+f(3)$；
（2）若 $f(t)=7$，求 $t$。

**答案**

（1）$8$；（2）$t=3$。

**解析**

（1）$f(0)=1$，$f(3)=9-2=7$，和为 $8$。（2）若 $t<1$，则 $2t+1=7\Rightarrow t=3$，与 $t<1$ 矛盾；若 $t\ge1$，则 $t^2-2=7\Rightarrow t^2=9\Rightarrow t=3$（$t=-3$ 舍）。故 $t=3$。

**Rubric**（满分 8）

- v 求值 3：$f(0)+f(3)=8$
- case 分类 2：按 $t<1$ 与 $t\ge1$ 讨论
- t 求 t 3：$t=3$

**作者自检**：f(0)=1,f(3)=7；仅 t=3 满足。

---

## CAND-G2A-024

- 小节：3.2 函数的基本性质
- KP：`rja.3.2.10` 奇函数与偶函数的判断
- 题型/难度：single / 2
- method：parity_apply + domain_symmetry
- 配图：NOT_NEEDED
- 来源：original

**题干**

函数 $f(x)=x^3\cos x$ 是

**选项**

- A. 奇函数
- B. 偶函数
- C. 既奇又偶
- D. 非奇非偶

**答案**

A

**解析**

定义域 $\mathbb{R}$ 关于原点对称。$f(-x)=(-x)^3\cos(-x)=-x^3\cos x=-f(x)$，故为奇函数，选 A。

**作者自检**：奇×偶=奇；非 f(-2) 求值题。

---

## CAND-G2A-025

- 小节：3.2 函数的基本性质
- KP：`rja.3.2.09` 奇偶性定义与定义域对称
- 题型/难度：multi / 3
- method：domain_symmetry + parity_apply
- 配图：NOT_NEEDED
- 来源：original

**题干**

下列函数在所给定义域上是奇函数的有（多选）

**选项**

- A. $f(x)=x+\dfrac{1}{x}$（定义域 $\{x\mid x\ne0\}$）
- B. $f(x)=\sqrt{x}$，定义域 $[0,+\infty)$
- C. $f(x)=x|x|$，定义域 $\mathbb{R}$
- D. $f(x)=\ln\dfrac{1-x}{1+x}$（定义域 $(-1,1)$）

**答案**

A,C,D

**解析**

奇函数要求定义域关于原点对称，且 $f(-x)=-f(x)$。B 的定义域 $[0,+\infty)$ 不关于原点对称，故不是奇函数。A：$f(-x)=-x-\dfrac{1}{x}=-f(x)$，是奇函数。C：$f(-x)=(-x)|-x|=-x|x|=-f(x)$，是奇函数。D：定义域 $(-1,1)$ 对称，且 $f(-x)=\ln\dfrac{1+x}{1-x}=-\ln\dfrac{1-x}{1+x}=-f(x)$，是奇函数。故选 A、C、D。

**作者自检**：先判定义域对称：仅 B 不对称；再验证 A/C/D 的 $f(-x)=-f(x)$。答案仍为 A,C,D。

---

## CAND-G2A-026

- 小节：3.3 幂函数
- KP：`rja.3.3.01` 幂函数概念
- 题型/难度：single / 1
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

下列函数中是幂函数的是

**选项**

- A. $y=2x^{1/2}$
- B. $y=x^2+1$
- C. $y=x^{-1}$
- D. $y=(x+1)^2$

**答案**

C

**解析**

幂函数形如 $y=x^{\alpha}$（系数为 $1$）。A 多了系数 $2$；B、D 不是纯幂形式。C：$y=x^{-1}$ 是幂函数，选 C。

**作者自检**：仅 x^α 且系数1；选 x^{-1}。

---

## CAND-G2A-027

- 小节：3.4 函数的应用（一）
- KP：`rja.3.4.04` 用函数解决最值实际问题
- 题型/难度：application / 3
- method：classification
- 配图：NOT_NEEDED
- 来源：original

**题干**

某商店促销：购买 $x$ 件商品（$x\in\mathbb{N}^*$）时，单价（元/件）为
$p(x)=\begin{cases} 50, & 1\le x\le 10,\\ 45, & x\ge 11. \end{cases}$
总费用 $T(x)=x\,p(x)$。
（1）求 $T(8)$ 与 $T(12)$；
（2）若预算不超过 $500$ 元，最多可买多少件？

**答案**

（1）$T(8)=400$，$T(12)=540$；（2）最多 $11$ 件。

**解析**

（1）$8\le10$，故 $T(8)=8\times50=400$；$12\ge11$，故 $T(12)=12\times45=540$。（2）当 $1\le x\le10$ 时，$50x\le500\Rightarrow x\le10$，该段最多 $10$ 件；当 $x\ge11$ 时，$45x\le500\Rightarrow x\le\dfrac{500}{45}=11\dfrac{1}{9}$，正整数取 $x\le11$，且 $T(11)=495\le500$，$T(12)=540>500$。综合两段，最多可买 $11$ 件。

**Rubric**（满分 10）

- vals 分段求值 3：$T(8)=400$，$T(12)=540$
- ineq 分段约束 4：分别讨论 $1\le x\le10$ 与 $x>10$ 得可行上界
- max 最多件数 3：最多 $11$ 件

**作者自检**：T(8)=400,T(12)=540；x≤10段最多10；x≥11段45x≤500⇒x≤11；取11。非周长矩形面积题。

---

## CAND-G2A-028

- 小节：3.3 幂函数
- KP：`rja.3.3.04` 幂函数单调性
- 题型/难度：numeric / 2
- method：mono_analysis
- 配图：NOT_NEEDED
- 来源：original

**题干**

已知幂函数 $y=x^{1/3}$ 在 $\mathbb{R}$ 上单调递增。比较 $a=(-8)^{1/3}$ 与 $b=(-1)^{1/3}$：若 $a>b$ 填 $1$，$a=b$ 填 $0$，$a<b$ 填 $-1$，则应填

**答案**

-1

**解析**

因 $y=x^{1/3}$ 在 $\mathbb{R}$ 递增，且 $-8<-1$，故 $(-8)^{1/3}<(-1)^{1/3}$，即 $a<b$，填 $-1$。直接计算：$a=-2$，$b=-1$，确实 $-2<-1$。

**作者自检**：立方根增：-8<-1 ⇒ a=-2<b=-1 ⇒ 填-1。

---
