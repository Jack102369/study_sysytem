# P1-FUNC · APPLICATION-1 应用题基础业务实现与验收

> **阶段**：APPLICATION-1（非 CORE-1B）  
> **库**：`study_system` @ `127.0.0.1`  
> **代码完成**：2026-10-25  
> **业务验收**：`2026-10-25T13:35+08:00`～（runId `RMVNEAF58` + fp 补测 `FPCHK`）  
> **结果**：**PARTIAL**  
> **APPLICATION-2**：`NOT_STARTED`  
> **CORE-1A-4B**：仍 **BLOCKED**  
> 快照：`db/backups/_application1_acceptance_RMVNEAF58.json`

---

## 1. 本阶段实现功能（代码）

| 能力 | 状态 |
|---|---|
| `application` 题型协议 / DTO / 导入白名单 | 完成 |
| rubric 整数分校验 | 完成 |
| 管理端创建编辑 UI | 完成（点验 UI_NOT_RUN） |
| 学生文字作答组件 | 完成（点验 UI_NOT_RUN） |
| 提交 → `pending_ai` | 代码 + 单元自测；**HTTP 会话路径未跑通** |
| 旧四题型兼容 selftest | PASS |

---

## 2. 业务验收（本轮授权）

**runId 前缀**：`HS_MATH_APPLICATION1_IT_RMVNEAF58_`  
**账号**：ADMIN `user_id=2`  
**临时题**：`pool=test` · `status=draft` · `qtype=application`  
**未**执行 approve；**未**改正式 110 题。

### 分项结论

| # | 项 | 结论 | 证据 |
|---|---|---|---|
| A | application 创建保存 | **PASS** | POST → 201，id=149；DB `qtype=application` `pool=test` `draft` |
| B | rubric 校验 | **PASS** | 分值不一致 / key 重复 → HTTP **400** |
| C | version / fingerprint | **PASS** | content_version 1→2；review-panel 指纹变更（补测 fp1≠fp2） |
| D | 审核发布门禁 | **PASS** | 未审核 + test 池批准 → HTTP 400「test 池题目不可批准为正式训练题」 |
| E | application 文字提交 | **APPLICATION_SUBMISSION_BLOCKED** | 学生会话 `poolMode=test` → **403**；formal 不抽 draft/test；禁止 approve |
| F | pending_ai 持久化 | **NOT_RUN** | 依赖 E |
| G | 结果与历史 | **NOT_RUN** | 依赖 E |
| H | 真实管理端 UI | **UI_NOT_RUN** | 未浏览器操作 |
| I | 真实学生端 UI | **UI_NOT_RUN** | 未浏览器操作 |
| J | 测试数据清理 | **PASS** | 按前缀 DELETE；基线 items110 / approved12 / methods11 / item_methods16 / reviews12 恢复 |

### 学生路径说明

现有训练创建：**仅 formal**（`ForbiddenException: P0 暂不支持 test 题池`）。  
IT 题故意 `draft+test`，且授权**禁止 approve**，因此无法在不绕过门禁的前提下进入学生抽题。  
后续若要验收 E/F/G，需单独授权其一：

1. 临时开放 test 池学生会话（产品/代码变更）；或  
2. 受控批准 **formal draft** IT 题并限定 code 前缀（仍须审核流程）。

---

## 3. 基线保护

| 指标 | 验收前 | 清理后 |
|---:|---:|---:|
| items | 110 | **110** |
| approved/draft/disabled | 12/93/5 | **12/93/5** |
| methods / item_methods | 11 / 16 | **11 / 16** |
| reviews | 12 | **12** |

本轮 probe 曾创建 formal 会话后立即 **cancel**（未提交答案）；未改其他用户学习记录。

---

## 4. 静态测试

| 命令 | 结果 |
|---|---|
| `hs-math:selftest` | PASS |
| `hs-math:application1-selftest` | PASS |

---

## 5. 迁移

**不需要**结构迁移（无新列）。`init.sql` 仅 COMMENT 文档对齐。

---

## 6. APPLICATION-2 前置

图片上传存储与鉴权设计；且建议先解决学生路径对 application 的合法抽题验收授权。

---

## 7. 阶段标记

| 项 | 状态 |
|---|---|
| **APPLICATION-1** | **PARTIAL** |
| APPLICATION-2 | **NOT_STARTED** |
| CORE-1A-4B | **BLOCKED** |
