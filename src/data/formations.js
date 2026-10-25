// 진법 데이터 — 풍물 진풀이 · 강강술래 대형 · 역사적 진법을 함께 모아 여러 종류를 제공
// stage 기준 좌표계: 0~1 사이 비율(ratio)로 저장 → 화면 크기에 맞춰 변환해서 사용
// 인원 수(n)는 진법마다 실제 그 대형이 자연스러워 보이는 숫자를 각자 갖는다 (8로 통일하지 않음).

function circlePositions(n) {
  const pts = [];
  const cx = 0.5, cy = 0.5, r = 0.36;
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 1.15 });
  }
  return pts;
}

// [을자진 재설계] 전에는 매끈한 사인파 하나로 "흉내"만 냈는데, 실제 한자 '을(乙)'은
// 위쪽 가로획 → 왼쪽 아래로 꺾이는 긴 사선 → 바닥에서 오른쪽으로 둥글게 감아 올리는
// 갈고리(마지막 삐침)로 이루어진 글자다. 그 3단계 꺾임을 실제 꼭짓점(waypoint)으로
// 박아두고 그 사이를 이어서, 그려보면 진짜 '을'자처럼 보이게 한다.
const EULJA_WAYPOINTS = [
  { x: 0.30, y: 0.07 },
  { x: 0.72, y: 0.09 },
  { x: 0.66, y: 0.24 },
  { x: 0.58, y: 0.33 },
  { x: 0.28, y: 0.56 },
  { x: 0.24, y: 0.73 },
  { x: 0.33, y: 0.87 },
  { x: 0.63, y: 0.91 },
  { x: 0.71, y: 0.77 },
];

function dist(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

// t(0~1) 위치에서의 좌표 — 꼭짓점 사이를 실제 거리(호 길이) 비율로 보간해서,
// 짧은 구간과 긴 구간이 있어도 점들이 한쪽에 몰리지 않고 고르게 흐르듯 찍힌다.
export function euljaPathPoint(t) {
  const pts = EULJA_WAYPOINTS;
  const segLens = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = dist(pts[i], pts[i + 1]);
    segLens.push(l);
    total += l;
  }
  let target = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < segLens.length; i++) {
    const l = segLens[i];
    if (target <= l || i === segLens.length - 1) {
      const localT = l ? target / l : 0;
      const a = pts[i];
      const b = pts[i + 1];
      return { x: a.x + (b.x - a.x) * localT, y: a.y + (b.y - a.y) * localT };
    }
    target -= l;
  }
  return pts[pts.length - 1];
}

function euljaPathPositions(n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    pts.push(euljaPathPoint(n === 1 ? 0 : i / (n - 1)));
  }
  return pts;
}

// 미리보기/배경 안내선에 쓸, 훨씬 촘촘한 점들로 '을'자 궤적 자체를 또렷하게 보여준다.
export function euljaGuidePoints(n = 26) {
  return euljaPathPositions(n);
}

function squarePositions(n) {
  // 방진(方陣) — 사각형 둘레를 따라 n명이 고르게(네 변에 균등하게) 둘러섬
  const cx = 0.5, cy = 0.5, half = 0.32;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / n; // 0~1, 둘레를 한 바퀴
    const side = Math.min(3, Math.floor(t * 4));
    const localT = t * 4 - side; // 0~1, 해당 변 안에서의 위치
    let x, y;
    if (side === 0) {
      x = cx - half + localT * half * 2;
      y = cy - half;
    } else if (side === 1) {
      x = cx + half;
      y = cy - half + localT * half * 2;
    } else if (side === 2) {
      x = cx + half - localT * half * 2;
      y = cy + half;
    } else {
      x = cx - half;
      y = cy + half - localT * half * 2;
    }
    pts.push({ x, y });
  }
  return pts;
}

function linePositions(n) {
  // 일자진(一字陣) — 가로로 길게 늘어선 한 줄
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    pts.push({ x: 0.1 + t * 0.8, y: 0.5 });
  }
  return pts;
}

