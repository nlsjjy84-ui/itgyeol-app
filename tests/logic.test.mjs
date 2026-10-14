// 잇결 순수 계산 테스트 — 화면 없이 node만으로 돈다(npm test).
// 배포(apply-and-publish.bat, GitHub Actions) 전에 먼저 돌고, 하나라도 실패하면 배포를 멈춘다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRICES, orderTotal, orderItems, orderNumber, comma, productKey } from '../src/utils/order.js';
import { nextExhibit, cleanExhibit } from '../src/utils/exhibit.js';
import { countWorks } from '../src/utils/works.js';
import { packJourney, unpackJourney, carryUrl, mergeAttempts, mergeLog, b64encode, b64decode, SITE_URL } from '../src/utils/carry.js';
import { buildAttemptResult } from '../src/utils/resultSeed.js';

const src = readFileSync(new URL('../src/data/mockWorks.js', import.meta.url), 'utf8');
const MOCK_WORKS = JSON.parse(src.match(/export const MOCK_WORKS = (\[.*?\]);\r?\n/s)[1]);

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

test('주문 합계 — 뮷즈 값대 기준(배지 15,000 · 키링 15,000 · 수막새 18,000 · 3D 모형 45,000 · 접부채 12,000 · 수건 15,000)', () => {
  assert.deepEqual(PRICES, {
    photo: 4000, badge: 15000, keyring: 15000, stamp: 20000, sumak: 18000, paperweight: 25000, coaster: 15000,
    bookmark: 12000, model: 45000, fan: 12000, towel: 15000, cup: 25000, spoonrest: 9000,
    hanky: 12000, scarf: 28000, pouch: 15000, postcard: 3000, frame: 18000,
  });
  assert.equal(orderTotal({}), 0);
  assert.equal(orderTotal({ photo: true }), 4000);
  assert.equal(orderTotal({ photo: true, model: true }), 49000);
  assert.equal(orderTotal({ photo: true, keyring: true, model: true }), 64000);
  assert.equal(orderTotal({ badge: true, sumak: true, fan: true }), 45000);
  assert.deepEqual(orderItems({ model: true, photo: true, badge: true }), ['photo', 'badge', 'model']);
  assert.equal(comma(64000), '64,000');
});

