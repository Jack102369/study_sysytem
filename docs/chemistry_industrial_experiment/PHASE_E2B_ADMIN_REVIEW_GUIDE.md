# PHASE_E2-B / E2-B2 · 管理员人工审核操作指南

| 字段 | 值 |
|------|-----|
| 批次 | `industrial_formal_candidate_20261029_121958` |
| 页面路径 | `/settings/chemistry-industrial-candidates` |
| 说明 | **操作说明 ≠ 已完成真实审核** |
| 更新 | 2026-10-29（含 E2-B7：导出多模型审核包） |

---

## 1. 进入审核页

1. 使用**管理员账号**登录（JWT + Admin）。  
2. 打开 `/settings/chemistry-industrial-candidates`。  
3. 批次过滤默认 E1 批次 ID。  
4. 若曾出现 `replace` / 列表失败：确认 API 已加载列表 bugfix（见 PHASE_E2B2_CANDIDATE_LIST_BUGFIX.md），刷新页面。  
5. 若表头正常但「暂无候选」：多为前端未解包 `{ success, data }`（见 PHASE_E2B2_CANDIDATE_LIST_REAL_UI_FIX.md）。请硬刷新后确认表格 **4** 行。  
6. **PHASE_E2-B6/B7**：真实操作以 [PHASE_E2B6_ADMIN_ACTION_CHECKLIST.md](./PHASE_E2B6_ADMIN_ACTION_CHECKLIST.md) 为准；可先点 **导出多模型审核包**（见 [PHASE_E2B7_MULTI_MODEL_REVIEW_GUIDE.md](./PHASE_E2B7_MULTI_MODEL_REVIEW_GUIDE.md)）。外部 AI 意见 ≠ 人审批准。洗气可能 **SOURCE_EVIDENCE_INCOMPLETE**。Cursor 不得代审。

---

## 2. 查看原始案例

抽屉「案例（原始 fixture vs 有效审核）」：

- **fixture 状态**：仍为 `draft`（源文件未改 published）  
- **有效审核态 / 有效来源 / 有效 publishEligible**：来自覆盖层解析  
- **覆盖层决策 / 是否当前 / 阻断原因**  
- **案例哈希 vs 审核绑定哈希**

不得把「有效 approved」误读成 fixture 已改写为 published。

---

## 3. 查看来源证据

「科学来源」表：类型、标题、fixture 核验态、标识、说明、风险；页顶有 unverified 警告。  
仓库辅助材料：`scientific_source_packets/`（**≠** verified_by_admin）。  
KB 计划表：注意 `human_unreviewed` 标签——须管理员明确确认科学依据，不得一键虚构教材页码。

---

## 4. 如何提交真实案例审核（覆盖层）

1. 将来源核验选为 **管理员已核验**。  
2. 「案例覆盖层」选 **批准有效发布资格 (approve_for_publish)**。  
3. 审核意见 ≥8 字（作为证据）。  
4. 点 **提交案例审核覆盖层**。  
5. 服务端校验：来源全覆盖、证据、哈希；写入 `var/industrial-case-review/`。  
6. **相关候选质检/人审失效** → 必须 **重新质检**。

意见类决策（acknowledge_draft 等）不授予有效发布资格。

---

## 5. 确认案例有效状态

材料包字段 `case.effectiveReview`：

- `grantsEffectivePublishEligibility=true` 且 `isCurrent=true` → 可信度闸门可解除  
- fixture 仍显示 draft

---

## 6. 候选重新质检

案例审核或改题后：点 **重新质检**。  
旧 `formalPublishEligible` / 人审结论不得复用。

---

## 7. 检查候选审核资格

顶部「正式发布阻断」列表；质检 fail / unknown 表。  
`CURR_CASE_TRUST` / `CHEM_SOURCE_VERIFIED` 在有效案例审核后应可变为 pass；其它阻断与 unknown 仍须人工处理。

---

## 8. 逐题人工审核

- **退回修改 / 驳回**：质检失败时也可  
- **尝试审核通过**：须有效案例资格 + 当前质检正式资格；否则服务端拒绝  
- 审核人/时间/审计哈希仅服务端写入

---

## 9. 确认未知风险

unknown **不得**视为通过；清单可记录已阅，不自动 pass。

---

## 10. 正式发布 dry-run

点 **正式入库 dry-run**。默认 dry-run；响应不得假装已创建正式题 ID。

---

## 11. 为什么本阶段不能 real publish

- `INDUSTRIAL_FORMAL_REAL_PUBLISH` 默认关闭  
- 真实写库需：`dryRun=false` + `confirmRealPublish=true` + env 开启  
- E2-B2 **仅准备代码路径**；未对 `study_system` 写 formal

---

## 12. 后续真实发布需要什么授权

1. 管理员完成案例有效审核 + 候选重质检 + 逐题人审  
2. 用户明确批准 **PHASE_E2-C**  
3. 运维/负责人显式开启 `INDUSTRIAL_FORMAL_REAL_PUBLISH`（不得因 NODE_ENV 自动开）

---

## API（管理员）

| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/chemistry/admin/industrial-candidates` | 列表（含 realPublishEnabled） |
| GET | `.../:id` | 详情 + `adminReviewPacket` |
| POST | `.../case-review` | 案例覆盖层（含 approve_for_publish） |
| POST | `.../:id/recheck-quality` | 重质检 |
| POST | `.../:id/human-review` | 人审 |
| POST | `.../:id/formal-import` | 默认 dry-run；真实需开关+确认 |

禁止：要求用户手改数据库；AI 代审；伪造 verified/published。
