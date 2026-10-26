# HS-MATH-BANK-GLOBAL-1H-3 — 037/074 题干修订与新版本重新 review

> 日期：2026-10-26  
> **最终状态：`REVIEW_REFRESH_PASS`**  
> 前置：1H=`REVIEW_PASS` · 1H-2=`PREFLIGHT_PASS`  
> **本阶段**：Admin `PATCH` 仅改两题 stem → 确认旧审 stale → 新 cv=2 `POST .../reviews`；**未 approve**；未改其他 98 题

---

## 1. 授权

> 授权 GLOBAL-1H-3：允许通过现有管理员 API 修改037/074的题干，并按新版本重新review；禁止approve和修改其他98道题。

---

## 2. 修改前后

| code | 修订前 stem | 修订后 stem |
|------|-------------|-------------|
| CAND-G1B-037 | 正确的是（多选） | 下列关于对数运算法则的说法，正确的是（多选） |
| CAND-G1B-074 | 正确的是（多选） | 下列关于平面向量运算的说法，正确的是（多选） |

保留：options / answer / analysis / KP / method / difficulty / source / pool / status / is_active。

---

## 3. 备份

| 文件 | 说明 |
|------|------|
| `docs/high_school_math/_backups/g1h3_037_074_2026-10-26T…json` | 两题行 + 旧 review（非空，有 sha256） |
| 同时间戳 `.sql` 旁注导出 | 可读；**勿 git** |

---

## 4. PATCH 结果

| code | HTTP | content_version | fingerprint |
|------|------|-----------------|-------------|
| 037 | 成功 | **1→2** | `f841e04e…` → `8e1dc81f…` |
| 074 | 成功 | **1→2** | `c4e1a6a5…` → `15c80955…` |

PATCH 后面板：`currentReviewStatus=stale`，`reviewIsStale=true`（旧 cv=1 passed 失效）。  
其他 **98** 道 CAND：content_version / 内容 rough 指纹 **均未变**。

---

## 5. 重新 review

| code | 新 review | cv | fingerprint 匹配当前 |
|------|-----------|----|----------------------|
| 037 | passed（新 id，非复制旧行） | 2 | 是 `8e1dc81f…` |
| 074 | passed | 2 | 是 `15c80955…` |

comment 含：新题干全文、选项/答案未改、数学核对、旧审 stale 说明。  
审核者：真实 Admin JWT（服务端写入 reviewer）。

旧行仍在库：037 review#32 (cv=1)、074 #33 (cv=1) — **历史保留但非当前有效**。

---

## 6. 最终验收

| 检查 | 结果 |
|------|------|
| 037/074 cv=2、stem 正确 | PASS |
| 最新 review passed 且指纹匹配 | PASS |
| 旧 cv=1 review 非当前有效 | PASS（面板非 stale；当前为新 passed） |
| 其他 98 题未变 | PASS |
| approvedΔ | **0** |
| drawable | **13** |
| 训练历史 | **不变** |

---

## 7. 剩余

- 全批 100 题中，037/074 已新版本审过；其余 98 仍为 cv=1 的 1H passed。  
- **approve 须另授权**（GLOBAL-1I 等）；本阶段停止。

---

## 8. 最终状态

```
REVIEW_REFRESH_PASS
```
