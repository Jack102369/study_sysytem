# 06 高一数学实施路线图（审查修订版）

---

## P0 — 最小可靠训练闭环（定稿）

**包含**：菜单/入口、专项目录与种子、管理训练题与审核、专项训练会话（快照/覆盖作答/提交判题/结果/历史）、会话级正确率、权限隔离、KaTeX、四题型。

**不包含**：每日、进阶、错题、掌握度、AI、表达式、解答题。

**题型**：single / multi / judge / numeric。

### 任务拆分

| ID | 任务 | 产出 |
|----|------|------|
| P0-T1 | migrate + init.sql 五表（+可选 grants）+ 种子 | SQL |
| P0-T2 | HsMathModule + taxonomy API | Nest |
| P0-T3 | grade v1 单测（四题型） | Nest |
| P0-T4 | train session 事务创建/覆盖作答/锁提交/脱敏 GET | Nest |
| P0-T5 | admin train-items CRUD + status | Nest |
| P0-T6 | Web 学生六页 + 菜单 | Vue |
| P0-T7 | Web 管理两页 + Settings 菜单 | Vue |
| P0-T8 | nginx 白名单 `hs-math` + 冒烟 | 运维 |
| P0-T9 | 测试清单执行（见 07） | QA |

### 验收（摘要）

见 `07_design_review.md` §9–10。

---

## P1 — 每日 + 错题 + KB + 学情

依赖 P0 快照可重建错题。建 wrong 表与回放；daily/advanced/analytics；KB；管理增强。

## P2 — 表达式 / 掌握度 / 进度

独立评估 mathjs；mastery 规则版本。

## P3 — AI 文案工厂

Adapter 包装 DeepSeek；禁止 AI 判题与生成即 approved。

---

## 依赖图

```
P0 ──► P1 ──► P2
         └──► P3
```

---

*编码须另开任务并【计划】确认。本文件不启动开发。*
