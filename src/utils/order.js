// 가져가는 방법의 가격과 주문표 계산 — 화면과 떨어진 순수 함수라 테스트로 바로 확인한다.
// 가격은 사업성 검토의 가정값(현장 검증 때 확인할 값): 사진 2장 4,000원 · 키링 15,000원 · 3D 모형 45,000원.
export const PRICES = { photo: 4000, keyring: 15000, model: 45000 };
export const ORDER_KEYS = ['photo', 'keyring', 'model'];

export function orderTotal(pick) {
  return ORDER_KEYS.reduce((s, k) => s + (pick && pick[k] ? PRICES[k] : 0), 0);
}

export function orderItems(pick) {
  return ORDER_KEYS.filter((k) => pick && pick[k]);
}

// 결과 코드에서 주문 번호를 만든다 — 같은 작품은 같은 번호
export function orderNumber(code) {
  const tail = String(code || '').replace(/[^A-Z0-9]/gi, '').slice(-6).toUpperCase();
  return `ITG-${tail || '000000'}`;
}

// 1,000 단위 쉼표
export function comma(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
