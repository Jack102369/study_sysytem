# HS-MATH-BANK-GLOBAL-3A — 质量闭环报告

> 日期：2026-10-27  
> **最终状态：`BATCH_READY_FOR_IMPORT_PREFLIGHT`**（后续预检见 **`164` = `IMPORT_PREFLIGHT_PASS`**）  
> 权威候选：`question_bank/candidates-g3a-100.mjs`（3B 已继续修订）  
> **未写库 / 未上传 / 未 review·approve / 未 commit**  
> 独立性：`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`

---

## 1. 结论摘要

| 项 | 结果 |
|----|------|
| 配额 章/难度/题型 | **PASS**（6/10/12/14/16/14/4/14/4/6 · 35/40/25 · 30/15/10/20/25） |
| application rubric | **25/25** |
| numeric 协议 | **20/20** |
| KP / method | 缺 0；method 重复 0 |
| REQUIRED 图 7/7 | SVG+PNG；魔数/尺寸/安全标签 **PASS** |
| 批内去重 | **0** 完全重复 |
| vs 正式213+G1B+G2A | Round1 撞 2 题干 → 已改写；终态 **0** |
| 修复轮次 | **1 / 3**（配额微调 + 2 题去重） |
| 导入准备 | 字段对齐 G2A/G2F 适配形状；**可进入导入预检授权** |
| 独立终审 | **未建立** |

旁证：`bank_global3a/_g3a_validate_report.json` · `diagrams/required_g3a/_manifest.json`

---

## 2. 独立性声明

| 项 | 记录 |
|----|------|
| 出题 / 配图 / 本阶段质量检查 | **同一助手族系** |
| 标记 | **`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`** |
| 含义 | 作者侧闭环；**不得**包装为独立数学终审 |

---

## 3. 修复轮次

### Round 1

| 动作 | 结果 |
|------|------|
| 合并 ch01–05 + ch06–10 | 100 题 |
| 配额：5 题 d2→d1；037 judge→single | 35/40/25 · 题型达标 |
| 去重：034、052 改写题干/选项 | priorHits **0** |
| 生成 7 张 REQUIRED 图 | manifest 齐全 |
| 全批 `_g3a_validate.mjs` | **ok** |

### Round 2–3

未执行（Round 1 已满足退出条件）。

---

## 4. 数学质量要点

- 每题含 `analysis` + `authorMathNote`；numeric/application 经协议校验。  
- 抽检：048 \(\cos(\pi-\pi/3)=-0.5\) **PASS**。  
- 压轴 d=3 分布在应用题/综合几何等（如 055 SSA、068 向量证明、080–086 立体）；配额凑数虚标项在合并阶段以难度下调处理基础题。  
- application rubric 不设「照抄题干」得分点。

---

## 5. REQUIRED 插图

| code | PNG SHA256（前缀） | 要点 |
|------|-------------------|------|
| 048 | `09cff807…` | 单位圆终边 |
| 055 | `b79ba929…` | SSA 三角形 |
| 068 | `bf53651b…` | 平行四边形对角线 |
| 080 | `ddded6b9…` | 柱+锥 |
| 081 | `7ab70f1c…` | 正四面体 |
| 085 | `64a58fa3…` | 长方体线面角 |
| 086 | `384efb58…` | 正方体 MN |

均 1000×720、PNG 魔数 OK、≤2MiB、SVG 无危险元素；**未上传**。

---

## 6. 去重

| 对照集 | 结果 |
|--------|------|
| 批内 | 0 |
| 正式 drawable 213 + G1B/G2A 文件 stem | 初检 034/052 命中 → 已改；终检 **0** |

---

## 7. 导入准备情况

| 项 | 说明 |
|----|------|
| 字段 | 与 G2A 扁平候选一致，可复用 G2F 适配器映射 |
| 禁字段 | 候选不含 `status`/`contentVersion` |
| 下一步 | 另授权 **GLOBAL-3B/预检**（preview 结构实核）；**本阶段停止** |

---

## 8. 最终状态

```
BATCH_READY_FOR_IMPORT_PREFLIGHT
```

**停止。不自动进入正式导入。**
