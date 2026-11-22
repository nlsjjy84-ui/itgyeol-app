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
// 판마다 그 판과 뜻이 닿는 유물이 나온다 (2026-11-22 새 설계도 「놀이와 유물의 연결」)
export const SCENE_BIAS = {
  진법: /칼|검|창|화살|촉|투구|갑옷|갑|방패|깃발|총통|활|북|징|기마|말/,
  '훈민정음·인쇄': /인장|도장|인$|벼루|먹|붓|연적|필통|책|서책|문방/,
  전래놀이: /토우|팽이|구슬|공기|윷|투호|주사위|바둑|장기|놀이|인형|방울/,
  '한글 테트리스': /기와|막새|전돌|벽돌|치미|와당|망새/,
  탈춤: /탈|가면|귀면|노리개|비녀|떨잠|귀걸이|귀고리|장신구|방울/,
  단청: /청자|백자|분청|매병|항아리|병$|병 |사발|대접|접시|주자|잔/,
};
// 왜 이 판에서 이 유물이 나오는지 — 보따리를 풀 때 한 줄로 보여 준다
export const SCENE_REASON = {
  진법: '대형을 짠 장수에게 어울리는 물건이 나와요 — 칼·창·투구·북',
  '훈민정음·인쇄': '글자를 짓고 찍는 사람의 도구가 나와요 — 도장·벼루·먹·연적',
  전래놀이: '옛사람들이 놀던 물건이 나와요 — 흙 인형·주사위·놀잇감',
  '한글 테트리스': '블록을 쌓듯 집을 쌓던 조각이 나와요 — 기와·막새·전돌',
  탈춤: '춤추는 사람이 쓰고 달던 것이 나와요 — 탈·노리개·비녀',
  단청: '색과 무늬를 입힌 그릇이 나와요 — 청자·백자·분청',
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
    // 놀이를 마치고 받는 보따리의 첫 유물은 반드시 그 판의 유물
    if (i === 0 && bias.length) {
      const c0 = bias.filter((p) => !owned[p.k]);
      const from0 = c0.length ? c0 : bias;
      out.push(from0[Math.floor(r() * from0.length)].k);
      continue;
    }
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

export function takeStarter(scene = '') {
  if (!state) state = { ...EMPTY };
  if (state.starter) return [];
  // 놀이를 마치고 처음 받는 보따리는 그 판의 유물로 (합체용 「자리마다 하나씩」은 2026-11-22에 뺌)
  const keys = scene && SCENE_BIAS[scene] ? drawPack(4, Date.now() % 1000003, state.owned || {}, state.codes || [], scene) : starterKeys();
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

// 유물 수수께끼 — 하루 5문제까지, 맞히면 그 조각을 갖는다
export function riddleState() {
  const r = (state && state.riddle) || { day: '', n: 0, right: 0 };
  const today = dayStr();
  return r.day === today ? { ...r, left: Math.max(0, 5 - r.n) } : { day: today, n: 0, right: r.right || 0, left: 5 };
}
export function answerRiddle(k, ok) {
  if (!state) state = { ...EMPTY };
  const r = riddleState();
  if (!r.left) return { fresh: [] };
  const fresh = ok ? addPieces([k]) : [];
  state = { ...state, riddle: { day: r.day, n: r.n + 1, right: (r.right || 0) + (ok ? 1 : 0) } };
  persist();
  emit();
  return { fresh };
}

// 오늘의 합체 미션 달성 — 하루 한 번, 아직 없는 「귀함」 이상 조각 하나
export function missionDone(day) {
  return !!(state && state.mission && state.mission.day === day);
}
export function claimMission(day, seed = Date.now()) {
  if (!state) state = { ...EMPTY };
  if (missionDone(day)) return null;
  const pool = PIECES.filter((p) => p.rare >= 1 && !p.only && !state.owned[p.k]);
  const keys = pool.length ? [pool[seed % pool.length].k] : [];
  const fresh = addPieces(keys);
  state = { ...state, mission: { day, n: ((state.mission && state.mission.n) || 0) + 1 } };
  persist();
  emit();
  return { keys, fresh };
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
// 하루 차이 — 'YYYY-MM-DD' 두 개 사이의 날 수
const dayGap = (a, b) => {
  if (!a || !b) return 99;
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
};
// 오늘의 보따리 이어 오기 — 7일을 이을 때마다 「쉼표 부적」 하나(최대 2개).
// 하루 이틀 빠져도 부적이 그 날을 대신 지켜 준다(듀오링고의 스트릭 프리즈처럼, 아이가 하루 빠졌다고 0으로 무너지지 않게).
export function dailyState() {
  const d = (state && state.daily) || { last: '', streak: 0 };
  const charms = d.charms || 0;
  const today = dayStr();
  const gap = dayGap(d.last, today);
  const miss = gap - 1; // 빠진 날 수
  const saved = gap > 1 && d.streak > 0 && miss <= charms; // 부적으로 지킬 수 있음
  const continued = gap === 1 || saved;
  return {
    ready: d.last !== today,
    streak: gap === 0 || continued ? d.streak : 0,
    nextStreak: continued ? d.streak + 1 : gap === 0 ? d.streak : 1,
    charms,
    useCharms: saved ? miss : 0,
    lost: gap > 1 && d.streak > 0 && !saved ? d.streak : 0,
    days: d.days || [],
  };
}
export function takeDaily(seed = Date.now()) {
  if (!state) state = { ...EMPTY };
  const ds = dailyState();
  if (!ds.ready) return null;
  const streak = ds.nextStreak;
  let keys = drawPack(3, seed % 1000003, state.owned, state.codes);
  let charms = ds.charms - ds.useCharms;
  let gotCharm = false;
  if (streak % 7 === 0) {
    const rare = PIECES.filter((p) => p.rare === 2 && (!p.only || (state.codes || []).includes(p.only)) && !state.owned[p.k]);
    if (rare.length) keys = [...keys, rare[seed % rare.length].k];
    if (charms < 2) {
      charms += 1;
      gotCharm = true;
    }
  }
  const fresh = addPieces(keys);
  const days = [...(ds.days || []), dayStr()].slice(-7);
  state = { ...state, daily: { last: dayStr(), streak, charms, days } };
  persist();
  emit();
  return { keys, fresh, streak, usedCharms: ds.useCharms, gotCharm, charms };
}
