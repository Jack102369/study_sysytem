# 181 · HS-MATH-HARD-CH1-4-IMPORT-PREFLIGHT-1C

> **最终状态：`HARD_IMPORT_PREFLIGHT_BLOCKED`**（1C 当时结论）  
> **后续：QUALITY-FIX-1D 已执行 → 见 `182`，状态 `HARD_IMPORT_PREFLIGHT_PARTIAL`**  
> **独立性：`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`**  
> **本阶段（1C）：只读预检**（无 MySQL 写入、无正式导入、无改候选、无 Git）

---

## 1. 813 正式题基线（只读）

| 项 | 值 |
|----|-----|
| drawable（formal+approved+active） | **813** |
| d1 / d2 / d3 | **335 / 478 / 0** |
| 与 CAND-HARD14-* code 冲突 | **0** |
| KP / method / chapter-section 缺失 | **0** |
| 表字段 `hard_level` | **不存在** |

基线与 ADJUST-1C 后状态一致；本批仍未入库。

---

## 2. 100 道最终 SHA 锁定

| 快照 | SHA256 |
|------|--------|
| 全批 `batchContentSha256` | `8f7b1f2334197350c161e0efa0ec88fd37a11c1ec58dec4b97b1b10affd15697` |
| 设计映射 SHA | `49beb518f5cee97ef1c3d0a1eddcfaee611c802afa1b6cf419ca8dbd22648e45` |
| 质量证据聚合 SHA | `f046c5c31359ce6770782decf1f6814d6a5987965066b36a0aa405030820e38e` |
| `hard_ch1_4_designs.json` 文件 | `b029f582daa4ea91a35f5f4908cf8bf9d79491d44a4a58352313f3475882d270` |
| `hard_ch1_4_batch1a_quality_results.json` 文件 | `bccedd31762117c73b5e425afa9eb6056892ae2b8de23bc80eab484eec7fa60f` |

逐题 `contentSha256` 见 `question_bank/hard_ch1_4_import_preflight_results.json` → `snapshot.perItem`。  
重算与候选文件内嵌 SHA：**100/100 一致**。后续正式导入必须核对同一快照。

---

## 3. 设计与候选一致性

| 检查 | 结果 |
|------|------|
| 候选数 | 100 |
| `candidateCode` 唯一 | PASS |
| 设计 1:1（HARD-DESIGN-NNN ↔ CAND-HARD14-NNN） | PASS |
| 章配额 10/35/40/15 | PASS |
| 标签 H1/H2/H3 = 32/45/23 | PASS（标签层） |
| 五题型齐全 | app49 / num16 / single15 / multi15 / judge5 |
| `difficulty` 全为 3 | PASS |
| `hardProfile` 100/100 | PASS |
| 内容 SHA 与最终题干绑定 | PASS |

---

## 4. 100 道数学复核结果

证据：`question_bank/_pf_math_review_all.json`（每题含推导摘要 / PASS|ISSUE / 压轴重判）。

| 结论 | n |
|------|---|
| PASS | **97** |
| ISSUE | **3** |
| UNCERTAIN | 0 |

### MATH_ISSUE（阻断）

| ID | 问题 |
|----|------|
| **CAND-HARD14-039** | \(x^2+\lvert x-a\rvert\ge a\) 恒成立。作者答 \(a\le 0\) 或 \(a\ge 1\) **错**。\(a\ge\tfrac12\) 时 \(\min g=a-\tfrac14<a\)（例 \(a=1\)：\(\tfrac34<1\)）。正确范围 **仅 \(a\le 0\)**。 |
| **CAND-HARD14-073** | 题干同时要求「奇函数」与 \(f(0)=1\)。奇函数必有 \(f(0)=0\)，条件自相矛盾；标答 \(-\frac12\) 在不一致前提下无意义。 |
| **CAND-HARD14-074** | 关于 \(x=1\) 轴对称与关于 \((2,0)\) 中心对称 ⇒ \(f(x+2)=-f(x)\)、\(f(x+4)=f(x)\)、\(f(2)=0\)。作者选 **B**（\(f(x+4)=-f(x)\)）错误；A/C/D 亦均不完全正确，**无正确选项**。 |

