# P1-FUNC-CORE-1A-2D · 来源/方法/指纹/事务/许可门禁 · 真实 MySQL 受控集成验收

> **阶段状态**：**PARTIAL**  
> **库**：`study_system`（唯一）  
> **runId**：`20261024154142_21d4`  
> **前缀**：`HS_MATH_CORE1A2D_IT_20261024154142_21d4_`  
> **LAST_VERIFIED**：`2026-10-24T15:41:46.977Z`（UTC）  
> **脚本**：`apps/api/src/hs-math/integration/hs-math-p1-func-core1a2d-mysql-it.mjs`  
> **结果 JSON**：`db/backups/_core1a2d_it_20261024154142_21d4.json`  
> **API**：本地 `127.0.0.1:3000` · PID **20052**（本阶段**未**重启）

---

## 1. 执行结论

| 项 | 值 |
|---|---|
| 阶段结论 | **PARTIAL** |
| 汇总 | PASS **94** / FAIL **2** / NOT_RUN **2** |
| 关键 FAIL | **无**（2 项为「无变化仍升 version」已知实现缺口，已如实 FAIL） |
| 清理 | **PASS**（无残留 IT 题/方法） |
| 原有 110 题保护 | **PASS**（行级摘要 hash 前后一致） |
| 其他模块 | **PASS**（`chem_specialties=12` 不变；sessions/session_items 不变） |
| 正式批准成功路径 | **NOT_RUN**（按授权不将 IT 题发布为 approved） |
| API 重启 | **未执行** |
| 迁移 / `.env` / 第二库 | **未执行** |
| 方法种子 | **未执行** |

**PARTIAL 原因**：无变化 PUT methods / content-meta 当前实现仍 `content_version+1`（期望幂等），记为诚实 FAIL；批准成功分支按授权不测。其余核心路径（CRUD、关联、来源校验、原子事务、回滚、STALE、许可拦截、导入、并发、权限、清理、110 保护）均 PASS。

---

## 2. 用户授权范围

用户明确授权：仅在 `study_system` 创建带 `HS_MATH_CORE1A2D_IT_` 前缀的临时数学测试记录，验证来源/方法/指纹/事务/并发/许可门禁，测试后安全清理；不得改现有 110 题、不得批准正式内容题、不得影响其他模块。

**未扩大**：未迁移、未改 `.env`、未第二库、未重启 API/nginx、未种子、未改正式题库源、未改 users/JWT、未创建真实学生学习记录。

---

## 3. 数据库名称

`study_system`（`SELECT DATABASE()` 核验）。

---

## 4. 测试 runId

| 项 | 值 |
|---|---|
| runId | `20261024154142_21d4` |
| code/方法前缀 | `HS_MATH_CORE1A2D_IT_20261024154142_21d4_` |
| 先前试跑 | `20261024154041_aaaf`（导入 status 判定误报；已清理） |
| 更早失败 | taxonomy 查询失败即中止；**无** IT 写入 |

---

## 5. 测试前数据基线

| 指标 | 值 |
|---|---|
| 题目总数 | **110** |
| status | draft **105** / disabled **5** / approved **0** |
| reviews | **0** |
| methods / item_methods | **0 / 0** |
| sessions / session_items | **39 / 195** |
| item_kps | **170**（基线计数） |
| knowledge_points | 沿用既有 |
| parity CH03 | **25** · 16/7/2 |
| chem_specialties | **12** |
| 基线 hash（关键字段） | `4f1301cc0a971be163917e77f8c8c6836980d53226b75676354e3798e99ebfed` |
| API PID | **20052**（`netstat` 核实；未因 PID 不同而重启） |

---

## 6. 测试项目矩阵

