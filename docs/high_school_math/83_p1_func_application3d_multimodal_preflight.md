# P1-FUNC · APPLICATION-3D-0 多模态 AI 手写图片批改接入预检

> **执行时间**：2026-10-25  
> **范围**：只读检查 + 技术选型 + 业务方案 + 文档  
> **禁止本轮**：调外部 AI、外发图片/文字、改业务代码、装 SDK、改库/迁移、重启/部署  
> **APPLICATION-3D**：**NOT_STARTED**（预检 ≠ 开工）  
> **APPLICATION-3C**：**PASS**  
> **APPLICATION-3**：**PARTIAL**  
> **APPLICATION-2F**：**PARTIAL**  
> **CORE-1A-4B**：**BLOCKED** · **CORE-1B**：**NOT_STARTED**

---

## 1. 已有 AI 能力

| 能力 | 现状 |
|---|---|
| 文本批改 | `DeepseekClientService.gradeHsMathApplicationText` + 正式 prompt/rubric 校验；3C 真实联调 A10/B7/C0 **PASS** |
| 配置 | `DEEPSEEK_*`；`HS_MATH_AI_GRADING_ENABLED` 默认 **false** |
| 多模态 DeepSeek | **现封装不支持**（`messages.content` 仅为 string；无 image/base64/vision） |
| OpenAI / Gemini / 通义 VL / 豆包视觉 | **仓库未配置** Key、未接入客户端 |
| 本地 OCR | `OcrClientService` → `OCR_BASE_URL`（Paddle）+ `OCR_FORMULA_BASE_URL`（Pix2Text）；**本地 HTTP**，按 path/buffer 识别文本；**不**等于已验证的手写高数批改闭环 |
| 批改落库 | `ai_grade_json` / `ai_model` / `ai_graded_at` / `ai_attempt_count`（3B 已迁移） |
| 含图现状 | submit → `review_required` / `awaiting_multimodal`；**不**调文本 AI |

---

## 2. 可复用代码

| 模块 | 用途 |
|---|---|
| `HsMathApplicationAiGradeService` | 状态机、幂等、claim/commit、session 重计；扩展「含图」分支 |
| `validateHsMathAiGradeResult` | 继续严格 rubric 校验 |
| `buildHsMathApplicationAiGradePrompt` | 文字路径；图片路径可扩展「识别稿 + 原文字」输入 |
| `readApplicationImageFile` + `HsMathApplicationImagesService.getBinary` | 私有盘 Buffer；属主/JWT 已在业务层 |
| `extractApplicationImageIds` / 答案协议 | 仅批改答案引用的 imageIds |
| `classifyApplicationSubmitRoute` | 含图路由；3D 改为可进入 multimodal 队列 |
| 前端结果页 / `MathGradeTag` | 已识别 `review_required` / `graded` 等 |

**不**重建评分系统；**不**把 JWT 图片 URL / `storage_key` 交给模型。

---

## 3. 模型候选（基于仓库事实 + 待核实）

| 候选 | 仓库现状 | 图片输入 | 备注 |
|---|---|---|---|
| DeepSeek Chat（现用） | 已接入 | **否**（当前封装） | 文字路径已 PASS |
| DeepSeek 是否提供 Vision API | 未接入 | **NEEDS_OFFICIAL_VERIFICATION** | 不得假定已支持 |
| 通义千问 VL | 无配置 | **NEEDS_OFFICIAL_VERIFICATION** | 中文生态常见选项 |
| 豆包 / 火山方舟视觉 | 无配置 | **NEEDS_OFFICIAL_VERIFICATION** | |
| OpenAI GPT-4o 等 vision | 无配置 | **NEEDS_OFFICIAL_VERIFICATION** | 跨境与训练政策需核实 |
| Gemini vision | 无配置 | **NEEDS_OFFICIAL_VERIFICATION** | |
| **本地 OCR → DeepSeek 文本批改** | OCR + DeepSeek 均已有 | 像素**不**外发 | 质量（手写公式/多图/图象）**待实测** |

**不得编造**官方价格、数据保留与是否用于训练；一律标 **NEEDS_OFFICIAL_VERIFICATION**。

---

## 4. 模型能力比较（实施前核对清单）

对任一候选须正式文档确认：

