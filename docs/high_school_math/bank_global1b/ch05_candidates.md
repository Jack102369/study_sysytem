# 第5章候选题（rja-ch5）

本文件 20 道；数据源 `candidates-g1b-100.mjs`。

### CAND-G1B-046

| 字段 | 值 |
|------|-----|
| 册别 | 必修一 |
| 章/小节 | 第5章 · `5.1` 任意角和弧度制 |
| specialty | `rja-ch5` |
| 主知识点 | `rja.5.1.01` 角的概念推广（库内:否 · 种子:是） |
| 方法 | defn |
| 题型/难度 | `judge` / 1 |
| 来源 | `original` · 本批原创；非高考真题 |
| 去重 | 三角章46 |
| 数学验证 | `SPOT_VERIFIED` |
| reviewReady | 是（种子齐+质量门禁；**非**已可抽题） |

**题干**

$-390^\circ$ 是第四象限角。

**标准答案**

true

**解析**

终边相同角：$-390^\circ=-360^\circ+(-30^\circ)$，与 $-30^\circ$ 终边相同。$-30^\circ$ 在第四象限，故 $-390^\circ$ 也是第四象限角。命题正确。

---

### CAND-G1B-047

| 字段 | 值 |
|------|-----|
| 册别 | 必修一 |
| 章/小节 | 第5章 · `5.1` 任意角和弧度制 |
| specialty | `rja-ch5` |
| 主知识点 | `rja.5.1.02` 弧度制（库内:否 · 种子:是） |
| 方法 | equiv_transform |
| 题型/难度 | `numeric` / 1 |
| 来源 | `original` · 本批原创；非高考真题 |
| 去重 | 三角章47 |
| 数学验证 | `SPOT_VERIFIED` |
| reviewReady | 是（种子齐+质量门禁；**非**已可抽题） |

**题干**

$\dfrac{5\pi}{6}$ 化为度数（整数）

**标准答案**

150

**解析**

换算关系：$\pi$ 弧度 $=180^\circ$。因此 $\dfrac{5\pi}{6}=\dfrac{5}{6}\times180^\circ=150^\circ$。答案填整数 $150$。

---

### CAND-G1B-048

| 字段 | 值 |
|------|-----|
| 册别 | 必修一 |
| 章/小节 | 第5章 · `5.1` 任意角和弧度制 |
| specialty | `rja-ch5` |
| 主知识点 | `rja.5.1.03` 弧长应用（库内:否 · 种子:是） |
| 方法 | equiv_transform |
| 题型/难度 | `application` / 2 |
| 来源 | `original` · 本批原创；非高考真题 |
| 去重 | 弧长公式 |
| 数学验证 | `AUTHOR_CHECKED` |
| reviewReady | 是（种子齐+质量门禁；**非**已可抽题） |

**题干**

圆半径 $r=10\text{cm}$，圆心角 $60^\circ$，求弧长（$\pi$ 形式）。

**标准答案**

$l=\dfrac{10\pi}{3}\text{cm}$。

**应用题评分** maxScore=8

| key | title | score | criterion |
|-----|-------|-------|-----------|
| rad | 化弧度 | 3 | $\pi/3$ |
| l | 弧长 | 5 | $10\pi/3$ |

**解析**

先把圆心角化为弧度：$60^\circ=\dfrac{\pi}{3}$。弧长公式 $l=r\theta$ 得 $l=10\cdot\dfrac{\pi}{3}=\dfrac{10\pi}{3}\text{cm}$。也可用 $l=\dfrac{n\pi r}{180}$ 得同一结果。

---

### CAND-G1B-049

| 字段 | 值 |
|------|-----|
| 册别 | 必修一 |
| 章/小节 | 第5章 · `5.2` 三角函数的概念 |
| specialty | `rja-ch5` |
| 主知识点 | `rja.5.2.01` 三角函数定义（库内:否 · 种子:是） |
| 方法 | defn |
| 题型/难度 | `single` / 1 |
| 来源 | `original` · 本批原创；非高考真题 |
| 去重 | 三角章49 |
| 数学验证 | `SPOT_VERIFIED` |
| reviewReady | 是（种子齐+质量门禁；**非**已可抽题） |

