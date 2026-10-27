# 第二章 一元二次函数、方程和不等式 · GLOBAL-3A 候选

> specialty `rja-ch2` · 题量 10 · **未入库**

## CAND-G3A-007

- 小节：2.1 等式性质与不等式性质
- KP：`rja.2.1.02` 作差比较大小
- 题型/难度：single / 1
- method：equiv_transform
- 配图：NOT_NEEDED
- 来源：original

**题干**

已知 $a=3.2$，$b=\dfrac{16}{5}$，则

**选项**

- A. $a>b$
- B. $a<b$
- C. $a=b$
- D. 不能确定

**答案**

C

**解析**

$\dfrac{16}{5}=3.2$，故 $a=b$，选 C。

**作者自检**：16/5=3.2。

---

## CAND-G3A-008

- 小节：2.1 等式性质与不等式性质
- KP：`rja.2.1.01` 不等式的基本性质
- 题型/难度：judge / 1
- method：classification
- 配图：NOT_NEEDED
- 来源：original

**题干**

判断：若 $a>b$，则 $a^2>b^2$。

**答案**

false

**解析**

反例：$a=1$，$b=-2$，有 $a>b$ 但 $a^2=1<4=b^2$。命题错误。

**作者自检**：未限定同号非负则不成立。

---

## CAND-G3A-009

- 小节：2.2 基本不等式
- KP：`rja.2.2.01` 算术-几何平均不等式
- 题型/难度：numeric / 2
- method：num_shape
- 配图：NOT_NEEDED
- 来源：original

**题干**

若正实数 $x,y$ 满足 $xy=9$，则 $x+y$ 的最小值是

**答案**

6

**解析**

$x+y\ge 2\sqrt{xy}=2\sqrt{9}=6$，当且仅当 $x=y=3$ 时取等，故最小值为 $6$。

**作者自检**：2√9=6，等号 x=y=3。

---

## CAND-G3A-010

- 小节：2.2 基本不等式
- KP：`rja.2.2.02` 配凑法求最值
- 题型/难度：single / 1
- method：num_shape + special_value
- 配图：NOT_NEEDED
- 来源：original

**题干**

正实数 $x$ 使 $x+\dfrac{4}{x}$ 取最小值时，$x=$

**选项**

- A. $1$
- B. $2$
- C. $4$
- D. $\dfrac{1}{2}$

**答案**

B

**解析**

$x+\dfrac{4}{x}\ge 2\sqrt{4}=4$，等号当 $x=\dfrac{4}{x}$ 即 $x=2$（正）时成立。选 B。

**作者自检**：等号 x=4/x ⇒ x=2。 [quota: d2→d1 基础题]

---

## CAND-G3A-011

- 小节：2.3 二次函数与一元二次方程、不等式
- KP：`rja.2.3.02` 一元二次不等式解法
- 题型/难度：multi / 2
- method：classification
- 配图：NOT_NEEDED
- 来源：original

**题干**

关于不等式 $x^2-x-6\ge 0$ 的解集，正确的有（多选）

**选项**

- A. 解集为 $(-\infty,-2]\cup[3,+\infty)$
- B. $-2$ 是解
- C. $0$ 是解
- D. $3$ 是解

**答案**

A,B,D

**解析**

$(x-3)(x+2)\ge 0$，解集 $(-\infty,-2]\cup[3,+\infty)$。$-2,3$ 为解；$x=0$ 使左边为 $-6<0$，不是解。故 A、B、D。

**作者自检**：根 -2,3；含端点；0 不在解集。

---

## CAND-G3A-012

- 小节：2.3 二次函数与一元二次方程、不等式
- KP：`rja.2.3.01` 三个二次的关系
- 题型/难度：numeric / 1
- method：equiv_transform
- 配图：NOT_NEEDED
- 来源：original

**题干**

若方程 $x^2-6x+k=0$ 有实根，则 $k$ 的最大值是

**答案**

9

**解析**

$\Delta=36-4k\ge 0\Rightarrow k\le 9$，故 $k$ 最大值为 $9$。

**作者自检**：Δ≥0 ⇒ k≤9。

---

## CAND-G3A-013