function craneWingPositions(n) {
  // 학익진(鶴翼陣) — 가운데 아래에서 시작해 양쪽 위로 날개처럼 벌어지는 V자 대형
  const pts = [];
  const half = Math.ceil(n / 2);
  const rest = n - half;
  for (let i = 0; i < half; i++) {
    const t = half === 1 ? 0 : i / (half - 1);
    pts.push({ x: 0.5 - t * 0.4, y: 0.82 - t * 0.6 });
  }
  for (let i = 0; i < rest; i++) {
    const t = rest === 1 ? 0 : i / (rest - 1);
    pts.push({ x: 0.5 + t * 0.4, y: 0.82 - t * 0.6 });
  }
  return pts;
}

function spiralPositions(n) {
  // 고사리꺾기 — 강강술래에서 줄이 안으로 돌돌 말려드는 나선형 대형
  const pts = [];
  const turns = 1.4;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const angle = t * Math.PI * 2 * turns - Math.PI / 2;
    const r = 0.38 * (1 - t * 0.75);
    pts.push({ x: 0.5 + Math.cos(angle) * r, y: 0.5 + Math.sin(angle) * r * 1.1 });
  }
  return pts;
}

function archPositions(n) {
  // 기와밟기 — 허리를 숙인 줄이 완만한 아치(다리)를 그리는 강강술래 대형
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = 0.12 + t * 0.76;
    const y = 0.68 - Math.sin(t * Math.PI) * 0.42;
    pts.push({ x, y });
  }
  return pts;
}

// [진법이란?] 처음 들어오는 사람은 "진법"이라는 말 자체를 모른다 — 화면 위쪽에
// 펼쳐볼 수 있는 간단한 설명과, 누구나 아는 실제 역사적 사례(이순신 장군의 한산도
// 대첩·학익진)를 함께 보여준다.
export const JINBEOP_INTRO = {
  title: '진법이 뭐예요?',
  body:
    '진법(陣法)은 여러 사람이 미리 약속해둔 대형(隊形)으로 함께 움직이는 방법입니다. ' +
    '풍물패가 원을 그리며 호흡을 맞추는 것도, 강강술래에서 손을 잡은 줄이 모양을 바꾸는 것도, ' +
    '옛 군대가 전투에서 대형을 짜는 것도 모두 진법입니다. 흩어져 있으면 그냥 여러 사람이지만, ' +
    '약속된 모양으로 서면 하나처럼 움직일 수 있게 됩니다.',
  example:
    '가장 유명한 예가 학익진(鶴翼陣)입니다. 1592년 한산도 대첩에서 이순신 장군은 ' +
    '수적으로 불리한 상황에서, 학이 날개를 펼친 모양처럼 함대를 넓게 벌려 적을 ' +
    '가운데로 유인한 뒤 양쪽 날개로 감싸듯 둘러싸 크게 승리했습니다. 대형 하나를 ' +
    '어떻게 짜느냐가 실제로 전쟁의 승패를 갈랐던 셈입니다.',
};

// [놀이 방식 다양화] "정지된 모양을 맞춘다"는 점은 같아도, 맞추는 '방법'까지 전부
// 드래그 하나로 통일하면 또 똑같아져 버린다 — 실제로 사람들이 쓰는 여러 표현
// ("퍼즐처럼 맞춰보세요", "한번 그려볼래요?", "말을 움직여 보세요") 그대로, 진법마다
// 서로 다른 조작 방식을 준다.
//   원진   → pieceMove  (바둑알/장기말처럼 짚은 뒤 다음 자리를 짚어 옮기기)
//   일자진 → puzzleFit  (퍼즐 조각처럼 드래그해서 제자리에 맞추기)
//   기와밟기 → drawMatch (제한 시간 안에 손으로 직접 그 모양을 그려보기)
//   학익진 → wingMirror (한쪽 날개를 움직이면 반대쪽이 거울처럼 같이 벌어지기 —
//            "좌우가 동시에" 벌어져야 한다는 양쪽 날개의 실제 특징을 조작 자체로 표현)
//   방진   → puzzleFit  (모서리부터 맞추는 퍼즐)
function formationTemplate(id, n = 48) {
  switch (id) {
    case 'iljajin':
      return linePositions(n);
    case 'giwa':
      return archPositions(n);
    case 'hagikjin':
      return craneWingPositions(n);
    case 'bangjin':
      return squarePositions(n);
    case 'wonjin':
      return circlePositions(n);
    default:
      return null;
  }
}
export { formationTemplate };

