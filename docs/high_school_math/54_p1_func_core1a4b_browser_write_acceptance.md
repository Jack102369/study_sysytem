# P1-FUNC-CORE-1A-4B · 管理员来源与解题方法标签 · 真实浏览器保存综合验收

> **阶段状态**：**BLOCKED**（业务写验收未完成；非 PASS）  
> **库**：唯一 `study_system`  
> **未**进入 CORE-1B；**未**正式方法种子；**未**真实 approve。

---

## A‴. 2026-10-25 ~10:52 非主营浏览器工具清理

| 项 | 结果 |
|---|---|
| 动作 | 浏览器自动化工具建设**已暂停**；临时非主营文件已清理 |
| 已删 | `apps/web/scripts/hs-math-browser-capability-smoke.mjs` |
| 已卸载 Playwright | **无**（本就未装；未改 package.json / lock） |
| 截图/临时 Network 日志 | **无产物** |
| 保留 | 4B API IT、`core1a31` 自测、H2 业务代码、本报告历史、PROJECT_HANDOFF |
| 业务影响 | **无**（冒烟脚本无业务引用） |
| 开发焦点 | **重新聚焦高一数学核心业务** |

历史事实保留：API IT PARTIAL/PASS 项、浏览器 NOT_RUN、H2 修复、BROWSER_SETUP_REQUIRED 探测记录（见下）。

---

## A″. 2026-10-25 ~10:47 浏览器工具能力探测（历史 · 无业务写）

| 项 | 结果 |
|---|---|
| 结论 | **BROWSER_SETUP_REQUIRED**（当时） |
| 仓库 Playwright 系依赖 | **均无**（此后亦未安装） |
| 本机 Chrome / Edge | **有** |
| 曾落盘冒烟脚本 | 已于 ~10:52 **删除**（非主营） |
| 建议安装方案 | **暂停**；若将来恢复须另授权 |

---

## A′. 2026-10-25 ~10:45 浏览器补验尝试

| 项 | 结果 |
|---|---|
| 结论 | **BROWSER_CAPABILITY_BLOCKED** |
| 动作 | **未**创建 `HS_MATH_CORE1A4B_BROWSER_*` IT 数据 |
| Playwright / Cursor Browser | **无** |

---

## A. 执行结果（上一轮 API · 仍有效）

| 项 | 结果 |
|---|---|
| 上一轮结论 | **PARTIAL**（API/H2/清理） |
| 本轮浏览器补验 | **BLOCKED**（能力不足） |
| 原因（上一轮） | API IT + H2 + DB 清理/110 保护通过；真实浏览器写 **NOT_RUN**；F deferred 已 formal 补验 STALE |
| API IT（主脚本） | **PARTIAL**（82 PASS / 2 FAIL / 3 NOT_RUN；核心 B3/H2/409/C11 等 PASS） |
| H2 restricted 专属原因 | **PASS**（HTTP review-panel） |
| 浏览器写 / Network | **NOT_RUN** |
| IT 清理 | **PASS**（残留 0） |
| 原有 110 题 | **未改**（实时 SELECT） |
| CLEANUP_BLOCKED | **否** |

API 局部通过 **≠** 整体 PASS（缺浏览器）。

---

## B. 用户授权范围

已授权：本仓库本地 Web/API 重启（本轮复用已运行实例）、新 runId IT 写、浏览器验收、按 runId 清理、复核 110 题。  
禁止：nginx/MySQL/生产、迁移、种子、approve、CORE-1B、其他模块。

---

## C. 数据库

`SELECT DATABASE()` → **`study_system`** @ `127.0.0.1:3306`（本地开发）。

---

## D. runId 与执行时间

| 项 | 值 |
|---|---|
| runId | `20261025024051_6787` |
| 前缀 | `HS_MATH_CORE1A4B_IT_20261025024051_6787_` |
| 执行窗口 | 2026-10-25 ~10:40–10:43（本地）；DB UTC `2026-10-24T18:42:33Z` |
| IT 题 | id **147** Q01、**148** Q02（draft） |
| IT 方法 | id 25 DEF、27 CASE、28 GRAPH、29 OFF |
| IT 审核 | id **18** deferred（补验 STALE；已随清理删除） |
| approved | **0**（全程） |

---

## E. 浏览器 / 服务环境

