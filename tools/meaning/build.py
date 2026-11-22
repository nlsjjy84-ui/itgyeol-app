# 유물 2,903점의 「박물관 설명」과 「유물에 담긴 뜻」을 모아 src/data/pieceMeaning.js 를 만든다.
# 입력: /tmp/pieces.json(앱 조각 목록), /tmp/meaning/nmk/*.jsonl(국중박 상세), gogung.json, cma_ko.json, motif_*.
import json, glob, re, os, collections
ROOT = '/home/claude/itgyeol-app'
it = json.load(open('/tmp/pieces.json'))
nmk = {}
for f in glob.glob('/tmp/meaning/nmk/*.jsonl'):
    for l in open(f):
        r = json.loads(l); nmk[r['id']] = r
gg = json.load(open('/tmp/meaning/gogung.json'))
cma = json.load(open(os.path.join(ROOT, 'tools/meaning/cma_ko.json')))
extra = json.load(open(os.path.join(ROOT, 'tools/meaning/motif_extra.json')))
exec(open(os.path.join(ROOT, 'tools/meaning/motif_cg.py')).read())  # M
cgseq = json.load(open('/tmp/meaning/motif_seq.json'))
exec(open(os.path.join(ROOT, 'tools/meaning/types_ko.py')).read())  # T
NAME2T = [('큰 칼','도'),('어보영자','어보보자기'),('어보보자기','어보보자기'),('보자기','어보보자기'),('각연','벼루'),('일월연','벼루'),('숟가락','수저'),('젓가락','수저'),('수저','수저'),('침통','침통'),('가위','가위'),('열쇠','열쇠'),('자물쇠','열쇠'),('족집게','족집게'),('담뱃대','담뱃대'),('구슬','구슬'),('석관','석관'),('석등','등'),('명등','등'),('사방등','등'),('등경','등'),('동제등','등'),('사자','사자상'),('태극장','훈장'),('팔괘장','훈장'),('화포','화포'),('윷','놀이'),('놀이판','놀이'),('묘지명','묘지명'),('도끼','도끼'),('판화','판화'),('당간','당간'),('베개','베개'),('향꽂이','향꽂이'),('먹통','먹통'),('등거리','옷'),('기와','기와'),('쇠못','못'),('뼈','뼈'),('장식','장식'),('용 머리','장식'),('원판','장식'),('금구','장식'),('등상','장식'),('작은 닭','인형'),('꽃방망이','장식'),('원숭이','인형'),('기마','기마인물'),('말모양','말모양'),('말 모양','말모양'),('오리','오리모양'),('곱은옥','곱은옥'),('사자도','사자도'),('수레','수레'),('화살통','활'),('활고자','활'),('갑옷','갑옷'),('소반','소반'),('인형','인형'),('벼루','벼루'),('연(','벼루'),('막새','막새'),('꾸미개','꾸미개'),('드리개','행엽'),('귀걸이','이식(귀걸이)'),('거울','경'),('동경','경'),('주전자','주전자'),('주자','주자'),('연적','연적'),('인장','인장'),('도장','인장'),('항아리','항아리'),('단지','단지'),('검','검'),('환두대도','도'),('큰칼','도'),('칼','칼'),('창','창'),('병','병'),('띠고리','대구'),('허리띠 고리','교구'),('허리띠 장식','과대'),('허리띠','과대'),('가락바퀴','방추차'),('반달돌칼','반월형석도'),('불상','불상'),('보살','불상'),('여래','불상'),('방울','방울'),('요령','요령'),('사리','사리구'),('탑','소탑'),('재갈','재갈'),('행엽','행엽'),('말띠드리개','행엽'),('말띠꾸미개','운주'),('안장','안장'),('등자','등자'),('발걸이','등자'),('화살촉','화살촉'),('수막새','수막새'),('암막새','암막새'),('대접','대접'),('사발','완'),('잔','잔'),('향로','향로'),('향완','향로'),('저울','저울및추'),('바둑','바둑'),('금동관','금동관'),('뼈항아리','골호'),('명기','명기'),('흉배','보/흉배'),('투구','전투모'),('총통','총통'),('해시계','해시계'),('일구','해시계'),('풍탁','풍탁'),('등잔','등잔'),('베갯모','베갯모'),('노리개','노리개'),('목걸이','경식(목걸이)'),('장도','장도'),('동곳','동곳'),('선추','선추'),('필통','필통'),('접시','접시'),('합','합'),('정병','정병')]

