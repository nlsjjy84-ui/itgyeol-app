// 탈춤 판 판정 — 화면과 떨어진 순수 함수라 테스트로 바로 확인한다.
// 박 시각(t0 + i*beatMs)에 얼마나 가깝게 눌렀는지로 판정한다.
//   얼씨구(good): 박과 18% 안쪽 · 좋다(ok): 35% 안쪽 · 그 밖은 놓침
// 한 박에는 춤사위 하나만 센다(같은 박에 여러 번 누르면 처음 것만).

export const GOOD_RATIO = 0.18;
export const OK_RATIO = 0.35;

/** 누른 시각(ms, 춤이 시작된 뒤 기준)을 가장 가까운 박에 붙여 판정한다 */
export function judgeTap(tMs, beatMs, totalBeats) {
  if (!(beatMs > 0) || tMs < -beatMs * OK_RATIO) return { beat: -1, grade: 'miss', off: null };
  const beat = Math.round(tMs / beatMs);
  if (beat < 0 || beat >= totalBeats) return { beat: -1, grade: 'miss', off: null };
  const off = tMs - beat * beatMs;
  const r = Math.abs(off) / beatMs;
  const grade = r <= GOOD_RATIO ? 'good' : r <= OK_RATIO ? 'ok' : 'miss';
  return { beat: grade === 'miss' ? -1 : beat, grade, off: Math.round(off) };
}

/** 춤 기록을 만든다: taps = [{ t, move }] → 박마다 하나씩, 춤사위별 횟수 */
export function scoreDance(taps, beatMs, totalBeats) {
  const used = new Set();
  const moves = { left: 0, right: 0, kkaekki: 0, turn: 0 };
  let good = 0;
  let ok = 0;
  (taps || []).forEach(({ t, move }) => {
    const j = judgeTap(t, beatMs, totalBeats);
    if (j.grade === 'miss' || used.has(j.beat)) return;
    used.add(j.beat);
    if (j.grade === 'good') good += 1;
    else ok += 1;
    if (moves[move] !== undefined) moves[move] += 1;
  });
  const variety = Object.values(moves).filter((n) => n > 0).length;
  return { good, ok, hits: good + ok, miss: totalBeats - (good + ok), moves, variety };
}

/** 성공 여부: 박에 맞춘 춤사위가 기준 이상 */
export const passed = (score, pass) => score.hits >= pass;

// ── 춤 보(악보): 내려오는 춤사위 카드 ─────────────────────────────
// 마디마다 네 박을 글자로 적는다 — L 왼 한삼, R 오른 한삼, K 깨끼, T 뛰어 돌기, . 쉼
const LETTER = { L: 'left', R: 'right', K: 'kkaekki', T: 'turn' };
/** ['L.R.', 'LR.R'] → [{ beat, move }] */
export function buildChart(bars) {
  const out = [];
  (bars || []).forEach((bar, b) => [...bar].forEach((ch, i) => { if (LETTER[ch]) out.push({ beat: b * 4 + i, move: LETTER[ch] }); }));
  return out;
}

/**
 * 춤 보 판정: 카드가 선에 닿는 박에, 그 카드의 줄(춤사위)을 눌러야 맞힌 것.
 * 한 카드는 한 번만 센다. 다른 줄을 누르거나 카드가 없는 박에 누르면 세지 않는다(감점 없음).
 */
export function scoreChart(taps, beatMs, chart) {
  const total = chart.length ? chart[chart.length - 1].beat + 1 : 0;
  const byBeat = new Map(chart.map((n) => [n.beat, n]));
  const used = new Set();
  const moves = { left: 0, right: 0, kkaekki: 0, turn: 0 };
  let good = 0;
  let ok = 0;
  (taps || []).forEach(({ t, move }) => {
    const j = judgeTap(t, beatMs, total);
    if (j.grade === 'miss') return;
    const note = byBeat.get(j.beat);
    if (!note || note.move !== move || used.has(j.beat)) return;
    used.add(j.beat);
    if (j.grade === 'good') good += 1;
    else ok += 1;
    moves[move] += 1;
  });
  const variety = Object.values(moves).filter((n) => n > 0).length;
  return { good, ok, hits: good + ok, miss: chart.length - (good + ok), notes: chart.length, moves, variety, hitBeats: [...used] };
}
