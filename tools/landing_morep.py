# 소개 화면 3종(a·b·c)의 「유물 하나에 물건 여럿」 칸을 만든다 — 다시 돌려도 같은 자리만 바뀜
import re, os
os.chdir(os.path.join(os.path.dirname(__file__), '..', 'web-landing'))
G=[('r_6952','청자 오리 모양 연적','고려','물을 한 방울씩 따르던 연적','오리는 부부 금실, 연꽃과 함께면 장원 급제',[('duck_water','다육식물 물주개','한 방울씩 따르던 구조 그대로'),('duck_rest','한 쌍 수저받침','마주 보는 두 마리 — 신혼 선물'),('duck_pen','합격 기원 펜꽂이','연잎 위 오리 = 장원 급제')]),
('r_1124','청자 석류 모양 주전자','고려','술과 차를 따르던 주전자','씨 많은 석류는 자손 번창',[('pom_tea','티포트 · 찻잔 세트','따르던 쓰임 그대로'),('pom_vase','출산 축하 꽃병','자손을 비는 석류에 꽃을')]),
('r_957','포도·동자 무늬 조롱박 주전자와 받침','고려','주전자와 그 받침','포도와 아이는 자손이, 조롱박은 복이 가득하길',[('grape_decanter','와인 디캔터와 받침','포도 무늬에 포도주를'),('grape_bowl','과일 그릇','받침 속 포도 무늬 위에 진짜 포도')]),
('r_1233','청자 기린 장식 향로','고려','향을 피우던 세 발 그릇','기린은 뛰어난 사람(기린아)',[('kirin_incense','캔들 홀더','향 대신 초를'),('kirin_trophy','졸업 · 승진 기념패','기린아의 뜻을 이름판에')]),
('r_4219','청자 원앙 모양 향로 뚜껑','고려','향 연기가 부리로 나오던 뚜껑','원앙은 평생 짝을 지키는 금실',[('mandarin_ring','결혼반지 받침 한 쌍','마주 보는 원앙 앞에 반지 둘'),('mandarin_incense','혼례 자리 이름표 꽂이','상견례 · 결혼식 식탁에')]),
('r_1997','방패형 동기','초기철기','끈으로 매달아 쓰던 의기','방패는 지킴',[('shield_keys','현관 열쇠걸이','다시 벽에 걸어 집을 지키는'),('shield_bookends','북엔드 한 쌍','양쪽에서 책을 지키는')]),
(None,'연화문 벽돌','백제 · 보물','넷을 이어 깔면 꽃 하나가 되던 벽돌','연꽃은 맑음과 생명의 번성',[('lotus_coaster','코스터 4장','넷이 둘러앉아 꽃 하나'),('lotus_clock','벽시계','벽에 깔던 벽돌을 다시 벽으로'),('lotus_trivet','냄비 받침','구운 흙이라 뜨거워도 끄떡없이')]),
('nmk_4220','청자 석류 모양 연적','고려','원숭이 입으로 물을 따르던 연적','석류는 자손 번창',[('monkey_diffuser','한 방울 디퓨저','같은 구멍에 리드를'),('monkey_weight','문진','먹과 붓 곁 그대로')]),
(None,'산수무늬 벽돌 · 청동 금강령','백제 · 보물 / 고려','산수를 새긴 벽돌 · 의식에 울리던 방울','',[('sansu_frame','부조 액자','산수화처럼 벽에'),('bell_meditation','탁상 명상벨','마음을 모을 때 울리는 종')])]
NUM=['하나','둘','셋','넷','다섯','여섯','일곱','여덟','아홉']
def grp(i,g):
    r,n,era,use,mean,ps=g
    rel=f'<div class="orig"><img loading="lazy" src="../m/{r}.webp" alt="{n}"></div>' if r else ''
    head=f'<div class="gh"><i class="no">{NUM[i]}</i><b>{n}</b><span>{era} · {use}</span>'+(f'<em>{mean}</em>' if mean else '')+'</div>'
    prods=''.join(f'<figure><img loading="lazy" src="../m/{f}.webp" alt="{t} 시제품 렌더"><figcaption><b>{t}</b>{w}</figcaption></figure>' for f,t,w in ps)
    return f'<div class="grp" data-in>{head}<div class="gi">{rel}<span class="arrow" aria-hidden="true"></span>{prods}</div></div>'
