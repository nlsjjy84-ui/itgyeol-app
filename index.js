import { registerRootComponent } from 'expo';

import App from './App';
import { markTour } from './src/tourFlag';

// 웹에서 앱 주소(/itgyeol-app/)를 처음 열면 소개 화면(/itgyeol-app/intro/)을 먼저 보여 준다.
// 소개 화면에서 "3분 둘러보기"를 눌러 들어오거나(?start&tour · 소개 화면에서 온 경우 — 동의 뒤 둘러보기로 바로 감),
// 이미 이 창에서 한 번 봤거나, 주소에 다른 값(?w= 이어 하기 · 결제 돌아오기 등)이 있으면 바로 앱을 연다.
// 자동 테스트(브라우저 테스트)와 폰 앱(APK)에는 영향을 주지 않는다.
function introFirst() {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !window.location) return false;
    const { pathname, search, hash } = window.location;
    // 소개 화면의 「3분 둘러보기」(?start&tour) — 동의 뒤에 둘러보기로 바로 가도록 표시해 둔다
    if (/[?&]tour\b/.test(search || '')) markTour();
    if (typeof navigator !== 'undefined' && navigator.webdriver) return false;
    const m = /^(.*\/itgyeol-app)\/?$/.exec(pathname);
    if (!m) return false;
    const KEY = 'itgyeol_intro_seen';
    const fromIntro = /\/itgyeol-app\/intro\/?/.test(document.referrer || '');
    if (/[?&]start\b/.test(search || '') || fromIntro) {
      try { window.sessionStorage.setItem(KEY, '1'); } catch (e) {}
      if (/[?&]start\b/.test(search || '')) window.history.replaceState(null, '', pathname + hash);
      return false;
    }
    if (search || hash) return false;
    let seen = null;
    try { seen = window.sessionStorage.getItem(KEY); } catch (e) {}
    if (seen === '1') return false;
    try { window.sessionStorage.setItem(KEY, '1'); } catch (e) {}
    window.location.replace(m[1] + '/intro/');
    return true;
  } catch (e) {
    return false;
  }
}

// 웹 데모 어느 화면에서든 장주영 포트폴리오(노션)로 돌아가는 작은 버튼(「← 포트폴리오로」)을 붙인다.
// 버튼은 소개 화면과 같은 파일(intro/pf-back.js)을 쓴다. 자동 테스트와 폰 앱(APK)에는 붙이지 않는다.
function portfolioBack() {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !window.location) return;
    if (typeof navigator !== 'undefined' && navigator.webdriver) return;
    const m = /^(.*\/itgyeol-app)(\/|$)/.exec(window.location.pathname || '');
    if (!m || document.getElementById('pf-back-script')) return;
    const s = document.createElement('script');
    s.id = 'pf-back-script';
    s.src = m[1] + '/intro/pf-back.js';
    s.defer = true;
    document.head.appendChild(s);
  } catch (e) {}
}

if (!introFirst()) {
  portfolioBack();
  // registerRootComponent calls AppRegistry.registerComponent('main', () => App);
  // It also ensures that whether you load the app in Expo Go or in a native build,
  // the environment is set up appropriately
  registerRootComponent(App);
}
