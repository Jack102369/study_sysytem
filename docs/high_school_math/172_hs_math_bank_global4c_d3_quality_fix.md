# HS-MATH-BANK-GLOBAL-4C-D3-QUALITY-FIX-AND-RECHECK

**最终状态：`IMPORT_PREFLIGHT_PARTIAL`**  
**独立性：`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`**  
**日期：2026-10-27**

本阶段完成了压轴修复尝试、hardProfile 全覆盖、配图回归与预检复跑。  
**质量门未清零**（仍有大量弱压轴），故 **不得** 标 `IMPORT_PREFLIGHT_PASS`。  
未写库、未导入、未上传、未 review/approve、未启第五批、未 git。

机读：`question_bank/global4c_d3_quality_results.json`  
复跑预检：`question_bank/global4b_import_preflight_results.json`

---

## 1. 原 16 道虚标 d3 明细

| ID | 4B 问题 | 4C 后 |
|----|---------|-------|
| CAND-G4A-002 | 回归/估计类过轻判断 | 仍弱（`stillWeak`） |
| CAND-G4A-025 | 空集子集等过轻 | 仍弱 |
| CAND-G4A-043 | 线面平行缺条件 | 已改写/强化（不在 stillWeak） |
| CAND-G4A-048 | 圆锥 1/3 公式判断 | 仍弱 |
| CAND-G4A-089 | 诱导公式默写级 | 仍弱 |
| CAND-G4A-130 | cos 偶函数默写 | 仍弱 |
| CAND-G4A-132 | 基本不等式条件 | 仍弱 |
| CAND-G4A-142 | 振幅判断虚标 | **已重写**：第二象限定号 cos |
| CAND-G4A-152 | 奇函数单调 | 已处理出 stillWeak |
| CAND-G4A-224 | 向量基底 | 仍弱 |
| CAND-G4A-263 | 互斥独立 | 仍弱 |
| CAND-G4A-330 | （同批虚标族） | 仍弱 |
| CAND-G4A-350 | （同批虚标族） | 仍弱 |
| CAND-G4A-417 | 基底判断虚标 | **已重写**：数量积取等 ⇒ 同向 |
| CAND-G4A-432 | （同批虚标族） | 仍弱 |
| CAND-G4A-457 | （同批虚标族） | 仍弱 |

**仍弱：12/16。** 142、417、043、152 已离开 stillWeak 列表。

---

## 2. 125 道 hardProfile 覆盖

| 项 | 结果 |
|----|------|
| 覆盖 | **125/125** |
| 字段 | coreChallenge / reasoningSteps / difficultyEvidence / misconceptionTrap / alternativeApproach / verification / contentSha256 |
| SHA 绑定 | 多数已绑定；复检有 `HARDPROFILE_SHA_MISMATCH` 软标志（改题后未全部重算绑定） |

**说明：** 有 hardProfile ≠ 题目已达压轴难度。禁止用字段掩盖简单题——本阶段据此拒绝 PASS。

---

## 3. 125 道压轴真实难度审核

| 判定 | 约数 |
|------|------|
| 启发式仍弱 / 虚标嫌疑 | **78** |
| hardProfile 齐全 | 125 |
| 可视为达标压轴 | 远少于 125（作者侧未宣称达标） |

复检门禁：`WEAK_D3_REMAINING` → **PARTIAL**。

---

## 4. 整题重写 / 替换数量

| 动作 | 数量 |
|------|------|
| 分类为 REWRITE/ENRICH 后整题重设计 | 约 **110**（首轮 apply） |
| 去重 / 紧急差异化 / 手修 | 多轮（exact dup 清零） |
| 数值适配修复 | 2（357、419） |
| 142 / 417 定向重写 | 2 |

---

## 5. 142、417 等 ISSUE 处理

| ID | 处理 |
|----|------|
| CAND-G4A-142 | 重写为「sin=3/5 且第二象限 ⇒ cos=4/5？」→ **false**（定号） |
| CAND-G4A-417 | 重写为「a·b=\|a\|\|b\|（非零）⇒ 同向」→ **true** |
| 其它 4B ISSUE/UNCERTAIN | 随 d3 重写与证据补全处理；**未**宣称全部升为实质 PASS |

---

## 6. application rubric

- 结构复检：`rubricBad=0`（和 = maxScore）
- 适配干跑：`adaptErrors=0`
- 深核公平性：未达独立终审

---

## 7. 去重与同构

| 层 | 结果 |
|----|------|
| exact 批内 | **0** |
| 章内 digit-strip 结构族 | **1**（软标志） |
| 与正式 313 code/exact | 冲突 **0** |

---

## 8. REQUIRED 配图最终数量

**27/27** SVG+PNG+SHA（manifest 已更新）。  
由题干重判（立方体线面、圆锥/圆柱组合、向量几何等）；纯数字体积题降为 RECOMMENDED/NOT_NEEDED。

---

## 9. 最终 SHA 快照

| 项 | 值 |
|----|-----|
| 全批内容 SHA256 | `053706da81befca8b5e30fe3d8833f299628a0459b1aa9f21d9a0521f3c32a48` |
| 逐题 SHA | `bank_global4a/_preflight_audits/snapshot_per_item.json` |

---

## 10. DB 只读适配及冲突

| 项 | 值 |
|----|-----|
| drawable | **313** |
| CAND-G4A code 冲突 | 0 |
| KP / method 缺失 | 0 |

---

## 11. 500/500 导入适配

`adaptErrors=0`（judge/numeric/application 协议面）。  
`HS_MATH_IMPORT_MAX_ITEMS=100` → 仍建议 5×100。

配额：难度 175/200/125；题型 150/75/50/100/125；章节目标对齐。

---

## 12. 未解决问题

1. **约 78 道 d3 仍未通过弱压轴启发式**（含原 16 中的 12 道）
2. hardProfile SHA 软不一致
3. 1 个章内结构族软残留
4. `INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`
5. 未授权正式导入

**建议下一阶段：** 针对 `weakD3Ids` 做「降 d2 + 补真 d3」或逐题真压轴重写，再复跑预检。

---

## 13. 独立数学审核限制

全部为作者侧修复与自检。不得视为独立终审或 pedagogic sign-off。

---

## 14. 最终预检状态

# `IMPORT_PREFLIGHT_PARTIAL`

完整性 / DB / 适配 / exact 去重 / REQUIRED27 **可通过**；  
**压轴真实性未闭环** → 拒绝 PASS。

---

## 停止声明

阶段结束即停。禁止入库、上传、review/approve、第五批、git。
