# 工业实验 AI 出题系统设计（STEP_07）

> AI 生成成功 ≠ 化学正确；候选 ≠ 正式题库。质检见 STEP_08，审核入库见 STEP_09。

## 1. 真实 AI 基础设施调查（仓库实查）

| 项 | 结论 |
|----|------|
| 化学 `LocalGenerator` | **本地模板**（`generator-templates.ts`），**不是** LLM |
| 真实 DeepSeek 客户端 | 有：`apps/api/src/ai-reference/deepseek-client.service.ts`（原生 `fetch` → `/chat/completions`） |
| OpenAI 兼容 | DeepSeek / Qwen Vision（高一数学）均为 OpenAI 兼容 HTTP |
| 环境变量 | `DEEPSEEK_API_KEY` / `DEEPSEEK_BASE_URL` / `DEEPSEEK_MODEL`（见 `apps/api/.env.example`） |
| 超时 | DeepSeek `chatMessages` 支持 `AbortController` + `timeoutMs` |
| 重试 | 各业务自管；无统一 Agent 框架 |
| Token | DeepSeek 可选返回 `usage` |
| 管理 AI 开关 | 高一数学有独立开关；化学 LocalGenerator 无 LLM 开关 |
| 依赖 | **未**新增；使用 Node 原生 `fetch` |

**结论：** 复用 DeepSeek 配置约定与 HTTP 模式；工业模块实现独立 Provider，**不改造/不删除** LocalGenerator。

## 2. Provider 设计

### 接口

`IndustrialAiProvider`（`industrial-ai-provider.types.ts`）

- `http`：`IndustrialAiHttpProvider`
- `mock`：`IndustrialAiMockProvider`

### 配置（无密钥写入文档）

| 变量 | 含义 |
|------|------|
| `INDUSTRIAL_AI_ENABLED` | 总开关（默认：有密钥则 true） |
| `INDUSTRIAL_AI_BASE_URL` | API Base |
| `INDUSTRIAL_AI_API_KEY` | 密钥（仅后端环境） |
| `INDUSTRIAL_AI_MODEL` | 模型名 |
| `INDUSTRIAL_AI_TIMEOUT_MS` | 超时 |
| `INDUSTRIAL_AI_MAX_RETRIES` | Provider 内重试 |

未配置 `INDUSTRIAL_AI_API_KEY` 时，HTTP Provider **可回退** `DEEPSEEK_*`。  
配置缺失：**不阻塞 API 启动**；`formal_candidate` 返回明确不可用；`development_test` 默认 Mock。

## 3. 生成调用链

```
IndustrialAiGenerateRequest
  → validate request
  → load IndustrialCase
  → evaluateCaseTrust (formal vs development)
  → Provider.chat (system + user prompts)
  → parse JSON + schema validate
  → rebuild Definition（程序重写 case hash / reviewMetadata）
  → validate Definition + against case
  → stem↔diagram consistency
  → project Public + validate Public
  → renderIndustrialDiagramSvg + render report
  → write generated_candidates/task_* （可选）
  → status: development_only | pending_quality_review
```

**禁止：** 写 `chem_train_items`；设 `approved` / `curriculum_ok`；信任 AI 伪造审核字段。

## 4. 案例可信度

| 模式 | 案例要求 | 产物标记 |
|------|----------|----------|
| `formal_candidate` | `publishEligible` + approved/published + curriculum approved + verified 来源 + reviewedContentHash 匹配 | `pending_quality_review`（仍非正式入库） |
| `development_test` | 结构合法即可（允许 draft） | **强制** `development_only` + `mock_generated`（默认 Mock） |

当前三案例均为 `draft` + `unverified` → **不能**正式候选。

## 5. 提示词与输出

- `prompts/industrial-question.system.ts`
- `prompts/industrial-question.user.ts`
- `prompts/industrial-question.schema.ts`

输出含：question / answer / explanation / diagramDefinition 片段等。  
**不**要 AI 输出 SVG。

## 6. SVG 接入

复用 STEP_05 `projectIndustrialDiagramPublic` + STEP_06 `renderIndustrialDiagramSvg`。  
渲染正确 ≠ 化学正确。

## 7. 候选存储

`docs/chemistry_industrial_experiment/generated_candidates/task_<id>/`

- `request-summary.json`（无完整系统提示词、无密钥）
- `candidate.json`
- `definition.json` / `public-diagram.json` / `diagram.svg`
- `validation-report.json` / `generation-metadata.json`

非公共静态资源；非正式题库。

## 8. 错误分类

`AI_DISABLED` / `AI_CONFIG_MISSING` / `AI_AUTH_FAILED` / `AI_NETWORK_ERROR` / `AI_TIMEOUT` / `AI_INVALID_JSON` / `AI_SCHEMA_INVALID` / `CASE_TRUST_REJECTED` / `DIAGRAM_*` / `SVG_*` 等。

## 9. 安全

- 密钥仅环境变量；不入 Git / 候选文件 / 日志摘要
- 提示词注入防护：案例数据声明为数据非指令
- 模型不得决定审核闸门 / pool / ban_default_train
- 答案与 Public/SVG 隔离

## 10. 已实现 / 未实现

| 已实现 | 未实现 / 未验证 |
|--------|-----------------|
| HTTP Provider 代码 + Mock | **真实模型在线调用**（当前环境无密钥 → NOT_EXECUTED） |
| 完整 Mock 出题链路 + 文件候选 | 管理端 UI / Controller |
| 正式/开发隔离 | STEP_08 化学质检 |
| 题量/超时/有限重试 | Nest Module 强制注册（故意不绑启动） |

## 11. STEP_08 / STEP_09 建议

- STEP_08：确定性规则 + 已审核 KB 优先；AI 审查仅辅助；unknown ≠ pass
- STEP_09：管理员审核后入库；补 SVG 字段或附件策略；不绕过闸门
