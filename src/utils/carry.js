// 집에서 이어서 하기 — 박물관에서 만든 작품(완성한 판 기록 + 놀이 횟수)을 QR 주소 하나에 담는다.
// 서버 없이 주소(?w=...)만으로 옮기므로 개인 정보는 들어가지 않는다(놀이 기록뿐).
export const SITE_URL = 'https://nlsjjy84-ui.github.io/itgyeol-app/';

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

// UTF-8 문자열 ↔ base64url (btoa가 없는 환경도 있어 직접 구현)
function toBytes(str) {
  const out = [];
  for (const ch of str) {
    let c = ch.codePointAt(0);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return out;
}
function fromBytes(b) {
  let s = '';
  for (let i = 0; i < b.length; ) {
    const x = b[i++];
    let c;
    if (x < 0x80) c = x;
    else if (x < 0xe0) c = ((x & 31) << 6) | (b[i++] & 63);
    else if (x < 0xf0) c = ((x & 15) << 12) | ((b[i++] & 63) << 6) | (b[i++] & 63);
    else c = ((x & 7) << 18) | ((b[i++] & 63) << 12) | ((b[i++] & 63) << 6) | (b[i++] & 63);
    s += String.fromCodePoint(c);
  }
  return s;
}
export function b64encode(str) {
  const b = toBytes(str);
  let out = '';
  for (let i = 0; i < b.length; i += 3) {
    const n = (b[i] << 16) | ((b[i + 1] || 0) << 8) | (b[i + 2] || 0);
    out += ABC[(n >> 18) & 63] + ABC[(n >> 12) & 63];
    if (i + 1 < b.length) out += ABC[(n >> 6) & 63];
    if (i + 2 < b.length) out += ABC[n & 63];
  }
  return out;
}
export function b64decode(s) {
  const b = [];
  let buf = 0;
  let bits = 0;
  for (const ch of s) {
    const v = ABC.indexOf(ch);
    if (v < 0) throw new Error('bad');
    buf = (buf << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      b.push((buf >> bits) & 255);
    }
  }
  return fromBytes(b);
}

// 판 기록을 짧게: [판, 문제, 짝맞춤, 기운, 속도, 시드]
export function packJourney({ attempts = [], playLog } = {}) {
  const a = attempts.map((x) => [x.sceneId, x.formationId, x.mappingCode, x.ohangKey, x.speed, x.seed]);
  // 셋째 칸: 몸짓·표정·감탄사 횟수와 세기(있을 때만) — 집에서 열어도 같은 모양이 나오게 함께 옮긴다
  const p = playLog ? [playLog.byGame || {}, playLog.byScene || {}, ...(playLog.senses ? [playLog.senses] : [])] : [{}, {}];
  return b64encode(JSON.stringify({ v: 1, a, p }));
}

export function unpackJourney(code) {
  try {
    const o = JSON.parse(b64decode(String(code || '')));
    if (!o || o.v !== 1 || !Array.isArray(o.a)) return null;
    const attempts = o.a
      .filter((r) => Array.isArray(r) && r.length >= 6 && typeof r[0] === 'string' && Number.isFinite(r[5]))
      .map(([sceneId, formationId, mappingCode, ohangKey, speed, seed]) => ({
        sceneId, formationId, mappingCode, ohangKey, speed, seed: seed >>> 0, seedStr: '', createdAt: Date.now(),
      }));
    const num = (m) => Object.fromEntries(Object.entries(m && typeof m === 'object' ? m : {}).filter(([, v]) => Number.isFinite(v)));
    const p = Array.isArray(o.p) ? o.p : [{}, {}];
    const playLog = { byGame: num(p[0]), byScene: num(p[1]) };
    if (p[2] && typeof p[2] === 'object') playLog.senses = num(p[2]);
    return { attempts, playLog };
  } catch (e) {
    return null;
  }
}

export function carryUrl(journey) {
  return `${SITE_URL}?w=${packJourney(journey)}`;
}

// 웹에서 주소에 ?w= 가 있으면 한 번만 읽고 주소에서 지운다(새로 고쳐도 두 번 들어오지 않게).
let cached;
export function readCarryOnce() {
  if (cached !== undefined) return cached;
  cached = null;
  try {
    if (typeof window === 'undefined' || !window.location) return cached;
    const m = /[?&]w=([A-Za-z0-9_-]+)/.exec(window.location.search || '');
    if (!m) return cached;
    cached = unpackJourney(m[1]);
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    }
  } catch (e) {
    cached = null;
  }
  return cached;
}

// 가져온 기록을 지금 기기의 기록에 합친다 — 같은 판은 가져온 것으로, 놀이 횟수는 큰 쪽으로.
export function mergeAttempts(cur = [], incoming = []) {
  const ids = new Set(incoming.map((a) => a.sceneId));
  return [...cur.filter((a) => !ids.has(a.sceneId)), ...incoming];
}
export function mergeLog(cur = { byGame: {}, byScene: {} }, inc = { byGame: {}, byScene: {} }) {
  const mx = (a, b) => {
    const o = { ...a };
    Object.entries(b || {}).forEach(([k, v]) => { o[k] = Math.max(o[k] || 0, v); });
    return o;
  };
  const out = { byGame: mx(cur.byGame, inc.byGame), byScene: mx(cur.byScene, inc.byScene) };
  if (cur.senses || inc.senses) out.senses = mx(cur.senses, inc.senses);
  return out;
}