| 代号 | 项目 | 结果 |
|---|---|---|
| A | 方法词典 CRUD | **PASS** |
| B | 题目方法关联 | **PASS**（幂等升版项 FAIL，见下） |
| C | 来源字段校验 | **PASS** |
| D | content-meta 原子更新 | **PASS**（幂等升版项 FAIL） |
| E | 审核指纹 STALE | **PASS** |
| F | 许可门禁（拒绝 + 纯函数通过） | **PASS** / 成功发布 **NOT_RUN** |
| G | 导入兼容 | **PASS**（含 confirm→draft） |
| H | 并发 + expectedVersion | **PASS** |
| L | 事务回滚 | **PASS** |
| M | 权限拒绝 | **PASS** |
| N | 测试数据清理 | **PASS** |
| O | 原有 110 题保护 | **PASS** |
| P | 其他模块保护 | **PASS** |

---

## 7. 每项 PASS / FAIL / NOT_RUN（摘要）

见 `db/backups/_core1a2d_it_20261024154142_21d4.json` 全量 `results[]`。

**FAIL（2）**

1. `B same methods no version bump (期望幂等)` — before=4 after=5  
2. `D same meta no version bump` — before=8 after=9  

**NOT_RUN（2）**

1. `A hard delete referenced` — 无 DELETE 路由；已用禁用+关联拒绝覆盖  
2. `F approve success path` — 按授权不将 IT 题发布为 approved；改用 `assertSourceAllowsFormalPublish` 纯函数验证 permitted 路径  

---

## 8. 方法词典 CRUD

| 用例 | 结果 |
|---|---|
| 匿名创建 | **PASS** 401 |
| 普通用户创建 | **PASS** 403 |
| 管理员创建 ×3 | **PASS** 201 |
| 重复 code | **PASS** 409 |
| 改名/简介/排序 | **PASS** |
| 禁用 + activeOnly 列表隐藏 | **PASS** |
| 硬删除 | **NOT_RUN**（无路由） |

---

## 9. 来源字段校验

| 用例 | 结果 |
|---|---|
| 新建默认 original/unverified/unknown | **PASS** |
| adapted 出处不完整拒绝 | **PASS** 400 |
| past_exam 缺 reference 拒绝 | **PASS** 400 |
| adapted verified+unknown 可落库 | **PASS** |
| 空/空白 examName 拒绝 | **PASS** 400 |
| 来源变更 version+1 / 指纹 V2 | **PASS** |

（高考相关字段均带 IT 模拟卷标记，非正式真题出处。）

---

## 10. 方法关联

| 用例 | 结果 |
|---|---|
| 主方法 / 多辅助 | **PASS** |
| 重复 methodIds / primary 不在列表 / 禁用方法 | **PASS** 400 |
| 同载荷再 PUT 仍 +1 | **FAIL**（已知） |
| 方法改名不影响题目指纹/版本 | **PASS** |
| 清空关联 version+1 | **PASS** |

---

## 11. content-meta 原子更新

| 用例 | 结果 |
|---|---|
| 同时改来源+方法，单次 version+1 | **PASS**（7→8） |
| 落库 methods=2 + source=past_exam | **PASS**（SQL 核对） |
| 同载荷再 PUT 仍 +1 | **FAIL**（已知） |
| 非法 methodId 拒绝 | **PASS** 400 |
| 拒绝后 links/version 不变（回滚） | **PASS**（SQL） |

---

## 12. 指纹和版本

| 用例 | 结果 |
|---|---|
| 来源变化 → 指纹变化（V2） | **PASS** |
| 内容编辑 → version 递增 | **PASS** |
| 方法改名 ≠ 题目指纹变化 | **PASS** |
| 无变化幂等 | **FAIL**（见上） |

---

## 13. 审核 STALE

| 用例 | 结果 |
|---|---|
| IT 审核记录创建（comment 标明 IT） | **PASS** |
| 编辑后 reviewIsStale=true | **PASS** |
| history 含 stale | **PASS** |
| STALE 下 approve 拦截 | **PASS** 400 |

未对正式题创建 passed；审核仅关联本次 IT 题，清理后 reviews=0。

---

## 14. 发布许可门禁

| 用例 | 结果 |
|---|---|
| adapted+unknown → approve 拒绝 | **PASS**（消息含 license） |
| restricted → approve 拒绝 | **PASS** |
| 纯函数 past_exam+unknown / adapted+unknown / forbidden | **PASS** 抛错 |
| 纯函数 adapted+verified+permitted | **PASS**（**未**真正 approve） |
| IT 题始终 draft | **PASS** |
| 正式批准成功 HTTP | **NOT_RUN** |

