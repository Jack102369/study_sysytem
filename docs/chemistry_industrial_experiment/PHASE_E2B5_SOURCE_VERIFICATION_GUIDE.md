# PHASE_E2-B5 · 科学来源核验操作指南

| 字段 | 值 |
|------|-----|
| 证据包 | `docs/chemistry_industrial_experiment/scientific_source_packets/` |
| 页面 | `/settings/chemistry-industrial-candidates` |
| 声明 | **本指南 ≠ 已完成核验** |

---

## 必读原则

自动化证据包 **不构成** `verified_by_admin`。  
点击批准前必须本人阅读原始来源。  
案例通过 ≠ 候选通过 ≠ 正式发布。

---

## 步骤

1. **阅读证据包** INDEX → FACT_MATRIX → 本案例 md → SOURCE_REGISTRY。  
2. **独立打开原始 URL/教材**（优先 ACCESSED；失败项自行补源）。  
3. **核对事实与出处**（对照 FACT_SOURCE_COVERAGE）。  
4. **判断权威性**（中学教材/教育机构优先；高校讲义作边界对照）。  
5. **检查案例与四题一致**（见 QUESTION_EVIDENCE_MAPPING；注意 02 外部证据弱）。  
6. **证据不足 → 保留阻断**（acknowledge_draft / sources_incomplete / cannot_verify）。  
7. **仅当充分时** → 来源=管理员已核验；覆盖层=`approve_for_publish`；意见≥8 字；sourceNotes 覆盖全部 sourceTitle。  
8. **案例审核后** → 相关候选 **重新质检**。  
9. **逐题人审**（退回/通过受闸门约束）。  
10. **正式发布** 仍须另批 E2-C；real publish 默认 OFF。

## 接口字段提醒

`approve_for_publish` 要求每条来源 `verified_by_admin` + `evidenceNote≥8`；服务端写 reviewer/时间/哈希。  
不得改 fixture published；`elevatesFixtureToPublished` 恒 false。
