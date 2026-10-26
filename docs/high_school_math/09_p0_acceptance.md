# 09 高一数学 P0 综合验收报告

> 日期：2026-10-24  
> 阶段：P0-6  
> **P0_ACCEPTANCE = PARTIAL**

---

## 1. 验收范围

覆盖 P0-1～P0-5 已交付能力：

- `hs_math_*` 五表与种子章节（人教 A 版必修一/二）
- 管理员专项/分类/训练题与审核
- 学生专项训练：创建 → 作答 → 保存 → 提交判题 → 结果 → 历史 → 学情 → 首页
- 四题型：single / multi / judge / numeric
- 权限隔离、答案脱敏、nginx 白名单、前端菜单与路由

**不在范围**：每日训练、数学错题本、掌握度、AI、表达式等价、P1。

---

## 2. 测试环境

| 项 | 值 |
|----|-----|
| 数据库 | `study_system`（唯一业务库，未创建第二库） |
| API | `http://127.0.0.1:3000` |
| 账号 | 现有 ADMIN id=2 + USER id=1（未新建用户） |
| 写入范围 | 仅 `hs_math_*` 与标记 `HS_MATH_P0_E2E_TEST*` 测试题/会话 |

---

## 3. 前后端版本

| 检查 | 结果 |
|------|------|
| `pnpm --filter api build` | PASS |
| `pnpm --filter web build`（含 vue-tsc） | PASS |
| `pnpm --filter api run hs-math:selftest`（P0-2/3/4） | PASS |

---

## 4. 数据库结构

`HS_MATH_SCHEMA_AUDIT_DB=study_system` 只读审计：

- 五表均存在：`hs_math_specialties|categories|train_items|train_sessions|train_session_items`
- `uk_hs_math_sess_item_ord (session_id, sort_order)` 唯一
- JSON / datetime(3) 字段与实体预期一致 → **SCHEMA_AUDIT_DONE**

完整性抽样（P0-6 numeric 脚本）：

- 孤立 session_items = 0
- 重复 sort_order = 0
- completed 且 grade_result IS NULL = 0

其他模块计数（E2E）：`chem_specialties` / `error_questions` / `users` 未因测试变化。

---

## 5. 测试用例与结果摘要

### 5.1 自动化 / HTTP

| 用例组 | 命令/方式 | 结果 |
|--------|-----------|------|
| 单元/纯函数 selftest | `hs-math:selftest` | PASS |
| Schema 审计 | `hs-math:schema-audit`（study_system） | PASS |
| P0-4 列表/学情/首页冒烟 | `hs-math:p0-4-smoke` | PASS |
| P0-3.5 真实 HTTP E2E | `hs-math:e2e` | PASS（24/24） |
| Numeric 真实判题 | `hs-math:p0-6-numeric` | PASS |

E2E 覆盖要点：

- ADMIN 建四题型并批准；USER 无权管理
- 创建会话；in_progress 不泄露标准答案
- PATCH 覆盖作答；提交前无 grade
- 提交判题；幂等重提；completed 禁止 PATCH
- cancel 脱敏；cancel 后 submit → 409
- ADMIN 跨用户 GET/PATCH/submit/cancel → 404（不绕过 user_id）
- chem / error_questions / users 不变

Numeric HTTP 覆盖：

| 输入 | 期望 | 实际 |
|------|------|------|
| `1.5` | correct | correct |
| `3/2` | correct | correct |
| `1.505`（abs=0.01） | correct | correct |
| `1.6` | wrong | wrong |
| `1.5e0` | pending_review | pending_review |
| `abc` | pending_review | pending_review |
| 科学计数法 PATCH | 非 500 | 400 |

说明：既有 E2E 故意不答 numeric 以验证 pending 不计正确率分母（accuracyPercent=100）。本次另脚本验证「正确答案 → correct」。

### 5.2 权限与隔离

| 项 | 结果 |
|----|------|
| 未登录 API（JwtAuthGuard） | 代码级：全控制器 `@UseGuards(JwtAuthGuard)`；HTTP 冒烟依赖带 token |
| ADMIN≠学生会话 | E2E PASS（404） |
| USER_A / USER_B 双普通用户 | **NOT_RUN**（环境仅 1 个 USER） |
| 双连接真实并发 submit / PATCH 竞争 | **NOT_RUN**（未做双连接压测；代码有 FOR UPDATE，不能据此宣称并发 PASS） |

### 5.3 前端 / 浏览器

