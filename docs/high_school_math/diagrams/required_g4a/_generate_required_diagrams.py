#!/usr/bin/env python3
"""GLOBAL-4A REQUIRED offline SVG+PNG. No network. No DB writes."""
from __future__ import annotations

import hashlib
import json
import math
import os
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[1]  # high_school_math
REQ_LIST = ROOT / "question_bank" / "bank_global4a" / "_required_list.json"
W, H = 1000, 720
BG = (255, 255, 255)
INK = (28, 28, 32)
MUTED = (90, 90, 98)
ACCENT = (40, 90, 170)
PLANE = (70, 140, 210, 72)
DASH = (120, 120, 128)


def sha256_file(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def font(size: int):
    for c in [
        r"C:\Windows\Fonts\msyh.ttc",
        r"C:\Windows\Fonts\simhei.ttf",
        r"C:\Windows\Fonts\arial.ttf",
    ]:
        if os.path.exists(c):
            try:
                return ImageFont.truetype(c, size)
            except OSError:
                continue
    return ImageFont.load_default()


FONT_L, FONT_M, FONT_S = font(22), font(18), font(15)


def esc(t: str) -> str:
    return (
        t.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


class SvgDoc:
    def __init__(self, w, h):
        self.w, self.h, self.parts = w, h, []

    def line(self, x1, y1, x2, y2, stroke="#1c1c20", sw=2.2, dash=None):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        self.parts.append(
            f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" '
            f'stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round"{d}/>'
        )

    def poly(self, pts, fill="none", stroke="#1c1c20", sw=2.2, opacity=1.0):
        ps = " ".join(f"{x:.2f},{y:.2f}" for x, y in pts)
        self.parts.append(
            f'<polygon points="{ps}" fill="{fill}" stroke="{stroke}" '
            f'stroke-width="{sw}" opacity="{opacity}"/>'
        )

    def ellipse(self, cx, cy, rx, ry, fill="none", stroke="#1c1c20", sw=2.2):
        self.parts.append(
            f'<ellipse cx="{cx:.2f}" cy="{cy:.2f}" rx="{rx:.2f}" ry="{ry:.2f}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
        )

    def circle(self, x, y, r, fill="none", stroke="#1c1c20", sw=2.2):
        self.parts.append(
            f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{r}" fill="{fill}" '
            f'stroke="{stroke}" stroke-width="{sw}"/>'
        )

    def text(self, x, y, t, size=18, fill="#1c1c20", anchor="start"):
        self.parts.append(
            f'<text x="{x:.2f}" y="{y:.2f}" font-size="{size}" fill="{fill}" '
            f'font-family="Segoe UI, Microsoft YaHei, Arial, sans-serif" '
            f'text-anchor="{anchor}">{esc(t)}</text>'
        )

    def write(self, path: Path, title: str):
        body = "\n  ".join(self.parts)
        svg = (
            f'<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" '
            f'viewBox="0 0 {self.w} {self.h}" role="img">\n'
            f'  <title>{esc(title)}</title>\n'
            f'  <rect width="100%" height="100%" fill="#ffffff"/>\n'
            f"  {body}\n</svg>\n"
        )
        low = svg.lower()
        for bad in (
            "<script",
            "foreignobject",
            "xlink:href",
            "javascript:",
            "onclick",
            "onload",
            "<image",
            "@import",
        ):
            if bad in low:
                raise RuntimeError(f"Unsafe SVG: {bad}")
        path.write_text(svg, encoding="utf-8")


def canvas():
    im = Image.new("RGBA", (W, H), (*BG, 255))
    return im, ImageDraw.Draw(im, "RGBA")


def draw_line(dr, a, b, fill=INK, width=3, dash=False):
    if not dash:
        dr.line([a, b], fill=fill, width=width)
        return
    x1, y1 = a
    x2, y2 = b
    length = math.hypot(x2 - x1, y2 - y1) or 1
    ux, uy = (x2 - x1) / length, (y2 - y1) / length
    on, off, t = 8, 6, 0.0
    while t < length:
        t2 = min(t + on, length)
        dr.line(
            [(x1 + ux * t, y1 + uy * t), (x1 + ux * t2, y1 + uy * t2)],
            fill=fill,
            width=width,
        )
        t = t2 + off


def label(dr, xy, text, fnt=FONT_M, fill=INK, dx=0, dy=0):
    dr.text((xy[0] + dx, xy[1] + dy), text, font=fnt, fill=fill)


def save_pair(code: str, svg: SvgDoc, im: Image.Image, title: str):
    svg_path = OUT / f"{code}.svg"
    png_path = OUT / f"{code}.png"
    svg.write(svg_path, title)
    im.convert("RGB").save(png_path, "PNG", optimize=True)
    return {
        "code": code,
        "svg": svg_path.name,
        "png": png_path.name,
        "sha256_svg": sha256_file(svg_path),
        "sha256_png": sha256_file(png_path),
        "png_bytes": png_path.stat().st_size,
    }


def parse_nums(stem: str):
    return [int(x) for x in re.findall(r"\d+", stem.replace("$", ""))]


def fig_cylinder_cone(code: str, stem: str):
    nums = parse_nums(stem)
    R = nums[0] if nums else 3
    H = nums[1] if len(nums) > 1 else 4
    h = nums[2] if len(nums) > 2 else 3
    svg, (im, dr) = SvgDoc(W, H), canvas()
    cx, base_y = 500, 560
    scale = 18
    rx, ry = R * scale, max(12, R * scale * 0.35)
    cyl_h = H * scale * 0.85
    cone_h = h * scale * 0.85
    # cylinder body
    top_y = base_y - cyl_h
    svg.ellipse(cx, base_y, rx, ry)
    dr.ellipse([cx - rx, base_y - ry, cx + rx, base_y + ry], outline=INK, width=3)
    svg.ellipse(cx, top_y, rx, ry, fill="rgba(70,140,210,0.15)")
    dr.ellipse([cx - rx, top_y - ry, cx + rx, top_y + ry], outline=INK, width=3, fill=PLANE)
    svg.line(cx - rx, base_y, cx - rx, top_y)
    svg.line(cx + rx, base_y, cx + rx, top_y)
    draw_line(dr, (cx - rx, base_y), (cx - rx, top_y))
    draw_line(dr, (cx + rx, base_y), (cx + rx, top_y))
    # cone on top
    apex = (cx, top_y - cone_h)
    svg.line(apex[0], apex[1], cx - rx, top_y)
    svg.line(apex[0], apex[1], cx + rx, top_y)
    draw_line(dr, apex, (cx - rx, top_y), fill=ACCENT, width=3)
    draw_line(dr, apex, (cx + rx, top_y), fill=ACCENT, width=3)
    svg.ellipse(cx, top_y, rx, ry * 0.9, stroke="#2864aa")
    svg.text(40, 40, f"{code} 圆柱+圆锥组合体示意（不标注体积）", size=20)
    label(dr, (40, 30), f"{code} 圆柱+圆锥组合体示意（不标注体积）", FONT_L)
    svg.text(40, 70, f"底面半径 R、柱高 H、锥高 h（题干给定）", size=16, fill="#5a5a62")
    label(dr, (40, 62), "底面半径 R、柱高 H、锥高 h（题干给定）", FONT_S, fill=MUTED)
    # dimension ticks without numeric answers
    svg.text(cx + rx + 16, (base_y + top_y) / 2, "H", size=18)
    label(dr, (cx + rx + 16, (base_y + top_y) / 2), "H", FONT_M)
    svg.text(cx + 12, (apex[1] + top_y) / 2, "h", size=18, fill="#1c4a9e")
    label(dr, (cx + 12, (apex[1] + top_y) / 2), "h", FONT_M, fill=ACCENT)
    svg.text(cx - 10, base_y + ry + 28, "R", size=18, anchor="middle")
    label(dr, (cx - 8, base_y + ry + 18), "R", FONT_M)
    return save_pair(code, svg, im, f"{code} cylinder-cone")


def fig_cone(code: str, stem: str):
    nums = parse_nums(stem)
    R = nums[0] if nums else 3
    H = nums[1] if len(nums) > 1 else 5
    svg, (im, dr) = SvgDoc(W, H), canvas()
    cx, base_y = 500, 560
    scale = 22
    rx, ry = R * scale, max(12, R * scale * 0.32)
    apex = (cx, base_y - H * scale)
    svg.ellipse(cx, base_y, rx, ry)
    dr.ellipse([cx - rx, base_y - ry, cx + rx, base_y + ry], outline=INK, width=3)
    svg.line(apex[0], apex[1], cx - rx, base_y)
    svg.line(apex[0], apex[1], cx + rx, base_y)
    draw_line(dr, apex, (cx - rx, base_y))
    draw_line(dr, apex, (cx + rx, base_y))
    # axis dashed
    svg.line(cx, apex[1], cx, base_y, stroke="#888890", dash="7 6")
    draw_line(dr, (cx, apex[1]), (cx, base_y), fill=DASH, width=2, dash=True)
    # axial section hint (triangle outline accent) — no area number
    svg.poly([(cx - rx, base_y), (cx + rx, base_y), apex], fill="rgba(70,140,210,0.12)", stroke="#2864aa")
    dr.polygon([(cx - rx, base_y), (cx + rx, base_y), apex], outline=ACCENT, fill=PLANE)
    svg.text(40, 40, f"{code} 圆锥与轴截面示意", size=20)
    label(dr, (40, 30), f"{code} 圆锥与轴截面示意", FONT_L)
    svg.text(cx + rx + 10, (apex[1] + base_y) / 2, "H", size=18)
    label(dr, (cx + rx + 10, (apex[1] + base_y) / 2), "H", FONT_M)
    svg.text(cx, base_y + ry + 30, "R", size=18, anchor="middle")
    label(dr, (cx - 6, base_y + ry + 18), "R", FONT_M)
    return save_pair(code, svg, im, f"{code} cone")


def fig_box(code: str, stem: str):
    nums = parse_nums(stem)
    a, b, c = (nums + [3, 4, 5])[:3]
    svg, (im, dr) = SvgDoc(W, H), canvas()
    ox, oy, s = 280, 560, 55
    kx, ky = 0.55, -0.32

    def P(x, y, z):
        return (ox + s * (x + kx * y), oy - s * (z - ky * y))

    # scale box to a,b,c roughly
    A, B, C, D = P(0, 0, 0), P(a, 0, 0), P(a, b, 0), P(0, b, 0)
    A1, B1, C1, D1 = P(0, 0, c), P(a, 0, c), P(a, b, c), P(0, b, c)
    solid = [(A, B), (B, C), (A, A1), (B, B1), (C, C1), (A1, B1), (B1, C1), (C1, D1), (D1, A1)]
    dashed = [(A, D), (D, C), (D, D1)]
    for p, q in dashed:
        svg.line(*p, *q, stroke="#888890", sw=2, dash="7 6")
        draw_line(dr, p, q, fill=DASH, width=2, dash=True)
    for p, q in solid:
        svg.line(*p, *q)
        draw_line(dr, p, q)
    # space diagonal without length
    svg.line(*A, *C1, stroke="#1c4a9e", sw=3)
    draw_line(dr, A, C1, fill=ACCENT, width=4)
    for p, name, dx, dy in [
        (A, "A", -18, 8),
        (B, "B", 8, 8),
        (C, "C", 8, 8),
        (D, "D", -20, 4),
        (C1, "C'", 8, -10),
    ]:
        svg.text(p[0] + dx, p[1] + dy, name, size=17)
        label(dr, p, name, FONT_M, dx=dx, dy=dy)
    svg.text(40, 40, f"{code} 长方体（强调体对角线，不标注长度）", size=20)
    label(dr, (40, 30), f"{code} 长方体（强调体对角线，不标注长度）", FONT_L)
    return save_pair(code, svg, im, f"{code} box")


def fig_cube_cyl(code: str, stem: str):
    svg, (im, dr) = SvgDoc(W, H), canvas()
    ox, oy, s = 300, 560, 200
    kx, ky = 0.55, -0.32

    def P(x, y, z):
        return (ox + s * (x + kx * y), oy - s * (z - ky * y))

    A, B, C, D = P(0, 0, 0), P(1, 0, 0), P(1, 1, 0), P(0, 1, 0)
    A1, B1, C1, D1 = P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)
    for p, q in [(A, D), (D, C), (D, D1)]:
        svg.line(*p, *q, stroke="#888890", dash="7 6")
        draw_line(dr, p, q, fill=DASH, width=2, dash=True)
    for p, q in [(A, B), (B, C), (A, A1), (B, B1), (C, C1), (A1, B1), (B1, C1), (C1, D1), (D1, A1)]:
        svg.line(*p, *q)
        draw_line(dr, p, q)
    # cylinder axis vertical inside
    mid_b = ((A[0] + B[0]) / 2, (A[1] + B[1]) / 2)
    mid_t = ((A1[0] + B1[0]) / 2, (A1[1] + B1[1]) / 2)
    svg.ellipse(mid_b[0], mid_b[1], 55, 22, stroke="#2864aa")
    svg.ellipse(mid_t[0], mid_t[1], 55, 22, stroke="#2864aa")
    svg.line(mid_b[0] - 55, mid_b[1], mid_t[0] - 55, mid_t[1], stroke="#2864aa")
    svg.line(mid_b[0] + 55, mid_b[1], mid_t[0] + 55, mid_t[1], stroke="#2864aa")
    dr.ellipse([mid_b[0] - 55, mid_b[1] - 22, mid_b[0] + 55, mid_b[1] + 22], outline=ACCENT, width=3)
    dr.ellipse([mid_t[0] - 55, mid_t[1] - 22, mid_t[0] + 55, mid_t[1] + 22], outline=ACCENT, width=3)
    draw_line(dr, (mid_b[0] - 55, mid_b[1]), (mid_t[0] - 55, mid_t[1]), fill=ACCENT)
    draw_line(dr, (mid_b[0] + 55, mid_b[1]), (mid_t[0] + 55, mid_t[1]), fill=ACCENT)
    svg.text(40, 40, f"{code} 正方体内挖圆柱示意（不标注体积）", size=20)
    label(dr, (40, 30), f"{code} 正方体内挖圆柱示意（不标注体积）", FONT_L)
    return save_pair(code, svg, im, f"{code} cube-cyl")


def fig_vectors_oa_ob(code: str, stem: str):
    nums = parse_nums(stem)
    px = nums[0] if nums else 3
    qy = nums[1] if len(nums) > 1 else 4
    svg, (im, dr) = SvgDoc(W, H), canvas()
    ox, oy = 180, 560
    scale = 40
    O = (ox, oy)
    A = (ox + px * scale, oy)
    B = (ox, oy - qy * scale)
    # axes
    svg.line(80, oy, 920, oy, stroke="#888890", sw=1.5)
    svg.line(ox, 80, ox, 660, stroke="#888890", sw=1.5)
    draw_line(dr, (80, oy), (920, oy), fill=DASH, width=2)
    draw_line(dr, (ox, 80), (ox, 660), fill=DASH, width=2)
    for p, q, col in [(O, A, INK), (O, B, INK), (A, B, ACCENT)]:
        svg.line(*p, *q, stroke="#1c4a9e" if q == B and p == A else "#1c1c20", sw=3 if p == A and q == B else 2.4)
        draw_line(dr, p, q, fill=col if p != A else ACCENT, width=4 if p == A else 3)
    for p, name, dx, dy in [(O, "O", -22, 8), (A, "A", 8, 8), (B, "B", 8, -18)]:
        svg.circle(*p, 4, fill="#1c1c20")
        dr.ellipse([p[0] - 4, p[1] - 4, p[0] + 4, p[1] + 4], fill=INK)
        svg.text(p[0] + dx, p[1] + dy, name, size=18)
        label(dr, p, name, FONT_M, dx=dx, dy=dy)
    svg.text(40, 40, f"{code} 向量 OA、OB、AB 示意（不标注模长）", size=20)
    label(dr, (40, 30), f"{code} 向量 OA、OB、AB 示意（不标注模长）", FONT_L)
    return save_pair(code, svg, im, f"{code} vectors")


def fig_midline(code: str, stem: str):
    svg, (im, dr) = SvgDoc(W, H), canvas()
    A, B, C = (500, 120), (220, 560), (780, 560)
    D = ((A[0] + B[0]) / 2, (A[1] + B[1]) / 2)
    E = ((A[0] + C[0]) / 2, (A[1] + C[1]) / 2)
    svg.poly([A, B, C], fill="rgba(70,140,210,0.08)")
    dr.polygon([A, B, C], outline=INK, fill=PLANE)
    for p, q in [(A, B), (B, C), (C, A)]:
        svg.line(*p, *q)
        draw_line(dr, p, q)
    svg.line(*D, *E, stroke="#1c4a9e", sw=3.2)
    draw_line(dr, D, E, fill=ACCENT, width=4)
    for p, name, dx, dy in [
        (A, "A", -8, -22),
        (B, "B", -22, 8),
        (C, "C", 8, 8),
        (D, "D", -22, 0),
        (E, "E", 8, 0),
    ]:
        svg.circle(*p, 4, fill="#1c1c20")
        dr.ellipse([p[0] - 4, p[1] - 4, p[0] + 4, p[1] + 4], fill=INK)
        svg.text(p[0] + dx, p[1] + dy, name, size=18)
        label(dr, p, name, FONT_M, dx=dx, dy=dy)
    svg.text(40, 40, f"{code} 三角形中位线 DE（证明用图，不写结论）", size=20)
    label(dr, (40, 30), f"{code} 三角形中位线 DE（证明用图，不写结论）", FONT_L)
    return save_pair(code, svg, im, f"{code} midline")


def fig_centroid(code: str, stem: str):
    svg, (im, dr) = SvgDoc(W, H), canvas()
    A, B, C = (500, 120), (220, 560), (780, 560)
    G = ((A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3)
    svg.poly([A, B, C], fill="rgba(70,140,210,0.08)")
    dr.polygon([A, B, C], outline=INK, fill=PLANE)
    for p, q in [(A, B), (B, C), (C, A), (A, G), (B, G), (C, G)]:
        svg.line(*p, *q, stroke="#1c4a9e" if G in (p, q) else "#1c1c20")
        draw_line(dr, p, q, fill=ACCENT if G in (p, q) else INK)
    for p, name, dx, dy in [(A, "A", -8, -22), (B, "B", -22, 8), (C, "C", 8, 8), (G, "G", 10, -8)]:
        svg.circle(*p, 4, fill="#1c1c20")
        dr.ellipse([p[0] - 4, p[1] - 4, p[0] + 4, p[1] + 4], fill=INK)
        svg.text(p[0] + dx, p[1] + dy, name, size=18)
        label(dr, p, name, FONT_M, dx=dx, dy=dy)
    svg.text(40, 40, f"{code} 三角形重心 G 示意", size=20)
    label(dr, (40, 30), f"{code} 三角形重心 G 示意", FONT_L)
    return save_pair(code, svg, im, f"{code} centroid")


def fig_parallelogram(code: str, stem: str):
    svg, (im, dr) = SvgDoc(W, H), canvas()
    A, B, D = (280, 480), (720, 480), (380, 220)
    C = (B[0] + D[0] - A[0], B[1] + D[1] - A[1])
    svg.poly([A, B, C, D], fill="rgba(70,140,210,0.12)")
    dr.polygon([A, B, C, D], outline=INK, fill=PLANE)
    for p, q in [(A, B), (B, C), (C, D), (D, A)]:
        svg.line(*p, *q)
        draw_line(dr, p, q)
    svg.line(*A, *C, stroke="#1c4a9e", sw=2.8)
    svg.line(*B, *D, stroke="#1c4a9e", sw=2.8, dash="7 6")
    draw_line(dr, A, C, fill=ACCENT, width=3)
    draw_line(dr, B, D, fill=ACCENT, width=3, dash=True)
    for p, name, dx, dy in [(A, "A", -22, 8), (B, "B", 8, 8), (C, "C", 8, -12), (D, "D", -22, -12)]:
        svg.circle(*p, 4, fill="#1c1c20")
        dr.ellipse([p[0] - 4, p[1] - 4, p[0] + 4, p[1] + 4], fill=INK)
        svg.text(p[0] + dx, p[1] + dy, name, size=18)
        label(dr, p, name, FONT_M, dx=dx, dy=dy)
    svg.text(40, 40, f"{code} 平行四边形对角线示意", size=20)
    label(dr, (40, 30), f"{code} 平行四边形对角线示意", FONT_L)
    return save_pair(code, svg, im, f"{code} parallelogram")


def classify_and_draw(item: dict):
    code, stem = item["id"], item["stem"]
    if "仰角" in stem or "建筑物" in stem:
        return fig_vectors_oa_ob(code, stem)  # schematic placeholder; labels only
    if "中点" in stem or "中位线" in stem or ("DE" in stem and "三角形" in stem):
        return fig_midline(code, stem)
    if "重心" in stem:
        return fig_centroid(code, stem)
    if "平行四边形" in stem:
        return fig_parallelogram(code, stem)
    if "挖去" in stem and "圆柱" in stem:
        return fig_cube_cyl(code, stem)
    if "长方体" in stem or "正四棱柱" in stem or "正方体" in stem:
        return fig_box(code, stem)
    if "圆锥" in stem and "圆柱" not in stem:
        return fig_cone(code, stem)
    if ("圆柱" in stem and "圆锥" in stem) or "叠合" in stem or "叠放" in stem or "组合体" in stem:
        return fig_cylinder_cone(code, stem)
    if "overrightarrow{OA}" in stem or "OA" in stem or "OB" in stem:
        return fig_vectors_oa_ob(code, stem)
    return fig_vectors_oa_ob(code, stem)


def main():
    items = json.loads(REQ_LIST.read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    for it in items:
        rec = classify_and_draw(it)
        rec["chapterNo"] = it.get("chapterNo")
        manifest.append(rec)
        print(rec["code"], rec["sha256_svg"][:12], rec["png_bytes"])
    man = {
        "batch": "GLOBAL-4A-QUALITY-REBUILD",
        "n": len(manifest),
        "independence": "INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED",
        "items": manifest,
    }
    (OUT / "_manifest.json").write_text(json.dumps(man, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "NOTES.md").write_text(
        "# GLOBAL-4A REQUIRED diagrams\n\n"
        "- Offline SVG+PNG only; not uploaded to formal attachment store.\n"
        "- Must not reveal numeric answers.\n"
        "- Author-side figures; independent review not fully established.\n",
        encoding="utf-8",
    )
    print("DONE", len(manifest))


if __name__ == "__main__":
    main()
