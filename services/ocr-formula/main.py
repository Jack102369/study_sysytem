"""
Formula OCR + smart mixed (Chinese + formula) recognition.
- POST /ocr/formula : RapidLaTeXOCR
- POST /ocr/smart   : Paddle boxes + formula crops merge
Run: uvicorn main:app --host 127.0.0.1 --port 9101
"""
from __future__ import annotations

import io
import os
import re
import tempfile
import traceback
from typing import Any, Optional

import requests
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

app = FastAPI(title="study-system-ocr-formula", version="0.3.0")

_engine = None
_init_error: Optional[str] = None
_MAX_SIDE = int(os.environ.get("FORMULA_OCR_MAX_SIDE", "400"))
_PADDLE_URL = os.environ.get("PADDLE_OCR_URL", "http://127.0.0.1:9100").rstrip("/")
_CJK_RE = re.compile(r"[\u4e00-\u9fff]")
_MATH_RE = re.compile(r"[0-9a-zA-Z+\-*/=()^_.<>]")


def get_engine():
  global _engine, _init_error
  if _engine is not None:
    return _engine
  try:
    from rapid_latex_ocr import LaTeXOCR

    _engine = LaTeXOCR()
    _init_error = None
    return _engine
  except Exception as e:
    _init_error = str(e)
    raise HTTPException(
      status_code=503,
      detail=f"LaTeXOCR init failed: {_init_error}",
    ) from e


@app.on_event("startup")
def _warmup():
  try:
    get_engine()
    print("[ocr-formula] engine ready", flush=True)
  except Exception as e:
    print(f"[ocr-formula] warmup failed: {e}", flush=True)


@app.get("/health")
def health():
  ready = _engine is not None
  available = False
  try:
    import rapid_latex_ocr  # noqa: F401

    available = True
  except Exception:
    available = False
  return {
    "ok": available,
    "service": "rapid-latex-ocr",
    "formulaAvailable": available,
    "engineReady": ready,
    "maxSide": _MAX_SIDE,
    "paddleUrl": _PADDLE_URL,
  }


def _wrap_latex(text: str) -> str:
  t = (text or "").strip()
  if not t:
    return ""
  if t.startswith("$") or t.startswith("\\(") or t.startswith("\\["):
    return t
  return f"${t}$"


def _prepare_image_bytes(raw: bytes) -> bytes:
  """仅缩小过大图；小裁切不再强制放大（会严重误识）。"""
  try:
    from PIL import Image

    img = Image.open(io.BytesIO(raw))
    if img.mode not in ("RGB", "L"):
      img = img.convert("RGB")
    w, h = img.size
    longest = max(w, h)
    if longest > _MAX_SIDE:
      scale = _MAX_SIDE / float(longest)
      nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
      img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    out = io.BytesIO()
    img.save(out, format="PNG")
    return out.getvalue()
  except Exception:
    return raw


def _run_formula_bytes(raw: bytes) -> dict:
  if not raw:
    raise HTTPException(status_code=400, detail="empty image")
  engine = get_engine()
  prepared = _prepare_image_bytes(raw)
  res, elapse = engine(prepared)
  text = _wrap_latex(str(res) if res is not None else "")
  return {
    "text": text,
    "confidence": None,
    "lineCount": 1 if text else 0,
    "engine": "rapid_latex_ocr",
    "elapsedSec": float(elapse) if elapse is not None else None,
  }


def _count_cjk(text: str) -> int:
  return len(_CJK_RE.findall(text or ""))


def _is_math_fragment(text: str) -> bool:
  """偏公式碎片：不得含中文，适合裁切后走公式模型。"""
  t = (text or "").strip()
  if not t:
    return False
  if _count_cjk(t) >= 1:
    return False
  return len(_MATH_RE.findall(t)) >= 2


def _looks_like_latex_garbage(text: str) -> bool:
  t = text or ""
  if _count_cjk(t) > 0:
    return False
  hits = len(
    re.findall(
      r"\\bar|\\partial|\\Omega|\\kappa|\\Lambda|\\phi|\\psi|\\iota|\\otimes|\\sinh|"
      r"\\begin\{array\}|\\mathfrak|\\stackrel|\\longleftrightarrow|\\longrightarrow|"
      r"\\leftarrow|\\scriptstyle",
      t,
    )
  )
  # 过长且几乎无数字/字母的「花活」也视为失败
  plain = re.sub(r"[0-9a-zA-Z+\-*/=()^_{}\\$\s]", "", t)
  return hits >= 2 or (len(t) > 80 and hits >= 1) or len(plain) > 25