---

## 15. 导入兼容

| 用例 | 结果 |
|---|---|
| 旧 JSON preview | **PASS** 201 |
| 新 JSON（source+methodCodes）preview | **PASS** 201 |
| 重复 methodCodes → canConfirm=false | **PASS** |
| 禁用 method → canConfirm=false | **PASS** |
| confirm 创建 IT 题且 status=draft | **PASS** |
| confirm 非 approved | **PASS** |

未 confirm 正式题库 JSON。

---

## 16. 真实 MySQL 并发与回滚

| 用例 | 结果 |
|---|---|
| content-meta ∥ methods 同 expectedVersion | **PASS**（一 200 / 一 409） |
| version 最终前进 | **PASS** |
| 过期 expectedContentVersion | **PASS** 409 |
| content-meta 非法写回滚 | **PASS**（见 D） |

未依赖固定 sleep 判定。

---

## 17. 权限

| 用例 | 结果 |
|---|---|
| 匿名写方法 | **PASS** 401 |
| 普通用户写方法/关联 | **PASS** 403 |
| 管理员既有 AdminGuard | **PASS** |

未改 users / JWT / AuthGuard。

---

## 18. 测试创建记录清单（最终 run）

| 类型 | 标识（清理前） |
|---|---|
| methods | id 9/11/12 · code `…_M_DEFN/_M_CLS/_M_DIS` |
| items | id 138 Q01 · 139 IMP_CF · 140 Q02 |
| reviews | id 13（仅绑 IT 题） |

（中间试跑 `aaaf` 的 136/137 等已在同脚本清理。）

---

## 19. 清理记录清单

按外键顺序：`reviews` → `item_methods` → `item_kps` → `items`（code LIKE 前缀）→ `methods`（code LIKE 前缀）。  
禁止范围：无条件 DELETE / 关 FK / TRUNCATE / DROP / 扩大前缀。

---

## 20. 清理后残留检查

| 检查 | 结果 |
|---|---|
| `code LIKE HS_MATH_CORE1A2D_IT_%` 题目 | **0** |
| 同前缀 methods | **0** |
| CLEANUP_BLOCKED | **无** |

---

## 21. 原有 110 题保护结果

| 检查 | 结果 |
|---|---|
| 数量 110 | **PASS** |
| 关键字段摘要 hash | **PASS**（与基线相同） |
| id/code 集合 | **PASS** |
| reviews / methods / links / sessions / session_items / item_kps | **PASS** 与基线一致 |

---

## 22. 其他模块保护结果

| 检查 | 结果 |
|---|---|
| chem_specialties | **12** 不变 |
| 未写化学表 | 本脚本无 chem 写语句 |

---

## 23. 未完成事项

1. 无变化写路径幂等（methods / content-meta）——实现仍总是 +1。  
2. 正式批准 HTTP 成功路径——另授权后再测。  
3. 方法硬删除 API——当前无 DELETE。  
4. 管理端来源/方法 UI、方法词典正式种子——未做。  
5. CORE-1A-3 / CORE-1B——**未进入**。

---

## 24. 风险与问题

1. **幂等缺口**：同内容重复 PUT 仍升 `content_version`，会使审核更快变 STALE（行为可预期但非最优）。  
2. 方法表 AUTO_INCREMENT 可能因历史删除留空号；与业务正确性无关。  
3. 同仓库可能仍有未占 3000 的 watch 进程；本阶段未触碰。

---

## 25. 下一阶段建议

1. 授权修复「无变化不升 version」幂等（methods + content-meta）。  
2. 授权方法词典种子（若需要正式标签）。  
3. 管理端来源/方法 UI。  
4. 另授权后再做「许可门禁通过后正式批准」端到端（仍避免污染正式题池）。  
5. **不得**在未授权时进入 CORE-1A-3 / CORE-1B。

---

## 附录 · 敏感信息

报告**不含**：JWT、数据库密码、`.env` 全文、用户明文敏感信息。
