# 高一化学 · 错题中心第二阶段开发报告

> 日期：2026-10-20  
> 范围：变式题推荐、解题方法总结、`wrong_variation` 训练入口。  
> **未做**：AI 生成变式、AI 错因诊断、积分、遗忘曲线、正式掌握度。  
> **个人试运行题库 ≠ 人工审核通过 ≠ 正式上线。**

---

## 1. 实际交付

| 能力 | 说明 |
|------|------|
| 变式推荐 | 详情 `variationPreview`；与正式组卷同一套准入/关联规则 |
| 变式训练 | `POST /wrong-questions/:id/variation-practice`；`session_kind=wrong_variation` |
| 来源追踪 | `chem_train_sessions.source_wrong_item_id`（可空） |
| 方法总结 | 详情 `methodSummary`（可靠来源才展示） |
| 前端 | 详情页「开始变式训练」5/10/20；结果页「返回错题详情」 |
| 历史筛选 | `kindFilter=wrong_variation` |

### 主要文件

- `db/migrate_chemistry_wrong_question_phase2.sql`、`db/init.sql`
- `chem-model-catalog.loader.ts`（安全读 `models_catalog.json`）
- `chem-variation-match.util.ts`（档位/骨架去重/解析分段）
- `chem-wrong-question.service.ts` / `.controller.ts`
- `chem-train-session.entity.ts`、`chem-train.service.ts`
- 前端：`ChemistryWrongQuestionDetailView.vue`、`ChemistryTrainResultView.vue`、`ChemistryTrainHistoryView.vue`、`api/chemistry-train.ts`
- 冒烟：`docs/chemistry_wrong_question/smoke_phase2.js`

---

## 2. 实际实现的变式匹配规则

搜索范围（仅候选池，不等于推荐依据）：

- 同二级分类 / 同一级专项  
- 或 `gate_note` 含相同 `model=ADV.*`  
- 或共享**精确** `(entity_type, entity_id)` 知识链接（不做 knowledge↔knowledge_point 名称归一）

**推荐档位（通过后才入选）：**

| 档位 | 条件 |
|------|------|
| 1 `kp_same_model` | 共享精确知识链接 **且** 相同 `ADV` 模型 |
| 2 `kp_related_model` | 共享精确知识链接 **且** 不同模型，但目录内 `knowledgePoints`/`abilities` 有重叠（**非**仅 ADV 专项前缀） |
| 3 `kp_diff_context` | 共享精确知识链接（无模型或模型未达 1/2） |
| 4 `category_with_evidence` | 同二级分类 **且** 双方模型在目录中判定相关（含相同 model id） |
| `none` | 仅同专项 / 仅同分类 / 仅同 ADV 前缀 / 类型不同的同 id 链接 → **拒绝** |

硬排除：原题、巩固中/已掌握题、eligibility 失败、无 grant 的 test 题、题干骨架完全相同的实质重复。

机械变式（去数字后骨架相同或近包含）：降权；同骨架只保留一道。

题量：请求 5/10/20，实际 `min(请求, 合格数)`；0 候选不建会话并提示「暂无合适变式题目，建议先复习原题。」

---

## 3. 各档候选与典型案例（实测）

| 场景 | 结果 |
|------|------|
| 锚点 `ADV.redox.001`（item 607） | 合格变式 **2**（同模型/同分类证据，如 608、616） |
| 请求 5 题 | 实际创建 **2**，shortfall 提示，不凑数 |
| 唯一模型 `ADV.calculation.001`（595）且 **0 知识链接** | 合格 **0**（符合严格规则） |
| 无链接旧题 | 多数 **0**；明确提示 |
| 纯函数：仅同专项 / 仅同分类 / 仅 ADV 前缀 / knowledge_point≠knowledge | 均 `none` |

### 旧题缺少知识链接或模型关联的实际情况

