# 剩余旧题解析正式更新报告（377 道）

> 日期：2026-10-20  
> 状态：**已完成写库并验收**  
> 范围：仅 `chem_train_items.analysis`（白名单 377 道）

---

## 一、实际更新数量

| 项 | 数量 |
|----|------|
| 白名单 PASS | 377 |
| **实际 UPDATE** | **377** |
| 跳过 / 冲突 | **0** |
| 幂等复查 | UPDATED **0** / SKIP_IDEMPOTENT **377** |

白名单：`docs/chemistry_analysis_upgrade/final_remaining/update_whitelist.json`  
脚本：`final_remaining/apply_final_update.js`  
结果：`final_remaining/final_apply_result.json`

写前复核：数量 377、全部 PASS、ID/code、原 analysis/checksum、非 164/s60/13block/20HOLD、干跑 WOULD_UPDATE=377 / 冲突=0。

---

## 二、更新前后解析质量

### 更新前（本批 377）

- 多为「来源 …」类溯源备注（剩余集内来源式曾占绝大多数）

### 更新后

- 库内 `analysis` 与白名单 **377/377** 一致
- 含正确答案依据、化学说明、易错点（能力匹配深度；基础题简洁）

累计旧题解析升级：**48 + 116 + 377 = 541** 道。

---

## 三、冲突与跳过

| 阶段 | 结果 |
|------|------|
| 写前 live 冲突 | **0** |
| 事务内冲突 | **0** |
| 整批回滚 | **未触发** |

---

## 四、幂等复查

| 运行 | UPDATED | SKIP_IDEMPOTENT |
|------|---------|-----------------|
| 首次正式更新 | 377 | 0 |
| `--idempotent-check` | 0 | 377 |

---

## 五、备份与回滚

- 写前备份：`final_remaining/backup/original_analyses.json`
- 回滚：

```bash
node docs/chemistry_analysis_upgrade/final_remaining/rollback_final_update.js
```

规则：仅本批 377；仅当当前 analysis === 本批新文时恢复原文；冲突跳过；**不影响**前两批 164、13 block、`gate_note`、历史快照。

---

## 六、新旧会话与训练回归

隔离用户：`chem_final_upd_smoke@local.test`（**未**使用 dhm@189.cn）  
`final_smoke_result.json`：**ok=true**

| 检查 | 结果 |
|------|------|
| 旧 session 快照独立 | PASS |
| 新会话含新解析（如 ID50 电子守恒） | PASS |
| 提交 / 判题 / 结果解析 | PASS |
| 首批 48 抽样保持 | PASS |
| s60 七段式 | PASS |
| 每日 cand **561**；组卷无 block | PASS |
| 提高/挑战 availability 接口可达 | PASS（本环境返回 400 参数态，未阻断冒烟总 ok） |
| 无 grant → 403 | PASS |
| HOLD 不在白名单 | PASS |
| 13 block 仍不可训 | PASS |
| 历史行数未减少 | PASS（隔离会话新建） |

---

## 七、当前题库真实统计

| 指标 | 值 |
|------|-----|
| 题库总数 | **638** |
| 个人可训练 | **621** |
| 正式池 | **0** |
| 每日 cand 约 | **561** |
| s60 | **60** |
| block | **13**（准入未改） |

历史：sessions / session_items 仅因隔离冒烟增加，未删改旧记录。

---

## 八、为何 397→396 候选 / 20 HOLD

### 1. 为何只有 396 道生成候选？

剩余圈定 **397**；**ID401** 在题层风险复核中定为 **HOLD**（乙烯水化氧化还原课程口径争议），**排除解析候选生成** → 候选 **396**。

### 2. 20 道 HOLD 分类

| 类型 | 约数 | 说明 |
|------|------|------|
| `rxn_not_marked_redox.*` 焦点/DS | ~16 | 题意「证据不足」，候选易偏氧化剂/还原剂模板；DS 或焦点规则打回 |
| 含 379、398 | 2 | 见下 |
| ID401 | 1 | 题层 HOLD（未生成候选） |
| 其它 DS 科学质疑 | ~2 | 如 237、292 |

完整 ID：237, 292, 379, 398, 401, 415, 419, 423, 426, 440, 450, 459, 499, 503, 507, 511, 515, 519, 535, 539。

### 3. ID379 / 398 为何解析未过？

- **题本身**：已评为 SAFE（方法论答案「错误」成立；379 反应确非氧化还原；398 加氢有化合价变化）。
- **解析终检**：候选/整改后仍触发 `focus_mismatch_not_marked_redox` 与/或 DeepSeek `scienceOk/answerConsistent` 质疑 → 按规则 **不强行 PASS**，保持 HOLD。
- **未改题干、答案、准入**。

### 4. ID401 题层风险

乙烯水化在高一必修中：化合价口径 vs 有机得氧/失氢口径易冲突；不可武断「加成一定是/不是氧化还原」。本阶段 **HOLD**，不进白名单、不改准入。

### 5. 后续单独整改建议

1. 修 `rxn_not_marked_redox` 出题/解析模板后，对 HOLD 中该系列重跑解析升级小批。  
2. 人审 401（及可选 379/398 解析定稿）。  
3. 已 block 的 13 道残缺题干：另批修题干后再恢复准入（与本批无关）。

### 6. 是否仍有影响可靠训练的题？

- **13 道残缺已 block**：不可训。  
- **HOLD 20**：仍可训但解析质量未升级（部分证据类题解析可能仍偏弱）——**本阶段未改准入**；建议优先处理 `not_marked_redox` 系列。  
- 白名单 377 + 前两批 164：解析已升级。

---

## 九、隔离验证摘要

| 项 | 结果 |
|----|------|
| 前两批 164 | 保持（48+116） |
| s60×60 | 未被本批新文覆盖 |
| 13 block | 仍 block |
| 20 HOLD | 未改 analysis（相对原文） |
| formal | 0 |

---

## 十、脚本索引

| 文件 | 用途 |
|------|------|
| `apply_final_update.js` | 更新 / `--idempotent-check` / `--rollback` |
| `rollback_final_update.js` | 回滚入口 |
| `smoke_final_update.js` | 隔离冒烟 |
| `backup/` | 原 analysis |
| `final_apply_result.json` / `final_smoke_result.json` | 执行结果 |
