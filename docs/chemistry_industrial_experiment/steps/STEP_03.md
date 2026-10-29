# STEP_03 · 新增工业实验 12 个二级分类

| 字段 | 内容 |
|------|------|
| 步骤编号 | STEP_03 |
| 步骤名称 | 新增工业实验 12 个二级分类 |
| 开发目标 | 为 `industrial_experiment` 写入 12 个二级分类；验证种子/自检/构建；不改库表；不做案例/AI/SVG |
| 前置条件 | STEP_02 COMPLETED |
| 当前状态 | **COMPLETED** |
| 开始时间 | 2026-10-29 08:48:00 +08:00 |
| 完成时间 | 2026-10-29 08:55:00 +08:00 |

---

## 计划工作

1. 核对进度与 Git；确认 industrial_experiment 专项存在  
2. 按用户定稿写入 12 分类 code/name/sortOrder  
3. 扩展 seed selftest（静态 + upsert 算法模拟）  
4. 创建 CATEGORY_DESIGN.md；更新 D029  
5. 构建与 vue-tsc；更新进度文档  

---

## 实际完成内容

- 在 `chemistry.seed.ts` 的 `industrial_experiment.categories` 写入 12 分类（正式 D029 列表）  
- 原 12 一级专项与 `experiment` 的 16 分类未改  
- `chem_categories` 无 description 字段 → 学习范围写入 CATEGORY_DESIGN.md  
- 前端仍复用动态详情页，**未改 Vue**  
- 自检：静态断言 + 内存 upsert 幂等模拟通过；**真实 MySQL 未写**  
- 未改判题/错题/每日/提高/hs-math/init.sql/Entity  

---

## 实际修改文件

### 业务

- `apps/api/src/chemistry/chemistry.seed.ts`
- `apps/api/src/chemistry/chemistry.seed.selftest.ts`

### 文档

- `docs/chemistry_industrial_experiment/CATEGORY_DESIGN.md`（新建）
- `docs/chemistry_industrial_experiment/DECISIONS.md`（D029 定稿）
- `docs/chemistry_industrial_experiment/README.md`
- `docs/chemistry_industrial_experiment/steps/STEP_03.md`
- `docs/chemistry_industrial_experiment/DEVELOPMENT_PROGRESS.md`
- `docs/chemistry_industrial_experiment/TEST_REPORT.md`
- `docs/chemistry_industrial_experiment/NEXT_SESSION.md`

---

## 种子实现

- 分类挂在 `CHEM_SPECIALTY_SEEDS` 中 `code === 'industrial_experiment'` 的 `categories` 数组  
- 运行时 `ChemistryService.ensureSeeded`：先 upsert 专项，再按 `(specialtyId, category.code)` upsert 分类  
- **不会**关联到 `experiment`  

---

## 测试命令与结果

| 命令 | 结果 |
|------|------|
| `pnpm --filter api run chem:seed-selftest` | 通过（含 12 分类、experiment=16、upsert 模拟） |
| `pnpm --filter api run build` | 通过 |
| `pnpm --filter web exec vue-tsc --noEmit` | 通过 |
| MySQL ensureSeeded | **未执行** |
| 浏览器 `/chemistry/industrial_experiment` | **未执行** |

---

## 验收结果

代码与静态验收达标 → **COMPLETED**。  
明确：数据库实写与浏览器展示仍为**待验证**。

---

## 遗留问题

- 重启 API 后 DB 是否出现 12 行分类：未测  
- 浏览器分类列表与空题库提示：未测  

---

## 下一步建议

**STEP_04：工业案例与知识模型**（复用 chem_experiments；粗盐提纯等候选；区分真实/教材简化/教学模拟）。勿在本步提前做。
