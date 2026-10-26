# APPLICATION-4C-4D — 高一数学应用题日常 AI 自动批改正式启用

> 状态：**PASS**（配置启用 + API 重启；本任务主动模型 HTTP = 0；UI_NOT_RUN）  
> 日期：2026-10-26  
> 前置：4C-4C = PASS · 4C-4B = PARTIAL

---

## 1. 授权依据

用户明确授权 **A–H**：

- OWNER_ONLY；仅 `user_id=2`  
- 启用自部署 Qwen + 可选 DeepSeek  
- DeepSeek 北京时间每日最多 **20**  
- Qwen 无日费用额度，保留并发/超时/幂等  
- 允许本地 API:3000 构建重启  
- 允许此后网页主动提交触发真实批改  

未扩大到其他用户或业务。

---

## 2. 启用前状态

| 项 | 值 |
|----|-----|
| 库 | `study_system` / MySQL 8.0.44 |
| `hs_math_deepseek_daily` | 存在；行数 0 |
| synchronize | false |
| Vision/AI | false / false |
| MODE | unset → disabled |
| TEST allowlist | 均未设置 |
| API PID | 7292 @3000 |
| Qwen URL/KEY / DeepSeek KEY | 已配置（不输出） |

---

## 3. 配置变更

备份目录：`db/backups/application4c4d_20261026_123133/`  
（含 `api.env.pre_enable.bak`、session 快照、flags）

| 变量 | 新值 |
|------|------|
| `HS_MATH_APPLICATION_AI_MODE` | `owner_only` |
| `HS_MATH_APPLICATION_AI_ALLOWED_USER_IDS` | `2` |
| `HS_MATH_VISION_GRADING_ENABLED` | `true` |
| `HS_MATH_AI_GRADING_ENABLED` | `true` |
| `HS_MATH_DEEPSEEK_DAILY_LIMIT` | `20` |

未设置 TEST_USER/SESSION/ITEM（避免阻断动态 session）。  
未设置 LIVE_HTTP_BUDGET（日常不限进程预算；日额度走 MySQL）。  
`HS_MATH_VISION_MAX_INFLIGHT`：未设 → 代码默认 **2**。

---

## 4–5. 构建与重启

- 离线 stub / API build / Web build：均 PASS（启用前）  
- 停止 PID 7292；启动 `node dist/main.js` → **PID 29536**  
- health：`GET http://127.0.0.1:3000/health` → **200** `{"success":true,"data":{"app":"api","db":"ok"}}`  
- 仅一个进程监听 3000（IPv4+IPv6 同 PID）

---

## 6. OWNER_ONLY / 额度 / 并发

| 检查 | 结果 |
|------|------|
| MODE owner_only | PASS |
| allowlist 仅 2 | PASS |
| user=2 动态 session | 允许（stub/postcheck） |
| user≠2 | 拒绝 |
| DeepSeek 日限 20 | PASS |
| 额度表可读 | PASS（行数仍 0） |
| Qwen 并发默认 | **2** |
| 历史自动扫描 | 无（启动未改 session） |

---

## 7. 历史记录

session **124 / 125 / 126** 题目行快照启用前后 **完全一致**（UNCHANGED）。  
`hs_math_deepseek_daily` 仍为 **0** 行 → 本任务无主动模型调用、无额度写入。

---

## 8. 实际 AI 调用（本任务）

| 项 | 值 |
|----|-----|
| 主动 Qwen HTTP | **0** |
| 主动 DeepSeek HTTP | **0** |
| 日常自动批改 | **ENABLED**（配置已生效；待用户网页提交触发） |
| UI | **UI_NOT_RUN** |

---

## 9. 用户日常使用（说明）

`user_id=2` 登录 → 应用题 → 默认千问 / 可选 DeepSeek → 提交 → 自动批改。  
识别不确定 → `review_required`；DeepSeek 日额度尽 → 明确提示，无假 0 分。

---

## 10. 回滚方案

若需紧急关闭，恢复：

```
HS_MATH_APPLICATION_AI_MODE=disabled
HS_MATH_VISION_GRADING_ENABLED=false
HS_MATH_AI_GRADING_ENABLED=false
```

可从备份 `api.env.pre_enable.bak` 还原后重启 API，并检查 health。

---

## 11. 停止边界

本轮完成即止。不自动进入下一阶段 / CORE-1B。