export const FORMATIONS = [
  {
    id: 'wonjin',
    name: '원진(圓陣)',
    tag: '풍물',
    level: 'easy',
    mechanic: 'pieceMove',
    description:
      '풍물(농악)에서 가장 기본이 되는 대형으로, 모두가 둥글게 둘러서서 중심을 향해 호흡을 맞추는 형태입니다. 나와 남이 하나의 원 안에서 이어져 있다는 공동체 의식을 담고 있습니다.',
    positions: circlePositions(8),
    tip: '처음 배우는 사람에게는 "둥글게 서는 것"보다 "옆 사람과의 간격을 똑같이 맞추는 것"부터 강조하세요. 간격이 들쭉날쭉하면 원이 아니라 찌그러진 타원으로 보입니다.',
  },
  {
    id: 'eulja',
    name: '을자진(乙字陣)',
    tag: '풍물',
    level: 'easy',
    // [놀이 방식 재설계] 다른 진법은 정지된 모양에 사람을 가져다 놓으면 끝이지만,
    // 을자진의 진짜 핵심은 "멈추지 않고 계속 흘러가는 움직임" 그 자체다 — 그래서
    // 이 진법만 드래그로 자리를 맞추는 게 아니라, 앞사람(머리)을 실시간으로 조종하면
        // 뒷사람들이 몇 박자 늦게 그 자취를 그대로 따라오는 "흐름형" 놀이로 만든다.
    mechanic: 'flowSnake',
    description:
      '한자 \'을(乙)\'자처럼 구불구불하게 줄을 지어 움직이는 대형입니다. 좁은 길이나 마당을 돌 때 쓰이며, 멈춰 있지 않고 계속 흘러가는 움직임 자체가 특징입니다.',
    positions: euljaPathPositions(8),
    tip: '정지된 모양을 외우게 하지 말고, 앞사람 뒤꿈치를 따라간다는 느낌으로 "흐름"을 먼저 몸에 붙이게 하세요. 곡선의 꼭짓점에서 속도를 살짝 늦추면 줄이 끊기지 않습니다.',
  },
  {
    id: 'iljajin',
    name: '일자진(一字陣)',
    tag: '역사 진법',
    level: 'easy',
    mechanic: 'puzzleFit',
    description:
      '한 일(一)자처럼 가로로 길게 늘어서는 가장 단순하면서도 기본이 되는 대형으로, 넓은 전선을 펼치거나 행렬을 이룰 때 사용되었습니다.',
    positions: linePositions(10),
    tip: '가장 단순해 보이지만 "간격을 일정하게" 유지하는 게 의외로 어렵습니다. 양 끝 사람을 먼저 세우고 가운데 사람들이 그 사이를 등분하도록 지도하면 훨씬 빨리 맞습니다.',
  },
  {
    id: 'gosari',
    name: '고사리꺾기',
    tag: '강강술래',
    level: 'hard',
    // [놀이 방식 재설계] 실제 고사리꺾기는 다 같이 동시에 자리를 바꾸는 게 아니라,
    // 손 잡고 앉은 줄에서 맨 앞사람부터 "한 명씩 차례로" 옆 사람 팔 위를 타고
    // 넘어가야 줄이 안으로 말려든다(선후창으로 "고사리 대사리 꺾자" 메기고 받으며
    // 한 명씩 넘어가는 실제 진행 방식). 그래서 동시 드래그가 아니라, 차례를 지켜
    // 한 명씩 순서대로 넘기는 놀이로 만든다.
    mechanic: 'sequentialVault',
    description:
      '강강술래에서 손을 잡은 줄이 고사리순처럼 안으로 돌돌 말려 들어가는 대형입니다. 선두부터 한 명씩 차례로 옆 사람 팔 위를 넘어가면서 줄 전체가 안으로 감겨듭니다.',
    positions: spiralPositions(10),
    tip: '안으로 말려 들어갈 때 맨 앞사람이 속도를 내면 뒷사람이 못 따라와 줄이 끊어집니다. 실제 놀이처럼 "차례를 지켜 한 명씩" 넘어가야 한다는 걸 강조하세요.',
  },
  {
    id: 'giwa',
    name: '기와밟기',
    tag: '강강술래',
    level: 'hard',
    mechanic: 'drawMatch',
    closed: false,
    description:
      '허리를 숙인 사람들의 등을 줄줄이 밟고 지나가는 강강술래 놀이로, 완만하게 휘어진 다리(아치) 모양의 줄을 이룹니다.',
    positions: archPositions(10),
    tip: '아치의 양 끝(시작과 끝)이 너무 낮으면 다리가 아니라 일자로 보입니다. 가운데는 낮게, 양 끝은 눈높이에 가깝게 — 이 높이 차이를 먼저 눈으로 보여주고 시작하세요.',
  },
  {
    id: 'hagikjin',
    name: '학익진(鶴翼陣)',
    tag: '역사 진법',
    level: 'hard',
    mechanic: 'wingMirror',
    description:
      '이순신 장군이 한산도 대첩에서 사용한 것으로 유명한 대형으로, 학이 날개를 펼친 모습처럼 가운데에서 좌우로 넓게 벌어져 상대를 감싸듯 에워쌉니다.',
    positions: craneWingPositions(10),
    tip: '양쪽 날개가 같은 속도로 벌어지지 않으면 학이 아니라 한쪽으로 기운 모양이 됩니다. 가운데 사람을 기준점으로 두고 "좌우 동시에" 벌어지는 연습을 먼저 시키세요.',
  },
  {
    id: 'bangjin',
    name: '방진(方陣)',
    tag: '역사 진법',
    level: 'hard',
    mechanic: 'puzzleFit',
    description:
      '사각형 모양으로 사방을 빈틈없이 두르는 대형입니다. 어느 방향에서 공격이 와도 바로 대응할 수 있도록 짜인, 안정과 수비를 상징하는 진법입니다.',
    positions: squarePositions(12),
    tip: '네 변의 인원을 똑같이 나누는 게 핵심입니다. 모서리 자리부터 먼저 채우고 그 사이를 균등하게 나눠 세우면, 숫자를 세지 않아도 자연스럽게 네 변이 고르게 맞춰집니다.',
  },
];

