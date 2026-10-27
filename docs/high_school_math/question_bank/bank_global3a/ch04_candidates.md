# 第四章 指数函数与对数函数 · GLOBAL-3A 候选

> specialty `rja-ch4` · 题量 14 · **未入库**

## CAND-G3A-029

- 小节：4.1 指数
- KP：`rja.4.1.02` 分数指数幂
- 题型/难度：single / 1
- method：equiv_transform
- 配图：NOT_NEEDED
- 来源：original

**题干**

$16^{\frac{3}{4}}$ 等于

**选项**

- A. $2$
- B. $4$
- C. $8$
- D. $12$

**答案**

C

**解析**

$16^{\frac{3}{4}}=(2^4)^{\frac{3}{4}}=2^3=8$，选 C。

**作者自检**：(2^4)^(3/4)=2^3=8。

---

## CAND-G3A-030

- 小节：4.1 指数
- KP：`rja.4.1.03` 指数幂运算
- 题型/难度：numeric / 1
- method：equiv_transform
- 配图：NOT_NEEDED
- 来源：original

**题干**

计算 $2^3\cdot 2^{-1}=$

**答案**

4

**解析**

$2^3\cdot 2^{-1}=2^{2}=4$。

**作者自检**：2^(3-1)=4。

---

## CAND-G3A-031

- 小节：4.2 指数函数
- KP：`rja.4.2.02` 指数函数单调性
- 题型/难度：single / 2
- method：mono_analysis + special_value
- 配图：NOT_NEEDED
- 来源：original

**题干**

若 $0<a<b$，则下列正确的是

**选项**

- A. $(\dfrac{1}{2})^a>(\dfrac{1}{2})^b$
- B. $(\dfrac{1}{2})^a<(\dfrac{1}{2})^b$
- C. $2^a<2^{-b}$
- D. $a^2>b^2$ 恒成立

**答案**

A

**解析**

底 $\dfrac{1}{2}\in(0,1)$，指数函数递减，由 $a<b$ 得 $(\dfrac{1}{2})^a>(\dfrac{1}{2})^b$。选 A。

**作者自检**：(1/2)^x 递减 ⇒ a<b 时值反序。

---

## CAND-G3A-032

- 小节：4.2 指数函数
- KP：`rja.4.2.03` 指数方程
- 题型/难度：numeric / 3
- method：substitution
- 配图：NOT_NEEDED
- 来源：original

**题干**

方程 $9^x-10\cdot 3^x+9=0$ 的较大根是

**答案**

2

**解析**

令 $t=3^x>0$，则 $t^2-10t+9=0$，$(t-1)(t-9)=0$，得 $t=1$ 或 $9$。$3^x=1\Rightarrow x=0$；$3^x=9\Rightarrow x=2$。较大根为 $2$。

**作者自检**：t=1或9 ⇒ x=0或2。

---

## CAND-G3A-033

- 小节：4.3 对数
- KP：`rja.4.3.01` 对数概念
- 题型/难度：judge / 1
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

判断：$\log_2 8=3$。

**答案**

true

**解析**

因为 $2^3=8$，故 $\log_2 8=3$。命题正确。

**作者自检**：2^3=8。

---

## CAND-G3A-034

- 小节：4.3 对数
- KP：`rja.4.3.02` 对数运算法则
- 题型/难度：single / 2
- method：equiv_transform + special_value
- 配图：NOT_NEEDED
- 来源：original

**题干**

$\log_2 24-\log_2 3$ 等于

**选项**

- A. $2$
- B. $3$
- C. $4$
- D. $\log_2 21$

**答案**

B

**解析**

$\log_2 24-\log_2 3=\log_2\dfrac{24}{3}=\log_2 8=3$。选 B。A 为 $\log_2 4$；C 为 $\log_2 16$；D 误用差为真数相减。

**作者自检**：log2(8)=3；去重改底数与真数。

---

## CAND-G3A-035

- 小节：4.3 对数
- KP：`rja.4.3.03` 换底公式
- 题型/难度：numeric / 2
- method：equiv_transform
- 配图：NOT_NEEDED
- 来源：original

**题干**

$\dfrac{\log_2 9}{\log_2 3}=$

**答案**

2

**解析**

由换底公式 $\dfrac{\log_2 9}{\log_2 3}=\log_3 9=2$。

**作者自检**：log3(9)=2。

---

## CAND-G3A-036

- 小节：4.4 对数函数
- KP：`rja.4.4.02` 对数函数单调性
- 题型/难度：multi / 2
- method：mono_analysis + special_value
- 配图：NOT_NEEDED
- 来源：original

**题干**

设 $f(x)=\log_{\frac{1}{2}} x$，则下列正确的有（多选）

**选项**

- A. $f$ 在 $(0,+\infty)$ 上递减
- B. $f(4)<f(2)$
- C. $f(4)>f(2)$
- D. $f(1)=0$

**答案**

A,B,D

**解析**

底 $\in(0,1)$，$f$ 在 $(0,+\infty)$ 上递减，故 A 对；由 $4>2$ 得 $f(4)<f(2)$，B 对、C 错；$f(1)=\log_{\frac12}1=0$，D 对。故 A、B、D。

**作者自检**：递减；f(4)<f(2)；f(1)=0。

---

## CAND-G3A-037

- 小节：4.4 对数函数
- KP：`rja.4.4.03` 对数函数图象与性质
- 题型/难度：single / 2
- method：graph_symmetry
- 配图：NOT_NEEDED
- 来源：original

