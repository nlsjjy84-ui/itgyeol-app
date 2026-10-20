// 탈춤·단청 판 계산 테스트 — 화면 없이 node만으로 돈다(npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judgeTap, scoreDance, passed, buildChart, scoreChart } from '../src/utils/talchumLogic.js';
import { initState, apply, stepDone, cellAt, lineAt, GACHIL, TABUN, gachilCover, tabunCover } from '../src/utils/dancheongLogic.js';

test('탈춤 — 박에 가까우면 얼씨구, 조금 벗어나면 좋다, 많이 벗어나면 놓침', () => {
  assert.equal(judgeTap(1000 + 50, 500, 8).grade, 'good'); // 2번째 박 +50ms (10%)
  assert.equal(judgeTap(1000 + 150, 500, 8).grade, 'ok'); // 30%
  assert.equal(judgeTap(1000 + 240, 500, 8).grade, 'miss'); // 48%
  assert.equal(judgeTap(-400, 500, 8).grade, 'miss'); // 장단 듣는 시간
  assert.equal(judgeTap(500 * 8 + 10, 500, 8).grade, 'miss'); // 춤이 끝난 뒤
});

test('탈춤 — 한 박에는 춤사위 하나만 센다', () => {
  const taps = [
    { t: 0, move: 'left' },
    { t: 20, move: 'right' }, // 같은 박
    { t: 500, move: 'kkaekki' },
    { t: 1010, move: 'turn' },
  ];
  const s = scoreDance(taps, 500, 4);
  assert.equal(s.hits, 3);
  assert.deepEqual(s.moves, { left: 1, right: 0, kkaekki: 1, turn: 1 });
  assert.equal(s.variety, 3);
  assert.equal(s.miss, 1);
  assert.equal(passed(s, 3), true);
  assert.equal(passed(s, 4), false);
});

// 작은 시험용 판: 칸 둘, 분선 하나
const STAGE = {
  steps: ['gachil', 'tabun', 'chae', 'bun'],
  cells: [
    { id: 'a', color: 'cheong', poly: [[0, 0], [10, 0], [10, 10], [0, 10]] },
    { id: 'c', color: 'hwang', circle: [30, 30, 5] },
  ],
  lines: [{ id: 'L', kind: 'bun', seg: [[0, 50], [100, 50]] }],
};

test('단청 — 가칠·타분은 정해진 횟수만큼 눌러야 다음 단계로 넘어간다', () => {
  let st = initState();
  for (let i = 0; i < GACHIL; i += 1) st = apply(STAGE, st, { type: 'tap' }).state;
  assert.equal(STAGE.steps[st.step], 'tabun');
  for (let i = 0; i < TABUN - 1; i += 1) st = apply(STAGE, st, { type: 'tap' }).state;
  assert.equal(STAGE.steps[st.step], 'tabun');
  st = apply(STAGE, st, { type: 'tap' }).state;
  assert.equal(STAGE.steps[st.step], 'chae');
});

test('단청 — 순서를 건너뛰거나 다른 색을 칠하면 막고 실수로 센다', () => {
  let st = initState();
  let r = apply(STAGE, st, { type: 'fill', cell: 'a', color: 'cheong' });
  assert.equal(r.ok, false);
  assert.equal(r.why, 'wrong-step');
  for (let i = 0; i < GACHIL + TABUN; i += 1) st = apply(STAGE, st, { type: 'tap' }).state;
  r = apply(STAGE, st, { type: 'fill', cell: 'a', color: 'jeok' });
  assert.equal(r.why, 'wrong-color');
  assert.equal(r.state.mistakes, 1);
  assert.equal(r.state.filled.a, undefined);
  st = apply(STAGE, r.state, { type: 'fill', cell: 'a', color: 'cheong' }).state;
  st = apply(STAGE, st, { type: 'fill', cell: 'c', color: 'hwang' }).state;
  assert.equal(STAGE.steps[st.step], 'bun');
  assert.equal(stepDone(STAGE, st), false);
  st = apply(STAGE, st, { type: 'line', line: 'L' }).state;
  assert.equal(st.done, true);
  assert.equal(st.mistakes, 1);
});

test('단청 — 누른 자리로 칸과 선을 찾는다(가운데 원이 먼저)', () => {
  assert.equal(cellAt(STAGE, [5, 5]), 'a');
  assert.equal(cellAt(STAGE, [30, 31]), 'c');
  assert.equal(cellAt(STAGE, [60, 60]), null);
  assert.equal(lineAt(STAGE, [40, 53], 'bun'), 'L');
  assert.equal(lineAt(STAGE, [40, 70], 'bun'), null);
});