其余 97 道：作者侧按最终题干重推/抽检边界后与标答一致。  
双遍专项：`_pf_math_review_001_050.json`、`_pf_math_review_051_100.json`（更严 MODERATE 清单作修题参考；已并入 039/074）。  
**不能**把结构校验或 1B `mathCheck=PASS` 当作独立终审。

---

## 5–6. 压轴真实性重审（不采信 1B 的 32/45/23）

| 重判 | n | 说明 |
|------|---|------|
| TRUE_H3 | **0** | 双遍严格复核后**无一保留** |
| TRUE_H2 | **56** | 含原 038/040 等降标 |
| TRUE_H1 | **34** | |
| MODERATE_ONLY | **7** | **未达压轴门槛**（双遍另有更大 advisory 清单） |
| MATH_ISSUE | **3** | 039、073、074 |

### 保留 TRUE_H3

**无。** 原拟保留的 038/040 在 001–050 严格复核后分别降为 H2（主结论采纳 H2，不保留 H3）。

### MODERATE_ONLY（与此前降级 d2 同级，禁止当压轴导入）

| ID | 为何未达 H1 |
|----|-------------|
| 026 | \(a+b=4\) 最大 \(\sqrt a+\sqrt b=2\sqrt2\)：柯西/平方套路 |
| 031 | \(\lvert x_1-x_2\rvert=\sqrt\Delta\) 反求：程序化 |
| 041 | AM-GM 证明 + 定和最小 + \(4/s\)：教材提高串联 |
| 065 | 奇+严格增 ⇒ 符号一步翻译 |
| 081 | \(x^{\alpha-\beta}=t\) 正根个数：因式化即完 |
| 082 | \(f(3)\pm f(-3)\) 线性组：非压轴 |
| 085 | 对勾最小值临界 \(a=9/4\)：提高题标配 |

### 原 23 个 H3 降级建议（本阶段不改候选）

全部 23 个作者 H3 均建议降为 H2/H1/none/MATH_ISSUE（详见 results JSON `mathRecheck.h3Downgrades`）。  
**不得为凑 100 合格而放宽。**

相对此前 200 道假压轴：本批多数题确有「多分支 / 量词 / 对称复合」增量，但仍有 7 道与降级题同属普通提高套路——**再次证明标签不可直接入库。**

---

## 7. 49 道 application rubric

| 项 | 结果 |
|----|------|
| 离线 `sum(score)==maxScore` | **49/49** |
| 抄写题干计分启发式 | 未发现 |
| 导入形态 | 离线为 `{step,score}`；Admin 要 `{key,title,criteria,maxScore}`——**可用映射器转换，本阶段未改候选** |

逐题公平性摘要见 `_pf_math_review_all.json` 的 `appRubricNote`。

---

## 8. 其他四题型协议

| 题型 | n | 预检 |
|------|---|------|
| single | 15 | 结构可适配；选项唯一性抽检未见双正解 |
| multi | 15 | 集合答案可适配；009/043/076 等已重审 |
| judge | 5 | true/false 可映射 |
| numeric | 16 | **5 道导入协议非法**（见下） |

### numeric 导入阻断

| ID | 当前 `answer` | 问题 |
|----|---------------|------|
| 026 | `2\sqrt{2}` | 非纯数字/分数串 |
| 033 | `2^{1/3}+2^{2/3}` | 含运算表达式 |
| 065 | `正` | 中文；更宜 judge |
| 073 | `-\dfrac{1}{2}` | LaTeX（且本题 MATH_ISSUE） |
| 085 | `\dfrac{9}{4}` | LaTeX；应写 `9/4` |

---

## 9. 与 813 / 批内语义去重

| 项 | 结果 |
|----|------|
| vs 813 精确题干（规范化） | **0** |
| vs 813 stem 包含命中 | **0** |
| 批内精确重复 | **0** |
| `modelFamily` 碰撞 | **0** |
| 低价值同构（难度维度） | **7** 道 MODERATE_ONLY（相对旧 d2，非字符串重复） |