1. 是否真正支持图片输入（多 part / base64 / URL）  
2. 中文指令与中文手写  
3. 手写数学公式  
4. 函数图象 / 坐标轴  
5. 多图（本系统最多 5）  
6. 结构化 JSON  
7. 单图大小上限 vs 本系统 10MB  
8. 服务端 API 可用性  
9. 是否必须新 SDK（优先 `fetch` 最小适配器）  
10. 数据是否跨境  
11. 是否用于训练 / 可否关闭  
12. 计费方式  
13. 超时与限流  
14. 是否适合个人学习系统（成本与合规）

本预检**未**调用任何官方 API，故上表能力列均为 **待核实**，非实测结论。

---

## 5. 数据政策待核实项（NEEDS_OFFICIAL_VERIFICATION）

选定服务商后必须书面确认再授权外发：

1. 服务商名称与法人主体  
2. API endpoint 区域  
3. 图片传输方式（multipart / base64 / 临时 URL）  
4. 是否跨境  
5. 日志/保留时长  
6. 是否用于模型训练  
7. 训练用途关闭开关  
8. 删除/导出机制  
9. 图片大小与张数限制  
10. 费用与账单口径  

**在用户明确授权「图片像素外发」前：禁止发送学生图片。**

---

## 6. 推荐方案（架构）

```
submit 含图
  → grade_result = review_required | pending_ai（策略定）
  →（授权后）异步 HsMathApplicationAiGradeService.gradeImageAnswer
       → 校验属主 + status=submitted + 仅答案 imageIds
       → 读私有 Buffer（顺序=答案 imageIds 去重保序）
       → MultimodalAdapter.grade({ stem, standard, rubric, text?, images[] })
       → validateHsMathAiGradeResult（复用）
       → 写 ai_* + graded | grading_failed | 保持 review_required
```

**适配器优先最小**：`HsMathMultimodalGradeClient` 接口 + 一种实现；**不**新建平行评分域模型。

### 6.1 路径优先级建议

| 优先级 | 路径 | 像素外发 | 条件 |
|---|---|---|---|
| P0 调研 | **本地 OCR（formula/smart）→ 现有 DeepSeek 文本批改** | 否 | 需授权做**虚构样张**质量 spike；不达线则放弃作主路径 |
| P1 | **单一云多模态**（通义 VL / 豆包 / 其他经核实） | 是 | 须隐私授权 + 官方政策核实 + ≤N 次联调授权 |
| 不推荐默认 | OpenAI/Gemini 未经合规评估 | 常跨境 | 个人站慎用 |

**当前推荐对外表述**：  
- **短期工程推荐**：扩展现有批改服务 + 多模态适配器接口；先评估 **本地 OCR 管道**（零外发）。  
- **云多模态推荐服务商/模型名**：**待官方核实后由用户选定**（本预检不定价、不定死品牌）。

---

## 7. 图片读取方案

1. 仅服务端：`readApplicationImageFile(storageKey)` 得 Buffer + DB `mime_type`。  
2. 前置校验：JWT 用户 = `image.user_id` = session.user_id；`status === submitted`；id ∈ 答案 `imageIds`。  
3. **禁止**：公开 URL、JWT 查询串、把 `storage_key` 发给模型、读 draft、读未引用图、批量扫历史 `review_required`。  
4. 传输给云模型时（若授权）：内存 base64 data URL 或 multipart；**不**落普通业务日志。

---

## 8. 多图协议

| 规则 | 设计 |
|---|---|
| 张数 | 1–5（现常量） |
| 顺序 | **答案 `imageIds` 数组顺序**（去重保首见序）；与 sort_order 对齐展示 |
| 文字 | 若有 `text`，一并入 prompt；纯图则 text 空 |
| 重复 id | 作答校验已去重；批改侧再防御去重 |
| 缺失行 / 文件 | → `grading_failed` 或保持 `review_required`；**不**假 0 分 |
| MIME/魔数不符、损坏 | 同上；不编造识别 |
| 多图部分失败 | **不得**只评第 1 张就结案；任意图不可用 → 整题不 `graded`（失败或复核） |

---

## 9. Rubric 复用

