// 내가 모은 유물 조각과 내가 만든 합체 작품 — 기기에 저장한다.
// 놀이를 끝내면 「조각 보따리」를 받고(띠부씰처럼 무엇이 나올지 모름), 도감이 채워지고,
// 작업대에서 조각을 합체해 작품(영상)을 만든다.
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PIECES, PIECE_BY_K, RARITY } from '../data/pieces';

const KEY = 'itgyeol_pieces_v1';
const EMPTY = { owned: {}, order: [], works: [], packs: 0, starter: false, codes: [], claimed: [] };
let state = null;
const subs = new Set();

function emit() {
  subs.forEach((fn) => fn(state));
}
function persist() {
  AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
}
export async function loadPieces() {
  if (state) return state;
  let saved = null;
  try {
    saved = JSON.parse((await AsyncStorage.getItem(KEY)) || 'null');
  } catch (e) {
    saved = null;
  }
  state = { ...EMPTY, ...(saved || {}) };
  // 지금 앱에 없는 조각(데이터가 바뀐 경우)은 조용히 뺀다
  state.owned = Object.fromEntries(Object.entries(state.owned || {}).filter(([k]) => PIECE_BY_K[k]));
  state.order = (state.order || []).filter((k) => PIECE_BY_K[k]);
  emit();
  return state;
}
export function getPieces() {
  return state || EMPTY;
}
export function usePieces() {
  const [s, setS] = useState(state || EMPTY);
  useEffect(() => {
    subs.add(setS);
    loadPieces().then(setS);
    return () => subs.delete(setS);
  }, []);
  return s;
}

// 섞기 — 같은 씨앗이면 같은 결과(시험할 수 있게)
export function rng(seed) {
  let x = (seed >>> 0) || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 100000) / 100000;
  };
}

// 보따리 하나 뽑기: 보통 70% · 귀함 25% · 아주 귀함 5%.
// 아직 없는 조각이 조금 더 잘 나오게(도감 채우는 재미), 「궁궐 한정」 조각은 박물관에서 받은 암호가 있어야 나온다.
export function drawPack(n, seed, owned = {}, codes = []) {
  const r = rng(seed);
  const pool = PIECES.filter((p) => !p.only || codes.includes(p.only));
  const out = [];
  for (let i = 0; i < n; i++) {
    const roll = r();
    const tier = roll < 0.05 ? 2 : roll < 0.3 ? 1 : 0;
    let cand = pool.filter((p) => p.rare === tier && !out.includes(p.k));
    if (!cand.length) cand = pool.filter((p) => !out.includes(p.k));
    const fresh = cand.filter((p) => !owned[p.k]);
    const from = fresh.length && r() < 0.75 ? fresh : cand;
    out.push(from[Math.floor(r() * from.length)].k);
  }
  return out;
}

// 처음 받는 「첫 보따리」 — 작업대를 바로 써 볼 수 있게 자리마다 하나씩 고르게 넣는다
export function starterKeys(seed = 20261121) {
  const r = rng(seed);
  const need = ['몸통', '머리', '날개', '바퀴', '다리', '팔', '무기', '꼬리', '추진기', '탑승자'];
  const out = [];
  need.forEach((slot) => {
    const c = PIECES.filter((p) => p.rare === 0 && p.slots[0] === slot && !out.includes(p.k));
    if (c.length) out.push(c[Math.floor(r() * c.length)].k);
  });
  return out;
}

export function addPieces(keys) {
  if (!state) state = { ...EMPTY };
  const owned = { ...state.owned };
  const order = [...state.order];
  const fresh = [];
  keys.forEach((k) => {
    if (!PIECE_BY_K[k]) return;
    if (!owned[k]) {
      fresh.push(k);
      order.unshift(k);
    }
    owned[k] = (owned[k] || 0) + 1;
  });
  state = { ...state, owned, order, packs: state.packs + 1 };
  persist();
  emit();
  return fresh;
}

// 놀이 한 판에 보따리 하나 — 같은 놀이 기록으로 두 번 받지 않게
export function isClaimed(claim) {
  return !!(claim && state && (state.claimed || []).includes(claim));
}
export function markClaimed(claim) {
  if (!claim) return;
  if (!state) state = { ...EMPTY };
  state = { ...state, claimed: [...(state.claimed || []), claim].slice(-200) };
  persist();
  emit();
}

export function takeStarter() {
  if (!state) state = { ...EMPTY };
  if (state.starter) return [];
  const keys = starterKeys();
  addPieces(keys);
  state = { ...state, starter: true };
  persist();
  emit();
  return keys;
}

// 박물관 현장에서 받은 암호 — 「궁궐 한정」 조각이 보따리에서 나오기 시작한다
export const MUSEUM_CODES = { 고궁: '궁궐', GOGUNG: '궁궐' };
export function enterCode(text) {
  const c = MUSEUM_CODES[String(text || '').trim().toUpperCase()] || MUSEUM_CODES[String(text || '').trim()];
  if (!c) return null;
  if (!state) state = { ...EMPTY };
  if (!state.codes.includes(c)) state = { ...state, codes: [...state.codes, c] };
  persist();
  emit();
  return c;
}

export function saveWork(work) {
  if (!state) state = { ...EMPTY };
  const w = { ...work, id: work.id || 'W' + Date.now().toString(36), at: Date.now() };
  state = { ...state, works: [w, ...state.works.filter((x) => x.id !== w.id)].slice(0, 60) };
  persist();
  emit();
  return w;
}
export function removeWork(id) {
  if (!state) return;
  state = { ...state, works: state.works.filter((x) => x.id !== id) };
  persist();
  emit();
}

export { RARITY };
