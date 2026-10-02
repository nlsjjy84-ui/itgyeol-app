// 세번째 보물 — 전래놀이를 화면 터치/키보드로 즐기는 미니게임 모음.
// [전면 재설계] 예전에는 5가지 제네릭 엔진(mash/race/rhythm/throw/whip)을 12개 놀이가
// 돌려써서 다 비슷하게 느껴진다는 피드백을 받았다. 그래서 이번에 놀이마다 실제 규칙에
// 맞는 "진짜 다른" 엔진을 새로 짰다. 이제 엔진은 10개 — 완전히 같은 조작으로 느껴지는
// 놀이가 거의 없다.
//   stoneTopple - 세워둔 비석을 조준+파워로 맞혀 휘청이다 쓰러뜨리기. 쓰러진 비석은
//                 전적처럼 쌓인다. (비석치기)
//   pitchPot    - 조준+파워로 쏘되, 진짜 포물선을 그리며 날아가 항아리에 꽂힌다. (투호)
//   jachigi     - 2단계 타이밍: ①탭으로 막대를 공중에 띄우고 ②스윙 타이밍에 맞춰
//                 쳐서 멀리 보낸다. (자치기)
//   ddakjiSlam  - 좌우 조준 없이 세로 힘만으로 내리쳐 충격파를 일으키고, 상대 딱지가
//                 뒤집힌다. (딱지치기)
//   throw       - 조준+파워로 던져 상대 물체를 직접 맞혀 튕겨내기. (구슬치기)
//   rhythmJump  - 줄/고무줄이 도는 박자에 맞춰 정확한 순간에 탭해서 뛰어넘기.
//                 연타가 아니라 타이밍 싸움. (줄넘기·고무줄놀이)
//   kiteFly     - 바람 세기 게이지가 계속 움직이고, "쎈 바람" 구간에서 탭해야 연이
//                 올라간다. 타이밍을 놓치면 오히려 떨어진다. (연날리기)
//   race        - 상대보다 더 빠르게 "번갈아" 눌러 이기기 + 중간중간 "영차!" 긴장 구간.
//                 (줄다리기, 굴렁쇠)
//   rhythm      - 도는 점이 "여기!" 구간을 지날 때 탭하기, 맞힐수록 점점 빨라짐. (상모돌리기)
//   whip        - 빠르게 연타해서 계속 쳐 속도를 유지하기. (팽이치기)
export const PLAY_GAMES = [
  {
    id: 'julneomgi',
    name: '줄넘기',
    tag: '놀이',
    description:
      '두 사람이 줄을 돌리면 그 사이로 들어가 계속 뛰어넘던 놀이입니다. 줄이 발밑을 지나가는 정확한 순간에 탭해서 뛰어넘어보세요. 아무 때나 두드린다고 되는 게 아니에요.',
    mechanic: 'rhythmJump',
    variant: 'rope',
    targetSkips: 14,
    cycleMsStart: 850,
    maxMisses: 4,
    tip: '처음엔 줄 없이 제자리 뛰기부터 연습시키고, "줄"이 아니라 "박자"에 먼저 집중하게 하세요. 하나·둘 소리를 내어 박자를 세어주면 타이밍을 훨씬 빨리 잡습니다.',
  },
  {
    id: 'juldarigi',
    name: '줄다리기',
    tag: '놀이',
    description:
      '두 편으로 나뉘어 굵은 줄을 당기며 힘을 겨루던 놀이입니다. 상대보다 더 빠르게 번갈아 당기세요. 중간중간 "영차!" 구간에서는 특히 집중해서 당겨야 밀리지 않아요.',
    mechanic: 'race',
    meIcon: '🙂',
    oppIcon: '😤',
    durationMs: 8000,
    opponentRate: 4.0,
    burstEnabled: true,
    tip: '다 함께 당길 땐 "영차" 같은 구호를 미리 맞춰야 힘이 한 번에 모입니다. 허리를 다치지 않게 무릎을 살짝 굽히고 당기도록 꼭 알려주세요.',
  },
  {
    id: 'sangmo',
    name: '상모돌리기',
    tag: '풍물',
    description:
      '풍물패 상쇠가 모자 위의 상모를 빙빙 돌리던 기예입니다. 상모가 정수리를 지나는 "여기!" 구간에 맞춰 탭 해서 계속 돌려보세요. 맞힐수록 점점 빨라져요.',
    mechanic: 'rhythm',
    icon: '🧑',
    speedDegPerSec: 130,
    sweetSpotDeg: 20,
    targetHits: 6,
    maxAttempts: 20,
    tip: '처음엔 상모 없이 고개만 작게 돌리는 연습부터 시키세요. 목에 무리가 가지 않도록 절대 한 번에 세게 돌리지 않게 합니다.',
  },
  {
    id: 'guseulchigi',
    name: '구슬치기',
    tag: '놀이',
    description:
      '구슬을 손가락으로 튕겨 상대 구슬을 맞히던, 당구와 비슷한 놀이입니다. 버튼을 누르고 있다가 힘이 초록 구간일 때 손을 떼서 구슬을 맞혀보세요. 맞힐수록 과녁이 좁아지고 빨라져요.',
    mechanic: 'throw',
    icon: '⚪',
    targetIcon: '⚫',
    oscSpeedMs: 900,
    targetMin: 55,
    targetMax: 82,
    rounds: 3,
    tip: '바닥이 평평한 곳에서 해야 구슬이 똑바로 굴러갑니다. 손가락 힘 조절이 서툰 아이는 엄지를 바닥에 고정하고 검지만 튕기게 하면 훨씬 쉬워합니다.',
  },
  {
    id: 'paengi',
    name: '팽이치기',
    tag: '놀이',
    description:
      '채로 팽이를 계속 쳐서 오래 돌아가게 하던 놀이입니다. 치지 않으면 속도가 줄어드니, 빠르게 연타해서 채찍질하며 속도를 유지해보세요.',
    mechanic: 'whip',
    icon: '🌀',
    holdSec: 4,
    limitSec: 16,
    threshold: 55,
    tip: '채로 치는 방향이 팽이의 회전 방향과 같아야 속도가 붙어요. 반대로 치면 오히려 팽이가 멈추니, 처음엔 회전 방향을 손으로 짚어 보여주세요.',
  },
  {
    id: 'jachigi',
    name: '자치기',
    tag: '놀이',
    description:
      '작은 막대("새끼")를 긴 막대로 쳐서 멀리 보내던 놀이입니다. 먼저 탭해서 막대를 공중에 튀어오르게 하고, 그 다음 스윙 타이밍에 딱 맞춰 쳐서 거리를 늘려보세요. 두 번의 타이밍을 모두 맞혀야 해요.',
    mechanic: 'jachigi',
    rounds: 3,
    distanceStart: 55,
    distanceStep: 15,
    tip: '긴 막대를 휘두를 때는 주변과의 거리가 중요합니다. 반드시 한 사람씩 순서대로 하게 하고, 뒤쪽 공간을 충분히 비워두세요.',
  },
  {
    id: 'biseok',
    name: '비석치기',
    tag: '놀이',
    description:
      '작은 돌(비석)을 던지거나 몸에 올려 세워진 상대의 비석을 맞혀 쓰러뜨리던 놀이입니다. 조준과 세기를 모두 맞히면 비석이 휘청이다 완전히 쓰러져요. 쓰러뜨린 비석은 전적처럼 한 줄로 쌓입니다.',
    mechanic: 'stoneTopple',
    stoneIcon: '🪨',
    oscSpeedMs: 780,
    targetMin: 58,
    targetMax: 80,
    rounds: 3,
    tip: '처음엔 가까운 거리부터 시작해서 성공 경험을 먼저 주고, 거리를 조금씩 늘리는 식으로 난이도를 올리면 쉽게 포기하지 않습니다.',
  },
  {
    id: 'tuho',
    name: '투호',
    tag: '궁중놀이',
    description:
      '화살을 던져 항아리 안에 넣던 궁중·양반가의 놀이입니다. 조준하고 세기를 맞춰 손을 떼면 화살이 진짜 포물선을 그리며 날아가요. 항아리 입구에 정확히 떨어뜨려보세요.',
    mechanic: 'pitchPot',
    arrowIcon: '🏹',
    jarIcon: '🏺',
    oscSpeedMs: 760,
    targetMin: 60,
    targetMax: 84,
    rounds: 3,
    tip: '항아리를 처음부터 멀리 두면 금방 흥미를 잃습니다. 가까이서 몇 번 넣어본 다음 거리를 늘리는 순서로 지도하면 훨씬 오래 집중합니다.',
  },
  {
    id: 'ddakji',
    name: '딱지치기',
    tag: '놀이',
    description:
      '자신의 딱지로 바닥에 놓인 상대 딱지를 내리쳐서 뒤집으면 가져가던 놀이입니다. 조준은 필요 없어요 — 세로로 힘을 모았다가 알맞은 세기로 내리쳐 충격파로 뒤집어보세요.',
    mechanic: 'ddakjiSlam',
    myIcon: '🟦',
    oppIcon: '🟧',
    oscSpeedMs: 820,
    targetMin: 58,
    targetMax: 80,
    rounds: 3,
    tip: '바람을 일으키려면 딱지 전체가 동시에 바닥에 닿아야 해요. 비스듬히 치면 바람이 새니, 수직으로 "내리찍는" 느낌을 강조해서 알려주세요.',
  },
  {
    id: 'gomugojul',
    name: '고무줄놀이',
    tag: '놀이',
    description:
      '고무줄의 높이를 넘나들며 노래에 맞춰 뛰던 놀이입니다. 고무줄이 발밑을 지나는 순간에 맞춰 탭해서 뛰어넘어보세요. 성공할수록 고무줄 높이가 발목→무릎→허리→가슴까지 올라가요.',
    mechanic: 'rhythmJump',
    variant: 'band',
    targetSkips: 16,
    cycleMsStart: 900,
    maxMisses: 4,
    tip: '높이가 올라갈수록 무릎을 많이 써야 합니다. 발목 단계에서 박자를 충분히 익힌 다음에 높이를 올려야 다치지 않아요.',
  },
  {
    id: 'yeonnaligi',
    name: '연날리기',
    tag: '놀이',
    description:
      '얼레를 감아 연을 하늘 높이 띄우던 놀이입니다. 바람 게이지가 계속 움직이는데, "쎈 바람" 구간일 때만 얼레를 감아야 연이 올라가요. 타이밍을 놓치면 오히려 연이 떨어집니다.',
    mechanic: 'kiteFly',
    targetHeight: 100,
    durationMs: 10000,
    gustMin: 60,
    gustMax: 85,
    tip: '바람을 등지고 서야 연이 뜹니다. 바람을 마주 보고 날리면 아무리 얼레를 감아도 연이 오르지 않으니, 방향부터 확인시켜 주세요.',
  },
  {
    id: 'gullyeongsoe',
    name: '굴렁쇠',
    tag: '놀이',
    description:
      '굴렁쇠를 막대로 치며 쓰러지지 않게 굴리던 놀이입니다. 상대보다 더 빠르게 쳐서 굴렁쇠를 계속 굴려보세요. 중간중간 "영차!" 구간에서는 특히 집중해야 밀리지 않아요.',
    mechanic: 'race',
    meIcon: '🛞',
    oppIcon: '⭕',
    durationMs: 7500,
    opponentRate: 3.4,
    burstEnabled: true,
    tip: '굴렁쇠는 너무 세게 치면 방향을 잃습니다. 작게, 자주 쳐서 균형을 잡는 게 핵심이라고 알려주세요.',
  },
];