test('고른 물건 → 주문 항목', () => {
  assert.equal(productKey('badge', 'mybadge'), 'badge');
  assert.equal(productKey('keyring', 'mypae'), 'keyring');
  assert.equal(productKey('sumak', 'mysumak'), 'sumak');
  assert.equal(productKey('treasure', 'myjar'), 'model');
  assert.equal(productKey('daily', 'fan'), 'fan');
  assert.equal(productKey('daily', 'towel'), 'towel');
  assert.equal(productKey('stamp', 'mystamp'), 'stamp');
  assert.equal(productKey('desk', 'mystele'), 'paperweight');
  assert.equal(productKey('desk', 'mycoaster'), 'coaster');
  assert.equal(productKey('bookmark', 'mybookmark'), 'bookmark');
  assert.equal(productKey('daily', 'cup'), 'cup');
  assert.equal(productKey('daily', 'spoonrest'), 'spoonrest');
  assert.equal(productKey('daily', 'scarf'), 'scarf');
  assert.equal(productKey('daily', 'postcard'), 'postcard');
  assert.equal(productKey('nothing', 'x'), null);
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

import { mergeSenses, senseSummary } from '../src/utils/senseMath.js';

test('몸짓·표정·감탄사 기록은 더해지고, 요약은 0~1 세기와 횟수만 남긴다', () => {
  const a = { big: 2, levelSum: 3, levelN: 10, smile: 1, surprise: 0, burst: 2 };
  const b = { big: 1, levelSum: 1, levelN: 10, smile: 2, surprise: 1, burst: 0 };
  const m = mergeSenses(a, b);
  assert.deepEqual(m, { big: 3, levelSum: 4, levelN: 20, smile: 3, surprise: 1, burst: 2 });
  assert.equal(mergeSenses(null, null), null);
  const s = senseSummary(m);
  assert.equal(s.level, 0.2);
  assert.equal(s.smile, 3);
  assert.equal(s.wow, 3);
  assert.equal(s.camera, true);
  assert.equal(senseSummary(null), null);
});

test('QR로 옮겨도 몸짓·표정·감탄사 기록이 같이 간다(없으면 예전 QR과 같다)', () => {
  const senses = { big: 3, levelSum: 4, levelN: 20, smile: 3, surprise: 1, burst: 2 };
  const attempts = [{ sceneId: 'jinbeop', formationId: 'wonjin', mappingCode: 'x', ohangKey: 'mok', speed: 1, seed: 7 }];
  const back = unpackJourney(packJourney({ attempts, playLog: { byGame: {}, byScene: { jinbeop: 1 }, senses } }));
  assert.deepEqual(back.playLog.senses, senses);
  const old = unpackJourney(packJourney({ attempts, playLog: { byGame: {}, byScene: {} } }));
  assert.equal(old.playLog.senses, undefined);
  assert.deepEqual(mergeLog({ byGame: {}, byScene: {} }, { byGame: {}, byScene: {}, senses }).senses, senses);
});

import { makerSpec, SPEC } from '../src/utils/makerSpec.js';
import { ORDER_KEYS } from '../src/utils/order.js';

test('주문할 수 있는 물건은 모두 업체용 제작 사양서가 있고, 출력 파일 크기가 있으면 그 값을 쓴다', () => {
  ORDER_KEYS.filter((k) => k !== 'photo').forEach((k) => assert.ok(SPEC[k], `사양 없음: ${k}`));
  const txt = makerSpec({ product: 'stamp', title: '나만의 낙관 도장', variant: '내 기록으로 빚은 도장', code: 'ITG-1', mm: { x: 20.4, y: 20.4, z: 40.2 } });
  assert.match(txt, /20×20×40mm/);
  assert.match(txt, /좌우가 뒤집힌/);
  assert.match(makerSpec({ product: 'cup', title: '백자 잔' }), /3D 출력 아님/);
  assert.equal(makerSpec({ product: 'nothing', title: 'x' }), null);
});

// ── 결과물 주문: 결제(모의) → 업체 전달 → 제작 → 받기 ──
import { SHIP_FEE, payQuote, placeOrder, advance, cancel, cancelable, cleanOrders } from '../src/utils/orders.js';
import { wallQueue } from '../src/utils/exhibit.js';

test('결제 금액은 물건 합계 + 택배비(택배일 때만)', () => {
  assert.deepEqual(payQuote({ photo: true, keyring: true }, 'shop'), { items: ['photo', 'keyring'], goods: 19000, ship: 0, total: 19000 });
  assert.equal(payQuote({ keyring: true }, 'post').total, 15000 + SHIP_FEE);
  assert.equal(payQuote({}, 'post').total, 0);
});

test('동의 없이는 결제되지 않고, 결제하면 바로 업체에 전달된다', () => {
  assert.equal(placeOrder({ code: 'AB12CD34', pick: { badge: true }, how: 'shop', method: 'card', agreed: false }).error, 'NOT_AGREED');
  assert.equal(placeOrder({ code: 'AB12CD34', pick: {}, how: 'shop', method: 'card', agreed: true }).error, 'EMPTY');
  const { order } = placeOrder({ code: 'AB12CD34', pick: { badge: true }, how: 'post', method: 'easy', agreed: true, spec: '사양서', now: Date.UTC(2026, 9, 14, 3) });
  assert.equal(order.no, 'ITG-12CD34-1');
  assert.match(order.payRef, /^MOCK-2026101\d-/);
  assert.equal(order.stage, 'sent');
  assert.deepEqual(order.log.map((l) => l.stage), ['paid', 'sent']);
  assert.equal(order.total, 15000 + SHIP_FEE);
});

test('업체는 단계를 건너뛰지 못하고, 만들기 시작하면 취소할 수 없다', () => {
  const { order } = placeOrder({ code: 'X1', pick: { stamp: true }, how: 'shop', method: 'counter', agreed: true });
  assert.ok(cancelable(order));
  const making = advance(order);
  assert.equal(making.stage, 'making');
  assert.equal(cancel(making).error, 'ALREADY_MAKING');
  const ready = advance(making);
  assert.equal(ready.stage, 'ready');
  assert.equal(advance(ready), ready);
  const c = cancel(order).order;
  assert.equal(c.stage, 'canceled');
  assert.equal(c.refund, 20000);
  assert.equal(advance(c), c);
  assert.equal(cleanOrders([c, null, { no: 1 }]).length, 1);
});

test('전시 화면은 걸린 관람객 작품을 먼저, 남는 자리는 예시로 채운다', () => {
  const entries = [
    { code: 'a', at: 2, status: 'showing' },
    { code: 'b', at: 1, status: 'showing' },
    { code: 'c', at: 0 },
  ];
  const q = wallQueue(entries, [{ id: 'w1' }, { id: 'w2' }], 3);
  assert.deepEqual(q.map((x) => x.key), ['v-b', 'v-a', 'm-w1']);
  assert.equal(wallQueue([], [{ id: 'w1' }]).length, 1);
});

test('주문에 붙는 사양서의 주문 번호는 이 주문 번호로 바뀐다', () => {
  const { order } = placeOrder({ code: 'ZZ99', pick: { keyring: true }, how: 'shop', method: 'card', agreed: true, spec: '잇결 제작 사양서\n주문 번호: ITGYEOL-JH-ZZ99\n물건: 키링' , seq: 2 });
  assert.match(order.spec, /주문 번호: ITG-ZZ99-2/);
  assert.doesNotMatch(order.spec, /ITGYEOL-JH/);
});
