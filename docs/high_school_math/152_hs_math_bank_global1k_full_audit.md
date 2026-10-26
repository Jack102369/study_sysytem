# HS-MATH-BANK-GLOBAL-1K — 第一批 100 道正式题全量独立数学质量审计

> 日期：2026-10-26  
> **最终状态：`FULL_AUDIT_PASS`**  
> 对象：MySQL `study_system` 当前正式行 `CAND-G1B-001` … `100`  
> **只读**：未改题、未写库、未 review/approve、未上传图、未建 session、未调真实 AI

---

## 1. 结论摘要

| 项 | 结果 |
|----|------|
| 覆盖 | **100 / 100** 逐题复核（`UNAUDITED=0`） |
| CRITICAL | **0** |
| MAJOR | **0** |
| MINOR | **2**（022 rubric 冗余；093 解析未展示点积） |
| PASS | **98** |
| 门禁 | 全 approved · review 有效 · fp 匹配 · drawable **113** · 四题配图 SHA 与 147/148 一致 |
| REQUIRED 插图 | **4 / 4** 满足 |
| RECOMMENDED→REQUIRED | **0**（仍均可无图求解） |
| 去重 | 批内 / 相对原 13 题：无内容级重复；KP 最大频次 2 |
| **独立性** | **未充分建立**（与 1F/1H/1J/配图同助手族系；见 §2） |
| **状态** | **`FULL_AUDIT_PASS`** |

逐题明细：`question_bank/global1k_audit_results.json`  
导出旁证：`question_bank/_g1k_export_snapshot.json`

---

## 2. 独立性声明（强制）

本阶段审核主体与本仓库此前 GLOBAL-1F 质量复核、1H 正式审核、1J 配图审计、DIAGRAM-1F/1G 链路为**同一助手族系**。

因此：

- **不能**宣称第三方独立审计已完成；
- 本文件是对**当前库内版本**的二次全量数学复核与门禁核对；
- 若需真正独立结论，须另授权外部审题人。

不得用原 `mathVerified` / 作者自检 / 旧 analysis **代替**本轮推导。本轮每题均要求独立推导字段（见 JSON `independentDerivation`）。

---

## 3. 审计对象与门禁（只读）

| 检查 | 结果 |
|------|------|
| code `CAND-G1B-001`…`100` | **恰好 100**；无缺失；无重复 code |
| status / pool / active | 全部 `approved` · `formal` · `is_active=1` |
| contentVersion | cv1=**94**；cv2=**5**（含 037/074/080/091/093 等）；cv3=**1**（**064**） |
| contentFingerprint | 与当前内容重算一致；有效 review 均 `passed` 且 fp 匹配 |
| drawable | **113** |
| 配图四题 SHA | 093 `e12b2f2b…` · 080 `c01574e8…` · 064 `a3549131…` · 091 `a77867e8beb4…` 均匹配 |

题型分布：single 34 · multi 7 · judge 16 · numeric 19 · application **24**。

---

## 4. 分级汇总

| 结果 | 数量 | codes |
|------|-----:|-------|
| PASS | 98 | （其余） |
| MINOR | 2 | **022**、**093** |
| MAJOR | 0 | — |
| CRITICAL | 0 | — |

### 4.1 MINOR 明细

| code | 理由 | 数学结论 |
|------|------|----------|
| **022** | 题干已给出 \(S(x)=x(10-x)\)，rubric 仍为「写出 \(S(x)\)」计 3 分 → 评分设计冗余 | 最大值 \(25\)（\(x=5\)）正确 |
| **093** | 解析断言线面垂直但未写出点积验算步骤（教学完整度） | 坐标重算 \(\overrightarrow{BD_1}\cdot\overrightarrow{A_1C_1}=\overrightarrow{BD_1}\cdot\overrightarrow{A_1D}=0\)；答案/rubric/配图正确 |

二者**不构成**答案错误或门禁阻断。

---

## 5. 五题型与 24 道 application

| 题型 | 口径 | 结论 |
|------|------|------|
| single | 逐项验证选项；唯一正确项 | 无 CRITICAL/MAJOR |
| multi | 正确集合完整（含 037/074） | 037=ABD；074=ABC；通过 |
| judge | 真假 + 反例意识 | 通过 |
| numeric | 独立计算与等价形式 | 通过 |
| application | 完整解法 + rubric 分项和=满分 | 24 道分项和均等于 maxScore；无阻断性误判规则 |

抽核示例：

- **012**：\(L=12x-150\)，\(x\ge13\)  
- **064**：\(h=40\tan30^\circ=40\sqrt3/3\)（仰角题干 + 配图）  
- **080**：对角线中点均为 \((\vec a+\vec b)/2\)  
- **093**：线面垂直判定成立  
- **098**：\(P=3/5\)

未调用真实 AI 批改学生作答。

---

## 6. 配图专项

### 6.1 REQUIRED 四题（已入库）

| code | cv | 图 | 与题干 | 泄题 | review/approve |
|------|----|----|--------|------|----------------|
| 093 | 2 | SHA 匹配 | 正方体 BD₁ / 平面 A₁C₁D | 无结论字样 | 有效 |
| 080 | 2 | SHA 匹配 | 平行四边形向量示意 | 无「互相平分」结论 | 有效 |
| 064 | 3 | SHA 匹配 | 仰角 30° / 40m | 无结果数值 | 有效 |
| 091 | 2 | SHA 匹配（无角度数字） | 两套坐标系示意 | 不圈选选项 | 有效 |

### 6.2 原 RECOMMENDED（19）

全部维持 **RECOMMENDED**：题干数据自洽，无图仍可解；**无**提升为 REQUIRED。  
（134 文档写「20」与枚举 19 码差 1，本轮以枚举清单为准。）

未上传任何图片。

---

## 7. 去重

| 范围 | 结果 |
|------|------|
| 批内指纹/软题干 | 无相同指纹对；无换壳克隆 |
| vs 原 13 道非 G1B 正式题 | 无指纹/软题干命中 |
| 同法低价值 | 067↔083（3-4-5 模长主题邻近，非重复）；095↔100（频率叙述邻近） |
| KP 集中度 | 主 KP 最大出现 **2** 次；无 ≥3 堆叠 |

---

## 8. 未执行 / 禁止事项（已遵守）

- 未修改正式题目 / 答案 / 解析  
- 未上传图片、未 review/approve、未写 MySQL、未迁移  
- 未创建训练 session、未调真实 AI、未改配置、未重启、未 git commit/push  
- **未**自动进入第二批导入  

---

## 9. 状态判定

满足：

- 100 题逐题复核完成  
- CRITICAL=0 · MAJOR=0 · MINOR 已逐项记录  
- 审核/来源/指纹门禁正常 · drawable=113  
- REQUIRED 插图 4/4 · application rubric 无阻断  

→ **`FULL_AUDIT_PASS`**

附带约束：§2 独立性未充分建立——交付时必须保留该声明。

**完成后停止。**
