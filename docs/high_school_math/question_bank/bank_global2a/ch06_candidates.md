# 第六章 平面向量及其应用 · GLOBAL-2A 候选

> specialty `rjb-ch1` · 题量 14 · **未入库**

## CAND-G2A-059

- 小节：6.1 平面向量的概念
- KP：`rjb.6.1.01` 向量概念
- 题型/难度：single / 1
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

下列物理量中，属于向量的是

**选项**

- A. 位移
- B. 温度
- C. 质量
- D. 时间

**答案**

A

**解析**

向量是既有大小又有方向的量。位移有大小（路程长度）与方向，属于向量；温度、质量、时间只有大小没有方向，是标量。故选 A。

**作者自检**：位移有向；温质时为标量

---

## CAND-G2A-060

- 小节：6.1 平面向量的概念
- KP：`rjb.6.1.03` 相等向量
- 题型/难度：judge / 1
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

两个向量相等的充要条件是它们的方向相同且模相等。

**答案**

true

**解析**

教材定义：方向相同且模长相等的向量叫做相等向量。作为自由向量，起点可平移，故该充要条件正确。

**作者自检**：方向同且模等⇔相等

---

## CAND-G2A-061

- 小节：6.1 平面向量的概念
- KP：`rjb.6.1.02` 向量模
- 题型/难度：numeric / 1
- method：num_shape
- 配图：NOT_NEEDED
- 来源：original

**题干**

设 $\vec a=(-5,12)$，则 $|\vec a|=$

**答案**

13

**解析**

$|\vec a|=\sqrt{(-5)^2+12^2}=\sqrt{25+144}=\sqrt{169}=13$。

**作者自检**：sqrt(25+144)=13

---

## CAND-G2A-062

- 小节：6.2 平面向量的运算
- KP：`rjb.6.2.01` 向量加法
- 题型/难度：single / 1
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

用平行四边形法则作 $\vec a+\vec b$ 时，对角线表示

**选项**

- A. $\vec a+\vec b$
- B. $\vec a-\vec b$
- C. $\vec a\cdot\vec b$
- D. $|\vec a|+|\vec b|$

**答案**

A

**解析**

以 $\vec a,\vec b$ 为邻边作平行四边形，从公共起点出发的对角线即为和向量 $\vec a+\vec b$。故选 A。

**作者自检**：邻边和=对角线

---

## CAND-G2A-063

- 小节：6.2 平面向量的运算
- KP：`rjb.6.2.02` 数量积
- 题型/难度：multi / 2
- method：classification + defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

关于平面向量数量积，正确的有（多选）

**选项**

- A. $\vec a\cdot\vec a=|\vec a|^2$
- B. 若 $\vec a\perp\vec b$，则 $\vec a\cdot\vec b=0$
- C. $|\vec a\cdot\vec b|\le|\vec a||\vec b|$
- D. $\vec a\cdot\vec b=|\vec a|+|\vec b|$

**答案**

A,B,C

**解析**

A 由定义 $\vec a\cdot\vec a=|\vec a||\vec a|\cos0=|\vec a|^2$。B 为垂直⇔数量积为 $0$（含零向量约定）。C 由 $|\cos\theta|\le1$ 得柯西型不等式。D 把数量积误写成模长相加，错误。故选 A、B、C。

**作者自检**：D混淆点积与模和

---

## CAND-G2A-064

- 小节：6.2 平面向量的运算
- KP：`rjb.6.2.02` 数量积
- 题型/难度：numeric / 2
- method：num_shape
- 配图：NOT_NEEDED
- 来源：original

**题干**

设 $\vec a=(2,3)$，$\vec b=(-1,4)$，则 $\vec a\cdot\vec b=$

**答案**

10

**解析**

$\vec a\cdot\vec b=2\cdot(-1)+3\cdot4=-2+12=10$。

**作者自检**：2*(-1)+3*4=10

---

## CAND-G2A-065

- 小节：6.2 平面向量的运算
- KP：`rjb.6.2.03` 向量夹角
- 题型/难度：single / 2
- method：num_shape
- 配图：NOT_NEEDED
- 来源：original

**题干**

设 $\vec a=(1,0)$，$\vec b=(1,1)$，则 $\vec a$ 与 $\vec b$ 的夹角为

**选项**

- A. $30^\circ$
- B. $45^\circ$
- C. $60^\circ$
- D. $90^\circ$