def _normalize_math_token(text: str) -> str:
  """4a2 → 4a^{2}；962 保持原样（可能是 9b2 误识）。"""
  t = (text or "").strip()
  t = re.sub(r"([a-zA-Z])(\d)\b", r"\1^{\2}", t)
  return t


def _paddle_cluster_text(cluster: list[dict]) -> str:
  """公式模型失败时，用通用 OCR 碎片做简易分式拼接。"""
  ordered = sorted(cluster, key=lambda c: (c["bbox"][1], c["bbox"][0]))
  if len(ordered) == 2:
    a, b = ordered
    if _h_overlap_ratio(a["bbox"], b["bbox"]) >= 0.35 and not _same_line(
      a["bbox"], b["bbox"]
    ):
      return _wrap_latex(
        f"\\frac{{{_normalize_math_token(a['text'])}}}{{{_normalize_math_token(b['text'])}}}"
      )
  if len(ordered) == 3:
    top = [c for c in ordered if _same_line(c["bbox"], ordered[0]["bbox"])]
    bottom = [c for c in ordered if c not in top]
    if len(top) == 2 and len(bottom) == 1:
      t1, t2 = sorted(top, key=lambda c: c["bbox"][0])
      den = bottom[0]["text"].replace(" ", "")
      m = re.match(r"^(.+?\+1)(.+?\+1)$", den)
      if m:
        return _wrap_latex(
          f"\\frac{{{_normalize_math_token(t1['text'])}}}{{{m.group(1)}}}"
          f"+\\frac{{{_normalize_math_token(t2['text'])}}}{{{m.group(2)}}}"
        )
      return _wrap_latex(
        f"\\frac{{{_normalize_math_token(t1['text'])}}}{{{den}}}"
        f"+\\frac{{{_normalize_math_token(t2['text'])}}}{{{den}}}"
      )
  return " ".join(_normalize_math_token(c["text"]) for c in ordered)


def _union_bbox(boxes: list[list[float]]) -> list[float]:
  return [
    min(b[0] for b in boxes),
    min(b[1] for b in boxes),
    max(b[2] for b in boxes),
    max(b[3] for b in boxes),
  ]


def _h_overlap_ratio(a: list[float], b: list[float]) -> float:
  left = max(a[0], b[0])
  right = min(a[2], b[2])
  if right <= left:
    return 0.0
  wa = max(1.0, a[2] - a[0])
  wb = max(1.0, b[2] - b[0])
  return (right - left) / min(wa, wb)


def _same_line(a: list[float], b: list[float]) -> bool:
  ay = (a[1] + a[3]) / 2
  by = (b[1] + b[3]) / 2
  ah = max(1.0, a[3] - a[1])
  bh = max(1.0, b[3] - b[1])
  return abs(ay - by) <= 0.55 * min(ah, bh)


def _should_merge_math(a: list[float], b: list[float]) -> bool:
  """分式上下行，或同一行内紧邻的公式碎片。"""
  ah = max(8.0, a[3] - a[1])
  bh = max(8.0, b[3] - b[1])
  # 竖直堆叠（分子/分母）
  if _h_overlap_ratio(a, b) >= 0.35:
    gap = max(0.0, max(a[1], b[1]) - min(a[3], b[3]))
    if gap <= 1.25 * max(ah, bh):
      return True
  # 同行相邻（如 4a² 与 9b²）
  if _same_line(a, b):
    xgap = max(0.0, max(a[0], b[0]) - min(a[2], b[2]))
    if xgap <= 1.8 * max(ah, bh):
      return True
  return False


def _cluster_math_boxes(items: list[dict]) -> list[list[dict]]:
  if not items:
    return []
  ordered = sorted(items, key=lambda x: (x["bbox"][1], x["bbox"][0]))
  clusters: list[list[dict]] = []
  used = [False] * len(ordered)

  for i, cur in enumerate(ordered):
    if used[i]:
      continue
    cluster = [cur]
    used[i] = True
    changed = True
    while changed:
      changed = False
      base = _union_bbox([c["bbox"] for c in cluster])
      for j, other in enumerate(ordered):
        if used[j]:
          continue
        if _should_merge_math(base, other["bbox"]):
          cluster.append(other)
          used[j] = True
          changed = True
          break
    clusters.append(cluster)
  return clusters


