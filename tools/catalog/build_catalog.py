"""잇결 소재 목록 만들기: 위키데이터·위키백과·e뮤지엄·카카오맵·유네스코 자료를 하나로 합친다."""
import json, re, os, sys, collections
from paths import H, RAW, WORK
U = RAW + '/'
def load(name, default):
    p = U + name
    return json.load(open(p)) if os.path.exists(p) else default

# 위키데이터: 대한민국 지정 문화유산만(같은 '세계유산' 지정을 가진 다른 나라 유산이 섞여 들어오므로 한국 지정 이름이 있는 것만 남긴다)
KRDES = re.compile(r'대한민국|특별시|광역시|도의|시의|군의|구의|특별자치|향토|서울미래유산|등록|조선|북한')
wd = [r for r in load('itgyeol_wikidata.json', []) if any(KRDES.search(x) for x in r.get('desig', []))]
kw = load('itgyeol_kowiki.json', [])
em_raw = load('itgyeol_emuseum.json', None) or {}
for r in (3, 2, 1, 0):
    if not em_raw:
        em_raw = load(f'itgyeol_emuseum_r{r}.json', {})
em = em_raw.get('items', em_raw if isinstance(em_raw, list) else [])
shops = load('itgyeol_shops2.json', []) or load('itgyeol_shops.json', [])
unesco = json.load(open(os.path.join(H, 'unesco.json')))

# ── 갈래(무엇인가) ──
KINDS = [
    ('악기', r'악기|장구|북|소고|꽹과리|징|가야금|거문고|해금|아쟁|대금|중금|소금|피리|태평소|단소|퉁소|생황|편종|편경|좌고|양금|비파|나발|나각|운라|박$|축$|어$|musical instrument|drum|zither|flute'),
    ('옷·쓰개·신', r'복식|의복|한복|포$|도포|단령|곤룡포|적의|원삼|활옷|철릭|저고리|치마|바지|두루마기|배자|마고자|장옷|쓰개|갓|망건|탕건|사모|익선관|정자관|전립|패랭이|삿갓|흉배|족두리|화관|댕기|버선|신$|짚신|미투리|나막신|태사혜|당혜|clothing|hat|costume'),
    ('장신구·화장', r'장신구|노리개|비녀|떨잠|뒤꽂이|첩지|가락지|반지|귀걸이|귀고리|팔찌|목걸이|단추|향낭|향갑|주머니|분첩|분합|분항아리|연지|곤지|기름병|빗|참빗|빗접|경대|거울|동경|화장|jewel|ornament|cosmetic'),
    ('생활용품', r'생활|소반|반닫이|함$|장$|농$|궤|등잔|촛대|화로|떡살|다식판|담뱃대|안경|표주박|장도|부채|청사초롱|가마|그릇|숟가락|수저|사발|대접|항아리|병$|furniture|utensil'),
    ('농사·생업', r'농기구|농경|생업|쟁기|써레|따비|가래|호미|낫|도리깨|쇠스랑|키$|멍석|맷돌|절구|방아|물레|베틀|씨아|지게|삼태기|소쿠리|두레박|용두레|홀태|풍구|보습|어구|agricultur'),
    ('무기·군사·배', r'무기|군사|활$|각궁|화살|편전|동개|환도|도검|칼|검$|창$|당파|월도|신기전|화차|총통|진천뢰|조총|화포|갑옷|갑$|투구|방패|군기|깃발|영기|수자기|교룡기|거북선|판옥선|전선|선박|배$|weapon|armou?r|ship|flag'),
    ('공예', r'공예|나전|칠기|화각|매듭|자수|보자기|조각보|한지|목공|소목|장석|입사|유기|방짜|금속공예|craft|lacquer'),
    ('도자기', r'도자|청자|백자|분청|옹기|토기|자기|ceramic|porcelain|celadon|pottery'),
    ('글·책·인쇄', r'서적|전적|고문서|책$|문서|활자|목판|판$|훈민정음|실록|의궤|지도|교지|호패|마패|어보|인장|벼루|먹$|붓$|연적|book|manuscript|document|seal|map'),
    ('그림·글씨', r'회화|그림|민화|병풍|책가도|십장생|모란도|문자도|서예|글씨|painting|calligraph'),
    ('불교·신앙', r'불교|불상|보살|탑$|석탑|부도|사리|범종|종$|향로|정병|경판|사찰|무속|굿|제례|religio|buddh|temple|pagoda|bell'),
    ('왕실·의례', r'왕실|왕릉|궁$|궁궐|어보|금관|관$|의례|의식|제례악|종묘|royal|crown'),
    ('과학·기술', r'과학|해시계|측우기|혼천의|앙부일구|자격루|천문|science|sundial'),
    ('건축·유적', r'건축|건물|가옥|고택|한옥|성$|성곽|산성|읍성|정자|누각|서원|향교|고분|유적|사지|사적|building|architecture|site|tomb|fortress'),
    ('놀이·춤·소리', r'놀이|춤|무$|탈춤|탈$|굿|소리|판소리|민요|농악|풍물|아리랑|가곡|줄타기|씨름|택견|강강술래|윷|투호|팽이|연$|제기|dance|music|game|song'),
    ('음식·기술(무형)', r'음식|김장|장 담그기|술|떡|기능|장$|장인|제작 기술|짜기|기술|craftsmanship|food'),
    ('자연', r'천연기념물|명승|나무|숲|동굴|섬$|폭포|natural|tree|forest|cave'),
]
KRE = [(k, re.compile(p, re.I)) for k, p in KINDS]
def kinds_of(*texts):
    t = ' '.join(x for x in texts if x)
    ks = [k for k, rx in KRE if rx.search(t)]
    return ks or ['기타']

