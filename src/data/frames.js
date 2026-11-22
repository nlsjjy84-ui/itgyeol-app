// 합체 틀 — 유물 조각이 날아와 끼워지는 "설계도".
// 좌표는 1000×1000 무대 기준(가운데 500,500). w = 조각의 긴 변이 차지할 길이.
// axis: 'v' 조각을 세로로 세움, 'h' 가로로 눕힘, 'a' 생긴 그대로.
// order: 합체 순서(작을수록 먼저). 옛 합체 로봇 만화처럼 몸통이 먼저 자리 잡고, 머리는 늘 마지막에 나온다.
// 같은 slot이 둘이면(왼쪽·오른쪽) 같은 조각을 거울처럼 뒤집어 쓴다(flip).

export const SLOT_INFO = {
  머리: { icon: '●', say: '생각하고 앞을 본다' },
  눈: { icon: '◉', say: '멀리까지 본다' },
  '뿔·관': { icon: '▲', say: '빛을 모은다' },
  몸통: { icon: '■', say: '모든 조각을 붙잡는다' },
  가슴판: { icon: '◆', say: '가운데를 지킨다' },
  어깨: { icon: '◢', say: '팔을 받친다' },
  팔: { icon: '┃', say: '들고 뻗는다' },
  손: { icon: '✋', say: '잡고 쥔다' },
  다리: { icon: '‖', say: '버티고 걷는다' },
  '발·받침': { icon: '▬', say: '땅을 딛는다' },
  바퀴: { icon: '○', say: '굴러 나아간다' },
  날개: { icon: '◁', say: '바람을 탄다' },
  꼬리: { icon: '∿', say: '방향을 잡는다' },
  추진기: { icon: '▼', say: '힘껏 밀어낸다' },
  무기: { icon: '／', say: '나쁜 기운을 막는다' },
  방패: { icon: '◎', say: '막아 준다' },
  '돛·깃발': { icon: '⚑', say: '바람을 받는다' },
  뱃머리: { icon: '➤', say: '물결을 가른다' },
  장식: { icon: '✦', say: '반짝이며 힘을 더한다' },
  탑승자: { icon: '☺', say: '함께 타고 이끈다' },
};
export const SLOT_NAMES = Object.keys(SLOT_INFO);

