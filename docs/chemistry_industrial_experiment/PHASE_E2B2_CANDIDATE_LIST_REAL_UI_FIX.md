# PHASE_E2B2-CANDIDATE-LIST-REAL-UI-FIX · 管理员页「暂无候选」

| 字段 | 值 |
|------|-----|
| 执行时间 | 2026-10-29 13:53:07 +08:00 |
| 任务 | 真实管理员页显示 0 道候选 |
| 代码修复 | **DONE**（ApiSuccess 解包） |
| 验收判定 | **CANDIDATE_LIST_SELFTEST_PASS** + UI unwrap 契约 PASS；**AUTHENTICATED_HTTP_NOT_EXECUTED**；**BROWSER_NOT_VERIFIED** |
| 最终验收 | 仍为 **CONDITIONALLY_ACCEPTED**（未升格） |

---

## 1. 用户真实页面症状

- 路径：`/settings/chemistry-industrial-candidates`
- 表头正常；列表 empty-text：**暂无候选**
- 批次输入框可见 `industrial_formal_candidate_20261029_12195…`（宽度截断视觉，非认定 batchId 被截断）
- 此前 Network 曾出现 `caseCode.replace` 500；上一轮 Store 过滤已 FIXED；本轮症状为 **HTTP 成功后仍显示 0 行**

## 2. 根本原因及证据

**根因：前端未解包 Nest 全局 `TransformInterceptor` 的 `{ success, data }`。**

| 层 | 实际 |
|----|------|
| Controller/Nest `list()` | 返回 `{ items, formalAllowedDesignNote, … }` |
| TransformInterceptor | 再包一层 → `{ success: true, data: { items: […] } }` |
| 旧 `industrial-review.ts` | `return http.get<…>(…)`（裸 AxiosResponse） |
| 旧 Vue `reload` | `const { data } = await list…` → `data` = **整包**；`data.items` = **undefined** → `\|\| []` →「暂无候选」 |
| 对照 | `chemistry-train-items-admin.ts` 正确：`return data.data` |

复现（无网络）：

```
BUG_UNWRAP_COUNT 0
CORRECT_UNWRAP_COUNT 4
ROOT_CAUSE_MATCH true
```

**非根因（已排除）：**

- E1 文件缺失：磁盘上 `e1BatchId=industrial_formal_candidate_20261029_121958` **恰好 4** 道
- batchId 被输入框截断：页面默认常量完整
- Store 再扫 `_phase_*`：上一轮已跳过；本轮自检仍 PASS
- API 未热加载导致 0 条：Service 自检仍列 4；匿名 HTTP 为 401（鉴权有效），非空列表
- 静默失败转空列表：旧逻辑在 **成功响应** 下误解析，非 catch 吞错（本轮仍加固了失败显式报错）

## 3. 真实候选文件数量

目录：`apps/api/var/industrial-review/`（Store：`process.cwd()/var/industrial-review`；`pnpm --filter api` → cwd=`apps/api`）

| 集合 | 数量 | 说明 |
|------|------|------|
| `cand_*.json` 总计 | 12 | 含 PHASE_D / 早期 acceptance |
| E1 `e1BatchId=…121958` | **4** | `cand_03bf…` / `312c…` / `6328…` / `8ce5…` |
| PHASE_D `…121220` | 4 | `developmentOnly=true` |
| `_phase_*.json` | 3 | 非候选，列表跳过 |

字段核对（E1）：`candidateId`/`caseCode`/`generationSource=manual_fixture`/`reviewStatus=pending_human_review`/`humanDecision=null`/`formalImportBlocked=true`；顶层无 `batchId`（用 `e1BatchId`），与 Service 过滤一致。

## 4. 前端请求链路

