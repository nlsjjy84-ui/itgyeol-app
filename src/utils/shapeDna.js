import { combineSeed } from './resultSeed';

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

export function makeDna(attempts) {
  if (!attempts || attempts.length === 0) return NEUTRAL_DNA;
  return dnaFromSeed(combineSeed(attempts));
}

export function dnaFromSeed(seed0) {
  const seed = seed0 >>> 0;
  const r = mulberry32(seed ^ 0x9e3779b9);
  const s = () => r() * 2 - 1; // -1~1
  const lobePick = [0, 0, 6, 8, 8, 10, 12][Math.floor(r() * 7)];
  return {
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
}

// 사람이 읽는 한 줄 — 왜 이 모양이 나왔는지
export function dnaSummary(d) {
  if (!d || !d.k) return '';
  const bits = [];
  bits.push(d.tall * 1 > 1.1 ? '길쭉한 몸' : d.tall < 0.9 ? '아담한 몸' : '균형 잡힌 몸');
  bits.push(d.belly > 0.14 ? '배가 불룩' : d.taper > 0.15 ? '위가 넓은 모양' : d.taper < -0.15 ? '아래가 넓은 모양' : '곧은 선');
  if (Math.abs(d.lean) > 0.09) bits.push(d.lean > 0 ? '살짝 오른쪽으로 기움' : '살짝 왼쪽으로 기움');
  bits.push(d.tassel > 1.3 ? '긴 술' : d.tassel < 0.85 ? '짧은 술' : '보통 술');
  return bits.join(' · ');
}
