# 第四章 指数函数与对数函数 · GLOBAL-2A 候选

> specialty `rja-ch4` · 题量 14 · **未入库**

## CAND-G2A-029

- 小节：4.1 指数
- KP：`rja.4.1.01` n次方根
- 题型/难度：single / 1
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

$\sqrt[3]{-8}$ 的值是

**选项**

- A. $-2$
- B. $2$
- C. $\pm2$
- D. 无意义

**答案**

A

**解析**

立方根在实数中唯一：$(-2)^3=-8$，故 $\sqrt[3]{-8}=-2$，选 A。

**作者自检**：奇次根可负；得-2。

---

## CAND-G2A-030

- 小节：4.1 指数
- KP：`rja.4.1.02` 分数指数幂
- 题型/难度：numeric / 1
- method：equiv_transform
- 配图：NOT_NEEDED
- 来源：original

**题干**

$16^{3/4}=$

**答案**

8

**解析**

$16^{3/4}=(16^{1/4})^3=2^3=8$，或 $(16^3)^{1/4}$。亦可 $16^{3/4}=(2^4)^{3/4}=2^3=8$。

**作者自检**：16=2^4 ⇒ 2^3=8。

---

## CAND-G2A-031

- 小节：4.1 指数
- KP：`rja.4.1.03` 指数幂运算
- 题型/难度：multi / 2
- method：equiv_transform
- 配图：NOT_NEEDED
- 来源：original

**题干**

下列指数运算正确的有（多选；涉及除法时默认底数 $a\ne0$）

**选项**

- A. $a^3\cdot a^2=a^5$
- B. $(a^2)^3=a^6$
- C. $\dfrac{a^5}{a^2}=a^3$
- D. $(ab)^2=a^2+b^2$

**答案**

A,B,C

**解析**

A：同底数幂相乘，指数相加，正确。B：幂的乘方，指数相乘，正确。C：同底数幂相除，指数相减（题干已声明 $a\ne0$），正确。D：$(ab)^2=a^2b^2$，不是 $a^2+b^2$，错误。故 A、B、C。

**作者自检**：A 去掉多余的 $a\ne0$ 标注；除法条件收到题干统一说明。答案仍 A,B,C。

---

## CAND-G2A-032

- 小节：4.2 指数函数
- KP：`rja.4.2.01` 指数函数概念
- 题型/难度：judge / 1
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

判断：$y=2^x$ 的定义域是 $\mathbb{R}$，值域是 $(0,+\infty)$。

**答案**

true

**解析**

指数函数 $y=a^x$（$a>0,a\ne1$）定义域为实数集，值域为正实数集。$a=2$ 符合，命题正确。

**作者自检**：标准性质成立。

---

## CAND-G2A-033

- 小节：4.2 指数函数
- KP：`rja.4.2.02` 指数函数单调性
- 题型/难度：single / 2
- method：mono_analysis
- 配图：NOT_NEEDED
- 来源：original

**题干**

若 $0.5^{m}>0.5^{n}$，则

**选项**

- A. $m>n$
- B. $m<n$
- C. $m=n$
- D. $m,n$ 符号相反

**答案**

B

**解析**

底数 $0.5\in(0,1)$，指数函数递减，故 $0.5^{m}>0.5^{n}\Leftrightarrow m<n$，选 B。

**作者自检**：0<a<1 递减 ⇒ 不等号反向。

---

## CAND-G2A-034

- 小节：4.3 对数
- KP：`rja.4.3.03` 换底公式
- 题型/难度：numeric / 3
- method：equiv_transform + defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

已知 $\log_4(x-1)+\log_2(x-1)=3$，且 $x>1$。求 $x$ 的值。

**答案**

5

**解析**

令 $t=\log_2(x-1)$（因 $x>1$，有 $x-1>0$，对数有意义）。由换底公式 $\log_4(x-1)=\dfrac{\log_2(x-1)}{\log_2 4}=\dfrac{t}{2}$。原方程化为 $\dfrac{t}{2}+t=3$，即 $\dfrac{3t}{2}=3$，故 $t=2$。于是 $\log_2(x-1)=2$，得 $x-1=2^2=4$，所以 $x=5$。检验：代入后 $\log_4 4+\log_2 4=1+2=3$，成立。

**作者自检**：换底得 (1/2)t+t=3⇒t=2⇒x-1=4⇒x=5；两步关联（换底+解指数），非单次求值。

---

## CAND-G2A-035

- 小节：4.3 对数
- KP：`rja.4.3.02` 对数运算法则
- 题型/难度：single / 2
- method：equiv_transform
- 配图：NOT_NEEDED
- 来源：original

**题干**

$\log_3 18-\log_3 2$ 等于

**选项**

- A. $\log_3 16$
- B. $\log_3 36$
- C. $2$
- D. $\log_3 20$

**答案**

C

**解析**

$\log_3 18-\log_3 2=\log_3\dfrac{18}{2}=\log_3 9=2$，选 C。A、B、D 均不等于 $2$。

**作者自检**：log3(18/2)=log39=2；需保证选项唯一。

---

## CAND-G2A-036

- 小节：4.3 对数
- KP：`rja.4.3.03` 换底公式
- 题型/难度：multi / 2
- method：equiv_transform
- 配图：NOT_NEEDED
- 来源：original

**题干**

下列等式正确的有（多选）

**选项**

