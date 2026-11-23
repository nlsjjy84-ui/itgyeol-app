// 가져가는 방법의 가격과 주문표 계산 — 화면과 떨어진 순수 함수라 테스트로 바로 확인한다.
// 가격은 사업성 검토의 가정값(현장 검증 때 확인할 값). 국립박물관 굿즈(뮷즈)에서 실제로 팔리는 값대를 기준으로 잡았다:
// 까치호랑이 배지 14,900원 · 수막새 수저받침 3종 18,000원 · 접이부채 11,000원 · 반가사유상 미니어처 65,000원(2025 기사·판매처).
// 해외 박물관 상점도 참고했다: 대영박물관 로제타석 문진 £11.99(레진, 8×7cm).
// 사진 2장 4,000 · 나만의 배지 15,000 · 키링 15,000 · 낙관 도장 20,000 · 수막새 자석 18,000 · 문진 25,000 · 코스터 15,000
// · 책갈피 12,000 · 3D 모형 45,000 · 접부채 12,000 · 수건 15,000 · 백자 잔 25,000 · 수저받침 9,000
// · 손수건 12,000 · 스카프 28,000 · 파우치 15,000 · 엽서 2장 3,000 · 작은 액자 18,000
export const PRICES = {
  photo: 4000, badge: 15000, keyring: 15000, stamp: 20000, sumak: 18000, paperweight: 25000, coaster: 15000,
  bookmark: 12000, model: 45000, fan: 12000, towel: 15000, cup: 25000, spoonrest: 9000,
  hanky: 12000, scarf: 28000, pouch: 15000, postcard: 3000, frame: 18000,
};
export const ORDER_KEYS = ['photo', 'badge', 'keyring', 'stamp', 'sumak', 'paperweight', 'coaster', 'bookmark', 'model', 'fan', 'towel', 'hanky', 'scarf', 'pouch', 'postcard', 'frame', 'cup', 'spoonrest'];

// 유물로 고른 「오늘의 물건」 → 굿즈숍에서 실제로 만들 수 있는 가장 가까운 물건.
// 맞는 것이 없으면 그 유물의 3D 모형(박물관 3D 스캔 출력)으로 받는다.
const CRAFT_GOODS = [
  [/코스터|받침/, 'coaster'], [/책갈피/, 'bookmark'], [/부채/, 'fan'], [/손수건/, 'hanky'], [/수건/, 'towel'],
  [/스카프|보자기/, 'scarf'], [/파우치|케이스|주머니/, 'pouch'], [/엽서|포스터/, 'postcard'], [/액자/, 'frame'],
  [/찻잔|잔|찻사발|밥공기/, 'cup'], [/수저/, 'spoonrest'], [/브로치|배지|패치/, 'badge'], [/키링|가방 장식|열쇠/, 'keyring'],
  [/도장/, 'stamp'], [/문진|북엔드|선반 오브제/, 'paperweight'], [/기와|수막새/, 'sumak'],
];
export function craftProduct(to) {
  const s = String(to || '');
  const hit = CRAFT_GOODS.find(([re]) => re.test(s));
  return hit ? hit[1] : 'model';
}

// 위에서 고른 물건 → 주문 항목
export function productKey(groupId, itemId) {
  if (groupId === 'treasure') return 'model';
  if (groupId === 'daily') return ['towel', 'hanky', 'scarf', 'pouch', 'postcard', 'frame', 'cup', 'spoonrest'].includes(itemId) ? itemId : 'fan';
  if (groupId === 'desk') return itemId === 'mycoaster' ? 'coaster' : 'paperweight';
  return ['badge', 'keyring', 'stamp', 'sumak', 'bookmark'].includes(groupId) ? groupId : null;
}

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
