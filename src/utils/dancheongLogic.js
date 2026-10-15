// 단청 판 진행 — 화면과 떨어진 순수 함수라 테스트로 바로 확인한다.
// 상태: { step(지금 단계 번호), taps(가칠·타분 누른 수), filled{칸:색}, drawn{선:true}, mistakes, done }
// 단계는 stage.steps 순서대로만 넘어간다(가칠 전에 채색 불가, 채색이 끝나야 분선).

export const GACHIL = 3;
export const TABUN = 4;

export function initState() {
  return { step: 0, taps: 0, filled: {}, drawn: {}, mistakes: 0, done: false };
}

const stepKey = (stage, st) => stage.steps[st.step];

/** 지금 단계가 끝났는지 */
export function stepDone(stage, st) {
  const k = stepKey(stage, st);
  if (k === 'gachil') return st.taps >= GACHIL;
  if (k === 'tabun') return st.taps >= TABUN;
  if (k === 'chae') return stage.cells.every((c) => st.filled[c.id]);
  if (k === 'meok' || k === 'bun') return stage.lines.filter((l) => l.kind === k).every((l) => st.drawn[l.id]);
  return true;
}

function advance(stage, st) {
  let s = st;
  while (!s.done && stepDone(stage, s)) {
    const next = s.step + 1;
    s = next >= stage.steps.length ? { ...s, done: true } : { ...s, step: next, taps: 0 };
  }
  return s;
}

/**
 * 한 번의 동작을 적용한다.
 * action: { type: 'tap' } (가칠·타분) | { type: 'fill', cell, color } | { type: 'line', line }
 * 돌려주는 값: { state, ok, why }  why: 'wrong-step' | 'wrong-color' | 'not-target' | undefined
 */
export function apply(stage, st, action) {
  if (st.done) return { state: st, ok: false, why: 'done' };
  const k = stepKey(stage, st);
  if (action.type === 'tap') {
    if (k !== 'gachil' && k !== 'tabun') return { state: st, ok: false, why: 'wrong-step' };
    return { state: advance(stage, { ...st, taps: st.taps + 1 }), ok: true };
  }
  if (action.type === 'fill') {
    if (k !== 'chae') return { state: st, ok: false, why: 'wrong-step' };
    const cell = stage.cells.find((c) => c.id === action.cell);
    if (!cell || st.filled[cell.id]) return { state: st, ok: false, why: 'not-target' };
    if (cell.color !== action.color) return { state: { ...st, mistakes: st.mistakes + 1 }, ok: false, why: 'wrong-color' };
    return { state: advance(stage, { ...st, filled: { ...st.filled, [cell.id]: action.color } }), ok: true };
  }
  if (action.type === 'line') {
    const line = stage.lines.find((l) => l.id === action.line);
    if (!line || st.drawn[line.id]) return { state: st, ok: false, why: 'not-target' };
    if (line.kind !== k) return { state: { ...st, mistakes: st.mistakes + 1 }, ok: false, why: 'wrong-step' };
    return { state: advance(stage, { ...st, drawn: { ...st.drawn, [line.id]: true } }), ok: true };
  }
  return { state: st, ok: false, why: 'unknown' };
}

// --- 눌린 자리 찾기(판 좌표 240×100) ---
function inPoly([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function distSeg([x, y], [[x1, y1], [x2, y2]]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const L = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / L));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

/** 이 점에 있는 칸(가운데 원이 꽃잎·띠보다 앞) */
export function cellAt(stage, pt) {
  const circles = stage.cells.filter((c) => c.circle && Math.hypot(pt[0] - c.circle[0], pt[1] - c.circle[1]) <= c.circle[2]);
  if (circles.length) return circles[0].id;
  const polys = stage.cells.filter((c) => c.poly && inPoly(pt, c.poly));
  return polys.length ? polys[polys.length - 1].id : null;
}

/** 이 점에서 가장 가까운 선(지금 단계 종류만, tol 안쪽) */
export function lineAt(stage, pt, kind, tol = 7) {
  let best = null;
  let bd = tol;
  stage.lines.forEach((l) => {
    if (kind && l.kind !== kind) return;
    const d = l.seg ? distSeg(pt, l.seg) : Math.abs(Math.hypot(pt[0] - l.circle[0], pt[1] - l.circle[1]) - l.circle[2]);
    if (d <= bd) {
      bd = d;
      best = l.id;
    }
  });
  return best;
}
