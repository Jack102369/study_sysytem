# P1-FUNC · 第三章方法词典正式种子验收

> **授权**：用户明确授权执行 `db/seed_hs_math_methods.sql`（仅 `hs_math_methods`）  
> **库**：`study_system` · 主机 `127.0.0.1`（本地）  
> **执行时间**：`2026-10-25T11:31:03+08:00`（基线/写入）· 复验 `2026-10-25T11:31:37+08:00`  
> **结果**：**PASS**  
> **未做**：题目改动、方法关联、审核 passed、正式 approve、迁移、业务代码、重启、CORE-1B  
> **4B**：仍 **BLOCKED**（本验收不改判）

---

## 1. 执行前检查

| 检查 | 结果 |
|---|---|
| `DATABASE()` | `study_system` |
| 主机 | `127.0.0.1`（非生产远程） |
| 表 `hs_math_methods` | 存在 |
| 唯一索引 `uk_hs_math_method_code` | 存在 |
| SQL 仅 `INSERT INTO hs_math_methods` | PASS |
| 无 `REPLACE` / `ON DUPLICATE KEY UPDATE` / `UPDATE` / `DELETE`（可执行段） | PASS |
| 幂等 `WHERE NOT EXISTS (同 code)` | PASS |

---

## 2. 入库前基线（实时 SELECT）

| 指标 | 值 |
|---|---|
| 查询时间 | `2026-10-25T11:31:03+08:00` |
| 方法数量 | **0** |
| 目标 11 code 已存在 | **0** |
| `hs_math_train_item_methods` | **0** |
| `hs_math_train_items` | **110** |
| status | draft **105** / disabled **5** / approved **0** |
| `hs_math_train_item_reviews` | **0** |

---

## 3. 执行

| 项 | 值 |
|---|---|
| 脚本 | `db/seed_hs_math_methods.sql` |
| 事务 | `BEGIN` → `INSERT…SELECT…WHERE NOT EXISTS` → `COMMIT` |
| `affected_rows`（首次） | **11** |
| 回滚 | **否** |
| 错误 | 无 |

原始运行快照（本地）：`db/backups/_methods_seed_run_20261025.json`（含口令外的计数与 code 列表）。

---

## 4. 入库后验证

| 检查 | 结果 |
|---|---|
| 方法总数 | **11** |
| 11 目标 code 全部存在 | **PASS** |
| code 唯一 / 无重复 | **PASS** |
| 名称与种子一致 | **PASS**（定义法…换元法） |
| `is_active=1` | **PASS** |
| 方法关联数 | **0**（不变） |
| 题目总数 | **110**（不变） |
| status 分布 | 105/5/0（不变） |
| reviews | **0**（不变） |
| approved | **0**（不变） |

### 11 code 核对

| code | name | sort | active |
|---|---|---:|---:|
| defn | 定义法 | 10 | 1 |
| domain_symmetry | 定义域对称检验 | 20 | 1 |
| special_value | 特殊值法 | 30 | 1 |
| graph_symmetry | 图象对称分析 | 40 | 1 |
| num_shape | 数形结合 | 50 | 1 |
| classification | 分类讨论 | 60 | 1 |
| mono_analysis | 单调性分析 | 70 | 1 |
| parity_apply | 奇偶性应用 | 80 | 1 |
| equiv_transform | 等价转化 | 90 | 1 |
| undetermined_coeff | 待定系数法 | 100 | 1 |
| substitution | 换元法 | 110 | 1 |

---

## 5. 幂等验证

| 项 | 值 |
|---|---|
| 第二次执行同一 INSERT | `affected_rows=0` |
| 方法数仍为 11 | PASS |
| 题目/关联/审核/批准 | 仍不变 |

---

## 6. 前后对比摘要

| 指标 | 前 | 后 |
|---|---:|---:|
| methods | 0 | **11** |
| 新增 | — | **11** |
| 已存在跳过 | — | **0** |
| item_methods | 0 | 0 |
| items | 110 | 110 |
| reviews | 0 | 0 |
| approved | 0 | 0 |

---

## 7. 最终结论

**PASS**：11 个正式方法已写入 `study_system.hs_math_methods`。

**不等于**：

- 第三章学习闭环完成  
- 题目已贴方法 / 已审核 / 已批准  
- CORE-1A-4B PASS  

---

## 8. 下一步（须另授权）

1. 只读 SELECT 核实首批 12 题 id/source。  
2. 来源显式确认 + 方法关联（可能升 `content_version`）。  
3. 真实人工审核 passed。  
4. 另授权最小集正式批准。
