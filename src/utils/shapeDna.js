import { combineSeed } from './resultSeed';
import { t as tr } from '../i18n';

// 작품마다 모양이 달라지게 하는 "형태 유전자".
// 놀이 기록(어떤 판을, 어떤 짝으로, 얼마나 빠르게 풀었는지)이 합쳐진 시드에서 나온다.
// 같은 기록이면 같은 모양, 기록이 조금만 달라도 모양이 달라진다 — 색만 바꾸는 게 아니라
// 비율·배·기울기·술·꽃잎 수·탑 층수 같은 "형태" 자체가 바뀐다.

function mulberry32(a) {
  let t = a >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// 변하지 않는 기본값(갤러리·시드 없을 때): 원래 모양 그대로
export const NEUTRAL_DNA = {
  seed: 0, code: '------',
  wide: 1, tall: 1, deep: 1, taper: 0, belly: 0, lean: 0,
  tassel: 1, tasselN: 0, pot: 0, wob: 0, ph: 0, neck: 0,
  lobes: 0, lobeAmp: 0.07, petals: 8, petalDepth: 0.14, ribs: 15, spread: 1.2, tiers: 3,
  k: 0,
};

// 놀이마다 모양에 남기는 "자국" — 어떤 놀이를 몇 번 했는지가 형태의 한 부분을 직접 바꾼다.
// n은 그 놀이를 한 횟수(1~6으로 제한). 놀이가 다르면 바뀌는 곳도 다르다.
const clampN = (n) => Math.min(6, n);
export const PLAY_TRAITS = {
  julneomgi: { name: '줄넘기', text: (n) => tr('줄넘기 {n}번 → 술이 길어졌어요', { n }), apply: (d, n) => { d.tassel += 0.1 * clampN(n); d.tasselN += clampN(n); } },
  juldarigi: { name: '줄다리기', text: (n) => tr('줄다리기 {n}번 → 몸이 넓어졌어요', { n }), apply: (d, n) => { d.wide += 0.025 * clampN(n); } },
  sangmo: { name: '상모돌리기', text: (n) => tr('상모돌리기 {n}번 → 몸이 한쪽으로 돌아 기울었어요', { n }), apply: (d, n) => { d.lean += 0.015 * clampN(n); d.lobes = d.lobes || 6 + 2 * (clampN(n) % 4); } },
  guseulchigi: { name: '구슬치기', text: (n) => tr('구슬치기 {n}번 → 배가 둥글어졌어요', { n }), apply: (d, n) => { d.belly += 0.025 * clampN(n); d.pot += 0.1 * clampN(n); } },
  paengi: { name: '팽이치기', text: (n) => tr('팽이치기 {n}번 → 아래가 좁아졌어요', { n }), apply: (d, n) => { d.taper += 0.03 * clampN(n); } },
  jachigi: { name: '자치기', text: (n) => tr('자치기 {n}번 → 키가 커졌어요', { n }), apply: (d, n) => { d.tall += 0.03 * clampN(n); } },
  biseok: { name: '비석치기', text: (n) => tr('비석치기 {n}번 → 탑 층이 늘었어요', { n }), apply: (d, n) => { d.tiers += Math.floor(clampN(n) / 2); } },
  tuho: { name: '투호', text: (n) => tr('투호 {n}번 → 목이 잘록해졌어요', { n }), apply: (d, n) => { d.neck -= 0.15 * clampN(n); } },
  ddakji: { name: '딱지치기', text: (n) => tr('딱지치기 {n}번 → 꽃잎이 늘었어요', { n }), apply: (d, n) => { d.petals += clampN(n); } },
  gomugojul: { name: '고무줄놀이', text: (n) => tr('고무줄놀이 {n}번 → 부챗살이 늘었어요', { n }), apply: (d, n) => { d.ribs += 2 * clampN(n); } },
  yeonnaligi: { name: '연날리기', text: (n) => tr('연날리기 {n}번 → 부채가 더 활짝 펴졌어요', { n }), apply: (d, n) => { d.spread += 0.05 * clampN(n); } },
  gullyeongsoe: { name: '굴렁쇠', text: (n) => tr('굴렁쇠 {n}번 → 테두리가 더 굴곡졌어요', { n }), apply: (d, n) => { d.lobeAmp += 0.008 * clampN(n); d.wob += 0.12 * clampN(n); } },
};
const SCENE_TRAITS = {
  jinbeop: { text: (n) => tr('진법 {n}번 → 깊이가 두꺼워졌어요', { n }), apply: (d, n) => { d.deep += 0.02 * clampN(n); } },
  print: { text: (n) => tr('훈민정음·인쇄 {n}번 → 꽃잎이 깊어졌어요', { n }), apply: (d, n) => { d.petalDepth += 0.01 * clampN(n); } },
  hangul: { text: (n) => tr('한글 테트리스 {n}번 → 몸이 반듯하게 서요', { n }), apply: (d, n) => { d.lean *= Math.max(0.2, 1 - 0.15 * clampN(n)); d.tall += 0.015 * clampN(n); } },
};

export function playCounts(attempts) {
  const byGame = {};
  const byScene = {};
  (attempts || []).forEach((a) => {
    byScene[a.sceneId] = (byScene[a.sceneId] || 0) + 1;
    if (a.sceneId === 'tbd') byGame[a.formationId] = (byGame[a.formationId] || 0) + 1;
  });
  return { byGame, byScene };
}

export function makeDna(attempts, log) {
  if (!attempts || attempts.length === 0) return NEUTRAL_DNA;
  return dnaFromSeed(combineSeed(attempts), attempts, log);
}

export function dnaFromSeed(seed0, attempts, log) {
  const seed = seed0 >>> 0;
  const r = mulberry32(seed ^ 0x9e3779b9);
  const s = () => r() * 2 - 1; // -1~1
  const lobePick = [0, 0, 6, 8, 8, 10, 12][Math.floor(r() * 7)];
  const d = {
    seed,
    code: seed.toString(36).toUpperCase().slice(-6).padStart(6, '0'),
    wide: 1 + s() * 0.17,
    tall: 1 + s() * 0.17,
    deep: 1 + s() * 0.14,
    taper: s() * 0.26,
    belly: s() * 0.16 + 0.04,
    lean: s() * 0.07,
    tassel: 0.65 + r() * 0.95,
    tasselN: Math.floor(r() * 10),
    pot: s(),
    wob: s(),
    ph: r() * Math.PI * 2,
    neck: s(),
    lobes: lobePick,
    lobeAmp: 0.04 + r() * 0.06,
    petals: 5 + Math.floor(r() * 8),
    petalDepth: 0.08 + r() * 0.12,
    ribs: 11 + Math.floor(r() * 9),
    spread: 0.95 + r() * 0.45,
    tiers: 2 + Math.floor(r() * 4),
    k: 1,
  };
  d.traits = [];
  if (attempts) {
    let { byGame, byScene } = playCounts(attempts);
    if (log && log.byScene) {
      // 저장된 기록(몇 번 했는지)이 있으면 그걸 쓰되, 이 작품에 들어간 판의 것만 반영한다
      const scenes = new Set(attempts.map((a) => a.sceneId));
      byScene = {};
      Object.keys(log.byScene).forEach((sc) => { if (scenes.has(sc)) byScene[sc] = log.byScene[sc]; });
      byGame = scenes.has('tbd') ? { ...log.byGame } : {};
    }
    Object.keys(byGame).forEach((g) => { const t = PLAY_TRAITS[g]; if (t) { t.apply(d, byGame[g]); d.traits.push(t.text(byGame[g])); } });
    Object.keys(byScene).forEach((sc) => { const t = SCENE_TRAITS[sc]; if (t) { t.apply(d, byScene[sc]); d.traits.push(t.text(byScene[sc])); } });
    const lim = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    d.tall = lim(d.tall, 0.8, 1.3); d.wide = lim(d.wide, 0.8, 1.3); d.deep = lim(d.deep, 0.8, 1.25);
    d.taper = lim(d.taper, -0.35, 0.4); d.lean = lim(d.lean, -0.2, 0.2);
    d.belly = lim(d.belly, -0.1, 0.32); d.tassel = lim(d.tassel, 0.6, 2.2); d.tasselN = Math.min(16, d.tasselN);
    d.tiers = Math.min(5, d.tiers); d.petals = Math.min(14, d.petals); d.ribs = Math.min(25, d.ribs);
    d.spread = Math.min(1.6, d.spread); d.lobeAmp = Math.min(0.12, d.lobeAmp);
    d.pot = lim(d.pot, -1, 1); d.wob = lim(d.wob, -1, 1); d.neck = lim(d.neck, -1, 1);
  }
  return d;
}

// 사람이 읽는 한 줄 — 왜 이 모양이 나왔는지
// 예시 작품처럼 기록(놀이 id, 횟수)만 있을 때 지금 언어로 자국 문장을 만든다.
export function traitText(kind, id, n) {
  const t = kind === 'g' ? PLAY_TRAITS[id] : SCENE_TRAITS[id];
  return t ? t.text(n) : '';
}

export function dnaSummary(d) {
  if (!d || !d.k) return '';
  const bits = [];
  bits.push(d.tall * 1 > 1.1 ? tr('길쭉한 몸') : d.tall < 0.9 ? tr('아담한 몸') : tr('균형 잡힌 몸'));
  bits.push(d.belly > 0.14 ? tr('배가 불룩') : d.taper > 0.15 ? tr('위가 넓은 모양') : d.taper < -0.15 ? tr('아래가 넓은 모양') : tr('곧은 선'));
  if (Math.abs(d.lean) > 0.09) bits.push(d.lean > 0 ? tr('살짝 오른쪽으로 기움') : tr('살짝 왼쪽으로 기움'));
  bits.push(d.tassel > 1.3 ? tr('긴 술') : d.tassel < 0.85 ? tr('짧은 술') : tr('보통 술'));
  return bits.join(' · ');
}
