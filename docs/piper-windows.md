# Piper 本地 TTS（Windows）

本系统「英文听力」模块通过本机 Piper 合成 wav，不调用云 API。

当前仅启用 **2 个英式音色**，默认 **英式女声 Alba**。

## 1. 下载程序

https://github.com/rhasspy/piper/releases/tag/2023.11.14-2  

下载 `piper_windows_amd64.zip`，解压到例如 `C:\SOFT\tools\piper\piper.exe`（无 D 盘时用 C 盘即可）。

## 2. 下载音色（各 2 个文件）

放到 `C:\SOFT\tools\piper\voices\`：

### 英式女声 · Alba（默认）
- https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_GB/alba/medium/en_GB-alba-medium.onnx
- https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_GB/alba/medium/en_GB-alba-medium.onnx.json

### 英式男声 · Alan
- https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_GB/alan/medium/en_GB-alan-medium.onnx
- https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_GB/alan/medium/en_GB-alan-medium.onnx.json

```text
C:\SOFT\tools\piper\voices\
  en_GB-alba-medium.onnx
  en_GB-alba-medium.onnx.json
  en_GB-alan-medium.onnx
  en_GB-alan-medium.onnx.json
```

## 3. 配置 `apps/api/.env`

```env
PIPER_BIN=C:\SOFT\tools\piper\piper.exe
PIPER_VOICES_DIR=C:\SOFT\tools\piper\voices
PIPER_DEFAULT_VOICE=en_GB-alba-medium
```

## 4. 数据库

```bash
mysql -u study_user -p study_system < db/migrate_listening_materials.sql
mysql -u study_user -p study_system < db/migrate_listening_voice_key.sql
```

## 语速

滑块对应 `--length_scale`（0.7～1.8）：越大越慢。