# 낱말 맞추기 규칙: 무늬/문/모양/형/장식/머리 등과 함께 나올 때만
TAIL = r'(?:[가-힣 ]{0,6}?[·・,] ?)*[가-힣 ]{0,5}?(?:무늬|문(?![방서자구])|모양|형|장식|머리|꼭지|뉴|얼굴|잠)'
RULE = {k: re.compile(re.escape(k) + TAIL) for k in M}
RULE['용'] = re.compile(r'(?<![사작효])용(?![도기])' + TAIL)
RULE['학'] = re.compile(r'(?:운|쌍|구름·?)?학(?=무늬|문|모양|형|흉배|·)')
RULE['새'] = re.compile(r'새(?=무늬|문|모양|형|날개)|꽃새')
RULE['범'] = re.compile(r'범(?=무늬|문(?!자)|모양)')
RULE['포도'] = re.compile(r'포도(?![청대])' + TAIL)
RULE['물결'] = re.compile(r'물결|파도')
for k in ('구슬',): RULE.pop(k, None); M.pop(k, None)
XRULE = {  # 출처가 백과사전 등인 것
 '기린': re.compile(r'기린'), '동자': re.compile(r'동자'), '두꺼비': re.compile(r'두꺼비'), '원앙': re.compile(r'원앙'),
 '거북': re.compile(r'거북|귀갑|귀부'), '짐승얼굴': re.compile(r'짐승얼굴|귀면|도깨비|귀신'), '십장생': re.compile(r'십장생'),
 '잡상': re.compile(r'잡상|대당사부|손행자|저팔계|사화상|마화상|이구룡|천산갑|이귀박|나토두|삼살보살'), '치미': re.compile(r'치미|망새'),
 '사인검': re.compile(r'사인검|사인참사검'), '삼인검': re.compile(r'삼인검'), '토우': re.compile(r'토우'), '금강령': re.compile(r'금강령'),
}
MOTIF = {}
def add_motif(mid, n, m, s, u=''):
    MOTIF[mid] = {'n': n, 'm': m, 's': s + (' ' + u if False else ''), 'u': u}
for k, (cls, m) in M.items():
    sq = cgseq.get(cls)
    u = f'https://www.culture.go.kr/portal/cltKnw/trdPttAppl/prdDsignView.do?menuNo=200063&seq={sq}' if sq else 'https://www.culture.go.kr/portal/cltKnw/trdPtt/list.do?menuNo=200055'
    add_motif('c_' + k, k, m, '문화포털 전통문양 「' + cls + '」', u)
for k, v in extra.items():
    if k in ('도깨비얼굴', '귀면'): continue
    add_motif('x_' + k, k, v['m'].rstrip('.') + '.', v['s'], v['u'])