export const FRAMES = [
  {
    id: 'guardian',
    name: '수호 장군',
    kind: '로봇',
    desc: '팔다리가 있는 커다란 지킴이. 칼과 방패를 든다.',
    bg: '#20303c',
    slots: [
      { key: 'body', slot: '몸통', x: 500, y: 430, w: 330, axis: 'v', order: 0 },
      { key: 'legL', slot: '다리', x: 420, y: 700, w: 230, axis: 'v', order: 1 },
      { key: 'legR', slot: '다리', x: 580, y: 700, w: 230, axis: 'v', order: 1, flip: true },
      { key: 'footL', slot: '발·받침', x: 400, y: 880, w: 170, axis: 'h', order: 2 },
      { key: 'footR', slot: '발·받침', x: 600, y: 880, w: 170, axis: 'h', order: 2, flip: true },
      { key: 'chest', slot: '가슴판', x: 500, y: 400, w: 170, axis: 'a', order: 3, z: 2 },
      { key: 'shL', slot: '어깨', x: 320, y: 300, w: 190, axis: 'h', rot: -18, order: 4 },
      { key: 'shR', slot: '어깨', x: 680, y: 300, w: 190, axis: 'h', rot: 18, order: 4, flip: true },
      { key: 'armL', slot: '팔', x: 255, y: 470, w: 230, axis: 'v', order: 5 },
      { key: 'armR', slot: '팔', x: 745, y: 470, w: 230, axis: 'v', order: 5, flip: true },
      { key: 'weapon', slot: '무기', x: 830, y: 450, w: 430, axis: 'v', rot: 24, order: 6, z: 3 },
      { key: 'shield', slot: '방패', x: 190, y: 560, w: 230, axis: 'a', order: 6, z: 3 },
      { key: 'crown', slot: '뿔·관', x: 500, y: 85, w: 190, axis: 'a', order: 7 },
      { key: 'head', slot: '머리', x: 500, y: 195, w: 190, axis: 'a', order: 9, z: 2 },
    ],
  },
  {
    id: 'skyship',
    name: '하늘배',
    kind: '비행선',
    desc: '날개를 펴고 구름 위를 나는 배. 꽁무니에서 불이 뿜어져 나온다.',
    bg: '#1d3550',
    slots: [
      { key: 'body', slot: '몸통', x: 500, y: 520, w: 520, axis: 'h', order: 0 },
      { key: 'thrust', slot: '추진기', x: 175, y: 530, w: 210, axis: 'h', rot: 180, order: 1, fire: true },
      { key: 'wingT', slot: '날개', x: 470, y: 330, w: 420, axis: 'h', rot: -14, order: 2 },
      { key: 'wingB', slot: '날개', x: 470, y: 715, w: 420, axis: 'h', rot: 14, order: 2, flipY: true },
      { key: 'tail', slot: '꼬리', x: 175, y: 360, w: 200, axis: 'v', rot: -25, order: 3 },
      { key: 'sail', slot: '돛·깃발', x: 560, y: 220, w: 210, axis: 'a', order: 4 },
      { key: 'eye', slot: '눈', x: 690, y: 500, w: 90, axis: 'a', order: 5, z: 3 },
      { key: 'pilot', slot: '탑승자', x: 470, y: 405, w: 150, axis: 'v', order: 6, z: 3 },
      { key: 'prow', slot: '뱃머리', x: 835, y: 505, w: 220, axis: 'a', order: 9 },
    ],
  },
  {
    id: 'turtle',
    name: '거북 전차',
    kind: '탈것',
    desc: '바퀴로 굴러가는 단단한 거북. 등에 대포를 얹었다.',
    bg: '#2a3326',
    slots: [
      { key: 'body', slot: '몸통', x: 500, y: 500, w: 470, axis: 'h', order: 0 },
      { key: 'w1', slot: '바퀴', x: 300, y: 735, w: 150, axis: 'a', order: 1 },
      { key: 'w2', slot: '바퀴', x: 440, y: 755, w: 150, axis: 'a', order: 1 },
      { key: 'w3', slot: '바퀴', x: 580, y: 755, w: 150, axis: 'a', order: 1 },
      { key: 'w4', slot: '바퀴', x: 720, y: 735, w: 150, axis: 'a', order: 1 },
      { key: 'back', slot: '가슴판', x: 480, y: 355, w: 300, axis: 'h', order: 2, z: 2 },
      { key: 'gun', slot: '무기', x: 600, y: 245, w: 380, axis: 'h', rot: -12, order: 3 },
      { key: 'tail', slot: '꼬리', x: 175, y: 520, w: 170, axis: 'h', rot: 160, order: 4 },
      { key: 'pilot', slot: '탑승자', x: 400, y: 250, w: 140, axis: 'v', order: 5, z: 3 },
      { key: 'head', slot: '머리', x: 835, y: 470, w: 200, axis: 'a', order: 9 },
    ],
  },
  {
    id: 'beast',
    name: '상상 신수',
    kind: '동물',
    desc: '날개와 뿔이 달린 상상의 동물. 네 다리로 달린다.',
    bg: '#3a2630',
    slots: [
      { key: 'body', slot: '몸통', x: 470, y: 480, w: 430, axis: 'h', order: 0 },
      { key: 'l1', slot: '다리', x: 300, y: 720, w: 210, axis: 'v', order: 1 },
      { key: 'l2', slot: '다리', x: 400, y: 735, w: 210, axis: 'v', order: 1, flip: true },
      { key: 'l3', slot: '다리', x: 560, y: 735, w: 210, axis: 'v', order: 1 },
      { key: 'l4', slot: '다리', x: 660, y: 720, w: 210, axis: 'v', order: 1, flip: true },
      { key: 'wing', slot: '날개', x: 440, y: 265, w: 420, axis: 'h', rot: -20, order: 2 },
      { key: 'tail', slot: '꼬리', x: 160, y: 370, w: 260, axis: 'v', rot: -35, order: 3 },
      { key: 'orn', slot: '장식', x: 470, y: 470, w: 130, axis: 'a', order: 4, z: 3 },
      { key: 'horn', slot: '뿔·관', x: 825, y: 195, w: 170, axis: 'a', rot: 10, order: 5 },
      { key: 'head', slot: '머리', x: 790, y: 330, w: 230, axis: 'a', order: 9, z: 2 },
    ],
  },
  {
    id: 'seaship',
    name: '바다배',
    kind: '배',
    desc: '돛을 높이 올린 배. 노를 저어 파도를 넘는다.',
    bg: '#183a44',
    slots: [
      { key: 'body', slot: '몸통', x: 500, y: 630, w: 560, axis: 'h', order: 0 },
      { key: 'oar1', slot: '팔', x: 370, y: 790, w: 230, axis: 'v', rot: -30, order: 1 },
      { key: 'oar2', slot: '팔', x: 600, y: 790, w: 230, axis: 'v', rot: -30, order: 1 },
      { key: 'sail1', slot: '돛·깃발', x: 420, y: 330, w: 330, axis: 'a', order: 2 },
      { key: 'sail2', slot: '돛·깃발', x: 650, y: 380, w: 240, axis: 'a', order: 2 },
      { key: 'shield', slot: '방패', x: 300, y: 600, w: 130, axis: 'a', order: 3, z: 3 },
      { key: 'orn', slot: '장식', x: 520, y: 115, w: 120, axis: 'a', order: 4 },
      { key: 'pilot', slot: '탑승자', x: 560, y: 520, w: 140, axis: 'v', order: 5, z: 3 },
      { key: 'prow', slot: '뱃머리', x: 860, y: 590, w: 230, axis: 'a', order: 9 },
    ],
  },
];

// 변형 — 유물 하나가 스스로 모양을 바꾼다(접히고 펴지며 날개·꼬리·불꽃이 돋는다).
// 같은 조각을 여러 번 복제해 각도·크기를 바꿔 쓰므로, 유물 하나만으로 새 탈것이 된다.
export const TRANSFORMS = [
  {
    id: 'rocket',
    name: '하늘 로켓',
    kind: '변형',
    desc: '유물이 세로로 서고, 양옆에 같은 유물이 날개로 펼쳐지며 꽁무니에 불이 붙는다.',
    bg: '#14233a',
    parts: [
      { key: 'core', x: 500, y: 470, w: 460, axis: 'v', order: 0 },
      { key: 'finL', x: 330, y: 650, w: 260, axis: 'v', rot: -32, order: 1, squash: 0.55 },
      { key: 'finR', x: 670, y: 650, w: 260, axis: 'v', rot: 32, order: 1, squash: 0.55, flip: true },
      { key: 'nose', x: 500, y: 165, w: 150, axis: 'a', order: 2, z: 3 },
      { key: 'flame', x: 500, y: 860, w: 160, axis: 'v', order: 3, fire: true, ghost: true },
    ],
  },
  {
    id: 'bird',
    name: '날개새',
    kind: '변형',
    desc: '유물이 몸이 되고, 같은 유물이 커다란 두 날개와 꼬리로 갈라져 날아오른다.',
    bg: '#24324a',
    parts: [
      { key: 'core', x: 500, y: 500, w: 330, axis: 'h', order: 0 },
      { key: 'wingL', x: 300, y: 330, w: 400, axis: 'h', rot: 28, order: 1, squash: 0.5, flipY: true },
      { key: 'wingR', x: 700, y: 330, w: 400, axis: 'h', rot: -28, order: 1, squash: 0.5, flip: true, flipY: true },
      { key: 'tail', x: 500, y: 760, w: 260, axis: 'v', order: 2, squash: 0.45 },
      { key: 'head', x: 500, y: 330, w: 140, axis: 'a', order: 3, z: 3 },
    ],
  },
  {
    id: 'walker',
    name: '걷는 보초',
    kind: '변형',
    desc: '유물이 몸통이 되고 같은 유물이 두 다리와 두 팔로 접혀 나와 걸어 다닌다.',
    bg: '#2b2a22',
    parts: [
      { key: 'core', x: 500, y: 420, w: 360, axis: 'v', order: 0 },
      { key: 'legL', x: 420, y: 740, w: 280, axis: 'v', order: 1, squash: 0.4 },
      { key: 'legR', x: 580, y: 740, w: 280, axis: 'v', order: 1, squash: 0.4, flip: true },
      { key: 'armL', x: 290, y: 430, w: 250, axis: 'v', rot: 20, order: 2, squash: 0.35 },
      { key: 'armR', x: 710, y: 430, w: 250, axis: 'v', rot: -20, order: 2, squash: 0.35, flip: true },
      { key: 'head', x: 500, y: 170, w: 150, axis: 'a', order: 3, z: 3 },
    ],
  },
];


