# 化学式输入、显示与判题优化报告

> 日期：2026-10-19  
> **范围：仅化学式相关。** 未开发 OCR / AI 出题 / AI 老师 / 方程式·离子式·计算专用判题。  
> **未改** 377 知识正文、审核状态；**未批量重评**历史训练结果。

自测：`apps/api/src/chemistry/train/chem-formula.util.selftest.ts`（已通过）

---

## 1. 修改的功能

| 模块 | 变更 |
|------|------|
| 数据库 | `answer_type`、`grade_reason`；迁移 `db/migrate_chemistry_train_answer_type.sql`；`init.sql` 同步 |
| 判题 | `chem-train-grade.ts` 按 `answer_type` 分流；`chem_formula` 走专用规则 |
| 工具 | `chem-formula.util.ts`（比较/校验/显示） |
| 会话 | 创建时快照 `answer_type`；提交写入 `grade_reason`（仅新提交） |
| 前端 | 答题预览、题干/答案规范显示、结果页错误原因 |
| 试运行题 | 明确化学式/元素符号填空标记为 `chem_formula`（含 `H2O` 题） |

---

## 2. 化学式规范显示方式

- ASCII 下标数字 → Unicode 下标：`H2O` → `H₂O`，`Ca(OH)2` → `Ca(OH)₂`
- 反应系数保持正体：`2H2 + O2 → 2H2O` → `2H₂ + O₂ → 2H₂O`
- 电荷上标：`Fe2+` → `Fe²⁺`；`SO4^2-` → `SO₄²⁻`
- **不**对任意文本中所有数字一律下标

---

## 3. 化学式判题规则（`answer_type=chem_formula`）

1. 去首尾空白；Unicode 下标与 ASCII 数字等价  
2. **保留**元素大小写，不自动纠正  
3. `H2O` / `H₂O` → **correct**  
4. `h2o` / `H2o` / `h2O` → **wrong**（不再 pending）  
5. 合法但与标准不同 → wrong  
6. 无法可靠解析的复杂表达 → **pending_review**  
7. 普通 `answer_type=text` 填空：仍为精确匹配，否则 pending（不变）

---

## 4. 待复核触发条件

- 未作答  
- `text` 填空未命中标准/等价答案  
- `chem_formula` 无法用确定性规则可靠判定的复杂输入  
- **不包括**明确的大小写错误（直接 wrong）

---

## 5. 测试结果（自测）

| 用例 | 结果 |
|------|------|
| H2O / H₂O | correct |
| CO2 / CO₂、H2SO4 / H₂SO₄、Ca(OH)2 / Ca(OH)₂ | correct |
| h2o、H2o、h2O | wrong |
| 显示：系数不下标、SO₄²⁻、Fe²⁺ | 通过 |
| text 填空 h2o | 仍 pending_review |

---

## 6. 历史数据兼容

- 旧会话题目快照默认 `answer_type=text`，行为与改造前一致  
- 不重写已有 `grade_result`  
- 新会话从题目表快照 `answer_type`；新提交才写 `grade_reason`

---

## 7. 尚未支持（明确不做）

- 化学方程式整式判题  
- 离子方程式专用判题  
- 数值计算填空专用判题  
- OCR / AI 出题  

预留 `answer_type`：`equation` / `ionic` / `numeric`

---

## 8. 运维

```bash
# 若尚未执行迁移
mysql ... < db/migrate_chemistry_train_answer_type.sql

# 标记化学式试运行题
node docs/chemistry_trial_restore/mark_chem_formula_answers.js

# 自测
cd apps/api && npx ts-node --transpile-only src/chemistry/train/chem-formula.util.selftest.ts
```
