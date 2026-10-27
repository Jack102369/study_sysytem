#!/usr/bin/env python3
"""GLOBAL-3A REQUIRED offline SVG+PNG. No network. No DB writes."""
from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
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

    def circle(self, x, y, r, fill="none", stroke="#1c1c20", sw=2.2):
        self.parts.append(
            f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{r}" fill="{fill}" '
            f'stroke="{stroke}" stroke-width="{sw}"/>'
        )

    def arc_path(self, cx, cy, r, a0, a1, stroke="#1c1c20", sw=2.4):
        x0, y0 = cx + r * math.cos(a0), cy + r * math.sin(a0)
        x1, y1 = cx + r * math.cos(a1), cy + r * math.sin(a1)
        large = 1 if abs(a1 - a0) > math.pi else 0
        sweep = 1 if a1 > a0 else 0
        self.parts.append(
            f'<path d="M {x0:.2f},{y0:.2f} A {r:.2f},{r:.2f} 0 {large} {sweep} {x1:.2f},{y1:.2f}" '
            f'fill="none" stroke="{stroke}" stroke-width="{sw}"/>'
        )

    def ellipse(self, cx, cy, rx, ry, fill="none", stroke="#1c1c20", sw=2.2):
        self.parts.append(
            f'<ellipse cx="{cx:.2f}" cy="{cy:.2f}" rx="{rx:.2f}" ry="{ry:.2f}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
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


def cube_pts(ox=320, oy=520, s=200, kx=0.55, ky=-0.32):
    def P(x, y, z):
        return (ox + s * (x + kx * y), oy - s * (z - ky * y))

    A, B, C, D = P(0, 0, 0), P(1, 0, 0), P(1, 1, 0), P(0, 1, 0)
    A1, B1, C1, D1 = P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)
    return A, B, C, D, A1, B1, C1, D1


def draw_cube(svg, dr, pts, emphasize=(), shade=None):
    A, B, C, D, A1, B1, C1, D1 = pts
    solid = [
        (A, B),
        (B, C),
        (A, A1),
        (B, B1),
        (C, C1),
        (A1, B1),
        (B1, C1),
        (C1, D1),
        (D1, A1),
    ]
    dashed = [(A, D), (D, C), (D, D1)]
    if shade:
        svg.poly(shade, fill="rgba(70,140,210,0.28)", stroke="#2864aa", sw=2)
        dr.polygon(shade, fill=PLANE, outline=(40, 100, 170, 220))
    for a, b in dashed:
        svg.line(*a, *b, stroke="#888890", sw=2, dash="7 6")
        draw_line(dr, a, b, fill=DASH, width=2, dash=True)
    for a, b in solid:
        svg.line(*a, *b, stroke="#1c1c20", sw=2.4)
        draw_line(dr, a, b, fill=INK, width=3)
    for a, b in emphasize:
        svg.line(*a, *b, stroke="#1c4a9e", sw=3.2)
        draw_line(dr, a, b, fill=ACCENT, width=4)
    names = [
        (A, "A", -18, 8),
        (B, "B", 8, 8),
        (C, "C", 8, 8),
        (D, "D", -20, 4),
        (A1, "A1", -22, -8),
        (B1, "B1", 8, -10),
        (C1, "C1", 8, -8),
        (D1, "D1", -22, -10),
    ]
    for p, name, dx, dy in names:
        svg.text(p[0] + dx, p[1] + dy, name, size=17)
        label(dr, p, name, FONT_M, dx=dx, dy=dy)


