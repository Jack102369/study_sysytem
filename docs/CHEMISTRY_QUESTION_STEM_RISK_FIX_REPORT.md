# 残缺题干风险处置报告

> 日期：2026-10-20  
> 授权范围：**仅**对逐题确认的 `CONFIRMED_BLOCK` 追加 `[trial_access:block]`  
> **未**改题干 / 选项 / 答案 / difficulty / 专项分类 / analysis / 知识关联 / 历史会话

---

## 一、检查范围

| 项 | 数量 |
|----|------|
| `question_risks.json` 残缺扫描清单 | **26**（逐题核验） |
| 额外指定复查（不重复计入 26） | ID **50 / 379 / 398 / 401** |
| 实际写库 block | **13** |

详细核验：`docs/chemistry_analysis_upgrade/batch2/stem_risk_review.json`

---

## 二、指定 ID 与 26 道重叠（不重复统计）

| ID | 是否在 26 道内 | 本次处置 |
|----|----------------|----------|
| **215** | **是** | 计入 26；分级 CONFIRMED_BLOCK → **已 block** |
| **250** | **是** | 计入 26；分级 CONFIRMED_BLOCK → **已 block** |
| **50** | **否** | 单独复查；NEEDS_VERIFICATION（解析 HOLD，题干未见残缺）→ **未 block** |
| **379** | **否** | 同上 → **未 block** |
| **398** | **否** | 同上 → **未 block** |
| **401** | **否** | 同上 → **未 block** |

26 道统计与 4 道 HOLD **互不重复加总**。

---

## 三、26 道最终分类

| 分级 | 数量 | 说明 |
|------|------|------|
| **CONFIRMED_BLOCK** | **13** | 题干为易错标签/碎片，无法独立可靠作答 → 已暂停试运行 |
| **FIXABLE** | **0** | （本批无「仅建议修、暂不 block」档；严重残缺直接 CB） |
| **FALSE_POSITIVE** | **13** | 扫描偏严：命题足够完整，可独立作答 → **保持 allow** |
| **NEEDS_VERIFICATION** | **0**（在 26 内） | — |

### 3.1 CONFIRMED_BLOCK（已 block）

| ID | 短语摘要 | 专项 |
|----|----------|------|
| 211 | 不判断过量 | calculation |
| 215 | V用溶剂体积 | ion（分类错挂，未改分类） |
| 220 | 用稀盐酸 | equation |
| 238 | 氧化剂与还原剂…对调 | equation |
| 242 | 与Fe2+颜色、沉淀颜色混淆 | ion |
| 246 | 两类盐性质混记 | ion |
| 250 | 递变顺序记反 | memory |
| 263 | 收集方法用错 | equation |
| 265 | 不加热就写放氨 | equation |
| 267 | NO与NO2颜色、转化条件混淆 | equation |
| 271 | 写错分解方程式计量数 | equation |
| 275 | 检验方法张冠李戴 | equation |
| 288 | 只配平原子个数 | redox |

### 3.2 FALSE_POSITIVE（未 block）

207, 213, 218, 222, 240, 244, 248, 259, 269, 273, 291, 293, 295  

示例：用石灰水检验 CO；任何温度压强都套 22.4；干燥 Cl₂ 当成漂白；Fe²⁺+KSCN 报阳性等——完整或足够完整的错误命题，可判「错误」。

### 3.3 额外 4 道 HOLD → NEEDS_VERIFICATION

题干本身未见残缺；问题在 Batch2 解析模板错位。本次**不因解析 HOLD 自动 block**。后续优先重写 analysis，或另批核实题干/答案科学性。

---

## 四、写库结果（准入）

| 项 | 结果 |
|----|------|
| 计划 block | 13 |
| 实际 BLOCKED | **13** |
| 冲突跳过 | **0** |
| 已有 block 保留 | 0（本批均无既有 block） |
| 修改字段 | 仅 `gate_note`（追加 `[trial_access:block]` + `[stem_risk:confirmed_block_20261020]`） |
| 原 `[trial_access:allow]` 等标记 | **保留**（eligibility 以 block 为准） |

备份：`docs/chemistry_analysis_upgrade/batch2/stem_risk_block_backup/`  
结果：`stem_risk_apply_summary.json` / `apply_result.json`

---

## 五、116 道 analysis 白名单交叉

| 项 | 结果 |
|----|------|
| 交叉 ID | **无** |
| 白名单 | 仍为 **116** |
| 备份 / 干跑 | **未改**（无交叉） |
| 本批 analysis UPDATE | **未执行** |

---

## 六、执行后验证

| 检查 | 结果 |
|------|------|
| block 题仍可进入试运行候选 | **0** |
| FALSE_POSITIVE 仍可训 | **13/13** |
| 提高/挑战候选含 block 题 | **0** |
| 每日候选含 block 题 | **0** |
| 正式池 | **0**（不变） |
| 题库总记录 | **638**（不变） |
| 可训练（test approved active 非 block） | **634 → 621**（−13） |
| 每日 cand 约 | **574 → 561**（−13） |
| s60 | **60** |
| session / session_items 行数 | sessions 39 / items **199**（历史未删） |
| 题干/答案/analysis | **未改** |

机制：`ChemTrainEligibilityService` 对 test 池命中 `[trial_access:block]` 即排除；专项 / 每日 / advanced 抽题均走该准入。

---

## 七、回滚方案

```bash
node docs/chemistry_analysis_upgrade/batch2/stem_risk_review_and_block.js --rollback
```

行为：

- 仅处理带 `[stem_risk:confirmed_block_20261020]` 的题
- 优先按备份 `gate_note` 原值校验恢复
- 若 gate 相对备份已变化：只剥离本次两个标记，**不覆盖**他人后续准入改动
- **不**改题干/答案/analysis

---

## 八、后续建议（待另次确认）

1. **CONFIRMED_BLOCK×13**：从来源「易错」扩成完整错误命题 → 人工验收后再去掉 block（可同时纠 215 专项挂错）
2. **FALSE_POSITIVE×13**：可选润色题干，非必须
3. **HOLD×4（50/379/398/401）**：重写 analysis 或科学复核；勿与残缺题干混批
4. **第二批 analysis**：白名单仍 **116**，待你单独确认后再 UPDATE

---

## 九、脚本索引

| 文件 | 用途 |
|------|------|
| `batch2/stem_risk_review_and_block.js` | 核验 / `--apply` / `--rollback` |
| `batch2/stem_risk_review.json` | 逐题分级全文 |
| `batch2/stem_risk_block_backup/` | 写库前备份 + apply/rollback 结果 |
