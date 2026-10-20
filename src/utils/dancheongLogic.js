// 단청 판 진행 — 화면과 떨어진 순수 함수라 테스트로 바로 확인한다.
// 상태: { step(지금 단계 번호), taps(가칠·타분 누른 수), cover·pounce(칠한·두드린 칸), filled{칸:색}, drawn{선:true}, mistakes, done }
// 단계는 stage.steps 순서대로만 넘어간다(가칠 전에 채색 불가, 채색이 끝나야 분선).

export const GACHIL = 3; // (손가락을 끌 수 없을 때) 누르기만으로 넘어가는 횟수 — 키보드·보조 기기용
export const TABUN = 4;

// 실제처럼: 가칠은 붓으로 판을 문질러 칠하고, 타분은 도본 위를 분주머니로 두드려 무늬를 옮긴다.
// 판(240×100)을 10×10 칸 24×10개로 나눠, 칠한·두드린 칸이 COVER 이상이면 다음 단계.
export const GW = 24;
export const GH = 10;
export const COVER = 0.9;
export const BRUSH_R = 13; // 붓 반지름(판 좌표)
export const POUNCE_R = 36; // 분주머니 한 번에 무늬가 찍히는 반지름
export const LINE_TOL = 7; // 선 긋기: 점선에서 이만큼 안쪽이면 따라 그은 것으로 본다
export const LINE_COVER = 0.8; // 선의 80% 이상을 따라 그으면 그어진 것

export function initState() {
  return { step: 0, taps: 0, cover: new Array(GW * GH).fill(0), pounce: new Array(GW * GH).fill(0), filled: {}, drawn: {}, mistakes: 0, done: false };
}

const coverRatio = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
export const gachilCover = (st) => coverRatio(st.cover || []);
export const tabunCover = (st) => coverRatio(st.pounce || []);

// 점들(손가락이 지나간 자리) 둘레 r 안의 칸을 1로
function stamp(arr, pts, r) {
  const out = arr.slice();
  for (let gy = 0; gy < GH; gy += 1) {
    for (let gx = 0; gx < GW; gx += 1) {
      const i = gy * GW + gx;
      if (out[i]) continue;
      const cx = gx * 10 + 5;
      const cy = gy * 10 + 5;
      if (pts.some(([x, y]) => Math.hypot(x - cx, y - cy) <= r)) out[i] = 1;
    }
  }
  return out;
}

// 끌어 그린 길을 촘촘한 점으로(점 사이가 멀면 사이를 메운다)
export function densify(pts, stepLen = 3) {
  const out = [];
  for (let i = 0; i < pts.length; i += 1) {
    if (i === 0) { out.push(pts[0]); continue; }
    const [x1, y1] = pts[i - 1];
    const [x2, y2] = pts[i];
    const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / stepLen));
    for (let k = 1; k <= n; k += 1) out.push([x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n]);
  }
  return out;
}

// 선을 고르게 나눈 점들
function samples(line, n = 24) {
  if (line.seg) {
    const [[x1, y1], [x2, y2]] = line.seg;
    return Array.from({ length: n + 1 }, (_, i) => [x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n]);
  }
  const [cx, cy, r] = line.circle;
  return Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * r, cy + Math.sin((i / n) * Math.PI * 2) * r]);
}

/** 그은 길이 이 선의 몇 %를 따라갔는지 */
export function lineCoverage(line, pts, tol = LINE_TOL) {
  const dense = densify(pts);
  const sm = samples(line);
  const hit = sm.filter(([x, y]) => dense.some(([px, py]) => Math.hypot(px - x, py - y) <= tol)).length;
  return hit / sm.length;
}

const stepKey = (stage, st) => stage.steps[st.step];

/** 지금 단계가 끝났는지 */
export function stepDone(stage, st) {
  const k = stepKey(stage, st);
  if (k === 'gachil') return st.taps >= GACHIL || gachilCover(st) >= COVER;
  if (k === 'tabun') return st.taps >= TABUN || tabunCover(st) >= COVER;
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
 * action: { type: 'brush', pts } (가칠) | { type: 'pounce', pt } (타분) | { type: 'fill', cell, color } | { type: 'stroke', pts } (선 긋기)
 *         { type: 'tap' } · { type: 'line', line } — 끌 수 없을 때(키보드·보조 기기)를 위한 누르기
 * 돌려주는 값: { state, ok, why }  why: 'wrong-step' | 'wrong-color' | 'not-target' | undefined
 */
export function apply(stage, st, action) {
  if (st.done) return { state: st, ok: false, why: 'done' };
  const k = stepKey(stage, st);
  if (action.type === 'tap') {
    if (k !== 'gachil' && k !== 'tabun') return { state: st, ok: false, why: 'wrong-step' };
    return { state: advance(stage, { ...st, taps: st.taps + 1 }), ok: true };
  }
  if (action.type === 'brush') {
    // 가칠: 붓으로 문지른 길
    if (k !== 'gachil') return { state: st, ok: false, why: 'wrong-step' };
    return { state: advance(stage, { ...st, cover: stamp(st.cover, densify(action.pts), BRUSH_R) }), ok: true };
  }
  if (action.type === 'pounce') {
    // 타분: 분주머니로 두드린 자리
    if (k !== 'tabun') return { state: st, ok: false, why: 'wrong-step' };
    return { state: advance(stage, { ...st, pounce: stamp(st.pounce, [action.pt], POUNCE_R) }), ok: true };
  }
  if (action.type === 'stroke') {
    // 먹선·분선: 점선을 따라 그은 길 — 지금 차례 선 가운데 80% 넘게 따라간 선을 모두 긋는다
    if (k !== 'meok' && k !== 'bun') return { state: st, ok: false, why: 'wrong-step' };
    const got = stage.lines.filter((l) => l.kind === k && !st.drawn[l.id] && lineCoverage(l, action.pts) >= LINE_COVER);
    if (!got.length) {
      const other = stage.lines.some((l) => l.kind !== k && !st.drawn[l.id] && lineCoverage(l, action.pts) >= LINE_COVER);
      return other ? { state: { ...st, mistakes: st.mistakes + 1 }, ok: false, why: 'wrong-step' } : { state: st, ok: false, why: 'not-target' };
    }
    const drawn = { ...st.drawn };
    got.forEach((l) => { drawn[l.id] = true; });
    return { state: advance(stage, { ...st, drawn }), ok: true, lines: got.map((l) => l.id) };
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
