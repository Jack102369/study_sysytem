# P1-FUNC · APPLICATION-1 学生文字提交 / pending_ai 业务验收

> **执行时间**：2026-10-25T06:17:29.859Z（约 14:17 +08）  
> **库**：`study_system` @ `127.0.0.1`  
> **runTag**：`HS_MATH_APP1_STU71`  
> **测试账号**：ADMIN `user_id=2`（JWT 调用学生训练 API）  
> **API**：本地 `http://127.0.0.1:3000`（验收前进程未监听，已 `pnpm --filter api start` 启动，**未**改代码/迁移）  
> **结论**：**API/DB 业务闭环 PASS**；**UI_NOT_RUN**  
> **APPLICATION-1 整体**：**PARTIAL**（缺真实浏览器点验）  
> **APPLICATION-2**：**NOT_STARTED**  
> **CORE-1A-4B**：**BLOCKED**

---

## 1. 执行前 SELECT（基线）

| 指标 | 值 |
|---:|
| items | **111** |
| approved | **13** |
| draft | 93 |
| disabled | 5 |
| application approved | **1**（id=151） |
| methods / item_methods | 11 / 18 |
| reviews | 13 |
| 其他用户 sessions | 37（验收前后不变） |

id=151：`HSMA-RJA-CH03-APP-0001` · formal · **approved** · application · difficulty=2。

---

## 2. 创建练习（formal 抽题）

**POST** `/hs-math/train/sessions` → **201**

```json
{
  "specialtyId": "18",
  "categoryId": "44",
  "difficulty": 2,
  "count": 5,
  "mode": "sequential",
  "poolMode": "formal"
}
```

| 字段 | 值 |
|---|---|
| session_id | **51** |
| item_id（题库） | **151** |
| item_code | `HSMA-RJA-CH03-APP-0001` |
| qtype | application |
| pool | formal（会话 poolMode） |
| actualCount | 1（3.4 仅 1 道 approved，shortfall 正常） |
| status（创建后） | in_progress |

未改抽题规则；未 SQL 插会话。

---

## 3. 文字提交

**PATCH** `/hs-math/train/sessions/51/answers` → **200**

```json
{
  "sortOrder": 1,
  "userAnswerPayload": {
    "kind": "application",
    "text": "收入函数为 y=x(2400-30x)。配方得 y=-30(x-40)^2+48000，因此票价40元时收入最大，为48000元。"
  }
}
```

| 检查 | 结果 |
|---|---|
| 原文持久化 | **PASS**（`user_answer_payload_json.text` 含 48000） |
| 提交前 gradeResult | **null**（未提前判分） |

**POST** `/hs-math/train/sessions/51/submit` → **201**

| 检查 | 结果 |
|---|---|
| grade_result | **pending_ai** |
| 非 wrong / 非 correct | **PASS** |
| 无虚假 AI 分 | **PASS**（无 score 字段） |
| pending_count | **1** |
| correct_count | **0** |
| wrong_count | **0** |
| accuracyPercent | **null**（pending 不计分母） |

---

## 4. 幂等与保护

| 项 | HTTP | 结果 |
|---|---|---|
| 重复 submit | 200 | `submitMeta.idempotent=true` **PASS** |
| 已完成会话再 save | **409** | 「任务已结束，无法继续作答」 **PASS** |

未改历史会话做幂等破坏测试。

---

## 5. 结果 / 历史 / 学情

| API | HTTP | 要点 |
|---|---|---|
| GET `/hs-math/train/sessions/51` | 200 | pending_ai；analysis / answerPayloadJson 可见；methods：`mono_analysis`,`equiv_transform`；KP 有标签 |
| GET `/hs-math/train/sessions?page=1` | 200 | **sessionId=51** · completed · pendingCount=1 · accuracy=null |
| GET `/hs-math/train/analytics` | 200 | overview.pendingCount ≥ 1 |

说明：历史列表项字段为 **`sessionId`**（非 `id`）；按 sessionId 查询 **PASS**。

前端展示语义（代码层，未浏览器点验）：`MathGradeTag` →「待 AI 批改」；结果页说明 pending 不计入正确率分母。

---

## 6. 静态回归

| 命令 | 结果 |
|---|---|
| `pnpm --filter api run hs-math:application1-selftest` | **PASS** |

---

## 7. 执行后 SELECT（题库保护）

| 指标 | 验收前 | 验收后 |
|---:|---:|---:|
| items | 111 | **111** |
| approved | 13 | **13** |
| bank CRC 签名 | 249874527439 | **不变** |
| methods / reviews | 11 / 13 | **不变** |
| 其他用户 sessions | 37 | **37** |

测试账号新增：sessions 13→**14**，session_items 67→**68**（仅 user_id=2）。  
本地训练历史可保留；**勿同步至服务器个人历史**。

未写入：题库、审核、来源、rubric、方法词典；未调用 AI；未 approve。

---

## 8. 分项结论

| # | 验收项 | 结论 |
|---|---|---|
| 1 | application 正式抽题 | **PASS** |
| 2 | 文字提交 | **PASS** |
| 3 | pending_ai 持久化 | **PASS** |
| 4 | pending_count | **PASS** |
| 5 | 正确率未误计 | **PASS** |
| 6 | 结果查询 | **PASS** |
| 7 | 历史记录 | **PASS** |
| 8 | 旧题型（selftest） | **PASS** |
| 9 | 正式题库未变 | **PASS** |
| H | 真实学生端 UI | **UI_NOT_RUN** |

**APPLICATION-1 API/DB：PASS**  
**APPLICATION-1 整体：PARTIAL**（待 UI 点验）

---

## 9. 未验证 / 下一步

1. 浏览器：练习页输入 → 提交 → 结果页「待 AI 批改」展示。  
2. APPLICATION-2、CORE-1B、4B：**不进入**。

**本轮停止。**
