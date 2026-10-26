# APPLICATION-4C-3 — Session 126 真实重新申请 AI 批改验收

**状态：PASS**（API 真实验收；UI=UI_NOT_RUN）

---

## 1. 授权

用户明确授权 **A–H**：仅 session **126** / item **349**；Qwen≤1、DeepSeek≤1；允许改该条 AI 字段；临时开开关；API:3000 重启与恢复。

---

## 2. 预检（只读）

| 项 | 结果 |
|---|---|
| user_id=2 / completed / application / item 151 | PASS |
| `review_required` + `awaiting_multimodal` | PASS |
| `ai_attempt_count=0` / `ai_grade_json=null` | PASS |
| provider=deepseek / imageIds=[55,56] submitted | PASS |
| rubric 3/2/3/2=10 | PASS |

---

## 3. 安全闸门（本轮补强）

新增 `HS_MATH_VISION_GRADING_TEST_SESSION_ITEM_IDS`（与 USER/SESSION 叠加）。  
HTTP 路径传 `sessionItemId` 校验。3D-9 stub 含 item allowlist 用例。  
进程预算：Qwen=1、DeepSeek=1（失败也计数；本轮各用 1）。

未将 `ENABLED=true` 写入 `.env`。

---

## 4. 执行

1. API build（含 4C-2 regrade）。  
2. 临时 Vision/AI=true + allowlist user=2 / session=126 / item=349 + budget 1/1。  
3. JWT(user 2) → `POST /hs-math/train/sessions/126/items/349/regrade` `{}`。  
4. 轮询 getSession：`grading` → **`graded`**。  
5. 第二次 regrade → **409**；预算仍 1/1。  
6. 恢复开关 false；health 200。

---

## 5. 结果

| 项 | 值 |
|---|---|
| Qwen | **1/1**（qwen3.8-27b-orca-q8） |
| DeepSeek | **1/1**（deepseek-chat） |
| pipeline | qwen_then_deepseek |
| grade_result | **graded** |
| grade_reason | ai_graded |
| totalScore | **10 / 10** |
| rubric | model 3 / domain 2 / solve 3 / conclusion 2 |
| recognizedWork | 含 y=2400x-30x²、y=-30(x-40)²+48000、x=40、48000 元 |
| recognitionUncertain | 未置位（过门禁） |
| ai_attempt_count | 1 |
| 原答案 / imageIds / provider | **未变** |
| correct/wrong | 仍 0/0（未污染） |
| 越权外发 | 无（allowlist + budget） |
| 重复调用 | 无 |
| UI | **UI_NOT_RUN** |

---

## 6. 环境恢复

| 项 | 结果 |
|---|---|
| `.env` Vision/AI | 仍为 **false**（未持久改写） |
| 进程恢复后 Vision/AI | **false** |
| health | **200** |
| allowlist / budget 临时 env | 已清除 |

说明：验收期间曾释放占用 3000 的旧进程；恢复后已用 `node dist/main.js`（开关 false）拉起。若本地 `pnpm dev` 需重新启动前端侧，请自行 `pnpm dev`。

---

## 7. 遗留

- 浏览器点「重新申请 AI 批改」未做（本轮 API 验收）。  
- 不自动进入 APPLICATION-4C-4 / CORE-1B。

原始摘要：`docs/high_school_math/_tmp_application4c3_live_raw.json`（无密钥、无完整 base64）。
