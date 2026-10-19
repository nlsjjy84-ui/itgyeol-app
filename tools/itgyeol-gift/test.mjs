// node test.mjs — Vercel 없이 저장소 동작을 가짜 Blob으로 확인
import assert from 'node:assert/strict';
import { handlePost, OPTIONS } from './api/gift.js';
import { removeOld, newId, DAY_MS } from './api/_lib.js';

const store = [];
const fakePut = async (path, body, opt) => {
  assert.equal(opt.access, 'public');
  const b = { url: `https://x.public.blob.vercel-storage.com/${path}`, uploadedAt: new Date().toISOString(), size: body.byteLength };
  store.push(b);
  return b;
};
const req = (type, bytes) => new Request('https://g.vercel.app/gift', { method: 'POST', headers: { 'content-type': type }, body: new Uint8Array(bytes) });

const ok = await handlePost(req('image/jpeg', 1000), { put: fakePut, removeOld: async () => 0 });
assert.equal(ok.status, 200);
const j = await ok.json();
assert.match(j.url, /gifts\/[0-9a-f]{36}\.jpg$/);
assert.equal(ok.headers.get('access-control-allow-origin'), 'https://nlsjjy84-ui.github.io');
assert.equal((await handlePost(req('image/png', 10), { put: fakePut, removeOld: async () => 0 })).status, 415);
assert.equal((await handlePost(req('image/jpeg', 3 * 1024 * 1024 + 1), { put: fakePut, removeOld: async () => 0 })).status, 413);
assert.equal(OPTIONS().status, 204);
assert.equal(newId().length, 36);

const now = Date.now();
const blobs = [
  { url: 'old1', uploadedAt: new Date(now - DAY_MS - 1000).toISOString() },
  { url: 'new1', uploadedAt: new Date(now - 1000).toISOString() },
  { url: 'old2', uploadedAt: new Date(now - 3 * DAY_MS).toISOString() },
];
let deleted = [];
const n = await removeOld(now, {
  list: async ({ prefix, cursor }) => (prefix !== 'gifts/' ? { blobs: [], hasMore: false } : cursor ? { blobs: [blobs[2]], hasMore: false } : { blobs: blobs.slice(0, 2), hasMore: true, cursor: 'c1' }),
  del: async (urls) => { deleted = deleted.concat(urls); },
});
assert.equal(n, 2);
assert.deepEqual(deleted.sort(), ['old1', 'old2']);
console.log('gift storage tests: all passed');

// ── 주문 · 전시 · 토스 결제 (가짜 Blob) ──
const { handle: orders } = await import('./api/orders.js');
const { handle: exhibit } = await import('./api/exhibit.js');
const { handle: pay } = await import('./api/pay.js');
const { PRICES } = await import('./api/_shop.js');
const app = await import('../../src/utils/order.js');
assert.deepEqual(PRICES, app.PRICES, '서버 가격표가 앱 가격표와 같아야 한다');

