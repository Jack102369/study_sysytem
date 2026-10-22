# OCR 服务（Windows）

与 Nest API 同机部署，仅监听本机，不要对公网开放。

| 服务 | 端口 | 目录 | 引擎 |
|------|------|------|------|
| 通用 OCR | 9100 | `services/ocr` | PaddleOCR |
| 公式 OCR | 9101 | `services/ocr-formula` | RapidLaTeXOCR（ONNX，无 torch） |

> 本机若出现 `c10.dll` / onnxruntime DLL 初始化失败：不要用 Pix2Text/torch；公式服务已改用 ONNX，并锁定 `onnxruntime==1.16.3`。venv 建议放在纯英文路径（如 `D:\tools\ocr-formula-venv`）。

## 1. 通用 OCR（9100）

```bat
cd /d services\ocr
python -m venv .venv
.venv\Scripts\activate.bat
python -m pip install -U pip
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 9100
```

注意：cmd 用 `activate.bat`；依赖已钉死 paddle 2.6.2 + paddleocr 2.7.3 + numpy&lt;2。

健康检查：http://127.0.0.1:9100/health

## 2. 公式 OCR + 智能识别（9101）

推荐一键启动（自动使用 `D:\tools\ocr-formula-venv`）：

```bat
cd /d services\ocr-formula
start.bat
```

| 接口 | 用途 |
|------|------|
| `POST /ocr/formula` | 纯公式裁切图 |
| `POST /ocr/smart` | 中文整题：通用 OCR 保中文 + 分式碎片裁切后公式识别 |

前端错题页「智能识别」走 `/ocr/smart`。需同时启动 9100 与 9101。

## 3. Nest 配置

```env
OCR_BASE_URL=http://127.0.0.1:9100
OCR_FORMULA_BASE_URL=http://127.0.0.1:9101
```

改 `.env` 后需重启 Nest API。

## 4. 说明

- 通用：印刷体中英文；复杂分式有限。
- 公式：输出多为 `$...$` LaTeX，适合分式/上下标，请人工核对。
- 未启 9101 时仅「公式识别」失败，普通识别不受影响。