def _crop_png(img, bbox: list[float], pad: float = 6.0) -> bytes:
  from PIL import Image

  w, h = img.size
  x1 = max(0, int(bbox[0] - pad))
  y1 = max(0, int(bbox[1] - pad))
  x2 = min(w, int(bbox[2] + pad))
  y2 = min(h, int(bbox[3] + pad))
  if x2 <= x1 + 2 or y2 <= y1 + 2:
    raise ValueError("invalid crop")
  crop = img.crop((x1, y1, x2, y2))
  if crop.mode not in ("RGB", "L"):
    crop = crop.convert("RGB")
  out = io.BytesIO()
  crop.save(out, format="PNG")
  return out.getvalue()


def _fetch_paddle_boxes(raw: bytes, filename: str = "img.png") -> dict:
  try:
    r = requests.post(
      f"{_PADDLE_URL}/ocr",
      files={"file": (filename, raw, "application/octet-stream")},
      timeout=90,
    )
  except requests.RequestException as e:
    raise HTTPException(
      status_code=503,
      detail=f"无法连接通用 OCR（{_PADDLE_URL}）: {e}",
    ) from e
  if r.status_code >= 400:
    raise HTTPException(
      status_code=503,
      detail=f"通用 OCR 失败 HTTP {r.status_code}: {r.text[:200]}",
    )
  try:
    body = r.json()
  except Exception as e:
    raise HTTPException(status_code=503, detail="通用 OCR 返回非 JSON") from e
  data = body.get("data") or {}
  return data


def _bbox_center_y(b: list[float]) -> float:
  return (b[1] + b[3]) / 2


def _group_text_lines(text_items: list[dict]) -> list[list[dict]]:
  if not text_items:
    return []
  ordered = sorted(text_items, key=lambda x: (_bbox_center_y(x["bbox"]), x["bbox"][0]))
  lines: list[list[dict]] = []
  for item in ordered:
    placed = False
    for line in lines:
      if _same_line(line[0]["bbox"], item["bbox"]):
        line.append(item)
        placed = True
        break
    if not placed:
      lines.append([item])
  for line in lines:
    line.sort(key=lambda x: x["bbox"][0])
  return lines


def _is_ask_left(text: str) -> bool:
  return "求" in (text or "")


def _is_ask_right(text: str) -> bool:
  t = text or ""
  return ("最小" in t) or ("最大" in t) or t.startswith("的")


def _bbox_contains_point(b: list[float], x: float, y: float, pad: float = 0) -> bool:
  return b[0] - pad <= x <= b[2] + pad and b[1] - pad <= y <= b[3] + pad


def _bbox_intersects(a: list[float], b: list[float], pad: float = 4) -> bool:
  return not (
    a[2] + pad < b[0] or b[2] + pad < a[0] or a[3] + pad < b[1] or b[3] + pad < a[1]
  )


def _clean_formula_latex(text: str) -> str:
  """提取前几个分式并拼成和式，去掉模型胡编尾巴。"""
  t = (text or "").strip()
  if not t:
    return ""
  if t.startswith("$") and t.endswith("$"):
    t = t[1:-1].strip()
  fracs = re.findall(
    r"\\frac\{(?:[^{}]|\{[^{}]*\})+\}\{(?:[^{}]|\{[^{}]*\})+\}",
    t,
  )
  if not fracs:
    t = re.sub(r"(\\quad|\\qquad|,)+$", "", t).strip()
    if _looks_like_latex_garbage(t) or len(t) > 90:
      return ""
    return _wrap_latex(t) if t else ""
  # 通常一问里 1～2 个分式相加；过多则截断
  keep = fracs[:2] if len(fracs) >= 2 else fracs[:1]
  return _wrap_latex("+".join(keep))


