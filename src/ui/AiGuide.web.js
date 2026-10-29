import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createAiGuide } from './aiGuide/aiGuide';
import { STEPS, PLACE, courseIds, zoneOf } from './GuideDuo';
import { t } from '../i18n';

// AI 길 안내(웹) — 풍이·결이 상자 대신, 마우스 커서가 버튼을 꺾쇠로 감싸고 오방색 리본이 뒤따른다.
// 설명은 버튼 옆에 글자만 뜨고, 아무것도 가리거나 막지 않는다. 코스는 「데모 둘러보기」 하나.
// 앱(안드로이드·iOS)은 마우스가 없어서 AiGuide.js(예전 길 안내)를 그대로 쓴다.

const KEY = 'itgyeol_aiguide_v2';
const GREETED = 'itgyeol_aiguide_greeted';
const QUIET = 'itgyeol_aiguide_quiet';
const TOUR = 'long'; // 예전 「10분 자세히」 열두 곳 — 3분·10분·평가자용으로 나누지 않는다
const OBANG = ['#d9443a', '#e9b42a', '#2c62c9', '#3d8a5a']; // 적·황·청 + 녹(리본 넷)
// 전시 벽·키오스크는 전시장 화면이라 「길 안내」 글자를 숨긴다(효과는 그대로).
const QUIET_SCREENS = ['Kiosk', 'ExhibitWall'];

// 자동 브라우저 테스트에서는 커서를 바꾸지 않는다(테스트가 화면을 그대로 누르게). 주소에 guide=1 이 있으면 켠다.
const HIDDEN = (() => {
  try {
    return typeof navigator !== 'undefined' && navigator.webdriver && !(typeof location !== 'undefined' && /[?&]guide=1/.test(location.search || ''));
  } catch (e) {
    return false;
  }
})();

