# STEP_05 · 工业流程图 JSON 协议与安全数据投影

| 字段 | 内容 |
|------|------|
| 步骤编号 | STEP_05 |
| 步骤名称 | 工业流程图 JSON 协议与验证 |
| 开发目标 | Definition/Public 协议、结构与案例引用校验、安全投影、哈希版本、示例 JSON |
| 前置条件 | STEP_04 COMPLETED |
| 当前状态 | **COMPLETED** |
| 协议版本 | schemaVersion **1.0** |
| 完成时间 | 2026-10-29 09:10:00 +08:00 |

---

## 实际完成内容

- 新增 `industrial-diagram.*`（types/constants/hash/project/validate/fixtures/selftest/write）  
- 复用 `stableStringify` / `sha256Stable`  
- 白名单 `projectIndustrialDiagramPublic` + leak 扫描  
- 示例 4 份 diagrams JSON；自检覆盖线性/分支/recycle/未知操作/安全/哈希/案例绑定  
- **未**改 DB、训练、SVG、AI  

---

## 实际修改文件

- `apps/api/src/chemistry/industrial/industrial-diagram.*.ts`（多文件）  
- `apps/api/src/chemistry/industrial/industrial-case.hash.ts`（导出稳定哈希）  
- `apps/api/src/chemistry/industrial/index.ts`  
- `apps/api/package.json`  
- `docs/chemistry_industrial_experiment/diagrams/*.json`  
- `INDUSTRIAL_DIAGRAM_PROTOCOL.md` 及进度文档  

---

## 测试命令与结果

| 命令 | 结果 |
|------|------|
| chem:industrial-diagram-write | 写出 4 JSON |
| chem:industrial-diagram-selftest | 通过 |
| chem:industrial-case-selftest | 通过 |
| chem:seed-selftest | 通过 |
| api build | 通过 |

---

## 遗留问题

- STEP_02/03 MySQL 与浏览器 E2E 仍待验证  
- 流程图无 DB 持久化  

---

## 下一步

STEP_06：仅用 Public 生成 SVG。
