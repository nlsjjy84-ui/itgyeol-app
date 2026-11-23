#!/usr/bin/env python3
"""챗GPT로 받은 흰 배경 그림에서 배경을 지우고(가장자리와 이어진 흰색만) 여백을 잘라 투명 PNG로 저장한다.
쓰기: python3 tools/cutout.py 입력.png 출력.png [최대 긴 변 px]
- 인물 안쪽의 흰 옷·하이라이트는 가장자리와 이어지지 않으면 지우지 않는다(flood fill).
- 경계는 1~2px 부드럽게 해서 수묵 선이 톱니처럼 보이지 않게 한다.
"""
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter


def cutout(src, dst, max_side=900):
    im = Image.open(src).convert('RGB')
    a = np.asarray(im).astype(np.int16)
    h, w, _ = a.shape
    mx = a.max(axis=2)
    mn = a.min(axis=2)
    # 배경 후보: 밝고(>=232) 색이 거의 없는(채도 낮음) 칸 — 한지 같은 옅은 미색도 포함
    cand = (mn >= 222) & ((mx - mn) <= 26)
    bg = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if cand[y, x] and not bg[y, x]:
                bg[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if cand[y, x] and not bg[y, x]:
                bg[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and cand[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True
                q.append((ny, nx))
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    am = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.9))
    # 경계의 흰 테두리(헤일로)를 줄이려고, 반투명 칸은 색을 조금 어둡게 당긴다
    rgba = im.convert('RGBA')
    rgba.putalpha(am)
    bbox = am.point(lambda v: 255 if v > 8 else 0).getbbox()
    if bbox:
        pad = 6
        bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(w, bbox[2] + pad), min(h, bbox[3] + pad))
        rgba = rgba.crop(bbox)
    s = max_side / max(rgba.size)
    if s < 1:
        rgba = rgba.resize((round(rgba.width * s), round(rgba.height * s)), Image.LANCZOS)
    rgba.save(dst, optimize=True)
    return rgba.size


if __name__ == '__main__':
    print(cutout(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 900))
