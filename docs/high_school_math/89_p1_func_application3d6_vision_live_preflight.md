# APPLICATION-3D-6 · Qwen Vision 真实多模态批改联调准备（预检）

> **日期**：2026-10-25  
> **状态**：**WAITING_FOR_AUTHORIZATION**（仅预检与方案；**未**调用 Qwen；**未**发图；**未**重启 API；**未**写库）  
> **前置**：APPLICATION-3D-5 = PARTIAL（stub 22 PASS）；用户侧曾独立验证单图 JPEG 识别成功  
> **请求模型**：`qwen3.8-27b` · **用户侧实测响应模型**：`qwen3.8-27b-orca-q8`

---

## 1. API 配置准备情况

| 变量 | 当前 `apps/api/.env` | 目标 |
|---|---|---|
| `HS_MATH_VISION_GRADING_ENABLED` | **缺失**（等价默认关） | 联调时脚本内可临时读 KEY，但**全局开关建议保持 false**（对齐 3C：避免 submit schedule 误外发） |
| `HS_MATH_VISION_API_URL` | **缺失** | 填入用户已验证的 OpenAI 兼容 base（http/https）；禁止前端传入 |
| `HS_MATH_VISION_API_KEY` | **缺失** | 填入 KEY；**不**提交 Git（`.gitignore` 已含 `.env`）；**不**写入日志 |
| `HS_MATH_VISION_MODEL` | **缺失** | 建议 `qwen3.8-27b`（与用户验证一致） |
| `HS_MATH_AI_GRADING_ENABLED` | `false` | 保持 false（文字 DeepSeek 与 Vision 独立） |

`.env.example` 已列出 Vision 变量模板；运行时 `.env` **尚未配置 Vision**。  
本预检**未**打印、未复制、未提交任何密钥。

代码侧能力已就绪：

- `HsMathQwenVisionClientService`（fetch / max_tokens=2000 / stream=false）
- `HsMathApplicationAiGradeService.scheduleVisionGrading` / `gradeOneVisionSessionItem`
- `loadVisionImagesForGrading` + `validateHsMathAiGradeResult`

---

## 2. 测试样本准备情况

| ID | 意图 | 目标验收 | 本机状态 |
|---|---|---|---|
| A | 正确手写（或清晰虚构手写）全解 | **10/10** | **未备** |
| B | 部分正确手写（建模对、对称轴错等） | 保留过程分（类比 3C-B） | **未备** |
| C | 明显错误手写 | 低分或合法 0 | **未备** |
| D | 短文字 + 1 张图 | 混合模态共同评分 | **未备** |
| E | 多图连续（≥2，顺序建模→定义域→求解） | 顺序与完整推导 | **未备** |
| F | 函数图象（顶点/开口/坐标） | 图象关键信息可评或不确定→`review_required` | **未备** |

**已有但不可冒充本轮手写联调样本**：

- `apps/api/src/hs-math/integration/fixtures/application3d1-ocr/` 共 **9** 张 **PRINTED_ONLY**（3D-1 印刷体 OCR 夹具）。  
  可用于「印刷体冒烟」备选，**不得**写成手写 PASS。

**建议目录**（待用户放入虚构图，联调执行阶段再创建）：

`apps/api/src/hs-math/integration/fixtures/application3d6-vision/`

命名建议：`A_hand_correct.jpg` … `F_hand_graph.jpg`；文件内标注「3D-6虚构·非学生作业」。

**禁止**：读取/复用已有学生历史图片、session 51/55/56 或其它生产作答图。

---

## 3. API 重启需求

| 项 | 值 |
|---|---|
| 当前 :3000 | LISTENING PID **5456**（启动于 **16:21:27**） |
| 3D-5 dist | `hs-math-qwen-vision-client.service.js` 约 **20:15:02** |
| 结论 | **需要重启**（进程早于 3D-5 产物；运行中 API **未**加载 Vision 代码） |
| 本轮 | **未重启**（待用户明确授权） |

建议授权后：`pnpm --filter api build` → 停 5456 → `node dist/main.js`（cwd=`apps/api`）；`.env` 中 Vision **全局开关保持 false**。

---

## 4. 测试入口（设计，未实现执行）

对齐 APPLICATION-3C：

1. **正式业务路径**：`HsMathTrainService` 建 session（正式题 `HSMA-RJA-CH03-APP-0001` / item 151）→ 上传虚构图（`HsMathApplicationImagesService`）→ save 答案（`imageIds` / 可选 text）→ submit。  
2. **批改**：`NestFactory.createApplicationContext(AppModule)` 取 `HsMathApplicationAiGradeService` + `HsMathQwenVisionClientService`。  
3. **开关**：`.env` 保持 `HS_MATH_VISION_GRADING_ENABLED=false`，避免 submit 异步 schedule 外发；脚本用**显式 invoker** 包一层真实 `gradeApplicationVision`，并带 **HTTP 计数器**。  
4. **不得绕过**：属主校验、`submitted`、rubric 校验、`ai_grade_json` 持久化。  
5. **脚本名建议**（授权执行阶段再写）：`apps/api/src/hs-math/integration/hs-math-application3d6-vision-live.ts` + `pnpm --filter api run hs-math:application3d6-vision-live`。  
6. **新 session only**；不影响 51/55/56；不覆盖已有 `graded`；不改题库。