**题干**

函数 $y=10^x$ 与 $y=\lg x$ 的图象（在各自定义域上）的位置关系是

**选项**

- A. 关于原点对称
- B. 关于直线 $y=x$ 对称
- C. 关于 $x$ 轴对称
- D. 关于 $y$ 轴对称

**答案**

B

**解析**

互为反函数的两个函数图象关于直线 $y=x$ 对称。$y=10^x$ 与 $y=\lg x$ 互为反函数，故选 B。

**作者自检**：反函数图象关于 y=x；quota judge→single 保持d2

---

## CAND-G3A-038

- 小节：4.2 指数函数
- KP：`rja.4.2.04` 指数函数图象变换
- 题型/难度：single / 2
- method：graph_symmetry + special_value
- 配图：NOT_NEEDED
- 来源：original

**题干**

要得到 $y=2^{x-1}$ 的图象，可将 $y=2^x$ 的图象

**选项**

- A. 向右平移 $1$ 个单位
- B. 向左平移 $1$ 个单位
- C. 向上平移 $1$ 个单位
- D. 向下平移 $1$ 个单位

**答案**

A

**解析**

$y=2^{x-1}$ 由 $y=2^x$ 中 $x$ 换为 $x-1$，即向右平移 $1$ 个单位。选 A。

**作者自检**：x→x-1 为右移1。

---

## CAND-G3A-039

- 小节：4.5 函数的应用（二）
- KP：`rja.4.5.04` 复合增长模型
- 题型/难度：application / 3
- method：special_value + equiv_transform
- 配图：NOT_NEEDED
- 来源：original

**题干**

某放射性样品初始质量 $800\,\mathrm{g}$，每经过 $1\,\mathrm{h}$ 质量变为原来的 $\dfrac{1}{2}$。设 $t$ 小时后质量为 $N(t)\,\mathrm{g}$。
（1）写出 $N(t)$；
（2）经过多少整小时质量首次低于 $100\,\mathrm{g}$？

**答案**

（1）$N(t)=800\cdot\left(\dfrac{1}{2}\right)^t$；（2）$4\,\mathrm{h}$。

**解析**

（1）$N(t)=800\cdot\left(\dfrac{1}{2}\right)^t$。
（2）$800\cdot2^{-t}<100\Rightarrow 2^{-t}<\dfrac{1}{8}=2^{-3}\Rightarrow t>3$。整小时取最小 $t=4$，此时 $N(4)=50\,\mathrm{g}<100\,\mathrm{g}$。

**Rubric**（满分 10）

- model 模型 4：写出 N(t)=800·0.5^t
- half 半衰期 3：t=3 时 N=100
- read 读数 3：数量为 100

**作者自检**：800·2^{-4}=50<100；t=4。

---

## CAND-G3A-040

- 小节：4.5 函数的应用（二）
- KP：`rja.4.5.02` 对数应用
- 题型/难度：application / 2
- method：equiv_transform
- 配图：NOT_NEEDED
- 来源：original

**题干**

地震震级 $M=\lg\dfrac{E}{E_0}$（$E_0$ 为参考能量）。若某次地震释放能量 $E=10^4 E_0$，求震级 $M$。

**答案**

$M=4$。

**解析**

$M=\lg(10^4)=4$。

**Rubric**（满分 8）

- sub 代入 3：M=\lg(E/E_0)
- calc 计算 5：M=4

**作者自检**：lg(10^4)=4。

---

## CAND-G3A-041

- 小节：4.3 对数
- KP：`rja.4.3.04` 对数方程初步
- 题型/难度：numeric / 3
- method：equiv_transform + substitution
- 配图：NOT_NEEDED
- 来源：original

**题干**

方程 $\log_3 x+\log_3(x-2)=1$ 的解是

**答案**

3

**解析**

需 $x>2$。$\log_3[x(x-2)]=1\Rightarrow x(x-2)=3\Rightarrow x^2-2x-3=0\Rightarrow(x-3)(x+1)=0$，取 $x=3$。

**作者自检**：log3(x)+log3(x-2)=1 ⇒ x=3。

---

## CAND-G3A-042

- 小节：4.5 函数的应用（二）
- KP：`rja.4.5.03` 二分法思想
- 题型/难度：application / 3
- method：mono_analysis + num_shape
- 配图：NOT_NEEDED
- 来源：original

**题干**

设 $f(x)=2^x-3$。
（1）说明 $f$ 在 $\mathbb{R}$ 上单调递增；
（2）用二分法思想判断方程 $2^x=3$ 的正根位于哪个长度不超过 $0.5$ 的区间内。

**答案**

（1）$f$ 递增；（2）根位于 $(1.5,2)$。

**解析**

（1）$2^x$ 底 $>1$，在 $\mathbb{R}$ 递增，故 $f(x)=2^x-3$ 递增。
（2）$f(1)=2-3=-1<0$，$f(2)=4-3=1>0$，由零点存在定理根在 $(1,2)$。$f(1.5)=2\sqrt{2}-3\approx2.828-3<0$，故根在 $(1.5,2)$，区间长 $0.5$。

**Rubric**（满分 10）

- mono 单调性 4：说明 $f$ 在 $\mathbb{R}$ 上单调递增（或等价）
- mid 中点 3：f(1.5)<0
- root 根区间 3：根在 (1.5,2)

**作者自检**：f(1)<0,f(2)>0,f(1.5)<0 ⇒ 根∈(1.5,2)。

---
