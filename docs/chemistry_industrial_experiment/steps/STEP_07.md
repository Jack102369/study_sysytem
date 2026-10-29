# STEP_07 · AI工业实验出题器

| 字段 | 内容 |
|------|------|
| 步骤编号 | STEP_07 |
| 步骤名称 | AI工业实验出题器 |
| 开发目标 | AI 辅助生成工业案例与题目；不得直入正式题库 |
| 前置条件 | 专项/分类与协议就绪；质检接口可对齐 |
| 当前状态 | **COMPLETED** |
| 完成时间 | 2026-10-29 |

---

## 计划工作

1. 调查并记录真实 AI 基础设施（DeepSeek / LocalGenerator）
2. 实现 Industrial AI Provider 接口 + HTTP（OpenAI 兼容）+ Mock
3. 请求校验 / 输出 Schema / 提示词模板
4. 案例可信度门禁 + development_only 隔离
5. 生成服务：Definition → Public → SVG → 候选文件
6. 自检脚本与文档

---

## 实际完成内容

- 确认：`LocalGenerator` = 本地模板；真实 LLM 客户端 = `DeepseekClientService`（fetch）
- 新增工业专用 HTTP Provider（可回退 DEEPSEEK_*）+ Mock Provider
- `generateIndustrialAiCandidate` 完整链路（结构校验、投影、SVG、候选写出）
- formal_candidate 拒绝未审核 draft 案例；development_test 强制 development_only
- 未新增 Controller（避免扩大暴露面）；未改 LocalGenerator；未写库
- 真实模型在线调用：**未执行**（配置缺失）

---

## 实际修改/新增文件

### API

- `industrial-ai-provider.types.ts` / `.http.ts` / `.mock.ts`
- `industrial-ai-config.ts`
- `industrial-ai-generator.types.ts` / `.validate.ts` / `.service.ts` / `.selftest.ts`
- `industrial-ai-candidate.service.ts`
- `prompts/industrial-question.{system,user,schema}.ts`
- `apps/api/package.json`（`chem:industrial-ai-selftest`）
- `apps/api/.env.example`（INDUSTRIAL_AI_* 说明，无密钥）

### Docs

- `AI_GENERATOR_DESIGN.md`
- `generated_candidates/task_*/`（Mock 开发候选样例）
- 本文件及进度/测试/决策/NEXT_SESSION

---

## 测试命令

```bash
pnpm --filter api run chem:industrial-ai-selftest
pnpm --filter api run chem:industrial-svg-selftest
pnpm --filter api run chem:industrial-diagram-selftest
pnpm --filter api run chem:industrial-case-selftest
pnpm --filter api run chem:seed-selftest
pnpm --filter api run build
```

---

## 测试结果

- Mock 自检：**通过**
- HTTP 适配（配置缺失 isAvailable=false）：**通过**
- 真实模型在线：**NOT_EXECUTED_CONFIGURATION_MISSING**
- api build：**通过**
- 回归 selftest：**通过**

---

## 验收结果

代码层面 STEP_07 完成标准满足；真实 AI 在线调用如实标记未验证。

---

## 遗留问题

- 真实 DeepSeek/工业模型在线未验证
- STEP_02/03 MySQL 与浏览器仍待验证
- STEP_06 真机 SVG 视觉仍待验证
- 无管理端出题 UI（留 STEP_09）

---

## 下一步建议

STEP_08：工业实验自动质量检查系统。
