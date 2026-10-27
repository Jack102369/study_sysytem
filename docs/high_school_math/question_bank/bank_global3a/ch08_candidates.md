# 第八章 立体几何初步 · GLOBAL-3A 候选

> specialty `rjb-ch3` · 题量 14 · **未入库**

## CAND-G3A-077

- 小节：8.1 基本立体图形
- KP：`rjb.8.1.01` 棱柱概念
- 题型/难度：single / 1
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

下列几何体中，一定是棱柱的是

**选项**

- A. 三棱锥
- B. 四棱台
- C. 直三棱柱
- D. 圆锥

**答案**

C

**解析**

棱柱有两个平行且全等的底面，侧面均为平行四边形。直三棱柱符合；三棱锥、棱台、圆锥都不是棱柱。故选 C。

**作者自检**：直三棱柱是棱柱

---

## CAND-G3A-078

- 小节：8.2 立体图形的直观图
- KP：`rjb.8.2.01` 斜二测
- 题型/难度：single / 1
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

用斜二测画法画水平放置的平面图形的直观图时，与 $x$ 轴平行的线段长度

**选项**

- A. 变为原来的一半
- B. 保持不变
- C. 变为原来的两倍
- D. 变为原来的 $\dfrac{\sqrt2}{2}$ 倍

**答案**

B

**解析**

斜二测画法：平行于 $x$ 轴（或 $z$ 轴）的线段长度不变；平行于 $y$ 轴的线段变为原来的一半。故选 B。

**作者自检**：∥x轴长度不变

---

## CAND-G3A-079

- 小节：8.3 简单几何体的表面积与体积
- KP：`rjb.8.3.01` 柱体体积
- 题型/难度：numeric / 1
- method：num_shape
- 配图：NOT_NEEDED
- 来源：original

**题干**

底面边长为 $3$ 的正四棱柱，高为 $4$，则其体积为

**答案**

36

**解析**

$V=$ 底面积 $\times$ 高 $=3^2\times4=36$。

**作者自检**：9*4=36

---

## CAND-G3A-080

- 小节：8.3 简单几何体的表面积与体积
- KP：`rjb.8.3.03` 组合体
- 题型/难度：application / 3
- method：num_shape + classification
- 配图：REQUIRED
- 来源：original

**题干**

如图，一个圆柱上底面同心叠放一个同底圆锥：圆柱底面半径为 $2$，高为 $6$；圆锥高为 $3$。求该组合体的体积（用含 $\pi$ 的式子表示）。

**答案**

$28\pi$

**解析**

圆柱体积 $V_1=\pi r^2 h=\pi\cdot4\cdot6=24\pi$。圆锥体积 $V_2=\dfrac13\pi r^2 h=\dfrac13\pi\cdot4\cdot3=4\pi$。组合体体积 $V=V_1+V_2=28\pi$。

**Rubric**（满分 8）

- cyl 圆柱 3：得圆柱体积 $24\pi$
- cone 圆锥 3：得圆锥体积 $4\pi$
- sum 合计 2：得 $28\pi$

**作者自检**：24π+4π=28π；异于正三棱锥PO=4

---

## CAND-G3A-081

- 小节：8.3 简单几何体的表面积与体积
- KP：`rjb.8.3.02` 锥体应用
- 题型/难度：application / 3
- method：num_shape + equiv_transform
- 配图：REQUIRED
- 来源：original

**题干**

如图，正四面体 $ABCD$ 的棱长为 $2$。求其体积。

**答案**

$\dfrac{2\sqrt2}{3}$

**解析**

正四面体体积公式 $V=\dfrac{\sqrt2}{12}a^3$。代入 $a=2$：$V=\dfrac{\sqrt2}{12}\cdot8=\dfrac{2\sqrt2}{3}$。亦可取底面正三角形面积 $\sqrt3$，高 $h=\dfrac{\sqrt6}{3}\cdot2=\dfrac{2\sqrt6}{3}$，再算 $V=\dfrac13\cdot\sqrt3\cdot\dfrac{2\sqrt6}{3}=\dfrac{2\sqrt2}{3}$（底面积为 $\sqrt3$：边长2的正三角形面积 $\dfrac{\sqrt3}{4}\cdot4=\sqrt3$）。

