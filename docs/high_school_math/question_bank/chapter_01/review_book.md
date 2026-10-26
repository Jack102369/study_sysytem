# 第一章题库人工审核册（P1-0F-A）

> 由权威源 `hs-math-p1-0e-bank-items.ts` 自动生成。人工审核状态均为 PENDING。

修改题目请只改 TypeScript 源，再运行 `pnpm --filter api run hs-math:p1-0fa-verify`。

## 1.1

### HSMA-RJA-CH01-0001

- 小节：1.1
- 主知识点：rja.1.1.01
- 关联 KP：rja.1.1.01
- 题型：single　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

下列对象中，能构成集合的是

**选项**

- A. 某班成绩很好的同学
- B. 接近 $1$ 的实数
- C. 方程 $x^{2}-1=0$ 的实数根
- D. 个子较高的人

**标准答案**

```json
{
  "kind": "single",
  "optionId": "C"
}
```

**解析**

集合的元素必须具有确定性。方程 $x^{2}-1=0$ 的实数根是 $-1$ 与 $1$，对象明确。A、B、D 中“很好”“接近”“较高”含义不唯一，不能构成集合。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0002

- 小节：1.1
- 主知识点：rja.1.1.01
- 关联 KP：rja.1.1.01
- 题型：single　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

设 $A=\{1,2,3\}$，则下列正确的是

**选项**

- A. $1\subset A$
- B. $1\in A$
- C. $\{1\}\in A$
- D. $\{1,2\}\in A$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "B"
}
```

**解析**

元素与集合用 $\in$；集合与集合用 $\subseteq$ 或 $\subset$。$1$ 是 $A$ 的元素，故 $1\in A$。$\{1\}$ 是集合，应写作 $\{1\}\subseteq A$，不能写成 $\{1\}\in A$。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0003

- 小节：1.1
- 主知识点：rja.1.1.02
- 关联 KP：rja.1.1.02, rja.1.1.01
- 题型：single　难度：1
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_ENUM
- 校验方法：整数论域枚举 -2≤x<2
- 人工审核：PENDING

**题干**

用列举法表示集合 $\{x\in\mathbb{Z}\mid -2\le x<2\}$，正确的是（$\mathbb{Z}$ 表示整数集）

**选项**

- A. $\{-2,-1,0,1,2\}$
- B. $\{-2,-1,0,1\}$
- C. $\{-1,0,1\}$
- D. $\{-2,-1,0\}$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "B"
}
```

**解析**

条件为 $-2\le x<2$ 且 $x$ 为整数，故 $x=-2,-1,0,1$，写作 $\{-2,-1,0,1\}$。不含 $2$。

**复核说明**：{−2,−1,0,1}

---

### HSMA-RJA-CH01-0004

- 小节：1.1
- 主知识点：rja.1.1.02
- 关联 KP：rja.1.1.02
- 题型：single　难度：2
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

下列用描述法表示集合正确的是

**选项**

- A. $\{x\mid x^{2}=1\}$（未指明数集时默认在实数范围内讨论）
- B. $\{x\mid x$ 是较大的正整数$\}$
- C. $\{x\mid x$ 接近 $0\}$
- D. $\{x\mid x$ 是好看的图形$\}$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

高中默认在实数集讨论时，$x^{2}=1$ 的解为 $\pm 1$，属性确定。其余选项含模糊用语，不能作为集合的描述条件。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0005

- 小节：1.1
- 主知识点：rja.1.1.03
- 关联 KP：rja.1.1.03
- 题型：single　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

关于空集 $\varnothing$，正确的是

**选项**

- A. $\varnothing$ 不含任何元素
- B. $\varnothing=\{0\}$
- C. $\varnothing=\{\varnothing\}$
- D. $0\in\varnothing$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

空集是不含任何元素的集合。$\{0\}$ 含元素 $0$；$\{\varnothing\}$ 含元素 $\varnothing$，都不是空集。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0006

- 小节：1.1
- 主知识点：rja.1.1.01
- 关联 KP：rja.1.1.01
- 题型：single　难度：2
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

设 $A=\{a,b\}$，且 $a\ne b$。下列说法正确的是

**选项**

- A. $A$ 有 $2$ 个元素
- B. 若再写入 $a$，则 $A$ 有 $3$ 个元素
- C. 集合中元素可以重复计数
- D. $\{a,a,b\}$ 与 $A$ 元素个数不同

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

集合元素具有互异性：$\{a,a,b\}=\{a,b\}$，仍是 $2$ 个元素。不能因书写重复而增加元素个数。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0007

- 小节：1.1
- 主知识点：rja.1.1.02
- 关联 KP：rja.1.1.02, rja.1.1.01
- 题型：single　难度：2
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

常用数集中，$\mathbb{N}$、$\mathbb{Z}$、$\mathbb{Q}$、$\mathbb{R}$ 分别表示自然数集、整数集、有理数集、实数集。下列正确的是（本题约定 $\mathbb{N}$ 含 $0$）

**选项**

- A. $\mathbb{N}\subseteq\mathbb{Z}\subseteq\mathbb{Q}\subseteq\mathbb{R}$
- B. $\mathbb{R}\subseteq\mathbb{Q}$
- C. $\sqrt{2}\in\mathbb{Q}$
- D. $-3\in\mathbb{N}$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

在含 $0$ 的约定下，自然数都是整数，整数都是有理数，有理数都是实数，故包含链成立。$\sqrt{2}$ 不是有理数；$-3$ 不是自然数。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0008

- 小节：1.1
- 主知识点：rja.1.1.01
- 关联 KP：rja.1.1.01, rja.1.1.02
- 题型：single　难度：3
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

设集合 $A=\{x\mid x=2k+1,\,k\in\mathbb{Z}\}$（奇数集）。则 $-5\in A$ 的判断是

**选项**

- A. 正确
- B. 错误
- C. 无法判断
- D. 仅当 $k>0$ 时正确

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

取 $k=-3$，则 $2k+1=-5$，故 $-5\in A$。奇数集包含负奇数。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0009

- 小节：1.1
- 主知识点：rja.1.1.01
- 关联 KP：rja.1.1.01, rja.1.1.03
- 题型：multi　难度：2
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

下列可以作为集合的是（多选）

**选项**

- A. 小于 $10$ 的正整数
- B. 方程 $x^{2}+1=0$ 的实数根
- C. 著名的数学家
- D. 平面内到定点距离等于定长的点

**标准答案**

```json
{
  "kind": "multi",
  "optionIds": [
    "A",
    "B",
    "D"
  ]
}
```

**解析**

A：正整数 $1$ 到 $9$，确定。B：实数范围内无解，为空集，仍是集合。D：圆上的点，几何属性确定。C：“著名”不唯一，不能构成集合。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0010

