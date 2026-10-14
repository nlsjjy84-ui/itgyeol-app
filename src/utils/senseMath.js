// 몸짓·표정·감탄사 기록의 순수 계산 — 화면·기기와 떨어져 있어 테스트로 바로 확인한다.
export function fresh() {
  return { big: 0, levelSum: 0, levelN: 0, smile: 0, surprise: 0, burst: 0 };
}

// 쌓인 기록 합치기(순수 함수 — 테스트한다)
export function mergeSenses(a, b) {
  if (!b) return a || null;
  const x = a || fresh();
  return {
    big: x.big + b.big,
    levelSum: x.levelSum + b.levelSum,
    levelN: x.levelN + b.levelN,
    smile: x.smile + b.smile,
    surprise: x.surprise + b.surprise,
    burst: x.burst + b.burst,
  };
}

// 작품에 들어갈 값: 흥의 세기(0~1), 웃음, 감탄(놀란 표정 + 터진 소리)
export function senseSummary(s) {
  if (!s) return null;
  const level = s.levelN ? Math.min(1, s.levelSum / s.levelN) : 0;
  return { level, big: s.big || 0, smile: s.smile || 0, wow: (s.surprise || 0) + (s.burst || 0), camera: s.levelN > 0 };
}
