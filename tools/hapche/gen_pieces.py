# pieces_meta.json → src/data/pieces.js (조각 목록 + 그림 require)
import json, sys
meta = json.load(open(sys.argv[1]))
lines = ["// 자동 생성 파일 — 잇결_합체/조각/도구/pack_meta.py 와 tools/gen_pieces.py 로 만든다. 직접 고치지 말 것.",
 "// 유물 조각: 국립중앙박물관·국립고궁박물관 소장품 사진(공공누리 제1유형, 출처 표시)에서 배경을 지우고 유물만 남겼다.",
 "// 지정문화유산(국보·보물)은 넣지 않았다. slots: 박물관 기록(분류·이름·재질·크기)과 사진 모양(비율·둥근 정도)으로 자동으로 정한 자리.",
 "export const RARITY = ['보통', '귀함', '아주 귀함'];",
 "const M = ["]
for o in meta:
    d = {k: o[k] for k in ['k','name','by','era','power','slots','ar','fill','rare','page']}
    if o.get('only'): d['only'] = o['only']
    if o.get('desc'): d['desc'] = o['desc']
    if o.get('no'): d['no'] = o['no']
    if o.get('size'): d['size'] = o['size']
    if o.get('en'): d['en'] = o['en']
    if o.get('from'): d['from'] = o['from']
    if o.get('abroad'): d['abroad'] = True
    cls = (o.get('cls') or '').split(' - ')
    d['use'] = cls[-1] if cls and cls[-1] else ''
    lines.append("  [%s, require('../../assets/pieces/%s.webp')]," % (json.dumps(d, ensure_ascii=False), o['k']))
lines += ["];",
 "export const PIECES = M.map(([m, img]) => ({ ...m, img }));",
 "export const PIECE_BY_K = Object.fromEntries(PIECES.map((p) => [p.k, p]));",
 "export const PIECE_COUNT = PIECES.length;", ""]
open(sys.argv[2], 'w').write('\n'.join(lines))
print(len(meta))