def _recognize_gap_crop(
  img,
  gap: list[float],
  math_items: list[dict],
  y_limit: Optional[float],
) -> tuple[str, int, list[float]]:
  """识别「求」与「的最小/最大」之间的公式。"""
  ub = list(gap)
  gx0, gx1 = ub[0], ub[2]
  line_h = max(16.0, ub[3] - ub[1])
  y_max = ub[3] + line_h * 1.8
  if y_limit is not None:
    y_max = min(y_max, y_limit - 2)
  for m in math_items:
    mb = m["bbox"]
    cx = (mb[0] + mb[2]) / 2
    if cx < gx0 - 8 or cx > gx1 + 8:
      continue
    if mb[1] > y_max or mb[3] < ub[1] - 6:
      continue
    ub = _union_bbox([ub, mb])
  ub[3] = min(ub[3], y_max)
  if ub == list(gap):
    # 行内分式：略加宽、略加高
    ub[0] -= 8
    ub[2] += 8
    ub[1] -= 4
    ub[3] = min(ub[3] + line_h * 0.55, y_max)

  def _once(box: list[float]) -> tuple[str, int]:
    try:
      crop_bytes = _crop_png(img, box, pad=2.0)
      if len(crop_bytes) <= 50:
        return "", 0
      fr = _run_formula_bytes(crop_bytes)
      return _clean_formula_latex((fr.get("text") or "").strip()), 1
    except Exception:
      return "", 0

  latex, crops = _once(ub)
  # 若只识别出一个分式，扩大再试（常见 1/a+1/b、双分式）
  if latex.count("\\frac") < 2:
    wider = [
      min(ub[0], gap[0]) - 20,
      max(0.0, min(ub[1], gap[1]) - 10),
      max(ub[2], gap[2]) + 20,
      min(max(ub[3], gap[3]) + line_h * 0.6, y_max),
    ]
    latex2, c2 = _once(wider)
    crops += c2
    if latex2.count("\\frac") > latex.count("\\frac"):
      latex, ub = latex2, wider
    elif not latex and latex2:
      latex, ub = latex2, wider

  if latex:
    return latex, crops, ub

  inside = [
    m
    for m in math_items
    if (gx0 - 8) <= (m["bbox"][0] + m["bbox"][2]) / 2 <= (gx1 + 8)
    and m["bbox"][1] <= y_max
    and m["bbox"][3] >= gap[1] - 6
  ]
  if inside:
    return _paddle_cluster_text(inside), crops, ub
  return "", crops, ub