function fakeDb() {
  const files = new Map();
  let t = 0;
  return {
    files,
    put: async (path, body, opt) => {
      assert.equal(opt.addRandomSuffix, true);
      const pathname = path.replace('--x.json', `--${(++t).toString(36)}r.json`);
      files.set(pathname, { pathname, url: `u:${pathname}`, uploadedAt: new Date(Date.now() + t).toISOString(), body });
    },
    list: async ({ prefix }) => ({ blobs: [...files.values()].filter((f) => f.pathname.startsWith(prefix)), hasMore: false }),
    del: async (urls) => { for (const u of [].concat(urls)) files.delete(u.slice(2)); },
    get: async (url) => JSON.parse(files.get(url.slice(2)).body),
  };
}
const J = (method, body) => new Request('https://g.vercel.app/api/x', { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
const db = fakeDb();
const draft = { no: 'ITG-AB12CD-1', code: 'AB12CD', items: [{ key: 'keyring', price: 1 }, { key: 'photo' }], how: 'post', method: 'card' };

// 모의 결제 주문: 금액은 서버가 다시 계산(앱이 보낸 가격 1원은 무시)
let r = await (await orders(J('POST', { order: draft }), { db })).json();
assert.equal(r.order.total, PRICES.keyring + PRICES.photo + 3500);
assert.match(r.order.payRef, /^MOCK-/);
assert.equal((await orders(J('POST', { order: draft }), { db })).status, 409);
assert.equal((await orders(J('POST', { order: { ...draft, items: [{ key: 'gold' }] } }), { db })).status, 400);
// 다른 기기(업체)가 읽고 단계를 넘긴다
r = await (await orders(J('GET'), { db })).json();
assert.equal(r.orders.length, 1);
r = await (await orders(J('PATCH', { no: draft.no, action: 'advance' }), { db })).json();
assert.equal(r.order.stage, 'making');
assert.equal(db.files.size, 1, '고칠 때 예전 판은 지운다');
assert.equal((await orders(J('PATCH', { no: draft.no, action: 'cancel' }), { db })).status, 409, '만들기 시작하면 취소 안 됨');

// 전시: 손님 기기에서 신청 → 큰 화면에서 걸기 → 내리기
await exhibit(J('POST', { code: 'AB12CD', entry: { nick: '열한글자넘는별명입니다', country: '한국', attempts: [{ sceneId: 'x' }] } }), { db });
await exhibit(J('POST', { code: 'AB12CD', entry: { nick: '풍이', country: '한국', status: 'showing', at: 5 } }), { db });
r = await (await exhibit(J('GET'), { db })).json();
assert.equal(r.entries.length, 1);
assert.equal(r.entries[0].status, 'showing');
assert.equal(r.entries[0].nick, '풍이');
await exhibit(J('POST', { code: 'AB12CD', entry: null }), { db });
r = await (await exhibit(J('GET'), { db })).json();
assert.equal(r.entries.length, 0);
assert.equal((await exhibit(J('POST', { code: '../x', entry: {} }), { db })).status, 400);

// 토스: 테스트 키가 아니면 꺼져 있음
r = await (await pay(J('GET'), { env: { TOSS_CLIENT_KEY: 'live_ck_x', TOSS_SECRET_KEY: 'live_sk_x' } })).json();
assert.equal(r.clientKey, null);
const env = { TOSS_CLIENT_KEY: 'test_ck_abc', TOSS_SECRET_KEY: 'test_sk_abc' };
r = await (await pay(J('GET'), { env })).json();
assert.equal(r.clientKey, 'test_ck_abc');
const d2 = { ...draft, no: 'ITG-AB12CD-2', how: 'shop' };
const want = PRICES.keyring + PRICES.photo;
let called = 0;
const confirm = async (p) => { called++; assert.equal(p.amount, want); return { ok: true, data: { method: '간편결제', status: 'DONE' } }; };
assert.equal((await pay(J('POST', { paymentKey: 'pk', orderId: 'ITG-AB12CD-2-z', amount: want - 1, draft: d2 }), { db, env, confirm })).status, 400, '금액이 다르면 승인 요청 안 함');
assert.equal(called, 0);
r = await (await pay(J('POST', { paymentKey: 'pk', orderId: 'ITG-AB12CD-2-z', amount: want, draft: d2 }), { db, env, confirm })).json();
assert.equal(r.order.method, 'easy');
assert.equal(r.order.payRef, 'TOSS-ITG-AB12CD-2-z');
assert.equal(r.order.payKey, undefined, '결제 키는 밖으로 내보내지 않는다');
// 토스 주문 취소 → 결제사 환불
let refunded = '';
r = await (await orders(J('PATCH', { no: d2.no, action: 'cancel' }), { db, tossCancel: async (k) => { refunded = k; return { ok: true, ref: 'tx1' }; } })).json();
assert.equal(r.order.stage, 'canceled');
assert.equal(refunded, 'pk');
console.log('orders / exhibit / toss tests: all passed');
