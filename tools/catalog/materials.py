# 잇결 재료 갈래 — 사용자가 놀이 전에 고르는 실제 전통 재료.
# look: 결과물을 실물처럼 그릴 때 쓰는 값(색·거칠기·금속성·겉칠) — 앱 3D 재질과 같은 값을 쓴다.
MATERIAL_TREE = [
  {'id': 'metal', 'name': '쇠붙이', 'items': [
    {'id': 'gold', 'name': '금', 'rx': r'금(?!속|박|동|강)|金|gold|금제|금동', 'look': {'color': '#d4a640', 'rough': 0.28, 'metal': 1}, 'note': '신라 금관·귀걸이처럼 두드려 펴고 달개를 단다'},
    {'id': 'silver', 'name': '은', 'rx': r'은(?!행|입사)|銀|silver|은제', 'look': {'color': '#d2d2cc', 'rough': 0.32, 'metal': 1}, 'note': '비녀·노리개·가락지에 많이 쓰였다'},
    {'id': 'yugi', 'name': '놋쇠(유기)', 'rx': r'유기|놋|방짜|황동|brass', 'look': {'color': '#c09a4c', 'rough': 0.32, 'metal': 1}, 'note': '구리와 주석을 섞어 두드린 방짜와 부어 만든 주물. 꽹과리·징도 방짜다'},
    {'id': 'bronze', 'name': '청동·구리', 'rx': r'청동|구리|동합금|동제|금동|(?<![황금청])동$|bronze|copper', 'look': {'color': '#6f6a4a', 'rough': 0.55, 'metal': 0.7}, 'note': '동경(구리거울)·범종·향로'},
    {'id': 'iron', 'name': '철', 'rx': r'철|쇠|iron|鐵', 'look': {'color': '#77726b', 'rough': 0.5, 'metal': 1}, 'note': '환도·갑옷 미늘·장석·농기구'},
    {'id': 'ipsa', 'name': '은입사', 'rx': r'입사', 'look': {'color': '#2f2c2a', 'rough': 0.4, 'metal': 1, 'inlay': '#d8d8d2'}, 'note': '쇠 바탕에 은실을 박아 무늬를 낸다'},
  ]},
  {'id': 'clay', 'name': '흙·불', 'items': [
    {'id': 'celadon', 'name': '청자', 'rx': r'청자|celadon', 'look': {'color': '#a7bcaa', 'rough': 0.12, 'metal': 0, 'clear': 1}, 'note': '고려 비색. 상감으로 흰 흙·붉은 흙을 박는다'},
    {'id': 'porcelain', 'name': '백자', 'rx': r'백자|white porcelain', 'look': {'color': '#efece2', 'rough': 0.12, 'metal': 0, 'clear': 1}, 'note': '조선 달항아리·청화백자'},
    {'id': 'buncheong', 'name': '분청사기', 'rx': r'분청', 'look': {'color': '#b9ab93', 'rough': 0.35, 'metal': 0, 'clear': 0.6}, 'note': '회색 흙 위에 흰 흙을 바르고 긁어 낸다'},
    {'id': 'onggi', 'name': '옹기', 'rx': r'옹기|onggi', 'look': {'color': '#5a3a26', 'rough': 0.3, 'metal': 0, 'clear': 0.7}, 'note': '잿물을 입혀 숨 쉬는 그릇'},
    {'id': 'earthen', 'name': '토기·기와', 'rx': r'토기|도기|기와|와당|막새|토제|earthenware', 'look': {'color': '#6d6a66', 'rough': 0.8, 'metal': 0}, 'note': '수막새·토우·시루'},
  ]},
  {'id': 'plant', 'name': '나무·풀', 'items': [
    {'id': 'paulownia', 'name': '오동나무', 'rx': r'오동', 'look': {'color': '#b48a5a', 'rough': 0.55, 'metal': 0, 'grain': 1}, 'note': '가야금·거문고 앞판, 장구 통'},
    {'id': 'wood', 'name': '나무(소나무·느티·참죽 등)', 'rx': r'나무|목제|목재|木|소나무|느티|참죽|피나무|wood', 'look': {'color': '#8a5f3c', 'rough': 0.5, 'metal': 0, 'grain': 1}, 'note': '반닫이·소반·떡살·탈'},
    {'id': 'bamboo', 'name': '대나무', 'rx': r'대나무|죽(?!음)|竹|bamboo', 'look': {'color': '#c8b27a', 'rough': 0.4, 'metal': 0}, 'note': '대금·피리·부채살·참빗'},
    {'id': 'straw', 'name': '왕골·짚·싸리', 'rx': r'왕골|짚|볏짚|싸리|초제|straw', 'look': {'color': '#c9b27e', 'rough': 0.9, 'metal': 0}, 'note': '짚신·멍석·삼태기·소쿠리'},
    {'id': 'hanji', 'name': '한지', 'rx': r'한지|저지|종이|^지$|^지 - 기타|紙|paper', 'look': {'color': '#f1eadb', 'rough': 0.95, 'metal': 0}, 'note': '책·연·지화·지승공예'},
  ]},
  {'id': 'fiber', 'name': '실·천', 'items': [
    {'id': 'silk', 'name': '비단', 'rx': r'비단|견$|견직|명주|단$|사$|라$|silk', 'look': {'color': '#b23a48', 'rough': 0.72, 'metal': 0, 'sheen': 1}, 'note': '원삼·활옷·노리개 술'},
    {'id': 'ramie', 'name': '모시', 'rx': r'모시|저포|사직 - 저|ramie', 'look': {'color': '#eae4d2', 'rough': 0.7, 'metal': 0, 'sheen': 0.4}, 'note': '한산모시(인류무형문화유산)'},
    {'id': 'hemp', 'name': '삼베', 'rx': r'삼베|마포|마$|대마|hemp', 'look': {'color': '#d8cba8', 'rough': 0.9, 'metal': 0}, 'note': '평민의 옷감·상복'},
    {'id': 'cotton', 'name': '무명', 'rx': r'무명|면$|면직|cotton', 'look': {'color': '#efe9dc', 'rough': 0.85, 'metal': 0, 'sheen': 0.3}, 'note': '바지저고리·장구 조임줄'},
    {'id': 'knot', 'name': '매듭·자수 실', 'rx': r'매듭|자수|수놓|끈$|술$|embroider', 'look': {'color': '#c23b3b', 'rough': 0.6, 'metal': 0, 'sheen': 0.8}, 'note': '노리개 매듭·흉배 자수'},
  ]},
  {'id': 'animal', 'name': '짐승·바다', 'items': [
    {'id': 'leather', 'name': '가죽', 'rx': r'가죽|피모(?! - 말총)|피$|혁|leather|hide', 'look': {'color': '#e2cf9f', 'rough': 0.65, 'metal': 0, 'sheen': 0.3}, 'note': '장구·북 가죽면, 갖신'},
    {'id': 'hwagak', 'name': '쇠뿔(화각)', 'rx': r'화각|쇠뿔|우각|horn', 'look': {'color': '#d9a24a', 'rough': 0.15, 'metal': 0, 'clear': 1}, 'note': '쇠뿔을 얇게 펴 뒷면에 그림을 그린다'},
    {'id': 'najeon', 'name': '자개(나전)', 'rx': r'나전|자개|螺鈿|mother', 'look': {'color': '#d7dde2', 'rough': 0.15, 'metal': 0.2, 'irid': 1}, 'note': '전복 껍데기를 잘라 옻칠 바탕에 붙인다'},
    {'id': 'horsehair', 'name': '말총', 'rx': r'말총|마미', 'look': {'color': '#141414', 'rough': 0.4, 'metal': 0, 'sheen': 0.6}, 'note': '갓·망건·탕건을 짜는 말꼬리털'},
    {'id': 'bone', 'name': '상아·뼈', 'rx': r'상아|뼈|골제|ivory|bone', 'look': {'color': '#efe6cf', 'rough': 0.35, 'metal': 0}, 'note': '호패·장도 손잡이'},
    {'id': 'gem', 'name': '산호·호박·진주', 'rx': r'산호|호박|진주|비취|coral|amber|pearl', 'look': {'color': '#d0574a', 'rough': 0.2, 'metal': 0, 'clear': 0.8}, 'note': '노리개·떨잠·뒤꽂이 장식'},
  ]},
  {'id': 'paint', 'name': '칠·물감', 'items': [
    {'id': 'otchil', 'name': '옻칠', 'rx': r'옻|칠기|흑칠|주칠|칠$|lacquer', 'look': {'color': '#1c1412', 'rough': 0.18, 'metal': 0, 'clear': 1}, 'note': '흑칠·주칠. 나전·화각의 바탕'},
    {'id': 'gilt', 'name': '금박·금니', 'rx': r'금박|금니|도금|gilt', 'look': {'color': '#d6ad4c', 'rough': 0.3, 'metal': 1}, 'note': '금박 댕기·원삼 금박 무늬'},
    {'id': 'dancheong', 'name': '단청 안료', 'rx': r'단청|채색|안료|pigment', 'look': {'color': '#2f6f5e', 'rough': 0.7, 'metal': 0}, 'note': '뇌록·석간주·장단·삼청'},
    {'id': 'ink', 'name': '먹', 'rx': r'먹(?!이)|묵|ink', 'look': {'color': '#1d1c1b', 'rough': 0.45, 'metal': 0, 'sheen': 0.35}, 'note': '서예·탁본·목판 인쇄. 먹 덩이에는 금박 글씨·무늬를 새긴다'},
  ]},
  {'id': 'stone', 'name': '돌·옥', 'items': [
    {'id': 'jade', 'name': '옥', 'rx': r'옥(?!새|산|천)|jade|비취', 'look': {'color': '#9cc3a2', 'rough': 0.15, 'metal': 0, 'clear': 1}, 'note': '옥가락지·옥비녀·관자'},
    {'id': 'granite', 'name': '화강암', 'rx': r'화강|석제|돌|石|stone|granite', 'look': {'color': '#a7a39b', 'rough': 0.85, 'metal': 0}, 'note': '석탑·장승·맷돌'},
    {'id': 'glass', 'name': '유리·구슬', 'rx': r'유리|구슬|glass', 'look': {'color': '#6f9fc4', 'rough': 0.05, 'metal': 0, 'clear': 1}, 'note': '신라 유리잔·구슬 목걸이'},
    {'id': 'inkstone', 'name': '벼룻돌', 'rx': r'벼루|남포석|자석', 'look': {'color': '#3a3a3c', 'rough': 0.5, 'metal': 0}, 'note': '보령 남포석 벼루'},
  ]},
]