**题干**

$\alpha$ 终边过 $P(-3,4)$，则 $\sin\alpha=$

**选项**

- **A.** $3/5$
- **B.** $4/5$
- **C.** $-4/5$
- **D.** $-3/5$

**标准答案**

B

**解析**

终边上点 $P(-3,4)$，半径 $r=\sqrt{(-3)^2+4^2}=5$。按定义 $\sin\alpha=\dfrac{y}{r}=\dfrac{4}{5}$（纵坐标为正，正弦为正）。选 B。

---

### CAND-G1B-050

| 字段 | 值 |
|------|-----|
| 册别 | 必修一 |
| 章/小节 | 第5章 · `5.2` 三角函数的概念 |
| specialty | `rja-ch5` |
| 主知识点 | `rja.5.2.02` 同角关系（库内:否 · 种子:是） |
| 方法 | equiv_transform |
| 题型/难度 | `single` / 1 |
| 来源 | `original` · 本批原创；非高考真题 |
| 去重 | 三角章50 |
| 数学验证 | `SPOT_VERIFIED` |
| reviewReady | 是（种子齐+质量门禁；**非**已可抽题） |

**题干**

$\sin\theta=\dfrac35$，$\theta$ 在第二象限，则 $\cos\theta=$

**选项**

- **A.** $4/5$
- **B.** $-4/5$
- **C.** $3/5$
- **D.** $-3/5$

**标准答案**

B

**解析**

由 $\sin^2+\cos^2=1$，$\cos^2=1-(\dfrac{3}{5})^2=\dfrac{16}{25}$。第二象限余弦为负，故 $\cos\theta=-\dfrac{4}{5}$。选 B。

---

### CAND-G1B-051

| 字段 | 值 |
|------|-----|
| 册别 | 必修一 |
| 章/小节 | 第5章 · `5.3` 诱导公式 |
| specialty | `rja-ch5` |
| 主知识点 | `rja.5.3.01` 诱导公式（库内:否 · 种子:是） |
| 方法 | equiv_transform |
| 题型/难度 | `numeric` / 1 |
| 来源 | `original` · 本批原创；非高考真题 |
| 去重 | 三角章51 |
| 数学验证 | `SPOT_VERIFIED` |
| reviewReady | 是（种子齐+质量门禁；**非**已可抽题） |

**题干**

$\sin\!\left(\dfrac{7\pi}{6}\right)=$

**标准答案**

-0.5

**解析**

$\dfrac{7\pi}{6}=\pi+\dfrac{\pi}{6}$ 落在第三象限，正弦为负：$\sin\dfrac{7\pi}{6}=-\sin\dfrac{\pi}{6}=-\dfrac12=-0.5$。

---

### CAND-G1B-052

| 字段 | 值 |
|------|-----|
| 册别 | 必修一 |
| 章/小节 | 第5章 · `5.3` 诱导公式 |
| specialty | `rja-ch5` |
| 主知识点 | `rja.5.3.03` 化简证明（库内:否 · 种子:是） |
| 方法 | equiv_transform |
| 题型/难度 | `application` / 2 |
| 来源 | `original` · 本批原创；非高考真题 |
| 去重 | 诱导公式化简 |
| 数学验证 | `AUTHOR_CHECKED` |
| reviewReady | 是（种子齐+质量门禁；**非**已可抽题） |

**题干**

化简：$\sin(\pi-\theta)+\sin(\pi+\theta)$。

**标准答案**

$0$。

**应用题评分** maxScore=10

| key | title | score | criterion |
|-----|-------|-------|-----------|
| s1 | 第一项 | 4 | $\sin\theta$ |
| s2 | 第二项 | 4 | $-\sin\theta$ |
| r | 结果 | 2 | 0 |

**解析**

用诱导公式分别化简：$\sin(\pi-\theta)=\sin\theta$（诱导“奇变偶不变，符号看象限”中正弦在第二象限为正），$\sin(\pi+\theta)=-\sin\theta$（第三象限正弦为负）。两式相加：$\sin\theta+(-\sin\theta)=0$。故原式恒等于 $0$（对使式子有定义的 $\theta$）。可用特殊值 $\theta=\pi/6$ 代入检验。

