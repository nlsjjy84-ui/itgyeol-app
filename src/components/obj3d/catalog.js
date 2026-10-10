import * as A from './models_a';
import * as B from './models_b';
import * as C from './models_c';
import * as D from './models_d';
import * as E from './models_e';
import * as F from './models_f';
import * as G from './models_g';

// 결과물 카탈로그 — 어떤 물건에 조각보를 입힐 수 있는지.
// group: 키링(전통 소품) · 브로치 · 마그넷 · 스티커 · 우리나라 보물
// 설명은 "그 물건이 실제로 어떤 것인지"를 짧게 알려 준다.

export const CATALOG = [
  {
    id: 'keyring',
    label: '키링',
    hook: true,
    intro: '전통 소품에 키링 고리를 달아 가져가요. 물건마다 모양이 여러 가지예요.',
    items: [
      {
        id: 'norigae',
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
        id: 'binyeo',
        label: '비녀',
        about: '쪽 찐 머리를 고정하는 장신구예요. 머리 장식 모양에 따라 이름이 달라요.',
        variants: [
          { id: 'round', label: '원두잠', build: A.binyeoRound, note: '머리가 둥근 판 모양' },
          { id: 'lotus', label: '연봉잠', build: A.binyeoLotus, note: '연꽃봉오리 모양 머리' },
          { id: 'bamboo', label: '죽절잠', build: A.binyeoBamboo, note: '대나무 마디를 본뜬 몸통' },
          { id: 'dragon', label: '용잠', build: G.binyeoDragon, note: '머리에 용을 새긴 비녀. 용은 임금과 힘을 뜻해요' },
        ],
      },
      {
        id: 'ring',
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
        label: '거울',
        about: '고려 때는 청동으로 만든 동경을 썼어요. 뒷면에 무늬를 넣는 것이 특징이에요.',
        variants: [
          { id: 'hand', label: '손거울', build: A.mirrorHand },
          { id: 'bronze', label: '동경(청동거울)', build: A.mirrorBronze },
          { id: 'frame', label: '틀 거울', build: A.mirrorFrame },
        ],
      },
      {
        id: 'brush',
        label: '붓',
        about: '글씨와 그림에 쓰는 도구예요. 붓·먹·종이·벼루를 문방사우라고 불러요.',
        variants: [
          { id: 'large', label: '대필', build: B.brushLarge },
          { id: 'stand', label: '필가(붓걸이)', build: B.brushStand },
          { id: 'pot', label: '필통', build: B.brushPot },
        ],
      },
      {
        id: 'ink',
        label: '먹',
        about: '그을음을 아교로 굳힌 글씨용 먹이에요. 물을 넣고 벼루에 갈아 써요.',
        variants: [
          { id: 'bar', label: '막대 먹', build: B.inkBar },
          { id: 'round', label: '둥근 먹', build: B.inkRound },
          { id: 'half', label: '반달 먹', build: B.inkHalf },
        ],
      },
      {
        id: 'fan',
        label: '부채',
        about: '더위를 식히고 멋을 내는 도구예요. 접는 것, 둥근 것, 잎 모양이 따로 있어요.',
        variants: [
          { id: 'folding', label: '접부채', build: B.fanFolding },
          { id: 'round', label: '둥근부채', build: B.fanRound },
          { id: 'leaf', label: '파초선', build: B.fanLeaf, note: '파초 잎 모양 부채' },
        ],
      },
      {
        id: 'lock',
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
        label: '조각 주사위',
        about: '조각보의 조각을 여섯 면에 나눠 붙인 정육면체예요. 조각이 모여 입체가 된다는 뜻을 담았어요.',
        variants: [{ id: 'cube', label: '정육면체', build: C.cubeDice }],
      },
    ],
  },
  {
    id: 'brooch',
    label: '브로치',
    intro: '옷에 꽂는 브로치예요. 뒷면에는 핀이 달려 있어요.',
    items: [
      {
        id: 'brooch',
        label: '브로치',
        about: '앞은 조각보, 뒤는 놋쇠 판과 핀이에요.',
        variants: [
          { id: 'round', label: '원형', build: E.broochRound },
          { id: 'square', label: '네모', build: E.broochSquare },
          { id: 'flower', label: '꽃 모양', build: E.broochFlower },
          { id: 'ttuljam', label: '떨잠', build: G.broochTtuljam, note: '움직일 때 떨리는 머리 장식. 금판에 보석을 박아요' },
        ],
      },
    ],
  },
  {
    id: 'magnet',
    label: '마그넷',
    intro: '냉장고에 붙이는 마그넷이에요. 투명한 면으로 덮여 있고 뒷면은 자석이에요.',
    items: [
      {
        id: 'magnet',
        label: '마그넷',
        about: '조각보 위를 투명하게 덮고, 뒤에 자석을 붙여요.',
        variants: [
          { id: 'round', label: '원형', build: E.magnetRound },
          { id: 'square', label: '네모', build: E.magnetSquare },
          { id: 'octagon', label: '팔각', build: E.magnetOctagon },
        ],
      },
    ],
  },
  {
    id: 'sticker',
    label: '스티커',
    intro: '붙여서 쓰는 스티커예요. 모양대로 오려 흰 테두리를 둘렀어요.',
    items: [
      {
        id: 'sticker',
        label: '스티커',
        about: '얇은 종이 위에 조각보를 인쇄하고 모양대로 잘라요.',
        variants: [
          { id: 'round', label: '원형', build: E.stickerRound },
          { id: 'square', label: '네모', build: E.stickerSquare },
          { id: 'gourd', label: '호리병', build: E.stickerGourd },
        ],
      },
    ],
  },
  {
    id: 'treasure',
    label: '우리나라 보물',
    intro: '조각보는 본래 물건을 싸는 보자기예요. 그래서 그릇과 가구를 감싸거나 덮는 모양으로도 어울려요.',
    items: [
      {
        id: 'moonjar',
        label: '달항아리',
        about: '조선 시대 백자 큰 항아리예요. 둥근 보름달을 닮아 달항아리라고 불러요.',
        variants: [{ id: 'jar', label: '백자 달항아리', build: D.treasureMoonJar }],
      },
      {
        id: 'maebyeong',
        label: '매병',
        about: '어깨가 넓고 허리가 가는 병이에요. 고려청자에서 많이 볼 수 있어요.',
        variants: [{ id: 'vase', label: '청자 매병', build: D.treasureMaebyeong }],
      },
      {
        id: 'bandaji',
        label: '반닫이',
        about: '앞면이 아래위로 열리는 전통 궤예요. 놋쇠 장식이 달려요.',
        variants: [{ id: 'chest', label: '반닫이', build: D.treasureBandaji }],
      },
      {
        id: 'bottari',
        label: '보따리',
        about: '보자기로 물건을 싸서 네 귀를 묶은 모양이에요. 조각보의 본래 쓰임이에요.',
        variants: [{ id: 'bundle', label: '조각보 보따리', build: D.treasureBottari }],
      },
      {
        id: 'gat',
        label: '갓',
        about: '조선 시대 남자 어른이 쓰던 모자예요. 말총으로 엮어 검게 칠했어요.',
        variants: [{ id: 'gat', label: '갓', build: D.treasureGat }],
      },
      {
        id: 'soban',
        label: '소반',
        about: '한 사람 몫의 음식을 올리는 작은 상이에요. 상판에 조각보를 깔았어요.',
        variants: [{ id: 'soban', label: '둥근 소반', build: D.treasureSoban }],
      },
      {
        id: 'bell',
        label: '범종',
        about: '절에서 시간을 알리고 마음을 가다듬을 때 치는 큰 종이에요. 윗부분의 용 모양 고리를 용뉴라고 해요.',
        variants: [{ id: 'bell', label: '청동 범종', build: F.treasureBell }],
      },
      {
        id: 'crown',
        label: '금관',
        about: '신라 임금의 무덤에서 나온 금관이에요. 나무와 사슴뿔을 본뜬 장식에 곡옥과 금 달개가 달려 있어요.',
        variants: [{ id: 'crown', label: '신라 금관', build: F.treasureCrown }],
      },
      {
        id: 'pagoda',
        label: '석탑',
        about: '부처님의 가르침을 기리며 돌로 쌓은 탑이에요. 기단 위에 몸돌과 지붕돌을 번갈아 쌓아요.',
        variants: [{ id: 'pagoda', label: '삼층석탑', build: F.treasurePagoda }],
      },
      {
        id: 'hanok',
        label: '한옥',
        about: '기와 지붕에 나무 기둥과 한지 문을 단 우리나라 전통 집이에요. 처마 끝이 살짝 들려 있어요.',
        variants: [{ id: 'hanok', label: '기와집', build: F.treasureHanok }],
      },
      {
        id: 'onggi',
        label: '장독',
        about: '간장·된장·김치를 담던 옹기 항아리예요. 숨을 쉬는 흙그릇이라 음식이 잘 익어요.',
        variants: [{ id: 'onggi', label: '옹기 장독', build: F.treasureOnggi }],
      },
      {
        id: 'kite',
        label: '방패연',
        about: '한지에 대나무 살을 붙여 만든 연이에요. 가운데 둥근 방구멍이 바람을 모아 줘요.',
        variants: [{ id: 'kite', label: '방패연', build: F.treasureKite }],
      },
    ],
  },
];


export function findItem(groupId, itemId) {
  const g = CATALOG.find((x) => x.id === groupId) || CATALOG[0];
  return { group: g, item: g.items.find((i) => i.id === itemId) || g.items[0] };
}
