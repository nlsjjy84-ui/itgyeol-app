// 훈민정음 · 인쇄 장면 데이터.
// 진법과 달리 조각(토큰)마다 "정해진 자리"가 있다 — 아무 자리에나 들어가면 되는 게 아니라
// 글자가 올바르게 완성되도록 제 자리를 찾아가야 한다. tokens[i]는 positions[i] 자리로 가야 한다.

function rowPositions(n) {
  // 금속활자를 한 줄로 가지런히 심는 자리
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    pts.push({ x: 0.15 + t * 0.7, y: 0.5 });
  }
  return pts;
}

function arcPositions(n) {
  // 목판을 완만한 곡선으로 늘어놓는 자리
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const x = 0.12 + t * 0.76;
    const y = 0.62 - Math.sin(t * Math.PI) * 0.32;
    pts.push({ x, y });
  }
  return pts;
}

// --- 훈민정음 자모 배열: 실제 한글 음절 조립 규칙을 간단히 따라
// 초성·중성·종성이 놓일 자리를 계산한다 ---
const VERTICAL_VOWELS = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅣ', 'ㅐ', 'ㅒ', 'ㅔ', 'ㅖ']; // 세로모음: 초성 왼쪽 + 중성 오른쪽
const HORIZONTAL_VOWELS = ['ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ']; // 가로모음: 초성 위 + 중성 아래

function vowelType(jung) {
  if (VERTICAL_VOWELS.includes(jung)) return 'vertical';
  if (HORIZONTAL_VOWELS.includes(jung)) return 'horizontal';
  return 'horizontal'; // 복합모음(ㅘ·ㅝ 등)은 단순화해서 가로모음과 같은 방식으로 배치
}

// 음절 하나(초성·중성·종성) 안에서 각 조각이 놓일 자리(그 글자 박스 안 0~1 비율)
function syllableLayout({ cho, jung, jong }) {
  const type = vowelType(jung);
  const parts = [];
  if (type === 'vertical') {
    if (jong) {
      parts.push({ ch: cho, x: 0.28, y: 0.28 });
      parts.push({ ch: jung, x: 0.72, y: 0.28 });
      parts.push({ ch: jong, x: 0.5, y: 0.75 });
    } else {
      parts.push({ ch: cho, x: 0.28, y: 0.5 });
      parts.push({ ch: jung, x: 0.72, y: 0.5 });
    }
  } else {
    if (jong) {
      parts.push({ ch: cho, x: 0.5, y: 0.2 });
      parts.push({ ch: jung, x: 0.5, y: 0.5 });
      parts.push({ ch: jong, x: 0.5, y: 0.8 });
    } else {
      parts.push({ ch: cho, x: 0.5, y: 0.3 });
      parts.push({ ch: jung, x: 0.5, y: 0.7 });
    }
  }
  return parts;
}

// 여러 음절을 가로로 나란히 두고, 전체 무대 좌표계(0~1)로 변환한다.
function wordPositions(syllables) {
  const n = syllables.length;
  const boxW = 1 / n;
  const tokens = [];
  const positions = [];
  syllables.forEach((syl, i) => {
    syllableLayout(syl).forEach((p) => {
      tokens.push(p.ch);
      positions.push({
        x: i * boxW + p.x * boxW * 0.82 + boxW * 0.09,
        y: 0.15 + p.y * 0.7,
      });
    });
  });
  return { tokens, positions };
}

// 예시 단어 — 전통 소재를 담은 낱말은 사실상 무한히 많을 수 있어서(모든 전통 단어를
// 지금 다 넣을 수는 없음), 우선 대표적인 몇 가지만 예시로 넣어둔다.
const BOMUL = [
  { cho: 'ㅂ', jung: 'ㅗ', jong: null },
  { cho: 'ㅁ', jung: 'ㅜ', jong: 'ㄹ' },
]; // 보물
const PUNGMULNORI = [
  { cho: 'ㅍ', jung: 'ㅜ', jong: 'ㅇ' },
  { cho: 'ㅁ', jung: 'ㅜ', jong: 'ㄹ' },
  { cho: 'ㄴ', jung: 'ㅗ', jong: 'ㄹ' },
  { cho: 'ㅇ', jung: 'ㅣ', jong: null },
]; // 풍물놀이
const MUNHWAJAE = [
  { cho: 'ㅁ', jung: 'ㅜ', jong: 'ㄴ' },
  { cho: 'ㅎ', jung: 'ㅘ', jong: null },
  { cho: 'ㅈ', jung: 'ㅐ', jong: null },
]; // 문화재
const HANGEULNAL = [
  { cho: 'ㅎ', jung: 'ㅏ', jong: 'ㄴ' },
  { cho: 'ㄱ', jung: 'ㅡ', jong: 'ㄹ' },
  { cho: 'ㄴ', jung: 'ㅏ', jong: 'ㄹ' },
]; // 한글날

