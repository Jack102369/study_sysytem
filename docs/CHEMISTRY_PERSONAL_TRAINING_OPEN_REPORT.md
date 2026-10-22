# 高一化学 · 个人试运行训练开放报告

> 日期：2026-10-19  
> 范围：清理不适合训练的题目 + 向授权普通 USER 开放符合条件的 AI 试运行题池。  
> **不是**正式题库上线；**不是**人工学科审核完成；**未**接入正式积分。

---

## 1. 整改前题目数量

| 指标 | 数量 |
|------|------|
| 题库总数 | **594** |
| 允许试运行（`trial_access:allow` 且启用） | **574** |
| 禁止试运行 / 已停用 | **20**（18 filler `cov.*` + 2 来源不明） |
| 正式池 `pool=formal` | **0** |

---

## 2. 实际物理删除数量

**16**

| 类型 | 题码 |
|------|------|
| filler（无历史引用） | `train.ai_trial.cov.experiment.1` … `inference.3`（共 15） |
| 来源不明（无历史引用） | `train.ai_trial.eq.conversion.01` |

删除前已卸除 `chem_train_item_links`；未引用会话快照的题目物理删除。

---

## 3. 永久停用数量

**4**（软删除：`is_active=0` + `[trial_access:block]` + `[personal_open:soft_delete]`）

| 题码 | 原因 |
|------|------|
| `train.ai_trial.cov.comprehensive.1` | filler，已被历史会话引用 |
| `train.ai_trial.cov.comprehensive.2` | 同上 |
| `train.ai_trial.cov.comprehensive.3` | 同上 |
| `train.test.eq.single.01` | 来源不明且无法可靠补关联，已被历史引用 |

会话答题快照保留，历史展示不受影响。

---

## 4. 剩余题目数量

| 指标 | 数量 |
|------|------|
| 题库行数（含停用） | **578** |
| 启用中 | **574** |
| 永久停用残留 | **4**（含 3 道 filler） |

---

## 5. 当前个人可训练题量

**574**

条件（与后端 `ChemTrainEligibilityService` 一致）：

- `pool=test`、`status=approved`、`is_active=1`
- `gate_note` 含 `[trial_access:allow]`，且不含 `[trial_access:block]`
- 用户具备试运行权限（ADMIN 或 `chem_train_test_grants`）

`NEEDS_VERIFICATION` / `kb_pending` **不**因未完成人工审核而禁止个人试运行。

---

## 6. 个人试运行授权方式

1. **数据表**：`chem_train_test_grants`（按 `user_id` 显式授权；**非** USER 角色默认开放）。
2. **后端校验**：`GET/POST /chemistry/train/*` 在 `poolMode=test` 时调用 `canUseTestPool`；无授权 → `403 无权使用测试题库`。
3. **管理端**：设置 → 用户管理 →「化学试运行」开关  
   - API：`PATCH /admin/users/:id/chem-train-test-enabled`  
   - ADMIN 恒为可用，开关禁用（无需授权行）。
4. **本次已授权**：普通 USER `dhm@189.cn`（id=1，昵称「测试用户」）。  
   未改角色、未改任何密码。

---

## 7. 各一级专项可用题量（个人试运行）

| 专项 | 可训练题量 |
|------|-----------|
| 化学方程式 | 218 |
| 化学实验 | 7 |
| 化学物质性质 | 92 |
| 化学计算 | 8 |
| 离子反应 | 18 |
| 氧化还原反应 | 111 |
| 元素周期表 | 21 |
| 物质结构 | 3 |
| 有机化学 | 6 |
| 化学推断 | 2 |
| 化学基础记忆 | 68 |
| 化学综合训练 | 20 |
| **合计** | **574** |
| **有题一级专项** | **12 / 12** |

---

## 8. 各二级分类可用题量

有题二级分类：**34 / 137**（其余分类题量真实为 0，**不用 filler 凑数、不跨分类补题**）。

明细见 `docs/chemistry_personal_open/verify_result.json` → `byCategory`。

主要有题分类示例：

| 专项 | 分类 | 题量 |
|------|------|------|
| equation | true_false | 158 |
| equation | condition | 48 |
| substance | formula | 49 |
| memory | symbol | 44 |
| redox | identify | 41 |
| redox | oxidant / reductant | 30 / 30 |
| … | … | … |