// ── 더 많은 합체 틀
FRAMES.push(
  {
    id: 'jet', name: '제트기', kind: '비행기', desc: '양 날개를 쭉 편 빠른 비행기. 꼬리 날개 둘과 불꽃 둘.', bg: '#17283d',
    slots: [
      { key: 'body', slot: '몸통', x: 500, y: 500, w: 560, axis: 'v', order: 0 },
      { key: 'wingL', slot: '날개', x: 300, y: 520, w: 380, axis: 'h', rot: 20, order: 1 },
      { key: 'wingR', slot: '날개', x: 700, y: 520, w: 380, axis: 'h', rot: -20, order: 1, flip: true },
      { key: 'tailL', slot: '꼬리', x: 410, y: 800, w: 190, axis: 'h', rot: 25, order: 2 },
      { key: 'tailR', slot: '꼬리', x: 590, y: 800, w: 190, axis: 'h', rot: -25, order: 2, flip: true },
      { key: 'thL', slot: '추진기', x: 450, y: 900, w: 130, axis: 'v', order: 3, fire: true },
      { key: 'thR', slot: '추진기', x: 550, y: 900, w: 130, axis: 'v', order: 3, fire: true, flip: true },
      { key: 'pilot', slot: '탑승자', x: 500, y: 380, w: 120, axis: 'v', order: 4, z: 3 },
      { key: 'head', slot: '뱃머리', x: 500, y: 165, w: 190, axis: 'v', order: 9 },
    ],
  },
  {
    id: 'submarine', name: '잠수함', kind: '배', desc: '바닷속을 가르는 둥근 배. 둥근 창으로 물고기를 본다.', bg: '#0f2d3b',
    slots: [
      { key: 'body', slot: '몸통', x: 480, y: 540, w: 600, axis: 'h', order: 0 },
      { key: 'tower', slot: '가슴판', x: 500, y: 345, w: 220, axis: 'v', order: 1 },
      { key: 'win1', slot: '눈', x: 380, y: 545, w: 100, axis: 'a', order: 2, z: 3 },
      { key: 'win2', slot: '눈', x: 520, y: 545, w: 100, axis: 'a', order: 2, z: 3 },
      { key: 'fin', slot: '꼬리', x: 130, y: 540, w: 220, axis: 'v', order: 3 },
      { key: 'prop', slot: '바퀴', x: 105, y: 545, w: 130, axis: 'a', order: 4, z: 3, spin: true },
      { key: 'scope', slot: '뿔·관', x: 520, y: 200, w: 150, axis: 'v', order: 5 },
      { key: 'prow', slot: '뱃머리', x: 840, y: 540, w: 200, axis: 'a', order: 9 },
    ],
  },
  {
    id: 'train', name: '기차', kind: '탈것', desc: '연기를 뿜는 기관차와 바퀴 여섯 개.', bg: '#2b2620',
    slots: [
      { key: 'body', slot: '몸통', x: 470, y: 520, w: 520, axis: 'h', order: 0 },
      { key: 'cab', slot: '가슴판', x: 250, y: 410, w: 230, axis: 'v', order: 1 },
      { key: 'chim', slot: '추진기', x: 640, y: 300, w: 200, axis: 'v', order: 2, smoke: true },
      { key: 'w1', slot: '바퀴', x: 230, y: 740, w: 130, axis: 'a', order: 3, spin: true },
      { key: 'w2', slot: '바퀴', x: 380, y: 740, w: 130, axis: 'a', order: 3, spin: true },
      { key: 'w3', slot: '바퀴', x: 530, y: 740, w: 130, axis: 'a', order: 3, spin: true },
      { key: 'w4', slot: '바퀴', x: 680, y: 740, w: 130, axis: 'a', order: 3, spin: true },
      { key: 'pilot', slot: '탑승자', x: 250, y: 380, w: 110, axis: 'v', order: 4, z: 3 },
      { key: 'head', slot: '뱃머리', x: 830, y: 560, w: 200, axis: 'a', order: 9 },
    ],
  },
  {
    id: 'drone', name: '네날개 드론', kind: '비행기', desc: '네 귀퉁이 바람개비로 떠오르는 날틀.', bg: '#1b2a36',
    slots: [
      { key: 'body', slot: '몸통', x: 500, y: 500, w: 300, axis: 'a', order: 0 },
      { key: 'arm1', slot: '팔', x: 330, y: 330, w: 260, axis: 'h', rot: 45, order: 1 },
      { key: 'arm2', slot: '팔', x: 670, y: 330, w: 260, axis: 'h', rot: -45, order: 1, flip: true },
      { key: 'arm3', slot: '팔', x: 330, y: 670, w: 260, axis: 'h', rot: -45, order: 1 },
      { key: 'arm4', slot: '팔', x: 670, y: 670, w: 260, axis: 'h', rot: 45, order: 1, flip: true },
      { key: 'r1', slot: '바퀴', x: 190, y: 190, w: 200, axis: 'a', order: 2, spin: true },
      { key: 'r2', slot: '바퀴', x: 810, y: 190, w: 200, axis: 'a', order: 2, spin: true },
      { key: 'r3', slot: '바퀴', x: 190, y: 810, w: 200, axis: 'a', order: 2, spin: true },
      { key: 'r4', slot: '바퀴', x: 810, y: 810, w: 200, axis: 'a', order: 2, spin: true },
      { key: 'head', slot: '눈', x: 500, y: 500, w: 130, axis: 'a', order: 9, z: 3 },
    ],
  },
  {
    id: 'car', name: '달리는 수레', kind: '자동차', desc: '네 바퀴로 달리는 날렵한 수레.', bg: '#262a31',
    slots: [
      { key: 'body', slot: '몸통', x: 500, y: 540, w: 600, axis: 'h', order: 0 },
      { key: 'roof', slot: '가슴판', x: 470, y: 380, w: 300, axis: 'h', order: 1 },
      { key: 'wF', slot: '바퀴', x: 720, y: 720, w: 180, axis: 'a', order: 2, spin: true },
      { key: 'wB', slot: '바퀴', x: 280, y: 720, w: 180, axis: 'a', order: 2, spin: true },
      { key: 'spoil', slot: '날개', x: 190, y: 400, w: 200, axis: 'h', rot: 10, order: 3 },
      { key: 'exh', slot: '추진기', x: 120, y: 600, w: 120, axis: 'h', rot: 180, order: 3, fire: true },
      { key: 'light', slot: '눈', x: 850, y: 520, w: 90, axis: 'a', order: 4, z: 3 },
      { key: 'driver', slot: '탑승자', x: 520, y: 330, w: 110, axis: 'v', order: 5, z: 3 },
      { key: 'head', slot: '장식', x: 500, y: 260, w: 120, axis: 'a', order: 9 },
    ],
  },
  {
    id: 'dragon', name: '구름 용', kind: '동물', desc: '구름 사이를 굽이치는 긴 용. 마디마다 다른 유물.', bg: '#1f2238',
    slots: [
      { key: 's1', slot: '몸통', x: 650, y: 420, w: 230, axis: 'a', order: 0 },
      { key: 's2', slot: '몸통', x: 500, y: 520, w: 220, axis: 'a', order: 1 },
      { key: 's3', slot: '가슴판', x: 360, y: 450, w: 200, axis: 'a', order: 2 },
      { key: 's4', slot: '장식', x: 240, y: 560, w: 170, axis: 'a', order: 3 },
      { key: 'tail', slot: '꼬리', x: 120, y: 680, w: 220, axis: 'v', rot: 40, order: 4 },
      { key: 'claw1', slot: '손', x: 600, y: 620, w: 140, axis: 'a', order: 5 },
      { key: 'claw2', slot: '손', x: 380, y: 610, w: 140, axis: 'a', order: 5, flip: true },
      { key: 'horn', slot: '뿔·관', x: 820, y: 170, w: 170, axis: 'a', order: 6 },
      { key: 'head', slot: '머리', x: 800, y: 300, w: 240, axis: 'a', order: 9, z: 3 },
    ],
  },
  {
    id: 'fortress', name: '움직이는 성', kind: '요새', desc: '성벽과 망루, 깃발을 올린 걸어 다니는 성.', bg: '#2a2524',
    slots: [
      { key: 'body', slot: '몸통', x: 500, y: 520, w: 420, axis: 'a', order: 0 },
      { key: 'towerL', slot: '추진기', x: 270, y: 430, w: 300, axis: 'v', order: 1 },
      { key: 'towerR', slot: '추진기', x: 730, y: 430, w: 300, axis: 'v', order: 1, flip: true },
      { key: 'roof', slot: '날개', x: 500, y: 270, w: 420, axis: 'h', order: 2 },
      { key: 'flagL', slot: '돛·깃발', x: 270, y: 200, w: 160, axis: 'a', order: 3 },
      { key: 'flagR', slot: '돛·깃발', x: 730, y: 200, w: 160, axis: 'a', order: 3, flip: true },
      { key: 'legL', slot: '다리', x: 400, y: 830, w: 200, axis: 'v', order: 4 },
      { key: 'legR', slot: '다리', x: 600, y: 830, w: 200, axis: 'v', order: 4, flip: true },
      { key: 'gate', slot: '방패', x: 500, y: 560, w: 160, axis: 'a', order: 5, z: 3 },
      { key: 'head', slot: '뿔·관', x: 500, y: 120, w: 170, axis: 'a', order: 9 },
    ],
  },
  {
    id: 'suit', name: '갑옷 입기', kind: '갑옷', desc: '조각이 하나씩 날아와 사람 몸에 철컥 달라붙어 갑옷이 된다.', bg: '#2a1f22', person: true,
    slots: [
      { key: 'chest', slot: '가슴판', x: 500, y: 400, w: 230, axis: 'a', order: 0, z: 2 },
      { key: 'belt', slot: '장식', x: 500, y: 545, w: 210, axis: 'h', order: 1, z: 2 },
      { key: 'shL', slot: '어깨', x: 375, y: 315, w: 160, axis: 'h', rot: -15, order: 2, z: 2 },
      { key: 'shR', slot: '어깨', x: 625, y: 315, w: 160, axis: 'h', rot: 15, order: 2, flip: true, z: 2 },
      { key: 'armL', slot: '팔', x: 330, y: 470, w: 200, axis: 'v', order: 3, z: 2 },
      { key: 'armR', slot: '팔', x: 670, y: 470, w: 200, axis: 'v', order: 3, flip: true, z: 2 },
      { key: 'legL', slot: '다리', x: 450, y: 730, w: 230, axis: 'v', order: 4, z: 2 },
      { key: 'legR', slot: '다리', x: 550, y: 730, w: 230, axis: 'v', order: 4, flip: true, z: 2 },
      { key: 'back', slot: '날개', x: 500, y: 380, w: 460, axis: 'h', order: 5, z: 0 },
      { key: 'head', slot: '머리', x: 500, y: 190, w: 170, axis: 'a', order: 9, z: 3 },
    ],
  },
  {
    id: 'haechi', name: '해치 수호수', kind: '동물', desc: '옳고 그름을 가린다는 상상 동물 해치. 뿔 하나와 갈기.', bg: '#33261f',
    slots: [
      { key: 'body', slot: '몸통', x: 470, y: 520, w: 420, axis: 'h', order: 0 },
      { key: 'l1', slot: '발·받침', x: 300, y: 780, w: 170, axis: 'a', order: 1 },
      { key: 'l2', slot: '발·받침', x: 640, y: 780, w: 170, axis: 'a', order: 1, flip: true },
      { key: 'mane', slot: '장식', x: 700, y: 400, w: 220, axis: 'a', order: 2 },
      { key: 'tail', slot: '꼬리', x: 170, y: 400, w: 240, axis: 'v', rot: -30, order: 3 },
      { key: 'shield', slot: '가슴판', x: 560, y: 560, w: 140, axis: 'a', order: 4, z: 3 },
      { key: 'horn', slot: '뿔·관', x: 840, y: 180, w: 150, axis: 'v', order: 5 },
      { key: 'head', slot: '머리', x: 800, y: 310, w: 230, axis: 'a', order: 9, z: 3 },
    ],
  },
  {
    id: 'station', name: '별빛 정거장', kind: '우주', desc: '가운데 고리를 두고 네 방향으로 팔을 뻗은 우주 정거장.', bg: '#0d1424', stars: true,
    slots: [
      { key: 'body', slot: '바퀴', x: 500, y: 500, w: 300, axis: 'a', order: 0, spin: true },
      { key: 'core', slot: '몸통', x: 500, y: 500, w: 160, axis: 'a', order: 1, z: 3 },
      { key: 'panL', slot: '날개', x: 200, y: 500, w: 300, axis: 'h', order: 2 },
      { key: 'panR', slot: '날개', x: 800, y: 500, w: 300, axis: 'h', order: 2, flip: true },
      { key: 'top', slot: '추진기', x: 500, y: 200, w: 220, axis: 'v', order: 3 },
      { key: 'bot', slot: '추진기', x: 500, y: 800, w: 220, axis: 'v', order: 3, flipY: true },
      { key: 'ant', slot: '뿔·관', x: 680, y: 260, w: 150, axis: 'a', rot: 35, order: 4 },
      { key: 'head', slot: '눈', x: 330, y: 330, w: 110, axis: 'a', order: 9 },
    ],
  },
  {
    id: 'lighthouse', name: '바닷가 등대', kind: '건물', desc: '층층이 쌓아 올린 등대. 꼭대기에서 빛이 돈다.', bg: '#13263a',
    slots: [
      { key: 'base', slot: '발·받침', x: 500, y: 860, w: 360, axis: 'h', order: 0 },
      { key: 'f1', slot: '몸통', x: 500, y: 680, w: 300, axis: 'v', order: 1 },
      { key: 'f2', slot: '몸통', x: 500, y: 470, w: 250, axis: 'v', order: 2 },
      { key: 'rail', slot: '장식', x: 500, y: 330, w: 220, axis: 'h', order: 3 },
      { key: 'lamp', slot: '눈', x: 500, y: 240, w: 140, axis: 'a', order: 4, z: 3, beam: true },
      { key: 'head', slot: '뿔·관', x: 500, y: 120, w: 160, axis: 'a', order: 9 },
    ],
  },
);

