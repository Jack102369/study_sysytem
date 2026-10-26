# HS-MATH-BANK-DIAGRAM-1D — 四道 REQUIRED 教学插图（离线）

> 日期：2026-10-26  
> **最终状态：`MATH_REVIEW_PENDING`**  
> 前置：DIAGRAM-1C-MIGRATION = `MIGRATION_PASS`  
> **未上传**正式存储；**未写入**三插图表；**未** Admin 写 API；**未**升版/review/approve；**未**开训；**未**调 AI；**未** git commit/push

---

## 1. 结论摘要

| 项 | 结果 |
|----|------|
| 正式题干核对 | 四题只读完成；以 DB 为准 |
| 离线 SVG + PNG | **4×2 = 8 文件** 已生成 |
| SVG 安全 | 无 script/事件/foreignObject/外链资源（仅 xmlns 命名空间 URI） |
| 泄题风险（自检） | **低**（未标证明结论/正确选项/数值答案） |
| 绘图作者自检 | **通过** |
| 独立数学复核 | **未完成** → 状态 **`MATH_REVIEW_PENDING`** |
| 正式上传 / 网页验收 | **未执行** |

目录：`docs/high_school_math/diagrams/required_g1b/`  
清单：`_manifest.json` · 说明：`NOTES.md` · 生成器：`_generate_required_diagrams.py`

---

## 2. 四道正式题核对（只读 `study_system`）

旁证：`question_bank/_g1d_required_items_ro.mjs` → `_g1d_required_items_ro.json`

| code | id | qtype | difficulty | pool/status/active | content_version | KP | method | review |
|------|-----|-------|------------|--------------------|-----------------|----|--------|--------|
| CAND-G1B-093 | 244 | application | 3 | formal/approved/1 | 1 | rjb.8.6.02 垂直证明 | classification, equiv_transform | passed @ cv1 |
| CAND-G1B-080 | 231 | application | 3 | formal/approved/1 | 1 | rjb.6.4.04 几何证明 | equiv_transform | passed @ cv1 |
| CAND-G1B-064 | 215 | application | 3 | formal/approved/1 | 1 | rja.5.7.03 测量应用 | special_value | passed @ cv1 |
| CAND-G1B-091 | 242 | single | 3 | formal/approved/1 | 1 | rjb.8.2.01 斜二测 | graph_symmetry | passed @ cv1 |

### 题干摘要（DB 原文要点）

