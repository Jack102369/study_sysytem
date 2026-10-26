# 07 高一数学设计审查与 P0 定稿

> 审查对象：01–06  
> 约束：仅修订 docs；未改业务代码/数据库/依赖  
> 日期：2026-10-24  

---

## 1. 设计审查范围

- 架构边界与前缀一致性  
- P0/P1/P2/P3 范围是否可交付、是否过度设计  
- 训练会话链路、并发、脱敏、快照、历史稳定性  
- 四题型答案协议与容差  
- 错题扩展预留  
- 库表与迁移分层  
- 前端权限与交互  
- nginx / pack-release  
- 测试清单与开发准入  

对照实测：`nginx/nginx.conf` API 白名单、化学 submit **无** FOR UPDATE（高一 P0 **加强**）、KaTeX `render-math.ts`、auth Guard。

---

## 2. 已确认技术决策

见任务清单 1–16，并固化：

| 项 | 值 |
|----|-----|
| 后端目录 | `apps/api/src/hs-math/` |
| 表前缀 | `hs_math_*` |
| API/路由 | `/hs-math` |
| 前端页 | `apps/web/src/views/hs-math/` |
| P0 题型 | single, multi, judge, numeric |
| 作答 | 覆盖保存 |
| 判题 | TS 确定性；无 SymPy/mathjs/AI |
| 隔离 | 不改化学 / 通用错题 / 小学 packages |

---

## 3. 发现的问题

| ID | 问题 | 等级 |
|----|------|------|
| R1 | 原稿 P0 与全文混入每日/错题/KB/出题器，范围不清 | 高 |
| R2 | 化学式 submit 无行锁；若照搬则存在并发双提交风险 | 高 |
| R3 | 答案协议过粗（尤其 numeric/multi/judge 类型） | 高 |
| R4 | P0 库表含 KB/wrong 等，过度设计 | 中 |
| R5 | 未完成会话若 API 返回标准答案，仅靠前端隐藏不安全 | 高 |
| R6 | nginx 白名单无 `hs-math`，上线必挂 | 高 |
| R7 | 题库物理删除可能破坏历史 FK | 中 |
| R8 | 与小学 `math_*` 命名冲突风险（已用 hs_math_ 缓解） | 中 |
| R9 | 原稿 blank 列入 P0「可靠」与正式 P0 四题型不一致 | 中 |
| R10 | pack-release 对无新 package 影响小，但仍需发布检查清单 | 低 |

---

## 4. 风险等级说明

- **高**：不修正则 P0 不可可靠上线或安全不合格  
- **中**：导致返工或历史数据质量问题  
- **低**：流程/文档类  

---

## 5. 修正结果

| 问题 | 修正落点 |
|------|----------|
| R1 | 02/05/06 严格划分 P0；07 定稿范围 |
| R2 | 04 规定 submit 事务 + `FOR UPDATE` |
| R3 | 04 完整四题型 JSON 与容差/非法处理 |
| R4 | 03 明确 P0 仅 5 表（+可选 grants） |
| R5 | 04/05 服务端脱敏为硬要求 |
| R6 | 02/06/07 部署强制项 |
| R7 | item_id ON DELETE SET NULL + 禁用软删优先 |
| R8 | 前缀定稿 hs_math_ / hs-math |
| R9 | P0 剔除 blank；表达式/解答题延后 |
| R10 | 测试与部署清单写入 §9–10 |

修订文件：`02`–`06` 全文更新；本文件新建。`01` 审计事实仍有效，范围以 02/07 为准。

---

## 6. P0 数据库范围

**必须**：

1. `hs_math_specialties`  
2. `hs_math_categories`  
3. `hs_math_train_items`  
4. `hs_math_train_sessions`（可预留 `daily_date`/`source_wrong_item_id` NULL）  
5. `hs_math_train_session_items`  

**可选**：`hs_math_train_test_grants`  

**禁止 P0 创建**：wrong、KB 全家桶、mastery、attempts、item_links（强制）。

