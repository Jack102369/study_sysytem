# 高一数学 · 服务器部署登记册

> **用途**：记录服务器上的版本、功能、库状态与每次同步操作。  
> **部署方式**：本地准备包 → **由你自行上传部署**（本仓库代理不直连服务器写库）。  
> **创建**：2026-10-29 16:06:38 +08:00  
> **维护**：每次上线后追加「变更日志」一行，并更新「服务器当前状态」。

---

## 0. 名词说明（先读这段）

| 说法 | 白话意思 | 你怎么查 |
|------|----------|----------|
| **drawable** | 「能抽进正式训练」的题目数量：状态=`approved`、启用、且在正式池。不是库里所有草稿题。 | 管理端题库统计，或 SQL 数 `hs_math_train_items` 满足上述条件的行数 |
| **d1 / d2 / d3** | 难度 1 基础 / 2 提高 / 3 压轴 的 drawable 题量 | 同上，按 `difficulty` 分组计数 |
| **真 H3** | 题号（`code`）以 `CAND-H3` 开头的压轴题；训练里单独一档「真 H3」 | `code LIKE 'CAND-H3%'` 且 approved |
| **压轴（difficulty=3）** | 所有难度=3 的题，**包含** HARD14 等旧压轴 **和** 真 H3 | 选「压轴」开训时抽这一整类 |
| **`session.category_id` 可空迁移** | 给训练会话表加能力：**可以不选小节、整章抽题**。改的是表结构（允许该列为空），**不是删历史**。脚本：`db/migrate_hs_math_session_category_nullable.sql` | 在服务器 MySQL 看 `hs_math_train_sessions.category_id` 是否允许 NULL |
| **阶段 B 只读探查** | 上线前先在服务器**只查询、不改数据**，弄清：现在有多少 drawable、有没有真 H3、有没有做过「可空」迁移。探查完再备份、再部署 | 见 §5 探查 SQL |

本地最近记录的 drawable 基线见 §2；**服务器数字以你探查结果为准**，填进 §3。

---

## 1. 部署约定

| 项 | 约定 |
|----|------|
| 上传主体 | **你自己**上传并重启服务 |
| 本仓库职责 | 登记文档、清单、构建说明、迁移文件路径、验收标准 |
| 历史保护 | **禁止**覆盖/清空 `hs_math_train_sessions`、`hs_math_train_session_items` 及会话图片/图形快照表 |
| 题库同步 | 按题目 **`code` 幂等导入**，禁止按本地自增 `id` 整表覆盖 |
| 其它模块 | 本轮以高一数学为主；打包时注意不要误开工业实验等未打算上线的开关 |

### 历史会丢吗？

一般**不会**，只要：

1. 不做整库还原覆盖会话表；  
2. 不 `TRUNCATE` / 批量 `DELETE` 会话与会话题目；  
3. 更新题目用「同 code 更新或新增」，而不是删光再建。

会话题目行里通常带有当时的**题干 / 答案 / 解析快照**，旧练习回看主要靠这些快照，不依赖你后来改题库正文。

---

## 2. 本地参考基线（开发机，非服务器）

> 来源：`PROJECT_HANDOFF.md`（约 2026-10-28 TRUE-H3-FILTER / H3 导入后）。部署前建议在本地再跑一次只读统计核对。

| 项 | 本地参考值 |
|----|------------|
| 正式 drawable | **926** |
| d1 / d2 / d3 | **335 / 478 / 113** |
| 真 H3（`CAND-H3C14-*` approved） | **13** |
| 难度 UI | 基础 / 提高 / 压轴 / **真 H3** |
| API | `createSession.trueH3Only` → `code LIKE 'CAND-H3%'` |
| 整章开训 | `hs_math_train_sessions.category_id` 允许 NULL（Plan A） |
| 相关文档 | `191`～`193`（H3 导入）、`PROJECT_HANDOFF.md` |

本轮题库同步范围（已确认）：

- 真 H3（`CAND-H3*`）  
- 其它本地新增 **d1 / d2**  
- **HARD14** 等 difficulty=3 非真 H3 压轴  

具体「服务器缺哪些 code」以 §5 探查对比结果为准，不要假设服务器与本地 id 一致。

---

## 3. 服务器当前状态（部署后请改这里）

