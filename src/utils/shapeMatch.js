// 손으로 그린 궤적(점들의 배열)을 정답 모양과 비교해 "몇 % 비슷한지"를 계산한다.
// 정답을 맞히고 틀리고가 아니라 "닮음 정도"로 말해주기 위한 간단한 모양 비교기.

// 호 길이(누적 거리) 기준으로 n개의 점을 고르게 다시 뽑는다 — 점이 빽빽한 구간과
// 듬성한 구간이 섞여 있어도, 비교할 때는 양쪽 다 같은 간격으로 늘어선 점이 된다.
export function resamplePath(points, n) {
  if (!points || points.length === 0) return Array(n).fill({ x: 0.5, y: 0.5 });
  if (points.length === 1) return Array(n).fill(points[0]);
  const lens = [0];
  for (let i = 1; i < points.length; i++) {
    lens.push(lens[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
  }
  const total = lens[lens.length - 1] || 1;
  const out = [];
  for (let k = 0; k < n; k++) {
    const target = (k / (n - 1)) * total;
    let i = 0;
    while (i < lens.length - 2 && lens[i + 1] < target) i++;
    const segLen = lens[i + 1] - lens[i] || 1;
    const localT = (target - lens[i]) / segLen;
    const a = points[i];
    const b = points[Math.min(i + 1, points.length - 1)];
    out.push({ x: a.x + (b.x - a.x) * localT, y: a.y + (b.y - a.y) * localT });
  }
  return out;
}

// 위치(어디서 그렸는지)와 크기(얼마나 크게 그렸는지)를 지워서, 같은 모양이면
// 작게 그리든 크게 그리든 구석에 그리든 똑같이 비교되게 만든다.
export function normalizeShape(points) {
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  const centered = points.map((p) => ({ x: p.x - cx, y: p.y - cy }));
  const rms =
    Math.sqrt(centered.reduce((s, p) => s + p.x * p.x + p.y * p.y, 0) / centered.length) || 0.0001;
  return centered.map((p) => ({ x: p.x / rms, y: p.y / rms }));
}

function avgDist(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y);
  return s / a.length;
}

// 그린 궤적(drawnRaw)을 정답 모양(templateRaw)과 비교해 0~100 유사도를 돌려준다.
// closed=true(원진처럼 끝이 이어지는 모양)면 어디서부터 그리기 시작했든, 시계/반시계
// 어느 방향으로 그렸든 상관없이 가장 잘 맞는 정렬을 찾는다. closed=false(선·아치·날개
// 모양)면 그리기 시작 방향(왼→오 / 오→왼)만 둘 다 시도한다.
export function similarityToTemplate(drawnRaw, templateRaw, { closed = false, n = 24 } = {}) {
  if (!drawnRaw || drawnRaw.length < 2 || !templateRaw) return 0;
  const drawn = normalizeShape(resamplePath(drawnRaw, n));
  const template = normalizeShape(resamplePath(templateRaw, n));
  let best = Infinity;
  const candidates = [drawn, drawn.slice().reverse()];
  for (const cand of candidates) {
    if (closed) {
      for (let off = 0; off < n; off++) {
        const rotated = cand.slice(off).concat(cand.slice(0, off));
        const d = avgDist(rotated, template);
        if (d < best) best = d;
      }
    } else {
      const d = avgDist(cand, template);
      if (d < best) best = d;
    }
  }
  return Math.max(0, Math.min(100, Math.round(100 - best * 95)));
}
