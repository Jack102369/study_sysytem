# HS-MATH-BANK-GLOBAL-3B — 第三批 100 道质量复核与导入预检

> 日期：2026-10-27  
> **最终状态：`IMPORT_PREFLIGHT_PASS`**  
> 前置：GLOBAL-3A = `BATCH_READY_FOR_IMPORT_PREFLIGHT`  
> **本阶段：只读 MySQL；无 INSERT/UPDATE/DELETE；无 draft 实写；无插图上传；无 review/approve；无 git commit/push；无真实 AI 调用**  
> 独立性：`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`

---

## 1. 结论摘要

| 项 | 结果 |
|----|------|
| 候选权威源 | `question_bank/candidates-g3a-100.mjs`（100 唯一） |
| 数学复算 | **100/100 PASS**（证据 `_g3b_math_resolve.json`；每题含独立推导摘要） |
| 压轴 d=3 | **25 ACCEPT_D3**（下调虚标 5 题 + 上调真实难 5 题后配额仍 35/40/25） |
| application rubric | **25/25**；无照抄题干得分点；045 错分点已修 |
| Nest `validateImportItemStructure` | **100/100 ok**（对照 `apps/api/dist`；警告 `MATH_HUMAN_REVIEW`） |
| KP / method / specialty↔category | DB 只读 **0 miss / 0 inactive / 0 pairMiss** |
| `CAND-G3A-%` 已入库 | **0**；与 formal code **无撞库** |
| drawable（formal+approved+active） | **213**（未变） |
| REQUIRED 插图 7/7 | PNG 魔数/≤2MiB/1000×720；SVG 安全；SHA↔manifest；055 标注已修 |
| 语义去重 | 批内 0；vs 正式213+G1B/G2A stem：**终态 0**（R1–R3 清 045/084/097） |
| 导入路径保护 | 必须适配器；禁止客户端传 status；confirm 仅 draft（本阶段未调用） |
| 独立终审 | **未建立**（不得包装为独立终审） |
| **是否可授权正式 draft 入库** | **可以**（须另授权 GLOBAL-3C；强制适配器；本阶段停止） |

旁证：`_g3b_adapt_dryrun.json` · `_g3b_adapted_items.json` · `_g3b_db_enrich_ro.json` · `_g3b_math_resolve.json` · `_g3b_review_export.json`

---

## 2. 独立性声明

| 项 | 记录 |
|----|------|
| 出题 / 3A 质量 / 3B 复核预检 | **同一助手族系** |
| 标记 | **`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`** |
| 含义 | 作者侧集中复核 + 导入协议干跑；**不是**独立数学终审 |
| Nest 警告 | 每题固定 `MATH_HUMAN_REVIEW`（结构合法 ≠ 数学正确） |

建议：正式 approve 前另授权独立主体抽检（至少 REQUIRED 7 + 压轴抽样 + 045/084/097 修复题）。

---

## 3. 自主修复（≤3 轮，未写库）

### Round 1

| 问题 | 处置 | 结果 |
|------|------|------|
| 045 rubric 写成 π/3、π/6，与答案 2π/3、π/3 矛盾 | 改场景为 r=4、θ=π/3，并修正 rubric | 数学+协议 PASS |
| 084 与正式库线面平行定理近复述 | 改写命题 | 后发现仍撞正式题干 → R2 |
| 097 与正式库独立交概率同数 | 改数 0.3×0.6 | 后发现仍语义近 → R3 |
| 055 图 a/b 标注落在错误边上 | 修正生成脚本并重出 PNG/SVG | 标注与题干一致 |
| 虚标 d=3：015/038/054/056/093 | 下调；上调 027/032/041/058/087 | 难度真实性提升 |

### Round 2

| 问题 | 处置 | 结果 |
|------|------|------|
| 配额暂成 37/38/25 | 038、093 落在 d2（非 d3） | **35/40/25** |
| 084 R1 新干与正式「线面平行⇒面内任一线平行」**完全撞库** | 改为缺「平面外」条件的判定陷阱题，答 false | priorHits **0** |
| 045 结构仍偏扇形弧长面积 | 改为「周长（弧+2r）+面积」 | 语义撞库清除 |

### Round 3

| 问题 | 处置 | 结果 |
|------|------|------|
| 097 仍与正式独立事件模板高相似 | 改为求 $P(\overline{A}\,\overline{B})$，答案 `1/3` | semanticHits **0** |

---

## 4. 数学质量（100 题复算）

- 全量证据：`question_bank/_g3b_math_resolve.json`（`summary.pass=100`）。
- 每题含 `derive` 独立推导摘要；**不以复制 analysis 代替复算**。
- 重点修复题复算：
  - **045**：周长 $=8+4\pi/3$，面积 $=8\pi/3$；rubric 与答案一致。
  - **055**：$\sin B=\sqrt2/2$；$B=45^\circ$ 或 $135^\circ$（SSA 两解）。
  - **080/081/085/086**：体积 $28\pi$；正四面体 $2\sqrt2/3$；$\sin=\sqrt5/5$；$MN=\sqrt6/2$。