**Rubric**（满分 10）

- base 底或公式 4：正确用公式或求出底面积与高
- vol 体积 6：得 $\dfrac{2\sqrt2}{3}$

**作者自检**：√2/12*8=2√2/3；非PO=4棱锥

---

## CAND-G3A-082

- 小节：8.1 基本立体图形
- KP：`rjb.8.1.01` 棱柱概念
- 题型/难度：multi / 2
- method：classification + defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

关于棱柱，下列说法正确的有（多选）

**选项**

- A. 两底面平行且全等
- B. 侧棱都相等且互相平行
- C. 侧面一定是矩形
- D. 直棱柱的侧棱垂直于底面

**答案**

A,B,D

**解析**

A、B 为棱柱基本性质。D 为直棱柱定义。C：斜棱柱侧面是平行四边形，不一定是矩形。故选 A、B、D。

**作者自检**：C仅直棱柱且底边⊥侧棱截面等特殊

---

## CAND-G3A-083

- 小节：8.4 空间点线面位置关系
- KP：`rjb.8.4.01` 平行公理
- 题型/难度：single / 1
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

空间中，过直线外一点

**选项**

- A. 有且只有一条直线与已知直线平行
- B. 有无数条直线与已知直线平行
- C. 没有直线与已知直线平行
- D. 有且只有两条直线与已知直线平行

**答案**

A

**解析**

平行公理：过直线外一点有且只有一条直线与已知直线平行。故选 A。

**作者自检**：过线外一点唯一平行线

---

## CAND-G3A-084

- 小节：8.5 空间中的平行关系
- KP：`rjb.8.5.01` 线面平行判定
- 题型/难度：judge / 2
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

判断：若直线 $l$ 与平面 $\alpha$ 内的一条直线平行，则一定有 $l\parallel\alpha$（无需其它条件）。

**答案**

false

**解析**

线面平行判定需要“$l$ 在平面外”等条件。若 $l$ 本身落在 $\alpha$ 内且与面内某直线平行，则 $l$ 与 $\alpha$ 相交关系不成立为平行（直线在平面内）。缺少“平面外”等条件时命题不成立。

**作者自检**：缺“平面外”条件则假；面内平行线≠线面平行。

---

## CAND-G3A-085

- 小节：8.6 空间中的垂直关系
- KP：`rjb.8.6.02` 垂直证明
- 题型/难度：application / 3
- method：num_shape + equiv_transform
- 配图：REQUIRED
- 来源：original

**题干**

如图，在长方体 $ABCD-A_1B_1C_1D_1$ 中，$AB=AD=2$，$AA_1=1$。求直线 $A_1B$ 与平面 $ABCD$ 所成角的正弦值。

**答案**

$\dfrac{\sqrt5}{5}$

**解析**

直线 $A_1B$ 在底面 $ABCD$ 上的射影为 $AB$。设所成角为 $\theta$，则在直角三角形 $A_1AB$ 中，$\sin\theta=\dfrac{AA_1}{A_1B}$。$A_1B=\sqrt{AB^2+AA_1^2}=\sqrt{4+1}=\sqrt5$，故 $\sin\theta=\dfrac{1}{\sqrt5}=\dfrac{\sqrt5}{5}$。

**Rubric**（满分 10）

- proj 射影 3：指出射影为 $AB$（或等价说明）
- len 斜线长 3：得 $A_1B=\sqrt5$
- sin 正弦 4：得 $\dfrac{\sqrt5}{5}$

**作者自检**：异于双仰角45/60；sin=1/√5

---

## CAND-G3A-086

- 小节：8.4 空间点线面位置关系
- KP：`rjb.8.4.01` 平行公理
- 题型/难度：application / 3
- method：num_shape + classification
- 配图：REQUIRED
- 来源：original

**题干**

如图，正方体 $ABCD-A_1B_1C_1D_1$ 的棱长为 $1$，$M$、$N$ 分别是棱 $AB$、$CC_1$ 的中点。求线段 $MN$ 的长。

**答案**

$\dfrac{\sqrt6}{2}$

