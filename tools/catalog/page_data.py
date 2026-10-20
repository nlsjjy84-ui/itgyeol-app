"""목록 페이지에 넣을 압축 데이터 만들기 → page_data.js"""
import json, re, os, base64, collections, glob
from paths import H, RAW, WORK
from materials import MATERIAL_TREE
from nice_names import MODERN, nice
cat = json.load(open(os.path.join(WORK, 'catalog.json')))
items, shops = cat['items'], cat['shops']

TRAD = re.compile(r'조선|고려|삼국|신라|백제|가야|고구려|통일신라|대한제국|발해|청동기|철기|원삼국|선사|구석기|신석기|시대미상|^$')
def era_short(e):
    m = re.search(r'(구석기|신석기|청동기|철기|원삼국|삼국|고구려|백제|신라|가야|통일신라|발해|고려|조선|대한제국|일제강점|근대|현대)', e or '')
    if m: return m.group(1)
    y = re.match(r'(\d{3,4})', e or '')
    if y:
        y = int(y.group(1))
        return '조선' if 1392 <= y < 1897 else '고려' if 918 <= y < 1392 else '대한제국' if 1897 <= y < 1910 else ('근현대' if y >= 1910 else '삼국 이전')
    return ''

leaves = [(g, l, re.compile(l['rx'], re.I)) for g in MATERIAL_TREE for l in g['items']]
def mat_ids(it):
    raw = it.get('matRaw', '') or ''
    out = [l['id'] for g, l, rx in leaves if raw and rx.search(raw)]
    if not out:  # 재질 칸이 없으면 이름에서 (예: 청자 상감 운학문 매병)
        name = it['name']
        out = [l['id'] for g, l, rx in leaves if l['id'] in ('celadon','porcelain','buncheong','onggi','najeon','otchil','hwagak','ipsa','jade','yugi','gold','silver','bronze','iron','hanji','silk','ramie','hemp','leather','bamboo','straw','paulownia','gilt','dancheong','inkstone','earthen','knot','horsehair','glass') and rx.search(name)]
    return out

# 박물관 분류 이름 다듬기
TOP = {'의': '의생활(옷·꾸밈)', '식': '식생활', '주': '주생활', '산업/생업': '산업·생업', '사회생활': '사회생활', '군사': '군사', '종교신앙': '종교·신앙', '전통과학': '전통 과학', '과학기술': '전통 과학', '교통/통신': '교통·통신', '보건의료': '보건·의료', '문화예술': '문화·예술', '미디어': '미디어', '기타자료': '기타'}
SRC = {'wd': 0, 'kowiki': 1, 'emuseum': 2}
USE = {'free': 1, 'by': 2, 'sa': 3, 'no': 4, '': 0}

thumbs = {}
for p in glob.glob(os.path.join(WORK, 'thumbs', '*.jpg')):
    thumbs[os.path.basename(p)[:-4]] = 'data:image/jpeg;base64,' + base64.b64encode(open(p, 'rb').read()).decode()
picks = []
pp = os.path.join(RAW, 'itgyeol_picks.json')
if os.path.exists(pp):
    for x in json.load(open(pp)):
        thumbs[x['id']] = x['img']

