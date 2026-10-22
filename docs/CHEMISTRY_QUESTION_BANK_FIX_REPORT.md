# 化学训练题库整改与 AI 试运行准入优化报告

> 日期：2026-10-19  
> **未**开发阶段 B / OCR / AI 出题；**未**转入正式题池；**未**改 377 知识正文/发布状态；**未**删题/删会话。

备份目录：`docs/chemistry_question_bank_fix/backup_2026-10-19T11-53-16-317Z/`  
回滚：`node docs/chemistry_question_bank_fix/restore_backup.js --dir=...`  
应用脚本：`apply_fix.js`；验证：`validate_after_fix.js`

---

## 1. 整改前统计（基线）

| 项 | 值 |
|----|-----|
| 题库总数 | 594 |
| PASS / FIX / VERIFY（审查） | 328 / 43 / 223 |
| P0 / P1 | 0 / 0 |
| formal | 0 |
| filler 停用 | 18（已 is_active=0） |
| 缺知识关联（审查 FIX） | 25 |

---

## 2. 实际修改范围

| 动作 | 数量 |
|------|------|
| 题目 `gate_note` 打标（qa / verify_class / trial_access） | **594**（全量） |
| 可靠补全 `chem_train_item_links` | **22** |
| 无法可靠关联 → `trial_access:block`（保留题目） | **2** |
| 无关联但允许试运行（实验安全通识） | **1** |
| filler 确认停用 + block | **18** |
| `answer_type=chem_formula` 核对 | 相关填空已为 chem_formula |
| 知识正文 / status | **0 变更** |
| 训练会话 / 答题记录 | **未删除**（验证 sessions=8，session_items=27） |

**“实际修改题目”口径：594（准入标签）；其中结构性变更（补关联）22 道。**

---

## 3. 25 道缺关联处理结果

| 结果 | 数量 | 说明 |
|------|------|------|
| 已补可靠关联 | **22** | 如质量守恒→`concept.mass_conserve`；水→`sub.H2O`；钠条件→`rxn.4Na_O2`/`rxn.2Na_O2_heat` 等 |
| 允许无关联试运行 | **1** | `train.test.exp.judge.01`（家中禁做实验通识） |
| 无法可靠确认来源 → **禁止试运行抽题** | **2** | `train.test.eq.single.01`（化学变化通识无单条知识）；`train.ai_trial.eq.conversion.01`（转化关系过笼统） |

未猜测挂靠；未删题。

---

## 4. 18 道 filler

- `is_active=0` **保持**  
- `[trial_access:block]`  
- **不计入**可用题量 / 试运行抽题  
- 行保留，历史会话可展示  

---

## 5. 223 道 VERIFY 四类分类

| 类别 | verify_class | 试运行 | 题量（打标后） |
|------|--------------|--------|----------------|
| ① 题目本身科学性/答案歧义 | `science` | **禁止** | **0**（审查无 P0/P1） |
| ② 题干未见明确错误，来源知识未人审 | `kb_pending` | **允许管理员试运行** | **223** |
| ③ 题型适配/元认知等限制 | `qtype_limit` | **允许**（正式仍否） | **11** |
| ④ 课程范围争议 | `curriculum` | **禁止** | **0** |

原则：不因「知识仅 AI 初审」自动禁止管理员试运行；正式池/积分/错题/掌握度仍隔离。

---

## 6. 当前试运行准入

| 指标 | 数量 |
|------|------|
| 可试运行（active + approved + trial_access:allow） | **574** |
| 禁止试运行标记（含停用 filler 等） | **20** |
| formal | **0** |
| 有知识关联的题目数 | **573** |

抽题规则更新：

- 测试池遵守 `[trial_access:block]` → 不可抽  
- **取消**「同专项任意分类」凑数回退；仅「同分类任意难度」  
- 空分类明确提示暂无适用题  

---

## 7. 管理后台

| 功能 | 路径 |
|------|------|
| 训练题库列表（筛选 PASS/FIX/VERIFY、可试运行/禁止、待人审知识） | `/settings/chemistry-train-items` |
| API | `GET /chemistry/admin/train-items` |
| 出题器 | `/settings/chemistry-generator`（保留） |

列表字段含：编码、题干、题型、难度、专项/分类、来源知识、知识审核状态、质量结论、试运行/正式许可、限制原因。

---

## 8. 各专项 / 难度可用题量（可试运行）

一级专项可训练：**12 / 12**

| 专项 | 可试运行题量 |
|------|----------------|
| equation | 218 |
| redox | 111 |
| substance | 92 |
| memory | 68 |
| periodic | 21 |
| comprehensive | 20 |
| ion | 18 |
| calculation | 8 |
| experiment | 7 |
| organic | 6 |
| structure | 3 |
| inference | 2 |

| 难度 | 可试运行 |
|------|----------|
| 1 | 407 |
| 2 | 167 |
| 3 | 0 |

二级分类有可试运行题：**34**（空分类不跨类凑数）。

---

## 9. 历史数据与隔离

| 检查 | 结果 |
|------|------|
| 会话/答题记录保留 | ✅ |
| 未批量重评历史答案 | ✅ |
| 377 知识正文/发布状态 | ✅ 未改 |
| formal 仍为 0 | ✅ |
| 普通学生 test 池 ACL | ✅ 既有 ADMIN/grant，未放宽 |
| filler 不进入抽题 | ✅ |

---

## 10. 结论

| 问题 | 结论 |
|------|------|
| 是否允许管理员继续试运行 | **是**（574 道合规题） |
| 是否具备正式训练发布条件 | **否** |

### 下一步（待指令）

1. 人工审核 kb_pending 来源知识与 VERIFY 题  
2. 为 2 道 block 题补可靠知识或改写后重开  
3. 阶段 B / 正式池发布须单独确认  

---

## 11. 关键文件

- `docs/chemistry_question_bank_fix/apply_fix_result.json`  
- `docs/chemistry_question_bank_fix/validate_result.json`  
- `apps/api/.../chem-train-eligibility.service.ts`（trial_access）  
- `apps/api/.../chem-train.service.ts`（取消跨分类凑数）  
- `apps/web/.../ChemistryTrainItemsAdminView.vue`  
