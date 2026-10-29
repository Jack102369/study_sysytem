# 高一数学模块 · 项目交接文档

> **用途**：新建对话时先读本文。  
> **维护**：`.cursor\rules\hs-math-handoff.mdc`

---

## 1. 项目目标

应用题多模态 + 学生训练入口；全10章题库向 **3120** 目标推进。  
**当前执行阶段**：**HS-MATH-TRAIN-TRUE-H3-FILTER**  
**当前阶段状态**：`PASS`  
**正式 drawable**：**926**  
**库内难度**：**d1=335 / d2=478 / d3=113**  
**独立性：`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`**

---

## 2. 技术要点

| 项 | 说明 |
|----|------|
| 真 H3 筛选 | `createSession.trueH3Only` → `code LIKE 'CAND-H3%'`（当前 13 道 `CAND-H3C14-*`） |
| 压轴 | 全部 `difficulty=3`（含 HARD14 + 真 H3，约 113） |
| UI | 难度四档：基础 / 提高 / 压轴 / **真 H3**；章节「本章压轴（H3）」→ `?trueH3=1` |
| 空池 | 真 H3 仅部分章节有题；后端文案「暂无已批准的真 H3 题目」 |
| Plan B | `hard_level` 列 **未做**；前缀约定为过渡 |

---

## 4. 已完成阶段（节选）

- TRAIN-TRUE-H3-FILTER = **PASS**  
- TRAIN-CHAPTER-H3-PLAN-A = **PASS**（整章可空 + UI）  
- H3-FORMAL-IMPORT-204-4H-MICRO = **PASS**（204→1087）  

---

## 5–7. 本阶段结果

| 项 | 值 |
|----|-----|
| API | `trueH3Only` 可选 boolean |
| 题库 | **未改**（926 / d3=113；真 H3 drawable 仍 13） |
| DB schema | **无变更** |

---

## 8. 数据库状态

| 项 | 值 |
|----|-----|
| drawable | **926** |
| d1/d2/d3 | **335 / 478 / 113** |
| CAND-H3C14 approved | **13** |
| session.category_id | **NULL 允许**（Plan A） |
| LAST_VERIFIED | 2026-10-28（TRUE-H3-FILTER） |

---

## 10. 待授权

1. 继续真 H3 扩写 / 预检 / 导入  
2. Plan B（独立 `hard_level`）— 未做  
3. Git — **未授权**

---

## 12. 下一步

**停止。** 可验收：训练设置选「真 H3」→ 仅 `CAND-H3*`；选「压轴」仍可抽 HARD14。

---

## 变更日志

| 日期 | 阶段 | 摘要 |
|------|------|------|
| 2026-10-28 | TRAIN-TRUE-H3-FILTER | `trueH3Only` + UI 四档；前缀 `CAND-H3%` |
| 2026-10-28 | TRAIN-CHAPTER-H3-PLAN-A | 会话 category 可空；选章/整章开训 |
| 2026-10-28 | H3-FORMAL-IMPORT-204-4H-MICRO | 204→itemId **1087**；drawable 925→926 |