本预检**未**创建该脚本、**未**发起任何 Vision HTTP。

---

## 5. 调用次数建议

| 项 | 建议 |
|---|---|
| 上限 | **最多 6 次** HTTP（A–F 各 1；失败也计入） |
| 重试 | **禁止**无限重试；单样本失败不自动补发 |
| 实际次数 | **必须由用户单独批准**（本轮未批准 → 0 次） |
| 记录字段 | model（请求/响应）、耗时、token/usage、状态、评分、异常 |

---

## 6. 图片外发范围（联调时）

- **仅** A–F 虚构夹具（用户准备）。  
- 经服务端私有盘 → Base64 data URL → Qwen；**不**公开 static / JWT 图链。  
- **不**扫 `review_required`；**不**批量历史。  
- 日志：imageCount / bytes≈ / latency / usage；**禁止**完整 Base64 / KEY / 学生全文。

---

## 7. 数据隐私风险

| 风险 | 缓解 |
|---|---|
| 误用学生历史图 | 夹具目录隔离 + 脚本硬编码路径 + 禁止查旧 image 表 |
| 全局开关误开 | 联调保持 `HS_MATH_VISION_GRADING_ENABLED=false`；仅 invoker 外发 |
| KEY 泄露 | 仅 `.env`；gitignore；文档不贴值 |
| storage_key 暴露 | API 响应永不返回 key（沿用现有 public view） |

---

## 8. Rubric 验收规则

正式题 rubric（与 3C 相同）：`model` 3 + `domain` 2 + `solve` 3 + `conclusion` 2 = **10**。

服务端 `validateHsMathAiGradeResult`：

- key 齐全、不重复、无未知 key  
- 整数分、不越界、`totalScore`=分项和 ≤ maxScore  
- feedback / personalizedExplanation 非空  
- `recognitionUncertain` 或含图 confidence&lt;0.5 → **`review_required`，不写假分**  
- API/JSON 失败 → **`grading_failed`，不记 0 分进 accuracy**

数学关注点：平方与负号、定义域、多步推导、图象顶点/开口（F 允许「看不清→不确定」）。

---

## 9. 数据库验收规则

联调执行后（本轮不做）只读核对新 session_item：

| 字段 | 期望 |
|---|---|
| `grade_result` | `graded` / `review_required` / `grading_failed`（按样本） |
| `ai_grade_json` | 合法结构化分；可含 `inputModality` / `imageCount` / `recognitionWarnings` |
| `ai_model` | 实际返回模型截断（可能为 `qwen3.8-27b-orca-q8`） |
| `ai_graded_at` / `ai_attempt_count` | 有值；attempt 合理 |
| `user_answer_*` | **未被覆盖** |
| 图片行 | 仍 `submitted`；文件仍在 |
| session 计数 | `graded` 不计 correct/wrong；pending-like 计入 pending |
| 历史 API | completed reveal 可读 `aiGrade` |

**禁止**：改正式题库；动旧 session 51/55/56。

---

## 10. 所需授权（下一步联调执行）

用户需**明确书面授权**，建议包含：

1. 在 `apps/api/.env` 写入 Vision URL/KEY/MODEL（全局 ENABLED 建议仍 false）。  
2. **授权重启**本地 API:3000（加载 3D-5）。  
3. **授权**使用虚构 A–F 图片调用真实 Qwen，**最多 N 次 HTTP**（建议 N≤6）。  
4. 确认样本为虚构、非学生隐私。  
5. 允许新建测试 session / 写入对应 `ai_*` 字段（不影响旧会话）。

无上述授权：**不得**调用、发图、重启、开全局 Vision。

---

## 11. 下一步执行步骤（授权后）

1. 用户放入 A–F 虚构图到约定夹具目录。  
2. 配置 `.env` Vision 三项；ENABLED 保持 false。  
3. 用户授权 → build + 重启 API:3000。  
4. 实现并运行一次性 `application3d6-vision-live`（计数器封顶）。  
5. 记录 raw JSON（无 KEY / 无 Base64）→ 更新 89 为执行报告或另开 90。  
6. 通过前 **APPLICATION-3D-5 / 3D-6 不得标 PASS**。

---

## 本轮未执行清单

- [x] 只读检查配置 / 进程 / 代码产物  
- [x] 设计 A–F 与入口 / 次数 / 验收  
- [ ] 调用真实 Qwen  
- [ ] 发送任何图片  
- [ ] 重启 API  
- [ ] 启用全量视觉批改  
- [ ] 读取学生历史图片  
- [ ] 修改数据库 / 题库  

**预计费用**：UNKNOWN（未调用；单价未提供）。
