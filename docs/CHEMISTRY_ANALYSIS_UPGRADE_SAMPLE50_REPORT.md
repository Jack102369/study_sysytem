# 化学旧题解析质量升级 · 全库扫描与首批50道样本

> 日期：2026-10-20  
> 性质：**只读扫描 + 候选解析文件**（**未写库**）  
> 声明：DeepSeek 辅助复核 ≠ 人工学科审核；PASS ≠ 已入库。

---

## 一、574 道旧题解析质量现状

### 圈定规则（与个人试运行一致）

- `pool=test` + `approved` + `is_active=1`
- 排除 `[trial_access:block]`
- **排除** 首批60道：`code LIKE train.ai_trial.s60.%` 或 `gate_note` 含 `[s60]`

**实查数量：574**（与预期一致）。题库总量仍为 **638**（574 旧 + 60 新）。

### 解析质量分布（不以字数分级）

| 等级 | 数量 | 含义 |
|------|------|------|
| **A** 无有效解析 | **498** | 主要是「来源 xxx 字段 yyy」式，无实际化学解释 |
| **B** 较弱 | **75** | 有部分化学词，但依据/推理不完整 |
| **C** 基本合格 | **1** | 短但依据明确（例：测试题「配平依据原子守恒。」） |
| **D** 优质 | **0** | — |

**边界校准：**  
短解析「配平依据原子守恒。」（长度9）判为 **C**，证明规则**未**按字数卡死。  
来源字段式无化合价/因果说明判为 **A**。抽检样本见 `analysis_audit_574.json` → `boundaryCalibrationSamples`。

结论：原有试运行题解析整体以**来源溯源备注**为主，**教学型解析几乎缺失**；与用户反馈一致。

---

## 二、各专项与难度的解析质量分布

### 按一级专项（节选）

| 专项 | 总量 | A | B | C | D |
|------|------|---|---|---|---|
| equation 化学方程式 | 218 | 172 | 45 | 1 | 0 |
| redox 氧化还原 | 111 | 97 | 14 | 0 | 0 |
| substance 物质性质 | 92 | 91 | 1 | 0 | 0 |
| memory 基础记忆 | 68 | 64 | 4 | 0 | 0 |
| periodic | 21 | 21 | 0 | 0 | 0 |
| comprehensive | 20 | 19 | 1 | 0 | 0 |
| ion | 18 | 14 | 4 | 0 | 0 |
| calculation | 8 | 5 | 3 | 0 | 0 |
| experiment | 7 | 4 | 3 | 0 | 0 |
| organic | 6 | 6 | 0 | 0 | 0 |
| structure | 3 | 3 | 0 | 0 | 0 |
| inference | 2 | 2 | 0 | 0 | 0 |

完整表：`analysis_audit_574.json` → `summary.bySpecialtyGrade`。

### 按库内 difficulty

| difficulty | 总量 | A | B | C | D |
|------------|------|---|---|---|---|
| 1 基础 | 407 | 366 | 40 | 1 | 0 |
| 2 提高 | 167 | 132 | 35 | 0 | 0 |
| 3 挑战 | 0 | — | — | — | — |

---

## 三、真实题目能力分布

（**仅标注，未改库内 difficulty**）

| 能力等级 | 数量 | 说明 |
|----------|------|------|
| 1 基础记忆 | **386** | |
| 2 单步知识识别 | **93** | |
| 3 简单条件分析 | **69** | |
| 4 多步骤推理 | **26** | |
| 5 综合分析 | **0** | 旧池中未标到 |

**difficulty 虚高：** 约 **86** 道 `difficulty=2` 但能力仍为单步识别（如 oxidant/reductant 单选题模板），`difficultyInflated=true`。  
解析深度按能力等级，不按虚高 difficulty 硬凑多步骤。

---

## 四、首批50道解析升级情况

### 覆盖

| 项 | 结果 |
|----|------|
| 样本数 | **50** |
| 基础(d1) / 提高(d2) | **30 / 20** |
| 原解析为 A 类 | **46** |
| 一级专项数 | **10**（≥8） |
| 专项列表 | equation, redox, ion, calculation, experiment, substance, memory, inference, comprehensive, organic |

优先8专项均已覆盖；inference 全库仅2道，本批取满2道。substance/comprehensive 因 A 类存量大、填配额时略多，报告如实记录。

### 生成方式

- **主路径：** 题目链接知识库字段 + 确定性模板（按专项/题型）
- **结构：** 基础/单步 → 简洁三段式；较高能力 → 结构化多段
- **保护：** 每题完整快照题干/选项/答案/原 analysis；**未写库**

