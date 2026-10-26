# HS-MATH-BANK-GLOBAL-1I-PREFLIGHT — 首批 100 题正式批准前最终检查

> 日期：2026-10-26  
> **最终状态：`PREFLIGHT_PASS`**  
> 前置：GLOBAL-1H = `REVIEW_PASS` · GLOBAL-1H-3 = `REVIEW_REFRESH_PASS`  
> **本阶段只读**；未 approve；未 review；未写库；未调 AI；未 push

---

## 1. 结论摘要

| 项 | 结果 |
|----|------|
| `CAND-G1B-001`～`100` | **恰好 100**；无缺/无多余/无重复 code |
| `formal + draft + active` | **100 / 100** |
| 当前有效 passed review（版本+指纹匹配） | **100** |
| 面板 `canPublish=true` | **100** |
| **可 approve** | **100** |
| **blocked** | **0** |
| 本批已 approved | **0** |
| drawable / 全库 approved | **13 / 13**（仍为历史正式题） |
| sessions / session_items | **131 / 354**（未因本阶段变化） |
| 037/074 | **cv=2** 有效 passed；旧 cv=1 全部 `isStale`；旧指纹 ≠ 当前 |
| 来源门禁 | **100 通过**（无 forbidden/restricted；adapted/past_exam 均 verified+permitted 或 original 兼容路径） |
| 可进入正式批准（GLOBAL-1I） | **是**（须另授权；本阶段未执行） |

---

## 2. 逐题只读核验

| # | 检查 | 实测 |
|---|------|------|
| 1 | pool=formal | 100 |
| 2 | status=draft | 100 |
| 3 | is_active=true | 100 |
| 4 | content_version | cv1=**98**；cv2=**2**（037/074） |
| 5 | 当前 fingerprint | 服务端 `GET .../review-panel` 重算；100 成功 |
| 6 | 最新有效 review=passed | 100（`currentReviewStatus=passed`，`reviewIsStale=false`） |
| 7 | review 版本 = 当前 cv | 100 |
| 8 | review fingerprint = 当前题 | 100 |
| 9 | 来源门禁 | 面板 `publishBlockReasons` 来源项空；DB 规则镜像通过 |
| 10 | KP / method | KP 链接 **100**（各 1 主）；method **109**；缺 0 |
| 11 | application rubric | **24/24** 有效 |
| 12 | 无重复 code | PASS |
| 13 | 无本批 approved / 无并发脏批 | 本批 approved=0；drawable 仍 13 |

旁证（含本地运行产物，**勿 git、勿含密钥**）：  
`question_bank/_g1i_preflight_ro.mjs` → `_g1i_preflight_ro.json`

---

## 3. 037 / 074 版本绑定（专项）

| code | db/panel cv | 当前 review | cv2 passed+fp | 旧 cv1 | 旧 fp=当前？ |
|------|-------------|-------------|---------------|--------|--------------|
| CAND-G1B-037 | **2** | passed / 非 stale / canPublish | **1** | 1 条 passed 且 **isStale** | **否** |
| CAND-G1B-074 | **2** | passed / 非 stale / canPublish | **1** | 1 条 passed 且 **isStale** | **否** |

- 历史 cv=1 review **允许保留**，不得作为批准 cv=2 的依据。  
- 批准门禁 `evaluateLatestReviewForPublish` **仅取同 `content_version`** 最新一条，再校验 fingerprint。  
- 旧审指纹与当前不一致 → 即使误用也会因指纹失败；且版本过滤已生效。  
- **未发现「旧 review 仍可错误批准新版」** → 非 `BLOCKED`。

---

## 4. 正式抽题与 approve 门禁（代码）

### 4.1 批准入口（唯一正式路径）

| 项 | 说明 |
|----|------|
| API | `PATCH /hs-math/admin/train-items/:id/status` |
| Body | `{ "status": "approved", "confirmPublish": true }` |
| 权限 | Admin JWT |
| 实现 | `publishWithHumanReviewGate`：事务内 **悲观锁单行** → 质量门禁 → formal 来源许可 → **重算 fingerprint** → `evaluateLatestReviewForPublish` → 写 `status=approved` |

质量门禁含：禁测前缀、非 test 池、题干/解析、答案协议、章节/小节启用、≥1 KP 且唯一主 KP。  
来源：`assertSourceAllowsFormalPublish`（forbidden/restricted 拒；真题/改编须 verified+permitted）。

### 4.2 学生抽题

`HsMathTrainService` 候选条件：`pool`（正式）+ **`status='approved'`** + **`isActive=true`**。  
draft **不会**进入正式抽题池。开训事务内再次校验 approved+active。

### 4.3 禁止绕过

- 不得 SQL 直改 `status`。  
- 不得在无 `confirmPublish=true` 时批准。  
- review passed ≠ approved（`submitReview` 不改 status）。  
- **本预检未调用**任何写入 API。

---

## 5. GLOBAL-1I 批准执行方案（文档；未执行）

### 5.1 事务语义（重要）

- **无**「一次 API 批批 100 题」接口。  
- 每题一次 `PATCH .../:id/status`；**每题单独事务**（单行锁）。  
- **不存在整批原子性**：前 N 题成功、第 N+1 失败时，库中已有 N 题为 approved。  
- 报告成功数必须 = 实际 HTTP 成功数；**禁止**部分成功虚报 100/100。

### 5.2 建议步骤

1. **备份**：100 题 `hs_math_train_items` + 对应 `hs_math_train_item_reviews`（及 KP/method 关联）JSON/SQL；校验非空+哈希。  
2. 记录基线：drawable=13、本批 approved=0、sessions/session_items。  
3. Admin 逐题（或受控小批串行）调用 approve；**每题记录** code / id / HTTP / 错误体。  
4. 任一失败：**立即停止**；已成功保持 approved；失败题保持 draft；输出 PARTIAL 实数。  
5. 防重复：已是 approved 再批会状态机拒绝（「已是 approved」）。  
6. 验收：成功题 `status=approved`+active；drawable = 13 + 成功数；失败题仍 draft；训练历史不因 approve 本身增加。

### 5.3 本阶段明确未做

未 backup 执行、未 PATCH status、未改题、未写 MySQL。

---

## 6. 最终状态

```
PREFLIGHT_PASS
```

等待 **GLOBAL-1I** 正式批准的独立授权后，方可按 §5 执行。