- **必须**继续走 `validateHsMathAiGradeResult`。  
- `recognizedWork` 存识别出的解答稿（可含「图1/图2」分段）。  
- 可选写入 **JSON 内**字段（无需新列）：`inputModality: "image"|"mixed"`，`imageCount`，`recognitionConfidence`，`recognitionWarnings[]`。  
- **不**信任模型自报 maxScore。

---

## 10. 状态流转

```
含图 submit → review_required
（授权批改）→ grading → graded
                 ↘ grading_failed
                 ↘ review_required（识别不确定 / 低置信）
```

约束：不覆盖学生答案；不改图片 submitted；不删图；超时/失败 ≠ wrong/0 分；不影响四题型与已 graded 文字题；幂等防双写。

---

## 11. 成本与隐私

| 控制 | 要求 |
|---|---|
| 默认关闭 | 独立开关如 `HS_MATH_AI_VISION_ENABLED`（建议与文字开关分离） |
| 范围 | 单 session_item；不扫历史 |
| 重试 | 有上限；失败计入次数；不自动第 4 次付费 |
| 幂等 | 已 graded 不重复外发 |
| 日志 | 无图片字节、无完整识别稿可配置脱敏 |
| 隐私 | 学生图 = 个人学习数据；外发须单独授权 |

**预计费用**：云路径 **NEEDS_OFFICIAL_VERIFICATION**；本地 OCR 主要为自建算力电费（本机）。

---

## 12. 数据库是否需要迁移

| 方案 | 结论 |
|---|---|
| **优先** | **不需要新迁移**：复用已有 `ai_*`；模态元数据进 `ai_grade_json` |
| 可选后续 | 若要审计「每次外发 attempt / 图哈希」再考虑独立表（须另授权设计） |

---

## 13. 最小实施任务（建议拆分）

| 阶段 | 内容 |
|---|---|
| **3D-1** | 多模态客户端接口 + 配置开关（默认关）；可选 stub |
| **3D-2** | 私有多图读取、顺序、校验（属主/submitted/引用） |
| **3D-3** | 接线 `AiGradeService` 含图路径 + 复用 rubric 校验 |
| **3D-4** | stub/fake 多模态 DB 业务测试（无外发） |
| **3D-5** | （授权后）真实联调：OCR spike 和/或云 VL ≤N 次**虚构样张** |
| **3D-6** | 学生 UI 验收（无 Playwright 平台建设） |

可并行调研：本地 OCR 质量 vs 云 VL；**先质量 spike 再锁厂商**。

---

## 14. 风险

1. 手写公式/多页连续性识别不可靠 → 误判；必须低置信 → `review_required`。  
2. 本地 OCR 对图象题可能不足。  
3. 云路径隐私与训练用途未核实。  
4. 10MB×5 可能超部分模型上限 → 需压缩策略（实施时设计，本轮不定）。  
5. 与文字批改共用开关易误外发 → **建议独立 vision 开关**。

---

## 15. 需要用户授权的操作

1. 开始 **APPLICATION-3D-1** 代码（适配器，默认关，无外发）。  
2. **本地 OCR 质量 spike**（仅虚构/自备样张，像素不出本机）。  
3. **选定云厂商**后：核实政策文档。  
4. **图片像素外发**真实联调（次数上限、虚构样张）。  
5. 若需新迁移/新依赖：单独说明原因。  
6. 不进 CORE-1B / 不解封 1A-4B。

---

## 16. 预检问答摘要

1. **已有视觉模型？** 无已接入的云视觉；仅有本地 OCR 服务配置。  
2. **推荐服务商？** 优先评估本地 OCR；云厂商待核实后选定。  
3. **推荐模型？** 未锁定；**NEEDS_OFFICIAL_VERIFICATION**。  
4. **手写数学？** 本地/云均待实测。  
5. **多图？** 业务已支持 ≤5；模型侧待核实。  
6. **JSON？** 文字路径已有；视觉路径须强制 JSON + 服务端校验。  
7. **新依赖？** 目标否（`fetch` 适配器）；若 SDK 必要须另批。  
8. **迁移？** 优先否。  
9. **复用 rubric？** 是。  
10. **下一步？** 授权 3D-1 或授权本地 OCR spike。

---

## 变更日志

| 时间 | 说明 |
|---|---|
| 2026-10-25 | APPLICATION-3D-0 预检文档；未改代码、未外发 |