---

### CAND-G1B-053

| 字段 | 值 |
|------|-----|
| 册别 | 必修一 |
| 章/小节 | 第5章 · `5.4` 三角函数的图象与性质 |
| specialty | `rja-ch5` |
| 主知识点 | `rja.5.4.01` 正弦函数性质（库内:否 · 种子:是） |
| 方法 | graph_symmetry |
| 题型/难度 | `single` / 1 |
| 来源 | `original` · 本批原创；非高考真题 |
| 去重 | 三角章53 |
| 数学验证 | `SPOT_VERIFIED` |
| reviewReady | 是（种子齐+质量门禁；**非**已可抽题） |

**题干**

$y=\sin x$ 的最小正周期为

**选项**

- **A.** $\pi$
- **B.** $2\pi$
- **C.** $4\pi$
- **D.** $\pi/2$

**标准答案**

B

**解析**

正弦函数 $y=\sin x$ 的图象每隔 $2\pi$ 重复一次，且 $2\pi$ 是最小正周期（更小的正数如 $\pi$ 不成立，因 $\sin(x+\pi)=-\sin x$）。选 B。

---

### CAND-G1B-054

| 字段 | 值 |
|------|-----|
| 册别 | 必修一 |
| 章/小节 | 第5章 · `5.4` 三角函数的图象与性质 |
| specialty | `rja-ch5` |
| 主知识点 | `rja.5.4.02` 余弦函数性质（库内:否 · 种子:是） |
| 方法 | graph_symmetry |
| 题型/难度 | `judge` / 1 |
| 来源 | `original` · 本批原创；非高考真题 |
| 去重 | 三角章54 |
| 数学验证 | `SPOT_VERIFIED` |
| reviewReady | 是（种子齐+质量门禁；**非**已可抽题） |

**题干**

$y=\cos x$ 为偶函数。

**标准答案**

true

**解析**

偶函数定义要求 $f(-x)=f(x)$。对余弦：$\cos(-x)=\cos x$ 恒成立，故 $y=\cos x$ 是偶函数（图象关于 $y$ 轴对称）。命题正确。

---

### CAND-G1B-055

| 字段 | 值 |
|------|-----|
| 册别 | 必修一 |
| 章/小节 | 第5章 · `5.5` 三角恒等变换 |
| specialty | `rja-ch5` |
| 主知识点 | `rja.5.5.01` 和差公式（库内:否 · 种子:是） |
| 方法 | equiv_transform |
| 题型/难度 | `single` / 2 |
| 来源 | `original` · 本批原创；非高考真题 |
| 去重 | 三角章55 |
| 数学验证 | `SPOT_VERIFIED` |
| reviewReady | 是（种子齐+质量门禁；**非**已可抽题） |

**题干**

$\cos75^\circ=$

**选项**

- **A.** $\frac{\sqrt6+\sqrt2}{4}$
- **B.** $\frac{\sqrt6-\sqrt2}{4}$
- **C.** $\frac{\sqrt2-\sqrt6}{4}$
- **D.** $-\frac{\sqrt6+\sqrt2}{4}$

**标准答案**

B

**解析**

$\cos75^\circ=\cos(45^\circ+30^\circ)=\cos45\cos30-\sin45\sin30=\dfrac{\sqrt2}{2}\cdot\dfrac{\sqrt3}{2}-\dfrac{\sqrt2}{2}\cdot\dfrac12=\dfrac{\sqrt6-\sqrt2}{4}$。选 B。

---

### CAND-G1B-056

| 字段 | 值 |
|------|-----|
| 册别 | 必修一 |
| 章/小节 | 第5章 · `5.5` 三角恒等变换 |
| specialty | `rja-ch5` |
| 主知识点 | `rja.5.5.04` 恒等证明（库内:否 · 种子:是） |
| 方法 | equiv_transform |
| 题型/难度 | `application` / 3 |
| 来源 | `original` · 本批原创；非高考真题 |
| 去重 | 倍角证明 |
| 数学验证 | `AUTHOR_CHECKED` |
| reviewReady | 是（种子齐+质量门禁；**非**已可抽题） |

**题干**

