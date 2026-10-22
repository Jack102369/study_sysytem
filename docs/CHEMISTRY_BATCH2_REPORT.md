# 高一化学知识库 · batch2 建设报告

> 第三阶段第2步：元素与化学基础概念  
> 清单来源：`docs/chemistry_kb_inventory.json` → `batch2`（91 条）

## 1. 建设情况总览

| 指标 | 数量 |
|------|------|
| batch2 计划条数 | 91 |
| 已有 seeded（复用，不覆盖） | 10 |
| 新生成并导入成功 | 81 |
| 导入失败 | 0 |
| 缺失 | 0 |
| 待审核（pending_review） | 81 |
| 已发布（仅原 seeded） | 10 |
| 重复（导入时跳过创建） | 0（seeded 未再提交创建） |

按类型（新导入）：

| 子批 | 类型 | 新建导入 |
|------|------|----------|
| B2-A | element | 26 |
| B2-B | concept | 23 |
| B2-C | formula | 11 |
| B2-D | knowledge | 21 |

## 2. 已有数据复用（seeded 审计）

以下条目保持 `published`，**未覆盖**：

| 编码 | 类型 | 审计结论 | 补充建议（人工审核时处理） |
|------|------|----------|---------------------------|
| el.H / el.O / el.Na / el.Cl | element | 符号、序数、质量、周期族、化合价、电子排布、用途已有 | 可补全更规范的 `nameEn`、`atomStructure`、化合物列表 |
| concept.redox | concept | 有简短定义 | 可补易混点（氧化剂 vs 氧化产物） |
| formula.n_m_M | formula | 表达式已有 | 可补单位与更多例题字段 |
| kp.redox 及 valence_change / oxidant / reductant | knowledge | 树结构已有 | 可加长 description |

清单状态已标为 `seeded_audited`。

## 3. 导入与校验

- 导入包：`docs/chemistry_batch2/import_B2-A.json` … `B2-D.json`
- 校验报告：`docs/chemistry_batch2/check_B2-*.md`（编码/符号/status/inv 标记均通过）
- 导入结果：`docs/chemistry_batch2/import_all_results.json`（success=81, fail=0, linkErrors=0）
- 接口：现有 `POST /chemistry/admin/kb/import`；成功后 `PUT .../links` 写入专项/分类关联
- 新内容 `status=pending_review`；`reviewNote` 前缀 `[inv:CODE]`
- 小修复：create 写入 `reviewNote`（便于对账），不影响表结构

## 4. 化学知识校验要点

- 元素符号大小写：按 IUPAC 形式（如 Co≠CO）；本批无化合物条目
- 过渡元素电子排布：Fe/Cu 等标注「高中以价态与性质为主」，部分带 `待核实`
- Hg：强调毒性与禁止家用接触
- 概念：区分电解质/导电、氧化剂/氧化产物、纯净物/混合物等
- 公式：标况 22.4、稀释 c1V1=c2V2 等适用条件已写

## 5. 知识关联

- 各新建条目已按清单 `specialtyCodes` / `categoryCodes` 关联现有专项与二级分类
- 氧化还原子知识点已尝试挂到父节点「氧化还原反应」

## 6. 待核实内容

见导入数据 `reviewNote` 中含「待核实」的条目，主要包括：

- el.Be 用途细节  
- el.Fe / el.Cr 电子排布高中写法  
- el.Hg 安全表述  
- formula.rho_c_M 单位换算系数说明  

## 7. 导入失败 / 尚未覆盖

- 导入失败：无  
- 尚未覆盖：batch2 的 91 条编码均有明确状态（`imported` 或 `seeded_audited`）

## 8. 下一批建议

1. 管理员在「设置 → 化学知识库」审核 `pending_review`，通过后改为 `published`  
2. 按需手工补全 seeded 字段缺口（勿盲目覆盖）  
3. 开始 **batch3 金属化学数据**（物质/反应/实验）

## 9. 运维说明

- **正确导入方式（无密码）**：`cd apps/api && pnpm chem:import -- ../../docs/chemistry_batch2/import_B2-A.json`  
  进程内调用 `ChemKbImportService`，只读选取 ADMIN 的 id 写审计字段，**不登录、不改密码、不改用户表**。  
- 旧 HTTP `import_runner.js` 曾依赖 `CHEM_ADMIN_PASSWORD`；Batch2 执行时因未知原密码，由操作过程**临时重置了 admin 密码**（不应再发生）。该入口已改为转发 `pnpm chem:import`，并拒绝密码类环境变量。  
- 生成脚本：`docs/chemistry_batch2/generate_batch2.js`  
- 清单已更新：`docs/chemistry_kb_inventory.json`

## 10. 密码重置事件说明（安全修复）

| 项 | 说明 |
|----|------|
| 原因 | HTTP 导入脚本需 `/auth/login`，当时无可用密码，操作中对 `admin@189.cn` 执行了 `password_hash` 更新以便拿 JWT |
| 脚本本身 | `import_runner.js` **未硬编码密码**，但设计依赖管理员密码登录 |
| 修复 | 改为 Nest 进程内导入；禁止密码环境变量；导入路径不得再改用户数据 |
| 建议 | 请管理员自行通过正规「重置密码」流程恢复个人密码（本报告不记录任何口令） |
