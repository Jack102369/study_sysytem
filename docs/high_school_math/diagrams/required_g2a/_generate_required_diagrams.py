#!/usr/bin/env python3
"""GLOBAL-2A REQUIRED offline SVG+PNG. No network. No DB writes."""
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


def png_canvas():
    return Image.new("RGBA", (W, H), (*BG, 255)), ImageDraw.Draw(
        Image.new("RGBA", (W, H), (*BG, 255)), "RGBA"
    )


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


def make_045():
    """Sector with geometric central angle exactly 2π/3 (120°)."""
    cx, cy, r = 500, 390, 230
    # Math angles (SVG y-down): from -π/6 to -π/6+2π/3 → span exactly 2π/3
    theta = 2 * math.pi / 3
    a0 = -math.pi / 6
    a1 = a0 + theta
    assert abs((a1 - a0) - theta) < 1e-12
    p0 = (cx + r * math.cos(a0), cy + r * math.sin(a0))
    p1 = (cx + r * math.cos(a1), cy + r * math.sin(a1))
    # pie-slice path points along arc
    steps = 64
    arc_pts = [
        (cx + r * math.cos(a0 + theta * i / steps), cy + r * math.sin(a0 + theta * i / steps))
        for i in range(steps + 1)
    ]
    pie = [(cx, cy), *arc_pts]

    svg = SvgDoc(W, H)
    svg.circle(cx, cy, r, fill="none", stroke="#1c1c20", sw=2.2)
    # filled sector (true pie, not chord triangle)
    ps = " ".join(f"{x:.2f},{y:.2f}" for x, y in pie)
    svg.parts.append(
        f'<polygon points="{ps}" fill="rgba(70,140,210,0.28)" stroke="#2864aa" stroke-width="2.2"/>'
    )
    svg.arc_path(cx, cy, r, a0, a1, stroke="#1c4a9e", sw=3.4)
    svg.line(cx, cy, *p0, stroke="#1c4a9e", sw=2.8)
    svg.line(cx, cy, *p1, stroke="#1c4a9e", sw=2.8)
    # small angle marker arc (radius 54)
    ra = 54
    svg.arc_path(cx, cy, ra, a0, a1, stroke="#1c4a9e", sw=2.0)
    mid = a0 + theta / 2
    svg.text(
        cx + (ra + 28) * math.cos(mid) - 18,
        cy + (ra + 28) * math.sin(mid) + 6,
        "2π/3",
        size=17,
        fill="#1c4a9e",
    )
    svg.circle(cx, cy, 3.5, fill="#1c1c20", stroke="#1c1c20")
    svg.text(cx - 8, cy + 26, "O", size=18)
    svg.text((cx + p0[0]) / 2 + 12, (cy + p0[1]) / 2 - 4, "6", size=18, fill="#1c4a9e")
    svg.text(70, 48, "圆 O，扇形圆心角 2π/3（几何角精确）", size=22)
    svg.text(70, 78, "标半径 6 与圆心角 2π/3；不标注弧长/面积数值", size=15, fill="#5a5a62")
    svg.text(70, 680, "CAND-G2A-045 · 教学示意图 · GLOBAL-2C 重绘", size=14, fill="#5a5a62")

    im, dr = canvas()
    dr.ellipse([cx - r, cy - r, cx + r, cy + r], outline=INK, width=3)
    dr.polygon(pie, fill=PLANE, outline=(40, 100, 170))
    for i in range(len(arc_pts) - 1):
        draw_line(dr, arc_pts[i], arc_pts[i + 1], fill=ACCENT, width=4)
    draw_line(dr, (cx, cy), p0, fill=ACCENT, width=3)
    draw_line(dr, (cx, cy), p1, fill=ACCENT, width=3)
    # angle marker
    for i in range(24):
        t0 = a0 + theta * i / 24
        t1 = a0 + theta * (i + 1) / 24
        draw_line(
            dr,
            (cx + ra * math.cos(t0), cy + ra * math.sin(t0)),
            (cx + ra * math.cos(t1), cy + ra * math.sin(t1)),
            fill=ACCENT,
            width=2,
        )
    label(
        dr,
        (cx + (ra + 28) * math.cos(mid), cy + (ra + 28) * math.sin(mid)),
        "2π/3",
        FONT_M,
        fill=ACCENT,
        dx=-16,
        dy=-4,
    )
    rr = 4
    dr.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=INK)
    label(dr, (cx, cy), "O", dx=-8, dy=12)
    label(dr, ((cx + p0[0]) / 2, (cy + p0[1]) / 2), "6", FONT_M, fill=ACCENT, dx=10, dy=-8)
    label(dr, (70, 36), "圆 O，扇形圆心角 2π/3（几何角精确）", FONT_L)
    label(dr, (70, 66), "标半径 6 与圆心角 2π/3；不标注弧长/面积数值", FONT_S, fill=MUTED)
    label(dr, (70, 680), "CAND-G2A-045 · 教学示意图 · GLOBAL-2C 重绘", FONT_S, fill=MUTED)
    return save_pair("CAND-G2A-045", svg, im, "CAND-G2A-045 sector")


