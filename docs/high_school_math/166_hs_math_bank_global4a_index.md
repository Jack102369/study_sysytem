# HS-MATH-BANK-GLOBAL-4A — 第四批 500 候选索引

> 日期：2026-10-27  
> **最终状态：`QUALITY_PARTIAL`**  
> 正式 drawable：**313**（本阶段 **未写库**）  
> 独立性：`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`  
> **未** import / upload / review / approve / 迁移 / 真实 AI / git commit·push / 第五批

---

## 1. 结论摘要

| 项 | 结果 |
|----|------|
| 候选规模 | **500**（`CAND-G4A-001`…`500`） |
| 章节配额 | 29/48/55/67/76/67/20/68/30/40 = **500** |
| 难度配额 | 基础 175 · 提高 200 · 压轴 125 |
| 题型配额 | single150 · multi75 · judge50 · numeric100 · application125 |
| 结构/去重校验 | `_g4a_validate.mjs all` → **ok=true**（batchDup0 · priorHits0 · numericBad0 · rubricBad0 · kpMiss0） |
| REQUIRED 插图 | **31/31** SVG+PNG · `diagrams/required_g4a/_manifest.json` |
| 分组落盘 | `bank_global4a/g4a_group01…05.mjs` |
| 合并权威文件 | `question_bank/candidates-g4a-500.mjs` |
| **状态** | **`QUALITY_PARTIAL`**（配额/去重/配图闭环完成；仍有普通质量债，见 167） |

---

## 2. 产物路径

| 类型 | 路径 |
|------|------|
| 合并候选 | `docs/high_school_math/question_bank/candidates-g4a-500.mjs` |
| 分组 | `…/bank_global4a/g4a_group01.mjs` … `g4a_group05.mjs` |
| 槽位 | `…/bank_global4a/_slots_g1…5.json` · `_g4a_slots.json` |
| 工厂/去重 | `_g4a_factories.mjs` · `_g4a_diversify.mjs` · `_g4a_generate_group.mjs` |
| 校验 | `question_bank/_g4a_validate.mjs` · `bank_global4a/_g4a_validate_all.json` |
| 先验题干 | `question_bank/_g4a_prior_stems.json`（313+既有） |
| 基线只读 | `question_bank/_g4a_baseline_ro.json` |
| REQUIRED 图 | `docs/high_school_math/diagrams/required_g4a/`（31 对 SVG/PNG + `_manifest.json`） |
| 质量报告 | `167_hs_math_bank_global4a_quality.md` |

---

## 3. 分组执行记录

| 组 | ID 范围 | 落盘 | QC | 修复轮次（组内） |
|----|---------|------|-----|------------------|
| G4A-01 | 001–100 | `g4a_group01.mjs` | `_qc_group01.json` | ≤3（脚本 R1–R3） |
| G4A-02 | 101–200 | `g4a_group02.mjs` | `_qc_group02.json` | ≤3 |
| G4A-03 | 201–300 | `g4a_group03.mjs` | `_qc_group03.json` | ≤3 |
| G4A-04 | 301–400 | `g4a_group04.mjs` | `_qc_group04.json` | ≤3 |
| G4A-05 | 401–500 | `g4a_group05.mjs` | `_qc_group05.json` | ≤3 |

---

## 4. REQUIRED 插图（31）

见 `diagrams/required_g4a/_manifest.json`。类型覆盖：柱锥组合、圆锥轴截面、长方体对角线、正方体挖柱、向量 OA/OB/AB、中位线、重心、平行四边形对角线。  
**未**上传正式附件库；PNG SHA 已写入候选 `diagramSpecification.expectedPngSha256`。

---

## 5. 授权边界复核

| 允许 | 结果 |
|------|------|
| 只读 `study_system` | 基线脚本已用 |
| 离线生成/修改第四批候选 | 是 |
| 离线教学插图 | 是（required_g4a） |
| 质检/去重脚本 | 是 |
| 更新 166/167 / HANDOFF | 是 |

| 禁止 | 遵守 |
|------|------|
| 写正式库 / 改 313 / 上传正式图 / review·approve / 迁移 / 真实 session / Qwen·DeepSeek / AI 配置·重启 / git commit·push / 他科 | **均未执行** |

---

## 6. 下一步（需另授权）

1. 针对 167 所列质量债做定向修补（或接受后做导入预检）  
2. **HS-MATH-BANK-GLOBAL-4B** 导入预检（未授权）  
3. 独立主体抽检  
4. 第五批（**未授权**）

**执行完成即停止：不自动入库，不启动第五批。**