// ── 더 많은 변형 — 같은 유물 하나를 복제해 각도·크기를 바꿔 새 모양을 만든다
const ring = (n, r, w, extra = {}) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { key: 'p' + i, x: 500 + Math.cos(a) * r, y: 500 + Math.sin(a) * r, w, axis: 'v', rot: (a * 180) / Math.PI + 90, order: 1 + (i % 2), squash: 0.6, ...extra };
  });
const chain = (n) =>
  Array.from({ length: n }, (_, i) => {
    const f = i / (n - 1);
    return { key: 'c' + i, x: 830 - f * 680, y: 420 + Math.sin(f * Math.PI * 2.2) * 170, w: 260 - f * 150, axis: 'a', rot: Math.cos(f * Math.PI * 2.2) * 30, order: i < 2 ? 0 : 1 + Math.floor(i / 3), z: n - i };
  });
TRANSFORMS.push(
  {
    id: 'sub2', name: '물속 배', kind: '변형', desc: '유물이 눕고, 같은 유물이 등지느러미와 꼬리 프로펠러가 된다.', bg: '#0f2d3b',
    parts: [
      { key: 'core', x: 500, y: 520, w: 560, axis: 'h', order: 0 },
      { key: 'fin', x: 520, y: 320, w: 220, axis: 'v', order: 1, squash: 0.5 },
      { key: 'prop', x: 160, y: 520, w: 170, axis: 'a', order: 2, squash: 0.5, spin: true },
      { key: 'nose', x: 830, y: 520, w: 130, axis: 'a', order: 3, z: 3 },
    ],
  },
  {
    id: 'car2', name: '바퀴 수레', kind: '변형', desc: '유물이 차체가 되고, 같은 유물이 둥글게 말려 두 바퀴가 된다.', bg: '#262a31',
    parts: [
      { key: 'core', x: 500, y: 470, w: 600, axis: 'h', order: 0 },
      { key: 'wF', x: 720, y: 700, w: 190, axis: 'a', order: 1, round: true, spin: true },
      { key: 'wB', x: 280, y: 700, w: 190, axis: 'a', order: 1, round: true, spin: true },
      { key: 'top', x: 480, y: 300, w: 220, axis: 'h', order: 2, squash: 0.5 },
    ],
  },
  {
    id: 'drone2', name: '바람개비 날틀', kind: '변형', desc: '같은 유물 넷이 바람개비 날개처럼 돌며 떠오른다.', bg: '#1b2a36',
    parts: [
      { key: 'core', x: 500, y: 500, w: 260, axis: 'a', order: 0, z: 3 },
      ...ring(4, 250, 260, { spinAll: true }),
    ],
  },
  {
    id: 'flower', name: '유물 꽃', kind: '변형', desc: '같은 유물 여덟 개가 빙 둘러 꽃잎처럼 피어난다.', bg: '#2d1f2b',
    parts: [{ key: 'core', x: 500, y: 500, w: 200, axis: 'a', order: 3, z: 3 }, ...ring(8, 230, 250)],
  },
  {
    id: 'snake', name: '마디 용', kind: '변형', desc: '같은 유물이 점점 작아지며 꼬리처럼 이어져 용이 된다.', bg: '#1f2238',
    parts: chain(8).map((p, i) => (i === 0 ? { ...p, key: 'core' } : p)),
  },
  {
    id: 'tower', name: '하늘 탑', kind: '변형', desc: '같은 유물이 차곡차곡 쌓여 탑이 된다.', bg: '#25262f',
    parts: Array.from({ length: 6 }, (_, i) => ({ key: i === 0 ? 'core' : 't' + i, x: 500, y: 860 - i * 140, w: 340 - i * 40, axis: 'h', order: i, squash: 0.55, z: i })),
  },
  {
    id: 'top', name: '도는 팽이', kind: '변형', desc: '유물이 거꾸로 서서 빙글빙글 도는 팽이가 된다.', bg: '#2b2420',
    parts: [
      { key: 'core', x: 500, y: 470, w: 420, axis: 'v', rot: 180, order: 0, spin: true },
      { key: 'ring', x: 500, y: 430, w: 440, axis: 'h', order: 1, squash: 0.35 },
      { key: 'tip', x: 500, y: 790, w: 110, axis: 'v', rot: 180, order: 2, squash: 0.5 },
    ],
  },
);


