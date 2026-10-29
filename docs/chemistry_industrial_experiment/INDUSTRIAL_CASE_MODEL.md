# 工业案例领域模型（STEP_04）

**最后更新：** 2026-10-29 09:00:00 +08:00  
**实现状态：** TypeScript 领域模型 + 运行时校验 + 仓库内 JSON 候选案例。  
**未实现：** 写入 MySQL / chem_experiments、管理后台、AI 出题、SVG、正式题库。

---

## 1. 工业案例定位

工业案例 **不是** 训练题，而是后续出题 / 流程 JSON / 质检的**知识依据**。

规划链路（后续 STEP，本步仅模型边界）：

```
工业案例 → 工艺步骤 → 物质/反应/知识点
→ 流程结构(STEP_05) → 题目(STEP_07) → SVG(STEP_06)
→ 质检(STEP_08) → 审核入库(STEP_09) → 训练复用
```

代码目录：`apps/api/src/chemistry/industrial/`

---

## 2. 案例类型（不可混淆）

| caseType | 含义 |
|----------|------|
| `real_industrial_process` | 真实工业工艺 |
| `textbook_simplification` | 教材简化工艺 |
| `teaching_simulation` | 教学模拟流程 |

第一批三例均为 simplification / simulation，**无一**标为 `real_industrial_process`。

---

## 3. 核心字段（领域层）

见 `industrial-case.types.ts`：`caseCode`, `title`, `description`, `caseType`, `gradeScope`, `curriculumScope`, `specialtyCode`(=`industrial_experiment`), `categoryCodes`, `sourceReferences`, `materials`, `processSteps`, `reactions`, `knowledgeLinks`, `learningObjectives`, `difficultyRange`, `safetyNotes`, `reviewStatus`, `version`, `contentHash`, `reviewedContentHash`, 时间戳, `openIssues`。

**说明：** 这些是领域模型字段，**不是**本步新增的 DB 列。

---

## 4. 物料 / 步骤 / 反应 / 依据

- **物料：** `materialId` 唯一；`formula` 可空；`physicalState` / `materialType` 受控枚举；混合物不得强编化学式。  
- **步骤：** `stepId` 唯一；`operationType` 受控；inputs/outputs 必须引用已有物料。  
- **反应：** 优先将来关联 `chem_reactions`；无 KB id 时 `pendingVerification=true`。方程式字符串合法 ≠ 化学正确。  
- **来源：** `verificationStatus` 默认候选为 `unverified`；禁止虚构教材页码；未发布 KB 不得自动 verified。

---

## 5. 审核状态与 KB 映射

领域：`draft | pending_review | approved | published | rejected`

映射到现有 `chem_experiments.status`（`draft|pending_review|published|rejected|archived`）建议：

| 领域 | KB（未来持久化时） |
|------|-------------------|
| draft | draft |
| pending_review | pending_review |
| approved | pending_review 或 published 前中间态（应用层） |
| published | published |
| rejected | rejected |
| （归档） | archived |

**正式出题只应读取可信（published + 新鲜 reviewedContentHash + verified 来源）案例。** 本步候选均为 `draft`。

---

## 6. 版本机制

- `version`：semver（如 `0.1.0`）  
- `contentHash`：语义字段 SHA-256（排除 reviewStatus / 时间戳 / contentHash 自身）  
- `reviewedContentHash`：通过审核时的 contentHash；不一致则审核失效（`isReviewFresh`）

语义内容变更 → 哈希变 → **不得**无条件沿用旧审核结果。

---

## 7. 结构校验 vs 化学验证

`validateIndustrialCase`：结构、引用、枚举、依据门槛、哈希一致性。  
**通过 ≠ 化学正确 / 工艺合理 / 方程式正确。** 不调用 AI 作科学认证。

---

## 8. 与 chem_experiments 复用结论（D020）

### 可直接复用

- 审核流字段：`status`, `review_note`, `reviewed_*`  
- 文本槽：`purpose`, `principle`, `steps`, `reagents`, `safety_notes`, `precautions`  
- 关联：`chem_experiment_reactions` / `_substances` / `_images`  
- 挂靠专项分类：`chem_entity_specialties` / `chem_entity_categories`

### 需应用层补充（本步 JSON）

- `caseType`、结构化 `processSteps`/`materials`、`sourceReferences`、`contentHash`/`version`、课程审核独立态

### 未来可能最小 DB 扩展（**未实施**）

- `kind`/`case_type` 列，或 `process_json`/`case_code`/`content_hash` 等；须用户确认后改 `db/init.sql`

### 当前存储

**文件级候选：** `docs/chemistry_industrial_experiment/cases/*.json`  
**尚未**写入 `chem_experiments`，**不是**正式 KB。

---

## 9. 与 STEP_05 流程图关系

- **案例模型：** 工艺语义（物料、步骤、反应、条件）  
- **流程图 JSON（STEP_05）：** 学生可见图形结构，须安全投影，**不得**泄露内部正确答案  

二者分离；本步不实现流程图协议。

---

## 10. 未来 AI 出题使用方式（规划）

仅允许读取 `publishEligible` 且人工 published、依据 verified、审核哈希新鲜的案例；生成物仍进 test 池 + 质检 + 审核。LocalGenerator 现状见 D030。

---

## 11. 已知限制

- 无 DB 持久化；无后台 UI  
- 候选来源均为 unverified  
- 无完整化学推理引擎  
- STEP_02/03 实库种子写入仍待验证（见 TEST_REPORT）
