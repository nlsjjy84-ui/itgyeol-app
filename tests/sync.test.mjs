// 서버 목록과 이 기기 목록 합치기, 토스 결제 주소 읽기
import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeOrders, mergeExhibit, mineOnly, tossOrderId, readPayReturn } from '../src/utils/sync.js';

const o = (no, at, extra = {}) => ({ no, log: [{ stage: 'paid', at }], ...extra });

test('주문: 서버 것이 기준, 못 보낸 것(local)은 남긴다', () => {
  const local = [o('A', 1, { stage: 'sent' }), o('B', 3, { local: true }), o('C', 2)];
  const remote = [o('A', 1, { stage: 'making' })];
  const m = mergeOrders(local, remote);
  assert.deepEqual(m.map((x) => x.no), ['A', 'B']);
  assert.equal(m[0].stage, 'making');
});

test('전시: 서버가 기준, 아직 못 보낸 코드는 이 기기 값', () => {
  const remote = [{ code: 'x', at: 1, status: 'waiting' }, { code: 'y', at: 2 }];
  const local = [{ code: 'x', at: 1, status: 'showing' }, { code: 'z', at: 3 }];
  const m = mergeExhibit(local, remote, new Set(['x', 'z', 'y']));
  assert.deepEqual(m.map((e) => e.code), ['x', 'z']);
  assert.equal(m[0].status, 'showing');
  assert.deepEqual(mergeExhibit(local, remote).map((e) => e.code), ['x', 'y']);
});

test('내 신청만 고르기', () => {
  assert.deepEqual(mineOnly([{ code: 'a' }, { code: 'b' }], ['b']).map((e) => e.code), ['b']);
  assert.deepEqual(mineOnly(null, null), []);
});

test('토스 주문 번호는 6~64자, 영문·숫자·-', () => {
  const id = tossOrderId('ITG-AB12CD-3');
  assert.match(id, /^ITG-AB12CD-3-[a-z0-9]{6}$/);
  assert.ok(id.length >= 6 && id.length <= 64);
});

test('결제사에서 돌아온 주소 읽기', () => {
  assert.deepEqual(readPayReturn('?pay=ok&paymentKey=pk&orderId=o1&amount=19000'), { ok: true, paymentKey: 'pk', orderId: 'o1', amount: 19000 });
  assert.equal(readPayReturn('?pay=fail&code=PAY_PROCESS_CANCELED&message=x').ok, false);
  assert.equal(readPayReturn(''), null);
  assert.equal(readPayReturn('?pay=ok'), null);
});
