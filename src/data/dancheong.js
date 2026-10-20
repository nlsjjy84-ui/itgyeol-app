import { t as i18nT } from '../i18n';
// 단청 판 — 실제 단청 순서대로 칠한다.
// 근거: 바탕에 가칠을 하고, 초안을 옮긴 도본의 윤곽선에 구멍을 뚫어, 도본을 대고 분주머니를 두드려(타분)
// 무늬를 옮긴 뒤, 청·적·황·백·흑 오색을 각기 맡은 칸에 메우고, 문양 테두리에 분선을 긋는다
// (일요신문 「꼭 지켜야 할 우리 유산 — 국가무형문화재 단청장」).
// 긋기단청은 가칠 위에 먹과 분으로 복선을 그어 마무리한 단청이고, 모로단청은 부재 양 끝에 머리초를 두고
// 그 사이(계풍)는 긋기로 마감한다(단청 문서 — 더위키).
// 무늬는 특정 건물의 단청을 옮긴 것이 아니라, 이 판을 위해 단순하게 그린 연꽃 머리초다.

export const COLORS = {
  nok: { name: '뇌록(바탕)', hex: '#3f7d6a' },
  cheong: { name: '청', hex: '#2b5f8e' },
  jeok: { name: '적', hex: '#b8312a' },
  hwang: { name: '황', hex: '#e3b23c' },
  baek: { name: '백', hex: '#f6f0e2' },
  heuk: { name: '흑(먹)', hex: '#1d1b19' },
};
export const PAINTS = ['cheong', 'jeok', 'hwang', 'baek', 'heuk'];

export const STEP_INFO = {
  gachil: { name: '가칠', how: '붓으로 판 전체를 문질러 바탕을 뇌록으로 칠해요.' },
  tabun: { name: '타분', how: '구멍 뚫린 도본 위를 분주머니로 톡톡 두드려 무늬를 옮겨요.' },
  chae: { name: '채색', how: '색을 고른 뒤, 그 색 점이 찍힌 칸을 눌러 메워요.' },
  meok: { name: '먹선 긋기', how: '점선을 따라 손가락으로 쭉 그어 검은 먹선을 그어요.' },
  bun: { name: '분선 긋기', how: '점선을 따라 손가락으로 쭉 그어 흰 분선을 그어요.' },
};

// 판(부재) 크기: 가로 240 × 세로 100
const r2 = (n) => Math.round(n * 10) / 10;
function petal(cx, cy, ang, rIn, rOut, half) {
  const a = (d) => (d * Math.PI) / 180;
  const p = (r, d) => [r2(cx + Math.cos(a(d)) * r), r2(cy + Math.sin(a(d)) * r)];
  return [p(rIn, ang - half), p(rOut * 0.78, ang - half * 0.9), p(rOut, ang), p(rOut * 0.78, ang + half * 0.9), p(rIn, ang + half)];
}

// 연꽃 머리초 하나: 띠(stripes) + 꽃술(가운데 원) + 꽃잎
function meoricho(prefix, x0, dir, stripes, petals) {
  const cells = [];
  const lines = [];
  const SW = 9;
  const order = ['cheong', 'jeok', 'hwang'];
  for (let i = 0; i < stripes; i += 1) {
    const xa = dir > 0 ? x0 + 4 + i * SW : x0 - 4 - (i + 1) * SW;
    cells.push({ id: `${prefix}s${i}`, color: order[i % 3], poly: [[xa, 6], [xa + SW, 6], [xa + SW, 94], [xa, 94]] });
  }
  const cx = dir > 0 ? x0 + 4 + stripes * SW + 32 : x0 - 4 - stripes * SW - 32;
  const cy = 50;
  for (let i = 0; i < petals; i += 1) {
    const ang = -90 + (360 / petals) * i;
    cells.push({ id: `${prefix}p${i}`, color: i % 2 === 0 ? 'jeok' : 'cheong', poly: petal(cx, cy, ang, 10, 28, 180 / petals - 4) });
  }
  cells.push({ id: `${prefix}c`, color: 'hwang', circle: [cx, cy, 9] });
  // 분선: 꽃 둘레 원, 띠 경계선
  lines.push({ id: `${prefix}ring`, kind: 'bun', circle: [cx, cy, 31] });
  const edge = dir > 0 ? x0 + 4 + stripes * SW : x0 - 4 - stripes * SW;
  lines.push({ id: `${prefix}edge`, kind: 'bun', seg: [[edge, 6], [edge, 94]] });
  return { cells, lines, cx };
}

