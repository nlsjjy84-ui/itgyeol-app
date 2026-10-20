// 황동 에칭 도안(.svg): 단위 mm, 자르는 선과 새김이 나뉘고, 크기가 계획과 맞는지
import test from 'node:test';
import assert from 'node:assert/strict';
import { planToSvg } from '../src/utils/etchSvg.js';

test('에칭 도안: mm 크기 · 자르기(파란 가는 선) · 새김(검은 채움)', () => {
  const sq = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const plan = { mmPerUnit: 10, outline: sq(0, 0, 3, 12), holes: [sq(1.4, 11, 1.6, 11.2)], etch: [[1.5, 1, 2, 0.08]] };
  const svg = planToSvg(plan);
  assert.match(svg, /width="30\.00mm" height="120\.00mm"/);
  assert.match(svg, /stroke="#0000FF" stroke-width="0\.01"/);
  assert.match(svg, /<g id="etch" fill="#000000"/);
  assert.equal((svg.match(/<rect /g) || []).length, 1);
  assert.equal((svg.match(/ Z/g) || []).length, 2); // 윤곽 + 구멍 1개
});
