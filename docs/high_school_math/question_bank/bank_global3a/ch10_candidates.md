# 第十章 概率 · GLOBAL-3A 候选

> specialty `rjb-ch5` · 题量 6 · **未入库**

## CAND-G3A-095

- 小节：10.1 随机事件与概率
- KP：`rjb.10.1.01` 样本空间
- 题型/难度：single / 1
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

掷一枚质地均匀的骰子一次，样本空间所含基本事件的个数为

**选项**

- A. 2
- B. 4
- C. 6
- D. 12

**答案**

C

**解析**

结果为点数 $1$ 至 $6$，共 $6$ 个基本事件。选 C。

**作者自检**：异于硬币2结果

---

## CAND-G3A-096

- 小节：10.1 随机事件与概率
- KP：`rjb.10.1.02` 古典概型
- 题型/难度：numeric / 1
- method：num_shape
- 配图：NOT_NEEDED
- 来源：original

**题干**

袋中有 $3$ 个红球、$2$ 个白球，从中随机摸出 $1$ 个球，则摸到红球的概率为（填最简分数）

**答案**

3/5

**解析**

古典概型：$P=\dfrac{3}{3+2}=\dfrac{3}{5}$。

**作者自检**：3/5

---

## CAND-G3A-097

- 小节：10.2 事件的相互独立性
- KP：`rjb.10.2.01` 独立事件
- 题型/难度：numeric / 2
- method：num_shape
- 配图：NOT_NEEDED
- 来源：original

**题干**

独立事件 $A,B$ 满足 $P(A)=\dfrac{1}{2}$，$P(B)=\dfrac{1}{3}$，则 $P(\overline{A}\,\overline{B})=$

**答案**

1/3

**解析**

独立 ⇒ 对立亦独立：$P(\overline{A}\overline{B})=P(\overline{A})P(\overline{B})=\left(1-\dfrac{1}{2}\right)\left(1-\dfrac{1}{3}\right)=\dfrac{1}{2}\cdot\dfrac{2}{3}=\dfrac{1}{3}$。

**作者自检**：(1/2)*(2/3)=1/3

---

## CAND-G3A-098

- 小节：10.2 事件的相互独立性
- KP：`rjb.10.2.01` 独立事件
- 题型/难度：multi / 2
- method：classification + defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

设事件 $A,B$ 相互独立，且 $0<P(A)<1$，$0<P(B)<1$。下列一定成立的有（多选）

**选项**

- A. $P(AB)=P(A)P(B)$
- B. $A$ 与 $\overline{B}$ 相互独立
- C. $P(A\cup B)=P(A)+P(B)$
- D. $P(A|B)=P(A)$

**答案**

A,B,D

**解析**

A、D 为独立性等价说法。B：独立事件与对方对立事件仍独立。C：仅当互斥时成立，独立未必互斥。故选 A、B、D。

**作者自检**：C需互斥；独立≠互斥

---

## CAND-G3A-099

- 小节：10.3 频率与概率
- KP：`rjb.10.3.01` 大数定律思想
- 题型/难度：single / 2
- method：defn
- 配图：NOT_NEEDED
- 来源：original

**题干**

大量重复试验下，随机事件发生的频率会

**选项**

- A. 越来越远离概率
- B. 稳定在概率附近
- C. 始终等于概率
- D. 越来越接近 $0$

**答案**

B

**解析**

大数定律思想：试验次数很大时，频率稳定在概率附近，但不保证每一次都等于概率。故选 B。

**作者自检**：稳定附近非恒等

---

## CAND-G3A-100

- 小节：10.1 随机事件与概率
- KP：`rjb.10.1.02` 古典概型
- 题型/难度：application / 3
- method：num_shape + classification
- 配图：NOT_NEEDED
- 来源：original

**题干**

从 $1,2,3,4,5$ 五个数中随机取出两个不同的数，求两数之和为偶数的概率。

**答案**

$2/5$

**解析**

基本事件总数 $\mathrm{C}_5^2=10$。和为偶数当且仅当两奇或两偶：奇有 $1,3,5$ 共 $3$ 个，偶有 $2,4$ 共 $2$ 个，故 $\mathrm{C}_3^2+\mathrm{C}_2^2=3+1=4$。$P=\dfrac{4}{10}=\dfrac{2}{5}$。

**Rubric**（满分 8）

- tot 总数 2：得 $\mathrm{C}_5^2=10$
- fav 有利 4：得有利 $4$ 种（两奇或两偶）
- p 概率 2：得 $\dfrac{2}{5}$

**作者自检**：C(3,2)+C(2,2)=4；4/10=2/5

---