// ── 2026-11-22 더 넣은 틀 — 우리 옛 이야기·놀이에서 온 모양
FRAMES.push(
  {
    id: 'janggu', name: '장구 장군', kind: '로봇', desc: '두 북면이 마주 보는 장구 몸통에 열채·궁채를 든 팔. 장단에 맞춰 합체한다.', bg: '#2a1d1a',
    slots: [
      { key: 'drumL', slot: '몸통', x: 380, y: 480, w: 280, axis: 'a', order: 0 },
      { key: 'drumR', slot: '몸통', x: 620, y: 480, w: 280, axis: 'a', order: 0, flip: true },
      { key: 'waist', slot: '가슴판', x: 500, y: 480, w: 130, axis: 'v', order: 1, z: 3 },
      { key: 'armL', slot: '무기', x: 170, y: 360, w: 280, axis: 'v', rot: -35, order: 2 },
      { key: 'armR', slot: '무기', x: 830, y: 360, w: 280, axis: 'v', rot: 35, order: 2, flip: true },
      { key: 'legL', slot: '다리', x: 410, y: 800, w: 230, axis: 'v', order: 3 },
      { key: 'legR', slot: '다리', x: 590, y: 800, w: 230, axis: 'v', order: 3, flip: true },
      { key: 'ribbon', slot: '장식', x: 500, y: 130, w: 150, axis: 'a', order: 4, z: 1 },
      { key: 'head', slot: '머리', x: 500, y: 250, w: 200, axis: 'a', order: 9, z: 3 },
    ],
  },
  {
    id: 'tiger', name: '까치 호랑이', kind: '동물', desc: '민화 속 웃는 호랑이. 네 발로 성큼 걷고 긴 꼬리를 세운다.', bg: '#2c2418',
    slots: [
      { key: 'body', slot: '몸통', x: 480, y: 500, w: 480, axis: 'h', order: 0 },
      { key: 'f1', slot: '다리', x: 300, y: 760, w: 200, axis: 'v', order: 1 },
      { key: 'f2', slot: '다리', x: 400, y: 770, w: 200, axis: 'v', order: 1, flip: true },
      { key: 'f3', slot: '다리', x: 580, y: 770, w: 200, axis: 'v', order: 1 },
      { key: 'f4', slot: '다리', x: 680, y: 760, w: 200, axis: 'v', order: 1, flip: true },
      { key: 'tail', slot: '꼬리', x: 140, y: 330, w: 280, axis: 'v', rot: -20, order: 2 },
      { key: 'magpie', slot: '탑승자', x: 470, y: 280, w: 130, axis: 'a', order: 3, z: 2 },
      { key: 'head', slot: '머리', x: 790, y: 380, w: 250, axis: 'a', order: 9, z: 3 },
    ],
  },
  {
    id: 'phoenix', name: '오색 봉황', kind: '새', desc: '오동나무에만 앉는다는 상서로운 새. 큰 두 날개와 부채처럼 펼친 꼬리깃.', bg: '#2a1830',
    slots: [
      { key: 'body', slot: '몸통', x: 500, y: 470, w: 260, axis: 'v', order: 0 },
      { key: 'wingL', slot: '날개', x: 260, y: 360, w: 380, axis: 'h', rot: -25, order: 1 },
      { key: 'wingR', slot: '날개', x: 740, y: 360, w: 380, axis: 'h', rot: 25, order: 1, flip: true },
      { key: 't1', slot: '꼬리', x: 400, y: 800, w: 280, axis: 'v', rot: 25, order: 2 },
      { key: 't2', slot: '꼬리', x: 500, y: 830, w: 300, axis: 'v', order: 2 },
      { key: 't3', slot: '꼬리', x: 600, y: 800, w: 280, axis: 'v', rot: -25, order: 2, flip: true },
      { key: 'crest', slot: '뿔·관', x: 500, y: 110, w: 140, axis: 'a', order: 3 },
      { key: 'head', slot: '머리', x: 500, y: 230, w: 170, axis: 'a', order: 9, z: 3 },
    ],
  },
  {
    id: 'kite', name: '방패연', kind: '하늘', desc: '가운데 구멍 뚫린 네모 연. 긴 꼬리 줄이 바람에 너울댄다.', bg: '#16304a',
    slots: [
      { key: 'body', slot: '방패', x: 500, y: 380, w: 440, axis: 'a', order: 0 },
      { key: 'eye', slot: '눈', x: 500, y: 380, w: 130, axis: 'a', order: 1, z: 3 },
      { key: 'top', slot: '장식', x: 500, y: 140, w: 160, axis: 'a', order: 2 },
      { key: 'tail1', slot: '꼬리', x: 440, y: 680, w: 200, axis: 'v', rot: 15, order: 3 },
      { key: 'tail2', slot: '꼬리', x: 520, y: 800, w: 180, axis: 'v', rot: -15, order: 4, flip: true },
      { key: 'tail3', slot: '꼬리', x: 450, y: 910, w: 150, axis: 'v', rot: 15, order: 5 },
      { key: 'rider', slot: '탑승자', x: 760, y: 220, w: 120, axis: 'a', order: 9 },
    ],
  },
  {
    id: 'whale', name: '고래 잠수정', kind: '배', desc: '등에서 물을 뿜는 큰 고래 배. 지느러미 둘과 갈라진 꼬리.', bg: '#0d2a3a',
    slots: [
      { key: 'body', slot: '몸통', x: 520, y: 520, w: 580, axis: 'h', order: 0 },
      { key: 'finL', slot: '날개', x: 470, y: 700, w: 200, axis: 'h', rot: 25, order: 1 },
      { key: 'tailU', slot: '꼬리', x: 150, y: 400, w: 220, axis: 'h', rot: -35, order: 2 },
      { key: 'tailD', slot: '꼬리', x: 150, y: 620, w: 220, axis: 'h', rot: 35, order: 2, flipY: true },
      { key: 'spout', slot: '장식', x: 600, y: 210, w: 150, axis: 'v', order: 3 },
      { key: 'eye', slot: '눈', x: 760, y: 470, w: 110, axis: 'a', order: 4, z: 3 },
      { key: 'head', slot: '뱃머리', x: 840, y: 540, w: 200, axis: 'a', order: 9 },
    ],
  },
  {
    id: 'palanquin', name: '임금님 가마', kind: '탈것', desc: '지붕 얹은 가마를 네 다리가 메고 간다. 깃발이 앞장선다.', bg: '#2b2222',
    slots: [
      { key: 'box', slot: '몸통', x: 500, y: 480, w: 360, axis: 'a', order: 0 },
      { key: 'roof', slot: '날개', x: 500, y: 270, w: 460, axis: 'h', order: 1 },
      { key: 'pole', slot: '팔', x: 500, y: 600, w: 820, axis: 'h', order: 2, squash: 0.4 },
      { key: 'l1', slot: '다리', x: 220, y: 800, w: 200, axis: 'v', order: 3 },
      { key: 'l2', slot: '다리', x: 400, y: 810, w: 200, axis: 'v', order: 3, flip: true },
      { key: 'l3', slot: '다리', x: 600, y: 810, w: 200, axis: 'v', order: 3 },
      { key: 'l4', slot: '다리', x: 780, y: 800, w: 200, axis: 'v', order: 3, flip: true },
      { key: 'flag', slot: '돛·깃발', x: 880, y: 260, w: 180, axis: 'a', order: 4 },
      { key: 'king', slot: '탑승자', x: 500, y: 470, w: 140, axis: 'a', order: 9, z: 3 },
    ],
  },  {
    id: 'hwacha', name: '신기전 화차', kind: '탈것', desc: '두 바퀴 수레 위에 불화살 틀을 비스듬히 세웠다. 불꽃을 뿜으며 밤하늘로 쏘아 올린다.', bg: '#2a201c',
    slots: [
      { key: 'cart', slot: '몸통', x: 470, y: 640, w: 520, axis: 'h', order: 0 },
      { key: 'wF', slot: '바퀴', x: 690, y: 800, w: 200, axis: 'a', order: 1, spin: true },
      { key: 'wB', slot: '바퀴', x: 260, y: 800, w: 200, axis: 'a', order: 1, spin: true },
      { key: 'rack', slot: '방패', x: 520, y: 430, w: 380, axis: 'h', rot: -28, order: 2 },
      { key: 'a1', slot: '무기', x: 560, y: 240, w: 300, axis: 'v', rot: 62, order: 3, squash: 0.6 },
      { key: 'a2', slot: '무기', x: 740, y: 370, w: 300, axis: 'v', rot: 62, order: 3, squash: 0.6 },
      { key: 'fire', slot: '추진기', x: 230, y: 520, w: 150, axis: 'h', rot: 200, order: 4, fire: true },
      { key: 'flag', slot: '돛·깃발', x: 160, y: 330, w: 170, axis: 'a', order: 5 },
      { key: 'gunner', slot: '탑승자', x: 330, y: 470, w: 130, axis: 'v', order: 9, z: 3 },
    ],
  },
  {
    id: 'cheomseong', name: '첨성대 별지기', kind: '로봇', desc: '돌을 쌓은 병 모양 몸에 창문 눈이 하나. 꼭대기 우물정 머리로 밤하늘 별을 센다.', bg: '#1b2033',
    slots: [
      { key: 'base', slot: '발·받침', x: 500, y: 880, w: 520, axis: 'h', order: 0, squash: 0.6 },
      { key: 'body', slot: '몸통', x: 500, y: 600, w: 360, axis: 'v', order: 1 },
      { key: 'window', slot: '눈', x: 500, y: 560, w: 110, axis: 'a', order: 2, z: 3 },
      { key: 'neck', slot: '가슴판', x: 500, y: 340, w: 230, axis: 'h', order: 3, squash: 0.7 },
      { key: 'armL', slot: '팔', x: 250, y: 560, w: 230, axis: 'v', rot: -25, order: 4 },
      { key: 'armR', slot: '팔', x: 750, y: 560, w: 230, axis: 'v', rot: 25, order: 4, flip: true },
      { key: 'star', slot: '장식', x: 790, y: 150, w: 120, axis: 'a', order: 5 },
      { key: 'head', slot: '머리', x: 500, y: 200, w: 210, axis: 'a', order: 9, z: 3 },
    ],
  },
  {
    id: 'jangseung', name: '마을 장승', kind: '로봇', desc: '마을 어귀를 지키는 키다리 장승. 큰 눈, 높은 관, 두 팔을 벌려 길을 지킨다.', bg: '#24221d',
    slots: [
      { key: 'pole', slot: '몸통', x: 500, y: 640, w: 520, axis: 'v', order: 0 },
      { key: 'feet', slot: '발·받침', x: 500, y: 910, w: 300, axis: 'h', order: 1, squash: 0.6 },
      { key: 'armL', slot: '팔', x: 300, y: 560, w: 260, axis: 'h', rot: -15, order: 2 },
      { key: 'armR', slot: '팔', x: 700, y: 560, w: 260, axis: 'h', rot: 15, order: 2, flip: true },
      { key: 'eyeL', slot: '눈', x: 445, y: 300, w: 80, axis: 'a', order: 3, z: 5 },
      { key: 'eyeR', slot: '눈', x: 555, y: 300, w: 80, axis: 'a', order: 3, z: 5, flip: true },
      { key: 'hat', slot: '뿔·관', x: 500, y: 120, w: 220, axis: 'a', order: 4, z: 4 },
      { key: 'head', slot: '머리', x: 500, y: 290, w: 250, axis: 'a', order: 9, z: 3 },
    ],
  },
);

