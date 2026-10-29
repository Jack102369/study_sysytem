# STEP_11 · 每日、错题、变式、提高与学习分析整合

| 字段 | 内容 |
|------|------|
| 步骤编号 | STEP_11 |
| 步骤名称 | 每日、错题、变式、提高与学习分析整合 |
| 开发目标 | 复用现有每日/错题/变式/提高/分析能力，不建平行系统 |
| 前置条件 | STEP_10 训练主路径可用 |
| 当前状态 | **COMPLETED**（代码层；真实 MySQL / 浏览器 E2E / 在线 AI：**未验证**） |
| 完成时间 | 2026-10-29 10:30:27 +08:00 |

---

## 计划工作

1. 确认每日/错题/提高挑战/分析对动态专项已支持  
2. 错题历史图形：经 wrong events → 会话快照（D046）  
3. 工业 AI 变式：审核仓路径，禁止直写 formal  
4. 管理员 KB bind（published only）  
5. 学习分析 industrialFocus + 专项聚焦  
6. 前端筛选/图复用/分析 UI  
7. 自检 + api/web build + 文档  

---

## 实际完成内容

### 每日基础巩固

- **复用** `ChemDailyReviewService`：正式题 eligibility 池动态含工业实验；无平行每日系统。  
- 开训走原会话 + STEP_10 `sessionDiagrams.snapshotForSavedItems`。  
- 无合格正式题 → 原有空态；**不**放宽 KB/池闸门。

### 错题复习

- 列表已支持 `specialtyCode` / `categoryCode`；前端补专项+分类筛选。  
- 详情 `history[].diagramAssets` 来自 `mapSnapshotsBySessionItemIds`；无快照不显示当前题库图。  
- `chem_wrong_events` 已有 `sessionId`/`sessionItemId` → **无新表**。

### 错题变式

- 学生「开始变式训练」：原 `createVariationSession`（仅已审核正式变式）。  
- 新增 `POST .../industrial-variation-candidate` → Mock/HTTP 生成 → 质检 → `createIndustrialReviewRecord`；`formalImportBlocked: true`；24h 去重。  
- **禁止** development_only / 未审核候选进入正式训练抽题。

### 提高 / 挑战

- **复用** `ChemAdvancedTrainService`（difficultyMode raise/challenge）；专项码可选 `industrial_experiment`。  
- 难度闸门不降；无题空态；会话快照不变。

### 学习统计 / 分析

- `ChemAnalyticsService`：`specialtyCode` 聚焦；`industrialFocus` 12 分类；无数据 ≠ 0%；样本少标记；确定性推荐。  
- 前端分析页：工业分类表 + 专项筛选。

### KB links

- `IndustrialKbBindService` + `POST .../kb-bind`（Admin）：仅 published；不伪造知识点；不放宽 eligibility。  
- 案例仍 draft/unverified 时保持空态（验收前置，非本步伪造）。

### 数据库

- **无新表/字段**（D046）。迁移顺序仍为 STEP_09 → STEP_10；真实库 **NOT_EXECUTED**。

---

## 实际修改文件（摘要）

- `chemistry.module.ts`（注册 Variation / KbBind）  
- `industrial-wrong-variation.service.ts`、`industrial-kb-bind.service.ts`  
- `industrial-review.controller.ts` / `dto`  
- `chem-wrong-question.controller.ts` / `service`（历史图）  
- `chem-analytics.service.ts` / `dto` / controller  
- 前端：错题列表/详情、分析页、`chemistry-train.ts`、`industrial-review.ts`  
- `industrial-step11.selftest.ts`、`package.json`  
- 文档：STEP_11 / PROGRESS / PLAN / ARCH / DB / DECISIONS(D046) / TEST / NEXT / FORMAL  

---

## 测试命令

```bash
pnpm --filter api run chem:industrial-step11-selftest
pnpm --filter api run chem:industrial-train-session-selftest
pnpm --filter api run chem:seed-selftest
pnpm --filter api run build
pnpm --filter web run build
```

---

## 测试结果

| 项 | 结果 |
|----|------|
| chem:industrial-step11-selftest | **PASS** |
| 既有 industrial + seed + train-session selftests | **PASS** |
| api build / web build | **PASS** |
| MySQL IT / 浏览器 E2E / 在线 AI | **NOT_EXECUTED** |

---

## 验收结果

代码层能力就绪；真实 MySQL IT / 浏览器 E2E / 在线 AI：**未验收**。

---

## 遗留问题

1. 正式工业题缺 KB links → 仍被 eligibility 排除（需管理员 kb-bind + 案例审核）  
2. D043/D045 真实库迁移未执行  
3. AI 变式正式训练依赖审核入库后的正式变式题量  

---

## 下一步建议

**STEP_12** 综合验收。勿提前 STEP_13。