| 字段 | 值（请填写） |
|------|----------------|
| 环境名 | （如：生产 / 教学机） |
| 主机 / 路径 | |
| API 版本 / 构建日期 | **待填** |
| Web 版本 / 构建日期 | **待填** |
| Node / 进程管理 | |
| MySQL 库名 | （常见 `study_system`） |
| 正式 drawable | **待探查** |
| d1 / d2 / d3 | **待探查** |
| `CAND-H3%` 数量 | **待探查** |
| `category_id` 是否可空 | **待探查**（是 / 否） |
| 最近备份路径 | |
| 最近备份时间 | |
| `CHEM_INDUSTRIAL_EXPERIMENT_ENABLED` | 建议保持默认关闭，除非你明确要开 |
| 备注 | |

---

## 4. 功能清单（高一数学 · 预期上线后）

| 功能 | 说明 | 依赖 |
|------|------|------|
| 专项训练 | 按章节/小节、难度抽题 | 题库 approved |
| 难度四档 | 基础 / 提高 / 压轴 / 真 H3 | 前后端同版本 |
| 真 H3 筛选 | 仅 `CAND-H3%` | 代码 + 题已入库 |
| 压轴 | 全部 `difficulty=3`（含 HARD14 + 真 H3） | 题库 |
| 整章抽题 | 可不选小节 | 迁移：category 可空 + 前端 |
| 训练历史 | 会话列表、结果、解析回看 | **保留会话表** |
| 管理端导入/审核 | 按批导入、review、approve | Admin 账号 |
| 配图（若有） | 题图 / 会话图 | uploads 与 DB 链接一致 |

---

## 5. 阶段 B：只读探查（上线前必做）

目的：弄清**服务器现在有什么**，避免瞎覆盖。只读，不改数据。

在服务器 MySQL（库名按实际替换）执行：

```sql
-- 1) 可训练题量（drawable 近似）
SELECT difficulty, COUNT(*) AS cnt
FROM hs_math_train_items
WHERE pool = 'formal' AND status = 'approved' AND is_active = 1
GROUP BY difficulty
ORDER BY difficulty;

SELECT COUNT(*) AS drawable
FROM hs_math_train_items
WHERE pool = 'formal' AND status = 'approved' AND is_active = 1;

-- 2) 真 H3 数量
SELECT COUNT(*) AS true_h3
FROM hs_math_train_items
WHERE code LIKE 'CAND-H3%' AND status = 'approved' AND is_active = 1;

-- 3) 训练历史体量（确认有数据要保护）
SELECT COUNT(*) AS sessions FROM hs_math_train_sessions;
SELECT COUNT(*) AS session_items FROM hs_math_train_session_items;

-- 4) category_id 是否允许 NULL（可空迁移是否做过）
SHOW COLUMNS FROM hs_math_train_sessions LIKE 'category_id';
-- 看 Null 列：YES = 已可空；NO = 尚未做迁移，部署整章开训前需执行 migrate
```

把结果填进 §3。再与本地 §2 对比，列出「服务器缺的 code」（可用管理端导出或按批核对）。

---

## 6. 同步计划表（你自行上传）

| 序号 | 阶段 | 做什么 | 谁做 | 完成标准 |
|------|------|--------|------|----------|
| 1 | 登记 | 维护本文 §3 | 你 / Cursor 协助改文档 | §3 有主机与探查数字 |
| 2 | 探查 | 跑 §5 SQL | 你 | drawable / H3 / 可空 已知 |
| 3 | 备份 | 备份至少 `hs_math_*`（建议全库） | 你 | 备份路径写入 §3 |
| 4 | 结构 | 若 `category_id` 不可空 → 执行 `db/migrate_hs_math_session_category_nullable.sql` | 你 | `Null=YES`；**会话行数不变** |
| 5 | 代码包 | 本地 `pnpm --filter api run build` + `pnpm --filter web run build`，按现网方式打发布包 | 你 | 包内含真 H3 API/UI |
| 6 | 上传部署 | 上传 API/Web，按现网流程重启；**不要**用本地整库 SQL 覆盖会话表 | 你 | 站点可登录；数学入口正常 |
| 7 | 题库 | 将本地新增 d1/d2/HARD14/真 H3 按 **code** 导入→审核→批准；缺图补传 | 你 | 缺的 code 变为 approved |
| 8 | 验收 | 见 §7 | 你 | 全部勾选 |
| 9 | 回写 | 更新 §3 + §8 变更日志 | 你 / 协助 | 文档与现网一致 |

