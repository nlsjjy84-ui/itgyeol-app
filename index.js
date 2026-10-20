import { registerRootComponent } from 'expo';

import App from './App';

// 웹에서 앱 주소(/itgyeol-app/)를 처음 열면 소개 화면(/itgyeol-app/intro/)을 먼저 보여 준다.
// 소개 화면에서 "3분 둘러보기"를 눌러 들어오거나(?start · 소개 화면에서 온 경우),
// 이미 이 창에서 한 번 봤거나, 주소에 다른 값(?w= 이어 하기 · 결제 돌아오기 등)이 있으면 바로 앱을 연다.
// 자동 테스트(브라우저 테스트)와 폰 앱(APK)에는 영향을 주지 않는다.
function introFirst() {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !window.location) return false;
    if (typeof navigator !== 'undefined' && navigator.webdriver) return false;
    const { pathname, search, hash } = window.location;
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

if (!introFirst()) {
  // registerRootComponent calls AppRegistry.registerComponent('main', () => App);
  // It also ensures that whether you load the app in Expo Go or in a native build,
  // the environment is set up appropriately
  registerRootComponent(App);
}