rows, objTree, matCount = [], collections.defaultdict(lambda: collections.defaultdict(lambda: collections.Counter())), collections.Counter()
for it in items:
    if '자연' in it['kind'] or re.search(r'천연기념물|명승', ' '.join(it.get('desig') or [])): continue
    era = era_short(it.get('era', ''))
    if era in ('근현대', '일제강점', '근대', '현대'): continue  # 전통 소재 목록이므로 근현대 물건은 뺀다
    mids = mat_ids(it)
    for m in mids: matCount[m] += 1
    if it['src'] == 'emuseum' and it.get('cls'):
        parts = [p.strip() for p in it['cls'].split(' - ') if p.strip()]
        top = TOP.get(parts[0], parts[0]) if parts else '기타'
        sub = parts[1] if len(parts) > 1 else '-'
        leaf = parts[2] if len(parts) > 2 else '-'
        if sub in MODERN or leaf in MODERN or top == '미디어': continue
        if len(top) > 16 or not re.search(r'[가-힣]', top): continue
        sub, leaf = nice(sub), (nice(leaf) if leaf != '-' else leaf)
    else:
        top = '문화유산 · ' + (it['kind'][0] if it['kind'] else '기타')
        sub = (it.get('desig') or ['-'])[0][:20] if it['src'] == 'wd' else ((it.get('grp') or ['-'])[0].split(' > ')[-1][:20])
        leaf = '-'
    objTree[top][sub][leaf] += 1
    link = it['id'] if it['src'] != 'kowiki' else it.get('wiki', '')
    rows.append([it['name'][:60], SRC[it['src']], era, (it.get('coll') or it.get('where') or '')[:24], link, USE.get(it.get('use', ''), 0),
                 1 if it['id'] in thumbs else 0, ','.join(mids), top, sub, leaf, (it.get('desig') or [''])[0][:24] if it['src'] != 'emuseum' else (it.get('desig') or [''])[0][:12],
                 it.get('unesco', ''), (it.get('desc') or '')[:56], (it.get('matRaw') or '')[:30], (it.get('size') or '')[:30]])

# 업체 → 재료
SHOP_MAT = {'국악기': ['leather', 'paulownia', 'bamboo', 'silk', 'yugi'], '유기': ['yugi'], '한복·무용복': ['silk', 'ramie', 'hemp', 'cotton', 'gilt'], '나전칠기': ['najeon', 'otchil'],
            '매듭·자수': ['knot', 'silk'], '한지': ['hanji'], '도자기': ['celadon', 'porcelain', 'buncheong', 'onggi'], '민화·단청': ['dancheong', 'ink', 'hanji'],
            '장신구': ['silver', 'jade', 'gem', 'gold'], '목공·소목': ['wood'], '갓·부채·탈': ['bamboo', 'wood', 'hanji'], '활·칼': ['iron', 'hwagak', 'bamboo'], '기타 전통공예': ['straw', 'bamboo', 'hwagak', 'ink', 'inkstone']}
srows = [[s['name'], s['kind'], s['cat'], s['addr'], s['phone'], s['home'], ','.join(SHOP_MAT.get(s['kind'], []))] for s in shops]

tree = {t: {s: dict(v) for s, v in subs.items()} for t, subs in objTree.items()}
data = {'mat': MATERIAL_TREE, 'matCount': matCount, 'rows': rows, 'shops': srows, 'tree': tree, 'thumbs': thumbs, 'unesco': cat['unesco'],
        'stats': {'wd': sum(1 for r in rows if r[1] == 0), 'kowiki': sum(1 for r in rows if r[1] == 1), 'em': sum(1 for r in rows if r[1] == 2), 'free': sum(1 for r in rows if r[5] == 1), 'shops': len(srows), 'thumbs': len(thumbs)}}
for g in data['mat']:
    for l in g['items']: l.pop('rx', None)
s = 'window.DATA=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';'
# 확인용 페이지(아티팩트)는 파일 하나가 16MB를 넘으면 안 되므로 나눠서도 쓴다
site = os.path.join(WORK, 'site'); os.makedirs(site, exist_ok=True)
J = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
meta = {k: v for k, v in data.items() if k not in ('rows', 'thumbs')}
open(os.path.join(site, 'data_meta.js'), 'w').write('window.DATA=' + J(meta) + ';window.DATA.rows=[];window.DATA.thumbs={};')
CH = 15000
for n, k in enumerate(range(0, len(rows), CH)):
    open(os.path.join(site, f'data_rows{n}.js'), 'w').write('window.DATA.rows.push(...' + J(rows[k:k + CH]) + ');')
tk = list(thumbs.items())
for n, k in enumerate(range(0, len(tk), 300)):
    open(os.path.join(site, f'data_thumbs{n}.js'), 'w').write('Object.assign(window.DATA.thumbs,' + J(dict(tk[k:k + 300])) + ');')
open(os.path.join(WORK, 'page_data.js'), 'w').write(s)
print(len(s) // 1024, 'KB', data['stats'], len(tree))
