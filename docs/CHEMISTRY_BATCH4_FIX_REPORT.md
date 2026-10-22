# 高一化学知识库 · Batch4 质量整改报告

> 依据：`docs/CHEMISTRY_BATCH4_QUALITY_REPORT.md`  
> 整改日期：2026-10-18  
> **AI 自动校验 ≠ 人工审核。** 74 条仍为 `pending_review`；本报告不宣称已经人工审核。  
> **未进入 Batch5；未开发专项训练功能。**

---

## 1. 整改前问题统计（来自质量报告）

| 项 | 数量 |
|----|------|
| 审查条数 | 74 |
| 通过 / 需要修改 / 待核实 | 66 / 5 / 3 |
| P0 / P1 / P2 / P3（按条主等级） | 0 / 2 / 13 / 15 |
| 非氧化还原误挂 `redox` | 5 |

---

## 2. 执行摘要

| 项 | 结果 |
|----|------|
| 备份 | `docs/chemistry_batch4_quality_fix/backup_before_b4_remediate_apply.json` + 导入包/清单快照 |
| DB 更新行数 | **74**（仅 Batch4 `pending_review`，全量同步导入包字段 + 专项关联） |
| 有意内容/专项修复编码 | **15**（见下） |
| 同步导入包 | 已重生成 `import_B4-A/B/C/D.json` |
| 清单总量 | **377** 未变；Batch4 **74** 未删未增 |
| 5 条错误 redox 专项 | **全部已修复**（DB + inventory + 导入包） |
| 复查通过 / 需改 / 待核实 | **71 / 0 / 3** |
| 剩余问题等级（仅非通过项） | P0=0，P1=1，P2=2，P3=0 |
| 阻止正式发布 | **是** |
| 可进入 Batch5 建设 | **是**（无阻碍下一批的 P0/专项错池） |
| 允许正式发布 | **否** |

---

## 3. 实际修复的知识编码（15）

### 3.1 五条专项关联错误（必须修）— 已全部修复

| 编码 | 价态核对结论 | specialty 修改前 → 后 | 保留/补充专项 |
|------|--------------|----------------------|---------------|
| `rxn.SO3_H2O` | S(+6)/O(−2)/H(+1) 无变价 | 去 `redox`/`redox.identify` | equation + substance |
| `rxn.NH3_HCl` | N(−3)/H(+1)/Cl(−1) 无变价 | 去 redox | equation + substance |
| `rxn.CO2_CaOH2` | 无变价 | 去 redox；加 `ion`/`ion.ionic_write` | equation + substance + ion（已有离子式） |
| `rxn.SiO2_2NaOH` | 无变价 | 去 redox | equation + substance（不解离子默认） |
| `rxn.CaCO3_2HCl` | 无变价 | 去 redox；加 ion | equation + substance + ion（已有离子式） |

内容层原本已 `non-redox`、ox/re 为空、`trainTypes` 无 `redox.identify`；错误在清单与 DB 实体专项链接。

### 3.2 其它有意修复（10）

| 编码 | 处理 |
|------|------|
| `rxn.Cl2_2NaOH` | **P1**：conditions/principle 显式「仅冷稀碱；热浓碱另产物禁混用」 |
| `sub.Cl2` | 补冷稀碱/热浓碱与漂白粉链路 |
| `sub.HCl_aq` | canonical 改为 HCl；补硝酸酸化检 Cl⁻ |
| `rxn.CO2_CaOH2` | 适量/过量分条件钉死 |
| `rxn.H2_Cl2` | 备注化合反应 ox/re 同产物 + 安全 |
| `rxn.Cu_4HNO3` | 展示名强调 3Cu+8HNO₃；防编码误导 |
| `sub.Br2` / `sub.I2` | 强化默认训练限制备注 |
| `sub.P` / `sub.P4O10` / `sub.bleaching_powder` | 规范可确认表述 + **仍待核实** + 训练限制 |

另：DB 对全部 74 条做了导入包字段同步（防旧包回写），不等于 74 条都有科学错误。

---

## 4. P1 处理结果（整改前 2 项）

| 编码 | 问题 | 处理 | 结果 |
|------|------|------|------|
| `rxn.Cl2_2NaOH` | 未显式禁热浓碱混用，自动组卷高风险 | 已改 conditions/principle/reviewNote | **已修复**；组卷仍须带冷/稀条件（提示级） |
| `sub.bleaching_powder` | 教材成分口径争议 | 强化「混合物 + 有效成分常写 Ca(ClO)₂」；禁精确组成绝对填空；**不拍板教材** | **仍待核实（P1）** |

---

## 5. P2 处理结果（整改前 13）

| 策略 | 编码示例 |
|------|----------|
| 已修可明确项 | `rxn.SO3_H2O` 等 5 条 specialty；`rxn.CO2_CaOH2` 过量条件；`sub.Cl2` 碱条件 |
| 保留待核实 | `sub.P`、`sub.P4O10`、`sub.bleaching_powder` |
| 保留范围/训练限制（不删知识） | `sub.Br2`/`I2`、`rxn.2SO2_O2`、`rxn.N2_3H2`、`kp.halogen.compare`、`kp.N.synth_ammonia` |

未对教材版本差异强行二选一。

---

## 6. P3 处理结果（整改前 15）

