# 조각 이름 영어 표기 — 낱말 사전으로 "재료 + 무늬 + 물건" 꼴로 만든다(외국인 관람객용, 원래 이름은 그대로 둔다)
import re
MAT = [('백자청화','Blue-and-white porcelain'),('청화백자','Blue-and-white porcelain'),('금 ','Gold'),('백자 청화','Blue-and-white porcelain'),('백자','White porcelain'),('청자','Celadon'),('분청사기','Buncheong ware'),('분청','Buncheong'),
 ('금동','Gilt-bronze'),('청동','Bronze'),('동제','Bronze'),('은제','Silver'),('은','Silver'),('금제','Gold'),('철제','Iron'),('쇠','Iron'),('철','Iron'),('유리','Glass'),('옥','Jade'),('나무','Wooden'),('목제','Wooden'),('돌','Stone'),('석제','Stone'),('간돌','Polished stone'),('뗀석기','Chipped stone'),
 ('토기','Earthenware'),('흑유','Black-glazed'),('녹유','Green-glazed'),('나전','Mother-of-pearl'),('뼈','Bone'),('조개','Shell'),('놋','Brass'),('유기','Brassware'),('칠기','Lacquerware'),('흙','Clay')]
MOTIF = [('연꽃','lotus'),('용','dragon'),('봉황','phoenix'),('구름','cloud'),('국화','chrysanthemum'),('모란','peony'),('넝쿨','vine'),('당초','arabesque'),('물고기','fish'),('학','crane'),('호랑이','tiger'),('짐승얼굴','beast-face'),('도깨비','goblin-face'),('귀면','demon-face'),('사자','lion'),('기린','qilin'),('거북','turtle'),('포도','grape'),('매화','plum blossom'),('대나무','bamboo'),('산수','landscape'),('복숭아','peach'),('개구리','frog'),('오리','duck'),('새','bird'),('물가','waterside'),('고사리','fernlike'),('쌍조','twin-bird')]
OBJ = [('매병','maebyeong vase'),('항아리','jar'),('주전자','ewer'),('정병','kundika'),('병','bottle'),('연적','water dropper'),('접시','dish'),('대접','large bowl'),('사발','bowl'),('완','bowl'),('발','bowl'),('잔','cup'),('합','lidded box'),('뚜껑','lid'),('향로','incense burner'),('향완','incense burner'),('촛대','candlestick'),('등잔','oil lamp'),
 ('수막새','round roof-end tile'),('암막새','flat roof-end tile'),('치미','ridge-end ornament'),('기와','roof tile'),('막새','roof-end tile'),('잡상','roof figurine'),
 ('토우','clay figurine'),('인장','seal'),('도장','seal'),('어보','royal seal'),('거울','mirror'),('동경','bronze mirror'),('귀걸이','earrings'),('비녀','hairpin'),('떨잠','trembling hairpin'),('뒤꽂이','hair ornament'),('노리개','norigae pendant'),('목걸이','necklace'),('구슬','bead'),('곱은옥','comma-shaped jade'),('가락지','ring'),('팔찌','bracelet'),('허리띠','belt'),('띠고리','belt buckle'),('꾸미개','ornament'),('관','crown'),
 ('칼','sword'),('검','sword'),('환도','sword'),('창','spear'),('화살촉','arrowhead'),('촉','arrowhead'),('투구','helmet'),('갑옷','armor'),('방패','shield'),('총통','cannon'),('포','cannon'),('탄환','bullet'),('등자','stirrup'),('재갈','horse bit'),('말띠','harness'),('행엽','horse ornament'),('운주','harness ornament'),
 ('가락바퀴','spindle whorl'),('저울추','scale weight'),('추','weight'),('자물쇠','lock'),('열쇠','key'),('숟가락','spoon'),('수저','spoon and chopsticks'),('낫','sickle'),('도끼','axe'),('괭이','hoe'),('따비','digging stick'),('못','nail'),('고리','ring'),
 ('벼루','inkstone'),('먹','ink stick'),('붓','brush'),('필통','brush holder'),('부채','fan'),('방울','bell'),('풍탁','wind bell'),('종','bell'),('편종','bell chime'),('편경','stone chime'),('징','gong'),('꽹과리','small gong'),
 ('불상','Buddha statue'),('보살','bodhisattva'),('사리','sarira'),('탑','pagoda'),('가마','palanquin'),('해시계','sundial'),('앙부일구','scaphe sundial'),('혼천의','armillary sphere'),('측우대','rain gauge stand'),('부표','float'),('사람','figure'),('인물','figure'),('말','horse'),('소','ox'),('갓모','hat cover'),('등갓','lamp shade'),('장식','ornament'),('잔받침','cup stand'),('기름병','oil bottle'),('호','jar'),('장군','barrel bottle'),('단지','jar'),('판','plaque'),('조각','fragment'),('편','shard'),('쪽','piece'),('주자','ewer'),('흉배','rank badge'),('인형','doll'),('그릇','vessel'),('토기','earthenware vessel'),('꽂이','hair ornament'),('함','box'),('등','lamp'),('사유상','pensive statue'),('바둑알','go stones'),('굴대','axle part'),('경','mirror'),('기','flag'),('보','seal')]
def en_name(name):
    n = re.sub(r'\(.*?\)', '', name)
    mat = next((e for k, e in MAT if k in n), '')
    mot = next((e for k, e in MOTIF if k in n), '')
    obj = next((e for k, e in OBJ if n.rstrip().endswith(k) or (' ' + k) in n or k in n.split()[-1:]), '')
    if not obj:
        obj = next((e for k, e in OBJ if k in n), '')
    if not obj: return ''
    parts = [mat, (mot + '-pattern') if mot and 'face' not in mot and mot not in ('dragon','tiger','lion','turtle','frog','duck','bird','fish','qilin','phoenix','crane','peach') else mot, obj]
    s = ' '.join(p for p in parts if p).strip()
    return s[:1].upper() + s[1:]
if __name__ == '__main__':
    for x in ['백자청화동채복숭아형연적','청동 주전자','연꽃무늬 수막새','짐승얼굴무늬 기와','쇠 띠고리','돌 저울추','가락바퀴','칼','분청사기 도장무늬 발','나무로 만든 호랑이를 타고 있는 사람','금 가는 고리 귀걸이']:
        print(x, '→', en_name(x))
