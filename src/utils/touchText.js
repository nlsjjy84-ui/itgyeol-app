import { Platform } from 'react-native';

// 터치 화면(휴대폰·태블릿·박물관 키오스크)에서는 키보드 안내가 필요 없다.
// 설명 문장 속 "(스페이스바도 돼요)", "(키보드는 ← →)" 같은 괄호 안내를 지워 글을 짧게 한다.
export const IS_TOUCH =
  Platform.OS !== 'web' ||
  (typeof window !== 'undefined' && (('ontouchstart' in window) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)));

const KEY_NOTE = /\s*[(（][^()（）]*(키보드|스페이스|키\b|키 |키\)|화살표|Space|space|keyboard|Keyboard|arrow keys|键|空格|キー|スペース)[^()（）]*[)）]/g;

/** 이미 번역된 문장을 받아, 터치 기기면 키보드 괄호 안내를 지운다 */
export function forDevice(s) {
  if (!IS_TOUCH || typeof s !== 'string') return s;
  return s.replace(KEY_NOTE, '').replace(/\s{2,}/g, ' ').trim();
}
