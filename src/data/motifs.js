// 전래놀이 → 전통 문양. 놀이를 알아보라고 그린 기호 대신, 실제 유물에 쓰이던 문양을 놀이의 뜻과 짝지어 새긴다.
// 문양 이름·뜻은 문화포털 「전통문양의 분류」(한국문화정보원, 공공누리 출처표시)와
// 한국민족문화대백과사전 「기하문」(한국학중앙연구원)을 따랐다. 짝짓기(놀이 ↔ 문양)는 이 프로젝트의 해석이다.
// 선은 가로세로 -0.5~0.5 칸 안의 점 목록(위가 +y). 같은 선으로 화면 무늬(SVG)와 3D 부조를 함께 만든다.

const circle = (cx, cy, r, n = 28, a0 = 0, a1 = Math.PI * 2) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
const spiral = (cx, cy, r0, r1, turns, n = 60, a0 = 0, dir = 1) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const a = a0 + dir * t * turns * Math.PI * 2;
    const r = r0 + (r1 - r0) * t;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
const wave = (y, amp, waves, x0 = -0.46, x1 = 0.46, n = 48, phase = 0) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / n;
    return [x, y + Math.sin(((x - x0) / (x1 - x0)) * Math.PI * 2 * waves + phase) * amp];
  });
const ellipse = (cx, cy, rx, ry, rot, n = 28) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
  });
const D = Math.PI / 180;
const hex = (cx, cy, r) => Array.from({ length: 7 }, (_, i) => [cx + Math.cos((i / 6) * Math.PI * 2 + Math.PI / 6) * r, cy + Math.sin((i / 6) * Math.PI * 2 + Math.PI / 6) * r]);

