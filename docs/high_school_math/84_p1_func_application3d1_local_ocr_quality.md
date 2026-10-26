# P1-FUNC · APPLICATION-3D-1 本地 OCR 手写数学识别质量验证

> **执行时间**：2026-10-25  
> **状态**：**BLOCKED**  
> **原因**：本机 OCR（`127.0.0.1:9100` / `:9101`）**未运行**；按授权**不**擅自启动或安装  
> **APPLICATION-3D**：PARTIAL（有预检 83 + 本轮门禁脚本/夹具；质量验证未完成）  
> **APPLICATION-3**：PARTIAL  
> **未做**：外发、DeepSeek、改正式评分/题库、迁移、重启 API

---

## 1. OCR 服务状态

| 项 | 值 |
|---|---|
| `OCR_BASE_URL` | `http://127.0.0.1:9100` |
| `OCR_FORMULA_BASE_URL` | `http://127.0.0.1:9101` |
| `GET …/health` (9100) | **不可达**（fetch failed） |
| `GET …/health` (9101) | **不可达**（fetch failed） |
| LISTENING | 无 |
| 客户端 | 复用 `OcrClientService`（general / formula / smart） |

命令：`pnpm --filter api run hs-math:application3d1-ocr-quality` → **VERDICT BLOCKED**。

原始：`docs/high_school_math/_tmp_application3d1_ocr_raw.json`

---

## 2. 是否纯本地

配置指向 **127.0.0.1**，设计为纯本机 OCR。  
本轮**未**向任何 OCR 发送图片（服务未起）；**未**调用 DeepSeek / 外部 AI。

---

## 3–4. 测试样本

| 类型 | 数量 | 说明 |
|---|---|---|
| **真实手写** | **0** | 未采集；**禁止**无手写却标 LOCAL_OCR_SUITABLE |
| **印刷体 PRINTED_ONLY** | **9** | System.Drawing 生成，文件名含 `printed` |

路径：`apps/api/src/hs-math/integration/fixtures/application3d1-ocr/`

| ID | 文件 | 内容意图 |
|---|---|---|
| A | A_printed_text.png | 清晰文字：票价 / 2400-30x |
| B | B_printed_formula.png | 公式 y=… / 2400x-30x^2 |
| C | C_printed_domain.png | 定义域 ∈{30,…,60} |
| D | D_printed_complete.png | 配方 -30(x-40)^2+48000 |
| E | E_printed_full.png | 多步完整印刷解答 |
| F | F_printed_graph.png | 印刷坐标轴+抛物线示意图 |
| G1–G3 | G*_printed_*.png | 多图拆分（建模/定义域/求解） |

**明确**：全部为 **PRINTED_ONLY**，**不得**冒充手写识别通过。

---

## 5. 每项识别结果

**未执行**（OCR down）。无 OCR 返回文字、无耗时样本行。

---

## 6. 公式错误 / 7. 图象能力 / 8. 多图 / 9. 耗时

| 项 | 状态 |
|---|---|
| 公式识别 | **未测** |
| 定义域 / 配方 | **未测** |
| 图象理解 | 按设计：纯 OCR **不能**理解为视觉图象 → 预期标记 **GRAPH_UNSUPPORTED**（待服务起来后确认仅抽文字） |
| 多图连续性 | 脚本预留按 imageIds 顺序逐图调用；**未跑** |
| 识别耗时 | N/A |

---

## 10. 评分风险（门禁，仍有效）

即使将来 OCR 可用，下列情况**不得**自动评分：

1. 关键公式不确定（如 `(x-40)²` → `(x-40)`）→ **高风险**，保持 `review_required`  
2. 图象无法理解 → `GRAPH_UNSUPPORTED` → `review_required`  
3. 图片缺失 / 多图不完整 → 不自动评分  
4. 无法确定学生原始表达 → 不自动评分  

**禁止**：OCR 失败或不可靠时记 wrong / 假 0 分 / 计入 accuracy。

误识别配方掉平方号会导致 DeepSeek 错误扣分 → 必须门禁，不得直通「OCR 文本当金标准」。

---

## 11. 最终结论

| 候选判断 | 本轮 |
|---|---|
| LOCAL_OCR_SUITABLE | **否**（无手写实测 + OCR 未运行） |
| LOCAL_OCR_LIMITED | 未证实 |
| LOCAL_OCR_UNSUITABLE | 未证实 |
| **实际** | **BLOCKED / NOT_EVALUATED** |

**是否适合立刻 OCR→DeepSeek 接线自动批改？** **否。**

---

## 12. 下一步方案

1. **用户授权启动**本机 PaddleOCR（9100）与 Pix2Text（9101）后，重跑 `hs-math:application3d1-ocr-quality`。  
2. 补充**真实手写**样张（手机拍照虚构解答，非历史学生图）后再评 SUITABLE/LIMITED/UNSUITABLE。  
3. 若手写公式/图象仍弱 → 按 83 转向云多模态（须图片外发授权）。  
4. 不进 CORE-1B；保持 AI 外发关闭。

---

## 变更日志

| 时间 | 说明 |
|---|---|
| 2026-10-25 | OCR 未运行 → **BLOCKED**；准备 PRINTED_ONLY 夹具与门禁脚本；无外发 |