说明：现网 `hs_math_train_items` **无** `content_fingerprint` 列，本预检以规范化题干为主。

---

## 10. REQUIRED 配图重判

| 项 | 结果 |
|----|------|
| 1B 标签 REQUIRED | 0 |
| 1C 重判 REQUIRED | **0** |
| RECOMMENDED（教学辅助） | 001,006,013,018,028,034,038,040 等 |

函数图像 / 根分布 / 分段等：文字条件已自足，图非解题必要条件。  
**无 REQUIRED 缺口**（本项不单独阻断；图相关阻断为 0）。

---

## 11. 100/100 导入 dry-run（零写入）

| 项 | 结果 |
|----|------|
| 可映射成功 | **95/100** |
| 失败 | **5**（上表 numeric） |
| `hardLevel` 写入 | **已剥离**；协议无此字段 |
| 覆盖 813 | 否（无 code 冲突） |
| draft → review → approve 门禁 | 现有 Admin 流程可用；**本阶段未调用写接口** |

application 需在导入适配层把 `step/score` → rubric 协议；难度 3 在 `HS_MATH_DIFFICULTIES` 内允许。

---

## 12. hardLevel 持久化限制

1. **DB 无** `hard_level` 列；**禁止**本阶段改 schema。  
2. **Import DTO / `HsMathImportItem` 无** `hardLevel`。  
3. **保留方式（离线证据）**：  
   - `hard_ch1_4_batch1a_candidates.mjs` 的 `hardLevel` / `hardAudit` / `hardProfile`  
   - 本预检 JSON + `_pf_math_review_all.json` 的 `hardRejudge` / `suggestedHardLevel`  
4. 正式导入时：只写入 `difficulty=3`（若届时仍认定压轴）；H1/H2/H3 **不得**塞进未知 JSON 字段冒充入库，除非后续单独授权的元数据方案。

---

## 13. 未解决问题（阻断清单）

1. **7× MODERATE_ONLY** — 未达至少 H1  
2. **039 / 073 / 074 MATH_ISSUE** — 恒成立范围错；奇函数矛盾；对称选项错  
3. **5× numeric 协议** — 无法 dry-run 全绿  
4. **H3 虚标** — 23→**0** 个 TRUE_H3；标签体系需在修题阶段重建  
5. 双遍复核另标大量疑似 MODERATE（见 `_pf_math_review_001_050.json` / `_051_100.json`）  
6. application rubric 形态依赖导入映射器（可解，非内容缺陷）  
7. **独立数学终审仍未建立**

---

## 14. 独立审核限制

`INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED`

本报告为作者侧严格预检 + 抽检重推，**不能**冒充外部独立终审。即使将来修题后预检 PASS，仍建议第三方抽检 H2/H3 样本后再大规模 approve。

---

## 15. 最终状态

# `HARD_IMPORT_PREFLIGHT_BLOCKED`

**禁止**进入正式导入 / review / approve。  
修复路径（需另授权）：剔除或重做 MODERATE_ONLY 与 039/073/074；修正 numeric 协议；按 1C 重判收敛 H 标签（含重建真实 H3）；再跑一轮 IMPORT-PREFLIGHT。

---

## 交付物

| 文件 | 说明 |
|------|------|
| `181_hs_math_hard_ch1_4_import_preflight_1c.md` | 本报告 |
| `question_bank/hard_ch1_4_import_preflight_results.json` | 机器可读总结果 |
| `question_bank/_pf_math_review_all.json` | 逐题数学/压轴证据 |
| `question_bank/_hard14_import_preflight_ro.mjs` | 只读结构/DB/适配脚本 |
| `question_bank/_hard14_import_preflight_ro_out.json` | 脚本输出 |

---

## 停止声明

未执行：MySQL 写、正式导入、配图上传、review/approve、改 813、改本批候选、第五批、Git commit/push。  
等待用户下一阶段授权。
