import { FORMATIONS, ohangByKey } from '../data/formations';
import { PRINTING_TYPES } from '../data/printing';
import { PLAY_GAMES } from '../data/playGames';
import { HANGUL_STAGES } from '../data/hangulGames';
import { TALCHUM_STAGES } from '../data/talchum';
import { DANCHEONG_STAGES } from '../data/dancheong';
import { SCENE_TARGET, LEVEL_NAME, nextHint } from './progress';
import { t as tr } from '../i18n';

// 왜 이런 결과물이 나왔는지 — 조각보를 그릴 때 실제로 쓴 값만 그대로 풀어서 말한다.
// (그리지 않은 값을 그럴듯하게 지어내서 설명하지 않는다.)

const SPEED = { fast: '빠르게', mid: '보통 속도로', slow: '차분하게' };
const FILL_NAME = ['청색', '적색', '황색', '녹색'];

export function tiltOf(seed) {
  return ((((seed >>> 3) % 7) + 7) % 7) - 3;
}

export function fillerColorIndex(seed, i) {
  return (((seed >>> (i * 5)) % 4) + 4) % 4;
}

export function sceneProblemName(attempt) {
  if (!attempt) return '';
  if (attempt.sceneId === 'jinbeop') {
    const f = FORMATIONS.find((q) => q.id === attempt.formationId);
    return tr(f ? f.name : '진법');
  }
  if (attempt.sceneId === 'print') {
    const t = PRINTING_TYPES.find((q) => q.id === attempt.formationId);
    return tr(t ? t.name : '훈민정음·인쇄');
  }
  if (attempt.sceneId === 'talchum') {
    const h = TALCHUM_STAGES.find((q) => q.id === attempt.formationId);
    return h ? `${tr('탈춤')} ${tr(h.name)}` : tr('탈춤');
  }
  if (attempt.sceneId === 'dancheong') {
    const h = DANCHEONG_STAGES.find((q) => q.id === attempt.formationId);
    return h ? `${tr('단청')} ${tr(h.name)}` : tr('단청');
  }
  if (attempt.sceneId === 'hangul') {
    const h = HANGUL_STAGES.find((q) => q.id === attempt.formationId);
    return h ? `${tr('한글 테트리스')} ${tr(h.name)}` : tr('한글 테트리스');
  }
  const g = PLAY_GAMES.find((q) => q.id === attempt.formationId);
  return g ? g.name : tr('전래놀이');
}

const LEVEL_LOOK = [
  '',
  '바탕 천에 새김만 있는 모습이에요.',
  '가장자리에 실땀이 놓이고 모서리에 붉은 십자수가 더해졌어요.',
  '실땀과 십자수 위에 금실 이중 테두리와 금 징이 더해졌어요.',
];
const SHAPE_TEXT = {
  jinbeop: '푼 진의 사람 자리가 점으로 찍히고, 점을 이어 그 진의 모양이 조각에 남아요.',
  print: '직접 맞춘 글자가 붉은 낙관(도장)으로 새겨져요.',
  tbd: '푼 놀이와 짝지은 전통 문양이 둥글게 수놓여요(줄다리기는 덩굴무늬, 팽이치기는 소용돌이무늬).',
  hangul: '클리어한 단계를 뜻하는 한글 자모가 블록 네 칸 위에 새겨져요.',
  talchum: '왼쪽·오른쪽 한삼, 깨끼, 돌기를 몇 번 췄는지가 한삼 자락 네 갈래의 길이가 돼요.',
  dancheong: '푼 단계만큼 오색 띠가 늘어나고, 가운데에 연꽃 머리초가 들어가요.',
};