| 项 | 结果 |
|----|------|
| 路由对齐验收路径 `/hs-math/specialties/:code` | 已修复；旧 `/hs-math/:code` 重定向兼容 |
| vue-tsc + vite build | PASS |
| 菜单：AppLayout「高一数学」/ Settings 数学管理 | 代码存在 |
| 浏览器手工端到端 | **NOT_RUN** |
| KaTeX 视觉 / 移动端溢出 | **NOT_RUN**（组件复用 `render-math.ts` + overflow-x） |
| 化学菜单/页面运行时回归 | **NOT_RUN**（代码未改 chemistry；Diff 无化学业务文件） |

### 5.4 nginx / 部署

| 项 | 结果 |
|----|------|
| `nginx.conf` 白名单含 `hs-math` | PASS（静态配置） |
| chemistry 白名单仍在 | PASS（静态） |
| SPA `/study-system/` try_files | PASS（静态） |
| 生产 nginx 重载与实测 | **NOT_RUN**（禁止擅自重启生产） |
| `pack-release.mjs` | 打包整个 `apps/web/dist` + `apps/api/dist`，新页面/API 随构建进入发布包（静态审查） |

---

## 6. 发现的问题

1. **路由与验收清单不一致**（P0-5）：实现为 `/hs-math/:code`，验收要求 `/hs-math/specialties/:code`。  
2. **提交前答案丢失风险**（前端）：`onSubmit` 先置 `submitting=true`，导致 `saveCurrent` 被短路，末题未保存可能仍提交。  
3. E2E 中 numeric「pending」为**故意未作答**场景，易被误读为「正确答案判 pending」——已用独立脚本澄清。

---

## 7. 修复记录

| 修复 | 文件 |
|------|------|
| 路由改为 `/hs-math/specialties/:code[/train]`，旧路径 redirect | `apps/web/src/router/index.ts` + 各视图 `router.push` |
| 提交前先 flush，再设 submitting；flush 支持 `allowDuringSubmit` | `HsMathTrainSessionView.vue` |
| 新增 numeric 真实 HTTP 验收脚本 | `hs-math-p0-6-numeric-http.ts` + package script |

未改：DB、迁移、chemistry、错题本、JWT、DeepSeek、公共连接。

---

## 8. 未验证事项（NOT_RUN）

1. 浏览器手工全流程（菜单、刷新、前进后退、四题型 UI、公式观感）
2. 双普通 USER 隔离
3. 真实双连接并发（submit×2、PATCH vs submit、cancel vs submit）
4. 生产 nginx 重载与同域 `/study-system/` 实测
5. 化学页面运行时点击回归（仅静态 Diff + E2E 计数保护）

### 浏览器手工验收清单（建议）

1. 未登录访问 `/hs-math` → 跳转登录  
2. USER：首页 → 专项目录 → 章节 → 配置 → 作答四题型 → 保存/刷新恢复 → 提交 → 结果  
3. pending_review 标签为「待复核」，正确率分母不含 pending  
4. 历史筛选/分页；学情图表 resize 后无报错  
5. USER 访问 `/settings/hs-math-taxonomy` → 被重定向  
6. ADMIN：专项分类 + 录题/批准/禁用  
7. 化学菜单与任一化学页可打开  
8. 刷新 `/hs-math/train/session/:id` 不 404  

---

## 9. 对现有系统影响

- Git Diff：未修改 `chemistry` 视图/API、错题本、小学数学包、`.env`、DB schema  
- E2E 前后 `chem_specialties` / `error_questions` / `users` 计数与签名一致  
- nginx 仅追加 `hs-math` 到既有白名单正则  

---

## 10. 部署检查

- 发布前需：`pnpm pack:release`（或等价 build）+ **重载 nginx** 使 `hs-math` 白名单生效  
- 本地 dev（5173）直连 API，不依赖 nginx 白名单  

---

## 11. P0 最终结论

**P0_ACCEPTANCE = PARTIAL**

理由：

- 后端闭环、判题（含 numeric 正确路径）、脱敏、ADMIN/USER 隔离（对 ADMIN）、schema、构建均 **PASS**  
- 双 USER、真实并发、浏览器端与生产 nginx **NOT_RUN**，按规则不得标为全面 PASS  

建议：补齐双 USER + 手工浏览器清单后，可将结论提升为 PASS（仍可不做大规模压测）。

---

*本文件结束。P0-6 验收停止；未启动 P1。*
