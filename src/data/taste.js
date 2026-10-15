// "대한민국 전통문화 하면 뭐가 떠오르나요?" — 시작 전 질문의 선택지.
// 근거: 유네스코 인류무형문화유산 한국 등재 23건(장 담그기·탈춤·매사냥·연등회·씨름·제주 해녀·줄다리기·농악·김장·아리랑·
//       줄타기·택견·한산모시짜기·가곡·대목장·남사당놀이·영산재·제주칠머리당영등굿·강강술래·처용무·종묘제례·판소리·강릉단오제),
//       유네스코 세계유산(불국사·석굴암, 종묘, 창덕궁, 수원화성, 해인사 장경판전, 하회·양동마을, 서원, 경주 역사유적 등),
//       한글·한복·한식·한옥·한지·한국음악(여섯 개의 '한'), 국가무형유산 분야(공연·공예·음식·놀이·무예·의례).
// 각 선택지는 앱 안의 물건(items)·놀이(games)·판(scenes)과 이어진다 — 예시 작품 100여 점을 이 연결로 만들었다.
// 이 질문은 결과를 정하지 않는다. 결과는 언제나 놀이에서 남긴 행동의 흔적으로만 정해진다.
const k = (id, label, items, games = [], scenes = []) => ({ id, label, items, games, scenes });

