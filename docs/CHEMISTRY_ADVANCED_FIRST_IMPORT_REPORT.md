# 首批 60 道提高/挑战题 · 整改入库与个人试运行报告

> **AI 辅助复核 ≠ 人工学科审核 ≠ 正式池上线。**  
> 完成日期：2026-10-20  
> 本批仅处理 SAMPLE60，未生成下一批题目。

---

## 1. 执行摘要

| 指标 | 结果 |
|------|------|
| 样题总数 | 60 |
| 修复 NEEDS_FIX | **4/4 复验通过** |
| 最终白名单 | **60**（提高 36 / 挑战 24） |
| 实际新插入 | **60**（幂等重跑：0 插入 / 60 skip） |
| 导入前题库总数 | **578** |
| 导入后题库总数 | **638** |
| 导入前个人可训练 | **574** |
| 导入后个人可训练 | **634** |
| 新增提高 | **36**（difficulty=2） |
| 新增挑战 | **24**（difficulty=3；导入前全库挑战为 0） |
| 正式人工审核题池 | **仍为 0** |
| 每日可抽题量（test） | **574 → 574（不变）** |
| API 冒烟 | **全部通过** |

---

## 2. 四道 NEEDS_FIX 整改结果

| 样题 ID | 原问题 | 处理 | 复验 | 入库难度 |
|---------|--------|------|------|----------|
| S60.ion.07 | 解析偏薄 | 补全四步审查解析 + optionAudit | PASS | 提高 |
| S60.ion.09 | 挑战不真实 | 升级为多约束离子式选型（难溶/旁观/情景） | PASS | **挑战** |
| S60.ion.10 | 挑战偏弱、B 双重错误解析不全 | 升级为「电荷不守恒 ∧ 不符 Fe²⁺ 事实」合取题 | PASS | **挑战** |
| S60.comprehensive.08 | 近乎直接 n=m/M | 改为 O₂ 限制下 CO/CO₂ 路径判断（12 g C + 16 g O₂） | PASS | **挑战** |

挑战题数量经修复后仍为 **24**，未降其他题标准凑数。

---

## 3. 白名单与准入

- 文件：`docs/chemistry_advanced_first_import/import_whitelist.json`
- 复验明细：`reverify_result.json`（rejectedCount=0）
- 每题含：sampleId、sourceModelId、qaGrade、difficulty、specialty/category、知识点、admitReason、`dailyEligible=false`
- 分类映射：`category_mapping.json`（缺映射则不入库；本批无缺失）
- 编码：`train.ai_trial.s60.{sampleId}`

`gate_note` 结构（标记在前）：

```text
[ai_trial][trial_access:allow][qa:PASS][daily:exclude][human_unreviewed][s60] sample=… model=…
```

---

## 4. 入库字段与解析

复用 `chem_train_items`（未新建题库）：

- `pool=test`，`status=approved`，`ban_default_train=1`
- `qtype=single`，答案为选项键
- `analysis`：七段文本（考查点/突破口/条件/分步/方法/易错/同类特征）+ 「可能是因为…」错选提示
- 前端结果页/会话页增加 `pre` 多段显示（不破坏旧题）

---

## 5. 每日 10 分钟隔离

### 代码

`chem-daily-review.service.ts` → `loadEligiblePool`：

- 保留 `difficulty ∈ {1,2}`
- **通用排除** `gate_note` 含 `[daily:exclude]`
- **不以 s60 前缀作为唯一条件**（前缀仅作本批双保险标识）

### 统计对比（实际库）

| 池 | 导入前可抽 | 导入后可抽 |
|----|------------|------------|
| test 每日候选 | **574** | **574** |
| formal 每日候选 | 0 | 0 |

### 真实组卷验证

隔离用户 `chem_s60_smoke@local.test` 创建每日会话 **10** 题：

- DB 核验：题目 code **不含** `train.ai_trial.s60.%`
- gate_note **不含** `[daily:exclude]`
- 检查项：`daily_no_s60_or_exclude` → **PASS**

---

## 6. API 冒烟（隔离用户 + dhm）

| 检查 | 结果 |
|------|------|
| 无 grant 用户创建试运行 | **403** |
| dhm@189.cn 提高可用性 | **>0**（未创建 dhm 会话） |
| dhm@189.cn 挑战可用性 | **>0** |
| 隔离用户抽到 s60 并提交 | **PASS**（会话含 4 道 s60） |
| 标准答案判题 | s60 答对 → **correct** |
| 七段解析 | **含考查/突破口/分步/方法** |
| 挑战会话 | **3/3 均为 s60** |
| 正式池 | **0** |

隔离会话保留在测试用户下（未物理删除历史）。未触碰 `dhm@189.cn` 真实训练记录。

冒烟结果：`docs/chemistry_advanced_first_import/smoke_result.json`

---

## 7. 幂等与回滚

### 幂等

第二次执行 `backup_and_import.js`：`imported=0, skipped=60`，总数仍 638。

### 回滚（停用本批，不删历史）

```sql
UPDATE chem_train_items
SET is_active=0,
    gate_note=CONCAT(gate_note,' [trial_access:block] [s60:rollback]')
WHERE code LIKE 'train.ai_trial.s60.%';
```

- 备份目录：`docs/chemistry_advanced_first_import/backup_2026-10-20T01-10-37-641Z/`
- 题 ID 清单：`imported_item_ids.json`
- 不影响原 574 可训练题与历史快照

---

## 8. 各专项新增（白名单/入库）

| 专项 | 新增 |
|------|------|
| calculation | 12 |
| redox | 12 |
| ion | 10 |
| experiment | 10 |
| inference | 8 |
| comprehensive | 8 |

二级分类：按映射落入既有分类（如 `amount`/`ionic_write`/`e_conserve`/`block_diagram` 等），**未新建分类**。

---

## 9. 代码改动清单

| 文件 | 说明 |
|------|------|
| `apps/api/.../chem-daily-review.service.ts` | `[daily:exclude]` 通用过滤 |
| `apps/web/.../ChemistryTrainResultView.vue` | 解析 pre-wrap |
| `apps/web/.../ChemistryTrainSessionView.vue` | 解析 pre-wrap |
| `docs/chemistry_advanced_samples/samples60.json` | 4 题修复 + 2 题 steps 补全 |
| `docs/chemistry_advanced_first_import/*` | 白名单/备份/导入/冒烟脚本 |

未改：45 模型库、正式积分、掌握度、管理员密码、知识库正文。

---

## 10. 遗留问题

1. **同分类旧提高题仍多**：随机组卷时 s60 与旧 d2 题混抽属预期；挑战模式更易抽到纯新题。  
2. **知识关联为软匹配**：部分题 `chem_train_item_links` 可能为空；试运行不强制 KB（与现网一致）。  
3. **仍非人工学科审核**：界面/gate 已标明 AI 试运行。  
4. **部分提高题难度仍偏「基础+」**：未在本阶段二次降级，后续扩量应更严。  
5. API 需使用含每日过滤的 **dist 构建**；已重建并重启验证。

---

## 11. 结论

首批 **60** 道提高/挑战题已进入个人试运行题池（`pool=test`），**每日 10 分钟可抽量未增加**，正式池仍为 **0**。  
`dhm@189.cn` 可在专项提高/挑战中抽到新题；隔离用户完成答题、判题与七段解析验证。  
**可以**供授权账号专项训练；**不可以**视为正式人审通过或默认对学生全量开放。
