# APPLICATION-3E-6 · DeepSeek 图片部分得分专项预检

> **日期**：2026-10-26  
> **状态**：**PREFLIGHT_COMPLETE**  
> **真实 Qwen HTTP：0** · **真实 DeepSeek HTTP：0** · **DB 写入：0** · **API 重启：NOT_RUN** · **UI：UI_NOT_RUN**  
> **不继承** 3E-5 真实调用授权；**不进入** 3E-7

---

## 1. 3E-5 场景 B 失败分析（只读）

| 项 | 值 |
|---|---|
| sessionId | **120** |
| sessionItemId | **343** |
| 图片数量 | **2** |
| 格式 | PNG（合成印刷体） |
| imageIds 顺序 | **45 → 46** |
| gradingProvider | deepseek |
| gradeResult / reason | `review_required` / `uncertain_recognition` |
| recognitionUncertain | **true** |
| confidence | **0.85**（未低于阈值） |
| scoringCallCount | **0**（DeepSeek 未调用） |
| visionCallCount | 1 |
| Qwen 模型 | qwen3.8-27b-orca-q8 |

**转写预览（落库诊断 / raw 记录）要点：**

- 第1张：建模 `y=x(2400-30x)=2400x-30x^2`、定义域可读  
- 第2张：清晰保留错误步骤 `y=-30(x-50)^2+48000`、`x=50`、最大值 48000  
- warnings：中文乱码；并写「**依据数学逻辑进行了还原**」

**触发 review_required 的步骤：**  
`parseVisionTranscribeResult` 成功 → `evaluateTranscribeForDeepSeek` 因 `recognitionUncertain=true` → `uncertain_recognition`（先于 critical warning / low confidence）。

**分类（有 raw 字段证据；无完整原始 HTTP body）：**

| 类 | 判定 |
|---|---|
| A 图片本身不清晰 | **否**（公式与 x=50 可读） |
| B 数学字符识别不确定 | **弱**：中文叙述乱码，但关键数学式清晰 |
| C 把数学错误当成 uncertain | **部分成立**：错误 `x=50` 已转写出，却仍 uncertain=true |
| D Prompt/门禁过度拦截 | **成立倾向**：模型因中文乱码+推断还原置 uncertain；旧 critical 正则若仅含「收入函数」等考点词也可能误伤（本例主因仍是 uncertain 字段） |

**证据不足：** Qwen 完整原始 HTTP body **MISSING**（仅有脚本 raw JSON + 落库诊断字段）。  
**自动纠错迹象：** warnings 明确「依据数学逻辑…还原」→ **有**；但 `x=50` 未被改成 `x=40`。

---

## 2. 数学错误 ≠ 识别不确定

已写入转写 Prompt：

- 清晰可读但步骤错误 → **原样转写**，`recognitionUncertain=false`  
- 无法判断写了什么（如 40/50 糊成一体）→ `uncertain=true`  
- **禁止**因「应为 x=40」把清晰错误标 uncertain  
- **禁止**按数学逻辑/标准答案改写；看不清标 `【?】`，不要猜

转写阶段仍只收：题干（背景）+ 学生附加文字 + 图片；**不传**标准答案、**不传** rubric 分数（代码路径未变，Prompt 再次强调）。

---

## 3. Prompt / 门禁修复

| 变更 | 说明 |
|---|---|
| Prompt | 区分数学错误 vs 识别不确定；禁止逻辑还原/纠错；保留错误数字与结论 |
| `CRITICAL_WARNING_RE` | 考点词须与「无法辨认/看不清/模糊…」等识别失败语义同现；避免仅因「收入函数」字样拦截 |
| `isCriticalRecognitionWarning` | 导出供 stub 断言 |
| fail-closed | uncertain / 低 confidence / 真关键 warning / 缺字段 仍拦截 DeepSeek |

---

## 4. 样张准备（下一轮备选，本轮未调模型）

路径：`apps/api/src/hs-math/integration/fixtures/application3e6/`  
生成：`_gen-3e6-png.ps1` · 清单：`MANIFEST.json`

| ID | 类型 | 文件 | 尺寸 |
|---|---|---|---|
| A | **PRINTED_SYNTHETIC** | `A_printed_partial_p1.png`, `A_printed_partial_p2.png` | 1400×1800 |
| B | **HANDWRITING_STYLE_SYNTHETIC** | `B_handstyle_partial.png` | 1400×1800 |
| C | **PRINTED_SYNTHETIC** | `C_printed_partial_p1.png`, `C_printed_partial_p2.png` | 1400×1800 |

内容：建模与定义域正确；配方故意 `x=50` / 最大收入 48000。  
**无** `REAL_HANDWRITING_PHOTO`。  
本地检查：PNG 头、体积约 50–65KB、无个人信息。  
残留风险：GDI 中文编码在真模型下仍可能乱码（3E-5 已见）；样张已加大字号与行距。

---

## 5. Stub / Build

| 命令 | 结果 |
|---|---|
| `hs-math:application3e6-selftest` | **17/17 PASS** |
| `hs-math:application3e4-selftest` | **22/22 PASS**（回归） |
| `hs-math:application3e2-selftest` | **20/20 PASS**（此前已跑） |
| API `nest build` | **PASS** |
| Web `vue-tsc && vite build` | **PASS** |

Stub 覆盖：错误步骤保留、`x=50` 不改写、错误≠uncertain、真模糊拦截、uncertain/低 conf/关键 warning→DeepSeek 0、非关键考点词 warning 放行、部分分校验、不污染 correct/wrong、顺序与混合原文、样张质量。

**Stub 不能证明真实 Qwen 一定不纠错。**

---

## 6. 下一轮建议（APPLICATION-3E-7，需新授权）

优先：

1. DeepSeek + 清晰部分正确双图（样张 A 或 C）  
2. 可选第二场景：样张 B 或另一印刷双图  

预算建议：**Qwen ≤2 · DeepSeek ≤2**。  
若第一场景仍 uncertain：**不得**人为绕过门禁；可用剩余预算测第二份清晰样张。  
**禁止**自动加预算。真实调用须用户另行授权。

---

## 7. 尚未验证的真实能力

- DeepSeek 图片路径下的**真实部分得分**闭环  
- 真实 Qwen 是否仍会因中文乱码置 uncertain /「逻辑还原」  
- 手写风格样张的真实转写质量  

---

## 8. 结论

**APPLICATION-3E-6 = PREFLIGHT_COMPLETE**

离线侧已强化「错误可评分、不确定才拦截」；样张与 stub 就绪。部分得分真实验收留给 **3E-7（待授权）**。