# ── 전통 소재(무엇으로 만들었나) ──
MATS = [
    ('옻칠', r'옻|칠기|칠$|lacquer'), ('자개(나전)', r'나전|자개|螺鈿|mother.of.pearl'), ('놋쇠(유기)', r'유기|놋|방짜|brass'),
    ('금', r'금(?!속)|金|gold'), ('은', r'은(?!행)|銀|silver'), ('청동·구리', r'청동|동$|구리|bronze|copper'), ('철', r'철|쇠|iron'),
    ('옥', r'옥|jade'), ('청자', r'청자|celadon'), ('백자', r'백자|white porcelain'), ('분청사기', r'분청'), ('옹기·토기', r'옹기|토기|도기|흙|earthenware|stoneware'),
    ('한지·종이', r'한지|종이|지$|paper'), ('비단', r'비단|견$|사$|명주|silk'), ('무명', r'무명|면$|cotton'), ('모시', r'모시|ramie'), ('삼베', r'삼베|마$|hemp'),
    ('가죽', r'가죽|피$|피모|leather|hide'), ('나무', r'나무|목$|목재|오동|소나무|wood'), ('대나무', r'대나무|죽$|bamboo'), ('왕골·짚', r'왕골|짚|볏짚|straw'),
    ('돌', r'돌|석$|화강암|stone|granite'), ('쇠뿔(화각)', r'화각|쇠뿔|horn'), ('상아·뼈', r'상아|뼈|ivory|bone'), ('산호·호박·진주', r'산호|호박|진주|coral|amber|pearl'),
    ('먹·안료', r'먹|안료|채색|ink|pigment'), ('금박', r'금박'), ('유리', r'유리|glass'),
]
MRE = [(k, re.compile(p, re.I)) for k, p in MATS]
def mats_of(*texts):
    t = ' '.join(x for x in texts if x)
    return [k for k, rx in MRE if rx.search(t)]

def lic_ok(l):
    l = (l or '').lower()
    if not l: return ''
    if 'cc0' in l or 'public domain' in l or l.startswith('pd') or 'kogl type 1' in l or '공공누리 제1' in l or l == '1': return 'free'
    if 'by-sa' in l: return 'sa'
    if 'cc by' in l or l.startswith('cc-by'): return 'by'
    return 'no'