- 小节：1.1
- 主知识点：rja.1.1.02
- 关联 KP：rja.1.1.02
- 题型：multi　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

关于集合表示法，正确的是（多选）

**选项**

- A. 列举法适合元素不多的集合
- B. 描述法用元素的共同属性刻画集合
- C. 无限集一定不能用列举法表示
- D. $\{1,2,3\}$ 是列举法

**标准答案**

```json
{
  "kind": "multi",
  "optionIds": [
    "A",
    "B",
    "D"
  ]
}
```

**解析**

列举法与描述法是基本表示法。无限集有时可写省略号列举（如正偶数），故 C 过绝对。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0011

- 小节：1.1
- 主知识点：rja.1.1.03
- 关联 KP：rja.1.1.03, rja.1.1.01
- 题型：multi　难度：2
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

设 $A=\{\varnothing\}$。下列正确的是（多选）

**选项**

- A. $\varnothing\in A$
- B. $\varnothing\subseteq A$
- C. $A=\varnothing$
- D. $A$ 含有 $1$ 个元素

**标准答案**

```json
{
  "kind": "multi",
  "optionIds": [
    "A",
    "B",
    "D"
  ]
}
```

**解析**

$A=\{\varnothing\}$ 的唯一元素是空集，故 $\varnothing\in A$，且 $|A|=1$。空集是任何集合的子集，故 $\varnothing\subseteq A$。但 $A$ 不是空集。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0012

- 小节：1.1
- 主知识点：rja.1.1.01
- 关联 KP：rja.1.1.01
- 题型：judge　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

集合 $\{1,2,3\}$ 与集合 $\{3,2,1\}$ 是同一个集合。

**标准答案**

```json
{
  "kind": "judge",
  "value": true
}
```

**解析**

集合元素具有无序性：只要元素完全相同，书写顺序不同仍表示同一个集合，因此两者相等。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0013

- 小节：1.1
- 主知识点：rja.1.1.03
- 关联 KP：rja.1.1.03
- 题型：judge　难度：2
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

空集是任何一个集合的元素。

**标准答案**

```json
{
  "kind": "judge",
  "value": false
}
```

**解析**

空集是任何一个集合的子集（$\varnothing\subseteq A$），但不一定是元素。例如 $1\notin\{1,2\}$ 同理，$\varnothing\notin\{1,2\}$。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0014

- 小节：1.1
- 主知识点：rja.1.1.02
- 关联 KP：rja.1.1.02
- 题型：judge　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

用描述法表示集合时，必须写清代表元素所属的范围（或约定默认范围）。

**标准答案**

```json
{
  "kind": "judge",
  "value": true
}
```

**解析**

描述法依赖属性与论域；论域不清会导致集合不明确。教材书写常写 $x\in\mathbb{R}$ 等。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0015

- 小节：1.1
- 主知识点：rja.1.1.01
- 关联 KP：rja.1.1.01
- 题型：numeric　难度：1
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_CALC
- 校验方法：独立计算期望=4
- 人工审核：PENDING

**题干**

集合 $\{2,4,6,8\}$ 的元素个数是

**标准答案**

```json
{
  "kind": "numeric",
  "value": "4",
  "toleranceAbs": 0,
  "toleranceRel": 0
}
```

**解析**

该集合含 $2,4,6,8$ 四个互不相同的元素，由元素互异性知其元素个数为 $4$。

**复核说明**：与题库 numeric 一致

---

### HSMA-RJA-CH01-0016

- 小节：1.1
- 主知识点：rja.1.1.02
- 关联 KP：rja.1.1.02, rja.1.1.01
- 题型：numeric　难度：2
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_CALC
- 校验方法：独立计算期望=5
- 人工审核：PENDING

**题干**

集合 $\{x\in\mathbb{Z}\mid 0<x\le 5\}$ 的元素个数是

**标准答案**

```json
{
  "kind": "numeric",
  "value": "5",
  "toleranceAbs": 0,
  "toleranceRel": 0
}
```

**解析**

正整数（本题由 $0<x$ 且整数得到）$1,2,3,4,5$，共 $5$ 个。

**复核说明**：与题库 numeric 一致

---

## 1.2

### HSMA-RJA-CH01-0017

- 小节：1.2
- 主知识点：rja.1.2.01
- 关联 KP：rja.1.2.01
- 题型：single　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

若 $A\subseteq B$，则下列一定正确的是

**选项**

- A. $A$ 的任意元素都属于 $B$
- B. $A$ 一定是 $B$ 的真子集
- C. $B\subseteq A$
- D. $A$ 与 $B$ 元素个数一定相等

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

$A\subseteq B$ 的定义是：$A$ 中任一元素都属于 $B$。真子集还需 $A\ne B$，故不一定是真子集。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0018

- 小节：1.2
- 主知识点：rja.1.2.01
- 关联 KP：rja.1.2.01
- 题型：single　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

设 $A=\{1,2\}$，$B=\{1,2,3\}$，则

**选项**

- A. $A\subsetneq B$（$A$ 是 $B$ 的真子集）
- B. $B\subseteq A$
- C. $A=B$
- D. $3\in A$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

$A$ 的元素都属于 $B$，且 $3\in B$ 但 $3\notin A$，故 $A$ 是 $B$ 的真子集。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0019

- 小节：1.2
- 主知识点：rja.1.2.02
- 关联 KP：rja.1.2.02
- 题型：single　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

集合 $A=B$ 的充要条件是

**选项**

- A. $A\subseteq B$ 且 $B\subseteq A$
- B. 仅 $A\subseteq B$
- C. 仅 $A$ 与 $B$ 元素个数相等
- D. $A\cap B=\varnothing$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

两集合相等的充要条件是互相包含。仅有 $A\subseteq B$ 不够；元素个数相等也不能保证元素相同。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0020

- 小节：1.2
- 主知识点：rja.1.2.01
- 关联 KP：rja.1.2.01, rja.1.1.03
- 题型：single　难度：2
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

下列说法正确的是

**选项**

- A. $\varnothing\subseteq\{1\}$
- B. $\varnothing\in\{1\}$
- C. $\{\varnothing\}=\varnothing$
- D. $1\subseteq\{1\}$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

空集是任何集合的子集。$\varnothing$ 不是 $\{1\}$ 的元素；$\{\varnothing\}$ 非空；$1$ 是元素不是集合，不能写 $1\subseteq\{1\}$。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0021

- 小节：1.2
- 主知识点：rja.1.2.01
- 关联 KP：rja.1.2.01
- 题型：single　难度：2
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_CALC
- 校验方法：2^n 公式独立计算=8
- 人工审核：PENDING

**题干**

设集合 $A$ 含有 $3$ 个元素，则 $A$ 的子集个数是

**选项**

