// 언어팩 — 한국어가 원본이고, 다른 언어는 "한국어 문장 → 번역" 짝으로 들고 있다(gettext 방식).
// 번역이 비어 있으면 한국어가 그대로 보이므로, 새 언어는 파일 하나(zh.js, ja.js)를 채우기만 하면 된다.
// 언어를 바꾸면 화면 트리를 다시 그려(AppRoot의 key) 모든 문장이 새 언어로 바뀐다.
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en';
import zh from './zh';
import ja from './ja';

export const LANGS = [
  { id: 'ko', label: '한국어', ready: true },
  { id: 'en', label: 'English', ready: true },
  { id: 'zh', label: '中文', ready: true },
  { id: 'ja', label: '日本語', ready: true },
];
const PACKS = { en, zh, ja };
const KEY = 'itgyeol_lang_v1';
let current = 'ko';

export const getLang = () => current;
const pack = () => (current === 'ko' ? null : PACKS[current]);

// 화면 문장: t('한국어 문장 {n}', { n: 3 })
export function t(ko, vars) {
  const p = pack();
  let s = (p && p.ui && p.ui[ko]) || ko;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
  return s;
}

// 자료 이름: L('item', 'norigae', '노리개')
export function L(kind, id, ko) {
  const p = pack();
  return (p && p[kind] && p[kind][id]) || ko;
}

// 자료 목록의 글자를 지금 언어로 바꿔 끼운다(한국어 원본은 __ko에 보관해 두고 되돌릴 수 있게).
export function localizeList(list, kind, fields, keyOf = (o) => o.id) {
  (list || []).forEach((o) => {
    if (!o.__ko) o.__ko = {};
    fields.forEach((f) => {
      if (!(f in o.__ko)) o.__ko[f] = o[f];
      const k = keyOf(o);
      o[f] = f === 'label' || f === 'name' ? L(kind, k, o.__ko[f]) : L(`${kind}_${f}`, k, o.__ko[f]);
    });
  });
}

const hooks = [];
// 언어가 바뀔 때 자료를 다시 끼우는 함수들(catalog, taste, playGames …)을 등록한다.
export function onLang(fn) {
  hooks.push(fn);
  fn(current);
}

export function setLang(id) {
  current = LANGS.some((l) => l.id === id && l.ready) ? id : 'ko';
  hooks.forEach((fn) => fn(current));
  AsyncStorage.setItem(KEY, current).catch(() => {});
  return current;
}

export async function loadLang() {
  try {
    const v = await Promise.race([AsyncStorage.getItem(KEY), new Promise((r) => setTimeout(() => r(null), 1200))]);
    if (v) {
      current = LANGS.some((l) => l.id === v && l.ready) ? v : 'ko';
      hooks.forEach((fn) => fn(current));
    }
  } catch (e) {
    // 기본 한국어
  }
  return current;
}
