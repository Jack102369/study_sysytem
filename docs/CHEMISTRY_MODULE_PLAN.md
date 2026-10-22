# 高一化学专项训练中心

## 阶段一（已完成）· 基础框架

- 数据库：`chem_specialties`、`chem_categories`（`db/migrate_chemistry_phase1.sql` + `db/init.sql`）
- 后端：`apps/api/src/chemistry`（JWT 保护；启动时幂等种子）
- API：
  - `GET /chemistry/specialties`
  - `GET /chemistry/specialties/:code`
- 前端：
  - 菜单「学习工具 → 高一化学」→ `/chemistry`
  - 专项详情 `/chemistry/:code`
- 12 个一级专项 + 全部二级分类可浏览

## 阶段二（已完成）· 结构化知识库

### 已实现

- 知识实体：元素 / 物质 / 反应 / 实验 / 公式 / 规律 / 知识点 / 题库骨架
- 内容状态：`draft` / `pending_review` / `published` / `rejected` / `archived`
- 反应物/生成物结构化（`chem_reaction_species`）；反应 `is_verified` 与配平分离
- 多对多关联现有 12 专项与二级分类；通用 `chem_kb_links` 跳转
- 用户只读已发布：`GET /chemistry/kb/:type`、`GET /chemistry/kb/:type/:id`
- 管理端：`/chemistry/admin/kb/...`（AdminGuard）CRUD、审核、关联、JSON 导入
- 前端：
  - 用户：`/chemistry/kb`、`/chemistry/kb/:type/:id`（上下标组件）
  - 管理：设置 → 化学知识库（`/settings/chemistry`）
- 示例数据：Na 体系（元素/物质/反应/实验/公式/规律/知识点/题目）
- 导入示例：[chemistry_import_example.json](./chemistry_import_example.json)

### 如何进入

| 角色 | 入口 |
|------|------|
| 普通用户 | 学习工具 → 高一化学 →「化学知识库」，或 `/chemistry/kb` |
| 管理员 | 设置 → 化学知识库，或 `/settings/chemistry` |

### 如何管理知识

1. 以 ADMIN 账号登录，打开「设置 → 化学知识库」。
2. 切换 Tab（元素/物质/反应/…）→ 新增或编辑。
3. 「关联」可绑定专项与跨知识跳转链接。
4. 「审核」切换状态；反应需勾选「已核实」才能发布。
5. 「JSON 导入」粘贴 `docs/chemistry_import_example.json` 格式内容。

### 如何导入

```bash
# 管理端 UI：设置 → 化学知识库 → JSON 导入
# 或调用：
POST /chemistry/admin/kb/import
Body: { "items": [ { "type": "element", "data": { ... } }, ... ] }
```

- 逐条校验，返回每条成功/失败与错误列表
- 导入默认 `draft`；未核实反应即使写 `published` 也会降为 `pending_review`
- 重复数据（如元素符号）会报错且不阻断其他条目

### 运维迁移

已有库执行（UTF-8）：

```bash
mysql --default-character-set=utf8mb4 -u... -p study_system < db/migrate_chemistry_phase2.sql
```

阶段一分类表不改动；仅追加知识库表与种子。

## 阶段三（进行中）· 知识内容建设

### 第1步（已完成）· 完整知识清单

- 人读：[CHEMISTRY_KB_INVENTORY.md](./CHEMISTRY_KB_INVENTORY.md)
- 机读：[chemistry_kb_inventory.json](./chemistry_kb_inventory.json)
- 规模：**311** 条清单（编码+名称级）；按 batch2–6 对应后续灌库步骤

### 第2步（已完成）· batch2 元素与基础概念

- 报告：[CHEMISTRY_BATCH2_REPORT.md](./CHEMISTRY_BATCH2_REPORT.md)
- 导入包：`docs/chemistry_batch2/import_B2-*.json`
- 结果：计划 91；复用 seeded 10；新建导入 **81**（`pending_review`）；失败 0；缺失 0
- seeded 仅审计不覆盖已发布内容

### batch3（已完成 · 2026-10-18）

- 报告：`docs/CHEMISTRY_BATCH3_REPORT.md`
- 导入包：`docs/chemistry_batch3/import_B3-*.json`
- 结果：计划 **91**；复用 seeded 7；新建导入 **84**（`pending_review`）；失败 0；缺失 0
- 安全导入：`pnpm chem:import`（无密码）

### 后续步骤（未做）

4. 非金属化学数据（batch4）  
5. 实验和计算数据（batch5）  
6. 有机、能量及综合数据（batch6）  
7. 人工审核 pending_review 与完整性复核

## 阶段四（已完成骨架）· 训练引擎第一阶段

- 报告：[CHEMISTRY_TRAINING_PHASE1_REPORT.md](./CHEMISTRY_TRAINING_PHASE1_REPORT.md)
- 独立训练题池 `chem_train_items`（formal/test）+ 会话/快照表；迁移见 `db/migrate_chemistry_train_phase1.sql`
- API：`/chemistry/train/*`；前端：专项分类 → 设置 → 答题 → 结果 → 历史
- 正式池当前 **0** 题（空库提示）；测试池 9 题（仅管理员/授权）
- **未**接 AI 出题、OCR、自适应、积分

## 尚未实现（后续阶段）

正式训练题批量入库与人审 UI、自动出题、拍照 OCR 判题、错题/复习挂钩、积分统计、AI 化学老师、Excel 导入。
