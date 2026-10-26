# HS-MATH-BANK-GLOBAL-1K-FIX-PREFLIGHT — 两道 MINOR 最小修订方案

> 日期：2026-10-26  
> **最终状态：`MINOR_FIX_PLAN_READY`**  
> 前置：GLOBAL-1K = `FULL_AUDIT_PASS`（MINOR：022、093）  
> **本阶段只读**：未改题、未写库、未 PATCH/review/approve、未动插图、drawable 仍为 **113**

旁证：`_g1k_minor_preflight_ro.json`

---

## 1. 结论摘要

| 题 | 问题 | 拟改字段 | 不改 |
|----|------|----------|------|
| **022** | rubric 给「抄写题干已给的 \(S(x)\)」计 3 分 | **仅** `answerPayload.rubric`（及 payload 内结构） | 题干 / standardAnswer / 难度 / KP / method / analysis（可不改） |
| **093** | 解析断言点积为 0 但未展示向量计算 | **仅** `analysis` | 题干 / 答案 / rubric / 插图 / 难度 / KP / method |

两题修订数学自洽；正式落地须另授权，并走 **edit→cv+1→draft→review→approve**。  
本阶段 **未执行** 任何正式修改。

---

## 2. 两题当前数据库状态（只读）

| 字段 | CAND-G1B-022 | CAND-G1B-093 |
|------|--------------|--------------|
| itemId | **173** | **244** |
| qtype / difficulty | application / **2** | application / **3** |
| status / pool / active | approved / formal / 1 | approved / formal / 1 |
| contentVersion | **1** | **2**（已含插图升版） |
| contentFingerprint | `9a8980a89318c152…918c6ea3` | `e464af2490737491…8c781375` |
| 有效 review | #36 passed @ cv1 · fp 匹配 | #134 passed @ cv2 · fp 匹配 |
| 插图 | **无** | **1** · linkId=1 · objectId=1 · SHA `e12b2f2b2373d454…fe33f1` |
| 主 KP | rja.3.2.08 单调性与最值 | rjb.8.6.02 垂直证明 |
| method | mono_analysis（主）+ special_value | classification（主）+ equiv_transform |
| drawable（全局） | **113**（本阶段未变） | 同左 |

### 2.1 022 题干 / 标准答案 / 现行 analysis（原文）

**题干：**

> 矩形周长 \(20\)，一边长 \(x\)，面积 \(S(x)=x(10-x)\)，\(0<x<10\)。  
> （1）求 \(S(x)\) 最大值及对应 \(x\)。

**standardAnswer：** `$x=5$ 时 $S_{\max}=25$。`

**analysis（拟保留）：**  
周长 \(20\) 时半周长为 \(10\)，故邻边为 \(10-x\)，面积 \(S(x)=x(10-x)=10x-x^2\)。这是开口向下的二次函数，对称轴 \(x=5\) 落在定义域 \((0,10)\) 内，最大值为 \(S(5)=25\)。几何上此时矩形为正方形。

### 2.2 093 题干 / 标准答案 / 现行 analysis（原文）

**题干：** 正方体 \(ABCD-A_1B_1C_1D_1\) 中，证明 \(BD_1\perp\) 平面 \(A_1C_1D\)（写出关键步骤）。

**standardAnswer：** `$BD_1\perp A_1C_1$ 且 $BD_1\perp A_1D$，故 $BD_1\perp$ 平面 $A_1C_1D$。`

**现行 analysis（过短）：**  
在正方体中可证 \(BD_1\perp A_1C_1\)（数量积为 \(0\)），且 \(BD_1\perp A_1D\)。两相交直线 \(A_1C_1\)、\(A_1D\) 均在平面 \(A_1C_1D\) 内，由线面垂直判定得 \(BD_1\perp\) 平面 \(A_1C_1D\)。

---

## 3. 原问题与严重程度

| code | 1K 分级 | 性质 | 是否改答案/考点 |
|------|---------|------|-----------------|
| 022 | **MINOR** | 评分设计：照抄题干 \(S(x)\) 可拿 3 分 | **否**（答案 \(x=5,S_{\max}=25\) 正确） |
| 093 | **MINOR** | 解析完整度：缺向量与点积展开 | **否**（结论与 rubric 正确；图正确） |

无 CRITICAL / MAJOR；无需改难度或 KP。

---

## 4. 022 — 独立推导与新旧 rubric

### 4.1 独立推导

\[
S(x)=x(10-x)=10x-x^2,\quad 0<x<10.
\]

