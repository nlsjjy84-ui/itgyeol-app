"""찍은 예시 작품 사진(PNG, 투명 배경)을 앱용 webp(긴 변 480px, 물체가 가운데 오도록 여백 정리)로 바꿔 assets/mock/ 에 넣는다.
python3 tools/shots-to-mock.py <사진폴더>   · 검사(tools/check-shots.py)에서 문제가 없는 것만 넣는다.
재료 견본(m_<재료>.png)은 assets/materials/<재료>.webp 로 들어간다."""
import os, sys, subprocess
from PIL import Image
src = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
dst = os.path.join(here, '..', 'assets', 'mock')
dstm = os.path.join(here, '..', 'assets', 'materials'); os.makedirs(dstm, exist_ok=True)
bad = set(l.split()[0] for l in subprocess.run([sys.executable, os.path.join(here, 'check-shots.py'), src], capture_output=True, text=True).stdout.splitlines() if l.strip())
n = 0
for f in sorted(os.listdir(src)):
    if not f.endswith('.png') or f[:-4] in bad: continue
    im = Image.open(os.path.join(src, f)).convert('RGBA')
    bb = im.getbbox()
    if not bb: continue
    im = im.crop(bb)
    side = int(max(im.size) * 1.08)  # 물체 둘레에 4% 여백
    sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    sq.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    sq = sq.resize((480, 480), Image.LANCZOS)
    out = os.path.join(dstm, f[2:-4] + '.webp') if f.startswith('m_') else os.path.join(dst, f[:-4] + '.webp')
    sq.save(out, 'WEBP', quality=86, method=4)
    n += 1
# 재료 견본 목록(앱이 읽는 파일)을 assets/materials 에 있는 그림대로 다시 쓴다
ms = sorted(f[:-5] for f in os.listdir(dstm) if f.endswith('.webp'))
with open(os.path.join(here, '..', 'src', 'data', 'materialShots.js'), 'w', encoding='utf-8') as fp:
    fp.write("// 자동 생성 파일(tools/shots-to-mock.py) — 손으로 고치지 말 것.\n// 재료 견본: 같은 '나만의 노리개 패'를 재료마다 실제 재질로 찍은 그림.\nexport const MATERIAL_SHOTS = {\n")
    for m in ms: fp.write(f"  {m}: require('../../assets/materials/{m}.webp'),\n")
    fp.write('};\n')
print('넣음', n, '· 다시 찍을 것', len(bad), ' '.join(sorted(bad)))
