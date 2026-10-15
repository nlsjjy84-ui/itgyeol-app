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
  list: async ({ cursor }) => (cursor ? { blobs: [blobs[2]], hasMore: false } : { blobs: blobs.slice(0, 2), hasMore: true, cursor: 'c1' }),
  del: async (urls) => { deleted = deleted.concat(urls); },
});
assert.equal(n, 2);
assert.deepEqual(deleted.sort(), ['old1', 'old2']);
console.log('gift storage tests: all passed');