def make_048():
    """Unit circle with angle π−π/3."""
    svg, (im, dr) = SvgDoc(W, H), canvas()
    cx, cy, r = 500, 380, 220
    svg.circle(cx, cy, r)
    dr.ellipse([cx - r, cy - r, cx + r, cy + r], outline=INK, width=3)
    # axes
    svg.line(cx - r - 40, cy, cx + r + 50, cy)
    svg.line(cx, cy + r + 40, cx, cy - r - 50)
    draw_line(dr, (cx - r - 40, cy), (cx + r + 50, cy))
    draw_line(dr, (cx, cy + r + 40), (cx, cy - r - 50))
    # angle 2π/3 from positive x (SVG: y down → use -theta for math)
    theta = 2 * math.pi / 3
    a_svg = -theta
    x1 = cx + r * math.cos(a_svg)
    y1 = cy + r * math.sin(a_svg)
    svg.line(cx, cy, x1, y1, stroke="#1c4a9e", sw=3)
    draw_line(dr, (cx, cy), (x1, y1), fill=ACCENT, width=4)
    # reference π/3 ray (dashed)
    a_ref = -math.pi / 3
    xr = cx + r * 0.85 * math.cos(a_ref)
    yr = cy + r * 0.85 * math.sin(a_ref)
    svg.line(cx, cy, xr, yr, stroke="#888890", sw=1.8, dash="6 5")
    draw_line(dr, (cx, cy), (xr, yr), fill=DASH, width=2, dash=True)
    svg.arc_path(cx, cy, 48, 0, a_svg, stroke="#1c4a9e", sw=2)
    # small arc on png
    bbox = [cx - 48, cy - 48, cx + 48, cy + 48]
    dr.arc(bbox, start=math.degrees(a_svg), end=0, fill=ACCENT, width=2)
    svg.text(cx - 12, cy + 18, "O", size=18)
    label(dr, (cx, cy), "O", dx=-12, dy=8)
    svg.text(x1 + 8, y1 - 8, "P", size=18)
    label(dr, (x1, y1), "P", dx=8, dy=-12)
    svg.text(cx + 60, cy - 30, "π−π/3", size=16, fill="#1c4a9e")
    label(dr, (cx + 55, cy - 40), "π−π/3", FONT_S, fill=ACCENT)
    svg.text(120, 60, "单位圆 · 标准位置角（示意）", size=20)
    label(dr, (120, 40), "单位圆 · 标准位置角（示意）", FONT_L)
    svg.text(120, 95, "标终边与参考角；不标注 cos 数值", size=15, fill="#5a5a62")
    label(dr, (120, 78), "标终边与参考角；不标注 cos 数值", FONT_S, fill=MUTED)
    svg.text(120, 680, "CAND-G3A-048 · 教学示意图", size=14, fill="#5a5a62")
    label(dr, (120, 670), "CAND-G3A-048 · 教学示意图", FONT_S, fill=MUTED)
    return save_pair("CAND-G3A-048", svg, im, "CAND-G3A-048 unit circle")


def make_055():
    """Triangle SSA: angle A=30°, a=6, b=6√2."""
    svg, (im, dr) = SvgDoc(W, H), canvas()
    # Place A left, C right-ish, B two possible — draw one configuration
    A = (220, 520)
    C = (780, 520)
    B = (520, 180)
    svg.poly([A, B, C], fill="rgba(70,140,210,0.12)", stroke="#1c1c20", sw=2.5)
    dr.polygon([A, B, C], fill=(70, 140, 210, 40), outline=INK)
    for a, b in [(A, B), (B, C), (C, A)]:
        draw_line(dr, a, b, width=3)
    for p, name, dx, dy in [(A, "A", -22, 8), (B, "B", 0, -22), (C, "C", 10, 8)]:
        svg.text(p[0] + dx, p[1] + dy, name, size=18)
        label(dr, p, name, dx=dx, dy=dy)
    # labels for sides / angle (givens only) — place on the correct edges
    # a=BC opposite A → along BC; b=AC opposite B → along AC base
    mid_bc = ((B[0] + C[0]) / 2, (B[1] + C[1]) / 2)
    mid_ac = ((A[0] + C[0]) / 2, (A[1] + C[1]) / 2)
    svg.text(mid_bc[0] + 28, mid_bc[1] - 8, "a=BC=6", size=16, fill="#1c4a9e")
    label(dr, (mid_bc[0] + 10, mid_bc[1] - 18), "a=BC=6", FONT_S, fill=ACCENT)
    svg.text(mid_ac[0], mid_ac[1] + 28, "b=AC=6√2", size=16, fill="#1c4a9e", anchor="middle")
    label(dr, (mid_ac[0] - 40, mid_ac[1] + 18), "b=AC=6√2", FONT_S, fill=ACCENT)
    svg.text(250, 500, "A=30°", size=16, fill="#1c4a9e")
    label(dr, (240, 485), "A=30°", FONT_S, fill=ACCENT)
    svg.text(120, 60, "△ABC · SSA 已知量示意（非测高）", size=20)
    label(dr, (120, 40), "△ABC · SSA 已知量示意（非测高）", FONT_L)
    svg.text(120, 95, "标角A与边a、b；不标注角B最终值", size=15, fill="#5a5a62")
    label(dr, (120, 78), "标角A与边a、b；不标注角B最终值", FONT_S, fill=MUTED)
    svg.text(120, 680, "CAND-G3A-055 · 教学示意图", size=14, fill="#5a5a62")
    label(dr, (120, 670), "CAND-G3A-055 · 教学示意图", FONT_S, fill=MUTED)
    return save_pair("CAND-G3A-055", svg, im, "CAND-G3A-055 triangle SSA")


