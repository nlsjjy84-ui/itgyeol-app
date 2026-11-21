// 내가 모은 유물 조각과 내가 만든 합체 작품 — 기기에 저장한다.
// 놀이를 끝내면 「조각 보따리」를 받고(띠부씰처럼 무엇이 나올지 모름), 도감이 채워지고,
// 작업대에서 조각을 합체해 작품(영상)을 만든다.
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PIECES, PIECE_BY_K, RARITY } from '../data/pieces';

const KEY = 'itgyeol_pieces_v1';
const EMPTY = { owned: {}, order: [], works: [], packs: 0, starter: false, codes: [], claimed: [], daily: { last: '', streak: 0 } };
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

// 이달의 시리즈 — 팝마트의 시리즈·시크릿처럼, 달마다 주제가 바뀌고 그 주제 조각이 더 잘 나온다(30%).
// 시리즈마다 「시크릿 조각」 하나가 숨어 있어 72번에 한 번꼴로 나온다.
export const SERIES = [
  { m: 1, name: '신라의 금빛', test: (p) => p.era === '신라' || p.era === '통일신라' },
  { m: 2, name: '궁궐의 과학', test: (p) => /해시계|앙부|혼천|측우|자격루|부표|간평/.test(p.name) || p.by === '국립고궁박물관' },
  { m: 3, name: '봄날의 꽃무늬', test: (p) => /꽃|연꽃|모란|국화|매화|넝쿨|당초/.test(p.name) },
  { m: 4, name: '백제의 미소', test: (p) => p.era === '백제' || (p.from || '').includes('부여') || (p.from || '').includes('공주') },
  { m: 5, name: '아이들의 놀이', test: (p) => /팽이|구슬|공기|윷|토우|방울|인형|말/.test(p.name) },
  { m: 6, name: '바다 건너온 유물', test: (p) => !!p.abroad },
  { m: 7, name: '여름밤의 도깨비', test: (p) => /귀면|도깨비|짐승얼굴|용/.test(p.name) },
  { m: 8, name: '쇠와 불의 장인', test: (p) => p.power === '쇠' },
  { m: 9, name: '가을 들녘 살림살이', test: (p) => /항아리|단지|장군|독|숟가락|낫|괭이|따비|저울/.test(p.name) },
  { m: 10, name: '선비의 책상', test: (p) => /연적|벼루|먹|붓|필통|인장|도장/.test(p.name) },
  { m: 11, name: '고려 청자의 달', test: (p) => p.era === '고려' || /청자/.test(p.name) },
  { m: 12, name: '조선 백자의 겨울', test: (p) => /백자/.test(p.name) || p.era === '조선' },
];
export function currentSeries(d = new Date()) {
  const s = SERIES.find((x) => x.m === d.getMonth() + 1) || SERIES[0];
  const pool = PIECES.filter(s.test);
  // 시크릿 — 시리즈 안에서 가장 귀한 조각 하나(달마다 같은 조각)
  const rare = [...pool].sort((a, b) => b.rare - a.rare || a.k.localeCompare(b.k));
  const secret = rare.length ? rare[(d.getFullYear() * 13 + d.getMonth()) % Math.min(5, rare.length)] : null;
  return { ...s, pool, secret };
}

