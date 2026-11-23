import { T, applyDom } from './a_i18n.js';
applyDom();
import Lenis from 'lenis';
import { mountRelic, pinProgress, progressOf, countUp } from './relic3d.js';

// ── 부드러운 스크롤: 휠·트랙패드 움직임을 미끄러지듯 이어 준다(휴대폰 손가락 스크롤은 그대로)
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let lenis = null;
if (!reduce) {
  lenis = new Lenis({ duration: 1.25, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true, wheelMultiplier: 1.05 });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  // 같은 쪽 안의 #링크도 미끄러지듯
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const t = document.querySelector(a.getAttribute('href')); if (!t) return; e.preventDefault(); lenis.scrollTo(t, { offset: 0 });
  }));
}

// ── 들어오는 글·사진: 같은 줄에 있는 것끼리 조금씩 늦게(차례로) 들어온다
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  const el = e.target; io.unobserve(el);
  const sib = [...el.parentElement.querySelectorAll(':scope > [data-in]')];
  const k = Math.max(0, sib.indexOf(el));
  el.style.transitionDelay = Math.min(k, 6) * 0.12 + 's';
  el.classList.add('on');
}), { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('[data-in]').forEach((el) => io.observe(el));
document.querySelectorAll('.cnt').forEach(countUp);

// 값이 바로 튀지 않고 따라가게(관성)
const follow = (cur, to, k) => cur + (to - cur) * k;

// ── 첫 화면: 조명 아래 도는 원숭이 연적 — 스크롤하면 천천히 다가온다
const hero = document.getElementById('hero');
let hp = 0;
mountRelic(document.getElementById('hero3d'), { bin: '../m/monkey.bin', tex: '../m/monkey.jpg', light: 'warm', dist: 2.9, rough: 0.42 }).then((s) => {
  s.onFrame = (st, dt) => {
    hp = follow(hp, pinProgress(hero), Math.min(1, dt * 3.2));
    st.root.rotation.y += dt * 0.26;
    st.root.rotation.x = Math.sin(st.t * 0.45) * 0.07 + hp * 0.22;
    st.cam.position.z = 2.9 - hp * 0.65;
    st.root.position.y = Math.sin(st.t * 0.8) * 0.018;
  };
}).catch(() => {});

// ── 네 걸음: 고정된 화면에서 스크롤에 따라 장면이 겹쳐 넘어간다
const steps = document.getElementById('steps');
const items = [...steps.querySelectorAll('.step')];
const num = steps.querySelector('.stepnum span');
const bar = steps.querySelector('.bar i');
const HAN = ['하나', '둘', '셋', '넷'].map(T);
let cur = -1; let barW = 0;
function setStep(i) {
  cur = i;
  items.forEach((el, k) => el.classList.toggle('on', k === i));
  num.classList.add('out');
  setTimeout(() => { num.textContent = HAN[i]; num.classList.remove('out'); }, 360);
}

// ── 유물 벽: 떠다니는 유물이 스크롤을 부드럽게 따라 떠오른다
const wall = document.getElementById('wall');
const floats = [...wall.querySelectorAll('.float')].map((im) => ({ im, sp: +im.dataset.sp, y: 0, r: 0 }));

function tick() {
  const p = pinProgress(steps);
  const i = Math.min(3, Math.floor(p * 4 * 0.999));
  if (i !== cur) setStep(i);
  barW = follow(barW, p * 100, 0.12);
  bar.style.width = barW.toFixed(2) + '%';

  const wp = progressOf(wall) - 0.5;
  for (const f of floats) {
    f.y = follow(f.y, wp * f.sp * 900, 0.08);
    f.r = follow(f.r, wp * f.sp * 30, 0.08);
    f.im.style.transform = `translate3d(0,${f.y.toFixed(1)}px,0) rotate(${f.r.toFixed(2)}deg)`;
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// ── 물건 사진: 디퓨저 → 문진 → 명상벨이 천천히 겹쳐 바뀐다
const ph = [...document.querySelectorAll('.photos img')];
let k = 0;
if (ph.length > 1) setInterval(() => { ph[k].classList.remove('on'); k = (k + 1) % ph.length; ph[k].classList.add('on'); }, 4200);

// ── 「유물 하나에, 물건 여럿」: 마우스로 잡아 끌어도 옆으로 넘어간다
const rail = document.querySelector('.morep .rail');
if (rail) {
  let down = false; let sx = 0; let sl = 0; let moved = 0;
  rail.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = 0; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add('drag'); });
  window.addEventListener('pointermove', (e) => { if (!down) return; const d = e.clientX - sx; moved = Math.abs(d); rail.scrollLeft = sl - d; });
  window.addEventListener('pointerup', () => { if (!down) return; down = false; rail.classList.remove('drag'); });
  rail.addEventListener('click', (e) => { if (moved > 6) e.preventDefault(); }, true);
  rail.setAttribute('data-lenis-prevent-horizontal', '');
}

// ── (c에서) 여섯 판: 고정 무대에서 판마다 오방색 조명·유물·설명이 바뀐다
const B = [
  { t: '진법', s: '풍물·강강술래·역사 속 대형을 짜는 판', w: '여럿이 한 몸처럼 움직이던 대형을 직접 짜 보며 함께 맞추는 힘을 익힙니다.', g: '칼·창·투구·북', i: 'gogung_366574', c: '#2f6fd0' },
  { t: '훈민정음 · 인쇄', s: '글자를 짓고, 새기고, 찍는 판', w: '소리 나는 입 모양을 본뜬 훈민정음의 원리대로 글자를 만들어 봅니다.', g: '도장·벼루·먹·연적', i: 'nmk_112600', c: '#e2b23a' },
  { t: '전래놀이', s: '줄넘기·상모돌리기·구슬치기 등 열두 가지', w: '만든 사람이 10년 넘게 아이들과 해 온 놀이를 손끝으로 옮겼습니다.', g: '흙 인형·주사위·놀잇감', i: 'nmk_45001', c: '#d9452b' },
  { t: '한글 테트리스', s: '자음·모음 블록을 쌓아 줄을 지우는 판', w: '한 글자가 짜이는 원리를 놀면서 익힙니다.', g: '기와·막새·전돌', i: 'nmk_3036', c: '#1f9a6c' },
  { t: '탈춤', s: '굿거리·타령 장단에 맞춰 한삼을 뿌리는 판', w: '장단의 큰 박에 맞춰 우리 가락의 박자를 몸으로 익힙니다.', g: '탈·노리개·비녀', i: 'gogung_364686', c: '#8a7f73' },
  { t: '단청', s: '가칠 → 타분 → 오색 → 분선, 칠하는 순서대로', w: '단청장의 실제 작업 순서를 따라가며 오색에 담긴 뜻을 익힙니다.', g: '청자·백자·분청', i: 'nmk_6993', c: '#efe7da' },
].map((b) => ({ ...b, t: T(b.t), s: T(b.s), w: T(b.w), g: T(b.g) }));
const NUM6 = ['하나', '둘', '셋', '넷', '다섯', '여섯'].map(T);
const bsec = document.getElementById('boards');
const bstage = document.getElementById('bstage');
const $id = (x) => document.getElementById(x);
const bp = [...document.querySelectorAll('#bpips i')];
B.forEach((b) => { const im = new Image(); im.src = '../m/' + b.i + '.webp'; });
let bcur = -1; let bt = 0;
function setBoard(i) {
  bcur = i; const b = B[i];
  bstage.style.setProperty('--bc', b.c); bstage.style.setProperty('--bc2', b.c === '#efe7da' ? '#d6aa5c' : b.c);
  bstage.classList.add('swap'); clearTimeout(bt);
  bt = setTimeout(() => {
    $id('bn').textContent = NUM6[i]; $id('bt').textContent = b.t; $id('bs').textContent = b.s; $id('bw').textContent = b.w; $id('bg').textContent = b.g;
    $id('bi').src = '../m/' + b.i + '.webp'; $id('bi').alt = b.g;
    bstage.classList.remove('swap');
  }, 380);
  bp.forEach((el, k) => { el.classList.toggle('on', k === i); el.classList.toggle('done', k <= i); el.style.setProperty('--pc', B[k].c === '#efe7da' ? '#d6aa5c' : B[k].c); });
}
function boardTick() {
  const p = pinProgress(bsec);
  const i = Math.min(5, Math.floor(p * 6 * 0.999));
  if (i !== bcur) setBoard(i);
  requestAnimationFrame(boardTick);
}
requestAnimationFrame(boardTick);

// ── (b에서) 연화문 벽돌 네 장이 날아와 모서리끼리 맞붙어 꽃 하나가 된다
const ease3 = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const lot = document.getElementById('lot');
const lphase = document.getElementById('lphase');
const GRID = [[-0.5, 0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, -0.5]];
const FROM = [[-2.4, 1.8], [2.6, 1.6], [-2.2, -1.9], [2.5, -1.7]];
let la = 0;
mountRelic(document.getElementById('lotus'), { bin: '../m/lotus.bin', tex: '../m/lotus.jpg', rot: [Math.PI / 2, 0, 0], light: 'warm', copies: 4, dist: 2.7, rough: 0.85 }).then((s) => {
  let last = '';
  s.onFrame = (st, dt) => {
    const target = ease3(clamp01((pinProgress(lot) - 0.1) / 0.62));
    la = follow(la, target, Math.min(1, dt * 4));
    const a = la; const idle = 1 - a;
    st.items.forEach((g, i) => {
      if (i === 0) g.position.set(GRID[0][0] * a, GRID[0][1] * a, 0);
      else g.position.set(FROM[i][0] + (GRID[i][0] - FROM[i][0]) * a, FROM[i][1] + (GRID[i][1] - FROM[i][1]) * a, -1.5 * (1 - a));
      g.visible = i === 0 || a > 0.02;
      g.rotation.set(0, 0, 0);
    });
    st.root.rotation.y = idle * Math.sin(st.t * 0.4) * 0.9;
    st.root.rotation.x = idle * (Math.sin(st.t * 0.28) * 0.25 - 0.15);
    st.root.rotation.z = a * Math.sin(st.t * 0.22) * 0.03;
    st.cam.position.z = 2.7 + a * 2.3;
    const ph = T(a < 0.05 ? '벽돌 한 장 — 가운데 큰 연꽃' : a < 0.97 ? '네 장이 모입니다…' : '네 모서리가 만나 — 꽃이 하나 더 피었습니다');
    if (ph !== last) { last = ph; lphase.style.opacity = 0; setTimeout(() => { lphase.textContent = ph; lphase.style.opacity = 1; }, 250); }
  };
}).catch(() => {});

// ── (c에서) 끝 화면 금강령: 늘 천천히 돌고, 스크롤 속도만큼 흔들린다
let lastY = window.scrollY; let swing = 0;
mountRelic(document.getElementById('bell3d'), { bin: '../m/bell.bin', tex: '../m/bell.jpg', light: 'warm', dist: 2.5, metal: 0.55, rough: 0.38 }).then((s) => {
  s.onFrame = (st, dt) => {
    const y = window.scrollY; const v = y - lastY; lastY = y;
    swing += v * 0.003; swing *= 0.94;
    st.root.rotation.y += dt * 0.4;
    st.root.rotation.z = Math.sin(st.t * 3) * Math.min(0.45, Math.abs(swing)) + Math.sin(st.t * 0.7) * 0.04;
    st.root.position.y = Math.sin(st.t * 1.0) * 0.02;
  };
}).catch(() => {});

// ── (c에서) 뜻 카드: 누르면 뒤집혀 뜻이 보인다 — 화면에 들어오면 하나씩 한 번 뒤집어 보여 준다
const minis = [...document.querySelectorAll('.mini')];
minis.forEach((c) => c.addEventListener('click', () => c.classList.toggle('open')));
if (minis.length) {
  const mio = new IntersectionObserver((es) => {
    if (!es[0].isIntersecting) return; mio.disconnect();
    minis.forEach((c, k) => { setTimeout(() => c.classList.add('open'), 1200 + k * 600); setTimeout(() => c.classList.remove('open'), 4400 + k * 600); });
  }, { threshold: 0.5 });
  mio.observe(minis[0].parentElement);
}