**答案**

B

**解析**

$\cos\theta=\dfrac{\vec a\cdot\vec b}{|\vec a||\vec b|}=\dfrac{1}{1\cdot\sqrt{2}}=\dfrac{\sqrt{2}}{2}$，故 $\theta=45^\circ$。选 B。

**作者自检**：cos^{-1}(√2/2)=45°

---

## CAND-G2A-066

- 小节：6.2 平面向量的运算
- KP：`rjb.6.2.04` 投影
- 题型/难度：application / 2
- method：num_shape
- 配图：NOT_NEEDED
- 来源：original

**题干**

已知 $\vec a=(3,4)$，$\vec b=(1,0)$。求 $\vec a$ 在 $\vec b$ 方向上的投影（数量投影）及投影向量。

**答案**

数量投影为 $3$；投影向量为 $(3,0)$。

**解析**

$\vec b$ 方向单位向量 $\vec e=\dfrac{\vec b}{|\vec b|}=(1,0)$。数量投影 $\vec a\cdot\vec e=3$。投影向量 $(\vec a\cdot\vec e)\vec e=(3,0)$。亦可由 $\mathrm{proj}_{\vec b}\vec a=\dfrac{\vec a\cdot\vec b}{|\vec b|^2}\vec b=\dfrac{3}{1}(1,0)=(3,0)$。

**Rubric**（满分 8）

- scalar 数量投影 4：得数量投影 $3$
- vec 投影向量 4：得投影向量 $(3,0)$

**作者自检**：a·e=3；proj=(3,0)

---

## CAND-G2A-067

- 小节：6.3 平面向量基本定理及坐标表示
- KP：`rjb.6.3.01` 基底
- 题型/难度：single / 1
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

平面向量基本定理中，作为基底的两个向量必须

**选项**

- A. 互相垂直
- B. 模长相等
- C. 不共线
- D. 单位向量

**答案**

C

**解析**

平面内任意向量可由两个不共线向量唯一线性表出。基底只需不共线，不必垂直、等长或单位化。故选 C。

**作者自检**：基底⇔不共线

---

## CAND-G2A-068

- 小节：6.3 平面向量基本定理及坐标表示
- KP：`rjb.6.3.02` 坐标运算
- 题型/难度：numeric / 1
- method：num_shape
- 配图：NOT_NEEDED
- 来源：original

**题干**

点 $A(1,2)$，$B(4,6)$，则 $|\overrightarrow{AB}|=$

**答案**

5

**解析**

$\overrightarrow{AB}=(4-1,6-2)=(3,4)$，$|\overrightarrow{AB}|=\sqrt{9+16}=5$。

**作者自检**：AB=(3,4)，模5

---

## CAND-G2A-069

- 小节：6.3 平面向量基本定理及坐标表示
- KP：`rjb.6.3.03` 共线条件
- 题型/难度：multi / 2
- method：equiv_transform + classification
- 配图：NOT_NEEDED
- 来源：original

**题干**

设 $\vec a=(x_1,y_1)$，$\vec b=(x_2,y_2)$ 且 $\vec b\ne\vec 0$。下列与“$\vec a$ 与 $\vec b$ 共线”等价的有（多选）

**选项**

- A. 存在实数 $\lambda$ 使 $\vec a=\lambda\vec b$
- B. $x_1y_2-x_2y_1=0$
- C. $\vec a\cdot\vec b=0$
- D. $\dfrac{x_1}{x_2}=\dfrac{y_1}{y_2}$（当 $x_2y_2\ne0$）

**答案**

A,B,D

**解析**

共线⇔存在 $\lambda$ 使 $\vec a=\lambda\vec b$（A）；坐标上⇔行列式 $x_1y_2-x_2y_1=0$（B）；分量比相等（分母非零时）即 D。C 是垂直条件，与共线无关。故选 A、B、D。

**作者自检**：C为垂直非共线

---

## CAND-G2A-070

- 小节：6.4 平面向量的应用
- KP：`rjb.6.4.02` 位移合成
- 题型/难度：application / 2
- method：num_shape
- 配图：RECOMMENDED
- 来源：original

**题干**

小船先向东航行 $6\,\mathrm{km}$，再向北航行 $8\,\mathrm{km}$。求合位移的大小与方向（相对正东的偏角）。

**答案**

