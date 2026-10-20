// 전래놀이(줄다리기·투호·고무줄) 판정 — 화면과 떨어진 순수 함수라 테스트로 바로 확인한다.

/** 신호(구령)가 firstMs부터 periodMs마다 온다. tMs에 가장 가까운 신호 번호와 어긋난 정도(ms) */
export function nearestCue(tMs, firstMs, periodMs) {
  if (!(periodMs > 0)) return { k: -1, off: Infinity };
  const k = Math.round((tMs - firstMs) / periodMs);
  if (k < 0) return { k: -1, off: Infinity };
  return { k, off: tMs - (firstMs + k * periodMs) };
}

/** 어긋난 정도를 판정: good(딱) · ok(조금 늦거나 이름) · miss */
export function gradeOff(off, goodMs, okMs) {
  const a = Math.abs(off);
  if (a <= goodMs) return 'good';
  if (a <= okMs) return 'ok';
  return 'miss';
}

/** 투호 화살이 날아가는 거리(0~1, 1 = 가장 멀리). 각도(도)·힘(0~100) — 45°에서 가장 멀리 간다 */
export function tuhoRange(ang, pow) {
  const p = Math.max(0, Math.min(100, pow)) / 100;
  return Math.max(0, p * p * Math.sin((2 * ang * Math.PI) / 180));
}

/**
 * 투호 판정 — 병 아가리(입)에 들어가면 mouth, 조금 비껴 목 옆 구멍(귀)에 걸리면 ear(둘 다 들어간 것으로 센다).
 * 그 밖은 short(짧음) · long(김)
 */
export function tuhoLanding(r, jar, tol) {
  const d = r - jar;
  if (Math.abs(d) <= tol * 0.5) return 'mouth';
  if (Math.abs(d) <= tol) return 'ear';
  return d < 0 ? 'short' : 'long';
}