export const TASTE_GROUPS = [
  {
    id: 'wear', label: '입고 꾸미는 것', keywords: [
      k('hanbok', '한복', ['norigae', 'ring', 'pouch', 'mirror', 'mypae', 'mybadge']),
      k('mosi', '모시·삼베·옷감', ['pouch', 'bottari', 'norigae', 'dice']),
      k('jewel', '노리개·비녀·가락지', ['norigae', 'ring', 'mirror', 'mypae', 'mybadge']),
      k('maedeup', '조각보·매듭·자수', ['bottari', 'pouch', 'norigae', 'dice', 'mypae', 'mycoaster']),
      k('gat', '갓·선비', ['bandaji', 'brush', 'ink', 'pouch', 'mystamp', 'mystele']),
      k('jeogori', '저고리·치마·두루마기', ['pouch', 'norigae', 'mirror', 'ring']),
      k('honrye-bok', '원삼·활옷·혼례복', ['norigae', 'mirror', 'pagoda', 'ring']),
      k('gache', '쪽머리·댕기·가체', ['ring', 'mirror', 'norigae']),
      k('beoseon', '버선·꽃신·갓끈', ['pouch', 'norigae', 'bottari', 'ring']),
      k('geumbak', '금박·자수·누비', ['dice', 'bottari', 'pouch', 'norigae'], [], ['jinbeop']),
    ],
  },
  {
    id: 'home', label: '집과 먹거리', keywords: [
      k('hanok', '한옥·대목장', ['hanok', 'bandaji', 'soban', 'lock', 'mysumak']),
      k('onggi', '장독·장 담그기', ['onggi', 'moonjar', 'bandaji']),
      k('kimjang', '김치·김장', ['onggi', 'bottari', 'soban', 'pouch']),
      k('tteok', '떡·한과·한식상', ['soban', 'bottari', 'moonjar', 'pouch', 'spoonrest', 'cup']),
      k('furniture', '반닫이·소반·목가구', ['bandaji', 'soban', 'lock', 'hanok']),
      k('hanji', '한지·종이', ['dice', 'pouch', 'brush', 'ink', 'mybookmark'], [], ['print']),
      k('seoye', '붓·먹·서예', ['brush', 'ink', 'dice', 'bandaji', 'mystamp', 'mybookmark', 'mystele'], [], ['print']),
      k('ondol', '온돌·구들·아궁이', ['hanok', 'bandaji', 'soban', 'lock']),
      k('giwa', '기와·처마·서까래', ['hanok', 'pagoda', 'bell', 'lock', 'mysumak', 'mystele']),
      k('changho', '문살·창호지·꽃살문', ['hanok', 'bandaji', 'lock', 'dice']),
      k('yugi', '놋그릇·유기·수저', ['soban', 'onggi', 'lock', 'ring', 'spoonrest']),
      k('bibimbap', '비빔밥·한정식·반찬', ['soban', 'bottari', 'moonjar', 'pouch', 'spoonrest']),
      k('doenjang', '된장·간장·고추장', ['onggi', 'moonjar', 'bottari']),
      k('tea', '차·다도·전통주', ['moonjar', 'maebyeong', 'soban', 'onggi', 'cup', 'mycoaster']),
      k('baneul', '바느질·다듬이·보자기', ['bottari', 'pouch', 'norigae', 'dice']),
    ],
  },
  {
    id: 'sound', label: '소리와 춤', keywords: [
      k('nongak', '농악·풍물', ['sogo', 'brush', 'pouch'], ['sangmo', 'juldarigi']),
      k('samul', '사물놀이·장구', ['sogo', 'norigae', 'pouch', 'mypae'], ['sangmo']),
      k('pansori', '판소리·소리꾼', ['sogo', 'pouch', 'brush']),
      k('arirang', '아리랑·민요', ['sogo', 'norigae', 'bottari', 'pouch']),
      k('gagok', '가곡·가야금·국악', ['sogo', 'pouch', 'mirror']),
      k('talchum', '탈춤·남사당놀이', ['pouch', 'sogo', 'brush', 'dice'], ['sangmo', 'gomugojul']),
      k('ganggang', '강강술래·원무', ['ring', 'dice', 'norigae', 'bottari'], ['gomugojul']),
      k('cheoyong', '처용무·궁중무용', ['pagoda', 'brush', 'pouch', 'norigae'], ['gomugojul']),
      k('jultagi', '줄타기·곡예', ['pouch', 'lock', 'ink', 'brush'], ['julneomgi', 'gomugojul']),
      k('kkwaenggwari', '꽹과리·징·북', ['sogo', 'bell', 'ring'], ['sangmo']),
      k('geomungo', '거문고·가야금·해금', ['sogo', 'mirror', 'pouch']),
      k('daegeum', '대금·피리·태평소', ['brush', 'pouch', 'sogo', 'ink']),
      k('gut', '굿·무가·씻김', ['sogo', 'pouch', 'bell', 'norigae']),
      k('sinawi', '시나위·즉흥 장단', ['sogo', 'dice', 'pouch', 'ring'], ['sangmo']),
      k('jangdan', '장단·덩덕쿵', ['sogo', 'bell', 'dice', 'ring'], ['sangmo']),
    ],
  },
  {
    id: 'play', label: '놀이와 무예', keywords: [
      k('ssireum', '씨름', ['brush', 'bell', 'sogo', 'lock'], ['juldarigi', 'biseok']),
      k('taekkyeon', '택견·태권도·무예', ['brush', 'bell', 'lock', 'ring'], ['biseok', 'tuho']),
      k('juldarigi', '줄다리기', ['sogo', 'ring', 'bottari', 'bell'], ['juldarigi']),
      k('yut', '윷놀이·주사위', ['dice', 'ring', 'pouch', 'bottari'], ['jachigi', 'guseulchigi']),
      k('yeon', '연날리기', ['ink', 'pouch', 'norigae'], ['yeonnaligi']),
      k('jeonrae', '팽이·구슬·딱지 전래놀이', ['dice', 'ink', 'ring', 'pouch'], ['paengi', 'guseulchigi', 'ddakji', 'gullyeongsoe']),
      k('tuho', '투호·궁중놀이', ['moonjar', 'maebyeong', 'onggi', 'pagoda'], ['tuho']),
      k('neolttwigi', '널뛰기·그네', ['pouch', 'norigae', 'ink', 'ring'], ['julneomgi']),
      k('jegi', '제기차기·공기·사방치기', ['dice', 'ring', 'pouch', 'bottari'], ['guseulchigi', 'jachigi']),
      k('gonu', '바둑·장기·고누', ['dice', 'ring', 'lock', 'bottari']),
      k('gungsul', '활쏘기·국궁', ['brush', 'ring', 'lock', 'bell'], ['tuho', 'biseok']),
      k('maesanyang', '매사냥', ['brush', 'bell', 'ink', 'lock']),
      k('jwibul', '쥐불놀이·달집태우기', ['ink', 'bell', 'norigae', 'dice'], ['gullyeongsoe']),
    ],
  },
  {
    id: 'ritual', label: '의례와 축제', keywords: [
      k('danoje', '강릉단오제·단오', ['mirror', 'norigae', 'sogo', 'pouch']),
      k('yeondeung', '연등회·등불', ['pagoda', 'bell', 'norigae', 'dice', 'ink']),
      k('jongmyo', '종묘제례·제례악', ['hanok', 'bell', 'soban', 'sogo']),
      k('yeongsan', '영산재·절의 의식', ['bell', 'pagoda', 'sogo', 'brush']),
      k('haenyeo', '제주 해녀·제주', ['onggi', 'pouch', 'bottari', 'ring'], ['gullyeongsoe']),
      k('myeongjeol', '설·추석·세시풍속', ['soban', 'norigae', 'brush', 'dice', 'pouch'], ['yeonnaligi', 'jachigi']),
      k('honrye', '전통 혼례·폐백', ['norigae', 'mirror', 'soban', 'pouch', 'ring', 'mypae']),
      k('doljanchi', '돌잔치·돌잡이', ['pouch', 'brush', 'ring', 'dice', 'soban']),
      k('jesa', '제사·차례·상차림', ['soban', 'bandaji', 'bell', 'moonjar', 'spoonrest', 'myjar']),
      k('jangseung', '장승·솟대·서낭당', ['ink', 'bell', 'brush', 'lock']),
      k('dongji', '동지 팥죽·정월 대보름', ['onggi', 'moonjar', 'ink', 'pouch'], ['yeonnaligi']),
      k('sebae', '세배·덕담·복주머니', ['pouch', 'norigae', 'dice', 'bottari', 'mypae', 'mybadge']),
    ],
  },
  {
    id: 'heritage', label: '유산과 보물', keywords: [
      k('bulguksa', '불국사·석굴암·석탑', ['pagoda', 'bell', 'norigae', 'mysumak', 'mystele']),
      k('palace', '궁궐·창덕궁·경복궁', ['hanok', 'pagoda', 'ring', 'soban', 'brush', 'mysumak']),
      k('hwaseong', '수원화성·남한산성', ['hanok', 'lock', 'brush', 'bell']),
      k('hahoe', '하회·양동마을·서원', ['hanok', 'ink', 'brush', 'soban', 'mystamp', 'mystele']),
      k('haeinsa', '해인사·팔만대장경', ['pagoda', 'bell', 'brush', 'ink']),
      k('sinra', '신라·금관·경주', ['pagoda', 'mirror', 'ring', 'bell', 'mysumak', 'mybadge']),
      k('dalhang', '달항아리·조선백자', ['moonjar', 'onggi', 'maebyeong', 'myjar', 'cup']),
      k('celadon', '고려청자·매병', ['maebyeong', 'moonjar', 'mirror', 'ring', 'myjar', 'cup']),
      k('bronze', '동경·청동기·고인돌', ['mirror', 'bell', 'ring', 'lock']),
      k('cheomseongdae', '첨성대·측우기·앙부일구', ['pagoda', 'bell', 'mirror', 'ring']),
      k('baekje', '백제 금동대향로·무령왕릉', ['pagoda', 'bell', 'mirror', 'ring']),
      k('bangasayu', '반가사유상·불상', ['pagoda', 'bell', 'moonjar', 'ring']),
      k('geobukseon', '거북선·성곽·한양도성', ['lock', 'bell', 'brush', 'hanok']),
      k('seokbinggo', '석빙고·돌담·장독대', ['onggi', 'pagoda', 'hanok', 'lock']),
      k('sansa', '산사·절·목탁', ['bell', 'pagoda', 'hanok', 'sogo']),
    ],
  },
  {
    id: 'record', label: '글과 기록', keywords: [
      k('hangul', '한글·훈민정음', ['dice', 'norigae', 'ink', 'brush', 'bottari', 'mystamp', 'mybookmark'], [], ['print', 'hangul']),
      k('sillok', '실록·직지·기록유산', ['ink', 'brush', 'bottari', 'bandaji', 'mystamp', 'mystele', 'mybookmark'], [], ['print']),
      k('uihak', '동의보감·한의학', ['pouch', 'onggi', 'bandaji', 'soban']),
      k('eumyang', '음양오행·태극·오방색', ['ring', 'mirror', 'dice', 'norigae', 'pouch'], [], ['jinbeop']),
      k('dancheong', '단청·전통 색', ['hanok', 'pouch', 'norigae', 'dice', 'mybadge', 'mycoaster'], [], ['jinbeop']),
      k('minhwa', '민화·까치호랑이·책가도', ['bandaji', 'ink', 'pouch', 'dice', 'bottari', 'mybadge', 'mycoaster'], [], ['print']),
      k('byeongpung', '병풍·그림', ['pouch', 'ink', 'dice', 'bottari', 'bandaji', 'mycoaster'], [], ['jinbeop']),
      k('gungche', '궁체·캘리그라피', ['brush', 'ink', 'dice', 'pouch', 'mystamp', 'mybookmark'], [], ['print', 'hangul']),
      k('jikji', '금속활자·목판인쇄', ['ink', 'brush', 'bell', 'lock', 'mystamp', 'mybookmark'], [], ['print']),
      k('taegeuk', '태극기·무궁화·상징', ['norigae', 'dice', 'bottari', 'ring', 'mybadge'], [], ['jinbeop']),
    ],
  },
];

export const TASTE_KEYWORDS = TASTE_GROUPS.flatMap((g) => g.keywords.map((kw) => ({ ...kw, group: g.id })));

export const GAME_NAMES = {
  julneomgi: '줄넘기', juldarigi: '줄다리기', sangmo: '상모돌리기', guseulchigi: '구슬치기', paengi: '팽이치기', jachigi: '자치기',
  biseok: '비석치기', tuho: '투호', ddakji: '딱지치기', gomugojul: '고무줄놀이', yeonnaligi: '연날리기', gullyeongsoe: '굴렁쇠',
};
export const SCENE_NAMES = { jinbeop: '진법', print: '훈민정음·인쇄', hangul: '한글 테트리스', talchum: '탈춤', dancheong: '단청' };

// 한 작품이 어떤 선택지와 닿는지 — 직접(main) / 물건 / 놀이·판 순으로 점수를 준다.
export function keywordsFor({ item, games = [], scenes = [] }) {
  return TASTE_KEYWORDS.filter((kw) => kw.items.includes(item) || kw.games.some((g) => games.includes(g)) || kw.scenes.some((s) => scenes.includes(s))).map((kw) => kw.id);
}
