import { mountRelic, pinProgress, reveal, countUp } from './relic3d.js';

reveal();
document.querySelectorAll('.cnt').forEach(countUp);

const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp = (x) => Math.min(1, Math.max(0, x));

// 첫 화면: 연화문 벽돌 한 장이 돌다가, 스크롤하면 네 장으로 나뉘어 모서리끼리 맞붙어 꽃 하나가 된다
const hero = document.getElementById('hero');
const phase = document.getElementById('phase');
const GRID = [[-0.5, 0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, -0.5]];
const FROM = [[-2.4, 1.8], [2.6, 1.6], [-2.2, -1.9], [2.5, -1.7]];
mountRelic(document.getElementById('lotus'), { bin: '../m/lotus.bin', tex: '../m/lotus.jpg', rot: [Math.PI / 2, 0, 0], light: 'ink', copies: 4, dist: 2.7, rough: 0.85 }).then((s) => {
  let lastPhase = '';
  s.onFrame = (st) => {
    const p = pinProgress(hero);
    // 넓은 화면: 스크롤로 모인다 / 휴대폰: 첫 화면이 길어 스크롤 대신 저절로 모였다 흩어졌다 한다
    const mobile = window.innerWidth < 820;
    const a = mobile ? ease(clamp(0.5 - 0.62 * Math.cos(st.t * 0.55))) : ease(clamp((p - 0.12) / 0.6));
    const idle = 1 - a;
    st.items.forEach((g, i) => {
      if (i === 0) {
        g.position.set(GRID[0][0] * a, GRID[0][1] * a, 0);
      } else {
        const t = a;
        g.position.set(FROM[i][0] + (GRID[i][0] - FROM[i][0]) * t, FROM[i][1] + (GRID[i][1] - FROM[i][1]) * t, -1.5 * (1 - t));
      }
      g.visible = i === 0 || a > 0.02;
      g.rotation.set(0, 0, 0);
    });
    // 한 장일 때는 천천히 돌고, 모일수록 정면으로 선다
    st.root.rotation.y = idle * Math.sin(st.t * 0.45) * 0.9;
    st.root.rotation.x = idle * (Math.sin(st.t * 0.3) * 0.25 - 0.15) + a * 0.0;
    st.root.rotation.z = a * Math.sin(st.t * 0.25) * 0.03;
    st.cam.position.z = 2.7 + a * 2.3;
    const ph = a < 0.05 ? '벽돌 한 장 — 가운데 큰 연꽃' : a < 0.97 ? '네 장이 모입니다…' : '네 모서리가 만나 — 꽃이 하나 더 피었습니다';
    if (ph !== lastPhase) { lastPhase = ph; phase.textContent = ph; }
  };
}).catch(() => {});

// 두루마리: 세로 스크롤을 가로 흐름으로
const roll = document.getElementById('roll');
const track = document.getElementById('track');
function onScroll() {
  const p = pinProgress(roll);
  const max = Math.max(0, track.scrollWidth - window.innerWidth);
  track.style.transform = `translateX(${(-p * max).toFixed(1)}px)`;
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();
