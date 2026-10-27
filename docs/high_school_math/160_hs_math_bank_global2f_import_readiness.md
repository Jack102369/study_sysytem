# HS-MATH-BANK-GLOBAL-2F — 第二批 100 道导入前集中核验

> 日期：2026-10-26  
> **最终状态：`IMPORT_PREFLIGHT_PASS`**  
> 前置：GLOBAL-2E = `BATCH_READY_FOR_IMPORT`  
> **本阶段：只读 MySQL；无 INSERT/UPDATE/DELETE；无 draft 实写；无插图上传；无 review/approve；无 git commit/push；无真实 AI 调用**  
> 独立性：`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`

---

## 1. 结论摘要

| 项 | 结果 |
|----|------|
| 候选权威源 | `question_bank/candidates-g2a-100.mjs`（100 唯一） |
| 配额 | 难度 35/40/25；题型 30/15/10/20/25；章覆盖 1–10 |
| 034 / 072 难度真实性 | **ACCEPT_D3**（作者复算；非虚标） |
| Nest `validateImportItemStructure` | **100/100 ok**（对照 `apps/api/dist`） |
| KP / method / specialty↔category | DB 只读 **0 miss / 0 inactive / 0 pairMiss** |
| `CAND-G2A-%` 已入库 | **0**；与 formal code **无撞库** |
| drawable（formal+approved+active） | **113**（未变） |
| REQUIRED 插图 7/7 | PNG 魔数/≤2MiB/≤4096px；SVG 无危险标签；题干一致；答案未泄露 |
| 导入路径保护 | confirm 硬编码 `status=draft` + `pool=formal`；禁止客户端传 status |
| 独立终审 | **未建立**（不得包装为独立终审） |
| **是否可授权正式 draft 入库** | **可以**（须另授权 GLOBAL-2G；强制适配器；本阶段停止） |

---

## 2. 独立性声明

| 项 | 记录 |
|----|------|
| 出题 / 2B–2E / 2F 预检 | **同一助手族系** |
| 标记 | **`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`** |
| 含义 | 本文件为作者侧导入就绪核验；**不是**独立终审 |

Nest 结构校验对每题固定 warning：`MATH_HUMAN_REVIEW`（结构合法 ≠ 数学正确）。与上表一致。

---

## 3. 本阶段自主修复（≤3 轮，未越权写库）

| 轮次 | 问题 | 处置 | 结果 |
|------|------|------|------|
| R1 | `CAND-G2A-090` numeric 答案 `$12\pi$` 不满足 `NUMERIC_VALUE_RE` | 题干改为求 \(V/\pi\)；答案 `12` | 协议 PASS |
| R2 | `CAND-G2A-027` `methodMain=methodAux=classification` → Nest `METHOD_DUP` | `methodAux=null` | Nest 100/100 |
| R3 | — | 未开 | — |

034/072 **未再改题**；沿用 2E 重设计；本阶段仅复算确认。

---

## 4. 034 / 072 难度真实性（重点）

### CAND-G2A-034（d=3）

- 题干：\(\log_4(x-1)+\log_2(x-1)=3\)，\(x>1\)；求 \(x\)。
- 答案：**5**（换底 \(t/2+t=3\Rightarrow t=2\Rightarrow x=5\)；检验成立）。
- 难度依据：混底换底 + 解指数 + 定义域，**非**单次对数求值；**支持 d=3**。
- 判定：**ACCEPT_D3**（非为凑 25 道压轴虚标）。

### CAND-G2A-072（d=3）

- 题干：\(\vec F=(3,4)\)；\(A(1,2)\to B(7,10)\)；同向 \(|\vec G|=5\)；求合力功 \(W\)。
- 答案：**100**。
- 难度依据：坐标位移 → 点积 → 单位化构造 \(G\) → 再求功；**非**两次余弦照抄。
- 判定：**ACCEPT_D3**。

若上述任一无法合理解释，本阶段应报 `BLOCKED`。**未触发。**

---

## 5. 导入协议实核（对照 Admin DTO / 现网机制）

### 5.1 代码路径

| 组件 | 路径 | 核验要点 |
|------|------|----------|
| DTO | `admin-train-item-import.dto.ts` | `items: unknown[]`；`@ArrayMaxSize(100)` |
| 结构校验 | `train-item-import.validate.ts` | 禁 `status`/`contentVersion`；调 `validateAnswerPayload` |
| 答案协议 | `answer-payload.validate.ts` | numeric 正则与适配器一致；含 application |
| 服务 | `hs-math-admin-train-items-import.service.ts` | preview→token；confirm 事务；**落库 `status:'draft'`** |
| 上限 | `HS_MATH_IMPORT_MAX_ITEMS=100` | 本批满额 |

### 5.2 实测（非“只看文件结构”）

1. 适配器干跑：`_g2f_adapt_dryrun.mjs` → `_g2f_adapted_items.json`（100 条）。  
2. **加载现网 dist**：`validateImportItemStructure` ×100 → **failCount=0**。  
3. numeric 全量扫描：`_g2f_scan_numeric.mjs` → **badCount=0**。  
4. DB 只读 enrich：`_g2f_db_enrich_ro.mjs` → specialty/category 对、KP/method 全命中且 active；**collide=[]**；**drawable=113**。

