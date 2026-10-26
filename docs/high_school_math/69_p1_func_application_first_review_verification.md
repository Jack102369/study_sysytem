# P1-FUNC · 首道正式应用题人工审核核实（只读）

> **最新核实**：2026-10-25T05:57:29.865Z（约 13:57 +08）  
> **库**：`study_system` @ `127.0.0.1`  
> **方式**：仅 SELECT + `GET .../review-panel`  
> **写库**：无  
> **结论**：**READY_FOR_APPROVAL**  
> **APPLICATION-1**：保持 **PARTIAL**（尚未 approve / 未验 pending_ai）  
> **APPLICATION-2**：保持 **NOT_STARTED**  
> **CORE-1A-4B**：保持 **BLOCKED**

---

## 0. 历史

| 时间 | 结论 |
|---|---|
| 2026-10-25 ~13:52 | **NOT_READY**（reviews=0；canPublish=false） |
| 2026-10-25 ~13:57 | **READY_FOR_APPROVAL**（本轮） |

---

## 1. 目标题目快照

| 字段 | 实际 |
|---|---|
| id | **151** |
| code | `HSMA-RJA-CH03-APP-0001` |
| qtype / pool / status | application / **formal** / **draft** |
| difficulty | 2 |
| content_version | **3** |
| contentFingerprint | `20a3416034b0555c1cebbf7d3ff0f2d8ef4d456a114ddb123248470f4351cf2c` |

与 draft 入库（68）指纹一致。

---

## 2. 人工审核核验（10 项）

| # | 检查 | 结果 |
|---|---|---|
| 1 | 存在 passed 审核记录 | **PASS**（review id=**31**） |
| 2 | 对应 version=3 | **PASS** |
| 3 | fingerprint 与当前题目匹配 | **PASS**（同上 fp） |
| 4 | reviewIsStale=false | **PASS** |
| 5 | currentReviewStatus=passed | **PASS** |
| 6 | canPublish=true | **PASS** |
| 7 | publishBlockReasons=[] | **PASS** |
| 8 | 仍 formal + draft | **PASS** |
| 9 | rubric/KP/方法/来源未变 | **PASS** |
| 10 | approved 总数仍为 12 | **PASS** |

### 审核记录

| 字段 | 值 |
|---|---|
| review id | 31 |
| review_status | `passed` |
| content_version | 3 |
| content_fingerprint | `20a34160…1cf2c` |
| reviewer_user_id | 2 |
| review_comment | 通过 |
| reviewed_at | 2026-10-25T05:55:56.019Z |
| panel 审核人展示名 | adu |

---

## 3. 内容未变核对

| 项 | 值 |
|---|---|
| rubric | model3+domain2+solve3+conclusion2 = **10** |
| KP | 主 `rja.3.2.06`；辅 `rja.3.1.06`、`rja.3.1.02` |
| 方法 | 主 `mono_analysis`；辅 `equiv_transform`（无 defn） |
| 来源 | original / **unverified** / **unknown** |

---

## 4. 发布资格（review-panel）

| 字段 | 值 |
|---|---|
| HTTP | 200 |
| canPublish | **true** |
| publishBlockReasons | **[]** |
| reviewIsStale | **false** |
| currentReviewStatus | **passed** |

**判定：READY_FOR_APPROVAL**

---

## 5. 题库计数（只读）

| 指标 | 值 |
|---:|
| items | 111 |
| approved | **12** |
| draft | 94 |
| disabled | 5 |
| application | 1 |
| reviews（全表） | 13（本题 1） |

---

## 6. 下一步（需单独授权）

正式 **approve** id=151（本轮**禁止**执行）。  
批准后再验学生抽题 / 提交 / `pending_ai`。

**本轮停止。未写库、未 approve。**
