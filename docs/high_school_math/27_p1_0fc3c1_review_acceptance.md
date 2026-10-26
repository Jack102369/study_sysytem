# P1-0F-C3C.1：人工审核工作台真实验收

**日期**：2026-10-24  
**库**：`study_system`  
**验收 API**：临时进程 `http://127.0.0.1:3010`（含本阶段队列 SQL 修复；**未重启**生产 `:3000`）  
**脚本**：`pnpm --filter api run hs-math:p1-0fc3c1-acceptance`

---

## 1. HTTP 权限

| 用例 | 结果 |
|------|------|
| 未登录 queue/panel/POST → 401 | PASS |
| USER queue/panel/POST → 403 | PASS |
| ADMIN queue/panel → 200 | PASS |
| ADMIN 打开 0004/0008/0009 panel | PASS（只读，未写审核） |

---

## 2. 审核队列

| 项 | 结果 |
|----|------|
| 默认 formal + draft | PASS |
| 不含 P0 / IT | PASS |
| total=80（CH01 draft） | PASS |
| page/pageSize | PASS |
| reviewStatus=none | PASS |
| **2000 内存截断** | **已修复**：`ROW_NUMBER` 子查询 + 参数化 LIKE；`take(2000)` 已删除 |

---

## 3. MySQL 审核写入（仅 `HS_MATH_P1_0FC3C1_IT_*`）

| 项 | 结果 |
|----|------|
| B1 passed 写入 | PASS |
| B2 status 仍 draft | PASS |
| B3 reviewer=JWT.sub | PASS |
| B4 reviewedAt 服务端 | PASS |
| B5 意见保存 | PASS |
| B6 历史追加 | PASS |
| B7 rejected 禁发布 | PASS |
| B8 deferred 禁发布 | PASS |
| B9 版本 409 | PASS |
| B10 指纹 409 | PASS |
| B11 改内容 → STALE | PASS |
| B12 无审核禁发布 | PASS |
| B13 缺 confirmPublish | PASS |
| B14 IT 不可 approved | PASS |
| B15 并发双写均成功、历史保留 | PASS |
| B16 行锁（源码 FOR UPDATE） | PASS（实死锁演练 NOT_RUN） |
| 合法非 IT 发布成功路径 | **NOT_RUN**（设计禁止解除 IT 门禁） |

清理：IT 题与审核记录已删净；基线恢复。

---

## 4. 并发与事务

- `submitReview` / `publish` 均对题目 `pessimistic_write`  
- 审核仅 INSERT；失败不改 status  
- 最新结论：`reviewed_at DESC, id DESC`  
- 实战双 POST 并发：两行均写入  

---

## 5. 浏览器 / KaTeX

| 项 | 结果 |
|----|------|
| Web build | PASS |
| 浏览器 ADMIN 全流程（登录→审 IT 题→公式目视） | **NOT_RUN**（未用真实密码做 UI 登录；避免误审正式题） |
| KaTeX 源码路径 | PASS（`MathStem`/`MathOptionList` + `renderMathHtml` 转义） |
| HTTP panel 含 `$...$` 题干（0004 等） | PASS（服务端下发；渲染依赖前端组件） |

生产 `:3000` 若未热更，需用户自行重启后才能用到队列 SQL 修复。

---

## 6. 数据库前后对比

| 指标 | 前 | 后 |
|------|----|----|
| train_items | 85 | 85 |
| CH01 draft | 80 | 80 |
| approved formal | 0 | 0 |
| kps | 121 | 121 |
| reviews | 0 | 0 |
| sessions | 39 | 39 |
| session_items | 195 | 195 |
| P0 1–5 | disabled | disabled |
| chem_specialties | 12 | 12 |

---

## 7. 回归

- p1-0fc3c / c3b / p1-0d1 / selftest / api build / web build：**PASS**

---

## 8. 剩余风险

1. 生产 API `:3000` 可能仍为修复前二进制，需运维重启加载新 dist。  
2. `reviewStatus` SQL 按**版本维**判 stale；纯指纹漂移依赖 enrich 剔页（不回填），极端情况下当页条数略少。  
3. 合法（非 IT）成功发布路径未在本阶段实库演练。  
4. 浏览器目视 KaTeX / 移动端布局未做。

---

## 9. 准入结论

**READY_FOR_HUMAN_REVIEW**

条件：用户确认生产/本地 API 已加载含 C3C.1 修复的构建后，可在审核工作台对正式 draft 做人审（仍须另授权才可正式批准发布）。