n=sum(len(g[5]) for g in G)
BLOCK=f'''<!--morep-->
<div class="morep">
  <div class="mh" data-in><b>유물 하나에, 물건 여럿</b><span>사람마다 취향이 다르니까 — 원래 쓰임과 담긴 뜻을 따라 유물 하나를 여러 물건으로 바꿨습니다 · 시제품 {n}가지 · 옆으로 넘겨 보세요 →</span></div>
  <div class="rail">{''.join(grp(i,g) for i,g in enumerate(G))}</div>
  <p class="mfoot" data-in>불상처럼 지금도 모시는 유물, 뼈를 담던 그릇일 수 있는 유물은 3D 스캔이 있어도 물건으로 바꾸지 않았습니다. 보물은 실물 복제에 박물관 허가가 따로 필요합니다.</p>
</div>
<!--/morep-->
'''
BASE='''/*morep*/
.morep{margin:12vh 0 4vh}
.morep .mh{display:flex;flex-wrap:wrap;gap:6px 18px;align-items:baseline;margin-bottom:26px}
.morep .mh b{font-size:clamp(22px,2.4vw,30px)}
.morep .mh span{font-size:14px;opacity:.78;max-width:46em}
.morep .rail{display:flex;gap:56px;overflow-x:auto;scroll-snap-type:x proximity;scroll-padding-left:2px;padding:6px 0 20px;scrollbar-width:thin}
.morep .grp{flex:none;scroll-snap-align:start}
.morep .gh{margin-bottom:14px;max-width:620px;position:relative}
.morep .gh .no{font-style:normal}
.morep .gh b{display:block;font-size:19px}
.morep .gh span{display:block;font-size:13px;opacity:.75}
.morep .gh em{display:block;font-style:normal;font-size:13px;margin-top:2px}
.morep .gi{display:flex;gap:16px;align-items:flex-end}
.morep .orig{width:120px;flex:none;align-self:center;text-align:center}
.morep .orig img{max-width:110px;max-height:150px;object-fit:contain;filter:drop-shadow(0 10px 14px rgba(0,0,0,.35))}
.morep .arrow{flex:none;width:34px;align-self:center;height:2px;position:relative}
.morep .arrow:after{content:"";position:absolute;right:0;top:-4px;border:5px solid transparent;border-left:8px solid currentColor;border-right:0}
.morep .orig+.arrow{background:currentColor;opacity:.55}
.morep .gi>.arrow:first-child{display:none}
.morep figure{margin:0;flex:none;scroll-snap-align:start;width:clamp(170px,21vw,250px)}
.morep figure img{width:100%;aspect-ratio:1;object-fit:cover;display:block}
.morep figcaption{font-size:13px;line-height:1.45;margin-top:9px;opacity:.88}
.morep figcaption b{display:block;font-size:15px}
.morep .mfoot{font-size:13px;opacity:.72;margin-top:16px;max-width:52em}
@media(max-width:700px){.morep .rail{gap:36px}.morep .gh{max-width:88vw}.morep .gi{gap:10px}.morep figure{width:160px}.morep .orig{width:80px}.morep .orig img{max-width:76px}.morep .arrow{width:20px}}
'''
VAR={
'a':'''.morep .mh b{font-family:'Nanum Myeongjo',serif;color:var(--gold)}
.morep .gh{padding-left:16px;border-left:1px solid var(--gold)}
.morep .gh .no{display:block;font-size:11px;letter-spacing:.3em;color:var(--gold);margin-bottom:2px}
.morep .gh b{font-family:'Nanum Myeongjo',serif;margin-top:4px}
.morep .gh em{color:var(--gold)}
.morep .orig{background:radial-gradient(closest-side,rgba(214,170,92,.28),transparent 78%);padding:18px 0}
.morep figure img{border-radius:2px;box-shadow:0 18px 40px rgba(0,0,0,.55)}
.morep .arrow{color:var(--gold)}
.morep .rail{cursor:grab;user-select:none;-webkit-user-select:none}.morep .rail.drag{cursor:grabbing;scroll-snap-type:none}.morep .rail img{-webkit-user-drag:none;pointer-events:none}
.morep figure img{transition:transform .8s cubic-bezier(.16,1,.3,1)}.morep figure:hover img{transform:translateY(-6px)}
''',
'b':'''.morep .mh b{font-family:'Noto Serif KR',serif;font-weight:900}
.morep .grp{display:flex;gap:18px;align-items:flex-start}
.morep .gh{writing-mode:vertical-rl;max-width:none;max-height:420px;margin:0;padding:0 0 0 4px;border-left:1px solid var(--line)}
.morep .gh .no{display:inline-block;writing-mode:horizontal-tb;background:var(--seal);color:#f5ead6;font-size:12px;font-weight:700;padding:5px 4px;margin-bottom:10px;border-radius:2px}
.morep .gh b{font-family:'Noto Serif KR',serif;font-weight:900;font-size:20px;letter-spacing:.06em}
.morep .gh span,.morep .gh em{font-size:12.5px;margin-left:4px}
.morep .gh em{color:var(--seal)}
.morep figure img{border-radius:0;box-shadow:0 1px 0 var(--line),0 12px 24px rgba(31,26,20,.18)}
.morep figcaption b{font-family:'Noto Serif KR',serif}
.morep .arrow{color:var(--seal)}
.morep .orig img{filter:drop-shadow(0 8px 10px rgba(31,26,20,.3))}
''',
'c':'''.morep .mh b{font-family:'Black Han Sans',sans-serif;font-weight:400;font-size:clamp(28px,3.4vw,44px)}
.morep .gh .no{display:inline-block;font-family:'Black Han Sans',sans-serif;font-size:14px;padding:2px 10px;margin-bottom:6px;background:var(--y);color:var(--k)}
.morep .grp:nth-child(5n+2) .gh .no{background:var(--r);color:var(--w)}
.morep .grp:nth-child(5n+3) .gh .no{background:var(--b);color:var(--w)}
.morep .grp:nth-child(5n+4) .gh .no{background:var(--w);color:var(--k)}
.morep .grp:nth-child(5n+5) .gh .no{background:var(--k);color:var(--w)}
.morep .gh b{font-size:21px}
.morep figure{transform:rotate(-1.2deg);transition:transform .25s}
.morep figure:nth-of-type(2n){transform:rotate(1.4deg)}
.morep figure:hover{transform:rotate(0) translateY(-6px)}
.morep figure img{border:4px solid var(--w);box-shadow:5px 6px 0 rgba(0,0,0,.28)}
.morep .arrow{color:var(--y)}
'''}
for v in 'abc':
    p=f'v3src/{v}.html'; s=open(p,encoding='utf-8').read()
    s=re.sub(r'\n?<div class="morep">.*?\n</div>\n','\n',s,flags=re.S) if '<!--morep-->' not in s else re.sub(r'<!--morep-->.*?<!--/morep-->\n','',s,flags=re.S)
    s=re.sub(r'\n\.morep\{margin:12vh.*?@media\(max-width:700px\)\{\.morep[^\n]*\n','\n',s,flags=re.S)
    s=re.sub(r'/\*morep\*/.*?/\*/morep\*/\n','',s,flags=re.S)
    anchor={'a':'    <div class="stat">','b':'    <p class="tally" data-in>','c':'  <div class="tally">'}[v]
    i=s.index('class="make"'); j=s.index(anchor,i)
    s=s[:j]+BLOCK+s[j:]
    s=s.replace('</style>',BASE+VAR[v]+'/*/morep*/\n</style>',1)
    open(p,'w',encoding='utf-8').write(s); print(v,'ok',s.count('class="morep"'))