### 打包时建议带上（数学相关）

- `apps/api/dist`（或你们惯用的发布目录）  
- `apps/web/dist`（或静态资源目录）  
- `db/migrate_hs_math_session_category_nullable.sql`（若服务器尚未执行）  
- 其它服务器相对本地**尚未执行**的 `db/migrate_hs_math_*.sql`（先列清单，确认后再执行）  
- 题库导入用载荷 / 批次说明（如 `docs/high_school_math/question_bank/h3_ch1_4_import_payload*.json` 及 HARD14/其它批次文档）  
- **不要**用本地 `apps/api/var` 或整份开发库 dump 直接覆盖生产会话数据  

### 环境变量注意

- 数学相关按现网已有配置保留。  
- 工业实验：`CHEM_INDUSTRIAL_EXPERIMENT_ENABLED` 未设置即关闭；除非你要开，否则不要写成 `true`。

---

## 7. 验收清单

- [ ] 任意一条**旧训练记录**能打开，题干/你的作答/解析仍在  
- [ ] `hs_math_train_sessions` / `session_items` 行数 ≥ 探查时（未变少）  
- [ ] 选「基础 / 提高 / 压轴」可正常开训（有题的章节）  
- [ ] 选「真 H3」只抽到 `CAND-H3*`；无题章节提示「暂无已批准的真 H3…」  
- [ ] 「本章压轴（H3）」入口行为符合预期  
- [ ] 新导入的 d1/d2/HARD14/H3 在管理端可见且可抽  
- [ ] 整章不选小节开训：若已做可空迁移，应成功；未做则先完成迁移再测  

---

## 8. 变更日志

| 日期 | 操作人 | 版本/包 | 库变更 | 题库变更 | 结果 | 备注 |
|------|--------|---------|--------|----------|------|------|
| 2026-10-29 | — | 文档创建 | 无 | 无 | 登记册就绪 | 部署方式=自行上传；题库范围=d1/d2/HARD14+真 H3 |
| 2026-10-29 16:11 | Cursor | `release/study-system-hs-math-sync_20261029_161158.zip`（约 20.1 MB）；目录 `release/study-system/` | 包内含 migrate + `hs_math_content_sync.sql`（约 1.3 MB）；**不含**会话表 | 本地内容表 dump + `uploads/hs-math` 144 文件 | 打包 **PASS** | 自行上传；nginx=`deploy/nginx.conf`；见 `PACK_README_HS_MATH.txt` |
| 2026-10-29 16:25 | Cursor | `release/study-system-hs-math-sync_20261029_162509.zip`（约 20.11 MB） | 同上；清单已含 Workbench 备份/同步白话 | 重新 dump 内容 SQL + 144 配图 | 打包 **PASS** | 含 A0b「已有历史」路径与 Workbench 步骤 |
| | | | | | | |

---

## 9. 回滚预案（简表）

| 情况 | 做法 |
|------|------|
| 仅代码有问题 | 回退上一版 API/Web 包并重启 |
| 迁移执行失败 | 用备份恢复；不要强行改会话数据 |
| 题库导错 | 按 `code` 下架/修正新增题；**不要**删会话表 |
| 历史异常 | 优先从备份恢复 `hs_math_train_sessions*` |

---

## 10. 相关路径速查

| 路径 | 说明 |
|------|------|
| `docs/high_school_math/PROJECT_HANDOFF.md` | 本地开发交接与 drawable 参考 |
| `db/migrate_hs_math_session_category_nullable.sql` | 整章开训结构迁移 |
| `apps/api/src/hs-math/train/hs-math-train.service.ts` | `trueH3Only` 抽题逻辑 |
| `apps/web/src/views/hs-math/HsMathTrainSetupView.vue` | 难度四档 UI |
| `docs/high_school_math/question_bank/h3_ch1_4_import_*.json` | 真 H3 导入载荷/结果 |
| `docs/high_school_math/191_*.md`～`193_*.md` | H3 正式导入过程记录 |
