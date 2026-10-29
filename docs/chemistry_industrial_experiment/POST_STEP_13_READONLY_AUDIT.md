# POST_STEP_13 · PHASE_A 只读审计报告

| 字段 | 值 |
|------|-----|
| 检查日期 | 2026-10-29 11:19–11:28 +08:00 |
| 阶段 | POST_STEP_13_ACCEPTANCE / **PHASE_A** |
| 验收等级 | **保持 CONDITIONALLY_ACCEPTED**（未升格） |
| 脚本 | `pnpm --filter api run chem:industrial-readonly-audit` |

## 1. Git 状态（摘要）

工作区有大量既有未提交改动（工业 STEP_09–13 + 本 PHASE_A 代码修复）。**未**执行 commit / push。高一数学相关脏改动为本会话前既有，本 PHASE_A **未**主动修改 hs-math 业务逻辑。

## 2. 数据库连接

| 项 | 结果 |
|----|------|
| 连接 | **成功** |
| 库名 | `study_system`（业务库） |
| MySQL | **8.0.44** |
| 只读保护 | 脚本仅 `SELECT` / `SHOW` / `INFORMATION_SCHEMA`；无 INSERT/UPDATE/DELETE/DDL；未调用 `ensureSeeded` |

## 3. 表存在性

| 表 | 状态 |
|----|------|
| chem_specialties / categories / train_items / links | present |
| chem_train_sessions / session_items / wrong_* | present |
| **chem_train_item_assets (D043)** | **absent** |
| **chem_train_session_item_assets (D045)** | **absent** |

## 4. D043 / D045

| 决策 | 状态 |
|------|------|
| D043 | **未迁移**（表不存在） |
| D045 | **未迁移**（表不存在） |
| Schema 差异 | 相对 `db/init.sql` 缺两表；列级未检（表 absent） |

## 5. 工业专项数据（汇总）

| 指标 | 数量 |
|------|------|
| specialty `industrial_experiment` | 存在 |
| 活跃二级分类 | 12 |
| formal 题 | 0 |
| test 题 | 0 |
| formal + KB link | 0 |
| formal + assets | N/A（D043 表 absent） |
| formalEligibleApprox | **0** |

说明：`formalEligibleApprox` 仅按 pool/status/flags + link 存在近似；完整 eligibility 还需 KB entity published 等业务校验。

## 6. 双图正式入库

| 结论 | **代码层已补齐；真实 DB 未验证** |
|------|------|
| 缺口（修复前） | `buildFormalImportDbPayload` 仅写单条 flow；装置候选把装置 SVG 误标为主图 flow |
| 修复后 | 主图 flow + `additionalAssets` 装置副图；DB writer 事务多资产；闸门校验装置 SVG/安全；审计哈希含装置 hash |
| 会话快照 | `writeSnapshotsInTx` 本就按 item 下全部 assets 写入（多图兼容） |
| 真实入库 IT | **NOT_EXECUTED**（D043 未迁移） |

## 7. HTTP AI 装置生成

| 结论 | **代码已实现 HTTP 适配；真实在线未执行** |
|------|------|
| 修复前 | 仅 `generateIndustrialApparatusCandidateWithMock` |
| 修复后 | `generateIndustrialApparatusCandidateWithHttp`（JSON→校验→Public→SVG；可注入 provider） |
| 无密钥 | `AI_UNAVAILABLE`（自检 PASS，**不**冒充在线） |
| 真实 DeepSeek 调用 | **NOT_EXECUTED** |

## 8. 管理审核 / 学生双图

- 审核仓：装置字段正式类型化；Mock/HTTP 双图落盘（flow + apparatus）。
- 人审闸门：development_only / mock 仍阻断 formal；装置 safety blocking 阻断。
- 学生端：多图快照依赖 D043 多行 assets；表未迁移 → 实机 **NOT_EXECUTED**。

## 9. 浏览器 E2E / SVG 视觉

| 项 | 状态 |
|----|------|
| Playwright/Cypress | 不可用 |
| 人工视觉 SVG | **NOT_EXECUTED** |

## 10. 发现的缺陷 / 修复 / 未修

**已发现并代码修复：**

1. DUAL_ASSET_IMPORT_GAP — 单资产入库  
2. 装置候选资源类型/主副图落盘混乱  
3. 审计哈希未覆盖装置 contentHash  
4. HTTP_APPARATUS_GENERATION_NOT_IMPLEMENTED  

**未修复（需用户批准后续阶段）：**

1. study_system 上 D043/D045 **未迁移**  
2. 无正式工业题 / KB / 实抽 / E2E / 真实 AI  

## 11. 迁移与主库风险

在业务库 `study_system` 执行迁移有风险：锁表、外键、与存量会话/错题清理策略耦合。详见 `MAIN_DATABASE_ACCEPTANCE_PLAN.md`。**本次未迁移。**

## 12. 推荐下一阶段

**PHASE_B**：备份与迁移准备（需用户确认）→ 再谈 PHASE_C 迁移批准。