迁移：`migrate_hs_math_p0.sql` + 回写 `init.sql`。

---

## 7. P0 API 范围

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `hs-math/specialties` | JWT |
| GET | `hs-math/specialties/:code`（含 categories） | JWT |
| GET | `hs-math/home`（进行中会话摘要，可选） | JWT |
| POST | `hs-math/train/sessions` | JWT |
| GET | `hs-math/train/sessions` | JWT |
| GET | `hs-math/train/sessions/:id` | JWT（脱敏） |
| PATCH | `hs-math/train/sessions/:id/answers` | JWT |
| POST | `hs-math/train/sessions/:id/submit` | JWT |
| POST | `hs-math/train/sessions/:id/cancel` | JWT |
| GET/POST/PATCH | `hs-math/admin/specialties|categories` | Admin |
| GET/POST/PATCH | `hs-math/admin/train-items` | Admin |
| PATCH | `hs-math/admin/train-items/:id/status` | Admin |

响应：现有 `{ success, data|message }`。无全局 `/api` 前缀。

---

## 8. P0 前端范围

- 菜单：高一数学 + Settings 分类/训练题  
- 页：Home、Specialty、TrainSetup、Session、Result、History、TaxonomyAdmin、TrainItemsAdmin  
- 组件：Stem/Options/Judge/Numeric/GradeTag  
- **不做**：daily/wrong/analytics/kb/generator 路由  

---

## 9. P0 测试范围

| 测试 | 验收结果 |
|------|----------|
| 未登录访问 | 401 / 跳转 login |
| 非 Admin 调 admin API | 403 |
| A 用户不能读 B 会话 | 404/403 |
| draft 题不进 create 候选 | 仅 approved+active |
| create 快照后改题库答案 | 历史 submit 结果不变 |
| 禁用/删题（SET NULL） | 历史 items 仍可读、结果不变 |
| grade 单测四题型 | 边界用例全过 |
| 并发双 submit | 仅一次判题；二次幂等 |
| 再 submit completed | 幂等，计数不变 |
| cancel 后 submit | 400 |
| 未作答提交 | pending，不进 wrong 计数 |
| 正确率 | pending 不分母 |
| 题量 0 | 400；题量不足有 shortfall |
| 前端重复点提交 | UI disabled + 服务端幂等 |
| in_progress GET body | 无标准答案字段 |
| KaTeX 渲染 | 题干公式可见且无脚本注入 |
| nginx 加白名单后 | `/hs-math/train/...` 反代 200 |
| SPA 深链 | `/study-system/hs-math/...` 刷新不 404 |
| 化学冒烟 | `/chemistry` 关键路径仍可用 |

---

## 10. P0 开发任务拆分

见 `06_implementation_roadmap.md` P0-T1…T9。  
建议顺序：T1 → T3 → T2/T4/T5 → T6/T7 → T8 → T9。

---

## 11. 未解决问题（不阻塞 P0）

| 项 | 说明 |
|----|------|
| numeric 是否引入 decimal 库 | P0 先手写有理数；不足再立项 |
| 科学计数法 | P0 明确不支持 → pending |
| test 池产品策略 | grants 表可选；P0 可只做 formal |
| 掌握度模型细节 | P2 |
| AI 工厂 | P3 |
| 小学与高一共享 grade 包 | 稳定后再抽，P0 内聚 |

---

## 12. 开发准入结论

关键设计已具备实现条件：

- 前缀与目录定稿  
- P0 范围与非范围清晰  
- 五表模型与快照/并发/脱敏规则明确  
- 四题型协议可编码、可单测  
- 部署与测试清单可执行  
- 与化学/小学/通用错题隔离明确  

```
READY_FOR_P0 = YES
```

**说明**：`YES` 表示**设计准入**，不表示已授权开工。开工仍须单独任务 +【计划】确认，并完成 nginx 变更排期。

---

*文档结束：07_design_review.md*
