import * as A from './models_a';
import * as B from './models_b';
import * as C from './models_c';
import * as D from './models_d';
import * as E from './models_e';
import * as F from './models_f';
import * as G from './models_g';
import * as M from './models_mine';
import * as H from './models_h';

// 결과물 카탈로그 — 어떤 물건에 조각보를 입힐 수 있는지.
// group: 배지(약 3cm) · 키링(약 4.5cm 입체) · 낙관 도장(약 4cm) · 수막새 자석(약 4.5cm) · 책상 소품(문진 7cm·코스터 9cm)
// · 책갈피(황동 판, print3d: false) · 우리나라 보물(3D 모형, 높이 약 5cm) · 일상용품(날염·인쇄·도자기 전사, print3d: false)
// longMm: 출력 크기(가장 긴 변, mm). 물건에 있으면 그 값이 먼저다.
// 모두 풀컬러 3D 프린팅으로 실제 만들 수 있는 것만 둔다. 화면의 3D는 printSafe로 1.5mm보다 얇은 곳을
// 두껍게 다듬은 모양이라, 보이는 그대로 출력된다. 술·매듭은 진짜 실, 키링 고리는 쇠 부품이다.
// craft: 무늬를 입히는 전통 기법(조각보·청자 상감·백자 청화·나전칠기·단청·금은 입사) — 물건의 재료에 맞춘다.
// 두껍게 해도 버티지 못하는 물건(비녀 핀, 부채 살, 붓대, 갓 챙, 금관 달개, 방패연 살)은 넣지 않는다.
// 설명은 "그 물건이 실제로 어떤 것인지"를 짧게 알려 준다.

