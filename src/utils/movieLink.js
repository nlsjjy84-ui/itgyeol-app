// 합체 영상 공유 링크 — 틀·조각·씨앗만 짧게 담는다. 링크(또는 QR)를 연 사람 누구나 같은 영상을 본다.
// 형식: ?m=<틀id>~<씨앗>~<조각1>.<조각2>...  (조각 순서 = 틀의 자리 순서, 국중박 n12345 · 고궁 g12345)
import { Platform } from 'react-native';
import { FRAME_BY_ID } from '../data/frames';
import { PIECE_BY_K } from '../data/pieces';
import { SITE_URL } from './carry';

const short = (k) => (k.startsWith('nmk_') ? 'n' + k.slice(4) : k.startsWith('gogung_') ? 'g' + k.slice(7) : k);
const long = (s) => (s[0] === 'n' ? 'nmk_' + s.slice(1) : s[0] === 'g' ? 'gogung_' + s.slice(1) : s);

export function packMovie({ frameId, assign, seed, layout }) {
  if (frameId === 'free') {
    const r = (v) => Math.round(v);
    return `free~${seed || 1}~${(layout || []).map((it) => [short(it.k), r(it.x), r(it.y), r(it.w), r(it.rot || 0), it.flip ? 1 : 0].join(',')).join('_')}`;
  }
  const f = FRAME_BY_ID[frameId];
  if (!f) return '';
  const keys = f.parts ? [assign.core] : f.slots.map((s) => assign[s.key]);
  return `${frameId}~${seed || 1}~${keys.map((k) => (k ? short(k) : '')).join('.')}`;
}
export function unpackMovie(code) {
  try {
    const [frameId, seedS, list] = String(code).split('~');
    if (frameId === 'free') {
      const layout = (list || '')
        .split('_')
        .map((x) => x.split(','))
        .map(([k, x, y, w, rot, fl]) => ({ k: long(k), x: +x, y: +y, w: +w, rot: +rot, flip: fl === '1' }))
        .filter((it) => PIECE_BY_K[it.k]);
      return layout.length ? { frameId: 'free', assign: {}, layout, seed: parseInt(seedS, 10) || 1, shared: true } : null;
    }
    const f = FRAME_BY_ID[frameId];
    if (!f || !list) return null;
    const keys = list.split('.').map(long);
    const assign = {};
    if (f.parts) {
      if (!PIECE_BY_K[keys[0]]) return null;
      assign.core = keys[0];
    } else
      f.slots.forEach((s, i) => {
        if (PIECE_BY_K[keys[i]]) assign[s.key] = keys[i];
      });
    if (!Object.keys(assign).length) return null;
    return { frameId, assign, seed: parseInt(seedS, 10) || 1, shared: true };
  } catch (e) {
    return null;
  }
}
export function movieUrl(params) {
  return `${SITE_URL}?m=${encodeURIComponent(packMovie(params))}`;
}
// 웹에서 주소에 ?m= 이 있으면 한 번 읽는다
export function readMovieParam() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    const m = new URLSearchParams(window.location.search).get('m');
    return m ? unpackMovie(m) : null;
  } catch (e) {
    return null;
  }
}