- application：**25** 道 rubric 分值和 = maxScore；准则指向步骤/结果，**不**奖励照抄题干；等价解法可按准则得分。

### 压轴 d=3 真实性

| 处置 | 题号 |
|------|------|
| 下调（虚标） | 015、038、054、056、093 |
| 上调（真实难） | 027（利润建模）、032（换元指数方程）、041（对数+定义域）、058（潮汐综合）、087（面面平行判定多选） |
| 终态 25 道 | 005,013,016,026,027,028,032,039,041,042,051,053,055,058,068,069,072,076,080,081,085,086,087,089,100 — 均 **ACCEPT_D3** |

---

## 5. REQUIRED 插图（7）

目录：`docs/high_school_math/diagrams/required_g3a/`（**未上传**）

| id | PNG SHA256（前 16） | 尺寸 | 要点 | 答案泄露 |
|----|---------------------|------|------|----------|
| 048 | `09cff8070df0c56b…` | 1000×720 | 单位圆终边 π−π/3 | 无 cos 数值 |
| 055 | `663bc9abcc02629c…` | 1000×720 | SSA；**a 在 BC、b 在 AC**（G3B 已修） | 无角 B 终值 |
| 068 | `bf53651b03100790…` | 1000×720 | 平行四边形对角线 | 无互相平分标记 |
| 080 | `ddded6b9b6f0272b…` | 1000×720 | 柱+锥 r=2,h=6/3 | 无体积 |
| 081 | `7ab70f1c5c885fb7…` | 1000×720 | 正四面体 | 无高/体积 |
| 085 | `64a58fa3945ef85a…` | 1000×720 | 长方体斜线射影 | 无正弦值 |
| 086 | `384efb58aeaaf1a9…` | 1000×720 | 正方体中点 MN | 无 MN 长 |

协议：PNG 魔数 OK；≤2MiB；≤4096px；SVG 无 script/foreignObject/javascript/onclick/xlink:href；SHA 与 `_manifest.json` 一致。

---

## 6. 去重

| 对照集 | 结果 |
|--------|------|
| 批内 exact / 语义 | **0** |
| 正式 drawable 213 + G1B/G2A stemNorm | 初检 045/084/097 → R1–R3 改写；终检 **exact 0 / semantic 0** |

---

## 7. 导入协议实核（对照 Admin / Nest，无写库）

### 7.1 代码路径

| 组件 | 核验 |
|------|------|
| 适配器 | `_g3b_adapt_dryrun.mjs` → `_g3b_adapted_items.json` |
| Nest 结构 | `dist/.../train-item-import.validate.js` ×100 → failCount=0 |
| DB enrich | `_g3b_db_enrich_ro.mjs`（只读） |

### 7.2 结果

| 项 | 值 |
|----|-----|
| adaptErrors | 0 |
| nestFailCount | 0 |
| nestWarnCodes | `MATH_HUMAN_REVIEW` |
| collide | [] |
| drawable | **213** |
| g3aExisting | **0** |
| kp/method miss·inactive | 0 |
| specialty–category pairMiss | 0 |
| 配额 | 章 6/10/12/14/16/14/4/14/4/6；难度 35/40/25；题型 30/15/10/20/25 |
| 来源 | 全 `original` |
| 禁字段 | 适配产物不含 `status`/`contentVersion` |
| 导入目标（设计） | `pool=formal` + `status=draft`（confirm 硬编码；本阶段未调用） |

**原始 `candidates-g3a-100.mjs` 不可直接 POST**；必须经适配器。

---

## 8. 阻塞项与风险

### 阻塞项

**无。**

### 风险 / 下一阶段注意

1. 必须用 `_g3b_adapted_items.json`（或等价刷新）再 preview→confirm。  
2. 导入后仍为 draft；**禁止**本批自动 approve。  
3. 插图须入库后再按 Admin 协议上传（本阶段禁止）。  
4. 独立性未建立 → 建议独立抽检后再批准。  
5. 含 DB 凭据的 enrich 脚本读本地 `.env`，**勿把密钥写入文档/提交**。

---

## 9. 建议下一阶段（**本阶段不执行**）

1. 另授权 GLOBAL-3C：备份 → preview → confirm 100 draft。  
2. 只读复验：`CAND-G3A-%`=100 且皆 draft；drawable 仍 213。  
3. 再授权：上传 7 图 →（建议）独立复核 → review/approve。

---

## 10. 最终状态

```
IMPORT_PREFLIGHT_PASS
```

**停止。不自动进入 GLOBAL-3C / 正式导入。**