合位移大小 $10\,\mathrm{km}$，方向为北偏东 $\arctan\dfrac{3}{4}$（或东偏北 $\arctan\dfrac{4}{3}$）。

**解析**

取东、北为正：$\vec s_1=(6,0)$，$\vec s_2=(0,8)$，合位移 $\vec s=(6,8)$，$|\vec s|=\sqrt{36+64}=10$。设相对正东偏角为 $\theta$，则 $\tan\theta=\dfrac{8}{6}=\dfrac{4}{3}$，即东偏北 $\arctan\dfrac{4}{3}$（等价北偏东 $\arctan\dfrac{3}{4}$）。

**Rubric**（满分 8）

- mag 大小 4：得 $|\vec s|=10$
- dir 方向 4：正确给出偏角（东偏北 $\arctan4/3$ 或等价表述）

**作者自检**：sqrt(36+64)=10；tanθ=4/3

---

## CAND-G2A-071

- 小节：6.4 平面向量的应用
- KP：`rjb.6.4.04` 几何证明
- 题型/难度：application / 3
- method：equiv_transform + special_value
- 配图：RECOMMENDED
- 来源：original

**题干**

在 $\triangle ABC$ 中，$D$、$E$ 分别是边 $AB$、$AC$ 的中点。用向量方法证明：$DE\parallel BC$ 且 $DE=\dfrac12 BC$。

**答案**

$\overrightarrow{DE}=\dfrac12\overrightarrow{BC}$，故 $DE\parallel BC$ 且 $DE=\dfrac12 BC$。

**解析**

设 $\overrightarrow{AB}=\vec b$，$\overrightarrow{AC}=\vec c$。则 $D$、$E$ 为中点：$\overrightarrow{AD}=\dfrac12\vec b$，$\overrightarrow{AE}=\dfrac12\vec c$。于是 $\overrightarrow{DE}=\overrightarrow{AE}-\overrightarrow{AD}=\dfrac12(\vec c-\vec b)=\dfrac12\overrightarrow{BC}$。故 $\overrightarrow{DE}$ 与 $\overrightarrow{BC}$ 共线同向且模长比为 $\dfrac12$，即 $DE\parallel BC$ 且 $DE=\dfrac12 BC$。

**Rubric**（满分 10）

- setup 设向量 3：合理设基向量并表示中点
- de 求DE 4：推出 $\overrightarrow{DE}=\dfrac12\overrightarrow{BC}$
- conc 结论 3：由此得平行且比为1/2

**作者自检**：中位线：DE=½BC，异于对角线平分

---

## CAND-G2A-072

- 小节：6.4 平面向量的应用
- KP：`rjb.6.4.03` 功的计算
- 题型/难度：numeric / 3
- method：num_shape + equiv_transform
- 配图：NOT_NEEDED
- 来源：original

**题干**

已知力 $\vec F=(3,4)$（单位 N）。质点从点 $A(1,2)$ 移动到点 $B(7,10)$（单位 m）。另有恒力 $\vec G$ 与位移 $\overrightarrow{AB}$ 方向相同，且 $|\vec G|=5$（单位 N）。求合力 $\vec F+\vec G$ 对这段位移所做的总功 $W$（单位 J）。

**答案**

100

**解析**

位移 $\overrightarrow{AB}=(7-1,10-2)=(6,8)$，其模 $|\overrightarrow{AB}|=\sqrt{6^2+8^2}=10$。
$\vec F$ 做功：$W_F=\vec F\cdot\overrightarrow{AB}=3\cdot6+4\cdot8=18+32=50$。
$\vec G$ 与 $\overrightarrow{AB}$ 同向且模为 $5$，故 $\vec G=5\cdot\dfrac{\overrightarrow{AB}}{|\overrightarrow{AB}|}=5\cdot\left(\dfrac{6}{10},\dfrac{8}{10}\right)=(3,4)$。
$W_G=\vec G\cdot\overrightarrow{AB}=5\cdot10=50$（同向时功等于 $|\vec G||\overrightarrow{AB}|$）。
总功 $W=W_F+W_G=100$。亦可用 $(\vec F+\vec G)\cdot\overrightarrow{AB}=(6,8)\cdot(6,8)=36+64=100$ 复核。

**作者自检**：AB=(6,8),|AB|=10; WF=50; G=5*u= (3,4); WG=50; W=100。含位移建模+单位化+数量积，非两次余弦照抄。

---