items = []
# 1) 위키데이터: 지정 문화유산 + 한국 물건
for r in wd:
    name = r.get('ko') or r.get('en')
    if not name: continue
    lic = lic_ok(r.get('imgLic'))
    items.append({
        'src': 'wd', 'id': r['id'], 'name': name, 'en': r.get('en', ''), 'desig': r.get('desig', []),
        'kind': kinds_of(' '.join(r.get('inst', [])), name, ' '.join(r.get('desig', [])), ' '.join(r.get('use', []))),
        'mat': mats_of(' '.join(r.get('mat', []))), 'matRaw': ' '.join(r.get('mat', [])), 'era': r.get('date', ''), 'where': (r.get('loc') or [''])[0], 'coll': (r.get('coll') or [''])[0],
        'img': r.get('thumb', '') if lic in ('free', 'by') else '', 'imgLic': r.get('imgLic', ''), 'imgBy': r.get('imgBy', ''), 'use': lic,
        'link': f"https://www.wikidata.org/wiki/{r['id']}", 'wiki': r.get('kowiki', ''),
    })
seen_wd = {i['id'] for i in items}
# 2) 위키백과 갈래(무형유산·악기·옷·무기 등) — 위키데이터에 없는 것만
PERSON = re.compile(r'(인물|정치인|장군|무신|문신|군인|학자|화가|배우|가수|승려|왕족|왕비|국왕|임금|관료|명창|연주자|무용가|기업|대학교|회사|방송|드라마|영화|게임|선수|\(\d{3,4}년|년 ~ )')
for r in kw:
    if PERSON.search((r.get('desc') or '') + ' ' + (r.get('ext') or '')[:80]): continue
    if all('무형유산' in g for g in r.get('grp', [])) and not re.search(r'무형|문화재|유산|전승|보유자|기능|예능', r.get('ext', '')): continue
    if r.get('wd') and r['wd'] in seen_wd:
        for it in items:
            if it['id'] == r['wd']:
                it.setdefault('grp', r.get('grp', [])); it['desc'] = r.get('desc') or r.get('ext', '')[:120]
                break
        continue
    items.append({'src': 'kowiki', 'id': r.get('wd') or 'kw:' + r['ko'], 'name': r['ko'], 'en': '', 'desig': [], 'grp': r.get('grp', []),
                  'kind': kinds_of(' '.join(r.get('grp', [])), r['ko'], r.get('desc', '')), 'mat': mats_of(r.get('ext', '')), 'matRaw': '',
                  'era': '', 'where': '', 'coll': '', 'img': '', 'imgLic': '', 'imgBy': '', 'use': '', 'desc': r.get('desc') or r.get('ext', '')[:120],
                  'link': 'https://ko.wikipedia.org/wiki/' + r['ko'].replace(' ', '_'), 'wiki': r['ko'], 'wikiImg': r.get('file', '')})
# 3) e뮤지엄 소장품
for r in em:
    k = r.get('kogl', '')
    items.append({'src': 'emuseum', 'id': r['id'], 'name': r.get('t', ''), 'en': '', 'desig': [r['des']] if r.get('des') else [],
                  'kind': kinds_of(r.get('cls', ''), r.get('t', ''), ' '.join(r.get('kw', []))), 'mat': mats_of(r.get('mat', ''), r.get('t', '')), 'matRaw': r.get('mat', ''),
                  'era': r.get('era', ''), 'where': '', 'coll': r.get('mu', ''), 'size': r.get('size', ''), 'cls': r.get('cls', ''),
                  'img': '', 'imgLic': ('공공누리 제%s유형' % k) if k else '', 'imgBy': r.get('mu', ''), 'use': 'free' if k == '1' else ('no' if k else ''),
                  'link': 'https://www.emuseum.go.kr/detail?relicId=' + r['id'], 'desc': (r.get('desc') or '')[:140], 'tags': r.get('tags', []), 'kw': r.get('kw', [])})
# 4) 유네스코 표시
un = {u['ko'].replace(' ', ''): u for u in unesco}
for it in items:
    u = un.get(it['name'].replace(' ', ''))
    if u: it['unesco'] = u['kind'] + ' ' + str(u['year'])

