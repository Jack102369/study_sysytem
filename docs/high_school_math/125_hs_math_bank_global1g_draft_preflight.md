# HS-MATH-BANK-GLOBAL-1G-PREFLIGHT — 首批 100 道 draft 入库前预检

> 日期：2026-10-26  
> **最终状态：`PREFLIGHT_PASS`**  
> 前置：GLOBAL-1F-FIX = `QUALITY_PASS`  
> **本阶段：只读 MySQL；无 INSERT/UPDATE/DELETE；无 draft 实写；无 git commit/push**

---

## 1. 结论摘要

| 项 | 结果 |
|----|------|
| `code` 唯一约束 | **有**：`uk_hs_math_train_item_code`（实测） |
| 候选 `CAND-G1B-*` 撞库 | **0** |
| KP / method / specialty / category | 缺 **0**；KP↔specialty 错配 **0** |
| 与 formal 可抽题 stem 撞库 | **0** |
| draft 隔离（学生抽题） | **可证明**：抽题强制 `status=approved` + `is_active=1` |
| 导入路径写入态 | **`pool=formal` + `status=draft`**（非 `pool=draft`；与现网协议一致） |
| 候选→导入协议 | **须确定性适配器**（字段形状转换；不改 schema/业务代码即可） |
| 适配器干跑 | **100/100** 可生成合法 `answerPayload` / options / rubric |
| 幂等 | DB 唯一键 + 导入 confirm 全量内容指纹比对 |
| **是否可授权正式 draft 入库** | **可以**（下一阶段 GLOBAL-1G；须走 preview→confirm，强制适配器） |

---

## 2. 现网入库路径（代码证据）

| 组件 | 路径 | 要点 |
|------|------|------|
| 预览/确认 | `HsMathAdminTrainItemsImportService` | preview 签发 token；confirm 事务写入 |
| 结构校验 | `train-item-import.validate.ts` | 禁传 `status`/`contentVersion`；`pool` 仅 formal 或不传 |
| 答案协议 | `answer-payload.validate.ts` + `application-rubric.validate.ts` | 含 application；numeric 禁科学计数法 |
| 实体/表 | `HsMathTrainItem` / `hs_math_train_items` | `UNIQUE(code)` |
| 抽题 | `HsMathTrainService` | `status: 'approved'`, `isActive: true`；不足不凑 draft |
| 批准 | `publishWithHumanReviewGate` | 须人工 review 指纹匹配 + `confirmPublish`；导入**不**写 review |

导入 confirm 落库硬编码（摘录逻辑）：

- `pool: 'formal'`
- `status: 'draft'`
- `isActive: true`
- `contentVersion: 1`
- **不**创建 `hs_math_train_item_reviews` 行  
→ 无法复用旧审核指纹；无法直接 approved。

单批上限：`HS_MATH_IMPORT_MAX_ITEMS = 100`（本批刚好满额）。

---

## 3. 字段映射（候选 → 导入协议 → 表列）

候选源：`question_bank/candidates-g1b-100.mjs`（扁平字段）。  
导入协议：`HsMathImportItem`（运行时按 `HS_MATH_QTYPES` 校验；DTO `items: unknown[]`）。

| 候选字段 | 导入 JSON | DB 列 / 关联 | 备注 |
|----------|-----------|--------------|------|
| `id` | `code` | `code` | 须匹配 `^[A-Za-z][A-Za-z0-9._-]{1,62}$`；本批 `CAND-G1B-001`…`100` 合法且唯一 |
| `specialtyCode` | `specialtyCode` | → `specialty_id` | 10 章 specialty 均 active |
| `sectionCode` | `categoryCode` | → `category_id` | 例 `1.1`；与 specialty 成对解析；本批 100 对均命中 |
| `kpCode` | `knowledgePointCodes[]` + `primaryKnowledgePointCode` | `knowledge_point_id` + `hs_math_train_item_kps` | 仅主 KP；无辅 KP；库内 100/100 active |
| `methodMain`(/`methodAux`) | `methodCodes[]` + `primaryMethodCode` | `hs_math_train_item_methods` | 11 正式方法均 active |
| `qtype` | `qtype` | `qtype` | 含 **application×24**；运行时支持 |
| `difficulty` | `difficulty` | `difficulty` | 1\|2\|3 |
| `stem` | `stem` | `stem` | 非空 |
| `options` 字典 | `options.options[{id,text}]` | `options_json` | single/multi 必转换 |
| `answer` 扁平 | `answerPayload`（见下） | `answer_payload_json` | **禁止**直接塞字符串 |
| `analysis` | `analysis` | `analysis` | 必填 |
| `sourceType` | `sourceType` | `source_type` | 本批全 `original` |
| `sourceEvidence` | `sourceReference`（建议） | `source_reference` | persist 允许 original+unverified+unknown |
| — | （不传） | `source_verification_status` 默认 unverified | |
| — | （不传） | `source_license_status` 默认 unknown | |
| — | **禁止传** | `status` | 服务端强制 draft |
| — | pool 省略或 `formal` | `pool` | 服务端写 `formal` |
| `maxScore`+`rubric` | application `answerPayload` | 同左 JSON | 见 3.1 |

