// 잇결 테마 — 한지 바탕 + 먹·오방색(청·적·황·백·흑)을 기본으로 한다.
// (기존 키 이름은 그대로 두고 값만 바꿔서, 모든 화면이 한 번에 전통 색감으로 바뀐다.)
export const colors = {
  bg: '#eee3cb', // 한지(닥종이) 바탕
  paper: '#f8f1de', // 밝은 한지 — 카드·패널
  border: '#bfa97a', // 먹이 번진 듯한 테두리
  borderSoft: '#d9c9a0',
  ink: '#211b14', // 먹색
  muted: '#76684f',
  accent: '#a8322d', // 단청의 붉은색(주홍)
  accentDeep: '#74201c',
  accentSoft: '#ecd3ae',
  night: '#1c1812',
  nightSoft: '#2b251b',
  // 오방색 — 방위·오행과 짝을 이룬다
  cheong: '#2d5f8a', // 청(동·목)
  jeok: '#a8322d', // 적(남·화)
  hwang: '#c99a2e', // 황(중앙·토)
  baek: '#f6f0e0', // 백(서·금)
  heuk: '#211b14', // 흑(북·수)
  green: '#2f7a62', // 단청 녹(청록)
  gold: '#b88a2a',
};

// 서체 — 명조는 본문·제목, 동해독도체(붓글씨 느낌)는 큰 제목·도장 글씨에 쓴다.
export const fonts = {
  serif: 'NanumMyeongjo_400Regular',
  serifBold: 'NanumMyeongjo_700Bold',
  serifHeavy: 'NanumMyeongjo_800ExtraBold',
  brush: 'EastSeaDokdo_400Regular',
};

// 오방색 순서(청·적·황·백·흑) — 문양·결과물에서 돌려가며 쓴다.
export const OBANG = [colors.cheong, colors.jeok, colors.hwang, colors.baek, colors.heuk];