### 5.3 字段映射（候选 → 导入 JSON）

与 GLOBAL-1G 相同确定性适配：

| 候选 | 导入 |
|------|------|
| `id` | `code` |
| `specialtyCode` / `sectionCode` | `specialtyCode` / `categoryCode` |
| `kpCode` | `knowledgePointCodes` + `primaryKnowledgePointCode` |
| `methodMain`[/`methodAux`] | `methodCodes`（去重）+ `primaryMethodCode` |
| 扁平 `answer`/`options`/`rubric` | `answerPayload` + `options.options[]` |
| — | **禁止**传 `status` / `contentVersion` |

**原始 `candidates-g2a-100.mjs` 不可直接 POST**；必须经适配器。

### 5.4 对 113 正式题的保护

| 机制 | 说明 |
|------|------|
| code 唯一 | 撞库 → Conflict；本批 code 均未占用 |
| 写入态 | 仅 **新增** `status=draft`；**不** update 已有 approved |
| 抽题 | 学生池强制 `approved`；draft 不可抽 |
| 幂等 | 同内容重跑 → idempotent；内容变 → Conflict 整批回滚 |

本阶段 **未**执行 preview/confirm HTTP（避免误触写路径）；结构与 enrich 已用同一套服务端校验逻辑离线跑通。

---

## 6. REQUIRED 插图（7）

目录：`docs/high_school_math/diagrams/required_g2a/`（**未上传**）

| id | PNG SHA256（前 16） | 尺寸 | PNG bytes | SVG 安全 | 与题干 | 答案泄露 |
|----|---------------------|------|-----------|---------|--------|----------|
| 045 | `ac818d4e899196f3…` | 1000×720 | 27707 | ok | 半径 6、圆心角 \(2\pi/3\) | 无弧长/面积数值 |
| 055 | `a83856cae522849f…` | 1000×720 | 23191 | ok | 45°/60°、20 m | 无 \(h\) 终值 |
| 081 | `97b7c3ecc7f7d4af…` | 1000×720 | 23457 | ok | 底边 6、高 PO=4 | 无 \(V\) |
| 084 | `8da6b0ae83556300…` | 1000×720 | 22456 | ok | 正方体+淡标线段 | 无平行/异面结论 |
| 086 | `35583af69ab4f379…` | 1000×720 | 23108 | ok | E/F 中点 | 无 \(EF\parallel\) 结论标 |
| 088 | `5b88220539e26e23…` | 1000×720 | 21602 | ok | 直三棱柱+AB1 | 无垂直记号 |
| 089 | `ecfab27657b72f09…` | 1000×720 | 21575 | ok | 正方体+淡标线 | 无面面垂直标记 |

协议对照：`HS_MATH_ITEM_DIAGRAM_MIMES` 含 `image/png`；`MAX_BYTES=2MiB`；`MAX_PX=4096`。PNG 魔数 `89 50` 全过。完整 SHA 见 `_g2f_adapt_dryrun.json`。

---

## 7. 证据文件（只读旁证）

| 文件 | 用途 |
|------|------|
| `_g2f_adapt_dryrun.json` / `_g2f_adapted_items.json` | 适配 + Nest 结构结果 |
| `_g2f_scan_numeric.mjs` | numeric 字面量扫描 |
| `_g2f_db_codes_ro.mjs` / `_g2f_db_enrich_ro.mjs`(+`.json`) | DB 撞库与元数据 |
| `candidates-g2a-100.mjs` | 权威候选（含 R1/R2 修订） |

---

## 8. 阻塞项与风险

### 阻塞项

**无。**（难度真实；协议经 Nest 校验；图齐全；113 未被动；无 code 撞库。）

### 风险 / 下一阶段注意

1. **必须**用适配器后的 `_g2f_adapted_items.json`（或等价生成）再 preview→confirm。  
2. 导入后仍为 draft；**禁止**本批自动 approve；建议另授权独立复核（至少 034/072 + 抽检 + 7 图）。  
3. 插图须在 draft 入库后按 Admin 上传协议单独上传（本阶段禁止）。  
4. 含 DB 凭据的 `apps/api/scripts/_g2f_*_ro.mjs` **勿提交密钥**；脚本本身可读 `.env`。  
5. 独立性未建立 → 正式上线前仍建议独立主体抽检。

---

## 9. 建议下一阶段（**本阶段不执行**）

1. 备份相关表。  
2. Admin preview（适配后 100 条）→ `canConfirm=true`。  
3. confirm 单事务新增 100 draft。  
4. 独立连接复验：`CAND-G2A-%`=100 且皆 draft；drawable 仍 113。  
5. 再授权：上传 7 图 →（可选）独立复核 → review/approve。

---

## 10. 最终状态

```
IMPORT_PREFLIGHT_PASS
```

**停止。不自动进入真实导入。**
