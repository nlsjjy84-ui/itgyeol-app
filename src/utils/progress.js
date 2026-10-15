import { t as tr } from '../i18n';
// 완성도 — 서로 다른 문제를 많이 풀수록 조각보가 더 정교해진다.
// "같은 판을 반복"하는 것보다 "다른 문제를 푸는 것"이 완성도를 올리도록, 푼 문제의 "종류 수"를 센다.
// (판마다 푼 문제 종류는 기기에 저장돼 앱을 껐다 켜도 이어진다.)

export const SCENE_TARGET = {
  // total: 그 판에 있는 문제 수 / l2·l3: 2단계·3단계가 열리는 문제 종류 수
  jinbeop: { name: '진법', total: 7, l2: 3, l3: 6, unit: '가지 진' },
  print: { name: '훈민정음·인쇄', total: 11, l2: 3, l3: 6, unit: '가지 글자·활자' },
  tbd: { name: '전래놀이', total: 12, l2: 4, l3: 8, unit: '가지 놀이' },
  hangul: { name: '한글 테트리스', total: 4, l2: 2, l3: 3, unit: '단계' },
  talchum: { name: '탈춤', total: 3, l2: 2, l3: 3, unit: '단계' },
  dancheong: { name: '단청', total: 3, l2: 2, l3: 3, unit: '단계' },
};

export const LEVEL_NAME = ['빈 조각', '1단계 · 바탕 조각', '2단계 · 수놓은 조각', '3단계 · 금실 조각'];

export function levelFor(sceneId, solvedCount) {
  const t = SCENE_TARGET[sceneId];
  if (!t || solvedCount <= 0) return 0;
  if (solvedCount >= t.l3) return 3;
  if (solvedCount >= t.l2) return 2;
  return 1;
}

// solvedIds = { jinbeop: ['wonjin', ...], print: [...], tbd: [...] }
export function computeProgress(solvedIds) {
  const ids = solvedIds || {};
  const levels = {};
  const counts = {};
  let sum = 0;
  Object.keys(SCENE_TARGET).forEach((sid) => {
    const n = new Set(ids[sid] || []).size;
    counts[sid] = n;
    levels[sid] = levelFor(sid, n);
    sum += Math.min(1, n / SCENE_TARGET[sid].l3);
  });
  const percent = Math.round((sum / Object.keys(SCENE_TARGET).length) * 100);
  return { levels, counts, percent };
}

// 다음 단계까지 남은 문제 수를 알려 주는 말
export function nextHint(sceneId, solvedCount) {
  const t = SCENE_TARGET[sceneId];
  const lv = levelFor(sceneId, solvedCount);
  if (lv >= 3) return tr('{scene}은 가장 높은 단계예요.', { scene: tr(t.name) });
  const need = (lv === 0 ? 1 : lv === 1 ? t.l2 : t.l3) - solvedCount;
  return tr('{scene} 다른 문제 {need}개를 더 풀면 {lv}단계가 돼요.', { scene: tr(t.name), need, lv: lv + 1 });
}