function tiltText(attempt) {
  const how = tr('{speed} 풀었고, 어느 자리에 무엇을 놓았는지가 이 조각의 고유값(시드)에 섞였어요.', { speed: tr(SPEED[attempt.speed] || '보통 속도로') });
  if (attempt.sceneId === 'jinbeop') return `${how} ${tr('그 값이 빈 천의 색을 정해요.')}`;
  const t = tiltOf(attempt.seed);
  const tilt = t === 0 ? tr('새김을 곧게 세우고') : t < 0 ? tr('새김을 {d}도 왼쪽으로 기울이고', { d: Math.abs(t) }) : tr('새김을 {d}도 오른쪽으로 기울이고', { d: Math.abs(t) });
  return `${how} ${tr('그 값이 {tilt}, 빈 천의 색도 정해요.', { tilt })}`;
}

// 조각 하나에 대한 설명
export function explainPatch(attempt, solvedCount) {
  if (!attempt) return null;
  const oh = ohangByKey(attempt.ohangKey);
  const lv = levelFor(attempt.sceneId, solvedCount);
  const lines = [
    { k: tr('푼 문제'), v: `‘${sceneProblemName(attempt)}’ — ${tr(SHAPE_TEXT[attempt.sceneId])}` },
    { k: tr('조각 색'), v: tr('그때의 오늘의 기운이 {oh}({hint} 느낌)이어서 이 색으로 물들었어요.', { oh: oh.label, hint: tr(oh.hint) }) },
    {
      k: tr('푼 방식'),
      v: tiltText(attempt),
    },
    {
      k: tr('완성도'),
      v: `${tr('{scene}에서 서로 다른 문제를 {n}개 풀어 {level}이에요.', { scene: tr(SCENE_TARGET[attempt.sceneId].name), n: solvedCount, level: tr(LEVEL_NAME[lv]) })} ${tr(LEVEL_LOOK[lv])} ${nextHint(attempt.sceneId, solvedCount)}`,
    },
  ];
  return lines;
}

function levelFor(sceneId, n) {
  const t = SCENE_TARGET[sceneId];
  if (!t || n <= 0) return 0;
  if (n >= t.l3) return 3;
  if (n >= t.l2) return 2;
  return 1;
}

// 조각보 전체에 대한 설명
export function explainWhole(attempts, seed, percent) {
  const n = attempts.length;
  const lines = [];
  if (n === 0) return [{ k: tr('지금은'), v: tr('아직 이어 붙은 조각이 없어서 빈 천이에요. 판 하나만 풀어도 첫 조각이 생겨요.') }];
  lines.push({ k: tr('이어 붙은 조각'), v: tr('{n}장이에요. 판을 풀 때마다 그 판의 자리에 조각이 하나씩 붙어요.', { n }) });
  if (n >= 2) lines.push({ k: tr('매듭'), v: tr('조각이 2장 이상이어서 조각 사이에 매듭(붉은 마름모)이 생겼어요.') + (n >= 3 ? ' ' + tr('세 장이 모이면 두 번째 매듭(푸른 마름모)이 더해져요.') : '') });
  lines.push({
    k: tr('빈 천 색'),
    v: tr('남는 두 칸의 색은 지금 이어 붙은 조각들의 값을 섞어 정해요: {colors}. 어떤 판을 어떻게 풀었는지가 달라지면 이 색도 달라져요.', { colors: [0, 1].map((i) => tr(FILL_NAME[fillerColorIndex(seed, i)])).join(' · ') }),
  });
  const stage =
    percent >= 100 ? tr('이중 금빛 테두리와 금실 점선이 둘러졌어요.')
    : percent >= 60 ? tr('금빛 테두리가 둘러졌어요. 100%가 되면 테두리가 이중이 돼요.')
    : percent >= 50 ? tr('빈 천에 꽃수가 놓였어요. 60%가 되면 금빛 테두리가 둘러져요.')
    : tr('50%가 되면 빈 천에 꽃수가, 60%가 되면 금빛 테두리가 더해져요.');
  lines.push({ k: tr('완성도'), v: tr('지금 {p}%예요. 서로 다른 문제를 풀수록 빈 천이 점점 짙어지고, {stage}', { p: percent, stage }) });
  return lines;
}
