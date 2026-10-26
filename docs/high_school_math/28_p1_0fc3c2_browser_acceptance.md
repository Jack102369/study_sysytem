# P1-0F-C3C.2：STALE 分页修复 + 运行环境核查 + 浏览器只读边界

**日期**：2026-10-24  
**库**：`study_system`  
**DB 变更**：NONE  
**API 重启**：未执行（本阶段无重启授权）

---

## 1. STALE 分页修复

### 问题

C3C.1 曾用 SQL `ROW_NUMBER` + `skip/take` 后再 `enrich`，指纹不一致时从本页剔除记录 → `items.length < pageSize`，`total` 与最终集合不一致，跨页可能漏 STALE。

### 修复

`listReviewQueue`（`hs-math-admin-train-item-reviews.service.ts`）：

1. 结构筛选（pool/status/章节/…/排除 IT 前缀）→ **`getMany()` 取全候选**（`ORDER BY i.id ASC`）。  
2. **`enrichQueueRowsBatched`（每批 100）** 计算指纹与 `currentReviewStatus`（含指纹维 STALE）。  
3. 按 `reviewStatus` 过滤。  
4. **`paginateStableList`** 得到 `items` / `total` / `page` / `pageSize`。

筛选、`total`、分页针对**同一**过滤后集合。无固定条数截断。

辅助模块：`hs-math-review-queue-paginate.ts`。

### 性能成本

正确性优先：每次队列请求对全部结构候选做指纹计算。当前 ~80 道 draft 可接受。千级题库会变慢；响应含 `candidateCount` / `enrichedCount` 便于观察。后续可再优化（缓存指纹列等），**本阶段不改表**。

### 分页一致性边界

同一次请求内跨页无重复/无遗漏（稳定 `id ASC`）。若两次请求之间有内容修改导致审核态变化，页内容可能漂移——属并发修改边界，已在文档声明。

### 测试

`hs-math:p1-0fc3c2-selftest`：Mock **N=2500**，stale=500，`pageSize=17`，30 页覆盖证明无重复/无遗漏；passed 子集与全量分页同样验证。**PASS**。

---

## 2. 运行环境核查（只读）

| 项 | 结果 |
|----|------|
| `:3000` | 监听中；`node …/apps/api/dist/main`；health 200；`review-queue` 未登录 → 401 |
| `:3010` | 未监听（C3C.1 临时进程已结束） |
| Vite `:5173` | 监听中；`vite` 开发服 |
| 前端 API 目标 | `apps/web/.env`：`VITE_API_BASE_URL=http://localhost:3000`（非 Vite proxy，直连 3000） |
| 新 dist | **已 build**，含 `paginateStableList` / `enrichQueueRowsBatched` |
| 运行中 3000 进程 | **启动早于本次 dist 刷新** → 内存中仍可能是旧逻辑，**需重启后才加载 C3C.2** |
| 生产 nginx | 未改动；本机开发端口，非生产部署操作 |

### 若需重启本地开发 API（待你授权）

建议报告要点：

- 端口 **3000**，PID 以当时 `Get-NetTCPConnection` 为准  
- 命令：`node --enable-source-maps …/apps/api/dist/main`  
- 工作目录倾向 `apps/api`  
- **本地开发**；重启会短暂中断连到 3000 的前端/其他模块调试  
- 安全方式：在 `apps/api` 确认 `pnpm build` 已完成 → 仅结束该 PID → 同命令重新启动 → `curl /health` 与 `review-queue` 401 冒烟  

**本次未重启。**

---

## 3. 前端源码检查

`HsMathTrainItemsReviewView.vue` / `hs-math-admin.ts`：

- 队列筛选、分页、`fetchReviewPanel`、MathStem/MathOptionList、审核历史、意见必填、二次确认、409 提示、发布走 `publishReviewedTrainItem`（`confirmPublish`）— 与 C3C 设计一致。  
- 未发现前端跳过后端门禁的直改 status 路径。

---

## 4. 浏览器只读验收

| 项 | 结果 |
|----|------|
| Vite 登录页可开 | PASS（目视） |
| 未登录访问 `/settings/hs-math-train-review` | 重定向 `login?redirect=…`（路由守卫生效）PASS |
| ADMIN 登录后工作台 / KaTeX / 80 题列表 | **NOT_RUN**（本阶段禁止把真实密码写入自动化；未获登录凭据注入） |
| 点击审核/发布 | **未执行**（禁止） |

结论标签：`BROWSER_E2E=PARTIAL`（仅到登录门禁）；完整工作台目视 = **NOT_RUN**。

---

## 5. 权限

复用 C3C.1：401 / USER 403 / ADMIN 200 — 本阶段未重复破坏性写入。浏览器侧验证未登录不可进设置页。

---

## 6. 数据库前后（只读）

| 指标 | 值 |
|------|-----|
| train_items | 85 |
| CH01 draft | 80 |
| approved formal | 0 |
| train_item_kps | 121 |
| review_records | 0 |
| sessions | 39 |
| session_items | 195 |
| chem_specialties | 12 |

未写入。

---

## 7. 回归

- `hs-math:p1-0fc3c2-selftest` PASS  
- `hs-math:p1-0fc3c-selftest` PASS  
- `hs-math:p1-0fc3b-selftest` PASS（同批执行）  
- `hs-math:selftest` PASS  
- `api build` PASS  
- `web build` PASS  

---

## 8. 剩余风险

1. **运行中 `:3000` 未加载本次 dist**，STALE 分页修复对浏览器不可见，直至授权重启。  
2. 全量指纹 enrich 在题量增大时的延迟。  
3. 完整 ADMIN 浏览器目视未做。

---

## 9. 准入

在 **本地 API 重启加载新 dist** 且管理员可打开工作台后：

**READY_FOR_HUMAN_REVIEW**

当前（未重启 + 工作台目视 NOT_RUN）建议结论见实施报告：**条件性 READY / 实质 NOT_READY 至重启确认**。