test('단청 — 가칠은 붓으로 판 전체를 문질러야, 타분은 도본 위를 고루 두드려야 넘어간다', () => {
  let st = initState();
  // 한 줄만 문지르면 아직 가칠
  st = apply(STAGE, st, { type: 'brush', pts: [[0, 50], [240, 50]] }).state;
  assert.equal(STAGE.steps[st.step], 'gachil');
  assert.ok(gachilCover(st) > 0 && gachilCover(st) < 0.9);
  // 지그재그로 판 전체를 칠하면 타분으로
  const zig = [];
  for (let y = 5; y <= 95; y += 20) zig.push([0, y], [240, y]);
  st = apply(STAGE, st, { type: 'brush', pts: zig }).state;
  assert.equal(STAGE.steps[st.step], 'tabun');
  // 한 자리만 두드리면 아직, 판 곳곳을 두드리면 채색으로
  st = apply(STAGE, st, { type: 'pounce', pt: [20, 50] }).state;
  assert.equal(STAGE.steps[st.step], 'tabun');
  for (const x of [60, 100, 140, 180, 220]) for (const y of [25, 75]) st = apply(STAGE, st, { type: 'pounce', pt: [x, y] }).state;
  assert.ok(tabunCover(st) >= 0.9);
  assert.equal(STAGE.steps[st.step], 'chae');
});

test('단청 — 선은 점선을 따라 끝까지 그어야 그어진다(조금만 그으면 안 됨)', () => {
  let st = { ...initState(), step: 3 };
  let r = apply(STAGE, st, { type: 'stroke', pts: [[0, 51], [30, 50]] });
  assert.equal(r.ok, false);
  r = apply(STAGE, st, { type: 'stroke', pts: [[0, 52], [50, 49], [100, 51]] });
  assert.equal(r.ok, true);
  assert.equal(r.state.done, true);
  // 엉뚱한 곳을 그으면 아무 일도 없다
  st = { ...initState(), step: 3 };
  r = apply(STAGE, st, { type: 'stroke', pts: [[0, 90], [100, 90]] });
  assert.equal(r.ok, false);
  assert.equal(r.state.mistakes, 0);
});

test('탈춤 — 춤 보: 카드가 닿는 박에 그 줄을 눌러야 맞힌다', () => {
  const chart = buildChart(['L.R.', 'K..T']);
  assert.deepEqual(chart.map((n) => [n.beat, n.move]), [[0, 'left'], [2, 'right'], [4, 'kkaekki'], [7, 'turn']]);
  const sc = scoreChart([
    { t: 10, move: 'left' }, // 맞음
    { t: 500, move: 'right' }, // 카드 없는 박
    { t: 1000, move: 'left' }, // 다른 줄
    { t: 1020, move: 'right' }, // 맞음(같은 박 두 번째 — 앞의 틀린 줄은 세지 않았으므로 인정)
    { t: 2000, move: 'kkaekki' },
    { t: 3600, move: 'turn' }, // 30% — 좋다
  ], 500, chart);
  assert.equal(sc.hits, 4);
  assert.equal(sc.good, 3);
  assert.equal(sc.miss, 0);
  assert.equal(sc.variety, 4);
});

test('전래놀이 판정: 구령 박 맞히기 · 투호 입/귀', async () => {
  const { nearestCue, gradeOff, tuhoRange, tuhoLanding } = await import('../src/utils/folkTiming.js');
  // 첫 신호 2100ms, 1400ms마다
  assert.deepEqual(nearestCue(2150, 2100, 1400), { k: 0, off: 50 });
  assert.equal(nearestCue(3400, 2100, 1400).k, 1);
  assert.equal(nearestCue(100, 2100, 1400).k, -1);
  assert.equal(gradeOff(50, 168, 294), 'good');
  assert.equal(gradeOff(-250, 168, 294), 'ok');
  assert.equal(gradeOff(400, 168, 294), 'miss');
  // 45°·힘 100이 가장 멀리, 각도가 벗어나면 짧아진다
  assert.ok(Math.abs(tuhoRange(45, 100) - 1) < 1e-9);
  assert.ok(tuhoRange(70, 100) < tuhoRange(45, 100));
  assert.equal(tuhoLanding(0.6, 0.6, 0.06), 'mouth');
  assert.equal(tuhoLanding(0.65, 0.6, 0.06), 'ear');
  assert.equal(tuhoLanding(0.5, 0.6, 0.06), 'short');
  assert.equal(tuhoLanding(0.7, 0.6, 0.06), 'long');
});
