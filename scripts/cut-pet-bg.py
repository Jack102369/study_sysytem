"""从四角洪水填充去底，避免误删衣服上的白/黑像素。"""
from __future__ import annotations

from collections import deque
from PIL import Image
import os

ROOT = os.path.join(os.path.dirname(__file__), '..', 'apps', 'web', 'public', 'pet')


def near_bg(r: int, g: int, b: int, mode: str) -> bool:
    if mode == 'white':
        return r >= 235 and g >= 235 and b >= 235
    # black
    return r <= 40 and g <= 40 and b <= 40


def flood_cut(src: str, dst: str, mode: str) -> None:
    im = Image.open(src).convert('RGBA')
    w, h = im.size
    px = im.load()
    seen = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    def try_push(x: int, y: int) -> None:
        if x < 0 or y < 0 or x >= w or y >= h or seen[y][x]:
            return
        r, g, b, _a = px[x, y]
        if not near_bg(r, g, b, mode):
            return
        seen[y][x] = True
        q.append((x, y))

    # seed from edges
    for x in range(w):
        try_push(x, 0)
        try_push(x, h - 1)
    for y in range(h):
        try_push(0, y)
        try_push(w - 1, y)

    while q:
        x, y = q.popleft()
        r, g, b, _a = px[x, y]
        # soft alpha for near-bg edge
        if mode == 'white':
            d = (255 * 3 - (r + g + b)) / 60.0
        else:
            d = (r + g + b) / 120.0
        if d < 1:
            px[x, y] = (r, g, b, 0)
        else:
            px[x, y] = (r, g, b, max(0, min(255, int(255 * (d - 1)))))
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            try_push(nx, ny)

    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    tw = 720
    ratio = tw / im.size[0]
    th = max(1, int(im.size[1] * ratio))
    im = im.resize((tw, th), Image.Resampling.LANCZOS)
    im.save(dst, 'PNG')
    print('saved', dst, im.size)


def main() -> None:
    flood_cut(os.path.join(ROOT, 'robin.png'), os.path.join(ROOT, 'robin.png'), 'white')
    flood_cut(os.path.join(ROOT, 'trex.png'), os.path.join(ROOT, 'trex.png'), 'black')


if __name__ == '__main__':
    main()
