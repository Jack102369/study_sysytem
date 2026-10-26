# P1-FUNC · 首道正式应用题 formal draft 入库

> **阶段**：APPLICATION-1 前置（仅 draft 创建）  
> **执行时间**：2026-10-25T05:49:09.849Z（约 13:49 +08）  
> **库**：`study_system` @ `127.0.0.1`  
> **结果**：**PASS**（draft 创建成功；**未**审核、**未**批准）  
> **APPLICATION-1**：保持 **PARTIAL**  
> **APPLICATION-2**：保持 **NOT_STARTED**  
> **CORE-1A-4B**：保持 **BLOCKED**

---

## 1. 创建结果

| 字段 | 值 |
|---|---|
| id | **151** |
| code | `HSMA-RJA-CH03-APP-0001` |
| pool | `formal` |
| status | **`draft`** |
| qtype | `application` |
| difficulty | 2 |
| specialty / category | `rja-ch3`(18) / `3.4`(44) |
| content_version | **3**（create→1，KP→2，content-meta→3） |
| contentFingerprint | `20a3416034b0555c1cebbf7d3ff0f2d8ef4d456a114ddb123248470f4351cf2c` |

### API

| 步骤 | 方法 | HTTP |
|---|---|---:|
| 创建 | `POST /hs-math/admin/train-items` | **201** |
| KP 关联 | `PUT .../knowledge-points` | **200** |
| 来源+方法 | `PUT .../content-meta` | **200** |
| review-panel（只读） | `GET .../review-panel` | **200** |

账号：ADMIN `user_id=2`（JWT 签发，未改密码）。  
**未**调用 reviews / status approve。

---

## 2. Rubric

`maxScore=10`；合计 `3+2+3+2=10`。

| key | title | maxScore |
|---|---|---:|
| model | 建立收入函数模型 | 3 |
| domain | 定义域与实际约束 | 2 |
| solve | 最值推导过程 | 3 |
| conclusion | 实际结论与单位 | 2 |

各项 criteria 非空；`kind=application`；`standardAnswer` 含最终 40 元 / 48000 元。

---

## 3. 知识点关联

题目小节保持 **3.4**；API 允许同专长跨小节 KP（仅 `assertSameSpecialty`）。

| 角色 | code | id |
|---|---|---:|
| 主 | `rja.3.2.06` 最大值 | 31 |
| 辅 | `rja.3.1.06` 解析法 | 21 |
| 辅 | `rja.3.1.02` 定义域 | 17 |

`knowledge_point_id=31` 与主 KP 一致。

---

## 4. 方法关联

| 角色 | code | id |
|---|---|---:|
| 主 | `mono_analysis` | 36 |
| 辅 | `equiv_transform` | 38 |

**未**关联 `defn`。

---

## 5. 来源

| 字段 | 值 |
|---|---|
| source_type | `original` |
| source_verification_status | **`unverified`** |
| source_license_status | **`unknown`** |
| source_reference | 原创设计建议…尚未人工核实是否与公开题雷同 |

未设 `verified` / `permitted`。

---

## 6. 审核 / 发布状态

| 项 | 值 |
|---|---|
| reviews 表行数（本题） | **0** |
| currentReviewStatus | `none` |
| canSubmitReview | **true** |
| canPublish | **false** |
| publishBlockReasons | 「需要先完成当前版本人工审核」 |
| reviewed_at / reviewed_by | null |
| status | **draft**（非 approved） |

---

## 7. 数据库核验（实时 SELECT）

| 检查 | 结果 |
|---|---|
| 目标题唯一 | PASS（id=151） |
| qtype/pool/status/difficulty | application / formal / draft / 2 |
| rubric 合计 10 | PASS |
| analysis 完整 | PASS |
| KP / 方法 | PASS（如上） |
| 来源 unverified/unknown | PASS |
| 无 passed / 无 approved | PASS |
| items 总数 | **111**（110+1） |
| application 数 | **1** |
| approved 仍为 12 | PASS（未动正式可练题） |
| draft | 94（原 93+1） |

---

## 8. 下一步（需单独授权）

1. 人工审核 **passed**（对应当前 fingerprint / version=3）。  
2. **单独**授权正式 **approve**。  
3. 学生抽题 → 提交文字 → 验 `pending_ai` → 结果与历史。

**本轮停止。不得自动审核或批准。**