export const CATALOG = [
  {
    id: 'badge',
    label: '배지',
    longMm: 32,
    intro: '내 놀이가 빚은 지름 약 3cm 배지예요. 뒷면에 쇠 핀을 달아 가방·옷에 꽂아요.',
    items: [
      {
        id: 'mybadge',
        craft: 'jogakbo',
        shaped: true,
        label: '나만의 배지',
        about: '진법이 꽃잎 테두리와 둘레의 볼록 점을, 맞춘 글자가 가운데 도드라진 낙관을, 한글 테트리스가 아래 자모를 만들어요.',
        variants: [{ id: 'mine', label: '내 기록으로 빚은 배지', build: M.mineBadge }],
      },
    ],
  },
  {
    id: 'keyring',
    label: '키링',
    longMm: 45,
    hook: true,
    intro: '전통 소품을 약 4.5cm 입체 키링으로 만들어요. 술과 매듭은 진짜 실로 달아요.',
    items: [
      {
        id: 'mypae',
        craft: 'jogakbo',
        shaped: true,
        label: '나만의 노리개 패',
        about: '내 놀이가 모양을 빚은 패예요. 진법이 꽃잎 테두리와 뚫린 구멍을, 맞춘 글자가 도드라진 낙관을, 전래놀이가 뒷면 부조를, 한글 테트리스가 꼭지 블록을 만들어요.',
        variants: [{ id: 'mine', label: '내 기록으로 빚은 패', build: M.mineNorigae }],
      },
      {
        id: 'norigae',
        craft: 'jogakbo',
        label: '노리개',
        about: '한복 저고리 고름이나 치마허리에 다는 장신구예요. 몸통인 패에 매듭과 술을 달아요.',
        variants: [
          { id: 'round', label: '원형 패', build: A.norigaeRound },
          { id: 'square', label: '네모 패', build: A.norigaeSquare },
          { id: 'samjak', label: '삼작', build: A.norigaeSamjak, note: '큰 패 하나와 작은 패 둘을 함께 단 노리개' },
          { id: 'bat', label: '박쥐 패 삼작', build: G.norigaeBat, note: '박쥐는 복을 뜻해 패 모양으로 많이 썼어요' },
        ],
      },
      {
        id: 'ring',
        craft: 'ipsa',
        label: '가락지',
        about: '손가락에 끼는 고리예요. 한 쌍을 함께 끼는 쌍가락지가 대표적이에요.',
        variants: [
          { id: 'single', label: '단가락지', build: A.ringSingle },
          { id: 'pair', label: '쌍가락지', build: A.ringPair },
          { id: 'wide', label: '넓은 띠', build: A.ringWide },
        ],
      },
      {
        id: 'mirror',
        craft: 'ipsa',
        label: '거울',
        about: '고려 때는 청동으로 만든 동경을 썼어요. 뒷면에 무늬를 넣는 것이 특징이에요.',
        variants: [
          { id: 'hand', label: '손거울', build: A.mirrorHand },
          { id: 'bronze', label: '동경(청동거울)', build: A.mirrorBronze },
        ],
      },
      {
        id: 'brush',
        craft: 'najeon',
        label: '필통',
        about: '붓을 꽂아 두는 통이에요. 붓·먹·종이·벼루를 문방사우라고 하고, 필통은 선비 책상의 단골 살림이었어요.',
        variants: [
          { id: 'pot', label: '필통', build: B.brushPot },
        ],
      },
      {
        id: 'ink',
        craft: 'ipsa',
        label: '먹',
        about: '그을음을 아교로 굳힌 글씨용 먹이에요. 물을 넣고 벼루에 갈아 써요.',
        variants: [
          { id: 'bar', label: '막대 먹', build: B.inkBar },
          { id: 'round', label: '둥근 먹', build: B.inkRound },
          { id: 'half', label: '반달 먹', build: B.inkHalf },
        ],
      },
      {
        id: 'lock',
        craft: 'ipsa',
        label: '자물쇠',
        about: '함이나 문을 잠그는 쇠예요. 물고기는 눈을 감지 않아 집을 잘 지킨다고 해서 물고기 모양을 많이 썼다고 전해져요.',
        variants: [
          { id: 'box', label: '네모 자물쇠', build: B.lockBox },
          { id: 'butterfly', label: '나비 자물쇠', build: B.lockButterfly },
          { id: 'fish', label: '물고기 자물쇠', build: B.lockFish },
        ],
      },
      {
        id: 'sogo',
        craft: 'dancheong',
        label: '소고·장구·북',
        about: '풍물(농악)의 타악기예요. 소고는 손잡이 달린 작은 북, 장구는 허리가 잘록한 북, 북은 둥근 큰 북이에요.',
        variants: [
          { id: 'sogo', label: '소고', build: C.drumSogo },
          { id: 'janggu', label: '장구', build: C.drumJanggu },
          { id: 'buk', label: '북', build: C.drumBuk },
        ],
      },
      {
        id: 'pouch',
        craft: 'jogakbo',
        label: '복주머니',
        about: '복을 담는다는 뜻으로 설날 같은 때 주고받던 주머니예요. 둥근 두루주머니, 모서리가 각진 귀주머니가 있어요.',
        variants: [
          { id: 'round', label: '둥근 주머니', build: C.pouchRound },
          { id: 'corner', label: '귀주머니', build: C.pouchCorner },
          { id: 'flat', label: '납작 주머니', build: C.pouchFlat },
        ],
      },
      {
        id: 'dice',
        craft: 'jogakbo',
        label: '조각 주사위',
        about: '조각보의 조각을 여섯 면에 나눠 붙인 정육면체예요. 조각이 모여 입체가 된다는 뜻을 담았어요.',
        variants: [{ id: 'cube', label: '정육면체', build: C.cubeDice }],
      },
    ],
  },
  {
    id: 'stamp',
    label: '낙관 도장',
    longMm: 40,
    intro: '진짜로 찍히는 약 2×2×4cm 도장이에요. 도장면에 글자를 거꾸로 새겨, 찍으면 바로 읽혀요.',
    items: [
      {
        id: 'mystamp',
        craft: 'jogakbo',
        shaped: true,
        label: '나만의 낙관 도장',
        about: '맞춘 글자가 도장면에 새겨지고(없으면 한글 테트리스 자모나 가장 많이 한 놀이 무늬), 한글 테트리스 블록이나 진법 꽃잎이 손잡이가 돼요.',
        variants: [{ id: 'mine', label: '내 기록으로 빚은 도장', build: M.mineStamp }],
      },
    ],
  },
  {
    id: 'sumak',
    label: '수막새 자석',
    longMm: 45,
    intro: '신라 수막새(기와 끝 둥근 막새)의 짜임을 내 놀이로 빚은 지름 약 4.5cm 자석이에요. 뒷면에 자석을 붙여요.',
    items: [
      {
        id: 'mysumak',
        craft: 'jogakbo',
        shaped: true,
        label: '나만의 수막새',
        about: '진법 인원 수만큼 연꽃잎이, 놀이 횟수만큼 연밥 씨앗이(맞춘 글자가 있으면 연밥 자리에 낙관이), 놀이 가짓수와 블록 수만큼 둘레 구슬이 생겨요.',
        variants: [{ id: 'mine', label: '내 기록으로 빚은 수막새', build: M.mineSumak }],
      },
    ],
  },
  {
    id: 'desk',
    label: '책상 소품',
    intro: '책상에 두고 매일 쓰는 소품이에요. 풀컬러 3D 출력으로 만들어요.',
    items: [
      {
        id: 'mystele',
        craft: 'jogakbo',
        shaped: true,
        longMm: 70,
        label: '나만의 문진',
        about: '높이 약 7cm 비석 모양 문진이에요. 마친 판 수만큼 받침돌이 쌓이고, 앞면에 맞춘 글자 낙관과 놀이 부조가, 머릿돌 위에 한글 테트리스 블록이 올라가요.',
        variants: [{ id: 'mine', label: '내 기록으로 빚은 문진', build: M.mineStele }],
      },
      {
        id: 'mycoaster',
        craft: 'jogakbo',
        shaped: true,
        longMm: 90,
        label: '나만의 코스터',
        about: '지름 약 9cm 코스터예요. 컵이 놓이는 가운데는 평평하게 무늬를 인쇄하고, 둘레 테를 진법 꽃잎과 놀이 구슬, 낙관으로 빚어요. 컵 바닥만 닿아 음식은 닿지 않아요.',
        variants: [{ id: 'mine', label: '내 기록으로 빚은 코스터', build: M.mineCoaster }],
      },
    ],
  },
  {
    id: 'bookmark',
    label: '책갈피',
    print3d: false,
    intro: '얇은 황동 판을 부식·레이저로 잘라 만드는 책갈피예요. 3D 출력으로는 너무 얇아 금속으로 만들어요. 술은 진짜 실이에요.',
    items: [
      {
        id: 'mybookmark',
        craft: 'ipsa',
        shaped: true,
        label: '나만의 책갈피',
        about: '약 3×12cm 황동 책갈피예요. 진법이 물결진 머리와 몸통의 구멍 무늬를, 놀이 가짓수가 아래쪽 가로 마디를 만들어요.',
        variants: [{ id: 'mine', label: '내 기록으로 빚은 책갈피', build: M.mineBookmark }],
      },
    ],
  },
  {
    id: 'treasure',
    label: '우리나라 보물',
    longMm: 50,
    intro: '우리나라 보물을 높이 약 5cm 3D 모형으로 만들어요. 조각보는 본래 물건을 싸는 보자기라 그릇과 가구에도 잘 어울려요.',
    items: [
      {
        id: 'myjar',
        craft: 'sanggam',
        shaped: true,
        label: '나만의 항아리',
        about: '내 놀이가 빚은 항아리예요. 진법 인원 수만큼 참외처럼 골이 지고, 맞춘 글자는 어깨의 낙관으로, 전래놀이는 어깨 둘레 부조로, 한글 테트리스는 뚜껑 꼭지 블록으로 들어가요.',
        variants: [{ id: 'mine', label: '내 기록으로 빚은 항아리', build: M.mineJar }],
      },
      {
        id: 'moonjar',
        craft: 'cheonghwa',
        label: '달항아리',
        about: '조선 시대 백자 큰 항아리예요. 둥근 보름달을 닮아 달항아리라고 불러요.',
        variants: [{ id: 'jar', label: '백자 달항아리', build: D.treasureMoonJar }],
      },
      {
        id: 'maebyeong',
        craft: 'sanggam',
        label: '매병',
        about: '어깨가 넓고 허리가 가는 병이에요. 고려청자에서 많이 볼 수 있어요.',
        variants: [{ id: 'vase', label: '청자 매병', build: D.treasureMaebyeong }],
      },
      {
        id: 'bandaji',
        craft: 'najeon',
        label: '반닫이',
        about: '앞면이 아래위로 열리는 전통 궤예요. 놋쇠 장식이 달려요.',
        variants: [{ id: 'chest', label: '반닫이', build: D.treasureBandaji }],
      },
      {
        id: 'bottari',
        craft: 'jogakbo',
        label: '보따리',
        about: '보자기로 물건을 싸서 네 귀를 묶은 모양이에요. 조각보의 본래 쓰임이에요.',
        variants: [{ id: 'bundle', label: '조각보 보따리', build: D.treasureBottari }],
      },
      {
        id: 'soban',
        craft: 'najeon',
        label: '소반',
        about: '한 사람 몫의 음식을 올리는 작은 상이에요. 상판에 조각보를 깔았어요.',
        variants: [{ id: 'soban', label: '둥근 소반', build: D.treasureSoban }],
      },
      {
        id: 'bell',
        craft: 'ipsa',
        label: '범종',
        about: '절에서 시간을 알리고 마음을 가다듬을 때 치는 큰 종이에요. 윗부분의 용 모양 고리를 용뉴라고 해요.',
        variants: [{ id: 'bell', label: '청동 범종', build: F.treasureBell }],
      },
      {
        id: 'pagoda',
        craft: 'dancheong',
        label: '석탑',
        about: '부처님의 가르침을 기리며 돌로 쌓은 탑이에요. 기단 위에 몸돌과 지붕돌을 번갈아 쌓아요.',
        variants: [{ id: 'pagoda', label: '삼층석탑', build: F.treasurePagoda }],
      },
      {
        id: 'hanok',
        craft: 'dancheong',
        label: '한옥',
        about: '기와 지붕에 나무 기둥과 한지 문을 단 우리나라 전통 집이에요. 처마 끝이 살짝 들려 있어요.',
        variants: [{ id: 'hanok', label: '기와집', build: F.treasureHanok }],
      },
      {
        id: 'onggi',
        craft: 'jogakbo',
        label: '장독',
        about: '간장·된장·김치를 담던 옹기 항아리예요. 숨을 쉬는 흙그릇이라 음식이 잘 익어요.',
        variants: [{ id: 'onggi', label: '옹기 장독', build: F.treasureOnggi }],
      },
    ],
  },
  {
    id: 'daily',
    label: '일상용품',
    print3d: false,
    intro: '모양은 정해진 물건에 내 무늬를 입혀 쓰는 물건이에요. 천은 날염, 종이는 인쇄, 도자기는 전사지로 구워 입혀요.',
    items: [
      {
        id: 'fan',
        craft: 'jogakbo',
        label: '접부채',
        about: '대나무 살에 한지를 붙인 접부채예요. 한지에 내 무늬를 인쇄해요.',
        variants: [{ id: 'folding', label: '한지 접부채', build: B.fanFolding }],
      },
      {
        id: 'towel',
        craft: 'jogakbo',
        label: '수건',
        about: '면 수건(34×80cm)에 내 무늬를 날염해요.',
        variants: [{ id: 'towel', label: '면 수건', build: H.fabricTowel }],
      },
      {
        id: 'hanky',
        craft: 'jogakbo',
        label: '손수건',
        about: '45cm 면 손수건에 내 무늬를 날염하고 가장자리를 말아 박아요.',
        variants: [{ id: 'hanky', label: '면 손수건', build: H.fabricHanky }],
      },
      {
        id: 'scarf',
        craft: 'jogakbo',
        label: '스카프',
        about: '긴 스카프에 내 무늬를 두 번 이어 날염해요.',
        variants: [{ id: 'scarf', label: '스카프', build: H.fabricScarf }],
      },
      {
        id: 'pouch',
        craft: 'jogakbo',
        label: '파우치',
        about: '지퍼 파우치 앞뒤에 내 무늬를 날염해 봉제해요.',
        variants: [{ id: 'pouch', label: '지퍼 파우치', build: H.fabricPouch }],
      },
      {
        id: 'postcard',
        craft: 'jogakbo',
        label: '엽서',
        about: '엽서(148×100mm) 2장 왼쪽에 내 무늬를, 오른쪽에 쓸 칸을 인쇄해요.',
        variants: [{ id: 'postcard', label: '엽서 2장', build: H.paperPostcard }],
      },
      {
        id: 'frame',
        craft: 'jogakbo',
        label: '작은 액자',
        about: '내 무늬를 인쇄해 원목 액자에 넣어요. 책상에 세워 둬요.',
        variants: [{ id: 'frame', label: '원목 액자', build: H.paperFrame }],
      },
      {
        id: 'cup',
        craft: 'cheonghwa',
        label: '백자 잔',
        about: '백자 잔에 내 무늬 띠와 낙관을 전사지로 구워 입혀요. 입이 닿는 물건이라 3D 출력이 아니라 도자기로 만들어요.',
        variants: [{ id: 'cup', label: '백자 잔', build: M.ceramicCup }],
      },
      {
        id: 'spoonrest',
        craft: 'cheonghwa',
        label: '수저받침',
        about: '백자 수저받침 윗면에 내 무늬를, 옆면에 낙관을 전사지로 구워 입혀요.',
        variants: [{ id: 'rest', label: '백자 수저받침', build: M.ceramicSpoonRest }],
      },
    ],
  },
];


export function findItem(groupId, itemId) {
  const g = CATALOG.find((x) => x.id === groupId) || CATALOG[0];
  return { group: g, item: g.items.find((i) => i.id === itemId) || g.items[0] };
}