- A. $\log_2 5=\dfrac{\ln5}{\ln2}$
- B. $\log_2 5=\dfrac{\lg5}{\lg2}$
- C. $\log_2 5=\dfrac{1}{\log_5 2}$
- D. $\log_2 5=\log_5 2$

**答案**

A,B,C

**解析**

换底公式与倒数为倒数：$\log_b a=\dfrac{\log_k a}{\log_k b}=\dfrac{1}{\log_a b}$。A、B、C 对；D 把倒数量相等，错。

**作者自检**：排除 log25=log52。

---

## CAND-G2A-037

- 小节：4.4 对数函数
- KP：`rja.4.4.01` 对数函数概念
- 题型/难度：single / 1
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

函数 $y=\log_{1/2}x$ 的定义域是

**选项**

- A. $\mathbb{R}$
- B. $(0,+\infty)$
- C. $[0,+\infty)$
- D. $(1,+\infty)$

**答案**

B

**解析**

对数真数须大于 $0$，与底无关（底已合法），故定义域 $(0,+\infty)$，选 B。

**作者自检**：真数>0。

---

## CAND-G2A-038

- 小节：4.4 对数函数
- KP：`rja.4.4.02` 对数函数单调性
- 题型/难度：numeric / 2
- method：mono_analysis
- 配图：NOT_NEEDED
- 来源：original

**题干**

若 $\log_{1/3}m>\log_{1/3}n$，且 $m,n>0$，比较 $m$ 与 $n$：若 $m>n$ 填 $1$，$m=n$ 填 $0$，$m<n$ 填 $-1$，则应填

**答案**

-1

**解析**

底 $\dfrac{1}{3}\in(0,1)$，对数函数递减，故 $\log_{1/3}m>\log_{1/3}n\Leftrightarrow m<n$，填 $-1$。

**作者自检**：递减 ⇒ m<n ⇒ -1。

---

## CAND-G2A-039

- 小节：4.5 函数的应用（二）
- KP：`rja.4.5.01` 指数增长模型
- 题型/难度：application / 3
- method：special_value + equiv_transform
- 配图：NOT_NEEDED
- 来源：original

**题干**

某菌群初始数量 $N_0=100$，每小时变为原来的 $1.5$ 倍。设 $t$ 小时后数量为 $N(t)$。
（1）写出 $N(t)$；
（2）求使 $N(t)=100\times 1.5^{4}$ 的 $t$。

**答案**

（1）$N(t)=100\cdot1.5^{t}$；（2）$4$ 小时。

**解析**

（1）指数增长：$N(t)=N_0\cdot 1.5^{t}=100\cdot 1.5^{t}$。
（2）由 $100\cdot 1.5^{t}=100\cdot 1.5^{4}$，两边同除以 $100$ 得 $1.5^{t}=1.5^{4}$。指数函数 $y=1.5^{t}$ 在 $\mathbb{R}$ 上单调，故 $t=4$。亦可用换底：$t=\log_{1.5}(1.5^{4})=4$。

**Rubric**（满分 8）

- model 写出增长模型 3：得 $N(t)=100\cdot 1.5^{t}$（或等价写法）
- eq 建立方程 3：由 $N(t)=100\cdot 1.5^{4}$ 得到 $1.5^{t}=1.5^{4}$（或等价方程）
- solve 求解 t 2：利用单调性/换底得出 $t=4$（须有推理，不得仅写“读指数”）

**作者自检**：rubric 3+3+2=8；第(2)问要求列式+单调性/换底，不奖照抄题干指数。

---

## CAND-G2A-040

- 小节：4.5 函数的应用（二）
- KP：`rja.4.5.02` 对数应用
- 题型/难度：application / 2
- method：equiv_transform
- 配图：NOT_NEEDED
- 来源：original

**题干**

声音强度级 $L=10\lg\dfrac{I}{I_0}$（单位 dB）。若某声音强度 $I=10^5 I_0$，求 $L$。

**答案**

$L=50$（dB）。

**解析**

$L=10\lg(10^5)=10\cdot5=50$。

**Rubric**（满分 6）

- sub 代入 2：$L=10\lg10^5$
- calc 计算 4：$50$

**作者自检**：10*5=50。

---

## CAND-G2A-041

- 小节：4.2 指数函数
- KP：`rja.4.2.03` 指数方程
- 题型/难度：single / 3
- method：equiv_transform + substitution
- 配图：NOT_NEEDED
- 来源：original

**题干**

方程 $4^x-5\cdot2^x+4=0$ 的解的个数是

**选项**

- A. $0$
- B. $1$
- C. $2$
- D. $3$

**答案**

C

**解析**

令 $t=2^x>0$，则 $t^2-5t+4=0\Rightarrow(t-1)(t-4)=0$，$t=1$ 或 $t=4$。即 $2^x=1\Rightarrow x=0$；$2^x=4\Rightarrow x=2$。两解，选 C。

**作者自检**：t=1,4 两正根 ⇒ 两实解。

---

## CAND-G2A-042

- 小节：4.4 对数函数
- KP：`rja.4.4.03` 对数函数图象与性质
- 题型/难度：judge / 2
- method：graph_symmetry
- 配图：RECOMMENDED
- 来源：original

**题干**

判断：$y=\log_2 x$ 与 $y=2^x$ 的图象关于直线 $y=x$ 对称。

**答案**

true

**解析**

互为反函数的图象关于 $y=x$ 对称。$y=\log_2 x$ 与 $y=2^x$ 互为反函数，故命题正确。

**作者自检**：反函数对称性。

---