export const OHANG = [
  { key: 'mok', label: '목(木)', color: '#6b8f3c', hint: '뻗어나가는' },
  { key: 'hwa', label: '화(火)', color: '#c1592f', hint: '타오르는' },
  { key: 'to', label: '토(土)', color: '#b08a4a', hint: '묵직한' },
  { key: 'geum', label: '금(金)', color: '#9aa0a8', hint: '단단한' },
  { key: 'su', label: '수(水)', color: '#3f6f8f', hint: '유연한' },
];

// [오늘의 기운] 날짜+시간 → 일진/시주 오행 (전통 계산; 일진 (JDN+49)%60·甲子=0, 시주 오자둔법)
// 천간 오행: 갑을 木, 병정 火, 무기 土, 경신 金, 임계 水
const _CHEON_OH = ['목', '목', '화', '화', '토', '토', '금', '금', '수', '수'];
function _jdn(y, m, d) {
  const a = ((14 - m) / 12) | 0, yy = y + 4800 - a, mm = m + 12 * a - 3;
  return d + (((153 * mm + 2) / 5) | 0) + 365 * yy + ((yy / 4) | 0) - ((yy / 100) | 0) + ((yy / 400) | 0) - 32045;
}
function _dayGan(date) {
  const J = _jdn(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return ((((J + 49) % 60) + 60) % 60) % 10; // 일간(日干) index, 갑=0
}
const _OH2KEY = { 목: 'mok', 화: 'hwa', 토: 'to', 금: 'geum', 수: 'su' };

// [오늘의 기운] 지금 이 시각의 기운 — 로그인한 시각(시주)이 반영된다. 안 바꾸면 이 값이 기본값.
export function nowOhangKey(date = new Date()) {
  const dgan = _dayGan(date);
  const s = Math.floor((date.getHours() + 1) / 2) % 12; // 시지(자시 = 23~01시)
  const jaGan = ((dgan % 5) * 2) % 10; // 오자둔법: 일간으로 정해지는 자시 천간
  const sgan = (jaGan + s) % 10; // 이 시의 천간
  return _OH2KEY[_CHEON_OH[sgan]];
}

export function pickTodayOhang(date = new Date()) {
  return ohangByKey(nowOhangKey(date));
}

// [오늘의 기운 선택 기능] key로 OHANG 항목을 찾는다 — 못 찾으면(저장된 값이 없거나
// 깨졌으면) 첫 번째 항목으로 안전하게 대체한다.
export function ohangByKey(key) {
  return OHANG.find((o) => o.key === key) || OHANG[0];
}
