// 조각 이름 — 한국어 화면은 박물관 이름 그대로, 다른 언어 화면은 영어 이름(없으면 원래 이름)
import { getLang } from '../i18n';
import { NAME_FIX } from '../data/pieceNameFix';

export function pieceName(p) {
  if (!p) return '';
  if (getLang() !== 'ko' && p.en) return p.en;
  return NAME_FIX[p.k] || p.name;
}
// 짧은 이름 — 작품 이름(「○○호」)·자막에 쓴다
export function pieceShort(p) {
  if (!p) return '';
  if (getLang() !== 'ko' && p.en) {
    const w = p.en.split(' ');
    const last = w[w.length - 1];
    return last.charAt(0).toUpperCase() + last.slice(1);
  }
  const clean = String(NAME_FIX[p.k] || p.name || '').replace(/\(.*?\)|\[.*?\]|「|」/g, '').trim();
  const parts = clean.split(/\s+/);
  return parts[parts.length - 1] || clean;
}