- A. $3$
- B. $6$
- C. $8$
- D. $9$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "C"
}
```

**解析**

含 $n$ 个元素的集合有 $2^{n}$ 个子集。$n=3$ 时为 $2^{3}=8$（含空集与自身）。

**复核说明**：选项与计算一致

---

### HSMA-RJA-CH01-0022

- 小节：1.2
- 主知识点：rja.1.2.01
- 关联 KP：rja.1.2.01
- 题型：single　难度：2
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_CALC
- 校验方法：2^n 公式独立计算=7
- 人工审核：PENDING

**题干**

设集合 $A$ 含有 $3$ 个元素，则 $A$ 的真子集个数是

**选项**

- A. $7$
- B. $8$
- C. $6$
- D. $3$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

真子集是不等于自身的子集，个数为 $2^{n}-1$。$n=3$ 时为 $7$。

**复核说明**：选项与计算一致

---

### HSMA-RJA-CH01-0023

- 小节：1.2
- 主知识点：rja.1.2.01
- 关联 KP：rja.1.2.01, rja.1.2.02
- 题型：single　难度：2
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_CALC
- 校验方法：2^n 公式独立计算=2
- 人工审核：PENDING

**题干**

若 $\{1,2\}\subseteq A\subseteq\{1,2,3\}$，则集合 $A$ 的可能情况种数是

**选项**

- A. $1$
- B. $2$
- C. $3$
- D. $4$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "B"
}
```

**解析**

$A$ 必须含 $1,2$，对 $3$ 可取可不取，故 $A=\{1,2\}$ 或 $\{1,2,3\}$，共 $2$ 种。

**复核说明**：选项与计算一致

---

### HSMA-RJA-CH01-0024

- 小节：1.2
- 主知识点：rja.1.2.02
- 关联 KP：rja.1.2.02, rja.1.1.02
- 题型：single　难度：3
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_ENUM
- 校验方法：有限整数试根枚举（二次因式）
- 人工审核：PENDING

**题干**

设 $A=\{x\mid x^{2}-3x+2=0\}$，$B=\{1,2\}$，则

**选项**

- A. $A=B$
- B. $A\subsetneq B$
- C. $B\subsetneq A$
- D. $A\cap B=\varnothing$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

$x^{2}-3x+2=(x-1)(x-2)=0$，得 $x=1$ 或 $2$，故 $A=\{1,2\}=B$。

**复核说明**：A=B={1,2}

---

### HSMA-RJA-CH01-0025

- 小节：1.2
- 主知识点：rja.1.2.01
- 关联 KP：rja.1.2.01
- 题型：multi　难度：2
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

设 $A=\{a\}$。下列正确的是（多选）

**选项**

- A. $\varnothing\subseteq A$
- B. $A\subseteq A$
- C. $\{a\}\subseteq A$
- D. $a\subseteq A$

**标准答案**

```json
{
  "kind": "multi",
  "optionIds": [
    "A",
    "B",
    "C"
  ]
}
```

**解析**

任何集合是自身的子集；空集是子集；$\{a\}=A$ 故也成立。$a$ 是元素，不能写 $a\subseteq A$。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0026

- 小节：1.2
- 主知识点：rja.1.2.02
- 关联 KP：rja.1.2.01, rja.1.2.02
- 题型：multi　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

下列关系正确的是（多选）

**选项**

- A. $\{1\}\subseteq\{1,2\}$
- B. $\{1,2\}=\{2,1\}$
- C. $\{1\}\in\{1,2\}$
- D. $1\in\{1,2\}$

**标准答案**

```json
{
  "kind": "multi",
  "optionIds": [
    "A",
    "B",
    "D"
  ]
}
```

**解析**

子集与相等成立；$1$ 属于该集合。但 $\{1\}$ 不是 $\{1,2\}$ 的元素，C 错误。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0027

- 小节：1.2
- 主知识点：rja.1.2.01
- 关联 KP：rja.1.2.01
- 题型：multi　难度：3
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

设 $A=\{1,2,3\}$。下列是 $A$ 的真子集的是（多选）

**选项**

- A. $\varnothing$
- B. $\{1,2\}$
- C. $\{1,2,3\}$
- D. $\{2\}$

**标准答案**

```json
{
  "kind": "multi",
  "optionIds": [
    "A",
    "B",
    "D"
  ]
}
```

**解析**

真子集不能等于自身，故排除 C。空集与真子集 $\{1,2\}$、$\{2\}$ 均正确。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0028

- 小节：1.2
- 主知识点：rja.1.2.02
- 关联 KP：rja.1.2.02
- 题型：judge　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

若 $A\subseteq B$ 且 $B\subseteq A$，则 $A=B$。

**标准答案**

```json
{
  "kind": "judge",
  "value": true
}
```

**解析**

互相包含正是集合相等的定义：一边包含保证元素关系，两边同时成立则两集合相同。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0029

- 小节：1.2
- 主知识点：rja.1.2.01
- 关联 KP：rja.1.2.01, rja.1.1.03
- 题型：judge　难度：1
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_CALC
- 校验方法：2^0-1=0
- 人工审核：PENDING

**题干**

空集没有真子集。

**标准答案**

```json
{
  "kind": "judge",
  "value": true
}
```

**解析**

空集的子集只有它自身，真子集个数为 $2^{0}-1=0$，因此空集没有真子集。

**复核说明**：空集无真子集

---

### HSMA-RJA-CH01-0030

- 小节：1.2
- 主知识点：rja.1.2.01
- 关联 KP：rja.1.2.01
- 题型：numeric　难度：1
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_CALC
- 校验方法：独立计算期望=4
- 人工审核：PENDING

**题干**

集合 $\{a,b\}$（$a\ne b$）的子集个数是

**标准答案**

```json
{
  "kind": "numeric",
  "value": "4",
  "toleranceAbs": 0,
  "toleranceRel": 0
}
```

**解析**

元素个数 $n=2$，子集个数为 $2^{2}=4$，分别是 $\varnothing,\{a\},\{b\},\{a,b\}$。

**复核说明**：与题库 numeric 一致

---

### HSMA-RJA-CH01-0031

- 小节：1.2
- 主知识点：rja.1.2.01
- 关联 KP：rja.1.2.01
- 题型：numeric　难度：1
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_CALC
- 校验方法：独立计算期望=15
- 人工审核：PENDING

**题干**

集合 $\{1,2,3,4\}$ 的真子集个数是

**标准答案**

```json
{
  "kind": "numeric",
  "value": "15",
  "toleranceAbs": 0,
  "toleranceRel": 0
}
```

**解析**

元素个数 $n=4$，真子集个数为 $2^{4}-1=15$（去掉集合自身）。

**复核说明**：与题库 numeric 一致

---

### HSMA-RJA-CH01-0032

- 小节：1.2
- 主知识点：rja.1.2.01
- 关联 KP：rja.1.2.01, rja.1.2.02
- 题型：numeric　难度：3
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_CALC
- 校验方法：独立计算期望=4
- 人工审核：PENDING