| 项 | 值 |
|---|---|
| Web | `http://localhost:5173` · Vite PID **3784** · 本仓库 `apps/web` · 路由 200 |
| API | `http://127.0.0.1:3000` · `dist/main` PID **8496** · health `app=api,db=ok` |
| 本轮是否新起进程 | **否**（已为本仓库本地实例；含 H2 dist；未动 nginx/MySQL） |
| 管理员浏览器自动化 | **不可用** → 写验收 **NOT_RUN**（见 [浏览器探测](645fadce-5284-4d1a-9466-ca4bd75e7e2f)） |

---

## F–O. API IT 摘要

| 组 | 结果 |
|---|---|
| A 方法 CRUD | PASS（A8–A12 UI NOT_RUN） |
| B 来源 / B3_prime / B3_double | **PASS**（400 不落库；200 落库 +1；canPublish=false） |
| C 方法关联 / 禁用 / C11 | **PASS** |
| D content-meta 原子 | **PASS** |
| E 409 | **PASS** |
| F deferred+STALE（主脚本） | **FAIL**（`pool=test` → 拒审） |
| F STALE（补验：pool→formal + deferred + bump） | **PASS**（`reviewIsStale=true`；仍 draft） |
| H1 | **PASS** |
| H2 | **PASS**（reasons 含 `source_license_status=restricted，禁止正式批准到公开学生池`；非仅靠 test 池） |
| H3 approve | **NOT_RUN**；`H3 no IT approved` PASS |
| J 权限 | **PASS** |

证据 JSON：`db/backups/_core1a4b_it_20261025024051_6787.json`

### H2 证据（摘录）

```text
canPublish: false
publishBlockReasons: [
  "仅 formal 池题目可正式批准",
  "test 池题目不可批准为正式训练题",
  "批准前至少关联一个知识点",
  "source_license_status=restricted，禁止正式批准到公开学生池"
]
```

（补验前 Q02 仍为 test 池；**必须**含 restricted 专属句才记 H2 PASS。）

### 脚本修正（本轮）

`mkItem` 默认 `pool: 'formal'`（draft+IT code），以便后续 F STALE 可直接提交 deferred；**仍禁止 approve**。

---

## P. 数据库前后对比（实时）

| 指标 | 清理前（IT 存在时） | 清理后 |
|---|---|---|
| 非 IT 题 | 110 · 105/5/0 | **110 · 105/5/0** |
| IT 题 / 方法 | 2 / 4 | **0 / 0** |
| methods 总计 | 4 | **0** |
| reviews | 1（IT deferred） | **0** |
| sessions / session_items | 39 / 195 | **39 / 195** |
| chem_specialties | 12 | **12** |
| approved | 0 | **0** |
| baseline hash（非 IT） | `63b6b6d571efe9cd36e5680b…` | **一致** |

---

## Q–R. 清理

清理前目标：items 147–148；methods 25,27–29；关联/审核按 item_id。  
条件：`id IN (…) AND code LIKE 'HS_MATH_CORE1A4B_IT_20261025024051_6787_%'`。  
`CLEANUP_ONLY_LEFT { items: [], methods: [] }`。

---

## S–T. 保护

原有 110 题未改；无非 IT 审核改动；化学/会话未改。

---

## U. 未执行 / 未通过

| 项 | 状态 |
|---|---|
| 真实管理员浏览器保存 + Network | **NOT_RUN** |
| 浏览器 400/409/禁用/STALE UI | **NOT_RUN** |
| 主脚本内 F deferred（test 池） | **FAIL**（已补验 STALE PASS；脚本已改 formal） |
| A8–A12 浏览器筛选交互 | **NOT_RUN** |
| H3 真实 approve | **NOT_RUN**（策略） |

---

## V. 风险

1. 无浏览器自动化 → 4B 不能标 PASS。  
2. IT 初用 `pool=test` 与审核台冲突；已改为 formal draft。  
3. Web 仅 `[::1]:5173`。

---

## W. 下一阶段

1. 授权在具备真实浏览器的会话中补跑 UI+Network（可复用 formal 池脚本）。  
2. 未 PASS 前不进 CORE-1B；不种子；不批准。

---

## Z. 本轮文件

- `hs-math-p1-func-core1a4b-browser-write-it.mjs`（`pool: formal`）  
- 本报告、`PROJECT_HANDOFF.md`  
- 结果：`db/backups/_core1a4b_it_20261025024051_6787.json`  

未改 approve 写入规则以外的产品门禁；未迁移。
