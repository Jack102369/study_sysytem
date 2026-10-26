# APPLICATION-3E-8 · 应用题转写警告精准分类与部分得分门禁优化

> **日期**：2026-10-26  
> **状态**：**PREFLIGHT_COMPLETE**  
> **真实 Qwen HTTP：0** · **真实 DeepSeek HTTP：0** · **DB 写入：0** · **API 重启：NOT_RUN** · **UI：UI_NOT_RUN**  
> **不继承** 3E-7 真实调用授权；**不进入**下一阶段 live

---

## 1. 两个真实失败场景（只读 3E-7）

证据来源：`_tmp_application3e7_live_raw.json`（持久化诊断字段；**无**完整 Qwen HTTP body）。

| | A session **122** / item **345** / 图 48→49 | B session **123** / item **346** / 图 50→51 |
|---|---|---|
| grade_reason | `critical_recognition_warning` | 同左 |
| recognitionUncertain | **false** | **false** |
| confidence | 0.85 | 0.85 |
| 收入函数 / 定义域 / 错误配方 / x=50 | 可读且保留 | 可读且保留 |
| DeepSeek | 0 | 0 |
| warnings | 中文乱码「无法辨认」+「**根据乱码前后公式保留步骤**」 | 中文乱码「无法识别」；题干复述乱码 |
| 补写迹象 | **有**（公式侧「保留/还原」表述） | 弱（声称仅保留数字字母式） |
| 结论文字 | recognizedWork 含「无法辨认，疑似结论说明」 | 结论文字乱码夹杂 x=50 |
| 影响范围 | **UNKNOWN**（不得因保留 x=50 放行） | **UNKNOWN** |

**分类结论：** 不得将 122/123 标为可放行的 `auxiliary_text+minor`。离线门禁回归要求二者**继续拦截**。

---

## 2. 新旧协议兼容

| 形态 | 处理 |
|---|---|
| 旧 `string[]` | 继续解析；critical 启发式 + 补写嫌疑拦截；无法证明 minor 不放宽 |
| 新 `object[]` | 校验 pageIndex/category/severity/affectsScoring/description/location；**禁止默认填充** |
| 无效 object | **整单 parse null**（fail-closed） |
| 持久化 | 复用 `ai_grade_json.recognitionWarnings`；**无迁移** |
| 历史记录 | 旧 string[] 仍可读 |

结构化字段：`pageIndex` · `location` · `category` · `severity` · `description` · `affectsScoring`

category：`math_expression|numeric_value|problem_condition|reasoning_step|final_conclusion|auxiliary_text|unknown`  
severity：`minor|critical|unknown`

**唯一可放行组合：** `auxiliary_text` + `minor` + `affectsScoring=false`（且无补写嫌疑）。

---

## 3. Prompt / Parser / 门禁修改

**Prompt**（`hs-math-ai-grade-vision-transcribe.prompt.ts`）：

- 要求结构化 warning；区分辅助 vs 结论/推理/公式  
- 禁止逻辑补写乱码；结论文字不得标 auxiliary  
- 仍不提供标准答案/rubric 分值  

**Parser：**

- 兼容 string / object  
- 缺 severity / affectsScoring / 非法枚举 / pageIndex 越界 → null  
- `affectsScoring` 必须是 JSON boolean，不coerce字符串  

**门禁 `evaluateTranscribeForDeepSeek`：**

- uncertain / 低 conf / 空 work / 缺 uncertain 字段 → 拦截  
- structured：critical|unknown severity、unknown category、affectsScoring=true、非 auxiliary → 拦截  
- string：critical 启发式或补写嫌疑 → 拦截  
- 疑似模型补写（recognizedWork 或 warning）→ `model_supplementation_suspected`  

服务层：parse/evaluate 传入 `imageCount` 校验 pageIndex。

---

## 4. Stub / Build / 兼容

| 命令 | 结果 |
|---|---|
| `hs-math:application3e8-selftest` | **28/28 PASS** |
| `hs-math:application3e4-selftest` | **22/22 PASS** |
| `hs-math:application3e6-selftest` | **17/17 PASS**（16 已同步 3E-8 补写拦截语义） |
| `hs-math:application3e2-selftest` | **20/20 PASS** |
| API `nest build` | **PASS** |
| Web `vue-tsc && vite build` | **PASS** |

覆盖：x=50 保留、辅助可放行、关键/UNKNOWN/缺字段/越界、旧 string、122/123 脱敏仍拦截、部分分 rubric、不污染 correct/wrong。

**数据库迁移需求：无。**

兼容性：千问直评 validate 兼容 object warning；DeepSeek 纯文字/四题型路径未改调度；imageIds 顺序与图片鉴权未改。

---

## 5. 尚未验证 / 下一轮建议

尚未验证：真实模型是否稳定输出结构化 warning；部分分 live 是否因此放行。

下一轮若授权 live：更高质量样张（减少 GDI 中文乱码）+ 预算另批；**不得**把 122/123 当可放行样例重放刷分。

---

## 6. 结论

**APPLICATION-3E-8 = PREFLIGHT_COMPLETE**

离线侧完成 warning 精准分类与 fail-closed 门禁；122/123 保持拦截。停止；不自动进入下一阶段。