# 5) 업체(만들 수 있는 곳)
SHOP_KIND = [('국악기', r'국악|악기|피리|대금|가야금|해금|거문고|장구|북|고씨공방'), ('한복·무용복', r'한복|주단|무용|전통의상|개량|미스터리|우리옷|침선'),
             ('나전칠기', r'나전|자개|칠기|옻'), ('매듭·자수', r'매듭|자수|누비'), ('한지', r'한지'), ('유기', r'유기|방짜|놋'), ('도자기', r'청자|백자|분청|옹기|도자|도예'),
             ('민화·단청', r'민화|단청'), ('장신구', r'장신구|노리개|비녀|가락지'), ('목공·소목', r'목가구|소목|목공'), ('갓·부채·탈', r'갓|부채|탈|하회'),
             ('활·칼', r'국궁|궁시|활|장도|칼|대장간'), ('기타 전통공예', r'공예|공방|짚풀|죽공예|화각|전각|붓|먹|벼루|연|등')]
NOT_SHOP = re.compile(r'발레|댄스|요가|비누|아로마|캔들|소고트리아나|소고 |화장실|주차장|식당|카페$')
shop_out = []
for s in shops:
    t = s['name'] + ' ' + s.get('cat', '') + ' ' + ' '.join(s.get('q', []))
    if NOT_SHOP.search(s['name']) or re.search(r'한복대여|박물관|주차|음식|카페|의류판매|여성의류', s.get('cat', '')): continue
    # 실제로 만드는·파는 곳만: 업종이 공예·악기·한복 쪽이거나, 이름에 공방·공예·국악 같은 말이 분명히 있는 곳
    CORE = {'악기판매점', '악기제조', '한복', '무용복', '전통공예', '미술,공예', '수예,자수', '도자기', '도자기,도예촌', '목공예', '금속공예', '공방'}
    NAME_OK = re.compile(r'국악|한복|주단|공방|공예|유기|방짜|옹기|나전|칠기|매듭|자수|한지|도예|도자|청자|백자|분청|화각|전각|국궁|궁시|대장간|소목|민화|단청|침선|누비|장신구')
    if s.get('cat') not in CORE and not NAME_OK.search(s['name']): continue
    if re.search(r'펜션|숙박|호텔|식당|한식|치킨|피자|카페|교회|섬$|지명|교량|학교|학원|전시관|미술관|박물관|문화시설|단체,협회|협회|관광|명소|식품|계곡|문화유적|떡|한과|분식|보청기|전자|간판|건설|교육,학문|체험학습장', s.get('cat', '')): continue
    if '대장간' in s['name'] and re.search(r'소리|3D|간판|튀김|나무|청년', s['name']): continue
    # 무용복집은 한국무용·창작무용·국악 공연복을 다루는 곳만(발레·댄스스포츠 의상실은 뺀다)
    if s.get('cat') == '무용복' and not (set(s.get('q', [])) & {'한국무용 의상', '한국무용복', '창작무용 의상', '국악 공연복', '무대의상 한복'} or re.search(r'한복|국악|전통|무용복', s['name'])): continue
    if re.search(r'^소고|소고 |트리아나|비누|아로마|캔들|라탄|마크라메|요가', s['name']): continue
    ks = [k for k, p in SHOP_KIND if re.search(p, t)]
    if not ks: continue
    home = s.get('home', '')
    if 'map.kakao.com' in home: home = ''
    shop_out.append({'name': s['name'], 'kind': ks[0], 'cat': s.get('cat', ''), 'addr': s.get('addr', ''), 'phone': s.get('phone', ''), 'home': home,
                     'kakao': s.get('detail', '')})

stats = {
    'total': len(items), 'bySrc': collections.Counter(i['src'] for i in items),
    'byKind': collections.Counter(k for i in items for k in i['kind']), 'byMat': collections.Counter(m for i in items for m in i['mat']),
    'freeImg': sum(1 for i in items if i['use'] == 'free'), 'shops': len(shop_out), 'shopKind': collections.Counter(s['kind'] for s in shop_out),
    'unesco': sum(1 for i in items if i.get('unesco')),
}
json.dump({'items': items, 'shops': shop_out, 'unesco': unesco, 'stats': stats}, open(os.path.join(WORK, 'catalog.json'), 'w'), ensure_ascii=False)
print(json.dumps(stats, ensure_ascii=False, default=dict)[:3000])
