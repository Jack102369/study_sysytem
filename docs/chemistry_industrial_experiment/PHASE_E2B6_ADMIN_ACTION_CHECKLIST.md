# PHASE_E2-B6 · 真实管理员操作清单（PART B）

| 字段 | 值 |
|------|-----|
| 页面 | `/settings/chemistry-industrial-candidates` |
| 批次 | `industrial_formal_candidate_20261029_121958` |
| 声明 | **本清单 ≠ 已完成人审**；须管理员本人登录操作 |
| 证据包 | `scientific_source_packets/` + 页内「B5 辅助外链」 |

---

## 开始前

1. 确认 API（约 3000）与 Web（约 5173）已启动；硬刷新页面。  
2. **管理员账号**登录（勿用伪造 JWT）。  
3. 批次输入框保持 E1 批次；表格应有 **4** 行。  
4. 页顶确认 `real publish=OFF`。

---

## 正确顺序（勿跳步）

### 1. 打开页面并选批次

路径：`/settings/chemistry-industrial-candidates` → 批次=`industrial_formal_candidate_20261029_121958`。

### 2. 打开某一候选「审核」抽屉

先处理案例维度：salt（01/03 共用）→ gas_wash（02）→ seawater（04）。

### 3. 查看案例与题面

核对：revision（01/02/04=**9**，03=**7**）、题干/选项/答案/解析、流程 SVG、装置 SVG（若有）、修订历史。

### 4. 查看科学来源与证据缺口

- fixture「科学来源」表：多为 **unverified**。  
- 「B5 辅助外链」：点 **原文** 打开 URL。  
- 若见 **SOURCE_EVIDENCE_INCOMPLETE**（气体洗涤）：外部证据不足，默认**不要**批准案例。

### 5. 打开原始来源并判断是否足够

优先 ACCESSED（盐：JSNT/ZUST；海水：SDUT）。  
ACCESS_FAILED：自行重试或改用手头教材；**不得虚构页码**。  
洗气：须自备教材「气体洗涤/干燥」装置说明后再谈批准。

### 6. 处理访问失败来源

可在来源证据行选 `cannot_verify` / `needs_revision`，或改用自备书并在 evidenceNote 写清书名版本章节。

### 7. 气体洗涤证据不足时

推荐案例覆盖层：`sources_incomplete` 或 `cannot_verify`。  
**不要**为赶验收点 `approve_for_publish`。

### 8. 仅当证据充分时提交案例有效审核

1. 每条来源 outcome 改为「管理员已核验」，**手写** evidenceNote≥8。  
2. 审核意见≥8 字。  
3. 案例覆盖层选 `approve_for_publish` →「提交案例审核覆盖层」。  
4. 确认提示：不改写 fixture published；相关候选质检失效。

默认打开抽屉时 outcome=无法核验、证据为空——**禁止依赖自动已核验模板**。

### 9. 重新质检候选

对受影响候选点「重新质检」（salt 批一次后 01 与 03 都要重检）。

### 10. 逐题人工审核

对照 fail / unknown 表；勾阅清单可「保存审核清单」（不升格入库）。  
决定：退回修改 / 驳回 / 尝试审核通过（受闸门）。  
**unknown ≠ pass**；不得要求系统把 unknown 改成 pass。

### 11. 如何处理 unknown

书面接受并记入意见，或退回修改；清单 acknowledge 只表示已阅。

### 12. 何时退回

题图冲突、答案可疑、证据不足、装置安全未知不可接受 →「退回修改」。

### 13. 保存审核意见

审核意见框 + 清单备注；提交后核对 revisionHistory / humanDecision。

### 14. 确认未自动正式发布

即使候选人审通过：`real publish=OFF`；「正式入库 dry-run」≠ 写正式题库。  
正式入库属 **PHASE_E2-C**，须另批。

---

## 四题速查（B4 后）

| # | candidateId | rev | 案例 | 注意 |
|---|-------------|-----|------|------|
| 01 | cand_63284abdddf24cee | 9 | salt | 操作①↔过滤已澄清 |
| 02 | cand_8ce596acabc64f26 | 9 | gas_wash | 图示顺序；**外部证据弱** |
| 03 | cand_03bf94425958444b | 7 | salt | 与 01 共案例 |
| 04 | cand_312c51e0c9e249f7 | 9 | seawater | 答案「结晶」 |

---

## Cursor / AI 禁止代做

批准来源、批准案例、批准候选、伪造审核人/时间/哈希、开 real publish、formal 写库、自动 commit。