def make_055():
    # side view: building BT, far F, near N, angles 45 and 60
    ground_y = 560
    B = (720, ground_y)
    T = (720, 180)
    N = (520, ground_y)  # nearer, 60°
    F = (320, ground_y)  # farther, 45°
    svg = SvgDoc(W, H)
    svg.line(80, ground_y, 900, ground_y, stroke="#1c1c20", sw=2.4)
    svg.line(*B, *T, stroke="#1c1c20", sw=4)
    svg.line(*F, *T, stroke="#1c4a9e", sw=2.4)
    svg.line(*N, *T, stroke="#1c4a9e", sw=2.4)
    # angle arcs (visual only)
    svg.arc_path(F[0], F[1], 55, -math.pi / 2, -math.pi / 4, stroke="#1c4a9e", sw=2)
    svg.arc_path(N[0], N[1], 55, -math.pi / 2, -math.pi / 3, stroke="#1c4a9e", sw=2)
    svg.text(F[0] - 10, F[1] + 28, "F", size=18)
    svg.text(N[0] - 10, N[1] + 28, "N", size=18)
    svg.text(B[0] + 12, B[1] + 8, "B", size=18)
    svg.text(T[0] + 12, T[1] + 8, "T", size=18)
    svg.text((F[0] + N[0]) / 2 - 10, ground_y + 40, "20 m", size=17)
    svg.line(F[0], ground_y + 18, N[0], ground_y + 18, stroke="#5a5a62", sw=1.6)
    svg.text(F[0] + 40, F[1] - 70, "45°", size=16, fill="#1c4a9e")
    svg.text(N[0] + 30, N[1] - 90, "60°", size=16, fill="#1c4a9e")
    svg.text(70, 48, "双测点仰角测高（侧面示意）", size=22)
    svg.text(70, 78, "F 仰角 45°，走近至 N 仰角 60°，FN=20 m；不标注 h 结果", size=15, fill="#5a5a62")
    svg.text(70, 680, "CAND-G2A-055 · 教学示意图", size=14, fill="#5a5a62")

    im, dr = canvas()
    draw_line(dr, (80, ground_y), (900, ground_y), width=3)
    draw_line(dr, B, T, width=5)
    draw_line(dr, F, T, fill=ACCENT, width=3)
    draw_line(dr, N, T, fill=ACCENT, width=3)
    draw_line(dr, (F[0], ground_y + 18), (N[0], ground_y + 18), fill=MUTED, width=2)
    label(dr, F, "F", dx=-8, dy=12)
    label(dr, N, "N", dx=-8, dy=12)
    label(dr, B, "B", dx=12, dy=0)
    label(dr, T, "T", dx=12, dy=0)
    label(dr, ((F[0] + N[0]) / 2, ground_y + 28), "20 m", FONT_M)
    label(dr, (F[0] + 36, F[1] - 80), "45°", FONT_S, fill=ACCENT)
    label(dr, (N[0] + 24, N[1] - 100), "60°", FONT_S, fill=ACCENT)
    label(dr, (70, 36), "双测点仰角测高（侧面示意）", FONT_L)
    label(dr, (70, 66), "F 仰角 45°，走近至 N 仰角 60°，FN=20 m；不标注 h 结果", FONT_S, fill=MUTED)
    label(dr, (70, 680), "CAND-G2A-055 · 教学示意图", FONT_S, fill=MUTED)
    return save_pair("CAND-G2A-055", svg, im, "CAND-G2A-055 elevation")