function geutgiLines(xa, xb) {
  // 긋기: 위아래 테두리를 먹선과 분선 두 줄(복선)로
  return [
    { id: `m-top-${xa}`, kind: 'meok', seg: [[xa, 8], [xb, 8]] },
    { id: `m-bot-${xa}`, kind: 'meok', seg: [[xa, 92], [xb, 92]] },
    { id: `b-top-${xa}`, kind: 'bun', seg: [[xa, 13], [xb, 13]] },
    { id: `b-bot-${xa}`, kind: 'bun', seg: [[xa, 87], [xb, 87]] },
  ];
}

function build(stageId) {
  if (stageId === 'dc1') {
    return { cells: [], lines: geutgiLines(6, 234) };
  }
  if (stageId === 'dc2') {
    const m = meoricho('L', 0, 1, 3, 6);
    return { cells: m.cells, lines: [...m.lines, { id: 'Lend', kind: 'bun', seg: [[m.cx + 38, 6], [m.cx + 38, 94]] }] };
  }
  const L = meoricho('L', 0, 1, 2, 4);
  const R = meoricho('R', 240, -1, 2, 4);
  const mid = geutgiLines(L.cx + 34, R.cx - 34);
  return { cells: [...L.cells, ...R.cells], lines: [...L.lines, ...R.lines, ...mid] };
}

export const DANCHEONG_STAGES = [
  {
    id: 'dc1', name: '1단계 · 긋기단청', tag: '선 긋기', steps: ['gachil', 'meok', 'bun'], level: 'easy',
    tip: '긋기단청은 무늬 없이 바탕만 칠하고, 테두리에 먹선과 흰 분선을 두 줄로 그어 마무리해요. 서원처럼 검소한 건물에 많이 썼어요.',
  },
  {
    id: 'dc2', name: '2단계 · 연꽃 머리초', tag: '오색 칠하기', steps: ['gachil', 'tabun', 'chae', 'bun'], level: 'easy',
    tip: '머리초는 부재 끝에 들어가는 화려한 무늬예요. 단청장은 칸마다 맡은 색을 찾아 메운 뒤, 테두리에 흰 분선을 그어 무늬를 또렷하게 해요.',
  },
  {
    id: 'dc3', name: '3단계 · 모로단청', tag: '양 끝 + 계풍', steps: ['gachil', 'tabun', 'chae', 'meok', 'bun'], level: 'hard',
    tip: '모로단청은 부재 양 끝에 머리초를 두고, 그 사이 가운데(계풍)는 긋기로 마감해요. 궁궐 건물에 많이 썼어요.',
  },
].map((st) => ({ ...st, ...build(st.id) }));

export function dancheongMission(stage) {
  return {
    demo: { kind: 'paint' },
    kicker: i18nT('단청 · 오방색과 순서'),
    title: i18nT('단청'),
    story: i18nT('단청장은 바탕에 가칠을 하고, 도본을 대고 분주머니를 두드려(타분) 무늬를 옮긴 뒤, 청·적·황·백·흑 오색을 각기 맡은 칸에 메우고 테두리에 분선을 그어요. 그 순서를 그대로 따라 칠해 봐요.'),
    mission: i18nT('{p0} — 순서대로 끝까지 칠해 보자 🎨', { p0: i18nT(stage.name) }),
    steps: stage.steps.map((k, i) => i18nT('{p0}. {p1}: {p2}', { p0: i + 1, p1: i18nT(STEP_INFO[k].name), p2: i18nT(STEP_INFO[k].how) })),
  };
}