证明：$\dfrac{1-\cos2\alpha}{\sin2\alpha}=\tan\alpha$（$\alpha$ 使分母不为0）。

**标准答案**

左式 $=\dfrac{2\sin^2\alpha}{2\sin\alpha\cos\alpha}=\tan\alpha$。

**应用题评分** maxScore=10

| key | title | score | criterion |
|-----|-------|-------|-----------|
| num | 分子 | 4 | $2\sin^2\alpha$ |
| den | 分母 | 3 | $2\sin\alpha\cos\alpha$ |
| r | 结论 | 3 | $\tan\alpha$ |

**解析**

左式用倍角：$1-\cos2\alpha=2\sin^2\alpha$，$\sin2\alpha=2\sin\alpha\cos\alpha$，故 $\dfrac{2\sin^2\alpha}{2\sin\alpha\cos\alpha}=\tan\alpha$（分母 $\ne0$）。得证。

---

### CAND-G1B-057

| 字段 | 值 |
|------|-----|
| 册别 | 必修一 |
| 章/小节 | 第5章 · `5.5` 三角恒等变换 |
| specialty | `rja-ch5` |
| 主知识点 | `rja.5.5.02` 二倍角公式（库内:否 · 种子:是） |
| 方法 | equiv_transform |
| 题型/难度 | `numeric` / 2 |
| 来源 | `original` · 本批原创；非高考真题 |
| 去重 | 三角章57 |
| 数学验证 | `SPOT_VERIFIED` |
| reviewReady | 是（种子齐+质量门禁；**非**已可抽题） |

**题干**

$\sin15^\circ\cos15^\circ=$

**标准答案**

0.25

**解析**

二倍角：$\sin2\alpha=2\sin\alpha\cos\alpha$，故 $\sin15^\circ\cos15^\circ=\dfrac12\sin30^\circ=\dfrac12\cdot\dfrac12=\dfrac14=0.25$。

---

### CAND-G1B-058

| 字段 | 值 |
|------|-----|
| 册别 | 必修一 |
| 章/小节 | 第5章 · `5.6` 函数 y=Asin(ωx+φ) |
| specialty | `rja-ch5` |
| 主知识点 | `rja.5.6.01` 振幅周期相位（库内:否 · 种子:是） |
| 方法 | graph_symmetry |
| 题型/难度 | `single` / 2 |
| 来源 | `original` · 本批原创；非高考真题 |
| 去重 | 三角章58 |
| 数学验证 | `SPOT_VERIFIED` |
| reviewReady | 是（种子齐+质量门禁；**非**已可抽题） |

**题干**

$y=3\sin(2x+\pi/3)$ 的振幅为

**选项**

- **A.** $2$
- **B.** $3$
- **C.** $\pi/3$
- **D.** $2\pi$

**标准答案**

B

**解析**

形如 $y=A\sin(\omega x+\varphi)$ 的函数，振幅是 $|A|$，周期由 $\omega$ 决定，初相由 $\varphi$ 决定。本题系数 $A=3$，因此振幅为 $3$，与 $2$、$\pi/3$ 无关。选 B。

---

### CAND-G1B-059

| 字段 | 值 |
|------|-----|
| 册别 | 必修一 |
| 章/小节 | 第5章 · `5.6` 函数 y=Asin(ωx+φ) |
| specialty | `rja-ch5` |
| 主知识点 | `rja.5.6.02` 图象变换（库内:否 · 种子:是） |
| 方法 | graph_symmetry |
| 题型/难度 | `multi` / 2 |
| 来源 | `original` · 本批原创；非高考真题 |
| 去重 | 三角章59 |
| 数学验证 | `AUTHOR_CHECKED` |
| reviewReady | 是（种子齐+质量门禁；**非**已可抽题） |

**题干**

$y=\sin x$ 经何种变换得 $y=\sin(2x)$（多选）

**选项**

- **A.** 横坐标缩短为原来1/2
- **B.** 横坐标伸长为原来2倍
- **C.** 纵坐标不变
- **D.** 向右平移

**标准答案**

A,C

**解析**