// [기능화 2] 난이도 체계 — "성인 아마추어반 / 초중고 레슨반"처럼 실제 수업에서 쓰던
// 두 단계 구분을 앱의 난이도 선택 구조로 그대로 가져온다. 아동반은 라운드·목표치를
// 줄이고 판정 구간을 넓혀 성공 경험을 먼저 주고, 성인반은 설계된 기본값(위 PLAY_GAMES)
// 그대로 간다 — 즉 성인반이 "표준", 아동반이 "완화판"이다.
export const DIFFICULTY_TIERS = ['아동반', '성인반'];

function widenBand(min, max, growPct) {
  const grow = (max - min) * growPct;
  return { min: Math.max(0, min - grow), max: Math.min(100, max + grow) };
}

export function scaleGameForTier(game, tier) {
  if (tier !== '아동반') return game;
  const g = { ...game };
  switch (g.mechanic) {
    case 'throw':
    case 'stoneTopple':
    case 'pitchPot':
    case 'ddakjiSlam': {
      const { min, max } = widenBand(g.targetMin, g.targetMax, 0.35);
      g.targetMin = min;
      g.targetMax = max;
      g.oscSpeedMs = Math.round(g.oscSpeedMs * 1.3);
      g.rounds = Math.max(1, g.rounds - 1);
      break;
    }
    case 'jachigi':
      g.distanceStep = Math.round(g.distanceStep * 0.7);
      g.rounds = Math.max(1, g.rounds - 1);
      break;
    case 'rhythmJump':
      g.targetSkips = Math.max(6, Math.round(g.targetSkips * 0.6));
      g.cycleMsStart = Math.round(g.cycleMsStart * 1.2);
      g.maxMisses = g.maxMisses + 2;
      break;
    case 'kiteFly':
      g.targetHeight = Math.round(g.targetHeight * 0.75);
      g.durationMs = Math.round(g.durationMs * 1.25);
      g.gustMin = Math.max(0, g.gustMin - 12);
      g.gustMax = Math.min(100, g.gustMax + 8);
      break;
    case 'race':
      g.opponentRate = +(g.opponentRate * 0.78).toFixed(2);
      g.burstEnabled = false;
      break;
    case 'rhythm':
      g.targetHits = Math.max(3, g.targetHits - 2);
      g.maxAttempts = g.maxAttempts + 8;
      g.sweetSpotDeg = Math.round(g.sweetSpotDeg * 1.5);
      break;
    case 'whip':
      g.threshold = Math.max(30, g.threshold - 15);
      g.limitSec = g.limitSec + 6;
      break;
    default:
      break;
  }
  return g;
}

