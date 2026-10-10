// 잇결 이야기 — 풍이(발견하고 묻는 아이)와 결이(관계를 이어 주는 아이), 그리고 "너"(사용자) 세 사람이
// 마당에서 판을 하나씩 만나며 조각을 모은다. 포트폴리오의 캐릭터 말투 원칙을 따른다:
//   피하는 말  — "다음을 눌러주세요", "정답은 무엇인가요?", "잘했어요"
//   여는 말    — "어?", "방금 네가 한 거야?", "잠깐, 움직였는데?"  (가르치지 않고 반응한다)

export const WHO = {
  pung: { name: '풍이', color: '#2b5f8e' },
  gyeol: { name: '결이', color: '#b3322b' },
};

// 장면별 첫 대사 (미션 카드 위에서 보여 준다)
export const SCENES = {
  prologue: {
    art: 'gate',
    place: '마당 어귀',
    lines: [
      { who: 'pung', text: '어? 저기 누가 들어왔어!' },
      { who: 'gyeol', text: '방금 마당 문이 열린 거 봤어? 같이 가 보자.' },
      { who: 'pung', text: '마당 세 곳에서 판이 기다리고 있대. 네가 손을 대면 뭔가 움직일지도 몰라.' },
    ],
  },
  jinbeop: {
    art: 'madang',
    place: '첫째 판 · 진법 마당',
    lines: [
      { who: 'pung', text: '어? 마당에 사람들이 서 있는데… 줄이 다 흐트러졌어.' },
      { who: 'gyeol', text: '누가 자리를 바꿨나 봐. 네가 서 보면 어때?' },
    ],
  },
  print: {
    art: 'byeongpung',
    place: '둘째 판 · 병풍 앞 글방',
    lines: [
      { who: 'gyeol', text: '병풍 앞 먹이 아직 안 말랐어. 누가 글자를 쓰다 말았나 봐.' },
      { who: 'pung', text: '어? 글자 조각이 흩어졌네. 잠깐, 맞추면 도장이 찍힐 것 같은데?' },
    ],
  },
  play: {
    art: 'banner',
    place: '셋째 판 · 놀이 마당',
    lines: [
      { who: 'pung', text: '저기 깃발 좀 봐! 바람이 불면 소리가 날 것 같아.' },
      { who: 'gyeol', text: '잠깐, 움직였는데? 같이 해 보자.' },
    ],
  },
};

// 한 판을 마쳤을 때 (조각이 생기는 순간)
export const SUCCESS = {
  jinbeop: [
    { who: 'pung', text: '어? 방금 네가 한 거야?' },
    { who: 'gyeol', text: '진이 맞춰졌어. 이 자리가 조각 하나로 남았어.' },
  ],
  print: [
    { who: 'gyeol', text: '도장이 찍혔어! 방금 맞춘 글자가 그대로 남았네.' },
    { who: 'pung', text: '잠깐, 앞 조각 옆에 이어 붙는데?' },
  ],
  tbd: [
    { who: 'pung', text: '깃발이 올랐다! 조각이 하나 더 생겼어.' },
    { who: 'gyeol', text: '조각이 또 이어졌어. 조각보가 점점 커지네.' },
  ],
  hangul: [
    { who: 'gyeol', text: '블록이 차곡차곡 쌓여서 줄이 지워졌어!' },
    { who: 'pung', text: '이 조각은 글자 블록 모양이야. 조각보에 이어 붙었어.' },
  ],
};

export const FAIL = [
  { who: 'pung', text: '어? 아직 안 맞았나 봐.' },
  { who: 'gyeol', text: '괜찮아, 마당은 그대로 있어. 천천히 다시 해 보자.' },
];

// 결과 화면 — 몇 조각이 모였는지에 따라 달라지는 말
export const RESULT_LINES = {
  0: [
    { who: 'gyeol', text: '아직 마당에 조각이 없어. 판 하나만 놀아 봐도 첫 조각이 생겨.' },
    { who: 'pung', text: '어? 네가 움직이면 시작돼!' },
  ],
  1: [
    { who: 'pung', text: '첫 조각이야! 다음 판이 이 옆에 이어 붙을 거야.' },
    { who: 'gyeol', text: '조각보는 한 조각으로는 아직 보가 아니야. 하나 더 이어 볼까?' },
  ],
  2: [
    { who: 'gyeol', text: '두 조각이 이어졌어. 사이에 매듭이 생긴 거 보여?' },
    { who: 'pung', text: '어? 그림이 아까랑 달라졌는데?' },
  ],
  3: [
    { who: 'pung', text: '세 판의 흔적이 한 장의 조각보가 됐어!' },
    { who: 'gyeol', text: '이게 네가 만든 전통 창작물이야. 어떻게 풀었는지에 따라 모양이 달라져.' },
  ],
  4: [
    { who: 'pung', text: '네 판의 흔적이 모여 조각보가 꽉 찼어!' },
    { who: 'gyeol', text: '진법, 글자, 놀이, 한글 블록까지 — 풀어 간 길에 따라 모양이 달라져.' },
  ],
};
