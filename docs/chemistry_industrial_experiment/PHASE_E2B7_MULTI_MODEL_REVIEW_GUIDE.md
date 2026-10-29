# PHASE_E2-B7 · 多模型独立审核操作指南

| 字段 | 值 |
|------|-----|
| 页面 | `/settings/chemistry-industrial-candidates` |
| API | `GET /chemistry/admin/industrial-candidates/export-review-bundle?batchId=…` |
| 声明 | **导出 ≠ 人审完成；AI 意见 ≠ 批准** |

---

## 1. 管理员如何导出 ZIP

1. 管理员登录。  
2. 打开审核页，批次填 `industrial_formal_candidate_20261029_121958`。  
3. 点击 **导出多模型审核包**。  
4. 浏览器下载 `industrial_review_bundle_20261029_121958.zip`。

## 2. 如何找到 FULL_REVIEW.md

解压 ZIP → 根目录 `FULL_REVIEW.md`（完整题面 + 案例 + 图结构说明 + 质检 + 审核要求）。  
同时打开 `diagrams/*.svg` 做视觉核对。

## 3. 如何提交给不同 AI

分别向 ChatGPT / Claude / Gemini / DeepSeek 等提交**同一份** `FULL_REVIEW.md`（或整包）。  
要求模型：**独立审核，先形成判断，不要先看其他模型意见。**

## 4. 独立审核要求（可复制给模型）

见 ZIP 内 `FULL_REVIEW.md`「统一审核说明」；结果格式见 `review_templates/REVIEW_RESULT_SCHEMA.json`。

## 5. 如何收集意见

按 `REVIEW_TEMPLATE.md` 逐题填写；保存各模型输出到本地笔记/文件（仓库不自动写入模型结论）。

## 6. 如何比较分歧

使用空白表 `review_templates/MULTI_MODEL_COMPARISON.md`。记录模型名、版本、日期、所审 `bundleContentHash`、逐题结论、分歧、待裁决项。

## 7. 如何识别过期意见（STALE_REVIEW）

核对 `manifest.json` 的 `bundleContentHash` 与候选 `revision` / `auditContentHash`。  
若重新导出后 hash 变化，或候选被修订 → 旧 AI 意见标记 **STALE_REVIEW**，不得当最新依据。

## 8. 如何决定退回修订

若多模型指出实质科学/题图冲突问题 → 在审核页「退回修改」或案例 `request_changes`；勿为赶进度强批。

## 9. 为什么多模型一致 ≠ 人工批准

外部 AI 无管理员 JWT、无核验责任；不得写入 `humanDecision` / `verified_by_admin`；正式入库仍属 E2-C 且 real publish 默认 OFF。
