# 工业流程图 JSON 协议（STEP_05）

**协议版本 schemaVersion：** `1.0`  
**最后更新：** 2026-10-29 09:10:00 +08:00  

**已实现：** Definition / Public 类型、结构校验、案例引用校验、白名单安全投影、语义哈希、示例 JSON、自检。  
**未实现：** SVG 绘制、DB 持久化、题库绑定、AI 出题。

---

## 1. 设计目标

统一、稳定、可校验、可版本化的流程图数据协议，支撑后续 SVG、质检、题图绑定、历史快照与学生端安全展示。

**结构校验通过 ≠ 化学正确。**

---

## 2. 三层模型

| 层 | 类型 | 用途 | 可否给学生 |
|----|------|------|------------|
| 1 | `IndustrialCase`（STEP_04） | 工艺语义与知识依据 | 否 |
| 2 | `IndustrialDiagramDefinition` | 完整图 + 内部答案引用 | 否 |
| 3 | `IndustrialDiagramPublic` | 渲染必需字段 | **是** |

关系：Case →（引用校验）→ Definition →（`projectIndustrialDiagramPublic`）→ Public →（STEP_06）SVG。

---

## 3. Definition 主要字段

`schemaVersion`, `diagramId`, `caseCode`, `caseVersion`, `caseContentHash`, `diagramVersion`, `diagramContentHash`, `title`, `orientation`, `nodes[]`, `edges[]`, `internalReferences`, `reviewMetadata`

节点：`id`, `type`, `displayLabel`, `displayRole`, `presentation?`, `internal{ materialId, stepId, reactionReference, unknownKey, answerLabel }`

边：`id`, `from`, `to`, `type`, `displayLabel?`, `presentation?`

---

## 4. Public 字段（白名单）

仅：`schemaVersion`, `diagramId`, `diagramVersion`, `publicContentHash`, `orientation`, `title`, `nodes[{id,type,displayLabel,presentation?}]`, `edges[{id,from,to,type,displayLabel?,presentation?}]`

**不含** caseCode（避免多余追踪字段进入学生端；服务端会话绑定另议）。

投影函数禁止「展开后删字段」。

---

## 5. 节点与连接类型

节点：`material|process|reaction|separation|intermediate|product|waste|unknown`  
连接：`material_flow|reagent_input|condition|recycle|byproduct`

未知节点：学生只见占位 `displayLabel`（如「操作①」）；答案在 `internal.answerLabel`。

---

## 6. 循环规则

- `recycle` 边允许回流  
- `condition` 不参与物料环检测  
- 其他流边若形成有向环 → `UNEXPECTED_FLOW_CYCLE`  
结构合法 ≠ 化学上循环合理。

---

## 7. 校验与错误码

`validateIndustrialDiagramDefinition` / `validateIndustrialDiagramAgainstCase`  
结果：`{ valid, errors[{code,path,message,severity}], warnings }`  
错误码见 `industrial-diagram.constants.ts`（如 `DUPLICATE_NODE_ID`, `UNKNOWN_EDGE_TARGET`, `CASE_HASH_MISMATCH`, `PUBLIC_DATA_LEAK_RISK` 等）。

限制：节点 ≤40，边 ≤60，标签 ≤40，标题 ≤80；禁止 `<>` / 控制字符 / 类 HTML。

---

## 8. 哈希与版本

| 哈希 | 含义 |
|------|------|
| caseContentHash | 案例语义（STEP_04） |
| diagramContentHash | 服务端图语义（不含 reviewMetadata） |
| publicContentHash | 学生可见图语义 |

`diagramVersion` / `caseVersion`：semver。稳定序列化复用 `stableStringify` / `sha256Stable`。

历史训练应快照 **Public JSON + publicContentHash**（本步不改 session 表）。

---

## 9. 安全限制

`presentation` 仅 `shapeHint|toneHint|emphasis`。禁止任意 style、事件、URL、HTML、SVG 源码、JS。STEP_06 仅消费 Public。

---

## 10. 示例文件

`docs/chemistry_industrial_experiment/diagrams/`

- `salt_purification_basic.diagram.json`（含未知操作①）  
- `seawater_resource_basic.diagram.json`（多分支）  
- `metal_recovery_basic.diagram.json`（反应+试剂）  
- `salt_purification_basic.recycle.diagram.json`（recycle）  

均为 structure-only，`chemicallyReviewed=false`。

---

## 11. STEP_06 接入建议

1. 只接收 `IndustrialDiagramPublic`  
2. 服务端投影后再下发  
3. 布局引擎读取 `orientation` + presentation hints  
4. 前后端：当前无共享包；以后可抽契约测试或生成类型，避免漂移  

---

## 12. 已知限制

- 无 DB 持久化  
- 无自动布局坐标  
- 示例非化学终审  
- STEP_02/03 实库与浏览器仍待验  
