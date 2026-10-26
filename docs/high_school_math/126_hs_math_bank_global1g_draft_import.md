# HS-MATH-BANK-GLOBAL-1G — 首批 100 道 draft 正式导入

> 日期：2026-10-26  
> **最终状态：`DRAFT_IMPORT_PASS`**  
> 前置：1F-FIX=`QUALITY_PASS` · 1G-PREFLIGHT=`PREFLIGHT_PASS`  
> **本阶段已写库**（仅本批候选 + KP/method 链接）；**未** review / approve / push / CORE-1B

---

## 1. 用户授权

> 授权 GLOBAL-1G：允许备份，并通过 preview/confirm 将首批100道候选题导入 study_system，状态为 formal+draft；禁止 review、approve 和其他业务写入。

计划确认后按此范围执行。

---

## 2. 适配器

| 项 | 值 |
|----|-----|
| 路径 | `docs/high_school_math/question_bank/_g1g_adapt_candidates.mjs` |
| 干跑 | **100/100 OK** |
| 题型 | judge16 / single34 / numeric19 / multi7 / **application24** |
| 难度 | 基础35 / 提高40 / 压轴25 |
| rubric | `score→maxScore`，`criterion→criteria`；24 题和分一致 |
| 数学含义 | 未改答案/题干语义，仅协议形状转换 |

运行器（含凭据，**勿 git**）：`_g1g_draft_import.mjs`  
机器结果：`_g1g_import_result.json`（勿提交敏感细节以外的凭据；本文件不含密钥）

---

## 3. 指纹与导入前只读

| 项 | 值 |
|----|-----|
| 候选文件 SHA256 | `af432ba5cccf2686fdfcc568680f398aa20ebf6baf008b3d74f4858b192ea1ce`（`candidates-g1b-100.mjs`） |
| 适配后 payload SHA256 | `ec6ae2e80bb729f3a34b67997ea9676b5777fa741ef29f0a119e6deb7efe35af` |
| 导入前 `CAND-G1B-%` | **0** |
| drawable | **13** |
| approved / review_passed | 13 / 13 |
| sessions / session_items | 131 / 354（导入后未变） |

状态相对预检未恶化 → 继续。

---

## 4. 备份（confirm 前）

目录：`docs/high_school_math/_backups/`（**不入 git**）

| 表 | 文件后缀时间戳 | bytes | sha256（前缀） |
|----|----------------|------:|----------------|
| `hs_math_train_items` | `g1g_…_2026-10-26T08-43-22.sql` | 74575 | `948c22fe…` |
| `hs_math_train_item_kps` | 同上 | 10084 | `afc3609c…` |
| `hs_math_train_item_methods` | 同上 | 3634 | `c839049f…` |
| `hs_math_train_item_reviews` | 同上 | 5160 | `6e9e23b6…` |

均非空、可读（mysqldump PROCESS 警告同 1E，数据仍写出）。备份失败则不会 confirm（本跑成功）。

---

## 5. Preview

| 项 | 结果 |
|----|------|
| HTTP | 201 |
| itemCount | **100** |
| errorCount | **0** |
| canConfirm | **true** |
| previewToken | 已签发（未写入本报告正文） |
| warningCount | 101 |

警告构成：

- **100×** `MATH_HUMAN_REVIEW`（固定提示：结构合法≠数学正确）— 非阻断。  
- **1×** `BATCH_STEM_DUP` 于 **CAND-G1B-074**（相对第 37 题）— 见 §8。

无 code 冲突、无 KP/method/rubric/来源 error → 允许 confirm。

---

## 6. Confirm

| 项 | 结果 |
|----|------|
| HTTP | 201 |
| mode | **`created`**（非整批 idempotent 空跑） |
| successCount | **100** |
| failCount | 0 |
| notice | 已全部写入 draft；未自动批准 |
| 事务 | 现有 `dataSource.transaction` 整批；本跑完整提交 |
| 落库态 | **`pool=formal` + `status=draft`**（抽查 id 152+） |

未创建 review passed；未 approve；未改正式题。

---

## 7. 独立连接验收

| 检查 | 结果 |
|------|------|
| `CAND-G1B-*` 数量 | **100** |
| 全 draft + formal | **100**（badStatus=0） |
| approved 增量 | **0** |
| review_passed 增量 | **0** |
| items 增量 | **+100**（111→211） |
| KP 链接 | **100** |
| method 链接 | **109**（=适配期望；含 methodAux） |
| application | **24**；rubric 持久化校验 **24/24** |
| 难度 | 1→35 · 2→40 · 3→25 |
| 题型 | 与候选一致 |
| sessions / session_items | **不变** |
| **drawable** | **仍为 13** |

结论：**100 draft ≠ 可训练题**；学生抽题门禁仍为 approved+is_active。

---

## 8. CAND-G1B-037 / 074 stem warning

| | 037 | 074 |
|--|-----|-----|
| 题干（原文） | 正确的是（多选） | 正确的是（多选） |
| KP | `rja.4.3.02` 对数运算法则 | `rjb.6.3.02` 坐标运算 |
| 答案 | A,B,D | A,B,C |
| 选项主题 | 对数恒等式 | 向量运算律（含叉积干扰） |

- 导入仅对 **074** 报 `BATCH_STEM_DUP`（warning），**非 error**。  
- 选项/答案/知识点不同，**无数学歧义、无答案冲突**。  
- **保留入库**；建议日后润色题干加主题前缀（另授权），本阶段不改已入库正文。

---

## 9. 剩余风险

1. draft 仍须人工 review → approve 后才进 drawable。  
2. 备份与 `_g1g_draft_import.mjs` / `_g1g_import_result.json` / `_g1g_adapted_items.json` **含环境痕迹，勿 push/commit**。  
3. 勿自动 GLOBAL-1H / CORE-1B。

---

## 10. 最终状态

```
DRAFT_IMPORT_PASS
```

本阶段 **停止**。下一阶段（审核/批准）须另授权。
