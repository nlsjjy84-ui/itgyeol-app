// 소개 화면(/intro/)의 「3분 둘러보기」로 들어온 사람은 동의 화면 다음에 질문·그림책을 건너뛰고
// 홈의 3분 둘러보기 카드로 바로 간다. index.js가 주소의 ?tour를 보고 이 창(sessionStorage)에 표시해 두고,
// 앱이 처음 화면을 정할 때 한 번만 꺼내 쓴다(새로 고침해도 다시 둘러보기로 끌려가지 않게).
export const TOUR_KEY = 'itgyeol_tour';

export function markTour() {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) window.sessionStorage.setItem(TOUR_KEY, '1');
  } catch (e) {}
}

export function takeTourFlag() {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return false;
    const on = window.sessionStorage.getItem(TOUR_KEY) === '1';
    if (on) window.sessionStorage.removeItem(TOUR_KEY);
    return on;
  } catch (e) {
    return false;
  }
}