文件：`docs/chemistry_analysis_upgrade/sample50_candidates.json`

---

## 五、科学性与答案一致性审核结果

### 综合评级（确定性核验 + DeepSeek 辅助）

| 结果 | 数量 |
|------|------|
| **PASS** | **30** |
| **NEEDS_FIX** | **17** |
| **HOLD** | **3** |
| **REJECT** | **0** |

### DeepSeek 辅助

- 50/50 均已调用成功（failed=0）
- **≠ 人工学科审核**
- **不能**覆盖确定性硬规则（如候选解析漏写标准答案）
- 3 道因 AI 指出题干残缺/模板答非所问/原理未展开 → **HOLD**

HOLD 示例：

| id | code | 原因摘要 |
|----|------|----------|
| 215 | kp_misconception…solution | 题干表述残缺，无法可靠判正误 |
| 49 | fm_stp | 解析模板与「22.4 仅标况」题型错位 |
| 248 | kp_misconception…Fe.test | 未展开 Fe²⁺/KSCN 显色要点 |

文件：`sample50_quality_results.json`

---

## 六、发现的题目本身风险

- 扫描阶段：未批量打 `VERIFY_BLOCKED` 风险（0）
- 样本核验追加：见 `question_risk_list.json` → `sample50Extra`
- 典型问题：**题干过简/残缺**、**通用模板未贴合题型** —— 已 HOLD，**禁止**用漂亮解析掩盖

本阶段**未**修改题干、答案、difficulty、分类、关联、准入、原 analysis。

---

## 七、下一阶段批量升级建议

1. **可安全进入「待入库白名单」候选：** 本批 **30** 道 PASS（仍须人工抽检后再 UPDATE analysis）  
2. **先修再评：** 17 道 NEEDS_FIX（补计算步骤、贴合题型、减少套话）  
3. **暂缓：** 3 道 HOLD（先修题干/知识点或换样本）  
4. 剩余约 **524** 道 A/B 类：建议按专项分批（equation → redox → substance → memory → …）  
5. 对 `difficultyInflated` 题目：升级解析时用简洁结构，另案评估是否调整 difficulty（**本阶段不动**）

---

## 八、预计分几批完成剩余题目

| 批次建议 | 范围 | 约题量 |
|----------|------|--------|
| 本批 | 样本50（候选） | 50 |
| Batch2 | equation A 类 | ~170 |
| Batch3 | redox + ion | ~110 |
| Batch4 | substance + memory | ~150 |
| Batch5 | 其余专项 + B 类润色 | ~90 |
| 收尾 | NEEDS_FIX/HOLD 返修 | 视情况 |

合计约 **5～6 批**可覆盖旧池；每批仍建议「规则生成 → DeepSeek 辅助 → 抽检 → 确认后写库」。

---

## 九、是否建议增加解析质量准入标准

**建议增加（正式池 / 新题入库）：**

1. 禁止仅「来源 code + 字段名」作为对学生可见的 `analysis`
2. 最低要求：能说明**为何该答案正确**的化学依据（短亦可）
3. 提高/多步骤题：须有突破口或步骤；计算题须有可复核算式
4. 来源溯源可保留在 `gate_note` 或管理字段，与教学解析分离

试运行存量可分批升级，不阻塞训练入口。

---

## 十、交付文件清单

| 路径 | 说明 |
|------|------|
| `docs/chemistry_analysis_upgrade/analysis_audit_574.json` | 574 题扫描 |
| `docs/chemistry_analysis_upgrade/sample50_candidates.json` | 50 道候选（含原题快照） |
| `docs/chemistry_analysis_upgrade/sample50_quality_results.json` | 逐题评级 + DeepSeek |
| `docs/chemistry_analysis_upgrade/question_risk_list.json` | 风险清单 |
| `docs/chemistry_analysis_upgrade/analysis_upgrade_summary.json` | 汇总 |
| `docs/chemistry_analysis_upgrade/scan_analysis_574.js` | 只读扫描脚本 |
| `docs/chemistry_analysis_upgrade/build_and_verify_sample50.js` | 选样/生成/核验脚本 |
| `docs/chemistry_analysis_upgrade/lib_common.js` | 公共只读工具 |

**数据库：无任何写操作。**

---

## 十一、下一指令建议

1. 人工抽检 30 道 PASS 后，确认再执行「仅更新 analysis」迁移（另开任务）  
2. 修复 17 道 NEEDS_FIX 模板贴合问题  
3. 处理 HOLD 题干质量（独立任务，勿混在解析升级）  
