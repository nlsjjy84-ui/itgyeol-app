/**
 * 잇결 소개 화면 — 스크롤하면 다음 화면으로 이어지며 계속 바뀐다.
 * 뒤에는 3D 장면(오방색 점과 결)이 붙어 있고, 화면들은 그 위로 흘러간다.
 * 첫 화면 → 놀이(판 여섯이 가로로 넘어감) → 과정(유물 → 놀이 → 작품) → 결과물(작품이 둥글게 돈다) → 자료실 → 원칙 → 숫자 → 마지막
 * 도구: Lenis(매끄러운 스크롤) + GSAP ScrollTrigger(글 등장) + three.js. 네모 틀 없음, 사람 그림 없음.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { ItgyeolScene, jangdanName } from './scene';
import { PLAYS, STEPS, GALLERY, ARCHIVE, NUMBERS } from './content';

declare const __IMG__: Record<string, string>; // 빌드가 넣는 그림 주소표
declare const __APP__: string; // 앱 주소

const img = (key: string) => __IMG__[key] ?? '';
const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const smooth = (n: number) => {
  n = clamp(n);
  return n * n * (3 - 2 * n);
};

type Sec = { id: string; scene: [number, number]; shift: number; veil: 'left' | 'right' | 'center' | 'soft' };
const SECTIONS: Sec[] = [
  { id: 'hero', scene: [0, 0.1], shift: -0.18, veil: 'left' },
  { id: 'play', scene: [0.1, 0.4], shift: -0.24, veil: 'left' },
  { id: 'process', scene: [0.4, 0.58], shift: 0, veil: 'soft' },
  { id: 'works', scene: [0.58, 0.8], shift: 0, veil: 'center' },
  { id: 'archive', scene: [0.8, 0.86], shift: 0, veil: 'soft' },
  { id: 'rule', scene: [0.86, 0.9], shift: 0.18, veil: 'right' },
  { id: 'numbers', scene: [0.9, 0.95], shift: 0, veil: 'soft' },
  { id: 'final', scene: [0.95, 1], shift: 0, veil: 'center' },
];

function html() {
  const app = __APP__;
  const play = PLAYS.map(
    (p) => `<article class="ig-hpanel">
      <span class="ig-hno">${p.no} · ${p.sub}</span>
      <h3>${p.word}</h3>
      <p>${p.text}</p>
      ${p.img ? `<img class="ig-hpanel-img" src="${img(p.img)}" alt="" loading="lazy">` : ''}
    </article>`,
  ).join('');
  const steps = STEPS.map(
    (s, i) => `<div class="ig-step" data-reveal="${i}">
      <figure class="ig-real"><img src="${img(s.real)}" alt="${s.name} 실제 유물" loading="lazy"></figure>
      <svg class="ig-thread" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60 C 110 0, 150 120, 200 60 S 300 0, 400 60" pathLength="1"/></svg>
      <figure class="ig-work"><img src="${img(s.work)}" alt="${s.name}을 본뜬 예시 작품" loading="lazy"></figure>
      <p class="ig-step-name">${s.name}</p>
    </div>`,
  ).join('');
  const archiveRow = (list: string[]) =>
    [0, 1].map(() => `<span>${list.map((a) => `<img src="${img(a)}" alt="" loading="lazy">`).join('')}</span>`).join('');
  const half = Math.ceil(ARCHIVE.length / 2);
  const numbers = NUMBERS.map(
    (n, i) => `<div class="ig-number" data-reveal="${i}"><strong><b data-to="${n.to}">0</b><small>${n.unit}</small></strong><span>${n.label}</span></div>`,
  ).join('');
  return `
  <div class="ig-stage" aria-hidden="true"><div class="ig-backdrop"></div><div class="ig-scene"></div><div class="ig-veil" data-side="left"></div></div>
  <header class="ig-masthead">
    <a class="ig-brand" href="${app}" aria-label="잇결 앱으로"><span class="ig-seal">결</span><span>잇결</span></a>
    <nav class="ig-top"><a href="${app}">앱 열기</a><a class="ig-top-strong" href="${app}">바로 해 보기 <span aria-hidden="true">↗</span></a></nav>
  </header>
  <main class="ig-flow">
    <section class="ig-sec ig-sec-hero">
      <div class="ig-col">
        <p class="ig-kicker" data-reveal="0">잇다 + 결 · 전통의 결을 따라, 놀이로 사람과 사람을 잇다</p>
        <h1 data-reveal="1">놀이가 흔적이 되고,<br>흔적이 작품이 됩니다</h1>
        <p data-reveal="2">장단에 맞춰 놀고, 노는 방식대로 나만의 전통 작품이 빚어지는 앱. 설치 없이 폰과 컴퓨터 브라우저에서 바로 열립니다.</p>
        <div class="ig-actions" data-reveal="3"><a class="ig-action" href="${app}"><span>3분 둘러보기</span><i aria-hidden="true">↗</i></a><a class="ig-link" href="#ig-play">어떤 놀이가 있나요</a></div>
      </div>
      <span class="ig-scrollcue" aria-hidden="true"><i></i></span>
    </section>

    <section class="ig-sec ig-sec-play" id="ig-play">
      <div class="ig-hpin">
        <p class="ig-kicker ig-hkicker">놀이 · 판 여섯</p>
        <div class="ig-htrack">${play}<div class="ig-hpanel ig-hpanel-end" aria-hidden="true"></div></div>
      </div>
    </section>

    <section class="ig-sec ig-sec-process">
      <div class="ig-col ig-col-center">
        <p class="ig-kicker" data-reveal="0">과정 · 사물놀이 · 농악에서 찾은 행동 → 관계 → 흔적</p>
        <h2 data-reveal="1">실제 유물에서 짜임을 빌려 오고,<br><em>놀이 기록이 모양과 무늬가 됩니다.</em></h2>
        <p data-reveal="2">어떤 판에서 무엇을 몇 번 했는지가 그대로 색과 무늬와 모양이 됩니다. 정답도 순위도 없습니다.</p>
        <div class="ig-steps">${steps}</div>
        <p class="ig-note" data-reveal="3">왼쪽은 앱 자료실의 실제 유물(공공누리 · CC0), 오른쪽은 앱의 3D 코드가 놀이 기록으로 빚은 예시 작품입니다.</p>
      </div>
    </section>

    <section class="ig-sec ig-sec-works">
      <div class="ig-col ig-col-center">
        <p class="ig-kicker" data-reveal="0">결과물</p>
        <h2 class="ig-huge" data-reveal="1">같은 놀이도,<br><em>사람마다 다른 작품</em></h2>
        <p data-reveal="2">노리개 · 비녀 · 달항아리 · 범종 · 부채… 놀이가 모양을 빚는 결과물 49가지를 청자 · 나전 · 옻칠 · 유기 같은 실제 전통 재료 35가지로 빚습니다. 뒤에 도는 35점은 결과물 종류마다 하나씩, 가상의 놀이 기록으로 빚은 예시 작품입니다.</p>
      </div>
    </section>

    <section class="ig-sec ig-sec-archive">
      <p class="ig-kicker ig-center" data-reveal="0">자료실 · 실제 유물 121점</p>
      <div class="ig-orbs">${archiveRow(ARCHIVE.slice(0, half))}</div>
      <div class="ig-orbs is-reverse">${archiveRow(ARCHIVE.slice(half))}</div>
    </section>

    <section class="ig-sec ig-sec-rule">
      <div class="ig-col ig-col-right">
        <p class="ig-kicker" data-reveal="0">원칙</p>
        <h2 data-reveal="1">추천도 순위도<br><em>정답도 없습니다.</em></h2>
        <p data-reveal="2">결과는 오직 놀이 행동으로만 정해집니다. 로그인 없이, 기록은 내 기기에만 남습니다.</p>
      </div>
    </section>

    <section class="ig-sec ig-sec-numbers"><div class="ig-numbers">${numbers}</div></section>

    <section class="ig-sec ig-sec-final">
      <div class="ig-col ig-col-center">
        <h2 class="ig-huge" data-reveal="0">손끝의 장단이,<br><em>나만의 전통 작품이 됩니다.</em></h2>
        <p data-reveal="1">잇결 — 전통의 결을 따라, 놀이로 사람과 사람을 잇다. 우리가 숨 쉬는 숨결처럼, 저마다 다른 나뭇결처럼 사람마다 다른 결이 남습니다.</p>
        <div class="ig-actions" data-reveal="2"><a class="ig-action" href="${app}"><span>바로 해 보기</span><i aria-hidden="true">↗</i></a><a class="ig-link" href="https://github.com/nlsjjy84-ui/itgyeol-app">GitHub</a></div>
      </div>
    </section>
  </main>
  <div class="ig-hud" aria-hidden="true"><p class="ig-rhythm">장단 <span>진양조</span></p><div class="ig-progress">${SECTIONS.map(() => '<i></i>').join('')}</div></div>
  <button type="button" class="ig-motion" aria-pressed="false" aria-label="움직임 일시정지"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5v10M13 5v10"/></svg></button>`;
}

export function mount(root: HTMLElement) {
  root.classList.add('ig-landing');
  root.innerHTML = html();
  const reduced = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const $ = <T extends Element>(sel: string) => root.querySelector(sel) as T;
  const $$ = <T extends Element>(sel: string) => Array.from(root.querySelectorAll(sel)) as T[];

  // 3D
  let scene: ItgyeolScene | null = null;
  const probe = document.createElement('canvas');
  if (probe.getContext && (probe.getContext('webgl2') || probe.getContext('webgl'))) {
    scene = new ItgyeolScene($('.ig-scene') as HTMLElement, GALLERY.map(img));
    scene.paused = reduced;
    scene.start();
    requestAnimationFrame(() => $('.ig-scene').classList.add('is-ready'));
  }
  const motionBtn = $('.ig-motion') as HTMLButtonElement;
  let paused = reduced;
  const setPaused = (v: boolean) => {
    paused = v;
    if (scene) scene.paused = v;
    motionBtn.setAttribute('aria-pressed', String(v));
    motionBtn.setAttribute('aria-label', v ? '움직임 재생' : '움직임 일시정지');
    motionBtn.querySelector('path')!.setAttribute('d', v ? 'M7 4l8 6-8 6z' : 'M7 5v10M13 5v10');
    root.classList.toggle('is-paused', v);
  };
  setPaused(paused);
  motionBtn.addEventListener('click', () => setPaused(!paused));

  gsap.registerPlugin(ScrollTrigger);
  const lenis = reduced ? null : new Lenis({ lerp: 0.085, smoothWheel: true });
  if (lenis) lenis.on('scroll', ScrollTrigger.update);

  const secs = $$<HTMLElement>('.ig-sec');
  const veil = $<HTMLElement>('.ig-veil');
  const dots = $$<HTMLElement>('.ig-progress i');
  const rhythm = $<HTMLElement>('.ig-rhythm span');
  const track = $<HTMLElement>('.ig-htrack');
  const counters = $$<HTMLElement>('.ig-number b');
  const threads = $$<SVGPathElement>('.ig-thread path');
  let target = 0, current = 0, shown = -1, lastName = '', lastTime = -1;

  const read = () => {
    const vh = window.innerHeight, mid = vh * 0.5;
    let idx = 0, local = 0;
    secs.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (r.top <= mid) {
        idx = i;
        local = SECTIONS[i].id === 'play' ? clamp(-r.top / Math.max(1, r.height - vh)) : clamp((mid - r.top) / Math.max(1, r.height));
      }
    });
    const sec = SECTIONS[idx];
    target = sec.scene[0] + (sec.scene[1] - sec.scene[0]) * local;
    if (scene) scene.shift = sec.shift;
    if (idx !== shown) {
      shown = idx;
      veil.dataset.side = sec.veil;
      dots.forEach((d, i) => d.classList.toggle('on', i <= idx));
    }
    // 놀이: 세로 스크롤만큼 판이 가로로 넘어간다
    const play = secs[1].getBoundingClientRect();
    const k = clamp(-play.top / Math.max(1, play.height - vh));
    track.style.transform = `translate3d(${-k * (track.scrollWidth - window.innerWidth)}px,0,0)`;
    // 과정: 유물과 작품을 잇는 실이 스크롤만큼 그어진다
    threads.forEach((path) => {
      const r = path.getBoundingClientRect();
      const d = clamp((vh * 0.85 - r.top) / (vh * 0.4));
      path.style.strokeDashoffset = String(1 - d);
    });
    // 숫자
    const nr = secs[6].getBoundingClientRect();
    const nk = smooth((vh * 0.85 - nr.top) / (vh * 0.6));
    counters.forEach((el, i) => {
      const val = Math.round(Number(el.dataset.to) * smooth(nk * 1.4 - i * 0.1));
      const text = val.toLocaleString('ko-KR');
      if (el.textContent !== text) el.textContent = text;
    });
  };

  const tick = (time: number) => {
    lenis?.raf(time * 1000);
    read();
    const dt = lastTime < 0 ? 0 : Math.min(0.1, time - lastTime);
    lastTime = time;
    current += (target - current) * (reduced ? 1 : 1 - Math.exp(-dt * 5));
    if (scene) scene.progress = current;
    const name = jangdanName(current);
    if (name !== lastName) {
      lastName = name;
      rhythm.textContent = name;
    }
  };
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  // 글 등장: 흐릿하게 아래에서 맺힌다(첫 화면은 바로)
  const first = secs[0];
  $$<HTMLElement>('[data-reveal]').forEach((el) => {
    const delay = Number(el.dataset.reveal || 0) * 0.12;
    const from = { autoAlpha: 0, y: 50, filter: reduced ? 'none' : 'blur(12px)' };
    const to = { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out', delay };
    if (first.contains(el)) gsap.fromTo(el, from, { ...to, delay: 0.25 + delay });
    else gsap.fromTo(el, from, { ...to, scrollTrigger: { trigger: el, start: 'top 88%', end: 'bottom 8%', toggleActions: 'play reverse play reverse' } });
  });

  // 같은 쪽 안의 이동(#ig-play)은 Lenis로 부드럽게
  $$<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const to = root.querySelector(a.getAttribute('href')!);
      if (!to) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(to as HTMLElement);
      else (to as HTMLElement).scrollIntoView();
    }),
  );
}

mount(document.getElementById('itgyeol-landing')!);
