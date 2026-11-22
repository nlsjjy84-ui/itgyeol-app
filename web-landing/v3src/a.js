import { mountRelic, pinProgress, progressOf, reveal, countUp } from './relic3d.js';

reveal();
document.querySelectorAll('.cnt').forEach(countUp);

// 첫 화면: 조명 아래 도는 원숭이 연적 — 스크롤하면 한 바퀴 더 돌며 다가온다
const hero = document.getElementById('hero');
mountRelic(document.getElementById('hero3d'), { bin: '../m/monkey.bin', tex: '../m/monkey.jpg', light: 'warm', dist: 2.9, rough: 0.42 }).then((s) => {
  s.onFrame = (st, dt) => {
    const p = pinProgress(hero);
    st.root.rotation.y += dt * 0.32;
    st.root.rotation.x = Math.sin(st.t * 0.5) * 0.08 + p * 0.25;
    st.cam.position.z = 2.9 - p * 0.7;
    st.root.position.y = Math.sin(st.t * 0.9) * 0.02;
  };
}).catch(() => {});

// 네 걸음: 고정된 화면에서 스크롤에 따라 장면이 바뀐다
const steps = document.getElementById('steps');
const items = [...steps.querySelectorAll('.step')];
const num = steps.querySelector('.stepnum span');
const bar = steps.querySelector('.bar i');
const HAN = ['하나', '둘', '셋', '넷'];
let cur = -1;
function onScroll() {
  const p = pinProgress(steps);
  const i = Math.min(3, Math.floor(p * 4));
  bar.style.width = (p * 100).toFixed(1) + '%';
  if (i !== cur) {
    cur = i;
    items.forEach((el, k) => el.classList.toggle('on', k === i));
    num.style.opacity = 0;
    setTimeout(() => { num.textContent = HAN[i]; num.style.opacity = 1; }, 220);
  }
  // 유물 벽: 떠다니는 유물이 스크롤 속도를 달리해 움직인다
  const w = document.getElementById('wall');
  const wp = progressOf(w) - 0.5;
  w.querySelectorAll('.float').forEach((im) => {
    const sp = +im.dataset.sp;
    im.style.transform = `translateY(${(wp * sp * 900).toFixed(1)}px) rotate(${(wp * sp * 30).toFixed(1)}deg)`;
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// 물건 사진: 디퓨저 → 문진 → 명상벨 차례로 바뀐다
const ph = [...document.querySelectorAll('.photos img')];
let k = 0;
setInterval(() => { ph[k].classList.remove('on'); k = (k + 1) % ph.length; ph[k].classList.add('on'); }, 3600);
