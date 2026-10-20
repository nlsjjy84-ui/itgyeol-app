"""잇결 앱에 넣을 소재 목록 데이터와 사진을 만든다.
src/data/materialTree.js · src/data/catalog.js · src/data/catalogImages.js · assets/catalog/*.jpg"""
import json, os, re, base64, glob, shutil, collections
from paths import H, WORK, APP
from materials import MATERIAL_TREE
D = json.loads(open(os.path.join(WORK, 'page_data.js')).read()[len('window.DATA='):-1])
rows, shops = D['rows'], D['shops']
# rows: [name, src, era, coll, link, use, hasImg, mats, top, sub, leaf, desig, unesco, desc, matRaw, size]
SRC = ['wd', 'wiki', 'em']

# 사진 파일로 풀기 (아이디를 짧은 이름으로)
outImg = os.path.join(APP, 'assets', 'catalog')
if os.path.isdir(outImg): shutil.rmtree(outImg)
os.makedirs(outImg)
imgKey = {}
for k, uri in D['thumbs'].items():
    short = 'c%04d' % len(imgKey)
    open(os.path.join(outImg, short + '.jpg'), 'wb').write(base64.b64decode(uri.split(',', 1)[1]))
    imgKey[k] = short

def item(r):
    return [r[0], SRC[r[1]], r[2], r[3], r[4], r[5], imgKey.get(r[4], ''), r[11], r[12]]

def score(r):  # 사진 있음 > 바로 쓸 수 있음 > 박물관 소장품
    return (1 if r[4] in imgKey else 0, 1 if r[5] == 1 else 0, 1 if r[1] == 2 else 0)

mat_rows = collections.defaultdict(list)
for r in rows:
    for m in filter(None, r[7].split(',')): mat_rows[m].append(r)

SHOP_MAT = {}
for s in shops:
    for m in filter(None, s[6].split(',')): SHOP_MAT.setdefault(m, set()).add(s[1])

groups = []
for g in MATERIAL_TREE:
    items = []
    for l in g['items']:
        rs = sorted(mat_rows.get(l['id'], []), key=score, reverse=True)
        items.append({'id': l['id'], 'name': l['name'], 'note': l['note'], 'look': l['look'], 'count': len(rs),
                      'samples': [item(r) for r in rs[:40]], 'shopKinds': sorted(SHOP_MAT.get(l['id'], []))})
    groups.append({'id': g['id'], 'name': g['name'], 'items': items})

tree = collections.OrderedDict()
by_leaf = collections.defaultdict(list)
for r in rows: by_leaf[(r[8], r[9], r[10])].append(r)
BAD = re.compile(r'국적/시대|자율분류|등재됨|^:|두공부|^전적-|^미디어$')
from nice_names import MODERN, NICE, nice

for (t, s, l), rs in by_leaf.items():
    if BAD.search(t) or s in MODERN or l in MODERN: continue
    if len(t) > 16 or not re.search(r'[가-힣]', t) or len(s) > 30: continue  # 박물관 분류 칸이 비어 설명이 잘못 들어간 것
    s, l = nice(s), nice(l) if l != '-' else l
    rs = sorted(rs, key=score, reverse=True)
    tree.setdefault(t, collections.OrderedDict()).setdefault(s, []).append({'name': l, 'count': len(rs), 'items': [item(r) for r in rs[:24]]})
obj = []
for t, subs in sorted(tree.items(), key=lambda kv: kv[0]):
    ss = []
    for s, leaves in sorted(subs.items(), key=lambda kv: -sum(x['count'] for x in kv[1])):
        leaves.sort(key=lambda x: -x['count'])
        ss.append({'name': s, 'count': sum(x['count'] for x in leaves), 'leaves': leaves})
    obj.append({'name': t, 'count': sum(x['count'] for x in ss), 'subs': ss})

shop_out = [[s[0], s[1], s[3], s[4], s[5]] for s in shops]
stats = D['stats']
hdr = '// 자동 생성 파일(tools/catalog/gen_app_data.py) — 손으로 고치지 말 것.\n'
J = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
open(os.path.join(APP, 'src', 'data', 'materialTree.js'), 'w').write(
    hdr + '// 사용자가 놀이 전에 고르는 실제 전통 재료. look 값은 결과물 3D 재질에 그대로 쓴다.\n'
    '// samples: [이름, 출처(wd 문화유산·wiki 위키백과·em 박물관), 시대, 소장처, 링크키, 이용(1=바로 사용), 사진키, 지정, 유네스코]\n'
    f'export const MATERIAL_GROUPS = {J(groups)};\n'
    'export const MATERIAL_BY_ID = {};\nMATERIAL_GROUPS.forEach((g) => g.items.forEach((m) => { MATERIAL_BY_ID[m.id] = { ...m, group: g.name, groupId: g.id }; }));\n')
open(os.path.join(APP, 'src', 'data', 'catalog.js'), 'w').write(
    hdr + '// 물건 갈래(박물관 분류·문화유산 갈래)를 폴더처럼 따라 내려가는 목록과, 재료를 다루는 공방·국악사·한복집.\n'
    f'export const OBJECT_TREE = {J(obj)};\nexport const SHOPS = {J(shop_out)};\nexport const CATALOG_STATS = {J(stats)};\n'
    "export function itemLink(it) {\n  const [, src, , , key] = it;\n  if (src === 'wd') return 'https://www.wikidata.org/wiki/' + key;\n  if (src === 'wiki') return 'https://ko.wikipedia.org/wiki/' + encodeURIComponent(String(key).replace(/ /g, '_'));\n  return 'https://www.emuseum.go.kr/detail?relicId=' + key;\n}\n")
open(os.path.join(APP, 'src', 'data', 'catalogImages.js'), 'w').write(
    hdr + '// 소재 목록 사진 — 공공누리 제1유형·CC0·퍼블릭 도메인·CC BY만.\nexport const CATALOG_IMAGES = {\n' +
    ''.join(f"  {v}: require('../../assets/catalog/{v}.jpg'),\n" for v in imgKey.values()) + '};\n')
sz = lambda p: os.path.getsize(os.path.join(APP, p)) // 1024
print('images', len(imgKey), 'materialTree KB', sz('src/data/materialTree.js'), 'catalog KB', sz('src/data/catalog.js'),
      'assets KB', sum(os.path.getsize(p) for p in glob.glob(outImg + '/*.jpg')) // 1024)