### 3.1 答案形状（强制适配）

| qtype | 候选 | 导入 `answerPayload` |
|-------|------|----------------------|
| single | `answer:"B"` + `{A:..}` | `{kind:'single', optionId:'B'}` + options 数组 |
| multi | `answer:"A,B,C"` | `{kind:'multi', optionIds:['A','B','C']}` |
| judge | `answer:"true"\|"false"` | `{kind:'judge', value: true\|false}`（**boolean**） |
| numeric | `answer:"4"` | `{kind:'numeric', value:'4', toleranceAbs:0, toleranceRel:0}` |
| application | `answer` 文案 + `rubric[].score/criterion` | `{kind:'application', standardAnswer, maxScore, rubric:[{key,title,maxScore,criteria}]}` |

**Rubric 字段改名**：`score`→`maxScore`，`criterion`→`criteria`；合计必须等于 `maxScore`。  
预检干跑：application 24 题适配后合计全 PASS。

### 3.2 非入库元数据（不写 MySQL）

`mathVerified` / `reviewReady` / `blockReasons` / `dedupNote` / `mathCheck` / `book` / `chapterNo` / `kpName` / `sectionName` — 仅文档/质检用。

---

## 4. 数据安全核查（只读实测）

| # | 检查 | 实测 |
|---|------|------|
| 1 | 候选编号唯一 | **100/100** |
| 2 | DB 无相同 code | `CAND-G1B-%` 命中 **0**；精确 IN 列表 **0** |
| 3 | 正文高度重复 | vs formal+approved+active：**0**；批内 stem 归一化相同：**037↔074**（题干均为「正确的是（多选）」，选项不同）→ 导入仅 **warning** `BATCH_STEM_DUP`，非 error |
| 4 | KP 合法 | 缺 0；inactive 0；specialty 对齐 0 错 |
| 5 | method 合法 | 缺 0 |
| 6 | application rubric | 候选侧和分 OK；适配后协议字段 OK |
| 7 | numeric 协议 | 19 题答案均匹配 numeric value 正则 |
| 8 | 来源门禁（persist） | original 可入库；批准另需人工 review（本阶段不批准） |
| 9 | draft 不进学生池 | 抽题 where `status='approved'`；draft 不可抽 |
| 10 | 重复执行 | `UNIQUE(code)` + confirm 全量已存在且指纹一致 → `mode=idempotent`；部分存在 → Conflict 整批中止 |

库快照（只读）：`train_items`≈111；`status=draft`≈93（历史草稿，**无**本批 code）；drawable=`formal+approved+active`=**13**。

---

## 5. Draft 隔离规则（纠正预期）

| 预期（任务口述） | 现网实际 |
|------------------|----------|
| `pool=draft` | **无此 pool 枚举**；`pool ∈ {formal,test}` |
| `status=draft` | **是** — 导入强制 `status=draft` |
| 不 formal | 导入写 **`pool=formal`** 但 **未 approved** → 仍不可抽 |

隔离充分条件：`status≠approved`（及/或 `is_active=0`）。  
本批导入后 drawable 应仍为 **13**（待独立复验）。

---

## 6. 建议执行方案（GLOBAL-1G，本阶段不执行）

1. **备份**：`hs_math_train_items` / `_kps` / `_methods` /（可选 reviews）mysqldump；记录字节与时间戳。  
2. **适配器**：候选 mjs → 100 条 `HsMathImportItem`（上表映射）；禁止改业务代码。  
3. **preview**：Admin 导入预览；`canConfirm=true`；允许 037/074 stem warning。  
4. **confirm**：同一 `items` + token；**单事务**插入 100 行 + KP/method 链接。  
5. **失败**：事务回滚；不留半批。  
6. **幂等**：整批重跑 → 指纹一致则 idempotent；不一致 Conflict。  
7. **独立连接复验**：`COUNT(code LIKE 'CAND-G1B-%')=100`；皆 `status=draft` 且 `pool=formal`；drawable 仍 13；无 review 行；KP/method 链接数符合。  
8. **禁止**：approve、写 review passed、改正式题、进学生池。

若 1G 跳过适配器直接塞扁平 JSON → 结构校验失败 → 不得强行绕过。

---

## 7. 阻塞项与风险

### 阻塞项

**无。**（唯一约束存在；draft 隔离可证；映射经适配器完整；无 code 撞库。）

### 风险 / 下一阶段注意

1. **必须**使用适配器；原始 `candidates-g1b-100.mjs` 不可直接 POST。  
2. `import-protocol.ts` 类型注释仍写 4 题型 — 运行时已含 application；1G 勿被类型注释误导。  
3. 037/074 短题干 warning — 人工知悉即可。  
4. 含本地 DB 凭据的探查脚本 `_g1g_preflight_ro.mjs` **勿提交 git**。

---

## 8. 最终状态

```
PREFLIGHT_PASS
```

可进入授权阶段：**GLOBAL-1G 正式 draft 入库**（另授权；本阶段停止）。
