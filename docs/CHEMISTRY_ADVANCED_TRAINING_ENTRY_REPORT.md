# 提高与挑战训练入口 · 实施报告

> 日期：2026-10-20  
> 状态：**已完成并冒烟通过**  
> 声明：个人试运行入口 ≠ 人工学科审核 ≠ 正式池上线。

---

## 1. 背景与根因

原专项训练设置页在**测试池**下，当所选难度无题时会回退到同分类其他难度凑数。  
典型误导：方程式配平仅有基础 5 道，提高/挑战也会显示「可用 5 道」。

**本次硬修复**：正式池与测试池均按 `difficulty` **精确匹配**；无题则 `availableCount=0`，禁止回退。

---

## 2. 交付摘要

| 项 | 说明 |
|----|------|
| 难度严格执行 | 专项：1/2/3 精确；提高与挑战：raise=2、challenge=3、mix=2+3（约 70:30，不足可互调），**永不抽 difficulty=1** |
| 可用 vs 计划 | 设置页分开显示「当前可用」与「计划训练题量」 |
| 新入口 | 首页「提高与挑战训练」→ `/chemistry/advanced` |
| 组卷选项 | 提高/挑战/混合；全部或单专项；二级分类；全部可用或首批60道；5/10/20；顺序/随机 |
| 会话类型 | `session_kind=advanced`；不计入每日10分钟完成次数 |
| 题目归属 | 答题/结果页显示真实一级专项 · 二级分类 |
| 历史 | `kindFilter=specialty\|advanced\|daily\|all`；旧记录默认归专项 |
| 权限 | 复用 grants；`dhm@189.cn` 可直接使用试运行 |
| 隔离 | 正式/试运行池隔离；每日仍排除 `[daily:exclude]`；题库总量仍 **638** |

---

## 3. 主要改动文件

### 后端

- `apps/api/src/chemistry/train/chem-train.service.ts` — 去掉难度回退；`kindFilter`；advanced 会话逐题专项元数据
- `apps/api/src/chemistry/train/chem-advanced-train.service.ts` — **新增** availability / 组卷
- `apps/api/src/chemistry/train/chem-advanced-train.controller.ts` — **新增**
- `apps/api/src/chemistry/train/dto/advanced-train.dto.ts` — **新增**
- `apps/api/src/chemistry/train/dto/train.dto.ts` — `kindFilter`
- `apps/api/src/chemistry/train/train.constants.ts` — `DIFFICULTY_LABELS[0]=提高+挑战`
- `apps/api/src/chemistry/chemistry.module.ts` — 注册 advanced
- `db/init.sql` / `db/migrate_chemistry_advanced_session_kind_comment.sql` — `session_kind` 注释含 `advanced`（无结构破坏）

### 前端

- `ChemistryHomeView.vue` — 入口卡片
- `ChemistryAdvancedTrainSetupView.vue` — **新增**设置页
- `ChemistryTrainSetupView.vue` — 可用/计划双行
- `ChemistryTrainSessionView.vue` / `ChemistryTrainResultView.vue` — 逐题专项标签
- `ChemistryTrainHistoryView.vue` — 类型筛选
- `api/chemistry-train.ts`、`router/index.ts`

### 验证

- `docs/chemistry_advanced_entry/smoke_test.js`
- `docs/chemistry_advanced_entry/smoke_result.json`

---

## 4. API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/chemistry/train/advanced/availability` | `difficultyMode=raise\|challenge\|mix`；`itemScope=all\|s60`；`specialtyCode`/`categoryCode` 可选 |
| POST | `/chemistry/train/advanced/sessions` | 创建 `session_kind=advanced` 会话 |
| GET | `/chemistry/train/sessions?kindFilter=` | `specialty`（默认，含旧空值）/`advanced`/`daily`/`all` |

复用既有：`sessions/:id`、作答、提交、取消、判题与解析。

**首批60道筛选**：`gate_note` 含 `[s60]` **或** `code` 前缀 `train.ai_trial.s60.`（与入库约定一致，非唯一 ACL）。

**跨专项均衡**：软目标 — 优先覆盖多一级专项，再兼顾二级分类；顺序模式稳定排序；随机模式有合理随机性。不合格题不进候选池。

---

## 5. 冒烟结果（2026-10-20）

命令：`node docs/chemistry_advanced_entry/smoke_test.js` → **ok=true**

| 检查 | 结果 |
|------|------|
| 方程式配平 DB：d1=5 / d2=0 / d3=0 | PASS |
| 专项 availability 提高/挑战均为 **0**（不再回退为 5） | PASS |
| dhm 提高可用 **203**、挑战 **24**、混合 **227** | PASS |
| 首批60：raise **36** + challenge **24** = **60** | PASS |
| raise 会话 5 题全为 difficulty=2，且带真实专项标签 | PASS |
| challenge+s60 会话全为 difficulty=3 | PASS |
| mix 10 题：raise7+challenge3，无基础题；跨多个专项 | PASS |
| 每日可抽仍 **574**；advanced 不计入每日完成 | PASS |
| 历史 kindFilter 隔离 | PASS |
| 题库总量 **638** | PASS |

---

## 6. 未改动 / 兼容

- 未修改管理员密码；未删除/重评历史答题
- 未新增虚拟专项或分类表数据
- 正式池仍为 0；filler 脚本仍禁用
- 旧 `session_kind` 为空/specialty 的记录在默认「专项训练」筛选中可见

---

## 7. 使用说明（学生）

1. 学习工具 → 高一化学  
2. 「提高与挑战训练」→ 选难度模式 / 专项 / 题量 / 顺序或随机  
3. 授权账号选择「个人试运行训练」  
4. 训练历史可按「专项 / 提高与挑战 / 每日 / 全部」筛选  

普通专项训练路径不变；提高/挑战若该分类无题，将正确显示 **0 道**。

---

## 8. 下一步建议（待指令）

1. 按模型继续扩量提高/挑战，新题继续打 `[daily:exclude]`  
2. 人工审核 s60 与 VERIFY 题  
3. 正式池发布须单独确认  
