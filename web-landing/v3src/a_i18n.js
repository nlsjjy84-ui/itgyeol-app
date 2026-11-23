// 소개 화면 a — 4개 국어(한국어·English·中文·日本語)
import TR from './a_tr.json';
const OK = ['ko', 'en', 'zh', 'ja'];
function pick() {
  const q = new URLSearchParams(location.search).get('lang');
  if (OK.includes(q)) return q;
  try { const s = localStorage.getItem('itgyeol.lang'); if (OK.includes(s)) return s; } catch (e) {}
  const n = (navigator.language || 'ko').slice(0, 2);
  return OK.includes(n) ? n : 'ko';
}
export const LANG = pick();
const D = TR[LANG] || null;
export const T = (s) => (D && D[s]) || s;
export function applyDom() {
  document.documentElement.lang = LANG;
  if (D) {
    if (D.__title) document.title = D.__title;
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const hits = [];
    while (w.nextNode()) { const n = w.currentNode; const k = n.nodeValue.trim(); if (k && D[k]) hits.push([n, k]); }
    hits.forEach(([n, k]) => { n.nodeValue = n.nodeValue.replace(k, D[k]); });
    document.querySelectorAll('[alt],[aria-label],[title]').forEach((el) => {
      ['alt', 'aria-label', 'title'].forEach((a) => { const v = el.getAttribute(a); if (v && D[v.trim()]) el.setAttribute(a, D[v.trim()]); });
    });
    // 앱 링크도 같은 언어로 열리게
    document.querySelectorAll('a[href*="itgyeol-app/"]').forEach((a) => {
      if (!a.href.includes('/intro')) { const u = new URL(a.href); u.searchParams.set('lang', LANG); a.href = u.toString(); }
    });
  }
  // 언어 바꾸기
  const top = document.querySelector('.top');
  if (top) {
    const box = document.createElement('span'); box.className = 'langs';
    [['ko', '한국어'], ['en', 'EN'], ['zh', '中文'], ['ja', '日本語']].forEach(([c, l]) => {
      const b = document.createElement('a'); b.textContent = l; b.href = '?lang=' + c + location.hash;
      if (c === LANG) b.className = 'on';
      b.addEventListener('click', () => { try { localStorage.setItem('itgyeol.lang', c); } catch (e) {} });
      box.appendChild(b);
    });
    top.insertBefore(box, top.lastElementChild);
  }
}
