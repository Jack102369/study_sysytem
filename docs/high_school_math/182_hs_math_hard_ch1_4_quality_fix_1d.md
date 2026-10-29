# 182 · HS-MATH-HARD-CH1-4-QUALITY-FIX-1D

> **最终状态：`HARD_IMPORT_PREFLIGHT_PARTIAL`**  
> **独立性：`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`**  
> **本阶段：离线修复 + 预检复跑**（无 MySQL 写入、无正式导入、无 Git）

---

## 1. 原 3 道 MATH_ISSUE

| ID | 处理 | 结果 |
|----|------|------|
| **039** | 整题重建：先分类 \(m(a)=\min(x^2+\lvert x-a\rvert)\)，再解 \(m(a)\ge a\) | 答案 **仅 \(a\le 0\)**；用 \(a=1\Rightarrow m=3/4\) 否定原 \(a\ge 1\)；**H2** |
| **073** | 废除「奇函数 + \(f(0)=1\)」；改为 \(f(x+2)=-f(x)\) + \([0,1]\) 一次支 | 答案 **`-1`**；numeric 合法；**H1** |
| **074** | 纠正复合对称：\(f(x+2)=-f(x)\)、\(f(x+4)=f(x)\)；改 **多选 A,B** | 否定原错误单选 B；**H2** |

---

## 2. 原 7 道 MODERATE_ONLY

| ID | 新结构（摘要） | 等级 |
|----|----------------|------|
| 026 | 定和定积参数化根号和值域（改 application） | H1 |
| 031 | 根差相容性 + 两正根范围 | H1 |
| 041 | 约束 \(a+b+ab=1\) 下最大化 \(ab\) 求倒数和最小 \(2+2\sqrt{2}\) | H2 |
| 065 | 改 judge：奇+严格增全称命题 | H1 |
| 081 | 幂差 \(=1\) 的根个数参数分类 | H1 |
| 082 | 奇+周期延拓求解析式与指定值 | H1 |
| 085 | 对勾水平线完整 \(N(m)\) 分类（改 application） | H1 |

均为**任务结构重建**，非换数/加长。

---

## 3. 原 5 道 numeric 协议

| ID | 处理 |
|----|------|
| 026 | → application |
| 033 | → application（保留 \(2^{1/3}+2^{2/3}\)） |
| 065 | → judge（`true`） |
| 073 | 仍为 numeric，答案 `-1` |
| 085 | → application |

**导入 dry-run：numeric 非法数 = 0；适配 100/100。**

---

## 4. H1/H2/H3 最终分布

| 等级 | n |
|------|---|
| H1 | **41** |
| H2 | **59** |
| H3 | **0** |

原 23 个作者 H3：内容重建或诚实降为 H1/H2；**不为凑数恢复 H3**。

---

## 5. 100 道数学实质复核（本阶段范围）

| 集合 | 结论 |
|------|------|
| 11 道整题重建 | 作者侧重推通过（041 曾误写最小值为 3，已改为 \(2+2\sqrt{2}\)） |
| 原 H3 降标题 | 标答未改内容者保留；等级已降 |
| 双遍 advisory MODERATE 残余 | **40 道**未在本阶段整题重建 → 记 **UNCERTAIN**（不得算 H1 合格） |

因此：**不能**报告全量 100×至少 H1 已独立证成。

---

## 6. application rubric

修复后 application **53** 道；重建题 rubric 分值和 = maxScore。离线仍为 `{step,score}`，导入映射器转 `{key,title,criteria,maxScore}`。

---

## 7. 整题重建数量

**11**（039,073,074,026,031,033,041,065,081,082,085）  
另 **17** 道仅 H 标签诚实降标（无内容改）。

---

## 8. 深度去重

vs 813：规范化题干精确碰撞 **0**（只读预检）。  
批内 modelFamily 无新增碰撞。  
残余风险：advisory 清单中的潜在低价值同构未清零。

---

## 9. REQUIRED 配图

重判 REQUIRED **0**；重建题部分 RECOMMENDED（039/081/085 等）。未新增离线必传图。

---

## 10. 100/100 导入适配

| 项 | 结果 |
|----|------|
| adapt 成功 | **100/100** |
| code/KP/method/章节 | 无缺失；与 813 无 code 冲突 |
| hardLevel | 已剥离；DB 无该列 |
| drawable 基线 | 813；335/478/0 |

---

## 11. 最终批次 SHA

`batchContentSha256` = **`64d35ea8aaa8f09db124032890ed9f2538f90c3d1a2ccc01a38ad62b419453a0`**

设计档案已同步 REVISED_FIX1D / H_RELABEL（`hard_ch1_4_designs.json`）。

---

## 12. 未解决问题

1. **40× ADVISORY_MODERATE_RESIDUAL / UNCERTAIN** — 阻断 FULL PASS  
2. 真实 H3 仍为 0（可接受，但若产品要压轴顶格需另开设计）  
3. 独立终审未建立  
4. 正式导入未授权  

---

## 13. 独立审核限制

`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`

---

## 14. 最终状态

# `HARD_IMPORT_PREFLIGHT_PARTIAL`

P0/P1 阻断（数学错误 / 明确 MODERATE / numeric）已处理且导入适配全绿，但双遍审查遗留的大量 advisory 低难度风险未在本阶段清零，**按授权不得虚标 PASS**。

### 停止声明

未写库、未导入、未改 813、未 Git。等待下一阶段：清零 advisory / 或授权接受残余风险策略 / 或正式导入（仍需单独授权）。

### 交付索引

| 文件 | 说明 |
|------|------|
| `182_…_quality_fix_1d.md` | 本报告 |
| `question_bank/hard_ch1_4_quality_fix_results.json` | 逐题台账 |
| `question_bank/hard_ch1_4_batch1a_candidates.mjs` | 修复后候选 |
| `question_bank/hard_ch1_4_import_preflight_results.json` | 复跑预检 |
| `question_bank/_hard14_fix_1d_replacements.mjs` | 重建源 |