// [아동반/성인반 실제 차등화] 아동반은 받침(종성)도 겹모음도 없는 "초성+중성"만으로
// 이루어진 낱말만 다룬다 — 글자를 통째로 다루는 게 아니라 여전히 자음·모음 조각을
// 맞추는 건 똑같고, 다만 한 음절에 조각이 2개(초성·중성)뿐이라 자리 개념을 먼저
// 익히기 쉽다. 성인반은 받침과 겹모음이 섞인 위의 낱말들(BOMUL 등)을 그대로 쓴다.
const SOGO = [
  { cho: 'ㅅ', jung: 'ㅗ', jong: null },
  { cho: 'ㄱ', jung: 'ㅗ', jong: null },
]; // 소고
const BINYEO = [
  { cho: 'ㅂ', jung: 'ㅣ', jong: null },
  { cho: 'ㄴ', jung: 'ㅕ', jong: null },
]; // 비녀

const bomul = wordPositions(BOMUL);
const pungmulnori = wordPositions(PUNGMULNORI);
const munhwajae = wordPositions(MUNHWAJAE);
const hangeulnal = wordPositions(HANGEULNAL);
const sogo = wordPositions(SOGO);
const binyeo = wordPositions(BINYEO);

export const PRINTING_TYPES = [
  {
    id: 'jamo-sogo',
    name: '훈민정음 자모 배열 - 소고',
    tag: '훈민정음',
    level: 'easy',
    description:
      '"소고" 두 글자 모두 받침 없이 초성·중성 두 조각만으로 이루어져 있어요. 자음·모음 두 조각을 제자리에 맞추면 글자가 완성돼요.',
    tokens: sogo.tokens,
    positions: sogo.positions,
    colorful: true,
    tip: '아동반은 받침(종성) 없는 낱말로 먼저 "자음+모음=한 음절" 감각부터 잡아줍니다. 소고는 손잡이가 줄(끈)로 된 전통 타악기라는 점도 함께 짚어주면 좋아요.',
  },
  {
    id: 'jamo-binyeo',
    name: '훈민정음 자모 배열 - 비녀',
    tag: '훈민정음',
    level: 'easy',
    description:
      '"비녀" 두 글자 모두 받침 없이 초성·중성 두 조각만으로 이루어져 있어요. 자음·모음 두 조각을 제자리에 맞추면 글자가 완성돼요.',
    tokens: binyeo.tokens,
    positions: binyeo.positions,
    colorful: true,
    tip: '비녀처럼 받침 없는 낱말은 조각이 늘 2개뿐이라 "왼쪽은 자음, 오른쪽은 모음"이라는 자리 규칙을 반복해서 익히기 좋습니다.',
  },
  {
    id: 'jamo-bomul',
    name: '훈민정음 자모 배열 - 보물',
    tag: '훈민정음',
    level: 'hard',
    description:
      '한글 글자는 초성·중성·종성이 모여 한 음절을 이룹니다. "보물" 두 글자가 완성되도록 자음·모음 조각을 제자리에 맞춰보세요. 조각마다 각도와 색이 제각각이라, 자리뿐 아니라 자음·모음의 생김새도 눈여겨봐야 해요.',
    tokens: bomul.tokens,
    positions: bomul.positions,
    colorful: true,
    tip: '처음 배우는 아이에게는 "초성-중성-종성"이라는 말보다 "먼저 소리, 다음 소리, 받치는 소리"처럼 쉬운 말로 설명하세요. 글자 수가 적은 낱말부터 시작해야 자리 개념을 먼저 잡습니다.',
  },
  {
    id: 'jamo-pungmulnori',
    name: '훈민정음 자모 배열 - 풍물놀이',
    tag: '훈민정음',
    level: 'hard',
    description:
      '"풍물놀이" 네 글자가 완성되도록 자음·모음 조각을 제자리에 맞춰보세요. 글자 수가 많아지는 만큼 조각도 더 많아집니다.',
    tokens: pungmulnori.tokens,
    positions: pungmulnori.positions,
    colorful: true,
    tip: '글자 수가 늘어나면 학습자는 "어느 글자부터 맞춰야 할지" 막막해합니다. 왼쪽 글자부터 순서대로, 한 글자씩 완성하고 넘어가라고 짚어주면 훨씬 덜 헤맵니다.',
  },
  {
    id: 'jamo-munhwajae',
    name: '훈민정음 자모 배열 - 문화재',
    tag: '훈민정음',
    level: 'hard',
    description:
      '"문화재" 세 글자가 완성되도록 자음·모음 조각을 제자리에 맞춰보세요.',
    tokens: munhwajae.tokens,
    positions: munhwajae.positions,
    colorful: true,
    tip: '"화(ㅘ)"처럼 겹모음이 들어간 글자는 조각이 더 복잡해 보여서 지레 어려워합니다. "ㅗ와 ㅏ가 겹친 것뿐"이라고 풀어서 보여주면 덜 부담스러워합니다.',
  },
  {
    id: 'jamo-hangeulnal',
    name: '훈민정음 자모 배열 - 한글날',
    tag: '훈민정음',
    level: 'hard',
    description:
      '"한글날" 세 글자가 완성되도록 자음·모음 조각을 제자리에 맞춰보세요.',
    tokens: hangeulnal.tokens,
    positions: hangeulnal.positions,
    colorful: true,
    tip: '"한글날"은 받침(종성)이 매 글자에 다 들어가는 조합입니다. 받침 자리를 "글자의 발, 가장 아래"라고 짚어주면 자리를 헷갈리지 않습니다.',
  },
  {
    id: 'metaltype',
    name: '금속활자 식자',
    tag: '금속활자',
    level: 'hard',
    description:
      '세계에서 가장 오래된 금속활자본으로 알려진 『직지심체요절』처럼, 낱낱의 활자를 한 줄로 가지런히 심어 넣어야 비로소 한 문장이 찍혀 나옵니다.',
    tokens: ['직', '지', '심', '체'],
    positions: rowPositions(4),
    tip: '금속활자는 "한 글자 한 글자가 독립된 조각"이라는 점이 핵심입니다. 목판처럼 판 전체를 새기는 것과 뭐가 다른지 먼저 비교해서 설명하면 다음 목판 인쇄 놀이와 연결 짓기 쉬워집니다.',
  },
  {
    id: 'woodblock',
    name: '목판 인쇄(팔만대장경)',
    tag: '팔만대장경',
    level: 'hard',
    description:
      '팔만대장경은 수만 장의 목판에 한 글자 한 글자를 새겨 차곡차곡 완성한 대장경입니다. 흩어진 판을 순서에 맞게 늘어놓아 보세요.',
    tokens: ['팔', '만', '대', '장', '경'],
    positions: arcPositions(5),
    tip: '목판은 활자와 달리 판 하나에 여러 글자가 "통째로" 새겨집니다. 순서를 틀리면 전체 문장이 틀어진다는 걸 강조해서, 자리마다 신중하게 확인하는 습관을 들이게 하세요.',
  },
  {
    id: 'mirror',
    name: '활자 거울 찍기',
    tag: '거울 활자',
    level: 'easy',
    mode: 'mirror',
    description: '금속활자와 목판은 글자를 거울에 비친 모양으로 새겨요. 먹을 묻혀 종이에 찍어야 비로소 바른 글자가 나와요.',
    tokens: [],
    positions: [],
    tip: '"도장을 찍으면 글자가 반대로 나오지 않았나?"처럼 도장 경험에 빗대면 쉬워요. 활자는 거꾸로 새기고, 찍으면 바로 읽힌다는 점이 핵심입니다.',
  },
  {
    id: 'sentence',
    name: '서문 한 줄 조판',
    tag: '서문 조판',
    level: 'hard',
    mode: 'sentence',
    description: '훈민정음 서문의 낱말 활자를 읽는 순서대로 골라 한 줄씩 짜 올려요. 낱낱의 활자를 차례로 심는 식자(조판)의 감각을 익힙니다.',
    tokens: [],
    positions: [],
    tip: '서문은 옛 말투라 낯설어요. 화면에 나오는 현대말 뜻을 먼저 읽고 낱말을 짝지어 보게 하면 부담이 줄어요.',
  },
  {
    id: 'shape',
    name: '자음 상형 짝맞추기',
    tag: '상형 원리',
    level: 'easy',
    mode: 'shape',
    description: '한글 자음은 소리를 낼 때 입과 혀, 목구멍의 모양을 본떠 만들었어요(ㄱ·ㄴ·ㅁ·ㅅ·ㅇ). 소리 나는 자리와 모양을 짝지어 봅니다.',
    tokens: [],
    positions: [],
    tip: '직접 소리를 내 보면 혀가 닿는 자리가 느껴져요. "ㄴ" 하고 소리 낼 때 혀끝이 어디에 닿는지 같이 확인해 보세요.',
  },
];
