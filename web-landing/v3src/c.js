import { mountRelic, pinProgress, reveal, countUp } from './relic3d.js';

reveal();
document.querySelectorAll('.cnt').forEach(countUp);

// 흐르는 띠: 끊기지 않게 한 벌 더 붙인다
const mq = document.getElementById('mq');
mq.innerHTML += mq.innerHTML;

// 첫 화면: 금강령 — 늘 천천히 돌고, 스크롤 속도만큼 흔들린다
let lastY = window.scrollY; let swing = 0;
mountRelic(document.getElementById('bell'), { bin: '../m/bell.bin', tex: '../m/bell.jpg', light: 'day', dist: 2.5, metal: 0.55, rough: 0.38 }).then((s) => {
  s.onFrame = (st, dt) => {
    const y = window.scrollY; const v = y - lastY; lastY = y;
    swing += v * 0.004; swing *= 0.93;
    st.root.rotation.y += dt * 0.5;
    st.root.rotation.z = Math.sin(st.t * 3.2) * Math.min(0.5, Math.abs(swing)) + Math.sin(st.t * 0.8) * 0.05;
    st.root.position.y = Math.sin(st.t * 1.1) * 0.02;
  };
}).catch(() => {});

// 여섯 판: 고정 무대에서 판마다 색·유물·설명이 바뀐다
const B = [
  { t: '진법', s: '풍물·강강술래·역사 속 대형', p: '여럿이 한 몸처럼 움직이던 대형을 직접 짜 보며, 함께 맞추는 힘을 익혀요.', g: '칼·창·투구·북', i: 'gogung_366574', bg: '#1f5aa6', fg: '#fffaf0' },
  { t: '훈민정음 · 인쇄', s: '글자를 짓고, 새기고, 찍는 판', p: '소리 나는 입 모양을 본뜬 훈민정음의 원리대로 글자를 만들어 봐요.', g: '도장·벼루·먹·연적', i: 'nmk_112600', bg: '#f4c542', fg: '#141414' },
  { t: '전래놀이', s: '줄넘기·상모돌리기·구슬치기 등 열두 가지', p: '만든 사람이 10년 넘게 아이들과 해 온 전래놀이를 손끝으로 옮겼어요.', g: '흙 인형·주사위·놀잇감', i: 'nmk_45001', bg: '#d9452b', fg: '#fffaf0' },
  { t: '한글 테트리스', s: '자음·모음 블록으로 줄 지우기', p: '블록을 쌓으며 한 글자가 짜이는 원리를 놀면서 익혀요.', g: '기와·막새·전돌', i: 'nmk_3036', bg: '#1d8a62', fg: '#fffaf0' },
  { t: '탈춤', s: '굿거리·타령 장단에 한삼 뿌리기', p: '장단의 큰 박에 맞춰 춤추며 우리 가락의 박자를 몸으로 익혀요.', g: '탈·노리개·비녀', i: 'gogung_364686', bg: '#141414', fg: '#f4c542' },
  { t: '단청', s: '가칠 → 타분 → 오색 → 분선', p: '단청장이 실제로 칠하는 순서를 따라가며 오색에 담긴 뜻을 익혀요.', g: '청자·백자·분청', i: 'nmk_6993', bg: '#fffaf0', fg: '#141414' },
];
const boards = document.getElementById('boards');
const stage = document.getElementById('stage');
const $ = (id) => document.getElementById(id);
const pips = [...document.querySelectorAll('#pips i')];
let cur = -1;
function setBoard(i) {
  const b = B[i];
  stage.classList.add('swap');
  stage.style.background = b.bg; stage.style.color = b.fg;
  setTimeout(() => {
    $('sn').textContent = i + 1; $('st').textContent = b.t; $('ss').textContent = b.s; $('sp').textContent = b.p;
    $('sg').textContent = '보따리 → ' + b.g; $('si').src = '../m/' + b.i + '.webp';
    stage.classList.remove('swap');
  }, 260);
}
function onScroll() {
  const p = pinProgress(boards);
  const i = Math.min(5, Math.floor(p * 6));
  if (i !== cur) { cur = i; setBoard(i); }
  const r = boards.getBoundingClientRect();
  const inside = r.top < window.innerHeight && r.bottom > 0;
  pips.forEach((el, k) => {
    const done = inside ? k <= i : (r.bottom <= 0);
    el.style.background = done ? B[k].bg === '#fffaf0' ? '#141414' : B[k].bg : '';
    el.classList.toggle('on', inside && k === i);
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// 뜻 카드: 누르면 뒤집힌다(화면에 들어오면 하나씩 저절로 한 번 뒤집어 보여 준다)
const cards = [...document.querySelectorAll('.card')];
cards.forEach((c) => c.addEventListener('click', () => c.classList.toggle('open')));
const io = new IntersectionObserver((es) => {
  if (!es[0].isIntersecting) return; io.disconnect();
  cards.forEach((c, k) => { setTimeout(() => c.classList.add('open'), 900 + k * 500); setTimeout(() => c.classList.remove('open'), 3600 + k * 500); });
}, { threshold: 0.5 });
io.observe(document.querySelector('.cards'));
