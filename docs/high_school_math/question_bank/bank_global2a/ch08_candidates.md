# 第八章 立体几何初步 · GLOBAL-2A 候选

> specialty `rjb-ch3` · 题量 14 · **未入库**

## CAND-G2A-077

- 小节：8.1 基本立体图形
- KP：`rjb.8.1.01` 棱柱概念
- 题型/难度：judge / 1
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

直棱柱的侧棱垂直于底面。

**答案**

true

**解析**

直棱柱定义：侧棱垂直于底面的棱柱。命题正确。

**作者自检**：直棱柱定义

---

## CAND-G2A-078

- 小节：8.1 基本立体图形
- KP：`rjb.8.1.02` 简单组合体
- 题型/难度：multi / 1
- method：classification
- 配图：NOT_NEEDED
- 来源：original

**题干**

下列可作为简单组合体结构描述的有（多选）

**选项**

- A. 圆柱上叠加一个同底圆锥
- B. 长方体挖去一个内接圆柱孔
- C. 两个全等的三棱锥底面重合粘成
- D. 平面上的三角形与圆

**答案**

A,B,C

**解析**

A、B、C 均为由柱、锥等基本立体经拼接或挖补得到的组合体。D 是平面图形，不是立体组合体。故选 A、B、C。

**作者自检**：D非立体

---

## CAND-G2A-079

- 小节：8.2 立体图形的直观图
- KP：`rjb.8.2.01` 斜二测
- 题型/难度：single / 2
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

用斜二测画法画水平放置的平面图形时，平行于 $y$ 轴的线段在直观图中的长度通常取为原来的

**选项**

- A. 不变
- B. $\dfrac12$
- C. $2$ 倍
- D. $\dfrac{\sqrt{2}}{2}$

**答案**

B

**解析**

斜二测约定：平行于 $x$、$z$ 轴的线段长度不变；平行于 $y$ 轴的线段取原来的 $\dfrac12$。故选 B。本题考长度伸缩，不涉及直观图中夹角取值。

**作者自检**：异于G1B斜二测角题；考y半长

---

## CAND-G2A-080

- 小节：8.3 简单几何体的表面积与体积
- KP：`rjb.8.3.01` 柱体体积
- 题型/难度：numeric / 1
- method：num_shape
- 配图：NOT_NEEDED
- 来源：original

**题干**

棱长为 $3$ 的正方体体积为

**答案**

27

**解析**

正方体体积 $V=a^3=3^3=27$。

**作者自检**：3^3=27

---

## CAND-G2A-081

- 小节：8.3 简单几何体的表面积与体积
- KP：`rjb.8.3.02` 锥体应用
- 题型/难度：application / 2
- method：num_shape
- 配图：REQUIRED
- 来源：original

**题干**

如图，正三棱锥 $P-ABC$ 的底面是边长为 $6$ 的正三角形，高 $PO=4$（$O$ 为底面中心）。求该三棱锥的体积。

**答案**

$V=12\sqrt{3}$

**解析**

底面积 $S=\dfrac{\sqrt{3}}{4}\times6^2=9\sqrt{3}$。体积 $V=\dfrac13 Sh=\dfrac13\times9\sqrt{3}\times4=12\sqrt{3}$。

**Rubric**（满分 8）

- base 底面积 4：得 $S=9\sqrt{3}$
- vol 体积 4：得 $V=12\sqrt{3}$

**作者自检**：(1/3)*9√3*4=12√3

---

## CAND-G2A-082

- 小节：8.3 简单几何体的表面积与体积
- KP：`rjb.8.3.03` 组合体
- 题型/难度：application / 3
- method：num_shape + classification
- 配图：RECOMMENDED
- 来源：original

**题干**

圆柱底面半径 $r=3$，高 $h=8$。在其内部挖去一个与圆柱同轴、半径为 $3$ 的球（球完全位于圆柱内）。求剩余部分的体积。

**答案**

$36\pi$

**解析**

圆柱体积 $V_1=\pi\cdot 3^2\cdot 8=72\pi$。球体积 $V_2=\dfrac{4}{3}\pi\cdot 3^3=36\pi$。剩余 $V=V_1-V_2=36\pi$。球直径 $6$ 小于柱高 $8$，可完全放入。