二次项系数 \(-1<0\)，开口向下；对称轴 \(x=-\dfrac{b}{2a}=5\in(0,10)\)。

\[
S(5)=5\cdot5=25.
\]

（等价：配方 \(S=25-(x-5)^2\)；或均值不等式 \(x+(10-x)=10\)，当 \(x=10-x\) 时面积最大。）

→ 标准答案正确。

### 4.2 现行 rubric（问题点）

| key | title | criteria | 分 | 问题 |
|-----|-------|----------|---|------|
| **s** | 面积函数 | `$x(10-x)$` | 3 | **题干已给出**，照抄即得分 |
| m | 最大值 | `25,x=5` | 5 | 合理 |
| | | **合计** | **8** = maxScore | |

### 4.3 拟议新 rubric（总分仍 8；和=8）

| key | title | criteria | 分 | 考查能力 |
|-----|-------|----------|---|----------|
| **proc** | 求最值过程 | 指出开口向下且对称轴 \(x=5\)，**或**配方得 \(S=25-(x-5)^2\)，**或**等价均值/导数途径得到最值点 \(x=5\) | **3** | 真实推导，**禁止**仅重抄题干 \(S(x)=x(10-x)\) 计分 |
| **m** | 最大值结果 | \(x=5\) 且 \(S_{\max}=25\) | **5** | 结果正确 |
| | | **合计** | **8** = maxScore | |

**计分说明（写入后续 review comment / 可选 criteria 注释）：**

- 仅抄写题干中的 \(S(x)=x(10-x)\) → **proc 0 分**。  
- 写出对称轴/配方/AM-GM 等到 \(x=5\) → proc 满分。  
- 结果对但过程空 → 可给 m 分、proc 少给或不给。  
- 用均值不等式等替代解法得到 \(x=5,S=25\) → **应满分**。

### 4.4 022 字段白名单

| 字段 | 动作 |
|------|------|
| `answerPayload.rubric` | **替换**为上表（keys: `proc`,`m`） |
| `answerPayload.maxScore` | 保持 **8** |
| `answerPayload.standardAnswer` | **不变** |
| `answerPayload.kind` | 保持 `application` |
| stem / analysis / options / KP / method / difficulty | **不变** |
| 插图 | 无 |

**不建议**改 analysis（已含二次展开与对称轴，与新 rubric 一致）。

---

## 5. 093 — 独立推导与新旧 analysis

### 5.1 独立坐标推导（与任务指定模型一致）

\[
\begin{align*}
A&=(0,0,0),\; B=(1,0,0),\; C=(1,1,0),\; D=(0,1,0),\\
A_1&=(0,0,1),\; B_1=(1,0,1),\; C_1=(1,1,1),\; D_1=(0,1,1).
\end{align*}
\]

\[
\overrightarrow{BD_1}=D_1-B=(-1,1,1),\quad
\overrightarrow{A_1C_1}=(1,1,0),\quad
\overrightarrow{A_1D}=(0,1,-1).
\]

\[
\overrightarrow{BD_1}\cdot\overrightarrow{A_1C_1}=-1+1+0=0,\quad
\overrightarrow{BD_1}\cdot\overrightarrow{A_1D}=0+1-1=0.
\]

\(A_1C_1\)、\(A_1D\) 交于 \(A_1\)，且都在平面 \(A_1C_1D\) 内 → 线面垂直判定 → \(BD_1\perp\) 平面 \(A_1C_1D\)。

与 standardAnswer / rubric 一致；插图 SHA `e12b2f2b…` 示意一致、无泄题。

### 5.2 现行 analysis（旧）

> 在正方体中可证 \(BD_1\perp A_1C_1\)（数量积为 \(0\)），且 \(BD_1\perp A_1D\)。两相交直线 \(A_1C_1\)、\(A_1D\) 均在平面 \(A_1C_1D\) 内，由线面垂直判定得 \(BD_1\perp\) 平面 \(A_1C_1D\)。

### 5.3 拟议新 analysis（完整稿，供正式 PATCH）

