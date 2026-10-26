# HS-MATH-BANK-GLOBAL-1I — 首批 100 道题正式批准

> 日期：2026-10-26  
> **最终状态：`APPROVE_PASS`**  
> 前置：GLOBAL-1I-PREFLIGHT = `PREFLIGHT_PASS`  
> **未**改题干/答案/解析；**未**重新 review；**未** push；**未**进入 GLOBAL-1J / CORE-1B

---

## 1. 用户授权

> 授权 GLOBAL-1I：允许备份，并通过现有管理员 approve API逐题正式批准首批100道高一数学题；失败立即停止，禁止其他业务写入。

执行确认：批准执行 HS-MATH-BANK-GLOBAL-1I（首批100道题正式批准）。

管理员：真实 JWT，`userId=2`（ADMIN）。

---

## 2. 备份

| 文件 | bytes | SHA256 |
|------|------:|--------|
| `docs/high_school_math/_backups/g1i_cand100_2026-10-26T09-17-15.json` | 211369 | `0e2b49ef8b73d0675ec5a17f3491bff4cea74fbee9b46dc54ba26916e4ffcc59` |
| `docs/high_school_math/_backups/g1i_cand100_2026-10-26T09-17-15.sql` | 211538 | `ef0824134c82eb46980bd324929d2ce08cd402e7dc9e159cd12adff8755eb1ac` |

范围：本批 100 题 + reviews + KP/method；**不含**学生训练历史/上传图/其他学科。  
校验：存在、非空、可读。备份失败则不会进入 approve（本跑通过）。**勿 git。**

---

## 3. 批准前复验

| 项 | 结果 |
|----|------|
| CAND 001–100 | 100；formal+draft+active |
| 面板 canPublish | **100** |
| 037/074 | cv=2 + 当前 passed + fp 匹配 |
| 与 PREFLIGHT 不一致 | **无** → 进入 approve |

---

## 4. API 执行

| 项 | 值 |
|----|-----|
| 入口 | `PATCH /hs-math/admin/train-items/:id/status` |
| Body | `{ "status": "approved", "confirmPublish": true }` |
| 顺序 | CAND-G1B-001 → 100 |
| **approve API 调用次数** | **100** |
| **成功** | **100** |
| **失败** | **0** |
| **未执行** | **0** |
| 停止点 | 无 |
| 事务语义 | **逐题独立事务**（非整批原子）；本跑全程成功 |

旁证（勿含密钥、勿 git）：`question_bank/_g1i_approve_run.mjs` → `_g1i_approve_result.json`

---

## 5. 最终独立验收（实测）

| 验收项 | 预期 | **实测** |
|--------|-----:|---------:|
| CAND 总数 | 100 | **100** |
| 本批 approved | 100 | **100** |
| 本批 draft | 0 | **0** |
| formal+approved+active（本批） | 100 | **100** |
| 037/074 cv | 2 | **2**（均 approved） |
| 其他 98 题 cv | 仍为 1 | **是** |
| KP / method | 完整 | 缺 0 / 主 KP 异常 0 |
| application rubric | 24 有效 | **0 bad** |
| 原 13 道正式题 | 不变 | **hist13Unchanged=true**（仍 13） |
| sessions / session_items | 131 / 354 | **131 / 354** |
| drawable | 113 | **13 → 113** |

抽样面板（001/037/074/100）：`status=approved`，当前 review `passed` 且非 stale，fp 与当前版本一致。

---

## 6. 未完成项

**无。** 100/100 approved；首批已进入正式可抽题池。

---

## 7. 最终状态

```
APPROVE_PASS
```

下一步须**另授权**（不得自动 GLOBAL-1J）。
