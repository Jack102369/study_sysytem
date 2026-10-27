# HS-MATH-BANK-GLOBAL-4A — 质量与闭环报告

> 日期：2026-10-27  
> **最终状态：`QUALITY_PARTIAL`**  
> 配对索引：`166_hs_math_bank_global4a_index.md`  
> 独立性：`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`（作者侧自检 ≠ 独立终审）

---

## 1. 门禁总表

| 门禁 | 结果 | 说明 |
|------|------|------|
| 规模 500 | PASS | `CAND-G4A-001…500` |
| 章节配额 | PASS | 29/48/55/67/76/67/20/68/30/40 |
| 难度配额 | PASS | 175/200/125 |
| 题型配额 | PASS | 150/75/50/100/125 |
| KP 命中 seed/DB 索引 | PASS | validate `kpMiss=0` |
| methodMain/Aux 词表 | PASS | `methodMiss=0` · `methodDup=0` |
| numeric 答案格式 | PASS | `numericBad=0` |
| application rubric | PASS | `rubricBad=0` · maxScore 与分项和一致 |
| 批内语义去重 | PASS | `batchDup=0` |
| vs 313+前三批题干 | PASS | `priorHits=0`（`_g4a_prior_stems.json`） |
| REQUIRED 配图 | PASS | 31/31 SVG+PNG+SHA 挂载 |
| 压轴综合性 | **PARTIAL** | 见 §3 |
| 题干自然度 | **PARTIAL** | 见 §3 |
| 独立审核 | **NOT ESTABLISHED** | 同族系作者侧 |

**综合判定：`QUALITY_PARTIAL`**  
（结构/配额/去重/配图已闭环；普通质量债未清零 → **不建议**在未修补前直接授权 4B 入库。）

---

## 2. 修复轮次（≤3）

| 轮 | 内容 | 结果 |
|----|------|------|
| R1 | 工厂加载错误（`rja-ch2.multi` 误插值 `b`）；全组生成；基础去重 | 500 产出；大量同构 stem |
| R2 | ch6/ch8 application 变体化；强化 diversify；REQUIRED 收敛 | validate ok；REQUIRED≈31 |
| R3 | 剥离「数据指纹」；挂载插图 SHA；合并 `candidates-g4a-500.mjs` | 指纹清零；改用「辅助/区分参数」留白句 → 仍记质量债 |

---

## 3. 未关闭的普通质量问题（QUALITY_PARTIAL 依据）

1. **题干去重留白句过多**  
   - 约 **333/500** 题干含「辅助参数 / 区分参数 / 不改变正确选项」类句子。  
   - 协议上可去重，但教学观感差；导入前应按章重写为真实参数变体。

2. **压轴（d3=125）综合性不足**  
   - 约 **70/125** 压轴仍带留白句。  
   - 工厂题偏「单点公式 / 浅综合」；未系统达到「多知识点串联」标准。  
   - **不得**仅靠加大计算量冒充压轴。

3. **同构模板占比高**  
   - 同 specialty+qtype 大量共享骨架，仅改数字或留白句。  
   - 语义去重已过；题感多样性仍偏弱。

4. **application 深度**  
   - rubric 齐全，但部分解答/分析偏短，评分细则可再钉死到具体中间量。

5. **RECOMMENDED 图未制作**  
   - 约 32 道 `RECOMMENDED`：本批仅强制闭环 REQUIRED；RECOMMENDED 可在 4B 前按需补。

以上均为**普通质量问题**（非数学硬错误 / 非协议崩坏 / 非安全问题）→ 故非 `BLOCKED`，亦未宣称 `BATCH500_READY_FOR_IMPORT_PREFLIGHT`。

---

## 4. 数学正确性（作者侧）

| 手段 | 说明 |
|------|------|
| 构造性作答 | 工厂题答案由参数推导（不等式解集、AM-GM、勾股模、柱锥体积等） |
| numeric 回归 | 答案匹配 `NUMERIC_RE` |
| 重点 REQUIRED | 柱锥/向量/中位线等与图一致且图不泄答案 |
| 残留风险 | 留白句题、短分析题、浅 d3 → 需人工或下轮脚本重写后复算 |

**mathVerified=`AUTHOR_CHECKED`**；**不得**表述为独立终审通过。

---

## 5. 配图质量

| 项 | 结果 |
|----|------|
| 数量 | 31 REQUIRED 全产出 |
| 格式 | SVG + PNG |
| 泄题 | 标注 R/H/h 或点名，**无**最终体积/模长数值 |
| 安全 | 无 script/foreignObject/外链 |
| 上传 | **未**上传正式库 |

---

## 6. 与完成标准对照

| 标准 | 判定 |
|------|------|
| `BATCH500_READY_FOR_IMPORT_PREFLIGHT` | **未达**（质量债未清） |
| `QUALITY_PARTIAL` | **采用** |
| `BLOCKED` | 否 |

---

## 7. 建议的后续修补（需另授权，属 4A 补丁或 4B 前置）

1. 批量去掉留白句，改为章内真实数值/条件变体（目标 crutch→0）。  
2. 重写 d3：每章至少保留多步综合题（函数+不等式 / 三角+向量 / 立体+截面等）。  
3. 抽检 50 道全题型人工复算。  
4. 再跑 `_g4a_validate.mjs all` 与去重。  
5. 通过后才申请 **GLOBAL-4B 导入预检**。

---

## 8. 停止声明

本阶段 **GLOBAL-4A 执行完成并停止**。  
**未**入库 · **未**启动第五批 · **未** git commit/push。