**解析**

建系：$A(0,0,0)$，$B(1,0,0)$，$C(1,1,0)$，$C_1(1,1,1)$，则 $M\!\left(\dfrac12,0,0\right)$，$N\!\left(1,1,\dfrac12\right)$。$\overrightarrow{MN}=\left(\dfrac12,1,\dfrac12\right)$，$|MN|=\sqrt{\dfrac14+1+\dfrac14}=\sqrt{\dfrac32}=\dfrac{\sqrt6}{2}$。

**Rubric**（满分 8）

- coord 坐标 3：正确表示 $M$、$N$ 坐标
- len 长度 5：得 $\dfrac{\sqrt6}{2}$

**作者自检**：异于AC与A1B题；中点MN

---

## CAND-G3A-087

- 小节：8.5 空间中的平行关系
- KP：`rjb.8.5.02` 面面平行
- 题型/难度：multi / 3
- method：classification + defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

下列条件中，能判定平面 $\alpha\parallel$ 平面 $\beta$ 的有（多选）

**选项**

- A. $\alpha$ 内两条相交直线分别平行于 $\beta$
- B. $\alpha$ 内一条直线平行于 $\beta$
- C. 存在平面 $\gamma$，使 $\alpha\parallel\gamma$ 且 $\beta\parallel\gamma$
- D. $\alpha$ 内两条平行直线分别平行于 $\beta$

**答案**

A,C

**解析**

A：面面平行判定定理（平面内两条相交直线分别∥另一平面）。C：平行于同一平面的两个平面平行。B：仅一条线∥面不能保证面面平行。D：两条平行线方向不独立，不能判定。故选 A、C。

**作者自检**：A判定；C传递；B,D不足

---

## CAND-G3A-088

- 小节：8.6 空间中的垂直关系
- KP：`rjb.8.6.01` 线面垂直
- 题型/难度：single / 1
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

判定直线 $l\perp$ 平面 $\alpha$ 的一种常用方法是：若 $l$ 垂直于 $\alpha$ 内

**选项**

- A. 一条直线
- B. 两条平行直线
- C. 两条相交直线
- D. 无数条直线（可共线）

**答案**

C

**解析**

线面垂直判定定理：若一条直线垂直于平面内两条相交直线，则该直线垂直于这个平面。故选 C。

**作者自检**：须两条相交直线 [quota: d2→d1 基础题]

---

## CAND-G3A-089

- 小节：8.6 空间中的垂直关系
- KP：`rjb.8.6.02` 垂直证明
- 题型/难度：multi / 3
- method：classification + num_shape
- 配图：RECOMMENDED
- 来源：original

**题干**

在长方体 $ABCD-A_1B_1C_1D_1$ 中，$AB=2$，$AD=1$，$AA_1=1$。下列结论正确的有（多选）

**选项**

- A. $AA_1\perp$ 平面 $ABCD$
- B. $AB\perp AD$
- C. $A_1C\perp BD$
- D. 平面 $ABB_1A_1\perp$ 平面 $ABCD$

**答案**

A,B,D

**解析**

A、D：侧棱垂直底面，侧面含侧棱故⊥底面。B：底面邻边垂直。C：建系 $A(0,0,0)$，$B(2,0,0)$，$D(0,1,0)$，$A_1(0,0,1)$，$C(2,1,0)$，则 $\overrightarrow{A_1C}=(2,1,-1)$，$\overrightarrow{BD}=(-2,1,0)$，点积 $-4+1+0=-3\ne0$，不垂直。故选 A、B、D。

**作者自检**：A1C·BD=-3≠0

---

## CAND-G3A-090

- 小节：8.3 简单几何体的表面积与体积
- KP：`rjb.8.3.01` 柱体体积
- 题型/难度：numeric / 2
- method：num_shape
- 配图：NOT_NEEDED
- 来源：original

**题干**

底面半径为 $2$、高为 $5$ 的圆柱，其体积除以 $\pi$ 的结果为

**答案**

20

**解析**

$V=\pi r^2 h=\pi\cdot4\cdot5=20\pi$，故 $V/\pi=20$。

**作者自检**：4*5=20

---