const arc = (n, r, w) =>
  Array.from({ length: n }, (_, i) => {
    const a = Math.PI + (i / (n - 1)) * Math.PI; // 왼쪽(180°)에서 오른쪽(360°)까지 위쪽 반원
    return { key: i === Math.floor(n / 2) ? 'core' : 'f' + i, x: 500 + Math.cos(a) * r, y: 700 + Math.sin(a) * r, w, axis: 'v', rot: (a * 180) / Math.PI + 90, order: Math.abs(i - Math.floor(n / 2)), squash: 0.7, z: n - Math.abs(i - Math.floor(n / 2)) };
  });
TRANSFORMS.push(
  {
    id: 'fan', name: '합죽선', kind: '변형', desc: '같은 유물 일곱이 아래 한 점에서 부챗살처럼 촤르륵 펼쳐진다.', bg: '#2b2420',
    parts: [...arc(7, 330, 300), { key: 'pin', x: 500, y: 700, w: 90, axis: 'a', order: 4, z: 9, round: true }],
  },
  {
    id: 'butterfly', name: '유물 나비', kind: '변형', desc: '같은 유물 넷이 위아래 두 쌍의 날개가 되고, 하나가 몸통이 된다.', bg: '#24283a',
    parts: [
      { key: 'core', x: 500, y: 500, w: 360, axis: 'v', order: 0, squash: 0.45, z: 5 },
      { key: 'uL', x: 330, y: 380, w: 300, axis: 'a', rot: -20, order: 1 },
      { key: 'uR', x: 670, y: 380, w: 300, axis: 'a', rot: 20, order: 1, flip: true },
      { key: 'dL', x: 360, y: 640, w: 220, axis: 'a', rot: 20, order: 2, flipY: true },
      { key: 'dR', x: 640, y: 640, w: 220, axis: 'a', rot: -20, order: 2, flip: true, flipY: true },
    ],
  },
  {
    id: 'star', name: '다섯 갈래 별', kind: '변형', desc: '같은 유물 다섯이 바깥을 향해 뻗어 별이 되고 천천히 돈다.', bg: '#0d1424',
    parts: [{ key: 'core', x: 500, y: 500, w: 180, axis: 'a', order: 3, z: 3, spin: true }, ...ring(5, 230, 280, { spinAll: true })],
  },
  {
    id: 'wave', name: '너울 물결', kind: '변형', desc: '같은 유물이 오르락내리락 줄지어 물결처럼 넘실댄다.', bg: '#0f2d3b',
    parts: Array.from({ length: 7 }, (_, i) => ({ key: i === 3 ? 'core' : 'w' + i, x: 110 + i * 130, y: 500 + Math.sin(i * 1.1) * 170, w: 200, axis: 'a', rot: Math.cos(i * 1.1) * 25, order: Math.abs(i - 3), flip: i % 2 === 1, z: 7 - Math.abs(i - 3), sway: i * 1.1 })),
  },
);

export const FRAME_BY_ID = Object.fromEntries([...FRAMES, ...TRANSFORMS].map((f) => [f.id, f]));
