# PHASE_E2-B3 · 管理员人工审核实际操作指南

| 字段 | 值 |
|------|-----|
| 页面 | `/settings/chemistry-industrial-candidates` |
| 批次 | `industrial_formal_candidate_20261029_121958` |
| 材料 | `human_review_packets/` |
| 更新 | 2026-10-29 14:05:45 +08:00 |
| 说明 | **操作说明 ≠ 已完成人审** |

---

## 必读边界

1. **案例有效审核通过 ≠ 候选题人审通过**  
2. **候选人审通过 ≠ 自动正式发布**（real publish 默认 OFF）  
3. **自动质检 / QUALITY_BLOCKERS=0 ≠ 科学事实全部正确**  
4. **unknown ≠ pass**  
5. 只有管理员本人操作才可记为人工审核；AI/Cursor 不得代审  

推荐先打开：`human_review_packets/INDEX.md` 与各 `cand_*.md`。

---

## 正确顺序（照此操作）

### 第一步：查看案例与科学来源

登录管理员 → 打开上述页面 → 批次保持 E1 → 点「审核」打开抽屉。  
阅读「案例（原始 fixture vs 有效审核）」「科学来源」表。  
确认 fixture 仍为 draft；覆盖层是否为空。

### 第二步：管理员独立核验科学依据

对照教材/权威资料，核验案例主张（粗盐提纯 / 海水晒盐 / 气体洗气示意）。  
可参考 packets 中的疑点清单；**不得**把 Mock 质检当核验。

### 第三步：确认来源证据是否覆盖案例

证据须真实、可复查；覆盖案例全部 `sourceTitle`。  
禁止虚构页码/URL/DOI。

### 第四步：证据不足则保留阻断

选意见类决策（acknowledge_draft / request_changes / sources_incomplete / cannot_verify）。  
**不要**点 approve_for_publish。发布闸门应继续阻断。

### 第五步：仅当证据充分时做案例有效审核

来源核验 =「管理员已核验」；案例覆盖层 = `approve_for_publish`；意见 ≥8 字；提交覆盖层。  
这只授予**有效发布资格**，不改 fixture published。

> salt 案例被 01 与 03 共用：一次案例审核影响两题。

### 第六步：案例审核后重新质检

对每个相关候选点「重新质检」。旧 formal 资格与人审结论不得复用。

### 第七步：逐题检查题干 / 选项 / 答案 / 解析

对照 packets：  
- **04 填空**：图无过滤却答过滤 → 建议「退回修改」  
- **02 判断**：题干笼统 / 「更合理」→ 建议修订或书面接受比较题  

### 第八步：逐题检查流程图与装置图

确认 SVG 渲染；schematic 免责；气路/倒吸/尾气 unknown 须人工表态。  
无装置图的题标记为不适用即可。

### 第九步：核对 unknown 与 blocking

顶部「正式发布阻断」；质检 fail 表与 unknown 表。  
清单可勾认已阅 unknown，**不自动变 pass**。

### 第十步：核对 KB 关联计划

注意 `human_unreviewed`；本阶段 **不要** 对候选做正式 KB bind（E2-C）。

### 第十一步：作出真实人工审核决定

- 退回修改 / 驳回：内容有问题时使用  
- 尝试审核通过：须有效案例资格 + 当前质检正式资格；否则服务端拒绝  
- 「保存审核清单」不升格 approved_for_import  

### 第十二步：确认正式发布仍关闭

页面 real publish=OFF；只允许 dry-run。  
**不要**设置 `INDUSTRIAL_FORMAL_REAL_PUBLISH`；不要点真实入库。

---

## 页面能力速查

| 能力 | 状态 |
|------|------|
| 列表 / 详情 / 题干答案解析 | 有 |
| 流程 SVG / 装置 SVG | 有（无则 empty） |
| 案例 / 来源 / 有效审核 | 有 |
| 质检 blocking / unknown | 有 |
| revision / 审计哈希 | 有 |
| KB 计划 | 有 |
| 案例覆盖层 / 清单 / 人审 / dry-run | 有 |
| 修订历史展示 | E2-B3 已补最小展示 |
| 审核历史完整审计 UI | 有限（依赖 revisionHistory） |

---

## 本批次优先建议（非命令）

1. **cand_312c51e0c9e249f7**：优先退回修订（图文冲突）。  
2. **cand_8ce596acabc64f26**：评估是否退回加条件。  
3. 01/03：案例来源核验后再考虑通过。  
4. 全部完成人审且闸门满足后，再另批 **PHASE_E2-C**。