**Rubric**（满分 8）

- cyl 圆柱体积 3：得 $72\pi$
- sph 球体积 3：得 $36\pi$
- rem 剩余 2：得 $36\pi$

**作者自检**：72π-36π=36π

---

## CAND-G2A-083

- 小节：8.4 空间点线面位置关系
- KP：`rjb.8.4.01` 平行公理
- 题型/难度：single / 1
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

若两条直线都与第三条直线平行，则这两条直线

**选项**

- A. 一定相交
- B. 一定异面
- C. 一定平行
- D. 可能垂直

**答案**

C

**解析**

平行公理的推论：平行于同一条直线的两条直线互相平行。故选 C。

**作者自检**：a∥c,b∥c ⇒ a∥b

---

## CAND-G2A-084

- 小节：8.4 空间点线面位置关系
- KP：`rjb.8.4.02` 直线与平面位置关系
- 题型/难度：multi / 2
- method：classification
- 配图：REQUIRED
- 来源：original

**题干**

如图，在正方体 $ABCD-A_1B_1C_1D_1$ 中，下列说法正确的有（多选）

**选项**

- A. $AB$ 与 $A_1B_1$ 平行
- B. $AC$ 与 $A_1B$ 是异面直线
- C. $AA_1$ 与平面 $ABCD$ 相交
- D. $AC$ 与 $B_1D_1$ 相交

**答案**

A,B,C

**解析**

A：上下对应棱平行。B：$AC$ 在底面，$A_1B$ 连上下底顶点，不共面且不相交，为异面。C：侧棱 $AA_1$ 交底面于 $A$。D：$AC$ 与 $B_1D_1$ 分别在平行的上下底面内，方向不平行且无交点，实为异面，并非相交。故选 A、B、C。

**作者自检**：D为异面非相交

---

## CAND-G2A-085

- 小节：8.5 空间中的平行关系
- KP：`rjb.8.5.01` 线面平行判定
- 题型/难度：judge / 2
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

若直线与平面平行，则该直线与平面内任意一条直线都平行。

**答案**

false

**解析**

直线与平面平行时，它与平面内的直线只能平行或异面，不可能相交；但绝非“都平行”。例如与底面平行的一条空间直线，底面内方向不同的直线与它异面而不平行。故命题错误。

**作者自检**：∥面⇒面内直线∥或异面

---

## CAND-G2A-086

- 小节：8.5 空间中的平行关系
- KP：`rjb.8.5.01` 线面平行判定
- 题型/难度：application / 3
- method：equiv_transform + num_shape
- 配图：REQUIRED
- 来源：original

**题干**

如图，在长方体 $ABCD-A_1B_1C_1D_1$ 中，$E$、$F$ 分别为棱 $AA_1$、$CC_1$ 的中点。证明：$EF\parallel$ 平面 $ABCD$。

**答案**

$\overrightarrow{EF}=\overrightarrow{AC}$，故 $EF\parallel AC$，又 $EF$ 不在平面 $ABCD$ 内，从而 $EF\parallel$ 平面 $ABCD$。

**解析**

建立坐标：$A(0,0,0)$，$C(a,b,0)$，$A_1(0,0,c)$，$C_1(a,b,c)$，则 $E(0,0,c/2)$，$F(a,b,c/2)$，$\overrightarrow{EF}=(a,b,0)=\overrightarrow{AC}$。故 $EF\parallel AC$，且 $AC\subset$ 平面 $ABCD$。又 $E$ 的竖坐标 $c/2\ne0$（$c>0$），$EF$ 不在底面内。由线面平行判定定理得 $EF\parallel$ 平面 $ABCD$。

**Rubric**（满分 10）

- vec 共线方向 4：证得 $EF\parallel AC$（或坐标得方向相同）
- out 线在面外 3：说明 $E$、$F$ 不在底面
- conc 判定结论 3：得出 $EF\parallel$ 平面 $ABCD$

**作者自检**：EF=(a,b,0)=AC，线面平行

---

## CAND-G2A-087

- 小节：8.6 空间中的垂直关系
- KP：`rjb.8.6.01` 线面垂直
- 题型/难度：single / 2
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

若直线 $l$ 垂直于平面 $\alpha$，则 $l$ 与 $\alpha$ 内任意一条直线的位置关系是

