import { t as i18nT } from '../i18n';
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
    tag: '박자',
    description:
      '두 사람이 줄을 돌리면 그 사이로 들어가 계속 뛰어넘던 놀이입니다. 줄이 발밑을 지나가는 순간에 맞춰 탭해서 뛰어넘어보세요. 줄은 점점 빨라져요.',
    mechanic: 'rhythmJump',
    variant: 'rope',
    targetSkips: 6,
    cycleMsStart: 1150,
    maxMisses: 5,
    tip: '처음엔 줄 없이 제자리 뛰기부터 연습시키고, "줄"이 아니라 "박자"에 먼저 집중하게 하세요. 하나·둘 소리를 내어 박자를 세어주면 타이밍을 훨씬 빨리 잡습니다.',
  },
  {
    id: 'juldarigi',
    name: '줄다리기',
    tag: '힘겨루기',
    description:
      '두 편으로 나뉘어 굵은 줄을 당기며 힘을 겨루던 놀이입니다. 왼쪽·오른쪽을 번갈아 눌러 상대보다 줄을 더 당기세요. 상대도 만만치 않고, 중간에 "영차!"가 뜨면 바로 눌러야 해요.',
    mechanic: 'race',
    meIcon: '🙂',
    oppIcon: '😤',
    durationMs: 6000,
    opponentRate: 4.3,
    burstEnabled: true,
    tip: '다 함께 당길 땐 "영차" 같은 구호를 미리 맞춰야 힘이 한 번에 모입니다. 허리를 다치지 않게 무릎을 살짝 굽히고 당기도록 꼭 알려주세요.',
  },
  {
    id: 'sangmo',
    name: '상모돌리기',
    tag: '풍물',
    description:
      '풍물패 상쇠가 모자 위의 상모를 빙빙 돌리던 기예입니다. 화면의 동그라미를 따라 손가락으로 원을 그리며, 빛나는 점을 가까이 따라가면 상모가 돌아요.',
    mechanic: 'sangmoCircle',
    limitSec: 12,
    speedDeg: 75,
    tolerance: 46,
    tip: '처음엔 상모 없이 고개만 작게 돌리는 연습부터 시키세요. 목에 무리가 가지 않도록 절대 한 번에 세게 돌리지 않게 합니다.',
  },
  {
    id: 'guseulchigi',
    name: '구슬치기',
    tag: '손맛',
    description:
      '구슬을 손가락으로 튕겨 동그라미 안의 구슬을 밖으로 내보내던 놀이입니다. 내 구슬을 뒤로 끌었다 놓으면 튕겨 나가고, 구슬끼리 부딪히며 굴러가요.',
    mechanic: 'marbleSling',
    targets: 2,
    shots: 6,
    tip: '바닥이 평평한 곳에서 해야 구슬이 똑바로 굴러갑니다. 손가락 힘 조절이 서툰 아이는 엄지를 바닥에 고정하고 검지만 튕기게 하면 훨씬 쉬워합니다.',
  },
  {
    id: 'paengi',
    name: '팽이치기',
    tag: '균형',
    description:
      '채로 팽이를 쳐서 쓰러지지 않게 돌리던 놀이입니다. 팽이가 여기저기 돌아다녀요 — 팽이를 콕 눌러 채로 쳐서 힘을 보태 주세요. 힘이 빠지거나 선 밖으로 나가면 쓰러져요.',
    mechanic: 'topChase',
    targetHits: 7,
    lives: 3,
    drift: 0.34,
    tip: '채로 치는 방향이 팽이의 회전 방향과 같아야 속도가 붙어요. 반대로 치면 오히려 팽이가 멈추니, 처음엔 회전 방향을 손으로 짚어 보여주세요.',
  },
  {
    id: 'jachigi',
    name: '자치기',
    tag: '튀겨 치기',
    description:
      '구멍 위에 걸쳐 놓은 짧은 알을 긴 자로 튀겨 올린 뒤, 공중에서 쳐서 멀리 보내던 놀이입니다. 날아간 거리를 긴 자로 재어 점수를 매기고, 수비가 알을 받으면 그 점수는 없어져요.',
    mechanic: 'jachigiSwipe',
    targetHits: 5,
    maxMiss: 3,
    windowMs: 1500,
    tip: '처음엔 알을 손으로 던져 올려 치는 단계부터 시작하고, 익숙해지면 구멍 위의 알을 튀겨 올려 치게 하세요. 거리는 긴 자로 직접 재어 보게 하면 수 세기 공부도 됩니다. 긴 막대를 휘두를 때는 주변과의 거리가 중요합니다. 반드시 한 사람씩 순서대로 하게 하고, 뒤쪽 공간을 충분히 비워두세요.',
  },
  {
    id: 'biseok',
    name: '비석치기',
    tag: '던지기',
    description:
      '작은 돌(비석)을 던져 세워 둔 상대의 비석을 쓰러뜨리던 놀이입니다. 내 돌을 눌러 위쪽으로 쓸어 올리며 놓으면 던져져요. 점선 끝이 돌이 떨어질 자리예요.',
    mechanic: 'stoneFlick',
    stones: 2,
    throws: 6,
    tip: '처음엔 가까운 거리부터 시작해서 성공 경험을 먼저 주고, 거리를 조금씩 늘리는 식으로 난이도를 올리면 쉽게 포기하지 않습니다.',
  },
  {
    id: 'tuho',
    name: '투호',
    tag: '궁중놀이',
    description:
      '화살을 던져 항아리 안에 넣던 궁중·양반가의 놀이입니다. 각도와 힘 두 줄을 직접 맞춘 뒤 던지세요. 항아리는 던질 때마다 다른 거리에 놓여요.',
    mechanic: 'tuhoDial',
    arrows: 5,
    need: 2,
    zoneDeg: 11,
    tip: '항아리를 처음부터 멀리 두면 금방 흥미를 잃습니다. 가까이서 몇 번 넣어본 다음 거리를 늘리는 순서로 지도하면 훨씬 오래 집중합니다.',
  },
  {
    id: 'ddakji',
    name: '딱지치기',
    tag: '넘겨먹기',
    description:
      '바닥에 놓인 상대 딱지를 내 딱지로 내리쳐 뒤집으면 따는 놀이(넘겨먹기)입니다. 높이 들어 칠수록 세지만 손이 흔들려 덜 정확해요. 한가운데보다 가장자리를 쳐야 잘 넘어가요.',
    mechanic: 'ddakjiFan',
    doubleSided: false,
    rounds: 2,
    timeSec: 9,
    tip: '높이 칠수록 세지만 정확도가 떨어져요. 처음엔 낮게 정확히 맞히는 감부터 익히고, 익숙해지면 상대 딱지의 가장자리를 노려 세게 치게 하세요. 단면딱지는 한 번, 양면딱지는 두 번 넘겨야 따요. 발을 상대 딱지 옆에 대고 치는 「발 대고 치기」도 함께 알려 주면 좋아요.',
  },
  {
    id: 'gomugojul',
    name: '고무줄놀이',
    tag: '기억',
    description:
      '고무줄을 넘으며 노래에 맞춰 발 모양을 바꾸던 놀이입니다. 불이 켜지는 순서대로 발 모양을 기억했다가 똑같이 따라 해 보세요. 노래가 점점 길어져요.',
    mechanic: 'gomuPattern',
    rounds: 3,
    startLen: 3,
    maxMistakes: 3,
    tip: '높이가 올라갈수록 무릎을 많이 써야 합니다. 발목 단계에서 박자를 충분히 익힌 다음에 높이를 올려야 다치지 않아요.',
  },
  {
    id: 'yeonnaligi',
    name: '연날리기',
    tag: '조종',
    description:
      '연을 바람에 태워 하늘 높이 띄우던 놀이입니다. 손가락으로 연을 좌우로 움직여 푸른 바람 길 안으로 들어가면 연이 올라가요. 바람 길은 계속 움직여요.',
    mechanic: 'kiteSteer',
    limitSec: 25,
    tip: '바람을 등지고 서야 연이 뜹니다. 바람을 마주 보고 날리면 아무리 얼레를 감아도 연이 오르지 않으니, 방향부터 확인시켜 주세요.',
  },
  {
    id: 'gullyeongsoe',
    name: '굴렁쇠',
    tag: '속도',
    description:
      '굴렁쇠를 막대로 밀며 달리던 놀이입니다. 화면을 꾹 누르면 빨라지고 떼면 느려져요. 오르내리는 초록 칸 안에 속도를 맞추면 굴렁쇠가 쓰러지지 않고 굴러가요.',
    mechanic: 'hoopSpeed',
    targetSec: 8,
    lives: 3,
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
      g.targetSkips = Math.max(4, Math.round(g.targetSkips * 0.7));
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
    case 'sangmoCircle':
      g.tolerance = Math.round(g.tolerance * 1.3);
      g.speedDeg = Math.round(g.speedDeg * 0.8);
      g.limitSec += 8;
      break;
    case 'marbleSling':
      g.shots += 2;
      g.targets = 1;
      break;
    case 'topWhip':
      g.lives += 1;
      g.targetHits = 8;
      g.drift = +(g.drift * 0.75).toFixed(2);
      break;
    case 'topChase':
      g.targetHits = 5;
      g.lives += 1;
      g.drift = +(g.drift * 0.75).toFixed(2);
      break;
    case 'jachigiSwipe':
      g.targetHits = 4;
      g.maxMiss += 2;
      g.windowMs = Math.round(g.windowMs * 1.3);
      break;
    case 'tuhoDial':
      g.zoneDeg = Math.round(g.zoneDeg * 1.5);
      g.need = 2;
      g.arrows += 2;
      break;
    case 'ddakjiFan':
      g.rounds = 1;
      g.timeSec += 4;
      g.doubleSided = false;
      break;
    case 'stoneFlick':
      g.throws += 2;
      g.stones = 1;
      break;
    case 'tuhoSwing':
      g.periodSec = +(g.periodSec * 1.3).toFixed(2);
      g.zoneDeg = Math.round(g.zoneDeg * 1.4);
      g.need = 2;
      break;
    case 'gomuPattern':
      g.startLen = 2;
      g.rounds = 2;
      g.maxMistakes += 2;
      break;
    case 'kiteSteer':
      g.limitSec += 10;
      break;
    case 'hoopSpeed':
      g.lives += 2;
      g.targetSec = 6;
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
    case 'sangmoCircle':
      g.speedDeg = Math.round(g.speedDeg * (1 + r * 0.05));
      g.tolerance = Math.max(30, Math.round(g.tolerance * bandMul));
      break;
    case 'topWhip':
    case 'topChase':
      g.drift = +(g.drift * (1 + r * 0.06)).toFixed(2);
      break;
    case 'tuhoSwing':
      g.periodSec = +Math.max(1.6, g.periodSec * speedMul).toFixed(2);
      g.zoneDeg = Math.max(7, Math.round(g.zoneDeg * bandMul));
      break;
    case 'tuhoDial':
      g.zoneDeg = Math.max(7, Math.round(g.zoneDeg * bandMul));
      break;
    case 'jachigiSwipe':
      g.windowMs = Math.max(900, Math.round(g.windowMs * speedMul));
      break;
    default:
      break;
  }
  return g;
}

// 숙련도 점수를 사람이 읽는 말로 — 화면에 "지금 왜 이 난이도인지"를 숨기지 않고 보여준다.
export function skillLabel(rating = 0) {
  if (rating >= 2) return i18nT('많이 능숙함 · 더 빡빡하게 시작');
  if (rating >= 1) return i18nT('능숙한 편 · 살짝 빡빡하게 시작');
  if (rating <= -2) return i18nT('아직 익히는 중 · 더 여유있게 시작');
  if (rating <= -1) return i18nT('아직 익히는 중 · 살짝 여유있게 시작');
  return i18nT('기록 쌓는 중 · 기본값으로 시작');
}
