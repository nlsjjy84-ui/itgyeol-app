// 탈춤·단청 판 계산 테스트 — 화면 없이 node만으로 돈다(npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judgeTap, scoreDance, passed } from '../src/utils/talchumLogic.js';
import { initState, apply, stepDone, cellAt, lineAt, GACHIL, TABUN } from '../src/utils/dancheongLogic.js';

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