def make_068():
    """Parallelogram with diagonals."""
    svg, (im, dr) = SvgDoc(W, H), canvas()
    A, B, C, D = (220, 480), (620, 480), (760, 250), (360, 250)
    svg.poly([A, B, C, D], fill="rgba(70,140,210,0.12)", stroke="#1c1c20", sw=2.5)
    dr.polygon([A, B, C, D], fill=(70, 140, 210, 40), outline=INK)
    for a, b in [(A, B), (B, C), (C, D), (D, A)]:
        draw_line(dr, a, b)
    # diagonals
    svg.line(*A, *C, stroke="#1c4a9e", sw=2.8)
    svg.line(*B, *D, stroke="#1c4a9e", sw=2.8)
    draw_line(dr, A, C, fill=ACCENT, width=3)
    draw_line(dr, B, D, fill=ACCENT, width=3)
    # intersection without midpoint claim
    Ox = (A[0] + C[0]) / 2
    Oy = (A[1] + C[1]) / 2
    svg.circle(Ox, Oy, 4, fill="#1c4a9e")
    dr.ellipse([Ox - 4, Oy - 4, Ox + 4, Oy + 4], fill=ACCENT)
    for p, name, dx, dy in [
        (A, "A", -20, 8),
        (B, "B", 8, 8),
        (C, "C", 8, -8),
        (D, "D", -22, -8),
    ]:
        svg.text(p[0] + dx, p[1] + dy, name, size=18)
        label(dr, p, name, dx=dx, dy=dy)
    svg.text(120, 60, "平行四边形 ABCD（示意）", size=20)
    label(dr, (120, 40), "平行四边形 ABCD（示意）", FONT_L)
    svg.text(120, 95, "淡标对角线 AC、BD；不标注互相平分结论", size=15, fill="#5a5a62")
    label(dr, (120, 78), "淡标对角线 AC、BD；不标注互相平分结论", FONT_S, fill=MUTED)
    svg.text(120, 680, "CAND-G3A-068 · 教学示意图", size=14, fill="#5a5a62")
    label(dr, (120, 670), "CAND-G3A-068 · 教学示意图", FONT_S, fill=MUTED)
    return save_pair("CAND-G3A-068", svg, im, "CAND-G3A-068 parallelogram")


