#!/usr/bin/env python3
"""
HS-MATH DIAGRAM-1D offline asset generator.
Writes sanitizable static SVG + PNG. No network. No DB writes.
"""
from __future__ import annotations

import hashlib
import json
import math
import os
from dataclasses import dataclass
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
    candidates = [
        r"C:\Windows\Fonts\msyh.ttc",
        r"C:\Windows\Fonts\simhei.ttf",
        r"C:\Windows\Fonts\arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for c in candidates:
        if os.path.exists(c):
            try:
                return ImageFont.truetype(c, size)
            except OSError:
                continue
    return ImageFont.load_default()


FONT_L = font(22)
FONT_M = font(18)
FONT_S = font(15)


def esc(t: str) -> str:
    return (
        t.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


@dataclass
class SvgDoc:
    w: int
    h: int
    parts: list[str]

    def line(self, x1, y1, x2, y2, stroke="#1c1c20", sw=2.2, dash=None, opacity=1.0):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        op = f' opacity="{opacity}"' if opacity != 1 else ""
        self.parts.append(
            f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" '
            f'stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round"{d}{op}/>'
        )

    def poly(self, pts, fill="none", stroke="#1c1c20", sw=2.2, opacity=1.0, dash=None):
        ps = " ".join(f"{x:.2f},{y:.2f}" for x, y in pts)
        d = f' stroke-dasharray="{dash}"' if dash else ""
        self.parts.append(
            f'<polygon points="{ps}" fill="{fill}" stroke="{stroke}" '
            f'stroke-width="{sw}" opacity="{opacity}"{d}/>'
        )

    def circle(self, x, y, r=3.2, fill="#1c1c20"):
        self.parts.append(
            f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{r}" fill="{fill}"/>'
        )

    def text(self, x, y, t, size=18, fill="#1c1c20", anchor="start"):
        self.parts.append(
            f'<text x="{x:.2f}" y="{y:.2f}" font-size="{size}" fill="{fill}" '
            f'font-family="Segoe UI, Microsoft YaHei, Arial, sans-serif" '
            f'text-anchor="{anchor}">{esc(t)}</text>'
        )

    def arrow(self, x1, y1, x2, y2, stroke="#1c1c20", sw=2.4):
        self.line(x1, y1, x2, y2, stroke=stroke, sw=sw)
        ang = math.atan2(y2 - y1, x2 - x1)
        L, a = 12, 0.45
        p1 = (x2 - L * math.cos(ang - a), y2 - L * math.sin(ang - a))
        p2 = (x2 - L * math.cos(ang + a), y2 - L * math.sin(ang + a))
        self.poly([p1, (x2, y2), p2], fill=stroke, stroke=stroke, sw=1)

    def write(self, path: Path, title: str):
        body = "\n  ".join(self.parts)
        svg = (
            f'<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" '
            f'viewBox="0 0 {self.w} {self.h}" role="img">\n'
            f'  <title>{esc(title)}</title>\n'
            f'  <rect width="100%" height="100%" fill="#ffffff"/>\n'
            f"  {body}\n"
            f"</svg>\n"
        )
        # Safety gate
        low = svg.lower()
        for bad in ("<script", "foreignobject", "xlink:href", "javascript:", "onclick", "onload", "<image", "@import"):
            if bad in low:
                raise RuntimeError(f"Unsafe SVG content: {bad}")
        path.write_text(svg, encoding="utf-8")


def png_canvas():
    im = Image.new("RGBA", (W, H), (*BG, 255))
    dr = ImageDraw.Draw(im, "RGBA")
    return im, dr


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
        p1 = (x1 + ux * t, y1 + uy * t)
        p2 = (x1 + ux * t2, y1 + uy * t2)
        dr.line([p1, p2], fill=fill, width=width)
        t = t2 + off


def draw_arrow(dr, a, b, fill=INK, width=3):
    draw_line(dr, a, b, fill=fill, width=width)
    ang = math.atan2(b[1] - a[1], b[0] - a[0])
    L, aw = 14, 0.45
    p1 = (b[0] - L * math.cos(ang - aw), b[1] - L * math.sin(ang - aw))
    p2 = (b[0] - L * math.cos(ang + aw), b[1] - L * math.sin(ang + aw))
    dr.polygon([p1, b, p2], fill=fill)


def label(dr, xy, text, fnt=FONT_M, fill=INK, dx=0, dy=0):
    dr.text((xy[0] + dx, xy[1] + dy), text, font=fnt, fill=fill)


# ---------- 093 cube ----------
def make_093():
    """Cube ABCD-A1B1C1D1; mark BD1 and plane A1C1D. No perp marks."""
    # Oblique: X right, Z up, Y depth (cabinet-like)
    ox, oy = 320, 520
    s = 210
    kx, ky = 0.55, -0.32  # depth projection

    def P(x, y, z):
        return (ox + s * (x + kx * y), oy - s * (z + (-ky) * y))

    A, B, C, D = P(0, 0, 0), P(1, 0, 0), P(1, 1, 0), P(0, 1, 0)
    A1, B1, C1, D1 = P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)

    # Hidden: AD, DC, DD1 (rear/left for this viewpoint)
    solid = [
        (A, B), (B, C), (A, A1), (B, B1), (C, C1),
        (A1, B1), (B1, C1), (C1, D1), (D1, A1),
        (B, D1),  # emphasized segment
    ]
    # Also show CD and DA as dashed (hidden bottom rear), DD1 dashed
    dashed = [(A, D), (D, C), (D, D1)]

    svg = SvgDoc(W, H, [])
    # plane A1 C1 D first (under lines)
    svg.poly([A1, C1, D], fill="rgba(70,140,210,0.28)", stroke="#2864aa", sw=2)
    for a, b in dashed:
        svg.line(*a, *b, stroke="#888890", sw=2, dash="7 6")
    for a, b in solid:
        if (a, b) == (B, D1) or (b, a) == (B, D1):
            continue
        svg.line(*a, *b, stroke="#1c1c20", sw=2.4)
    svg.line(*B, *D1, stroke="#1c4a9e", sw=3.2)
    for p, name, dx, dy in [
        (A, "A", -18, 8), (B, "B", 8, 8), (C, "C", 8, 8), (D, "D", -20, 4),
        (A1, "A₁", -22, -8), (B1, "B₁", 8, -10), (C1, "C₁", 8, -8), (D1, "D₁", -22, -10),
    ]:
        svg.text(p[0] + dx, p[1] + dy, name, size=18)
    svg.text(70, 48, "正方体 ABCD-A₁B₁C₁D₁（示意）", size=22)
    svg.text(70, 78, "标出 BD₁ 与平面 A₁C₁D；虚线为遮挡边", size=15, fill="#5a5a62")
    svg.text(70, 680, "CAND-G1B-093 · 教学示意图 · 不含证明结论标注", size=14, fill="#5a5a62")
    svg_path = OUT / "CAND-G1B-093.svg"
    svg.write(svg_path, "CAND-G1B-093 cube diagram")

    im, dr = png_canvas()
    dr.polygon([A1, C1, D], fill=PLANE, outline=(40, 100, 170, 220))
    for a, b in dashed:
        draw_line(dr, a, b, fill=DASH, width=2, dash=True)
    for a, b in solid:
        if {a, b} == {B, D1}:
            continue
        draw_line(dr, a, b, fill=INK, width=3)
    draw_line(dr, B, D1, fill=ACCENT, width=4)
    for p, name, dx, dy in [
        (A, "A", -18, 4), (B, "B", 8, 4), (C, "C", 8, 4), (D, "D", -20, 0),
        (A1, "A1", -24, -18), (B1, "B1", 8, -20), (C1, "C1", 8, -18), (D1, "D1", -24, -20),
    ]:
        label(dr, p, name, FONT_M, dx=dx, dy=dy)
    label(dr, (70, 36), "正方体 ABCD-A1B1C1D1（示意）", FONT_L)
    label(dr, (70, 66), "标出 BD1 与平面 A1C1D；虚线为遮挡边", FONT_S, fill=MUTED)
    label(dr, (70, 680), "CAND-G1B-093 · 教学示意图 · 不含证明结论标注", FONT_S, fill=MUTED)
    png_path = OUT / "CAND-G1B-093.png"
    im.convert("RGB").save(png_path, "PNG", optimize=True)
    return {
        "code": "CAND-G1B-093",
        "elements": [
            "cube vertices A,B,C,D,A1,B1,C1,D1",
            "solid visible edges",
            "dashed hidden AD,DC,DD1",
            "segment BD1 emphasized",
            "shaded triangle plane A1C1D",
        ],
        "forbidden_absent": ["perp symbol", "dot product", "coordinates", "proof steps"],
        "svg": str(svg_path.name),
        "png": str(png_path.name),
    }


# ---------- 080 parallelogram ----------
def make_080():
    A = (180, 480)
    B = (620, 480)
    D = (300, 220)
    C = (B[0] + (D[0] - A[0]), B[1] + (D[1] - A[1]))
    M = ((A[0] + C[0]) / 2, (A[1] + C[1]) / 2)

    svg = SvgDoc(W, H, [])
    svg.poly([A, B, C, D], fill="rgba(240,246,255,0.9)", stroke="#1c1c20", sw=2.4)
    svg.line(*A, *C, stroke="#1c1c20", sw=2)
    svg.line(*B, *D, stroke="#1c1c20", sw=2)
    svg.arrow(*A, *B, stroke="#1c4a9e", sw=2.6)
    svg.arrow(*A, *D, stroke="#1c4a9e", sw=2.6)
    svg.circle(*M, r=3.5)
    svg.text(A[0] - 22, A[1] + 28, "A", size=18)
    svg.text(B[0] + 10, B[1] + 28, "B", size=18)
    svg.text(C[0] + 10, C[1] - 8, "C", size=18)
    svg.text(D[0] - 24, D[1] - 8, "D", size=18)
    svg.text(M[0] + 8, M[1] - 8, "M", size=17)
    # vector labels mid AB / AD
    svg.text((A[0] + B[0]) / 2 - 10, (A[1] + B[1]) / 2 + 32, "a⃗", size=18, fill="#1c4a9e")
    svg.text((A[0] + D[0]) / 2 - 36, (A[1] + D[1]) / 2, "b⃗", size=18, fill="#1c4a9e")
    svg.text(70, 48, "平行四边形 ABCD（已知条件示意）", size=22)
    svg.text(70, 78, "AB = a，AD = b；对角线 AC、BD 交于 M", size=15, fill="#5a5a62")
    svg.text(70, 680, "CAND-G1B-080 · 不标注「互相平分」结论", size=14, fill="#5a5a62")
    svg_path = OUT / "CAND-G1B-080.svg"
    svg.write(svg_path, "CAND-G1B-080 parallelogram")

    im, dr = png_canvas()
    dr.polygon([A, B, C, D], fill=(240, 246, 255, 230), outline=INK)
    draw_line(dr, A, C, width=2)
    draw_line(dr, B, D, width=2)
    draw_arrow(dr, A, B, fill=ACCENT, width=3)
    draw_arrow(dr, A, D, fill=ACCENT, width=3)
    r = 4
    dr.ellipse([M[0] - r, M[1] - r, M[0] + r, M[1] + r], fill=INK)
    label(dr, A, "A", dx=-20, dy=10)
    label(dr, B, "B", dx=10, dy=10)
    label(dr, C, "C", dx=10, dy=-20)
    label(dr, D, "D", dx=-22, dy=-20)
    label(dr, M, "M", dx=8, dy=-18)
    label(dr, ((A[0] + B[0]) / 2, (A[1] + B[1]) / 2), "a", FONT_M, fill=ACCENT, dx=-4, dy=12)
    label(dr, ((A[0] + D[0]) / 2, (A[1] + D[1]) / 2), "b", FONT_M, fill=ACCENT, dx=-28, dy=-8)
    label(dr, (70, 36), "平行四边形 ABCD（已知条件示意）", FONT_L)
    label(dr, (70, 66), "AB=a, AD=b; diagonals AC, BD meet at M", FONT_S, fill=MUTED)
    label(dr, (70, 680), "CAND-G1B-080 · 不标注互相平分结论", FONT_S, fill=MUTED)
    png_path = OUT / "CAND-G1B-080.png"
    im.convert("RGB").save(png_path, "PNG", optimize=True)
    return {
        "code": "CAND-G1B-080",
        "elements": [
            "parallelogram ABCD",
            "diagonals AC, BD",
            "intersection M",
            "arrows AB=a, AD=b",
        ],
        "forbidden_absent": ["互相平分 text", "vector equality derivation"],
        "svg": svg_path.name,
        "png": png_path.name,
    }


# ---------- 064 tower ----------
def make_064():
    # O observer, B tower base, T top; OB=40m horizontal, angle at O = 30°, height h
    O = (160, 560)
    B = (700, 560)
    # height length for drawing: 40*tan(30)=40/sqrt(3) ≈ 23.1 units in model scale
    # visual: use scale so tower looks reasonable
    scale = (B[0] - O[0]) / 40.0
    h_draw = (40 / math.sqrt(3)) * scale
    T = (B[0], B[1] - h_draw)

    svg = SvgDoc(W, H, [])
    # ground
    svg.line(80, O[1], 920, O[1], stroke="#1c1c20", sw=2)
    # tower
    svg.line(*B, *T, stroke="#1c1c20", sw=3.2)
    # sight line
    svg.line(*O, *T, stroke="#1c4a9e", sw=2.4)
    # right angle at B (horizontal & vertical) — measurement geometry, not answer
    ra = 18
    svg.line(B[0] - ra, B[1], B[0] - ra, B[1] - ra, stroke="#1c1c20", sw=1.6)
    svg.line(B[0] - ra, B[1] - ra, B[0], B[1] - ra, stroke="#1c1c20", sw=1.6)
    # angle arc at O
    r = 70
    for i in range(0, 31):
        ang = -math.radians(i)
        x = O[0] + r * math.cos(ang)
        y = O[1] + r * math.sin(ang)
        if i == 0:
            prev = (x, y)
        else:
            svg.line(*prev, x, y, stroke="#1c4a9e", sw=1.8)
            prev = (x, y)
    svg.circle(*O, r=3.5)
    svg.circle(*B, r=3.5)
    svg.circle(*T, r=3.5)
    svg.text(O[0] - 8, O[1] + 28, "O", size=18)
    svg.text(B[0] + 10, B[1] + 28, "B", size=18)
    svg.text(T[0] + 12, T[1] + 6, "T", size=18)
    svg.text((O[0] + B[0]) / 2 - 30, O[1] + 36, "40 m", size=18)
    svg.text(O[0] + 78, O[1] - 28, "30°", size=18, fill="#1c4a9e")
    svg.text(B[0] + 18, (B[1] + T[1]) / 2, "h", size=20)
    svg.text(70, 48, "塔高测量示意图", size=22)
    svg.text(70, 78, "观测点 O；塔底 B；塔顶 T；水平距离 OB=40m；仰角 ∠TOB=30°", size=15, fill="#5a5a62")
    svg.text(70, 680, "CAND-G1B-064 · 不标注计算结果", size=14, fill="#5a5a62")
    svg_path = OUT / "CAND-G1B-064.svg"
    svg.write(svg_path, "CAND-G1B-064 tower height")

    im, dr = png_canvas()
    draw_line(dr, (80, O[1]), (920, O[1]), width=2)
    draw_line(dr, B, T, width=4)
    draw_line(dr, O, T, fill=ACCENT, width=3)
    ra = 18
    draw_line(dr, (B[0] - ra, B[1]), (B[0] - ra, B[1] - ra), width=2)
    draw_line(dr, (B[0] - ra, B[1] - ra), (B[0], B[1] - ra), width=2)
    pts = []
    for i in range(0, 31):
        ang = -math.radians(i)
        pts.append((O[0] + 70 * math.cos(ang), O[1] + 70 * math.sin(ang)))
    for i in range(len(pts) - 1):
        draw_line(dr, pts[i], pts[i + 1], fill=ACCENT, width=2)
    for p in (O, B, T):
        dr.ellipse([p[0] - 3, p[1] - 3, p[0] + 3, p[1] + 3], fill=INK)
    label(dr, O, "O", dx=-8, dy=10)
    label(dr, B, "B", dx=10, dy=10)
    label(dr, T, "T", dx=12, dy=-8)
    label(dr, ((O[0] + B[0]) / 2, O[1]), "40 m", dx=-20, dy=12)
    label(dr, (O[0] + 78, O[1] - 36), "30°", fill=ACCENT)
    label(dr, (B[0] + 16, (B[1] + T[1]) / 2), "h")
    label(dr, (70, 36), "塔高测量示意图", FONT_L)
    label(dr, (70, 66), "O 观测点；B 塔底；T 塔顶；OB=40m；仰角 30°", FONT_S, fill=MUTED)
    label(dr, (70, 680), "CAND-G1B-064 · 不标注计算结果", FONT_S, fill=MUTED)
    png_path = OUT / "CAND-G1B-064.png"
    im.convert("RGB").save(png_path, "PNG", optimize=True)
    return {
        "code": "CAND-G1B-064",
        "elements": [
            "horizontal ground",
            "vertical tower BT",
            "observer O",
            "sight OT",
            "right angle at B",
            "labels 40m, 30°, h",
        ],
        "forbidden_absent": ["40√3/3", "tan evaluation result"],
        "svg": svg_path.name,
        "png": png_path.name,
        "note_stem": "题干写「顶角30°」；解析明确为仰角；图按仰角绘制并标注仰角",
    }


# ---------- 091 oblique axonometry ----------
def make_091():
    """Two frames: original vs oblique axes. Keep arcs; no degree numerals / option hints."""
    svg = SvgDoc(W, H, [])
    # Left: original xOy (right angle visually; no "90°" text)
    O = (220, 480)
    X = (420, 480)
    Y = (220, 220)
    svg.text(120, 80, "原平面直角坐标系", size=20)
    svg.arrow(*O, *X)
    svg.arrow(*O, *Y)
    svg.text(X[0] + 8, X[1] + 6, "x", size=18)
    svg.text(Y[0] - 8, Y[1] - 8, "y", size=18)
    svg.text(O[0] - 18, O[1] + 24, "O", size=18)
    r = 56
    for i in range(0, 91, 3):
        ang = -math.radians(i)
        x = O[0] + r * math.cos(ang)
        y = O[1] + r * math.sin(ang)
        if i == 0:
            prev = (x, y)
        else:
            svg.line(*prev, x, y, stroke="#1c4a9e", sw=1.8)
            prev = (x, y)

    # Right: oblique x'O'y' (acute/obtuse-looking; no "45°"/"135°" text)
    Op = (620, 480)
    Xp = (860, 480)
    L = 240
    Yp = (Op[0] + L * math.cos(math.radians(45)), Op[1] - L * math.sin(math.radians(45)))
    svg.text(560, 80, "斜二测直观图坐标系", size=20)
    svg.arrow(*Op, *Xp)
    svg.arrow(*Op, *Yp)
    svg.text(Xp[0] + 8, Xp[1] + 6, "x′", size=18)
    svg.text(Yp[0] + 8, Yp[1] - 4, "y′", size=18)
    svg.text(Op[0] - 22, Op[1] + 24, "O′", size=18)
    r2 = 64
    for i in range(0, 46, 2):
        ang = -math.radians(i)
        x = Op[0] + r2 * math.cos(ang)
        y = Op[1] + r2 * math.sin(ang)
        if i == 0:
            prev = (x, y)
        else:
            svg.line(*prev, x, y, stroke="#1c4a9e", sw=1.8)
            prev = (x, y)
    svg.text(70, 48, "斜二测：两套坐标系对照（示意）", size=22)
    svg.text(
        70,
        680,
        "CAND-G1B-091 · 教学示意 · 不标注角度数值、不圈选选项",
        size=14,
        fill="#5a5a62",
    )
    svg_path = OUT / "CAND-G1B-091.svg"
    svg.write(svg_path, "CAND-G1B-091 oblique axonometry")

    im, dr = png_canvas()
    label(dr, (70, 36), "斜二测：两套坐标系对照（示意）", FONT_L)
    label(dr, (120, 70), "原平面直角坐标系", FONT_M)
    draw_arrow(dr, O, X)
    draw_arrow(dr, O, Y)
    label(dr, X, "x", dx=8, dy=-4)
    label(dr, Y, "y", dx=-12, dy=-18)
    label(dr, O, "O", dx=-16, dy=8)
    pts = []
    for i in range(0, 91, 3):
        ang = -math.radians(i)
        pts.append((O[0] + 56 * math.cos(ang), O[1] + 56 * math.sin(ang)))
    for i in range(len(pts) - 1):
        draw_line(dr, pts[i], pts[i + 1], fill=ACCENT, width=2)

    label(dr, (560, 70), "斜二测直观图坐标系", FONT_M)
    draw_arrow(dr, Op, Xp)
    draw_arrow(dr, Op, Yp)
    label(dr, Xp, "x'", dx=8, dy=-4)
    label(dr, Yp, "y'", dx=8, dy=-16)
    label(dr, Op, "O'", dx=-20, dy=8)
    pts = []
    for i in range(0, 46, 2):
        ang = -math.radians(i)
        pts.append((Op[0] + 64 * math.cos(ang), Op[1] + 64 * math.sin(ang)))
    for i in range(len(pts) - 1):
        draw_line(dr, pts[i], pts[i + 1], fill=ACCENT, width=2)
    label(
        dr,
        (70, 680),
        "CAND-G1B-091 · 教学示意 · 不标注角度数值、不圈选选项",
        FONT_S,
        fill=MUTED,
    )
    png_path = OUT / "CAND-G1B-091.png"
    im.convert("RGB").save(png_path, "PNG", optimize=True)
    return {
        "code": "CAND-G1B-091",
        "elements": [
            "left original xOy (arc, no degree numeral)",
            "right oblique x'O'y' (arc, no degree numeral)",
            "axis arrows and labels",
        ],
        "forbidden_absent": [
            "90° text",
            "45° text",
            "135° text",
            "circled option A",
        ],
        "svg": svg_path.name,
        "png": png_path.name,
    }


def main():
    metas = [make_093(), make_080(), make_064(), make_091()]
    files = []
    for m in metas:
        for key in ("svg", "png"):
            p = OUT / m[key]
            st = p.stat()
            entry = {
                "code": m["code"],
                "kind": key,
                "path": f"docs/high_school_math/diagrams/required_g1b/{m[key]}",
                "bytes": st.st_size,
                "sha256": sha256_file(p),
                "pixel_size": None,
                "viewBox": None,
            }
            if key == "png":
                with Image.open(p) as im2:
                    entry["pixel_size"] = list(im2.size)
            else:
                entry["viewBox"] = f"0 0 {W} {H}"
            files.append(entry)
    manifest = {
        "phase": "HS-MATH-BANK-DIAGRAM-1D",
        "wroteDb": False,
        "uploaded": False,
        "canvas_px": [W, H],
        "diagrams": metas,
        "files": files,
    }
    (OUT / "_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps({"ok": True, "count": len(metas), "files": len(files)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