- 小节：2.3 二次函数与一元二次方程、不等式
- KP：`rja.2.3.03` 含参二次不等式
- 题型/难度：application / 3
- method：equiv_transform + mono_analysis
- 配图：NOT_NEEDED
- 来源：original

**题干**

设关于 $x$ 的方程 $x^2-mx+4=0$ 有两个实数根。
（1）求实数 $m$ 的取值范围；
（2）当 $m=5$ 时，求两根之和与两根之积。

**答案**

（1）$m\le -4$ 或 $m\ge 4$；（2）两根之和为 $5$，两根之积为 $4$。

**解析**

（1）$\Delta=m^2-16\ge 0\Rightarrow m\le -4$ 或 $m\ge 4$。（2）由韦达定理，和为 $5$，积为 $4$。

**Rubric**（满分 10）

- delta 判别式 3：写出 Δ=m²-16≥0
- range 参数范围 4：m≤-4 或 m≥4
- vieta 韦达 3：和为5、积为4

**作者自检**：Δ=m²-16≥0；m=5 时和5积4。

---

## CAND-G3A-014

- 小节：2.2 基本不等式
- KP：`rja.2.2.04` 基本不等式应用注意
- 题型/难度：application / 2
- method：num_shape + mono_analysis
- 配图：NOT_NEEDED
- 来源：original

**题干**

用长为 $18\,\mathrm{m}$ 的篱笆围矩形花坛（四边均用篱笆）。设垂直于墙方向不考虑，矩形一边长为 $x\,\mathrm{m}$（$0<x<9$），求面积的最大值。

**答案**

面积最大值为 $\dfrac{81}{2}\,\mathrm{m}^2$（当 $x=\dfrac{9}{2}$ 时）。

**解析**

另一边长为 $18-2x$。$S(x)=x(18-2x)=18x-2x^2=-2\left(x-\dfrac{9}{2}\right)^2+\dfrac{81}{2}$。顶点 $x=\dfrac{9}{2}\in(0,9)$，最大面积 $S_{\max}=\dfrac{81}{2}$？ 更正：$-2(x-9/2)^2+81/2，当 x=9/2 时 S=81/2。 再算：18·(9/2)-2·(81/4)=81-81/2=81/2。答案应为 81/2 m²。

**Rubric**（满分 8）

- model 建模 3：写出 S=x(18-2x)
- opt 最值 3：最大面积 81/2
- side 边长 2：x=9/2 时取得

**作者自检**：S(9/2)=81/2。

---

## CAND-G3A-015

- 小节：2.3 二次函数与一元二次方程、不等式
- KP：`rja.2.3.04` 二次函数区间最值
- 题型/难度：single / 2
- method：mono_analysis
- 配图：NOT_NEEDED
- 来源：original

**题干**

函数 $f(x)=-x^2+4x+1$ 在区间 $[0,5]$ 上的最大值是

**选项**

- A. $1$
- B. $5$
- C. $6$
- D. $-4$

**答案**

B

**解析**

开口向下，对称轴 $x=2\in[0,5]$，最大值 $f(2)=-4+8+1=5$，选 B。

**作者自检**：顶点 x=2，f(2)=5，选 B。

---

## CAND-G3A-016

- 小节：2.3 二次函数与一元二次方程、不等式
- KP：`rja.2.3.05` 根的分布
- 题型/难度：application / 3
- method：equiv_transform + classification
- 配图：NOT_NEEDED
- 来源：original

**题干**

已知方程 $x^2-(k+1)x+k=0$ 有两个不相等的正实根，求实数 $k$ 的取值范围。

**答案**

$k>0$ 且 $k\ne 1$。

**解析**

需 $\Delta>0$，和 $>0$，积 $>0$。$\Delta=(k-1)^2$，故 $k\ne 1$；积 $k>0$；和 $k+1>0\Rightarrow k>-1$。综合得 $k>0$ 且 $k\ne 1$。

**Rubric**（满分 10）

- cond 根分布条件 4：写出 Δ>0、和>0、积>0
- solve 解不等式组 4：得 k>0 且 k≠1
- verify 检验 2：说明 k=1 为等根排除

**作者自检**：Δ=(k-1)²；k>0且k≠1。

---