比较 $y=\sin x$ 与 $y=\sin(2x)$：把角换成 $2x$ 后，周期由 $2\pi$ 变为 $\pi$，相当于横坐标（周期）缩短为原来的 $\dfrac12$，即 A；纵坐标振幅仍为 $1$，尺度不变，即 C。题干没有 $\varphi$ 平移项，故不向右平移（排除 D）；也不是伸长（排除 B）。因此选 A、C。

---

### CAND-G1B-060

| 字段 | 值 |
|------|-----|
| 册别 | 必修一 |
| 章/小节 | 第5章 · `5.7` 三角函数的应用 |
| specialty | `rja-ch5` |
| 主知识点 | `rja.5.7.02` 潮汐模型（库内:否 · 种子:是） |
| 方法 | graph_symmetry / special_value |
| 题型/难度 | `application` / 2 |
| 来源 | `original` · 本批原创；非高考真题 |
| 去重 | 余弦周期模型 |
| 数学验证 | `AUTHOR_CHECKED` |
| reviewReady | 是（种子齐+质量门禁；**非**已可抽题） |

**题干**

潮高 $h(t)=2\cos(\dfrac{\pi t}{6})+4$（$t$ 为小时）。求最高潮高与周期。

**标准答案**

最高 $6\text{m}$，周期 $12\text{h}$。

**应用题评分** maxScore=8

| key | title | score | criterion |
|-----|-------|-------|-----------|
| max | 最高 | 4 | 6m |
| T | 周期 | 4 | 12h |

**解析**

潮高 $h(t)=2\cos(\dfrac{\pi t}{6})+4$。振幅为 $|2|=2$，平衡位置（竖直平移）为 $4$，故最高潮高为 $4+2=6$（米），最低为 $2$。角频率 $\omega=\pi/6$，周期 $T=\dfrac{2\pi}{\omega}=\dfrac{2\pi}{\pi/6}=12$（小时）。当 $\cos=1$ 时取最高；例如 $t=0$ 时 $h=6$ 可作代入检验。

---

### CAND-G1B-061

| 字段 | 值 |
|------|-----|
| 册别 | 必修一 |
| 章/小节 | 第5章 · `5.7` 三角函数的应用 |
| specialty | `rja-ch5` |
| 主知识点 | `rja.5.7.01` 简谐振动（库内:否 · 种子:是） |
| 方法 | special_value |
| 题型/难度 | `single` / 3 |
| 来源 | `original` · 本批原创；非高考真题 |
| 去重 | 三角章61 |
| 数学验证 | `AUTHOR_CHECKED` |
| reviewReady | 是（种子齐+质量门禁；**非**已可抽题） |

**题干**

$h=2\sin(3t)+5$ 的最大值为

**选项**

- **A.** $2$
- **B.** $3$
- **C.** $5$
- **D.** $7$

**标准答案**

D

**解析**

函数 $h=2\sin(3t)+5$ 中，$\sin(3t)\in[-1,1]$，从而 $2\sin(3t)\in[-2,2]$，再加上常数 $5$，得值域 $h\in[3,7]$。因此最大值为 $7$，选 D。注意最大值不是振幅 $2$，也不是平衡位置 $5$；角频率 $3$ 只影响周期，不影响最值。当 $\sin(3t)=1$ 时取到 $7$。

---

### CAND-G1B-062

| 字段 | 值 |
|------|-----|
| 册别 | 必修一 |
| 章/小节 | 第5章 · `5.4` 三角函数的图象与性质 |
| specialty | `rja-ch5` |
| 主知识点 | `rja.5.4.03` 正切函数（库内:否 · 种子:是） |
| 方法 | mono_analysis |
| 题型/难度 | `judge` / 3 |
| 来源 | `original` · 本批原创；非高考真题 |
| 去重 | 三角章62 |
| 数学验证 | `AUTHOR_CHECKED` |
| reviewReady | 是（种子齐+质量门禁；**非**已可抽题） |

**题干**

$y=\tan x$ 在 $(-\pi/2,\pi/2)$ 递增。

**标准答案**

true

**解析**

正切函数 $y=\tan x$ 的定义域是去掉奇异点的开区间并，在每一个 $(-\dfrac{\pi}{2}+k\pi,\dfrac{\pi}{2}+k\pi)$ 内导数为正、严格递增。特别地，在 $(-\pi/2,\pi/2)$ 上单调递增。命题正确。

