// 운영사 설정 — 잇결을 들여가는 곳(박물관·공방·키오스크 운영사)이 코드를 고치지 않고 이 파일만 바꾼다.
// 값을 잘못 넣어도 앱은 깨지지 않는다: 없는 재료·갈래 이름은 무시하고, 남는 것이 없으면 전부 보여 준다(자동 테스트가 미리 알려 준다).
// 예) 나전칠기 공방:  materials: ['otchil', 'najeon', 'hwagak', 'gilt'], suggest: { base: 'otchil', accent: 'najeon' }, exampleGroups: ['keyring', 'desk', 'treasure']
// 재료 아이디는 src/data/materialTree.js, 예시 작품 묶음은 keyring·badge·stamp·sumak·desk·bookmark·treasure·daily.
export const OPERATOR = {
  name: '잇결 기본',
  // 손님이 고를 수 있는 재료: 'all' 또는 재료 아이디 목록
  materials: 'all',
  // 처음 권할 재료(null이면 '떠오르는 것'에서 고른 답으로 권한다)
  suggest: null,
  // 재료를 고르지 않고 풀컬러 출력(수지)으로 만드는 것도 받는지
  allowResin: true,
  // 예시 작품을 보여 줄 묶음: 'all' 또는 묶음 아이디 목록
  exampleGroups: 'all',
};
