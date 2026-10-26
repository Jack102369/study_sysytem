# P1-FUNC · 第三章首批 12 题人工审核持久化核验

> **性质**：只读核验（用户已在管理后台手动「审核通过」）  
> **库**：`study_system` @ `127.0.0.1`  
> **SELECT / panel 时间**：`2026-10-25T12:12:52+08:00`  
> **结果**：**PASS**（审核已持久化；12 题 `READY_FOR_APPROVAL`）  
> **未做**：approve、改题、改来源、写审核、迁移  
> **4B**：仍 **BLOCKED**（本文件不改判）  
> 快照：`db/backups/_ch03_review_verify_20261025.json`

---

## 1. 实时基线

| 指标 | 值 |
|---|---|
| DATABASE() | `study_system` |
| items | **110** |
| status | draft **105** / disabled **5** / approved **0** |
| methods | **11** |
| item_methods | **16**（目标 12 题关联仍为 16） |
| reviews（全库） | **12** |
| 目标 12 题 reviews | **12**（各 1 条） |

---

## 2. 核验结论摘要

| 检查 | 结果 |
|---|---|
| 12 题全部存在 | **是** |
| 全部仍为 draft | **是** |
| 当前版 reviewStatus=passed | **12/12** |
| 审核指纹与当前题一致 | **12/12** |
| STALE | **无** |
| rejected | **无** |
| 冲突/重复 passed（同版不同指纹） | **无** |
| canPublish | **12/12 true** |
| publishBlockReasons | 全部 **[]** |
| approvalReadiness | **12× READY_FOR_APPROVAL** |
| 来源仍为 original/unverified/unknown | **是**（未改；≠已核实原创） |
| approved | **仍为 0** |

**passed ≠ approved**：题目尚未进入学生正式池。

---

## 3. 逐题核验表

| code | ver | status | reviewStatus | fpMatch | stale | canPublish | blockReasons | approvalReadiness |
|---|---:|---|---|---|---|---|---|---|
| PARITY-0001 | 2 | draft | passed | yes | no | **true** | — | **READY_FOR_APPROVAL** |
| PARITY-0002 | 2 | draft | passed | yes | no | **true** | — | **READY_FOR_APPROVAL** |
| PARITY-0005 | 2 | draft | passed | yes | no | **true** | — | **READY_FOR_APPROVAL** |
| PARITY-0006 | 2 | draft | passed | yes | no | **true** | — | **READY_FOR_APPROVAL** |
| PARITY-0007 | 2 | draft | passed | yes | no | **true** | — | **READY_FOR_APPROVAL** |
| PARITY-0010 | 2 | draft | passed | yes | no | **true** | — | **READY_FOR_APPROVAL** |
| PARITY-0011 | 2 | draft | passed | yes | no | **true** | — | **READY_FOR_APPROVAL** |
| PARITY-0012 | 2 | draft | passed | yes | no | **true** | — | **READY_FOR_APPROVAL** |
| PARITY-0015 | 2 | draft | passed | yes | no | **true** | — | **READY_FOR_APPROVAL** |
| PARITY-0019 | 2 | draft | passed | yes | no | **true** | — | **READY_FOR_APPROVAL** |
| PARITY-0020 | 3 | draft | passed | yes | no | **true** | — | **READY_FOR_APPROVAL** |
| PARITY-0025 | 3 | draft | passed | yes | no | **true** | — | **READY_FOR_APPROVAL** |

审核意见示例：评论「通过」；审核人 userId=`2`；时间约 `12:09:07`–`12:11:25+08`。  
完整 fingerprint 见快照 JSON（与 review-panel 计算值一致）。

---

## 4. 发布门禁说明

- 审核门禁：当前版 passed + 指纹匹配 → 通过。  
- 质量门禁：panel 无额外阻断。  
- 来源门禁：`original`+`unverified`+`unknown` 按产品规则**允许** formal 批准路径；**仍须知情**：这不等于「已核实原创」。  
- 池/状态：formal + draft + active → 可走 approve。  
- **本轮未执行 approve。**

---

## 5. 最终问答

1. 12 道题是否全部 passed？→ **是**（库内持久化）。  
2. 是否存在 STALE？→ **否**。  
3. 是否存在审核指纹不匹配？→ **否**。  
4. 是否全部具备正式批准条件？→ **是**（`READY_FOR_APPROVAL`×12；`canPublish=true`）。  
5. 哪些题目仍被发布门禁阻止？→ **无**。  
6. 当前 approved 数量？→ **0**。  
7. 下一步是否可以进入正式批准？→ **可以，但须用户另开授权**；本核验**不**自动 approve。

---

## 6. 待授权

对上述 12 题执行正式 `approve`（`confirmPublish`）写入学生 formal 池 —— **须单独明确授权**。
