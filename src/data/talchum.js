import { t as i18nT } from '../i18n';
import { buildChart } from '../utils/talchumLogic';
// 탈춤 판 — 장단에 맞춰 춤사위를 춘다.
// 근거: 봉산탈춤은 피리·젓대·해금·북·장구의 삼현육각 반주에 염불·타령·굿거리 장단으로 추고,
// 기본 춤사위는 장삼 소매를 휘어잡고 뿌리거나 한삼을 휘두르며 두 팔을 빠르게 굽혔다 폈다 하는 깨끼춤이다
// (한국민족문화대백과사전 「봉산탈춤」, 위키백과 「봉산탈춤」).
// 굿거리·타령장단은 모두 한 장단을 큰 박 네 개로 센다 — 화면의 동그라미 네 개가 그 큰 박이다.
// 단계가 오를수록 장단이 빨라진다(굿거리 → 타령 → 잦은타령). 판은 짧게(한 단계 15초 안팎).
// 놀이 방식: 위에서 춤사위 카드가 내려오고, 카드가 장단 선에 닿는 박에 그 줄을 톡 누른다(누구나 아는 쉬운 리듬 놀이).
// 누를 때마다 탈꾼이 그 춤사위로 춤춘다.
export const TALCHUM_STAGES = [
  {
    id: 'tc1', name: '1단계 · 굿거리', tag: '느리게', jangdan: '굿거리장단', beatMs: 900, cycles: 3, level: 'easy', lanes: ['left', 'right'], bars: ['L.R.', 'L.R.', 'L.RL'],
    tip: '굿거리장단은 한 장단을 큰 박 넷으로 세요. 첫 박(덩)에 북이 크게 울리니, 그 소리에 맞춰 한삼을 뿌려 봐요.',
  },
  {
    id: 'tc2', name: '2단계 · 타령', tag: '보통', jangdan: '타령장단', beatMs: 700, cycles: 4, level: 'easy', lanes: ['left', 'right'], bars: ['L.R.', 'LR..', 'R.L.', 'LRLR'],
    tip: '탈춤에서 가장 많이 쓰는 장단이 타령이에요. 왼쪽·오른쪽 한삼을 번갈아 뿌리면 춤사위가 살아나요.',
  },
  {
    id: 'tc3', name: '3단계 · 잦은타령', tag: '빠르게', jangdan: '잦은타령', beatMs: 540, cycles: 4, level: 'hard', lanes: ['left', 'kkaekki', 'right'], bars: ['L.R.', 'K.K.', 'LRK.', 'LRKT'],
    tip: '빠른 장단에서는 두 팔을 굽혔다 펴는 깨끼춤이 제격이에요. 박을 놓쳐도 다음 박에서 다시 들어가면 돼요.',
  },
].map((st) => {
  // 춤 보: 마디마다 네 박(L 왼 한삼 · R 오른 한삼 · K 깨끼 · T 뛰어 돌기 · . 쉼). 카드의 60%를 맞히면 성공
  const chart = buildChart(st.bars);
  return { ...st, chart, pass: Math.ceil(chart.length * 0.6) };
});

// 춤사위 네 가지 — 이름은 동작을 풀어 쓴 것(특정 사위 이름을 지어 붙이지 않음)
export const MOVES = [
  { id: 'left', name: '왼 한삼 뿌리기', key: 'a' },
  { id: 'right', name: '오른 한삼 뿌리기', key: 'd' },
  { id: 'kkaekki', name: '깨끼 (두 팔 굽혔다 펴기)', key: 's' },
  { id: 'turn', name: '뛰어 돌기', key: 'w' },
];

export function talchumMission(stage) {
  return {
    demo: { kind: 'lanes' },
    kicker: i18nT('탈춤 · 장단과 춤사위'),
    title: i18nT('탈춤'),
    story: i18nT('봉산탈춤은 삼현육각 반주에 타령·굿거리 장단으로 추고, 한삼을 휘두르며 두 팔을 빠르게 굽혔다 펴는 깨끼춤이 기본이에요. 장단의 큰 박에 맞춰 춤사위를 넣어 봐요.'),
    mission: i18nT('내려오는 춤사위 카드를 장단 선에서 톡! {p0}장 가운데 {p1}장을 맞혀 보자 🎭', { p0: stage.chart.length, p1: stage.pass }),
    steps: [
      i18nT('처음 한 장단은 장단을 듣는 시간이에요. 북이 네 번 울린 뒤 카드가 내려와요.'),
      i18nT('카드가 아래 장단 선에 닿는 순간, 그 카드가 있는 줄을 톡 눌러요. 딱 맞으면 "얼씨구!"'),
      i18nT('{p0}장 가운데 {p1}장을 맞히면 성공이에요. 누를 때마다 탈꾼이 그 춤사위로 춤춰요.', { p0: stage.chart.length, p1: stage.pass }),
    ],
  };
}