---

### CAND-G1B-063

| 字段 | 值 |
|------|-----|
| 册别 | 必修一 |
| 章/小节 | 第5章 · `5.3` 诱导公式 |
| specialty | `rja-ch5` |
| 主知识点 | `rja.5.3.02` 互化求值（库内:否 · 种子:是） |
| 方法 | equiv_transform |
| 题型/难度 | `single` / 3 |
| 来源 | `original` · 本批原创；非高考真题 |
| 去重 | 三角章63 |
| 数学验证 | `AUTHOR_CHECKED` |
| reviewReady | 是（种子齐+质量门禁；**非**已可抽题） |

**题干**

$\cos(\pi-\alpha)=$

**选项**

- **A.** $\cos\alpha$
- **B.** $-\cos\alpha$
- **C.** $\sin\alpha$
- **D.** $-\sin\alpha$

**标准答案**

B

**解析**

诱导公式：$\cos(\pi-\alpha)=-\cos\alpha$，故选 B。几何理解：$\pi-\alpha$ 与 $\alpha$ 互补（或看作第二象限相关角），余弦在第二象限为负，因而带负号。常见混淆：误记成 $\cos\alpha$（偶次不变却忘看符号），或与 $\sin(\pi-\alpha)=\sin\alpha$ 搞混。可用 $\alpha=0$：$\cos\pi=-1=-\cos0$ 快速核对。

---

### CAND-G1B-064

| 字段 | 值 |
|------|-----|
| 册别 | 必修一 |
| 章/小节 | 第5章 · `5.7` 三角函数的应用 |
| specialty | `rja-ch5` |
| 主知识点 | `rja.5.7.03` 测量应用（库内:否 · 种子:是） |
| 方法 | special_value |
| 题型/难度 | `application` / 3 |
| 来源 | `original` · 本批原创；非高考真题 |
| 去重 | 仰角测量 |
| 数学验证 | `AUTHOR_CHECKED` |
| reviewReady | 是（种子齐+质量门禁；**非**已可抽题） |

**题干**

塔高测量：距塔底 $40\text{m}$ 处测得顶角 $30^\circ$，求塔高（精确值）。

**标准答案**

$h=\dfrac{40\sqrt3}{3}\text{m}$。

**应用题评分** maxScore=10

| key | title | score | criterion |
|-----|-------|-------|-----------|
| model | 模型 | 4 | $\tan30^\circ$ |
| calc | 计算 | 4 | $40\sqrt3/3$ |
| u | 单位 | 2 | m |

**解析**

直角三角形中，仰角 $30^\circ$，邻边（水平距离）为 $40$，对边为塔高 $h$。故 $h=40\tan30^\circ=40\cdot\dfrac{\sqrt3}{3}=\dfrac{40\sqrt3}{3}\text{m}$。

---

### CAND-G1B-065

| 字段 | 值 |
|------|-----|
| 册别 | 必修一 |
| 章/小节 | 第5章 · `5.5` 三角恒等变换 |
| specialty | `rja-ch5` |
| 主知识点 | `rja.5.5.03` 辅助角公式（库内:否 · 种子:是） |
| 方法 | equiv_transform |
| 题型/难度 | `numeric` / 2 |
| 来源 | `original` · 本批原创；非高考真题 |
| 去重 | 三角章65 |
| 数学验证 | `SPOT_VERIFIED` |
| reviewReady | 是（种子齐+质量门禁；**非**已可抽题） |

**题干**

$\sqrt3\sin x+\cos x$ 的最大值为

**标准答案**

2

**解析**

辅助角法：把 $\sqrt3\sin x+\cos x$ 写成 $R\sin(x+\varphi)$。取 $R=\sqrt{(\sqrt3)^2+1^2}=2$，则 $\dfrac{\sqrt3}{2}\sin x+\dfrac12\cos x=\sin(x+\dfrac{\pi}{6})$，故原式 $=2\sin(x+\dfrac{\pi}{6})$。正弦最大值为 $1$，因此原式最大值为 $2$。当 $x+\pi/6=\pi/2$ 即 $x=\pi/3$ 时取到。

---