- s60 共 60 题带 `model=ADV.*`；大量题目 **`chem_train_item_links` 为 0**。  
- 部分模型仅 1 道样题（如 `ADV.calculation.001`），无同模型兄弟。  
- 目录内模型 KP 字符串常不一致（如 calculation.001 vs .002 无共享 KP），「相关模型」档较严。  
- **结论**：当前变式产能高度依赖「同模型配对 + 同分类」或「真实共享链接」；旧题/孤立模型题经常无变式——属预期，不以放宽规则凑数。

---

## 4. 机械重复识别能力与限制

**已实现（轻量、非 AI）：**

- 题干去数字/空白/标点得骨架；完全相同排除；近包含判机械变式并降权。  
- 同骨架机械题只保留一道。

**未实现 / 不可声称：**

- 语义相似度、选项重排识别、AI 判重。  
- 复杂改写仍可能漏判或误伤——报告中如实说明。

---

## 5. 解题方法总结：来源与可靠性

优先级（**不拼接冲突来源**）：

1. 当前错题 `analysis` 七段标签（突破口/关键条件/核心方法/易错/同类识别）  
2. 否则：`models_catalog.json` 中该题 `model=ADV.*` 条目（目录读失败则跳过）  
3. 无可靠字段则 `available=false`，前端不展示方法区  

声明文案：要点来自题库/模型，**不认定学生真实错因**。

冒烟：s60 锚点 `source=current_item_analysis`；无分段解析不编造。

`models_catalog.json`：部署时从仓库 `docs/chemistry_advanced_model/` 多路径尝试加载；失败不崩溃，退化为纯知识链接匹配。实测加载 **45** 模型。

---

## 6. 变式训练与状态规则

| 规则 | 实现 |
|------|------|
| 做变式 B 不改原错题 A | 回放按 `item_id`；冒烟 A 保持 `open` |
| B 首次做错进错题中心 | 全量 rebuild，与其它 kind 相同 |
| B 已是错题则更新 B 自身 | 冒烟 B → consolidating/mastered，A 仍 open |
| 不关闭 `wrong_variation` 的错题更新 | submit 仍调用 `onSessionSubmittedSafe` |
| 不计每日完成 | daily 仅统计 `session_kind=daily` |
| 不计正式积分 | `countsFormalStats=false` |

---

## 7. 数据库迁移

`db/migrate_chemistry_wrong_question_phase2.sql`：

- `session_kind` 注释含 `wrong_variation`  
- 新增可空列 `source_wrong_item_id` + 索引 + FK → `chem_wrong_items(id)` ON DELETE SET NULL  

已在本地执行：`node docs/chemistry_wrong_question/run_migration_phase2.js` → ok。

---

## 8. 隔离冒烟结果

账号：`chem_wrong_p2_smoke@local.test`（未改管理员密码、未污染真实学生）。

命令：`node docs/chemistry_wrong_question/smoke_phase2.js`

**汇总：27 / 27 PASS**

含：严格拒绝规则、预览排除原题、不足题量少出、变式提交、A 状态不变、B 自身更新、0 候选 400、daily/advanced 不受影响等。

---

## 9. 是否影响已有功能

- 原题复练 / 专项 / 每日 / 提高挑战：接口与统计隔离，冒烟确认 daily/advanced 正常。  
- Phase1 错题回放：未为保护 A 而排除 `wrong_variation` 事件；变式结果只作用于变式题 `item_id`。

---

## 10. 未解决风险 / 遗留

1. 大量题无知识链接或孤立模型 → 变式常为空（产品上依赖提示）。  
2. 目录「相关模型」依赖字符串 KP/abilities 重叠，覆盖有限。  
3. 机械去重非语义级，可能漏判。  
4. `gate_note` 255 截断理论上可能丢 `model=`（当前 s60 样例完整）。  
5. 详情「原题复练」仍走全局一键复练（Phase1 行为），非单题专用组卷。

---

## 11. 下一阶段建议（待指令）

1. 回填 s60/旧题可靠知识链接，提高变式命中率。  
2. 单题原题复练专用接口。  
3. 可选：为 train item 增加持久化 `model_id` 列并回填。  
4. 仍不建议在无证据时放宽到「仅同分类」。  
