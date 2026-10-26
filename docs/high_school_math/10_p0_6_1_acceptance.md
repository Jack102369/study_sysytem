# 10 高一数学 P0-6.1 专项验收报告

> 日期：2026-10-24  
> 承接：`09_p0_acceptance.md`（P0_ACCEPTANCE = PARTIAL）  
> **P0_6_1_ACCEPTANCE = PARTIAL**

---

## 1. 验收背景

补齐 P0-6 未完成关键项：

- 双普通 USER 隔离  
- MySQL/HTTP 真实并发（FOR UPDATE）  
- 浏览器完整训练  
- 提交前 flush 复核  
- 脱敏 / nginx / 现有模块保护  

不开发 P1。

---

## 2. 测试环境

| 项 | 值 |
|----|-----|
| 数据库 | `study_system`（唯一业务库） |
| MySQL | 8.0.44 |
| API | `http://127.0.0.1:3000` |
| hs_math 表 | 5 张齐全 |
| 标记数据 | `HS_MATH_P0_E2E_TEST*` 已批准题；会话为测试创建 |
| 命令 | `pnpm --filter api run hs-math:p0-6-1` |

原始结果：`docs/high_school_math/_p0_6_1_last_result.json`

---

## 3. 测试账号条件

| 角色 | 数量 | 说明 |
|------|------|------|
| USER | **1**（id=1） | 仅一个普通用户 |
| ADMIN | 1 | 用于跨角色 404 验证 |

**禁止**：自动创建第二 USER / 改密码 / 提权。  
因此 **双 USER 隔离 = NOT_RUN**（需用户另行提供获准测试的第二 USER）。

---

## 4. 测试数据库范围

- 只写 `hs_math_train_sessions` / `hs_math_train_session_items`（及既有 E2E 标记题）  
- 不改 chem_* / error_questions / users 业务数据  
- 不迁移、不 DROP/TRUNCATE  

回归 CRC/计数（测试前后）：

- chem_specialties：12→12  
- error_questions：16→16  
- users：count+CRC 不变  

---

## 5. 双 USER 隔离结果

**NOT_RUN**

原因：库内仅 1 个 `role=USER`。

已通过的替代验证（非双 USER）：

- ADMIN 对 USER 会话 GET → **404**（不可绕过 user_id）  
- 未登录 GET `/hs-math/home` → **401**

待用户提供 USER_B 后应执行：跨用户 GET/PATCH/submit/cancel、history/analytics/home 不含 A 的数据。

---

## 6. 真实并发结果

脚本：`hs-math-p0-6-1-acceptance.ts`  
机制：barrier + `Promise.all` 同时发出两个 `apiOnce`（无重试），记录 `overlapΔ`。

| 场景 | 结果 | 证据摘要 |
|------|------|----------|
| 双 submit | **PASS** | overlapΔ=0ms；idem=[false,true]；status=completed；submittedAt 稳定 |
| 重复 submit | **PASS** | 首次非幂等，二次幂等，submittedAt 不变 |
| PATCH vs submit | **PASS** | overlapΔ=0ms；patch=**409** submit=201；final=completed；完成后 patch 仍 409 |
| cancel vs submit | **PASS** | overlapΔ=1ms；cancel=201 submit=409；final=**cancelled**（互斥终态） |
| 双 PATCH 同题 | **PASS** | 双 200；session items=5（无重复行）；答案为 A 或 B |

说明：PATCH=409 在 submit 抢先持锁时符合「submit 先获得锁 → PATCH 冲突」约定，证明事务锁生效，而非仅代码注释。

**真实数据库并发：PASS**（在标记测试会话上；非大规模压测）。

---

## 7. 浏览器交互结果

**NOT_RUN**

- 未安装/未启用项目内 Playwright/Cypress  
- 未擅自新增浏览器依赖  
- 前端 `vue-tsc` + `vite build` **PASS**，**不得**等同浏览器 PASS  

### 手工清单（建议）

学生：登录 → 高一数学 → 首页 → specialties → 章节 → 配置 → 作答四题型 → 切题/刷新恢复 → 提交 → 结果 → 历史 → 学情  

