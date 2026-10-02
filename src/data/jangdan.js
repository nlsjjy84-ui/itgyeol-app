// 사물놀이 장단 체계를 타이밍형 놀이의 난이도 단계 이름으로 그대로 가져온다.
//
// 추상적인 "레벨 1, 레벨 2" 대신 실제 장단 이름을 쓰는 이유: 사물놀이에서도 한 판이
// 진행될수록 장단이 굿거리(느리게) → 중중모리(보통) → 자진모리(빠르게) → 휘모리
// (아주 빠르게) 순서로 점점 빨라지며 긴장감을 쌓아간다. 이 앱의 타이밍형 놀이들이
// "성공할수록 박자가 점점 빨라지는" 구조로 설계된 것도 정확히 같은 원리다 — 그래서
// 숫자 난이도가 아니라 실제 장단 이름과 "장단 빠르기"를 화면에 그대로 보여준다.
// (국악 전공자가 직접 짠 타이밍 구조라는 게 이름에서부터 드러나야 한다는 피드백 반영.)
export const JANGDAN_STAGES = [
  { name: '굿거리장단', feel: '느리게', minPeriodMs: 650 },
  { name: '중중모리장단', feel: '보통 빠르기', minPeriodMs: 520 },
  { name: '자진모리장단', feel: '빠르게', minPeriodMs: 420 },
  { name: '휘모리장단', feel: '아주 빠르게', minPeriodMs: 0 },
];

// 현재 사이클 주기(ms)에 맞는 장단 단계를 찾는다. 주기가 짧을수록(=빠를수록) 더
// 뒤쪽(빠른) 장단으로 넘어간다.
export function jangdanForPeriod(periodMs) {
  for (const stage of JANGDAN_STAGES) {
    if (periodMs >= stage.minPeriodMs) return stage;
  }
  return JANGDAN_STAGES[JANGDAN_STAGES.length - 1];
}