// [기능화 3 — 지능형 난이도] 같은 성인반/아동반 안에서도 사람마다 실력이 다르다.
// JourneyContext가 기기에 저장해 둔 숙련도 점수(-3 ~ +3, 이 놀이를 평소 얼마나
// 잘하는지)를 받아, 그 사람만의 시작 난이도로 다시 한 번 조정한다. 라운드가
// 진행되며 점점 어려워지는 기존 구조는 그대로 두고, "시작하는 지점"만 사람마다
// 다르게 — 잘하는 사람은 처음부터 좀 더 빡빡하게, 아직 서툰 사람은 좀 더
// 여유 있게 시작한다. rating이 0이면(기록이 없거나 보통이면) 원래 값 그대로.
export function applySkillAdjustment(game, rating = 0) {
  if (!rating) return game;
  const g = { ...game };
  const r = Math.max(-3, Math.min(3, rating));
  const speedMul = 1 - r * 0.045; // 잘할수록(+) 더 빠르게(값은 작게), 서툴수록(-) 더 느리게
  const bandMul = 1 - r * 0.07; // 잘할수록 판정 구간이 좁게
  switch (g.mechanic) {
    case 'throw':
    case 'stoneTopple':
    case 'pitchPot':
    case 'ddakjiSlam': {
      const { min, max } = widenBand(g.targetMin, g.targetMax, -r * 0.07);
      g.targetMin = min;
      g.targetMax = max;
      g.oscSpeedMs = Math.max(320, Math.round(g.oscSpeedMs * speedMul));
      break;
    }
    case 'jachigi':
      g.popPeriodMs = Math.max(500, Math.round((g.popPeriodMs || 900) * speedMul));
      g.swingZoneWidth = Math.max(10, Math.round((g.swingZoneWidth || 20) * bandMul));
      break;
    case 'rhythmJump':
      g.cycleMsStart = Math.max(500, Math.round(g.cycleMsStart * speedMul));
      break;
    case 'kiteFly':
      g.gustMin = Math.max(0, Math.min(100, g.gustMin + r * 2));
      g.gustMax = Math.max(0, Math.min(100, g.gustMax - r * 2));
      break;
    case 'race':
      g.opponentRate = +(g.opponentRate * (1 + r * 0.06)).toFixed(2);
      break;
    case 'rhythm':
      g.sweetSpotDeg = Math.max(8, Math.round(g.sweetSpotDeg * bandMul));
      g.speedDegPerSec = Math.round(g.speedDegPerSec * (1 + r * 0.05));
      break;
    case 'whip':
      g.threshold = Math.max(20, Math.min(90, g.threshold + r * 4));
      break;
    default:
      break;
  }
  return g;
}

// 숙련도 점수를 사람이 읽는 말로 — 화면에 "지금 왜 이 난이도인지"를 숨기지 않고 보여준다.
export function skillLabel(rating = 0) {
  if (rating >= 2) return '많이 능숙함 · 더 빡빡하게 시작';
  if (rating >= 1) return '능숙한 편 · 살짝 빡빡하게 시작';
  if (rating <= -2) return '아직 익히는 중 · 더 여유있게 시작';
  if (rating <= -1) return '아직 익히는 중 · 살짝 여유있게 시작';
  return '기록 쌓는 중 · 기본값으로 시작';
}