**题干**

若集合 $A$ 的子集共有 $16$ 个，则 $A$ 的元素个数是

**标准答案**

```json
{
  "kind": "numeric",
  "value": "4",
  "toleranceAbs": 0,
  "toleranceRel": 0
}
```

**解析**

由子集个数公式 $2^{n}=16$，解得元素个数 $n=4$。

**复核说明**：与题库 numeric 一致

---

## 1.3

### HSMA-RJA-CH01-0033

- 小节：1.3
- 主知识点：rja.1.3.01
- 关联 KP：rja.1.3.01
- 题型：single　难度：1
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_ENUM
- 校验方法：有限并集枚举
- 人工审核：PENDING

**题干**

设 $A=\{1,2,3\}$，$B=\{2,3,4\}$，则 $A\cup B=$

**选项**

- A. $\{2,3\}$
- B. $\{1,2,3,4\}$
- C. $\{1,4\}$
- D. $\varnothing$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "B"
}
```

**解析**

并集由属于 $A$ 或属于 $B$ 的全部元素组成，枚举得 $\{1,2,3,4\}$。

**复核说明**：A∪B={1,2,3,4}

---

### HSMA-RJA-CH01-0034

- 小节：1.3
- 主知识点：rja.1.3.02
- 关联 KP：rja.1.3.02
- 题型：single　难度：1
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_ENUM
- 校验方法：有限交集枚举
- 人工审核：PENDING

**题干**

设 $A=\{1,2,3\}$，$B=\{2,3,4\}$，则 $A\cap B=$

**选项**

- A. $\{1,2,3,4\}$
- B. $\{2,3\}$
- C. $\{1,4\}$
- D. $\{1,2,3\}$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "B"
}
```

**解析**

交集由同时属于 $A$ 与 $B$ 的元素组成，公共元素为 $2,3$，故为 $\{2,3\}$。

**复核说明**：A∩B={2,3}

---

### HSMA-RJA-CH01-0035

- 小节：1.3
- 主知识点：rja.1.3.03
- 关联 KP：rja.1.3.03
- 题型：single　难度：1
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_ENUM
- 校验方法：有限补集枚举
- 人工审核：PENDING

**题干**

设全集 $U=\{1,2,3,4,5\}$，$A=\{1,2,3\}$，则 $\complement_{U}A=$

**选项**

