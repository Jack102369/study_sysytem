# STEP_01 · 实际仓库架构分析

| 字段 | 内容 |
|------|------|
| 步骤编号 | STEP_01 |
| 步骤名称 | 实际仓库架构分析 |
| 开发目标 | 只读调查现有化学专项、训练题库、AI出题器、KB、附件、数据库与审核机制；输出真实架构分析报告并更新进度文档 |
| 前置条件 | STEP_00 COMPLETED；工作区为正确仓库 |
| 当前状态 | **COMPLETED** |
| 开始时间 | 2026-10-28 23:58:00 +08:00 |
| 完成时间 | 2026-10-29 08:35:00 +08:00 |

---

## 计划工作

1. 只读 Git 状态记录（不清理既有修改）
2. 调查 chem_specialties / chem_categories / seed 与前端专项列表
3. 调查 chem_train_items 题库、审核字段、pool/status
4. 调查训练会话、快照、判题、错题链路
5. 调查 KB（experiments/reactions/substances/links）与附件
6. 调查 train-generator / AI 实际调用能力
7. 调查 chemistry_advanced_model 与 experiment.json
8. 撰写架构分析报告并更新进度/决策/NEXT_SESSION

---

## 实际完成内容

- Git：`main` @ `09caa4f`；保留仓库内高一数学等既有未提交修改，未清理
- 核实 12 专项种子、幂等 ensureSeeded、无数量硬限制、前端列表/空分类处理
- 核实题库字段与 formal/test 准入；会话快照与判题；错题/每日/提高页面存在
- 核实 LocalGenerator = **本地模板**，非在线 LLM；formalAllowed 恒 false
- 核实 KB experiments 结构与 attachments；advanced model catalog 加载与 merge 硬编码列表
- 输出 `ARCHITECTURE_ANALYSIS.md`；回写 ARCHITECTURE / DATABASE_DESIGN / DECISIONS(D020 更新, D029–D032)
- **未**改业务代码、种子、数据库、依赖

---

## 实际修改文件

仅工业实验文档：

- `docs/chemistry_industrial_experiment/ARCHITECTURE_ANALYSIS.md`（新增）
- `docs/chemistry_industrial_experiment/ARCHITECTURE.md`
- `docs/chemistry_industrial_experiment/DATABASE_DESIGN.md`
- `docs/chemistry_industrial_experiment/DECISIONS.md`
- `docs/chemistry_industrial_experiment/DEVELOPMENT_PROGRESS.md`
- `docs/chemistry_industrial_experiment/TEST_REPORT.md`
- `docs/chemistry_industrial_experiment/NEXT_SESSION.md`
- `docs/chemistry_industrial_experiment/README.md`
- `docs/chemistry_industrial_experiment/steps/STEP_01.md`

---

## 测试命令

```powershell
# 文档存在性与关键断言（只读）
Test-Path docs/chemistry_industrial_experiment/ARCHITECTURE_ANALYSIS.md
Select-String -Path docs/chemistry_industrial_experiment/ARCHITECTURE_ANALYSIS.md -Pattern 'LocalGenerator|ensureSeeded|chem_train_items'
# 确认未改化学业务（相对本步应无 apps/api/src/chemistry 新 diff 出自本任务）
git status --short -- apps/api/src/chemistry apps/web/src/views/chemistry db/init.sql
```

未执行：MySQL、前后端启动、业务回归。

---

## 测试结果

- 架构分析文档已落盘；关键结论可在源码路径交叉核对 → **文档验收通过**
- 业务/库/依赖：**未改**（本步约束）
- 运行时服务测试：**未执行**

---

## 验收结果

STEP_01 目标（真实代码分析 + 文档同步 + 不改业务）已达成 → **COMPLETED**。

---

## 遗留问题

- D020 / D029：STEP_01 结束时待确认 → **已在 STEP_02 由用户确认**（见 DECISIONS.md）
- 正式题 test→formal 完整操作路径待 STEP_09 深挖
- 真 AI Provider 待 STEP_07 设计实现

---

## 分析报告形态说明（STEP_02 复核补记）

原计划曾列出 8 份分册报告。仓库实际仅存在统一报告：

- `docs/chemistry_industrial_experiment/ARCHITECTURE_ANALYSIS.md`

**不强制拆成 8 个内容重复文件。** 主题映射如下：

| 原计划文件 | 统一报告中的对应位置 |
|------------|----------------------|
| 01_REPOSITORY_ANALYSIS.md | §0 证据分级、§11 文件索引、文首 Git/范围 |
| 02_CHEMISTRY_ARCHITECTURE.md | §1 专项/分类；§8 前端训练页 |
| 03_DATABASE_ANALYSIS.md | §2 题库字段；§4 KB；与 DATABASE_DESIGN.md |
| 04_AI_GENERATOR_ANALYSIS.md | §5 LocalGenerator；§6 advanced model |
| 05_DIAGRAM_ARCHITECTURE.md | §2.5 SVG 存储建议；§3.7 历史漂移；D032 |
| 06_TRAINING_INTEGRATION.md | §3 会话/判题/错题；§8 |
| 07_SECURITY_AND_RISKS.md | §3.3 答案泄露；§2.3 准入；user_id/闸门 |
| 08_IMPLEMENTATION_RECOMMENDATIONS.md | §9 顺序建议；D020–D032 |

STEP_02 复核：上述主题已覆盖；未发现需另起空文件补齐的关键缺口。

---

## 下一步建议

执行 **STEP_02：新增工业实验第 13 个一级专项**（扩展 `chemistry.seed.ts` + 验证列表 API/前端展示）。  
分类 code 方向已确认（D029），完整列表由 **STEP_03** 定稿写入；STEP_02 不写分类。  
提示词见 `NEXT_SESSION.md`。
