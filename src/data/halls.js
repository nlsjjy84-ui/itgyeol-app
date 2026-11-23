// 나의 박물관 — 여섯 놀이 판은 여섯 전시실의 문이다 (2026-11-23 새 흐름: 조각보를 빼고 전시실로)
// 판을 깨면 그 판과 뜻이 닿는 유물이 보따리에 들고, 그 유물은 그 판의 전시실에 놓인다.
// 서로 다른 문제를 많이 풀수록 전시실이 「작은 진열장 → 상설전 → 특별전」으로 자라고, 귀한 유물이 더 잘 나온다.
import { PIECES, PIECE_BY_K } from './pieces';
import { SCENE_BIAS } from '../utils/pieceStore';

export const HALLS = [
  { id: 'jinbeop', scene: '진법', route: 'Jinbeop', name: '무기실', sub: '장수가 쓰던 칼·창·투구·북', color: '#b3322b', mark: '武' },
  { id: 'print', scene: '훈민정음·인쇄', route: 'Print', name: '문방실', sub: '글을 짓고 찍던 도장·벼루·먹·연적', color: '#2b5f8e', mark: '文' },
  { id: 'tbd', scene: '전래놀이', route: 'Play', name: '놀이실', sub: '옛사람이 놀던 흙 인형·주사위·놀잇감', color: '#3f7a52', mark: '戱' },
  { id: 'hangul', scene: '한글 테트리스', route: 'Hangul', name: '기와·건축실', sub: '블록처럼 쌓아 집을 짓던 기와·막새·전돌', color: '#8a5a2b', mark: '瓦' },
  { id: 'talchum', scene: '탈춤', route: 'Talchum', name: '장신구실', sub: '춤추는 사람이 쓰고 달던 탈·노리개·비녀', color: '#9a3b6b', mark: '飾' },
  { id: 'dancheong', scene: '단청', route: 'Dancheong', name: '도자실', sub: '색과 무늬를 입힌 청자·백자·분청', color: '#2c7a7a', mark: '瓷' },
];
// 어느 전시실에도 들지 않는 유물(오늘의 보따리·선물 등으로 받은 것)
export const STORAGE = { id: 'storage', name: '수장고', sub: '아직 전시실을 정하지 않은 유물을 보관하는 곳', color: '#6b6357', mark: '藏' };

export const HALL_BY_ID = Object.fromEntries(HALLS.map((h) => [h.id, h]));
export const HALL_BY_SCENE = Object.fromEntries(HALLS.map((h) => [h.scene, h]));

// 전시실 완성도 — 판을 한 번 깰 때마다 20%씩, 다섯 번이면 100% (2026-11-23 「빨리빨리 차야 한다」)
export const STEP = 20;
export const hallPercent = (clears) => Math.min(100, (clears || 0) * STEP);
// 판을 깬 횟수 — 이 기기 기록(playLog), 다른 기기에서 가져온 기록(attempts)은 적어도 1번으로 센다
export const clearsOf = (playLog, attempts, id) =>
  Math.max((playLog && playLog.byScene && playLog.byScene[id]) || 0, (attempts || []).some((a) => a.sceneId === id) ? 1 : 0);
// 0% 문 닫힘 · 20~40% 작은 진열장 · 60~80% 상설전 · 100% 특별전
export const hallLevel = (clears) => {
  const p = hallPercent(clears);
  return p === 0 ? 0 : p < 60 ? 1 : p < 100 ? 2 : 3;
};
// 다음 단계까지 남은 판 수
export const toNextLevel = (clears) => {
  const p = hallPercent(clears);
  if (p >= 100) return null;
  const goal = p < 60 ? 60 : 100;
  return { need: Math.ceil((goal - p) / STEP), next: goal === 60 ? 2 : 3 };
};

// 전시실 단계 — 0은 아직 문이 닫힌 곳
export const HALL_LEVEL = ['문 닫힘', '작은 진열장', '상설전', '특별전'];
// 단계마다 보따리 — 유물 수와 「귀함 이상」이 나올 확률(%) (pieceStore의 TIER와 같은 값)
export const HALL_ODDS = [
  { n: 3, up: 30 },
  { n: 3, up: 30 },
  { n: 3, up: 45 },
  { n: 4, up: 55 },
];

const cache = {};
export function hallIdOf(k) {
  if (cache[k]) return cache[k];
  const p = PIECE_BY_K[k];
  let id = 'storage';
  if (p) {
    const h = HALLS.find((x) => SCENE_BIAS[x.scene] && SCENE_BIAS[x.scene].test(p.name));
    if (h) id = h.id;
  }
  cache[k] = id;
  return id;
}

let totals = null;
export function hallTotals() {
  if (totals) return totals;
  totals = { storage: 0 };
  HALLS.forEach((h) => (totals[h.id] = 0));
  PIECES.forEach((p) => (totals[hallIdOf(p.k)] += 1));
  return totals;
}

// 내가 모은 유물(키 목록)을 전시실별로 나눈다
export function groupByHall(keys) {
  const out = { storage: [] };
  HALLS.forEach((h) => (out[h.id] = []));
  keys.forEach((k) => out[hallIdOf(k)].push(k));
  return out;
}