1. `onMounted(reload)` / 批次 `@change` → `listIndustrialCandidates({ batchId })`
2. `http` baseURL：`VITE_API_BASE_URL=http://localhost:3000`（无 Vite proxy）
3. Axios 带 Bearer；401 清 token 跳登录
4. **修复后**：API client 返回 `data.data`；页面读 `payload.items`；缺 `items` 显式错误，不再伪装「暂无候选」

## 5. 后端读取目录

- `resolveIndustrialReviewRoot(cwd)` → `{cwd}/var/industrial-review`
- 运行中 API：PID 16464，`apps/api/dist/main`，监听 **3000**；nest `--watch` 父进程存在
- 本轮 **未改** Store/Service 列表过滤逻辑（仅扩展自检契约）

## 6. 真实 API 响应结构（设计/拦截器）

成功时（管理员 JWT）：

```json
{
  "success": true,
  "data": {
    "items": [ /* IndustrialReviewListItem×N */ ],
    "formalAllowedDesignNote": "…",
    "e2bNote": "…",
    "realPublishEnabled": false,
    "realPublishNote": "…",
    "defaultFormalBatchId": "industrial_formal_candidate_20261029_121958"
  }
}
```

匿名：`GET …/industrial-candidates?batchId=…` → **HTTP 401**（已测）。  
带管理员 JWT 的完整 JSON：**AUTHENTICATED_HTTP_NOT_EXECUTED**（环境无可用合法凭据；禁止伪造 JWT / 关鉴权）。

## 7. 实际修改文件

- `apps/web/src/api/industrial-review.ts` — 全部工业候选 API 解包 `ApiSuccess`
- `apps/web/src/views/settings/chemistry/ChemistryIndustrialCandidatesView.vue` — 使用解包结果；`listError` 与 empty-text 区分
- `apps/api/src/chemistry/industrial/industrial-candidate-list.selftest.ts` — ApiSuccess 解包契约断言

## 8. 修复前后行为

| | 前 | 后 |
|--|----|----|
| 成功且 E1=4 | UI 显示 0（误读包装层） | 代码路径应显示 4（**浏览器待用户硬刷新确认**） |
| 请求失败 | Toast；rows 可能残留旧值 | rows 清空 + 红色 `listError`；empty「加载失败」 |
| 真 0 条 | 「暂无候选」 | 同左（无 listError） |

## 9. 测试命令与结果

| 命令 | 结果 |
|------|------|
| `pnpm --filter api run chem:industrial-candidate-list-selftest` | **PASS**（e1Count=4；unwrap contract） |
| `chem:industrial-phase-e2b2-selftest` | **PASS** |
| `chem:industrial-phase-e2b-selftest` | **PASS** |
| `chem:industrial-review-selftest` | **PASS** |
| `chem:industrial-phase-e1-selftest` | **PASS** |
| `chem:industrial-quality-selftest` | **PASS** |
| `pnpm --filter api run build` | **PASS** |
| `pnpm --filter web run build` | **PASS** |
| 匿名 HTTP | **401** |
| 管理员 JWT HTTP | **NOT_EXECUTED** |
| 真实浏览器 | **NOT_EXECUTED** |

## 10–14. 权限 / 审核 / DB

- 管理员权限：匿名拒绝已验证；正测待用户浏览器
- 审核状态：E1 四题仍 `pending_human_review` / `humanDecision=null`（本轮未写）
- 案例覆盖层：未写
- 数据库业务写入：**无**
- real publish：未开

## 15. 未解决问题

1. 用户须硬刷新 `/settings/chemistry-industrial-candidates` 确认列表 **4** 行  
2. 管理员 JWT 真实 HTTP 响应体未在本环境抓取  
3. PHASE_E2-B′ 人审 / E2-C 仍待另批  

## 16. 用户下一步

1. 管理员登录 → 硬刷新审核页 → 确认 4 道  
2. Network：响应 `data.items.length===4`；页面表格 4 行  
3. 再按 GUIDE 做案例有效审核 → 重质检 → 逐题人审（另操作，非本任务）
