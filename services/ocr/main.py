"""
Local OCR HTTP service for study-system.
- POST /ocr         : PaddleOCR (general text)
- POST /ocr/formula : Pix2Text (optional, formulas + mixed text)
Run: uvicorn main:app --host 127.0.0.1 --port 9100
"""
from __future__ import annotations

import os
import tempfile
import traceback
from typing import Optional

# Must set before importing paddle / paddleocr
os.environ.setdefault("FLAGS_use_mkldnn", "0")
os.environ.setdefault("FLAGS_onednn", "0")

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

app = FastAPI(title="study-system-ocr", version="0.2.0")

_ocr = None
_formula = None
_formula_import_error: Optional[str] = None


def get_ocr():
  global _ocr
  if _ocr is None:
    from paddleocr import PaddleOCR

    _ocr = PaddleOCR(use_angle_cls=True, lang="ch", show_log=False)
  return _ocr


def formula_available() -> bool:
  try:
    import pix2text  # noqa: F401

    return True
  except Exception:
    return False


def get_formula_engine():
  global _formula, _formula_import_error
  if _formula is not None:
    return _formula
  try:
    from pix2text import Pix2Text

    _formula = Pix2Text.from_config()
    _formula_import_error = None
    return _formula
  except Exception as e:
    _formula_import_error = str(e)
    raise HTTPException(
      status_code=503,
      detail=(
        "公式 OCR（Pix2Text）未安装或初始化失败。"
        "请执行: pip install -r requirements-formula.txt 。"
        f"详情: {_formula_import_error}"
      ),
    ) from e


@app.get("/health")
def health():
  return {
    "ok": True,
    "service": "paddleocr",
    "formulaAvailable": formula_available(),
  }


def _run_ocr_on_path(path: str) -> dict:
  if not path or not os.path.isfile(path):
    raise HTTPException(status_code=400, detail=f"image not found: {path}")
  ocr = get_ocr()
  result = ocr.ocr(path, cls=True)
  lines: list[str] = []
  confidences: list[float] = []
  boxes: list[dict] = []
  if result:
    for block in result:
      if not block:
        continue
      for item in block:
        if not item or len(item) < 2:
          continue
        pts = item[0]
        text_info = item[1]
        if not text_info:
          continue
        text = text_info[0] if isinstance(text_info, (list, tuple)) else str(text_info)
        conf = (
          float(text_info[1])
          if isinstance(text_info, (list, tuple)) and len(text_info) > 1
          else 0.0
        )
        t = str(text).strip()
        if not t:
          continue
        lines.append(t)
        confidences.append(conf)
        xs = [float(p[0]) for p in pts]
        ys = [float(p[1]) for p in pts]
        boxes.append(
          {
            "text": t,
            "confidence": conf,
            "bbox": [min(xs), min(ys), max(xs), max(ys)],
          }
        )
  text = "\n".join(lines).strip()
  avg_conf = sum(confidences) / len(confidences) if confidences else None
  return {
    "text": text,
    "confidence": avg_conf,
    "lineCount": len(lines),
    "engine": "paddleocr",
    "boxes": boxes,
  }


def _normalize_formula_output(outs) -> str:
  if outs is None:
    return ""
  if isinstance(outs, str):
    return outs.strip()
  if isinstance(outs, dict):
    for k in ("markdown", "text", "content"):
      if outs.get(k):
        return str(outs[k]).strip()
  # pix2text may return list of dicts / Element objects
  if isinstance(outs, (list, tuple)):
    parts: list[str] = []
    for item in outs:
      if item is None:
        continue
      if isinstance(item, str):
        parts.append(item)
        continue
      if isinstance(item, dict):
        t = item.get("text") or item.get("latex") or item.get("markdown")
        if t:
          parts.append(str(t))
        continue
      t = getattr(item, "text", None) or getattr(item, "latex", None)
      if t:
        parts.append(str(t))
      else:
        parts.append(str(item))
    return "\n".join(p.strip() for p in parts if str(p).strip()).strip()
  # fallback: to_markdown / __str__
  to_md = getattr(outs, "to_markdown", None)
  if callable(to_md):
    try:
      return str(to_md()).strip()
    except Exception:
      pass
  return str(outs).strip()


def _run_formula_on_path(path: str) -> dict:
  if not path or not os.path.isfile(path):
    raise HTTPException(status_code=400, detail=f"image not found: {path}")
  engine = get_formula_engine()
  # prefer return_text / markdown style APIs across pix2text versions
  text = ""
  try:
    outs = engine.recognize(path, return_text=True)
    text = _normalize_formula_output(outs)
  except TypeError:
    outs = engine.recognize(path)
    text = _normalize_formula_output(outs)
  except Exception:
    # older API: callable
    try:
      outs = engine(path)
      text = _normalize_formula_output(outs)
    except Exception as e:
      raise HTTPException(status_code=500, detail=f"formula OCR failed: {e}") from e

  return {
    "text": text,
    "confidence": None,
    "lineCount": len([ln for ln in text.splitlines() if ln.strip()]) if text else 0,
    "engine": "pix2text",
  }


async def _resolve_image_path(
  file: Optional[UploadFile],
  path: Optional[str],
) -> tuple[str, Optional[str]]:
  """Returns (abs_path, tmp_path_or_none)."""
  if file is not None:
    suffix = os.path.splitext(file.filename or "")[1] or ".jpg"
    fd, tmp_path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    content = await file.read()
    with open(tmp_path, "wb") as f:
      f.write(content)
    return tmp_path, tmp_path
  if path:
    return path, None
  raise HTTPException(status_code=400, detail="provide file or path")


@app.post("/ocr")
async def ocr_upload(
  file: Optional[UploadFile] = File(None),
  path: Optional[str] = Form(None),
):
  tmp_path = None
  try:
    abs_path, tmp_path = await _resolve_image_path(file, path)
    data = _run_ocr_on_path(abs_path)
    return JSONResponse({"success": True, "data": data})
  except HTTPException:
    raise
  except Exception as e:
    traceback.print_exc()
    raise HTTPException(status_code=500, detail=f"OCR failed: {e}") from e
  finally:
    if tmp_path and os.path.isfile(tmp_path):
      try:
        os.remove(tmp_path)
      except OSError:
        pass


@app.post("/ocr/formula")
async def ocr_formula(
  file: Optional[UploadFile] = File(None),
  path: Optional[str] = Form(None),
):
  """
  Formula-oriented OCR via Pix2Text (optional dependency).
  Returns markdown/latex-friendly text when possible.
  """
  tmp_path = None
  try:
    abs_path, tmp_path = await _resolve_image_path(file, path)
    data = _run_formula_on_path(abs_path)
    return JSONResponse({"success": True, "data": data})
  except HTTPException:
    raise
  except Exception as e:
    traceback.print_exc()
    raise HTTPException(status_code=500, detail=f"formula OCR failed: {e}") from e
  finally:
    if tmp_path and os.path.isfile(tmp_path):
      try:
        os.remove(tmp_path)
      except OSError:
        pass
