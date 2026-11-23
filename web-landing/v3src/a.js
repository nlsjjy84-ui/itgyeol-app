import Lenis from 'lenis';
import { mountRelic, pinProgress, progressOf, countUp } from './relic3d.js';

// ── 부드러운 스크롤: 휠·트랙패드 움직임을 미끄러지듯 이어 준다(휴대폰 손가락 스크롤은 그대로)
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let lenis = null;
if (!reduce) {
  lenis = new Lenis({ duration: 1.25, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true, wheelMultiplier: 0.9 });
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
const HAN = ['하나', '둘', '셋', '넷'];
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
