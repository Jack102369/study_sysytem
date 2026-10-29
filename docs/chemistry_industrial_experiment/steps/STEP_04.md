# STEP_04 · 工业案例与知识模型

| 字段 | 内容 |
|------|------|
| 步骤编号 | STEP_04 |
| 步骤名称 | 工业案例与知识模型 |
| 开发目标 | 建立工业案例领域模型、校验、版本哈希、3 个文件级候选案例；明确与 chem_experiments 映射；不改库、不出题、不 SVG |
| 前置条件 | STEP_03 COMPLETED；D020 原则确认 |
| 当前状态 | **COMPLETED** |
| 开始时间 | 2026-10-29 08:53:00 +08:00 |
| 完成时间 | 2026-10-29 09:05:00 +08:00 |

---

## 计划工作

1. 核查 chem_experiments / KB 关联与状态机  
2. 建立 industrial 类型、常量、校验、哈希、fixtures  
3. 写出 3 个候选 JSON；自检覆盖结构/哈希/发布门槛  
4. 文档：INDUSTRIAL_CASE_MODEL、DATABASE_DESIGN、DECISIONS、进度  

---

## 实际完成内容

- 结论：chem_experiments **可部分复用**（审核/文本/反应物质关联）；结构化工艺、caseType、来源、contentHash 需应用层；**本步不写库**（D033）  
- 新增 `apps/api/src/chemistry/industrial/*`  
- 候选：`salt_purification_basic` / `seawater_resource_basic` / `metal_recovery_basic`（均为 draft + unverified）  
- 自检 + seed-selftest + api build 通过；无 DB 写入；无依赖新增  

---

## 实际修改文件

### 代码

- `apps/api/src/chemistry/industrial/industrial-case.constants.ts`
- `apps/api/src/chemistry/industrial/industrial-case.types.ts`
- `apps/api/src/chemistry/industrial/industrial-case.hash.ts`
- `apps/api/src/chemistry/industrial/industrial-case.validate.ts`
- `apps/api/src/chemistry/industrial/industrial-case.fixtures.ts`
- `apps/api/src/chemistry/industrial/industrial-case.selftest.ts`
- `apps/api/src/chemistry/industrial/write-candidate-cases.ts`
- `apps/api/src/chemistry/industrial/index.ts`
- `apps/api/package.json`（脚本）

### 候选数据

- `docs/chemistry_industrial_experiment/cases/salt_purification_basic.json`
- `docs/chemistry_industrial_experiment/cases/seawater_resource_basic.json`
- `docs/chemistry_industrial_experiment/cases/metal_recovery_basic.json`

### 文档

- INDUSTRIAL_CASE_MODEL.md、DATABASE_DESIGN.md、DECISIONS.md（D033/D034）
- STEP_04、PROGRESS、TEST_REPORT、NEXT_SESSION、README

---

## 测试命令与结果

| 命令 | 结果 |
|------|------|
| `pnpm --filter api run chem:industrial-write-cases` | 写出 3 JSON |
| `pnpm --filter api run chem:industrial-case-selftest` | 通过 |
| `pnpm --filter api run chem:seed-selftest` | 通过 |
| `pnpm --filter api run build` | 通过 |
| MySQL / 浏览器 | **未执行** |

---

## 数据库验证结果

**未修改、未写入。** 候选仅为文件。

---

## 前端验证结果

本步无前端改动；STEP_02/03 浏览器 E2E 仍待验证。

---

## 验收结果

STEP_04 完成标准满足 → **COMPLETED**。无架构阻塞（D020 路径清晰，持久化后置）。

---

## 遗留问题

- STEP_02/03 实库种子与浏览器 E2E 仍待验证  
- chem_experiments 持久化与最小扩展列待用户确认后实施  
- 候选来源均为 unverified  

---

## 下一步建议

**STEP_05：工业流程图 JSON 协议与安全数据投影**（服务端完整结构 vs 学生端安全投影）。