1. **093**：正方体 \(ABCD-A_1B_1C_1D_1\) 中，证明 \(BD_1\perp\) 平面 \(A_1C_1D\)。  
2. **080**：用向量证明平行四边形对角线互相平分（\(\vec{AB}=\vec a,\vec{AD}=\vec b\)）。  
3. **064**：距塔底 \(40\mathrm{m}\) 处测得顶角 \(30^\circ\)，求塔高精确值。答案 \(h=\dfrac{40\sqrt3}{3}\mathrm{m}\)。  
4. **091**：斜二测说法选择题；正确项 **A**（原 \(\angle xOy=90^\circ\)；直观图 \(\angle x'O'y'\) 常取 \(45^\circ\) 或 \(135^\circ\)）。

### 与 135 §8 绘图方案对照

| 题 | 135 方案 | 与 DB 一致性 | 差异处理 |
|----|----------|--------------|----------|
| 093 | 正方体 + \(BD_1\) + 平面 \(A_1C_1D\)；禁 ⊥ | **一致** | — |
| 080 | 平行四边形 + a,b + 对角线交点 M | **一致** | — |
| 064 | 塔、40m、仰角 30°、h；禁结果 | 题干「**顶角**」vs 解析「**仰角**」 | **以测量语义按仰角制图**；报告记录差异；**未改题** |
| 091 | 左原直角 / 右直观 45° 或 135° | **一致**（示 45° + 脚注 135°） | — |

**未修改数据库题目。**

---

## 3. 图片文件路径 · SHA256 · 尺寸

画布：**1000×720** px（PNG）；SVG viewBox 同尺寸。

| 文件 | bytes | SHA256 |
|------|------:|--------|
| `CAND-G1B-093.svg` | 3784 | `76f599628e344ef1ba574149430dd892b20d0215ea152ee86509772932f3651c` |
| `CAND-G1B-093.png` | 26172 | `e12b2f2b2373d4545c6a79af55caa1f0c85c7d83f7b29d8a2cc5132671fe33f1` |
| `CAND-G1B-080.svg` | 2815 | `48d3f9fa36f47a478a616a2577e53febb6cde26307c40559fb7e3ed60896cbac` |
| `CAND-G1B-080.png` | 25377 | `c01574e808ba150866781d4fd716348fb3331359c635ae5f1a4b46f137ef31fc` |
| `CAND-G1B-064.svg` | 6027 | `d246f82e3655ce6cd0dfddbffbd19c4569c2e6ea4cbed0c600f318abb4eba9f4` |
| `CAND-G1B-064.png` | 20372 | `a3549131d845107b4c795242013f50beb048639b056b1c302e79276dc8b4abf7` |
| `CAND-G1B-091.svg` | 9550 | `0a856e473d1513553dd37ca9e1da34fbbb256df6a4b01371b3256f8ae3855ce6` |
| `CAND-G1B-091.png` | 31229 | `616bf077867cdf62c1d2b3b064ee6d5e48528d585d03d4e69ce69dbbb4032a53` |

路径前缀：`docs/high_school_math/diagrams/required_g1b/`  
每题 **1** 张图（未拆多图）。

---

## 4. 图形元素与已知条件对应

### 4.1 CAND-G1B-093

| 已知/目标对象 | 图上对应 |
|---------------|----------|
| 正方体 \(ABCD-A_1B_1C_1D_1\) | 8 顶点标注；可见边实线；遮挡边 AD/DC/DD₁ 虚线 |
| 线段 \(BD_1\) | 加粗蓝色 |
| 平面 \(A_1C_1D\) | 浅色三角面 |
| 证明结论 ⊥ | **未标注** |

### 4.2 CAND-G1B-080

| 已知 | 图上对应 |
|------|----------|
| 平行四边形 ABCD | 四边形填充示意 |
| \(\vec{AB}=\vec a,\vec{AD}=\vec b\) | 箭头 + a/b 标注 |
| 对角线 | AC、BD 交于 M |
| 「互相平分」 | **未写** |

### 4.3 CAND-G1B-064

| 已知 | 图上对应 |
|------|----------|
| 观测点 / 塔底 / 塔顶 | O / B / T |
| 水平距离 40m | OB 标注 |
| 仰角 30°（题干「顶角」） | ∠ 于 O；脚注写仰角 |
| 塔高未知 | 标 \(h\) |
| 精确值答案 | **未写** |
| 水平⊥竖直 | B 处直角记号（测量几何，非答案） |

### 4.4 CAND-G1B-091

| 概念 | 图上对应 |
|------|----------|
| 原 \(\angle xOy=90^\circ\) | 左图 |
| 直观图 \(\angle x'O'y'=45^\circ\) | 右图 |
| 亦可 \(135^\circ\) | 底部脚注 |
| 正确选项 A | **未圈选** |

---

## 5. 数学核验

### 5.1 绘图作者自检（本阶段）

| # | 检查 | 093 | 080 | 064 | 091 |
|---|------|-----|-----|-----|-----|
| 1 | 题干条件一致 | ✓ | ✓ | ✓* | ✓ |
| 2 | 顶点/变量标注 | ✓ | ✓ | ✓ | ✓ |
| 3 | 线段/角度关系 | ✓ | ✓ | ✓ 仰角/直角 | ✓ 90° vs 45° |
| 4 | 向量方向 | n/a | ✓ A→B, A→D | n/a | n/a |
| 5 | 无额外隐含条件 | ✓ | ✓ | ✓ | ✓ |
| 6 | 不泄答案 | ✓ | ✓ | ✓ | ✓ |
| 7 | PNG 可读（1000×720） | ✓ | ✓ | ✓ | ✓ |

\*064：题干用词「顶角」与解析「仰角」不一致；图按解析语义制图并在文档声明。

### 5.2 独立数学复核

**未另设独立复核人/独立会话。**  
同一次制图代理的自检 **不得** 计为独立验收。

```
MATH_REVIEW_PENDING
```

建议后续：由另一审核者对照 DB 题干与 PNG/SVG 签字确认后，方可升为 `DIAGRAM_ASSETS_READY`。

---

## 6. 泄题与安全

| 项 | 结论 |
|----|------|
| 泄标准答案/证明步骤 | **否**（自检） |
| SVG XSS 危险构造 | **否**（无 script/事件/foreignObject/外链图；`xmlns` 的 `http://www.w3.org/2000/svg` 为命名空间，非拉取） |
| 敏感信息 | **否** |

---

## 7. 后续正式上传与审核步骤（须另授权）

1. 独立数学复核通过 → 状态升为 `DIAGRAM_ASSETS_READY`（可选本阶段补签）。  
2. 授权 **DIAGRAM-1E（建议命名）**：Admin 插图上传 API → 写入 object/link 表 → `bump` 升版 → approved→draft。  
3. 人工 review passed → 再 approve。  
4. 抽题/开训验证 session 快照含图。  
5. **用户网页验收**（Admin 预览 + 学生端）仍待执行。

本报告 **不** 自动进入上传阶段。

---

## 8. 用户网页验收

**尚未执行。**  
本阶段仅离线资产；未重启服务、未部署验证插图读写路径。

---

## 9. 最终状态

```
MATH_REVIEW_PENDING
```

**停止。** 不得自动上传正式图，不得自动升版/重审/重批。
