# APPLICATION-3D-2 · 本机 OCR 启动与印刷体数学识别验证

> **日期**：2026-10-25  
> **状态**：**PARTIAL**  
> **授权原文**：「授权启动本机 OCR 9100 与 9101」  
> **范围**：启动本机 9100/9101 + health + 9 张 PRINTED_ONLY 质量测试；**不**安装/下载、**不** DeepSeek、**不**云视觉、**不**学生图、**不**改库、**不**重启 API:3000。

---

## 1. 结论摘要

| 项 | 结果 |
|---|---|
| 9100 启动 | **成功**（`127.0.0.1:9100`，PID **11024**） |
| 9101 启动 | **成功**（`127.0.0.1:9101`，PID **23212**；公式引擎 warmup **ready**） |
| health | 9100/9101 均 HTTP 200 |
| 模型下载 | 启动与首轮 OCR **未见** download / bcebos / huggingface 日志 |
| 印刷体测试 | **9/9** 跑通；hint 命中脚本期望键值 |
| 文字识别 | **TEXT_OCR_PASS**（印刷中文+数字主体可读） |
| 公式识别 | **FORMULA_OCR_PARTIAL**（配方/平方较好；定义域 ∈、个别版式高风险） |
| 多图 | **MULTI_IMAGE_PASS**（G1→G3 顺序可读） |
| 图象 | **GRAPH_UNSUPPORTED**（仅抽到文字标签） |
| 手写 | **HANDWRITING_NOT_TESTED** |
| LOCAL_OCR_SUITABLE | **否**（禁止仅凭印刷体判定） |
| 最终判断 | 本机 OCR **可恢复**；印刷体可用但公式门禁仍必要；下一步需虚构手写样张 |

---

## 2. 启动授权与命令

**授权原文**：`授权启动本机 OCR 9100 与 9101`

**实际命令**（现有 venv，等价于 start.bat 中的 uvicorn 行；避免 `pause`）：

```text
# 9100
services\ocr\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 9100
# cwd: services/ocr

# 9101
D:\tools\ocr-formula-venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 9101
# cwd: services/ocr-formula
# PADDLE_OCR_URL=http://127.0.0.1:9100
```

环境：`HUB_OFFLINE=1`、`FLAGS_use_mkldnn=0`、`FLAGS_onednn=0`（抑制无关加速；不 pip、不主动拉模型）。

日志：`docs/high_school_math/_tmp_ocr_logs/ocr_9100_*.log`、`ocr_9101_*.log`。

| 服务 | 启动器 PID | 监听 PID | 端口 | 绑定 |
|---|---|---|---|---|
| Paddle OCR | 1668 | **11024** | 9100 | 127.0.0.1 |
| Formula OCR | 1840 | **23212** | 9101 | 127.0.0.1 |

API:3000（PID 5456）**未重启、未改动**。

---

## 3. Health 与模型加载

### 9100

```json
{"ok":true,"service":"paddleocr","formulaAvailable":false}
```

- TCP LISTENING OK。  
- `formulaAvailable:false` 预期（本机公式在 9101，非 Pix2Text）。  
- Paddle 模型：**懒加载**；首次 `POST /ocr`（样本 A，约 6.1s）后后续请求 <1–3s。  
- 本地缓存 det/rec/cls 已存在；本轮日志无下载痕迹。

### 9101

```json
{"ok":true,"service":"rapid-latex-ocr","formulaAvailable":true,"engineReady":true,"maxSide":400,"paddleUrl":"http://127.0.0.1:9100"}
```

- startup warmup：`[ocr-formula] engine ready` → **公式模型已加载**。

---

## 4. 印刷体 9 张测试结果

命令：`pnpm --filter api run hs-math:application3d1-ocr-quality`  
原始：`docs/high_school_math/_tmp_application3d1_ocr_raw.json`

