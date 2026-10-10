import { FORMATIONS, ohangByKey } from '../data/formations';
import { PRINTING_TYPES } from '../data/printing';
import { PLAY_GAMES } from '../data/playGames';
import { HANGUL_STAGES } from '../data/hangulGames';
import { SCENE_TARGET, LEVEL_NAME, nextHint } from './progress';

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
    return f ? f.name : '진법';
  }
  if (attempt.sceneId === 'print') {
    const t = PRINTING_TYPES.find((q) => q.id === attempt.formationId);
    return t ? t.name : '훈민정음·인쇄';
  }
  if (attempt.sceneId === 'hangul') {
    const h = HANGUL_STAGES.find((q) => q.id === attempt.formationId);
    return h ? `한글 테트리스 ${h.name}` : '한글 테트리스';
  }
  const g = PLAY_GAMES.find((q) => q.id === attempt.formationId);
  return g ? g.name : '전래놀이';
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
  tbd: '푼 놀이를 뜻하는 한자가 인장으로 새겨져요.',
  hangul: '클리어한 단계를 뜻하는 한글 자모가 블록 네 칸 위에 새겨져요.',
};

function tiltText(attempt) {
  const how = `${SPEED[attempt.speed] || '보통 속도로'} 풀었고, 어느 자리에 무엇을 놓았는지가 이 조각의 고유값(시드)에 섞였어요.`;
  if (attempt.sceneId === 'jinbeop') return `${how} 그 값이 빈 천의 색을 정해요.`;
  const t = tiltOf(attempt.seed);
  const tilt = t === 0 ? '새김을 곧게 세우고' : `새김을 ${Math.abs(t)}도 ${t < 0 ? '왼쪽' : '오른쪽'}으로 기울이고`;
  return `${how} 그 값이 ${tilt}, 빈 천의 색도 정해요.`;
}

// 조각 하나에 대한 설명
export function explainPatch(attempt, solvedCount) {
  if (!attempt) return null;
  const oh = ohangByKey(attempt.ohangKey);
  const lv = levelFor(attempt.sceneId, solvedCount);
  const lines = [
    { k: '푼 문제', v: `‘${sceneProblemName(attempt)}’ — ${SHAPE_TEXT[attempt.sceneId]}` },
    { k: '조각 색', v: `그때의 오늘의 기운이 ${oh.label}(${oh.hint} 느낌)이어서 이 색으로 물들었어요.` },
    {
      k: '푼 방식',
      v: tiltText(attempt),
    },
    {
      k: '완성도',
      v: `${SCENE_TARGET[attempt.sceneId].name}에서 서로 다른 문제를 ${solvedCount}${SCENE_TARGET[attempt.sceneId].unit.startsWith('가지') ? '가지' : '개'} 풀어 ${LEVEL_NAME[lv]}이에요. ${LEVEL_LOOK[lv]} ${nextHint(attempt.sceneId, solvedCount)}`,
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
  if (n === 0) return [{ k: '지금은', v: '아직 이어 붙은 조각이 없어서 빈 천이에요. 판 하나만 풀어도 첫 조각이 생겨요.' }];
  lines.push({ k: '이어 붙은 조각', v: `${n}장이에요. 판을 풀 때마다 그 판의 자리에 조각이 하나씩 붙어요.` });
  if (n >= 2) lines.push({ k: '매듭', v: `조각이 2장 이상이어서 조각 사이에 매듭(붉은 마름모)이 생겼어요.${n >= 3 ? ' 세 장이 모이면 두 번째 매듭(푸른 마름모)이 더해져요.' : ''}` });
  lines.push({
    k: '빈 천 색',
    v: `남는 두 칸의 색은 지금 이어 붙은 조각들의 값을 섞어 정해요: ${[0, 1].map((i) => FILL_NAME[fillerColorIndex(seed, i)]).join(' · ')}. 어떤 판을 어떻게 풀었는지가 달라지면 이 색도 달라져요.`,
  });
  const stage =
    percent >= 100 ? '이중 금빛 테두리와 금실 점선이 둘러졌어요.'
    : percent >= 60 ? '금빛 테두리가 둘러졌어요. 100%가 되면 테두리가 이중이 돼요.'
    : percent >= 50 ? '빈 천에 꽃수가 놓였어요. 60%가 되면 금빛 테두리가 둘러져요.'
    : '50%가 되면 빈 천에 꽃수가, 60%가 되면 금빛 테두리가 더해져요.';
  lines.push({ k: '완성도', v: `지금 ${percent}%예요. 서로 다른 문제를 풀수록 빈 천이 점점 짙어지고, ${stage}` });
  return lines;
}
