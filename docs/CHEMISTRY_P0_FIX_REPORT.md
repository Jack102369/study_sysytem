# 高一化学知识库 · P0 修复报告

> 修复日期：2026-10-18  
> 范围：**仅**质量审查认定的 3 个 P0 问题  
> 未执行：Batch3 建设/导入、其他批次内容修改、新增知识条目  
> 备份目录：`docs/chemistry_p0_fix/`

---

## 1. 修复清单

| # | 编码/对象 | 表 | id | 问题 |
|---|-----------|----|----|------|
| 1 | `kp.structure.atom` | `chem_knowledge_points` | 14 | 质量数写成近似「≈」 |
| 2 | `formula.rho_c_M` | `chem_formulas` | 7 | 单位与 ω 约定不完整 |
| 3 | `rxn.2Na_2H2O`（钠与水反应） | `chem_reactions` | 1 | `ox_product` / `re_product` 对调 |

---

## 2. 可恢复备份

| 文件 | 用途 |
|------|------|
| `docs/chemistry_p0_fix/backup_before_p0.json` | 修复前快照（由 dry-run 复制） |
| `docs/chemistry_p0_fix/backup_before_p0_apply.json` | apply 时再次写入的修复前快照 |
| `docs/chemistry_p0_fix/backup_after_p0_apply.json` | 修复后快照 + 校验结果 |
| `docs/chemistry_p0_fix/p0_fix.js` | 修复脚本（`--apply` 写入） |
| `docs/chemistry_p0_fix/p0_restore.js` | 从备份回滚数据库 |

回滚命令：

```bash
node docs/chemistry_p0_fix/p0_restore.js
```

---

## 3. 逐条修复对照

### 3.1 `kp.structure.atom`（知识点 id=14）

**修复原因**：质量数定义为整数关系 \(A = Z + N\)，不得使用近似号；需与相对原子质量区分。

| | 内容 |
|--|------|
| **修复前** | `…质量数≈质子数+中子数；核外电子数=质子数（原子）。离子电子数随之变化。` |
| **修复后** | `…质量数 A = 质子数 Z + 中子数 N（定义用等号，不是近似）；核外电子数=质子数（原子）。注意：质量数是整数，相对原子质量是加权平均值，二者不可混淆。离子的电子数随所带电荷变化。` |
| **status** | 仍为 `pending_review`（未宣称人工审核通过） |

### 3.2 `formula.rho_c_M`（公式 id=7）

**修复原因**：仅有表达式、缺少 ρ/ω 单位与小数约定时，计算专项会系统性算错。

| 字段 | 修复前 | 修复后 |
|------|--------|--------|
| expression | `c = 1000ρw / M` | `c = 1000ρω/M` |
| variables | ρ(g/mL)；w 未强调小数 | ρ；ω（小数）；M；c |
| units | 仅 `c:mol/L` | 明确 ρ 用 g/cm³（或 g/mL）时乘 1000；若 ρ 用 g/L 则用 `c = ρω/M` |
| applicableConditions | 笼统 | ω 必须小数；ρ 与系数匹配 |
| examples | 笼统 | 浓硫酸数值例 ≈18.4 mol/L |
| commonMistakes | 仅密度单位 | 补 ω 百分数误用、g/L 仍乘 1000 等 |
| status | `pending_review` | 不变 |

### 3.3 钠与水反应（反应 id=1）

**修复原因**：氧化还原分析中氧化产物/还原产物字段对调。

反应：`2Na + 2H₂O = 2NaOH + H₂↑`  
- Na：0 → +1（失电子，被氧化）→ 还原剂 Na，**氧化产物 NaOH**  
- H（水中部分）：+1 → 0（得电子，被还原）→ 氧化剂 H₂O，**还原产物 H₂**

| 字段 | 修复前 | 修复后 | 是否改动 |
|------|--------|--------|----------|
| oxidant | H2O | H2O | 否（本已正确） |
| reductant | Na | Na | 否（本已正确） |
| ox_product | **H2** | **NaOH** | 是 |
| re_product | **NaOH** | **H2** | 是 |
| equation / canonical | 正确 | 正确 | 否 |
| status | published | published | 否 |

未改动电子转移原文（按原子计说明仍可接受）；未覆盖其他反应字段。

---

## 4. 影响范围

### 4.1 已修改

| 位置 | 说明 |
|------|------|
| MySQL `chem_knowledge_points` id=14 | description + review_note 追加 P0 标记 |
| MySQL `chem_formulas` id=7 | 表达式/变量/单位/条件/示例/易错/review_note |
| MySQL `chem_reactions` id=1 | 仅 ox_product、re_product |
| `docs/chemistry_batch2/import_B2-C.json` | 与库同步，避免再次导入旧错误 |
| `docs/chemistry_batch2/import_B2-D.json` | 同上 |
| `docs/chemistry_batch2/generate_batch2.js` | 生成器源文同步 |
| `db/migrate_chemistry_phase2.sql` | 种子 INSERT 中 ox/re 产物顺序纠正（防重跑迁移再现错误） |

### 4.2 引用检查结果

| 检查 | 结果 |
|------|------|
| 库内其他知识点含「质量数」 | **仅** id=14 一条 |
| 库内其他「密度换算/1000」公式 | **仅** id=7 一条 |
| 其他反应的 ox/re 字段 | 本次未改；钠与水仅 id=1 |
| 钠与水实验/示例题 | 现象与答案本身正确，**无**错误产物字段依赖，未改 |

### 4.3 未修改

- Batch3 及 batch4–6 清单与数据  
- 用户账号  
- 数据库表结构  
- 该三条记录的其他正确字段（方程式、氧化剂、还原剂等）

---

## 5. 化学规则校验结果

由 `p0_fix.js --apply` 写入后即时校验（`backup_after_p0_apply.json`）：

| 规则 | 结果 |
|------|------|
| 质量数使用 `A = Z + N` 等号表述 | 通过 |
| 不再出现「质量数≈」 | 通过 |
| 区分相对原子质量 | 通过 |
| 公式为 `c = 1000ρω/M` | 通过 |
| 条件强调 ω 为小数 | 通过 |
| 单位含 g/cm³ 与 g/L 分支 | 通过 |
| 氧化剂 H2O / 还原剂 Na | 通过 |
| 氧化产物 NaOH / 还原产物 H2 | 通过 |
| **allPass** | **true** |

补充手算校验（公式示例）：  
\(c = 1000 \times 1.84 \times 0.98 / 98 = 18.4\ \mathrm{mol/L}\)，与教材常见浓硫酸浓度数量级一致。

---

## 6. 状态声明

- 本修复纠正**明确化学事实错误**与**单位约定缺失**。  
- `kp.structure.atom`、`formula.rho_c_M` 仍为 `pending_review`，**不等于已经人工审核**。  
- 钠与水反应仍为 `published`（仅纠正对调字段）。

---

## 7. 完成说明

P0 三项已修复并备份可回滚。按要求：**到此停止**（不继续 Batch3，不处理 P1/P3）。