管理：ADMIN 设置 → 数学专项分类 / 训练题库 → 录题/预览公式/批准/禁用；USER 进管理页应被拦  

刷新 `/hs-math/train/session/:id` 与 `/hs-math/specialties/:code` 不 404；化学菜单仍可进。

---

## 8. flush 复核结果

**PASS（代码静态复核）**

`HsMathTrainSessionView.vue`：

1. 确认框后 **先** `flushAllSaves()`，**再** `submitting=true`  
2. `saveCurrent` 默认在 submitting 时拒绝新保存；flush 可传 `allowDuringSubmit`  
3. 保存失败：`ElMessage` + **阻止提交**  
4. 切题前 await flush  

浏览器侧「末题立即提交 / 延迟网络」仍待手工：**交互实测 NOT_RUN**。

---

## 9. 答案脱敏结果

| 项 | 结果 |
|----|------|
| in_progress 无标准答案/解析/grade | PASS |
| cancelled 无泄露 | PASS |
| completed 含 answerPayloadJson + analysis | PASS |
| 历史列表无泄露键 | PASS |
| 未登录 401 | PASS |
| ADMIN 读他人会话 404 | PASS |

---

## 10. nginx 检查

| 项 | 结果 |
|----|------|
| 白名单含 `hs-math` | **PASS**（静态） |
| chemistry 等原项保留 | **PASS**（静态） |
| `/study-system/` SPA try_files | **PASS**（静态） |
| `pack-release.mjs` 打包 web dist + api dist | **PASS**（静态审查） |
| 生产 nginx 重载实测 | **NOT_RUN**（禁止擅自重启生产） |

---

## 11. 现有模块回归

| 项 | 结果 |
|----|------|
| chem_specialties 行数 | PASS |
| error_questions 行数 | PASS |
| users 行数+CRC | PASS |
| chemistry 业务代码未改 | PASS（本阶段 Diff 仅 hs-math / 文档 / 脚本） |
| 浏览器化学点击回归 | NOT_RUN |

---

## 12. 发现的问题

1. 仅 1 个 USER → 双 USER 无法验收（环境限制，非代码缺陷）。  
2. 浏览器自动化缺失 → UI 全流程 NOT_RUN。  
3. 首次跑脚本时曾 ECONNRESET（API 瞬时断连）；加固 try/catch + 重试后稳定通过。  
4. 结果 JSON 路径曾写错到 `apps/docs`，已修正为仓库 `docs/high_school_math/`。

---

## 13. 修复记录（本阶段）

| 项 | 文件 |
|----|------|
| 新增 P0-6.1 验收脚本 | `apps/api/src/hs-math/integration/hs-math-p0-6-1-acceptance.ts` |
| package 脚本 | `hs-math:p0-6-1` |
| 结果落盘路径修正 | 同上 |

未改：DB、迁移、chemistry、错题本、JWT、`.env`。  
flush 逻辑沿用 P0-6 已修复版本，本阶段复核通过。

---

## 14. NOT_RUN 项目

1. 双普通 USER 隔离（缺 USER_B）  
2. 浏览器完整训练 / 公式视觉 / 管理员 UI  
3. 生产 nginx 重载  
4. flush 的浏览器延迟场景实测  

---

## 15. 最终结论

**P0_6_1_ACCEPTANCE = PARTIAL**

| 维度 | 状态 |
|------|------|
| 双 USER 隔离 | NOT_RUN |
| 真实并发 | **PASS** |
| 浏览器训练 | NOT_RUN |
| 提交前 flush（代码） | **PASS** |
| 答案脱敏 | **PASS** |
| nginx 静态 | **PASS** / 部署 NOT_RUN |
| 模块回归（计数） | **PASS** |

### P0 交付建议

1. 提供第二获准 USER 后重跑 `hs-math:p0-6-1` 双用户段 → 可争取将该项 PASS。  
2. 按手工清单完成一次浏览器冒烟。  
3. 发布时重载 nginx 使 `hs-math` 白名单生效。  
4. 完成 1+2 后可将整体 P0 从 PARTIAL 提升为 PASS（仍可不做大规模压测）。

---

*P0-6.1 停止。未开始 P1。*