def strip_tags(s): return re.sub(r'\s+', ' ', s or '').strip()
out = {}; fix = {}; stat = collections.Counter()
for p in it:
    k = p['k']; src = k.split('_')[0]; name = p['name']
    e = {}
    hay = name
    if src == 'nmk':
        r = nmk.get(k[4:], {})
        hay += ' ' + r.get('다른명칭', '') + ' ' + r.get('전시명칭', '')
        d = strip_tags(r.get('desc', ''))
        if len(d) > 30: e['d'] = d; e['ds'] = '국립중앙박물관 소장품 설명'; stat['d_nmk'] += 1
        if r.get('분류'): e['c'] = r['분류']
        if r.get('출토지'): e['p'] = r['출토지']
        dn = r.get('전시명칭', '').strip()
        if dn and dn != name and len(dn) <= 40: e['dn'] = dn
    elif src == 'gogung':
        g = gg.get(k[7:], {})
        d = strip_tags(g.get('desc', '')) or strip_tags(p.get('desc', ''))
        if d: e['d'] = d; e['ds'] = '국립고궁박물관 소장품 설명'; stat['d_gogung'] += 1
        hay += ' ' + g.get('hanja', '') + ' ' + g.get('kw', '')
    elif src == 'cma':
        c = cma.get(k)
        if c:
            e['d'] = c['ko']; e['ds'] = '클리블랜드 미술관 설명(우리말로 옮김)'; e['dk'] = 'tr'; stat['d_cma'] += 1
            if c.get('fix') and c['fix'] != name: fix[k] = c['fix']
            hay += ' ' + c.get('fix', '')
    ws = []
    for kk, rx in RULE.items():
        if rx.search(hay) and ('c_' + kk) in MOTIF:
            # 같은 뜻 중복(연꽃/연화/연판) 하나만
            if MOTIF['c_' + kk]['s'] not in [MOTIF[w]['s'] for w in ws]: ws.append('c_' + kk)
    for kk, rx in XRULE.items():
        if rx.search(hay) and ('x_' + kk) in MOTIF and ('x_' + kk) not in ws: ws.append('x_' + kk)
    tk = None
    leaf = (e.get('c') or '').split(' - ')[-1]
    nm = (fix.get(k) or name)
    best = -1; blen = 0
    for w, t in NAME2T:
        if w == '화포' and re.search(r'청화포|화포도', nm): continue
        if w in ('장식', '꾸미개') : continue
        if w == '검' and re.search(r'검은|검정', nm): continue
        i = nm.rfind(w)
        if i >= 0 and (i + len(w) > best or (i + len(w) == best and len(w) > blen)): best = i + len(w); blen = len(w); tk = t
    if not tk and leaf in T: tk = leaf
    if not tk:
        for w in ('장식', '꾸미개'):
            if w in nm: tk = '장식' if w == '장식' else '꾸미개'; break
    if not tk and nm.rstrip().endswith('활'): tk = '활'
    if not tk and '토기' in nm: tk = '토기'
    if tk:
        tid = 't_' + tk
        if tid not in MOTIF:
            n, m, rid = T[tk]
            if rid and rid.startswith('U:'):
                MOTIF[tid] = {'n': n, 'm': m, 's': '국립중앙박물관 큐레이터 설명' if 'museum.go.kr' in rid else '클리블랜드 미술관 설명', 'u': rid[2:]}
            elif rid and rid.startswith('E'):
                MOTIF[tid] = {'n': n, 'm': m, 's': '한국민족문화대백과사전', 'u': f'https://encykorea.aks.ac.kr/Article/{rid}'}
            elif rid:
                MOTIF[tid] = {'n': n, 'm': m, 's': '국립중앙박물관 소장품 설명', 'u': f'https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?schM=view&searchId=search&relicId={rid}'}
            else:
                MOTIF[tid] = {'n': n, 'm': m, 's': '박물관 소장품 분류 기록', 'u': ''}
        ws.insert(0, tid); stat['type'] += 1
    if 'x_짐승얼굴' in ws:
        ws = [w for w in ws if w not in ('c_도깨비', 'c_얼굴', 'c_귀면', 'c_짐승얼굴')]
    if ws: e['w'] = ws; stat['w'] += 1
    if e.get('d') or ws: stat['any'] += 1
    out[k] = e
print(len(it), dict(stat))
js = '// 자동 생성 — tools/meaning/build.py. 고치지 말고 build.py를 고칠 것.\n'
js += '// d: 박물관 설명(국립중앙박물관·국립고궁박물관 공공누리 제1유형 원문 / 클리블랜드 미술관 CC0 설명을 우리말로 옮김), w: 이름 속 무늬·모양·종류의 뜻(MOTIF).\n'
js += 'export const MOTIF = ' + json.dumps({k: {'n': v['n'], 'm': v['m'], 's': v['s'], 'u': v['u']} for k, v in MOTIF.items()}, ensure_ascii=False) + ';\n'
js += 'export const MEANING = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(os.path.join(ROOT, 'src/data/pieceMeaning.js'), 'w').write(js)
open(os.path.join(ROOT, 'src/data/pieceNameFix.js'), 'w').write('// 자동 생성 — tools/meaning/build.py. 앱에 붙은 이름이 박물관 원래 이름과 다른 유물만 바로잡는다.\nexport const NAME_FIX = ' + json.dumps(fix, ensure_ascii=False, indent=0) + ';\n')
print('size', os.path.getsize(os.path.join(ROOT, 'src/data/pieceMeaning.js')) // 1024, 'KB', 'fix', len(fix))
json.dump(out, open('/tmp/meaning/meaning_out.json', 'w'), ensure_ascii=False)