const store = {
  get(key, fallback) { try { const v = window.sessionStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
  set(key, v) { try { if (v == null) window.sessionStorage.removeItem(key); else window.sessionStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* 이 화면에서만 */ } },
};
const read = () => ({ course: null, index: 0, done: [], ...(store.get(KEY, null) || {}) });
const write = (s) => store.set(KEY, s);

// 버튼 글자로 「이게 뭔지, 왜 좋은지」를 찾는다(판 이름·재료·전시 등).
const KEYWORDS = [
  ['진법', 'jinbeop'], ['진풀이', 'jinbeop'], ['인쇄', 'print'], ['훈민정음', 'print'], ['전래놀이', 'play'],
  ['테트리스', 'hangul'], ['탈춤', 'talchum'], ['단청', 'dancheong'], ['전통 재료', 'materials'], ['재료', 'materials'],
  ['예시 작품', 'gallery'], ['자료실', 'archive'], ['전시관', 'exhibit'], ['키오스크', 'kiosk'], ['내 작품', 'result'],
];
export function guideText(el) {
  if (!el) return null;
  const name = ((el.getAttribute && el.getAttribute('aria-label')) || el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
  // 화면 전체를 감싼 큰 묶음(글자가 긴 것)은 설명하지 않는다 — 버튼 하나에만 붙인다.
  if (!name || name.length > 40) return null;
  for (const [kw, id] of KEYWORDS) {
    if (name.includes(kw) || name.includes(t(kw))) return { title: name.slice(0, 24), text: t(STEPS[id].say) };
  }
  return null;
}

// 판 화면은 위쪽 판 이름 칸(진법·훈민정음·인쇄…)을, 그 밖의 화면은 제목을 꺾쇠로 감싼다.
const TAB_TEXT = { Jinbeop: '진법', Print: '훈민정음·인쇄', Play: '전래놀이', Hangul: '한글 테트리스', Talchum: '탈춤', Dancheong: '단청' };
function findText(text) {
  const want = [text, t(text)];
  // 누르는 칸(판 이름 칩)을 먼저, 없으면 글자 칸 — 각각 가장 작은 것(화면 폭 전체로 늘어난 줄은 빼고)
  const hits = [];
  for (const el of document.querySelectorAll('div,span,a,button,[role="button"],[role="heading"],h1,h2')) {
    if (el.closest('.aig,.aig-launch-wrap')) continue;
    const s = (el.innerText || '').trim();
    if (!want.includes(s)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8 || r.bottom < 0 || r.top > innerHeight || r.width > innerWidth * 0.5) continue;
    hits.push({ el, area: r.width * r.height, press: el.matches('[role="button"],[tabindex="0"],button,a') });
  }
  hits.sort((x, y) => (y.press - x.press) || (x.area - y.area));
  return hits[0] ? hits[0].el : null;
}
const targetFor = (route) => () => (TAB_TEXT[route] && findText(TAB_TEXT[route])) || findText(PLACE[route] || '') || screenTarget();

// 그 화면에서 꺾쇠로 감쌀 곳: 제목이 있으면 제목, 없으면 화면 위쪽의 첫 버튼.
function screenTarget() {
  const visible = (e) => { const r = e.getBoundingClientRect(); return r.width > 20 && r.height > 10 && r.bottom > 0 && r.top < innerHeight; };
  const heads = [...document.querySelectorAll('[role="heading"],h1,h2')].filter((e) => !e.closest('.aig') && visible(e));
  if (heads[0]) return heads[0];
  return [...document.querySelectorAll('[role="button"],button')].filter((e) => !e.closest('.aig,.aig-launch-wrap') && visible(e))[0] || null;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// 글자 뒤 바탕이 밝은지(한지색 화면) 어두운지(다크 모드) 본다 — 밝으면 진한 글씨 + 흰 빛으로 바꾼다.
function lightAt(x, y) {
  try {
    for (const el of document.elementsFromPoint(x, y)) {
      if (el.closest && el.closest('.aig,.aig-launch-wrap')) continue;
      const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
      if (!m) continue;
      if ((m[3] === undefined ? 1 : +m[3]) < 0.5) continue;
      return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255 > 0.6;
    }
  } catch (e) { /* 기본은 어두운 바탕 */ }
  return false;
}

export default function AiGuide(props) {
  if (HIDDEN || typeof document === 'undefined') return null;
  return <Guide {...props} />;
}

function Guide({ routeName, navigate, greet = true }) {
  const guideRef = useRef(null);
  const routeRef = useRef(routeName);
  routeRef.current = routeName;
  const runningRef = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quiet, setQuietState] = useState(() => store.get(QUIET, false) === true);
  const [, bump] = useState(0);
  const [light, setLight] = useState(false);
  useEffect(() => {
    const check = () => setLight(lightAt(window.innerWidth - 60, 70));
    const timer = setTimeout(check, 400);
    const every = setInterval(check, 1500);
    return () => { clearTimeout(timer); clearInterval(every); };
  }, [routeName]);
  const explainOn = useRef(true);
  explainOn.current = greet && !quiet;
  function setQuiet(on) { store.set(QUIET, on ? true : null); setQuietState(on); explainOn.current = greet && !on; }

  useEffect(() => {
    const g = createAiGuide({
      name: t('잇결 AI'), accent: [OBANG[0], OBANG[1], OBANG[2], '#f4efe6'], ribbonColors: OBANG, effect: 'ribbons', calm: true,
      clickSel: '[tabindex="0"]', // React Native 웹의 누르는 칸(Pressable)은 div라서 tabindex로 찾는다
      inkStrong: '#8c2a22',
      explain: (el) => (explainOn.current || read().course ? guideText(el) : null),
      where: () => t(PLACE[routeRef.current] || '잇결'),
      hud: () => Boolean(read().course),
      onQuit: () => { write({ ...read(), course: null, index: 0 }); bump((n) => n + 1); },
    });
    guideRef.current = g;
    return () => { g.stop(); guideRef.current = null; };
  }, []);

  useEffect(() => { document.documentElement.classList.toggle('aig-menu-open', menuOpen); return () => document.documentElement.classList.remove('aig-menu-open'); }, [menuOpen]);

  async function waitRoute(name, ms = 6000) {
    const until = Date.now() + ms;
    while (routeRef.current !== name && Date.now() < until) await wait(120);
    await wait(600); // 화면이 그려질 시간
    return routeRef.current === name;
  }

  async function drive() {
    const g = guideRef.current;
    if (!g || runningRef.current) return;
    runningRef.current = true;
    try {
      let state = read();
      const ids = courseIds(TOUR);
      while (state.course && state.index < ids.length) {
        const id = ids[state.index];
        const step = STEPS[id];
        if (routeRef.current !== step.route) {
          const go = await g.speak(t('지금은 {here}에 있어. 다음 목적지는 바로 「{there}」!', { here: t(PLACE[routeRef.current] || '다른 화면'), there: t(PLACE[step.route] || step.route) }),
            { kicker: t('잇결 AI · 길 안내'), buttons: [{ label: t('데려다줄게'), value: 'go', main: true }, { label: t('안내 끝내기'), value: 'end' }] });
          if (go === 'end' || go == null) { write({ ...state, course: null, index: 0 }); bump((n) => n + 1); return; }
          navigate(step.route);
          await waitRoute(step.route);
          continue;
        }
        const zone = zoneOf(TOUR, id);
        const where = `${t('데모 둘러보기')} · ${zone ? t(zone.name) : ''} ${zone ? `${zone.ids.indexOf(id) + 1}/${zone.ids.length}` : ''}`;
        const ok = await g.point({ target: targetFor(step.route), say: t(step.say), look: true, label: t(PLACE[step.route] || '') }, where);
        if (!ok) await g.speak(t('화면을 불러오는 중이라 이 곳은 건너뛸게.'), { kicker: t('잇결 AI') });
        state = { ...state, index: state.index + 1, done: [...new Set([...(state.done || []), id])] };
        write(state);
      }
      if (state.course) {
        write({ ...state, course: null, index: 0 });
        bump((n) => n + 1);
        await g.speak(t('데모 둘러보기 끝! 열두 곳을 다 돌았어. 이제 마음 가는 판부터 놀아 봐. 아무 버튼에나 마우스를 올리면 뭔지 알려 줄게.'),
          { kicker: t('잇결 AI · 오늘의 길 결산'), buttons: [{ label: t('마음대로 놀아 볼게'), value: 'end', main: true }] });
      }
    } finally {
      runningRef.current = false;
    }
  }

  function choose() {
    setMenuOpen(false);
    setQuiet(false);
    write({ ...read(), course: TOUR, index: 0 });
    bump((n) => n + 1);
    drive();
  }

  // 처음 온 사람에게 한 번 메뉴를 보여 준다. 코스 중이면 이어 간다.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (read().course) { drive(); return; }
      if (!greet || QUIET_SCREENS.includes(routeRef.current) || store.get(GREETED, false)) return;
      store.set(GREETED, true);
      setMenuOpen(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [greet]); // eslint-disable-line react-hooks/exhaustive-deps

  const resume = Boolean(read().course);
  if (QUIET_SCREENS.includes(routeName) && !menuOpen && !resume) return null;
  return createPortal(
    <div className={light ? 'aig-launch-wrap aig-light' : 'aig-launch-wrap'}>
      <style>{CSS}</style>
      {menuOpen ? (
        <div className="aig-menu" role="dialog" aria-label={t('잇결 길 안내')}>
          <p className="aig-menu-q">{t('처음이야? 잇결을 같이 둘러볼까?')}</p>
          <button type="button" onClick={choose}>{t('데모 둘러보기')}<small>{t('여섯 판부터 전시까지 같이 걸어 · 언제든 그만 볼 수 있어')}</small></button>
          <button type="button" className="aig-menu-quiet" onClick={() => { setQuiet(true); setMenuOpen(false); guideRef.current && guideRef.current.speak(t('설명은 끌게. 마음대로 놀아 봐. 다시 보고 싶으면 오른쪽 위 「✦ 데모 길 안내 켜기」를 눌러.'), { kicker: t('잇결 AI') }); }}>
            {t('설명 없이 둘러볼게')}<small>{t('설명 글은 끄고 바로 놀아 보기')}</small>
          </button>
          <button type="button" className="aig-menu-later" onClick={() => setMenuOpen(false)}>{t('나중에 볼게')}</button>
        </div>
      ) : null}
      <button type="button" className="aig-launch" aria-expanded={menuOpen} onClick={() => { if (resume && !menuOpen) { drive(); return; } if (quiet) setQuiet(false); setMenuOpen((o) => !o); }}>
        ✦ {resume ? t('이어서 안내') : quiet ? t('데모 길 안내 켜기') : t('데모 길 안내')}
      </button>
    </div>,
    document.body,
  );
}

// 「✦ 데모 길 안내」와 위치 표시는 오른쪽 위 한곳에(엔진이 --aig-top을 맞춘다). 상자 없이 글자만.
const CSS = `
.aig-launch-wrap{position:fixed;right:20px;top:var(--aig-top,14px);z-index:2147483601;display:flex;flex-direction:column;align-items:flex-end;text-align:right;gap:10px;pointer-events:none;font-family:inherit;transition:top .25s}
.aig-launch{all:unset;order:-1;pointer-events:auto;cursor:pointer;color:#f2c230;font-size:15.5px;font-weight:900;letter-spacing:-.01em;
  text-shadow:0 0 1px #000,0 1px 3px rgba(0,0,0,.95),0 0 12px rgba(0,0,0,.8),0 0 18px rgba(217,68,58,.5);animation:aig-launch-glow 2.4s ease-in-out infinite}
.aig-launch:hover,.aig-launch:focus-visible{color:#fff}
@keyframes aig-launch-glow{0%,100%{opacity:.78}50%{opacity:1}}
.aig-menu{display:flex;flex-direction:column;align-items:flex-end;gap:8px;pointer-events:none;text-shadow:0 0 1px #000,0 1px 3px rgba(0,0,0,.95),0 0 12px rgba(0,0,0,.8)}
.aig-menu-q{margin:0;color:#fff;font-size:15px;font-weight:800}
.aig-menu button{all:unset;pointer-events:auto;cursor:pointer;color:#f2c230;font-size:17px;font-weight:900;text-decoration:underline;text-underline-offset:5px;text-decoration-thickness:2px}
.aig-menu button small{display:block;color:#f4efe6;font-size:11.5px;font-weight:700;text-decoration:none;margin-top:2px}
.aig-menu button:hover,.aig-menu button:focus-visible{color:#fff}
.aig-menu .aig-menu-quiet{color:#f4efe6;font-size:15px}
.aig-menu .aig-menu-later{font-size:12.5px;color:#e6dccd}
.aig-light .aig-launch,.aig-light .aig-menu button{color:#b3322a;text-shadow:0 0 1px #fff,0 0 6px rgba(255,255,255,.98),0 0 14px rgba(255,255,255,.9)}
.aig-light .aig-menu{text-shadow:0 0 1px #fff,0 0 6px rgba(255,255,255,.98),0 0 14px rgba(255,255,255,.9)}
.aig-light .aig-menu-q,.aig-light .aig-menu .aig-menu-quiet{color:#2a1f1a}
.aig-light .aig-menu button small,.aig-light .aig-menu .aig-menu-later{color:#5b4c42}
.aig-light .aig-launch:hover,.aig-light .aig-menu button:hover{color:#2c62c9}
@media (prefers-reduced-motion:reduce){.aig-launch{animation:none}}
`;