| 策略 | 说明 |
|------|------|
| 已做低风险修正 | `sub.HCl_aq`、`rxn.Cu_4HNO3` 展示名、`rxn.H2_Cl2` 备注等 |
| 保留未改 | 实验条目边界略宽、部分了解级展示优化等——原内容准确，避免为改而改引入新错 |

---

## 7. Batch4 全部反应氧化还原关联复查

对 25 条反应做 inventory specialty ↔ content tags 交叉：

- 整改前 mismatch：**5**（即上表）  
- 整改后 mismatch：**0**  
- DB `chem_entity_specialties`：五条均无 `redox`  
- 其它氧化还原反应（Cl₂ 歧化、浓稀硝酸/硫酸、合成氨等）保留 `redox`，与变价一致  
- `rxn.NH4Cl_NaOH` 本就非 redox，未误改  

**未扫描/未修改 Batch2、Batch3。**

---

## 8. 三条待核实知识

### `sub.P`

| 项 | 说明 |
|----|------|
| 可确认 | 白磷剧毒易燃须水封；禁学生操作；同素异形体对比存在 |
| 待核实 | 自燃条件细节、白磷/红磷对比表以所用教材为准 |
| 层级 | 了解/拓展对比为主；已限默认细对比绝对题 |
| 训练 | 禁白磷操作题 |

### `sub.P4O10`

| 项 | 说明 |
|----|------|
| 可确认 | 磷燃烧产物；酸性氧化物；与水生成磷酸；P₄O₁₀ 为常见分子式，P₂O₅ 多为经验式/教材简写 |
| 待核实 | 所用教材主写法 |
| 训练 | 题干须指定写法；禁混同绝对填空 |

### `sub.bleaching_powder`

| 项 | 说明 |
|----|------|
| 可确认 | 氯气与石灰乳制得；工业产品为**混合物**；有效成分常表述为 Ca(ClO)₂ |
| 待核实 | 教材对「主要成分」的精确措辞 |
| 训练 | 禁精确组成绝对填空；了解级认知可保留 |

**三者均未标记为人审通过。**

---

## 9. 其它仍待核实 / 自动出题限制

| 主题 | 限制建议 |
|------|----------|
| Cl₂ 与碱 | 必须给冷/稀；禁无条件填空 |
| 漂白粉组成 | 待核实前禁精确组成绝对题 |
| P₄O₁₀/P₂O₅ | 题干指定写法 |
| 合成氨 / SO₂ 催化氧化 | 禁选修平衡定量默认题 |
| 浓稀硝酸/硫酸 | 必须标明浓稀与是否加热 |
| Cl₂/氮氧化物实验 | 禁学生操作类自动题 |
| CO₂ 过量石灰水 | 适量/过量分题 |
| 卤族含氧酸深度 | 排除默认核心池 |

---

## 10. 数据库与导入包

| 项 | 结果 |
|----|------|
| DB 修改 | 74 行内容字段更新 + 74 组 specialty/category 链接重写 |
| 状态 | 全部仍为 `pending_review`（未改为 published） |
| 存在性 | 74/74；无重复编码；未删知识 |
| 导入包 | `import_B4-*.json` 已与 `batch4_content.js` + 新 inventory specialty 一致 |
| 一致性 | 五条 specialty 包/库/清单一致（无 redox） |

---

## 11. 备份与回滚

| 文件 | 用途 |
|------|------|
| `docs/chemistry_batch4_quality_fix/backup_before_b4_remediate_apply.json` | DB 行 + 原链接 |
| `backup_pre_import_B4-*.json` / `backup_pre_batch4_content.js` | 导入包与内容源 |
| `backup_inventory_specialty_before.json` | 专项快照 |
| `b4_remediate.js` | 应用脚本（可对照备份手写回滚） |

回滚思路：用 backup JSON 中 `before` 写回对应表；链接用 `links` 字段恢复。

---

## 12. 整改后 74 条复查统计（AI，≠人审）

| 结论 | 数量 |
|------|------|
| 通过（自动检查） | **71** |
| 需要修改 | **0** |
| 待教材核实 | **3** |
| **合计** | **74** |

| 剩余问题主等级（仅待核实/需改） | 数量 |
|------|------|
| P0 | **0** |
| P1 | **1**（bleaching_powder 口径） |
| P2 | **2**（P、P4O10） |
| P3 | **0** |

是否存在未解决严重化学错误（P0）：**否**  
是否允许进入 Batch5：**是**  
是否允许正式发布：**否**（pending_review + 待核实 + 非人审）

复查文件：`docs/chemistry_batch4_quality_fix/b4_recheck_result.json`

---

## 13. 运维文件

| 文件 | 作用 |
|------|------|
| `docs/chemistry_batch4/batch4_content.js` | 内容源（已改） |
| `docs/chemistry_batch4/import_B4-*.json` | 重生成 |
| `docs/chemistry_kb_inventory.json` | specialty 修正；总量 377 |
| `docs/chemistry_batch4_quality_fix/*` | 备份、脚本、复查 |
| `docs/CHEMISTRY_AI_CONTEXT.md` | 进度 |

---

## 14. 停止点

Batch4 质量整改完成并停止。  
**不要**将本报告视为人工审核通过或正式发布许可。  
等待下一步指令再进入 Batch5 或教材定点核实。