def make_081():
    # triangular pyramid
    A, B, C = (280, 560), (720, 560), (500, 430)
    O = (500, 510)
    P = (500, 160)
    svg = SvgDoc(W, H)
    svg.poly([A, B, C], fill="rgba(240,246,255,0.95)", stroke="#1c1c20", sw=2.4)
    for a, b in [(P, A), (P, B), (P, C)]:
        svg.line(*a, *b, stroke="#1c1c20", sw=2.4)
    svg.line(*P, *O, stroke="#1c4a9e", sw=3.0, dash="6 5")
    svg.circle(*O, 3.2, fill="#1c4a9e", stroke="#1c4a9e")
    for p, n, dx, dy in [
        (A, "A", -18, 18),
        (B, "B", 8, 18),
        (C, "C", 8, -8),
        (O, "O", 10, 6),
        (P, "P", 8, -6),
    ]:
        svg.text(p[0] + dx, p[1] + dy, n, size=18)
    svg.text(70, 48, "正三棱锥 P-ABC（示意）", size=22)
    svg.text(70, 78, "底正三角形边长 6；高 PO=4；不标注面积/体积", size=15, fill="#5a5a62")
    svg.text(70, 680, "CAND-G2A-081 · 教学示意图", size=14, fill="#5a5a62")

    im, dr = canvas()
    dr.polygon([A, B, C], fill=(240, 246, 255, 230), outline=INK)
    for a, b in [(P, A), (P, B), (P, C)]:
        draw_line(dr, a, b, width=3)
    draw_line(dr, P, O, fill=ACCENT, width=3, dash=True)
    rr = 4
    dr.ellipse([O[0] - rr, O[1] - rr, O[0] + rr, O[1] + rr], fill=ACCENT)
    for p, n, dx, dy in [
        (A, "A", -18, 10),
        (B, "B", 8, 10),
        (C, "C", 8, -18),
        (O, "O", 10, 0),
        (P, "P", 8, -18),
    ]:
        label(dr, p, n, dx=dx, dy=dy)
    label(dr, (70, 36), "正三棱锥 P-ABC（示意）", FONT_L)
    label(dr, (70, 66), "底正三角形边长 6；高 PO=4；不标注面积/体积", FONT_S, fill=MUTED)
    label(dr, (70, 680), "CAND-G2A-081 · 教学示意图", FONT_S, fill=MUTED)
    return save_pair("CAND-G2A-081", svg, im, "CAND-G2A-081 pyramid")


def make_084():
    pts = cube_pts()
    A, B, C, D, A1, B1, C1, D1 = pts
    svg = SvgDoc(W, H)
    im, dr = canvas()
    draw_cube(svg, dr, pts, emphasize=[(A, C), (A1, B)])
    svg.text(70, 48, "正方体 ABCD-A1B1C1D1（示意）", size=22)
    svg.text(70, 78, "淡标 AC、A1B；不标注平行/异面结论", size=15, fill="#5a5a62")
    svg.text(70, 680, "CAND-G2A-084 · 教学示意图", size=14, fill="#5a5a62")
    label(dr, (70, 36), "正方体 ABCD-A1B1C1D1（示意）", FONT_L)
    label(dr, (70, 66), "淡标 AC、A1B；不标注平行/异面结论", FONT_S, fill=MUTED)
    label(dr, (70, 680), "CAND-G2A-084 · 教学示意图", FONT_S, fill=MUTED)
    return save_pair("CAND-G2A-084", svg, im, "CAND-G2A-084 cube")


