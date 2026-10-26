    # 独立数学审核 · 题目材料（只读摘录）

    > 来源：MySQL `study_system` 当前正式行（只读 SELECT）。
    > 图片：同目录 PNG。**请实际打开图片**，勿仅凭文字材料判断。
    > 本文件不含作者自检结论。

    生成时间（UTC）：2026-10-26T12:28:00.546Z

    ---

    ## CAND-G1B-093

    | 字段 | 值 |
    |------|-----|
    | itemId | 244 |
    | qtype | application |
    | difficulty | 3 |
    | status | **approved** |
    | contentVersion | **1** |
    | pool / active | formal / 1 |
    | 图片文件 | `CAND-G1B-093.png` |
    | PNG SHA256 | `e12b2f2b2373d4545c6a79af55caa1f0c85c7d83f7b29d8a2cc5132671fe33f1` |
    | PNG 尺寸 | 1000×720 · 26172 bytes |

    ### 题干

    正方体 $ABCD-A_1B_1C_1D_1$ 中，证明 $BD_1\perp$ 平面 $A_1C_1D$（写出关键步骤）。

    ### 选项

    _无选项（非选择题）_

    ### 标准答案 / Rubric

    应用题标准答案：$BD_1\perp A_1C_1$ 且 $BD_1\perp A_1D$，故 $BD_1\perp$ 平面 $A_1C_1D$。
    满分：10
    Rubric：
      - `l1` 证一条：$BD_1\perp A_1C_1$（4分）
      - `l2` 证另一条：$BD_1\perp A_1D$（4分）
      - `c` 结论：线面垂直（2分）

    ### 解析

    在正方体中可证 $BD_1\perp A_1C_1$（数量积为 $0$），且 $BD_1\perp A_1D$。两相交直线 $A_1C_1$、$A_1D$ 均在平面 $A_1C_1D$ 内，由线面垂直判定得 $BD_1\perp$ 平面 $A_1C_1D$。

    ---

    ## CAND-G1B-080

    | 字段 | 值 |
    |------|-----|
    | itemId | 231 |
    | qtype | application |
    | difficulty | 3 |
    | status | **approved** |
    | contentVersion | **1** |
    | pool / active | formal / 1 |
    | 图片文件 | `CAND-G1B-080.png` |
    | PNG SHA256 | `c01574e808ba150866781d4fd716348fb3331359c635ae5f1a4b46f137ef31fc` |
    | PNG 尺寸 | 1000×720 · 25377 bytes |

    ### 题干

    用向量证明：平行四边形对角线互相平分（设 $\vec{AB}=\vec a$，$\vec{AD}=\vec b$）。

    ### 选项

    _无选项（非选择题）_

    ### 标准答案 / Rubric

    应用题标准答案：对角线交点对应向量为 $\frac{\vec a+\vec b}{2}$，即中点。
    满分：10
    Rubric：
      - `diag` 对角线：$\vec a+\vec b$（4分）
      - `mid` 中点：平分（4分）
      - `cl` 表述：清晰（2分）

    ### 解析

    设 $\vec{AB}=\vec a$，$\vec{AD}=\vec b$。对角线 $\vec{AC}=\vec a+\vec b$，中点满足 $\vec{AM}=\dfrac12(\vec a+\vec b)$；另一对角线中点同样为 $\dfrac{\vec a+\vec b}{2}$。交点重合，故互相平分。

    ---

    ## CAND-G1B-064

    | 字段 | 值 |
    |------|-----|
    | itemId | 215 |
    | qtype | application |
    | difficulty | 3 |
    | status | **draft** |
    | contentVersion | **2** |
    | pool / active | formal / 1 |
    | 图片文件 | `CAND-G1B-064.png` |
    | PNG SHA256 | `a3549131d845107b4c795242013f50beb048639b056b1c302e79276dc8b4abf7` |
    | PNG 尺寸 | 1000×720 · 20372 bytes |

    ### 题干

    塔高测量：距塔底 $40\text{m}$ 处测得塔顶的仰角为 $30^\circ$，求塔高（精确值）。

    ### 选项

    _无选项（非选择题）_

    ### 标准答案 / Rubric

    应用题标准答案：$h=\dfrac{40\sqrt3}{3}\text{m}$。
    满分：10
    Rubric：
      - `model` 模型：$\tan30^\circ$（4分）
      - `calc` 计算：$40\sqrt3/3$（4分）
      - `u` 单位：m（2分）

    ### 解析

    直角三角形中，仰角 $30^\circ$，邻边（水平距离）为 $40$，对边为塔高 $h$。故 $h=40\tan30^\circ=40\cdot\dfrac{\sqrt3}{3}=\dfrac{40\sqrt3}{3}\text{m}$。

    ---

    ## CAND-G1B-091

    | 字段 | 值 |
    |------|-----|
    | itemId | 242 |
    | qtype | single |
    | difficulty | 3 |
    | status | **approved** |
    | contentVersion | **1** |
    | pool / active | formal / 1 |
    | 图片文件 | `CAND-G1B-091.png`（**1E 新版**：已去 90°/45°/135° 文字） |
    | PNG SHA256 | `a77867e8beb43226cd1e230b043151a00e851f560026d7882c15b0a5584f19f8` |
    | PNG 尺寸 | 1000×720 · 26916 bytes |

    ### 题干

    斜二测画法画水平放置的平面图形时，下列说法正确的是

    ### 选项

    - **A**：原坐标系中 $\angle xOy=90^\circ$；直观图中 $\angle x'O'y'$ 通常取 $45^\circ$ 或 $135^\circ$
    - **B**：原坐标系中 $\angle xOy=45^\circ$；直观图中 $\angle x'O'y'=90^\circ$
    - **C**：原坐标系与直观图中两轴夹角均为 $45^\circ$
    - **D**：原坐标系与直观图中两轴夹角均为 $90^\circ$

    ### 标准答案 / Rubric

    单选：`A`

    ### 解析

    斜二测须区分两套角：①原水平面坐标系中 $\angle xOy=90^\circ$（直角）；②画成直观图后，教材约定 $\angle x'O'y'$ 通常取 $45^\circ$ 或 $135^\circ$（两种摆放同属合法约定，不可与原直角混谈）。另：$O'z'$ 轴竖直；平行于 $x$、$z$ 轴的线段长度不变，平行于 $y$ 轴的线段取原来的 $\dfrac12$。故只有 A 同时正确表述原角与直观图角。B 把两角对调；C、D 把两套角说成相同，均错。选 A。
