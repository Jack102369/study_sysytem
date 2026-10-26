# HS-MATH-BANK-GLOBAL-1H — 首批 100 道 draft 逐题正式审核

> 日期：2026-10-26  
> **最终状态：`REVIEW_PASS`**  
> 前置：1G=`DRAFT_IMPORT_PASS` · 1H-PREFLIGHT=`PREFLIGHT_PASS`  
> **本阶段**：经现有 Admin `POST .../:id/reviews` 写入真实 review；**禁止 approve**；未改正文；未 push

---

## 1. 授权

> 授权 GLOBAL-1H：允许对首批100道 draft 题逐题审核，并通过现有 review API 写入真实审核记录；禁止 approve，存在疑点的题必须暂缓。

计划确认后按 H1→H4 执行。

---

## 2. 审核范围与顺序

| 项 | 值 |
|----|-----|
| 范围 | `CAND-G1B-001` … `CAND-G1B-100`（仅此 100） |
| 入口 | `GET .../review-panel` → 独立判定 → `POST .../reviews` |
| 身份 | 真实 ADMIN（JWT `sub`=管理员用户 id，服务端写入 reviewer） |
| 绑定 | 每题当前 `content_version` + `contentFingerprint` |
| 禁令 | 无 SQL 插 review；无伪造 reviewerId；无 `PATCH status=approved` |

批次（每题只审一次）：

| 批次 | 内容 | 本题落地 |
|------|------|----------|
| H1 | 037、074 | 2 passed |
| H2 | application（去重） | 24 passed |
| H3 | 压轴 d3（去重） | 含交叉后并入顺序 |
| H4 | 其余 | 扫尾至 100 |

机器明细：`_g1h_review_result.json`（本地产物，**勿 git**）。

---

## 3. 审核口径（非自动标签）

- `AUTHOR_CHECKED` / `SPOT_VERIFIED` **仅参考**，写入 comment 标明「历史标签仅参考」。  
- 每题：协议校验（options / answerPayload / rubric）+ 与候选源交叉（防入库漂移）+ 题型专项重解（量词/判别式/对数定义域/向量律/斜二测等）。  
- 疑点 → deferred/rejected；本跑 **无硬伤**。

---

## 4. API 结果汇总

| 口径 | 数量 |
|------|------|
| 实际审核提交且成功 | **100** |
| `passed` | **100** |
| `rejected` | **0** |
| `deferred` | **0** |
| 未审核 / skip / API 失败 | **0** |
| stale（version 错配） | **0** |
| 库内 CAND 上 review 行 | **100**（全 passed） |

审核者：Admin 用户 id（见 `_g1h_review_result.json` 的 `adminUserId`；由服务端记入 `reviewer_user_id`）。  
指纹：每题 `content_version=1`，提交前后指纹与面板一致；100 题指纹互不相同。

---

## 5. 037 / 074

| | 037 | 074 |
|--|-----|-----|
| 决策 | **passed** | **passed** |
| 方法 | `log_laws_domain` | `vector_laws` |
| 数学 | A,B,D（对数）；C 不宜 | A,B,C（向量）；D 叉积错 |
| 题干 | 短模板「正确的是（多选）」 | 同左 |
| 结论 | 依赖选项呈现题意；**非换壳重复**（章/KP/选项/答案均异） | 同左 |

**本阶段不改正文。** comment 已要求：**approve 前建议润色题干加主题前缀**。  
未因短干暂缓：题干+选项整体题意明确，数学可确认。

---

## 6. 隔离验收（只读）

| 检查 | 结果 |
|------|------|
| approved 增量 | **0** |
| drawable | **仍 13** |
| CAND 仍 draft+formal | **100** |
| sessions / session_items | **不变** |
| 题目正文 | **未改** |

`review passed ≠ approved`；学生仍不可抽本批。

---

## 7. 剩余问题 / 风险

1. 037/074 题干润色留待改稿授权后再审或重审指纹。  
2. 批准（GLOBAL-1I 等）须另授权 + `confirmPublish`。  
3. 运行器 `_g1h_review_run.mjs` / 结果 JSON **勿提交 git**。

---

## 8. 最终状态

```
REVIEW_PASS
```

本阶段 **停止**。不得自动进入 GLOBAL-1I。
