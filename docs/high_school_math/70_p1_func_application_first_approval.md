# P1-FUNC · 首道正式应用题正式批准

> **执行时间**：2026-10-25T06:01:36.655Z（约 14:01 +08）  
> **库**：`study_system` @ `127.0.0.1`  
> **方式**：管理员 `PATCH .../status`（`status=approved`, `confirmPublish=true`）  
> **结果**：**PASS**  
> **APPLICATION-1**：保持 **PARTIAL**（待学生提交 / pending_ai 验收）  
> **APPLICATION-2**：保持 **NOT_STARTED**  
> **CORE-1A-4B**：保持 **BLOCKED**

---

## 1. 目标

| 字段 | 值 |
|---|---|
| id | **151** |
| code | `HSMA-RJA-CH03-APP-0001` |
| 批准前 | formal · **draft** · version=3 |
| 批准后 | formal · **approved** · version=3 |

仅批准本题；未批准其他题。

---

## 2. 执行前检查

本地 `127.0.0.1` / `study_system`；review-panel：`passed`、非 STALE、`canPublish=true`、`publishBlockReasons=[]`；fingerprint 匹配入库值；rubric=10；来源 original/unverified/unknown。  
**PRECHECK = PASS** → 执行批准。

---

## 3. API 响应

| 项 | 值 |
|---|---|
| 方法 | `PATCH /hs-math/admin/train-items/151/status` |
| body | `{ "status": "approved", "confirmPublish": true }` |
| HTTP | **200** |
| 返回 status | `approved` |
| contentVersion | 3 |

账号：ADMIN `user_id=2`。未使用 SQL UPDATE。

---

## 4. 数据库核验（SELECT）

| 检查 | 结果 |
|---|---|
| status=approved | **PASS** |
| qtype=application | **PASS** |
| pool=formal | **PASS** |
| content_version=3 | **PASS** |
| is_active=1 | **PASS** |
| rubric 合计 10 | **PASS** |
| KP 未变 | 主 `rja.3.2.06`；辅 `rja.3.1.06`、`rja.3.1.02` |
| 方法未变 | 主 `mono_analysis`；辅 `equiv_transform` |
| 来源未变 | original / **unverified** / **unknown** |
| 审核记录 | review#31 passed 仍有效（version=3 + 同 fingerprint） |
| items | **111** |
| approved | **13**（12→13） |
| draft | 93（94→93） |
| application approved | **1** |
| 其他 110 题 CRC 签名 | **未变**（cnt=110，sig 相同） |

`items.reviewed_at` / `reviewed_by` 由批准接口写入（user_id=2），与人工审核表记录分离。

---

## 5. Rubric / KP / 方法 / 来源（摘要）

- rubric：model3 + domain2 + solve3 + conclusion2 = 10  
- KP / 方法：同上，与批准前一致  
- 来源：**未**标记 verified/permitted  

---

## 6. 其他保护

未改化学、错题本、积分、权限；未迁移；未改学习记录；未进 APPLICATION-2 / CORE-1B。

---

## 7. 下一步

学生端正式抽题 → 文字提交 → 验证 `pending_ai` → 结果与历史。  
**本轮停止。**
