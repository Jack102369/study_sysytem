# APPLICATION-3E-1 · 应用题双模型批改选择

> **日期**：2026-10-25  
> **状态**：**PARTIAL**（协议 + 调度矩阵 + 前端选择 + stub 自测 + build；无真实 AI / 无迁移 / 未重启 API）  
> **真实外发**：**0**

---

## 1. 范围

| 做了 | 未做 |
|---|---|
| `gradingProvider`: `qwen` \| `deepseek`（新答默认 qwen） | 真实 Qwen / DeepSeek 调用 |
| submit 按矩阵入队 vision / text / dual | 迁移 / synchronize |
| Qwen 纯文字走 Vision client（无图） | 重启 API |
| DeepSeek + 含图：Qwen 转写 → DeepSeek 评分 | CORE-1B |
| 前端 Radio + 结果页模型文案 | 静默把 qwen 改成 deepseek |

---

## 2. 调度矩阵

| provider | 内容 | pipeline | 队列 | 开关不足 |
|---|---|---|---|---|
| qwen | 有图 | `qwen_vision` | vision | `review_required` |
| qwen | 纯文字 | `qwen_text` | vision | `review_required` |
| deepseek | 纯文字 | `deepseek_text` | text | `review_required` |
| deepseek | 有图 | `qwen_then_deepseek` | dual | `review_required` |

开关不足时**不**改写 provider。

---

## 3. 主要改动

**API**

- `answer-protocol.ts` / `user-answer.validate.ts` / `hs-math.constants.ts`
- `hs-math-application-grade-dispatch.ts`（新）
- `hs-math-ai-grade-vision-transcribe.prompt.ts`（新）
- `hs-math-application-ai-grade.service.ts`（qwen 文本、dual、`scheduleDualGrading`、ai_grade 元数据）
- `hs-math-train.service.ts` submit 入队
- `ai-grade-protocol.ts` 元数据字段

**Web**

- `MathApplicationInput.vue` Radio
- draft / `buildApplicationUserAnswer` 带 `gradingProvider`
- `HsMathTrainResultView.vue` 展示「千问」/「DeepSeek（千问识别）」
- `hs-math-grading-provider.ts`

---

## 4. 测试

| 项 | 结果 |
|---|---|
| `pnpm --filter api run hs-math:application3e1-selftest` | **PASS 15** |
| `pnpm --filter web run hs-math:application3e1-selftest` | **PASS 7** |
| `pnpm --filter api run build` | **PASS** |
| `pnpm --filter web run build` | **PASS** |

未外发图片 / 未调真实模型。

---

## 5. 数据库

无迁移、无写库验收。`ai_grade_json` 扩展字段存 JSON，不建表。

---

## 6. 下一阶段建议

1. 授权后：按矩阵做小样本 live（qwen 文字 / dual 各 ≤N 次 HTTP）。  
2. 或启动 **CORE-1B**（若产品优先入口）。  
3. UI 人工点验：会话选模型 → 提交锁定 → 结果页文案。

---

## 7. 阶段结论

**APPLICATION-3E-1 = PARTIAL**  
**APPLICATION-3 / 3D = PARTIAL** · **3C = PASS** · **CORE-1B = NOT_STARTED**