训练设置页按「专项 + 二级分类 + 难度 + 题库模式」显示**真实可用题量**。

---

## 9. 普通 USER 测试结果

| 检查项 | 结果 |
|--------|------|
| USER `dhm@189.cn` 已写入 grants | 是 |
| `canUseTestPool` 逻辑：ADMIN 或 grant | 是（代码既有 + 管理开关） |
| 未授权 USER 无 grant → 不可访问试运行池 | 是（默认无行；新 USER 不开通） |
| 角色仍为 USER（未改为 ADMIN） | 是 |
| 首页 / 专项 / 设置显示「个人试运行训练」 | 是 |
| 试运行页提示「AI初审题库，尚未完成全部人工学科审核。」 | 是 |
| 复用专项选择 / 参数 / 答题 / 判题 / 结果 / 历史 | 是 |
| `counts_formal_stats=0`（试运行不计入正式积分） | 是（既有逻辑） |

---

## 10. 历史记录保护结果

| 检查项 | 结果 |
|--------|------|
| 清理前备份含 sessions / session_items | 是 |
| 清理后 `chem_train_sessions` | **8** 条 |
| 清理后 `chem_train_session_items` | **27** 条 |
| 被引用的问题题改为永久停用而非物理删除 | 是（4 道） |
| 会话内题干/答案快照独立于题库行 | 是（既有设计） |

---

## 11. 备份及恢复方式

### 备份目录（清理前完整快照）

`docs/chemistry_personal_open/backup_2026-10-19T12-05-04-451Z/`

含：

- `chem_train_items.json`（594）
- `chem_train_item_links.json`
- `chem_train_sessions.json`
- `chem_train_session_items.json`
- `chem_train_test_grants.json`
- `clean_plan.json`

另有 dry-run 备份：`backup_2026-10-19T12-04-53-625Z/`。

应用结果：`docs/chemistry_personal_open/clean_result.json`  
核验：`docs/chemistry_personal_open/verify_result.json`

### 恢复

```bash
node docs/chemistry_personal_open/restore_backup.js docs/chemistry_personal_open/backup_2026-10-19T12-05-04-451Z
```

恢复范围：化学训练题 / 关联 / 会话 / 答题 / grants。  
**不**改用户密码、管理员密码、377 条知识正文。

### 防 filler 再生

`docs/chemistry_trial_restore/expand_all_specialties.js` 已永久禁用（exit 2），不再生成 `train.ai_trial.cov.*`。

---

## 12. 尚未解决的问题

1. **正式题库仍为 0**：正式训练不可用；本次仅为个人试运行。
2. **人工学科审核未完成**：574 道多为 AI 初审 / VERIFY；页面已明示风险。
3. **137 个二级分类中 103 个仍无题**：不凑数；待阶段 B 或人工补题（须另指令）。
4. **3 道停用 filler 残留**：仅因历史引用保留；永不进入抽题。
5. **未做浏览器端端到端实操截图**：权限与库表已脚本核验；前端依赖 API 热更新后用学生账号登录验证。
6. **阶段 B / OCR / AI 出题 / AI 老师 / 正式积分**：按需求未开发。

---

## 变更文件摘要

| 区域 | 文件 |
|------|------|
| 清理/备份 | `docs/chemistry_personal_open/*` |
| 禁用 filler | `docs/chemistry_trial_restore/expand_all_specialties.js` |
| 授权 API | `apps/api/src/admin-users/*` |
| 用户管理 UI | `apps/web/src/views/settings/UsersView.vue`、`api/admin-users.ts` |
| 训练入口文案 | `ChemistryHomeView` / `Specialty` / `Setup` / `Session` / `History` |

---

## 最终口径

| 项 | 值 |
|----|-----|
| 原题库 | 594 |
| 实际物理删除 | 16 |
| 永久停用 | 4 |
| 剩余题库 | 578 |
| 个人可训练题目 | 574 |
| 普通学生账号可训练 | **是** |
| 12 个一级专项可训练 | **12** |
| 137 个二级分类可训练 | **34**（有题分类数） |
| 历史数据完整 | **是** |
| 是否影响现有功能 | **否**（正式池/其他学科/密码/知识正文未改） |