- A. $\{1,2,3\}$
- B. $\{4,5\}$
- C. $\{3,4,5\}$
- D. $\varnothing$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "B"
}
```

**解析**

在给定全集 $U$ 下，补集是 $U$ 中不属于 $A$ 的元素，因此为 $\{4,5\}$。

**复核说明**：∁UA={4,5}

---

### HSMA-RJA-CH01-0036

- 小节：1.3
- 主知识点：rja.1.3.02
- 关联 KP：rja.1.3.02, rja.1.3.04
- 题型：single　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

设 $A=\{x\mid x>1\}$，$B=\{x\mid x\le 3\}$（$x\in\mathbb{R}$），则 $A\cap B=$

**选项**

- A. $\{x\mid 1<x\le 3\}$
- B. $\{x\mid x>1\}$
- C. $\{x\mid x\le 3\}$
- D. $\{x\mid x>3\}$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

交集需同时满足 $x>1$ 与 $x\le 3$，合取后得到 $1<x\le 3$。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0037

- 小节：1.3
- 主知识点：rja.1.3.01
- 关联 KP：rja.1.3.01, rja.1.3.04
- 题型：single　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

设 $A=\{x\mid x<2\}$，$B=\{x\mid x\ge 0\}$（$x\in\mathbb{R}$），则 $A\cup B=$

**选项**

- A. $\mathbb{R}$
- B. $\{x\mid 0\le x<2\}$
- C. $\{x\mid x<0\}$
- D. $\varnothing$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

小于 $2$ 的实数与不小于 $0$ 的实数并起来覆盖全体实数，故为 $\mathbb{R}$。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0038

- 小节：1.3
- 主知识点：rja.1.3.03
- 关联 KP：rja.1.3.03
- 题型：single　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

设全集 $U=\mathbb{R}$，$A=\{x\mid x\le 1\}$，则 $\complement_{U}A=$

**选项**

- A. $\{x\mid x>1\}$
- B. $\{x\mid x\ge 1\}$
- C. $\{x\mid x<1\}$
- D. $\{x\mid x\le 1\}$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

补集为不满足 $x\le 1$ 的实数，即 $x>1$。注意端点：$1\in A$，故 $1$ 不在补集中。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0039

- 小节：1.3
- 主知识点：rja.1.3.02
- 关联 KP：rja.1.3.02, rja.1.2.01
- 题型：single　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

设 $A\cap B=A$，则一定有

**选项**

- A. $A\subseteq B$
- B. $B\subseteq A$
- C. $A=B$
- D. $A\cup B=A$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

$A\cap B=A$ 等价于 $A$ 的元素都属于 $B$，即 $A\subseteq B$。由该式不能推出 $A=B$。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0040

- 小节：1.3
- 主知识点：rja.1.3.01
- 关联 KP：rja.1.3.01, rja.1.2.01
- 题型：single　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

设 $A\cup B=A$，则一定有

**选项**

- A. $B\subseteq A$
- B. $A\subseteq B$
- C. $A\cap B=\varnothing$
- D. $A=B$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

$A\cup B=A$ 等价于 $B$ 的元素都属于 $A$，即 $B\subseteq A$。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0041

- 小节：1.3
- 主知识点：rja.1.3.04
- 关联 KP：rja.1.3.03, rja.1.3.04, rja.1.3.01
- 题型：single　难度：3
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_ENUM
- 校验方法：并后补集枚举
- 人工审核：PENDING

**题干**

设全集 $U=\{1,2,3,4,5,6\}$，$A=\{1,3,5\}$，$B=\{1,2,3\}$，则 $\complement_{U}(A\cup B)=$

**选项**

- A. $\{4,6\}$
- B. $\{2,4,6\}$
- C. $\{4,5,6\}$
- D. $\{6\}$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

$A\cup B=\{1,2,3,5\}$，在 $U$ 中的补集为 $\{4,6\}$。

**复核说明**：{4,6}

---

### HSMA-RJA-CH01-0042

- 小节：1.3
- 主知识点：rja.1.3.04
- 关联 KP：rja.1.3.04, rja.1.3.02, rja.1.3.03
- 题型：single　难度：3
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_ENUM
- 校验方法：补交综合枚举
- 人工审核：PENDING

**题干**

设全集 $U=\{a,b,c,d\}$，$A=\{a,b\}$，$B=\{b,c\}$，则 $(\complement_{U}A)\cap B=$

**选项**

- A. $\{c\}$
- B. $\{b,c\}$
- C. $\{a\}$
- D. $\varnothing$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

$\complement_{U}A=\{c,d\}$，与 $B=\{b,c\}$ 交得 $\{c\}$。

**复核说明**：{c}

---

### HSMA-RJA-CH01-0043

- 小节：1.3
- 主知识点：rja.1.3.01
- 关联 KP：rja.1.3.01, rja.1.3.02
- 题型：multi　难度：1
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_ENUM
- 校验方法：逐项枚举真假
- 人工审核：PENDING

**题干**

设 $A=\{1,2\}$，$B=\{2,3\}$。正确的是（多选）

**选项**

- A. $2\in A\cup B$
- B. $2\in A\cap B$
- C. $1\in A\cap B$
- D. $3\in A\cup B$

**标准答案**

```json
{
  "kind": "multi",
  "optionIds": [
    "A",
    "B",
    "D"
  ]
}
```

**解析**

$A\cup B=\{1,2,3\}$，$A\cap B=\{2\}$。故 $1$ 不在交集中。

**复核说明**：A/B/D 真，C 假

---

### HSMA-RJA-CH01-0044

- 小节：1.3
- 主知识点：rja.1.3.03
- 关联 KP：rja.1.3.03
- 题型：multi　难度：2
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_ENUM
- 校验方法：补集逐项枚举
- 人工审核：PENDING

**题干**

设全集 $U=\{1,2,3,4\}$，$A=\{1,2\}$。正确的是（多选）

**选项**

- A. $3\in\complement_{U}A$
- B. $1\notin\complement_{U}A$
- C. $\complement_{U}A=\{3,4\}$
- D. $\complement_{U}A=\{2,3,4\}$

**标准答案**

```json
{
  "kind": "multi",
  "optionIds": [
    "A",
    "B",
    "C"
  ]
}
```

**解析**

$\complement_{U}A=\{3,4\}$，$1\in A$ 故不属于补集。

**复核说明**：A/B/C

---

### HSMA-RJA-CH01-0045

- 小节：1.3
- 主知识点：rja.1.3.02
- 关联 KP：rja.1.3.01, rja.1.3.02, rja.1.1.03
- 题型：multi　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

下列运算恒成立的是（多选；对任意集合 $A,B$）

**选项**

- A. $A\cap B=B\cap A$
- B. $A\cup B=B\cup A$
- C. $A\cap\varnothing=\varnothing$
- D. $A\cup\varnothing=\varnothing$

**标准答案**

```json
{
  "kind": "multi",
  "optionIds": [
    "A",
    "B",
    "C"
  ]
}
```

**解析**

交、并满足交换律；任意集合与空集的交仍为空集。并上空集应得到原集合 $A$，故 D 错误。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0046

- 小节：1.3
- 主知识点：rja.1.3.04
- 关联 KP：rja.1.3.04, rja.1.3.01, rja.1.3.02
- 题型：multi　难度：3
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_ENUM
- 校验方法：交并综合枚举
- 人工审核：PENDING

**题干**

设 $A=\{1,2,3,4\}$，$B=\{3,4,5\}$。正确的是（多选）

**选项**

- A. $A\cup B=\{1,2,3,4,5\}$
- B. $A\cap B=\{3,4\}$
- C. $(A\cup B)\cap A=A$
- D. $A\cap B=A$

**标准答案**

```json
{
  "kind": "multi",
  "optionIds": [
    "A",
    "B",
    "C"
  ]
}
```

**解析**

并、交直接计算得 A、B。$(A\cup B)\cap A=A$ 恒成立。$A\cap B\ne A$。

**复核说明**：A/B/C

---

### HSMA-RJA-CH01-0047

- 小节：1.3
- 主知识点：rja.1.3.01
- 关联 KP：rja.1.3.01, rja.1.3.02
- 题型：judge　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

对任意集合 $A$，都有 $A\cup A=A$ 且 $A\cap A=A$。

**标准答案**

```json
{
  "kind": "judge",
  "value": true
}
```

**解析**

并、交满足幂等律：集合与自身取并或取交，结果仍是原来的集合 $A$。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0048

- 小节：1.3
- 主知识点：rja.1.3.03
- 关联 KP：rja.1.3.03
- 题型：judge　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

若全集为 $U$，则 $\complement_{U}(\complement_{U}A)=A$。

**标准答案**

```json
{
  "kind": "judge",
  "value": true
}
```

**解析**

在同一全集下，补集运算具有对合性：对补集再取补，回到原集合 $A$。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0049

- 小节：1.3
- 主知识点：rja.1.3.01
- 关联 KP：rja.1.3.01
- 题型：numeric　难度：1
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_CALC
- 校验方法：独立计算期望=4
- 人工审核：PENDING

**题干**

设 $A=\{1,2,3\}$，$B=\{3,4\}$，则 $A\cup B$ 的元素个数是

**标准答案**

```json
{
  "kind": "numeric",
  "value": "4",
  "toleranceAbs": 0,
  "toleranceRel": 0
}
```

**解析**

先求并集 $A\cup B=\{1,2,3,4\}$，其中互异元素共 $4$ 个。

**复核说明**：与题库 numeric 一致

---

### HSMA-RJA-CH01-0050

- 小节：1.3
- 主知识点：rja.1.3.02
- 关联 KP：rja.1.3.02
- 题型：numeric　难度：1
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_CALC
- 校验方法：独立计算期望=2
- 人工审核：PENDING

**题干**

设 $A=\{1,2,3,4\}$，$B=\{2,4,6\}$，则 $A\cap B$ 的元素个数是

**标准答案**

```json
{
  "kind": "numeric",
  "value": "2",
  "toleranceAbs": 0,
  "toleranceRel": 0
}
```

**解析**

先求交集 $A\cap B=\{2,4\}$，公共元素共 $2$ 个。

**复核说明**：与题库 numeric 一致

---

### HSMA-RJA-CH01-0051

- 小节：1.3
- 主知识点：rja.1.3.03
- 关联 KP：rja.1.3.03
- 题型：numeric　难度：1
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_CALC
- 校验方法：独立计算期望=4
- 人工审核：PENDING

**题干**

设全集 $U=\{1,2,3,4,5,6,7,8\}$，$A=\{2,4,6,8\}$，则 $\complement_{U}A$ 的元素个数是

**标准答案**

```json
{
  "kind": "numeric",
  "value": "4",
  "toleranceAbs": 0,
  "toleranceRel": 0
}
```

**解析**

$U$ 中去掉 $A$ 的偶数后剩奇数 $\{1,3,5,7\}$，元素个数为 $4$。

**复核说明**：与题库 numeric 一致

---

### HSMA-RJA-CH01-0052

- 小节：1.3
- 主知识点：rja.1.3.04
- 关联 KP：rja.1.3.04, rja.1.3.01, rja.1.3.02
- 题型：numeric　难度：3
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_CALC
- 校验方法：独立计算期望=5
- 人工审核：PENDING

**题干**

设 $A=\{1,2,3,4,5\}$，$B=\{4,5,6,7\}$，则属于 $A\cup B$ 但不属于 $A\cap B$ 的元素个数是

**标准答案**

```json
{
  "kind": "numeric",
  "value": "5",
  "toleranceAbs": 0,
  "toleranceRel": 0
}
```

**解析**

$A\cup B=\{1,2,3,4,5,6,7\}$（$7$ 个），$A\cap B=\{4,5\}$（$2$ 个），对称差元素个数为 $7-2=5$。

**复核说明**：与题库 numeric 一致

---

## 1.4

### HSMA-RJA-CH01-0053

- 小节：1.4
- 主知识点：rja.1.4.01
- 关联 KP：rja.1.4.01
- 题型：single　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

已知 $p\Rightarrow q$。就“充分条件”而言，正确的是

**选项**

- A. $p$ 是 $q$ 的充分条件
- B. $p$ 是 $q$ 的必要条件
- C. $q$ 是 $p$ 的充分条件
- D. $p$ 与 $q$ 互为充要条件

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

由定义：若 $p\Rightarrow q$，则称 $p$ 是 $q$ 的充分条件；同时 $q$ 是 $p$ 的必要条件，但本题问充分条件对应项。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0054

- 小节：1.4
- 主知识点：rja.1.4.02
- 关联 KP：rja.1.4.02
- 题型：single　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

已知 $p\Rightarrow q$。就“必要条件”而言，正确的是

**选项**

- A. $q$ 是 $p$ 的必要条件
- B. $q$ 是 $p$ 的充分条件
- C. $p$ 是 $q$ 的必要条件
- D. $p\Leftrightarrow q$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

由 $p\Rightarrow q$ 的定义可知：$q$ 是 $p$ 成立的必要条件，不能把充分与必要的方向弄反。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0055

- 小节：1.4
- 主知识点：rja.1.4.01
- 关联 KP：rja.1.4.01, rja.1.4.02
- 题型：single　难度：1
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_LOGIC
- 校验方法：充分必要双向检验（反例 x=-1）
- 人工审核：PENDING

**题干**

“$x=1$”是“$x^{2}=1$”的

**选项**

- A. 充分不必要条件
- B. 必要不充分条件
- C. 充要条件
- D. 既不充分也不必要条件

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

若 $x=1$，则 $x^{2}=1$，充分。但 $x^{2}=1$ 时还可能 $x=-1$，故不必要。

**复核说明**：充分不必要

---

### HSMA-RJA-CH01-0056

- 小节：1.4
- 主知识点：rja.1.4.01
- 关联 KP：rja.1.4.01
- 题型：single　难度：2
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_LOGIC
- 校验方法：不等式蕴含 + 反例 x=1.5
- 人工审核：PENDING

**题干**

“$x>2$”是“$x>1$”的（$x\in\mathbb{R}$）

**选项**

- A. 充分不必要条件
- B. 必要不充分条件
- C. 充要条件
- D. 既不充分也不必要条件

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

由 $x>2$ 可推出 $x>1$，充分。但 $x=1.5$ 满足 $x>1$ 却不满足 $x>2$，故不必要。

**复核说明**：充分不必要

---

### HSMA-RJA-CH01-0057

- 小节：1.4
- 主知识点：rja.1.4.02
- 关联 KP：rja.1.4.02
- 题型：single　难度：2
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_LOGIC
- 校验方法：逆命题检验
- 人工审核：PENDING

**题干**

“$x>1$”是“$x>2$”的（$x\in\mathbb{R}$）

**选项**

- A. 必要不充分条件
- B. 充分不必要条件
- C. 充要条件
- D. 既不充分也不必要条件

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

若 $x>2$ 则必有 $x>1$，故“$x>1$”是必要的；但 $x>1$ 推不出 $x>2$，故不充分。

**复核说明**：必要不充分

---

### HSMA-RJA-CH01-0058

- 小节：1.4
- 主知识点：rja.1.4.01
- 关联 KP：rja.1.4.01, rja.1.4.02
- 题型：single　难度：2
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

“四边形是正方形”是“四边形是矩形”的

**选项**

- A. 充分不必要条件
- B. 必要不充分条件
- C. 充要条件
- D. 既不充分也不必要条件

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

正方形一定是矩形，故充分；矩形未必是正方形，故不必要。因此是充分不必要条件。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0059

- 小节：1.4
- 主知识点：rja.1.4.03
- 关联 KP：rja.1.4.03
- 题型：single　难度：2
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_LOGIC
- 校验方法：实数平方零点充要
- 人工审核：PENDING

**题干**

设 $x\in\mathbb{R}$。“$x^{2}=0$”是“$x=0$”的

**选项**

- A. 充要条件
- B. 充分不必要条件
- C. 必要不充分条件
- D. 既不充分也不必要条件

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

在实数范围内，$x^{2}=0\Leftrightarrow x=0$，互为充要条件。

**复核说明**：充要

---

### HSMA-RJA-CH01-0060

- 小节：1.4
- 主知识点：rja.1.4.01
- 关联 KP：rja.1.4.01, rja.1.4.03
- 题型：single　难度：3
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

“$a>0$ 且 $b>0$”是“$ab>0$”的（$a,b\in\mathbb{R}$）

**选项**

- A. 充分不必要条件
- B. 必要不充分条件
- C. 充要条件
- D. 既不充分也不必要条件

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

两正数乘积为正，充分。但 $a=-1,b=-2$ 时 $ab>0$ 却不满足同为正，故不必要。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0061

- 小节：1.4
- 主知识点：rja.1.4.03
- 关联 KP：rja.1.4.01, rja.1.4.02, rja.1.4.03
- 题型：multi　难度：2
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

下列说法正确的是（多选）

**选项**

- A. 若 $p\Rightarrow q$，则 $p$ 是 $q$ 的充分条件
- B. 若 $p\Rightarrow q$，则 $q$ 是 $p$ 的必要条件
- C. 若 $p\Leftrightarrow q$，则 $p$ 是 $q$ 的充要条件
- D. 充分条件一定是必要条件

**标准答案**

```json
{
  "kind": "multi",
  "optionIds": [
    "A",
    "B",
    "C"
  ]
}
```

**解析**

A、B、C 均符合充分、必要、充要的定义。充分条件不必同时是必要条件，故 D 错误。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0062

- 小节：1.4
- 主知识点：rja.1.4.01
- 关联 KP：rja.1.4.01
- 题型：multi　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

设 $x\in\mathbb{R}$。下列中，“$x>0$”是“$x\ge 0$”的（多选表述正确项）

**选项**

- A. 充分条件
- B. 必要条件
- C. 充分不必要条件
- D. 充要条件

**标准答案**

```json
{
  "kind": "multi",
  "optionIds": [
    "A",
    "C"
  ]
}
```

**解析**

$x>0\Rightarrow x\ge 0$，故充分；但 $x=0$ 使后者真前者假，故不必要。因此也是充分不必要。B、D 错误。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0063

- 小节：1.4
- 主知识点：rja.1.4.02
- 关联 KP：rja.1.4.02
- 题型：multi　难度：2
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_LOGIC
- 校验方法：必要条件定义 q⇒p 逐组检验
- 人工审核：PENDING

**题干**

下列各组中，$p$ 是 $q$ 的必要条件的是（多选；设 $x\in\mathbb{R}$）

**选项**

- A. $p:x>1$；$q:x>2$
- B. $p:x=1$；$q:x^{2}=1$
- C. $p:x\ge 2$；$q:x>2$
- D. $p:x^{2}\ge 0$；$q:x=1$

**标准答案**

```json
{
  "kind": "multi",
  "optionIds": [
    "A",
    "C",
    "D"
  ]
}
```

**解析**

若 $q\Rightarrow p$，则 $p$ 是 $q$ 的必要条件。A：$x>2\Rightarrow x>1$。C：$x>2\Rightarrow x\ge 2$。D：$x=1\Rightarrow x^{2}\ge 0$。B：$x^{2}=1$ 推不出 $x=1$，故不是必要条件。

**复核说明**：A/C/D

---

### HSMA-RJA-CH01-0064

- 小节：1.4
- 主知识点：rja.1.4.03
- 关联 KP：rja.1.4.03
- 题型：multi　难度：3
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_LOGIC
- 校验方法：充要双向检验
- 人工审核：PENDING

**题干**

设 $x\in\mathbb{R}$。下列中 $p$ 是 $q$ 的充要条件的是（多选）

**选项**

- A. $p:x=2$；$q:|x|=2$
- B. $p:x-1=0$；$q:x=1$
- C. $p:x^{2}=4$；$q:|x|=2$
- D. $p:x>1$；$q:x\ge 1$

**标准答案**

```json
{
  "kind": "multi",
  "optionIds": [
    "B",
    "C"
  ]
}
```

**解析**

B：显然等价。C：在实数内 $x^{2}=4\Leftrightarrow |x|=2$。A：$|x|=2$ 含 $x=-2$，不等价。D：一方更强，非充要。

**复核说明**：B/C

---

### HSMA-RJA-CH01-0065

- 小节：1.4
- 主知识点：rja.1.4.02
- 关联 KP：rja.1.4.01, rja.1.4.02
- 题型：judge　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

若 $p$ 是 $q$ 的充分条件，则 $q$ 一定是 $p$ 的必要条件。

**标准答案**

```json
{
  "kind": "judge",
  "value": true
}
```

**解析**

“$p$ 是 $q$ 的充分条件”即 $p\Rightarrow q$，这同时意味着“$q$ 是 $p$ 的必要条件”。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0066

- 小节：1.4
- 主知识点：rja.1.4.03
- 关联 KP：rja.1.4.03
- 题型：judge　难度：2
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_LOGIC
- 校验方法：反例 a=-b
- 人工审核：PENDING

**题干**

“$a=b$”是“$a^{2}=b^{2}$”的充要条件（$a,b\in\mathbb{R}$）。

**标准答案**

```json
{
  "kind": "judge",
  "value": false
}
```

**解析**

由 $a=b$ 可得 $a^{2}=b^{2}$（充分），但由 $a^{2}=b^{2}$ 可能 $a=-b\ne b$，故不必要，不是充要。

**复核说明**：非充要

---

### HSMA-RJA-CH01-0067

- 小节：1.4
- 主知识点：rja.1.4.01
- 关联 KP：rja.1.4.01
- 题型：judge　难度：2
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

“两个三角形全等”是“两个三角形面积相等”的充分不必要条件。

**标准答案**

```json
{
  "kind": "judge",
  "value": true
}
```

**解析**

全等的三角形面积一定相等，故充分；面积相等未必全等，故不必要。结论成立。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0068

- 小节：1.4
- 主知识点：rja.1.4.01
- 关联 KP：rja.1.4.01, rja.1.4.03
- 题型：numeric　难度：2
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_CALC
- 校验方法：独立计算期望=3
- 人工审核：PENDING

**题干**

在实数范围内，使命题“若 $x>a$，则 $x>3$”对一切实数 $x$ 恒成立。满足条件的实数 $a$ 的最小值是

**标准答案**

```json
{
  "kind": "numeric",
  "value": "3",
  "toleranceAbs": 0,
  "toleranceRel": 0
}
```

**解析**

“$x>a\Rightarrow x>3$”对一切 $x$ 成立，当且仅当 $a\ge 3$。若 $a<3$，取 $x$ 满足 $a<x\le 3$，则前提真结论假。故最小值为 $3$。

**复核说明**：与题库 numeric 一致

---

## 1.5

### HSMA-RJA-CH01-0069

- 小节：1.5
- 主知识点：rja.1.5.01
- 关联 KP：rja.1.5.01
- 题型：single　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

命题“$\forall x\in\mathbb{R},\,x^{2}\ge 0$”是

**选项**

- A. 真命题
- B. 假命题
- C. 无法判断
- D. 条件命题

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

任意实数的平方都大于或等于 $0$，因此该全称量词命题为真命题。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0070

- 小节：1.5
- 主知识点：rja.1.5.02
- 关联 KP：rja.1.5.02
- 题型：single　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

命题“$\exists x\in\mathbb{R},\,x^{2}+1=0$”是

**选项**

- A. 假命题
- B. 真命题
- C. 无法判断
- D. 与量词无关

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

在实数集上 $x^{2}+1\ge 1>0$，方程无实根，故存在量词命题为假。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0071

- 小节：1.5
- 主知识点：rja.1.5.03
- 关联 KP：rja.1.5.03, rja.1.5.01
- 题型：single　难度：2
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_LOGIC
- 校验方法：全称否定：∃ + 谓词否定
- 人工审核：PENDING

**题干**

命题“$\forall x\in\mathbb{R},\,x>0$”的否定是

**选项**

- A. $\exists x\in\mathbb{R},\,x\le 0$
- B. $\forall x\in\mathbb{R},\,x\le 0$
- C. $\exists x\in\mathbb{R},\,x>0$
- D. $\forall x\in\mathbb{R},\,x<0$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

否定全称命题时，把 $\forall$ 改为 $\exists$，并把结论 $x>0$ 否定为 $x\le 0$。

**复核说明**：否定正确

---

### HSMA-RJA-CH01-0072

- 小节：1.5
- 主知识点：rja.1.5.03
- 关联 KP：rja.1.5.03, rja.1.5.02
- 题型：single　难度：2
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_LOGIC
- 校验方法：存在否定：∀ + 谓词否定
- 人工审核：PENDING

**题干**

命题“$\exists x\in\mathbb{Z},\,x^{2}=2$”的否定是

**选项**

- A. $\forall x\in\mathbb{Z},\,x^{2}\ne 2$
- B. $\exists x\in\mathbb{Z},\,x^{2}\ne 2$
- C. $\forall x\in\mathbb{Z},\,x^{2}=2$
- D. $\exists x\in\mathbb{R},\,x^{2}=2$

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

否定存在命题时，把 $\exists$ 改为 $\forall$，并否定结论，得到任意整数都满足 $x^{2}\ne 2$。

**复核说明**：否定正确

---

### HSMA-RJA-CH01-0073

- 小节：1.5
- 主知识点：rja.1.5.02
- 关联 KP：rja.1.5.02, rja.1.5.01
- 题型：single　难度：2
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

下列为真命题的是

**选项**

- A. $\exists x\in\mathbb{R},\,x^{2}-2x+1=0$
- B. $\forall x\in\mathbb{R},\,x^{2}-2x+1=0$
- C. $\exists x\in\mathbb{R},\,x^{2}+1=0$
- D. $\forall x\in\mathbb{N},\,x<0$（$\mathbb{N}$ 含 $0$）

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

$x^{2}-2x+1=(x-1)^{2}=0$ 有实根 $x=1$，存在性为真。其余全称或存在命题均假。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0074

- 小节：1.5
- 主知识点：rja.1.5.01
- 关联 KP：rja.1.5.01
- 题型：single　难度：3
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_ENUM
- 校验方法：有限论域全称枚举
- 人工审核：PENDING

**题干**

命题“$\forall x\in\{1,2,3\},\,x\le 3$”是

**选项**

- A. 真命题
- B. 假命题
- C. 无法判断
- D. 否定后仍真

**标准答案**

```json
{
  "kind": "single",
  "optionId": "A"
}
```

**解析**

论域只有 $1,2,3$，逐个检验均有 $x\le 3$，故全称命题为真。

**复核说明**：全真

---

### HSMA-RJA-CH01-0075

- 小节：1.5
- 主知识点：rja.1.5.01
- 关联 KP：rja.1.5.01, rja.1.5.02
- 题型：multi　难度：2
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_LOGIC
- 校验方法：B/C/D 有限检验 + A 绝对值非负逻辑
- 人工审核：PENDING

**题干**

下列命题为真的是（多选）

**选项**

- A. $\forall x\in\mathbb{R},\,|x|\ge 0$
- B. $\exists x\in\mathbb{Z},\,2x=5$
- C. $\exists x\in\mathbb{R},\,x^{2}<0$
- D. $\exists n\in\mathbb{Z}^{+},\,n^{2}=9$

**标准答案**

```json
{
  "kind": "multi",
  "optionIds": [
    "A",
    "D"
  ]
}
```

**解析**

A 真。B：不存在整数使 $2x=5$。C：平方非负。D：取 $n=3$ 即可。

**复核说明**：A 对全体实数属逻辑复核（非全实数枚举证明）

---

### HSMA-RJA-CH01-0076

- 小节：1.5
- 主知识点：rja.1.5.03
- 关联 KP：rja.1.5.03
- 题型：multi　难度：3
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

关于命题否定，正确的是（多选）

**选项**

- A. “$\forall x\in M,\,p(x)$”的否定是“$\exists x\in M,\,\neg p(x)$”
- B. “$\exists x\in M,\,p(x)$”的否定是“$\forall x\in M,\,\neg p(x)$”
- C. 否定时只需否定结论，量词不变
- D. 否定全称命题时，全称与存在互换

**标准答案**

```json
{
  "kind": "multi",
  "optionIds": [
    "A",
    "B",
    "D"
  ]
}
```

**解析**

含量词命题的否定规则是：全称与存在互换，并且否定结论。只改结论不改量词是错误的，故 C 不选。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0077

- 小节：1.5
- 主知识点：rja.1.5.02
- 关联 KP：rja.1.5.02
- 题型：judge　难度：1
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

命题“$\exists x\in\mathbb{R},\,x^{2}=0$”是真命题。

**标准答案**

```json
{
  "kind": "judge",
  "value": true
}
```

**解析**

取 $x=0$ 时 $x^{2}=0$ 成立，说明存在这样的实数，故命题为真。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0078

- 小节：1.5
- 主知识点：rja.1.5.01
- 关联 KP：rja.1.5.01
- 题型：judge　难度：2
- 结构校验：PASS
- 数学独立复核：NEEDS_HUMAN_REVIEW
- 校验方法：LOGIC_REVIEW_REQUIRED（通读推导，无独立自动证明脚本）
- 人工审核：PENDING

**题干**

命题“$\forall x\in\mathbb{R},\,x^{2}>0$”是真命题。

**标准答案**

```json
{
  "kind": "judge",
  "value": false
}
```

**解析**

取反例 $x=0$，此时 $x^{2}=0$ 并不大于 $0$，故全称命题为假。

**复核说明**：HUMAN_REVIEW_REQUIRED；未发现矛盾，待具名人工审核

---

### HSMA-RJA-CH01-0079

- 小节：1.5
- 主知识点：rja.1.5.02
- 关联 KP：rja.1.5.02, rja.1.1.01
- 题型：numeric　难度：1
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_CALC
- 校验方法：独立计算期望=2
- 人工审核：PENDING

**题干**

在集合 $\{1,2,3,4\}$ 中，满足 $x>2$ 的元素个数是（可用于判断存在量词命题）

**标准答案**

```json
{
  "kind": "numeric",
  "value": "2",
  "toleranceAbs": 0,
  "toleranceRel": 0
}
```

**解析**

逐个检验：$3,4$ 满足 $x>2$，共 $2$ 个；因此“存在 $x$ 使 $x>2$”为真。

**复核说明**：与题库 numeric 一致

---

### HSMA-RJA-CH01-0080

- 小节：1.5
- 主知识点：rja.1.5.01
- 关联 KP：rja.1.5.01, rja.1.5.03
- 题型：numeric　难度：2
- 结构校验：PASS
- 数学独立复核：VERIFIED_BY_CALC
- 校验方法：独立计算期望=0
- 人工审核：PENDING

**题干**

命题“$\forall x\in\{2,4,6\},\,x$ 为偶数”为真。若从该集合中任取一个元素作为反例候选，可能推翻全称命题的反例个数是

**标准答案**

```json
{
  "kind": "numeric",
  "value": "0",
  "toleranceAbs": 0,
  "toleranceRel": 0
}
```

**解析**

$2,4,6$ 均为偶数，找不到使结论失败的元素，故可作反例的个数为 $0$。

**复核说明**：与题库 numeric 一致

---
