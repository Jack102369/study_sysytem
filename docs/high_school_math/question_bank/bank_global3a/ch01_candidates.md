# 第一章 集合与常用逻辑用语 · GLOBAL-3A 候选

> specialty `rja-ch1` · 题量 6 · **未入库**

## CAND-G3A-001

- 小节：1.1 集合的概念
- KP：`rja.1.1.01` 集合的含义与元素
- 题型/难度：single / 1
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

下列对象能构成集合的是

**选项**

- A. 高一(1)班个子较高的同学
- B. 方程 $x^2-5x+6=0$ 的实数解
- C. 接近 $0$ 的实数
- D. 好看的风景照片

**答案**

B

**解析**

集合元素须确定。A、C、D 中“较高”“接近”“好看”均不确定；B 的实数解为 $2,3$，元素明确，故选 B。

**作者自检**：B 根确定；A/C/D 描述模糊。

---

## CAND-G3A-002

- 小节：1.2 集合间的基本关系
- KP：`rja.1.2.01` 子集与真子集
- 题型/难度：multi / 2
- method：classification + defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

设 $A=\{0,1\}$，$B=\{x\mid x^2-x=0\}$，则下列正确的有（多选）

**选项**

- A. $A\subseteq B$
- B. $B\subseteq A$
- C. $A=B$
- D. $A\subsetneq B$

**答案**

A,B,C

**解析**

$x^2-x=0\Rightarrow x(x-1)=0$，得 $B=\{0,1\}=A$。故 $A\subseteq B$、$B\subseteq A$、$A=B$ 成立；真子集不成立，D 错。

**作者自检**：B={0,1}=A；真子集不成立。

---

## CAND-G3A-003

- 小节：1.4 充分条件与必要条件
- KP：`rja.1.4.01` 充分条件
- 题型/难度：judge / 1
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

判断：$x>2$ 是 $x>1$ 的充分不必要条件。

**答案**

true

**解析**

若 $x>2$ 则必有 $x>1$，故充分；取 $x=1.5$ 满足 $x>1$ 但不满足 $x>2$，故非必要。命题正确。

**作者自检**：充分成立；反例1.5说明非必要。

---

## CAND-G3A-004

- 小节：1.3 集合的基本运算
- KP：`rja.1.3.04` 文氏图与综合运算
- 题型/难度：numeric / 2
- method：equiv_transform
- 配图：NOT_NEEDED
- 来源：original

**题干**

全集 $U=\{1,2,3,4,5,6\}$，$A=\{1,2,3\}$，$B=\{2,3,4\}$，则 $|\complement_U(A\cap B)|=$

**答案**

4

**解析**

$A\cap B=\{2,3\}$，$\complement_U(A\cap B)=\{1,4,5,6\}$，基数为 $4$。

**作者自检**：|U|-|A∩B|=6-2=4。

---

## CAND-G3A-005

- 小节：1.3 集合的基本运算
- KP：`rja.1.3.01` 并集
- 题型/难度：application / 3
- method：equiv_transform + classification
- 配图：NOT_NEEDED
- 来源：original

**题干**

设全集 $U=\{x\in\mathbb{N}^*\mid x\le 10\}$，$A=\{x\in U\mid x\text{ 为偶数}\}$，$B=\{x\in U\mid x\text{ 为 }3\text{ 的倍数}\}$。
（1）求 $A\cup B$；
（2）求 $|\complement_U(A\cup B)|$。

**答案**

（1）$A\cup B=\{2,3,4,6,8,9,10\}$；（2）$3$。

**解析**

$A=\{2,4,6,8,10\}$，$B=\{3,6,9\}$，故 $A\cup B=\{2,3,4,6,8,9,10\}$。$\complement_U(A\cup B)=\{1,5,7\}$，个数为 $3$。

**Rubric**（满分 8）

- union 并集 4：正确列出 A∪B 七元
- comp 补集个数 4：得 3

**作者自检**：并7元；补{1,5,7}共3。

---

## CAND-G3A-006

- 小节：1.5 全称量词与存在量词
- KP：`rja.1.5.03` 含有量词的命题否定
- 题型/难度：single / 1
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

命题“$\forall x\in\mathbb{R}$，$x^2+1>0$”的否定是

**选项**

- A. $\forall x\in\mathbb{R}$，$x^2+1\le 0$
- B. $\exists x\in\mathbb{R}$，$x^2+1\le 0$
- C. $\exists x\in\mathbb{R}$，$x^2+1>0$
- D. $\forall x\in\mathbb{R}$，$x^2+1=0$

**答案**

B

**解析**

全称命题否定为存在量词加谓词否定：$\exists x\in\mathbb{R}$，$x^2+1\le 0$。选 B。

**作者自检**：∀P 否定为 ∃¬P。 [quota: d2→d1 基础题]

---