def _run_smart(raw: bytes, filename: str = "img.png") -> dict:
  from PIL import Image

  paddle = _fetch_paddle_boxes(raw, filename)
  boxes: list[dict] = list(paddle.get("boxes") or [])
  plain = (paddle.get("text") or "").strip()

  if not boxes:
    return {
      "text": plain,
      "confidence": paddle.get("confidence"),
      "lineCount": paddle.get("lineCount") or (1 if plain else 0),
      "engine": "smart-paddle-only",
      "formulaCrops": 0,
    }

  img = Image.open(io.BytesIO(raw))
  if img.mode not in ("RGB", "L"):
    img = img.convert("RGB")

  text_items: list[dict] = []
  math_items: list[dict] = []
  for b in boxes:
    bbox = b.get("bbox")
    text = (b.get("text") or "").strip()
    if not bbox or len(bbox) != 4 or not text:
      continue
    item = {
      "text": text,
      "bbox": [float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])],
      "confidence": b.get("confidence"),
    }
    if _is_math_fragment(text):
      math_items.append(item)
    else:
      text_items.append(item)

  lines = _group_text_lines(text_items)
  used_math: set[int] = set()
  parts: list[dict[str, Any]] = []
  formula_crops = 0

  # 所有文字顶边，用于限制空隙裁切不跨问
  all_text_tops = sorted(t["bbox"][1] for t in text_items)

  for line in lines:
    consumed = [False] * len(line)
    i = 0
    while i < len(line):
      left = line[i]
      if i + 1 < len(line) and _is_ask_left(left["text"]):
        right_idx = None
        for j in range(i + 1, len(line)):
          if _is_ask_right(line[j]["text"]):
            right_idx = j
            break
        if right_idx is not None:
          right = line[right_idx]
          gap = [
            left["bbox"][2],
            min(left["bbox"][1], right["bbox"][1]),
            right["bbox"][0],
            max(left["bbox"][3], right["bbox"][3]),
          ]
          if gap[2] - gap[0] < 10:
            mid = (left["bbox"][2] + right["bbox"][0]) / 2
            gap[0], gap[2] = mid - 24, mid + 24
          # 下一问文字顶边
          y_limit = None
          cy = _bbox_center_y(left["bbox"])
          for top in all_text_tops:
            if top > cy + 12:
              # 跳过同一行的「的最小值」
              if abs(top - right["bbox"][1]) < 10:
                continue
              y_limit = top
              break
          formula, n, used_box = _recognize_gap_crop(
            img, gap, math_items, y_limit
          )
          formula_crops += n
          for mi, m in enumerate(math_items):
            if _bbox_intersects(used_box, m["bbox"], pad=6):
              used_math.add(mi)
          mid = formula if formula else " "
          parts.append(
            {
              "y": left["bbox"][1],
              "x": left["bbox"][0],
              "text": f"{left['text']}{mid}{right['text']}",
              "source": "smart-gap",
            }
          )
          consumed[i] = True
          consumed[right_idx] = True
          i = right_idx + 1
          continue
      if not consumed[i]:
        parts.append(
          {
            "y": left["bbox"][1],
            "x": left["bbox"][0],
            "text": left["text"],
            "source": "paddle",
          }
        )
        consumed[i] = True
      i += 1

  # 未被空隙吃掉的公式碎片：仍按簇识别
  leftover = [m for mi, m in enumerate(math_items) if mi not in used_math]
  for cluster in _cluster_math_boxes(leftover):
    ub = _union_bbox([c["bbox"] for c in cluster])
    latex = ""
    try:
      crop_bytes = _crop_png(img, ub, pad=8.0)
      if len(crop_bytes) > 80:
        fr = _run_formula_bytes(crop_bytes)
        latex = (fr.get("text") or "").strip()
        formula_crops += 1
    except Exception:
      latex = ""
    paddle_fb = _paddle_cluster_text(cluster)
    out_text = paddle_fb
    if latex and not _looks_like_latex_garbage(latex):
      digits_ok = any(
        re.sub(r"\D", "", c["text"]) and re.sub(r"\D", "", c["text"]) in latex
        for c in cluster
      )
      if digits_ok or "\\frac" in latex:
        # 仍偏好能对上碎片的结果
        if not any(
          x in latex for x in ("mathbf", "stackrel", "longrightarrow")
        ):
          out_text = latex
    parts.append({"y": ub[1], "x": ub[0], "text": out_text, "source": "math-leftover"})

  parts.sort(key=lambda p: (round(p["y"] / 10) * 10, p["x"]))
  merged = "\n".join(p["text"] for p in parts if p["text"]).strip()
  if not merged:
    merged = plain

  return {
    "text": merged,
    "confidence": paddle.get("confidence"),
    "lineCount": len([ln for ln in merged.splitlines() if ln.strip()]),
    "engine": "smart-paddle+formula",
    "formulaCrops": formula_crops,
  }


@app.post("/ocr/formula")
@app.post("/ocr")
async def ocr_formula(
  file: Optional[UploadFile] = File(None),
  path: Optional[str] = Form(None),
):
  try:
    if file is not None:
      content = await file.read()
      data = _run_formula_bytes(content)
    elif path:
      if not os.path.isfile(path):
        raise HTTPException(status_code=400, detail=f"image not found: {path}")
      with open(path, "rb") as f:
        data = _run_formula_bytes(f.read())
    else:
      raise HTTPException(status_code=400, detail="provide file or path")
    return JSONResponse({"success": True, "data": data})
  except HTTPException:
    raise
  except Exception as e:
    traceback.print_exc()
    raise HTTPException(status_code=500, detail=f"formula OCR failed: {e}") from e


@app.post("/ocr/smart")
async def ocr_smart(
  file: Optional[UploadFile] = File(None),
  path: Optional[str] = Form(None),
):
  try:
    if file is not None:
      content = await file.read()
      name = file.filename or "img.png"
      data = _run_smart(content, name)
    elif path:
      if not os.path.isfile(path):
        raise HTTPException(status_code=400, detail=f"image not found: {path}")
      with open(path, "rb") as f:
        data = _run_smart(f.read(), os.path.basename(path))
    else:
      raise HTTPException(status_code=400, detail="provide file or path")
    return JSONResponse({"success": True, "data": data})
  except HTTPException:
    raise
  except Exception as e:
    traceback.print_exc()
    raise HTTPException(status_code=500, detail=f"smart OCR failed: {e}") from e
