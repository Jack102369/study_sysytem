# 工业实验 · 架构说明

**最后更新：** 2026-10-29 11:07:36 +08:00（STEP_13 装置图；验收等级仍 CONDITIONALLY_ACCEPTED）

> 详细证据与表格见 **[ARCHITECTURE_ANALYSIS.md](./ARCHITECTURE_ANALYSIS.md)**。  
> 本文区分：已知现状（已验证）/ 已确定目标 / 待确认。

---

## 1. 已知现状（STEP_01 已验证）

### 1.1 仓库与栈

- pnpm monorepo：`apps/web`、`apps/api`、`db`、`docs`
- TypeORM：`apps/api/src/app.module.ts` 中 **`synchronize: false`**
- 权威 DDL：`db/init.sql`

### 1.2 化学专项

- 表：`chem_specialties` / `chem_categories`（code 唯一；分类在专项内唯一；`is_active` + `sort_order`）
- 种子：`chemistry.seed.ts` 中 **12** 个一级专项；`ensureSeeded` **按 code 幂等 upsert**
- **无**一级数量硬限制；列表 API 返回全部活跃专项
- 前端：`ChemistryHomeView` / `ChemistrySpecialtyView`；分类空 → empty 态
- 现有含 `experiment`（实验室侧重），与规划中的 `industrial_experiment` 同级扩展位清晰

### 1.3 训练题库与会话

- 主表 `chem_train_items`：关联专项/分类；`pool` formal|test；闸门字段 curriculum_ok / verify_blocked / ban_default_train / gate_note
- KB 关联：`chem_train_item_links`
- 题图关联（STEP_09）：`chem_train_item_assets`（D043）
- 会话 `chem_train_session_items` **快照 stem/options/answer/analysis**；作答中 API 不返标准答案
- 会话题图快照（STEP_10）：`chem_train_session_item_assets`（D045，一题多图）；学生受控 SVG API；公开 `/uploads/industrial-svg` 403
- 判题：`chem-train-grade.ts`；错题：`chem_wrong_*`；session_kind 含 specialty/daily/advanced/wrong_*
- 每日/提高/错题/分析：已有独立 Service + 前端页，按专项/池复用；工业图挂接同一链路
- STEP_11：错题历史图经 `chem_wrong_events`→会话资产；工业 AI 变式进审核仓（D046）；analytics `industrialFocus`；Admin `kb-bind`（published only）
- STEP_12：综合验收 **CONDITIONALLY_ACCEPTED**；真实 MySQL/E2E/在线 AI 未执行；见 ACCEPTANCE_MATRIX / FINAL_ACCEPTANCE_REPORT
- STEP_13：独立装置 JSON→程序 SVG→安全规则→质检扩展→Mock 审核附件；资源类型 `industrial_apparatus_svg`（D047）；不平行系统

### 1.4 出题器真相

- `LocalGeneratorService` = **本地模板生成**，写入 **test** 池；**不是**在线 LLM 调用
- DeepSeek 相关多为 `docs/chemistry_deepseek_audit` 离线白名单
- Admin 列表 `formalAllowed` 恒 false；**未见**自动 test→formal 晋升 API

### 1.5 KB 与附件

- 实验：`chem_experiments`（实验室语义 TEXT 字段）+ 图 attachments 关联
- 状态机 draft→…→published；正式训练要求已发布 KB
- `attachments` 通用表（含 user_id）

### 1.6 提高模型目录

- `docs/chemistry_advanced_model`；运行时读 `models_catalog.json`
- 新增专项模型文件须改 `merge_catalog.js` 文件列表并重建 catalog
- 模型 **不**直接驱动 LocalGenerator 出题

---

## 2. 已确定目标（决策层，见 DECISIONS）

- 第 13 专项 `industrial_experiment`；复用题库/会话/错题；不平行系统
- 流程图：JSON → 程序 SVG；AI 辅助须质检+审核
- 装置图 STEP_13；不改高一数学；不破坏原 12 专项

---

## 3. 待确认（摘录）

| ID | 事项 |
|----|------|
| D020 | 工业案例存储：分析推荐短期复用 `chem_experiments`（方案 A），用户确认前不改库 |
| D029 | 12 个二级分类推荐 code（见分析报告 §1.6）待用户确认后 STEP_03 写入 |
| — | 正式题入库（test→formal）完整操作路径待 STEP_09 深挖 |
| — | 真 AI Provider 新建方式待 STEP_07 |
| — | 流程图落库形态待 STEP_05 |

---

## 4. 目标架构示意（规划）

```
高一化学
├── 既有 12 专项（含 experiment）
└── industrial_experiment（第 13，种子扩展，无新表）
    ├── 12 二级分类（code 待确认）
    ├── 题目 → chem_train_items（复用）
    ├── 训练/每日/错题/分析 → 现有 train 体系
    ├── 案例 → 优先 chem_experiments + entity 挂靠（待确认）
    ├── 流程 JSON/SVG → STEP_05/06（程序生成；快照防漂移）
    └── 真 AI 出题 → STEP_07（新建适配，勿伪装 LocalGenerator 为 LLM）
```
