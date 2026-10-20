"""예시 작품 사진 검사 — 비었거나(물체가 너무 작음), 덜 그려졌거나(투명 구멍), 너무 어둡거나 하얗게 날아간 것을 찾는다.
python3 tools/check-shots.py <사진폴더>  → 문제 있는 작품 번호를 출력(다시 찍을 목록)"""
import sys, os, re, json
from PIL import Image, ImageStat
d = sys.argv[1]
# 본래 검은 재료(옻칠·먹·오석)가 바탕인 작품은 어두운 게 정상 — 기준을 낮춘다
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, '..', 'src', 'data', 'mockWorks.js'), encoding='utf-8').read()
BASE = {w['id']: (w.get('mat') or [None])[0] for w in json.loads(re.search(r'export const MOCK_WORKS = (\[.*?\]);\n', src, re.S).group(1))}
DARK = {'otchil', 'ink', 'inkstone', 'ipsa'}
bad = []
for f in sorted(os.listdir(d)):
    if not f.endswith('.png'): continue
    im = Image.open(os.path.join(d, f)).convert('RGBA')
    a = im.split()[3]
    bb = a.point(lambda v: 255 if v > 200 else 0).getbbox()
    if not bb: bad.append((f, '비어 있음')); continue
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    if w < im.width * 0.12 or h < im.height * 0.12: bad.append((f, '물체가 너무 작음')); continue
    obj = im.crop(bb); rgb = Image.new('RGB', obj.size, (255, 255, 255)); rgb.paste(obj, mask=obj.split()[3])
    mask = obj.split()[3].point(lambda v: 255 if v > 200 else 0)
    st = ImageStat.Stat(rgb.convert('L'), mask)
    if st.count[0] < 500: bad.append((f, '그려진 부분이 거의 없음')); continue
    mean = st.mean[0]
    if mean < (12 if BASE.get(f[:-4]) in DARK else 25): bad.append((f, '너무 어두움 %.0f' % mean))
    elif mean > 245: bad.append((f, '하얗게 날아감 %.0f' % mean))
for f, why in bad: print(f[:-4], why)
print('검사', len([x for x in os.listdir(d) if x.endswith('.png')]), '문제', len(bad), file=sys.stderr)