```text
建立坐标系：取 $A=(0,0,0)$，$B=(1,0,0)$，$C=(1,1,0)$，$D=(0,1,0)$，$A_1=(0,0,1)$，$C_1=(1,1,1)$，$D_1=(0,1,1)$（棱长取 $1$，由相似性不影响垂直关系）。

则 $\overrightarrow{BD_1}=D_1-B=(-1,1,1)$，$\overrightarrow{A_1C_1}=(1,1,0)$，$\overrightarrow{A_1D}=(0,1,-1)$。

计算数量积：
$\overrightarrow{BD_1}\cdot\overrightarrow{A_1C_1}=-1+1+0=0$，故 $BD_1\perp A_1C_1$；
$\overrightarrow{BD_1}\cdot\overrightarrow{A_1D}=0+1-1=0$，故 $BD_1\perp A_1D$。

又 $A_1C_1$ 与 $A_1D$ 交于 $A_1$，且均在平面 $A_1C_1D$ 内，由线面垂直判定定理得 $BD_1\perp$ 平面 $A_1C_1D$。
```

（KaTeX / MathStem 友好；不超出必修立体几何 + 空间向量数量积范围。）

### 5.4 093 字段白名单

| 字段 | 动作 |
|------|------|
| `analysis` | **替换**为 §5.3 |
| stem / answerPayload（含 rubric、standardAnswer） | **不变** |
| KP / method / difficulty | **不变** |
| 插图关联（link/object/SHA） | **禁止** upload/replace/delete/reorder |

---

## 6. 图片关联保护（093）

正式改 analysis 时：

1. 仅调用内容更新 API 的 **analysis** 字段（或等价局部 PATCH），**不要**附带清空 diagrams。  
2. 改前/改后只读核对：`diagrams.length===1` 且 `content_sha256===e12b2f2b2373d4545c6a79af55caa1f0c85c7d83f7b29d8a2cc5132671fe33f1`。  
3. 新 fingerprint **必须**继续纳入有序 `diagramSha256List=[上述 SHA]`（与现网 `fingerprintTrainItemContent` 一致）。  
4. 若误触发插图接口 → **立即停止**，本方案不授权任何插图写操作。

022 无图，无此项风险。

---

## 7. contentVersion / fingerprint / drawable 预期

| 时点 | 022 | 093 | drawable |
|------|-----|-----|----------|
| **当前（本预检）** | approved / cv**1** | approved / cv**2** | **113** |
| 两题均正式改内容后（未审） | draft / cv**2** | draft / cv**3** | **111** |
| 两题均 review passed + approve 后 | approved / cv2 | approved / cv3 | **113** |

- 旧 review（022#36 @cv1；093#134 @cv2）在升版后对当前版本 **stale**。  
- 新 fp ≠ 旧 fp；approve 须绑定**新** panel 的 version+fingerprint。

---

## 8. 建议正式执行顺序（**下阶段授权后**）

1. Admin JWT · 仅改 **022** `answerPayload.rubric`（白名单）→ 确认 cv=2、status=draft、drawable=112。  
2. Admin JWT · 仅改 **093** `analysis`（白名单）→ 确认插图 SHA 未变、cv=3、status=draft、drawable=111。  
3. 对 022、093 分别 `GET review-panel` → 数学确认 → `POST reviews` `passed`（带 expected cv/fp）。  
4. 分别 `PATCH status=approved` + `confirmPublish=true`。  
5. 核验：两题 approved、有效 review、093 图仍在、drawable=**113**、其他 98 题未动。

**本预检禁止执行 1–5。**

---

## 9. 修订质量自检（方案层）

| 检查 | 结果 |
|------|------|
| 022 新 rubric 不奖励照抄题干 | **是**（proc 明确排除） |
| 022 总分 8、分项和 8 | **是** |
| 022 替代解法可满分 | **是**（对称轴/配方/AM-GM） |
| 093 点积计算正确 | **是**（两数量积均为 0） |
| 093 解析与答案/rubric 一致 | **是** |
| 093 插图保持 | **方案强制保留** |
| 不改考点/难度/答案 | **是** |
| 其他 98 题 | **不在范围内** |

---

## 10. 后续正式修改所需授权

须**单独授权**例如：`HS-MATH-BANK-GLOBAL-1K-FIX-EXEC`，明确允许：

- 对 item **173、244** 按本白皮书白名单 PATCH；  
- 随后 review + approve；  
- 禁止扩改其他题、禁止动插图文件。

未授权前：**停止**。

---

## 11. 未执行事项（本阶段）

未修改正式题；未写 MySQL；未 Admin PATCH；未 review/approve；未上传/替换/删除图；未迁移；未建 session；未调真实 AI；未改配置；未重启；未 git commit/push；未进第二批。

---

## 12. 状态

**`MINOR_FIX_PLAN_READY`**

完成后停止。不得自动修改正式题目，不得自动进入第二批题库生成或导入。
