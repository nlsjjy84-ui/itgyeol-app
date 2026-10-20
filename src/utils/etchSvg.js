// 판 에칭용 도안(.svg, 단위 mm): 파란 가는 선 = 끝까지 자르는 선(윤곽·구멍), 검은 채움 = 표면 새김.
// (Ponoko 등 레이저·에칭 업체의 일반 규칙. 업체마다 색 규칙이 다르면 이 두 색만 바꾸면 된다)
export function planToSvg(plan, { cut = '#0000FF', etch = '#000000' } = {}) {
  const k = plan.mmPerUnit;
  const all = [...plan.outline, ...plan.holes.flat()];
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const x0 = Math.min(...xs), y1 = Math.max(...ys);
  const W = (Math.max(...xs) - x0) * k, H = (y1 - Math.min(...ys)) * k;
  const P = ([x, y]) => `${((x - x0) * k).toFixed(3)},${((y1 - y) * k).toFixed(3)}`;
  const poly = (pts) => `M${pts.map(P).join(' L')} Z`;
  const cutPath = [plan.outline, ...plan.holes].map(poly).join(' ');
  const rects = plan.etch.map(([cx, cy, w, h]) => `<rect x="${((cx - w / 2 - x0) * k).toFixed(3)}" y="${((y1 - cy - h / 2) * k).toFixed(3)}" width="${(w * k).toFixed(3)}" height="${(h * k).toFixed(3)}"/>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(2)}mm" height="${H.toFixed(2)}mm" viewBox="0 0 ${W.toFixed(3)} ${H.toFixed(3)}">
<!-- 잇결 에칭 도안 · 단위 mm · 파란 선 = 자르기(윤곽·구멍), 검은 채움 = 새김 -->
<g id="etch" fill="${etch}" stroke="none">${rects}</g>
<g id="cut" fill="none" stroke="${cut}" stroke-width="0.01"><path d="${cutPath}"/></g>
</svg>
`;
}
