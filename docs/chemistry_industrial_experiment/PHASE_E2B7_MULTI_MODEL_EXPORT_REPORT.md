# PHASE_E2-B7 · 多模型独立审核包导出报告

| 字段 | 值 |
|------|-----|
| 执行 | 2026-10-29 15:04:21 +08:00 |
| 状态 | **COMPLETED**（导出功能；**非**外部 AI 已审核） |
| 人审 / 来源核验 / formal | **未执行** |
| real publish | **OFF** |
| 最终验收 | **CONDITIONALLY_ACCEPTED** |

---

## 1. 任务

管理员可导出当前批次只读 ZIP，供多个外部 AI 独立审核；含 FULL_REVIEW、SVG、来源、模板；不改审核态。

## 2–4. 入口与 API

- 页面按钮：**导出多模型审核包**  
- `GET /chemistry/admin/industrial-candidates/export-review-bundle?batchId=…`  
- JWT + Admin；匿名 **401**（已测）  
- 响应：`application/zip` + `Content-Disposition` + `X-Industrial-Bundle-Hash`

## 5. ZIP 结构（E1 实测）

`industrial_review_bundle_20261029_121958.zip`：README、FULL_REVIEW、manifest、candidates×4 md/json、cases×3、sources×4、quality、diagrams（flow×4 + apparatus×2）、review_templates×3。

## 6–11. 内容摘要

| 项 | 结果 |
|----|------|
| 候选 | 4（rev **9/9/7/9**） |
| 案例 | 3 |
| flow SVG | 4 |
| apparatus SVG | 2 |
| 来源文档 | 4 |
| bundleContentHash | 见自检输出 / 响应头 |
| ZIP 依赖 | **无新增**（Node zlib 最小 ZIP） |

## 12. 多模型模板

`REVIEW_TEMPLATE.md` / `REVIEW_RESULT_SCHEMA.json` / `MULTI_MODEL_COMPARISON.md`（空白；未伪造模型意见）。

## 13. 安全

batchId 校验；路径穿越拒绝；跳过 `_phase_*`；不含 .env/JWT/密码/学生数据；只读；导出前后 revision/humanDecision 不变。

## 14. 修改文件

- `industrial-zip-minimal.ts`  
- `industrial-review-export.service.ts`  
- `industrial-review-export.selftest.ts`  
- `industrial-review.controller/nest/dto`  
- `package.json` script  
- `industrial-review.ts` + `ChemistryIndustrialCandidatesView.vue`  
- 本报告 + GUIDE + 进度文档 / NEXT_SESSION  

## 15–17. 测试与构建

export / e2b6 / e2b5 / e2b4 / e2b2 / review / quality / case / list **PASS**；api/web build **PASS**。

## 18–19. 真实下载

管理员 JWT HTTP / 浏览器下载：**NOT_EXECUTED**（待用户）。

## 20–21. 状态 / DB

审核态未因导出改变；无业务写库。

## 22–24. Git / 文档 / 验收

未自动 commit；文档已同步；**CONDITIONALLY_ACCEPTED**。

## 下一步

管理员导出 ZIP → 分发外部 AI 独立审核 → 用 COMPARISON 表汇总 → 再回审核页做人审（PART B）。
