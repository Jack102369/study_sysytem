# STEP_02 · 新增工业实验第13个一级专项

| 字段 | 内容 |
|------|------|
| 步骤编号 | STEP_02 |
| 步骤名称 | 新增工业实验第13个一级专项 |
| 开发目标 | 按现有规范注册 `industrial_experiment` 一级专项；不破坏原有 12 专项；不写二级分类 |
| 前置条件 | STEP_01 COMPLETED；专项命名与种子机制已明确 |
| 当前状态 | **COMPLETED** |
| 开始时间 | 2026-10-29 08:43:00 +08:00 |
| 完成时间 | 2026-10-29 08:50:00 +08:00 |

---

## 计划工作

1. 核对进度状态与 STEP_01 分析报告完整性  
2. 更新 D020 / D029 用户确认结果  
3. 扩展 `chemistry.seed.ts`（第 13 专项，categories 空）  
4. 更新「12 专项」语义注释为 13（逐处判断）  
5. 核对前端动态列表 / 路由 / 空分类（优先零改动）  
6. 增加种子静态自检；执行 api build + vue-tsc  
7. 更新进度文档与 NEXT_SESSION  

---

## 实际完成内容

- 确认 STEP_00/01 COMPLETED，STEP_02 可启动；Git 保留高一数学等既有未提交修改  
- STEP_01 仅有统一报告 `ARCHITECTURE_ANALYSIS.md`：已在 STEP_01.md 记录与原计划 8 份报告的章节映射  
- D020：原则确认复用 `chem_experiments`（STEP_04 再验字段；本步未改该表）  
- D029：确认语义化 code 方向；完整 12 code 留 STEP_03；**本步未写分类**  
- 种子新增：`industrial_experiment` / 工业实验 / sortOrder=13 / intro 按产品文案 / `categories: []` / icon=`OfficeBuilding`  
- 原 12 专项 code 与 sortOrder 未改  
- 前端：`ChemistryHomeView` 已 API 动态渲染；`/chemistry/:code` 动态路由；详情空分类已有 `el-empty` — **无需改 Vue**  
- 新增 `chemistry.seed.selftest.ts` + `pnpm --filter api chem:seed-selftest`  
- **未**改 db/init.sql、Entity、训练/判题/错题/每日/提高、高一数学、未装依赖、未 commit  

---

## 实际修改文件

### 业务

- `apps/api/src/chemistry/chemistry.seed.ts`
- `apps/api/src/chemistry/chemistry.service.ts`（注释）
- `apps/api/src/chemistry/chemistry.controller.ts`（注释）
- `apps/api/src/chemistry/chemistry.seed.selftest.ts`（新增）
- `apps/api/package.json`（增加 `chem:seed-selftest` 脚本）

### 文档

- `docs/chemistry_industrial_experiment/DECISIONS.md`
- `docs/chemistry_industrial_experiment/steps/STEP_01.md`（报告映射补记）
- `docs/chemistry_industrial_experiment/steps/STEP_02.md`
- `docs/chemistry_industrial_experiment/DEVELOPMENT_PROGRESS.md`
- `docs/chemistry_industrial_experiment/TEST_REPORT.md`
- `docs/chemistry_industrial_experiment/NEXT_SESSION.md`

---

## 测试命令

```bash
pnpm --filter api run chem:seed-selftest
pnpm --filter api run build
pnpm --filter web exec vue-tsc --noEmit
```

数据库 ensureSeeded / 浏览器点击：**未执行**（未确认安全本地 DB 写入环境）。

---

## 测试结果

| 项 | 结果 |
|----|------|
| chem:seed-selftest | **通过**（13 专项、industrial_experiment 正确、原 12 仍在、无分类） |
| api nest build | **通过** |
| web vue-tsc --noEmit | **通过** |
| MySQL 种子写入 / 页面点击 | **未执行**（见遗留） |

---

## 验收结果

代码侧 STEP_02 目标已达成 → 标记 **COMPLETED**。  
明确区分：**代码实现完成；数据库实际初始化与浏览器 E2E 尚未验证。**

---

## 遗留问题 / 未验证

- 重启 API 后 `ensureSeeded` 是否写入本地 MySQL：**未验证**  
- 浏览器打开 `/chemistry` 与 `/chemistry/industrial_experiment`：**未验证**  
- 无阻塞代码问题  

---

## 下一步建议

**STEP_03**：写入 12 个二级分类（按 D029 定稿 code）。勿提前做 AI/SVG/出题。提示词见 NEXT_SESSION.md。
