# APPLICATION-3D-9 · Qwen Vision 提交后自动批改真实验收

> **日期**：2026-10-25  
> **状态**：**PARTIAL**（单样本自动联通；未覆盖错误/部分分）  
> **真实 Qwen HTTP**：**1 / 2**（第 2 次未用）  
> **验收后 Vision**：**false**（已重启 API）

---

## 1. 范围闸门（先于开开关）

| Env | 验收值 | 作用 |
|---|---|---|
| `HS_MATH_VISION_GRADING_ENABLED` | 临时 `true` → 结束 `false` | 总开关 |
| `HS_MATH_VISION_GRADING_TEST_USER_ID` | `2` → 清空 | 仅该用户 |
| `HS_MATH_VISION_GRADING_TEST_SESSION_IDS` | `108` → 清空 | 仅本会话；空=禁止外发 |
| `HS_MATH_VISION_LIVE_HTTP_BUDGET` | `2` → 清空 | 进程内 HTTP 上限 |

实现：`hs-math-vision-live-scope.ts` + submit/`scheduleVision`/`gradeApplicationVision` 闸门。  
stub：`hs-math:application3d9-selftest` **PASS 10**。

---

## 2. 本轮测试会话（新建，非历史）

| 项 | 值 |
|---|---|
| user_id | **2** |
| sessionId | **108** |
| sessionItemId | **331** |
| item_id / code | **151** / `HSMA-RJA-CH03-APP-0001` |
| imageIds（新上传） | **27**, **28**（虚构 PNG 字节新 upload，非历史行） |
| 题型筛选 | `application` · specialty 18 · category 44 · difficulty 2 |

未扫描 / 未外发历史 `review_required`。旧 session **51/55/56/107** 及 item **330** 未变。

---

## 3. 自动触发结果

| 项 | 值 |
|---|---|
| submit 后首态 | `grading`（`ai_grading:<epoch>`） |
| 终态 | **`graded`** / `ai_graded` |
| HTTP | **1**（日志 `used=1 max=2`）· ~8150ms |
| model | `qwen3.8-27b-orca-q8` |
| 评分 | **10 / 10** |
| rubric | model 3 · domain 2 · solve 3 · conclusion 2 |
| correct/wrong/pending | 0 / 0 / 0 · accuracy null |
| 自动重试 | 无 |

流程：submit → allowlist 通过 → `scheduleVisionGrading` → claim → 1× Qwen → 落库；结果 API 轮询约 10s 见 `graded`。

---

## 4. 收尾

1. `.env`：`ENABLED=false`；TEST_* / BUDGET 已清空。  
2. 重启 API（新 PID **3144**）· health **200**。  
3. 未迁移、未改题库、未部署。

---

## 5. 修改文件（本阶段）

- `util/hs-math-vision-live-scope.ts`（新建）  
- `hs-math.constants.ts` / `.env.example`  
- `hs-math-qwen-vision-client.service.ts`（HTTP 预算）  
- `hs-math-application-ai-grade.service.ts` / `hs-math-train.service.ts`  
- `util/hs-math-application3d9.selftest.ts` + package.json script  
- 本文 + `PROJECT_HANDOFF.md`

---

## 6. 阶段

**APPLICATION-3D-9 = PARTIAL**  
**APPLICATION-3D / APPLICATION-3 = PARTIAL** · **APPLICATION-3C = PASS**  
**CORE-1A-4B = BLOCKED** · **CORE-1B = NOT_STARTED**

---

## 7. 剩余风险 / 下一步

1. 仅验证满分双图自动路径；错误/部分分/超时未覆盖。  
2. 生产开启须另授权，并继续 fail-closed allowlist 或等价范围控制。  
3. CORE-1B 未启动。
