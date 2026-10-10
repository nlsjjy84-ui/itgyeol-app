// 잇결 테마 — 백자(白磁)처럼 맑은 바탕 + 먹·오방색(청·적·황·백·흑).
// 라이트(밝은 백자)와 다크(먹색) 두 가지가 있고, 기기 설정을 따르되 직접 고를 수도 있다.
// 색 이름(키)은 그대로 두고 값만 바꾸므로 모든 화면이 한 번에 바뀐다.
import { Appearance, Platform } from 'react-native';

export const THEME_KEY = 'itgyeol_theme_v1';

const LIGHT = {
  bg: '#f1f4f3', // 백자빛 바탕 (누런 기운 없이 맑게)
  paper: '#fcfdfc', // 카드·패널
  border: '#c4cdca',
  borderSoft: '#dde4e1',
  ink: '#1b2227', // 먹색
  muted: '#5d6a70',
  accent: '#b3322b', // 단청의 붉은색(주홍)
  accentDeep: '#7d1f1b',
  accentSoft: '#f4dfda',
  night: '#151b20',
  nightSoft: '#222b32',
  cheong: '#2b5f8e', // 청(동·목)
  jeok: '#b3322b', // 적(남·화)
  hwang: '#c8982b', // 황(중앙·토)
  baek: '#fcfdfc', // 백(서·금)
  heuk: '#1b2227', // 흑(북·수)
  green: '#2c7a64', // 단청 녹(청록)
  gold: '#b58a2e',
  fiber: '#7c8a86', // 한지 섬유 무늬 선
  onNight: '#f3efe6', // 어두운 패널 위 글자
};

const DARK = {
  bg: '#10151a',
  paper: '#1a2128',
  border: '#3a4752',
  borderSoft: '#2a343d',
  ink: '#eef1ef',
  muted: '#9aa8ae',
  accent: '#e26a5e',
  accentDeep: '#f29a90',
  accentSoft: '#3b2624',
  night: '#0a0e11',
  nightSoft: '#151b20',
  cheong: '#6aa6da',
  jeok: '#e26a5e',
  hwang: '#e2b550',
  baek: '#eef1ef',
  heuk: '#46535e',
  green: '#52b99a',
  gold: '#d6a94c',
  fiber: '#9fb0b8',
  onNight: '#f3efe6',
};

export const palettes = { light: LIGHT, dark: DARK };

function systemMode() {
  try {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  } catch (e) {
    return 'light';
  }
}

function webPref() {
  if (Platform.OS !== 'web') return null;
  try {
    const v = window.localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch (e) {
    return null;
  }
}

export const colors = { ...LIGHT };
export const OBANG = [];
let currentMode = 'light';

export function getThemeMode() {
  return currentMode;
}

// 모드를 적용한다. 화면 파일들이 불러와지기 "전에" 호출해야 모든 스타일에 반영된다.
export function applyThemeMode(mode) {
  currentMode = mode === 'dark' ? 'dark' : 'light';
  Object.assign(colors, palettes[currentMode]);
  OBANG.length = 0;
  OBANG.push(colors.cheong, colors.jeok, colors.hwang, colors.baek, colors.heuk);
}

applyThemeMode(webPref() || systemMode());

// 서체 — 명조는 본문·제목, 동해독도체(붓글씨 느낌)는 큰 제목·도장 글씨에 쓴다.
export const fonts = {
  serif: 'NanumMyeongjo_400Regular',
  serifBold: 'NanumMyeongjo_700Bold',
  serifHeavy: 'NanumMyeongjo_800ExtraBold',
  brush: 'EastSeaDokdo_400Regular',
};