**选项**

- A. 平行
- B. 相交垂直
- C. 垂直（相交或异面垂直）
- D. 异面

**答案**

C

**解析**

线面垂直定义：直线垂直于平面内所有直线。这种垂直包含相交垂直与异面垂直。故选 C。

**作者自检**：⊥面内任直线

---

## CAND-G2A-088

- 小节：8.6 空间中的垂直关系
- KP：`rjb.8.6.02` 垂直证明
- 题型/难度：application / 3
- method：equiv_transform + num_shape
- 配图：REQUIRED
- 来源：original

**题干**

如图，在直三棱柱 $ABC-A_1B_1C_1$ 中，$AB\perp BC$，且 $AB=BC=AA_1=2$。证明：$AB_1\perp$ 平面 $A_1BC$。

**答案**

$AB_1\perp A_1B$ 且 $AB_1\perp BC$，又 $A_1B$ 与 $BC$ 交于 $B$ 且都在平面 $A_1BC$ 内，故 $AB_1\perp$ 平面 $A_1BC$。

**解析**

建系：$B(0,0,0)$，$C(2,0,0)$，$A(0,2,0)$，$A_1(0,2,2)$，$B_1(0,0,2)$。则 $\overrightarrow{AB_1}=(0,-2,2)$，$\overrightarrow{A_1B}=(0,-2,-2)$，$\overrightarrow{BC}=(2,0,0)$。$\overrightarrow{AB_1}\cdot\overrightarrow{A_1B}=0+4-4=0$，$\overrightarrow{AB_1}\cdot\overrightarrow{BC}=0$。故 $AB_1\perp A_1B$，$AB_1\perp BC$。两相交直线 $A_1B$、$BC$ 确定平面 $A_1BC$，由线面垂直判定得证。本题用直三棱柱，避免正方体 $BD_1\perp$ 平面 $A_1C_1D$ 旧题。

**Rubric**（满分 10）

- l1 证⊥A1B 4：证得 $AB_1\perp A_1B$
- l2 证⊥BC 4：证得 $AB_1\perp BC$
- c 结论 2：得出线面垂直

**作者自检**：点积均0；异于正方体BD1题

---

## CAND-G2A-089

- 小节：8.6 空间中的垂直关系
- KP：`rjb.8.6.03` 面面垂直
- 题型/难度：multi / 3
- method：classification + defn
- 配图：REQUIRED
- 来源：original

**题干**

如图，正方体 $ABCD-A_1B_1C_1D_1$ 中，下列正确的有（多选）

**选项**

- A. 平面 $ABB_1A_1\perp$ 平面 $ABCD$
- B. 平面 $ACC_1A_1\perp$ 平面 $BDD_1B_1$
- C. 平面 $ABC_1\perp$ 平面 $ABB_1A_1$
- D. 平面 $AA_1B_1B\perp$ 平面 $ADD_1A_1$

**答案**

A,B,D

**解析**

A：侧棱 $AA_1\perp$ 底面且在侧面内，故侧面⊥底面。B：两对角截面法向量点积为 $0$，互相垂直。D：相邻侧面交线为侧棱，侧棱垂直于两底交线，故邻侧面互相垂直。C：平面 $ABB_1A_1$ 可取法向量 $(0,1,0)$；平面 $ABC_1$ 法向量可取 $(0,-1,1)$，点积 $-1\ne0$，不垂直。故选 A、B、D。

**作者自检**：C: n·(0,1,0)≠0

---

## CAND-G2A-090

- 小节：8.3 简单几何体的表面积与体积
- KP：`rjb.8.3.02` 锥体应用
- 题型/难度：numeric / 2
- method：num_shape
- 配图：NOT_NEEDED
- 来源：original

**题干**

底面半径为 $3$，高为 $4$ 的圆锥体积为 $V$。求 $\dfrac{V}{\pi}$ 的值。

**答案**

12

**解析**

$V=\dfrac13\pi r^2 h=\dfrac13\pi\cdot9\cdot4=12\pi$，故 $\dfrac{V}{\pi}=12$。

**作者自检**：(1/3)*9*4=12；改为求 V/π 以满足 numeric 导入字面量协议。

---
