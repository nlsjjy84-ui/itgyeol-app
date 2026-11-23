#!/usr/bin/env python3
# assets/sprites/game/*.png → src/components/minigames/gameArt.js (require + 원본 크기)
import glob, os
from PIL import Image
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = ["// 자동 생성 — tools/gen_game_art.py. 게임 그림(풍이·결이 수묵담채)과 원본 크기.", "export const ART = {"]
for f in sorted(glob.glob(os.path.join(root, 'assets/sprites/game/*.png'))):
    k = os.path.splitext(os.path.basename(f))[0]
    w, h = Image.open(f).size
    out.append(f"  {k}: {{ src: require('../../../assets/sprites/game/{os.path.basename(f)}'), w: {w}, h: {h} }},")
out.append("};")
open(os.path.join(root, 'src/components/minigames/gameArt.js'), 'w').write("\n".join(out) + "\n")
print(len(out) - 3, 'sprites')
