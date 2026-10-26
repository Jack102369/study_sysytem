# APPLICATION-3E-4 · Qwen 数学手写转写可靠性修复

> **日期**：2026-10-25  
> **状态**：**PARTIAL**（离线代码 + stub + build；**无**真实 AI；**不**代表双阶段 live 已通过）  
> **真实 Qwen/DeepSeek HTTP：0** · **DB 写入：0** · **API 重启：NOT_RUN** · **UI：UI_NOT_RUN**

---

## 1. B/C/F/D/E 失败分类（只读 3E-3）

| 场景 | session / item | 图 | mime | 顺序 | grade | DeepSeek | 原始响应证据 |
|---|---|---|---|---|---|---|---|
| B | 110 / 333 | 2 | png | imageIds 31→32 | review_required / uncertain_recognition | **0** | **MISSING**（ai_grade 已清空） |
| E | 111 / 334 | 1 | png（模糊大图） | 33 | grading_failed / transcribe_parse_fail | **0** | **MISSING** |
| C | 112 / 335 | 2 | png | 34→35 | review_required / uncertain | **0** | **MISSING** |
| F | 113 / 336 | 1 | png | 36 | review_required / uncertain | **0** | **MISSING** |
| D | 117 / 340 | 1 | png | 40 | review_required / uncertain | **0** | **MISSING** |

对照：同风格合成 PNG 在千问**直接评分**路径（A/H）可读且 graded。

### 分类结论（在缺原始 body 前提下）

| 类 | 含义 | 适用 |
|---|---|---|
| **A** 模型无法可靠识别 | 证据不足（无 raw） | E 可能（parse_fail 也可能是非 JSON 胡言） |
| **B** 识别了但结构不符解析器 | 证据不足 | E 可能 |
| **C** 能识别主内容但 prompt/阈值过度拦截 | **最可能**（B/C/F/D） | 与 A/H 成功对照；旧 prompt「看不清即可 uncertain=true」过宽 |

**不得**在无 raw 时把 A 断定为「仅 JSON」；也**不得**为过测试放宽安全门禁。

---

## 2. Prompt 修改

- 明确：只转写、不评分、不按标准答案改写、保留错误步骤。  
- **区分** `recognitionUncertain`：关键内容缺失→true；轻微标点糊但主线可读→false。  
- warnings 非空 ≠ 必然 uncertain。  
- 题干仅作背景；**不**提供标准答案/rubric。  
- 要求输出无 Markdown 围栏的完整四字段 JSON。

---

## 3. JSON 协议

仍为：

`recognizedWork` · `recognitionUncertain` · `recognitionWarnings` · `confidence`

解析增强：围栏剥离、snake_case 兼容、非法 confidence 类型→parse null。  
**禁止**：缺 uncertain 默认 false；缺 confidence 默认高置信。

---

## 4. 解析器 / 质量门禁

新函数 `evaluateTranscribeForDeepSeek`：

| 条件 | 处置 |
|---|---|
| parse null / 空 content | `grading_failed` / parse_fail |
| 缺 uncertain 字段 | `review_required` |
| uncertain=true | `review_required` |
| confidence &lt; 0.5 | `review_required` |
| 关键 warning（系数/最大值/严重模糊等） | `review_required` |
| 仅轻微 warning | **允许**进 DeepSeek |

DeepSeek 仍只收文字合并结果；图片不外发 DeepSeek。

---

## 5. 审计落库改进

转写门禁 `review_required` 时写入诊断 `ai_grade_json`（status=review_required，含 recognizedWork/warnings/confidence/visionCallCount=1/scoringCallCount=0），**不再清空**，便于下次 live 取证。不调 DeepSeek。

---

## 6. Stub / Build

| 命令 | 结果 |
|---|---|
| `hs-math:application3e4-selftest` | **PASS 22** |
| `hs-math:application3e2-selftest` | **PASS 20** |
| api build | **PASS** |
| web build | **PASS** |

fixture 均为 **synthetic**，非 3E-3 真实回放。

---

## 7. 仍存在的模型限制

- 合成/低清图仍可能 uncertain 或 parse_fail。  
- 未再次真实 HTTP，**不能**声称 B 双阶段已通。  
- 关键 warning 关键词启发式可能漏报/误报，需 live 校准。

---

## 8. 下一轮真实联调（需**新**授权，不继承 3E-3）

建议授权：新建 session；Qwen/DeepSeek 预算；开关+allowlist；重启与恢复。

样张优先：清晰手写、清晰印刷、清晰多页、部分正确、明显错误、模糊对照。文件名任意。  
成功标准至少含：1× dual 清晰图 → graded；1× 模糊 → review_required 且 DS=0。

---

## 9. 结论

**APPLICATION-3E-4 = PARTIAL**

转写代码与离线回归完成；真实双阶段评分**尚未**验证。
