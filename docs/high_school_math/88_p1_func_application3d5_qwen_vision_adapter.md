# APPLICATION-3D-5 · Qwen 27B 多模态应用题批改接入

> **日期**：2026-10-25  
> **状态**：**PARTIAL**（代码 + stub 测试完成；**未**真实调用 Qwen；**未**外发学生图片）  
> **APPLICATION-3D / APPLICATION-3**：PARTIAL  
> **APPLICATION-3C**：PASS（文字 DeepSeek 不受影响）

---

## 1. 修改文件

**新增**

- `apps/api/src/hs-math/train/hs-math-qwen-vision-client.service.ts`
- `apps/api/src/hs-math/util/hs-math-vision-image-loader.ts`
- `apps/api/src/hs-math/util/hs-math-ai-grade-vision.prompt.ts`
- `apps/api/src/hs-math/util/hs-math-application3d5.selftest.ts`
- `docs/high_school_math/88_p1_func_application3d5_qwen_vision_adapter.md`

**修改**

- `apps/api/src/hs-math/hs-math.constants.ts`
- `apps/api/src/hs-math/hs-math.module.ts`
- `apps/api/src/hs-math/train/hs-math-application-ai-grade.service.ts`
- `apps/api/src/hs-math/train/hs-math-train.service.ts`
- `apps/api/src/hs-math/types/ai-grade-protocol.ts`
- `apps/api/src/hs-math/util/hs-math-ai-grade.validate.ts`
- `apps/api/src/hs-math/util/hs-math-application3a.selftest.ts`（路由 `vision_ai`）
- `apps/web/src/views/hs-math/HsMathTrainResultView.vue`
- `apps/api/package.json`、`apps/api/.env.example`
- `docs/high_school_math/PROJECT_HANDOFF.md`

---

## 2. 配置

| 变量 | 默认 | 说明 |
|---|---|---|
| `HS_MATH_VISION_GRADING_ENABLED` | `false` | 总开关 |
| `HS_MATH_VISION_API_URL` | 空 | 服务端固定 http(s) base；禁止前端传入 |
| `HS_MATH_VISION_API_KEY` | 空 | Bearer；不写日志 |
| `HS_MATH_VISION_MODEL` | `qwen3.8-27b` | 请求 model |

外发条件：开关为 true **且** URL 合法 **且** KEY 非空。  
与 `HS_MATH_AI_GRADING_ENABLED` / DeepSeek **独立**。

---

## 3. 请求协议

OpenAI Chat Completions 兼容：

`POST {normalized}/v1/chat/completions`

```json
{
  "model": "qwen3.8-27b",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "system+user 评分说明" },
        { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,..." } }
      ]
    }
  ],
  "max_tokens": 2000,
  "stream": false
}
```

未添加未经验证的非标准参数。

---

## 4. 图片安全

- 仅读：当前 `userId` + `sessionItemId` + `user_answer_json.imageIds` + `status=submitted`
- 保序去重，最多 5 张；校验 MIME / 大小 / 文件存在
- 拒绝 draft、他用户、缺失、非法 MIME、超限
- 私有 `storage_key` → Buffer → Base64；**不**暴露 key、**不**挂公开 static、**不**日志 Base64
- 不修改 / 不删除原图

---

## 5. 多图顺序

`imageIds` 去重后**保持提交顺序**加载并发给 Vision（content 中 image_url 顺序一致）。

---

## 6. Rubric 复用

继续使用 `validateHsMathAiGradeResult`：key 完整/不重复/未知拒绝、整数分、不越界、total=分项和、confidence、feedback、personalizedExplanation。

可选写入 `ai_grade_json`：`inputModality` / `imageCount` / `recognitionWarnings`（**无迁移**）。

---

## 7. 状态流转

| 条件 | 结果 |
|---|---|
| 纯文字 submit | `pending_ai` → 文字 DeepSeek 路径 |
| 含图 + Vision **关** | `review_required` / `awaiting_multimodal` |
| 含图 + Vision **开** | `pending_ai` / `awaiting_vision_ai` → Vision 路径 |
| 校验通过且识别确定 | `graded` |
| `recognitionUncertain` 或含图 confidence&lt;0.5 | `review_required` / `uncertain_recognition`（**不写分**） |
| API/JSON/rubric/读图失败 | `grading_failed` |

含图**不会**进入文字 DeepSeek 调用。

---

## 8. 并发幂等

复用 `inFlight`、短事务 claim、`ai_attempt_count`、已 `graded` 不覆盖。  
**不**扫描历史 `review_required`；仅对本 session 刚提交的 itemIds 调度。

---

## 9. 测试

```bash
pnpm --filter api run hs-math:application3d5-selftest
pnpm --filter api run hs-math:application3a-selftest
```

覆盖 A–U（loader / validate / 路由 / 四题型 / 文字兼容）；全部 stub，无真实 HTTP。

---

## 10. 未执行：真实 API 调用

本轮**未**调用 Qwen / 任何云视觉；默认开关关闭。

---

## 11. 未授权：图片外发

本轮**未**读取或发送学生历史图片；未批量处理 `review_required`。

---

## 12. 下一步真实联调计划（须另授权）

1. 配置 `HS_MATH_VISION_*` 并显式授权外发测试图（虚构夹具，非学生隐私）。  
2. 单图 → 多图 → 手写 → 图象题联调。  
3. 核对 rubric JSON 与不确定分支。  
4. 通过前不得标 APPLICATION-3D-5 = PASS。