def make_080():
    """Cylinder with cone on top."""
    svg, (im, dr) = SvgDoc(W, H), canvas()
    cx, rx, ry = 500, 160, 45
    y_bot, y_top, y_apex = 560, 320, 160
    # cylinder
    svg.ellipse(cx, y_bot, rx, ry, stroke="#1c1c20", sw=2.2)
    svg.ellipse(cx, y_top, rx, ry, stroke="#1c1c20", sw=2.2)
    svg.line(cx - rx, y_bot, cx - rx, y_top)
    svg.line(cx + rx, y_bot, cx + rx, y_top)
    dr.ellipse([cx - rx, y_bot - ry, cx + rx, y_bot + ry], outline=INK, width=3)
    dr.ellipse([cx - rx, y_top - ry, cx + rx, y_top + ry], outline=INK, width=3)
    draw_line(dr, (cx - rx, y_bot), (cx - rx, y_top))
    draw_line(dr, (cx + rx, y_bot), (cx + rx, y_top))
    # cone
    apex = (cx, y_apex)
    svg.line(cx - rx, y_top, *apex, stroke="#1c4a9e", sw=2.8)
    svg.line(cx + rx, y_top, *apex, stroke="#1c4a9e", sw=2.8)
    draw_line(dr, (cx - rx, y_top), apex, fill=ACCENT, width=3)
    draw_line(dr, (cx + rx, y_top), apex, fill=ACCENT, width=3)
    svg.text(cx + rx + 20, (y_bot + y_top) / 2, "h=6", size=16)
    label(dr, (cx + rx + 15, (y_bot + y_top) / 2), "h=6", FONT_S)
    svg.text(cx + 30, (y_top + y_apex) / 2 - 10, "h=3", size=16, fill="#1c4a9e")
    label(dr, (cx + 25, (y_top + y_apex) / 2 - 20), "h=3", FONT_S, fill=ACCENT)
    svg.text(cx - 20, y_bot + ry + 25, "r=2", size=16, anchor="middle")
    label(dr, (cx - 30, y_bot + ry + 15), "r=2", FONT_S)
    svg.text(120, 60, "圆柱上叠放同底圆锥（示意）", size=20)
    label(dr, (120, 40), "圆柱上叠放同底圆锥（示意）", FONT_L)
    svg.text(120, 95, "可标半径与两段高；不标注体积结果", size=15, fill="#5a5a62")
    label(dr, (120, 78), "可标半径与两段高；不标注体积结果", FONT_S, fill=MUTED)
    svg.text(120, 680, "CAND-G3A-080 · 教学示意图", size=14, fill="#5a5a62")
    label(dr, (120, 670), "CAND-G3A-080 · 教学示意图", FONT_S, fill=MUTED)
    return save_pair("CAND-G3A-080", svg, im, "CAND-G3A-080 cylinder cone")


def make_081():
    """Regular tetrahedron."""
    svg, (im, dr) = SvgDoc(W, H), canvas()
    A, B, C = (280, 520), (720, 520), (500, 420)
    D = (500, 160)
    # base
    svg.poly([A, B, C], fill="rgba(70,140,210,0.18)", stroke="#1c1c20", sw=2.2)
    dr.polygon([A, B, C], fill=(70, 140, 210, 50), outline=INK)
    # edges to apex
    for p in (A, B, C):
        svg.line(*p, *D, stroke="#1c1c20", sw=2.4)
        draw_line(dr, p, D)
    # hidden-ish base edge AC dashed? keep all visible for tetrahedral sketch
    for a, b in [(A, B), (B, C), (C, A)]:
        draw_line(dr, a, b)
    for p, name, dx, dy in [
        (A, "A", -20, 8),
        (B, "B", 8, 8),
        (C, "C", 12, 0),
        (D, "D", 8, -12),
    ]:
        svg.text(p[0] + dx, p[1] + dy, name, size=18)
        label(dr, p, name, dx=dx, dy=dy)
    svg.text(120, 60, "正四面体 ABCD（示意）", size=20)
    label(dr, (120, 40), "正四面体 ABCD（示意）", FONT_L)
    svg.text(120, 95, "各棱相等示意；不标注高与体积", size=15, fill="#5a5a62")
    label(dr, (120, 78), "各棱相等示意；不标注高与体积", FONT_S, fill=MUTED)
    svg.text(120, 680, "CAND-G3A-081 · 教学示意图", size=14, fill="#5a5a62")
    label(dr, (120, 670), "CAND-G3A-081 · 教学示意图", FONT_S, fill=MUTED)
    return save_pair("CAND-G3A-081", svg, im, "CAND-G3A-081 tetrahedron")