def make_086():
    # elongated box
    ox, oy, s, kx, ky = 280, 540, 180, 0.7, -0.28

    def P(x, y, z):
        return (ox + s * (x + kx * y), oy - s * (z - ky * y))

    A, B, C, D = P(0, 0, 0), P(1.4, 0, 0), P(1.4, 1, 0), P(0, 1, 0)
    A1, B1, C1, D1 = P(0, 0, 1), P(1.4, 0, 1), P(1.4, 1, 1), P(0, 1, 1)
    E = ((A[0] + A1[0]) / 2, (A[1] + A1[1]) / 2)
    F = ((C[0] + C1[0]) / 2, (C[1] + C1[1]) / 2)
    svg = SvgDoc(W, H)
    im, dr = canvas()
    svg.poly([A, B, C, D], fill="rgba(70,140,210,0.18)", stroke="#2864aa", sw=2)
    dr.polygon([A, B, C, D], fill=PLANE, outline=(40, 100, 170))
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
    for a, b in dashed:
        svg.line(*a, *b, stroke="#888890", sw=2, dash="7 6")
        draw_line(dr, a, b, fill=DASH, width=2, dash=True)
    for a, b in solid:
        svg.line(*a, *b, stroke="#1c1c20", sw=2.4)
        draw_line(dr, a, b, width=3)
    svg.line(*E, *F, stroke="#1c4a9e", sw=3.2)
    draw_line(dr, E, F, fill=ACCENT, width=4)
    for p, n, dx, dy in [
        (A, "A", -18, 8),
        (B, "B", 8, 8),
        (C, "C", 8, 8),
        (D, "D", -20, 4),
        (A1, "A1", -22, -8),
        (B1, "B1", 8, -10),
        (C1, "C1", 8, -8),
        (D1, "D1", -22, -10),
        (E, "E", -20, 0),
        (F, "F", 10, 0),
    ]:
        svg.text(p[0] + dx, p[1] + dy, n, size=16)
        label(dr, p, n, FONT_M, dx=dx, dy=dy)
    svg.text(70, 48, "长方体 ABCD-A1B1C1D1（示意）", size=22)
    svg.text(70, 78, "E、F 为 AA1、CC1 中点；底面阴影；不标注平行结论", size=15, fill="#5a5a62")
    svg.text(70, 680, "CAND-G2A-086 · 教学示意图", size=14, fill="#5a5a62")
    label(dr, (70, 36), "长方体 ABCD-A1B1C1D1（示意）", FONT_L)
    label(dr, (70, 66), "E、F 为 AA1、CC1 中点；底面阴影；不标注平行结论", FONT_S, fill=MUTED)
    label(dr, (70, 680), "CAND-G2A-086 · 教学示意图", FONT_S, fill=MUTED)
    return save_pair("CAND-G2A-086", svg, im, "CAND-G2A-086 box")