| ID | ms | engine | OCR 摘要 | 正确性要点 | 高风险 |
|---|---|---|---|---|---|
| A | 6132 | smart | `票价为×元`；`2400-30x` | 文字+数字 OK；`x`→`×` | 低（变量字形） |
| B | 2952 | smart | `$\frac{y=x(2400-30x)}{y=2400x-30x^2}$` | 两行被合成**分式**；内容含正确式 | **高**（版式误结构） |
| C | 530 | smart | `xE{30,31.,.,60}` | 30/60 在；`∈`→`E`；省略号乱 | **高**（定义域符号） |
| D | 724 | smart | `y=-30(x-40)^2+48000` | 负号、`^2`、48000 **均保留** | 低 |
| E | 992 | smart | 多步全文；配方与结论齐全 | 顺序可读；定义域仍 `xE{…}` | 中（同 C） |
| F | 716 | paddleocr | `顶点(40,48000)` + 标注 | 仅文字；**无图象语义** | — → GRAPH_UNSUPPORTED |
| G1 | 475 | smart | `y=x(2400-30x)=2400x-30x^2` | 建模式 OK | 低 |
| G2 | 383 | smart | `XE{30,31,.,60}` | 同定义域问题 | **高** |
| G3 | 766 | smart | 配方+`票价40元，最大收入48000元` | 结论 OK；`^2` 在 | 低 |

**专项核对**

| 关注点 | 结果 |
|---|---|
| `y=x(2400-30x)` | 出现在 A/B/E/G1 |
| `y=2400x-30x²` | 多为 `x^2`（**未**见系统性 `x2` 丢幂） |
| `x∈{30,…,60}` | **系统性** `∈`→`E` / `XE` |
| `y=-30(x-40)²+48000` | D/E/G3 **正确**（含负号与平方） |
| 票价 40 / 最大收入 48000 | E/G3 正确 |
| 多步骤顺序 | E 内顺序 OK；G1→G2→G3 可拼完整解答 |
| 多图连续性 | **MULTI_IMAGE_PASS** |
| 函数图象 | **GRAPH_UNSUPPORTED** |

---

## 5. 质量判定（印刷体）

| 维度 | 判定 |
|---|---|
| TEXT_OCR_PASS | **PASS** |
| FORMULA_OCR_PASS | **PARTIAL**（配方好；定义域/个别版式失败） |
| MULTI_IMAGE_PASS | **PASS** |
| GRAPH_UNSUPPORTED | **是** |
| HANDWRITING_PASS | **禁止声称** |
| HANDWRITING_NOT_TESTED | **是** |
| LOCAL_OCR_SUITABLE | **否** |

**安全边界（仍有效）**：图片答案保持 `review_required`；不得 OCR 覆盖原答、不得假 0 分/wrong、不得进 accuracy。定义域 `∈` 误识与 B 分式误结构 → 若直通 DeepSeek 有**高风险误判**，必须人工或更强门禁。

---

## 6. 下一步建议

1. **优先**：采集虚构**手写**数学解答样张（非学生历史图），再评手写适合度。  
2. 印刷体公式主体尚可，但定义域符号弱 → 接线前必须保留 `review_required` / 符号校验。  
3. 若手写后公式仍不可靠 → 转向云多模态（须单独图片外发授权），**勿**再大投入 OCR 平台建设。  
4. 不进 CORE-1B；不改评分链路。

---

## 7. 阶段状态

- **APPLICATION-3D-2 = PARTIAL**（服务恢复 PASS；印刷体验证完成但公式有高风险误识；无手写）  
- APPLICATION-3D = PARTIAL  
- APPLICATION-3 = PARTIAL  
- APPLICATION-3C = PASS  
- CORE-1A-4B = BLOCKED  
- CORE-1B = NOT_STARTED  

---

## 变更日志

| 时间 | 说明 |
|---|---|
| 2026-10-25 | 只读预检 → WAITING_FOR_AUTHORIZATION |
| 2026-10-25 | 授权启动；9100/9101 up；9 张印刷体测完 → **PARTIAL** |
