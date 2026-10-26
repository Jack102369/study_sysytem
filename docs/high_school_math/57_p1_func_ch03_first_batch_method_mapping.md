# P1-FUNC · 第三章首批 12 题方法关联验收

> **授权**：用户明确授权核实 12 候选题并经管理员 API 写入方法关联  
> **库**：`study_system` @ `127.0.0.1`  
> **执行时间**：基线/写入 `2026-10-25T11:37:26+08:00`～`11:37:28+08:00`  
> **结果**：**PASS**（方法关联）；**未**审核 passed、**未** approve  
> **4B**：仍 **BLOCKED**  
> **API**：`PUT /hs-math/admin/train-items/:id/methods` + `expectedContentVersion`  
> 快照：`db/backups/_ch03_method_map_20261025.json`

---

## 1. 数据库基线（实时 SELECT）

| 指标 | 值 |
|---|---|
| DATABASE() | `study_system` |
| items | **110** |
| status | draft **105** / disabled **5** / approved **0** |
| methods | **11** |
| item_methods | **0** |
| reviews | **0** |

---

## 2. 12 题核实

全部 **12/12 存在**；`specialty=rja-ch3`；`category=3.2`；`status=draft`；`pool=formal`。

| code | id | qtype | diff | cv前 | 主 KP（库） | 数学 | 来源 | 门禁标签 |
|---|---:|---|---:|---:|---|---|---|---|
| PARITY-0001 | 109 | single | 1 | 1 | rja.3.2.09 | OK | original/unverified/unknown | READY_FOR_HUMAN_REVIEW |
| PARITY-0002 | 110 | judge | 1 | 1 | rja.3.2.09 | OK | 同上 | READY_FOR_HUMAN_REVIEW |
| PARITY-0005 | 113 | single | 1 | 1 | rja.3.2.10 | OK | 同上 | READY_FOR_HUMAN_REVIEW |
| PARITY-0006 | 114 | single | 1 | 1 | rja.3.2.09 | OK | 同上 | READY_FOR_HUMAN_REVIEW |
| PARITY-0007 | 115 | judge | 1 | 1 | rja.3.2.09 | OK | 同上 | READY_FOR_HUMAN_REVIEW |
| PARITY-0010 | 118 | single | 1 | 1 | rja.3.2.10 | OK | 同上 | READY_FOR_HUMAN_REVIEW |
| PARITY-0011 | 119 | single | 1 | 1 | rja.3.2.10 | OK | 同上 | READY_FOR_HUMAN_REVIEW |
| PARITY-0012 | 120 | multi | 2 | 1 | rja.3.2.11 | OK（A,B,C） | 同上 | READY_FOR_HUMAN_REVIEW |
| PARITY-0015 | 123 | numeric | 1 | 1 | rja.3.2.12 | OK（-5） | 同上 | READY_FOR_HUMAN_REVIEW |
| PARITY-0019 | 127 | single | 1 | 1 | rja.3.2.11 | OK | 同上 | READY_FOR_HUMAN_REVIEW |
| PARITY-0020 | 128 | single | 1 | **2** | rja.3.2.11 | OK | 同上 | READY_FOR_HUMAN_REVIEW |
| PARITY-0025 | 133 | single | 1 | **2** | rja.3.2.10 | OK | 同上 | READY_FOR_HUMAN_REVIEW |

说明：0020/0025 写入前 `content_version` 已为 2（历史 DIFF 等升版遗留），本轮再 +1→3。

### 数学正确性

对答案与权威源核对（含定义域对称、f(-x) 关系、0012 多选完整性、判断题真假、0015 数值唯一性）：**无 NEEDS_FIX**。

### 来源与许可证

- 12 题均为默认 `original` + `unverified` + `unknown`。  
- 按 `assertSourceAllowsFormalPublish`：**不构成 SOURCE_BLOCKED**。  
- **诚信风险**：默认元数据 ≠ 已核实原创；人工审核时应显式确认（本轮**未**改来源字段）。

---

## 3. 方法关联（API 写入）

仅使用 `is_active=1` 的正式 11 方法；未用 `undetermined_coeff` / `substitution`（本批不适用）。

| code | HTTP | cv | 主方法 | 辅方法 | 理由 |
|---|---:|---|---|---|---|
| 0001 | 200 | 1→2 | defn | — | 偶函数定义辨析 |
| 0002 | 200 | 1→2 | defn | domain_symmetry | 否定缺定义域前提 |
| 0005 | 200 | 1→2 | defn | domain_symmetry | 先对称再验证 |
| 0006 | 200 | 1→2 | domain_symmetry | — | {1} 不对称 |
| 0007 | 200 | 1→2 | domain_symmetry | — | R\{0} 对称前提 |
| 0010 | 200 | 1→2 | defn | — | 定义验偶 |
| 0011 | 200 | 1→2 | defn | — | 定义验奇 |
| 0012 | 200 | 1→2 | defn | special_value | 零函数既奇又偶 |
| 0015 | 200 | 1→2 | parity_apply | — | 奇函数求值 |
| 0019 | 200 | 1→2 | graph_symmetry | num_shape | 偶函数 y 轴对称 |
| 0020 | 200 | 2→3 | graph_symmetry | — | 奇函数原点对称点 |
| 0025 | 200 | 2→3 | parity_apply | — | 偶函数延拓求值 |

- 成功关联题目：**12**  
- 方法关联行数：**16**（无重复、无禁用方法）  
- 409：**无**  
- 绕过业务规则：**无**（走 admin PUT + 乐观版本）

---

## 4. 写入后验证

| 检查 | 结果 |
|---|---|
| items | **110** 不变 |
| approved | **0** 不变 |
| reviews | **0** 不变 |
| methods | **11** 不变 |
| item_methods | 0 → **16** |
| 非目标题 status/cv/关联 | **未变化** |
| 题干/答案/解析/来源字段 | **未改**（本轮仅 methods） |

---

## 5. 审核准备标签汇总

| 标签 | 数量 |
|---|---:|
| READY_FOR_HUMAN_REVIEW | **12** |
| NEEDS_FIX | **0** |
| SOURCE_BLOCKED | **0** |
| QUALITY_BLOCKED | **0** |

**具备进入人工审核条件：是**（方法已贴、数学抽检通过、仍为 draft、reviews=0）。  
**不等于**审核已通过或可自动 approve。审核人须处理来源未显式核实风险。

---

## 6. 未解决问题 / 下一步（须另授权）

1. 管理员在审核台对 12 题显式确认来源（可选升 `verified`/`permitted`——会再升版）。  
2. 真实人工审核 **passed**（本轮禁止）。  
3. 另授权最小集 **approve** 打通学生池。  
4. 3.1/3.3 正式题仍缺，全章闭环后续另开。

**未执行**：passed、approve、改题面、改来源、CORE-1B。
