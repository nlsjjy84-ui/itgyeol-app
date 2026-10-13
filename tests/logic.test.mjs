// 잇결 순수 계산 테스트 — 화면 없이 node만으로 돈다(npm test).
// 배포(apply-and-publish.bat, GitHub Actions) 전에 먼저 돌고, 하나라도 실패하면 배포를 멈춘다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRICES, orderTotal, orderItems, orderNumber, comma } from '../src/utils/order.js';
import { nextExhibit, cleanExhibit } from '../src/utils/exhibit.js';
import { countWorks } from '../src/utils/works.js';
import { packJourney, unpackJourney, carryUrl, mergeAttempts, mergeLog, b64encode, b64decode, SITE_URL } from '../src/utils/carry.js';
import { buildAttemptResult } from '../src/utils/resultSeed.js';

const src = readFileSync(new URL('../src/data/mockWorks.js', import.meta.url), 'utf8');
const MOCK_WORKS = JSON.parse(src.match(/export const MOCK_WORKS = (\[.*?\]);\n/s)[1]);

test('예시 작품 450점은 서로 하나도 겹치지 않는다', () => {
  const r = countWorks(MOCK_WORKS);
  assert.equal(r.total, 450);
  assert.equal(r.same, 0);
  assert.equal(Object.values(r.byGroup).reduce((a, b) => a + b, 0), 450);
});

test('같은 작품이 두 번 들어가면 "똑같은 작품"으로 센다', () => {
  const r = countWorks([MOCK_WORKS[0], MOCK_WORKS[0], MOCK_WORKS[1]]);
  assert.equal(r.same, 1);
});

test('놀이 기록이 조금만 달라도 시드가 달라진다 (같은 기록이면 같다)', () => {
  const base = { sceneId: 'tbd', formationId: 'julneomgi', mapping: { 0: 5 }, slotCount: 1, ohangKey: 'hwa', elapsedMs: 20000 };
  const a = buildAttemptResult(base);
  const b = buildAttemptResult(base);
  const c = buildAttemptResult({ ...base, ohangKey: 'su' });
  const d = buildAttemptResult({ ...base, mapping: { 0: 6 } });
  assert.equal(a.seed, b.seed);
  assert.notEqual(a.seed, c.seed);
  assert.notEqual(a.seed, d.seed);
});

test('주문 합계 — 사다리 가격(사진 4,000 · 키링 15,000 · 3D 모형 45,000)', () => {
  assert.deepEqual(PRICES, { photo: 4000, keyring: 15000, model: 45000 });
  assert.equal(orderTotal({}), 0);
  assert.equal(orderTotal({ photo: true }), 4000);
  assert.equal(orderTotal({ photo: true, model: true }), 49000);
  assert.equal(orderTotal({ photo: true, keyring: true, model: true }), 64000);
  assert.deepEqual(orderItems({ model: true, photo: true }), ['photo', 'model']);
  assert.equal(comma(64000), '64,000');
});

test('주문 번호는 같은 작품이면 같고, 비어 있어도 깨지지 않는다', () => {
  assert.equal(orderNumber('ITGYEOL-ABC-Y7OQ8H'), 'ITG-Y7OQ8H');
  assert.equal(orderNumber('ITGYEOL-ABC-Y7OQ8H'), orderNumber('ITGYEOL-ABC-Y7OQ8H'));
  assert.equal(orderNumber(''), 'ITG-000000');
});

test('전시 신청 — 올리기·고치기·내리기, 별명 10자, 처음 시각 유지', () => {
  let ex = nextExhibit([], 'A', { nick: '풍물소녀', country: '한국', attempts: [] }, 100);
  assert.equal(ex.length, 1);
  assert.equal(ex[0].at, 100);
  ex = nextExhibit(ex, 'A', { country: '일본' }, 200);
  assert.equal(ex.length, 1);
  assert.equal(ex[0].country, '일본');
  assert.equal(ex[0].nick, '풍물소녀');
  assert.equal(ex[0].at, 100);
  ex = nextExhibit(ex, 'B', { nick: '열두글자가넘는아주긴별명이에요' }, 300);
  assert.equal(ex.find((e) => e.code === 'B').nick.length, 10);
  ex = nextExhibit(ex, 'A', null);
  assert.deepEqual(ex.map((e) => e.code), ['B']);
});

test('전시 저장값이 깨져 있으면 버린다', () => {
  assert.deepEqual(cleanExhibit(null), []);
  assert.deepEqual(cleanExhibit(['OLD-CODE', { code: 'X' }, null]), [{ code: 'X' }]);
});

test('QR 주소에 담은 기록이 집에서 그대로 돌아온다', () => {
  const attempts = [
    buildAttemptResult({ sceneId: 'jinbeop', formationId: 'hakik', mapping: { 0: 1, 1: 0 }, slotCount: 2, ohangKey: 'mok', elapsedMs: 9000 }),
    buildAttemptResult({ sceneId: 'tbd', formationId: 'julneomgi', mapping: { 0: 5 }, slotCount: 1, ohangKey: 'hwa', elapsedMs: 30000 }),
  ];
  const playLog = { byGame: { julneomgi: 3 }, byScene: { tbd: 3, jinbeop: 1 } };
  const back = unpackJourney(packJourney({ attempts, playLog }));
  assert.equal(back.attempts.length, 2);
  back.attempts.forEach((a, i) => {
    for (const k of ['sceneId', 'formationId', 'mappingCode', 'ohangKey', 'speed', 'seed']) assert.equal(a[k], attempts[i][k], k);
  });
  assert.deepEqual(back.playLog, playLog);
  const url = carryUrl({ attempts, playLog });
  assert.ok(url.startsWith(`${SITE_URL}?w=`));
  assert.match(url.slice(SITE_URL.length), /^\?w=[A-Za-z0-9_-]+$/);
  assert.ok(url.length < 1000, `QR에 담기 좋은 길이여야 함: ${url.length}`);
});

test('이상한 QR 값은 무시한다', () => {
  assert.equal(unpackJourney('!!!'), null);
  assert.equal(unpackJourney(b64encode('{"v":2}')), null);
  assert.equal(unpackJourney(''), null);
  const r = unpackJourney(b64encode(JSON.stringify({ v: 1, a: [['tbd', 'x', '0', 'hwa', 'mid', 'NaN'], ['jinbeop', 'y', '1', 'su', 'fast', 7]], p: [{ x: 'a' }, {}] })));
  assert.equal(r.attempts.length, 1);
  assert.deepEqual(r.playLog.byGame, {});
});

test('base64 왕복 — 한글도 깨지지 않는다', () => {
  for (const s of ['', 'a', 'ab', 'abc', '잇결 전시관', '{"v":1}']) assert.equal(b64decode(b64encode(s)), s);
});

test('가져온 기록 합치기 — 같은 판은 가져온 것으로, 놀이 횟수는 큰 쪽', () => {
  const cur = [{ sceneId: 'tbd', seed: 1 }, { sceneId: 'print', seed: 2 }];
  const inc = [{ sceneId: 'tbd', seed: 9 }, { sceneId: 'jinbeop', seed: 3 }];
  const m = mergeAttempts(cur, inc);
  assert.deepEqual(m.map((a) => `${a.sceneId}:${a.seed}`).sort(), ['jinbeop:3', 'print:2', 'tbd:9']);
  assert.deepEqual(mergeLog({ byGame: { a: 2 }, byScene: { tbd: 5 } }, { byGame: { a: 1, b: 4 }, byScene: { tbd: 7 } }), { byGame: { a: 2, b: 4 }, byScene: { tbd: 7 } });
});