// 보따리 하나 뽑기: 보통 70% · 귀함 25% · 아주 귀함 5%.
// 아직 없는 조각이 조금 더 잘 나오게(도감 채우는 재미), 「궁궐 한정」 조각은 박물관에서 받은 암호가 있어야 나온다.
// 놀이와 이어진 조각 — 그 놀이를 마치면 관련 유물이 더 잘 나온다(60%)
export const SCENE_BIAS = {
  진법: /칼|검|창|화살|촉|투구|갑|방패|깃발|총통|활|기마|말/,
  '훈민정음·인쇄': /연적|벼루|먹|붓|인장|인$|필통|도장/,
  전래놀이: /팽이|구슬|공기|윷|투호|방울|토우|놀이|바둑|주사위/,
  '한글 테트리스': /인장|연적|필통|인$|벼루/,
  탈춤: /귀면|도깨비|얼굴|짐승|탈|가면/,
  단청: /막새|치미|기와|용머리|단청|잡상/,
};
export function drawPack(n, seed, owned = {}, codes = [], scene = '') {
  const r = rng(seed);
  const all = PIECES.filter((p) => !p.only || codes.includes(p.only));
  const bias = SCENE_BIAS[scene] ? all.filter((p) => SCENE_BIAS[scene].test(p.name)) : [];
  let pool = all;
  const out = [];
  const series = currentSeries();
  const regions = (codes || []).filter((c) => REGION_CODES.includes(c));
  const local = regions.length ? all.filter((p) => p.from && regions.some((g) => p.from.includes(g))) : [];
  for (let i = 0; i < n; i++) {
    // 시크릿 조각 — 72번에 한 번
    if (series.secret && r() < 1 / 72 && !out.includes(series.secret.k)) {
      out.push(series.secret.k);
      continue;
    }
    const sr = r();
    pool = local.length > 2 && sr < 0.4 ? local : bias.length > 6 && sr < 0.7 ? bias : series.pool.length > 6 && sr < 0.85 ? series.pool : all;
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
export const MUSEUM_CODES = {
  고궁: '궁궐', GOGUNG: '궁궐',
  // 지역 국립박물관 — 그 고장에서 나온 유물 조각이 보따리에 더 많이 섞인다(포켓몬 GO 지역 한정처럼)
  경주: '경주', GYEONGJU: '경주', 부여: '부여', BUYEO: '부여', 공주: '공주', GONGJU: '공주',
  김해: '김해', GIMHAE: '김해', 청주: '청주', CHEONGJU: '청주', 서울: '서울', SEOUL: '서울',
};
export const REGION_CODES = ['경주', '부여', '공주', '김해', '청주', '서울'];
export function enterCode(text) {
  const c = MUSEUM_CODES[String(text || '').trim().toUpperCase()] || MUSEUM_CODES[String(text || '').trim()];
  if (!c) return null;
  if (!state) state = { ...EMPTY };
  if (!state.codes.includes(c)) state = { ...state, codes: [...state.codes, c] };
  persist();
  emit();
  return c;
}

// 진짜 유물 찾기 — 박물관 진열장 설명판의 소장품번호(예: 덕수1496, 본관14328, 1918.501)를 넣으면
// 그 유물 조각을 바로 얻는다. 같은 번호는 한 번만.
const normNo = (x) => String(x || '').replace(/[\s\-–]/g, '').toLowerCase();
let NO_INDEX = null;
export function findByNo(text) {
  const q = normNo(text);
  if (!q || !/\d/.test(q)) return [];
  if (!NO_INDEX) {
    NO_INDEX = {};
    PIECES.forEach((p) => {
      const n = normNo(p.no);
      if (n && /\d/.test(n)) (NO_INDEX[n] = NO_INDEX[n] || []).push(p.k);
    });
  }
  return (NO_INDEX[q] || []).slice(0, 3);
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

// 겹친 조각을 선물로 내보낸다(하나 남기고)
export function giveAway(k) {
  if (!state || !state.owned[k] || state.owned[k] < 2) return false;
  state = { ...state, owned: { ...state.owned, [k]: state.owned[k] - 1 } };
  persist();
  emit();
  return true;
}

// 오늘의 보따리 — 하루 한 번. 이어서 온 날(연속)이 7일째가 되면 「아주 귀함」 조각 하나를 꼭 넣는다.
const dayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function dailyState() {
  const d = (state && state.daily) || { last: '', streak: 0 };
  const today = dayStr();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const continued = d.last === dayStr(y);
  return { ready: d.last !== today, streak: d.last === today || continued ? d.streak : 0, nextStreak: continued ? d.streak + 1 : d.last === today ? d.streak : 1 };
}
export function takeDaily(seed = Date.now()) {
  if (!state) state = { ...EMPTY };
  const ds = dailyState();
  if (!ds.ready) return null;
  const streak = ds.nextStreak;
  let keys = drawPack(3, seed % 1000003, state.owned, state.codes);
  if (streak % 7 === 0) {
    const rare = PIECES.filter((p) => p.rare === 2 && (!p.only || (state.codes || []).includes(p.only)) && !state.owned[p.k]);
    if (rare.length) keys = [...keys, rare[seed % rare.length].k];
  }
  const fresh = addPieces(keys);
  state = { ...state, daily: { last: dayStr(), streak } };
  persist();
  emit();
  return { keys, fresh, streak };
}