def make_085():
    """Cuboid with A1B and base shade."""
    svg, (im, dr) = SvgDoc(W, H), canvas()
    pts = cube_pts(ox=300, oy=540, s=210, kx=0.5, ky=-0.28)
    A, B, C, D, A1, B1, C1, D1 = pts
    draw_cube(svg, dr, pts, emphasize=[(A1, B)], shade=[A, B, C, D])
    svg.text(120, 60, "长方体中斜线 A1B 与底面（示意）", size=20)
    label(dr, (120, 40), "长方体中斜线 A1B 与底面（示意）", FONT_L)
    svg.text(120, 95, "底面阴影；可理解 AB 为射影；不标注角度/正弦值", size=15, fill="#5a5a62")
    label(
        dr,
        (120, 78),
        "底面阴影；可理解 AB 为射影；不标注角度/正弦值",
        FONT_S,
        fill=MUTED,
    )
    svg.text(120, 680, "CAND-G3A-085 · 教学示意图", size=14, fill="#5a5a62")
    label(dr, (120, 670), "CAND-G3A-085 · 教学示意图", FONT_S, fill=MUTED)
    return save_pair("CAND-G3A-085", svg, im, "CAND-G3A-085 cuboid angle")


def make_086():
    """Cube with midpoints M on AB, N on CC1, segment MN."""
    svg, (im, dr) = SvgDoc(W, H), canvas()
    pts = cube_pts(ox=300, oy=540, s=210)
    A, B, C, D, A1, B1, C1, D1 = pts
    M = ((A[0] + B[0]) / 2, (A[1] + B[1]) / 2)
    N = ((C[0] + C1[0]) / 2, (C[1] + C1[1]) / 2)
    draw_cube(svg, dr, pts, emphasize=[(M, N)])
    svg.circle(M[0], M[1], 5, fill="#1c4a9e")
    svg.circle(N[0], N[1], 5, fill="#1c4a9e")
    dr.ellipse([M[0] - 5, M[1] - 5, M[0] + 5, M[1] + 5], fill=ACCENT)
    dr.ellipse([N[0] - 5, N[1] - 5, N[0] + 5, N[1] + 5], fill=ACCENT)
    svg.text(M[0] - 8, M[1] + 22, "M", size=17)
    svg.text(N[0] + 10, N[1], "N", size=17)
    label(dr, M, "M", dx=-8, dy=12)
    label(dr, N, "N", dx=10, dy=-4)
    svg.text(120, 60, "正方体中点 M、N 与线段 MN（示意）", size=20)
    label(dr, (120, 40), "正方体中点 M、N 与线段 MN（示意）", FONT_L)
    svg.text(120, 95, "M 为 AB 中点，N 为 CC1 中点；不标注 MN 长度", size=15, fill="#5a5a62")
    label(dr, (120, 78), "M 为 AB 中点，N 为 CC1 中点；不标注 MN 长度", FONT_S, fill=MUTED)
    svg.text(120, 680, "CAND-G3A-086 · 教学示意图", size=14, fill="#5a5a62")
    label(dr, (120, 670), "CAND-G3A-086 · 教学示意图", FONT_S, fill=MUTED)
    return save_pair("CAND-G3A-086", svg, im, "CAND-G3A-086 cube midpoints")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rows = [
        make_048(),
        make_055(),
        make_068(),
        make_080(),
        make_081(),
        make_085(),
        make_086(),
    ]
    manifest = {"phase": "GLOBAL-3A", "items": rows}
    (OUT / "_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    notes = """# REQUIRED_G3A 离线插图

> 阶段：HS-MATH-BANK-GLOBAL-3A
> 生成：`_generate_required_diagrams.py`
> **未上传**；**未写库**

| code | 要点 | 禁止泄露 |
|------|------|----------|
| 048 | 单位圆标准位置角 π−π/3 | cos 数值 |
| 055 | △ABC 的 SSA 已知量（非测高） | 角 B 终值 |
| 068 | 平行四边形对角线 | 互相平分结论 |
| 080 | 圆柱上叠圆锥 | 体积含 π 结果 |
| 081 | 正四面体 | 高与体积 |
| 085 | 长方体斜线与底面 | 线面角正弦值 |
| 086 | 正方体中点连线 MN | MN 长度 |

复核身份：绘图作者自检；独立数学复核 = MATH_REVIEW_PENDING。
"""
    (OUT / "NOTES.md").write_text(notes, encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