def make_088():
    # right triangular prism ABC-A1B1C1, right angle at B
    ox, oy, s, kx, ky = 340, 540, 200, 0.5, -0.3

    def P(x, y, z):
        return (ox + s * (x + kx * y), oy - s * (z - ky * y))

    A, B, C = P(0, 0, 0), P(1, 0, 0), P(1, 1, 0)
    A1, B1, C1 = P(0, 0, 1), P(1, 0, 1), P(1, 1, 1)
    svg = SvgDoc(W, H)
    im, dr = canvas()
    svg.poly([A1, B, C], fill="rgba(70,140,210,0.28)", stroke="#2864aa", sw=2)
    dr.polygon([A1, B, C], fill=PLANE, outline=(40, 100, 170))
    edges = [
        (A, B),
        (B, C),
        (C, A),
        (A1, B1),
        (B1, C1),
        (C1, A1),
        (A, A1),
        (B, B1),
        (C, C1),
    ]
    for a, b in edges:
        svg.line(*a, *b, stroke="#1c1c20", sw=2.4)
        draw_line(dr, a, b, width=3)
    svg.line(*A, *B1, stroke="#1c4a9e", sw=3.2)
    draw_line(dr, A, B1, fill=ACCENT, width=4)
    for p, n, dx, dy in [
        (A, "A", -18, 8),
        (B, "B", 8, 8),
        (C, "C", 8, 8),
        (A1, "A1", -22, -8),
        (B1, "B1", 8, -10),
        (C1, "C1", 8, -8),
    ]:
        svg.text(p[0] + dx, p[1] + dy, n, size=17)
        label(dr, p, n, FONT_M, dx=dx, dy=dy)
    svg.text(70, 48, "直三棱柱 ABC-A1B1C1（示意）", size=22)
    svg.text(70, 78, "底面直角于 B；标 AB1 与平面 A1BC；无垂直记号", size=15, fill="#5a5a62")
    svg.text(70, 680, "CAND-G2A-088 · 教学示意图", size=14, fill="#5a5a62")
    label(dr, (70, 36), "直三棱柱 ABC-A1B1C1（示意）", FONT_L)
    label(dr, (70, 66), "底面直角于 B；标 AB1 与平面 A1BC；无垂直记号", FONT_S, fill=MUTED)
    label(dr, (70, 680), "CAND-G2A-088 · 教学示意图", FONT_S, fill=MUTED)
    return save_pair("CAND-G2A-088", svg, im, "CAND-G2A-088 prism")


def make_089():
    pts = cube_pts(ox=340, oy=530, s=210)
    A, B, C, D, A1, B1, C1, D1 = pts
    svg = SvgDoc(W, H)
    im, dr = canvas()
    draw_cube(svg, dr, pts, emphasize=[(A, C), (A1, C1), (B, D)])
    svg.text(70, 48, "正方体 ABCD-A1B1C1D1（示意）", size=22)
    svg.text(70, 78, "淡标 AC、A1C1、BD；不标注面面垂直", size=15, fill="#5a5a62")
    svg.text(70, 680, "CAND-G2A-089 · 教学示意图", size=14, fill="#5a5a62")
    label(dr, (70, 36), "正方体 ABCD-A1B1C1D1（示意）", FONT_L)
    label(dr, (70, 66), "淡标 AC、A1C1、BD；不标注面面垂直", FONT_S, fill=MUTED)
    label(dr, (70, 680), "CAND-G2A-089 · 教学示意图", FONT_S, fill=MUTED)
    return save_pair("CAND-G2A-089", svg, im, "CAND-G2A-089 cube planes")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {
        "stage": "HS-MATH-BANK-GLOBAL-2A",
        "generated": [],
    }
    for fn in (make_045, make_055, make_081, make_084, make_086, make_088, make_089):
        manifest["generated"].append(fn())
    (OUT / "_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    notes = """# REQUIRED_G2A 离线插图

> 阶段：HS-MATH-BANK-GLOBAL-2A  
> 生成：`_generate_required_diagrams.py`  
> **未上传**；**未写库**

| code | 要点 | 禁止泄露 |
|------|------|----------|
| 045 | 圆+扇形 2π/3，半径 6 | 弧长/面积数值 |
| 055 | 双测点仰角 45°/60°，间距 20m | h 最终式 |
| 081 | 正三棱锥 P-ABC，高 PO | 面积/体积 |
| 084 | 正方体 + AC、A1B | 平行/异面结论 |
| 086 | 长方体中点 E、F 与底面 | EF∥AC 标注 |
| 088 | 直三棱柱 + AB1 + 平面 A1BC | 垂直记号 |
| 089 | 正方体 + AC/A1C1/BD | 面面垂直标记 |

复核身份：绘图作者自检通过；独立数学复核 = MATH_REVIEW_PENDING。
"""
    (OUT / "NOTES.md").write_text(notes, encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