export const TRAD = {
  // 줄다리기 — 마을이 한 줄로 이어지는 놀이 → 덩굴문(끊이지 않고 이어짐, 장수·연속)
  juldarigi: {
    name: '덩굴무늬',
    lines: () => [wave(0, 0.13, 1.5), spiral(-0.2, 0.13, 0.02, 0.1, 1.1, 30, Math.PI), spiral(0.12, -0.13, 0.02, 0.1, 1.1, 30, 0), spiral(0.4, 0.12, 0.02, 0.07, 1, 24, Math.PI)],
  },
  // 줄넘기 — 가볍게 뛰어오름 → 나비무늬(아름다움·금슬, 장신구에 많이 씀)
  julneomgi: {
    name: '나비무늬',
    lines: () => [
      ellipse(-0.2, 0.14, 0.21, 0.13, 25 * D),
      ellipse(0.2, 0.14, 0.21, 0.13, -25 * D),
      ellipse(-0.15, -0.14, 0.15, 0.1, -30 * D),
      ellipse(0.15, -0.14, 0.15, 0.1, 30 * D),
      [[0, 0.2], [0, -0.28]],
      [[0, 0.2], [-0.06, 0.32], [-0.13, 0.4]],
      [[0, 0.2], [0.06, 0.32], [0.13, 0.4]],
    ],
  },
  // 상모돌리기 — 머리 위로 끝없이 돌림 → 태극무늬(음양이 돌며 조화)
  sangmo: {
    name: '태극무늬',
    lines: () => [circle(0, 0, 0.42, 40), [...circle(0, 0.21, 0.21, 16, -Math.PI / 2, Math.PI / 2).reverse(), ...circle(0, -0.21, 0.21, 16, Math.PI / 2, (Math.PI * 3) / 2)]],
  },
  // 구슬치기 → 꿴구슬무늬(구슬을 실에 꿴 장식 무늬)
  guseulchigi: {
    name: '꿴구슬무늬',
    lines: () => [[[-0.48, 0], [0.48, 0]], ...[-0.34, -0.11, 0.12, 0.35].map((x) => circle(x, 0, 0.1, 18))],
  },
  // 팽이치기 — 제자리에서 돎 → 소용돌이 무늬(나선문)
  paengi: { name: '소용돌이무늬', lines: () => [spiral(0, 0, 0.03, 0.42, 2.4, 80)] },
  // 자치기 — 짧게 끊어 치는 빠른 놀이 → 번개무늬(뇌문)
  jachigi: {
    name: '번개무늬',
    lines: () => [[[-0.42, -0.42], [0.42, -0.42], [0.42, 0.42], [-0.3, 0.42], [-0.3, -0.3], [0.3, -0.3], [0.3, 0.3], [-0.18, 0.3], [-0.18, -0.18], [0.18, -0.18], [0.18, 0.18], [-0.06, 0.18], [-0.06, -0.06], [0.06, -0.06]]],
  },
  // 비석치기 — 비석을 맞히는 놀이, 비석 받침은 거북 → 거북등무늬(귀갑문, 장수)
  biseok: { name: '거북등무늬', lines: () => [hex(0, 0, 0.2), hex(0.346, 0, 0.2), hex(-0.346, 0, 0.2), hex(0.173, 0.3, 0.2), hex(-0.173, -0.3, 0.2)] },
  // 투호 — 화살이 뜻대로 병에 들어가길 → 여의두무늬(만사가 뜻대로)
  tuho: {
    name: '여의두무늬',
    // 세 갈래 둥근 구름 머리(왼쪽·위·오른쪽) 아래로 뾰족하게 모이는 꼴
    lines: () => [
      [
        [0, -0.38],
        ...circle(-0.19, 0.04, 0.16, 18, 250 * D, 40 * D),
        ...circle(0, 0.2, 0.14, 18, 160 * D, 20 * D),
        ...circle(0.19, 0.04, 0.16, 18, 140 * D, -70 * D),
        [0, -0.38],
      ],
      spiral(-0.19, 0.04, 0.015, 0.07, 0.9, 16, 0),
      spiral(0.19, 0.04, 0.015, 0.07, 0.9, 16, Math.PI, -1),
    ],
  },
  // 딱지치기 — 종이를 접어 만든 딱지 → 칠보무늬(겹친 고리, 복·다복)
  ddakji: { name: '칠보무늬', lines: () => [circle(0, 0, 0.24, 32), circle(0.24, 0, 0.24, 32), circle(-0.24, 0, 0.24, 32), circle(0, 0.24, 0.24, 32), circle(0, -0.24, 0.24, 32)] },
  // 고무줄놀이 — 늘었다 줄었다 하는 줄 → 물결무늬(파상문)
  gomugojul: { name: '물결무늬', lines: () => [wave(0.2, 0.08, 2), wave(0, 0.08, 2), wave(-0.2, 0.08, 2)] },
  // 연날리기 — 하늘로 띄워 액을 날림 → 구름무늬(장수, 가장 많이 쓰인 무늬)
  yeonnaligi: {
    name: '구름무늬',
    // 두 갈래 말린 구름 머리 + 아래로 흐르는 꼬리
    lines: () => [
      spiral(-0.18, 0.06, 0.02, 0.24, 1.25, 44, Math.PI * 1.5),
      spiral(0.2, 0.1, 0.02, 0.2, 1.25, 40, Math.PI * 1.5, -1),
      circle(0.02, 0.62, 0.84, 24, 248 * D, 292 * D),
      [[0.33, -0.16], [0.42, -0.24], [0.5, -0.22]],
    ],
  },
  // 굴렁쇠 — 굴러가는 쇠고리 → 고리이음무늬
  gullyeongsoe: { name: '고리이음무늬', lines: () => [circle(-0.24, 0, 0.18, 26), circle(0, 0, 0.18, 26), circle(0.24, 0, 0.18, 26)] },
};

export const motifName = (id) => (TRAD[id] ? TRAD[id].name : '구름무늬');
export const motifLines = (id) => (TRAD[id] || TRAD.yeonnaligi).lines();
